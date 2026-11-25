'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createServer}=require('../server'),AI=require('../src/scenario-ai');
function example(){return {title:'Le phare',pitch:'Un phare s’éteint.',hook:'Des marins demandent de l’aide.',objective:'Sauver la côte.',antagonist:'Des ombres.',stakes:'Village menacé.',secret:'SECRET PERSONNEL DU MJ 7777',finale:'Le phare se rallume.',status:'draft',acts:[0,1,2].map(i=>({title:'Acte '+i,challenge:'Défi '+i,outcome:'Impact '+i})),links:[]};}
async function fixture(t,key='fake-test-key'){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-v30-'));let requests=[];
 const stub=async(url,options)=>{requests.push({url,options});return {ok:true,status:200,json:async()=>({output:[{content:[{type:'output_text',text:'Proposition fictive MJ : mystérieuse rencontre.'}]}]})};};
 const instance=createServer({publicOrigin:null,dataFile:path.join(dir,'db.json'),setupKey:'test-key',aiKey:key,aiFetch:stub});await new Promise(r=>instance.server.listen(0,'127.0.0.1',r));t.after(async()=>{await instance.close();fs.rmSync(dir,{recursive:true,force:true});});const base='http://127.0.0.1:'+instance.server.address().port;
 const call=async(route,body,cookie='',extra={})=>{const res=await fetch(base+'/api/'+route,{method:body===undefined?'GET':'POST',headers:{...(body===undefined?{}:{'content-type':'application/json'}),...(cookie?{cookie}:{}),...extra},body:body===undefined?undefined:JSON.stringify(body)});return {status:res.status,result:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]};};
 const owner=(await call('setup',{name:'MJ Test',password:'mon-motdepasse-solide',setupKey:'test-key'})).cookie;
 const invite=(await call('invites',{characterId:'aelin'},owner)).result;const player=(await call('join',{name:'Joueuse Test',password:'un-secret-tres-solide',code:invite.code})).cookie;
 const story=await call('action',{kind:'storyAdd',baseVersion:(await call('state',undefined,owner)).result.version,values:example()},owner);
 return {call,owner,player,storyId:story.result.state.storyPlans[0].id,requests,instance};
}
test('V3.0 : aucune fuite ni requête distante sans action explicite du MJ',async t=>{const f=await fixture(t);const status=await f.call('ai/status',undefined,f.owner);assert.equal(status.status,200);assert.equal(status.result.enabled,true);assert.equal(status.result.model,'gpt-4.1-mini');
 assert.equal((await f.call('ai/status',undefined,f.player)).status,403);
 assert.equal((await f.call('ai/preview',{task:'npc',storyId:f.storyId,fields:[],notes:''},f.player)).status,403);
 const pre=await f.call('ai/preview',{task:'npc',storyId:f.storyId,fields:[],notes:'Une idée originale'},f.owner);assert.equal(pre.status,200);assert(!pre.result.prompt.includes('SECRET PERSONNEL DU MJ'));assert(!pre.result.prompt.includes('Le phare'));assert.equal(f.requests.length,0);
 assert.equal((await f.call('ai/generate',{ticket:pre.result.ticket,confirm:false},f.owner)).status,403);assert.equal(f.requests.length,0);
 assert.equal((await f.call('ai/generate',{ticket:pre.result.ticket,confirm:true},f.player)).status,403);assert.equal(f.requests.length,0);
 const response=await f.call('ai/generate',{ticket:pre.result.ticket,confirm:true},f.owner);assert.equal(response.status,200);assert.match(response.result.text,/mystérieuse/);assert.equal(response.result.saved,false);
 assert.equal(f.requests.length,1);const payload=JSON.parse(f.requests[0].options.body);assert.equal(payload.store,false);assert(!JSON.stringify(payload).includes('SECRET PERSONNEL DU MJ'));assert.equal(f.requests[0].url,'https://api.openai.com/v1/responses');assert.equal((await f.call('ai/generate',{ticket:pre.result.ticket,confirm:true},f.owner)).status,403);
 const v=(await f.call('state',undefined,f.owner)).result.state;assert.equal(v.storyPlans[0].secret,example().secret);assert(!JSON.stringify((await f.call('state',undefined,f.player)).result).includes('SECRET PERSONNEL DU MJ'));
});
test('V3.0 : secrets joints uniquement si leur case est cochée, prévisualisation exacte',async t=>{const f=await fixture(t);let preview=await f.call('ai/preview',{task:'twist',storyId:f.storyId,fields:['title','stakes'],notes:'Choix libre'},f.owner);assert.equal(preview.status,200);assert.match(preview.result.prompt,/Le phare/);assert(!preview.result.prompt.includes('SECRET PERSONNEL DU MJ'));const other=await f.call('ai/preview',{task:'aftermath',storyId:f.storyId,fields:['secret'],notes:''},f.owner);assert.match(other.result.prompt,/SECRET PERSONNEL DU MJ/);assert.equal((await f.call('ai/generate',{ticket:preview.result.ticket,confirm:true},f.owner)).status,403);const got=await f.call('ai/generate',{ticket:other.result.ticket,confirm:true},f.owner);assert.equal(got.status,200);assert.equal(JSON.parse(f.requests[0].options.body).input,other.result.prompt);});
test('V3.0 : limite de longueur, tâches, champs, et mauvaise origine bloqués',async t=>{const f=await fixture(t);for(const body of [{task:'bad',fields:[]},{task:'npc',fields:['unknown']},{task:'npc',notes:'x'.repeat(1201)},{task:'npc',storyId:'story-inexistant',fields:['secret']},{task:'npc',storyId:f.storyId,fields:['title','title']}])assert.equal((await f.call('ai/preview',body,f.owner)).status,400);
 assert.equal((await f.call('ai/preview',{task:'npc',fields:[]},f.owner,{origin:'https://evil.test'})).status,403);
 assert.equal(f.requests.length,0);assert.throws(()=>AI.model('abc\nHeader'));});
