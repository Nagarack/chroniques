'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const CT=require('../src/campaign-template.js');const L=require('../src/logic.js');const F=require('../src/session-flow.js');const CLU=require('../src/clues.js');
const rnd=k=>Math.random().toString(36).slice(2).padEnd(k,'x').slice(0,k);
const writeImage=()=>({filename:'a'.repeat(32)+'.webp',mime:'image/webp'});

for(const lang of ['fr','en'])test('aventure d’initiation ('+lang+') : modèle complet, importé sans perte',()=>{const data=require('../aventures/lanterne-noyee.'+lang+'.json');
 assert.equal(CT.check(data),data);const sm=CT.summary(data);assert.equal(sm.scenes,6);assert.equal(sm.encounters,5);assert.equal(sm.templates,5);assert.equal(sm.handouts,3);assert.equal(sm.clues,3);assert.equal(sm.maps,1);assert.equal(sm.images,1);
 assert.match(data.adventure.notes,/SRD 5\.1 \(CC BY 4\.0\)/,'attribution SRD');
 const s=L.initialState();const r=CT.importTemplate(s,data,{random:rnd,writeImage});assert.deepEqual(r.skipped,[]);
 assert.ok(s.sessionFlow.every(sc=>sc.readAloud.length>40),'chaque scène a son texte à lire');
 const ids=new Set([...(s.campaignPlanner.places||[]),...(s.campaignPlanner.npcs||[]),...(s.campaignPlanner.quests||[]),...s.gmLibrary.encounters].map(x=>x.id));
 for(const sc of s.sessionFlow)for(const l of sc.links)assert.ok(ids.has(l.id),'lien de scène résolu : '+sc.title);
 assert.equal(s.clues.length,3);assert.ok(s.clues.every(c=>c.revealed===false),'indices cachés au départ');
 assert.ok(s.gmLibrary.encounters.every(e=>e.groups.length>0));assert.equal(s.maps[0].markers.length,6);assert.equal(s.maps[0].grid.cells,30);
 const corbin=s.gmLibrary.templates.find(t=>t.hpMax===22);assert.ok(corbin,'Corbin');assert.ok(s.gmLibrary.templates.filter(t=>t.srd).length>=4,'créatures SRD');});

test('modèles de campagne : le texte à lire des scènes et les indices sont exportés puis réimportés (5.16)',()=>{const s=L.initialState();
 F.add(s,'sc-abcdefgh1',{title:'La crypte',summary:'',readAloud:'Une odeur de cire froide.',gmNotes:'',status:'planned',visibility:'private',links:[]});CLU.add(s,'clue-abc12345',{title:'Cire noire',text:'Sur la serrure',gmNote:'Vendue au port',tag:'indice',revealed:true});
 const out=CT.exportTemplate(s,{withMaps:false});assert.equal(out.scenes[0].readAloud,'Une odeur de cire froide.');assert.equal(out.clues[0].gmNote,'Vendue au port');
 const t=L.initialState();CT.importTemplate(t,JSON.parse(JSON.stringify(out)),{random:rnd,writeImage});assert.equal(t.sessionFlow[0].readAloud,'Une odeur de cire froide.');assert.equal(t.clues[0].title,'Cire noire');assert.equal(t.clues[0].revealed,false);assert.notEqual(t.clues[0].id,'clue-abc12345');});

test('5.16 : l’aventure est servie par le serveur et s’importe dans une campagne',async t=>{const f=await require('./_fixture.js').fixture(t);
 const r=await fetch(f.base+'/aventures/lanterne-noyee.fr.json');assert.equal(r.status,200);const body=await r.text();
 const imp=await fetch(f.base+'/api/campaign-template/import',{method:'POST',headers:{'Content-Type':'application/json',Cookie:f.gm},body});assert.equal(imp.status,200,await imp.clone().text());
 const st=(await f.call('/api/state',{cookie:f.gm})).data.state;assert.equal(st.sessionFlow.filter(x=>x.readAloud).length,6);assert.equal(st.clues.length,3);
 const ps=(await f.call('/api/state',{cookie:f.pa})).data.state;assert.ok(!JSON.stringify(ps).includes('Corbin le Gris'),'rien de secret chez le joueur');assert.ok(!(ps.maps||[]).some(m=>/naufrageurs/i.test(m.title)),'carte gardée par le MJ jusqu’à la révélation');});
