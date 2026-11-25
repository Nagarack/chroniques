'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm');
const {createServer}=require('../server');const L=require('../src/logic'),N=require('../src/creatures'),E=require('../src/encounters');
const sample={name:'Guetteur voilé',kind:'monstre',hpMax:22,ac:13,initiative:7,speed:9,visibility:'hidden',showHp:false,actions:'Lance : 1d6 + 2 avec de vrais dés',notes:'Secret du MJ : crypte'};
const other={...sample,name:'Chien de garde',visibility:'public',showHp:false,notes:'Autre secret'};
async function fixture(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chron-v18-')),file=path.join(dir,'db.json');let app=createServer({publicOrigin:null,dataFile:file,setupKey:'setup-test'});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));t.after(async()=>{await app.close();fs.rmSync(dir,{recursive:true,force:true});});const address=()=>`http://127.0.0.1:${app.server.address().port}`;
 async function call(endpoint,b,cookie=''){const r=await fetch(address()+'/api/'+endpoint,{method:b===undefined?'GET':'POST',headers:{...(cookie?{Cookie:cookie}:{}),...(b===undefined?{}:{'Content-Type':'application/json'})},body:b===undefined?undefined:JSON.stringify(b)});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]||''};}
 const gm=(await call('setup',{name:'MJ Test',password:'grandmotdepasse00',setupKey:'setup-test'})).cookie;const invite=(await call('invites',{characterId:'aelin'},gm)).data.code;const player=(await call('join',{name:'Joueur Test',password:'grandmotdepasse11',code:invite})).cookie;
 const state=async cookie=>(await call('state',undefined,cookie)).data;
 const action=async(cookie,kind,rest={})=>call('action',{kind,baseVersion:(await state(cookie)).version,...rest},cookie);
 return {gm,player,state,action,call,file,restart:async()=>{await app.close();app=createServer({publicOrigin:null,dataFile:file,setupKey:'setup-test'});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));}};
}
test('modèles et groupes : validation, quotas, références et suppression prudente',()=>{const s=L.initialState();assert.throws(()=>E.addTemplate(s,'one',{...sample,hpMax:0},''),/PV maximum/);assert.throws(()=>E.addTemplate(s,'one',sample,'invented/icon'),/Icône/);
 E.addTemplate(s,'one',sample,'lorc/dragon-head');assert.equal(E.templates(s).length,1);assert.throws(()=>E.addTemplate(s,'one',sample,''),/Identifiant/);E.addEncounter(s,'enc','Salle du trône','Porte dissimulée');assert.throws(()=>E.addGroup(s,'enc','g','absent',1),/Modèle/);assert.throws(()=>E.addGroup(s,'enc','g','one',13),/Quantité/);E.addGroup(s,'enc','g','one',3);assert.equal(E.count(E.encounters(s)[0]),3);assert.throws(()=>E.removeTemplate(s,'one'),/utilisé/);E.removeGroup(s,'enc','g');E.removeTemplate(s,'one');assert.equal(E.templates(s).length,0);});
test('API : modèles, compositions, icônes et instances indépendantes à dés physiques',async t=>{const f=await fixture(t);
 let r=await f.action(f.gm,'templateAdd',{values:sample,icon:'lorc/dragon-head'});assert.equal(r.status,200);const tpl=r.data.state.gmLibrary.templates[0];assert.equal(tpl.notes,sample.notes);
 r=await f.action(f.gm,'encounterAdd',{name:'Aux portes de la ville',notes:'Trois sentinelles'});assert.equal(r.status,200);const e=r.data.state.gmLibrary.encounters[0];
 r=await f.action(f.gm,'encounterGroupAdd',{id:e.id,templateId:tpl.id,quantity:3});assert.equal(r.status,200);
 r=await f.action(f.gm,'encounterDeploy',{id:e.id});assert.equal(r.status,200);
 const npcs=r.data.state.combat.npcs;assert.equal(npcs.length,3);assert.equal(new Set(npcs.map(x=>x.id)).size,3);assert(npcs.every(n=>n.hp===22&&n.name==='Guetteur voilé'));
 assert.equal(r.data.state.media.length,3);assert(r.data.state.media.every(x=>x.builtinId==='lorc/dragon-head'&&x.visibility==='private'));
 assert.equal((await f.action(f.gm,'npcHp',{id:npcs[0].id,delta:-9})).data.state.combat.npcs[0].hp,13);
 assert.equal((await f.state(f.gm)).state.gmLibrary.templates[0].hpMax,22);
 assert.equal((await f.action(f.gm,'templateDelete',{id:tpl.id})).status,400);
 assert.equal((await f.action(f.gm,'start')).status,200);
 assert.equal((await f.action(f.gm,'encounterDeploy',{id:e.id})).status,400);
 });
