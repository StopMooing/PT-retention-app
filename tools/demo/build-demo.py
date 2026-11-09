"""Builds the demo coach account's sample data: supabase/demo/demo_seed.sql.

Run: python3 tools/demo/build-demo.py
Then paste the SQL into the Supabase SQL Editor (it updates check-in dates, which the
safety check blocks elsewhere). Every date is relative to the day it is run (Adelaide),
so the demo always looks current. supabase/demo/demo_remove.sql takes it all out again.

Made-up people only. Their logins use @demo.unfnshd.app addresses and have no password,
so nobody can sign in as them.
"""
import json, random, re, uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
COACH = '9287e733-61a0-4b98-8452-afb80bc3129f'  # stopmooing+demo@gmail.com
NS = uuid.UUID('6d1c7e0a-5f0e-4e7a-9c55-0d3e5a1b2c3d')
rnd = random.Random(20261109)
PROGRAMS = {p['name']: p for p in json.load(open(ROOT / 'tools/demo/programs.json'))}


def uid(*parts):
    return str(uuid.uuid5(NS, '|'.join(str(p) for p in parts)))


def q(v):
    if v is None:
        return 'null'
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, Raw):
        return v.s
    return "'" + str(v).replace("'", "''") + "'"


class Raw:
    def __init__(self, s):
        self.s = s


def d(n):  # a date n days ago (Adelaide)
    return Raw(f'pg_temp.d({n})')


def ts(n, hhmm):  # a moment n days ago at a local clock time
    return Raw(f"pg_temp.ts({n}, '{hhmm}')")


out = []


def insert(table, cols, rows):
    if not rows:
        return
    for i in range(0, len(rows), 400):
        chunk = rows[i:i + 400]
        vals = ',\n'.join('(' + ', '.join(q(v) for v in r) + ')' for r in chunk)
        out.append(f'insert into {table} ({", ".join(cols)}) values\n{vals};\n')


