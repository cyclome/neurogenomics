-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).
-- Creates the table the classroom pages read and write.

create table if not exists submissions (
  id           uuid primary key default gen_random_uuid(),
  session_code text not null,
  group_name   text,
  aim          text not null,
  hypothesis   text,
  data_source  text,
  study_plan   text,
  created_at   timestamptz not null default now()
);

create index if not exists submissions_session_code_idx
  on submissions (session_code, created_at);

-- Row Level Security: the anon key is public (it ships in the page source),
-- so RLS policies are the only thing standing between "anyone" and the table.
-- This is a throwaway classroom tool — anonymous insert + anonymous read is
-- the point (no login, live projector view) — just don't put real names or
-- anything sensitive in the free-text fields.
alter table submissions enable row level security;

create policy "anon can insert" on submissions
  for insert to anon
  with check (true);

create policy "anon can read" on submissions
  for select to anon
  using (true);

-- Optional: enable Realtime instead of the 5s poll the display page uses by
-- default. Database → Replication → add `submissions` to the
-- `supabase_realtime` publication. Not required — polling works out of the box.
