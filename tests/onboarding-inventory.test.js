'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createServer}=require('../server'),I=require('../src/inventory'),OB=require('../src/onboarding'),L=require('../src/logic');
test('V2.6 : parcours MJ/joueur distincts et progression sans états arbitraires',()=>{
 const gm=OB.steps('gm'),player=OB.steps('player');assert.equal(gm.length,8);assert.equal(player.length,6);
 assert(gm.some(x=>x.page==='campaign'));assert(player.some(x=>x.page==='grimoire'));
 assert.equal(OB.progress('gm',['campaign','invalid']).done,1);
 assert.deepEqual(OB.decode({done:['campaign','campaign','invalid']},'gm'),['campaign']);
 assert(!OB.key('membre','gm').includes('password'));
});
test('V2.6 : ancien objet sans nouvelle propriété reste modifiable et conservé',()=>{
 const p={inventoryItems:[{id:'old',name:'Dague ancienne',description:'Objet illustré'}]};
 I.update(p,'old',{...p.inventoryItems[0],category:'weapon',quantity:2,weight:0.5,chargesMax:0,charges:0,equipped:true});
 assert.equal(p.inventoryItems[0].id,'old');assert.equal(p.inventoryItems[0].quantity,2);assert.equal(p.inventoryItems[0].equipped,true);
 assert.throws(()=>I.adjust(p,'old','quantity',-3),/quantité/i);
 I.adjust(p,'old','quantity',-1);assert.equal(p.inventoryItems[0].quantity,1);
});
test('V2.6 : réserve de butin, distribution partielle, monnaie et contrôle de limites',()=>{
 const s=L.initialState(),pc=s.characters[0];I.lootAdd(s,'loot-test',{name:'Potion de soin',quantity:4,category:'potion',chargesMax:0,weight:0.2});
 I.give(s,pc,'loot-test','item-recu',2);assert.equal(s.lootStash[0].quantity,2);assert.equal(pc.inventoryItems.at(-1).quantity,2);
 assert.throws(()=>I.give(s,pc,'loot-test','item-autre',3),/insuffisante/i);
 I.give(s,pc,'loot-test','item-autre',2);assert.equal(s.lootStash.length,0);
 I.money(pc,{gp:12,sp:3});assert.equal(pc.coins.gp,12);assert.equal(pc.coins.cp,0);
 assert.throws(()=>I.money(pc,{gp:-1}),/invalide/i);
 assert.throws(()=>I.lootAdd(s,'bad',{name:'Gemme',quantity:0}),/invalide/i);
});
async function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-v26-')),dataFile=path.join(dir,'chroniques-db.json'),app=createServer({publicOrigin:null,dataFile,setupKey:'v26-setup-key'});
 await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));t.after(async()=>{await app.close();fs.rmSync(dir,{recursive:true,force:true});});
 const base='http://127.0.0.1:'+app.server.address().port;
 async function call(route,body,session=''){
  const res=await fetch(base+'/api/'+route,{method:body===undefined?'GET':'POST',headers:{...(body===undefined?{}:{'Content-Type':'application/json'}),...(session?{Cookie:session}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  return {status:res.status,value:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]};
 }
 const owner=(await call('setup',{name:'MJ V26',password:'owner-password-v26',setupKey:'v26-setup-key'})).cookie;
 const invited=(await call('invites',{characterId:'aelin'},owner)).value;
 const player=(await call('join',{name:'Joueur V26',password:'player-password-v26',code:invited.code})).cookie;
 async function action(session,kind,fields={}){const {value}=await call('state',undefined,session);return call('action',{kind,baseVersion:value.version,...fields},session);}
 return {call,owner,player,action,dataFile};
}
test('V2.6 : joueur peut éditer uniquement son inventaire, et ne reçoit aucun butin MJ',async t=>{
 const x=await fixture(t),gm=await x.action(x.owner,'lootAdd',{values:{name:'Trésor secret de la crypte',category:'treasure',quantity:3}});
 assert.equal(gm.status,200);
 const own=(await x.call('state',undefined,x.owner)).value;
 assert.equal(own.state.lootStash[0].quantity,3);
 const other=(await x.call('state',undefined,x.player)).value;
 assert(!JSON.stringify(other).includes('Trésor secret de la crypte'));
 assert(!('lootStash' in other.state));
 assert.equal((await x.action(x.player,'lootGive',{id:'aelin',lootId:own.state.lootStash[0].id,quantity:1})).status,403);
 assert.equal((await x.action(x.player,'itemAdd',{id:'brunna',values:{name:'Triche',quantity:1}})).status,403);
 const ok=await x.action(x.player,'itemAdd',{id:'aelin',values:{name:'Ration',quantity:3}});assert.equal(ok.status,200);
 assert.equal(ok.value.state.characters.find(p=>p.id==='aelin').inventoryItems.at(-1).name,'Ration');
 assert.equal((await x.action(x.player,'moneySet',{id:'brunna',coins:{gp:99}})).status,403);
 const lootId=(await x.call('state',undefined,x.owner)).value.state.lootStash[0].id;
 const given=await x.action(x.owner,'lootGive',{id:'brunna',lootId,quantity:2});assert.equal(given.status,200);
 assert.equal(given.value.state.lootStash[0].quantity,1);
 const playerState=(await x.call('state',undefined,x.player)).value;
 const another=playerState.state.characters.find(p=>p.id==='brunna');assert(!('inventoryItems' in another));
 assert(!JSON.stringify(playerState).includes('Trésor secret de la crypte'));
 assert.equal(JSON.parse(fs.readFileSync(x.dataFile,'utf8')).format,5);
});
test('V2.6 : co-MJ a les droits trésor, perd ses droits à sa rétrogradation',async t=>{
 const x=await fixture(t);const members=(await x.call('management',undefined,x.owner)).value;
 const userId=members.roleAssignments.find(m=>m.role==='player').userId;
 assert.equal((await x.call('member/role',{userId,role:'gm'},x.owner)).status,200);
 assert.equal((await x.action(x.player,'lootAdd',{values:{name:'Épée magique',quantity:1}})).status,200);
 assert.equal((await x.call('member/role',{userId,role:'player'},x.owner)).status,200);
 assert.equal((await x.action(x.player,'lootAdd',{values:{name:'Épée secrète',quantity:1}})).status,403);
});
test('V2.6 : HTML charge le parcours et le moteur inventaire, sans lancer de dés virtuels',()=>{
 const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),app=fs.readFileSync(path.join(root,'src/online-app.js'),'utf8');
 for(const name of ['inventory.js','onboarding.js'])assert(html.includes('/src/'+name));
 for(const name of ['inventoryPage','onboardingPage','onboard-banner','loot-give','inventory-money'])assert(app.includes(name),name);
 assert(!app.includes('Math.random('));
});
test('V2.6 : rendu simulé MJ/joueur du guide et de l’inventaire sans erreur JS',async()=>{
 const vm=require('node:vm'),P=require('../src/progression'),O=require('../src/origins'),H=require('../src/heritage'),S=require('../src/spells'),G=require('../src/spell-guide'),N=require('../src/creatures'),A=require('../src/art-catalog'),SV=require('../src/sheet-view'),MD=require('../src/mj-dashboard');
 const code=fs.readFileSync(path.join(__dirname,'../src/online-app.js'),'utf8');
 async function paint(role,screen){
  const state=L.initialState();state.lootStash=[{id:'loot-1234',name:'Butin secret',category:'treasure',quantity:3}];
  const viewer={name:'Profil '+role,role,characterId:role==='gm'?null:'aelin'};
  const data=role==='gm'?state:{...state,lootStash:undefined,characters:state.characters.map(c=>c.id==='aelin'?c:{...c,inventoryItems:undefined})};
  const elements={},listeners={};function el(k){return elements[k]||={innerHTML:'',textContent:'',value:'',classList:{add(){},remove(){},toggle(){}},closest:()=>null};}
  const document={querySelector:el,querySelectorAll:()=>[],addEventListener:(n,cb)=>listeners[n]=cb};
  const fetch=async url=>({ok:true,status:200,json:async()=>url==='/api/status'?{setupRequired:false,networkMode:'local'}:url==='/api/me'?{authenticated:true}:{viewer,version:1,state:data}});
  class EventSource{addEventListener(){}close(){}}
  vm.runInNewContext(code,{window:{ChroniquesUiHelpers:require('../src/ui-helpers'),ChroniquesLogic:L,ChroniquesProgression:P,ChroniquesOrigins:O,ChroniquesHeritage:H,ChroniquesSpells:S,ChroniquesSpellGuide:G,ChroniquesCreatures:N,ChroniquesArt:A,ChroniquesSheetView:SV,ChroniquesMjBoard:MD,ChroniquesInventory:I,ChroniquesOnboarding:OB,scrollTo(){}},document,fetch,EventSource,console,setTimeout:()=>1,clearTimeout:()=>{},Date,Math,JSON,Number,Boolean,String,Array,Promise,navigator:{}});
  await new Promise(setImmediate);await new Promise(setImmediate);
  listeners.click({target:{closest:()=>({dataset:{nav:screen}})}});
  return el('#app').innerHTML;
 }
 const guideGm=await paint('gm','guide'),guidePlayer=await paint('player','guide');
 assert(guideGm.includes('Inviter ton groupe'));assert(guideGm.includes('Préparer et distribuer le butin'));
 assert(guidePlayer.includes('Découvrir ta fiche'));assert(!guidePlayer.includes('Inviter ton groupe'));
 const invMj=await paint('gm','inventory'),invPlayer=await paint('player','inventory');
 assert(invMj.includes('Butin secret'));assert(invMj.includes('Trésor de campagne'));
 assert(!invPlayer.includes('Butin secret'));assert(!invPlayer.includes('loot-give'));assert(invPlayer.includes('inventory-money'));
});
