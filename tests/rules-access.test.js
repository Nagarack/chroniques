'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const L=require('../src/logic');
const A=require('../scripts/cloudflare-access');
const id='0123456789abcdef0123456789abcdef';
const cfg=()=>A.buildConfig({accountId:id,origin:'https://chroniques-jdr.com',emails:'MJ@example.fr, a@example.com;MJ@example.fr'});
test('2024 et 2014 : progression du bonus de maîtrise par niveau',()=>{
 for(const [level,pb] of [[1,2],[4,2],[5,3],[8,3],[9,4],[12,4],[13,5],[16,5],[17,6],[20,6]])assert.equal(L.proficiencyBonus(level),pb);
 assert.equal(L.proficiencyBonus(0),null);
 assert.equal(L.proficiencyBonus(21),null);
});
test('modificateurs sans valeurs supposées, perception et initiative de base',()=>{
 for(const [score,mod] of [[1,-5],[8,-1],[9,-1],[10,0],[11,0],[14,2],[16,3],[20,5],[30,10]])assert.equal(L.abilityModifier(score),mod);
 assert.equal(L.abilityModifier(undefined),null);
 const p=L.findPc(L.initialState(),'aelin');assert.equal(L.baseRulesSummary(p).initiativeBase,null);
 p.stats.abilities={dex:16,wis:15};assert.equal(L.baseRulesSummary(p).initiativeBase,3);assert.equal(L.baseRulesSummary(p).passivePerceptionBase,12);
 assert.equal(L.baseRulesSummary(p).proficiency,2);
});
test('Cloudflare Access : ne conserve que les adresses exactes et rejette un domaine ouvert',()=>{
 const c=cfg();assert.deepEqual(c.emails,['mj@example.fr','a@example.com']);
 const p=A.applicationPayload(c);assert.equal(p.type,'self_hosted');assert.equal(p.destinations[0].uri,'chroniques-jdr.com');
 assert.equal(p.policies[0].decision,'allow');assert.deepEqual(p.policies[0].include,[{email:{email:'mj@example.fr'}},{email:{email:'a@example.com'}}]);
 assert.throws(()=>A.cleanEmails('everyone'),/adresses/);
 assert.throws(()=>A.buildConfig({accountId:'123',origin:'https://chroniques-jdr.com',emails:'a@example.com'}),/Account ID/);
});
test('Cloudflare Access : aucune suppression ni remplacement de configuration existante',async()=>{
 const calls=[];const transport=async(url,opts)=>{
  calls.push({url,method:opts.method||'GET'});
  return {ok:true,status:200,json:async()=>({success:true,result:[{id:'existing',destinations:[{uri:'chroniques-jdr.com'}]}]})};
 };
 await assert.rejects(A.protect(cfg(),'abcdefghijklmnopqrst123',transport),/protège déjà/);
 assert.equal(calls.length,1);assert.equal(calls[0].method,'GET');
});
test('Cloudflare Access : test de création simulée puis vérification serveur',async()=>{
 const calls=[];const transport=async(url,opts)=>{
  const method=opts.method||'GET';calls.push({url,method,body:opts.body&&JSON.parse(opts.body)});
  let result;
  if(method==='POST') result={id:'newapp'};
  else if(url.endsWith('/newapp'))result={id:'newapp',destinations:[{uri:'chroniques-jdr.com'}]};
  else result=[];
  return {ok:true,status:200,json:async()=>({success:true,result})};
 };
 const done=await A.protect(cfg(),'abcdefghijklmnopqrst123',transport);
 assert.equal(done.verified,true);assert.deepEqual(calls.map(x=>x.method),['GET','POST','GET']);
 assert.equal(calls[1].body.policies[0].include.length,2);
});
