import { Trophy, Gauge, Target, Flame, Music, Clock } from "lucide-react";
import { PlayerStats, TopEntry } from "@/hooks/use-stats";

/** Shared skeleton row */
const SkeletonRow = ({ cols = 3 }: { cols?: number }) => (
  <div className={`flex gap-2 items-center`}>
    {Array.from({ length: cols }).map((_, i) => (
      <div key={i} className={`h-3 rounded bg-muted/50 animate-pulse ${i === 0 ? "flex-1" : "w-12"}`} />
    ))}
  </div>
);

/** Accuracy badge color */
const accColor = (pct: number) => {
  if (pct >= 80) return "text-primary";
  if (pct >= 50) return "text-[hsl(var(--game-warning))]";
  return "text-[hsl(var(--game-error))]";
};

/** Table used in left panel */
interface AccuracyTableProps {
  title: string;
  icon: React.ReactNode;
  rows: TopEntry[];
  loading: boolean;
  nameLabel?: string;
}

const AccuracyTable = ({ title, icon, rows, loading, nameLabel = "Name" }: AccuracyTableProps) => (
  <div className="game-card space-y-3">
    <div className="flex items-center gap-2 text-primary">
      <span className="w-4 h-4 shrink-0">{icon}</span>
      <h3 className="text-xs font-semibold uppercase tracking-wider">{title}</h3>
    </div>

    {/* Header */}
    <div className="grid grid-cols-[1fr_50px_60px] gap-x-4 text-[10px] text-muted-foreground uppercase tracking-wider border-b border-border/40 pb-1">
      <span>{nameLabel}</span>
      <span className="text-center">Rounds</span>
      <span className="text-right">Accuracy</span>
    </div>

    <div className="space-y-2">
      {loading
        ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={3} />)
        : rows.length === 0
        ? (
          <div className="grid grid-cols-[1fr_50px_60px] gap-x-4 text-xs text-muted-foreground py-0.5">
            <span className="truncate text-muted-foreground/50">—</span>
            <span className="text-center text-muted-foreground/50">—</span>
            <span className="text-right text-muted-foreground/50">—</span>
          </div>
        )
        : rows.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_50px_60px] gap-x-4 items-center text-xs">
              <span className="truncate font-medium" title={row.name}>{row.name}</span>
              <span className="text-center text-muted-foreground tabular-nums">{row.rounds}</span>
              <span className={`text-right font-semibold tabular-nums score-display ${accColor(row.accuracy)}`}>
                {row.accuracy.toFixed(0)}%
              </span>
            </div>
          ))}
    </div>
  </div>
);

/** Left panel — three accuracy tables */
export const StatsDashboardLeft = ({ stats, loading }: { stats: PlayerStats | null; loading: boolean }) => (
  <div className="space-y-4">
    <AccuracyTable
      title="Top Playlists"
      icon={<Music className="w-4 h-4" />}
      rows={stats?.topPlaylists ?? []}
      loading={loading}
      nameLabel="Playlist"
    />
    <AccuracyTable
      title="Top Artists"
      icon={<Target className="w-4 h-4" />}
      rows={stats?.topArtists ?? []}
      loading={loading}
      nameLabel="Artist"
    />
    <AccuracyTable
      title="Top Eras"
      icon={<Clock className="w-4 h-4" />}
      rows={(stats?.topEras ?? []).map(e => ({ ...e, name: e.name }))}
      loading={loading}
      nameLabel="Era"
    />
  </div>
);

/** Right panel — personal stats card */
export const StatsDashboardRight = ({ stats, loading }: { stats: PlayerStats | null; loading: boolean }) => {
  const val = (v: string | number | null, suffix = ""): React.ReactNode => {
    if (loading) return <div className="h-4 w-12 rounded bg-muted/50 animate-pulse inline-block" />;
    if (v === null || v === undefined) return <span className="text-muted-foreground/40">—</span>;
    return <span className="score-display">{v}{suffix}</span>;
  };

  const rows: { icon: React.ReactNode; label: string; display: React.ReactNode }[] = [
    {
      icon: <Target className="w-4 h-4 text-primary" />,
      label: "Rounds Played",
      display: val(stats?.totalRounds ?? null),
    },
    {
      icon: <Trophy className="w-4 h-4 text-primary" />,
      label: "Total Points",
      display: val(stats?.totalScore ?? null),
    },
    {
      icon: <Gauge className="w-4 h-4 text-primary" />,
      label: "Avg Response",
      display: val(
        stats?.avgResponseTime != null ? stats.avgResponseTime.toFixed(1) : null,
        "s"
      ),
    },
    {
      icon: <Music className="w-4 h-4 text-primary" />,
      label: "Overall Accuracy",
      display: loading
        ? <div className="h-4 w-12 rounded bg-muted/50 animate-pulse inline-block" />
        : stats == null
        ? <span className="text-muted-foreground/40">—</span>
        : (
          <span className={`score-display ${accColor(stats.overallAccuracy)}`}>
            {stats.overallAccuracy.toFixed(0)}%
          </span>
        ),
    },
    {
      icon: <Flame className="w-4 h-4 text-orange-500" />,
      label: "Best Streak",
      display: val(stats?.bestStreak ?? null),
    },
  ];

  return (
    <div className="game-card space-y-4">
      <div className="flex items-center gap-2 text-primary">
        <Trophy className="w-4 h-4" />
        <h3 className="text-xs font-semibold uppercase tracking-wider">Your Stats</h3>
      </div>

      <div className="space-y-3">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-muted-foreground min-w-0">
              {row.icon}
              <span className="text-xs">{row.label}</span>
            </div>
            <div className="text-sm font-bold text-foreground shrink-0">{row.display}</div>
          </div>
        ))}
      </div>

      {!loading && stats?.totalRounds === 0 && (
        <p className="text-[11px] text-muted-foreground/60 text-center pt-1 border-t border-border/30">
          Play your first game to fill this in!
        </p>
      )}
    </div>
  );
};
