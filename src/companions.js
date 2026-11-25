/* Chroniques — compagnons, familiers et montures : mini-fiches rattachées à un personnage.
   Le joueur (ou le MJ) peut envoyer un compagnon au combat : il devient un participant public lié à son maître,
   dont le joueur gère lui-même les PV. Aucun dé n'est lancé. */
'use strict';
const KINDS={familier:'Familier',monture:'Monture',compagnon:'Compagnon animal',invocation:'Créature invoquée',acolyte:'Acolyte / suivant'};
const MAX=6;
function fail(m,status=400){const e=new Error(m);e.status=status;throw e;}
function txt(v,label,max,required){const s=String(v??'').replace(/[\u0000-\u001f]/g,' ').trim();if(required&&!s)fail(label+' requis.');if(s.length>max)fail(label+' : '+max+' caractères maximum.');return s;}
function int(v,label,min,max){const n=Number(v);if(!Number.isInteger(n)||n<min||n>max)fail(label+' invalide ('+min+' à '+max+').');return n;}
function list(pc){if(!Array.isArray(pc.companions))pc.companions=[];return pc.companions;}
function find(pc,id){return list(pc).find(c=>c.id===id)||null;}
function values(v){if(!v||typeof v!=='object'||Array.isArray(v))fail('Fiche de compagnon invalide.');
 return {name:txt(v.name,'Nom',60,true),kind:Object.hasOwn(KINDS,v.kind)?v.kind:'compagnon',hpMax:int(v.hpMax,'PV maximum',1,999),ac:int(v.ac,'CA',1,30),speed:txt(v.speed??'','Vitesse',40,false),
  attack:txt(v.attack??'','Attaques et dés',300,false),notes:txt(v.notes??'','Notes',600,false)};}
function add(pc,id,v){if(list(pc).length>=MAX)fail('Maximum '+MAX+' compagnons par personnage.');const c={id,...values(v)};c.hp=c.hpMax;pc.companions.push(c);return c;}
function update(pc,id,v){const c=find(pc,id);if(!c)fail('Compagnon introuvable.');Object.assign(c,values(v));c.hp=Math.min(c.hp,c.hpMax);return c;}
function remove(s,pc,id){const i=list(pc).findIndex(c=>c.id===id);if(i<0)fail('Compagnon introuvable.');recall(s,pc,id,true);pc.companions.splice(i,1);}
function deployed(s,companionId){return (s.combat?.npcs||[]).find(n=>n.companionId===companionId)||null;}
function hp(s,pc,id,delta){const c=find(pc,id);if(!c)fail('Compagnon introuvable.');const d=int(delta,'Variation de PV',-999,999);c.hp=Math.max(0,Math.min(c.hpMax,c.hp+d));const n=deployed(s,id);if(n)n.hp=Math.max(0,Math.min(n.hpMax,c.hp));return c;}
// Envoi au combat : participant public « pnj » rattaché au personnage, placé juste après lui si le combat a commencé.
function deploy(s,pc,id,npcId){const c=find(pc,id);if(!c)fail('Compagnon introuvable.');if(deployed(s,id))fail(c.name+' est déjà dans le combat.');
 s.combat.npcs??=[];if(s.combat.npcs.length>=100)fail('Maximum 100 participants.');
 const n={id:npcId,name:c.name,kind:'pnj',hpMax:c.hpMax,hp:c.hp,ac:c.ac,initiative:Number(pc.initiative)||0,speed:Math.max(0,Math.min(200,Number.parseFloat(String(c.speed).replace(',','.'))||0)),visibility:'public',showHp:true,
  notes:'',actions:c.attack,group:'',cr:'',traits:c.notes,legendary:'',lair:'',defenses:{},abilities:null,spellcasting:null,legendaryMax:0,legendaryLeft:0,conditions:[],tempHp:0,spent:[],slotsUsed:Array(9).fill(0),ownerPc:pc.id,companionId:c.id};
 s.combat.npcs.push(n);
 if(!Array.isArray(s.combat.order))s.combat.order=[];
 if(s.combat.started){const at=s.combat.order.indexOf(pc.id);if(at>=0){s.combat.order.splice(at+1,0,n.id);if(s.combat.index>at)s.combat.index++;}else s.combat.order.push(n.id);}
 else{s.combat.order.push(n.id);s.combat.manualOrder=false;}
 return n;}
// Rappel : retire le participant (même en plein combat) et reporte ses PV sur la fiche.
function recall(s,pc,id,silent){const n=deployed(s,id);if(!n){if(silent)return null;fail('Ce compagnon n’est pas au combat.');}const c=find(pc,id);if(c)c.hp=Math.max(0,Math.min(c.hpMax,n.hp));
 s.combat.npcs=s.combat.npcs.filter(x=>x!==n);const order=s.combat.order||[];const at=order.indexOf(n.id);if(at>=0){order.splice(at,1);if(s.combat.started){if(s.combat.index>at)s.combat.index--;if(s.combat.index>=order.length)s.combat.index=0;}}
 if(Array.isArray(s.combat.timers))s.combat.timers=s.combat.timers.filter(t=>t.id!==n.id);return n;}
// Après un changement de PV du participant (dégâts du MJ…), la fiche du compagnon suit.
function syncFromNpc(s,npc){if(!npc||!npc.companionId||!npc.ownerPc)return;const pc=(s.characters||[]).find(p=>p.id===npc.ownerPc);const c=pc&&find(pc,npc.companionId);if(c)c.hp=Math.max(0,Math.min(c.hpMax,npc.hp));}
module.exports={KINDS,MAX,list,find,add,update,remove,hp,deploy,recall,deployed,syncFromNpc};
