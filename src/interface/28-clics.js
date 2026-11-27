// ——— 28 · Clics ———
function delegateClick(event){
 const pick=event.target.closest?.('[data-search-pick]');if(pick&&pick.dataset?.searchPick!==undefined){pickSearch(Number(pick.dataset.searchPick));return;}
 if(event.target.classList?.contains('search-backdrop')){modal='';render();return;}
 const canvas=event.target.closest?.('[data-map-canvas]');
 if(canvas&&Date.now()-pingHoldAt<800)return;
 if(canvas&&(mapTool==='ping'||event.altKey)&&!event.target.closest('button:not(.map-token)')){sendPing(canvas,event.clientX,event.clientY);return;}
 if(canvas&&pendingDeploy&&actor==='mj'&&canvas.dataset.mapCanvas===pendingDeploy.map&&!event.target.closest('button:not(.map-token)')){const r=canvas.getBoundingClientRect();if(r.width){const x=Math.round(Math.max(0,Math.min(1,(event.clientX-r.left)/r.width))*1000),y=Math.round(Math.max(0,Math.min(1,(event.clientY-r.top)/r.height))*1000);const p=pendingDeploy;pendingDeploy=null;
  act('encounterDeploy',{id:p.enc,mapId:p.map,x,y}).then(ok=>{if(ok)toast('Rencontre posée sur la carte. Saisissez les initiatives dans Combat.');});}return;}
 if(canvas&&(mapTool==='measure'||mapTool==='draw'))return;
 if(canvas&&mapTool==='area'&&!event.target.closest('button:not(.map-token)')){const r=canvas.getBoundingClientRect();if(!r.width)return;const px=event.clientX-r.left,py=event.clientY-r.top;const x=Math.round(Math.max(0,Math.min(1,px/r.width))*1000),y=Math.round(Math.max(0,Math.min(1,py/r.height))*1000);
  const directional=areaShape==='cone'||areaShape==='line';
  if(directional&&!areaPending){areaPending={x,y,px,py};render();toast('Origine placée : touchez maintenant la direction.');return;}
  let angle=0;if(directional){angle=Math.round(Math.atan2(py-areaPending.py,px-areaPending.px)*180/Math.PI);}
  const origin=directional?areaPending:{x,y};areaPending=null;act('mapAreaAdd',{id:canvas.dataset.mapCanvas,values:{shape:areaShape,size:areaSize,x:origin.x,y:origin.y,angle}}).then(ok=>{if(!ok)render();});return;}
 if(canvas&&actor==='mj'&&!event.target.closest('button')){
  const bounds=canvas.getBoundingClientRect();if(mapTool==='hex'&&HEX&&bounds.width>0){const map=(state.maps||[]).find(m=>m.id===canvas.dataset.mapCanvas);if(!map||map.grid?.shape!=='hex')return;const x=(event.clientX-bounds.left)/bounds.width*1000,y=(event.clientY-bounds.top)/bounds.height*1000;const h=HEX.fromPoint(x,y,map.grid.cells,mapAspect[map.id]||1);if(h.q<0||h.r<0)return;
   if(hexMode==='party')act('mapHexParty',{id:map.id,hex:HEX.key(h),pace:document.getElementById('hex-pace')?.value||'normal',advanceTime:!!document.getElementById('hex-time')?.checked});else act('mapHexToggle',{id:map.id,hex:HEX.key(h)});return;}

  if(mapTool==='walls'&&bounds.width>0){const map=(state.maps||[]).find(m=>m.id===canvas.dataset.mapCanvas);if(!map)return;const raw={x:Math.round(Math.max(0,Math.min(1,(event.clientX-bounds.left)/bounds.width))*1000),y:Math.round(Math.max(0,Math.min(1,(event.clientY-bounds.top)/bounds.height))*1000)};const p=wallSnapPoint(map,raw.x,raw.y);
   if(!wallStart||wallStart.map!==map.id){wallStart={map:map.id,...p};render();return;}if(p.x===wallStart.x&&p.y===wallStart.y){wallStart=null;render();return;}
   const st=wallStart;wallStart={map:map.id,...p};act('mapWallAdd',{id:map.id,values:{x1:st.x,y1:st.y,x2:p.x,y2:p.y,door:wallKind==='door'}}).then(ok=>{if(!ok){wallStart=null;render();}});return;}
  if(mapTool==='reveal'&&bounds.width>0){const x=Math.round(Math.max(0,Math.min(1,(event.clientX-bounds.left)/bounds.width))*1000),y=Math.round(Math.max(0,Math.min(1,(event.clientY-bounds.top)/bounds.height))*1000);act('mapFog',{id:canvas.dataset.mapCanvas,op:'reveal',values:{x,y,r:fogRadius}});return;}
  if(bounds.width>0&&bounds.height>0){mapActivePin='';mapActiveToken='';mapPlacement={x:Math.round(Math.max(0,Math.min(1,(event.clientX-bounds.left)/bounds.width))*1000),y:Math.round(Math.max(0,Math.min(1,(event.clientY-bounds.top)/bounds.height))*1000)};render();}return;
 }
 const condEl=event.target.closest?.('[data-cond-help]');if(condEl&&typeof condEl.dataset?.condHelp==='string'&&condEl.dataset.condHelp){openCondition(condEl.dataset.condHelp);return;}
 const b=event.target.closest('button,[data-nav],[data-char],[data-modal],[data-menu]');if(!b)return;const ds={...b.dataset};
 if(ds.whisperThread){whisperThread=ds.whisperThread;openWhispers();return;}
 if(ds.whisperClear){if(confirm('Effacer définitivement cette conversation ?'))act('whisperClear',{charId:ds.whisperClear});return;}
 if(ds.cmpEdit){cmpEdit=cmpEdit===ds.cmpEdit?'':ds.cmpEdit;render();return;}
 if(ds.cmpDeploy){act('companionDeploy',{id:ds.pc,companionId:ds.cmpDeploy}).then(ok=>{if(ok)toast('Compagnon ajouté au combat.');});return;}
 if(ds.cmpRecall){act('companionRecall',{id:ds.pc,companionId:ds.cmpRecall});return;}
 if(ds.cmpRemove){if(confirm('Retirer ce compagnon de la fiche ?'))act('companionRemove',{id:ds.pc,companionId:ds.cmpRemove});return;}
 if(ds.cmpToken){act('mapCompanionToken',{id:ds.map,npcId:ds.cmpToken}).then(ok=>{if(ok)toast('Jeton placé au centre : faites-le glisser.');});return;}
 if(ds.qoMove){act('questObjectiveMove',{id:ds.quest,objectiveId:ds.qoMove,dir:Number(ds.dir)});return;}
 if(ds.qoSecret){act('questObjectiveSet',{id:ds.quest,objectiveId:ds.qoSecret,values:{secret:ds.secret==='1'}});return;}
 if(ds.qoRemove){if(confirm('Supprimer cet objectif ?'))act('questObjectiveRemove',{id:ds.quest,objectiveId:ds.qoRemove});return;}
 if(ds.timeAdvance){act('worldTimeAdvance',{minutes:Number(ds.timeAdvance)});return;}
 if(ds.worldEventDone){act('worldEventDone',{id:ds.worldEventDone,done:ds.done==='1'});return;}
 if(ds.worldEventRemove){if(confirm('Supprimer cet événement ?'))act('worldEventRemove',{id:ds.worldEventRemove});return;}
 if(ds.ambPlay){act('ambiencePlay',{trackId:ds.ambPlay,volume:state.ambience?.playing?.volume??0.7}).then(ok=>{if(ok)toast('Lecture lancée sur l’écran de table.',false,{label:'Ouvrir l’écran',run:openTableScreen});});return;}
 if(ds.ambLoop){act('ambienceUpdate',{trackId:ds.ambLoop,values:{loop:ds.loop==='1'}});return;}
 if(ds.ambDelete){if(confirm('Supprimer définitivement ce fichier audio du serveur ?'))act('ambienceDelete',{trackId:ds.ambDelete});return;}
 if(ds.backupTest){api('backup-test','POST',{id:ds.backupTest}).then(r=>{backupReport={id:ds.backupTest,...r};render();}).catch(e=>toast(e.message,true));return;}
 if(ds.backupRestore){const id=ds.backupRestore;api('backup-test','POST',{id}).then(async r=>{backupReport={id,...r};render();if(!r.ok){toast('Cette sauvegarde ne peut pas être restaurée.',true);return;}
   if(!confirm('Restaurer « '+r.campaign.title+' » dans l’état de cette sauvegarde ?\n\nToutes les modifications faites depuis seront remplacées. Une sauvegarde de sécurité de l’état actuel est créée juste avant.'))return;
   const out=await api('backup-restore','POST',{id,confirm:true});backupsInfo=null;backupReport=null;await refresh();toast('Campagne restaurée. Sauvegarde de sécurité : '+out.safety);}).catch(e=>toast(e.message,true));return;}
 if(ds.pcExport){const pc=L.findPc(state,ds.pcExport);if(pc&&CTX){const data=CTX.exportCharacter(pc,state.title,state.edition);const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=CTX.fileName(pc);document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);toast('Personnage exporté : '+a.download);}return;}
 if(ds.rule){rulesSel=ds.rule;rulesQuery='';render();document.querySelector('.rules-main')?.scrollIntoView?.({block:'start'});document.querySelector('.rules-main h3')?.focus?.();return;}
 if(ds.spellDesc){openSpellDesc(ds.spellDesc);return;}
 if(ds.npcConc){const [id,checkId,result]=ds.npcConc.split('|');act('npcConcentrationResult',{id,checkId,result});return;}
 if(ds.npcConcEnd){act('npcConcentration',{id:ds.npcConcEnd,text:''});return;}
 if(ds.bestiaryHab){bestiaryHab=ds.bestiaryHab;render();return;}
 if(ds.monsterSheet){const id=ds.monsterSheet;modal='monster:'+id;render();if(R&&!R.monstersLoaded())R.loadMonsters().then(()=>{if(modal==='monster:'+id)render();}).catch(()=>{});return;}
 if(ds.task==='spell-add-preview'){const v=document.querySelector('#spell-add-form select[name="spellId"]')?.value;if(v)openSpellDesc(v);return;}
 if(ds.task==='open-rules'){rulesSel=ds.ruleTarget||null;goPage('rules');return;}
 if(ds.fightReset!==undefined){if(actor!=='mj')return;if(confirm('Restaurer la disposition par défaut du combat ?')){fightLayout=CW.blank();fightSave();render();}return;}
 if(ds.fightStep){fightChange('move',ds.fightId,ds.fightStep);return;}
 if(ds.fightSize){const id=ds.fightSize;fightChange('size',id,!fightLayout.panels[id]?.wide);return;}
 if(ds.fightHide){fightChange('visible',ds.fightHide,false);return;}
 if(ds.workspaceReset!==undefined){if(actor!=='mj')return;if(confirm('Remettre la disposition par défaut pour cette campagne ?')){deskLayout=W.blank();deskSave();render();}return;}
 if(ds.workspaceStep){deskChange('move',ds.workspaceId,ds.workspaceStep);return;}
 if(ds.workspaceSize){const id=ds.workspaceSize;deskChange('size',id,!deskLayout.panels[id]?.wide);return;}
 if(ds.workspaceHide){deskChange('visible',ds.workspaceHide,false);return;}
 if(ds.uxMode!==undefined){uxSimple=!uxSimple;uxSave();render();return;}
 if(ds.uxGo){uxGo(ds.uxGo);return;}
 if(ds.uxSceneFilter){if(!['all','active','planned','completed'].includes(ds.uxSceneFilter))return;sceneFilter=ds.uxSceneFilter;render();return;}
 if(ds.onboardOpen!==undefined){page='guide';onboardHidden=true;render();document.querySelector('#guided-steps')?.scrollIntoView?.({block:'start'});return;}
 if(ds.onboardHide!==undefined){onboardHidden=true;render();return;}
 if(ds.onboardNav){page=ds.onboardNav;render();returnToTop();return;}
 if(ds.onboardCheck){const role=onboardRole(),ids=OB.steps(role).map(x=>x.id),id=ds.onboardCheck;if(!ids.includes(id))return;onboardDone=onboardDone.includes(id)?onboardDone.filter(x=>x!==id):[...onboardDone,id];onboardingSave();render();return;}
 if(ds.onboardReset!==undefined){if(confirm('Recommencer le parcours guidé sur cet appareil ?')){onboardDone=[];onboardingSave();onboardHidden=false;render();}return;}
 if(ds.inventoryEdit){inventoryEditId=inventoryEditId===ds.inventoryEdit?'':ds.inventoryEdit;render();return;}
 if(ds.itemArt){mediaKind='item';mediaTarget=inventoryCharacterId+'|'+ds.itemArt;page='illustrations';render();return;}
 if(ds.ptItem){itemUseOpen=ds.ptItem;inventoryCharacterId=actor;goPage('inventory',()=>{const card=document.querySelector('#item-heal-form')||document.querySelector('[data-item-use="'+ds.ptItem+'"]');if(card){card.scrollIntoView({block:'center'});if(!document.querySelector('#item-heal-form'))card.click();}});return;}
 if(ds.tsFull!==undefined){try{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();}catch{}return;}
 if(ds.tableMap){act('tableMap',{mapId:ds.tableMap}).then(ok=>{if(ok)toast('Carte affichée sur l’écran de table.',false,{label:'Ouvrir l’écran',run:openTableScreen});});return;}
 if(ds.spellCards){const p=L.findPc(state,ds.spellCards);if(p&&R&&!R.loaded()){toast('Préparation des cartes…');R.load().then(()=>b.click()).catch(()=>{R.__skip=true;b.click();});return;}if(p){const h=spellCardsHtml(p);if(h){window.print&&printHtml(h);}else toast('Aucun sort dans le grimoire.',true);}return;}
 if(ds.book){modal='';render();printHtml(bookHtml(ds.book==='gm'));return;}
 if(ds.pageTab){showTab(ds.pageTab,ds.tabKey);return;}
 if(ds.scheduleAnswer){act('scheduleAnswer',{optionId:ds.scheduleAnswer,value:ds.value});return;}
 if(ds.scheduleChoose!==undefined){const id=ds.scheduleChoose||null;act('scheduleChoose',{optionId:id}).then(ok=>{if(ok)toast(id?'Séance fixée : elle s’affiche à l’accueil de tous.':'Choix annulé.');});return;}
 if(ds.scheduleRemove){actUndoable('scheduleRemove',{id:ds.scheduleRemove},'Date retirée.');return;}
 if(ds.scheduleClear!==undefined){actUndoable('scheduleClear',{},'Dates et réponses effacées.');return;}
 if(ds.printSheet){modal='print:'+ds.printSheet;render();return;}
 if(ds.printNow){printNow(ds.printNow);return;}
 if(ds.handoutOpen){const id=ds.handoutOpen;handoutOpen=handoutOpen===id?'':id;const h=(state.handouts||[]).find(x=>x.id===id);render();if(h&&!h.read&&handoutOpen===id)act('handoutRead',{id});return;}
 if(ds.handoutEdit){handoutEdit=ds.handoutEdit;render();document.getElementById('handout-form')?.scrollIntoView({block:'center'});return;}
 if(ds.handoutCancel!==undefined){handoutEdit='';render();return;}
 if(ds.handoutRetract){act('handoutRetract',{id:ds.handoutRetract}).then(ok=>{if(ok)toast('Document retiré : les joueurs ne le voient plus.');});return;}
 if(ds.handoutDelete){actUndoable('handoutDelete',{id:ds.handoutDelete},'Document supprimé.');return;}
 if(ds.shopOpen){act('shopOpen',{id:ds.shopOpen,open:ds.value==='1'}).then(ok=>{if(ok)toast(ds.value==='1'?'Boutique ouverte : les joueurs la voient dans leur inventaire.':'Boutique fermée.');});return;}
 if(ds.shopDelete){actUndoable('shopDelete',{id:ds.shopDelete},'Marchand supprimé.');return;}
 if(ds.shopItemRemove){actUndoable('shopItemRemove',{id:ds.shop,itemId:ds.shopItemRemove},'Article retiré.');return;}
 if(ds.itemUse){const pc=L.findPc(state,ds.inventoryFor),it=pc&&I.list(pc).find(x=>x.id===ds.itemUse);if(!it)return;if(ds.useKind==='heal'){itemUseOpen=it.id;render();setTimeout(()=>document.querySelector('#item-heal-form input')?.focus(),30);return;}
  act('itemUse',{id:pc.id,itemId:it.id}).then(ok=>{if(ok)toast(GEAR.isAmmo(it)?'Munition décomptée.':'Objet utilisé.');});return;}
 if(ds.itemUsePlain){act('itemUse',{id:ds.inventoryFor,itemId:ds.itemUsePlain}).then(ok=>{if(ok){itemUseOpen='';render();toast('Potion retirée sans soin.');}});return;}
 if(ds.itemUseCancel!==undefined){itemUseOpen='';render();return;}
 if(ds.itemEquip){const pc=L.findPc(state,ds.inventoryFor),it=pc&&I.list(pc).find(x=>x.id===ds.itemEquip);if(!it)return;act('itemUpdate',{id:pc.id,itemId:it.id,values:fullItemValues(it,{equipped:!it.equipped})}).then(ok=>{if(ok&&GEAR){const p2=L.findPc(state,pc.id),eq=GEAR.equipmentAc(p2,p2.progression?.classId||P.detectClass(p2.job));toast((it.equipped?'Retiré':'Équipé')+(eq.ac!==p2.stats.ac?' · CA proposée : '+eq.ac+' (bouton « Appliquer »)':''));}});return;}
 if(ds.applyAc){act('setAc',{id:ds.inventoryFor,value:Number(ds.applyAc)}).then(ok=>{if(ok)toast('Classe d’armure mise à jour.');});return;}
 if(ds.itemAdjust){act('itemAdjust',{id:ds.inventoryFor,itemId:ds.inventoryId,field:'quantity',delta:Number(ds.itemAdjust)});return;}
 if(ds.chargeAdjust){act('itemAdjust',{id:ds.inventoryFor,itemId:ds.inventoryId,field:'charges',delta:Number(ds.chargeAdjust)});return;}
 if(ds.mapOpenLoot!==undefined){const d=document.querySelector('.map-loot-advanced');if(d){d.open=true;d.scrollIntoView?.({block:'start',behavior:'smooth'});}return;}
 if(ds.mapQuickMap){if(actor!=='mj')return;const m=state.maps?.find(x=>x.id===(mapSelectedId||state.maps?.[0]?.id));if(!m)return;if(ds.mapQuickMap==='shared'&&!confirm('Partager cette carte ? Son image de fond ENTIÈRE sera visible aux joueurs, y compris les secrets déjà dessinés dessus.'))return;act('mapVisibilitySet',{id:m.id,visibility:ds.mapQuickMap});return;}
 if(ds.mapQuickPin){if(actor!=='mj'||!mapActivePin)return;const isReveal=ds.mapQuickPin==='shared';if(isReveal&&!confirm('Révéler ce repère et sa description aux joueurs ? Le contenu du coffre reste caché.'))return;act('mapMarkerVisibilitySet',{id:mapSelectedId||state.maps?.[0]?.id,markerId:mapActivePin,visibility:ds.mapQuickPin});return;}
 if(ds.mapLootReveal!==undefined){if(actor!=='mj')return;const reveal=ds.mapLootReveal==='1',m=state.maps?.find(x=>x.id===(mapSelectedId||state.maps?.[0]?.id)),pin=m?.markers?.find(x=>x.id===mapActivePin);if(!pin)return;if(reveal&&(m.visibility!=='shared'||pin.visibility!=='shared')){toast('Révélez la carte et le repère avant leur contenu.',true);return;}if(reveal&&!confirm('Révéler le nom et la quantité de tous les objets de ce coffre ?'))return;act('mapLootReveal',{id:m.id,markerId:pin.id,revealed:reveal});return;}
 if(ds.mapLootRemove){if(actor==='mj'&&confirm('Supprimer définitivement ce lot du repère ? Vous pouvez aussi le transférer vers la réserve du MJ.'))act('mapLootRemove',{id:mapSelectedId||state.maps?.[0]?.id,markerId:mapActivePin,lootId:ds.mapLootRemove});return;}
 if(ds.lootDelete){if(actor==='mj'&&confirm('Retirer ce lot du trésor ?'))act('lootRemove',{lootId:ds.lootDelete});return;}
 if(ds.mapFollow){const [kind,id,pc]=ds.mapFollow.split('|');if(['place','pnpc','quest'].includes(kind)){goTab('chronicle','carnet',()=>{const el=document.getElementById(id);if(el){el.scrollIntoView({block:'center'});el.classList.add('flash');setTimeout(()=>el.classList.remove('flash'),1600);}});return;}if(actor!=='mj')return;if(kind==='npc'){page='combat';gmCombatView='detail';}else if(kind==='template'){page='encounters';}else if(kind==='character'){selected=id;page='character';}else if(kind==='item'||kind==='spell'){page=kind==='item'?'inventory':'grimoire';selected=pc||selected;if(kind==='item'){inventoryCharacterId=pc||selected;inventoryEditId=id;}}render();returnToTop();return;}
 if(ds.mapJump){if(actor!=='mj')return;const [mapId,pinId]=ds.mapJump.split('|');const m=state.maps?.find(x=>x.id===mapId);if(!m?.markers?.some(x=>x.id===pinId))return;mapSelectedId=mapId;mapActivePin=pinId;mapPlacement=null;render();document.querySelector('.map-pin-detail')?.scrollIntoView?.({block:'start',behavior:'instant'});return;}
 if(ds.mapSelect){mapSelectedId=ds.mapSelect;mapActivePin='';mapActiveToken='';mapPlacement=null;render();return;}
 if(ds.mapToken){if(suppressTokenClick){suppressTokenClick=false;return;}if(actor==='mj'){mapActiveToken=ds.mapToken;render();}return;}
 if(ds.mapTool){mapTool=ds.mapTool==='move'?'marker':ds.mapTool;mapPlacement=null;areaPending=null;wallStart=null;render();if(mapTool==='walls')toast('Touchez un point de départ, puis le point suivant. Touchez deux fois le même point pour arrêter.');if(mapTool==='measure')toast('Faites glisser sur la carte pour mesurer une distance.');if(mapTool==='ping')toast('Touchez la carte : un signal apparaît chez toute la table.');if(mapTool==='area')toast('Choisissez la forme et la taille, puis touchez la carte.');return;}
 if(ds.areaShape){areaShape=ds.areaShape;areaPending=null;render();return;}
 if(ds.areaRemove){act('mapAreaRemove',{id:ds.map,areaId:ds.areaRemove});return;}
 if(ds.areaClear){actUndoable('mapAreaClear',{id:ds.areaClear},'Zones effacées.');return;}
 if(ds.areaList){const d=document.getElementById('map-areas-'+ds.areaList);if(d){d.open=true;d.scrollIntoView({block:'nearest'});}return;}
 if(ds.fogRadius){fogRadius=Number(ds.fogRadius)||120;render();return;}
 if(ds.mapFog){if(ds.mapFog==='reset'&&!confirm('Recouvrir toute la carte de brouillard ?'))return;act('mapFog',{id:ds.id,op:ds.mapFog}).then(ok=>{if(ok&&ds.mapFog==='enable'){mapTool='reveal';render();toast('Brouillard activé : touchez la carte pour révéler des zones.');}if(ok&&ds.mapFog==='disable'){mapTool='marker';render();}});return;}
 if(ds.tokenUnselect!==undefined){mapActiveToken='';render();return;}
 if(ds.tokenVisible){act('mapTokenSet',{id:mapSelectedOrFirst(),tokenId:ds.tokenVisible,values:{visible:ds.value==='1'}});return;}
 if(ds.tokenRemove){act('mapTokenRemove',{id:mapSelectedOrFirst(),tokenId:ds.tokenRemove}).then(ok=>{if(ok){mapActiveToken='';render();}});return;}
 if(ds.tokenParty){(async()=>{const m=state.maps.find(x=>x.id===ds.tokenParty);const have=new Set((m.tokens||[]).map(t=>t.refId));let i=0,n=0;for(const pc of state.characters){if(have.has(pc.id))continue;if(!await act('mapTokenAdd',{id:m.id,values:{kind:'pc',refId:pc.id,x:Math.min(950,120+i*90),y:880}}))break;i++;n++;}toast(n?(n>1?`${n} jetons posés en bas de la carte : faites-les glisser.`:'Un jeton posé en bas de la carte : faites-le glisser.'):'Tous les aventuriers ont déjà un jeton.');})();return;}
 if(ds.tokenNpcs){(async()=>{const m=state.maps.find(x=>x.id===ds.tokenNpcs);const have=new Set((m.tokens||[]).map(t=>t.refId));let i=0;for(const npc of state.combat.npcs||[]){if(have.has(npc.id))continue;if(!await act('mapTokenAdd',{id:m.id,values:{kind:'npc',refId:npc.id,x:Math.min(950,120+(i%10)*80),y:120+Math.floor(i/10)*80}}))break;i++;}toast(i?(i>1?`${i} créatures posées en haut de la carte`:'Une créature posée en haut de la carte')+((state.combat.npcs||[]).some(n=>n.visibility!=='public')?' (les créatures masquées restent invisibles des joueurs)':'')+'.':'Toutes les créatures ont déjà un jeton.');})();return;}
 if(ds.mapPin){mapActivePin=ds.mapPin;mapPlacement=null;render();document.querySelector('.map-pin-detail')?.scrollIntoView?.({block:'start',behavior:'instant'});return;}
 if(ds.mapUnselect){mapActivePin='';mapPlacement=null;render();return;}
 if(ds.mapRemovePin){if(actor==='mj'&&confirm('Supprimer définitivement ce repère ?'))act('mapMarkerDelete',{id:mapSelectedId||state.maps?.[0]?.id,markerId:ds.mapRemovePin}).then(ok=>{if(ok){mapActivePin='';render();}});return;}
 if(ds.mapDelete){if(actor==='mj'&&confirm('Supprimer cette carte, son image et tous ses repères ?'))act('mapDelete',{id:ds.mapDelete}).then(ok=>{if(ok){mapSelectedId='';mapActivePin='';mapPlacement=null;render();}});return;}
 if(ds.mjView){if(actor!=='mj')return;gmCombatView=['desk','board','detail'].includes(ds.mjView)?ds.mjView:'desk';render();returnToTop();return;}
 if(ds.mjFilter){if(actor!=='mj')return;gmBoardFilter=['all','alert','turn'].includes(ds.mjFilter)?ds.mjFilter:'all';render();return;}
 if(ds.mjFollow){if(actor!=='mj'||!L.findPc(state,ds.mjFollow))return;selected=ds.mjFollow;gmCombatView='detail';page='combat';render();document.querySelector('.combat-char-pick')?.scrollIntoView?.({block:'start',behavior:'instant'});return;}
 if(ds.pickImage){const [kind,characterId,entityId]=ds.pickImage.split('|');chooseMedia(kind,characterId,entityId);return;}
 if(ds.artId){mediaChange('builtin',{builtinId:ds.artId});return;}
 if(ds.mediaPreview){previewMediaId=ds.mediaPreview;render();return;}
 if(ds.mediaFeature){mediaChange('feature',{mediaId:ds.mediaFeature});return;}
 if(ds.mediaShow){act('spotlightShow',{mediaId:ds.mediaShow,title:document.querySelector('#spotlight-title')?.value||'Illustration du Maître du Jeu'});return;}
 if(ds.mediaDelete!==undefined){if(confirm('Retirer cette illustration ?'))mediaChange('delete',{mediaId:ds.mediaDelete});return;}
 if(ds.mediaUpload!==undefined){const f=document.querySelector('#media-file')?.files?.[0];if(!f){toast('Choisissez d’abord un fichier image.',true);return;}toUpload(f).then(x=>mediaChange('upload',x)).catch(e=>toast(e.message,true));return;}
 if(ds.mediaItemRemove){if(confirm('Supprimer cet objet ?'))act('itemRemove',{id:ds.for,itemId:ds.mediaItemRemove});return;}
 if(ds.passkeyLogin){passkeyLogin();return;}
 if(ds.langSwitch!==undefined){window.ChroniquesI18n?.set(uiLang()==='en'?'fr':'en');return;}
 if(ds.auth){authMode=ds.auth;if(authMode!=='reset')pendingReset='';lastNotice='';api('status').then(authForm);return;}
 if(ds.menu){if(ds.menu==='toggle'){mobileMore=!mobileMore;}else if(event.target===b||b.tagName==='BUTTON'){mobileMore=false;}else return;render();if(mobileMore){document.querySelector('.mobile-more-sheet .icon-close')?.focus();}else{document.querySelector('[data-menu=\"toggle\"]')?.focus();}return;}
 if(ds.guideStep){guideStep=Math.max(0,Math.min(GUIDE_STEPS.length-1,Number(ds.guideStep)));render();return;}
 if(ds.noteSave!==undefined){saveNote(ds.noteSave);return;}
  if(ds.noteDelete!==undefined){deleteNote(ds.noteDelete);return;}
  if(ds.noteReset!==undefined){delete noteDrafts[ds.noteReset];render();return;}
  if(ds.tourStart!==undefined){modal='';render();startTour();return;}
  if(ds.catalogAdd&&IC){const e=IC.get(ds.catalogAdd);if(e)act('itemAdd',{id:ds.character,values:IC.toItemValues(e)}).then(ok=>{if(ok)toast(e.name+' ajouté à l’inventaire.');});return;}
  if(ds.surprise){act('surpriseToggle',{id:ds.surprise});return;}
 if(ds.device){const [g,v]=ds.device.split(':');if(g==='lang'){if(v!==uiLang())window.ChroniquesI18n?.set(v);}else if(g==='units'){window.ChroniquesI18n?.setUnits?.(v);render();}else if(g==='theme'){window.ChroniquesTheme?.set(v);render();}else if(g==='size'){textSize=Math.max(0,Math.min(2,Number(v)||0));try{localStorage.setItem('chroniques-taille',String(textSize));}catch{}applyTextSize();render();}return;}
 if(ds.speak!==undefined){speakToggle(ds.speak);return;}
 if(ds.adminAccount){const op=ds.adminAccount,name=(adminOverview?.users||[]).find(x=>x.id===ds.user)?.name||'';
  if(op==='suspend'&&!confirm(`Suspendre le compte « ${name} » ? Ses connexions seront fermées et il ne pourra plus se connecter tant que vous ne l’aurez pas réactivé.`))return;
  api('admin/account','POST',{op,userId:ds.user}).then(r=>{if(op==='reset'){resetResult=r;toast('Lien de réinitialisation prêt.');}else if(op==='logout')toast(r.closed>1?`${r.closed} connexions fermées.`:`${r.closed} connexion fermée.`);else toast(op==='suspend'?'Compte suspendu.':'Compte réactivé.');loadAdminOverview();}).catch(e=>toast(e.message,true));return;}
 if(ds.resetPassword){api('password-reset/create','POST',{userId:ds.resetPassword}).then(r=>{resetResult=r;render();toast('Lien de réinitialisation prêt.');}).catch(e=>toast(e.message,true));return;}
  if(ds.copyText){navigator.clipboard?.writeText(ds.copyText).then(()=>toast('Copié.'),()=>toast('Copie non disponible : sélectionnez le texte.',true));return;}
  if(ds.bestiaryTemplate){if(actor==='mj'&&B){const m=B.get(ds.bestiaryTemplate);if(m){const src=A.contextual('npc',m.name),ent=src&&A.entries.find(e=>e.kind==='npc'&&A.src(e.id)===src);act('templateAdd',{values:B.creatureValues(m),icon:ent?ent.id:''}).then(ok=>{if(ok)toast(m.name+' ajouté à vos modèles.');});}}return;}
  if(ds.charterSignal){sendSignal(ds.charterSignal);return;}
  if(ds.charterAck){act('charterSignalAck',{id:ds.charterAck});return;}
  if(ds.charterEdit){charterEdit=ds.charterEdit;render();setTimeout(()=>document.querySelector('.charter-rule.editing input[name=title]')?.focus(),40);return;}
  if(ds.charterCancel){charterEdit='';render();return;}
  if(ds.charterRemove){const r=(charter().rules||[]).find(x=>x.id===ds.charterRemove);if(r&&confirm('Supprimer la règle « '+r.title+' » ?'))actUndoable('charterRuleRemove',{id:r.id},'Règle supprimée.');return;}
  if(ds.charterPreset&&TCHC){const pr=TCHC.PRESETS.find(x=>x.title===ds.charterPreset);if(pr)act('charterRuleAdd',{values:{...pr,visibility:'shared',screen:false}}).then(ok=>{if(ok)toast('Règle ajoutée : adaptez-la si besoin.');});return;}
  if(ds.charterLimitRemove){actUndoable('charterLimitRemove',{id:ds.charterLimitRemove,limit:ds.limit},'Sujet retiré.');return;}
  if(ds.delayTurn){act('delayTurn',{id:ds.delayTurn}).then(ok=>{if(ok)toast('Tour retardé : touchez « Agir maintenant » quand vous voulez jouer.');});return;}
  if(ds.actNow){act('actNow',{id:ds.actNow}).then(ok=>{if(ok)toast('Place enregistrée : ce participant joue juste après le tour en cours.');});return;}
  if(ds.readyResolve){act('readyResolve',{id:ds.for,mode:ds.readyResolve});return;}
  if(ds.dtEdit){dtEdit=ds.dtEdit;render();return;}
  if(ds.dtCancel){dtEdit='';render();return;}
  if(ds.dtRemove){const x=(state.downtime?.activities||[]).find(y=>y.id===ds.dtRemove);if(x&&confirm('Supprimer l’activité « '+x.title+' » ?'))actUndoable('downtimeRemove',{id:x.id},'Activité supprimée.');return;}
  if(ds.dtSuggest&&DTM){const f=b.closest('form');if(!f)return;try{const r=DTM.crafting(f.elements.value.value||0,f.elements.helpers.value||1);f.elements.daysTotal.value=r.days;f.elements.costGp.value=r.cost;toast(r.days+' jour'+(r.days>1?'s':'')+', '+r.cost+' po de matières premières.');}catch(e){toast(e.message,true);}return;}
  if(ds.mcOp){const pid=selected;const name=P.CLASSES[ds.mcClass]?.name||ds.mcClass;if(ds.mcOp==='remove'&&!confirm('Retirer la classe '+name+' ? Ses niveaux reviennent à la classe de départ.'))return;act('multiclass',{id:pid,op:ds.mcOp,classId:ds.mcClass,...(ds.mcOp==='level'?{level:Number(ds.mcLevel)}:{})});return;}
  if(ds.rechargeSkip){act('itemRecharge',{id:ds.pc,itemId:ds.rechargeSkip,amount:null});return;}
  if(ds.madnessRemove){actUndoable('madnessRemove',{id:ds.for,madnessId:ds.madnessRemove},'Folie guérie.');return;}
  if(ds.trapState){act('mapTrapSet',{id:ds.map,markerId:ds.pin,values:{state:ds.trapState}}).then(ok=>{if(ok&&['spotted','triggered'].includes(ds.trapState))toast('Piège visible des joueurs sur la carte.');});return;}
  if(ds.wallKind){wallKind=ds.wallKind;render();return;}
  if(ds.wallUndo){act('mapWallRemove',{id:ds.wallUndo,wallId:'__last'}).then(()=>{wallStart=null;render();});return;}
  if(ds.wallClear){if(confirm('Effacer tous les murs et portes de cette carte ?'))act('mapWallClear',{id:ds.wallClear}).then(()=>{wallStart=null;render();});return;}
  if(ds.door){act('mapDoor',{id:ds.map,wallId:ds.door,open:ds.open==='1'});return;}
  if(ds.vote){const cur=state.votes?.active;act('voteCast',{optionId:cur&&cur.mine===ds.vote?null:ds.vote});return;}
  if(ds.fallenRevive){const pc=L.findPc(state,ds.fallenRevive);if(pc&&confirm('Ramener '+pc.name+' parmi les vivants ?'))act('fallen',{id:pc.id,values:null});return;}
  if(ds.itemSecret){const msg={identify:'Objet identifié : son vrai nom est révélé au joueur.',revealCurse:'Malédiction révélée.',liftCurse:'Malédiction levée.',clear:'Objet redevenu ordinaire.'}[ds.itemSecret];act('itemSecret',{id:ds.pc,itemId:ds.item,op:ds.itemSecret}).then(ok=>{if(ok&&msg)toast(msg);});return;}
  if(ds.affSave!==undefined){const ok=ds.affSave==='1';act('afflictionSave',{id:ds.for,afflictionId:ds.aff,success:ok}).then(r=>{if(r)toast(ok?'Réussite notée.':'Échec noté.');});return;}
  if(ds.affCure){act('afflictionCure',{id:ds.for,afflictionId:ds.affCure}).then(r=>{if(r)toast('Affliction guérie.');});return;}
  if(ds.langRemove!==undefined){const pc=L.findPc(state,ds.for);if(!pc)return;const list=(pc.languages||[]).filter((x,i)=>i!==Number(ds.langRemove));act('languagesSet',{id:pc.id,languages:list});return;}
  if(ds.tongueRemove){if(confirm('Retirer ce message pour tout le monde ?'))act('tongueRemove',{messageId:ds.tongueRemove});return;}
  if(ds.hexMode){hexMode=ds.hexMode;render();return;}
  if(ds.exhaustion){act('exhaustion',{id:ds.for,delta:Number(ds.exhaustion)});return;}
  if(ds.inspiration){const payload={id:ds.for,mode:ds.inspiration};if(ds.inspiration==='pass'){const sel=document.getElementById('insp-target-'+ds.for);if(!sel||!sel.value)return;payload.target=sel.value;}act('inspiration',payload).then(ok=>{if(ok&&ds.inspiration==='use')toast('Inspiration utilisée : relancez ou jouez avec l’avantage, selon votre édition.');});return;}
  if(ds.inviteCopy){const r=inviteFind(ds.code);if(r){const text=ds.inviteCopy==='link'?inviteLink(r.code):inviteMessage(r);navigator.clipboard?.writeText(text).then(()=>toast(ds.inviteCopy==='link'?'Lien copié.':'Message copié.'),()=>toast('Copie non disponible : sélectionnez le texte.',true));}return;}
  if(ds.inviteShare!==undefined){const r=inviteFind(ds.code);if(r&&navigator.share)navigator.share({title:'Invitation Chroniques',text:inviteMessage(r)}).catch(()=>{});return;}
  if(ds.aiReset!==undefined){aiPreview=null;aiResult='';aiBusy=false;render();return;}
 if(ds.aiCopy!==undefined){if(!aiResult)return;navigator.clipboard?.writeText(aiResult).then(()=>toast('Suggestion copiée.')).catch(()=>toast('Copie impossible : sélectionnez le texte.',true));return;}
 if(ds.memoryDelete){if(actor==='mj'&&confirm('Supprimer définitivement ce souvenir de la campagne ?'))act('memoryDelete',{id:ds.memoryDelete});return;}
 if(ds.memoryStatus){if(actor!=='mj')return;const item=(state.campaignMemory||[]).find(x=>x.id===ds.memoryStatus);if(item)act('memoryUpdate',{id:item.id,values:{title:item.title,summary:item.summary,impact:item.impact,gmNotes:item.gmNotes,session:item.session,date:item.date||'',category:item.category,visibility:item.visibility,status:ds.status}});return;}
 if(ds.storyDelete){if(actor==='mj'&&confirm('Supprimer définitivement ce scénario ? Les scènes et quêtes liées seront conservées.'))act('storyDelete',{id:ds.storyDelete});return;}
 if(ds.storyInspire){if(actor!=='mj')return;const template=STORY_HINTS[ds.storyInspire],form=b.closest('.story-editor')?.querySelector('.story-form');if(!template||!form)return;for(const field of ['pitch','hook','objective','stakes']){const el=form.elements.namedItem(field);if(el&&!el.value.trim())el.value=template[field];}template.acts.forEach((a,i)=>{['title','challenge','outcome'].forEach((field,j)=>{const el=form.elements.namedItem('act'+i+'_'+field);if(el&&(j===0||!el.value.trim()))el.value=a[j];});});toast('Piste de départ ajoutée ; tout reste modifiable avant enregistrement.');return;}
 if(ds.sceneDelete){if(actor==='mj'&&confirm('Supprimer cette scène de la préparation ?'))act('sceneDelete',{id:ds.sceneDelete});return;}
 if(ds.sceneStatus){if(actor==='mj'){const item=(state.sessionFlow||[]).find(x=>x.id===ds.sceneStatus);if(item)act('sceneUpdate',{id:item.id,values:{title:item.title,summary:item.summary,gmNotes:item.gmNotes,readAloud:item.readAloud||'',status:ds.status,visibility:item.visibility,links:item.links,trackId:item.trackId||''}});}return;}
 if(ds.partyHistory!==undefined){modal='';selected=ds.partyHistory;sheetSection='history';histFilter='all';histQuery='';page='character';render();window.scrollTo?.(0,0);return;}
 if(ds.relationRemove){act('relationRemove',{id:ds.relationRemove});return;}
 if(ds.travelAdvance){act('travelAdvance',{hours:Number(ds.travelAdvance)});return;}
 if(ds.areaDamage&&ADM){const map=(state.maps||[]).find(m=>m.id===ds.map);const ar=map?.areas?.find(x=>x.id===ds.areaDamage);if(!ar)return;const names={circle:'Cercle',cone:'Cône',line:'Ligne',cube:'Cube'};areaDmgPreset={keys:ADM.tokensInArea(map,ar,mapAspect[map.id]||1).filter(t=>t.kind!=='custom').map(t=>t.kind+':'+t.refId),label:ar.label||''};modal='area-damage';render();setTimeout(()=>document.querySelector('#area-dmg-form [name=amount]')?.focus(),50);return;}
 if(ds.passkeyRemove){if(confirm('Supprimer cette clé d’accès ? L’appareil ne pourra plus s’en servir pour se connecter.'))api('passkey/remove','POST',{id:ds.passkeyRemove}).then(o=>{passkeys=o.passkeys;render();toast('Clé d’accès supprimée.');}).catch(e=>toast(e.message,true));return;}
 if(ds.tableRemove){if(confirm('Supprimer cette table ? (annulable)'))act('tableRemove',{tableId:ds.tableRemove});return;}
 if(ds.lightRemove){act('lightRemove',{lightId:ds.lightRemove});return;}
 if(ds.deployCancel!==undefined){pendingDeploy=null;render();return;}
 if(ds.tablePick){changeTable('table-mode',{op:'pick',characterId:ds.tablePick});return;}
 if(ds.tjRemove){act('travelNoteRemove',{entryId:ds.tjRemove});return;}
 if(ds.tjTripRemove){if(confirm('Supprimer ce voyage et toutes ses étapes du journal ?'))act('travelTripRemove',{tripId:ds.tjTripRemove});return;}
 if(ds.tieRemove){act('tieSet',{id:ds.pc,to:ds.tieRemove,text:''});return;}
 if(ds.sugFilter){adminFilter=ds.sugFilter;render();return;}
 if(ds.sugTab){sugTab=ds.sugTab;render();return;}
 if(ds.adminTab){adminTab=ds.adminTab;if(adminTab!=='suggestions')adminOverview=null;render();return;}
 if(ds.sugVote){api('suggestion/vote','POST',{id:ds.sugVote}).then(out=>{if(suggestData)suggestData.board=out.board;render();}).catch(e=>toast(e.message,true));return;}
 if(ds.sugDelete){if(confirm('Supprimer définitivement cette suggestion ?'))api('suggestion/delete','POST',{id:ds.sugDelete}).then(out=>{suggestData={admin:true,suggestions:out.suggestions,counts:out.counts};if(viewer)viewer.newSuggestions=out.counts.nouvelle||0;render();}).catch(e=>toast(e.message,true));return;}
 if(ds.sceneStage){act('sceneStage',{id:ds.sceneStage}).then(ok=>{if(ok)toast('Scène affichée sur l’écran de table, chez les joueurs et le spectateur.');});return;}
 if(ds.sceneUnstage!==undefined){act('sceneUnstage',{}).then(ok=>{if(ok)toast('Scène retirée de l’écran.');});return;}
 if(ds.clockTick){act('clockTick',{clockId:ds.clockTick,delta:Number(ds.delta)||1});return;}
 if(ds.clockRemove){if(confirm('Retirer cette horloge ?'))act('clockRemove',{clockId:ds.clockRemove});return;}
 if(ds.feedbackClose!==undefined){act('feedbackClose',{}).then(ok=>{if(ok)toast('Retours clos : ils sont listés ci-dessous.');});return;}
 if(ds.feedbackRemove){if(confirm('Supprimer ce tour de retours ?'))act('feedbackRemove',{roundId:ds.feedbackRemove});return;}
 if(ds.clueReveal){act('clueReveal',{clueId:ds.clueReveal,on:ds.on==='1'}).then(ok=>{if(ok&&ds.on==='1')toast('Indice révélé aux joueurs.');});return;}
 if(ds.clueRemove){if(confirm('Supprimer cet indice et ses théories ?'))act('clueRemove',{clueId:ds.clueRemove});return;}
 if(ds.theoryRemove){act('clueTheoryRemove',{clueId:ds.clue,theoryId:ds.theoryRemove});return;}
 if(ds.drawKind){drawKind=ds.drawKind;render();return;}
 if(ds.drawColor){drawColor=ds.drawColor;render();return;}
 if(ds.drawUndo){const map=(state.maps||[]).find(m=>m.id===ds.drawUndo);const last=[...(map?.drawings||[])].reverse().find(d=>d.by===actor);if(last)act('mapDrawRemove',{id:map.id,drawId:last.id});return;}
 if(ds.drawClear){act('mapDrawClear',{id:ds.drawClear});return;}
 if(ds.drawClearAll){if(confirm('Effacer tous les dessins de cette carte, y compris ceux des joueurs ?'))act('mapDrawClear',{id:ds.drawClearAll,all:true});return;}
 if(ds.weatherClear!==undefined){act('weatherSet',{values:null}).then(ok=>{if(ok)toast('Météo retirée.');});return;}
 if(ds.formEnd){if(confirm('Reprendre la forme normale ?'))act('formEnd',{id:ds.formEnd});return;}
 if(ds.lightItem){act('lightAdd',{values:{kind:ds.lightItem,pcId:ds.inventoryFor,fromBag:true}}).then(ok=>{if(ok)toast('Lumière allumée : elle s’use quand le temps du monde avance.');});return;}
 if(ds.tlKind){tlKind=ds.tlKind;render();return;}
 if(ds.comjFilter){comjFilter=ds.comjFilter;render();return;}
 if(ds.npcxFill){const i=ds.npcxFill.indexOf('|');const k=ds.npcxFill.slice(0,i),v=ds.npcxFill.slice(i+1);const el=document.querySelector('.npc-express-form [name="'+k+'"]');if(el){el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.focus();}return;}
 if(ds.todayHandout){handoutOpen=ds.todayHandout;goTab('chronicle','documents');return;}
 if(ds.mapGoto){const [mid,pid]=ds.mapGoto.split('|');mapSelectedId=mid;mapActivePin=pid;goPage('maps');return;}
 if(ds.placeOnMap){const [kind,id]=ds.placeOnMap.split('|');const sec={place:'places',pnpc:'npcs',quest:'quests'}[kind];const e=(state.campaignPlanner?.[sec]||[]).find(x=>x.id===id);pendingPlannerLink={kind,id,title:e?.title||''};mapActivePin=null;goPage('maps',()=>{document.querySelector('.map-manage')?.setAttribute('open','');toast('Touchez la carte à l’endroit voulu, puis « Ajouter le repère » : il sera relié à « '+(e?.title||'')+' ».');});return;}
 if(ds.stashRemove){if(confirm('Retirer cet objet du coffre ?'))act('stashRemove',{itemId:ds.stashRemove});return;}
 if(ds.histFilter){histFilter=ds.histFilter;render();return;}
 if(ds.histDel){const [pcId,entryId]=ds.histDel.split('|');if(confirm('Supprimer cette entrée de l’historique ?'))act('historyRemove',{id:pcId,entryId});return;}
 if(ds.sheetSection){sheetSection=SV.section(ds.sheetSection);render();document.querySelector('.sheet-sections')?.scrollIntoView?.({block:'start',behavior:'instant'});return;}
 if(ds.saveGmCharacter!==undefined){const id=document.querySelector('#gm-own-character')?.value||null;if(confirm('Associer ce personnage à votre compte dans cette campagne ?')){api('campaigns/character','POST',{characterId:id}).then(()=>refresh()).then(()=>toast('Personnage associé au compte.')).catch(err=>toast(err.message,true));}return;}
 if(ds.campaignSwitch){changeTable('campaigns/select',{campaignId:ds.campaignSwitch});return;}
 if(ds.helpToggle!==undefined){helpOpen=!helpOpen;render();return;}
  if(ds.nav){clearCrop();previewMediaId=null;mobileMore=false;helpOpen=false;page=ds.nav;render();if(page==='stories'&&actor==='mj')loadAiStatus();returnToTop();if(page==='campaign'&&actor==='mj')fetchManagement();return;}
 if(ds.dtOpen&&ds.char){selected=ds.char;sheetSection='build';page='character';modal='';render();setTimeout(()=>document.querySelector('.dt-panel')?.scrollIntoView({block:'start'}),60);return;}
 if(ds.char){chooseChar(ds.char);return;}
 if(ds.modal){if(ds.modal==='add'?actor!=='mj':!L.canEdit(state,actor,selected)){toast('Modification non autorisée.',true);return;}if(ds.modal==='add'&&state.edition==='custom'){toast('Choisissez les règles 2014 ou 2024 pour ce créateur.',true);return;}modal=ds.modal;render();return;}
 if(ds.task){handleTask(ds.task);return;}
 if(ds.memberRole){
   if(!viewer?.isOwner){toast('Seul le MJ propriétaire peut modifier les rôles.',true);return;}
   const promote=ds.newRole==='gm';
   const msg=promote?'Nommer '+ds.memberName+' co-MJ ? Cette personne pourra consulter et modifier toutes les fiches et notes secrètes de la campagne.':'Retirer le rôle MJ à '+ds.memberName+' ? La personne redeviendra joueur et conservera son personnage.';
   if(confirm(msg))api('member/role','POST',{userId:ds.memberRole,role:promote?'gm':'player'}).then(()=>refresh()).then(()=>toast(promote?'Nouveau co-MJ activé.':'Rôle joueur rétabli.')).catch(e=>toast(e.message,true));
   return;
 }
 if(ds.revokeInvite){if(confirm('Révoquer cette invitation ? Le code ne fonctionnera plus.'))api('invite/revoke','POST',{id:ds.revokeInvite}).then(()=>fetchManagement()).then(()=>toast('Invitation révoquée.')).catch(e=>toast(e.message,true));return;}
 if(ds.removeMember){if(confirm('Détacher '+ds.memberName+' de la campagne ? Son compte sera supprimé et il sera déconnecté. Sa fiche restera dans la campagne.'))api('member/remove','POST',{userId:ds.removeMember}).then(()=>refresh()).then(()=>toast('Joueur détaché.')).catch(e=>toast(e.message,true));return;}
 if(ds.removeAbility){if(confirm('Retirer cette capacité de la fiche ?'))act('removeAbility',{id:selected,abilityId:ds.removeAbility});return;}
 if(ds.removeResource){if(confirm('Retirer cette ressource de la fiche ?'))act('removeResource',{id:selected,resourceId:ds.removeResource});return;}
 if(ds.castSpell){if(!L.canEdit(state,actor,selected)){toast('Accès refusé.',true);return;}modal='cast:'+ds.castSpell;render();return;}
 if(ds.removeSpell){if(confirm('Retirer ce sort du grimoire ?'))act('removeSpell',{id:selected,entryId:ds.removeSpell});return;}
 if(ds.plannerDelete){if(actor==='mj'&&confirm('Supprimer définitivement cette entrée de campagne ?'))act('plannerDelete',{section:ds.section,id:ds.plannerDelete});return;}
 if(ds.templateDelete){if(actor==='mj')actUndoable('templateDelete',{id:ds.templateDelete},'Monstre supprimé de votre bestiaire.');return;}
 if(ds.templateFromNpc){if(actor==='mj')act('templateFromNpc',{npcId:ds.templateFromNpc});return;}
 if(ds.encounterDelete){if(actor==='mj')actUndoable('encounterDelete',{id:ds.encounterDelete},'Rencontre supprimée (les monstres déjà en combat restent).');return;}
 if(ds.groupRemove){if(actor==='mj')act('encounterGroupRemove',{id:ds.for,groupId:ds.groupRemove});return;}
 if(ds.encounterDeploy&&actor==='mj'&&!state.combat.started&&(state.maps||[]).some(m=>m.hasImage)){modal='deploy:'+ds.encounterDeploy;render();return;}
 if(ds.encounterDeploy){if(actor==='mj'&&!state.combat.started&&confirm('Ajouter les exemplaires de cette rencontre aux créatures déjà présentes ? Aucun jet de dé ne sera lancé.')){act('encounterDeploy',{id:ds.encounterDeploy}).then(ok=>{if(ok){page='combat';render();toast('Créatures ajoutées. Saisissez les initiatives obtenues avec vos dés.');}});}return;}
 if(ds.npcCreate!==undefined){if(actor==='mj'&&!state.combat.started){modal='npc-new';render();}return;}
 if(ds.npcEdit){if(actor==='mj'){modal='npc-edit:'+ds.npcEdit;render();}return;}
 if(ds.npcRemove){if(actor==='mj'&&confirm('Supprimer cette créature du combat ?'))act('npcRemove',{id:ds.npcRemove});return;}
 if(ds.libitemEdit){modal='libitem-edit:'+ds.libitemEdit;render();return;}
 if(ds.catalogCopy){modal='libitem-srd:'+ds.catalogCopy;render();return;}
 if(ds.libitemDelete){const x=homebrewItems().find(i=>i.id===ds.libitemDelete);if(x)actUndoable('libItemDelete',{id:x.id},'« '+x.name+' » supprimé (les exemplaires donnés restent).');return;}
 if(ds.libitemGive){const id=ds.libitemGive,to=document.querySelector('[data-hb-target="'+id+'"]')?.value,qty=Number(document.querySelector('[data-hb-qty="'+id+'"]')?.value)||1;const x=homebrewItems().find(i=>i.id===id);
  act('libItemGive',{id,characterId:to,quantity:qty}).then(ok=>{if(ok)toast(to==='__loot'?(x?.name||'Objet')+' placé dans la réserve de butin.':(x?.name||'Objet')+' donné à '+(L.findPc(state,to)?.name||'')+'.');});return;}
 if(ds.libitemDirect){act('libItemGive',{id:ds.libitemDirect,characterId:ds.character,quantity:1}).then(ok=>{if(ok)toast('Objet maison ajouté à l’inventaire.');});return;}
 if(ds.wizard!==undefined){wizardGo(b.closest('form'),Number(ds.wizard));return;}
 if(ds.wizardStandard!==undefined){const form=b.closest('form'),cls=form.querySelector('[name="classId"]').value;const arr=CG.standardArray(cls);for(const [k,v] of Object.entries(arr)){const el=form.querySelector('[name="base_'+k+'"]');if(el)el.value=v;}wizardRefresh(form);toast(cls?'Scores répartis selon la caractéristique principale de la classe : échangez-les librement.':'Choisissez d’abord une classe pour une répartition adaptée.');return;}
 if(ds.wizardApply!==undefined){const form=b.closest('form');form.querySelector('[name="hp"]').value=ds.hp;form.querySelector('[name="ac"]').value=ds.ac;toast('PV et CA renseignés.');return;}
 if(ds.sessionPublish){act('sessionPublish',{id:ds.sessionPublish,value:ds.value==='1'}).then(ok=>{if(ok)toast(ds.value==='1'?'Résumé visible des joueurs dans la Chronique.':'Résumé de nouveau privé.');});return;}
 if(ds.sessionCopy){const ss=findSession(ds.sessionCopy);if(ss&&SS){const t=SS.text(ss,{audience:'player',party:state.characters.length});(navigator.clipboard?.writeText(t)||Promise.reject()).then(()=>toast('Résumé copié (version joueurs, sans les secrets du MJ).'),()=>toast('Copie impossible ici : sélectionnez le texte à la main.',true));}return;}
 if(ds.sessionMemory){const ss=findSession(ds.sessionMemory);if(ss&&SS){const lines=SS.lines(ss,{audience:'player'});const d=new Date(ss.startedAt);const iso=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10);act('memoryAdd',{values:{title:('Séance du '+d.toLocaleDateString('fr-FR')).slice(0,100),summary:(lines.join(' ')||'Séance sans fait notable enregistré.').slice(0,1000),impact:'',gmNotes:'',session:'',date:iso,category:'event',status:'resolved',visibility:'private'}}).then(ok=>{if(ok)toast('Ajouté à la mémoire de campagne (privé : partagez-le depuis la mémoire si vous le souhaitez).');});}return;}
 if(ds.templateEdit){if(actor==='mj'){modal='tpl-edit:'+ds.templateEdit;render();}return;}
 if(ds.npcSlot){const delta=Number(ds.delta);act('npcSlot',{id:ds.npcSlot,level:Number(ds.level),delta}).then(ok=>{if(ok&&delta>0){const n=(state.combat.npcs||[]).find(x=>x.id===ds.npcSlot);toast('Sort de niveau '+ds.level+' noté'+(n?.spellcasting?.dc?' · DD '+n.spellcasting.dc:'')+(n?.spellcasting?.attack!=null?' · attaque d20'+(n.spellcasting.attack>=0?'+':'')+n.spellcasting.attack:'')+' — lancez les vrais dés.');}});return;}
 if(ds.npcSlotReset){act('npcSlot',{id:ds.npcSlotReset,level:'reset'}).then(ok=>{if(ok)toast('Emplacements restaurés.');});return;}
 if(ds.npcRecharge){act('npcRecharge',{id:ds.npcRecharge,name:ds.name}).then(ok=>{if(ok)toast(ds.name.replace(/\s*\(recharge[^)]*\)/i,'')+' est de nouveau disponible.');});return;}
 if(ds.npcAction){act('npcActionLog',{id:ds.npcAction,text:ds.text,recharge:ds.recharge||''}).then(ok=>{if(ok)toast((ds.hint||'Action notée')+' — lancez les vrais dés.'+(ds.recharge?' Pouvoir à recharger : rappel au début de son tour.':''));});return;}
 if(ds.npcLegendary){act('npcLegendary',{id:ds.npcLegendary,op:'spend',cost:Number(ds.cost)||1,text:ds.text}).then(ok=>{if(ok)toast((ds.hint||'Action légendaire notée')+' — lancez les vrais dés.');});return;}
 if(ds.npcLegendaryReset){act('npcLegendary',{id:ds.npcLegendaryReset,op:'reset'});return;}
 if(ds.npcHp){const el=document.querySelector('[data-npc-amount=\"'+ds.for+'\"]');const amount=Number(el?.value||0);if(Number.isSafeInteger(amount)&&amount>0)act('npcHp',{id:ds.for,delta:ds.npcHp==='damage'?-amount:amount,...(ds.npcHp==='damage'&&document.querySelector('[data-npc-type="'+ds.for+'"]')?.value?{damageType:document.querySelector('[data-npc-type="'+ds.for+'"]').value}:{})});else toast('Montant invalide.',true);return;}
 if(ds.initiativeMove){act('moveInitiative',{id:ds.for,direction:Number(ds.initiativeMove)});return;}
 if(ds.concentrationCheck){act('resolveConcentration',{id:ds.for,checkId:ds.concentrationCheck,result:ds.result});return;}
 if(ds.spend){act('spend',{id:ds.for,type:ds.spend});return;}
 if(ds.ability){act('ability',{id:selected,abilityId:ds.ability});return;}
 if(ds.heritage){act('heritageUse',{id:selected,featureId:ds.heritage,delta:Number(ds.delta)});return;}
 if(ds.removeFeat){if(confirm('Supprimer ce don de la fiche ?'))act('removeFeat',{id:selected,featId:ds.removeFeat});return;}
 if(ds.condition){act('condition',{id:selected,condition:ds.condition});return;}
 if(ds.slot){act('slot',{id:selected,key:ds.slot,delta:Number(ds.delta)});return;}
 if(ds.resource){act('resource',{id:selected,resourceId:ds.resource,delta:Number(ds.delta)});return;}
}
