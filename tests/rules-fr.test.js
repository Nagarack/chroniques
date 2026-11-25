'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const R=require('../src/rules-ref.js');
const S=require('../src/spells.js');
const INDEX=require('../src/data/srd-spells-index.js');

test('SRD 5.1 FR : 319 sorts indexés, identifiants anglais stables, attribution CC BY présente',async()=>{
 assert.equal(INDEX.length,319);
 const d=await R.load();
 assert.equal(Object.keys(d.spells).length,319);
 assert.match(d.attribution,/Creative Commons Attribution 4\.0/);
 for(const f of ['src/data/srd-regles-fr.js','src/data/srd-spells-index.js'])assert.match(fs.readFileSync(path.join(__dirname,'..',f),'utf8').slice(0,900),/Document de Référence du Système 5\.1/);
 const fb=R.spell('fireball');assert.equal(fb.name,'Boule de feu');assert.equal(fb.level,3);assert.equal(fb.range,'45 m');
 assert.match(fb.text.join(' '),/8d6 dégâts de feu/);assert.match(fb.higher,/1d6 par niveau/);
 assert.deepEqual(fb.classes,['sorcerer','wizard']);
 for(const s of Object.values(d.spells)){assert.ok(s.castTime&&s.range&&s.components&&s.duration,s.name);assert.ok(s.text.length,s.name);assert.ok(!/Interdit à la revente/.test(s.text.join(' ')),s.name);}
});

test('catalogue de sorts : anciens identifiants conservés, sorts SRD ajoutés, recherche sans accents',()=>{
 assert.ok(S.CATALOG.length>=320);
 for(const id of ['fireball','mage-armor','misty-step','hex','cure-wounds','eldritch-blast'])assert.ok(S.get(id),id);
 assert.equal(S.get('misty-step').name,'Foulée brumeuse');
 assert.equal(S.get('wish').level,9);assert.ok(S.get('wish').classes.includes('wizard'));
 assert.ok(S.listForClass('wizard','eclair').some(s=>s.id==='lightning-bolt'));
 assert.ok(!S.listForClass('cleric','boule de feu').length);
});

test('règles : chapitres, états, recherche et rendu HTML échappé',async()=>{
 await R.load();
 const ids=R.chapters().map(c=>c.id);for(const id of ['caracteristiques','aventure','combat','magie','etats'])assert.ok(ids.includes(id),id);
 const prone=R.condition('À terre');assert.ok(prone);assert.match(prone.text.join(' '),/rampant/i);
 for(const n of ['Aveuglé','Charmé','Assourdi','Effrayé','Empoigné','Entravé','Étourdi','Inconscient','Invisible','Neutralisé','Paralysé','Pétrifié','Empoisonné','Épuisement'])assert.ok(R.condition(n),n);
 const hits=R.search('abri');assert.equal(hits[0].title,'Abri');
 assert.equal(R.search('boule de feu')[0].id,'fireball');
 assert.deepEqual(R.search('x'),[]);
 const html=R.blocksHtml(['**Gras.** <script>','• puce','| Colonne\tValeur','| ligne\t2','| encadré']);
 assert.ok(!html.includes('<script>'));assert.match(html,/<strong>Gras\.<\/strong>/);assert.match(html,/<ul class="srd-list">/);assert.match(html,/srd-table/);
 const card=R.spellCardText('wish',300);assert.ok(card.cut);assert.ok(card.text.length<=320);
});

