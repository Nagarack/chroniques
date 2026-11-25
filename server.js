'use strict';
/** Chroniques - web server behind HTTPS Cloudflare Tunnel (Node 20+; no dependencies).
 * HTTP MUST stay bound to loopback; the external Cloudflare tunnel terminates TLS. Do not port-forward this server.
 * This is a self-hosted beta, not a public Internet hosting service.
 */
const http=require('node:http');
const APP_VERSION=(()=>{try{return JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname,'package.json'),'utf8')).version;}catch{return '0';}})();
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {URL}=require('node:url');
const L=require('./src/logic');
const P=require('./src/progression');
const O=require('./src/origins');
const H=require('./src/heritage');
const S=require('./src/spells');
const G=require('./src/spell-guide');
const N=require('./src/creatures');
const M=require('./src/media');
const E=require('./src/encounters');
const C=require('./src/campaign-planner');
const F=require('./src/session-flow');
const CM=require('./src/campaign-maps');
const I=require('./src/inventory');
const MT=require('./src/map-treasure');
const SP=require('./src/scenario-planner');
const MEM=require('./src/campaign-memory');
const SS=require('./src/session-summary');
const ART=require('./src/art-catalog');
const HB=require('./src/homebrew-items');
const GEAR=require('./src/gear');
const SH=require('./src/shops');
const HO=require('./src/handouts');
const SC=require('./src/schedule');
const CG=require('./src/class-guide');
const WH=require('./src/whispers');
const CMP=require('./src/companions');
const WT=require('./src/world-time');
const AMB=require('./src/ambience');
const CT=require('./src/character-transfer');
const BK=require('./scripts/backup.js');
const UPD=require('./scripts/update.js');
const RU=require('./scripts/remote-update.js');
const CH=require('./src/character-history.js');
const PS=require('./src/party-stash.js');
const CTPL=require('./src/campaign-template.js');
const WP=require('./src/web-push.js');
const SD=require('./src/state-diff.js');
const TR=require('./src/travel.js');
const RT=require('./src/random-tables.js');
const AD=require('./src/area-damage.js');
const WA=require('./src/webauthn.js');
const FA=require('./src/factions.js');
const AI=require('./src/scenario-ai');
const root=__dirname;
const {getRemoteOrigin}=require('./src/network-config');
const random=(n=24)=>crypto.randomBytes(n).toString('base64url');
const sha=(s)=>crypto.createHash('sha256').update(s).digest('hex');
const PASS_MIN=12, MAX_BODY=65_536;
const SCORE_KEYS=['str','dex','con','int','wis','cha'];
const iconFiles=new Set((()=>{try{return fs.readdirSync(path.join(__dirname,'assets','icons')).filter(f=>/^[a-z0-9-]+\.svg$/.test(f)).map(f=>'/assets/icons/'+f);}catch{return [];}})());
const allowedStatic=new Map([
 ['/', ['index.html','text/html; charset=utf-8']],
 ['/guide.html',['GUIDE_UTILISATION.html','text/html; charset=utf-8']],
 ['/tutos.html',['TUTOS_EXPRESS.html','text/html; charset=utf-8']],
 ['/sw.js',['sw.js','text/javascript; charset=utf-8']],
 ['/src/pwa-register.js',['src/pwa-register.js','text/javascript; charset=utf-8']],
 ['/offline.html',['offline.html','text/html; charset=utf-8']],
 ['/src/styles.css',['src/styles.css','text/css; charset=utf-8']],
 ['/src/styles-light.css',['src/styles-light.css','text/css; charset=utf-8']],
 ['/src/theme.js',['src/theme.js','text/javascript; charset=utf-8']],
 ['/src/logic.js',['src/logic.js','text/javascript; charset=utf-8']],
 ['/src/progression.js',['src/progression.js','text/javascript; charset=utf-8']],
 ['/src/origins.js',['src/origins.js','text/javascript; charset=utf-8']],
 ['/src/heritage.js',['src/heritage.js','text/javascript; charset=utf-8']],
 ['/src/data/srd-spells-index.js',['src/data/srd-spells-index.js','text/javascript; charset=utf-8']],
 ['/src/rules-ref.js',['src/rules-ref.js','text/javascript; charset=utf-8']],
 ['/src/data/srd-regles-fr.js',['src/data/srd-regles-fr.js','text/javascript; charset=utf-8']],
 ['/src/world-time.js',['src/world-time.js','text/javascript; charset=utf-8']],
 ['/src/character-transfer.js',['src/character-transfer.js','text/javascript; charset=utf-8']],
 ['/src/app-extras.js',['src/app-extras.js','text/javascript; charset=utf-8']],
 ['/src/dom-morph.js',['src/dom-morph.js','text/javascript; charset=utf-8']],
 ['/src/data/srd-monstres-fr.js',['src/data/srd-monstres-fr.js','text/javascript; charset=utf-8']],
 ['/src/app-party.js',['src/app-party.js','text/javascript; charset=utf-8']],
 ['/src/app-prep.js',['src/app-prep.js','text/javascript; charset=utf-8']],
 ['/src/state-diff.js',['src/state-diff.js','text/javascript; charset=utf-8']],
 ['/src/app-chronicle.js',['src/app-chronicle.js','text/javascript; charset=utf-8']],
 ['/src/travel.js',['src/travel.js','text/javascript; charset=utf-8']],
 ['/src/factions.js',['src/factions.js','text/javascript; charset=utf-8']],
 ['/src/random-tables.js',['src/random-tables.js','text/javascript; charset=utf-8']],
 ['/src/area-damage.js',['src/area-damage.js','text/javascript; charset=utf-8']],
 ['/src/spells.js',['src/spells.js','text/javascript; charset=utf-8']],
 ['/src/spell-guide.js',['src/spell-guide.js','text/javascript; charset=utf-8']],
 ['/src/creatures.js',['src/creatures.js','text/javascript; charset=utf-8']],
 ['/src/art-catalog.js',['src/art-catalog.js','text/javascript; charset=utf-8']],
 ['/src/sheet-view.js',['src/sheet-view.js','text/javascript; charset=utf-8']],
 ['/src/mj-dashboard.js',['src/mj-dashboard.js','text/javascript; charset=utf-8']],
 ['/src/inventory.js',['src/inventory.js','text/javascript; charset=utf-8']],
 ['/src/qr.js',['src/qr.js','text/javascript; charset=utf-8']],
 ['/src/tour.js',['src/tour.js','text/javascript; charset=utf-8']],
 ['/src/gear.js',['src/gear.js','text/javascript; charset=utf-8']],
 ['/src/homebrew-items.js',['src/homebrew-items.js','text/javascript; charset=utf-8']],
 ['/src/ui-helpers.js',['src/ui-helpers.js','text/javascript; charset=utf-8']],
 ['/src/class-guide.js',['src/class-guide.js','text/javascript; charset=utf-8']],
 ['/src/session-summary.js',['src/session-summary.js','text/javascript; charset=utf-8']],
 ['/src/bestiary.js',['src/bestiary.js','text/javascript; charset=utf-8']],
 ['/src/item-catalog.js',['src/item-catalog.js','text/javascript; charset=utf-8']],
 ['/src/data/srd-monsters.js',['src/data/srd-monsters.js','text/javascript; charset=utf-8']],
 ['/src/data/srd-items.js',['src/data/srd-items.js','text/javascript; charset=utf-8']],
 ['/aide-joueur.html',['aide-joueur.html','text/html; charset=utf-8']],
 ['/aide-mj.html',['aide-mj.html','text/html; charset=utf-8']],
 ['/src/onboarding.js',['src/onboarding.js','text/javascript; charset=utf-8']],
 ['/src/quick-help.js',['src/quick-help.js','text/javascript; charset=utf-8']],
 ['/src/workspace-layout.js',['src/workspace-layout.js','text/javascript; charset=utf-8']],
 ['/src/combat-workspace.js',['src/combat-workspace.js','text/javascript; charset=utf-8']],
 ['/src/online-app.js',['src/online-app.js','text/javascript; charset=utf-8']],
 ['/manifest.webmanifest',['manifest.webmanifest','application/manifest+json']],
 ['/assets/icon-192.png',['assets/icon-192.png','image/png']],
 ['/assets/icon-512.png',['assets/icon-512.png','image/png']],
 ['/assets/atlas-background.svg',['assets/atlas-background.svg','image/svg+xml']],
 ['/assets/fonts/im-fell-english-latin-400-normal.woff2',['assets/fonts/im-fell-english-latin-400-normal.woff2','font/woff2']],
 ['/assets/fonts/im-fell-english-latin-400-italic.woff2',['assets/fonts/im-fell-english-latin-400-italic.woff2','font/woff2']],
 ['/assets/fonts/alegreya-sans-latin-400-normal.woff2',['assets/fonts/alegreya-sans-latin-400-normal.woff2','font/woff2']],
 ['/assets/fonts/alegreya-sans-latin-400-italic.woff2',['assets/fonts/alegreya-sans-latin-400-italic.woff2','font/woff2']],
 ['/assets/fonts/alegreya-sans-latin-500-normal.woff2',['assets/fonts/alegreya-sans-latin-500-normal.woff2','font/woff2']],
 ['/assets/fonts/alegreya-sans-latin-700-normal.woff2',['assets/fonts/alegreya-sans-latin-700-normal.woff2','font/woff2']],
 ]);
