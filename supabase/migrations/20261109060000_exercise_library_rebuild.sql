-- Exercise library rebuild (built by data/exercises/build.py). Runs as one transaction.
-- Renames keep each exercise's id, so programs, logged sets and PBs stay linked.
begin;

-- 1. Merge duplicates into the exercise that stays.
-- Plate Squeeze Press into Svend Press
update workout_exercises set exercise_id = 'd40a2b62-2449-42b3-970b-d3ead6ede62d' where exercise_id = '20061e57-5fc0-429d-a378-342b4c0dd18e';
update workout_set_logs set exercise_id = 'd40a2b62-2449-42b3-970b-d3ead6ede62d' where exercise_id = '20061e57-5fc0-429d-a378-342b4c0dd18e';
delete from personal_bests p where p.exercise_id = '20061e57-5fc0-429d-a378-342b4c0dd18e' and exists (select 1 from personal_bests k where k.exercise_id = 'd40a2b62-2449-42b3-970b-d3ead6ede62d' and k.client_id = p.client_id and k.pb_type = p.pb_type and k.value >= p.value);
delete from personal_bests k where k.exercise_id = 'd40a2b62-2449-42b3-970b-d3ead6ede62d' and exists (select 1 from personal_bests p where p.exercise_id = '20061e57-5fc0-429d-a378-342b4c0dd18e' and p.client_id = k.client_id and p.pb_type = k.pb_type);
update personal_bests set exercise_id = 'd40a2b62-2449-42b3-970b-d3ead6ede62d' where exercise_id = '20061e57-5fc0-429d-a378-342b4c0dd18e';
delete from exercise_media m where m.exercise_id = '20061e57-5fc0-429d-a378-342b4c0dd18e' and exists (select 1 from exercise_media k where k.exercise_id = 'd40a2b62-2449-42b3-970b-d3ead6ede62d' and k.coach_id = m.coach_id);
update exercise_media set exercise_id = 'd40a2b62-2449-42b3-970b-d3ead6ede62d' where exercise_id = '20061e57-5fc0-429d-a378-342b4c0dd18e';
update exercise_aliases set exercise_id = 'd40a2b62-2449-42b3-970b-d3ead6ede62d' where exercise_id = '20061e57-5fc0-429d-a378-342b4c0dd18e';
insert into exercise_aliases (exercise_id, alias) values ('d40a2b62-2449-42b3-970b-d3ead6ede62d', 'Plate Squeeze Press');
delete from exercises where id = '20061e57-5fc0-429d-a378-342b4c0dd18e';

-- Cable Crossover into Cable Chest Fly (Mid)
update workout_exercises set exercise_id = '7ebe0401-baea-441f-b403-26ff7329cb1b' where exercise_id = '3ed18797-d50c-4593-9643-624d3aca0fcf';
update workout_set_logs set exercise_id = '7ebe0401-baea-441f-b403-26ff7329cb1b' where exercise_id = '3ed18797-d50c-4593-9643-624d3aca0fcf';
delete from personal_bests p where p.exercise_id = '3ed18797-d50c-4593-9643-624d3aca0fcf' and exists (select 1 from personal_bests k where k.exercise_id = '7ebe0401-baea-441f-b403-26ff7329cb1b' and k.client_id = p.client_id and k.pb_type = p.pb_type and k.value >= p.value);
delete from personal_bests k where k.exercise_id = '7ebe0401-baea-441f-b403-26ff7329cb1b' and exists (select 1 from personal_bests p where p.exercise_id = '3ed18797-d50c-4593-9643-624d3aca0fcf' and p.client_id = k.client_id and p.pb_type = k.pb_type);
update personal_bests set exercise_id = '7ebe0401-baea-441f-b403-26ff7329cb1b' where exercise_id = '3ed18797-d50c-4593-9643-624d3aca0fcf';
delete from exercise_media m where m.exercise_id = '3ed18797-d50c-4593-9643-624d3aca0fcf' and exists (select 1 from exercise_media k where k.exercise_id = '7ebe0401-baea-441f-b403-26ff7329cb1b' and k.coach_id = m.coach_id);
update exercise_media set exercise_id = '7ebe0401-baea-441f-b403-26ff7329cb1b' where exercise_id = '3ed18797-d50c-4593-9643-624d3aca0fcf';
update exercise_aliases set exercise_id = '7ebe0401-baea-441f-b403-26ff7329cb1b' where exercise_id = '3ed18797-d50c-4593-9643-624d3aca0fcf';
insert into exercise_aliases (exercise_id, alias) values ('7ebe0401-baea-441f-b403-26ff7329cb1b', 'Cable Crossover');
delete from exercises where id = '3ed18797-d50c-4593-9643-624d3aca0fcf';

-- Hyperextension into 45 Degree Back Extension
update workout_exercises set exercise_id = 'd068a08a-5142-4405-acca-a46879c66f5e' where exercise_id = 'c80fd2d3-9162-4f3e-ba1a-9ac27c275fee';
update workout_set_logs set exercise_id = 'd068a08a-5142-4405-acca-a46879c66f5e' where exercise_id = 'c80fd2d3-9162-4f3e-ba1a-9ac27c275fee';
delete from personal_bests p where p.exercise_id = 'c80fd2d3-9162-4f3e-ba1a-9ac27c275fee' and exists (select 1 from personal_bests k where k.exercise_id = 'd068a08a-5142-4405-acca-a46879c66f5e' and k.client_id = p.client_id and k.pb_type = p.pb_type and k.value >= p.value);
delete from personal_bests k where k.exercise_id = 'd068a08a-5142-4405-acca-a46879c66f5e' and exists (select 1 from personal_bests p where p.exercise_id = 'c80fd2d3-9162-4f3e-ba1a-9ac27c275fee' and p.client_id = k.client_id and p.pb_type = k.pb_type);
update personal_bests set exercise_id = 'd068a08a-5142-4405-acca-a46879c66f5e' where exercise_id = 'c80fd2d3-9162-4f3e-ba1a-9ac27c275fee';
delete from exercise_media m where m.exercise_id = 'c80fd2d3-9162-4f3e-ba1a-9ac27c275fee' and exists (select 1 from exercise_media k where k.exercise_id = 'd068a08a-5142-4405-acca-a46879c66f5e' and k.coach_id = m.coach_id);
update exercise_media set exercise_id = 'd068a08a-5142-4405-acca-a46879c66f5e' where exercise_id = 'c80fd2d3-9162-4f3e-ba1a-9ac27c275fee';
update exercise_aliases set exercise_id = 'd068a08a-5142-4405-acca-a46879c66f5e' where exercise_id = 'c80fd2d3-9162-4f3e-ba1a-9ac27c275fee';
insert into exercise_aliases (exercise_id, alias) values ('d068a08a-5142-4405-acca-a46879c66f5e', 'Hyperextension');
delete from exercises where id = 'c80fd2d3-9162-4f3e-ba1a-9ac27c275fee';

-- Military Press into Barbell Overhead Press
update workout_exercises set exercise_id = 'd91f5d54-acb2-443a-b16f-88dfb84b1361' where exercise_id = 'b43f8d00-4841-4f3f-9dfe-c1eb5c19cd88';
update workout_set_logs set exercise_id = 'd91f5d54-acb2-443a-b16f-88dfb84b1361' where exercise_id = 'b43f8d00-4841-4f3f-9dfe-c1eb5c19cd88';
delete from personal_bests p where p.exercise_id = 'b43f8d00-4841-4f3f-9dfe-c1eb5c19cd88' and exists (select 1 from personal_bests k where k.exercise_id = 'd91f5d54-acb2-443a-b16f-88dfb84b1361' and k.client_id = p.client_id and k.pb_type = p.pb_type and k.value >= p.value);
delete from personal_bests k where k.exercise_id = 'd91f5d54-acb2-443a-b16f-88dfb84b1361' and exists (select 1 from personal_bests p where p.exercise_id = 'b43f8d00-4841-4f3f-9dfe-c1eb5c19cd88' and p.client_id = k.client_id and p.pb_type = k.pb_type);
update personal_bests set exercise_id = 'd91f5d54-acb2-443a-b16f-88dfb84b1361' where exercise_id = 'b43f8d00-4841-4f3f-9dfe-c1eb5c19cd88';
delete from exercise_media m where m.exercise_id = 'b43f8d00-4841-4f3f-9dfe-c1eb5c19cd88' and exists (select 1 from exercise_media k where k.exercise_id = 'd91f5d54-acb2-443a-b16f-88dfb84b1361' and k.coach_id = m.coach_id);
update exercise_media set exercise_id = 'd91f5d54-acb2-443a-b16f-88dfb84b1361' where exercise_id = 'b43f8d00-4841-4f3f-9dfe-c1eb5c19cd88';
update exercise_aliases set exercise_id = 'd91f5d54-acb2-443a-b16f-88dfb84b1361' where exercise_id = 'b43f8d00-4841-4f3f-9dfe-c1eb5c19cd88';
insert into exercise_aliases (exercise_id, alias) values ('d91f5d54-acb2-443a-b16f-88dfb84b1361', 'Military Press');
delete from exercises where id = 'b43f8d00-4841-4f3f-9dfe-c1eb5c19cd88';

-- Woodchop (Cable) into Cable Woodchop (High to Low)
update workout_exercises set exercise_id = '985240bc-fa45-4868-ad22-1ec524f20c17' where exercise_id = '433f7010-e44c-473a-b615-3912df068ef2';
update workout_set_logs set exercise_id = '985240bc-fa45-4868-ad22-1ec524f20c17' where exercise_id = '433f7010-e44c-473a-b615-3912df068ef2';
delete from personal_bests p where p.exercise_id = '433f7010-e44c-473a-b615-3912df068ef2' and exists (select 1 from personal_bests k where k.exercise_id = '985240bc-fa45-4868-ad22-1ec524f20c17' and k.client_id = p.client_id and k.pb_type = p.pb_type and k.value >= p.value);
delete from personal_bests k where k.exercise_id = '985240bc-fa45-4868-ad22-1ec524f20c17' and exists (select 1 from personal_bests p where p.exercise_id = '433f7010-e44c-473a-b615-3912df068ef2' and p.client_id = k.client_id and p.pb_type = k.pb_type);
update personal_bests set exercise_id = '985240bc-fa45-4868-ad22-1ec524f20c17' where exercise_id = '433f7010-e44c-473a-b615-3912df068ef2';
delete from exercise_media m where m.exercise_id = '433f7010-e44c-473a-b615-3912df068ef2' and exists (select 1 from exercise_media k where k.exercise_id = '985240bc-fa45-4868-ad22-1ec524f20c17' and k.coach_id = m.coach_id);
update exercise_media set exercise_id = '985240bc-fa45-4868-ad22-1ec524f20c17' where exercise_id = '433f7010-e44c-473a-b615-3912df068ef2';
update exercise_aliases set exercise_id = '985240bc-fa45-4868-ad22-1ec524f20c17' where exercise_id = '433f7010-e44c-473a-b615-3912df068ef2';
insert into exercise_aliases (exercise_id, alias) values ('985240bc-fa45-4868-ad22-1ec524f20c17', 'Woodchop (Cable)');
delete from exercises where id = '433f7010-e44c-473a-b615-3912df068ef2';

-- Prowler Push into Sled Push
update workout_exercises set exercise_id = '77f1f905-6f81-4be8-a8ee-eb00e7d29400' where exercise_id = '4858075d-4fef-410f-89e8-356cc71357a4';
update workout_set_logs set exercise_id = '77f1f905-6f81-4be8-a8ee-eb00e7d29400' where exercise_id = '4858075d-4fef-410f-89e8-356cc71357a4';
delete from personal_bests p where p.exercise_id = '4858075d-4fef-410f-89e8-356cc71357a4' and exists (select 1 from personal_bests k where k.exercise_id = '77f1f905-6f81-4be8-a8ee-eb00e7d29400' and k.client_id = p.client_id and k.pb_type = p.pb_type and k.value >= p.value);
delete from personal_bests k where k.exercise_id = '77f1f905-6f81-4be8-a8ee-eb00e7d29400' and exists (select 1 from personal_bests p where p.exercise_id = '4858075d-4fef-410f-89e8-356cc71357a4' and p.client_id = k.client_id and p.pb_type = k.pb_type);
update personal_bests set exercise_id = '77f1f905-6f81-4be8-a8ee-eb00e7d29400' where exercise_id = '4858075d-4fef-410f-89e8-356cc71357a4';
delete from exercise_media m where m.exercise_id = '4858075d-4fef-410f-89e8-356cc71357a4' and exists (select 1 from exercise_media k where k.exercise_id = '77f1f905-6f81-4be8-a8ee-eb00e7d29400' and k.coach_id = m.coach_id);
update exercise_media set exercise_id = '77f1f905-6f81-4be8-a8ee-eb00e7d29400' where exercise_id = '4858075d-4fef-410f-89e8-356cc71357a4';
update exercise_aliases set exercise_id = '77f1f905-6f81-4be8-a8ee-eb00e7d29400' where exercise_id = '4858075d-4fef-410f-89e8-356cc71357a4';
insert into exercise_aliases (exercise_id, alias) values ('77f1f905-6f81-4be8-a8ee-eb00e7d29400', 'Prowler Push');
delete from exercises where id = '4858075d-4fef-410f-89e8-356cc71357a4';

