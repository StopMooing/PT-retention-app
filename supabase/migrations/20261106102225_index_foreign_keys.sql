-- Indexes for foreign keys the performance advisor flagged, so joins and deletes on
-- these columns stay fast as the client list grows.
create index if not exists body_weight_logs_logged_by_idx on public.body_weight_logs (logged_by);
create index if not exists habits_created_by_idx on public.habits (created_by);
create index if not exists meal_plans_created_by_idx on public.meal_plans (created_by);
create index if not exists meal_template_foods_meal_template_id_idx on public.meal_template_foods (meal_template_id);
create index if not exists program_assignments_assigned_by_idx on public.program_assignments (assigned_by);
create index if not exists pt_notes_pt_id_idx on public.pt_notes (pt_id);
create index if not exists scheduled_workouts_created_by_idx on public.scheduled_workouts (created_by);
create index if not exists scheduled_workouts_custom_workout_id_idx on public.scheduled_workouts (custom_workout_id);
create index if not exists water_logs_logged_by_idx on public.water_logs (logged_by);