# ---------------------------------------------------------------- clients
# kind: engaged | quiet (no activity for `last` days) | missed (around, but the last two
# planned sessions not logged) | away (at risk) | new (invited, not set up)
C = [
    dict(n='Emma Wilson', sex='F', kind='engaged', prog='6-Week Glute and Lower Body Builder', days=[0, 1, 3, 5], start=4, joined=12,
         goal='Lose 6 kg before the wedding in March', w=(74.2, -0.45), ci=1, await_=True, plan='balanced-female-cut', habit='steps', food=True, water=True,
         note='Wedding is 21 March. Wants toned arms for the dress. Prefers 6 am sessions before work.'),
    dict(n='Josh Nguyen', sex='M', kind='engaged', prog='8-Week Powerbuilding', days=[0, 1, 3, 4, 5], start=5, joined=15, str=1.2,
         goal='Bench 100 kg by Easter', w=(84.0, 0.12), ci=3, food=True,
         note='Competitive and loves numbers. Show him his PB graph every few weeks.'),
    dict(n='Chloe Martin', sex='F', kind='engaged', prog='6-Week Strength and Conditioning', days=[0, 2, 4, 5], start=3, joined=8,
         goal='Run 10 km and get stronger', w=(63.0, 0.0), ci=4, plan='vegetarian-female-maintain'),
    dict(n="Liam O'Brien", sex='M', kind='engaged', prog='8-Week Push Pull Legs Upper Lower', days=[0, 1, 2, 3, 4], start=6, joined=10, str=0.95,
         goal='Build muscle, 75 to 80 kg', w=(75.1, 0.32), ci=1, plan='balanced-male-bulk', water=True),
    dict(n='Mia Rossi', sex='F', kind='engaged', prog='4-Week Beginner Full Body', days=[0, 2, 4], start=2, joined=6, str=0.8,
         goal='Feel strong again after baby number two', w=(71.4, -0.3), ci=5, habit='sleep',
         limits='Six months postpartum. Cleared by her GP. No jumping or heavy bracing yet.',
         note='Baby born in May. Trains while her partner has the kids on Saturday. Pelvic floor first.'),
    dict(n='Noah Patel', sex='M', kind='engaged', prog='8-Week Athletic Performance', days=[0, 2, 3, 5], start=4, joined=9,
         goal='Back to full footy fitness for preseason', w=(82.3, -0.05), ci=2,
         limits='Old left hamstring strain (2024). Build sprint volume slowly and keep Nordics light.'),
    dict(n='Ava Thompson', sex='F', kind='engaged', prog='4-Week Beginner Glutes and Legs', days=[1, 3, 5], start=3, joined=7, str=0.85,
         goal='Drop two dress sizes and feel confident', w=(80.4, -0.5), ci=2, await_=True, plan='mediterranean-female-cut', habit='water'),
    dict(n='Ethan Clarke', sex='M', kind='engaged', prog='8-Week Strength Peak', days=[0, 1, 3, 4], start=5, joined=20, str=1.35,
         goal='First powerlifting meet in May', w=(93.0, 0.05), ci=6),
    dict(n='Isabella Garcia', sex='F', kind='engaged', prog='6-Week Upper Lower Strength', days=[0, 1, 3, 4], start=2, joined=5,
         goal='Get stronger and fix her posture at the desk', w=(66.2, -0.15), ci=3),
    dict(n='Sophie Walker', sex='F', kind='quiet', last=9, prog='4-Week Beginner Dumbbell Only', days=[0, 2, 4], start=3, joined=9, str=0.8,
         goal='Lose 5 kg and build a routine', w=(77.0, -0.35), ci=9, nudged=4),
    dict(n='Jack Murphy', sex='M', kind='missed', prog='6-Week Push Pull Legs Upper', days=[0, 1, 3, 5], start=4, joined=11,
         goal='Put on size before summer', w=(78.5, 0.1), ci=2, await_=True),
    dict(n='Hannah Lee', sex='F', kind='quiet', last=11, prog='4-Week Beginner Strength Basics', days=[1, 3, 5], start=3, joined=6, str=0.75,
         goal='Learn the big lifts with confidence', w=(61.0, 0.0), ci=11),
    dict(n='Ryan Scott', sex='M', kind='away', last=17, prog='6-Week Upper Lower Strength', days=[0, 1, 3, 4], start=5, joined=14,
         goal='Lose the work belly, 98 to 90 kg', w=(98.4, -0.4), ci=17),
    dict(n='Olivia Brown', sex='F', kind='away', last=25, prog='4-Week Beginner Full Body', days=[0, 2, 4], start=6, joined=10, str=0.75,
         goal='Tone up and have more energy', w=(68.0, -0.2), ci=25),
    dict(n='Zoe Adams', sex='F', kind='new', joined=0, goal='Start lifting and lose 4 kg'),
]

for i, c in enumerate(C):
    first, last = c['n'].split(' ', 1)
    c['id'] = uid('client', c['n'])
    c['user'] = None if c['kind'] == 'new' else uid('user', c['n'])
    c['token'] = uid('claim', c['n'])
    c['email'] = re.sub(r"[^a-z.]", '', f'{first}.{last}'.lower()) + '@demo.unfnshd.app'
    c['phone'] = f'0412 {300 + i:03d} {100 + i * 7:03d}'
    c['first'] = first

insert('public.clients', ['id', 'pt_id', 'full_name', 'goal', 'email', 'phone', 'status', 'created_at', 'claim_token', 'limitations', 'water_target_ml'],
       [[c['id'], COACH, c['n'], c['goal'], c['email'], c['phone'], 'Engaged', ts(c['joined'] * 7 + 1, '10:00'), c['token'], c.get('limits'), 2500 if c['sex'] == 'F' else 3000]
        for c in C])

