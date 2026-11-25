/* Chroniques — équipement : utilisation des objets, alertes de charge et d'harmonisation, CA d'équipement, monnaie.
   Fonctions pures (sans état ni DOM), partagées par le serveur et l'interface. Aucun dé n'est lancé : on indique les dés réels. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesGear=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const norm=s=>String(s||'').toLocaleLowerCase('fr').normalize('NFD').replace(/[̀-ͯ]/g,'');
const mod=v=>Math.floor((Number(v)-10)/2);
// --- Armures (SRD) : base, Dextérité ajoutée, plafond de Dextérité ---
const ARMORS=[
 [/matelass/,11,true,null],[/cuir clout/,12,true,null],[/cuir/,11,true,null],[/peau/,12,true,2],[/chemise de mailles/,13,true,2],
 [/ecaille/,14,true,2],[/cuirasse/,14,true,2],[/demi-plate/,15,true,2],[/broigne/,14,false,null],[/cotte de mailles/,16,false,null],
 [/clibanion/,17,false,null],[/harnois/,18,false,null]];
function magicBonus(name){const m=/\+\s?([1-3])\b/.exec(String(name||''));return m?Number(m[1]):0;}
function armorOf(item){if(!item||item.category==='weapon')return null;const d=/CA (\d{1,2})( \+ Dex( \(max 2\))?)?/.exec(item.description||'');
 if(d&&!/bouclier/i.test(item.name)&&!/^Bouclier/.test(item.description||''))return {base:Number(d[1]),dex:!!d[2],cap:d[3]?2:null};
 const n=norm(item.name);if(!/armure|cuirasse|demi-plate|broigne|cotte|clibanion|harnois|chemise de mailles/.test(n))return null;
 const row=ARMORS.find(([re])=>re.test(n));return row?{base:row[1],dex:row[2],cap:row[3]}:null;}
function isShield(item){return !!item&&(/^bouclier\b/i.test(item.name)||/^Bouclier\s?:/.test(item.description||''))&&!/sort|spell/i.test(item.name);}
// CA proposée d'après l'équipement porté. Le joueur valide toujours avant d'appliquer.
function equipmentAc(pc,classId){const items=(pc.inventoryItems||[]).filter(i=>i.equipped);const ab=pc.stats?.abilities||{};const known=ab.dex!=null;const dex=mod(ab.dex??10);
 const armorItem=items.find(i=>armorOf(i));const shield=items.find(isShield);const parts=[];let ac;
 if(armorItem){const a=armorOf(armorItem);const d=a.dex?(a.cap===null?dex:Math.min(a.cap,dex)):0;const bonus=magicBonus(armorItem.name);ac=a.base+d+bonus;parts.push(armorItem.name+' '+a.base+(a.dex?' + Dex '+(d>=0?'+':'')+d+(a.cap?' (max 2)':''):'')+(bonus?' + '+bonus:''));}
 else if(classId==='barbarian'){const con=mod(ab.con??10);ac=10+dex+con;parts.push('Défense sans armure 10 + Dex '+dex+' + Con '+con);}
 else if(classId==='monk'&&!shield){const wis=mod(ab.wis??10);ac=10+dex+wis;parts.push('Défense sans armure 10 + Dex '+dex+' + Sag '+wis);}
 else{ac=10+dex;parts.push('Sans armure 10 + Dex '+(dex>=0?'+':'')+dex);}
 if(shield){const bonus=2+magicBonus(shield.name);ac+=bonus;parts.push(shield.name+' +'+bonus);}
 const strNeed=armorItem&&/Force (\d+) requise/.exec(armorItem.description||'');const tooWeak=strNeed&&(ab.str??10)<Number(strNeed[1]);
 const reliable=known||(armorItem&&!armorOf(armorItem).dex);
 return {ac,parts,armor:armorItem?armorItem.name:null,shield:!!shield,reliable,warning:tooWeak?'Force '+strNeed[1]+' requise : vitesse réduite de 3 m.':''};}
// --- Charge transportée : Force × 7,5 kg (équivalent de Force × 15 livres) ---
// 5.6 : le contenu d’un contenant magique (sac sans fond…) ne pèse rien ; le contenant garde son propre poids.
function carried(pc){const all=pc.inventoryItems||[];const magic=new Set(all.filter(c=>c.holdMagic&&Number(c.capacity)>0).map(c=>c.id));return Math.round(all.reduce((n,it)=>n+(it.in&&magic.has(it.in)?0:(Number(it.weight)||0)*(Number(it.quantity)||0)),0)*100)/100;}
function capacity(pc){const str=Number(pc.stats?.abilities?.str)||10;/* Force inconnue : 10 par défaut. */return Math.round(str*7.5*10)/10;}
function load(pc){const w=carried(pc),cap=capacity(pc);return {weight:w,capacity:cap,ratio:cap?w/cap:0,over:w>cap};}
// --- Harmonisation : 3 objets au maximum ---
const MAX_ATTUNED=3;
function attunedCount(pc,exceptId){return (pc.inventoryItems||[]).filter(i=>i.attuned&&i.id!==exceptId).length;}
// --- Munitions ---
function isAmmo(item){return !!item&&/^(fl[eè]ches?|carreaux?|billes?|aiguilles?|munitions?|balles?)\b/i.test(String(item.name||'').trim())&&!/[ée]tui|carquois/i.test(item.name);}
// --- Utilisation : soins (dés réels), charge, consommation ---
const HEALING=[[/supreme/,'10d4+20'],[/excellent|superior/,'8d4+8'],[/superieur|greater/,'4d4+4'],[/potion de soins|potion of healing|potion de guerison/,'2d4+2']];
function healDice(item){const text=String(item.description||'');const m=/(?:regain|regagne[sz]?|r[ée]cup[eè]re[sz]?)\D{0,20}(\d{1,2}d\d{1,2}(?:\s?\+\s?\d{1,3})?)\s*(?:hit points|points? de vie|PV)/i.exec(text);if(m)return m[1].replace(/\s/g,'');
 const n=norm(item.name);if(!/potion|elixir/.test(n))return null;const row=HEALING.find(([re])=>re.test(n));return row?row[1]:null;}
