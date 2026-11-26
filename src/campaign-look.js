/* Chroniques — couleur et emblème d’une campagne (5.12), pour distinguer ses campagnes d’un coup d’œil.
   La couleur ne sert qu’aux éléments décoratifs (liseré, cadre de l’emblème) : jamais au texte. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesCampaignLook=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const COLORS={ambre:['Ambre','#cfb278'],rubis:['Rubis','#e0605a'],emeraude:['Émeraude','#4fb37a'],saphir:['Saphir','#4f8fd9'],amethyste:['Améthyste','#a678d9'],turquoise:['Turquoise','#3fb8b0'],cuivre:['Cuivre','#d98a4f'],argent:['Argent','#a9b3bd']};
const EMBLEMS=['✦','⚔️','🐉','🏰','🌲','⚓','💀','🔮','👑','☀️','🌙','🛡️','📜','🍄','❄️','🔥','🗝️','🐺','🦅','🌊'];
function fail(m){const e=new Error(m);e.status=400;throw e;}
function set(s,v){const color=String(v?.color||'');const emblem=String(v?.emblem||'');if(color&&!Object.hasOwn(COLORS,color))fail('Couleur inconnue.');if(emblem&&!EMBLEMS.includes(emblem))fail('Emblème inconnu.');
 if(!color&&!emblem){delete s.look;return null;}s.look={color,emblem};return s.look;}
function of(s){const l=s?.look||{};return {color:l.color&&COLORS[l.color]?COLORS[l.color][1]:'',colorId:l.color||'',emblem:l.emblem||''};}
return {COLORS,EMBLEMS,set,of};
});
