// ——— 07 · Synchronisation, flux en direct, démarrage, hors ligne, actions ———
const SDF=(typeof window!=='undefined'&&window.ChroniquesDiff)||null;let syncTag='',serverCopy=null;
const cloneState=o=>typeof structuredClone==='function'?structuredClone(o):JSON.parse(JSON.stringify(o));
function acceptState(r){if(r.patch){if(!SDF||!serverCopy||r.base!==syncTag){syncTag='';serverCopy=null;const e=new Error('resync');e.resync=true;throw e;}SDF.apply(serverCopy,r.patch);}else serverCopy=r.state;
 syncTag=SDF&&r.syncTag?r.syncTag:'';viewer=r.viewer;version=r.version;state=SDF?cloneState(serverCopy):serverCopy;}
// Lecture seule pour les tests et le diagnostic : l'état tel que cet appareil le voit.
if(typeof window!=='undefined')window.__chroniquesEtat=()=>({viewer,version,state,syncTag});
async function acceptAction(out){try{acceptState(out);}catch(e){if(!e.resync)throw e;acceptState(await api('state'));}}
async function fetchState(){try{acceptState(await api('state'+(syncTag?'?since='+encodeURIComponent(syncTag):'')));}catch(e){if(!e.resync)throw e;acceptState(await api('state'));}}
async function refresh(){setTimeout(wakeSync,0);if(tableMode)return refreshTable();const before=outboxKey();await fetchState();setTimeout(offlineSnapshotSave,0);if(outboxKey()!==before||!outbox.length)outboxLoad();actor=viewer.role==='gm'?'mj':viewer.characterId;if(!campaignList||campaignList.activeId!==viewer.campaignId||page==='campaign'||!refresh.__seen){refresh.__seen=true;try{campaignList=await api('campaigns');}catch{campaignList={activeId:viewer.campaignId,campaigns:[]};}}onboardingLoad();uxLoad();deskCustomizeOpen=false;deskLoad();fightCustomizeOpen=false;fightLoad();selected=actor==='mj'?(L.findPc(state,selected)?.id||state.characters[0]?.id||''):actor;if(!refresh.__comj&&typeof location!=='undefined'&&location.hash==='#poste-comj'&&actor==='mj'){refresh.__comj=true;page='comj';}if(page==='campaign'&&actor==='mj')await fetchManagement(false);render();}
async function changeTable(endpoint,body){try{await api(endpoint,'POST',body);if(events){events.close();events=null;}management=null;inviteResult=null;page='overview';selected='';modal='';mobileMore=false;await refresh();connectEvents();returnToTop();}catch(err){toast(err.message,true);}}

