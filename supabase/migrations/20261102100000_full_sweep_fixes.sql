-- Full sweep fixes, 2 Nov 2026 (coach side, client side and database audit).
-- A: hardening. B: close cross-account writes. C: connect coach work to the client,
-- stop data loss and double counting, live check-ins.

-- A1. Indexes on the columns RLS and the app filter by.
create index if not exists clients_pt_id_idx on public.clients (pt_id);
create index if not exists checkins_client_submitted_idx on public.checkins (client_id, submitted_at desc);
create index if not exists body_weight_logs_client_date_idx on public.body_weight_logs (client_id, logged_date);
create index if not exists water_logs_client_date_idx on public.water_logs (client_id, logged_date);
create index if not exists food_logs_client_logged_idx on public.food_logs (client_id, logged_at);
create index if not exists habits_client_id_idx on public.habits (client_id);
create index if not exists habit_logs_client_id_idx on public.habit_logs (client_id);
create index if not exists scheduled_workouts_client_date_idx on public.scheduled_workouts (client_id, scheduled_date);
create index if not exists scheduled_workouts_program_workout_idx on public.scheduled_workouts (program_workout_id);
create index if not exists workout_logs_client_logged_idx on public.workout_logs (client_id, logged_at desc);
create index if not exists workout_logs_scheduled_workout_idx on public.workout_logs (scheduled_workout_id);
create index if not exists workout_logs_program_workout_idx on public.workout_logs (program_workout_id);
create index if not exists workout_set_logs_client_id_idx on public.workout_set_logs (client_id);
create index if not exists workout_set_logs_scheduled_workout_idx on public.workout_set_logs (scheduled_workout_id);
create index if not exists workout_set_logs_exercise_id_idx on public.workout_set_logs (exercise_id);
create index if not exists workout_set_logs_workout_log_id_idx on public.workout_set_logs (workout_log_id);
create index if not exists personal_bests_exercise_id_idx on public.personal_bests (exercise_id);
create index if not exists personal_bests_scheduled_workout_idx on public.personal_bests (scheduled_workout_id);
create index if not exists program_assignments_client_id_idx on public.program_assignments (client_id);
create index if not exists program_assignments_program_id_idx on public.program_assignments (program_id);
create index if not exists program_workouts_program_id_idx on public.program_workouts (program_id);
create index if not exists workout_exercises_program_workout_idx on public.workout_exercises (program_workout_id);
create index if not exists workout_exercises_exercise_id_idx on public.workout_exercises (exercise_id);
create index if not exists programs_created_by_idx on public.programs (created_by);
create index if not exists exercises_created_by_idx on public.exercises (created_by);
create index if not exists progress_photos_client_id_idx on public.progress_photos (client_id);
create index if not exists saved_meals_client_id_idx on public.saved_meals (client_id);
create index if not exists saved_workouts_client_id_idx on public.saved_workouts (client_id);
create index if not exists pt_notes_client_id_idx on public.pt_notes (client_id);
create index if not exists resource_assignments_client_id_idx on public.resource_assignments (client_id);
create index if not exists resources_created_by_idx on public.resources (created_by);
create index if not exists meal_plans_client_id_idx on public.meal_plans (client_id);
create index if not exists meals_meal_plan_id_idx on public.meals (meal_plan_id);
create index if not exists meal_foods_meal_id_idx on public.meal_foods (meal_id);
create index if not exists coach_messages_sender_id_idx on public.coach_messages (sender_id);

