'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('./_fixture.js');
const st=async(f,c)=>(await f.call('/api/state',{cookie:c||f.gm})).data.state;
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/PvQAAAAASUVORK5CYII=','base64');
const empty={summary:'',privateNotes:'',context:''};

test('modèle de campagne : export de la préparation, import avec nouveaux identifiants et liens conservés',async t=>{
 const f=await fixture(t);
 await f.action('plannerAdd',{section:'npcs',values:{...empty,title:'Odile',privateNotes:'Espionne',visibility:'private'}});
 await f.action('plannerAdd',{section:'quests',values:{...empty,title:'Le col',status:'active',visibility:'shared'}});
 let s=await st(f);const npc=s.campaignPlanner.npcs[0],quest=s.campaignPlanner.quests[0];
 await f.action('questObjectiveAdd',{id:quest.id,values:{text:'Trouver le guide',secret:false}});
 await f.action('templateAdd',{values:{name:'Gobelin des cols',kind:'monstre',hpMax:7,ac:15,initiative:0,speed:9,visibility:'public'}});
 s=await st(f);const tpl=s.gmLibrary.templates[0];assert.ok(tpl,'modèle créé');
 await f.action('encounterAdd',{name:'Embuscade'});s=await st(f);const enc=s.gmLibrary.encounters[0];
 await f.action('encounterGroupAdd',{id:enc.id,templateId:tpl.id,quantity:3});
 await f.action('sceneAdd',{values:{title:'Arrivée au col',summary:'',gmNotes:'Pluie',status:'planned',visibility:'private',links:[{type:'npcs',id:npc.id},{type:'encounters',id:enc.id}]}});
 await f.action('handoutAdd',{values:{title:'Lettre du baron',text:'Venez vite.'}});
 await f.action('mapAdd',{values:{title:'Vallée',summary:'',visibility:'private'}});s=await st(f);const map=s.maps[0];
 assert.equal((await f.call('/api/map/upload',{method:'POST',cookie:f.gm,body:{mapId:map.id,baseVersion:(await f.call('/api/state',{cookie:f.gm})).data.version,mime:'image/png',imageBase64:png.toString('base64')}})).status,200);
 await f.action('mapMarkerAdd',{id:map.id,values:{title:'Repaire',visibility:'private',x:10,y:20,linkKind:'template',linkId:tpl.id}});
 // Export : réservé au MJ, aucun personnage.
 assert.equal((await f.call('/api/campaign-template',{cookie:f.pa})).status,403);
 const r=await fetch(f.base+'/api/campaign-template',{headers:{Cookie:f.gm}});assert.equal(r.status,200);assert.match(r.headers.get('content-disposition'),/modele_/);
 const data=await r.json();assert.equal(data.format,'chroniques-modele-campagne');assert.ok(!JSON.stringify(data).includes(f.a.name),'pas de personnages');
 assert.ok(data.maps[0].image.base64,'image de carte incluse');
 // Import dans la même campagne (les identifiants changent, tout est doublé).
 const imp=async(body,q='')=>fetch(f.base+'/api/campaign-template/import'+q,{method:'POST',headers:{Cookie:f.gm,'Content-Type':'application/json'},body});
 const prev=await (await imp(JSON.stringify(data),'?preview=1')).json();assert.equal(prev.summary.scenes,1);assert.equal(prev.summary.images,1);
 assert.equal((await imp('{"format":"autre"}')).status,400);
 assert.equal((await fetch(f.base+'/api/campaign-template/import',{method:'POST',headers:{Cookie:f.pa,'Content-Type':'application/json'},body:JSON.stringify(data)})).status,403);
 const res=await imp(JSON.stringify(data));const out=await res.json();assert.equal(res.status,200,JSON.stringify(out).slice(0,300));assert.deepEqual(out.imported.skipped,[]);
 s=await st(f);
 assert.equal(s.campaignPlanner.npcs.length,2);assert.equal(s.sessionFlow.length,2);assert.equal(s.gmLibrary.templates.length,2);assert.equal(s.maps.length,2);
 const sc2=s.sessionFlow[1],npc2=s.campaignPlanner.npcs[1],enc2=s.gmLibrary.encounters[1],tpl2=s.gmLibrary.templates[1];
 assert.notEqual(npc2.id,npc.id);assert.deepEqual(sc2.links,[{type:'npcs',id:npc2.id},{type:'encounters',id:enc2.id}],'liens recâblés');
 assert.equal(enc2.groups[0].templateId,tpl2.id);assert.equal(s.campaignPlanner.quests[1].objectives[0].text,'Trouver le guide');
 assert.equal(s.maps[1].markers[0].linked.id,tpl2.id);assert.ok(s.maps[1].hasImage);
 const img=await fetch(f.base+'/api/map-image/'+s.maps[1].id,{headers:{Cookie:f.gm}});assert.deepEqual(Buffer.from(await img.arrayBuffer()),png);
 assert.equal(s.handouts[1].sentAt,null,'documents à envoyer de nouveau');
});
