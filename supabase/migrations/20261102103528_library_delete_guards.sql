-- Library deletes that can never wipe client history. Deleting a program or a day
-- cascades into clients' calendars, and deleting an exercise cascades into logged sets
-- and personal bests. These guards refuse a delete once anything a client did depends on
-- it (checked across every client, so security definer). Unused ones delete as normal.

create or replace function private.guard_program_delete()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if exists (select 1 from public.program_assignments a where a.program_id = old.id)
     or exists (select 1 from public.scheduled_workouts sw join public.program_workouts pw on pw.id = sw.program_workout_id where pw.program_id = old.id)
     or exists (select 1 from public.workout_logs wl join public.program_workouts pw on pw.id = wl.program_workout_id where pw.program_id = old.id)
  then
    raise exception 'in_use: clients have used this program' using errcode = 'P0001';
  end if;
  return old;
end;
$$;

create or replace function private.guard_program_workout_delete()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if exists (select 1 from public.scheduled_workouts sw where sw.program_workout_id = old.id)
     or exists (select 1 from public.workout_logs wl where wl.program_workout_id = old.id)
  then
    raise exception 'in_use: clients have this day on their calendar' using errcode = 'P0001';
  end if;
  return old;
end;
$$;

create or replace function private.guard_exercise_delete()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if exists (select 1 from public.workout_exercises we where we.exercise_id = old.id)
     or exists (select 1 from public.workout_set_logs s where s.exercise_id = old.id)
     or exists (select 1 from public.personal_bests pb where pb.exercise_id = old.id)
  then
    raise exception 'in_use: this exercise is in a program or a client logged it' using errcode = 'P0001';
  end if;
  return old;
end;
$$;

create trigger guard_program_delete before delete on public.programs
  for each row execute function private.guard_program_delete();
create trigger guard_program_workout_delete before delete on public.program_workouts
  for each row execute function private.guard_program_workout_delete();
create trigger guard_exercise_delete before delete on public.exercises
  for each row execute function private.guard_exercise_delete();

-- Coaches could not delete their own exercises at all (no policy). Own, private only;
-- the trigger above keeps used ones.
create policy "Coaches can delete own private exercises" on public.exercises
  for delete to authenticated
  using (created_by = (select auth.uid()) and not coalesce(is_global, false));
