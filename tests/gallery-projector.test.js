'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {createServer}=require('../server');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/PvQAAAAASUVORK5CYII=','base64');
async function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chron-v17-'));
 const dataFile=path.join(dir,'chroniques-db.json');
 let app=createServer({publicOrigin:null,dataFile,setupKey:'test-setup'});
 await new Promise(r=>app.server.listen(0,'127.0.0.1',r));
 t.after(async()=>{if(app)await app.close();fs.rmSync(dir,{recursive:true,force:true});});
 const endpoint=()=>`http://127.0.0.1:${app.server.address().port}`;
 async function call(route,b,auth=''){
  const r=await fetch(endpoint()+'/api/'+route,{method:b===undefined?'GET':'POST',headers:{...(auth?{Cookie:auth}:{}),...(b!==undefined?{'Content-Type':'application/json'}:{})},body:b===undefined?undefined:JSON.stringify(b)});
  const type=r.headers.get('content-type')||'';
  return {status:r.status,data:type.includes('json')?await r.json():await r.arrayBuffer(),cookie:r.headers.get('set-cookie')?.split(';')[0]||''};
 }
 const gm=(await call('setup',{name:'MJ Test',password:'some-strong-password',setupKey:'test-setup'})).cookie;
 const invitation=(await call('invites',{characterId:'aelin'},gm)).data.code;
 const player=(await call('join',{name:'Joueur Test',password:'another-secure-password',code:invitation})).cookie;
 const state=async user=>(await call('state',undefined,user)).data;
 const action=async(u,kind,rest={})=>call('action',{baseVersion:(await state(u)).version,kind,...rest},u);
 const media=async(u,rest)=>call('media/change',{baseVersion:(await state(u)).version,kind:'character',entityId:'aelin',characterId:'',visibility:'public',...rest},u);
 return {dir,gm,player,call,state,action,media,restart:async()=>{await app.close();app=createServer({publicOrigin:null,dataFile,setupKey:'test-setup'});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));}};
}
test('V1.7 : galerie ajoute sans écraser, promouvoit et supprime l’image principale',async t=>{
 const f=await fixture(t);
 assert.equal((await f.media(f.gm,{mode:'builtin',builtinId:'delapouite/fairy'})).status,200);
 const original=(await f.state(f.gm)).state.media[0];
 assert.equal(original.featured,true);
 const added=await f.media(f.gm,{mode:'upload',addToGallery:true,caption:'Portrait alternatif',mime:'image/png',imageBase64:png.toString('base64')});
 assert.equal(added.status,200);
 const gallery=(await f.state(f.gm)).state.media;
 assert.equal(gallery.length,2);assert.equal(gallery.find(x=>x.featured).id,original.id);
 const second=gallery.find(x=>x.id!==original.id);
 assert.equal(second.caption,'Portrait alternatif');assert.equal(second.featured,false);
 assert.equal((await f.media(f.player,{mode:'feature',mediaId:second.id})).status,200);
 assert.equal((await f.state(f.gm)).state.media.find(x=>x.featured).id,second.id);
 assert.equal((await f.media(f.gm,{mode:'delete',mediaId:second.id})).status,200);
 assert.equal((await f.state(f.gm)).state.media[0].id,original.id);
 assert.equal((await f.state(f.gm)).state.media[0].featured,true);
 assert.equal(fs.readdirSync(path.join(f.dir,'media')).length,0);
});
test('V1.7 : limites par galerie, permissions et version obsolète',async t=>{
 const f=await fixture(t);
 for(let i=0;i<8;i++){
  const r=await f.media(f.gm,{mode:'builtin',addToGallery:true,builtinId:'delapouite/fairy'});
  assert.equal(r.status,200);
 }
 assert.equal((await f.media(f.gm,{mode:'builtin',addToGallery:true,builtinId:'delapouite/fairy'})).status,400);
 const gallery=(await f.state(f.gm)).state.media;
 assert.equal(gallery.length,8);
 const id=gallery[1].id;
 assert.equal((await f.call('media/change',{baseVersion:(await f.state(f.player)).version,kind:'character',entityId:'brunna',visibility:'public',mode:'feature',mediaId:id},f.player)).status,403);
 assert.equal((await f.media(f.gm,{mode:'feature',mediaId:'not-a-media'})).status,400);
 assert.equal((await f.media(f.gm,{mode:'builtin',builtinId:'delapouite/fairy',caption:'X'.repeat(101)})).status,400);
});
test('V1.7 : projecteur MJ montre une image privée SANS révéler la fiche du monstre',async t=>{
 const f=await fixture(t);
 const n=await f.action(f.gm,'npcAdd',{values:{name:'Créature secrète ABC',kind:'monstre',hpMax:37,ac:18,initiative:8,speed:12,visibility:'hidden',showHp:false,actions:'Tactique secrète',notes:'Notes cachées DEF'}});
 assert.equal(n.status,200);const id=n.data.state.combat.npcs[0].id;
 const upload=await f.call('media/change',{baseVersion:(await f.state(f.gm)).version,kind:'npc',entityId:id,characterId:'',visibility:'private',mode:'upload',mime:'image/png',imageBase64:png.toString('base64')},f.gm);
 assert.equal(upload.status,200);
 const mediaId=upload.data.state.media[0].id;
 const before=await f.state(f.player);assert.equal(before.state.media.length,0);assert.equal(before.state.spotlight,null);
 assert.equal((await f.call('media/'+mediaId,undefined,f.player)).status,404);
 assert.equal((await f.action(f.player,'spotlightShow',{mediaId,title:'Sans permission'})).status,403);
 assert.equal((await f.action(f.gm,'spotlightShow',{mediaId,title:'Silhouette dans la brume'})).status,200);
 const show=await f.state(f.player);
 assert.equal(show.state.media.length,0);assert.equal(show.state.combat.npcs.length,0);
 assert.equal(show.state.spotlight.title,'Silhouette dans la brume');
 const serialized=JSON.stringify(show.state);
 assert(!serialized.includes('Créature secrète ABC'));assert(!serialized.includes('Notes cachées DEF'));assert(!serialized.includes('Tactique secrète'));
 assert.equal((await f.call('media/'+mediaId,undefined,f.player)).status,200);
 assert.equal((await f.action(f.player,'spotlightHide')).status,403);
 assert.equal((await f.action(f.gm,'spotlightHide')).status,200);
 assert.equal((await f.state(f.player)).state.spotlight,null);
 assert.equal((await f.call('media/'+mediaId,undefined,f.player)).status,404);
});
test('V1.7 : illustration projetée révoquée après suppression, et galerie conservée après redémarrage',async t=>{
 const f=await fixture(t);
 await f.media(f.gm,{mode:'builtin',builtinId:'delapouite/fairy'});
 await f.media(f.gm,{mode:'upload',addToGallery:true,mime:'image/png',imageBase64:png.toString('base64')});
 const imgs=(await f.state(f.gm)).state.media;
 await f.action(f.gm,'spotlightShow',{mediaId:imgs[1].id,title:'Un portrait'});
 assert((await f.state(f.player)).state.spotlight);
 await f.media(f.gm,{mode:'delete',mediaId:imgs[1].id});
 assert.equal((await f.state(f.player)).state.spotlight,null);
 assert.equal((await f.call('media/'+imgs[1].id,undefined,f.player)).status,404);
 await f.restart();
 // Les sessions sont volontairement volatiles. Après redémarrage, reconnecter le MJ.
 const login=await f.call('login',{name:'MJ Test',password:'some-strong-password'});
 assert.equal(login.status,200);
 const persisted=(await f.state(login.cookie)).state.media;
 assert.equal(persisted.length,1);assert.equal(persisted[0].featured,true);
});
test('Interface V1.7 : recadrage, galerie, projecteur et aucun lancer de dés virtuel',()=>{
 const app=fs.readFileSync(path.join(__dirname,'../src/online-app.js'),'utf8');
 assert.match(app,/media-crop-canvas/);assert.match(app,/drawCrop/);assert.match(app,/data-media-show/);
 assert.match(app,/spotlightHtml/);assert.match(app,/gallery-grid/);assert.doesNotMatch(app,/Math\.random\(/);
});
