'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {createServer}=require('../server'),L=require('../src/logic'),CM=require('../src/campaign-maps');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/PvQAAAAASUVORK5CYII=','base64');
async function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-v251-')),dataFile=path.join(dir,'chroniques-db.json'),app=createServer({publicOrigin:null,dataFile,setupKey:'pin-test-key'});
 await new Promise(ok=>app.server.listen(0,'127.0.0.1',ok));t.after(async()=>{await app.close();fs.rmSync(dir,{recursive:true,force:true});});
 const origin='http://127.0.0.1:'+app.server.address().port;
 async function call(route,b,auth=''){
  const res=await fetch(origin+'/api/'+route,{method:b===undefined?'GET':'POST',headers:{...(b!==undefined?{'Content-Type':'application/json'}:{}),...(auth?{Cookie:auth}:{})},body:b===undefined?undefined:JSON.stringify(b)});
  const ct=res.headers.get('content-type')||'';return {status:res.status,result:ct.startsWith('application/json')?await res.json():Buffer.from(await res.arrayBuffer()),cookie:res.headers.get('set-cookie')?.split(';')[0]};
 }
 const gm=(await call('setup',{name:'MJ cartes',password:'pin-test-pwd-123',setupKey:'pin-test-key'})).cookie;
 const inv=(await call('invites',{characterId:'aelin'},gm)).result;
 const player=(await call('join',{name:'Joueur test',password:'player-test-pwd-456',code:inv.code})).cookie;
 const action=async(auth,kind,params={})=>call('action',{baseVersion:(await call('state',undefined,auth)).result.version,kind,...params},auth);
 const createMap=async(visibility='private')=>{const out=await action(gm,'mapAdd',{values:{title:'Monde',summary:'Résumé',visibility}});return out.result.state.maps.at(-1).id;};
 const createPin=async(mapId,title,visibility='private',extra={})=>{const out=await action(gm,'mapMarkerAdd',{id:mapId,values:{title,description:'Indice '+title,visibility,x:350,y:420,...extra}});return out.result.state.maps.find(m=>m.id===mapId).markers.at(-1).id;};
 const upload=async(auth,mapId,pinId,version)=>(await call('map-pin/upload',{baseVersion:version,mapId,markerId:pinId,mime:'image/png',imageBase64:png.toString('base64')},auth));
 return {dir,gm,player,call,action,createMap,createPin,upload,dataFile};
}
test('V2.5.1 : icônes cataloguées, symboles et liaison au modèle protégée',()=>{
 const s=L.initialState();CM.add(s,'map-abcdefghi',{title:'Collines',summary:'',visibility:'shared'});
 const values={title:'Coffre',description:'Contenu inconnu',visibility:'shared',x:200,y:500,symbol:'chest',imageChoice:'builtin:delapouite/chest'};
 CM.markerAdd(s,'map-abcdefghi','pin-abcdefgh',values);
 const show=CM.projected(s,{role:'player'})[0].markers[0];
 assert.equal(show.symbol,'chest');assert.equal(show.builtinId,'delapouite/chest');assert(!('linked' in show));
 assert.throws(()=>CM.markerUpdate(s,'map-abcdefghi','pin-abcdefgh',{...values,imageChoice:'builtin:artist/payload.svg'}),/catalogue/);
 assert.throws(()=>CM.markerUpdate(s,'map-abcdefghi','pin-abcdefgh',{...values,symbol:'<img onerror=alert(1)>'}),/Icône/);
 const tpl={id:'tpl-abcdefgh',name:'Gobelin',kind:'monstre'};s.gmLibrary={templates:[tpl]};
 CM.markerUpdate(s,'map-abcdefghi','pin-abcdefgh',{...values,imageChoice:'keep',linkKind:'template',linkId:tpl.id});
 assert.equal(CM.projected(s,{role:'gm'})[0].markers[0].linked.id,tpl.id);
 assert(!JSON.stringify(CM.projected(s,{role:'player'})).includes(tpl.id));
 assert.throws(()=>CM.markerUpdate(s,'map-abcdefghi','pin-abcdefgh',{...values,linkKind:'template',linkId:'tpl-invalid'}),/introuvable/);
});
test('V2.5.1 : joueur ne lit ni images de carte, ni images de repères privés; aucune fuite dans état',async t=>{
 const f=await fixture(t),map=await f.createMap('private'),pin=await f.createPin(map,'Monstre secret');
 let gm=(await f.call('state',undefined,f.gm)).result;
 assert.equal((await f.upload(f.player,map,pin,gm.version)).status,403);
 let up=await f.upload(f.gm,map,pin,gm.version);assert.equal(up.status,200);
 assert.equal((await f.call('map-pin-image/'+map+'/'+pin,undefined,f.gm)).status,200);
 assert.equal((await f.call('map-pin-image/'+map+'/'+pin)).status,401);
 assert.equal((await f.call('map-pin-image/'+map+'/'+pin,undefined,f.player)).status,404);
 await f.action(f.gm,'mapUpdate',{id:map,values:{title:'Monde',summary:'Résumé',visibility:'shared'}});
 assert.equal((await f.call('map-pin-image/'+map+'/'+pin,undefined,f.player)).status,404);
 assert(!JSON.stringify((await f.call('state',undefined,f.player)).result).includes('Monstre secret'));
 const show=await f.action(f.gm,'mapMarkerUpdate',{id:map,markerId:pin,values:{title:'Gobelins',description:'Patrouille',visibility:'shared',x:350,y:420,imageChoice:'keep',symbol:'monster'}});
 assert.equal(show.status,200);
 assert.deepEqual((await f.call('map-pin-image/'+map+'/'+pin,undefined,f.player)).result,png);
 const playerState=(await f.call('state',undefined,f.player)).result;
 assert.equal(playerState.state.maps[0].markers[0].hasImage,true);
 assert(!JSON.stringify(playerState).includes('filename'));
});
test('V2.5.1 : révocation image et nettoyage après suppression de repère et carte',async t=>{
 const f=await fixture(t),map=await f.createMap('shared'),pin=await f.createPin(map,'Coffre','shared');
 const initial=(await f.call('state',undefined,f.gm)).result;
 await f.upload(f.gm,map,pin,initial.version);
 assert.equal(fs.readdirSync(path.join(f.dir,'media')).length,1);
 assert.equal((await f.action(f.gm,'mapMarkerUpdate',{id:map,markerId:pin,values:{title:'Coffre',description:'',visibility:'shared',x:350,y:420,imageChoice:'builtin:delapouite/chest',symbol:'chest'}})).status,200);
 assert.equal(fs.readdirSync(path.join(f.dir,'media')).length,0);
 assert.equal((await f.call('map-pin-image/'+map+'/'+pin,undefined,f.player)).status,404);
 const pin2=await f.createPin(map,'Garde','shared'),v=(await f.call('state',undefined,f.gm)).result.version;
 await f.upload(f.gm,map,pin2,v);
 await f.action(f.gm,'mapDelete',{id:map});
 assert.equal(fs.readdirSync(path.join(f.dir,'media')).length,0);
 assert.equal((await f.call('map-pin-image/'+map+'/'+pin2,undefined,f.player)).status,404);
});
test('V2.5.1 : co-MJ peut ajouter une image, ses droits sont révoqués à la rétrogradation',async t=>{
 const f=await fixture(t),map=await f.createMap('private'),pin=await f.createPin(map,'Boss');
 const owner=(await f.call('management',undefined,f.gm)).result,uid=owner.members.find(x=>x.characterId==='aelin').userId;
 await f.call('member/role',{userId:uid,role:'gm'},f.gm);
 const v=(await f.call('state',undefined,f.player)).result.version;
 assert.equal((await f.upload(f.player,map,pin,v)).status,200);
 await f.call('member/role',{userId:uid,role:'player'},f.gm);
 assert.equal((await f.call('map-pin-image/'+map+'/'+pin,undefined,f.player)).status,404);
 assert.equal((await f.action(f.player,'mapMarkerDelete',{id:map,markerId:pin})).status,403);
 const saved=JSON.parse(fs.readFileSync(f.dataFile,'utf8'));
 assert.equal(saved.format,5);assert.equal(saved.campaigns[0].state.maps[0].markers[0].image.source,'upload');
});
test('V2.5.1 : interface interactive et navigation vers fiche liée restent privées',()=>{
 const root=path.join(__dirname,'..');
 const app=fs.readFileSync(path.join(root,'src/online-app.js'),'utf8');const css=fs.readFileSync(path.join(root,'src/styles.css'),'utf8');
 for(const marker of ['map-pin-upload-form','map-pin-image','mapPinVisual','mapLinkedChoices','data-map-follow','name="symbol"','name="imageChoice"'])assert(app.includes(marker),marker);
 assert(css.includes('map-pin-art'));assert(!app.includes('Math.random('));
});

