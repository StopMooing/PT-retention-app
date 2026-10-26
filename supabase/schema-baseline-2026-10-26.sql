-- =====================================================================
-- PT BLUEPRINT / UNFNSHD: SCHEMA BASELINE
-- Exported 26 October 2026 from Supabase project ksataubrattfspjpftlk
-- (public schema, plus the on_auth_user_created trigger on auth.users).
--
-- WHY THIS EXISTS: the project's migration history was empty. Every schema
-- change to date was run as raw SQL, so the live database was the only
-- record of its own structure. This file is that record, as of today.
--
-- NOT INCLUDED: data, storage buckets and their policies, table-level
-- grants (Supabase defaults), the event trigger that calls rls_auto_enable,
-- and Supabase-managed schemas (auth, storage, etc.).
-- Requires extension: pg_trgm (used by idx_foods_name_trgm and search_foods).
--
-- NOTE: the anon check-in policy and get_checkin_client() below are
-- scheduled for removal (handoff section 4c), after the code change ships.
-- =====================================================================

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------
-- TABLES
-- ---------------------------------------------------------------------

create table public.body_weight_logs (
  id uuid default gen_random_uuid() not null,
  client_id uuid not null,
  logged_by uuid,
  weight_kg numeric(5,2) not null,
  logged_date date default CURRENT_DATE not null,
  created_at timestamp with time zone default now()
);

create table public.checkins (
  id uuid default gen_random_uuid() not null,
  client_id uuid,
  training_score integer,
  energy_score integer,
  notes text,
  created_at timestamp without time zone default now(),
  mood_score integer,
  blocker text,
  submitted_at timestamp with time zone default now(),
  coach_reply text,
  replied_at timestamp with time zone
);

create table public.clients (
  id uuid default gen_random_uuid() not null,
  pt_id uuid,
  full_name text not null,
  goal text,
  created_at timestamp without time zone default now(),
  phone text,
  status text default 'Engaged'::text,
  last_checkin_at timestamp without time zone,
  sessions_this_month integer default 0,
  notes text,
  email text,
  calorie_target integer,
  protein_target_g integer,
  carbs_target_g integer,
  fats_target_g integer,
  water_target_ml integer default 2000,
  user_id uuid,
  profile_photo_url text,
  claim_token uuid default gen_random_uuid() not null
);

create table public.exercise_aliases (
  id uuid default gen_random_uuid() not null,
  exercise_id uuid,
  alias text not null,
  created_at timestamp with time zone default now()
);

create table public.exercises (
  id uuid default gen_random_uuid() not null,
  name text not null,
  muscle_group text,
  instructions text,
  created_by uuid,
  is_global boolean default false,
  created_at timestamp with time zone default now(),
  equipment text default 'barbell'::text,
  category text default 'strength'::text
);

create table public.food_logs (
  id uuid default gen_random_uuid() not null,
  client_id uuid,
  food_name text not null,
  brand text,
  meal_type text,
  serving_size_g numeric(8,2),
  servings numeric(4,2) default 1,
  calories numeric(8,2),
  protein_g numeric(8,2),
  carbs_g numeric(8,2),
  fats_g numeric(8,2),
  barcode text,
  logged_at date default CURRENT_DATE,
  created_at timestamp with time zone default now()
);

create table public.foods (
  id uuid default gen_random_uuid() not null,
  public_food_key text not null,
  name text not null,
  calories integer,
  protein_g numeric(6,2),
  carbs_g numeric(6,2),
  fats_g numeric(6,2),
  fibre_g numeric(6,2),
  sugar_g numeric(6,2),
  sodium_mg numeric(8,2),
  saturated_fat_g numeric(6,2),
  source text default 'AFCD_R3'::text not null,
  created_at timestamp with time zone default now() not null
);

create table public.habit_logs (
  id uuid default gen_random_uuid() not null,
  habit_id uuid,
  client_id uuid,
  completed_date date default CURRENT_DATE,
  completed boolean default true,
  notes text,
  created_at timestamp with time zone default now()
);

