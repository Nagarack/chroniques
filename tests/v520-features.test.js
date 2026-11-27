'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const HO=require('../src/handouts.js');

test('énigme : comparaison souple et réponses multiples (5.20)',()=>{const s={characters:[{id:'a'},{id:'b'}]};
 HO.add(s,'d1',{title:'Coffre',text:'Il contient la clé.',lock:{question:'Quel mot ?',answers:'Lanterne | la lanterne'}});
 assert.deepEqual(s.handouts[0].lock.answers,['Lanterne','la lanterne']);HO.send(s,'d1',['a']);
 assert.throws(()=>HO.answer(s,'d1','b','lanterne'),/introuvable/,'pas destinataire');
 assert.equal(HO.answer(s,'d1','a','phare').ok,false);assert.equal(HO.answer(s,'d1','a','  LANTÉRNE !').ok,true,'accents, casse, ponctuation ignorés');
 assert.equal(s.handouts[0].solved.by,'a');assert.equal(s.handouts[0].attempts.length,2);
 HO.add(s,'d2',{title:'Simple',text:'x',lock:{answers:'  ;  | '}});assert.equal(s.handouts[1].lock,null,'réponses vides : document ordinaire');
 HO.update(s,'d1',{title:'Coffre',text:'Il contient la clé.',lock:{answers:'ancre'}});assert.equal(s.handouts[0].solved,null,'nouvelle réponse : énigme à résoudre de nouveau');});

test('énigme par le serveur : rien ne fuit avant la bonne réponse, puis tout le monde lit (5.20)',async t=>{const f=await require('./_fixture.js').fixture(t);
 let r=await f.action('handoutAdd',{values:{title:'Lettre scellée',text:'Le trésor est sous le phare.',lock:{question:'Le nom du navire ?',answers:'Albatros'}}});assert.equal(r.status,200);
 const id=r.data.state.handouts[0].id;r=await f.action('handoutSend',{id,recipients:'all'});assert.equal(r.status,200);
 const mine=async c=>(await f.call('/api/state',{cookie:c})).data.state.handouts.find(h=>h.id===id);
 let ha=await mine(f.pa);assert.equal(ha.text,'');assert.equal(ha.riddle.question,'Le nom du navire ?');assert.equal(ha.riddle.solved,false);
 const raw=JSON.stringify((await f.call('/api/state',{cookie:f.pa})).data);assert.ok(!raw.includes('Albatros'),'réponse jamais envoyée');assert.ok(!raw.includes('sous le phare'),'texte caché');
 r=await f.action('handoutAnswer',{id,answer:'Mouette'},f.pa);assert.equal(r.status,200);ha=await mine(f.pa);assert.equal(ha.riddle.solved,false);assert.equal(ha.riddle.tries,1);
 r=await f.action('handoutAnswer',{id,answer:'albatros'});assert.equal(r.status,400,'le MJ ne répond pas');
 r=await f.action('handoutAnswer',{id,answer:' ALBATROS !'},f.pb);assert.equal(r.status,200);
 const hb=await mine(f.pb);assert.equal(hb.text,'Le trésor est sous le phare.');assert.equal(hb.riddle.solved,true);
 ha=await mine(f.pa);assert.equal(ha.text,'Le trésor est sous le phare.','ouvert pour tous les destinataires');
 const gs=(await f.call('/api/state',{cookie:f.gm})).data.state;assert.equal(gs.handouts[0].attempts.length,2);assert.ok(gs.combat.log.some(l=>/a résolu l’énigme/.test(l.msg)));
 // limite d’essais
 r=await f.action('handoutAdd',{values:{title:'Autre',text:'x',lock:{answers:'zzz'}}});const id2=r.data.state.handouts[1].id;await f.action('handoutSend',{id:id2,recipients:'all'});
 const codes=[];for(let i=0;i<7;i++)codes.push((await f.action('handoutAnswer',{id:id2,answer:'non '+i},f.pa)).status);
 assert.deepEqual(codes.slice(0,6),[200,200,200,200,200,200]);assert.equal(codes[6],429,'au plus 6 essais par minute');});

