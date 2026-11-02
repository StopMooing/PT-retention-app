-- Clients can move their own scheduled sessions to another day (Move, and Start now
-- picking up a missed session). Without this, those updates matched no rows and
-- silently did nothing. The check keeps the row on the client's own record.
create policy "Clients can reschedule their own workouts"
  on public.scheduled_workouts for update to authenticated
  using (client_id in (select c.id from public.clients c where c.user_id = (select auth.uid())))
  with check (client_id in (select c.id from public.clients c where c.user_id = (select auth.uid())));
