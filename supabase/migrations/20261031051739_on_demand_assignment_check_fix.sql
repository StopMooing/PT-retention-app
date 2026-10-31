-- Applied 31 Oct 2026. The client insert policy on program_assignments from
-- on_demand_library looked up programs, whose RLS looks up program_assignments: Postgres
-- rejected that as infinite recursion, which blocked every insert into
-- program_assignments (coach assignments included). A security definer helper answers
-- "is this program on demand?" without going through programs' RLS.
-- Verified: coach can assign; a client cannot assign a coaching program to themselves;
-- a client can start an on-demand program and then read its days.
create schema if not exists private;

create or replace function private.is_on_demand_program(p_program_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select p.is_on_demand from public.programs p where p.id = p_program_id), false);
$$;

revoke execute on function private.is_on_demand_program(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_on_demand_program(uuid) to authenticated;

drop policy if exists "Clients can start an on-demand program" on public.program_assignments;

create policy "Clients can start an on-demand program"
  on public.program_assignments for insert to authenticated
  with check (
    assigned_by = (select auth.uid())
    and client_id in (select c.id from public.clients c where c.user_id = (select auth.uid()))
    and private.is_on_demand_program(program_id)
  );
