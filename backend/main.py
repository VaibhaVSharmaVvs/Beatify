from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth import router as auth_router
from game import router as game_router
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Guess the Song API")

# CORS configuration
origins = [
    "http://localhost:5173", # Vite default
    "http://localhost:5174", # Vite fallback
    "http://localhost:3000", # React default
]

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
