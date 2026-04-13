import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def upsert_player(spotify_id: str, display_name: str):
    try:
        supabase.table("players").upsert({
            "spotify_id": spotify_id,
            "display_name": display_name
        }).execute()
    except Exception as e:
        print(f"[DB] upsert_player error: {e}")


def save_game_session(spotify_id: str, session_data: dict) -> str:
    result = supabase.table("game_sessions").insert({
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
    supabase.table("round_results").insert(rows).execute()