function useInfo(item){if(!item)return null;const heal=healDice(item);if(heal&&(item.quantity??1)>0)return {kind:'heal',dice:heal,consumes:item.chargesMax?'charge':'quantity'};
 if(item.chargesMax)return {kind:'charge',consumes:'charge'};
 if(['potion','consumable'].includes(item.category)||isAmmo(item))return {kind:'consume',consumes:'quantity'};return null;}
function diceRange(d){const m=/^(\d+)d(\d+)(?:\+(\d+))?$/.exec(String(d||''));if(!m)return null;const n=+m[1],f=+m[2],b=+(m[3]||0);return [n+b,n*f+b];}
// --- Monnaie (valeurs en pièces de cuivre) ---
const COIN_VALUE={pp:1000,gp:100,ep:50,sp:10,cp:1};const COIN_FR={pp:'pp',gp:'po',ep:'pe',sp:'pa',cp:'pc'};
function coinsValue(c){return Object.entries(COIN_VALUE).reduce((t,[k,v])=>t+(Math.max(0,Math.floor(Number(c?.[k])||0)))*v,0);}
// Paie un prix en gardant au mieux les pièces de forte valeur ; la monnaie rendue est en po, pa et pc.
function pay(coins,price){const total=coinsValue(coins);if(!Number.isInteger(price)||price<0||price>total)return null;let rest=total-price;const out={pp:0,gp:0,ep:0,sp:0,cp:0};
 for(const k of ['pp','gp','ep','sp','cp']){const keep=Math.min(Math.floor(Number(coins?.[k])||0),Math.floor(rest/COIN_VALUE[k]));out[k]=keep;rest-=keep*COIN_VALUE[k];}
 for(const k of ['gp','sp','cp']){const n=Math.floor(rest/COIN_VALUE[k]);out[k]+=n;rest-=n*COIN_VALUE[k];}return out;}
function splitCoins(coins,n){const res={share:{},rest:{}};for(const k of Object.keys(COIN_VALUE)){const v=Math.max(0,Math.floor(Number(coins?.[k])||0));res.share[k]=Math.floor(v/n);res.rest[k]=v%n;}return res;}
function formatPrice(cp){cp=Math.max(0,Math.floor(Number(cp)||0));if(cp===0)return 'gratuit';const parts=[];const gp=Math.floor(cp/100),sp=Math.floor(cp%100/10),c=cp%10;if(gp)parts.push(gp.toLocaleString('fr-FR')+' po');if(sp)parts.push(sp+' pa');if(c)parts.push(c+' pc');return parts.join(' ');}
function parsePrice(text){const m=/Prix\s*:\s*([\d\s]+)\s*(po|pa|pc|pe|pp)\b/i.exec(String(text||''));if(!m)return null;const n=Number(m[1].replace(/\s/g,''));const k={po:'gp',pa:'sp',pc:'cp',pe:'ep',pp:'pp'}[m[2].toLowerCase()];return n*COIN_VALUE[k];}
return {mod,armorOf,isShield,magicBonus,equipmentAc,carried,capacity,load,MAX_ATTUNED,attunedCount,isAmmo,healDice,useInfo,diceRange,COIN_VALUE,COIN_FR,coinsValue,pay,splitCoins,formatPrice,parsePrice};
});
