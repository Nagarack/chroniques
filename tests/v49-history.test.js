'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {fixture}=require('./_fixture.js');
const st=async(f,c)=>(await f.call('/api/state',{cookie:c||f.gm})).data.state;
const hist=(s,id)=>(s.characters.find(p=>p.id===id).history||[]);

test('historique automatique par personnage, notes secrètes du MJ jamais envoyées au joueur',async t=>{
 const f=await fixture(t);
 assert.equal((await f.action('xpAward',{ids:[f.a.id,f.b.id],amount:150,reason:'Gobelins du col'})).status,200);
 let s=await st(f);assert.ok(hist(s,f.a.id).some(e=>/Gagne 150 XP \(Gobelins du col\)/.test(e.text)));
 await f.action('itemAdd',{id:f.a.id,values:{name:'Corde de chanvre',quantity:1}},f.pa);
 s=await st(f);const rope=s.characters.find(p=>p.id===f.a.id).inventoryItems.find(i=>i.name==='Corde de chanvre');
 assert.equal((await f.action('itemTransfer',{id:f.a.id,toId:f.b.id,itemId:rope.id,quantity:1},f.pa)).status,200);
 s=await st(f);assert.ok(hist(s,f.a.id).some(e=>e.text==='Donne Corde de chanvre à '+f.b.name+'.'),JSON.stringify(hist(s,f.a.id)));
 assert.ok(hist(s,f.b.id).some(e=>e.text==='Reçoit de '+f.a.name+' : Corde de chanvre.'));
 await f.action('hp',{id:f.b.id,delta:-999});s=await st(f);assert.ok(hist(s,f.b.id).some(e=>/Tombe à 0 point de vie/.test(e.text)));
 // Notes du MJ.
 assert.equal((await f.action('historyNote',{id:f.a.id,text:'A volé la bague du baron.',secret:true})).status,200);
 assert.equal((await f.action('historyNote',{id:f.a.id,text:'Adoubée par la reine.',secret:false})).status,200);
 assert.equal((await f.action('historyNote',{id:f.a.id,text:'x'},f.pa)).status,403,'réservé au MJ');
 assert.equal((await f.action('historyNote',{id:f.a.id,text:'  '})).status,400);
 const mine=await st(f,f.pa);const h=hist(mine,f.a.id);
 assert.ok(h.some(e=>e.text==='Adoubée par la reine.'));assert.ok(!h.some(e=>/bague du baron/.test(e.text)),'note secrète filtrée');
 assert.ok(!JSON.stringify(await st(f,f.pb)).includes('bague du baron'));
 assert.equal((await st(f,f.pb)).characters.find(p=>p.id===f.a.id).history,undefined,'les autres joueurs ne voient pas cet historique');
 const secret=hist(await st(f),f.a.id).find(e=>e.gm);assert.ok(secret.manual);
 assert.equal((await f.action('historyRemove',{id:f.a.id,entryId:secret.id})).status,200);
 assert.ok(!hist(await st(f),f.a.id).some(e=>e.gm));
});

