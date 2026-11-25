'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const os=require('node:os');
const {createServer}=require('../server');

async function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-undo-'));
 const dataFile=path.join(dir,'db.json');
 const app=createServer({publicOrigin:null,dataFile,setupKey:'very-long-bootstrap-secret'});
 await new Promise(ok=>app.server.listen(0,'127.0.0.1',ok));
 const base='http://127.0.0.1:'+app.server.address().port;
 t.after(async()=>{await app.close();fs.rmSync(dir,{recursive:true,force:true});});
 async function call(route,{method='GET',body,cookie=''}={}){
  const headers={};if(body!==undefined)headers['Content-Type']='application/json';if(cookie)headers.Cookie=cookie;
  const res=await fetch(base+route,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
  let data=await res.text();try{data=JSON.parse(data);}catch{}
  return {status:res.status,data,cookie:res.headers.get('set-cookie')?.split(';')[0]||''};
 }
 const setup=await call('/api/setup',{method:'POST',body:{name:'Maître Test',password:'Strong-Password-2026',setupKey:'very-long-bootstrap-secret'}});
 assert.equal(setup.status,200);
 return {call,gm:setup.cookie,dir,dataFile};
}
const act=(f,state,kind,extra={})=>f.call('/api/action',{method:'POST',cookie:f.gm,body:{baseVersion:state.version,kind,...extra}});

test('V3.7.1 : le MJ peut annuler plusieurs actions de combat, dans l’ordre inverse',async t=>{
 const f=await fixture(t);
 let st=(await f.call('/api/state',{cookie:f.gm})).data;
 assert.equal(st.viewer.canUndo,false);
 const id=st.state.characters[0].id,hp0=st.state.characters[0].hp;
 let r=await act(f,st,'hp',{id,delta:-3});assert.equal(r.status,200);
 assert.equal(r.data.state.characters[0].hp,hp0-3);assert.equal(r.data.viewer.canUndo,true);
 r=await act(f,r.data,'hp',{id,delta:-2});assert.equal(r.data.state.characters[0].hp,hp0-5);
 r=await act(f,r.data,'undo');assert.equal(r.status,200);
 assert.equal(r.data.state.characters[0].hp,hp0-3);assert.equal(r.data.viewer.canUndo,true);
 assert.match(r.data.state.combat.log[0].msg,/Action annulée/);
 r=await act(f,r.data,'undo');assert.equal(r.data.state.characters[0].hp,hp0);assert.equal(r.data.viewer.canUndo,false);
 r=await act(f,r.data,'undo');assert.equal(r.status,400);
});

test('V3.7.1 : une action non annulable vide la pile et un joueur ne peut pas annuler',async t=>{
 const f=await fixture(t);
 let st=(await f.call('/api/state',{cookie:f.gm})).data;
 const id=st.state.characters[0].id;
 let r=await act(f,st,'hp',{id,delta:-1});
 r=await act(f,r.data,'campaignTitle',{value:'Nouveau titre'});assert.equal(r.status,200);
 assert.equal(r.data.viewer.canUndo,false);
 r=await act(f,r.data,'undo');assert.equal(r.status,400);
 const inv=await f.call('/api/invites',{method:'POST',cookie:f.gm,body:{characterId:id}});
 const player=await f.call('/api/join',{method:'POST',body:{name:'Joueuse Test',password:'LongPassword-2026',code:inv.data.code}});
 const ps=(await f.call('/api/state',{cookie:player.cookie})).data;
 const denied=await f.call('/api/action',{method:'POST',cookie:player.cookie,body:{baseVersion:ps.version,kind:'undo'}});
 assert.equal(denied.status,403);
});

