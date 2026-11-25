#!/usr/bin/env node
'use strict';
/* Chroniques — assemble le dictionnaire anglais : i18n/en/*.json (français → anglais, relus à la main)
   → src/i18n/en.js, chargé par la page quand la langue est l'anglais, et lu par le serveur (notifications).
     node scripts/i18n/build.js [--check]   (--check : liste les unités sans traduction) */
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.join(__dirname,'..','..');
function load(){const dir=path.join(ROOT,'i18n','en');const ui={};
 for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.json')).sort()){const part=JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));const srd=/^9\d-/.test(f);for(const [k,v] of Object.entries(part))if(typeof v==='string'&&v.trim()&&!(srd&&k in ui))ui[k]=v;}
 // Les noms du SRD (fichiers 9x-) ne remplacent jamais un texte d'interface (« Aide » = Help, pas le sort Aid).
 return ui;}
function run(){const ui=load();const units=JSON.parse(fs.readFileSync(path.join(ROOT,'i18n','units.json'),'utf8'));
 const missing=Object.keys(units).filter(u=>!(u in ui));
 const body=JSON.stringify({ui});
 const out=`/* GÉNÉRÉ par scripts/i18n/build.js à partir de i18n/en/*.json — ne pas modifier à la main. */\n(function(r){var d=${body};if(typeof module==='object'&&module.exports)module.exports=d;if(r)r.ChroniquesI18nData=d;})(typeof globalThis!=='undefined'?globalThis:this);\n`;
 fs.mkdirSync(path.join(ROOT,'src','i18n'),{recursive:true});fs.writeFileSync(path.join(ROOT,'src','i18n','en.js'),out);
 console.log(Object.keys(ui).length+' traductions ; '+missing.length+' unités sans traduction sur '+Object.keys(units).length+'.');
 if(process.argv.includes('--check'))console.log(missing.join('\n'));return {ui,missing};}
if(require.main===module)run();
module.exports={run,load};