# Their logins: linked to the client rows through the claim token (handle_new_user).
users = []
for c in C:
    if not c['user']:
        continue
    meta = json.dumps({'role': 'client', 'full_name': c['n'], 'claim_token': c['token']})
    users.append([c['user'], '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', c['email'], '', ts(c['joined'] * 7, '18:00'),
                  '', '', '', '', Raw("'{\"provider\":\"email\",\"providers\":[\"email\"]}'::jsonb"), Raw(q(meta) + '::jsonb'), ts(c['joined'] * 7, '18:00'), ts(1, '12:00')])
insert('auth.users', ['id', 'instance_id', 'aud', 'role', 'email', 'encrypted_password', 'email_confirmed_at', 'confirmation_token', 'recovery_token',
                      'email_change_token_new', 'email_change', 'raw_app_meta_data', 'raw_user_meta_data', 'created_at', 'updated_at'], users)

# ---------------------------------------------------------------- training
BASE = [  # kg for a typical intermediate man; first match wins
    ('Rack Pull', 150), ('Deadlift (Conventional)', 140), ('Trap Bar Deadlift', 125), ('Romanian Deadlift (Barbell)', 100), ('Romanian Deadlift (Dumbbell)', 24),
    ('Good Morning', 60), ('Pause Squat', 90), ('Front Squat', 85), ('Back Squat', 110), ('Hack Squat', 120), ('Leg Press', 170), ('Goblet Squat', 28),
    ('Dumbbell Squat', 22), ('Close Grip Bench', 75), ('Floor Press', 80), ('Incline Barbell Bench', 75), ('Barbell Bench Press', 90),
    ('Incline Dumbbell Press', 30), ('Dumbbell Bench Press', 32), ('Machine Chest Press', 70), ('Pec Deck', 50), ('Cable Chest Fly', 15),
    ('Barbell Overhead Press', 55), ('Push Press', 65), ('Dumbbell Shoulder Press', 22), ('Machine Shoulder Press', 50), ('Arnold Press', 18),
    ('Cable Lateral Raise', 7.5), ('Lateral Raise', 10), ('Reverse Pec Deck', 40), ('Face Pull', 25), ('Pendlay Row', 75), ('Barbell Row', 80),
    ('T-Bar Row', 60), ('Chest Supported Dumbbell Row', 26), ('Renegade Row', 14), ('Dumbbell Row', 34), ('Machine Row', 60), ('Cable Row', 65),
    ('Single Arm Lat Pulldown', 30), ('Lat Pulldown', 65), ('Hip Thrust (Barbell)', 120), ('Hip Thrust (Dumbbell)', 30), ('Hip Abduction', 60),
    ('Cable Kickback', 15), ('Leg Curl', 45), ('Leg Extension', 55), ('Seated Calf Raise', 50), ('Skull Crusher', 35), ('EZ Bar Curl', 35),
    ('Barbell Bicep Curl', 40), ('Dumbbell Bicep Curl', 14), ('Hammer Curl', 16), ('Incline Dumbbell Curl', 12), ('Bayesian Curl', 12),
    ('Tricep Pushdown', 30), ('Overhead Tricep Extension (Cable)', 25), ('Overhead Tricep Extension (Dumbbell)', 22), ('Kettlebell Swing', 24),
    ('Farmers Walk', 32), ('Dumbbell Thruster', 16), ('Power Clean', 80), ('Cable Crunch', 40), ('Pallof Press', 15), ('Medicine Ball Slam', 8),
    ('Medicine Ball Throw', 6), ('Turkish Get Up', 16), ('Bulgarian Split Squat', 16), ('Reverse Lunge', 12), ('Step Up', 10), ('Weighted Plank', 10),
]
TIMED = re.compile(r'\d+\s*(s|min|m)\b')


def base_kg(name):
    for k, v in BASE:
        if k in name:
            return v
    return 0


def step(eq):
    return 2 if eq in ('dumbbell', 'kettlebell') else 2.5


def reps_of(r):
    if 'many' in r:
        return (8, 15)
    nums = [int(x) for x in re.findall(r'\d+', r)]
    if not nums:
        return None
    return (nums[0], nums[1]) if len(nums) > 1 and '-' in r else (nums[0], nums[0])


