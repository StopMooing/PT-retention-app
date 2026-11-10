-- A photo for each library recipe, matched from Unsplash (free to use; first planned with Pexels) by the recipe-photos
-- edge function, with the photographer credit Pexels asks for. photo_key records which
-- search picked it, so the function only refetches when the chosen search changes.
alter table public.recipes
  add column if not exists photo_url text,
  add column if not exists photo_thumb_url text,
  add column if not exists photo_credit text,
  add column if not exists photo_credit_url text,
  add column if not exists photo_key text;
