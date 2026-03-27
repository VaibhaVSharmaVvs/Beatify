import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, Check, X } from "lucide-react";

const FEEDBACK_STRINGS = {
  tier0: [
    "Impressive. Not a single thing landed.",
    "You missed… everything. Thoroughly.",
    "That wasn’t even close. That was a different genre.",
    "We checked twice. Still wrong.",
    "If guessing was a sport, you’d be benched.",
    "A bold attempt. Completely incorrect.",
    "You heard music. That’s about it.",
    "Somewhere, the artist felt disrespected.",
    "That wasn’t a guess. That was a protest.",
    "You and the correct answer have never met.",
    "If this was intentional, we’re concerned."
  ],
  tier1: [
    "You tried. That’s the headline.",
    "Confidence high, accuracy… not so much.",
    "Wrong direction, strong commitment.",
    "You’re circling the answer. From very far away.",
    "Close-ish. In spirit.",
    "We admire the creativity, not the result.",
    "That guess had vibes. Just not the right ones.",
    "You almost recognized something. Almost.",
    "You aimed somewhere. Not here though.",
    "Close… in a different universe."
  ],
  tier2: [
    "You got the gist. The gist is all you got.",
    "Somewhere between lucky and intentional.",
    "Not bad. Not good either. Just… present.",
    "You’re warming up. Slowly.",
    "Half right. Half questionable life choices.",
    "That’s progress. We think.",
    "We’ve seen worse. A lot worse.",
    "Functionally acceptable.",
    "Not wrong enough to laugh. Not right enough to celebrate.",
    "Halfway there. The wrong half, mostly.",
    "This feels like educated confusion."
  ],
  tier3: [
    "That was good. Don’t expect a trophy.",
    "Now we’re getting somewhere.",
    "You might actually know music.",
    "Respectable. Suspiciously respectable.",
    "That didn’t feel accidental.",
    "You’re starting to look competent.",
    "We’re cautiously impressed.",
    "That was intentional. Right?"
  ],
  tier4: [
    "At this point you’re just showing off.",
    "Okay, music nerd.",
    "That was annoyingly accurate.",
    "You’re making this look easy.",
    "We get it. You have ears.",
    "That was clean. Too clean.",
    "You didn’t guess. You knew.",
    "Starting to feel unfair.",
    "That wasn’t luck. We hope.",
    "This is bordering on skill.",
    "You’re cooking now."
  ],
  tier5: [
    "Don't lie, you peeked spotify didn't you!",
    "Perfect. Suspiciously perfect.",
    "We’d accuse you of cheating, but we’re impressed.",
    "Flawless. Annoyingly flawless.",
    "You heard one note and knew. Disgusting.",
    "That was surgical.",
    "You didn’t guess. You executed.",
    "We’re not impressed. We’re concerned.",
    "Anybody can shazam on their phone.",
    "Flawless. We have nothing to add.",
    "Are you okay?"
  ]
};

interface RoundResultProps {
  albumArt: string;
  songName: string;
  artists: string;
  albumName: string;
  releaseYear: string;
  pointsEarned: number;
  maxScore: number;
  isCorrect: boolean;
  categories: { artist: boolean; album: boolean; year: boolean };
  onNextRound: () => void;
}

const RoundResult = ({ albumArt, songName, artists, albumName, releaseYear, pointsEarned, maxScore, isCorrect, categories, onNextRound }: RoundResultProps) => {
  const [feedbackText, setFeedbackText] = useState("");
  const [badgeHue, setBadgeHue] = useState(0);

  // Play dynamic SFX based on score percentage
  useEffect(() => {
    const percentage = maxScore > 0 ? (pointsEarned / maxScore) * 100 : 0;
    
    // Map text arrays
    let tierArray;
    let soundFile = "";
    if (percentage === 0) {
      tierArray = FEEDBACK_STRINGS.tier0;
      soundFile = "game fail.mp3";
    } else if (percentage <= 25) {
      tierArray = FEEDBACK_STRINGS.tier1;
      soundFile = "error call to attention.mp3";
    } else if (percentage <= 50) {
      tierArray = FEEDBACK_STRINGS.tier2;
      soundFile = "noot noot.mp3";
    } else if (percentage <= 75) {
      tierArray = FEEDBACK_STRINGS.tier3;
      soundFile = "bell chime.mp3";
    } else if (percentage < 100) {
      tierArray = FEEDBACK_STRINGS.tier4;
      soundFile = "game level complete.mp3";
    } else {
      tierArray = FEEDBACK_STRINGS.tier5;
      soundFile = "violin win.mp3";
    }

    // Set Random Text safely on mount
    setFeedbackText(tierArray[Math.floor(Math.random() * tierArray.length)]);
    
    // Calculate CSS Color interpolation. 0 hue is solid red, 130 hue is rich green.
    setBadgeHue(Math.floor((percentage / 100) * 130));

    const audio = new Audio(`/audio/${soundFile}`);
    audio.volume = 0.5;
    audio.play().catch(e => console.error("Audio playback blocked by browser:", e));
  }, [pointsEarned, maxScore]);

  return (
    <div className="min-h-screen px-4 py-8 flex items-center justify-center">
      <div className="max-w-sm w-full space-y-6 text-center">
        {/* Result badge */}
        <div className="fade-in">
          <div 
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border transition-colors duration-1000 ease-out"
            style={{
              backgroundColor: `hsl(${badgeHue} 80% 45% / 0.15)`,
              color: `hsl(${badgeHue} 80% 65%)`,
              borderColor: `hsl(${badgeHue} 80% 45% / 0.3)`,
            }}
          >
            {isCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {feedbackText}
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
