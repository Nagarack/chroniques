/* Chroniques V2.3 — installation Web possible en HTTPS. */
'use strict';
// Dans l'application Android, les fichiers sont déjà dans l'application : pas de service worker.
if(typeof navigator!=='undefined'&&'serviceWorker'in navigator&&!/ChroniquesAndroid/.test(navigator.userAgent||'')&& (location.protocol==='https:'||location.hostname==='localhost')){
 window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{});});
}
