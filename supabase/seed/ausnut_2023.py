# Builds SQL to add AUSNUT 2023 (FSANZ, released Sept 2025, CC BY 4.0,
# "(c) Food Standards Australia New Zealand") to public.foods.
# Input: "AUSNUT 2023 - Food nutrient profiles.xlsx" from
# https://www.foodstandards.gov.au/science-data/food-nutrient-databases/ausnut/data-files
# Values per 100 g. Uses FSANZ's public food key, so foods already in the AFCD list are
# skipped, and any name already in the table (AFCD or AUSNUT 2011-13) is skipped too.
# Usage: python3 -I ausnut_2023.py profiles.xlsx OUT_DIR -> OUT_DIR/ausnut2023_N.sql
import sys, os, openpyxl

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
ws = openpyxl.load_workbook(src, read_only=True)['Food nutrient profiles']
rows = list(ws.iter_rows(values_only=True))
head = rows[2]
col = {name: head.index(name) for name in head if name}
need = ['Public food key', 'Food name', 'Energy with dietary fibre (kJ)', 'Protein (g)', 'Total fat (g)',
        'Available carbohydrate, with sugar alcohols (g)', 'Dietary fibre (g)', 'Total sugars (g)',
        'Sodium (Na) (mg)', 'Total saturated fat (g)']
for n in need:
    assert n in col, 'missing column: ' + n

def q(s):
    return "'" + str(s).replace("'", "''") + "'"

def n(v):
    try:
        return 'null' if v is None or v == '' else str(round(float(v), 2))
    except (TypeError, ValueError):
        return 'null'

vals = []
for r in rows[3:]:
    key, name, kj = r[col['Public food key']], r[col['Food name']], r[col['Energy with dietary fibre (kJ)']]
    if not key or not name or kj in (None, ''):
        continue
    vals.append('(' + ','.join([q(str(key).strip()), q(str(name).strip()), str(round(float(kj) / 4.184))] + [n(r[col[c]]) for c in need[3:]]) + ')')

CHUNK = 900
for i in range(0, len(vals), CHUNK):
    sql = f"""insert into public.foods (public_food_key, name, calories, protein_g, fats_g, carbs_g, fibre_g, sugar_g, sodium_mg, saturated_fat_g, source)
select v.k, v.n, v.kcal, v.p::numeric, v.f::numeric, v.c::numeric, v.fi::numeric, v.s::numeric, v.na::numeric, v.sf::numeric, 'AUSNUT_2023'
from (values
{',\n'.join(vals[i:i + CHUNK])}
) as v(k, n, kcal, p, f, c, fi, s, na, sf)
where not exists (select 1 from public.foods x where lower(x.name) = lower(v.n))
on conflict (public_food_key) do nothing;
"""
    open(os.path.join(out, f'ausnut2023_{i // CHUNK + 1}.sql'), 'w').write(sql)
print(len(vals), 'foods,', (len(vals) + CHUNK - 1) // CHUNK, 'files')
