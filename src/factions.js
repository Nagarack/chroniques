/* Chroniques — réputation du groupe auprès des factions du carnet, relations entre PNJ récurrents et personnages (V5).
   Factions : fiches du carnet de campagne (section Factions) ; on y ajoute les membres (PNJ du carnet) et la
   réputation du groupe de −5 à +5. Relations : un PNJ du carnet ↔ un personnage, avec un type (allié, rival, dette…) et une note,
   éventuellement secrète. Les joueurs ne voient que ce qui est publié. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesFactions=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAX_REL=200;
const REL_KINDS={allie:'Allié',ami:'Ami',rival:'Rival',ennemi:'Ennemi',dette:'Le personnage lui doit',creance:'Il doit au personnage',famille:'Famille',amour:'Amour',mentor:'Mentor',protege:'Protégé',secret:'Secret partagé',autre:'Autre'};
function repLabel(n){return n<=-4?'Ennemis jurés':n<=-2?'Hostiles':n===-1?'Méfiants':n===0?'Neutres':n===1?'Bien vus':n<=3?'Alliés':'Honorés';}
function fail(m){const e=new Error(m);e.status=400;throw e;}
const txt=(v,label,max,req)=>{const t=String(v??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim();if(req&&!t)fail(label+' obligatoire.');if(t.length>max)fail(label+' : '+max+' caractères maximum.');return t;};
// La faction elle-même est une fiche du carnet de campagne (section « Factions ») ; on y ajoute la réputation
// du groupe et les membres (PNJ du carnet), stockés à part dans state.factionMeta.
function factionEntry(s,id){return ((s.campaignPlanner||{}).factions||[]).find(f=>f.id===id)||null;}
function meta(s,id){if(!s.factionMeta||typeof s.factionMeta!=='object')s.factionMeta={};return s.factionMeta[id]||(s.factionMeta[id]={reputation:0,members:[]});}
function rels(s){if(!Array.isArray(s.relations))s.relations=[];return s.relations;}
function npcIds(s){return new Set(((s.campaignPlanner||{}).npcs||[]).map(n=>n.id));}
function setMembers(s,id,members){if(!factionEntry(s,id))fail('Faction introuvable.');const ids=npcIds(s);const list=Array.isArray(members)?[...new Set(members.map(String))].slice(0,30):[];for(const m of list)if(!ids.has(m))fail('PNJ inconnu dans les membres.');meta(s,id).members=list;}
function reputation(s,id,delta){const f=factionEntry(s,id);if(!f)fail('Faction introuvable.');const d=Number(delta);if(!Number.isInteger(d)||d<-10||d>10||!d)fail('Variation invalide.');const m=meta(s,id);const before=m.reputation||0;m.reputation=Math.max(-5,Math.min(5,before+d));return {faction:{id,name:f.title,visibility:f.visibility},before,after:m.reputation};}
function relationAdd(s,id,v){const l=rels(s);if(l.length>=MAX_REL)fail('200 relations au maximum.');if(!npcIds(s).has(String(v?.npcId||'')))fail('PNJ introuvable dans le carnet.');if(!(s.characters||[]).some(p=>p.id===v?.pcId))fail('Personnage introuvable.');if(!REL_KINDS[v?.kind])fail('Type de relation inconnu.');
 const r={id,npcId:String(v.npcId),pcId:String(v.pcId),kind:v.kind,note:txt(v?.note,'Note',200),secret:v?.secret===true};l.push(r);return r;}
function relationRemove(s,id){const l=rels(s);const n=l.length;s.relations=l.filter(x=>x.id!==id);if(n===s.relations.length)fail('Relation introuvable.');}
// Projection joueurs : réputation des factions publiées, membres publiés ; relations non secrètes vers des PNJ publiés.
function projected(s){const shared=new Set(((s.campaignPlanner||{}).npcs||[]).filter(n=>n.visibility==='shared').map(n=>n.id));const pub=new Set(((s.campaignPlanner||{}).factions||[]).filter(f=>f.visibility==='shared').map(f=>f.id));
 const fm={};for(const [id,m] of Object.entries(s.factionMeta||{}))if(pub.has(id))fm[id]={reputation:m.reputation||0,members:(m.members||[]).filter(x=>shared.has(x))};
 return {factionMeta:fm,relations:(s.relations||[]).filter(r=>!r.secret&&shared.has(r.npcId)).map(({id,npcId,pcId,kind,note})=>({id,npcId,pcId,kind,note}))};}
// ---------- Affichage ----------
function repBar(n){const pct=(n+5)*10;return `<span class="rep-bar" role="img" aria-label="Réputation ${n>0?'+':''}${n} sur 5 : ${repLabel(n)}"><span style="left:${pct}%"></span></span>`;}
// Réputation et membres, affichés dans la fiche de la faction (carnet de campagne).
function factionExtras({state,entry,isGM,h}){const {esc,attr}=h;const m=(state.factionMeta||{})[entry.id]||{reputation:0,members:[]};const rep=m.reputation||0;const npcs=((state.campaignPlanner||{}).npcs||[]);const nName=id=>(npcs.find(n=>n.id===id)||{}).title||'';
 const members=(m.members||[]).map(nName).filter(Boolean);
 return `<div class="faction-extras"><p class="small"><b>Réputation du groupe :</b> <strong>${esc(repLabel(rep))}</strong> (${rep>0?'+':''}${rep}) ${repBar(rep)}</p>
 ${members.length?`<p class="small"><b>Membres connus :</b> ${members.map(esc).join(', ')}</p>`:''}
 ${isGM?`<form class="faction-rep" data-faction="${attr(entry.id)}"><label>Raison (facultatif)<input name="reason" maxlength="80" placeholder="Ex. Ont sauvé le fils du doyen"></label><button class="btn btn-secondary" type="submit" name="delta" value="-1" aria-label="Réputation moins un">− 1</button><button class="btn btn-secondary" type="submit" name="delta" value="1" aria-label="Réputation plus un">+ 1</button></form>
 ${npcs.length?`<details class="ux-fold"><summary>Membres (PNJ du carnet) <span aria-hidden="true">⌄</span></summary><form class="faction-members" data-faction="${attr(entry.id)}"><fieldset class="fa-members"><legend class="visually-hidden">Membres de ${attr(entry.title)}</legend>${npcs.map(n=>`<label class="check"><input type="checkbox" name="members" value="${attr(n.id)}" ${(m.members||[]).includes(n.id)?'checked':''}> ${esc(n.title)}</label>`).join('')}</fieldset><button class="btn btn-secondary" type="submit">Enregistrer les membres</button></form></details>`:''}`:''}</div>`;}
// Relations d'un PNJ (fiche du carnet) ou d'un personnage (fiche).
function relationList({state,npcId,pcId,isGM,h}){const {esc,attr}=h;const list=(state.relations||[]).filter(r=>(npcId?r.npcId===npcId:true)&&(pcId?r.pcId===pcId:true));
 const npc=id=>((state.campaignPlanner||{}).npcs||[]).find(n=>n.id===id),pc=id=>(state.characters||[]).find(p=>p.id===id);
 const items=list.map(r=>`<li>${npcId?esc(pc(r.pcId)?.name||'?'):esc(npc(r.npcId)?.title||'?')} — <strong>${esc(REL_KINDS[r.kind]||r.kind)}</strong>${r.note?' · '+esc(r.note):''}${r.secret?' <span class="tag secret-tag">🔒</span>':''}${isGM?` <button type="button" class="icon-btn" data-relation-remove="${attr(r.id)}" aria-label="Supprimer cette relation">✕</button>`:''}</li>`).join('');
 const form=isGM&&npcId?`<form class="relation-form" data-npc="${attr(npcId)}"><label>Personnage<select name="pcId">${(state.characters||[]).map(p=>`<option value="${attr(p.id)}">${esc(p.name)}</option>`).join('')}</select></label><label>Relation<select name="kind">${Object.entries(REL_KINDS).map(([k,v])=>`<option value="${k}">${esc(v)}</option>`).join('')}</select></label><label>Note<input name="note" maxlength="200" placeholder="Ex. Lui a sauvé la vie au col"></label><label class="check"><input type="checkbox" name="secret"> Secrète</label><button class="btn btn-secondary" type="submit">Ajouter</button></form>`:'';
 if(!items&&!form)return '';
 return `<div class="relations"><h5>↔ Relations</h5>${items?`<ul class="relation-list">${items}</ul>`:''}${form?`<details class="ux-fold"><summary>＋ Relation avec un personnage <span aria-hidden="true">⌄</span></summary>${form}</details>`:''}</div>`;}
return {REL_KINDS,repLabel,meta,setMembers,reputation,relationAdd,relationRemove,projected,factionExtras,relationList};
});
