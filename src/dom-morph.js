/* Chroniques — mise à jour fine de l'affichage : au lieu de tout reconstruire (innerHTML), on compare
   l'ancien et le nouveau HTML et on ne modifie que ce qui change. Effets : moins de travail pour les vieux
   téléphones, images non rechargées, saisie en cours, position de défilement et focus conservés.
   Règles : un champ que l'utilisateur est en train de modifier garde sa valeur ; un <details> ouvert
   par l'utilisateur reste ouvert ; les éléments portant un id sont appariés par leur id. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesMorph=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const dirty=new WeakSet(),resetting=new WeakSet();
let listening=false;
function watch(doc){if(listening||!doc||typeof doc.addEventListener!=='function')return;listening=true;
 doc.addEventListener('input',e=>{if(e.target&&e.target.nodeType===1){dirty.add(e.target);resetting.delete(e.target);}},true);
 doc.addEventListener('change',e=>{if(e.target&&e.target.nodeType===1)dirty.add(e.target);},true);
 // Après un envoi, le formulaire peut être réinitialisé par le nouveau rendu.
 doc.addEventListener('submit',e=>{const f=e.target;if(f&&f.elements)for(const el of f.elements){dirty.delete(el);resetting.add(el);}const d=f&&f.closest&&f.closest('details');if(d)resetting.add(d);},true);}
const keyOf=n=>n.nodeType===1?(n.getAttribute('id')||n.getAttribute('data-key')||null):null;
function isEditing(el){if(resetting.has(el)){resetting.delete(el);return false;}const doc=el.ownerDocument;return dirty.has(el)||(doc&&doc.activeElement===el);}
// Un volet ouvert par l'utilisateur reste ouvert, sauf les menus (ils se referment après un choix)
// et le volet dont le formulaire vient d'être envoyé (comme avant).
function keepOpen(d){if(resetting.has(d)){resetting.delete(d);return false;}return !(d.hasAttribute('data-morph-strict')||(d.classList&&(d.classList.contains('account-actions')||d.classList.contains('char-menu'))));}
function syncAttributes(from,to){const fa=from.attributes,ta=to.attributes;
 for(let i=fa.length-1;i>=0;i--){const n=fa[i].name;if(!to.hasAttribute(n)){if(n==='open'&&from.tagName==='DETAILS'&&keepOpen(from))continue;from.removeAttribute(n);}}
 for(let i=0;i<ta.length;i++){const {name,value}=ta[i];if(from.getAttribute(name)!==value)from.setAttribute(name,value);}}
function syncForm(from,to){const tag=from.tagName;
 if(tag==='INPUT'){if(isEditing(from))return;const type=(to.getAttribute('type')||'text').toLowerCase();
  if(type==='checkbox'||type==='radio'){const c=to.hasAttribute('checked');if(from.checked!==c)from.checked=c;}
  else if(type!=='file'){const v=to.getAttribute('value')??'';if(from.value!==v)from.value=v;}}
 else if(tag==='TEXTAREA'){if(isEditing(from))return;const v=to.textContent;if(from.value!==v)from.value=v;}
 else if(tag==='SELECT'){if(isEditing(from))return;const opts=to.querySelectorAll('option');let idx=-1;opts.forEach((o,i)=>{if(o.hasAttribute('selected'))idx=i;});if(idx<0)idx=0;if(from.selectedIndex!==idx&&from.options.length>idx)from.selectedIndex=idx;}}
function morphNode(from,to){
 if(from.nodeType!==to.nodeType||from.nodeName!==to.nodeName){from.replaceWith(to);return to;}
 if(from.nodeType===3||from.nodeType===8){if(from.nodeValue!==to.nodeValue)from.nodeValue=to.nodeValue;return from;}
 if(from.nodeType!==1)return from;
 if(from.hasAttribute('data-morph-skip')&&to.hasAttribute('data-morph-skip'))return from;
 syncAttributes(from,to);
 if(from.tagName==='TEXTAREA'){syncForm(from,to);return from;}
 morphChildren(from,to);
 if(from.tagName==='INPUT'||from.tagName==='SELECT')syncForm(from,to);
 return from;}
function morphChildren(fromParent,toParent){
 const keyed=new Map();for(const c of fromParent.childNodes){const k=keyOf(c);if(k)keyed.set(k,c);}
 let cur=fromParent.firstChild;const incoming=Array.from(toParent.childNodes);
 for(const next of incoming){const k=keyOf(next);let match=null;
  if(k){const cand=keyed.get(k);if(cand&&cand.nodeName===next.nodeName){match=cand;keyed.delete(k);}}
  else if(cur&&!keyOf(cur)&&cur.nodeType===next.nodeType&&cur.nodeName===next.nodeName)match=cur;
  if(match){if(match!==cur)fromParent.insertBefore(match,cur);cur=morphNode(match,next).nextSibling;}
  else fromParent.insertBefore(next,cur);}
 while(cur){const n=cur.nextSibling;fromParent.removeChild(cur);cur=n;}}
// Remplace le contenu de `el` par `html` en ne touchant qu'aux différences.
function patch(el,html){const doc=el&&el.ownerDocument;
 if(!doc||typeof doc.createElement!=='function'||!('content' in doc.createElement('template'))||!el.firstChild){if(el)el.innerHTML=html;watch(doc);return 'full';}
 watch(doc);const t=doc.createElement('template');t.innerHTML=html;const frag=doc.importNode?doc.importNode(t.content,true):t.content;
 const wrapper=doc.createElement(el.tagName);wrapper.appendChild(frag);morphChildren(el,wrapper);return 'morph';}
return {patch,morphNode,morphChildren,isEditing,_dirty:dirty};
});
