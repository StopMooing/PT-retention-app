-- A coach's own video for an exercise (an upload or a YouTube link). Their clients see it
-- when they open the exercise in a workout. One per coach per exercise.
create table public.exercise_media (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references auth.users (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  kind text not null check (kind in ('youtube', 'upload')),
  url text not null check (length(url) <= 1000),
  created_at timestamptz not null default now(),
  unique (coach_id, exercise_id)
);
create index exercise_media_exercise_id_idx on public.exercise_media (exercise_id);

alter table public.exercise_media enable row level security;

create policy "Coaches manage their own exercise videos" on public.exercise_media
  for all to authenticated
  using (coach_id = (select auth.uid()))
  with check (coach_id = (select auth.uid()));

create policy "Clients see their coach's exercise videos" on public.exercise_media
  for select to authenticated
  using (coach_id in (select c.pt_id from public.clients c where c.user_id = (select auth.uid())));

-- Video files: public to watch (the links are long and unguessable), and each coach can only
-- add or remove files in their own folder (<their id>/...). 50 MB a file.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('exercise-videos', 'exercise-videos', true, 52428800, array['video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do nothing;

create policy "Coaches upload exercise videos to their folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'exercise-videos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Coaches remove their exercise videos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'exercise-videos' and (storage.foldername(name))[1] = (select auth.uid())::text);
