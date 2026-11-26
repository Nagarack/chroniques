'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const CLK=require('../src/clocks.js');const FB=require('../src/session-feedback.js');const CLU=require('../src/clues.js');const CM=require('../src/campaign-maps.js');

test('horloges : création, avancée, horloge pleine, projection sans note ni horloge secrète',()=>{const s={};
 const c=CLK.add(s,'clock-a',{label:'Le rituel',segments:4,kind:'danger',visible:true,note:'À 4 : le démon'});const h=CLK.add(s,'clock-b',{label:'Secret',segments:6});
 assert.equal(c.filled,0);assert.equal(h.visible,false);assert.throws(()=>CLK.add(s,'x',{label:'X',segments:5}),/Segments/);assert.throws(()=>CLK.add(s,'x',{label:''}),/obligatoire/);
 assert.equal(CLK.tick(s,'clock-a',3).completed,false);let r=CLK.tick(s,'clock-a',5);assert.equal(r.completed,true);assert.equal(r.clock.filled,4);assert.ok(r.clock.doneAt);
 assert.equal(CLK.tick(s,'clock-a',1).completed,false,'déjà pleine');r=CLK.tick(s,'clock-a',-1);assert.equal(r.clock.filled,3);assert.equal(r.clock.doneAt,undefined);
 assert.throws(()=>CLK.tick(s,'clock-a',0),/invalide/);const p=CLK.projected(s);assert.deepEqual(p.map(x=>x.id),['clock-a']);assert.equal(p[0].note,undefined);
 CLK.update(s,'clock-a',{label:'Le rituel',segments:4,visible:true});CLK.update(s,'clock-a',{label:'Court',segments:4});assert.equal(CLK.projected(s).length,0);
 assert.match(CLK.svg({segments:4,filled:1,kind:'danger'}),/clock-on/);for(let i=0;i<10;i++)CLK.add(s,'c'+i,{label:'n'+i});assert.throws(()=>CLK.add(s,'z',{label:'z'}),/Maximum 12/);
 CLK.remove(s,'clock-b');assert.throws(()=>CLK.remove(s,'clock-b'),/introuvable/);});

test('étoiles et souhaits : tour unique, réponse modifiable, anonymat',()=>{const s={};
 assert.throws(()=>FB.send(s,'u1',{star:'x'}),/Aucun retour/);FB.open(s,'fb-1',{anonymous:true});assert.throws(()=>FB.open(s,'fb-2',{}),/déjà ouvert/);
 FB.send(s,'u1',{star:'Le combat du pont',wish:'Plus de PNJ'});FB.send(s,'u2',{star:'Zélie',wish:''});FB.send(s,'u2',{star:'Zélie !',wish:'Une carte'});
 const nameOf=id=>({u1:'Ana',u2:'Bor'})[id];let gm=FB.projected(s,{id:'gm',role:'gm'},nameOf).rounds[0];assert.equal(gm.count,2);assert.ok(gm.entries.every(e=>e.name===undefined),'anonyme : aucun nom');
 const pl=FB.projected(s,{id:'u1',role:'player'},nameOf).rounds[0];assert.equal(pl.mine.star,'Le combat du pont');assert.equal(pl.entries,undefined,'un joueur ne voit pas les autres réponses');
 FB.send(s,'u1',{star:'',wish:''});assert.equal(FB.projected(s,{id:'gm',role:'gm'}).rounds[0].count,1,'réponse vide : retirée');
 FB.close(s);assert.equal(FB.projected(s,{id:'u1',role:'player'}).rounds.length,0,'tour clos : plus montré aux joueurs');
 FB.open(s,'fb-2',{anonymous:false,label:'Séance 12'});FB.send(s,'u2',{star:'Bien'});gm=FB.projected(s,{id:'gm',role:'gm'},nameOf).rounds[0];assert.equal(gm.entries[0].name,'Bor');
 assert.throws(()=>FB.send(s,'u1',{star:'x'.repeat(401)}),/400/);FB.remove(s,'fb-1');assert.equal(FB.get(s).rounds.length,1);});

