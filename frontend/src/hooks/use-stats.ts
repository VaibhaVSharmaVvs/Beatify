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
        const [roundsRes, sessionsRes] = await Promise.all([
          supabase.from('round_results').select('*').eq('spotify_id', spotifyId),
          supabase.from('game_sessions').select('id, playlist_name').eq('spotify_id', spotifyId),
        ]);

        const rounds = roundsRes.data ?? [];
        const sessions = sessionsRes.data ?? [];

        // Personal stats
        const totalRounds = rounds.length;
        const totalScore = rounds.reduce((s, r) => s + r.points_earned, 0);
        const maxPossibleScore = rounds.reduce((s, r) => s + r.max_points, 0);
        const overallAccuracy = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

        const times = rounds.filter(r => r.response_time != null).map(r => r.response_time as number);
        const avgResponseTime = times.length > 0 ? times.reduce((a, b) => a + b) / times.length : null;

        // Best streak — compute per session, then take max
        const sessionGroups: Record<string, typeof rounds> = {};
        rounds.forEach(r => {
          if (!sessionGroups[r.session_id]) sessionGroups[r.session_id] = [];
          sessionGroups[r.session_id].push(r);
        });
        let bestStreak = 0;
        Object.values(sessionGroups).forEach(group => {
          let cur = 0;
          group.forEach(r => {
            if (r.points_earned >= r.max_points) {
              cur++;
              if (cur > bestStreak) bestStreak = cur;
            } else {
              cur = 0;
            }
          });
        });

        // Playlist accuracy — join with sessions
        const sessionMap: Record<string, string> = {};
        sessions.forEach(s => { sessionMap[s.id] = s.playlist_name; });

        const buildAccuracyMap = (keyFn: (r: any) => string) => {
          const map: Record<string, { score: number; max: number; rounds: number }> = {};
          rounds.forEach(r => {
            const k = keyFn(r);
            if (!k) return;
            if (!map[k]) map[k] = { score: 0, max: 0, rounds: 0 };
            map[k].score += r.points_earned;
            map[k].max += r.max_points;
            map[k].rounds++;
          });
          return Object.entries(map)
            .map(([name, v]) => ({ name, rounds: v.rounds, accuracy: v.max > 0 ? (v.score / v.max) * 100 : 0 }))
            .sort((a, b) => b.accuracy - a.accuracy)
            .slice(0, 5);
        };

        const topPlaylists = buildAccuracyMap(r => sessionMap[r.session_id] ?? '');
        const topArtists = buildAccuracyMap(r => r.artist_name ?? '');
        const topEras = buildAccuracyMap(r => {
          const y = (r.release_year ?? '').slice(0, 3);
          return y ? y + '0s' : '';
        }).sort((a, b) => {
          // sort by accuracy desc already done, but use era name as secondary
          return b.accuracy - a.accuracy;
        });

        setStats({ totalRounds, totalScore, maxPossibleScore, overallAccuracy, avgResponseTime, bestStreak, topPlaylists, topArtists, topEras });
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
