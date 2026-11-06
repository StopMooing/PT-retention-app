-- Speed-up only: no rule changes what anyone can see or do.
-- 64 access rules asked the database "who is signed in?" once per row. Wrapping it as
-- (select auth.uid()) asks once per request instead (Supabase advisor: auth_rls_initplan).
-- Generated from pg_policies on 6 Nov 2026 and tested on a full local copy: with the
-- wrapper removed again, every rule is identical to before (fingerprint
-- 109|42c293533937570b8f00e8e8f2c0c429 before and after).
-- Also drops one of two identical indexes on workout_set_logs.workout_log_id.
-- Run in the Supabase SQL Editor. It is all or nothing: if any line fails, nothing changes.

begin;

alter policy "PTs can manage weight logs for their clients" on public.body_weight_logs
  using (EXISTS ( SELECT 1
   FROM clients
  WHERE ((clients.id = body_weight_logs.client_id) AND (clients.pt_id = (select auth.uid())))));

alter policy "Clients can submit their own checkins" on public.checkins
  with check ((client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.user_id = (select auth.uid())))) AND checkin_rate_ok(client_id));

alter policy "Clients can view their own checkins" on public.checkins
  using (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.user_id = (select auth.uid()))));

alter policy "PTs can reply to their clients checkins" on public.checkins
  using (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.pt_id = (select auth.uid()))))
  with check (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.pt_id = (select auth.uid()))));

alter policy "PTs can view their clients checkins" on public.checkins
  using (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.pt_id = (select auth.uid()))));

alter policy "Clients can read their own record" on public.clients
  using ((select auth.uid()) = user_id);

alter policy "Clients can update their own targets" on public.clients
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

alter policy "PTs can delete their own clients" on public.clients
  using ((select auth.uid()) = pt_id);

alter policy "PTs can update their own clients" on public.clients
  using ((select auth.uid()) = pt_id);

alter policy "PTs can view their own clients" on public.clients
  using ((select auth.uid()) = pt_id);

alter policy "Create own private exercises" on public.exercises
  with check ((created_by = (select auth.uid())) AND (COALESCE(is_global, false) = false));

alter policy "Read global, own, and own coach's exercises" on public.exercises
  using ((is_global = true) OR (created_by = (select auth.uid())) OR (created_by IN ( SELECT c.pt_id
   FROM clients c
  WHERE (c.user_id = (select auth.uid())))));

alter policy "Update own private exercises" on public.exercises
  using (created_by = (select auth.uid()))
  with check ((created_by = (select auth.uid())) AND (COALESCE(is_global, false) = false));

alter policy "Clients manage their own food logs" on public.food_logs
  using (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.user_id = (select auth.uid()))))
  with check (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.user_id = (select auth.uid()))));

alter policy "PTs manage their clients food logs" on public.food_logs
  using (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.pt_id = (select auth.uid()))))
  with check (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.pt_id = (select auth.uid()))));

alter policy "Clients manage their own habit logs" on public.habit_logs
  using (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.user_id = (select auth.uid()))))
  with check (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.user_id = (select auth.uid()))));

alter policy "PT can view habit logs" on public.habit_logs
  using (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.pt_id = (select auth.uid()))));

alter policy "PTs manage their clients habit logs" on public.habit_logs
  using (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.pt_id = (select auth.uid()))))
  with check (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.pt_id = (select auth.uid()))));

alter policy "PT can manage habits" on public.habits
  using (created_by = (select auth.uid()));

alter policy "PT can manage meal foods" on public.meal_foods
  using (meal_id IN ( SELECT m.id
   FROM (meals m
     JOIN meal_plans mp ON ((m.meal_plan_id = mp.id)))
  WHERE (mp.created_by = (select auth.uid()))));

alter policy "PT can manage meal plans" on public.meal_plans
  using (created_by = (select auth.uid()));

alter policy "PT can manage meals" on public.meals
  using (meal_plan_id IN ( SELECT meal_plans.id
   FROM meal_plans
  WHERE (meal_plans.created_by = (select auth.uid()))));

alter policy "Clients manage their own PBs" on public.personal_bests
  using (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.user_id = (select auth.uid()))))
  with check (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.user_id = (select auth.uid()))));

alter policy "PTs can insert their clients PBs" on public.personal_bests
  with check (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.pt_id = (select auth.uid()))));

alter policy "PTs can read their clients PBs" on public.personal_bests
  using (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.pt_id = (select auth.uid()))));

alter policy "PTs can update their clients PBs" on public.personal_bests
  using (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.pt_id = (select auth.uid()))))
  with check (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.pt_id = (select auth.uid()))));

alter policy "Users can insert their own profile" on public.profiles
  with check ((select auth.uid()) = id);

alter policy "Users can update their own profile" on public.profiles
  using ((select auth.uid()) = id);

alter policy "Users can view their own profile" on public.profiles
  using ((select auth.uid()) = id);

alter policy "Clients can read their own program assignments" on public.program_assignments
  using (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.user_id = (select auth.uid()))));

alter policy "PTs can read program assignments" on public.program_assignments
  using ((select auth.uid()) IN ( SELECT clients.pt_id
   FROM clients
  WHERE (clients.id = program_assignments.client_id)));

alter policy "Clients can read program workouts" on public.program_workouts
  using (program_id IN ( SELECT program_assignments.program_id
   FROM program_assignments
  WHERE (program_assignments.client_id IN ( SELECT clients.id
           FROM clients
          WHERE (clients.user_id = (select auth.uid()))))));

