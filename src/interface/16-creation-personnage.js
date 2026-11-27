// ——— 16 · Création et progression des personnages ———
const CG=(typeof window!=='undefined'&&window.ChroniquesClassGuide)||(typeof require==='function'?(()=>{try{return require('./class-guide.js');}catch{return null;}})():null);
function wizardScores(form){const base=Object.fromEntries(['str','dex','con','int','wis','cha'].map(k=>[k,Number(form.querySelector('[name="base_'+k+'"]')?.value)||null]));let final=base;try{const r=O.compute(originPayload(form),state.edition);if(r&&r.finalScores)final={...base,...r.finalScores};}catch{}return {base,final};}
function wizardRefresh(form){if(!CG||!form)return;const cls=form.querySelector('[name="classId"]')?.value,c=CG.info(cls),box=form.querySelector('#wizard-class-info');
 if(box)box.innerHTML=c?`<p><strong>${esc(c.name)}</strong> — ${esc(c.pitch)}</p><ul class="wizard-facts"><li>Dé de vie : d${c.die}</li><li>Caractéristique principale : ${esc(CG.LABEL[c.primary])}</li><li>Sauvegardes maîtrisées : ${esc(c.savesLabel.join(' et '))}</li><li>Magie : ${{full:'lanceur de sorts complet',half:'semi-lanceur (dès le niveau '+(state.edition==='2024'?'1':'2')+')',pact:'magie de pacte',third:'tiers de lanceur',none:'aucune (sauf sous-classe)'}[c.caster]||'—'}</li></ul>`:'<p class="muted small">Choisissez une classe pour voir son dé de vie, ses sauvegardes et sa caractéristique principale.</p>';
 const {base,final}=wizardScores(form),pb=form.querySelector('#wizard-pointbuy');
 if(pb&&Object.values(base).every(v=>v!==null)){const r=CG.pointBuy(base);pb.textContent=r.valid?'Achat de points : '+r.total+' / 27 points utilisés.':'Scores hors achat de points (dés réels ou répartition libre) : à valider avec le MJ.';}
 const hp=form.querySelector('#wizard-hp-info');if(hp){const con=final.con||10,dex=final.dex||10;const sh=c?CG.startingHp(cls,con):null,sa=CG.startingAc(dex);
  hp.innerHTML=`<p>${c?`Au niveau 1 : <strong>${sh} PV</strong> (d${c.die} au maximum ${CG.mod(con)>=0?'+':'−'} ${Math.abs(CG.mod(con))} de Constitution).`:'Choisissez une classe à l’étape 1 pour calculer les PV.'} Sans armure : <strong>CA ${sa}</strong> (10 + modificateur de Dextérité). Avec une armure, reportez la CA indiquée par l’objet.</p>${c?`<button type="button" class="btn btn-secondary" data-wizard-apply data-hp="${sh}" data-ac="${sa}">Utiliser ces valeurs</button>`:''}`;}}
function wizardGo(form,delta){const cur=Number(form.dataset.step)||1;if(delta>0){const fs=form.querySelector('.wizard-step[data-step="'+cur+'"]');for(const el of fs.querySelectorAll('input,select'))if(!el.checkValidity()){el.reportValidity();return;}}
 const next=Math.max(1,Math.min(3,cur+delta));form.dataset.step=String(next);wizardRefresh(form);const f=form.querySelector('.wizard-step[data-step="'+next+'"] input,.wizard-step[data-step="'+next+'"] select');if(f)f.focus();}
