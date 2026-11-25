'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {update,rollback,cmp}=require('../scripts/update');
const ROOT=path.join(__dirname,'..');
const hasZip=spawnSync('zip',['-v'],{stdio:'ignore'}).status===0&&spawnSync('unzip',['-v'],{stdio:'ignore'}).status===0;

// Copie de l'application (sans données) avec un numéro de version choisi.
function makeApp(dir,version,{breakServer=false}={}){
 fs.mkdirSync(dir,{recursive:true});
 for(const n of fs.readdirSync(ROOT))if(!['data','config','backups','node_modules','tests'].includes(n)&&!n.startsWith('.git'))fs.cpSync(path.join(ROOT,n),path.join(dir,n),{recursive:true});
 const pkg=JSON.parse(fs.readFileSync(path.join(dir,'package.json'),'utf8'));pkg.version=version;fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify(pkg,null,2));
 if(breakServer)fs.appendFileSync(path.join(dir,'server.js'),'\nthrow new Error("version cassée");\n');
 for(const d of ['data','config'])fs.mkdirSync(path.join(dir,d),{recursive:true});
 return dir;
}
function zipOf(srcDir,zipPath){const r=spawnSync('zip',['-qr',zipPath,path.basename(srcDir)],{cwd:path.dirname(srcDir)});assert.equal(r.status,0);return zipPath;}
function seed(root){
 fs.writeFileSync(path.join(root,'data','chroniques-db.json'),JSON.stringify({format:5,users:[],campaigns:[{id:'c1',ownerId:'u',version:1,members:[],state:{title:'Ma vraie campagne'}}],invites:[]}));
 fs.mkdirSync(path.join(root,'data','media'),{recursive:true});fs.writeFileSync(path.join(root,'data','media','portrait.webp'),'image');
 fs.writeFileSync(path.join(root,'config','remote-origin.txt'),'https://ma-table.example.org');
}
const opts=root=>({root,checkServer:false});

test('Mise à jour : comparaison de versions',()=>{assert.ok(cmp('3.9.0','3.8.0')>0);assert.ok(cmp('3.10.0','3.9.9')>0);assert.equal(cmp('3.8.0','3.8.0'),0);});

test('Mise à jour : installe la nouvelle version, conserve données et réglages, garde une sauvegarde',{skip:!hasZip&&'zip/unzip absents'},async t=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-maj-test-'));t.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));
 const root=makeApp(path.join(tmp,'installe'),'3.8.0');seed(root);
 fs.writeFileSync(path.join(root,'ancien-fichier.txt'),'à supprimer');
 const zip=zipOf(makeApp(path.join(tmp,'neuf','Chroniques_V9.0.0'),'9.0.0'),path.join(tmp,'Chroniques_V9.0.0.zip'));
 const r=await update(zip,opts(root));
 assert.equal(r.from,'3.8.0');assert.equal(r.to,'9.0.0');
 assert.equal(JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version,'9.0.0');
 assert.match(fs.readFileSync(path.join(root,'data','chroniques-db.json'),'utf8'),/Ma vraie campagne/);
 assert.equal(fs.readFileSync(path.join(root,'data','media','portrait.webp'),'utf8'),'image');
 assert.equal(fs.readFileSync(path.join(root,'config','remote-origin.txt'),'utf8'),'https://ma-table.example.org');
 assert.ok(!fs.existsSync(path.join(root,'ancien-fichier.txt')),'les fichiers de l’ancienne version sont retirés');
 assert.ok(fs.existsSync(r.backupFile),'sauvegarde de la base créée avant la mise à jour');
 assert.ok(fs.existsSync(path.join(r.snapshot,'server.js')),'ancienne version conservée');
 // Refus d'une version plus ancienne ou identique, sans rien modifier.
 const older=zipOf(makeApp(path.join(tmp,'vieux','Chroniques_V1.0.0'),'1.0.0'),path.join(tmp,'vieux.zip'));
 await assert.rejects(update(older,opts(root)),/plus ancienne/);
 await assert.rejects(update(zip,opts(root)),/déjà installé/);
 // Retour à la version précédente.
 const back=await rollback(opts(root));assert.equal(back.to,'3.8.0');
 assert.equal(JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version,'3.8.0');
 assert.match(fs.readFileSync(path.join(root,'data','chroniques-db.json'),'utf8'),/Ma vraie campagne/);
});

