'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('./_fixture.js');
const empty={summary:'',privateNotes:'',context:''};
const st=async(f,c)=>(await f.call('/api/state',{cookie:c||f.gm})).data.state;

test('factions du carnet : réputation bornée, membres, historique des personnages, secrets jamais envoyés',async t=>{
 const f=await fixture(t);
 await f.action('plannerAdd',{section:'npcs',values:{...empty,title:'Doyen Aldric',visibility:'shared'}});
 await f.action('plannerAdd',{section:'npcs',values:{...empty,title:'Espion caché',visibility:'private'}});
 await f.action('plannerAdd',{section:'factions',values:{...empty,title:'Guilde des Lanternes',privateNotes:'Renverser le doyen',visibility:'shared'}});
 await f.action('plannerAdd',{section:'factions',values:{...empty,title:'Culte secret',visibility:'private'}});
 let s=await st(f);const [n1,n2]=s.campaignPlanner.npcs;const [fa,secret]=s.campaignPlanner.factions;
 assert.equal((await f.action('factionRep',{id:fa.id,delta:1},f.pa)).status,403);
 for(let i=0;i<7;i++)assert.equal((await f.action('factionRep',{id:fa.id,delta:1,reason:'Contrat honoré'})).status,200);
 assert.equal((await f.action('factionMembers',{id:fa.id,members:[n1.id,n2.id]})).status,200);
 assert.equal((await f.action('factionMembers',{id:fa.id,members:['cp-inconnu']})).status,400);
 await f.action('factionRep',{id:secret.id,delta:-2,reason:'Démasqués'});
 s=await st(f);assert.equal(s.factionMeta[fa.id].reputation,5,'plafonné à +5');
 const h=s.characters.find(p=>p.id===f.a.id).history;assert.ok(h.some(e=>/Réputation auprès de « Guilde des Lanternes » : Bien vus \(\+1, Contrat honoré\)/.test(e.text)));
 assert.ok(!h.some(e=>/Culte secret/.test(e.text)),'faction privée : rien dans l’historique');
 const ps=await st(f,f.pa);assert.deepEqual(Object.keys(ps.factionMeta),[fa.id]);assert.deepEqual(ps.factionMeta[fa.id].members,[n1.id],'membre secret masqué');
 assert.ok(!JSON.stringify(ps).includes('Démasqués'));
 // Relations.
 assert.equal((await f.action('relationAdd',{values:{npcId:n1.id,pcId:f.a.id,kind:'rival',note:'Concurrents',secret:false}})).status,200);
 assert.equal((await f.action('relationAdd',{values:{npcId:n1.id,pcId:f.a.id,kind:'secret',note:'Son père',secret:true}})).status,200);
 assert.equal((await f.action('relationAdd',{values:{npcId:n2.id,pcId:f.b.id,kind:'ennemi',note:'',secret:false}})).status,200);
 assert.equal((await f.action('relationAdd',{values:{npcId:n1.id,pcId:f.a.id,kind:'inconnu'}})).status,400);
 const pr=(await st(f,f.pa)).relations;assert.equal(pr.length,1);assert.equal(pr[0].kind,'rival');
 assert.equal((await st(f)).relations.length,3);
});
