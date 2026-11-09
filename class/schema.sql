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

drop policy if exists "anon can insert" on submissions;
create policy "anon can insert" on submissions
  for insert to anon
  with check (true);

drop policy if exists "anon can read" on submissions;
create policy "anon can read" on submissions
  for select to anon
  using (true);

-- admin.html signs in (authenticated role), so it needs its own read policy —
-- "anon can read" above doesn't cover it.
drop policy if exists "authenticated can read" on submissions;
create policy "authenticated can read" on submissions
  for select to authenticated
  using (true);

-- Editing/deleting is restricted to a logged-in (authenticated) user — see
-- class/admin.html. Without this, anyone holding the anon key (which is
-- public, it ships in the page source) could wipe the table.
drop policy if exists "authenticated can update" on submissions;
create policy "authenticated can update" on submissions
  for update to authenticated
  using (true) with check (true);

drop policy if exists "authenticated can delete" on submissions;
create policy "authenticated can delete" on submissions
  for delete to authenticated
  using (true);

-- One-time: create your own login for class/admin.html — Authentication →
-- Users → Add user, enter an email + password, and tick "Auto Confirm User"
-- so no email verification step is needed.

-- Optional: enable Realtime instead of the 5s poll the display page uses by
-- default. Database → Replication → add `submissions` to the
-- `supabase_realtime` publication. Not required — polling works out of the box.
