/* Chroniques — récit et mémoire de la campagne (V5) : « Précédemment dans… » composé à partir de la dernière
   séance (relu et publié par le MJ), frise chronologique, bilan d'arc chiffré. Fonctions pures, sans IA :
   tout vient de ce que Chroniques a noté pendant les parties. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesChronicle=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const SS=(root&&root.ChroniquesSessionSummary)||(typeof require==='function'?(()=>{try{return require('./session-summary.js');}catch{return null;}})():null);
const WT=(root&&root.ChroniquesWorldTime)||(typeof require==='function'?(()=>{try{return require('./world-time.js');}catch{return null;}})():null);
const dayLabel=iso=>{try{return new Date(iso).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});}catch{return '';}};
const monthLabel=iso=>{try{const t=new Date(iso).toLocaleDateString('fr-FR',{month:'long',year:'numeric'});return t.charAt(0).toUpperCase()+t.slice(1);}catch{return '';}};
const meaningful=ss=>ss&&(ss.combats||(ss.events||[]).length||(ss.defeated||[]).length||Object.values(ss.pcs||{}).some(p=>p.damage||p.healing||p.downs));
function sessions(state,{isGM=true}={}){return [state.sessionStats,...(state.sessionHistory||[])].filter(Boolean).filter(x=>isGM||x.published).sort((a,b)=>String(a.startedAt).localeCompare(String(b.startedAt)));}
// ---------- Précédemment dans… ----------
function recapDraft(state,{now=Date.now()}={}){const list=sessions(state).filter(meaningful);
 // La séance « précédente » : la plus récente qui contient quelque chose, hors celle commencée il y a moins d'une heure.
 const last=list.filter(ss=>now-Date.parse(ss.startedAt)>3600000).pop()||list.pop();
 const out=['Précédemment dans « '+String(state.title||'la campagne')+' »…',''];
 if(last){out.push('Lors de la séance du '+dayLabel(last.startedAt)+' :');for(const l of SS?SS.lines(last,{audience:'player',party:(state.characters||[]).length}):[])out.push('• '+l);
  const since=last.startedAt;const notable=[];for(const pc of state.characters||[])for(const e of pc.history||[])if(!e.gm&&e.at>=since&&/^(Passe au niveau|Meurt|Rejoint|Reçoit le document|S’harmonise)/.test(e.text))notable.push(pc.name+' : '+e.text);
  for(const x of [...new Set(notable)].slice(0,8))out.push('• '+x);
  for(const m of (state.campaignMemory||[]).filter(m=>m.visibility==='shared'&&m.date&&m.date>=String(since).slice(0,10)))out.push('• '+m.title+(m.summary?' — '+m.summary:''));}
 else out.push('Le groupe s’apprête à vivre sa première aventure.');
 const quests=((state.campaignPlanner||{}).quests||[]).filter(q=>q.visibility==='shared'&&q.status==='active');
 if(quests.length){out.push('','Quêtes en cours :');for(const q of quests.slice(0,6)){const next=(q.objectives||[]).find(o=>!o.done&&!o.secret);out.push('• '+q.title+(next?' — prochain objectif : '+next.text:''));}}
 const wt=state.worldTime;if(wt&&wt.enabled&&WT)out.push('','Nous sommes le '+WT.format(wt,wt.minutes)+'.');
 return out.join('\n').slice(0,4000);}
function recapPanel({state,isGM,h}){const {esc}=h;const r=state.recap||{};
 if(!isGM){if(!r.published||!r.text)return '';return `<section class="panel recap-card" aria-labelledby="recap-title"><div class="panel-top"><h3 id="recap-title">📜 Précédemment…</h3>${r.updatedAt?`<span class="mini-pill">${esc(dayLabel(r.updatedAt))}</span>`:''}</div><div class="recap-text">${paragraphs(r.text,esc)}</div></section>`;}
 return `<section class="panel recap-card" aria-labelledby="recap-title"><div class="panel-top"><h3 id="recap-title">📜 Précédemment dans…</h3><span class="mini-pill">${r.published?'Publié':'Brouillon'}${r.table?' · sur l’écran de table':''}</span></div>
 <p class="muted small">À lire à voix haute en début de séance. « Composer » propose un texte à partir de la dernière séance (faits notés automatiquement, quêtes en cours) : relisez-le, racontez-le à votre façon, puis publiez.</p>
 <form class="recap-form"><label for="recap-text">Texte</label><textarea id="recap-text" name="text" rows="9" maxlength="4000">${esc(r.text||'')}</textarea>
 <div class="recap-row"><label class="check"><input type="checkbox" name="published" ${r.published?'checked':''}> Publier pour les joueurs</label><label class="check"><input type="checkbox" name="table" ${r.table?'checked':''}> Afficher sur l’écran de table</label></div>
 <div class="btn-group"><button type="button" class="btn btn-secondary" data-task="recap-compose">✎ Composer à partir de la dernière séance</button><button class="btn btn-primary" type="submit">Enregistrer</button></div></form></section>`;}
function paragraphs(text,esc){return String(text||'').split(/\n{2,}/).map(p=>`<p>${esc(p).replace(/\n/g,'<br>')}</p>`).join('');}
// ---------- Frise ----------
const TL_KINDS=[['all','Tout'],['session','Séances'],['pc','Personnages'],['story','Quêtes & mémoire'],['world','Monde']];
function timeline(state,{isGM=true}={}){const items=[];
 for(const ss of sessions(state,{isGM}))if(meaningful(ss)){const l=SS?SS.lines(ss,{audience:isGM?'gm':'player'}):[];items.push({at:ss.startedAt,kind:'session',title:'Séance du '+dayLabel(ss.startedAt),text:l.slice(0,3).join(' ')});}
 const seen=new Set();
 for(const pc of state.characters||[])for(const e of pc.history||[]){if(e.gm&&!isGM)continue;let kind=null;
  if(/^(Passe au niveau|Meurt|Rejoint|Apprend)/.test(e.text))kind='pc';else if(/^Quête terminée|^Reçoit le document/.test(e.text))kind='story';if(!kind)continue;
  const shared=kind==='story';const key=shared?e.text+'|'+String(e.at).slice(0,10):pc.id+e.id;if(seen.has(key))continue;seen.add(key);
  items.push({at:e.at,kind,title:shared?e.text.replace(/\.$/,''):pc.name,text:shared?'':e.text,world:e.world||''});}
 for(const m of state.campaignMemory||[]){if(!isGM&&m.visibility!=='shared')continue;if(!m.date)continue;items.push({at:m.date+'T12:00:00',kind:'story',title:m.title,text:m.summary||''});}
 for(const h of state.handouts||[])if(h.sentAt&&isGM)items.push({at:h.sentAt,kind:'story',title:'Document envoyé : '+h.title,text:''});
 const wt=state.worldTime;if(wt&&wt.enabled)for(const e of wt.events||[])if((e.reached||e.done)&&(isGM||e.shared)&&e.reachedAt)items.push({at:e.reachedAt,kind:'world',title:e.title||e.text||'Événement',text:WT?WT.format(wt,e.at):''});
 return items.filter(x=>x.at).sort((a,b)=>String(a.at).localeCompare(String(b.at)));}
function timelineHtml({state,isGM,kind='all',h}){const {esc}=h;const all=timeline(state,{isGM});const list=all.filter(x=>kind==='all'||x.kind===kind);
 const groups=[];for(const x of list){const m=monthLabel(x.at);const g=groups[groups.length-1];if(g&&g.m===m)g.items.push(x);else groups.push({m,items:[x]});}
 return `<section class="panel timeline-panel" aria-labelledby="tl-title"><div class="panel-top"><h3 id="tl-title">⟿ Frise de la campagne</h3><span class="mini-pill">${all.length} moment${all.length>1?'s':''}</span></div>
 <div class="hist-filters" role="group" aria-label="Filtrer la frise">${TL_KINDS.map(([id,l])=>`<button type="button" class="chip ${kind===id?'selected':''}" aria-pressed="${kind===id}" data-tl-kind="${id}">${l}</button>`).join('')}</div>
 ${groups.length?groups.map(g=>`<h4 class="tl-month">${esc(g.m)}</h4><ol class="timeline">${g.items.map(x=>`<li class="tl-item tl-${x.kind}"><span class="tl-dot" aria-hidden="true"></span><div><span class="tl-date">${esc(dayLabel(x.at))}${x.world?' · '+esc(x.world):''}</span><strong>${esc(x.title)}</strong>${x.text?`<p>${esc(x.text)}</p>`:''}</div></li>`).join('')}</ol>`).join(''):'<p class="empty">La frise se remplira au fil des séances.</p>'}</section>`;}
// ---------- Bilan d'arc ----------
function arcStats(state,{from='',to='',isGM=true}={}){const inRange=at=>(!from||String(at)>=from)&&(!to||String(at)<=to);
 const ss=sessions(state,{isGM}).filter(x=>inRange(x.startedAt)&&meaningful(x));const pcs={};
 const get=(id,name)=>pcs[id]||(pcs[id]={id,name,damage:0,healing:0,downs:0,xp:0,levels:0,items:0,quests:0,deaths:0});
 const total={sessions:ss.length,combats:0,rounds:0,defeated:0,byName:{}};
 for(const s of ss){total.combats+=s.combats||0;total.rounds+=(s.rounds||0)+(s.combats||0);const def=isGM?s.defeated||[]:(s.defeated||[]).filter(d=>d.visible);total.defeated+=def.length;for(const d of def){const k=String(d.name).replace(/\s+\d+$/,'');total.byName[k]=(total.byName[k]||0)+1;}
  for(const [id,p] of Object.entries(s.pcs||{})){const x=get(id,p.name);x.damage+=p.damage||0;x.healing+=p.healing||0;x.downs+=p.downs||0;}}
 for(const pc of state.characters||[]){const x=get(pc.id,pc.name);x.name=pc.name;for(const e of pc.history||[]){if(!inRange(e.at)||(e.gm&&!isGM))continue;const t=e.text;
  const m=t.match(/^Gagne ([\d\s  ]+) XP/);if(m)x.xp+=Number(m[1].replace(/\D/g,''))||0;if(/^Passe au niveau/.test(t))x.levels++;if(/^(Achète|Reçoit|Obtient|Prend dans)/.test(t))x.items++;if(/^Quête|✔$/.test(t))x.quests++;if(/^Meurt/.test(t))x.deaths++;}}
 return {total,pcs:Object.values(pcs).filter(p=>(state.characters||[]).some(c=>c.id===p.id))};}
function arcHtml({state,isGM,from='',h}){const {esc,attr}=h;const st=arcStats(state,{from,isGM});const list=sessions(state,{isGM}).filter(meaningful);
 const top=(k)=>{const p=st.pcs.filter(x=>x[k]>0).sort((a,b)=>b[k]-a[k])[0];return p?p.name+' ('+p[k].toLocaleString('fr-FR')+')':'—';};
 const foes=Object.entries(st.total.byName).sort((a,b)=>b[1]-a[1]).slice(0,6);
 return `<section class="panel arc-panel" aria-labelledby="arc-title"><div class="panel-top"><h3 id="arc-title">⚑ Bilan</h3></div>
 <label>Période<select data-arc-from><option value="">Toute la campagne</option>${list.map(s=>`<option value="${attr(s.startedAt)}" ${from===s.startedAt?'selected':''}>Depuis la séance du ${esc(dayLabel(s.startedAt))}</option>`).join('')}</select></label>
 <div class="arc-tiles"><div><strong>${st.total.sessions}</strong><span>séance${st.total.sessions>1?'s':''}</span></div><div><strong>${st.total.combats}</strong><span>combat${st.total.combats>1?'s':''}</span></div><div><strong>${st.total.rounds}</strong><span>rounds</span></div><div><strong>${st.total.defeated}</strong><span>adversaires vaincus</span></div></div>
 ${foes.length?`<p class="small"><b>Adversaires les plus fréquents :</b> ${foes.map(([n,c])=>esc(n)+(c>1?' ×'+c:'')).join(', ')}.</p>`:''}
 <div class="party-table-wrap" tabindex="0" role="region" aria-label="Bilan par personnage"><table class="party-table arc-table"><thead><tr><th scope="col">Personnage</th><th scope="col">XP</th><th scope="col">Niveaux</th><th scope="col">Dégâts encaissés</th><th scope="col">PV soignés</th><th scope="col">Chutes à 0 PV</th><th scope="col">Objets</th><th scope="col">Quêtes</th></tr></thead>
 <tbody>${st.pcs.map(p=>`<tr><th scope="row">${esc(p.name)}</th><td>${p.xp.toLocaleString('fr-FR')}</td><td>${p.levels}</td><td>${p.damage.toLocaleString('fr-FR')}</td><td>${p.healing.toLocaleString('fr-FR')}</td><td>${p.downs}${p.deaths?' · ☠':''}</td><td>${p.items}</td><td>${p.quests}</td></tr>`).join('')}</tbody></table></div>
 <p class="small arc-highlights"><b>Le plus endurant :</b> ${esc(top('damage'))} · <b>Le meilleur soigneur :</b> ${esc(top('healing'))} · <b>Le plus souvent à terre :</b> ${esc(top('downs'))}</p>
 <p class="muted small">${isGM?'Chiffres tirés des résumés de séance et des historiques (les jets restant physiques, ils ne sont pas comptés).':'Chiffres tirés des résumés publiés par le MJ et de l’historique de votre personnage.'}</p></section>`;}
return {recapDraft,recapPanel,paragraphs,timeline,timelineHtml,arcStats,arcHtml,sessions,TL_KINDS};
});
