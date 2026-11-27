// ——— 13 · Onglets, écran allumé, lecture à voix haute, affichage ———
const TAB_SETS={encounters:[['monstres','Monstres'],['objets','Objets'],['marchands','Marchands'],['rencontres','Rencontres']],
 chronicle:[['seances','Séances',['seances','resumes']],['monde','Monde',['calendrier','voyages']],['carnet','Carnet & enquête',['carnet','enquete']],['histoire','Histoire',['frise','memoire']],['documents','Documents',['documents']]]};
const tabMembers=t=>t[2]||[t[0]];
let textSize=0;try{textSize=Math.max(0,Math.min(2,Number(localStorage.getItem('chroniques-taille'))||0));}catch{}
// 5.10 : lecture facilitée (police OpenDyslexic, espacements) et couleurs adaptées aux daltoniens (palette Okabe-Ito + symboles), réglées par appareil.
// 5.12 : écran toujours allumé (par appareil) ; automatique sur l’écran de table et en mode table unique.
let keepAwake=false;try{keepAwake=localStorage.getItem('chroniques-eveil')==='1';}catch{}
let wakeSentinel=null;
function wakeSupported(){return typeof navigator!=='undefined'&&!!navigator.wakeLock;}
function wakeWanted(){return keepAwake||tableMode||!!viewer?.tableMode;}
async function wakeSync(){if(!wakeSupported())return;const want=wakeWanted()&&document.visibilityState==='visible';
 if(want&&!wakeSentinel){try{wakeSentinel=await navigator.wakeLock.request('screen');wakeSentinel.addEventListener('release',()=>{wakeSentinel=null;});}catch{wakeSentinel=null;}}
 else if(!want&&wakeSentinel){try{await wakeSentinel.release();}catch{}wakeSentinel=null;}}
if(typeof document!=='undefined'&&document.addEventListener)document.addEventListener('visibilitychange',()=>{wakeSync();});
// 5.12 : lecture à voix haute avec la voix intégrée de l’appareil.
let speaking='';
function speechSupported(){return typeof window!=='undefined'&&'speechSynthesis' in window&&typeof SpeechSynthesisUtterance!=='undefined';}
function speakButton(key){return speechSupported()?`<button type="button" class="text-button speak-btn" data-speak="${attr(key)}" aria-pressed="${speaking===key}">${speaking===key?'■ Arrêter la lecture':'🔊 Lire à voix haute'}</button>`:'';}
function speakText(key){if(key==='stage')return stagedScene()?.readAloud||'';const [kind,id]=key.split(':');
 if(kind==='scene'){const sc=(state.sessionFlow||[]).find(x=>x.id===id);return sc?.readAloud||'';}
 if(kind==='handout'){const h=(state.handouts||[]).find(x=>x.id===id);return h?[h.title,h.text].filter(Boolean).join('. '):'';}
 return '';}
function speakToggle(key){if(!speechSupported())return;const synth=window.speechSynthesis;synth.cancel();if(speaking===key){speaking='';render();return;}
 const text=speakText(key);if(!text){toast('Rien à lire.',true);return;}const lang=uiLang()==='en'?'en':'fr';const u=new SpeechSynthesisUtterance(text);u.lang=lang==='en'?'en-GB':'fr-FR';
 const voice=(synth.getVoices()||[]).find(v=>String(v.lang||'').toLowerCase().startsWith(lang));if(voice)u.voice=voice;u.rate=0.95;
 u.onend=u.onerror=()=>{if(speaking===key){speaking='';render();}};speaking=key;synth.speak(u);render();}