-- A2. Functions: least privilege and a fixed search_path. Triggers still fire (EXECUTE
-- is not checked for triggers). get_claim_client stays callable signed out (claim page).
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
alter function public.handle_new_user() set search_path = '';
alter function public.checkins_force_timestamps() set search_path = '';
revoke execute on function public.checkin_rate_ok(uuid) from public, anon;
grant execute on function public.checkin_rate_ok(uuid) to authenticated;
alter function public.checkin_rate_ok(uuid) set search_path = '';
alter function public.get_claim_client(uuid) set search_path = '';
revoke execute on function public.resolve_exercise_ids(text[]) from public, anon;
grant execute on function public.resolve_exercise_ids(text[]) to authenticated;
-- As invoker it sees only the exercises RLS allows (it matched every coach's private ones).
alter function public.resolve_exercise_ids(text[]) security invoker;
revoke execute on function public.search_foods(text) from public, anon;
grant execute on function public.search_foods(text) to authenticated;
revoke execute on function public.match_foods(text[]) from public, anon;
grant execute on function public.match_foods(text[]) to authenticated;
alter function public.search_foods(text) set search_path = public, pg_temp;

-- A3. Table privileges. TRUNCATE ignores RLS and the API never uses it.
revoke truncate on all tables in schema public from anon, authenticated;
-- A client could insert a check-in that already looked answered (coach_reply set).
revoke insert on public.checkins from anon, authenticated;
grant insert (client_id, training_score, energy_score, mood_score, blocker, notes) on public.checkins to authenticated;
-- A sender could set read_at or created_at on a new message.
revoke insert on public.coach_messages from anon, authenticated;
grant insert (client_id, sender_id, body) on public.coach_messages to authenticated;
-- Anyone could change their own role (client to coach). Only the name is editable now.
revoke update on public.profiles from anon, authenticated;
grant update (full_name) on public.profiles to authenticated;

-- B1. Weigh-ins and water: the client policy only checked logged_by, so any signed-in
-- user could write into any client's history, and clients couldn't see what their coach
-- logged. Clients now read every row on their own record and write only their own rows.
drop policy "Clients can manage their own weight logs" on public.body_weight_logs;
create policy "Clients can read their weight logs" on public.body_weight_logs
  for select to authenticated
  using (client_id in (select c.id from public.clients c where c.user_id = (select auth.uid())));
create policy "Clients can manage their own weight logs" on public.body_weight_logs
  for all to authenticated
  using ((select auth.uid()) = logged_by and client_id in (select c.id from public.clients c where c.user_id = (select auth.uid())))
  with check ((select auth.uid()) = logged_by and client_id in (select c.id from public.clients c where c.user_id = (select auth.uid())));
drop policy "Clients can manage their own water logs" on public.water_logs;
create policy "Clients can read their water logs" on public.water_logs
  for select to authenticated
  using (client_id in (select c.id from public.clients c where c.user_id = (select auth.uid())));
create policy "Clients can manage their own water logs" on public.water_logs
  for all to authenticated
  using ((select auth.uid()) = logged_by and client_id in (select c.id from public.clients c where c.user_id = (select auth.uid())))
  with check ((select auth.uid()) = logged_by and client_id in (select c.id from public.clients c where c.user_id = (select auth.uid())));

-- B2. A new client row can't point at someone else's account (the claim link links it).
alter policy "PTs can insert their own clients" on public.clients
  with check ((select auth.uid()) = pt_id and user_id is null);

-- B3. Program assignments check which program: a client can't repoint theirs at any
-- program, and a coach assigns only their own or on-demand programs.
create or replace function private.owns_program(p_program_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.programs p where p.id = p_program_id and p.created_by = (select auth.uid()));
$$;
revoke execute on function private.owns_program(uuid) from public, anon;
grant execute on function private.owns_program(uuid) to authenticated;
alter policy "Clients can stop their own on-demand program" on public.program_assignments
  with check (assigned_by = (select auth.uid())
              and client_id in (select c.id from public.clients c where c.user_id = (select auth.uid()))
              and private.is_on_demand_program(program_id));
alter policy "PTs can insert program assignments" on public.program_assignments
  to authenticated
  with check ((select auth.uid()) in (select c.pt_id from public.clients c where c.id = program_assignments.client_id)
              and (private.owns_program(program_id) or private.is_on_demand_program(program_id)));
alter policy "PTs can update program assignments" on public.program_assignments
  to authenticated
  using ((select auth.uid()) in (select c.pt_id from public.clients c where c.id = program_assignments.client_id))
  with check ((select auth.uid()) in (select c.pt_id from public.clients c where c.id = program_assignments.client_id)
              and (private.owns_program(program_id) or private.is_on_demand_program(program_id)));

-- B4. Storage "resources": any signed-in user could upload or overwrite files. Coaches
-- only, into their own folder.
alter policy "PTs can upload resources" on storage.objects
  to authenticated
  with check (bucket_id = 'resources'
              and (storage.foldername(name))[1] = (select auth.uid())::text
              and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'pt'));
