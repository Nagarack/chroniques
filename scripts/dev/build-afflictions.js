#!/usr/bin/env node
/* Chroniques — extrait les maladies et poisons d’exemple du SRD 5.1 (CC BY 4.0) déjà présents dans src/data/srd-regles-*.js
   et écrit src/data/srd-afflictions.js. Usage : node scripts/dev/build-afflictions.js */
'use strict';
const fs=require('node:fs'),path=require('node:path');const root=path.join(__dirname,'..','..');
function sections(data){const out=[];const walk=x=>{if(Array.isArray(x))x.forEach(walk);else if(x&&typeof x==='object'){if(x.title&&Array.isArray(x.text))out.push(x);for(const v of Object.values(x))if(typeof v==='object')walk(v);}};walk(data);return out;}
const DC=/\b(?:DD|DC) (\d+)/;
function build(lang){const all=sections(require(path.join(root,'src/data/srd-regles-'+lang+'.js')));
 const dz=lang==='fr'?['Fièvre rieuse','Peste des égouts','Pourriture oculaire']:['Cackle Fever','Sewer Plague','Sight Rot'];
 const diseases=dz.map(t=>{const s=all.find(x=>x.title===t);const text=s.text.join(' ').replace(/\*\*/g,'').replace(/\s+/g,' ').trim();const m=DC.exec(text);return {name:t,dc:m?Number(m[1]):null,text};});
 const ps=all.find(x=>x.title===(lang==='fr'?'Exemples de poisons':'Sample Poisons'));const raw=ps.text.join('\n');
 const poisons=[];const re=/\*\*([^*]+?)\s*\(([^)]+)\)\.\*\*\s*([^*]+)/g;let m;while((m=re.exec(raw))){const text=m[3].replace(/\s+/g,' ').trim();const d=DC.exec(text);poisons.push({name:m[1].trim(),type:m[2].trim(),dc:d?Number(d[1]):null,text});}
 if(poisons.length<10){const re2=/(?:^|\n)([A-Z][A-Za-z' ]+?) \((Contact|Ingested|Inhaled|Injury)\)\.\s*([^\n]+)/g;poisons.length=0;while((m=re2.exec(raw))){const text=m[3].trim();const d=DC.exec(text);poisons.push({name:m[1].trim(),type:m[2],dc:d?Number(d[1]):null,text});}}
 return {diseases,poisons};}
const fr=build('fr'),en=build('en');
const PAIRS={'Essence éthérée':'Essence of Ether','Fumées d’othur':'Burnt Othur Fumes','Huile de taggit':'Oil of Taggit','Larmes de minuit':'Midnight Tears','Malice':'Malice','Mucus de rampant':'Crawler Mucus','Poison de ver pourpre':'Purple Worm Poison','Poison de vouivre':'Wyvern Poison','Poison drow':'Drow Poison','Sang d’assassin':"Assassin's Blood",'Sérum de vérité':'Truth Serum','Teinture pâle':'Pale Tincture','Torpeur':'Torpor','Venin de serpent':'Serpent Venom','Fièvre rieuse':'Cackle Fever','Peste des égouts':'Sewer Plague','Pourriture oculaire':'Sight Rot'};
const items=[];for(const [kind,key] of [['disease','diseases'],['poison','poisons']])for(const x of fr[key]){const e=en[key].find(y=>y.name===PAIRS[x.name]);if(!e)throw new Error('Pas d’équivalent anglais : '+x.name);if(e.dc!==x.dc)throw new Error('DD différents : '+x.name);
 items.push({id:x.name,kind,dc:x.dc,fr:{name:x.name,type:x.type||'',text:x.text},en:{name:e.name,type:e.type||'',text:e.text}});}
if(items.length!==17)throw new Error('Nombre inattendu : '+items.length);
const data={items};
const out='/* Maladies et poisons d’exemple — System Reference Document 5.1, Wizards of the Coast LLC, licence CC BY 4.0. Généré par scripts/dev/build-afflictions.js. */\n(function(root){const d='+JSON.stringify(data)+';if(typeof module===\'object\'&&module.exports)module.exports=d;if(root)root.ChroniquesSRDAfflictions=d;})(typeof globalThis!==\'undefined\'?globalThis:this);\n';
fs.writeFileSync(path.join(root,'src/data/srd-afflictions.js'),out);console.log('srd-afflictions.js :',items.length,'entrées');
