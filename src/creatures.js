/* Chroniques V1.5 — suivi des créatures/PNJ : dés toujours physiques. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesCreatures=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const DAMAGE_TYPES=['Contondant','Perforant','Tranchant','Feu','Froid','Foudre','Tonnerre','Acide','Poison','Nécrotique','Radiant','Force','Psychique'];
const DEFENSE_STATES={resist:'Résistance',vuln:'Vulnérabilité',immune:'Immunité'};
const ABILITY_KEYS=['str','dex','con','int','wis','cha'];
function cleanDefenses(map){const out={};if(map&&typeof map==='object'&&!Array.isArray(map))for(const [t,v] of Object.entries(map))if(DAMAGE_TYPES.includes(t)&&Object.prototype.hasOwnProperty.call(DEFENSE_STATES,v))out[t]=v;return out;}
function adjustDamage(defenses,type,amount){const st=defenses&&type?defenses[type]:null;if(st==='immune')return {amount:0,state:st};if(st==='resist')return {amount:Math.floor(amount/2),state:st};if(st==='vuln')return {amount:amount*2,state:st};return {amount,state:null};}
const CONDITIONS=['Aveuglé','Charmé','Effrayé','Empoisonné','Entravé','Agrippé','À terre','Incapable d’agir','Étourdi','Paralysé','Inconscient','Assourdi','Invisible','Pétrifié'];
function err(s){throw new Error(s);}
function list(s){return Array.isArray(s.combat.npcs)?s.combat.npcs:[];}
function find(s,id){return list(s).find(n=>n.id===id);}
function txt(x,label,max=100,allowEmpty=false){if(typeof x!=='string')err(label+' incorrect.');const y=x.trim();if((!y&&!allowEmpty)||y.length>max)err(label+' incorrect (maximum '+max+' caractères).');return y;}
function num(x,label,min,max){if(typeof x!=='number'||!Number.isSafeInteger(x)||x<min||x>max)err(label+' incorrect.');return x;}
function validate(data){if(!data||typeof data!=='object'||Array.isArray(data))err('Fiche de créature incorrecte.');const v={name:txt(data.name,'Nom',70),kind:['monstre','pnj'].includes(data.kind)?data.kind:null,
 hpMax:num(data.hpMax,'PV maximum',1,100000),ac:num(data.ac,'CA',1,40),initiative:num(data.initiative,'Initiative',-99,99),
 speed:num(data.speed,'Vitesse',0,200),visibility:data.visibility,showHp:data.showHp===true,
 notes:txt(data.notes??'','Notes privées',1500,true),actions:txt(data.actions??'','Actions et dés physiques',1200,true),
 group:(typeof data.group==='string'&&/^[a-z0-9-]{1,40}$/.test(data.group))?data.group:'',srd:(typeof data.srd==='string'&&/^[a-z0-9-]{1,60}$/.test(data.srd))?data.srd:'',cr:(typeof data.cr==='string'&&/^(0|1\/8|1\/4|1\/2|[1-9]|[12][0-9]|30)$/.test(data.cr))?data.cr:'',traits:txt(data.traits??'','Traits et capacités',1200,true),legendary:txt(data.legendary??'','Actions légendaires',1200,true),lair:txt(data.lair??'','Actions de repaire',1200,true),defenses:cleanDefenses(data.defenses),abilities:null};
 v.legendaryMax=v.legendary?Math.min(5,Math.max(1,Number((/(\d)\s+actions? légendaires?/i.exec(v.legendary)||[])[1])||3)):0;
 if(data.abilities!=null){if(typeof data.abilities!=='object'||Array.isArray(data.abilities))err('Caractéristiques incorrectes.');v.abilities={};for(const k of ABILITY_KEYS)v.abilities[k]=num(data.abilities[k],'Caractéristique '+k.toUpperCase(),1,30);}
 // Incantation (facultative) : DD, bonus d'attaque, caractéristique, emplacements des niveaux 1 à 9, liste des sorts.
 v.spellcasting=null;if(data.spellcasting!=null){const sc=data.spellcasting;if(typeof sc!=='object'||Array.isArray(sc))err('Incantation incorrecte.');
  const slots=Array.isArray(sc.slots)?sc.slots:[];if(slots.length>9)err('Emplacements incorrects.');
  const out={ability:ABILITY_KEYS.includes(sc.ability)?sc.ability:'',dc:sc.dc==null||sc.dc===''?null:num(sc.dc,'DD des sorts',1,40),attack:sc.attack==null||sc.attack===''?null:num(sc.attack,'Bonus d’attaque des sorts',-10,30),slots:Array.from({length:9},(_,i)=>num(slots[i]??0,'Emplacements niveau '+(i+1),0,9)),spells:txt(sc.spells??'','Sorts connus',1500,true)};
  if(out.dc!==null||out.attack!==null||out.slots.some(Boolean)||out.spells)v.spellcasting=out;}
 if(!v.kind)err('Type de créature incorrect.');if(!['hidden','public'].includes(v.visibility))err('Visibilité incorrecte.');return v;}
function log(s,content){s.combat.log.unshift({id:'npc-log-'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),msg:content,when:new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}),audience:'gm'});s.combat.log=s.combat.log.slice(0,100);}
function make(s,id,values){const v=validate(values);return {id,...v,hp:v.hpMax,conditions:[],tempHp:0,legendaryLeft:v.legendaryMax,spent:[],slotsUsed:Array(9).fill(0)};}
function add(s,id,values){if(list(s).length>=100)err('Maximum 100 monstres ou PNJ par campagne.');if(s.combat.started)err('Terminez le combat avant d’ajouter un participant.');if(list(s).some(x=>x.id===id)||s.characters.some(x=>x.id===id))err('Identifiant de créature déjà utilisé.');s.combat.npcs??=[];const n=make(s,id,values);s.combat.npcs.push(n);s.combat.manualOrder=false;log(s,'Créature ajoutée · '+n.name);return n;}
function update(s,id,values){const n=find(s,id);if(!n)err('Créature introuvable.');const v=validate(values);Object.assign(n,v);n.hp=Math.min(n.hp,n.hpMax);n.slotsUsed=Array.from({length:9},(_,i)=>Math.min(Number(n.slotsUsed?.[i])||0,v.spellcasting?.slots[i]||0));n.legendaryLeft=Math.min(Number(n.legendaryLeft??v.legendaryMax)||0,v.legendaryMax);log(s,'Fiche de créature modifiée · '+n.name);return n;}
function remove(s,id){if(s.combat.started)err('Terminez le combat avant de supprimer une créature.');const i=list(s).findIndex(n=>n.id===id);if(i<0)err('Créature introuvable.');const [n]=s.combat.npcs.splice(i,1);s.combat.order=s.combat.order.filter(x=>x!==id);s.combat.manualOrder=false;log(s,'Créature retirée · '+n.name);}
function hp(s,id,delta,damageType){const n=find(s,id);if(!n)err('Créature introuvable.');num(delta,'Dégâts/soins',-100000,100000);let note='';if(delta<0&&damageType){if(!DAMAGE_TYPES.includes(damageType))err('Type de dégâts inconnu.');const adj=adjustDamage(n.defenses,damageType,-delta);note=' · '+damageType.toLowerCase()+(adj.state?' ('+DEFENSE_STATES[adj.state].toLowerCase()+' : '+(-delta)+' → '+adj.amount+')':'');delta=-adj.amount;if(!delta){log(s,n.name+' · aucun dégât'+note);return n;}}if(delta<0){let amount=-delta;const absorbed=Math.min(n.tempHp||0,amount);n.tempHp=(n.tempHp||0)-absorbed;amount-=absorbed;n.hp=Math.max(0,n.hp-amount);}else{n.hp=Math.min(n.hpMax,n.hp+delta);}log(s,n.name+' · '+(delta<0?-delta+' dégâts'+note:delta+' soins')+' notés après les dés physiques');
 if(delta<0&&n.concentration){if(n.hp<=0){log(s,n.name+' · concentration perdue ('+n.concentration+') : 0 PV');n.concentration='';n.concentrationChecks=[];}else{const dc=Math.max(10,Math.floor(-delta/2));n.concentrationChecks=[...(n.concentrationChecks||[]),{id:Math.random().toString(36).slice(2,9),dc,damage:-delta}].slice(-5);log(s,n.name+' se concentre sur '+n.concentration+' : sauvegarde de Constitution DD '+dc+' (dé physique)');}}
 return n;}
// Concentration d'une créature du MJ (sort ou capacité) : rappel de sauvegarde à chaque dégât.
function concentration(s,id,text){const n=find(s,id);if(!n)err('Créature introuvable.');const t=String(text||'').replace(/[\u0000-\u001f]/g,' ').trim().slice(0,60);n.concentration=t;n.concentrationChecks=[];log(s,n.name+(t?' · concentration : '+t:' · fin de concentration'));return n;}
function concentrationResult(s,id,checkId,result){const n=find(s,id);if(!n)err('Créature introuvable.');const c=(n.concentrationChecks||[]).find(x=>x.id===checkId);if(!c)err('Rappel introuvable.');if(!['success','failure'].includes(result))err('Résultat invalide.');
 n.concentrationChecks=n.concentrationChecks.filter(x=>x!==c);if(result==='failure'){log(s,n.name+' · concentration perdue ('+n.concentration+')');n.concentration='';n.concentrationChecks=[];}else log(s,n.name+' · concentration maintenue (DD '+c.dc+')');return n;}
function legendary(s,id,op,cost=1,label=''){const n=find(s,id);if(!n)err('Créature introuvable.');if(!n.legendaryMax)err('Cette créature n’a pas d’actions légendaires.');
 const left=Number(n.legendaryLeft??n.legendaryMax);if(op==='reset')n.legendaryLeft=n.legendaryMax;else if(op==='spend'){const c=Math.max(1,Math.min(3,Math.floor(Number(cost)||1)));if(left<c)err('Plus assez d’actions légendaires ce round.');n.legendaryLeft=left-c;log(s,n.name+' · action légendaire'+(label?' : '+txt(String(label).slice(0,300),'Action',300):'')+' ('+n.legendaryLeft+'/'+n.legendaryMax+' restantes)');}else err('Opération inconnue.');return n;}
function actionLog(s,id,text,recharge=''){const n=find(s,id);if(!n)err('Créature introuvable.');const t=txt(String(text??'').slice(0,400),'Action',400);
 // Pouvoir à recharge (ex. « Souffle de feu (recharge 5-6) ») : marqué comme dépensé jusqu'à ce que le MJ confirme le d6.
 const r=String(recharge||'').slice(0,80);if(r){if(!Array.isArray(n.spent))n.spent=[];if(n.spent.includes(r))err(r+' n’est pas rechargé.');n.spent.push(r);}
 log(s,n.name+' · '+t+(r?' — à recharger':''));return n;}
// Emplacements de sorts d'une créature : delta +1 = un emplacement dépensé, -1 = rendu ; reset = repos long.
function slot(s,id,level,delta){const n=find(s,id);if(!n)err('Créature introuvable.');if(!n.spellcasting)err('Cette créature ne lance pas de sorts.');if(!Array.isArray(n.slotsUsed))n.slotsUsed=Array(9).fill(0);
 if(level==='reset'){n.slotsUsed=Array(9).fill(0);log(s,n.name+' · emplacements de sorts restaurés');return n;}
 const l=num(level,'Niveau',1,9),max=n.spellcasting.slots[l-1]||0,used=n.slotsUsed[l-1]||0,next=used+(delta>0?1:-1);if(next<0||next>max)err(delta>0?'Plus d’emplacement de niveau '+l+'.':'Aucun emplacement à rendre.');
 n.slotsUsed[l-1]=next;if(delta>0)log(s,n.name+' · sort de niveau '+l+' ('+(max-next)+'/'+max+' restants)');return n;}
function recharge(s,id,name){const n=find(s,id);if(!n)err('Créature introuvable.');const i=(n.spent||[]).indexOf(String(name||''));if(i<0)err('Ce pouvoir est déjà disponible.');n.spent.splice(i,1);log(s,n.name+' · '+name+' : rechargé');return n;}
function setDefense(s,id,type,value){const n=find(s,id);if(!n)err('Créature introuvable.');if(!DAMAGE_TYPES.includes(type))err('Type de dégâts inconnu.');if(value&&!Object.prototype.hasOwnProperty.call(DEFENSE_STATES,value))err('Défense inconnue.');n.defenses=cleanDefenses(n.defenses);if(value)n.defenses[type]=value;else delete n.defenses[type];log(s,n.name+' · '+type.toLowerCase()+' : '+(value?DEFENSE_STATES[value].toLowerCase():'normal'));return n;}
function condition(s,id,value){const n=find(s,id);if(!n)err('Créature introuvable.');if(!CONDITIONS.includes(value))err('Condition inconnue.');n.conditions=n.conditions.includes(value)?n.conditions.filter(x=>x!==value):[...n.conditions,value];log(s,n.name+' · état '+value);return n;}
function publicNpc(n){return {id:n.id,name:n.name,kind:n.kind,initiative:n.initiative,conditions:n.conditions.slice(),visibility:'public',showHp:n.showHp,...(n.showHp?{hp:n.hp,hpMax:n.hpMax}:{}),...(n.ownerPc?{ownerPc:n.ownerPc,companionId:n.companionId,ac:n.ac,actions:n.actions}:{})};}
function project(s){const nc=JSON.parse(JSON.stringify(s));nc.combat.npcs=list(s).filter(n=>n.visibility==='public').map(publicNpc);
 const allowed=new Set([...nc.characters.map(x=>x.id),...nc.combat.npcs.map(x=>x.id)]);
 const originalId=s.combat.order?.[s.combat.index];nc.combat.order=(s.combat.order||[]).filter(id=>allowed.has(id));nc.combat.index=nc.combat.order.indexOf(originalId);nc.combat.privateTurn=Boolean(s.combat.started&&nc.combat.index<0);
 nc.combat.log=(nc.combat.log||[]).filter(entry=>entry.audience!=='gm');return nc;}
return {concentration,concentrationResult,list,find,validate,add,update,remove,hp,condition,setDefense,legendary,actionLog,recharge,slot,project,publicNpc,DAMAGE_TYPES,DEFENSE_STATES};
});
