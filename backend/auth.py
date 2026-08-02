import base64
import hashlib
import hmac
import os
import secrets
import time
from urllib.parse import urlencode

import requests
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

import db as db_module
from ratelimit import limiter

load_dotenv()

router = APIRouter()

SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")
FRONTEND_URL = (os.getenv("FRONTEND_URL") or "").rstrip("/")

AUTH_URL = "https://accounts.spotify.com/authorize"
TOKEN_URL = "https://accounts.spotify.com/api/token"
REQUEST_TIMEOUT = 15

SCOPES = (
    "user-read-private user-read-email playlist-read-private "
    "playlist-read-collaborative streaming user-read-playback-state "
    "user-modify-playback-state"
)

# --------------------------------------------------------------------------
# OAuth CSRF state
#
# The `state` parameter is signed rather than stored. A server-side set of
# pending states cannot work here: the process is free to restart between
# /login and /callback (idle spin-down on free hosting does exactly this), and
# a second replica would never see the state the first one issued — both cases
# reject a perfectly legitimate login.
#
# A signed, self-describing token has neither problem. An attacker cannot forge
# one without SESSION_SECRET, which is all CSRF protection requires. It is
# replayable within its TTL, but Spotify only honours an authorization `code`
# once, so a replayed callback fails at the token exchange anyway.
# --------------------------------------------------------------------------

_STATE_TTL_SECONDS = 600

# Prefer a dedicated secret. Falling back to the Spotify client secret keeps
# existing deployments working without a new env var — it is already
# high-entropy and server-side — but a separate key is cleaner because it can
# be rotated independently of the OAuth credentials.
_SESSION_SECRET = (os.getenv("SESSION_SECRET") or SPOTIFY_CLIENT_SECRET or "").encode()


def _b64(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def _sign(payload: str) -> str:
    return _b64(hmac.new(_SESSION_SECRET, payload.encode(), hashlib.sha256).digest())


def _issue_state() -> str:
    if not _SESSION_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Server misconfigured: SESSION_SECRET (or SPOTIFY_CLIENT_SECRET) is unset",
        )
    payload = f"{secrets.token_urlsafe(16)}.{int(time.time()) + _STATE_TTL_SECONDS}"
    return f"{payload}.{_sign(payload)}"


def _verify_state(state: str) -> bool:
    if not state or not _SESSION_SECRET:
        return False
    try:
        nonce, expiry, signature = state.split(".")
    except ValueError:
        return False
    # Constant-time compare so the signature can't be recovered byte by byte.
    if not hmac.compare_digest(_sign(f"{nonce}.{expiry}"), signature):
        return False
    try:
        return int(expiry) >= int(time.time())
    except ValueError:
        return False


class RefreshRequest(BaseModel):
    refresh_token: str


@router.get("/login")
@limiter.limit("20/minute")
def login(request: Request):
    params = {
        "client_id": SPOTIFY_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": REDIRECT_URI,
        "scope": SCOPES,
        "state": _issue_state(),
        "show_dialog": "true",
    }
    # urlencode rather than manual f-string joining: the scope list contains
    # spaces and the redirect URI contains ':' and '/', all of which must be
    # percent-encoded for Spotify to parse the request.
    return RedirectResponse(f"{AUTH_URL}?{urlencode(params)}")


@router.get("/callback")
@limiter.limit("20/minute")
def callback(request: Request, code: str, state: str = ""):
    # Reject callbacks we didn't initiate (OAuth CSRF protection)
    if not _verify_state(state):
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth state")

    payload = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,
        "client_id": SPOTIFY_CLIENT_ID,
        "client_secret": SPOTIFY_CLIENT_SECRET,
    }
    response = requests.post(TOKEN_URL, data=payload, timeout=REQUEST_TIMEOUT)
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
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=REQUEST_TIMEOUT,
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
    fragment = urlencode({
        "access_token": access_token or "",
        "refresh_token": refresh_token or "",
        "spotify_id": spotify_id,
    })
    return RedirectResponse(f"{FRONTEND_URL}/login#{fragment}")


@router.post("/refresh")
@limiter.limit("30/minute")
def refresh_token(request: Request, body: RefreshRequest):
    payload = {
        "grant_type": "refresh_token",
        "refresh_token": body.refresh_token,
        "client_id": SPOTIFY_CLIENT_ID,
        "client_secret": SPOTIFY_CLIENT_SECRET,
    }
    response = requests.post(TOKEN_URL, data=payload, timeout=REQUEST_TIMEOUT)
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to refresh token")

    return response.json()
