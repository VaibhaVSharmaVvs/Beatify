import { Button } from "@/components/ui/button";
import { RotateCcw, Trophy, Loader2, Gauge, Flame, Target } from "lucide-react";

interface GameOverProps {
  totalScore: number;
  totalRounds: number;
  categories: { artist: boolean; album: boolean; year: boolean };
  history: any[];
  isStartingGame: boolean;
  onPlayAgain: () => void;
  onChangeSettings: () => void;
}

const GameOver = ({ totalScore, totalRounds, categories, history, isStartingGame, onPlayAgain, onChangeSettings }: GameOverProps) => {
  let maxStreak = 0;
  let currentStreak = 0;
  let totalResponseTime = 0;
  let validResponseCount = 0;
  let fastestTime = 999;
  
  let nameHits = 0, artistHits = 0, albumHits = 0, yearHits = 0;

  history.forEach(song => {
    // Streaks - use >= so featured artist bonus points above max don't break the chain
    if (song.points_earned >= song.max_score_per_round) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }

    // Response Time
    if (song.response_time !== null && song.response_time !== undefined) {
      totalResponseTime += song.response_time;
      validResponseCount++;
      fastestTime = Math.min(fastestTime, song.response_time);
    }

    // Accuracies
    if (song.field_scores?.name) nameHits++;
    if (song.field_scores?.artist) artistHits++;
    if (song.field_scores?.album) albumHits++;
    if (song.field_scores?.year) yearHits++;
  });

  const avgTime = validResponseCount > 0 ? (totalResponseTime / validResponseCount).toFixed(1) : "-";
  const bestTime = fastestTime !== 999 ? `${fastestTime.toFixed(1)}s` : "-";
  const isPerfectGame = maxStreak === totalRounds && totalRounds > 0;

  return (
    <div className="min-h-screen px-4 py-8 flex flex-col items-center justify-start overflow-y-auto">
      <div className="max-w-xl w-full space-y-6 text-center mt-6">
        {/* Game Over Title & Trophy */}
        <div className="fade-in space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20">
            <Trophy className="w-7 h-7 text-primary" />
          </div>
          <div className="scale-in space-y-1">
            <h2 className="text-2xl font-bold leading-tight">Match Complete</h2>
            <p className="text-sm text-muted-foreground">Here's your post-game performance</p>
          </div>
        </div>

        {/* Hero Meta Group */}
        <div className="game-card slide-up mx-auto w-full relative overflow-hidden" style={{ animationDelay: "0.10s" }}>
          {maxStreak > 0 && (
            <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
              isPerfectGame
                ? 'bg-orange-500/20 border border-orange-400/40 text-orange-300'
                : 'bg-orange-500/10 border border-orange-500/20 text-orange-500 animate-pulse'
            }`}
              style={isPerfectGame ? { animation: 'firePulse 0.6s ease-in-out infinite alternate' } : {}}
            >
              <Flame className={`w-3.5 h-3.5 ${isPerfectGame ? 'fill-orange-300' : 'fill-orange-500'}`} />
              {isPerfectGame ? `${maxStreak} PERFECT!` : `${maxStreak} Streak`}
            </div>
          )}
          
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Overall Score</p>
          <div className="flex justify-center items-end gap-1.5">
            <p className="score-display text-5xl font-bold text-primary glow-text">{totalScore}</p>
            <p className="text-2xl text-muted-foreground font-medium mb-1">/{ (history[0]?.max_score_per_round * totalRounds) || (totalRounds * 10) }</p>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-2 gap-3 slide-up" style={{ animationDelay: "0.15s" }}>
          {/* Reaction Speeds */}
          <div className="game-card p-3 space-y-3 bg-secondary/30">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
              <Gauge className="w-3.5 h-3.5" />
              <p className="text-[10px] uppercase tracking-wider font-semibold">Reflex Time</p>
            </div>
            <div className="grid grid-cols-2 gap-2 divide-x divide-border">
              <div className="flex flex-col items-center text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Average</p>
                <p className="text-lg font-bold text-primary">{avgTime}{avgTime !== "-" && "s"}</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Fastest</p>
                <p className="text-lg font-bold text-primary">{bestTime}</p>
              </div>
            </div>
          </div>

          {/* Hit Ratio Grid */}
          <div className="game-card p-3 space-y-2 bg-secondary/30">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
              <Target className="w-3.5 h-3.5" />
              <p className="text-[10px] uppercase tracking-wider font-semibold">Hit Accuracy</p>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="bg-background rounded flex items-center justify-between px-2 py-1 border border-border">
                <p className="text-[9px] text-muted-foreground uppercase">Title</p>
                <p className="text-xs font-bold">{Math.round((nameHits / totalRounds) * 100)}%</p>
              </div>
              {categories.artist && (
                <div className="bg-background rounded flex items-center justify-between px-2 py-1 border border-border">
                  <p className="text-[9px] text-muted-foreground uppercase">Artist</p>
                  <p className="text-xs font-bold">{Math.round((artistHits / totalRounds) * 100)}%</p>
                </div>
              )}
              {categories.album && (
                <div className="bg-background rounded flex items-center justify-between px-2 py-1 border border-border">
                  <p className="text-[9px] text-muted-foreground uppercase">Album</p>
                  <p className="text-xs font-bold">{Math.round((albumHits / totalRounds) * 100)}%</p>
                </div>
              )}
              {categories.year && (
                <div className="bg-background rounded flex items-center justify-between px-2 py-1 border border-border">
                  <p className="text-[9px] text-muted-foreground uppercase">Year</p>
                  <p className="text-xs font-bold">{Math.round((yearHits / totalRounds) * 100)}%</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Songs Played History */}
        <div className="slide-up space-y-2 w-full pt-2" style={{ animationDelay: "0.2s" }}>
          <p className="text-xs text-muted-foreground uppercase tracking-wider text-left pl-2">Match History</p>
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x flex-nowrap align-top">
            {history.map((song, i) => (
              <div key={i} className="flex-none w-[140px] snap-start">
                <div className="w-[140px] h-[140px] mb-2 relative group rounded-xl overflow-hidden border border-border/50">
                  <img src={song.image_url} alt={song.correct_name} className="cover-image w-full h-full group-hover:scale-105 transition-transform duration-500" />
                  
                  {/* Point Badge */}
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md rounded-full px-2 py-0.5 text-xs font-bold text-white border border-white/10 shadow-lg">
                    +{song.points_earned}
                  </div>

                  {/* Field Breakdown Grid Footer */}
                  <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex justify-center gap-1">
                    <div className={`w-3.5 h-1.5 rounded-sm ${song.field_scores?.name ? 'bg-primary shadow-[0_0_5px_rgba(34,197,94,0.4)]' : 'bg-destructive shadow-[0_0_5px_rgba(239,68,68,0.4)]'}`} title="Song Target" />
                    {categories.artist && <div className={`w-3.5 h-1.5 rounded-sm ${song.field_scores?.artist ? 'bg-primary shadow-[0_0_5px_rgba(34,197,94,0.4)]' : 'bg-destructive shadow-[0_0_5px_rgba(239,68,68,0.4)]'}`} title="Artist Target" />}
                    {categories.album && <div className={`w-3.5 h-1.5 rounded-sm ${song.field_scores?.album ? 'bg-primary shadow-[0_0_5px_rgba(34,197,94,0.4)]' : 'bg-destructive shadow-[0_0_5px_rgba(239,68,68,0.4)]'}`} title="Album Target" />}
                    {categories.year && <div className={`w-3.5 h-1.5 rounded-sm ${song.field_scores?.year ? 'bg-primary shadow-[0_0_5px_rgba(34,197,94,0.4)]' : 'bg-destructive shadow-[0_0_5px_rgba(239,68,68,0.4)]'}`} title="Year Target" />}
                  </div>
                </div>
                <p className="font-semibold text-sm truncate text-center px-1">{song.correct_name}</p>
                <p className="text-xs text-muted-foreground truncate text-center px-1">{song.correct_artist}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="slide-up max-w-sm mx-auto space-y-3 pt-4 pb-8" style={{ animationDelay: "0.25s" }}>
          <Button variant="spotify" size="lg" className="w-full" onClick={onPlayAgain} disabled={isStartingGame}>
            {isStartingGame ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading Tracks...
              </span>
            ) : (
              <>
                <RotateCcw className="w-5 h-5 mr-2" />
                Play Again (Same Settings)
              </>
            )}
          </Button>
          <Button variant="outline" size="lg" className="w-full bg-transparent border-card hover:bg-card/50" onClick={onChangeSettings} disabled={isStartingGame}>
            Change Settings / Playlist
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;
