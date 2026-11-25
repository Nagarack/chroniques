'use strict';
/**
 * Mise à jour de Chroniques en place, avec retour arrière automatique.
 *   node scripts/update.js <nouvelle-version.zip | dossier extrait>
 *   node scripts/update.js --rollback        (revient à la version précédente)
 * Étapes : vérifie que le serveur est arrêté, sauvegarde la base et les images, met de côté
 * l'application actuelle, installe la nouvelle, la teste sur une COPIE de la base, puis
 * revient automatiquement en arrière si quoi que ce soit échoue. Les dossiers data/, config/
 * et backups/ ne sont jamais modifiés par l'installation.
 */
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const net=require('node:net');
const {spawnSync}=require('node:child_process');

const KEEP=new Set(['data','config','backups','node_modules','updates']);   // jamais remplacés ni supprimés
const SNAPSHOTS_KEPT=3;

function say(msg){process.stdout.write(msg+'\n');}
function versionOf(dir){try{const p=JSON.parse(fs.readFileSync(path.join(dir,'package.json'),'utf8'));return p.name==='chroniques'&&typeof p.version==='string'?p.version:null;}catch{return null;}}
function cmp(a,b){const x=String(a).split('.').map(Number),y=String(b).split('.').map(Number);for(let i=0;i<3;i++){if((x[i]||0)!==(y[i]||0))return (x[i]||0)-(y[i]||0);}return 0;}
function stamp(){return new Date().toISOString().replace(/[:.]/g,'-');}

function findAppRoot(dir,depth=0){
 if(fs.existsSync(path.join(dir,'server.js'))&&versionOf(dir))return dir;
 if(depth>=2)return null;
 for(const e of fs.readdirSync(dir,{withFileTypes:true}))if(e.isDirectory()&&!e.name.startsWith('.')&&e.name!=='__MACOSX'){const r=findAppRoot(path.join(dir,e.name),depth+1);if(r)return r;}
 return null;
}
function extract(zip){
 const dest=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-maj-'));
 const tries=process.platform==='win32'
  ?[['powershell',['-NoProfile','-NonInteractive','-Command',`Expand-Archive -LiteralPath '${zip.replace(/'/g,"''")}' -DestinationPath '${dest.replace(/'/g,"''")}' -Force`]],['tar',['-xf',zip,'-C',dest]]]
  :[['unzip',['-q',zip,'-d',dest]],['bsdtar',['-xf',zip,'-C',dest]]];
 for(const [cmd,args] of tries){const r=spawnSync(cmd,args,{stdio:'ignore',windowsHide:true});if(r.status===0)return dest;}
 throw new Error('Impossible de décompresser le fichier ZIP. Décompressez-le vous-même, puis glissez le DOSSIER obtenu sur METTRE_A_JOUR.bat.');
}
// Vérifie qu'un ZIP contient bien Chroniques et renvoie sa version, sans rien installer.
function inspectPackage(zip){let dir=null;try{dir=extract(zip);const r=findAppRoot(dir);if(!r)throw new Error('Ce fichier ne contient pas Chroniques (server.js et package.json introuvables).');return {version:versionOf(r)};}finally{if(dir)fs.rmSync(dir,{recursive:true,force:true});}}
// Mise à jour déposée depuis l'application (updates/pending.zip) : installée au redémarrage par le lanceur.
async function applyPending({root=path.resolve(__dirname,'..'),port}={}){const dir=path.join(root,'updates'),zip=path.join(dir,'pending.zip');if(!fs.existsSync(zip))return null;
 const result={at:new Date().toISOString()};
 try{const r=await update(zip,{root,port,checkServer:true});Object.assign(result,{ok:true,from:r.from,to:r.to,message:'Chroniques '+r.to+' installé.'});}
 catch(e){Object.assign(result,{ok:false,message:e.message});}
 try{fs.mkdirSync(dir,{recursive:true});fs.renameSync(zip,path.join(dir,(result.ok?'installe-'+result.to:'refuse-'+stamp())+'.zip'));
  const old=fs.readdirSync(dir).filter(n=>/^(installe|refuse)-.*\.zip$/.test(n)).sort();for(const n of old.slice(0,Math.max(0,old.length-3)))fs.rmSync(path.join(dir,n),{force:true});
  fs.writeFileSync(path.join(dir,'derniere-mise-a-jour.json'),JSON.stringify(result,null,1));}catch{}
 return result;}
