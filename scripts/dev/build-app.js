#!/usr/bin/env node
'use strict';
/* Chroniques — assemble src/online-app.js à partir des morceaux de src/interface/ (5.17).
   L’interface reste un seul script dans le navigateur ; les morceaux, rangés par thème, ne servent qu’à la lire et la modifier.
   Usage : node scripts/dev/build-app.js        → réécrit src/online-app.js
           node scripts/dev/build-app.js --check → vérifie seulement que src/online-app.js est à jour (code de sortie 1 sinon) */
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.join(__dirname,'..','..'),DIR=path.join(ROOT,'src','interface'),OUT=path.join(ROOT,'src','online-app.js');
function assemble(){const parts=fs.readdirSync(DIR).filter(f=>/^\d{2}-[a-z0-9-]+\.js$/.test(f)).sort();if(!parts.length)throw new Error('Aucun morceau dans src/interface/.');
 return parts.map(f=>fs.readFileSync(path.join(DIR,f),'utf8')).join('');}
module.exports={assemble,OUT};
if(require.main===module){const code=assemble();
 if(process.argv.includes('--check')){const cur=fs.existsSync(OUT)?fs.readFileSync(OUT,'utf8'):'';if(cur!==code){console.error('src/online-app.js n’est pas à jour : lancez node scripts/dev/build-app.js');process.exit(1);}console.log('src/online-app.js est à jour.');}
 else{fs.writeFileSync(OUT,code);console.log('Écrit : src/online-app.js ('+(code.length/1024).toFixed(0)+' Ko, '+fs.readdirSync(DIR).length+' morceaux)');}}
