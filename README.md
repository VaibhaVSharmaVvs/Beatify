# Guess The Song 🎵

A fully functional, polished "Guess the Song" web game powered by the Spotify API. Connect your Spotify Premium account, select your favorite playlists, and test your music knowledge!

## 🌟 Features
-   **Spotify Integration**: Logs in securely via OAuth 2.0 and streams music directly from your playlists using the Spotify Web Playback SDK.
-   **Modern UI**: Sleek dark mode with glassmorphism, neon accents, and smooth animations.
-   **Dynamic Visualizer**: A CSS-based audio visualizer that animates during playback.
-   **Customizable Gameplay**:
    -   **Difficulty Levels**: Adjust playback duration (Impossible: 1s, Hard: 3s, Medium: 5s, Easy: 10s).
    -   **Custom Timer**: Enable/disable the timer and set custom limits (10s - 99s).
    -   **Custom Rounds**: Choose how many rounds to play per game (1 - 10).
-   **Fuzzy Matching Validation**: Uses `rapidfuzz` on the backend to accurately grade partial or slightly misspelled guesses for Song Name, Artist, and Album.

---

## 🏗️ Directory Structure & Flow

The application is split into a separated Python/FastAPI backend and a React/Vite frontend.

```text
Game/
├── backend/
│   ├── main.py        # FastAPI application entry point. Handles routes (login, callback, start_game, guess, etc.)
│   ├── game.py        # Core game state loop. Manages score, active round, and random track selection logic.
│   ├── models.py      # Pydantic models standardizing API request/response structures.
│   ├── requirements.txt # Python dependencies (FastAPI, uvicorn, requests, rapidfuzz, etc.)
│   └── .env           # (Not committed) Contains SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.
│
└── frontend/
    ├── index.html     # Entry HTML file.
    ├── tailwind.config.js # Tailwind CSS configuration for styling.
    ├── src/
    │   ├── main.jsx   # React application entry point.
    │   ├── index.css  # Global CSS (includes Tailwind layers and custom glassmorphism/gradient animations).
    │   ├── api.js     # Axios wrapper handling all HTTP requests to the FastAPI backend.
    │   └── components/
    │       ├── Login.jsx      # Initial landing page. Directs user to Spotify OAuth flow.
    │       ├── Game.jsx       # The main hub. Handles playlist selection, game settings, gameplay loop, and SDK initialization.
    │       └── Scoreboard.jsx # Final view showing total score, history, and a button to play again.
```

### 🔁 Application Flow
1.  **Authentication**: The user opens the React app (`Login.jsx`) and clicks login. They are redirected to the FastAPI backend (`/login`), which instantly redirects them to Spotify's OAuth portal.
2.  **Callback**: After granting permission, Spotify redirects back to the backend (`/callback`). The backend exchanges the auth code for an Access Token and redirects the user back to the React app with the token in the URL.
3.  **Setup**: The React app saves the token and mounts `Game.jsx`. It fetches the user's playlists and initializes the hidden Spotify Web Playback SDK (requiring Premium).
4.  **Gameplay**:
    *   The user configures settings (difficulty, timer, rounds) and selects a playlist.
    *   The frontend calls `/start_game`. The backend fetches the playlist tracks, selects random songs, and returns the first track.
    *   The frontend streams the `uri` via the SDK for the selected difficulty duration, then pauses.
    *   The user submits a guess. The backend evaluates it using `rapidfuzz` in `/guess` and returns the points scored.
    *   The cycle repeats until all rounds are exhausted, ending at the `Scoreboard.jsx`.

---

## 🚀 How to Run Locally

### Prerequisites
-   Python 3.8+
-   Node.js (v18+)
-   A **Spotify Premium** account (required for the Web Playback SDK).
-   A registered Spotify App in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) with the redirect URI set to `http://127.0.0.1:8000/callback`.

### 1. Backend Setup
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Create a virtual environment and activate it:
    ```bash
    python -m venv venv
    venv\Scripts\activate  # Windows
    # source venv/bin/activate # Mac/Linux
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
4.  Create a `.env` file in the `backend` directory and add your Spotify credentials:
    ```env
    SPOTIFY_CLIENT_ID=your_client_id_here
    SPOTIFY_CLIENT_SECRET=your_client_secret_here
    ```
5.  Start the FastAPI server:
    ```bash
    uvicorn main:app --reload
    ```

### 2. Frontend Setup
1.  Open a **new** terminal window and navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install NPM dependencies:
    ```bash
    npm install
    ```
3.  Start the Vite development server:
    ```bash
    npm run dev
    ```

### 3. Play!
Open your browser and navigate to `http://localhost:5173`. Click "Connect with Spotify" to begin.

---

## 🎮 Rules of the Game

### Objective
Score as many points as possible by correctly identifying the song name, artist, and album before the timer runs out!

### Scoring System
Each round is worth a maximum of **10 Points**:
-   **Song Name**: 5 points (Requires high accuracy).
-   **Artist**: 2 points (Requires high accuracy).
-   **Album**: 3 points (Requires high accuracy).
*Note: The backend uses fuzzy string matching. Minor typos are forgiven, but you must be close to score points!*

### Game Settings
You have full control over your experience before starting a playlist:
-   **Difficulty**: Determines how long you hear the audio clip.
    -   *Impossible (1s), Hard (3s), Medium (5s), Easy (10s)*
-   **Timer**: Toggle the visual countdown timer. If enabled, the game automatically submits whatever you've typed when the clock hits zero. You can adjust the timer from 10 to 99 seconds.
-   **Rounds**: Choose a quick 1-round game, or go for a full challenge with 10 rounds.

Good luck!
