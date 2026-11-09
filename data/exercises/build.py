"""Turns the exercise library text files into one SQL file.

Usage: python3 data/exercises/build.py OUT.sql
Checks: every current global exercise is kept, renamed or merged; no duplicate names; no
dashes that read as em dashes; every entry has a how-to and 3 cues. Ids for new exercises
are fixed (uuid5 of the name) so the file gives the same result every time it is built.
"""
import json, re, sys, uuid, pathlib

HERE = pathlib.Path(__file__).parent
FILES = ['chest', 'back', 'shoulders', 'arms', 'legs', 'hips', 'core', 'fullbody', 'cardio']
MUSCLES = {'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Glutes', 'Core', 'Cardio', 'Full Body', 'Other'}
EQUIP = {'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'band', 'kettlebell', 'trx', 'sled', 'landmine', 'trap_bar', 'functional', 'plate'}
CATS = {'strength', 'bodyweight', 'accessory', 'power', 'cardio', 'warmup', 'cooldown'}
NS = uuid.UUID('6b1f0c2e-9a7d-4c1e-8f3a-2d5e7b9c1a40')

current = [r for r in json.load(open(HERE / 'current.json')) if r['g']]
by_name = {r['name'].lower(): r for r in current}
errors = []

entries, merges = [], []
for f in FILES:
    entry = None
    for raw in (HERE / f'{f}.txt').read_text().splitlines():
        line = raw.strip()
        if not line:
            continue
        if '—' in line or '–' in line:
            errors.append(f'{f}: dash in {line[:40]}')
        if line.startswith('## merge '):
            a, b = [s.strip() for s in line[9:].split('>')]
            merges.append((a, b))
            entry = None
        elif line.startswith('## '):
            parts = [p.strip() for p in line[3:].split('|')]
            name, mg, eq, cat = parts[:4]
            was, aka = None, []
            for p in parts[4:]:
                if p.startswith('was '):
                    was = p[4:].strip()
                elif p.startswith('aka '):
                    aka = [a.strip() for a in p[4:].split(',') if a.strip()]
            entry = {'name': name, 'mg': mg, 'eq': eq, 'cat': cat, 'was': was, 'aka': aka, 'how': [], 'cues': [], 'file': f}
            entries.append(entry)
            if mg not in MUSCLES: errors.append(f'{name}: muscle {mg}')
            if eq not in EQUIP: errors.append(f'{name}: equipment {eq}')
            if cat not in CATS: errors.append(f'{name}: category {cat}')
        elif line.startswith('how:'):
            entry['how'].append(line[4:].strip())
        elif line.startswith('cue:'):
            entry['cues'].append(line[4:].strip())
        else:
            errors.append(f'{f}: stray line {line[:50]}')

# Link each entry to an existing exercise, or mark it new.
used = {}
for e in entries:
    src = (e['was'] or e['name']).lower()
    if e['was'] and src not in by_name:
        errors.append(f"{e['name']}: was '{e['was']}' not found")
    row = by_name.get(src)
    if row:
        if row['id'] in used:
            errors.append(f"{e['name']}: {row['name']} used twice ({used[row['id']]})")
        used[row['id']] = e['name']
        e['id'], e['old'] = row['id'], row['name']
    else:
        e['id'], e['old'] = str(uuid.uuid5(NS, e['name'].lower())), None
    if not 2 <= len(e['how']) <= 4: errors.append(f"{e['name']}: {len(e['how'])} how lines")
    if len(e['cues']) != 3: errors.append(f"{e['name']}: {len(e['cues'])} cues")

names = {}
for e in entries:
    k = e['name'].lower()
    if k in names: errors.append(f"duplicate name {e['name']}")
    names[k] = e

merge_rows = []
for a, b in merges:
    ra, rb = by_name.get(a.lower()), by_name.get(b.lower())
    if not ra or not rb:
        errors.append(f'merge {a} > {b}: not found'); continue
    if ra['id'] in used: errors.append(f'merge {a}: also kept as {used[ra["id"]]}')
    if rb['id'] not in used: errors.append(f'merge into {b}: target not kept')
    used[ra['id']] = f'merged into {b}'
    merge_rows.append((ra, rb))

missing = [r['name'] for r in current if r['id'] not in used]
if missing:
    errors.append('not covered: ' + ', '.join(missing))

if errors:
    print('\n'.join(errors)); sys.exit(1)

q = lambda s: "'" + s.replace("'", "''") + "'"
arr = lambda xs: 'array[' + ', '.join(q(x) for x in xs) + ']::text[]'
out = ['-- Exercise library rebuild (built by data/exercises/build.py). Runs as one transaction.',
       '-- Renames keep each exercise\'s id, so programs, logged sets and PBs stay linked.',
       'begin;', '']

out.append('-- 1. Merge duplicates into the exercise that stays.')
for ra, rb in merge_rows:
    a, b = q(ra['id']), q(rb['id'])
    out += [
        f"-- {ra['name']} into {rb['name']}",
        f"update workout_exercises set exercise_id = {b} where exercise_id = {a};",
        f"update workout_set_logs set exercise_id = {b} where exercise_id = {a};",
        f"delete from personal_bests p where p.exercise_id = {a} and exists (select 1 from personal_bests k where k.exercise_id = {b} and k.client_id = p.client_id and k.pb_type = p.pb_type and k.value >= p.value);",
        f"delete from personal_bests k where k.exercise_id = {b} and exists (select 1 from personal_bests p where p.exercise_id = {a} and p.client_id = k.client_id and p.pb_type = k.pb_type);",
        f"update personal_bests set exercise_id = {b} where exercise_id = {a};",
        f"delete from exercise_media m where m.exercise_id = {a} and exists (select 1 from exercise_media k where k.exercise_id = {b} and k.coach_id = m.coach_id);",
        f"update exercise_media set exercise_id = {b} where exercise_id = {a};",
        f"update exercise_aliases set exercise_id = {b} where exercise_id = {a};",
        f"insert into exercise_aliases (exercise_id, alias) values ({b}, {q(ra['name'])});",
        f"delete from exercises where id = {a};", '']

out.append('-- 2. Update every kept exercise: name, group, kit, type, how-to and cues.')
for e in entries:
    if not e['old']:
        continue
    out.append(f"update exercises set name = {q(e['name'])}, muscle_group = {q(e['mg'])}, equipment = {q(e['eq'])}, category = {q(e['cat'])}, "
               f"instructions = {q(chr(10).join(e['how']))}, cues = {arr(e['cues'])} where id = {q(e['id'])} and is_global;")
out.append('')

out.append('-- 3. Add the new exercises (seated and standing versions and the rest).')
for e in entries:
    if e['old']:
        continue
    out.append(f"insert into exercises (id, name, muscle_group, equipment, category, instructions, cues, is_global, created_by) values ("
               f"{q(e['id'])}, {q(e['name'])}, {q(e['mg'])}, {q(e['eq'])}, {q(e['cat'])}, {q(chr(10).join(e['how']))}, {arr(e['cues'])}, true, null);")
out.append('')

out.append('-- 4. Old names and other names become alternative names, so search and the AI still find them.')
for e in entries:
    alts = []
    if e['old'] and e['old'].lower() != e['name'].lower():
        alts.append(e['old'])
    alts += e['aka']
    for a in dict.fromkeys(alts):
        out.append(f"insert into exercise_aliases (exercise_id, alias) select {q(e['id'])}, {q(a)} where not exists "
                   f"(select 1 from exercise_aliases where exercise_id = {q(e['id'])} and lower(alias) = lower({q(a)}));")
out.append('-- An alternative name that is another exercise\'s real name, or the same as its own name, is removed.')
out.append("delete from exercise_aliases a using exercises e where e.is_global and lower(e.name) = lower(trim(a.alias));")
out.append('-- Duplicate alternative names on the same exercise are removed.')
out.append("delete from exercise_aliases a using exercise_aliases b where a.exercise_id = b.exercise_id and lower(trim(a.alias)) = lower(trim(b.alias)) and a.id > b.id;")
out.append('')
out.append('commit;')

pathlib.Path(sys.argv[1]).write_text('\n'.join(out) + '\n')
new = [e['name'] for e in entries if not e['old']]
renamed = [(e['old'], e['name']) for e in entries if e['old'] and e['old'] != e['name']]
print(f'{len(entries)} exercises: {len(renamed)} renamed, {len(new)} new, {len(merge_rows)} merged away')
print('new:', ', '.join(new))
