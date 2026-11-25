'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {backup}=require('../scripts/backup');
test('Sauvegarde V1.6 : base et dossier privé des images sont copiés ensemble',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'chr-img-backup-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 fs.mkdirSync(path.join(root,'data','media'),{recursive:true});
 const content='image factice pour test';fs.writeFileSync(path.join(root,'data','media','exemple.webp'),content);
 fs.writeFileSync(path.join(root,'data','chroniques-db.json'),JSON.stringify({format:5,users:[],campaigns:[],invites:[]}));
 const target=backup(root);const images=target.replace(/\.json$/u,'.media');
 assert(fs.existsSync(target));assert.equal(fs.readFileSync(path.join(images,'exemple.webp'),'utf8'),content);
});
