
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const code=fs.readFileSync(path.join(root,'src/online-app.js'),'utf8');
const css=fs.readFileSync(path.join(root,'src/styles.css'),'utf8');
test('V3.2 : navigation principale courte, outils avancés conservés',()=>{
 assert(code.includes('class="nav-group"'));
 for(const id of ['overview','combat','character','maps','session','inventory','grimoire','encounters','stories','chronicle','illustrations','campaign','settings','guide'])assert(code.includes("navButton('"+id+"'"),id);
 for(const title of ['Suivi de la partie','Préparation','Bibliothèque & réglages'])assert(code.includes(title),title);
});
test('V3.2 : raccourcis MJ, contenus secondaires repliables, menus compte',()=>{
 assert(code.includes('gm-quick-actions'));assert(code.includes('overview-secondary'));
 assert(code.includes('account-actions-menu'));assert(code.includes('data-task="logout"'));
 for(const id of ['session','chronicle','encounters','maps'])assert(code.includes('class="quick-tile" data-nav="'+id+'"'),id);
});
test('V3.2 : menus mobiles regroupés, rôles préservés, navigation accessible',()=>{
 assert(code.includes('mobile-nav-group'));assert(code.includes('aria-label="Navigation principale"'));
 assert(code.includes('aria-current="${page===id'));
 assert(code.includes('role="dialog" aria-modal="true"'));
 assert(code.includes("actor==='mj'"));
});
test('V3.2 : correctifs responsive et aucun changement de base ou de dés',()=>{
 for(const width of ['1200px','1100px','900px','590px','360px'])assert(css.includes(width),width);
 assert(css.includes('min-width:0'));assert(css.includes('overflow-wrap:anywhere'));
 assert(code.includes('Dés physiques'));assert(!code.includes('Math.random('));
 const bat=fs.readFileSync(path.join(root,'MIGRER_DONNEES.bat'));
 assert(bat.includes(Buffer.from('\r\n')));assert(!bat.toString().replaceAll('\r\n','').includes('\n'));
 assert(bat.toString().includes('if exist "data\\chroniques-db.json"'));
 assert(!fs.existsSync(path.join(root,'data/chroniques-db.json')));
});
