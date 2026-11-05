-- Recipe library and on-demand meal plans.
-- recipes / recipe_ingredients: the recipe library (every recipe used in the plans).
-- meal_plan_library / meal_plan_library_items: 36 ready-made plans (6 styles x male and
-- female x cutting, maintenance and bulking). Each plan has three day types: A is Monday,
-- Wednesday and Friday, B is Tuesday, Thursday and Saturday, C is Sunday.
-- client_meal_plans: the plan a client has chosen (one at a time).
-- food_logs.plan_item_id / recipe_id: which planned meal or recipe a logged meal came from,
-- so the Nutrition tab can tick off today's planned meals.
-- Library rows are written only by migrations; every signed-in user can read them.

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  family text not null,
  day_type text check (day_type in ('A', 'B', 'C')),
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  name text not null,
  description text,
  prep_minutes integer,
  cook_minutes integer,
  steps jsonb not null default '[]'::jsonb,
  tip text,
  diets text[] not null default '{}',
  calories integer,
  protein_g numeric(6,1),
  carbs_g numeric(6,1),
  fats_g numeric(6,1),
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  position integer not null default 0,
  label text not null,
  food_id uuid references public.foods(id) on delete set null,
  grams numeric(7,1) not null,
  measure text,
  each_label text,
  each_grams numeric(6,1),
  calories numeric(7,1) not null default 0,
  protein_g numeric(6,1) not null default 0,
  carbs_g numeric(6,1) not null default 0,
  fats_g numeric(6,1) not null default 0
);
create index recipe_ingredients_recipe_id_idx on public.recipe_ingredients (recipe_id);
create index recipe_ingredients_food_id_idx on public.recipe_ingredients (food_id);

create table public.meal_plan_library (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  family text not null,
  family_name text not null,
  sex text not null check (sex in ('male', 'female')),
  goal text not null check (goal in ('cut', 'maintain', 'bulk')),
  name text not null,
  description text,
  ref_weight_kg numeric(5,1),
  ref_height_cm numeric(5,1),
  ref_age integer,
  activity_factor numeric(4,3),
  maintenance_calories integer,
  target_calories integer,
  target_protein_g integer,
  target_carbs_g integer,
  target_fats_g integer,
  avg_calories integer,
  avg_protein_g integer,
  avg_carbs_g integer,
  avg_fats_g integer,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.meal_plan_library_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.meal_plan_library(id) on delete cascade,
  day_type text not null check (day_type in ('A', 'B', 'C')),
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  position integer not null default 0,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  servings numeric(4,2) not null default 1
);
create index meal_plan_library_items_plan_id_idx on public.meal_plan_library_items (plan_id);
create index meal_plan_library_items_recipe_id_idx on public.meal_plan_library_items (recipe_id);

create table public.client_meal_plans (
  client_id uuid primary key references public.clients(id) on delete cascade,
  plan_id uuid not null references public.meal_plan_library(id) on delete cascade,
  started_at timestamptz not null default now()
);
create index client_meal_plans_plan_id_idx on public.client_meal_plans (plan_id);

alter table public.food_logs add column plan_item_id uuid references public.meal_plan_library_items(id) on delete set null;
alter table public.food_logs add column recipe_id uuid references public.recipes(id) on delete set null;
create index food_logs_plan_item_id_idx on public.food_logs (plan_item_id);
create index food_logs_recipe_id_idx on public.food_logs (recipe_id);

-- Row level security
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.meal_plan_library enable row level security;
alter table public.meal_plan_library_items enable row level security;
alter table public.client_meal_plans enable row level security;

create policy "Signed-in users read recipes" on public.recipes for select to authenticated using (true);
create policy "Signed-in users read recipe ingredients" on public.recipe_ingredients for select to authenticated using (true);
create policy "Signed-in users read meal plans" on public.meal_plan_library for select to authenticated using (true);
create policy "Signed-in users read meal plan items" on public.meal_plan_library_items for select to authenticated using (true);

-- A client chooses, changes and stops their own plan; their coach can see it.
create policy "Clients manage their own meal plan choice" on public.client_meal_plans
  for all to authenticated
  using (client_id in (select id from public.clients where user_id = (select auth.uid())))
  with check (client_id in (select id from public.clients where user_id = (select auth.uid())));
create policy "Coaches read their clients meal plan choice" on public.client_meal_plans
  for select to authenticated
  using (client_id in (select id from public.clients where pt_id = (select auth.uid())));

-- Library tables have no insert, update or delete policies, so app users can only read them.
