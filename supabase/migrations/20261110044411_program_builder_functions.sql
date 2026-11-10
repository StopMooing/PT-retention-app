-- Program builder v2: three saves that each run as one step, so a dropped connection never
-- leaves half a workout behind. All run as the signed-in person (security invoker), so the
-- normal row rules decide what they may read and change.

-- Save one workout day exactly as the coach left it in the editor: its exercises in order,
-- each with its set rows. Exercises not in the list are removed from the day.
-- p_items: [{ id (existing row or null), exercise_id, notes, superset_group,
--             sets, reps, rest_seconds (summary columns),
--             set_rows: [{ set_type, reps, weight_kg, rpe, rest_seconds }] }]
create or replace function public.save_program_day(p_day uuid, p_items jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  it jsonb;
  s jsonb;
  idx int := 0;
  n int;
  we_id uuid;
  keep uuid[] := '{}';
begin
  if not exists (
    select 1 from public.program_workouts pw
    join public.programs p on p.id = pw.program_id
    where pw.id = p_day and p.created_by = (select auth.uid())
  ) then
    raise exception 'not_allowed';
  end if;

  for it in select value from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    we_id := null;
    if nullif(it->>'id', '') is not null then
      update public.workout_exercises set
        exercise_id = (it->>'exercise_id')::uuid,
        sets = nullif(it->>'sets', '')::int,
        reps = nullif(it->>'reps', ''),
        rest_seconds = nullif(it->>'rest_seconds', '')::int,
        notes = nullif(btrim(coalesce(it->>'notes', '')), ''),
        superset_group = nullif(it->>'superset_group', '')::smallint,
        order_index = idx
      where id = (it->>'id')::uuid and program_workout_id = p_day
      returning id into we_id;
    end if;
    if we_id is null then
      insert into public.workout_exercises (program_workout_id, exercise_id, sets, reps, rest_seconds, notes, superset_group, order_index)
      values (
        p_day, (it->>'exercise_id')::uuid, nullif(it->>'sets', '')::int, nullif(it->>'reps', ''),
        nullif(it->>'rest_seconds', '')::int, nullif(btrim(coalesce(it->>'notes', '')), ''),
        nullif(it->>'superset_group', '')::smallint, idx
      )
      returning id into we_id;
    end if;
    keep := keep || we_id;

    delete from public.workout_exercise_sets where workout_exercise_id = we_id;
    n := 0;
    for s in select value from jsonb_array_elements(coalesce(it->'set_rows', '[]'::jsonb)) loop
      n := n + 1;
      insert into public.workout_exercise_sets (workout_exercise_id, set_number, set_type, reps, weight_kg, rpe, rest_seconds)
      values (
        we_id, n, coalesce(nullif(s->>'set_type', ''), 'normal'), nullif(btrim(coalesce(s->>'reps', '')), ''),
        nullif(s->>'weight_kg', '')::numeric, nullif(s->>'rpe', '')::numeric, nullif(s->>'rest_seconds', '')::int
      );
    end loop;
    idx := idx + 1;
  end loop;

  delete from public.workout_exercises where program_workout_id = p_day and not (id = any(keep));
end;
$$;

-- A number of reps moved up by p_reps: "8" becomes "9", "8-12" becomes "9-13".
-- Anything else ("30s", "AMRAP", "8 each leg") stays as written.
create or replace function public.bump_reps(p_reps text, p_by int)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_by = 0 or p_reps is null then p_reps
    when p_reps ~ '^\s*\d+\s*$' then (btrim(p_reps)::int + p_by)::text
    when p_reps ~ '^\s*\d+\s*-\s*\d+\s*$' then
      (split_part(regexp_replace(p_reps, '\s', '', 'g'), '-', 1)::int + p_by)::text || '-' ||
      (split_part(regexp_replace(p_reps, '\s', '', 'g'), '-', 2)::int + p_by)::text
    else p_reps
  end
$$;

-- Copy every day of one week of a program (with its exercises and set rows) into a new
-- week at the end. p_kg and p_reps add progression to the working sets (warm-ups stay
-- the same). Returns the new week's number.
create or replace function public.copy_program_week(p_program uuid, p_from_week int, p_kg numeric default 0, p_reps int default 0)
returns int
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_week int;
  d record;
  e record;
  new_day uuid;
  new_ex uuid;
begin
  if not exists (select 1 from public.programs where id = p_program and created_by = (select auth.uid())) then
    raise exception 'not_allowed';
  end if;
  select coalesce(max(week_number), 0) + 1 into new_week from public.program_workouts where program_id = p_program;
  if new_week > 52 then raise exception 'too_many_weeks'; end if;

  for d in select * from public.program_workouts where program_id = p_program and week_number = p_from_week order by day_number loop
    insert into public.program_workouts (program_id, name, day_number, week_number)
    values (p_program, d.name, d.day_number, new_week)
    returning id into new_day;
    for e in select * from public.workout_exercises where program_workout_id = d.id order by order_index, created_at loop
      insert into public.workout_exercises (program_workout_id, exercise_id, sets, reps, rest_seconds, notes, superset_group, order_index)
      values (new_day, e.exercise_id, e.sets, public.bump_reps(e.reps, p_reps), e.rest_seconds, e.notes, e.superset_group, e.order_index)
      returning id into new_ex;
      insert into public.workout_exercise_sets (workout_exercise_id, set_number, set_type, reps, weight_kg, rpe, rest_seconds)
      select new_ex, s.set_number, s.set_type,
        case when s.set_type = 'warmup' then s.reps else public.bump_reps(s.reps, p_reps) end,
        case when s.set_type = 'warmup' or s.weight_kg is null then s.weight_kg else least(1000, s.weight_kg + p_kg) end,
        s.rpe, s.rest_seconds
      from public.workout_exercise_sets s where s.workout_exercise_id = e.id;
    end loop;
  end loop;
  return new_week;
end;
$$;

-- Copy a whole program (any the person can read, such as one from the library) into a new
-- coaching program they own: every week, day, exercise, superset and set row.
create or replace function public.copy_program(p_program uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  src record;
  new_prog uuid;
  d record;
  e record;
  new_day uuid;
  new_ex uuid;
begin
  select * into src from public.programs where id = p_program;
  if not found then raise exception 'not_found'; end if;
  insert into public.programs (name, description, created_by, is_on_demand, kind)
  values (src.name, src.description, (select auth.uid()), false, 'program')
  returning id into new_prog;
  for d in select * from public.program_workouts where program_id = p_program order by week_number, day_number loop
    insert into public.program_workouts (program_id, name, day_number, week_number)
    values (new_prog, d.name, d.day_number, d.week_number)
    returning id into new_day;
    for e in select * from public.workout_exercises where program_workout_id = d.id order by order_index, created_at loop
      insert into public.workout_exercises (program_workout_id, exercise_id, sets, reps, rest_seconds, notes, superset_group, order_index)
      values (new_day, e.exercise_id, e.sets, e.reps, e.rest_seconds, e.notes, e.superset_group, e.order_index)
      returning id into new_ex;
      insert into public.workout_exercise_sets (workout_exercise_id, set_number, set_type, reps, weight_kg, rpe, rest_seconds)
      select new_ex, s.set_number, s.set_type, s.reps, s.weight_kg, s.rpe, s.rest_seconds
      from public.workout_exercise_sets s where s.workout_exercise_id = e.id;
    end loop;
  end loop;
  return new_prog;
end;
$$;

-- No extra grants: anyone signed out has no auth.uid(), so the owner checks and the row
-- rules stop them.
