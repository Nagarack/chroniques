'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const O=require('../src/origins'),H=require('../src/heritage'),L=require('../src/logic'),{createServer}=require('../server');
const base={str:13,dex:14,con:12,int:12,wis:13,cha:11};
function origin(speciesId='elf',variantId='high',edition='2024'){
 const data={speciesId,variantId,backgroundId:'acolyte',baseScores:{...base}};
 if(edition==='2024')Object.assign(data,{distribution:'split',plus2:'wis',plus1:'cha'});
 if(edition==='2014')delete data.variantId;
 return O.compute(data,edition).origin;
}
function pc(species='elf',variant='high',level=1,edition='2024'){return {level,origin:origin(species,variant,edition),stats:{abilities:{...base}}};}
const find=(pc,edition,id)=>H.features(pc,edition).find(x=>x.id===id);
test('2024 : elfes déverrouillent les sorts au niveau 3 et 5 avec charges indépendantes',()=>{
 const e=pc('elf','high',1);let f=find(e,'2024','elf-spell-3');assert.equal(f.unlocked,false);assert.equal(f.left,1);
 assert.throws(()=>H.spend(e,'2024','elf-spell-3',1),/verrouillée/);
 e.level=3;H.spend(e,'2024','elf-spell-3',1);assert.equal(find(e,'2024','elf-spell-3').left,0);
 assert.equal(find(e,'2024','elf-spell-5').unlocked,false);e.level=5;
 assert.equal(find(e,'2024','elf-spell-5').left,1);H.recover(e,'2024','short');assert.equal(find(e,'2024','elf-spell-3').left,0);
 H.recover(e,'2024','long');assert.equal(find(e,'2024','elf-spell-3').left,1);
});
test('2024 : Tieffelin inférnal, drakéide et goliath ont les paliers attendus',()=>{
 const t=pc('tiefling','infernal',5);assert.equal(find(t,'2024','tf-spell-5').name,'Ténèbres');
 assert.equal(find(t,'2024','tf-spell-3').uses,1);assert.equal(find(t,'2024','tf-cantrip').uses,null);
 const d=pc('dragonborn','red',5);assert.equal(find(d,'2024','dr-breath').uses,3);assert.match(find(d,'2024','dr-breath').description,/2d10/);
 assert.equal(find(d,'2024','dr-flight').unlocked,true);d.level=11;assert.match(find(d,'2024','dr-breath').description,/3d10/);
 const g=pc('goliath','cloud',4);assert.equal(find(g,'2024','gol-large').unlocked,false);g.level=5;assert.equal(find(g,'2024','gol-large').unlocked,true);
});
test('2024 : orc récupération court et long, raciaux gratuits sans automatisation des effets',()=>{
 const o=pc('orc',null,5);assert.equal(find(o,'2024','orc-rush').uses,3);
 H.spend(o,'2024','orc-rush',1);H.spend(o,'2024','orc-endure',1);assert.equal(find(o,'2024','orc-rush').left,2);
 H.recover(o,'2024','short');assert.equal(find(o,'2024','orc-rush').left,3);assert.equal(find(o,'2024','orc-endure').left,0);
 H.recover(o,'2024','long');assert.equal(find(o,'2024','orc-endure').left,1);
});
test('dwarf/gold dragon / gnome et niveaux changés sans pertes de ressource',()=>{
 const d=pc('dwarf','',5);assert.equal(find(d,'2024','dw-stone').uses,3);
 const gn=pc('gnome','forest',1);assert.equal(find(gn,'2024','gn-animals').uses,2);
 const dr=pc('dragonborn','gold',1);H.spend(dr,'2024','dr-breath',1);dr.level=5;
 assert.equal(find(dr,'2024','dr-breath').left,2);assert.match(find(dr,'2024','dr-resist').description,/feu/);
});
test('2014 : tieffelin et demi-orc sans capacités anticipées, édition et origine personnalisée neutres',()=>{
 const t=pc('tiefling',null,2,'2014');assert.equal(find(t,'2014','tf14-rebuke').unlocked,false);t.level=3;assert.equal(find(t,'2014','tf14-rebuke').unlocked,true);
 assert.equal(find(pc('halforc',null,1,'2014'),'2014','ho14-endure').uses,1);
 const p=pc('elf','high',5);p.origin.edition='custom';assert.deepEqual(H.features(p,'2024'),[]);
});
test('invalides, états impossibles et restaurations négatives refusés',()=>{
 const p=pc('dragonborn','red',1);assert.throws(()=>H.spend(p,'2024','dr-flight',1),/verrouillée/);
 assert.throws(()=>H.spend(p,'2024','dr-resist',1),/non suivie/);
 assert.throws(()=>H.spend(p,'2024','dr-breath',-1),/Aucune utilisation/);
 assert.throws(()=>H.spend(p,'2024','dr-breath',0),/Variation/);
 for(let i=0;i<2;i++)H.spend(p,'2024','dr-breath',1);
 assert.throws(()=>H.spend(p,'2024','dr-breath',1),/épuisée/);
});
async function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-v11-')),dataFile=path.join(dir,'db.json');
 const app=createServer({publicOrigin:null,dataFile,setupKey:'key-test-v11'});await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
 const host='http://127.0.0.1:'+app.server.address().port;
 t.after(async()=>{await app.close();fs.rmSync(dir,{recursive:true,force:true});});
 const call=async(route,body,cookie)=>{const r=await fetch(host+route,{method:body===undefined?'GET':'POST',headers:{...(body===undefined?{}:{'Content-Type':'application/json'}),...(cookie?{Cookie:cookie}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
 const gm=(await call('/api/setup',{name:'GM v11',password:'long password v11',setupKey:'key-test-v11'})).cookie;
 const invoke=async(cookie,kind,id,more={})=>{const v=(await call('/api/state',undefined,cookie)).body.version;return call('/api/action',{baseVersion:v,kind,id,...more},cookie);};
 return {call,gm,invoke,dataFile};
}
test('API : origine + suivi des charges + long rest persistés, format 5 préservé',async t=>{
 const f=await fixture(t);let r=await f.invoke(f.gm,'setOrigin','aelin',{origin:{speciesId:'elf',variantId:'high',backgroundId:'acolyte',baseScores:base,distribution:'split',plus2:'wis',plus1:'cha'}});assert.equal(r.status,200);
 r=await f.invoke(f.gm,'heritageUse','aelin',{featureId:'elf-spell-3',delta:1});assert.equal(r.status,200);
 assert.equal(find(r.body.state.characters[0],'2024','elf-spell-3').left,0);
 r=await f.invoke(f.gm,'rest','aelin',{type:'long'});assert.equal(r.status,200);
 assert.equal(find(r.body.state.characters[0],'2024','elf-spell-3').left,1);
 const disk=JSON.parse(fs.readFileSync(f.dataFile,'utf8'));assert.equal(disk.format,5);
 assert.equal(disk.campaigns[0].state.characters[0].origin.speciesId,'elf');
});
test('API : permissions joueur/MJ et validation stricte des dons',async t=>{
 const f=await fixture(t);const code=(await f.call('/api/invites',{characterId:'aelin'},f.gm)).body.code;
 const player=(await f.call('/api/join',{name:'Player v11',password:'another long password',code})).cookie;
 assert.equal((await f.invoke(player,'addFeat','brunna',{name:'Alerte',level:4,description:'Rappel'})).status,403);
 assert.equal((await f.invoke(player,'addFeat','aelin',{name:'Alerte',level:4,description:'Rappel'})).status,200);
 assert.equal((await f.invoke(player,'addFeat','aelin',{name:'',level:4,description:''})).status,400);
 assert.equal((await f.invoke(player,'addFeat','aelin',{name:'Alerte',level:22,description:''})).status,400);
 let r=await f.invoke(player,'setOrigin','aelin',{origin:{speciesId:'orc',backgroundId:'acolyte',baseScores:base,distribution:'split',plus2:'wis',plus1:'cha'}});assert.equal(r.status,200);
 assert.equal((await f.invoke(player,'heritageUse','brunna',{featureId:'orc-rush',delta:1})).status,403);
 r=await f.invoke(player,'heritageUse','aelin',{featureId:'orc-rush',delta:1});assert.equal(r.status,200);
 const own=r.body.state.characters.find(p=>p.id==='aelin'),other=r.body.state.characters.find(p=>p.id==='brunna');
 assert.equal(find(own,'2024','orc-rush').left,1);assert.equal(other.origin,undefined);
 assert.equal(other.feats,undefined);assert.equal(other.heritageSpent,undefined);
 const featId=own.feats[0].id;
 assert.equal((await f.invoke(player,'removeFeat','aelin',{featId:'inexistant'})).status,400);
 assert.equal((await f.invoke(player,'removeFeat','aelin',{featId})).status,200);
});
test('API : changer une lignée avec usages dépensés nécessite validation explicite',async t=>{
 const f=await fixture(t),template={speciesId:'elf',variantId:'high',backgroundId:'acolyte',baseScores:base,distribution:'split',plus2:'wis',plus1:'cha'};
 assert.equal((await f.invoke(f.gm,'setOrigin','aelin',{origin:template})).status,200);
 assert.equal((await f.invoke(f.gm,'heritageUse','aelin',{featureId:'elf-spell-3',delta:1})).status,200);
 assert.equal((await f.invoke(f.gm,'setOrigin','aelin',{origin:{...template,variantId:'wood'}})).status,400);
 const r=await f.invoke(f.gm,'setOrigin','aelin',{origin:{...template,variantId:'wood'},confirmUsesReset:true});assert.equal(r.status,200);
 assert.equal(r.body.state.characters[0].heritageSpent['elf-spell-3'],undefined);
});
test('API : fichiers navigateur et version à jour',async t=>{
 const f=await fixture(t);
 const version=(await f.call('/api/status')).body.version;assert.equal(version,require('../package.json').version);
 assert.equal(typeof version,'string');
});
