'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const B=require('../src/bestiary');
const C=require('../src/item-catalog');
const N=require('../src/creatures');
const I=require('../src/inventory');
const L=require('../src/logic');
const ROOT=path.join(__dirname,'..');

test('Bestiaire SRD complet : 334 créatures valides, noms français, fiches rédigées prioritaires',async()=>{
 const all=await B.loadFull();
 assert.equal(all.length,334);
 const ids=new Set();for(const m of all){assert.ok(!ids.has(m.id),m.id);ids.add(m.id);
  const v=N.validate(B.creatureValues(m));assert.equal(v.visibility,'hidden');
  for(const t of Object.keys(m.defenses))assert.ok(L.DAMAGE_TYPES.includes(t),m.name+' '+t);
  assert.ok(B.xpFor(m.cr)!==null,m.name+' FP '+m.cr);}
 assert.equal(B.get('gobelin').nameEn,'Goblin');assert.equal(B.get('gobelin').curated,true,'la fiche rédigée en français remplace l’entrée SRD');
 assert.ok(!all.some(m=>m.id==='srd-goblin'),'pas de doublon');
 assert.equal(B.get('srd-adult-red-dragon').name,'Dragon rouge adulte');
 assert.match(B.get('srd-adult-red-dragon').actions,/Souffle de feu \(recharge 5-6\) : sauvegarde de Dextérité DD 21 \(moitié en cas de réussite\), 18d6 feu/);
 assert.match(B.get('srd-adult-red-dragon').legendary,/actions légendaires/);
 assert.equal(all.filter(m=>m.name===m.nameEn&&!/^(Aboleth|Acolyte|Androsphinx|Ankheg|Assassin|Azer|Cockatrice|Balor|Bandit|Berserker|Bulette|Chuul|Couatl|Crocodile|Darkmantle|Doppelganger|Dretch|Drider|Drow|Duergar|Ettercap|Ettin|Glabrezu|Gnoll|Griffon|Grick|Grimlock|Gynosphinx|Hezrou|Kobold|Kraken|Lion|Mage|Magmin|Manticore|Marilith|Merrow|Noble|Ogre|Oni|Orc|Otyugh|Pseudodragon|Quasit|Rakshasa|Rat|Remorhaz|Roc|Sahuagin|Scorpion|Solar|Stirge|Troll|Vrock|Worg|Xorn|Zombie|Tiger|Couatl|Mule)$/.test(m.name)).length,0,'tous les noms ont une forme française');
});

test('Catalogue d’objets SRD : équipement et objets magiques, recherche FR/EN, valeurs acceptées par l’inventaire',async()=>{
 const all=await C.load();assert.ok(all.length>=590);
 for(const e of all)I.validate(C.toItemValues(e));
 const names=C.search('potion de soins',10).map(e=>e.name);assert.equal(names.filter(n=>n==='Potion de soins').length,1,'pas de doublon');
 assert.ok(C.search('longsword',5).some(e=>e.name==='Épée longue'),'recherche par nom anglais');
 assert.ok(C.search('epee longue',5).some(e=>e.name==='Épée longue'),'recherche sans accents');
 const chain=C.search('cotte de mailles',3)[0];assert.match(chain.short,/CA 16/);
 const bag=C.get('mg:bag-of-holding');assert.equal(bag.name,'Sac sans fond');assert.ok(bag.full.length>200);
});

test('SRD : fichiers servis, chargés à la demande, attribution CC BY 4.0 présente',()=>{
 const server=fs.readFileSync(path.join(ROOT,'server.js'),'utf8'),sw=fs.readFileSync(path.join(ROOT,'sw.js'),'utf8'),index=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 for(const f of ['/src/data/srd-monsters.js','/src/data/srd-items.js','/src/item-catalog.js']){assert.ok(server.includes("['"+f+"'"),f);assert.ok(sw.includes("'"+f+"'"),f);}
 assert.ok(!index.includes('srd-monsters.js')&&!index.includes('srd-items.js'),'les gros catalogues ne sont pas chargés au démarrage');
 for(const f of ['src/data/srd-monsters.js','src/data/srd-items.js'])assert.match(fs.readFileSync(path.join(ROOT,f),'utf8').slice(0,400),/CC BY 4\.0/);
 assert.match(fs.readFileSync(path.join(ROOT,'CREDITS_ILLUSTRATIONS.md'),'utf8'),/System Reference Document 5\.1.*Creative Commons Attribution 4\.0/s);
});
