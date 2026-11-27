'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const L=require('../src/logic'),P=require('../src/progression'),O=require('../src/origins'),H=require('../src/heritage'),S=require('../src/spells'),G=require('../src/spell-guide'),N=require('../src/creatures'),A=require('../src/art-catalog');
const code=fs.readFileSync(path.join(__dirname,'../src/online-app.js'),'utf8');
const tick=()=>new Promise(r=>setImmediate(r));
async function app(role='gm'){
 const state=L.initialState();let version=2;const elements={},listeners={};
 const actor=role==='gm'?'aelin':'aelin';
 const viewer={role,name:role==='gm'?'MJ':'Joueur',characterId:role==='gm'?null:'aelin'};
 const el=s=>elements[s]||=( {innerHTML:'',value:'',textContent:'',classList:{add(){},remove(){},toggle(){}}});
 const document={querySelector:el,addEventListener:(k,fn)=>{listeners[k]=fn;},querySelectorAll:()=>[]};
 const fetch=async route=>{const payload=route==='/api/status'?{setupRequired:false,version:'2.8.0'}:route==='/api/me'?{authenticated:true}:route==='/api/state'?{viewer,version,state}:{};return {ok:true,status:200,json:async()=>payload};};
 class EventSource{addEventListener(){}close(){}}
 vm.runInNewContext(code,{window:{ChroniquesUiHelpers:require('../src/ui-helpers'),ChroniquesLogic:L,ChroniquesProgression:P,ChroniquesOrigins:O,ChroniquesHeritage:H,ChroniquesSpells:S,ChroniquesSpellGuide:G,ChroniquesCreatures:N,ChroniquesArt:A},document,fetch,EventSource,console,setTimeout:()=>1,clearTimeout:()=>{},Date,Math,JSON,Number,Boolean,String,Array,Promise,navigator:{}});
 await tick();await tick();return {elements,listeners,html:()=>elements['#app'].innerHTML};
}
test('MJ : galerie d’icônes, import et changement de catégorie visibles',async()=>{
 const ui=await app('gm');
 ui.listeners.click({target:{closest:()=>({dataset:{nav:'illustrations'}})}});
 let html=ui.html();assert.match(html,/<h1>Illustrations &amp; objets<\/h1>/);assert.match(html,/Ajouter à l’inventaire|Associer une illustration/);assert.match(html,/Importer cette image/);assert.match(html,/data-art-id/);assert.match(html,/Lorc|Delapouite/);
 ui.listeners.change({target:{id:'media-kind',value:'npc',dataset:{},closest:()=>null}});
 html=ui.html();assert.match(html,/Monstre \/ PNJ/);assert.match(html,/goblin-head|dragon-head/);
});
test('Un joueur ne voit pas les contrôles d’édition des autres personnages dans la galerie',async()=>{
 const ui=await app('player');ui.listeners.click({target:{closest:()=>({dataset:{nav:'illustrations'}})}});
 const html=ui.html();assert.match(html,/aelin/);assert.doesNotMatch(html,/id="media-kind"[^<]*>[\s\S]*?<option value="npc"/);
});
