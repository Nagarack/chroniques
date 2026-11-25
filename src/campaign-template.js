/* Chroniques — modèles de campagne : exporter la préparation d'une campagne (carnet, scènes, bestiaire et
   objets maison, rencontres, documents, marchands, cartes et repères, trésor du MJ) pour la réutiliser dans une
   autre campagne ou la partager avec un autre MJ. Jamais exportés : personnages, joueurs, journal de combat,
   notes partagées, chuchotements, historiques, médias des personnages.
   À l'import, chaque élément repasse par les validations habituelles et reçoit un nouvel identifiant. */
'use strict';
const C=require('./campaign-planner.js');
const F=require('./session-flow.js');
const E=require('./encounters.js');
const HB=require('./homebrew-items.js');
const SH=require('./shops.js');
const HO=require('./handouts.js');
const CM=require('./campaign-maps.js');
const I=require('./inventory.js');
const FORMAT='chroniques-modele-campagne',VERSION=1;
const MAX_IMAGE=2_800_000;
function fail(m){const e=new Error(m);e.status=400;throw e;}
const strip=(o,...keys)=>{const c={...o};for(const k of keys)delete c[k];return c;};
// ---------- Export ----------
function exportTemplate(state,{withMaps=true,readImage=()=>null,title}={}){
 const P=state.campaignPlanner||{},lib=state.gmLibrary||{};
 const planner={};for(const type of Object.keys(C.TYPES))planner[type]=(P[type]||[]).map(e=>({...e,...(Array.isArray(e.objectives)?{objectives:e.objectives.map(o=>({id:o.id,text:o.text,secret:!!o.secret}))}:{})}));
 const maps=withMaps?(state.maps||[]).map(m=>{const img=m.filename?readImage(m.filename):null;
  return {id:m.id,title:m.title,summary:m.summary||'',visibility:m.visibility,grid:m.grid||null,
   image:img&&img.length<=MAX_IMAGE?{mime:m.mime||'image/webp',base64:img.toString('base64')}:null,
   markers:(m.markers||[]).map(p=>({id:p.id,title:p.title,description:p.description||'',visibility:p.visibility,x:p.x,y:p.y,symbol:p.symbol,
    linked:p.linked&&['template','place','pnpc','quest'].includes(p.linked.kind)?{kind:p.linked.kind,id:p.linked.id}:null,
    builtin:p.image&&p.image.source==='builtin'?p.image.id:null}))};}):[];
 return {format:FORMAT,version:VERSION,exportedAt:new Date().toISOString(),title:String(title||state.title||'Campagne').slice(0,90),edition:state.edition||'',
  planner,scenes:(state.sessionFlow||[]).map(x=>({...x})),
  templates:(lib.templates||[]).map(t=>({...t})),encounters:(lib.encounters||[]).map(e=>({...e,groups:(e.groups||[]).map(g=>({...g}))})),items:(lib.items||[]).map(x=>({...x})),
  handouts:(state.handouts||[]).map(h=>({id:h.id,title:h.title,text:h.text})),
  shops:(state.shops||[]).map(s=>({...strip(s,'open'),items:(s.items||[]).map(i=>({...i}))})),
  loot:(state.lootStash||[]).map(x=>({...x})),maps};}
// ---------- Import ----------
// Nouvel identifiant pour chaque ancien, en gardant le préfixe (cp-, sc-, hb-, map-, pin-…).
function remapIds(data,random){const ids=new Set();const add=x=>{if(typeof x==='string'&&x.length>=4&&x.length<=110)ids.add(x);};
 for(const list of Object.values(data.planner||{}))for(const e of list||[]){add(e.id);for(const o of e.objectives||[])add(o.id);}
 for(const k of ['scenes','templates','encounters','items','handouts','shops','loot','maps'])for(const e of data[k]||[]){add(e.id);for(const g of e.groups||[])add(g.id);for(const i of k==='shops'?e.items||[]:[])add(i.id);for(const p of e.markers||[])add(p.id);}
 const map=new Map();for(const id of ids){const pre=(id.match(/^[a-z]{2,4}-/)||['x-'])[0];map.set(id,pre+random(12));}
 const walk=v=>Array.isArray(v)?v.map(walk):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,k==='base64'?x:walk(x)])):typeof v==='string'&&map.has(v)?map.get(v):v;
 return walk(data);}
