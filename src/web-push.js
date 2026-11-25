/* Chroniques — notifications Web Push sans dépendance externe (rappel de séance).
   Normes utilisées : VAPID (RFC 8292, jeton ES256) et chiffrement « aes128gcm » des messages (RFC 8188 / RFC 8291),
   avec le module crypto de Node uniquement. Les abonnements ne sont acceptés que vers les services de notification
   des navigateurs (Google, Mozilla, Apple, Microsoft) et toujours en HTTPS. */
'use strict';
const crypto=require('node:crypto');
const b64u=b=>Buffer.from(b).toString('base64url');
const fromB64u=s=>Buffer.from(String(s||''),'base64url');
const PUSH_HOSTS=['fcm.googleapis.com','android.googleapis.com','updates.push.services.mozilla.com','push.services.mozilla.com','web.push.apple.com','push.apple.com','notify.windows.com'];
function fail(m,status=400){const e=new Error(m);e.status=status;throw e;}
// Paire de clés VAPID (P-256). La clé publique brute (65 octets) est donnée aux navigateurs.
function createVapid(){const {privateKey,publicKey}=crypto.generateKeyPairSync('ec',{namedCurve:'prime256v1'});return {privatePem:privateKey.export({type:'pkcs8',format:'pem'}),publicKey:rawPublic(publicKey)};}
function rawPublic(key){const jwk=key.export({format:'jwk'});return b64u(Buffer.concat([Buffer.from([4]),fromB64u(jwk.x),fromB64u(jwk.y)]));}
function vapidJwt(vapid,audience,subject,now=Date.now()){const header=b64u(JSON.stringify({typ:'JWT',alg:'ES256'}));
 const payload=b64u(JSON.stringify({aud:audience,exp:Math.floor(now/1000)+12*3600,sub:subject||'mailto:chroniques@localhost'}));
 const sig=crypto.sign('sha256',Buffer.from(header+'.'+payload),{key:crypto.createPrivateKey(vapid.privatePem),dsaEncoding:'ieee-p1363'});
 return header+'.'+payload+'.'+b64u(sig);}
// Vérifie un abonnement envoyé par le navigateur.
function cleanSubscription(sub,{allowHosts=[] ,allowHttp=false}={}){if(!sub||typeof sub!=='object')fail('Abonnement invalide.');
 let url;try{url=new URL(String(sub.endpoint||''));}catch{fail('Adresse de notification invalide.');}
 if(String(sub.endpoint).length>1000)fail('Adresse de notification trop longue.');
 const okHost=PUSH_HOSTS.some(h=>url.hostname===h||url.hostname.endsWith('.'+h))||allowHosts.includes(url.hostname);
 if(!okHost)fail('Service de notification inconnu.');if(url.protocol!=='https:'&&!(allowHttp&&allowHosts.includes(url.hostname)))fail('Les notifications exigent HTTPS.');
 const p256dh=fromB64u(sub.keys&&sub.keys.p256dh),auth=fromB64u(sub.keys&&sub.keys.auth);
 if(p256dh.length!==65||p256dh[0]!==4)fail('Clé de chiffrement invalide.');if(auth.length!==16)fail('Secret d’authentification invalide.');
 return {endpoint:url.toString(),keys:{p256dh:b64u(p256dh),auth:b64u(auth)}};}
