/* Chroniques — langue de l'interface (5.2). Français par défaut ; anglais au choix (Mon compte → Langue),
   ou automatiquement si l'appareil n'est pas en français. En anglais, tout ce qui s'affiche passe par le
   dictionnaire (src/i18n/en.js) : HTML inséré, textes, bulles d'aide, fenêtres de confirmation, dates.
   Les données (noms d'états, types de dégâts…) restent en français : un MJ francophone et des joueurs
   anglophones peuvent partager la même campagne. */
(function(){
'use strict';
if(typeof window==='undefined'||typeof document==='undefined')return;
const KEY='chroniques-langue';
function stored(){try{return localStorage.getItem(KEY);}catch{return null;}}
function detect(){const s=stored();if(s==='fr'||s==='en')return s;const l=String((navigator.languages&&navigator.languages[0])||navigator.language||'fr').toLowerCase();return l.startsWith('fr')?'fr':'en';}
const lang=detect();
const api={lang,
 set(next){if(next!=='fr'&&next!=='en')return;try{localStorage.setItem(KEY,next);}catch{}try{fetch('/api/lang',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({lang:next})}).catch(()=>{});}catch{}setTimeout(()=>location.reload(),150);},
 t:s=>s,html:s=>s,ready:false};
window.ChroniquesI18n=api;
document.documentElement.lang=lang;
try{if(window.ChroniquesAndroid&&window.ChroniquesAndroid.setLang)window.ChroniquesAndroid.setLang(lang);}catch{}
if(lang!=='en')return;
// Le dictionnaire est chargé juste après ce script (même ordre que les autres scripts de la page).
if(!window.ChroniquesI18nData)document.write('<script src="/src/i18n/en.js"><\/script><script src="/src/data/srd-spells-index.en.js"><\/script>');
let engine=null;
function eng(){if(engine)return engine;const data=window.ChroniquesI18nData;const C=window.ChroniquesI18nCore;if(!data||!C)return null;engine=C.create(data.ui||{});api.ready=true;return engine;}
api.t=s=>{const e=eng();return e?e.translateText(s):s;};
// Pages d'aide : version anglaise.
const PAGES={'/aide-mj.html':'/aide-mj.en.html','/aide-joueur.html':'/aide-joueur.en.html','/tutos.html':'/tutos.en.html','/guide.html':'/guide.en.html','/iphone':'/iphone.en.html','/iphone.html':'/iphone.en.html'};
const pageLink=u=>typeof u==='string'&&PAGES[u.split('#')[0]]?PAGES[u.split('#')[0]]+(u.includes('#')?u.slice(u.indexOf('#')):''):u;
api.link=pageLink;
api.html=s=>{const e=eng();let h=e?e.translateHtml(s):s;if(typeof h==='string'&&h.indexOf('href="/')>=0)h=h.replace(/href="(\/[^"#]*)(#[^"]*)?"/g,(m,u,hash)=>PAGES[u]?'href="'+PAGES[u]+(hash||'')+'"':m);return h;};
{const wo=window.open;window.open=function(u,...r){return wo.call(window,pageLink(u),...r);};}
// ---------- Points d'entrée de l'affichage ----------
const wrapSetter=(proto,prop,fn)=>{const d=Object.getOwnPropertyDescriptor(proto,prop);if(!d||!d.set)return;Object.defineProperty(proto,prop,{...d,set(v){d.set.call(this,fn.call(this,v));}});};
wrapSetter(Element.prototype,'innerHTML',function(v){return typeof v==='string'&&!(this instanceof HTMLTextAreaElement)?api.html(v):v;});
wrapSetter(Element.prototype,'outerHTML',v=>typeof v==='string'?api.html(v):v);
wrapSetter(Node.prototype,'textContent',function(v){if(typeof v!=='string')return v;const t=this.nodeName;return t==='TEXTAREA'||t==='SCRIPT'||t==='STYLE'||t==='INPUT'?v:api.t(v);});
wrapSetter(HTMLElement.prototype,'innerText',v=>typeof v==='string'?api.t(v):v);
wrapSetter(HTMLElement.prototype,'title',v=>typeof v==='string'?api.t(v):v);
wrapSetter(HTMLInputElement.prototype,'placeholder',v=>typeof v==='string'?api.t(v):v);
{const ia=Element.prototype.insertAdjacentHTML;Element.prototype.insertAdjacentHTML=function(p,h){return ia.call(this,p,api.html(h));};}
{const sa=Element.prototype.setAttribute;Element.prototype.setAttribute=function(n,v){if(typeof v==='string'&&/^(title|placeholder|aria-label|alt)$/i.test(n))v=api.t(v);return sa.call(this,n,v);};}
{const d=Object.getOwnPropertyDescriptor(Document.prototype,'title');if(d&&d.set)Object.defineProperty(Document.prototype,'title',{...d,set(v){d.set.call(this,typeof v==='string'?api.t(v):v);}});}
for(const name of ['alert','confirm','prompt']){const f=window[name];if(typeof f==='function')window[name]=function(msg,...rest){return f.call(window,typeof msg==='string'?api.t(msg):msg,...rest);};}
// Dates et nombres : format anglais.
const swapLocale=l=>(l==='fr-FR'||l==='fr'||l===undefined)?'en-GB':l;
for(const m of ['toLocaleDateString','toLocaleTimeString','toLocaleString']){const f=Date.prototype[m];Date.prototype[m]=function(l,o){return f.call(this,swapLocale(l),o);};}
{const f=Number.prototype.toLocaleString;Number.prototype.toLocaleString=function(l,o){return f.call(this,swapLocale(l),o);};}
{const D=Intl.DateTimeFormat;const W=function(l,o){return new D(swapLocale(l),o);};W.prototype=D.prototype;W.supportedLocalesOf=D.supportedLocalesOf;Intl.DateTimeFormat=W;}
// Textes déjà présents dans la page (titre, message de chargement).
document.addEventListener('DOMContentLoaded',()=>{try{document.title=document.title;const app=document.getElementById('app');if(app&&app.children.length&&/Chargement/.test(app.textContent))app.innerHTML=app.innerHTML;}catch{}});
})();
