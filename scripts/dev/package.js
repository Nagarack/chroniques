#!/usr/bin/env node
/* Chroniques — fabrique le ZIP de distribution Chroniques_V<x_y_z>.zip (dossier Chroniques_V<x.y.z>/).
   Jamais inclus : données (data/), réglages (config/), sauvegardes, mises à jour, clés (.pem, .jks),
   journaux, dépendances, fichiers de construction Android. Usage : node scripts/dev/package.js [dossier-de-sortie] */
'use strict';
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),os=require('node:os');
const root=path.join(__dirname,'..','..');const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;
const outDir=path.resolve(process.argv[2]||path.join(root,'dist'));fs.mkdirSync(outDir,{recursive:true});
const name='Chroniques_V'+version,zipName='Chroniques_V'+version.replace(/\./g,'_')+'.zip';
const stage=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-paquet-'));const dest=path.join(stage,name);
const SKIP_DIRS=new Set(['data','config','backups','updates','node_modules','.git','__pycache__','dist']);
const skipFile=f=>/\.(log|pem|jks|keystore|idsig)$/i.test(f)||f==='update-source.local.json'||f==='.DS_Store';
function copy(src,dst,rel=''){fs.mkdirSync(dst,{recursive:true});for(const e of fs.readdirSync(src,{withFileTypes:true})){const r=rel?rel+'/'+e.name:e.name;
 if(e.isDirectory()){if(!rel&&SKIP_DIRS.has(e.name))continue;if(r==='android/build'||e.name==='__pycache__')continue;copy(path.join(src,e.name),path.join(dst,e.name),r);}
 else if(e.isFile()&&!skipFile(e.name))fs.copyFileSync(path.join(src,e.name),path.join(dst,e.name));}}
copy(root,dest);for(const d of ['data','config'])fs.mkdirSync(path.join(dest,d),{recursive:true}),fs.writeFileSync(path.join(dest,d,'.gitkeep'),'');
const out=path.join(outDir,zipName);fs.rmSync(out,{force:true});
execFileSync('zip',['-qrX',out,name],{cwd:stage});fs.rmSync(stage,{recursive:true,force:true});
console.log(out);
