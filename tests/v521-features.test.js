'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const L=require('../src/logic.js');const SS=require('../src/session-summary.js');

test('présence : les absents de la séance n’entrent pas dans l’initiative et sont comptés (5.21)',async t=>{
 const s=L.initialState();const [a,b]=s.characters;s.characters.forEach((p,i)=>p.initiative=15-i);
 SS.setAbsent(s,b.id,true);L.startCombat(s,'mj');assert.ok(!s.combat.order.includes(b.id),'absent hors de l’ordre');assert.ok(s.combat.order.includes(a.id));
 SS.setAbsent(s,b.id,false);assert.deepEqual(s.sessionStats.absent,[]);SS.setAbsent(s,b.id,true);SS.setAbsent(s,b.id,true);assert.deepEqual(s.sessionStats.absent,[b.id],'pas de doublon');
 const at=SS.attendance(s);assert.deepEqual(at[b.id],{sessions:1,present:0});assert.deepEqual(at[a.id],{sessions:1,present:1});
 const f=await require('./_fixture.js').fixture(t);
 let r=await f.action('attendance',{id:f.a.id,absent:true});assert.equal(r.status,200,JSON.stringify(r.data));assert.deepEqual(r.data.state.sessionStats.absent,[f.a.id]);
 r=await f.action('attendance',{id:f.a.id,absent:false},f.pa);assert.equal(r.status,403,'réservé au MJ');});

test('arcs des personnages : écrits par le joueur, avancés par le MJ, secrets gardés (5.21)',async t=>{
 const ARC=require('../src/arcs.js');const pc={};ARC.add(pc,'a1',{text:'Retrouver ma sœur'});ARC.add(pc,'a2',{text:'Venger mon maître',secret:true});ARC.add(pc,'a3',{text:'Trois'});
 assert.throws(()=>ARC.add(pc,'a4',{text:'Quatre'}),/Au plus 3/);
 const st={sessionHistory:[{startedAt:'2026-01-01T20:00:00Z'},{startedAt:'2026-02-01T20:00:00Z'}],sessionStats:{startedAt:'2026-03-01T20:00:00Z'}};
 pc.arcs[0].createdAt='2025-12-01T00:00:00Z';assert.equal(ARC.sessionsSince(st,pc.arcs[0]),3);ARC.progress(pc,'a1','advance','Une lettre de Port-Brume','2026-02-15T00:00:00Z');assert.equal(ARC.sessionsSince(st,pc.arcs[0]),1);
 assert.deepEqual(ARC.publicView(pc).map(a=>a.id),['a1','a3'],'arc secret retiré');
 const f=await require('./_fixture.js').fixture(t);
 let r=await f.action('arcAdd',{id:f.a.id,values:{text:'Retrouver ma sœur'}},f.pa);assert.equal(r.status,200,JSON.stringify(r.data));
 r=await f.action('arcAdd',{id:f.a.id,values:{text:'Le nom du traître',secret:true}},f.pa);assert.equal(r.status,200);
 r=await f.action('arcAdd',{id:f.a.id,values:{text:'Pas ma fiche'}},f.pb);assert.equal(r.status,403,'pas la fiche d’un autre');
 const arcs=(await f.call('/api/state',{cookie:f.gm})).data.state.characters.find(p=>p.id===f.a.id).arcs;
 r=await f.action('arcProgress',{id:f.a.id,arcId:arcs[0].id,step:'advance',note:'Une piste au port'},f.pa);assert.equal(r.status,403,'avancée réservée au MJ');
 r=await f.action('arcProgress',{id:f.a.id,arcId:arcs[0].id,step:'advance',note:'Une piste au port'});assert.equal(r.status,200);
 r=await f.action('arcProgress',{id:f.a.id,arcId:arcs[1].id,step:'done'});assert.equal(r.status,200);
 const log=r.data.state.combat.log.map(l=>l.msg).join(' | ');assert.match(log,/avance : Retrouver ma sœur/);assert.doesNotMatch(log,/traître/,'arc secret jamais annoncé');
 const pb=(await f.call('/api/state',{cookie:f.pb})).data.state;const seen=pb.characters.find(p=>p.id===f.a.id);assert.deepEqual(seen.arcs.map(a=>a.text),['Retrouver ma sœur']);assert.ok(!JSON.stringify(pb).includes('traître'));
 const pa=(await f.call('/api/state',{cookie:f.pa})).data.state;assert.equal(pa.characters.find(p=>p.id===f.a.id).arcs.length,2,'le joueur voit ses arcs secrets');});

