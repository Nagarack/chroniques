'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const CHR=require('../src/app-chronicle.js');
const {fixture}=require('./_fixture.js');
const h={esc:s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'),attr:s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;')};

test('« Précédemment dans… », frise et bilan composés à partir des séances et historiques',()=>{
 const t0=new Date(Date.now()-3*86400000).toISOString();
 const state={title:'La Couronne',characters:[{id:'a',name:'Ilda',history:[{id:'1',at:t0,text:'Gagne 300 XP (Le pont).'},{id:'2',at:t0,text:'Passe au niveau 3.'},{id:'3',at:t0,text:'Secret',gm:true,manual:true},{id:'4',at:t0,text:'Quête terminée : Le pont.'}]},{id:'b',name:'Bran',history:[{id:'5',at:t0,text:'Quête terminée : Le pont.'}]}],
  sessionHistory:[{id:'s1',startedAt:t0,lastAt:t0,published:true,combats:2,rounds:5,pcs:{a:{name:'Ilda',damage:12,healing:4,downs:1}},defeated:[{name:'Gobelin 1',visible:true},{name:'Gobelin 2',visible:true},{name:'Ombre',visible:false}],events:[{at:t0,text:'Le pont s’effondre.'},{at:t0,text:'Secret MJ',audience:'gm'}]}],
  campaignPlanner:{quests:[{id:'q',title:'La relique',status:'active',visibility:'shared',objectives:[{id:'o1',text:'Trouver le guide',done:false},{id:'o2',text:'secret',done:false,secret:true}]}]}};
 const d=CHR.recapDraft(state);assert.match(d,/Précédemment dans « La Couronne »/);assert.match(d,/2 combats/);assert.match(d,/Le pont s’effondre/);assert.match(d,/prochain objectif : Trouver le guide/);
 assert.ok(!/Secret MJ|Ombre|secret/.test(d),'rien de secret dans la proposition');assert.match(d,/Ilda : Passe au niveau 3/);
 const tl=CHR.timeline(state,{isGM:false});assert.equal(tl.filter(x=>/Quête terminée/.test(x.title)).length,1,'quête commune dédoublonnée');assert.ok(tl.some(x=>x.kind==='session'));
 const st=CHR.arcStats(state,{isGM:false});assert.equal(st.total.defeated,2);const ilda=st.pcs.find(p=>p.id==='a');assert.equal(ilda.xp,300);assert.equal(ilda.levels,1);assert.equal(ilda.damage,12);
 assert.match(CHR.arcHtml({state,isGM:true,h}),/Gobelin ×2/);assert.match(CHR.timelineHtml({state,isGM:true,h}),/Frise de la campagne/);
});

test('récit publié : visible des joueurs seulement une fois publié, jamais l’option d’écran de table',async t=>{
 const f=await fixture(t);
 assert.equal((await f.action('recapSave',{text:'Précédemment…\n\nLe pont.',published:false},f.pa)).status,403);
 assert.equal((await f.action('recapSave',{text:'Précédemment…\n\nLe pont.',published:false,table:true})).status,200);
 assert.equal((await f.call('/api/state',{cookie:f.pa})).data.state.recap,undefined);
 await f.action('recapSave',{text:'Précédemment…\n\nLe pont.',published:true,table:true});
 const r=(await f.call('/api/state',{cookie:f.pa})).data.state.recap;assert.equal(r.text,'Précédemment…\n\nLe pont.');assert.equal(r.table,undefined);
 assert.equal((await f.action('recapSave',{text:'x'.repeat(4001)})).status,400);
});
