#!/usr/bin/env node
/* Chroniques — extrait les tables de folie du SRD 5.1 (CC BY 4.0) déjà présentes dans src/data/srd-regles-*.js
   et écrit src/data/srd-madness.js. Usage : node scripts/dev/build-madness.js */
'use strict';
const fs=require('node:fs'),path=require('node:path');const root=path.join(__dirname,'..','..');
const FR=require(path.join(root,'src/data/srd-regles-fr.js')),EN=require(path.join(root,'src/data/srd-regles-en.js'));
function sections(data){const out=[];const walk=x=>{if(Array.isArray(x))x.forEach(walk);else if(x&&typeof x==='object'){if(x.title&&Array.isArray(x.text))out.push(x);for(const v of Object.values(x))if(typeof v==='object')walk(v);}};walk(data);return out;}
// Lignes « 01–20\tTexte » (fr) ou « 01-20 · Texte » (en) ; les lignes sans plage prolongent la précédente.
function rows(lines){const out=[];for(let l of lines){l=String(l).replace(/^\|\s*/,'').replace(/\s*d100\s*(?:\t|·)\s*(?:Effets|Faille|Effect|Flaw).*$/,'').trim();if(!l||/^#/.test(l)||/^d100\b/.test(l))continue;
  const m=/^(\d{2,3})\s*[–-]\s*(\d{2,3})\s*(?:\t|·)\s*(.*)$/.exec(l);if(m)out.push([Number(m[1]),Number(m[2]),m[3].trim()]);else if(out.length)out[out.length-1][2]=(out[out.length-1][2]+' '+l).replace(/\s+/g,' ').trim();}
 return out;}
function fr(){const sec=sections(FR).find(s=>s.title==='Effets de la folie');const t=sec.text;const at=h=>t.findIndex(x=>x.includes(h));
 const a=at('### Folies passagères'),b=at('### Folies persistantes'),c=at('### Folies à durée illimitée');return {short:rows(t.slice(a+1,b)),long:rows(t.slice(b+1,c)),indefinite:rows(t.slice(c+1))};}
function en(){const all=sections(EN);const get=n=>rows(all.find(s=>s.title===n).text);return {short:get('Short-Term Madness'),long:get('Long-Term Madness'),indefinite:get('Indefinite Madness')};}
const data={fr:fr(),en:en()};
for(const lang of ['fr','en'])for(const k of ['short','long','indefinite']){const r=data[lang][k];if(!r.length||r[0][0]!==1||r[r.length-1][1]!==100)throw new Error('Table incomplète : '+lang+' '+k);for(let i=1;i<r.length;i++)if(r[i][0]!==r[i-1][1]+1)throw new Error('Trou dans '+lang+' '+k+' à '+r[i][0]);}
const out='/* Tables de folie — System Reference Document 5.1, Wizards of the Coast LLC, licence CC BY 4.0. Généré par scripts/dev/build-madness.js. */\n(function(root){const d='+JSON.stringify(data)+';if(typeof module===\'object\'&&module.exports)module.exports=d;if(root)root.ChroniquesSRDMadness=d;})(typeof globalThis!==\'undefined\'?globalThis:this);\n';
fs.writeFileSync(path.join(root,'src/data/srd-madness.js'),out);console.log('srd-madness.js :',Object.entries(data.fr).map(([k,v])=>k+' '+v.length).join(', '));