sched, logs, sets, assigns = [], [], [], []
set_logs, ex_ids = [], {}  # compact set rows point at these by number


def dow_of(n):  # weekday (Mon 0) of the day n days ago, worked out in SQL; here we fake with a fixed anchor
    return (0 - n) % 7  # anchor: day 0 is treated as a Monday for spacing only


for c in C:
    if c['kind'] == 'new':
        continue
    prog = PROGRAMS[c['prog']]
    weeks = int(re.match(r'(\d+)-Week', prog['name']).group(1))
    start = c['start'] * 7 + 1  # days ago
    assigns.append([uid('assign', c['n']), c['id'], prog['id'], COACH, d(start), True, ts(start, '09:00')])
    # Planned days from start until 14 days ahead (or the end of the program).
    plan = [n for n in range(start, -15, -1) if dow_of(n) in c['days'] and n > start - weeks * 7]
    last_done = c.get('last', 0)
    sex_f = 0.62 if c['sex'] == 'F' else 1.0
    strength = sex_f * c.get('str', 1.0)
    k = 0
    recent_missed = False
    for idx, n in enumerate(plan):
        day = prog['days'][k % len(prog['days'])]
        k += 1
        sw = uid('sw', c['n'], n)
        sched.append([sw, c['id'], day['id'], d(n), COACH, ts(start, '09:00')])
        if n <= 0:
            continue  # today and ahead: still to do
        # Did they do it?
        if c['kind'] in ('quiet', 'away'):
            done = n >= last_done and rnd.random() < 0.85
        elif c['kind'] == 'missed':
            future_past = [m for m in plan if m > 0]
            done = n not in future_past[-2:] and rnd.random() < 0.9
        else:
            done = n <= 10 or rnd.random() < 0.88 or recent_missed
        recent_missed = not done
        if not done:
            continue
        wk = (start - n) / 7
        log = uid('log', c['n'], n)
        hh = '06:10' if c['n'] in ('Emma Wilson', 'Ethan Clarke') else '17:40'
        set_logs.append([len(set_logs), log, c['id'], sw, ts(n, hh)])
        li = len(set_logs) - 1
        vol = 0
        keep_sets = n <= 35  # set-by-set detail for the last five weeks keeps the file small
        for e in day['ex'] or []:
            rr = reps_of(e['reps'] or '')
            if not rr or TIMED.search(e['reps'] or '') or e['mg'] == 'Cardio':
                continue
            kg = base_kg(e['name'])
            if kg:
                kg = kg * strength * (0.88 + 0.025 * wk)
                kg = max(step(e['eq']), round(kg / step(e['eq'])) * step(e['eq']))
            for s in range(1, (e['sets'] or 3) + 1):
                reps = rnd.randint(rr[0], rr[1]) if s < (e['sets'] or 3) else rr[0] + (1 if rnd.random() < 0.3 else 0)
                if keep_sets:
                    xi = ex_ids.setdefault(e['eid'], len(ex_ids))
                    sets.append([li, xi, s, reps, kg if kg else None])
                vol += (kg or 0) * reps
        logs.append([log, c['id'], day['id'], ts(n, hh), True, ts(n, '18:45' if hh != '06:10' else '07:05'), round(vol), sw, rnd.choice([3, 4, 4, 5, 5])])

