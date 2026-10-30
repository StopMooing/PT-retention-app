-- NOT YET APPLIED. Apply with apply_migration (name: lock_progress_photos) once the app
-- code that shows photos through signed links is live, then rename this file with the
-- version Supabase assigns.
--
-- Why: the progress-photos bucket was public. Anyone holding the anon key (it ships in
-- the app) could list and download every client's progress photos, and any signed-in
-- user could delete any of them. No photos existed when this was found (30 Oct 2026).
--
-- After this: the bucket is private. A file can be read only by the client who owns the
-- folder (first path segment = their auth uid) or that client's coach. Only the owner can
-- upload into or delete from their folder. The app shows photos via short-lived signed URLs.

update storage.buckets set public = false where id = 'progress-photos';

drop policy if exists "Progress photos are publicly viewable" on storage.objects;
drop policy if exists "Clients can upload progress photos" on storage.objects;
drop policy if exists "Clients can delete their progress photos" on storage.objects;

create policy "Progress photos: owner or their coach can view"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'progress-photos'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1 from public.clients c
        where c.user_id::text = (storage.foldername(name))[1]
          and c.pt_id = (select auth.uid())
      )
    )
  );

create policy "Progress photos: owner can upload to own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Progress photos: owner can delete own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
