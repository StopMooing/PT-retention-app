-- Coaches can give their own clients a ready-made meal plan, change it or remove it
-- (client_meal_plans: one row per client). Clients keep managing their own as before.
create policy "Coaches set their clients meal plan choice" on public.client_meal_plans
  for insert to authenticated
  with check (client_id in (select c.id from public.clients c where c.pt_id = (select auth.uid())));

create policy "Coaches change their clients meal plan choice" on public.client_meal_plans
  for update to authenticated
  using (client_id in (select c.id from public.clients c where c.pt_id = (select auth.uid())))
  with check (client_id in (select c.id from public.clients c where c.pt_id = (select auth.uid())));

create policy "Coaches remove their clients meal plan choice" on public.client_meal_plans
  for delete to authenticated
  using (client_id in (select c.id from public.clients c where c.pt_id = (select auth.uid())));
