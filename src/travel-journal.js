/* Chroniques — journal de voyage (5.10). Les étapes d’un voyage sont notées automatiquement : départ, heures de
   marche, déplacements sur la carte en hexagones, campements, arrivée ; le MJ et les joueurs y ajoutent des notes
   (lieux, rencontres). Les joueurs voient la chronologie, sauf les notes que le MJ garde pour lui. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesTravelJournal=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const TRIPS=10,ENTRIES=300;
const KINDS={start:'Départ',march:'Marche',hex:'Exploration',camp:'Campement',arrival:'Arrivée',note:'Note',encounter:'Rencontre',place:'Lieu',end:'Fin du voyage'};
const ICONS={start:'🧭',march:'🥾',hex:'⬡',camp:'⛺',arrival:'🏁',note:'✎',encounter:'⚔',place:'📍',end:'■'};
function fail(m){const e=new Error(m);e.status=400;throw e;}
const clean=(v,label,max,req)=>{const t=String(v??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/\s+/g,' ').trim();if(req&&!t)fail(label+' obligatoire.');if(t.length>max)fail(label+' : '+max+' caractères maximum.');return t;};
function get(s){if(!s.travelLog||typeof s.travelLog!=='object')s.travelLog={trips:[]};if(!Array.isArray(s.travelLog.trips))s.travelLog.trips=[];return s.travelLog;}
function current(s){const t=get(s).trips[0];return t&&!t.endedAt?t:null;}
function begin(s,id,v){const g=get(s);const cur=current(s);if(cur)cur.endedAt=new Date().toISOString();
 const t={id,title:clean(v?.title,'Destination',90,false)||'Voyage',startedAt:new Date().toISOString(),entries:[]};g.trips.unshift(t);g.trips=g.trips.slice(0,TRIPS);return t;}
// Ajoute une étape ; sans voyage en cours, en ouvre un (« Exploration ») pour les déplacements sur la carte.
function add(s,id,e){let t=current(s);if(!t)t=begin(s,'trip-'+id,{title:e.tripTitle||'Exploration'});if(t.entries.length>=ENTRIES)t.entries.shift();
 const kind=Object.hasOwn(KINDS,e.kind)?e.kind:'note';const entry={id,kind,at:new Date().toISOString(),text:clean(e.text,'Texte',300,true),...(e.world?{world:String(e.world).slice(0,60)}:{}),...(Number.isFinite(e.km)&&e.km>0?{km:Math.round(e.km*10)/10}:{}),...(Number.isFinite(e.day)?{day:e.day}:{}),...(e.by?{by:String(e.by).slice(0,60)}:{}),...(e.gm?{gm:true}:{})};
 t.entries.push(entry);return entry;}
function end(s){const t=current(s);if(t)t.endedAt=new Date().toISOString();return t;}
function remove(s,entryId){for(const t of get(s).trips){const i=t.entries.findIndex(e=>e.id===entryId);if(i>=0)return t.entries.splice(i,1)[0];}fail('Étape introuvable.');}
function removeTrip(s,tripId){const g=get(s);const i=g.trips.findIndex(t=>t.id===tripId);if(i<0)fail('Voyage introuvable.');return g.trips.splice(i,1)[0];}
function totalKm(t){return Math.round((t.entries||[]).reduce((n,e)=>n+(e.km||0),0)*10)/10;}
function projected(s){const g=s.travelLog;if(!g)return undefined;return {trips:(g.trips||[]).map(t=>({...t,entries:(t.entries||[]).filter(e=>!e.gm).map(e=>({...e}))}))};}
return {KINDS,ICONS,get,current,begin,add,end,remove,removeTrip,totalKm,projected};
});
