import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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
    if (!spotifyId) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_player_stats', {
          target_spotify_id: spotifyId
        });

        if (error) {
          console.error('[useStats] Supabase RPC error:', error);
          throw error;
        }

        if (data) {
          setStats(data as PlayerStats);
        }
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
