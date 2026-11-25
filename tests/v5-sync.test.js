'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const SD=require('../src/state-diff.js');
const {fixture}=require('./_fixture.js');

test('différences : remplacement, suppression, ajout, journal qui glisse, repli sur l’état complet',()=>{
 const big=Array.from({length:40},(_,i)=>({msg:'ligne '+i}));
 const a={x:1,y:{z:[1,2,3],k:'a'},log:big,del:true,list:[{id:'a',hp:5},{id:'b',hp:7}]};
 const b={x:2,y:{z:[1,2,3,4],k:'a'},log:[...big.slice(3),{msg:'n1'},{msg:'n2'},{msg:'n3'}],list:[{id:'a',hp:5},{id:'b',hp:3}],nouveau:{q:1}};
 const ops=SD.diff(a,b,{ratio:2});assert.ok(ops.some(o=>o.s===3),'glissement détecté');assert.ok(ops.some(o=>o.a&&o.p.join()==='y,z'),'ajout détecté');
 assert.deepEqual(SD.apply(JSON.parse(JSON.stringify(a)),ops),b);
 assert.equal(SD.diff({a:1},{b:2}),null,'correctif plus gros que l’état');
 const log=Array.from({length:60},(_,i)=>({id:'l'+i,msg:'x'.repeat(40)}));const log2=[{id:'n',msg:'nouveau'},...log.slice(0,59)];const lo=SD.diff({log},{log:log2});assert.equal(lo.length,1);assert.ok(lo[0].u);assert.deepEqual(SD.apply(JSON.parse(JSON.stringify({log})),lo),{log:log2});
 for(let i=0;i<200;i++){const r=()=>Math.random()<.5?{v:Math.floor(Math.random()*5),l:Array.from({length:Math.floor(Math.random()*4)},(_,j)=>j*Math.floor(Math.random()*3))}:[Math.random()<.5?1:2];
  const x={a:r(),b:r(),c:{d:r()}},y={a:r(),b:r(),c:{d:r(),e:Math.random()<.5?r():undefined}};const yy=JSON.parse(JSON.stringify(y));const o=SD.diff(x,yy,{ratio:100});if(o)assert.deepEqual(SD.apply(JSON.parse(JSON.stringify(x)),o),yy);}
});

test('serveur : /api/state et /api/action renvoient des correctifs quand l’appareil connaît la version précédente',async t=>{
 const f=await fixture(t);
 const full=(await f.call('/api/state',{cookie:f.gm})).data;assert.ok(full.state&&full.syncTag);
 const r=await f.call('/api/action',{method:'POST',cookie:f.gm,body:{kind:'hp',baseVersion:full.version,id:f.a.id,delta:-2,since:full.syncTag}});
 assert.equal(r.status,200);assert.ok(r.data.patch&&!r.data.state,'correctif seul');
 const mine=SD.apply(JSON.parse(JSON.stringify(full.state)),r.data.patch);
 const check=(await f.call('/api/state',{cookie:f.gm})).data;assert.deepEqual(mine,check.state,'même résultat que l’état complet');
 // Étiquette inconnue ou ancienne : état complet.
 const old=(await f.call('/api/state?since=ancienne',{cookie:f.gm})).data;assert.ok(old.state);
 const p=(await f.call('/api/state?since='+old.syncTag,{cookie:f.gm})).data;assert.deepEqual(p.patch,[],'rien n’a changé');
 // Un joueur ne reçoit jamais de correctif calculé sur l’état d’un autre.
 const pl=(await f.call('/api/state?since='+p.syncTag,{cookie:f.pa})).data;assert.ok(pl.state&&!pl.patch);
});
