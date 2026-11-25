'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {createServer}=require('../server');
async function fixture(t){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'chroniques-v35-'));
 const app=createServer({publicOrigin:null,dataFile:path.join(dir,'db.json'),setupKey:'setup-test-v35'});
 await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
 t.after(async()=>{await app.close();fs.rmSync(dir,{recursive:true,force:true});});
 const base='http://127.0.0.1:'+app.server.address().port;
 async function req(pathname,body,cookie=''){
  const res=await fetch(base+'/api/'+pathname,{method:body===undefined?'GET':'POST',headers:{...(cookie?{Cookie:cookie}:{}),...(body===undefined?{}:{'Content-Type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body)});
  return {status:res.status,data:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]||''};
 }
 const owner=(await req('setup',{setupKey:'setup-test-v35',name:'MJ Principal',password:'pass-super-solide-2026'})).cookie;
 const first=(await req('campaigns',undefined,owner)).data.activeId;
 return {app,req,owner,first};
}
async function action(f,cookie,kind,rest){const st=await f.req('state',undefined,cookie);return f.req('action',{kind,baseVersion:st.data.version,...rest},cookie);}
test('V3.5 : le même compte crée deux campagnes indépendantes et navigue entre elles',async t=>{
 const f=await fixture(t);
 assert.equal((await f.req('campaigns/create',{title:'Les Royaumes Perdus'},f.owner)).status,200);
 const list=(await f.req('campaigns',undefined,f.owner)).data;
 assert.equal(list.campaigns.length,2);assert.notEqual(list.activeId,f.first);
 assert.equal((await action(f,f.owner,'gmNotes',{value:'Secret exclusivement deuxième campagne'})).status,200);
 assert.equal((await f.req('campaigns/select',{campaignId:f.first},f.owner)).status,200);
 const before=(await f.req('state',undefined,f.owner)).data;
 assert(!JSON.stringify(before).includes('Secret exclusivement deuxième campagne'));
 assert.equal((await f.req('campaigns/select',{campaignId:list.activeId},f.owner)).status,200);
 assert.match((await f.req('state',undefined,f.owner)).data.state.gmNotes,/Secret exclusivement/);
});
test('V3.5 : mode joueur sur une campagne MJ retire réellement les secrets côté serveur',async t=>{
 const f=await fixture(t);
 await action(f,f.owner,'gmNotes',{value:'SECRET_OFFICIEL_TEST'});
 const gm=(await f.req('state',undefined,f.owner)).data;
 assert.equal(gm.viewer.role,'gm');assert.equal(gm.viewer.accessRole,'gm');
 assert.equal((await f.req('view-mode',{mode:'player'},f.owner)).status,200);
 const player=(await f.req('state',undefined,f.owner)).data;
 assert.equal(player.viewer.role,'player');assert.equal(player.viewer.accessRole,'gm');
 assert.equal(player.state.gmNotes,undefined);
 assert(!JSON.stringify(player.state).includes('SECRET_OFFICIEL_TEST'));
 assert.equal((await f.req('management',undefined,f.owner)).status,403);
 assert.equal((await f.req('export',undefined,f.owner)).status,403);
 assert.equal((await action(f,f.owner,'gmNotes',{value:'Intrusion'})).status,403);
 assert.equal((await f.req('view-mode',{mode:'gm'},f.owner)).status,200);
 assert.equal((await f.req('state',undefined,f.owner)).data.state.gmNotes,'SECRET_OFFICIEL_TEST');
});
test('V3.5 : joueur existant rejoint une autre campagne sans recréer de compte',async t=>{
 const f=await fixture(t);
 const invited=(await f.req('invites',{characterId:'aelin'},f.owner)).data;
 const alice=(await f.req('join',{name:'Alice Joueuse',password:'pass-alice-solide-2026',code:invited.code})).cookie;
 assert.equal((await f.req('campaigns',undefined,alice)).data.campaigns.length,1);
 await f.req('campaigns/create',{title:'Deuxième aventure'},f.owner);
 const invite2=(await f.req('invites',{characterId:'aelin'},f.owner)).data;
 assert.equal((await f.req('campaigns/join',{code:invite2.code},alice)).status,200);
 const campaigns=(await f.req('campaigns',undefined,alice)).data;
 assert.equal(campaigns.campaigns.length,2);assert.notEqual(campaigns.activeId,f.first);
 assert.equal((await f.req('state',undefined,alice)).data.viewer.role,'player');
 assert.equal((await f.req('view-mode',{mode:'gm'},alice)).status,403);
 assert.equal((await f.req('campaigns/select',{campaignId:f.first},alice)).status,200);
 assert.equal((await f.req('state',undefined,alice)).data.viewer.characterId,'aelin');
});
test('V3.5 : un compte GM dans une campagne et joueur dans une autre, sans accès croisé',async t=>{
 const f=await fixture(t);
 const iv=(await f.req('invites',{characterId:'aelin'},f.owner)).data;
 const alice=(await f.req('join',{name:'Alice Joueuse',password:'pass-alice-solide-2026',code:iv.code})).cookie;
 assert.equal((await f.req('campaigns/create',{title:'La ville noire'},alice)).status,200);
 const owned=(await f.req('campaigns',undefined,alice)).data.activeId;
 assert.equal((await f.req('state',undefined,alice)).data.viewer.role,'gm');
 assert.equal((await action(f,alice,'gmNotes',{value:'SECRET_VILLE_NOIRE'})).status,200);
 assert.equal((await f.req('campaigns/select',{campaignId:f.first},alice)).status,200);
 assert.equal((await f.req('state',undefined,alice)).data.viewer.role,'player');
 assert(!JSON.stringify((await f.req('state',undefined,alice)).data).includes('SECRET_VILLE_NOIRE'));
 assert.equal((await f.req('campaigns/select',{campaignId:owned},f.owner)).status,403);
 assert.equal((await f.req('campaigns/select',{campaignId:owned},alice)).status,200);
 assert.match((await f.req('state',undefined,alice)).data.state.gmNotes,/SECRET_VILLE_NOIRE/);
});
test('V3.5 : invitation et rôle co-MJ sont propres à une seule campagne',async t=>{
 const f=await fixture(t);
 const iv=(await f.req('invites',{characterId:'aelin'},f.owner)).data;
 const alice=(await f.req('join',{name:'Alice Joueuse',password:'pass-alice-solide-2026',code:iv.code})).cookie;
 const member=(await f.req('management',undefined,f.owner)).data.roleAssignments.find(m=>m.characterId==='aelin');
 await f.req('member/role',{userId:member.userId,role:'gm'},f.owner);
 await f.req('campaigns/create',{title:'Autre campagne'},f.owner);
 const iv2=(await f.req('invites',{characterId:'aelin'},f.owner)).data;
 await f.req('campaigns/join',{code:iv2.code},alice);
 assert.equal((await f.req('state',undefined,alice)).data.viewer.role,'player');
 assert.equal((await f.req('management',undefined,alice)).status,403);
 await f.req('campaigns/select',{campaignId:f.first},alice);
 assert.equal((await f.req('state',undefined,alice)).data.viewer.role,'gm');
});
test('V3.5 : les champs campagnes et choix de rôle existent et les images publiques restent isolées',()=>{
 const ui=fs.readFileSync(path.join(__dirname,'../src/online-app.js'),'utf8');
 const sw=fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8');
 for(const snippet of ['id="active-campaign"','id="active-role"','campaign-create-form','campaign-join-form','data-campaign-switch','changeTable('])assert(ui.includes(snippet),snippet);
 assert(sw.includes('chroniques-public-v'));assert(!sw.includes("'/api/"));
});
test('V3.5 : le propriétaire peut associer un personnage libre à son compte MJ pour jouer en vue Joueur',async t=>{
 const f=await fixture(t);
 const owner=(await f.req('state',undefined,f.owner)).data;
 assert.equal(owner.viewer.characterId,null);
 assert.equal((await f.req('campaigns/character',{characterId:'aelin'},f.owner)).status,200);
 const gm=(await f.req('state',undefined,f.owner)).data;
 assert.equal(gm.viewer.characterId,'aelin');
 assert(gm.state.claimedCharacterIds.includes('aelin'));
 assert.equal((await f.req('invites',{characterId:'aelin'},f.owner)).status,400);
 await f.req('view-mode',{mode:'player'},f.owner);
 const player=(await f.req('state',undefined,f.owner)).data;
 assert.equal(player.viewer.role,'player');assert.equal(player.viewer.characterId,'aelin');
 assert.equal(player.state.gmNotes,undefined);
 const edit=await action(f,f.owner,'hp',{id:'aelin',delta:-1});
 // Le joueur garde les permissions normales sur sa fiche ; aucune action de MJ n'est accordée.
 assert.notEqual(edit.status,403);
 assert.equal((await f.req('campaigns/character',{characterId:null},f.owner)).status,403);
 await f.req('view-mode',{mode:'gm'},f.owner);
 assert.equal((await f.req('campaigns/character',{characterId:null},f.owner)).status,200);
});
test('V3.5 : un ancien onglet ne peut pas écrire dans la campagne sélectionnée par un autre',async t=>{
 const f=await fixture(t);
 const first=f.first;
 const created=await f.req('campaigns/create',{title:'Campagne séparée'},f.owner);
 const second=created.data.id;
 const state2=(await f.req('state',undefined,f.owner)).data;
 assert.equal((await f.req('action',{campaignId:first,kind:'gmNotes',baseVersion:state2.version,value:'Ancien onglet'},f.owner)).status,409);
 assert.equal((await f.req('action',{campaignId:second,kind:'gmNotes',baseVersion:state2.version,value:'Nouvelle campagne'},f.owner)).status,200);
 assert.equal((await f.req('state',undefined,f.owner)).data.state.gmNotes,'Nouvelle campagne');
});
test('V3.5 : les scripts de migration Windows restent non destructifs et le cache exclut les API privées',()=>{
 const root=path.join(__dirname,'..');
 const bat=fs.readFileSync(path.join(root,'MIGRER_DONNEES.bat'));
 assert(bat.includes(Buffer.from('\r\n')));
 const code=bat.toString('utf8');
 assert(code.includes('if exist "data\\chroniques-db.json"'));
 const worker=fs.readFileSync(path.join(root,'sw.js'),'utf8');
 assert(worker.includes('chroniques-public-v'));
 assert(!worker.includes("'/api/"));
});
