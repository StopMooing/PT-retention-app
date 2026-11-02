-- The coach inbox and Needs you show each client's latest message, weekly check-in and
-- daily check-in. Reading "the newest N rows across everyone" drops quieter clients once
-- there are many; these return exactly one row per client. Security invoker: RLS applies,
-- so a coach only ever gets their own clients' rows.

create or replace function public.latest_message_per_client(p_client_ids uuid[])
returns setof public.coach_messages
language sql stable security invoker set search_path = ''
as $$
  select distinct on (m.client_id) m.*
  from public.coach_messages m
  where m.client_id = any(p_client_ids)
  order by m.client_id, m.created_at desc;
$$;

create or replace function public.latest_checkin_per_client(p_client_ids uuid[])
returns setof public.checkins
language sql stable security invoker set search_path = ''
as $$
  select distinct on (c.client_id) c.*
  from public.checkins c
  where c.client_id = any(p_client_ids)
  order by c.client_id, c.submitted_at desc;
$$;

create or replace function public.latest_daily_checkin_per_client(p_client_ids uuid[])
returns setof public.daily_checkins
language sql stable security invoker set search_path = ''
as $$
  select distinct on (d.client_id) d.*
  from public.daily_checkins d
  where d.client_id = any(p_client_ids)
  order by d.client_id, d.created_at desc;
$$;

-- No revoke needed: as invoker, a signed-out caller gets no rows (RLS).
