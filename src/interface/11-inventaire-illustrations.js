// ——— 11 · Inventaire, marchands, illustrations ———
function inventoryPage(){const isGM=actor==='mj',pcs=state.characters.filter(p=>isGM||p.id===actor);if(!pcs.length)return `${heading('','Inventaire & trésors','Aucun personnage disponible.')}`;
 const pc=pcs.find(p=>p.id===inventoryCharacterId)||pcs[0];inventoryCharacterId=pc.id;const objects=I.list(pc),totalWeight=GEAR?GEAR.carried(pc):objects.reduce((n,it)=>n+(Number(it.weight)||0)*(Number(it.quantity)||1),0);const stash=isGM?state.lootStash||[]:[];
 return `${heading('','Inventaire & trésors')}
 ${rechargePanel(pc)}
 <section class="panel"><div class="panel-top"><h3>Sac de ${esc(pc.name)}</h3><span class="mini-pill">${objects.length} types d’objets · ${number(Math.round(totalWeight*100)/100)} kg indicatifs</span></div>${isGM?`<label>Choisir le personnage<select id="inventory-character">${pcs.map(p=>option(p.id,p.name,pc.id)).join('')}</select></label>`:''}
 ${IC?`<details class="ux-fold item-catalog" data-fold="item-catalog" ${openFolds.has('item-catalog')?'open':''}><summary>Catalogue d’objets SRD (équipement et objets magiques) <span aria-hidden="true">⌄</span></summary><div class="ux-fold-content"><label>Rechercher un objet<input type="search" id="item-catalog-search" data-character="${attr(pc.id)}" autocomplete="off" placeholder="Ex. épée longue, potion de soins, corde…"></label><div id="item-catalog-results" class="item-catalog-results" aria-live="polite"><p class="muted small">Tapez au moins deux lettres. L’objet est ajouté à l’inventaire de ${esc(pc.name)} ; vous pourrez ensuite modifier la quantité ou les notes.</p></div></div></details>`:''}${gearSummary(pc)}${liveFilter('.inventory-card',objects.length,'Filtrer l’inventaire')}<div class="inventory-list">${objects.filter(it=>!it.in||!objects.some(c=>c.id===it.in&&I.isContainer(c))).map(it=>inventoryCard(pc,it,objects)).join('')||'<p class="muted">Aucun objet. Ajoutez votre premier équipement ci-dessous.</p>'}</div><details class="inventory-new" ${!objects.length?'open':''}><summary>＋ Ajouter un objet</summary>${itemForm(null,'inventory-add')}</details></section>
 <section class="panel"><div class="panel-top"><h3>Monnaie de ${esc(pc.name)}</h3><span class="mini-pill">Modifications manuelles</span></div><form id="inventory-money"><input type="hidden" name="characterId" value="${attr(pc.id)}"><div class="coin-grid">${I.MONEY.map(k=>`<label>${k.toUpperCase()}<input type="number" name="${k}" min="0" max="999999" required value="${pc.coins?.[k]??0}"></label>`).join('')}</div><button type="submit" class="btn btn-secondary">Enregistrer la monnaie</button></form></section>
 ${PT?PT.stashPanel({state,pc,isGM,h:H6,labels:I.LABELS}):''}
 ${shopsSection(pc)}
 ${isGM?coinSplitSection():''}
 ${isGM?`<section class="panel"><div class="panel-top"><h3>🔒 Trésor de campagne — réservé au MJ</h3><span class="mini-pill">${stash.length} lots</span></div><p class="muted small">Préparez un butin, puis attribuez une quantité à un personnage. Les joueurs ne reçoivent pas cette liste.</p><div class="inventory-list">${stash.map(it=>`<div class="loot-row"><div><strong>${esc(it.name)}</strong><p class="muted small">${I.LABELS[it.category]||'Divers'} · ${it.quantity} restant(s)</p></div><form class="loot-give" data-loot-id="${attr(it.id)}"><label>À<select name="characterId">${pcs.map(p=>option(p.id,p.name,'' )).join('')}</select></label><label>Quantité<input type="number" name="quantity" min="1" max="${it.quantity}" value="1" required></label><button class="btn btn-primary" type="submit">Attribuer</button><button class="text-button danger-text" type="button" data-loot-delete="${attr(it.id)}">Retirer</button></form></div>`).join('')||'<p class="muted">Aucun trésor en réserve.</p>'}</div><details class="inventory-new"><summary>＋ Préparer un trésor</summary>${itemForm(null,'inventory-loot-add')}</details></section>`:''}
 <p class="muted small">Règles 2014/2024 : le poids, l’harmonisation et les limites d’équipement sont des repères informatifs ; Chroniques ne modifie pas automatiquement les jets ni les statistiques.</p>`;}