test('V3.7.1 : une sauvegarde automatique est créée avant l’écriture, limitée à 10 fichiers',async t=>{
 const f=await fixture(t);
 let st=(await f.call('/api/state',{cookie:f.gm})).data;
 await act(f,st,'hp',{id:st.state.characters[0].id,delta:-1});
 const dir=path.join(f.dir,'auto-backups');
 const files=fs.readdirSync(dir).filter(x=>/^db-.*\.json$/.test(x));
 assert.ok(files.length>=1&&files.length<=10);
 assert.doesNotThrow(()=>JSON.parse(fs.readFileSync(path.join(dir,files[0]),'utf8')));
});

test('V3.7.1 : paquet propre, bouton d’annulation et bandeau hors ligne présents',()=>{
 const root=path.join(__dirname,'..');
 const ui=fs.readFileSync(path.join(root,'src/online-app.js'),'utf8'),css=fs.readFileSync(path.join(root,'src/styles.css'),'utf8');
 assert.ok(ui.includes('data-task="undo"')&&ui.includes("case 'undo'"));
 assert.ok(css.includes('body.is-offline::before'));
 assert.ok(!fs.existsSync(path.join(root,'data/chroniques-db.json')),'aucune base ne doit être livrée');
 assert.ok(!fs.existsSync(path.join(root,'config/remote-origin.txt')),'aucune URL privée ne doit être livrée');
 assert.equal(JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).scripts.test,'node --test tests/');
});

