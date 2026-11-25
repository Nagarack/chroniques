'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const code=fs.readFileSync(path.join(__dirname,'../src/online-app.js'),'utf8');const L=require('../src/logic');const P=require('../src/progression');const O=require('../src/origins');const H=require('../src/heritage');
const SV=require('../src/sheet-view');
const tick=()=>new Promise(r=>setImmediate(r));
function init(){
 const elements={},listeners={},state=L.initialState(),calls=[];
 const document={querySelector(k){return elements[k]||=( {innerHTML:'',textContent:'',value:'',classList:{add(){},remove(){},toggle(){}}});},addEventListener(event,callback){listeners[event]=callback;}};
 const fetch=async url=>{const route=String(url).replace('/api/','');calls.push(route);let data={};
  if(route==='me')data={authenticated:true};
  if(route==='state')data={viewer:{name:'MJ Test',role:'gm',characterId:null},version:2,state};
  if(route==='management')data={members:[],invites:[{id:'invite123',characterId:'aelin',characterName:'Aëlin Sylveronce',expiresAt:Date.now()+1000*60*60}]};
  return {ok:true,status:200,json:async()=>data};};
 class EventSource{addEventListener(){}close(){}};
 const context={window:{ChroniquesUiHelpers:require('../src/ui-helpers'),ChroniquesLogic:L,ChroniquesProgression:P,ChroniquesOrigins:O,ChroniquesHeritage:H,ChroniquesSheetView:SV},document,fetch,EventSource,console,setTimeout:()=>1,clearTimeout:()=>{},Date,Math,JSON,Number,Boolean,String,Array,Promise,navigator:{}};
 vm.runInNewContext(code,context);
 function click(dataset){listeners.click({target:{closest:()=>({dataset})}});}
 return {elements,click,calls};
}
test('les cartes personnages montrent les modificateurs et l’éditeur de fiche',async()=>{
 const ui=init();await tick();await tick();ui.click({nav:'character'});ui.click({sheetSection:'build'});
 assert.match(ui.elements['#app'].innerHTML,/Modifier la fiche/);
 assert.match(ui.elements['#app'].innerHTML,/FOR/);
 ui.click({modal:'edit'});assert.match(ui.elements['#app'].innerHTML,/edit-pc-form/);
 assert.match(ui.elements['#app'].innerHTML,/score_dex/);
});
test('campagne montre la liste des invitations et les commandes révocation',async()=>{
 const ui=init();await tick();await tick();ui.click({nav:'campaign'});await tick();await tick();
 assert.match(ui.elements['#app'].innerHTML,/Codes en attente/);
 assert.match(ui.elements['#app'].innerHTML,/data-revoke-invite/);
 assert.match(ui.elements['#app'].innerHTML,/Nom de campagne/);
});
test('V0.9 : fiche MJ contient classe, sous-classe, progression, sorts et compétences',async()=>{
 const ui=init();await tick();await tick();ui.click({nav:'character'});ui.click({sheetSection:'build'});
 const html=ui.elements['#app'].innerHTML;
 assert.match(html,/Progression du personnage/);
 assert.match(html,/id="build-form"/);
 assert.match(html,/name="subclass"/);
 assert.match(html,/data-task="level-up"/);
 assert.match(html,/Emplacements de sorts calculés/);
 assert.match(html,/data-skill-id="perception"/);
 assert.match(html,/Activer le suivi des emplacements/);
});
