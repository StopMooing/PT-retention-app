-- One-session swaps: a client can swap a program exercise for one session only.
-- The swap lives on the logged sets themselves: exercise_id is what the client actually
-- did, swapped_from_exercise_id is the program exercise it replaced. The program is never
-- changed, so next week shows the coach's exercise again. Coaches see the swap in the
-- session history. Existing row rules (clients manage their own set logs, coaches read
-- their clients') already cover the new column.
-- Queries that embed exercises from workout_set_logs name the link
-- (exercises!workout_set_logs_exercise_id_fkey) since this adds a second one.

alter table public.workout_set_logs
  add column if not exists swapped_from_exercise_id uuid
  constraint workout_set_logs_swapped_from_exercise_id_fkey
  references public.exercises(id) on delete set null;

comment on column public.workout_set_logs.swapped_from_exercise_id is
  'The program exercise this set replaced when the client swapped it for this session only. Null when not swapped.';

-- Deleting an exercise has to find the rows to clear; most rows are null, so index only the rest.
create index if not exists workout_set_logs_swapped_from_idx
  on public.workout_set_logs (swapped_from_exercise_id)
  where swapped_from_exercise_id is not null;
