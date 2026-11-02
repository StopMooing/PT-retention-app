import re, subprocess, sys, json
src, tag = sys.argv[1], sys.argv[2]
t = subprocess.run(['pdftotext', '-layout', src, '-'], capture_output=True, text=True).stdout
lines = t.splitlines()
LAB = {'Energy (kJ)': 'kj', 'Energy (Cal)': 'cal', 'Protein (g)': 'p', 'Fat, total (g)': 'f', 'Carbohydrate (g)': 'c'}
items, title = [], None
i = 0
clean = lambda s: re.sub(r'[®™]', '', s).strip()
while i < len(lines):
    line = lines[i]
    if 'Avg Qty / Serve' in line:
        n = line.count('Avg Qty / Serve')
        start = line.index('Avg Qty / Serve')
        j = i - 1
        while j >= 0 and not lines[j].strip(): j -= 1
        head = lines[j]
        chunks = [(m.start(), m.group().strip()) for m in re.finditer(r'\S+(?: \S+)*', head)]
        left = [c for c in chunks if c[0] < start - 40]
        if left and left[0][0] < 3 and not left[0][1].isupper():
            title = clean(left[0][1])
        variants = [clean(c[1]) for c in chunks if c[0] >= start - 40][-n:]
        vals = {}
        k = i + 1
        while k < len(lines) and 'Avg Qty / Serve' not in lines[k] and k < i + 20:
            for lab, key in LAB.items():
                m = re.search(re.escape(lab) + r'\s+([\d.<\s]+)$', lines[k])
                if m and key not in vals:
                    vals[key] = [x.replace('<', '') for x in m.group(1).split()]
            k += 1
        for v_i, v in enumerate(variants):
            try:
                g = lambda key, col: float(vals[key][2 * v_i + col])
                kj, kj100 = g('kj', 0), g('kj', 1)
                name = v if (title is None or any(w in v for w in title.split()[:2])) else f'{title} {v}'
                items.append(dict(name=name, serving_g=round(kj / kj100 * 100) if kj100 else None, energy_kj=kj, kcal=round(g('cal', 0)),
                                  protein_g=g('p', 0), carbs_g=g('c', 0), fat_g=g('f', 0), title=title, variant=v))
            except (KeyError, IndexError, ValueError, ZeroDivisionError) as e:
                print('MISS', title, v, repr(e), file=sys.stderr)
        i = k
        continue
    i += 1
json.dump(items, open(sys.argv[3], 'w'), indent=1)
for o in items:
    r = (4 * o['protein_g'] + 4 * o['carbs_g'] + 9 * o['fat_g']) / o['kcal'] if o['kcal'] else 0
    print(f"{o['name'][:48]:48} {str(o['serving_g']):>5}g {o['kcal']:>5} P{o['protein_g']:>5} C{o['carbs_g']:>5} F{o['fat_g']:>5} r{r:.2f}")
print(len(items), 'items', file=sys.stderr)
