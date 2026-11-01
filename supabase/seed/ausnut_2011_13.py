# Builds SQL to add AUSNUT 2011-13 (FSANZ, CC BY 2.5 AU) to public.foods.
# Source: FSANZ AUSNUT 2011-13 AHS Food Nutrient Database, via github.com/Atyepa/AUSNUT
# (same values, cleaned column names). Values are per 100 g.
# Usage: python3 ausnut_2011_13.py AUSNUT.csv OUT_DIR  -> OUT_DIR/ausnut_N.sql chunks
# Rows already in foods with the same name (AFCD) are skipped by the SQL itself.
import csv, sys, os

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)

def num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None

def q(s):
    return "'" + s.replace("'", "''") + "'"

rows = []
for r in csv.DictReader(open(src, encoding='utf-8-sig')):
    code, name = r['AUSNUT_CODE'].strip(), (r['eight_dig_d'] or '').strip()
    kj = num(r['energy_wdf_kj'])
    if not name or kj is None or len(code) != 8:
        continue
    vals = [
        q('AUSNUT-' + code), q(name), str(round(kj / 4.184)),
        *[('null' if num(r[c]) is None else str(round(num(r[c]), 2))) for c in
          ('protein_g', 'total_fat_g', 'carbs_wsa_g', 'fibre_g', 'total_sugars_g', 'sodium_mg', 'Saturated_fat_g')],
    ]
    rows.append('(' + ','.join(vals) + ')')

CHUNK = 900
for i in range(0, len(rows), CHUNK):
    body = ',\n'.join(rows[i:i + CHUNK])
    sql = f"""insert into public.foods (public_food_key, name, calories, protein_g, fats_g, carbs_g, fibre_g, sugar_g, sodium_mg, saturated_fat_g, source)
select v.k, v.n, v.kcal, v.p, v.f, v.c, v.fi, v.s, v.na, v.sf, 'AUSNUT_2011_13'
from (values
{body}
) as v(k, n, kcal, p, f, c, fi, s, na, sf)
where not exists (select 1 from public.foods x where lower(x.name) = lower(v.n))
on conflict (public_food_key) do nothing;
"""
    open(os.path.join(out, f'ausnut_{i // CHUNK + 1}.sql'), 'w').write(sql)
print(len(rows), 'rows,', (len(rows) + CHUNK - 1) // CHUNK, 'chunks')
