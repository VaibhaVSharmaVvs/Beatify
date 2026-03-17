import random
from fastapi import APIRouter, HTTPException, Header
from typing import List, Optional
import requests
from rapidfuzz import fuzz
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
def start_game(playlist_id: str, rounds: int = 10, authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ")[1]
    
    headers = get_spotify_headers(token)
    
    # Fetch tracks
    tracks_url = f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks"
    all_tracks = []
    
    while tracks_url:
        response = requests.get(tracks_url, headers=headers)
        if response.status_code != 200:
            break
        data = response.json()
        for item in data.get("items", []):
            track = item.get("track")
            if track:
                all_tracks.append(track)
        tracks_url = data.get("next")
        if len(all_tracks) >= 50: # Limit to 50 for speed
            break
            
    print(f"Found {len(all_tracks)} tracks")
    if len(all_tracks) < 1:
        raise HTTPException(status_code=400, detail="Playlist must have at least 1 track")
        
    # Sample tracks based on requested rounds
    sample_size = min(rounds, len(all_tracks))
    selected_tracks = random.sample(all_tracks, sample_size)
    
    game_id = token[-10:] # Simple ID from token
    games[game_id] = {
        "tracks": selected_tracks,
        "current_round": 0,
        "score": 0,
        "history": [],
        "total_rounds": len(selected_tracks)
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
    
    # Fuzzy match threshold
    THRESHOLD = 90
    
    # Check Name
    name_score = fuzz.token_set_ratio(guess.guess_name.lower(), current_track["name"].lower())
    if name_score >= THRESHOLD:
        points += 5
        
    # Check Artist (check any artist)
    artist_match = False
    for artist in current_track["artists"]:
        if fuzz.token_set_ratio(guess.guess_artist.lower(), artist["name"].lower()) >= THRESHOLD:
            artist_match = True
            break
    if artist_match:
        points += 2
        
    # Check Album
    album_score = fuzz.token_set_ratio(guess.guess_album.lower(), current_track["album"]["name"].lower())
    if album_score >= THRESHOLD:
        points += 3
        
    game["score"] += points
    
    result = {
        "correct_name": current_track["name"],
        "correct_artist": ", ".join([a["name"] for a in current_track["artists"]]),
        "correct_album": current_track["album"]["name"],
        "image_url": current_track["album"]["images"][0]["url"] if current_track["album"]["images"] else None,
        "points_earned": points,
        "total_score": game["score"]
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
