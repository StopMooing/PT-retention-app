-- Clients make their own programs (stage 3 of the program builder).
-- A client can already create and edit programs they own: the owner rules on programs,
-- program_workouts, workout_exercises and workout_exercise_sets check created_by, and
-- save_program_day and copy_program run as the caller. This adds:
--   1. Coaches can read (never change) programs their clients made, so the coach sees
--      them and the names of sessions from them.
--   2. A client can start and stop a program they made, the same way as an on-demand one.
--      The one-active-program index still stops them replacing a program their coach
--      assigned (Luke's call: the coach's program stays theirs).
--   3. Only coaches can put a program in the on-demand library. Before this, any signed-in
--      person could mark their own program on demand and every member would see it.

create or replace function private.is_my_clients_program(p_program_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.programs p
    join public.clients c on c.user_id = p.created_by
    where p.id = p_program_id and c.pt_id = (select auth.uid())
  );
$$;
revoke execute on function private.is_my_clients_program(uuid) from public, anon;
grant execute on function private.is_my_clients_program(uuid) to authenticated;

create policy "Coaches read programs their clients made" on public.programs
  for select to authenticated
  using (private.is_my_clients_program(id));

create policy "Coaches read days of programs their clients made" on public.program_workouts
  for select to authenticated
  using (private.is_my_clients_program(program_id));

create policy "Coaches read exercises of programs their clients made" on public.workout_exercises
  for select to authenticated
  using (exists (
    select 1 from public.program_workouts pw
    where pw.id = workout_exercises.program_workout_id and private.is_my_clients_program(pw.program_id)
  ));

create policy "Coaches read set targets of programs their clients made" on public.workout_exercise_sets
  for select to authenticated
  using (exists (
    select 1
    from public.workout_exercises we
    join public.program_workouts pw on pw.id = we.program_workout_id
    where we.id = workout_exercise_sets.workout_exercise_id and private.is_my_clients_program(pw.program_id)
  ));

create policy "Clients can start a program they made" on public.program_assignments
  for insert to authenticated
  with check (
    assigned_by = (select auth.uid())
    and client_id in (select c.id from public.clients c where c.user_id = (select auth.uid()))
    and private.owns_program(program_id)
  );

create policy "Clients can stop a program they made" on public.program_assignments
  for update to authenticated
  using (
    assigned_by = (select auth.uid())
    and client_id in (select c.id from public.clients c where c.user_id = (select auth.uid()))
  )
  with check (
    assigned_by = (select auth.uid())
    and client_id in (select c.id from public.clients c where c.user_id = (select auth.uid()))
    and private.owns_program(program_id)
  );

-- Only a coach puts a program on demand. Scripts run without a signed-in user (seeds,
-- the SQL Editor) are left alone.
create or replace function private.guard_program_on_demand()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_on_demand
     and (select auth.uid()) is not null
     and not exists (select 1 from public.profiles pr where pr.id = (select auth.uid()) and pr.role = 'pt')
  then
    raise exception 'not_allowed: only coaches can add programs to the on-demand library' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger guard_program_on_demand
  before insert or update of is_on_demand on public.programs
  for each row when (new.is_on_demand)
  execute function private.guard_program_on_demand();
