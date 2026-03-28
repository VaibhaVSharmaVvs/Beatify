import random
from fastapi import APIRouter, HTTPException, Header
from typing import List, Optional
import requests
from rapidfuzz import fuzz
import re
from models import Track, GameState, GuessSubmission

router = APIRouter()

# In-memory storage for simplicity (per user session ideally, but global for now/demo)
# In a real app, use a database or Redis with session IDs.
# For this MVP, we'll just store one game state or pass it around.
# Actually, let's keep it stateless as much as possible or use a simple dict keyed by token (not secure but works for MVP)
games = {} 

def get_spotify_headers(token: str):
    return {"Authorization": f"Bearer {token}"}

@router.get("/playlists")
def get_playlists(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ")[1]
    
    headers = get_spotify_headers(token)
    response = requests.get("https://api.spotify.com/v1/me/playlists", headers=headers)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="Failed to fetch playlists")
    
    return response.json()

@router.post("/start_game")
def start_game(playlist_id: str, rounds: int = 10, artist: bool = True, album: bool = True, year: bool = False, authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ")[1]
    
    headers = get_spotify_headers(token)
    
    # First get total tracks
    tracks_url = f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks?limit=1"
    response = requests.get(tracks_url, headers=headers)
    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="Failed to fetch playlist data")
    
    total_tracks = response.json().get("total", 0)
    if total_tracks < 1:
        raise HTTPException(status_code=400, detail="Playlist must have at least 1 track")
        
    sample_size = min(rounds, total_tracks)
    
    # Pick random absolute indices across the entire massive playlist!
    selected_indices = random.sample(range(total_tracks), sample_size)
    
    # Spotify limit max is 50 for track fetching safely
    page_size = 50
    pages_needed = {}
    
    # Map raw indices to their respective 50-track bucket page
    for idx in selected_indices:
        page_offset = (idx // page_size) * page_size
        if page_offset not in pages_needed:
            pages_needed[page_offset] = []
        pages_needed[page_offset].append(idx)
        
    all_tracks = []
    
    # Fetch ONLY the pages that contain our selected random tracks
    for offset, indices_in_page in pages_needed.items():
        url = f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks?limit={page_size}&offset={offset}"
        res = requests.get(url, headers=headers)
        if res.status_code == 401:
            raise HTTPException(status_code=401, detail="Token Expired")
        data = res.json()
        items = data.get("items", [])
        
        for idx in indices_in_page:
            local_idx = idx - offset
            if local_idx < len(items):
                track = items[local_idx].get("track")
                # Ensure the track is valid (some extremely old playlists have null tracks)
                if track and track.get("id"):
                    all_tracks.append(track)
                    
    print(f"Randomly fetched {len(all_tracks)} distinct tracks out of {total_tracks} total!")
    
    random.shuffle(all_tracks)
    selected_tracks = all_tracks[:sample_size]
    
    game_id = token[-10:] # Simple ID from token
    games[game_id] = {
        "tracks": selected_tracks,
        "current_round": 0,
        "score": 0,
        "history": [],
        "total_rounds": len(selected_tracks),
        "settings": {
            "artist": artist,
            "album": album,
            "year": year
        },
        "max_score_per_round": 5 + (2 if artist else 0) + (3 if album else 0) + (2 if year else 0)
    }
    
    return get_round_data(game_id)

def get_round_data(game_id):
    game = games.get(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    if game["current_round"] >= game["total_rounds"]:
        return {"game_over": True, "final_score": game["score"], "history": game["history"]}
        
    track_data = game["tracks"][game["current_round"]]
    
    # Return limited data to frontend
    return {
        "round": game["current_round"] + 1,
        "preview_url": track_data.get("preview_url"), # Keep for fallback if needed
        "uri": track_data["uri"],
        "image_url": track_data["album"]["images"][0]["url"] if track_data.get("album") and track_data["album"].get("images") else None,
        "game_over": False
    }

@router.post("/submit_guess")
def submit_guess(guess: GuessSubmission, authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ")[1]
        
    game_id = token[-10:]
    game = games.get(game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
        
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
    
    def sanitize(text: str) -> str:
        # Remove anything in parenthesis or brackets
        cleaned = re.sub(r'\(.*?\)|\[.*?\]', '', text)
        # Replace non-alphanumeric characters (like commas) with spaces
        cleaned = re.sub(r'[^\w\s]', ' ', cleaned)
        # Collapse multiple spaces into one and lower case
        cleaned = re.sub(r'\s+', ' ', cleaned).strip().lower()
        return cleaned

    clean_correct_name = sanitize(current_track["name"])
    clean_correct_album = sanitize(current_track["album"]["name"])
    
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
    artist_guesses = [sanitize(g) for g in guess.guess_artist.split(',')]
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
    if game["settings"]["artist"] and len(current_track["artists"]) > 0:
        primary_artist = current_track["artists"][0]
        
        # Award 2 points for the Primary Artist
        if check_artist_match(primary_artist["name"]):
            points += 2
            field_scores["artist"] = True
            
        # Award 1 point for EVERY additional Feature Artist
        features = current_track["artists"][1:]
        for feature in features:
            if check_artist_match(feature["name"]):
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
        correct_year = str(current_track["album"].get("release_date", ""))[:4]
        if clean_guess_year and clean_guess_year == sanitize(correct_year):
            points += 2
            field_scores["year"] = True
        
    game["score"] += points
    
    result = {
        "correct_name": current_track["name"],
        "correct_artist": ", ".join([a["name"] for a in current_track["artists"]]),
        "correct_album": current_track["album"]["name"],
        "correct_year": current_track["album"].get("release_date", "")[:4],
        "image_url": current_track["album"]["images"][0]["url"] if current_track["album"]["images"] else None,
        "points_earned": points,
        "total_score": game["score"],
        "max_score_per_round": game["max_score_per_round"],
        "field_scores": field_scores
    }
    
    game["history"].append(result)
    game["current_round"] += 1
    
    return result

@router.get("/next_round")
def next_round(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ")[1]
    game_id = token[-10:]
    return get_round_data(game_id)
