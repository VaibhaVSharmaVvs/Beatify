interface LogoMarkProps {
  className?: string;
}

/**
 * The Beatify waveform, bars only.
 *
 * `public/favicon.svg` bakes in an opaque near-black plate because a browser
 * tab icon needs its own background. Reusing it inside the app put a dark chip
 * inside a light tile in light mode. These bars carry no plate and inherit
 * `currentColor`, so the mark tracks the theme's primary exactly rather than
 * the hardcoded #22c55e the favicon uses.
 */
const LogoMark = ({ className }: LogoMarkProps) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true" focusable="false">
    <rect x="14" y="28" width="4" height="8" rx="2" fill="currentColor" opacity="0.55" />
    <rect x="21" y="20" width="4" height="24" rx="2" fill="currentColor" opacity="0.75" />
    <rect x="28" y="14" width="4" height="36" rx="2" fill="currentColor" />
    <rect x="35" y="18" width="4" height="28" rx="2" fill="currentColor" opacity="0.85" />
    <rect x="42" y="24" width="4" height="16" rx="2" fill="currentColor" opacity="0.7" />
    <rect x="49" y="30" width="4" height="4" rx="2" fill="currentColor" opacity="0.45" />
    <circle cx="53" cy="14" r="2.5" fill="currentColor" opacity="0.3" />
  </svg>
);

export default LogoMark;
