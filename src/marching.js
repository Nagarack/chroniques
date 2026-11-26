/* Chroniques — ordre de marche et tours de garde (5.12).
   Ordre de marche : chaque personnage est devant, au milieu ou derrière (ou non placé). Un joueur place son personnage,
   le MJ place tout le monde. Tours de garde : la nuit (6 à 12 h) est partagée en 1 à 4 veilles, chacune avec ses guetteurs.
   Rappel SRD : monter la garde est une activité légère ; au plus 2 h d’activité légère pendant un repos long. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesMarching=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const RANKS={front:'Devant',middle:'Au milieu',back:'Derrière'};
const RANK_ICONS={front:'⬆',middle:'◆',back:'⬇'};
const MAX_WATCHES=4,MAX_PER_WATCH=8;
function fail(m){const e=new Error(m);e.status=400;throw e;}
function get(s){if(!s.marching||typeof s.marching!=='object')s.marching={ranks:{front:[],middle:[],back:[]},watches:[],nightHours:8};
 const m=s.marching;m.ranks=m.ranks||{};for(const k of Object.keys(RANKS))if(!Array.isArray(m.ranks[k]))m.ranks[k]=[];if(!Array.isArray(m.watches))m.watches=[];if(!Number.isFinite(m.nightHours))m.nightHours=8;return m;}
const pcExists=(s,id)=>(s.characters||[]).some(p=>p.id===id);
function rankOf(s,pcId){const m=s.marching;if(!m?.ranks)return '';for(const k of Object.keys(RANKS))if((m.ranks[k]||[]).includes(pcId))return k;return '';}
// Place un personnage (rang vide = retiré de l’ordre de marche). position : index dans le rang (fin par défaut).
function setRank(s,pcId,rank,position){if(!pcExists(s,pcId))fail('Personnage introuvable.');if(rank&&!Object.hasOwn(RANKS,rank))fail('Rang inconnu.');const m=get(s);
 for(const k of Object.keys(RANKS))m.ranks[k]=m.ranks[k].filter(x=>x!==pcId);if(rank){const list=m.ranks[rank];const i=Number.isInteger(position)?Math.max(0,Math.min(list.length,position)):list.length;list.splice(i,0,pcId);}return m;}
function clear(s){const m=get(s);for(const k of Object.keys(RANKS))m.ranks[k]=[];m.watches=[];return m;}
// Veilles : [[pcId,…],…] (1 à 4), durée de la nuit en heures (6 à 12).
function setWatches(s,watches,nightHours){const m=get(s);if(!Array.isArray(watches)||watches.length>MAX_WATCHES)fail('Entre 0 et '+MAX_WATCHES+' veilles.');
 const h=Number(nightHours??m.nightHours);if(!Number.isFinite(h)||h<6||h>12)fail('Durée de la nuit : 6 à 12 heures.');
 m.watches=watches.map((w,i)=>{if(!Array.isArray(w))fail('Veille '+(i+1)+' invalide.');const ids=[...new Set(w.map(String))];if(ids.length>MAX_PER_WATCH)fail('Veille '+(i+1)+' : '+MAX_PER_WATCH+' guetteurs au plus.');
  for(const id of ids)if(!pcExists(s,id))fail('Personnage introuvable.');return ids;});m.nightHours=Math.round(h*2)/2;return m;}
// Retire les personnages supprimés.
function prune(s){const m=s.marching;if(!m)return;const ok=id=>pcExists(s,id);for(const k of Object.keys(RANKS))m.ranks[k]=(m.ranks[k]||[]).filter(ok);m.watches=(m.watches||[]).map(w=>w.filter(ok));}
// Minutes par veille et dépassement des 2 h d’activité légère.
function watchMinutes(m){const n=(m?.watches||[]).length;return n?Math.round((m.nightHours||8)*60/n):0;}
function summary(s){const m=s.marching;if(!m)return null;const name=id=>(s.characters||[]).find(p=>p.id===id)?.name||'?';
 const ranks=Object.keys(RANKS).map(k=>({id:k,label:RANKS[k],icon:RANK_ICONS[k],names:(m.ranks?.[k]||[]).filter(id=>pcExists(s,id)).map(name)}));
 const unplaced=(s.characters||[]).filter(p=>!rankOf(s,p.id)).map(p=>p.name);const mins=watchMinutes(m);
 return {ranks,unplaced,any:ranks.some(r=>r.names.length),watches:(m.watches||[]).map((w,i)=>({n:i+1,names:w.filter(id=>pcExists(s,id)).map(name),start:i*mins,minutes:mins})),nightHours:m.nightHours||8,long:mins>120};}
return {RANKS,RANK_ICONS,MAX_WATCHES,get,rankOf,setRank,clear,setWatches,prune,watchMinutes,summary};
});
