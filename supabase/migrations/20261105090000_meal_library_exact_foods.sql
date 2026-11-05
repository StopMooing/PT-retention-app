-- Points the recipe library at the exact foods added in 20261105081331_meal_library_foods_and_search
-- (paneer, garlic powder, Dijon mustard, rice vinegar, frozen edamame, dried chilli), with the
-- recipe totals, plan serves and plan averages that tools/meal-library/build.mjs gives for them.
-- Changes only library rows; no client data.
begin;

update public.recipe_ingredients ri
set food_id = f.id,
    calories = round(f.calories * ri.grams / 100, 1),
    protein_g = round(f.protein_g * ri.grams / 100, 1),
    carbs_g = round(f.carbs_g * ri.grams / 100, 1),
    fats_g = round(f.fats_g * ri.grams / 100, 1)
from (values
('veg-a-dinner', 0, '8a49ff3a-f932-3b4f-66a8-c72c2bf1028b'),
('veg-b-snack', 0, '3c0adac4-6a46-c399-9a33-87530e7aa871'),
('vgn-a-breakfast', 7, '1d275521-0f36-8029-18c8-f9c893204c78'),
('vgn-a-lunch', 4, '3c0adac4-6a46-c399-9a33-87530e7aa871'),
('vgn-b-snack', 0, '3c0adac4-6a46-c399-9a33-87530e7aa871'),
('vgn-b-snack', 1, 'b9d404d1-b26d-4cc7-a18a-ba65f4f2d6bb'),
('vgn-c-lunch', 5, 'e8715adf-14b3-48b1-941b-55d4755d0575'),
('pes-a-lunch', 2, '3c0adac4-6a46-c399-9a33-87530e7aa871'),
('pes-a-lunch', 7, '2c4ed3cd-1aae-43a3-27b1-0004265f62fb')
) as v(slug, pos, food_id)
join public.recipes r on r.slug = v.slug
join public.foods f on f.id = v.food_id::uuid
where ri.recipe_id = r.id and ri.position = v.pos;

update public.recipes r
set calories = v.c, protein_g = v.p, carbs_g = v.cb, fats_g = v.f
from (values
('veg-a-dinner', 738, 28, 72.2, 33.2),
('veg-b-snack', 229, 22.4, 11.4, 11.8),
('vgn-a-breakfast', 525, 35.7, 32.2, 25.3),
('vgn-a-lunch', 619, 30.6, 59.9, 23.8),
('vgn-b-snack', 220, 22.5, 15.3, 9.5),
('vgn-c-lunch', 454, 19.9, 56.1, 11.8),
('pes-a-lunch', 540, 40.3, 58.3, 14.6)
) as v(slug, c, p, cb, f)
where r.slug = v.slug;

update public.meal_plan_library_items i
set servings = v.servings
from (values
('vegetarian-male-cut', 'B', 1.2),
('vegetarian-male-maintain', 'B', 1.45),
('vegetarian-male-bulk', 'B', 1.6),
('vegan-male-cut', 'A', 1.05),
('vegan-male-maintain', 'B', 1.35),
('vegan-male-bulk', 'B', 1.5),
('vegan-female-maintain', 'B', 1.05),
('vegan-female-bulk', 'B', 1.2),
('pescatarian-male-cut', 'A', 1.35),
('pescatarian-female-bulk', 'A', 1.45)
) as v(slug, day_type, servings)
join public.meal_plan_library p on p.slug = v.slug
where i.plan_id = p.id and i.day_type = v.day_type;

update public.meal_plan_library p
set avg_calories = v.c, avg_protein_g = v.p, avg_carbs_g = v.cb, avg_fats_g = v.f
from (values
('vegetarian-male-cut', 2261, 130, 222, 83),
('vegetarian-male-maintain', 2759, 158, 273, 100),
('vegetarian-male-bulk', 3078, 178, 301, 113),
('vegetarian-female-cut', 1647, 95, 162, 60),
('vegetarian-female-maintain', 2118, 121, 209, 77),
('vegetarian-female-bulk', 2439, 141, 238, 89),
('vegan-male-cut', 2297, 128, 228, 82),
('vegan-male-maintain', 2768, 154, 276, 99),
('vegan-male-bulk', 3081, 171, 306, 111),
('vegan-female-cut', 1649, 92, 164, 60),
('vegan-female-maintain', 2138, 118, 213, 77),
('vegan-female-bulk', 2434, 135, 241, 88),
('pescatarian-male-cut', 2269, 169, 223, 68),
('pescatarian-male-maintain', 2764, 205, 272, 84),
('pescatarian-male-bulk', 3042, 226, 300, 92),
('pescatarian-female-cut', 1603, 119, 157, 49),
('pescatarian-female-maintain', 2158, 161, 211, 66),
('pescatarian-female-bulk', 2450, 182, 240, 75)
) as v(slug, c, p, cb, f)
where p.slug = v.slug;

commit;
