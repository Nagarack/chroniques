// ——— 09 · Cadre de l’application ———
function renderShell(){
 if(viewer?.tableMode&&!viewer.characterId){patchApp(tablePickerHtml());return;}
 const activePc=L.actorPc(state,actor);const isGM=actor==='mj';
 patchApp(`<a class="skip-link" href="#main-content">Aller au contenu principal</a>${viewer?.tableMode?`<div class="table-mode-bar" role="status"><span>📱 <span>Tablette partagée</span> · <strong>${esc(activePc?.name||'')}</strong></span><button type="button" class="btn btn-secondary" data-task="table-release">Changer de joueur</button></div>`:''}<div class="appframe ${uxSimple?'ux-simple':'ux-complete'} ${campLook().color?'has-look':''}" ${campLook().color?`style="--camp:${attr(campLook().color)}"`:''}>
   <aside class="sidebar">
    <div class="brand"><span class="brandmark" aria-hidden="true">${esc(campLook().emblem||'✦')}</span><div><strong>CHRONIQUES</strong><small>Le carnet des aventures</small></div></div>
    <nav class="sidenav" aria-label="Navigation principale">
      ${navButton('overview','Tableau de bord','◈')}
      ${navButton('combat','Combat','⚔')}
      ${navButton('character','Personnages','♜')}
      ${navButton('maps','Cartes','⌖')}
      <details class="nav-group" ${['session','inventory','grimoire','rules','table','memorial','notes'].includes(page)?'open':''}>
       <summary>Suivi de la partie <span aria-hidden="true">⌄</span></summary>
       ${navButton('session',isGM?'Préparer la séance':'Scènes partagées','🗺')}
       ${navButton('inventory','Inventaire & trésors','🎒')}
       ${navButton('grimoire','Grimoire de sorts','✧')}
       ${navButton('rules','Règles du jeu','§')}
       ${TCHC?navButton('table','Charte de la table','✓'):''}
       ${(state.characters||[]).some(p=>p.fallen)?navButton('memorial','Mémorial','✝'):''}
       ${navButton('notes',isGM?'Notes des joueurs':'Notes partagées','📝')}
      </details>
      <details class="nav-group" ${['today','comj','encounters','stories','chronicle'].includes(page)?'open':''}>
       <summary>Préparation <span aria-hidden="true">⌄</span></summary>
       ${isGM?navButton('today','Séance du jour','☑'):''}
       ${isGM||viewer?.role==='assistant'?navButton('comj','Poste co-MJ','✶'):''}
       ${isGM?navButton('encounters','Bibliothèque MJ','♟'):''}
       ${isGM?navButton('stories','Scénarios','📖'):''}
       ${navButton('chronicle','Chronique','📜')}
      </details>
      <details class="nav-group" ${['illustrations','campaign','settings','device','guide','admin'].includes(page)?'open':''}>
       <summary>Bibliothèque & réglages <span aria-hidden="true">⌄</span></summary>
       ${navButton('illustrations','Illustrations & objets','▧')}
       ${navButton('campaign','Mes campagnes','♧')}
       ${navButton('settings','Paramètres','⚙')}
       ${navButton('device','Cet appareil','◐')}
       ${viewer?.isAdmin?navButton('admin','Administration','✦'):''}
       ${navButton('guide','Aide & tutoriel','?')}
      </details>
    </nav>
    <div class="sidebar-foot">Version ${esc(network.version||'')}</div>
   </aside>
   <div class="mainarea">
    <header class="topbar"><div><div class="crumb">Campagne <span> / </span> ${esc(state.title)}</div><div class="mobile-logo"><span aria-hidden="true">${esc(campLook().emblem||'✦')}</span> CHRONIQUES</div></div>
      <div class="topcontrols">${whisperButton()}<span class="outbox-pill" id="outbox-count" role="status" aria-live="polite">${outbox.length?outbox.length+' en attente':''}</span><span class="live-pill" title="${network.networkMode==='public'?'Lien HTTPS de la campagne':'Serveur local'} · Compte vérifié par le serveur"><strong id="realtime-state" role="status" aria-live="polite">${esc(connectionState)}</strong></span><button type="button" class="search-toggle" data-task="search-open" aria-label="Rechercher (Ctrl+K)" title="Rechercher partout (Ctrl+K)">⌕</button><button type="button" class="help-toggle ${helpOpen?'on':''}" data-help-toggle aria-pressed="${helpOpen}" aria-label="Mode d’emploi de cet écran" title="Mode d’emploi de cet écran">?</button>${(campaignList.campaigns||[]).length>1?`<label class="top-campaign-select" aria-label="Campagne active"><span>Campagne</span><select id="active-campaign" aria-label="Changer de campagne">${(campaignList.campaigns||[]).map(c=>option(c.id,c.title,campaignList.activeId)).join('')}</select></label>`:''}
       ${viewer?.accessRole==='gm'?`<label class="top-role-select"><span>Mon affichage</span><select id="active-role" aria-label="Choisir l'affichage joueur ou MJ">${option('gm','Maître du Jeu',viewer.role)}${option('player','Joueur',viewer.role)}</select></label>`:`<span class="mini-pill account-role">${esc(viewer?.name||'Membre')} · Joueur</span>`}
       <details class="account-actions"><summary aria-label="Options du compte"><span class="acct-label">Mon compte</span> <span class="acct-caret" aria-hidden="true">⌄</span><span class="acct-icon" aria-hidden="true">☰</span></summary><div class="account-actions-menu"><div class="muted small">D&D 5e · ${state.edition==='custom'?'Personnalisées':state.edition}</div><button type="button" class="text-button" data-task="lang-toggle" translate="no">${uiLang()==='en'?'Français':'English'}</button><button type="button" class="text-button" data-nav="device">Cet appareil : affichage, texte, écran…</button>${viewer?.tableMode?`<button type="button" class="text-button" data-task="table-release">Changer de joueur</button><button type="button" class="text-button" data-task="table-quit">🔒 Quitter le mode table (code du MJ)</button>`:`<button type="button" class="text-button" data-task="report-open">Signaler un problème</button><button type="button" class="text-button" data-task="suggest-open">Proposer une amélioration</button>${viewer?.accessRole==='gm'?`<button type="button" class="text-button" data-task="table-open">Mode table unique</button>`:''}<button type="button" class="text-button" data-nav="settings">Paramètres</button><button type="button" class="text-button" data-nav="guide">Aide</button><button type="button" class="text-button" data-task="logout">Déconnexion</button>`}</div></details>
      </div></header>
    <main class="maincontent" id="main-content" tabindex="-1">
      ${isGM?charterBanner():''}
      ${pendingInvite?`<div class="invite-pending" role="status"><strong>Invitation reçue</strong><span class="muted">Voulez-vous rejoindre la campagne liée à ce lien avec votre compte actuel ?</span><button type="button" class="btn btn-primary" data-task="accept-pending-invite">Rejoindre</button><button type="button" class="btn btn-secondary" data-task="dismiss-pending-invite">Ignorer</button></div>`:''}${noticeStack()}${helpOpen?quickHelpPage()+shortcutsHint():''}${uxContext()}${page==='memorial'?memorialPage():page==='table'?(TCHC?tablePage():overview()):page==='overview'?overview():page==='stories'?(isGM?storiesPage():overview()):page==='inventory'?inventoryPage():page==='combat'?combat():page==='encounters'?(isGM?withTabs('encounters',encountersPage()):combat()):page==='today'?(isGM&&PR?todayPageHtml():overview()):page==='comj'?(isGM||viewer?.role==='assistant'?coGmPage():overview()):page==='session'?sessionPage():page==='maps'?mapsPage():page==='guide'?guidePage():page==='character'?character():page==='grimoire'?grimoire():page==='illustrations'?illustrations():page==='campaign'?campaign():page==='notes'?sharedNotesPage():page==='chronicle'?withTabs('chronicle',chronicle()):page==='rules'?rulesPage():page==='admin'?adminPage():page==='device'?devicePage():settings()}
      <footer class="pagefooter">Chroniques v${esc(network.version||'')} · <a target="_blank" rel="noopener noreferrer" href="https://www.dndbeyond.com/srd" style="text-decoration:underline">Référence SRD 5.2.1</a> · <button type="button" class="text-button" data-nav="rules" style="text-decoration:underline">Règles en français</button> · Données hébergées sur votre serveur</footer>
    </main>
   </div>
  </div>
  <nav class="mobile-bottom-nav" aria-label="Accès rapide sur mobile">
   ${mobileLink('overview','◈','Accueil')}${mobileLink('character','♜','Fiche')}${mobileLink('combat','⚔','Combat')}
   <button type="button" class="mobile-nav-entry ${mobileMore||!['overview','character','combat','guide'].includes(page)?'active':''}" data-menu="toggle" aria-label="Ouvrir les autres rubriques" aria-expanded="${mobileMore}" aria-controls="mobile-more"><span aria-hidden="true">☷</span><small>Plus</small></button>
   ${mobileLink('guide','?','Aide')}
  </nav>
  ${mobileMore?`<div class="mobile-more-backdrop" data-menu="close"><div id="mobile-more" class="mobile-more-sheet" role="dialog" aria-modal="true" aria-label="Autres rubriques"><div class="panel-top"><h2>Où voulez-vous aller ?</h2><button class="icon-close" type="button" data-menu="close" aria-label="Fermer">✕</button></div>
     <div class="mobile-more-links">${mobileExtraNav(isGM)}</div>
  </div></div>`:''}
  <div id="toast" class="toast" role="status" aria-live="polite"></div>
  <div id="modal-root">${modalHtml()}</div>${spotlightHtml()}${previewMediaHtml()}`);
}
// 5.19 : durée de la séance (depuis state.sessionStats.startedAt) et rappel de pause, pour le MJ seul. Rien n’est envoyé au serveur.
let pauseEvery=(()=>{try{const v=Number(localStorage.getItem('chroniques-pause'));return [60,90,120].includes(v)?v:0;}catch{return 0;}})();
const pauseKey=()=>'chroniques-pause-faite:'+(state?.sessionStats?.id||'');
function sessionMinutes(now=Date.now()){const ss=state?.sessionStats;if(!ss||!ss.startedAt)return null;const a=Date.parse(ss.startedAt),last=Date.parse(ss.lastAt||ss.startedAt);if(!Number.isFinite(a)||now-last>6*3600e3||now<a)return null;return Math.floor((now-a)/60000);}
function fmtSessionLength(min){const h=Math.floor(min/60),m=min%60;return h?(m?`${h} h ${String(m).padStart(2,'0')}`:`${h} h`):`${m} min`;}
function sessionClockChip(){if(actor!=='mj')return '';const m=sessionMinutes();if(m==null)return '';return `<span class="tag session-clock" data-session-clock title="Depuis la première action de la séance. « Nouvelle séance » (Séance du jour) remet le compteur à zéro.">Séance en cours depuis ${fmtSessionLength(m)}</span>`;}
function pauseDue(now=Date.now()){if(actor!=='mj'||!pauseEvery)return false;const m=sessionMinutes(now);if(m==null)return false;let ref=Date.parse(state.sessionStats.startedAt);try{const v=Number(localStorage.getItem(pauseKey()));if(v>ref)ref=v;}catch{}return now-ref>=pauseEvery*60000;}
function pauseBanner(){if(!pauseDue())return '';const m=Math.floor((Date.now()-Math.max(Date.parse(state.sessionStats.startedAt),(()=>{try{return Number(localStorage.getItem(pauseKey()))||0;}catch{return 0;}})()))/60000);
 return `<div class="pause-reminder" role="status"><span>${fmtSessionLength(m)} de jeu sans pause : c’est peut-être le moment d’en proposer une.</span><button type="button" class="btn btn-secondary" data-task="pause-done">Pause faite</button><button type="button" class="text-button" data-task="pause-later">Dans 15 min</button></div>`;}
