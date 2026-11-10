-- Program builder v2: programs in weeks, supersets, and a target for every set.
-- program_workouts.week_number: which week of the program a workout belongs to (week 1 is
--   the program as before; a program with only week 1 repeats it every week).
-- workout_exercises.superset_group: exercises in the same day with the same number are done
--   back to back as a superset (null: on its own).
-- workout_exercise_sets: one row per planned set (type, reps, kg, effort, rest). The
--   exercise's own sets/reps/rest_seconds stay as the summary older screens read.
alter table public.program_workouts add column if not exists week_number integer not null default 1;
alter table public.program_workouts add constraint program_workouts_week_number_check check (week_number between 1 and 52);
alter table public.workout_exercises add column if not exists superset_group smallint;

create table if not exists public.workout_exercise_sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises(id) on delete cascade,
  set_number integer not null check (set_number between 1 and 50),
  set_type text not null default 'normal' check (set_type in ('normal', 'warmup', 'drop', 'failure')),
  reps text check (char_length(reps) <= 30),
  weight_kg numeric(6,2) check (weight_kg >= 0 and weight_kg <= 1000),
  rpe numeric(3,1) check (rpe >= 1 and rpe <= 10),
  rest_seconds integer check (rest_seconds >= 0 and rest_seconds <= 1800),
  created_at timestamptz not null default now(),
  unique (workout_exercise_id, set_number)
);
create index if not exists program_workouts_program_week_idx on public.program_workouts (program_id, week_number, day_number);

alter table public.workout_exercise_sets enable row level security;

-- Same reach as workout_exercises: the program's owner manages; an assigned client and,
-- for on-demand programs, any member can read.
create policy "Program owner manages set targets" on public.workout_exercise_sets for all
  using (workout_exercise_id in (
    select we.id from public.workout_exercises we
    join public.program_workouts pw on pw.id = we.program_workout_id
    join public.programs p on p.id = pw.program_id
    where p.created_by = (select auth.uid())))
  with check (workout_exercise_id in (
    select we.id from public.workout_exercises we
    join public.program_workouts pw on pw.id = we.program_workout_id
    join public.programs p on p.id = pw.program_id
    where p.created_by = (select auth.uid())));

create policy "Clients read set targets of assigned programs" on public.workout_exercise_sets for select
  using (workout_exercise_id in (
    select we.id from public.workout_exercises we
    join public.program_workouts pw on pw.id = we.program_workout_id
    join public.program_assignments pa on pa.program_id = pw.program_id
    where pa.client_id in (select c.id from public.clients c where c.user_id = (select auth.uid()))));

create policy "Members read set targets of on-demand programs" on public.workout_exercise_sets for select to authenticated
  using (workout_exercise_id in (
    select we.id from public.workout_exercises we
    join public.program_workouts pw on pw.id = we.program_workout_id
    join public.programs p on p.id = pw.program_id
    where p.is_on_demand));
