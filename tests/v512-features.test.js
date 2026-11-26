'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const MA=require('../src/marching.js');const LK=require('../src/campaign-look.js');

test('ordre de marche : rangs, positions, veilles, nettoyage',()=>{const s={characters:[{id:'a',name:'Ana'},{id:'b',name:'Bor'},{id:'c',name:'Cid'}]};
 MA.setRank(s,'a','front');MA.setRank(s,'b','front',0);MA.setRank(s,'c','back');assert.deepEqual(s.marching.ranks.front,['b','a'],'position respectée');
 MA.setRank(s,'b','middle');assert.deepEqual(s.marching.ranks.front,['a']);assert.equal(MA.rankOf(s,'b'),'middle');MA.setRank(s,'b','');assert.equal(MA.rankOf(s,'b'),'');
 assert.throws(()=>MA.setRank(s,'z','front'),/introuvable/);assert.throws(()=>MA.setRank(s,'a','dessus'),/Rang inconnu/);
 let sm=MA.summary(s);assert.deepEqual(sm.ranks.map(r=>r.names),[['Ana'],[],['Cid']]);assert.deepEqual(sm.unplaced,['Bor']);
 MA.setWatches(s,[['a'],['b','c']],8);sm=MA.summary(s);assert.equal(sm.watches.length,2);assert.equal(sm.watches[1].start,240);assert.equal(sm.long,true,'4 h par veille : plus de 2 h');
 MA.setWatches(s,[['a'],['b'],['c'],['a']],8);assert.equal(MA.summary(s).long,false);
 assert.throws(()=>MA.setWatches(s,[[],[],[],[],[]],8),/veilles/);assert.throws(()=>MA.setWatches(s,[['a']],4),/6 à 12/);assert.throws(()=>MA.setWatches(s,[['z']],8),/introuvable/);
 s.characters=s.characters.filter(p=>p.id!=='a');MA.prune(s);assert.deepEqual(s.marching.ranks.front,[]);assert.deepEqual(s.marching.watches[0],[]);
 MA.clear(s);assert.equal(MA.summary(s).any,false);assert.equal(s.marching.watches.length,0);});

test('couleur et emblème : liste fermée',()=>{const s={};assert.equal(LK.of(s).color,'');LK.set(s,{color:'saphir',emblem:'🐉'});assert.equal(LK.of(s).color,'#4f8fd9');assert.equal(LK.of(s).emblem,'🐉');
 assert.throws(()=>LK.set(s,{color:'#ff0000'}),/Couleur/);assert.throws(()=>LK.set(s,{emblem:'<b>'}),/Emblème/);LK.set(s,{});assert.equal(s.look,undefined);});

test('5.12 : serveur (ordre de marche, couleur, sauvegarde et historique de l’administration)',async t=>{const f=await require('./_fixture.js').fixture(t);
 let r=await f.action('marchRank',{pcId:f.a.id,rank:'front'},f.pa);assert.equal(r.status,200,JSON.stringify(r.data));
 r=await f.action('marchRank',{pcId:f.b.id,rank:'front'},f.pa);assert.equal(r.status,403,'pas le personnage d’un autre');
 r=await f.action('marchRank',{pcId:f.b.id,rank:'back'});assert.equal(r.status,200,'le MJ place tout le monde');
 r=await f.action('marchWatches',{watches:[[f.a.id]],nightHours:8},f.pa);assert.equal(r.status,403);r=await f.action('marchWatches',{watches:[[f.a.id],[f.b.id]],nightHours:9});assert.equal(r.status,200);
 let ps=(await f.call('/api/state',{cookie:f.pb})).data.state;assert.deepEqual(ps.marching.ranks.front,[f.a.id]);assert.equal(ps.marching.watches.length,2);assert.equal(ps.marching.nightHours,9);
 r=await f.action('campaignLook',{values:{color:'rubis',emblem:'⚓'}},f.pa);assert.equal(r.status,403);r=await f.action('campaignLook',{values:{color:'rubis',emblem:'⚓'}});assert.equal(r.status,200);
 ps=(await f.call('/api/state',{cookie:f.pa})).data.state;assert.deepEqual(ps.look,{color:'rubis',emblem:'⚓'});
 const camps=(await f.call('/api/campaigns',{cookie:f.pa})).data.campaigns;assert.equal(camps[0].look.color,'#e0605a');assert.equal(camps[0].look.emblem,'⚓');
 r=await f.call('/api/admin/backup',{method:'POST',cookie:f.pa,body:{}});assert.equal(r.status,403);r=await f.call('/api/admin/backup',{method:'POST',cookie:f.gm,body:{}});assert.equal(r.status,200);assert.ok(r.data.file);
 const o=(await f.call('/api/admin/overview',{cookie:f.gm})).data;const ana=o.users.find(u=>u.name==='Joueuse Une');
 await f.call('/api/admin/account',{method:'POST',cookie:f.gm,body:{op:'suspend',userId:ana.id}});await f.call('/api/admin/account',{method:'POST',cookie:f.gm,body:{op:'restore',userId:ana.id}});
 const o2=(await f.call('/api/admin/overview',{cookie:f.gm})).data;assert.deepEqual(o2.adminLog.slice(0,3).map(x=>x.action),['restore','suspend','backup'],'du plus récent au plus ancien');
 assert.equal(o2.adminLog[0].target,'Joueuse Une');assert.ok(o2.backups.recent.length>=1);assert.ok(!JSON.stringify(o2.adminLog).includes(ana.id));});
