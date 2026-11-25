'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const os=require('node:os');
const SS=require('../src/session-summary');
const {createServer}=require('../server');

test('Résumé : faits marquants, XP, chutes, objets, séance automatique après 6 h',()=>{
 const t0=Date.parse('2026-11-20T19:00:00Z');
 const prev={characters:[{id:'a',name:'Aria',hp:20,level:3,inventoryItems:[]}],combat:{started:false,round:1,npcs:[{id:'n1',name:'Gobelin 1',hp:7,cr:'1/4',visibility:'hidden'},{id:'n2',name:'Gobelin 2',hp:7,cr:'1/4',visibility:'public'}]},campaignMemory:[]};
 const next=JSON.parse(JSON.stringify(prev));next.combat.started=true;SS.observe(prev,next,'start',{},t0);
 const n2=JSON.parse(JSON.stringify(next));n2.characters[0].hp=0;n2.combat.npcs[0].hp=0;n2.combat.npcs[1].hp=0;n2.combat.round=3;n2.characters[0].inventoryItems=[{id:'i1',name:'Potion de soins'}];SS.observe(next,n2,'hp',{},t0+60000);
 const ss=n2.sessionStats;assert.equal(ss.combats,1);assert.equal(ss.rounds,2);assert.equal(ss.pcs.a.damage,20);assert.equal(ss.pcs.a.downs,1);
 const gm=SS.lines(ss,{audience:'gm',party:1}).join('\n');
 assert.match(gm,/Vaincus : Gobelin ×2/);assert.match(gm,/XP .* 100 · 100 par personnage \(1\)/);assert.match(gm,/Aria — 20 dégâts encaissés, 1 chute à 0 PV/);assert.match(gm,/Aria obtient : Potion de soins/);
 const pl=SS.lines(ss,{audience:'player'}).join('\n');assert.match(pl,/Vaincus : Gobelin\./,'seule la créature visible est citée');assert.ok(!/XP/.test(pl));
 const later=JSON.parse(JSON.stringify(n2));SS.observe(n2,later,'hp',{},t0+7*3600*1000);
 assert.equal(later.sessionHistory.length,1,'ancienne séance archivée');assert.notEqual(later.sessionStats.id,ss.id);
});

test('Résumé : seuls les résumés partagés arrivent chez les joueurs',async t=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-ss-'));fs.mkdirSync(path.join(tmp,'data'));
 const app=createServer({publicOrigin:null,dataFile:path.join(tmp,'data','chroniques-db.json'),setupKey:'very-long-bootstrap-secret'});
 await new Promise(ok=>app.server.listen(0,'127.0.0.1',ok));t.after(async()=>{await app.close();fs.rmSync(tmp,{recursive:true,force:true});});
 const base='http://127.0.0.1:'+app.server.address().port;
 const call=async(route,{method='GET',body,cookie=''}={})=>{const headers={};if(body!==undefined)headers['Content-Type']='application/json';if(cookie)headers.Cookie=cookie;const r=await fetch(base+route,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});let d=await r.text();try{d=JSON.parse(d);}catch{}return {status:r.status,data:d,cookie:r.headers.get('set-cookie')?.split(';')[0]||''};};
 const gm=(await call('/api/setup',{method:'POST',body:{name:'Maître Test',password:'Strong-Password-2026',setupKey:'very-long-bootstrap-secret'}})).cookie;
 let st=(await call('/api/state',{cookie:gm})).data;const pc=st.state.characters[0];
 const inv=await call('/api/invites',{method:'POST',cookie:gm,body:{characterId:pc.id}});
 const pl=(await call('/api/join',{method:'POST',body:{name:'Joueuse Test',password:'LongPassword-2026',code:inv.data.code}})).cookie;
 const action=async(kind,payload,cookie=gm)=>{const s=(await call('/api/state',{cookie})).data;return call('/api/action',{method:'POST',cookie,body:{kind,baseVersion:s.version,...payload}});};
 assert.equal((await action('hp',{id:pc.id,delta:-3})).status,200);
 st=(await call('/api/state',{cookie:gm})).data;assert.ok(st.state.sessionStats);assert.equal(st.state.sessionStats.pcs[pc.id].damage,3);
 assert.equal((await call('/api/state',{cookie:pl})).data.state.sessionStats,null,'non publié : invisible');
 assert.equal((await action('sessionPublish',{id:st.state.sessionStats.id,value:true},pl)).status,403);
 assert.equal((await action('sessionPublish',{id:st.state.sessionStats.id,value:true})).status,200);
 assert.equal((await call('/api/state',{cookie:pl})).data.state.sessionStats.pcs[pc.id].damage,3);
 assert.equal((await action('sessionStart',{})).status,200);
 const after=(await call('/api/state',{cookie:gm})).data.state;assert.equal(after.sessionHistory.length,1);
});