test('V2.5.1 : rendu réel du tableau de cartes, formulaires MJ masqués pour les joueurs',async()=>{
 const vm=require('node:vm'),P=require('../src/progression'),O=require('../src/origins'),H=require('../src/heritage'),S=require('../src/spells'),G=require('../src/spell-guide'),N=require('../src/creatures'),A=require('../src/art-catalog');
 const code=fs.readFileSync(path.join(__dirname,'../src/online-app.js'),'utf8');
 async function paint(role){
  const state=L.initialState();CM.add(state,'map-abcdefgh',{title:'Carte de test',summary:'Région',visibility:'shared'});
  CM.markerAdd(state,'map-abcdefgh','pin-abcdefgh',{title:'Coffre',description:'Butin',visibility:'shared',symbol:'chest',imageChoice:'builtin:delapouite/chest',x:110,y:250});
  CM.markerAdd(state,'map-abcdefgh','pin-private123',{title:'Piège secret',description:'Secret absolu',visibility:'private',symbol:'trap',x:120,y:260});
  const viewer={name:role,role,characterId:role==='gm'?null:'aelin'};
  const publicState={...state,maps:CM.projected(state,viewer)};
  const elements={},listeners={};const el=s=>elements[s]||={innerHTML:'',textContent:'',classList:{add(){},remove(){},toggle(){}}};
  const document={querySelector:el,querySelectorAll:()=>[],addEventListener:(n,fn)=>{listeners[n]=fn;}};
  const fetch=async url=>({ok:true,status:200,json:async()=>url==='/api/status'?{version:'2.8.0',setupRequired:false,networkMode:'local'}:url==='/api/me'?{authenticated:true}:{version:1,viewer,state:publicState}});
  class EventSource{addEventListener(){}close(){}}
  vm.runInNewContext(code,{window:{ChroniquesUiHelpers:require('../src/ui-helpers'),ChroniquesLogic:L,ChroniquesProgression:P,ChroniquesOrigins:O,ChroniquesHeritage:H,ChroniquesSpells:S,ChroniquesSpellGuide:G,ChroniquesCreatures:N,ChroniquesArt:A,ChroniquesInventory:require('../src/inventory'),scrollTo(){}},document,fetch,EventSource,console,setTimeout:()=>1,clearTimeout:()=>{},Date,Math,JSON,Number,Boolean,String,Array,Promise,navigator:{}});
  await new Promise(setImmediate);await new Promise(setImmediate);
  listeners.click({target:{closest:()=>({dataset:{nav:'maps'}})}});
  if(role==='gm')listeners.click({target:{closest:()=>({dataset:{mapPin:'pin-abcdefgh'}})}});
  return elements['#app'].innerHTML;
 }
 const gm=await paint('gm'),player=await paint('player');
 for(const s of ['map-marker-form','map-pin-upload-form','imageChoice','linkChoice','map-pin-art','Coffre','Piège secret'])assert(gm.includes(s),s);
 for(const s of ['map-pin-art','Coffre','Cartes de campagne'])assert(player.includes(s),s);
 assert(!player.includes('Piège secret'));assert(!player.includes('Secret absolu'));
 assert(!player.includes('map-marker-form'));assert(!player.includes('map-pin-upload-form'));
});
