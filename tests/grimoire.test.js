'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const S=require('../src/spells'),P=require('../src/progression'),{createServer}=require('../server');
const pc=(klass='wizard')=>({level:5,job:P.CLASSES[klass].name,progression:{classId:klass,subclass:'',spentSlots:{}},concentration:'',grimoire:[]});
const custom={name:'Voile de tempête',level:2,castTime:'action',range:'18 m',duration:'1 minute',components:'V S M',concentration:true,ritual:false};
async function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-v12-')),dataFile=path.join(dir,'chroniques-db.json');const app=createServer({publicOrigin:null,dataFile,setupKey:'key-test-v12'});
 await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));const host='http://127.0.0.1:'+app.server.address().port;
 t.after(async()=>{await app.close();fs.rmSync(dir,{recursive:true,force:true});});
 const call=async(route,body,cookie)=>{const r=await fetch(host+route,{method:body===undefined?'GET':'POST',headers:{...(body===undefined?{}:{'Content-Type':'application/json'}),...(cookie?{Cookie:cookie}:{})},body:body===undefined?undefined:JSON.stringify(body)});const contentType=r.headers.get('content-type')||'';return {status:r.status,body:contentType.includes('json')?await r.json():await r.text(),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
 const gm=(await call('/api/setup',{name:'GM V12',password:'very-long-password-v12',setupKey:'key-test-v12'})).cookie;
 const invoke=async(cookie,kind,id,more={})=>{const v=(await call('/api/state',undefined,cookie)).body.version;return call('/api/action',{baseVersion:v,kind,id,...more},cookie);};
 return {call,gm,invoke,dataFile};
}
test('catalogue SRD synthétique : filtres, niveaux, concentration et rituel',()=>{
 assert.ok(S.CATALOG.length>=30);assert.equal(S.get('fireball').level,3);assert.equal(S.get('guidance').concentration,true);
 assert.equal(S.get('detect-magic').ritual,true);assert.ok(S.listForClass('ranger').some(s=>s.id==='hunters-mark'));
 assert.ok(!S.listForClass('barbarian').length);
});
test('validation : pas de doublons ni de catalogue hors classe sans dérogation',()=>{
 const p=pc('ranger');assert.throws(()=>S.add(p,'ranger','2024',{spellId:'fireball',prepared:true},'a'),/hors liste/);
 S.add(p,'ranger','2024',{spellId:'hunters-mark',prepared:true},'a');assert.equal(p.grimoire.length,1);
 assert.throws(()=>S.add(p,'ranger','2024',{spellId:'hunters-mark'},'b'),/déjà/);
 S.add(p,'ranger','2024',{spellId:'fireball',allowOutsideClass:true},'b');assert.equal(p.grimoire.length,2);
});
test('personnalisation, validation des champs et suivi de préparation',()=>{
 const p=pc();S.add(p,'wizard','2024',{custom,prepared:false},'x');assert.equal(p.grimoire[0].prepared,false);
 S.edit(p,'x',true);assert.equal(p.grimoire[0].prepared,true);
 assert.throws(()=>S.add(p,'wizard','2024',{custom:{...custom,level:42}},'x2'),/Niveau/);
 assert.throws(()=>S.add(p,'wizard','2024',{custom:{...custom,name:' '}},'x3'),/Nom/);
 S.remove(p,'x');assert.equal(p.grimoire.length,0);
});
test('lancement : un emplacement de niveau suffisant est débité, grimoire inchangé',()=>{
 const p=pc();S.add(p,'wizard','2024',{spellId:'fireball',prepared:true},'fire');
 assert.throws(()=>S.record(p,'2024',null,{entryId:'fire',mode:'slot',slotKey:'1'},P),/Emplacement insuffisant/);
 const cast=S.record(p,'2024',null,{entryId:'fire',mode:'slot',slotKey:'3'},P);assert.equal(cast.spell.name,'Boule de feu');
 assert.equal(p.progression.spentSlots['3'],1);assert.equal(p.grimoire.length,1);
});
test('tours de magie, sorts non préparés et dérogations sont distincts',()=>{
 const p=pc();S.add(p,'wizard','2024',{spellId:'fire-bolt'},'bolt');S.add(p,'wizard','2024',{spellId:'shield'},'shield');
 assert.throws(()=>S.record(p,'2024',null,{entryId:'bolt',mode:'slot',slotKey:'1'},P),/tours de magie/);
 S.record(p,'2024',null,{entryId:'bolt',mode:'manual'},P);assert.deepEqual(p.progression.spentSlots,{});
 assert.throws(()=>S.record(p,'2024',null,{entryId:'shield',mode:'slot',slotKey:'1'},P),/non préparé/);
 S.record(p,'2024',null,{entryId:'shield',mode:'manual',manualUnprepared:true},P);assert.equal(p.spellHistory.length,2);
});
test('concentration ne change pas sans confirmation et l’emplacement reste intact',()=>{
 const p=pc();p.concentration='Bénédiction';S.add(p,'wizard','2024',{spellId:'invisibility',prepared:true},'inv');
 assert.throws(()=>S.record(p,'2024',null,{entryId:'inv',mode:'slot',slotKey:'2'},P),/concentration/);
 assert.equal(p.progression.spentSlots['2'],undefined);S.record(p,'2024',null,{entryId:'inv',mode:'slot',slotKey:'2',replaceConcentration:true},P);
 assert.equal(p.concentration,'Invisibilité');assert.equal(p.progression.spentSlots['2'],1);
});
test('API : ajout et utilisation de sort authentifiés, persistance, et emplacement débité',async t=>{
 const f=await fixture(t);
 let r=await f.invoke(f.gm,'setBuild','elyra',{classId:'wizard',subclass:''});assert.equal(r.status,200);
 r=await f.invoke(f.gm,'activateSlots','elyra');assert.equal(r.status,200);
 r=await f.invoke(f.gm,'addSpell','elyra',{spellId:'fireball',prepared:true});assert.equal(r.status,200);
 let e=r.body.state.characters.find(x=>x.id==='elyra').grimoire[0];assert.equal(e.spellId,'fireball');
 r=await f.invoke(f.gm,'castSpell','elyra',{entryId:e.id,mode:'slot',slotKey:'3'});assert.equal(r.status,200);
 assert.equal(r.body.state.characters.find(x=>x.id==='elyra').progression.spentSlots['3'],1);
 const onDisk=JSON.parse(fs.readFileSync(f.dataFile,'utf-8'));assert.equal(onDisk.format,5);
 assert.equal(onDisk.campaigns[0].state.characters.find(x=>x.id==='elyra').spellHistory.length,1);
 r=await f.invoke(f.gm,'rest','elyra',{type:'long'});assert.equal(r.status,200);
 assert.equal(r.body.state.characters.find(x=>x.id==='elyra').progression.spentSlots['3'],undefined);
});
test('API : un joueur ne peut ni lire ni modifier le grimoire d’un autre',async t=>{
 const f=await fixture(t);const code=(await f.call('/api/invites',{characterId:'aelin'},f.gm)).body.code;
 const player=(await f.call('/api/join',{name:'Player V12',password:'another-long-password',code})).cookie;
 assert.equal((await f.invoke(player,'addSpell','brunna',{spellId:'bless'})).status,403);
 assert.equal((await f.invoke(player,'addSpell','aelin',{spellId:'hunters-mark',prepared:true})).status,200);
 const own=(await f.call('/api/state',undefined,player)).body.state.characters.find(p=>p.id==='aelin');assert.equal(own.grimoire.length,1);
 const others=(await f.call('/api/state',undefined,player)).body.state.characters.filter(p=>p.id!=='aelin');assert.ok(others.every(p=>p.grimoire===undefined));
});
test('API : le serveur refuse les débits impossibles, et le mode manuel n’utilise pas de slot',async t=>{
 const f=await fixture(t);let r=await f.invoke(f.gm,'setBuild','elyra',{classId:'wizard',subclass:''});
 r=await f.invoke(f.gm,'addSpell','elyra',{spellId:'magic-missile',prepared:true});const e=r.body.state.characters.find(p=>p.id==='elyra').grimoire[0];
 assert.equal((await f.invoke(f.gm,'castSpell','elyra',{entryId:e.id,mode:'slot',slotKey:'1'})).status,400);
 r=await f.invoke(f.gm,'castSpell','elyra',{entryId:e.id,mode:'manual'});assert.equal(r.status,200);
 assert.equal(r.body.state.characters.find(p=>p.id==='elyra').spellHistory[0].mode,'manual');
});
test('API : catalogue servi au navigateur, status et rendu mis à jour',async t=>{
 const f=await fixture(t);const r=await f.call('/src/spells.js');assert.equal(r.status,200);assert.match(r.body,/ChroniquesSpells/);
 assert.equal((await f.call('/api/status')).body.version,require('../package.json').version);
 const page=(await f.call('/'));assert.equal(page.status,200);assert.match(page.body,/src\/spells.js/);
});
