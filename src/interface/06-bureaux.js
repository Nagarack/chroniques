// ——— 06 · Bureaux de combat et du MJ, découverte ———
function fightKey(){return CW?.key(viewer?.name,viewer?.campaignId,onboardRole())||'';}
function fightLoad(){try{fightLayout=CW.normalize(JSON.parse(localStorage.getItem(fightKey())||'null'));}catch{fightLayout=CW?.blank();}}
function fightSave(){try{localStorage.setItem(fightKey(),JSON.stringify(CW.normalize(fightLayout)));}catch{toast('La disposition du combat ne peut pas être mémorisée ici.',true);}}
function fightChange(mode,id,value){if(actor!=='mj'||!CW?.IDS.includes(id))return;
 if(mode==='visible'&&value===true)fightCustomizeOpen=true;
 if(mode==='move')fightLayout=CW.move(fightLayout,id,value);
 else if(mode==='visible')fightLayout=CW.show(fightLayout,id,value);
 else if(mode==='size')fightLayout=CW.width(fightLayout,id,value);
 else return;
 fightSave();render();}
function deskKey(){return W.key(viewer?.name,viewer?.campaignId,onboardRole());}
function deskLoad(){try{deskLayout=W.normalize(JSON.parse(localStorage.getItem(deskKey())||'null'));}catch{deskLayout=W.blank();}}
function deskSave(){try{localStorage.setItem(deskKey(),JSON.stringify(W.normalize(deskLayout)));}catch{toast('La disposition ne peut pas être mémorisée dans ce navigateur.',true);}}
function deskChange(mode,id,value){if(actor!=='mj'||!W.IDS.includes(id))return;
 if(mode==='visible'&&value===true)deskCustomizeOpen=true;
 if(mode==='move')deskLayout=W.move(deskLayout,id,value);
 else if(mode==='visible')deskLayout=W.show(deskLayout,id,value);
 else if(mode==='size')deskLayout=W.width(deskLayout,id,value);
 else return;
 deskSave();render();}
