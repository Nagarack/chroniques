'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('V2.1 : navigation cohérente selon les rôles, retour clavier depuis Plus',()=>{
 const js=read('src/online-app.js');
 assert(js.includes("isGM?'Préparer la séance':'Scènes partagées'"));
 assert(js.includes("document.addEventListener('keydown'"));
 assert(js.includes("event.key==='Escape'"));
 assert(js.includes('aria-expanded="${mobileMore}"'));
 assert(js.includes('role="dialog" aria-modal="true"'));
 assert(js.includes('class="skip-link"'));
 assert(js.includes('aria-current="${i===guideStep?'));
});
test('V2.1 : états de connexion exacts et clairs',()=>{
 const js=read('src/online-app.js');
 for(const label of ['Connexion…','Reconnexion en cours…','● En direct'])assert(js.includes(label));
 assert(js.includes('role="status" aria-live="polite"'));
 assert(js.includes('connectionState=label'));
 assert(js.includes('${esc(connectionState)}'));
 assert(!js.includes('<strong id="realtime-state">● En direct</strong>'));
});
test('V2.1 : petits écrans, tap, focus, cache public isolé',()=>{
 const css=read('src/styles.css'),sw=read('sw.js');
 assert(css.includes('font-size:16px!important'));
 assert(css.includes(':focus-visible'));
 assert(css.includes('env(safe-area-inset-bottom)'));
 assert(css.includes('max-width:360px'));
 assert(sw.includes('chroniques-public-v'));
 assert(!sw.includes("'/api/"));
});
test('V2.1 : guide autonome, migration 2.0, pas de secrets',()=>{
 const guide=read('GUIDE_UTILISATION.html'),bat=read('MIGRER_DONNEES.bat');
 assert(guide.includes('Premier essai en 5 minutes'));
 assert(guide.includes('tous les dés sont lancés physiquement')||guide.includes('Tous les dés sont lancés physiquement'));
 assert(bat.includes('if exist "data\\chroniques-db.json"'));
 assert(bat.includes('xcopy'));
 assert(!fs.existsSync(path.join(root,'data/chroniques-db.json')));
});
