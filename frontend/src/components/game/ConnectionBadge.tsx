import { cn } from "@/lib/utils";

interface ConnectionBadgeProps {
  connected?: boolean;
  className?: string;
}

/**
 * Spotify Web Playback SDK connection state.
 *
 * Replaces two copies of the same pill that were built from inline styles.
 * The live state gets an expanding ring rather than a plain opacity blink —
 * a status light that breathes reads as "connected device", which is what
 * this actually reports.
 */
const ConnectionBadge = ({ connected, className }: ConnectionBadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium shrink-0",
      connected
        ? "bg-primary/10 text-primary border-primary/20"
        : "bg-muted/40 text-muted-foreground border-border",
      className
    )}
  >
    <span className="relative flex w-2 h-2 shrink-0">
      {connected && (
        <span className="status-ping absolute inset-0 rounded-full bg-primary" aria-hidden="true" />
      )}
      <span
        className={cn(
          "relative w-2 h-2 rounded-full",
          connected ? "bg-primary" : "bg-muted-foreground"
        )}
      />
    </span>
    {connected ? "Online" : "Offline"}
  </span>
);

export default ConnectionBadge;