test('Confidentialité : joueur ne reçoit ni bibliothèque ni nom d’ennemi caché, ni icône privée',async t=>{const f=await fixture(t);assert.equal((await f.action(f.player,'templateAdd',{values:sample,icon:'lorc/dragon-head'})).status,403);await f.action(f.gm,'templateAdd',{values:sample,icon:'lorc/dragon-head'});let s=await f.state(f.gm);const tid=s.state.gmLibrary.templates[0].id;await f.action(f.gm,'encounterAdd',{name:'Emboscade-secrète',notes:'Liste privée secrète'});s=await f.state(f.gm);const eid=s.state.gmLibrary.encounters[0].id;
 await f.action(f.gm,'encounterGroupAdd',{id:eid,templateId:tid,quantity:2});await f.action(f.gm,'encounterDeploy',{id:eid});const player=await f.state(f.player),blob=JSON.stringify(player);assert(!('gmLibrary' in player.state));assert(!blob.includes('Emboscade-secrète'));assert(!blob.includes('Guetteur voilé'));assert(!blob.includes('Liste privée secrète'));assert(!blob.includes('Secret du MJ'));assert.equal(player.state.media.length,0);assert.equal(player.state.combat.npcs.length,0);
 for(const kind of ['templateDelete','templateUpdate','templateFromNpc','encounterAdd','encounterUpdate','encounterDelete','encounterGroupAdd','encounterGroupRemove','encounterDeploy'])assert.equal((await f.action(f.player,kind,{id:eid,npcId:'a',values:sample,name:'Méchante opération',notes:'x',templateId:tid,quantity:1,groupId:'a'})).status,403,kind);
 });