let readEasy=false,cvdMode=false;try{readEasy=localStorage.getItem('chroniques-lecture')==='1';cvdMode=localStorage.getItem('chroniques-daltonien')==='1';}catch{}
const CVD_FILL={or:'#E69F00',rouge:'#D55E00',bleu:'#0072B2',vert:'#009E73',violet:'#CC79A7',blanc:'#F0F0F0',gris:'#8a8a8a'};
const CVD_DASH={or:'',rouge:'10 6',bleu:'3 5',vert:'14 4 3 4',violet:'2 3',blanc:'6 3'};
function mapFill(palette,k){return cvdMode&&CVD_FILL[k]?CVD_FILL[k]:palette[k];}
function applyTextSize(){if(typeof document!=='undefined'&&document.documentElement){const d=document.documentElement;d.style.setProperty('--ui-zoom',String([1,1.12,1.25][textSize]));d.classList?.toggle('read-easy',readEasy);d.classList?.toggle('cvd',cvdMode);}}
applyTextSize();
let pageTabs={};try{pageTabs=JSON.parse(localStorage.getItem('chroniques-onglets')||'{}')||{};}catch{pageTabs={};}
function setPageTab(pageId,key){pageTabs[pageId]=key;try{localStorage.setItem('chroniques-onglets',JSON.stringify(pageTabs));}catch{}}
function withTabs(pageId,html){const present=new Set([...html.matchAll(/data-tab="([a-z]+)"/g)].map(m=>m[1]));const tabs=TAB_SETS[pageId].filter(t=>tabMembers(t).some(k=>present.has(k)));if(tabs.length<2)return html;
 if(pageId==='chronicle'&&actor!=='mj'&&unreadHandouts()&&!pageTabs.__docsSeen){pageTabs.chronicle='documents';pageTabs.__docsSeen=true;}
 const want=pageTabs[pageId];const cur=(tabs.find(t=>t[0]===want)||tabs.find(t=>tabMembers(t).includes(want))||tabs[0])[0];const on=tabMembers(tabs.find(t=>t[0]===cur));
 const counts={documents:actor!=='mj'?unreadHandouts():0};
 const bar=`<div class="page-tabs" role="tablist" aria-label="Rubriques">${tabs.map(([k,l])=>`<button type="button" role="tab" id="tab-${pageId}-${k}" aria-selected="${k===cur}" data-page-tab="${pageId}" data-tab-key="${k}">${l}${counts[k]?` <span class="nav-badge">${counts[k]}</span>`:''}</button>`).join('')}</div>`;
 const at=html.indexOf('<section');const at2=html.indexOf('<div class="planner-summary"');const cut=[at,at2].filter(x=>x>=0).sort((a,b)=>a-b)[0];if(cut==null)return html;
 const body=html.slice(cut).replace(/data-tab="([a-z]+)"/g,(m,k)=>on.includes(k)?m+' data-tab-on':m);
 return html.slice(0,cut)+bar+`<div class="tab-host" data-active="${cur}">`+body+'</div>';}
function showTab(pageId,key){setPageTab(pageId,key);render();}
function heading(tag,title,subtitle){return `<div class="section-heading"><div class="eyebrow">${esc(tag)}</div><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div>`;}
function metric(label,value,sub,icon){return `<div class="metric"><div class="metriclabel">${esc(label)}<span>${icon}</span></div><div class="metricvalue">${value}</div><div class="metricfoot">${esc(sub)}</div></div>`;}
// --- V4.5 : panneau de combat simplifié pour le joueur + alerte « À vous de jouer » ---
let lastActiveSeen=null;
function trackTurn(){if(actor==='mj'||!state?.combat)return;const now=state.combat.started?L.activeId(state):null;if(lastActiveSeen!==null&&now===actor&&lastActiveSeen!==actor){setTimeout(()=>toast('⚔ À vous de jouer !'),0);try{navigator.vibrate?.([180,90,180]);}catch{}try{const t=document.title;document.title='⚔ À vous de jouer !';setTimeout(()=>{document.title=t;},6000);}catch{}}const cmp=now&&now!==lastActiveSeen?(state.combat.npcs||[]).find(n=>n.id===now&&n.ownerPc===actor):null;if(cmp&&lastActiveSeen!==null)setTimeout(()=>toast('🐾 Au tour de '+cmp.name+' !'),0);lastActiveSeen=now||'';}
function turnsUntil(id){const o=state.combat.order||[],i=o.indexOf(id);if(i<0)return null;const groupOf=x=>(state.combat.npcs||[]).find(n=>n.id===x)?.group||'';let n=0,k=state.combat.index;const seen=new Set();while(o[k]!==id&&n<o.length+1){const g=groupOf(o[k]);if(!g||!seen.has(g)){n++;if(g)seen.add(g);}k=(k+1)%o.length;if(seen.size>50)break;}return n;}
// 5.3 : retarder son tour (option de table) et préparer une action (action, puis réaction au déclencheur).
function readyForm(id){return `<form class="ready-form" data-for="${attr(id)}"><label>Déclencheur<input name="trigger" maxlength="140" required placeholder="Ex. si un gobelin franchit la porte"></label><label>Action préparée<input name="what" maxlength="140" required placeholder="Ex. je tire une flèche"></label><label class="check"><input type="checkbox" name="spell"> C’est un sort</label><p class="muted small">Coûte l’action de ce tour. Au déclencheur, la réaction est utilisée ; sans déclencheur avant votre prochain tour, l’action est perdue. Un sort préparé est lancé maintenant : son emplacement est dépensé et il demande la concentration jusqu’au déclenchement.</p><button class="btn btn-secondary" type="submit">Préparer l’action</button></form>`;}
function turnOptions(p){const c=state.combat;if(!c?.started||!p)return '';const delayed=(c.delayed||[]).some(d=>d.id===p.id);const ready=(c.readied||[]).find(r=>r.id===p.id);const active=L.activeId(state)===p.id;
 const canDelay=active&&!p.group&&(!TCHC||TCHC.allowDelay(state));let h='';
 if(delayed)h+=`<span class="mini-pill turn-flag">⏸ Tour retardé</span><button type="button" class="btn btn-secondary" data-act-now="${attr(p.id)}">Agir maintenant</button>`;
 if(ready)h+=`<span class="turn-ready"><span class="mini-pill turn-flag">⚑ Action préparée</span> ${esc(ready.action)} <small class="muted">· déclencheur : ${esc(ready.trigger)}${ready.spell?' · sort (concentration)':''}</small></span><button type="button" class="btn btn-secondary" data-ready-resolve="use" data-for="${attr(p.id)}">Déclencher</button><button type="button" class="text-button" data-ready-resolve="cancel" data-for="${attr(p.id)}">Annuler</button>`;
 if(active&&!ready&&!delayed)h+=`${canDelay?`<button type="button" class="btn btn-secondary" data-delay-turn="${attr(p.id)}" title="Option de table : jouer plus tard dans le round">⏸ Retarder</button>`:''}<details class="ready-details"><summary>⚑ Préparer une action</summary>${readyForm(p.id)}</details>`;
 return h?`<div class="turn-options">${h}</div>`:'';}
