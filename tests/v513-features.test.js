'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const L=require('../src/logic');const code=fs.readFileSync(path.join(__dirname,'../src/online-app.js'),'utf8');

// Rendu simulé du client (même principe que campaign-planner.test.js), avec un onglet mémorisé.
async function render(role,nav,saved={}){const els={},listeners={};const $=key=>els[key]??={innerHTML:'',textContent:'',value:'',classList:{add(){},remove(){},toggle(){}}};
 const document={querySelector:$,querySelectorAll:()=>[],addEventListener:(k,f)=>{listeners[k]=f;}};
 const store={'chroniques-onglets':JSON.stringify(saved)};const localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];}};
 const src=L.initialState();src.handouts=[{id:'doc-1',title:'Lettre',text:'Au phare',recipients:'all',sentAt:new Date().toISOString(),readBy:[]}];
 const viewer={role,name:role==='gm'?'MJ':'Joueur',characterId:role==='gm'?null:src.characters[0].id};
 const fetch=async url=>({ok:true,json:async()=>url==='/api/status'?{setupRequired:false,version:'5.13.0',networkMode:'local'}:url==='/api/me'?{authenticated:true}:{viewer,version:1,state:L.clone(src)}});
 class EventSource{addEventListener(){}close(){}}
 const P=require('../src/progression'),O=require('../src/origins'),H=require('../src/heritage'),S=require('../src/spells'),G=require('../src/spell-guide'),N=require('../src/creatures'),A=require('../src/art-catalog');
 vm.runInNewContext(code,{window:{ChroniquesUiHelpers:require('../src/ui-helpers'),ChroniquesLogic:L,ChroniquesProgression:P,ChroniquesOrigins:O,ChroniquesHeritage:H,ChroniquesSpells:S,ChroniquesSpellGuide:G,ChroniquesCreatures:N,ChroniquesArt:A,ChroniquesMarching:require('../src/marching'),ChroniquesTravelJournal:require('../src/travel-journal')},document,localStorage,fetch,EventSource,console,setTimeout:()=>1,clearTimeout:()=>{},Date,Math,JSON,Number,Boolean,String,Array,Promise,navigator:{}});
 await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r));listeners.click({target:{closest:()=>({dataset:{nav}})}});return els['#app'].innerHTML;}
const tabsOf=html=>[...html.matchAll(/data-page-tab="chronicle" data-tab-key="([a-z]+)"/g)].map(m=>m[1]);
const active=html=>/class="tab-host" data-active="([a-z]+)"/.exec(html)?.[1];

test('5.13 : Chronique en groupes d’onglets, ancien onglet mémorisé repris dans son groupe',async()=>{
 const gm=await render('gm','chronicle');const tabs=tabsOf(gm);assert.ok(tabs.length>=3&&tabs.length<=5,tabs.join());assert.ok(tabs.every(k=>['seances','monde','carnet','histoire','documents'].includes(k)));
 assert.ok(/data-tab="carnet" data-tab-on|data-tab="seances" data-tab-on/.test(gm),'les rubriques du groupe actif sont marquées');
 const old=await render('gm','chronicle',{chronicle:'voyages'});assert.equal(active(old),'monde','« voyages » (5.12) → « Monde »');
 const old2=await render('gm','chronicle',{chronicle:'enquete'});assert.equal(active(old2),'carnet');
 const html=await render('gm','chronicle',{chronicle:'monde'});assert.ok(html.includes('data-tab="voyages" data-tab-on'));assert.ok(!html.includes('data-tab="carnet" data-tab-on'));});

test('5.13 : page « Cet appareil » et menu du compte allégé',async()=>{
 const html=await render('player','device');assert.match(html,/Cet appareil/);for(const g of ['lang:fr','lang:en','units:m','units:ft','theme:dark','theme:light','theme:auto','size:0','size:2'])assert.ok(html.includes(`data-device="${g}"`),g);
 assert.match(html,/data-task="read-easy"/);assert.match(html,/data-task="cvd-toggle"/);assert.match(html,/Raccourcis clavier/);
 const menu=/<details class="account-actions">[\s\S]*?<\/details>/.exec(html)[0];assert.match(menu,/data-nav="device"/);
 for(const t of ['theme-cycle','read-easy','cvd-toggle','text-size','units-toggle'])assert.ok(!menu.includes(`data-task="${t}"`),t+' n’est plus dans le menu du compte');});

test('5.13 : accueil du joueur — son personnage avant « Autour de la table »',async()=>{
 const html=await render('player','overview');const me=html.indexOf('Mon personnage');assert.ok(me>0);const around=html.indexOf('Autour de la table');assert.ok(around<0||around>me);});