test('V3.0 : co-MJ peut demander, mais perd cet accès dès sa rétrogradation',async t=>{const f=await fixture(t);const person=(await f.call('management',undefined,f.owner)).result.roleAssignments.find(m=>m.role==='player');await f.call('member/role',{userId:person.userId,role:'gm'},f.owner);const p=await f.call('ai/preview',{task:'encounter',fields:[]},f.player);assert.equal(p.status,200);await f.call('member/role',{userId:person.userId,role:'player'},f.owner);assert.equal((await f.call('ai/generate',{ticket:p.result.ticket,confirm:true},f.player)).status,403);assert.equal(f.requests.length,0);});
test('V3.0 : IA désactivée sans clé, mais préparation locale conservée',async t=>{const f=await fixture(t,'');assert.equal((await f.call('ai/status',undefined,f.owner)).result.enabled,false);const p=await f.call('ai/preview',{task:'npc',fields:[]},f.owner);assert.equal(p.status,200);const r=await f.call('ai/generate',{ticket:p.result.ticket,confirm:true},f.owner);assert.equal(r.status,503);assert.equal(f.requests.length,0);});
test('V3.0 : interface MJ échappée, clé jamais exposée, données jamais dans le cache PWA',()=>{const root=path.join(__dirname,'..');const ui=fs.readFileSync(path.join(root,'src/online-app.js'),'utf8'),sv=fs.readFileSync(path.join(root,'server.js'),'utf8'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');for(const word of ['aiWorkshop','ai-prepare','ai-generate','ai/preview','ai/generate','esc(aiResult)','esc(aiPreview.prompt)'])assert(ui.includes(word),word);assert(sw.includes('chroniques-public-v'));assert(!sw.includes('/api/ai'));assert(!ui.includes('CHRONIQUES_OPENAI_API_KEY'));assert(sv.includes('requireGm(u)'));});
test('V3.0 : quota de six générations par dix minutes, sans septième appel fournisseur',async t=>{
 const f=await fixture(t);
 for(let i=0;i<7;i++){
  const p=await f.call('ai/preview',{task:'npc',notes:'idée '+i,fields:[]},f.owner);
  assert.equal(p.status,200);
  const r=await f.call('ai/generate',{ticket:p.result.ticket,confirm:true},f.owner);
  assert.equal(r.status,i<6?200:429);
 }
 assert.equal(f.requests.length,6);
});
