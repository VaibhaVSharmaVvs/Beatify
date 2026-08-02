import random
import re

import requests
from fastapi import APIRouter, Header, HTTPException, Request
from rapidfuzz import fuzz

import db as db_module
from identity import bearer_token, identify
from models import GuessSubmission, SaveSessionRequest
from ratelimit import limiter

router = APIRouter()

SPOTIFY_API = "https://api.spotify.com/v1"
REQUEST_TIMEOUT = 15
PAGE_SIZE = 50
# Safety valve on /playlists pagination: 20 pages covers 1000 playlists, well
# past any real library, and bounds the worst-case request duration.
MAX_PLAYLIST_PAGES = 20


def get_spotify_headers(token: str):
    return {"Authorization": f"Bearer {token}"}


def _slim_track(track: dict) -> dict:
    """Reduce a Spotify track object to the fields the game actually uses.

    A raw track is 5–10 KB of JSON. Game state is now persisted to Postgres on
    every round, so storing ten raw tracks would mean writing ~100 KB per guess
    for the handful of fields below.
    """
    album = track.get("album") or {}
    images = album.get("images") or []
    return {
        "id": track.get("id"),
        "name": track.get("name") or "",
        "uri": track.get("uri") or "",
        "preview_url": track.get("preview_url"),
        "artists": [a.get("name") or "" for a in (track.get("artists") or [])],
        "album_name": album.get("name") or "",
        "album_image": images[0].get("url") if images else None,
        "release_year": (album.get("release_date") or "")[:4],
    }


def _round_payload(game: dict) -> dict:
    if game["current_round"] >= game["total_rounds"]:
        return {
            "game_over": True,
            "final_score": game["score"],
            "history": game["history"],
        }

    track = game["tracks"][game["current_round"]]
    return {
        "round": game["current_round"] + 1,
        "preview_url": track.get("preview_url"),  # Keep for fallback if needed
        "uri": track["uri"],
        "image_url": track.get("album_image"),
        "game_over": False,
    }


def _require_game(spotify_id: str) -> dict:
    game = db_module.load_active_game(spotify_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


@router.get("/me")
@limiter.limit("30/minute")
def get_user_profile(request: Request, authorization: str = Header(None)):
    token = bearer_token(authorization)

    response = requests.get(
        f"{SPOTIFY_API}/me",
        headers=get_spotify_headers(token),
        timeout=REQUEST_TIMEOUT,
    )
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="Failed to fetch user profile")

    return response.json()


@router.get("/playlists")
@limiter.limit("20/minute")
def get_playlists(request: Request, authorization: str = Header(None)):
    token = bearer_token(authorization)
    headers = get_spotify_headers(token)

    # Spotify caps each page at 50; follow the `next` cursor so users with more
    # than 50 playlists still see all of them.
    all_items = []
    url = f"{SPOTIFY_API}/me/playlists?limit={PAGE_SIZE}"
    pages = 0
    while url and pages < MAX_PLAYLIST_PAGES:
        response = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch playlists")
        data = response.json()
        all_items.extend(data.get("items", []))
        url = data.get("next")
        pages += 1

    return {"items": all_items, "total": len(all_items)}


