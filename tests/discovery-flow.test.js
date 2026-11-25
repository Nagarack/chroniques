'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createServer}=require('../server'),CM=require('../src/campaign-maps'),MT=require('../src/map-treasure'),L=require('../src/logic');
function loot(name,quantity){return {name,quantity,description:'NOTE PRIVÉE DU MJ',category:'treasure',weight:0,chargesMax:0,charges:0,equipped:false,attuned:false};}
test('V2.8 : commandes de visibilité conservent cartes, images, liaisons et butin',()=>{
 const s=L.initialState();CM.add(s,'map-abcdefgh',{title:'Forêt',summary:'',visibility:'private'});
 CM.markerAdd(s,'map-abcdefgh','pin-abcdefgh',{title:'Coffre',description:'Texte public',visibility:'private',x:200,y:500,symbol:'chest'});
 const pin=CM.markerRead(s,'map-abcdefgh','pin-abcdefgh');pin.image={source:'upload',filename:'test.webp'};MT.add(s,'map-abcdefgh','pin-abcdefgh','chest-abcdefgh',loot('Pierre de lune',3));
 CM.setMapVisibility(s,'map-abcdefgh','shared');assert.equal(CM.projected(s,{role:'player'})[0].markers.length,0);
 CM.setMarkerVisibility(s,'map-abcdefgh','pin-abcdefgh','shared');let player=CM.projected(s,{role:'player'});
 assert.equal(player[0].markers[0].title,'Coffre');assert(!JSON.stringify(player).includes('Pierre de lune'));assert(!JSON.stringify(player).includes('NOTE PRIVÉE'));
 assert.equal(pin.image.filename,'test.webp');assert.equal(pin.x,200);assert.equal(pin.loot[0].quantity,3);
 MT.reveal(s,'map-abcdefgh','pin-abcdefgh',true);player=CM.projected(s,{role:'player'});assert.equal(player[0].markers[0].publicLoot[0].name,'Pierre de lune');assert(!JSON.stringify(player).includes('NOTE PRIVÉE'));
 CM.setMarkerVisibility(s,'map-abcdefgh','pin-abcdefgh','private');assert.equal(CM.projected(s,{role:'player'})[0].markers.length,0);
 CM.setMapVisibility(s,'map-abcdefgh','private');assert.equal(CM.projected(s,{role:'player'}).length,0);
 assert.throws(()=>CM.setMapVisibility(s,'map-abcdefgh','everyone'),/Visibilité invalide/);
 assert.throws(()=>CM.setMarkerVisibility(s,'map-abcdefgh','pin-abcdefgh','everyone'),/Visibilité invalide/);
 assert.throws(()=>CM.setMapVisibility(s,'map-notfound','shared'),/introuvable/);
 assert.throws(()=>CM.setMarkerVisibility(s,'map-abcdefgh','pin-notfound','shared'),/introuvable/);
});
async function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-v28-'));const db=path.join(dir,'db.json');const app=createServer({publicOrigin:null,dataFile:db,setupKey:'v28-test-key'});
 await new Promise(ok=>app.server.listen(0,'127.0.0.1',ok));t.after(async()=>{await app.close();fs.rmSync(dir,{recursive:true,force:true});});
 const base='http://127.0.0.1:'+app.server.address().port;
 async function req(route,values,auth=''){const res=await fetch(base+'/api/'+route,{method:values===undefined?'GET':'POST',headers:{...(values===undefined?{}:{'Content-Type':'application/json'}),...(auth?{Cookie:auth}:{})},body:values===undefined?undefined:JSON.stringify(values)});return {status:res.status,value:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]};}
 const gm=(await req('setup',{name:'MJ V28',password:'secure-password-28',setupKey:'v28-test-key'})).cookie;
 const invite=(await req('invites',{characterId:'aelin'},gm)).value;
 const player=(await req('join',{name:'Joueur V28',password:'player-password-28',code:invite.code})).cookie;
 const action=async(cookie,kind,params={})=>req('action',{baseVersion:(await req('state',undefined,cookie)).value.version,kind,...params},cookie);
 return {req,action,gm,player,db};
}
test('V2.8 : API progression privée → repère partagé → butin partagé → inventaire',async t=>{
 const f=await fixture(t);
 const add=await f.action(f.gm,'mapAdd',{values:{title:'Ruine',summary:'',visibility:'private'}});const map=add.value.state.maps[0].id;
 const added=await f.action(f.gm,'mapMarkerAdd',{id:map,values:{title:'Coffre secret',description:'Salle',visibility:'private',x:444,y:355,symbol:'chest'}});const pin=added.value.state.maps[0].markers[0].id;
 assert.equal((await f.action(f.gm,'mapLootAdd',{id:map,markerId:pin,values:loot('Anneau magique',2)})).status,200);
 assert.equal((await f.req('state',undefined,f.player)).value.state.maps.length,0);
 assert.equal((await f.action(f.player,'mapVisibilitySet',{id:map,visibility:'shared'})).status,403);
 assert.equal((await f.action(f.player,'mapMarkerVisibilitySet',{id:map,markerId:pin,visibility:'shared'})).status,403);
 assert.equal((await f.action(f.gm,'mapVisibilitySet',{id:map,visibility:'shared'})).status,200);
 assert.equal((await f.req('state',undefined,f.player)).value.state.maps[0].markers.length,0);
 assert.equal((await f.action(f.gm,'mapMarkerVisibilitySet',{id:map,markerId:pin,visibility:'shared'})).status,200);
 let pub=(await f.req('state',undefined,f.player)).value.state;assert.equal(pub.maps[0].markers[0].title,'Coffre secret');assert(!JSON.stringify(pub).includes('Anneau magique'));
 assert.equal((await f.action(f.gm,'mapLootReveal',{id:map,markerId:pin,revealed:true})).status,200);
 pub=(await f.req('state',undefined,f.player)).value.state;assert.equal(pub.maps[0].markers[0].publicLoot[0].name,'Anneau magique');assert(!JSON.stringify(pub).includes('NOTE PRIVÉE DU MJ'));
 const gmState=(await f.req('state',undefined,f.gm)).value.state;const lotId=gmState.maps[0].markers[0].loot[0].id;
 assert.equal((await f.action(f.player,'mapLootGive',{id:map,markerId:pin,lootId:lotId,characterId:'aelin',quantity:1})).status,403);
 assert.equal((await f.action(f.gm,'mapLootGive',{id:map,markerId:pin,lootId:lotId,characterId:'aelin',quantity:1})).status,200);
 const remaining=(await f.req('state',undefined,f.gm)).value.state;assert.equal(remaining.maps[0].markers[0].loot[0].quantity,1);assert.equal(remaining.characters.find(x=>x.id==='aelin').inventoryItems.at(-1).quantity,1);
 assert.equal((await f.action(f.gm,'mapMarkerVisibilitySet',{id:map,markerId:pin,visibility:'private'})).status,200);
 assert.equal((await f.req('state',undefined,f.player)).value.state.maps[0].markers.length,0);
 assert.equal((await f.action(f.gm,'mapVisibilitySet',{id:map,visibility:'private'})).status,200);
 assert.equal((await f.req('state',undefined,f.player)).value.state.maps.length,0);
 const persisted=JSON.parse(fs.readFileSync(f.db,'utf8'));assert.equal(persisted.format,5);
});
test('V2.8 : co-MJ utilise les raccourcis, rétrogradation retire son accès',async t=>{
 const f=await fixture(t);let add=await f.action(f.gm,'mapAdd',{values:{title:'Carte',summary:'',visibility:'private'}});const id=add.value.state.maps[0].id;
 const management=(await f.req('management',undefined,f.gm)).value;const uid=management.roleAssignments.find(x=>x.role==='player').userId;
 assert.equal((await f.req('member/role',{userId:uid,role:'gm'},f.gm)).status,200);
 assert.equal((await f.action(f.player,'mapVisibilitySet',{id,visibility:'shared'})).status,200);
 assert.equal((await f.req('member/role',{userId:uid,role:'player'},f.gm)).status,200);
 assert.equal((await f.action(f.player,'mapVisibilitySet',{id,visibility:'private'})).status,403);
});
test('V2.8 : intégration découverte rapide, cache public versionné et dés physiques',()=>{
 const root=path.join(__dirname,'..');const code=fs.readFileSync(path.join(root,'src/online-app.js'),'utf8');const css=fs.readFileSync(path.join(root,'src/styles.css'),'utf8');const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 for(const term of ['mapDiscoveryPanel','map-discovery-give','mapVisibilitySet','mapMarkerVisibilitySet','map-quick-index','map-loot-advanced','mapQuickPin','mapQuickMap'])assert(code.includes(term),term);
 assert(css.includes('@media(max-width:520px)'));assert(sw.includes('chroniques-public-v'));assert(!sw.includes('/api/state'));assert(!code.includes('Math.random('));assert(code.includes('Dés physiques'));
});
