'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const SUG=require('../src/suggestions.js');const B=require('../src/bestiary.js');
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/PvQAAAAASUVORK5CYII=','base64').toString('base64');

test('suggestions : ajout, statuts, réponse, vues auteur et administrateur',()=>{const db={};
 assert.throws(()=>SUG.add(db,'s1',{id:'u1',name:'Ana'},{title:'',text:'Une idée'}),/Titre obligatoire/);assert.throws(()=>SUG.add(db,'s1',{id:'u1',name:'Ana'},{title:'X',text:'abc'}),/5 caractères/);
 const a=SUG.add(db,'s1',{id:'u1',name:'Ana'},{title:'Trier l’inventaire',text:'Par poids et par nom',category:'fiches'},{campaign:'Brumes',version:'5.9.0'});SUG.add(db,'s2',{id:'u2',name:'Bor'},{title:'Mode sombre',text:'Encore plus sombre',category:'inconnue'});
 assert.equal(a.status,'nouvelle');assert.equal(SUG.list(db)[0].id,'s2','plus récente d’abord');assert.equal(SUG.find(db,'s2').category,'autre');
 assert.deepEqual(SUG.forUser(db,'u1').map(x=>x.id),['s1']);assert.equal(SUG.forUser(db,'u1')[0].userId,undefined);
 SUG.setStatus(db,'s1','retenue','Bonne idée, prévue pour la prochaine version.');assert.equal(SUG.forUser(db,'u1')[0].reply,'Bonne idée, prévue pour la prochaine version.');
 assert.throws(()=>SUG.setStatus(db,'s1','peut-etre'),/Statut inconnu/);SUG.setStatus(db,'s2','non_retenue');assert.deepEqual(SUG.counts(db),{total:2,nouvelle:0,retenue:1,faite:0,non_retenue:1});
 SUG.remove(db,'s2');assert.equal(SUG.forAdmin(db).length,1);assert.throws(()=>SUG.remove(db,'s2'),/introuvable/);});

test('5.9 : suggestions par le serveur (joueur, administrateur)',async t=>{const f=await require('./_fixture.js').fixture(t);
 let st=(await f.call('/api/state',{cookie:f.gm})).data;assert.equal(st.viewer.isAdmin,true,'le compte créé à l’installation administre');
 st=(await f.call('/api/state',{cookie:f.pa})).data;assert.equal(st.viewer.isAdmin,false);
 let r=await f.call('/api/suggestion',{method:'POST',cookie:f.pa,body:{title:'Lancer de sorts plus rapide',text:'Un bouton par sort préparé',category:'combat'}});assert.equal(r.status,200);
 await f.call('/api/suggestion',{method:'POST',cookie:f.pb,body:{title:'Thème clair',text:'Plus de contraste le jour'}});
 r=await f.call('/api/suggestions',{cookie:f.pa});assert.equal(r.data.admin,false);assert.equal(r.data.suggestions.length,1,'chacun ne voit que les siennes');
 r=await f.call('/api/suggestions',{cookie:f.gm});assert.equal(r.data.admin,true);assert.equal(r.data.suggestions.length,2);assert.equal(r.data.counts.nouvelle,2);
 const id=r.data.suggestions.find(x=>x.title==='Lancer de sorts plus rapide').id;assert.ok(r.data.suggestions.every(x=>x.userId===undefined));
 assert.equal((await f.call('/api/state',{cookie:f.gm})).data.viewer.newSuggestions,2);
 r=await f.call('/api/suggestion/status',{method:'POST',cookie:f.pa,body:{id,status:'faite'}});assert.equal(r.status,403);
 r=await f.call('/api/suggestion/status',{method:'POST',cookie:f.gm,body:{id,status:'faite',reply:'Fait en 5.9 !'}});assert.equal(r.status,200);assert.equal(r.data.counts.faite,1);
 r=await f.call('/api/suggestions',{cookie:f.pa});assert.equal(r.data.suggestions[0].status,'faite');assert.equal(r.data.suggestions[0].reply,'Fait en 5.9 !');
 r=await f.call('/api/suggestion/delete',{method:'POST',cookie:f.pb,body:{id}});assert.equal(r.status,403);r=await f.call('/api/suggestion/delete',{method:'POST',cookie:f.gm,body:{id}});assert.equal(r.status,200);assert.equal(r.data.counts.total,1);});

