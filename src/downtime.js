/* Chroniques — intermèdes (5.3) : activités entre deux aventures (artisanat, formation, profession, recherches, récupération).
   Le MJ accorde des jours d’intermède au groupe ; chaque joueur les consacre à ses activités, dans l’ordre qu’il veut
   (les journées n’ont pas besoin d’être consécutives). Coûts et durées : repères du SRD 5.1 (règles 2014), modifiables.
   Aucun dé n’est lancé : les tests éventuels se font avec de vrais dés, à la table. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesDowntime=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAX_ACT=20,MAX_DAYS=3650,MAX_BANK=3650;
// Repères du SRD 5.1. `days`/`perDay` : valeurs proposées ; `hint` : rappel affiché.
const KINDS={
 artisanat:{label:'Artisanat',icon:'⚒',hint:'Par journée : 5 po de valeur marchande fabriquée ; matières premières = moitié de la valeur. Maîtrise des outils requise. Plusieurs personnages peuvent coopérer.'},
 formation:{label:'Formation (langue ou outils)',icon:'✎',days:250,perDay:1,hint:'250 jours à 1 po par jour, avec un instructeur. À la fin : la langue ou la maîtrise d’outils est acquise (à ajouter sur la fiche).'},
 profession:{label:'Exercer une profession',icon:'⚖',days:7,perDay:0,hint:'Couvre un train de vie modeste (confortable avec une organisation, riche avec Représentation).'},
 recherche:{label:'Mener des recherches',icon:'⌕',days:5,perDay:1,hint:'Le MJ fixe la durée et les tests éventuels. 1 po par jour en plus du train de vie.'},
 recuperation:{label:'Récupérer',icon:'✚',days:3,perDay:0,hint:'Après 3 jours : sauvegarde de Constitution DD 15 (vrai dé) pour mettre fin à un effet ou gagner l’avantage contre une maladie ou un poison.'},
 autre:{label:'Autre activité',icon:'✦',days:7,perDay:0,hint:'Activité libre, à convenir avec le MJ.'}};
function fail(m){const e=new Error(m);e.status=400;throw e;}
const clean=(v,label,max,req)=>{const t=String(v??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim();if(req&&!t)fail(label+' obligatoire.');if(t.length>max)fail(label+' : '+max+' caractères maximum.');return t;};
const int=(v,label,min,max)=>{const n=Number(v);if(!Number.isInteger(n)||n<min||n>max)fail(label+' : nombre entier de '+min+' à '+max+'.');return n;};
const money=(v,label)=>{const n=Number(v||0);if(!Number.isFinite(n)||n<0||n>1e6)fail(label+' invalide.');return Math.round(n*100)/100;};
function get(s){if(!s.downtime||typeof s.downtime!=='object')s.downtime={};const d=s.downtime;if(!Array.isArray(d.activities))d.activities=[];if(!d.bank||typeof d.bank!=='object')d.bank={};return d;}
// Artisanat : jours = valeur / (5 po × artisans), coût = moitié de la valeur.
function crafting(value,helpers){const v=money(value,'Valeur');const n=Math.max(1,Math.min(10,Math.floor(Number(helpers)||1)));return {days:Math.max(1,Math.ceil(v/(5*n))),cost:Math.round(v/2*100)/100};}
function suggest(kind,o={}){const k=KINDS[kind];if(!k)fail('Activité inconnue.');if(kind==='artisanat')return crafting(o.value||5,o.helpers);const days=Math.max(1,Math.floor(Number(o.days)||k.days));return {days,cost:days*(k.perDay||0)};}
function build(v,old){const kind=Object.hasOwn(KINDS,v?.kind)?v.kind:(old?.kind||fail('Activité inconnue.'));
 return {kind,title:clean(v?.title,'Intitulé',80,true),daysTotal:int(v?.daysTotal,'Durée (jours)',1,MAX_DAYS),costGp:money(v?.costGp,'Coût'),notes:clean(v?.notes,'Notes',500)};}
function add(s,id,pcId,v){const d=get(s);if(d.activities.filter(a=>a.pcId===pcId&&!a.done).length>=MAX_ACT)fail(MAX_ACT+' activités en cours au maximum par personnage.');const a={id,pcId,...build(v),daysDone:0,done:false,createdAt:new Date().toISOString()};d.activities.push(a);return a;}
function find(s,id){const a=get(s).activities.find(x=>x.id===id);if(!a)fail('Activité introuvable.');return a;}
function update(s,id,v){const a=find(s,id);Object.assign(a,build(v,a));a.daysDone=Math.min(a.daysDone,a.daysTotal);a.done=a.daysDone>=a.daysTotal;return a;}
function remove(s,id){const d=get(s);const i=d.activities.findIndex(x=>x.id===id);if(i<0)fail('Activité introuvable.');return d.activities.splice(i,1)[0];}
function bank(s,pcId){return Math.max(0,Math.floor(Number(get(s).bank[pcId])||0));}
function grant(s,pcIds,days){const n=int(days,'Jours d’intermède',1,365);const d=get(s);for(const id of pcIds)d.bank[id]=Math.min(MAX_BANK,bank(s,id)+n);return n;}
// Consacrer des jours (pris sur la réserve du personnage) à une activité. Renvoie {used, finished}.
function spend(s,id,days){const a=find(s,id);if(a.done)fail('Activité déjà terminée.');const n=int(days,'Jours',1,MAX_DAYS);const have=bank(s,a.pcId);
 if(have<1)fail('Aucun jour d’intermède disponible : le MJ en accorde depuis la Séance du jour.');const used=Math.min(n,have,a.daysTotal-a.daysDone);
 a.daysDone+=used;get(s).bank[a.pcId]=have-used;const finished=a.daysDone>=a.daysTotal;if(finished){a.done=true;a.doneAt=new Date().toISOString();}return {used,finished,activity:a};}
// Joueur : seulement son personnage.
function projected(s,pcId){const d=s.downtime;if(!d)return undefined;return {activities:(d.activities||[]).filter(a=>a.pcId===pcId).map(a=>({...a})),bank:pcId&&d.bank?{[pcId]:d.bank[pcId]||0}:{}};}
function cleanup(s){const d=s.downtime;if(!d)return;const ids=new Set((s.characters||[]).map(p=>p.id));d.activities=(d.activities||[]).filter(a=>ids.has(a.pcId));for(const k of Object.keys(d.bank||{}))if(!ids.has(k))delete d.bank[k];}
// ---------- Affichage ----------
function bar(a){const pct=Math.round(a.daysDone/Math.max(1,a.daysTotal)*100);return `<div class="dt-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${a.daysTotal}" aria-valuenow="${a.daysDone}" aria-label="Progression"><i style="width:${pct}%"></i></div>`;}
function form(h,pcId,a){const {esc,attr}=h;const v=a||{kind:'artisanat',title:'',daysTotal:1,costGp:0,notes:''};
 return `<form class="dt-form" data-pc="${attr(pcId)}" ${a?`data-dt-id="${attr(a.id)}"`:''}><div class="two-fields"><label>Activité<select name="kind" data-dt-kind>${Object.entries(KINDS).map(([k,x])=>`<option value="${k}" ${v.kind===k?'selected':''}>${esc(x.label)}</option>`).join('')}</select></label><label>Intitulé<input name="title" maxlength="80" required value="${attr(v.title)}" placeholder="Ex. Forger une épée longue"></label></div>
 <div class="dt-craft" ${v.kind==='artisanat'?'':'hidden'}><div class="two-fields"><label>Valeur marchande de l’objet (po)<input name="value" type="number" min="0" step="0.1" inputmode="decimal" placeholder="Ex. 15"></label><label>Artisans qui coopèrent<input name="helpers" type="number" min="1" max="10" value="1"></label></div><button type="button" class="text-button" data-dt-suggest="1">Calculer durée et coût (SRD 5.1)</button></div>
 <div class="two-fields"><label>Durée (jours)<input name="daysTotal" type="number" min="1" max="${MAX_DAYS}" required value="${v.daysTotal}"></label><label>Coût total (po)<input name="costGp" type="number" min="0" step="0.1" value="${v.costGp}"></label></div>
 <p class="muted small dt-hint">${esc(KINDS[v.kind].hint)}</p>
 <label>Notes<textarea name="notes" rows="2" maxlength="500">${esc(v.notes||'')}</textarea></label>
 <div class="btn-group"><button class="btn btn-primary" type="submit">${a?'Enregistrer':'＋ Ajouter l’activité'}</button>${a?'<button type="button" class="btn btn-secondary" data-dt-cancel="1">Annuler</button>':''}</div></form>`;}
function item(h,a,{edit,editing,pcBank}){const {esc,attr}=h;const k=KINDS[a.kind]||KINDS.autre;if(editing)return `<article class="dt-item editing">${form(h,a.pcId,a)}</article>`;
 return `<article class="dt-item ${a.done?'done':''}"><div class="dt-top"><strong><span aria-hidden="true">${k.icon}</span> ${esc(a.title)}</strong><span class="mini-pill">${esc(k.label)}</span></div>${bar(a)}
 <p class="small"><span>${a.daysDone} / ${a.daysTotal} jours</span>${a.costGp?` <span>· coût total ${a.costGp} po</span>`:''}${a.done?' · <strong>terminée</strong>':''}</p>${a.notes?`<p class="muted small">${esc(a.notes)}</p>`:''}
 ${edit?`<div class="btn-group">${!a.done&&pcBank>0?`<form class="dt-spend" data-dt-id="${attr(a.id)}"><label>Jours<input name="days" type="number" min="1" max="${Math.min(pcBank,a.daysTotal-a.daysDone)}" value="${Math.min(pcBank,a.daysTotal-a.daysDone)}" aria-label="Jours à consacrer à ${attr(a.title)}"></label><button class="btn btn-secondary" type="submit">Consacrer</button></form>`:''}<button type="button" class="text-button" data-dt-edit="${attr(a.id)}">Modifier</button><button type="button" class="text-button" data-dt-remove="${attr(a.id)}">Supprimer</button></div>`:''}</article>`;}
// Panneau de la fiche (Progression & règles).
function sheetPanel({state,pc,edit,h,editId=''}){const {esc}=h;const d=state.downtime||{};const list=(d.activities||[]).filter(a=>a.pcId===pc.id);const b=Math.max(0,Number((d.bank||{})[pc.id])||0);
 const active=list.filter(a=>!a.done),done=list.filter(a=>a.done);
 return `<section class="panel dt-panel"><div class="panel-top"><h3>Intermèdes</h3><span class="mini-pill">${b} jour${b>1?'s':''} disponible${b>1?'s':''}</span></div>
 <p class="muted small">Entre deux aventures, le MJ accorde des jours d’intermède. Consacrez-les à vos activités : les journées n’ont pas besoin d’être consécutives.</p>
 ${active.length?`<div class="dt-list">${active.map(a=>item(h,a,{edit,editing:editId===a.id,pcBank:b})).join('')}</div>`:'<p class="muted small">Aucune activité en cours.</p>'}
 ${done.length?`<details class="dt-done"><summary>Terminées (${done.length})</summary><div class="dt-list">${done.map(a=>item(h,a,{edit,editing:editId===a.id,pcBank:0})).join('')}</div></details>`:''}
 ${edit?`<details class="dt-add" ${list.length?'':'open'}><summary>＋ Nouvelle activité</summary>${editId?'':form(h,pc.id,null)}</details>`:''}</section>`;}
// Panneau du MJ (Séance du jour) : accorder des jours, voir l’avancement de tout le groupe.
function gmPanel({state,h}){const {esc,attr}=h;const d=state.downtime||{};const pcs=state.characters||[];
 return `<section class="panel dt-gm" id="dt-gm"><div class="panel-top"><h3>Intermèdes du groupe</h3></div>
 <form class="dt-grant"><label>Jours d’intermède à accorder<input name="days" type="number" min="1" max="365" value="7" required></label>${state.worldTime?.enabled?'<label class="check"><input type="checkbox" name="world" checked> Avancer aussi la date du monde</label>':''}<button class="btn btn-secondary" type="submit">Accorder à tout le groupe</button></form>
 ${pcs.length?`<div class="dt-gm-list">${pcs.map(p=>{const acts=(d.activities||[]).filter(a=>a.pcId===p.id&&!a.done);const b=Math.max(0,Number((d.bank||{})[p.id])||0);
  return `<div class="dt-gm-row"><strong>${esc(p.name)}</strong> <span class="mini-pill">${b} j disponibles</span>${acts.length?`<ul>${acts.map(a=>`<li>${esc(a.title)} · ${a.daysDone}/${a.daysTotal} j</li>`).join('')}</ul>`:'<span class="muted small"> · aucune activité</span>'} <button type="button" class="text-button" data-char="${attr(p.id)}" data-dt-open="1">Fiche</button></div>`;}).join('')}</div>`:''}</section>`;}
return {KINDS,MAX_DAYS,get,add,update,remove,grant,spend,bank,suggest,crafting,projected,cleanup,sheetPanel,gmPanel};
});
