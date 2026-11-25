'use strict';
/* Diagnostic en lecture seule : ne publie aucun secret ni contenu de campagne. */
const fs=require('node:fs');
const path=require('node:path');
function preflight(root=path.resolve(__dirname,'..'),out=console){
 const issues=[],warnings=[];
 const major=Number(process.versions.node.split('.')[0]);
 if(!Number.isInteger(major)||major<20)issues.push('Node.js 20 ou plus est requis.');
 const assets=['server.js','index.html','sw.js','src/online-app.js','src/workspace-layout.js','src/combat-workspace.js','src/styles.css','GUIDE_TESTEURS.md','MIGRER_DONNEES.bat'];
 for(const f of assets)if(!fs.existsSync(path.join(root,f)))issues.push('Fichier du logiciel absent : '+f);
 const dbPath=path.join(root,'data','chroniques-db.json');
 let accounts=0,campaigns=0,mediaCount=0;
 if(fs.existsSync(dbPath)){
  try{const db=JSON.parse(fs.readFileSync(dbPath,'utf8'));
   if(db.format!==5||!Array.isArray(db.users)||!Array.isArray(db.campaigns))issues.push('Format de base incompatible ou incomplet.');
   else{
    accounts=db.users.length;campaigns=db.campaigns.length;
    if(accounts&&!campaigns)warnings.push('Des comptes existent, mais aucune campagne n’est disponible.');
   }
  }catch{issues.push('La base JSON ne peut pas être lue. Conserver la sauvegarde avant toute réparation.');}
 }else warnings.push('Aucune base trouvée : nouvelle installation ou migration non effectuée.');
 const mediaPath=path.join(root,'data','media');
 if(fs.existsSync(mediaPath)){
  try{mediaCount=fs.readdirSync(mediaPath,{withFileTypes:true}).filter(x=>x.isFile()).length;}catch{warnings.push('Dossier d’illustrations inaccessible.');}
 }
 const tunnel=fs.existsSync(path.join(root,'config','remote-origin.txt'));
 out.log('CHRONIQUES v'+require('../package.json').version+' — Vérification de la bêta (lecture seule)');
 out.log(`Node.js : ${process.versions.node} · comptes : ${accounts} · campagnes : ${campaigns} · fichiers média : ${mediaCount}`);
 out.log(`Configuration HTTPS Cloudflare : ${tunnel?'présente':'non configurée ici'}`);
 for(const w of warnings)out.warn('ATTENTION : '+w);
 for(const e of issues)out.error('ERREUR : '+e);
 out.log(!issues.length?'Contrôle de fichiers : OK':'Contrôle de fichiers : ÉCHEC');
 return {ok:issues.length===0,issues,warnings,accounts,campaigns,mediaCount,tunnel};
}
if(require.main===module){if(!preflight().ok)process.exitCode=1;}
module.exports={preflight};
