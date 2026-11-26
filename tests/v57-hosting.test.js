'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path'),fs=require('node:fs'),os=require('node:os');
const PX=require('../src/proxy.js');const {createServer}=require('../server.js');const {migrate}=require('../scripts/migrate-data.js');
const req=(peer,headers={})=>({socket:{remoteAddress:peer},headers});

test('proxy : mode par défaut, valeurs admises, valeur inconnue refusée',()=>{
 assert.equal(PX.mode('',null),'none');assert.equal(PX.mode(undefined,'https://jeu.exemple.fr'),'cloudflare');assert.equal(PX.mode(' Standard ','https://jeu.exemple.fr'),'standard');
 assert.throws(()=>PX.mode('traefik',null),/inconnu/);});

test('proxy : adresse du visiteur lue seulement depuis la machine elle-même et dans le bon en-tête',()=>{
 const h={'cf-connecting-ip':'198.51.100.7','x-forwarded-for':'203.0.113.66, 192.0.2.10'};
 assert.equal(PX.clientIp(req('127.0.0.1',h),'cloudflare'),'198.51.100.7');
 assert.equal(PX.clientIp(req('::ffff:127.0.0.1',h),'standard'),'192.0.2.10','dernière adresse de X-Forwarded-For');
 assert.equal(PX.clientIp(req('::1',{'x-forwarded-for':'2001:db8::5'}),'standard'),'2001:db8::5');
 assert.equal(PX.clientIp(req('127.0.0.1',h),'none'),'127.0.0.1');
 assert.equal(PX.clientIp(req('203.0.113.200',h),'standard'),'203.0.113.200','connexion directe : en-têtes ignorés');
 assert.equal(PX.clientIp(req('203.0.113.200',h),'cloudflare'),'203.0.113.200');
 assert.equal(PX.clientIp(req('127.0.0.1',{'cf-connecting-ip':'198.51.100.7'}),'standard'),'127.0.0.1','en-tête Cloudflare ignoré derrière Caddy ou nginx');
 assert.equal(PX.clientIp(req('127.0.0.1',{'x-forwarded-for':'<script>'}),'standard'),'127.0.0.1');});

async function server(t,opts){const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-57-'));fs.mkdirSync(path.join(tmp,'data'));
 const app=createServer({publicOrigin:null,dataFile:path.join(tmp,'data','chroniques-db.json'),setupKey:'very-long-bootstrap-secret',pushReminders:false,updateCheck:false,...opts});
 await new Promise(ok=>app.server.listen(0,'127.0.0.1',ok));t.after(async()=>{await app.close();fs.rmSync(tmp,{recursive:true,force:true});});
 const base='http://127.0.0.1:'+app.server.address().port;
 return (headers={})=>fetch(base+'/api/passkey/login/options',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:'{}'}).then(r=>r.status);}

test('limite des essais de connexion : chaque visiteur derrière Caddy ou nginx a sa propre limite',async t=>{
 const hit=await server(t,{proxy:'standard'});let last;
 for(let i=0;i<31;i++)last=await hit({'X-Forwarded-For':'203.0.113.5','CF-Connecting-IP':'198.51.100.'+i});
 assert.equal(last,429,'un visiteur insistant est bloqué, même en changeant l’en-tête Cloudflare');
 assert.equal(await hit({'X-Forwarded-For':'203.0.113.9'}),200,'les autres joueurs ne sont pas bloqués');});

test('limite des essais de connexion : sans proxy déclaré, les en-têtes sont ignorés',async t=>{
 const hit=await server(t,{proxy:'none'});let last;for(let i=0;i<31;i++)last=await hit({'X-Forwarded-For':'203.0.113.'+i});assert.equal(last,429);});

test('transfert des données : copie, refus d’écraser, adresse facultative',()=>{
 const old=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-ancien-'));const neu=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-neuf-'));
 {fs.writeFileSync(path.join(old,'server.js'),'');fs.mkdirSync(path.join(old,'data','media'),{recursive:true});fs.mkdirSync(path.join(old,'config'));
  fs.writeFileSync(path.join(old,'data','chroniques-db.json'),'{"format":5,"users":[],"campaigns":[]}');fs.writeFileSync(path.join(old,'data','chroniques-db.json.sessions'),'{}');
  fs.writeFileSync(path.join(old,'data','media','carte.png'),'x');fs.writeFileSync(path.join(old,'config','remote-origin.txt'),'https://ancien.exemple.fr\n');}
 assert.throws(()=>migrate(path.join(old,'data'),{target:neu}),/server.js introuvable/);
 const list=migrate(old,{target:neu,withOrigin:false});assert.ok(list.includes('data/chroniques-db.json'));assert.ok(list.includes('data/chroniques-db.json.sessions'));
 assert.ok(fs.existsSync(path.join(neu,'data','media','carte.png')));assert.ok(!fs.existsSync(path.join(neu,'config','remote-origin.txt')),'--sans-adresse');
 assert.throws(()=>migrate(old,{target:neu}),/existe déjà/);
 fs.writeFileSync(path.join(old,'data','chroniques-db.json'),'{abîmé');const neu2=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-neuf-'));assert.throws(()=>migrate(old,{target:neu2}),/illisible/);
 for(const d of [old,neu,neu2])fs.rmSync(d,{recursive:true,force:true});});
