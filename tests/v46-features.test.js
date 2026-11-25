'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {fixture}=require('./_fixture.js');
const WT=require('../src/world-time.js');
const AMB=require('../src/ambience.js');
const st=async(f,cookie)=>(await f.call('/api/state',{cookie})).data.state;

test('chuchotements : fil privé MJ ↔ joueur, invisible des autres joueurs, lu / non lu',async t=>{
 const f=await fixture(t);
 assert.equal((await f.action('whisperSend',{charId:f.a.id,text:'Tu entends un bruit derrière la porte.'})).status,200);
 let mine=(await st(f,f.pa)).whispers;assert.equal(mine.length,1);assert.equal(mine[0].from,'mj');assert.equal(mine[0].read,false);
 assert.deepEqual((await st(f,f.pb)).whispers,[],'l’autre joueur ne voit rien');
 // Un joueur écrit toujours dans son propre fil, même s'il vise un autre personnage.
 assert.equal((await f.action('whisperSend',{charId:f.b.id,text:'Je prends la clé discrètement.'},f.pa)).status,200);
 assert.deepEqual((await st(f,f.pb)).whispers,[]);
 assert.equal((await f.action('whisperRead',{},f.pa)).status,200);
 mine=(await st(f,f.pa)).whispers;assert.equal(mine.find(w=>w.from==='mj').read,true);assert.equal(mine.find(w=>w.from!=='mj').read,false);
 assert.equal((await st(f,f.gm)).whispers.length,2);
 assert.equal((await f.action('whisperSend',{text:''},f.pa)).status,400);
 assert.equal((await f.action('whisperSend',{text:'x'.repeat(601)},f.pa)).status,400);
 assert.equal((await f.action('whisperClear',{charId:f.a.id},f.pa)).status,403);
 assert.equal((await f.action('whisperClear',{charId:f.a.id})).status,200);assert.deepEqual((await st(f,f.pa)).whispers,[]);
});

test('compagnons : fiche du joueur, envoi au combat après le maître, PV gérés par le joueur et reportés',async t=>{
 const f=await fixture(t);
 const values={name:'Hibou',kind:'familier',hpMax:3,ac:11,speed:'1,5 m, vol 18 m',attack:'Serres : 1 dégât tranchant',notes:'Vision dans le noir'};
 assert.equal((await f.action('companionAdd',{id:f.a.id,values},f.pb)).status,403,'pas sur la fiche d’un autre');
 assert.equal((await f.action('companionAdd',{id:f.a.id,values},f.pa)).status,200);
 const cid=(await st(f,f.pa)).characters.find(p=>p.id===f.a.id).companions[0].id;
 assert.equal((await f.action('start',{})).status,200);
 assert.equal((await f.action('companionDeploy',{id:f.a.id,companionId:cid},f.pa)).status,200);
 const gmState=await st(f,f.gm);const npc=gmState.combat.npcs.find(n=>n.companionId===cid);assert.ok(npc);assert.equal(npc.ownerPc,f.a.id);
 const order=gmState.combat.order;assert.equal(order[order.indexOf(f.a.id)+1],npc.id,'joue juste après son maître');
 const seen=(await st(f,f.pb)).combat.npcs.find(n=>n.id===npc.id);assert.ok(seen,'visible de tous');assert.equal(seen.hp,3);
 assert.equal((await f.action('npcHp',{id:npc.id,delta:-2},f.pb)).status,403,'un autre joueur ne touche pas aux PV');
 assert.equal((await f.action('npcHp',{id:npc.id,delta:-2},f.pa)).status,200);
 assert.equal((await st(f,f.pa)).characters.find(p=>p.id===f.a.id).companions[0].hp,1,'PV reportés sur la fiche');
 assert.equal((await f.action('companionHp',{id:f.a.id,companionId:cid,delta:5},f.pa)).status,200);
 assert.equal((await st(f,f.gm)).combat.npcs.find(n=>n.id===npc.id).hp,3,'plafonné au maximum et synchronisé');
 assert.equal((await f.action('companionDeploy',{id:f.a.id,companionId:cid},f.pa)).status,400,'déjà au combat');
 assert.equal((await f.action('companionRecall',{id:f.a.id,companionId:cid},f.pa)).status,200);
 const after=await st(f,f.gm);assert.ok(!after.combat.npcs.some(n=>n.companionId===cid));assert.ok(!after.combat.order.includes(npc.id));
 assert.equal((await f.action('companionRemove',{id:f.a.id,companionId:cid},f.pa)).status,200);
 assert.equal((await f.action('companionAdd',{id:f.a.id,values:{...values,hpMax:0}},f.pa)).status,400);
});

