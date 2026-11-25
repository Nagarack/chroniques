'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const TR=require('../src/travel.js');
const {fixture}=require('./_fixture.js');

test('voyage : rythmes du SRD, marche forcée, lumières qui s’éteignent, arrivée',()=>{
 const s={characters:[]};TR.start(s,{destination:'Le col',distanceKm:40,pace:'normal'});
 let m=TR.advance(s,8);assert.equal(s.travel.doneKm,36);assert.equal(m.length,0);
 TR.lightAdd(s,'l1',{kind:'torche'},'Ilda');m=TR.advance(s,2);
 assert.ok(m.some(x=>/9e heure.*DD 11/.test(x.text)));assert.ok(m.some(x=>/10e heure.*DD 12/.test(x.text)));
 assert.ok(m.some(x=>/Torche de Ilda s’éteint/.test(x.text)));assert.equal(s.travel.lights.length,0);
 assert.ok(m.some(x=>/Arrivée : Le col/.test(x.text)));assert.equal(s.travel.doneKm,40);
 TR.camp(s);assert.equal(s.travel.hoursToday,0);assert.equal(s.travel.days,2);
 assert.throws(()=>TR.setPace(s,'galop'),/inconnu/);TR.setPace(s,'rapide');assert.equal(TR.PACES.rapide.day,45);
});

test('voyage côté serveur : le temps du monde avance, rations décomptées, réservé au MJ',async t=>{
 const f=await fixture(t);
 await f.action('worldTimeEnable',{});
 assert.equal((await f.action('travelStart',{values:{destination:'Port-Brume',distanceKm:20,pace:'lent'}},f.pa)).status,403);
 assert.equal((await f.action('travelStart',{values:{destination:'Port-Brume',distanceKm:20,pace:'lent'}})).status,200);
 await f.action('itemAdd',{id:f.a.id,values:{name:'Rations (1 jour)',quantity:2}},f.pa);
 const before=(await f.call('/api/state',{cookie:f.gm})).data.state.worldTime?.minutes;
 assert.equal((await f.action('travelAdvance',{hours:4})).status,200);
 let s=(await f.call('/api/state',{cookie:f.pa})).data.state;assert.equal(s.travel.doneKm,12);
 if(before!=null)assert.equal(s.worldTime.minutes,before+240);
 assert.equal((await f.action('travelRations',{})).status,200);
 s=(await f.call('/api/state',{cookie:f.gm})).data.state;assert.equal(s.characters.find(p=>p.id===f.a.id).inventoryItems.find(i=>/Rations/.test(i.name)).quantity,1);
 assert.ok(s.combat.log.some(l=>new RegExp(f.b.name+' n’a plus de rations').test(l.msg)));
});
