import os
import requests
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")
FRONTEND_URL = os.getenv("FRONTEND_URL")

AUTH_URL = "https://accounts.spotify.com/authorize"
TOKEN_URL = "https://accounts.spotify.com/api/token"

@router.get("/login")
def login():
    scope = "user-read-private user-read-email playlist-read-private playlist-read-collaborative streaming user-read-playback-state user-modify-playback-state"
    params = {
        "client_id": SPOTIFY_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": REDIRECT_URI,
        "scope": scope,
        "show_dialog": "true"
    }
    url = f"{AUTH_URL}?{'&'.join([f'{k}={v}' for k, v in params.items()])}"
    return RedirectResponse(url)

@router.get("/callback")
def callback(code: str):
    payload = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,
        "client_id": SPOTIFY_CLIENT_ID,
        "client_secret": SPOTIFY_CLIENT_SECRET,
    }
    response = requests.post(TOKEN_URL, data=payload)
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to retrieve token")
    
    token_data = response.json()
    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")
    
    # Redirect to frontend with tokens
    return RedirectResponse(f"{FRONTEND_URL}/login?access_token={access_token}&refresh_token={refresh_token}")

@router.get("/refresh")
def refresh_token(refresh_token: str):
    payload = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id": SPOTIFY_CLIENT_ID,
        "client_secret": SPOTIFY_CLIENT_SECRET,
    }
    response = requests.post(TOKEN_URL, data=payload)
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to refresh token")
    
    return response.json()
