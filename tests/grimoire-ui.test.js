'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const L=require('../src/logic'),P=require('../src/progression'),O=require('../src/origins'),H=require('../src/heritage'),S=require('../src/spells'),G=require('../src/spell-guide');
const code=fs.readFileSync(path.join(__dirname,'../src/online-app.js'),'utf8');
const wait=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(){
 const elems={},listeners={},state=L.initialState();const mage=L.findPc(state,'elyra');
 mage.progression={classId:'wizard',subclass:'',spentSlots:{}};
 S.add(mage,'wizard','2024',{spellId:'fire-bolt'},'bolt-test');
 S.add(mage,'wizard','2024',{spellId:'magic-missile',prepared:true},'missile-test');
 const document={querySelector(k){return elems[k]||=({innerHTML:'',textContent:'',value:'',classList:{add(){},remove(){},toggle(){}}});},addEventListener(event,cb){listeners[event]=cb;}};
 let version=1;const fetch=async(url,opts)=>{const route=String(url).replace('/api/','');let data={};if(route==='status')data={setupRequired:false};if(route==='me')data={authenticated:true};if(route==='state')data={state,viewer:{role:'gm',name:'MJ',characterId:null},version};if(route==='action'){version++;data={state,viewer:{role:'gm',name:'MJ',characterId:null},version};}return {ok:true,status:200,json:async()=>data};};
 class EventSource{addEventListener(){}close(){}}
 vm.runInNewContext(code,{window:{ChroniquesUiHelpers:require('../src/ui-helpers'),ChroniquesLogic:L,ChroniquesProgression:P,ChroniquesOrigins:O,ChroniquesHeritage:H,ChroniquesSpells:S,ChroniquesSpellGuide:G},document,fetch,EventSource,console,setTimeout:()=>1,clearTimeout:()=>{},Date,Math,JSON,Number,Boolean,String,Array,Promise,navigator:{}});
 const click=dataset=>listeners.click({target:{closest:()=>({dataset})}});
 return {click,elems,listeners};
}
test('UI : onglet Grimoire accessible et liste filtrée selon classe',async()=>{
 const t=fixture();await wait();await wait();assert.match(t.elems['#app'].innerHTML,/Grimoire de sorts/);
 t.click({nav:'grimoire'});
 assert.match(t.elems['#app'].innerHTML,/id="spell-add-form"/);
 assert.match(t.elems['#app'].innerHTML,/Aëlin Sylveronce/);
 assert.match(t.elems['#app'].innerHTML,/Sort disponible/);
});
test('UI : modal incantation, filtres et contrôle de l’emplacement',async()=>{
 const t=fixture();await wait();await wait();t.click({nav:'grimoire'});
 t.listeners.change({target:{id:'grim-character',value:'elyra',dataset:{},closest:()=>null}});
 assert.match(t.elems['#app'].innerHTML,/Projectile magique/);
 t.click({castSpell:'missile-test'});
 const html=t.elems['#app'].innerHTML;
 assert.match(html,/id="cast-form"/);
 assert.match(html,/Emplacement disponible/);
 assert.match(html,/Dépenser un emplacement/);
});
