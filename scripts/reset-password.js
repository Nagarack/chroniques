'use strict';
/**
 * Réinitialisation d'un mot de passe depuis le PC du serveur (pour le MJ qui a oublié le sien).
 *   node scripts/reset-password.js "Nom du compte"
 * Le serveur doit être ARRÊTÉ : sinon il réécrirait la base sans tenir compte de la réinitialisation.
 * Produit un lien à usage unique, valable 2 heures, à ouvrir après avoir relancé le serveur.
 */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const net=require('node:net');
const readline=require('node:readline');
const ROOT=path.resolve(__dirname,'..');

function serverRunning(port){return new Promise(ok=>{const s=net.connect({host:'127.0.0.1',port},()=>{s.destroy();ok(true);});s.on('error',()=>ok(false));s.setTimeout(800,()=>{s.destroy();ok(false);});});}
function ask(q){return new Promise(ok=>{const rl=readline.createInterface({input:process.stdin,output:process.stdout});rl.question(q,a=>{rl.close();ok(a);});});}

async function createReset(name,{root=ROOT,port=Number(process.env.PORT||8080),checkServer=true}={}){
 const file=path.join(root,'data','chroniques-db.json');
 if(!fs.existsSync(file))throw new Error('Aucune base trouvée dans data/chroniques-db.json.');
 if(checkServer&&await serverRunning(port))throw new Error('Le serveur Chroniques est ouvert. Fermez sa fenêtre, puis relancez ce script.');
 const db=JSON.parse(fs.readFileSync(file,'utf8'));
 if(db.format!==5||!Array.isArray(db.users))throw new Error('Format de base inattendu.');
 const slug=String(name||'').trim().toLocaleLowerCase('fr');
 const user=db.users.find(u=>u.slug===slug);
 if(!user)throw new Error('Aucun compte nommé « '+String(name||'').trim()+' ». Comptes existants : '+db.users.map(u=>u.name).join(', '));
 const code=crypto.randomBytes(15).toString('base64url');
 db.resets=(Array.isArray(db.resets)?db.resets:[]).filter(r=>r.userId!==user.id&&!r.used&&r.expires>Date.now());
 db.resets.push({codeHash:crypto.createHash('sha256').update(code).digest('hex'),userId:user.id,used:false,expires:Date.now()+2*3600_000});
 const tmp=file+'.tmp';fs.writeFileSync(tmp,JSON.stringify(db),{mode:0o600});fs.renameSync(tmp,file);
 let origin='http://127.0.0.1:'+port;try{const r=fs.readFileSync(path.join(root,'config','remote-origin.txt'),'utf8').trim();if(/^https:\/\//.test(r))origin=r.replace(/\/+$/,'');}catch{}
 return {name:user.name,link:origin+'/#reinitialiser='+code};
}

if(require.main===module){
 (async()=>{
  try{
   const name=process.argv[2]||await ask('Nom du compte à réinitialiser : ');
   const r=await createReset(name);
   console.log('');console.log('Lien de réinitialisation pour '+r.name+' (valable 2 heures, une seule fois) :');console.log('  '+r.link);
   console.log('');console.log('1. Relancez DEMARRER_CHRONIQUES.bat.');console.log('2. Ouvrez ce lien dans le navigateur et choisissez un nouveau mot de passe.');
   console.log('Ne transmettez ce lien qu’à la personne concernée.');
  }catch(err){console.error('ERREUR : '+err.message);process.exitCode=1;}
 })();
}
module.exports={createReset};
