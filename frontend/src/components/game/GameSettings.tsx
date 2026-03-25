import { Settings, Clock, Hash, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import Rulebook from "./Rulebook";

interface Playlist {
  id: string;
  name: string;
  image: string;
  tracks: number;
}

interface GameSettingsProps {
  score: number;
  playlists: Playlist[];
  onStartGame: (settings: {
    difficulty: string;
    timerEnabled: boolean;
    timerSeconds: number;
    rounds: number;
    playlistId: string;
  }) => void;
  isLoadingPlaylists?: boolean;
  isStartingGame?: boolean;
}

const difficulties = [
  { id: "easy", label: "Easy", seconds: "10s", color: "text-primary" },
  { id: "medium", label: "Medium", seconds: "5s", color: "text-[hsl(var(--game-warning))]" },
  { id: "hard", label: "Hard", seconds: "3s", color: "text-[hsl(var(--game-error))]" },
  { id: "impossible", label: "Impossible", seconds: "1s", color: "text-[hsl(var(--game-error))]" },
];

const GameSettings = ({ score, playlists, onStartGame, isLoadingPlaylists, isStartingGame }: GameSettingsProps) => {
  const [difficulty, setDifficulty] = useState("easy");
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(10);
  const [rounds, setRounds] = useState(10);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);

  const handleStart = () => {
    if (!selectedPlaylist) return;
    onStartGame({
      difficulty,
      timerEnabled,
      timerSeconds,
      rounds,
      playlistId: selectedPlaylist,
    });
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between fade-in">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Beatify | Guess The Song</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="score-display text-muted-foreground">Score: {score}</span>
              <span className="game-badge">● Online</span>
            </div>
          </div>
        </div>

        {/* Settings Card */}
        <div className="game-card slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Game Settings</h2>
          </div>

          {/* Difficulty */}
          <div className="space-y-3 mb-6">
            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Difficulty
            </label>
            <div className="flex gap-2 flex-wrap">
              {difficulties.map((d) => (
                <Button
                  key={d.id}
                  variant={difficulty === d.id ? "gameActive" : "game"}
                  size="sm"
                  onClick={() => setDifficulty(d.id)}
                >
                  {d.label}
                  <span className="text-xs opacity-60 ml-1">{d.seconds}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Timer */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Timer
              </label>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  className={`w-10 h-6 rounded-full transition-colors duration-200 relative cursor-pointer ${
                    timerEnabled ? "bg-primary" : "bg-muted"
                  }`}
                  onClick={() => setTimerEnabled(!timerEnabled)}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-background transition-transform duration-200 ${
                      timerEnabled ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </div>
                <span className="text-sm">{timerEnabled ? "Enabled" : "Disabled"}</span>
              </label>
            </div>
            {timerEnabled && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Seconds</span>
                  <span className="score-display text-primary">{timerSeconds}s</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={60}
                  value={timerSeconds}
                  onChange={(e) => setTimerSeconds(Number(e.target.value))}
                  className="w-full accent-[hsl(141,73%,42%)] h-2 rounded-full bg-muted appearance-none cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Rounds */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-muted-foreground" />
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Rounds
              </label>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Count</span>
              <span className="score-display text-primary">{rounds}</span>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              value={rounds}
              onChange={(e) => setRounds(Number(e.target.value))}
              className="w-full accent-[hsl(141,73%,42%)] h-2 rounded-full bg-muted appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Playlist Selection */}
        <div className="space-y-4 slide-up" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-xl font-semibold">Select Playlist</h2>
          
          {isLoadingPlaylists ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 rounded-2xl border-2 border-dashed border-primary/20 bg-card/30">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm font-medium text-muted-foreground animate-pulse">Syncing your Spotify Library...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => setSelectedPlaylist(playlist.id)}
                  className={`group relative rounded-2xl overflow-hidden border-2 transition-all duration-300 text-left ${
                    selectedPlaylist === playlist.id
                      ? "border-primary shadow-lg shadow-primary/20"
                      : "border-transparent hover:border-border"
                  }`}
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={playlist.image}
                      alt={playlist.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-3 bg-card">
                    <p className="font-medium text-sm truncate">{playlist.name}</p>
                    <p className="text-xs text-muted-foreground">{playlist.tracks} Tracks</p>
                  </div>
                  {selectedPlaylist === playlist.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Start Button */}
        <div className="slide-up" style={{ animationDelay: "0.3s" }}>
          <Button 
            variant="spotify" 
            size="lg" 
            className="w-full mt-8 fade-in" 
            style={{ animationDelay: "0.5s" }} 
            onClick={handleStart} 
            disabled={!selectedPlaylist || isStartingGame}
          >
            {isStartingGame ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Initializing Tracks...
              </span>
            ) : "Start Game"}
          </Button>
        </div>
      </div>
      
      {/* Rulebook Hover Widget */}
      <div className="fixed bottom-6 right-6 z-40">
        <Rulebook />
      </div>
    </div>
  );
};

export default GameSettings;
