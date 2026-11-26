/* Chroniques — sauts et chutes (5.11). Règles du SRD 5.1 et du SRD 5.2 (identiques sur ces points) :
   saut en longueur = valeur de Force en pieds avec 10 pieds d’élan (moitié sans élan) ;
   saut en hauteur = 3 + modificateur de Force en pieds avec élan (moitié sans élan, minimum 0) ;
   chute = 1d6 contondants par tranche de 10 pieds, 20d6 au maximum ; la créature tombe à terre si elle subit des dégâts.
   Le sort Saut triple la distance. Aucun dé n’est lancé ici : on indique seulement quoi lancer. 1 pied = 0,3 m. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesJumps=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const FT=0.3,MAX_FALL_DICE=20;
const mod=score=>Math.floor((score-10)/2);
function jump(str,{spell=false}={}){const s=Math.max(1,Math.min(30,Math.round(Number(str)||10)));const k=spell?3:1;const longFt=s*k,highFt=Math.max(0,3+mod(s))*k;
 return {str:s,mod:mod(s),longFt,standingLongFt:longFt/2,highFt,standingHighFt:highFt/2,longM:Math.round(longFt*FT*100)/100,standingLongM:Math.round(longFt/2*FT*100)/100,highM:Math.round(highFt*FT*100)/100,standingHighM:Math.round(highFt/2*FT*100)/100};}
// Hauteur en mètres (ou en pieds avec unit:'ft') → nombre de d6 à lancer.
function fall(height,{unit='m'}={}){const h=Math.max(0,Number(height)||0);const ft=unit==='ft'?h:h/FT;const dice=Math.min(MAX_FALL_DICE,Math.floor(ft/10+1e-9));return {feet:Math.round(ft*10)/10,dice,max:dice*6,capped:ft/10>=MAX_FALL_DICE};}
return {FT,MAX_FALL_DICE,jump,fall};
});
