/* Chroniques — clés d'accès (WebAuthn / passkeys), sans dépendance (5.1).
   Connexion par l'empreinte, le visage ou le code de l'appareil : le secret ne quitte jamais l'appareil ;
   le serveur garde seulement une clé publique. Vérifications faites ici :
   - défi à usage unique (5 minutes), type de l'opération, origine exacte du site, empreinte de l'identifiant du site (rpId) ;
   - présence ET vérification de l'utilisateur (empreinte, visage ou code) exigées ;
   - signature ES256 (P-256) ou RS256 ; compteur de signatures (détection de clé clonée quand l'appareil en tient un).
   L'attestation du fabricant n'est pas demandée (« none ») : n'importe quel gestionnaire de clés d'accès convient. */
'use strict';
const crypto=require('node:crypto');
const b64u={enc:b=>Buffer.from(b).toString('base64url'),dec:s=>{if(typeof s!=='string'||!/^[A-Za-z0-9_-]*={0,2}$/.test(s)||s.length>20000)fail('Donnée de clé d’accès invalide.');return Buffer.from(s,'base64url');}};
function fail(m,status=400){const e=new Error(m);e.status=status;throw e;}
// ---------- CBOR (sous-ensemble suffisant pour WebAuthn) ----------
function cbor(buf){let i=0;const need=n=>{if(i+n>buf.length)fail('Donnée CBOR tronquée.');};
 const len=info=>{if(info<24)return info;if(info===24){need(1);return buf[i++];}if(info===25){need(2);const v=buf.readUInt16BE(i);i+=2;return v;}if(info===26){need(4);const v=buf.readUInt32BE(i);i+=4;return v;}if(info===27){need(8);const v=Number(buf.readBigUInt64BE(i));i+=8;return v;}fail('Longueur CBOR non prise en charge.');};
 const item=(depth=0)=>{if(depth>16)fail('CBOR trop imbriqué.');need(1);const b=buf[i++],major=b>>5,info=b&31;
  if(major===0)return len(info);if(major===1)return -1-len(info);
  if(major===2){const n=len(info);need(n);const v=buf.subarray(i,i+n);i+=n;return v;}
  if(major===3){const n=len(info);need(n);const v=buf.subarray(i,i+n).toString('utf8');i+=n;return v;}
  if(major===4){const n=len(info);if(n>1000)fail('CBOR trop long.');const a=[];for(let k=0;k<n;k++)a.push(item(depth+1));return a;}
  if(major===5){const n=len(info);if(n>1000)fail('CBOR trop long.');const m=new Map();for(let k=0;k<n;k++){const key=item(depth+1);m.set(key,item(depth+1));}return m;}
  if(major===7){if(info===20)return false;if(info===21)return true;if(info===22)return null;}
  fail('Type CBOR non pris en charge.');};
 const v=item();return {value:v,end:i};}
// ---------- Données de l'authentificateur ----------
function parseAuthData(buf){if(!Buffer.isBuffer(buf)||buf.length<37)fail('Données d’authentification trop courtes.');
 const out={rpIdHash:buf.subarray(0,32),flags:buf[32],signCount:buf.readUInt32BE(33),up:!!(buf[32]&1),uv:!!(buf[32]&4),at:!!(buf[32]&64)};
 if(out.at){if(buf.length<55)fail('Données de clé tronquées.');const idLen=buf.readUInt16BE(53);if(idLen<1||idLen>1023||buf.length<55+idLen)fail('Identifiant de clé invalide.');
  out.credentialId=buf.subarray(55,55+idLen);const k=cbor(buf.subarray(55+idLen));out.cose=k.value;}
 return out;}
