'use strict';
const test=require('node:test');const assert=require('node:assert');const H=require('../src/hex.js');const CM=require('../src/campaign-maps.js');
test('hexagones : géométrie',()=>{for(let q=0;q<12;q++)for(let r=0;r<8;r++){const c=H.center(q,r,12,1.4);assert.deepStrictEqual(H.fromPoint(c.x+2,c.y-3,12,1.4),{q,r});}
 assert.strictEqual(H.distance({q:0,r:0},{q:3,r:4}),6);assert.strictEqual(H.line({q:0,r:0},{q:3,r:1}).length,4);assert.strictEqual(H.km('6 miles'),9.65);assert.strictEqual(H.km('2 lieues'),8);});
test('hexagones : exploration et déplacement du groupe',()=>{const s={maps:[]};CM.add(s,'map-abcdefgh',{title:'Monde',visibility:'shared'});
 assert.throws(()=>CM.hexToggle(s,'map-abcdefgh','1,1'),/hexagonale/);assert.throws(()=>CM.setGrid(s,'map-abcdefgh',{cells:60,shape:'hex'}),/4 à 40/);
 CM.setGrid(s,'map-abcdefgh',{cells:12,shape:'hex',scale:'10 km'});const m=CM.read(s,'map-abcdefgh');m.aspect=1.5;
 assert.strictEqual(CM.hexToggle(s,'map-abcdefgh','2,2'),true);assert.strictEqual(CM.hexToggle(s,'map-abcdefgh','2,2'),false);assert.throws(()=>CM.hexToggle(s,'map-abcdefgh','99,1'),/hors/);
 let r=CM.hexMove(s,'map-abcdefgh','1,1');assert.strictEqual(r.steps,0);r=CM.hexMove(s,'map-abcdefgh','4,2');assert.strictEqual(r.steps,3);assert.strictEqual(r.km,10);
 assert.strictEqual(m.hex.party,'4,2');assert.strictEqual(m.hex.explored.length,4);const pj=CM.projected(s,{role:'player'})[0];assert.strictEqual(pj.hex.party,'4,2');});
test('hexagones : voyage côté serveur',async t=>{const f=await require('./_fixture.js').fixture(t);
 let r=await f.action('mapAdd',{values:{title:'Monde',summary:'',visibility:'shared'}});const mid=(await f.call('/api/state',{cookie:f.gm})).data.state.maps[0].id;
 r=await f.action('mapGrid',{id:mid,values:{cells:10,scale:'10 km',shape:'hex'}});assert.strictEqual(r.status,200,JSON.stringify(r.data));
 r=await f.action('mapHexParty',{id:mid,hex:'0,0'});assert.strictEqual(r.status,200);r=await f.action('mapHexParty',{id:mid,hex:'2,0',pace:'normal'});assert.strictEqual(r.status,200);
 r=await f.action('mapHexParty',{id:mid,hex:'3,0'},f.pa);assert.strictEqual(r.status,403);
 const log=(await f.call('/api/state',{cookie:f.gm})).data.state.combat.log;assert.ok(log.some(e=>/parcourt 2 hexagones \(20 km, environ 4 h 27/.test(e.msg)),JSON.stringify(log.slice(0,2)));});
