#!/usr/bin/env node
/* Écrit update-source.json (livré dans le ZIP) pour que chaque installation trouve seule les nouvelles versions
   publiées sur GitHub. Utilisé par la publication automatique : la clé publique est déduite de la clé privée.
   Usage : node scripts/dev/write-update-source.js <propriétaire/dépôt> <clé-privée.pem> */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const [repo,pem]=process.argv.slice(2);
if(!/^[\w.-]+\/[\w.-]+$/.test(repo||'')||!pem){console.error('Usage : write-update-source.js <propriétaire/dépôt> <clé-privée.pem>');process.exit(2);}
const pub=crypto.createPublicKey(crypto.createPrivateKey(fs.readFileSync(pem,'utf8'))).export({type:'spki',format:'der'}).subarray(12).toString('base64');
const out={manifest:'github:'+repo,publicKey:pub,autoDownload:true};
fs.writeFileSync(path.join(__dirname,'..','..','update-source.json'),JSON.stringify(out,null,2)+'\n');
console.log('update-source.json : github:'+repo+' · clé publique '+pub);