// Clé COSE → JWK (ES256 ou RS256).
function coseToJwk(cose){if(!(cose instanceof Map))fail('Clé publique illisible.');const kty=cose.get(1),alg=cose.get(3);
 if(kty===2&&alg===-7&&cose.get(-1)===1){const x=cose.get(-2),y=cose.get(-3);if(!Buffer.isBuffer(x)||!Buffer.isBuffer(y)||x.length!==32||y.length!==32)fail('Clé P-256 invalide.');return {alg:-7,jwk:{kty:'EC',crv:'P-256',x:b64u.enc(x),y:b64u.enc(y)}};}
 if(kty===3&&alg===-257){const n=cose.get(-1),e=cose.get(-2);if(!Buffer.isBuffer(n)||!Buffer.isBuffer(e)||n.length<256)fail('Clé RSA invalide.');return {alg:-257,jwk:{kty:'RSA',n:b64u.enc(n),e:b64u.enc(e)}};}
 fail('Type de clé non pris en charge (ES256 ou RS256 attendus).');}
function checkClient(clientDataB64,type,challenge,origin){const raw=b64u.dec(clientDataB64);let c;try{c=JSON.parse(raw.toString('utf8'));}catch{fail('Réponse de l’appareil illisible.');}
 if(c.type!==type)fail('Opération inattendue.');if(typeof c.challenge!=='string'||c.challenge!==challenge)fail('Défi expiré ou incorrect : recommencez.');if(c.origin!==origin)fail('Origine de la clé d’accès incorrecte.');if(c.crossOrigin===true)fail('Clé d’accès utilisée depuis un autre site.');return raw;}
const rpHash=rpId=>crypto.createHash('sha256').update(rpId).digest();
// Enregistrement d'une nouvelle clé.
function verifyRegistration({credential,challenge,origin,rpId}){const r=credential?.response||{};const clientRaw=checkClient(r.clientDataJSON,'webauthn.create',challenge,origin);
 const att=cbor(b64u.dec(r.attestationObject)).value;if(!(att instanceof Map)||!Buffer.isBuffer(att.get('authData')))fail('Attestation illisible.');
 const ad=parseAuthData(att.get('authData'));if(!ad.rpIdHash.equals(rpHash(rpId)))fail('Clé créée pour un autre site.');if(!ad.up||!ad.uv)fail('Vérification de l’utilisateur (empreinte, visage ou code) obligatoire.');if(!ad.at||!ad.credentialId)fail('Clé publique absente de la réponse.');
 if(typeof credential.id!=='string'||credential.id!==b64u.enc(ad.credentialId))fail('Identifiant de clé incohérent.');
 const key=coseToJwk(ad.cose);crypto.createPublicKey({key:key.jwk,format:'jwk'});void clientRaw;
 return {id:b64u.enc(ad.credentialId),alg:key.alg,jwk:key.jwk,signCount:ad.signCount};}
// Connexion : `stored` = clé enregistrée {id, alg, jwk, signCount}.
function verifyAssertion({credential,challenge,origin,rpId,stored}){const r=credential?.response||{};const clientRaw=checkClient(r.clientDataJSON,'webauthn.get',challenge,origin);
 const authRaw=b64u.dec(r.authenticatorData);const ad=parseAuthData(authRaw);if(!ad.rpIdHash.equals(rpHash(rpId)))fail('Clé d’accès d’un autre site.');if(!ad.up||!ad.uv)fail('Vérification de l’utilisateur (empreinte, visage ou code) obligatoire.');
 const data=Buffer.concat([authRaw,crypto.createHash('sha256').update(clientRaw).digest()]);const sig=b64u.dec(r.signature);const key=crypto.createPublicKey({key:stored.jwk,format:'jwk'});
 let ok=false;try{ok=stored.alg===-7?crypto.verify('sha256',data,{key,dsaEncoding:'der'},sig):crypto.verify('sha256',data,{key,padding:crypto.constants.RSA_PKCS1_PADDING},sig);}catch{ok=false;}
 if(!ok)fail('Signature de la clé d’accès invalide.',401);
 if((stored.signCount||0)>0&&ad.signCount<=stored.signCount)fail('Compteur de la clé d’accès incohérent : clé peut-être copiée. Supprimez-la et créez-en une nouvelle.',401);
 return {signCount:ad.signCount};}
module.exports={b64u,cbor,parseAuthData,coseToJwk,verifyRegistration,verifyAssertion,rpHash};