create table public.habits (
  id uuid default gen_random_uuid() not null,
  name text not null,
  description text,
  icon text default '✅'::text,
  frequency text default 'daily'::text,
  target_per_week integer default 7,
  client_id uuid,
  created_by uuid,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

create table public.meal_foods (
  id uuid default gen_random_uuid() not null,
  meal_id uuid,
  food_name text not null,
  brand text,
  serving_size_g numeric(8,2),
  calories numeric(8,2),
  protein_g numeric(8,2),
  carbs_g numeric(8,2),
  fats_g numeric(8,2),
  barcode text,
  open_food_facts_id text,
  created_at timestamp with time zone default now()
);

create table public.meal_plans (
  id uuid default gen_random_uuid() not null,
  name text not null,
  description text,
  created_by uuid,
  client_id uuid,
  daily_calories integer,
  protein_target_g integer,
  carbs_target_g integer,
  fats_target_g integer,
  is_active boolean default true,
  is_template boolean default false,
  created_at timestamp with time zone default now()
);

create table public.meal_template_foods (
  id uuid default gen_random_uuid() not null,
  meal_template_id uuid,
  food_name text not null,
  serving_size_g numeric(8,2),
  calories numeric(8,2),
  protein_g numeric(8,2),
  carbs_g numeric(8,2),
  fats_g numeric(8,2),
  created_at timestamp with time zone default now()
);

create table public.meal_templates (
  id uuid default gen_random_uuid() not null,
  name text not null,
  description text,
  meal_time text,
  category text,
  total_calories numeric(8,2),
  total_protein_g numeric(8,2),
  total_carbs_g numeric(8,2),
  total_fats_g numeric(8,2),
  created_at timestamp with time zone default now(),
  instructions text,
  prep_time_minutes integer
);

create table public.meals (
  id uuid default gen_random_uuid() not null,
  meal_plan_id uuid,
  name text not null,
  meal_time text,
  order_index integer default 0,
  created_at timestamp with time zone default now()
);

create table public.personal_bests (
  id uuid default gen_random_uuid() not null,
  client_id uuid,
  exercise_id uuid,
  pb_type text not null,
  value numeric(10,2) not null,
  reps_completed integer,
  weight_kg numeric(6,2),
  achieved_at timestamp with time zone default now(),
  scheduled_workout_id uuid
);

create table public.profiles (
  id uuid not null,
  full_name text,
  email text,
  created_at timestamp without time zone default now(),
  role text not null
);

create table public.program_assignments (
  id uuid default gen_random_uuid() not null,
  program_id uuid,
  client_id uuid,
  assigned_by uuid,
  start_date date default CURRENT_DATE,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

create table public.program_workouts (
  id uuid default gen_random_uuid() not null,
  program_id uuid,
  day_number integer not null,
  name text,
  created_at timestamp with time zone default now()
);

create table public.programs (
  id uuid default gen_random_uuid() not null,
  name text not null,
  description text,
  created_by uuid,
  created_at timestamp with time zone default now()
);

create table public.progress_photos (
  id uuid default gen_random_uuid() not null,
  client_id uuid,
  photo_url text not null,
  note text,
  taken_date date default CURRENT_DATE,
  created_at timestamp with time zone default now()
);

create table public.pt_notes (
  id uuid default gen_random_uuid() not null,
  client_id uuid not null,
  pt_id uuid not null,
  text text not null,
  created_at timestamp with time zone default now() not null
);

create table public.resource_assignments (
  id uuid default gen_random_uuid() not null,
  resource_id uuid,
  client_id uuid,
  assigned_at timestamp with time zone default now()
);

create table public.resources (
  id uuid default gen_random_uuid() not null,
  created_by uuid,
  title text not null,
  description text,
  type text not null,
  url text,
  file_path text,
  is_global boolean default false,
  created_at timestamp with time zone default now()
);

create table public.saved_meals (
  id uuid default gen_random_uuid() not null,
  client_id uuid,
  name text not null,
  content text not null,
  calories numeric default 0,
  protein_g numeric default 0,
  carbs_g numeric default 0,
  fats_g numeric default 0,
  created_at timestamp with time zone default now()
);

create table public.saved_workouts (
  id uuid default gen_random_uuid() not null,
  client_id uuid,
  name text not null,
  content text not null,
  created_at timestamp with time zone default now()
);

create table public.scheduled_workouts (
  id uuid default gen_random_uuid() not null,
  client_id uuid not null,
  program_workout_id uuid,
  scheduled_date date not null,
  created_by uuid,
  created_at timestamp with time zone default now(),
  custom_workout_id uuid
);

create table public.water_logs (
  id uuid default gen_random_uuid() not null,
  client_id uuid not null,
  logged_by uuid,
  amount_ml integer not null,
  logged_date date default CURRENT_DATE not null,
  created_at timestamp with time zone default now()
);

create table public.workout_exercises (
  id uuid default gen_random_uuid() not null,
  program_workout_id uuid,
  exercise_id uuid,
  sets integer,
  reps text,
  rest_seconds integer,
  notes text,
  order_index integer default 0,
  created_at timestamp with time zone default now()
);

create table public.workout_logs (
  id uuid default gen_random_uuid() not null,
  client_id uuid,
  program_workout_id uuid,
  logged_at timestamp with time zone default now(),
  notes text,
  completed boolean default false,
  completed_at timestamp with time zone default now(),
  total_volume_kg numeric,
  scheduled_workout_id uuid
);

create table public.workout_set_logs (
  id uuid default gen_random_uuid() not null,
  client_id uuid,
  scheduled_workout_id uuid,
  exercise_id uuid,
  set_number integer not null,
  reps_completed integer,
  weight_kg numeric(6,2) default 0,
  logged_at timestamp with time zone default now(),
  workout_log_id uuid
);

-- ---------------------------------------------------------------------
-- PRIMARY KEYS, UNIQUE AND CHECK CONSTRAINTS
-- ---------------------------------------------------------------------

alter table public.body_weight_logs add constraint body_weight_logs_pkey PRIMARY KEY (id);
alter table public.checkins add constraint checkins_pkey PRIMARY KEY (id);
alter table public.clients add constraint clients_pkey PRIMARY KEY (id);
alter table public.clients add constraint clients_claim_token_key UNIQUE (claim_token);
alter table public.exercise_aliases add constraint exercise_aliases_pkey PRIMARY KEY (id);
alter table public.exercises add constraint exercises_pkey PRIMARY KEY (id);
alter table public.food_logs add constraint food_logs_pkey PRIMARY KEY (id);
alter table public.foods add constraint foods_pkey PRIMARY KEY (id);
alter table public.foods add constraint foods_public_food_key_key UNIQUE (public_food_key);
alter table public.habit_logs add constraint habit_logs_pkey PRIMARY KEY (id);
alter table public.habit_logs add constraint habit_logs_habit_id_completed_date_key UNIQUE (habit_id, completed_date);
alter table public.habits add constraint habits_pkey PRIMARY KEY (id);
alter table public.meal_foods add constraint meal_foods_pkey PRIMARY KEY (id);
alter table public.meal_plans add constraint meal_plans_pkey PRIMARY KEY (id);
alter table public.meal_template_foods add constraint meal_template_foods_pkey PRIMARY KEY (id);
alter table public.meal_templates add constraint meal_templates_pkey PRIMARY KEY (id);
alter table public.meals add constraint meals_pkey PRIMARY KEY (id);
alter table public.personal_bests add constraint personal_bests_pkey PRIMARY KEY (id);
alter table public.personal_bests add constraint personal_bests_client_id_exercise_id_pb_type_key UNIQUE (client_id, exercise_id, pb_type);
alter table public.profiles add constraint profiles_pkey PRIMARY KEY (id);
alter table public.profiles add constraint profiles_role_check CHECK ((role = ANY (ARRAY['pt'::text, 'client'::text, 'solo'::text])));
alter table public.program_assignments add constraint program_assignments_pkey PRIMARY KEY (id);
alter table public.program_workouts add constraint program_workouts_pkey PRIMARY KEY (id);
alter table public.programs add constraint programs_pkey PRIMARY KEY (id);
alter table public.progress_photos add constraint progress_photos_pkey PRIMARY KEY (id);
alter table public.pt_notes add constraint pt_notes_pkey PRIMARY KEY (id);
alter table public.resource_assignments add constraint resource_assignments_pkey PRIMARY KEY (id);
alter table public.resource_assignments add constraint resource_assignments_resource_id_client_id_key UNIQUE (resource_id, client_id);
alter table public.resources add constraint resources_pkey PRIMARY KEY (id);
alter table public.resources add constraint resources_type_check CHECK ((type = ANY (ARRAY['pdf'::text, 'podcast'::text, 'article'::text, 'video'::text, 'other'::text])));
alter table public.saved_meals add constraint saved_meals_pkey PRIMARY KEY (id);
alter table public.saved_workouts add constraint saved_workouts_pkey PRIMARY KEY (id);
alter table public.scheduled_workouts add constraint scheduled_workouts_pkey PRIMARY KEY (id);
alter table public.water_logs add constraint water_logs_pkey PRIMARY KEY (id);
alter table public.workout_exercises add constraint workout_exercises_pkey PRIMARY KEY (id);
alter table public.workout_logs add constraint workout_logs_pkey PRIMARY KEY (id);
alter table public.workout_set_logs add constraint workout_set_logs_pkey PRIMARY KEY (id);

-- ---------------------------------------------------------------------
-- FOREIGN KEYS
-- ---------------------------------------------------------------------

alter table public.body_weight_logs add constraint body_weight_logs_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
alter table public.body_weight_logs add constraint body_weight_logs_logged_by_fkey FOREIGN KEY (logged_by) REFERENCES auth.users(id);
alter table public.checkins add constraint checkins_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
alter table public.clients add constraint clients_pt_id_fkey FOREIGN KEY (pt_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.clients add constraint clients_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);
alter table public.exercise_aliases add constraint exercise_aliases_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE;
alter table public.exercises add constraint exercises_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.food_logs add constraint food_logs_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
alter table public.habit_logs add constraint habit_logs_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
alter table public.habit_logs add constraint habit_logs_habit_id_fkey FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE;
alter table public.habits add constraint habits_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
alter table public.habits add constraint habits_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.meal_foods add constraint meal_foods_meal_id_fkey FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE;
alter table public.meal_plans add constraint meal_plans_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
alter table public.meal_plans add constraint meal_plans_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.meal_template_foods add constraint meal_template_foods_meal_template_id_fkey FOREIGN KEY (meal_template_id) REFERENCES meal_templates(id) ON DELETE CASCADE;
alter table public.meals add constraint meals_meal_plan_id_fkey FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id) ON DELETE CASCADE;
alter table public.personal_bests add constraint personal_bests_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
alter table public.personal_bests add constraint personal_bests_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE;
alter table public.personal_bests add constraint personal_bests_scheduled_workout_id_fkey FOREIGN KEY (scheduled_workout_id) REFERENCES scheduled_workouts(id) ON DELETE SET NULL;
alter table public.profiles add constraint profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.program_assignments add constraint program_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table public.program_assignments add constraint program_assignments_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
alter table public.program_assignments add constraint program_assignments_program_id_fkey FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE;
alter table public.program_workouts add constraint program_workouts_program_id_fkey FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE;
alter table public.programs add constraint programs_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.progress_photos add constraint progress_photos_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
alter table public.pt_notes add constraint pt_notes_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
alter table public.pt_notes add constraint pt_notes_pt_id_fkey FOREIGN KEY (pt_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.resource_assignments add constraint resource_assignments_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
alter table public.resource_assignments add constraint resource_assignments_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE;
alter table public.resources add constraint resources_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.saved_meals add constraint saved_meals_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
alter table public.saved_workouts add constraint saved_workouts_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
alter table public.scheduled_workouts add constraint scheduled_workouts_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
alter table public.scheduled_workouts add constraint scheduled_workouts_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table public.scheduled_workouts add constraint scheduled_workouts_custom_workout_id_fkey FOREIGN KEY (custom_workout_id) REFERENCES saved_workouts(id) ON DELETE SET NULL;
alter table public.scheduled_workouts add constraint scheduled_workouts_program_workout_id_fkey FOREIGN KEY (program_workout_id) REFERENCES program_workouts(id) ON DELETE CASCADE;
alter table public.water_logs add constraint water_logs_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
alter table public.water_logs add constraint water_logs_logged_by_fkey FOREIGN KEY (logged_by) REFERENCES auth.users(id);
alter table public.workout_exercises add constraint workout_exercises_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE;
alter table public.workout_exercises add constraint workout_exercises_program_workout_id_fkey FOREIGN KEY (program_workout_id) REFERENCES program_workouts(id) ON DELETE CASCADE;
alter table public.workout_logs add constraint workout_logs_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
alter table public.workout_logs add constraint workout_logs_program_workout_id_fkey FOREIGN KEY (program_workout_id) REFERENCES program_workouts(id) ON DELETE SET NULL;
alter table public.workout_logs add constraint workout_logs_scheduled_workout_id_fkey FOREIGN KEY (scheduled_workout_id) REFERENCES scheduled_workouts(id) ON DELETE SET NULL;
alter table public.workout_set_logs add constraint workout_set_logs_client_id_fkey FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
alter table public.workout_set_logs add constraint workout_set_logs_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE;
alter table public.workout_set_logs add constraint workout_set_logs_scheduled_workout_id_fkey FOREIGN KEY (scheduled_workout_id) REFERENCES scheduled_workouts(id) ON DELETE CASCADE;

-- ---------------------------------------------------------------------
-- INDEXES (beyond those backing constraints)
-- ---------------------------------------------------------------------

CREATE INDEX clients_user_id_idx ON public.clients USING btree (user_id);
CREATE INDEX idx_exercise_aliases_alias ON public.exercise_aliases USING gin (to_tsvector('english'::regconfig, alias));
CREATE INDEX idx_exercise_aliases_exercise_id ON public.exercise_aliases USING btree (exercise_id);
CREATE INDEX idx_foods_name_trgm ON public.foods USING gin (name gin_trgm_ops);
CREATE INDEX idx_workout_set_logs_workout_log_id ON public.workout_set_logs USING btree (workout_log_id);

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY (enabled on every public table)
-- ---------------------------------------------------------------------

alter table public.body_weight_logs enable row level security;
alter table public.checkins enable row level security;
alter table public.clients enable row level security;
alter table public.exercise_aliases enable row level security;
alter table public.exercises enable row level security;
alter table public.food_logs enable row level security;
alter table public.foods enable row level security;
alter table public.habit_logs enable row level security;
alter table public.habits enable row level security;
alter table public.meal_foods enable row level security;
alter table public.meal_plans enable row level security;
alter table public.meal_template_foods enable row level security;
alter table public.meal_templates enable row level security;
alter table public.meals enable row level security;
alter table public.personal_bests enable row level security;
alter table public.profiles enable row level security;
alter table public.program_assignments enable row level security;
alter table public.program_workouts enable row level security;
alter table public.programs enable row level security;
alter table public.progress_photos enable row level security;
alter table public.pt_notes enable row level security;
alter table public.resource_assignments enable row level security;
alter table public.resources enable row level security;
alter table public.saved_meals enable row level security;
alter table public.saved_workouts enable row level security;
alter table public.scheduled_workouts enable row level security;
alter table public.water_logs enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_logs enable row level security;
alter table public.workout_set_logs enable row level security;

-- ---------------------------------------------------------------------
-- POLICIES
-- ---------------------------------------------------------------------

-- body_weight_logs
create policy "Clients can manage their own weight logs" on public.body_weight_logs as PERMISSIVE for ALL to public
  using ((auth.uid() = logged_by));
create policy "PTs can manage weight logs for their clients" on public.body_weight_logs as PERMISSIVE for ALL to public
  using ((EXISTS ( SELECT 1 FROM clients WHERE ((clients.id = body_weight_logs.client_id) AND (clients.pt_id = auth.uid())))));

-- checkins
create policy "Anon can insert one checkin per client per 24h" on public.checkins as PERMISSIVE for INSERT to anon
  with check (((client_id IS NOT NULL) AND checkin_rate_ok(client_id)));
create policy "Clients can submit their own checkins" on public.checkins as PERMISSIVE for INSERT to authenticated
  with check (((client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid()))) AND checkin_rate_ok(client_id)));
