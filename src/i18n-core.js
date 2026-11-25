/* Chroniques — moteur de traduction de l'affichage (français → anglais), sans dépendance (5.2).
   Les données de la campagne restent en français (noms d'états, types de dégâts… servent de clés) :
   on ne traduit que ce qui est affiché. Le dictionnaire associe des « unités » de texte français
   (avec {0}, {1}… pour les valeurs calculées) à leur traduction.
   - translateText(t) : un texte entier (nœud de texte, message, attribut visible) ;
   - translateHtml(h) : une chaîne HTML (segments de texte et attributs title / placeholder / aria-label / alt),
     sans jamais toucher au contenu des <textarea>, <script>, <style> ni aux valeurs des champs. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesI18nCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const ENT={amp:'&',lt:'<',gt:'>',quot:'"','#39':'\'',apos:'\'',nbsp:' ','#x27':'\''};
const decode=s=>s.indexOf('&')<0?s:s.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi,(m,e)=>{const k=e.toLowerCase();if(ENT[k]!==undefined)return ENT[k];if(k[0]==='#'){const n=k[1]==='x'?parseInt(k.slice(2),16):parseInt(k.slice(1),10);return Number.isFinite(n)?String.fromCodePoint(n):m;}return m;});
const escText=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const escAttr=s=>escText(s).replace(/"/g,'&quot;');
const norm=s=>s.replace(/\s+/g,' ').trim();
const WORD=/[A-Za-zÀ-ÿŒœ]{2,}/g;
const reEsc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function create(dict){const exact=new Map(),buckets=new Map();let size=0;
 const SEP=/(\s+·\s+|\s+—\s+|\s+–\s+|\s+\|\s+|\s+\/\s+)/;
 const strong=(st,both,anchored)=>{const letters=(st.match(WORD)||[]).join('').length;return both?letters>=12:letters>=(anchored?3:5);};
 function addPattern(k,en){
  // Valeurs collées (« {1}{2} ») : une seule capture, la seconde reste vide.
  const glued=[];k=k.replace(/\{(\d+)\}(?:\{(\d+)\})+/g,m=>{const ns=m.match(/\d+/g);glued.push(...ns.slice(1));return '{'+ns[0]+'}';});for(const n of glued)en=en.replace('{'+n+'}','');
  const pieces=k.split(/(\{\d+\})/);const statics=pieces.filter((p,i)=>i%2===0).join(' ');if(!strong(statics,/^\{\d+\}/.test(k)&&/\{\d+\}$/.test(k),/^[A-Za-zÀ-ÿ]{3}/.test(k)))return;
  const order=[];let src='^';for(let i=0;i<pieces.length;i++){if(i%2===1){order.push(Number(pieces[i].slice(1,-1)));src+='([\\s\\S]+?)';}else src+=reEsc(pieces[i]);}
  src+='$';const words=(statics.match(WORD)||[]).sort((a,b)=>b.length-a.length);const key=words[0].toLowerCase();
  const list=buckets.get(key)||buckets.set(key,[]).get(key);if(list.some(p=>p.src===src))return;list.push({src,re:new RegExp(src),order,en,len:statics.length});size++;}
 function addUnit(k,en){if(!k)return;if(!/\{\d+\}/.test(k)){if(!exact.has(k)){exact.set(k,en);size++;}return;}
  addPattern(k,en);
  // Variantes sans la valeur calculée du début ou de la fin (souvent une icône ou un nombre mis en forme à part).
  const lead=/^\{(\d+)\}\s*/,trail=/\s*\{(\d+)\}$/;
  const drop=(str,n)=>str.replace(new RegExp('\\s*\\{'+n+'\\}\\s*'),' ').replace(/\s+/g,' ').trim();
  const strip=x=>x.replace(/[\s·:—–|/,]+$/,'');
  const ml=k.match(lead);if(ml&&en.includes('{'+ml[1]+'}'))addUnit(k.replace(lead,''),drop(en,ml[1]));
  const mt=k.match(trail);if(mt&&en.includes('{'+mt[1]+'}'))addUnit(strip(k.replace(trail,'')),strip(drop(en,mt[1])));}
 for(const [k0,v] of Object.entries(dict||{})){if(typeof v!=='string'||!v)continue;const k=norm(decode(k0));const en=decode(v);addUnit(k,en);
  // Morceaux séparés par « · » : même découpage dans les deux langues.
  const fs=k.split(SEP),es=en.split(SEP);if(fs.length>1&&fs.length===es.length)for(let i=0;i<fs.length;i+=2)if(/[A-Za-zÀ-ÿ]/.test(fs[i]))addUnit(norm(fs[i]),es[i].trim());
  const SENT=/(?<=[.!?…])\s+(?=[A-ZÀ-Ý(«“{])/;const fx=k.split(SENT),ex2=en.split(SENT);if(fx.length>1&&fx.length===ex2.length)for(let i=0;i<fx.length;i++)if(/[A-Za-zÀ-ÿ]/.test(fx[i])&&!/\{\d+\}/.test(fx[i])===!/\{\d+\}/.test(ex2[i]))addUnit(norm(fx[i]),ex2[i].trim());}
 for(const l of buckets.values())l.sort((a,b)=>b.len-a.len);
 const cache=new Map();
 const ex=k=>{const e=exact.get(k);if(e!==undefined)return e;const up=exact.get(k.charAt(0).toUpperCase()+k.slice(1));return up!==undefined&&k.charAt(0)!==k.charAt(0).toUpperCase()?up.charAt(0).toLowerCase()+up.slice(1):undefined;};
 function pattern(k,depth){const words=new Set((k.match(WORD)||[]).map(w=>w.toLowerCase()));for(const w of words){const list=buckets.get(w);if(!list)continue;
   for(const p of list){const m=p.re.exec(k);if(!m||m.slice(1).some(v=>!v.trim()))continue;const vals=[];p.order.forEach((n,i)=>{const raw=m[i+1];vals[n]=core(raw,depth+1)??raw;});return p.en.replace(/\{(\d+)\}/g,(x,n)=>vals[Number(n)]??x);}}
  return null;}
 function core(t,depth){const k=norm(t);if(!k)return null;const e=exact.get(k);if(e!==undefined)return e;
  {const up=exact.get(k.charAt(0).toUpperCase()+k.slice(1));if(up!==undefined&&k.charAt(0)!==k.charAt(0).toUpperCase())return up.charAt(0).toLowerCase()+up.slice(1);}if(depth>3||k.length>1200||!/[A-Za-zÀ-ÿ]/.test(k))return null;
  const p=pattern(k,depth);if(p!=null)return p;
  // Texte composé de morceaux séparés (« Elfe · Rôdeuse · Niveau 3 ») : chaque morceau connu est traduit.
  const parts=k.split(SEP);if(parts.length>1){let any=false;const out=parts.map((x,i)=>{if(i%2)return x;const r=core(x,depth+1);if(r!=null){any=true;return r;}return x;});if(any)return out.join('');}
  // Symboles autour du texte (flèches, compteurs, ponctuation) : traduire le milieu.
  const edge=/^([^A-Za-zÀ-ÿ]*?)([A-Za-zÀ-ÿ][\s\S]*?[A-Za-zÀ-ÿ.)…]|[A-Za-zÀ-ÿ])([^A-Za-zÀ-ÿ]*)$/.exec(k);
  if(edge&&(edge[1]||edge[3])){const mid=core(edge[2],depth+1);if(mid!=null)return edge[1]+mid+edge[3];}
  // Listes et phrases (« rés. perforant, vuln. feu », « Texte. (Résumé : …) ») : seulement si tout est traduit.
  for(const re of [/(,\s+)/,/((?<=[.!?…])\s+(?=[(A-ZÀ-Ý«]))/]){const ps=k.split(re);if(ps.length>1&&ps.length<=41){const out=[];let ok=true;for(let i=0;i<ps.length;i++){if(i%2){out.push(ps[i]);continue;}if(!/[A-Za-zÀ-ÿ]/.test(ps[i])){out.push(ps[i]);continue;}const r=core(ps[i],depth+1);if(r==null){ok=false;break;}out.push(r);}if(ok)return out.join('');}}
  // Libellé connu suivi d'un autre texte connu (« Réduire » + « Carnet de campagne ») : seulement si tout est traduit.
  const ws=k.split(' ');if(ws.length>1&&ws.length<=12)for(let i=ws.length-1;i>=1;i--){const head=ex(ws.slice(0,i).join(' '));if(head===undefined)continue;const rest=core(ws.slice(i).join(' '),depth+1);if(rest!=null)return head+' '+rest;}
  return null;}
 // Texte brut : garde les espaces de début et de fin.
 function translateText(t){if(typeof t!=='string'||!t||!/[A-Za-zÀ-ÿ]/.test(t))return t;if(cache.has(t))return cache.get(t);
  const lead=t.match(/^\s*/)[0],trail=t.match(/\s*$/)[0];const r=core(t,0);const out=r==null?t:lead+r+trail;if(cache.size>20000)cache.clear();cache.set(t,out);return out;}
 const ATTR=/(\s(?:title|placeholder|aria-label|alt|data-tip|label)=")([^"]*)(")/g;
 function translateHtml(h){if(typeof h!=='string'||!h||!/[A-Za-zÀ-ÿ]/.test(h))return h;let out='',skip=null;const re=/<!--[\s\S]*?-->|<\/?([a-zA-Z][\w-]*)[^<>]*>/g;let last=0,m;
  const text=s=>{if(skip||!/[A-Za-zÀ-ÿ]/.test(s))return s;const d=decode(s);const tr=translateText(d);return tr===d?s:escText(tr);};
  let depth=0;const VOID=/^(br|img|input|hr|meta|link|source|wbr|area|col|embed|param|track)$/;
  while((m=re.exec(h))){out+=text(h.slice(last,m.index));let tag=m[0];const name=(m[1]||'').toLowerCase();
   if(tag[1]==='/'){if(skip&&name===skip&&--depth<=0){skip=null;depth=0;}}
   else if(skip){if(name===skip&&!VOID.test(name)&&!/\/>$/.test(tag))depth++;}
   else{if(name==='textarea'||name==='script'||name==='style'||(/\stranslate="no"/.test(tag)&&!/\/>$/.test(tag)&&!VOID.test(name))){skip=name;depth=1;}
    if(/(title|placeholder|aria-label|alt|data-tip|label)="/.test(tag))tag=tag.replace(ATTR,(x,a,v,b)=>{const d=decode(v);const tr=translateText(d);return tr===d?x:a+escAttr(tr)+b;});}
   out+=tag;last=re.lastIndex;}
  return out+text(h.slice(last));}
 return {size,translateText,translateHtml};}
return {create,decode,norm};
});
