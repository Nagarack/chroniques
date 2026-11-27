// ——— 29 · Glisser-déposer, changements ———
document.addEventListener('toggle',event=>{if(event.target.matches?.('.fight-customize'))fightCustomizeOpen=event.target.open;else if(event.target.matches?.('.workspace-customize'))deskCustomizeOpen=event.target.open;},true);
document.addEventListener('dragstart',event=>{
 const fightHandle=event.target.closest?.('[data-fight-drag]');
 if(fightHandle&&actor==='mj'&&page==='combat'&&window.matchMedia('(min-width: 901px)').matches){
  fightDrag=fightHandle.dataset.fightDrag;
  try{event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',fightDrag);}catch{}
  fightHandle.closest('.fight-panel')?.classList.add('workspace-dragging');return;
 }
 const handle=event.target.closest?.('[data-workspace-drag]');
 if(!handle||actor!=='mj'||!window.matchMedia('(min-width: 901px)').matches)return;
 deskDrag=handle.dataset.workspaceDrag;
 try{event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',deskDrag);}catch{}
 handle.closest('.workspace-panel')?.classList.add('workspace-dragging');
});
document.addEventListener('dragover',event=>{
 if(fightDrag&&actor==='mj'){
  const target=event.target.closest?.('[data-fight-panel]');if(target&&target.dataset.fightPanel!==fightDrag){event.preventDefault();if(event.dataTransfer)event.dataTransfer.dropEffect='move';}return;
 }
 if(!deskDrag||actor!=='mj')return;
 const target=event.target.closest?.('[data-workspace-panel]');
 if(!target||target.dataset.workspacePanel===deskDrag)return;
 event.preventDefault();if(event.dataTransfer)event.dataTransfer.dropEffect='move';
});
document.addEventListener('drop',event=>{
 if(fightDrag&&actor==='mj'){
  const target=event.target.closest?.('[data-fight-panel]'),moving=fightDrag;fightDrag='';
  if(target&&target.dataset.fightPanel!==moving){event.preventDefault();const pos=fightLayout.order.indexOf(target.dataset.fightPanel);if(pos>=0)fightChange('move',moving,pos);}return;
 }
 if(!deskDrag||actor!=='mj')return;
 const target=event.target.closest?.('[data-workspace-panel]');const moving=deskDrag;deskDrag='';
 if(!target||target.dataset.workspacePanel===moving)return;
 event.preventDefault();const position=deskLayout.order.indexOf(target.dataset.workspacePanel);
 if(position>=0)deskChange('move',moving,position);
});
document.addEventListener('dragend',()=>{fightDrag='';deskDrag='';document.querySelectorAll('.workspace-dragging').forEach(el=>el.classList.remove('workspace-dragging'));});
document.addEventListener('click',delegateClick);
document.addEventListener('change',event=>{const el=event.target;
 if(el.matches?.('[data-march-rank]')){act('marchRank',{pcId:el.dataset.marchRank,rank:el.value});return;}
 if(el.matches?.('[data-jump-spell]')){jumpSpell=el.checked;render();return;}
 if(el.matches?.('[data-sug-sort]')){adminSort=el.value;render();return;}
 if(el.matches?.('[data-clue-link]')){const other=el.value;el.value='';if(other)act('clueLink',{clueId:el.dataset.clueLink,otherId:other});return;}
 if(el.matches?.('[data-token-elev]')){act('mapTokenElev',{id:el.dataset.map,tokenId:el.dataset.tokenElev,elev:Number(el.value)||0});return;}
 if(el.matches?.('[data-health-words]')){act('healthWords',{on:el.checked}).then(ok=>{if(ok)toast(el.checked?'Les joueurs voient l’état de santé des créatures aux PV cachés.':'États de santé masqués aux joueurs.');});return;}
 if(el.matches?.('[data-item-into]')){act('itemMove',{id:el.dataset.inventoryFor,itemId:el.dataset.itemInto,into:el.value||''});return;}
 if(el&&el.id==='hex-fog'){act('mapHexFog',{id:el.dataset.map,on:el.checked});return;}
 if(el&&el.id==='wall-snap'){wallSnap=el.checked;return;}
 if(el&&el.id==='spell-class-pick'){spellClassPick=el.value;render();setTimeout(()=>document.getElementById('spell-class-pick')?.focus(),30);return;}
 if(el&&el.name==='ref'&&el.closest&&el.closest('.trap-form')){const f=el.closest('.trap-form');const fill=()=>{const lines=trapRuleLines(el.value)||[];const pick=re=>{for(const l of lines){if(re.test(l)){const m=/\b(?:DD|DC) (\d+)/.exec(l);if(m)return m[1];}}return '';};
  const set=(n,v)=>{if(v&&!f.elements[n].value)f.elements[n].value=v;};set('detectDc',pick(/Perception|Investigation|Arcanes|Arcana/));set('disarmDc',pick(/outils de voleur|thieves|dissipation|dispel/i));set('saveDc',pick(/sauvegarde|saving throw/i));};if(R&&R.load)R.load().then(fill).catch(()=>{});else fill();return;}
 if(el&&el.name==='classId'&&el.closest&&el.closest('.mc-add-form')){const f=el.closest('.mc-add-form');const box=f.querySelector('.mc-info');const p=L.findPc(state,f.dataset.pc);if(box&&p)box.innerHTML=mcInfo(p,el.value);return;}
 if(el&&el.dataset&&el.dataset.levelupClass!==undefined){levelUpTarget=el.value;render();setTimeout(()=>document.querySelector('[data-levelup-class]')?.focus(),30);return;}
 if(el&&el.dataset&&el.dataset.tokenLight!==undefined){act('mapTokenLight',{id:el.dataset.map,tokenId:el.dataset.tokenLight,values:{light:el.value}});return;}
 if(el&&el.dataset&&el.dataset.tokenSight!==undefined){act('mapTokenLight',{id:el.dataset.map,tokenId:el.dataset.tokenSight,values:{sight:Number(el.value)||0}});return;}
 if(el&&el.dataset&&el.dataset.dtKind!==undefined&&DTM){const f=el.closest('form');const k=DTM.KINDS[el.value];if(f&&k){const cr=f.querySelector('.dt-craft');if(cr)cr.hidden=el.value!=='artisanat';const hint=f.querySelector('.dt-hint');if(hint)hint.textContent=k.hint;if(el.value!=='artisanat'&&!f.dataset.dtId){const r=DTM.suggest(el.value);f.elements.daysTotal.value=r.days;f.elements.costGp.value=r.cost;}}return;}
 if(el&&el.id==='charter-delay'){act('charterOptions',{values:{delay:el.checked}}).then(ok=>{if(ok)toast(el.checked?'« Retarder son tour » autorisé.':'« Retarder son tour » désactivé.');});return;}
 if(el.dataset&&el.dataset.memberRoleSelect!==undefined){const role=el.value,name=el.dataset.memberName;const msg=role==='gm'?'Nommer '+name+' co-MJ complet ? Cette personne pourra consulter et modifier toutes les fiches et notes secrètes de la campagne.':role==='assistant'?'Nommer '+name+' co-MJ créatures ? Pendant le combat, cette personne gérera les monstres (PV, états, actions, tour suivant) depuis le Poste co-MJ, sans accès à vos notes, au carnet ni aux autres fiches. Elle garde son personnage.':'Rendre à '+name+' le rôle de joueur ?';
  if(!confirm(msg)){render();return;}api('member/role','POST',{userId:el.dataset.memberRoleSelect,role}).then(()=>refresh()).then(()=>toast('Rôle mis à jour.')).catch(e=>{toast(e.message,true);render();});return;}
 if(el.dataset&&el.dataset.travelPace!==undefined){act('travelPace',{pace:el.value});return;}
 if(el.dataset&&el.dataset.arcFrom!==undefined){arcFrom=el.value;render();return;}
 if(el.dataset&&el.dataset.androidNotify!==undefined){ANDROID?.setNotify(el.checked);return;}
 if(el.dataset&&el.dataset.androidLive!==undefined){ANDROID?.setLive(el.checked);return;}
 if(el.dataset&&el.dataset.pushTurn!==undefined){api('push/prefs','POST',{turn:el.checked}).then(r=>{if(pushInfo)pushInfo.prefs=r.prefs;toast(el.checked?'Vous serez prévenu à votre tour.':'Plus de notification à votre tour.');}).catch(e=>toast(e.message,true));return;}
 if(el.dataset&&el.dataset.stashWithdraw!==undefined){act('stashSettings',{withdraw:el.value});return;}
 if(el.dataset&&el.dataset.turnTimerSet!==undefined){act('turnTimer',{seconds:Number(el.value)});return;}
 if(el.dataset&&el.dataset.bestiaryCr!==undefined){bestiaryCr=el.value;render();return;}
 if(el.dataset&&el.dataset.qoToggle){act('questObjectiveSet',{id:el.dataset.quest,objectiveId:el.dataset.qoToggle,values:{done:el.checked}});return;}
 if(el.dataset&&el.dataset.ambVolume!==undefined){act('ambienceVolume',{volume:Number(el.value)/100});return;}
 if(el.dataset&&el.dataset.ambPlayers!==undefined){act('ambiencePlayers',{on:el.checked});return;}
 if(el.dataset&&el.dataset.defense){const [mode,did,dtype]=el.dataset.defense.split('|');act(mode==='npc'?'npcDefense':'defense',{id:did,type:dtype,value:el.value});return;}
 if(el.dataset.fightShow){fightChange('visible',el.dataset.fightShow,el.checked);return;}
 if(el.dataset.workspaceShow){deskChange('visible',el.dataset.workspaceShow,el.checked);return;}
 if(el.id==='active-campaign'){changeTable('campaigns/select',{campaignId:el.value});return;}
 if(el.id==='active-role'){changeTable('view-mode',{mode:el.value});return;}const form=el.closest?.('#origin-form,#add-form');if(form)updateOriginPreview(form);
 if(el.closest?.('.map-discovery-give')&&el.name==='lootId'){const form=el.closest('form'),pin=state.maps?.find(m=>m.id===(mapSelectedId||state.maps?.[0]?.id))?.markers?.find(p=>p.id===mapActivePin),item=pin?.loot?.find(i=>i.id===el.value),qty=form?.querySelector('[name="quantity"]');if(qty&&item){qty.max=String(item.quantity);qty.value='1';}return;}
 if(el.id==='inventory-character'){inventoryCharacterId=el.value;inventoryEditId='';render();return;}
 if(el.id==='media-file'){loadCrop(el.files?.[0]).catch(e=>toast(e.message,true));return;}
 if(el.id==='media-crop-aspect'){drawCrop();return;}
 if(el.id==='media-kind'){clearCrop();mediaKind=el.value;mediaTarget='';artSearch='';render();return;}
 if(el.id==='media-target'){clearCrop();mediaTarget=el.value;render();return;}
 if(el.id==='art-search'){artSearch=el.value;render();return;}
 if(el.dataset.npcCondition){if(el.value)act('npcCondition',{id:el.dataset.npcCondition,condition:el.value});return;}
 if(el.dataset.spellPrepare){act('prepareSpell',{id:selected,entryId:el.dataset.spellPrepare,prepared:el.checked});return;}
 if(el.id==='combat-character'||el.id==='char-switch'||el.id==='grim-character'){selected=el.value;render();return;}
 if(el.id==='edition'){const reset=state.characters.some(p=>p.origin)&&state.edition!==el.value;if(reset&&!confirm('Changer d’édition retirera les bonus d’origine et exigera de reconfigurer les espèces et historiques. Continuer ?')){render();return;}act('edition',{value:el.value,confirmOriginReset:reset});return;}
 if(el.dataset.skillId){act('setSkill',{id:selected,skillId:el.dataset.skillId,rank:el.value});return;}
 if(el.dataset.init){act('init',{id:el.dataset.init,value:Number(el.value)});return;}
});
document.addEventListener('input',event=>{if(['media-crop-zoom','media-crop-x','media-crop-y'].includes(event.target.id))drawCrop();});
