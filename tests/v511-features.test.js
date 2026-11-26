'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const http=require('node:http');
const WT=require('../src/world-time.js');const J=require('../src/jumps.js');

test('lunes : phases, pleines lunes franchies, réglage et changement de calendrier',()=>{const s={};WT.get(s);
 assert.deepEqual(WT.moons(s.worldTime),[],'aucune lune par défaut');
 WT.setMoons(s,[{name:'Séluné',cycle:30,next:0},{name:'',cycle:5},{name:'Ombre',cycle:8,next:4}]);assert.equal(s.worldTime.moons.length,2,'ligne sans nom ignorée');
 let m=WT.moons(s.worldTime);assert.equal(m[0].id,'pleine');assert.equal(m[0].full,true);assert.equal(m[1].id,'nouvelle','pleine dans 4 jours sur 8 : nouvelle lune');
 const r=WT.advance(s,WT.DAY*65);assert.deepEqual(r.fullMoons.find(x=>x.name==='Séluné'),{name:'Séluné',count:2});
 m=WT.moons(s.worldTime);assert.equal(m[0].id,'gibbeuse_decroissante');assert.equal(m[0].untilFull,WT.DAY*25);
 assert.deepEqual(WT.advance(s,60).fullMoons,[]);
 assert.throws(()=>WT.setMoons(s,[{name:'A',cycle:0.5}]),/cycle/);assert.throws(()=>WT.setMoons(s,[{name:'A',cycle:10,next:11}]),/prochaine/);
 assert.throws(()=>WT.setMoons(s,[1,2,3,4].map(i=>({name:'L'+i,cycle:10}))),/Trois/);
 // Changer de calendrier garde la phase actuelle.
 const before=WT.moons(s.worldTime)[0].id;WT.setCalendar(s,{preset:'simple'});assert.equal(WT.moons(s.worldTime)[0].id,before);
 assert.equal(WT.projected(s).moons.length,2);WT.setMoons(s,[]);assert.equal(s.worldTime.moons,undefined);});

test('sauts et chute : règles SRD',()=>{const j=J.jump(15);assert.equal(j.longFt,15);assert.equal(j.standingLongFt,7.5);assert.equal(j.highFt,5);assert.equal(j.longM,4.5);
 assert.equal(J.jump(4).highFt,0,'jamais négatif');assert.equal(J.jump(16,{spell:true}).longFt,48,'sort Saut : × 3');
 assert.equal(J.fall(2.9).dice,0);assert.equal(J.fall(3).dice,1);assert.equal(J.fall(9).dice,3);assert.equal(J.fall(30,{unit:'ft'}).dice,3);
 const big=J.fall(500);assert.equal(big.dice,20);assert.equal(big.max,120);assert.equal(big.capped,true);});

function listen(base,cookie,events){return new Promise((ok,ko)=>{const req=http.get(base+'/api/events',{headers:{Cookie:cookie}},res=>{res.setEncoding('utf8');let buf='';
 res.on('data',d=>{buf+=d;let i;while((i=buf.indexOf('\n\n'))>=0){const chunk=buf.slice(0,i);buf=buf.slice(i+2);const ev=/^event: (\w+)/m.exec(chunk)?.[1],data=/^data: (.*)$/m.exec(chunk)?.[1];if(ev)events.push({ev,data:data?JSON.parse(data):null});}});ok(req);});req.on('error',ko);});}
const wait=ms=>new Promise(r=>setTimeout(r,ms));

