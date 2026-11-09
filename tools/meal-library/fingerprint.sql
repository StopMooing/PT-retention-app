-- Fingerprint of the recipe and meal plan library: run after a refresh to check the live
-- database matches what tools/meal-library/build.mjs built (compare with a local dry run).
select
  (select count(*) from public.recipes) || '/' || (select count(*) from public.recipe_ingredients) || '/' ||
  (select count(*) from public.meal_plan_library) || '/' || (select count(*) from public.meal_plan_library_items) as counts,
  (select md5(string_agg(concat_ws('|', slug, family, day_type, meal_type, name, description, prep_minutes, cook_minutes, steps::text, tip, array_to_string(diets, ','), calories, protein_g, carbs_g, fats_g), ';' order by slug)) from public.recipes) as recipes,
  (select md5(string_agg(concat_ws('|', r.slug, i.position, i.label, i.food_id, i.grams, i.measure, i.each_label, i.each_grams, i.calories, i.protein_g, i.carbs_g, i.fats_g), ';' order by r.slug, i.position))
     from public.recipe_ingredients i join public.recipes r on r.id = i.recipe_id) as ingredients,
  (select md5(string_agg(concat_ws('|', slug, family, family_name, sex, goal, name, description, target_calories, avg_calories, avg_protein_g, avg_carbs_g, avg_fats_g, position), ';' order by slug)) from public.meal_plan_library) as plans,
  (select md5(string_agg(concat_ws('|', p.slug, i.day_type, i.meal_type, i.position, r.slug, i.servings), ';' order by p.slug, i.day_type, i.position))
     from public.meal_plan_library_items i join public.meal_plan_library p on p.id = i.plan_id join public.recipes r on r.id = i.recipe_id) as items;