function playerTurnPanel(){if(actor==='mj'||!state.combat?.started)return '';const p=L.findPc(state,actor);if(!p)return '';const mine=L.activeId(state)===actor;const cur=[...state.characters,...(state.combat.npcs||[])].find(x=>x.id===L.activeId(state));const wait=mine?0:turnsUntil(actor);
 const eco=[['action','Action'],['bonus','Action bonus'],['reaction','Réaction']];const pct=Math.max(0,Math.min(100,Math.round(p.hp/Math.max(1,p.stats.hp)*100)));
 const rows=(()=>{try{return P.slotRows(p,state.edition).filter(r=>r.max>0);}catch{return [];}})();const tracked=rows.some(r=>r.left!=null);
 const usable=GEAR?(p.inventoryItems||[]).filter(it=>{const u=GEAR.useInfo(it);return u&&(u.consumes==='charge'?it.charges>0:(it.quantity??1)>0);}).slice(0,4):[];
 return `<section class="player-turn ${mine?'mine':''}" aria-live="polite"><div class="pt-status">${mine?'<strong class="pt-go">⚔ À vous de jouer !</strong>'+turnTimerBadge(true):`<strong>Tour de ${esc(cur?.name||'…')}</strong><small>${wait===1?'Vous jouez au prochain tour':wait?'Vous jouez dans '+wait+' tours':''} · round ${state.combat.round}</small>`}</div>
 <div class="pt-hp ${pct<=33?'low':''}"><div><small>Points de vie</small><strong>${p.hp}${p.tempHp?' <span class="muted">+'+p.tempHp+'</span>':''} / ${p.stats.hp}</strong></div><div class="pt-bar"><i style="width:${pct}%"></i></div>
 <form class="pt-hp-form" data-pc="${attr(p.id)}"><label class="visually-hidden" for="pt-hp-value">Valeur (total réel des dés)</label><input id="pt-hp-value" name="value" type="number" min="1" max="999" inputmode="numeric" placeholder="Total" required><button type="submit" class="btn btn-secondary" name="dir" value="-1">− Dégâts</button><button type="submit" class="btn btn-secondary" name="dir" value="1">+ Soins</button></form>
 ${p.hp<=0?'<p class="pt-alert">À 0 PV : faites votre jet de sauvegarde contre la mort au début de votre tour (sur la fiche).</p>':''}</div>
 <div class="pt-eco">${eco.map(([k,l])=>`<button type="button" class="pt-eco-btn ${p.economy?.[k]?'used':''}" data-spend="${k}" data-for="${attr(p.id)}" ${p.economy?.[k]?'disabled':''} aria-pressed="${!!p.economy?.[k]}">${l}${p.economy?.[k]?' ✓':''}</button>`).join('')}</div>
 ${turnOptions(p)}
 ${tracked?`<div class="pt-slots">${rows.map(r=>`<button type="button" class="act-chip" data-slot="${attr(r.key)}" data-delta="1" ${r.left>0?'':'disabled'} title="Dépenser un emplacement de niveau ${r.level}">Niv. ${r.level} · ${r.left}/${r.max}</button>`).join('')}</div>`:''}
 ${usable.length?`<div class="pt-items">${usable.map(it=>`<button type="button" class="act-chip" data-pt-item="${attr(it.id)}">${esc(it.name)}${(it.quantity??1)>1?' ×'+it.quantity:''}</button>`).join('')}</div>`:''}
 ${(p.conditions||[]).length?`<div class="pt-conds">${p.conditions.map(c=>conditionChip(c,p.id)).join('')}</div>`:''}</section>`;}
// --- V4.5 : « Quoi de neuf ? » après une mise à jour ---
