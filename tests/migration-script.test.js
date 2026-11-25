'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');

test('Migration : un seul script, fins de ligne Windows, aucun écrasement ni suppression',()=>{
 const legacy=fs.readdirSync(root).filter(f=>/^COPIER_DONNEES_V.*\.bat$/.test(f));
 assert.deepEqual(legacy,[],'les anciens scripts par version doivent avoir disparu');
 const bat=fs.readFileSync(path.join(root,'MIGRER_DONNEES.bat'));const text=bat.toString('utf8');
 assert.ok(bat.includes(Buffer.from('\r\n')));assert.ok(!/(^|[^\r])\n/.test(text),'fin de ligne LF isolée dans un script CMD');
 for(const token of ['if exist "data\\chroniques-db.json"','copy /-Y','xcopy','data\\media','remote-origin.txt'])assert.ok(text.includes(token),token);
 assert.ok(!/(^|\s)(del|rmdir|rd|erase|move)\s/i.test(text),'le script de migration ne doit rien supprimer ni déplacer');
 assert.ok(!/copy\s+\/Y\s/i.test(text),'jamais de copie qui écrase sans confirmation');
 assert.ok(!/V3\.\d/.test(text),'le script doit rester indépendant de la version');
});
