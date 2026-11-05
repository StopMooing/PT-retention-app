-- Foods the recipe library needs that the food database did not have, and recipe names for
-- foods, so typing what a recipe calls an ingredient ("soy milk", "pepitas", "sourdough")
-- finds the food in Log food. Values are per 100 g.
insert into public.foods (id, public_food_key, name, calories, protein_g, carbs_g, fats_g, fibre_g, sugar_g, sodium_mg, saturated_fat_g, source, source_url) values
  (md5('unfnshd-food:paneer')::uuid, 'UNFNSHD-paneer', 'Cheese, paneer', 293, 14.0, 3.0, 25.1, null, null, null, null, 'GENERIC', 'https://www.fatsecret.com.au/calories-nutrition/generic/paneer'),
  (md5('unfnshd-food:garlic-powder')::uuid, 'UNFNSHD-garlic-powder', 'Garlic, powder', 331, 16.6, 72.7, 0.7, 9.0, 2.4, 60, 0.3, 'USDA', 'https://fdc.nal.usda.gov/food-details/171325/nutrients'),
  (md5('unfnshd-food:mustard-dijon')::uuid, 'UNFNSHD-mustard-dijon', 'Mustard, Dijon', 148, 7.2, 3.2, 11.5, 0, 2.7, 1040, 1.0, 'BRAND', 'https://world.openfoodfacts.org/product/9300633216757/dijon-mustard-woolworths'),
  (md5('unfnshd-food:vinegar-rice-unseasoned')::uuid, 'UNFNSHD-vinegar-rice-unseasoned', 'Vinegar, rice, unseasoned', 0, 0, 0, 0, 0, 0, 0, 0, 'BRAND', 'https://www.recipal.com/ingredients/20207-nutrition-facts-calories-protein-carbs-fat-rice-vinegar'),
  (md5('unfnshd-food:edamame-shelled-frozen')::uuid, 'UNFNSHD-edamame-shelled-frozen', 'Edamame (green soybean), shelled, frozen', 109, 11.2, 7.6, 4.7, 4.8, 2.5, 6, null, 'USDA', 'https://fdc.nal.usda.gov/food-details/168410/nutrients')
on conflict (id) do nothing;

-- Other names for a food. Written only by migrations; every signed-in user can read them.
create table public.food_search_terms (
  food_id uuid not null references public.foods(id) on delete cascade,
  term text not null check (term = lower(term) and length(term) between 2 and 120),
  primary key (food_id, term)
);
alter table public.food_search_terms enable row level security;
create policy "Signed-in users read food search terms" on public.food_search_terms for select to authenticated using (true);

