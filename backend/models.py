from pydantic import BaseModel
from typing import List, Optional


class Track(BaseModel):
    id: str
    name: str
    artists: List[str]
    album: str
    preview_url: Optional[str] = None
    image_url: Optional[str] = None
    uri: str


class GameState(BaseModel):
    round: int
    score: int
    current_track: Optional[Track] = None
    history: List[dict] = []
    game_over: bool = False


class GuessSubmission(BaseModel):
    guess_name: str
    guess_artist: str
    guess_album: str
    guess_year: str = ""


class RoundData(BaseModel):
    track_name: str
    artist_name: str
    album_name: str
    release_year: str
    points_earned: int
    max_points: int
    name_correct: bool
    artist_correct: bool
    album_correct: bool
    year_correct: bool
    response_time: Optional[float] = None


class SaveSessionRequest(BaseModel):
    spotify_id: str
    playlist_name: str
    difficulty: str
    total_rounds: int
    total_score: int
    max_score: int
    rounds: List[RoundData]
