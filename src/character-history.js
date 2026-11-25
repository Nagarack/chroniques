/* Chroniques — historique de chaque personnage, construit automatiquement à partir des changements :
   niveaux, XP, objets obtenus ou donnés, sorts appris, compagnons, chutes à 0 PV, quêtes, documents reçus…
   Le MJ peut ajouter des notes, publiques (visibles du joueur) ou secrètes (MJ seulement).
   Le joueur voit l'historique de son personnage sans les notes secrètes ; les autres joueurs n'y ont pas accès. */
'use strict';
const MAX=400;
const WT=require('./world-time.js');
function fail(m){const e=new Error(m);e.status=400;throw e;}
const items=p=>Array.isArray(p.inventoryItems)?p.inventoryItems:[];
const hp=p=>Number(p.hp)||0;
function worldDate(s){const wt=s.worldTime;return wt&&wt.enabled?WT.format(wt,wt.minutes,{dateOnly:true}):'';}
function push(s,pc,text,extra={}){if(!Array.isArray(pc.history))pc.history=[];
 const last=pc.history[pc.history.length-1];
 // Fusion des messages identiques rapprochés (plusieurs clics de suite).
 if(last&&last.text===text&&Date.now()-Date.parse(last.at)<60000&&!extra.gm)return;
 pc.history.push({id:Math.random().toString(36).slice(2,10),at:new Date().toISOString(),world:worldDate(s),session:(s.sessionStats&&s.sessionStats.startedAt)||null,text,...extra});
 if(pc.history.length>MAX)pc.history.splice(0,pc.history.length-MAX);}
