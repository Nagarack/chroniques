'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const RU=require('../scripts/remote-update.js');
const {createServer}=require('../server');
const hasZip=spawnSync('zip',['-v'],{stdio:'ignore'}).status===0&&spawnSync('unzip',['-v'],{stdio:'ignore'}).status===0;

test('fiche de version : signature Ed25519 obligatoire, toute modification refusée',()=>{
 const k=RU.keygen();const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-sign-'));const z=path.join(tmp,'a.zip');fs.writeFileSync(z,crypto.randomBytes(5000));
 const m=RU.sign(z,{privatePem:k.privatePem,version:'9.9.9',url:'https://exemple.org/a.zip'});
 assert.equal(RU.verifyManifest(m,k.publicKey).version,'9.9.9');
 assert.throws(()=>RU.verifyManifest({...m,version:'9.9.8'},k.publicKey),/Signature/);
 assert.throws(()=>RU.verifyManifest({...m,sha256:'0'.repeat(64)},k.publicKey),/Signature/);
 assert.throws(()=>RU.verifyManifest(m,RU.keygen().publicKey),/Signature/,'autre éditeur');
 assert.throws(()=>RU.verifyManifest({...m,format:'x'},k.publicKey),/non reconnue/);
 fs.rmSync(tmp,{recursive:true,force:true});
});

test('mise à jour signée : vérification, téléchargement contrôlé, paquet prêt à installer',{skip:!hasZip&&'zip/unzip absents'},async t=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-remote-'));t.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));
 const app=path.join(tmp,'src','Chroniques_V9.9.9');fs.mkdirSync(app,{recursive:true});fs.writeFileSync(path.join(app,'server.js'),'// test\n');fs.writeFileSync(path.join(app,'package.json'),JSON.stringify({name:'chroniques',version:'9.9.9'}));
 const zip=path.join(tmp,'Chroniques_V9.9.9.zip');assert.equal(spawnSync('zip',['-qr',zip,'Chroniques_V9.9.9'],{cwd:path.dirname(app)}).status,0);
 const k=RU.keygen();let served=fs.readFileSync(zip);let auth='';
 const pub=http.createServer((req,res)=>{auth=req.headers.authorization||'';if(req.url==='/maj.json'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(manifest));}else if(req.url==='/v.zip'){res.writeHead(200);res.end(served);}else{res.writeHead(404);res.end();}});
 await new Promise(ok=>pub.listen(0,'127.0.0.1',ok));t.after(()=>pub.close());const base='http://127.0.0.1:'+pub.address().port;
 let manifest=RU.sign(zip,{privatePem:k.privatePem,version:'9.9.9',url:base+'/v.zip',notes:'Corrections'});
 const root=path.join(tmp,'install');fs.mkdirSync(path.join(root,'config'),{recursive:true});
 fs.writeFileSync(path.join(root,'config','update-source.json'),JSON.stringify({manifest:base+'/maj.json',publicKey:k.publicKey,token:'jeton-secret',autoDownload:false}));
 fs.mkdirSync(path.join(tmp,'data'));
 const srv=createServer({publicOrigin:null,dataFile:path.join(tmp,'data','db.json'),setupKey:'very-long-bootstrap-secret',updateRoot:root,updatesDir:path.join(root,'updates'),updateAllowHttp:true,updateCheck:false,pushReminders:false});
 await new Promise(ok=>srv.server.listen(0,'127.0.0.1',ok));t.after(()=>srv.close());const sb='http://127.0.0.1:'+srv.server.address().port;
 const r=await fetch(sb+'/api/setup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Maître Test',password:'Strong-Password-2026',setupKey:'very-long-bootstrap-secret'})});const gm=r.headers.get('set-cookie').split(';')[0];
 const post=async route=>{const x=await fetch(sb+route,{method:'POST',headers:{Cookie:gm,'Content-Type':'application/json'},body:'{}'});return {status:x.status,data:await x.json()};};
 let st=await post('/api/update/check');assert.equal(st.status,200);assert.equal(st.data.remote.error,null,JSON.stringify(st.data.remote));assert.equal(st.data.remote.available.version,'9.9.9');assert.equal(auth,'Bearer jeton-secret','jeton envoyé pour un dépôt privé');
 // Paquet altéré : empreinte différente, rien n'est gardé.
 served=Buffer.from(fs.readFileSync(zip));served[40]^=0xff;
 assert.equal((await post('/api/update/download')).status,400);assert.ok(!fs.existsSync(path.join(root,'updates','pending.zip')));
 served=fs.readFileSync(zip);st=await post('/api/update/download');assert.equal(st.status,200,JSON.stringify(st.data));assert.equal(st.data.pending.version,'9.9.9');assert.equal(st.data.pending.signed,true);
 // Fiche falsifiée : refusée.
 manifest={...manifest,url:base+'/autre.zip'};const bad=await post('/api/update/check');assert.equal(bad.data.remote.available,null);assert.match(bad.data.remote.error,/Signature/);
});

test('réglages : fichier livré + config locale ; le jeton n’est jamais lu dans le fichier livré',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-cfg-'));fs.mkdirSync(path.join(root,'config'));
 assert.equal(RU.readConfig(root),null);
 fs.writeFileSync(path.join(root,'update-source.json'),JSON.stringify({manifest:'https://exemple.org/m.json',publicKey:'AAA',token:'fuite'}));
 let c=RU.readConfig(root);assert.equal(c.manifest,'https://exemple.org/m.json');assert.equal(c.token,'','jeton ignoré hors de config/');assert.equal(c.autoDownload,true);
 fs.writeFileSync(path.join(root,'config','update-source.json'),JSON.stringify({token:'secret',autoDownload:false}));
 c=RU.readConfig(root);assert.equal(c.token,'secret');assert.equal(c.autoDownload,false);assert.equal(c.publicKey,'AAA');
 fs.writeFileSync(path.join(root,'config','update-source.json'),JSON.stringify({enabled:false}));assert.equal(RU.readConfig(root),null);
 fs.rmSync(root,{recursive:true,force:true});
});