create policy "Clients can view their own checkins" on public.checkins as PERMISSIVE for SELECT to authenticated
  using ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid()))));
create policy "PTs can reply to their clients checkins" on public.checkins as PERMISSIVE for UPDATE to authenticated
  using ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.pt_id = auth.uid()))))
  with check ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.pt_id = auth.uid()))));
create policy "PTs can view their clients checkins" on public.checkins as PERMISSIVE for SELECT to authenticated
  using ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.pt_id = auth.uid()))));

-- clients
create policy "Clients can read their own record" on public.clients as PERMISSIVE for SELECT to public
  using ((auth.uid() = user_id));
create policy "Clients can update their own targets" on public.clients as PERMISSIVE for UPDATE to public
  using ((user_id = auth.uid()))
  with check ((user_id = auth.uid()));
create policy "PTs can delete their own clients" on public.clients as PERMISSIVE for DELETE to authenticated
  using ((auth.uid() = pt_id));
create policy "PTs can insert their own clients" on public.clients as PERMISSIVE for INSERT to authenticated
  with check ((auth.uid() = pt_id));
create policy "PTs can update their own clients" on public.clients as PERMISSIVE for UPDATE to authenticated
  using ((auth.uid() = pt_id));
create policy "PTs can view their own clients" on public.clients as PERMISSIVE for SELECT to authenticated
  using ((auth.uid() = pt_id));

