'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {createServer}=require('../server');const M=require('../src/media'),A=require('../src/art-catalog');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/PvQAAAAASUVORK5CYII=','base64');
async function env(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-v16-'));const app=createServer({publicOrigin:null,dataFile:path.join(dir,'db.json'),setupKey:'test-bootstrap-key'});
 await new Promise(ok=>app.server.listen(0,'127.0.0.1',ok));t.after(async()=>{await app.close();fs.rmSync(dir,{force:true,recursive:true});});
 const url='http://127.0.0.1:'+app.server.address().port;
 async function call(route,body,auth=''){
  const r=await fetch(url+'/api/'+route,{method:body===undefined?'GET':'POST',headers:{...(body===undefined?{}:{'Content-Type':'application/json'}),...(auth?{Cookie:auth}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  const ct=r.headers.get('content-type')||'';const response=ct.startsWith('application/json')?await r.json():await r.arrayBuffer();return {status:r.status,response,cookie:r.headers.get('set-cookie')?.split(';')[0]||'',contentType:ct};
 }
 const gm=(await call('setup',{name:'MJ Illustration',password:'a-safe-password-123',setupKey:'test-bootstrap-key'})).cookie;
 const invite=(await call('invites',{characterId:'aelin'},gm)).response.code;
 const player=(await call('join',{name:'Joueur Illustration',password:'a-safe-password-456',code:invite})).cookie;
 async function mutate(actor,body){const before=(await call('state',undefined,actor)).response;return call('media/change',{baseVersion:before.version,...body},actor);}
 async function action(actor,kind,info={}){const before=(await call('state',undefined,actor)).response;return call('action',{baseVersion:before.version,kind,...info},actor);}
 return {dir,app,gm,player,call,mutate,action};
}
test('Catalogue de visuels existants, licences et formats d’images contrôlés',()=>{
 assert(A.entries.length>=160);assert(A.get('lorc/dragon-head','npc'));assert(A.get('lorc/fireball','spell'));assert(A.get('delapouite/ancient-sword','item'));assert(A.get('delapouite/fairy','character'));
 assert.equal(A.get('../index.html','character'),null);assert.throws(()=>M.validateBuiltin('lorc/dragon-head','spell'),/introuvable/);
 assert.equal(M.verify(png,'image/png').width,1);assert.throws(()=>M.verify(png,'image/svg+xml'),/seuls PNG/);
});
test('Avatar : import PNG sécurisé, lecture authentifiée, partage autorisé et suppression',async t=>{
 const e=await env(t);const b={mode:'upload',kind:'character',entityId:'aelin',characterId:'',visibility:'public',mime:'image/png',imageBase64:png.toString('base64')};
 assert.equal((await e.mutate(e.gm,b)).status,200);
 const gmState=(await e.call('state',undefined,e.gm)).response.state, entry=gmState.media[0];
 assert.equal(entry.kind,'character');assert(!('filename' in entry));
 assert.equal((await e.call('media/'+entry.id)).status,401);
 const playerImage=await e.call('media/'+entry.id,undefined,e.player);assert.equal(playerImage.status,200);assert.equal(playerImage.contentType,'image/png');
 assert.equal((await e.call('media/'+entry.id,undefined,e.gm)).status,200);
 assert.equal(fs.readdirSync(path.join(e.dir,'media')).length,1);
 assert.equal((await e.mutate(e.player,{mode:'delete',kind:'character',entityId:'brunna',characterId:'',visibility:'public'})).status,403);
 assert.equal((await e.mutate(e.gm,{mode:'delete',kind:'character',entityId:'aelin',characterId:'',visibility:'public'})).status,200);
 assert.equal((await e.call('media/'+entry.id,undefined,e.player)).status,404);
 assert.equal(fs.readdirSync(path.join(e.dir,'media')).length,0);
});
test('Créature masquée : aucune image et aucune référence envoyée au joueur, même par URL directe',async t=>{
 const e=await env(t),add=await e.action(e.gm,'npcAdd',{values:{name:'Dragon privé',kind:'monstre',hpMax:35,ac:15,initiative:6,speed:9,visibility:'hidden',showHp:false,actions:'Griffes (dés physiques)',notes:'Trésor MJ'}});
 assert.equal(add.status,200);const id=add.response.state.combat.npcs[0].id;
 assert.equal((await e.mutate(e.player,{mode:'builtin',kind:'npc',entityId:id,visibility:'public',builtinId:'lorc/dragon-head'})).status,403);
 assert.equal((await e.mutate(e.gm,{mode:'builtin',kind:'npc',entityId:id,visibility:'public',builtinId:'lorc/dragon-head'})).status,200);
 let state=(await e.call('state',undefined,e.player)).response.state;assert.equal(state.media.length,0);assert(!JSON.stringify(state).includes('Dragon privé'));
 const privateId=(await e.call('state',undefined,e.gm)).response.state.media[0].id;
 assert.equal((await e.call('media/'+privateId,undefined,e.player)).status,404);
 assert.equal((await e.action(e.gm,'npcUpdate',{id,values:{name:'Dragon privé',kind:'monstre',hpMax:35,ac:15,initiative:6,speed:9,visibility:'public',showHp:false,actions:'Griffes',notes:'Trésor MJ'}})).status,200);
 state=(await e.call('state',undefined,e.player)).response.state;
 assert.equal(state.media.length,1);assert.equal(state.media[0].builtinId,'lorc/dragon-head');
});
test('Illustrations privées, objets et sorts : contrôle de propriété et version optimiste',async t=>{
 const e=await env(t);
 const gmState=(await e.call('state',undefined,e.gm)).response;const before=gmState.version;
 assert.equal((await e.mutate(e.player,{mode:'builtin',kind:'character',entityId:'brunna',visibility:'public',builtinId:'delapouite/fairy'})).status,403);
 assert.equal((await e.mutate(e.player,{mode:'builtin',kind:'character',entityId:'aelin',visibility:'public',builtinId:'delapouite/fairy'})).status,200);
 assert.equal((await e.call('media/change',{mode:'builtin',kind:'character',entityId:'aelin',visibility:'public',builtinId:'delapouite/fairy',baseVersion:before},e.gm)).status,409);
 const added=await e.action(e.player,'itemAdd',{id:'aelin',name:'Épée du crépuscule',description:'Loot'});assert.equal(added.status,200);
 const item=added.response.state.characters.find(x=>x.id==='aelin').inventoryItems[0];
 assert.equal((await e.mutate(e.player,{mode:'builtin',kind:'item',entityId:item.id,characterId:'aelin',visibility:'public',builtinId:'delapouite/ancient-sword'})).status,200);
 const playerState=(await e.call('state',undefined,e.player)).response.state;
 assert.equal(playerState.media.find(m=>m.entityId===item.id).visibility,'private');
 assert.equal((await e.mutate(e.player,{mode:'builtin',kind:'item',entityId:item.id,characterId:'brunna',visibility:'private',builtinId:'delapouite/ancient-sword'})).status,403);
 const bad=await e.mutate(e.gm,{mode:'upload',kind:'character',entityId:'aelin',visibility:'public',mime:'image/svg+xml',imageBase64:Buffer.from('<svg onload="alert(1)"></svg>').toString('base64')});assert.equal(bad.status,400);
});
