'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const http=require('node:http'),crypto=require('node:crypto'),path=require('node:path'),fs=require('node:fs'),os=require('node:os');
const WP=require('../src/web-push.js');
const {createServer}=require('../server');

test('Web Push : chiffrement aes128gcm déchiffrable, jeton VAPID ES256 valide',()=>{
 const vapid=WP.createVapid();const ua=crypto.createECDH('prime256v1');ua.generateKeys();const auth=crypto.randomBytes(16);
 const sub={endpoint:'https://fcm.googleapis.com/fcm/send/abc',keys:{p256dh:ua.getPublicKey().toString('base64url'),auth:auth.toString('base64url')}};
 assert.deepEqual(WP.cleanSubscription(sub).keys,sub.keys);
 const body=WP.encrypt(sub,JSON.stringify({title:'Séance demain',body:'Rappel'}));
 assert.equal(body.readUInt32BE(16),4096);assert.equal(body[20],65);
 assert.deepEqual(JSON.parse(WP.decrypt(ua,auth,body)),{title:'Séance demain',body:'Rappel'});
 const jwt=WP.vapidJwt(vapid,'https://fcm.googleapis.com','mailto:mj@example.org');const [h,p,sig]=jwt.split('.');
 const pub=crypto.createPublicKey({key:{kty:'EC',crv:'P-256',x:Buffer.from(vapid.publicKey,'base64url').subarray(1,33).toString('base64url'),y:Buffer.from(vapid.publicKey,'base64url').subarray(33).toString('base64url')},format:'jwk'});
 assert.ok(crypto.verify('sha256',Buffer.from(h+'.'+p),{key:pub,dsaEncoding:'ieee-p1363'},Buffer.from(sig,'base64url')));
 assert.equal(JSON.parse(Buffer.from(p,'base64url')).aud,'https://fcm.googleapis.com');
 // Refus : hôte inconnu, HTTP, clés incorrectes.
 assert.throws(()=>WP.cleanSubscription({...sub,endpoint:'https://exemple.org/push'}),/inconnu/);
 assert.throws(()=>WP.cleanSubscription({...sub,endpoint:'http://fcm.googleapis.com/x'}),/HTTPS/);
 assert.throws(()=>WP.cleanSubscription({...sub,keys:{p256dh:'abc',auth:sub.keys.auth}}),/Clé/);
});

test('rappel « la veille » : fenêtre d’envoi',()=>{
 const now=new Date(2026,10,24,19,0);const at=d=>new Date(2026,10,24+d.day,d.h,0).toISOString();
 assert.ok(WP.reminderDue(at({day:1,h:20}),now),'demain 20 h, il est 19 h la veille');
 assert.ok(!WP.reminderDue(at({day:1,h:20}),new Date(2026,10,24,10,0)),'trop tôt : le matin de la veille');
 assert.ok(!WP.reminderDue(at({day:3,h:20}),now));assert.ok(!WP.reminderDue(at({day:-1,h:20}),now));
});

