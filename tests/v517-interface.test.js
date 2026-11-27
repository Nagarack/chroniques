'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const DIR=path.join(__dirname,'..','src','interface');const {assemble,OUT}=require('../scripts/dev/build-app.js');

test('5.17 : src/online-app.js est exactement l’assemblage des morceaux de src/interface/',()=>{
 assert.equal(fs.readFileSync(OUT,'utf8'),assemble(),'lancez node scripts/dev/build-app.js après avoir modifié un morceau');});

test('5.17 : chaque morceau commence sur une nouvelle instruction (aucune coupure au milieu d’un texte)',()=>{
 const files=fs.readdirSync(DIR).sort();assert.ok(files.length>=20);for(const f of files)assert.match(f,/^\d{2}-[a-z0-9-]+\.js$/);
 const parts=files.map(f=>fs.readFileSync(path.join(DIR,f),'utf8'));
 for(let i=1;i<parts.length;i++){assert.doesNotThrow(()=>new vm.Script(parts.slice(0,i).join('')+'\n})();'),'coupure avant '+files[i]);assert.match(parts[i],/^\/\/ ——— \d{2} · /,'bandeau de '+files[i]);}
 assert.match(parts[0],/FICHIER GÉNÉRÉ/);});
