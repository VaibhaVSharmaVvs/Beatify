import os
from datetime import datetime, timezone
from typing import Optional

from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

_client: Optional[Client] = None


def get_client() -> Client:
    """Lazily build the Supabase client.

    Created on first use rather than at import so a missing env var surfaces as
    a clear error on the first request instead of crashing the whole process at
    boot with a stack trace from deep inside the SDK.

    This uses the service_role key, which bypasses Row Level Security. It must
    never be exposed to the browser — every table below is reachable only
    through this backend.
    """
    global _client
    if _client is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set. "
                "See backend/.env.example."
            )
        _client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _client


# --------------------------------------------------------------------------
# Players
# --------------------------------------------------------------------------

def upsert_player(spotify_id: str, display_name: str):
    try:
        get_client().table("players").upsert({
            "spotify_id": spotify_id,
            "display_name": display_name
        }).execute()
    except Exception as e:
        print(f"[DB] upsert_player error: {e}")


# --------------------------------------------------------------------------
# Active game state
#
# Game state used to live in a module-level dict, which meant it could not
# survive a process restart and could not be shared across workers or
# replicas. On a free hosting tier that spins down when idle, every in-flight
# game was lost. It now lives in Postgres, keyed by the verified Spotify id.
# --------------------------------------------------------------------------

def load_active_game(spotify_id: str) -> Optional[dict]:
    res = (
        get_client()
        .table("active_games")
        .select("state")
        .eq("spotify_id", spotify_id)
        .limit(1)
        .execute()
    )
    if not res.data:
        return None
    return res.data[0]["state"]


def save_active_game(spotify_id: str, state: dict) -> None:
    # Stamp updated_at from Python: PostgREST sends values as literals, so
    # "now()" would arrive as the string "now()" rather than being evaluated.
    get_client().table("active_games").upsert({
        "spotify_id": spotify_id,
        "state": state,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).execute()


def delete_active_game(spotify_id: str) -> None:
    try:
        get_client().table("active_games").delete().eq("spotify_id", spotify_id).execute()
    except Exception as e:
        print(f"[DB] delete_active_game error: {e}")


def purge_stale_active_games() -> None:
    """Drop abandoned games so the table can't grow without bound.

    Called opportunistically on game start; failures are non-fatal because this
    is housekeeping, not part of the user's request.
    """
    try:
        get_client().rpc("purge_stale_active_games").execute()
    except Exception as e:
        print(f"[DB] purge_stale_active_games error: {e}")


# --------------------------------------------------------------------------
# Game history
# --------------------------------------------------------------------------

def save_game_session(spotify_id: str, session_data: dict) -> str:
    result = get_client().table("game_sessions").insert({
        "spotify_id": spotify_id,
        "total_rounds": session_data["total_rounds"],
        "total_score": session_data["total_score"],
        "max_score": session_data["max_score"],
        "difficulty": session_data["difficulty"],
        "playlist_name": session_data["playlist_name"],
    }).execute()
    return result.data[0]["id"]


def save_round_results(session_id: str, spotify_id: str, rounds: list):
    rows = [
        {
            "session_id": session_id,
            "spotify_id": spotify_id,
            "track_name": r.get("track_name", ""),
            "artist_name": r.get("artist_name", ""),
            "album_name": r.get("album_name", ""),
            "release_year": r.get("release_year", ""),
            "points_earned": r.get("points_earned", 0),
            "max_points": r.get("max_points", 0),
            "name_correct": r.get("name_correct", False),
            "artist_correct": r.get("artist_correct", False),
            "album_correct": r.get("album_correct", False),
            "year_correct": r.get("year_correct", False),
            "response_time": r.get("response_time"),
        }
        for r in rounds
    ]
    get_client().table("round_results").insert(rows).execute()


# --------------------------------------------------------------------------
# Analytics
# --------------------------------------------------------------------------

def get_player_stats(spotify_id: str) -> Optional[dict]:
    """Run the aggregation RPC for one player.

    The browser used to call this RPC directly with the public anon key. There
    is no Supabase Auth session in this app, so RLS had no identity to filter
    on and any caller could read any player's history by passing their id. The
    call now happens here, after the caller's token has been verified.
    """
    res = get_client().rpc("get_player_stats", {"target_spotify_id": spotify_id}).execute()
    return res.data
