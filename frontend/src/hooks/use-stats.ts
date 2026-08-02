import { useState, useEffect } from 'react';
import { getStats } from '../api';

export interface TopEntry {
  name: string;
  rounds: number;
  accuracy: number;
}

export interface PlayerStats {
  totalRounds: number;
  totalScore: number;
  maxPossibleScore: number;
  overallAccuracy: number;
  avgResponseTime: number | null;
  bestStreak: number;
  topPlaylists: TopEntry[];
  topArtists: TopEntry[];
  topEras: TopEntry[];
}

export function useStats(spotifyId: string | null) {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // spotifyId is no longer sent to the server — the backend derives identity
    // from the access token — but it still gates the fetch and re-triggers it
    // when the signed-in user changes.
    if (!spotifyId) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const { data } = await getStats();
        if (data) setStats(data as PlayerStats);
      } catch (err) {
        console.error('[useStats] fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [spotifyId]);

  return { stats, loading };
}