@router.post("/start_game")
@limiter.limit("10/minute")
def start_game(
    request: Request,
    playlist_id: str,
    rounds: int = 10,
    artist: bool = True,
    album: bool = True,
    year: bool = False,
    authorization: str = Header(None),
):
    token, spotify_id = identify(authorization)

    # Bound the round count: `rounds` is client-supplied and feeds
    # random.sample() plus a Spotify fetch loop.
    rounds = max(1, min(rounds, 50))

    headers = get_spotify_headers(token)

    # First get total tracks
    tracks_url = f"{SPOTIFY_API}/playlists/{playlist_id}/tracks?limit=1"
    response = requests.get(tracks_url, headers=headers, timeout=REQUEST_TIMEOUT)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="Failed to fetch playlist data")

    total_tracks = response.json().get("total", 0)
    if total_tracks < 1:
        raise HTTPException(status_code=400, detail="Playlist must have at least 1 track")

    sample_size = min(rounds, total_tracks)

    # Pick random absolute indices across the entire massive playlist!
    selected_indices = random.sample(range(total_tracks), sample_size)

    pages_needed: dict[int, list[int]] = {}

    # Map raw indices to their respective 50-track bucket page
    for idx in selected_indices:
        page_offset = (idx // PAGE_SIZE) * PAGE_SIZE
        pages_needed.setdefault(page_offset, []).append(idx)

    all_tracks = []

    # Fetch ONLY the pages that contain our selected random tracks
    for offset, indices_in_page in pages_needed.items():
        url = f"{SPOTIFY_API}/playlists/{playlist_id}/tracks?limit={PAGE_SIZE}&offset={offset}"
        res = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
        if res.status_code == 401:
            raise HTTPException(status_code=401, detail="Token Expired")
        data = res.json()
        items = data.get("items", [])

        for idx in indices_in_page:
            local_idx = idx - offset
            if local_idx < len(items):
                track = (items[local_idx] or {}).get("track")
                # Ensure the track is valid (some extremely old playlists have null tracks)
                if track and track.get("id"):
                    all_tracks.append(_slim_track(track))

    if not all_tracks:
        raise HTTPException(status_code=400, detail="No playable tracks found in this playlist")

    random.shuffle(all_tracks)
    selected_tracks = all_tracks[:sample_size]

    game = {
        "tracks": selected_tracks,
        "current_round": 0,
        "score": 0,
        "history": [],
        "total_rounds": len(selected_tracks),
        "settings": {
            "artist": artist,
            "album": album,
            "year": year,
        },
        "max_score_per_round": 5 + (2 if artist else 0) + (3 if album else 0) + (2 if year else 0),
    }

    db_module.save_active_game(spotify_id, game)
    db_module.purge_stale_active_games()

    return _round_payload(game)


def sanitize(text: str) -> str:
    # Remove anything in parenthesis or brackets
    cleaned = re.sub(r'\(.*?\)|\[.*?\]', '', text or '')
    # Replace non-alphanumeric characters (like commas) with spaces
    cleaned = re.sub(r'[^\w\s]', ' ', cleaned)
    # Collapse multiple spaces into one and lower case
    cleaned = re.sub(r'\s+', ' ', cleaned).strip().lower()
    return cleaned


@router.post("/submit_guess")
@limiter.limit("60/minute")
def submit_guess(
    request: Request,
    guess: GuessSubmission,
    authorization: str = Header(None),
):
    _, spotify_id = identify(authorization)
    game = _require_game(spotify_id)

    # Guard against a guess arriving after the final round (avoids an IndexError -> 500)
    if game["current_round"] >= game["total_rounds"]:
        raise HTTPException(status_code=400, detail="No active round to guess")

    current_track = game["tracks"][game["current_round"]]

    # Scoring
    points = 0
    THRESHOLD = 90

    field_scores = {
        "name": False,
        "artist": False,
        "album": False,
        "year": False
    }

    clean_correct_name = sanitize(current_track["name"])
    clean_correct_album = sanitize(current_track["album_name"])

    clean_guess_name = sanitize(guess.guess_name)
    clean_guess_artist = sanitize(guess.guess_artist)
    clean_guess_album = sanitize(guess.guess_album)
    clean_guess_year = sanitize(guess.guess_year)

    # Check Name
    name_score = fuzz.token_set_ratio(clean_guess_name, clean_correct_name)
    if name_score >= THRESHOLD:
        points += 5
        field_scores["name"] = True

    # Helper to check if an artist exists in the user's input with typo tolerance
    artist_guesses = [sanitize(g) for g in (guess.guess_artist or '').split(',')]

    def check_artist_match(target_name: str) -> bool:
        clean_target = sanitize(target_name)
        # 1. Global token match (for exact names hidden in a string without commas)
        if fuzz.token_set_ratio(clean_guess_artist, clean_target) >= THRESHOLD:
            return True
        # 2. Direct match against comma-separated chunks (far better for typos like "beiber" vs "bieber")
        for g in artist_guesses:
            if g and fuzz.ratio(g, clean_target) >= 80:
                return True
        return False

    # Check Artist
    artists = current_track["artists"]
    if game["settings"]["artist"] and len(artists) > 0:
        # Award 2 points for the Primary Artist
        if check_artist_match(artists[0]):
            points += 2
            field_scores["artist"] = True

        # Award 1 point for EVERY additional Feature Artist
        for feature in artists[1:]:
            if check_artist_match(feature):
                points += 1

    # Check Album
    if game["settings"]["album"]:
        album_score = fuzz.token_set_ratio(clean_guess_album, clean_correct_album)

        # Special rule: Spotify duplicates song name as album name for singles
        is_single = (clean_correct_name == clean_correct_album)

        if album_score >= THRESHOLD:
            points += 3
            field_scores["album"] = True
        elif is_single and clean_guess_album in ["single", "no album", "none", "n a", "single release"]:
            points += 3
            field_scores["album"] = True

    # Check Year
    if game["settings"]["year"]:
        correct_year = current_track["release_year"]
        if clean_guess_year and clean_guess_year == sanitize(correct_year):
            points += 2
            field_scores["year"] = True

    game["score"] += points

    result = {
        "correct_name": current_track["name"],
        "correct_artist": ", ".join(artists),
        "correct_album": current_track["album_name"],
        "correct_year": current_track["release_year"],
        "image_url": current_track.get("album_image"),
        "points_earned": points,
        "total_score": game["score"],
        "max_score_per_round": game["max_score_per_round"],
        "field_scores": field_scores
    }

    game["history"].append(result)
    game["current_round"] += 1
    db_module.save_active_game(spotify_id, game)

    return result


@router.get("/next_round")
@limiter.limit("60/minute")
def next_round(request: Request, authorization: str = Header(None)):
    _, spotify_id = identify(authorization)
    return _round_payload(_require_game(spotify_id))


@router.post("/save_session")
@limiter.limit("20/minute")
def save_session(
    request: Request,
    data: SaveSessionRequest,
    authorization: str = Header(None),
):
    # Identity comes from the verified access token, never from the request
    # body — otherwise a caller could write history under someone else's id.
    _, spotify_id = identify(authorization)

    try:
        session_id = db_module.save_game_session(spotify_id, {
            "total_rounds": data.total_rounds,
            "total_score": data.total_score,
            "max_score": data.max_score,
            "difficulty": data.difficulty,
            "playlist_name": data.playlist_name,
        })
        db_module.save_round_results(session_id, spotify_id, [r.model_dump() for r in data.rounds])
    except Exception as e:
        print(f"[save_session] error: {e}")
        raise HTTPException(status_code=500, detail="Failed to save session")

    # The game is finished and persisted; drop the working copy.
    db_module.delete_active_game(spotify_id)
    return {"ok": True}


@router.get("/stats")
@limiter.limit("30/minute")
def get_stats(request: Request, authorization: str = Header(None)):
    """Career stats for the authenticated player.

    The browser used to call the Supabase RPC directly with the anon key and an
    arbitrary spotify_id. Routing it through here means the id is the caller's
    own verified identity, and the anon key no longer needs to reach the client.
    """
    _, spotify_id = identify(authorization)
    try:
        return db_module.get_player_stats(spotify_id)
    except Exception as e:
        print(f"[stats] error: {e}")
        raise HTTPException(status_code=500, detail="Failed to load stats")