test('5.11 : lunes par le serveur et signal sur la carte',async t=>{const f=await require('./_fixture.js').fixture(t);
 let r=await f.action('worldMoons',{moons:[{name:'Séluné',cycle:30,next:1}]});assert.equal(r.status,400,'calendrier désactivé');
 await f.action('worldTimeEnable',{});r=await f.action('worldMoons',{moons:[{name:'Séluné',cycle:30,next:1}]});assert.equal(r.status,200,JSON.stringify(r.data));
 assert.equal((await f.action('worldMoons',{moons:[]},f.pa)).status,403);
 await f.action('worldTimeAdvance',{minutes:WT.DAY*2});const ps=(await f.call('/api/state',{cookie:f.pa})).data.state;assert.equal(ps.worldTime.moons[0].name,'Séluné');
 assert.ok(ps.combat.log.some(l=>/Pleine lune : Séluné/.test(l.msg)),'annoncée dans le journal');
 // Signal : carte partagée visible de tous, carte privée seulement chez le MJ.
 await f.action('mapAdd',{values:{title:'Forêt',summary:'',visibility:'shared'}});await f.action('mapAdd',{values:{title:'Secret',summary:'',visibility:'private'}});
 const maps=(await f.call('/api/state',{cookie:f.gm})).data.state.maps;const shared=maps.find(m=>m.title==='Forêt').id,priv=maps.find(m=>m.title==='Secret').id;
 const gmEv=[],pbEv=[];const q1=await listen(f.base,f.gm,gmEv),q2=await listen(f.base,f.pb,pbEv);t.after(()=>{q1.destroy();q2.destroy();});await wait(100);
 r=await f.call('/api/map-ping',{method:'POST',cookie:f.pa,body:{mapId:shared,x:250,y:700}});assert.equal(r.status,200,JSON.stringify(r.data));
 r=await f.call('/api/map-ping',{method:'POST',cookie:f.pa,body:{mapId:shared,x:260,y:700}});assert.equal(r.status,429,'un signal à la fois');
 r=await f.call('/api/map-ping',{method:'POST',cookie:f.pa,body:{mapId:priv,x:1,y:1}});assert.equal(r.status,400,'carte privée : refusée au joueur');
 r=await f.call('/api/map-ping',{method:'POST',cookie:f.gm,body:{mapId:shared,x:2000,y:1}});assert.equal(r.status,400,'position hors carte');
 r=await f.call('/api/map-ping',{method:'POST',cookie:f.gm,body:{mapId:priv,x:500,y:500}});assert.equal(r.status,200);await wait(150);
 const pg=gmEv.filter(e=>e.ev==='ping'),pp=pbEv.filter(e=>e.ev==='ping');assert.equal(pg.length,2);assert.equal(pp.length,1,'le joueur ne voit pas le signal de la carte privée');
 assert.deepEqual({mapId:pp[0].data.mapId,x:pp[0].data.x,y:pp[0].data.y,name:pp[0].data.name,by:pp[0].data.by},{mapId:shared,x:250,y:700,name:f.a.name,by:'player'});
 assert.equal(pg[1].data.name,'MJ');const st=(await f.call('/api/state',{cookie:f.gm})).data.state;assert.ok(!JSON.stringify(st).includes('"ping'),'rien n’est enregistré');});

test('5.11 : gestion des comptes par l’administrateur',async t=>{const f=await require('./_fixture.js').fixture(t);
 let o=(await f.call('/api/admin/overview',{cookie:f.gm})).data;const ana=o.users.find(u=>u.name==='Joueuse Une'),admin=o.users.find(u=>u.admin);assert.ok(ana.id);assert.equal(ana.suspended,false);
 let r=await f.call('/api/admin/account',{method:'POST',cookie:f.pa,body:{op:'logout',userId:ana.id}});assert.equal(r.status,403,'joueur : refusé');
 r=await f.call('/api/admin/account',{method:'POST',cookie:f.gm,body:{op:'reset',userId:admin.id}});assert.equal(r.status,400,'pas pour soi');
 r=await f.call('/api/admin/account',{method:'POST',cookie:f.gm,body:{op:'reset',userId:ana.id}});assert.equal(r.status,200);assert.ok(r.data.code);const code=r.data.code;
 r=await f.call('/api/admin/account',{method:'POST',cookie:f.gm,body:{op:'logout',userId:ana.id}});assert.equal(r.data.closed,1);assert.equal((await f.call('/api/state',{cookie:f.pa})).status,401,'connexion fermée');
 r=await f.call('/api/login',{method:'POST',body:{name:'Joueur Deux',password:'LongPassword-2026'}});assert.equal(r.status,200);
 r=await f.call('/api/admin/account',{method:'POST',cookie:f.gm,body:{op:'suspend',userId:admin.id}});assert.equal(r.status,400,'l’administrateur ne se suspend pas');
 r=await f.call('/api/admin/account',{method:'POST',cookie:f.gm,body:{op:'suspend',userId:o.users.find(u=>u.name==='Joueur Deux').id}});assert.equal(r.status,200);assert.ok(r.data.closed>=1);
 assert.equal((await f.call('/api/state',{cookie:f.pb})).status,401);r=await f.call('/api/login',{method:'POST',body:{name:'Joueur Deux',password:'LongPassword-2026'}});assert.equal(r.status,403);assert.match(r.data.error||JSON.stringify(r.data),/suspendu/);
 o=(await f.call('/api/admin/overview',{cookie:f.gm})).data;assert.equal(o.users.find(u=>u.name==='Joueur Deux').suspended,true);
 r=await f.call('/api/admin/account',{method:'POST',cookie:f.gm,body:{op:'restore',userId:o.users.find(u=>u.name==='Joueur Deux').id}});assert.equal(r.status,200);
 r=await f.call('/api/login',{method:'POST',body:{name:'Joueur Deux',password:'LongPassword-2026'}});assert.equal(r.status,200,'réactivé');
 // Le lien de nouveau mot de passe créé par l’administrateur fonctionne.
 r=await f.call('/api/password-reset/use',{method:'POST',body:{code,newPassword:'Nouveau-Secret-2026'}});assert.equal(r.status,200);
 r=await f.call('/api/login',{method:'POST',body:{name:'Joueuse Une',password:'Nouveau-Secret-2026'}});assert.equal(r.status,200);
 r=await f.call('/api/admin/account',{method:'POST',cookie:f.gm,body:{op:'logout',userId:admin.id}});assert.equal(r.status,200);assert.equal((await f.call('/api/state',{cookie:f.gm})).status,200,'sa propre connexion reste ouverte');});