function coinSplitSection(){return `<section class="panel"><div class="panel-top"><h3>Partager l’or du butin</h3><span class="mini-pill">Parts égales</span></div><p class="muted small">Indiquez la somme trouvée et les personnages concernés : chacun reçoit sa part, le reste indivisible est signalé.</p>
 <form id="coin-split-form"><div class="coin-grid">${I.MONEY.map(k=>`<label>${GEAR?GEAR.COIN_FR[k]:k}<input type="number" name="${k}" min="0" max="9999999" value="0"></label>`).join('')}</div><fieldset class="split-who"><legend>Personnages</legend>${state.characters.map(p=>`<label class="inline-check"><input type="checkbox" name="ids" value="${attr(p.id)}" checked> ${esc(p.name)}</label>`).join('')}</fieldset><button class="btn btn-primary" type="submit">Partager</button></form></section>`;}
function shopPrice(cp){return GEAR?GEAR.formatPrice(cp):cp+' pc';}
function shopsSection(pc){const shops=Array.isArray(state.shops)?state.shops:[];const visible=shops.filter(s=>s.open);if(!visible.length)return actor==='mj'?`<section class="panel"><div class="panel-top"><h3>Marchands</h3><button type="button" class="btn btn-secondary" data-nav="encounters">Préparer un marchand</button></div><p class="muted small">Aucune boutique ouverte. Préparez vos marchands dans la Bibliothèque MJ, puis ouvrez-les au bon moment.</p></section>`:'';
 const purse=GEAR?GEAR.coinsValue(pc.coins||{}):0;
 return `<section class="panel shops-panel"><div class="panel-top"><h3>Marchands</h3><span class="mini-pill">Bourse de ${esc(pc.name)} : ${shopPrice(purse)}</span></div>${visible.map(sh=>`<article class="shop-card"><h4>${esc(sh.name)}</h4>${sh.description?`<p class="muted small">${esc(sh.description)}</p>`:''}<div class="shop-items">${sh.items.map(it=>`<div class="shop-item"><div><strong>${esc(it.values.name)}</strong><small class="muted">${esc(I.LABELS[it.values.category]||'Divers')}${it.stock!==-1?' · '+it.stock+' en stock':''}${it.values.description?' · '+esc(it.values.description.slice(0,90))+(it.values.description.length>90?'…':''):''}</small></div><span class="shop-price">${shopPrice(it.price)}</span><form class="shop-buy-form" data-shop="${attr(sh.id)}" data-item="${attr(it.id)}" data-pc="${attr(pc.id)}"><label class="visually-hidden" for="q-${attr(it.id)}">Quantité</label><input id="q-${attr(it.id)}" name="quantity" type="number" min="1" max="${it.stock===-1?99:Math.max(1,it.stock)}" value="1" class="hb-qty"><button class="btn btn-secondary" type="submit" ${it.price>purse||it.stock===0?'disabled':''} title="${it.price>purse?'Pas assez d’argent':''}">Acheter</button></form></div>`).join('')||'<p class="muted small">Rien à vendre pour le moment.</p>'}</div></article>`).join('')}</section>`;}
