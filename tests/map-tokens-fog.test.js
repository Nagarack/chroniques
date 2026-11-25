'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const os=require('node:os');
const CM=require('../src/campaign-maps');
const {createServer}=require('../server');

test('Cartes : grille, brouillard et jetons validés',()=>{
 const s={maps:[]};CM.add(s,'map-abcdefgh',{title:'Crypte',visibility:'shared'});
 assert.throws(()=>CM.setGrid(s,'map-abcdefgh',{cells:2}),/Grille/);CM.setGrid(s,'map-abcdefgh',{cells:20,scale:'1,5 m'});
 CM.setFog(s,'map-abcdefgh','enable');CM.setFog(s,'map-abcdefgh','reveal',{x:500,y:500,r:120});assert.throws(()=>CM.setFog(s,'map-abcdefgh','reveal',{x:5000,y:0,r:120}),/Position/);
 CM.setFog(s,'map-abcdefgh','undo');assert.equal(s.maps[0].fog.revealed.length,0);
 CM.tokenAdd(s,'map-abcdefgh','tok-aaaaaa1',{kind:'pc',refId:'pc1',label:'Aria',x:10,y:10});
 assert.throws(()=>CM.tokenAdd(s,'map-abcdefgh','tok-aaaaaa2',{kind:'pc',refId:'pc1',label:'Aria',x:10,y:10}),/déjà un jeton/);
 CM.tokenAdd(s,'map-abcdefgh','tok-aaaaaa3',{kind:'npc',refId:'npc-x',label:'Ogre',x:500,y:500,visible:false});
 const pl=CM.projected(s,{role:'player'})[0];assert.equal(pl.tokens.length,1,'jeton masqué invisible du joueur');assert.equal(pl.grid.cells,20);assert.equal(pl.fog.enabled,true);
 assert.equal(CM.projected(s,{role:'gm'})[0].tokens.length,2);
});

test('Cartes : un joueur déplace uniquement son jeton, jamais celui des autres ni les créatures',async t=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-maps-'));fs.mkdirSync(path.join(tmp,'data'));
 const app=createServer({publicOrigin:null,dataFile:path.join(tmp,'data','chroniques-db.json'),setupKey:'very-long-bootstrap-secret'});
 await new Promise(ok=>app.server.listen(0,'127.0.0.1',ok));t.after(async()=>{await app.close();fs.rmSync(tmp,{recursive:true,force:true});});
 const base='http://127.0.0.1:'+app.server.address().port;
 const call=async(route,{method='GET',body,cookie=''}={})=>{const headers={};if(body!==undefined)headers['Content-Type']='application/json';if(cookie)headers.Cookie=cookie;const r=await fetch(base+route,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});let d=await r.text();try{d=JSON.parse(d);}catch{}return {status:r.status,data:d,cookie:r.headers.get('set-cookie')?.split(';')[0]||''};};
 const gm=(await call('/api/setup',{method:'POST',body:{name:'Maître Test',password:'Strong-Password-2026',setupKey:'very-long-bootstrap-secret'}})).cookie;
 let st=(await call('/api/state',{cookie:gm})).data;const [mine,other]=st.state.characters;
 const inv=await call('/api/invites',{method:'POST',cookie:gm,body:{characterId:mine.id}});
 const pl=(await call('/api/join',{method:'POST',body:{name:'Joueuse Test',password:'LongPassword-2026',code:inv.data.code}})).cookie;
 const action=async(kind,payload,cookie=gm)=>{const s=(await call('/api/state',{cookie})).data;return call('/api/action',{method:'POST',cookie,body:{kind,baseVersion:s.version,...payload}});};
 assert.equal((await action('mapAdd',{values:{title:'Village',summary:'',visibility:'shared'}})).status,200);
 const mapId=(await call('/api/state',{cookie:gm})).data.state.maps.at(-1).id;
 for(const pc of [mine,other])assert.equal((await action('mapTokenAdd',{id:mapId,values:{kind:'pc',refId:pc.id,x:100,y:100}})).status,200);
 assert.equal((await action('mapTokenAdd',{id:mapId,values:{kind:'custom',label:'Piège',x:300,y:300,visible:false}})).status,200);
 assert.equal((await action('mapTokenAdd',{id:mapId,values:{kind:'pc',refId:mine.id,x:1,y:1}},pl)).status,403,'le joueur ne pose pas de jeton');
 const pv=(await call('/api/state',{cookie:pl})).data.state.maps.find(m=>m.id===mapId);assert.equal(pv.tokens.length,2,'jeton masqué absent');
 const tok=id=>pv.tokens.find(t=>t.refId===id).id;
 assert.equal((await action('mapTokenMove',{id:mapId,tokenId:tok(mine.id),x:400,y:420},pl)).status,200);
 assert.equal((await action('mapTokenMove',{id:mapId,tokenId:tok(other.id),x:400,y:420},pl)).status,403);
 assert.equal((await action('mapFog',{id:mapId,op:'enable'},pl)).status,403);
 const moved=(await call('/api/state',{cookie:gm})).data.state.maps.find(m=>m.id===mapId).tokens.find(t=>t.refId===mine.id);assert.deepEqual([moved.x,moved.y],[400,420]);
});