test('Redémarrage : modèles et rencontres persistants sans perte de compatibilité',async t=>{const f=await fixture(t);await f.action(f.gm,'templateAdd',{values:other});await f.action(f.gm,'encounterAdd',{name:'Patrouille'});let s=await f.state(f.gm);await f.action(f.gm,'encounterGroupAdd',{id:s.state.gmLibrary.encounters[0].id,templateId:s.state.gmLibrary.templates[0].id,quantity:2});await f.restart();s=await f.state(f.gm); // sessions en mémoire sont perdues lors du redémarrage ; reconnecter le MJ.
 assert.equal(s.authenticated,undefined);
 const relog=(await f.call('login',{name:'MJ Test',password:'grandmotdepasse00'})).cookie;const state=(await f.state(relog)).state;assert.equal(state.gmLibrary.templates.length,1);assert.equal(state.gmLibrary.encounters[0].groups[0].quantity,2);
});
test('copier une créature, retirer une rencontre et modifier un modèle',async t=>{const f=await fixture(t);let st=await f.action(f.gm,'npcAdd',{values:other});const id=st.data.state.combat.npcs[0].id;st=await f.action(f.gm,'templateFromNpc',{npcId:id});assert.equal(st.status,200);const tid=st.data.state.gmLibrary.templates[0].id;st=await f.action(f.gm,'templateUpdate',{id:tid,values:{...other,name:'Nouvelle variante',hpMax:30},icon:'lorc/wolf-head'});assert.equal(st.status,200);assert.equal(st.data.state.gmLibrary.templates[0].name,'Nouvelle variante');st=await f.action(f.gm,'templateDelete',{id:tid});assert.equal(st.status,200);assert.equal(st.data.state.combat.npcs[0].name,'Chien de garde');});
test('Interface : la page de préparation est MJ-only et aucune fonction de lancer virtuel',()=>{const js=fs.readFileSync(path.join(__dirname,'../src/online-app.js'),'utf8');assert.match(js,/Bibliothèque MJ/);assert.match(js,/data-task="tpl-new"/);assert.match(js,/encounter-group-form/);assert.match(js,/Ajouter à la table/);assert.doesNotMatch(js,/function rollDice\(|Math\.random\(/);const server=fs.readFileSync(path.join(__dirname,'../server.js'),'utf8');assert.match(server,/delete full\.gmLibrary/);assert.match(server,/requireGm\(u\);[\s\S]{0,150}E\.deploy/);});
test('Interface simulée : MJ voit les préparations et joueur non, sans exécution navigateur distante',async()=>{
 const P=require('../src/progression'),O=require('../src/origins'),H=require('../src/heritage'),S=require('../src/spells'),G=require('../src/spell-guide'),A=require('../src/art-catalog');
 const code=fs.readFileSync(path.join(__dirname,'../src/online-app.js'),'utf8');
 async function load(role){const elements={},listeners={},s=L.initialState();E.addTemplate(s,'tpl-a',sample,'lorc/dragon-head');E.addEncounter(s,'enc-a','Crypte secrète','Piège caché');E.addGroup(s,'enc-a','g-a','tpl-a',2);let version=1;
  const viewer={role,name:role==='gm'?'MJ':'Joueur',characterId:role==='gm'?null:'aelin'};
  const $=sel=>elements[sel]||=( {innerHTML:'',value:'',textContent:'',classList:{add(){},remove(){},toggle(){}}});
  const document={querySelector:$,querySelectorAll:()=>[],addEventListener:(e,fn)=>{listeners[e]=fn;}};
  const fetch=async route=>({ok:true,status:200,json:async()=>route==='/api/status'?{setupRequired:false,version:'2.8.0'}:route==='/api/me'?{authenticated:true}:route==='/api/state'?{viewer,version,state:role==='gm'?L.clone(s):(()=>{const x=N.project(s);delete x.gmNotes;delete x.gmLibrary;return x;})()}: {}});
  class EventSource{addEventListener(){}close(){}}
  vm.runInNewContext(code,{window:{ChroniquesUiHelpers:require('../src/ui-helpers'),ChroniquesLogic:L,ChroniquesProgression:P,ChroniquesOrigins:O,ChroniquesHeritage:H,ChroniquesSpells:S,ChroniquesSpellGuide:G,ChroniquesCreatures:N,ChroniquesArt:A},document,fetch,EventSource,console,setTimeout:()=>1,clearTimeout:()=>{},Date,Math,JSON,Number,Boolean,String,Array,Promise,navigator:{}});
  await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r));return {elements,listeners};
 }
 const mj=await load('gm');mj.listeners.click({target:{closest:()=>({dataset:{nav:'encounters'}})}});assert.match(mj.elements['#app'].innerHTML,/Crypte secrète/);assert.match(mj.elements['#app'].innerHTML,/Loup|Guetteur voilé/);assert.match(mj.elements['#app'].innerHTML,/Ajouter à la table/);
 const player=await load('player');assert.doesNotMatch(player.elements['#app'].innerHTML,/Préparer les rencontres|Crypte secrète|Piège caché/);player.listeners.click({target:{closest:()=>({dataset:{nav:'combat'}})}});assert.doesNotMatch(player.elements['#app'].innerHTML,/Crypte secrète|Piège caché/);
});