insert('public.program_assignments', ['id', 'client_id', 'program_id', 'assigned_by', 'start_date', 'is_active', 'created_at'], assigns)
insert('public.scheduled_workouts', ['id', 'client_id', 'program_workout_id', 'scheduled_date', 'created_by', 'created_at'], sched)
insert('public.workout_logs', ['id', 'client_id', 'program_workout_id', 'logged_at', 'completed', 'completed_at', 'total_volume_kg', 'scheduled_workout_id', 'session_rating'], logs)
# Sets are written compactly: (session number, exercise number, set, reps, kg).
out.append('create temp table demo_l (i int, id uuid, client uuid, sw uuid, at timestamptz) on commit drop;\n')
insert('demo_l', ['i', 'id', 'client', 'sw', 'at'], set_logs)
out.append('create temp table demo_x (i int, id uuid) on commit drop;\n')
insert('demo_x', ['i', 'id'], [[i, e] for e, i in ex_ids.items()])
for i in range(0, len(sets), 1500):
    vals = ',\n'.join('(' + ', '.join(q(v) for v in r) + ')' for r in sets[i:i + 1500])
    out.append('insert into public.workout_set_logs (client_id, scheduled_workout_id, exercise_id, set_number, reps_completed, weight_kg, logged_at, workout_log_id)\n'
               'select l.client, l.sw, x.id, v.s, v.r, v.kg::numeric, l.at, l.id from (values\n' + vals + ') as v(l, e, s, r, kg)\n'
               'join demo_l l on l.i = v.l join demo_x x on x.i = v.e;\n')

# ---------------------------------------------------------------- check-ins
NOTES = ['Good week, felt strong on everything.', 'Busy at work but got every session in.', 'Sleep was average, energy dipped midweek.',
         'Legs were wrecked after Monday, in a good way.', 'Ate out twice but stayed on track otherwise.', 'Loving the new program.',
         'Bit sore in the lower back after deadlifts, nothing major.', 'Hit a PB, stoked.', 'Hard week mentally but turned up anyway.',
         'Struggled with water intake, will work on it.', 'Felt flat on Thursday, better by the weekend.', 'Steps were up this week.']
LATEST = {
    'Emma Wilson': 'Down another 0.6 kg! Dress fitting in 3 weeks. Can we add a bit more arm work?',
    'Liam O\'Brien': 'Scale finally moving up, 78.1 this morning. Eating is hard work though.',
    'Ava Thompson': 'Jeans feel looser. Knees a bit sore on lunges, is that normal?',
    'Jack Murphy': 'Work has been flat out, missed a couple of sessions. Back on it this week.',
    'Sophie Walker': 'Rough week, kids were sick. Only got one session in.',
    'Hannah Lee': 'Felt a bit lost on the barbell stuff this week.',
    'Ryan Scott': 'Travelling for work for a couple of weeks.',
    'Olivia Brown': 'Sorry, been slack.',
}
REPLIES = ['Great work this week. Keep stacking these.', 'Love it. Same plan next week, add a little weight where it felt easy.',
           'Nice. Sleep is the next lever, aim for lights out by 10:30.', 'Proud of you for turning up on the hard days. That is the whole game.',
           'Good stuff. Let me know if the back is still tight on Monday and we will adjust.', 'Massive. Keep the protein up and we roll on.']
ci_rows, ci_dates = [], []
for c in C:
    if c['kind'] == 'new':
        continue
    first_ci = c['ci']
    weeks_in = c['joined']
    n = first_ci
    newest = True
    while n <= weeks_in * 7:
        cid = uid('ci', c['n'], n)
        note = LATEST.get(c['n']) if newest else rnd.choice(NOTES)
        owed = newest and c.get('await_')
        scores = (rnd.randint(3, 5), rnd.randint(2, 5), rnd.randint(3, 5))
        if newest and c['kind'] in ('missed', 'quiet', 'away'):
            scores = (2, rnd.randint(2, 3), 3)
        ci_rows.append([cid, c['id'], scores[0], scores[1], scores[2], note, None if owed else rnd.choice(REPLIES), None if owed else ts(max(n - 1, 0) if n > 1 else n, '08:15')])
        ci_dates.append((cid, n, '19:30' if n % 2 else '20:10'))
        newest = False
        n += 7
