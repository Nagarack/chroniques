'use strict';
/* Chroniques — sauvegardes : création, liste, vérification (test de restauration), copie miroir.
   Une sauvegarde = fichier JSON de la base + dossier .media des images et sons, à garder ensemble. */
const fs=require('node:fs');const path=require('node:path');
const NAME=/^chroniques-backup-[0-9TZ-]+(-auto)?\.json$/;
const AUTO_NAME=/^db-[0-9TZ-]+\.json$/;
function sourceOf(root,opts){return opts.source||path.join(root,'data','chroniques-db.json');}
function backup(root=path.resolve(__dirname,'..'),opts={}){
 const source=sourceOf(root,opts);
 if(!fs.existsSync(source))throw new Error('Aucune campagne enregistrée dans data/chroniques-db.json.');
 const raw=fs.readFileSync(source);const data=JSON.parse(raw.toString('utf8'));
 if(data.format!==5||!Array.isArray(data.users)||!Array.isArray(data.campaigns))throw new Error('Format de base inattendu.');
 const stamp=new Date().toISOString().replace(/[:.]/g,'-');
 const dir=path.join(root,'backups');fs.mkdirSync(dir,{recursive:true});
 let dest=path.join(dir,`chroniques-backup-${stamp}${opts.auto?'-auto':''}.json`);
 for(let i=1;fs.existsSync(dest)&&i<100;i++)dest=path.join(dir,`chroniques-backup-${stamp}-${i}${opts.auto?'-auto':''}.json`);
 fs.writeFileSync(dest,raw,{flag:'wx',mode:0o600});
 const mediaDir=opts.mediaDir||path.join(path.dirname(source),'media');
 if(fs.existsSync(mediaDir)){
  const mediaBackup=dest.replace(/\.json$/,'.media');
  fs.cpSync(mediaDir,mediaBackup,{recursive:true,errorOnExist:true,force:false});
 }
 if(opts.auto)prune(root,opts.keepAuto||20);
 if(opts.mirror)try{mirror(dest,opts.mirror);}catch(e){console.warn('Copie miroir impossible :',e.message);}
 return dest;
}
// Ne garde que les N dernières sauvegardes automatiques quotidiennes (les manuelles ne sont jamais supprimées).
function prune(root,keep){const dir=path.join(root,'backups');let files=[];try{files=fs.readdirSync(dir).filter(f=>/^chroniques-backup-.*-auto\.json$/.test(f)).sort();}catch{return;}
 for(const f of files.slice(0,Math.max(0,files.length-keep))){try{fs.unlinkSync(path.join(dir,f));}catch{}try{fs.rmSync(path.join(dir,f.replace(/\.json$/,'.media')),{recursive:true,force:true});}catch{}}}
// Copie d'une sauvegarde (et de ses images) vers un dossier choisi : clé USB, OneDrive, Google Drive…
function mirror(file,dir){if(!dir)return null;if(!fs.existsSync(dir)||!fs.statSync(dir).isDirectory())throw new Error('Dossier miroir introuvable : '+dir);
 const target=path.join(dir,path.basename(file));fs.copyFileSync(file,target);const media=file.replace(/\.json$/,'.media');
 if(fs.existsSync(media))fs.cpSync(media,target.replace(/\.json$/,'.media'),{recursive:true,force:true});return target;}
function checkMirrorDir(dir){const d=String(dir||'').trim();if(!d)return '';if(!path.isAbsolute(d))throw new Error('Indiquez un chemin complet (ex. C:\\Users\\vous\\OneDrive\\Chroniques).');
 if(!fs.existsSync(d)||!fs.statSync(d).isDirectory())throw new Error('Ce dossier n’existe pas sur le PC du serveur.');
 const probe=path.join(d,'.chroniques-test-'+process.pid);fs.writeFileSync(probe,'ok');fs.unlinkSync(probe);return path.resolve(d);}
