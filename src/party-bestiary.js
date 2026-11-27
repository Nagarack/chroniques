/* Chroniques — bestiaire du groupe (5.20) : les créatures que les joueurs ont affrontées, et ce qu’ils en ont appris.
   Une créature y entre d’elle-même dès qu’elle est visible des joueurs (révélée par le MJ) ; les créatures masquées n’y entrent pas.
   Le MJ ajoute les faits appris (« craint le feu »), masque ou retire une fiche. Les joueurs ne voient que les fiches visibles et leurs faits.
   Les « Gobelin 2 », « Gobelin 3 » d’une même rencontre forment une seule fiche. */
'use strict';
const crypto=require('node:crypto');
const MAX=150,MAX_FACTS=12;
function fail(m){const e=new Error(m);e.status=400;throw e;}
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const baseName=n=>String(n||'').replace(/\s+(\d{1,3}|[A-Z])$/,'').trim().slice(0,70);
// Regroupement par nom affiché aux joueurs, jamais par fiche SRD : un monstre déguisé (« Silhouette encapuchonnée ») ne doit pas trahir sa vraie nature.
const keyOf=n=>'nom:'+norm(baseName(n.name));
const clean=(v,label,max)=>{const t=String(v??'').replace(/[\u0000-\u001f]/g,' ').trim();if(!t)fail(label+' requis.');if(t.length>max)fail(label+' : '+max+' caractères maximum.');return t;};
const newId=p=>p+'-'+crypto.randomBytes(5).toString('hex');
function get(s){if(!s.partyBestiary||typeof s.partyBestiary!=='object'||!Array.isArray(s.partyBestiary.entries))s.partyBestiary={entries:[],combats:0};return s.partyBestiary;}
function find(s,id){const e=get(s).entries.find(x=>x.id===id);if(!e)fail('Fiche introuvable.');return e;}
// Appelé après chaque action validée : compare l’état avant et après, ne modifie que next.partyBestiary.
function observe(prev,next){const npcs=Array.isArray(next?.combat?.npcs)?next.combat.npcs:[];const visible=npcs.filter(n=>n&&!n.ownerPc&&n.visibility==='public');
 const startedNow=!!next.combat?.started&&!prev?.combat?.started;if(!visible.length&&!startedNow)return;const pb=get(next);if(startedNow)pb.combats=(pb.combats||0)+1;
 const before=new Map((prev?.combat?.npcs||[]).map(n=>[n.id,n]));const now=new Date().toISOString();
 for(const n of visible){const k=keyOf(n);let e=pb.entries.find(x=>x.key===k);
  if(!e){if(pb.entries.length>=MAX)continue;e={id:newId('best'),key:k,name:baseName(n.name),srd:n.srd||'',firstAt:now,met:0,defeated:0,facts:[],hidden:false};pb.entries.push(e);}
  if(next.combat?.started&&e.lastCombat!==pb.combats){e.met++;e.lastCombat=pb.combats;}
  const old=before.get(n.id);if(Number(n.hp)<=0&&old&&Number(old.hp)>0)e.defeated++;}}
function factAdd(s,id,text){const e=find(s,id);if(e.facts.length>=MAX_FACTS)fail(`Au plus ${MAX_FACTS} faits par créature.`);const f={id:newId('fait'),text:clean(text,'Fait',200),at:new Date().toISOString()};e.facts.push(f);return f;}
function factRemove(s,id,factId){const e=find(s,id);const n=e.facts.length;e.facts=e.facts.filter(f=>f.id!==factId);if(n===e.facts.length)fail('Fait introuvable.');}
function setHidden(s,id,hidden){find(s,id).hidden=hidden===true;}
function rename(s,id,name){find(s,id).name=clean(name,'Nom',70);}
function remove(s,id){const pb=get(s);const n=pb.entries.length;pb.entries=pb.entries.filter(e=>e.id!==id);if(n===pb.entries.length)fail('Fiche introuvable.');}
function addManual(s,name){const pb=get(s);if(pb.entries.length>=MAX)fail(`Bestiaire plein (${MAX} fiches).`);const nm=clean(name,'Nom',70);const k='nom:'+norm(nm);if(pb.entries.some(e=>e.key===k))fail('Cette créature est déjà dans le bestiaire.');
 const e={id:newId('best'),key:k,name:nm,srd:'',firstAt:new Date().toISOString(),met:0,defeated:0,facts:[],hidden:false};pb.entries.push(e);return e;}
// Joueurs : fiches visibles seulement, sans clé interne.
function projected(s){const pb=s.partyBestiary;if(!pb||!Array.isArray(pb.entries))return undefined;
 return {entries:pb.entries.filter(e=>!e.hidden).map(({key,lastCombat,hidden,srd,...rest})=>({...rest,facts:rest.facts.map(f=>({...f}))}))};}
module.exports={MAX,MAX_FACTS,get,observe,factAdd,factRemove,setHidden,rename,remove,addManual,projected,baseName,keyOf};
