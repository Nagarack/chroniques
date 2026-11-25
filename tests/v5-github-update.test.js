'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');

test('mises à jour depuis GitHub Releases (dépôt privé avec jeton) : fiche et ZIP lus par l’API',async t=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-gh-'));t.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));
 const zip=path.join(tmp,'Chroniques_V9_9_9.zip');fs.writeFileSync(zip,crypto.randomBytes(3000));
 let base='',base2='';const seen=[];
 // Stockage externe (autre origine) : refuse toute requête portant le jeton.
 const store=http.createServer((req,res)=>{seen.push(['stockage',req.headers.authorization]);if(req.headers.authorization){res.writeHead(400);res.end('jeton refusé');return;}res.writeHead(200);res.end(fs.readFileSync(zip));});
 await new Promise(ok=>store.listen(0,'127.0.0.1',ok));t.after(()=>store.close());base2='http://localhost:'+store.address().port;
 const srv=http.createServer((req,res)=>{seen.push([req.url,req.headers.authorization,req.headers.accept]);
  if(req.headers.authorization!=='Bearer jeton'){res.writeHead(404);res.end();return;}
  if(req.url==='/repos/mj/chroniques/releases/latest'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({tag_name:'v9.9.9',assets:[{name:'chroniques-maj.json',url:base+'/assets/1'},{name:'Chroniques_V9_9_9.zip',url:base+'/assets/2'}]}));return;}
  if(req.url==='/assets/1'){res.writeHead(200);res.end(JSON.stringify(manifest));return;}
  if(req.url==='/assets/2'){res.writeHead(302,{Location:base2+'/stockage/zip?signature=abc'});res.end();return;}
  res.writeHead(404);res.end();});
 await new Promise(ok=>srv.listen(0,'127.0.0.1',ok));t.after(()=>srv.close());base='http://127.0.0.1:'+srv.address().port;
 process.env.CHRONIQUES_GITHUB_API=base;delete require.cache[require.resolve('../scripts/remote-update.js')];const RU=require('../scripts/remote-update.js');
 const k=RU.keygen();const manifest=RU.sign(zip,{privatePem:k.privatePem,version:'9.9.9',url:'Chroniques_V9_9_9.zip',notes:'Nouveautés'});
 const cfg={manifest:'github:mj/chroniques',publicKey:k.publicKey,token:'jeton'};
 const m=await RU.fetchManifest(cfg,{allowHttp:true});assert.equal(m.version,'9.9.9');assert.equal(m.downloadUrl,base+'/assets/2');
 const dest=path.join(tmp,'dl.zip');await RU.download(cfg,m,dest,{allowHttp:true});assert.deepEqual(fs.readFileSync(dest),fs.readFileSync(zip));
 assert.ok(seen.some(([u,,a])=>u==='/assets/2'&&a==='application/octet-stream'));
 assert.ok(seen.some(([u,auth])=>u==='stockage'&&!auth),'jeton jamais envoyé au stockage externe');
 await assert.rejects(RU.fetchManifest({...cfg,token:''},{allowHttp:true}),/dépôt privé sans jeton/);
 delete process.env.CHRONIQUES_GITHUB_API;
});

test('jeton GitHub saisi dans l’application : réservé au propriétaire, stocké dans config/, jamais renvoyé',async t=>{
 const {createServer}=require('../server');
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-tok-'));t.after(()=>fs.rmSync(tmp,{recursive:true,force:true}));fs.mkdirSync(path.join(tmp,'data'));
 fs.writeFileSync(path.join(tmp,'update-source.json'),JSON.stringify({manifest:'github:mj/chroniques',publicKey:crypto.randomBytes(32).toString('base64')}));
 const app=createServer({publicOrigin:null,dataFile:path.join(tmp,'data','db.json'),setupKey:'very-long-bootstrap-secret',updateRoot:tmp,updatesDir:path.join(tmp,'updates'),updateCheck:false,pushReminders:false});
 await new Promise(ok=>app.server.listen(0,'127.0.0.1',ok));t.after(()=>app.close());const base='http://127.0.0.1:'+app.server.address().port;
 const r=await fetch(base+'/api/setup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Maître Test',password:'Strong-Password-2026',setupKey:'very-long-bootstrap-secret'})});const gm=r.headers.get('set-cookie').split(';')[0];
 const post=async(route,body)=>{const x=await fetch(base+route,{method:'POST',headers:{Cookie:gm,'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:x.status,data:await x.json()};};
 let st=(await (await fetch(base+'/api/update/status',{headers:{Cookie:gm}})).json());assert.equal(st.remote.github,true);assert.equal(st.remote.hasToken,false);
 assert.equal((await post('/api/update/token',{token:'pas-un-jeton'})).status,400);
 process.env.CHRONIQUES_GITHUB_API='http://127.0.0.1:9';
 const tok='github_pat_'+'A'.repeat(40);const ok=await post('/api/update/token',{token:tok});assert.equal(ok.status,200);assert.equal(ok.data.remote.hasToken,true);assert.ok(!JSON.stringify(ok.data).includes(tok),'jeton jamais renvoyé');
 assert.equal(JSON.parse(fs.readFileSync(path.join(tmp,'config','update-source.json'),'utf8')).token,tok);
 assert.equal((await post('/api/update/token',{token:''})).data.remote.hasToken,false);
 delete process.env.CHRONIQUES_GITHUB_API;
});
