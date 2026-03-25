import { Button } from "@/components/ui/button";
import { ChevronRight, Check, X } from "lucide-react";

interface RoundResultProps {
  albumArt: string;
  songName: string;
  artists: string;
  albumName: string;
  releaseYear: string;
  pointsEarned: number;
  isCorrect: boolean;
  categories: { artist: boolean; album: boolean; year: boolean };
  onNextRound: () => void;
}

const RoundResult = ({ albumArt, songName, artists, albumName, releaseYear, pointsEarned, isCorrect, categories, onNextRound }: RoundResultProps) => {
  return (
    <div className="min-h-screen px-4 py-8 flex items-center justify-center">
      <div className="max-w-sm w-full space-y-6 text-center">
        {/* Result badge */}
        <div className="fade-in">
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
            isCorrect
              ? "bg-primary/15 text-primary border border-primary/30"
              : "bg-[hsl(var(--game-error))]/15 text-[hsl(var(--game-error))] border border-[hsl(var(--game-error))]/30"
          }`}>
            {isCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {isCorrect ? "Correct!" : "Not quite..."}
          </div>
        </div>

        {/* Points */}
        <div className="scale-in" style={{ animationDelay: "0.1s" }}>
          <p className={`score-display text-4xl font-bold ${isCorrect ? "text-primary glow-text" : "text-muted-foreground"}`}>
            +{pointsEarned}
          </p>
          <p className="text-sm text-muted-foreground mt-1">points</p>
        </div>

        {/* Album Art */}
        <div className="slide-up mx-auto w-48 h-48" style={{ animationDelay: "0.15s" }}>
          <img
            src={albumArt}
            alt={albumName}
            className="cover-image w-full h-full"
          />
        </div>

        {/* Song Info */}
        <div className="slide-up space-y-1" style={{ animationDelay: "0.2s" }}>
          <h3 className="text-xl font-bold">{songName}</h3>
          {categories.artist && <p className="text-muted-foreground">{artists}</p>}
          {categories.album && <p className="text-sm text-muted-foreground/80">{albumName}</p>}
          {categories.year && <p className="text-sm text-muted-foreground/60">Released: {releaseYear}</p>}
        </div>

        {/* Next Round */}
        <div className="slide-up" style={{ animationDelay: "0.3s" }}>
          <Button variant="spotify" size="lg" className="w-full" onClick={onNextRound}>
            Next Round
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoundResult;
