'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../src/online-app.js'),'utf8');
const L=require('../src/logic');
const P=require('../src/progression');const O=require('../src/origins');const H=require('../src/heritage');
const wait=()=>new Promise(ok=>setImmediate(ok));
function makeUi(loggedIn){
 const elems={},listeners={},calls=[],st=L.initialState();let version=1;
 const document={querySelector(sel){return elems[sel]||=( {innerHTML:'',textContent:'',value:'',classList:{add(){},remove(){},toggle(){}}});},addEventListener(name,fn){listeners[name]=fn;}};
 const fetch=async(url,options)=>{
  const route=String(url).replace('/api/','');calls.push(route);
  let value={};if(route==='me')value={authenticated:loggedIn};if(route==='status')value={setupRequired:!loggedIn};
  if(route==='state')value={viewer:{name:'MJ Demo',role:'gm',characterId:null},version,state:st};
  if(route==='action'){version++;value={viewer:{name:'MJ Demo',role:'gm',characterId:null},version,state:st};}
  return {ok:true,status:200,json:async()=>value};
 };
 class EventSource{constructor(url){this.url=url;}addEventListener(){}close(){}}
 vm.runInNewContext(code,{window:{ChroniquesUiHelpers:require('../src/ui-helpers'),ChroniquesLogic:L,ChroniquesProgression:P,ChroniquesOrigins:O,ChroniquesHeritage:H},document,fetch,EventSource,console,setTimeout:()=>1,clearTimeout:()=>{},Date,Math,JSON,Number,Boolean,String,Array,Promise,navigator:{}});
 return {elems,listeners,calls};
}
test('affiche écran de première configuration en absence de session',async()=>{
 const ui=makeUi(false);await wait();await wait();assert.match(ui.elems['#app'].innerHTML,/Première installation/);assert.match(ui.elems['#app'].innerHTML,/Clé initiale du serveur/);
});
test('vue MJ connectée remplace le commutateur de rôles simulés',async()=>{
 const ui=makeUi(true);await wait();await wait();assert.match(ui.elems['#app'].innerHTML,/Vue du Maître du Jeu/);assert.match(ui.elems['#app'].innerHTML,/Déconnexion/);assert.doesNotMatch(ui.elems['#app'].innerHTML,/Mode démo/);
});