function mcMissingHtml(r){return r.items.map(x=>`<span class="mc-miss"><span>${esc(x.name)}</span> : <span>${esc(x.need)}</span></span>`).join(' ; ');}
function mcMissingText(r){const T=(typeof window!=='undefined'&&window.ChroniquesI18n?.t)||(x=>x);return r.items.map(x=>T(x.name)+' : '+T(x.need)).join(' ; ');}
// 5.3 : multiclassage — classes, niveaux par classe, sous-classes, prérequis et dés de vie.
function multiclassPanel(p,edit){if(!P.classesOf||state.edition==='custom')return '';const list=P.classesOf(p);const name=id=>P.CLASSES[id]?.name||id;const prog=P.progression(p,state.edition);
 const others=Object.keys(P.CLASSES).filter(id=>!list.some(c=>c.classId===id));const primaryLevel=list[0].level;const hd=P.hitDice(p);
 return `<section class="panel mc-panel"><div class="panel-top"><h3>Classes</h3><span class="mc-pills">${list.length>1?'<span class="mini-pill">Multiclassage</span> ':''}<span class="mini-pill">Niveau ${p.level}</span></span></div>
 <ul class="mc-list">${list.map(c=>`<li class="mc-row"><div><strong>${esc(c.classId?name(c.classId):(p.job||'Classe de départ'))} ${c.level}</strong>${c.primary?' <span class="mini-pill">Classe de départ</span>':''}${c.subclass?` <small class="muted">· ${esc(c.subclass)}</small>`:''}${!c.primary&&prog.extraSubclassDue.includes(c.classId)?' <span class="mini-pill warn">Sous-classe à choisir</span>':''}</div>
 ${!c.primary&&edit?`<div class="mc-tools"><button type="button" class="btn btn-secondary" data-mc-op="level" data-mc-class="${attr(c.classId)}" data-mc-level="${c.level-1}" ${c.level<=1?'disabled':''} aria-label="Retirer un niveau de ${attr(name(c.classId))}">−</button><button type="button" class="btn btn-secondary" data-mc-op="level" data-mc-class="${attr(c.classId)}" data-mc-level="${c.level+1}" ${primaryLevel<=1?'disabled':''} aria-label="Ajouter un niveau de ${attr(name(c.classId))} (pris sur la classe de départ)">+</button>
  <form class="mc-sub-form" data-mc-class="${attr(c.classId)}"><label class="visually-hidden" for="mc-sub-${attr(c.classId)}">Sous-classe de ${esc(name(c.classId))}</label><input id="mc-sub-${attr(c.classId)}" name="subclass" maxlength="60" value="${attr(c.subclass)}" placeholder="Sous-classe"><button class="btn btn-secondary" type="submit">OK</button></form>
  <button type="button" class="text-button" data-mc-op="remove" data-mc-class="${attr(c.classId)}">Retirer</button></div>`:''}</li>`).join('')}</ul>
 <p class="small">Dés de vie : <strong>${hd.length?hd.map(x=>x.count+'d'+x.die).join(' + '):'—'}</strong>${prog.spells.casterLevel&&list.length>1?` · niveau de lanceur de sorts combiné : <strong>${prog.spells.casterLevel}</strong>`:''}${prog.spells.kind==='mixed'?' · magie de pacte à part':''}</p>
 ${list.length>1?'<p class="muted small">Le bonus de maîtrise dépend du niveau total ; les sauvegardes maîtrisées restent celles de la classe de départ. Attaque supplémentaire ne se cumule pas entre classes. Sorts connus et préparés : chaque classe séparément.</p>':''}
 ${edit&&others.length&&list.length<=P.MAX_EXTRA_CLASSES?`<details class="mc-add"><summary>＋ Ajouter une classe</summary><p class="muted small">Pour une nouvelle montée de niveau, utilisez « Monter de niveau » et choisissez la classe. Ici, vous répartissez les niveaux existants : la nouvelle classe prend un niveau à la classe de départ.</p>
  <form class="mc-add-form" data-pc="${attr(p.id)}"><label>Classe<select name="classId">${others.map(id=>{const r=P.canMulticlass(p,id);return `<option value="${id}">${esc(name(id))}${r.ok?'':' (prérequis non remplis)'}</option>`;}).join('')}</select></label>
  <div class="mc-info small" aria-live="polite">${mcInfo(p,others[0])}</div><button class="btn btn-secondary" type="submit" ${primaryLevel<=1?'disabled':''}>Ajouter la classe</button>${primaryLevel<=1?'<p class="muted small">La classe de départ doit garder au moins un niveau : montez d’abord de niveau.</p>':''}</form></details>`:''}</section>`;}
