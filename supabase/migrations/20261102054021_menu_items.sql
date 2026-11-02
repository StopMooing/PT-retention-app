-- Takeaway menu items (McDonald's, KFC, Subway...) with each chain's own published
-- nutrition figures, per serve ("1 Big Mac"), because chains rarely publish per 100 g.
-- Read-only for everyone signed in; rows are added by migrations or seed scripts that
-- record where each number came from and when it was checked.
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  chain text not null check (char_length(chain) between 1 and 80),
  name text not null check (char_length(name) between 1 and 200),
  serving_g numeric check (serving_g is null or (serving_g > 0 and serving_g <= 3000)),
  calories numeric not null check (calories >= 0 and calories <= 5000),
  protein_g numeric not null default 0 check (protein_g >= 0),
  carbs_g numeric not null default 0 check (carbs_g >= 0),
  fats_g numeric not null default 0 check (fats_g >= 0),
  source_url text not null,
  checked_on date not null,
  created_at timestamptz not null default now(),
  unique (chain, name)
);
create index menu_items_search_idx on public.menu_items using gin ((lower(chain || ' ' || name)) gin_trgm_ops);
alter table public.menu_items enable row level security;
create policy "Signed in users read menu items"
  on public.menu_items for select to authenticated using (true);
