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
function projected(s,u){return (s.maps||[]).filter(m=>canRead(u,m)).map(m=>({id:m.id,title:m.title,summary:m.summary,visibility:m.visibility,hasImage:!!m.filename,grid:gridOf(m),vision:m.vision?{...m.vision,effective:effectiveLight(s,m)}:{enabled:false,light:'lit',range:18,effective:'lit'},aspect:Number(m.aspect)||null,hex:m.hex?{explored:[...(m.hex.explored||[])],party:m.hex.party||null,fog:!!m.hex.fog}:null,...(u.role==='gm'?{walls:(m.walls||[]).map(w=>({...w}))}:{}),fog:{enabled:!!(m.fog&&m.fog.enabled),revealed:(m.fog&&Array.isArray(m.fog.revealed)?m.fog.revealed:[]).map(c=>c.slice())},tokens:(m.tokens||[]).filter(t=>u.role==='gm'||t.visible).map(t=>({...t})),areas:(m.areas||[]).map(a=>({...a})),markers:(m.markers||[]).filter(p=>u.role==='gm'||p.visibility==='shared').map(p=>({id:p.id,title:p.title,description:p.description,visibility:p.visibility,x:p.x,y:p.y,symbol:SYMBOLS[p.symbol]?p.symbol:'point',...markerImage(p),...(p.trap?{trap:u.role==='gm'?{...p.trap}:{state:p.trap.state}}:{}),...(u.role==='gm'?{linked:p.linked||null,loot:Array.isArray(p.loot)?p.loot:[],lootRevealed:p.lootRevealed===true}:{...(p.lootRevealed===true?{lootRevealed:true,publicLoot:(p.loot||[]).map(x=>({name:x.name,quantity:x.quantity??1}))}:{}),...publicLink(s,p)})}))}));}
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
// 5.4 : pièges. Un repère « piège » porte un état (caché, repéré, désamorcé, déclenché), des DD et l’exemple du SRD dont il s’inspire.
const TRAP_REFS=Object.freeze({'Aiguille empoisonnée':'Poison Needle','Effondrement de plafond':'Collapsing Roof','Filet suspendu':'Falling Net','Fléchettes empoisonnées':'Poison Darts','Fosses':'Pits','Sphère d’annihilation':'Sphere of Annihilation','Sphère roulante':'Rolling Sphere','Statue au souffle de feu':'Fire-Breathing Statue'});
const TRAP_STATES=['hidden','spotted','disarmed','triggered'];
function trapSet(s,mapId,id,v){const mark=markerRead(s,mapId,id);if(!mark)bad('Repère introuvable.');if(mark.symbol!=='trap')bad('Ce repère n’est pas un piège.');
 const dc=(x,label)=>{if(x===''||x==null)return null;const n=Number(x);if(!Number.isInteger(n)||n<1||n>40)bad(label+' : de 1 à 40.');return n;};
 const old=mark.trap||{};const state=v?.state===undefined?(old.state||'hidden'):v.state;if(!TRAP_STATES.includes(state))bad('État du piège inconnu.');
 const ref=v?.ref===undefined?(old.ref||''):String(v.ref||'');if(ref&&!Object.hasOwn(TRAP_REFS,ref))bad('Exemple de piège inconnu.');
 mark.trap={ref,state,detectDc:v?.detectDc===undefined?(old.detectDc??null):dc(v.detectDc,'DD pour repérer'),disarmDc:v?.disarmDc===undefined?(old.disarmDc??null):dc(v.disarmDc,'DD pour désamorcer'),saveDc:v?.saveDc===undefined?(old.saveDc??null):dc(v.saveDc,'DD de sauvegarde'),effect:v?.effect===undefined?(old.effect||''):text(v.effect||'','Effet du piège',300)};
 // Repéré ou déclenché : les joueurs le voient sur la carte.
 if((state==='spotted'||state==='triggered')&&mark.visibility!=='shared')mark.visibility='shared';return mark;}
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
function gridOf(m){const g=m.grid||{};return {cells:Number(g.cells)||0,scale:typeof g.scale==='string'?g.scale:'1,5 m',shape:g.shape==='hex'?'hex':'square'};}
function setGrid(s,id,v){const m=read(s,id);if(!m)bad('Carte introuvable.');const cells=Number(v?.cells);const shape=v?.shape==='hex'?'hex':'square';
 if(!Number.isInteger(cells)||(cells!==0&&(cells<4||cells>(shape==='hex'?40:80))))bad(shape==='hex'?'Hexagones : 0 (aucun) ou de 4 à 40 en largeur.':'Grille : 0 (aucune) ou de 4 à 80 cases en largeur.');
 m.grid={cells,scale:text(v?.scale??(shape==='hex'?'10 km':'1,5 m'),'Échelle',20),...(shape==='hex'?{shape}:{})};return m;}