// 5.18 : les rappels (hors ligne, sauvegarde, découverte, nouveautés) sont regroupés dans un seul bloc ; « à vous de jouer » reste à part.
function noticeStack(){const turn=turnBanner();const parts=[pauseBanner(),offlineBanner(),backupReminder(),turn?'':onboardingBanner(),page==='overview'?whatsNewBanner():''].filter(Boolean);return (turn||'')+(parts.length?`<div class="notice-stack">${parts.join('')}</div>`:'');}
function onboardingBanner(){if(!viewer||page!=='overview'||onboardHidden)return '';const role=onboardRole(),progress=OB.progress(role,onboardDone);if(!progress.next)return '';
return `<section class="onboard-banner" aria-label="Parcours de découverte"><div><strong>${icon('guide')} Vos premiers pas (${progress.done} sur ${progress.total})</strong><p>Prochaine étape : ${esc(progress.next.title)}. ${esc(progress.next.description)}</p></div><button class="btn btn-primary" data-tour-start>Visite guidée (2 min)</button><button class="btn btn-secondary" data-onboard-open>Étapes</button><button class="text-button" data-onboard-hide aria-label="Masquer le rappel">Masquer</button></section>`;}
function onboardingPage(){const role=onboardRole(),steps=OB.steps(role),count=onboardDone.length,progress=OB.progress(role,onboardDone),next=progress.next;
return `<section class="panel guided-panel" id="guided-steps"><div class="panel-top"><div><h2>${icon('guide')} Parcours guidé ${role==='gm'?'Maître du Jeu':'joueur'}</h2><p class="muted">Des étapes simples à suivre dans l’ordre. Vos choix et vos données ne sont jamais modifiés automatiquement.</p></div><span class="mini-pill">${count}/${steps.length} étapes</span></div><div class="guide-progress" role="progressbar" aria-label="Progression du parcours" aria-valuemin="0" aria-valuemax="${steps.length}" aria-valuenow="${count}"><span style="width:${100*count/steps.length}%"></span></div><ol class="onboard-list">${steps.map((step,i)=>`<li class="onboard-step ${onboardDone.includes(step.id)?'done':''}"><div class="onboard-step-number">${onboardDone.includes(step.id)?'✓':i+1}</div><div><h3>${esc(step.title)}</h3><p>${esc(step.description)}</p><div class="onboard-step-actions"><button type="button" class="btn btn-secondary" data-onboard-nav="${attr(step.page)}">${esc(step.action)}</button><button type="button" class="btn ${onboardDone.includes(step.id)?'btn-secondary':'btn-primary'}" data-onboard-check="${attr(step.id)}">${onboardDone.includes(step.id)?'Marquer comme à refaire':'✓ J’ai terminé cette étape'}</button></div></div></li>`).join('')}</ol><div class="onboard-foot"><span class="muted small">Progression conservée uniquement dans ce navigateur. Un autre appareil peut recommencer le parcours.</span><button type="button" class="text-button" data-onboard-reset>Recommencer le parcours</button></div></section>`;}
function itemValues(v){return {name:v.name,description:v.description||'',category:v.category||'other',quantity:Number(v.quantity),weight:Number(v.weight||0),chargesMax:Number(v.chargesMax||0),charges:Number(v.charges||0),equipped:v.equipped==='on',attuned:v.attuned==='on',recharge:v.recharge||'',rechargeDice:v.rechargeDice||'',capacity:Number(v.capacity||0),holdMagic:v.holdMagic==='on'};}
// --- V4.3 : utiliser, équiper, donner ; alertes de charge et d'harmonisation ; CA d'équipement ---
function fullItemValues(it,patch={}){return {name:it.name,description:it.description||'',category:it.category||'other',quantity:it.quantity??1,weight:Number(it.weight)||0,chargesMax:it.chargesMax||0,charges:it.charges||0,equipped:!!it.equipped,attuned:!!it.attuned,recharge:it.recharge||'',rechargeDice:it.rechargeDice||'',capacity:Number(it.capacity)||0,holdMagic:!!it.holdMagic,...patch};}
// 5.4 : pièges sur la carte (exemples du SRD 5.1, état, DD).