test('Mise à jour : une version qui ne démarre pas est annulée automatiquement',{skip:!hasZip&&'zip/unzip absents'},async t=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-maj-casse-'));t.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));
 const root=makeApp(path.join(tmp,'installe'),'3.8.0');seed(root);
 const before=fs.readFileSync(path.join(root,'server.js'),'utf8');
 const zip=zipOf(makeApp(path.join(tmp,'neuf','Chroniques_V9.1.0'),'9.1.0',{breakServer:true}),path.join(tmp,'casse.zip'));
 await assert.rejects(update(zip,opts(root)),/remise en place/);
 assert.equal(JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version,'3.8.0');
 assert.equal(fs.readFileSync(path.join(root,'server.js'),'utf8'),before);
 assert.match(fs.readFileSync(path.join(root,'data','chroniques-db.json'),'utf8'),/Ma vraie campagne/);
});

test('Mise à jour : le serveur ouvert bloque la mise à jour ; scripts Windows sûrs',async t=>{
 const net=require('node:net');const srv=net.createServer().listen(0,'127.0.0.1');await new Promise(ok=>srv.on('listening',ok));t.after(()=>srv.close());
 await assert.rejects(update(ROOT,{root:ROOT,port:srv.address().port}),/encore ouvert/);
 for(const f of ['METTRE_A_JOUR.bat','REVENIR_VERSION_PRECEDENTE.bat']){
  const b=fs.readFileSync(path.join(ROOT,f));const s=b.toString('utf8');
  assert.ok(!/(^|[^\r])\n/.test(s),f+' : fins de ligne Windows');
  assert.match(s,/\(\r\n node "%~dp0scripts\\update\.js"[^\r]*\r\n echo\.\r\n pause\r\n exit \/b\r\n\)/,f+' : appel dans un bloc lu en entier (le fichier peut être remplacé)');
  assert.ok(!/(^|\s)(del|rmdir|rd|erase)\s/i.test(s),f+' : aucune suppression dans le script');
 }
});

test('Sauvegarde : rappel pour le MJ propriétaire et sauvegarde à la demande',async t=>{
 const {createServer}=require('../server');
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-bk-'));fs.mkdirSync(path.join(tmp,'data'));
 const app=createServer({publicOrigin:null,dataFile:path.join(tmp,'data','chroniques-db.json'),setupKey:'very-long-bootstrap-secret'});
 await new Promise(ok=>app.server.listen(0,'127.0.0.1',ok));t.after(async()=>{await app.close();fs.rmSync(tmp,{recursive:true,force:true});});
 const base='http://127.0.0.1:'+app.server.address().port;
 const call=async(route,{method='GET',body,cookie=''}={})=>{const headers={};if(body!==undefined)headers['Content-Type']='application/json';if(cookie)headers.Cookie=cookie;const r=await fetch(base+route,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});let d=await r.text();try{d=JSON.parse(d);}catch{}return {status:r.status,data:d,cookie:r.headers.get('set-cookie')?.split(';')[0]||''};};
 const gm=(await call('/api/setup',{method:'POST',body:{name:'Maître Test',password:'Strong-Password-2026',setupKey:'very-long-bootstrap-secret'}})).cookie;
 let st=(await call('/api/state',{cookie:gm})).data;assert.equal(st.viewer.lastBackupDays,null,'aucune sauvegarde encore');
 const r=await call('/api/backup-now',{method:'POST',cookie:gm,body:{}});assert.equal(r.status,200);assert.match(r.data.file,/^backups\/chroniques-backup-.*\.json$/);
 assert.ok(fs.existsSync(path.join(tmp,r.data.file)));
 st=(await call('/api/state',{cookie:gm})).data;assert.equal(st.viewer.lastBackupDays,0);
 const inv=await call('/api/invites',{method:'POST',cookie:gm,body:{characterId:st.state.characters[0].id}});
 const pl=await call('/api/join',{method:'POST',body:{name:'Joueuse Test',password:'LongPassword-2026',code:inv.data.code}});
 assert.equal((await call('/api/backup-now',{method:'POST',cookie:pl.cookie,body:{}})).status,403);
 assert.equal((await call('/api/state',{cookie:pl.cookie})).data.viewer.lastBackupDays,undefined,'les joueurs ne voient pas le rappel');
});

