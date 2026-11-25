 'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),ui=fs.readFileSync(path.join(root,'src/online-app.js'),'utf8'),css=fs.readFileSync(path.join(root,'src/styles.css'),'utf8');
test('V3.4 : raccourcis contextuels role-aware et navigation accessible',()=>{
 for(const k of ['function uxContext()','data-ux-go','function uxGo(where)','function uxScroll(selector)','aria-label="Accès rapide','data-ux-mode'])assert(ui.includes(k),k);
 assert(ui.includes("page==='maps'?(gm?"));assert(ui.includes("page!=='overview'||onboardHidden"));assert(ui.includes("if(where==='marker'&&actor==='mj')"));
});
test('V3.4 : la vue essentielle conserve l’accès aux outils secondaires',()=>{
 for(const k of ['function uxFold(label,content)','uxSimple&&!openFolds.has(label)?\'\':\'open\'','data-ux-mode','ux-complete','ux-simple'])assert(ui.includes(k),k);
 assert(css.includes('.ux-fold[open]'));assert(!css.includes('.ux-simple .creature-panel{display:none'));
});
test('V3.4 : filtres de scènes et respect de la projection serveur',()=>{
 assert(ui.includes('sceneFilter=\'all\''));assert(ui.includes('visibleScenes.map'));assert(ui.includes('data-ux-scene-filter'));
 assert(ui.includes("if(!['all','active','planned','completed'].includes"));
});
test('V3.4 : mode utilisateur local et aucune simulation de dés',()=>{
 assert(ui.includes('chroniques-ux-v34:'));assert(ui.includes('localStorage.setItem'));assert(!ui.includes('Math.random('));
 const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');assert(sw.includes('chroniques-public-v'));assert(!sw.includes("'/api/"));
});
test('V3.4 : migration Windows V3.3 non destructive',()=>{
 const bat=fs.readFileSync(path.join(root,'MIGRER_DONNEES.bat'));assert(bat.includes(Buffer.from('\r\n')));const s=bat.toString();
 assert(s.includes('if exist "data\\chroniques-db.json"'));
 assert(s.includes('xcopy'));
});