-- exercise_aliases
create policy "Anyone can read aliases" on public.exercise_aliases as PERMISSIVE for SELECT to public
  using (true);

-- exercises
create policy "Create own private exercises" on public.exercises as PERMISSIVE for INSERT to authenticated
  with check (((created_by = auth.uid()) AND (COALESCE(is_global, false) = false)));
create policy "Read global, own, and own coach's exercises" on public.exercises as PERMISSIVE for SELECT to authenticated
  using (((is_global = true) OR (created_by = auth.uid()) OR (created_by IN ( SELECT c.pt_id FROM clients c WHERE (c.user_id = auth.uid())))));
create policy "Update own private exercises" on public.exercises as PERMISSIVE for UPDATE to authenticated
  using ((created_by = auth.uid()))
  with check (((created_by = auth.uid()) AND (COALESCE(is_global, false) = false)));

-- food_logs
create policy "Clients manage their own food logs" on public.food_logs as PERMISSIVE for ALL to authenticated
  using ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid()))))
  with check ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid()))));
create policy "PTs manage their clients food logs" on public.food_logs as PERMISSIVE for ALL to authenticated
  using ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.pt_id = auth.uid()))))
  with check ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.pt_id = auth.uid()))));

-- foods
create policy foods_read_all_authenticated on public.foods as PERMISSIVE for SELECT to authenticated
  using (true);

