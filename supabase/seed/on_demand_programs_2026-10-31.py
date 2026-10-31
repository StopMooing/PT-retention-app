# Builds the on-demand program library as one SQL block. Exercise names must match the
# library exactly; the SQL raises (and inserts nothing) if any name is missing.
import json

COACH = '4e069296-5e11-4be3-9dc9-1e046f734f89'

def ex(name, sets, reps, rest, note=None):
    return dict(name=name, sets=sets, reps=reps, rest=rest, note=note)

BEG = ("Weeks 1 and 2: learn each movement and finish every set with 2 to 3 reps still in the tank. "
       "Weeks 3 and 4: when you hit the top of the rep range on every set, add a little weight next time. "
       "Rest a day between sessions.")
INT = ("Weeks 1 and 2: settle into the weights. Weeks 3 to 5: add 2.5 kg to the main lifts or 1 to 2 reps "
       "to the rest each week. Week 6: same weights, one less set on everything to recover.")
ADV = ("Weeks 1 to 3: build volume. Weeks 4 to 6: heavier, fewer reps on the main lifts. Week 7: push for "
       "your best sets. Week 8: deload, half the sets at about 70 percent, then start again.")

PROGRAMS = [
  # ---------- Beginner ----------
  dict(name="4-Week Beginner Full Body", level=BEG,
       desc="3 full body sessions a week on machines and dumbbells. The easiest place to start in the gym.", days=[
    ("Full Body A", [ex("Leg Press",3,"10-12",90,"Feet shoulder width, lower until knees reach about 90 degrees."), ex("Machine Chest Press",3,"10-12",90), ex("Lat Pulldown (Wide Grip)",3,"10-12",90,"Pull the bar to your upper chest, elbows down."), ex("Dumbbell Shoulder Press",2,"10-12",75), ex("Leg Curl (Seated)",2,"12",60), ex("Plank",3,"30s",45)]),
    ("Full Body B", [ex("Goblet Squat",3,"10",90,"Hold the dumbbell at your chest, sit between your heels."), ex("Dumbbell Bench Press",3,"10",90), ex("Seated Cable Row (Close Grip)",3,"10-12",75), ex("Romanian Deadlift (Dumbbell)",3,"10",90,"Soft knees, push your hips back, flat back."), ex("Dumbbell Lateral Raise",2,"12-15",60), ex("Dead Bug",3,"8 each side",45)]),
    ("Full Body C", [ex("Leg Press",3,"12",90), ex("Incline Dumbbell Press",3,"10",90), ex("Machine Row",3,"12",75), ex("Glute Bridge",3,"12",60,"Squeeze your glutes for a second at the top."), ex("Tricep Pushdown (Rope)",2,"12",60), ex("Dumbbell Bicep Curl",2,"12",60)]),
  ]),
  dict(name="4-Week Beginner Strength Basics", level=BEG,
       desc="3 sessions a week that teach the big barbell lifts: squat, bench, row and deadlift. Start light and own the technique.", days=[
    ("Strength A", [ex("Goblet Squat",3,"8",90), ex("Barbell Bench Press",3,"8",120,"Start with just the bar if it is new to you."), ex("Barbell Row (Bent Over)",3,"8",90), ex("Hip Thrust (Barbell)",3,"10",90), ex("Plank",3,"30s",45)]),
    ("Strength B", [ex("Trap Bar Deadlift",3,"6",120,"Stand tall in the middle of the bar, push the floor away."), ex("Dumbbell Shoulder Press",3,"8",90), ex("Lat Pulldown (Neutral Grip)",3,"10",75), ex("Reverse Lunge",2,"8 each leg",75), ex("Side Plank",2,"20s each side",45)]),
    ("Strength C", [ex("Back Squat",3,"8",120,"Bar on your upper back, sit down between your heels, chest up."), ex("Incline Dumbbell Press",3,"8",90), ex("Chest Supported Dumbbell Row",3,"10",75), ex("Romanian Deadlift (Barbell)",3,"8",90), ex("Farmers Walk",3,"30 m",60)]),
  ]),
  dict(name="4-Week Beginner Glutes and Legs", level=BEG,
       desc="3 sessions a week with an extra focus on glutes and legs, plus enough upper body to stay balanced.", days=[
    ("Glutes and Hamstrings", [ex("Hip Thrust (Barbell)",3,"10",90,"Chin tucked, ribs down, drive through your heels."), ex("Goblet Squat",3,"10",90), ex("Romanian Deadlift (Dumbbell)",3,"10",90), ex("Hip Abduction (Machine)",3,"15",60), ex("Lat Pulldown (Wide Grip)",3,"12",75)]),
    ("Legs and Upper", [ex("Leg Press",3,"12",90), ex("Reverse Lunge",3,"8 each leg",75), ex("Leg Curl (Seated)",3,"12",60), ex("Cable Kickback",2,"12 each leg",45), ex("Dumbbell Shoulder Press",3,"10",75), ex("Seated Cable Row (Close Grip)",3,"12",75)]),
    ("Glutes and Core", [ex("Glute Bridge",3,"15",60), ex("Bulgarian Split Squat",2,"8 each leg",90,"Back foot on a bench, most of your weight on the front leg."), ex("Step Up",2,"10 each leg",60), ex("Leg Extension",2,"15",60), ex("Machine Chest Press",3,"10",75), ex("Dead Bug",3,"8 each side",45)]),
  ]),
  dict(name="4-Week Beginner Dumbbell Only", level=BEG,
       desc="3 full body sessions that only need a set of dumbbells and a bench. Good for a busy gym or training at home.", days=[
    ("Dumbbell A", [ex("Goblet Squat",3,"10",90), ex("Dumbbell Bench Press",3,"10",90), ex("Dumbbell Row (Single Arm)",3,"10 each arm",75), ex("Romanian Deadlift (Dumbbell)",3,"10",90), ex("Dumbbell Lateral Raise",2,"12",60)]),
    ("Dumbbell B", [ex("Reverse Lunge",3,"8 each leg",75), ex("Dumbbell Shoulder Press",3,"10",90), ex("Chest Supported Dumbbell Row",3,"10",75), ex("Hip Thrust (Dumbbell)",3,"12",75), ex("Hammer Curl",2,"12",60), ex("Dead Bug",3,"8 each side",45)]),
    ("Dumbbell C", [ex("Dumbbell Squat",3,"10",90), ex("Incline Dumbbell Press",3,"10",90), ex("Renegade Row",3,"8 each arm",75), ex("Step Up",2,"10 each leg",60), ex("Overhead Tricep Extension (Dumbbell)",2,"12",60), ex("Plank",3,"30s",45)]),
  ]),
  # ---------- Intermediate ----------
  dict(name="6-Week Upper Lower Strength", level=INT,
       desc="4 days a week, upper and lower body twice each. Built around getting stronger on the main lifts.", days=[
    ("Upper A", [ex("Barbell Bench Press",4,"6-8",150), ex("Barbell Row (Bent Over)",4,"6-8",120), ex("Dumbbell Shoulder Press",3,"8-10",90), ex("Lat Pulldown (Wide Grip)",3,"10",90), ex("Skull Crusher (EZ Bar)",3,"10",60), ex("EZ Bar Curl",3,"10",60)]),
    ("Lower A", [ex("Back Squat",4,"6-8",150), ex("Romanian Deadlift (Barbell)",3,"8",120), ex("Leg Press",3,"10-12",90), ex("Leg Curl (Lying)",3,"12",60), ex("Standing Calf Raise",3,"12-15",60), ex("Hanging Knee Raise",3,"12",60)]),
    ("Upper B", [ex("Incline Dumbbell Press",4,"8-10",120), ex("Chest Supported T-Bar Row",4,"8-10",90), ex("Barbell Overhead Press",3,"6-8",120), ex("Seated Cable Row (Close Grip)",3,"10",75), ex("Dumbbell Lateral Raise",3,"12-15",60), ex("Hammer Curl",3,"12",60), ex("Tricep Pushdown (Rope)",3,"12",60)]),
    ("Lower B", [ex("Deadlift (Conventional)",4,"5",180,"Reset every rep. Stop the set if your back rounds."), ex("Bulgarian Split Squat",3,"8 each leg",90), ex("Hip Thrust (Barbell)",3,"10",90), ex("Leg Extension",3,"12-15",60), ex("Seated Calf Raise",3,"15",60), ex("Cable Crunch",3,"12",60)]),
  ]),
  dict(name="6-Week Push Pull Legs Upper", level=INT,
       desc="4 days a week aimed at building muscle: push, pull, legs, then a full upper day.", days=[
    ("Push", [ex("Barbell Bench Press",4,"8",120), ex("Incline Dumbbell Press",3,"10",90), ex("Machine Shoulder Press",3,"10",90), ex("Cable Lateral Raise",3,"15",45), ex("Cable Chest Fly (Mid)",3,"12",60), ex("Tricep Pushdown (Rope)",3,"12",60)]),
    ("Pull", [ex("Pull Up",4,"6-10",120,"Use the assisted machine if you can't get 6 yet."), ex("Barbell Row (Bent Over)",3,"8",90), ex("Seated Cable Row (Wide Grip)",3,"10",75), ex("Face Pull",3,"15",60), ex("Incline Dumbbell Curl",3,"10",60), ex("Hammer Curl",3,"12",60)]),
    ("Legs", [ex("Hack Squat (Machine)",4,"8-10",120), ex("Romanian Deadlift (Barbell)",3,"8",120), ex("Leg Press",3,"12",90), ex("Leg Curl (Seated)",3,"12",60), ex("Leg Extension",3,"15",60), ex("Standing Calf Raise",4,"12",60)]),
    ("Upper", [ex("Dumbbell Bench Press",3,"10",90), ex("Lat Pulldown (Neutral Grip)",3,"10",90), ex("Arnold Press",3,"10",75), ex("Chest Supported Dumbbell Row",3,"10",75), ex("Reverse Pec Deck",3,"15",45), ex("EZ Bar Curl",3,"10",60), ex("Overhead Tricep Extension (Cable)",3,"12",60)]),
  ]),
  dict(name="6-Week Glute and Lower Body Builder", level=INT,
       desc="4 days a week: two lower body days focused on glutes and legs, two upper days to keep you balanced.", days=[
    ("Glutes and Hamstrings", [ex("Hip Thrust (Barbell)",4,"8-10",120), ex("Romanian Deadlift (Barbell)",3,"8",120), ex("Bulgarian Split Squat",3,"10 each leg",90), ex("Cable Kickback",3,"12 each leg",45), ex("Hip Abduction (Machine)",3,"15-20",45)]),
    ("Upper A", [ex("Dumbbell Shoulder Press",3,"10",90), ex("Lat Pulldown (Wide Grip)",3,"10",75), ex("Incline Dumbbell Press",3,"10",90), ex("Seated Cable Row (Close Grip)",3,"12",75), ex("Dumbbell Lateral Raise",3,"15",45), ex("Plank",3,"40s",45)]),
    ("Quads and Glutes", [ex("Back Squat",4,"8",150), ex("Leg Press (Wide Stance)",3,"12",90), ex("Reverse Lunge",3,"10 each leg",75), ex("Leg Extension",3,"15",60), ex("Frog Pump",3,"20",45), ex("Seated Calf Raise",3,"15",45)]),
    ("Upper B", [ex("Machine Chest Press",3,"10",90), ex("Chest Supported Dumbbell Row",3,"10",75), ex("Cable Lateral Raise",3,"15",45), ex("Face Pull",3,"15",45), ex("Tricep Pushdown (Rope)",3,"12",60), ex("Dumbbell Bicep Curl",3,"12",60)]),
  ]),
  dict(name="6-Week Strength and Conditioning", level=INT,
       desc="4 days a week mixing strength work with conditioning finishers. Good for getting fitter and leaner while staying strong.", days=[
    ("Lower and Engine", [ex("Goblet Squat",4,"10",90), ex("Romanian Deadlift (Dumbbell)",3,"10",90), ex("Reverse Lunge",3,"10 each leg",75), ex("Kettlebell Swing",4,"15",60,"Snap your hips, let the bell float. Not a squat."), ex("Rowing Machine",1,"10 min",0,"Steady pace you could hold a conversation at.")]),
    ("Upper and Ropes", [ex("Dumbbell Bench Press",4,"10",90), ex("Lat Pulldown (Wide Grip)",3,"12",75), ex("Dumbbell Shoulder Press",3,"10",75), ex("Seated Cable Row (Close Grip)",3,"12",75), ex("Battle Ropes",4,"30s",45), ex("Mountain Climber",3,"30s",45)]),
    ("Full Body Circuit", [ex("Dumbbell Thruster",4,"10",75), ex("Renegade Row",3,"8 each arm",60), ex("Step Up",3,"10 each leg",60), ex("Push Up",3,"As many as you can",60), ex("Farmers Walk",4,"30 m",60), ex("Echo Bike",6,"20s hard",40,"20 seconds hard, 40 seconds easy.")]),
    ("Conditioning and Core", [ex("Sled Push",6,"20 m",60), ex("Medicine Ball Slam",4,"12",45), ex("Burpee",3,"10",60), ex("Dead Bug",3,"10 each side",45), ex("Side Plank",3,"30s each side",30), ex("Treadmill Walk (Incline)",1,"20 min",0)]),
  ]),
  # ---------- Advanced ----------
  dict(name="8-Week Powerbuilding", level=ADV,
       desc="5 days a week. Heavy squat, bench, deadlift and press days for strength, plus a fifth day for size.", days=[
    ("Squat Day", [ex("Back Squat",5,"3-5",180), ex("Pause Squat",3,"5",150,"2 second pause at the bottom."), ex("Romanian Deadlift (Barbell)",3,"8",120), ex("Leg Press",3,"10",90), ex("Leg Curl (Lying)",3,"12",60), ex("Standing Calf Raise",4,"10",60)]),
    ("Bench Day", [ex("Barbell Bench Press",5,"3-5",180), ex("Close Grip Bench Press",3,"6",120), ex("Incline Dumbbell Press",3,"10",90), ex("Cable Chest Fly (Mid)",3,"12",60), ex("Dumbbell Lateral Raise",4,"15",45), ex("Tricep Pushdown (Rope)",3,"12",60)]),
    ("Deadlift Day", [ex("Deadlift (Conventional)",5,"3",180), ex("Pendlay Row",4,"6",120), ex("Pull Up",4,"6-8",120,"Add weight once 8 clean reps feel easy."), ex("Chest Supported T-Bar Row",3,"10",90), ex("Face Pull",3,"15",45), ex("Barbell Bicep Curl",3,"10",60)]),
    ("Press Day", [ex("Barbell Overhead Press",5,"5",150), ex("Push Press",3,"3",150), ex("Dumbbell Shoulder Press",3,"10",90), ex("Cable Lateral Raise",3,"15",45), ex("Reverse Pec Deck",3,"15",45), ex("Skull Crusher (EZ Bar)",3,"10",60)]),
    ("Size Day", [ex("Hack Squat (Machine)",3,"10",90), ex("Hip Thrust (Barbell)",3,"10",90), ex("Lat Pulldown (Neutral Grip)",3,"12",75), ex("Machine Chest Press",3,"12",75), ex("Incline Dumbbell Curl",3,"12",60), ex("Hanging Leg Raise",3,"12",60)]),
  ]),
  dict(name="8-Week Push Pull Legs Upper Lower", level=ADV,
       desc="5 days a week of high-volume training to build muscle: push, pull, legs, upper, lower.", days=[
    ("Push", [ex("Incline Barbell Bench Press",4,"6-8",150), ex("Dumbbell Bench Press",3,"8-10",90), ex("Machine Shoulder Press",3,"8-10",90), ex("Cable Lateral Raise",4,"12-15",45), ex("Pec Deck Machine",3,"12-15",60), ex("Overhead Tricep Extension (Cable)",3,"10-12",60)]),
    ("Pull", [ex("Pull Up",4,"6-8",120), ex("Pendlay Row",4,"6-8",120), ex("Single Arm Lat Pulldown",3,"10 each arm",60), ex("Chest Supported Dumbbell Row",3,"10",75), ex("Reverse Pec Deck",3,"15",45), ex("Bayesian Curl",3,"12",60), ex("Hammer Curl",3,"10",60)]),
    ("Legs", [ex("Front Squat",4,"6",150), ex("Romanian Deadlift (Barbell)",4,"8",120), ex("Bulgarian Split Squat",3,"8 each leg",90), ex("Leg Extension",3,"12",60), ex("Leg Curl (Seated)",3,"12",60), ex("Seated Calf Raise",4,"12",45)]),
    ("Upper", [ex("Barbell Bench Press",4,"5",150), ex("Barbell Row (Bent Over)",4,"6",120), ex("Arnold Press",3,"10",75), ex("Lat Pulldown (Wide Grip)",3,"10",75), ex("Dips (Chest Focus)",3,"8-12",90), ex("EZ Bar Curl",3,"10",60)]),
    ("Lower", [ex("Deadlift (Conventional)",4,"4",180), ex("Hack Squat (Machine)",3,"10",120), ex("Hip Thrust (Barbell)",3,"8",90), ex("Nordic Curl",3,"5",90,"Lower as slowly as you can, use your hands to come back up."), ex("Standing Calf Raise",4,"10",45), ex("Ab Wheel Rollout",3,"10",60)]),
  ]),
  dict(name="8-Week Strength Peak", level=ADV,
       desc="4 heavy days a week on squat, bench, deadlift and overhead press, with just enough accessory work to support them.", days=[
    ("Squat", [ex("Back Squat",5,"5",180), ex("Front Squat",3,"5",150), ex("Good Morning",3,"8",90), ex("Leg Curl (Lying)",3,"10",60), ex("Weighted Plank",3,"30s",60)]),
    ("Bench", [ex("Barbell Bench Press",5,"5",180), ex("Floor Press (Barbell)",3,"5",150), ex("Barbell Row (Bent Over)",4,"6",120), ex("Dips (Chest Focus)",3,"8",90), ex("Face Pull",3,"15",45)]),
    ("Deadlift", [ex("Deadlift (Conventional)",5,"3",210), ex("Rack Pull",3,"4",150), ex("Pull Up",4,"6",120), ex("Hip Thrust (Barbell)",3,"8",90), ex("Hanging Leg Raise",3,"10",60)]),
    ("Press", [ex("Barbell Overhead Press",5,"5",150), ex("Push Press",4,"3",150), ex("Close Grip Bench Press",3,"6",120), ex("Chest Supported T-Bar Row",3,"8",90), ex("Farmers Walk",4,"30 m",90)]),
  ]),
  dict(name="8-Week Athletic Performance", level=ADV,
       desc="4 days a week for power, speed and conditioning as well as strength. For anyone who plays sport or wants to move like an athlete.", days=[
    ("Lower Power", [ex("Box Jump",4,"5",90,"Step down, don't jump down."), ex("Trap Bar Deadlift",4,"4",180), ex("Front Squat",3,"5",150), ex("Bulgarian Split Squat",3,"6 each leg",90), ex("Nordic Curl",3,"5",90), ex("Pallof Press",3,"10 each side",45)]),
    ("Upper Power", [ex("Medicine Ball Throw",4,"6",60), ex("Push Press",4,"4",150), ex("Pull Up",4,"6",120), ex("Dumbbell Bench Press",3,"8",90), ex("Renegade Row",3,"8 each arm",60), ex("Turkish Get Up",2,"3 each side",60)]),
    ("Speed and Conditioning", [ex("Sprints",6,"30 m",90,"Full effort, full recovery between runs."), ex("Sled Push",5,"20 m",90), ex("Broad Jump",4,"4",60), ex("Kettlebell Swing",4,"15",60), ex("Battle Ropes",4,"30s",45)]),
    ("Strength Endurance", [ex("Power Clean",5,"3",120,"Only if you know the lift. Otherwise swap for a Hang Clean."), ex("Back Squat",3,"8",120), ex("Chin Up",3,"8-10",90), ex("Lateral Lunge",3,"8 each leg",75), ex("Farmers Walk",4,"40 m",75), ex("Copenhagen Plank",3,"20s each side",45)]),
  ]),
]

