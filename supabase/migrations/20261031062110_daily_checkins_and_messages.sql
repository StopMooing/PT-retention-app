-- Daily check-ins, workout ratings and coach messages. Applied 31 Oct 2026. Verified: client
-- sends and reads own thread and daily check-ins; another client sees none; coach reads both
-- and marks read; editing a message body is refused; sending as someone else is refused.
-- Additive only: two new tables and one new nullable column.

-- 1. Daily check-in: "How are you today?" One per client per local day.
create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  checkin_date date not null,
  energy smallint check (energy between 1 and 5),
  sleep smallint check (sleep between 1 and 5),
  soreness smallint check (soreness between 1 and 5),
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  unique (client_id, checkin_date)
);
alter table public.daily_checkins enable row level security;

create policy "Clients manage their own daily check-ins"
  on public.daily_checkins for all to authenticated
  using (client_id in (select c.id from public.clients c where c.user_id = (select auth.uid())))
  with check (client_id in (select c.id from public.clients c where c.user_id = (select auth.uid())));

create policy "Coaches read their clients' daily check-ins"
  on public.daily_checkins for select to authenticated
  using (client_id in (select c.id from public.clients c where c.pt_id = (select auth.uid())));

-- 2. How a session felt, set on the completion screen (notes already exist).
alter table public.workout_logs
  add column session_rating smallint check (session_rating between 1 and 5);

-- 3. Private messages between a client and their coach. One thread per client.
create table public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index coach_messages_client_created_idx on public.coach_messages (client_id, created_at desc);
alter table public.coach_messages enable row level security;

create policy "Thread members can read messages"
  on public.coach_messages for select to authenticated
  using (client_id in (
    select c.id from public.clients c
    where c.user_id = (select auth.uid()) or c.pt_id = (select auth.uid())
  ));

create policy "Thread members can send as themselves"
  on public.coach_messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and client_id in (
      select c.id from public.clients c
      where c.user_id = (select auth.uid()) or c.pt_id = (select auth.uid())
    )
  );

-- The recipient marks messages read. Only read_at can change (column grant).
create policy "Recipient can mark messages read"
  on public.coach_messages for update to authenticated
  using (
    sender_id <> (select auth.uid())
    and client_id in (
      select c.id from public.clients c
      where c.user_id = (select auth.uid()) or c.pt_id = (select auth.uid())
    )
  );
revoke update on public.coach_messages from authenticated, anon;
grant update (read_at) on public.coach_messages to authenticated;

-- Live updates for open chats (Realtime respects the policies above).
alter publication supabase_realtime add table public.coach_messages;