-- habit_logs
create policy "Clients manage their own habit logs" on public.habit_logs as PERMISSIVE for ALL to authenticated
  using ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid()))))
  with check ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid()))));
create policy "PT can view habit logs" on public.habit_logs as PERMISSIVE for SELECT to public
  using ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.pt_id = auth.uid()))));
create policy "PTs manage their clients habit logs" on public.habit_logs as PERMISSIVE for ALL to authenticated
  using ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.pt_id = auth.uid()))))
  with check ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.pt_id = auth.uid()))));

-- habits
create policy "PT can manage habits" on public.habits as PERMISSIVE for ALL to public
  using ((created_by = auth.uid()));

-- meal_foods
create policy "PT can manage meal foods" on public.meal_foods as PERMISSIVE for ALL to public
  using ((meal_id IN ( SELECT m.id FROM (meals m JOIN meal_plans mp ON ((m.meal_plan_id = mp.id))) WHERE (mp.created_by = auth.uid()))));

-- meal_plans
create policy "PT can manage meal plans" on public.meal_plans as PERMISSIVE for ALL to public
  using ((created_by = auth.uid()));

-- meal_template_foods, meal_templates
create policy "Anyone can view meal template foods" on public.meal_template_foods as PERMISSIVE for SELECT to public
  using (true);
create policy "Anyone can view meal templates" on public.meal_templates as PERMISSIVE for SELECT to public
  using (true);

