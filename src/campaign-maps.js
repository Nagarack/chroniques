/* Chroniques V2.7 — Cartes, repères illustrés et permissions. */
'use strict';
const A=require('./art-catalog');
const M=require('./media');
const MAX_MAPS=24, MAX_MARKERS=120;
const SYMBOLS=Object.freeze({point:'⌖',monster:'🐉',chest:'🧰',npc:'♟',item:'💎',trap:'⚠',quest:'✦',camp:'⛺',portal:'🌀',place:'🏰'});
function bad(message){const e=new Error(message);e.status=400;throw e;}
function text(v,label,max,required=false){if(typeof v!=='string')bad(label+' invalide.');const x=v.trim();if(x.length>max||(required&&!x))bad(label+' : maximum '+max+' caractères.');return x;}
function visibility(v){if(!['private','shared'].includes(v))bad('Visibilité invalide.');return v;}
function maps(s){if(!Array.isArray(s.maps))s.maps=[];return s.maps;}
function read(s,id){return maps(s).find(m=>m.id===id);}
function canRead(u,map){return !!map&&(u.role==='gm'||map.visibility==='shared');}
function markerImage(marker){const image=marker.image||null;return {builtinId:image?.source==='builtin'?image.id:null,hasImage:!!(image&&(image.source==='upload'||image.source==='media'))};}
// Joueurs : le lien vers une fiche du carnet n'est transmis que si cette fiche est publiée.
function publicLink(s,p){const l=p.linked;const sec=l&&PLANNER_LINKS[l.kind];if(!sec)return {};const e=((s.campaignPlanner||{})[sec]||[]).find(x=>x.id===l.id);return e&&e.visibility==='shared'?{plannerLink:{kind:l.kind,id:e.id,title:e.title}}:{};}
function projected(s,u){return (s.maps||[]).filter(m=>canRead(u,m)).map(m=>({id:m.id,title:m.title,summary:m.summary,visibility:m.visibility,hasImage:!!m.filename,grid:gridOf(m),fog:{enabled:!!(m.fog&&m.fog.enabled),revealed:(m.fog&&Array.isArray(m.fog.revealed)?m.fog.revealed:[]).map(c=>c.slice())},tokens:(m.tokens||[]).filter(t=>u.role==='gm'||t.visible).map(t=>({...t})),areas:(m.areas||[]).map(a=>({...a})),markers:(m.markers||[]).filter(p=>u.role==='gm'||p.visibility==='shared').map(p=>({id:p.id,title:p.title,description:p.description,visibility:p.visibility,x:p.x,y:p.y,symbol:SYMBOLS[p.symbol]?p.symbol:'point',...markerImage(p),...(u.role==='gm'?{linked:p.linked||null,loot:Array.isArray(p.loot)?p.loot:[],lootRevealed:p.lootRevealed===true}:{...(p.lootRevealed===true?{lootRevealed:true,publicLoot:(p.loot||[]).map(x=>({name:x.name,quantity:x.quantity??1}))}:{}),...publicLink(s,p)})}))}));}
function add(s,id,v){if(maps(s).length>=MAX_MAPS)bad('Maximum 24 cartes.');if(!/^map-[A-Za-z0-9_-]{7,48}$/.test(id))bad('Identifiant invalide.');const m={id,title:text(v?.title,'Titre',90,true),summary:text(v?.summary||'','Description',500),visibility:visibility(v?.visibility),markers:[],filename:null,mime:null};maps(s).push(m);return m;}
function update(s,id,v){const m=read(s,id);if(!m)bad('Carte introuvable.');m.title=text(v?.title,'Titre',90,true);m.summary=text(v?.summary||'','Description',500);m.visibility=visibility(v?.visibility);return m;}
function setMapVisibility(s,id,v){const m=read(s,id);if(!m)bad('Carte introuvable.');m.visibility=visibility(v);return m;}
function setMarkerVisibility(s,mapId,pinId,v){const mark=markerRead(s,mapId,pinId);if(!mark)bad('Repère introuvable.');mark.visibility=visibility(v);return mark;}
function remove(s,id){const arr=maps(s),i=arr.findIndex(m=>m.id===id);if(i<0)bad('Carte introuvable.');if((arr[i].markers||[]).some(p=>(p.loot||[]).length))bad('Cette carte contient des trésors. Déplacez-les vers la réserve du MJ avant de supprimer la carte.');return arr.splice(i,1)[0];}
function checkPoint(v){const n=Number(v);if(typeof v!=='number'||!Number.isInteger(n)||n<0||n>1000)bad('Position invalide (0 à 1000).');return n;}
function markerRead(s,mapId,id){return read(s,mapId)?.markers?.find(p=>p.id===id)||null;}
// Fiches du carnet de campagne qu'un repère peut désigner (lieu, PNJ récurrent, quête).
const PLANNER_LINKS={place:'places',pnpc:'npcs',quest:'quests'};
function linked(s,v,previous){
 if(v.linkKind===undefined)return previous||null;
 if(v.linkKind===''||v.linkKind==='none')return null;
 if(!['npc','character','spell','item','template','place','pnpc','quest'].includes(v.linkKind))bad('Type de liaison inconnu.');
 if(typeof v.linkId!=='string'||v.linkId.length>110||!v.linkId)bad('Identifiant de liaison invalide.');
 const characterId=typeof v.linkCharacterId==='string'?v.linkCharacterId:'';
 if(characterId.length>110)bad('Personnage de liaison invalide.');
 if(PLANNER_LINKS[v.linkKind]){if(!((s.campaignPlanner||{})[PLANNER_LINKS[v.linkKind]]||[]).some(e=>e.id===v.linkId))bad('Fiche du carnet introuvable.');}
 else if(v.linkKind==='template'){
  if(!(s.gmLibrary?.templates||[]).some(t=>t.id===v.linkId))bad('Modèle de monstre introuvable.');
 }else if(!M.target(s,v.linkKind,v.linkId,characterId))bad('Fiche liée introuvable.');
 return {kind:v.linkKind,id:v.linkId,characterId:characterId||''};
}
function imageValue(s,v,previous){
 const choice=v.imageChoice===undefined?'keep':v.imageChoice;
 if(choice==='keep')return previous||null;
 if(choice==='clear'||choice==='')return null;
 if(typeof choice!=='string'||choice.length>130)bad('Illustration invalide.');
 if(choice.startsWith('builtin:')){
  const id=choice.slice(8);if(!A.get(id))bad('Icône du catalogue introuvable.');return {source:'builtin',id};
 }
 if(choice.startsWith('media:')){
  const id=choice.slice(6),media=M.list(s).find(m=>m.id===id);
  if(!media||!M.canRead(s,{role:'gm'},media))bad('Illustration existante indisponible.');
  return {source:'media',id};
 }
 bad('Source d’illustration invalide.');
}
function markerValues(s,v,old){
 const symbol=v?.symbol===undefined?(old?.symbol||'point'):v.symbol;
 if(!Object.hasOwn(SYMBOLS,symbol))bad('Icône de repère invalide.');
 return {title:text(v?.title,'Titre du repère',90,true),description:text(v?.description||'','Description du repère',500),visibility:visibility(v?.visibility),x:checkPoint(v?.x),y:checkPoint(v?.y),symbol,linked:linked(s,v,old?.linked),image:imageValue(s,v,old?.image)};
}
function markerAdd(s,mapId,id,v){const map=read(s,mapId);if(!map)bad('Carte introuvable.');if(map.markers.length>=MAX_MARKERS)bad('Maximum 120 repères par carte.');if(!/^pin-[A-Za-z0-9_-]{7,48}$/.test(id))bad('Identifiant de repère invalide.');const point={id,...markerValues(s,v)};map.markers.push(point);return point;}
function markerUpdate(s,mapId,id,v){const mark=markerRead(s,mapId,id);if(!mark)bad('Repère introuvable.');Object.assign(mark,markerValues(s,v,mark));return mark;}
function markerRemove(s,mapId,id){const map=read(s,mapId),i=map?.markers.findIndex(p=>p.id===id);if(i==null||i<0)bad('Repère introuvable.');if((map.markers[i].loot||[]).length)bad('Ce repère contient des trésors. Déplacez-les vers la réserve du MJ avant de supprimer le repère.');return map.markers.splice(i,1)[0];}
// --- Grille, brouillard de guerre et jetons (V4) ---
const MAX_TOKENS=60,MAX_REVEALS=400,TOKEN_KINDS=['pc','npc','custom'],TOKEN_COLORS=['or','rouge','bleu','vert','violet','gris'];
function gridOf(m){const g=m.grid||{};return {cells:Number(g.cells)||0,scale:typeof g.scale==='string'?g.scale:'1,5 m'};}
function setGrid(s,id,v){const m=read(s,id);if(!m)bad('Carte introuvable.');const cells=Number(v?.cells);if(!Number.isInteger(cells)||(cells!==0&&(cells<4||cells>80)))bad('Grille : 0 (aucune) ou de 4 à 80 cases en largeur.');m.grid={cells,scale:text(v?.scale??'1,5 m','Échelle',20)};return m;}
function fogState(m){if(!m.fog||typeof m.fog!=='object')m.fog={enabled:false,revealed:[]};if(!Array.isArray(m.fog.revealed))m.fog.revealed=[];return m.fog;}
function setFog(s,id,op,v){const m=read(s,id);if(!m)bad('Carte introuvable.');const f=fogState(m);
 if(op==='enable'){f.enabled=true;}else if(op==='disable'){f.enabled=false;}else if(op==='reset'){f.revealed=[];f.enabled=true;}
 else if(op==='undo'){f.revealed.pop();}
 else if(op==='reveal'){const r=Number(v?.r);if(!Number.isInteger(r)||r<10||r>500)bad('Rayon invalide.');if(f.revealed.length>=MAX_REVEALS)bad('Trop de zones révélées : utilisez « Tout révéler » ou recommencez.');f.revealed.push([checkPoint(v?.x),checkPoint(v?.y),r]);}
 else bad('Opération de brouillard inconnue.');return m;}