def q(s):
    return "'" + s.replace("'", "''") + "'" if s is not None else 'null'

names = sorted({e['name'] for p in PROGRAMS for _, exs in p['days'] for e in exs})
lines = ["do $build$", "declare p uuid; w uuid; e uuid; missing text;", "begin"]
lines.append("  select string_agg(n, ', ') into missing from unnest(array[" + ", ".join(q(n) for n in names) + "]) n"
             " where not exists (select 1 from public.exercises x where x.name = n and (x.is_global or x.created_by = " + q(COACH) + "));")
lines.append("  if missing is not null then raise exception 'Missing exercises: %', missing; end if;")
lines.append("  if exists (select 1 from public.programs where is_on_demand and name in (" + ", ".join(q(p['name']) for p in PROGRAMS) + ")) then raise exception 'On-demand programs with these names already exist'; end if;")
for p in PROGRAMS:
    desc = p['desc'] + " " + p['level']
    lines.append(f"  insert into public.programs (name, description, created_by, is_on_demand, kind) values ({q(p['name'])}, {q(desc)}, {q(COACH)}, true, 'program') returning id into p;")
    for d, (dname, exs) in enumerate(p['days'], start=1):
        lines.append(f"  insert into public.program_workouts (program_id, day_number, name) values (p, {d}, {q(dname)}) returning id into w;")
        for i, e in enumerate(exs):
            lines.append(f"  select id into e from public.exercises where name = {q(e['name'])} and (is_global or created_by = {q(COACH)}) order by is_global desc, created_at limit 1;")
            lines.append(f"  insert into public.workout_exercises (program_workout_id, exercise_id, sets, reps, rest_seconds, notes, order_index) values (w, e, {e['sets']}, {q(e['reps'])}, {e['rest']}, {q(e['note'])}, {i});")
