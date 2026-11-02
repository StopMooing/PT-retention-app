-- Tidy-up after the claim-with-existing-account work (2 Nov):
-- 1. Linking an account needs a signed-in user; signed-out visitors don't need to call it
--    (it already returns 'not_signed_in' for them, this just closes it off).
-- 2. public.guard_client_update was created by mistake (the trigger on clients uses
--    private.guard_client_update). Nothing calls it.
revoke execute on function public.claim_client_with_account(uuid) from public, anon;
grant execute on function public.claim_client_with_account(uuid) to authenticated;
drop function if exists public.guard_client_update();
