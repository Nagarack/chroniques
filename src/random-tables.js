/* Chroniques — tables aléatoires à dés physiques (5.1).
   Le MJ écrit ses tables (rencontres, butin, rumeurs, météo…), lance son vrai dé et saisit le total :
   Chroniques affiche la ligne correspondante. Aucun tirage n'est fait par l'outil.
   Format des lignes, une par ligne :
     « 1-3 : Trois gobelins »   « 4 : Un marchand »   « 00 : … » (100 au d100)
   ou simplement « Trois gobelins » : les lignes sans nombre reçoivent les valeurs suivantes (1, 2, 3…). */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesTables=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAX_TABLES=60,MAX_ROWS=120,MAX_HISTORY=8;
const DICE=['d4','d6','d8','d10','d12','d20','d100','2d4','2d6','3d6','2d8','2d10','2d12','2d20'];
function fail(m){const e=new Error(m);e.status=400;throw e;}
const clean=(v,label,max,req)=>{const t=String(v??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim();if(req&&!t)fail(label+' obligatoire.');if(t.length>max)fail(label+' : '+max+' caractères maximum.');return t;};
// Plage possible d'un dé : « 2d6 » → 2 à 12.
function range(die){const m=/^(\d)?d(\d+)$/.exec(String(die||''));if(!m||!DICE.includes(die))fail('Dé inconnu.');const n=Number(m[1]||1),f=Number(m[2]);return {min:n,max:n*f};}
// Analyse le texte des lignes. Renvoie {rows, warnings}.
function parseRows(text,die){const {min,max}=range(die);const rows=[];const warnings=[];let next=min;
 const lines=String(text||'').split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
 if(lines.length>MAX_ROWS)fail(MAX_ROWS+' lignes au maximum.');
 for(const line of lines){const m=/^(\d{1,3})(?:\s*(?:-|–|—|à|a)\s*(\d{1,3}))?\s*(?:[:.)|]|-|–|—)\s*(.+)$/.exec(line);
  let lo,hi,txt;
  if(m){lo=m[1]==='00'?100:Number(m[1]);hi=m[2]!==undefined?(m[2]==='00'?100:Number(m[2])):lo;txt=m[3];}
  else{lo=hi=next;txt=line;}
  if(hi<lo)[lo,hi]=[hi,lo];
  txt=clean(txt,'Résultat',400,true);
  if(lo<min||hi>max)warnings.push(`« ${lo===hi?lo:lo+'-'+hi} » sort des valeurs du ${die} (${min} à ${max}).`);
  rows.push({min:lo,max:hi,text:txt});next=hi+1;}
 if(!rows.length)fail('Ajoutez au moins une ligne.');
 // Trous et chevauchements : signalés, pas bloquants.
 const seen=new Map();for(let v=min;v<=max;v++){const hits=rows.filter(r=>v>=r.min&&v<=r.max).length;seen.set(v,hits);}
 const gaps=[...seen].filter(([,n])=>n===0).map(([v])=>v),dup=[...seen].filter(([,n])=>n>1).map(([v])=>v);
 if(gaps.length)warnings.push('Sans résultat : '+compact(gaps)+'.');
 if(dup.length)warnings.push('Plusieurs résultats pour : '+compact(dup)+' (la première ligne compte).');
 return {rows,warnings};}
function compact(list){const out=[];for(let i=0;i<list.length;i++){let j=i;while(j+1<list.length&&list[j+1]===list[j]+1)j++;out.push(i===j?String(list[i]):list[i]+'-'+list[j]);i=j;}return out.slice(0,12).join(', ')+(out.length>12?'…':'');}
function rowsText(t){return (t.rows||[]).map(r=>(r.min===r.max?r.min:r.min+'-'+r.max)+' : '+r.text).join('\n');}
function list(s){if(!Array.isArray(s.randomTables))s.randomTables=[];return s.randomTables;}
function find(s,id){return list(s).find(t=>t.id===id)||null;}
function build(v){const die=String(v?.die||'d20');range(die);const {rows,warnings}=parseRows(v?.rows,die);
 return {t:{name:clean(v?.name,'Nom',80,true),die,category:clean(v?.category,'Catégorie',40),rows,visibility:v?.visibility==='shared'?'shared':'private',notes:clean(v?.notes,'Note',300)},warnings};}
function add(s,id,v){const l=list(s);if(l.length>=MAX_TABLES)fail(MAX_TABLES+' tables au maximum.');const {t,warnings}=build(v);const table={id,...t,history:[]};l.push(table);return {table,warnings};}
function update(s,id,v){const t=find(s,id);if(!t)fail('Table introuvable.');const b=build(v);Object.assign(t,b.t);return {table:t,warnings:b.warnings};}
function remove(s,id){const l=list(s);const n=l.length;s.randomTables=l.filter(t=>t.id!==id);if(n===s.randomTables.length)fail('Table introuvable.');}
function lookup(t,total){return (t.rows||[]).find(r=>total>=r.min&&total<=r.max)||null;}
// Le MJ saisit le total de son dé physique.
function roll(s,id,total,shared){const t=find(s,id);if(!t)fail('Table introuvable.');const n=Number(total);const {min,max}=range(t.die);
 if(!Number.isInteger(n)||n<min||n>max)fail(`Total invalide pour un ${t.die} : entre ${min} et ${max}.`);
 const row=lookup(t,n);const entry={total:n,text:row?row.text:'',at:new Date().toISOString(),shared:shared===true};
 t.history=[entry,...(t.history||[])].slice(0,MAX_HISTORY);return {table:t,row,entry};}