function serverRunning(port){return new Promise(ok=>{const s=net.connect({host:'127.0.0.1',port},()=>{s.destroy();ok(true);});s.on('error',()=>ok(false));s.setTimeout(800,()=>{s.destroy();ok(false);});});}
function appEntries(dir){return fs.readdirSync(dir).filter(n=>!KEEP.has(n)&&!n.startsWith('.git'));}
function copyApp(from,to){for(const n of appEntries(from))fs.cpSync(path.join(from,n),path.join(to,n),{recursive:true,force:true});}
function removeApp(dir){for(const n of appEntries(dir))fs.rmSync(path.join(dir,n),{recursive:true,force:true});}
function snapshotsDir(root){return path.join(root,'backups','versions');}
function pruneSnapshots(root){const dir=snapshotsDir(root);if(!fs.existsSync(dir))return;const all=fs.readdirSync(dir).filter(n=>n.startsWith('app-')).sort();for(const n of all.slice(0,Math.max(0,all.length-SNAPSHOTS_KEPT)))fs.rmSync(path.join(dir,n),{recursive:true,force:true});}

// Démarre la nouvelle version sur un port libre, avec une COPIE de la base, et vérifie qu'elle répond.
function verify(root,expected){
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-verif-'));
 try{
  const db=path.join(root,'data','chroniques-db.json');const copy=path.join(tmp,'db.json');
  if(fs.existsSync(db))fs.copyFileSync(db,copy);
  const probe=`const {createServer}=require(${JSON.stringify(path.join(root,'server.js'))});
const app=createServer({publicOrigin:null,dataFile:${JSON.stringify(copy)},setupKey:'verification-de-mise-a-jour'});
app.server.listen(0,'127.0.0.1',async()=>{try{const r=await fetch('http://127.0.0.1:'+app.server.address().port+'/api/status');const j=await r.json();
const i=await fetch('http://127.0.0.1:'+app.server.address().port+'/');process.stdout.write(JSON.stringify({ok:r.ok&&i.ok,version:j.version}));}catch(e){process.stdout.write(JSON.stringify({ok:false,error:e.message}));}finally{await app.close();process.exit(0);}});`;
  const r=spawnSync(process.execPath,['-e',probe],{encoding:'utf8',timeout:30000,cwd:tmp,env:{...process.env,CHRONIQUES_SETUP_KEY:''}});
  let out={};try{out=JSON.parse(r.stdout||'{}');}catch{}
  if(!out.ok)throw new Error('la nouvelle version ne démarre pas'+(r.stderr?' : '+r.stderr.split('\n').find(Boolean):out.error?' : '+out.error:''));
  if(out.version!==expected)throw new Error('version inattendue après installation ('+out.version+')');
  for(const f of fs.readdirSync(path.join(root,'src')).filter(f=>f.endsWith('.js'))){const c=spawnSync(process.execPath,['--check',path.join(root,'src',f)],{encoding:'utf8'});if(c.status!==0)throw new Error('fichier invalide : src/'+f);}
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
}

async function update(source,{root=path.resolve(__dirname,'..'),port=Number(process.env.PORT||8080),checkServer=true,allowSameVersion=false}={}){
 if(!source)throw new Error('Indiquez le fichier ZIP de la nouvelle version (glissez-le sur METTRE_A_JOUR.bat).');
 source=path.resolve(String(source).replace(/^"|"$/g,''));
 if(!fs.existsSync(source))throw new Error('Fichier introuvable : '+source);
 const current=versionOf(root);if(!current)throw new Error('Ce dossier ne contient pas une installation de Chroniques.');
 if(checkServer&&await serverRunning(port))throw new Error('Le serveur Chroniques est encore ouvert. Fermez sa fenêtre (Ctrl+C), puis relancez la mise à jour.');
 let extracted=null;
 try{
  let newRoot;
  if(fs.statSync(source).isDirectory())newRoot=findAppRoot(source);
  else{say('Décompression…');extracted=extract(source);newRoot=findAppRoot(extracted);}
  if(!newRoot)throw new Error('Ce fichier ne contient pas Chroniques (server.js et package.json introuvables).');
  if(path.resolve(newRoot)===path.resolve(root))throw new Error('Le dossier de la nouvelle version est le dossier actuel.');
  const next=versionOf(newRoot);
  if(cmp(next,current)<0)throw new Error(`La version proposée (${next}) est plus ancienne que la version installée (${current}). Rien n'a été modifié.`);
  if(cmp(next,current)===0&&!allowSameVersion)throw new Error(`Chroniques ${current} est déjà installé. Rien n'a été modifié.`);
  say(`Mise à jour de Chroniques ${current} vers ${next}.`);
  // 1. Sauvegarde des données (si une base existe).
  let backupFile=null;
  if(fs.existsSync(path.join(root,'data','chroniques-db.json'))){const {backup}=require(path.join(root,'scripts','backup.js'));backupFile=backup(root);say('Sauvegarde des données : '+path.relative(root,backupFile));}
  // 2. Mise de côté de l'application actuelle.
  const snap=path.join(snapshotsDir(root),`app-${stamp()}-v${current}`);
  fs.mkdirSync(snap,{recursive:true});copyApp(root,snap);say('Version actuelle mise de côté : '+path.relative(root,snap));
  // 3. Installation, puis vérification ; retour arrière automatique en cas d'échec.
  try{
   removeApp(root);copyApp(newRoot,root);
   for(const d of ['data','config','backups'])fs.mkdirSync(path.join(root,d),{recursive:true});
   say('Vérification de la nouvelle version…');verify(root,next);
  }catch(err){
   say('ÉCHEC : '+err.message);say('Retour automatique à la version '+current+'…');
   removeApp(root);copyApp(snap,root);
   throw new Error(`La mise à jour a échoué et la version ${current} a été remise en place. Vos données n'ont pas été modifiées.`);
  }
  pruneSnapshots(root);
  return {from:current,to:next,backupFile,snapshot:snap};
 }finally{if(extracted)fs.rmSync(extracted,{recursive:true,force:true});}
}

async function rollback({root=path.resolve(__dirname,'..'),port=Number(process.env.PORT||8080),checkServer=true}={}){
 if(checkServer&&await serverRunning(port))throw new Error('Le serveur Chroniques est encore ouvert. Fermez sa fenêtre, puis recommencez.');
 const dir=snapshotsDir(root);const all=fs.existsSync(dir)?fs.readdirSync(dir).filter(n=>n.startsWith('app-')).sort():[];
 if(!all.length)throw new Error('Aucune version précédente n’a été conservée.');
 const snap=path.join(dir,all[all.length-1]),target=versionOf(snap),current=versionOf(root);
 const keep=path.join(dir,`app-${stamp()}-v${current}-avant-retour`);fs.mkdirSync(keep,{recursive:true});copyApp(root,keep);
 removeApp(root);copyApp(snap,root);fs.rmSync(snap,{recursive:true,force:true});
 return {from:current,to:target};
}

if(require.main===module){
 (async()=>{
  try{
   if(process.argv[2]==='--pending'){const r=await applyPending();if(r)say((r.ok?'MISE À JOUR : ':'MISE À JOUR REFUSÉE : ')+r.message);return;}
   if(process.argv[2]==='--rollback'){const r=await rollback();say(`Retour effectué : Chroniques ${r.to} est de nouveau installé (la version ${r.from} reste dans backups/versions).`);}
   else{const r=await update(process.argv[2]);say('');say(`TERMINÉ : Chroniques ${r.to} est installé. Vos campagnes, comptes, images et réglages sont conservés.`);say('Lancez DEMARRER_CHRONIQUES.bat. En cas de souci : REVENIR_VERSION_PRECEDENTE.bat.');}
  }catch(err){say('');say('ERREUR : '+err.message);process.exitCode=1;}
 })();
}
module.exports={update,rollback,findAppRoot,versionOf,cmp,inspectPackage,applyPending};
