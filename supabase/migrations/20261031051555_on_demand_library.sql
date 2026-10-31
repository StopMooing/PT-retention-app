-- Applied 31 Oct 2026 as migration on_demand_library.
-- Note: its "Clients can start an on-demand program" policy caused a recursion error and
-- was replaced minutes later by 20261031051739_on_demand_assignment_check_fix.sql.
-- The app works before and after: until this runs, on-demand sections stay hidden and
-- Home says "your coach" instead of the coach's name.
--
-- 1. Clients can read their own coach's profile row (name shown on Home).
-- 2. programs gets is_on_demand (visible to every signed-in member) and kind
--    ('program' = multi-day program, 'workout' = a single on-demand session).
-- 3. Any signed-in member can read on-demand programs, their days and exercises.
-- 4. program_assignments: the old catch-all policy let anyone insert a row as long as
--    assigned_by was themselves, for any client and any program (and so read programs
--    that were not theirs). Replaced with: coaches manage assignments for their own
--    clients; a client may start (insert) and stop (update) an on-demand program for
--    themselves only.

-- 1. Coach name for clients
create policy "Clients can read their coach's profile"
  on public.profiles for select to authenticated
  using (id in (select c.pt_id from public.clients c where c.user_id = (select auth.uid())));

-- 2. On-demand flags
alter table public.programs
  add column is_on_demand boolean not null default false,
  add column kind text not null default 'program' check (kind in ('program', 'workout'));

create index programs_on_demand_idx on public.programs (is_on_demand) where is_on_demand;

-- 3. Read access to the on-demand library
create policy "Members can read on-demand programs"
  on public.programs for select to authenticated
  using (is_on_demand);

create policy "Members can read on-demand program workouts"
  on public.program_workouts for select to authenticated
  using (program_id in (select p.id from public.programs p where p.is_on_demand));

create policy "Members can read on-demand workout exercises"
  on public.workout_exercises for select to authenticated
  using (program_workout_id in (
    select pw.id from public.program_workouts pw
    join public.programs p on p.id = pw.program_id
    where p.is_on_demand
  ));

-- 4. Program assignments
drop policy if exists "PT can manage assignments" on public.program_assignments;

create policy "PTs can delete program assignments"
  on public.program_assignments for delete to authenticated
  using ((select auth.uid()) in (select c.pt_id from public.clients c where c.id = program_assignments.client_id));

create policy "Clients can start an on-demand program"
  on public.program_assignments for insert to authenticated
  with check (
    assigned_by = (select auth.uid())
    and client_id in (select c.id from public.clients c where c.user_id = (select auth.uid()))
    and program_id in (select p.id from public.programs p where p.is_on_demand)
  );

create policy "Clients can stop their own on-demand program"
  on public.program_assignments for update to authenticated
  using (
    assigned_by = (select auth.uid())
    and client_id in (select c.id from public.clients c where c.user_id = (select auth.uid()))
  )
  with check (
    assigned_by = (select auth.uid())
    and client_id in (select c.id from public.clients c where c.user_id = (select auth.uid()))
  );