// 5.5 : carte en hexagones — hexagones explorés, position du groupe, brouillard des hexagones.
function hexOf(m){if(!m.hex||typeof m.hex!=='object')m.hex={explored:[],party:null,fog:false};if(!Array.isArray(m.hex.explored))m.hex.explored=[];return m.hex;}
function hexCheck(m,k){const H=require('./hex.js');const g=gridOf(m);if(g.shape!=='hex'||!g.cells)bad('Cette carte n’a pas de grille hexagonale.');const h=H.parse(k);if(!h||h.q<0||h.r<0||h.q>=g.cells||h.r>=H.rows(g.cells,Number(m.aspect)||1)+1)bad('Hexagone hors de la carte.');return h;}
function hexToggle(s,id,k){const m=read(s,id);if(!m)bad('Carte introuvable.');const h=hexCheck(m,k);const x=hexOf(m);const key=h.q+','+h.r;const i=x.explored.indexOf(key);if(i>=0)x.explored.splice(i,1);else{if(x.explored.length>=3000)bad('Trop d’hexagones explorés.');x.explored.push(key);}return i<0;}
function hexFog(s,id,on){const m=read(s,id);if(!m)bad('Carte introuvable.');if(gridOf(m).shape!=='hex')bad('Cette carte n’a pas de grille hexagonale.');hexOf(m).fog=!!on;}
// Déplacement du groupe : les hexagones traversés deviennent explorés. Renvoie le nombre d’hexagones parcourus.
function hexMove(s,id,k){const H=require('./hex.js');const m=read(s,id);if(!m)bad('Carte introuvable.');const to=hexCheck(m,k);const x=hexOf(m);const from=x.party?H.parse(x.party):null;
 const path=from?H.line(from,to):[to];for(const h of path){const key=h.q+','+h.r;if(!x.explored.includes(key)&&x.explored.length<3000)x.explored.push(key);}x.party=to.q+','+to.r;return {steps:from?H.distance(from,to):0,km:H.km(gridOf(m).scale)};}