function check(data){if(!data||typeof data!=='object'||data.format!==FORMAT)fail('Ce fichier n’est pas un modèle de campagne Chroniques.');if(data.version!==VERSION)fail('Version de modèle non prise en charge.');return data;}
function summary(data){const n=k=>(data[k]||[]).length;return {title:String(data.title||''),planner:Object.values(data.planner||{}).reduce((t,l)=>t+(l||[]).length,0),scenes:n('scenes'),templates:n('templates'),encounters:n('encounters'),items:n('items'),handouts:n('handouts'),shops:n('shops'),loot:n('loot'),maps:n('maps'),images:(data.maps||[]).filter(m=>m.image).length};}
function importTemplate(state,raw,{random,writeImage}){const data=remapIds(check(raw),random);const skipped=[];const count={};
 const tryIt=(label,fn)=>{try{fn();count[label]=(count[label]||0)+1;return true;}catch(e){skipped.push(label+' : '+e.message);return false;}};
 for(const t of data.templates||[])tryIt('Modèles de monstres',()=>E.addTemplate(state,t.id,strip(t,'id','icon'),t.icon));
 for(const x of data.items||[])tryIt('Objets maison',()=>HB.add(state,x.id,strip(x,'id')));
 for(const e of data.encounters||[])tryIt('Rencontres',()=>{E.addEncounter(state,e.id,e.name,e.notes||'');for(const g of e.groups||[])try{E.addGroup(state,e.id,g.id,g.templateId,g.quantity);}catch(err){skipped.push('Groupe de « '+e.name+' » : '+err.message);}});
 for(const [type,list] of Object.entries(data.planner||{})){if(!Object.hasOwn(C.TYPES,type))continue;for(const e of list||[])tryIt('Carnet',()=>{C.add(state,type,e.id,strip(e,'id','objectives'));for(const o of e.objectives||[])C.objectiveAdd(state,e.id,o.id,{text:o.text,secret:o.secret===true});});}
 for(const sc of data.scenes||[])tryIt('Scènes',()=>F.add(state,sc.id,{title:sc.title,summary:sc.summary||'',gmNotes:sc.gmNotes||'',status:sc.status||'planned',visibility:sc.visibility||'private',links:sc.links||[]}));
 for(const h of data.handouts||[])tryIt('Documents',()=>HO.add(state,h.id,{title:h.title,text:h.text||''}));
 for(const s of data.shops||[])tryIt('Marchands',()=>{SH.add(state,s.id,strip(s,'id','items','open'));for(const i of s.items||[])try{SH.itemAdd(state,s.id,i.id,strip(i,'id'));}catch(err){skipped.push('Article de « '+s.name+' » : '+err.message);}});
 for(const x of data.loot||[])tryIt('Trésor du MJ',()=>I.lootAdd(state,x.id,strip(x,'id')));
 for(const m of data.maps||[])tryIt('Cartes',()=>{CM.add(state,m.id,{title:m.title,summary:m.summary||'',visibility:m.visibility==='shared'?'shared':'private'});
  if(m.grid)try{CM.setGrid(state,m.id,m.grid);}catch{}
  if(m.image&&typeof m.image.base64==='string'&&m.image.base64.length<=MAX_IMAGE*4/3+4){const buf=Buffer.from(m.image.base64,'base64');const saved=writeImage(buf,m.image.mime);if(saved){const map=CM.read(state,m.id);map.filename=saved.filename;map.mime=saved.mime;}else skipped.push('Image de « '+m.title+' » : format refusé.');}
  for(const p of m.markers||[])try{CM.markerAdd(state,m.id,p.id,{title:p.title,description:p.description||'',visibility:p.visibility==='shared'?'shared':'private',x:p.x,y:p.y,symbol:p.symbol||'point',...(p.linked?{linkKind:p.linked.kind,linkId:p.linked.id}:{}),...(p.builtin?{imageChoice:'builtin:'+p.builtin}:{})});}catch(err){skipped.push('Repère « '+p.title+' » : '+err.message);}});
 return {count,skipped};}
module.exports={FORMAT,VERSION,exportTemplate,importTemplate,check,summary,remapIds};
