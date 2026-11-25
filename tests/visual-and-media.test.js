
'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');
const app=fs.readFileSync(path.join(root,'src/online-app.js'),'utf8');
const css=fs.readFileSync(path.join(root,'src/styles.css'),'utf8');
test('V3.3 : portrait invalide n’affiche jamais alt cassé et garde une initiale',()=>{
 assert(app.includes('alt="" loading="lazy"'));
 assert(app.includes("document.addEventListener('error',event=>"));
 assert(app.includes("img.classList.contains('art-image')"));
 assert(app.includes('img.remove();return;'));
 assert(app.includes('img.replaceWith(fallback)'));
 assert(app.includes('class="avatar-initial"'));
 assert(!app.includes("alt=\"${chosen?'Illustration choisie'"));
});
test('V3.3 : les cartes empêchent le débordement du nom ou de l’illustration',()=>{
 for(const token of ['.pc-top{display:grid','minmax(0,1fr)','.pc-ident h3{font-family:Georgia','.avatar .art-image,.mj-portrait .art-image','overflow:hidden;flex-shrink:0','.pc-card .statsline'])assert(css.includes(token),token);
});
test('V3.3 : nouveau design fantasy et cache PWA isolé des données privées',()=>{
 assert(css.includes('Chroniques V3.3'));
 assert(css.includes('--sidebar:'));
 const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 assert(sw.includes('chroniques-public-v'));
 assert(!sw.includes("'/api/")&&!sw.includes("'/data/"));
 assert(!fs.existsSync(path.join(root,'data/chroniques-db.json')));
});
test('V3.3 : droits existants, dés physiques et migration sans écrasement',()=>{
 assert(app.includes("actor==='mj'"));assert(app.includes('Dés physiques'));
 assert(!app.includes('Math.random('));
 const bat=fs.readFileSync(path.join(root,'MIGRER_DONNEES.bat'));
 assert(bat.includes(Buffer.from('\r\n')));
 assert(bat.toString().includes('if exist "data\\chroniques-db.json"'));
});
