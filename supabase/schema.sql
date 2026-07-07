-- ─────────────────────────────────────────────────────────────────────────────
-- Gridiron Studio — Supabase Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create the plays table
create table if not exists public.plays (
  id         bigint primary key,           -- timestamp-based ID from the app
  name       text not null,
  mode       text not null,                -- 'offense' | 'defense' | 'lineman'
  section    text not null default 'designer',
  author     text not null default 'Coach',
  saved_at   timestamptz not null default now(),
  players    jsonb not null default '[]',  -- array of player objects
  routes     jsonb not null default '{}'   -- map of playerId → route object
);

-- 2. Index for sorting by most recent
create index if not exists plays_saved_at_idx on public.plays (saved_at desc);

-- 3. Enable Row Level Security (required for Supabase)
alter table public.plays enable row level security;

-- 4. RLS Policies — allow anyone with the anon key to read and write
--    (This is appropriate for a team app without individual logins.
--     If you want to add auth later, you can tighten these policies.)

-- Allow all reads
create policy "Anyone can read plays"
  on public.plays for select
  using (true);

-- Allow all inserts
create policy "Anyone can insert plays"
  on public.plays for insert
  with check (true);

-- Allow all updates (so coaches can overwrite their own plays)
create policy "Anyone can update plays"
  on public.plays for update
  using (true);

-- Allow all deletes
create policy "Anyone can delete plays"
  on public.plays for delete
  using (true);

-- 5. Enable real-time for this table
--    (Supabase Dashboard → Database → Replication → check 'plays' table)
--    Or run this:
alter publication supabase_realtime add table public.plays;

-- ─────────────────────────────────────────────────────────────────────────────
-- Done! Your plays table is ready.
-- Next: copy .env.example to .env.local and add your project URL + anon key.
-- ─────────────────────────────────────────────────────────────────────────────
