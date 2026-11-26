/* Chroniques — horloges de progression (5.8). Un cercle découpé en 4 à 12 segments que le MJ remplit au fil des
   événements : une menace qui approche (le rituel s’achève, la garde arrive) ou un projet qui avance (la porte cède,
   l’enquête progresse). Visible des joueurs ou secrète ; la note reste au MJ. Aucun tirage : le MJ décide. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesClocks=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAX=12,SEGMENTS=[4,6,8,10,12],KINDS={danger:'Menace',progress:'Progrès'};
function fail(m){const e=new Error(m);e.status=400;throw e;}
const clean=(v,label,max,required)=>{const t=String(v??'').replace(/[\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim();if(required&&!t)fail(label+' obligatoire.');if(t.length>max)fail(label+' : '+max+' caractères maximum.');return t;};
function list(s){if(!Array.isArray(s.clocks))s.clocks=[];return s.clocks;}
function find(s,id){const c=list(s).find(x=>x.id===id);if(!c)fail('Horloge introuvable.');return c;}
function values(v){const segments=Number(v?.segments??6);if(!SEGMENTS.includes(segments))fail('Segments : 4, 6, 8, 10 ou 12.');
 return {label:clean(v?.label,'Nom de l’horloge',60,true),segments,kind:Object.hasOwn(KINDS,v?.kind)?v.kind:'danger',visible:v?.visible===true,note:clean(v?.note,'Note',140,false)};}
function add(s,id,v){if(list(s).length>=MAX)fail('Maximum '+MAX+' horloges : retirez-en une.');const c={id,...values(v),filled:0,createdAt:new Date().toISOString()};s.clocks.push(c);return c;}
function update(s,id,v){const c=find(s,id);Object.assign(c,values(v));c.filled=Math.min(c.filled,c.segments);if(c.filled<c.segments)delete c.doneAt;return c;}
// Avance ou recule d’un nombre de segments ; renvoie completed quand l’horloge vient d’être remplie.
function tick(s,id,delta){const c=find(s,id);const d=Number(delta);if(!Number.isInteger(d)||d===0||Math.abs(d)>12)fail('Avancée invalide.');const before=c.filled;
 c.filled=Math.max(0,Math.min(c.segments,c.filled+d));const completed=before<c.segments&&c.filled===c.segments;if(completed)c.doneAt=new Date().toISOString();else if(c.filled<c.segments)delete c.doneAt;return {clock:c,completed};}
function remove(s,id){const i=list(s).findIndex(x=>x.id===id);if(i<0)fail('Horloge introuvable.');return s.clocks.splice(i,1)[0];}
function projected(s){return (s.clocks||[]).filter(c=>c.visible).map(({note,...c})=>({...c}));}
// Dessin SVG : un segment par part, rempli dans le sens des aiguilles d’une montre depuis midi.
function svg(c,size=64){const n=c.segments,r=size/2-3,cx=size/2,cy=size/2;let parts='';
 for(let i=0;i<n;i++){const a0=(i/n)*2*Math.PI-Math.PI/2,a1=((i+1)/n)*2*Math.PI-Math.PI/2;const x0=cx+r*Math.cos(a0),y0=cy+r*Math.sin(a0),x1=cx+r*Math.cos(a1),y1=cy+r*Math.sin(a1);
  parts+=`<path d="M${cx},${cy} L${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 0 1 ${x1.toFixed(2)},${y1.toFixed(2)} Z" class="${i<c.filled?'clock-on':'clock-off'}"/>`;}
 return `<svg class="clock-svg clock-${c.kind}" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">${parts}</svg>`;}
return {MAX,SEGMENTS,KINDS,list,add,update,tick,remove,projected,svg};
});
