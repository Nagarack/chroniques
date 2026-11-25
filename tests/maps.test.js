'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {createServer}=require('../server');const CM=require('../src/campaign-maps');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/PvQAAAAASUVORK5CYII=','base64');
async function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-v25-'));const dataFile=path.join(dir,'db.json');const app=createServer({publicOrigin:null,dataFile,setupKey:'v25-test-key'});
 await new Promise(ok=>app.server.listen(0,'127.0.0.1',ok));t.after(async()=>{await app.close();fs.rmSync(dir,{recursive:true,force:true});});
 const base='http://127.0.0.1:'+app.server.address().port;
 async function call(route,b,auth=''){
  const res=await fetch(base+'/api/'+route,{method:b===undefined?'GET':'POST',headers:{...(b!==undefined?{'Content-Type':'application/json'}:{}),...(auth?{Cookie:auth}:{})},body:b===undefined?undefined:JSON.stringify(b)});
  const ct=res.headers.get('content-type')||'';return {status:res.status,result:ct.startsWith('application/json')?await res.json():Buffer.from(await res.arrayBuffer()),cookie:res.headers.get('set-cookie')?.split(';')[0]};
 }
 const gm=(await call('setup',{name:'MJ Cartographe',password:'map-test-password-123',setupKey:'v25-test-key'})).cookie;
 const invitation=(await call('invites',{characterId:'aelin'},gm)).result;
 const player=(await call('join',{name:'Joueur Cartes',password:'map-test-password-456',code:invitation.code})).cookie;
 const action=async(auth,kind,params={})=>call('action',{baseVersion:(await call('state',undefined,auth)).result.version,kind,...params},auth);
 return {dir,dataFile,app,call,gm,player,action};
}
test('V2.5 : cartes et repères validés, refus des positions et références incorrectes',()=>{
 const state={};CM.add(state,'map-abcdefgh',{title:'Vallée',summary:'Région de départ',visibility:'private'});
 assert.equal(CM.maps(state).length,1);
 assert.throws(()=>CM.markerAdd(state,'map-abcdefgh','pin-abcdefgh',{title:'Mauvaise position',description:'',visibility:'shared',x:1001,y:1}),/Position invalide/);
 CM.markerAdd(state,'map-abcdefgh','pin-abcdefgh',{title:'Tour',description:'Repère secret',visibility:'private',x:333,y:555});
 assert.equal(CM.projected(state,{role:'player'}).length,0);
 CM.update(state,'map-abcdefgh',{title:'Vallée',summary:'Région',visibility:'shared'});
 assert.equal(CM.projected(state,{role:'player'})[0].markers.length,0);
 assert.equal(CM.projected(state,{role:'gm'})[0].markers.length,1);
 assert.throws(()=>CM.add(state,'map-abcdabcd',{title:'Erreur',visibility:'everyone'}),/Visibilité invalide/);
});
test('V2.5 : joueur voit carte publiée mais jamais ses repères privés ni l’image privée',async t=>{
 const f=await fixture(t);const privateMap=await f.action(f.gm,'mapAdd',{values:{title:'Donjon interdit',summary:'Secret majeur',visibility:'private'}});
 assert.equal(privateMap.status,200);
 const secretId=privateMap.result.state.maps[0].id;
 assert.equal((await f.call('state',undefined,f.player)).result.state.maps.length,0);
 assert.equal((await f.action(f.player,'mapUpdate',{id:secretId,values:{title:'Hack',summary:'',visibility:'shared'}})).status,403);
 assert.equal((await f.call('map-image/'+secretId,undefined,f.player)).status,404);
 assert.equal((await f.action(f.gm,'mapMarkerAdd',{id:secretId,values:{title:'Dragon endormi',description:'Trésor caché',visibility:'private',x:123,y:456}})).status,200);
 assert.equal((await f.action(f.gm,'mapMarkerAdd',{id:secretId,values:{title:'Pont visible',description:'Route ouverte',visibility:'shared',x:650,y:810}})).status,200);
 assert.equal((await f.action(f.gm,'mapUpdate',{id:secretId,values:{title:'Donjon interdit',summary:'Exploration',visibility:'shared'}})).status,200);
 const playerState=(await f.call('state',undefined,f.player)).result.state;
 assert.equal(playerState.maps.length,1);assert.equal(playerState.maps[0].markers.length,1);
 assert.equal(playerState.maps[0].markers[0].title,'Pont visible');
 assert(!JSON.stringify(playerState).includes('Trésor caché'));
 assert(!JSON.stringify(playerState).includes('Dragon endormi'));
});
test('V2.5 : upload d’une carte et lecture authentifiée, puis contrôle de la publication',async t=>{
 const f=await fixture(t);const added=await f.action(f.gm,'mapAdd',{values:{title:'Carte du monde',summary:'Grand continent',visibility:'private'}});
 const id=added.result.state.maps[0].id;
 let res=await f.call('map/upload',{mapId:id,baseVersion:added.result.version,mime:'image/png',imageBase64:png.toString('base64')},f.player);assert.equal(res.status,403);
 res=await f.call('map/upload',{mapId:id,baseVersion:added.result.version,mime:'image/png',imageBase64:png.toString('base64')},f.gm);assert.equal(res.status,200);
 assert.equal(res.result.state.maps[0].hasImage,true);assert.equal((await f.call('map-image/'+id)).status,401);
 assert.equal((await f.call('map-image/'+id,undefined,f.player)).status,404);
 assert.deepEqual((await f.call('map-image/'+id,undefined,f.gm)).result,png);
 assert.equal((await f.call('map/upload',{mapId:id,baseVersion:res.result.version,mime:'image/svg+xml',imageBase64:Buffer.from('<svg/>').toString('base64')},f.gm)).status,400);
 assert.equal((await f.action(f.gm,'mapUpdate',{id,values:{title:'Carte du monde',summary:'Grand continent',visibility:'shared'}})).status,200);
 assert.deepEqual((await f.call('map-image/'+id,undefined,f.player)).result,png);
 assert.equal(fs.readdirSync(path.join(f.dir,'media')).length,1);
 const saved=JSON.parse(fs.readFileSync(f.dataFile,'utf8'));
 assert.equal(saved.format,5);assert.equal(saved.campaigns[0].state.maps[0].title,'Carte du monde');
 assert.equal((await f.action(f.gm,'mapDelete',{id})).status,200);
 assert.equal(fs.readdirSync(path.join(f.dir,'media')).length,0);
 assert.equal((await f.call('map-image/'+id,undefined,f.player)).status,404);
});
test('V2.5 : promotion co-MJ donne accès aux cartes privées ; retrait de rôle révoque cet accès',async t=>{
 const f=await fixture(t);await f.action(f.gm,'mapAdd',{values:{title:'Plan du traître',summary:'Texte secret',visibility:'private'}});
 const owner=(await f.call('management',undefined,f.gm)).result,uid=owner.members.find(m=>m.characterId==='aelin').userId;
 assert.equal((await f.call('state',undefined,f.player)).result.state.maps.length,0);
 assert.equal((await f.call('member/role',{userId:uid,role:'gm'},f.gm)).status,200);
 assert.equal((await f.call('state',undefined,f.player)).result.state.maps.length,1);
 assert.equal((await f.call('member/role',{userId:uid,role:'player'},f.gm)).status,200);
 assert.equal((await f.call('state',undefined,f.player)).result.state.maps.length,0);
});
test('V2.5 : navigation mobile, fonctionnalités MJ, aucune mécanique de lancer virtuel',()=>{
 const client=fs.readFileSync(path.join(__dirname,'..','src/online-app.js'),'utf8');const css=fs.readFileSync(path.join(__dirname,'..','src/styles.css'),'utf8');
 assert.match(client,/Cartes de campagne/);assert.match(client,/map-marker-form/);assert.match(client,/mapsPage\(\)/);
 assert.match(client,/data-map-canvas/);assert.match(css,/@media\(max-width:850px\)/);
 assert.match(client,/dés physiques|dés réels/i);
});
