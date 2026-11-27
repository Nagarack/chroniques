'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm');
const C=require('../src/campaign-planner'),L=require('../src/logic');const {createServer}=require('../server');
const values={title:'Le phare englouti',summary:'Un phare visible au nord',privateNotes:'Secret absolu : le druide est un dragon',context:'Côte septentrionale',visibility:'private',status:'',date:''};
test('validation des entrées, sections autorisées, tailles et dates',()=>{
 const s=L.initialState();assert.throws(()=>C.add(s,'unknown','cp-123456789',values),/Section/);
 assert.throws(()=>C.add(s,'places','cp-123456789',{...values,title:''}),/Titre/);
 assert.throws(()=>C.add(s,'places','cp-123456789',{...values,visibility:'published'}),/Visibilité/);
 assert.throws(()=>C.add(s,'sessions','cp-123456789',{...values,status:'planned',date:'2026-02-30'}),/Date/);
 assert.throws(()=>C.add(s,'quests','cp-123456789',{...values,status:'hacked'}),/État/);
 assert.throws(()=>C.add(s,'places','cp-123456789',{...values,privateNotes:'x'.repeat(1801)}),/Notes/);
 const a=C.add(s,'places','cp-123456789',values);assert.equal(a.title,values.title);
 assert.throws(()=>C.add(s,'places','cp-123456789',values),/Identifiant/);
 assert.equal(C.projected(s).places.length,0);
 C.update(s,'places',a.id,{...values,visibility:'shared'});
 assert.deepEqual(Object.keys(C.projected(s).places[0]).sort(),['context','date','id','status','summary','title','visibility'].sort());
 assert(!JSON.stringify(C.projected(s)).includes('Secret absolu'));
 C.remove(s,'places',a.id);assert.equal(C.board(s).places.length,0);
});
test('six sections, limites, statuts sans modification de fiches personnages',()=>{
 const s=L.initialState(),old=JSON.stringify(s.characters);
 for(const [type,setting] of Object.entries(C.TYPES)){
  const row={...values,visibility:'shared',status:setting.status[0]||'',date:type==='sessions'?'2026-10-20':''};
  C.add(s,type,'cp-'+type+'-999',row);
  assert.equal(C.projected(s)[type].length,1);
 }
 assert.equal(JSON.stringify(s.characters),old);
 assert.equal(C.projected(s).sessions[0].date,'2026-10-20');
});
async function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chron-v19-'));const file=path.join(dir,'db.json');let app=createServer({publicOrigin:null,dataFile:file,setupKey:'testpass'});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));t.after(async()=>{await app.close();fs.rmSync(dir,{recursive:true,force:true});});
 const call=async(route,body,cookie)=>{const r=await fetch(`http://127.0.0.1:${app.server.address().port}/api/${route}`,{method:body===undefined?'GET':'POST',headers:{...(cookie?{'Cookie':cookie}:{}),...(body===undefined?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]||''};};
 const gm=(await call('setup',{name:'Maitre Jeu',password:'longpassword1234',setupKey:'testpass'})).cookie;
 const invite=(await call('invites',{characterId:'aelin'},gm)).data.code;
 const player=(await call('join',{name:'Joueur Un',password:'longpassword1234',code:invite})).cookie;
 const state=cookie=>call('state',undefined,cookie);
 const action=async(cookie,kind,opts={})=>call('action',{kind,baseVersion:(await state(cookie)).data.version,...opts},cookie);
 return {gm,player,action,state,call,file,restart:async()=>{await app.close();app=createServer({publicOrigin:null,dataFile:file,setupKey:'testpass'});await new Promise(r=>app.server.listen(0,'127.0.0.1',r));}};
}
test('API : création, publication, modification et suppression en temps réel côté MJ',async t=>{
 const f=await fixture(t);
 let r=await f.action(f.gm,'plannerAdd',{section:'places',values});assert.equal(r.status,200);const id=r.data.state.campaignPlanner.places[0].id;
 let p=(await f.state(f.player)).data;assert.equal(p.state.campaignPlanner.places.length,0);
 r=await f.action(f.gm,'plannerUpdate',{section:'places',id,values:{...values,visibility:'shared'}});assert.equal(r.status,200);
 p=(await f.state(f.player)).data;assert.equal(p.state.campaignPlanner.places[0].title,values.title);assert.equal(p.state.campaignPlanner.places[0].privateNotes,undefined);
 assert.equal((await f.action(f.gm,'plannerDelete',{section:'places',id})).status,200);assert.equal((await f.state(f.player)).data.state.campaignPlanner.places.length,0);
});
test('API : aucune note secrète ni entrée privée reçue par les joueurs, même depuis /api/state',async t=>{
 const f=await fixture(t);
 const privateEntry={...values,title:'Cachette interdite',summary:'Ne doit pas apparaître',privateNotes:'SUPERSECRET_MJ_NOTES',visibility:'private'};
 const publicEntry={...values,title:'Quête publiée',summary:'Objectif révélé',privateNotes:'DRAGON_SECRET_NON_PUBLIE',visibility:'shared',status:'active'};
 for(const section of Object.keys(C.TYPES)){
  let v={...privateEntry,status:C.TYPES[section].status[0]||''};assert.equal((await f.action(f.gm,'plannerAdd',{section,values:v})).status,200);
  v={...publicEntry,status:C.TYPES[section].status[0]||''};assert.equal((await f.action(f.gm,'plannerAdd',{section,values:v})).status,200);
 }
 const out=(await f.state(f.player)).data;const serialized=JSON.stringify(out.state.campaignPlanner);
 for(const marker of ['SUPERSECRET_MJ_NOTES','DRAGON_SECRET_NON_PUBLIE','Cachette interdite','Ne doit pas apparaître','privateNotes'])assert(!serialized.includes(marker),marker);
 for(const section of Object.keys(C.TYPES))assert.equal(out.state.campaignPlanner[section].length,1);
 assert.equal(out.state.gmLibrary,undefined);
});
test('API : permissions, validations et refus de manipulation de section',async t=>{
 const f=await fixture(t);
 for(const kind of ['plannerAdd','plannerUpdate','plannerDelete'])assert.equal((await f.action(f.player,kind,{section:'places',id:'cp-test-id000',values})).status,403,kind);
 assert.equal((await f.action(f.gm,'plannerAdd',{section:'__proto__',values})).status,400);
 assert.equal((await f.action(f.gm,'plannerAdd',{section:'quests',values:{...values,status:'wrong'}})).status,400);
 assert.equal((await f.action(f.gm,'plannerDelete',{section:'places',id:'cp-test-id000'})).status,400);
});
test('API : données de campagne persistantes après redémarrage',async t=>{
 const f=await fixture(t);let r=await f.action(f.gm,'plannerAdd',{section:'sessions',values:{...values,status:'planned',date:'2026-10-28',visibility:'shared'}});assert.equal(r.status,200);await f.restart();
 const login=(await f.call('login',{name:'Maitre Jeu',password:'longpassword1234'})).cookie;const result=(await f.state(login)).data;assert.equal(result.state.campaignPlanner.sessions[0].date,'2026-10-28');assert.equal(result.state.campaignPlanner.sessions[0].privateNotes,values.privateNotes);
});
test('interface : page partagée, formulaire MJ, aucune simulation de dés, contenu échappé',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../src/online-app.js'),'utf8');assert.match(html,/Chronique/);assert.match(html,/planner-create/);assert.match(html,/planner-update/);assert.match(html,/privateNotes/);assert.doesNotMatch(html,/Math\.random\(|function rollDice\(/);
});

