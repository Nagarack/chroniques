'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const SUG=require('../src/suggestions.js');const PERS=require('../src/personality.js');const TJ=require('../src/travel-journal.js');

test('suggestions : soutien « +1 », tableau commun anonyme',()=>{const db={};SUG.add(db,'s1',{id:'u1',name:'Ana'},{title:'Idée A',text:'Une idée utile'});
 assert.throws(()=>SUG.vote(db,'s1','u1'),/propre idée/);assert.equal(SUG.vote(db,'s1','u2'),true);assert.equal(SUG.vote(db,'s1','u3'),true);assert.equal(SUG.vote(db,'s1','u2'),false,'second appel : soutien retiré');
 const b=SUG.forBoard(db,'u3')[0];assert.equal(b.votes,1);assert.equal(b.voted,true);assert.equal(b.mine,false);assert.equal(b.author,undefined);assert.equal(b.campaign,undefined);assert.equal(b.userId,undefined);
 assert.equal(SUG.forBoard(db,'u1')[0].mine,true);assert.equal(SUG.forAdmin(db)[0].votes,1);assert.equal(SUG.forUser(db,'u1')[0].votes,1);});

test('personnalité : champs, partage, liens entre personnages',()=>{const s={characters:[{id:'a',name:'Ana'},{id:'b',name:'Bor'}]};const a=s.characters[0];
 PERS.set(a,{traits:'Je cite des proverbes.',ideals:'',bonds:'Le temple',flaws:'Les paris',shared:false});assert.equal(a.personality.shared,false);assert.equal(a.personality.bonds,'Le temple');
 assert.throws(()=>PERS.set(a,{traits:'x'.repeat(501)}),/500/);PERS.set(a,{traits:'',ideals:'',bonds:'',flaws:''});assert.equal(a.personality,undefined,'tout vide : retiré');
 PERS.tie(s,a,'b','Lui doit la vie');assert.deepEqual(a.ties,[{to:'b',text:'Lui doit la vie'}]);PERS.tie(s,a,'b','Rival');assert.equal(a.ties.length,1);assert.equal(a.ties[0].text,'Rival');
 assert.throws(()=>PERS.tie(s,a,'a','Moi'),/autre personnage/);assert.throws(()=>PERS.tie(s,a,'z','?'),/introuvable/);PERS.tie(s,a,'b','');assert.equal(a.ties,undefined);});

test('journal de voyage : voyages, étapes, notes secrètes, exploration implicite',()=>{const s={};
 TJ.add(s,'e0',{kind:'hex',text:'3 hexagones',km:9});assert.equal(TJ.current(s).title,'Exploration');TJ.begin(s,'t1',{title:'Port-Brume'});assert.ok(s.travelLog.trips[1].endedAt,'le voyage précédent se ferme');
 TJ.add(s,'e1',{kind:'march',text:'8 h de marche',km:24,day:1});TJ.add(s,'e2',{kind:'note',text:'Pont effondré',by:'Ana'});TJ.add(s,'e3',{kind:'note',text:'Embuscade prévue',gm:true});
 assert.equal(TJ.totalKm(TJ.current(s)),24);const p=TJ.projected(s);assert.deepEqual(p.trips[0].entries.map(e=>e.id),['e1','e2'],'note du MJ retirée');
 assert.throws(()=>TJ.add(s,'e4',{kind:'note',text:''}),/obligatoire/);TJ.remove(s,'e2');assert.equal(TJ.current(s).entries.length,2);TJ.end(s);assert.equal(TJ.current(s),null);
 TJ.removeTrip(s,'t1');assert.equal(s.travelLog.trips.length,1);});