-- meals
create policy "PT can manage meals" on public.meals as PERMISSIVE for ALL to public
  using ((meal_plan_id IN ( SELECT meal_plans.id FROM meal_plans WHERE (meal_plans.created_by = auth.uid()))));

-- personal_bests
create policy "Clients manage their own PBs" on public.personal_bests as PERMISSIVE for ALL to public
  using ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid()))))
  with check ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid()))));
create policy "PTs can insert their clients PBs" on public.personal_bests as PERMISSIVE for INSERT to public
  with check ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.pt_id = auth.uid()))));
create policy "PTs can read their clients PBs" on public.personal_bests as PERMISSIVE for SELECT to public
  using ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.pt_id = auth.uid()))));
create policy "PTs can update their clients PBs" on public.personal_bests as PERMISSIVE for UPDATE to public
  using ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.pt_id = auth.uid()))))
  with check ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.pt_id = auth.uid()))));

-- profiles
create policy "Users can insert their own profile" on public.profiles as PERMISSIVE for INSERT to authenticated
  with check ((auth.uid() = id));
create policy "Users can update their own profile" on public.profiles as PERMISSIVE for UPDATE to authenticated
  using ((auth.uid() = id));
create policy "Users can view their own profile" on public.profiles as PERMISSIVE for SELECT to authenticated
  using ((auth.uid() = id));

-- program_assignments
create policy "Clients can read their own program assignments" on public.program_assignments as PERMISSIVE for SELECT to public
  using ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid()))));
create policy "PT can manage assignments" on public.program_assignments as PERMISSIVE for ALL to public
  using ((assigned_by = auth.uid()));
create policy "PTs can insert program assignments" on public.program_assignments as PERMISSIVE for INSERT to public
  with check ((auth.uid() IN ( SELECT clients.pt_id FROM clients WHERE (clients.id = program_assignments.client_id))));
create policy "PTs can read program assignments" on public.program_assignments as PERMISSIVE for SELECT to public
  using ((auth.uid() IN ( SELECT clients.pt_id FROM clients WHERE (clients.id = program_assignments.client_id))));
create policy "PTs can update program assignments" on public.program_assignments as PERMISSIVE for UPDATE to public
  using ((auth.uid() IN ( SELECT clients.pt_id FROM clients WHERE (clients.id = program_assignments.client_id))));

-- program_workouts
create policy "Clients can read program workouts" on public.program_workouts as PERMISSIVE for SELECT to public
  using ((program_id IN ( SELECT program_assignments.program_id FROM program_assignments WHERE (program_assignments.client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid()))))));
create policy "PT can manage program workouts" on public.program_workouts as PERMISSIVE for ALL to public
  using ((program_id IN ( SELECT programs.id FROM programs WHERE (programs.created_by = auth.uid()))));

-- programs
create policy "Clients can read their assigned programs" on public.programs as PERMISSIVE for SELECT to public
  using ((id IN ( SELECT program_assignments.program_id FROM program_assignments WHERE (program_assignments.client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid()))))));
create policy "PT can manage own programs" on public.programs as PERMISSIVE for ALL to public
  using ((created_by = auth.uid()));

-- progress_photos
create policy "Clients manage their own photos" on public.progress_photos as PERMISSIVE for ALL to public
  using ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid()))))
  with check ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid()))));
create policy "PTs can read their clients photos" on public.progress_photos as PERMISSIVE for SELECT to public
  using ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.pt_id = auth.uid()))));

-- pt_notes
create policy "PTs can manage their own notes" on public.pt_notes as PERMISSIVE for ALL to public
  using ((auth.uid() = pt_id))
  with check ((auth.uid() = pt_id));

-- resource_assignments
create policy "Clients can read their assignments" on public.resource_assignments as PERMISSIVE for SELECT to public
  using ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid()))));
create policy "PTs manage resource assignments" on public.resource_assignments as PERMISSIVE for ALL to public
  using ((resource_id IN ( SELECT resources.id FROM resources WHERE (resources.created_by = auth.uid()))));

-- resources
create policy "Clients can read their resources" on public.resources as PERMISSIVE for SELECT to public
  using (((created_by = ( SELECT clients.pt_id FROM clients WHERE (clients.user_id = auth.uid()) LIMIT 1)) OR (is_global = true)));
create policy "PTs manage their own resources" on public.resources as PERMISSIVE for ALL to authenticated
  using ((auth.uid() = created_by))
  with check (((auth.uid() = created_by) AND (COALESCE(is_global, false) = false)));

-- saved_meals
create policy "Clients can delete their own saved meals" on public.saved_meals as PERMISSIVE for DELETE to public
  using ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid()))));
create policy "Clients can insert their own saved meals" on public.saved_meals as PERMISSIVE for INSERT to public
  with check ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid()))));
create policy "Clients can read their own saved meals" on public.saved_meals as PERMISSIVE for SELECT to public
  using ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid()))));
create policy "PTs can read their clients saved meals" on public.saved_meals as PERMISSIVE for SELECT to public
  using ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.pt_id = auth.uid()))));