test('lexique : chaque terme a sa définition en français et en anglais, sans HTML (5.21)',()=>{const G=require('../src/glossary.js');
 const keys=Object.keys(G.TERMS);assert.ok(keys.length>=20);for(const k of keys){const fr=G.get(k,'fr'),en=G.get(k,'en');assert.ok(fr.term&&fr.text.length>30&&en.term&&en.text.length>30,k);assert.doesNotMatch(fr.text+en.text,/[<>]/,k);}
 assert.equal(G.get('inconnu','fr'),null);assert.equal(G.all('en')[0].term<=G.all('en')[1].term,true,'trié');
 const src=require('node:fs').readFileSync(require('node:path').join(__dirname,'../src/online-app.js'),'utf8');for(const k of ['ca','maitrise','perception','concentration','pvtemp'])assert.ok(src.includes(`term('${k}'`),'terme utilisé : '+k);});

test('import Universal VTT : murs, portes et grille convertis, rien d’exécuté (5.21)',async t=>{const U=require('../src/uvtt-import.js');
 const PNG='iVBORw0KGgoAAAANSUhEUgAAACgAAAAeCAIAAADRv8uKAAAAOklEQVR4Xu3QMQ0AMAzEwDQwA6Jz4Vch4V98BCz5vDuV0InoMoxxNcbVGFdjXI1xNcbVGFdjXI2Jrf5vzQF89UcgBgAAAABJRU5ErkJggg==';
 const file={format:0.3,resolution:{map_origin:{x:0,y:0},map_size:{x:20,y:15},pixels_per_grid:2},
  line_of_sight:[[{x:0,y:0},{x:5,y:0},{x:10,y:0},{x:10,y:7.5}],[{x:2,y:2},{x:2,y:2}]],objects_line_of_sight:[[{x:15,y:3},{x:15,y:6}]],
  portals:[{position:{x:10,y:9},bounds:[{x:10,y:8},{x:10,y:10}],closed:true},{bounds:[{x:4,y:15},{x:6,y:15}],closed:false}],lights:[{position:{x:3,y:3},range:6}],image:PNG,environment:{baked_lighting:true}};
 assert.equal(U.isUvtt(file),true);assert.equal(U.isUvtt({hello:1}),false);assert.throws(()=>U.convert({}),/Universal VTT/);
 const r=U.convert(file);assert.equal(r.cells,20);assert.equal(r.mime,'image/png');
 assert.deepEqual(r.walls.filter(w=>!w.door).map(w=>[w.x1,w.y1,w.x2,w.y2]),[[0,0,500,0],[500,0,500,500],[750,200,750,400]],'points alignés fusionnés, mur nul ignoré');
 assert.deepEqual(r.walls.filter(w=>w.door).map(w=>[w.x1,w.y1,w.x2,w.y2,w.open]),[[500,533,500,667,false],[200,1000,300,1000,true]]);
 assert.equal(r.lights,1);assert.ok(r.warnings.some(w=>/lumière/.test(w)));
 const big=U.convert({...file,resolution:{map_size:{x:120,y:90}},image:''});assert.equal(big.cells,0);assert.ok(big.warnings.length>=2);
 const f=await require('./_fixture.js').fixture(t);let res=await f.action('mapAdd',{values:{title:'Grotte',summary:'',visibility:'private'}});const id=res.data.state.maps.at(-1).id;
 res=await f.action('mapWallsImport',{id,walls:r.walls});assert.equal(res.status,200,JSON.stringify(res.data));const m=res.data.state.maps.find(x=>x.id===id);
 assert.equal((m.walls||[]).length,5);assert.equal(m.walls.filter(w=>w.door).length,2);
 res=await f.action('mapWallsImport',{id,walls:[{x1:-5,y1:0,x2:10,y2:10}]});assert.equal(res.status,400,'coordonnées vérifiées par le serveur');
 res=await f.action('mapWallsImport',{id,walls:r.walls},f.pa);assert.equal(res.status,403);});