function fogState(m){if(!m.fog||typeof m.fog!=='object')m.fog={enabled:false,revealed:[]};if(!Array.isArray(m.fog.revealed))m.fog.revealed=[];return m.fog;}
function setFog(s,id,op,v){const m=read(s,id);if(!m)bad('Carte introuvable.');const f=fogState(m);
 if(op==='enable'){f.enabled=true;}else if(op==='disable'){f.enabled=false;}else if(op==='reset'){f.revealed=[];f.enabled=true;}
 else if(op==='undo'){f.revealed.pop();}
 else if(op==='reveal'){const r=Number(v?.r);if(!Number.isInteger(r)||r<10||r>500)bad('Rayon invalide.');if(f.revealed.length>=(m.vision&&m.vision.enabled?MAX_VISION_REVEALS:MAX_REVEALS))bad('Trop de zones révélées : utilisez « Tout révéler » ou recommencez.');f.revealed.push([checkPoint(v?.x),checkPoint(v?.y),r]);}
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
// 5.3 : vision des jetons. Quand la vision est active sur une carte avec brouillard et grille, chaque jeton de personnage
// révèle un cercle autour de lui à chaque déplacement (les zones explorées restent visibles). Pas de murs ni de lignes de vue :
// le MJ garde la main sur le brouillard (« Annuler », « Recommencer »).
const LIGHTS={'':0,bougie:3,torche:12,lumiere:12,lanterne:18};// mètres (lumière vive + faible) d’après le SRD
const MAX_VISION_REVEALS=1500;
function visionOf(m){if(!m.vision||typeof m.vision!=='object')m.vision={enabled:false,light:'lit',range:18};return m.vision;}
function scaleMeters(m){const g=gridOf(m);const mt=/([\d]+(?:[.,]\d+)?)\s*(m|mètres?|ft|pi|pieds?|feet|foot)?/i.exec(g.scale||'');if(!mt)return 1.5;const v=Number(mt[1].replace(',','.'));if(!(v>0))return 1.5;return /^(ft|pi|pied|feet|foot)/i.test(mt[2]||'')?v*0.3:v;}
function setVision(s,id,v){const m=read(s,id);if(!m)bad('Carte introuvable.');const vi=visionOf(m);
 if(v&&'enabled' in v){if(v.enabled&&!(gridOf(m).cells>0))bad('Ajoutez d’abord une grille (nombre de cases) pour calculer les distances de vision.');vi.enabled=!!v.enabled;if(vi.enabled)fogState(m).enabled=true;}
 if(v&&v.light!==undefined){if(!['lit','dark','auto'].includes(v.light))bad('Éclairage inconnu.');vi.light=v.light;}
 if(v&&v.range!==undefined){const r=Number(v.range);if(!Number.isFinite(r)||r<1.5||r>300)bad('Portée de vue : 1,5 à 300 m.');vi.range=Math.round(r*10)/10;}return m;}
function tokenLight(s,mapId,id,v){const t=tokenRead(s,mapId,id);if(!t)bad('Jeton introuvable.');if(v&&v.light!==undefined){if(!Object.hasOwn(LIGHTS,v.light))bad('Source de lumière inconnue.');t.light=v.light;delete t.lightAuto;}
 if(v&&v.sight!==undefined){const n=Number(v.sight);if(!Number.isFinite(n)||n<0||n>300)bad('Vision : 0 à 300 m.');t.sight=Math.round(n*10)/10;}return t;}
// Rayon (mètres) d’un jeton : en lumière, la portée de vue de la carte ; dans le noir, la meilleure de sa vision dans le noir et de sa lumière.
// 5.6 : « auto » suit l’heure du monde (jour de 6 h à 20 h, nuit sinon) ; sans calendrier du monde, lieu éclairé.
function isDay(s){const wt=s&&s.worldTime;if(!wt||!wt.enabled)return true;const h=Math.floor(((Number(wt.minutes)||0)%1440)/60);return h>=6&&h<20;}
function effectiveLight(s,m){const vi=visionOf(m);return vi.light==='auto'?(isDay(s)?'lit':'dark'):vi.light;}
// Lumières tenues par les personnages (suivi des lumières) : appliquées à leurs jetons ; une lumière réglée à la main n’est pas remplacée.
function syncPcLights(s,best){let n=0;for(const m of s.maps||[])for(const t of m.tokens||[]){if(t.kind!=='pc')continue;const k=best[t.refId]||'';
  if(k&&(t.lightAuto||!t.light)){if(t.light!==k){t.light=k;n++;}t.lightAuto=true;}else if(!k&&t.lightAuto){t.light='';delete t.lightAuto;n++;}}return n;}
function tokenRadius(m,t,darkvision,light){const vi=visionOf(m);const own=Number(t.sight)>0?Number(t.sight):Number(darkvision)||0;const lamp=LIGHTS[t.light||'']||0;
 return (light||vi.light)==='dark'?Math.max(own,lamp):Math.max(vi.range||18,lamp);}
// Révèle autour des jetons de personnages visibles (ou d’un seul). `darkvisionOf(refId)` donne la vision dans le noir en mètres.
// 5.4 : murs et portes. Coordonnées 0–1000 sur chaque axe ; `aspect` = largeur / hauteur de l’image.
const MAX_WALLS=500;
// Dimensions d’une image PNG ou WebP (en-tête seulement).
function imageSize(b){if(!b||b.length<30)return null;if(b.readUInt32BE(0)===0x89504e47)return {w:b.readUInt32BE(16),h:b.readUInt32BE(20)};
 if(b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP'){const c=b.toString('ascii',12,16);
  if(c==='VP8X')return {w:1+b.readUIntLE(24,3),h:1+b.readUIntLE(27,3)};if(c==='VP8 ')return {w:b.readUInt16LE(26)&0x3fff,h:b.readUInt16LE(28)&0x3fff};
  if(c==='VP8L'){const v=b.readUInt32LE(21);return {w:1+(v&0x3fff),h:1+((v>>14)&0x3fff)};}}return null;}
// Empreinte de l’état des murs (portes ouvertes comprises) : une nouvelle ouverture de porte permet une nouvelle révélation au même endroit.
function wallsKey(m){let h=0;for(const w of m.walls||[])h=(h*31+(w.x1+w.y1*7+w.x2*13+w.y2*17)+(w.door&&w.open?1:0))%1000003;return h;}
function wallsOf(m){if(!Array.isArray(m.walls))m.walls=[];return m.walls;}
function wallAdd(s,mapId,id,v){const m=read(s,mapId);if(!m)bad('Carte introuvable.');const w=wallsOf(m);if(w.length>=MAX_WALLS)bad('Maximum '+MAX_WALLS+' murs par carte.');
 const n=k=>{const x=Number(v?.[k]);if(!Number.isFinite(x)||x<0||x>1000)bad('Position de mur invalide.');return Math.round(x);};const wall={id,x1:n('x1'),y1:n('y1'),x2:n('x2'),y2:n('y2'),door:v?.door===true,open:false};
 if(wall.x1===wall.x2&&wall.y1===wall.y2)bad('Mur trop court.');w.push(wall);return wall;}
function wallRemove(s,mapId,id){const m=read(s,mapId);if(!m)bad('Carte introuvable.');const w=wallsOf(m);const i=id==='__last'?w.length-1:w.findIndex(x=>x.id===id);if(i<0)bad('Mur introuvable.');return w.splice(i,1)[0];}
function wallClear(s,mapId){const m=read(s,mapId);if(!m)bad('Carte introuvable.');m.walls=[];}
function doorSet(s,mapId,id,open){const m=read(s,mapId);if(!m)bad('Carte introuvable.');const d=wallsOf(m).find(x=>x.id===id&&x.door);if(!d)bad('Porte introuvable.');d.open=!!open;return d;}
// Polygone de visibilité : rayons vers chaque extrémité de mur proche et 48 rayons réguliers, arrêtés au premier mur fermé.
function visibilityPolygon(ox,oy,R,walls,aspect){const k=aspect>0?aspect:1;const O={x:ox,y:oy/k};
 const segs=[];for(const w of walls||[]){if(w.door&&w.open)continue;const A={x:w.x1,y:w.y1/k},B={x:w.x2,y:w.y2/k};
  const dx=B.x-A.x,dy=B.y-A.y,len2=dx*dx+dy*dy;const t=len2?Math.max(0,Math.min(1,((O.x-A.x)*dx+(O.y-A.y)*dy)/len2)):0;if(Math.hypot(A.x+t*dx-O.x,A.y+t*dy-O.y)<=R)segs.push([A,B]);}
 if(!segs.length)return null;
 const angles=[];for(let i=0;i<48;i++)angles.push(i*Math.PI/24);for(const [A,B] of segs)for(const P of [A,B]){if(Math.hypot(P.x-O.x,P.y-O.y)>R*1.02)continue;const a=Math.atan2(P.y-O.y,P.x-O.x);angles.push(a-1e-4,a+1e-4);}
 angles.sort((a,b)=>a-b);const pts=[];
 for(const a of angles){const dx=Math.cos(a),dy=Math.sin(a);let t=R;for(const [A,B] of segs){const ex=B.x-A.x,ey=B.y-A.y;const den=dx*ey-dy*ex;if(Math.abs(den)<1e-9)continue;const wx=A.x-O.x,wy=A.y-O.y;const tt=(wx*ey-wy*ex)/den,u=(wx*dy-wy*dx)/den;if(tt>0&&u>=0&&u<=1&&tt<t)t=tt;}
  const px=Math.round(O.x+dx*t),py=Math.round((O.y+dy*t)*k);const last=pts[pts.length-1];if(!last||last[0]!==px||last[1]!==py)pts.push([px,py]);}
 return pts;}
function visionReveal(s,mapId,darkvisionOf,onlyTokenId){const m=read(s,mapId);if(!m)return 0;const vi=visionOf(m);const f=fogState(m);if(!vi.enabled||!f.enabled)return 0;const cells=gridOf(m).cells;if(!cells)return 0;
 const unit=1000/cells/scaleMeters(m);let n=0;
 for(const t of m.tokens||[]){if(t.kind!=='pc'||!t.visible||(onlyTokenId&&t.id!==onlyTokenId))continue;const meters=tokenRadius(m,t,darkvisionOf?darkvisionOf(t.refId):0,effectiveLight(s,m));if(!(meters>0))continue;
  const r=Math.max(5,Math.min(1000,Math.round(meters*unit)));
  // Murs : polygone de visibilité (les zones déjà vues restent visibles).
  const poly=(m.walls||[]).length?visibilityPolygon(t.x,t.y,r,m.walls,Number(m.aspect)||1):null;
  if(poly){const near=Math.max(2,Math.round(unit*0.4));if(f.revealed.some(e=>e[0]==='p'&&Math.hypot(e[1]-t.x,e[2]-t.y)<=near&&e[3]===r&&e[4]===wallsKey(m)))continue;
   if(f.revealed.length>=MAX_VISION_REVEALS)bad('Trop de zones révélées sur cette carte : utilisez « Tout recouvrir » ou désactivez la vision.');
   f.revealed.push(['p',t.x,t.y,r,wallsKey(m),...poly.flat()]);n++;continue;}
  // Déjà entièrement révélé : rien à ajouter.
  if(f.revealed.some(e=>typeof e[0]==='number'&&Math.hypot(e[0]-t.x,e[1]-t.y)+r<=e[2]))continue;
  // Les anciens cercles contenus dans le nouveau deviennent inutiles.
  f.revealed=f.revealed.filter(e=>typeof e[0]!=='number'||Math.hypot(e[0]-t.x,e[1]-t.y)+e[2]>r);
  if(f.revealed.length>=MAX_VISION_REVEALS)bad('Trop de zones révélées sur cette carte : utilisez « Tout recouvrir » ou désactivez la vision.');
  f.revealed.push([t.x,t.y,r]);n++;}
 return n;}
const AREA_SHAPES=['circle','cone','line','cube'],AREA_COLORS=['or','rouge','bleu','vert','violet'],MAX_AREAS=30;
function areaAdd(s,mapId,id,v,by){const m=read(s,mapId);if(!m)bad('Carte introuvable.');if(!(m.grid&&m.grid.cells))bad('Ajoutez d’abord une grille à la carte pour placer une zone.');if(!Array.isArray(m.areas))m.areas=[];if(m.areas.length>=MAX_AREAS)bad('Maximum '+MAX_AREAS+' zones sur une carte : effacez-en.');
 const shape=AREA_SHAPES.includes(v?.shape)?v.shape:bad('Forme inconnue.');const size=Number(v?.size);if(!Number.isFinite(size)||size<1||size>150)bad('Taille : 1 à 150 m.');const angle=Number(v?.angle??0);if(!Number.isFinite(angle)||angle<-360||angle>360)bad('Orientation invalide.');
 const a={id,shape,size:Math.round(size*10)/10,x:checkPoint(v?.x),y:checkPoint(v?.y),angle:Math.round(angle),color:AREA_COLORS.includes(v?.color)?v.color:'rouge',label:text(String(v?.label??''),'Nom de la zone',40,false),by:String(by||'').slice(0,60)};m.areas.push(a);return a;}
function areaRemove(s,mapId,areaId){const m=read(s,mapId),i=m?.areas?.findIndex(a=>a.id===areaId);if(i==null||i<0)bad('Zone introuvable.');return m.areas.splice(i,1)[0];}
function areaClear(s,mapId){const m=read(s,mapId);if(!m)bad('Carte introuvable.');m.areas=[];return m;}
module.exports={isDay,effectiveLight,syncPcLights,hexToggle,hexFog,hexMove,imageSize,MAX_WALLS,wallAdd,wallRemove,wallClear,doorSet,visibilityPolygon,TRAP_REFS,TRAP_STATES,trapSet,LIGHTS,setVision,tokenLight,tokenRadius,visionReveal,scaleMeters,PLANNER_LINKS,AREA_SHAPES,MAX_AREAS,areaAdd,areaRemove,areaClear,MAX_TOKENS,TOKEN_COLORS,setGrid,setFog,tokenRead,tokenAdd,tokenMove,tokenSet,tokenRemove,MAX_MAPS,MAX_MARKERS,SYMBOLS,maps,read,canRead,projected,add,update,setMapVisibility,setMarkerVisibility,remove,markerRead,markerAdd,markerUpdate,markerRemove};