function hmac(key,data){return crypto.createHmac('sha256',key).update(data).digest();}
// Chiffre `payload` pour un abonnement (RFC 8291). Renvoie le corps binaire à envoyer.
function encrypt(sub,payload,{salt=crypto.randomBytes(16),ephemeral=null}={}){const uaPublic=fromB64u(sub.keys.p256dh),authSecret=fromB64u(sub.keys.auth);
 const ecdh=ephemeral||crypto.createECDH('prime256v1');if(!ephemeral)ecdh.generateKeys();const asPublic=ecdh.getPublicKey();
 const shared=ecdh.computeSecret(uaPublic);
 const prkKey=hmac(authSecret,shared);const ikm=hmac(prkKey,Buffer.concat([Buffer.from('WebPush: info\0'),uaPublic,asPublic,Buffer.from([1])]));
 const prk=hmac(salt,ikm);const cek=hmac(prk,Buffer.concat([Buffer.from('Content-Encoding: aes128gcm\0'),Buffer.from([1])])).subarray(0,16);
 const nonce=hmac(prk,Buffer.concat([Buffer.from('Content-Encoding: nonce\0'),Buffer.from([1])])).subarray(0,12);
 const data=Buffer.from(payload,'utf8');if(data.length>3000)fail('Message trop long.');
 const cipher=crypto.createCipheriv('aes-128-gcm',cek,nonce);const body=Buffer.concat([cipher.update(Buffer.concat([data,Buffer.from([2])])),cipher.final(),cipher.getAuthTag()]);
 const rs=Buffer.alloc(4);rs.writeUInt32BE(4096);
 return Buffer.concat([salt,rs,Buffer.from([asPublic.length]),asPublic,body]);}
// Déchiffrement (côté navigateur) : sert uniquement aux tests automatiques.
function decrypt(ecdhUa,authSecret,body){const salt=body.subarray(0,16),idlen=body[20],asPublic=body.subarray(21,21+idlen),ct=body.subarray(21+idlen);
 const uaPublic=ecdhUa.getPublicKey();const shared=ecdhUa.computeSecret(asPublic);
 const prkKey=hmac(authSecret,shared);const ikm=hmac(prkKey,Buffer.concat([Buffer.from('WebPush: info\0'),uaPublic,asPublic,Buffer.from([1])]));
 const prk=hmac(salt,ikm);const cek=hmac(prk,Buffer.concat([Buffer.from('Content-Encoding: aes128gcm\0'),Buffer.from([1])])).subarray(0,16);
 const nonce=hmac(prk,Buffer.concat([Buffer.from('Content-Encoding: nonce\0'),Buffer.from([1])])).subarray(0,12);
 const d=crypto.createDecipheriv('aes-128-gcm',cek,nonce);d.setAuthTag(ct.subarray(ct.length-16));const plain=Buffer.concat([d.update(ct.subarray(0,ct.length-16)),d.final()]);
 return plain.subarray(0,plain.lastIndexOf(2)).toString('utf8');}
// Envoie une notification. Résultat : {ok, status, gone} (gone = abonnement expiré à supprimer).
async function send(vapid,sub,message,{subject,ttl=86400,fetchImpl=fetch}={}){const url=new URL(sub.endpoint);
 const body=encrypt(sub,JSON.stringify(message));const jwt=vapidJwt(vapid,url.origin,subject);
 try{const res=await fetchImpl(sub.endpoint,{method:'POST',headers:{TTL:String(ttl),Urgency:'normal','Content-Encoding':'aes128gcm','Content-Type':'application/octet-stream',Authorization:'vapid t='+jwt+', k='+vapid.publicKey},body,signal:AbortSignal.timeout?AbortSignal.timeout(15000):undefined});
  return {ok:res.status>=200&&res.status<300,status:res.status,gone:res.status===404||res.status===410};}
 catch(e){return {ok:false,status:0,gone:false,error:e.message};}}
// Rappel « la veille » : vrai si la séance commence entre 12 h et 36 h à partir de maintenant, et
// qu'on est dans la fenêtre d'envoi (à partir de 18 h la veille, heure du serveur) ou à moins de 24 h.
function reminderDue(atIso,now=new Date()){const at=new Date(atIso);if(Number.isNaN(at.getTime()))return false;const h=(at-now)/3600000;if(h<=0||h>36)return false;
 const eve=new Date(at);eve.setDate(eve.getDate()-1);eve.setHours(18,0,0,0);return now>=eve||h<=24;}
module.exports={PUSH_HOSTS,createVapid,vapidJwt,cleanSubscription,encrypt,decrypt,send,reminderDue,rawPublic};
