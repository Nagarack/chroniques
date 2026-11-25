'use strict';
const test=require('node:test');const assert=require('node:assert');
const L=require('../src/logic.js');const I=require('../src/inventory.js');const GEAR=require('../src/gear.js');const CM=require('../src/campaign-maps.js');
const TR=require('../src/travel.js');const WX=require('../src/weather.js');const SHP=require('../src/shapes.js');const N=require('../src/creatures.js');
const IC=require('../src/item-catalog.js');

test('météo : choix, libellés, validation',()=>{const s={};const w=WX.set(s,{sky:'couvert',precip:'orage',temp:'frais',wind:'fort',note:'  Le vent tourne  '});
 assert.strictEqual(w.note,'Le vent tourne');assert.strictEqual(WX.icon(w),'⛈');assert.strictEqual(WX.label(w),'Couvert · Orage · Frais · Vent fort');assert.ok(WX.hints(w).length>=2);
 assert.throws(()=>WX.set(s,{sky:'arc-en-ciel'}),/Ciel inconnu/);assert.throws(()=>WX.set(s,{note:'x'.repeat(141)}),/140/);
 assert.deepStrictEqual(WX.parts(WX.set(s,{})),['Ciel clair','Doux']);WX.set(s,null);assert.strictEqual(s.weather,undefined);});

test('états de santé : seuils et projection joueur',()=>{assert.deepStrictEqual([[20,20],[15,20],[10,20],[5,20],[0,20]].map(([h,m])=>N.health(h,m)),['unhurt','hurt','bloodied','critical','down']);
 const s=L.initialState();N.add(s,'npc-ogre',{name:'Ogre',kind:'monstre',hpMax:40,ac:11,initiative:0,speed:9,visibility:'public',showHp:false,actions:'',notes:''});const n=s.combat.npcs[0];n.hp=18;
 let p=N.project(s).combat.npcs[0];assert.strictEqual(p.health,'bloodied');assert.strictEqual(p.hp,undefined);
 s.healthWords=false;p=N.project(s).combat.npcs[0];assert.strictEqual(p.health,undefined);
 n.showHp=true;delete s.healthWords;p=N.project(s).combat.npcs[0];assert.strictEqual(p.hp,18);assert.strictEqual(p.health,undefined);});

test('formes 2014 : la forme encaisse, le surplus passe, soins de la forme',()=>{const s=L.initialState();const pc=s.characters[0];pc.hp=20;pc.stats.hp=20;pc.tempHp=0;
 const f=SHP.start(pc,{kind:'wild'},{name:'Loup',cr:'1/4',hp:11,ac:13,speed:12,abilities:{str:12,dex:15,con:12},traits:'',actions:'Morsure',id:'loup'},'2014');
 assert.strictEqual(f.hp,11);assert.throws(()=>SHP.start(pc,{kind:'wild',name:'X',hp:3,ac:10},null,'2014'),/Déjà transformé/);
 L.changeHp(s,'mj',pc.id,-4,'');assert.strictEqual(pc.form.hp,7);assert.strictEqual(pc.hp,20);
 L.changeHp(s,'mj',pc.id,3,'');assert.strictEqual(pc.form.hp,10);assert.strictEqual(pc.hp,20);
 L.changeHp(s,'mj',pc.id,-14,'');assert.strictEqual(pc.form,undefined,'retour à la forme normale');assert.strictEqual(pc.hp,16,'surplus de 4');
 assert.ok(s.combat.log.some(e=>/reprend sa forme normale/.test(e.msg)));});