function mcInfo(p,id){if(!id)return '';const pre=P.prereqCheck(p,id);const all=P.canMulticlass(p,id);return `<p><span>Prérequis :</span> <span>${esc(pre.text)}</span> ${all.ok?'<strong>✓</strong>':`<span class="warn-text"><span>manque :</span> ${mcMissingHtml(all)}</span>`}</p><p><span>Maîtrises acquises :</span> <span>${esc(P.MC_PROFS[id])}</span>${state.edition==='2024'?' <span>(table 2014 du SRD : vérifiez la table de multiclassage de votre livre 2024)</span>':''}</p><p>Dé de vie : d${P.HIT_DIE[id]}.</p>`;}
function levelUpClassPicker(p,target){if(!P.classesOf||state.edition==='custom')return '';const list=P.classesOf(p);const have=new Set(list.map(c=>c.classId));const name=id=>P.CLASSES[id]?.name||id;
 const others=Object.keys(P.CLASSES).filter(id=>!have.has(id)&&list.length<=P.MAX_EXTRA_CLASSES);
 return `<label class="levelup-class">Classe qui gagne ce niveau<select data-levelup-class="${attr(p.id)}">${list.map(c=>`<option value="${attr(c.classId||'')}" ${c.classId===target?'selected':''}>${esc(c.classId?name(c.classId):(p.job||'Classe de départ'))} (niveau ${c.level} → ${c.level+1})</option>`).join('')}${others.length?`<optgroup label="Multiclassage : nouvelle classe">${others.map(id=>{const r=P.canMulticlass(p,id);return `<option value="${id}" ${id===target?'selected':''}>${esc(name(id))}${r.ok?'':' (prérequis non remplis)'}</option>`;}).join('')}</optgroup>`:''}</select></label>
 ${target&&!have.has(target)?(()=>{const r=P.canMulticlass(p,target);return `<p class="small ${r.ok?'':'warn-text'}">${r.ok?'✓ Prérequis remplis (13 dans les caractéristiques demandées).':'<span>Prérequis non remplis :</span> '+mcMissingHtml(r)+'. <span>Possible seulement avec l’accord du MJ.</span>'}</p>`;})():''}`;}
function levelUpModal(id){const p=L.findPc(state,id);if(!p||!CG)return '';const primary=P.primaryClass?P.primaryClass(p):null;const target=levelUpTarget||primary||'';const v=CG.levelUpPreview(p,state.edition,target);
 return `<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="lvl-title"><div class="panel-top"><h2 id="lvl-title">${esc(p.name)} : niveau ${v.from} → ${v.to}</h2><button class="icon-close" data-task="close-modal" aria-label="Fermer">✕</button></div>
 <form id="levelup-form" data-pc="${attr(p.id)}" data-class="${attr(v.classId||'')}">${levelUpClassPicker(p,v.classId)}<h3>Ce qui change</h3><ul class="wizard-facts">${v.changes.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
 <h3>Points de vie</h3>${v.hitDie?`<label class="inline-check"><input type="radio" name="hpMode" value="avg" checked> Valeur fixe : <strong>${v.average} PV</strong> (moyenne du d${v.hitDie} + ${v.conMod} CON)</label><label class="inline-check"><input type="radio" name="hpMode" value="roll"> J’ai lancé un vrai d${v.hitDie} :</label><label>Résultat du dé<input type="number" name="roll" min="1" max="${v.hitDie}" placeholder="1 à ${v.hitDie}"></label><p class="muted small">Le modificateur de Constitution (${v.conMod>=0?'+':''}${v.conMod}) est ajouté automatiquement ; minimum 1 PV.</p>`:`<label>PV gagnés (selon le livre)<input type="number" name="manual" min="1" max="40" value="1"></label>`}
 <button class="btn btn-primary" type="submit">Passer au niveau ${v.to}</button></form></div></div>`;}