test('rappel de séance envoyé une seule fois aux abonnés de la campagne, abonnement expiré supprimé',async t=>{
 const got=[];let gone=false;
 const push=http.createServer((req,res)=>{const parts=[];req.on('data',c=>parts.push(c));req.on('end',()=>{got.push({url:req.url,headers:req.headers,body:Buffer.concat(parts)});res.writeHead(gone&&req.url==='/old'?410:201);res.end();});});
 await new Promise(ok=>push.listen(0,'127.0.0.1',ok));t.after(()=>push.close());const port=push.address().port;
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-push-'));fs.mkdirSync(path.join(tmp,'data'));
 const app=createServer({publicOrigin:null,dataFile:path.join(tmp,'data','db.json'),setupKey:'very-long-bootstrap-secret',pushAllowHosts:['127.0.0.1'],pushReminders:false});
 await new Promise(ok=>app.server.listen(0,'127.0.0.1',ok));t.after(async()=>{await app.close();fs.rmSync(tmp,{recursive:true,force:true});});
 const base='http://127.0.0.1:'+app.server.address().port;
 const r=await fetch(base+'/api/setup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Maître Test',password:'Strong-Password-2026',setupKey:'very-long-bootstrap-secret'})});const gm=r.headers.get('set-cookie').split(';')[0];
 const call=async(route,body)=>{const x=await fetch(base+route,{method:body?'POST':'GET',headers:{Cookie:gm,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});return {status:x.status,data:await x.json()};};
 const status=await call('/api/push/status');assert.equal(Buffer.from(status.data.publicKey,'base64url').length,65);
 const ua=crypto.createECDH('prime256v1');ua.generateKeys();const auth=crypto.randomBytes(16);const keys={p256dh:ua.getPublicKey().toString('base64url'),auth:auth.toString('base64url')};
 assert.equal((await call('/api/push/subscribe',{subscription:{endpoint:'http://127.0.0.1:'+port+'/ok',keys}})).status,200);
 assert.equal((await call('/api/push/subscribe',{subscription:{endpoint:'http://127.0.0.1:'+port+'/old',keys}})).data.devices,2);
 assert.equal((await call('/api/push/subscribe',{subscription:{endpoint:'https://attaquant.example/x',keys}})).status,400);
 // Séance choisie demain soir.
 const st=(await call('/api/state')).data;const at=new Date(Date.now()+20*3600000);const local=new Date(at.getTime()-at.getTimezoneOffset()*60000).toISOString().slice(0,16);
 const act=async(kind,p)=>{const v=(await call('/api/state')).data.version;return call('/api/action',{kind,baseVersion:v,...p});};
 {const x=await act('scheduleAdd',{values:{at:local,note:'Chez Léa'}});assert.equal(x.status,200,JSON.stringify(x.data).slice(0,200));}
 const opt=(await call('/api/state')).data.state.schedule.options[0];await act('scheduleChoose',{optionId:opt.id});
 gone=true;const done=await app.sessionReminders(new Date());assert.equal(done.length,1);assert.equal(done[0].sent,1);assert.equal(done[0].removed,1);
 const okReq=got.find(g=>g.url==='/ok');assert.equal(okReq.headers['content-encoding'],'aes128gcm');assert.match(okReq.headers.authorization,/^vapid t=.+, k=/);
 const msg=JSON.parse(WP.decrypt(ua,auth,okReq.body));assert.match(msg.body,/Chez Léa/);assert.match(msg.title,/Séance/);
 assert.equal((await app.sessionReminders(new Date())).length,0,'pas de doublon');
 assert.equal((await call('/api/push/status')).data.devices,1,'abonnement expiré retiré');
 assert.equal((await call('/api/push/test',{})).data.sent,1);
 assert.equal((await call('/api/push/unsubscribe',{all:true})).data.devices,0);
});

test('« À vous de jouer » : notification au joueur actif seulement si son application n’est pas à l’écran',async t=>{
 const {fixture}=require('./_fixture.js');const f=await fixture(t);
 // Sans abonnement Web Push, le message reste disponible pour l'application Android.
 const poll=async c=>(await f.call('/api/notify/poll',{cookie:c})).data.messages;
 await f.action('start',{});let st=(await f.call('/api/state',{cookie:f.gm})).data.state;
 for(let i=0;i<6;i++){if(st.combat.order[st.combat.turnIndex]===f.a.id)break;await f.action('next',{});st=(await f.call('/api/state',{cookie:f.gm})).data.state;}
 const msgs=await poll(f.pa);assert.ok(msgs.some(m=>m.title==='À vous de jouer !'&&m.body.includes(f.a.name)),JSON.stringify(msgs));
 assert.ok(!(await poll(f.pb)).some(m=>m.body.includes(f.a.name)),'pas pour les autres');
 // Préférence désactivée.
 assert.equal((await f.call('/api/push/prefs',{method:'POST',cookie:f.pb,body:{turn:false}})).data.prefs.turn,false);
 assert.equal((await f.call('/api/push/status',{cookie:f.pb})).data.prefs.turn,false);
});