insert('public.checkins', ['id', 'client_id', 'training_score', 'energy_score', 'mood_score', 'blocker', 'coach_reply', 'replied_at'], ci_rows)
# Check-ins always save with the current time (a trigger), so set their real dates after.
vals = ',\n'.join(f"('{cid}'::uuid, {n}, '{hh}')" for cid, n, hh in ci_dates)
out.append(f"update public.checkins c set submitted_at = pg_temp.ts(v.n, v.hh), created_at = (pg_temp.ts(v.n, v.hh) at time zone 'Australia/Adelaide')\n"
           f"from (values\n{vals}) as v(id, n, hh) where c.id = v.id;\n")

# Daily check-ins (energy, sleep, soreness) for the last two weeks.
daily = []
DAILY_NOTES = ['Slept like a log.', 'Bit tired, big day at work.', 'Legs sore from yesterday.', 'Feeling great.', 'Kids up early again.']
for c in C:
    if c['kind'] == 'new':
        continue
    lastd = c.get('last', 0)
    for n in range(max(1, lastd), 15):
        if c['kind'] == 'engaged' and rnd.random() < 0.72 or c['kind'] != 'engaged' and n == lastd:
            daily.append([uid('daily', c['n'], n), c['id'], d(n), rnd.randint(2, 5), rnd.randint(2, 5), rnd.randint(1, 4),
                          rnd.choice(DAILY_NOTES) if rnd.random() < 0.2 else None, ts(n, '07:30')])
insert('public.daily_checkins', ['id', 'client_id', 'checkin_date', 'energy', 'sleep', 'soreness', 'note', 'created_at'], daily)

# Weigh-ins, roughly weekly, trending towards their goal.
weights = []
for c in C:
    if c['kind'] == 'new':
        continue
    w0, per_week = c['w']
    lastd = c.get('last', 0)
    n = c['joined'] * 7
    while n >= max(lastd, 1):
        weeks_done = c['joined'] - n / 7
        kg = round(w0 + per_week * weeks_done + rnd.uniform(-0.3, 0.3), 1)
        weights.append([uid('w', c['n'], n), c['id'], c['user'], kg, d(n), ts(n, '06:45')])
        n -= rnd.choice([5, 6, 7, 7, 8])
insert('public.body_weight_logs', ['id', 'client_id', 'logged_by', 'weight_kg', 'logged_date', 'created_at'], weights)

# ---------------------------------------------------------------- messages
by = {c['n']: c for c in C}
M = []


def msg(name, who, n, hh, body, read=True):
    c = by[name]
    M.append([uid('msg', name, n, hh, body[:20]), c['id'], COACH if who == 'coach' else c['user'], body, ts(n, hh), ts(n, '21:00') if read and n > 0 else None])


msg('Emma Wilson', 'client', 3, '07:12', 'Hey Luke, can we swap Wednesday to Thursday this week? Work thing.')
msg('Emma Wilson', 'coach', 3, '08:40', 'No worries, moved it to Thursday for you.')
msg('Emma Wilson', 'client', 3, '08:52', 'Legend, thank you!')
msg('Josh Nguyen', 'client', 4, '18:30', 'Is it worth adding pause reps on bench?')
msg('Josh Nguyen', 'coach', 4, '19:05', 'Yes, on your second bench movement. 2 second pause, same weight as your last set of 5.')
msg('Josh Nguyen', 'client', 2, '18:41', 'Hit 92.5 for 3 on bench tonight!! 100 by Easter is on', read=False)
msg('Noah Patel', 'client', 1, '20:02', 'Hammy felt a bit tight after sprints. Should I skip the RDLs on Thursday?', read=False)
msg('Mia Rossi', 'coach', 6, '12:15', "How's the sleep going with the little one?")
msg('Mia Rossi', 'client', 6, '13:02', 'Better this week, about 6 hours most nights. Feeling stronger already.')
msg('Mia Rossi', 'coach', 6, '13:20', "That's a big win. Keep Saturdays as your heavy day.")
msg('Chloe Martin', 'client', 8, '17:10', 'Ran 7 km without stopping on Sunday!')
msg('Chloe Martin', 'coach', 8, '17:45', "Huge. We'll add a fourth run in two weeks.")
msg('Sophie Walker', 'coach', 4, '10:05', "Hey Sophie, haven't heard from you this week. How are you going?")
insert('public.coach_messages', ['id', 'client_id', 'sender_id', 'body', 'created_at', 'read_at'], M)

