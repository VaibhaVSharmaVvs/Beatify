-- Beatify — migration 001 (base schema)
--
-- Reconstructed from what the backend actually reads and writes (see db.py).
-- Every statement is `if not exists`, so running this against a project that
-- already has these tables is a no-op — it will not touch your data.
--
-- Run this BEFORE 002_active_games.sql.

-- Supabase enables pgcrypto by default; gen_random_uuid() needs it.
create extension if not exists pgcrypto;


-- ---------------------------------------------------------------------------
-- players — one row per authenticated Spotify user, upserted at login
-- ---------------------------------------------------------------------------

create table if not exists public.players (
    spotify_id   text        primary key,
    display_name text,
    created_at   timestamptz not null default now()
);


-- ---------------------------------------------------------------------------
-- game_sessions — one row per completed game
-- ---------------------------------------------------------------------------

create table if not exists public.game_sessions (
    id            uuid        primary key default gen_random_uuid(),
    spotify_id    text        not null references public.players (spotify_id) on delete cascade,
    total_rounds  integer     not null,
    total_score   integer     not null,
    max_score     integer     not null,
    difficulty    text,
    playlist_name text,
    created_at    timestamptz not null default now()
);

create index if not exists game_sessions_spotify_id_idx
    on public.game_sessions (spotify_id, created_at desc);


-- ---------------------------------------------------------------------------
-- round_results — one row per round played
--
-- release_year is text, not an integer: Spotify returns release_date as a
-- string with varying precision ("1999", "1999-05", "1999-05-01") and it can
-- be absent entirely.
-- ---------------------------------------------------------------------------

create table if not exists public.round_results (
    id             uuid        primary key default gen_random_uuid(),
    session_id     uuid        not null references public.game_sessions (id) on delete cascade,
    spotify_id     text        not null references public.players (spotify_id) on delete cascade,
    track_name     text,
    artist_name    text,
    album_name     text,
    release_year   text,
    points_earned  integer     not null default 0,
    max_points     integer     not null default 0,
    name_correct   boolean     not null default false,
    artist_correct boolean     not null default false,
    album_correct  boolean     not null default false,
    year_correct   boolean     not null default false,
    response_time  double precision,
    created_at     timestamptz not null default now()
);

create index if not exists round_results_session_id_idx
    on public.round_results (session_id);

create index if not exists round_results_spotify_id_idx
    on public.round_results (spotify_id);


-- ---------------------------------------------------------------------------
-- Lock the tables down. The browser never talks to Supabase directly — every
-- read and write goes through FastAPI, which holds the service_role key and
-- bypasses RLS. RLS enabled with zero policies denies everyone else.
-- ---------------------------------------------------------------------------

alter table public.players       enable row level security;
alter table public.game_sessions enable row level security;
alter table public.round_results enable row level security;

revoke all on public.players       from anon, authenticated;
revoke all on public.game_sessions from anon, authenticated;
revoke all on public.round_results from anon, authenticated;


-- ---------------------------------------------------------------------------
-- NOTE — get_player_stats()
--
-- The stats dashboard calls a PL/pgSQL aggregation function that is NOT
-- included here, because overwriting a working copy with a guess would be
-- worse than omitting it. If you already have it, export it from your project
-- and commit the result as 003_get_player_stats.sql:
--
--   select pg_get_functiondef(p.oid)
--   from pg_proc p
--   join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public' and p.proname = 'get_player_stats';
--
-- It takes target_spotify_id and returns a single JSON object shaped like the
-- PlayerStats interface in frontend/src/hooks/use-stats.ts:
--   totalRounds, totalScore, maxPossibleScore, overallAccuracy,
--   avgResponseTime, bestStreak, topPlaylists[], topArtists[], topEras[]
-- where each top*[] entry is { name, rounds, accuracy }.
--
-- Without it, GET /stats returns an error and the dashboard renders empty.
-- Everything else in the game works.
-- ---------------------------------------------------------------------------