function originFields(p,creating=false){
 const origin=p?.origin?.edition===state.edition?p.origin:null;
 const species=O.speciesFor(state.edition),backgrounds=O.backgroundsFor(state.edition);
 const scores=origin?.baseScores||p?.stats?.abilities||{};
 const variants=(state.edition==='2014'?O.VARIANTS_2014:O.VARIANTS_2024);
 const abilityChoices=Object.entries(O.ABILITIES).map(([k,label])=>option(k,label,'')).join('');
 const dist=origin?.distribution||'split';
 return `<div class="origin-fields">
  <div class="two-fields"><label>Espèce / race<select name="speciesId" required><option value="">Choisir l’espèce</option>${Object.entries(species).map(([k,v])=>option(k,v.name,origin?.speciesId||'')).join('')}${option('custom','Autre / personnalisée (saisie manuelle)',origin?.speciesId||'')}</select></label>
  <label>Espèce personnalisée <input name="speciesName" maxlength="65" placeholder="Ex. Aasimar (hors SRD)" value="${attr(origin?.speciesId==='custom'?origin?.speciesName:'')}"></label></div>
  <label>Sous-race, lignée ou ascendance (si applicable)<select name="variantId"><option value="">À choisir / aucune</option>${Object.entries(variants).flatMap(([sid,opts])=>Object.entries(opts).map(([vid,detail])=>option(sid+':'+vid,detail.name,origin?.variantId?origin.speciesId+':'+origin.variantId:''))).join('')}</select></label>
  <div class="two-fields"><label>Historique<select name="backgroundId" required><option value="">Choisir l’historique</option>${Object.entries(backgrounds).map(([k,v])=>option(k,v.name,origin?.backgroundId||'')).join('')}${option('custom','Autre / personnalisé (manuel)',origin?.backgroundId||'')}</select></label>
  <label>Historique personnalisé <input name="backgroundName" maxlength="65" placeholder="Ex. Artisan" value="${attr(origin?.backgroundId==='custom'?origin?.backgroundName:'')}"></label></div>
  <div class="eyebrow inner">Scores avant les bonus d’origine</div>
  <div class="origin-score-grid">${Object.entries(O.ABILITIES).map(([k,label])=>`<label>${label}<input name="base_${k}" type="number" min="1" max="20" placeholder="—" value="${scores[k]??''}"></label>`).join('')}</div>
  ${state.edition==='2024'?`<div class="two-fields"><label>Répartition (historique)<select name="distribution">${option('split','+2 sur un score, +1 sur un autre',dist)}${option('triple','+1 sur les trois scores',dist)}</select></label><label>+2 sur<select name="plus2">${Object.entries(O.ABILITIES).map(([k,l])=>option(k,l,origin?.plus2||'int')).join('')}</select></label></div>
  <div class="two-fields"><label>+1 sur<select name="plus1">${Object.entries(O.ABILITIES).map(([k,l])=>option(k,l,origin?.plus1||'wis')).join('')}</select></label><label>Pour un historique personnalisé : 3 scores au choix<div class="origin-triple-select">${[0,1,2].map((i)=>`<select aria-label="Caractéristique ${i+1} de l’historique personnalisé" name="eligible_${i}">${Object.entries(O.ABILITIES).map(([k,l])=>option(k,l,origin?.eligible?.[i]||['str','dex','con'][i])).join('')}</select>`).join('')}</div></label></div>`:''}
  <label>Précisions manuelles (sous-race, lignée, don, équipement... )<textarea name="manualDetails" maxlength="280" rows="2" placeholder="À valider avec le MJ">${esc(origin?.manualDetails||'')}</textarea></label>
  <div class="origin-preview" data-origin-preview>Choisissez une espèce et un historique pour voir les capacités et bonus associés.</div>
 </div>`;
}
function originPayload(form){const d=Object.fromEntries(new FormData(form).entries());return {
 speciesId:d.speciesId,speciesName:d.speciesName,variantId:d.variantId?.startsWith(d.speciesId+':')?d.variantId.slice(d.speciesId.length+1):'',backgroundId:d.backgroundId,backgroundName:d.backgroundName,
 baseScores:Object.fromEntries(O.KEYS.map(k=>[k,d['base_'+k]===''?null:Number(d['base_'+k])])),
 distribution:d.distribution,plus2:d.plus2,plus1:d.plus1,
 customEligible:[d.eligible_0,d.eligible_1,d.eligible_2],manualDetails:d.manualDetails||''};}