// Joueurs : seulement les tables publiées, et seulement les tirages annoncés à la table.
function projected(s){return (s.randomTables||[]).filter(t=>t.visibility==='shared').map(t=>({id:t.id,name:t.name,die:t.die,category:t.category,rows:t.rows,visibility:'shared',history:(t.history||[]).filter(h=>h.shared)}));}
// ---------- Affichage ----------
function panel({state,isGM,h,openId=''}){const {esc,attr}=h;const tables=state.randomTables||[];
 if(!isGM&&!tables.length)return '';
 const cats=[...new Set(tables.map(t=>t.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fr'));
 const card=t=>{const r=range(t.die);const last=(t.history||[])[0];
  return `<article class="rt-card" id="rt-${attr(t.id)}"><div class="panel-top"><h4>🎲 ${esc(t.name)} <small class="muted">${esc(t.die)}${t.category?' · '+esc(t.category):''}</small></h4>${isGM?`<span class="mini-pill">${t.visibility==='shared'?'Visible des joueurs':'Privée'}</span>`:''}</div>
  ${isGM?`<form class="rt-roll" data-table="${attr(t.id)}"><label>Total de votre ${esc(t.die)}<input name="total" type="number" inputmode="numeric" min="${r.min}" max="${r.max}" required></label><label class="check"><input type="checkbox" name="shared"> Annoncer aux joueurs</label><button class="btn btn-primary" type="submit">Lire le résultat</button></form>`:''}
  ${last?`<p class="rt-result" role="status"><b>${last.total}</b> → ${last.text?esc(last.text):'<i>aucune ligne pour ce total</i>'}</p>`:''}
  <details class="ux-fold" ${openId===t.id?'open':''}><summary>Voir la table (${t.rows.length} ligne${t.rows.length>1?'s':''}) <span aria-hidden="true">⌄</span></summary>
   <table class="rt-table"><thead><tr><th scope="col">${esc(t.die)}</th><th scope="col">Résultat</th></tr></thead><tbody>${t.rows.map(x=>`<tr><td>${x.min===x.max?x.min:x.min+'–'+x.max}</td><td>${esc(x.text)}</td></tr>`).join('')}</tbody></table>
   ${(t.history||[]).length>1?`<p class="muted small">Derniers totaux : ${(t.history||[]).map(x=>x.total).join(', ')}</p>`:''}
   ${isGM?`${t.notes?`<p class="muted small">${esc(t.notes)}</p>`:''}<details class="ux-fold"><summary>Modifier <span aria-hidden="true">⌄</span></summary>${form(t,h)}</details><button type="button" class="text-button danger" data-table-remove="${attr(t.id)}">Supprimer la table</button>`:''}
  </details></article>`;};
 const groups=cats.length?[...cats.map(c=>[c,tables.filter(t=>t.category===c)]),['',tables.filter(t=>!t.category)]].filter(([,l])=>l.length):[['',tables]];
 return `<section class="panel rt-panel" aria-labelledby="rt-title"><div class="panel-top"><h3 id="rt-title">🎲 Tables aléatoires</h3><span class="mini-pill">${tables.length}</span></div>
 <p class="muted small">${isGM?'Lancez votre vrai dé, saisissez le total : Chroniques lit la ligne. Aucun tirage n’est fait par l’outil.':'Tables partagées par le MJ et résultats annoncés.'}</p>
 ${tables.length?groups.map(([c,l])=>`${c?`<h4 class="rt-cat">${esc(c)}</h4>`:''}<div class="rt-grid">${l.map(card).join('')}</div>`).join(''):'<p class="muted">Aucune table pour le moment.</p>'}
 ${isGM?`<details class="ux-fold" ${tables.length?'':'open'}><summary>＋ Nouvelle table <span aria-hidden="true">⌄</span></summary>${form(null,h)}</details>`:''}</section>`;}
function form(t,h){const {esc,attr}=h;const v=t||{die:'d20',name:'',category:'',visibility:'private',notes:'',rows:[]};
 return `<form class="rt-form" ${t?`data-table="${attr(t.id)}"`:''}><label>Nom<input name="name" maxlength="80" required value="${attr(v.name)}" placeholder="Ex. Rencontres sur la route"></label>
 <label>Dé<select name="die">${DICE.map(d=>`<option value="${d}" ${d===v.die?'selected':''}>${d}</option>`).join('')}</select></label>
 <label>Catégorie (facultatif)<input name="category" maxlength="40" value="${attr(v.category||'')}" placeholder="Ex. Voyage, Butin, Rumeurs"></label>
 <label class="rt-rows">Lignes, une par ligne<textarea name="rows" rows="8" required placeholder="1-3 : Trois gobelins embusqués&#10;4-5 : Un colporteur perdu&#10;6 : Rien, le vent se lève">${esc(t?rowsText(t):'')}</textarea></label>
 <p class="muted small">Écrivez « 1-3 : … » ou « 4 : … ». Sans nombre, chaque ligne prend la valeur suivante. Au d100, « 00 » vaut 100.</p>
 <label>Note pour le MJ (facultatif)<input name="notes" maxlength="300" value="${attr(v.notes||'')}"></label>
 <label class="check"><input type="checkbox" name="shared" ${v.visibility==='shared'?'checked':''}> Visible des joueurs</label>
 <button class="btn btn-primary" type="submit">${t?'Enregistrer':'Créer la table'}</button></form>`;}
return {DICE,MAX_TABLES,range,parseRows,rowsText,add,update,remove,roll,lookup,projected,panel,form};
});
