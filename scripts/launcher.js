'use strict';
/* Chroniques — lanceur du serveur (utilisé par DEMARRER_CHRONIQUES.bat).
   1. Installe la mise à jour déposée depuis l'application (updates/pending.zip), avec sauvegarde et retour arrière automatiques.
   2. Démarre le serveur. Si le MJ demande « Installer et redémarrer », le serveur s'arrête avec le code 75 :
      le lanceur installe alors la mise à jour et relance le serveur, sans intervention. */
const path=require('node:path');const fs=require('node:fs');const {spawn,spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');const RESTART=75;
function installPending(){if(!fs.existsSync(path.join(root,'updates','pending.zip')))return;
 console.log('\nMise à jour en attente : installation…');
 // Processus séparé : les fichiers de l'application (y compris ce lanceur) peuvent être remplacés.
 spawnSync(process.execPath,[path.join(root,'scripts','update.js'),'--pending'],{cwd:root,stdio:'inherit'});}
function run(){installPending();
 const child=spawn(process.execPath,[path.join(root,'server.js')],{cwd:root,stdio:'inherit',env:{...process.env,CHRONIQUES_LAUNCHER:'1'}});
 const stop=()=>{try{child.kill('SIGINT');}catch{}};process.on('SIGINT',stop);process.on('SIGTERM',stop);
 child.on('exit',code=>{process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);
  if(code===RESTART){console.log('\nRedémarrage de Chroniques…');setTimeout(run,800);}else process.exit(code??0);});}
if(require.main===module)run();
module.exports={RESTART};
