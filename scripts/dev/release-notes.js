#!/usr/bin/env node
/* Extrait de CHANGELOG.md la section d'une version (notes de la version GitHub).
   --court : une ligne (titre de la section), pour la fiche de mise à jour signée. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const v=process.argv[2]||require('../../package.json').version;const short=process.argv.includes('--court');
const text=fs.readFileSync(path.join(__dirname,'..','..','CHANGELOG.md'),'utf8');
const parts=text.split(/\n(?=## )/);const sec=parts.find(p=>p.startsWith('## '+v+' ')||p.startsWith('## '+v+'\n'));
if(!sec){console.log(short?'Chroniques '+v:'Chroniques '+v+'\n\nVoir CHANGELOG.md.');process.exit(0);}
const title=sec.split('\n')[0].replace(/^##\s+[\d.]+\s*[—-]?\s*/,'').trim();
if(short){console.log(title.slice(0,300));process.exit(0);}
console.log(sec.replace(/^##[^\n]*\n/,'## '+title+'\n').trim()+'\n\n---\n**Installation** : les serveurs dont les mises à jour automatiques sont configurées la proposent seuls (Paramètres → Mettre à jour Chroniques). Sinon : téléchargez le ZIP ci-dessous et envoyez-le dans Paramètres → « Mettre à jour Chroniques ». L’application Android se met à jour depuis le serveur du MJ.');
