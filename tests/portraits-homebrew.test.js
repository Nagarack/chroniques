'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const os=require('node:os');
const A=require('../src/art-catalog');
const {createServer}=require('../server');

async function boot(t,prepare){
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-41-'));fs.mkdirSync(path.join(tmp,'data'));const dataFile=path.join(tmp,'data','chroniques-db.json');
 let app=createServer({publicOrigin:null,dataFile,setupKey:'very-long-bootstrap-secret',fileGraceMs:0});await new Promise(ok=>app.server.listen(0,'127.0.0.1',ok));
 let base='http://127.0.0.1:'+app.server.address().port;
 const call=async(route,{method='GET',body,cookie=''}={})=>{const headers={};if(body!==undefined)headers['Content-Type']='application/json';if(cookie)headers.Cookie=cookie;const r=await fetch(base+route,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});let d=await r.text();try{d=JSON.parse(d);}catch{}return {status:r.status,data:d,cookie:r.headers.get('set-cookie')?.split(';')[0]||''};};
 const gm=(await call('/api/setup',{method:'POST',body:{name:'Maître Test',password:'Strong-Password-2026',setupKey:'very-long-bootstrap-secret'}})).cookie;
 if(prepare){await app.close();const db=JSON.parse(fs.readFileSync(dataFile,'utf8'));prepare(db);fs.writeFileSync(dataFile,JSON.stringify(db));
  app=createServer({publicOrigin:null,dataFile,setupKey:'very-long-bootstrap-secret',fileGraceMs:0});await new Promise(ok=>app.server.listen(0,'127.0.0.1',ok));base='http://127.0.0.1:'+app.server.address().port;}
 t.after(async()=>{await app.close();fs.rmSync(tmp,{recursive:true,force:true});});
 const login=prepare?(await call('/api/login',{method:'POST',body:{name:'Maître Test',password:'Strong-Password-2026'}})).cookie:gm;
 const action=async(kind,payload,cookie=login)=>{const s=(await call('/api/state',{cookie})).data;return call('/api/action',{method:'POST',cookie,body:{kind,baseVersion:s.version,...payload}});};
 return {call,gm:login,action,dataFile};
}

test('Portraits : une tête de monstre héritée d’une ancienne version est retirée une seule fois, les photos restent',async t=>{
 const f=await boot(t,db=>{const s=db.campaigns[0].state;delete s.migrations;const [a,b]=s.characters;
  s.media=[{id:'img-legacy1',kind:'character',entityId:a.id,characterId:'',visibility:'public',caption:'',featured:true,builtinId:'delapouite/goblin-head'},
   {id:'img-legacy2',kind:'character',entityId:b.id,characterId:'',visibility:'public',caption:'',featured:true,builtinId:'lorc/bowman'},
   {id:'img-npc',kind:'npc',entityId:'npc-x',characterId:'',visibility:'private',caption:'',featured:true,builtinId:'delapouite/goblin-head'}];});
 await f.action('campaignTitle',{value:'Après migration'});
 const st=JSON.parse(fs.readFileSync(f.dataFile,'utf8')).campaigns[0].state;assert.equal(st.migrations.classPortraits,true);
 assert.deepEqual(st.media.map(m=>m.id).sort(),['img-legacy2','img-npc'],'gobelin retiré du personnage, gardé pour la créature, portrait d’aventurier conservé');
 assert.equal(A.isPortrait('lorc/bowman'),true);assert.equal(A.isPortrait('delapouite/goblin-head'),false);
 assert.equal(A.src(A.classPortrait('ranger')),'/assets/icons/bowman.svg');
});

test('Objets maison : création, notes secrètes jamais copiées, don au joueur ou au butin, invisibles des joueurs',async t=>{
 const f=await boot(t);const HB=require('../src/homebrew-items');
 const st0=(await f.call('/api/state',{cookie:f.gm})).data.state;const pc=st0.characters[0];
 const inv=await f.call('/api/invites',{method:'POST',cookie:f.gm,body:{characterId:pc.id}});
 const pl=(await f.call('/api/join',{method:'POST',body:{name:'Joueuse Test',password:'LongPassword-2026',code:inv.data.code}})).cookie;
 const values={name:'Lame de l’aube',category:'weapon',rarity:'rare',attunement:true,weight:1.5,chargesMax:3,description:'+1 à l’attaque et aux dégâts ; 1 charge : lumière vive 6 m.',notes:'Maudite : se brise si le porteur ment.',icon:'delapouite/ancient-sword'};
 assert.equal((await f.action('libItemAdd',{values},pl)).status,403,'réservé au MJ');
 assert.equal((await f.action('libItemAdd',{values})).status,200);
 assert.equal((await f.action('libItemAdd',{values:{...values,rarity:'mythique'}})).status,400);
 let gmState=(await f.call('/api/state',{cookie:f.gm})).data.state;const item=gmState.gmLibrary.items[0];assert.equal(item.notes,values.notes);
 assert.equal((await f.call('/api/state',{cookie:pl})).data.state.gmLibrary,undefined,'bibliothèque jamais envoyée aux joueurs');
 assert.equal((await f.action('libItemGive',{id:item.id,characterId:pc.id,quantity:2})).status,200);
 assert.equal((await f.action('libItemGive',{id:item.id,characterId:'__loot',quantity:1})).status,200);
 const ps=(await f.call('/api/state',{cookie:pl})).data.state;const got=ps.characters.find(p=>p.id===pc.id).inventoryItems.find(x=>x.name==='Lame de l’aube');
 assert.equal(got.quantity,2);assert.equal(got.chargesMax,3);assert.match(got.description,/^Rare · harmonisation requise — \+1/);assert.ok(!JSON.stringify(ps).includes('Maudite'),'notes du MJ absentes');
 assert.ok(ps.media.some(m=>m.kind==='item'&&m.entityId===got.id&&m.builtinId==='delapouite/ancient-sword'),'icône associée à l’objet donné');
 gmState=(await f.call('/api/state',{cookie:f.gm})).data.state;assert.equal(gmState.lootStash.at(-1).name,'Lame de l’aube');
 assert.equal((await f.action('libItemUpdate',{id:item.id,values:{...values,name:'Lame du crépuscule'}})).status,200);
 assert.equal((await f.action('libItemDelete',{id:item.id})).status,200);
 const after=(await f.call('/api/state',{cookie:f.gm})).data.state;assert.equal(after.gmLibrary.items.length,0);assert.ok(after.characters.find(p=>p.id===pc.id).inventoryItems.some(x=>x.name==='Lame de l’aube'),'les exemplaires donnés restent');
 assert.throws(()=>HB.validate({...values,description:'x'.repeat(270)}),/Description trop longue/);
});

