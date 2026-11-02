-- Products clients add from a label after scanning a barcode that Open Food Facts does
-- not know. Shared by everyone signed in, so the next person who scans it gets it
-- straight away. Values are per 100 g. Only the person who added a product can correct it.
create table public.barcode_products (
  barcode text primary key check (barcode ~ '^[0-9]{8,14}$'),
  name text not null check (char_length(trim(name)) between 1 and 200),
  brand text check (brand is null or char_length(brand) <= 120),
  serving_size_g numeric check (serving_size_g is null or (serving_size_g > 0 and serving_size_g <= 2000)),
  calories_100g numeric not null check (calories_100g >= 0 and calories_100g <= 900),
  protein_100g numeric not null default 0 check (protein_100g >= 0 and protein_100g <= 100),
  carbs_100g numeric not null default 0 check (carbs_100g >= 0 and carbs_100g <= 100),
  fats_100g numeric not null default 0 check (fats_100g >= 0 and fats_100g <= 100),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index barcode_products_created_by_idx on public.barcode_products (created_by);
alter table public.barcode_products enable row level security;
create policy "Signed in users read products"
  on public.barcode_products for select to authenticated using (true);
create policy "Signed in users add products as themselves"
  on public.barcode_products for insert to authenticated
  with check (created_by = (select auth.uid()));
create policy "People correct the products they added"
  on public.barcode_products for update to authenticated
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()));
