/* Chroniques — règles et sorts en français (SRD 5.1 officiel, licence CC BY 4.0).
   Les textes (≈ 600 Ko) sont chargés à la demande depuis src/data/srd-regles-fr.js.
   Fonctions de recherche et de mise en page en HTML, sans état d'application. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesRules=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
let DATA=null,loading=null;
const CAST={action:'Action',bonus:'Action bonus',reaction:'Réaction',minute:'Plus longue'};
function load(){if(DATA)return Promise.resolve(DATA);if(loading)return loading;
 loading=new Promise((ok,ko)=>{
  if(typeof window==='undefined'||typeof document==='undefined'){try{DATA=require('./data/srd-regles-fr.js');ok(DATA);}catch(e){loading=null;ko(e);}return;}
  if(root.ChroniquesSRDFr){DATA=root.ChroniquesSRDFr;ok(DATA);return;}
  const sc=document.createElement('script');sc.src='/src/data/srd-regles-fr.js';sc.onload=()=>{DATA=root.ChroniquesSRDFr||null;if(DATA)ok(DATA);else{loading=null;ko(new Error('Règles indisponibles.'));}};
  sc.onerror=()=>{loading=null;ko(new Error('Règles indisponibles (hors ligne ?).'));};document.head.appendChild(sc);});
 return loading;}
const loaded=()=>!!DATA;
const data=()=>DATA;
const fold=s=>String(s||'').toLocaleLowerCase('fr').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[’']/g,"'");
const escDefault=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function chapters(){return DATA?DATA.rules.map(c=>({id:c.id,title:c.title,count:c.sections.length})):[];}
function section(chapterId,index){const c=DATA&&DATA.rules.find(x=>x.id===chapterId);return c&&c.sections[index]?{chapter:c,section:c.sections[index],index}:null;}
function spell(id){return DATA&&DATA.spells[id]||null;}
function findSpellByName(name){if(!DATA)return null;const n=fold(name);for(const [id,s] of Object.entries(DATA.spells))if(fold(s.name)===n)return {id,...s};return null;}
// États : texte officiel pour une condition (« Aveuglé », « À terre »…).
const COND_ALIAS={'empoigne':'agrippe',"incapable d'agir":'neutralise','epuise':'epuisement'};
function condition(name){if(!DATA)return null;const c=DATA.rules.find(x=>x.id==='etats');if(!c)return null;let n=fold(name);n=COND_ALIAS[n]||n;return c.sections.find(s=>fold(s.title)===n)||null;}
function plain(t){return String(t).replace(/\*\*/g,'').replace(/^\| /,'').replace(/^### /,'').replace(/\t/g,' · ');}
// Recherche : titres d'abord, puis texte. Résultats : {kind:'rule'|'spell', ...}
function search(q,limit=30){if(!DATA)return [];const n=fold(q).trim();if(n.length<2)return [];const words=n.split(/\s+/).filter(Boolean);const out=[];
 const score=(title,text)=>{const t=fold(title);let s=0;if(t===n)s+=100;else if(t.startsWith(n))s+=60;else if(t.includes(n))s+=40;
  const body=fold(text);if(words.every(w=>t.includes(w)||body.includes(w)))s+=10+(body.includes(n)?8:0);else if(s===0)return 0;return s;};
 for(const c of DATA.rules)c.sections.forEach((s,i)=>{const text=s.text.join(' ');const sc=score(s.title,text);if(sc)out.push({kind:'rule',chapter:c.id,chapterTitle:c.title,index:i,title:s.title,score:sc+(c.id==='etats'?5:0),snippet:snippet(text,words)});});
 for(const [id,s] of Object.entries(DATA.spells)){const text=s.text.join(' ');const sc=score(s.name,text);if(sc)out.push({kind:'spell',id,title:s.name,level:s.level,score:sc,snippet:snippet(text,words)});}
 return out.sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title,'fr')).slice(0,limit);}
