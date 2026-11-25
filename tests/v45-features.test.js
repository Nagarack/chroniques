'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {fixture}=require('./_fixture.js');
const C=require('../src/campaign-planner');

test('Repos guidé : dés de vie dépensés, soins avec Constitution, repos long du groupe',async t=>{
 const f=await fixture(t);
 const me=async()=>(await f.call('/api/state',{cookie:f.gm})).data.state.characters.find(p=>p.id===f.a.id);
 assert.equal((await f.action('hp',{id:f.a.id,delta:-15})).status,200);const hp0=(await me()).hp;
 assert.equal((await f.action('restShort',{id:f.a.id,dice:2,total:30},f.pa)).status,400,'total impossible');
 assert.equal((await f.action('restShort',{id:f.a.id,dice:2,total:11},f.pa)).status,200);
 let p=await me();assert.equal(p.hitDiceUsed,2);assert.ok(p.hp>=hp0+2&&p.hp<=hp0+11+2*5,'soins = total + Con par dé');
 assert.equal((await f.action('restShort',{id:f.b.id,dice:1,total:5},f.pa)).status,403);
 assert.equal((await f.action('restLongAll',{},f.pa)).status,403);
 assert.equal((await f.action('restLongAll',{})).status,200);p=await me();assert.equal(p.hp,p.stats.hp);assert.equal(p.hitDiceUsed,0,'règles 2024 : tous les dés de vie reviennent');
 assert.equal((await f.call('/api/state',{cookie:f.gm})).data.viewer.canUndo,true,'repos du groupe annulable');
});

test('XP et jalons : seuils, niveau signalé, remis à zéro au passage de niveau',async t=>{
 const f=await fixture(t);const lvl=(await f.call('/api/state',{cookie:f.gm})).data.state.characters.find(p=>p.id===f.a.id).level;
 const need=require('../src/class-guide').XP_LEVELS[lvl];
 assert.equal((await f.action('xpAward',{ids:[f.a.id],amount:need},f.pa)).status,403);
 assert.equal((await f.action('xpAward',{ids:[f.a.id],amount:need,reason:'Crypte'})).status,200);
 let p=(await f.call('/api/state',{cookie:f.pa})).data.state.characters.find(x=>x.id===f.a.id);assert.equal(p.xp,need);assert.equal(p.levelUpReady,true);
 assert.equal((await f.action('levelUp',{id:f.a.id},f.pa)).status,200);p=(await f.call('/api/state',{cookie:f.pa})).data.state.characters.find(x=>x.id===f.a.id);assert.equal(p.levelUpReady,false);
 assert.equal((await f.action('milestone',{ids:[f.b.id]})).status,200);assert.equal((await f.call('/api/state',{cookie:f.pb})).data.state.characters.find(x=>x.id===f.b.id).levelUpReady,true);
});

test('Écran de table : réservé au MJ, aucune donnée secrète, carte partagée seulement',async t=>{
 const f=await fixture(t);
 assert.equal((await f.action('npcAdd',{values:{name:'Assassin caché',kind:'monstre',hpMax:50,ac:15,initiative:18,speed:9,visibility:'hidden'}})).status,200);
 assert.equal((await f.action('handoutAdd',{values:{title:'Secret du MJ',text:'…'}})).status,200);
 assert.equal((await f.action('mapAdd',{values:{title:'Privée',summary:'',visibility:'private'}})).status,200);
 const mapId=(await f.call('/api/state',{cookie:f.gm})).data.state.maps.at(-1).id;
 assert.equal((await f.action('tableMap',{mapId})).status,400,'carte privée refusée');
 assert.equal((await f.call('/api/table-state',{cookie:f.pa})).status,403);
 const ts=(await f.call('/api/table-state',{cookie:f.gm})).data;const txt=JSON.stringify(ts);
 for(const secret of ['Assassin caché','Secret du MJ','gmLibrary','lootStash','privateNotes'])assert.ok(!txt.includes(secret),secret);
 assert.equal(ts.viewer.role,'table');assert.ok(!ts.state.maps.some(m=>m.title==='Privée'));
});

test('Carnet : factions et attitude, suppression annulable',async t=>{
 const s={};C.add(s,'factions','cp-faction001',{title:'Guilde des voleurs',summary:'',privateNotes:'',context:'',visibility:'shared',attitude:'mefiant'});
 assert.equal(C.projected(s).factions[0].attitude,'mefiant');assert.throws(()=>C.add(s,'factions','cp-faction002',{title:'X',summary:'',privateNotes:'',context:'',visibility:'oops'}));
 const f=await fixture(t);assert.equal((await f.action('libItemAdd',{values:{name:'Dague maudite',category:'weapon',rarity:'',attunement:false,weight:0,chargesMax:0,description:'',notes:'',icon:''}})).status,200);
 const id=(await f.call('/api/state',{cookie:f.gm})).data.state.gmLibrary.items[0].id;
 assert.equal((await f.action('libItemDelete',{id})).status,200);assert.equal((await f.call('/api/state',{cookie:f.gm})).data.state.gmLibrary.items.length,0);
 const s2=(await f.call('/api/state',{cookie:f.gm})).data;assert.equal((await f.call('/api/action',{method:'POST',cookie:f.gm,body:{kind:'undo',baseVersion:s2.version}})).status,200);
 assert.equal((await f.call('/api/state',{cookie:f.gm})).data.state.gmLibrary.items[0].name,'Dague maudite','restauré par « Annuler »');
});
