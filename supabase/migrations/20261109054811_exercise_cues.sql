-- Coaching cues stored on each exercise (the library rebuild fills them for every global
-- exercise). The app falls back to the built-in tips when an exercise has none.
alter table public.exercises add column if not exists cues text[];