const sleepBlock=(err)=>Object.assign(new Error(err),{status:403});
function normalizeName(s){const v=String(s||'').trim();if(!/^[\p{L}\p{N}_ .'-]{3,40}$/u.test(v))throw Object.assign(new Error('Identifiant : 3 à 40 caractères (lettres, chiffres, espaces, - _ .).'),{status:400});return v;}
function passwordHash(pass,salt=random(16)){return {salt,hash:crypto.scryptSync(pass,salt,64).toString('hex')};}
function validPassword(p){if(typeof p!=='string'||p.length<PASS_MIN||p.length>128)throw Object.assign(new Error('Mot de passe : entre 12 et 128 caractères.'),{status:400});}
function checkPassword(pass,u){const attempted=crypto.scryptSync(String(pass||''),u.salt,64);const expected=Buffer.from(u.passHash,'hex');return attempted.length===expected.length&&crypto.timingSafeEqual(attempted,expected);}
function cookie(req,name){return (req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1)||'';}
function send(res,code,obj,headers={}){res.writeHead(code,{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers});res.end(JSON.stringify(obj));}
function readRaw(req,maxSize){return new Promise((resolve,reject)=>{const parts=[];let size=0;req.on('data',chunk=>{size+=chunk.length;if(size>maxSize){reject(Object.assign(new Error('Fichier trop volumineux (20 Mo maximum).'),{status:413}));req.destroy();return;}parts.push(chunk);});req.on('end',()=>resolve(Buffer.concat(parts)));req.on('error',reject);});}
function readBody(req,maxSize=MAX_BODY){return new Promise((resolve,reject)=>{let size=0,txt='';req.on('data',chunk=>{size+=chunk.length;if(size>maxSize){reject(Object.assign(new Error('Requête trop volumineuse'),{status:413}));req.destroy();return;}txt+=chunk;});req.on('end',()=>{try{resolve(JSON.parse(txt||'{}'));}catch{reject(Object.assign(new Error('JSON invalide'),{status:400}));}});req.on('error',reject);});}
function createServer(opts={}){
 const host=opts.host||'127.0.0.1';const dataFile=opts.dataFile||path.join(root,'data','chroniques-db.json');
 const backupRoot=opts.backupRoot||(opts.dataFile?path.join(path.dirname(dataFile),'..'):root);
 let backupCache={at:0,days:null};
 function lastBackupDays(){if(Date.now()-backupCache.at<60000)return backupCache.days;let newest=0;try{for(const f of fs.readdirSync(path.join(backupRoot,'backups')))if(/^chroniques-backup-.*\.json$/.test(f))newest=Math.max(newest,fs.statSync(path.join(backupRoot,'backups',f)).mtimeMs);}catch{}backupCache={at:Date.now(),days:newest?Math.floor((Date.now()-newest)/86400000):null};return backupCache.days;}
 if(!['127.0.0.1','localhost'].includes(host))throw new Error('SÉCURITÉ : serveur uniquement sur 127.0.0.1. Utilisez Cloudflare Tunnel pour un accès distant.');
 const publicOrigin=getRemoteOrigin(opts,root);
 const expectedHost=publicOrigin?new URL(publicOrigin).host:null;
 const secureCookies=Boolean(publicOrigin);
 let db;if(fs.existsSync(dataFile)){db=JSON.parse(fs.readFileSync(dataFile,'utf8'));}else{db={format:5,users:[],campaigns:[],invites:[]};}
 if(db.format!==5)throw new Error('Base de données incompatible. La V0.7.1 conserve le format V0.5/V0.6/V0.7.');
 // V4.1 : les anciennes versions proposaient des têtes de monstres (gobelin…) comme portraits d'aventuriers.
 // Une seule fois par campagne, ces icônes sont retirées : le portrait de la classe s'affiche à la place. Les photos importées restent.
 for(const c of db.campaigns||[]){const s=c.state;if(!s||s.migrations?.classPortraits)continue;const pcs=new Set((s.characters||[]).map(p=>p.id));
  if(Array.isArray(s.media))s.media=s.media.filter(m=>!(m.kind==='character'&&pcs.has(m.entityId)&&m.builtinId&&!ART.isPortrait(m.builtinId)));
  s.migrations={...(s.migrations||{}),classPortraits:true};}
 // V4.9 : notifications de rappel de séance (clés VAPID générées une fois, abonnements par appareil).
 function pushStore(){if(!db.push||typeof db.push!=='object')db.push={};if(!db.push.vapid){db.push.vapid=WP.createVapid();persist();}if(!Array.isArray(db.push.subs))db.push.subs=[];if(!db.push.sent||typeof db.push.sent!=='object')db.push.sent={};return db.push;}
 const pushOpts={allowHosts:opts.pushAllowHosts||[],allowHttp:!!opts.pushAllowHosts};
 async function pushTo(userIds,message){const st=pushStore();const targets=st.subs.filter(x=>userIds.includes(x.userId));let ok=0;const gone=[];
  for(const sub of targets){const r=await WP.send(st.vapid,sub,message,{subject:opts.pushSubject||process.env.CHRONIQUES_PUSH_CONTACT||'mailto:chroniques@localhost'});if(r.ok)ok++;if(r.gone)gone.push(sub.endpoint);}
  if(gone.length){st.subs=st.subs.filter(x=>!gone.includes(x.endpoint));persist();}return {sent:ok,total:targets.length,removed:gone.length};}
 // File de notifications par compte : lue par l'application Android (vérification périodique) et l'historique.
 function inboxAdd(userIds,message){const st=pushStore();if(!st.inbox||typeof st.inbox!=='object')st.inbox={};const at=new Date().toISOString();
  for(const id of new Set(userIds)){const list=st.inbox[id]||(st.inbox[id]=[]);list.push({id:random(8),at,title:message.title,body:message.body,tag:message.tag||'',url:message.url||'/'});if(list.length>30)list.splice(0,list.length-30);}persist();}
 async function notifyUsers(userIds,message){inboxAdd(userIds,message);return pushTo(userIds,message);}
 // « À vous de jouer » : seulement si l'application du joueur n'est pas affichée à l'écran.
 const lastTurnNotice=new Map();
 function present(userId){for(const x of listeners)if(x.userId===userId&&x.visible!==false)return true;return false;}
 function turnNotify(c){const cb=c.state.combat;if(!cb?.started)return;const active=L.activeId(c.state);const pc=L.findPc(c.state,active);if(!pc)return;
  const key=cb.round+'|'+active;if(lastTurnNotice.get(c.id)===key)return;lastTurnNotice.set(c.id,key);
  const st=pushStore();const users=c.members.filter(m=>m.characterId===pc.id&&(st.prefs?.[m.userId]?.turn!==false)&&!present(m.userId)).map(m=>m.userId);if(!users.length)return;
  notifyUsers(users,{title:'À vous de jouer !',body:pc.name+' · round '+cb.round+' · '+String(c.state.title||'').slice(0,60),tag:'tour-'+c.id,url:'/'}).catch(e=>console.error('Tour :',e.message));}
 async function sessionReminders(now=new Date()){const st=pushStore();if(!st.subs.length)return [];const done=[];
  for(const c of db.campaigns||[]){const sc=c.state?.schedule;const o=sc&&sc.chosen&&(sc.options||[]).find(x=>x.id===sc.chosen);if(!o||!WP.reminderDue(o.at,now))continue;
   const key=c.id+'|'+o.id+'|'+o.at;if(st.sent[key])continue;st.sent[key]=new Date().toISOString();persist();
   const when=new Date(o.at).toLocaleString('fr-FR',{weekday:'long',day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'});
   const r=await notifyUsers((c.members||[]).map(m=>m.userId),{title:'Séance de « '+String(c.state.title||'Chroniques').slice(0,60)+' »',body:'Rappel : '+when+(o.note?' · '+String(o.note).slice(0,100):''),url:'/',tag:'seance-'+o.id});done.push({campaignId:c.id,...r});}
  // Nettoyage des anciens envois (plus de 60 jours).
  for(const [k,v] of Object.entries(st.sent))if(Date.now()-Date.parse(v)>60*86400000)delete st.sent[k];return done;}
 const reminderTimer=opts.pushReminders===false?null:setInterval(()=>{sessionReminders().catch(e=>console.error('Rappels :',e.message));},10*60*1000);reminderTimer?.unref?.();
 const setupKey=opts.setupKey||process.env.CHRONIQUES_SETUP_KEY||random(18);
 const sessions=new Map();const listeners=new Set();const attempts=new Map();
 const aiKey=opts.aiKey!==undefined?opts.aiKey:process.env.CHRONIQUES_OPENAI_API_KEY;
 const aiModel=AI.model(opts.aiModel||process.env.CHRONIQUES_AI_MODEL||'gpt-4.1-mini');
 const aiFetch=opts.aiFetch||fetch;const aiPending=new Map(),aiCalls=new Map();
 const aiEnabled=typeof aiKey==='string'&&aiKey.trim().length>0;
 const mediaDir=path.join(path.dirname(dataFile),'media');
 // V4.2 — images importées pour les monstres et objets maison (fiches MJ uniquement).
 // Chaque créature déployée ou objet donné reçoit sa propre copie du fichier : supprimer l'un n'efface jamais l'autre.
 const LIB_FILE=/^[A-Za-z0-9_-]{32}\.(png|webp)$/;
 function libraryEntry(s,target,id){if(target==='template')return E.templates(s).find(t=>t.id===id)||null;if(target==='libitem')return HB.find(s,id);if(target==='handout')return HO.find(s,id);return null;}
 function libraryBytes(s){const lib=s.gmLibrary||{};return [...(lib.templates||[]),...(lib.items||[]),...(s.handouts||[])].reduce((t,x)=>t+(x.image?.bytes||0),0);}
 function copyLibraryImage(s,img){if(!img||!LIB_FILE.test(img.filename||''))return null;const from=path.join(mediaDir,img.filename);if(!fs.existsSync(from))return null;
  if(M.list(s).reduce((t,m)=>t+(m.bytes||0),0)+libraryBytes(s)+(img.bytes||0)>M.MAX_TOTAL)return null;
  const filename=random(24)+'.'+(img.mime==='image/png'?'png':'webp');fs.copyFileSync(from,path.join(mediaDir,filename));return {mime:img.mime,width:img.width,height:img.height,bytes:img.bytes,filename};}
 function attachArt(s,{kind,entityId,characterId='',visibility,image,icon}){if(M.list(s).length>=M.MAX_MEDIA)return;s.media??=[];
  const rec=image?copyLibraryImage(s,image):null;
  if(rec){s.media.push({id:'img-'+random(12),kind,entityId,characterId,visibility,caption:'',featured:true,...rec});return;}
  if(icon&&ART.get(icon,kind))s.media.push({id:'img-'+random(12),kind,entityId,characterId,visibility,caption:kind==='npc'?'Illustration du bestiaire':'',featured:true,builtinId:icon});}
 // Copie d'une image d'objet (déplacement partiel entre personnages, achat) : jamais de fichier partagé entre deux fiches.
 function cloneItemMedia(s,fromChar,fromItem,toChar,toItem,move){const recs=M.list(s).filter(m=>m.kind==='item'&&m.entityId===fromItem&&(m.characterId||'')===fromChar);
  for(const m of recs){if(move){m.entityId=toItem;m.characterId=toChar;continue;}if(M.list(s).length>=M.MAX_MEDIA)break;
   if(m.builtinId){s.media.push({...m,id:'img-'+random(12),entityId:toItem,characterId:toChar});continue;}
   const rec=copyLibraryImage(s,m);if(rec)s.media.push({id:'img-'+random(12),kind:'item',entityId:toItem,characterId:toChar,visibility:m.visibility,caption:m.caption||'',featured:!!m.featured,...rec});}}
 function logGm(s,msg){s.combat.log.unshift({id:random(5),msg,audience:'gm',when:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})});s.combat.log=s.combat.log.slice(0,60);}
 function logPublic(s,msg){s.combat.log.unshift({id:random(5),msg,when:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})});s.combat.log=s.combat.log.slice(0,60);}
 // Suppression différée : la fiche peut être restaurée par « Annuler » pendant quelques secondes. Le fichier n'est effacé
 // que s'il n'est plus référencé nulle part après ce délai.
 const fileGraceMs=opts.fileGraceMs??120000;
 function dropLibraryFile(img){if(!img||!LIB_FILE.test(img.filename||''))return;const name=img.filename;const t=setTimeout(()=>{try{if(!db.campaigns.some(c=>JSON.stringify(c.state).includes(name)))fs.unlinkSync(path.join(mediaDir,name));}catch{}},fileGraceMs);t.unref?.();}
 let lastAutoBackup=0;
 function autoBackup(){try{if(!fs.existsSync(dataFile)||Date.now()-lastAutoBackup<5*60*1000)return;lastAutoBackup=Date.now();const dir=path.join(path.dirname(dataFile),'auto-backups');fs.mkdirSync(dir,{recursive:true,mode:0o700});fs.copyFileSync(dataFile,path.join(dir,'db-'+new Date().toISOString().replace(/[:.]/g,'-')+'.json'));const old=fs.readdirSync(dir).filter(f=>/^db-.*\.json$/.test(f)).sort();for(const f of old.slice(0,Math.max(0,old.length-10)))fs.unlinkSync(path.join(dir,f));}catch(e){console.warn('Sauvegarde automatique impossible :',e.message);}}
 const dailyBackup=opts.dailyBackup??!opts.dataFile;
 const updatesDir=opts.updatesDir||path.join(root,'updates');const MAX_UPDATE=40*1024*1024;const canRestart=typeof opts.onRestart==='function';
 function updateStatus(){let pending=null,last=null;const z=path.join(updatesDir,'pending.zip');if(fs.existsSync(z)){try{pending=JSON.parse(fs.readFileSync(path.join(updatesDir,'pending.json'),'utf8'));}catch{pending={version:'?'};}}
  try{last=JSON.parse(fs.readFileSync(path.join(updatesDir,'derniere-mise-a-jour.json'),'utf8'));}catch{}
  const cfg=RU.readConfig(updateRoot);return {current:APP_VERSION,pending,last,launcher:canRestart,remote:{configured:!!cfg,auto:!!cfg?.autoDownload,github:!!cfg&&String(cfg.manifest).startsWith('github:'),hasToken:!!cfg?.token,available:remote.manifest?{version:remote.manifest.version,notes:remote.manifest.notes||'',size:remote.manifest.size}:null,checkedAt:remote.checkedAt,error:remote.error,downloading:remote.downloading}};}
 // V4.9 — mises à jour signées téléchargées automatiquement (jamais installées sans l'accord du MJ propriétaire).
 const apkFile=opts.apkFile||path.join(root,'android','chroniques.apk');
 const updateRoot=opts.updateRoot||root;const remote={manifest:null,checkedAt:null,error:null,downloading:false};
 async function remoteCheck(){const cfg=RU.readConfig(updateRoot);if(!cfg){remote.manifest=null;return null;}remote.checkedAt=new Date().toISOString();
  try{const m=await RU.fetchManifest(cfg,{allowHttp:!!opts.updateAllowHttp});remote.error=null;remote.manifest=UPD.cmp(m.version,APP_VERSION)>0?m:null;
   if(remote.manifest&&cfg.autoDownload)await remoteDownload().catch(e=>{remote.error=e.message;});return remote.manifest;}
  catch(e){remote.error=e.message;remote.manifest=null;throw e;}}
 async function remoteDownload(){const m=remote.manifest;if(!m)badRequest('Aucune nouvelle version annoncée.');if(remote.downloading)badRequest('Téléchargement déjà en cours.');
  try{const cur=JSON.parse(fs.readFileSync(path.join(updatesDir,'pending.json'),'utf8'));if(cur.version===m.version&&fs.existsSync(path.join(updatesDir,'pending.zip')))return;}catch{}
  const cfg=RU.readConfig(updateRoot);if(!cfg)badRequest('Source de mise à jour non configurée.');remote.downloading=true;fs.mkdirSync(updatesDir,{recursive:true});const tmp=path.join(updatesDir,'telechargement-'+random(6)+'.zip');
  try{await RU.download(cfg,m,tmp,{allowHttp:!!opts.updateAllowHttp});let info;try{info=UPD.inspectPackage(tmp);}catch(e){badRequest(e.message);}
   if(info.version!==m.version)badRequest('Le paquet téléchargé contient la version '+info.version+' au lieu de '+m.version+'.');
   fs.renameSync(tmp,path.join(updatesDir,'pending.zip'));fs.writeFileSync(path.join(updatesDir,'pending.json'),JSON.stringify({version:m.version,bytes:m.size,at:new Date().toISOString(),signed:true,notes:m.notes||''}));remote.error=null;}
  finally{remote.downloading=false;fs.rmSync(tmp,{force:true});}}
 const updateTimer=opts.updateCheck===false?null:setInterval(()=>{remoteCheck().catch(()=>{});},6*3600*1000);updateTimer?.unref?.();
 if(opts.updateCheck!==false){const t=setTimeout(()=>{remoteCheck().catch(()=>{});},120000);t.unref?.();}let lastDailyCheck=0;
 function dailyCheck(){if(!dailyBackup||Date.now()-lastDailyCheck<3600_000)return;lastDailyCheck=Date.now();setTimeout(()=>{try{const days=lastBackupDays();if(days===null||days>=1){BK.backup(backupRoot,{source:dataFile,mediaDir,auto:true,mirror:db.backupMirror||''});backupCache={at:0,days:null};}}catch(e){console.warn('Sauvegarde quotidienne impossible :',e.message);}},2000).unref?.();}
 function persist(){dailyCheck();const d=path.dirname(dataFile);fs.mkdirSync(d,{recursive:true,mode:0o700});autoBackup();const tmp=dataFile+'.tmp';fs.writeFileSync(tmp,JSON.stringify(db,null,2),{mode:0o600});fs.renameSync(tmp,dataFile);}
 function sessionFor(req){const x=sessions.get(sha(cookie(req,'chroniques_sid')));return x&&x.expires>=Date.now()?x:null;}
 function memberOf(c,uid){return c?.members?.find(m=>m.userId===uid)||null;}
 function memberCampaigns(uid){return db.campaigns.filter(c=>memberOf(c,uid));}
 function login(res,u,campaignId=null){
  const sid=random(32),first=memberCampaigns(u.id)[0];
  sessions.set(sha(sid),{uid:u.id,campaignId:campaignId||first?.id||null,mode:null,expires:Date.now()+7*864e5});
  res.setHeader('Set-Cookie',`chroniques_sid=${sid}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${secureCookies?'; Secure':''}`);
 }
 function endSessionStreams(sessionHash){for(const item of [...listeners]){if(item.sessionHash===sessionHash){listeners.delete(item);try{item.res.end();}catch{}}}}
 // Les rôles stockés dans users sont historiques : l'autorisation dépend UNIQUEMENT de la campagne active.
 function who(req){
  const session=sessionFor(req);if(!session)return null;
  const original=db.users.find(u=>u.id===session.uid);if(!original)return null;
  const available=memberCampaigns(original.id);
  let c=available.find(x=>x.id===session.campaignId);
  if(!c){c=available[0];session.campaignId=c?.id||null;session.mode=null;}
  if(!c)return null;
  const membership=memberOf(c,original.id);
  const mode=membership.role==='gm'&&session.mode==='player'?'player':membership.role;
  return {...original,role:mode,accessRole:membership.role,characterId:membership.characterId||null,
   activeCampaignId:c.id,viewMode:mode};
 }
 function requireUser(req){const u=who(req);if(!u)throw Object.assign(new Error('Connexion nécessaire.'),{status:401});return u;}
 function currentCampaign(u){const c=db.campaigns.find(x=>x.id===u.activeCampaignId);if(!c||!memberOf(c,u.id))throw sleepBlock('Vous ne participez pas à cette campagne.');return c;}
 function requireGm(u){if(u.assistantElevated)return;const c=currentCampaign(u);if(u.role!=='gm'||memberOf(c,u.id)?.role!=='gm')throw sleepBlock('Accès réservé au MJ.');}
 function requireOwner(u){const c=currentCampaign(u);if(u.role!=='gm'||c.ownerId!==u.id)throw sleepBlock('Accès réservé au MJ propriétaire.');}
 function campaign(){return db.campaigns[0];}
 function listCampaigns(u){return {activeId:u.activeCampaignId,mode:u.viewMode,
  campaigns:memberCampaigns(u.id).map(c=>({id:c.id,title:c.state?.title||'Campagne',role:memberOf(c,u.id).role,
   isOwner:c.ownerId===u.id,characterId:memberOf(c,u.id).characterId||null}))};}
 // V5 : synchronisation légère. Chaque réponse porte une étiquette ; si l'appareil renvoie l'étiquette de
 // la dernière réponse reçue, on ne lui envoie que les différences.
 const syncCache=new Map();
 // Actions permises au co-MJ restreint : tout ce qui concerne les créatures pendant le combat, rien d'autre.
 const ASSISTANT_KINDS=new Set(['npcAdd','npcUpdate','npcRemove','npcHp','npcCondition','conditionTimer','npcConcentration','npcConcentrationResult','npcLegendary','npcActionLog','npcSlot','npcRecharge','npcDefense','lairDone','next','turnTimer','turnTimerRestart','templateDeploy','encounterDeploy']);
 function syncOut(req,c,full,since){const key=sha(cookie(req,'chroniques_sid')||'')+'|'+c.id;const prev=syncCache.get(key);const tag=random(9);const text=JSON.stringify(full.state);let out=full;
  if(since&&prev&&prev.tag===since){try{const ops=SD.diff(JSON.parse(prev.text),full.state);if(ops){out={...full,patch:ops,base:since};delete out.state;}}catch{}}
  syncCache.delete(key);syncCache.set(key,{tag,text});while(syncCache.size>300)syncCache.delete(syncCache.keys().next().value);
  return {...out,syncTag:tag};}
 function projected(c,u){let full=L.clone(c.state);if(u.role!=='gm'){{const fp=FA.projected(c.state);full.factionMeta=fp.factionMeta;full.relations=fp.relations;}if(full.recap?.published)full.recap={text:full.recap.text,published:true,updatedAt:full.recap.updatedAt};else delete full.recap;
  delete full.gmNotes;
  delete full.lootStash; // Trésor du MJ : jamais envoyé au joueur.
  delete full.storyPlans; // Scénarios et secrets de préparation réservés MJ/co-MJ.
  {const sp=SS.projected(c.state);full.sessionStats=sp.sessionStats;full.sessionHistory=sp.sessionHistory;} // Résumés : seulement ceux publiés par le MJ.
  if(full.combat){delete full.combat.lairPending;delete full.combat.lairRound;} // Peut nommer des créatures masquées.
  full.handouts=HO.projected(c.state,u); // Seulement les documents envoyés à ce joueur.
  full.shops=SH.projected(c.state,u); // Joueurs : boutiques ouvertes uniquement.
  full.whispers=WH.projected(c.state,u); // Chuchotements : uniquement le fil de ce personnage.
  full.worldTime=WT.projected(c.state); // Date du monde et événements partagés seulement.
  full.campaignMemory=MEM.projected(c.state); // Mémoire partageable et notes MJ supprimées côté serveur.
  delete full.gmLibrary; // Préparations, notes et modèles de rencontres : MJ uniquement.
  full.campaignPlanner=C.projected(c.state); // L'API ne transmet jamais les notes privées ni les fiches non publiées.
  full.sessionFlow=F.projected(c.state); // Uniquement scènes publiées ; aucune rencontre ni note privée.
  full.characters=full.characters.map(p=>{
   if(p.id===u.characterId)return {...p,history:CH.forPlayer(p.history)}; // Notes secrètes du MJ retirées.
   // Shared party combat summary only; never send other characters' abilities, inventories or private notes.
   return {id:p.id,name:p.name,role:p.role,job:p.job,level:p.level,stats:{hp:p.stats.hp,ac:p.stats.ac},speed:p.speed,hp:p.hp,tempHp:p.tempHp,initiative:p.initiative,
    owner:null,conditions:p.conditions,concentration:p.concentration,exhaustion:p.exhaustion,economy:{...p.economy},
    resources:[],abilities:[],deathSaves:{success:0,failure:0}};
  });
  if(full.combat)full.combat.timers=(full.combat.timers||[]).filter(t=>full.characters.some(p=>p.id===t.id)); // Durées des créatures du MJ : jamais envoyées.
 }
 if(u.role!=='gm')full=N.project(full);
 full.media=M.projected(c.state,u);
 full.ambience=AMB.projected(c.state); // Jamais les noms de fichiers sur disque.
 if(u.role!=='gm')full.randomTables=RT.projected(c.state); // Tables privées du MJ : jamais envoyées.
 full.maps=CM.projected(c.state,u);
 // Le projecteur commun ne doit jamais transmettre les données de la fiche source
 // si la créature est masquée. Le MJ choisit librement le titre public.
 const spotlight=c.state.spotlight;
 const shown=spotlight&&M.list(c.state).find(m=>m.id===spotlight.mediaId);
 full.spotlight=shown&&M.canReadFile(c.state,u,shown)?{id:spotlight.id,title:spotlight.title,mediaId:shown.id,builtinId:shown.builtinId||null}:null;
 full.claimedCharacterIds=c.members.filter(m=>m.characterId).map(m=>m.characterId);
  // V5 — co-MJ restreint (« assistant ») : vue de joueur + combat complet + monstres et rencontres de la bibliothèque.
  if(u.role==='assistant'&&full.combat){full.combat={...L.clone(c.state.combat),log:full.combat.log};const lib=c.state.gmLibrary||{};full.gmLibrary={templates:L.clone(lib.templates||[]),encounters:L.clone(lib.encounters||[])};}
  return {version:c.version,viewer:{name:u.name,role:u.role,accessRole:u.accessRole,characterId:u.characterId||null,isOwner:c.ownerId===u.id,campaignId:c.id,canUndo:u.role==='gm'&&canUndo(c),...(c.ownerId===u.id?{lastBackupDays:lastBackupDays()}:{})},state:full};
 }
 function publish(c){for(const x of [...listeners]){if(x.campaignId!==c.id)continue;try{const user=db.users.find(u=>u.id===x.userId),session=sessions.get(x.sessionHash),member=user&&memberOf(c,user.id);const role=member?.role==='gm'&&session?.mode==='player'?'player':member?.role||'player';x.res.write(`event: update\ndata: ${JSON.stringify({version:c.version,campaignId:c.id,role})}\n\n`);}catch{listeners.delete(x);}}}
 function badRequest(msg){throw Object.assign(new Error(msg),{status:400});}
 function cleanText(value,label,max=70,min=1){if(typeof value!=='string'){badRequest(label+' invalide.');}const v=value.trim();if(v.length<min||v.length>max)badRequest(label+' : '+min+' à '+max+' caractères.');return v;}
 function intValue(value,label,min,max){if(typeof value!=='number'||!Number.isSafeInteger(value)||value<min||value>max)badRequest(label+' : valeur invalide.');return value;}
 function floatValue(value,label,min,max){if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max||Math.round(value*2)!==value*2)badRequest(label+' : valeur invalide (par pas de 0,5).');return value;}
 function gmOverview(c){
  const now=Date.now();const pcs=c.state.characters;
  return {ownerId:c.ownerId,
   members:c.members.filter(m=>m.characterId).map(m=>({userId:m.userId,name:db.users.find(u=>u.id===m.userId)?.name||'Compte indisponible',characterId:m.characterId,characterName:pcs.find(p=>p.id===m.characterId)?.name||'Personnage absent',role:m.role})),
   roleAssignments:c.members.map(m=>({userId:m.userId,name:db.users.find(u=>u.id===m.userId)?.name||'Compte indisponible',role:m.role,isOwner:m.userId===c.ownerId,characterId:m.characterId||null})),
   invites:db.invites.filter(i=>i.campaignId===c.id&&!i.used&&i.expires>now).map(i=>({id:i.id||i.codeHash,characterId:i.characterId,characterName:pcs.find(p=>p.id===i.characterId)?.name||'Personnage absent',expiresAt:i.expires}))};
 }
 function editPc(s,a,id,b){
  const p=L.findPc(s,id);if(!p||!L.canEdit(s,a,id))throw sleepBlock('Accès refusé à cette fiche.');
  if(!b.values||typeof b.values!=='object'||Array.isArray(b.values))badRequest('Fiche incorrecte.');
  const v=b.values;
  const data={name:cleanText(v.name,'Nom'),role:cleanText(v.role,'Espèce',50),job:cleanText(v.job,'Classe',50),
   level:intValue(v.level,'Niveau',1,20),hpMax:intValue(v.hpMax,'PV maximum',1,500),ac:intValue(v.ac,'Classe d’armure',1,40),passive:intValue(v.passive,'Perception passive',0,40),speed:floatValue(v.speed,'Vitesse',0,120)};
  if(!v.scores||typeof v.scores!=='object'||Array.isArray(v.scores))badRequest('Caractéristiques manquantes.');
  const scores={};for(const key of SCORE_KEYS){if(v.scores[key]===null)continue;scores[key]=intValue(v.scores[key],key.toUpperCase(),1,30);}
  // L'éditeur affiche les scores finaux. Si une origine est configurée, conserver
  // les scores de base à part pour éviter de réappliquer les bonus à chaque édition.
  if(p.origin?.edition===s.edition){
   try{p.origin.baseScores=O.fromFinalScores(Object.fromEntries(O.KEYS.map(k=>[k,scores[k]??null])),p.origin.bonuses);}catch(e){badRequest(e.message);}
  }
  Object.assign(p,{name:data.name,role:data.role,job:data.job,level:data.level,speed:data.speed});
  p.stats.hp=data.hpMax;p.stats.ac=data.ac;p.stats.passive=data.passive;p.stats.abilities=scores;
  p.hp=Math.min(p.hp,p.stats.hp);p.economy.movement=Math.min(p.economy.movement,p.speed);
  s.combat.log.unshift({id:random(5),msg:'Fiche mise à jour · '+p.name,when:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})});
 }
 function resourceOperation(s,a,id,b,remove){
  const p=L.findPc(s,id);if(!p||!L.canEdit(s,a,id))throw sleepBlock('Accès refusé à cette fiche.');
  if(remove){const idx=p.resources.findIndex(r=>r.id===b.resourceId);if(idx<0)badRequest('Ressource introuvable.');if(p.abilities.some(x=>x.cost?.resource===b.resourceId))badRequest('Retirez d’abord les capacités qui utilisent cette ressource.');p.resources.splice(idx,1);return;}
  if(p.resources.length>=30)badRequest('Maximum 30 ressources.');
  const name=cleanText(b.name,'Nom de ressource',70);const max=intValue(b.max,'Maximum',1,100);
  if(!['short','long'].includes(b.rest))badRequest('Type de repos invalide.');
  p.resources.push({id:'res-'+random(6),name,left:max,max,rest:b.rest});
 }
 function abilityOperation(s,a,id,b,remove){
  const p=L.findPc(s,id);if(!p||!L.canEdit(s,a,id))throw sleepBlock('Accès refusé à cette fiche.');
  if(remove){const idx=p.abilities.findIndex(x=>x.id===b.abilityId);if(idx<0)badRequest('Capacité introuvable.');p.abilities.splice(idx,1);return;}
  if(p.abilities.length>=35)badRequest('Maximum 35 capacités.');
  const name=cleanText(b.name,'Nom de capacité',70),description=cleanText(b.description||'','Description',240,0);
  if(!['action','bonus','reaction','free'].includes(b.type))badRequest('Type de capacité invalide.');
  const ab={id:'cap-'+random(6),name,type:b.type,description,concentration:b.concentration===true};
  if(b.resourceId){const res=p.resources.find(r=>r.id===b.resourceId);if(!res)badRequest('Ressource inexistante.');ab.cost={resource:res.id,amount:1};}
  p.abilities.push(ab);
 }
 function logEvents(s,reached){for(const e of reached||[]){const msg='📅 Événement : '+e.title+(e.note&&e.shared?' — '+e.note:'');if(e.shared)logPublic(s,msg);else s.combat.log.unshift({id:random(5),msg,audience:'gm',when:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})});}}
 // Import d'un personnage exporté : chaque partie passe par les validations habituelles ; les éléments invalides sont ignorés et signalés.
 function importCharacter(s,a,data){const c=CT.check(data);const skipped=[];
  const pc=L.addPc(s,'mj',{name:cleanText(c.name,'Nom'),role:String(c.role||''),job:String(c.job||''),level:Number(c.level)||1,hp:Number(c.hpMax)||10,ac:Number(c.ac)||10});
  const scores=Object.fromEntries(SCORE_KEYS.map(k=>[k,Number.isInteger(c.scores?.[k])?c.scores[k]:null]));
  editPc(s,'mj',pc.id,{values:{name:c.name,role:c.role||'Humain',job:c.job||'Aventurier',level:Number(c.level)||1,hpMax:Number(c.hpMax)||10,ac:Number(c.ac)||10,passive:Number.isInteger(c.passive)?c.passive:10,speed:typeof c.speed==='number'?c.speed:9,scores}});
  pc.hp=pc.stats.hp;pc.xp=Math.max(0,Math.min(9999999,Math.floor(Number(c.xp)||0)));
  if(c.classId&&Object.hasOwn(P.CLASSES,c.classId)&&s.edition!=='custom'){pc.progression={classId:c.classId,subclass:typeof c.subclass==='string'?c.subclass.slice(0,70):'',spentSlots:null,skills:{}};}
  const resIds={};for(const r of (Array.isArray(c.resources)?c.resources:[]).slice(0,30)){try{resourceOperation(s,'mj',pc.id,{name:r.name,max:r.max,rest:r.rest});resIds[r.name]=pc.resources[pc.resources.length-1].id;}catch{skipped.push('ressource « '+String(r?.name||'?').slice(0,40)+' »');}}
  for(const x of (Array.isArray(c.abilities)?c.abilities:[]).slice(0,35)){try{abilityOperation(s,'mj',pc.id,{name:x.name,type:x.type,description:x.description||'',concentration:x.concentration===true,resourceId:x.resource&&resIds[x.resource]||''});}catch{skipped.push('capacité « '+String(x?.name||'?').slice(0,40)+' »');}}
  for(const it of (Array.isArray(c.inventory)?c.inventory:[]).slice(0,70)){try{I.add(pc,'item-'+random(8),it);}catch{skipped.push('objet « '+String(it?.name||'?').slice(0,40)+' »');}}
  if(c.coins){try{I.money(pc,c.coins);}catch{skipped.push('monnaie');}}
  const classId=P.progression(pc,s.edition).classId;
  for(const sp of (Array.isArray(c.spells)?c.spells:[]).slice(0,100)){try{if(sp.spellId)S.add(pc,classId,s.edition,{spellId:String(sp.spellId),prepared:sp.prepared===true,allowOutsideClass:true},'sp-'+random(8));else S.add(pc,classId,s.edition,{custom:sp.custom,prepared:sp.prepared===true},'sp-'+random(8));}catch{skipped.push('sort');}}
  for(const x of (Array.isArray(c.companions)?c.companions:[]).slice(0,CMP.MAX)){try{CMP.add(pc,'cmp-'+random(8),x);}catch{skipped.push('compagnon');}}
  if(typeof c.privateNotes==='string')pc.privateNotes=c.privateNotes.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').slice(0,6000);
  if(Array.isArray(c.history))pc.history=c.history.slice(-CH.MAX).map(e=>({id:random(8),at:/^\d{4}-\d\d-\d\dT/.test(String(e?.at||''))?String(e.at).slice(0,30):new Date().toISOString(),world:String(e?.world||'').slice(0,60),session:null,text:String(e?.text||'').replace(/[\u0000-\u001f]/g,' ').slice(0,300)})).filter(e=>e.text.trim());
  (pc.history??=[]).push({id:random(8),at:new Date().toISOString(),world:'',session:null,text:'Rejoint la campagne'+(data.from?.campaign?' (venant de « '+String(data.from.campaign).slice(0,60)+' »)':'')+'.'});
  logPublic(s,'Personnage importé : '+pc.name+(skipped.length?' ('+skipped.length+' élément(s) ignoré(s) : '+[...new Set(skipped)].slice(0,6).join(', ')+')':'')+'.');return pc;}
 const UNDOABLE={hp:'PV',areaDamage:'dégâts de zone',tableRemove:'suppression de table',exhaustion:'épuisement',npcLegendary:'action légendaire',defense:'défense',npcDefense:'défense de créature',npcHp:'PV créature',tempHp:'PV temporaires',condition:'état',npcCondition:'état créature',next:'tour suivant',conditionTimer:'durée d’état',start:'début du combat',end:'fin du combat',deathSave:'jet contre la mort',init:'initiative',sortInitiative:'tri de l’initiative',move:'déplacement',moveInitiative:'ordre d’initiative',resetTurn:'réinitialisation du tour',spend:'dépense d’action',slot:'emplacement de sort',castSpell:'sort lancé',resource:'ressource',concentration:'concentration',resolveConcentration:'concentration',rest:'repos',npcAdd:'ajout de créature',npcUpdate:'modification de créature',npcRemove:'retrait de créature',libItemDelete:'objet maison supprimé',handoutDelete:'document supprimé',shopDelete:'marchand supprimé',shopItemRemove:'article retiré',mapAreaClear:'zones effacées',scheduleClear:'dates effacées',scheduleRemove:'date retirée',templateDelete:'monstre supprimé',encounterDelete:'rencontre supprimée',restLongAll:'repos long du groupe',xpAward:'XP distribuée',milestone:'jalon'};
 const undoStacks=new Map();
 function canUndo(c){const st=undoStacks.get(c.id);const top=st&&st[st.length-1];return Boolean(top&&top.version===c.version);}
 function undo(c,u){requireGm(u);const st=undoStacks.get(c.id)||[];const top=st[st.length-1];if(!top||top.version!==c.version){undoStacks.delete(c.id);badRequest('Rien à annuler : l’état a changé depuis la dernière action.');}
  st.pop();const s=top.state;s.combat.log.unshift({id:random(5),msg:'↩ Action annulée · '+top.label,when:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})});s.changeCount=(s.changeCount||0)+1;s.lastEdited=new Date().toISOString();
  c.state=s;c.version++;if(st.length)st[st.length-1].version=c.version;persist();publish(c);return projected(c,u);}
 function apply(c,u,b){if(!Number.isSafeInteger(b.baseVersion)||b.baseVersion!==c.version)throw Object.assign(new Error('Une modification plus récente existe : état actualisé. Réessayez.'),{status:409});
  if(typeof b.kind!=='string')badRequest('Opération manquante.');if(b.kind==='undo')return undo(c,u);const s=L.clone(c.state);const a=u.role==='gm'?'mj':u.characterId;
  const deletedMapFiles=[];
  const id=String(b.id||'');const n=(v,min,max)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)badRequest('Valeur numérique incorrecte.');return v;};
  switch(b.kind){
  case 'mapAdd':{requireGm(u);CM.add(s,'map-'+random(10),b.values);break;}
  case 'mapUpdate':{requireGm(u);CM.update(s,id,b.values);break;}
  case 'mapVisibilitySet':{requireGm(u);CM.setMapVisibility(s,id,b.visibility);break;}
  case 'mapMarkerVisibilitySet':{requireGm(u);CM.setMarkerVisibility(s,id,String(b.markerId||''),b.visibility);break;}
  case 'mapDelete':{requireGm(u);const gone=CM.remove(s,id);if(gone.filename)deletedMapFiles.push(gone.filename);for(const mark of gone.markers||[])if(mark.image?.source==='upload')deletedMapFiles.push(mark.image.filename);break;}
  case 'mapGrid':{requireGm(u);CM.setGrid(s,id,b.values);break;}
  case 'mapFog':{requireGm(u);CM.setFog(s,id,String(b.op||''),b.values);break;}
  case 'mapCompanionToken':{const map=CM.read(s,id);if(!map||!CM.canRead(u,map))throw sleepBlock('Carte non accessible.');const n=N.find(s,String(b.npcId||''));if(!n?.ownerPc||!L.canEdit(s,a,n.ownerPc))throw sleepBlock('Seul le maître du compagnon peut le placer.');
   CM.tokenAdd(s,id,'tok-'+random(10),{kind:'npc',refId:n.id,label:n.name.slice(0,40),color:'vert',visible:true,x:Number(b.x)||500,y:Number(b.y)||500});break;}
  case 'mapTokenAdd':{requireGm(u);const v=b.values||{};let label=v.label,visible=v.visible;
   if(v.kind==='pc'){const pc=L.findPc(s,String(v.refId||''));if(!pc)badRequest('Personnage introuvable.');label=pc.name;visible=true;}
   if(v.kind==='npc'){const n=N.find(s,String(v.refId||''));if(!n)badRequest('Créature introuvable.');label=n.name;if(visible===undefined)visible=n.visibility==='public';}
   CM.tokenAdd(s,id,'tok-'+random(10),{...v,label:String(label||'').slice(0,40),visible});break;}
  case 'mapTokenMove':{const map=CM.read(s,id);if(!map||!CM.canRead(u,map))throw sleepBlock('Carte non accessible.');const t=CM.tokenRead(s,id,String(b.tokenId||''));if(!t)badRequest('Jeton introuvable.');
   const cmpNpc=t.kind==='npc'?N.find(s,t.refId):null;
   if(u.role!=='gm'&&!(t.kind==='pc'&&t.visible&&L.canEdit(s,a,t.refId))&&!(cmpNpc?.ownerPc&&t.visible&&L.canEdit(s,a,cmpNpc.ownerPc)))throw sleepBlock('Vous ne pouvez déplacer que votre propre jeton.');CM.tokenMove(s,id,t.id,b.x,b.y);break;}
  case 'mapTokenSet':{requireGm(u);CM.tokenSet(s,id,String(b.tokenId||''),b.values);break;}
  case 'mapTokenRemove':{requireGm(u);CM.tokenRemove(s,id,String(b.tokenId||''));break;}
  case 'mapAreaAdd':{const map=CM.read(s,id);if(!map||!CM.canRead(u,map))throw sleepBlock('Carte non accessible.');CM.areaAdd(s,id,'zone-'+random(8),b.values,a);break;}
  case 'mapAreaRemove':{const map=CM.read(s,id);if(!map||!CM.canRead(u,map))throw sleepBlock('Carte non accessible.');const z=(map.areas||[]).find(x=>x.id===String(b.areaId||''));if(!z)badRequest('Zone introuvable.');if(u.role!=='gm'&&z.by!==a)throw sleepBlock('Seul le MJ ou l’auteur peut retirer cette zone.');CM.areaRemove(s,id,z.id);break;}
  case 'mapAreaClear':{requireGm(u);CM.areaClear(s,id);break;}
  case 'mapMarkerAdd':{requireGm(u);CM.markerAdd(s,id,'pin-'+random(10),b.values);break;}
  case 'mapMarkerUpdate':{requireGm(u);const before=CM.markerRead(s,id,String(b.markerId||''))?.image;const after=CM.markerUpdate(s,id,String(b.markerId||''),b.values);if(before?.source==='upload'&&before.filename!==after.image?.filename)deletedMapFiles.push(before.filename);break;}
  case 'mapMarkerDelete':{requireGm(u);const removed=CM.markerRemove(s,id,String(b.markerId||''));if(removed.image?.source==='upload')deletedMapFiles.push(removed.image.filename);break;}
  case 'mapLootAdd':{requireGm(u);try{MT.add(s,id,String(b.markerId||''),'chest-'+random(9),b.values);}catch(e){badRequest(e.message);}break;}
  case 'mapLootFromStash':{requireGm(u);try{MT.fromStash(s,id,String(b.markerId||''),String(b.lootId||''),'chest-'+random(9),b.quantity);}catch(e){badRequest(e.message);}break;}
  case 'mapLootGive':{requireGm(u);const pc=L.findPc(s,String(b.characterId||''));if(!pc)badRequest('Personnage introuvable.');try{MT.toCharacter(s,id,String(b.markerId||''),String(b.lootId||''),pc,'item-'+random(8),b.quantity);}catch(e){badRequest(e.message);}break;}
  case 'mapLootToStash':{requireGm(u);try{MT.toStash(s,id,String(b.markerId||''),String(b.lootId||''),'loot-'+random(9),b.quantity);}catch(e){badRequest(e.message);}break;}
  case 'mapLootRemove':{requireGm(u);try{MT.remove(s,id,String(b.markerId||''),String(b.lootId||''));}catch(e){badRequest(e.message);}break;}
  case 'mapLootReveal':{requireGm(u);try{MT.reveal(s,id,String(b.markerId||''),b.revealed);}catch(e){badRequest(e.message);}break;}
  case 'sessionStart':requireGm(u);SS.startNew(s);break;
  case 'sessionPublish':requireGm(u);try{SS.publish(s,String(b.id||''),b.value);}catch(e){badRequest(e.message);}break;
  case 'portraitsByClass':{requireGm(u);s.media??=[];const pcs=new Set(s.characters.map(p=>p.id));
   // Retire uniquement les icônes du catalogue des portraits ; les photos importées restent. Le portrait de classe s'affiche par défaut.
   const owners=new Set(s.media.filter(m=>m.kind==='character'&&pcs.has(m.entityId)&&!m.builtinId).map(m=>m.entityId));
   s.media=s.media.filter(m=>!(m.kind==='character'&&pcs.has(m.entityId)&&m.builtinId&&!owners.has(m.entityId)));break;}
  case 'memoryAdd':{requireGm(u);MEM.add(s,'mem-'+random(10),b.values);break;}
  case 'memoryUpdate':{requireGm(u);MEM.update(s,id,b.values);break;}
  case 'memoryDelete':{requireGm(u);MEM.remove(s,id);break;}
  case 'storyAdd':{requireGm(u);SP.add(s,'story-'+random(10),b.values);break;}
  case 'storyUpdate':{requireGm(u);SP.update(s,id,b.values);break;}
  case 'storyDelete':{requireGm(u);SP.remove(s,id);break;}
  case 'sceneAdd':{requireGm(u);const sc=F.add(s,'sc-'+random(10),b.values);if(sc.status==='active'&&sc.trackId)AMB.play(s,sc.trackId,s.ambience?.playing?.volume);break;}
  case 'sceneUpdate':{requireGm(u);const before=(s.sessionFlow||[]).find(x=>x.id===id)?.status;const sc=F.update(s,id,b.values);if(sc.status==='active'&&before!=='active'&&sc.trackId){AMB.play(s,sc.trackId,s.ambience?.playing?.volume);const t=AMB.projected(s).tracks?.find(x=>x.id===sc.trackId);logGm(s,'♫ Ambiance de la scène « '+sc.title+' » : '+(t?.name||'piste')+'.');}break;}
  case 'sceneDelete':{requireGm(u);F.remove(s,id);break;}
  case 'plannerAdd':{requireGm(u);C.add(s,String(b.section||''),'cp-'+random(10),b.values);break;}
  case 'plannerUpdate':{requireGm(u);C.update(s,String(b.section||''),id,b.values);break;}
  case 'plannerDelete':{requireGm(u);C.remove(s,String(b.section||''),id);break;}
  case 'templateAdd':{requireGm(u);E.addTemplate(s,'tpl-'+random(9),b.values,b.icon);break;}
  case 'templateFromNpc':{requireGm(u);const npcId=cleanText(b.npcId,'Créature source',110);const chosen=M.lookup(s,'npc',npcId,'');E.fromNpc(s,'tpl-'+random(9),npcId,chosen?.builtinId||'');break;}
  case 'templateUpdate':{requireGm(u);E.editTemplate(s,id,b.values,b.icon);break;}
  case 'templateDelete':{requireGm(u);const old=E.templates(s).find(t=>t.id===id)?.image;E.removeTemplate(s,id);dropLibraryFile(old);break;}
  case 'templateDeploy':{requireGm(u);const t=E.templates(s).find(x=>x.id===id);if(!t)badRequest('Monstre maison introuvable.');const q=intValue(b.quantity??1,'Nombre',1,12);
   const group=q>1?('g-'+random(10)).toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,40):'';const {id:_i,icon,image,...base}=t;
   for(let i=1;i<=q;i++){const nid='npc-'+random(9);const v={...base,name:q>1?(t.name+' '+i).slice(0,70):t.name,group};delete v.legendaryMax;delete v.legendaryLeft;
    try{N.add(s,nid,v);}catch(e){badRequest(e.message);}attachArt(s,{kind:'npc',entityId:nid,visibility:t.visibility==='public'?'public':'private',image,icon});}
   L.sortInitiative(s,a);break;}
  case 'encounterAdd':{requireGm(u);E.addEncounter(s,'enc-'+random(9),b.name,b.notes||'');break;}
  case 'encounterUpdate':{requireGm(u);E.editEncounter(s,id,b.name,b.notes||'');break;}
  case 'encounterDelete':{requireGm(u);E.removeEncounter(s,id);break;}
  case 'encounterGroupAdd':{requireGm(u);E.addGroup(s,id,'grp-'+random(9),b.templateId,b.quantity);break;}
  case 'encounterGroupRemove':{requireGm(u);E.removeGroup(s,id,b.groupId);break;}
  case 'encounterDeploy':{
   requireGm(u);
   const launched=E.deploy(s,id,()=> 'npc-'+random(9));
   for(const creature of launched.created){
    const tpl=E.templates(s).find(t=>t.id===creature.templateId);
    attachArt(s,{kind:'npc',entityId:creature.id,visibility:creature.visibility==='public'?'public':'private',image:tpl?.image,icon:creature.icon});
   }
   L.sortInitiative(s,a);
   // Journal exclusivement MJ : une rencontre peut contenir des créatures cachées.
   s.combat.log.unshift({id:random(5),msg:'Rencontre préparée ajoutée · '+launched.encounter.name+' ('+launched.created.length+' créatures)',audience:'gm',when:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})});
   break;
  }
  case 'spotlightShow':{
   requireGm(u);
   const media=M.list(s).find(m=>m.id===b.mediaId);
   if(!media||!M.target(s,media.kind,media.entityId,media.characterId))badRequest('Illustration introuvable.');
   s.spotlight={id:'show-'+random(10),mediaId:media.id,title:cleanText(b.title||'Illustration du Maître du Jeu','Titre de présentation',90)};
   break;}
  case 'spotlightHide':requireGm(u);delete s.spotlight;break;
  case 'itemAdd':{
   const pc=L.findPc(s,id);if(!pc||!L.canEdit(s,a,id))throw sleepBlock('Accès refusé à cet inventaire.');
   if(b.values?.attuned&&GEAR.attunedCount(pc)>=GEAR.MAX_ATTUNED)badRequest('Déjà '+GEAR.MAX_ATTUNED+' objets harmonisés : retirez une harmonisation d’abord.');
   try{I.add(pc,'item-'+random(8),b.values||{name:b.name,description:b.description||''});}catch(e){badRequest(e.message);}break;}
  case 'itemUpdate':case 'itemAdjust':{
   const pc=L.findPc(s,id);if(!pc||!L.canEdit(s,a,id))throw sleepBlock('Accès refusé à cet inventaire.');
   if(b.kind==='itemUpdate'&&b.values?.attuned){const cur=I.list(pc).find(x=>x.id===String(b.itemId||''));if(!cur?.attuned&&GEAR.attunedCount(pc,cur?.id)>=GEAR.MAX_ATTUNED)badRequest('Déjà '+GEAR.MAX_ATTUNED+' objets harmonisés : retirez une harmonisation d’abord.');}
   try{if(b.kind==='itemUpdate')I.update(pc,String(b.itemId||''),b.values);else I.adjust(pc,String(b.itemId||''),b.field,b.delta);}catch(e){badRequest(e.message);}break;}
  case 'itemUse':{
   const pc=L.findPc(s,id);if(!pc||!L.canEdit(s,a,id))throw sleepBlock('Accès refusé à cet inventaire.');const item=I.list(pc).find(x=>x.id===String(b.itemId||''));if(!item)badRequest('Objet introuvable.');
   const info=GEAR.useInfo(item);if(!info)badRequest('Cet objet ne s’utilise pas depuis l’inventaire.');
   if(info.consumes==='charge'){if(!(item.charges>0))badRequest('Plus aucune charge.');item.charges--;}else{if(!((item.quantity??1)>0))badRequest('Plus aucun exemplaire.');item.quantity=(item.quantity??1)-1;}
   let healed=0;if(info.kind==='heal'&&b.healing!=null){const [lo,hi]=GEAR.diceRange(info.dice)||[1,999];healed=intValue(b.healing,'Résultat des dés',lo,hi);const before=pc.hp;L.changeHp(s,a,id,healed,'');healed=pc.hp-before;}
   logPublic(s,pc.name+(info.kind==='heal'?' boit '+item.name+(b.healing!=null?' (+'+healed+' PV)':''):info.consumes==='charge'?' utilise une charge de '+item.name+' ('+item.charges+'/'+item.chargesMax+')':' utilise '+item.name+' (reste '+item.quantity+')')+'.');break;}
  case 'setAc':{const pc=L.findPc(s,id);if(!pc||!L.canEdit(s,a,id))throw sleepBlock('Accès refusé à cette fiche.');const before=pc.stats.ac;pc.stats.ac=intValue(b.value,'Classe d’armure',1,40);logPublic(s,pc.name+' · CA '+before+' → '+pc.stats.ac+' (équipement).');break;}
  case 'itemTransfer':{
   const from=L.findPc(s,id);if(!from||!L.canEdit(s,a,id))throw sleepBlock('Vous ne pouvez donner que vos propres objets.');const to=L.findPc(s,String(b.toId||''));if(!to||to.id===from.id)badRequest('Destinataire introuvable.');
   const item=I.list(from).find(x=>x.id===String(b.itemId||''));if(!item)badRequest('Objet introuvable.');const qty=intValue(b.quantity??1,'Quantité',1,999);if(qty>(item.quantity??1))badRequest('Quantité insuffisante.');
   const newId='item-'+random(8);const whole=qty===(item.quantity??1);
   try{I.add(to,newId,{...item,quantity:qty,equipped:false,attuned:false});}catch(e){badRequest(e.message);}
   if(whole){from.inventoryItems=I.list(from).filter(x=>x.id!==item.id);}else item.quantity-=qty;
   cloneItemMedia(s,from.id,item.id,to.id,newId,whole);logPublic(s,from.name+' donne '+(qty>1?qty+' × ':'')+item.name+' à '+to.name+'.');break;}
  case 'coinsSplit':{requireGm(u);const ids=Array.isArray(b.ids)?[...new Set(b.ids.map(String))]:[];const pcs=ids.map(x=>L.findPc(s,x)).filter(Boolean);if(!pcs.length||pcs.length!==ids.length)badRequest('Choisissez au moins un personnage.');
   const amounts={};for(const k of I.MONEY)amounts[k]=intValue(b.amounts?.[k]??0,'Montant '+k,0,9_999_999);if(!Object.values(amounts).some(Boolean))badRequest('Indiquez un montant à partager.');
   const {share,rest}=GEAR.splitCoins(amounts,pcs.length);for(const p of pcs){p.coins??={};for(const k of I.MONEY)p.coins[k]=Math.min(999999,(Number(p.coins[k])||0)+share[k]);}
   const fmt=o=>I.MONEY.filter(k=>o[k]).map(k=>o[k]+' '+GEAR.COIN_FR[k]).join(' ')||'rien';logPublic(s,'Partage du butin : '+fmt(share)+' pour chacun ('+pcs.map(p=>p.name).join(', ')+')'+(Object.values(rest).some(Boolean)?' · reste '+fmt(rest)+' non partagé':'')+'.');break;}
  case 'tableMap':{requireGm(u);const mid=b.mapId==null?null:String(b.mapId);if(mid){const m=CM.read(s,mid);if(!m)badRequest('Carte introuvable.');if(m.visibility!=='shared')badRequest('Partagez d’abord la carte avec les joueurs : l’écran de table n’affiche que ce qu’ils peuvent voir.');}s.tableMapId=mid;break;}
  case 'restShort':{const pc=L.findPc(s,id);if(!pc||!L.canEdit(s,a,id))throw sleepBlock('Accès refusé à cette fiche.');const cls=pc.progression?.classId||P.detectClass(pc.job);const info=CG.info(cls);
   const avail=Math.max(0,pc.level-(pc.hitDiceUsed||0));const dice=intValue(b.dice??0,'Dés de vie',0,avail);let healed=0;
   if(dice>0){const die=info?info.die:12;const total=intValue(b.total,'Total des dés',dice,dice*die);const con=CG.mod(pc.stats?.abilities?.con??10);const gain=Math.max(dice,total+dice*con);const before=pc.hp;L.changeHp(s,a,id,gain,'');healed=pc.hp-before;pc.hitDiceUsed=(pc.hitDiceUsed||0)+dice;}
   L.rest(s,a,id,'short');P.recoverSlots(pc,s.edition,'short');H.recover(pc,s.edition,'short');if(dice)logPublic(s,pc.name+' dépense '+dice+' dé'+(dice>1?'s':'')+' de vie : +'+healed+' PV.');break;}
  case 'restLongAll':{requireGm(u);if(s.worldTime?.enabled&&b.advanceTime!==false){const reached=WT.advance(s,480);logPublic(s,'⏳ 8 heures passent · '+WT.format(s.worldTime,s.worldTime.minutes));logEvents(s,reached);}const done=[],skipped=[];for(const pc of s.characters){if(pc.hp<=0){skipped.push(pc.name);continue;}L.rest(s,'mj',pc.id,'long');P.recoverSlots(pc,s.edition,'long');H.recover(pc,s.edition,'long');done.push(pc.name);}
   logPublic(s,'Repos long du groupe'+(done.length?' : '+done.join(', '):'')+(skipped.length?' · à 0 PV, pas de repos : '+skipped.join(', '):'')+'.');break;}
  case 'xpAward':{requireGm(u);const ids=Array.isArray(b.ids)?[...new Set(b.ids.map(String))]:[];const pcs=ids.map(x=>L.findPc(s,x)).filter(Boolean);if(!pcs.length||pcs.length!==ids.length)badRequest('Choisissez au moins un personnage.');
   const amount=intValue(b.amount,'XP par personnage',1,1000000);const reason=cleanText(b.reason||'','Raison',80,0);const ready=[];
   for(const p of pcs){p.xp=Math.min(9999999,(Number(p.xp)||0)+amount);const nxt=CG.XP_LEVELS[p.level];if(p.level<20&&nxt!=null&&p.xp>=nxt){p.levelUpReady=true;ready.push(p.name);}}
   logPublic(s,'+'+amount.toLocaleString('fr-FR')+' XP pour '+pcs.map(p=>p.name).join(', ')+(reason?' ('+reason+')':'')+'.'+(ready.length?' Niveau supérieur disponible : '+ready.join(', ')+'.':''));break;}
  case 'milestone':{requireGm(u);const ids=Array.isArray(b.ids)?[...new Set(b.ids.map(String))]:[];const pcs=ids.map(x=>L.findPc(s,x)).filter(Boolean);if(!pcs.length||pcs.length!==ids.length)badRequest('Choisissez au moins un personnage.');
   for(const p of pcs)if(p.level<20)p.levelUpReady=true;logPublic(s,'Jalon atteint : '+pcs.map(p=>p.name).join(', ')+' peuvent passer au niveau suivant.');break;}
  case 'scheduleAdd':{requireGm(u);SC.add(s,'date-'+random(8),b.values);break;}
  case 'scheduleRemove':{requireGm(u);SC.remove(s,id);break;}
  case 'scheduleAnswer':{const charId=u.role==='gm'?String(b.characterId||''):a;if(!L.findPc(s,charId)||(u.role!=='gm'&&!L.canEdit(s,a,charId)))throw sleepBlock('Vous répondez uniquement pour votre personnage.');SC.answer(s,charId,String(b.optionId||''),String(b.value||''));break;}
  case 'scheduleChoose':{requireGm(u);SC.choose(s,b.optionId==null?null:String(b.optionId));const o=SC.next(s);if(o)logPublic(s,'Prochaine séance fixée : '+new Date(o.at).toLocaleString('fr-FR',{weekday:'long',day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'})+(o.note?' ('+o.note+')':'')+'.');break;}
  case 'scheduleClear':{requireGm(u);SC.clear(s);break;}
  case 'handoutAdd':{requireGm(u);HO.add(s,'doc-'+random(9),b.values);break;}
  case 'handoutUpdate':{requireGm(u);HO.update(s,id,b.values);break;}
  case 'handoutDelete':{requireGm(u);const old=HO.find(s,id)?.image;HO.remove(s,id);dropLibraryFile(old);break;}
  case 'handoutSend':{requireGm(u);const h=HO.send(s,id,b.recipients);logPublic(s,'Le MJ envoie un document : « '+h.title+' »'+(h.recipients==='all'?' à toute la table':' à '+h.recipients.map(x=>L.findPc(s,x)?.name).filter(Boolean).join(', '))+'.');break;}
  case 'handoutRetract':{requireGm(u);HO.retract(s,id);break;}
  case 'handoutRead':{if(u.role==='gm')break;HO.markRead(s,id,u.characterId);break;}
  case 'shopAdd':{requireGm(u);SH.add(s,'shop-'+random(9),b.values);break;}
  case 'shopUpdate':{requireGm(u);SH.update(s,id,b.values);break;}
  case 'shopDelete':{requireGm(u);SH.remove(s,id);break;}
  case 'shopOpen':{requireGm(u);const shop=SH.setOpen(s,id,b.open);if(shop.open)logPublic(s,'La boutique « '+shop.name+' » est ouverte.');break;}
  case 'shopItemAdd':{requireGm(u);let v=b.values||{};if(b.libItemId){const hb=HB.find(s,String(b.libItemId));if(!hb)badRequest('Objet maison introuvable.');v={...v,values:HB.toInventory(hb,1),icon:hb.icon||'',libItemId:hb.id};}SH.itemAdd(s,id,'art-'+random(9),v);break;}
  case 'shopItemSet':{requireGm(u);SH.itemSet(s,id,String(b.itemId||''),b.values);break;}
  case 'shopItemRemove':{requireGm(u);SH.itemRemove(s,id,String(b.itemId||''));break;}
  case 'shopBuy':{const pc=L.findPc(s,String(b.characterId||''));if(!pc||!L.canEdit(s,a,pc.id))throw sleepBlock('Vous ne pouvez acheter que pour votre personnage.');
   const newId='item-'+random(8);const out=SH.buy(s,pc,id,String(b.itemId||''),b.quantity??1,newId,{gm:u.role==='gm'});
   attachArt(s,{kind:'item',entityId:newId,characterId:pc.id,visibility:'public',image:out.entry.libItemId?HB.find(s,out.entry.libItemId)?.image:null,icon:out.entry.icon});
   logPublic(s,pc.name+' achète '+(out.item.quantity>1?out.item.quantity+' × ':'')+out.item.name+' ('+GEAR.formatPrice(out.total)+') chez '+out.shop.name+'.');break;}
  case 'moneySet':{
   const pc=L.findPc(s,id);if(!pc||!L.canEdit(s,a,id))throw sleepBlock('Accès refusé à la monnaie.');
   try{I.money(pc,b.coins);}catch(e){badRequest(e.message);}break;}
  case 'libItemAdd':{requireGm(u);HB.add(s,'hb-'+random(10),b.values);break;}
  case 'libItemUpdate':{requireGm(u);HB.update(s,id,b.values);break;}
  case 'libItemDelete':{requireGm(u);const old=HB.find(s,id)?.image;HB.remove(s,id);dropLibraryFile(old);break;}
  case 'libItemGive':{requireGm(u);const item=HB.find(s,id);if(!item)badRequest('Objet maison introuvable.');const qty=intValue(b.quantity??1,'Quantité',1,99);
   if(b.characterId==='__loot'){try{I.lootAdd(s,'loot-'+random(9),HB.toInventory(item,qty));}catch(e){badRequest(e.message);}break;}
   const pc=L.findPc(s,String(b.characterId||''));if(!pc)badRequest('Personnage introuvable.');const newId='item-'+random(8);
   try{I.add(pc,newId,HB.toInventory(item,qty));}catch(e){badRequest(e.message);}
   attachArt(s,{kind:'item',entityId:newId,characterId:pc.id,visibility:'public',image:item.image,icon:item.icon});
   s.combat.log.unshift({id:random(5),msg:pc.name+' reçoit '+(qty>1?qty+' × ':'')+item.name+'.',when:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})});s.combat.log=s.combat.log.slice(0,60);break;}
  case 'lootAdd':{requireGm(u);try{I.lootAdd(s,'loot-'+random(9),b.values);}catch(e){badRequest(e.message);}break;}
  case 'lootGive':{requireGm(u);const pc=L.findPc(s,id);if(!pc)badRequest('Personnage introuvable.');
   try{I.give(s,pc,String(b.lootId||''),'item-'+random(8),b.quantity);}catch(e){badRequest(e.message);}break;}
  case 'lootRemove':{requireGm(u);try{I.lootRemove(s,String(b.lootId||''));}catch(e){badRequest(e.message);}break;}
  case 'itemRemove':{
   const pc=L.findPc(s,id);if(!pc||!L.canEdit(s,a,id))throw sleepBlock('Accès refusé à cet inventaire.');
   const old=I.items(pc),idx=old.findIndex(x=>x.id===b.itemId);if(idx<0)badRequest('Objet introuvable.');
   old.splice(idx,1);s.media=M.list(s).filter(x=>!(x.kind==='item'&&x.entityId===b.itemId&&x.characterId===id));break;}
  case 'start':L.startCombat(s,a);break;
  case 'npcAdd':{requireGm(u);try{N.add(s,'npc-'+random(9),b.values);L.sortInitiative(s,a);}catch(e){badRequest(e.message);}break;}
  case 'npcUpdate':{requireGm(u);try{N.update(s,id,b.values);if(!s.combat.started&&!s.combat.manualOrder)L.sortInitiative(s,a);}catch(e){badRequest(e.message);}break;}
  case 'npcRemove':{requireGm(u);try{N.remove(s,id);L.sortInitiative(s,a);}catch(e){badRequest(e.message);}break;}
  case 'npcHp':{const target=N.find(s,id);if(u.role!=='gm'&&!(target?.ownerPc&&L.canEdit(s,a,target.ownerPc)))throw sleepBlock('Action réservée au MJ.');try{N.hp(s,id,b.delta,String(b.damageType||''));}catch(e){badRequest(e.message);}CMP.syncFromNpc(s,N.find(s,id));break;}
  // --- Chuchotements MJ ↔ joueur ---
  case 'whisperSend':{const charId=u.role==='gm'?String(b.charId||''):u.characterId;if(!charId||!L.findPc(s,charId))badRequest('Destinataire introuvable.');WH.send(s,'wh-'+random(10),charId,u.role==='gm'?'mj':charId,b.text);break;}
  case 'whisperRead':{const charId=u.role==='gm'?String(b.charId||''):u.characterId;if(!charId)break;if(!WH.markRead(s,charId,u.role==='gm'?'mj':charId))return projected(c,u);break;}
  case 'whisperClear':{requireGm(u);WH.clearThread(s,String(b.charId||''));break;}
  // --- Compagnons, familiers, montures ---
  case 'companionAdd':case 'companionUpdate':case 'companionRemove':case 'companionHp':case 'companionDeploy':case 'companionRecall':{
   const pc=L.findPc(s,id);if(!pc||!L.canEdit(s,a,id))throw sleepBlock('Accès refusé à cette fiche.');const cid=String(b.companionId||'');
   if(b.kind==='companionAdd')CMP.add(pc,'cmp-'+random(8),b.values);
   if(b.kind==='companionUpdate')CMP.update(pc,cid,b.values);
   if(b.kind==='companionRemove')CMP.remove(s,pc,cid);
   if(b.kind==='companionHp')CMP.hp(s,pc,cid,b.delta);
   if(b.kind==='companionDeploy'){const n=CMP.deploy(s,pc,cid,'npc-'+random(9));logPublic(s,n.name+' ('+pc.name+') rejoint le combat.');}
   if(b.kind==='companionRecall'){const n=CMP.recall(s,pc,cid);logPublic(s,n.name+' ('+pc.name+') quitte le combat.');}
   break;}
  // --- Calendrier du monde ---
  case 'worldTimeEnable':{requireGm(u);if(b.on===false){if(s.worldTime)s.worldTime.enabled=false;}else{WT.get(s).enabled=true;}break;}
  case 'worldTimeSet':{requireGm(u);WT.setDate(s,b.values);logPublic(s,'📅 Nous sommes le '+WT.format(s.worldTime,s.worldTime.minutes)+'.');break;}
  case 'worldTimeAdvance':{requireGm(u);if(!s.worldTime?.enabled)badRequest('Activez d’abord le calendrier du monde.');const minutes=Number(b.minutes);const reached=WT.advance(s,minutes);const why=String(b.reason||'').replace(/[\u0000-\u001f]/g,' ').trim().slice(0,60);
   logPublic(s,'⏳ '+WT.duration(minutes)+(why?' ('+why+')':'')+' · '+WT.format(s.worldTime,s.worldTime.minutes));logEvents(s,reached);if(s.travel)for(const m of TR.tickLights(s,minutes))logPublic(s,m.text);break;}
  case 'worldCalendar':{requireGm(u);WT.setCalendar(s,b.values||{});break;}
  case 'worldEventAdd':{requireGm(u);WT.eventAdd(s,'wev-'+random(8),b.values);break;}
  case 'worldEventRemove':{requireGm(u);WT.eventRemove(s,id);break;}
  case 'worldEventDone':{requireGm(u);WT.eventDone(s,id,b.done);break;}
  // --- Objectifs de quête ---
  case 'questObjectiveAdd':{requireGm(u);C.objectiveAdd(s,id,'obj-'+random(8),b.values);break;}
  case 'questObjectiveSet':{requireGm(u);const o=C.objectiveSet(s,id,String(b.objectiveId||''),b.values);if(b.values&&'done' in b.values&&o.done&&!o.secret){const q=C.board(s).quests.find(x=>x.id===id);if(q?.visibility==='shared')logPublic(s,'✔ Objectif accompli · '+q.title+' : '+o.text);}break;}
  case 'questObjectiveRemove':{requireGm(u);C.objectiveRemove(s,id,String(b.objectiveId||''));break;}
  case 'questObjectiveMove':{requireGm(u);C.objectiveMove(s,id,String(b.objectiveId||''),Number(b.dir));break;}
  // --- Ambiance sonore ---
  case 'ambiencePlay':{requireGm(u);AMB.play(s,String(b.trackId||''),b.volume);break;}
  case 'ambienceStop':{requireGm(u);AMB.stop(s);break;}
  case 'ambienceVolume':{requireGm(u);AMB.volume(s,b.volume);break;}
  case 'ambienceUpdate':{requireGm(u);AMB.update(s,String(b.trackId||''),b.values);break;}
  case 'ambiencePlayers':{requireGm(u);AMB.setPlayers(s,b.on===true);break;}
  case 'ambienceDelete':{requireGm(u);const t=AMB.remove(s,String(b.trackId||''));for(const sc of s.sessionFlow||[])if(sc.trackId===t?.id)delete sc.trackId;if(t?.filename&&AMB.FILE.test(t.filename))deletedMapFiles.push(t.filename);break;}
  // --- Personnage importé d'une autre campagne ---
  // Carnet personnel : visible du joueur du personnage et du MJ seulement (les autres reçoivent une fiche réduite).
  case 'pcNotesSave':{const pc=L.findPc(s,id);if(!pc||!L.canEdit(s,a,id))throw sleepBlock('Accès refusé à cette fiche.');const t=String(b.text??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'');if(t.length>6000)badRequest('Carnet : 6 000 caractères maximum.');pc.privateNotes=t;pc.privateNotesAt=new Date().toISOString();break;}
  // Coffre commun du groupe.
  case 'stashDeposit':{const pc=L.findPc(s,id);if(!pc||!L.canEdit(s,a,id))throw sleepBlock('Vous ne pouvez déposer que vos propres objets.');const r=PS.deposit(s,pc,b.itemId,b.quantity,'item-'+random(8));if(r.newId)cloneItemMedia(s,pc.id,r.item.id,'party-stash',r.newId,r.whole);logPublic(s,'🧰 '+pc.name+' dépose '+(r.count>1?r.count+' × ':'')+r.item.name+' dans le coffre du groupe.');break;}
  case 'stashWithdraw':{const pc=L.findPc(s,id);if(!pc||!L.canEdit(s,a,id))throw sleepBlock('Accès refusé à cet inventaire.');const r=PS.withdraw(s,pc,b.itemId,b.quantity,'item-'+random(8),u.role==='gm');if(r.newId)cloneItemMedia(s,'party-stash',r.item.id,pc.id,r.newId,r.whole);logPublic(s,'🧰 '+pc.name+' prend '+(r.count>1?r.count+' × ':'')+r.item.name+' dans le coffre du groupe.');break;}
  case 'stashCoins':{const pc=L.findPc(s,id);if(!pc||!L.canEdit(s,a,id))throw sleepBlock('Accès refusé à cette bourse.');const dir=String(b.direction||'');const amt=PS.coins(s,pc,b.amounts,dir,u.role==='gm');const txt=I.MONEY.filter(k=>amt[k]).map(k=>amt[k]+' '+GEAR.COIN_FR[k]).join(' ');logPublic(s,'🧰 '+pc.name+(dir==='in'?' dépose ':' prend ')+txt+(dir==='in'?' dans':' dans')+' le coffre du groupe.');break;}
  case 'stashAdd':{requireGm(u);const it=PS.add(s,'item-'+random(8),b.values||{});logPublic(s,'🧰 Le MJ place '+it.name+' dans le coffre du groupe.');break;}
  case 'stashRemove':{requireGm(u);PS.remove(s,String(b.itemId||''));break;}
  case 'stashSettings':{requireGm(u);PS.settings(s,b);break;}
  // Voyage et exploration.
  case 'travelStart':{requireGm(u);const t=TR.start(s,b.values||{});logPublic(s,'🧭 Départ vers '+t.destination+(t.distanceKm?' ('+t.distanceKm.toLocaleString('fr-FR')+' km)':'')+' · rythme '+TR.PACES[t.pace].label.toLowerCase()+'.');break;}
  case 'travelPace':{requireGm(u);TR.setPace(s,String(b.pace||''));logPublic(s,'🧭 Rythme '+TR.PACES[s.travel.pace].label.toLowerCase()+(TR.PACES[s.travel.pace].note?' — '+TR.PACES[s.travel.pace].note:'')+'.');break;}
  case 'travelAdvance':{requireGm(u);const hours=Number(b.hours);const msgs=TR.advance(s,hours);if(s.worldTime?.enabled){const reached=WT.advance(s,hours*60);logEvents(s,reached);}
   logPublic(s,'🧭 '+hours+' h de marche · '+String(s.travel.doneKm).replace('.',',')+(s.travel.distanceKm?' / '+String(s.travel.distanceKm).replace('.',','):'')+' km'+(s.worldTime?.enabled?' · '+WT.format(s.worldTime,s.worldTime.minutes):''));for(const m of msgs)logPublic(s,m.text);break;}
  case 'travelCamp':{requireGm(u);for(const m of TR.camp(s))logPublic(s,'⛺ '+m.text);break;}
  case 'travelRations':{requireGm(u);const missing=TR.eatRations(s,I);logPublic(s,'🍞 Une ration décomptée pour chacun'+(missing.length?' · '+missing.join(', '):'')+'.');break;}
  case 'areaDamage':{requireGm(u);const type=String(b.damageType||'');if(type&&!L.DAMAGE_TYPES.includes(type))badRequest('Type de dégâts inconnu.');
   const lookup=(kind,tid)=>kind==='pc'?(()=>{const p=L.findPc(s,tid);return p?{name:p.name,defenses:p.defenses||{}}:null;})():kind==='npc'?(()=>{const n=N.find(s,tid);return n?{name:n.name,defenses:n.defenses||{}}:null;})():null;
   let rows;try{rows=AD.plan({amount:b.amount,type,onSave:String(b.onSave||'half'),targets:(Array.isArray(b.targets)?b.targets:[]).map(t=>({kind:String(t?.kind||''),id:String(t?.id||''),saved:t?.saved===true})),lookup});}catch(e){badRequest(e.message);}
   const label=String(b.label||'').replace(/[\u0000-\u001f]/g,' ').trim().slice(0,60);
   logPublic(s,'💥 '+(label||'Dégâts de zone')+' : '+Number(b.amount)+(type?' '+type.toLowerCase():'')+' · '+rows.length+' cible'+(rows.length>1?'s':'')+(String(b.onSave)==='none'?' (aucun dégât si sauvegarde réussie)':' (moitié si sauvegarde réussie)'));
   for(const r of rows){if(!r.base)continue;if(r.kind==='pc')L.changeHp(s,a,r.id,-r.base,type);else{N.hp(s,r.id,-r.base,type);CMP.syncFromNpc(s,N.find(s,r.id));}}
   break;}
  case 'tableAdd':{requireGm(u);RT.add(s,'rt-'+random(10),b.values||{});break;}
  case 'tableUpdate':{requireGm(u);RT.update(s,String(b.tableId||''),b.values||{});break;}
  case 'tableRemove':{requireGm(u);RT.remove(s,String(b.tableId||''));break;}
  case 'tableRoll':{requireGm(u);const r=RT.roll(s,String(b.tableId||''),b.total,b.shared===true);const msg='🎲 '+r.table.name+' ('+r.table.die+' : '+r.entry.total+') → '+(r.row?r.row.text:'aucune ligne');if(r.entry.shared)logPublic(s,msg);else logGm(s,msg);break;}
  case 'travelEnd':{requireGm(u);TR.end(s);logPublic(s,'🧭 Fin du voyage.');break;}
  case 'lightAdd':{requireGm(u);const pc=b.values?.pcId?L.findPc(s,String(b.values.pcId)):null;if(b.values?.pcId&&!pc)badRequest('Personnage introuvable.');const l=TR.lightAdd(s,'li-'+random(8),{...b.values,pcId:pc?.id||''},pc?.name||'');logPublic(s,'🕯 '+l.label+(l.owner?' ('+l.owner+')':'')+' allumée — '+TR.fmtMin(l.minutesLeft)+'.');break;}
  case 'lightRemove':{requireGm(u);TR.lightRemove(s,String(b.lightId||''));break;}
  // Factions, réputation et relations.
  case 'factionMembers':{requireGm(u);FA.setMembers(s,String(b.id||''),b.members);break;}
  case 'factionRep':{requireGm(u);const r=FA.reputation(s,String(b.id||''),b.delta);const why=String(b.reason||'').replace(/[\u0000-\u001f]/g,' ').trim().slice(0,80);
   const msg='Réputation auprès de « '+r.faction.name+' » : '+FA.repLabel(r.after)+' ('+(r.after>r.before?'+':'')+(r.after-r.before)+(why?', '+why:'')+').';
   if(r.faction.visibility==='shared'){logPublic(s,'⚜ '+msg);CH.all(s,msg);}else logGm(s,'⚜ '+msg+' (faction privée)');break;}
  case 'relationAdd':{requireGm(u);FA.relationAdd(s,'rel-'+random(9),b.values||{});break;}
  case 'relationRemove':{requireGm(u);FA.relationRemove(s,String(b.id||''));break;}
  case 'recapSave':{requireGm(u);const t=String(b.text??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim();if(t.length>4000)badRequest('Texte : 4 000 caractères maximum.');s.recap={text:t,published:b.published===true&&!!t,table:b.table===true&&!!t,updatedAt:new Date().toISOString()};break;}
  case 'historyNote':{requireGm(u);CH.note(s,id,b.text,b.secret===true);break;}
  case 'historyRemove':{requireGm(u);CH.remove(s,id,String(b.entryId||''));break;}
  case 'importPc':{requireGm(u);if(s.characters.length>=30)badRequest('Maximum 30 personnages.');importCharacter(s,a,b.data);break;}
  case 'npcCondition':{requireGm(u);try{N.condition(s,id,b.condition);}catch(e){badRequest(e.message);}break;}
  case 'conditionTimer':requireGm(u);try{L.setConditionTimer(s,a,id,String(b.condition||''),b.rounds,{when:b.when,anchor:b.anchor,save:b.save});}catch(e){badRequest(e.message);}break;
  case 'npcConcentration':requireGm(u);N.concentration(s,id,b.text);break;
  case 'npcConcentrationResult':requireGm(u);N.concentrationResult(s,id,String(b.checkId||''),String(b.result||''));break;
  // Minuteur de tour (facultatif) : affiché sur l'écran de table et chez le joueur actif ; il ne fait jamais passer le tour.
  case 'turnTimer':{requireGm(u);const sec=Math.floor(Number(b.seconds));if(!(sec===0||(sec>=15&&sec<=600)))badRequest('Minuteur : 0 (désactivé) ou 15 à 600 secondes.');s.combat.turnTimer=sec;s.combat.turnStartedAt=new Date().toISOString();break;}
  case 'turnTimerRestart':{requireGm(u);s.combat.turnStartedAt=new Date().toISOString();break;}
  case 'next':L.nextTurn(s,a);break;
  case 'end':L.endCombat(s,a);break;
  case 'init':{requireGm(u);const creature=N.find(s,id);if(creature){creature.initiative=intValue(b.value,'Initiative',-99,99);if(creature.group)for(const m of s.combat.npcs||[])if(m.group===creature.group)m.initiative=creature.initiative;if(!s.combat.started&&!s.combat.manualOrder)L.sortInitiative(s,a);/* initiative saisie après jet réel */}else L.setInitiative(s,a,id,n(b.value,-99,99));break;}
  case 'sortInitiative':L.sortInitiative(s,a);break;
  case 'moveInitiative':requireGm(u);L.moveInitiative(s,a,id,intValue(b.direction,'Déplacement',-1,1));break;
  case 'resolveConcentration':if(!['success','failure'].includes(b.result))badRequest('Résultat de sauvegarde invalide.');L.resolveConcentration(s,a,id,String(b.checkId||''),b.result);break;
  case 'spend':L.spendType(s,a,id,String(b.type||''));break;
  case 'resetTurn':L.resetEconomy(s,a,id);break;
  case 'ability':L.useAbility(s,a,id,String(b.abilityId||''));break;
  case 'move':L.updateMovement(s,a,id,n(b.value,0,1000));break;
  case 'hp':if(b.damageType&&!L.DAMAGE_TYPES.includes(String(b.damageType)))badRequest('Type de dégâts inconnu.');L.changeHp(s,a,id,n(b.delta,-10000,10000),String(b.damageType||''));break;
  case 'exhaustion':if(![1,-1].includes(Number(b.delta)))badRequest('Valeur d’épuisement incorrecte.');L.setExhaustion(s,a,id,Number(b.delta));break;
  case 'defense':if(!L.DAMAGE_TYPES.includes(String(b.type||'')))badRequest('Type de dégâts inconnu.');if(b.value&&!L.DEFENSE_STATES[String(b.value)])badRequest('Défense inconnue.');L.setDefense(s,a,id,String(b.type),String(b.value||''));break;
  case 'npcLegendary':requireGm(u);try{N.legendary(s,id,String(b.op||''),b.cost,b.text||'');}catch(e){badRequest(e.message);}break;
  case 'npcActionLog':requireGm(u);try{N.actionLog(s,id,b.text,b.recharge);}catch(e){badRequest(e.message);}break;
  case 'npcSlot':requireGm(u);try{N.slot(s,id,b.level==='reset'?'reset':b.level,Number(b.delta)||1);}catch(e){badRequest(e.message);}break;
  case 'npcRecharge':requireGm(u);try{N.recharge(s,id,String(b.name||''));}catch(e){badRequest(e.message);}break;
  case 'lairDone':requireGm(u);s.combat.lairPending=[];break;
  case 'npcDefense':requireGm(u);try{N.setDefense(s,id,String(b.type||''),String(b.value||''));}catch(e){badRequest(e.message);}break;
  case 'tempHp':L.setTempHp(s,a,id,n(b.value,0,9999));break;
  case 'condition':L.toggleCondition(s,a,id,String(b.condition||''));break;
  case 'concentration':L.toggleConcentration(s,a,id,String(b.value||''));break;
  case 'resource':L.changeResource(s,a,id,String(b.resourceId||''),n(b.delta,-999,999));break;
  case 'deathSave':L.deathSave(s,a,id,String(b.result||''));break;
  case 'rest':L.rest(s,a,id,String(b.type||''));P.recoverSlots(L.findPc(s,id),s.edition,b.type);H.recover(L.findPc(s,id),s.edition,b.type);break;
  case 'setOrigin':{
   const pc=L.findPc(s,id);if(!pc||!L.canEdit(s,a,id))throw sleepBlock('Accès refusé à cette fiche.');
   let result;try{result=O.compute(b.origin,s.edition);}catch(e){badRequest(e.message);}
   const changed=pc.origin?.edition!==result.origin.edition||pc.origin?.speciesId!==result.origin.speciesId||pc.origin?.variantId!==result.origin.variantId;
   if(changed&&Object.values(pc.heritageSpent||{}).some(x=>Number.isInteger(x)&&x>0)&&b.confirmUsesReset!==true)badRequest('Changer d’espèce ou de lignée réinitialise les utilisations raciales : confirmation requise.');
   pc.origin=result.origin;pc.role=result.origin.speciesName;if(changed)pc.heritageSpent={};
   pc.stats.abilities=Object.fromEntries(O.KEYS.filter(k=>result.finalScores[k]!==null).map(k=>[k,result.finalScores[k]]));
   s.combat.log.unshift({id:random(5),msg:'Origine mise à jour · '+pc.name,when:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})});
   break;}
  case 'heritageUse':{
   const pc=L.findPc(s,id);if(!pc||!L.canEdit(s,a,id))throw sleepBlock('Accès refusé à cette fiche.');
   if(s.edition==='custom')badRequest('Règles personnalisées : créez une capacité manuelle.');
   const key=cleanText(b.featureId,'Identifiant de capacité',50);const delta=intValue(b.delta,'Variation',-1,1);
   let feature;try{feature=H.spend(pc,s.edition,key,delta);}catch(e){badRequest(e.message);}
   s.combat.log.unshift({id:random(5),msg:pc.name+' · '+feature.name+(delta>0?' utilisée':' restaurée'),when:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})});
   break;}
  case 'addFeat':{
   const pc=L.findPc(s,id);if(!pc||!L.canEdit(s,a,id))throw sleepBlock('Accès refusé à cette fiche.');
   pc.feats??=[];if(!Array.isArray(pc.feats)||pc.feats.length>=30)badRequest('Maximum 30 dons.');
   const name=cleanText(b.name,'Nom du don',70),description=cleanText(b.description||'','Description du don',280,0);
   const level=intValue(b.level,'Niveau de déblocage',1,20);
   pc.feats.push({id:'feat-'+random(7),name,description,level});break;}
  case 'removeFeat':{
   const pc=L.findPc(s,id);if(!pc||!L.canEdit(s,a,id))throw sleepBlock('Accès refusé à cette fiche.');
   const featId=cleanText(b.featId,'Identifiant de don',80);const index=(pc.feats||[]).findIndex(f=>f.id===featId);
   if(index<0)badRequest('Don introuvable.');pc.feats.splice(index,1);break;}
  case 'createHero':{
   requireGm(u);if(s.characters.length>=30)badRequest('Maximum 30 personnages.');
   const v=b.values;if(!v||typeof v!=='object'||Array.isArray(v))badRequest('Nouveau personnage incorrect.');
   const name=cleanText(v.name,'Nom du personnage'),hp=intValue(v.hp,'PV maximum',1,500),ac=intValue(v.ac,'CA',1,40);
   const classId=String(v.classId||'');if(!Object.hasOwn(P.CLASSES,classId))badRequest('Classe incorrecte.');
   let result;try{result=O.compute(v.origin,s.edition);}catch(e){badRequest(e.message);}
   const pc=L.addPc(s,a,{name,level:1,hp,ac,role:result.origin.speciesName,job:P.CLASSES[classId].name});
   pc.progression={classId,subclass:'',spentSlots:null,skills:{}};pc.origin=result.origin;
   pc.stats.abilities=Object.fromEntries(O.KEYS.filter(k=>result.finalScores[k]!==null).map(k=>[k,result.finalScores[k]]));
   pc.speed=result.origin.speedReference??9;
   break;}
  case 'setBuild':{const pc=L.findPc(s,id);if(!pc||!L.canEdit(s,a,id))throw sleepBlock('Accès refusé à cette fiche.');
   const classId=String(b.classId||'');if(!Object.hasOwn(P.CLASSES,classId))badRequest('Classe de référence inconnue.');
   if(s.edition==='custom')badRequest('Sélectionnez une édition 2014 ou 2024 pour la progression automatisée.');
   const subclass=cleanText(b.subclass||'','Sous-classe',70,0);const threshold=P.subclassLevel(classId,s.edition);
   if(subclass&&pc.level<threshold)badRequest('Sous-classe accessible à partir du niveau '+threshold+'.');
   const old=pc.progression||{};const originalClass=old.classId||P.detectClass(pc.job);
   const before=P.slotsFor(originalClass,pc.level,s.edition,old.subclass||'');const after=P.slotsFor(classId,pc.level,s.edition,subclass);
   const changeSlots=originalClass!==classId||before.kind!==after.kind||before.slotLevel!==after.slotLevel;
   if(changeSlots&&old.spentSlots!=null&&b.resetSlots!==true)badRequest('La configuration des sorts change : confirmez la réinitialisation de leur suivi.');
   pc.progression={...old,classId,subclass,spentSlots:changeSlots?null:old.spentSlots??null};
   pc.job=P.CLASSES[classId].name;break;}
  case 'levelUp':{const pc=L.findPc(s,id);if(!pc||!L.canEdit(s,a,id))throw sleepBlock('Accès refusé à cette fiche.');pc.levelUpReady=false;
   if(s.edition==='custom')badRequest('Progression automatique désactivée pour les règles personnalisées.');
   if(pc.level>=20)badRequest('Le niveau maximum est 20.');pc.level++;
   const gain=b.hpGain==null?0:intValue(b.hpGain,'PV gagnés',1,40);if(gain){pc.stats.hp=Math.min(999,pc.stats.hp+gain);pc.hp=Math.min(pc.stats.hp,pc.hp+gain);}
   s.combat.log.unshift({id:random(5),msg:pc.name+' · niveau '+pc.level+(gain?' · +'+gain+' PV max':'')+' (dons et capacités à valider)',when:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})});break;}
  case 'setSkill':{const pc=L.findPc(s,id);if(!pc||!L.canEdit(s,a,id))throw sleepBlock('Accès refusé à cette fiche.');
   if(!Object.hasOwn(P.SKILLS,b.skillId)||!['none','trained','expert'].includes(b.rank))badRequest('Compétence ou maîtrise invalide.');
   pc.progression??={};pc.progression.skills??={};pc.progression.skills[b.skillId]=b.rank;break;}
  case 'activateSlots':{const pc=L.findPc(s,id);if(!pc||!L.canEdit(s,a,id))throw sleepBlock('Accès refusé à cette fiche.');
   if(s.edition==='custom')badRequest('Suivi automatique indisponible en règles personnalisées.');try{P.initTracking(pc,s.edition);}catch(e){badRequest(e.message);}break;}
  case 'deactivateSlots':{const pc=L.findPc(s,id);if(!pc||!L.canEdit(s,a,id))throw sleepBlock('Accès refusé à cette fiche.');
   if(pc.progression?.spentSlots==null)badRequest('Aucun suivi automatique actif.');pc.progression.spentSlots=null;break;}
  case 'slot':{const pc=L.findPc(s,id);if(!pc||!L.canEdit(s,a,id))throw sleepBlock('Accès refusé à cette fiche.');
   if(s.edition==='custom')badRequest('Suivi automatique indisponible en règles personnalisées.');
   try{P.spendSlot(pc,s.edition,String(b.key||''),intValue(b.delta,'Quantité',-1,1));}catch(e){badRequest(e.message);}break;}
  case 'addSpell':case 'prepareSpell':case 'removeSpell':case 'castSpell':{
   const pc=L.findPc(s,id);if(!pc||!L.canEdit(s,a,id))throw sleepBlock('Accès refusé au grimoire.');
   try{
    if(b.kind==='addSpell')S.add(pc,P.progression(pc,s.edition).classId,s.edition,b,'sp-'+random(8));
    if(b.kind==='prepareSpell')S.edit(pc,String(b.entryId||''),b.prepared);
    if(b.kind==='removeSpell')S.remove(pc,String(b.entryId||''));
    if(b.kind==='castSpell'){
     const entry=S.entries(pc).find(e=>e.id===b.entryId),spell=S.spellFor(entry);
     if(!spell)badRequest('Sort introuvable.');
     // Le suivi d'actions est facultatif et explicite : il n'automatise pas les exceptions de classe.
     if(b.trackAction===true&&s.combat.started&&['action','bonus','reaction'].includes(spell.castTime))L.spendType(s,a,id,spell.castTime);
     const previousConcentration=pc.concentration;const result=S.record(pc,s.edition,P.progression(pc,s.edition),b,P);
     if(previousConcentration!==pc.concentration)pc.concentrationChecks=[];
     s.combat.log.unshift({id:random(5),msg:pc.name+' · '+result.spell.name+(result.mode==='slot'?' (emplacement utilisé)':' (sans emplacement, validation manuelle)'),when:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})});
     s.combat.log=s.combat.log.slice(0,100);
    }
   }catch(e){badRequest(e.message);}
   break;
  }
  case 'notePhysicalRoll':{
   const pc=L.findPc(s,id);if(!pc||!L.canEdit(s,a,id))throw sleepBlock('Accès refusé aux résultats de cette fiche.');
   let result;try{result=G.validateRoll(b,pc,S.entries,S);}catch(e){badRequest(e.message);}
   pc.physicalRollHistory??=[];pc.physicalRollHistory.unshift(result);pc.physicalRollHistory=pc.physicalRollHistory.slice(0,25);
   const labels={attack:'attaque',save:'sauvegarde',damage:'dégâts',healing:'soins',other:'autre'};
   s.combat.log.unshift({id:random(5),msg:pc.name+' · '+result.spellName+' · '+labels[result.rollKind]+' : '+result.total+' (dés physiques, sans application des effets)',when:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})});
   s.combat.log=s.combat.log.slice(0,100);break;
  }
  case 'sharedNoteSave':try{L.saveSharedNote(s,a,String(b.noteId||''),b.title,b.body,String(b.baseAt||''));}catch(e){badRequest(e.message);}break;
  case 'sharedNoteDelete':try{L.deleteSharedNote(s,a,String(b.noteId||''));}catch(e){badRequest(e.message);}break;
  case 'gmNotes':L.setPrivateNotes(s,a,String(b.value||''));break;
  case 'editPc':editPc(s,a,id,b);break;
  case 'addResource':resourceOperation(s,a,id,b,false);break;
  case 'removeResource':resourceOperation(s,a,id,b,true);break;
  case 'addAbility':abilityOperation(s,a,id,b,false);break;
  case 'removeAbility':abilityOperation(s,a,id,b,true);break;
  case 'campaignTitle':requireGm(u);s.title=cleanText(b.value,'Nom de campagne',80);break;
  case 'addPc':requireGm(u);if(s.characters.length>=30)badRequest('Maximum 30 personnages.');L.addPc(s,a,b.values||{});break;
  case 'edition':{
   requireGm(u);if(!['2024','2014','custom'].includes(b.value))badRequest('Édition invalide.');
   if(s.edition!==b.value&&s.characters.some(pc=>pc.origin)){
    if(b.confirmOriginReset!==true)badRequest('Changer les règles retire les origines enregistrées et leurs bonus : confirmation requise.');
    for(const pc of s.characters){if(!pc.origin)continue;
     pc.stats.abilities=Object.fromEntries(O.KEYS.filter(k=>pc.origin.baseScores[k]!==null).map(k=>[k,pc.origin.baseScores[k]]));
     delete pc.origin;delete pc.heritageSpent;
    }
   }
   s.edition=b.value;break;}
  case 'customActions':requireGm(u);if(!Array.isArray(b.value)||b.value.length>30||!b.value.every(x=>typeof x==='string'&&x.length<=60))badRequest('Liste invalide.');s.customActions=b.value;break;
  default:badRequest('Opération inconnue.');
  }
  s.schemaVersion=4;s.changeCount=(s.changeCount||0)+1;s.lastEdited=new Date().toISOString();
  const previous=c.state;try{SS.observe(previous,s,b.kind,b);}catch(e){console.error('Résumé de séance :',e.message);}try{CH.observe(previous,s,b.kind,b);}catch(e){console.error('Historique :',e.message);}c.state=s;c.version++;
  if(UNDOABLE[b.kind]){const st=undoStacks.get(c.id)||[];st.push({state:previous,version:c.version,label:UNDOABLE[b.kind]});while(st.length>10)st.shift();undoStacks.set(c.id,st);}else undoStacks.delete(c.id);
  persist();for(const filename of deletedMapFiles){try{fs.unlinkSync(path.join(mediaDir,filename));}catch{}}publish(c);return projected(c,u);
 }
 function commitMedia(c,u,body,binary){
  if(!Number.isSafeInteger(body.baseVersion)||body.baseVersion!==c.version)throw Object.assign(new Error('État actualisé entre-temps : réessayez.'),{status:409});
  const s=L.clone(c.state),kind=body.kind,id=body.entityId,characterId=body.characterId||'';
  if(!M.canWrite(s,u,kind,id,characterId))throw sleepBlock('Vous ne pouvez pas modifier cette illustration.');
  if(!M.VISIBILITY.includes(body.visibility))badRequest('Visibilité incorrecte.');
  if(kind==='npc'&&u.role!=='gm')throw sleepBlock('Réservé au MJ.');
  if(kind==='spell'||kind==='item')body.visibility='private';
  const entries=M.gallery(s,kind,id,characterId);
  const old=M.lookup(s,kind,id,characterId);
  const targetMedia=body.mediaId?entries.find(m=>m.id===body.mediaId):old;
  const add=body.addToGallery===true;
  const mode=body.mode;
  const caption=typeof body.caption==='string'?body.caption.trim():'';
  if(caption.length>100)badRequest('Légende trop longue (100 caractères maximum).');
  if(mode==='feature'){
   if(!targetMedia)badRequest('Illustration absente de cette galerie.');
   for(const m of entries)m.featured=m.id===targetMedia.id;
  }else if(mode==='delete'){
   if(!targetMedia)badRequest('Illustration absente de cette galerie.');
   s.media=M.list(s).filter(m=>m.id!==targetMedia.id);
   if(s.spotlight?.mediaId===targetMedia.id)delete s.spotlight;
   const remaining=M.gallery(s,kind,id,characterId);
   if(remaining.length&&!remaining.some(m=>m.featured))remaining[0].featured=true;
  }else if(mode==='builtin'||mode==='upload'){
   if(add&&entries.length>=M.MAX_GALLERY)badRequest('Maximum 8 illustrations par fiche.');
   if(!add&&entries.length>=M.MAX_GALLERY&&!old)badRequest('Galerie complète.');
   const replacing=add?null:old;
   if(M.list(s).length-(replacing?1:0)>=M.MAX_MEDIA)badRequest('Maximum 240 illustrations par campagne.');
   let record={},filename=null;
   if(mode==='builtin')M.validateBuiltin(body.builtinId,kind);
   else{
    if(!binary||typeof body.imageBase64!=='string'||!/^[-_A-Za-z0-9+/]*={0,2}$/.test(body.imageBase64))badRequest('Image encodée invalide.');
    if(body.imageBase64.length>2_700_000)badRequest('Image trop volumineuse.');
    const buf=Buffer.from(body.imageBase64,'base64'),details=M.verify(buf,body.mime);
    const used=M.list(s).reduce((t,m)=>t+(m.bytes||0),0)-(replacing?.bytes||0);
    if(used+buf.length>M.MAX_TOTAL)badRequest('Espace de stockage des images saturé (150 Mo).');
    filename=random(24)+'.'+details.extension;
    fs.mkdirSync(mediaDir,{recursive:true,mode:0o700});fs.writeFileSync(path.join(mediaDir,filename),buf,{flag:'wx',mode:0o600});
    record={mime:details.mime,width:details.width,height:details.height,bytes:details.bytes,filename};
   }
   try{
    // La première image d'une galerie est toujours la principale. Ajouter des
    // alternatives ne remplace jamais l'avatar déjà choisi.
    const featured=!add||entries.length===0;
    if(add&&entries.length)entries.forEach(m=>{if(!entries.some(x=>x.featured))m.featured=m===old;});
    if(!add&&replacing)s.media=M.list(s).filter(m=>m.id!==replacing.id);
    s.media??=[];
    s.media.push({id:'img-'+random(12),kind,entityId:id,characterId:kind==='npc'||kind==='character'?'':characterId,visibility:body.visibility,caption,featured,...record,...(mode==='builtin'?{builtinId:body.builtinId}:{})});
    if(replacing&&s.spotlight?.mediaId===replacing.id)delete s.spotlight;
    s.changeCount=(s.changeCount||0)+1;s.lastEdited=new Date().toISOString();c.state=s;c.version++;
    persist();publish(c);
   }catch(err){if(filename)try{fs.unlinkSync(path.join(mediaDir,filename));}catch{};throw err;}
   if(replacing?.filename)try{fs.unlinkSync(path.join(mediaDir,replacing.filename));}catch(e){console.warn('Ancienne illustration non supprimée :',e.message);}
   return projected(c,u);
  }else badRequest('Mode illustration inconnu.');
  s.changeCount=(s.changeCount||0)+1;s.lastEdited=new Date().toISOString();c.state=s;c.version++;
  persist();publish(c);
  if(mode==='delete'&&targetMedia?.filename)try{fs.unlinkSync(path.join(mediaDir,targetMedia.filename));}catch(e){console.warn('Illustration non supprimée :',e.message);}
  return projected(c,u);
 }
 function limit(req,key){const visitor=publicOrigin&&typeof req.headers['cf-connecting-ip']==='string'&&/^[a-fA-F0-9:.]{2,45}$/.test(req.headers['cf-connecting-ip'])?req.headers['cf-connecting-ip']:(req.socket.remoteAddress||'');const k=visitor+':'+key;if(attempts.size>500)for(const [ak,av] of attempts)if(Date.now()-av.at>15*60*1000)attempts.delete(ak);const old=attempts.get(k)||{count:0,at:Date.now()};if(Date.now()-old.at>15*60*1000){old.count=0;old.at=Date.now();}old.count++;attempts.set(k,old);if(old.count>30)throw Object.assign(new Error('Trop de tentatives. Réessayez plus tard.'),{status:429});}
 function validateHost(req){
  const actual=String(req.headers.host||'').toLowerCase();
  if(publicOrigin){if(actual!==expectedHost)throw sleepBlock('Hôte non autorisé : ouvrez l’URL HTTPS Chroniques configurée.');}
  else if(!/^(?:127\.0\.0\.1|localhost)(?::\d{1,5})?$/.test(actual))throw sleepBlock('Accès local uniquement.');
 }
 function sameOrigin(req){
  const fetchSite=req.headers['sec-fetch-site'];
  if(fetchSite&&!['same-origin','none'].includes(fetchSite))throw sleepBlock('Requête provenant d’un autre site refusée.');
  const origin=req.headers.origin;
  if(publicOrigin){if(origin!==publicOrigin)throw sleepBlock('Origine HTTPS non autorisée.');}
  else if(origin&&origin!==`http://${req.headers.host}`)throw sleepBlock('Origine non autorisée.');
 }
 const passkeyChallenges=new Map();
 const sessionFile=dataFile+'.sessions';let lastSessions='[]';
  function sessionSnapshot(){const now=Date.now();return JSON.stringify([...sessions].filter(([,v])=>v&&v.expires>=now));}
  function saveSessions(force){const snap=sessionSnapshot();if(!force&&snap===lastSessions)return;lastSessions=snap;try{fs.mkdirSync(path.dirname(sessionFile),{recursive:true,mode:0o700});const tmp=sessionFile+'.tmp';fs.writeFileSync(tmp,snap,{mode:0o600});fs.renameSync(tmp,sessionFile);}catch(e){console.warn('Sessions non enregistrées :',e.message);}}
  (function loadSessions(){try{const raw=JSON.parse(fs.readFileSync(sessionFile,'utf8'));if(Array.isArray(raw))for(const [k,v] of raw){if(typeof k==='string'&&/^[0-9a-f]{64}$/.test(k)&&v&&v.expires>=Date.now()&&db.users.some(u=>u.id===v.uid))sessions.set(k,{uid:v.uid,campaignId:v.campaignId||null,mode:v.mode==='player'||v.mode==='gm'?v.mode:null,expires:v.expires});}lastSessions=sessionSnapshot();}catch{}})();
  const server=http.createServer(async(req,res)=>{res.on('finish',()=>saveSessions(false));
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','no-referrer');
  if(publicOrigin)res.setHeader('Strict-Transport-Security','max-age=31536000');
  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  try{
   validateHost(req);
   const pathname=new URL(req.url,'http://localhost').pathname;
   if(req.method==='GET'&&iconFiles.has(pathname)){res.writeHead(200,{'content-type':'image/svg+xml','cache-control':'public, max-age=604800'});fs.createReadStream(path.join(root,'assets/icons',pathname.slice('/assets/icons/'.length))).pipe(res);return;}
    if(req.method==='GET'&&allowedStatic.has(pathname)){const [file,type]=allowedStatic.get(pathname);res.writeHead(200,{'content-type':type,'cache-control':'no-store'});fs.createReadStream(path.join(root,file)).pipe(res);return;}
   if(req.method==='GET'&&pathname.startsWith('/api/media/')){
    const u=requireUser(req),c=currentCampaign(u),key=pathname.slice('/api/media/'.length);
    const media=M.list(c.state).find(x=>x.id===key);
    if(!media||!media.filename||!M.canReadFile(c.state,u,media))throw Object.assign(new Error('Illustration non disponible.'),{status:404});
    if(!/^[A-Za-z0-9_-]{32}\.(png|webp)$/.test(media.filename))throw Object.assign(new Error('Illustration non disponible.'),{status:404});
    const full=path.join(mediaDir,media.filename);
    if(!fs.existsSync(full))throw Object.assign(new Error('Fichier d’illustration absent.'),{status:404});
    res.writeHead(200,{'content-type':media.mime,'cache-control':'private, no-store','content-disposition':'inline','content-length':fs.statSync(full).size});
    fs.createReadStream(full).pipe(res);return;
   }
   if(req.method==='GET'&&pathname.startsWith('/api/audio/')){
    const u=requireUser(req),c=currentCampaign(u);const t=AMB.find(c.state,decodeURIComponent(pathname.slice('/api/audio/'.length)));
    if(!t||!AMB.FILE.test(t.filename||'')||(u.role!=='gm'&&!c.state.ambience?.players))throw Object.assign(new Error('Piste non disponible.'),{status:404});
    const file=path.join(mediaDir,t.filename);if(!fs.existsSync(file))throw Object.assign(new Error('Fichier audio absent.'),{status:404});
    const size=fs.statSync(file).size;const range=/^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range||''));
    if(range&&(range[1]||range[2])){let start=range[1]?Number(range[1]):Math.max(0,size-Number(range[2]));let end=range[1]&&range[2]?Math.min(size-1,Number(range[2])):size-1;
     if(start>=size||start>end){res.writeHead(416,{'content-range':'bytes */'+size});res.end();return;}
     res.writeHead(206,{'content-type':t.mime,'content-range':`bytes ${start}-${end}/${size}`,'accept-ranges':'bytes','content-length':end-start+1,'cache-control':'private, max-age=3600'});fs.createReadStream(file,{start,end}).pipe(res);return;}
    res.writeHead(200,{'content-type':t.mime,'accept-ranges':'bytes','content-length':size,'cache-control':'private, max-age=3600'});fs.createReadStream(file).pipe(res);return;
   }
   if(req.method==='GET'&&pathname==='/api/update/status'){
    const u=requireUser(req),c=currentCampaign(u);if(c.ownerId!==u.id)throw sleepBlock('Réservé au MJ propriétaire de la campagne.');
    send(res,200,updateStatus());return;
   }
   if(req.method==='GET'&&pathname==='/api/backups'){
    const u=requireUser(req),c=currentCampaign(u);if(c.ownerId!==u.id)throw sleepBlock('Réservé au MJ propriétaire de la campagne.');
    send(res,200,{backups:BK.list(backupRoot,dataFile).slice(0,40),mirror:db.backupMirror||'',daily:dailyBackup});return;
   }
   if(req.method==='GET'&&pathname.startsWith('/api/handout-image/')){
    const u=requireUser(req),c=currentCampaign(u),h=HO.find(c.state,decodeURIComponent(pathname.slice('/api/handout-image/'.length)));
    if(!h||!h.image||!LIB_FILE.test(h.image.filename||'')||(u.role!=='gm'&&!HO.addressedTo(h,u.characterId)))throw Object.assign(new Error('Document non disponible.'),{status:404});
    const file=path.join(mediaDir,h.image.filename);if(!fs.existsSync(file))throw Object.assign(new Error('Image absente.'),{status:404});
    res.writeHead(200,{'content-type':h.image.mime,'cache-control':'private, no-store','content-disposition':'inline','content-length':fs.statSync(file).size});fs.createReadStream(file).pipe(res);return;
   }
   if(req.method==='GET'&&pathname.startsWith('/api/library-image/')){
    const u=requireUser(req),c=currentCampaign(u);requireGm(u);const [target,id]=pathname.slice('/api/library-image/'.length).split('/');const img=libraryEntry(c.state,target,decodeURIComponent(id||''))?.image;
    if(!img||!LIB_FILE.test(img.filename||''))throw Object.assign(new Error('Image non disponible.'),{status:404});
    const file=path.join(mediaDir,img.filename);if(!fs.existsSync(file))throw Object.assign(new Error('Image absente.'),{status:404});
    res.writeHead(200,{'content-type':img.mime,'cache-control':'private, no-store','content-disposition':'inline','content-length':fs.statSync(file).size});fs.createReadStream(file).pipe(res);return;
   }
   if(req.method==='GET'&&pathname==='/api/push/status'){const u=requireUser(req);const st=pushStore();send(res,200,{publicKey:st.vapid.publicKey,devices:st.subs.filter(x=>x.userId===u.id).length,prefs:{turn:st.prefs?.[u.id]?.turn!==false}});return;}
   // Application Android : notifications en attente depuis la dernière vérification.
   if(req.method==='GET'&&pathname==='/api/notify/poll'){const u=requireUser(req);const st=pushStore();const after=new URL(req.url,'http://localhost').searchParams.get('after')||'';const list=(st.inbox?.[u.id]||[]).filter(m=>!after||m.at>after);send(res,200,{now:new Date().toISOString(),messages:list.slice(-10)});return;}
   // Modèle de campagne : la préparation du MJ, sans personnages ni joueurs.
   if(req.method==='GET'&&pathname==='/api/campaign-template'){
    const u=requireUser(req),c=currentCampaign(u);requireGm(u);limit(req,'media');const q=new URL(req.url,'http://localhost').searchParams;
    const data=CTPL.exportTemplate(c.state,{withMaps:q.get('maps')!=='0',readImage:f=>{try{return /^[A-Za-z0-9_-]{8,64}\.(webp|png|jpg)$/.test(f)?fs.readFileSync(path.join(mediaDir,f)):null;}catch{return null;}}});
    const name='modele_'+String(c.state.title||'campagne').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase().slice(0,40)+'.json';
    send(res,200,data,{'content-disposition':'attachment; filename="'+name+'"'});return;
   }
   if(req.method==='GET'&&pathname.startsWith('/api/map-image/')){
    const u=requireUser(req),c=currentCampaign(u),id=pathname.slice('/api/map-image/'.length),map=CM.read(c.state,id);
    if(!CM.canRead(u,map)||!map.filename||!map.mime)throw Object.assign(new Error('Carte non disponible.'),{status:404});
    if(!/^[A-Za-z0-9_-]{32}\.(png|webp)$/.test(map.filename))throw Object.assign(new Error('Carte non disponible.'),{status:404});
    const file=path.join(mediaDir,map.filename);if(!fs.existsSync(file))throw Object.assign(new Error('Carte absente.'),{status:404});
    res.writeHead(200,{'content-type':map.mime,'cache-control':'private, no-store','content-disposition':'inline','content-length':fs.statSync(file).size});
    fs.createReadStream(file).pipe(res);return;
   }
   if(req.method==='GET'&&pathname.startsWith('/api/map-pin-image/')){
    const u=requireUser(req),c=currentCampaign(u),parts=pathname.slice('/api/map-pin-image/'.length).split('/');
    if(parts.length!==2)throw Object.assign(new Error('Illustration indisponible.'),{status:404});
    const map=CM.read(c.state,parts[0]),pin=CM.markerRead(c.state,parts[0],parts[1]);
    if(!CM.canRead(u,map)||!pin||(u.role!=='gm'&&pin.visibility!=='shared'))throw Object.assign(new Error('Illustration indisponible.'),{status:404});
    const asset=pin.image;
    const media=asset?.source==='media'?M.list(c.state).find(m=>m.id===asset.id):null;
    const filename=asset?.source==='upload'?asset.filename:media?.filename;
    const mime=asset?.source==='upload'?asset.mime:media?.mime;
    if(!filename||!['image/png','image/webp'].includes(mime)||!/^[A-Za-z0-9_-]{32}\.(png|webp)$/.test(filename))throw Object.assign(new Error('Illustration indisponible.'),{status:404});
    // Le partage du repère autorise uniquement l'image choisie, jamais la fiche source.
    if(asset.source==='media'&&!media)throw Object.assign(new Error('Illustration indisponible.'),{status:404});
    const full=path.join(mediaDir,filename);
    if(!fs.existsSync(full))throw Object.assign(new Error('Illustration absente.'),{status:404});
    res.writeHead(200,{'content-type':mime,'cache-control':'private, no-store','content-disposition':'inline','content-length':fs.statSync(full).size});
    fs.createReadStream(full).pipe(res);return;
   }
   if(req.method==='GET'&&pathname==='/api/status'){send(res,200,{setupRequired:db.users.length===0,version:APP_VERSION,networkMode:publicOrigin?'public':'local',remoteUrl:publicOrigin,android:fs.existsSync(apkFile)});return;}
   // V5 — application Android fournie par le serveur du MJ (même version que le serveur).
   if(req.method==='GET'&&(pathname==='/android/chroniques.apk'||pathname==='/android')){if(!fs.existsSync(apkFile)){send(res,404,{error:'Application Android absente de ce serveur.'});return;}
    res.writeHead(200,{'content-type':'application/vnd.android.package-archive','content-disposition':'attachment; filename="Chroniques-'+APP_VERSION+'.apk"','content-length':fs.statSync(apkFile).size,'cache-control':'no-store'});fs.createReadStream(apkFile).pipe(res);return;}
   if(req.method==='GET'&&pathname==='/api/me'){const u=who(req);send(res,200,u?{authenticated:true,name:u.name,role:u.role,characterId:u.characterId||null,campaignId:u.activeCampaignId}:{authenticated:false});return;}
   if(req.method==='GET'&&pathname==='/api/campaigns'){const u=requireUser(req);send(res,200,listCampaigns(u));return;}
   if(req.method==='GET'&&pathname==='/api/table-state'){const u=requireUser(req),c=currentCampaign(u);requireGm(u);
    // Écran de table : exactement ce qu'un joueur sans personnage verrait, plus la carte choisie par le MJ.
    const out=projected(c,{...u,role:'player',characterId:'__table__'});out.state.tableMapId=c.state.tableMapId||null;out.state.recapTable=c.state.recap?.table&&c.state.recap?.text?c.state.recap.text:null;out.viewer={...out.viewer,role:'table'};send(res,200,out);return;}
   if(req.method==='GET'&&pathname==='/api/state'){const u=requireUser(req),c=currentCampaign(u);send(res,200,syncOut(req,c,projected(c,u),new URL(req.url,'http://localhost').searchParams.get('since')||''));return;}
   if(req.method==='GET'&&pathname==='/api/ai/status'){const u=requireUser(req);currentCampaign(u);requireGm(u);send(res,200,{enabled:aiEnabled,model:aiModel,localAvailable:true});return;}
   if(req.method==='GET'&&pathname==='/api/management'){const u=requireUser(req),c=currentCampaign(u);requireGm(u);send(res,200,gmOverview(c));return;}
   if(req.method==='GET'&&pathname==='/api/reports'){const u=requireUser(req),c=currentCampaign(u);if(c.ownerId!==u.id)throw Object.assign(new Error('Réservé au MJ propriétaire.'),{status:403});
     const file=path.join(path.dirname(dataFile),'signalements.jsonl');let list=[];try{list=fs.readFileSync(file,'utf8').split('\n').filter(Boolean).map(l=>{try{return JSON.parse(l);}catch{return null;}}).filter(Boolean);}catch{}
     send(res,200,{reports:list.slice(-200).reverse(),file:'data/signalements.jsonl'});return;}
    if(req.method==='GET'&&pathname==='/api/export'){const u=requireUser(req),c=currentCampaign(u);requireGm(u);send(res,200,{format:5,exportedAt:new Date().toISOString(),state:L.clone(c.state)});return;}
   if(req.method==='GET'&&pathname==='/api/events'){
    const u=requireUser(req),c=currentCampaign(u);res.writeHead(200,{'content-type':'text/event-stream; charset=utf-8','cache-control':'no-cache, no-transform','connection':'keep-alive','x-accel-buffering':'no'});
    res.write(`event: update\ndata: ${JSON.stringify({version:c.version,campaignId:c.id,role:u.role})}\n\n`);
    const item={campaignId:c.id,userId:u.id,res,sessionHash:sha(cookie(req,'chroniques_sid'))};listeners.add(item);
    const ping=setInterval(()=>{try{res.write(': ping\n\n');}catch{}},20_000);ping.unref?.();req.on('close',()=>{clearInterval(ping);listeners.delete(item);});return;
   }
   if(req.method==='POST'&&pathname.startsWith('/api/')){
    sameOrigin(req);
    const ct=String(req.headers['content-type']||'').split(';')[0].trim().toLowerCase();
    if(pathname==='/api/campaign-template/import'){
     const u=requireUser(req),c=currentCampaign(u);requireGm(u);limit(req,'media');
     if(Number(req.headers['content-length'])>MAX_UPDATE){req.resume();throw Object.assign(new Error('Modèle trop volumineux (40 Mo maximum).'),{status:413});}
     const buf=await readRaw(req,MAX_UPDATE);let data;try{data=JSON.parse(buf.toString('utf8'));}catch{badRequest('Fichier illisible : un modèle de campagne (.json) est attendu.');}
     CTPL.check(data);const q=new URL(req.url,'http://localhost').searchParams;
     if(q.get('preview')==='1'){send(res,200,{summary:CTPL.summary(data)});return;}
     if(c.state.combat?.started)badRequest('Terminez le combat avant d’importer un modèle.');
     const s=L.clone(c.state);const written=[];
     const writeImage=(bytes,mime)=>{if(!['image/webp','image/png'].includes(mime))return null;let check;try{check=M.verify(bytes,mime);}catch{return null;}fs.mkdirSync(mediaDir,{recursive:true,mode:0o700});const filename=random(24)+'.'+check.extension;fs.writeFileSync(path.join(mediaDir,filename),bytes,{flag:'wx',mode:0o600});written.push(filename);return {filename,mime:check.mime};};
     let result;try{result=CTPL.importTemplate(s,data,{random,writeImage});
      logPublic(s,'Modèle de campagne importé : « '+String(data.title||'').slice(0,60)+' ».');s.changeCount=(s.changeCount||0)+1;s.lastEdited=new Date().toISOString();c.state=s;c.version++;persist();publish(c);}
     catch(e){for(const f of written)try{fs.unlinkSync(path.join(mediaDir,f));}catch{}throw e;}
     send(res,200,{...projected(c,u),imported:result});return;
    }
    if(pathname==='/api/update/upload'){
     const u=requireUser(req),c=currentCampaign(u);if(c.ownerId!==u.id)throw sleepBlock('Seul le MJ propriétaire peut mettre à jour Chroniques.');limit(req,'media');
     if(Number(req.headers['content-length'])>MAX_UPDATE){req.resume();throw Object.assign(new Error('Fichier trop volumineux pour une mise à jour.'),{status:413});}
     const buf=await readRaw(req,MAX_UPDATE);if(buf.length<4||buf.readUInt32LE(0)!==0x04034b50)badRequest('Fichier ZIP attendu (la version de Chroniques reçue en .zip).');
     fs.mkdirSync(updatesDir,{recursive:true});const tmp=path.join(updatesDir,'reception-'+random(8)+'.zip');fs.writeFileSync(tmp,buf,{mode:0o600});
     let info;try{info=UPD.inspectPackage(tmp);}catch(e){fs.rmSync(tmp,{force:true});badRequest(e.message);}
     if(!info.version||UPD.cmp(info.version,APP_VERSION)<=0){fs.rmSync(tmp,{force:true});badRequest('Ce fichier contient Chroniques '+info.version+' : la version installée ('+APP_VERSION+') est déjà à jour ou plus récente.');}
     fs.renameSync(tmp,path.join(updatesDir,'pending.zip'));fs.writeFileSync(path.join(updatesDir,'pending.json'),JSON.stringify({version:info.version,bytes:buf.length,at:new Date().toISOString()}));send(res,200,updateStatus());return;
    }
    if(pathname==='/api/audio/upload'){
     const u=requireUser(req),c=currentCampaign(u);requireGm(u);limit(req,'media');
     if(!/^audio\/|^application\/octet-stream$/.test(ct))throw Object.assign(new Error('Fichier audio attendu.'),{status:415});
     if(Number(req.headers['content-length'])>AMB.MAX_FILE){req.resume();throw Object.assign(new Error('Fichier trop volumineux (20 Mo maximum).'),{status:413});}
     const buf=await readRaw(req,AMB.MAX_FILE);const kind=AMB.sniff(buf);if(!kind)badRequest('Format audio non reconnu (MP3, OGG, WAV, M4A, WebM ou FLAC).');
     const q=new URL(req.url,'http://localhost').searchParams;const s=L.clone(c.state);const filename='audio-'+random(24)+'.'+kind.ext;
     AMB.add(s,'aud-'+random(10),{name:q.get('name')||'',filename,mime:kind.mime,bytes:buf.length,loop:q.get('loop')!=='0',category:q.get('category')||'ambiance'});
     fs.mkdirSync(mediaDir,{recursive:true,mode:0o700});fs.writeFileSync(path.join(mediaDir,filename),buf,{flag:'wx',mode:0o600});
     s.changeCount=(s.changeCount||0)+1;s.lastEdited=new Date().toISOString();c.state=s;c.version++;persist();publish(c);send(res,200,projected(c,u));return;
    }
    if(ct!=='application/json'&&pathname!=='/api/logout')throw Object.assign(new Error('Le contenu JSON est obligatoire.'),{status:415});
    const b=await readBody(req,['/api/media/change','/api/map/upload','/api/map-pin/upload'].includes(pathname)?2_850_000:pathname==='/api/action'?200_000:MAX_BODY);
    if(pathname==='/api/push/subscribe'){const u=requireUser(req);limit(req,'media');const sub=WP.cleanSubscription(b.subscription,pushOpts);const st=pushStore();
     st.subs=st.subs.filter(x=>x.endpoint!==sub.endpoint);if(st.subs.filter(x=>x.userId===u.id).length>=10)badRequest('Maximum 10 appareils par compte.');
     st.subs.push({id:random(9),userId:u.id,...sub,createdAt:new Date().toISOString()});persist();send(res,200,{ok:true,devices:st.subs.filter(x=>x.userId===u.id).length});return;}
    if(pathname==='/api/push/unsubscribe'){const u=requireUser(req);const st=pushStore();const n=st.subs.length;st.subs=st.subs.filter(x=>!(x.userId===u.id&&(b.all===true||x.endpoint===String(b.endpoint||''))));if(st.subs.length!==n)persist();send(res,200,{ok:true,devices:st.subs.filter(x=>x.userId===u.id).length});return;}
    if(pathname==='/api/presence'){const u=requireUser(req);const h=sha(cookie(req,'chroniques_sid')||'');for(const x of listeners)if(x.sessionHash===h)x.visible=b.visible!==false;send(res,200,{ok:true});return;}
    if(pathname==='/api/push/prefs'){const u=requireUser(req);const st=pushStore();st.prefs??={};st.prefs[u.id]={...(st.prefs[u.id]||{}),turn:b.turn!==false};persist();send(res,200,{prefs:st.prefs[u.id]});return;}
    if(pathname==='/api/push/test'){const u=requireUser(req);limit(req,'media');const r=await pushTo([u.id],{title:'Chroniques',body:'Les rappels de séance fonctionnent sur cet appareil.',url:'/',tag:'test'});send(res,200,r);return;}
    if(pathname==='/api/ai/preview'){
     const u=requireUser(req),c=currentCampaign(u);requireGm(u);
     const prompt=AI.preview(c.state,b);
     for(const [key,v] of aiPending)if(v.expires<Date.now())aiPending.delete(key);
     for(const [key,v] of aiPending)if(v.userId===u.id)aiPending.delete(key);
     const ticket=random(20);aiPending.set(ticket,{userId:u.id,campaignId:c.id,prompt,expires:Date.now()+5*60_000});
     send(res,200,{ticket,prompt,model:aiModel,enabled:aiEnabled,expiresInSeconds:300});return;
    }
    if(pathname==='/api/ai/generate'){
     const u=requireUser(req),c=currentCampaign(u);requireGm(u);
     if(!aiEnabled)throw Object.assign(new Error('IA désactivée. Configurez CHRONIQUES_OPENAI_API_KEY sur le serveur puis redémarrez.'),{status:503});
     const ticket=typeof b.ticket==='string'?b.ticket:'',pending=aiPending.get(ticket);
     if(!pending||pending.userId!==u.id||pending.campaignId!==c.id||pending.expires<Date.now()||b.confirm!==true)throw sleepBlock('Prévisualisation expirée ou consentement absent. Recommencez.');
     // Usage unique : ne réessayez pas automatiquement une génération coûteuse.
     aiPending.delete(ticket);
     const history=(aiCalls.get(u.id)||[]).filter(t=>t>Date.now()-600_000);
     if(history.length>=6)throw Object.assign(new Error('Limite de six demandes IA par dix minutes. Réessayez plus tard.'),{status:429});
     history.push(Date.now());aiCalls.set(u.id,history);
     const output=await AI.generate({key:aiKey,model:aiModel,prompt:pending.prompt,fetchImpl:aiFetch});
     send(res,200,{text:output,model:aiModel,saved:false});return;
    }
    if(pathname==='/api/setup'){
     if(publicOrigin&&db.users.length===0)throw sleepBlock('Créez le compte MJ en mode local avant toute publication HTTPS.');
     limit(req,'setup');if(db.users.length)throw sleepBlock('Le MJ existe déjà.');
     if(typeof b.setupKey!=='string'||b.setupKey!==setupKey)throw sleepBlock('Clé de première configuration incorrecte.');
     const name=normalizeName(b.name);validPassword(b.password);const {salt,hash}=passwordHash(b.password),id=random(12);
     const u={id,name,slug:name.toLocaleLowerCase('fr'),role:'gm',salt,passHash:hash};db.users.push(u);
     db.campaigns.push({id:'camp-'+random(9),ownerId:id,version:1,members:[{userId:id,role:'gm'}],state:L.initialState()});persist();login(res,u);send(res,200,{ok:true});return;
    }
    // 5.1 — clés d'accès (WebAuthn). L'origine attendue est celle que le serveur accepte déjà (sameOrigin).
    if(pathname.startsWith('/api/passkey/')){
     const origin=publicOrigin||`http://${req.headers.host}`,rpId=new URL(origin).hostname;
     const challengeOf=cred=>{try{return JSON.parse(WA.b64u.dec(cred?.response?.clientDataJSON).toString('utf8')).challenge;}catch{return '';}};
     const take=(ch,kind)=>{const p=passkeyChallenges.get(ch);if(!p||p.kind!==kind||p.expires<Date.now()||p.origin!==origin)throw sleepBlock('Défi expiré : recommencez.');passkeyChallenges.delete(ch);return p;};
     const issue=(kind,extra)=>{for(const [k,v] of passkeyChallenges)if(v.expires<Date.now())passkeyChallenges.delete(k);if(passkeyChallenges.size>500)throw Object.assign(new Error('Trop de demandes en cours : réessayez dans quelques minutes.'),{status:429});const ch=WA.b64u.enc(crypto.randomBytes(32));passkeyChallenges.set(ch,{kind,origin,expires:Date.now()+300000,...extra});return ch;};
     const mine=u=>{const rec=db.users.find(x=>x.id===u.id);if(!Array.isArray(rec.passkeys))rec.passkeys=[];return rec;};
     const pub=k=>({id:k.id,name:k.name,rpId:k.rpId,createdAt:k.createdAt,lastUsedAt:k.lastUsedAt||null,here:k.rpId===rpId});
     if(pathname==='/api/passkey/register/options'){const u=requireUser(req);limit(req,'passkey');const rec=mine(u);if(rec.passkeys.length>=10)throw sleepBlock('10 clés d’accès au maximum : supprimez-en une.');
      const ch=issue('reg',{uid:u.id});send(res,200,{publicKey:{challenge:ch,rp:{name:'Chroniques',id:rpId},user:{id:WA.b64u.enc(Buffer.from(u.id)),name:u.name,displayName:u.name},pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],timeout:120000,attestation:'none',authenticatorSelection:{residentKey:'required',requireResidentKey:true,userVerification:'required'},excludeCredentials:rec.passkeys.filter(k=>k.rpId===rpId).map(k=>({type:'public-key',id:k.id}))}});return;}
     if(pathname==='/api/passkey/register'){const u=requireUser(req);limit(req,'passkey');const p=take(challengeOf(b.credential),'reg');if(p.uid!==u.id)throw sleepBlock('Défi d’un autre compte.');
      const k=WA.verifyRegistration({credential:b.credential,challenge:challengeOf(b.credential),origin,rpId});
      if(db.users.some(x=>(x.passkeys||[]).some(y=>y.id===k.id)))throw sleepBlock('Cette clé d’accès est déjà enregistrée.');
      const rec=mine(u);if(rec.passkeys.length>=10)throw sleepBlock('10 clés d’accès au maximum.');
      const name=String(b.name||'').replace(/[\u0000-\u001f]/g,' ').trim().slice(0,40)||'Clé du '+new Date().toLocaleDateString('fr-FR');
      rec.passkeys.push({id:k.id,alg:k.alg,jwk:k.jwk,signCount:k.signCount,rpId,name,createdAt:new Date().toISOString()});persist();send(res,200,{ok:true,passkeys:rec.passkeys.map(pub)});return;}
     if(pathname==='/api/passkey/login/options'){limit(req,'login');const ch=issue('auth',{});send(res,200,{publicKey:{challenge:ch,rpId,timeout:120000,userVerification:'required',allowCredentials:[]}});return;}
     if(pathname==='/api/passkey/login'){limit(req,'login');const ch=challengeOf(b.credential);take(ch,'auth');const id=String(b.credential?.id||'');
      const user=db.users.find(x=>(x.passkeys||[]).some(k=>k.id===id&&k.rpId===rpId));const key=user&&user.passkeys.find(k=>k.id===id);
      if(!key)throw Object.assign(new Error('Clé d’accès inconnue sur ce serveur : connectez-vous avec votre mot de passe, puis créez une clé dans Mon compte.'),{status:401});
      if(b.credential?.response?.userHandle&&b.credential.response.userHandle!==WA.b64u.enc(Buffer.from(user.id)))throw Object.assign(new Error('Clé d’accès incohérente.'),{status:401});
      const r=WA.verifyAssertion({credential:b.credential,challenge:ch,origin,rpId,stored:key});key.signCount=r.signCount;key.lastUsedAt=new Date().toISOString();persist();login(res,user);send(res,200,{ok:true});return;}
     if(pathname==='/api/passkey/list'){const u=requireUser(req);send(res,200,{passkeys:mine(u).passkeys.map(pub),rpId});return;}
     if(pathname==='/api/passkey/remove'){const u=requireUser(req);const rec=mine(u);const n=rec.passkeys.length;rec.passkeys=rec.passkeys.filter(k=>k.id!==String(b.id||''));if(n===rec.passkeys.length)throw Object.assign(new Error('Clé introuvable.'),{status:404});persist();send(res,200,{passkeys:rec.passkeys.map(pub)});return;}
     throw Object.assign(new Error('Introuvable.'),{status:404});
    }
    if(pathname==='/api/login'){
     limit(req,'login');const slug=String(b.name||'').trim().toLocaleLowerCase('fr'),u=db.users.find(x=>x.slug===slug);
     if(!u||typeof b.password!=='string'||!checkPassword(b.password,u))throw Object.assign(new Error('Identifiant ou mot de passe incorrect.'),{status:401});
     login(res,u);send(res,200,{ok:true});return;
    }
    if(pathname==='/api/password-reset/use'){
      limit(req,'join');validPassword(b.newPassword);const h=sha(String(b.code||'').trim());if(!Array.isArray(db.resets))db.resets=[];
      const r=db.resets.find(x=>x.codeHash===h&&!x.used&&x.expires>Date.now());if(!r)throw sleepBlock('Lien de réinitialisation expiré ou incorrect. Demandez-en un nouveau à votre MJ.');
      const user=db.users.find(x=>x.id===r.userId);if(!user)throw sleepBlock('Compte introuvable.');
      const nh=passwordHash(b.newPassword);user.salt=nh.salt;user.passHash=nh.hash;r.used=true;
      for(const [token,session] of [...sessions]){if(session.uid===user.id){sessions.delete(token);endSessionStreams(token);}}
      db.resets=db.resets.filter(x=>!x.used&&x.expires>Date.now()).slice(-100);persist();login(res,user);send(res,200,{ok:true});return;
     }
     if(pathname==='/api/join'){
     limit(req,'join');if(!db.campaigns.length)throw sleepBlock('Campagne non configurée.');
     const name=normalizeName(b.name);validPassword(b.password);const slug=name.toLocaleLowerCase('fr');if(db.users.some(x=>x.slug===slug))badRequest('Cet identifiant existe déjà.');
     const h=sha(String(b.code||'').trim());const invitation=db.invites.find(i=>i.codeHash===h&&!i.used&&i.expires>Date.now());
     if(!invitation)throw sleepBlock('Invitation expirée ou incorrecte.');
     const c=db.campaigns.find(x=>x.id===invitation.campaignId);if(!c)throw sleepBlock('Campagne introuvable.');
     if(c.members.some(m=>m.characterId===invitation.characterId))badRequest('Ce personnage est déjà attribué.');
     const {salt,hash}=passwordHash(b.password),id=random(12),u={id,name,slug,role:'player',characterId:invitation.characterId,salt,passHash:hash};
     db.users.push(u);c.members.push({userId:id,role:'player',characterId:u.characterId});invitation.used=true;c.version++;persist();publish(c);login(res,u,c.id);send(res,200,{ok:true});return;
    }
    if(pathname==='/api/logout'){
     const token=cookie(req,'chroniques_sid');sessions.delete(sha(token));endSessionStreams(sha(token));res.setHeader('Set-Cookie',`chroniques_sid=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secureCookies?'; Secure':''}`);send(res,200,{ok:true});return;
    }
    // Gestion des campagnes et des modes : aucun identifiant fourni par le navigateur ne confère de droits.
    if(pathname==='/api/campaigns/select'){
     const u=requireUser(req),session=sessionFor(req);
     const dest=db.campaigns.find(x=>x.id===b.campaignId&&memberOf(x,u.id));
     if(!dest)throw sleepBlock('Campagne inaccessible.');
     session.campaignId=dest.id;session.mode=null;endSessionStreams(sha(cookie(req,'chroniques_sid')));
     send(res,200,{ok:true,activeId:dest.id});return;
    }
    if(pathname==='/api/view-mode'){
     const u=requireUser(req),c=currentCampaign(u),session=sessionFor(req),member=memberOf(c,u.id);
     if(!['player','gm'].includes(b.mode)||b.mode==='gm'&&member.role!=='gm')throw sleepBlock('Mode non autorisé.');
     session.mode=b.mode;endSessionStreams(sha(cookie(req,'chroniques_sid')));
     send(res,200,{ok:true,mode:b.mode});return;
    }
    if(pathname==='/api/campaigns/character'){
     const u=requireUser(req),c=currentCampaign(u);requireOwner(u);
     const id=b.characterId===null||b.characterId===''?null:b.characterId;
     if(id!==null&&(typeof id!=='string'||!L.findPc(c.state,id)))badRequest('Personnage inconnu.');
     if(id!==null&&c.members.some(m=>m.userId!==u.id&&m.characterId===id))badRequest('Ce personnage est déjà attribué à un autre membre.');
     memberOf(c,u.id).characterId=id;c.version++;persist();publish(c);
     send(res,200,{ok:true,characterId:id});return;
    }
    if(pathname==='/api/campaigns/create'){
     const u=requireUser(req),session=sessionFor(req);
     if(memberCampaigns(u.id).filter(c=>c.ownerId===u.id).length>=12||db.campaigns.length>=100)badRequest('Limite de campagnes atteinte.');
     const title=cleanText(b.title,'Nom de campagne',80,3),state=L.initialState();state.title=title;
     const c={id:'camp-'+random(9),ownerId:u.id,version:1,members:[{userId:u.id,role:'gm'}],state};
     db.campaigns.push(c);persist();session.campaignId=c.id;session.mode='gm';endSessionStreams(sha(cookie(req,'chroniques_sid')));
     send(res,200,{ok:true,id:c.id});return;
    }
    if(pathname==='/api/campaigns/join'){
     limit(req,'join');const u=requireUser(req),session=sessionFor(req),hash=sha(String(b.code||'').trim());
     const invitation=db.invites.find(i=>i.codeHash===hash&&!i.used&&i.expires>Date.now());
     const c=invitation&&db.campaigns.find(x=>x.id===invitation.campaignId);
     if(!c)throw sleepBlock('Invitation expirée ou incorrecte.');
     if(memberOf(c,u.id))badRequest('Vous participez déjà à cette campagne.');
     if(c.members.some(m=>m.characterId===invitation.characterId))badRequest('Ce personnage est déjà attribué.');
     c.members.push({userId:u.id,role:'player',characterId:invitation.characterId});invitation.used=true;
     c.version++;persist();publish(c);session.campaignId=c.id;session.mode='player';endSessionStreams(sha(cookie(req,'chroniques_sid')));
     send(res,200,{ok:true,id:c.id});return;
    }
    const u=requireUser(req),c=currentCampaign(u);
    // Empêche un ancien onglet d'écrire dans une autre campagne après un changement de table.
    if(b.campaignId!==undefined&&b.campaignId!==c.id)throw Object.assign(new Error('La campagne active a changé. Actualisez la page avant de modifier les données.'),{status:409});
    if(pathname==='/api/action'){const elevated=u.role==='assistant'&&ASSISTANT_KINDS.has(String(b.kind));const out=apply(c,elevated?{...u,role:'gm',assistantElevated:true}:u,b);if(['next','start'].includes(b.kind))turnNotify(c);send(res,200,syncOut(req,c,out,typeof b.since==='string'?b.since:''));return;}
    if(pathname==='/api/media/change'){limit(req,'media');send(res,200,commitMedia(c,u,b,true));return;}
    if(pathname==='/api/library/image'){
     requireGm(u);limit(req,'media');
     if(!Number.isSafeInteger(b.baseVersion)||b.baseVersion!==c.version)throw Object.assign(new Error('Bibliothèque modifiée entre-temps.'),{status:409});
     const target=['template','libitem','handout'].includes(b.target)?b.target:badRequest('Type de fiche inconnu.');const entry=libraryEntry(c.state,target,String(b.id||''));if(!entry)badRequest('Fiche introuvable.');
     const old=entry.image||null;
     if(b.remove===true){delete entry.image;c.version++;persist();publish(c);dropLibraryFile(old);send(res,200,projected(c,u));return;}
     if(!['image/webp','image/png'].includes(b.mime)||typeof b.imageBase64!=='string'||!b.imageBase64||b.imageBase64.length>2_700_000||!/^[A-Za-z0-9+/]+={0,2}$/.test(b.imageBase64))badRequest('Image invalide.');
     const bytes=Buffer.from(b.imageBase64,'base64');const check=M.verify(bytes,b.mime);if(bytes.toString('base64')!==b.imageBase64)badRequest('Image encodée incorrectement.');
     if(M.list(c.state).reduce((t,m)=>t+(m.bytes||0),0)+libraryBytes(c.state)-(old?.bytes||0)+bytes.length>M.MAX_TOTAL)badRequest('Espace de stockage des images saturé (150 Mo).');
     fs.mkdirSync(mediaDir,{recursive:true,mode:0o700});const filename=random(24)+'.'+check.extension;fs.writeFileSync(path.join(mediaDir,filename),bytes,{flag:'wx',mode:0o600});
     try{entry.image={filename,mime:check.mime,width:check.width,height:check.height,bytes:check.bytes};c.version++;persist();publish(c);}catch(e){if(old)entry.image=old;else delete entry.image;try{fs.unlinkSync(path.join(mediaDir,filename));}catch{}throw e;}
     dropLibraryFile(old);send(res,200,projected(c,u));return;
    }
    if(pathname==='/api/map/upload'){
     requireGm(u);limit(req,'media');
     if(!Number.isSafeInteger(b.baseVersion)||b.baseVersion!==c.version)throw Object.assign(new Error('Carte modifiée entre-temps.'),{status:409});
     const map=CM.read(c.state,b.mapId);if(!map)badRequest('Carte introuvable.');
     if(!['image/webp','image/png'].includes(b.mime)||typeof b.imageBase64!=='string'||!b.imageBase64||b.imageBase64.length>2_700_000||!/^[A-Za-z0-9+/]+={0,2}$/.test(b.imageBase64))badRequest('Image invalide.');
     const bytes=Buffer.from(b.imageBase64,'base64');const check=M.verify(bytes,b.mime);
     if(bytes.toString('base64')!==b.imageBase64)badRequest('Image encodée incorrectement.');
     fs.mkdirSync(mediaDir,{recursive:true,mode:0o700});
     const filename=random(24)+'.'+check.extension, dest=path.join(mediaDir,filename),old=map.filename;
     fs.writeFileSync(dest,bytes,{flag:'wx',mode:0o600});
     try{map.filename=filename;map.mime=check.mime;c.version++;persist();publish(c);}catch(e){map.filename=old;try{fs.unlinkSync(dest);}catch{}throw e;}
     if(old){try{fs.unlinkSync(path.join(mediaDir,old));}catch{}}
     send(res,200,projected(c,u));return;
    }
    if(pathname==='/api/map-pin/upload'){
     requireGm(u);limit(req,'media');
     if(!Number.isSafeInteger(b.baseVersion)||b.baseVersion!==c.version)throw Object.assign(new Error('Repère modifié entre-temps.'),{status:409});
     if(typeof b.mapId!=='string'||typeof b.markerId!=='string')badRequest('Identifiants de repère manquants.');
     const s=L.clone(c.state),pin=CM.markerRead(s,b.mapId,b.markerId);
     if(!pin)badRequest('Repère introuvable.');
     if(!['image/webp','image/png'].includes(b.mime)||typeof b.imageBase64!=='string'||!b.imageBase64||b.imageBase64.length>2_700_000||!/^[A-Za-z0-9+/]+={0,2}$/.test(b.imageBase64))badRequest('Image invalide.');
     const bytes=Buffer.from(b.imageBase64,'base64'),check=M.verify(bytes,b.mime);
     if(bytes.toString('base64')!==b.imageBase64)badRequest('Encodage incorrect.');
     const allSize=(M.list(s).reduce((t,m)=>t+(m.bytes||0),0)+(s.maps||[]).reduce((t,m)=>t+(m.markers||[]).reduce((a,p)=>a+(p.image?.source==='upload'?p.image.bytes||0:0),0),0));
     if(allSize+bytes.length>(M.MAX_TOTAL))badRequest('Stockage des illustrations saturé.');
     const filename=random(24)+'.'+check.extension,previous=pin.image;
     fs.mkdirSync(mediaDir,{recursive:true,mode:0o700});fs.writeFileSync(path.join(mediaDir,filename),bytes,{flag:'wx',mode:0o600});
     try{pin.image={source:'upload',filename,mime:check.mime,bytes:check.bytes};c.state=s;c.version++;persist();publish(c);}catch(e){try{fs.unlinkSync(path.join(mediaDir,filename));}catch{}throw e;}
     if(previous?.source==='upload')try{fs.unlinkSync(path.join(mediaDir,previous.filename));}catch{}
     send(res,200,projected(c,u));return;
    }
    if(pathname==='/api/password'){
     limit(req,'password');validPassword(b.newPassword);
     if(typeof b.currentPassword!=='string'||!checkPassword(b.currentPassword,u))throw sleepBlock('Mot de passe actuel incorrect.');
     const newHash=passwordHash(b.newPassword),original=db.users.find(x=>x.id===u.id);original.salt=newHash.salt;original.passHash=newHash.hash;
     const currentId=sha(cookie(req,'chroniques_sid'));
     for(const [token,session] of sessions){if(session.uid===u.id&&token!==currentId){sessions.delete(token);endSessionStreams(token);}}
     persist();send(res,200,{ok:true});return;
    }
    if(pathname==='/api/invite/revoke'){
     requireOwner(u);const index=db.invites.findIndex(i=>(i.id||i.codeHash)===b.id&&i.campaignId===c.id&&!i.used);
     if(index<0)badRequest('Invitation absente ou déjà utilisée.');db.invites.splice(index,1);persist();send(res,200,{ok:true});return;
    }
    if(pathname==='/api/member/role'){
     requireOwner(u);
     if(typeof b.userId!=='string'||!['gm','player','assistant'].includes(b.role))badRequest('Rôle ou compte invalide.');
     if(b.userId===c.ownerId)throw sleepBlock('Le MJ propriétaire ne peut pas être rétrogradé.');
     const member=c.members.find(m=>m.userId===b.userId);
     const target=db.users.find(x=>x.id===b.userId);
     if(!member||!target||!member.characterId)badRequest('Sélectionnez un joueur de cette campagne.');
     if(member.role===b.role)badRequest('Ce compte possède déjà ce rôle.');
     if(!['player','gm','assistant'].includes(member.role))badRequest('Incohérence des rôles.');
     member.role=b.role;target.role=b.role==='assistant'?'player':b.role; // Champ historique : les droits proviennent de member.role.
     c.version++;persist();publish(c);send(res,200,{ok:true,role:b.role});return;
    }
    if(pathname==='/api/member/remove'){
     requireOwner(u);const index=c.members.findIndex(m=>m.userId===b.userId&&m.role==='player');
     if(index<0)badRequest('Joueur absent de cette campagne.');
     const member=c.members[index];c.members.splice(index,1);
     if(!memberCampaigns(b.userId).length)db.users=db.users.filter(x=>x.id!==b.userId);
     for(const [token,session] of sessions){if(session.uid===b.userId&&session.campaignId===c.id){if(!memberCampaigns(b.userId).length)sessions.delete(token);else{session.campaignId=memberCampaigns(b.userId)[0].id;session.mode=null;}endSessionStreams(token);}}
     for(const item of [...listeners]){if(item.userId===b.userId){listeners.delete(item);try{item.res.end();}catch{}}}
     db.invites=db.invites.filter(i=>i.campaignId!==c.id||i.characterId!==member.characterId||i.used);
     c.version++;persist();publish(c);send(res,200,{ok:true});return;
    }
    if(pathname==='/api/campaigns/demo'){
      if(memberCampaigns(u.id).filter(x=>x.ownerId===u.id).length>=12||db.campaigns.length>=100)badRequest('Limite de campagnes atteinte.');
      const state=L.initialState();state.title='Campagne d’entraînement';
      const foes=[
       {name:'Gobelin éclaireur',kind:'monstre',hpMax:7,ac:15,initiative:2,speed:9,visibility:'public',showHp:false,actions:'Cimeterre : +4 au toucher, 1d6+2 tranchant. Arc court : +4, 1d6+2 perforant.',traits:'Fuite agile : se désengager ou se cacher en action bonus.',legendary:'',notes:'Créature d’exemple : modifiez-la ou supprimez-la librement.',abilities:{str:8,dex:14,con:10,int:10,wis:8,cha:8},defenses:{}},
       {name:'Gobelin archer',kind:'monstre',hpMax:7,ac:15,initiative:2,speed:9,visibility:'public',showHp:false,actions:'Arc court : +4 au toucher, 1d6+2 perforant.',traits:'Fuite agile.',legendary:'',notes:'',abilities:{str:8,dex:14,con:10,int:10,wis:8,cha:8},defenses:{}},
       {name:'Loup',kind:'monstre',hpMax:11,ac:13,initiative:2,speed:12,visibility:'public',showHp:false,actions:'Morsure : +4 au toucher, 2d4+2 perforant ; la cible peut tomber à terre (sauvegarde de Force).',traits:'Tactique de meute.',legendary:'',notes:'',abilities:{str:12,dex:15,con:12,int:3,wis:12,cha:6},defenses:{}},
       {name:'Squelette',kind:'monstre',hpMax:13,ac:13,initiative:2,speed:9,visibility:'hidden',showHp:false,actions:'Épée courte : +4 au toucher, 1d6+2 perforant.',traits:'Masqué aux joueurs : révélez-le au bon moment.',legendary:'',notes:'Exemple de défenses : vulnérable au contondant, immunisé au poison.',abilities:{str:10,dex:14,con:15,int:6,wis:8,cha:5},defenses:{Contondant:'vuln',Poison:'immune'}}];
      for(const f of foes)N.add(state,'npc-'+random(9),f);
      state.combat.log=[];
      const c={id:'camp-'+random(9),ownerId:u.id,version:1,members:[{userId:u.id,role:'gm'}],state};
      db.campaigns.push(c);persist();const session=sessionFor(req);session.campaignId=c.id;session.mode='gm';endSessionStreams(sha(cookie(req,'chroniques_sid')));
      send(res,200,{ok:true,id:c.id});return;
     }
     if(pathname==='/api/report'){
      limit(req,'report');
      const clip=(v,n)=>String(v??'').replace(/[\u0000-\u0008\u000b-\u001f]/g,' ').slice(0,n);
      const message=clip(b.message,2000).trim();if(message.length<3)badRequest('Décrivez le problème en quelques mots.');
      const member=c.members.find(m=>m.userId===u.id);
      const entry={id:random(8),at:new Date().toISOString(),version:APP_VERSION,campaign:c.state.title,user:u.name,role:member?.role==='gm'?'MJ':'joueur',
       page:clip(b.page,40),severity:['bloquant','important','cosmétique'].includes(b.severity)?b.severity:'important',message,
       device:clip(b.device,300),screen:clip(b.screen,40),online:b.online!==false};
      const file=path.join(path.dirname(dataFile),'signalements.jsonl');fs.mkdirSync(path.dirname(file),{recursive:true});fs.appendFileSync(file,JSON.stringify(entry)+'\n',{mode:0o600});
      send(res,200,{ok:true,id:entry.id});return;
     }
     if(pathname==='/api/password-reset/create'){
      if(c.ownerId!==u.id)throw Object.assign(new Error('Seul le MJ propriétaire de la campagne peut réinitialiser un mot de passe.'),{status:403});
      const target=String(b.userId||'');if(target===u.id)badRequest('Pour votre propre compte, utilisez REINITIALISER_MOT_DE_PASSE.bat sur le PC du serveur.');
      if(!c.members.some(m=>m.userId===target))badRequest('Ce compte ne fait pas partie de la campagne.');
      const tu=db.users.find(x=>x.id===target);if(!tu)badRequest('Compte introuvable.');
      if(!Array.isArray(db.resets))db.resets=[];db.resets=db.resets.filter(x=>x.userId!==target&&!x.used&&x.expires>Date.now());
      const code=random(15);db.resets.push({codeHash:sha(code),userId:target,used:false,expires:Date.now()+2*3600_000});persist();
      send(res,200,{code,name:tu.name,expiresHours:2});return;
     }
     if(pathname==='/api/backup-now'){
      if(c.ownerId!==u.id)throw Object.assign(new Error('Seul le MJ propriétaire peut lancer une sauvegarde.'),{status:403});
      const dest=BK.backup(backupRoot,{source:dataFile,mediaDir,mirror:db.backupMirror||''});backupCache={at:0,days:null};
      send(res,200,{ok:true,file:path.relative(backupRoot,dest).replace(/\\/g,'/'),mirrored:!!db.backupMirror});return;
     }
     if(pathname==='/api/update/check'){if(c.ownerId!==u.id)throw sleepBlock('Réservé au MJ propriétaire de la campagne.');limit(req,'media');if(!RU.readConfig(updateRoot))badRequest('Aucune source de mise à jour configurée (fichier config/update-source.json).');try{await remoteCheck();}catch(e){}send(res,200,updateStatus());return;}
     // Jeton GitHub en lecture seule (dépôt privé) : enregistré dans config/update-source.json, jamais renvoyé.
     if(pathname==='/api/update/token'){if(c.ownerId!==u.id)throw sleepBlock('Réservé au MJ propriétaire de la campagne.');const t=String(b.token??'').trim();
      if(t&&!/^(github_pat_[A-Za-z0-9_]{20,250}|gh[pousr]_[A-Za-z0-9]{20,250})$/.test(t))badRequest('Jeton GitHub non reconnu (il commence par github_pat_ ou ghp_).');
      const f=path.join(updateRoot,'config','update-source.json');let cur={};try{cur=JSON.parse(fs.readFileSync(f,'utf8'))||{};}catch{}
      if(t)cur.token=t;else delete cur.token;fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,JSON.stringify(cur,null,2),{mode:0o600});
      remote.error=null;if(t){try{await remoteCheck();}catch{}}send(res,200,updateStatus());return;}
     if(pathname==='/api/update/download'){if(c.ownerId!==u.id)throw sleepBlock('Réservé au MJ propriétaire de la campagne.');limit(req,'media');await remoteDownload();send(res,200,updateStatus());return;}
     if(pathname==='/api/update/cancel'){
      if(c.ownerId!==u.id)throw sleepBlock('Réservé au MJ propriétaire de la campagne.');fs.rmSync(path.join(updatesDir,'pending.zip'),{force:true});send(res,200,updateStatus());return;
     }
     if(pathname==='/api/update/apply'){
      if(c.ownerId!==u.id)throw sleepBlock('Réservé au MJ propriétaire de la campagne.');if(b.confirm!==true)badRequest('Confirmation requise.');
      if(!fs.existsSync(path.join(updatesDir,'pending.zip')))badRequest('Aucune mise à jour en attente.');
      if(!canRestart)throw Object.assign(new Error('Chroniques n’a pas été lancé par DEMARRER_CHRONIQUES.bat : fermez la fenêtre du serveur et relancez-le, la mise à jour s’installera au démarrage.'),{status:409});
      // Tout le monde est prévenu, la base est écrite, puis le lanceur installe et redémarre.
      for(const cc of db.campaigns){cc.state.combat?.log?.unshift({id:random(5),msg:'⟳ Mise à jour de Chroniques en cours : la page se rechargera d’elle-même.',when:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})});cc.version++;publish(cc);}
      persist();send(res,200,{ok:true,restarting:true});setTimeout(()=>opts.onRestart(),600);return;
     }
     if(pathname==='/api/backup-mirror'){
      if(c.ownerId!==u.id)throw sleepBlock('Réservé au MJ propriétaire de la campagne.');
      let dir='';try{dir=BK.checkMirrorDir(b.path);}catch(e){badRequest(e.message);}db.backupMirror=dir;persist();send(res,200,{ok:true,mirror:dir});return;
     }
     if(pathname==='/api/backup-test'||pathname==='/api/backup-restore'){
      if(c.ownerId!==u.id)throw sleepBlock('Réservé au MJ propriétaire de la campagne.');
      const {file,media}=BK.resolve(backupRoot,dataFile,b.id);const report=BK.inspect(file,c.id,[mediaDir,media]);
      if(pathname==='/api/backup-test'){const {state,...out}=report;send(res,200,out);return;}
      if(!report.ok)badRequest('Restauration impossible : '+report.problems.join(' '));
      if(b.confirm!==true)badRequest('Confirmation requise.');
      // Filet de sécurité : l'état actuel est sauvegardé avant d'être remplacé.
      const safety=BK.backup(backupRoot,{source:dataFile,mediaDir});backupCache={at:0,days:null};
      const restored=L.clone(report.state);let copied=0;
      const names=new Set();(function walk(v){if(!v||typeof v!=='object')return;if(Array.isArray(v)){v.forEach(walk);return;}for(const [k,x] of Object.entries(v)){if(k==='filename'&&typeof x==='string')names.add(x);else walk(x);}})(restored);
      for(const n of names){if(!/^[A-Za-z0-9_.-]{8,80}$/.test(n)||n.includes('..'))continue;const to=path.join(mediaDir,n),from=path.join(media,n);if(!fs.existsSync(to)&&fs.existsSync(from)){fs.mkdirSync(mediaDir,{recursive:true,mode:0o700});fs.copyFileSync(from,to);copied++;}}
      restored.combat??={};restored.combat.log=Array.isArray(restored.combat.log)?restored.combat.log:[];
      restored.combat.log.unshift({id:random(5),msg:'♻ Campagne restaurée depuis la sauvegarde du '+new Date(fs.statSync(file).mtime).toLocaleString('fr-FR'),when:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})});
      c.state=restored;c.version++;undoStacks.delete(c.id);persist();publish(c);
      send(res,200,{ok:true,safety:path.relative(backupRoot,safety).replace(/\\/g,'/'),copiedMedia:copied,problems:report.problems});return;
     }
     if(pathname==='/api/invites/all'){
      requireGm(u);const free=c.state.characters.filter(p=>!c.members.some(m=>m.characterId===p.id));
      if(!free.length)badRequest('Tous les personnages sont déjà attribués.');
      db.invites=db.invites.filter(x=>!(x.campaignId===c.id&&!x.used&&free.some(p=>p.id===x.characterId)));
      const out=free.map(p=>{const code=random(15);db.invites.push({id:random(9),codeHash:sha(code),campaignId:c.id,characterId:p.id,used:false,expires:Date.now()+24*3600_000});return {code,characterName:p.name,characterId:p.id,expiresHours:24};});
      db.invites=db.invites.filter(x=>!x.used&&x.expires>Date.now()).slice(-100);persist();send(res,200,{invites:out});return;
     }
     if(pathname==='/api/invites'){
     requireGm(u);const p=L.findPc(c.state,String(b.characterId||''));if(!p)badRequest('Personnage inexistant.');
     if(c.members.some(m=>m.characterId===p.id))badRequest('Un joueur contrôle déjà ce personnage.');
     const code=random(15);db.invites.push({id:random(9),codeHash:sha(code),campaignId:c.id,characterId:p.id,used:false,expires:Date.now()+24*3600_000});
     db.invites=db.invites.filter(x=>!x.used&&x.expires>Date.now()).slice(-100);persist();send(res,200,{code,characterName:p.name,expiresHours:24});return;
    }
    send(res,404,{error:'API inconnue.'});return;
   }
   send(res,404,{error:'Page introuvable.'});
  }catch(e){if(!e.status&&/^(Accès refusé|Seul le MJ|Accès réservé|Notes privées)/.test(e.message))e.status=403;else if(!e.status&&/^(Le combat|Ce personnage|Ressource|Condition|Type inconnu|Déplacement|Fichier|Valeur|Initiative|Action|Repos|Rappel de concentration|Résultat de sauvegarde|Sens de déplacement|Déplacement hors|Jet |Impossible |Cette possibilité|Une |Personnage |La |Aucun |Seules )/.test(e.message))e.status=400;if(!res.headersSent)send(res,e.status||500,{error:e.status?e.message:'Erreur interne du serveur.'});else res.end();if(!e.status)console.error('Chroniques:',e);}
 });
 return {server,setupKey,dataFile,db,sessionReminders,remoteCheck,close:()=>new Promise(r=>{if(reminderTimer)clearInterval(reminderTimer);if(updateTimer)clearInterval(updateTimer);saveSessions(true);for(const c of listeners){try{c.res.end();}catch{}}server.close(r);})};
}
if(require.main===module){const host=process.env.HOST||'127.0.0.1',port=Number(process.env.PORT||8080),app=createServer({host,onRestart:process.env.CHRONIQUES_LAUNCHER==='1'?()=>{app.close().finally(()=>process.exit(75));setTimeout(()=>process.exit(75),4000).unref?.();}:undefined});app.server.listen(port,host,()=>{
 const addr=app.server.address();console.log(`\nChroniques v${APP_VERSION} : http://127.0.0.1:${addr.port}/ (HTTP local uniquement)`);
 const remote=getRemoteOrigin({},root);
 if(remote)console.log(`HTTPS public (Cloudflare Tunnel) : ${remote}/ (comptes et invitations Chroniques requis)`);
 if(app.db.users.length===0)console.log(`\nCLE DE PREMIERE CONFIGURATION (MJ) : ${app.setupKey}\n`);
 });}
module.exports={createServer};
