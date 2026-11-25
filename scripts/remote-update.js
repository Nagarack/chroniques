/* Chroniques — téléchargement automatique des mises à jour signées.
   Le serveur lit une « fiche de version » (manifeste JSON) à une adresse HTTPS choisie par l'éditeur,
   vérifie sa signature Ed25519 avec la clé publique de l'éditeur, puis télécharge le .zip annoncé et
   contrôle son empreinte SHA-256. Rien n'est installé tout seul : le MJ propriétaire confirme l'installation.
   Réglages : config/update-source.json (prioritaire, jamais inclus dans les ZIP) ou update-source.json
   livré avec l'application :
     {"manifest":"https://…/chroniques-maj.json","publicKey":"<clé publique Ed25519, base64>","token":"(facultatif)","autoDownload":true} */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const FORMAT='chroniques-maj';
const MAX_ZIP=40*1024*1024;
function fail(m,status=400){const e=new Error(m);e.status=status;throw e;}
// Réglages : update-source.json livré avec l'application (adresse + clé publique de l'éditeur), complété ou
// remplacé par config/update-source.json (propre à l'installation). Le jeton d'accès n'est lu que dans config/.
function readConfig(root){const read=f=>{try{const c=JSON.parse(fs.readFileSync(f,'utf8'));return c&&typeof c==='object'?c:null;}catch{return null;}};
 const shipped=read(path.join(root,'update-source.json'))||{},local=read(path.join(root,'config','update-source.json'))||{};
 const pick=k=>local[k]!==undefined&&local[k]!==''?local[k]:shipped[k];const manifest=pick('manifest'),publicKey=pick('publicKey');
 if(!manifest||!publicKey||local.enabled===false)return null;
 return {manifest:String(manifest),publicKey:String(publicKey),token:local.token?String(local.token):'',autoDownload:pick('autoDownload')!==false};}
// Clé publique : base64 des 32 octets bruts, ou PEM.
function publicKeyOf(k){const s=String(k||'').trim();if(s.includes('BEGIN PUBLIC KEY'))return crypto.createPublicKey(s);
 const raw=Buffer.from(s,'base64');if(raw.length!==32)fail('Clé publique de mise à jour invalide (32 octets attendus).');
 return crypto.createPublicKey({key:Buffer.concat([Buffer.from('302a300506032b6570032100','hex'),raw]),format:'der',type:'spki'});}
const signedText=m=>[FORMAT,m.version,String(m.sha256).toLowerCase(),String(m.size),String(m.url||''),String(m.notes||'')].join('|');
function verifyManifest(m,publicKey){if(!m||m.format!==FORMAT)fail('Fiche de version non reconnue.');
 if(!/^\d+\.\d+\.\d+$/.test(String(m.version||'')))fail('Numéro de version invalide dans la fiche.');
 if(!/^[0-9a-f]{64}$/i.test(String(m.sha256||'')))fail('Empreinte SHA-256 invalide dans la fiche.');
 if(!Number.isSafeInteger(m.size)||m.size<100||m.size>MAX_ZIP)fail('Taille annoncée invalide.');
 let ok=false;try{ok=crypto.verify(null,Buffer.from(signedText(m)),publicKeyOf(publicKey),Buffer.from(String(m.signature||''),'base64'));}catch(e){if(e.status)throw e;}
 if(!ok)fail('Signature de la mise à jour invalide : fichier refusé.');return m;}
function checkUrl(u,allowHttp){let url;try{url=new URL(u);}catch{fail('Adresse invalide : '+u);}if(url.protocol!=='https:'&&!(allowHttp&&url.protocol==='http:'))fail('Les mises à jour ne se téléchargent qu’en HTTPS.');return url;}
function headers(cfg,accept){const h={'User-Agent':'Chroniques-maj',Accept:accept};if(cfg.token)h.Authorization='Bearer '+cfg.token;return h;}
// Source « github:propriétaire/dépôt » : dernière version publiée (GitHub Releases), dépôt public ou privé (jeton).
// La fiche « chroniques-maj.json » et le ZIP sont des fichiers joints à la version ; l'API GitHub les sert.
const GH_API=process.env.CHRONIQUES_GITHUB_API||'https://api.github.com';
// Adresse d'essai locale (tests) : seul cas où le HTTP simple est accepté.
const GH_LOCAL=/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(GH_API);
// Requête avec jeton qui suit elle-même les redirections : le jeton n'est envoyé qu'au premier serveur
// (GitHub renvoie les fichiers joints vers un stockage externe qui refuse les en-têtes d'autorisation).
async function getFollow(url,cfg,accept,fetchImpl,timeout){let u=url,h=headers(cfg,accept);
 for(let i=0;i<5;i++){const res=await fetchImpl(u,{headers:h,redirect:'manual',signal:AbortSignal.timeout?AbortSignal.timeout(timeout):undefined});
  if(res.status>=300&&res.status<400&&res.headers.get('location')){const next=new URL(res.headers.get('location'),u);if(next.origin!==new URL(u).origin){h={'User-Agent':'Chroniques-maj',Accept:accept};}u=next.toString();try{await res.body?.cancel?.();}catch{}continue;}
  return res;}
 fail('Trop de redirections.',502);}
