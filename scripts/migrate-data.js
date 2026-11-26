#!/usr/bin/env node
'use strict';
/* Chroniques — récupère les données d’une ancienne installation (Windows, Linux ou macOS).
   Usage : node scripts/migrate-data.js <ancien dossier qui contient server.js> [--sans-adresse]
   Copie la base (comptes, campagnes), les connexions, les images, les signalements et les réglages de mise à jour.
   L’adresse HTTPS (config/remote-origin.txt) est copiée aussi, sauf avec --sans-adresse (changement de domaine).
   Ne remplace jamais une base existante : lancez-le dans une installation neuve, serveur arrêté. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function migrate(oldDir,{withOrigin=true,target=root}={}){
 const old=path.resolve(String(oldDir||''));
 if(!oldDir||!fs.existsSync(path.join(old,'server.js')))throw new Error('server.js introuvable dans « '+old+' » : indiquez le dossier de l’ancienne installation.');
 if(path.resolve(old)===path.resolve(target))throw new Error('L’ancien et le nouveau dossier sont identiques.');
 const db=path.join(old,'data','chroniques-db.json');if(!fs.existsSync(db))throw new Error('Base introuvable dans l’ancien dossier (data/chroniques-db.json).');
 try{JSON.parse(fs.readFileSync(db,'utf8'));}catch{throw new Error('La base de l’ancien dossier est illisible : arrêtez l’ancien serveur et réessayez, ou utilisez une sauvegarde.');}
 const dest=path.join(target,'data','chroniques-db.json');if(fs.existsSync(dest))throw new Error('Une base existe déjà ici. Rien n’est remplacé : décompressez la nouvelle version dans un dossier vide.');
 fs.mkdirSync(path.join(target,'data'),{recursive:true});fs.mkdirSync(path.join(target,'config'),{recursive:true});
 const copied=[];const file=(rel)=>{const src=path.join(old,rel);if(!fs.existsSync(src))return;fs.copyFileSync(src,path.join(target,rel),fs.constants.COPYFILE_EXCL);copied.push(rel);};
 file('data/chroniques-db.json');file('data/chroniques-db.json.sessions');file('data/signalements.jsonl');file('config/update-source.json');if(withOrigin)file('config/remote-origin.txt');
 const media=path.join(old,'data','media');if(fs.existsSync(media)){fs.cpSync(media,path.join(target,'data','media'),{recursive:true,errorOnExist:false,force:false});copied.push('data/media/ ('+fs.readdirSync(media).length+' fichiers)');}
 return copied;}
if(require.main===module){const args=process.argv.slice(2);const oldDir=args.find(a=>!a.startsWith('--'));
 try{const list=migrate(oldDir,{withOrigin:!args.includes('--sans-adresse')});console.log('Données récupérées :\n - '+list.join('\n - '));
  console.log('\nÉtape suivante : vérifiez l’adresse HTTPS (node scripts/set-remote-origin.js https://…), puis lancez node scripts/launcher.js.');}
 catch(e){console.error('ERREUR : '+e.message);process.exit(1);}}
module.exports={migrate};