test('5.9 : mise en scène (texte, image, accès) et rencontre posée sur une carte',async t=>{const f=await require('./_fixture.js').fixture(t);
 let r=await f.action('sceneAdd',{values:{title:'La crypte',summary:'',gmNotes:'secret',readAloud:'Une odeur de cire froide…',status:'planned',visibility:'private',links:[]}});assert.equal(r.status,200);
 let gs=(await f.call('/api/state',{cookie:f.gm})).data;const sc=gs.state.sessionFlow[0];assert.equal(sc.readAloud,'Une odeur de cire froide…');
 r=await f.call('/api/library/image',{method:'POST',cookie:f.gm,body:{target:'scene',id:sc.id,mime:'image/png',imageBase64:png,baseVersion:gs.version}});assert.equal(r.status,200);
 r=await f.action('sceneUpdate',{id:sc.id,values:{title:'La crypte',summary:'',gmNotes:'secret',readAloud:'Une odeur de cire froide…',status:'planned',visibility:'private',links:[]}});assert.equal(r.status,200);
 gs=(await f.call('/api/state',{cookie:f.gm})).data;assert.ok(gs.state.sessionFlow[0].image,'l’image reste après une modification');
 assert.equal((await f.call('/api/scene-image/'+sc.id,{cookie:f.pa})).status,404,'pas encore en scène : image refusée au joueur');
 r=await f.action('sceneStage',{id:sc.id},f.pa);assert.equal(r.status,403);r=await f.action('sceneStage',{id:sc.id});assert.equal(r.status,200);
 let ps=(await f.call('/api/state',{cookie:f.pa})).data.state;assert.equal(ps.tableScene.title,'La crypte');assert.equal(ps.tableScene.readAloud,'Une odeur de cire froide…');assert.equal(ps.tableScene.hasImage,true);
 assert.ok(!JSON.stringify(ps).includes('secret'),'notes du MJ jamais envoyées');assert.equal((await f.call('/api/scene-image/'+sc.id,{cookie:f.pa})).status,200);
 await f.action('sceneUnstage',{});assert.equal((await f.call('/api/scene-image/'+sc.id,{cookie:f.pa})).status,404);assert.equal((await f.call('/api/scene-image/'+sc.id,{cookie:f.gm})).status,200);
 // Rencontre posée sur une carte : un jeton par créature, en formation, masqué si la créature l’est.
 B.loadFull();r=await f.action('templateAdd',{values:{...B.creatureValues(B.get('loup')),visibility:'hidden'},icon:''});assert.equal(r.status,200,JSON.stringify(r.data));
 const tpl=r.data.state.gmLibrary.templates[0];r=await f.action('encounterAdd',{name:'Meute',notes:''});const enc=r.data.state.gmLibrary.encounters[0];
 await f.action('encounterGroupAdd',{id:enc.id,templateId:tpl.id,quantity:4});await f.action('mapAdd',{values:{title:'Forêt',summary:'',visibility:'shared'}});
 gs=(await f.call('/api/state',{cookie:f.gm})).data;const mid=gs.state.maps[0].id;await f.action('mapGrid',{id:mid,values:{cells:20,scale:'1,5 m'}});
 r=await f.action('encounterDeploy',{id:enc.id,mapId:mid,x:300,y:400});assert.equal(r.status,200,JSON.stringify(r.data));
 const toks=r.data.state.maps[0].tokens;assert.equal(toks.length,4);assert.ok(toks.every(x=>x.kind==='npc'&&x.visible===false));assert.equal(new Set(toks.map(x=>x.x+','+x.y)).size,4,'positions distinctes');
 assert.ok(toks.every(x=>Math.abs(x.x-300)<=50&&Math.abs(x.y-400)<=60),'autour du point touché');
 r=await f.action('encounterDeploy',{id:enc.id,mapId:'map-inconnue'});assert.equal(r.status,400);});
