import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Eye } from "lucide-react";

interface GamePlayProps {
  score: number;
  round: number;
  totalRounds: number;
  timeLeft: number;
  timerEnabled: boolean;
  categories: { artist: boolean; album: boolean; year: boolean };
  hintMode: string;
  albumArt?: string;
  isPlaying: boolean;
  currentStreak: number;
  isSpotifyConnected?: boolean;
  onGuessChange: (g: { song: string; artist: string; album: string; year: string }) => void;
  onSubmitGuess: (guess: { song: string; artist: string; album: string; year: string }) => void;
}

const GamePlay = ({ score, round, totalRounds, timeLeft, timerEnabled, categories, hintMode, albumArt, isPlaying, currentStreak, isSpotifyConnected, onGuessChange, onSubmitGuess }: GamePlayProps) => {
  const [song, setSong] = useState("");
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [year, setYear] = useState("");
  const [isRevealed, setIsRevealed] = useState(false);

  // Reset hint state uniquely on every round refresh
  useEffect(() => {
    setIsRevealed(false);
  }, [round]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitGuess({ song, artist, album, year });
    const cleared = { song: '', artist: '', album: '', year: '' };
    setSong('');
    setArtist('');
    setAlbum('');
    setYear('');
    onGuessChange(cleared);
  };

  const updateSong = (v: string) => { setSong(v); onGuessChange({ song: v, artist, album, year }); };
  const updateArtist = (v: string) => { setArtist(v); onGuessChange({ song, artist: v, album, year }); };
  const updateAlbum = (v: string) => { setAlbum(v); onGuessChange({ song, artist, album: v, year }); };
  const updateYear = (v: string) => { setYear(v); onGuessChange({ song, artist, album, year: v }); };

  const timerPercentage = timerEnabled ? (timeLeft / 30) * 100 : 100;
  const timerColor = timeLeft <= 3 ? "hsl(var(--game-error))" : timeLeft <= 7 ? "hsl(var(--game-warning))" : "hsl(var(--primary))";

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header bar */}
        <div className="flex items-center justify-between fade-in">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Beatify | Guess The Song</h1>
            <span className="score-display text-muted-foreground text-sm">Score: {score}</span>
          </div>
          <div
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
          </div>
        </div>

        {/* Round & Timer */}
        <div className="game-card scale-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Round</p>
              <p className="score-display text-2xl font-bold">{round}<span className="text-muted-foreground text-lg">/{totalRounds}</span></p>
            </div>
            {currentStreak > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-500/10 border border-orange-500/20 text-orange-400">
                🔥{currentStreak}
              </div>
            )}
            {timerEnabled && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Time</p>
                <p className="score-display text-2xl font-bold" style={{ color: timerColor }}>{timeLeft}s</p>
              </div>
            )}
          </div>
          {timerEnabled && (
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${timerPercentage}%`, backgroundColor: timerColor }}
              />
            </div>
          )}
        </div>

        {/* Visual Hint */}
        {hintMode !== 'none' && albumArt && (
          <div className="flex justify-center my-6 slide-up" style={{ animationDelay: "0.1s" }}>
            <div className={`w-48 h-48 rounded-xl overflow-hidden shadow-xl bg-muted/20 relative border border-border/50 ${isPlaying ? 'pulse-glow' : ''}`}>
              <div className="absolute inset-0 flex items-center justify-center opacity-30 text-muted-foreground"><span className="animate-pulse flex items-center gap-2"><div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin"/> Loading Component</span></div>
              
              <div className={`absolute inset-0 z-10 transition-all duration-700 ease-in-out ${
                hintMode === 'progressive' ? 'hint-blur' : 
                hintMode === 'manual' && !isRevealed ? 'manual-blur' : ''
              }`}>
                <img key={round} src={albumArt} className="w-full h-full object-cover" alt="Visual Hint" />
              </div>

              {hintMode === 'manual' && !isRevealed && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10">
                  <button 
                    type="button" 
                    onClick={() => setIsRevealed(true)}
                    className="bg-black/60 hover:bg-black/80 text-white rounded-full p-4 backdrop-blur-md border border-white/20 transition-all transform hover:scale-105 shadow-xl group flex flex-col items-center gap-1"
                  >
                    <Eye className="w-6 h-6 group-hover:text-primary transition-colors" />
                    <span className="text-[10px] uppercase font-bold tracking-wider">Reveal</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Audio Equalizer (If Hints Disabled) */}
        {hintMode === 'none' && (
          <div className="flex justify-center my-8 slide-up" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-end justify-center gap-1.5 h-16 w-16 opacity-70">
              <div className={`w-2 bg-primary rounded-full h-full ${isPlaying ? 'eq-bar' : 'animate-none h-1'}`} />
              <div className={`w-2 bg-primary rounded-full h-full ${isPlaying ? 'eq-bar' : 'animate-none h-1'}`} />
              <div className={`w-2 bg-primary rounded-full h-full ${isPlaying ? 'eq-bar' : 'animate-none h-1'}`} />
              <div className={`w-2 bg-primary rounded-full h-full ${isPlaying ? 'eq-bar' : 'animate-none h-1'}`} />
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4 slide-up" style={{ animationDelay: "0.15s" }}>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Song Name</label>
              <input
                type="text"
                value={song}
                onChange={(e) => updateSong(e.target.value)}
                placeholder="What's playing?"
                className="game-input text-lg"
                autoFocus
              />
            </div>
            <div className={`grid gap-3 ${categories.artist || categories.album || categories.year ? 'grid-cols-2' : ''}`}>
              {categories.artist && (
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Artist</label>
                  <input
                    type="text"
                    value={artist}
                    onChange={(e) => updateArtist(e.target.value)}
                    placeholder="Who sings it?"
                    className="game-input"
                  />
                </div>
              )}
              {categories.album && (
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Album</label>
                  <input
                    type="text"
                    value={album}
                    onChange={(e) => updateAlbum(e.target.value)}
                    placeholder="Which album?"
                    className="game-input"
                  />
                </div>
              )}
              {categories.year && (
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Release Year</label>
                  <input
                    type="number"
                    min={1900}
                    max={new Date().getFullYear()}
                    value={year}
                    onChange={(e) => updateYear(e.target.value)}
                    placeholder="YYYY"
                    className="game-input"
                  />
                </div>
              )}
            </div>
          </div>

          <Button variant="spotify" size="lg" className="w-full" type="submit">
            <Send className="w-4 h-4" />
            Submit Guess
          </Button>
        </form>
      </div>
    </div>
  );
};

export default GamePlay;
