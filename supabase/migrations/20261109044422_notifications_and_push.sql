-- Notifications: an in-app list for coach and client, phone notifications (web push) for
-- the same events, and timed reminders. Events are written by triggers below; a trigger on
-- notifications asks the send-push edge function to deliver each one (pg_net, async, so the
-- original save never waits or fails). Reminders run every 30 minutes (pg_cron).

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

-- 1. What each person has been told. Readers mark rows read; only the triggers write them.
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  link text,
  dedupe_key text,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique (user_id, kind, dedupe_key)
);
create index notifications_user_created_idx on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;
grant select, delete on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
create policy "People see their own notifications" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy "People mark their own notifications read" on public.notifications
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "People clear their own notifications" on public.notifications
  for delete to authenticated using (user_id = (select auth.uid()));

-- 2. Each phone or browser that said yes to notifications.
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null unique check (length(endpoint) <= 1000),
  p256dh text not null check (length(p256dh) <= 200),
  auth text not null check (length(auth) <= 100),
  user_agent text check (length(user_agent) <= 400),
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
create index push_subscriptions_user_id_idx on public.push_subscriptions (user_id);
alter table public.push_subscriptions enable row level security;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
create policy "People manage their own devices" on public.push_subscriptions
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- 3. Which notifications someone wants (no row means everything on) and their time zone.
create table public.notification_settings (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  tz text not null default 'Australia/Adelaide' check (length(tz) <= 64),
  workout_reminders boolean not null default true,
  checkin_reminders boolean not null default true,
  coach_updates boolean not null default true,
  messages boolean not null default true,
  client_activity boolean not null default true,
  daily_summary boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.notification_settings enable row level security;
grant select, insert, update on public.notification_settings to authenticated;
create policy "People manage their own notification settings" on public.notification_settings
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- 4. Keys for the send-push function, from the vault, for the service role only.
create or replace function public.push_config()
returns jsonb language sql stable security definer set search_path = '' as $$
  select case when (select auth.role()) = 'service_role' then
    (select jsonb_object_agg(name, decrypted_secret) from vault.decrypted_secrets
      where name in ('vapid_public', 'vapid_private', 'push_hook_secret'))
  end
$$;

-- 5. Write a notification. Never lets a problem here undo the save that caused it.
create schema if not exists private;
create or replace function private.notify(p_user uuid, p_kind text, p_title text, p_body text, p_link text, p_key text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_user is null then return; end if;
  insert into public.notifications (user_id, kind, title, body, link, dedupe_key)
  values (p_user, p_kind, left(p_title, 140), left(p_body, 300), p_link, p_key)
  on conflict (user_id, kind, dedupe_key) do nothing;
exception when others then
  raise warning 'notify failed: %', sqlerrm;
end $$;

-- Ask the edge function to deliver it to their devices.
create or replace function private.push_notification()
returns trigger language plpgsql security definer set search_path = '' as $$
declare secret text;
begin
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'push_hook_secret';
  if secret is null then return new; end if;
  if not exists (select 1 from public.push_subscriptions where user_id = new.user_id) then return new; end if;
  perform net.http_post(
    url := 'https://ksataubrattfspjpftlk.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', secret),
    body := jsonb_build_object('id', new.id)
  );
  return new;
exception when others then
  raise warning 'push request failed: %', sqlerrm;
  return new;
end $$;
create trigger notifications_push after insert on public.notifications
  for each row execute function private.push_notification();

-- 6. Events.
create or replace function private.first_name(n text) returns text language sql immutable as $$
  select coalesce(nullif(split_part(btrim(coalesce(n, '')), ' ', 1), ''), 'Someone')
$$;

-- A client checks in: tell their coach.
create or replace function private.on_checkin_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare c record;
begin
  select id, pt_id, full_name into c from public.clients where id = new.client_id;
  if c.pt_id is not null then
    perform private.notify(c.pt_id, 'checkin', private.first_name(c.full_name) || ' checked in',
      concat_ws(' · ', 'Training ' || new.training_score || '/5', 'Energy ' || new.energy_score || '/5', nullif(btrim(coalesce(new.blocker, new.notes, '')), '')),
      '/messages/' || c.id);
  end if;
  return new;
end $$;
create trigger checkins_notify after insert on public.checkins
  for each row execute function private.on_checkin_insert();

-- The coach replies to a check-in: tell the client.
create or replace function private.on_checkin_reply()
returns trigger language plpgsql security definer set search_path = '' as $$
declare c record; coach text;
begin
  if new.coach_reply is null or btrim(new.coach_reply) = '' or new.coach_reply is not distinct from old.coach_reply then return new; end if;
  select id, user_id, pt_id into c from public.clients where id = new.client_id;
  select full_name into coach from public.profiles where id = c.pt_id;
  perform private.notify(c.user_id, 'reply', private.first_name(coach) || ' replied to your check-in', new.coach_reply, '/my-workout?tab=messages');
  return new;
end $$;
create trigger checkins_reply_notify after update of coach_reply on public.checkins
  for each row execute function private.on_checkin_reply();

-- A message: tell whoever it is for.
create or replace function private.on_message()
returns trigger language plpgsql security definer set search_path = '' as $$
declare c record; who text;
begin
  select id, user_id, pt_id, full_name into c from public.clients where id = new.client_id;
  if new.sender_id = c.pt_id then
    select full_name into who from public.profiles where id = c.pt_id;
    perform private.notify(c.user_id, 'message', private.first_name(who), new.body, '/my-workout?tab=messages');
  else
    perform private.notify(c.pt_id, 'message', private.first_name(c.full_name), new.body, '/messages/' || c.id);
  end if;
  return new;
end $$;
create trigger coach_messages_notify after insert on public.coach_messages
  for each row execute function private.on_message();

-- The coach gives a program: tell the client.
create or replace function private.on_program_assigned()
returns trigger language plpgsql security definer set search_path = '' as $$
declare c record; prog text; coach text;
begin
  if not coalesce(new.is_active, false) then return new; end if;
  select id, user_id, pt_id into c from public.clients where id = new.client_id;
  if new.assigned_by is null or new.assigned_by is not distinct from c.user_id then return new; end if;
  select name into prog from public.programs where id = new.program_id;
  select full_name into coach from public.profiles where id = c.pt_id;
  perform private.notify(c.user_id, 'program', 'New program: ' || coalesce(prog, 'from your coach'),
    private.first_name(coach) || ' set it up for you. Your sessions are on the Training tab.', '/my-workout?tab=train');
  return new;
end $$;
create trigger program_assignments_notify after insert on public.program_assignments
  for each row execute function private.on_program_assigned();

-- The coach gives a ready-made meal plan: tell the client.
create or replace function private.on_meal_plan()
returns trigger language plpgsql security definer set search_path = '' as $$
declare c record; plan text;
begin
  if tg_op = 'UPDATE' and new.plan_id is not distinct from old.plan_id then return new; end if;
  select id, user_id, pt_id into c from public.clients where id = new.client_id;
  if (select auth.uid()) is distinct from c.pt_id then return new; end if;
  select name into plan from public.meal_plan_library where id = new.plan_id;
  perform private.notify(c.user_id, 'mealplan', 'New meal plan: ' || coalesce(plan, 'from your coach'),
    'Today''s meals are on your food log, ready to tick off.', '/my-workout?tab=food');
  return new;
end $$;
create trigger client_meal_plans_notify after insert or update of plan_id on public.client_meal_plans
  for each row execute function private.on_meal_plan();

-- The coach adds a habit: tell the client.
create or replace function private.on_habit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare c record;
begin
  select id, user_id, pt_id into c from public.clients where id = new.client_id;
  if new.created_by is distinct from c.pt_id then return new; end if;
  perform private.notify(c.user_id, 'habit', 'New habit: ' || new.name, 'Tick it off on your Home screen each day.', '/my-workout?tab=home');
  return new;
end $$;
create trigger habits_notify after insert on public.habits
  for each row execute function private.on_habit();

-- A client finishes a session: tell their coach (not when the coach logs it for them).
create or replace function private.on_session_done()
returns trigger language plpgsql security definer set search_path = '' as $$
declare c record; w text;
begin
  if not coalesce(new.completed, false) then return new; end if;
  if tg_op = 'UPDATE' and coalesce(old.completed, false) then return new; end if;
  select id, user_id, pt_id, full_name into c from public.clients where id = new.client_id;
  if (select auth.uid()) is distinct from c.user_id then return new; end if;
  select name into w from public.program_workouts where id = new.program_workout_id;
  perform private.notify(c.pt_id, 'session', private.first_name(c.full_name) || ' finished ' || coalesce(w, 'a session'),
    case when coalesce(new.total_volume_kg, 0) > 0 then to_char(round(new.total_volume_kg), 'FM999,999') || ' kg moved' else null end,
    '/clients/' || c.id, new.id::text);
  return new;
end $$;
create trigger workout_logs_notify after insert or update of completed on public.workout_logs
  for each row execute function private.on_session_done();

-- 7. Timed reminders, for people with notifications on (a phone or browser that said yes).
-- Morning: a client with a session planned today. Evening: a weekly check-in that is due
-- (on the day, then every 3 days). Morning for coaches: replies and messages waiting.
create or replace function private.run_reminders()
returns void language plpgsql security definer set search_path = '' as $$
begin
  -- Sessions today, 7 am their time.
  insert into public.notifications (user_id, kind, title, body, link, dedupe_key)
  select distinct on (c.user_id) c.user_id, 'workout_reminder',
    'Today: ' || coalesce(pw.name, 'your session'), 'It''s on your plan. Tap to start when you''re ready.',
    '/my-workout?tab=train', lt::date::text
  from public.clients c
  join (select distinct user_id from public.push_subscriptions) ps on ps.user_id = c.user_id
  left join public.notification_settings ns on ns.user_id = c.user_id
  cross join lateral (select now() at time zone coalesce(ns.tz, 'Australia/Adelaide') as lt) t
  join public.scheduled_workouts sw on sw.client_id = c.id and sw.scheduled_date = t.lt::date
  left join public.program_workouts pw on pw.id = sw.program_workout_id
  where c.archived_at is null and extract(hour from t.lt) = 7 and coalesce(ns.workout_reminders, true)
    and not exists (select 1 from public.workout_logs wl where wl.scheduled_workout_id = sw.id and wl.completed)
  order by c.user_id, sw.created_at
  on conflict (user_id, kind, dedupe_key) do nothing;

  -- Weekly check-in due, 6 pm their time.
  insert into public.notifications (user_id, kind, title, body, link, dedupe_key)
  select c.user_id, 'checkin_reminder', 'Your weekly check-in is due',
    'Two minutes to tell ' || private.first_name(p.full_name) || ' how the week went.', '/my-workout?tab=home', t.lt::date::text
  from public.clients c
  join (select distinct user_id from public.push_subscriptions) ps on ps.user_id = c.user_id
  join public.profiles p on p.id = c.pt_id
  left join public.notification_settings ns on ns.user_id = c.user_id
  cross join lateral (select now() at time zone coalesce(ns.tz, 'Australia/Adelaide') as lt) t
  cross join lateral (
    select (t.lt::date - max((ci.submitted_at at time zone coalesce(ns.tz, 'Australia/Adelaide'))::date)) as since
    from public.checkins ci where ci.client_id = c.id
  ) last
  where c.archived_at is null and extract(hour from t.lt) = 18 and coalesce(ns.checkin_reminders, true)
    and last.since >= 7 and (last.since - 7) % 3 = 0
  on conflict (user_id, kind, dedupe_key) do nothing;

  -- Coaches, 8 am their time: what is waiting.
  insert into public.notifications (user_id, kind, title, body, link, dedupe_key)
  select x.pt_id, 'daily_summary', 'Your clients today',
    concat_ws(', ',
      case when x.replies > 0 then x.replies || case when x.replies = 1 then ' check-in' else ' check-ins' end || ' to reply to' end,
      case when x.msgs > 0 then x.msgs || case when x.msgs = 1 then ' new message' else ' new messages' end end),
    '/dashboard', x.d::text
  from (
    select c.pt_id, t.lt::date as d,
      count(*) filter (where lc.coach_reply is null and lc.id is not null) as replies,
      coalesce(sum((select count(*) from public.coach_messages m where m.client_id = c.id and m.sender_id = c.user_id and m.read_at is null)), 0) as msgs
    from public.clients c
    join (select distinct user_id from public.push_subscriptions) ps on ps.user_id = c.pt_id
    left join public.notification_settings ns on ns.user_id = c.pt_id
    cross join lateral (select now() at time zone coalesce(ns.tz, 'Australia/Adelaide') as lt) t
    left join lateral (select ci.id, ci.coach_reply from public.checkins ci where ci.client_id = c.id order by ci.submitted_at desc limit 1) lc on true
    where c.archived_at is null and extract(hour from t.lt) = 8 and coalesce(ns.daily_summary, true)
    group by c.pt_id, t.lt::date
  ) x
  where x.replies > 0 or x.msgs > 0
  on conflict (user_id, kind, dedupe_key) do nothing;
end $$;

select cron.schedule('unfnshd-reminders', '*/30 * * * *', 'select private.run_reminders()');
