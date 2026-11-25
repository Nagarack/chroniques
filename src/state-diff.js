/* Chroniques — différences entre deux états de campagne (synchronisation légère).
   Au lieu de renvoyer toute la campagne à chaque changement, le serveur envoie la liste des modifications
   depuis la dernière version reçue par cet appareil. Opérations :
     {p:[chemin], v:valeur}        remplacer / créer
     {p:[chemin], d:1}             supprimer une clé
     {p:[chemin], a:[...]}         ajouter à la fin d'une liste
     {p:[chemin], s:n, a:[...]}    retirer n éléments au début puis ajouter (journal qui glisse)
     {p:[chemin], u:[...], t:n}    ajouter en tête puis garder n éléments (journal du plus récent au plus ancien)
   Si le correctif serait presque aussi gros que l'état, on renvoie l'état complet. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesDiff=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const isObj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const same=(a,b)=>a===b||(typeof a==='object'&&typeof b==='object'&&a!==null&&b!==null&&JSON.stringify(a)===JSON.stringify(b));
function diffArray(a,b,path,ops){
 const sa=a.map(x=>JSON.stringify(x)),sb=b.map(x=>JSON.stringify(x));
 if(a.length===b.length){let miss=0;for(let i=0;i<a.length;i++)if(sa[i]!==sb[i])miss++;
  if(miss<=1||a.length<4){for(let i=0;i<a.length;i++)if(sa[i]!==sb[i])walk(a[i],b[i],path.concat(i),ops);return;}
  if(!slide(sa,sb,b,path,ops)&&!prepend(sa,sb,b,path,ops)){for(let i=0;i<a.length;i++)if(sa[i]!==sb[i])walk(a[i],b[i],path.concat(i),ops);}return;}
 // Ajout en fin de liste.
 if(b.length>a.length&&sa.every((x,i)=>x===sb[i])){ops.push({p:path,a:b.slice(a.length)});return;}
 if(slide(sa,sb,b,path,ops)||prepend(sa,sb,b,path,ops))return;
 ops.push({p:path,v:b});}
// Liste qui glisse (journal plafonné) : on retire au début et on ajoute à la fin.
function slide(sa,sb,b,path,ops){for(let s=1;s<=Math.min(sa.length,60);s++){const keep=sa.length-s;if(keep>sb.length||keep<1)continue;let ok=true;for(let i=0;i<keep;i++)if(sa[s+i]!==sb[i]){ok=false;break;}if(ok){ops.push({p:path,s,a:b.slice(keep)});return true;}}return false;}
// Ajout en tête de liste (journal du plus récent au plus ancien), éventuellement tronquée à la fin.
function prepend(sa,sb,b,path,ops){for(let k=1;k<=Math.min(sb.length,60);k++){const keep=sb.length-k;if(keep>sa.length||keep<1)continue;let ok=true;for(let i=0;i<keep;i++)if(sb[k+i]!==sa[i]){ok=false;break;}if(ok){ops.push({p:path,u:b.slice(0,k),t:b.length});return true;}}return false;}
function walk(a,b,path,ops){
 if(a===b)return;
 if(isObj(a)&&isObj(b)){for(const k of Object.keys(a))if(!(k in b))ops.push({p:path.concat(k),d:1});for(const k of Object.keys(b))if(!(k in a))ops.push({p:path.concat(k),v:b[k]});else walk(a[k],b[k],path.concat(k),ops);return;}
 if(Array.isArray(a)&&Array.isArray(b)){diffArray(a,b,path,ops);return;}
 if(!same(a,b))ops.push({p:path,v:b});}
// Renvoie la liste d'opérations, ou null si l'état complet est plus simple.
function diff(a,b,{ratio=0.6}={}){const ops=[];walk(a,b,[],ops);const size=JSON.stringify(ops).length;
 if(ops.some(o=>o.p.length===0))return null;return size>ratio*JSON.stringify(b).length?null:ops;}
// Applique les opérations sur `obj` (modifié sur place) et le renvoie.
function apply(obj,ops){for(const o of ops||[]){const p=o.p;if(!p.length)throw new Error('Correctif invalide.');let t=obj;
 for(let i=0;i<p.length-1;i++){t=t[p[i]];if(t===null||typeof t!=='object')throw new Error('Correctif incohérent.');}
 const k=p[p.length-1];
 if(o.d){if(Array.isArray(t))t.splice(k,1);else delete t[k];}
 else if(o.u){const list=t[k];if(!Array.isArray(list))throw new Error('Correctif incohérent.');list.unshift(...o.u);list.length=Math.min(list.length,o.t);}
 else if(o.a){const list=t[k];if(!Array.isArray(list))throw new Error('Correctif incohérent.');if(o.s)list.splice(0,o.s);list.push(...o.a);}
 else t[k]=o.v;}
 return obj;}
return {diff,apply};
});
