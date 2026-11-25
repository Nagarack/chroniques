'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const PR=require('../src/app-prep.js');
const h={esc:s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'),attr:s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')};

test('PNJ express : suggestions écrites, secret jamais dans le résumé public',()=>{
 for(const k of ['name','role','trait','voice','want','secret'])assert.ok(PR.SUGGEST[k].length>=10,k);
 const v=PR.npcExpressValues({name:'Odile',role:'Herboriste',trait:'Curieuse',voice:'Chuchote',want:'Fuir',secret:'Espionne',attitude:'amical',context:'Le Chaudron',shared:true});
 assert.equal(v.title,'Odile');assert.equal(v.context,'Herboriste · Le Chaudron');assert.match(v.summary,/Trait : Curieuse/);assert.ok(!/Espionne|Fuir/.test(v.summary));
 assert.match(v.privateNotes,/Secret : Espionne/);assert.equal(v.visibility,'shared');
 const C=require('../src/campaign-planner.js');const s={};C.add(s,'npcs','cp-abcdefgh1',v);assert.equal(C.projected(s).npcs[0].privateNotes,undefined);
 const html=PR.npcExpressModal({h,places:[{title:'<b>Lieu</b>'}]});assert.ok(!html.includes('<b>Lieu'));assert.match(html,/datalist id="npcx-voice"/);
});

test('Séance du jour : scènes non terminées, rencontres et PNJ reliés, documents non envoyés',()=>{
 const state={characters:[],schedule:{options:[{id:'o1',at:'2026-12-01T20:00',note:'Chez Léa'}],chosen:'o1'},
  campaignPlanner:{npcs:[{id:'cp-n',title:'Odile',privateNotes:'Espionne',attitude:'amical'}],places:[],quests:[{id:'cp-q',title:'Le col',status:'active',objectives:[{id:'o',text:'Trouver le guide',done:false}]}]},
  gmLibrary:{templates:[{id:'t1',name:'Gobelin',cr:'1/4'}],encounters:[{id:'e1',name:'Embuscade',groups:[{templateId:'t1',quantity:4}]}]},
  sessionFlow:[{id:'sc1',title:'Arrivée',status:'planned',visibility:'private',summary:'',gmNotes:'Pluie',links:[{type:'npcs',id:'cp-n'},{type:'encounters',id:'e1'}]},{id:'sc2',title:'Fini',status:'completed',links:[]}],
  handouts:[{id:'h1',title:'Lettre',sentAt:null},{id:'h2',title:'Carte',sentAt:'2026-01-01'}],combat:{started:false}};
 const d=PR.collect(state);assert.deepEqual(d.scenes.map(s=>s.id),['sc1']);assert.equal(d.encounters[0].id,'e1');assert.equal(d.npcs[0].title,'Odile');assert.deepEqual(d.handouts.map(x=>x.id),['h1']);assert.equal(d.quests[0].id,'cp-q');
 const html=PR.todayPage({state,h,fmtDate:x=>x,partyRows:[]});assert.match(html,/4 × Gobelin/);assert.match(html,/Chez Léa/);assert.match(html,/data-encounter-deploy="e1"/);assert.ok(!html.includes('Fini'));
});