test('renforcer ou affaiblir une créature : PV et CA ajustés, dégâts subis conservés, retour exact (5.20)',async t=>{
 const N=require('../src/creatures.js');const L=require('../src/logic.js');const s=L.initialState();
 N.add(s,'npc-a',{name:'Gobelin',kind:'monstre',hpMax:20,ac:13,initiative:2,speed:9,visibility:'hidden'});const n=N.find(s,'npc-a');n.hp=15;
 N.scale(s,'npc-a',2);assert.deepEqual([n.hpMax,n.hp,n.ac,n.scale],[30,25,15,2],'5 dégâts subis conservés');
 N.scale(s,'npc-a',-1);assert.deepEqual([n.hpMax,n.hp,n.ac],[15,10,12]);
 N.scale(s,'npc-a',0);assert.deepEqual([n.hpMax,n.hp,n.ac,n.scale,n.base],[20,15,13,undefined,undefined],'retour exact à la fiche');
 assert.throws(()=>N.scale(s,'npc-a',3),/Palier/);assert.equal(N.scaleNote(1),'+1 au toucher et au DD, +2 aux dégâts de chaque attaque');
 const f=await require('./_fixture.js').fixture(t);
 let r=await f.action('npcAdd',{values:{name:'Loup',kind:'monstre',hpMax:11,ac:13,initiative:2,speed:12,visibility:'public'}});assert.equal(r.status,200,JSON.stringify(r.data));
 r=await f.action('npcAdd',{values:{name:'Ours',kind:'monstre',hpMax:34,ac:11,initiative:0,speed:12,visibility:'hidden'}});assert.equal(r.status,200);
 r=await f.action('npcScale',{all:true,step:1});assert.equal(r.status,200,JSON.stringify(r.data));
 const npcs=r.data.state.combat.npcs;assert.deepEqual(npcs.map(x=>[x.hpMax,x.ac]),[[14,14],[43,12]]);
 r=await f.action('npcScale',{all:true,step:1},f.pa);assert.equal(r.status,403,'réservé au MJ');});

test('bestiaire du groupe : créatures révélées seulement, une fiche par nom, faits du MJ, rien de secret chez les joueurs (5.20)',async t=>{
 const PB=require('../src/party-bestiary.js');assert.equal(PB.baseName('Gobelin 3'),'Gobelin');assert.equal(PB.baseName('Gobelin B'),'Gobelin');
 const f=await require('./_fixture.js').fixture(t);
 const add=(name,visibility,extra={})=>f.action('npcAdd',{values:{name,kind:'monstre',hpMax:7,ac:15,initiative:1,speed:9,visibility,srd:'goblin',...extra}});
 assert.equal((await add('Gobelin 1','public')).status,200);assert.equal((await add('Gobelin 2','public')).status,200);assert.equal((await add('Silhouette encapuchonnée','hidden',{srd:'vampire'})).status,200);
 let r=await f.action('start',{});assert.equal(r.status,200,JSON.stringify(r.data));
 let s=r.data.state;let list=s.partyBestiary.entries;assert.deepEqual(list.map(e=>[e.name,e.met]),[['Gobelin',1]],'une seule fiche, créature masquée absente');
 const npcs=s.combat.npcs;const g1=npcs.find(n=>n.name==='Gobelin 1');r=await f.action('npcHp',{id:g1.id,delta:-7});assert.equal(r.status,200,JSON.stringify(r.data));
 assert.equal(r.data.state.partyBestiary.entries[0].defeated,1);
 const eid=list[0].id;r=await f.action('bestiaryFact',{id:eid,text:'Fuit quand son chef tombe'});assert.equal(r.status,200);
 r=await f.action('bestiaryFact',{id:eid,text:'Tricheur'},f.pa);assert.equal(r.status,403);
 let ps=(await f.call('/api/state',{cookie:f.pa})).data.state;const pe=ps.partyBestiary.entries[0];assert.equal(pe.facts[0].text,'Fuit quand son chef tombe');
 assert.ok(!('srd' in pe)&&!('key' in pe),'ni fiche SRD ni clé interne');assert.ok(!JSON.stringify(ps.partyBestiary).includes('vampire'));
 r=await f.action('bestiaryEntry',{id:eid,op:'hide'});assert.equal(r.status,200);ps=(await f.call('/api/state',{cookie:f.pa})).data.state;assert.equal(ps.partyBestiary.entries.length,0,'fiche masquée');
 r=await f.action('bestiaryEntry',{op:'add',name:'Spectre du phare'});assert.equal(r.status,200);assert.equal(r.data.state.partyBestiary.entries.length,2);});