test('coffre du groupe : dépôt, retrait, pièces, réglage « le MJ distribue », historique',async t=>{
 const f=await fixture(t);
 await f.action('itemAdd',{id:f.a.id,values:{name:'Torche',quantity:5}},f.pa);
 let s=await st(f,f.pa);const torch=s.characters.find(p=>p.id===f.a.id).inventoryItems.find(i=>i.name==='Torche');
 assert.equal((await f.action('stashDeposit',{id:f.a.id,itemId:torch.id,quantity:3},f.pa)).status,200);
 assert.equal((await f.action('stashDeposit',{id:f.a.id,itemId:torch.id,quantity:1},f.pb)).status,403,'pas les objets des autres');
 s=await st(f,f.pb);assert.equal(s.partyStash.inventoryItems[0].quantity,3,'visible par tout le groupe');
 const sid=s.partyStash.inventoryItems[0].id;
 assert.equal((await f.action('stashWithdraw',{id:f.b.id,itemId:sid,quantity:2},f.pb)).status,200);
 s=await st(f);assert.equal(s.partyStash.inventoryItems[0].quantity,1);assert.equal(s.characters.find(p=>p.id===f.b.id).inventoryItems.find(i=>i.name==='Torche').quantity,2);
 assert.ok(hist(s,f.a.id).some(e=>e.text==='Dépose dans le coffre du groupe : 3 × Torche.'));
 assert.ok(hist(s,f.b.id).some(e=>e.text==='Prend dans le coffre du groupe : 2 × Torche.'));
 // Empilement : redéposer la même torche ne crée pas une seconde ligne.
 assert.equal((await f.action('stashDeposit',{id:f.a.id,itemId:torch.id,quantity:2},f.pa)).status,200);
 s=await st(f);assert.equal(s.partyStash.inventoryItems.length,1);assert.equal(s.partyStash.inventoryItems[0].quantity,3);
 assert.ok(!s.characters.find(p=>p.id===f.a.id).inventoryItems.some(i=>i.name==='Torche'),'tout déposé');
 // Pièces.
 assert.equal((await f.action('moneySet',{id:f.a.id,coins:{cp:0,sp:0,ep:0,gp:250,pp:0}})).status,200);
 assert.equal((await f.action('stashCoins',{id:f.a.id,amounts:{gp:200},direction:'in'},f.pa)).status,200);
 assert.equal((await f.action('stashCoins',{id:f.a.id,amounts:{gp:999},direction:'out'},f.pa)).status,400);
 s=await st(f);assert.equal(s.partyStash.coins.gp,200);assert.equal(s.characters.find(p=>p.id===f.a.id).coins.gp,50);
 assert.ok(hist(s,f.a.id).some(e=>e.text==='Dépose dans le coffre 200 po.'),JSON.stringify(hist(s,f.a.id).map(e=>e.text)));
 // Le MJ distribue.
 assert.equal((await f.action('stashSettings',{withdraw:'gm'},f.pa)).status,403);
 assert.equal((await f.action('stashSettings',{withdraw:'gm'})).status,200);
 assert.equal((await f.action('stashWithdraw',{id:f.b.id,itemId:sid,quantity:1},f.pb)).status,403);
 assert.equal((await f.action('stashWithdraw',{id:f.b.id,itemId:sid,quantity:1})).status,200,'le MJ peut donner depuis le coffre');
 assert.equal((await f.action('stashAdd',{values:{name:'Coffret en argent',quantity:1}})).status,200);
 s=await st(f);const box=s.partyStash.inventoryItems.find(i=>i.name==='Coffret en argent');
 assert.equal((await f.action('stashRemove',{itemId:box.id})).status,200);
 assert.ok((await st(f,f.pa)).combat.log.some(l=>/coffre du groupe/.test(l.msg)));
});

test('vue du groupe : sauvegardes avec maîtrise de classe et scores passifs',()=>{
 const PT=require('../src/app-party.js');
 const pc={id:'x',name:'Ilda',job:'Magicienne',level:5,hp:20,stats:{hp:28,ac:12,abilities:{str:8,dex:14,con:12,int:18,wis:13,cha:10}},progression:{classId:'wizard',skills:{perception:'trained'}},conditions:[]};
 const r=PT.row(pc);assert.equal(r.saves.int.value,7);assert.ok(r.saves.int.prof);assert.equal(r.saves.str.value,-1);
 assert.equal(r.perception,10+1+3);assert.equal(r.spellDc,8+3+4);assert.equal(r.investigation,14);
 const html=PT.partyView({state:{characters:[pc]},h:{esc:String,attr:String}});assert.match(html,/party-table/);assert.match(html,/data-party-history="x"/);
});

test('repères de carte reliés aux lieux du carnet : lien MJ, lien joueur seulement si la fiche est publiée',async t=>{
 const f=await fixture(t);
 await f.action('plannerAdd',{section:'places',values:{title:'Tour du guet',summary:'',privateNotes:'',context:'',visibility:'private'}});
 let s=await st(f);const place=s.campaignPlanner.places[0];
 await f.action('mapAdd',{values:{title:'Vallée',visibility:'shared'}});s=await st(f);const map=s.maps[0];
 assert.equal((await f.action('mapMarkerAdd',{id:map.id,values:{title:'Tour',visibility:'shared',x:100,y:200,linkKind:'place',linkId:place.id}})).status,200);
 assert.equal((await f.action('mapMarkerAdd',{id:map.id,values:{title:'X',visibility:'shared',x:1,y:2,linkKind:'place',linkId:'cp-inexistant'}})).status,400);
 s=await st(f);assert.deepEqual(s.maps[0].markers[0].linked,{kind:'place',id:place.id,characterId:''});
 let ps=await st(f,f.pa);assert.equal(ps.maps[0].markers[0].plannerLink,undefined,'fiche privée : aucun lien');
 await f.action('plannerUpdate',{section:'places',id:place.id,values:{title:'Tour du guet',summary:'',privateNotes:'',context:'',visibility:'shared'}});
 ps=await st(f,f.pa);assert.deepEqual(ps.maps[0].markers[0].plannerLink,{kind:'place',id:place.id,title:'Tour du guet'});
});
