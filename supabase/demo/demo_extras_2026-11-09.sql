-- Demo account extras (9 Nov 2026): the demo coach's own check-in questions, body
-- measurements for most demo clients, and one fresh check-in from Chloe that answers the
-- questions. Inserts only. demo_remove.sql removes all of it (it cascades with the demo
-- clients and the demo coach).

insert into public.checkin_questions (coach_id, question, kind, position) values
  ('9287e733-61a0-4b98-8452-afb80bc3129f', 'How many nights did you get 7 or more hours of sleep?', 'text', 1),
  ('9287e733-61a0-4b98-8452-afb80bc3129f', 'How well did you stick to your meal plan?', 'scale', 2),
  ('9287e733-61a0-4b98-8452-afb80bc3129f', 'What is one win from this week?', 'text', 3);

-- client name, days ago, waist, hips, chest, arm, thigh
with m (name, ago, waist, hips, chest, arm, thigh) as (values
  ('Ava Thompson', 56, 88.0, 106.0, 98.0, 31.5, 62.0), ('Ava Thompson', 35, 86.5, 105.0, 97.0, 31.0, 61.0), ('Ava Thompson', 14, 85.0, 104.0, 96.5, 31.0, 60.5), ('Ava Thompson', 2, 84.0, 103.5, 96.0, 30.5, 60.0),
  ('Emma Wilson', 56, 80.0, 102.0, 92.0, 29.5, 58.5), ('Emma Wilson', 35, 78.5, 101.0, 91.0, 29.0, 58.0), ('Emma Wilson', 14, 77.0, 100.0, 90.5, 29.0, 57.0), ('Emma Wilson', 3, 76.0, 99.5, 90.0, 28.5, 56.5),
  ('Chloe Martin', 42, 70.0, 95.0, 86.0, 27.5, 54.0), ('Chloe Martin', 14, 69.0, 94.5, 86.0, 28.0, 54.5),
  ('Ethan Clarke', 49, 92.0, null, 112.0, 40.0, 66.0), ('Ethan Clarke', 21, 92.5, null, 113.5, 40.5, 67.0), ('Ethan Clarke', 4, 93.0, null, 114.0, 41.0, 67.5),
  ('Hannah Lee', 28, 72.0, 96.0, 87.0, 27.0, 55.0), ('Hannah Lee', 5, 71.5, 96.0, 87.0, 27.5, 55.5),
  ('Isabella Garcia', 42, 76.0, 100.0, 90.0, 28.5, 57.0), ('Isabella Garcia', 13, 75.0, 99.0, 90.0, 29.0, 57.0),
  ('Jack Murphy', 56, 82.0, null, 98.0, 34.0, 56.0), ('Jack Murphy', 28, 82.5, null, 100.0, 35.0, 57.0), ('Jack Murphy', 6, 83.0, null, 101.5, 35.5, 57.5),
  ('Josh Nguyen', 35, 88.0, null, 106.0, 38.0, 61.0), ('Josh Nguyen', 7, 87.5, null, 107.5, 38.5, 61.5),
  ('Liam O''Brien', 49, 83.0, null, 101.0, 35.0, 58.0), ('Liam O''Brien', 21, 83.5, null, 102.5, 36.0, 59.0), ('Liam O''Brien', 2, 84.0, null, 103.5, 36.5, 59.5),
  ('Mia Rossi', 42, 84.0, 104.0, 95.0, 30.0, 60.0), ('Mia Rossi', 14, 82.5, 103.0, 94.5, 30.0, 59.5),
  ('Noah Patel', 35, 86.0, null, 102.0, 35.5, 60.0), ('Noah Patel', 8, 85.0, null, 102.5, 36.0, 60.0),
  ('Ryan Scott', 63, 104.0, null, 112.0, 36.0, 63.0), ('Ryan Scott', 35, 102.0, null, 111.0, 36.0, 62.5),
  ('Sophie Walker', 49, 83.0, 104.0, 94.0, 30.0, 59.5), ('Sophie Walker', 21, 82.0, 103.0, 93.5, 30.0, 59.0)
)
insert into public.body_measurements (client_id, measured_on, waist_cm, hips_cm, chest_cm, arm_cm, thigh_cm, logged_by)
select c.id, current_date - m.ago, m.waist, m.hips, m.chest, m.arm, m.thigh, c.user_id
from m join public.clients c on c.full_name = m.name and c.pt_id = '9287e733-61a0-4b98-8452-afb80bc3129f';

insert into public.checkins (client_id, training_score, energy_score, blocker, answers)
select c.id, 4, 4, 'Calves were tight after Sunday''s long run, otherwise a good week.',
  '[{"q": "How many nights did you get 7 or more hours of sleep?", "kind": "text", "a": "5 of 7. Two late nights at work."},
    {"q": "How well did you stick to your meal plan?", "kind": "scale", "a": 4},
    {"q": "What is one win from this week?", "kind": "text", "a": "Ran 8 km without stopping for the first time!"}]'::jsonb
from public.clients c where c.full_name = 'Chloe Martin' and c.pt_id = '9287e733-61a0-4b98-8452-afb80bc3129f';