test('objectifs de quête : secrets cachés aux joueurs, conservés à la modification de la quête',async t=>{
 const f=await fixture(t);
 const q={title:'Le puits maudit',summary:'Le village manque d’eau.',privateNotes:'Le prêtre ment.',context:'',visibility:'shared',status:'active',date:''};
 assert.equal((await f.action('plannerAdd',{section:'quests',values:q})).status,200);
 const qid=(await st(f,f.gm)).campaignPlanner.quests[0].id;
 assert.equal((await f.action('questObjectiveAdd',{id:qid,values:{text:'Descendre dans le puits'}})).status,200);
 assert.equal((await f.action('questObjectiveAdd',{id:qid,values:{text:'Démasquer le prêtre',secret:true}})).status,200);
 assert.equal((await f.action('questObjectiveAdd',{id:qid,values:{text:'Pirate'}},f.pa)).status,403);
 let pq=(await st(f,f.pa)).campaignPlanner.quests[0];assert.deepEqual(pq.objectives.map(o=>o.text),['Descendre dans le puits']);assert.equal(pq.objectives[0].secret,undefined);
 const [o1,o2]=(await st(f,f.gm)).campaignPlanner.quests[0].objectives;
 assert.equal((await f.action('questObjectiveSet',{id:qid,objectiveId:o1.id,values:{done:true}})).status,200);
 assert.equal((await f.action('plannerUpdate',{section:'quests',id:qid,values:{...q,title:'Le puits maudit (suite)'}})).status,200);
 const gq=(await st(f,f.gm)).campaignPlanner.quests[0];assert.equal(gq.objectives.length,2,'objectifs conservés');assert.equal(gq.objectives[0].done,true);
 assert.equal((await f.action('questObjectiveSet',{id:qid,objectiveId:o2.id,values:{secret:false}})).status,200);
 assert.equal((await st(f,f.pa)).campaignPlanner.quests[0].objectives.length,2,'objectif révélé');
 assert.equal((await f.action('questObjectiveMove',{id:qid,objectiveId:o2.id,dir:-1})).status,200);
 assert.equal((await st(f,f.gm)).campaignPlanner.quests[0].objectives[0].id,o2.id);
 assert.equal((await f.action('questObjectiveRemove',{id:qid,objectiveId:o2.id})).status,200);
});

test('calendrier du monde : activation, avance, repos long, événements secrets ou partagés',async t=>{
 const f=await fixture(t);
 assert.equal((await st(f,f.pa)).worldTime,null,'désactivé par défaut');
 assert.equal((await f.action('worldTimeAdvance',{minutes:60})).status,400);
 assert.equal((await f.action('worldTimeEnable',{on:true},f.pa)).status,403);
 assert.equal((await f.action('worldTimeEnable',{on:true})).status,200);
 assert.equal((await f.action('worldCalendar',{values:{preset:'simple',year:1492,era:'CV'}})).status,200);
 assert.equal((await f.action('worldTimeSet',{values:{year:1492,month:2,day:10,hour:20,minute:0}})).status,200);
 assert.equal((await f.action('worldEventAdd',{values:{title:'Fête des semailles',year:1492,month:2,day:11,hour:9,shared:true}})).status,200);
 assert.equal((await f.action('worldEventAdd',{values:{title:'Les cultistes frappent',year:1492,month:2,day:11,hour:2}})).status,200);
 let pw=(await st(f,f.pa)).worldTime;assert.equal(pw.events.length,1,'événement secret caché');assert.equal(WT.format(pw,pw.minutes),'10 Mois des Semailles 1492 CV, 20 h 00');
 assert.equal((await f.action('restLongAll',{})).status,200);
 const g=await st(f,f.gm);assert.equal(WT.split(g.worldTime,g.worldTime.minutes).hour,4,'8 heures passées');
 assert.ok(g.combat.log.some(l=>/Les cultistes frappent/.test(l.msg)&&l.audience==='gm'));
 assert.ok(!(await st(f,f.pa)).combat.log.some(l=>/cultistes/.test(l.msg)),'annonce secrète réservée au MJ');
 assert.equal((await f.action('worldTimeAdvance',{minutes:360,reason:'voyage'})).status,200);
 assert.ok((await st(f,f.pa)).combat.log.some(l=>/Fête des semailles/.test(l.msg)));
 assert.equal((await f.action('worldTimeAdvance',{minutes:0})).status,400);
 assert.equal((await f.action('worldCalendar',{values:{months:[{name:'Unique',days:0}]}})).status,400);
});

