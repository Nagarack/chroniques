// ——— 02 · Appels au serveur, clés d’accès, connexion ———
async function api(route,method='GET',body){
 const res=await fetch('/api/'+route,{method,credentials:'same-origin',headers:method==='POST'?{'Content-Type':'application/json'}:{},body:method==='POST'?JSON.stringify({...body,...(viewer?.campaignId&&!['campaigns/select','campaigns/create','campaigns/join'].includes(route)?{campaignId:viewer.campaignId}:{})}):undefined});
 const data=await res.json().catch(()=>({}));
 if(!res.ok){let e=new Error(data.error||'Erreur de connexion.');e.status=res.status;throw e;}
 return data;
}
async function loadAiStatus(){if(actor!=='mj')return;try{aiStatus=await api('ai/status');if(page==='stories')render();}catch(e){aiStatus={enabled:false,error:e.message};if(page==='stories')render();}}
function quickHelpPage(){const item=QH.tutorial(page,onboardRole());if(!item)return '';return `<details class="quick-help" open data-quick-help="${attr(page)}"><summary><span aria-hidden="true">? </span><strong>Mode d’emploi · ${esc(item.title)}</strong><span class="quick-help-tag">3 étapes · 30 s</span></summary><div class="quick-help-body"><ol>${item.steps.map(step=>`<li>${esc(step)}</li>`).join('')}</ol><p>Besoin de plus de détails ? <button type="button" class="text-button" data-nav="guide">Ouvrir le parcours guidé</button> · <a href="/tutos.html" target="_blank" rel="noopener noreferrer">Tous les tutos express</a></p></div></details>`;}
function quickHelpAuth(mode){const lines=mode==='setup'?['Lancez le serveur et récupérez la clé initiale affichée dans la fenêtre Windows.','Créez votre compte MJ avec un mot de passe personnel.','Connectez-vous, puis créez des invitations depuis Mes campagnes.']:mode==='join'?['Demande au MJ un code d’invitation valide.','Choisissez votre identifiant et votre mot de passe pour rejoindre la campagne.','Connectez-vous ensuite pour accéder à la fiche attribuée.']:['Saisissez l’identifiant et le mot de passe de votre compte Chroniques.','Si vous avez reçu une invitation, cliquez sur « J’ai une invitation ».','Après connexion, choisissez votre campagne et ouvrez l’Aide si nécessaire.'];return `<details class="quick-help quick-help-auth"><summary>Premiers pas · 3 étapes</summary><ol>${lines.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><a href="/tutos.html" target="_blank" rel="noopener noreferrer">Voir les tutos express</a></details>`;}
// 5.1 — clés d'accès (WebAuthn). Indisponibles dans l'application Android (sa vue web ne les gère pas) et hors HTTPS / localhost.
const passkeyOnIp=()=>{try{return /^(\d{1,3}\.){3}\d{1,3}$|^\[/.test(location.hostname);}catch{return false;}};
function uiLang(){return (typeof window!=='undefined'&&window.ChroniquesI18n?.lang)||'fr';}
function uiFeet(){return typeof window!=='undefined'&&window.ChroniquesI18n?.units==='ft';}
function isIos(){try{return /iPhone|iPad|iPod/.test(navigator.userAgent||'')||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);}catch{return false;}}
function passkeyCapable(){try{return typeof window!=='undefined'&&!!window.PublicKeyCredential&&window.isSecureContext&&!!navigator.credentials&&!passkeyOnIp()&&!/ChroniquesAndroid/.test(navigator.userAgent||'');}catch{return false;}}
const b64uToBuf=s=>{const b=atob(String(s).replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(String(s).length/4)*4,'='));const u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u.buffer;};
const bufToB64u=buf=>{const u=new Uint8Array(buf);let b='';for(let i=0;i<u.length;i++)b+=String.fromCharCode(u[i]);return btoa(b).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
let passkeys=null,passkeyBusy=false;
function passkeyError(e){if(e&&(e.name==='NotAllowedError'||e.name==='AbortError'))return 'Opération annulée ou délai dépassé.';if(e&&e.name==='InvalidStateError')return 'Cet appareil possède déjà une clé d’accès pour ce compte.';if(e&&e.name==='SecurityError')return 'Clés d’accès indisponibles à cette adresse (HTTPS requis).';return e?.message||'Clé d’accès indisponible.';}
async function passkeyLogin(){if(passkeyBusy)return;passkeyBusy=true;try{const o=await api('passkey/login/options','POST',{});const pk=o.publicKey;
 const cred=await navigator.credentials.get({publicKey:{challenge:b64uToBuf(pk.challenge),rpId:pk.rpId,timeout:pk.timeout,userVerification:pk.userVerification,allowCredentials:[]}});
 const r=cred.response;await api('passkey/login','POST',{credential:{id:cred.id,type:cred.type,response:{clientDataJSON:bufToB64u(r.clientDataJSON),authenticatorData:bufToB64u(r.authenticatorData),signature:bufToB64u(r.signature),userHandle:r.userHandle?bufToB64u(r.userHandle):null}}});
 lastNotice='';await refresh();connectEvents();}
 catch(e){lastNotice=passkeyError(e);authForm(await api('status'));}finally{passkeyBusy=false;}}
async function passkeyCreate(name){if(passkeyBusy)return;passkeyBusy=true;try{const o=await api('passkey/register/options','POST',{});const pk=o.publicKey;
 const cred=await navigator.credentials.create({publicKey:{...pk,challenge:b64uToBuf(pk.challenge),user:{...pk.user,id:b64uToBuf(pk.user.id)},excludeCredentials:(pk.excludeCredentials||[]).map(c=>({...c,id:b64uToBuf(c.id)}))}});
 const r=cred.response;const out=await api('passkey/register','POST',{name,credential:{id:cred.id,type:cred.type,response:{clientDataJSON:bufToB64u(r.clientDataJSON),attestationObject:bufToB64u(r.attestationObject)}}});
 passkeys=out.passkeys;render();toast('🔑 Clé d’accès créée : vous pourrez vous connecter sans mot de passe sur cet appareil.');}
 catch(e){toast(passkeyError(e),true);}finally{passkeyBusy=false;}}
async function passkeysLoad(){try{passkeys=(await api('passkey/list','POST',{})).passkeys;}catch{passkeys=[];}render();}
function passkeyPanel(){if(passkeys===null){setTimeout(passkeysLoad,0);passkeys=undefined;}
 const list=Array.isArray(passkeys)?passkeys:[];const can=passkeyCapable();
 return `<section class="panel passkey-panel" aria-labelledby="pk-title"><div class="panel-top"><h3 id="pk-title">🔑 Clés d’accès</h3><span class="mini-pill">${list.length}</span></div>
 <p class="muted small">Connexion par l’empreinte, le visage ou le code de votre téléphone ou de votre PC, sans taper de mot de passe. Le secret reste sur l’appareil ; le serveur ne garde qu’une clé publique. Votre mot de passe reste valable.</p>
 ${list.length?`<ul class="pk-list">${list.map(k=>`<li><span><b>${esc(k.name)}</b><br><small class="muted">Créée le ${esc(new Date(k.createdAt).toLocaleDateString('fr-FR'))}${k.lastUsedAt?' · utilisée le '+esc(new Date(k.lastUsedAt).toLocaleDateString('fr-FR')):''}${k.here?'':' · pour '+esc(k.rpId)}</small></span><button type="button" class="text-button danger-text" data-passkey-remove="${attr(k.id)}">Supprimer</button></li>`).join('')}</ul>`:''}
 ${can?`<form id="passkey-form" class="passkey-form"><label>Nom de l’appareil<input name="name" maxlength="40" placeholder="Ex. Téléphone de Léa"></label><button class="btn btn-secondary" type="submit">Créer une clé sur cet appareil</button></form>`:`<p class="muted small">${ANDROID?'L’application Android ne gère pas les clés d’accès : créez-les depuis Chrome ou un autre navigateur.':passkeyOnIp()?`Les clés d’accès ne fonctionnent pas avec une adresse numérique comme ${esc(location.hostname)} : sur le PC du MJ, ouvrez <a href="http://localhost:${esc(location.port||'80')}/">http://localhost:${esc(location.port||'80')}/</a> ; pour les joueurs, l’adresse HTTPS de la campagne.`:'Indisponible ici : il faut l’adresse HTTPS de la campagne (ou « localhost » sur le PC du MJ) et un navigateur récent.'}</p>`}</section>`;}
function authForm(status){
 const setup=status.setupRequired, mode=setup?'setup':authMode;
 if(mode==='reset')return resetForm(status);
 const title=mode==='setup'?'Première installation · Maître du Jeu':mode==='join'?'Rejoindre la campagne':'Connexion à la campagne';
 const desc=mode==='setup'?'Saisissez la clé affichée au lancement du serveur.':mode==='join'?'Entrez votre code d’invitation à usage unique.':'Reconnectez-vous à votre campagne Chroniques.';
 $('#app').innerHTML=`<div class="auth-page"><div class="auth-card"><div class="brand auth-brand"><span class="brandmark">✦</span><div><strong>CHRONIQUES</strong><small>v${esc(status.version||'')} · À plusieurs autour de la table</small></div></div>
 <h1>${esc(title)}</h1><p class="muted">${esc(desc)}</p><form id="auth-form" autocomplete="on"><label>Identifiant <input name="name" autocomplete="username" required maxlength="40" minlength="3" placeholder="Ex. MJ Aubéciel"></label><label>Mot de passe <input name="password" type="password" autocomplete="${mode==='login'?'current-password':'new-password'}" required minlength="${mode==='login'?1:12}" placeholder="${mode==='login'?'Votre mot de passe':'12 caractères minimum'}"></label>
 ${mode==='setup'?'<label>Clé initiale du serveur <input name="setupKey" type="text" autocomplete="off" required placeholder="Clé affichée dans le terminal"></label>':''}
 ${mode==='join'?`<label>Code d’invitation <input name="code" type="text" autocomplete="off" required placeholder="Code transmis par le MJ" value="${attr(pendingInvite)}"></label>${pendingInvite?'<p class="muted small">Code repris depuis votre lien d’invitation. Vous avez déjà un compte ? Choisissez « Connexion » : l’invitation vous sera proposée juste après.</p>':''}`:''}
 <button class="btn btn-primary full" type="submit">${mode==='setup'?'Créer mon espace MJ':mode==='join'?'Accepter l’invitation':'Se connecter'}</button></form>${mode==='login'&&passkeyCapable()?'<button type="button" class="btn btn-secondary full passkey-login" data-passkey-login="1">🔑 Se connecter avec une clé d’accès</button><p class="muted small">Empreinte, visage ou code de l’appareil, si vous avez créé une clé dans Mon compte → Paramètres.</p>':''}
 ${!setup?`<div class="auth-switch"><button type="button" data-auth="login" class="text-button">Connexion</button><button type="button" data-auth="join" class="text-button">J’ai une invitation</button></div>`:''}
 ${mode==='login'?'<p class="muted small">Mot de passe oublié ? Demandez à votre MJ un lien de réinitialisation (Campagne → Les membres).</p>':''}<p class="muted small">${network.networkMode==='public'?'Connexion HTTPS par lien Cloudflare, avec compte et invitation.':'Serveur local : configurez Cloudflare Tunnel pour jouer à distance.'}</p>
 ${isIos()&&!navigator.standalone?`<p class="auth-app"><a href="/iphone">📱 Installer sur iPhone / iPad</a> <span class="muted small">(écran d’accueil, notifications)</span></p>`:''}${status.android&&!/ChroniquesAndroid/.test(navigator.userAgent||'')&&/Android/i.test(navigator.userAgent||'')?`<p class="auth-app"><a href="/android/chroniques.apk" download>📱 Installer l’application Android</a> <span class="muted small">(mêmes fonctions que le site)</span></p>`:''}
 ${lastNotice?`<p class="auth-error" role="alert">${esc(lastNotice)}</p>`:''}${quickHelpAuth(mode)}<p class="auth-lang"><button type="button" class="text-button" data-lang-switch translate="no">🌐 ${uiLang()==='en'?'Français':'English'}</button></p></div></div>`;
}
function resetForm(status){
 $('#app').innerHTML=`<div class="auth-page"><div class="auth-card"><div class="brand auth-brand"><span class="brandmark">✦</span><div><strong>CHRONIQUES</strong><small>v${esc(status.version||'')}</small></div></div>
 <h1>Choisir un nouveau mot de passe</h1><p class="muted">Ce lien vient de votre MJ. Il ne sert qu’une fois et expire après deux heures.</p>
 <form id="reset-form" autocomplete="on"><label>Nouveau mot de passe <input name="password" type="password" autocomplete="new-password" required minlength="12" maxlength="128" placeholder="12 caractères minimum"></label><label>Confirmer <input name="confirm" type="password" autocomplete="new-password" required minlength="12" maxlength="128"></label><button class="btn btn-primary full" type="submit">Enregistrer et me connecter</button></form>
 <div class="auth-switch"><button type="button" data-auth="login" class="text-button">Retour à la connexion</button></div>
 ${lastNotice?`<p class="auth-error" role="alert">${esc(lastNotice)}</p>`:''}</div></div>`;}
function onboardRole(){return actor==='mj'?'gm':'player';}
function uxLoad(){try{const saved=localStorage.getItem('chroniques-ux-v34:'+String(viewer?.name||'')+':'+String(viewer?.campaignId||'')+':'+onboardRole());uxSimple=saved===null?true:saved==='simple';}catch{uxSimple=true;}}
function uxSave(){try{localStorage.setItem('chroniques-ux-v34:'+String(viewer?.name||'')+':'+String(viewer?.campaignId||'')+':'+onboardRole(),uxSimple?'simple':'complete');}catch{}}
const openFolds=new Set();
if(typeof document!=='undefined'&&typeof document.addEventListener==='function')document.addEventListener('toggle',e=>{const d=e.target;if(!d||!d.dataset||d.dataset.fold===undefined)return;if(d.open)openFolds.add(d.dataset.fold);else openFolds.delete(d.dataset.fold);},true);
let noteDrafts={},notesEditing=false,notesPending=false,helpOpen=false;
if(typeof document!=='undefined'&&typeof document.addEventListener==='function'){
 function areaDmgPreview(){const f=document.getElementById('area-dmg-form'),out=document.getElementById('area-dmg-preview');if(!f||!out||!ADM)return;const v=ADM.readForm(f);if(!v.targets.length||!Number.isInteger(v.amount)){out.innerHTML='';return;}
 const list=ADM.combatants(state);try{out.innerHTML=ADM.previewHtml(ADM.plan({amount:v.amount,type:v.type,onSave:v.onSave,targets:v.targets,lookup:(k,id)=>list.find(c=>c.kind===k&&c.id===id)}),H6);}catch(e){out.innerHTML=`<p class="muted small">${esc(e.message)}</p>`;}}
['input','change'].forEach(t=>document.addEventListener(t,e=>{if(e.target?.closest?.('#area-dmg-form'))areaDmgPreview();}));
document.addEventListener('input',e=>{const el=e.target;if(!el||!el.dataset||el.dataset.noteField===undefined)return;const id=el.dataset.noteId;const n=(state.sharedNotes||[]).find(x=>x.id===id);const d=noteDrafts[id]||(noteDrafts[id]={title:n?n.title:'',body:n?n.body:'',baseAt:n?n.at:''});d[el.dataset.noteField]=el.value;});
 document.addEventListener('focusin',e=>{if(e.target&&e.target.dataset&&e.target.dataset.noteField!==undefined)notesEditing=true;});
 document.addEventListener('focusout',e=>{if(!e.target||!e.target.dataset||e.target.dataset.noteField===undefined)return;notesEditing=false;setTimeout(()=>{if(!notesEditing&&notesPending){notesPending=false;refresh();}},700);});
}
let inviteResults=[],pendingInvite='',pendingReset='',resetResult=null,reportList=null;