test('enquête : indices cachés, liens symétriques, théories, projection joueur',()=>{const s={};
 const a=CLU.add(s,'clue-a',{title:'Le sceau brisé',tag:'objet',text:'Cire noire',gmNote:'Vient du temple'});const b=CLU.add(s,'clue-b',{title:'Le prêtre',tag:'personne',revealed:true});const c=CLU.add(s,'clue-c',{title:'Qui a ouvert la crypte ?',tag:'question'});
 assert.equal(CLU.link(s,'clue-a','clue-b'),true);assert.deepEqual(b.links,['clue-a']);CLU.link(s,'clue-b','clue-c');assert.equal(CLU.link(s,'clue-a','clue-b'),false,'second appel : lien retiré');assert.deepEqual(a.links,[]);
 assert.throws(()=>CLU.link(s,'clue-a','clue-a'),/lui-même/);assert.throws(()=>CLU.theory(s,'clue-a','th-1',{id:'u1',name:'Ana'},'Le prêtre ment'),/pas encore révélé/);
 CLU.theory(s,'clue-b','th-1',{id:'u1',name:'Ana'},'Le prêtre ment');let p=CLU.projected(s,'u1');assert.deepEqual(p.map(x=>x.id),['clue-b']);assert.deepEqual(p[0].links,[],'lien vers un indice caché : non montré');
 assert.equal(p[0].theories[0].mine,true);assert.equal(p[0].theories[0].by,undefined);assert.equal(CLU.projected(s,'u2')[0].theories[0].mine,false);
 CLU.reveal(s,'clue-a',true);p=CLU.projected(s,'u1');assert.equal(p.find(x=>x.id==='clue-a').gmNote,undefined,'note du MJ jamais envoyée');
 CLU.remove(s,'clue-c');assert.deepEqual(b.links,[]);CLU.theoryRemove(s,'clue-b','th-1');assert.equal(b.theories.length,0);assert.throws(()=>CLU.add(s,'x',{title:''}),/obligatoire/);});

test('cartes : dessins (trait, flèche, limites, effacement par auteur) et altitude',()=>{const s={maps:[]};CM.add(s,'map-abcdefgh',{title:'Crypte',visibility:'shared'});
 const d=CM.drawAdd(s,'map-abcdefgh','draw-1',{kind:'pen',color:'rouge',pts:[10,10,20,30,40,50]},'pc-1');assert.deepEqual(d.pts,[10,10,20,30,40,50]);
 const ar=CM.drawAdd(s,'map-abcdefgh','draw-2',{kind:'arrow',color:'nope',pts:[0,0,5,5,100,200]},'mj');assert.deepEqual(ar.pts,[0,0,100,200]);assert.equal(ar.color,'or');
 assert.throws(()=>CM.drawAdd(s,'map-abcdefgh','x',{pts:[1,2]},'mj'),/Tracé invalide/);assert.throws(()=>CM.drawAdd(s,'map-abcdefgh','x',{pts:[1,2,3,1001]},'mj'),/Position/);
 const view=CM.projected(s,{role:'player'})[0];assert.equal(view.drawings.length,2);view.drawings[0].pts.push(1);assert.equal(d.pts.length,6,'copie');
 assert.equal(CM.drawClear(s,'map-abcdefgh','pc-1'),1);assert.equal(CM.read(s,'map-abcdefgh').drawings.length,1);assert.equal(CM.drawClear(s,'map-abcdefgh',null),1);
 CM.tokenAdd(s,'map-abcdefgh','tok-aaaaaaa',{kind:'custom',label:'Aigle',x:500,y:500});const t=CM.read(s,'map-abcdefgh').tokens[0];CM.tokenElev(s,'map-abcdefgh',t.id,9);assert.equal(t.elev,9);
 CM.tokenElev(s,'map-abcdefgh',t.id,0);assert.equal(t.elev,undefined);assert.throws(()=>CM.tokenElev(s,'map-abcdefgh',t.id,5000),/Altitude/);});