test('ambiance sonore : envoi audio vérifié, lecture par plages, droits joueurs, suppression du fichier',async t=>{
 const f=await fixture(t);
 const ogg=Buffer.concat([Buffer.from('OggS'),Buffer.alloc(4000,1)]);
 const up=(buf,cookie,type='audio/ogg')=>fetch(f.base+'/api/audio/upload?name=Taverne&category=ambiance',{method:'POST',headers:{'Content-Type':type,Cookie:cookie,Origin:f.base},body:buf});
 assert.equal((await up(ogg,f.pa)).status,403);
 assert.equal((await up(Buffer.from('<html>pas un son</html>'.padEnd(64,' ')),f.gm)).status,400);
 assert.equal((await up(Buffer.alloc(AMB.MAX_FILE+10,1),f.gm)).status,413);
 const ok=await up(ogg,f.gm);assert.equal(ok.status,200);
 const tr=(await st(f,f.gm)).ambience.tracks[0];assert.equal(tr.name,'Taverne');assert.equal(tr.filename,undefined,'nom de fichier jamais transmis');
 const r=await fetch(f.base+'/api/audio/'+tr.id,{headers:{Cookie:f.gm,Range:'bytes=0-99'}});assert.equal(r.status,206);assert.equal((await r.arrayBuffer()).byteLength,100);assert.equal(r.headers.get('content-type'),'audio/ogg');
 assert.equal((await fetch(f.base+'/api/audio/'+tr.id,{headers:{Cookie:f.pa}})).status,404,'joueurs : seulement si autorisé');
 assert.equal((await f.action('ambiencePlayers',{on:true})).status,200);
 assert.equal((await fetch(f.base+'/api/audio/'+tr.id,{headers:{Cookie:f.pa}})).status,200);
 assert.equal((await f.action('ambiencePlay',{trackId:tr.id,volume:0.5},f.pa)).status,403);
 assert.equal((await f.action('ambiencePlay',{trackId:tr.id,volume:0.5})).status,200);
 const tbl=(await f.call('/api/table-state',{cookie:f.gm})).data.state.ambience;assert.equal(tbl.playing.trackId,tr.id);assert.equal(tbl.playing.volume,0.5);
 const files=()=>fs.readdirSync(path.join(f.tmp,'data','media')).filter(x=>x.startsWith('audio-'));assert.equal(files().length,1);
 assert.equal((await f.action('ambienceDelete',{trackId:tr.id})).status,200);
 assert.equal(files().length,0,'fichier supprimé du disque');assert.equal((await st(f,f.gm)).ambience.playing,null);
});

test('personnage : export puis import dans une campagne, champs revalidés',async t=>{
 const f=await fixture(t);const CT=require('../src/character-transfer.js');
 await f.action('companionAdd',{id:f.a.id,values:{name:'Loup',kind:'compagnon',hpMax:11,ac:13}},f.pa);
 await f.action('addSpell',{id:f.a.id,spellId:'hunters-mark',prepared:true},f.pa);
 const pc=(await st(f,f.pa)).characters.find(p=>p.id===f.a.id);
 const data=CT.exportCharacter(pc,'Ancienne campagne','2024');assert.equal(data.format,'chroniques-personnage');
 const json=JSON.stringify(data);assert.ok(!/owner|password|media/.test(json));
 assert.equal((await f.action('importPc',{data},f.pa)).status,403);
 assert.equal((await f.action('importPc',{data:{format:'autre'}})).status,400);
 const tampered=JSON.parse(json);tampered.character.inventory.push({name:'<script>',category:'nimporte'});tampered.character.level=99;
 assert.equal((await f.action('importPc',{data:tampered})).status,400,'niveau hors limites refusé');
 tampered.character.level=pc.level;assert.equal((await f.action('importPc',{data:tampered})).status,200);
 const s=await st(f,f.gm);const copy=s.characters[s.characters.length-1];
 assert.equal(copy.name,pc.name);assert.notEqual(copy.id,pc.id);assert.equal(copy.companions[0].name,'Loup');
 assert.ok(copy.grimoire.some(e=>e.spellId==='hunters-mark'));assert.equal((copy.inventoryItems||[]).length,(pc.inventoryItems||[]).length,'objet invalide ignoré');
 assert.ok(s.combat.log.some(l=>/Personnage importé/.test(l.msg)&&/ignoré/.test(l.msg)));
});