test('rendu simulé : le MJ voit ses secrets, le joueur uniquement les entrées publiées',async()=>{
 const code=fs.readFileSync(path.join(__dirname,'../src/online-app.js'),'utf8');
 const P=require('../src/progression'),O=require('../src/origins'),H=require('../src/heritage'),S=require('../src/spells'),G=require('../src/spell-guide'),N=require('../src/creatures'),A=require('../src/art-catalog');
 const src=L.initialState();
 C.add(src,'places','cp-secret-123',{...values,title:'Bibliothèque interdite',summary:'Entrée masquée',privateNotes:'TOME-CACHE',visibility:'private'});
 C.add(src,'quests','cp-public-123',{...values,title:'Lueur de la forêt',summary:'Chercher la clef',privateNotes:'BOSS-SECRET',visibility:'shared',status:'active'});
 async function render(role){const els={},listeners={};const $=key=>els[key]??={innerHTML:'',textContent:'',value:'',classList:{add(){},remove(){},toggle(){}}};
  const document={querySelector:$,querySelectorAll:()=>[],addEventListener:(k,f)=>{listeners[k]=f;}};
  const viewer={role,name:role==='gm'?'MJ':'Joueur',characterId:role==='gm'?null:'aelin'};
  const model=role==='gm'?L.clone(src):(()=>{const x=L.clone(src);delete x.gmNotes;delete x.gmLibrary;x.campaignPlanner=C.projected(src);return x;})();
  const fetch=async url=>({ok:true,json:async()=>url==='/api/status'?{setupRequired:false,version:'2.8.0',networkMode:'local'}:url==='/api/me'?{authenticated:true}:{viewer,version:1,state:model}});
  class EventSource{addEventListener(){}close(){}}
  vm.runInNewContext(code,{window:{ChroniquesUiHelpers:require('../src/ui-helpers'),ChroniquesLogic:L,ChroniquesProgression:P,ChroniquesOrigins:O,ChroniquesHeritage:H,ChroniquesSpells:S,ChroniquesSpellGuide:G,ChroniquesCreatures:N,ChroniquesArt:A},document,fetch,EventSource,console,setTimeout:()=>1,clearTimeout:()=>{},Date,Math,JSON,Number,Boolean,String,Array,Promise,navigator:{}});
  await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r));listeners.click({target:{closest:()=>({dataset:{nav:'chronicle'}})}});return els['#app'].innerHTML;
 }
 const mj=await render('gm');assert.match(mj,/Bibliothèque interdite/);assert.match(mj,/TOME-CACHE/);assert.match(mj,/BOSS-SECRET/);assert.match(mj,/planner-create/);
 const player=await render('player');assert.match(player,/Lueur de la forêt/);assert.match(player,/Chercher la clef/);for(const v of ['Bibliothèque interdite','TOME-CACHE','BOSS-SECRET','planner-create','planner-update'])assert(!player.includes(v),v);
});
