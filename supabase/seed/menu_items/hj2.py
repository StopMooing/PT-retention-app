import re, subprocess, json, sys
out=[]
for f in ['hj_beef','hj_chicken']:
    t=subprocess.run(['pdftotext','-layout',f'{sys.argv[1]}/in/{f}.pdf','-'],capture_output=True,text=True).stdout
    lines=t.splitlines(); title=None
    for i,line in enumerate(lines):
        s=line.strip()
        if s.startswith('Ingredients:'):
            j=i-1
            while j>=0 and not lines[j].strip(): j-=1
            title=lines[j].strip()
        m=re.search(r'\s{2,}(Permanent|Limited Time|LTO|Seasonal|Trial)\s+(Yes|No)\s+(Yes|No)\s+([\d.,\s]+)$', line)
        if not m or not title: continue
        nums=[float(x.replace(',','')) for x in m.group(4).split()]
        if len(nums)!=15: continue
        g,kj100,kj,p100,p,f100,fat,s100,s,c100,c,su100,su,na100,na=nums
        out.append(dict(name=title,status=m.group(1),serving_g=g,energy_kj=kj,kcal=round(kj/4.184),protein_g=p,carbs_g=c,fat_g=fat,file=f))
names=[o['name'] for o in out]
dups={n for n in names if names.count(n)>1}
json.dump(out,open(f'{sys.argv[1]}/hj_parsed.json','w'),indent=1)
for o in out:
    if o['file']=='hj_chicken' or o['name'] in dups: print(f"{o['name'][:46]:46} {o['status']:9} {o['serving_g']:>5}g {o['kcal']}kcal")
print(len(out),'rows; duplicate names:',dups)
