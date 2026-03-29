import { useState, useEffect, useRef } from "react";
import LoginScreen from "@/components/game/LoginScreen";
import GameSettings from "@/components/game/GameSettings";
import GamePlay from "@/components/game/GamePlay";
import RoundResult from "@/components/game/RoundResult";
import GameOver from "@/components/game/GameOver";
import ThemeToggle from "@/components/game/ThemeToggle";
import { useTheme } from "@/hooks/use-theme";
import { getPlaylists, startGame, submitGuess, nextRound, playTrack, saveSession } from "../api";
import { toast } from "sonner";

type GamePhase = "login" | "settings" | "playing" | "result" | "gameover";

const DIFFICULTIES: Record<string, { duration: number; displayDuration: number }> = {
  easy: { duration: 13000, displayDuration: 10000 },
  medium: { duration: 8000, displayDuration: 5000 },
  hard: { duration: 5000, displayDuration: 3000 },
  impossible: { duration: 3000, displayDuration: 1000 }
};

const Index = () => {
  const { theme, toggle } = useTheme();
  const [phase, setPhase] = useState<GamePhase>("login");
  const [token, setToken] = useState<string | null>(null);
  const [spotifyId, setSpotifyId] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  
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
    rounds: 10,
    playlistName: '',
    categories: {
      artist: true,
      album: true,
      year: false
    },
    hintMode: "none"
  });

  // Spotify SDK State
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const playbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playerRef = useRef<any>(null);
  const pendingTimerRef = useRef<number | null>(null);
  const roundStartTimeRef = useRef<number | null>(null);
  // Holds the latest typed guess values so timer expiry can claim credit for partial answers
  const currentGuessRef = useRef<{ song: string; artist: string; album: string; year: string }>({
    song: '', artist: '', album: '', year: ''
  });

  // Live streak state
  const [currentStreak, setCurrentStreak] = useState(0);

  // 1. Check for token on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const sid = params.get('spotify_id');

    if (accessToken) {
      localStorage.setItem('access_token', accessToken);
      if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
      if (sid) localStorage.setItem('spotify_id', sid);
      window.history.replaceState({}, document.title, window.location.pathname);
      setToken(accessToken);
      setSpotifyId(sid || localStorage.getItem('spotify_id'));
      setPhase("settings");
    } else if (localStorage.getItem('access_token')) {
      const storedToken = localStorage.getItem('access_token');
      setToken(storedToken);
      setSpotifyId(localStorage.getItem('spotify_id'));
      setPhase("settings");
    }
  }, []);

  // 2. Fetch playlists when token is ready
  useEffect(() => {
    if (token) {
      setIsLoadingPlaylists(true);
      getPlaylists(token).then(res => {
        // Map to Lovable's expected props
        const mapped = res.data.items.map((p: any) => ({
          id: p.id,
          name: p.name,
          image: p.images?.[0]?.url || '',
          tracks: p.tracks?.total || 0
        }));
        setPlaylists(mapped);
        setIsLoadingPlaylists(false);
      }).catch(err => {
        setIsLoadingPlaylists(false);
        toast.error("Failed to fetch playlists. Are you offline?");
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
        getOAuthToken: (cb: any) => { cb(localStorage.getItem('access_token')); },
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

      player.addListener('player_state_changed', (state: any) => {
        if (!state) return;
        
        setIsAudioPlaying(!state.paused && state.position > 0);

        // When audio actually starts outputting to speakers
        if (!state.paused && state.position > 0) {
          if (pendingTimerRef.current !== null) {
            startTimer(pendingTimerRef.current);
            pendingTimerRef.current = null;
          }
          if (roundStartTimeRef.current === null) {
            roundStartTimeRef.current = Date.now();
          }
        }
      });

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
    setIsStartingGame(true);
    
    startGame(gameSettings.playlistId, token, gameSettings.rounds, gameSettings.categories).then(res => {
      setIsStartingGame(false);
      setCurrentRoundData(res.data);
      setScore(0);
      setHistory([]);
      setCurrentStreak(0);
      setPhase('playing');
      roundStartTimeRef.current = null;
      currentGuessRef.current = { song: '', artist: '', album: '', year: '' };
      playUri(res.data.uri, gameSettings.difficulty);
      if (gameSettings.timerEnabled) {
        setTimeLeft(gameSettings.timerSeconds);
        pendingTimerRef.current = gameSettings.timerSeconds;
      } else {
        setTimeLeft(999);
      }
    }).catch(err => {
      setIsStartingGame(false);
      toast.error("Failed to start game");
    });
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

  // Timer runout — submit whatever is currently typed
  useEffect(() => {
    if (phase === 'playing' && settings.timerEnabled && timeLeft === 0) {
      submitGuessAndShowResults(currentGuessRef.current);
    }
  }, [timeLeft, phase, settings.timerEnabled]);

  const submitGuessAndShowResults = (guess: {song: string, artist: string, album: string, year: string}) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (playerRef.current) playerRef.current.pause();
    
    const responseTime = roundStartTimeRef.current 
      ? (Date.now() - roundStartTimeRef.current) / 1000 
      : null;
    
    submitGuess({
      guess_name: guess.song,
      guess_artist: guess.artist,
      guess_album: guess.album,
      guess_year: guess.year
    }, token).then(res => {
      const enrichedResult = { ...res.data, response_time: responseTime };
      setRoundResult(enrichedResult);
      setScore(res.data.total_score);
      setHistory(prev => [...prev, enrichedResult]);
      // Update live streak
      if (res.data.points_earned >= res.data.max_score_per_round) {
        setCurrentStreak(prev => prev + 1);
      } else {
        setCurrentStreak(0);
      }
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
        roundStartTimeRef.current = null;
        currentGuessRef.current = { song: '', artist: '', album: '', year: '' };
        playUri(res.data.uri, settings.difficulty);
        if (settings.timerEnabled) {
          setTimeLeft(settings.timerSeconds);
          pendingTimerRef.current = settings.timerSeconds;
        }
      }
    }).catch(err => toast.error("Failed to start next round"));
  };

  return (
    <div className="min-h-screen bg-background">
      <ThemeToggle theme={theme} onToggle={toggle} />
      {phase === "login" && (
        <LoginScreen onConnect={() => window.location.href = 'http://localhost:8000/login'} />
      )}
      {phase === "settings" && (
        <GameSettings
          score={score}
          playlists={playlists}
          onStartGame={handleStartGame}
          isLoadingPlaylists={isLoadingPlaylists}
          isStartingGame={isStartingGame}
          isSpotifyConnected={isPlayerReady}
          spotifyId={spotifyId}
        />
      )}
      {phase === "playing" && (
        <GamePlay
          score={score}
          round={currentRoundData?.round || 1}
          totalRounds={settings.rounds}
          timeLeft={timeLeft}
          timerEnabled={settings.timerEnabled}
          categories={settings.categories}
          hintMode={settings.hintMode}
          albumArt={currentRoundData?.image_url}
          isPlaying={isAudioPlaying}
          currentStreak={currentStreak}
          isSpotifyConnected={isPlayerReady}
          onGuessChange={(g) => { currentGuessRef.current = g; }}
          onSubmitGuess={submitGuessAndShowResults}
        />
      )}
      {phase === "result" && roundResult && (
        <RoundResult
          albumArt={roundResult.image_url}
          songName={roundResult.correct_name}
          artists={roundResult.correct_artist}
          albumName={roundResult.correct_album}
          releaseYear={roundResult.correct_year}
          pointsEarned={roundResult.points_earned}
          maxScore={roundResult.max_score_per_round}
          isCorrect={roundResult.points_earned > 0}
          isLastRound={currentRoundData?.round >= settings.rounds}
          categories={settings.categories}
          onNextRound={handleNextRound}
        />
      )}
      {phase === "gameover" && history.length > 0 && (
        <GameOver
          totalScore={score}
          totalRounds={settings.rounds}
          categories={settings.categories}
          history={history}
          isStartingGame={isStartingGame}
          onPlayAgain={() => {
            handleStartGame(settings);
          }}
          onChangeSettings={() => {
            setScore(0);
            setHistory([]);
            setPhase("settings");
          }}
          onSessionSave={(maxStreak: number) => {
            const sid = spotifyId || localStorage.getItem('spotify_id');
            if (!sid) return;
            const rounds = history.map(h => ({
              track_name: h.correct_name,
              artist_name: (h.correct_artist || '').split(', ')[0],
              album_name: h.correct_album,
              release_year: h.correct_year,
              points_earned: h.points_earned,
              max_points: h.max_score_per_round,
              name_correct: h.field_scores?.name ?? false,
              artist_correct: h.field_scores?.artist ?? false,
              album_correct: h.field_scores?.album ?? false,
              year_correct: h.field_scores?.year ?? false,
              response_time: h.response_time ?? null,
            }));
            saveSession({
              spotify_id: sid,
              playlist_name: settings.playlistName || 'Unknown Playlist',
              difficulty: settings.difficulty,
              total_rounds: history.length,
              total_score: score,
              max_score: history.length * (history[0]?.max_score_per_round ?? 10),
              rounds,
            }).catch(err => console.error('[saveSession]', err));
          }}
        />
      )}
    </div>
  );
};

export default Index;
