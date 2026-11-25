'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const O=require('../src/origins'),L=require('../src/logic'),P=require('../src/progression');
const {createServer}=require('../server'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const BASE={str:15,dex:14,con:13,int:12,wis:10,cha:8};
const input=(opts={})=>({speciesId:'elf',backgroundId:'acolyte',baseScores:{...BASE},distribution:'split',plus2:'int',plus1:'wis',...opts});
test('Catalogue SRD 2024 : 9 espèces, 4 historiques, 2014 : 9 races',()=>{
 assert.equal(Object.keys(O.SPECIES_2024).length,9);
 assert.equal(Object.keys(O.SPECIES_2014).length,9);
 assert.equal(Object.keys(O.BACKGROUNDS_2024).length,4);
 assert.equal(O.SPECIES_2024.elf.name,'Elfe');
 assert.deepEqual(O.BACKGROUNDS_2024.soldier.scores,['str','dex','con']);
});
test('2024 : origine répartie +2/+1 et +1/+1/+1 ; bonus jamais tirés de l’espèce',()=>{
 const r=O.compute(input(),'2024');assert.equal(r.finalScores.int,14);assert.equal(r.finalScores.wis,11);assert.equal(r.finalScores.dex,14);
 assert.equal(r.origin.grantedSkills.length,2);assert.equal(r.origin.originFeat,'Initié à la magie (Clerc)');
 const t=O.compute(input({distribution:'triple'}),'2024');assert.equal(t.finalScores.int,13);assert.equal(t.finalScores.wis,11);assert.equal(t.finalScores.cha,9);
});
test('2014 : bonus de race de base et sans historique 2024',()=>{
 const x=O.compute({speciesId:'dragonborn',backgroundId:'acolyte',baseScores:{...BASE}},'2014');
 assert.equal(x.finalScores.str,17);assert.equal(x.finalScores.cha,9);assert.equal(x.finalScores.int,12);
 assert.equal(x.origin.originFeat,null);
});
test('Vérification : invalides, dépassement 20, édition et historique personnalisé',()=>{
 assert.throws(()=>O.compute(input({plus1:'str'}),'2024'),/autorisées/);
 assert.throws(()=>O.compute(input({plus1:'int'}),'2024'),/différentes/);
 assert.throws(()=>O.compute(input({baseScores:{...BASE,int:19}}),'2024'),/dépasserait 20/);
 assert.throws(()=>O.compute(input({speciesId:'nope'}),'2024'),/inconnue/);
 assert.throws(()=>O.compute(input(),'custom'),/2014 ou 2024/);
 const p=O.compute(input({speciesId:'custom',speciesName:'Aasimar',backgroundId:'custom',backgroundName:'Voyageur',customEligible:['str','dex','wis'],plus2:'str',plus1:'dex'}),'2024');
 assert.equal(p.origin.speciesName,'Aasimar');assert.equal(p.origin.originFeat,null);assert.equal(p.finalScores.str,17);
 assert.throws(()=>O.compute(input({backgroundId:'custom',backgroundName:'Artisan',customEligible:['str','str','dex']}),'2024'),/distinctes/);
});
test('Les maîtrises d’historique 2024 sont prises en compte dans les compétences',()=>{
 const r=O.compute(input(),'2024');const pc={level:1,stats:{abilities:Object.fromEntries(Object.entries(r.finalScores))},origin:r.origin};
 assert.equal(P.skillValue(pc,'intuition'),2); // SAG 11 (+0) + maîtrise 2
 assert.equal(P.skillValue(pc,'religion'),4); // INT 14 (+2) + maîtrise 2
});
async function fixture(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-v10-'));const dataFile=path.join(dir,'base.json');const app=createServer({publicOrigin:null,dataFile,setupKey:'setup-v10'});
 await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+app.server.address().port;
 t.after(async()=>{await app.close();fs.rmSync(dir,{recursive:true,force:true});});
 async function call(route,b,cookie){const r=await fetch(base+route,{method:b===undefined?'GET':'POST',headers:{...(b===undefined?{}:{'Content-Type':'application/json'}),...(cookie?{Cookie:cookie}:{})},body:b===undefined?undefined:JSON.stringify(b)});
 const ct=r.headers.get('content-type');return {status:r.status,data:ct?.includes('application/json')?await r.json():await r.text(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
 const gm=(await call('/api/setup',{name:'Maître Test',password:'un mot de passe assez long',setupKey:'setup-v10'})).cookie;
 async function invoke(cookie,kind,id,options={}){const state=await call('/api/state',undefined,cookie);return call('/api/action',{baseVersion:state.data.version,kind,id,...options},cookie);}
 return {call,invoke,gm,dir,dataFile};
}
test('Serveur : fichier Origins accessible et créateur MJ conservant la base format 5',async t=>{
 const f=await fixture(t);const staticScript=await f.call('/src/origins.js');assert.equal(staticScript.status,200);assert.match(staticScript.data,/SPECIES_2024/);
 let r=await f.invoke(f.gm,'createHero','',{values:{name:'Solen',classId:'wizard',hp:8,ac:12,origin:input()}});
 assert.equal(r.status,200,JSON.stringify(r.data));const hero=r.data.state.characters.find(p=>p.name==='Solen');assert(hero);assert.equal(hero.level,1);
 assert.equal(hero.origin.backgroundName,'Acolyte');assert.equal(hero.stats.abilities.int,14);assert.equal(hero.job,'Magicien');
 const db=JSON.parse(fs.readFileSync(f.dataFile,'utf8'));assert.equal(db.format,5);assert.equal(db.campaigns[0].state.characters.find(p=>p.name==='Solen').origin.speciesName,'Elfe');
});
test('Serveur : rejette les origines invalides sans modifier la campagne',async t=>{
 const f=await fixture(t);let r=await f.invoke(f.gm,'setOrigin','aelin',{origin:input({plus1:'dex'})});assert.equal(r.status,400);
 r=await f.invoke(f.gm,'setOrigin','aelin',{origin:input()});assert.equal(r.status,200);
 const pc=r.data.state.characters.find(p=>p.id==='aelin');assert.equal(pc.origin.speciesName,'Elfe');
 const baseline=pc.stats.abilities.int;
 r=await f.invoke(f.gm,'setOrigin','aelin',{origin:input()});assert.equal(r.status,200);assert.equal(r.data.state.characters.find(p=>p.id==='aelin').stats.abilities.int,baseline);
});
test('Serveur : éditeur conserve les bonus et changer édition exige confirmation',async t=>{
 const f=await fixture(t);let r=await f.invoke(f.gm,'setOrigin','aelin',{origin:input()});assert.equal(r.status,200);
 let pc=r.data.state.characters.find(p=>p.id==='aelin');const scores={...pc.stats.abilities,dex:16};
 r=await f.invoke(f.gm,'editPc','aelin',{values:{name:pc.name,role:pc.role,job:pc.job,level:pc.level,hpMax:pc.stats.hp,ac:pc.stats.ac,speed:pc.speed,passive:pc.stats.passive,scores}});
 assert.equal(r.status,200,JSON.stringify(r.data));pc=r.data.state.characters.find(p=>p.id==='aelin');assert.equal(pc.origin.baseScores.dex,16);
 r=await f.invoke(f.gm,'edition','',{value:'2014'});assert.equal(r.status,400);
 r=await f.invoke(f.gm,'edition','',{value:'2014',confirmOriginReset:true});assert.equal(r.status,200);
 pc=r.data.state.characters.find(p=>p.id==='aelin');assert.equal(pc.origin,undefined);assert.equal(pc.stats.abilities.int,12);assert.equal(pc.stats.abilities.dex,16);
});
test('Serveur : un joueur ne peut pas modifier l’origine d’un autre personnage',async t=>{
 const f=await fixture(t);const invite=(await f.call('/api/invites',{characterId:'aelin'},f.gm)).data.code;
 const player=(await f.call('/api/join',{code:invite,name:'Joueur Test',password:'secret bien assez long'})).cookie;
 let r=await f.invoke(player,'setOrigin','brunna',{origin:input()});assert.equal(r.status,403);
 r=await f.invoke(player,'setOrigin','aelin',{origin:input()});assert.equal(r.status,200);
 assert.equal(r.data.state.characters.find(p=>p.id==='brunna').origin,undefined);
});
test('Sous-races SRD 2014 et lignées 2024 : options validées, bonus adaptés',()=>{
 const base={...BASE};
 const dwarf=O.compute({speciesId:'dwarf',variantId:'hill',backgroundId:'acolyte',baseScores:base},'2014');
 assert.equal(dwarf.origin.variantName,'Nain des collines');assert.equal(dwarf.finalScores.con,15);assert.equal(dwarf.finalScores.wis,11);
 const elf=O.compute({...input(),variantId:'high'},'2024');
 assert.equal(elf.origin.variantName,'Haut-elfe');assert.equal(elf.finalScores.dex,14); // pas de bonus racial en 2024
 assert.throws(()=>O.compute({...input(),variantId:'hill'},'2024'),/inconnue/);
});