function updateOriginPreview(form){const target=form.querySelector('[data-origin-preview]');if(!target)return;
 let v=originPayload(form);const species=O.speciesFor(state.edition)[v.speciesId],bg=O.backgroundsFor(state.edition)[v.backgroundId];
 if(state.edition==='2024'&&bg?.scores?.length){
  const plus2=form.querySelector('[name="plus2"]'),plus1=form.querySelector('[name="plus1"]');
  if(plus2&&plus1&&(!bg.scores.includes(plus2.value)||!bg.scores.includes(plus1.value)||plus2.value===plus1.value)){
   plus2.value=bg.scores[0];plus1.value=bg.scores[1];v=originPayload(form);
  }
 }
 const variantSelect=form.querySelector('[name="variantId"]');
 if(variantSelect){
  const allowed=state.edition==='2014'?O.VARIANTS_2014:O.VARIANTS_2024;
  if(variantSelect.value&&!variantSelect.value.startsWith(v.speciesId+':')){variantSelect.value='';v=originPayload(form);}
  [...variantSelect.options].forEach(op=>{if(op.value)op.hidden=!op.value.startsWith(v.speciesId+':');});
 }
 const name=species?.name||v.speciesName||'Espèce à définir',hist=bg?.name||v.backgroundName||'Historique à définir';
 const parts=[`<strong>${esc(name)} · ${esc(hist)}</strong>`];
 if(species){parts.push(`Vitesse de référence : ${species.speed} m. ${species.traits.map(esc).join(' · ')}.`);
  const variants=state.edition==='2014'?O.VARIANTS_2014:O.VARIANTS_2024;
  const variantId=v.variantId;const variant=variants[v.speciesId]?.[variantId];
  if(variant)parts.push(`Variante : ${esc(variant.name)}. ${variant.traits?.map(esc).join(' · ')||'Capacités particulières à renseigner manuellement'}.`);
 }
 if(bg){if(bg.scores.length)parts.push(`Caractéristiques autorisées : ${bg.scores.map(k=>O.ABILITIES[k]).join(', ')}.`);
  if(bg.skills.length)parts.push(`Compétences accordées : ${bg.skills.map(k=>P.SKILLS[k]?.[0]||k).join(', ')}.`);
  if(bg.feat)parts.push(`Don d’origine : ${esc(bg.feat)} (effets manuels).`);
  if(bg.tool)parts.push(`Outil : ${esc(bg.tool)}.`);}
 if(state.edition==='2014')parts.push('Seuls les bonus raciaux de base sont calculés ; vérifier sous-races et variantes.');
 else if(v.backgroundId==='custom')parts.push('Historique personnalisé : choix des trois caractéristiques à confirmer avec le MJ.');
 else parts.push('Les bonus 2024 viennent de l’historique, pas de l’espèce.');
 target.innerHTML=parts.join('<div class="origin-preview-line"></div>');
}
function originPanel(p,edit){const o=p.origin?.edition===state.edition?p.origin:null;
 return `<section class="panel origin-panel"><div class="panel-top"><h3>✧ Origines · Espèce & historique</h3><span class="mini-pill">${esc(state.edition==='2014'?'Races 2014':'Espèces 2024')}</span></div>
 ${o?`<div class="origin-summary"><div><small>Espèce</small><strong>${esc(o.speciesName)}${o.variantName?` · ${esc(o.variantName)}`:''}</strong></div><div><small>Historique</small><strong>${esc(o.backgroundName)}</strong></div><div><small>Bonus</small><strong>${Object.entries(o.bonuses).filter(([k,v])=>v).map(([k,v])=>`${O.ABILITIES[k]} +${v}`).join(', ')||'Manuels'}</strong></div></div>
 <p class="muted small">${o.grantedSkills?.length?'Compétences d’historique : '+o.grantedSkills.map(k=>P.SKILLS[k]?.[0]||k).join(', ')+'. ':''}${o.originFeat?'Don : '+esc(o.originFeat)+' (effets à configurer). ':''}${o.tool?'Outils : '+esc(o.tool)+'. ':''}${o.speciesTraits?.length?'Traits raciaux à examiner : '+o.speciesTraits.map(esc).join(' · ')+'. ':''}${o.manualDetails?'Notes : '+esc(o.manualDetails):''}</p>`:'<p class="muted small">Aucune origine automatisée enregistrée. Les caractéristiques actuelles ne sont pas modifiées tant que vous ne validez pas.</p>'}
 ${edit&&state.edition!=='custom'?`<details class="origin-editor"><summary>${o?'Modifier l’origine':'Configurer l’origine du personnage'}</summary><form id="origin-form">${originFields(p)}<button class="btn btn-primary" type="submit">Enregistrer l’espèce et l’historique</button><p class="muted small">Les scores ci-dessus sont AVANT les bonus. Les caractéristiques existantes sont conservées comme base lors du premier enregistrement. Les capacités SRD prises en charge apparaissent sous la fiche après enregistrement. Les choix et effets particuliers restent à valider.</p></form></details>`:state.edition==='custom'?'<p class="muted small">Règles personnalisées : origine manuelle dans « Modifier la fiche ».</p>':''}</section>`;
}
function heritagePanel(p,edit){
 const hasOrigin=p.origin?.edition===state.edition,rows=H.features(p,state.edition),feats=H.featList(p);
 if(!hasOrigin&&!feats.length)return `<section class="panel heritage-panel"><h3>✦ Capacités d’espèce & dons</h3><p class="muted small">Configurez d’abord l’espèce et l’historique dans « Origines » pour afficher les capacités raciales automatiques.</p></section>`;
 const active=rows.filter(f=>f.unlocked),locked=rows.filter(f=>!f.unlocked);
 const display=(f)=>`<div class="heritage-entry"><div class="heritage-info"><strong>${esc(f.name)}</strong><small>${f.kind==='sort'?'Sort racial · ':''}${f.uses===null?'Trait / aide-mémoire':`Niveau ${f.level} · ${f.rest==='short'?'repos court ou long':'repos long'}`}</small><p>${esc(f.description)}</p></div>${f.uses!==null?`<div class="heritage-count"><strong>${f.left} / ${f.uses}</strong><div class="inline-actions"><button type="button" data-heritage="${attr(f.id)}" data-delta="-1" ${!edit||f.spent<=0?'disabled':''} title="Annuler une utilisation">+</button><button type="button" data-heritage="${attr(f.id)}" data-delta="1" ${!edit||f.left<=0?'disabled':''} title="Marquer une utilisation">−</button></div></div>`:''}</div>`;
 return `<section class="panel heritage-panel"><div class="panel-top"><h3>✦ Capacités d’espèce & dons</h3><span class="mini-pill">Niveau ${p.level} · ${active.length} débloquées</span></div>
 <p class="muted small">Les utilisations gratuites sont séparées des emplacements de sort. Les effets, coûts en actions et déclencheurs se valident en partie ; utiliser un compteur ne lance pas automatiquement un sort.</p>
 ${active.length?`<div class="heritage-list">${active.map(display).join('')}</div>`:'<p class="muted small">Aucune capacité automatique répertoriée.</p>'}
 ${locked.length?`<details class="heritage-locked"><summary>${locked.length} capacité(s) à débloquer</summary><div class="heritage-list">${locked.map(f=>`<div class="heritage-entry"><div><strong>Niveau ${f.level} · ${esc(f.name)}</strong><p>${esc(f.description)}</p></div></div>`).join('')}</div></details>`:''}
 <div class="panel-top" style="margin-top:16px"><h3>Dons et capacités personnalisés</h3></div>
 ${p.origin?.originFeat?`<p class="muted small">Don d’origine proposé : <strong>${esc(p.origin.originFeat)}</strong> (effets à valider selon les règles).</p>`:''}
 ${feats.map(f=>`<div class="heritage-entry"><div><strong>${f.unlocked?'✓ ':`Niveau ${f.level} · `}${esc(f.name)}</strong><p>${esc(f.description||'Effet à vérifier avec le MJ.')}</p></div>${edit?`<button type="button" class="text-button" data-remove-feat="${attr(f.id)}">Retirer</button>`:''}</div>`).join('')}
 ${edit?`<details class="origin-editor"><summary>＋ Enregistrer un don / une capacité spéciale</summary><form id="feat-form"><label>Nom du don<input name="name" maxlength="70" required placeholder="Ex. don choisi au niveau 4"></label><label>Niveau de déblocage<input name="level" type="number" min="1" max="20" value="${p.level}" required></label><label>Effet (manuel)<textarea name="description" rows="2" maxlength="280" placeholder="Conditions ou rappel de règles"></textarea></label><button class="btn btn-primary" type="submit">Ajouter à la fiche</button></form></details>`:''}
 </section>`;
}
