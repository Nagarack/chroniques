/* Chroniques V3.6 — Disposition du bureau MJ : préférences locales, jamais de données sensibles. */
(function(root,factory){
 const value=factory();
 if(typeof module==='object'&&module.exports)module.exports=value;
 if(root)root.ChroniquesWorkspace=value;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const IDS=Object.freeze(['notes','party','combat','session','shortcuts']);
 const LABELS=Object.freeze({notes:'Carnet de campagne',party:'Groupe',combat:'Rencontre',session:'Séance',shortcuts:'Accès rapides'});
 const INITIAL=Object.freeze({notes:{wide:true,visible:true},party:{wide:false,visible:true},combat:{wide:false,visible:true},session:{wide:false,visible:true},shortcuts:{wide:false,visible:true}});
 function blank(){return {order:[...IDS],panels:Object.fromEntries(IDS.map(id=>[id,{...INITIAL[id]}]))};}
 function normalize(input){
  const base=blank();
  if(!input||typeof input!=='object')return base;
  const order=Array.isArray(input.order)?input.order:[];
  base.order=[...new Set(order.filter(id=>IDS.includes(id)))];
  for(const id of IDS)if(!base.order.includes(id))base.order.push(id);
  for(const id of IDS){const val=input.panels?.[id];if(val&&typeof val==='object'){
    if(typeof val.visible==='boolean')base.panels[id].visible=val.visible;
    if(typeof val.wide==='boolean')base.panels[id].wide=val.wide;
  }}
  if(!IDS.some(id=>base.panels[id].visible))base.panels.notes.visible=true;
  return base;
 }
 function move(input,id,direction){
  const value=normalize(input),where=value.order.indexOf(id);
  if(where<0)return value;
  const target=typeof direction==='number'?Math.max(0,Math.min(value.order.length-1,direction)):where+(direction==='up'?-1:direction==='down'?1:0);
  if(where===target)return value;
  value.order.splice(where,1);value.order.splice(target,0,id);return value;
 }
 function show(input,id,visible){
  const value=normalize(input);if(!IDS.includes(id))return value;
  value.panels[id].visible=!!visible;return normalize(value);
 }
 function width(input,id,wide){const value=normalize(input);if(IDS.includes(id))value.panels[id].wide=!!wide;return value;}
 function key(account,campaign,role){
  // Un identifiant d'espace de travail distinct pour chaque compte, campagne et mode.
  return 'chroniques-workspace-v36:'+encodeURIComponent(String(account||''))+':'+encodeURIComponent(String(campaign||''))+':'+(role==='gm'?'gm':'player');
 }
 return Object.freeze({IDS,LABELS,blank,normalize,move,show,width,key});
});
