-- Body measurements and the coach's own check-in questions.

-- 1. Tape measurements in cm. Clients log their own; coaches see and can log them for their
--    clients (for example in a session). One row per client per day.
create table public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  measured_on date not null,
  waist_cm numeric(4,1) check (waist_cm > 0 and waist_cm < 300),
  hips_cm numeric(4,1) check (hips_cm > 0 and hips_cm < 300),
  chest_cm numeric(4,1) check (chest_cm > 0 and chest_cm < 300),
  arm_cm numeric(4,1) check (arm_cm > 0 and arm_cm < 300),
  thigh_cm numeric(4,1) check (thigh_cm > 0 and thigh_cm < 300),
  logged_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  unique (client_id, measured_on),
  check (coalesce(waist_cm, hips_cm, chest_cm, arm_cm, thigh_cm) is not null)
);

alter table public.body_measurements enable row level security;
grant select, insert, update, delete on public.body_measurements to authenticated;

create policy "Clients manage their own measurements" on public.body_measurements
  for all to authenticated
  using (client_id in (select c.id from public.clients c where c.user_id = (select auth.uid())))
  with check (client_id in (select c.id from public.clients c where c.user_id = (select auth.uid())));

create policy "Coaches manage their clients' measurements" on public.body_measurements
  for all to authenticated
  using (client_id in (select c.id from public.clients c where c.pt_id = (select auth.uid())))
  with check (client_id in (select c.id from public.clients c where c.pt_id = (select auth.uid())));

-- 2. Questions a coach adds to the weekly check-in, on top of the built-in ones.
create table public.checkin_questions (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references auth.users (id) on delete cascade,
  question text not null check (length(btrim(question)) between 1 and 200),
  kind text not null default 'text' check (kind in ('text', 'scale')),
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index checkin_questions_coach_id_idx on public.checkin_questions (coach_id, position);

alter table public.checkin_questions enable row level security;
grant select, insert, update, delete on public.checkin_questions to authenticated;

create policy "Coaches manage their own check-in questions" on public.checkin_questions
  for all to authenticated
  using (coach_id = (select auth.uid()))
  with check (coach_id = (select auth.uid()));

create policy "Clients see their coach's check-in questions" on public.checkin_questions
  for select to authenticated
  using (coach_id in (select c.pt_id from public.clients c where c.user_id = (select auth.uid())));

-- The client's answers, saved with the check-in as a snapshot ([{q, kind, a}]) so editing
-- or removing a question later never changes past check-ins. Clients can set it when they
-- check in; coaches still can only write their reply.
alter table public.checkins add column answers jsonb
  check (answers is null or (jsonb_typeof(answers) = 'array' and jsonb_array_length(answers) <= 10 and pg_column_size(answers) <= 16000));
grant insert (answers) on public.checkins to authenticated;
