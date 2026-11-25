'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const P=require('../src/progression');const L=require('../src/logic');
const {createServer}=require('../server');const fs=require('node:fs');const path=require('node:path');const os=require('node:os');

test('12 classes, reconnaissance française, jalons des sous-classes 2014/2024',()=>{
 assert.equal(Object.keys(P.CLASSES).length,12);
 for(const [job,id] of [['Rôdeuse','ranger'],['Guerrière','fighter'],['Magicienne','wizard'],['Sorcière','whatever']].slice(0,3))assert.equal(P.detectClass(job),id);
 assert.equal(P.detectClass('Aventurier maison'),null);
 assert.equal(P.subclassLevel('cleric','2014'),1);
 assert.equal(P.subclassLevel('warlock','2014'),1);
 assert.equal(P.subclassLevel('wizard','2014'),2);
 assert.equal(P.subclassLevel('cleric','2024'),3);
 assert.equal(P.subclassLevel('fighter','2014'),3);
 const pc=L.findPc(L.initialState(),'aelin');
 assert.equal(P.progression(pc,'2024').classId,'ranger');
 assert.equal(P.progression({...pc,level:3},'2024').subclassSelectionDue,true);
});
test('progression des emplacements : lanceurs complets, demi-lanceurs et chevalier occulte',()=>{
 assert.deepEqual(P.slotsFor('wizard',1,'2024').slots,[2]);
 assert.deepEqual(P.slotsFor('wizard',5,'2014').slots,[4,3,2]);
 assert.deepEqual(P.slotsFor('wizard',20,'2024').slots,[4,3,3,3,3,2,2,1,1]);
 assert.deepEqual(P.slotsFor('ranger',1,'2014').slots,[]);
 assert.deepEqual(P.slotsFor('ranger',1,'2024').slots,[2]);
 assert.deepEqual(P.slotsFor('paladin',2,'2014').slots,[2]);
 assert.deepEqual(P.slotsFor('paladin',5,'2024').slots,[4,2]);
 assert.equal(P.slotsFor('fighter',5,'2024').kind,'none');
 assert.deepEqual(P.slotsFor('fighter',7,'2024','Chevalier occulte').slots,[4,2]);
 assert.deepEqual(P.slotsFor('rogue',20,'2014','Filou arcanique').slots,[4,3,3,1]);
 assert.equal(P.slotsFor('barbarian',5,'2014').kind,'none');
 assert.equal(P.slotsFor('wizard',5,'custom').kind,'manual');
});
test('occultiste : magie de pacte, progression, récupération de repos court',()=>{
 for(const [lvl,count,tier] of [[1,1,1],[2,2,1],[3,2,2],[9,2,5],[11,3,5],[17,4,5],[20,4,5]]){
  const x=P.slotsFor('warlock',lvl,'2024');assert.equal(x.kind,'pact');assert.deepEqual(x.slots,[count]);assert.equal(x.slotLevel,tier);
 }
 const pc={job:'Occultiste',level:11,stats:{abilities:{}}};P.initTracking(pc,'2024');
 P.spendSlot(pc,'2024','pact',1);assert.equal(P.slotRows(pc,'2024')[0].left,2);
 P.recoverSlots(pc,'2024','short');assert.equal(P.slotRows(pc,'2024')[0].left,3);
});
test('emplacements normaux : limites, pas de récupération de repos court automatique, nouvelle limite au niveau supérieur',()=>{
 const pc={job:'Magicien',level:1,stats:{abilities:{}}};P.initTracking(pc,'2024');
 assert.throws(()=>P.initTracking(pc,'2024'),/déjà activé/);
 P.spendSlot(pc,'2024','1',1);P.spendSlot(pc,'2024','1',1);
 assert.equal(P.slotRows(pc,'2024')[0].left,0);
 assert.throws(()=>P.spendSlot(pc,'2024','1',1),/épuisé/);
 P.recoverSlots(pc,'2024','short');assert.equal(P.slotRows(pc,'2024')[0].left,0);
 pc.level=2;assert.equal(P.slotRows(pc,'2024')[0].left,1);
 P.recoverSlots(pc,'2024','long');assert.equal(P.slotRows(pc,'2024')[0].left,3);
 assert.throws(()=>P.spendSlot(pc,'2024','10',1),/inconnu/);
});
test('maîtrise et expertise sur 18 compétences, sans supposer les caractéristiques manquantes',()=>{
 const pc={job:'Roublard',level:5,stats:{abilities:{dex:16,wis:12}},progression:{skills:{discretion:'expert',acrobaties:'trained'}}};
 assert.equal(Object.keys(P.SKILLS).length,18);
 assert.equal(P.skillValue(pc,'discretion'),9);
 assert.equal(P.skillValue(pc,'acrobaties'),6);
 assert.equal(P.skillValue(pc,'perception'),1);
 assert.equal(P.skillValue(pc,'religion'),null);
});
async function fixture(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-v09-'));const dataFile=path.join(dir,'data.json');const app=createServer({publicOrigin:null,dataFile,setupKey:'setup-test-09'});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+app.server.address().port;
 t.after(async()=>{await app.close();fs.rmSync(dir,{recursive:true,force:true});});
 const call=async(route,body,cookie)=>{const res=await fetch(base+route,{method:body===undefined?'GET':'POST',headers:{...(body===undefined?{}:{'Content-Type':'application/json'}),...(cookie?{Cookie:cookie}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:res.status,data:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]};};
 const gm=(await call('/api/setup',{name:'MJ Progression',password:'secure-sample-password',setupKey:'setup-test-09'})).cookie;
 const invoke=async(cookie,kind,id,options={})=>{const state=await call('/api/state',undefined,cookie);return call('/api/action',{baseVersion:state.data.version,kind,id,...options},cookie);};
 return {dir,app,call,gm,invoke,dataFile};}
test('serveur : choix de classe, niveau, compétences et persistance sans changer le format 5',async t=>{
 const f=await fixture(t);let r=await f.invoke(f.gm,'setBuild','aelin',{classId:'ranger',subclass:'Chasseur'});
 assert.equal(r.status,200);assert.equal(r.data.state.characters[0].progression.subclass,'Chasseur');
 r=await f.invoke(f.gm,'levelUp','aelin');assert.equal(r.status,200);assert.equal(r.data.state.characters[0].level,4);
 r=await f.invoke(f.gm,'setSkill','aelin',{skillId:'discretion',rank:'expert'});assert.equal(r.status,200);
 r=await f.invoke(f.gm,'activateSlots','aelin');assert.equal(r.status,200);
 r=await f.invoke(f.gm,'slot','aelin',{key:'1',delta:1});assert.equal(r.status,200);
 assert.equal(P.slotRows(r.data.state.characters[0],'2024')[0].left,2);
 r=await f.invoke(f.gm,'rest','aelin',{type:'long'});assert.equal(r.status,200);
 assert.equal(P.slotRows(r.data.state.characters[0],'2024')[0].left,3);
 const db=JSON.parse(fs.readFileSync(f.dataFile,'utf8'));assert.equal(db.format,5);assert.equal(db.campaigns[0].state.characters[0].progression.skills.discretion,'expert');
});
test('serveur : joueur ne modifie que sa fiche, choix invalides refusés, réinitialisation explicite si changement de classe',async t=>{
 const f=await fixture(t);const code=(await f.call('/api/invites',{characterId:'aelin'},f.gm)).data.code;
 const joined=await f.call('/api/join',{code,name:'Joueur Progression',password:'un-password-suffisant'});const player=joined.cookie;
 assert.equal((await f.invoke(player,'setSkill','brunna',{skillId:'discretion',rank:'expert'})).status,403);
 assert.equal((await f.invoke(player,'setBuild','brunna',{classId:'fighter',subclass:''})).status,403);
 assert.equal((await f.invoke(player,'setBuild','aelin',{classId:'ranger',subclass:'Chasseur'})).status,200);
 assert.equal((await f.invoke(player,'setSkill','aelin',{skillId:'discretion',rank:'master'})).status,400);
 assert.equal((await f.invoke(player,'activateSlots','aelin')).status,200);
 assert.equal((await f.invoke(player,'setBuild','aelin',{classId:'wizard',subclass:''})).status,400);
 assert.equal((await f.invoke(player,'setBuild','aelin',{classId:'wizard',subclass:'',resetSlots:true})).status,200);
 const state=(await f.call('/api/state',undefined,player)).data.state;
 const pc=state.characters.find(p=>p.id==='aelin');assert.equal(pc.progression.spentSlots,null);
 assert.equal(state.characters.find(p=>p.id==='brunna').progression,undefined);
 assert.equal((await f.invoke(player,'setBuild','aelin',{classId:'fighter',subclass:'Chevalier occulte'})).status,200);
 assert.equal((await f.invoke(player,'slot','aelin',{key:'pact',delta:1})).status,400);
});
test('serveur : changement de sous-classe retire les emplacements incompatibles, suivi désactivable',async t=>{
 const f=await fixture(t);let r=await f.invoke(f.gm,'setBuild','brunna',{classId:'fighter',subclass:'Chevalier occulte'});assert.equal(r.status,200);
 r=await f.invoke(f.gm,'activateSlots','brunna');assert.equal(r.status,200);
 r=await f.invoke(f.gm,'setBuild','brunna',{classId:'fighter',subclass:'Champion'});assert.equal(r.status,400);
 r=await f.invoke(f.gm,'setBuild','brunna',{classId:'fighter',subclass:'Champion',resetSlots:true});assert.equal(r.status,200);
 assert.equal(r.data.state.characters.find(p=>p.id==='brunna').progression.spentSlots,null);
 r=await f.invoke(f.gm,'setBuild','brunna',{classId:'wizard',subclass:''});assert.equal(r.status,200);
 r=await f.invoke(f.gm,'activateSlots','brunna');assert.equal(r.status,200);
 r=await f.invoke(f.gm,'deactivateSlots','brunna');assert.equal(r.status,200);
 assert.equal(r.data.state.characters.find(p=>p.id==='brunna').progression.spentSlots,null);
});
