import os
import time
import secrets
import requests
from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import db as db_module

load_dotenv()

router = APIRouter()

SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")
FRONTEND_URL = os.getenv("FRONTEND_URL")

AUTH_URL = "https://accounts.spotify.com/authorize"
TOKEN_URL = "https://accounts.spotify.com/api/token"

# CSRF protection for the OAuth flow: we hand Spotify a random `state` on /login
# and only accept a /callback whose state we issued. In-memory store with a TTL —
# consistent with the app's single-instance design (game state is in-memory too).
_STATE_TTL_SECONDS = 600
_pending_states: dict[str, float] = {}


def _remember_state(state: str) -> None:
    now = time.time()
    # Opportunistically prune expired states so the dict can't grow unbounded.
    for key in [k for k, ts in _pending_states.items() if now - ts > _STATE_TTL_SECONDS]:
        _pending_states.pop(key, None)
    _pending_states[state] = now


def _consume_state(state: str) -> bool:
    ts = _pending_states.pop(state, None)
    return ts is not None and (time.time() - ts) <= _STATE_TTL_SECONDS


class RefreshRequest(BaseModel):
    refresh_token: str


@router.get("/login")
def login():
    scope = "user-read-private user-read-email playlist-read-private playlist-read-collaborative streaming user-read-playback-state user-modify-playback-state"
    state = secrets.token_urlsafe(24)
    _remember_state(state)
    params = {
        "client_id": SPOTIFY_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": REDIRECT_URI,
        "scope": scope,
        "state": state,
        "show_dialog": "true"
    }
    url = f"{AUTH_URL}?{'&'.join([f'{k}={v}' for k, v in params.items()])}"
    return RedirectResponse(url)

@router.get("/callback")
def callback(code: str, state: str = ""):
    # Reject callbacks we didn't initiate (OAuth CSRF protection)
    if not _consume_state(state):
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth state")

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

    # Fetch the Spotify user profile to get a stable user ID
    spotify_id = ""
    display_name = ""
    try:
        profile_res = requests.get(
            "https://api.spotify.com/v1/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        if profile_res.status_code == 200:
            profile = profile_res.json()
            spotify_id = profile.get("id", "")
            display_name = profile.get("display_name", "")
            # Upsert into Supabase players table
            db_module.upsert_player(spotify_id, display_name)
    except Exception as e:
        print(f"[Auth] Failed to upsert player: {e}")

    # Deliver tokens in the URL fragment, not the query string: fragments are never
    # sent to servers (no access logs) and never leak via the Referer header.
    return RedirectResponse(
        f"{FRONTEND_URL}/login#access_token={access_token}&refresh_token={refresh_token}&spotify_id={spotify_id}"
    )

@router.post("/refresh")
def refresh_token(body: RefreshRequest):
    payload = {
        "grant_type": "refresh_token",
        "refresh_token": body.refresh_token,
        "client_id": SPOTIFY_CLIENT_ID,
        "client_secret": SPOTIFY_CLIENT_SECRET,
    }
    response = requests.post(TOKEN_URL, data=payload)
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to refresh token")

    return response.json()