test('créatures : bloc officiel en français pour les 334 créatures, noms officiels, textes anglais remplacés',async()=>{
 const rows=require('../src/data/srd-monsters.js');await R.loadMonsters();
 for(const r of rows)assert.ok(R.monster(r[0]),r[0]);
 const g=R.monster('goblin');assert.equal(g.n,'Gobelin');assert.deepEqual(g.a,[8,14,10,10,8,8]);assert.match(g.ac.map(a=>a[1]).join(' '),/1d6 \+ 2/);
 assert.equal(R.monster('werewolf-wolf').n,'Loup-garou','les formes renvoient au bloc de base');
 const html=R.monsterHtml('lich');assert.match(html,/Actions légendaires/);assert.match(html,/9e niveau/);assert.ok(!/<script/.test(html));
 const english=rows.filter(r=>/\[SRD\]/.test([r[10],r[11],r[12]].join(' ')));assert.ok(english.length<=2,'textes anglais restants : '+english.map(r=>r[0]));
 const B=require('../src/bestiary.js');const all=await B.loadFull();
 const z=all.find(m=>m.srd==='zombie');assert.equal(z.name,'Zombi');assert.equal(z.alias,'Zombie');
 assert.equal(B.creatureValues(all.find(m=>m.srd==='bulette')).srd,'bulette');
 const UIH=require('../src/ui-helpers.js');const acts=UIH.splitActions(all.find(m=>m.srd==='bulette').actions);
 assert.equal(acts.length,2);assert.match(acts[1].detail,/DD 16/,'les phrases suivantes restent dans la même action');
});

test('objets magiques : noms et textes officiels en français, ancien nom cherchable, soins toujours reconnus',async()=>{
 const IC=require('../src/item-catalog.js');const all=await IC.load();const magic=all.filter(e=>e.kind!=='eq');
 assert.equal(magic.length,362);assert.ok(!magic.some(e=>/\[SRD\]/.test(e.short)||/\[SRD\]/.test(e.full)),'plus de texte anglais');
 const bag=IC.search('sac sans fond',3)[0];assert.equal(bag.name,'Sac sans fond');assert.match(bag.full,/espace extradimensionnel|plan astral|extradimensionnel/i);
 assert.ok(IC.search('Langue de feu',5).some(e=>e.nameEn==='Flame Tongue'),'ancien nom (alias) toujours trouvé');
 assert.ok(magic.find(e=>e.nameEn==='Belt of Hill Giant Strength').name.startsWith('Ceinturon de force de géant'));
 const GEAR=require('../src/gear.js');const I=require('../src/inventory.js');
 for(const en of ['Potion of Healing','Potion of Greater Healing','Potion of Supreme Healing']){const e=magic.find(x=>x.nameEn===en&&x.short);const v=IC.toItemValues(e);I.validate(v);assert.ok(GEAR.healDice(v),en+' : dés de soins reconnus');}
});

test('tableaux du SRD en vraies colonnes, encadrés, différences 2024 des sorts',async()=>{
 await R.load();const html=R.blocksHtml(['| d10\tType de dégâts\tGemme','| 1\tAcide\tPerle','| 2\tFeu\tGrenat']);
 assert.match(html,/<table class="srd-table">/);assert.match(html,/<th scope="col">Type de dégâts<\/th>/);assert.match(html,/<td>Grenat<\/td>/);
 const horn=R.blocksHtml(['| d100','| Type de cor','| Berserkers convoqués\tPrérequis','| 01–40\tArgent\t2d4 + 2\tAucun']);assert.equal((horn.match(/<th /g)||[]).length,4,'en-tête sur plusieurs lignes regroupé');
 assert.match(R.blocksHtml(['| Un encadré de règles sans colonnes.']),/srd-aside/);
 assert.match(R.spellHtml('cure-wounds',undefined,{edition:'2024'}),/srd-2024 active[\s\S]*2d8/);
 assert.ok(!/srd-2024/.test(R.spellHtml('fireball')),'pas de bandeau quand rien n’a changé');
 const S=require('../src/spells.js');assert.equal(S.get('cure-wounds').changed2024,true);
 const rows=require('../src/data/srd-monsters.js');assert.ok(!rows.some(r=>/\[SRD\]/.test([r[10],r[11],r[12]].join(' '))),'plus aucun texte anglais dans le bestiaire');
 assert.match(rows.find(r=>r[0]==='night-hag')[11],/Griffes \(forme de guenaude uniquement\)/);
});