test('5.10 : serveur (soutiens, tableau de bord, personnalité, journal)',async t=>{const f=await require('./_fixture.js').fixture(t);
 await f.call('/api/suggestion',{method:'POST',cookie:f.pa,body:{title:'Idée A',text:'Une idée utile'}});let r=await f.call('/api/suggestions',{cookie:f.pb});const sid=r.data.board[0].id;assert.equal(r.data.board[0].author,undefined);
 r=await f.call('/api/suggestion/vote',{method:'POST',cookie:f.pb,body:{id:sid}});assert.equal(r.status,200);assert.equal(r.data.board[0].votes,1);
 r=await f.call('/api/suggestion/vote',{method:'POST',cookie:f.pa,body:{id:sid}});assert.equal(r.status,400,'pas pour sa propre idée');
 r=await f.call('/api/admin/overview',{cookie:f.pa});assert.equal(r.status,403);r=await f.call('/api/admin/overview',{cookie:f.gm});assert.equal(r.status,200);
 assert.ok(r.data.users.length>=3);assert.ok(r.data.users.some(u=>u.admin));assert.equal(r.data.campaigns.length,1);assert.ok(r.data.storage.database>0);assert.ok('latestFull' in r.data.backups);assert.ok(!JSON.stringify(r.data).includes('passHash'));
 r=await f.action('personalitySet',{id:f.a.id,values:{traits:'Rieuse',bonds:'Secret de famille',shared:false}},f.pa);assert.equal(r.status,200);
 r=await f.action('personalitySet',{id:f.a.id,values:{traits:'x'}},f.pb);assert.equal(r.status,403);await f.action('tieSet',{id:f.a.id,to:f.b.id,text:'Lui doit la vie'},f.pa);
 let ps=(await f.call('/api/state',{cookie:f.pb})).data.state;let other=ps.characters.find(p=>p.id===f.a.id);assert.equal(other.personality,undefined,'non partagée');assert.equal(other.ties[0].text,'Lui doit la vie');
 await f.action('personalitySet',{id:f.a.id,values:{traits:'Rieuse',shared:true}},f.pa);ps=(await f.call('/api/state',{cookie:f.pb})).data.state;assert.equal(ps.characters.find(p=>p.id===f.a.id).personality.traits,'Rieuse');
 await f.action('travelStart',{values:{destination:'Port-Brume',distanceKm:40,pace:'normal'}});await f.action('travelAdvance',{hours:8});await f.action('travelCamp',{});
 r=await f.action('travelNote',{noteKind:'place',text:'Le gué aux saules'},f.pa);assert.equal(r.status,200,JSON.stringify(r.data));await f.action('travelNote',{noteKind:'note',text:'Embuscade au jour 2',secret:true});
 ps=(await f.call('/api/state',{cookie:f.pb})).data.state;const tr=ps.travelLog.trips[0];assert.equal(tr.title,'Port-Brume');assert.deepEqual(tr.entries.map(e=>e.kind),['start','march','camp','place']);
 assert.ok(!JSON.stringify(ps.travelLog).includes('Embuscade'));const note=tr.entries.find(e=>e.kind==='place');assert.equal(note.by,f.a.name);
 r=await f.action('travelNoteRemove',{entryId:note.id},f.pb);assert.equal(r.status,403);r=await f.action('travelNoteRemove',{entryId:note.id},f.pa);assert.equal(r.status,200);
 await f.action('travelEnd',{});const gs=(await f.call('/api/state',{cookie:f.gm})).data.state;assert.ok(gs.travelLog.trips[0].endedAt);assert.equal(gs.travelLog.trips[0].entries.at(-1).kind,'end');});

test('5.10 : mode table unique (code, choix du personnage, routes fermées)',async t=>{const f=await require('./_fixture.js').fixture(t);
 let r=await f.call('/api/table-mode',{method:'POST',cookie:f.pa,body:{op:'start',pin:'1234'}});assert.equal(r.status,403,'joueur : refusé');
 r=await f.call('/api/table-mode',{method:'POST',cookie:f.gm,body:{op:'start',pin:'12'}});assert.equal(r.status,400);
 await f.action('sceneAdd',{values:{title:'Secret',summary:'',gmNotes:'note-mj-secrete',status:'planned',visibility:'private',links:[]}});
 r=await f.call('/api/table-mode',{method:'POST',cookie:f.gm,body:{op:'start',pin:'2468'}});assert.equal(r.status,200);
 let st=(await f.call('/api/state',{cookie:f.gm})).data;assert.equal(st.viewer.tableMode,true);assert.equal(st.viewer.role,'player');assert.equal(st.viewer.characterId,null);assert.equal(st.viewer.isAdmin,false);
 assert.ok(!JSON.stringify(st).includes('note-mj-secrete'),'aucun secret du MJ sur la tablette');
 for(const [m,p,b] of [['POST','/api/invites',{characterId:f.a.id}],['GET','/api/suggestions'],['POST','/api/view-mode',{mode:'gm'}],['GET','/api/admin/overview'],['POST','/api/password',{current:'x',next:'y'}],['GET','/api/export']])
  assert.equal((await f.call(p,{method:m,cookie:f.gm,body:b})).status,403,m+' '+p);
 r=await f.call('/api/table-mode',{method:'POST',cookie:f.gm,body:{op:'pick',characterId:f.a.id}});assert.equal(r.status,200);
 st=(await f.call('/api/state',{cookie:f.gm})).data;assert.equal(st.viewer.characterId,f.a.id);
 r=await f.action('personalitySet',{id:f.a.id,values:{traits:'Écrit depuis la tablette'}},f.gm);assert.equal(r.status,200);r=await f.action('personalitySet',{id:f.b.id,values:{traits:'x'}},f.gm);assert.equal(r.status,403,'seulement le personnage choisi');
 r=await f.action('clockAdd',{values:{label:'X',segments:4}},f.gm);assert.equal(r.status,403,'actions du MJ refusées');
 r=await f.call('/api/table-mode',{method:'POST',cookie:f.gm,body:{op:'stop',pin:'0000'}});assert.equal(r.status,403);
 r=await f.call('/api/table-mode',{method:'POST',cookie:f.gm,body:{op:'stop',pin:'2468'}});assert.equal(r.status,200);
 st=(await f.call('/api/state',{cookie:f.gm})).data;assert.equal(st.viewer.tableMode,false);assert.equal(st.viewer.role,'gm');assert.ok(JSON.stringify(st).includes('note-mj-secrete'));});
