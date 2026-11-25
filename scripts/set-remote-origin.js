'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {validateRemoteOrigin}=require('../src/network-config');
const root=path.resolve(__dirname,'..');
const dest=path.join(root,'config','remote-origin.txt');
try{
 const value=process.argv[2];
 if(value==='--off'){
  if(fs.existsSync(dest))fs.unlinkSync(dest);
  console.log('Mode local Chroniques configuré. La route publique Cloudflare DOIT être désactivée séparément.');
 }else{
  const origin=validateRemoteOrigin(value);
  if(!origin)throw new Error('Une URL HTTPS avec nom de domaine est obligatoire.');
  if(!fs.existsSync(path.join(root,'data','chroniques-db.json')))throw new Error('Aucune campagne. Créez votre compte MJ en mode local AVANT de publier.');
  const db=JSON.parse(fs.readFileSync(path.join(root,'data','chroniques-db.json'),'utf8'));
  if(db.format!==5||!Array.isArray(db.users)||!db.users.some(u=>u.role==='gm'))throw new Error('La campagne doit déjà avoir un compte MJ.');
  fs.mkdirSync(path.dirname(dest),{recursive:true});
  const tmp=dest+'.tmp';fs.writeFileSync(tmp,origin+'\n',{mode:0o600});fs.renameSync(tmp,dest);
  console.log('URL enregistrée : '+origin+'/');
  console.log('Redémarrez Chroniques. Le tunnel Cloudflare reste à activer séparément.');
 }
}catch(e){console.error('ERREUR : '+e.message);process.exitCode=1;}