// Liste des sauvegardes : manuelles/quotidiennes (backups/) et automatiques avant modification (data/auto-backups/).
function list(root,dataFile){const out=[];const add=(kind,dir,re)=>{let files=[];try{files=fs.readdirSync(dir).filter(f=>re.test(f));}catch{return;}
  for(const f of files){try{const st=fs.statSync(path.join(dir,f));out.push({id:kind+'/'+f,kind:kind==='auto'?'auto':/-auto\.json$/.test(f)?'daily':'manual',name:f,at:st.mtime.toISOString(),bytes:st.size,hasMedia:fs.existsSync(path.join(dir,f.replace(/\.json$/,'.media')))});}catch{}}};
 add('manual',path.join(root,'backups'),NAME);add('auto',path.join(path.dirname(dataFile),'auto-backups'),AUTO_NAME);
 return out.sort((a,b)=>b.at.localeCompare(a.at));}
function resolve(root,dataFile,id){const m=/^(manual|auto)\/([A-Za-z0-9TZ._-]+)$/.exec(String(id||''));if(!m)throw Object.assign(new Error('Sauvegarde inconnue.'),{status:400});
 const [,kind,name]=m;if(!(kind==='manual'?NAME:AUTO_NAME).test(name))throw Object.assign(new Error('Sauvegarde inconnue.'),{status:400});
 const dir=kind==='manual'?path.join(root,'backups'):path.join(path.dirname(dataFile),'auto-backups');const file=path.join(dir,name);
 if(!fs.existsSync(file))throw Object.assign(new Error('Fichier de sauvegarde introuvable.'),{status:404});return {file,media:file.replace(/\.json$/,'.media')};}
// Test de restauration : lecture complète, format, campagne, personnages, images référencées retrouvables.
function inspect(file,campaignId,mediaDirs=[]){const report={ok:false,problems:[],campaign:null};let data;
 try{data=JSON.parse(fs.readFileSync(file,'utf8'));}catch(e){report.problems.push('Fichier illisible ou incomplet ('+e.message+').');return report;}
 if(data.format!==5||!Array.isArray(data.campaigns)||!Array.isArray(data.users)){report.problems.push('Format de base inattendu.');return report;}
 const c=data.campaigns.find(x=>x.id===campaignId);if(!c){report.problems.push('Cette campagne n’existe pas dans la sauvegarde.');report.campaigns=data.campaigns.map(x=>x.state?.title||x.id);return report;}
 const s=c.state;if(!s||!Array.isArray(s.characters)||!s.combat){report.problems.push('Données de campagne incomplètes.');return report;}
 const files=new Set();const walk=v=>{if(!v||typeof v!=='object')return;if(Array.isArray(v)){v.forEach(walk);return;}for(const [k,x] of Object.entries(v)){if(k==='filename'&&typeof x==='string')files.add(x);else walk(x);}};walk(s);
 const missing=[...files].filter(f=>!mediaDirs.some(d=>d&&fs.existsSync(path.join(d,f))));
 report.campaign={title:s.title||'',version:c.version,characters:s.characters.map(p=>p.name),lastEdited:s.lastEdited||null,maps:(s.maps||[]).length,media:files.size,missingMedia:missing.length};
 if(missing.length)report.problems.push(missing.length+' fichier(s) d’image ou de son introuvable(s) : ils seront absents après restauration.');
 report.ok=true;report.state=s;report.version=c.version;return report;}
if(require.main===module){try{const dest=backup();console.log('Sauvegarde créée : '+dest);console.log('Images éventuelles sauvegardées dans le dossier .media correspondant, à conserver avec ce fichier.');console.log('Conservez ce fichier dans un endroit privé : il contient des informations de comptes et de personnages.');}catch(err){console.error('ERREUR : '+err.message);process.exitCode=1;}}
module.exports={backup,prune,mirror,checkMirrorDir,list,resolve,inspect};
