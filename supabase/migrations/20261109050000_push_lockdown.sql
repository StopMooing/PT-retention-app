-- Belt and braces for phone notifications (run by Luke in the SQL Editor: it revokes).
-- push_config() already returns nothing unless the caller is the service role; this also
-- stops anyone else calling it at all. first_name gets a fixed search_path (advisor).
revoke execute on function public.push_config() from public, anon, authenticated;
grant execute on function public.push_config() to service_role;
alter function private.first_name(text) set search_path = '';