lines += ["end", "$build$;"]
sql = "\n".join(lines)
assert "—" not in sql
open('/tmp/claude-0/-home-claude/c2ec0e71-68e1-57ca-a086-38662a0bd17d/scratchpad/programs/build.sql', 'w').write(sql)
json.dump(names, open('/tmp/claude-0/-home-claude/c2ec0e71-68e1-57ca-a086-38662a0bd17d/scratchpad/programs/names.json', 'w'))
print(len(PROGRAMS), "programs,", sum(len(p['days']) for p in PROGRAMS), "workouts,", sum(len(x) for p in PROGRAMS for _, x in p['days']), "exercise rows,", len(names), "distinct exercises,", len(sql), "chars")

# Compact form: one atomic statement per level.
def batch(progs):
    pv = ",\n".join(f"({q(p['name'])}, {q(p['desc'] + ' ' + p['level'])})" for p in progs)
    rows = []
    for p in progs:
        for d, (dname, exs) in enumerate(p['days'], start=1):
            for i, e in enumerate(exs):
                rows.append(f"({q(p['name'])},{d},{q(dname)},{i},{q(e['name'])},{e['sets']},{q(e['reps'])},{e['rest']},{q(e['note'])})")
    return f"""with progspec(name, description) as (values
{pv}),
spec(prog, day, dname, ord, ex, sets, reps, rest, note) as (values
{",\n".join(rows)}),
progs as (
  insert into public.programs (name, description, created_by, is_on_demand, kind)
  select name, description, '{COACH}', true, 'program' from progspec
  returning id, name),
days as (
  insert into public.program_workouts (program_id, day_number, name)
  select distinct p.id, s.day, s.dname from spec s join progs p on p.name = s.prog
  returning id, program_id, day_number),
ins as (
  insert into public.workout_exercises (program_workout_id, exercise_id, sets, reps, rest_seconds, notes, order_index)
  select d.id, ex.id, s.sets, s.reps, s.rest, s.note, s.ord
  from spec s
  join progs p on p.name = s.prog
  join days d on d.program_id = p.id and d.day_number = s.day
  join lateral (select x.id from public.exercises x where x.name = s.ex and (x.is_global or x.created_by = '{COACH}') order by x.is_global desc, x.created_at limit 1) ex on true
  returning 1)
select (select count(*) from progs) programs, (select count(*) from days) workouts, (select count(*) from ins) exercises, (select count(*) from spec) expected_exercises;"""

for tag, sl in [('beg', PROGRAMS[0:4]), ('int', PROGRAMS[4:8]), ('adv', PROGRAMS[8:12])]:
    s = batch(sl); assert "—" not in s
    open(f'{tag}.sql', 'w').write(s); print(tag, len(s))
