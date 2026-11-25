#!/usr/bin/env node
'use strict';
/* Outil de traduction : i18n/tsv/NN.tsv (« index<TAB>traduction », index dans la liste des unités du moment)
   → i18n/en/NN.json (clé = texte français). « - » = ne pas traduire (code, nom de fichier…). */
const fs=require('node:fs'),path=require('node:path');const ROOT=path.join(__dirname,'..','..');
const units=Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT,'i18n','units.json'),'utf8')));
for(const f of process.argv.slice(2)){const out={};let n=0,bad=0;
 for(const line of fs.readFileSync(f,'utf8').split('\n')){if(!line.trim())continue;const t=line.indexOf('\t');const i=Number(line.slice(0,t));const en=line.slice(t+1);
  if(!Number.isInteger(i)||!units[i]){console.error('Index inconnu : '+line.slice(0,60));bad++;continue;}if(en==='-')continue;
  const fr=units[i];const ph=s=>(s.match(/\{\d+\}/g)||[]).sort().join();if(ph(fr)!==ph(en)){console.error('Valeurs {n} différentes : '+i+' '+fr+' → '+en);bad++;}
  out[fr]=en;n++;}
 const dest=path.join(ROOT,'i18n','en',path.basename(f).replace(/\.tsv$/,'.json'));fs.writeFileSync(dest,JSON.stringify(out,null,1));console.log(path.basename(dest)+' : '+n+' traductions'+(bad?', '+bad+' erreurs':''));}
