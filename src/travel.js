/* Chroniques — voyage et exploration (V5), d'après les règles du SRD 5.1 (CC BY 4.0) :
   rythme de marche (lent 3 km/h · normal 4,5 km/h · rapide 6 km/h ; 27 / 36 / 45 km par jour de 8 h),
   marche forcée (au-delà de 8 h : sauvegarde de Constitution DD 10 + 1 par heure supplémentaire, à lancer
   aux dés), nourriture (0,5 kg par jour) et eau (4 litres par jour, 8 par temps chaud), durée des sources
   de lumière (torche et bougie 1 h, lanterne 6 h par flasque d'huile).
   Chroniques compte le temps et la distance ; les jets restent physiques. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesTravel=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const PACES={lent:{label:'Lent',kmh:3,day:27,note:'Discrétion possible.'},normal:{label:'Normal',kmh:4.5,day:36,note:''},rapide:{label:'Rapide',kmh:6,day:45,note:'−5 en Sagesse (Perception) passive.'}};
const LIGHTS={torche:{label:'Torche',minutes:60,radius:'6 m de lumière vive, 6 m de faible'},lanterne:{label:'Lanterne (flasque d’huile)',minutes:360,radius:'9 m de lumière vive, 9 m de faible'},sourde:{label:'Lanterne sourde',minutes:360,radius:'cône de 18 m vive, 18 m faible'},bougie:{label:'Bougie',minutes:60,radius:'1,5 m de lumière vive, 1,5 m de faible'},sort:{label:'Lumière magique',minutes:60,radius:'selon le sort'}};
const MAX_LIGHTS=20;
function fail(m){const e=new Error(m);e.status=400;throw e;}
const txt=(v,label,max)=>{const t=String(v??'').replace(/[\u0000-\u001f]/g,' ').trim();if(t.length>max)fail(label+' : '+max+' caractères maximum.');return t;};
function get(s){if(!s.travel||typeof s.travel!=='object')s.travel={active:false,pace:'normal',lights:[]};if(!Array.isArray(s.travel.lights))s.travel.lights=[];return s.travel;}
function start(s,v){const t=get(s);const km=Number(v?.distanceKm);if(!Number.isFinite(km)||km<0||km>20000)fail('Distance invalide (0 à 20 000 km).');if(!PACES[v?.pace||'normal'])fail('Rythme inconnu.');
 Object.assign(t,{active:true,destination:txt(v?.destination,'Destination',90)||'Destination inconnue',distanceKm:Math.round(km*10)/10,doneKm:0,pace:v?.pace||'normal',hoursToday:0,days:1,hot:v?.hot===true,startedAt:new Date().toISOString()});return t;}
function setPace(s,pace){if(!PACES[pace])fail('Rythme inconnu.');get(s).pace=pace;}
function end(s){const t=get(s);t.active=false;return t;}
// Avance de `hours` heures de marche : distance, marche forcée, lumières. Renvoie les messages à journaliser.
function advance(s,hours){const t=get(s);if(!t.active)fail('Aucun voyage en cours.');const h=Number(hours);if(!Number.isInteger(h)||h<1||h>24)fail('Durée : 1 à 24 heures.');
 const msgs=[];const p=PACES[t.pace];const before=t.doneKm;t.doneKm=Math.min(t.distanceKm||Infinity,Math.round((t.doneKm+p.kmh*h)*10)/10);if(!Number.isFinite(t.doneKm))t.doneKm=Math.round((before+p.kmh*h)*10)/10;
 const startH=t.hoursToday;t.hoursToday+=h;
 for(let x=Math.max(9,startH+1);x<=t.hoursToday;x++)msgs.push({gm:false,text:'Marche forcée ('+x+'e heure) : chacun fait une sauvegarde de Constitution DD '+(10+x-8)+' aux dés ; en cas d’échec, 1 niveau d’épuisement.'});
 msgs.push(...tickLights(s,h*60));
 if(t.distanceKm&&t.doneKm>=t.distanceKm&&before<t.distanceKm)msgs.push({gm:false,text:'Arrivée : '+t.destination+' ('+t.distanceKm.toLocaleString('fr-FR')+' km, '+t.days+' jour'+(t.days>1?'s':'')+').'});
 return msgs;}
function camp(s){const t=get(s);if(!t.active)fail('Aucun voyage en cours.');t.hoursToday=0;t.days=(t.days||1)+1;return [{gm:false,text:'Campement : chacun consomme 0,5 kg de nourriture et '+(t.hot?'8':'4')+' litres d’eau.'}];}
// Les lumières allumées s'épuisent quand le temps passe (voyage ou calendrier du monde).
function tickLights(s,minutes){const t=get(s);const msgs=[];for(const l of t.lights){if(!l.lit)continue;l.minutesLeft=Math.max(0,l.minutesLeft-minutes);if(l.minutesLeft===0){l.lit=false;msgs.push({gm:false,text:'🕯 '+l.label+(l.owner?' de '+l.owner:'')+' s’éteint.'});}}t.lights=t.lights.filter(l=>l.lit||l.keep);return msgs;}
function lightAdd(s,id,v,ownerName){const t=get(s);if(t.lights.length>=MAX_LIGHTS)fail('20 sources de lumière au maximum.');const k=LIGHTS[v?.kind];if(!k)fail('Source de lumière inconnue.');
 const minutes=v?.minutes!=null?Number(v.minutes):k.minutes;if(!Number.isInteger(minutes)||minutes<1||minutes>1440)fail('Durée invalide.');
 const l={id,kind:v.kind,label:txt(v?.label,'Nom',40)||k.label,owner:ownerName||'',pcId:v?.pcId||'',minutesLeft:minutes,total:minutes,lit:true};t.lights.push(l);return l;}
function lightRemove(s,id){const t=get(s);const n=t.lights.length;t.lights=t.lights.filter(l=>l.id!==id);if(n===t.lights.length)fail('Lumière introuvable.');}
// Rations : retire une ration (objet dont le nom contient « ration ») à chaque personnage.
function eatRations(s,I){const out=[];for(const pc of s.characters||[]){const it=(pc.inventoryItems||[]).find(i=>/ration/i.test(i.name)&&(i.quantity??1)>0);
 if(!it){out.push(pc.name+' n’a plus de rations');continue;}if((it.quantity??1)<=1)pc.inventoryItems=pc.inventoryItems.filter(i=>i!==it);else it.quantity-=1;}
 return out;}
// ---------- Affichage ----------
const fmtMin=m=>m>=60?Math.floor(m/60)+' h'+(m%60?' '+String(m%60).padStart(2,'0'):''):m+' min';
function panel({state,isGM,h,pcs=[]}){const {esc,attr}=h;const t=state.travel||{};const lights=(t.lights||[]).filter(l=>l.lit);
 if(!isGM&&!t.active&&!lights.length)return '';
 const p=PACES[t.pace]||PACES.normal;const pct=t.distanceKm?Math.min(100,Math.round((t.doneKm||0)/t.distanceKm*100)):0;
 const lightList=lights.length?`<ul class="travel-lights">${lights.map(l=>`<li><span>🕯 ${esc(l.label)}${l.owner?' · '+esc(l.owner):''}</span><span class="${l.minutesLeft<=10?'danger-text':''}">${fmtMin(l.minutesLeft)}</span>${isGM?`<button type="button" class="icon-btn" data-light-remove="${attr(l.id)}" aria-label="Éteindre ${attr(l.label)}">✕</button>`:''}</li>`).join('')}</ul>`:'<p class="muted small">Aucune lumière allumée.</p>';
 return `<section class="panel travel-panel" aria-labelledby="travel-title"><div class="panel-top"><h3 id="travel-title">🧭 Voyage & exploration</h3>${t.active?`<span class="mini-pill">Jour ${t.days||1} · ${t.hoursToday||0} h de marche</span>`:''}</div>
 ${t.active?`<p><strong>Vers ${esc(t.destination)}</strong> — ${String(t.doneKm||0).replace('.',',')} / ${String(t.distanceKm||0).replace('.',',')} km · rythme ${esc(p.label.toLowerCase())} (${String(p.kmh).replace('.',',')} km/h, ${p.day} km par jour)${p.note?' · '+esc(p.note):''}</p>
 ${t.distanceKm?`<div class="comj-hpbar travel-bar" role="progressbar" aria-label="Progression du voyage" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><span style="width:${pct}%"></span></div>`:''}
 ${(t.hoursToday||0)>=8?'<p class="danger-text small">Au-delà de 8 h de marche : marche forcée (sauvegardes de Constitution à chaque heure).</p>':''}`:isGM?'<p class="muted small">Démarrez un voyage pour suivre la distance, la marche forcée, les rations et les lumières. Le temps avance aussi dans le calendrier du monde s’il est activé.</p>':''}
 ${isGM?(t.active?`<div class="btn-group travel-actions"><label>Rythme<select data-travel-pace>${Object.entries(PACES).map(([k,v])=>`<option value="${k}" ${t.pace===k?'selected':''}>${v.label}</option>`).join('')}</select></label><button type="button" class="btn btn-secondary" data-travel-advance="1">+1 h de marche</button><button type="button" class="btn btn-secondary" data-travel-advance="4">+4 h</button><button type="button" class="btn btn-secondary" data-task="travel-camp">⛺ Campement (fin de journée)</button><button type="button" class="btn btn-secondary" data-task="travel-rations">Décompter une ration chacun</button><button type="button" class="btn btn-secondary" data-task="travel-end">Fin du voyage</button></div>`:
 `<form class="travel-start"><label>Destination<input name="destination" maxlength="90" required placeholder="Ex. Le col des Brumes"></label><label>Distance (km)<input name="distanceKm" type="number" min="0" max="20000" step="0.5" value="36"></label><label>Rythme<select name="pace">${Object.entries(PACES).map(([k,v])=>`<option value="${k}" ${k==='normal'?'selected':''}>${v.label} (${String(v.kmh).replace('.',',')} km/h)</option>`).join('')}</select></label><label class="check"><input type="checkbox" name="hot"> Forte chaleur (8 L d’eau)</label><button class="btn btn-primary" type="submit">Partir</button></form>`):''}
 <h4>Lumières</h4>${lightList}
 ${isGM?`<form class="light-add"><label>Source<select name="kind">${Object.entries(LIGHTS).map(([k,v])=>`<option value="${k}">${esc(v.label)} — ${fmtMin(v.minutes)}</option>`).join('')}</select></label><label>Porteur<select name="pcId"><option value="">—</option>${pcs.map(p=>`<option value="${attr(p.id)}">${esc(p.name)}</option>`).join('')}</select></label><button class="btn btn-secondary" type="submit">Allumer</button></form><p class="muted small">Les lumières s’usent quand le temps avance (voyage ou calendrier du monde), pas pendant les rounds de combat.</p>`:''}
 </section>`;}
return {PACES,LIGHTS,get,start,setPace,end,advance,camp,tickLights,lightAdd,lightRemove,eatRations,panel,fmtMin};
});
