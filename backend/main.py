from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth import router as auth_router
from game import router as game_router
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Guess the Song API")

# CORS configuration — reads from env var in production, falls back to localhost for dev
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174,http://localhost:3000")
origins = [o.strip() for o in allowed_origins_env.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, tags=["Authentication"])
app.include_router(game_router, tags=["Game"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Guess the Song API"}
