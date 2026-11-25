/* Chroniques — météo du jour (5.6). Le MJ choisit le temps qu’il fait ; tout le monde le voit (accueil des joueurs,
   écran de table, spectateur). Descriptif seulement : aucun tirage, aucun effet de règle appliqué automatiquement.
   Les indications de visibilité renvoient aux règles « Vision et lumière » (zones légèrement ou fortement obscurcies). */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesWeather=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const SKY={clair:['☀','Ciel clair'],voile:['🌤','Ciel voilé'],nuageux:['⛅','Nuageux'],couvert:['☁','Couvert'],brume:['🌫','Brume'],brouillard:['🌫','Brouillard épais']};
const PRECIP={aucune:['','Pas de précipitations'],bruine:['🌦','Bruine'],pluie:['🌧','Pluie'],averse:['🌧','Pluie battante'],orage:['⛈','Orage'],neige:['🌨','Neige'],tempete:['❄','Blizzard'],grele:['🌨','Grêle']};
const TEMP={glacial:'Froid glacial',froid:'Froid',frais:'Frais',doux:'Doux',chaud:'Chaud',canicule:'Chaleur écrasante'};
const WIND={calme:'Vent calme',brise:'Brise légère',fort:'Vent fort',tempete:'Vent de tempête'};
// Repères pour le MJ (à appliquer s’il le souhaite) : visibilité et sons.
const HINTS={'s:brume':'Zone légèrement obscurcie au loin.','s:brouillard':'Zone fortement obscurcie : on ne voit presque rien au-delà de quelques mètres.','p:averse':'Zone légèrement obscurcie ; les bruits portent mal.','p:tempete':'Zone fortement obscurcie ; déplacements pénibles.','p:orage':'Éclairs et tonnerre : les bruits sont couverts.','w:fort':'Le vent gêne les projectiles et éteint les flammes nues.','t:glacial':'Exposition prolongée au froid dangereuse sans équipement adapté.','t:canicule':'Boire davantage : exposition prolongée à la chaleur dangereuse.'};
function fail(m){const e=new Error(m);e.status=400;throw e;}
function set(s,v){if(v===null){delete s.weather;return null;}const pick=(obj,k,label,def)=>{const x=v?.[k]==null||v[k]===''?def:String(v[k]);if(!Object.hasOwn(obj,x))fail(label+' inconnu.');return x;};
 const note=String(v?.note??'').replace(/[\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim();if(note.length>140)fail('Note : 140 caractères maximum.');
 s.weather={sky:pick(SKY,'sky','Ciel','clair'),precip:pick(PRECIP,'precip','Type de précipitations','aucune'),temp:pick(TEMP,'temp','Température','doux'),wind:pick(WIND,'wind','Vent','calme'),note,updatedAt:new Date().toISOString()};return s.weather;}
function icon(w){if(!w)return '';return (PRECIP[w.precip]?.[0])||SKY[w.sky]?.[0]||'☀';}
function parts(w){if(!w)return [];const out=[SKY[w.sky]?.[1]];if(w.precip&&w.precip!=='aucune')out.push(PRECIP[w.precip]?.[1]);out.push(TEMP[w.temp]);if(w.wind&&w.wind!=='calme')out.push(WIND[w.wind]);return out.filter(Boolean);}
function label(w){return parts(w).join(' · ');}
function hints(w){if(!w)return [];return [HINTS['s:'+w.sky],HINTS['p:'+w.precip],HINTS['w:'+w.wind]||(w.wind==='tempete'?HINTS['w:fort']:''),HINTS['t:'+w.temp]].filter(Boolean);}
function projected(s){return s.weather?{...s.weather}:null;}
return {SKY,PRECIP,TEMP,WIND,set,icon,parts,label,hints,projected};
});
