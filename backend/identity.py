"""Resolve a Spotify access token to the user it belongs to.

Every route that touches per-user state derives the Spotify id here instead of
accepting one from the client. A client-supplied id is just a string: passing
someone else's would hand you their in-flight game or let you write history
under their name.

Spotify has no local token-introspection endpoint, so verification means
calling /v1/me. That is far too slow to do on every guess, hence the TTL cache
below. The cache is per-process and purely an optimisation — a cold start or a
second replica just re-verifies.
"""

import hashlib
import time

import requests
from fastapi import HTTPException

SPOTIFY_ME_URL = "https://api.spotify.com/v1/me"
_TTL_SECONDS = 900  # 15 min; access tokens live ~60 min
_MAX_ENTRIES = 5000
_REQUEST_TIMEOUT = 10

# sha256(token) -> (spotify_id, cached_at). Tokens are hashed rather than stored
# raw so a stray log line or memory dump doesn't leak usable credentials.
_cache: dict[str, tuple[str, float]] = {}


def _digest(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _prune(now: float) -> None:
    for key in [k for k, (_, ts) in _cache.items() if now - ts > _TTL_SECONDS]:
        _cache.pop(key, None)
    # Hard cap in case a burst of distinct tokens outpaces TTL expiry.
    if len(_cache) > _MAX_ENTRIES:
        _cache.clear()


def bearer_token(authorization: str | None) -> str:
    """Extract the token from an Authorization header, or raise 401."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")
    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer" or not parts[1].strip():
        raise HTTPException(status_code=401, detail="Malformed Authorization header")
    return parts[1].strip()


def resolve_spotify_id(token: str) -> str:
    """Return the Spotify user id for `token`, verifying it against Spotify."""
    now = time.time()
    key = _digest(token)

    cached = _cache.get(key)
    if cached and now - cached[1] <= _TTL_SECONDS:
        return cached[0]

    try:
        res = requests.get(
            SPOTIFY_ME_URL,
            headers={"Authorization": f"Bearer {token}"},
            timeout=_REQUEST_TIMEOUT,
        )
    except requests.RequestException as e:
        raise HTTPException(status_code=503, detail="Spotify unreachable") from e

    if res.status_code == 401:
        raise HTTPException(status_code=401, detail="Token expired")
    if res.status_code != 200:
        raise HTTPException(status_code=401, detail="Could not verify Spotify identity")

    spotify_id = (res.json() or {}).get("id")
    if not spotify_id:
        raise HTTPException(status_code=401, detail="Could not resolve Spotify user id")

    _prune(now)
    _cache[key] = (spotify_id, now)
    return spotify_id


def identify(authorization: str | None) -> tuple[str, str]:
    """Convenience: header in, (token, spotify_id) out."""
    token = bearer_token(authorization)
    return token, resolve_spotify_id(token)
