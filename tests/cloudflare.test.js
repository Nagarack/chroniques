'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const http=require('node:http');
const {createServer}=require('../server');
const {validateRemoteOrigin,getRemoteOrigin}=require('../src/network-config');
const ORIGIN='https://chroniques.example.fr';
function request(port,route,{method='GET',body,headers={}}={}){
 return new Promise((resolve,reject)=>{
  const h={...headers};
  const req=http.request({hostname:'127.0.0.1',port,path:route,method,headers:h},res=>{
   let txt='';res.on('data',x=>txt+=x);res.on('end',()=>{let parsed;try{parsed=JSON.parse(txt);}catch{parsed=txt;}
    resolve({status:res.statusCode,body:parsed,headers:res.headers});});});
  req.on('error',reject);
  if(body!==undefined){req.setHeader('Content-Type','application/json');req.end(JSON.stringify(body));}else req.end();
 });
}
async function start(t,options){const app=createServer(options);await new Promise(ok=>app.server.listen(0,'127.0.0.1',ok));t.after(()=>app.close());return {app,port:app.server.address().port};}

test('l’URL publique exige un domaine HTTPS stable et exclut Tailscale et les tunnels éphémères',()=>{
 assert.equal(validateRemoteOrigin(ORIGIN),ORIGIN);
 assert.equal(validateRemoteOrigin('https://jdr.exemple.fr/'),'https://jdr.exemple.fr');
 assert.equal(validateRemoteOrigin(null),null);
 for(const bad of ['http://chroniques.example.fr','https://foo.ts.net','https://my.tail.ts.net','https://foo.trycloudflare.com','https://localhost','https://127.0.0.1','https://chroniques.example.fr:456','https://chroniques.example.fr/path','https://chroniques.example.fr/#x','https://a@chroniques.example.fr','https://chroniques.example.fr?x=1',' https://chroniques.example.fr','https://a..fr','https://-bad.example.fr']){
  assert.throws(()=>validateRemoteOrigin(bad),undefined,bad);
 }
});
test('le domaine HTTPS ne peut pas être activé par fichier Tailscale périmé',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-config-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 fs.mkdirSync(path.join(dir,'config'));fs.writeFileSync(path.join(dir,'config','tailnet-origin.txt'),'https://old-name.ts.net');
 assert.equal(getRemoteOrigin({},dir),null);
 fs.writeFileSync(path.join(dir,'config','remote-origin.txt'),ORIGIN+'\n');
 assert.equal(getRemoteOrigin({},dir),ORIGIN);
});
test('un nouveau MJ doit être créé en local avant publication HTTPS',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-newremote-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const {port}=await start(t,{dataFile:path.join(dir,'db.json'),publicOrigin:ORIGIN,setupKey:'test-token'});
 const headers={Host:'chroniques.example.fr',Origin:ORIGIN};
 const r=await request(port,'/api/setup',{method:'POST',headers,body:{name:'Nouvelle MJ',password:'a-very-long-pass123',setupKey:'test-token'}});
 assert.equal(r.status,403);assert.match(r.body.error,/mode local/);
});
test('Cloudflare : conserve les comptes, accepte la bonne origine et cookie Secure, refuse les hôtes adverses',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-cloudflare-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const dataFile=path.join(dir,'db.json'),setupKey='preconfigured-setup-test-key';
 {const local=await start(t,{dataFile,setupKey,publicOrigin:null});
  let r=await request(local.port,'/api/setup',{method:'POST',headers:{Host:`127.0.0.1:${local.port}`},body:{name:'MJ Equipe',password:'test-password-2026',setupKey}});
  assert.equal(r.status,200);
  await local.app.close();
 }
 const remote=await start(t,{dataFile,publicOrigin:ORIGIN});
 const port=remote.port,host='chroniques.example.fr';
 let r=await request(port,'/api/status',{headers:{Host:host}});
 assert.equal(r.status,200);assert.equal(r.body.networkMode,'public');assert.equal(r.body.remoteUrl,ORIGIN);assert.equal(r.body.version,require('../package.json').version);
 assert.equal(r.headers['strict-transport-security'],'max-age=31536000');
 r=await request(port,'/api/status',{headers:{Host:'attacker.example.com'}});assert.equal(r.status,403);
 r=await request(port,'/api/login',{method:'POST',headers:{Host:host,Origin:'https://attacker.example.com'},body:{name:'MJ Equipe',password:'test-password-2026'}});
 assert.equal(r.status,403);
 r=await request(port,'/api/login',{method:'POST',headers:{Host:host,Origin:ORIGIN,'Sec-Fetch-Site':'cross-site'},body:{name:'MJ Equipe',password:'test-password-2026'}});
 assert.equal(r.status,403);
 r=await request(port,'/api/login',{method:'POST',headers:{Host:host,Origin:ORIGIN,'Sec-Fetch-Site':'same-origin','CF-Connecting-IP':'203.0.113.3'},body:{name:'MJ Equipe',password:'test-password-2026'}});
 assert.equal(r.status,200);assert.match(r.headers['set-cookie'][0],/; Secure/);assert.match(r.headers['set-cookie'][0],/; HttpOnly/);
 const cookie=r.headers['set-cookie'][0].split(';')[0];
 r=await request(port,'/api/state',{headers:{Host:host,Cookie:cookie}});assert.equal(r.status,200);assert.equal(r.body.viewer.role,'gm');
 r=await request(port,'/api/logout',{method:'POST',headers:{Host:host,Origin:ORIGIN,Cookie:cookie}});assert.equal(r.status,200);
 r=await request(port,'/api/state',{headers:{Host:host,Cookie:cookie}});assert.equal(r.status,401);
});
