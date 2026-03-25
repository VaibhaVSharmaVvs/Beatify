import { useState } from "react";
import { BookOpen, X, Music, Target, Trophy, Settings, Timer, Pause } from "lucide-react";

const Rulebook = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="relative group">
        <div className="absolute inset-0 rounded-full bg-primary/40 animate-ping opacity-75" />
        <button
          onClick={() => setOpen(true)}
          className="relative inline-flex items-center justify-center w-14 h-14 rounded-full bg-card border-2 border-primary text-primary shadow-[0_0_20px_rgba(29,185,84,0.4)] hover:bg-primary hover:text-primary-foreground hover:scale-110 transition-all duration-300 active:scale-95"
          aria-label="How to Play"
        >
          <BookOpen className="w-7 h-7" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm fade-in"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto game-card border-border/80 slide-up z-10">
            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-6">
              {/* Title */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">How to Play</h2>
              </div>

              {/* Aim */}
              <section className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <Target className="w-4 h-4" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider">Objective</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Listen to a short clip from your Spotify playlist and guess the <span className="text-foreground font-medium">song name</span>, <span className="text-foreground font-medium">artist</span>, and <span className="text-foreground font-medium">album</span>. Score as many points as you can across all rounds.
                </p>
                <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 mt-3">
                  <p className="text-xs text-primary/90">
                    <span className="font-semibold">💿 Singles & No Albums:</span> If a song doesn't belong to a larger album, simply type <span className="font-bold">"single", "none", or the exact song name again</span> to natively earn all 3 album points!
                  </p>
                </div>
              </section>

              {/* Scoring */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <Trophy className="w-4 h-4" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider">Scoring</h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Song Name", pts: "5 pts" },
                    { label: "Album (or 'Single')", pts: "3 pts" },
                    { label: "Primary Artist", pts: "2 pts" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl bg-muted/60 border border-border/40 p-3 text-center flex flex-col items-center justify-center"
                    >
                      <p className="score-display text-lg text-primary leading-tight">{item.pts}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-tight">{item.label}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-primary/10 border border-primary/20 p-3">
                  <p className="text-xs text-primary/90">
                    <span className="font-semibold">✨ Featured Artist Bonus:</span> Earn a stacking <span className="font-bold">+1 pt</span> for every additional featured artist you correctly guess on a single track!
                  </p>
                </div>
              </section>

              {/* Difficulty */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-primary">
                  <Music className="w-4 h-4" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider">Difficulty</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Difficulty controls how long the audio clip plays before you have to guess:
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    { level: "Easy", time: "10 seconds" },
                    { level: "Medium", time: "5 seconds" },
                    { level: "Hard", time: "3 seconds" },
                    { level: "Impossible", time: "1 second" },
                  ].map((d) => (
                    <div key={d.level} className="flex justify-between rounded-lg bg-muted/40 px-3 py-2">
                      <span className="text-foreground font-medium">{d.level}</span>
                      <span className="text-muted-foreground score-display">{d.time}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Settings */}
              <section className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <Settings className="w-4 h-4" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider">Settings</h3>
                </div>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span><span className="text-foreground font-medium">Rounds</span> — choose 1 to 20 rounds per game.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span><span className="text-foreground font-medium">Answer Timer</span> — toggle on/off and set between 10–60 seconds.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span><span className="text-foreground font-medium">Playlist</span> — pick any playlist from your Spotify library.</span>
                  </li>
                </ul>
              </section>

              {/* Tip */}
              <div className="rounded-xl bg-primary/8 border border-primary/15 p-3">
                <p className="text-xs text-primary/80">
                  💡 <span className="font-medium text-primary">Pro tip:</span> Even partial guesses score — fill in whatever you know before time runs out.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Rulebook;