function snippet(text,words){const t=plain(text);const f=fold(t);let at=-1;for(const w of words){at=f.indexOf(w);if(at>=0)break;}if(at<0)at=0;const start=Math.max(0,at-60);return (start>0?'…':'')+t.slice(start,start+180).trim()+(t.length>start+180?'…':'');}
// Mise en forme d'un tableau de lignes en HTML (paragraphes, gras, puces, tableaux).
// Lignes « | a\tb\tc » : vrai tableau (colonnes séparées par des tabulations). Sans tabulation : encadré de texte.
function tableHtml(rows,inline){const cells=rows.map(r=>r.split('\t').map(x=>x.trim()));const max=Math.max(...cells.map(c=>c.length));
 if(max<2)return '<div class="srd-aside">'+rows.map(r=>'<p>'+inline(r)+'</p>').join('')+'</div>';
 // En-tête sur plusieurs lignes dans le PDF : lignes d'une seule cellule suivies de la première ligne à colonnes.
 let head=null,body=cells;const firstMulti=cells.findIndex(c=>c.length>1);
 if(firstMulti>0&&firstMulti+cells[firstMulti].length===max){head=cells.slice(0,firstMulti).map(c=>c[0]).concat(cells[firstMulti]);body=cells.slice(firstMulti+1);}
 else if(firstMulti===0){head=cells[0];body=cells.slice(1);}
 const pre=firstMulti>0&&!head?cells.slice(0,firstMulti):[];if(pre.length)body=cells.slice(firstMulti);
 const row=(c,tag)=>'<tr>'+c.map((x,i)=>`<${tag}${tag==='th'?' scope="col"':''}${i===c.length-1&&c.length<max?` colspan="${max-c.length+1}"`:''}>${inline(x)}</${tag}>`).join('')+'</tr>';
 return (pre.length?'<p class="srd-caption">'+pre.map(c=>inline(c[0])).join(' ')+'</p>':'')+'<div class="srd-table-wrap"><table class="srd-table">'+(head?'<thead>'+row(head,'th')+'</thead>':'')+'<tbody>'+body.map(c=>row(c,'td')).join('')+'</tbody></table></div>';}
function blocksHtml(lines,esc=escDefault){let html='',rows=[],items=[];
 const inline=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
 const flushRows=()=>{if(rows.length){html+=tableHtml(rows,inline);rows=[];}};
 const flushItems=()=>{if(items.length){html+='<ul class="srd-list">'+items.map(x=>'<li>'+inline(x)+'</li>').join('')+'</ul>';items=[];}};
 for(const raw of lines||[]){const l=String(raw);
  if(l.startsWith('| ')){flushItems();rows.push(l.slice(2));continue;}flushRows();
  if(l.startsWith('• ')){items.push(l.slice(2));continue;}flushItems();
  if(l.startsWith('### ')){html+='<h5>'+inline(l.slice(4))+'</h5>';continue;}
  html+='<p>'+inline(l)+'</p>';}
 flushRows();flushItems();return html;}
