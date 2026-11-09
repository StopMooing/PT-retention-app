-- Takes the demo account's made-up clients out again (everything they "logged" goes
-- with them), plus their logins. The demo coach login itself stays.
-- Paste into the Supabase SQL Editor and Run.
begin;
delete from public.clients where pt_id = '9287e733-61a0-4b98-8452-afb80bc3129f';
delete from auth.users where email like '%@demo.unfnshd.app';
commit;
