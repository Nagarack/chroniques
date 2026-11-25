/* Chroniques — dégâts de zone sur plusieurs cibles (5.1).
   Une seule saisie : le total des dés physiques, le type de dégâts et, pour chaque cible, « sauvegarde ratée »
   ou « réussie » (lancée aux dés par chacun). Chroniques divise par deux en cas de réussite (ou annule, selon le sort),
   puis applique résistance (÷ 2, arrondi inférieur), vulnérabilité (× 2) ou immunité (0), comme le SRD 5.1.
   Sur la carte de combat, les jetons dont la case touche une zone posée sont proposés comme cibles. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesAreaDamage=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAX_TARGETS=40;
function fail(m){const e=new Error(m);e.status=400;throw e;}
function metersPerCell(map){const m=/([\d]+(?:[.,]\d+)?)/.exec(String(map?.grid?.scale||'1,5 m'));const v=m?Number(m[1].replace(',','.')):1.5;return v>0?v:1.5;}
// Jetons touchés par une zone. Coordonnées des jetons et des zones : 0 à 1000 en largeur et en hauteur de l'image ;
// `ratio` = largeur / hauteur de l'image. Une case touchée suffit : on élargit la zone d'une demi-case.
function tokensInArea(map,area,ratio){if(!map?.grid?.cells||!area)return [];const r=ratio>0?ratio:1;const cellU=1000/map.grid.cells,unit=metersPerCell(map)/cellU;const k=m=>m/unit;
 const L=k(area.size),half=cellU/2,t=(area.angle||0)*Math.PI/180,ux=Math.cos(t),uy=Math.sin(t),px=-uy,py=ux;const X=area.x,Y=area.y/r;
 return (map.tokens||[]).filter(tok=>{const dx=tok.x-X,dy=tok.y/r-Y;
  if(area.shape==='circle')return Math.hypot(dx,dy)<=L+half;
  if(area.shape==='cube')return Math.abs(dx)<=L/2+half&&Math.abs(dy)<=L/2+half;
  const along=dx*ux+dy*uy,perp=Math.abs(dx*px+dy*py);
  if(area.shape==='cone')return along>=-half&&along<=L+half&&perp<=Math.max(0,along)/2+half;
  return along>=-half&&along<=L+half&&perp<=k(1.5)/2+half;});}
function adjust(defenses,type,amount){const st=defenses&&type?defenses[type]:null;if(st==='immune')return {amount:0,state:st};if(st==='resist')return {amount:Math.floor(amount/2),state:st};if(st==='vuln')return {amount:amount*2,state:st};return {amount,state:null};}
// Combattants possibles : personnages et créatures du combat.
function combatants(state){const out=[];for(const p of state.characters||[])out.push({key:'pc:'+p.id,kind:'pc',id:p.id,name:p.name,hp:p.hp,defenses:p.defenses||{}});
 for(const n of state.combat?.npcs||[])out.push({key:'npc:'+n.id,kind:'npc',id:n.id,name:n.name+(n.hidden?' (masqué)':''),hp:n.hp,defenses:n.defenses||{}});return out;}
// Calcul des dégâts par cible (aperçu côté client et contrôle côté serveur).
function plan({amount,type,onSave,targets,lookup}){const a=Number(amount);if(!Number.isInteger(a)||a<0||a>10000)fail('Dégâts : un nombre entier de 0 à 10 000.');if(!['half','none'].includes(onSave))fail('Effet d’une sauvegarde réussie inconnu.');
 if(!Array.isArray(targets)||!targets.length)fail('Choisissez au moins une cible.');if(targets.length>MAX_TARGETS)fail(MAX_TARGETS+' cibles au maximum.');
 const seen=new Set();return targets.map(t=>{const key=t.kind+':'+t.id;if(seen.has(key))fail('Cible en double.');seen.add(key);const c=lookup(t.kind,t.id);if(!c)fail('Cible introuvable.');
  const base=t.saved===true?(onSave==='half'?Math.floor(a/2):0):a;const adj=adjust(c.defenses,type,base);return {kind:t.kind,id:t.id,name:c.name,saved:t.saved===true,base,amount:adj.amount,state:adj.state};});}
const DEF_LABEL={resist:'résistance',vuln:'vulnérabilité',immune:'immunité'};
function previewHtml(rows,h){const {esc}=h;if(!rows.length)return '<p class="muted small">Aucune cible cochée.</p>';
 return `<ul class="ad-preview">${rows.map(r=>`<li><b>${esc(r.name)}</b> : −${r.amount}${r.saved?' (réussie)':''}${r.state?` <small class="muted">${DEF_LABEL[r.state]} : ${r.base} → ${r.amount}</small>`:''}</li>`).join('')}</ul>`;}
// Fenêtre : `preset` = clés « pc:… / npc:… » déjà cochées (zone de la carte), `label` = nom de la zone.
function modalHtml({state,h,preset=[],label='',types}){const {esc,attr}=h;const list=combatants(state);const pre=new Set(preset);
 const sorted=[...list.filter(c=>pre.has(c.key)),...list.filter(c=>!pre.has(c.key))];
 return `<div class="modal-backdrop"><div class="modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="ad-title"><div class="panel-top"><h2 id="ad-title">💥 Dégâts de zone</h2><button class="icon-close" data-task="close-modal" aria-label="Fermer">✕</button></div>
 <form id="area-dmg-form" class="ad-form"><div class="ad-head"><label>Sort ou effet (facultatif)<input name="label" maxlength="60" value="${attr(label)}" placeholder="Ex. Boule de feu"></label>
 <label>Total des dés<input name="amount" type="number" inputmode="numeric" min="0" max="10000" required></label>
 <label>Type<select name="type"><option value="">Sans type</option>${types.map(t=>`<option value="${attr(t)}">${esc(t)}</option>`).join('')}</select></label>
 <label>Sauvegarde réussie<select name="onSave"><option value="half">Moitié des dégâts</option><option value="none">Aucun dégât</option></select></label></div>
 <fieldset class="ad-targets"><legend>Cibles${pre.size?` <small class="muted">(${pre.size} dans la zone, déjà cochées)</small>`:''}</legend>
 ${sorted.length?sorted.map(c=>`<div class="ad-row"><label class="check"><input type="checkbox" name="pick" value="${attr(c.key)}" ${pre.has(c.key)?'checked':''}> ${esc(c.name)}</label><select name="save:${attr(c.key)}" aria-label="Sauvegarde de ${attr(c.name)}"><option value="fail">Ratée / pas de jet</option><option value="ok">Réussie</option></select></div>`).join(''):'<p class="muted">Aucun personnage ni créature.</p>'}</fieldset>
 <div id="area-dmg-preview" aria-live="polite"></div>
 <p class="muted small">Chaque joueur lance sa sauvegarde avec ses dés ; vous indiquez seulement le résultat. Résistances, vulnérabilités et immunités des fiches sont appliquées automatiquement.</p>
 <div class="btn-group"><button class="btn btn-primary" type="submit">Appliquer les dégâts</button><button class="btn btn-secondary" type="button" data-task="close-modal">Annuler</button></div></form></div></div>`;}
// Lecture du formulaire (client).
function readForm(form){const fd=new FormData(form);const picks=fd.getAll('pick').map(String);
 return {label:String(fd.get('label')||'').trim().slice(0,60),amount:Number(fd.get('amount')),type:String(fd.get('type')||''),onSave:String(fd.get('onSave')||'half'),
  targets:picks.map(k=>{const i=k.indexOf(':');return {kind:k.slice(0,i),id:k.slice(i+1),saved:fd.get('save:'+k)==='ok'};})};}
return {MAX_TARGETS,metersPerCell,tokensInArea,adjust,combatants,plan,previewHtml,modalHtml,readForm};
});
