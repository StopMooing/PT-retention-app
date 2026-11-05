-- Recipe names for foods (food_search_terms) rank first only on an exact match, so a
-- plain search like "milk" or "rice" returns the same foods as before.
create or replace function public.search_foods(search_query text)
 returns table(id uuid, name text, calories integer, protein_g numeric, carbs_g numeric, fats_g numeric, fibre_g numeric, sugar_g numeric, sodium_mg numeric, saturated_fat_g numeric, source text)
 language sql
 stable
 set search_path to 'public', 'pg_temp'
as $function$
  with words as (
    select w from unnest(string_to_array(lower(trim(search_query)), ' ')) as w where w <> ''
  ),
  hits as (
    select f.id, similarity(lower(f.name), lower(search_query)) as score
    from public.foods f
    where not exists (select 1 from words where f.name not ilike '%' || words.w || '%')
    union all
    select t.food_id, case when t.term = lower(trim(search_query)) then 1.2 else similarity(t.term, lower(search_query)) * 0.5 end
    from public.food_search_terms t
    where not exists (select 1 from words where t.term not ilike '%' || words.w || '%')
  ),
  best as (
    select hits.id, max(hits.score) as score from hits group by hits.id
  )
  select
    f.id, f.name, f.calories, f.protein_g, f.carbs_g, f.fats_g,
    f.fibre_g, f.sugar_g, f.sodium_mg, f.saturated_fat_g, f.source
  from best b
  join public.foods f on f.id = b.id
  order by b.score desc, length(f.name) asc
  limit 20;
$function$;
