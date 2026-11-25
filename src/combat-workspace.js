/* Chroniques — Disposition du bureau de combat, préférences locales seulement. */
(function(root,factory){
 const value=factory();
 if(typeof module==='object'&&module.exports)module.exports=value;
 if(root)root.ChroniquesCombatWorkspace=value;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const IDS=Object.freeze(['turn','party','initiative','actions','creatures','journal']);
 const LABELS=Object.freeze({turn:'Tour en cours',party:'Groupe',initiative:'Initiative',actions:'Actions & états',creatures:'Monstres & PNJ',journal:'Journal du combat'});
 const INITIAL=Object.freeze({turn:{visible:true,wide:false},party:{visible:true,wide:true},initiative:{visible:true,wide:false},actions:{visible:true,wide:true},creatures:{visible:true,wide:false},journal:{visible:false,wide:false}});
 function blank(){return {order:[...IDS],panels:Object.fromEntries(IDS.map(id=>[id,{...INITIAL[id]}]))};}
 function normalize(input){
  const out=blank();if(!input||typeof input!=='object')return out;
  const order=Array.isArray(input.order)?input.order:[];
  out.order=[...new Set(order.filter(id=>IDS.includes(id)))];
  for(const id of IDS)if(!out.order.includes(id))out.order.push(id);
  for(const id of IDS){const p=input.panels?.[id];if(p&&typeof p==='object'){
   if(typeof p.visible==='boolean')out.panels[id].visible=p.visible;
   if(typeof p.wide==='boolean')out.panels[id].wide=p.wide;
  }}
  if(!IDS.some(id=>out.panels[id].visible))out.panels.turn.visible=true;
  return out;
 }
 function move(source,id,direction){const v=normalize(source),from=v.order.indexOf(id);if(from<0)return v;
  const to=typeof direction==='number'?Math.max(0,Math.min(IDS.length-1,direction)):from+(direction==='up'?-1:direction==='down'?1:0);
  if(from!==to){v.order.splice(from,1);v.order.splice(Math.max(0,Math.min(IDS.length-1,to)),0,id);}return v;
 }
 function show(source,id,visible){const v=normalize(source);if(IDS.includes(id))v.panels[id].visible=!!visible;return normalize(v);}
 function width(source,id,wide){const v=normalize(source);if(IDS.includes(id))v.panels[id].wide=!!wide;return v;}
 function key(account,campaign,mode){return 'chroniques-combat-desk-v37:'+encodeURIComponent(String(account||''))+':'+encodeURIComponent(String(campaign||''))+':'+(mode==='gm'?'gm':'player');}
 return Object.freeze({IDS,LABELS,blank,normalize,move,show,width,key});
});