alter policy "PTs can update their resources" on storage.objects
  to authenticated
  using (bucket_id = 'resources' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'resources' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- B5. Public buckets don't need a SELECT policy for their public links; the old ones let
-- anyone list every file (and every client's account id). Own folder only.
alter policy "Profile photos are publicly viewable" on storage.objects
  to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
alter policy "Resources are publicly viewable" on storage.objects
  to authenticated
  using (bucket_id = 'resources' and (storage.foldername(name))[1] = (select auth.uid())::text);
alter policy "Clients can update their own photo" on storage.objects
  to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
alter policy "Clients can upload their own photo" on storage.objects
  to authenticated
  with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- B6. Notes and resource assignments only for the coach's own clients; resources are
-- read signed in only.
alter policy "PTs manage resource assignments" on public.resource_assignments
  to authenticated
  using (resource_id in (select r.id from public.resources r where r.created_by = (select auth.uid())))
  with check (resource_id in (select r.id from public.resources r where r.created_by = (select auth.uid()))
              and client_id in (select c.id from public.clients c where c.pt_id = (select auth.uid())));
alter policy "PTs can manage their own notes" on public.pt_notes
  to authenticated
  using ((select auth.uid()) = pt_id)
  with check ((select auth.uid()) = pt_id
              and client_id in (select c.id from public.clients c where c.pt_id = (select auth.uid())));
alter policy "Clients can read their resources" on public.resources to authenticated;

-- C1. Removing a session from the calendar deleted the client's logged sets. Sets now
-- stay (they belong to their workout log); deleting a workout log takes its sets.
alter table public.workout_set_logs
  drop constraint workout_set_logs_scheduled_workout_id_fkey,
  add constraint workout_set_logs_scheduled_workout_id_fkey
    foreign key (scheduled_workout_id) references public.scheduled_workouts(id) on delete set null;
alter table public.workout_set_logs
  add constraint workout_set_logs_workout_log_id_fkey
  foreign key (workout_log_id) references public.workout_logs(id) on delete cascade not valid;
alter table public.workout_set_logs validate constraint workout_set_logs_workout_log_id_fkey;

-- C2. One of each, enforced (0 duplicates today): one active program per client, one
-- completed log per session, one client record per account, one active meal plan.
create unique index if not exists program_assignments_one_active_idx
  on public.program_assignments (client_id) where is_active;
create unique index if not exists workout_logs_one_completed_per_session_idx
  on public.workout_logs (scheduled_workout_id) where completed and scheduled_workout_id is not null;
create unique index if not exists clients_user_id_unique_idx
  on public.clients (user_id) where user_id is not null;
create unique index if not exists meal_plans_one_active_idx
  on public.meal_plans (client_id) where is_active and client_id is not null;

-- C3. Habits and meal plans the coach sets now reach the client (read only; habit ticks
-- already had a client policy on habit_logs).
create policy "Clients can read their habits" on public.habits
  for select to authenticated
  using (client_id in (select c.id from public.clients c where c.user_id = (select auth.uid())));
create policy "Clients can read their meal plans" on public.meal_plans
  for select to authenticated
  using (client_id in (select c.id from public.clients c where c.user_id = (select auth.uid())));
create policy "Clients can read their meal plan meals" on public.meals
  for select to authenticated
  using (meal_plan_id in (select mp.id from public.meal_plans mp
                          where mp.client_id in (select c.id from public.clients c where c.user_id = (select auth.uid()))));
create policy "Clients can read their meal plan foods" on public.meal_foods
  for select to authenticated
  using (meal_id in (select m.id from public.meals m join public.meal_plans mp on mp.id = m.meal_plan_id
                     where mp.client_id in (select c.id from public.clients c where c.user_id = (select auth.uid()))));

-- C4. Coach edits that silently did nothing: clearing a stale personal best, and undoing
-- a session log when its sets fail to save.
create policy "PTs can delete their clients PBs" on public.personal_bests
  for delete to authenticated
  using (client_id in (select c.id from public.clients c where c.pt_id = (select auth.uid())));
create policy "PTs can delete their clients workout logs" on public.workout_logs
  for delete to authenticated
  using (client_id in (select c.id from public.clients c where c.pt_id = (select auth.uid())));

-- C5. New check-ins reach the coach dashboard live (realtime still applies RLS).
alter publication supabase_realtime add table public.checkins;

-- C6. Data fix: sessions the coach logged were saved without their program day, so they
-- didn't count toward program progress. Copy it from the session.
update public.workout_logs wl
   set program_workout_id = sw.program_workout_id
  from public.scheduled_workouts sw
 where sw.id = wl.scheduled_workout_id
   and wl.program_workout_id is null
   and sw.program_workout_id is not null;