test('Interface : créer un monstre et un objet depuis l’accueil, le combat et la bibliothèque',()=>{
 const ui=fs.readFileSync(path.join(__dirname,'../src/online-app.js'),'utf8');
 for(const k of ['data-task="tpl-new"','data-task="libitem-new"','function homebrewItemsSection()','function libItemModal()','data-libitem-give=','data-catalog-copy=','data-libitem-direct=',"'Bibliothèque MJ'"])assert.ok(ui.includes(k),k);
 assert.ok((ui.match(/data-task="tpl-new"/g)||[]).length>=3,'accessible depuis plusieurs écrans');
});

test('Images importées : monstre et objet maison, copies indépendantes au combat et dans l’inventaire, jamais lisibles par un joueur',async t=>{
 const f=await boot(t);const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/PvQAAAAASUVORK5CYII=','base64').toString('base64');
 const st0=(await f.call('/api/state',{cookie:f.gm})).data.state;const pc=st0.characters[0];
 const inv=await f.call('/api/invites',{method:'POST',cookie:f.gm,body:{characterId:pc.id}});
 const pl=(await f.call('/api/join',{method:'POST',body:{name:'Joueuse Test',password:'LongPassword-2026',code:inv.data.code}})).cookie;
 assert.equal((await f.action('templateAdd',{values:{name:'Gardien d’os',kind:'monstre',hpMax:45,ac:14,initiative:2,speed:9,visibility:'hidden'},icon:''})).status,200);
 assert.equal((await f.action('libItemAdd',{values:{name:'Lame de l’aube',category:'weapon',rarity:'rare',attunement:false,weight:1,chargesMax:0,description:'+1',notes:'',icon:''}})).status,200);
 let s=(await f.call('/api/state',{cookie:f.gm})).data;const tpl=s.state.gmLibrary.templates[0],item=s.state.gmLibrary.items[0];
 const up=async(target,id,cookie=f.gm,extra={})=>{const v=(await f.call('/api/state',{cookie:f.gm})).data.version;return f.call('/api/library/image',{method:'POST',cookie,body:{target,id,mime:'image/png',imageBase64:png,baseVersion:v,...extra}});};
 assert.equal((await up('template',tpl.id,pl)).status,403,'réservé au MJ');
 assert.equal((await up('template',tpl.id)).status,200);assert.equal((await up('libitem',item.id)).status,200);
 assert.equal((await up('template','tpl-inconnu')).status,400);
 assert.equal((await f.call('/api/library-image/template/'+tpl.id,{cookie:f.gm})).status,200);
 assert.equal((await f.call('/api/library-image/template/'+tpl.id,{cookie:pl})).status,403,'jamais lisible par un joueur');
 assert.equal((await f.action('templateDeploy',{id:tpl.id,quantity:2})).status,200);
 assert.equal((await f.action('libItemGive',{id:item.id,characterId:pc.id,quantity:1})).status,200);
 s=(await f.call('/api/state',{cookie:f.gm})).data.state;
 const npcs=s.combat.npcs.filter(n=>n.name.startsWith('Gardien'));assert.equal(npcs.length,2);assert.equal(new Set(npcs.map(n=>n.group)).size,1);
 const npcMedia=s.media.filter(m=>m.kind==='npc'&&npcs.some(n=>n.id===m.entityId));assert.equal(npcMedia.length,2,'chaque créature a son image');
 const given=s.characters.find(p=>p.id===pc.id).inventoryItems.find(x=>x.name==='Lame de l’aube');
 const itemMedia=s.media.find(m=>m.kind==='item'&&m.entityId===given.id);assert.ok(itemMedia);
 assert.equal((await f.call('/api/media/'+itemMedia.id,{cookie:pl})).status,200,'le joueur voit l’image de son objet');
 assert.equal((await f.call('/api/media/'+npcMedia[0].id,{cookie:pl})).status,404,'créature masquée : image invisible');
 // Supprimer la fiche maison n'efface pas les copies.
 assert.equal((await f.action('libItemDelete',{id:item.id})).status,200);
 assert.equal((await f.call('/api/media/'+itemMedia.id,{cookie:pl})).status,200);
 await new Promise(r=>setTimeout(r,50));const files=fs.readdirSync(path.join(path.dirname(f.dataFile),'media'));assert.equal(files.length,4,'modèle + 2 créatures + objet donné (fichier de l’objet maison supprimé)');
 const v=(await f.call('/api/state',{cookie:f.gm})).data.version;assert.equal((await f.call('/api/library/image',{method:'POST',cookie:f.gm,body:{target:'template',id:tpl.id,remove:true,baseVersion:v}})).status,200);
 assert.equal((await f.call('/api/library-image/template/'+tpl.id,{cookie:f.gm})).status,404);
});