function spellMeta(s){return [['Incantation',s.castTime],['Portée',s.range],['Composantes',s.components],['Durée',s.duration]];}
function levelLabel(s){return s.level===0?'Sort mineur'+(s.school?' ('+s.school.toLowerCase()+')':''):s.school+' du '+s.level+(s.level===1?'er':'e')+' niveau'+(s.ritual?' (rituel)':'');}
const CLASS_FR={bard:'barde',cleric:'clerc',druid:'druide',paladin:'paladin',ranger:'rôdeur',sorcerer:'ensorceleur',warlock:'occultiste',wizard:'magicien'};
function spellHtml(id,esc=escDefault,opts={}){const s=spell(id);if(!s)return '';
 return `<article class="srd-spell"><header>${opts.noTitle?'':`<h3>${esc(s.name)}</h3>`}<p class="srd-school">${esc(levelLabel(s))}</p></header>
 <dl class="srd-meta">${spellMeta(s).map(([k,v])=>`<div><dt>${k}</dt><dd>${esc(v||'—')}</dd></div>`).join('')}</dl>
 <div class="srd-body">${blocksHtml(s.text,esc)}${s.higher?`<p><strong>À plus haut niveau.</strong> ${esc(s.higher)}</p>`:''}</div>
 ${s.v24?`<div class="srd-2024 ${opts.edition==='2024'?'active':''}"><p><strong>Règles 2024 (SRD 5.2) :</strong> différences repérées automatiquement. Le texte du sort peut aussi avoir changé : vérifiez avec le MJ.</p><div class="srd-table-wrap"><table class="srd-table"><thead><tr><th scope="col"></th><th scope="col">2014</th><th scope="col">2024</th></tr></thead><tbody>${s.v24.map(([k,a,b])=>`<tr><th scope="row">${esc(k)}</th><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</tbody></table></div></div>`:''}
 ${opts.noClasses?'':`<p class="muted small">Classes : ${s.classes.map(c=>CLASS_FR[c]||c).join(', ')||'—'}</p>`}</article>`;}
function sectionHtml(chapterId,index,esc=escDefault){const r=section(chapterId,index);if(!r)return '';
 return `<article class="srd-section"><p class="srd-crumb">${esc(r.chapter.title)}</p><h3>${esc(r.section.title)}</h3>${blocksHtml(r.section.text,esc)}</article>`;}
// Texte court (sans balises) d'un sort, pour les cartes imprimées : coupé proprement si trop long.
function spellCardText(id,max=900){const s=spell(id);if(!s)return null;let t=s.text.map(plain).join(' ');if(s.higher)t+=' À plus haut niveau. '+s.higher;
 if(t.length<=max)return {text:t,cut:false};const cut=t.slice(0,max);const end=Math.max(cut.lastIndexOf('. '),max-80);return {text:cut.slice(0,end+1)+' […]',cut:true};}
// --- Blocs de statistiques des créatures (src/data/srd-monstres-fr.js, chargé à la demande) ---
let MON=null,monLoading=null;
function loadMonsters(){if(MON)return Promise.resolve(MON);if(monLoading)return monLoading;
 monLoading=new Promise((ok,ko)=>{if(typeof window==='undefined'||typeof document==='undefined'){try{MON=require('./data/srd-monstres-fr.js');ok(MON);}catch(e){monLoading=null;ko(e);}return;}
  if(root.ChroniquesSRDMonstresFr){MON=root.ChroniquesSRDMonstresFr;ok(MON);return;}
  const sc=document.createElement('script');sc.src='/src/data/srd-monstres-fr.js';sc.onload=()=>{MON=root.ChroniquesSRDMonstresFr||null;if(MON)ok(MON);else{monLoading=null;ko(new Error('Fiches indisponibles.'));}};sc.onerror=()=>{monLoading=null;ko(new Error('Fiches indisponibles (hors ligne ?).'));};document.head.appendChild(sc);});
 return monLoading;}
const monstersLoaded=()=>!!MON;
function monster(id){if(!MON)return null;let m=MON[id];if(typeof m==='string')m=MON[m.slice(1)];return m&&typeof m==='object'?m:null;}
const FIELD_LABELS=[['ac','Classe d’armure'],['hp','Points de vie'],['speed','Vitesse'],['saves','Jets de sauvegarde'],['skills','Compétences'],['vuln','Vulnérabilités aux dégâts'],['res','Résistances aux dégâts'],['immDmg','Immunités aux dégâts'],['immCond','Immunités aux états'],['senses','Sens'],['lang','Langues'],['cr','Facteur de puissance']];
const modTxt=v=>{const m=Math.floor((v-10)/2);return (m>=0?'+':'−')+Math.abs(m);};
function monsterHtml(id,esc=escDefault){const m=monster(id);if(!m)return '';
 const entries=list=>list.map(([n,t])=>`<p>${n?`<strong><em>${esc(n)}.</em></strong> `:''}${esc(t).replace(/\n/g,'<br>')}</p>`).join('');
 const sec=(title,list,intro)=>list&&list.length?`<h4>${title}</h4>${intro?`<p>${esc(intro)}</p>`:''}${entries(list)}`:'';
 return `<article class="srd-monster"><p class="srd-school">${esc(m.m)}</p>
 <dl class="srd-meta">${FIELD_LABELS.filter(([k])=>m.f[k]).slice(0,3).map(([k,l])=>`<div><dt>${l}</dt><dd>${esc(m.f[k])}</dd></div>`).join('')}</dl>
 ${m.a?`<table class="srd-abilities"><thead><tr>${['FOR','DEX','CON','INT','SAG','CHA'].map(x=>`<th scope="col">${x}</th>`).join('')}</tr></thead><tbody><tr>${m.a.map(v=>`<td>${v} (${modTxt(v)})</td>`).join('')}</tr></tbody></table>`:''}
 <dl class="srd-fields">${FIELD_LABELS.slice(3).filter(([k])=>m.f[k]).map(([k,l])=>`<div><dt>${l}</dt><dd>${esc(m.f[k])}</dd></div>`).join('')}</dl>
 <div class="srd-body">${entries(m.t)}${sec('Actions',m.ac)}${sec('Réactions',m.r)}${sec('Actions légendaires',m.l,m.li)}</div></article>`;}
return {loadMonsters,monstersLoaded,monster,monsterHtml,load,loaded,data,fold,chapters,section,spell,findSpellByName,condition,search,blocksHtml,spellHtml,sectionHtml,spellCardText,levelLabel,CAST,CLASS_FR};
});
