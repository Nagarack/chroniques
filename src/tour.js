/* Chroniques — visite guidée : met en surbrillance les vrais boutons, écran par écran.
   Rien n'est modifié pendant la visite : elle ne fait que naviguer et montrer. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.ChroniquesTour=api;})(typeof window!=='undefined'?window:null,function(){'use strict';
const GM=[
 {title:'Bienvenue, Maître du Jeu',text:'Cette visite de deux minutes vous montre où se trouvent les outils principaux. Rien n’est modifié pendant la visite. Appuyez sur Échap pour quitter à tout moment.'},
 {nav:'overview',target:'.sidebar nav|.sidebar|.mobile-bottom-nav',title:'La navigation',text:'Tout part d’ici : Tableau de bord, Combat, Personnages et Cartes. Les rubriques « Suivi de la partie », « Préparation » et « Bibliothèque » se déplient d’un clic.'},
 {nav:'campaign',target:'[data-task="invite"]',title:'Inviter vos joueurs',text:'Choisissez un personnage puis « Inviter ce joueur » : un QR code à faire scanner autour de la table et un lien à envoyer s’affichent. « Inviter toute la table » prépare une invitation par personnage libre.'},
 {nav:'character',target:'.hp-quick|.sheet-strip|.char-compact',title:'Les points de vie en un geste',text:'Les boutons −10 à +10 notent les dégâts et les soins annoncés après vos vrais jets de dés. Choisissez d’abord un type de dégâts : résistances et vulnérabilités sont alors appliquées automatiquement.'},
 {nav:'combat',target:'[data-task="start"]|[data-task="next"]|.combat-band|.workspace-heading',title:'Le combat',text:'Saisissez les initiatives obtenues aux dés, démarrez le combat, puis passez les tours. Au clavier : N pour le tour suivant, U pour annuler la dernière action.'},
 {nav:'encounters',target:'.page-tabs|[data-task="tpl-new"]',title:'La Bibliothèque MJ',text:'Quatre onglets : vos monstres (avec votre image ou une créature du SRD), vos objets à donner, vos marchands à ouvrir aux joueurs et vos rencontres prêtes à jouer.'},
 {nav:'today',target:'.today-head|.today-grid',title:'La séance du jour',text:'Tout ce qui est prévu sur une page, avec « Précédemment dans… » à composer et publier : scènes, rencontres prêtes à déployer, PNJ et lieux concernés avec vos secrets, quêtes actives, documents à envoyer. Imprimable.'},
 {nav:'chronicle',target:'.page-tabs|.schedule',title:'Journal & quêtes',text:'Proposez les dates de la prochaine séance, envoyez des documents (lettres, indices, images) à un joueur ou à toute la table, relisez les résumés de séance et distribuez l’XP.'},
 {nav:'maps',target:'.map-tools|.campaign-map-stage|.map-layout',title:'Cartes tactiques',text:'Grille, jetons à faire glisser, brouillard de guerre, mesure des distances et zones de sort. « Écran de table » affiche la carte et l’initiative sur une TV, sans aucun secret.'},
 {nav:'rules',target:'#rules-search|.rules-toc',title:'Les règles en français',text:'Le SRD 5.1 officiel : combat, états, repos, magie et les 319 sorts. Cherchez un mot (« à terre », « abri ») ; les états affichés en combat sont aussi cliquables.'},
 {nav:'overview',target:'.whisper-btn',title:'Chuchotements',text:'Un message privé à un joueur, que les autres ne voient pas. Le badge indique les réponses non lues.'},
 {nav:'overview',target:'.search-toggle',title:'Tout retrouver',text:'Ctrl+K (ou la loupe) cherche partout : personnages, monstres, objets, sorts, cartes, documents et commandes comme « Écran du MJ » ou « Repos long pour tout le groupe ».'},
 {nav:'overview',target:'.help-toggle',title:'L’aide de chaque écran',text:'Ce bouton « ? » affiche le mode d’emploi de l’écran où vous êtes. Au clavier : ? pour l’ouvrir, / pour chercher dans une liste, Échap pour fermer.'},
 {nav:'overview',target:'.account-actions summary',title:'Votre compte et l’apparence',text:'Ici : apparence claire ou sombre, paramètres, aide complète et déconnexion.'},
 {title:'C’est parti !',text:'Pour vous entraîner sans toucher à votre vraie partie, créez une campagne d’entraînement depuis « Mes campagnes ». Cette visite reste disponible dans Aide & tutoriel.'}
];
const PLAYER=[
 {title:'Bienvenue !',text:'Cette visite d’une minute vous montre l’essentiel. Rien n’est modifié pendant la visite. Appuyez sur Échap pour quitter à tout moment.'},
 {nav:'character',target:'.char-compact|.char-hero',title:'Votre personnage',text:'Votre fiche résumée : classe d’armure, initiative, vitesse et états. Le bouton « ⋯ » permet de changer de portrait.'},
 {nav:'character',target:'.hp-quick|.sheet-strip',title:'Vos points de vie',text:'Après un vrai jet de dés, notez les dégâts ou les soins avec ces boutons. Rien n’est jamais lancé par l’application.'},
 {nav:'combat',target:'.player-turn|.initiative-panel|.combat-band|.workspace-heading',title:'Le combat',text:'Pendant un combat, ce panneau regroupe l’essentiel : vos PV, vos actions, vos emplacements de sorts et vos potions. Quand c’est à vous, votre téléphone vibre et « À vous de jouer ! » s’affiche.'},
 {nav:'inventory',target:'.gear-summary|.inventory-list',title:'Votre équipement',text:'Buvez une potion (lancez les dés indiqués), équipez armure et bouclier pour calculer votre CA, donnez un objet à un autre joueur ou déposez-le dans le coffre du groupe, et achetez chez les marchands ouverts par le MJ.'},
 {nav:'chronicle',target:'.page-tabs|.handouts|.schedule',title:'Journal & quêtes',text:'Indiquez vos disponibilités pour la prochaine séance et lisez les documents envoyés par le MJ (un badge signale les nouveaux).'},
 {nav:'overview',target:'.whisper-btn',title:'Chuchoter au MJ',text:'Le bouton ✉ ouvre une conversation privée avec le MJ : une action discrète, une question, sans que les autres joueurs le voient.'},
 {nav:'character',target:'.companions-panel|.sheet-strip',title:'Compagnons et familiers',text:'Ajoutez votre familier ou votre monture ici ; « Envoyer au combat » lui donne son propre tour, juste après vous.'},
 {nav:'character',target:'[data-sheet-section="history"]|.sheet-sections',title:'L’historique de votre personnage',text:'Onglet « Historique » de la fiche : niveaux, XP, objets, combats et quêtes, notés automatiquement, avec les notes que le MJ vous adresse.'},
 {nav:'notes',target:'[data-task="note-new"]|.note-toolbar',title:'Les notes du groupe',text:'Un carnet commun à tous les joueurs : indices, plans, noms à retenir. Votre MJ peut le lire, mais pas le modifier.'},
 {nav:'character',target:'.help-toggle',title:'L’aide de chaque écran',text:'Ce bouton « ? » explique l’écran où vous êtes. Les états (Effrayé, À terre…) sont expliqués au survol ou en touchant leur nom.'},
 {title:'Bonne partie !',text:'Vous pouvez relancer cette visite depuis Aide & tutoriel. Un aide-mémoire imprimable vous y attend aussi.'}
];
function steps(role){return role==='gm'?GM:PLAYER;}
let idx=-1,list=[],hooks=null,layer=null;
function visible(el){if(!el)return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0;}
function findTarget(sel){if(!sel)return null;for(const s of sel.split('|')){const el=[...document.querySelectorAll(s)].find(visible);if(el)return el;}return null;}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function ensureLayer(){if(layer)return layer;layer=document.createElement('div');layer.className='tour-layer';layer.innerHTML='<div class="tour-hole"></div><div class="tour-bubble" role="dialog" aria-modal="true" aria-live="polite"></div>';document.body.appendChild(layer);
 layer.addEventListener('click',e=>{const b=e.target.closest('[data-tour]');if(!b)return;const a=b.dataset.tour;if(a==='next')go(idx+1);else if(a==='prev')go(idx-1);else stop();});return layer;}
function place(){
 if(idx<0||!layer)return;const step=list[idx],el=findTarget(step.target),hole=layer.querySelector('.tour-hole'),bubble=layer.querySelector('.tour-bubble');
 const last=idx===list.length-1;
 bubble.innerHTML=`<p class="tour-count">${idx+1} / ${list.length}</p><h3>${esc(step.title)}</h3><p>${esc(step.text)}</p><div class="tour-actions"><button type="button" class="btn btn-secondary" data-tour="stop">Quitter</button>${idx>0?'<button type="button" class="btn btn-secondary" data-tour="prev">Précédent</button>':''}<button type="button" class="btn btn-primary" data-tour="next">${last?'Terminer':'Suivant'}</button></div>`;
 const vw=window.innerWidth,vh=window.innerHeight;
 if(el){
  el.scrollIntoView({block:'center',inline:'nearest'});const r=el.getBoundingClientRect(),pad=6;
  Object.assign(hole.style,{display:'block',left:(r.left-pad)+'px',top:(r.top-pad)+'px',width:(r.width+2*pad)+'px',height:(r.height+2*pad)+'px'});
  const bw=Math.min(360,vw-24);bubble.style.width=bw+'px';const bh=bubble.offsetHeight||180;
  let top=r.bottom+14;if(top+bh>vh-12)top=Math.max(12,r.top-bh-14);
  let left=Math.min(Math.max(12,r.left),vw-bw-12);Object.assign(bubble.style,{left:left+'px',top:top+'px',transform:'none'});
 }else{
  hole.style.display='none';const bw=Math.min(420,vw-24);Object.assign(bubble.style,{width:bw+'px',left:'50%',top:'50%',transform:'translate(-50%,-50%)'});
 }
 bubble.querySelector('[data-tour="next"]').focus({preventScroll:true});
}
function go(i){
 if(i>=list.length){stop();if(hooks&&hooks.done)hooks.done();return;}
 if(i<0)i=0;idx=i;ensureLayer();layer.classList.toggle('no-target',!list[idx].target);
 const step=list[idx];if(step.nav&&hooks&&hooks.navigate)hooks.navigate(step.nav);
 requestAnimationFrame(()=>requestAnimationFrame(place));
}
function start(role,h){hooks=h||{};list=steps(role);go(0);}
function stop(){idx=-1;if(layer){layer.remove();layer=null;}}
function active(){return idx>=0;}
function key(e){if(idx<0||e.key==='Tab')return false;if(e.key==='Escape'){stop();return true;}if(e.key==='ArrowRight'||e.key==='Enter'){go(idx+1);return true;}if(e.key==='ArrowLeft'){go(idx-1);return true;}return true;}
if(typeof window!=='undefined'&&typeof window.addEventListener==='function'){window.addEventListener('resize',()=>{if(idx>=0)place();});}
return {steps,start,stop,active,place,key};
});
