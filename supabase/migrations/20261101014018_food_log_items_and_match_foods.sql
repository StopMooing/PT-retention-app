-- Ingredients inside a logged meal (an AI meal or a saved meal). The meal stays one
-- food_logs row, so every total keeps working; this table holds what is in it.
-- Anyone who can see the meal (the client, or their coach) can see and change its
-- ingredients: the policy checks the parent row through food_logs' own RLS.
create table public.food_log_items (
  id uuid primary key default gen_random_uuid(),
  food_log_id uuid not null references public.food_logs(id) on delete cascade,
  position smallint not null default 0,
  name text not null check (char_length(name) between 1 and 200),
  food_id uuid references public.foods(id) on delete set null,
  grams numeric check (grams is null or (grams > 0 and grams <= 5000)),
  calories numeric not null default 0 check (calories >= 0 and calories <= 10000),
  protein_g numeric not null default 0 check (protein_g >= 0),
  carbs_g numeric not null default 0 check (carbs_g >= 0),
  fats_g numeric not null default 0 check (fats_g >= 0),
  estimated boolean not null default false,
  created_at timestamptz not null default now()
);
create index food_log_items_food_log_id_idx on public.food_log_items (food_log_id);
create index food_log_items_food_id_idx on public.food_log_items (food_id);
alter table public.food_log_items enable row level security;
create policy "Ingredients follow their meal"
  on public.food_log_items for all to authenticated
  using (exists (select 1 from public.food_logs l where l.id = food_log_id))
  with check (exists (select 1 from public.food_logs l where l.id = food_log_id));

-- Best food in the database for each ingredient name (up to 40 at once), with a score.
-- Scores words in the name that match the ingredient (whole words, plurals folded),
-- prefers foods whose name starts with the ingredient, and marks down processed forms
-- the ingredient did not ask for (oil, powder, chips...). Callers treat a low score as
-- "no good match".
create or replace function public.match_foods(queries text[])
returns table (ord int, query text, id uuid, name text, calories int, protein_g numeric, carbs_g numeric, fats_g numeric, score numeric)
language sql stable
set search_path = public, pg_temp
as $$
  with q as (
    select x.ord::int as ord, trim(x.query) as query
    from unnest(queries[1:40]) with ordinality as x(query, ord)
    where char_length(trim(x.query)) between 2 and 200
  ),
  toks as (
    select q.ord, q.query,
      array_agg(regexp_replace(regexp_replace(w.t, 'ies$', ''), '(es|s)$', '') order by w.n) as tk
    from q, regexp_split_to_table(lower(q.query), '[^a-z]+') with ordinality as w(t, n)
    where length(w.t) >= 3
    group by q.ord, q.query
  )
  select t.ord, t.query, b.id, b.name, b.calories, b.protein_g, b.carbs_g, b.fats_g, round(b.score, 2)
  from toks t
  left join lateral (
    select f.id, f.name, f.calories, f.protein_g, f.carbs_g, f.fats_g, (
        2.0 * (select count(*) from unnest(t.tk) w where lower(f.name) ~ ('\m' || w))::numeric / cardinality(t.tk)
        + similarity(lower(f.name), lower(t.query))
        + case when split_part(lower(f.name), ',', 1) ~ ('\m' || t.tk[1]) then 0.6 else 0 end
        - case when (select count(*) from unnest(t.tk) w where split_part(lower(f.name), ',', 1) ~ ('\m' || w)) = 0 then 0.5 else 0 end
        - 0.4 * (select count(*) from unnest(array['powder','dried','dish','beverage','chip','flavoured','coated','sauce','fried','mix','juice','oil','flour','bar','spread','dessert','homemade']) p
                 where lower(f.name) ~ ('\m' || p) and not (p = any(t.tk)))
        - 0.004 * length(f.name)
      )::numeric as score
    from public.foods f
    where lower(f.name) ~ ('\m' || t.tk[1]) or lower(f.name) % lower(t.query)
    order by 7 desc, length(f.name)
    limit 1
  ) b on true
  order by t.ord;
$$;
grant execute on function public.match_foods(text[]) to authenticated;
