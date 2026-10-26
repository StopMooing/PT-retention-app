-- Applied 26 Oct 2026 via Supabase apply_migration, after commit bde1737 went live.
-- Check-ins are authenticated and in-app; the public /checkin/:clientId page is gone.
drop policy if exists "Anon can insert one checkin per client per 24h" on public.checkins;
revoke insert on public.checkins from anon;
drop function if exists public.get_checkin_client(uuid);