-- saved_workouts
create policy "Clients can delete their own saved workouts" on public.saved_workouts as PERMISSIVE for DELETE to public
  using ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid()))));
create policy "Clients can insert their own saved workouts" on public.saved_workouts as PERMISSIVE for INSERT to public
  with check ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid()))));
create policy "Clients can read their own saved workouts" on public.saved_workouts as PERMISSIVE for SELECT to public
  using ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid()))));
create policy "PTs can read their clients saved workouts" on public.saved_workouts as PERMISSIVE for SELECT to public
  using ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.pt_id = auth.uid()))));

-- scheduled_workouts
create policy "Clients can delete their own scheduled workouts" on public.scheduled_workouts as PERMISSIVE for DELETE to public
  using ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid()))));
create policy "Clients can read their own scheduled workouts" on public.scheduled_workouts as PERMISSIVE for SELECT to public
  using ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid()))));
create policy "Clients can schedule their own workouts" on public.scheduled_workouts as PERMISSIVE for INSERT to public
  with check ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid()))));
create policy "PTs can manage scheduled workouts for their clients" on public.scheduled_workouts as PERMISSIVE for ALL to public
  using ((EXISTS ( SELECT 1 FROM clients WHERE ((clients.id = scheduled_workouts.client_id) AND (clients.pt_id = auth.uid())))));

-- water_logs
create policy "Clients can manage their own water logs" on public.water_logs as PERMISSIVE for ALL to public
  using ((auth.uid() = logged_by));
create policy "PTs can manage water logs for their clients" on public.water_logs as PERMISSIVE for ALL to public
  using ((EXISTS ( SELECT 1 FROM clients WHERE ((clients.id = water_logs.client_id) AND (clients.pt_id = auth.uid())))));

-- workout_exercises
create policy "Clients can read workout exercises" on public.workout_exercises as PERMISSIVE for SELECT to public
  using ((program_workout_id IN ( SELECT pw.id FROM (program_workouts pw JOIN program_assignments pa ON ((pa.program_id = pw.program_id))) WHERE (pa.client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid()))))));
create policy "PT can manage workout exercises" on public.workout_exercises as PERMISSIVE for ALL to public
  using ((program_workout_id IN ( SELECT pw.id FROM (program_workouts pw JOIN programs p ON ((pw.program_id = p.id))) WHERE (p.created_by = auth.uid()))));

-- workout_logs
create policy "Clients manage their own workout logs" on public.workout_logs as PERMISSIVE for ALL to public
  using ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid()))))
  with check ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid()))));
create policy "PT can view client workout logs" on public.workout_logs as PERMISSIVE for SELECT to public
  using ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.pt_id = auth.uid()))));
create policy "PTs can insert their clients workout logs" on public.workout_logs as PERMISSIVE for INSERT to public
  with check ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.pt_id = auth.uid()))));
create policy "PTs can read their clients workout logs" on public.workout_logs as PERMISSIVE for SELECT to public
  using ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.pt_id = auth.uid()))));
create policy "PTs can update their clients workout logs" on public.workout_logs as PERMISSIVE for UPDATE to authenticated
  using ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.pt_id = auth.uid()))))
  with check ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.pt_id = auth.uid()))));

-- workout_set_logs
create policy "Clients manage their own set logs" on public.workout_set_logs as PERMISSIVE for ALL to public
  using ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid()))))
  with check ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.user_id = auth.uid()))));
create policy "PTs can insert their clients set logs" on public.workout_set_logs as PERMISSIVE for INSERT to public
  with check ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.pt_id = auth.uid()))));
create policy "PTs can read their clients set logs" on public.workout_set_logs as PERMISSIVE for SELECT to public
  using ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.pt_id = auth.uid()))));
create policy "PTs can update their clients set logs" on public.workout_set_logs as PERMISSIVE for UPDATE to public
  using ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.pt_id = auth.uid()))))
  with check ((client_id IN ( SELECT clients.id FROM clients WHERE (clients.pt_id = auth.uid()))));

-- ---------------------------------------------------------------------
-- FUNCTIONS
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.checkin_rate_ok(p_client_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from public.clients c where c.id = p_client_id)
     and not exists (
       select 1 from public.checkins ch
       where ch.client_id = p_client_id
         and ch.submitted_at > now() - interval '24 hours'
     );
$function$;

CREATE OR REPLACE FUNCTION public.checkins_force_timestamps()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.submitted_at := now();
  new.created_at := now();
  return new;
end;
$function$;

