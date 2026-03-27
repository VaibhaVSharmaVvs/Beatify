import { Button } from "@/components/ui/button";
import { RotateCcw, Trophy } from "lucide-react";

interface GameOverProps {
  totalScore: number;
  totalRounds: number;
  history: any[];
  onPlayAgain: () => void;
  onChangeSettings: () => void;
}

const GameOver = ({ totalScore, totalRounds, history, onPlayAgain, onChangeSettings }: GameOverProps) => {
  return (
    <div className="min-h-screen px-4 py-8 flex items-center justify-center">
      <div className="max-w-xl w-full space-y-8 text-center">
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
        <div className="game-card slide-up mx-auto max-w-sm" style={{ animationDelay: "0.15s" }}>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Score</p>
          <div className="flex justify-center items-end gap-1">
            <p className="score-display text-5xl font-bold text-primary glow-text">{totalScore}</p>
            <p className="text-2xl text-muted-foreground font-medium mb-1">/{ (history[0]?.max_score_per_round * totalRounds) || (totalRounds * 10) }</p>
          </div>
          <p className="text-sm text-muted-foreground mt-2">across {totalRounds} rounds</p>
        </div>

        {/* Songs Played History */}
        <div className="slide-up space-y-3 w-full" style={{ animationDelay: "0.2s" }}>
          <p className="text-xs text-muted-foreground uppercase tracking-wider text-left pl-2">Songs Played</p>
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x flex-nowrap align-top">
            {history.map((song, i) => (
              <div key={i} className="flex-none w-32 snap-start">
                <div className="w-32 h-32 mb-2 relative">
                  <img src={song.image_url} alt={song.correct_name} className="cover-image w-full h-full" />
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md rounded-full px-2 py-0.5 text-xs font-bold text-white border border-white/10">
                    +{song.points_earned}
                  </div>
                </div>
                <p className="font-semibold text-sm truncate text-left">{song.correct_name}</p>
                <p className="text-xs text-muted-foreground truncate text-left">{song.correct_artist}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="slide-up max-w-sm mx-auto space-y-3 pt-6" style={{ animationDelay: "0.3s" }}>
          <Button variant="spotify" size="lg" className="w-full" onClick={onPlayAgain}>
            <RotateCcw className="w-5 h-5 mr-2" />
            Play Again (Same Settings)
          </Button>
          <Button variant="outline" size="lg" className="w-full bg-transparent border-card hover:bg-card/50" onClick={onChangeSettings}>
            Change Settings / Playlist
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;
