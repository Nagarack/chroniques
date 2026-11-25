/* Chroniques V2.2 — données résumées à partir de l'état déjà filtré par les permissions serveur.
   Aucun jet de dés, aucune mutation d'état, aucune donnée secrète supplémentaire. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesSheetView=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const SECTIONS=['play','actions','build','history'];
function section(value){return SECTIONS.includes(value)?value:'play';}
function num(v,fallback=0){return Number.isFinite(Number(v))?Number(v):fallback;}
function build(p,s,progression,slotRows){
 const hpMax=Math.max(1,num(p?.stats?.hp,1)),hp=Math.min(hpMax,Math.max(0,num(p?.hp,0)));
 const conditions=Array.isArray(p?.conditions)?p.conditions:[];
 const blocked=['Incapable d’agir','Étourdi','Paralysé','Inconscient','Pétrifié'].some(c=>conditions.includes(c));
 const economy=p?.economy||{};
 const statuses=[
  {label:'Action',value:!s?.action?(blocked?'Impossible':'Utilisée'):'Disponible',tone:s?.action?'ready':'muted'},
  {label:'Action bonus',value:economy.bonus?'Utilisée':s?.bonus?'Possible':'Conditionnelle',tone:s?.bonus?'ready':'muted'},
  {label:'Réaction',value:s?.reaction?'Disponible':blocked?'Impossible':'Utilisée',tone:s?.reaction?'ready':'muted'},
  {label:'Déplacement',value:num(s?.movement,0).toLocaleString('fr-FR')+' m',tone:num(s?.movement,0)>0?'ready':'muted'}
 ];
 const resources=Array.isArray(p?.resources)?p.resources:[];
 const remaining=resources.reduce((v,r)=>v+Math.max(0,num(r.left)),0),total=resources.reduce((v,r)=>v+Math.max(0,num(r.max)),0);
 const rows=Array.isArray(slotRows)?slotRows:[];
 const tracked=progression?.tracked===true;
 let spells='';if(rows.length){const max=rows.reduce((a,x)=>a+num(x.max),0);const left=rows.reduce((a,x)=>a+num(x.left),0);spells=tracked?`Emplacements ${left}/${max}`:`${max} emplacements théoriques (suivi inactif)`;}
 return {hp,hpMax,hpPercent:Math.max(0,Math.min(100,100*hp/hpMax)),tempHp:Math.max(0,num(p?.tempHp)),hpMessage:hp===0?'À 0 PV · sauvegardes de mort':hp*2<=hpMax?'PV à 50 % ou moins':'PV suivis manuellement',statuses,concentration:p?.concentration||'Pas de concentration',resources:resources.length?`Ressources ${remaining}/${total}`:'Pas de ressource suivie',spells};
}
return {build,section,SECTIONS};
});
