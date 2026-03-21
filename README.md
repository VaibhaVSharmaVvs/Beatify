# 🎵 Beatify | Guess The Song

<div align="center">
  <img src="frontend/public/favicon.svg" alt="Beatify Logo" width="100"/>
  <br/>
  <strong>Test your music knowledge with your own Spotify playlists!</strong>
</div>

<br/>

**Beatify** is a full-stack, state-of-the-art music trivia application. Log in with your Spotify account, select your favorite playlists, and test your knowledge by guessing the song name, artist, and album before the timer runs out!

---

## 🎨 Visuals

Here is a look at the fully redesigned, glassmorphic UI matching Spotify's dark aesthetic:

<div align="center">
  <img src="pics/Screenshot%202026-03-21%20180307.png" width="48%" />
  <img src="pics/Screenshot%202026-03-21%20180358.png" width="48%" />
</div>
<div align="center">
  <img src="pics/Screenshot%202026-03-21%20180409.png" width="48%" />
  <img src="pics/Screenshot%202026-03-21%20180433.png" width="48%" />
</div>
<div align="center">
  <img src="pics/Screenshot%202026-03-21%20180445.png" width="48%" />
  <img src="pics/Screenshot%202026-03-21%20180623.png" width="48%" />
</div>

---

## 🧠 Architecture & Flow

Beatify uses a powerful **hybrid architecture**. 

### 1. The Brain (Python + FastAPI)
The Python backend is in charge of all heavy lifting, business logic, and security:
- **OAuth Trading**: Securely trades Spotify verification codes for Access Tokens using your `SPOTIFY_CLIENT_SECRET`.
- **Game State**: Dictates game initialization, limits rounds, and fetches tracks from Spotify's Web API.
- **Robust Scoring**: Uses `rapidfuzz` string-matching algorithm to accurately score user text inputs against the real Spotify metadata, handling typos gracefully!

### 2. The Paint (React + Vite + TypeScript)
The frontend is a beautifully styled, strictly presentation layer built on **Lovable** template defaults:
- Designed with **Tailwind CSS**, `shadcn/ui`, and `lucide-react` icons for a premium, responsive workflow.
- Responsible for initializing the **Spotify Web Playback SDK** directly in the browser to stream the premium audio.
- Entirely stateless; it simply passes your `Authorization: Bearer` token to Python and visually renders Python's responses!

---

## 📂 Directory Structure

```text
Game/
├── backend/                  # Python FastAPI Brain
│   ├── .env                  # Secures your Spotify API keys
│   ├── main.py               # API Bootstrapper & CORS
│   ├── auth.py               # Secure /login, /callback loops
│   ├── game.py               # Fuzz scoring logic & API endpoints
│   ├── models.py             # Pydantic data schemas
│   └── requirements.txt      # Python dependencies
│
├── frontend/                 # React UI Layer
│   ├── src/
│   │   ├── api.js            # Axios bindings linking UI to Python Backend
│   │   ├── App.tsx           # React Router
│   │   ├── index.css         # Global Tailwind & Theme CSS
│   │   ├── pages/            # View Containers (Index.tsx handles App Loop)
│   │   └── components/       # Dumb UI components (GameSettings, GamePlay)
│   ├── public/               # Static assets & SVG Favicon
│   ├── index.html            # Vite Injection point & Meta Tags
│   └── vite.config.ts        # Bootstraps Port 5173 
│
└── pics/                     # Demo UI Screenshots
```

---

## 🎮 How to Play

1. **Connect**: Click "Connect with Spotify". You will be bounced to your Python backend to securely approve the App.
2. **Setup**: Once redirected, select a Game Difficulty, toggle the timer, pick round counts, and click one of your fetched Playlists!
3. **Listen**: Snippets play dynamically in your browser. (Requires Spotify Premium).
4. **Guess**: Type the Song Name, Artist, and Album before the timer expires. 
5. **Score**: 
   - **Song Name**: 5 Points
   - **Artist**: 2 Points
   - **Album**: 3 Points
   - *(Total: 10 points per round limit!)*

---

## 🚀 Local Setup

### 1. Requirements
- Python 3.9+
- Node.js & `npm`
- A Spotify Premium Account
- Spotify Developer Credentials

### 2. Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate
pip install -r requirements.txt
```
**Create your `.env` File** inside `backend/`:
```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
REDIRECT_URI=http://127.0.0.1:8000/callback
FRONTEND_URL=http://localhost:5173
```
**Start the Server**:
```bash
uvicorn main:app --reload
```
*(Runs on `http://127.0.0.1:8000`)*

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*(Runs on `http://localhost:5173`)*

Navigate to `http://localhost:5173` in your browser. Enjoy **Beatify**!