async function fetchManagement(draw=true){if(actor!=='mj')return;try{management=await api('management');if(draw&&page==='campaign')render();}catch(err){toast(err.message,true);}}
function undoBtn(){return viewer?.canUndo?'<button type="button" class="btn btn-secondary" data-task="undo" title="Annuler la dernière action de combat">Annuler</button>':'';}
function setConnectionLabel(label){connectionState=label;document.body?.classList?.toggle('is-offline',/Reconnexion/.test(label));document.body?.classList?.toggle('is-live',/En direct/.test(label));const badge=document.querySelector('#realtime-state');if(badge)badge.textContent=label;}
// Plusieurs mises à jour rapprochées (combat rapide) : une seule actualisation à la fois, la dernière gagne.
let refreshing=null,refreshAgain=false;
function queueRefresh(){if(refreshing){refreshAgain=true;return refreshing;}refreshing=(async()=>{do{refreshAgain=false;await refresh();}while(refreshAgain);})().finally(()=>{refreshing=null;});return refreshing;}
// V5 — présence : le serveur n'envoie « À vous de jouer » que si l'application n'est pas à l'écran.
function sendPresence(){if(!viewer||tableMode)return;fetch('/api/presence',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({visible:!document.hidden})}).catch(()=>{});}
if(typeof document!=='undefined')document.addEventListener('visibilitychange',sendPresence);
function connectEvents(){if(events)events.close();setConnectionLabel('Connexion…');events=new EventSource('/api/events');events.addEventListener('open',()=>{if(document.hidden)sendPresence();});events.addEventListener('update',async e=>{try{const msg=JSON.parse(e.data);if(msg.version!==version||msg.campaignId&&msg.campaignId!==viewer?.campaignId||msg.role&&msg.role!==viewer?.role){if(notesEditing){notesPending=true;return;}await queueRefresh();}}catch(err){console.warn('Synchronisation :',err);setConnectionLabel('Synchronisation différée');}});events.addEventListener('ping',e=>{try{receivePing(JSON.parse(e.data));}catch{}});events.onerror=()=>setConnectionLabel('Reconnexion en cours…');events.onopen=()=>{setConnectionLabel('● En direct');if(outbox.length)setTimeout(flushOutbox,300);checkAppVersion();};}
// Après une mise à jour du serveur, chaque appareil recharge la nouvelle version de l'interface (actions en attente conservées).
async function checkAppVersion(){try{const r=await fetch('/api/status',{cache:'no-store'});const j=await r.json();if(network.version&&j.version&&j.version!==network.version&&!tableMode){toast('Chroniques '+j.version+' installé : rechargement…');setTimeout(()=>location.reload(),1500);}else if(tableMode&&j.version!==network.version&&network.version){setTimeout(()=>location.reload(),1500);}}catch{}}
if(typeof window.addEventListener==='function'){window.addEventListener('offline',()=>setConnectionLabel('Reconnexion en cours…'));window.addEventListener('online',()=>{connectEvents();setTimeout(flushOutbox,800);});}
function readInviteFromUrl(){try{const m=/[#&]invitation=([A-Za-z0-9_-]{6,64})/.exec(location.hash||''),r=/[#&]reinitialiser=([A-Za-z0-9_-]{6,64})/.exec(location.hash||'');if(m)pendingInvite=decodeURIComponent(m[1]);if(r)pendingReset=decodeURIComponent(r[1]);if(m||r)history.replaceState(null,'',location.pathname+location.search);}catch{}}
async function bootstrap(){readInviteFromUrl();try{network=await api('status');}catch(err){const snap=isNetworkError(err)?offlineSnapshotLoad():null;
  if(snap){network=snap.network||network;viewer=snap.viewer;version=snap.version;state=snap.state;actor=viewer.role==='gm'?'mj':viewer.characterId;selected=actor==='mj'?(state.characters[0]?.id||''):actor;offlineMode=true;offlineAt=snap.at;outboxLoad();uxLoad();onboardingLoad();render();setInterval(tryReconnect,15000);window.addEventListener('online',tryReconnect);return;}
  $('#app').innerHTML=`<div class="auth-page"><div class="auth-card"><h1>Serveur inaccessible</h1><p>${esc(err.message)}</p><p>Vérifiez que le PC du MJ est allumé et que Chroniques y est démarré, puis rechargez la page.</p></div></div>`;return;}
 if(spectatorToken){document.title='Chroniques · spectateur';await refreshTable();wakeSync();setInterval(()=>{if(!document.hidden)refreshTable();},4000);return;}
 try{const me=await api('me');if(!me.authenticated&&pendingInvite)authMode='join';if(pendingReset)authMode='reset';if(me.authenticated){await refresh();connectEvents();}else authForm(network);}catch(err){$('#app').innerHTML=`<div class="auth-page"><div class="auth-card"><h1>Serveur inaccessible</h1><p>${esc(err.message)}</p><p>Vérifiez que Chroniques est bien lancé sur le PC du MJ (DEMARRER_CHRONIQUES.bat), puis rechargez la page. Pour découvrir l’outil sans serveur, <a href="/offline.html">ouvrez la démonstration hors ligne</a> (ancienne version, sans multijoueur).</p></div></div>`;}}
const $=selector=>document.querySelector(selector);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const attr=esc;
const at=(p)=>p?.id===L.activeId(state)&&state.combat.started;
const number=v=>Number(v).toLocaleString('fr-FR');
// La notification vit hors de l'application rendue : un rafraîchissement ne l'efface pas (et garde le bouton « Annuler »).
function toastBox(){if(typeof document==='undefined'||!document.body||typeof document.createElement!=='function')return $('#toast');let el=document.getElementById('toast-live');if(!el){el=document.createElement('div');el.id='toast-live';el.className='toast';el.setAttribute('role','status');el.setAttribute('aria-live','polite');document.body.appendChild(el);}return el;}
function toast(msg,isError=false,action=null){const box=toastBox();if(!box){lastNotice=msg;return;}box.textContent=msg;if(action){const btn=document.createElement('button');btn.type='button';btn.className='toast-action';btn.textContent=action.label||'Annuler';btn.addEventListener('click',()=>{box.classList.remove('show');action.run();});box.appendChild(btn);}box.classList.toggle('error',isError);box.classList.toggle('has-action',!!action);box.classList.add('show');clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>box.classList.remove('show'),action?9000:4500);}
// Suppression immédiate avec possibilité d'annuler (MJ) : remplace les fenêtres « Êtes-vous sûr ? ».
async function actUndoable(kind,payload,msg){if(await act(kind,payload))toast(msg,false,{label:'Annuler',run:async()=>{if(await act('undo'))toast('Suppression annulée.');}});}
// Actions conservées pendant une coupure : seulement celles qui s'additionnent sans risque (variations de PV, épuisement)
// ou qui détectent elles-mêmes les conflits (notes partagées). Elles sont rejouées dans l'ordre au retour du réseau.
// 5.1 : aussi les emplacements de sorts et les objets utilisés (potion, munition, charge) : le serveur revérifie au retour.
const QUEUEABLE=new Set(['hp','npcHp','exhaustion','sharedNoteSave','tempHp','deathSave','resource','companionHp','pcNotesSave','whisperSend','slot','itemUse']);
let outbox=[],flushing=false,offlineMode=false,offlineAt='';
// Dernier état reçu, gardé sur cet appareil pour pouvoir rouvrir Chroniques sans réseau (effacé à la déconnexion).
const SNAP_KEY='chroniques-instantane';
function offlineSnapshotSave(){if(!viewer||!state||tableMode)return;try{localStorage.setItem(SNAP_KEY,JSON.stringify({at:new Date().toISOString(),viewer,version,state,network}));}catch{}}
function offlineSnapshotLoad(){try{const v=JSON.parse(localStorage.getItem(SNAP_KEY)||'null');return v&&v.viewer&&v.state?v:null;}catch{return null;}}
function offlineSnapshotClear(){syncTag='';serverCopy=null;try{localStorage.removeItem(SNAP_KEY);}catch{}}
function offlineBanner(){return offlineMode?`<div class="offline-banner" role="status">Hors connexion — affichage des données du ${esc(new Date(offlineAt).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}))}. Points de vie, ressources, carnet et chuchotements restent notés ici et partiront au retour du réseau. <button type="button" class="btn btn-secondary" data-task="retry-online">Réessayer</button></div>`:'';}
async function tryReconnect(){if(!offlineMode)return;try{await api('me');offlineMode=false;await refresh();connectEvents();await flushOutbox();toast('Connexion rétablie.');}catch{}}

function outboxKey(){return 'chroniques-attente:'+String(viewer?.name||'')+':'+String(viewer?.campaignId||'');}
function outboxLoad(){try{const v=JSON.parse(localStorage.getItem(outboxKey())||'[]');outbox=Array.isArray(v)?v.filter(x=>x&&QUEUEABLE.has(x.kind)).slice(0,50):[];}catch{outbox=[];}}
function outboxSave(){try{localStorage.setItem(outboxKey(),JSON.stringify(outbox));}catch{}document.body?.classList?.toggle('has-outbox',outbox.length>0);const el=typeof document!=='undefined'&&document.querySelector?document.querySelector('#outbox-count'):null;if(el)el.textContent=outbox.length?outbox.length+' en attente':'';}
function isNetworkError(e){return !e.status&&(e instanceof TypeError||/fetch|network|Failed/i.test(String(e.message||'')));}
async function flushOutbox(){if(flushing||!outbox.length||!viewer)return;flushing=true;let sent=0;
 try{while(outbox.length){const item=outbox[0];try{await refresh();const out=await api('action','POST',{baseVersion:version,kind:item.kind,...item.payload,since:syncTag});await acceptAction(out);outbox.shift();sent++;outboxSave();}
  catch(e){if(isNetworkError(e))break;outbox.shift();outboxSave();toast('Action en attente refusée par le serveur : '+e.message,true);}}}
 finally{flushing=false;}if(sent){render();toast(sent+' action(s) faite(s) hors connexion enregistrée(s).');}}
// Hors connexion : l'effet est montré tout de suite sur cet appareil (en attente), puis envoyé au retour du réseau.
function applyLocal(kind,p){try{const pc=id=>(state.characters||[]).find(x=>x.id===id);
 if(kind==='hp'){const c=pc(p.id);if(c){const max=c.stats?.hp||c.hp;c.hp=Math.max(0,Math.min(max,c.hp+Number(p.delta||0)));}}
 else if(kind==='npcHp'){const n=(state.combat?.npcs||[]).find(x=>x.id===p.id);if(n&&n.hp!=null)n.hp=Math.max(0,Math.min(n.hpMax??n.hp,n.hp+Number(p.delta||0)));}
 else if(kind==='tempHp'){const c=pc(p.id);if(c)c.tempHp=Number(p.value)||0;}
 else if(kind==='condition'){const c=pc(p.id);if(c&&Array.isArray(c.conditions))c.conditions=c.conditions.includes(p.condition)?c.conditions.filter(x=>x!==p.condition):[...c.conditions,p.condition];}
 else if(kind==='companionHp'){const c=pc(p.id),m=c&&(c.companions||[]).find(x=>x.id===p.companionId);if(m)m.hp=Math.max(0,Math.min(m.hpMax,m.hp+Number(p.delta||0)));}
 else if(kind==='pcNotesSave'){const c=pc(p.id);if(c)c.privateNotes=p.text;}
 else if(kind==='slot'){const c=pc(p.id);if(c)P.spendSlot(c,state.edition,String(p.key||''),Number(p.delta));}
 else if(kind==='itemUse'){const c=pc(p.id),it=c&&I.list(c).find(x=>x.id===p.itemId),info=it&&GEAR.useInfo(it);if(info){if(info.consumes==='charge')it.charges=Math.max(0,(it.charges||0)-1);else it.quantity=Math.max(0,(it.quantity??1)-1);if(info.kind==='heal'&&p.healing!=null){const max=c.stats?.hp||c.hp;c.hp=Math.min(max,c.hp+Number(p.healing||0));}}}
 else if(kind==='whisperSend'){state.whispers=[...(state.whispers||[]),{id:'local-'+Date.now(),charId:p.charId||actor,from:actor==='mj'?'mj':actor,text:p.text,at:new Date().toISOString(),read:true,pending:true}];}
 offlineSnapshotSave();}catch{}}
function queueOffline(kind,payload,msg){outbox.push({kind,payload,at:Date.now()});outboxSave();applyLocal(kind,payload);render();toast(msg);return true;}
async function act(kind,payload={},retried=false){
 if(QUEUEABLE.has(kind)&&(offlineMode||typeof navigator!=='undefined'&&navigator.onLine===false))return queueOffline(kind,payload,'Hors connexion : action notée sur cet appareil, elle sera envoyée au retour du réseau.');
 if(offlineMode){toast('Hors connexion : cette action sera possible au retour du réseau.',true);return false;}
 try{const out=await api('action','POST',{baseVersion:version,kind,...payload,since:syncTag});await acceptAction(out);render();return true;}
 catch(e){if(isNetworkError(e)&&QUEUEABLE.has(kind))return queueOffline(kind,payload,'Connexion perdue : action notée sur cet appareil, elle sera envoyée au retour du réseau.');
  if(e.status===409){await refresh();if(!retried&&(kind==='hp'||kind==='npcHp'||kind==='sharedNoteSave'))return act(kind,payload,true);}toast(isNetworkError(e)?'Connexion perdue : cette action n’a pas été enregistrée. Réessayez au retour du réseau.':e.message,true);return false;}}