test('sauvegardes : liste, test de restauration, restauration avec sauvegarde de sécurité, dossier miroir',async t=>{
 const f=await fixture(t);
 assert.equal((await f.call('/api/backups',{cookie:f.pa})).status,403);
 await f.action('worldTimeEnable',{on:true});
 const b1=await f.call('/api/backup-now',{method:'POST',cookie:f.gm,body:{}});assert.equal(b1.status,200);
 await f.action('plannerAdd',{section:'places',values:{title:'Lieu ajouté après',summary:'',privateNotes:'',context:'',visibility:'private',status:'',date:''}});
 const list=(await f.call('/api/backups',{cookie:f.gm})).data.backups;const manual=list.find(b=>b.kind==='manual');assert.ok(manual);
 assert.equal((await f.call('/api/backup-test',{method:'POST',cookie:f.gm,body:{id:'manual/../../etc/passwd'}})).status,400);
 const test1=(await f.call('/api/backup-test',{method:'POST',cookie:f.gm,body:{id:manual.id}})).data;assert.equal(test1.ok,true);assert.equal(test1.campaign.characters.length,(await st(f,f.gm)).characters.length);assert.equal(test1.state,undefined);
 assert.equal((await f.call('/api/backup-restore',{method:'POST',cookie:f.gm,body:{id:manual.id}})).status,400,'confirmation obligatoire');
 assert.equal((await f.call('/api/backup-restore',{method:'POST',cookie:f.pa,body:{id:manual.id,confirm:true}})).status,403);
 const r=await f.call('/api/backup-restore',{method:'POST',cookie:f.gm,body:{id:manual.id,confirm:true}});assert.equal(r.status,200);assert.match(r.data.safety,/backups\/chroniques-backup-/);
 const s=await st(f,f.gm);assert.equal((s.campaignPlanner?.places||[]).length,0,'retour à l’état sauvegardé');assert.ok(s.combat.log[0].msg.includes('restaurée'));
 assert.ok(fs.existsSync(path.join(f.tmp,r.data.safety)),'sauvegarde de sécurité créée');
 assert.equal((await f.call('/api/backup-mirror',{method:'POST',cookie:f.gm,body:{path:'relatif/dossier'}})).status,400);
 const mirror=fs.mkdtempSync(path.join(f.tmp,'miroir-'));
 assert.equal((await f.call('/api/backup-mirror',{method:'POST',cookie:f.gm,body:{path:mirror}})).status,200);
 assert.equal((await f.call('/api/backup-now',{method:'POST',cookie:f.gm,body:{}})).data.mirrored,true);
 assert.ok(fs.readdirSync(mirror).some(x=>/^chroniques-backup-.*\.json$/.test(x)),'copie miroir présente');
 // Les joueurs restent connectés et retrouvent leur personnage après restauration.
 assert.equal((await f.call('/api/state',{cookie:f.pa})).status,200);
});

test('carnet personnel : visible du joueur et du MJ, jamais des autres joueurs ; suit le personnage exporté',async t=>{
 const f=await fixture(t);
 assert.equal((await f.action('pcNotesSave',{id:f.a.id,text:'Je suis la fille cachée du baron.'},f.pb)).status,403);
 assert.equal((await f.action('pcNotesSave',{id:f.a.id,text:'Je suis la fille cachée du baron.'},f.pa)).status,200);
 assert.equal((await st(f,f.pa)).characters.find(p=>p.id===f.a.id).privateNotes,'Je suis la fille cachée du baron.');
 assert.equal((await st(f,f.gm)).characters.find(p=>p.id===f.a.id).privateNotes,'Je suis la fille cachée du baron.');
 assert.equal((await st(f,f.pb)).characters.find(p=>p.id===f.a.id).privateNotes,undefined,'invisible pour l’autre joueur');
 assert.equal((await f.action('pcNotesSave',{id:f.a.id,text:'x'.repeat(6001)},f.pa)).status,400);
 const CT=require('../src/character-transfer.js');const pc=(await st(f,f.pa)).characters.find(p=>p.id===f.a.id);
 assert.equal(CT.exportCharacter(pc,'C','2024').character.privateNotes,'Je suis la fille cachée du baron.');
});
