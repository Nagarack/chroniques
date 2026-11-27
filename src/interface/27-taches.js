// ——— 27 · Tâches (boutons data-task) ———
async function handleTask(task){const id=selected;const amount=()=>Math.floor(Math.max(0,+($('#hp-amount')?.value||0)));
 if(typeof task==='string'&&task.startsWith('timer-clear:')){const [tid,...cs]=task.slice(12).split('|');await act('conditionTimer',{id:tid,condition:cs.join('|'),rounds:0});return;}
 if(task==='timer-set'){const [tid,...cs]=String($('#timer-target')?.value||'').split('|');if(tid)await act('conditionTimer',{id:tid,condition:cs.join('|'),rounds:Number($('#timer-rounds')?.value||0),when:$('#timer-when')?.value||'end',anchor:$('#timer-anchor')?.value||tid,save:$('#timer-save')?.value||''});return;}
 if(task==='turn-timer-restart'){await act('turnTimerRestart');return;}
 if(typeof task==='string'&&task.startsWith('hp-quick:')){const d=Number(task.slice(9));if(Number.isInteger(d)&&Math.abs(d)<=10&&d!==0)await act('hp',{id,delta:d,...(d<0&&$('#hp-type')?.value?{damageType:$('#hp-type').value}:{})});return;}
 switch(task){
 case 'update-cancel':try{updateInfo=await api('update/cancel','POST',{});render();}catch(e){toast(e.message,true);}break;
 case 'update-apply':{const v=updateInfo?.pending?.version;if(!v||!confirm('Installer Chroniques '+v+' maintenant ? Le serveur va redémarrer (environ une minute).'))break;try{await api('update/apply','POST',{confirm:true});if(events){events.close();events=null;}waitRestart(v);}catch(e){toast(e.message,true);}break;}
 case 'whispers':openWhispers();break;
 case 'world-enable':if(await act('worldTimeEnable',{on:true}))toast('Calendrier du monde activé.');break;
 case 'world-disable':if(confirm('Désactiver le calendrier du monde ? La date est conservée.'))await act('worldTimeEnable',{on:false});break;
 case 'amb-stop':await act('ambienceStop');break;
 case 'amb-listen':ambListen=!ambListen;if(ambListen)audioNonce='';render();break;
 case 'backups-load':backupsInfo=null;backupReport=null;render();break;
 case 'backup-mirror-off':try{await api('backup-mirror','POST',{path:''});backupsInfo=null;render();toast('Copie miroir désactivée.');}catch(e){toast(e.message,true);}break;
 case 'filter-spells':spellFilterText=$('#spell-search')?.value.trim().slice(0,70)||'';spellFilterLevel=$('#spell-level-filter')?.value||'all';render();break;
 case 'start':await act('start');break;
 case 'sort-initiative':await act('sortInitiative');break;
 case 'next':await act('next');break;
 case 'undo':await act('undo');break;
 case 'theme-cycle':if(window.ChroniquesTheme){window.ChroniquesTheme.cycle();render();}break;
 case 'end':if(confirm('Terminer le combat en cours ?'))await act('end');break;
 case 'damage':await act('hp',{id,delta:-amount(),damageType:$('#hp-type')?.value||''});break;
 case 'heal':await act('hp',{id,delta:amount()});break;
 case 'temp':await act('tempHp',{id,value:Number($('#temp-amount').value)});break;
 case 'move':{const v=Number($('#move-amount').value);await act('move',{id,value:uiFeet()?Math.round(v*0.3*10)/10:v});break;}
 case 'reset-turn':await act('resetTurn',{id});break;
 case 'concentration':await act('concentration',{id,value:$('#concentration').value});break;
 case 'death-success':await act('deathSave',{id,result:'success'});break;
 case 'death-failure':await act('deathSave',{id,result:'failure'});break;
 case 'level-up':if(CG){levelUpTarget='';modal='level-up:'+id;render();}else if(confirm('Passer au niveau '+(L.findPc(state,id)?.level+1)+' ?')){if(await act('levelUp',{id}))toast('Niveau enregistré.');}break;
 case 'deactivate-slots':if(confirm('Désactiver ce suivi ? Les dépenses automatiques seront effacées mais les ressources manuelles restent intactes.'))await act('deactivateSlots',{id});break;
 case 'activate-slots':if(confirm('Activer un NOUVEAU compteur de sorts ? Il reste séparé des ressources manuelles déjà ajoutées.'))await act('activateSlots',{id});break;
 case 'short-rest':modal='rest-short:'+id;render();break;
 case 'rest-all':restAllPrompt();break;
 case 'rest-short-all':restShortAllPrompt();break;
 case 'table-screen':openTableScreen();break;
 case 'long-rest':if(confirm('Appliquer un repos long ? Vérifiez les conditions de repos.'))await act('rest',{id,type:'long'});break;
 case 'save-notes':await act('gmNotes',{value:$('#gm-notes').value});toast('Notes privées enregistrées.');break;
 case 'custom-save':await act('customActions',{value:$('#custom-actions').value.split('\n').map(x=>x.trim()).filter(Boolean).slice(0,30)});break;
 case 'invite':try{inviteResult=await api('invites','POST',{characterId:$('#invite-character').value});inviteResults=[inviteResult];await fetchManagement();render();toast('Invitation prête : faites scanner le QR code ou envoyez le lien.');}catch(e){toast(e.message,true);}break;
 case 'bestiary-add':{if(!B)break;const typed=String($('#bestiary-pick')?.value||'').trim();const own=(state.gmLibrary?.templates||[]).find(t=>homebrewLabel(t)===typed||t.name.toLocaleLowerCase('fr')===typed.toLocaleLowerCase('fr'));
  if(own){const q=Math.min(12,Math.max(1,Math.floor(Number($('#bestiary-qty')?.value)||1)));if(await act('templateDeploy',{id:own.id,quantity:q}))toast(q>1?`${q} × ${own.name} ajoutés depuis votre bestiaire maison, sur une seule initiative.`:`${own.name} ajouté depuis votre bestiaire maison.`);break;}
  const m=B.list().find(x=>bestiaryLabel(x)===typed)||B.list().find(x=>x.name.toLocaleLowerCase('fr')===typed.toLocaleLowerCase('fr')||(x.nameEn||'').toLowerCase()===typed.toLowerCase()||(x.alias||'').toLocaleLowerCase('fr')===typed.toLocaleLowerCase('fr'));if(!m){toast('Choisissez une créature dans la liste proposée.',true);break;}const q=Math.min(12,Math.max(1,Math.floor(Number($('#bestiary-qty')?.value)||1)));const group=q>1?('g-'+m.id+'-'+Date.now().toString(36)).toLowerCase().replace(/[^a-z0-9-]/g,'').slice(-40).replace(/^-+/,''):'';for(let i=1;i<=q;i++){const v=B.creatureValues(m);if(q>1){v.name=m.name+' '+i;v.group=group;}if(!await act('npcAdd',{values:v}))break;}toast(q>1?`${q} × ${m.name} ajoutés, masqués aux joueurs, regroupés sur une seule initiative. Révélez-les au bon moment.`:`${m.name} ajouté, masqué aux joueurs. Révélez-le au bon moment.`);}break;
 case 'gm-screen':modal='gm-screen';render();break;case 'lang-toggle':window.ChroniquesI18n?.set(uiLang()==='en'?'fr':'en');break;case 'wall-stop':wallStart=null;render();break;case 'vote-close':if(await act('voteClose',{}))toast('Résultat noté dans le journal.');break;case 'vote-cancel':if(confirm('Annuler ce vote ?'))await act('voteCancel',{});break;case 'spectator-create':{if(spectatorInfo?.enabled&&!confirm('Créer un nouveau lien ? L’ancien ne fonctionnera plus.'))break;try{const r=await api('spectator','POST',{op:'create'});spectatorNew=r.token;spectatorInfo={enabled:true};render();}catch(e){toast(e.message,true);}break;}case 'spectator-copy':try{await navigator.clipboard.writeText(location.origin+'/#spectateur='+spectatorNew);toast('Lien copié.');}catch{toast('Copie non disponible : sélectionnez le lien à la main.',true);}break;case 'spectator-revoke':{if(!confirm('Désactiver le lien spectateur ?'))break;try{await api('spectator','POST',{op:'revoke'});spectatorNew='';spectatorInfo={enabled:false};render();toast('Lien spectateur désactivé.');}catch(e){toast(e.message,true);}break;}case 'gc-close':if(await act('groupCheckClose',{}))toast('Résultat noté dans le journal.');break;case 'gc-cancel':if(confirm('Annuler ce test de groupe ?'))await act('groupCheckCancel',{});break;case 'units-toggle':window.ChroniquesI18n?.setUnits?.(uiFeet()?'m':'ft');break;case 'area-damage':areaDmgPreset={keys:[],label:''};modal='area-damage';render();break;
 case 'party-view':modal='party';render();break;
 case 'comj-link':{const url=location.origin+'/#poste-comj';try{await navigator.clipboard.writeText(url);toast('Adresse copiée : '+url+' — connectez-vous avec un compte co-MJ (ou le vôtre) sur l’autre appareil.');}catch{toast('Sur l’autre appareil, ouvrez '+url+' et connectez-vous avec un compte co-MJ.');}break;}
 case 'adventure-new':await adventureNew();break;
 case 'adventure-preview':await adventurePreview();break;
 case 'tpl-import-cancel':tplPending=null;render();break;
 case 'travel-camp':await act('travelCamp',{});break;
 case 'travel-rations':if(confirm('Retirer une ration de l’inventaire de chaque personnage ?'))await act('travelRations',{});break;
 case 'travel-end':if(confirm('Terminer le voyage ?'))await act('travelEnd',{});break;
 case 'recap-compose':{const ta=document.querySelector('#recap-text');if(!ta||!CHR)break;if(ta.value.trim()&&!confirm('Remplacer le texte actuel par une proposition ?'))break;ta.value=CHR.recapDraft(state);ta.dispatchEvent(new Event('input',{bubbles:true}));ta.focus();toast('Proposition prête : relisez-la avant d’enregistrer.');break;}
 case 'update-check':try{updateInfo=await api('update/check','POST',{});render();toast(updateInfo.remote?.available?'Nouvelle version disponible : '+updateInfo.remote.available.version:updateInfo.remote?.error?updateInfo.remote.error:'Chroniques est à jour.',!!updateInfo.remote?.error);}catch(e){toast(e.message,true);}break;
 case 'update-download':try{toast('Téléchargement et vérification de la signature…');updateInfo=await api('update/download','POST',{});render();toast('Mise à jour prête : vous pouvez l’installer.');}catch(e){toast(e.message,true);try{updateInfo=await api('update/status');render();}catch{}}break;
 case 'push-on':await pushOn();break;
 case 'android-test':ANDROID?.testNotification();break;
 case 'android-update':ANDROID?.updateApp();break;
 case 'android-server':if(confirm('Revenir à l’écran de choix du serveur ?'))ANDROID?.changeServer();break;
 case 'push-off':await pushOff();break;
 case 'push-test':try{const r=await api('push/test','POST',{});toast(r.sent?'Notification d’essai envoyée.':'Aucun appareil n’a accepté la notification.',!r.sent);}catch(e){toast(e.message,true);}break;
 case 'tpl-import-confirm':{if(!tplPending)break;try{const res=await fetch('/api/campaign-template/import',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:tplPending.file});const out=await res.json().catch(()=>({}));if(!res.ok)throw new Error(out.error||'Import impossible.');viewer=out.viewer;version=out.version;state=out.state;tplPending=null;render();const sk=out.imported?.skipped||[];toast('Modèle importé.'+(sk.length?' '+(sk.length>1?`${sk.length} éléments ignorés : ${sk.slice(0,3).join(' ; ')}`:`Élément ignoré : ${sk[0]}`):''),sk.length>0);}catch(e){toast(e.message,true);}break;}
 case 'npc-express':modal='npc-express';render();setTimeout(()=>document.querySelector('.npc-express-form input')?.focus(),40);break;
 case 'print-today':printHtml('<div class="print-sheet today-print">'+todayPageHtml()+'</div>');break;
 case 'search-open':openSearch();break;
 case 'book':printBook();break;
 case 'whats-new':modal='whats-new';render();break;
 case 'whats-new-dismiss':markVersionSeen();render();break;
 case 'table-open':modal='table-start';render();setTimeout(()=>document.querySelector('#table-mode-form [name=pin]')?.focus(),50);break;
 case 'table-quit':modal='table-quit';render();setTimeout(()=>document.querySelector('#table-mode-form [name=pin]')?.focus(),50);break;
 case 'table-release':await changeTable('table-mode',{op:'release'});break;
 case 'admin-backup':if(adminBusy)break;adminBusy=true;render();try{const r=await api('admin/backup','POST',{});toast(r.mirrored?'Sauvegarde faite (copie miroir comprise).':'Sauvegarde faite.');}catch(e){toast(e.message,true);}adminBusy=false;loadAdminOverview();break;
 case 'march-clear':if(confirm('Effacer l’ordre de marche et les veilles ?'))act('marchClear',{});break;
 case 'wake-toggle':keepAwake=!keepAwake;try{localStorage.setItem('chroniques-eveil',keepAwake?'1':'0');}catch{}wakeSync();render();toast(keepAwake?'Cet écran restera allumé pendant que Chroniques est ouvert.':'Écran toujours allumé : désactivé.');break;
 case 'read-easy':readEasy=!readEasy;try{localStorage.setItem('chroniques-lecture',readEasy?'1':'0');}catch{}applyTextSize();render();toast(readEasy?'Lecture facilitée : police OpenDyslexic et texte plus espacé.':'Lecture facilitée désactivée.');break;
 case 'cvd-toggle':cvdMode=!cvdMode;try{localStorage.setItem('chroniques-daltonien',cvdMode?'1':'0');}catch{}applyTextSize();render();toast(cvdMode?'Couleurs pour daltoniens : jetons, zones et dessins avec couleurs distinctes et symboles.':'Couleurs habituelles rétablies.');break;
 case 'text-size':textSize=(textSize+1)%3;try{localStorage.setItem('chroniques-taille',String(textSize));}catch{}applyTextSize();render();toast('Taille du texte : '+['normale','grande','très grande'][textSize]+'.');break;
 case 'lair-done':act('lairDone',{});break;
 case 'down-dismiss':downAlerts=[];render();break;
 case 'tpl-new':if(actor==='mj'){modal='tpl-new';render();}break;
 case 'libitem-new':if(actor==='mj'){modal='libitem-new';render();}break;
 case 'portraits-by-class':if(confirm('Remplacer les icônes de portrait des aventuriers par l’icône de leur classe ? Les photos importées sont conservées.'))act('portraitsByClass',{}).then(ok=>{if(ok)toast('Portraits mis à jour selon la classe.');});break;
 case 'pause-done':try{localStorage.setItem(pauseKey(),String(Date.now()));}catch{}render();break;
 case 'pause-later':try{localStorage.setItem(pauseKey(),String(Date.now()-Math.max(0,pauseEvery-15)*60000));}catch{}render();break;
 case 'session-new':if(confirm('Clore la séance en cours et en commencer une nouvelle ? Le résumé actuel reste consultable dans « Séances précédentes ».'))act('sessionStart',{}).then(ok=>{if(ok)toast('Nouvelle séance commencée.');});break;
 case 'suggest-open':modal='suggest';sugTab='new';suggestData=null;render();loadSuggestions();setTimeout(()=>document.querySelector('#suggest-form [name=title]')?.focus(),50);break;
  case 'sug-reload':suggestData=null;render();loadSuggestions();break;
  case 'admin-reload':adminOverview=null;render();break;
  case 'sug-copy':{const txt=(suggestData?.suggestions||[]).map(x=>'['+(SUG_STATUS[x.status]||x.status)+'] '+x.title+' — '+x.author+' ('+sugDate(x.at)+')\n'+x.text+(x.reply?'\n> '+x.reply:'')).join('\n\n');try{await navigator.clipboard.writeText(txt);toast('Suggestions copiées.');}catch{toast('Copie impossible.',true);}break;}
  case 'report-open':modal='report';render();setTimeout(()=>document.querySelector('#report-form textarea')?.focus(),50);break;
 case 'reports-load':try{reportList=(await api('reports')).reports;render();}catch(e){toast(e.message,true);}break;
 case 'reports-copy':if(reportList){const txt=reportList.map(r=>`[${r.severity}] ${r.at} · ${r.page} · ${r.user} (${r.role}) · ${r.device} · ${r.screen} · v${r.version}\n${r.message}`).join('\n\n');navigator.clipboard?.writeText(txt).then(()=>toast('Signalements copiés.'),()=>toast('Copie non disponible.',true));}break;
 case 'reset-close':resetResult=null;render();break;
 case 'demo-campaign':if(confirm('Créer une campagne d’entraînement (avec quelques monstres d’exemple) ? Votre vraie campagne n’est pas modifiée.'))await changeTable('campaigns/demo',{});break;
 case 'backup-now':try{const r=await api('backup-now','POST',{});await refresh();toast('Sauvegarde créée : '+r.file+'. Copiez le dossier backups sur une clé USB ou un autre disque de temps en temps.');}catch(e){toast(e.message,true);}break;
 case 'invite-all':try{const r=await api('invites/all','POST',{});inviteResults=r.invites||[];inviteResult=inviteResults[0]||null;await fetchManagement();render();toast(inviteResults.length>1?`${inviteResults.length} invitations prêtes.`:'Invitation prête.');}catch(e){toast(e.message,true);}break;
 case 'copy-all-invites':try{await navigator.clipboard.writeText(inviteResults.map(r=>inviteMessage(r)).join('\n\n— — —\n\n'));toast('Messages copiés.');}catch{toast('Copie non disponible sur ce navigateur.',true);}break;
 case 'accept-pending-invite':{const code=pendingInvite;pendingInvite='';if(code)await changeTable('campaigns/join',{code});else render();}break;
 case 'dismiss-pending-invite':pendingInvite='';render();break;
 case 'reload-management':await fetchManagement();break;
 case 'save-title':await act('campaignTitle',{value:$('#campaign-name').value});break;
 case 'copy-invite-message':if(inviteResult){try{await navigator.clipboard.writeText(inviteMessage());toast('Message d’invitation copié.');}catch{const t=$('#invite-message');if(t){t.focus();t.select();}toast('Copie non disponible : le message est sélectionné, copiez-le.',true);}}break;
  case 'note-new':noteDrafts.new=noteDrafts.new||{title:'',body:'',baseAt:''};render();break;
  case 'copy-invite':if(inviteResult){try{await navigator.clipboard.writeText(inviteResult.code);toast('Code copié.');}catch{toast('Copie non disponible : sélectionnez le code.',true);}}break;
 case 'export':exportFile();break;
 case 'preview-close':previewMediaId=null;render();break;
 case 'spotlight-hide':await act('spotlightHide');break;
 case 'spotlight-dismiss':spotlightDismissedId=state.spotlight?.id||null;render();break;
 case 'logout':if(events)events.close();offlineSnapshotClear();await api('logout','POST');location.reload();break;
 case 'retry-online':await tryReconnect();if(offlineMode)toast('Toujours hors connexion.',true);break;
 case 'close-modal':modal='';render();break;
 }
}
