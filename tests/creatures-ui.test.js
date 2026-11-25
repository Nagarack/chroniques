'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const L=require('../src/logic'),N=require('../src/creatures'),P=require('../src/progression'),O=require('../src/origins'),H=require('../src/heritage'),S=require('../src/spells'),G=require('../src/spell-guide');
const MD=require('../src/mj-dashboard');
const code=fs.readFileSync(path.join(__dirname,'../src/online-app.js'),'utf8');
const tick=()=>new Promise(done=>setImmediate(done));
async function makeUi(role){const listeners={},elems={},state=L.initialState();N.add(state,'npc-secret',{name:'Arbitre secret',kind:'pnj',hpMax:15,ac:12,initiative:19,speed:9,visibility:'hidden',showHp:false,notes:'secret bleu',actions:'d8'});L.sortInitiative(state,'mj');
 let ver=3;const viewer=role==='gm'?{name:'MJ',role:'gm',characterId:null}:{name:'Joueur',role:'player',characterId:'aelin'};
 const projected=()=>role==='gm'?L.clone(state):(()=>{const x=N.project(state);delete x.gmNotes;return x;})();
 const document={querySelector(sel){return elems[sel]||=( {innerHTML:'',value:'',textContent:'',classList:{add(){},remove(){},toggle(){}}});},addEventListener(name,fn){listeners[name]=fn;},querySelectorAll(){return [];}};
 const fetch=async(route,opt)=>{let data={};if(route==='/api/status')data={setupRequired:false,version:'2.8.0'};if(route==='/api/me')data={authenticated:true};if(route==='/api/state')data={viewer,version:ver,state:projected()};if(route==='/api/action'){ver++;data={viewer,version:ver,state:projected()};}return {ok:true,status:200,json:async()=>data};};
 class EventSource{addEventListener(){}close(){}}
 vm.runInNewContext(code,{window:{ChroniquesUiHelpers:require('../src/ui-helpers'),ChroniquesLogic:L,ChroniquesCreatures:N,ChroniquesProgression:P,ChroniquesOrigins:O,ChroniquesHeritage:H,ChroniquesSpells:S,ChroniquesSpellGuide:G,ChroniquesMjBoard:MD},document,fetch,EventSource,console,setTimeout:()=>1,clearTimeout:()=>{},Date,Math,JSON,Number,Boolean,String,Array,Promise,navigator:{}});
 await tick();await tick();return {elems,listeners,html:()=>elems['#app'].innerHTML,modal:()=>elems['#app'].innerHTML};
}
test('interface MJ : le bestiaire privé et les contrôles sont visibles, sans jet automatique',async()=>{const ui=await makeUi('gm');ui.listeners.click({target:{closest:()=>({dataset:{nav:'combat'}})}});ui.listeners.click({target:{closest:()=>({dataset:{mjView:'detail'}})}});const html=ui.html();assert.match(html,/Bestiaire privé du MJ/);assert.match(html,/Arbitre secret/);assert.match(html,/secret bleu/);assert.match(html,/data-npc-hp/);assert.match(html,/vrais dés/);ui.listeners.click({target:{closest:()=>({dataset:{npcCreate:''}})}});assert.match(ui.modal(),/Ajouter un monstre ou PNJ/);assert.match(ui.modal(),/Notes privées MJ/);});
test('interface joueur : ni contrôle MJ, ni créature masquée, ni notes secrètes',async()=>{const ui=await makeUi('player');ui.listeners.click({target:{closest:()=>({dataset:{nav:'combat'}})}});assert.doesNotMatch(ui.html(),/Bestiaire privé du MJ|Arbitre secret|secret bleu|data-npc-hp/);assert.doesNotMatch(ui.html(),/data-npc-create/);});