test('5.8 : serveur (droits, projections, spectateur)',async t=>{const f=await require('./_fixture.js').fixture(t);
 let r=await f.action('clockAdd',{values:{label:'La garde arrive',segments:4,visible:true,note:'secret'}},f.pa);assert.equal(r.status,403);
 r=await f.action('clockAdd',{values:{label:'La garde arrive',segments:4,visible:true,note:'secret'}});assert.equal(r.status,200);await f.action('clockAdd',{values:{label:'Caché',segments:6}});
 let gs=(await f.call('/api/state',{cookie:f.gm})).data.state;const cid=gs.clocks[0].id;for(let i=0;i<4;i++)await f.action('clockTick',{clockId:cid,delta:1});
 let ps=(await f.call('/api/state',{cookie:f.pa})).data.state;assert.equal(ps.clocks.length,1);assert.equal(ps.clocks[0].filled,4);assert.equal(ps.clocks[0].note,undefined);
 assert.ok(JSON.stringify(ps).includes('est pleine'),'horloge visible pleine : annoncée au journal');
 r=await f.action('feedbackSend',{values:{star:'x'}},f.pa);assert.equal(r.status,400);await f.action('feedbackOpen',{values:{anonymous:true}});
 r=await f.action('feedbackSend',{values:{star:'Le pont',wish:'Plus de combats'}},f.pa);assert.equal(r.status,200);await f.action('feedbackSend',{values:{star:'Les PNJ'}},f.pb);
 ps=(await f.call('/api/state',{cookie:f.pb})).data.state;assert.equal(ps.feedback.rounds[0].mine.star,'Les PNJ');assert.equal(ps.feedback.rounds[0].entries,undefined);
 r=await f.action('feedbackClose',{},f.pa);assert.equal(r.status,403);await f.action('feedbackClose',{});gs=(await f.call('/api/state',{cookie:f.gm})).data.state;assert.equal(gs.feedback.rounds[0].entries.length,2);
 assert.ok(!JSON.stringify(gs.feedback).includes(f.a.name),'anonyme : aucun nom chez le MJ');
 await f.action('clueAdd',{values:{title:'Le sceau',tag:'objet',gmNote:'Temple'}});await f.action('clueAdd',{values:{title:'Le prêtre',tag:'personne',revealed:true}});
 gs=(await f.call('/api/state',{cookie:f.gm})).data.state;const [c1,c2]=gs.clues;
 r=await f.action('clueTheory',{clueId:c1.id,text:'Piste'},f.pa);assert.equal(r.status,400,'indice caché');r=await f.action('clueTheory',{clueId:c2.id,text:'Il ment'},f.pa);assert.equal(r.status,200);
 ps=(await f.call('/api/state',{cookie:f.pb})).data.state;assert.deepEqual(ps.clues.map(x=>x.title),['Le prêtre']);const th=ps.clues[0].theories[0];assert.equal(th.name,f.a.name);assert.equal(th.mine,false);
 r=await f.action('clueTheoryRemove',{clueId:c2.id,theoryId:th.id},f.pb);assert.equal(r.status,403);r=await f.action('clueTheoryRemove',{clueId:c2.id,theoryId:th.id},f.pa);assert.equal(r.status,200);
 r=await f.action('clueReveal',{clueId:c1.id,on:true},f.pa);assert.equal(r.status,403);
 await f.action('mapAdd',{values:{title:'Crypte',summary:'',visibility:'shared'}});gs=(await f.call('/api/state',{cookie:f.gm})).data.state;const mid=gs.maps[0].id;
 r=await f.action('mapDrawAdd',{id:mid,values:{kind:'pen',color:'bleu',pts:[1,1,50,50]}},f.pa);assert.equal(r.status,200);await f.action('mapDrawAdd',{id:mid,values:{kind:'arrow',pts:[1,1,50,50]}});
 gs=(await f.call('/api/state',{cookie:f.gm})).data.state;const dr=gs.maps[0].drawings;const mine=dr.find(d=>d.color==='bleu'),gmd=dr.find(d=>d.kind==='arrow');
 r=await f.action('mapDrawRemove',{id:mid,drawId:gmd.id},f.pa);assert.equal(r.status,403);r=await f.action('mapDrawClear',{id:mid,all:true},f.pa);assert.equal(r.status,200);
 gs=(await f.call('/api/state',{cookie:f.gm})).data.state;assert.deepEqual(gs.maps[0].drawings.map(d=>d.id),[gmd.id],'un joueur n’efface que ses propres dessins');assert.ok(mine);
 r=await f.action('mapTokenAdd',{id:mid,values:{kind:'pc',refId:f.a.id,x:500,y:500}});assert.equal(r.status,200,JSON.stringify(r.data));gs=(await f.call('/api/state',{cookie:f.gm})).data.state;const tok=gs.maps[0].tokens.find(x=>x.refId===f.a.id);
 assert.ok(tok);{r=await f.action('mapTokenElev',{id:mid,tokenId:tok.id,elev:9},f.pb);assert.equal(r.status,403);r=await f.action('mapTokenElev',{id:mid,tokenId:tok.id,elev:9},f.pa);assert.equal(r.status,200);}
 r=await f.call('/api/spectator',{method:'POST',cookie:f.gm,body:{op:'create'}});const tokSpec=r.data.token||((r.data.url||'').split('spectateur=')[1]||'');
 assert.ok(tokSpec);{const sp=await f.call('/api/spectate-state?t='+encodeURIComponent(tokSpec),{});assert.equal(sp.status,200);assert.equal(sp.data.state.feedback,undefined);assert.equal(sp.data.state.clues,undefined);assert.equal(sp.data.state.clocks.length,1);}});
