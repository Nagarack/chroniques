#!/usr/bin/env node
/* Chroniques — outil de l'éditeur pour publier une mise à jour signée.
   1) Une seule fois : node scripts/dev/sign-release.js cles <dossier-secret>
      → crée chroniques-maj-privee.pem (À GARDER SECRÈTE, hors du dépôt) et affiche la clé publique.
   2) À chaque version : node scripts/dev/sign-release.js signer <Chroniques_Vx.zip> --cle <privee.pem> --url <adresse HTTPS du zip> [--notes "…"] [--sortie chroniques-maj.json]
      → écrit la fiche de version signée à publier à l'adresse indiquée dans update-source.json. */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const RU=require('../remote-update.js');const UPD=require('../update.js');
const [cmd,...args]=process.argv.slice(2);
const opt=k=>{const i=args.indexOf('--'+k);return i>=0?args[i+1]:undefined;};
if(cmd==='cles'){const dir=args[0];if(!dir){console.error('Indiquez un dossier secret.');process.exit(2);}fs.mkdirSync(dir,{recursive:true});
 const f=path.join(dir,'chroniques-maj-privee.pem');if(fs.existsSync(f)){console.error('Une clé existe déjà : '+f);process.exit(1);}
 const k=RU.keygen();fs.writeFileSync(f,k.privatePem,{mode:0o600});
 console.log('Clé privée : '+f+' (ne la partagez jamais, ne la mettez pas dans le ZIP).');
 console.log('Clé publique (à mettre dans update-source.json → "publicKey") :\n'+k.publicKey);process.exit(0);}
if(cmd==='signer'){const zip=args[0];const key=opt('cle'),url=opt('url');if(!zip||!key||!url){console.error('Usage : signer <zip> --cle <privee.pem> --url <https://…/zip> [--notes …] [--sortie fichier.json]');process.exit(2);}
 const {version}=UPD.inspectPackage(zip);const m=RU.sign(zip,{privatePem:fs.readFileSync(key,'utf8'),version,url,notes:opt('notes')||''});
 const out=opt('sortie')||'chroniques-maj.json';fs.writeFileSync(out,JSON.stringify(m,null,2)+'\n');console.log('Fiche signée pour Chroniques '+version+' : '+out);process.exit(0);}
console.log('Commandes : cles <dossier> | signer <zip> --cle <pem> --url <https://…> [--notes …] [--sortie …]');process.exit(cmd?2:0);
