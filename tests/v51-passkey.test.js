'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const crypto=require('node:crypto');
const {fixture}=require('./_fixture.js');
const WA=require('../src/webauthn.js');
// Mini encodeur CBOR (tests) : entiers, octets, textes, tableaux, tables.
function enc(v){const head=(major,n)=>n<24?Buffer.from([major<<5|n]):n<256?Buffer.from([major<<5|24,n]):n<65536?Buffer.from([major<<5|25,n>>8,n&255]):Buffer.concat([Buffer.from([major<<5|26]),(b=>{b.writeUInt32BE(n);return b;})(Buffer.alloc(4))]);
 if(typeof v==='number')return v>=0?head(0,v):head(1,-1-v);if(Buffer.isBuffer(v))return Buffer.concat([head(2,v.length),v]);if(typeof v==='string'){const b=Buffer.from(v);return Buffer.concat([head(3,b.length),b]);}
 if(Array.isArray(v))return Buffer.concat([head(4,v.length),...v.map(enc)]);if(v instanceof Map)return Buffer.concat([head(5,v.size),...[...v].flatMap(([k,x])=>[enc(k),enc(x)])]);throw new Error('type');}
// Authentificateur logiciel de test (P-256).
function device(){const {publicKey,privateKey}=crypto.generateKeyPairSync('ec',{namedCurve:'P-256'});const jwk=publicKey.export({format:'jwk'});const credId=crypto.randomBytes(20);let count=0;
 const authData=(rpId,flags,withKey)=>{const parts=[WA.rpHash(rpId),Buffer.from([flags]),(b=>{b.writeUInt32BE(count);return b;})(Buffer.alloc(4))];
  if(withKey){const cose=new Map([[1,2],[3,-7],[-1,1],[-2,Buffer.from(jwk.x,'base64url')],[-3,Buffer.from(jwk.y,'base64url')]]);parts.push(Buffer.alloc(16),Buffer.from([0,credId.length]),credId,enc(cose));}return Buffer.concat(parts);};
 return {id:credId.toString('base64url'),
  create(opts,origin,flags=0x45){count++;const cd=Buffer.from(JSON.stringify({type:'webauthn.create',challenge:opts.publicKey.challenge,origin}));
   return {id:credId.toString('base64url'),type:'public-key',response:{clientDataJSON:cd.toString('base64url'),attestationObject:enc(new Map([['fmt','none'],['attStmt',new Map()],['authData',authData(opts.publicKey.rp.id,flags,true)]])).toString('base64url')}};},
  get(opts,origin,{flags=0x05,userHandle,counter}={}){count=counter??count+1;const cd=Buffer.from(JSON.stringify({type:'webauthn.get',challenge:opts.publicKey.challenge,origin}));const ad=authData(opts.publicKey.rpId,flags,false);
   const sig=crypto.sign('sha256',Buffer.concat([ad,crypto.createHash('sha256').update(cd).digest()]),{key:privateKey,dsaEncoding:'der'});
   return {id:credId.toString('base64url'),type:'public-key',response:{clientDataJSON:cd.toString('base64url'),authenticatorData:ad.toString('base64url'),signature:sig.toString('base64url'),userHandle}};}};}
test('clés d’accès : création, connexion sans mot de passe, refus des réponses falsifiées',async t=>{
 const f=await fixture(t);const origin=f.base;
 const post=(route,body,cookie='')=>f.call(route,{method:'POST',body,cookie});
 assert.equal((await post('/api/passkey/register/options',{})).status,401,'compte connecté requis');
 const dev=device();
 let o=(await post('/api/passkey/register/options',{},f.gm)).data;assert.equal(o.publicKey.rp.id,'127.0.0.1');assert.equal(o.publicKey.authenticatorSelection.userVerification,'required');
 // Sans vérification de l'utilisateur (flags UP seul) : refus.
 assert.equal((await post('/api/passkey/register',{credential:dev.create(o,origin,0x41)},f.gm)).status,400);
 o=(await post('/api/passkey/register/options',{},f.gm)).data;
 assert.equal((await post('/api/passkey/register',{credential:dev.create(o,'https://pirate.example')},f.gm)).status,400,'mauvaise origine');
 o=(await post('/api/passkey/register/options',{},f.gm)).data;
 const reg=await post('/api/passkey/register',{credential:dev.create(o,origin),name:'Téléphone du MJ'},f.gm);assert.equal(reg.status,200,JSON.stringify(reg.data));
 assert.equal(reg.data.passkeys[0].name,'Téléphone du MJ');assert.equal(reg.data.passkeys[0].jwk,undefined,'clé publique jamais renvoyée');
 const again=await post('/api/passkey/register',{credential:dev.create(o,origin)},f.gm);assert.equal(again.status,403,'défi à usage unique');
 // Connexion.
 let lo=(await post('/api/passkey/login/options',{})).data;
 const good=dev.get(lo,origin);
 const r=await fetch(f.base+'/api/passkey/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({credential:good})});assert.equal(r.status,200);const ck=r.headers.get('set-cookie').split(';')[0];
 assert.equal((await f.call('/api/me',{cookie:ck})).data.name,'Maître Test');
 assert.equal((await post('/api/passkey/login',{credential:good})).status,403,'rejeu refusé');
 lo=(await post('/api/passkey/login/options',{})).data;const bad=dev.get(lo,origin);bad.response.signature=Buffer.alloc(70,1).toString('base64url');assert.equal((await post('/api/passkey/login',{credential:bad})).status,401,'signature falsifiée');
 lo=(await post('/api/passkey/login/options',{})).data;assert.equal((await post('/api/passkey/login',{credential:dev.get(lo,origin,{counter:1})})).status,401,'compteur revenu en arrière');
 lo=(await post('/api/passkey/login/options',{})).data;assert.equal((await post('/api/passkey/login',{credential:device().get(lo,origin)})).status,401,'clé inconnue');
 // Liste et suppression ; aucune donnée de clé dans l'état.
 const list=(await post('/api/passkey/list',{},f.gm)).data;assert.equal(list.passkeys.length,1);assert.equal(list.passkeys[0].here,true);
 assert.equal((await post('/api/passkey/list',{},f.pa)).data.passkeys.length,0,'chacun ses clés');
 assert.equal((await post('/api/passkey/remove',{id:list.passkeys[0].id},f.pa)).status,404);
 assert.equal((await post('/api/passkey/remove',{id:list.passkeys[0].id},f.gm)).status,200);
 lo=(await post('/api/passkey/login/options',{})).data;assert.equal((await post('/api/passkey/login',{credential:dev.get(lo,origin)})).status,401,'clé supprimée');
});
test('CBOR et données d’authentificateur : entrées tronquées refusées proprement',()=>{
 assert.throws(()=>WA.cbor(Buffer.from([0x5a,0xff,0xff,0xff,0xff])),/tronquée/);
 assert.throws(()=>WA.parseAuthData(Buffer.alloc(10)),/trop courtes/);
 assert.throws(()=>WA.coseToJwk(new Map([[1,1]])),/non pris en charge/);
 assert.throws(()=>WA.b64u.dec('pas du base64!'),/invalide/);
});
