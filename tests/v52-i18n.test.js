'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const C=require('../src/i18n-core.js');
const DICT=require('../src/i18n/en.js').ui;
const E=C.create(DICT);
test('traduction : textes, valeurs calculées, morceaux et noms du SRD',()=>{
 const cases={'Paramètres':'Settings','PV 24 sur 28':'HP 24 of 28','Elfe · Rôdeuse · niv. 3':'Elf · Ranger · lvl 3','À venir (0)':'Upcoming (0)','Aspersion acide':'Acid Splash','Gobelin':'Goblin','Potion de soins':'Potion of Healing','⚔ À vous de jouer !':'⚔ Your turn!'};
 for(const [fr,en] of Object.entries(cases))assert.equal(E.translateText(fr),en,fr);
 // Le texte saisi par les joueurs n'est pas inventé ni modifié.
 for(const t of ['Aëlin Sylveronce','Le dragon attaque la ville, vite !','12','—'])assert.equal(E.translateText(t),t);
});
test('traduction du HTML : données, champs et textes protégés intacts',()=>{
 const h='<label title="Fermer">Nom<input name="n" value="Fermer" placeholder="Rechercher…"></label><select><option value="Feu">Feu</option></select><textarea>Paramètres</textarea><div translate="no"><div>Modifier</div><p>Modifier</p></div><p>Modifier</p>';
 const out=E.translateHtml(h);
 assert.match(out,/title="Close"/);assert.match(out,/value="Fermer"/,'valeur de champ intacte');assert.match(out,/placeholder="Search…"/);
 assert.match(out,/<option value="Feu">Fire<\/option>/,'clé de donnée intacte, libellé traduit');
 assert.match(out,/<textarea>Paramètres<\/textarea>/,'zone de saisie intacte');
 assert.match(out,/<div translate="no"><div>Modifier<\/div><p>Modifier<\/p><\/div><p>Edit<\/p>/,'translate="no" respecté avec imbrication');
 assert.equal(E.translateHtml('<b>Journal &amp; quêtes</b>'),'<b>Journal &amp; quests</b>');
});
test('dictionnaire : mêmes valeurs {n} des deux côtés, aucun texte d’interface oublié',()=>{
 const ph=s=>(s.match(/\{\d+\}/g)||[]).sort().join();
 for(const [fr,en] of Object.entries(DICT))assert.equal(ph(en),ph(fr),fr);
 const units=Object.keys(JSON.parse(fs.readFileSync(path.join(root,'i18n','units.json'),'utf8')));
 const ignored=/^(Langue : français|Tu aides un maître du jeu)/;
 const missing=units.filter(u=>/[éèàùçêâîôœ’]/.test(u)&&/ /.test(u)&&!(u in DICT)&&!ignored.test(u));
 assert.deepEqual(missing,[],'textes à traduire : node scripts/i18n/extract.js puis i18n/en/*.json');
});
test('SRD anglais : mêmes identifiants que la version française',()=>{
 const fr=require('../src/data/srd-regles-fr.js'),en=require('../src/data/srd-regles-en.js');
 assert.deepEqual(Object.keys(en.spells).sort(),Object.keys(fr.spells).sort());
 const etats=en.rules.find(c=>c.id==='etats');assert.ok(etats.sections.some(s=>s.title==='Prone'));
 assert.equal(require('../src/data/srd-monsters.en.js').length,require('../src/data/srd-monsters.js').length);
 const ie=require('../src/data/srd-items.en.js'),i=require('../src/data/srd-items.js');assert.equal(ie.equipment.length,i.equipment.length);assert.equal(ie.magic.length,i.magic.length);
 // Clés de données (types de dégâts) inchangées : seules les étiquettes changent.
 const g=require('../src/data/srd-monsters.en.js').find(r=>r[0]==='adult-red-dragon');assert.equal(g[9].Feu,'immune');assert.equal(g[1],'Adult Red Dragon');
 assert.match(en.attribution,/Creative Commons Attribution 4\.0/);
});
test('pages d’aide anglaises servies, liens et langue des notifications',async t=>{
 const {fixture}=require('./_fixture.js');const f=await fixture(t);
 for(const u of ['/aide-mj.en.html','/aide-joueur.en.html','/guide.en.html','/tutos.en.html','/iphone.en.html','/iphone','/src/i18n/en.js','/src/data/srd-regles-en.js']){const r=await fetch(f.base+u);assert.equal(r.status,200,u);}
 assert.equal((await f.call('/api/lang',{method:'POST',cookie:f.pa,body:{lang:'en'}})).data.lang,'en');
 await f.action('start',{});let st=(await f.call('/api/state',{cookie:f.gm})).data.state;
 for(let i=0;i<6;i++){if(st.combat.order[st.combat.turnIndex]===f.a.id)break;await f.action('next',{});st=(await f.call('/api/state',{cookie:f.gm})).data.state;}
 const msgs=(await f.call('/api/notify/poll',{cookie:f.pa})).data.messages;
 assert.ok(msgs.some(m=>m.title==='Your turn!'),JSON.stringify(msgs));
});