function tokenRead(s,mapId,id){return read(s,mapId)?.tokens?.find(t=>t.id===id)||null;}
function tokenAdd(s,mapId,id,v){const m=read(s,mapId);if(!m)bad('Carte introuvable.');if(!Array.isArray(m.tokens))m.tokens=[];if(m.tokens.length>=MAX_TOKENS)bad('Maximum '+MAX_TOKENS+' jetons par carte.');if(!/^tok-[A-Za-z0-9_-]{6,48}$/.test(id))bad('Identifiant invalide.');
 const kind=v?.kind;if(!TOKEN_KINDS.includes(kind))bad('Type de jeton inconnu.');const refId=kind==='custom'?'':text(v?.refId,'Référence',60,true);
 if(refId&&m.tokens.some(t=>t.refId===refId))bad('Ce personnage a déjà un jeton sur cette carte.');
 const color=TOKEN_COLORS.includes(v?.color)?v.color:(kind==='pc'?'bleu':kind==='npc'?'rouge':'or');
 const t={id,kind,refId,label:text(v?.label,'Nom du jeton',40,true),x:checkPoint(v?.x),y:checkPoint(v?.y),color,visible:v?.visible!==false};m.tokens.push(t);return t;}
function tokenMove(s,mapId,id,x,y){const t=tokenRead(s,mapId,id);if(!t)bad('Jeton introuvable.');t.x=checkPoint(x);t.y=checkPoint(y);return t;}
function tokenSet(s,mapId,id,v){const t=tokenRead(s,mapId,id);if(!t)bad('Jeton introuvable.');if(v&&'visible' in v)t.visible=!!v.visible;if(v&&v.color!==undefined){if(!TOKEN_COLORS.includes(v.color))bad('Couleur inconnue.');t.color=v.color;}if(v&&v.label!==undefined)t.label=text(v.label,'Nom du jeton',40,true);return t;}
function tokenRemove(s,mapId,id){const m=read(s,mapId),i=m?.tokens?.findIndex(t=>t.id===id);if(i==null||i<0)bad('Jeton introuvable.');return m.tokens.splice(i,1)[0];}
// --- Gabarits de zones de sort (V4.3) : en mètres, convertis à l'écran selon la grille ---
const AREA_SHAPES=['circle','cone','line','cube'],AREA_COLORS=['or','rouge','bleu','vert','violet'],MAX_AREAS=30;
function areaAdd(s,mapId,id,v,by){const m=read(s,mapId);if(!m)bad('Carte introuvable.');if(!(m.grid&&m.grid.cells))bad('Ajoutez d’abord une grille à la carte pour placer une zone.');if(!Array.isArray(m.areas))m.areas=[];if(m.areas.length>=MAX_AREAS)bad('Maximum '+MAX_AREAS+' zones sur une carte : effacez-en.');
 const shape=AREA_SHAPES.includes(v?.shape)?v.shape:bad('Forme inconnue.');const size=Number(v?.size);if(!Number.isFinite(size)||size<1||size>150)bad('Taille : 1 à 150 m.');const angle=Number(v?.angle??0);if(!Number.isFinite(angle)||angle<-360||angle>360)bad('Orientation invalide.');
 const a={id,shape,size:Math.round(size*10)/10,x:checkPoint(v?.x),y:checkPoint(v?.y),angle:Math.round(angle),color:AREA_COLORS.includes(v?.color)?v.color:'rouge',label:text(String(v?.label??''),'Nom de la zone',40,false),by:String(by||'').slice(0,60)};m.areas.push(a);return a;}
function areaRemove(s,mapId,areaId){const m=read(s,mapId),i=m?.areas?.findIndex(a=>a.id===areaId);if(i==null||i<0)bad('Zone introuvable.');return m.areas.splice(i,1)[0];}
function areaClear(s,mapId){const m=read(s,mapId);if(!m)bad('Carte introuvable.');m.areas=[];return m;}
module.exports={PLANNER_LINKS,AREA_SHAPES,MAX_AREAS,areaAdd,areaRemove,areaClear,MAX_TOKENS,TOKEN_COLORS,setGrid,setFog,tokenRead,tokenAdd,tokenMove,tokenSet,tokenRemove,MAX_MAPS,MAX_MARKERS,SYMBOLS,maps,read,canRead,projected,add,update,setMapVisibility,setMarkerVisibility,remove,markerRead,markerAdd,markerUpdate,markerRemove};