async function githubRelease(cfg,fetchImpl){const repo=cfg.manifest.slice('github:'.length);if(!/^[\w.-]+\/[\w.-]+$/.test(repo))fail('Source GitHub invalide (github:propriétaire/dépôt).');
 const res=await fetchImpl(GH_API+'/repos/'+repo+'/releases/latest',{headers:{...headers(cfg,'application/vnd.github+json'),'X-GitHub-Api-Version':'2022-11-28'},signal:AbortSignal.timeout?AbortSignal.timeout(20000):undefined});
 if(!res.ok)fail('Dernière version GitHub inaccessible ('+res.status+(res.status===404?' : dépôt privé sans jeton, ou aucune version publiée':'')+').',502);
 const rel=await res.json();return Array.isArray(rel.assets)?rel.assets:[];}
async function fetchManifest(cfg,{fetchImpl=fetch,allowHttp=false}={}){
 if(GH_LOCAL)allowHttp=true;
 if(String(cfg.manifest).startsWith('github:')){const assets=await githubRelease(cfg,fetchImpl);const a=assets.find(x=>x.name==='chroniques-maj.json');if(!a)fail('La dernière version GitHub ne contient pas chroniques-maj.json.',502);
  const r=await getFollow(a.url,cfg,'application/octet-stream',fetchImpl,20000);if(!r.ok)fail('Fiche de version inaccessible ('+r.status+').',502);
  const text=await r.text();if(text.length>20000)fail('Fiche de version trop longue.');let m;try{m=JSON.parse(text);}catch{fail('Fiche de version illisible.');}verifyManifest(m,cfg.publicKey);
  // Le ZIP est désigné par son nom de fichier joint (signé), et téléchargé par l'API.
  if(!/^https?:/.test(String(m.url))){const z=assets.find(x=>x.name===m.url);if(!z)fail('Fichier '+m.url+' absent de la version GitHub.',502);Object.defineProperty(m,'downloadUrl',{value:z.url,enumerable:false});}
  return m;}
 checkUrl(cfg.manifest,allowHttp);
 const res=await fetchImpl(cfg.manifest,{headers:headers(cfg,'application/json'),signal:AbortSignal.timeout?AbortSignal.timeout(20000):undefined});
 if(!res.ok)fail('Fiche de version inaccessible ('+res.status+').',502);const text=await res.text();if(text.length>20000)fail('Fiche de version trop longue.');
 let m;try{m=JSON.parse(text);}catch{fail('Fiche de version illisible.');}return verifyManifest(m,cfg.publicKey);}
// Télécharge le paquet annoncé dans `dest` en vérifiant la taille et l'empreinte.
async function download(cfg,m,dest,{fetchImpl=fetch,allowHttp=false}={}){if(GH_LOCAL&&m.downloadUrl)allowHttp=true;const url=m.downloadUrl||m.url;checkUrl(url,allowHttp);
 const res=await getFollow(url,cfg,'application/octet-stream',fetchImpl,300000);
 if(!res.ok||!res.body)fail('Téléchargement impossible ('+res.status+').',502);
 const hash=crypto.createHash('sha256');let size=0;const fd=fs.openSync(dest,'w',0o600);
 try{for await(const chunk of res.body){size+=chunk.length;if(size>m.size||size>MAX_ZIP)fail('Fichier plus gros qu’annoncé : téléchargement interrompu.');hash.update(chunk);fs.writeSync(fd,chunk);}}
 catch(e){fs.closeSync(fd);fs.rmSync(dest,{force:true});throw e;}
 fs.closeSync(fd);
 if(size!==m.size||hash.digest('hex')!==String(m.sha256).toLowerCase()){fs.rmSync(dest,{force:true});fail('Empreinte du fichier différente de la fiche signée : fichier supprimé.');}
 return {size};}
// Outils de l'éditeur (scripts/dev/sign-release.js).
function keygen(){const {publicKey,privateKey}=crypto.generateKeyPairSync('ed25519');const raw=publicKey.export({type:'spki',format:'der'}).subarray(12);
 return {publicKey:raw.toString('base64'),privatePem:privateKey.export({type:'pkcs8',format:'pem'})};}
function sign(zipPath,{privatePem,version,url,notes=''}){const buf=fs.readFileSync(zipPath);const m={format:FORMAT,version,url,size:buf.length,sha256:crypto.createHash('sha256').update(buf).digest('hex'),notes:String(notes).slice(0,500),publishedAt:new Date().toISOString()};
 m.signature=crypto.sign(null,Buffer.from(signedText(m)),crypto.createPrivateKey(privatePem)).toString('base64');return m;}
module.exports={FORMAT,MAX_ZIP,readConfig,publicKeyOf,verifyManifest,fetchManifest,download,keygen,sign,signedText};
