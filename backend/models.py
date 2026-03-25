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
