"""Shared rate limiter.

Lives in its own module so `main.py` and the routers can import the same
`Limiter` instance without a circular import.

Storage is in-process, which matches how this app is deployed: a single
uvicorn worker (game state is now in Postgres, but the limiter deliberately
stays local — it is a cheap abuse guard, not an accounting system). If the
backend is ever scaled to multiple replicas, each replica enforces its own
budget; point `storage_uri` at Redis to make the limits global.
"""

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address


def client_key(request: Request) -> str:
    """Identify the caller for rate-limiting purposes.

    Render/Vercel and every other managed platform terminate TLS at a proxy, so
    the socket peer is the proxy — without this every user would share one
    bucket. The left-most X-Forwarded-For entry is the original client.

    This header is client-spoofable in general; it is only trustworthy because
    the platform's proxy overwrites it. Do not deploy this app with the backend
    directly exposed to the internet and expect the limits to hold.
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)


# Global ceiling applied to every route; individual routes tighten it further.
limiter = Limiter(key_func=client_key, default_limits=["120/minute"])