test('Mot de passe oublié : lien du MJ propriétaire, usage unique, anciennes sessions fermées ; script local',async t=>{
 const {createServer}=require('../server');const {createReset}=require('../scripts/reset-password');
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-reset-'));fs.mkdirSync(path.join(tmp,'data'));
 const dataFile=path.join(tmp,'data','chroniques-db.json');
 let app=createServer({publicOrigin:null,dataFile,setupKey:'very-long-bootstrap-secret'});
 await new Promise(ok=>app.server.listen(0,'127.0.0.1',ok));t.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));
 let base='http://127.0.0.1:'+app.server.address().port;
 const call=async(route,{method='GET',body,cookie=''}={})=>{const headers={};if(body!==undefined)headers['Content-Type']='application/json';if(cookie)headers.Cookie=cookie;const r=await fetch(base+route,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});let d=await r.text();try{d=JSON.parse(d);}catch{}return {status:r.status,data:d,cookie:r.headers.get('set-cookie')?.split(';')[0]||''};};
 const gm=(await call('/api/setup',{method:'POST',body:{name:'Maître Test',password:'Strong-Password-2026',setupKey:'very-long-bootstrap-secret'}})).cookie;
 const st=(await call('/api/state',{cookie:gm})).data;
 const inv=await call('/api/invites',{method:'POST',cookie:gm,body:{characterId:st.state.characters[0].id}});
 const pl=await call('/api/join',{method:'POST',body:{name:'Joueuse Oubli',password:'LongPassword-2026',code:inv.data.code}});
 const mg=(await call('/api/management',{cookie:gm})).data;const uid=mg.members[0].userId;
 assert.equal((await call('/api/password-reset/create',{method:'POST',cookie:pl.cookie,body:{userId:uid}})).status,403,'un joueur ne peut pas');
 const r=await call('/api/password-reset/create',{method:'POST',cookie:gm,body:{userId:uid}});assert.equal(r.status,200);assert.equal(r.data.name,'Joueuse Oubli');
 assert.equal((await call('/api/password-reset/use',{method:'POST',body:{code:r.data.code,newPassword:'court'}})).status,400);
 const used=await call('/api/password-reset/use',{method:'POST',body:{code:r.data.code,newPassword:'Nouveau-Secret-2026'}});assert.equal(used.status,200);
 assert.equal((await call('/api/state',{cookie:pl.cookie})).status,401,'l’ancienne session est fermée');
 assert.equal((await call('/api/state',{cookie:used.cookie})).status,200,'connecté avec le nouveau mot de passe');
 assert.notEqual((await call('/api/password-reset/use',{method:'POST',body:{code:r.data.code,newPassword:'Encore-Autre-2026'}})).status,200,'usage unique');
 assert.equal((await call('/api/login',{method:'POST',body:{name:'Joueuse Oubli',password:'LongPassword-2026'}})).status,401);
 assert.equal((await call('/api/login',{method:'POST',body:{name:'Joueuse Oubli',password:'Nouveau-Secret-2026'}})).status,200);
 // Le MJ qui a oublié son propre mot de passe : script local, serveur arrêté.
 await app.close();
 const link=await createReset('Maître Test',{root:tmp,checkServer:false});
 assert.match(link.link,/#reinitialiser=[A-Za-z0-9_-]{15,}$/);
 app=createServer({publicOrigin:null,dataFile,setupKey:'very-long-bootstrap-secret'});await new Promise(ok=>app.server.listen(0,'127.0.0.1',ok));t.after(async()=>{await app.close();});
 base='http://127.0.0.1:'+app.server.address().port;
 assert.equal((await call('/api/password-reset/use',{method:'POST',body:{code:link.link.split('=')[1],newPassword:'Maitre-Nouveau-2026'}})).status,200);
 assert.equal((await call('/api/login',{method:'POST',body:{name:'Maître Test',password:'Maitre-Nouveau-2026'}})).status,200);
 await assert.rejects(createReset('Inconnu',{root:tmp,checkServer:false}),/Aucun compte/);
});

