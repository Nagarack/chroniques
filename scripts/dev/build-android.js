#!/usr/bin/env node
/* Chroniques — construction de l'application Android (APK) sans Gradle.
   Outils nécessaires (Android SDK) : android.jar (API 23 ou plus), aapt, zipalign, apksigner, et dx ou d8.
   Variables : ANDROID_JAR (chemin de android.jar), ANDROID_BUILD_TOOLS (dossier des outils),
               CHRONIQUES_KEYSTORE, CHRONIQUES_KEYSTORE_PASS (clé de signature, alias « chroniques »).
   Usage : node scripts/dev/build-android.js [--sortie android/chroniques.apk] [--cle-temporaire]
   L'interface web complète (fichiers publics du serveur) est intégrée dans l'APK (assets/app). */
'use strict';
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),os=require('node:os');
const root=path.join(__dirname,'..','..');const args=process.argv.slice(2);const opt=k=>{const i=args.indexOf('--'+k);return i>=0?args[i+1]:undefined;};
const version=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;
const [maj,min,pat]=version.split('.').map(Number);const versionCode=maj*10000+min*100+pat;
function find(name,dirs){for(const d of dirs){if(!d)continue;const p=path.join(d,name);if(fs.existsSync(p))return p;}try{return execFileSync('sh',['-c','command -v '+name]).toString().trim()||null;}catch{return null;}}
const sdk=process.env.ANDROID_HOME||process.env.ANDROID_SDK_ROOT||'/usr/lib/android-sdk';
const bt=process.env.ANDROID_BUILD_TOOLS||(()=>{try{const d=path.join(sdk,'build-tools');const v=fs.readdirSync(d).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})).pop();return path.join(d,v);}catch{return '';}})();
const jar=process.env.ANDROID_JAR||(()=>{try{const d=path.join(sdk,'platforms');const v=fs.readdirSync(d).filter(x=>fs.existsSync(path.join(d,x,'android.jar'))).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})).pop();return path.join(d,v,'android.jar');}catch{return '';}})();
const tool=n=>find(n,[bt]);
const aapt=tool('aapt'),zipalign=tool('zipalign'),apksigner=tool('apksigner'),d8=tool('d8'),dx=tool('dx')||tool('dalvik-exchange');
for(const [n,v] of [['android.jar',jar&&fs.existsSync(jar)?jar:null],['aapt',aapt],['zipalign',zipalign],['apksigner',apksigner],['d8 ou dx',d8||dx]])if(!v){console.error('Outil introuvable : '+n+' (voir l’en-tête de ce script).');process.exit(2);}
const run=(cmd,a,o={})=>execFileSync(cmd,a,{stdio:['ignore','pipe','inherit'],...o});
const build=path.join(root,'android','build');fs.rmSync(build,{recursive:true,force:true});
for(const d of ['gen','classes','assets/app','assets/start','dex'])fs.mkdirSync(path.join(build,d),{recursive:true});
// 1. Interface web intégrée : exactement les fichiers publics du serveur.
const serverText=fs.readFileSync(path.join(root,'server.js'),'utf8');const files={};
for(const m of serverText.matchAll(/\['(\/[^']*)',\s*\['([^']+)',\s*'([^']+)'\]\]/g)){const [,url,file,mime]=m;const src=path.join(root,file);if(!fs.existsSync(src))continue;const dest=file.replace(/\\/g,'/');fs.mkdirSync(path.dirname(path.join(build,'assets/app',dest)),{recursive:true});fs.copyFileSync(src,path.join(build,'assets/app',dest));files[url]=[dest,mime];}
for(const f of fs.readdirSync(path.join(root,'assets','icons')).filter(f=>/^[a-z0-9-]+\.svg$/.test(f))){const dest='assets/icons/'+f;fs.mkdirSync(path.join(build,'assets/app/assets/icons'),{recursive:true});fs.copyFileSync(path.join(root,dest),path.join(build,'assets/app',dest));files['/'+dest]=[dest,'image/svg+xml'];}
if(!files['/']){console.error('Page d’accueil introuvable dans la liste des fichiers publics.');process.exit(1);}
fs.writeFileSync(path.join(build,'assets/app/files.json'),JSON.stringify({version,files}));
for(const f of fs.readdirSync(path.join(root,'android','assets','start')))fs.copyFileSync(path.join(root,'android','assets','start',f),path.join(build,'assets/start',f));
// 2. Manifeste avec la version de Chroniques.
const manifest=path.join(build,'AndroidManifest.xml');fs.writeFileSync(manifest,fs.readFileSync(path.join(root,'android','AndroidManifest.xml'),'utf8').replace('@VERSION_CODE@',String(versionCode)).replace('@VERSION_NAME@',version));
// 3. Ressources, compilation Java, conversion Dalvik.
const res=path.join(root,'android','res');
run(aapt,['package','-f','-m','-J',path.join(build,'gen'),'-M',manifest,'-S',res,'-I',jar]);
const srcs=[];const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(p.endsWith('.java'))srcs.push(p);}};walk(path.join(root,'android','src'));walk(path.join(build,'gen'));
run('javac',['-nowarn','-encoding','UTF-8','--release','8','-classpath',jar,'-d',path.join(build,'classes'),...srcs]);
const classes=[];const walkC=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walkC(p);else if(p.endsWith('.class'))classes.push(p);}};walkC(path.join(build,'classes'));
if(d8)run(d8,['--release','--min-api','24','--lib',jar,'--output',path.join(build,'dex'),...classes]);
else run(dx,['--dex','--output='+path.join(build,'dex','classes.dex'),path.join(build,'classes')]);
// 4. Paquet, alignement, signature.
const unsigned=path.join(build,'chroniques-unsigned.apk'),aligned=path.join(build,'chroniques-aligned.apk');
run(aapt,['package','-f','-M',manifest,'-S',res,'-A',path.join(build,'assets'),'-I',jar,'-F',unsigned]);
run(aapt,['add',unsigned,'classes.dex'],{cwd:path.join(build,'dex')});
run(zipalign,['-f','-p','4',unsigned,aligned]);
let ks=process.env.CHRONIQUES_KEYSTORE,pass=process.env.CHRONIQUES_KEYSTORE_PASS;
if(!ks&&args.includes('--cle-temporaire')){ks=path.join(build,'cle-temporaire.jks');pass='temporaire';run('keytool',['-genkeypair','-keystore',ks,'-storepass',pass,'-keypass',pass,'-alias','chroniques','-keyalg','RSA','-keysize','3072','-validity','10000','-dname','CN=Chroniques (cle temporaire)']);console.warn('ATTENTION : clé temporaire — une application signée ainsi ne pourra pas être mise à jour par une version signée avec la vraie clé.');}
if(!ks||!pass){console.error('Clé de signature manquante : CHRONIQUES_KEYSTORE et CHRONIQUES_KEYSTORE_PASS (ou --cle-temporaire pour un essai).');process.exit(2);}
const out=path.resolve(root,opt('sortie')||path.join('android','chroniques.apk'));
run(apksigner,['sign','--ks',ks,'--ks-pass','env:CHRONIQUES_KS_PASS','--ks-key-alias','chroniques','--key-pass','env:CHRONIQUES_KS_PASS','--min-sdk-version','24','--out',out,aligned],{env:{...process.env,CHRONIQUES_KS_PASS:pass}});
run(apksigner,['verify',out]);
fs.rmSync(out+'.idsig',{force:true});
console.log('Application Android '+version+' ('+versionCode+') : '+path.relative(root,out)+' — '+(fs.statSync(out).size/1048576).toFixed(1)+' Mo, '+Object.keys(files).length+' fichiers intégrés.');
