import { Settings, Clock, Hash, ChevronRight, Loader2, Image as ImageIcon, Music, HelpCircle, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import Rulebook from "./Rulebook";
import { StatsDashboardLeft, StatsDashboardRight } from "./StatsDashboard";
import { useStats } from "@/hooks/use-stats";

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
    playlistName: string;
    categories: {
      artist: boolean;
      album: boolean;
      year: boolean;
    };
    hintMode: string;
  }) => void;
  isLoadingPlaylists?: boolean;
  isStartingGame?: boolean;
  isSpotifyConnected?: boolean;
  spotifyId?: string | null;
}

const difficulties = [
  { id: "easy", label: "Listener", seconds: "10s", color: "text-primary" },
  { id: "medium", label: "Performer", seconds: "5s", color: "text-[hsl(var(--game-warning))]" },
  { id: "hard", label: "Producer", seconds: "3s", color: "text-[hsl(var(--game-error))]" },
  { id: "impossible", label: "Virtuoso", seconds: "1s", color: "text-[hsl(var(--game-error))]" },
];

const GameSettings = ({ score, playlists, onStartGame, isLoadingPlaylists, isStartingGame, isSpotifyConnected, spotifyId }: GameSettingsProps) => {
  const [difficulty, setDifficulty] = useState("easy");
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [timerSeconds, setTimerSeconds] = useState(10);
  const [rounds, setRounds] = useState(10);
  const [categories, setCategories] = useState({ artist: true, album: true, year: false });
  const [hintMode, setHintMode] = useState("none");
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);

  const handleStart = () => {
    if (!selectedPlaylist) return;
    const pl = playlists.find(p => p.id === selectedPlaylist);
    onStartGame({
      difficulty,
      timerEnabled,
      timerSeconds,
      rounds,
      playlistId: selectedPlaylist,
      playlistName: pl?.name || 'Unknown Playlist',
      categories,
      hintMode,
    });
  };

  const { stats, loading: statsLoading } = useStats(spotifyId ?? null);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Row (aligned above center column) */}
        <div className="xl:grid xl:grid-cols-[280px_1fr_280px] xl:gap-6 mb-6">
          <div className="hidden xl:flex items-end pb-1 relative">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1 absolute bottom-0">Leaderboards</p>
          </div>
          
          <div className="max-w-2xl mx-auto xl:mx-0 w-full fade-in">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
                    <img src="/favicon.svg" alt="Beatify Logo" className="w-6 h-6" />
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight">Beatify <span className="text-muted-foreground font-normal">| Guess The Song</span></h1>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <span
                    className="game-badge"
                    style={{
                      color: isSpotifyConnected ? undefined : 'hsl(var(--muted-foreground))',
                      borderColor: isSpotifyConnected ? undefined : 'hsl(var(--border))'
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: isSpotifyConnected ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                        marginRight: '6px',
                        animation: isSpotifyConnected ? 'pulse 2s infinite' : 'none'
                      }}
                    />
                    {isSpotifyConnected ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="hidden xl:flex items-end pb-1 relative">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1 absolute bottom-0">Your Stats</p>
          </div>
        </div>

        <div className="xl:grid xl:grid-cols-[280px_1fr_280px] xl:gap-6 items-start">

          {/* Left Stats Panel */}
          <div className="hidden xl:block sticky top-8">
            <StatsDashboardLeft stats={stats} loading={statsLoading} />
          </div>

          {/* Centre — existing settings form */}
          <div className="max-w-2xl mx-auto xl:mx-0 space-y-8">

        {/* Settings Card */}
        <div className="game-card slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-2 mb-6">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Game Settings</h2>
          </div>

          {/* Difficulty */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-muted-foreground" />
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                Difficulty
              </label>
              <div className="relative group flex items-center justify-center cursor-help">
                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground opacity-50 hover:opacity-100 transition-opacity" />
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-1.5 bg-black/95 text-xs font-medium text-white rounded shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none z-50 whitespace-nowrap border border-white/10">
                  Modulates the snippet duration to increase challenge
                </div>
              </div>
            </div>
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
              <div className="relative group flex items-center justify-center cursor-help ml-1">
                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground opacity-50 hover:opacity-100 transition-opacity" />
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-1.5 bg-black/95 text-xs font-medium text-white rounded shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none z-50 whitespace-nowrap border border-white/10">
                  Controls the duration of each round
                </div>
              </div>
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
                  step={10}
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
              <div className="relative group flex items-center justify-center cursor-help ml-1">
                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground opacity-50 hover:opacity-100 transition-opacity" />
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-1.5 bg-black/95 text-xs font-medium text-white rounded shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none z-50 whitespace-nowrap border border-white/10">
                  Sets the total number of songs in the game
                </div>
              </div>
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

          {/* Hints */}
          <div className="space-y-3 mb-6 pt-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-muted-foreground" />
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Visual Hint
              </label>
              <div className="relative group flex items-center justify-center cursor-help ml-1">
                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground opacity-50 hover:opacity-100 transition-opacity" />
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-1.5 bg-black/95 text-xs font-medium text-white rounded shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none z-50 whitespace-nowrap border border-white/10">
                  Configure album art reveal settings to help guess the song
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { id: "none", label: "Disabled" },
                { id: "progressive", label: "Progressive (10s)" },
                { id: "manual", label: "Manual Reveal 👁️" },
              ].map((h) => (
                <Button
                  key={h.id}
                  variant={hintMode === h.id ? "gameActive" : "game"}
                  size="sm"
                  onClick={() => setHintMode(h.id)}
                >
                  {h.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Categories to Guess
              </label>
              <div className="relative group flex items-center justify-center cursor-help ml-1">
                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground opacity-50 hover:opacity-100 transition-opacity" />
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-1.5 bg-black/95 text-xs font-medium text-white rounded shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none z-50 whitespace-nowrap border border-white/10">
                  Select which track fields you want to guess for extra points
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 cursor-pointer opacity-70">
                <input type="checkbox" checked readOnly className="appearance-none w-4 h-4 rounded border border-border bg-background checked:bg-primary checked:border-primary relative after:absolute after:hidden checked:after:block after:left-[4px] after:top-[1px] after:w-[5px] after:h-[10px] after:border-r-2 after:border-b-2 after:border-background after:rotate-45 cursor-not-allowed shrink-0" />
                <span className="text-sm">Song Name (5 pts)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={categories.artist} onChange={e => setCategories({...categories, artist: e.target.checked})} className="appearance-none w-4 h-4 rounded border border-muted-foreground bg-background checked:bg-primary checked:border-primary relative after:absolute after:hidden checked:after:block after:left-[4px] after:top-[1px] after:w-[5px] after:h-[10px] after:border-r-2 after:border-b-2 after:border-background after:rotate-45 cursor-pointer shrink-0 transition-colors" />
                <span className="text-sm">Artist (2 pts)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={categories.album} onChange={e => setCategories({...categories, album: e.target.checked})} className="appearance-none w-4 h-4 rounded border border-muted-foreground bg-background checked:bg-primary checked:border-primary relative after:absolute after:hidden checked:after:block after:left-[4px] after:top-[1px] after:w-[5px] after:h-[10px] after:border-r-2 after:border-b-2 after:border-background after:rotate-45 cursor-pointer shrink-0 transition-colors" />
                <span className="text-sm">Album (3 pts)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={categories.year} onChange={e => setCategories({...categories, year: e.target.checked})} className="appearance-none w-4 h-4 rounded border border-muted-foreground bg-background checked:bg-primary checked:border-primary relative after:absolute after:hidden checked:after:block after:left-[4px] after:top-[1px] after:w-[5px] after:h-[10px] after:border-r-2 after:border-b-2 after:border-background after:rotate-45 cursor-pointer shrink-0 transition-colors" />
                <span className="text-sm">Release Year (2 pts)</span>
              </label>
            </div>
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
        </div>{/* /slide-up */}
          </div>{/* /centre */}

          {/* Right Stats Panel */}
          <div className="hidden xl:block sticky top-8">
            <StatsDashboardRight stats={stats} loading={statsLoading} />
          </div>

        </div>{/* /grid */}
      </div>{/* /max-w */}

      {/* Rulebook Hover Widget */}
      <div className="fixed bottom-6 left-6 z-40">
        <Rulebook />
      </div>
    </div>
  );
};

export default GameSettings;