const SETUP=new Set(['createHero','setBuild','importPc','editPc','addPc','campaignImport']);
function name(s,id){const p=(s.characters||[]).find(x=>x.id===id);return p?p.name:'';}
function observe(prev,next,kind,body={}){
 if(['undo'].includes(kind))return;
 const before=new Map((prev.characters||[]).map(p=>[p.id,p]));
 for(const pc of next.characters||[]){const old=before.get(pc.id);if(!old)continue;
  if(SETUP.has(kind)){if((pc.level||0)>(old.level||0)&&kind!=='importPc')push(next,pc,'Passe au niveau '+pc.level+'.');continue;} // Création de fiche : pas de bruit.
  if((pc.level||0)>(old.level||0))push(next,pc,'Passe au niveau '+pc.level+'.');
  const xp=(Number(pc.xp)||0)-(Number(old.xp)||0);if(xp>0)push(next,pc,'Gagne '+xp.toLocaleString('fr-FR')+' XP'+(body.reason?' ('+String(body.reason).slice(0,60)+')':'')+'.');
  if(hp(old)>0&&hp(pc)===0)push(next,pc,'Tombe à 0 point de vie'+(next.combat&&next.combat.started?' (round '+next.combat.round+')':'')+'.');
  if(hp(old)===0&&hp(pc)>0)push(next,pc,'Reprend conscience.');
  const df=pc.deathSaves&&pc.deathSaves.failure||0,odf=old.deathSaves&&old.deathSaves.failure||0;if(df>=3&&odf<3)push(next,pc,'Meurt : trois échecs aux jets contre la mort.');
  // Objets : gagnés (nouvel identifiant) ou cédés (identifiant disparu, sauf consommation normale).
  const had=new Map(items(old).map(i=>[i.id,i]));const has=new Map(items(pc).map(i=>[i.id,i]));
  const gained=items(pc).filter(i=>!had.has(i.id));
  if(kind==='stashWithdraw'||kind==='stashDeposit'){if(pc.id===body.id){const src=kind==='stashWithdraw'?((prev.partyStash||{}).inventoryItems||[]):items(old);const it=src.find(i=>i.id===String(body.itemId||''));const q=Number(body.quantity)>1?body.quantity+' × ':'';if(it)push(next,pc,(kind==='stashWithdraw'?'Prend dans le coffre du groupe : ':'Dépose dans le coffre du groupe : ')+q+it.name+'.');}}
  else if(gained.length){const from=kind==='itemTransfer'?name(next,body.id):'';const how=kind==='shopBuy'?'Achète':['libItemGive','lootGive','mapLootGive'].includes(kind)?'Reçoit du MJ':from?'Reçoit de '+from:'Obtient';
   push(next,pc,how+' : '+gained.map(i=>i.name+((i.quantity||1)>1?' ×'+i.quantity:'')).join(', ')+'.');}
  const lost=items(old).filter(i=>!has.has(i.id));
  if(kind==='itemTransfer'&&pc.id===body.id){const it=had.get(String(body.itemId||''));if(it)push(next,pc,'Donne '+(Number(body.quantity)>1?body.quantity+' × ':'')+it.name+' à '+name(next,String(body.toId||''))+'.');}
  else if(lost.length&&!['itemUse','itemTransfer','stashDeposit','stashWithdraw'].includes(kind))push(next,pc,'Ne possède plus : '+lost.map(i=>i.name).join(', ')+'.');
  for(const i of items(pc)){const o=had.get(i.id);if(o&&i.attuned&&!o.attuned)push(next,pc,'S’harmonise avec '+i.name+'.');}
  // Monnaie : seulement les gros mouvements (achats, partage du butin).
  const coins=c=>{const v={pp:1000,gp:100,ep:50,sp:10,cp:1};return Object.entries(v).reduce((t,[k,x])=>t+(Math.max(0,Number(c&&c[k])||0))*x,0);};
  const dc=coins(pc.coins)-coins(old.coins);if(Math.abs(dc)>=100&&['coinsSplit','shopBuy','moneySet','lootGive','mapLootGive','stashCoins'].includes(kind))push(next,pc,(kind==='stashCoins'?(dc>0?'Prend dans le coffre ':'Dépose dans le coffre '):kind==='moneySet'?(dc>0?'Bourse modifiée : +':'Bourse modifiée : −'):dc>0?'Gagne ':'Dépense ')+Math.floor(Math.abs(dc)/100).toLocaleString('fr-FR')+' po'+(kind==='coinsSplit'?' (partage du butin)':'')+'.');
  const known=new Set((old.grimoire||[]).map(e=>e.id));const learned=(pc.grimoire||[]).filter(e=>!known.has(e.id));if(learned.length)push(next,pc,'Apprend : '+learned.map(e=>e.name||e.custom&&e.custom.name||e.spellId).join(', ')+'.');
  const comp=new Set((old.companions||[]).map(c=>c.id));for(const c of pc.companions||[])if(!comp.has(c.id))push(next,pc,c.name+' rejoint '+pc.name+'.');
  if((pc.exhaustion||0)>(old.exhaustion||0))push(next,pc,'Épuisement niveau '+pc.exhaustion+'.');
 }
 // Quêtes partagées : objectifs accomplis et quêtes terminées, pour tout le groupe.
 const oq=new Map(((prev.campaignPlanner||{}).quests||[]).map(q=>[q.id,q]));
 for(const q of (next.campaignPlanner||{}).quests||[]){if(q.visibility!=='shared')continue;const o=oq.get(q.id);
  const done=(q.objectives||[]).filter(x=>x.done&&!x.secret&&!(o&&(o.objectives||[]).some(y=>y.id===x.id&&y.done)));
  for(const x of done)for(const pc of next.characters||[])push(next,pc,'Quête « '+q.title+' » : '+x.text+' ✔');
  if(o&&o.status!==q.status&&/termin|accompli|done|résolu/i.test(String(q.status)))for(const pc of next.characters||[])push(next,pc,'Quête terminée : '+q.title+'.');}
 // Documents reçus.
 const oh=new Map((prev.handouts||[]).map(h=>[h.id,h]));
 for(const h of next.handouts||[]){if(!h.sentAt||(oh.get(h.id)||{}).sentAt===h.sentAt)continue;for(const pc of next.characters||[])if(h.recipients==='all'||(h.recipients||[]).includes(pc.id))push(next,pc,'Reçoit le document « '+h.title+' ».');}
 // Fin de combat : participation.
 const oc=prev.combat||{},nc=next.combat||{};
 if(oc.started&&!nc.started){const foes=(oc.npcs||[]).filter(n=>n.visibility==='public'&&!n.ownerPc).map(n=>n.name);for(const pc of next.characters||[])if((oc.order||[]).includes(pc.id))push(next,pc,'Combat terminé'+(foes.length?' contre '+[...new Set(foes)].slice(0,5).join(', '):'')+((oc.round||1)>1?' ('+oc.round+' rounds)':'')+'.');}
}
// Note écrite par le MJ (secrète ou visible du joueur).
function note(s,pcId,text,secret){const pc=(s.characters||[]).find(p=>p.id===pcId);if(!pc)fail('Personnage introuvable.');const t=String(text??'').replace(/[\u0000-\u001f]/g,' ').trim();if(!t)fail('Note vide.');if(t.length>300)fail('Note : 300 caractères maximum.');push(s,pc,t,{manual:true,...(secret?{gm:true}:{})});}
function remove(s,pcId,entryId){const pc=(s.characters||[]).find(p=>p.id===pcId);if(!pc)fail('Personnage introuvable.');const n=(pc.history||[]).length;pc.history=(pc.history||[]).filter(e=>e.id!==entryId);if(pc.history.length===n)fail('Entrée introuvable.');}
function forPlayer(history){return (history||[]).filter(e=>!e.gm);}
// Entrée ajoutée à tous les personnages (événement de groupe).
function all(s,text){for(const pc of s.characters||[])push(s,pc,String(text).slice(0,300));}
module.exports={MAX,observe,note,remove,forPlayer,all};