function deskPanel(id,body,index){const entry=deskLayout.panels[id];if(!entry?.visible)return '';
 return `<article class="workspace-panel ${entry.wide?'workspace-wide':''}" data-workspace-panel="${id}" aria-label="${esc(W.LABELS[id])}"><div class="workspace-panel-header">
 <span class="workspace-grip" draggable="true" data-workspace-drag="${id}" title="Faire glisser pour déplacer sur ordinateur" aria-label="Déplacer ${esc(W.LABELS[id])} par glisser-déposer">⠿</span>
 <h3>${esc(W.LABELS[id])}</h3><div class="workspace-panel-actions">
 <button type="button" data-workspace-step="up" data-workspace-id="${id}" aria-label="Monter ${esc(W.LABELS[id])}" ${index===0?'disabled':''}>↑</button>
 <button type="button" data-workspace-step="down" data-workspace-id="${id}" aria-label="Descendre ${esc(W.LABELS[id])}" ${index===deskLayout.order.length-1?'disabled':''}>↓</button>
 <button type="button" data-workspace-size="${id}" aria-label="${entry.wide?'Réduire':'Agrandir'} ${esc(W.LABELS[id])}" title="${entry.wide?'Réduire':'Agrandir'}">${entry.wide?'▣':'▢'}</button>
 <button type="button" data-workspace-hide="${id}" aria-label="Masquer ${esc(W.LABELS[id])}" title="Masquer">×</button></div></div>
 <div class="workspace-panel-body">${body}</div></article>`;
}
function workspaceDesk(){if(actor!=='mj')return '';
 const pcs=state.characters||[], memory=(state.campaignMemory||[]).filter(x=>x.status!=='resolved'), scenes=state.sessionFlow||[];
 const active=scenes.filter(s=>s.status==='active'),planned=scenes.filter(s=>s.status==='planned');
 const content={
 notes:`<div class="workspace-parchment"><p class="workspace-subtitle">Décisions et conséquences encore ouvertes</p><div class="storyline-list">${memory.slice(0,5).map(x=>`<div class="storyline-note"><strong>${esc(x.title)}</strong><p>${esc(x.summary||x.impact||'À reprendre lors de la prochaine séance.')}</p></div>`).join('')||'<p>Aucun fil narratif en attente.</p>'}</div><button type="button" class="paper-link" data-nav="chronicle">Ouvrir la Chronique</button></div>`,
 party:`<div class="desk-player-list">${pcs.map(p=>`<button type="button" data-char="${attr(p.id)}"><span class="desk-avatar">${esc(p.name?.[0]||'?')}</span><span><strong>${esc(p.name)}</strong><small>${esc(p.job||'Aventurier')} · niv. ${p.level}</small></span><span class="desk-hp">${p.hp}/${p.stats.hp} PV</span></button>`).join('')||'<p class="muted">Pas encore de personnages.</p>'}</div><button type="button" class="btn btn-secondary" data-nav="character">Fiches du groupe</button>`,
 combat:`<p class="workspace-status">${state.combat.started?'Combat actif · Tour '+esc(state.combat.round):'Aucun combat en cours'}</p><p class="muted small">${pcs.filter(p=>p.hp<=p.stats.hp/2).length} aventurier(s) à 50 % de PV ou moins · ${state.combat.npcs?.length||0} créature(s) suivie(s)</p><div class="workspace-shortcuts"><button type="button" class="btn btn-primary" data-nav="combat">Ouvrir le combat</button><button type="button" class="btn btn-secondary" data-nav="encounters">Rencontres</button></div>`,
 session:`<p class="workspace-status">${[active.length>1?`${active.length} scènes en cours`:active.length?'1 scène en cours':'',planned.length>1?`${planned.length} scènes à venir`:planned.length?'1 scène à venir':''].filter(Boolean).join(', ')||'Aucune scène préparée'}</p><div class="workspace-scenes">${[...active,...planned].slice(0,4).map(s=>`<div><span class="mini-pill">${s.status==='active'?'En cours':'Prévue'}</span><strong>${esc(s.title)}</strong></div>`).join('')||'<p class="muted">Pas encore de scène préparée.</p>'}</div><button type="button" class="btn btn-secondary" data-nav="session">Préparer la séance</button>`,
 shortcuts:`<div class="workspace-shortcuts"><button type="button" class="btn btn-secondary" data-nav="maps">Cartes</button><button type="button" class="btn btn-secondary" data-nav="inventory">Trésors</button><button type="button" class="btn btn-secondary" data-nav="stories">Scénarios</button><button type="button" class="btn btn-secondary" data-nav="campaign">Campagnes</button></div><p class="muted small">Les autres outils restent accessibles depuis le menu.</p>`
 };
 const visible=deskLayout.order.filter(id=>deskLayout.panels[id].visible);
 return `<section class="workspace" aria-label="Bureau personnalisable du MJ"><div class="workspace-heading"><div><h2>Mon bureau</h2><p class="muted small">Déplacez les panneaux ou utilisez les flèches ; vos choix sont conservés pour cette campagne sur cet appareil.</p></div><details class="workspace-customize" ${deskCustomizeOpen?'open':''}><summary>Personnaliser</summary><div class="workspace-choices"><strong>Afficher les panneaux</strong>${W.IDS.map(id=>`<label><input type="checkbox" data-workspace-show="${id}" ${deskLayout.panels[id].visible?'checked':''}> ${esc(W.LABELS[id])}</label>`).join('')}<button type="button" class="btn btn-secondary" data-workspace-reset>Réinitialiser ce bureau</button><p class="muted small">Cette personnalisation ne modifie pas la campagne et n'est pas synchronisée entre appareils.</p></div></details></div>
 <div class="workspace-grid">${deskLayout.order.map((id,i)=>deskPanel(id,content[id],i)).join('')}</div>${visible.length===0?'<p>Activez au moins un panneau.</p>':''}</section>`;
}
function onboardingLoad(){try{onboardDone=OB.decode(JSON.parse(localStorage.getItem(OB.key(viewer?.name,onboardRole())+':'+String(viewer?.campaignId||''))||'{}'),onboardRole());}catch{onboardDone=[];}}
function onboardingSave(){try{localStorage.setItem(OB.key(viewer?.name,onboardRole())+':'+String(viewer?.campaignId||''),JSON.stringify({done:onboardDone}));}catch{}}
// V5 — synchronisation légère : on garde une copie intacte du dernier état reçu, et le serveur n'envoie que
// les différences depuis cette copie (étiquette syncTag). En cas de doute, on redemande l'état complet.
