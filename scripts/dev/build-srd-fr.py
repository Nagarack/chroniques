#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Chroniques — génère les règles et les sorts en français à partir du SRD 5.1 officiel en français.

Source : « Document de Référence du Système 5.1 » (SRD_CC_v5.1_FR.pdf), Wizards of the Coast,
licence Creative Commons Attribution 4.0 International.
Les identifiants anglais des sorts (fireball, mage-armor…) sont retrouvés dans les données JSON
du projet 5e-database (dossier src/2014) par comparaison des caractéristiques.

Usage (outil de développement, non nécessaire pour faire fonctionner Chroniques) :
  python3 -I scripts/dev/build-srd-fr.py <SRD_CC_v5.1_FR.pdf> <5e-database/src/2014>
Dépendance : pdfplumber (pip install pdfplumber).
Écrit src/data/srd-spells-index.js, src/data/srd-regles-fr.js et src/data/srd-monstres-fr.js
(blocs de créatures, reliés à src/data/srd-monsters.js ; relancer ensuite scripts/dev/build-srd-data.js).
"""
import json,re,sys,os,unicodedata,difflib
import pdfplumber
PDF,DB=sys.argv[1],sys.argv[2]
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','src','data')
def fam(f): return f.split('+')[-1]
def page_lines(page,pno,mid=318):
    cols={0:[],1:[]}
    for c in page.chars:
        if c['top']>735: continue
        cols[0 if c['x0']<mid else 1].append(c)
    res=[]
    for k in (0,1):
        cur=None;last=None;lastNS=None
        def flush():
            if cur and cur['text'].strip(): res.append(cur)
            elif cur and cur['text']: res.append({**cur,'text':''})
        for c in cols[k]:
            tiny=c['size']<8
            newline=False
            if last is not None:
                dy=abs(c['top']-last['top'])
                if tiny or last['size']<8: newline=dy>8
                else:
                    newline=dy>3 or (abs(c['size']-last['size'])>1.5) or (c['x0']<last['x0']-30)
            if cur is None or newline:
                flush()
                cur={'p':pno,'col':k,'size':round(c['size'],1),'font':fam(c['fontname']),'x':round(c['x0']),'top':round(c['top']),'text':''};lastNS=None
            elif c['text'].strip() and lastNS is not None and c['size']<=9.6 and c['x0']-lastNS['x1']>6:
                # Tableaux (9 pt) : un grand blanc sépare deux colonnes -> tabulation.
                cur['text']=cur['text'].rstrip(' ')+'\t'
            elif last is not None and c['x0']-last['x1']>1.2 and not cur['text'].endswith(' ') and c['text']!=' ':
                cur['text']+=' '
            cur['text']+=c['text']
            if c['text'].strip(): lastNS=c
            if not tiny and c['text'].strip() and cur['size']<c['size']: cur['size']=round(c['size'],1)
            if not tiny: last=c
            else: last=last or c
        flush()
    return res

# Extraction (lente : ~15 min). CHRONIQUES_STREAM_CACHE=<fichier.json> réutilise une extraction précédente.
_cache=os.environ.get('CHRONIQUES_STREAM_CACHE')
if _cache and os.path.exists(_cache):
    L=json.load(open(_cache,encoding='utf-8'))
else:
    _pdf=pdfplumber.open(PDF)
    L=[]
    for _i,_pg in enumerate(_pdf.pages):
        L+=page_lines(_pg,_i+1)
    if _cache: json.dump(L,open(_cache,'w',encoding='utf-8'),ensure_ascii=False)
for l in L:
    l['t']=re.sub(r'(\d)e r\b',r'\1er',l['text'].replace('\u00ad','')).rstrip(); l['s']=l['t'].strip()
COLX={0:58,1:329}
KEEP_HYPH=re.compile(r'^(nous|vous|moi|toi|lui|leur|leurs|monde|même|mêmes|elle|elles|il|ils|le|la|les|y|en|ci|là|delà|dessus|dessous|t-)\b')
def is_head(l):
    return l['font'] in ('Calibri','Calibri-Bold') and l['size']>=11 and l['s'] and not (l['font']=='Calibri-Bold' and l['size']==10)
def head_level(l):
    if l['size']>=25: return 1
    if l['size']>=17: return 2
    if l['size']>=13.5: return 3
    if l['font']=='Calibri-Bold': return 5  # titre de tableau
    return 4
def join(a,b):
    if a.endswith('-') and not a.endswith(' -'):
        if KEEP_HYPH.match(b) : return a+b
        if b[:1].islower(): return a[:-1]+b
        return a+b
    return a+' '+b
def flow(lines):
    """Transforme des lignes en blocs : ('h',niveau,texte) ('p',texte) ('row',texte)."""
    blocks=[];cur=None
    def end():
        nonlocal cur
        if cur: blocks.append(('p',cur.strip()))
        cur=None
    prevhead=None
    for l in lines:
        s=l['s']
        if is_head(l):
            end();lvl=head_level(l)
            if prevhead and blocks and blocks[-1][0]=='h' and blocks[-1][1]==lvl and l['col']==prevhead['col'] and l['p']==prevhead['p'] and 0<l['top']-prevhead['top']<l['size']*1.6:
                blocks[-1]=('h',lvl,blocks[-1][2]+' '+s)
            else: blocks.append(('h',lvl,s))
            prevhead=l;continue
        prevhead=None
        if l['font'].startswith('Calibri') and l['size']<=9.5:
            end()
            if s:
                if blocks and blocks[-1][0]=='row' and (s[0].islower() or s[0] in '(,;'): blocks[-1]=('row',blocks[-1][1]+' '+s,blocks[-1][2])
                else: blocks.append(('row',s,l['font'].endswith('Bold')))
            continue
        if not s: end();continue
        if l['font'].startswith('Symbol') : 
            end(); cur='•';continue
        indent=l['x']>=COLX[l['col']]+6 and l['x']<=COLX[l['col']]+14 and not (cur or '').startswith('•')
        newpara=indent or l['t'].startswith(' ') and l['x']<=COLX[l['col']]+2 or s.startswith('•')
        if 'BoldItalic' in l['font'] or (l['font']=='Cambria-Bold' and cur is None):
            if cur and cur!='•' : end()
            piece='**'+s+'**'
            cur=(cur+' ' if cur else '')+piece if cur=='•' else piece
            continue
        if cur and cur.startswith('•') and l['x']<=COLX[l['col']]+2 and not l['t'].startswith(' ') and cur.rstrip()[-1:] in '.!?': end()
        if cur is None: cur=s
        elif cur=='•': cur='• '+s
        elif newpara and not cur.endswith('**') : end();cur=s
        else:
            cur=join(cur,s) if not cur.endswith('**') else cur+' '+s
    end()
    # nettoyages
    out=[]
    for b in blocks:
        if b[0]=='p':
            t=re.sub(r'\s+',' ',b[1]).replace('** **',' ').strip();t=re.sub(r'\s+([.,;)])',r'\1',t).replace('m3)','m³)').replace('m2)','m²)')
            t=re.sub(r'\*\*(.+?)\s*\*\*',r'**\1**',t)
            if t in ('**','•'): continue
            out.append(('p',t))
        else: out.append(b)
    return out
def pages(a,b): return [l for l in L if a<=l['p']<=b]
# ---------------- Sorts ----------------
SCH='Abjuration|Divination|Enchantement|Évocation|Illusion|Invocation|Nécromancie|Transmutation'
RE_LVL=re.compile(r'^('+SCH+r') du (\d)\s?(?:e|er) niveau( \(rituel\))?$')
RE_CAN=re.compile(r'^Sort mineur(?: d(?:e |’)(\w+))?$')
sp_lines=[l for l in pages(124,213)]
start=next(i for i,l in enumerate(sp_lines) if l['s']=='Description des sorts')
sp_lines=sp_lines[start+1:]
idx=[i for i,l in enumerate(sp_lines) if l['font']=='Calibri' and l['size']==12 and i+1<len(sp_lines) and 'Italic' in sp_lines[i+1]['font']]
LABELS=[('castTime','Temps d’incantation :'),('range','Portée :'),('components','Composantes :'),('duration','Durée :')]
spells=[]
for k,i in enumerate(idx):
    stop=idx[k+1] if k+1<len(idx) else len(sp_lines)
    name=sp_lines[i]['s'];school_line=sp_lines[i+1]['s']
    m=RE_LVL.match(school_line);c=RE_CAN.match(school_line)
    if not (m or c): print('ECOLE?',name,school_line);continue
    if m: lvl=int(m.group(2));school=m.group(1);ritual=bool(m.group(3))
    else: lvl=0;school=(c.group(1) or '').capitalize();ritual=False
    j=i+2;vals={};cur=None
    while j<stop:
        l=sp_lines[j];s=l['s']
        lab=next(((key,t) for key,t in LABELS if s.startswith(t.rstrip(' :')) and l['font']=='Cambria-Bold'),None)
        if lab:
            cur=lab[0];v=s[len(lab[1]):].strip() if s.startswith(lab[1]) else s.split(':',1)[-1].strip()
            vals[cur]=v;j+=1;continue
        if cur and l['font']=='Cambria' and s:
            if cur=='duration' and vals['duration']: break
            vals[cur]=join(vals[cur],s).strip() if vals[cur] else s;j+=1;continue
        if cur=='duration' and not s: j+=1; 
        if cur=='duration': break
        j+=1
    body=flow(sp_lines[j:stop])
    text=[];higher=None
    for b in body:
        if b[0]=='h': text.append(b[2]);continue
        t=b[1] if b[0]=='p' else '| '+b[1]
        if t.startswith('**À plus haut niveau.**'):
            higher=t[len('**À plus haut niveau.**'):].strip();continue
        if higher is not None and b[0]=='p': higher+=' '+t;continue
        text.append(t)
    spells.append({'name':name,'level':lvl,'school':school,'ritual':ritual,**vals,'text':text,'higher':higher})
miss=[s['name'] for s in spells if not all(s.get(k) for k,_ in LABELS)]
print('sorts',len(spells),'incomplets',miss)
# ---------------- Listes de classe ----------------
CL={'barde':'bard','clerc':'cleric','druide':'druid','ensorceleur':'sorcerer','magicien':'wizard','occultiste':'warlock','paladin':'paladin','rôdeur':'ranger'}
names={s['name'] for s in spells}
classes={};cur=None
for l in pages(115,123):
    s=l['s']
    m=re.match(r'^Sorts d[e’] ?(\w+)',s)
    if l['font']=='Calibri' and l['size']==14 and m and m.group(1).lower() in CL: cur=CL[m.group(1).lower()];continue
    if cur and l['font']=='Cambria' and s in names: classes.setdefault(s,set()).add(cur)
for s in spells: s['classes']=sorted(classes.get(s['name'],[]))
print('sans classe',[s['name'] for s in spells if not s['classes']])
# ---------------- Règles ----------------
CHAPTERS=[('caracteristiques','Utiliser les caractéristiques',83,91,None,None),
 ('aventure','L’aventure',92,97,None,'L’ordre du combat'),
 ('combat','Le combat',97,109,'L’ordre du combat',None),
 ('magie','Lancer des sorts',110,114,None,None),
 ('etats','États',397,398,None,None),
 ('niveaux','Niveaux et multiclassage',59,61,None,None),
 ('dangers','Pièges, maladies, folie et poisons',214,224,None,None),
 ('objets-magiques','Objets magiques : règles générales',225,226,None,None),
 ('monstres','Créatures : profils et créatures légendaires',281,290,None,'Monstres (A)'),
]
rules=[]
for cid,title,a,b,frm,until in CHAPTERS:
    ls=pages(a,b)
    if frm: ls=ls[next(i for i,l in enumerate(ls) if l['s']==frm and is_head(l)):]
    if until: ls=ls[:next(i for i,l in enumerate(ls) if l['s']==until and is_head(l))]
    if cid=='magie': ls=ls[:next((i for i,l in enumerate(ls) if l['s']=='Listes de sorts'),len(ls))]
    blocks=flow(ls)
    secs=[];sec=None
    for bl in blocks:
        if bl[0]=='h' and bl[1]<=4:
            sec={'title':re.sub(r'^Annexe MdJ-A : États$','Les états',bl[2]),'level':bl[1],'text':[]};secs.append(sec);continue
        if sec is None: sec={'title':title,'level':2,'text':[]};secs.append(sec)
        if bl[0]=='h': sec['text'].append('### '+bl[2])
        elif bl[0]=='row': sec['text'].append('| '+bl[1])
        else: sec['text'].append(bl[1])
    secs=[s for s in secs if s['text'] or s['level']<=2]
    rules.append({'id':cid,'title':title,'sections':secs})
    pass

D={'spells':spells,'rules':rules}
E=json.load(open(os.path.join(DB,'en','5e-SRD-Spells.json')));F={x['index']:x['name'] for x in json.load(open(os.path.join(DB,'fr-FR','5e-SRD-Spells.json')))}
SCH={'Abjuration':'abjuration','Divination':'divination','Enchantement':'enchantment','Évocation':'evocation','Illusion':'illusion','Invocation':'conjuration','Nécromancie':'necromancy','Transmutation':'transmutation'}
def norm(s): return unicodedata.normalize('NFD',s.lower()).encode('ascii','ignore').decode()
def comps(s): return ''.join(sorted(set(re.findall(r'\b([VSM])\b',s.split('(')[0]))))
def rng(s):
    m=re.match(r'([\d,]+)\s*m',s);
    if m: return round(float(m.group(1).replace(',','.'))/0.3)
    return norm(s)[:5]
def rng_en(s):
    m=re.match(r'(\d+) feet',s)
    if m: return int(m.group(1))
    m=re.match(r'(\d+) mile',s)
    if m: return 'mile'
    return {'Touch':'conta','Self':'perso','Sight':'vue','Unlimited':'illim','Special':'speci'}.get(s.split()[0],s)
def score(f,e):
    if f['level']!=e['level'] or SCH.get(f['school'],'')!=e['school']['index']: return -1
    sc=0
    sc+=2*(f['ritual']==e['ritual'])
    sc+=3*(set(f['classes'])==set(c['index'] for c in e['classes']))
    sc+=2*(comps(f['components'])==''.join(sorted(e['components'])))
    sc+=1*(('concentration' in f['duration'])==e['concentration'])
    r1,r2=rng(f['range']),rng_en(e['range'])
    sc+=2*(r1==r2 or (isinstance(r1,int) and isinstance(r2,int) and abs(r1-r2)<=5))
    sc+=4*difflib.SequenceMatcher(None,norm(f['name']),norm(F.get(e['index'],''))).ratio()
    return sc
pairs=[]
for i,f in enumerate(D['spells']):
    for j,e in enumerate(E):
        s=score(f,e)
        if s>=0: pairs.append((s,i,j))
pairs.sort(reverse=True)
ui=set();uj=set();res={}
for s,i,j in pairs:
    if i in ui or j in uj: continue
    ui.add(i);uj.add(j);res[i]=(j,s)
MANUAL={'Guérison de groupe':'mass-heal','Retour à la vie':'revivify','Soins de groupe':'mass-cure-wounds'}
low=[]
for i,f in enumerate(D['spells']):
    if f['name'] in MANUAL: f['id']=MANUAL[f['name']];continue
    if i not in res: print('PAS DE CORRESPONDANCE',f['name']);continue
    j,s=res[i];f['id']=E[j]['index']
    if s<10: low.append((round(s,1),f['name'],E[j]['name'],F.get(E[j]['index'])))
for x in sorted(low): print(x)

ATTR=("Ce travail comprend la documentation tirée du Document de Référence du Système 5.1 (« SRD 5.1 ») par Wizards of the Coast LLC "
 "et disponible à l'adresse https://dnd.wizards.com/fr/resources/systems-reference-document. Le SRD 5.1 est distribué en vertu de la licence "
 "Creative Commons Attribution 4.0 International disponible à l'adresse https://creativecommons.org/licenses/by/4.0/legalcode.fr.")
def cast_cat(t):
    t=t.lower()
    if t.startswith('1 action bonus'): return 'bonus'
    if t.startswith('1 réaction'): return 'reaction'
    if t.startswith('1 action'): return 'action'
    return 'minute'
def comp_short(c): return ' '.join(x for x in 'VSM' if re.search(r'\b'+x+r'\b',c.split('(')[0]))
def dur_short(d):
    d=re.sub(r'^concentration, jusqu’à ','',d); return d[:1].upper()+d[1:]
spells=sorted(D['spells'],key=lambda s:(s['level'],unicodedata.normalize('NFD',s['name'].lower())))
index=[[s['id'],s['name'],s['level'],' '.join(s['classes']),cast_cat(s['castTime']),s['range'][:45],dur_short(s['duration'])[:55],comp_short(s['components']),s['duration'].startswith('concentration'),s['ritual'],s['school']] for s in spells]
head='/* GÉNÉRÉ par scripts/dev/build-srd-fr.py — ne pas modifier à la main.\n   '+ATTR+'\n   Voir CREDITS_ILLUSTRATIONS.md. */\n'
with open(os.path.join(OUT,'srd-spells-index.js'),'w',encoding='utf-8') as f:
    f.write(head+'(function(r){var d='+json.dumps(index,ensure_ascii=False,separators=(',',':'))+';if(typeof module==="object"&&module.exports)module.exports=d;if(r)r.ChroniquesSRDSpellIndex=d;})(typeof globalThis!=="undefined"?globalThis:this);\n')
full={'attribution':ATTR,'spells':{s['id']:{k:s[k] for k in ('name','level','school','ritual','castTime','range','components','duration','text','higher','classes')} for s in spells},'rules':D['rules']}
with open(os.path.join(OUT,'srd-regles-fr.js'),'w',encoding='utf-8') as f:
    f.write(head+'(function(r){var d='+json.dumps(full,ensure_ascii=False,separators=(',',':'))+';if(typeof module==="object"&&module.exports)module.exports=d;if(r)r.ChroniquesSRDFr=d;})(typeof globalThis!=="undefined"?globalThis:this);\n')
print('Écrit',len(index),'sorts et',sum(len(c['sections']) for c in D['rules']),'sections de règles.')

# ---------------- Monstres : blocs de statistiques officiels en français ----------------
lines=[l for l in L if (290<=l['p']<=396) or (399<=l['p']<=446)]
FIELDS=[('ac','Classe d’armure'),('hp','Points de vie'),('speed','Vitesse'),('saves','Jets de sauvegarde'),('skills','Compétences'),('vuln','Vulnérabilités aux dégâts'),('vuln','Vulnérabilités (dégâts)'),('res','Résistances aux dégâts'),('res','Résistances (dégâts)'),('immDmg','Immunités (dégâts)'),('immDmg','Immunités aux dégâts'),('immCond','Immunités (états)'),('immCond','Immunités aux états'),('senses','Sens'),('lang','Langues'),('cr','Facteur de puissance'),('cr','Puissance')]
mons=[];cur=None;section=None;field=None;entry=None
def end_entry():
    global entry
    if entry and cur is not None:
        entry['text']='\n'.join(re.sub(r'[ \t]+',' ',x).strip() for x in entry['text'].split('\n'))
        entry['text']=re.sub(r'\s+([.,;)])',r'\1',entry['text'])
        cur[section].append(entry)
    entry=None
def end_mon():
    global cur
    end_entry()
    if cur: mons.append(cur)
    cur=None
i=0
while i<len(lines):
    l=lines[i];s=l['s'];f=l['font'];sz=l['size']
    nxt=lines[i+1] if i+1<len(lines) else None
    # nouveau monstre : nom en Calibri-Bold 12 suivi d'une ligne en italique « … de taille … »
    if f=='Calibri-Bold' and 11.5<=sz<=12.5 and nxt and 'Italic' in nxt['font'] and 'taille' in nxt['s']:
        end_mon();cur={'name':s.rstrip(),'meta':nxt['s'],'page':l['p'],'f':{},'abil':None,'traits':[],'actions':[],'reactions':[],'legendary':[],'legendIntro':''};section='traits';field=None;i+=2
        while i<len(lines) and 'Italic' in lines[i]['font'] and 'Bold' not in lines[i]['font'] and lines[i]['s']: cur['meta']=join(cur['meta'],lines[i]['s']);i+=1
        continue
    if cur is None: i+=1;continue
    # fin du bloc : titre plus grand ou texte courant (Cambria)
    if (sz>=13) or f.startswith('Cambria'):
        end_mon();i+=1;continue
    if f=='Calibri-Bold' and 10.5<=sz<=11.5:
        end_entry();t=s.rstrip()
        section={'Actions':'actions','Réactions':'reactions','Réaction':'reactions','Actions légendaires':'legendary'}.get(t,section);field=None;i+=1;continue
    if re.match(r'^FOR\s+DEX\s+CON',s): field=None;i+=1;continue
    m=re.match(r'^(\d+) \([+−-]\d+\) (\d+) \([+−-]\d+\) (\d+) \([+−-]\d+\) (\d+) \([+−-]\d+\) (\d+) \([+−-]\d+\) (\d+) \([+−-]\d+\)',s)
    if m and cur['abil'] is None: cur['abil']=[int(x) for x in m.groups()];i+=1;continue
    if f=='Calibri-Bold' and sz<=10.5 and section=='traits' and not cur['traits'] and entry is None:
        hit=next(((k,lab) for k,lab in FIELDS if s.startswith(lab)),None)
        if hit:
            field=hit[0];cur['f'][field]=s[len(hit[1]):].strip();i+=1;continue
    if field and f=='Calibri' and l['x']>=COLX[l['col']]+6 and entry is None:
        cur['f'][field]=join(cur['f'][field],s);i+=1;continue
    field=None
    if not s: i+=1;continue
    if 'BoldItalic' in f or (section=='legendary' and f=='Calibri-Bold' and sz<=10.5):
        mm=re.match(r'^(.+?)\.\s*(.*)$',s)
        if mm and len(mm.group(1))<80:
            end_entry();entry={'name':mm.group(1).strip(),'text':mm.group(2)};i+=1;continue
    if entry is None:
        if section=='legendary': cur['legendIntro']=join(cur['legendIntro'],s)
        elif section=='traits' and cur['traits']==[] : entry={'name':'','text':s}
        else: entry={'name':'','text':s}
        i+=1;continue
    if (l['t'].startswith(' ') and l['x']<=COLX[l['col']]+2) or re.match(r'^(À volonté|\d+/jour|Sorts mineurs|Tours de magie|\d+(er|e) niveau|•)',s): entry['text']+='\n'+s
    else: entry['text']=join(entry['text'],s)
    i+=1
end_mon()
# nettoyage des paragraphes
for m in mons:
    for sec in ('traits','actions','reactions','legendary'):
        for e in m[sec]: e['text']=e['text'].replace(' \n','\n')
    m['legendIntro']=re.sub(r'\s+',' ',m['legendIntro']).strip()

# Appariement avec le bestiaire existant (src/data/srd-monsters.js) : caractéristiques, PV, CA, FP et nom.
_src=open(os.path.join(OUT,'srd-monsters.js'),encoding='utf-8').read()
ROWS=json.loads(_src[_src.index('var d=')+6:_src.index(';if(typeof module')])
def _num(v):
    x=re.match(r'(\d+)',v or '');return int(x.group(1)) if x else None
pairs=[]
for i,m in enumerate(mons):
    for j,r in enumerate(ROWS):
        sc=(5 if m['abil']==r[8] else 0)+(3 if _num(m['f'].get('hp'))==r[5] else 0)+(1 if _num(m['f'].get('ac'))==r[6] else 0)+(2 if (m['f'].get('cr','').split(' ')[0])==str(r[3]) else 0)
        sc+=3*difflib.SequenceMatcher(None,norm(m['name']),norm(r[1])).ratio()
        if sc>=8: pairs.append((sc,i,j))
pairs.sort(reverse=True);ui=set();uj=set();BYID={}
for sc,i,j in pairs:
    if i in ui or j in uj: continue
    ui.add(i);uj.add(j);BYID[ROWS[j][0]]=mons[i]
# Formes et variantes séparées dans les données anglaises : même bloc que la créature de base.
VARIANTS={'giant-rat-diseased':'giant-rat','vampire-bat':'vampire','vampire-mist':'vampire','swarm-of-beetles':'swarm-of-insects','swarm-of-centipedes':'swarm-of-insects','swarm-of-spiders':'swarm-of-insects','swarm-of-wasps':'swarm-of-insects','vampire-bat-form':'vampire','vampire-mist-form':'vampire'}
for r in ROWS:
    k=r[0]
    if k in BYID: continue
    base=VARIANTS.get(k) or re.sub(r'-(human|hybrid|wolf|bear|boar|tiger|rat|bat|mist)(-form)?$','',k)
    cand=[x for x in BYID if x==base or x.startswith(base+'-')]
    if base in BYID: BYID[k]=BYID[base]
    elif cand: BYID[k]=BYID[cand[0]]
    else:
        nm={'swarm-of-insects':'Nuée d’insectes'}.get(base)
        hit=[m for m in mons if (nm and m['name']==nm) or norm(m['name'])==norm(re.sub(r'\s*\(.*\)$','',r[1]))]
        if hit: BYID[k]=hit[0]
print('Monstres :',len(mons),'blocs ;',len(BYID),'/',len(ROWS),'créatures du bestiaire reliées.')
def pack(m):
    return {'n':m['name'],'m':m['meta'],'f':m['f'],'a':m['abil'],'t':[[e['name'],e['text']] for e in m['traits']],'ac':[[e['name'],e['text']] for e in m['actions']],'r':[[e['name'],e['text']] for e in m['reactions']],'l':[[e['name'],e['text']] for e in m['legendary']],'li':m['legendIntro']}
packed={};seen={}
for k in sorted(BYID):
    m=BYID[k];key=id(m)
    if key in seen: packed[k]='@'+seen[key]
    else: seen[key]=k;packed[k]=pack(m)
with open(os.path.join(OUT,'srd-monstres-fr.js'),'w',encoding='utf-8') as f:
    f.write(head+'(function(r){var d='+json.dumps(packed,ensure_ascii=False,separators=(',',':'))+';if(typeof module==="object"&&module.exports)module.exports=d;if(r)r.ChroniquesSRDMonstresFr=d;})(typeof globalThis!=="undefined"?globalThis:this);\n')

# ---------------- Objets magiques : textes officiels en français ----------------
lines=[l for l in L if 227<=l['p']<=281]
start=next(i for i,l in enumerate(lines) if l['s']=='Les objets magiques de A à Z')
lines=lines[start+1:]
idx=[i for i,l in enumerate(lines) if l['font']=='Calibri' and 11.5<=l['size']<=12.5 and i+1<len(lines) and 'Italic' in lines[i+1]['font']]
items=[]
for k,i in enumerate(idx):
    stop=idx[k+1] if k+1<len(idx) else len(lines)
    name=lines[i]['s'];h=i
    while h-1>=0 and lines[h-1]['font']=='Calibri' and 11.5<=lines[h-1]['size']<=12.5 and lines[h-1]['col']==lines[i]['col'] and lines[h-1]['p']==lines[i]['p'] and 0<lines[i]['top']-lines[h-1]['top']<20 and (k==0 or h-1>idx[k-1]): h-=1;name=lines[h]['s']+' '+name
    j=i+1;meta=lines[j]['s']
    while j+1<stop and 'Italic' in lines[j+1]['font'] and not lines[j+1]['font'].startswith('Calibri'): j+=1;meta+=' '+lines[j]['s']
    body=flow(lines[j+1:stop])
    text=[]
    for b in body:
        if b[0]=='h': text.append('### '+b[2])
        elif b[0]=='row': text.append('| '+b[1])
        else: text.append(b[1])
    items.append({'name':name,'meta':meta,'text':text})

EN=json.load(open(os.path.join(DB,'en','5e-SRD-Magic-Items.json'),encoding='utf-8'))
_it=open(os.path.join(OUT,'srd-items.js'),encoding='utf-8').read()
cur=json.loads(re.sub(r'([{,])(equipment|magic):',r'\1"\2":',_it[_it.index('var d=')+6:_it.index(';if(typeof module')]))['magic']
known={r[0]:r[1] for r in cur if r[1]!=r[2]}
RAR_FR=[('legendaire','legendary'),('tres rare','very rare'),('peu courant','uncommon'),('rare','rare'),('courant','common'),('variable','varies'),('artefact','artifact')]
def rar_fr(meta):
    n=norm(meta)
    for a,b in RAR_FR:
        if a in n: return b
    return ''
TYPE_FR=[('anneau','ring'),('arme','weapon'),('armure','armor'),('baguette','wand'),('baton','staff'),('sceptre','rod'),('potion','potion'),('parchemin','scroll'),('objet merveilleux','wondrous')]
def type_fr(meta):
    n=norm(meta)
    for a,b in TYPE_FR:
        if n.startswith(a): return b
    return ''
def type_en(first):
    n=first.lower()
    for k in ['ring','weapon','armor','wand','staff','rod','potion','scroll','wondrous']:
        if n.startswith(k): return k
    return ''
FT={'1':'0,3','2':'0,6','3':'0,9','5':'1,50','10':'3','15':'4,50','20':'6','25':'7,50','30':'9','40':'12','50':'15','60':'18','80':'24','90':'27','100':'30','120':'36','150':'45','200':'60','300':'90','500':'150','1000':'300'}
def fp_en(text):
    t=re.sub(r'(\d+)[- ](?:foot|feet|ft\.?)',lambda m:FT.get(m.group(1),m.group(1))+'m',text)
    toks=set(re.findall(r'\d+d\d+|\+\d+|\d+(?:,\d+)?m|\b\d+\b',t))
    return toks
def fp_fr(text):
    t=re.sub(r'(\d+) ?cm\b',lambda m:str(int(m.group(1))/100).replace('.',',')+'m',text)
    t=re.sub(r'(\d+(?:,\d+)?) ?m\b',lambda m:m.group(1)+'m',t)
    return set(re.findall(r'\d+d\d+|\+\d+|\d+(?:,\d+)?m|\b\d+\b',t))
FR=items
base=[e for e in EN if not e.get('variant')]
pairs=[]
for i,e in enumerate(base):
    first=e['desc'][0];rest=' '.join(e['desc'][1:]);fe=fp_en(rest);te=type_en(first);re_=e['rarity']['name'].lower()
    hint=known.get(e['index'],'')
    for j,f in enumerate(FR):
        txt=' '.join(f['text']);ff=fp_fr(txt)
        sc=0
        if te and te==type_fr(f['meta']): sc+=2
        if re_ and re_==rar_fr(f['meta']): sc+=2
        if ('attunement' in first.lower())==('harmonisation' in norm(f['meta'])): sc+=1
        if fe or ff: sc+=4*len(fe&ff)/max(1,len(fe|ff))
        for a,b in (('bowl','jatte'),('censer','encensoir'),('brazier','brasero'),('air','air'),('water','eau'),('fire','feu'),('earth','terre'),('eagle','lynx'),('frost','givre'),('cloud','nuages'),('storm','tempête')):
            if re.search(r'\b'+a+r'\b',e['name'].lower()) and re.search(r'(?<![a-zé])'+b+r'\b',f['name'].lower()): sc+=3
        if hint: sc+=4*difflib.SequenceMatcher(None,norm(hint),norm(f['name'])).ratio()
        sc+=1.5*min(len(txt),len(rest)*1.15)/max(len(txt),len(rest)*1.15,1)
        pairs.append((sc,i,j))
pairs.sort(reverse=True);ui=set();uj=set();res={}
for sc,i,j in pairs:
    if i in ui or j in uj: continue
    ui.add(i);uj.add(j);res[i]=(j,sc)

FRIDX={base[i]['index']:FR[j] for i,(j,sc) in res.items()}
GIANT={'Hill':'des collines','Stone':'des pierres','Frost':'du givre','Fire':'du feu','Cloud':'des nuages','Storm':'des tempêtes'}
DRAGON={'Black':'noir','Blue':'bleu','Brass':'d’airain','Bronze':'de bronze','Copper':'de cuivre','Gold':'d’or','Green':'vert','Red':'rouge','Silver':'d’argent','White':'blanc'}
DMGFR={'Acid':'acide','Cold':'froid','Fire':'feu','Force':'force','Lightning':'foudre','Necrotic':'nécrotique','Poison':'poison','Psychic':'psychique','Radiant':'radiant','Thunder':'tonnerre'}
ELEM={'Air':'air','Earth':'terre','Fire':'feu','Water':'eau'}
GEM={'Air':'saphir bleu','Water':'émeraude','Fire':'corindon rouge','Earth':'diamant jaune'}
FEATHER={'Anchor':'ancre','Bird':'oiseau','Fan':'éventail','Swan Boat':'bateau-cygne','Tree':'arbre','Whip':'fouet'}
FIG={'Bronze Griffon':'griffon de bronze','Ebony Fly':'mouche d’ébène','Golden Lions':'lions d’or','Ivory Goats':'chèvres d’ivoire','Marble Elephant':'éléphant de marbre','Obsidian Steed':'destrier d’obsidienne','Onyx Dog':'chien d’onyx','Serpentine Owl':'chouette de serpentine','Silver Raven':'corbeau d’argent'}
HORN={'Silver':'d’argent','Brass':'d’airain','Bronze':'de bronze','Iron':'de fer'}
IOUN={'Absorption':'absorption','Agility':'agilité','Awareness':'vigilance','Fortitude':'vigueur','Greater Absorption':'absorption suprême','Insight':'intuition','Intellect':'intellect','Leadership':'commandement','Mastery':'maîtrise','Protection':'protection','Regeneration':'régénération','Reserve':'réserve','Strength':'force','Sustenance':'subsistance'}
GOLEM={'Clay':'argile','Flesh':'chair','Iron':'fer','Stone':'pierre'}
BALL={'Mind Reading':'Boule de cristal de lecture des pensées','Telepathy':'Boule de cristal de télépathie','True Seeing':'Boule de cristal de vision suprême'}
BAG={'Gray':'gris','Rust':'rouille','Tan':'fauve'}
LEVEL={'Cantrip':'sort mineur','1st':'niveau 1','2nd':'niveau 2','3rd':'niveau 3','4th':'niveau 4','5th':'niveau 5','6th':'niveau 6','7th':'niveau 7','8th':'niveau 8','9th':'niveau 9'}
def m_ft(x): return {'3':'0,90','4':'1,20','5':'1,50','6':'1,80','7':'2,10','9':'2,70'}.get(x,x)
def variant_name(en,parent_fr,old):
    m=re.match(r'^(.*), \+(\d)$',en)
    if m: return re.sub(r'\s*\+1, \+2 ou \+3$','',parent_fr)+' +'+m.group(2)
    m=re.match(r'^(?:Belt|Potion) of (\w+) Giant Strength$',en)
    if m: return parent_fr+' '+GIANT[m.group(1)]
    m=re.match(r'^(\w+) Dragon Scale Mail$',en)
    if m: return parent_fr+' '+DRAGON[m.group(1)]
    m=re.match(r'^(?:Potion|Ring) of (\w+) Resistance$',en)
    if m: return parent_fr+' ('+DMGFR[m.group(1)]+')'
    m=re.match(r'^Ring of (\w+) Elemental Command$',en)
    if m: return parent_fr+' ('+ELEM[m.group(1)]+')'
    m=re.match(r'^(\w+) Elemental Gem$',en)
    if m: return parent_fr+' ('+GEM[m.group(1)]+')'
    m=re.match(r'^(.+) Feather Token$',en)
    if m and m.group(1) in FEATHER: return parent_fr+' ('+FEATHER[m.group(1)]+')'
    m=re.match(r'^(.+) Figurine of Wondrous Power$',en)
    if m and m.group(1) in FIG: return parent_fr+' ('+FIG[m.group(1)]+')'
    m=re.match(r'^(\w+) Horn of Valhalla$',en)
    if m: return parent_fr+' '+HORN[m.group(1)]
    m=re.match(r'^Ioun Stone of (.+)$',en)
    if m and m.group(1) in IOUN: return parent_fr+' ('+IOUN[m.group(1)]+')'
    m=re.match(r'^Manual of (\w+) Golems$',en)
    if m: return parent_fr+' ('+GOLEM[m.group(1)]+')'
    m=re.match(r'^Crystal Ball of (.+)$',en)
    if m and m.group(1) in BALL: return BALL[m.group(1)]
    m=re.match(r'^(\w+) Bag of Tricks$',en)
    if m: return parent_fr+' '+BAG[m.group(1)]
    m=re.match(r'^Carpet of Flying \((\d) ft\. × (\d) ft\.\)$',en)
    if m: return parent_fr+' ('+m_ft(m.group(1))+' m × '+m_ft(m.group(2))+' m)'
    m=re.match(r'^Spell Scroll \((\w+)\)$',en)
    if m: return parent_fr+' ('+LEVEL.get(m.group(1),m.group(1))+')'
    return old or parent_fr
OLD={r[0]:r[1] for r in cur if r[1]!=r[2]}
OBJ={}
parent_of={}
for e in EN:
    for v in e.get('variants') or []: parent_of[v['url'].split('/')[-1]]=e['index']
for e in EN:
    k=e['index']
    if k in FRIDX:
        f=FRIDX[k];OBJ[k]={'name':(lambda n:n[2:3].upper()+n[3:] if n.startswith('L’') else n)(f['name']),'meta':f['meta'],'text':f['text']}
for e in EN:
    k=e['index']
    if k in OBJ: continue
    p=parent_of.get(k)
    if p and p in FRIDX:
        f=FRIDX[p];nm=variant_name(e['name'],OBJ[p]['name'],OLD.get(k,''))
        # Potions de soins : on garde les noms déjà connus des tables (« Potion de soins supérieurs »…).
        if k.startswith('potion-of-') and 'healing' in k and OLD.get(k): nm=OLD[k]
        OBJ[k]={'name':nm,'meta':f['meta'],'text':f['text'],'parent':p}
print('Objets magiques :',len(FR),'fiches ;',len(OBJ),'/',len(EN),'objets reliés.')
json.dump(OBJ,open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'srd-objets-fr.json'),'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))

# ---------------- Différences 2014 → 2024 (SRD 5.2, données anglaises de 5e-database) ----------------
import collections
D24={}
_p24=os.path.join(DB,'..','2024','en','5e-SRD-Spells.json')
if os.path.exists(_p24):
    A={x['index']:x for x in json.load(open(os.path.join(DB,'..','2014','en','5e-SRD-Spells.json')))}
    B={x['index']:x for x in json.load(open(os.path.join(DB,'..','2024','en','5e-SRD-Spells.json')))}
    def ct(s):
        s=s.lower();s=re.sub(r'^1 ','',s);s=s.split(',')[0].strip()
        return {'action':'action','bonus action':'bonus action','reaction':'reaction'}.get(s,s)
    def dur(s): return re.sub(r'^(concentration, )?(up to )?','',s.lower()).strip()
    def rng(s): return s.lower().replace('-',' ').replace('feet','ft').strip()
    def dice(t): 
        seen=[]
        for d in re.findall(r'\b\d+d\d+\b',t):
            if d not in seen: seen.append(d)
        return seen
    D24={}
    C24=collections.Counter()
    for k,a in A.items():
        b=B.get(k)
        if not b: D24[k]={'gone':True};continue
        d={}
        if a['level']!=b['level']: d['level']=[a['level'],b['level']]
        if ct(a['casting_time'])!=ct(b['casting_time']): d['castTime']=[a['casting_time'],b['casting_time']]
        if rng(a['range'])!=rng(b['range']): d['range']=[a['range'],b['range']]
        if sorted(a['components'])!=sorted(b['components']): d['components']=[' '.join(a['components']),' '.join(b['components'])]
        if dur(a['duration'])!=dur(b['duration']) or a['concentration']!=b['concentration']: d['duration']=[('Concentration, ' if a['concentration'] else '')+a['duration'],('Concentration, ' if b['concentration'] else '')+b['duration']]
        if a['ritual']!=b['ritual']: d['ritual']=[a['ritual'],b['ritual']]
        if a['school']['index']!=b['school']['index']: d['school']=[a['school']['index'],b['school']['index']]
        ca=sorted(c['index'] for c in a['classes']);cb=sorted(c['index'] for c in b['classes'])
        if ca!=cb: d['classes']=[ca,cb]
        da=dice(' '.join(a['desc']));db=dice(b.get('description',''))
        if da and db and da[0]!=db[0]: d['dice']=[da[0],db[0]]
        if d: D24[k]=d
        for x in d: C24[x]+=1
    
FT_M={'5':'1,50 m','10':'3 m','15':'4,50 m','20':'6 m','30':'9 m','60':'18 m','90':'27 m','100':'30 m','120':'36 m','150':'45 m','300':'90 m','500':'150 m'}
def fr_range(v):
    m=re.match(r'^(\d+) feet$',v)
    if m: return FT_M.get(m.group(1),str(round(int(m.group(1))*0.3,1)).replace('.',',')+' m')
    m=re.match(r'^Self \((\d+)-foot (\w+)\)$',v)
    if m: return 'personnelle ('+FT_M.get(m.group(1),m.group(1)+' pieds')+')'
    return {'Touch':'contact','Self':'personnelle','Sight':'à vue','Unlimited':'illimitée','Special':'spéciale'}.get(v,v)
def fr_dur(v):
    t=v.replace('Concentration, ','concentration, ').replace('up to ','jusqu’à ')
    for a,b in (('Instantaneous','instantanée'),('Until dispelled','jusqu’à dissipation'),('hours','heures'),('hour','heure'),('minutes','minutes'),('days','jours'),('day','jour'),('rounds','rounds'),('round','round'),('Special','spéciale')): t=t.replace(a,b)
    return t
def fr_ct(v):
    t=re.sub(r'^1 ','',v.strip()).lower()
    return {'action':'1 action','bonus action':'1 action bonus','reaction':'1 réaction'}.get(t,v.replace('minutes','minutes').replace('hour','heure').replace('Minute','minute'))
SCH_FR={'abjuration':'Abjuration','conjuration':'Invocation','divination':'Divination','enchantment':'Enchantement','evocation':'Évocation','illusion':'Illusion','necromancy':'Nécromancie','transmutation':'Transmutation'}
CL_FR={'bard':'barde','cleric':'clerc','druid':'druide','paladin':'paladin','ranger':'rôdeur','sorcerer':'ensorceleur','warlock':'occultiste','wizard':'magicien'}
def v24(k):
    d=D24.get(k)
    if not d: return None
    if d.get('gone'): return [['Sort','présent en 2014','absent du SRD 2024 (remplacé ou renommé)']]
    out=[]
    L={'level':'Niveau','castTime':'Incantation','range':'Portée','components':'Composantes','duration':'Durée','ritual':'Rituel','school':'École','classes':'Classes','dice':'Dés'}
    for key in ('level','castTime','range','components','duration','ritual','school','classes','dice'):
        if key not in d: continue
        a,b=d[key]
        if key=='range': a,b=fr_range(a),fr_range(b)
        elif key=='duration': a,b=fr_dur(a),fr_dur(b)
        elif key=='castTime': a,b=fr_ct(a),fr_ct(b)
        elif key=='school': a,b=SCH_FR.get(a,a),SCH_FR.get(b,b)
        elif key=='classes': a,b=', '.join(CL_FR.get(x,x) for x in a),', '.join(CL_FR.get(x,x) for x in b)
        elif key=='ritual': a,b=('oui' if a else 'non'),('oui' if b else 'non')
        out.append([L[key],str(a),str(b)])
    return out
for sid,sp in full['spells'].items():
    v=v24(sid)
    if v: sp['v24']=v
with open(os.path.join(OUT,'srd-regles-fr.js'),'w',encoding='utf-8') as f:
    f.write(head+'(function(r){var d='+json.dumps(full,ensure_ascii=False,separators=(',',':'))+';if(typeof module==="object"&&module.exports)module.exports=d;if(r)r.ChroniquesSRDFr=d;})(typeof globalThis!=="undefined"?globalThis:this);\n')
print('Sorts modifiés en 2024 (repérés automatiquement) :',sum(1 for x in full['spells'].values() if 'v24' in x))
# Index des sorts : 12e colonne = modifié en 2024 (1) ou non (0).
index=[r[:11]+[1 if 'v24' in full['spells'][r[0]] else 0] for r in index]
with open(os.path.join(OUT,'srd-spells-index.js'),'w',encoding='utf-8') as f:
    f.write(head+'(function(r){var d='+json.dumps(index,ensure_ascii=False,separators=(',',':'))+';if(typeof module==="object"&&module.exports)module.exports=d;if(r)r.ChroniquesSRDSpellIndex=d;})(typeof globalThis!=="undefined"?globalThis:this);\n')