function images(){return Array.isArray(state.media)?state.media:[];}
function galleryFor(kind,entityId,characterId=''){return images().filter(e=>e.kind===kind&&e.entityId===entityId&&(e.characterId||'')===characterId);}
function imageFor(kind,entityId,characterId=''){
 const all=galleryFor(kind,entityId,characterId);return all.find(e=>e.featured)||all[0]||null;
}
function imageUrl(media){return media?(media.builtinId?A.src(media.builtinId):'/api/media/'+encodeURIComponent(media.id)):null;}
// Une illustration est décorative : si elle échoue, ne jamais afficher le texte alt brut.
// Un écouteur en capture remplace toutes les images défaillantes, y compris après re-render.
// Portrait par défaut d'un aventurier : l'icône de sa classe (Rôdeur → archer, Magicien → visage de mage…).
function defaultPortrait(pcId){const pc=L.findPc(state,pcId);if(!pc||!A?.classPortrait)return null;const cls=pc.progression?.classId||P.detectClass(pc.job);return A.src(A.classPortrait(cls));}
function artwork(kind,id,charId='',classes='',name=''){
 const chosen=imageFor(kind,id,charId);let url=imageUrl(chosen)||(name?A?.contextual?.(kind,name):null);
 if(!url&&kind==='character')url=defaultPortrait(id);
 return url?`<img class="art-image ${attr(classes)}" src="${attr(url)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" data-art-name="${attr(name||'')}">`:'';
}
document.addEventListener('error',event=>{
 const img=event.target;
 if(!(img instanceof HTMLImageElement)||!img.classList.contains('art-image'))return;
 const frame=img.parentElement;
 if(frame?.classList.contains('avatar')||frame?.classList.contains('mj-portrait')){
   // L'initiale déjà présente sous le portrait devient visible immédiatement.
   img.remove();return;
 }
 const fallback=document.createElement('span');
 fallback.className='art-fallback';fallback.setAttribute('aria-hidden','true');
 fallback.textContent='✧';
 img.replaceWith(fallback);
},true);
function mediaTargets(kind){
 const own=state.characters.filter(p=>actor==='mj'||p.id===actor);
 if(kind==='character')return state.characters.filter(p=>actor==='mj'||p.id===actor).map(p=>({id:p.id,characterId:'',name:p.name}));
 if(kind==='npc')return actor==='mj'?(state.combat.npcs||[]).map(p=>({id:p.id,characterId:'',name:p.name})):[];
 if(kind==='spell')return own.flatMap(p=>(p.grimoire||[]).map(e=>({id:e.id,characterId:p.id,name:p.name+' — '+(S.spellFor(e)?.name||'Sort')})));
 if(kind==='item')return own.flatMap(p=>(p.inventoryItems||[]).map(e=>({id:e.id,characterId:p.id,name:p.name+' — '+e.name})));
 return [];
}
function mediaTargetOptions(kind){const t=mediaTargets(kind);if(!t.some(e=>e.characterId+'|'+e.id===mediaTarget))mediaTarget=t[0]?t[0].characterId+'|'+t[0].id:'';return t;}
function illustrations(){if(mediaKind==='npc'&&actor!=='mj')mediaKind='character';const targets=mediaTargetOptions(mediaKind);const current=targets.find(e=>e.characterId+'|'+e.id===mediaTarget);const media=current?imageFor(mediaKind,current.id,current.characterId):null;const gallery=current?galleryFor(mediaKind,current.id,current.characterId):[];
 const allowed=Boolean(current&&(actor==='mj'||(mediaKind==='character'?current.id===actor:current.characterId===actor))); 
 let works=A.byKind(mediaKind).filter(e=>{const q=artSearch.toLowerCase().trim();return !q||e.name.includes(q)||e.artist.includes(q)||(e.label||'').toLowerCase().includes(q);});
 // Portraits : celui de la classe du personnage d'abord, puis les autres aventuriers, puis les créatures (formes animales, lycanthropes…).
 const suggestedPortrait=mediaKind==='character'&&current&&A.classPortrait?A.classPortrait(L.findPc(state,current)?.progression?.classId||P.detectClass(L.findPc(state,current)?.job)):'';
 if(mediaKind==='character'&&A.isPortrait)works=[...works.filter(e=>e.id===suggestedPortrait),...works.filter(e=>e.id!==suggestedPortrait&&A.isPortrait(e.id)),...works.filter(e=>!A.isPortrait(e.id))];
 works=works.slice(0,100);
 return `${heading('','Illustrations & objets')}
 <section class="panel"><div class="panel-top"><h3>Associer une illustration</h3><span class="mini-pill">Images privées sécurisées</span></div>
 <div class="two-fields"><label>Catégorie<select id="media-kind">${[['character','Avatar de personnage'],['npc','Monstre / PNJ'],['spell','Sort'],['item','Objet / équipement']].filter(([k])=>k!=='npc'||actor==='mj').map(([k,n])=>option(k,n,mediaKind)).join('')}</select></label>
 ${targets.length?`<label>Fiche liée<select id="media-target">${targets.map(x=>option(x.characterId+'|'+x.id,x.name,mediaTarget)).join('')}</select></label>`:`<div class="media-empty"><strong>${mediaKind==='character'?'Aucun personnage':mediaKind==='npc'?'Aucune créature':mediaKind==='spell'?'Aucun sort enregistré':'Aucun objet'}</strong><span class="muted small">${mediaKind==='character'?'Créez d’abord un personnage pour lui associer un portrait.':mediaKind==='npc'?'Ajoutez d’abord un monstre ou un PNJ dans Combat.':mediaKind==='spell'?'Ajoutez d’abord un sort dans le Grimoire.':'Ajoutez d’abord un objet dans l’Inventaire.'}</span><button type="button" class="btn btn-secondary" data-nav="${mediaKind==='character'?'character':mediaKind==='npc'?'combat':mediaKind==='spell'?'grimoire':'inventory'}">${mediaKind==='character'?'Ouvrir les fiches':mediaKind==='npc'?'Ouvrir le combat':mediaKind==='spell'?'Ouvrir le grimoire':'Ouvrir l’inventaire'}</button></div>`}</div>
 ${current?`<div class="art-current">${media||mediaKind==='character'?artwork(mediaKind,current.id,current.characterId,'art-main'):'<div class="art-empty">Aucune illustration enregistrée</div>'}<div><h3>${esc(current.name)}</h3><p class="muted small">${media?(media.builtinId?'Illustration du catalogue CC BY 3.0':'Image personnelle sur le serveur'):mediaKind==='character'?'Portrait par défaut selon la classe. Choisissez-en un autre ci-dessous ou importez votre image.':'Choisissez une illustration ci-dessous ou importez votre image.'}</p>
 ${media?`<button class="btn btn-secondary" data-media-delete="${attr(media.id)}">Retirer l’image principale</button>`:''}
 </div></div>
 <div class="two-fields"><label>Visibilité<select id="media-visibility">${option('private','Privée',media?.visibility||((mediaKind==='npc')?'private':'public'))}${mediaKind==='spell'||mediaKind==='item'?'':option('public','Visible des joueurs autorisés',media?.visibility||((mediaKind==='npc')?'private':'public'))}</select></label>
 <label>Importer depuis l’appareil (JPG, PNG, WebP)<input id="media-file" type="file" accept="image/png,image/jpeg,image/webp,image/heic,image/heif,image/heic,image/heif" ${!allowed?'disabled':''}></label></div>
 <div class="art-gallery-options"><label class="inline-check"><input id="media-add-gallery" type="checkbox" ${gallery.length?'checked':''} ${gallery.length>=8?'disabled':''}> Ajouter en illustration secondaire (maximum 8 par fiche)</label><label>Légende facultative<input id="media-caption" maxlength="100" placeholder="Ex. Apparition dans la crypte"></label></div>
 <div class="crop-editor" id="media-crop-editor" hidden><h4>Recadrer avant import</h4><div class="two-fields"><label>Format<select id="media-crop-aspect"><option value="square">Carré (avatar)</option><option value="portrait">Portrait 3:4</option><option value="original">Original</option></select></label><label>Zoom<input id="media-crop-zoom" type="range" min="100" max="260" value="100"></label><label>Horizontal<input id="media-crop-x" type="range" min="0" max="100" value="50"></label><label>Vertical<input id="media-crop-y" type="range" min="0" max="100" value="50"></label></div><canvas id="media-crop-canvas" aria-label="Aperçu du cadrage"></canvas><p class="muted small">Ajuste le format et les curseurs. L'image enregistrée correspond exactement à cet aperçu.</p></div>
 <button class="btn btn-primary" data-media-upload ${!allowed?'disabled':''}>＋ Importer cette image</button><p class="muted small">Images recadrées et compressées dans le navigateur (2 Mo maximum). Le serveur les conserve sur votre PC dans <code>data/media</code>, à sauvegarder avec la campagne.</p>`:
 '<p class="muted">Aucune fiche disponible dans cette catégorie. Ajoutez d’abord un personnage, une créature, un sort ou un objet.</p>'}
 </section>
 ${current&&gallery.length?`<section class="panel"><div class="panel-top"><h3>Galerie · ${gallery.length}/8</h3><span class="mini-pill">Image principale et alternatives</span></div>
 <div class="gallery-grid">${gallery.map(m=>`<article class="gallery-tile">${imageUrl(m)?`<img loading="lazy" src="${attr(imageUrl(m))}" alt="${attr(m.caption||'Illustration')}">`:''}<div class="muted small">${esc(m.caption||'Sans légende')}</div><div class="tagrow"><span class="mini-pill">${m.id===media?.id?'Principale':'Secondaire'}</span><span class="mini-pill">${m.visibility==='private'?'Privée':'Partagée'}</span></div><div class="gallery-actions">${allowed&&m.id!==media?.id?`<button class="btn btn-secondary" data-media-feature="${attr(m.id)}">Principale</button>`:''}<button class="btn btn-secondary" data-media-preview="${attr(m.id)}">Agrandir</button>${allowed?`<button class="btn btn-secondary" data-media-delete="${attr(m.id)}">Supprimer</button>`:''}${actor==='mj'?`<button class="btn btn-primary" data-media-show="${attr(m.id)}">Présenter</button>`:''}</div></article>`).join('')}</div>
 ${actor==='mj'?`<label>Titre affiché aux joueurs pendant la présentation<input id="spotlight-title" maxlength="90" value="Illustration du Maître du Jeu" placeholder="Ex. Le mystérieux adversaire"></label><p class="muted small">Même si l'image vient d'une créature secrète, seuls ce titre et l'image seront diffusés. Le nom et les caractéristiques du monstre restent cachés.</p>`:''}</section>`:''}
 ${mediaKind==='item'?`<section class="panel"><div class="panel-top"><h3>Inventaire illustrable</h3></div><p class="muted small">Objets et équipements personnalisés, sans modification automatique des statistiques.</p>
 <form id="media-item-add" class="two-fields"><label>Personnage<select name="characterId">${state.characters.filter(p=>actor==='mj'||p.id===actor).map(p=>option(p.id,p.name,selected)).join('')}</select></label><label>Nom de l’objet<input name="name" required maxlength="85" placeholder="Ex. Épée longue +1"></label><label>Note facultative<input name="description" maxlength="280" placeholder="Provenance ou propriétés"></label><button class="btn btn-secondary" type="submit">Ajouter à l’inventaire</button></form>
 ${state.characters.filter(p=>actor==='mj'||p.id===actor).flatMap(p=>(p.inventoryItems||[]).map(x=>`<div class="art-inventory-row">${artwork('item',x.id,p.id,'art-tiny',x.name)}<strong>${esc(x.name)}</strong><small>${esc(p.name)}</small><button type="button" class="text-button danger-text" data-media-item-remove="${attr(x.id)}" data-for="${attr(p.id)}">Retirer</button></div>`)).join('')||'<p class="muted">Aucun objet illustrable.</p>'}</section>`:''}
 <section class="panel"><div class="panel-top"><h3>Bibliothèque d’illustrations existantes</h3><span class="mini-pill">${A.byKind(mediaKind).length} icônes · auteurs crédités</span></div>
 ${mediaKind==='character'&&actor==='mj'?`<div class="portrait-reset"><p class="muted small">Les portraits d’aventuriers (classes et espèces) sont proposés en premier. Sans image choisie, chaque personnage reçoit l’icône de sa classe.</p><button type="button" class="btn btn-secondary" data-task="portraits-by-class">Remettre les portraits selon la classe</button></div>`:''}<p class="muted small">Icônes fantasy de <a href="https://game-icons.net/" target="_blank" rel="noopener noreferrer">Game-icons.net</a> (Lorc, Delapouite et d’autres auteurs, CC BY 3.0). Ce ne sont pas des illustrations officielles D&D. Elles sont hébergées sur votre serveur : aucune connexion Internet n’est nécessaire. Le fichier <code>CREDITS_ILLUSTRATIONS.md</code> détaille les crédits.</p>
 <label>Recherche dans le catalogue<input id="art-search" type="search" data-live-filter=".art-choice" value="${attr(artSearch)}" placeholder="Ex. dragon, fire, sword…" autocomplete="off"></label>${current?'':'<p class="muted small">Les illustrations s’activent dès qu’une fiche est choisie au-dessus.</p>'}
 ${(()=>{const tile=e=>`<button type="button" class="art-choice ${e.id===suggestedPortrait?'art-suggested':''}" data-art-id="${attr(e.id)}" ${!allowed?'disabled':''} title="${attr(e.label||e.name)} — ${attr(e.artist)}"><img src="${attr(A.src(e.id))}" alt="" loading="lazy" referrerpolicy="no-referrer"><span>${esc(e.label||e.name.replace(/\b\w/g,c=>c.toUpperCase()))}</span><small>${e.id===suggestedPortrait?'Suggéré pour sa classe':esc(e.artist)}</small></button>`;
  if(mediaKind!=='character'||!A.isPortrait)return `<div class="art-grid">${works.map(tile).join('')}</div>`;const heroes=works.filter(e=>A.isPortrait(e.id)),beasts=works.filter(e=>!A.isPortrait(e.id));
  return `${heroes.length?`<h4 class="art-group-title">Aventuriers (classes et espèces)</h4><div class="art-grid">${heroes.map(tile).join('')}</div>`:''}${beasts.length?`<details class="ux-fold art-beasts"><summary>Créatures (forme animale, lycanthrope, déguisement…) · ${beasts.length} <span aria-hidden="true">⌄</span></summary><div class="ux-fold-content"><div class="art-grid">${beasts.map(tile).join('')}</div></div></details>`:''}`;})()}${works.length?'<p class="muted small">Clique sur une illustration pour l’associer à la fiche sélectionnée.</p>':'<p class="muted">Aucun résultat.</p>'}
 </section>`;
}
function previewMediaHtml(){
 const media=images().find(x=>x.id===previewMediaId);if(!media)return '';
 return `<div class="spotlight-overlay" role="dialog" aria-modal="true" aria-label="Agrandissement privé de l'illustration"><div class="spotlight-panel"><div class="panel-top"><h2>${esc(media.caption||'Illustration')}</h2><button class="icon-close" data-task="preview-close" aria-label="Fermer">✕</button></div><img src="${attr(imageUrl(media))}" alt="Illustration en grand"></div></div>`;
}
function spotlightHtml(){
 const shown=state.spotlight;
 if(!shown||shown.id===spotlightDismissedId)return '';
 const url=shown.builtinId?A.src(shown.builtinId):'/api/media/'+encodeURIComponent(shown.mediaId);
 return `<div class="spotlight-overlay" role="dialog" aria-modal="true" aria-label="Illustration présentée"><div class="spotlight-panel"><div class="panel-top"><h2>${esc(shown.title)}</h2><button class="icon-close" data-task="${actor==='mj'?'spotlight-hide':'spotlight-dismiss'}" aria-label="Fermer l'illustration">✕</button></div><img src="${attr(url)}" alt="Illustration présentée par le MJ" referrerpolicy="no-referrer"><p class="muted small">${actor==='mj'?'Cette illustration est visible par tous les joueurs connectés.':'Illustration présentée par le Maître du Jeu.'}</p></div></div>`;
}
function clearCrop(){if(cropImage?.close)cropImage.close();cropImage=null;}
async function loadCrop(file){
 clearCrop();if(!file)return;
 if(!['image/png','image/jpeg','image/webp','image/heic','image/heif'].includes(file.type)||file.size>15_000_000)throw Error('Fichier image incompatible ou trop volumineux (15 Mo maximum).');
 cropImage=typeof createImageBitmap==='function'?await createImageBitmap(file):await new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),im=new Image();im.onload=()=>{URL.revokeObjectURL(url);resolve(im);};im.onerror=()=>{URL.revokeObjectURL(url);reject(Error('Image non reconnue.'));};im.src=url;});
 const editor=document.querySelector('#media-crop-editor');if(editor)editor.hidden=false;
 drawCrop();
}
function drawCrop(){
 const image=cropImage,canvas=document.querySelector('#media-crop-canvas');if(!image||!canvas)return;
 const ratio=document.querySelector('#media-crop-aspect')?.value||'square';
 const aspect=ratio==='square'?1:ratio==='portrait'?3/4:image.width/image.height;
 const maxEdge=1024;
 canvas.width=aspect>=1?maxEdge:Math.max(1,Math.round(maxEdge*aspect));
 canvas.height=aspect>=1?Math.max(1,Math.round(maxEdge/aspect)):maxEdge;
 const zoom=Number(document.querySelector('#media-crop-zoom')?.value||100)/100;
 const posX=Number(document.querySelector('#media-crop-x')?.value||50)/100;
 const posY=Number(document.querySelector('#media-crop-y')?.value||50)/100;
 const iw=image.width,ih=image.height,bw=Math.min(iw,ih*aspect),bh=bw/aspect;
 const sw=bw/zoom,sh=bh/zoom,sx=(iw-sw)*posX,sy=(ih-sh)*posY;
 const ctx=canvas.getContext('2d');if(ctx)ctx.drawImage(image,sx,sy,sw,sh,0,0,canvas.width,canvas.height);
}
async function toUpload(file){
 if(!file||!['image/png','image/jpeg','image/webp','image/heic','image/heif'].includes(file.type))throw Error('Sélectionnez une image JPG, PNG, WebP ou HEIC compatible avec votre navigateur.');
 if(file.size>15_000_000)throw Error('Le fichier source ne doit pas dépasser 15 Mo.');
 let canvas=document.querySelector('#media-crop-canvas');
 if(!cropImage||!canvas){
  const img=typeof createImageBitmap==='function'?await createImageBitmap(file):await new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),im=new Image();im.onload=()=>{URL.revokeObjectURL(url);resolve(im);};im.onerror=()=>{URL.revokeObjectURL(url);reject(Error('Image non reconnue par ce navigateur.'));};im.src=url;});
  const scale=Math.min(1,1280/Math.max(img.width,img.height));
  canvas=document.createElement('canvas');canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Impossible de redimensionner l’image.');ctx.drawImage(img,0,0,canvas.width,canvas.height);img.close?.();
 }
 const b=await new Promise(r=>canvas.toBlob(r,'image/webp',.80));if(!b||b.size>2_000_000)throw Error('Image trop lourde après compression.');
 const data=await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(String(fr.result).split(',')[1]);fr.onerror=()=>reject(Error('Lecture du fichier impossible.'));fr.readAsDataURL(b);});
 return {mime:b.type==='image/webp'?'image/webp':'image/png',imageBase64:data};
}
function mediaSelection(){const target=mediaTargets(mediaKind).find(x=>x.characterId+'|'+x.id===mediaTarget);if(!target)throw Error('Choisissez une fiche.');return {kind:mediaKind,entityId:target.id,characterId:target.characterId,visibility:document.querySelector('#media-visibility')?.value||'private',baseVersion:version};}
async function mediaChange(mode,more={}){try{const body={...mediaSelection(),mode,addToGallery:document.querySelector('#media-add-gallery')?.checked===true,caption:document.querySelector('#media-caption')?.value||'',...more};const out=await api('media/change','POST',body);version=out.version;viewer=out.viewer;state=out.state;clearCrop();render();toast(mode==='delete'?'Illustration retirée.':'Illustration enregistrée.');}catch(e){if(e.status===409)await refresh();toast(e.message,true);}}
function chooseMedia(kind,characterId,entityId){clearCrop();page='illustrations';mediaKind=kind;mediaTarget=(characterId||'')+'|'+entityId;artSearch='';render();}