test('Mise à jour depuis l’application : envoi du ZIP par le MJ propriétaire, installation par le lanceur au redémarrage',{skip:!hasZip},async t=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'chr-maj-app-'));t.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));
 const {applyPending,inspectPackage}=require('../scripts/update');
 const next=makeApp(path.join(tmp,'pkg','Chroniques_V99.0.0'),'99.0.0');const zip=zipOf(next,path.join(tmp,'v99.zip'));
 const old=makeApp(path.join(tmp,'pkg2','Chroniques_V0.1.0'),'0.1.0');const zipOld=zipOf(old,path.join(tmp,'v01.zip'));
 assert.equal(inspectPackage(zip).version,'99.0.0');
 // Serveur : seul le propriétaire envoie ; version plus ancienne refusée ; installation impossible sans le lanceur.
 const {createServer}=require('../server');const upd=path.join(tmp,'updates');fs.mkdirSync(path.join(tmp,'data'));
 let restarted=0;const app=createServer({publicOrigin:null,dataFile:path.join(tmp,'data','chroniques-db.json'),setupKey:'very-long-bootstrap-secret',updatesDir:upd,onRestart:()=>{restarted++;}});
 await new Promise(ok=>app.server.listen(0,'127.0.0.1',ok));t.after(()=>app.close());const base='http://127.0.0.1:'+app.server.address().port;
 const gm=(await fetch(base+'/api/setup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Maître Test',password:'Strong-Password-2026',setupKey:'very-long-bootstrap-secret'})})).headers.get('set-cookie').split(';')[0];
 const send=(file,cookie)=>fetch(base+'/api/update/upload',{method:'POST',headers:{'Content-Type':'application/zip',Cookie:cookie,Origin:base},body:fs.readFileSync(file)});
 assert.equal((await send(zipOld,gm)).status,400,'version plus ancienne refusée');
 assert.equal((await send(path.join(ROOT,'package.json'),gm)).status,400,'pas un ZIP');
 const ok=await send(zip,gm);assert.equal(ok.status,200);assert.equal((await ok.json()).pending.version,'99.0.0');
 const st=await (await fetch(base+'/api/update/status',{headers:{Cookie:gm}})).json();assert.equal(st.pending.version,'99.0.0');assert.equal(st.launcher,true);
 const post=(route,body)=>fetch(base+'/api/'+route,{method:'POST',headers:{'Content-Type':'application/json',Cookie:gm,Origin:base},body:JSON.stringify(body)});
 assert.equal((await post('update/apply',{})).status,400,'confirmation requise');
 assert.equal((await post('update/apply',{confirm:true})).status,200);await new Promise(r=>setTimeout(r,900));assert.equal(restarted,1,'redémarrage demandé au lanceur');
 // Lanceur : installation de updates/pending.zip dans l'application, avec résultat lisible par l'application.
 const root=makeApp(path.join(tmp,'install'),'4.0.0');seed(root);fs.mkdirSync(path.join(root,'updates'));fs.copyFileSync(zip,path.join(root,'updates','pending.zip'));
 const r=await applyPending({root});assert.equal(r.ok,true);assert.equal(r.to,'99.0.0');
 assert.equal(JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version,'99.0.0');
 assert.ok(!fs.existsSync(path.join(root,'updates','pending.zip')));assert.ok(fs.existsSync(path.join(root,'updates','installe-99.0.0.zip')));
 assert.equal(JSON.parse(fs.readFileSync(path.join(root,'updates','derniere-mise-a-jour.json'),'utf8')).ok,true);
 assert.match(fs.readFileSync(path.join(root,'data','chroniques-db.json'),'utf8'),/Ma vraie campagne/,'données intactes');
});
