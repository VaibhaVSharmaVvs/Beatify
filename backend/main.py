import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from auth import router as auth_router
from game import router as game_router
from ratelimit import limiter

load_dotenv()

app = FastAPI(title="Guess the Song API")

# CORS configuration — reads from env var in production, falls back to localhost for dev
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174,http://localhost:3000")
origins = [o.strip().rstrip("/") for o in allowed_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting. SlowAPIMiddleware applies the global default from
# ratelimit.py; the @limiter.limit decorators on individual routes tighten it
# for the expensive ones (/start_game fans out to several Spotify calls).
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)


@app.exception_handler(RateLimitExceeded)
def rate_limit_handler(request, exc):
    # Hand-rolled rather than slowapi's default handler so the response is
    # plain JSON shaped like every other error the frontend already handles
    # (`detail`), and so it passes back out through CORSMiddleware.
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Slow down and try again shortly."},
    )


app.include_router(auth_router, tags=["Authentication"])
app.include_router(game_router, tags=["Game"])


@app.get("/")
def read_root():
    return {"message": "Welcome to Guess the Song API"}


@app.get("/health")
def health():
    """Cheap liveness probe.

    Deliberately touches nothing external so an uptime pinger can keep a
    free-tier instance warm without burning Spotify or Supabase quota.
    """
    return {"status": "ok"}
