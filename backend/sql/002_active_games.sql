-- Beatify — migration 002
-- Run this in the Supabase SQL editor before deploying the backend.
--
-- Two changes:
--   1. Adds `active_games`, so in-flight game state survives a process
--      restart and can be served by more than one backend instance.
--   2. Revokes browser-level (anon) access to game data. The frontend no
--      longer talks to Supabase directly; every read goes through FastAPI,
--      which verifies the caller's Spotify token first.

-- ---------------------------------------------------------------------------
-- 1. Active game state
-- ---------------------------------------------------------------------------

create table if not exists public.active_games (
    spotify_id  text        primary key,
    state       jsonb       not null,
    updated_at  timestamptz not null default now()
);

-- No foreign key to players on purpose: the login-time upsert into players is
-- best-effort, and a missing row there should not block someone from playing.

create index if not exists active_games_updated_at_idx
    on public.active_games (updated_at);

alter table public.active_games enable row level security;

-- Intentionally no policies. RLS with zero policies denies everything, and the
-- backend's service_role key bypasses RLS. Net effect: this table is reachable
-- from the server and nowhere else.

revoke all on public.active_games from anon, authenticated;


-- Abandoned games (player closed the tab mid-round) would otherwise
-- accumulate forever. The backend calls this on every game start.
create or replace function public.purge_stale_active_games()
returns void
language sql
security definer
set search_path = public
as $$
    delete from public.active_games
    where updated_at < now() - interval '6 hours';
$$;

revoke execute on function public.purge_stale_active_games() from anon, authenticated;


-- ---------------------------------------------------------------------------
-- 2. Close the anon-key read path
--
-- get_player_stats() used to be called straight from the browser with the
-- public anon key and a caller-supplied id. There is no Supabase Auth session
-- in this app, so RLS had no identity to filter on and anyone could read
-- anyone's history. Those calls now go through GET /stats on the backend.
-- ---------------------------------------------------------------------------

revoke all on public.players       from anon;
revoke all on public.game_sessions from anon;
revoke all on public.round_results from anon;

-- Adjust the argument type if your function was declared with something other
-- than text (check: \df get_player_stats).
revoke execute on function public.get_player_stats(text) from anon;