-- 2. Update every kept exercise: name, group, kit, type, how-to and cues.
update exercises set name = 'Bench Press (Barbell)', muscle_group = 'Chest', equipment = 'barbell', category = 'strength', instructions = 'Lie on a flat bench with your eyes under the bar, feet flat and shoulder blades pulled together.
Grip a little wider than shoulder width, unrack, and lower the bar to your mid chest with elbows about 45 degrees from your body.
Press back up until your arms are straight, finishing with the bar over your shoulders.', cues = array['Pin your shoulder blades into the bench the whole set.', 'Touch the same spot on your chest every rep.', 'Push your feet into the floor as you press.']::text[] where id = '350f0b1f-d809-424a-ad4d-45a8e9d660dc' and is_global;
update exercises set name = 'Bench Press (Dumbbell)', muscle_group = 'Chest', equipment = 'dumbbell', category = 'strength', instructions = 'Sit on a flat bench with the dumbbells on your thighs, then lie back and bring them to the sides of your chest.
Press up until your arms are straight and the dumbbells are over your shoulders.
Lower slowly until the dumbbells are level with your chest.', cues = array['Keep your wrists stacked over your elbows.', 'Lower for two seconds, press with intent.', 'Shoulder blades back and down on the bench.']::text[] where id = '776731a6-70bc-4195-a687-f977d36c2b60' and is_global;
update exercises set name = 'Bench Press (Smith Machine)', muscle_group = 'Chest', equipment = 'machine', category = 'strength', instructions = 'Set a flat bench so the bar lines up with your mid chest.
Unhook the bar with a grip just wider than your shoulders and lower it to your chest.
Press up to straight arms and twist the bar back onto the hooks at the end of the set.', cues = array['Check the bar path lands on your mid chest before you start.', 'Keep your shoulder blades pinned back.', 'Control the bar down, do not let it drop.']::text[] where id = '237cdf25-3cb1-435f-bb45-60e5a200b375' and is_global;
update exercises set name = 'Close Grip Bench Press (Barbell)', muscle_group = 'Triceps', equipment = 'barbell', category = 'strength', instructions = 'Lie on a flat bench and grip the bar about shoulder width apart.
Lower the bar to your lower chest, keeping your elbows close to your sides.
Press back up until your arms lock out.', cues = array['Hands shoulder width, not touching.', 'Elbows brush past your ribs on the way down.', 'Finish each rep by squeezing your triceps.']::text[] where id = '331e2d0a-df10-4219-becb-f8c91f60fe57' and is_global;
update exercises set name = 'Close Grip Bench Press (Smith Machine)', muscle_group = 'Triceps', equipment = 'machine', category = 'strength', instructions = 'Set a flat bench under the Smith bar so it lines up with your lower chest.
Grip the bar shoulder width apart, unhook it and lower it with your elbows tucked.
Press back to straight arms.', cues = array['Elbows in, close to your body.', 'Slow on the way down.', 'Lock out fully at the top.']::text[] where id = '032ee22c-3201-4d75-afd4-d08cf3dc6eba' and is_global;
update exercises set name = 'Incline Bench Press (Barbell)', muscle_group = 'Chest', equipment = 'barbell', category = 'strength', instructions = 'Set the bench to about 30 degrees and lie back with your eyes under the bar.
Unrack and lower the bar to your upper chest, just below your collarbones.
Press straight up until your arms lock out.', cues = array['Keep the incline low, around 30 degrees.', 'Bar touches high on the chest.', 'Keep your back and hips on the bench.']::text[] where id = '61117381-4fd6-41a5-b0b2-f00d558e0b9e' and is_global;
update exercises set name = 'Incline Bench Press (Dumbbell)', muscle_group = 'Chest', equipment = 'dumbbell', category = 'strength', instructions = 'Set the bench to about 30 degrees and sit back with a dumbbell at each shoulder.
Press the dumbbells up over your upper chest until your arms are straight.
Lower slowly until the dumbbells are level with your upper chest.', cues = array['Elbows slightly in front of your shoulders.', 'Press up and slightly together.', 'Control the last part of every lowering.']::text[] where id = 'e5a86efe-af6f-41ec-bc1b-e808133ac017' and is_global;
update exercises set name = 'Incline Bench Press (Smith Machine)', muscle_group = 'Chest', equipment = 'machine', category = 'strength', instructions = 'Set an incline bench at about 30 degrees under the Smith bar so it lands on your upper chest.
Unhook, lower the bar to your upper chest, then press back up.
Twist the bar back onto the hooks after the last rep.', cues = array['Line the bench up before you load the bar.', 'Shoulder blades back and down.', 'Smooth, steady reps.']::text[] where id = '9422ae47-1993-474d-a427-90866db3cfbe' and is_global;
update exercises set name = 'High Incline Press (Dumbbell)', muscle_group = 'Shoulders', equipment = 'dumbbell', category = 'strength', instructions = 'Set the bench to about 45 to 60 degrees and sit back with the dumbbells at your shoulders.
Press up until your arms are straight above your upper chest.
Lower under control back to your shoulders.', cues = array['Keep your back on the pad.', 'Do not let your lower back arch off the bench.', 'Press in a straight line, not forward.']::text[] where id = '8d292aaa-91b3-46fe-87be-49c5f299710c' and is_global;
update exercises set name = 'Decline Bench Press (Barbell)', muscle_group = 'Chest', equipment = 'barbell', category = 'strength', instructions = 'Hook your legs into a decline bench and lie back with your eyes under the bar.
Unrack and lower the bar to your lower chest.
Press back up until your arms are straight.', cues = array['Have a spotter or use safeties on a decline.', 'Bar touches your lower chest.', 'Keep your shoulder blades squeezed together.']::text[] where id = '0be337f1-f6cf-496d-b945-43b33efef996' and is_global;
update exercises set name = 'Decline Bench Press (Dumbbell)', muscle_group = 'Chest', equipment = 'dumbbell', category = 'strength', instructions = 'Hook your legs into a decline bench and lie back with the dumbbells at your lower chest.
Press up until your arms are straight.
Lower slowly to the sides of your lower chest.', cues = array['Bring the dumbbells to the bench start carefully.', 'Elbows about 45 degrees from your body.', 'Control every lowering.']::text[] where id = '7c3a4de5-04a5-49d1-b02c-f61fb4dfc79d' and is_global;
update exercises set name = 'Floor Press (Barbell)', muscle_group = 'Chest', equipment = 'barbell', category = 'strength', instructions = 'Lie on the floor inside a rack with the bar set at arm''s length height, knees bent and feet flat.
Lower the bar until your upper arms rest on the floor.
Pause for a moment, then press back up.', cues = array['Let your elbows touch down softly, do not bounce.', 'Elbows about 45 degrees from your body.', 'Press hard from the dead stop.']::text[] where id = '3f757435-e6e6-402c-8b49-69bbe2ba0611' and is_global;
update exercises set name = 'Floor Press (Dumbbell)', muscle_group = 'Chest', equipment = 'dumbbell', category = 'strength', instructions = 'Lie on the floor with knees bent, holding the dumbbells over your chest with straight arms.
Lower until your upper arms touch the floor.
Pause, then press back up.', cues = array['Elbows land softly.', 'Keep your wrists straight.', 'Press up and slightly together.']::text[] where id = '6779712e-7484-401c-aa46-1b5b281627bf' and is_global;
update exercises set name = 'Close Grip Floor Press (Dumbbell)', muscle_group = 'Triceps', equipment = 'dumbbell', category = 'strength', instructions = 'Lie on the floor with knees bent, dumbbells held with palms facing each other above your chest.
Lower until your upper arms touch the floor with elbows tucked to your sides.
Press back up to straight arms.', cues = array['Palms face each other the whole time.', 'Elbows stay close to your ribs.', 'Squeeze your triceps at the top.']::text[] where id = '4d23ab07-8e3b-4fbb-a049-4d744a5ec1b9' and is_global;
update exercises set name = 'Single Arm Bench Press (Dumbbell)', muscle_group = 'Chest', equipment = 'dumbbell', category = 'strength', instructions = 'Lie on a flat bench with one dumbbell at the side of your chest and the other hand holding the bench.
Press the dumbbell up until your arm is straight.
Lower slowly, then do all reps before switching sides.', cues = array['Keep both shoulders on the bench.', 'Brace your trunk so you do not tip.', 'Same speed on both sides.']::text[] where id = 'cedfefce-bd8a-419a-8d0d-318176bcc2ef' and is_global;
update exercises set name = 'Hex Press (Dumbbell)', muscle_group = 'Chest', equipment = 'dumbbell', category = 'strength', instructions = 'Lie on a flat bench holding two dumbbells pressed together over your chest, palms facing each other.
Lower them to your chest while squeezing them together the whole time.
Press back up, still squeezing.', cues = array['Crush the dumbbells into each other.', 'Elbows close to your sides.', 'Slow lowering.']::text[] where id = '779c7b40-632a-4f42-b9a0-f149ab8dd72e' and is_global;
update exercises set name = 'Svend Press (Plate)', muscle_group = 'Chest', equipment = 'plate', category = 'strength', instructions = 'Stand tall and squeeze a plate between your palms in front of your chest.
Press it straight out in front until your arms are straight, still squeezing.
Bring it back to your chest under control.', cues = array['Squeeze the plate as hard as you can.', 'Keep your shoulders down.', 'Move slowly in both directions.']::text[] where id = 'd40a2b62-2449-42b3-970b-d3ead6ede62d' and is_global;
update exercises set name = 'Landmine Press', muscle_group = 'Chest', equipment = 'landmine', category = 'strength', instructions = 'Stand facing the end of a landmine bar and hold the end with both hands at your chest.
Press up and forward until your arms are straight.
Lower back to your chest under control.', cues = array['Stand tall with a braced trunk.', 'Press up and away from you.', 'Do not lean back.']::text[] where id = '247f6405-a9de-4e25-a554-298d9d8790fb' and is_global;
update exercises set name = 'Chest Press (Machine)', muscle_group = 'Chest', equipment = 'machine', category = 'strength', instructions = 'Set the seat so the handles line up with your mid chest and sit with your back flat on the pad.
Press the handles forward until your arms are straight.
Return slowly until you feel a stretch across your chest.', cues = array['Shoulder blades back against the pad.', 'Do not lock your elbows hard.', 'Slow and controlled on the way back.']::text[] where id = '31f7d1ac-03b4-4706-bdb5-41abdb9f147a' and is_global;
update exercises set name = 'Chest Press (Band)', muscle_group = 'Chest', equipment = 'band', category = 'accessory', instructions = 'Anchor a band behind you at chest height and hold a handle in each hand.
Step forward until there is tension, then press your hands forward until your arms are straight.
Return slowly to your chest.', cues = array['Stagger your stance for balance.', 'Keep your elbows just below shoulder height.', 'Fight the band on the way back.']::text[] where id = '73d1a135-7aa1-42b1-9745-b475a2f20a56' and is_global;
update exercises set name = 'Single Arm Chest Press (Cable)', muscle_group = 'Chest', equipment = 'cable', category = 'strength', instructions = 'Set a cable at chest height and stand facing away with the handle in one hand.
Press the handle forward until your arm is straight.
Return slowly, then switch arms after your set.', cues = array['Stagger your stance, opposite foot forward.', 'Keep your hips and shoulders square.', 'Squeeze your chest at the end of the press.']::text[] where id = '78272845-eaad-4301-bb5a-e9b38a0a851a' and is_global;
update exercises set name = 'Chest Fly (Dumbbell)', muscle_group = 'Chest', equipment = 'dumbbell', category = 'strength', instructions = 'Lie on a flat bench holding the dumbbells above your chest, palms facing each other and a soft bend in your elbows.
Lower them out to the sides in a wide arc until you feel a stretch across your chest.
Bring them back together over your chest along the same arc.', cues = array['Keep the same small bend in your elbows throughout.', 'Think about hugging a big tree.', 'Only go as low as your shoulders feel good.']::text[] where id = 'b30230b1-abdf-4cf0-8876-23a96cd74338' and is_global;
update exercises set name = 'Incline Chest Fly (Dumbbell)', muscle_group = 'Chest', equipment = 'dumbbell', category = 'strength', instructions = 'Set the bench to about 30 degrees and hold the dumbbells over your upper chest, palms facing.
Lower them out wide with a soft bend in the elbows.
Squeeze them back together over your chest.', cues = array['Soft elbows, fixed angle.', 'Feel the stretch, do not chase depth.', 'Squeeze at the top for a second.']::text[] where id = '113e0ec8-1a57-43d4-8997-b42e30c82573' and is_global;
update exercises set name = 'Chest Fly (Machine)', muscle_group = 'Chest', equipment = 'machine', category = 'strength', instructions = 'Set the seat so the handles are at chest height and sit with your back flat on the pad.
Bring the handles together in front of your chest.
Let them open slowly until you feel a stretch, then repeat.', cues = array['Keep your chest up and shoulders back.', 'Squeeze for a second when the handles meet.', 'Open slowly, do not let the weight pull you.']::text[] where id = 'ffd066fb-1b17-47b9-a6fd-61bdd3f7c933' and is_global;
update exercises set name = 'Cable Fly (Mid)', muscle_group = 'Chest', equipment = 'cable', category = 'strength', instructions = 'Set both pulleys at shoulder height and take a handle in each hand with a step forward.
With a soft bend in your elbows, bring your hands together in front of your chest.
Open your arms slowly until you feel a stretch, then repeat.', cues = array['Lean slightly forward from the hips.', 'Hands meet in front of your chest.', 'Same elbow bend from start to finish.']::text[] where id = '7ebe0401-baea-441f-b403-26ff7329cb1b' and is_global;
update exercises set name = 'Cable Fly (High to Low)', muscle_group = 'Chest', equipment = 'cable', category = 'strength', instructions = 'Set both pulleys high and take a handle in each hand with a step forward.
Sweep your hands down and together in front of your hips.
Return slowly up and out until you feel a stretch.', cues = array['Lean slightly forward.', 'Finish with your hands in front of your belt.', 'Keep a soft bend in your elbows.']::text[] where id = '0b45e6ab-295a-4450-a019-30c5a0f7cb16' and is_global;
update exercises set name = 'Cable Fly (Low to High)', muscle_group = 'Chest', equipment = 'cable', category = 'strength', instructions = 'Set both pulleys low and take a handle in each hand with a step forward.
Sweep your hands up and together until they meet at upper chest height.
Lower slowly back out and down.', cues = array['Palms face up slightly.', 'Finish at chin height, not above.', 'Squeeze your upper chest at the top.']::text[] where id = '73b834d8-99e3-4d57-ae55-2d0ec94b0446' and is_global;
update exercises set name = 'Chest Fly (TRX)', muscle_group = 'Chest', equipment = 'trx', category = 'accessory', instructions = 'Face away from the anchor holding the handles in front of you with straight arms, leaning forward.
Open your arms out wide as your chest lowers between your hands.
Squeeze your arms back together to return.', cues = array['Keep a plank position from head to heels.', 'Walk your feet back to make it harder.', 'Soft bend in the elbows throughout.']::text[] where id = '2a1bac1b-8c44-43c8-a926-4e325a0c3d22' and is_global;
update exercises set name = 'Push Up', muscle_group = 'Chest', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Start in a plank with your hands just wider than your shoulders and your body in a straight line.
Lower your chest towards the floor with elbows about 45 degrees from your body.
Push back up until your arms are straight.', cues = array['Squeeze your glutes to keep your hips level.', 'Chest touches down before your hips do.', 'Drop to your knees if you need to keep good form.']::text[] where id = '37374148-998f-41e7-8182-d6ab6c3e8436' and is_global;
update exercises set name = 'Wide Grip Push Up', muscle_group = 'Chest', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Start in a plank with your hands a good way wider than your shoulders.
Lower your chest to the floor, keeping your body straight.
Push back up.', cues = array['Hands wider, but keep elbows soft at the top.', 'Straight line from head to heels.', 'Lower slowly.']::text[] where id = 'a1ffb319-6281-4849-b7a3-b10909026d14' and is_global;
update exercises set name = 'Diamond Push Up', muscle_group = 'Triceps', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Start in a plank with your hands together under your chest, thumbs and index fingers making a diamond.
Lower your chest towards your hands with elbows close to your sides.
Push back up to straight arms.', cues = array['Elbows travel back, not out.', 'Keep your hips in line.', 'Use your knees to make it easier.']::text[] where id = 'f0d868b7-0232-4ffb-95ad-8150d79735a4' and is_global;
update exercises set name = 'Close Grip Push Up', muscle_group = 'Triceps', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Start in a plank with your hands directly under your shoulders.
Lower your chest while keeping your elbows tucked against your sides.
Push back up until your arms are straight.', cues = array['Elbows brush your ribs.', 'Body moves as one piece.', 'Squeeze your triceps at the top.']::text[] where id = '05aa059a-abba-40c9-9212-df6c694e8f5f' and is_global;
update exercises set name = 'Incline Push Up', muscle_group = 'Chest', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Place your hands on a bench or box slightly wider than your shoulders and walk your feet back into a plank.
Lower your chest to the edge of the bench.
Push back up to straight arms.', cues = array['The higher the surface, the easier it is.', 'Keep your body in a straight line.', 'Lower slowly.']::text[] where id = 'e6d3b3ca-9f3b-4a74-9f33-e341cd76e6ee' and is_global;
update exercises set name = 'Decline Push Up', muscle_group = 'Chest', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Put your feet on a bench and your hands on the floor just wider than your shoulders.
Lower your chest to the floor.
Push back up, keeping your hips in line.', cues = array['Do not let your hips sag.', 'Elbows about 45 degrees from your body.', 'Control the bottom.']::text[] where id = '8beacaa9-60b3-4e50-9ce0-99c23c411e1c' and is_global;
update exercises set name = 'Push Up (Band)', muscle_group = 'Chest', equipment = 'band', category = 'accessory', instructions = 'Loop a band across your upper back, holding an end under each hand, and set up in a push up position.
Lower your chest to the floor.
Push up against the band until your arms are straight.', cues = array['Band sits across your shoulder blades.', 'Drive the floor away at the top.', 'Same form as a normal push up.']::text[] where id = '47219adf-2be8-40ca-8ad9-061f3facb3fb' and is_global;
update exercises set name = 'Push Up (TRX)', muscle_group = 'Chest', equipment = 'trx', category = 'accessory', instructions = 'Face away from the anchor holding the handles at chest height and lean forward into a plank.
Lower your chest between your hands.
Press back up to straight arms.', cues = array['Keep the straps from touching your arms.', 'Walk your feet back to make it harder.', 'Hold a tight plank.']::text[] where id = '771fc2d8-4348-4bea-ac2e-bdf36cddc69a' and is_global;
update exercises set name = 'Chest Dip', muscle_group = 'Chest', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Support yourself on parallel bars with straight arms.
Lean your chest forward and lower until your shoulders are just below your elbows.
Press back up to straight arms.', cues = array['Lean forward to work your chest more.', 'Only go as deep as your shoulders are comfortable.', 'Use an assisted dip machine or band if needed.']::text[] where id = '30de57d6-8a0a-4a98-a712-aba71bd241a2' and is_global;
update exercises set name = 'Pull Up', muscle_group = 'Back', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Hang from a bar with an overhand grip just wider than your shoulders.
Pull your chest towards the bar by driving your elbows down to your sides.
Lower slowly until your arms are straight again.', cues = array['Start each rep from a dead hang.', 'Think elbows to your back pockets.', 'Use a band or assisted machine to build up reps.']::text[] where id = 'd44727a6-559e-4a61-9007-f92f270544f1' and is_global;
update exercises set name = 'Chin Up', muscle_group = 'Back', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Hang from a bar with an underhand grip about shoulder width apart.
Pull until your chin is over the bar.
Lower slowly to straight arms.', cues = array['Squeeze your shoulder blades down first.', 'Keep your legs still, no swinging.', 'Full stretch at the bottom.']::text[] where id = 'b3adbba8-032f-4690-a96a-f85819e428b3' and is_global;
update exercises set name = 'Neutral Grip Pull Up', muscle_group = 'Back', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Hang from parallel handles with your palms facing each other.
Pull your chest up between the handles.
Lower slowly to straight arms.', cues = array['Shoulders down away from your ears.', 'Drive your elbows to your ribs.', 'Control the way down.']::text[] where id = '4a791519-a20a-48ff-bdab-1c53ae3493c8' and is_global;
update exercises set name = 'Wide Grip Pull Up', muscle_group = 'Back', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Hang from a bar with an overhand grip well wider than your shoulders.
Pull your upper chest towards the bar.
Lower slowly to straight arms.', cues = array['Lead with your chest.', 'Elbows pull down and out.', 'Do not kip or swing.']::text[] where id = 'b65332a6-4ff6-44da-9cf7-118a99d8340e' and is_global;
update exercises set name = 'Assisted Pull Up (Machine)', muscle_group = 'Back', equipment = 'machine', category = 'strength', instructions = 'Set the assistance weight, kneel or stand on the pad and grip the handles overhead.
Pull your chest up towards the handles.
Lower slowly until your arms are straight.', cues = array['More weight on the stack means more help.', 'Full range every rep.', 'Reduce the help as you get stronger.']::text[] where id = '20aa15d3-411b-4619-af25-78bc5a574f95' and is_global;
update exercises set name = 'Lat Pulldown (Wide Grip)', muscle_group = 'Back', equipment = 'cable', category = 'strength', instructions = 'Sit with your thighs under the pads and grip the bar well wider than your shoulders.
Lean back slightly and pull the bar to your upper chest.
Let the bar rise slowly until your arms are straight.', cues = array['Pull with your elbows, not your hands.', 'Chest up to meet the bar.', 'Let your shoulders stretch up at the top.']::text[] where id = '3f6fea34-fb88-4e3f-8c14-a8c83aa2251a' and is_global;
update exercises set name = 'Lat Pulldown (Close Grip)', muscle_group = 'Back', equipment = 'cable', category = 'strength', instructions = 'Sit with your thighs under the pads holding a close grip handle.
Pull the handle to your upper chest, elbows travelling down by your sides.
Return slowly to straight arms.', cues = array['Lean back just a little.', 'Squeeze your lats at the bottom.', 'Do not use your body to swing the weight.']::text[] where id = '207b59ad-7f72-4d44-a24e-19997c2888f3' and is_global;
update exercises set name = 'Lat Pulldown (Neutral Grip)', muscle_group = 'Back', equipment = 'cable', category = 'strength', instructions = 'Sit with your thighs under the pads holding a handle with palms facing each other.
Pull the handle to your upper chest.
Return slowly until your arms are straight.', cues = array['Shoulders down before you pull.', 'Elbows drive to your ribs.', 'Control the way up.']::text[] where id = 'e9952032-a251-4be3-855c-73c96c135104' and is_global;
update exercises set name = 'Single Arm Lat Pulldown (Cable)', muscle_group = 'Back', equipment = 'cable', category = 'strength', instructions = 'Kneel or sit under a high pulley holding a single handle overhead.
Pull the handle down to your shoulder, elbow travelling to your side.
Return slowly, then switch arms.', cues = array['Keep your torso still.', 'Feel the stretch at the top.', 'Same reps on both sides.']::text[] where id = '8b30b703-5a06-4b6c-b97c-b3493bada16c' and is_global;
update exercises set name = 'Seated Cable Row (Close Grip)', muscle_group = 'Back', equipment = 'cable', category = 'strength', instructions = 'Sit at the row station with feet on the platform and a close grip handle in both hands.
Sit tall and pull the handle to your stomach, squeezing your shoulder blades together.
Let the handle travel forward slowly until your arms are straight.', cues = array['Chest up, do not round forward.', 'Squeeze your shoulder blades for a second.', 'Your body stays still, your arms do the work.']::text[] where id = '57df9d2f-1d2d-4a65-a5b8-a9caf86f61e4' and is_global;
update exercises set name = 'Seated Cable Row (Wide Grip)', muscle_group = 'Back', equipment = 'cable', category = 'strength', instructions = 'Sit at the row station holding a wide bar.
Pull the bar to your lower chest with your elbows out to the sides.
Return slowly to straight arms.', cues = array['Elbows out wide.', 'Squeeze your upper back.', 'Stay tall through the whole set.']::text[] where id = '0705d75a-8732-494f-ac45-34fdf70d50ed' and is_global;
update exercises set name = 'Single Arm Cable Row with Rotation', muscle_group = 'Back', equipment = 'cable', category = 'strength', instructions = 'Stand side on to a cable at chest height holding the handle in the far hand.
Row the handle to your ribs while turning your chest towards it.
Reach back forward and rotate away, then repeat.', cues = array['Turn through your upper back.', 'Keep your hips steady.', 'Smooth, not jerky.']::text[] where id = '3ebcaea4-a0e1-4415-bbcb-8c898cd3317b' and is_global;
update exercises set name = 'Chest Supported Row (Machine)', muscle_group = 'Back', equipment = 'machine', category = 'strength', instructions = 'Set the seat so your chest rests on the pad and the handles are at arm''s length.
Pull the handles back towards your ribs.
Return slowly to straight arms.', cues = array['Keep your chest on the pad.', 'Squeeze your shoulder blades together.', 'Slow on the way back.']::text[] where id = '86f7874a-9b57-4be6-bb75-d81761395368' and is_global;
update exercises set name = 'Bent Over Row (Barbell)', muscle_group = 'Back', equipment = 'barbell', category = 'strength', instructions = 'Hold the bar with an overhand grip, hinge at the hips until your torso is near 45 degrees, knees soft.
Pull the bar to your lower ribs.
Lower it until your arms are straight, keeping your back flat.', cues = array['Brace your trunk before each rep.', 'Pull the bar to your belly button area.', 'Keep your back angle the same throughout.']::text[] where id = '725495fe-015e-44c4-baba-656a8bb4712b' and is_global;
update exercises set name = 'Underhand Bent Over Row (Barbell)', muscle_group = 'Back', equipment = 'barbell', category = 'strength', instructions = 'Hold the bar with an underhand grip and hinge forward with a flat back.
Row the bar to your stomach, elbows close to your sides.
Lower slowly to straight arms.', cues = array['Elbows stay tucked.', 'Flat back, soft knees.', 'Squeeze your lats at the top.']::text[] where id = '60ff1bfb-9a14-4421-bb75-2e067b521608' and is_global;
update exercises set name = 'Pendlay Row (Barbell)', muscle_group = 'Back', equipment = 'barbell', category = 'strength', instructions = 'Set up with the bar on the floor and your torso nearly flat, back straight.
Pull the bar explosively to your lower chest.
Lower it back to the floor and let it settle before the next rep.', cues = array['Every rep starts from the floor.', 'Torso stays nearly parallel to the floor.', 'Fast up, controlled down.']::text[] where id = '3a9ee493-b68f-4c6d-bda4-ae7a0827f575' and is_global;
update exercises set name = 'Yates Row (Barbell)', muscle_group = 'Back', equipment = 'barbell', category = 'strength', instructions = 'Hold the bar with an underhand grip and lean forward only about 30 degrees.
Pull the bar to your lower stomach.
Lower slowly to straight arms.', cues = array['Stand more upright than a normal row.', 'Drive your elbows back.', 'Do not bounce the bar off your thighs.']::text[] where id = '8f9a851f-344f-4ddd-b4bd-09543b51ee30' and is_global;
update exercises set name = 'Seal Row (Barbell)', muscle_group = 'Back', equipment = 'barbell', category = 'strength', instructions = 'Lie face down on a raised flat bench with the bar on the floor under you.
Pull the bar up until it touches the bench.
Lower slowly to straight arms.', cues = array['Keep your chest on the bench.', 'No body swing, all upper back.', 'Squeeze at the top.']::text[] where id = '92872783-8ddd-49fc-a4f2-ceb212088c25' and is_global;
update exercises set name = 'Bent Over Row (Smith Machine)', muscle_group = 'Back', equipment = 'machine', category = 'strength', instructions = 'Set the Smith bar at knee height, grip it and hinge forward with a flat back.
Row the bar to your lower ribs.
Lower slowly to straight arms.', cues = array['Brace before every rep.', 'Keep your back angle fixed.', 'Squeeze your shoulder blades.']::text[] where id = 'ad3dc073-dc7c-44b2-bcd5-bf32fada4e14' and is_global;
update exercises set name = 'Single Arm Row (Dumbbell)', muscle_group = 'Back', equipment = 'dumbbell', category = 'strength', instructions = 'Put one knee and hand on a bench, back flat, dumbbell hanging in the other hand.
Row the dumbbell up to your hip.
Lower slowly until your arm is straight, then switch sides.', cues = array['Pull towards your hip, not your chest.', 'Keep your shoulders level.', 'Feel the stretch at the bottom.']::text[] where id = '067338c4-0b2b-4b84-9114-29a360ed9cb1' and is_global;
update exercises set name = 'Chest Supported Row (Dumbbell)', muscle_group = 'Back', equipment = 'dumbbell', category = 'strength', instructions = 'Set a bench to about 30 degrees and lie face down with a dumbbell in each hand.
Row the dumbbells up until your elbows pass your body.
Lower slowly to straight arms.', cues = array['Chest stays on the pad.', 'Squeeze your shoulder blades together.', 'Pause at the top.']::text[] where id = 'ef77a6c8-1215-472f-8418-c0a18e0e16d6' and is_global;
update exercises set name = 'Chest Supported T-Bar Row', muscle_group = 'Back', equipment = 'barbell', category = 'strength', instructions = 'Lie face down on the pad and grip the handles.
Row the handles towards your chest.
Lower slowly to straight arms.', cues = array['Chest pressed into the pad.', 'Drive your elbows back.', 'Do not shrug.']::text[] where id = 'fc0411a4-3e57-4535-a258-bf9b786a2915' and is_global;
update exercises set name = 'T-Bar Row', muscle_group = 'Back', equipment = 'landmine', category = 'strength', instructions = 'Straddle the bar, grip the handle and hinge forward with a flat back.
Row the plates towards your chest.
Lower slowly until your arms are straight.', cues = array['Hips back, chest up.', 'Pull with your elbows.', 'Keep your back angle steady.']::text[] where id = 'b6d61556-b9e8-43ee-a9c5-d4faa70e0ec3' and is_global;
update exercises set name = 'Meadows Row (Landmine)', muscle_group = 'Back', equipment = 'landmine', category = 'strength', instructions = 'Stand side on to the end of a landmine bar, stagger your stance and grip the end overhand.
Row the bar up, elbow flaring out and back.
Lower slowly, then switch sides.', cues = array['Rest your other forearm on your front knee.', 'Big stretch at the bottom.', 'Pull high towards your hip.']::text[] where id = 'c4a897b1-d3a5-443c-9ea6-1df12ee818d9' and is_global;
update exercises set name = 'Renegade Row (Dumbbell)', muscle_group = 'Back', equipment = 'dumbbell', category = 'strength', instructions = 'Get into a push up position with your hands on two dumbbells.
Row one dumbbell to your hip while keeping your hips still.
Lower it, then row the other side.', cues = array['Feet wide for balance.', 'Hips stay square to the floor.', 'Slow and controlled.']::text[] where id = 'f3c903d9-62c9-46f4-a22d-505ae4a64c2d' and is_global;
update exercises set name = 'Inverted Row', muscle_group = 'Back', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Lie under a bar set at waist height, grip it and keep your body straight with heels on the floor.
Pull your chest up to the bar.
Lower slowly to straight arms.', cues = array['Body stays straight like a plank.', 'Bend your knees to make it easier.', 'Squeeze your shoulder blades at the top.']::text[] where id = 'f1b9341f-3dee-488c-8a9e-f4761b0e2ece' and is_global;
update exercises set name = 'Romanian Deadlift to Row (Barbell)', muscle_group = 'Back', equipment = 'barbell', category = 'strength', instructions = 'Stand holding the bar, then push your hips back to lower it down your thighs.
At the bottom of the hinge, row the bar to your stomach and lower it.
Stand back up, squeezing your glutes.', cues = array['Flat back in every position.', 'One hinge, one row, one stand.', 'Keep the bar close to your legs.']::text[] where id = '87e25d69-33ac-4e31-ada6-9800d7688d57' and is_global;
update exercises set name = 'Straight Arm Pulldown (Cable)', muscle_group = 'Back', equipment = 'cable', category = 'strength', instructions = 'Face a high pulley holding a bar or rope with straight arms in front of you.
Hinge slightly forward and sweep the bar down to your thighs.
Return slowly to shoulder height.', cues = array['Arms stay straight, a soft bend is fine.', 'Feel your lats pull, not your triceps.', 'Keep your trunk still.']::text[] where id = 'c456acd7-20c3-4f24-9518-f508544833db' and is_global;
update exercises set name = 'Pullover (Dumbbell)', muscle_group = 'Back', equipment = 'dumbbell', category = 'strength', instructions = 'Lie across or along a bench holding one dumbbell over your chest with both hands.
Lower it in an arc behind your head until you feel a stretch.
Pull it back over your chest along the same arc.', cues = array['Keep a slight bend in your elbows.', 'Ribs down, do not arch.', 'Slow into the stretch.']::text[] where id = 'e74039d9-2cb7-412c-9f27-e603d2aff5f0' and is_global;
update exercises set name = 'Pullover (Barbell)', muscle_group = 'Back', equipment = 'barbell', category = 'strength', instructions = 'Lie on a flat bench holding a light bar over your chest with a narrow grip.
Lower it behind your head in an arc.
Pull it back over your chest.', cues = array['Elbows slightly bent.', 'Stop when you feel a strong stretch.', 'Keep your lower back on the bench.']::text[] where id = 'fddeebb0-3822-492e-90b0-a3ac42a6877e' and is_global;
update exercises set name = 'Pullover (Cable)', muscle_group = 'Back', equipment = 'cable', category = 'strength', instructions = 'Lie on a bench with your head towards a low pulley, holding a bar or rope over your face.
Pull the handle over your chest towards your hips with straight arms.
Return slowly overhead.', cues = array['Arms nearly straight.', 'Squeeze your lats at the bottom.', 'Control the stretch.']::text[] where id = '55fd2fc5-bccd-4ef0-964f-802e97eb9b1f' and is_global;
update exercises set name = 'Face Pull (Cable)', muscle_group = 'Shoulders', equipment = 'cable', category = 'strength', instructions = 'Set a rope at upper chest height or higher and hold the ends with your thumbs pointing back.
Pull the rope towards your face, hands finishing beside your ears.
Return slowly to straight arms.', cues = array['Pull the rope apart as you pull back.', 'Elbows stay high.', 'Finish in a double biceps pose.']::text[] where id = 'c81bc3ec-b215-40c0-b712-1a9f5edcf609' and is_global;
update exercises set name = 'Band Pull Apart', muscle_group = 'Shoulders', equipment = 'band', category = 'warmup', instructions = 'Hold a band in front of your chest with straight arms, hands shoulder width apart.
Pull your hands apart until the band touches your chest.
Return slowly.', cues = array['Shoulders stay down.', 'Squeeze your shoulder blades together.', 'Arms stay straight.']::text[] where id = '2deeb5ee-86cc-42e2-b183-f093c634abbf' and is_global;
update exercises set name = 'Rack Pull (Barbell)', muscle_group = 'Back', equipment = 'barbell', category = 'strength', instructions = 'Set the bar on the safeties just below your knees and grip it just outside your legs.
Brace and stand up with the bar, pushing your hips forward.
Lower it back to the safeties under control.', cues = array['Flat back before you pull.', 'Push the floor away.', 'Lock out with your glutes, not by leaning back.']::text[] where id = 'b617b892-fb96-4ae9-9749-8309a3ba66e6' and is_global;
update exercises set name = 'Back Extension (45 Degree)', muscle_group = 'Back', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Set the pad just below your hips on the 45 degree bench and hook your feet in.
Lower your upper body forward with a flat back.
Raise back up until your body is in a straight line.', cues = array['Hinge at your hips.', 'Squeeze your glutes to come up.', 'Do not lean back past straight.']::text[] where id = 'd068a08a-5142-4405-acca-a46879c66f5e' and is_global;
update exercises set name = 'Reverse Hyper', muscle_group = 'Glutes', equipment = 'machine', category = 'strength', instructions = 'Lie face down on the reverse hyper with your hips at the edge and hold the handles.
Swing your legs up until they are in line with your body.
Lower them under control.', cues = array['Lift with your glutes.', 'Do not swing too hard.', 'Pause at the top.']::text[] where id = 'd4e8ddfd-276a-405d-92a5-77306ee09f88' and is_global;
update exercises set name = 'Superman', muscle_group = 'Back', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Lie face down with your arms stretched out in front of you.
Lift your arms, chest and legs a few centimetres off the floor.
Hold for a moment and lower slowly.', cues = array['Look at the floor, not forward.', 'Squeeze your glutes.', 'Small lift, long body.']::text[] where id = '8b24bca0-3a78-43d2-8c0d-60ff753833d8' and is_global;
update exercises set name = 'Prone Cobra', muscle_group = 'Back', equipment = 'bodyweight', category = 'accessory', instructions = 'Lie face down with your arms by your sides, palms down.
Lift your chest, turn your palms out and squeeze your shoulder blades together.
Hold, then lower slowly.', cues = array['Chin tucked, eyes to the floor.', 'Shoulder blades down and together.', 'Breathe while you hold.']::text[] where id = 'c8f99ffd-dc71-4cd8-8aeb-219cfbfed9bd' and is_global;
update exercises set name = 'Good Morning (Barbell)', muscle_group = 'Legs', equipment = 'barbell', category = 'strength', instructions = 'Set the bar on your upper back and stand with soft knees.
Push your hips back and lower your chest until you feel a stretch in your hamstrings.
Drive your hips forward to stand back up.', cues = array['Flat back the whole time.', 'Hips back, not chest down.', 'Start light.']::text[] where id = '6eb31aa4-5a4c-412f-8e92-da3a75acc74f' and is_global;
update exercises set name = 'Overhead Press (Barbell)', muscle_group = 'Shoulders', equipment = 'barbell', category = 'strength', instructions = 'Stand with the bar on the front of your shoulders, hands just wider than shoulder width.
Brace and press the bar straight up, moving your head back slightly so it clears your face.
Finish with the bar over the middle of your head, then lower to your shoulders.', cues = array['Squeeze your glutes so you do not lean back.', 'Head through once the bar passes your forehead.', 'Elbows slightly in front of the bar at the start.']::text[] where id = 'd91f5d54-acb2-443a-b16f-88dfb84b1361' and is_global;
update exercises set name = 'Seated Overhead Press (Barbell)', muscle_group = 'Shoulders', equipment = 'barbell', category = 'strength', instructions = 'Sit on an upright bench with the bar racked just above your head.
Unrack, lower the bar to the top of your chest, then press it back overhead.
Re-rack after your last rep.', cues = array['Back flat against the pad.', 'Press straight up, not forward.', 'Lower under control.']::text[] where id = '065d100e-e6b9-4077-9484-1414cb0f2bc7' and is_global;
update exercises set name = 'Seated Overhead Press (Smith Machine)', muscle_group = 'Shoulders', equipment = 'machine', category = 'strength', instructions = 'Set an upright bench under the Smith bar so it lowers just in front of your face.
Unhook, lower the bar to chin height, then press to straight arms.
Twist the bar back onto the hooks after the last rep.', cues = array['Line up the bench before loading.', 'Keep your back on the pad.', 'Smooth reps, no bouncing.']::text[] where id = '011eddc8-e378-47c0-9577-8e7035e0142b' and is_global;
update exercises set name = 'Push Press (Barbell)', muscle_group = 'Shoulders', equipment = 'barbell', category = 'power', instructions = 'Stand with the bar on the front of your shoulders.
Dip by bending your knees a little, then drive up hard and press the bar overhead in one movement.
Lower the bar back to your shoulders, bending your knees slightly to absorb it.', cues = array['Short dip, straight down.', 'Legs start it, arms finish it.', 'Lock out with the bar over your head.']::text[] where id = '1b529a87-8eab-4327-aa0a-215e0fc8e4d4' and is_global;
update exercises set name = 'Seated Shoulder Press (Dumbbell)', muscle_group = 'Shoulders', equipment = 'dumbbell', category = 'strength', instructions = 'Sit on an upright bench with a dumbbell at each shoulder, palms facing forward.
Press up until your arms are straight and the dumbbells are over your head.
Lower slowly back to shoulder height.', cues = array['Back flat on the pad.', 'Elbows slightly in front of your body.', 'Do not clash the dumbbells at the top.']::text[] where id = '70aae49b-ee2e-4f52-96c6-ac74d42603fd' and is_global;
update exercises set name = 'Seated Arnold Press (Dumbbell)', muscle_group = 'Shoulders', equipment = 'dumbbell', category = 'strength', instructions = 'Sit on an upright bench holding the dumbbells in front of your shoulders, palms facing you.
Press up while turning your palms to face forward, finishing with straight arms overhead.
Reverse the turn as you lower back to the start.', cues = array['One smooth turn on the way up and down.', 'Back stays on the pad.', 'Use lighter weight than a normal press.']::text[] where id = '2aec7c6d-5962-4d3a-896b-34e60c03cabf' and is_global;
update exercises set name = 'Shoulder Press (Machine)', muscle_group = 'Shoulders', equipment = 'machine', category = 'strength', instructions = 'Set the seat so the handles start at shoulder height.
Press the handles up until your arms are straight.
Lower slowly back to shoulder height.', cues = array['Back flat against the pad.', 'Do not shrug as you press.', 'Slow on the way down.']::text[] where id = 'b929fdc6-3e89-4cb4-826a-9b9d8fb8519f' and is_global;
update exercises set name = 'Landmine Press (Single Arm)', muscle_group = 'Shoulders', equipment = 'landmine', category = 'strength', instructions = 'Stand or half kneel holding the end of a landmine bar at your shoulder.
Press it up and forward until your arm is straight.
Lower slowly, then switch sides.', cues = array['Brace your trunk, no twisting.', 'Press up and away.', 'Let your shoulder blade move with the arm.']::text[] where id = '45226422-7265-4bca-86c7-cf69125e3b6b' and is_global;
update exercises set name = 'Bradford Press (Barbell)', muscle_group = 'Shoulders', equipment = 'barbell', category = 'strength', instructions = 'Stand with the bar on the front of your shoulders.
Press it just over your head and lower it behind your head to the top of your traps.
Press it back over and down to the front, alternating each rep.', cues = array['Only press high enough to clear your head.', 'Use a light weight.', 'Stop if your shoulders do not feel good.']::text[] where id = '956a47ad-a3a4-4ba9-9cae-b169ff066318' and is_global;
update exercises set name = 'Cuban Press (Barbell)', muscle_group = 'Shoulders', equipment = 'barbell', category = 'accessory', instructions = 'Hold a light bar or dumbbells at your thighs and lift your elbows out to shoulder height.
Rotate your forearms up so your hands are above your elbows.
Press overhead, then reverse each step to lower.', cues = array['Very light weight.', 'Elbows stay at shoulder height while you rotate.', 'Slow and controlled.']::text[] where id = '554eba5c-f038-48d3-a5ce-e26b45ecfb1c' and is_global;
update exercises set name = 'Handstand Push Up', muscle_group = 'Shoulders', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Kick up into a handstand against a wall, hands just wider than your shoulders.
Lower your head towards the floor by bending your elbows.
Press back up to straight arms.', cues = array['Make a triangle with your hands and head.', 'Keep your stomach tight.', 'Start with pike push ups if these are too hard.']::text[] where id = '23dc9527-d2f9-4699-bc60-950c1597dafb' and is_global;
update exercises set name = 'Pike Push Up', muscle_group = 'Shoulders', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Start in a push up position and walk your feet in so your hips are high, body like an upside down V.
Bend your elbows to lower your head towards the floor between your hands.
Press back up.', cues = array['Hips stay high.', 'Head travels forward of your hands.', 'Elevate your feet to make it harder.']::text[] where id = '521e803b-6889-45df-a5ed-6ddc534b6b75' and is_global;
update exercises set name = 'Lateral Raise (Dumbbell)', muscle_group = 'Shoulders', equipment = 'dumbbell', category = 'strength', instructions = 'Stand holding a dumbbell at each side with a slight bend in your elbows.
Raise your arms out to the sides until your hands reach shoulder height.
Lower slowly.', cues = array['Lead with your elbows.', 'Stop at shoulder height.', 'No swinging, use a weight you can control.']::text[] where id = 'a441fa1b-9f43-4710-b471-eabef4f1474d' and is_global;
update exercises set name = 'Seated Lateral Raise (Dumbbell)', muscle_group = 'Shoulders', equipment = 'dumbbell', category = 'strength', instructions = 'Sit on the end of a bench holding a dumbbell at each side.
Raise your arms out to the sides to shoulder height.
Lower slowly.', cues = array['Sitting stops you using momentum.', 'Slight forward lean is fine.', 'Pinky side of the dumbbell slightly up.']::text[] where id = '673ddd49-9800-4243-b892-03e2d4279f2f' and is_global;
update exercises set name = 'Lateral Raise (Cable)', muscle_group = 'Shoulders', equipment = 'cable', category = 'strength', instructions = 'Stand side on to a low pulley holding the handle in the far hand.
Raise your arm out to the side to shoulder height.
Lower slowly, then switch sides.', cues = array['Tension stays on the whole way.', 'Keep your torso still.', 'Slight bend in the elbow.']::text[] where id = '411bce2c-c354-4ff6-8355-0df94c2c56f9' and is_global;
update exercises set name = 'Lateral Raise (Machine)', muscle_group = 'Shoulders', equipment = 'machine', category = 'strength', instructions = 'Sit with your arms against the pads and grip the handles.
Raise your arms out to the sides to shoulder height.
Lower slowly.', cues = array['Shoulders down, do not shrug.', 'Pause at the top.', 'Slow on the way down.']::text[] where id = '6e993881-febc-4275-81a4-8fd99b98544f' and is_global;
update exercises set name = 'Front Raise (Dumbbell)', muscle_group = 'Shoulders', equipment = 'dumbbell', category = 'strength', instructions = 'Stand holding the dumbbells in front of your thighs.
Raise them in front of you to shoulder height with a slight bend in your elbows.
Lower slowly.', cues = array['Stop at shoulder height.', 'Keep your body still.', 'Raise both or alternate arms.']::text[] where id = '630e5bea-8af8-40e4-93c7-f34c5889dd97' and is_global;
update exercises set name = 'Front Raise (Barbell)', muscle_group = 'Shoulders', equipment = 'barbell', category = 'strength', instructions = 'Stand holding a light bar in front of your thighs, hands shoulder width apart.
Raise it in front of you to shoulder height.
Lower slowly.', cues = array['Arms nearly straight.', 'No leaning back.', 'Light weight, strict reps.']::text[] where id = '9d8fe29f-bc26-4b00-81c3-ff3a00416a35' and is_global;
update exercises set name = 'Front Raise (Cable)', muscle_group = 'Shoulders', equipment = 'cable', category = 'strength', instructions = 'Stand facing away from a low pulley with the handle between your legs.
Raise the handle in front of you to shoulder height.
Lower slowly.', cues = array['Constant tension, no rest at the bottom.', 'Body stays tall.', 'Slight bend in the elbows.']::text[] where id = 'f8d6c390-bf4b-441a-ba23-6aa335620510' and is_global;
update exercises set name = 'Front Raise (Plate)', muscle_group = 'Shoulders', equipment = 'plate', category = 'strength', instructions = 'Hold a plate at the sides with both hands in front of your thighs.
Raise it in front of you to eye level.
Lower slowly.', cues = array['Arms nearly straight.', 'Do not swing.', 'Keep your shoulders down.']::text[] where id = '3d367de2-a110-45d9-8f8d-7ce148237cea' and is_global;
update exercises set name = 'Bus Driver (Plate)', muscle_group = 'Shoulders', equipment = 'plate', category = 'strength', instructions = 'Hold a plate out in front of you at shoulder height with straight arms.
Turn it left and right like a steering wheel.
Keep your arms up for the whole set.', cues = array['Arms stay at shoulder height.', 'Turn as far as you comfortably can.', 'Breathe steadily.']::text[] where id = '1c4ec577-6d41-4dea-bb3c-a2546a94ced1' and is_global;
update exercises set name = 'Upright Row (Barbell)', muscle_group = 'Shoulders', equipment = 'barbell', category = 'strength', instructions = 'Stand holding the bar in front of your thighs, hands about shoulder width.
Pull the bar up close to your body until your elbows reach shoulder height.
Lower slowly.', cues = array['Elbows lead and stay higher than your hands.', 'Stop at shoulder height.', 'Use a wider grip if your shoulders feel pinched.']::text[] where id = '43696dbc-21a2-4db2-9aa3-b2542c7c29c5' and is_global;
update exercises set name = 'Upright Row (Dumbbell)', muscle_group = 'Shoulders', equipment = 'dumbbell', category = 'strength', instructions = 'Stand holding the dumbbells in front of your thighs.
Pull them up close to your body until your elbows reach shoulder height.
Lower slowly.', cues = array['Elbows lead.', 'Shoulders down, not shrugged.', 'Controlled both ways.']::text[] where id = '579f8f66-308b-4755-bbac-eba1ecc9bab1' and is_global;
update exercises set name = 'Upright Row (Cable)', muscle_group = 'Shoulders', equipment = 'cable', category = 'strength', instructions = 'Stand facing a low pulley holding a straight bar.
Pull the bar up close to your body until your elbows reach shoulder height.
Lower slowly.', cues = array['Elbows lead.', 'Tension the whole time.', 'Stand tall.']::text[] where id = '39086555-aeaf-404c-b34e-bed12c2e3a2d' and is_global;
update exercises set name = 'Shrug (Barbell)', muscle_group = 'Shoulders', equipment = 'barbell', category = 'strength', instructions = 'Stand holding the bar in front of your thighs.
Lift your shoulders straight up towards your ears.
Hold for a second and lower slowly.', cues = array['Straight up and down, no rolling.', 'Arms stay straight.', 'Pause at the top.']::text[] where id = 'dc833cce-5c1b-46ca-858d-5514d17ae8ee' and is_global;
update exercises set name = 'Shrug (Dumbbell)', muscle_group = 'Shoulders', equipment = 'dumbbell', category = 'strength', instructions = 'Stand holding a dumbbell at each side.
Lift your shoulders towards your ears.
Hold for a second and lower slowly.', cues = array['Straight up, straight down.', 'Keep your chin level.', 'Full stretch at the bottom.']::text[] where id = '814be1de-ea1e-4632-9c5d-e1b9065b2b6e' and is_global;
update exercises set name = 'Shrug (Cable)', muscle_group = 'Shoulders', equipment = 'cable', category = 'strength', instructions = 'Stand facing a low pulley holding a bar or two handles.
Lift your shoulders towards your ears.
Lower slowly.', cues = array['Arms straight.', 'Pause at the top.', 'Constant tension.']::text[] where id = 'a253a20b-8c98-449c-8516-e6ac424ade44' and is_global;
update exercises set name = 'Bent Over Reverse Fly (Dumbbell)', muscle_group = 'Shoulders', equipment = 'dumbbell', category = 'strength', instructions = 'Hinge forward with a flat back holding the dumbbells under your chest, palms facing.
Raise your arms out to the sides until they are level with your body.
Lower slowly.', cues = array['Soft bend in the elbows.', 'Lead with your pinkies.', 'Do not squeeze your shoulder blades hard, let the rear shoulders work.']::text[] where id = 'd5f03299-953a-471a-b2f7-1e16c2850ecf' and is_global;
update exercises set name = 'Reverse Fly (Cable)', muscle_group = 'Shoulders', equipment = 'cable', category = 'strength', instructions = 'Set both pulleys at shoulder height and cross the cables, holding the opposite handle in each hand.
Pull your arms out and back until they line up with your shoulders.
Return slowly.', cues = array['Arms stay nearly straight.', 'Pull wide, not back.', 'Slow return.']::text[] where id = 'db28097e-c3ba-4a3b-86d9-41a720d8cc3d' and is_global;
update exercises set name = 'Reverse Fly (Machine)', muscle_group = 'Shoulders', equipment = 'machine', category = 'strength', instructions = 'Sit facing the pad and grip the handles with your arms straight in front.
Sweep your arms back until they line up with your body.
Return slowly.', cues = array['Chest on the pad.', 'Arms stay at shoulder height.', 'Pause when your arms are open.']::text[] where id = 'f2099459-dde4-4c1d-8c24-c19b5f50d7b2' and is_global;
update exercises set name = 'Y Raise (Cable)', muscle_group = 'Shoulders', equipment = 'cable', category = 'accessory', instructions = 'Stand between two low pulleys holding the opposite handle in each hand.
Raise your arms up and out into a Y shape above your head.
Lower slowly.', cues = array['Thumbs point up.', 'Ribs down.', 'Light weight.']::text[] where id = 'f9852915-08dd-498b-8347-3e62a1e6e985' and is_global;
update exercises set name = 'Prone Y Raise', muscle_group = 'Shoulders', equipment = 'bodyweight', category = 'accessory', instructions = 'Lie face down on an incline bench with your arms hanging down.
Raise your arms up and forward into a Y shape, thumbs up.
Lower slowly.', cues = array['Shoulders down away from your ears.', 'Use no weight or very light plates.', 'Pause at the top.']::text[] where id = '0cef43eb-3394-42b2-aff5-cdd0696aaf56' and is_global;
update exercises set name = 'Bicep Curl (Barbell)', muscle_group = 'Biceps', equipment = 'barbell', category = 'strength', instructions = 'Stand holding the bar with an underhand grip, hands shoulder width apart.
Curl the bar up towards your shoulders, keeping your elbows by your sides.
Lower slowly until your arms are straight.', cues = array['Elbows stay pinned to your sides.', 'No swinging your hips.', 'Full stretch at the bottom.']::text[] where id = '8724af43-0aca-478b-945a-38c71c745cad' and is_global;
update exercises set name = 'Bicep Curl (EZ Bar)', muscle_group = 'Biceps', equipment = 'barbell', category = 'strength', instructions = 'Stand holding the angled grips of an EZ bar with your palms facing up.
Curl the bar towards your shoulders.
Lower slowly to straight arms.', cues = array['Easier on the wrists than a straight bar.', 'Elbows stay still.', 'Squeeze at the top.']::text[] where id = '85f3cce1-2071-4004-a8be-3f7b5a53aacb' and is_global;
update exercises set name = 'Bicep Curl (Dumbbell)', muscle_group = 'Biceps', equipment = 'dumbbell', category = 'strength', instructions = 'Stand holding a dumbbell in each hand, palms facing forward.
Curl both dumbbells up towards your shoulders.
Lower slowly until your arms are straight.', cues = array['Turn your pinky up slightly at the top.', 'Elbows stay by your sides.', 'Lower for two to three seconds.']::text[] where id = 'b2f788b6-e4a4-4402-90d0-83ebd8050df9' and is_global;
update exercises set name = 'Alternating Bicep Curl (Dumbbell)', muscle_group = 'Biceps', equipment = 'dumbbell', category = 'strength', instructions = 'Stand holding a dumbbell in each hand at your sides.
Curl one dumbbell up, then lower it as you curl the other.
Keep alternating for the set.', cues = array['Count each arm as one rep.', 'Body stays still.', 'Full range each side.']::text[] where id = 'b0824938-1505-4187-992a-ce9bf154e724' and is_global;
update exercises set name = 'Seated Bicep Curl (Dumbbell)', muscle_group = 'Biceps', equipment = 'dumbbell', category = 'strength', instructions = 'Sit on the end of a bench with a dumbbell in each hand.
Curl the dumbbells up towards your shoulders.
Lower slowly to straight arms.', cues = array['Sitting stops you swinging.', 'Back tall.', 'Squeeze at the top.']::text[] where id = '5e5165c5-9965-40cf-b0ea-14a4bd15ca44' and is_global;
update exercises set name = 'Incline Curl (Dumbbell)', muscle_group = 'Biceps', equipment = 'dumbbell', category = 'strength', instructions = 'Sit back on a bench set to about 45 degrees with your arms hanging straight down.
Curl the dumbbells up without moving your upper arms forward.
Lower slowly to a full stretch.', cues = array['Let your arms hang behind your body.', 'Elbows stay pointing at the floor.', 'Big stretch at the bottom.']::text[] where id = '6e196516-9742-4bbc-92a1-424ca508a28a' and is_global;
update exercises set name = 'Spider Curl (Dumbbell)', muscle_group = 'Biceps', equipment = 'dumbbell', category = 'strength', instructions = 'Lie chest down on an incline bench with your arms hanging straight down.
Curl the dumbbells up, keeping your upper arms vertical.
Lower slowly.', cues = array['Upper arms do not swing forward.', 'Squeeze hard at the top.', 'Light weight, strict reps.']::text[] where id = '2c8b7f63-f597-41b2-a43e-f750b8e0c277' and is_global;
update exercises set name = 'Concentration Curl (Dumbbell)', muscle_group = 'Biceps', equipment = 'dumbbell', category = 'strength', instructions = 'Sit on a bench, lean forward and rest the back of your upper arm against your inner thigh.
Curl the dumbbell towards your shoulder.
Lower slowly, then switch arms.', cues = array['Arm stays fixed against your thigh.', 'Turn your pinky up at the top.', 'Slow on the way down.']::text[] where id = '511ae802-2e6e-4fe9-8fd6-e6e09a43d01e' and is_global;
update exercises set name = 'Concentration Curl (Cable)', muscle_group = 'Biceps', equipment = 'cable', category = 'strength', instructions = 'Sit or kneel by a low pulley and rest your upper arm against your thigh, holding the handle.
Curl the handle towards your shoulder.
Lower slowly, then switch arms.', cues = array['Keep your upper arm still.', 'Tension stays on at the bottom.', 'Squeeze at the top.']::text[] where id = 'f2b67c83-4c44-46d0-b32c-dda3ec4eac26' and is_global;
update exercises set name = 'Drag Curl (Barbell)', muscle_group = 'Biceps', equipment = 'barbell', category = 'strength', instructions = 'Stand holding the bar against your thighs.
Curl it up by pulling your elbows back so the bar drags up your body.
Lower the same way.', cues = array['The bar stays touching your body.', 'Elbows travel behind you.', 'Use less weight than a normal curl.']::text[] where id = 'c92d00c4-c159-48da-9efa-4c0c973c798e' and is_global;
update exercises set name = '21s (Barbell)', muscle_group = 'Biceps', equipment = 'barbell', category = 'strength', instructions = 'Do 7 curls from straight arms to halfway up.
Do 7 curls from halfway up to the top.
Finish with 7 full curls without resting.', cues = array['Use a lighter bar than usual.', 'All 21 reps without stopping.', 'Keep your elbows still.']::text[] where id = '38b14568-9ae4-4ada-a15c-b62d6877ce41' and is_global;
update exercises set name = 'Zottman Curl (Dumbbell)', muscle_group = 'Biceps', equipment = 'dumbbell', category = 'strength', instructions = 'Curl the dumbbells up with your palms facing up.
At the top, turn your palms to face down.
Lower slowly with palms down, then turn them back up at the bottom.', cues = array['Slow on the palms down lowering.', 'Works biceps and forearms.', 'Elbows stay by your sides.']::text[] where id = 'f0f67a8f-295d-4c05-b5fc-42fa74a7c719' and is_global;
update exercises set name = 'Hammer Curl (Dumbbell)', muscle_group = 'Biceps', equipment = 'dumbbell', category = 'strength', instructions = 'Stand holding the dumbbells at your sides with palms facing each other.
Curl them up towards your shoulders, palms still facing in.
Lower slowly.', cues = array['Thumbs point up the whole time.', 'Elbows stay by your sides.', 'No swinging.']::text[] where id = 'c6400676-287b-4575-8bae-183af63d4554' and is_global;
update exercises set name = 'Alternating Hammer Curl (Dumbbell)', muscle_group = 'Biceps', equipment = 'dumbbell', category = 'strength', instructions = 'Stand with dumbbells at your sides, palms facing in.
Curl one side up with thumbs up, lower it, then curl the other.
Keep alternating.', cues = array['Count each arm as one rep.', 'Body stays still.', 'Full range both sides.']::text[] where id = '6026398e-06f7-4ce9-bd8e-40d1a85b80a5' and is_global;
update exercises set name = 'Cross Body Hammer Curl (Dumbbell)', muscle_group = 'Biceps', equipment = 'dumbbell', category = 'strength', instructions = 'Stand with dumbbells at your sides, palms facing in.
Curl one dumbbell up and across your body towards the opposite shoulder.
Lower slowly and switch sides.', cues = array['Thumb leads across your chest.', 'Elbow stays close to your body.', 'Slow on the way down.']::text[] where id = '0279d501-2e65-43dd-9566-0d4128ac5118' and is_global;
update exercises set name = 'Hammer Curl (Cable)', muscle_group = 'Biceps', equipment = 'cable', category = 'strength', instructions = 'Stand facing a low pulley holding a rope with palms facing each other.
Curl the rope up towards your shoulders.
Lower slowly.', cues = array['Elbows pinned to your sides.', 'Constant tension.', 'Squeeze at the top.']::text[] where id = '72c6eeff-0db4-4098-b430-0f44e35fd544' and is_global;
update exercises set name = 'Bicep Curl (Cable)', muscle_group = 'Biceps', equipment = 'cable', category = 'strength', instructions = 'Stand facing a low pulley holding a straight bar with an underhand grip.
Curl the bar towards your shoulders.
Lower slowly to straight arms.', cues = array['Elbows stay still.', 'Tension stays on at the bottom.', 'Stand tall.']::text[] where id = 'dd347a13-614f-4c81-abae-10b35b84b5cb' and is_global;
update exercises set name = 'Bicep Curl (Cable and Band)', muscle_group = 'Biceps', equipment = 'cable', category = 'accessory', instructions = 'Attach a band to the cable handle or bar so both add resistance.
Curl up towards your shoulders, fighting the band as it stretches.
Lower slowly.', cues = array['The top is the hardest part, squeeze it.', 'Elbows stay by your sides.', 'Control the way down.']::text[] where id = '226fec88-2a83-40d6-b0d5-519af531c8d8' and is_global;
update exercises set name = 'Single Arm Curl (Cable)', muscle_group = 'Biceps', equipment = 'cable', category = 'strength', instructions = 'Stand side on or facing a low pulley holding one handle.
Curl the handle towards your shoulder.
Lower slowly, then switch arms.', cues = array['Turn your pinky up at the top.', 'Upper arm stays still.', 'Same reps both sides.']::text[] where id = '3d64aa46-58ea-4e6f-8232-d0d11fb20b94' and is_global;
update exercises set name = 'Overhead Curl (Cable)', muscle_group = 'Biceps', equipment = 'cable', category = 'strength', instructions = 'Stand between two high pulleys holding a handle in each hand, arms out at shoulder height.
Curl your hands towards your ears.
Straighten your arms slowly.', cues = array['Upper arms stay level.', 'Squeeze like a double biceps pose.', 'Light weight.']::text[] where id = 'ffb37c76-dad7-4ade-bf7a-cb1544e94910' and is_global;
update exercises set name = 'Bayesian Curl (Cable)', muscle_group = 'Biceps', equipment = 'cable', category = 'strength', instructions = 'Stand facing away from a low pulley holding the handle with your arm stretched behind you.
Curl the handle forward and up, keeping your elbow behind your body.
Lower slowly back into the stretch.', cues = array['Take a small step forward for tension.', 'Elbow stays back.', 'Feel the stretch at the bottom.']::text[] where id = '7c1ff01f-b6d2-4099-9738-061b6b3ceb1a' and is_global;
update exercises set name = 'Bicep Curl (Band)', muscle_group = 'Biceps', equipment = 'band', category = 'accessory', instructions = 'Stand on the middle of a band holding an end in each hand.
Curl your hands up towards your shoulders.
Lower slowly.', cues = array['Shorten the band to make it harder.', 'Elbows stay by your sides.', 'Squeeze at the top.']::text[] where id = '7a7d954b-f2d0-4e76-8ce3-4f1665080b16' and is_global;
update exercises set name = 'Bicep Curl (Machine)', muscle_group = 'Biceps', equipment = 'machine', category = 'strength', instructions = 'Set the seat so your upper arms rest on the pad and your elbows line up with the machine''s pivot.
Curl the handles up.
Lower slowly to straight arms.', cues = array['Elbows line up with the pivot.', 'Full range.', 'Slow lowering.']::text[] where id = '6254b4dc-183a-41a3-845d-8345b0959e6c' and is_global;
update exercises set name = 'Bicep Curl (TRX)', muscle_group = 'Biceps', equipment = 'trx', category = 'accessory', instructions = 'Face the anchor holding the handles with palms up and lean back with straight arms.
Curl your hands towards your forehead, pulling your body up.
Lower slowly back to straight arms.', cues = array['Elbows stay at shoulder height.', 'Body stays straight.', 'Walk your feet forward to make it harder.']::text[] where id = '615e6070-6f61-4cce-805e-86adab02dd6c' and is_global;
update exercises set name = 'Preacher Curl (Barbell)', muscle_group = 'Biceps', equipment = 'barbell', category = 'strength', instructions = 'Sit at a preacher bench with the backs of your upper arms on the pad and hold the bar underhand.
Curl the bar up towards your shoulders.
Lower slowly until your arms are almost straight.', cues = array['Armpits snug against the pad.', 'Do not drop the bar at the bottom.', 'Squeeze at the top.']::text[] where id = '0e62a26e-9588-4f9d-a171-b873081b8ee7' and is_global;
update exercises set name = 'Preacher Curl (EZ Bar)', muscle_group = 'Biceps', equipment = 'barbell', category = 'strength', instructions = 'Sit at a preacher bench holding an EZ bar on the angled grips.
Curl it towards your shoulders.
Lower slowly until your arms are almost straight.', cues = array['Upper arms flat on the pad.', 'Slow at the bottom.', 'No bouncing.']::text[] where id = 'b24841d2-0501-4cbb-88f5-56855b064bc9' and is_global;
update exercises set name = 'Preacher Curl (Dumbbell)', muscle_group = 'Biceps', equipment = 'dumbbell', category = 'strength', instructions = 'Rest the back of one upper arm on a preacher pad holding a dumbbell.
Curl it towards your shoulder.
Lower slowly, then switch arms.', cues = array['Arm stays flat on the pad.', 'Control the stretch.', 'Turn your pinky up at the top.']::text[] where id = '06095e99-3137-4202-9c8f-f70b20eb86fc' and is_global;
update exercises set name = 'Preacher Curl (Machine)', muscle_group = 'Biceps', equipment = 'machine', category = 'accessory', instructions = 'Sit with your upper arms on the pad and grip the handles.
Curl the handles up.
Lower slowly.', cues = array['Elbows line up with the pivot.', 'Slow lowering.', 'Full squeeze at the top.']::text[] where id = 'f4e647d1-1ac1-4442-b9d8-f57c80661557' and is_global;
update exercises set name = 'Reverse Curl (Barbell)', muscle_group = 'Biceps', equipment = 'barbell', category = 'strength', instructions = 'Stand holding the bar with an overhand grip, hands shoulder width.
Curl the bar up towards your shoulders, knuckles leading.
Lower slowly.', cues = array['Wrists stay straight.', 'Elbows by your sides.', 'Light weight, works your forearms.']::text[] where id = 'd8996d0b-20c4-474a-bb55-f23d47caf89f' and is_global;
update exercises set name = 'Reverse Curl (EZ Bar)', muscle_group = 'Biceps', equipment = 'barbell', category = 'strength', instructions = 'Stand holding an EZ bar overhand on the angled grips.
Curl it towards your shoulders.
Lower slowly.', cues = array['Easier on the wrists than a straight bar.', 'Knuckles lead.', 'No swinging.']::text[] where id = '8c89984c-1f57-4fff-906e-d22e46f597e1' and is_global;
update exercises set name = 'Reverse Curl (Dumbbell)', muscle_group = 'Biceps', equipment = 'dumbbell', category = 'accessory', instructions = 'Stand holding the dumbbells with palms facing back.
Curl them up with palms facing down.
Lower slowly.', cues = array['Wrists straight.', 'Elbows stay still.', 'Forearms do a lot of this.']::text[] where id = '2c43b2cd-2a6d-4cdf-8f7a-9492fe0f85b3' and is_global;
update exercises set name = 'Tricep Pushdown (Rope)', muscle_group = 'Triceps', equipment = 'cable', category = 'strength', instructions = 'Stand facing a high pulley holding a rope, elbows by your sides and bent to 90 degrees.
Push the rope down until your arms are straight, pulling the ends apart at the bottom.
Let it rise slowly back to the start.', cues = array['Elbows stay glued to your sides.', 'Split the rope at the bottom.', 'Do not let your shoulders roll forward.']::text[] where id = '1d692ec6-6258-403b-94f8-7dee306765d4' and is_global;
update exercises set name = 'Tricep Pushdown (Straight Bar)', muscle_group = 'Triceps', equipment = 'cable', category = 'strength', instructions = 'Stand facing a high pulley holding a straight bar overhand.
Push the bar down until your arms are straight.
Let it rise slowly to about chest height.', cues = array['Elbows pinned to your sides.', 'Lean forward just a little.', 'Squeeze at the bottom.']::text[] where id = 'a2931f8c-6702-44ff-9edf-e7ebdd5c6ffb' and is_global;
update exercises set name = 'Reverse Grip Tricep Pushdown (Cable)', muscle_group = 'Triceps', equipment = 'cable', category = 'strength', instructions = 'Stand facing a high pulley holding a straight bar with an underhand grip.
Push the bar down until your arms are straight.
Return slowly.', cues = array['Lighter than an overhand pushdown.', 'Elbows stay still.', 'Wrists straight.']::text[] where id = 'ead886ef-9151-4172-af8f-586940a85313' and is_global;
update exercises set name = 'Single Arm Tricep Pushdown (Cable)', muscle_group = 'Triceps', equipment = 'cable', category = 'strength', instructions = 'Stand at a high pulley holding a single handle.
Push it down until your arm is straight.
Return slowly, then switch arms.', cues = array['Elbow by your side.', 'Body stays square.', 'Full lockout.']::text[] where id = 'e5ddc78c-7078-4fb5-9761-d3539f544ef2' and is_global;
update exercises set name = 'Tricep Pushdown (Band)', muscle_group = 'Triceps', equipment = 'band', category = 'accessory', instructions = 'Anchor a band high and hold an end in each hand with elbows bent by your sides.
Push your hands down until your arms are straight.
Return slowly.', cues = array['Elbows stay still.', 'Squeeze at the bottom.', 'Step back for more tension.']::text[] where id = '6214f69b-5c0d-47be-8e24-9f3123bfec05' and is_global;
update exercises set name = 'Overhead Tricep Extension (Dumbbell)', muscle_group = 'Triceps', equipment = 'dumbbell', category = 'strength', instructions = 'Stand or sit holding one dumbbell overhead with both hands under the top plate.
Lower it behind your head by bending your elbows.
Straighten your arms to press it back up.', cues = array['Elbows point forward, not out.', 'Big stretch at the bottom.', 'Ribs down, do not arch.']::text[] where id = '13d2bf9e-bb6e-4cda-a37b-0a283ab2122c' and is_global;
update exercises set name = 'Overhead Tricep Extension (Barbell)', muscle_group = 'Triceps', equipment = 'barbell', category = 'strength', instructions = 'Stand or sit holding a bar or EZ bar overhead with a narrow grip.
Lower it behind your head by bending your elbows.
Straighten your arms to press it back up.', cues = array['Elbows stay pointing up.', 'Keep your trunk braced.', 'Light and controlled.']::text[] where id = '5fc40cd5-d998-48da-aafd-b6c4637588de' and is_global;
update exercises set name = 'Overhead Tricep Extension (Cable)', muscle_group = 'Triceps', equipment = 'cable', category = 'strength', instructions = 'Face away from a pulley set at head height, holding a rope behind your head.
Step forward and straighten your arms out in front and up.
Let your hands come back behind your head slowly.', cues = array['Elbows stay high and still.', 'Stagger your stance.', 'Feel the stretch behind your head.']::text[] where id = 'bca8af09-1b89-4e52-abcb-2579714ea90f' and is_global;
update exercises set name = 'Single Arm Overhead Tricep Extension (Cable)', muscle_group = 'Triceps', equipment = 'cable', category = 'strength', instructions = 'Face away from a low pulley holding the handle behind your head.
Straighten your arm overhead.
Lower slowly, then switch arms.', cues = array['Elbow points up.', 'Keep your trunk still.', 'Full stretch each rep.']::text[] where id = 'c60d7621-8864-46a8-9d3e-cd95f3afd741' and is_global;
update exercises set name = 'Skull Crusher (Barbell)', muscle_group = 'Triceps', equipment = 'barbell', category = 'strength', instructions = 'Lie on a flat bench holding the bar over your chest with straight arms.
Bend your elbows to lower the bar towards your forehead.
Straighten your arms to press it back up.', cues = array['Upper arms stay still.', 'Lower to just behind your head for more stretch.', 'Control it, it is near your face.']::text[] where id = 'a18f21c7-7b29-4ae8-b1e3-0daa748dbb70' and is_global;
update exercises set name = 'Skull Crusher (EZ Bar)', muscle_group = 'Triceps', equipment = 'barbell', category = 'strength', instructions = 'Lie on a flat bench holding an EZ bar on the angled grips over your chest.
Bend your elbows to lower the bar towards your forehead.
Press it back up.', cues = array['Easier on the wrists.', 'Elbows point to the ceiling.', 'Slow on the way down.']::text[] where id = '6c1e0e3c-c893-492f-94e8-84fd711cbe2f' and is_global;
update exercises set name = 'Skull Crusher (Dumbbell)', muscle_group = 'Triceps', equipment = 'dumbbell', category = 'strength', instructions = 'Lie on a flat bench holding the dumbbells over your chest, palms facing in.
Bend your elbows to lower them beside your head.
Straighten your arms to press back up.', cues = array['Upper arms stay still.', 'Palms face each other.', 'Control every rep.']::text[] where id = '9d3d0dc3-afec-4c96-b70a-e01ce846faa8' and is_global;
update exercises set name = 'JM Press (Barbell)', muscle_group = 'Triceps', equipment = 'barbell', category = 'strength', instructions = 'Lie on a bench holding the bar with a close grip over your chest.
Lower the bar towards your chin by letting your elbows bend and travel forward.
Press back up to straight arms.', cues = array['A mix of a close grip press and a skull crusher.', 'Start light to learn the path.', 'Elbows stay tucked.']::text[] where id = '4aeff6aa-0fc4-4520-ae84-fc518946d37f' and is_global;
update exercises set name = 'Tate Press (Dumbbell)', muscle_group = 'Triceps', equipment = 'dumbbell', category = 'strength', instructions = 'Lie on a bench holding the dumbbells over your chest with palms facing your feet.
Bend your elbows out to the sides to lower the dumbbells to your chest.
Press back up to straight arms.', cues = array['Elbows point out to the sides.', 'The dumbbells touch your chest.', 'Light weight.']::text[] where id = 'b5c106b8-f9ad-4d29-969b-c7980ef1c228' and is_global;
update exercises set name = 'California Press (Barbell)', muscle_group = 'Triceps', equipment = 'barbell', category = 'strength', instructions = 'Lie on a bench with a close grip on the bar.
Lower the bar towards your lower chest, letting your elbows flare a little as it gets close.
Press back up.', cues = array['Halfway between a close grip press and a skull crusher.', 'Smooth bar path.', 'Light to start.']::text[] where id = 'f1444516-f782-4129-a428-869866c0162b' and is_global;
update exercises set name = 'Tricep Kickback (Dumbbell)', muscle_group = 'Triceps', equipment = 'dumbbell', category = 'strength', instructions = 'Hinge forward with a flat back, upper arm along your side and elbow bent.
Straighten your arm back until it is in line with your body.
Return slowly.', cues = array['Upper arm stays still and high.', 'Squeeze at full lockout.', 'Light weight.']::text[] where id = '7b5250e8-277c-4923-a0ab-0a453ec1bf9a' and is_global;
update exercises set name = 'Tricep Kickback (Cable)', muscle_group = 'Triceps', equipment = 'cable', category = 'strength', instructions = 'Hinge forward facing a low pulley, holding the handle with your elbow by your side.
Straighten your arm back until it is in line with your body.
Return slowly, then switch arms.', cues = array['Elbow stays fixed.', 'Constant tension.', 'Pause at the end.']::text[] where id = '1801b27e-1862-4eae-bd74-f7145be6c524' and is_global;
update exercises set name = 'Tricep Extension (TRX)', muscle_group = 'Triceps', equipment = 'trx', category = 'accessory', instructions = 'Face away from the anchor holding the handles above your head, leaning forward.
Bend your elbows to lower your head between your hands.
Straighten your arms to push back up.', cues = array['Body stays straight.', 'Elbows stay narrow.', 'Walk your feet back to make it harder.']::text[] where id = '4b331043-33d3-4d2f-9157-5d34f5396356' and is_global;
update exercises set name = 'Tricep Dip (Parallel Bars)', muscle_group = 'Triceps', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Support yourself on parallel bars with straight arms and your body upright.
Lower until your elbows are bent to about 90 degrees.
Press back up to straight arms.', cues = array['Stay upright to work the triceps.', 'Elbows travel back.', 'Use an assisted machine or band if needed.']::text[] where id = 'b34f10ea-6b24-44dd-9765-2922bdbef68f' and is_global;
update exercises set name = 'Tricep Dip (Machine)', muscle_group = 'Triceps', equipment = 'machine', category = 'strength', instructions = 'Sit in the machine and grip the handles at your sides.
Press down until your arms are straight.
Return slowly.', cues = array['Shoulders down.', 'Elbows travel straight back.', 'Full lockout.']::text[] where id = '610b6a66-df5a-477b-9cce-468f6d764425' and is_global;
update exercises set name = 'Bench Dip', muscle_group = 'Triceps', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Sit on the edge of a bench, hands beside your hips, and slide off with legs out in front.
Lower your body by bending your elbows to about 90 degrees.
Press back up.', cues = array['Keep your back close to the bench.', 'Bend your knees to make it easier.', 'Do not go too deep.']::text[] where id = '07015d0e-6144-4865-8b18-b4326e9c3815' and is_global;
update exercises set name = 'Back Squat (Barbell)', muscle_group = 'Legs', equipment = 'barbell', category = 'strength', instructions = 'Set the bar on your upper back, feet about shoulder width and toes slightly out.
Brace, then sit down and back until your hips are at least level with your knees.
Drive up through your whole foot to stand tall.', cues = array['Big breath in and brace before each rep.', 'Knees travel out over your toes.', 'Chest up, push the floor away.']::text[] where id = 'fc69fa1b-5854-4ac5-8762-4680147ba03b' and is_global;
update exercises set name = 'Pause Back Squat (Barbell)', muscle_group = 'Legs', equipment = 'barbell', category = 'strength', instructions = 'Squat down exactly like a back squat.
Hold the bottom position for two to three seconds without relaxing.
Drive up to stand.', cues = array['Stay tight in the pause.', 'Count the pause out loud in your head.', 'Use less weight than your normal squat.']::text[] where id = 'f1a49f80-1329-4ab7-8895-7ff4ea3cb912' and is_global;
update exercises set name = 'Front Squat (Barbell)', muscle_group = 'Legs', equipment = 'barbell', category = 'strength', instructions = 'Rest the bar on the front of your shoulders with your elbows high.
Squat down keeping your chest tall until your hips are below your knees.
Stand back up, leading with your elbows.', cues = array['Elbows up the whole time.', 'Sit straight down between your heels.', 'Fingertips on the bar is fine.']::text[] where id = 'e3f6155d-75cd-4b9c-93c7-185af9d60fd7' and is_global;
update exercises set name = 'Squat (Smith Machine)', muscle_group = 'Legs', equipment = 'machine', category = 'strength', instructions = 'Set the bar on your upper back with your feet slightly in front of the bar.
Unhook and squat down until your hips are level with your knees.
Drive up to stand and re-hook at the end.', cues = array['Feet a little forward.', 'Knees follow your toes.', 'Control the bottom.']::text[] where id = '1ae30972-92d7-444c-8315-ca1b76eecbb5' and is_global;
update exercises set name = 'Goblet Squat (Dumbbell)', muscle_group = 'Legs', equipment = 'dumbbell', category = 'strength', instructions = 'Hold one dumbbell or kettlebell against your chest with both hands.
Squat down between your heels, elbows travelling inside your knees.
Stand back up tall.', cues = array['Weight stays touching your chest.', 'Sit down, not back.', 'Great for learning to squat.']::text[] where id = '5214f87e-c4fe-44dc-a458-29653d76f025' and is_global;
update exercises set name = 'Squat (Dumbbell)', muscle_group = 'Legs', equipment = 'dumbbell', category = 'strength', instructions = 'Stand holding a dumbbell at each side.
Squat down until your hips are level with your knees.
Stand back up through your whole foot.', cues = array['Arms hang straight.', 'Chest up.', 'Knees out over toes.']::text[] where id = 'ab62b9c6-513a-4c75-9971-9956e7a0d3b8' and is_global;
update exercises set name = 'Squat (Bodyweight)', muscle_group = 'Legs', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Stand with feet about shoulder width apart.
Sit down and back as low as you comfortably can, arms reaching forward.
Stand back up.', cues = array['Heels stay down.', 'Chest stays up.', 'Squat to a box or bench to start.']::text[] where id = '43837f3d-08b6-4d14-9c95-90c6ac449f49' and is_global;
update exercises set name = 'Squat (Band)', muscle_group = 'Legs', equipment = 'band', category = 'accessory', instructions = 'Stand on a band and loop the other end behind your neck or hold it at your shoulders.
Squat down until your hips are level with your knees.
Stand up against the band.', cues = array['Band gets harder near the top, drive through it.', 'Knees out.', 'Stand all the way up.']::text[] where id = 'db5e8e25-dd61-43a2-abd0-5bc2128aec00' and is_global;
update exercises set name = 'Sumo Squat (Dumbbell)', muscle_group = 'Legs', equipment = 'dumbbell', category = 'strength', instructions = 'Stand with feet wide and toes turned out, holding one dumbbell between your legs.
Squat straight down, pushing your knees out.
Stand back up, squeezing your glutes.', cues = array['Knees follow your toes.', 'Chest tall.', 'The weight hangs straight down.']::text[] where id = 'b1139639-f825-4a3c-a7cb-ea8d3221eab8' and is_global;
update exercises set name = 'Overhead Squat (Barbell)', muscle_group = 'Legs', equipment = 'barbell', category = 'strength', instructions = 'Hold the bar overhead with a wide grip and locked arms.
Squat down while keeping the bar over the middle of your feet.
Stand back up.', cues = array['Push the bar up hard the whole time.', 'Start with a broomstick or empty bar.', 'Chest up.']::text[] where id = '5c845402-3998-486e-92a7-e3af9fe29528' and is_global;
update exercises set name = 'Zercher Squat (Barbell)', muscle_group = 'Legs', equipment = 'barbell', category = 'strength', instructions = 'Hold the bar in the crook of your elbows, hands together.
Squat down keeping your chest tall.
Stand back up.', cues = array['Use a pad or towel on your arms.', 'Elbows stay up.', 'Brace hard.']::text[] where id = '16d23e50-f585-4bca-8433-f2652b3d45cf' and is_global;
update exercises set name = 'Front Rack Squat (Kettlebell)', muscle_group = 'Legs', equipment = 'kettlebell', category = 'strength', instructions = 'Hold one or two kettlebells in the rack position against your chest.
Squat down until your hips are below your knees.
Stand back up.', cues = array['Elbows tucked in.', 'Wrists straight.', 'Chest tall.']::text[] where id = '1ac05a3f-4077-48e5-84f6-f94462259561' and is_global;
update exercises set name = 'Cyclist Squat (Dumbbell)', muscle_group = 'Legs', equipment = 'dumbbell', category = 'strength', instructions = 'Stand with your heels raised on a wedge or plate, feet close together, holding the dumbbells.
Squat straight down letting your knees travel well forward.
Stand back up.', cues = array['Torso stays upright.', 'Knees go forward over your toes.', 'Great for quads.']::text[] where id = 'e85c46b5-6554-44e7-adea-680014c7879c' and is_global;
update exercises set name = 'Spanish Squat (Band)', muscle_group = 'Legs', equipment = 'band', category = 'strength', instructions = 'Loop a heavy band around a rack and behind your knees, then step back until it is tight.
Sit back and down with your shins vertical.
Stand back up.', cues = array['Shins stay upright.', 'Lean back into the band.', 'Kind on sore knees.']::text[] where id = '1e4efe01-5e88-4501-b28d-26417ce0c266' and is_global;
update exercises set name = 'Sissy Squat', muscle_group = 'Legs', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Stand holding something for balance and rise onto your toes.
Bend your knees forward and lean back, keeping a straight line from knees to head.
Return to standing.', cues = array['Hips stay forward.', 'Small range first.', 'Slow and controlled.']::text[] where id = 'b3be702e-d5bf-4878-a093-a5f283378a2e' and is_global;
update exercises set name = 'Jump Squat', muscle_group = 'Legs', equipment = 'bodyweight', category = 'power', instructions = 'Stand with feet shoulder width apart.
Squat down a little, then jump as high as you can.
Land softly and go straight into the next rep.', cues = array['Land quietly on soft knees.', 'Arms help you jump.', 'Quality over speed.']::text[] where id = '29b9e118-c41e-4b84-835f-f133cc795588' and is_global;
update exercises set name = 'Wall Sit', muscle_group = 'Legs', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Lean your back against a wall and slide down until your knees are at 90 degrees.
Hold with your feet flat and knees over your ankles.
Stand back up when the time is done.', cues = array['Back flat on the wall.', 'Thighs level with the floor.', 'Breathe steadily.']::text[] where id = '5ab85839-7ff7-4333-b06c-7512639fffaa' and is_global;
update exercises set name = 'Belt Squat (Machine)', muscle_group = 'Legs', equipment = 'machine', category = 'strength', instructions = 'Attach the belt around your hips and stand on the platform.
Squat down until your hips are level with your knees.
Stand back up.', cues = array['Torso stays upright.', 'No load on your back.', 'Knees out.']::text[] where id = 'a2e573da-2fe6-4949-b4ad-58e05b92910c' and is_global;
update exercises set name = 'Hack Squat (Machine)', muscle_group = 'Legs', equipment = 'machine', category = 'strength', instructions = 'Stand on the platform with your back and shoulders against the pads.
Release the safeties and squat down until your knees are past 90 degrees.
Drive back up without locking your knees hard.', cues = array['Feet lower on the plate for more quads.', 'Back stays on the pad.', 'Control the bottom.']::text[] where id = 'f1d0f9a7-f9b1-4ea2-856c-66e8940c6d56' and is_global;
update exercises set name = 'Hack Squat (Barbell)', muscle_group = 'Legs', equipment = 'barbell', category = 'strength', instructions = 'Stand with the bar on the floor behind your heels and grip it.
Stand up with the bar behind your legs.
Squat back down to touch the bar to the floor.', cues = array['Chest up.', 'Bar stays close to your legs.', 'Light to start.']::text[] where id = 'c8a92995-e104-40be-852c-1f73b61d88b5' and is_global;
update exercises set name = 'Pendulum Squat (Machine)', muscle_group = 'Legs', equipment = 'machine', category = 'strength', instructions = 'Stand on the platform with your back on the pad and shoulders under the pads.
Squat down as deep as you can control.
Drive back up.', cues = array['Full depth.', 'Back on the pad.', 'Smooth reps.']::text[] where id = '060b5fb8-dda2-477e-95da-3f547622f2a4' and is_global;
update exercises set name = 'Leg Press', muscle_group = 'Legs', equipment = 'machine', category = 'strength', instructions = 'Sit with your back flat on the pad and feet shoulder width on the platform.
Release the safeties and lower the platform until your knees are at about 90 degrees.
Press back up without locking your knees.', cues = array['Lower back stays on the pad.', 'Knees follow your toes.', 'Do not lock out hard.']::text[] where id = '6f609c0a-4cb8-419d-9727-7d0b814b09cc' and is_global;
update exercises set name = 'Leg Press (Narrow Stance)', muscle_group = 'Legs', equipment = 'machine', category = 'strength', instructions = 'Set your feet close together in the middle of the platform.
Lower until your knees are bent to about 90 degrees.
Press back up.', cues = array['More quads.', 'Hips stay down.', 'Smooth tempo.']::text[] where id = '4f0686b1-5c5a-4060-8992-7f8edad976b3' and is_global;
update exercises set name = 'Leg Press (Wide Stance)', muscle_group = 'Legs', equipment = 'machine', category = 'strength', instructions = 'Set your feet wide and high on the platform, toes turned out.
Lower until your knees are bent to about 90 degrees.
Press back up.', cues = array['More glutes and inner thighs.', 'Knees push out.', 'Lower back on the pad.']::text[] where id = '8dd242fc-95a2-4e7a-ad25-a5d976f31a14' and is_global;
update exercises set name = 'Single Leg Leg Press', muscle_group = 'Legs', equipment = 'machine', category = 'strength', instructions = 'Put one foot in the middle of the platform.
Lower until your knee is bent to about 90 degrees.
Press back up, then switch legs.', cues = array['Use less weight than two legs.', 'Hips stay level.', 'Same reps each side.']::text[] where id = '1b073bb0-abdd-4a27-a18d-535a0305f39f' and is_global;
update exercises set name = 'Leg Extension (Machine)', muscle_group = 'Legs', equipment = 'machine', category = 'strength', instructions = 'Sit with the pad on the front of your lower shins and your knees lined up with the machine''s pivot.
Straighten your legs until your knees are locked.
Lower slowly.', cues = array['Squeeze your quads at the top.', 'Hold the handles and stay seated.', 'Slow on the way down.']::text[] where id = '25bdbb9b-d7de-44d5-beef-153e2b7c919b' and is_global;
update exercises set name = 'Single Leg Extension (Machine)', muscle_group = 'Legs', equipment = 'machine', category = 'accessory', instructions = 'Sit in the leg extension with one leg under the pad.
Straighten that leg.
Lower slowly, then switch legs.', cues = array['Pause at the top.', 'Same weight both sides.', 'No kicking.']::text[] where id = 'b0cc736d-7124-4c2e-b332-bcf441176618' and is_global;
update exercises set name = 'Lying Leg Curl (Machine)', muscle_group = 'Legs', equipment = 'machine', category = 'strength', instructions = 'Lie face down with the pad just above your heels.
Curl your heels towards your glutes.
Lower slowly.', cues = array['Hips stay pressed into the pad.', 'Squeeze at the top.', 'Slow lowering.']::text[] where id = '4f8e23d0-74dd-4613-9bde-076f27854a38' and is_global;
update exercises set name = 'Seated Leg Curl (Machine)', muscle_group = 'Legs', equipment = 'machine', category = 'strength', instructions = 'Sit with the pad behind your lower calves and the thigh pad snug on your legs.
Pull your heels down and back under the seat.
Return slowly.', cues = array['Sit tall against the back pad.', 'Squeeze at the bottom.', 'Control the way back up.']::text[] where id = '64931300-0287-4ae6-b8eb-405b1a36fb69' and is_global;
update exercises set name = 'Nordic Curl', muscle_group = 'Legs', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Kneel with your ankles held down by a partner or pad.
Lower your body forward as slowly as you can, keeping a straight line from knees to head.
Catch yourself with your hands and push back up.', cues = array['Lower as slowly as you can.', 'Hips stay straight.', 'Use a band to help at first.']::text[] where id = '1e9d134d-ff1c-4623-8928-2192a06934d2' and is_global;
update exercises set name = 'Glute Ham Raise', muscle_group = 'Legs', equipment = 'machine', category = 'strength', instructions = 'Set up on the machine with your feet locked in and knees just behind the pad.
Lower your body until it is level with the floor.
Curl yourself back up using your hamstrings.', cues = array['Hips stay straight.', 'Pull with your heels.', 'Use your hands to help at first.']::text[] where id = 'ee10c74a-017e-48b5-9a25-d4594ebbacc4' and is_global;
update exercises set name = 'Hip Adduction (Machine)', muscle_group = 'Legs', equipment = 'machine', category = 'strength', instructions = 'Sit with the pads on the inside of your knees.
Squeeze your legs together.
Open them slowly.', cues = array['Sit tall.', 'Pause when the pads meet.', 'Slow on the way out.']::text[] where id = 'ef6fe1c8-0567-4c4f-a3e4-91672aad9340' and is_global;
update exercises set name = 'Reverse Lunge', muscle_group = 'Legs', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Stand tall, then step one foot back and lower until both knees are bent to about 90 degrees.
Push through your front foot to step back to standing.
Alternate legs or do all reps on one side.', cues = array['Front knee stays over the ankle.', 'Back knee lowers towards the floor.', 'Hold dumbbells to make it harder.']::text[] where id = '143d08dd-5bbc-4f35-a690-b450650d2476' and is_global;
update exercises set name = 'Walking Lunge', muscle_group = 'Legs', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Step forward and lower until both knees are bent to about 90 degrees.
Push through your front foot and bring your back foot through into the next step.
Keep walking for the set.', cues = array['Tall chest.', 'Long enough steps that your front knee stays behind your toes.', 'Hold dumbbells for more load.']::text[] where id = '985a901c-c50d-474b-8c7d-a8bbe5cc552b' and is_global;
update exercises set name = 'Stationary Lunge', muscle_group = 'Legs', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Stand in a split stance with one foot forward and one back.
Lower straight down until both knees are bent to about 90 degrees.
Stand back up without moving your feet, then switch legs after the set.', cues = array['Straight up and down.', 'Weight in the front heel.', 'Back knee gently towards the floor.']::text[] where id = 'f4875a14-41c9-4356-b6d9-95e8cc5cf7e6' and is_global;
update exercises set name = 'Lateral Lunge', muscle_group = 'Legs', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Stand with feet together, then take a big step out to one side.
Sit your hips back over the stepping leg, keeping the other leg straight.
Push back to the start and repeat or alternate.', cues = array['Toes point forward.', 'Chest up, hips back.', 'Heel stays down.']::text[] where id = '14d539ee-3f92-408a-bc98-f23dbf93f3e8' and is_global;
update exercises set name = 'Curtsy Lunge', muscle_group = 'Legs', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Stand tall, then step one foot behind and across the other.
Lower until your front knee is bent to about 90 degrees.
Return to standing and switch sides.', cues = array['Hips stay square.', 'Front knee tracks over toes.', 'Slow and controlled.']::text[] where id = 'a33c9b20-9548-43d1-91f7-3c73abc8af0e' and is_global;
update exercises set name = 'Bulgarian Split Squat', muscle_group = 'Legs', equipment = 'dumbbell', category = 'strength', instructions = 'Stand in front of a bench and rest the top of your back foot on it.
Lower straight down until your front thigh is about level with the floor.
Drive through your front foot to stand back up, then switch legs.', cues = array['Most of your weight on the front leg.', 'Lean slightly forward for more glutes.', 'Hold dumbbells when bodyweight gets easy.']::text[] where id = 'cf198b69-85c3-4b87-a0bb-c6a37975e12a' and is_global;
update exercises set name = 'Split Squat (Barbell)', muscle_group = 'Legs', equipment = 'barbell', category = 'strength', instructions = 'Set the bar on your upper back and stand in a long split stance.
Lower straight down until your back knee nearly touches the floor.
Stand back up, then switch legs after the set.', cues = array['Wide stance for balance.', 'Torso tall.', 'Front foot flat.']::text[] where id = '671c77d3-9106-4dac-9e2b-281a8b568d22' and is_global;
update exercises set name = 'Step Up', muscle_group = 'Legs', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Stand facing a box or bench and place one whole foot on top.
Drive through that foot to stand up on the box.
Step down slowly with the other leg and repeat.', cues = array['Push through the top foot, not the bottom one.', 'Box height about knee level.', 'Hold dumbbells to make it harder.']::text[] where id = '30bce4d7-172b-4714-9088-9f249b729cd6' and is_global;
update exercises set name = 'Step Up with Knee Drive', muscle_group = 'Glutes', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Step up onto a box with one foot.
As you stand up, drive the other knee up to hip height.
Step back down slowly and repeat.', cues = array['Stand tall at the top.', 'Control the step down.', 'Use your arms like running.']::text[] where id = 'ca28ad70-515c-4100-9f04-03acb25a065f' and is_global;
update exercises set name = 'Box Step Down', muscle_group = 'Legs', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Stand on a low box on one leg.
Slowly lower the other heel towards the floor by bending your standing knee.
Tap the heel down lightly and stand back up.', cues = array['Knee stays over your toes.', 'Slow on the way down.', 'Hips stay level.']::text[] where id = '150656e4-4814-4c63-91e8-d1bdf00c0bd6' and is_global;
update exercises set name = 'Poliquin Step Up', muscle_group = 'Legs', equipment = 'bodyweight', category = 'accessory', instructions = 'Stand on a low step with your heel raised on a small wedge.
Lower the other foot towards the floor, letting your knee travel forward.
Straighten back up.', cues = array['Small range.', 'Knee goes forward over the toes.', 'Great for the knees and quads.']::text[] where id = '43724a79-8c39-403a-a5ad-0867f89eff38' and is_global;
update exercises set name = 'Standing Calf Raise', muscle_group = 'Legs', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Stand with the balls of your feet on a step and heels hanging off.
Rise up onto your toes as high as you can.
Lower your heels below the step slowly.', cues = array['Pause at the top.', 'Full stretch at the bottom.', 'Hold a dumbbell to make it harder.']::text[] where id = '7934f543-19a5-4a14-b0a9-8dd5777a8d08' and is_global;
update exercises set name = 'Seated Calf Raise (Machine)', muscle_group = 'Legs', equipment = 'machine', category = 'strength', instructions = 'Sit with the pad on your lower thighs and the balls of your feet on the platform.
Lift your heels as high as you can.
Lower slowly into a full stretch.', cues = array['Works the lower calf.', 'Pause at the top.', 'Full range every rep.']::text[] where id = 'bfe2632d-b63b-48f4-8a11-8b33fff93b08' and is_global;
update exercises set name = 'Single Leg Calf Raise', muscle_group = 'Legs', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Stand on one foot on a step, holding something for balance.
Rise up onto your toes.
Lower slowly below the step, then switch legs.', cues = array['Full range.', 'Same reps each side.', 'Hold a dumbbell when it gets easy.']::text[] where id = 'd4f35d46-e4ef-4721-b747-57e775ab6ddc' and is_global;
update exercises set name = 'Calf Raise (Smith Machine)', muscle_group = 'Legs', equipment = 'machine', category = 'strength', instructions = 'Stand under the Smith bar with the balls of your feet on a plate or step.
Rise onto your toes.
Lower slowly.', cues = array['Stand tall.', 'Pause at the top.', 'Full stretch.']::text[] where id = '9038f8e6-fdde-4fb9-b8ad-d760da80ddb7' and is_global;
update exercises set name = 'Calf Raise (Band)', muscle_group = 'Legs', equipment = 'band', category = 'accessory', instructions = 'Sit with legs straight and loop a band around the balls of your feet.
Point your toes away against the band.
Return slowly.', cues = array['Slow and full range.', 'Shorten the band for more tension.', 'Good for warm ups.']::text[] where id = 'af287eb7-0254-4cb5-b794-674b87fddb29' and is_global;
update exercises set name = 'Leg Press Calf Raise', muscle_group = 'Legs', equipment = 'machine', category = 'strength', instructions = 'Sit in the leg press with only the balls of your feet on the bottom edge of the platform.
Push the platform away by pointing your toes.
Return slowly.', cues = array['Knees stay straight.', 'Keep the safeties close.', 'Full stretch.']::text[] where id = 'd2fd76e3-c576-4e47-a45c-eed5e4c603e7' and is_global;
update exercises set name = 'Hack Squat Calf Raise (Machine)', muscle_group = 'Legs', equipment = 'machine', category = 'strength', instructions = 'Stand in the hack squat facing the pads with the balls of your feet on the platform edge.
Rise onto your toes.
Lower slowly.', cues = array['Knees straight.', 'Pause at the top.', 'Full stretch.']::text[] where id = '4673cec4-c545-4ea6-a680-95340fe5de12' and is_global;
update exercises set name = 'Donkey Calf Raise', muscle_group = 'Legs', equipment = 'machine', category = 'strength', instructions = 'Lean forward with your hips under the pad or a partner, balls of your feet on a step.
Rise up onto your toes.
Lower slowly into a stretch.', cues = array['Hips stay over your feet.', 'Big stretch at the bottom.', 'Pause at the top.']::text[] where id = '30240637-f8d8-4f05-8143-05ae991701f5' and is_global;
update exercises set name = 'Calf Raise with Pause', muscle_group = 'Legs', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Stand on a step and rise onto your toes.
Hold the top for two seconds.
Lower slowly and pause at the bottom too.', cues = array['No bouncing.', 'Count the pauses.', 'Add a dumbbell when easy.']::text[] where id = '553ed0a1-54da-460b-8cc0-ac9eb0d83b01' and is_global;
update exercises set name = 'Eccentric Calf Raise', muscle_group = 'Legs', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Rise up onto your toes using both feet.
Shift onto one foot and lower slowly for three to five seconds.
Go back to both feet to rise again.', cues = array['Slow is the point.', 'Great for achilles health.', 'Alternate legs.']::text[] where id = '9fb22c20-4a66-4dd2-848a-968ff8571371' and is_global;
update exercises set name = 'Tibialis Raise', muscle_group = 'Legs', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Lean your back against a wall with your heels about a foot in front of you.
Lift your toes towards your shins as high as you can.
Lower slowly.', cues = array['Heels stay down.', 'Move further from the wall to make it harder.', 'Good for shins and knees.']::text[] where id = '4876e6ae-4d3a-4726-8cae-18a2d77e81c3' and is_global;
update exercises set name = 'Box Jump (Calf Focus)', muscle_group = 'Legs', equipment = 'bodyweight', category = 'power', instructions = 'Stand close to a low box.
Jump onto it using mainly your ankles, keeping your knees fairly straight.
Step down and repeat.', cues = array['Quick, springy jumps.', 'Land on the balls of your feet.', 'Low box only.']::text[] where id = '6235329a-fd15-4e69-9d9d-3b1e4aaa057a' and is_global;
update exercises set name = 'Farmers Walk on Toes', muscle_group = 'Legs', equipment = 'dumbbell', category = 'strength', instructions = 'Hold a dumbbell in each hand and rise onto your toes.
Walk forward staying on your toes.
Keep going for the distance or time.', cues = array['Stay high on your toes.', 'Short quick steps.', 'Tall posture.']::text[] where id = '6f166b86-56f0-4eab-b768-beac33a01cb0' and is_global;
update exercises set name = 'Deadlift (Barbell)', muscle_group = 'Legs', equipment = 'barbell', category = 'strength', instructions = 'Stand with the bar over the middle of your feet and grip it just outside your legs.
Drop your hips, flatten your back, brace, then push the floor away to stand up with the bar close to your legs.
Lower it by pushing your hips back, then bending your knees once it passes them.', cues = array['Bar stays touching your legs.', 'Chest up, back flat before you pull.', 'Finish by squeezing your glutes, not leaning back.']::text[] where id = '96b57614-ab21-4940-ba7b-68364e41d565' and is_global;
update exercises set name = 'Sumo Deadlift (Barbell)', muscle_group = 'Legs', equipment = 'barbell', category = 'strength', instructions = 'Stand with a wide stance, toes out, and grip the bar inside your knees.
Push your knees out, flatten your back and stand up with the bar.
Lower it back to the floor under control.', cues = array['Knees out over your toes.', 'Hips close to the bar.', 'Push the floor apart.']::text[] where id = '3658559d-5413-41f5-85d0-19db135bff1e' and is_global;
update exercises set name = 'Deadlift (Trap Bar)', muscle_group = 'Legs', equipment = 'trap_bar', category = 'strength', instructions = 'Stand in the middle of the trap bar and grip the handles.
Brace, flatten your back and stand up by pushing through your feet.
Lower the bar back down under control.', cues = array['Easier on the back than a straight bar.', 'Sit a little deeper than a normal deadlift.', 'Stand tall at the top.']::text[] where id = 'b6f8ba7e-ccda-4786-b25d-e7c0140ea083' and is_global;
update exercises set name = 'Romanian Deadlift (Barbell)', muscle_group = 'Glutes', equipment = 'barbell', category = 'strength', instructions = 'Stand holding the bar at your thighs with soft knees.
Push your hips back and slide the bar down your legs until you feel a stretch in your hamstrings.
Drive your hips forward to stand back up.', cues = array['Hips back, not down.', 'Bar stays close to your legs.', 'Stop when your back wants to round.']::text[] where id = 'a54227ad-380f-4f8b-b4b0-60ce169ddd8d' and is_global;
update exercises set name = 'Romanian Deadlift (Dumbbell)', muscle_group = 'Glutes', equipment = 'dumbbell', category = 'strength', instructions = 'Stand holding the dumbbells in front of your thighs with soft knees.
Push your hips back and lower the dumbbells down the front of your legs.
Squeeze your glutes to stand back up.', cues = array['Flat back.', 'Feel the stretch in your hamstrings.', 'Dumbbells stay close to your legs.']::text[] where id = '398e5eca-f767-43ed-beb9-c09ad19054e3' and is_global;
update exercises set name = 'Single Leg Romanian Deadlift', muscle_group = 'Glutes', equipment = 'dumbbell', category = 'strength', instructions = 'Stand on one leg holding a dumbbell in the opposite hand.
Hinge forward as your free leg reaches back, until your body is close to level with the floor.
Return to standing, then switch sides.', cues = array['Hips stay square to the floor.', 'Soft knee on the standing leg.', 'Hold something for balance at first.']::text[] where id = 'eade1767-ee0e-48ce-b3a5-ca5ea65f8f69' and is_global;
update exercises set name = 'Stiff Leg Deadlift (Barbell)', muscle_group = 'Legs', equipment = 'barbell', category = 'strength', instructions = 'Stand holding the bar with your knees nearly straight.
Hinge forward lowering the bar towards your feet.
Stand back up by driving your hips forward.', cues = array['Knees only slightly bent.', 'Flat back.', 'Light weight, big stretch.']::text[] where id = '71bef927-df79-40d6-b96b-f2786b666b0b' and is_global;
update exercises set name = 'Kettlebell Swing', muscle_group = 'Glutes', equipment = 'kettlebell', category = 'power', instructions = 'Stand with feet shoulder width and the kettlebell a step in front of you.
Hike it back between your legs, then snap your hips forward to swing it to chest height.
Let it fall back between your legs and go straight into the next swing.', cues = array['It is a hip snap, not a squat or an arm lift.', 'Arms stay relaxed.', 'Squeeze your glutes at the top.']::text[] where id = '33174b92-8eec-4fd6-84bd-92460b6108ae' and is_global;
update exercises set name = 'Cable Pull Through', muscle_group = 'Glutes', equipment = 'cable', category = 'strength', instructions = 'Face away from a low pulley holding a rope between your legs.
Hinge back letting the rope pull your hands through your legs.
Drive your hips forward to stand tall.', cues = array['Hips back, chest forward.', 'Squeeze your glutes at the top.', 'Arms just hold on.']::text[] where id = '5fbddfcd-0741-4910-ab02-9068015863fa' and is_global;
update exercises set name = 'Hip Thrust (Barbell)', muscle_group = 'Glutes', equipment = 'barbell', category = 'strength', instructions = 'Sit with your upper back against a bench and a padded bar over your hips.
Plant your feet so your shins will be vertical at the top, then drive your hips up.
Lower your hips slowly.', cues = array['Chin tucked, eyes forward.', 'Squeeze your glutes hard for a second at the top.', 'Ribs down, no arching.']::text[] where id = '6c9b0acc-2185-40f4-b823-0cc231546a9e' and is_global;
update exercises set name = 'Hip Thrust (Dumbbell)', muscle_group = 'Glutes', equipment = 'dumbbell', category = 'strength', instructions = 'Sit against a bench with a dumbbell held on your hips.
Drive your hips up until your body is straight from knees to shoulders.
Lower slowly.', cues = array['Push through your heels.', 'Pause at the top.', 'Keep your chin tucked.']::text[] where id = '271637ae-f5cb-4f53-8a45-8705a00a7ed3' and is_global;
update exercises set name = 'Hip Thrust (Smith Machine)', muscle_group = 'Glutes', equipment = 'machine', category = 'strength', instructions = 'Set a bench beside the Smith machine and sit with the bar over your hips.
Drive your hips up and unhook the bar.
Lower and raise your hips for the set, then re-hook.', cues = array['Pad on the bar.', 'Shins vertical at the top.', 'Squeeze and pause.']::text[] where id = 'b7537f43-7126-4067-a606-4a3a4042c116' and is_global;
update exercises set name = 'Hip Thrust (Band)', muscle_group = 'Glutes', equipment = 'band', category = 'accessory', instructions = 'Sit against a bench with a band across your hips held down by your hands or a rig.
Drive your hips up against the band.
Lower slowly.', cues = array['Band tight across the hip crease.', 'Pause at the top.', 'High reps work well.']::text[] where id = 'bd7f84b9-31e8-4852-b390-57b337e19fdd' and is_global;
update exercises set name = 'Sumo Hip Thrust (Barbell)', muscle_group = 'Glutes', equipment = 'barbell', category = 'strength', instructions = 'Set up like a hip thrust with your feet wide and toes out.
Drive your hips up, pushing your knees out.
Lower slowly.', cues = array['Knees follow your toes.', 'Squeeze at the top.', 'Chin tucked.']::text[] where id = 'a8a17823-09f4-4401-ade4-5a9b135a641c' and is_global;
update exercises set name = 'American Hip Thrust (Barbell)', muscle_group = 'Glutes', equipment = 'barbell', category = 'strength', instructions = 'Set up with the bench lower on your back, just below the shoulder blades, bar on your hips.
Tuck your pelvis and roll your hips up until your thighs are level.
Lower slowly.', cues = array['Tilt your hips under at the top.', 'Shorter range, more squeeze.', 'Chin tucked.']::text[] where id = 'c1573a1b-6265-4a7b-acb6-eb3189a42317' and is_global;
update exercises set name = 'Single Leg Hip Thrust', muscle_group = 'Glutes', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Sit against a bench with one foot planted and the other leg lifted.
Drive your hips up through the planted foot.
Lower slowly, then switch legs.', cues = array['Hips stay level.', 'Push through the heel.', 'Pause at the top.']::text[] where id = '01b8976d-d0b1-4ecc-9084-f4075a867f78' and is_global;
update exercises set name = 'Glute Bridge', muscle_group = 'Glutes', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Lie on your back with knees bent and feet flat near your glutes.
Push through your heels to lift your hips until your body is straight from knees to shoulders.
Lower slowly.', cues = array['Squeeze your glutes at the top.', 'Ribs down.', 'Add a weight on your hips to progress.']::text[] where id = '39c0fdbe-2b7f-411e-a9bb-edced9f3278a' and is_global;
update exercises set name = 'Single Leg Glute Bridge', muscle_group = 'Glutes', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Lie on your back with one foot planted and the other leg straight up or out.
Lift your hips through the planted foot.
Lower slowly, then switch.', cues = array['Hips stay level.', 'Push through the heel.', 'Pause at the top.']::text[] where id = '0c0f0701-1f46-4a66-9075-cfb8bb073094' and is_global;
update exercises set name = 'Frog Pump', muscle_group = 'Glutes', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Lie on your back with the soles of your feet together and knees falling out.
Squeeze your glutes to lift your hips.
Lower and repeat quickly.', cues = array['High reps.', 'Squeeze hard each rep.', 'Keep your lower back relaxed.']::text[] where id = '7aca4971-6dfa-45f3-9261-14dfbd95ee5c' and is_global;
update exercises set name = 'Glute Kickback (Cable)', muscle_group = 'Glutes', equipment = 'cable', category = 'strength', instructions = 'Attach an ankle strap to a low pulley and face the machine, holding on for support.
Kick your leg back and slightly up, squeezing your glute.
Return slowly, then switch legs.', cues = array['Hinge forward a little.', 'Do not arch your lower back.', 'Pause at the top.']::text[] where id = 'cfd78a34-219a-4a78-a2f6-a2e8b81413d3' and is_global;
update exercises set name = 'Glute Kickback (Machine)', muscle_group = 'Glutes', equipment = 'machine', category = 'strength', instructions = 'Set up on the machine with your foot on the platform or pad.
Push back until your hip is straight.
Return slowly, then switch legs.', cues = array['Squeeze at full extension.', 'Keep your back flat.', 'Slow return.']::text[] where id = '7dedf98a-f0e3-47bc-9942-8561c2b49d9b' and is_global;
update exercises set name = 'Donkey Kick', muscle_group = 'Glutes', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Start on your hands and knees.
Keeping your knee bent, lift one foot towards the ceiling.
Lower slowly, then switch sides.', cues = array['Do not arch your back.', 'Squeeze at the top.', 'Add an ankle weight or band to progress.']::text[] where id = 'e77edc8f-42a0-490d-91a1-70eee7686337' and is_global;
update exercises set name = 'Fire Hydrant', muscle_group = 'Glutes', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Start on your hands and knees.
Lift one knee out to the side, keeping it bent.
Lower slowly, then switch sides.', cues = array['Hips stay level.', 'Small, controlled range.', 'Add a band above the knees to progress.']::text[] where id = '44c111d5-80ba-493e-ac9f-9d1b96869735' and is_global;
update exercises set name = 'Clamshell', muscle_group = 'Glutes', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Lie on your side with knees bent and feet together.
Open your top knee while keeping your feet touching.
Close slowly.', cues = array['Hips stacked, do not roll back.', 'Add a band above the knees.', 'Slow and controlled.']::text[] where id = '342ce1e9-2915-4ba5-8e75-e8e3b36b40e8' and is_global;
update exercises set name = 'Hip Abduction (Machine)', muscle_group = 'Glutes', equipment = 'machine', category = 'strength', instructions = 'Sit with the pads on the outside of your knees.
Push your legs apart as far as you can.
Return slowly.', cues = array['Lean slightly forward for more glutes.', 'Pause when your legs are open.', 'Slow on the way back.']::text[] where id = '6c0e4f1c-63fa-400e-9f10-a89194163090' and is_global;
update exercises set name = 'Standing Hip Abduction (Band)', muscle_group = 'Glutes', equipment = 'band', category = 'accessory', instructions = 'Stand with a band around your ankles or above your knees, holding something for balance.
Lift one leg out to the side.
Lower slowly, then switch.', cues = array['Stand tall, no leaning.', 'Toes point forward.', 'Small range is fine.']::text[] where id = '31ea2733-5e98-4f50-8749-07e0925597c7' and is_global;
update exercises set name = 'Lying Hip Abduction (Band)', muscle_group = 'Glutes', equipment = 'band', category = 'accessory', instructions = 'Lie on your side with a band above your knees and legs straight.
Lift your top leg up.
Lower slowly.', cues = array['Hips stacked.', 'Lead with your heel.', 'Slow and controlled.']::text[] where id = '60e215c4-12ef-448a-a0f4-f56f8f2019a1' and is_global;
update exercises set name = 'Plank', muscle_group = 'Core', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Rest on your forearms and toes with your elbows under your shoulders.
Hold your body in a straight line from head to heels.
Breathe steadily until the time is up.', cues = array['Squeeze your glutes and brace your stomach.', 'Hips level, not high or sagging.', 'Drop to your knees if your form slips.']::text[] where id = '3dc9edee-7925-4d94-af99-a496781b7331' and is_global;
update exercises set name = 'Weighted Plank', muscle_group = 'Core', equipment = 'plate', category = 'strength', instructions = 'Get into a forearm plank and have a partner place a plate across your upper back.
Hold a straight line from head to heels.
Have the plate removed before you come down.', cues = array['Plate sits on your upper back, not your lower back.', 'Brace hard.', 'Shorter holds, more weight.']::text[] where id = 'cc63bfdb-a11f-44ee-8785-28e786364377' and is_global;
update exercises set name = 'Side Plank', muscle_group = 'Core', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Lie on your side and prop yourself up on one forearm, elbow under your shoulder.
Lift your hips so your body is straight from head to feet.
Hold, then switch sides.', cues = array['Hips up and forward.', 'Stack your feet or stagger them for balance.', 'Bend your knees to make it easier.']::text[] where id = '8a7ed1b3-7999-458f-813d-0e67a827e6e5' and is_global;
update exercises set name = 'Copenhagen Plank', muscle_group = 'Core', equipment = 'bodyweight', category = 'strength', instructions = 'Lie on your side with your top leg resting on a bench and your forearm on the floor.
Lift your hips and bottom leg so your body is straight.
Hold, then switch sides.', cues = array['Rest the knee on the bench to make it easier.', 'Squeeze your top leg into the bench.', 'Short holds to start.']::text[] where id = 'b2e12775-3a9d-4e12-a060-0dd7a0ed6489' and is_global;
update exercises set name = 'Plank Hip Dip', muscle_group = 'Core', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Start in a forearm plank.
Rotate your hips to dip one side towards the floor, then the other.
Keep alternating.', cues = array['Shoulders stay still.', 'Controlled, not fast.', 'Small dips are fine.']::text[] where id = 'd7af6de2-7ffa-420c-95f1-226b186e62f2' and is_global;
update exercises set name = 'Plank with Reach', muscle_group = 'Core', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Start in a high plank on your hands.
Reach one arm forward without letting your hips move.
Return it and switch arms.', cues = array['Feet wide for balance.', 'Hips stay square.', 'Slow reaches.']::text[] where id = 'e46223b2-ed94-45e9-acc2-91b970687d49' and is_global;
update exercises set name = 'Stir The Pot', muscle_group = 'Core', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Rest your forearms on a stability ball in a plank position.
Draw small circles with your elbows.
Change direction halfway.', cues = array['Hips do not move.', 'Small circles.', 'Breathe.']::text[] where id = '65b6c3fb-e532-4465-8da7-a3e84896f5db' and is_global;
update exercises set name = 'Dead Bug', muscle_group = 'Core', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Lie on your back with arms straight up and knees bent over your hips.
Slowly lower one arm overhead and the opposite leg towards the floor.
Return and switch sides.', cues = array['Lower back stays pressed into the floor.', 'Move slowly.', 'Breathe out as you reach.']::text[] where id = 'a107a153-671a-443d-8684-6b86d7aeb0a1' and is_global;
update exercises set name = 'Bird Dog', muscle_group = 'Core', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Start on your hands and knees.
Reach one arm forward and the opposite leg back until both are straight.
Return and switch sides.', cues = array['Back stays flat, like a table.', 'Do not rotate your hips.', 'Pause when stretched out.']::text[] where id = '33ed50e4-51f4-42f0-9b57-82402d0d1426' and is_global;
update exercises set name = 'Hollow Body Hold', muscle_group = 'Core', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Lie on your back and lift your shoulders and legs off the floor.
Reach your arms past your head and hold.
Keep your lower back pressed into the floor.', cues = array['Bend your knees to make it easier.', 'Lower back never lifts.', 'Short holds, good shape.']::text[] where id = 'ab651d92-c01e-47b8-90a5-a882dec98102' and is_global;
update exercises set name = 'Crunch', muscle_group = 'Core', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Lie on your back with knees bent and hands lightly behind your head.
Curl your shoulders off the floor towards your hips.
Lower slowly.', cues = array['Do not pull on your neck.', 'Breathe out as you curl.', 'Small, controlled movement.']::text[] where id = '50ddf561-8302-4dac-a279-cc6306ba524b' and is_global;
update exercises set name = 'Cable Crunch', muscle_group = 'Core', equipment = 'cable', category = 'strength', instructions = 'Kneel facing a high pulley holding a rope beside your head.
Curl your ribs down towards your hips.
Return slowly.', cues = array['Hips stay still.', 'Round your back on purpose.', 'Hands stay by your head.']::text[] where id = '8b348788-ead1-48c6-aba6-f4934b0ae7a1' and is_global;
update exercises set name = 'Reverse Crunch', muscle_group = 'Core', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Lie on your back with knees bent over your hips.
Curl your hips off the floor towards your chest.
Lower slowly.', cues = array['Use your stomach, not momentum.', 'Small lift.', 'Slow down.']::text[] where id = '934de7cc-763b-41ff-ac6e-d99ca94e6294' and is_global;
update exercises set name = 'Bicycle Crunch', muscle_group = 'Core', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Lie on your back with hands behind your head and legs lifted.
Bring one elbow towards the opposite knee as the other leg straightens.
Switch sides in a pedalling motion.', cues = array['Rotate through your ribs.', 'Slow beats fast.', 'Lower back down.']::text[] where id = 'cd5b984b-08e6-4702-9f25-0a7f63a940ba' and is_global;
update exercises set name = 'Sit Up', muscle_group = 'Core', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Lie on your back with knees bent and feet flat.
Sit all the way up.
Lower slowly back down.', cues = array['Arms crossed or reaching forward.', 'Lower under control.', 'Anchor your feet if needed.']::text[] where id = '4a4dd5d4-81a6-4e7e-8d51-a067662d7116' and is_global;
update exercises set name = 'Decline Sit Up', muscle_group = 'Core', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Hook your feet into a decline bench and lie back.
Sit up until your chest is near your thighs.
Lower slowly.', cues = array['Control the way down.', 'Hold a plate to progress.', 'Do not yank your neck.']::text[] where id = 'cfe7f114-c0be-4cc5-8de6-c41e01f6d906' and is_global;
update exercises set name = 'GHD Sit Up', muscle_group = 'Core', equipment = 'machine', category = 'strength', instructions = 'Sit on the GHD with your feet locked in and thighs on the pad.
Lower back until you are level with the floor or slightly below.
Sit back up.', cues = array['Build up slowly, it is very demanding.', 'Control the way back.', 'Short range first.']::text[] where id = 'e3b20797-e9d7-4236-a870-801c4ceb468b' and is_global;
update exercises set name = 'V-Up', muscle_group = 'Core', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Lie on your back with arms overhead and legs straight.
Lift your arms and legs at the same time to meet over your hips.
Lower slowly.', cues = array['Bend your knees to make it easier.', 'Reach for your toes.', 'Control the way down.']::text[] where id = 'c767aa71-1bc8-4b83-b387-ebcec6b68860' and is_global;
update exercises set name = 'Lying Leg Raise', muscle_group = 'Core', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Lie on your back with legs straight and hands under your hips.
Lift your legs until they point at the ceiling.
Lower them slowly without touching the floor.', cues = array['Lower back stays down.', 'Bend your knees to make it easier.', 'Slow on the way down.']::text[] where id = '5eb9b9e6-6157-4a64-80e7-25f551e36291' and is_global;
update exercises set name = 'Hanging Knee Raise', muscle_group = 'Core', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Hang from a bar with straight arms.
Lift your knees up towards your chest.
Lower slowly.', cues = array['No swinging.', 'Curl your hips up at the top.', 'Control the way down.']::text[] where id = '61219bb8-0c55-41b1-a6e4-19f2ecd8093d' and is_global;
update exercises set name = 'Hanging Leg Raise', muscle_group = 'Core', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Hang from a bar with straight arms.
Lift your straight legs until they are level with your hips or higher.
Lower slowly.', cues = array['Start with knee raises.', 'No swinging.', 'Tilt your hips up at the top.']::text[] where id = '4d07c774-2716-4de2-ac42-06952699e0c8' and is_global;
update exercises set name = 'Flutter Kick', muscle_group = 'Core', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Lie on your back with legs straight and lifted a few centimetres.
Kick your legs up and down in small fast movements.
Keep going for the time.', cues = array['Lower back pressed down.', 'Small kicks.', 'Hands under your hips helps.']::text[] where id = '71e253e0-3a6a-4f81-86c0-98af6b4f01d1' and is_global;
update exercises set name = 'Scissor Kick', muscle_group = 'Core', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Lie on your back with legs straight and lifted.
Cross one leg over the other, then switch, like scissors.
Keep going for the time.', cues = array['Lower back down.', 'Controlled crosses.', 'Breathe.']::text[] where id = '29f26e54-d002-4eeb-9041-b401069988a3' and is_global;
update exercises set name = 'Russian Twist', muscle_group = 'Core', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Sit leaning back slightly with knees bent and feet on or off the floor.
Rotate your chest to one side, then the other.
Hold a weight to make it harder.', cues = array['Turn your shoulders, not just your arms.', 'Tall chest.', 'Slow and controlled.']::text[] where id = '17713f2c-bb10-4a82-b8d8-77bbdaff0582' and is_global;
update exercises set name = 'Mountain Climber', muscle_group = 'Core', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Start in a high plank on your hands.
Drive one knee towards your chest, then switch legs quickly.
Keep alternating for the time.', cues = array['Hips stay low.', 'Hands under shoulders.', 'Steady pace before speed.']::text[] where id = '626cc7df-5a58-458d-8c61-642a2c022d6e' and is_global;
update exercises set name = 'Ab Wheel Rollout', muscle_group = 'Core', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Kneel holding an ab wheel under your shoulders.
Roll forward as far as you can while keeping your back flat.
Pull the wheel back to your knees.', cues = array['Brace hard, do not let your back sag.', 'Short rollouts first.', 'Squeeze your glutes.']::text[] where id = 'dbc505dc-29e9-43ab-9c40-f61ca5df4652' and is_global;
update exercises set name = 'Dragon Flag', muscle_group = 'Core', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Lie on a bench holding it behind your head.
Lift your body so only your upper back touches the bench, body straight.
Lower slowly without bending at the hips.', cues = array['Very advanced, build up with tucked legs.', 'Straight line from shoulders to feet.', 'Lowering is the hard part.']::text[] where id = '752fc553-cefe-4788-8689-e9b1c4aba7b4' and is_global;
update exercises set name = 'L-Sit', muscle_group = 'Core', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Support yourself on parallettes or a dip bar with straight arms.
Lift your legs straight out in front to hip height.
Hold.', cues = array['Tuck your knees to make it easier.', 'Push the floor away.', 'Short holds.']::text[] where id = '94363b6f-0604-40ac-88f9-3227be21014b' and is_global;
update exercises set name = 'Pallof Press (Cable)', muscle_group = 'Core', equipment = 'cable', category = 'strength', instructions = 'Stand side on to a cable at chest height holding the handle at your chest.
Press it straight out in front and resist the pull to turn.
Bring it back to your chest, then switch sides.', cues = array['Do not let the cable twist you.', 'Hips and shoulders square.', 'Pause with arms straight.']::text[] where id = 'b31f3f21-ffba-4019-85ea-c21f731538be' and is_global;
update exercises set name = 'Cable Woodchop (High to Low)', muscle_group = 'Core', equipment = 'cable', category = 'accessory', instructions = 'Stand side on to a high pulley holding the handle with both hands.
Pull it down and across your body towards the opposite knee, turning your chest.
Return slowly, then switch sides.', cues = array['Turn through your trunk.', 'Pivot your back foot.', 'Arms stay fairly straight.']::text[] where id = '985240bc-fa45-4868-ad22-1ec524f20c17' and is_global;
update exercises set name = 'Cable Woodchop (Low to High)', muscle_group = 'Core', equipment = 'cable', category = 'accessory', instructions = 'Stand side on to a low pulley holding the handle with both hands.
Pull it up and across your body to above the opposite shoulder.
Return slowly, then switch sides.', cues = array['Turn your chest with the handle.', 'Drive from your hips.', 'Controlled return.']::text[] where id = 'fcfe75dd-ed10-43bb-b01a-108979ba8b35' and is_global;
update exercises set name = 'Landmine Rotation', muscle_group = 'Core', equipment = 'landmine', category = 'strength', instructions = 'Hold the end of a landmine bar overhead with straight arms.
Rotate it down to one hip, then up and over to the other.
Keep alternating.', cues = array['Pivot your feet.', 'Arms stay straight.', 'Control it, do not let it swing.']::text[] where id = 'a98417e9-be65-4c95-88cf-48754dc0a1f2' and is_global;
update exercises set name = 'Toe Touch', muscle_group = 'Core', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Lie on your back with your legs straight up.
Reach your hands up towards your toes, lifting your shoulders.
Lower slowly.', cues = array['Legs stay vertical.', 'Breathe out as you reach.', 'Small range.']::text[] where id = 'a4befeb3-b156-4758-b3ab-b5ddae4f3243' and is_global;
update exercises set name = 'Windmill (Kettlebell)', muscle_group = 'Core', equipment = 'kettlebell', category = 'strength', instructions = 'Hold a kettlebell overhead in one hand, feet turned slightly away from it.
Push your hip out and slide your free hand down your leg, eyes on the kettlebell.
Return to standing, then switch sides.', cues = array['Overhead arm stays locked.', 'Hips push out to the side.', 'Light weight.']::text[] where id = 'aa25ae2c-392a-4a2e-b316-3276612e2b69' and is_global;
update exercises set name = 'Power Clean (Barbell)', muscle_group = 'Full Body', equipment = 'barbell', category = 'power', instructions = 'Start like a deadlift with the bar over your mid foot.
Pull the bar past your knees, then jump and shrug to drive it up, pulling yourself under it.
Catch it on the front of your shoulders in a quarter squat and stand up.', cues = array['Learn it with a coach before going heavy.', 'The bar stays close to your body.', 'Fast elbows in the catch.']::text[] where id = '106e6ec0-8a7e-4a7a-ae33-ccc515cef9ac' and is_global;
update exercises set name = 'Hang Clean (Barbell)', muscle_group = 'Full Body', equipment = 'barbell', category = 'power', instructions = 'Stand holding the bar at your thighs.
Dip slightly, then jump and shrug to drive the bar up.
Catch it on the front of your shoulders and stand up.', cues = array['Hips do the work, not your arms.', 'Elbows whip around fast.', 'Light and fast.']::text[] where id = '63b1a15c-6f5d-4e45-8a23-e5acf12f82ac' and is_global;
update exercises set name = 'Clean Pull (Barbell)', muscle_group = 'Full Body', equipment = 'barbell', category = 'power', instructions = 'Set up like a clean.
Pull the bar explosively, finishing tall on your toes with a shrug.
Lower it back down under control.', cues = array['No catch, just the pull.', 'Full hip extension.', 'Bar close.']::text[] where id = '7a099b6b-2c6d-45fe-8c6b-ef2e97bbefcd' and is_global;
update exercises set name = 'Clean and Press (Barbell)', muscle_group = 'Full Body', equipment = 'barbell', category = 'power', instructions = 'Clean the bar from the floor to your shoulders.
Press it overhead until your arms are straight.
Lower it to your shoulders, then back to the floor.', cues = array['Reset between reps.', 'Brace before the press.', 'Light enough to keep good form.']::text[] where id = 'cfaabcec-bf05-4fe8-91de-266e00e94370' and is_global;
update exercises set name = 'Snatch (Barbell)', muscle_group = 'Full Body', equipment = 'barbell', category = 'power', instructions = 'Grip the bar wide and set up with a flat back.
Pull explosively, jump and pull yourself under to catch the bar overhead.
Stand up with the bar locked out overhead.', cues = array['Learn with a coach.', 'Bar stays close to your body.', 'Punch up into the catch.']::text[] where id = '52faa51c-6baf-4968-8426-f7d61342b2c5' and is_global;
update exercises set name = 'Thruster (Barbell)', muscle_group = 'Full Body', equipment = 'barbell', category = 'power', instructions = 'Hold the bar on the front of your shoulders.
Front squat down, then drive up and press the bar overhead in one movement.
Lower the bar to your shoulders as you go into the next squat.', cues = array['Use your legs to start the press.', 'Elbows high in the squat.', 'Smooth, one movement.']::text[] where id = '8c6a3cd5-88b9-43ab-9117-50240c094019' and is_global;
update exercises set name = 'Thruster (Dumbbell)', muscle_group = 'Full Body', equipment = 'dumbbell', category = 'power', instructions = 'Hold the dumbbells at your shoulders.
Squat down, then drive up and press them overhead.
Lower them back to your shoulders as you squat again.', cues = array['Legs power the press.', 'Chest up.', 'Keep a steady rhythm.']::text[] where id = '45c818e9-167e-40a1-8215-aeb56ad6e074' and is_global;
update exercises set name = 'Sumo Deadlift High Pull (Barbell)', muscle_group = 'Full Body', equipment = 'barbell', category = 'power', instructions = 'Stand wide with a narrow grip on the bar.
Stand up explosively and pull the bar up to your chin, elbows high.
Lower it back down.', cues = array['Hips first, arms last.', 'Elbows above your hands.', 'Controlled lowering.']::text[] where id = 'a020f0ab-4b55-4cae-bab0-0205100291d3' and is_global;
update exercises set name = 'Man Maker (Dumbbell)', muscle_group = 'Full Body', equipment = 'dumbbell', category = 'strength', instructions = 'With hands on two dumbbells, do a push up, then a row on each side.
Jump your feet in and clean the dumbbells to your shoulders.
Squat and press them overhead, then repeat.', cues = array['Light dumbbells.', 'Move with control, not speed.', 'Flat back throughout.']::text[] where id = '4b3f139f-d4b7-4254-8acd-922f4a655d52' and is_global;
update exercises set name = 'Barbell Complex', muscle_group = 'Full Body', equipment = 'barbell', category = 'strength', instructions = 'Pick a short list of moves, such as deadlift, row, clean, front squat and press.
Do the set reps of each move back to back without putting the bar down.
Rest only after the whole list.', cues = array['Use a weight that suits your weakest move.', 'Good form over speed.', 'Breathe between moves.']::text[] where id = 'ad18d252-c44b-40c4-9c91-2e4fe4bcee33' and is_global;
update exercises set name = 'Dumbbell Complex', muscle_group = 'Full Body', equipment = 'dumbbell', category = 'strength', instructions = 'Pick a short list of dumbbell moves, such as RDL, row, clean, squat and press.
Do them back to back without putting the dumbbells down.
Rest after the whole list.', cues = array['Pick a weight for your weakest move.', 'Smooth transitions.', 'Keep your back flat.']::text[] where id = 'c15ae11a-121c-459c-bc7e-a5964fd0f1e5' and is_global;
update exercises set name = 'Kettlebell Clean', muscle_group = 'Full Body', equipment = 'kettlebell', category = 'power', instructions = 'Hike the kettlebell back between your legs.
Snap your hips and guide it up close to your body into the rack at your chest.
Let it drop back down and repeat.', cues = array['The bell rolls around your wrist, it should not flip and bang.', 'Elbow tucked in the rack.', 'Hips do the work.']::text[] where id = 'f8c6ab63-fd88-4d55-ac7d-f2be2ce25809' and is_global;
update exercises set name = 'Kettlebell Snatch', muscle_group = 'Full Body', equipment = 'kettlebell', category = 'power', instructions = 'Hike the kettlebell back between your legs.
Snap your hips and pull it up in one movement to lock out overhead.
Bring it back down between your legs and repeat.', cues = array['Punch through at the top so it lands softly.', 'Keep it close.', 'Learn the swing and clean first.']::text[] where id = '60443481-9c4c-4ed3-84e7-3f790c22e42b' and is_global;
update exercises set name = 'Turkish Get Up (Kettlebell)', muscle_group = 'Full Body', equipment = 'kettlebell', category = 'strength', instructions = 'Lie on your back holding a kettlebell straight up in one hand.
Roll to your elbow, then hand, lift your hips, sweep your leg through to a kneel and stand up.
Reverse each step back down to the floor.', cues = array['Eyes on the kettlebell the whole time.', 'Arm stays locked.', 'Slow, one step at a time.']::text[] where id = '45c72100-eace-4e5d-a514-8833cb1c533d' and is_global;
update exercises set name = 'Burpee', muscle_group = 'Full Body', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Squat down and put your hands on the floor.
Jump your feet back into a plank, lower your chest, then jump your feet back in.
Jump up with your arms overhead.', cues = array['Step back instead of jumping to make it easier.', 'Land softly.', 'Steady pace.']::text[] where id = '8a79e74c-1eff-443b-a79b-52b24864717f' and is_global;
update exercises set name = 'Bear Crawl', muscle_group = 'Full Body', equipment = 'bodyweight', category = 'bodyweight', instructions = 'Start on your hands and toes with your knees just off the floor.
Crawl forward moving opposite hand and foot together.
Keep your back flat and hips low.', cues = array['Knees hover just above the floor.', 'Small steps.', 'Back flat, like a table.']::text[] where id = '12d544ad-437f-4cdc-b50e-1b1a18c13ef3' and is_global;
update exercises set name = 'Medicine Ball Slam', muscle_group = 'Full Body', equipment = 'functional', category = 'power', instructions = 'Hold a slam ball overhead.
Slam it into the floor as hard as you can, bending at the hips and knees.
Pick it up and repeat.', cues = array['Use a ball that does not bounce.', 'Whole body slam.', 'Flat back to pick it up.']::text[] where id = '2558eecc-1bd0-4bde-bcf6-43bec680ed62' and is_global;
update exercises set name = 'Medicine Ball Throw', muscle_group = 'Full Body', equipment = 'functional', category = 'power', instructions = 'Hold a medicine ball at your chest facing a wall.
Throw it explosively into the wall.
Catch it on the rebound and repeat.', cues = array['Step into the throw.', 'Fast and powerful.', 'Soft hands on the catch.']::text[] where id = 'f78d43a0-3590-4b93-b2c5-5733c3adb024' and is_global;
update exercises set name = 'Box Jump', muscle_group = 'Full Body', equipment = 'bodyweight', category = 'power', instructions = 'Stand facing a box about a step away.
Swing your arms and jump onto the box, landing softly in a squat.
Stand up tall, then step back down.', cues = array['Step down, do not jump down.', 'Land quietly.', 'Pick a box you can land easily.']::text[] where id = '44d5cefd-26a9-47d0-944a-b71812c4df40' and is_global;
update exercises set name = 'Broad Jump', muscle_group = 'Full Body', equipment = 'bodyweight', category = 'power', instructions = 'Stand with feet hip width apart.
Swing your arms and jump forward as far as you can.
Land softly with bent knees, then walk back.', cues = array['Arms drive the jump.', 'Stick the landing.', 'Rest between jumps.']::text[] where id = '0d5c3772-4ab8-40a3-952b-8a9f342dfc43' and is_global;
update exercises set name = 'Battle Ropes', muscle_group = 'Full Body', equipment = 'functional', category = 'cardio', instructions = 'Hold an end of the rope in each hand in a quarter squat.
Whip the ropes up and down in fast waves.
Keep going for the time.', cues = array['Stay low.', 'Use your whole arms.', 'Breathe.']::text[] where id = '97f2805a-ecb3-44be-9126-c8d322ce7839' and is_global;
update exercises set name = 'Sled Push', muscle_group = 'Full Body', equipment = 'sled', category = 'strength', instructions = 'Grip the sled handles with your body leaning forward.
Drive with short, powerful steps.
Keep pushing for the distance.', cues = array['Low body angle.', 'Push through the balls of your feet.', 'Arms straight or bent, stay strong.']::text[] where id = '77f1f905-6f81-4be8-a8ee-eb00e7d29400' and is_global;
update exercises set name = 'Sled Pull', muscle_group = 'Full Body', equipment = 'sled', category = 'strength', instructions = 'Attach a rope or straps to the sled.
Walk backwards pulling the sled, or pull it to you hand over hand.
Keep going for the distance.', cues = array['Stay low.', 'Short steps.', 'Keep tension on the rope.']::text[] where id = '3cb868a3-a5cb-46c8-8cc4-21d54f94225c' and is_global;
update exercises set name = 'Farmers Walk', muscle_group = 'Full Body', equipment = 'dumbbell', category = 'strength', instructions = 'Pick up a heavy dumbbell or kettlebell in each hand.
Walk tall with short, quick steps.
Put them down safely at the end.', cues = array['Shoulders down and back.', 'Do not let the weights swing.', 'Grip hard.']::text[] where id = '3f7d5881-2fdd-4db6-b951-7731612e97dc' and is_global;
update exercises set name = 'Suitcase Carry', muscle_group = 'Full Body', equipment = 'dumbbell', category = 'strength', instructions = 'Hold one heavy dumbbell or kettlebell at your side.
Walk tall without leaning towards the weight.
Switch hands and repeat.', cues = array['Stay level, no lean.', 'Brace your trunk.', 'Slow steps.']::text[] where id = 'aa08a954-5b3c-4411-a229-cc25269de571' and is_global;
update exercises set name = 'Overhead Carry', muscle_group = 'Full Body', equipment = 'dumbbell', category = 'strength', instructions = 'Press a dumbbell or kettlebell overhead and lock your arm.
Walk with it held straight above you.
Switch arms for the next set.', cues = array['Biceps by your ear.', 'Ribs down.', 'Light to start.']::text[] where id = '51088e0e-67b0-43ac-9d73-5129f154c218' and is_global;
update exercises set name = 'Trap Bar Carry', muscle_group = 'Full Body', equipment = 'trap_bar', category = 'strength', instructions = 'Deadlift a loaded trap bar.
Walk with short steps, keeping it level.
Put it down safely at the end.', cues = array['Tall posture.', 'Grip tight.', 'Short steps.']::text[] where id = 'f4aa470b-e0ca-4566-b9ef-205bbc9b259e' and is_global;
update exercises set name = 'Sandbag Carry', muscle_group = 'Full Body', equipment = 'functional', category = 'strength', instructions = 'Pick up a sandbag and hug it to your chest.
Walk for the distance.
Put it down with a flat back.', cues = array['Hug it tight.', 'Stay upright.', 'Breathe.']::text[] where id = '4d285296-6853-4dd1-97bf-742788e5cba4' and is_global;
update exercises set name = 'Treadmill Run', muscle_group = 'Cardio', equipment = 'machine', category = 'cardio', instructions = 'Start walking to warm up, then build to your running pace.
Run tall with relaxed arms and quick, light steps.
Walk for a few minutes at the end to cool down.', cues = array['Do not hold the handrails.', 'Land under your hips, not out in front.', 'Pick a pace you could talk at for easy runs.']::text[] where id = '4c6d4b39-a346-4ca6-bc0d-cc26696128fe' and is_global;
update exercises set name = 'Treadmill Walk (Incline)', muscle_group = 'Cardio', equipment = 'machine', category = 'cardio', instructions = 'Set the treadmill to a steady walking speed.
Raise the incline until it feels like a solid uphill walk.
Walk for the set time without holding the rails.', cues = array['Hands off the rails.', 'Tall posture.', 'Breathe through your nose if you can.']::text[] where id = '29a3c55e-0e37-4ada-9755-d35725389cac' and is_global;
update exercises set name = 'HIIT Treadmill', muscle_group = 'Cardio', equipment = 'machine', category = 'cardio', instructions = 'Warm up for 5 minutes.
Alternate fast running intervals with walking or easy jogging recovery.
Cool down with a few minutes of walking.', cues = array['Step onto the side rails to change speed safely.', 'Hard means hard, easy means easy.', 'Count your intervals.']::text[] where id = 'aae4b4a3-d555-4ad4-975e-92f0300194cc' and is_global;
update exercises set name = 'Sprints', muscle_group = 'Cardio', equipment = 'bodyweight', category = 'cardio', instructions = 'Warm up well with easy running and drills.
Sprint hard for the set distance.
Walk back and rest fully before the next one.', cues = array['Full rest between sprints.', 'Drive your arms.', 'Stay relaxed at top speed.']::text[] where id = '40aebbcd-bcb2-4b50-a634-8a22afa2015c' and is_global;
update exercises set name = 'Hill Sprint', muscle_group = 'Cardio', equipment = 'bodyweight', category = 'cardio', instructions = 'Find a steady hill and warm up well.
Sprint up the hill for the set time or distance.
Walk back down to recover.', cues = array['Lean slightly into the hill.', 'Short powerful steps.', 'Walk down, rest, repeat.']::text[] where id = '8d1ec810-4ab6-478a-b0cd-a1824ec5cd8c' and is_global;
update exercises set name = 'Stationary Bike', muscle_group = 'Cardio', equipment = 'machine', category = 'cardio', instructions = 'Set the seat so your knee is slightly bent at the bottom of the pedal stroke.
Ride at a steady pace for the set time.
Ease off for the last few minutes.', cues = array['Seat height matters.', 'Smooth pedal strokes.', 'Upright posture.']::text[] where id = '6c318bf8-2ad1-4588-ab20-a76401eb470c' and is_global;
update exercises set name = 'Cycling Intervals', muscle_group = 'Cardio', equipment = 'machine', category = 'cardio', instructions = 'Warm up on the bike for 5 minutes.
Alternate hard efforts with easy recovery pedalling.
Cool down for a few minutes.', cues = array['Raise the resistance for hard efforts.', 'Stay seated unless told otherwise.', 'Count your intervals.']::text[] where id = '04b7bf3c-9ee0-435c-83ed-b7172fb1654d' and is_global;
update exercises set name = 'Cycle Ergometer Test', muscle_group = 'Cardio', equipment = 'machine', category = 'cardio', instructions = 'Warm up on the bike.
Ride the test distance or time as hard as you can sustain.
Record your result and cool down.', cues = array['Same bike and settings each test.', 'Pace it evenly.', 'Write down the result.']::text[] where id = 'a38e6409-c9dc-43be-8376-4b844cc1ed2b' and is_global;
update exercises set name = 'Echo Bike', muscle_group = 'Cardio', equipment = 'machine', category = 'cardio', instructions = 'Sit on the bike and push and pull the handles while you pedal.
Work at the set intensity for the time or calories.
Ease off to recover.', cues = array['Arms and legs together.', 'Hard efforts are short.', 'Breathe out hard.']::text[] where id = '5a3db06f-e87f-4313-a6bc-f543b14cc9bf' and is_global;
update exercises set name = 'Rowing Machine', muscle_group = 'Cardio', equipment = 'machine', category = 'cardio', instructions = 'Strap your feet in and hold the handle with straight arms.
Push with your legs, lean back slightly, then pull the handle to your lower ribs.
Return arms first, then lean forward, then bend your knees.', cues = array['Legs, body, arms. Then arms, body, legs.', 'Most of the power comes from your legs.', 'Smooth and long strokes.']::text[] where id = 'b614f70f-f629-45a2-bd85-4f0a65837e41' and is_global;
update exercises set name = 'Rowing Sprint', muscle_group = 'Cardio', equipment = 'machine', category = 'power', instructions = 'Set up on the rower as normal.
Row as hard as you can for the set time or distance.
Rest fully before the next effort.', cues = array['Hard leg drive.', 'Keep good form when tired.', 'Full rest between sprints.']::text[] where id = '636a7397-5235-49c2-8d6c-29f4ea0a81c8' and is_global;
update exercises set name = 'Ski Erg', muscle_group = 'Cardio', equipment = 'machine', category = 'cardio', instructions = 'Stand facing the machine holding a handle in each hand above your head.
Pull down by hinging at your hips and bending your knees slightly.
Return tall and repeat.', cues = array['Use your body, not just your arms.', 'Hips back as you pull.', 'Steady rhythm.']::text[] where id = '571d583c-08f0-44a4-aa04-0f30b2012f85' and is_global;
update exercises set name = 'Stair Climber', muscle_group = 'Cardio', equipment = 'machine', category = 'cardio', instructions = 'Step onto the machine and pick a steady speed.
Climb with your whole foot on each step.
Keep going for the set time.', cues = array['Hands off the rails.', 'Tall posture.', 'Steady pace.']::text[] where id = '083c1534-86d1-4dd8-999c-6137bba4fc8f' and is_global;
update exercises set name = 'Elliptical', muscle_group = 'Cardio', equipment = 'machine', category = 'cardio', instructions = 'Step on and hold the moving handles.
Move at a steady pace, pushing and pulling with your arms.
Keep going for the set time.', cues = array['Upright posture.', 'Use the arms too.', 'Steady effort.']::text[] where id = '7b0913f2-49bc-4902-a895-cde2e2c8f246' and is_global;
update exercises set name = 'Versa Climber', muscle_group = 'Cardio', equipment = 'machine', category = 'cardio', instructions = 'Strap your feet in and hold the handles.
Climb with opposite arm and leg moving together.
Keep a steady pace for the time.', cues = array['Long strokes.', 'Stay upright.', 'Breathe steadily.']::text[] where id = 'b0b85286-a9c5-42f5-9739-d9e7ce118e29' and is_global;
update exercises set name = 'Swimming Laps', muscle_group = 'Cardio', equipment = 'bodyweight', category = 'cardio', instructions = 'Warm up with a few easy laps.
Swim at the set pace for the time or distance.
Cool down with easy laps.', cues = array['Long, relaxed strokes.', 'Breathe out underwater.', 'Rest at the wall if needed.']::text[] where id = '29409d71-63a5-4099-acca-221c08fe979f' and is_global;
update exercises set name = 'Jump Rope (Steady State)', muscle_group = 'Cardio', equipment = 'bodyweight', category = 'warmup', instructions = 'Hold the handles at hip height and swing the rope with your wrists.
Jump just high enough to clear the rope.
Keep a steady rhythm for the time.', cues = array['Small jumps.', 'Turn with your wrists, not your arms.', 'Land on the balls of your feet.']::text[] where id = '6dd2ab13-b862-48ca-820f-97beaee2b576' and is_global;
update exercises set name = 'Jump Rope (Interval)', muscle_group = 'Cardio', equipment = 'bodyweight', category = 'cardio', instructions = 'Skip fast for the work interval.
Rest or skip easily for the recovery.
Repeat for the set rounds.', cues = array['Fast feet.', 'Small jumps.', 'Count your rounds.']::text[] where id = '359aabfc-14a1-465a-ba4c-cfab648fd8b9' and is_global;
update exercises set name = 'Jumping Jacks', muscle_group = 'Cardio', equipment = 'bodyweight', category = 'warmup', instructions = 'Stand with feet together and arms by your sides.
Jump your feet out as your arms go overhead.
Jump back in and repeat.', cues = array['Light on your feet.', 'Steady rhythm.', 'Step out instead of jumping to make it easier.']::text[] where id = '3d180999-8823-4b2f-96d7-48026312226a' and is_global;
update exercises set name = 'High Knees', muscle_group = 'Cardio', equipment = 'bodyweight', category = 'warmup', instructions = 'Run on the spot.
Drive your knees up to hip height.
Pump your arms.', cues = array['Quick feet.', 'Stay tall.', 'Land softly.']::text[] where id = '1e525e31-4425-49d0-93e3-55576aff30dd' and is_global;
update exercises set name = 'Butt Kicks', muscle_group = 'Cardio', equipment = 'bodyweight', category = 'warmup', instructions = 'Run on the spot.
Kick your heels up towards your glutes.
Keep a quick rhythm.', cues = array['Stay tall.', 'Light feet.', 'Arms move naturally.']::text[] where id = '3f8b07db-627e-4fd9-9512-1aff8cb30ab3' and is_global;
update exercises set name = 'Wall Calf Stretch and Raise', muscle_group = 'Legs', equipment = 'bodyweight', category = 'cooldown', instructions = 'Face a wall with your hands on it and one foot back, heel down.
Lean in to stretch the back calf, then rise onto your toes and lower.
Switch legs.', cues = array['Back heel stays down in the stretch.', 'Slow raises.', 'Breathe.']::text[] where id = '52b3e3c7-478b-43e2-a995-548a3d21ed9d' and is_global;