-- What each recipe calls its ingredients (from tools/meal-library).
insert into public.food_search_terms (food_id, term) select food_id::uuid, term from (values
('4df17883-33a3-4d7a-9d37-9199eb43ae98', 'rolled oats'),
('664e4be4-8acb-4ec3-a098-cc6913c98ca7', 'reduced fat milk'),
('850c6e5a-51af-470a-9128-8027ce46a0cf', 'greek yoghurt, low fat'),
('f35c709d-75ab-4cf9-b6d4-c9c50e410038', 'frozen mixed berries'),
('2a06de2e-e4f8-4dfb-8687-24a0220477df', 'chia seeds'),
('acd002d9-7a11-44d3-9566-79403e3ab328', 'honey'),
('34b61aee-e30f-426f-a4a9-409d88c339bb', 'chicken breast'),
('54337638-a32f-45d9-97ce-5d9766565e07', 'white rice, uncooked'),
('7f377404-9023-47a1-9f24-bddbc39aac34', 'broccoli'),
('505d5f12-2840-49d4-898c-2a7a1477d890', 'carrot'),
('ae1dcdf4-f2e6-4fe1-bbf0-82b783392c6c', 'salt-reduced soy sauce'),
('e2157b44-6821-4bdc-b5c3-1e600c8cb343', 'garlic'),
('26fe2508-6732-4894-91dc-b08caf8d1816', 'sesame oil'),
('12b836de-c003-4825-9fc5-37bcd74facfe', 'sesame seeds'),
('06d9acde-0ee1-42aa-a6c0-787f58c5902a', 'lean beef mince (5% fat)'),
('c9044844-4aa9-4f39-8976-71db16c5cd84', 'spaghetti, dry'),
('c0ea0631-1cb2-4545-aa1d-8155016406df', 'canned diced tomatoes'),
('1287ddd3-b59e-4411-9c44-cc2223faedfd', 'brown onion'),
('c1efb65c-f9ac-4f00-afcd-261d5894e7e4', 'zucchini'),
('76253849-1c32-41eb-940c-4cdd09d113fc', 'olive oil'),
('c5436f6c-0c10-4c7b-91d2-bb1020798467', 'parmesan, grated'),
('ede92b3c-1343-4c01-888c-13441f328c3a', 'wholemeal bread'),
('2f83216a-cc4e-488b-a465-3290f222b958', 'peanut butter, no added sugar'),
('9ca61613-5485-4a01-a2cc-a4842f2317e2', 'banana'),
('6ea61c58-f2df-4ab9-91d1-27e8dd7ee539', 'cinnamon'),
('78505c10-246a-414b-aaa8-1eaace0cda17', 'eggs'),
('919cdad7-a600-4d49-8b44-8c5f3291bdb8', 'baby spinach'),
('b83a9cf4-0027-469c-b7d6-a5796d03b13b', 'cherry tomatoes'),
('f18cee8d-6f57-4586-b366-8c73fc07dbb2', 'butter'),
('7e5501c8-dc06-4243-8584-770fce04d6a9', 'wholemeal wrap'),
('fab7db5e-a2db-4b60-870f-de379e9977cb', 'avocado'),
('cfea3600-c09f-4328-9d87-d08b9c82894e', 'cos lettuce'),
('46759d3c-a46e-4465-824b-9322851a8061', 'tomato'),
('34f50b0a-9071-473a-8250-ad1a3e8e5014', 'cucumber'),
('f5fc4443-41ca-4653-8fa7-ffa3e6256b10', 'cheddar, grated'),
('ba1c563f-9e9f-4bd2-8bb6-7098a7684c9b', 'lemon juice'),
('24e3af24-1ff6-4992-aa60-dc5fc9c79edb', 'brown rice, uncooked'),
('5a83f571-6451-4d57-9dd0-043959fce822', 'canned black beans, drained'),
('eac3816d-f082-49c2-a526-eff0c8f84bab', 'canned corn kernels, drained'),
('ff84ff78-62cb-4bca-ba35-4bb1c6fc8e84', 'red capsicum'),
('96a1cf18-ad35-4528-bcbe-8079eaf88e53', 'lime'),
('defe1bd9-da3d-43f2-bbba-d363547331ad', 'walnuts'),
('e8c739c1-c26d-4e88-9442-9a0f43d96f3f', 'self-raising flour'),
('78505c10-246a-414b-aaa8-1eaace0cda17', 'egg'),
('d5074a07-7f88-4f67-8092-37dd19f475bd', 'maple syrup'),
('cd4a86ae-40bd-4dbd-a61e-282bbe107157', 'lean leg ham'),
('f5fc4443-41ca-4653-8fa7-ffa3e6256b10', 'cheddar, sliced'),
('42b258b2-6358-49a2-b868-1ad24f710cb7', 'mixed salad leaves'),
('a46e7ba1-d779-4039-8679-15050f3826bb', 'balsamic vinegar'),
('5ac7422c-9b66-4e5b-8672-3e8c0110eea1', 'chicken thigh fillets, skinless'),
('aa16d94a-78cb-48ad-81fa-acd31c5d4dd7', 'potato'),
('e7ad6f24-7bbb-4c44-b1ef-f8a900afab6a', 'pumpkin'),
('62595a2c-0d3c-48d7-9ffa-459e8224b453', 'green beans'),
('ba1c563f-9e9f-4bd2-8bb6-7098a7684c9b', 'lemon'),
('dc9210c4-0b5a-4065-be6b-243d3aa956eb', 'cocoa powder'),
('6fc2b0f2-df3f-4a90-817d-e068ae23a7e8', 'ice cubes'),
('f00894c1-631a-4b79-ba41-20d601c598f4', 'tuna in springwater, drained'),
('6e21a760-375e-47e4-8b51-413e4ec4f8ae', 'frozen mixed vegetables'),
('3ff0ffa2-9335-453d-a148-ba9040d79c7e', 'sweet chilli sauce'),
('56af0964-8e49-4640-953a-b0d7eda0f2d3', 'spring onion'),
('c3ed1c65-e319-4360-9b60-4d22531c662e', 'canned red kidney beans, drained'),
('f868fe67-1090-4156-a3a8-021c1e0a0617', 'natural yoghurt'),
('891911d6-387c-4647-bbf7-1e4fb259947d', 'chilli powder'),
('d2535c9e-799f-4416-82aa-795441e89dd4', 'ground cumin'),
('98fa31fa-6f52-4b35-b12a-953cfe2afa51', 'wholegrain crackers'),
('73d54837-3b47-4132-9a00-005c5dbc8203', 'cheddar, reduced fat'),
('d78c7b2d-8c0a-4172-9a4d-a1a825a9dac1', 'apple'),
('f0e2536d-0388-41e1-8597-d8320606d0d3', 'baked beans in tomato sauce'),
('76253849-1c32-41eb-940c-4cdd09d113fc', 'olive oil spray'),
('c9044844-4aa9-4f39-8976-71db16c5cd84', 'pasta shapes, dry'),
('93b36f38-c6e4-4479-a6b3-2b8bf9aeef1a', 'cooked chicken breast'),
('5de968de-d174-4b24-9a92-f8d171a93af5', 'frozen peas'),
('61f357b7-c348-4e14-9f37-1e290aaa64a1', 'light mayonnaise'),
('a77c7f53-3139-4297-8fe5-e371ba018277', 'lean beef sausages'),
('e5807afa-5e57-46f3-b0e8-625362198562', 'potato'),
('da2fad0e-501a-4f9f-a954-fbcc17cc4207', 'red onion'),
('aa67d16a-2570-4b7d-9d2c-241977d90891', 'frozen green beans'),
('4e1af74a-36d8-4f30-b76e-b8dee3ac09b0', 'dried mixed herbs'),
('156c1cd9-5ba4-410a-ac72-33e4dc5f96ad', 'natural yoghurt, low fat'),
('02e24795-1a8b-4e7d-88c0-145e2977b107', 'untoasted muesli'),
('ac10119d-18ff-4ba5-90d4-ed72b9340f2b', 'sultanas'),
('73d54837-3b47-4132-9a00-005c5dbc8203', 'cheddar, reduced fat, grated'),
('f5fb1914-447f-4b60-a10a-efb28edfc791', 'wholemeal pita bread'),
('692f4f67-5b51-430e-aa4f-b69c04bd91da', 'tomato paste'),
('f931318e-982c-4930-acfd-55b34c637203', 'mozzarella, grated'),
('cc844b08-87f5-4a9b-9105-92b19a3b0c37', 'pineapple pieces, drained'),
('0134a093-96a6-4e05-8af7-ca5394a0b9d0', 'mushrooms'),
('dc03e0b5-6775-4e8f-9e08-45b4c5b1ff70', 'dried oregano'),
('1beba6ad-c5b0-4e68-a17a-c21ce4aa2d8d', 'plain rice cakes'),
('359d8360-b802-46ce-8caf-21518ed473b4', 'sourdough bread'),
('6400ea0e-437e-4444-9054-b7bb6bdf12d5', 'feta, reduced fat'),
('071f41eb-b911-4411-a2bb-6cb4d049377e', 'pita bread'),
('966a40e9-0f82-4b87-bc1b-292a137b64e1', 'lean lamb mince'),
('49ed119b-8570-46b5-bf9f-74c25530114f', 'bulgur (cracked wheat), dry'),
('3d8aa890-a5f6-46dd-a95d-4392a6c9f41d', 'flat-leaf parsley'),
('fe66655b-03f4-418f-8e57-bf8028662b15', 'hummus'),
('dc2ad2b8-85cb-43ad-a873-3436127a1dc9', 'ground coriander'),
('cd5b9ce4-415a-498e-8ad1-73f633602efb', 'quinoa, uncooked'),
('aa4744ea-6efb-4661-a4d4-0041ad71870d', 'kalamata olives'),
('e35ee61e-39ee-45e8-8651-31b9e2a95f84', 'couscous, dry'),
('21c6f5fc-69ea-4e38-b2fc-50a0b296f585', 'wholegrain bread'),
('97524459-a705-4c00-819b-c42c947f3975', 'ricotta, reduced fat'),
('e3721ccf-8972-42b7-8906-fe84c46bec46', 'smoked paprika'),
('95e231ef-7fd5-4c90-a531-2df66ed94956', 'canned cannellini beans, drained'),
('2bc11a68-212f-4813-bf84-25bdc15209d2', 'rocket'),
('2f8c97a5-e83d-4cb2-9b15-3d6122e2e0c2', 'beef rump steak, lean'),
('0bd0e1ca-0d7f-4618-afdf-a0f0d6669b22', 'pistachios, shelled'),
('7e5501c8-dc06-4243-8584-770fce04d6a9', 'wholemeal wraps'),
('83bee1be-5722-4757-80b1-a53a9e8708be', 'canned chickpeas, drained'),
('0a4ab3d8-a86f-4aa2-8a5c-218224e4ded1', 'light coconut milk'),
('62a2384d-206c-46de-b5be-aea5b59e9b0b', 'fresh ginger'),
('a34aa8c6-61d5-4090-ae0c-ec49be88308a', 'mild curry powder'),
('54337638-a32f-45d9-97ce-5d9766565e07', 'basmati rice, uncooked'),
('05301cfc-de64-44df-9b0f-ef11c465782c', 'cottage cheese, reduced fat'),
('e2f11969-cea9-4766-b5c1-c406284076b4', 'white vinegar'),
('34b3ade6-53a7-4fae-813b-ec27e35d8760', 'canned brown lentils, drained'),
('d40ebf7f-ef2d-49fe-af99-e28f8ef5026a', 'wholemeal spaghetti, dry'),
('1c55ba87-19ac-486e-8b92-93141d231e34', 'celery'),
('4e1af74a-36d8-4f30-b76e-b8dee3ac09b0', 'dried italian herbs'),
('3c0adac4-6a46-c399-9a33-87530e7aa871', 'frozen shelled edamame'),
('73d54837-3b47-4132-9a00-005c5dbc8203', 'cheddar cheese stick'),
('ca5a6049-1dab-4de3-809f-966b4cfa2f85', 'halloumi'),
('346f6b8f-fa89-459a-af07-5752350068d9', 'pepitas (pumpkin seeds)'),
('4e0cf91f-1be4-4fcd-9bf5-e7f40dccd23f', 'sweet potato'),
('3ad600f7-5bc2-41ad-9472-016bb59ef1d0', 'firm tofu'),
('ddffff56-e256-4b7f-903f-1a08eea2b1cd', 'soy milk'),
('ede1ab27-8301-43dc-97d1-771430c011ca', 'ground turmeric'),
('1d275521-0f36-8029-18c8-f9c893204c78', 'garlic powder'),
('a85805b7-e25d-489a-8899-6ae991291b38', 'tahini'),
('d8ee6318-22e4-4f98-a0df-9ae6c06b77c4', 'rice stick noodles, soaked'),
('67f5fb70-1c6a-41f5-884c-e6ac0ca1b311', 'snow peas'),
('20237b2e-acb6-4a13-ab9e-474d2f8471af', 'lime juice'),
('2cdb480f-5103-4c6d-9eda-f97b39615253', 'almonds'),
('feda3d9b-acf9-4085-b307-6701bb467ea6', 'red lentils, dry'),
('6136b745-0a29-4dc8-854f-da08cbead8a2', 'corn tortillas'),
('6495747a-159c-4225-8737-72649cebb84b', 'red cabbage'),
('f66351ec-4d61-4419-b317-4008a183273b', 'fresh coriander'),
('b9d404d1-b26d-4cc7-a18a-ba65f4f2d6bb', 'chilli flakes'),
('9311ba39-73ce-4f4b-adff-c1f90db57aa3', 'baking powder'),
('e8715adf-14b3-48b1-941b-55d4755d0575', 'dijon mustard'),
('d00baadf-02bd-4938-b41b-9c4fb1fc1996', 'bagel'),
('f5d7a150-2411-443a-8660-dd8475c2673b', 'smoked salmon'),
('48fd5d0c-536b-4d56-a7b3-4eb74ce04a5a', 'light cream cheese'),
('f15e261b-2598-42da-9680-8c195461d1c7', 'capers'),
('24a3dd71-92d7-40d0-b4f1-515cd5b3f85c', 'raw peeled prawns'),
('2c4ed3cd-1aae-43a3-27b1-0004265f62fb', 'rice vinegar'),
('588ce74c-6cae-4740-8d2d-41781a53d8f9', 'salmon fillet, skin on'),
('b62e2c59-67e0-44d2-a7bb-3d41376a08ec', 'broccolini'),
('d40ebf7f-ef2d-49fe-af99-e28f8ef5026a', 'wholemeal pasta, dry'),
('68b3463c-d6c2-4851-8f75-71d29e4d849e', 'fresh chives'),
('7da02d9a-c723-4a21-a2f2-85b4a6057e50', 'canned pink salmon, drained'),
('7acc3c3f-eedc-4317-95fe-6de39127cfa1', 'dry breadcrumbs'),
('2fccb1c9-1a9a-42aa-b771-bbb839f8dbdc', 'barramundi fillet')
) as v(food_id, term)
on conflict do nothing;

-- Same results as before, plus foods whose other name matches every word typed.
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
    select t.food_id, similarity(t.term, lower(search_query)) + 0.2
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
