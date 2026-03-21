import { Button } from "@/components/ui/button";
import { RotateCcw, Trophy } from "lucide-react";

interface GameOverProps {
  totalScore: number;
  totalRounds: number;
  lastSongImage: string;
  lastSongName: string;
  lastSongArtist: string;
  onPlayAgain: () => void;
}

const GameOver = ({ totalScore, totalRounds, lastSongImage, lastSongName, lastSongArtist, onPlayAgain }: GameOverProps) => {
  return (
    <div className="min-h-screen px-4 py-8 flex items-center justify-center">
      <div className="max-w-sm w-full space-y-8 text-center">
        {/* Trophy */}
        <div className="fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
        </div>

        {/* Game Over Title */}
        <div className="scale-in space-y-2" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-3xl font-bold">Game Over</h2>
          <p className="text-muted-foreground">Here's how you did</p>
        </div>

        {/* Score Card */}
        <div className="game-card slide-up" style={{ animationDelay: "0.15s" }}>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Score</p>
          <p className="score-display text-5xl font-bold text-primary glow-text">{totalScore}</p>
          <p className="text-sm text-muted-foreground mt-2">across {totalRounds} rounds</p>
        </div>

        {/* Last Song */}
        <div className="slide-up space-y-3" style={{ animationDelay: "0.2s" }}>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Last Song</p>
          <div className="mx-auto w-36 h-36">
            <img src={lastSongImage} alt={lastSongName} className="cover-image w-full h-full" />
          </div>
          <div>
            <p className="font-semibold">{lastSongName}</p>
            <p className="text-sm text-muted-foreground">{lastSongArtist}</p>
          </div>
        </div>

        {/* Play Again */}
        <div className="slide-up" style={{ animationDelay: "0.3s" }}>
          <Button variant="spotify" size="xl" className="w-full" onClick={onPlayAgain}>
            <RotateCcw className="w-5 h-5" />
            Play Again
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;
