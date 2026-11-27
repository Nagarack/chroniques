/* Chroniques — vues de la V4.9 autour du groupe : vue d'ensemble pour le MJ (sauvegardes, scores passifs,
   DD des sorts), historique de chaque personnage, coffre commun. Fonctions pures qui renvoient du HTML. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesParty=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const req=(g,f)=>(root&&root[g])||(typeof require==='function'?(()=>{try{return require(f);}catch{return null;}})():null);
const P=req('ChroniquesProgression','./progression.js');
const CG=req('ChroniquesClassGuide','./class-guide.js');
const KEYS=['str','dex','con','int','wis','cha'];
const SHORT={str:'FOR',dex:'DEX',con:'CON',int:'INT',wis:'SAG',cha:'CHA'};
const SPELL_ABILITY={bard:'cha',cleric:'wis',druid:'wis',paladin:'cha',ranger:'wis',sorcerer:'cha',warlock:'cha',wizard:'int'};
const mod=v=>Number.isInteger(v)?Math.floor((v-10)/2):null;
const sign=v=>v==null?'—':(v>=0?'+':'')+v;
const prof=l=>Number.isInteger(l)&&l>=1?2+Math.floor((Math.min(20,l)-1)/4):null;
function classOf(pc){return pc.progression?.classId||(P&&P.detectClass?P.detectClass(pc.job):'')||'';}
// Valeurs calculées pour un personnage (null si la fiche ne contient pas les caractéristiques).
function row(pc){const ab=pc.stats?.abilities||{};const pb=prof(pc.level);const cls=classOf(pc);const info=CG&&CG.CLASS?CG.CLASS[cls]:null;
 const saves={};for(const k of KEYS){const m=mod(ab[k]);const p=!!(info&&info.saves.includes(k));saves[k]={value:m==null?null:m+(p&&pb?pb:0),prof:p};}
 const passive=id=>{const v=P&&P.skillValue?P.skillValue(pc,id):null;return v==null?null:10+v;};
 const sa=SPELL_ABILITY[cls];const dc=sa&&mod(ab[sa])!=null&&pb?8+pb+mod(ab[sa]):null;
 return {id:pc.id,name:pc.name,cls,level:pc.level,ac:pc.stats?.ac,hp:pc.hp,hpMax:pc.stats?.hp,tempHp:pc.tempHp||0,speed:pc.speed,
  perception:passive('perception')??(Number.isInteger(pc.stats?.passive)?pc.stats.passive:null),investigation:passive('investigation'),insight:passive('intuition'),
  saves,spellDc:dc,spellAbility:sa||'',conditions:pc.conditions||[],concentration:pc.concentration||'',exhaustion:pc.exhaustion||0,inspiration:!!pc.inspiration,mc:P&&P.isMulticlass&&P.isMulticlass(pc)?P.classLabel(pc):''};}
function rows(state){return (state.characters||[]).filter(p=>!p.fallen).map(row);}
function partyView({state,h}){const {esc,attr}=h;const list=rows(state);if(!list.length)return '<p class="empty">Aucun personnage.</p>';
 const best=k=>{const v=list.map(r=>r[k]).filter(x=>x!=null);return v.length?Math.max(...v):null;};
 const top={perception:best('perception'),investigation:best('investigation'),insight:best('insight')};
 const cell=(v,k)=>`<td class="${v!=null&&v===top[k]?'party-best':''}">${v??'—'}</td>`;
 return `<p class="muted small">Calculé depuis les fiches : caractéristiques, niveau et classe (maîtrises de sauvegarde de la classe de départ). Les dons, objets ou multiclasses ne sont pas pris en compte : vérifiez les cas particuliers. ★ = maîtrise.</p>
 <div class="party-table-wrap" tabindex="0" role="region" aria-label="Tableau du groupe (défilement horizontal possible)"><table class="party-table">
 <caption class="visually-hidden">Défenses, scores passifs et sauvegardes du groupe</caption>
 <thead><tr><th scope="col">Personnage</th><th scope="col">CA</th><th scope="col">PV</th><th scope="col" title="Perception passive">Perc.</th><th scope="col" title="Investigation passive">Invest.</th><th scope="col" title="Intuition passive">Intuit.</th>${KEYS.map(k=>`<th scope="col" title="Sauvegarde">${SHORT[k]}</th>`).join('')}<th scope="col">DD sorts</th><th scope="col">Vit.</th><th scope="col">États</th><th scope="col"><span class="visually-hidden">Historique</span></th></tr></thead>
 <tbody>${list.map(r=>`<tr><th scope="row">${esc(r.name)}<small>${r.mc?esc(r.mc)+' · ':''}niv. ${r.level}${r.saves.str.value==null&&r.saves.dex.value==null?' · caractéristiques à saisir':''}</small></th><td>${r.ac??'—'}</td><td class="${r.hp*2<=r.hpMax?'party-low':''}">${r.hp}/${r.hpMax}${r.tempHp?` <small>+${r.tempHp}</small>`:''}</td>${cell(r.perception,'perception')}${cell(r.investigation,'investigation')}${cell(r.insight,'insight')}
 ${KEYS.map(k=>`<td>${sign(r.saves[k].value)}${r.saves[k].prof&&r.saves[k].value!=null?'<span class="party-prof" title="Maîtrise">★</span>':''}</td>`).join('')}<td>${r.spellDc?r.spellDc+` <small>${SHORT[r.spellAbility]}</small>`:'—'}</td><td>${r.speed??'—'} m</td>
 <td>${[...r.conditions,r.concentration?'Conc. : '+r.concentration:'',r.exhaustion?'Épuis. '+r.exhaustion:'',r.inspiration?'Inspiration':''].filter(Boolean).map(c=>`<span class="tag">${esc(c)}</span>`).join(' ')||'<span class="muted">—</span>'}</td>
 <td><button type="button" class="text-button" data-party-history="${attr(r.id)}" aria-label="Historique de ${attr(r.name)}">Historique</button></td></tr>`).join('')}</tbody></table></div>`;}
// ---------- Historique ----------
const CATS=[['all','Tout'],['progress','Progression'],['items','Objets & argent'],['fights','Combats'],['story','Quêtes & documents'],['notes','Notes du MJ']];
function category(e){if(e.manual)return 'notes';const t=e.text||'';
 if(/XP|niveau|Apprend|S’harmonise/.test(t)&&!/^Épuisement/.test(t))return /S’harmonise/.test(t)?'items':'progress';
 if(/^(Achète|Reçoit de|Reçoit du MJ|Donne|Ne possède|Obtient|Gagne .* po|Dépense|Dépose|Prend dans|Bourse)/.test(t))return 'items';
 if(/0 point de vie|conscience|Meurt|Combat|Épuisement/.test(t))return 'fights';
 if(/Quête|document|rejoint|Rejoint/.test(t))return 'story';return 'other';}
const day=iso=>{try{return new Date(iso).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'});}catch{return '';}};
const hm=iso=>{try{return new Date(iso).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});}catch{return '';}};
function historyPanel({pc,isGM,filter='all',query='',h}){const {esc,attr}=h;const all=(pc.history||[]).slice().reverse();
 const q=String(query||'').toLowerCase();const list=all.filter(e=>(filter==='all'||category(e)===filter)&&(!q||String(e.text).toLowerCase().includes(q)));
 const groups=[];for(const e of list){const key=typeof e.session==='string'?'Séance du '+day(e.session):day(e.at);const g=groups[groups.length-1];if(g&&g.key===key)g.items.push(e);else groups.push({key,items:[e]});}
 return `<section class="panel history-panel" aria-labelledby="hist-title-${attr(pc.id)}"><div class="panel-top"><h3 id="hist-title-${attr(pc.id)}">Historique de ${esc(pc.name)}</h3><span class="mini-pill">${all.length} entrée${all.length>1?'s':''}</span></div>
 <p class="muted small">${isGM?'Rempli automatiquement (niveaux, XP, objets, combats, quêtes, documents). Vos notes « secrètes » ne sont jamais envoyées au joueur.':'Le journal de votre personnage, tenu automatiquement. Le MJ peut y ajouter des notes.'}</p>
 ${isGM?`<form class="hist-note-form" data-pc="${attr(pc.id)}"><label for="hist-note-${attr(pc.id)}">Ajouter une note</label><textarea id="hist-note-${attr(pc.id)}" name="text" maxlength="300" rows="2" required placeholder="Ex. : A promis de retrouver la sœur du meunier."></textarea>
 <div class="hist-note-row"><label class="check"><input type="checkbox" name="secret" checked> Secrète (MJ seulement)</label><button class="btn btn-primary" type="submit">Ajouter</button></div></form>`:''}
 <div class="hist-filters" role="group" aria-label="Filtrer l’historique">${CATS.filter(([id])=>isGM||id!=='notes'||all.some(e=>e.manual)).map(([id,l])=>`<button type="button" class="chip ${filter===id?'selected':''}" aria-pressed="${filter===id}" data-hist-filter="${id}">${l}</button>`).join('')}
 <input type="search" class="hist-search" data-hist-search aria-label="Chercher dans l’historique" placeholder="Chercher…" value="${attr(query)}"></div>
 ${groups.length?groups.map(g=>`<h4 class="hist-day">${esc(g.key)}</h4><ol class="hist-list">${g.items.map(e=>`<li class="hist-entry hist-${category(e)} ${e.gm?'hist-secret':''}"><span class="hist-time">${esc(e.world||hm(e.at))}</span><span class="hist-text">${e.gm?'<span class="tag secret-tag">🔒 Secret</span> ':e.manual?'<span class="tag">Note du MJ</span> ':''}${esc(e.text)}</span>${isGM?`<button type="button" class="icon-btn hist-del" data-hist-del="${attr(pc.id)}|${attr(e.id)}" aria-label="Supprimer cette entrée">✕</button>`:''}</li>`).join('')}</ol>`).join(''):`<p class="empty">${all.length?'Aucune entrée pour ce filtre.':'Rien pour l’instant : l’historique se remplit au fil des séances.'}</p>`}
 </section>`;}
// ---------- Coffre du groupe ----------
const COIN_ORDER=['pp','gp','ep','sp','cp'];const COIN_FR={pp:'pp',gp:'po',ep:'pe',sp:'pa',cp:'pc'};
function stashPanel({state,pc,isGM,h,labels={}}){const {esc,attr}=h;const st=state.partyStash||{inventoryItems:[],coins:{},withdraw:'all'};const list=st.inventoryItems||[];
 const canTake=isGM||st.withdraw!=='gm';const coins=COIN_ORDER.filter(k=>Number(st.coins?.[k])>0).map(k=>st.coins[k]+' '+COIN_FR[k]).join(' · ')||'aucune pièce';
 return `<section class="panel stash-panel" aria-labelledby="stash-title"><div class="panel-top"><h3 id="stash-title">Coffre du groupe</h3><span class="mini-pill">${list.length} objet${list.length>1?'s':''} · ${esc(coins)}</span></div>
 <p class="muted small">Commun à tout le groupe : chacun voit son contenu. ${st.withdraw==='gm'?'<strong>Le MJ distribue</strong> le contenu du coffre ; vous pouvez y déposer.':'Chacun peut déposer et reprendre ; tout est noté dans le journal.'} Pour déposer un objet, utilisez « Donner à… » puis « Coffre du groupe » dans le sac.</p>
 ${list.length?`<ul class="stash-list">${list.map(it=>`<li class="stash-row"><div><strong>${esc(it.name)}</strong>${(it.quantity??1)>1?` <span class="mini-pill">×${it.quantity}</span>`:''}<small class="muted">${esc(labels[it.category]||'')}${it.notes?' · '+esc(String(it.notes).slice(0,80)):''}</small></div>
  <div class="stash-actions">${canTake&&pc?`<form class="stash-take" data-pc="${attr(pc.id)}" data-item="${attr(it.id)}">${(it.quantity??1)>1?`<label class="visually-hidden" for="stash-q-${attr(it.id)}">Quantité</label><input id="stash-q-${attr(it.id)}" name="quantity" type="number" min="1" max="${it.quantity}" value="1">`:'<input type="hidden" name="quantity" value="1">'}<button class="btn btn-secondary" type="submit">Prendre${isGM?' pour '+esc(pc.name):''}</button></form>`:''}
  ${isGM?`<button type="button" class="icon-btn" data-stash-remove="${attr(it.id)}" aria-label="Retirer ${attr(it.name)} du coffre">✕</button>`:''}</div></li>`).join('')}</ul>`:'<p class="empty">Le coffre est vide.</p>'}
 ${pc?`<details class="ux-fold stash-coins"><summary>Pièces : déposer ou prendre <span aria-hidden="true">⌄</span></summary><form class="stash-coin-form" data-pc="${attr(pc.id)}"><div class="coin-grid">${COIN_ORDER.map(k=>`<label>${COIN_FR[k]}<input type="number" name="${k}" min="0" max="9999999" value="0"></label>`).join('')}</div>
  <div class="btn-group"><button class="btn btn-secondary" type="submit" name="direction" value="in">Déposer (bourse de ${esc(pc.name)})</button>${canTake?`<button class="btn btn-secondary" type="submit" name="direction" value="out">Prendre dans le coffre</button>`:''}</div></form></details>`:''}
 ${isGM?`<details class="ux-fold"><summary>Réglages du coffre (MJ) <span aria-hidden="true">⌄</span></summary><div class="ux-fold-content"><label>Qui peut reprendre des objets ?<select data-stash-withdraw><option value="all" ${st.withdraw!=='gm'?'selected':''}>Tous les joueurs</option><option value="gm" ${st.withdraw==='gm'?'selected':''}>Seulement le MJ (il distribue)</option></select></label>
  <form class="stash-add-form"><label>Ajouter un objet au coffre<input name="name" maxlength="70" required placeholder="Ex. Coffret en argent"></label><label>Quantité<input name="quantity" type="number" min="1" max="999" value="1"></label><button class="btn btn-secondary" type="submit">Ajouter</button></form></div></details>`:''}
 </section>`;}
return {KEYS,row,rows,partyView,category,historyPanel,CATS,stashPanel};
});
