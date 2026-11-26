'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const F=require('../src/foundry-import.js');const S=require('../src/spells.js');const I=require('../src/inventory.js');const L=require('../src/logic.js');
const ids=new Set(S.CATALOG.map(x=>x.id));

const ACTOR={name:'Mira Ventelame',type:'character',system:{abilities:{str:{value:10},dex:{value:16},con:{value:14},int:{value:12},wis:{value:13},cha:{value:8}},
 attributes:{hp:{value:20,max:27},ac:{calc:'flat',flat:15},movement:{walk:30,units:'ft'}},details:{xp:{value:900},biography:{value:'<p>Née au <b>port</b>.</p><script>alert(1)</script>'}},currency:{gp:15,sp:3}},
 items:[{type:'class',name:'Rogue',system:{levels:3,identifier:'rogue'}},{type:'class',name:'Fighter',system:{levels:1,identifier:'fighter'}},{type:'subclass',name:'Thief'},{type:'race',name:'Halfling'},
  {type:'weapon',name:'Dagger',system:{quantity:2,weight:{value:1,units:'lb'},equipped:true,description:{value:'<p>Finesse</p>'}}},{type:'consumable',name:'Potion of Healing',system:{quantity:1,weight:0.5,type:{value:'potion'}}},
  {type:'spell',name:'Mage Hand',system:{level:0,preparation:{mode:'always'}}},{type:'spell',name:'Homebrew Zap',system:{level:1,activation:{type:'bonus'},properties:['vocal','concentration']}},
  {type:'feat',name:'Sneak Attack',system:{description:{value:'Once per turn @UUID[Compendium.x]{extra damage}'}}},{type:'background',name:'Urchin'},{type:'effect',name:'?'}]};

test('Foundry VTT : conversion d’un acteur dnd5e en fiche Chroniques (données seulement)',()=>{
 assert.equal(F.isFoundryActor(ACTOR),true);assert.equal(F.isFoundryActor({format:'chroniques-personnage'}),false);
 const {data,notes}=F.convert(ACTOR,{knownSpell:id=>ids.has(id)});const c=data.character;assert.equal(data.format,'chroniques-personnage');
 assert.equal(c.name,'Mira Ventelame');assert.equal(c.role,'Halfling');assert.equal(c.level,4,'niveaux additionnés');assert.equal(c.classId,'rogue','classe principale');assert.match(c.job,/Rogue 3 \/ Fighter 1/);
 assert.equal(c.hpMax,27);assert.equal(c.ac,15);assert.equal(c.speed,9,'30 ft → 9 m');assert.deepEqual(c.scores,{str:10,dex:16,con:14,int:12,wis:13,cha:8});assert.equal(c.coins.gp,15);
 assert.equal(c.inventory.length,2);assert.equal(c.inventory[0].weight,0.45,'1 lb → 0,45 kg');assert.equal(c.inventory[1].category,'potion');
 assert.deepEqual(c.spells[0],{spellId:'mage-hand',prepared:true},'sort SRD reconnu');assert.equal(c.spells[1].custom.name,'Homebrew Zap');assert.equal(c.spells[1].custom.concentration,true);
 assert.equal(c.abilities[0].description,'Once per turn extra damage','liens Foundry réduits à leur texte');assert.ok(!c.privateNotes.includes('<'),'aucune balise HTML');assert.ok(notes.some(n=>/ignoré/.test(n)));
 assert.throws(()=>F.convert({...ACTOR,type:'npc'}),/personnages joueurs/);assert.throws(()=>F.convert({hello:1}),/Foundry/);
 for(const it of c.inventory)assert.doesNotThrow(()=>I.add({inventoryItems:[]},'x',it),'objet accepté par Chroniques');});

test('inventaire : les poids à deux décimales sont acceptés (0,07 · 0,29 · 0,55 kg)',()=>{const pc={inventoryItems:[]};
 for(const w of [0.07,0.29,0.55,1.15,2.3])assert.doesNotThrow(()=>I.add(pc,'w'+w,{name:'Objet',weight:w}),String(w));assert.throws(()=>I.add(pc,'w9',{name:'Objet',weight:0.555}),/Poids/);});

test('surprise : rappel au premier tour (2014), désavantage à l’initiative (2024)',()=>{
 for(const edition of ['2014','2024']){const s=L.initialState();s.edition=edition;const ids=s.characters.map(p=>p.id);s.characters.forEach((p,i)=>p.initiative=20-i);
  L.toggleSurprise(s,'mj',ids[0]);assert.deepEqual(s.combat.surprised,[ids[0]]);assert.throws(()=>L.toggleSurprise(s,ids[1],ids[1]),/MJ/);
  L.startCombat(s,'mj');const logs=s.combat.log.map(l=>l.msg).join(' | ');
  if(edition==='2014'){assert.match(logs,/surpris/i);assert.deepEqual(s.combat.surprised,[ids[0]]);L.nextTurn(s,'mj');assert.deepEqual(s.combat.surprised,[],'fin de son premier tour : plus surpris');}
  else{assert.deepEqual(s.combat.surprised,[],'2024 : la surprise ne joue que sur l’initiative');}
  assert.throws(()=>{s.combat.round=2;L.toggleSurprise(s,'mj',ids[1]);},/premier round/);}});

test('5.14 : repos court du groupe et surprise par le serveur',async t=>{const f=await require('./_fixture.js').fixture(t);
 let r=await f.action('restShortAll',{},f.pa);assert.equal(r.status,403);r=await f.action('restShortAll',{});assert.equal(r.status,200,JSON.stringify(r.data));
 assert.ok(r.data.state.combat.log.some(l=>/Repos court du groupe/.test(l.msg)));
 r=await f.action('surpriseToggle',{id:f.a.id});assert.equal(r.status,200);assert.deepEqual(r.data.state.combat.surprised,[f.a.id]);
 r=await f.action('surpriseToggle',{id:f.a.id},f.pa);assert.equal(r.status,403);});

test('« Quoi de neuf ? » : le troisième champ ne contient qu’un filtre de rôle',()=>{const src=require('node:fs').readFileSync(require('node:path').join(__dirname,'../src/online-app.js'),'utf8');
 const i=src.indexOf('const WHATS_NEW=');const block=src.slice(i,src.indexOf('];',i));const roles=new Set([...block.matchAll(/\['[^']*','[^']*','([a-z]*)'\]/g)].map(m=>m[1]));
 assert.ok(roles.size>0);for(const r of roles)assert.ok(['','gm','player'].includes(r),'rôle inattendu : '+r);});
