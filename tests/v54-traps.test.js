'use strict';
const test=require('node:test');const assert=require('node:assert');const CM=require('../src/campaign-maps.js');
test('pièges : état, DD, révélation aux joueurs',()=>{const s={maps:[]};CM.add(s,'map-abcdefgh',{title:'Crypte',visibility:'shared'});
 CM.markerAdd(s,'map-abcdefgh','pin-aaaaaaa',{title:'Dalle',visibility:'private',x:100,y:100,symbol:'trap'});CM.markerAdd(s,'map-abcdefgh','pin-bbbbbbb',{title:'Coffre',visibility:'private',x:200,y:200,symbol:'chest'});
 assert.throws(()=>CM.trapSet(s,'map-abcdefgh','pin-bbbbbbb',{state:'spotted'}),/pas un piège/);
 assert.throws(()=>CM.trapSet(s,'map-abcdefgh','pin-aaaaaaa',{detectDc:50}),/1 à 40/);
 let m=CM.trapSet(s,'map-abcdefgh','pin-aaaaaaa',{ref:'Fosses',detectDc:15,disarmDc:'',saveDc:13,effect:'Chute de 3 m'});assert.strictEqual(m.trap.state,'hidden');assert.strictEqual(m.trap.disarmDc,null);assert.strictEqual(m.visibility,'private');
 m=CM.trapSet(s,'map-abcdefgh','pin-aaaaaaa',{state:'spotted'});assert.strictEqual(m.visibility,'shared');assert.strictEqual(m.trap.detectDc,15);
 const pl=CM.projected(s,{role:'player'})[0].markers;assert.deepStrictEqual(pl.map(x=>x.trap),[{state:'spotted'}]);});