# Coach notes.
insert('public.pt_notes', ['id', 'client_id', 'pt_id', 'text', 'created_at'],
       [[uid('note', c['n']), c['id'], COACH, c['note'], ts(c['joined'] * 7 - 1, '11:00')] for c in C if c.get('note')])

# ---------------------------------------------------------------- habits, meal plans, food, water
HABITS = {'steps': ('8,000 steps', '👟'), 'sleep': ('In bed by 10:30', '😴'), 'water': ('3 litres of water', '💧'),
          'mobility': ('10 minutes of mobility', '🧘'), 'protein': ('Protein at every meal', '🥚')}
EXTRA_HABITS = {'Josh Nguyen': ['water', 'mobility'], 'Chloe Martin': ['steps'], "Liam O'Brien": ['protein'], 'Noah Patel': ['steps'],
                'Ethan Clarke': ['sleep'], 'Isabella Garcia': ['mobility'], 'Emma Wilson': ['protein'], 'Sophie Walker': ['steps'], 'Hannah Lee': ['water']}
habits, hlogs = [], []
for c in C:
    for h in ([c['habit']] if c.get('habit') else []) + EXTRA_HABITS.get(c['n'], []):
        hid = uid('habit', c['n'], h)
        habits.append([hid, HABITS[h][0], HABITS[h][1], 'Daily', 7, c['id'], COACH, True, ts(21, '09:00')])
        for n in range(c.get('last', 0), 21):
            if rnd.random() < (0.6 if n == 0 else 0.76):
                hlogs.append([uid('hl', c['n'], h, n), hid, c['id'], d(n), True])
insert('public.habits', ['id', 'name', 'icon', 'frequency', 'target_per_week', 'client_id', 'created_by', 'is_active', 'created_at'], habits)
insert('public.habit_logs', ['id', 'habit_id', 'client_id', 'completed_date', 'completed'], hlogs)

for c in C:
    if c.get('plan'):
        out.append(f"insert into public.client_meal_plans (client_id, plan_id, started_at) select '{c['id']}', id, pg_temp.ts(12, '19:00') from public.meal_plan_library where slug = '{c['plan']}';\n")
        out.append(f"update public.clients set calorie_target = p.avg_calories, protein_target_g = p.avg_protein_g, carbs_target_g = p.avg_carbs_g, fats_target_g = p.avg_fats_g "
                   f"from public.meal_plan_library p where p.slug = '{c['plan']}' and clients.id = '{c['id']}';\n")
out.append(f"update public.clients set calorie_target = 2900, protein_target_g = 190, carbs_target_g = 330, fats_target_g = 85 where id = '{by['Josh Nguyen']['id']}';\n")

FOOD = {
    'breakfast': [('Greek yoghurt, berries and oats', 380, 32, 45, 8), ('Scrambled eggs on sourdough', 420, 26, 34, 19), ('Protein smoothie', 350, 35, 38, 7)],
    'lunch': [('Chicken, rice and veg', 560, 45, 62, 12), ('Tuna salad wrap', 480, 36, 44, 16), ('Leftover beef stir fry', 590, 42, 58, 18)],
    'dinner': [('Salmon, potatoes and greens', 640, 44, 48, 26), ('Chicken burrito bowl', 690, 48, 70, 20), ('Lean beef spaghetti bolognese', 720, 46, 82, 19)],
    'snack': [('Protein bar', 210, 20, 22, 7), ('Apple and peanut butter', 270, 8, 28, 15), ('Cottage cheese and pineapple', 190, 20, 18, 4)],
}
food = []
for c in C:
    if not c.get('food'):
        continue
    scale = 1.25 if c['sex'] == 'M' else 0.9
    for n in range(0, 8):
        for meal, opts in FOOD.items():
            if n == 0 and meal in ('dinner', 'snack'):
                continue  # today: dinner still to come
            name, kcal, p, cb, f = rnd.choice(opts)
            food.append([uid('food', c['n'], n, meal), c['id'], name, meal, round(kcal * scale), round(p * scale, 1), round(cb * scale, 1), round(f * scale, 1), d(n), 1, ts(n, '12:00')])
