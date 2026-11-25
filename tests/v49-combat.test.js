'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('./_fixture.js');
const st=async(f,c)=>(await f.call('/api/state',{cookie:c||f.gm})).data.state;

test('durées d’états : fin du prochain tour du lanceur, début de tour, rappel de sauvegarde',async t=>{
 const f=await fixture(t);
 await f.action('npcAdd',{values:{name:'Mage noir',kind:'monstre',hpMax:40,ac:12,initiative:30,speed:9,visibility:'public'}});
 for(const p of (await st(f)).characters)await f.action('initiative',{id:p.id,value:10});
 await f.action('start',{});let s=await st(f);const mage=s.combat.npcs[0].id;assert.equal(s.combat.order[0],mage);
 assert.ok(s.combat.turnStartedAt);
 await f.action('condition',{id:f.a.id,condition:'Paralysé'});
 // Jusqu'à la fin du prochain tour du mage, avec sauvegarde à chaque fin de tour d'Aëlin.
 assert.equal((await f.action('conditionTimer',{id:f.a.id,condition:'Paralysé',rounds:2,when:'end',anchor:mage,save:'Sagesse DD 15'})).status,200);
 assert.equal((await f.action('conditionTimer',{id:f.a.id,condition:'Paralysé',rounds:1,anchor:'inconnu'})).status,400);
 const aIndex=s.combat.order.indexOf(f.a.id);
 await f.action('next',{}); // fin du tour du mage : 2 -> 1
 s=await st(f);assert.equal(s.combat.timers[0].rounds,1);assert.ok(s.characters.find(p=>p.id===f.a.id).conditions.includes('Paralysé'));
 for(let i=1;i<aIndex;i++)await f.action('next',{});
 await f.action('next',{}); // fin du tour d'Aëlin : rappel de sauvegarde
 s=await st(f,f.pa);assert.ok(s.combat.log.some(l=>/nouvelle sauvegarde Sagesse DD 15/.test(l.msg)),'rappel visible du joueur concerné');
 while((await st(f)).combat.order[(await st(f)).combat.index]!==mage)await f.action('next',{});
 await f.action('next',{}); // fin du 2e tour du mage : l'état tombe
 s=await st(f);assert.ok(!s.characters.find(p=>p.id===f.a.id).conditions.includes('Paralysé'));
 // Début de tour : l'état tombe au début du tour de la cible.
 await f.action('condition',{id:f.b.id,condition:'Effrayé'});
 await f.action('conditionTimer',{id:f.b.id,condition:'Effrayé',rounds:1,when:'start'});
 while((await st(f)).combat.order[(await st(f)).combat.index]!==f.b.id)await f.action('next',{});
 assert.ok(!(await st(f)).characters.find(p=>p.id===f.b.id).conditions.includes('Effrayé'));
});

test('concentration d’une créature et minuteur de tour',async t=>{
 const f=await fixture(t);
 await f.action('npcAdd',{values:{name:'Prêtre',kind:'monstre',hpMax:30,ac:12,initiative:12,speed:9,visibility:'public'}});
 const id=(await st(f)).combat.npcs[0].id;
 assert.equal((await f.action('npcConcentration',{id,text:'Immobilisation de personne'})).status,200);
 await f.action('npcHp',{id,delta:-24});let n=(await st(f)).combat.npcs[0];
 assert.equal(n.concentrationChecks[0].dc,12);assert.ok((await st(f)).combat.log.some(l=>/Constitution DD 12/.test(l.msg)&&l.audience==='gm'));
 assert.ok(!(await st(f,f.pa)).combat.log.some(l=>/Constitution DD 12/.test(l.msg)),'rappel réservé au MJ');
 assert.equal((await st(f,f.pa)).combat.npcs[0].concentration,undefined);
 await f.action('npcConcentrationResult',{id,checkId:n.concentrationChecks[0].id,result:'failure'});
 assert.equal((await st(f)).combat.npcs[0].concentration,'');
 await f.action('npcConcentration',{id,text:'Bénédiction'});await f.action('npcHp',{id,delta:-10});
 assert.equal((await st(f)).combat.npcs[0].concentration,'','0 PV : concentration perdue');
 assert.equal((await f.action('turnTimer',{seconds:5})).status,400);
 assert.equal((await f.action('turnTimer',{seconds:60},f.pa)).status,403);
 assert.equal((await f.action('turnTimer',{seconds:60})).status,200);
 const c=(await st(f,f.pa)).combat;assert.equal(c.turnTimer,60);assert.ok(c.turnStartedAt);
});
