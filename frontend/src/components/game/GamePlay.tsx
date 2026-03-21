import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface GamePlayProps {
  score: number;
  round: number;
  totalRounds: number;
  timeLeft: number;
  timerEnabled: boolean;
  onSubmitGuess: (guess: { song: string; artist: string; album: string }) => void;
}

const GamePlay = ({ score, round, totalRounds, timeLeft, timerEnabled, onSubmitGuess }: GamePlayProps) => {
  const [song, setSong] = useState("");
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitGuess({ song, artist, album });
    setSong("");
    setArtist("");
    setAlbum("");
  };

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
          <div className="game-badge">● Online</div>
        </div>

        {/* Round & Timer */}
        <div className="game-card scale-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Round</p>
              <p className="score-display text-2xl font-bold">{round}<span className="text-muted-foreground text-lg">/{totalRounds}</span></p>
            </div>
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

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4 slide-up" style={{ animationDelay: "0.15s" }}>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Song Name</label>
              <input
                type="text"
                value={song}
                onChange={(e) => setSong(e.target.value)}
                placeholder="What's playing?"
                className="game-input text-lg"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Artist</label>
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Who sings it?"
                  className="game-input"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5 block">Album</label>
                <input
                  type="text"
                  value={album}
                  onChange={(e) => setAlbum(e.target.value)}
                  placeholder="Which album?"
                  className="game-input"
                />
              </div>
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
