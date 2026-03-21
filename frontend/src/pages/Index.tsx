import { useState, useEffect, useRef } from "react";
import LoginScreen from "@/components/game/LoginScreen";
import GameSettings from "@/components/game/GameSettings";
import GamePlay from "@/components/game/GamePlay";
import RoundResult from "@/components/game/RoundResult";
import GameOver from "@/components/game/GameOver";
import { getPlaylists, startGame, submitGuess, nextRound, playTrack } from "../api";
import { toast } from "sonner";

type GamePhase = "login" | "settings" | "playing" | "result" | "gameover";

const DIFFICULTIES: Record<string, { duration: number; displayDuration: number }> = {
  easy: { duration: 13000, displayDuration: 10000 },
  medium: { duration: 8000, displayDuration: 5000 },
  hard: { duration: 5000, displayDuration: 3000 },
  impossible: { duration: 3000, displayDuration: 1000 }
};

const Index = () => {
  const [phase, setPhase] = useState<GamePhase>("login");
  const [token, setToken] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);
  
  // Game State
  const [score, setScore] = useState(0);
  const [currentRoundData, setCurrentRoundData] = useState<any>(null);
  const [roundResult, setRoundResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState(10);
  
  // Settings configured by user
  const [settings, setSettings] = useState({
    difficulty: 'easy',
    timerEnabled: true,
    timerSeconds: 10,
    rounds: 10
  });

  // Spotify SDK State
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const playbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playerRef = useRef<any>(null);

  // 1. Check for token on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken) {
      localStorage.setItem('access_token', accessToken);
      if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
      window.history.replaceState({}, document.title, window.location.pathname);
      setToken(accessToken);
      setPhase("settings");
    } else if (localStorage.getItem('access_token')) {
      const storedToken = localStorage.getItem('access_token');
      setToken(storedToken);
      setPhase("settings");
    }
  }, []);

  // 2. Fetch playlists when token is ready
  useEffect(() => {
    if (token) {
      getPlaylists(token).then(res => {
        // Map to Lovable's expected props
        const mapped = res.data.items.map((p: any) => ({
          id: p.id,
          name: p.name,
          image: p.images?.[0]?.url || '',
          tracks: p.tracks?.total || 0
        }));
        setPlaylists(mapped);
      }).catch(err => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setToken(null);
        setPhase('login');
        if (err.response && err.response.status !== 401) {
          toast.error("Failed to fetch playlists. Please log in again.");
        }
      });
    }
  }, [token]);

  // 3. Initialize Spotify Player
  useEffect(() => {
    if (!token) return;

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    (window as any).onSpotifyWebPlaybackSDKReady = () => {
      const player = new (window as any).Spotify.Player({
        name: 'Beatify | Guess The Song',
        getOAuthToken: (cb: any) => { cb(token); },
        volume: 0.5
      });

      player.addListener('ready', ({ device_id }: any) => {
        setDeviceId(device_id);
        setIsPlayerReady(true);
        toast.success("Connected to Spotify!");
      });

      player.addListener('not_ready', () => setIsPlayerReady(false));
      player.addListener('initialization_error', () => toast.error("Player initialization failed. Check Premium."));
      player.addListener('authentication_error', () => toast.error("Auth failed."));
      player.addListener('account_error', () => toast.error("Premium required."));

      player.connect();
      playerRef.current = player;
    };

    return () => {
      if (playerRef.current) playerRef.current.disconnect();
    };
  }, [token]);

  // Handle Start
  const handleStartGame = (gameSettings: any) => {
    if (!isPlayerReady) {
      toast.error("Waiting for Spotify Player to connect...");
      return;
    }
    setSettings(gameSettings);
    startGame(gameSettings.playlistId, token, gameSettings.rounds).then(res => {
      setCurrentRoundData(res.data);
      setPhase('playing');
      playUri(res.data.uri, gameSettings.difficulty);
      if (gameSettings.timerEnabled) {
        startTimer(gameSettings.timerSeconds);
      } else {
        setTimeLeft(999);
      }
    }).catch(err => toast.error("Failed to start game"));
  };

  const playUri = (uri: string, diffLevel: string) => {
    if (deviceId && uri) {
      playTrack(token, deviceId, uri).catch(err => console.error(err));
      if (playbackTimeoutRef.current) clearTimeout(playbackTimeoutRef.current);
      
      const duration = DIFFICULTIES[diffLevel]?.duration || 8000;
      playbackTimeoutRef.current = setTimeout(() => {
        if (playerRef.current) playerRef.current.pause();
      }, duration);
    }
  };

  const startTimer = (seconds: number) => {
    setTimeLeft(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
  };

  // Timer runout
  useEffect(() => {
    if (phase === 'playing' && settings.timerEnabled && timeLeft === 0) {
      submitGuessAndShowResults({ song: '', artist: '', album: '' });
    }
  }, [timeLeft, phase, settings.timerEnabled]);

  const submitGuessAndShowResults = (guess: {song: string, artist: string, album: string}) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (playerRef.current) playerRef.current.pause();
    
    submitGuess({
      guess_name: guess.song,
      guess_artist: guess.artist,
      guess_album: guess.album
    }, token).then(res => {
      setRoundResult(res.data);
      setScore(res.data.total_score);
      setHistory(prev => [...prev, res.data]);
      setPhase('result');
    }).catch(err => toast.error("Failed to submit guess"));
  };

  const handleNextRound = () => {
    nextRound(token).then(res => {
      if (res.data.game_over) {
        setPhase('gameover');
      } else {
        setCurrentRoundData(res.data);
        setRoundResult(null);
        setPhase('playing');
        playUri(res.data.uri, settings.difficulty);
        if (settings.timerEnabled) {
          startTimer(settings.timerSeconds);
        }
      }
    }).catch(err => toast.error("Failed to start next round"));
  };

  return (
    <div className="min-h-screen bg-background">
      {phase === "login" && (
        <LoginScreen onConnect={() => window.location.href = 'http://localhost:8000/login'} />
      )}
      {phase === "settings" && (
        <GameSettings
          score={score}
          playlists={playlists}
          onStartGame={handleStartGame}
        />
      )}
      {phase === "playing" && (
        <GamePlay
          score={score}
          round={currentRoundData?.round || 1}
          totalRounds={settings.rounds}
          timeLeft={timeLeft}
          timerEnabled={settings.timerEnabled}
          onSubmitGuess={submitGuessAndShowResults}
        />
      )}
      {phase === "result" && roundResult && (
        <RoundResult
          albumArt={roundResult.image_url}
          songName={roundResult.correct_name}
          artists={roundResult.correct_artist}
          albumName={roundResult.correct_album}
          pointsEarned={roundResult.points_earned}
          isCorrect={roundResult.points_earned > 0}
          onNextRound={handleNextRound}
        />
      )}
      {phase === "gameover" && history.length > 0 && (
        <GameOver
          totalScore={score}
          totalRounds={settings.rounds}
          lastSongImage={history[history.length - 1].image_url}
          lastSongName={history[history.length - 1].correct_name}
          lastSongArtist={history[history.length - 1].correct_artist}
          onPlayAgain={() => {
            setScore(0);
            setHistory([]);
            setPhase("settings");
          }}
        />
      )}
    </div>
  );
};

export default Index;