-- Scheduled for removal in handoff section 4c.
CREATE OR REPLACE FUNCTION public.get_checkin_client(p_client_id uuid)
 RETURNS TABLE(id uuid, full_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select c.id, c.full_name
  from public.clients c
  where c.id = p_client_id;
$function$;

CREATE OR REPLACE FUNCTION public.get_claim_client(p_token uuid)
 RETURNS TABLE(full_name text, email text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    select c.full_name, c.email
      from public.clients c
     where c.claim_token = p_token
       and c.user_id is null
     limit 1;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  declare
    v_role   text;
    v_token  uuid;
    v_linked int;
  begin
    v_role := new.raw_user_meta_data->>'role';
    if v_role is null or v_role not in ('pt', 'client', 'solo') then
      raise exception
        'handle_new_user: signup metadata must set role to pt, client or solo (got %)',
        coalesce(v_role, 'null');
    end if;

    insert into public.profiles (id, email, full_name, role)
    values (new.id, new.email, new.raw_user_meta_data->>'full_name', v_role)
    on conflict (id) do nothing;

    -- A client account only exists because a coach created the row and shared a claim
    -- link, so a valid unused token is required.
    if v_role = 'client' then
      begin
        v_token := (new.raw_user_meta_data->>'claim_token')::uuid;
      exception when others then
        raise exception 'handle_new_user: claim_token is not a valid uuid';
      end;

      if v_token is null then
        raise exception 'handle_new_user: a client signup must include a claim_token';
      end if;

      update public.clients
         set user_id = new.id
       where claim_token = v_token
         and user_id is null;
      get diagnostics v_linked = row_count;

      if v_linked <> 1 then
        raise exception 'handle_new_user: this claim link is not valid or has already been used';
      end if;
    end if;

    return new;
  end;
$function$;

CREATE OR REPLACE FUNCTION public.resolve_exercise_ids(p_names text[])
 RETURNS TABLE(input_name text, exercise_id uuid, matched_name text, muscle_group text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  with inputs as (
    select distinct unnest(p_names) as input_name
  ),
  norm_inputs as (
    select input_name,
           lower(trim(input_name)) as exact_key,
           regexp_replace(lower(trim(input_name)), '[^a-z0-9]', '', 'g') as loose_key
    from inputs
  ),
  ex as (
    select id, name, muscle_group,
           lower(trim(name)) as exact_key,
           regexp_replace(lower(trim(name)), '[^a-z0-9]', '', 'g') as loose_key
    from exercises
  ),
  al as (
    select a.exercise_id, e.name, e.muscle_group,
           lower(trim(a.alias)) as exact_key,
           regexp_replace(lower(trim(a.alias)), '[^a-z0-9]', '', 'g') as loose_key
    from exercise_aliases a
    join exercises e on e.id = a.exercise_id
  ),
  candidates as (
    select ni.input_name, ex.id as exercise_id, ex.name as matched_name, ex.muscle_group, 1 as priority
    from norm_inputs ni join ex on ex.exact_key = ni.exact_key
    union all
    select ni.input_name, al.exercise_id, al.name, al.muscle_group, 2
    from norm_inputs ni join al on al.exact_key = ni.exact_key
    union all
    select ni.input_name, ex.id, ex.name, ex.muscle_group, 3
    from norm_inputs ni join ex on ex.loose_key = ni.loose_key
    union all
    select ni.input_name, al.exercise_id, al.name, al.muscle_group, 4
    from norm_inputs ni join al on al.loose_key = ni.loose_key
  ),
  ranked as (
    select *, row_number() over (partition by input_name order by priority, exercise_id) as rn
    from candidates
  )
  select input_name, exercise_id, matched_name, muscle_group
  from ranked where rn = 1;
$function$;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

CREATE OR REPLACE FUNCTION public.search_foods(search_query text)
 RETURNS TABLE(id uuid, name text, calories integer, protein_g numeric, carbs_g numeric, fats_g numeric, fibre_g numeric, sugar_g numeric, sodium_mg numeric, saturated_fat_g numeric, source text)
 LANGUAGE sql
 STABLE
AS $function$
  with words as (
    select unnest(string_to_array(lower(trim(search_query)), ' ')) as w
  ),
  filtered as (
    select f.*
    from public.foods f
    where not exists (
      select 1 from words
      where words.w <> ''
        and f.name not ilike '%' || words.w || '%'
    )
  )
  select
    f.id, f.name, f.calories, f.protein_g, f.carbs_g, f.fats_g,
    f.fibre_g, f.sugar_g, f.sodium_mg, f.saturated_fat_g, f.source
  from filtered f
  order by similarity(lower(f.name), lower(search_query)) desc, length(f.name) asc
  limit 20;
$function$;

-- ---------------------------------------------------------------------
-- TRIGGERS
-- ---------------------------------------------------------------------

CREATE TRIGGER checkins_force_timestamps_trg BEFORE INSERT ON public.checkins FOR EACH ROW EXECUTE FUNCTION checkins_force_timestamps();
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ---------------------------------------------------------------------
-- COLUMN-LEVEL GRANTS
-- Table-level UPDATE on checkins was revoked from authenticated on 19 Oct;
-- coaches may update only these two columns.
-- ---------------------------------------------------------------------

revoke update on public.checkins from authenticated;
grant UPDATE (coach_reply) on public.checkins to authenticated;
grant UPDATE (replied_at) on public.checkins to authenticated;