insert('public.food_logs', ['id', 'client_id', 'food_name', 'meal_type', 'calories', 'protein_g', 'carbs_g', 'fats_g', 'logged_at', 'servings', 'created_at'], food)

water = []
for c in C:
    if not c.get('water'):
        continue
    for n in range(0, 5):
        for j, ml in enumerate([500, 750, 500, 750] if n else [500, 750]):
            water.append([uid('water', c['n'], n, j), c['id'], c['user'], ml, d(n), ts(n, f'{8 + j * 3:02d}:30')])
insert('public.water_logs', ['id', 'client_id', 'logged_by', 'amount_ml', 'logged_date', 'created_at'], water)

# Personal bests, worked out from the sets exactly as the app does (WorkoutLogging.jsx).
ids = ', '.join(f"'{c['id']}'" for c in C)
out.append(f"""insert into public.personal_bests (client_id, exercise_id, pb_type, value, achieved_at)
select client_id, exercise_id, '1rm', round(max(case when reps_completed = 1 then weight_kg else weight_kg * (1 + reps_completed / 30.0) end), 1),
       (array_agg(logged_at order by case when reps_completed = 1 then weight_kg else weight_kg * (1 + reps_completed / 30.0) end desc))[1]
from public.workout_set_logs where client_id in ({ids}) and weight_kg > 0 group by client_id, exercise_id
union all
select client_id, exercise_id, 'best_set', max(weight_kg * reps_completed), (array_agg(logged_at order by weight_kg * reps_completed desc))[1]
from public.workout_set_logs where client_id in ({ids}) and weight_kg > 0 group by client_id, exercise_id
union all
select client_id, exercise_id, 'volume', round(max(v)), (array_agg(at order by v desc))[1] from (
  select client_id, exercise_id, workout_log_id, sum(weight_kg * reps_completed) v, max(logged_at) at
  from public.workout_set_logs where client_id in ({ids}) and weight_kg > 0 group by client_id, exercise_id, workout_log_id) x
group by client_id, exercise_id;
""")

head = f"""-- UNFNSHD demo account: made-up clients for showing the app to PTs.
-- Coach login: stopmooing+demo@gmail.com. Generated by tools/demo/build-demo.py.
-- Paste into the Supabase SQL Editor and Run. Dates are relative to today (Adelaide).
-- Safe to run once. To take it all out again: supabase/demo/demo_remove.sql.

begin;

create or replace function pg_temp.d(n int) returns date language sql stable as
$$ select (now() at time zone 'Australia/Adelaide')::date - n $$;
create or replace function pg_temp.ts(n int, hhmm text) returns timestamptz language sql stable as
$$ select ((now() at time zone 'Australia/Adelaide')::date - n + hhmm::time) at time zone 'Australia/Adelaide' $$;

-- Stop if it has already been run.
do $$ begin
  if exists (select 1 from public.clients where pt_id = '{COACH}') then
    raise exception 'The demo account already has clients. Run demo_remove.sql first.';
  end if;
end $$;

"""
# clients.created_at is "timestamp without time zone": store the Adelaide wall time.
sql = head + ''.join(out) + '\ncommit;\n'
assert chr(0x2014) not in sql  # no em dashes anywhere
(ROOT / 'supabase/demo').mkdir(exist_ok=True)
(ROOT / 'supabase/demo/demo_seed.sql').write_text(sql)
print('clients', len(C), 'sessions', len(sched), 'logs', len(logs), 'sets', len(sets), 'checkins', len(ci_rows), 'daily', len(daily),
      'weights', len(weights), 'messages', len(M), 'food', len(food), 'bytes', len(sql))
