#!/usr/bin/env node
'use strict';
/**
 * Génère src/styles-light.css à partir de src/styles.css (thème sombre).
 * Principe : seules les déclarations de couleur sont reprises ; la luminosité est inversée en
 * conservant la teinte (les neutres chauds deviennent du papier, les verts et bleus restent verts
 * et bleus), ce qui garde les rapports de contraste. Les ombres, voiles de fenêtres et le
 * parchemin (déjà clair à encre sombre) ne sont pas touchés.
 * Usage : node scripts/generate-light-theme.js [--check]   (--check échoue si le fichier est périmé)
 */
const fs=require('node:fs');
const path=require('node:path');
const SRC=path.join(__dirname,'..','src','styles.css');
const OUT=path.join(__dirname,'..','src','styles-light.css');

function hexToRgb(h){h=h.slice(1);if(h.length<=4)h=[...h].map(c=>c+c).join('');const n=v=>parseInt(v,16);return {r:n(h.slice(0,2)),g:n(h.slice(2,4)),b:n(h.slice(4,6)),a:h.length===8?n(h.slice(6,8))/255:1};}
function rgbToHsl(r,g,b){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h=0,s=0;const l=(mx+mn)/2;if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;}return {h,s,l};}
function hslToRgb(h,s,l){h/=360;const f=(p,q,t)=>{if(t<0)t+=1;if(t>1)t-=1;return t<1/6?p+(q-p)*6*t:t<1/2?q:t<2/3?p+(q-p)*(2/3-t)*6:p;};let r,g,b;if(s===0)r=g=b=l;else{const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;r=f(p,q,h+1/3);g=f(p,q,h);b=f(p,q,h-1/3);}return [r,g,b].map(v=>Math.round(v*255));}
function invert({r,g,b,a},keepShadow,text){
  const {h,s,l}=rgbToHsl(r,g,b);
  if(keepShadow&&l<.12)return {r,g,b,a};
  let l2=Math.min(.985,Math.max(.03,.98-.9*l));
  // Texte clair sur fond sombre -> encre assez foncée sur papier (contraste AA d'au moins 4,5:1).
  if(text&&l>=.45&&a>.5)l2=Math.min(l2,.33);
  const warm=h<70||h>340;
  let h2=h,s2;
  if(s<.12||(warm&&s<.35)){h2=32;s2=Math.min(Math.max(s,.2),.34);}   // neutres chauds -> papier et encre brune
  else s2=Math.min(1,s*(s<.35?1.25:.95));                            // teintes froides et vives conservées
  const [R,G,B]=hslToRgb(h2,s2,l2);return {r:R,g:G,b:B,a};
}
const hex2=n=>n.toString(16).padStart(2,'0');
function fmt({r,g,b,a}){return '#'+hex2(r)+hex2(g)+hex2(b)+(a<1?hex2(Math.round(a*255)):'');}
const COLOR_RE=/#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3,4}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g;
function rgbFunc(str){const m=str.match(/rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:[ ,/]+([\d.]+%?))?/i);if(!m)return null;let a=1;if(m[4])a=m[4].endsWith('%')?parseFloat(m[4])/100:parseFloat(m[4]);return {r:+m[1],g:+m[2],b:+m[3],a};}
function transformValue(prop,value){
  if(/url\(\s*["']?data:/i.test(value)&&!/gradient/i.test(value))return value;
  const shadow=/shadow|^filter$/.test(prop);const text=/^(color|caret-color|--text|--soft|--muted|--gold|--goldpale|--green|--red|--vellum|--vellum-dim)$/.test(prop);
  return value.replace(COLOR_RE,tok=>{
    let c;
    if(tok[0]==='#')c=hexToRgb(tok);else if(/^rgb/i.test(tok))c=rgbFunc(tok);else return tok;
    if(!c)return tok;
    return fmt(invert(c,shadow,text));
  });
}
const COLOR_PROP=/^(background|background-color|background-image|color|border|border-(top|right|bottom|left)|border-(top|right|bottom|left)?-?color|outline|outline-color|box-shadow|text-shadow|fill|stroke|caret-color)$/;
const hasColor=v=>/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/.test(v.replace(/url\(\s*["']?data:[^)]*\)/gi,''))&&!/^var\(--[a-z-]+\)$/.test(v.trim());
function splitTop(text,sep){const out=[];let depth=0,q=null,cur='';for(let i=0;i<text.length;i++){const ch=text[i];if(q){cur+=ch;if(ch==='\\'){cur+=text[++i]||'';}else if(ch===q)q=null;continue;}
  if(ch==='"'||ch==="'"){q=ch;cur+=ch;continue;}if(ch==='(')depth++;if(ch===')')depth--;if(ch===sep&&depth===0){out.push(cur);cur='';continue;}cur+=ch;}if(cur.trim())out.push(cur);return out;}
function parse(css){
  css=css.replace(/\/\*[\s\S]*?\*\//g,'');const nodes=[];let i=0;
  const readBlock=start=>{let depth=0,q=null;for(let j=start;j<css.length;j++){const ch=css[j];if(q){if(ch==='\\')j++;else if(ch===q)q=null;continue;}if(ch==='"'||ch==="'"){q=ch;continue;}if(ch==='{')depth++;if(ch==='}'){depth--;if(depth===0)return j;}}return css.length-1;};
  while(i<css.length){
    while(/\s/.test(css[i]||''))i++;if(i>=css.length)break;
    let j=i,q=null,paren=0;while(j<css.length){const ch=css[j];if(q){if(ch==='\\')j++;else if(ch===q)q=null;j++;continue;}if(ch==='"'||ch==="'"){q=ch;j++;continue;}if(ch==='(')paren++;if(ch===')')paren--;if((ch==='{'&&paren===0)||(ch===';'&&paren===0))break;j++;}
    const head=css.slice(i,j).trim();
    if(css[j]===';'){nodes.push({type:'stmt',text:head});i=j+1;continue;}
    const end=readBlock(j);const body=css.slice(j+1,end);
    if(head.startsWith('@')){const name=head.split(/[\s(]/)[0];nodes.push({type:'at',name,head,children:/^@(media|supports|layer)/.test(name)?parse(body):null});}
    else nodes.push({type:'rule',sel:head,decls:splitTop(body,';').map(d=>{const k=d.indexOf(':');return k<0?null:[d.slice(0,k).trim(),d.slice(k+1).trim()];}).filter(Boolean)});
    i=end+1;
  }
  return nodes;
}
function emit(nodes){
  let out='';
  for(const n of nodes){
    if(n.type==='rule'){
      if(/backdrop|overlay/.test(n.sel))continue;   // voiles de fenêtres : restent sombres
      if(/parchment|print-sheet|\.ps-|print-preview|print-root|print-mode|print-cards|print-book|spell-card|\.sc-|book-|table-screen|table-stage|\.ts-/.test(n.sel))continue; // fiche imprimable : toujours encre sombre sur papier blanc           // parchemin : déjà clair à encre sombre
      const keep=[];
      for(const [prop,val] of n.decls){
        if(prop.startsWith('--')&&!hasColor(val))continue;
        if(!hasColor(val)&&!COLOR_PROP.test(prop))continue;   // garde aussi « background:var(--x) » qui écrase une ancienne couleur
        const important=/!important\s*$/.test(val);const raw=val.replace(/\s*!important\s*$/,'');
        keep.push(prop+':'+transformValue(prop,raw)+(important?'!important':''));
      }
      if(keep.length)out+=n.sel+'{'+keep.join(';')+'}\n';
    }else if(n.type==='at'&&n.children){const inner=emit(n.children);if(inner)out+=n.head+'{\n'+inner+'}\n';}
  }
  return out;
}
const EXTRA=[
  ':root{color-scheme:light;--grain:none;--c-bg:#f4efe4;--c-bg-2:#ede5d6;--c-surface:#fbf8f1;--c-surface-2:#f0e9dc;--c-line:#dcd1be;--c-line-soft:#e7dfcf;--c-text:#2b2118;--c-muted:#5c4b37;--c-accent:#9a3a26;--c-accent-strong:#8c2f1f;--c-on-accent:#fffaf3;--c-ok:#3d6a4c;--c-warn:#a8741a;--c-danger:#b3402c;--c-focus:#8c2f1f}',
  '.workspace-parchment :is(p,span,small,li,strong,em,h1,h2,h3,h4,label,div){color:#3d2f1d}',
  '.workspace-parchment .muted,.workspace-parchment .muted *{color:#6b5a42}'
].join('\n')+'\n';
function build(){
  const body=emit(parse(fs.readFileSync(SRC,'utf8')));
  return '/* GÉNÉRÉ par scripts/generate-light-theme.js à partir de styles.css — ne pas modifier à la main.\n   Thème « vélin clair » : luminosité inversée, teintes conservées. */\n'+body+EXTRA;
}
if(require.main===module){
  const out=build();
  if(process.argv.includes('--check')){const cur=fs.existsSync(OUT)?fs.readFileSync(OUT,'utf8'):'';if(cur!==out){console.error('src/styles-light.css est périmé : lancez node scripts/generate-light-theme.js');process.exit(1);}console.log('Thème clair à jour.');}
  else{fs.writeFileSync(OUT,out);console.log('Généré :',path.relative(process.cwd(),OUT),(out.length/1024).toFixed(1)+' Ko');}
}
module.exports={build,invert,transformValue};