alter policy "PT can manage program workouts" on public.program_workouts
  using (program_id IN ( SELECT programs.id
   FROM programs
  WHERE (programs.created_by = (select auth.uid()))));

alter policy "Clients can read their assigned programs" on public.programs
  using (id IN ( SELECT program_assignments.program_id
   FROM program_assignments
  WHERE (program_assignments.client_id IN ( SELECT clients.id
           FROM clients
          WHERE (clients.user_id = (select auth.uid()))))));

alter policy "PT can manage own programs" on public.programs
  using (created_by = (select auth.uid()));

alter policy "Clients manage their own photos" on public.progress_photos
  using (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.user_id = (select auth.uid()))))
  with check (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.user_id = (select auth.uid()))));

alter policy "PTs can read their clients photos" on public.progress_photos
  using (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.pt_id = (select auth.uid()))));

alter policy "Clients can read their assignments" on public.resource_assignments
  using (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.user_id = (select auth.uid()))));

alter policy "Clients can read their resources" on public.resources
  using ((created_by = ( SELECT clients.pt_id
   FROM clients
  WHERE (clients.user_id = (select auth.uid()))
 LIMIT 1)) OR (is_global = true));

alter policy "PTs manage their own resources" on public.resources
  using ((select auth.uid()) = created_by)
  with check (((select auth.uid()) = created_by) AND (COALESCE(is_global, false) = false));

alter policy "Clients can delete their own saved meals" on public.saved_meals
  using (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.user_id = (select auth.uid()))));

alter policy "Clients can insert their own saved meals" on public.saved_meals
  with check (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.user_id = (select auth.uid()))));

alter policy "Clients can read their own saved meals" on public.saved_meals
  using (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.user_id = (select auth.uid()))));

alter policy "PTs can read their clients saved meals" on public.saved_meals
  using (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.pt_id = (select auth.uid()))));

alter policy "Clients can delete their own saved workouts" on public.saved_workouts
  using (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.user_id = (select auth.uid()))));

alter policy "Clients can insert their own saved workouts" on public.saved_workouts
  with check (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.user_id = (select auth.uid()))));

alter policy "Clients can read their own saved workouts" on public.saved_workouts
  using (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.user_id = (select auth.uid()))));

alter policy "PTs can read their clients saved workouts" on public.saved_workouts
  using (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.pt_id = (select auth.uid()))));

alter policy "Clients can delete their own scheduled workouts" on public.scheduled_workouts
  using (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.user_id = (select auth.uid()))));

alter policy "Clients can read their own scheduled workouts" on public.scheduled_workouts
  using (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.user_id = (select auth.uid()))));

alter policy "Clients can schedule their own workouts" on public.scheduled_workouts
  with check (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.user_id = (select auth.uid()))));

alter policy "PTs can manage scheduled workouts for their clients" on public.scheduled_workouts
  using (EXISTS ( SELECT 1
   FROM clients
  WHERE ((clients.id = scheduled_workouts.client_id) AND (clients.pt_id = (select auth.uid())))));

alter policy "PTs can manage water logs for their clients" on public.water_logs
  using (EXISTS ( SELECT 1
   FROM clients
  WHERE ((clients.id = water_logs.client_id) AND (clients.pt_id = (select auth.uid())))));

alter policy "Clients can read workout exercises" on public.workout_exercises
  using (program_workout_id IN ( SELECT pw.id
   FROM (program_workouts pw
     JOIN program_assignments pa ON ((pa.program_id = pw.program_id)))
  WHERE (pa.client_id IN ( SELECT clients.id
           FROM clients
          WHERE (clients.user_id = (select auth.uid()))))));

alter policy "PT can manage workout exercises" on public.workout_exercises
  using (program_workout_id IN ( SELECT pw.id
   FROM (program_workouts pw
     JOIN programs p ON ((pw.program_id = p.id)))
  WHERE (p.created_by = (select auth.uid()))));

alter policy "Clients manage their own workout logs" on public.workout_logs
  using (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.user_id = (select auth.uid()))))
  with check (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.user_id = (select auth.uid()))));

alter policy "PT can view client workout logs" on public.workout_logs
  using (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.pt_id = (select auth.uid()))));

alter policy "PTs can insert their clients workout logs" on public.workout_logs
  with check (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.pt_id = (select auth.uid()))));

alter policy "PTs can read their clients workout logs" on public.workout_logs
  using (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.pt_id = (select auth.uid()))));

alter policy "PTs can update their clients workout logs" on public.workout_logs
  using (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.pt_id = (select auth.uid()))))
  with check (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.pt_id = (select auth.uid()))));

alter policy "Clients manage their own set logs" on public.workout_set_logs
  using (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.user_id = (select auth.uid()))))
  with check (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.user_id = (select auth.uid()))));

alter policy "PTs can insert their clients set logs" on public.workout_set_logs
  with check (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.pt_id = (select auth.uid()))));

alter policy "PTs can read their clients set logs" on public.workout_set_logs
  using (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.pt_id = (select auth.uid()))));

alter policy "PTs can update their clients set logs" on public.workout_set_logs
  using (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.pt_id = (select auth.uid()))))
  with check (client_id IN ( SELECT clients.id
   FROM clients
  WHERE (clients.pt_id = (select auth.uid()))));

drop index if exists public.workout_set_logs_workout_log_id_idx;

commit;