-- 3. Add the new exercises (seated and standing versions and the rest).
insert into exercises (id, name, muscle_group, equipment, category, instructions, cues, is_global, created_by) values ('46d4414e-12d3-5bf3-b57a-5d4797a442e8', 'Bent Over Row (Dumbbell)', 'Back', 'dumbbell', 'strength', 'Hold a dumbbell in each hand, hinge forward with a flat back and soft knees.
Row both dumbbells to your hips.
Lower slowly until your arms are straight.', array['Elbows travel back past your body.', 'Keep your neck in line with your back.', 'Brace your trunk the whole set.']::text[], true, null);
insert into exercises (id, name, muscle_group, equipment, category, instructions, cues, is_global, created_by) values ('abbbf6a3-ec75-5204-a612-e312b3d1236c', 'Standing Shoulder Press (Dumbbell)', 'Shoulders', 'dumbbell', 'strength', 'Stand tall with a dumbbell at each shoulder, palms facing forward.
Brace and press both dumbbells overhead until your arms are straight.
Lower slowly to your shoulders.', array['Squeeze your glutes and brace your stomach.', 'No leaning back.', 'Press up in a straight line.']::text[], true, null);
insert into exercises (id, name, muscle_group, equipment, category, instructions, cues, is_global, created_by) values ('a77eb2d5-02d9-50dd-8b5d-8e9beed05d69', 'Standing Arnold Press (Dumbbell)', 'Shoulders', 'dumbbell', 'strength', 'Stand tall holding the dumbbells in front of your shoulders, palms facing you.
Press up while turning your palms forward until your arms are straight overhead.
Reverse the turn as you lower.', array['Brace so your lower back does not arch.', 'Turn and press at the same time.', 'Control the way down.']::text[], true, null);
insert into exercises (id, name, muscle_group, equipment, category, instructions, cues, is_global, created_by) values ('16b4b72f-2101-5ccd-929a-3f573311fa74', 'Seated Hammer Curl (Dumbbell)', 'Biceps', 'dumbbell', 'strength', 'Sit on the end of a bench holding the dumbbells with palms facing each other.
Curl them up towards your shoulders.
Lower slowly to straight arms.', array['Back tall, no lean.', 'Thumbs up throughout.', 'Control every lowering.']::text[], true, null);
insert into exercises (id, name, muscle_group, equipment, category, instructions, cues, is_global, created_by) values ('2f5ec03c-6da9-5470-a824-ddb766e2878c', 'Seated Overhead Tricep Extension (Dumbbell)', 'Triceps', 'dumbbell', 'strength', 'Sit on an upright bench holding one dumbbell overhead with both hands.
Lower it behind your head.
Press it back up until your arms are straight.', array['Back against the pad.', 'Elbows stay narrow.', 'Slow into the stretch.']::text[], true, null);
insert into exercises (id, name, muscle_group, equipment, category, instructions, cues, is_global, created_by) values ('528588d5-34f3-5b9b-9a6c-395c996db1b7', 'Standing Calf Raise (Machine)', 'Legs', 'machine', 'strength', 'Stand under the shoulder pads with the balls of your feet on the platform.
Rise up onto your toes as high as you can.
Lower slowly until your heels drop below the platform.', array['Knees straight but not locked.', 'Pause at the top.', 'Slow stretch at the bottom.']::text[], true, null);

-- 4. Old names and other names become alternative names, so search and the AI still find them.
insert into exercise_aliases (exercise_id, alias) select '350f0b1f-d809-424a-ad4d-45a8e9d660dc', 'Barbell Bench Press' where not exists (select 1 from exercise_aliases where exercise_id = '350f0b1f-d809-424a-ad4d-45a8e9d660dc' and lower(alias) = lower('Barbell Bench Press'));
insert into exercise_aliases (exercise_id, alias) select '350f0b1f-d809-424a-ad4d-45a8e9d660dc', 'bench press' where not exists (select 1 from exercise_aliases where exercise_id = '350f0b1f-d809-424a-ad4d-45a8e9d660dc' and lower(alias) = lower('bench press'));
insert into exercise_aliases (exercise_id, alias) select '776731a6-70bc-4195-a687-f977d36c2b60', 'Dumbbell Bench Press' where not exists (select 1 from exercise_aliases where exercise_id = '776731a6-70bc-4195-a687-f977d36c2b60' and lower(alias) = lower('Dumbbell Bench Press'));
insert into exercise_aliases (exercise_id, alias) select '237cdf25-3cb1-435f-bb45-60e5a200b375', 'Smith Machine Bench Press' where not exists (select 1 from exercise_aliases where exercise_id = '237cdf25-3cb1-435f-bb45-60e5a200b375' and lower(alias) = lower('Smith Machine Bench Press'));
insert into exercise_aliases (exercise_id, alias) select '331e2d0a-df10-4219-becb-f8c91f60fe57', 'Close Grip Bench Press' where not exists (select 1 from exercise_aliases where exercise_id = '331e2d0a-df10-4219-becb-f8c91f60fe57' and lower(alias) = lower('Close Grip Bench Press'));
insert into exercise_aliases (exercise_id, alias) select '032ee22c-3201-4d75-afd4-d08cf3dc6eba', 'Smith Machine Close Grip Press' where not exists (select 1 from exercise_aliases where exercise_id = '032ee22c-3201-4d75-afd4-d08cf3dc6eba' and lower(alias) = lower('Smith Machine Close Grip Press'));
insert into exercise_aliases (exercise_id, alias) select '61117381-4fd6-41a5-b0b2-f00d558e0b9e', 'Incline Barbell Bench Press' where not exists (select 1 from exercise_aliases where exercise_id = '61117381-4fd6-41a5-b0b2-f00d558e0b9e' and lower(alias) = lower('Incline Barbell Bench Press'));
insert into exercise_aliases (exercise_id, alias) select 'e5a86efe-af6f-41ec-bc1b-e808133ac017', 'Incline Dumbbell Press' where not exists (select 1 from exercise_aliases where exercise_id = 'e5a86efe-af6f-41ec-bc1b-e808133ac017' and lower(alias) = lower('Incline Dumbbell Press'));
insert into exercise_aliases (exercise_id, alias) select '9422ae47-1993-474d-a427-90866db3cfbe', 'Smith Machine Incline Press' where not exists (select 1 from exercise_aliases where exercise_id = '9422ae47-1993-474d-a427-90866db3cfbe' and lower(alias) = lower('Smith Machine Incline Press'));
insert into exercise_aliases (exercise_id, alias) select '8d292aaa-91b3-46fe-87be-49c5f299710c', 'High Incline Dumbbell Press' where not exists (select 1 from exercise_aliases where exercise_id = '8d292aaa-91b3-46fe-87be-49c5f299710c' and lower(alias) = lower('High Incline Dumbbell Press'));
insert into exercise_aliases (exercise_id, alias) select '0be337f1-f6cf-496d-b945-43b33efef996', 'Decline Barbell Bench Press' where not exists (select 1 from exercise_aliases where exercise_id = '0be337f1-f6cf-496d-b945-43b33efef996' and lower(alias) = lower('Decline Barbell Bench Press'));
insert into exercise_aliases (exercise_id, alias) select '7c3a4de5-04a5-49d1-b02c-f61fb4dfc79d', 'Decline Dumbbell Press' where not exists (select 1 from exercise_aliases where exercise_id = '7c3a4de5-04a5-49d1-b02c-f61fb4dfc79d' and lower(alias) = lower('Decline Dumbbell Press'));
insert into exercise_aliases (exercise_id, alias) select '4d23ab07-8e3b-4fbb-a049-4d744a5ec1b9', 'Dumbbell Floor Press (Tricep)' where not exists (select 1 from exercise_aliases where exercise_id = '4d23ab07-8e3b-4fbb-a049-4d744a5ec1b9' and lower(alias) = lower('Dumbbell Floor Press (Tricep)'));
insert into exercise_aliases (exercise_id, alias) select 'cedfefce-bd8a-419a-8d0d-318176bcc2ef', 'Single Arm Dumbbell Press' where not exists (select 1 from exercise_aliases where exercise_id = 'cedfefce-bd8a-419a-8d0d-318176bcc2ef' and lower(alias) = lower('Single Arm Dumbbell Press'));
insert into exercise_aliases (exercise_id, alias) select '779c7b40-632a-4f42-b9a0-f149ab8dd72e', 'Hex Press' where not exists (select 1 from exercise_aliases where exercise_id = '779c7b40-632a-4f42-b9a0-f149ab8dd72e' and lower(alias) = lower('Hex Press'));
insert into exercise_aliases (exercise_id, alias) select 'd40a2b62-2449-42b3-970b-d3ead6ede62d', 'Svend Press' where not exists (select 1 from exercise_aliases where exercise_id = 'd40a2b62-2449-42b3-970b-d3ead6ede62d' and lower(alias) = lower('Svend Press'));
insert into exercise_aliases (exercise_id, alias) select 'd40a2b62-2449-42b3-970b-d3ead6ede62d', 'plate squeeze press' where not exists (select 1 from exercise_aliases where exercise_id = 'd40a2b62-2449-42b3-970b-d3ead6ede62d' and lower(alias) = lower('plate squeeze press'));
insert into exercise_aliases (exercise_id, alias) select '31f7d1ac-03b4-4706-bdb5-41abdb9f147a', 'Machine Chest Press' where not exists (select 1 from exercise_aliases where exercise_id = '31f7d1ac-03b4-4706-bdb5-41abdb9f147a' and lower(alias) = lower('Machine Chest Press'));
insert into exercise_aliases (exercise_id, alias) select '73d1a135-7aa1-42b1-9745-b475a2f20a56', 'Resistance Band Chest Press' where not exists (select 1 from exercise_aliases where exercise_id = '73d1a135-7aa1-42b1-9745-b475a2f20a56' and lower(alias) = lower('Resistance Band Chest Press'));
insert into exercise_aliases (exercise_id, alias) select '78272845-eaad-4301-bb5a-e9b38a0a851a', 'Single Arm Cable Press' where not exists (select 1 from exercise_aliases where exercise_id = '78272845-eaad-4301-bb5a-e9b38a0a851a' and lower(alias) = lower('Single Arm Cable Press'));
insert into exercise_aliases (exercise_id, alias) select 'b30230b1-abdf-4cf0-8876-23a96cd74338', 'Dumbbell Chest Fly' where not exists (select 1 from exercise_aliases where exercise_id = 'b30230b1-abdf-4cf0-8876-23a96cd74338' and lower(alias) = lower('Dumbbell Chest Fly'));
insert into exercise_aliases (exercise_id, alias) select '113e0ec8-1a57-43d4-8997-b42e30c82573', 'Incline Dumbbell Fly' where not exists (select 1 from exercise_aliases where exercise_id = '113e0ec8-1a57-43d4-8997-b42e30c82573' and lower(alias) = lower('Incline Dumbbell Fly'));
insert into exercise_aliases (exercise_id, alias) select 'ffd066fb-1b17-47b9-a6fd-61bdd3f7c933', 'Pec Deck Machine' where not exists (select 1 from exercise_aliases where exercise_id = 'ffd066fb-1b17-47b9-a6fd-61bdd3f7c933' and lower(alias) = lower('Pec Deck Machine'));
insert into exercise_aliases (exercise_id, alias) select 'ffd066fb-1b17-47b9-a6fd-61bdd3f7c933', 'pec deck' where not exists (select 1 from exercise_aliases where exercise_id = 'ffd066fb-1b17-47b9-a6fd-61bdd3f7c933' and lower(alias) = lower('pec deck'));
insert into exercise_aliases (exercise_id, alias) select '7ebe0401-baea-441f-b403-26ff7329cb1b', 'Cable Chest Fly (Mid)' where not exists (select 1 from exercise_aliases where exercise_id = '7ebe0401-baea-441f-b403-26ff7329cb1b' and lower(alias) = lower('Cable Chest Fly (Mid)'));
insert into exercise_aliases (exercise_id, alias) select '7ebe0401-baea-441f-b403-26ff7329cb1b', 'cable crossover' where not exists (select 1 from exercise_aliases where exercise_id = '7ebe0401-baea-441f-b403-26ff7329cb1b' and lower(alias) = lower('cable crossover'));
insert into exercise_aliases (exercise_id, alias) select '0b45e6ab-295a-4450-a019-30c5a0f7cb16', 'Cable Chest Fly (High to Low)' where not exists (select 1 from exercise_aliases where exercise_id = '0b45e6ab-295a-4450-a019-30c5a0f7cb16' and lower(alias) = lower('Cable Chest Fly (High to Low)'));
insert into exercise_aliases (exercise_id, alias) select '73b834d8-99e3-4d57-ae55-2d0ec94b0446', 'Cable Chest Fly (Low to High)' where not exists (select 1 from exercise_aliases where exercise_id = '73b834d8-99e3-4d57-ae55-2d0ec94b0446' and lower(alias) = lower('Cable Chest Fly (Low to High)'));
insert into exercise_aliases (exercise_id, alias) select '2a1bac1b-8c44-43c8-a926-4e325a0c3d22', 'TRX Chest Fly' where not exists (select 1 from exercise_aliases where exercise_id = '2a1bac1b-8c44-43c8-a926-4e325a0c3d22' and lower(alias) = lower('TRX Chest Fly'));
insert into exercise_aliases (exercise_id, alias) select '05aa059a-abba-40c9-9212-df6c694e8f5f', 'Tricep Pushup' where not exists (select 1 from exercise_aliases where exercise_id = '05aa059a-abba-40c9-9212-df6c694e8f5f' and lower(alias) = lower('Tricep Pushup'));
insert into exercise_aliases (exercise_id, alias) select '05aa059a-abba-40c9-9212-df6c694e8f5f', 'tricep push up' where not exists (select 1 from exercise_aliases where exercise_id = '05aa059a-abba-40c9-9212-df6c694e8f5f' and lower(alias) = lower('tricep push up'));
insert into exercise_aliases (exercise_id, alias) select '47219adf-2be8-40ca-8ad9-061f3facb3fb', 'Push Up with Band' where not exists (select 1 from exercise_aliases where exercise_id = '47219adf-2be8-40ca-8ad9-061f3facb3fb' and lower(alias) = lower('Push Up with Band'));
insert into exercise_aliases (exercise_id, alias) select '771fc2d8-4348-4bea-ac2e-bdf36cddc69a', 'TRX Push Up' where not exists (select 1 from exercise_aliases where exercise_id = '771fc2d8-4348-4bea-ac2e-bdf36cddc69a' and lower(alias) = lower('TRX Push Up'));
insert into exercise_aliases (exercise_id, alias) select '30de57d6-8a0a-4a98-a712-aba71bd241a2', 'Dips (Chest Focus)' where not exists (select 1 from exercise_aliases where exercise_id = '30de57d6-8a0a-4a98-a712-aba71bd241a2' and lower(alias) = lower('Dips (Chest Focus)'));
insert into exercise_aliases (exercise_id, alias) select '30de57d6-8a0a-4a98-a712-aba71bd241a2', 'dips' where not exists (select 1 from exercise_aliases where exercise_id = '30de57d6-8a0a-4a98-a712-aba71bd241a2' and lower(alias) = lower('dips'));
insert into exercise_aliases (exercise_id, alias) select '8b30b703-5a06-4b6c-b97c-b3493bada16c', 'Single Arm Lat Pulldown' where not exists (select 1 from exercise_aliases where exercise_id = '8b30b703-5a06-4b6c-b97c-b3493bada16c' and lower(alias) = lower('Single Arm Lat Pulldown'));
insert into exercise_aliases (exercise_id, alias) select '3ebcaea4-a0e1-4415-bbcb-8c898cd3317b', 'Cable Row with Rotation' where not exists (select 1 from exercise_aliases where exercise_id = '3ebcaea4-a0e1-4415-bbcb-8c898cd3317b' and lower(alias) = lower('Cable Row with Rotation'));
insert into exercise_aliases (exercise_id, alias) select '86f7874a-9b57-4be6-bb75-d81761395368', 'Machine Row' where not exists (select 1 from exercise_aliases where exercise_id = '86f7874a-9b57-4be6-bb75-d81761395368' and lower(alias) = lower('Machine Row'));
insert into exercise_aliases (exercise_id, alias) select '725495fe-015e-44c4-baba-656a8bb4712b', 'Barbell Row (Bent Over)' where not exists (select 1 from exercise_aliases where exercise_id = '725495fe-015e-44c4-baba-656a8bb4712b' and lower(alias) = lower('Barbell Row (Bent Over)'));
insert into exercise_aliases (exercise_id, alias) select '60ff1bfb-9a14-4421-bb75-2e067b521608', 'Underhand Barbell Row' where not exists (select 1 from exercise_aliases where exercise_id = '60ff1bfb-9a14-4421-bb75-2e067b521608' and lower(alias) = lower('Underhand Barbell Row'));
insert into exercise_aliases (exercise_id, alias) select '3a9ee493-b68f-4c6d-bda4-ae7a0827f575', 'Pendlay Row' where not exists (select 1 from exercise_aliases where exercise_id = '3a9ee493-b68f-4c6d-bda4-ae7a0827f575' and lower(alias) = lower('Pendlay Row'));
insert into exercise_aliases (exercise_id, alias) select '8f9a851f-344f-4ddd-b4bd-09543b51ee30', 'Yates Row' where not exists (select 1 from exercise_aliases where exercise_id = '8f9a851f-344f-4ddd-b4bd-09543b51ee30' and lower(alias) = lower('Yates Row'));
insert into exercise_aliases (exercise_id, alias) select '92872783-8ddd-49fc-a4f2-ceb212088c25', 'Seal Row' where not exists (select 1 from exercise_aliases where exercise_id = '92872783-8ddd-49fc-a4f2-ceb212088c25' and lower(alias) = lower('Seal Row'));
insert into exercise_aliases (exercise_id, alias) select 'ad3dc073-dc7c-44b2-bcd5-bf32fada4e14', 'Smith Machine Row' where not exists (select 1 from exercise_aliases where exercise_id = 'ad3dc073-dc7c-44b2-bcd5-bf32fada4e14' and lower(alias) = lower('Smith Machine Row'));
insert into exercise_aliases (exercise_id, alias) select '067338c4-0b2b-4b84-9114-29a360ed9cb1', 'Dumbbell Row (Single Arm)' where not exists (select 1 from exercise_aliases where exercise_id = '067338c4-0b2b-4b84-9114-29a360ed9cb1' and lower(alias) = lower('Dumbbell Row (Single Arm)'));
insert into exercise_aliases (exercise_id, alias) select '067338c4-0b2b-4b84-9114-29a360ed9cb1', 'dumbbell row' where not exists (select 1 from exercise_aliases where exercise_id = '067338c4-0b2b-4b84-9114-29a360ed9cb1' and lower(alias) = lower('dumbbell row'));
insert into exercise_aliases (exercise_id, alias) select 'ef77a6c8-1215-472f-8418-c0a18e0e16d6', 'Chest Supported Dumbbell Row' where not exists (select 1 from exercise_aliases where exercise_id = 'ef77a6c8-1215-472f-8418-c0a18e0e16d6' and lower(alias) = lower('Chest Supported Dumbbell Row'));
insert into exercise_aliases (exercise_id, alias) select 'c4a897b1-d3a5-443c-9ea6-1df12ee818d9', 'Meadows Row' where not exists (select 1 from exercise_aliases where exercise_id = 'c4a897b1-d3a5-443c-9ea6-1df12ee818d9' and lower(alias) = lower('Meadows Row'));
insert into exercise_aliases (exercise_id, alias) select 'f3c903d9-62c9-46f4-a22d-505ae4a64c2d', 'Renegade Row' where not exists (select 1 from exercise_aliases where exercise_id = 'f3c903d9-62c9-46f4-a22d-505ae4a64c2d' and lower(alias) = lower('Renegade Row'));
insert into exercise_aliases (exercise_id, alias) select 'f1b9341f-3dee-488c-8a9e-f4761b0e2ece', 'Inverted Row (Bodyweight)' where not exists (select 1 from exercise_aliases where exercise_id = 'f1b9341f-3dee-488c-8a9e-f4761b0e2ece' and lower(alias) = lower('Inverted Row (Bodyweight)'));
insert into exercise_aliases (exercise_id, alias) select '87e25d69-33ac-4e31-ada6-9800d7688d57', 'Romanian Deadlift to Bent Over Row' where not exists (select 1 from exercise_aliases where exercise_id = '87e25d69-33ac-4e31-ada6-9800d7688d57' and lower(alias) = lower('Romanian Deadlift to Bent Over Row'));
insert into exercise_aliases (exercise_id, alias) select 'c456acd7-20c3-4f24-9518-f508544833db', 'Straight Arm Pulldown' where not exists (select 1 from exercise_aliases where exercise_id = 'c456acd7-20c3-4f24-9518-f508544833db' and lower(alias) = lower('Straight Arm Pulldown'));
insert into exercise_aliases (exercise_id, alias) select 'e74039d9-2cb7-412c-9f27-e603d2aff5f0', 'Dumbbell Pull Over' where not exists (select 1 from exercise_aliases where exercise_id = 'e74039d9-2cb7-412c-9f27-e603d2aff5f0' and lower(alias) = lower('Dumbbell Pull Over'));
insert into exercise_aliases (exercise_id, alias) select 'fddeebb0-3822-492e-90b0-a3ac42a6877e', 'Barbell Pull Over' where not exists (select 1 from exercise_aliases where exercise_id = 'fddeebb0-3822-492e-90b0-a3ac42a6877e' and lower(alias) = lower('Barbell Pull Over'));
insert into exercise_aliases (exercise_id, alias) select '55fd2fc5-bccd-4ef0-964f-802e97eb9b1f', 'Cable Pull Over' where not exists (select 1 from exercise_aliases where exercise_id = '55fd2fc5-bccd-4ef0-964f-802e97eb9b1f' and lower(alias) = lower('Cable Pull Over'));
insert into exercise_aliases (exercise_id, alias) select 'c81bc3ec-b215-40c0-b712-1a9f5edcf609', 'Face Pull' where not exists (select 1 from exercise_aliases where exercise_id = 'c81bc3ec-b215-40c0-b712-1a9f5edcf609' and lower(alias) = lower('Face Pull'));
insert into exercise_aliases (exercise_id, alias) select 'b617b892-fb96-4ae9-9749-8309a3ba66e6', 'Rack Pull' where not exists (select 1 from exercise_aliases where exercise_id = 'b617b892-fb96-4ae9-9749-8309a3ba66e6' and lower(alias) = lower('Rack Pull'));
insert into exercise_aliases (exercise_id, alias) select 'd068a08a-5142-4405-acca-a46879c66f5e', '45 Degree Back Extension' where not exists (select 1 from exercise_aliases where exercise_id = 'd068a08a-5142-4405-acca-a46879c66f5e' and lower(alias) = lower('45 Degree Back Extension'));
insert into exercise_aliases (exercise_id, alias) select 'd068a08a-5142-4405-acca-a46879c66f5e', 'hyperextension' where not exists (select 1 from exercise_aliases where exercise_id = 'd068a08a-5142-4405-acca-a46879c66f5e' and lower(alias) = lower('hyperextension'));
insert into exercise_aliases (exercise_id, alias) select 'd068a08a-5142-4405-acca-a46879c66f5e', 'roman chair' where not exists (select 1 from exercise_aliases where exercise_id = 'd068a08a-5142-4405-acca-a46879c66f5e' and lower(alias) = lower('roman chair'));
insert into exercise_aliases (exercise_id, alias) select '6eb31aa4-5a4c-412f-8e92-da3a75acc74f', 'Good Morning' where not exists (select 1 from exercise_aliases where exercise_id = '6eb31aa4-5a4c-412f-8e92-da3a75acc74f' and lower(alias) = lower('Good Morning'));
insert into exercise_aliases (exercise_id, alias) select 'd91f5d54-acb2-443a-b16f-88dfb84b1361', 'Barbell Overhead Press' where not exists (select 1 from exercise_aliases where exercise_id = 'd91f5d54-acb2-443a-b16f-88dfb84b1361' and lower(alias) = lower('Barbell Overhead Press'));
insert into exercise_aliases (exercise_id, alias) select 'd91f5d54-acb2-443a-b16f-88dfb84b1361', 'military press' where not exists (select 1 from exercise_aliases where exercise_id = 'd91f5d54-acb2-443a-b16f-88dfb84b1361' and lower(alias) = lower('military press'));
insert into exercise_aliases (exercise_id, alias) select 'd91f5d54-acb2-443a-b16f-88dfb84b1361', 'OHP' where not exists (select 1 from exercise_aliases where exercise_id = 'd91f5d54-acb2-443a-b16f-88dfb84b1361' and lower(alias) = lower('OHP'));
insert into exercise_aliases (exercise_id, alias) select '065d100e-e6b9-4077-9484-1414cb0f2bc7', 'Seated Barbell Press' where not exists (select 1 from exercise_aliases where exercise_id = '065d100e-e6b9-4077-9484-1414cb0f2bc7' and lower(alias) = lower('Seated Barbell Press'));
insert into exercise_aliases (exercise_id, alias) select '011eddc8-e378-47c0-9577-8e7035e0142b', 'Smith Machine Overhead Press' where not exists (select 1 from exercise_aliases where exercise_id = '011eddc8-e378-47c0-9577-8e7035e0142b' and lower(alias) = lower('Smith Machine Overhead Press'));
insert into exercise_aliases (exercise_id, alias) select '1b529a87-8eab-4327-aa0a-215e0fc8e4d4', 'Push Press' where not exists (select 1 from exercise_aliases where exercise_id = '1b529a87-8eab-4327-aa0a-215e0fc8e4d4' and lower(alias) = lower('Push Press'));
insert into exercise_aliases (exercise_id, alias) select '70aae49b-ee2e-4f52-96c6-ac74d42603fd', 'Dumbbell Shoulder Press' where not exists (select 1 from exercise_aliases where exercise_id = '70aae49b-ee2e-4f52-96c6-ac74d42603fd' and lower(alias) = lower('Dumbbell Shoulder Press'));
insert into exercise_aliases (exercise_id, alias) select '70aae49b-ee2e-4f52-96c6-ac74d42603fd', 'dumbbell shoulder press' where not exists (select 1 from exercise_aliases where exercise_id = '70aae49b-ee2e-4f52-96c6-ac74d42603fd' and lower(alias) = lower('dumbbell shoulder press'));
insert into exercise_aliases (exercise_id, alias) select '2aec7c6d-5962-4d3a-896b-34e60c03cabf', 'Arnold Press' where not exists (select 1 from exercise_aliases where exercise_id = '2aec7c6d-5962-4d3a-896b-34e60c03cabf' and lower(alias) = lower('Arnold Press'));
insert into exercise_aliases (exercise_id, alias) select '2aec7c6d-5962-4d3a-896b-34e60c03cabf', 'arnold press' where not exists (select 1 from exercise_aliases where exercise_id = '2aec7c6d-5962-4d3a-896b-34e60c03cabf' and lower(alias) = lower('arnold press'));
insert into exercise_aliases (exercise_id, alias) select 'b929fdc6-3e89-4cb4-826a-9b9d8fb8519f', 'Machine Shoulder Press' where not exists (select 1 from exercise_aliases where exercise_id = 'b929fdc6-3e89-4cb4-826a-9b9d8fb8519f' and lower(alias) = lower('Machine Shoulder Press'));
insert into exercise_aliases (exercise_id, alias) select '956a47ad-a3a4-4ba9-9cae-b169ff066318', 'Bradford Press' where not exists (select 1 from exercise_aliases where exercise_id = '956a47ad-a3a4-4ba9-9cae-b169ff066318' and lower(alias) = lower('Bradford Press'));
insert into exercise_aliases (exercise_id, alias) select '554eba5c-f038-48d3-a5ce-e26b45ecfb1c', 'Cuban Press' where not exists (select 1 from exercise_aliases where exercise_id = '554eba5c-f038-48d3-a5ce-e26b45ecfb1c' and lower(alias) = lower('Cuban Press'));
insert into exercise_aliases (exercise_id, alias) select 'a441fa1b-9f43-4710-b471-eabef4f1474d', 'Dumbbell Lateral Raise' where not exists (select 1 from exercise_aliases where exercise_id = 'a441fa1b-9f43-4710-b471-eabef4f1474d' and lower(alias) = lower('Dumbbell Lateral Raise'));
insert into exercise_aliases (exercise_id, alias) select 'a441fa1b-9f43-4710-b471-eabef4f1474d', 'lateral raise' where not exists (select 1 from exercise_aliases where exercise_id = 'a441fa1b-9f43-4710-b471-eabef4f1474d' and lower(alias) = lower('lateral raise'));
insert into exercise_aliases (exercise_id, alias) select 'a441fa1b-9f43-4710-b471-eabef4f1474d', 'side raise' where not exists (select 1 from exercise_aliases where exercise_id = 'a441fa1b-9f43-4710-b471-eabef4f1474d' and lower(alias) = lower('side raise'));
insert into exercise_aliases (exercise_id, alias) select '673ddd49-9800-4243-b892-03e2d4279f2f', 'Seated Dumbbell Lateral Raise' where not exists (select 1 from exercise_aliases where exercise_id = '673ddd49-9800-4243-b892-03e2d4279f2f' and lower(alias) = lower('Seated Dumbbell Lateral Raise'));
insert into exercise_aliases (exercise_id, alias) select '411bce2c-c354-4ff6-8355-0df94c2c56f9', 'Cable Lateral Raise' where not exists (select 1 from exercise_aliases where exercise_id = '411bce2c-c354-4ff6-8355-0df94c2c56f9' and lower(alias) = lower('Cable Lateral Raise'));
insert into exercise_aliases (exercise_id, alias) select '6e993881-febc-4275-81a4-8fd99b98544f', 'Machine Lateral Raise' where not exists (select 1 from exercise_aliases where exercise_id = '6e993881-febc-4275-81a4-8fd99b98544f' and lower(alias) = lower('Machine Lateral Raise'));
insert into exercise_aliases (exercise_id, alias) select '630e5bea-8af8-40e4-93c7-f34c5889dd97', 'Dumbbell Front Raise' where not exists (select 1 from exercise_aliases where exercise_id = '630e5bea-8af8-40e4-93c7-f34c5889dd97' and lower(alias) = lower('Dumbbell Front Raise'));
insert into exercise_aliases (exercise_id, alias) select '9d8fe29f-bc26-4b00-81c3-ff3a00416a35', 'Barbell Front Raise' where not exists (select 1 from exercise_aliases where exercise_id = '9d8fe29f-bc26-4b00-81c3-ff3a00416a35' and lower(alias) = lower('Barbell Front Raise'));
insert into exercise_aliases (exercise_id, alias) select 'f8d6c390-bf4b-441a-ba23-6aa335620510', 'Cable Front Raise' where not exists (select 1 from exercise_aliases where exercise_id = 'f8d6c390-bf4b-441a-ba23-6aa335620510' and lower(alias) = lower('Cable Front Raise'));
insert into exercise_aliases (exercise_id, alias) select '3d367de2-a110-45d9-8f8d-7ce148237cea', 'Plate Front Raise' where not exists (select 1 from exercise_aliases where exercise_id = '3d367de2-a110-45d9-8f8d-7ce148237cea' and lower(alias) = lower('Plate Front Raise'));
insert into exercise_aliases (exercise_id, alias) select '1c4ec577-6d41-4dea-bb3c-a2546a94ced1', 'Bus Driver' where not exists (select 1 from exercise_aliases where exercise_id = '1c4ec577-6d41-4dea-bb3c-a2546a94ced1' and lower(alias) = lower('Bus Driver'));
insert into exercise_aliases (exercise_id, alias) select 'd5f03299-953a-471a-b2f7-1e16c2850ecf', 'Bent Over Rear Delt Fly' where not exists (select 1 from exercise_aliases where exercise_id = 'd5f03299-953a-471a-b2f7-1e16c2850ecf' and lower(alias) = lower('Bent Over Rear Delt Fly'));
insert into exercise_aliases (exercise_id, alias) select 'd5f03299-953a-471a-b2f7-1e16c2850ecf', 'rear delt fly' where not exists (select 1 from exercise_aliases where exercise_id = 'd5f03299-953a-471a-b2f7-1e16c2850ecf' and lower(alias) = lower('rear delt fly'));
insert into exercise_aliases (exercise_id, alias) select 'db28097e-c3ba-4a3b-86d9-41a720d8cc3d', 'Cable Rear Delt Fly' where not exists (select 1 from exercise_aliases where exercise_id = 'db28097e-c3ba-4a3b-86d9-41a720d8cc3d' and lower(alias) = lower('Cable Rear Delt Fly'));
insert into exercise_aliases (exercise_id, alias) select 'db28097e-c3ba-4a3b-86d9-41a720d8cc3d', 'rear delt fly' where not exists (select 1 from exercise_aliases where exercise_id = 'db28097e-c3ba-4a3b-86d9-41a720d8cc3d' and lower(alias) = lower('rear delt fly'));
insert into exercise_aliases (exercise_id, alias) select 'f2099459-dde4-4c1d-8c24-c19b5f50d7b2', 'Reverse Pec Deck' where not exists (select 1 from exercise_aliases where exercise_id = 'f2099459-dde4-4c1d-8c24-c19b5f50d7b2' and lower(alias) = lower('Reverse Pec Deck'));
insert into exercise_aliases (exercise_id, alias) select 'f2099459-dde4-4c1d-8c24-c19b5f50d7b2', 'reverse pec deck' where not exists (select 1 from exercise_aliases where exercise_id = 'f2099459-dde4-4c1d-8c24-c19b5f50d7b2' and lower(alias) = lower('reverse pec deck'));
insert into exercise_aliases (exercise_id, alias) select 'f2099459-dde4-4c1d-8c24-c19b5f50d7b2', 'rear delt machine' where not exists (select 1 from exercise_aliases where exercise_id = 'f2099459-dde4-4c1d-8c24-c19b5f50d7b2' and lower(alias) = lower('rear delt machine'));
insert into exercise_aliases (exercise_id, alias) select 'f9852915-08dd-498b-8347-3e62a1e6e985', 'Cable Y Raise' where not exists (select 1 from exercise_aliases where exercise_id = 'f9852915-08dd-498b-8347-3e62a1e6e985' and lower(alias) = lower('Cable Y Raise'));
insert into exercise_aliases (exercise_id, alias) select '8724af43-0aca-478b-945a-38c71c745cad', 'Barbell Bicep Curl' where not exists (select 1 from exercise_aliases where exercise_id = '8724af43-0aca-478b-945a-38c71c745cad' and lower(alias) = lower('Barbell Bicep Curl'));
insert into exercise_aliases (exercise_id, alias) select '8724af43-0aca-478b-945a-38c71c745cad', 'barbell curl' where not exists (select 1 from exercise_aliases where exercise_id = '8724af43-0aca-478b-945a-38c71c745cad' and lower(alias) = lower('barbell curl'));
insert into exercise_aliases (exercise_id, alias) select '85f3cce1-2071-4004-a8be-3f7b5a53aacb', 'EZ Bar Curl' where not exists (select 1 from exercise_aliases where exercise_id = '85f3cce1-2071-4004-a8be-3f7b5a53aacb' and lower(alias) = lower('EZ Bar Curl'));
insert into exercise_aliases (exercise_id, alias) select '85f3cce1-2071-4004-a8be-3f7b5a53aacb', 'ez bar curl' where not exists (select 1 from exercise_aliases where exercise_id = '85f3cce1-2071-4004-a8be-3f7b5a53aacb' and lower(alias) = lower('ez bar curl'));
insert into exercise_aliases (exercise_id, alias) select 'b2f788b6-e4a4-4402-90d0-83ebd8050df9', 'Dumbbell Bicep Curl' where not exists (select 1 from exercise_aliases where exercise_id = 'b2f788b6-e4a4-4402-90d0-83ebd8050df9' and lower(alias) = lower('Dumbbell Bicep Curl'));
insert into exercise_aliases (exercise_id, alias) select 'b2f788b6-e4a4-4402-90d0-83ebd8050df9', 'dumbbell curl' where not exists (select 1 from exercise_aliases where exercise_id = 'b2f788b6-e4a4-4402-90d0-83ebd8050df9' and lower(alias) = lower('dumbbell curl'));
insert into exercise_aliases (exercise_id, alias) select 'b0824938-1505-4187-992a-ce9bf154e724', 'Alternating Dumbbell Curl' where not exists (select 1 from exercise_aliases where exercise_id = 'b0824938-1505-4187-992a-ce9bf154e724' and lower(alias) = lower('Alternating Dumbbell Curl'));
insert into exercise_aliases (exercise_id, alias) select '5e5165c5-9965-40cf-b0ea-14a4bd15ca44', 'Seated Dumbbell Curl' where not exists (select 1 from exercise_aliases where exercise_id = '5e5165c5-9965-40cf-b0ea-14a4bd15ca44' and lower(alias) = lower('Seated Dumbbell Curl'));
insert into exercise_aliases (exercise_id, alias) select '6e196516-9742-4bbc-92a1-424ca508a28a', 'Incline Dumbbell Curl' where not exists (select 1 from exercise_aliases where exercise_id = '6e196516-9742-4bbc-92a1-424ca508a28a' and lower(alias) = lower('Incline Dumbbell Curl'));
insert into exercise_aliases (exercise_id, alias) select '2c8b7f63-f597-41b2-a43e-f750b8e0c277', 'Spider Curl' where not exists (select 1 from exercise_aliases where exercise_id = '2c8b7f63-f597-41b2-a43e-f750b8e0c277' and lower(alias) = lower('Spider Curl'));
insert into exercise_aliases (exercise_id, alias) select '511ae802-2e6e-4fe9-8fd6-e6e09a43d01e', 'Concentration Curl' where not exists (select 1 from exercise_aliases where exercise_id = '511ae802-2e6e-4fe9-8fd6-e6e09a43d01e' and lower(alias) = lower('Concentration Curl'));
insert into exercise_aliases (exercise_id, alias) select 'f2b67c83-4c44-46d0-b32c-dda3ec4eac26', 'Cable Concentration Curl' where not exists (select 1 from exercise_aliases where exercise_id = 'f2b67c83-4c44-46d0-b32c-dda3ec4eac26' and lower(alias) = lower('Cable Concentration Curl'));
insert into exercise_aliases (exercise_id, alias) select 'c92d00c4-c159-48da-9efa-4c0c973c798e', 'Drag Curl' where not exists (select 1 from exercise_aliases where exercise_id = 'c92d00c4-c159-48da-9efa-4c0c973c798e' and lower(alias) = lower('Drag Curl'));
insert into exercise_aliases (exercise_id, alias) select '38b14568-9ae4-4ada-a15c-b62d6877ce41', '21s Curl' where not exists (select 1 from exercise_aliases where exercise_id = '38b14568-9ae4-4ada-a15c-b62d6877ce41' and lower(alias) = lower('21s Curl'));
insert into exercise_aliases (exercise_id, alias) select '38b14568-9ae4-4ada-a15c-b62d6877ce41', '21s curl' where not exists (select 1 from exercise_aliases where exercise_id = '38b14568-9ae4-4ada-a15c-b62d6877ce41' and lower(alias) = lower('21s curl'));
insert into exercise_aliases (exercise_id, alias) select 'f0f67a8f-295d-4c05-b5fc-42fa74a7c719', 'Zottman Curl' where not exists (select 1 from exercise_aliases where exercise_id = 'f0f67a8f-295d-4c05-b5fc-42fa74a7c719' and lower(alias) = lower('Zottman Curl'));
insert into exercise_aliases (exercise_id, alias) select 'c6400676-287b-4575-8bae-183af63d4554', 'Hammer Curl' where not exists (select 1 from exercise_aliases where exercise_id = 'c6400676-287b-4575-8bae-183af63d4554' and lower(alias) = lower('Hammer Curl'));
insert into exercise_aliases (exercise_id, alias) select 'c6400676-287b-4575-8bae-183af63d4554', 'hammer curl' where not exists (select 1 from exercise_aliases where exercise_id = 'c6400676-287b-4575-8bae-183af63d4554' and lower(alias) = lower('hammer curl'));
insert into exercise_aliases (exercise_id, alias) select '6026398e-06f7-4ce9-bd8e-40d1a85b80a5', 'Alternating Hammer Curl' where not exists (select 1 from exercise_aliases where exercise_id = '6026398e-06f7-4ce9-bd8e-40d1a85b80a5' and lower(alias) = lower('Alternating Hammer Curl'));
insert into exercise_aliases (exercise_id, alias) select '0279d501-2e65-43dd-9566-0d4128ac5118', 'Cross Body Hammer Curl' where not exists (select 1 from exercise_aliases where exercise_id = '0279d501-2e65-43dd-9566-0d4128ac5118' and lower(alias) = lower('Cross Body Hammer Curl'));
insert into exercise_aliases (exercise_id, alias) select '72c6eeff-0db4-4098-b430-0f44e35fd544', 'Cable Hammer Curl' where not exists (select 1 from exercise_aliases where exercise_id = '72c6eeff-0db4-4098-b430-0f44e35fd544' and lower(alias) = lower('Cable Hammer Curl'));
insert into exercise_aliases (exercise_id, alias) select 'dd347a13-614f-4c81-abae-10b35b84b5cb', 'Cable Bicep Curl' where not exists (select 1 from exercise_aliases where exercise_id = 'dd347a13-614f-4c81-abae-10b35b84b5cb' and lower(alias) = lower('Cable Bicep Curl'));
insert into exercise_aliases (exercise_id, alias) select 'dd347a13-614f-4c81-abae-10b35b84b5cb', 'cable curl' where not exists (select 1 from exercise_aliases where exercise_id = 'dd347a13-614f-4c81-abae-10b35b84b5cb' and lower(alias) = lower('cable curl'));
insert into exercise_aliases (exercise_id, alias) select '226fec88-2a83-40d6-b0d5-519af531c8d8', 'Cable Curl with Resistance Band' where not exists (select 1 from exercise_aliases where exercise_id = '226fec88-2a83-40d6-b0d5-519af531c8d8' and lower(alias) = lower('Cable Curl with Resistance Band'));
insert into exercise_aliases (exercise_id, alias) select '3d64aa46-58ea-4e6f-8232-d0d11fb20b94', 'Single Arm Cable Curl' where not exists (select 1 from exercise_aliases where exercise_id = '3d64aa46-58ea-4e6f-8232-d0d11fb20b94' and lower(alias) = lower('Single Arm Cable Curl'));
insert into exercise_aliases (exercise_id, alias) select 'ffb37c76-dad7-4ade-bf7a-cb1544e94910', 'Overhead Cable Curl' where not exists (select 1 from exercise_aliases where exercise_id = 'ffb37c76-dad7-4ade-bf7a-cb1544e94910' and lower(alias) = lower('Overhead Cable Curl'));
insert into exercise_aliases (exercise_id, alias) select '7c1ff01f-b6d2-4099-9738-061b6b3ceb1a', 'Bayesian Curl' where not exists (select 1 from exercise_aliases where exercise_id = '7c1ff01f-b6d2-4099-9738-061b6b3ceb1a' and lower(alias) = lower('Bayesian Curl'));
insert into exercise_aliases (exercise_id, alias) select '7a7d954b-f2d0-4e76-8ce3-4f1665080b16', 'Resistance Band Bicep Curl' where not exists (select 1 from exercise_aliases where exercise_id = '7a7d954b-f2d0-4e76-8ce3-4f1665080b16' and lower(alias) = lower('Resistance Band Bicep Curl'));
insert into exercise_aliases (exercise_id, alias) select '6254b4dc-183a-41a3-845d-8345b0959e6c', 'Machine Bicep Curl' where not exists (select 1 from exercise_aliases where exercise_id = '6254b4dc-183a-41a3-845d-8345b0959e6c' and lower(alias) = lower('Machine Bicep Curl'));
insert into exercise_aliases (exercise_id, alias) select '615e6070-6f61-4cce-805e-86adab02dd6c', 'TRX Bicep Curl' where not exists (select 1 from exercise_aliases where exercise_id = '615e6070-6f61-4cce-805e-86adab02dd6c' and lower(alias) = lower('TRX Bicep Curl'));
insert into exercise_aliases (exercise_id, alias) select 'b24841d2-0501-4cbb-88f5-56855b064bc9', 'EZ Bar Preacher Curl' where not exists (select 1 from exercise_aliases where exercise_id = 'b24841d2-0501-4cbb-88f5-56855b064bc9' and lower(alias) = lower('EZ Bar Preacher Curl'));
insert into exercise_aliases (exercise_id, alias) select 'f4e647d1-1ac1-4442-b9d8-f57c80661557', 'Machine Preacher Curl' where not exists (select 1 from exercise_aliases where exercise_id = 'f4e647d1-1ac1-4442-b9d8-f57c80661557' and lower(alias) = lower('Machine Preacher Curl'));
insert into exercise_aliases (exercise_id, alias) select '2c43b2cd-2a6d-4cdf-8f7a-9492fe0f85b3', 'Dumbbell Reverse Curl' where not exists (select 1 from exercise_aliases where exercise_id = '2c43b2cd-2a6d-4cdf-8f7a-9492fe0f85b3' and lower(alias) = lower('Dumbbell Reverse Curl'));
insert into exercise_aliases (exercise_id, alias) select 'ead886ef-9151-4172-af8f-586940a85313', 'Reverse Grip Pushdown' where not exists (select 1 from exercise_aliases where exercise_id = 'ead886ef-9151-4172-af8f-586940a85313' and lower(alias) = lower('Reverse Grip Pushdown'));
insert into exercise_aliases (exercise_id, alias) select 'e5ddc78c-7078-4fb5-9761-d3539f544ef2', 'Single Arm Pushdown' where not exists (select 1 from exercise_aliases where exercise_id = 'e5ddc78c-7078-4fb5-9761-d3539f544ef2' and lower(alias) = lower('Single Arm Pushdown'));
insert into exercise_aliases (exercise_id, alias) select '6214f69b-5c0d-47be-8e24-9f3123bfec05', 'Resistance Band Pushdown' where not exists (select 1 from exercise_aliases where exercise_id = '6214f69b-5c0d-47be-8e24-9f3123bfec05' and lower(alias) = lower('Resistance Band Pushdown'));
insert into exercise_aliases (exercise_id, alias) select 'c60d7621-8864-46a8-9d3e-cd95f3afd741', 'Cable Overhead Single Arm Extension' where not exists (select 1 from exercise_aliases where exercise_id = 'c60d7621-8864-46a8-9d3e-cd95f3afd741' and lower(alias) = lower('Cable Overhead Single Arm Extension'));
insert into exercise_aliases (exercise_id, alias) select '4aeff6aa-0fc4-4520-ae84-fc518946d37f', 'JM Press' where not exists (select 1 from exercise_aliases where exercise_id = '4aeff6aa-0fc4-4520-ae84-fc518946d37f' and lower(alias) = lower('JM Press'));
insert into exercise_aliases (exercise_id, alias) select 'b5c106b8-f9ad-4d29-969b-c7980ef1c228', 'Tate Press' where not exists (select 1 from exercise_aliases where exercise_id = 'b5c106b8-f9ad-4d29-969b-c7980ef1c228' and lower(alias) = lower('Tate Press'));
insert into exercise_aliases (exercise_id, alias) select 'f1444516-f782-4129-a428-869866c0162b', 'California Press' where not exists (select 1 from exercise_aliases where exercise_id = 'f1444516-f782-4129-a428-869866c0162b' and lower(alias) = lower('California Press'));
insert into exercise_aliases (exercise_id, alias) select '7b5250e8-277c-4923-a0ab-0a453ec1bf9a', 'Kickback (Dumbbell)' where not exists (select 1 from exercise_aliases where exercise_id = '7b5250e8-277c-4923-a0ab-0a453ec1bf9a' and lower(alias) = lower('Kickback (Dumbbell)'));
insert into exercise_aliases (exercise_id, alias) select '1801b27e-1862-4eae-bd74-f7145be6c524', 'Kickback (Cable)' where not exists (select 1 from exercise_aliases where exercise_id = '1801b27e-1862-4eae-bd74-f7145be6c524' and lower(alias) = lower('Kickback (Cable)'));
insert into exercise_aliases (exercise_id, alias) select '4b331043-33d3-4d2f-9157-5d34f5396356', 'TRX Tricep Extension' where not exists (select 1 from exercise_aliases where exercise_id = '4b331043-33d3-4d2f-9157-5d34f5396356' and lower(alias) = lower('TRX Tricep Extension'));
insert into exercise_aliases (exercise_id, alias) select 'b34f10ea-6b24-44dd-9765-2922bdbef68f', 'dips' where not exists (select 1 from exercise_aliases where exercise_id = 'b34f10ea-6b24-44dd-9765-2922bdbef68f' and lower(alias) = lower('dips'));
insert into exercise_aliases (exercise_id, alias) select '610b6a66-df5a-477b-9cce-468f6d764425', 'Machine Tricep Dip' where not exists (select 1 from exercise_aliases where exercise_id = '610b6a66-df5a-477b-9cce-468f6d764425' and lower(alias) = lower('Machine Tricep Dip'));
insert into exercise_aliases (exercise_id, alias) select 'fc69fa1b-5854-4ac5-8762-4680147ba03b', 'Back Squat' where not exists (select 1 from exercise_aliases where exercise_id = 'fc69fa1b-5854-4ac5-8762-4680147ba03b' and lower(alias) = lower('Back Squat'));
insert into exercise_aliases (exercise_id, alias) select 'fc69fa1b-5854-4ac5-8762-4680147ba03b', 'back squat' where not exists (select 1 from exercise_aliases where exercise_id = 'fc69fa1b-5854-4ac5-8762-4680147ba03b' and lower(alias) = lower('back squat'));
insert into exercise_aliases (exercise_id, alias) select 'fc69fa1b-5854-4ac5-8762-4680147ba03b', 'squat' where not exists (select 1 from exercise_aliases where exercise_id = 'fc69fa1b-5854-4ac5-8762-4680147ba03b' and lower(alias) = lower('squat'));
insert into exercise_aliases (exercise_id, alias) select 'f1a49f80-1329-4ab7-8895-7ff4ea3cb912', 'Pause Squat' where not exists (select 1 from exercise_aliases where exercise_id = 'f1a49f80-1329-4ab7-8895-7ff4ea3cb912' and lower(alias) = lower('Pause Squat'));
insert into exercise_aliases (exercise_id, alias) select 'f1a49f80-1329-4ab7-8895-7ff4ea3cb912', 'pause squat' where not exists (select 1 from exercise_aliases where exercise_id = 'f1a49f80-1329-4ab7-8895-7ff4ea3cb912' and lower(alias) = lower('pause squat'));
insert into exercise_aliases (exercise_id, alias) select 'e3f6155d-75cd-4b9c-93c7-185af9d60fd7', 'Front Squat' where not exists (select 1 from exercise_aliases where exercise_id = 'e3f6155d-75cd-4b9c-93c7-185af9d60fd7' and lower(alias) = lower('Front Squat'));
insert into exercise_aliases (exercise_id, alias) select '1ae30972-92d7-444c-8315-ca1b76eecbb5', 'Smith Machine Squat' where not exists (select 1 from exercise_aliases where exercise_id = '1ae30972-92d7-444c-8315-ca1b76eecbb5' and lower(alias) = lower('Smith Machine Squat'));
insert into exercise_aliases (exercise_id, alias) select '5214f87e-c4fe-44dc-a458-29653d76f025', 'Goblet Squat' where not exists (select 1 from exercise_aliases where exercise_id = '5214f87e-c4fe-44dc-a458-29653d76f025' and lower(alias) = lower('Goblet Squat'));
insert into exercise_aliases (exercise_id, alias) select '5214f87e-c4fe-44dc-a458-29653d76f025', 'goblet squat' where not exists (select 1 from exercise_aliases where exercise_id = '5214f87e-c4fe-44dc-a458-29653d76f025' and lower(alias) = lower('goblet squat'));
insert into exercise_aliases (exercise_id, alias) select '5214f87e-c4fe-44dc-a458-29653d76f025', 'kettlebell goblet squat' where not exists (select 1 from exercise_aliases where exercise_id = '5214f87e-c4fe-44dc-a458-29653d76f025' and lower(alias) = lower('kettlebell goblet squat'));
insert into exercise_aliases (exercise_id, alias) select 'ab62b9c6-513a-4c75-9971-9956e7a0d3b8', 'Dumbbell Squat' where not exists (select 1 from exercise_aliases where exercise_id = 'ab62b9c6-513a-4c75-9971-9956e7a0d3b8' and lower(alias) = lower('Dumbbell Squat'));
insert into exercise_aliases (exercise_id, alias) select '43837f3d-08b6-4d14-9c95-90c6ac449f49', 'Bodyweight Squat' where not exists (select 1 from exercise_aliases where exercise_id = '43837f3d-08b6-4d14-9c95-90c6ac449f49' and lower(alias) = lower('Bodyweight Squat'));
insert into exercise_aliases (exercise_id, alias) select '43837f3d-08b6-4d14-9c95-90c6ac449f49', 'air squat' where not exists (select 1 from exercise_aliases where exercise_id = '43837f3d-08b6-4d14-9c95-90c6ac449f49' and lower(alias) = lower('air squat'));
insert into exercise_aliases (exercise_id, alias) select 'db5e8e25-dd61-43a2-abd0-5bc2128aec00', 'Banded Squat' where not exists (select 1 from exercise_aliases where exercise_id = 'db5e8e25-dd61-43a2-abd0-5bc2128aec00' and lower(alias) = lower('Banded Squat'));
insert into exercise_aliases (exercise_id, alias) select 'b1139639-f825-4a3c-a7cb-ea8d3221eab8', 'Sumo Squat' where not exists (select 1 from exercise_aliases where exercise_id = 'b1139639-f825-4a3c-a7cb-ea8d3221eab8' and lower(alias) = lower('Sumo Squat'));
insert into exercise_aliases (exercise_id, alias) select '5c845402-3998-486e-92a7-e3af9fe29528', 'Overhead Squat' where not exists (select 1 from exercise_aliases where exercise_id = '5c845402-3998-486e-92a7-e3af9fe29528' and lower(alias) = lower('Overhead Squat'));
insert into exercise_aliases (exercise_id, alias) select '16d23e50-f585-4bca-8433-f2652b3d45cf', 'Zercher Squat' where not exists (select 1 from exercise_aliases where exercise_id = '16d23e50-f585-4bca-8433-f2652b3d45cf' and lower(alias) = lower('Zercher Squat'));
insert into exercise_aliases (exercise_id, alias) select '1ac05a3f-4077-48e5-84f6-f94462259561', 'Kettlebell Front Rack Squat' where not exists (select 1 from exercise_aliases where exercise_id = '1ac05a3f-4077-48e5-84f6-f94462259561' and lower(alias) = lower('Kettlebell Front Rack Squat'));
insert into exercise_aliases (exercise_id, alias) select 'e85c46b5-6554-44e7-adea-680014c7879c', 'Cyclist Squat' where not exists (select 1 from exercise_aliases where exercise_id = 'e85c46b5-6554-44e7-adea-680014c7879c' and lower(alias) = lower('Cyclist Squat'));
insert into exercise_aliases (exercise_id, alias) select 'e85c46b5-6554-44e7-adea-680014c7879c', 'heels elevated squat' where not exists (select 1 from exercise_aliases where exercise_id = 'e85c46b5-6554-44e7-adea-680014c7879c' and lower(alias) = lower('heels elevated squat'));
insert into exercise_aliases (exercise_id, alias) select '1e4efe01-5e88-4501-b28d-26417ce0c266', 'Spanish Squat' where not exists (select 1 from exercise_aliases where exercise_id = '1e4efe01-5e88-4501-b28d-26417ce0c266' and lower(alias) = lower('Spanish Squat'));
insert into exercise_aliases (exercise_id, alias) select 'a2e573da-2fe6-4949-b4ad-58e05b92910c', 'Belt Squat' where not exists (select 1 from exercise_aliases where exercise_id = 'a2e573da-2fe6-4949-b4ad-58e05b92910c' and lower(alias) = lower('Belt Squat'));
insert into exercise_aliases (exercise_id, alias) select '060b5fb8-dda2-477e-95da-3f547622f2a4', 'Pendulum Squat' where not exists (select 1 from exercise_aliases where exercise_id = '060b5fb8-dda2-477e-95da-3f547622f2a4' and lower(alias) = lower('Pendulum Squat'));
insert into exercise_aliases (exercise_id, alias) select '25bdbb9b-d7de-44d5-beef-153e2b7c919b', 'Leg Extension' where not exists (select 1 from exercise_aliases where exercise_id = '25bdbb9b-d7de-44d5-beef-153e2b7c919b' and lower(alias) = lower('Leg Extension'));
insert into exercise_aliases (exercise_id, alias) select '25bdbb9b-d7de-44d5-beef-153e2b7c919b', 'leg extension' where not exists (select 1 from exercise_aliases where exercise_id = '25bdbb9b-d7de-44d5-beef-153e2b7c919b' and lower(alias) = lower('leg extension'));
insert into exercise_aliases (exercise_id, alias) select 'b0cc736d-7124-4c2e-b332-bcf441176618', 'Single Leg Extension' where not exists (select 1 from exercise_aliases where exercise_id = 'b0cc736d-7124-4c2e-b332-bcf441176618' and lower(alias) = lower('Single Leg Extension'));
insert into exercise_aliases (exercise_id, alias) select '4f8e23d0-74dd-4613-9bde-076f27854a38', 'Leg Curl (Lying)' where not exists (select 1 from exercise_aliases where exercise_id = '4f8e23d0-74dd-4613-9bde-076f27854a38' and lower(alias) = lower('Leg Curl (Lying)'));
insert into exercise_aliases (exercise_id, alias) select '4f8e23d0-74dd-4613-9bde-076f27854a38', 'leg curl' where not exists (select 1 from exercise_aliases where exercise_id = '4f8e23d0-74dd-4613-9bde-076f27854a38' and lower(alias) = lower('leg curl'));
insert into exercise_aliases (exercise_id, alias) select '64931300-0287-4ae6-b8eb-405b1a36fb69', 'Leg Curl (Seated)' where not exists (select 1 from exercise_aliases where exercise_id = '64931300-0287-4ae6-b8eb-405b1a36fb69' and lower(alias) = lower('Leg Curl (Seated)'));
insert into exercise_aliases (exercise_id, alias) select '143d08dd-5bbc-4f35-a690-b450650d2476', 'lunge' where not exists (select 1 from exercise_aliases where exercise_id = '143d08dd-5bbc-4f35-a690-b450650d2476' and lower(alias) = lower('lunge'));
insert into exercise_aliases (exercise_id, alias) select '985a901c-c50d-474b-8c7d-a8bbe5cc552b', 'Lunge (Walking)' where not exists (select 1 from exercise_aliases where exercise_id = '985a901c-c50d-474b-8c7d-a8bbe5cc552b' and lower(alias) = lower('Lunge (Walking)'));
insert into exercise_aliases (exercise_id, alias) select 'f4875a14-41c9-4356-b6d9-95e8cc5cf7e6', 'Lunge (Stationary)' where not exists (select 1 from exercise_aliases where exercise_id = 'f4875a14-41c9-4356-b6d9-95e8cc5cf7e6' and lower(alias) = lower('Lunge (Stationary)'));
insert into exercise_aliases (exercise_id, alias) select 'cf198b69-85c3-4b87-a0bb-c6a37975e12a', 'split squat' where not exists (select 1 from exercise_aliases where exercise_id = 'cf198b69-85c3-4b87-a0bb-c6a37975e12a' and lower(alias) = lower('split squat'));
insert into exercise_aliases (exercise_id, alias) select 'cf198b69-85c3-4b87-a0bb-c6a37975e12a', 'rear foot elevated split squat' where not exists (select 1 from exercise_aliases where exercise_id = 'cf198b69-85c3-4b87-a0bb-c6a37975e12a' and lower(alias) = lower('rear foot elevated split squat'));
insert into exercise_aliases (exercise_id, alias) select '671c77d3-9106-4dac-9e2b-281a8b568d22', 'Romanian Split Squat' where not exists (select 1 from exercise_aliases where exercise_id = '671c77d3-9106-4dac-9e2b-281a8b568d22' and lower(alias) = lower('Romanian Split Squat'));
insert into exercise_aliases (exercise_id, alias) select '671c77d3-9106-4dac-9e2b-281a8b568d22', 'romanian split squat' where not exists (select 1 from exercise_aliases where exercise_id = '671c77d3-9106-4dac-9e2b-281a8b568d22' and lower(alias) = lower('romanian split squat'));
insert into exercise_aliases (exercise_id, alias) select '7934f543-19a5-4a14-b0a9-8dd5777a8d08', 'calf raise' where not exists (select 1 from exercise_aliases where exercise_id = '7934f543-19a5-4a14-b0a9-8dd5777a8d08' and lower(alias) = lower('calf raise'));
insert into exercise_aliases (exercise_id, alias) select 'bfe2632d-b63b-48f4-8a11-8b33fff93b08', 'Seated Calf Raise' where not exists (select 1 from exercise_aliases where exercise_id = 'bfe2632d-b63b-48f4-8a11-8b33fff93b08' and lower(alias) = lower('Seated Calf Raise'));
insert into exercise_aliases (exercise_id, alias) select 'bfe2632d-b63b-48f4-8a11-8b33fff93b08', 'seated calf raise' where not exists (select 1 from exercise_aliases where exercise_id = 'bfe2632d-b63b-48f4-8a11-8b33fff93b08' and lower(alias) = lower('seated calf raise'));
insert into exercise_aliases (exercise_id, alias) select '9038f8e6-fdde-4fb9-b8ad-d760da80ddb7', 'Smith Machine Calf Raise' where not exists (select 1 from exercise_aliases where exercise_id = '9038f8e6-fdde-4fb9-b8ad-d760da80ddb7' and lower(alias) = lower('Smith Machine Calf Raise'));
insert into exercise_aliases (exercise_id, alias) select 'af287eb7-0254-4cb5-b794-674b87fddb29', 'Resistance Band Calf Raise' where not exists (select 1 from exercise_aliases where exercise_id = 'af287eb7-0254-4cb5-b794-674b87fddb29' and lower(alias) = lower('Resistance Band Calf Raise'));
insert into exercise_aliases (exercise_id, alias) select '4673cec4-c545-4ea6-a680-95340fe5de12', 'Hack Squat Calf Raise' where not exists (select 1 from exercise_aliases where exercise_id = '4673cec4-c545-4ea6-a680-95340fe5de12' and lower(alias) = lower('Hack Squat Calf Raise'));
insert into exercise_aliases (exercise_id, alias) select '6235329a-fd15-4e69-9d9d-3b1e4aaa057a', 'Box Jump Calf Focus' where not exists (select 1 from exercise_aliases where exercise_id = '6235329a-fd15-4e69-9d9d-3b1e4aaa057a' and lower(alias) = lower('Box Jump Calf Focus'));
insert into exercise_aliases (exercise_id, alias) select '6f166b86-56f0-4eab-b768-beac33a01cb0', 'Farmer Walk on Toes' where not exists (select 1 from exercise_aliases where exercise_id = '6f166b86-56f0-4eab-b768-beac33a01cb0' and lower(alias) = lower('Farmer Walk on Toes'));
insert into exercise_aliases (exercise_id, alias) select '96b57614-ab21-4940-ba7b-68364e41d565', 'Deadlift (Conventional)' where not exists (select 1 from exercise_aliases where exercise_id = '96b57614-ab21-4940-ba7b-68364e41d565' and lower(alias) = lower('Deadlift (Conventional)'));
insert into exercise_aliases (exercise_id, alias) select '96b57614-ab21-4940-ba7b-68364e41d565', 'conventional deadlift' where not exists (select 1 from exercise_aliases where exercise_id = '96b57614-ab21-4940-ba7b-68364e41d565' and lower(alias) = lower('conventional deadlift'));
insert into exercise_aliases (exercise_id, alias) select '3658559d-5413-41f5-85d0-19db135bff1e', 'Deadlift (Sumo)' where not exists (select 1 from exercise_aliases where exercise_id = '3658559d-5413-41f5-85d0-19db135bff1e' and lower(alias) = lower('Deadlift (Sumo)'));
insert into exercise_aliases (exercise_id, alias) select 'b6f8ba7e-ccda-4786-b25d-e7c0140ea083', 'Trap Bar Deadlift' where not exists (select 1 from exercise_aliases where exercise_id = 'b6f8ba7e-ccda-4786-b25d-e7c0140ea083' and lower(alias) = lower('Trap Bar Deadlift'));
insert into exercise_aliases (exercise_id, alias) select 'b6f8ba7e-ccda-4786-b25d-e7c0140ea083', 'hex bar deadlift' where not exists (select 1 from exercise_aliases where exercise_id = 'b6f8ba7e-ccda-4786-b25d-e7c0140ea083' and lower(alias) = lower('hex bar deadlift'));
insert into exercise_aliases (exercise_id, alias) select 'a54227ad-380f-4f8b-b4b0-60ce169ddd8d', 'RDL' where not exists (select 1 from exercise_aliases where exercise_id = 'a54227ad-380f-4f8b-b4b0-60ce169ddd8d' and lower(alias) = lower('RDL'));
insert into exercise_aliases (exercise_id, alias) select 'eade1767-ee0e-48ce-b3a5-ca5ea65f8f69', 'single leg RDL' where not exists (select 1 from exercise_aliases where exercise_id = 'eade1767-ee0e-48ce-b3a5-ca5ea65f8f69' and lower(alias) = lower('single leg RDL'));
insert into exercise_aliases (exercise_id, alias) select '71bef927-df79-40d6-b96b-f2786b666b0b', 'Stiff Leg Deadlift' where not exists (select 1 from exercise_aliases where exercise_id = '71bef927-df79-40d6-b96b-f2786b666b0b' and lower(alias) = lower('Stiff Leg Deadlift'));
insert into exercise_aliases (exercise_id, alias) select '6c9b0acc-2185-40f4-b823-0cc231546a9e', 'hip thrust' where not exists (select 1 from exercise_aliases where exercise_id = '6c9b0acc-2185-40f4-b823-0cc231546a9e' and lower(alias) = lower('hip thrust'));
insert into exercise_aliases (exercise_id, alias) select 'b7537f43-7126-4067-a606-4a3a4042c116', 'Smith Machine Hip Thrust' where not exists (select 1 from exercise_aliases where exercise_id = 'b7537f43-7126-4067-a606-4a3a4042c116' and lower(alias) = lower('Smith Machine Hip Thrust'));
insert into exercise_aliases (exercise_id, alias) select 'bd7f84b9-31e8-4852-b390-57b337e19fdd', 'Banded Hip Thrust' where not exists (select 1 from exercise_aliases where exercise_id = 'bd7f84b9-31e8-4852-b390-57b337e19fdd' and lower(alias) = lower('Banded Hip Thrust'));
insert into exercise_aliases (exercise_id, alias) select 'a8a17823-09f4-4401-ade4-5a9b135a641c', 'Sumo Stance Hip Thrust' where not exists (select 1 from exercise_aliases where exercise_id = 'a8a17823-09f4-4401-ade4-5a9b135a641c' and lower(alias) = lower('Sumo Stance Hip Thrust'));
insert into exercise_aliases (exercise_id, alias) select 'c1573a1b-6265-4a7b-acb6-eb3189a42317', 'American Hip Thrust' where not exists (select 1 from exercise_aliases where exercise_id = 'c1573a1b-6265-4a7b-acb6-eb3189a42317' and lower(alias) = lower('American Hip Thrust'));
insert into exercise_aliases (exercise_id, alias) select 'cfd78a34-219a-4a78-a2f6-a2e8b81413d3', 'Cable Kickback' where not exists (select 1 from exercise_aliases where exercise_id = 'cfd78a34-219a-4a78-a2f6-a2e8b81413d3' and lower(alias) = lower('Cable Kickback'));
insert into exercise_aliases (exercise_id, alias) select 'cfd78a34-219a-4a78-a2f6-a2e8b81413d3', 'cable glute kickback' where not exists (select 1 from exercise_aliases where exercise_id = 'cfd78a34-219a-4a78-a2f6-a2e8b81413d3' and lower(alias) = lower('cable glute kickback'));
insert into exercise_aliases (exercise_id, alias) select '7dedf98a-f0e3-47bc-9942-8561c2b49d9b', 'Glute Kickback Machine' where not exists (select 1 from exercise_aliases where exercise_id = '7dedf98a-f0e3-47bc-9942-8561c2b49d9b' and lower(alias) = lower('Glute Kickback Machine'));
insert into exercise_aliases (exercise_id, alias) select '31ea2733-5e98-4f50-8749-07e0925597c7', 'Banded Hip Abduction Standing' where not exists (select 1 from exercise_aliases where exercise_id = '31ea2733-5e98-4f50-8749-07e0925597c7' and lower(alias) = lower('Banded Hip Abduction Standing'));
insert into exercise_aliases (exercise_id, alias) select '60e215c4-12ef-448a-a0f4-f56f8f2019a1', 'Hip Abduction with Band (Lying)' where not exists (select 1 from exercise_aliases where exercise_id = '60e215c4-12ef-448a-a0f4-f56f8f2019a1' and lower(alias) = lower('Hip Abduction with Band (Lying)'));
insert into exercise_aliases (exercise_id, alias) select '5eb9b9e6-6157-4a64-80e7-25f551e36291', 'Leg Raise (Lying)' where not exists (select 1 from exercise_aliases where exercise_id = '5eb9b9e6-6157-4a64-80e7-25f551e36291' and lower(alias) = lower('Leg Raise (Lying)'));
insert into exercise_aliases (exercise_id, alias) select 'b31f3f21-ffba-4019-85ea-c21f731538be', 'Pallof Press' where not exists (select 1 from exercise_aliases where exercise_id = 'b31f3f21-ffba-4019-85ea-c21f731538be' and lower(alias) = lower('Pallof Press'));
insert into exercise_aliases (exercise_id, alias) select '985240bc-fa45-4868-ad22-1ec524f20c17', 'woodchop' where not exists (select 1 from exercise_aliases where exercise_id = '985240bc-fa45-4868-ad22-1ec524f20c17' and lower(alias) = lower('woodchop'));
insert into exercise_aliases (exercise_id, alias) select 'aa25ae2c-392a-4a2e-b316-3276612e2b69', 'Windmill' where not exists (select 1 from exercise_aliases where exercise_id = 'aa25ae2c-392a-4a2e-b316-3276612e2b69' and lower(alias) = lower('Windmill'));
insert into exercise_aliases (exercise_id, alias) select '106e6ec0-8a7e-4a7a-ae33-ccc515cef9ac', 'Power Clean' where not exists (select 1 from exercise_aliases where exercise_id = '106e6ec0-8a7e-4a7a-ae33-ccc515cef9ac' and lower(alias) = lower('Power Clean'));
insert into exercise_aliases (exercise_id, alias) select '106e6ec0-8a7e-4a7a-ae33-ccc515cef9ac', 'power clean' where not exists (select 1 from exercise_aliases where exercise_id = '106e6ec0-8a7e-4a7a-ae33-ccc515cef9ac' and lower(alias) = lower('power clean'));
insert into exercise_aliases (exercise_id, alias) select '106e6ec0-8a7e-4a7a-ae33-ccc515cef9ac', 'clean' where not exists (select 1 from exercise_aliases where exercise_id = '106e6ec0-8a7e-4a7a-ae33-ccc515cef9ac' and lower(alias) = lower('clean'));
insert into exercise_aliases (exercise_id, alias) select '63b1a15c-6f5d-4e45-8a23-e5acf12f82ac', 'Hang Clean' where not exists (select 1 from exercise_aliases where exercise_id = '63b1a15c-6f5d-4e45-8a23-e5acf12f82ac' and lower(alias) = lower('Hang Clean'));
insert into exercise_aliases (exercise_id, alias) select '7a099b6b-2c6d-45fe-8c6b-ef2e97bbefcd', 'Clean Pull' where not exists (select 1 from exercise_aliases where exercise_id = '7a099b6b-2c6d-45fe-8c6b-ef2e97bbefcd' and lower(alias) = lower('Clean Pull'));
insert into exercise_aliases (exercise_id, alias) select 'cfaabcec-bf05-4fe8-91de-266e00e94370', 'Clean and Press' where not exists (select 1 from exercise_aliases where exercise_id = 'cfaabcec-bf05-4fe8-91de-266e00e94370' and lower(alias) = lower('Clean and Press'));
insert into exercise_aliases (exercise_id, alias) select '8c6a3cd5-88b9-43ab-9117-50240c094019', 'Thruster' where not exists (select 1 from exercise_aliases where exercise_id = '8c6a3cd5-88b9-43ab-9117-50240c094019' and lower(alias) = lower('Thruster'));
insert into exercise_aliases (exercise_id, alias) select '45c818e9-167e-40a1-8215-aeb56ad6e074', 'Dumbbell Thruster' where not exists (select 1 from exercise_aliases where exercise_id = '45c818e9-167e-40a1-8215-aeb56ad6e074' and lower(alias) = lower('Dumbbell Thruster'));
insert into exercise_aliases (exercise_id, alias) select 'a020f0ab-4b55-4cae-bab0-0205100291d3', 'Sumo Deadlift High Pull' where not exists (select 1 from exercise_aliases where exercise_id = 'a020f0ab-4b55-4cae-bab0-0205100291d3' and lower(alias) = lower('Sumo Deadlift High Pull'));
insert into exercise_aliases (exercise_id, alias) select '4b3f139f-d4b7-4254-8acd-922f4a655d52', 'Man Maker' where not exists (select 1 from exercise_aliases where exercise_id = '4b3f139f-d4b7-4254-8acd-922f4a655d52' and lower(alias) = lower('Man Maker'));
insert into exercise_aliases (exercise_id, alias) select '45c72100-eace-4e5d-a514-8833cb1c533d', 'Turkish Get Up' where not exists (select 1 from exercise_aliases where exercise_id = '45c72100-eace-4e5d-a514-8833cb1c533d' and lower(alias) = lower('Turkish Get Up'));
insert into exercise_aliases (exercise_id, alias) select '77f1f905-6f81-4be8-a8ee-eb00e7d29400', 'prowler' where not exists (select 1 from exercise_aliases where exercise_id = '77f1f905-6f81-4be8-a8ee-eb00e7d29400' and lower(alias) = lower('prowler'));
insert into exercise_aliases (exercise_id, alias) select '3f7d5881-2fdd-4db6-b951-7731612e97dc', 'farmers carry' where not exists (select 1 from exercise_aliases where exercise_id = '3f7d5881-2fdd-4db6-b951-7731612e97dc' and lower(alias) = lower('farmers carry'));
insert into exercise_aliases (exercise_id, alias) select '5a3db06f-e87f-4313-a6bc-f543b14cc9bf', 'assault bike' where not exists (select 1 from exercise_aliases where exercise_id = '5a3db06f-e87f-4313-a6bc-f543b14cc9bf' and lower(alias) = lower('assault bike'));
insert into exercise_aliases (exercise_id, alias) select '5a3db06f-e87f-4313-a6bc-f543b14cc9bf', 'air bike' where not exists (select 1 from exercise_aliases where exercise_id = '5a3db06f-e87f-4313-a6bc-f543b14cc9bf' and lower(alias) = lower('air bike'));
insert into exercise_aliases (exercise_id, alias) select '636a7397-5235-49c2-8d6c-29f4ea0a81c8', 'Row Machine Sprint' where not exists (select 1 from exercise_aliases where exercise_id = '636a7397-5235-49c2-8d6c-29f4ea0a81c8' and lower(alias) = lower('Row Machine Sprint'));
-- An alternative name that is another exercise's real name, or the same as its own name, is removed.
delete from exercise_aliases a using exercises e where e.is_global and lower(e.name) = lower(trim(a.alias));
-- Duplicate alternative names on the same exercise are removed.
delete from exercise_aliases a using exercise_aliases b where a.exercise_id = b.exercise_id and lower(trim(a.alias)) = lower(trim(b.alias)) and a.id > b.id;

commit;