test('formes 2024 : PV temporaires, forme personnalisée, fin',()=>{const s=L.initialState();const pc=s.characters[0];pc.level=5;pc.tempHp=0;
 const f=SHP.start(pc,{kind:'wild'},{name:'Ours brun',cr:'1',hp:34,ac:11,speed:12,abilities:null,traits:'',actions:'',id:'ours-brun'},'2024');
 assert.strictEqual(f.tempHp,5);assert.strictEqual(pc.tempHp,5);assert.strictEqual(f.hpMax,undefined);SHP.end(pc);assert.throws(()=>SHP.end(pc),/Aucune forme/);
 SHP.start(pc,{kind:'poly'},{name:'Tyrannosaure',cr:'8',hp:136,ac:13,speed:15,id:'t'},'2024');assert.strictEqual(pc.tempHp,136);SHP.end(pc);
 assert.throws(()=>SHP.start(pc,{kind:'other',name:'',hp:5,ac:10},null,'2024'),/Nom/);const c=SHP.start(pc,{kind:'other',name:'Brume',hp:8,ac:12,tempHp:0},null,'2024');assert.strictEqual(c.name,'Brume');
 assert.deepStrictEqual(SHP.wildLimit(4,'2014'),{cr:'1/2',note:'pas de vol'});assert.strictEqual(SHP.wildLimit(1,'2014'),null);assert.strictEqual(SHP.wildLimit(9,'2024').cr,'1');});

test('contenants : ranger, capacité, contenu sans poids, sortie',()=>{const pc={inventoryItems:[],stats:{abilities:{str:10}}};
 const bag=I.add(pc,'item-bag',{name:'Sac sans fond',category:'treasure',weight:7.5,capacity:250,holdMagic:true});const box=I.add(pc,'item-box',{name:'Sac à dos',weight:2.25,capacity:15});
 const rope=I.add(pc,'item-rope',{name:'Corde',weight:5,quantity:2});const anvil=I.add(pc,'item-anvil',{name:'Enclume',weight:30});
 assert.strictEqual(GEAR.carried(pc),49.75);I.move(pc,'item-anvil','item-bag');assert.strictEqual(GEAR.carried(pc),19.75,'poids ignoré dans le sac magique');
 assert.throws(()=>I.move(pc,'item-anvil','item-box'),/Plus de place/);I.move(pc,'item-rope','item-box');assert.strictEqual(I.contentWeight(pc,'item-box'),10);assert.strictEqual(GEAR.carried(pc),19.75);
 assert.throws(()=>I.move(pc,'item-box','item-bag'),/contenant ne se range pas/);assert.throws(()=>I.move(pc,'item-bag','item-bag'),/lui-même/);
 I.update(pc,'item-box',{name:'Sac à dos',weight:2.25,capacity:0});assert.strictEqual(rope.in,undefined,'plus un contenant : le contenu sort');
 I.move(pc,'item-anvil','');assert.strictEqual(anvil.in,undefined);assert.throws(()=>I.validate({name:'x',capacity:3000}),/Capacité/);
 const v=IC.toItemValues({id:'mg:bag-of-holding',name:'Sac sans fond',nameEn:'Bag of Holding',category:'treasure',weight:0,short:'',full:''});assert.strictEqual(v.capacity,250);assert.strictEqual(v.holdMagic,true);assert.strictEqual(v.weight,7.5);});

test('lumières : combustible pris dans le sac, jetons éclairés, jour et nuit',()=>{const s={maps:[],characters:[{id:'pc-1',name:'Ana',inventoryItems:[{id:'i1',name:'Torche',quantity:2,weight:0.5}]}],worldTime:{enabled:true,minutes:12*60,months:[{name:'M',days:30}],events:[]}};
 assert.strictEqual(TR.fuelKind({name:'Flasque d’huile'}),'lanterne');assert.strictEqual(TR.takeFuel(s.characters[0],'torche'),'Torche');assert.strictEqual(s.characters[0].inventoryItems[0].quantity,1);
 assert.strictEqual(TR.takeFuel(s.characters[0],'bougie'),false);
 CM.add(s,'map-abcdefgh',{title:'Crypte',visibility:'shared'});CM.setGrid(s,'map-abcdefgh',{cells:20,scale:'1,5 m'});const m=CM.read(s,'map-abcdefgh');m.aspect=1;CM.setVision(s,'map-abcdefgh',{enabled:true,light:'auto',range:18});
 CM.tokenAdd(s,'map-abcdefgh','tok-aaaaaaa',{kind:'pc',refId:'pc-1',label:'A',x:500,y:500});const t=m.tokens[0];
 assert.strictEqual(CM.effectiveLight(s,m),'lit');s.worldTime.minutes=23*60;assert.strictEqual(CM.effectiveLight(s,m),'dark');assert.strictEqual(CM.projected(s,{role:'gm'})[0].vision.effective,'dark');
 assert.strictEqual(CM.visionReveal(s,'map-abcdefgh',()=>0),0,'nuit sans lumière ni vision dans le noir : rien');
 TR.lightAdd(s,'li-1',{kind:'torche',pcId:'pc-1'},'Ana');CM.syncPcLights(s,TR.bestByPc(s));assert.strictEqual(t.light,'torche');assert.strictEqual(CM.visionReveal(s,'map-abcdefgh',()=>0),1);
 TR.tickLights(s,60);CM.syncPcLights(s,TR.bestByPc(s));assert.strictEqual(t.light,'','la torche s’éteint, le jeton aussi');
 CM.tokenLight(s,'map-abcdefgh',t.id,{light:'lanterne'});TR.lightAdd(s,'li-2',{kind:'bougie',pcId:'pc-1'},'Ana');CM.syncPcLights(s,TR.bestByPc(s));assert.strictEqual(t.light,'lanterne','réglage manuel conservé');});

