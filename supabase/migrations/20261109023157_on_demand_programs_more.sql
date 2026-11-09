-- Four more ready-made programs (on demand, so members and every coach can use them):
-- home bodyweight, 2 days a week, over 50s strength and balance, fat loss conditioning.
-- Adds one exercise the home program needs (Bodyweight Squat). Stops if any exercise
-- name is missing, so nothing half-saves.
insert into public.exercises (name, muscle_group, equipment, category, is_global, instructions)
select 'Bodyweight Squat', 'Legs', 'bodyweight', 'strength', true, 'Stand with feet shoulder width apart, toes slightly out. Sit your hips back and down until your thighs are about parallel, chest up and heels down. Drive through your whole foot to stand.'
where not exists (select 1 from public.exercises where name = 'Bodyweight Squat' and is_global);

do $$
declare
  owner uuid := (select created_by from public.programs where name = '4-Week Beginner Full Body' and is_on_demand limit 1);
  p uuid; w uuid; n int;
begin
  if owner is null then raise exception 'Library owner not found'; end if;
  if exists (select 1 from public.programs where name = '4-Week Home Bodyweight' and is_on_demand) then raise exception 'Program already exists: %', '4-Week Home Bodyweight'; end if;
  insert into public.programs (name, description, created_by, is_on_demand, kind) values ('4-Week Home Bodyweight', '3 full body sessions a week with no equipment at all. Good for home, a hotel room or the park. Weeks 1 and 2: learn each movement and finish every set with 2 to 3 reps still in the tank. Weeks 3 and 4: add 2 reps to every set, or take 3 seconds to lower each rep. Rest a day between sessions.', owner, true, 'program') returning id into p;
  insert into public.program_workouts (program_id, day_number, name) values (p, 1, 'Home A') returning id into w;
  insert into public.workout_exercises (program_workout_id, exercise_id, order_index, sets, reps, rest_seconds, notes)
  select w, (select e.id from public.exercises e where e.name = v.name and e.is_global order by e.created_at limit 1), v.ord, v.sets, v.reps, v.rest, v.notes from (values (0, 'Bodyweight Squat', 3, '15', 60, 'Sit back like there''s a chair behind you, chest up.'), (1, 'Push Up', 3, '8-12', 60, 'Hands on a bench or couch to make it easier.'), (2, 'Glute Bridge', 3, '15', 60, 'Squeeze your glutes for a second at the top.'), (3, 'Superman', 3, '12', 45, null), (4, 'Reverse Lunge', 2, '10 each leg', 60, null), (5, 'Plank', 3, '30s', 45, null)) as v(ord, name, sets, reps, rest, notes)
  where exists (select 1 from public.exercises e where e.name = v.name and e.is_global);
  get diagnostics n = row_count; if n <> 6 then raise exception 'Missing exercise in % / %', '4-Week Home Bodyweight', 'Home A'; end if;
  insert into public.program_workouts (program_id, day_number, name) values (p, 2, 'Home B') returning id into w;
  insert into public.workout_exercises (program_workout_id, exercise_id, order_index, sets, reps, rest_seconds, notes)
  select w, (select e.id from public.exercises e where e.name = v.name and e.is_global order by e.created_at limit 1), v.ord, v.sets, v.reps, v.rest, v.notes from (values (0, 'Bulgarian Split Squat', 3, '8 each leg', 60, 'Back foot on a couch or chair.'), (1, 'Pike Push Up', 3, '6-10', 60, 'Hips high, lower the top of your head towards the floor.'), (2, 'Single Leg Glute Bridge', 3, '10 each leg', 45, null), (3, 'Prone Y Raise', 3, '12', 45, 'Lying face down, thumbs up, lift your arms into a Y.'), (4, 'Bench Dip', 2, '10', 60, 'Hands on the edge of a sturdy chair.'), (5, 'Dead Bug', 3, '8 each side', 45, null)) as v(ord, name, sets, reps, rest, notes)
  where exists (select 1 from public.exercises e where e.name = v.name and e.is_global);
  get diagnostics n = row_count; if n <> 6 then raise exception 'Missing exercise in % / %', '4-Week Home Bodyweight', 'Home B'; end if;
  insert into public.program_workouts (program_id, day_number, name) values (p, 3, 'Home C') returning id into w;
  insert into public.workout_exercises (program_workout_id, exercise_id, order_index, sets, reps, rest_seconds, notes)
  select w, (select e.id from public.exercises e where e.name = v.name and e.is_global order by e.created_at limit 1), v.ord, v.sets, v.reps, v.rest, v.notes from (values (0, 'Step Up', 3, '10 each leg', 60, 'Use a sturdy step or the bottom stair.'), (1, 'Wide Grip Push Up', 3, '8-12', 60, null), (2, 'Lateral Lunge', 2, '8 each leg', 60, null), (3, 'Single Leg Romanian Deadlift', 3, '8 each leg', 60, 'Hold a wall for balance to start.'), (4, 'Mountain Climber', 3, '30s', 45, null), (5, 'Side Plank', 2, '20s each side', 45, null)) as v(ord, name, sets, reps, rest, notes)
  where exists (select 1 from public.exercises e where e.name = v.name and e.is_global);
  get diagnostics n = row_count; if n <> 6 then raise exception 'Missing exercise in % / %', '4-Week Home Bodyweight', 'Home C'; end if;
  if exists (select 1 from public.programs where name = '6-Week Two Day Full Body' and is_on_demand) then raise exception 'Program already exists: %', '6-Week Two Day Full Body'; end if;
  insert into public.programs (name, description, created_by, is_on_demand, kind) values ('6-Week Two Day Full Body', '2 full body sessions a week for busy people. Each session trains every major muscle, so two is enough to get stronger. Weeks 1 and 2: settle into the weights and leave 2 reps in the tank. Weeks 3 to 5: add 2.5 kg to the main lifts or 1 to 2 reps to the rest each week. Week 6: same weights, one less set on everything to recover. Leave at least 2 days between sessions.', owner, true, 'program') returning id into p;
  insert into public.program_workouts (program_id, day_number, name) values (p, 1, 'Full Body A') returning id into w;
  insert into public.workout_exercises (program_workout_id, exercise_id, order_index, sets, reps, rest_seconds, notes)
  select w, (select e.id from public.exercises e where e.name = v.name and e.is_global order by e.created_at limit 1), v.ord, v.sets, v.reps, v.rest, v.notes from (values (0, 'Back Squat', 3, '6-8', 150, null), (1, 'Barbell Bench Press', 3, '6-8', 120, null), (2, 'Lat Pulldown (Wide Grip)', 3, '10', 90, 'Pull the bar to your upper chest, elbows down.'), (3, 'Romanian Deadlift (Dumbbell)', 3, '10', 90, null), (4, 'Dumbbell Lateral Raise', 2, '12-15', 60, null), (5, 'Plank', 3, '30s', 45, null)) as v(ord, name, sets, reps, rest, notes)
  where exists (select 1 from public.exercises e where e.name = v.name and e.is_global);
  get diagnostics n = row_count; if n <> 6 then raise exception 'Missing exercise in % / %', '6-Week Two Day Full Body', 'Full Body A'; end if;
  insert into public.program_workouts (program_id, day_number, name) values (p, 2, 'Full Body B') returning id into w;
  insert into public.workout_exercises (program_workout_id, exercise_id, order_index, sets, reps, rest_seconds, notes)
  select w, (select e.id from public.exercises e where e.name = v.name and e.is_global order by e.created_at limit 1), v.ord, v.sets, v.reps, v.rest, v.notes from (values (0, 'Trap Bar Deadlift', 3, '5-6', 150, null), (1, 'Dumbbell Shoulder Press', 3, '8-10', 90, null), (2, 'Seated Cable Row (Close Grip)', 3, '10', 90, null), (3, 'Leg Press', 3, '10-12', 90, null), (4, 'Incline Dumbbell Press', 2, '10', 90, null), (5, 'Hammer Curl', 2, '12', 60, null), (6, 'Dead Bug', 2, '8 each side', 45, null)) as v(ord, name, sets, reps, rest, notes)
  where exists (select 1 from public.exercises e where e.name = v.name and e.is_global);
  get diagnostics n = row_count; if n <> 7 then raise exception 'Missing exercise in % / %', '6-Week Two Day Full Body', 'Full Body B'; end if;
  if exists (select 1 from public.programs where name = '8-Week Over 50s Strength and Balance' and is_on_demand) then raise exception 'Program already exists: %', '8-Week Over 50s Strength and Balance'; end if;
  insert into public.programs (name, description, created_by, is_on_demand, kind) values ('8-Week Over 50s Strength and Balance', '3 sessions a week for stronger legs, better balance and easier everyday movement. Built for over 50s and anyone coming back after a long break. Weeks 1 to 3: learn each movement and leave 3 reps in the tank. Weeks 4 to 7: add a little weight or 2 reps when every set feels steady. Week 8: same weights, one less set on everything to recover. Hold a rail or a wall for balance work until it feels easy.', owner, true, 'program') returning id into p;
  insert into public.program_workouts (program_id, day_number, name) values (p, 1, 'Legs and Balance') returning id into w;
  insert into public.workout_exercises (program_workout_id, exercise_id, order_index, sets, reps, rest_seconds, notes)
  select w, (select e.id from public.exercises e where e.name = v.name and e.is_global order by e.created_at limit 1), v.ord, v.sets, v.reps, v.rest, v.notes from (values (0, 'Leg Press', 3, '10-12', 90, 'Lower until your knees reach about 90 degrees.'), (1, 'Step Up', 2, '8 each leg', 60, 'Start with a low step and hold a rail.'), (2, 'Machine Chest Press', 3, '10', 90, null), (3, 'Seated Cable Row (Close Grip)', 3, '10', 90, null), (4, 'Standing Calf Raise', 2, '12', 60, 'Hold a rail for balance.'), (5, 'Bird Dog', 2, '8 each side', 45, 'Move slowly and keep your hips level.')) as v(ord, name, sets, reps, rest, notes)
  where exists (select 1 from public.exercises e where e.name = v.name and e.is_global);
  get diagnostics n = row_count; if n <> 6 then raise exception 'Missing exercise in % / %', '8-Week Over 50s Strength and Balance', 'Legs and Balance'; end if;
  insert into public.program_workouts (program_id, day_number, name) values (p, 2, 'Strength and Carry') returning id into w;
  insert into public.workout_exercises (program_workout_id, exercise_id, order_index, sets, reps, rest_seconds, notes)
  select w, (select e.id from public.exercises e where e.name = v.name and e.is_global order by e.created_at limit 1), v.ord, v.sets, v.reps, v.rest, v.notes from (values (0, 'Goblet Squat', 3, '8-10', 90, 'Squat down to a bench to start.'), (1, 'Lat Pulldown (Neutral Grip)', 3, '10', 90, null), (2, 'Glute Bridge', 3, '12', 60, null), (3, 'Dumbbell Shoulder Press', 2, '10', 90, 'Seated, with back support.'), (4, 'Farmers Walk', 3, '20 m', 60, 'Stand tall and walk slowly.'), (5, 'Pallof Press', 2, '10 each side', 45, null)) as v(ord, name, sets, reps, rest, notes)
  where exists (select 1 from public.exercises e where e.name = v.name and e.is_global);
  get diagnostics n = row_count; if n <> 6 then raise exception 'Missing exercise in % / %', '8-Week Over 50s Strength and Balance', 'Strength and Carry'; end if;
  insert into public.program_workouts (program_id, day_number, name) values (p, 3, 'Full Body and Balance') returning id into w;
  insert into public.workout_exercises (program_workout_id, exercise_id, order_index, sets, reps, rest_seconds, notes)
  select w, (select e.id from public.exercises e where e.name = v.name and e.is_global order by e.created_at limit 1), v.ord, v.sets, v.reps, v.rest, v.notes from (values (0, 'Romanian Deadlift (Dumbbell)', 3, '10', 90, 'Light weight. Push your hips back, keep your back flat.'), (1, 'Incline Push Up', 3, '8-12', 60, 'Hands on a bench or a bar on the rack.'), (2, 'Machine Row', 3, '10', 90, null), (3, 'Box Step Down', 2, '6 each leg', 60, 'Low box, hold a rail, lower slowly.'), (4, 'Leg Extension', 2, '12', 60, null), (5, 'Side Plank', 2, '15s each side', 45, 'Knees down to start.')) as v(ord, name, sets, reps, rest, notes)
  where exists (select 1 from public.exercises e where e.name = v.name and e.is_global);
  get diagnostics n = row_count; if n <> 6 then raise exception 'Missing exercise in % / %', '8-Week Over 50s Strength and Balance', 'Full Body and Balance'; end if;
  if exists (select 1 from public.programs where name = '6-Week Fat Loss Conditioning' and is_on_demand) then raise exception 'Program already exists: %', '6-Week Fat Loss Conditioning'; end if;
  insert into public.programs (name, description, created_by, is_on_demand, kind) values ('6-Week Fat Loss Conditioning', '4 days a week: two strength days to keep your muscle and two conditioning days to build fitness and burn more. Pair it with a calorie target to lose fat. Weeks 1 and 2: learn the sessions at a steady pace. Weeks 3 to 5: add a round to the conditioning or take 15 seconds off the rests. Week 6: same work, one less set or round to recover.', owner, true, 'program') returning id into p;
  insert into public.program_workouts (program_id, day_number, name) values (p, 1, 'Strength A') returning id into w;
  insert into public.workout_exercises (program_workout_id, exercise_id, order_index, sets, reps, rest_seconds, notes)
  select w, (select e.id from public.exercises e where e.name = v.name and e.is_global order by e.created_at limit 1), v.ord, v.sets, v.reps, v.rest, v.notes from (values (0, 'Goblet Squat', 4, '10', 75, null), (1, 'Dumbbell Bench Press', 3, '10', 75, null), (2, 'Lat Pulldown (Wide Grip)', 3, '12', 75, null), (3, 'Romanian Deadlift (Dumbbell)', 3, '10', 75, null), (4, 'Rowing Machine', 1, '10 min', 0, 'Steady pace, you can still talk.')) as v(ord, name, sets, reps, rest, notes)
  where exists (select 1 from public.exercises e where e.name = v.name and e.is_global);
  get diagnostics n = row_count; if n <> 5 then raise exception 'Missing exercise in % / %', '6-Week Fat Loss Conditioning', 'Strength A'; end if;
  insert into public.program_workouts (program_id, day_number, name) values (p, 2, 'Intervals') returning id into w;
  insert into public.workout_exercises (program_workout_id, exercise_id, order_index, sets, reps, rest_seconds, notes)
  select w, (select e.id from public.exercises e where e.name = v.name and e.is_global order by e.created_at limit 1), v.ord, v.sets, v.reps, v.rest, v.notes from (values (0, 'Echo Bike', 8, '20s hard', 40, '40 seconds easy between efforts.'), (1, 'Kettlebell Swing', 4, '15', 45, 'Drive with your hips, not your arms.'), (2, 'Mountain Climber', 3, '30s', 30, null), (3, 'Medicine Ball Slam', 3, '12', 45, null), (4, 'Treadmill Walk (Incline)', 1, '15 min', 0, 'Brisk walk to finish.')) as v(ord, name, sets, reps, rest, notes)
  where exists (select 1 from public.exercises e where e.name = v.name and e.is_global);
  get diagnostics n = row_count; if n <> 5 then raise exception 'Missing exercise in % / %', '6-Week Fat Loss Conditioning', 'Intervals'; end if;
  insert into public.program_workouts (program_id, day_number, name) values (p, 3, 'Strength B') returning id into w;
  insert into public.workout_exercises (program_workout_id, exercise_id, order_index, sets, reps, rest_seconds, notes)
  select w, (select e.id from public.exercises e where e.name = v.name and e.is_global order by e.created_at limit 1), v.ord, v.sets, v.reps, v.rest, v.notes from (values (0, 'Reverse Lunge', 3, '10 each leg', 75, 'Hold dumbbells once bodyweight is easy.'), (1, 'Dumbbell Shoulder Press', 3, '10', 75, null), (2, 'Seated Cable Row (Close Grip)', 3, '12', 75, null), (3, 'Hip Thrust (Dumbbell)', 3, '12', 75, null), (4, 'Farmers Walk', 3, '30 m', 60, null), (5, 'Plank', 3, '40s', 45, null)) as v(ord, name, sets, reps, rest, notes)
  where exists (select 1 from public.exercises e where e.name = v.name and e.is_global);
  get diagnostics n = row_count; if n <> 6 then raise exception 'Missing exercise in % / %', '6-Week Fat Loss Conditioning', 'Strength B'; end if;
  insert into public.program_workouts (program_id, day_number, name) values (p, 4, 'Circuit') returning id into w;
  insert into public.workout_exercises (program_workout_id, exercise_id, order_index, sets, reps, rest_seconds, notes)
  select w, (select e.id from public.exercises e where e.name = v.name and e.is_global order by e.created_at limit 1), v.ord, v.sets, v.reps, v.rest, v.notes from (values (0, 'Dumbbell Thruster', 4, '10', 60, 'Move straight from one exercise to the next, rest at the end of each round.'), (1, 'Renegade Row', 3, '8 each arm', 60, null), (2, 'Step Up', 3, '10 each leg', 60, null), (3, 'Burpee', 3, '8', 60, null), (4, 'Battle Ropes', 4, '30s', 45, null), (5, 'Ski Erg', 1, '10 min', 0, 'Steady pace to finish.')) as v(ord, name, sets, reps, rest, notes)
  where exists (select 1 from public.exercises e where e.name = v.name and e.is_global);
  get diagnostics n = row_count; if n <> 6 then raise exception 'Missing exercise in % / %', '6-Week Fat Loss Conditioning', 'Circuit'; end if;
end $$;
