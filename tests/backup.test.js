'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const os=require('node:os');
const {backup}=require('../scripts/backup');
test('sauvegarde horodatée autonome vérifie format et conserve les données',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-backup-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 fs.mkdirSync(path.join(root,'data'));
 assert.throws(()=>backup(root),/Aucune campagne/);
 fs.writeFileSync(path.join(root,'data','chroniques-db.json'),JSON.stringify({format:4,users:[],campaigns:[]}));
 assert.throws(()=>backup(root),/Format de base inattendu/);
 const expected={format:5,users:[{id:'mj',name:'MJ'}],campaigns:[{id:'c',state:{title:'Test'}}],invites:[]};
 fs.writeFileSync(path.join(root,'data','chroniques-db.json'),JSON.stringify(expected));
 const target=backup(root);assert.match(target,/backups\/chroniques-backup-/);assert.deepEqual(JSON.parse(fs.readFileSync(target,'utf8')),expected);
 assert.ok(target.startsWith(root));
});