test('5.6 : serveur (météo, santé, forme, contenant, lumière)',async t=>{const f=await require('./_fixture.js').fixture(t);
 let r=await f.action('weatherSet',{values:{sky:'brouillard'}},f.pa);assert.strictEqual(r.status,403);
 r=await f.action('weatherSet',{values:{sky:'brouillard',temp:'froid'}});assert.strictEqual(r.status,200);
 let st=(await f.call('/api/state',{cookie:f.pa})).data.state;assert.strictEqual(st.weather.sky,'brouillard');
 r=await f.action('healthWords',{on:false},f.pa);assert.strictEqual(r.status,403);
 r=await f.action('formStart',{id:f.a.id,values:{kind:'wild',srd:'loup'}},f.pa);assert.strictEqual(r.status,200,JSON.stringify(r.data));
 r=await f.action('formStart',{id:f.b.id,values:{kind:'wild',srd:'loup'}},f.pa);assert.strictEqual(r.status,403);
 r=await f.action('formStart',{id:f.b.id,values:{kind:'wild',srd:'gobelin'}},f.pb);assert.strictEqual(r.status,400);
 st=(await f.call('/api/state',{cookie:f.pb})).data.state;const other=st.characters.find(p=>p.id===f.a.id);assert.strictEqual(other.form.name,'Loup');
 r=await f.action('formEnd',{id:f.a.id},f.pa);assert.strictEqual(r.status,200);
 r=await f.action('itemAdd',{id:f.a.id,values:{name:'Sac à dos',weight:2,capacity:15}},f.pa);r=await f.action('itemAdd',{id:f.a.id,values:{name:'Torche',weight:0.5,quantity:3}},f.pa);
 st=(await f.call('/api/state',{cookie:f.pa})).data.state;const inv=st.characters.find(p=>p.id===f.a.id).inventoryItems;const bag=inv.find(x=>x.name==='Sac à dos'),torch=inv.find(x=>x.name==='Torche');
 r=await f.action('itemMove',{id:f.a.id,itemId:torch.id,into:bag.id},f.pa);assert.strictEqual(r.status,200);
 r=await f.action('itemTransfer',{id:f.a.id,itemId:bag.id,toId:f.b.id,quantity:1},f.pa);assert.strictEqual(r.status,400);
 r=await f.action('lightAdd',{values:{kind:'torche',pcId:f.b.id,fromBag:true}},f.pa);assert.strictEqual(r.status,403);
 r=await f.action('lightAdd',{values:{kind:'torche',pcId:f.a.id,fromBag:true}},f.pa);assert.strictEqual(r.status,200,JSON.stringify(r.data));
 st=(await f.call('/api/state',{cookie:f.pa})).data.state;assert.strictEqual(st.characters.find(p=>p.id===f.a.id).inventoryItems.find(x=>x.name==='Torche').quantity,2);
 const li=st.travel.lights.find(l=>l.pcId===f.a.id);r=await f.action('lightRemove',{lightId:li.id},f.pb);assert.strictEqual(r.status,403);r=await f.action('lightRemove',{lightId:li.id},f.pa);assert.strictEqual(r.status,200);});
