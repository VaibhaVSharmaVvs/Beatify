import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import LogoMark from "./LogoMark";

interface BrandLockupProps {
  size?: "sm" | "lg";
  /** Replaces the default "Guess The Song" line. Rendered in the micro-label slot. */
  descriptor?: ReactNode;
  className?: string;
}

/**
 * Logo tile + wordmark + descriptor.
 *
 * The descriptor deliberately drops two tiers below the wordmark rather than
 * sitting beside it at the same size — a tagline set at display weight
 * competes with the brand and flattens the hierarchy. It uses the same
 * micro-label treatment as the "Leaderboards" / "Your Stats" column headings,
 * so the header reads as part of the same system rather than a banner bolted
 * on top of it.
 */
const SIZES = {
  sm: {
    tile: "w-9 h-9 rounded-xl",
    gap: "gap-2.5",
    word: "text-xl",
    desc: "text-[9px] tracking-[0.16em] mt-1",
  },
  lg: {
    tile: "w-12 h-12 rounded-2xl",
    gap: "gap-3.5",
    word: "text-[28px] sm:text-3xl",
    desc: "text-[10px] tracking-[0.18em] mt-1.5",
  },
} as const;

const BrandLockup = ({ size = "lg", descriptor = "Guess The Song", className }: BrandLockupProps) => {
  const s = SIZES[size];

  return (
    <div className={cn("flex items-center", s.gap, className)}>
      <div
        className={cn(
          "flex items-center justify-center shrink-0 bg-primary/10 border border-primary/20",
          s.tile
        )}
      >
        {/* The mark's own artwork carries its padding, so it fills the tile. */}
        <LogoMark className="w-full h-full text-primary" />
      </div>

      <div className="min-w-0">
        <h1 className={cn("font-bold tracking-[-0.02em] leading-none glow-text", s.word)}>
          Beatify
        </h1>
        <p
          className={cn(
            "font-semibold uppercase text-muted-foreground leading-none truncate",
            s.desc
          )}
        >
          {descriptor}
        </p>
      </div>
    </div>
  );
};

export default BrandLockup;
