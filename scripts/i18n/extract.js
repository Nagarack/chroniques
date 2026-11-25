#!/usr/bin/env node
'use strict';
/* Chroniques — extraction des textes français de l'interface (sources JS et pages) pour la traduction.
   Lit les littéraux de chaîne et les gabarits (`…${…}…`) sans exécuter le code, découpe le HTML en
   segments de texte et en attributs visibles (title, placeholder, aria-label, alt), et écrit la liste des
   « unités » à traduire : texte avec {0}, {1}… à la place des valeurs calculées.
     node scripts/i18n/extract.js            → i18n/units.json (et statistiques)
*/
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.join(__dirname,'..','..');
const SENT='\u0001';
// ---------- Analyse lexicale JS (chaînes, gabarits, commentaires, expressions régulières) ----------
function lex(src){const out=[];let i=0,prev='(';const n=src.length;
 const regexOK=()=>/[(,=:[!&|?{};+\-*%<>~^]$/.test(prev)||/\b(return|typeof|case|in|of|delete|void|throw|new|else|do|yield|await)$/.test(prev);
 function readString(q){let v='';i++;while(i<n&&src[i]!==q){if(src[i]==='\\'){const c=src[i+1];i+=2;if(c==='n')v+='\n';else if(c==='t')v+='\t';else if(c==='u'){if(src[i]==='{'){const e=src.indexOf('}',i);v+=String.fromCodePoint(parseInt(src.slice(i+1,e),16));i=e+1;}else{v+=String.fromCharCode(parseInt(src.slice(i,i+4),16));i+=4;}}else if(c==='x'){v+=String.fromCharCode(parseInt(src.slice(i,i+2),16));i+=2;}else if(c==='\n'){}else v+=c;continue;}v+=src[i++];}i++;return v;}
 function readTemplate(){const parts=[];let cur='';i++;while(i<n&&src[i]!=='`'){if(src[i]==='\\'){const c=src[i+1];i+=2;if(c==='n')cur+='\n';else if(c==='u'){if(src[i]==='{'){const e=src.indexOf('}',i);cur+=String.fromCodePoint(parseInt(src.slice(i+1,e),16));i=e+1;}else{cur+=String.fromCharCode(parseInt(src.slice(i,i+4),16));i+=4;}}else cur+=c;continue;}
  if(src[i]==='$'&&src[i+1]==='{'){parts.push(cur);cur='';i+=2;const start=i;code(true);parts.push({expr:src.slice(start,i-1)});continue;}cur+=src[i++];}
  parts.push(cur);i++;return parts;}
 function code(inExpr){let depth=0;while(i<n){const c=src[i];
  if(c==='/'&&src[i+1]==='/'){while(i<n&&src[i]!=='\n')i++;continue;}
  if(c==='/'&&src[i+1]==='*'){const e=src.indexOf('*/',i+2);i=e<0?n:e+2;continue;}
  if(c==='\''||c==='"'){const v=readString(c);out.push({t:'s',v});prev='a';continue;}
  if(c==='`'){const p=readTemplate();out.push({t:'t',parts:p});prev='a';continue;}
  if(c==='/'&&regexOK()){i++;let cls=false;while(i<n){const d=src[i];if(d==='\\'){i+=2;continue;}if(d==='['){cls=true;}else if(d===']')cls=false;else if(d==='/'&&!cls)break;else if(d==='\n')break;i++;}i++;while(/[a-z]/.test(src[i]||''))i++;prev='a';continue;}
  if(inExpr){if(c==='{')depth++;else if(c==='}'){if(depth===0){i++;return;}depth--;}}
  if(!/\s/.test(c)){if(/[\w$]/.test(c)){let w='';while(i<n&&/[\w$]/.test(src[i]))w+=src[i++];prev=w;continue;}prev=c;}
  i++;}}
 code(false);return out;}
// ---------- Découpage en unités ----------
const ATTRS=/\b(title|placeholder|aria-label|alt|data-tip|label)="([^"]*)"/g;
function looksFrench(t){const s=t.replace(/\{\d+\}/g,' ').replace(/&[a-z#0-9]+;/gi,' ').trim();
 if(!/[A-Za-zÀ-ÿ]{2,}/.test(s))return false;
 if(/^(https?:|\/[a-z]|#[a-z]|\.[a-z]|[a-z0-9_-]+:\/)/i.test(t.trim()))return false;
 if(/[À-ÿŒœ’«»]/.test(s))return true;
 if(/^[a-z0-9_$.\-\/\[\]=*#:@]+$/.test(s))return false; // identifiants, sélecteurs, clés
 if(/^[a-z0-9 _\-.:#\[\]=*>()'"|,]+$/.test(s)&&!/\b(de|la|le|les|du|des|un|une|et|en|pour|avec|sur|par|pas|ou|au|aux|vos|votre|ce|cette|ne|est|sont)\b/.test(s))return false;
 if(/^[A-Z_0-9]+$/.test(s)&&s.length<4)return false;
 return /[A-Za-zÀ-ÿ]/.test(s);}
function norm(t){return t.replace(/\s+/g,' ').trim();}
function unitsOfCombined(combined,addUnit){ // combined : texte avec SENT pour chaque valeur calculée
 let k=0;const re=/<!--[\s\S]*?-->|<\/?[a-zA-Z][^<>]*>/g;let last=0,m;const texts=[];
 while((m=re.exec(combined))){texts.push(combined.slice(last,m.index));let a;const tag=m[0];ATTRS.lastIndex=0;while((a=ATTRS.exec(tag)))texts.push(a[2]);last=re.lastIndex;}
 texts.push(combined.slice(last));
 for(const raw of texts){if(!raw||!raw.trim())continue;let c=0;const u=norm(raw.replace(new RegExp(SENT,'g'),()=>'{'+(c++)+'}'));if(u&&looksFrench(u))addUnit(u);}
 void k;}
function collect(file,src,units){const toks=lex(src);const add=u=>{if(u.length>600)return;(units.get(u)||units.set(u,new Set()).get(u)).add(file);};
 const walkTemplate=parts=>{let combined='';for(const p of parts){if(typeof p==='string')combined+=p;else{combined+=SENT;for(const sub of lex(p.expr))handle(sub);}}unitsOfCombined(combined,add);};
 const handle=tok=>{if(tok.t==='s'){if(tok.v.length>2000)return;unitsOfCombined(tok.v,add);}else walkTemplate(tok.parts);};
 for(const tok of toks)handle(tok);}
function files(){const list=[];const skip=new Set(['src/i18n.js','src/i18n-core.js','src/dom-morph.js','src/qr.js','src/state-diff.js','src/web-push.js','src/webauthn.js','src/pwa-register.js']);
 for(const f of fs.readdirSync(path.join(ROOT,'src')))if(f.endsWith('.js')&&!skip.has('src/'+f))list.push('src/'+f);
 list.push('server.js');for(const f of ['scripts/remote-update.js'])if(fs.existsSync(path.join(ROOT,f)))list.push(f);return list;}
function run(){const units=new Map();for(const f of files())collect(f,fs.readFileSync(path.join(ROOT,f),'utf8'),units);
 const sorted=[...units.keys()].sort((a,b)=>a.localeCompare(b,'fr'));const obj={};for(const u of sorted)obj[u]=[...units.get(u)].sort();
 fs.mkdirSync(path.join(ROOT,'i18n'),{recursive:true});fs.writeFileSync(path.join(ROOT,'i18n','units.json'),JSON.stringify(obj,null,0).replace(/\],"/g,'],\n"'));
 const chars=sorted.reduce((t,u)=>t+u.length,0);console.log(sorted.length+' unités, '+chars+' caractères.');return obj;}
if(require.main===module)run();
module.exports={lex,collect,looksFrench,norm,run};