test('V3.7.2 : boutons de PV rapides bornés, polices locales, thème scriptorium',()=>{
 const root=path.join(__dirname,'..');
 const ui=fs.readFileSync(path.join(root,'src/online-app.js'),'utf8'),css=fs.readFileSync(path.join(root,'src/styles.css'),'utf8'),srv=fs.readFileSync(path.join(root,'server.js'),'utf8');
 assert.ok(ui.includes('data-task="hp-quick:${d}"')&&ui.includes("task.startsWith('hp-quick:')")&&ui.includes('Math.abs(d)<=10'));
 assert.ok(css.includes('Scriptorium de nuit')&&css.includes('--rubric:'));
 assert.ok(!/https?:\/\/[^)'"\s]*\.(woff2?|ttf)/i.test(css),'aucune police externe');
 for(const f of ['im-fell-english-latin-400-normal','alegreya-sans-latin-400-normal','alegreya-sans-latin-700-normal']){
  assert.ok(fs.existsSync(path.join(root,'assets/fonts',f+'.woff2')),f);assert.ok(srv.includes('/assets/fonts/'+f+'.woff2'),f);
 }
});

test('V3.7.2 : une durée d’état se décompte à la fin du tour de la créature et retire l’état',async t=>{
 const f=await fixture(t);
 let st=(await f.call('/api/state',{cookie:f.gm})).data;
 const [a,b]=st.state.characters.map(c=>c.id);
 let r=await act(f,st,'init',{id:a,value:18});r=await act(f,r.data,'init',{id:b,value:9});
 r=await act(f,r.data,'start');assert.equal(r.status,200);
 r=await act(f,r.data,'condition',{id:a,condition:'Effrayé'});assert.ok(r.data.state.characters.find(c=>c.id===a).conditions.includes('Effrayé'));
 let bad=await act(f,r.data,'conditionTimer',{id:a,condition:'Effrayé',rounds:100});assert.equal(bad.status,400);
 bad=await act(f,r.data,'conditionTimer',{id:a,condition:'Aveuglé',rounds:2});assert.equal(bad.status,400);
 r=await act(f,r.data,'conditionTimer',{id:a,condition:'Effrayé',rounds:1});assert.equal(r.status,200);
 assert.deepEqual(r.data.state.combat.timers,[{id:a,condition:'Effrayé',rounds:1,when:'end',anchor:a}]);
 r=await act(f,r.data,'next');assert.equal(r.status,200);
 const pa=r.data.state.characters.find(c=>c.id===a);
 assert.equal(pa.conditions.includes('Effrayé'),false,'l’état doit être retiré à la fin du tour');
 assert.deepEqual(r.data.state.combat.timers,[]);
 assert.ok(r.data.state.combat.log.some(x=>/Fin de l’état/.test(x.msg)));
 // annulation : l'état et la durée reviennent
 r=await act(f,r.data,'undo');assert.equal(r.status,200);
 assert.ok(r.data.state.characters.find(c=>c.id===a).conditions.includes('Effrayé'));
 assert.equal(r.data.state.combat.timers.length,1);
});

test('V3.7.2 : un joueur ne peut pas régler de durée d’état',async t=>{
 const f=await fixture(t);
 let st=(await f.call('/api/state',{cookie:f.gm})).data;const id=st.state.characters[0].id;
 let r=await act(f,st,'condition',{id,condition:'Effrayé'});
 const inv=await f.call('/api/invites',{method:'POST',cookie:f.gm,body:{characterId:id}});
 const player=await f.call('/api/join',{method:'POST',body:{name:'Joueuse Test',password:'LongPassword-2026',code:inv.data.code}});
 const ps=(await f.call('/api/state',{cookie:player.cookie})).data;
 const denied=await f.call('/api/action',{method:'POST',cookie:player.cookie,body:{baseVersion:ps.version,kind:'conditionTimer',id,condition:'Effrayé',rounds:3}});
 assert.equal(denied.status,403);
});

async function joinPlayer(f,characterId,name){
 const inv=await f.call('/api/invites',{method:'POST',cookie:f.gm,body:{characterId}});
 const p=await f.call('/api/join',{method:'POST',body:{name,password:'LongPassword-2026',code:inv.data.code}});
 assert.equal(p.status,200);return p.cookie;
}
const pact=(f,cookie,state,kind,extra={})=>f.call('/api/action',{method:'POST',cookie,body:{baseVersion:state.version,kind,...extra}});

test('V3.7.3 : notes partagées — les joueurs écrivent et modifient, le MJ lit sans pouvoir modifier',async t=>{
 const f=await fixture(t);
 let gs=(await f.call('/api/state',{cookie:f.gm})).data;
 const [c1,c2]=gs.state.characters.map(c=>c.id);
 const p1=await joinPlayer(f,c1,'Joueuse Une'),p2=await joinPlayer(f,c2,'Joueur Deux');
 let s1=(await f.call('/api/state',{cookie:p1})).data;
 let r=await pact(f,p1,s1,'sharedNoteSave',{noteId:'',title:'Le sceau',body:'Symbole gravé sur la porte nord.'});
 assert.equal(r.status,200);
 const note=r.data.state.sharedNotes[0];assert.equal(note.title,'Le sceau');assert.equal(note.by,r.data.state.characters.find(c=>c.id===c1).name);
 // un autre joueur voit la note et peut la modifier
 let s2=(await f.call('/api/state',{cookie:p2})).data;assert.equal(s2.state.sharedNotes.length,1);
 r=await pact(f,p2,s2,'sharedNoteSave',{noteId:note.id,title:'Le sceau',body:'Symbole gravé… ressemble à une étoile.',baseAt:note.at});
 assert.equal(r.status,200);assert.match(r.data.state.sharedNotes[0].body,/étoile/);
 // le MJ lit la note…
 gs=(await f.call('/api/state',{cookie:f.gm})).data;assert.equal(gs.state.sharedNotes.length,1);
 // …mais ne peut ni créer, ni modifier, ni supprimer
 for(const [kind,extra] of [['sharedNoteSave',{noteId:'',title:'x',body:'y'}],['sharedNoteSave',{noteId:note.id,title:'x',body:'y'}],['sharedNoteDelete',{noteId:note.id}]]){
  const denied=await act(f,gs,kind,extra);assert.equal(denied.status,400);assert.match(denied.data.error||JSON.stringify(denied.data),/lecture seule/);
 }
 gs=(await f.call('/api/state',{cookie:f.gm})).data;assert.equal(gs.state.sharedNotes.length,1);
});

test('V3.7.3 : notes partagées — conflit d’édition détecté, suppression et limites',async t=>{
 const f=await fixture(t);
 let gs=(await f.call('/api/state',{cookie:f.gm})).data;
 const [c1,c2]=gs.state.characters.map(c=>c.id);
 const p1=await joinPlayer(f,c1,'Joueuse Une'),p2=await joinPlayer(f,c2,'Joueur Deux');
 let s1=(await f.call('/api/state',{cookie:p1})).data;
 let r=await pact(f,p1,s1,'sharedNoteSave',{noteId:'',title:'T',body:'v1'});const note=r.data.state.sharedNotes[0];
 let s2=(await f.call('/api/state',{cookie:p2})).data;
 r=await pact(f,p2,s2,'sharedNoteSave',{noteId:note.id,title:'T',body:'v2 de Deux',baseAt:note.at});assert.equal(r.status,200);
 // la joueuse 1 enregistre à partir de l'ancienne version : refus explicite, rien n'est écrasé
 s1=(await f.call('/api/state',{cookie:p1})).data;
 r=await pact(f,p1,s1,'sharedNoteSave',{noteId:note.id,title:'T',body:'v2 écrasée ?',baseAt:note.at});
 assert.equal(r.status,400);assert.match(r.data.error,/modifiée par/);
 assert.equal((await f.call('/api/state',{cookie:p1})).data.state.sharedNotes[0].body,'v2 de Deux');
 // texte tronqué à 4000 caractères, titre vide → « Sans titre »
 s1=(await f.call('/api/state',{cookie:p1})).data;
 r=await pact(f,p1,s1,'sharedNoteSave',{noteId:'',title:'   ',body:'x'.repeat(5000)});
 assert.equal(r.data.state.sharedNotes[0].title,'Sans titre');assert.equal(r.data.state.sharedNotes[0].body.length,4000);
 // suppression par un joueur
 r=await pact(f,p1,r.data,'sharedNoteDelete',{noteId:r.data.state.sharedNotes[0].id});assert.equal(r.status,200);assert.equal(r.data.state.sharedNotes.length,1);
 const gone=await pact(f,p1,r.data,'sharedNoteDelete',{noteId:'note-inexistante'});assert.equal(gone.status,400);
});

test('V3.7.3 : interface — page notes, message d’invitation et navigation',()=>{
 const ui=fs.readFileSync(path.join(__dirname,'../src/online-app.js'),'utf8');
 for(const k of ['function sharedNotesPage()','data-task="copy-invite-message"',"case 'copy-invite-message'","page==='notes'?sharedNotesPage()","navButton('notes'",'Lecture seule : ces notes','function inviteMessage('])assert.ok(ui.includes(k),k);
});

test('V3.7.4 : allègement joueur — bandeau de tour, liste du groupe, icônes, aide à la demande, version unique',()=>{
 const root=path.join(__dirname,'..');
 const ui=fs.readFileSync(path.join(root,'src/online-app.js'),'utf8'),css=fs.readFileSync(path.join(root,'src/styles.css'),'utf8');
 for(const k of ['function turnBanner()','function playerGroup()','function playerHead()','function icon(id,fallback)','data-help-toggle','helpOpen?quickHelpPage()','char-compact','class="live-pill"'])assert.ok(ui.includes(k),k);
 assert.ok(!ui.includes('class="notice"'),'le bandeau de connexion permanent a disparu');
 assert.ok(!/V3\.7[^.\d]/.test(ui.replace(/\/\*.*?\*\//s,'')),'aucune version codée en dur dans l’interface');
 for(const k of ['.turn-banner','.mate-row','.char-compact','.live-pill','body.is-live'])assert.ok(css.includes(k),k);
 const pkg=require('../package.json');assert.match(pkg.version,/^\d+\.\d+\.\d+$/);
 assert.ok(fs.readFileSync(path.join(root,'sw.js'),'utf8').includes('chroniques-public-v'+pkg.version.replace(/\./g,'')));
});
