'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('./_fixture.js');
const st=async(f,c)=>(await f.call('/api/state',{cookie:c||f.gm})).data.state;

test('co-MJ créatures : gère les monstres en combat, rien d’autre, ne voit pas les secrets',async t=>{
 const f=await fixture(t);
 await f.action('npcAdd',{values:{name:'Ogre caché',kind:'monstre',hpMax:59,ac:11,initiative:8,speed:12,visibility:'hidden',notes:'Porte la clé'}});
 await f.action('plannerAdd',{section:'npcs',values:{title:'Secret',summary:'',privateNotes:'chut',context:'',visibility:'private'}});
 const users=(await f.call('/api/management',{cookie:f.gm})).data;const pb=(users.roleAssignments||users.members).find(m=>m.characterId===f.b.id);
 const r=await f.call('/api/member/role',{method:'POST',cookie:f.gm,body:{userId:pb.userId,role:'assistant'}});assert.equal(r.status,200,JSON.stringify(r.data));
 let s=(await f.call('/api/state',{cookie:f.pb})).data;assert.equal(s.viewer.role,'assistant');
 const ogre=s.state.combat.npcs.find(n=>n.name==='Ogre caché');assert.ok(ogre,'voit les créatures masquées');assert.equal(ogre.hpMax,59);
 assert.ok(!JSON.stringify(s.state).includes('chut'),'pas de carnet secret');
 assert.equal((await f.action('npcHp',{id:ogre.id,delta:-10},f.pb)).status,200);
 assert.equal((await st(f)).combat.npcs.find(n=>n.id===ogre.id).hp,49);
 assert.equal((await f.action('plannerAdd',{section:'npcs',values:{title:'x',summary:'',privateNotes:'',context:'',visibility:'private'}},f.pb)).status,403);
 assert.equal((await f.action('xpAward',{ids:[f.a.id],amount:10},f.pb)).status,403);
 assert.equal((await f.action('hp',{id:f.a.id,delta:-1},f.pb)).status,403,'pas les fiches des autres');
 assert.equal((await f.action('hp',{id:f.b.id,delta:-1},f.pb)).status,200,'garde son personnage');
});
