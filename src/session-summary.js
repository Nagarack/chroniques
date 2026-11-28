/* Chroniques — résumé de séance automatique, sans IA.
   Le serveur compare l'état avant et après chaque action et note les faits marquants :
   combats, rounds, dégâts encaissés, soins, chutes à 0 PV, créatures vaincues (et XP SRD),
   objets obtenus, souvenirs, scènes terminées, repos, montées de niveau.
   Une séance commence automatiquement après 6 heures sans activité, ou à la demande du MJ. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesSessionSummary=api;})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const GAP_MS=6*3600*1000,MAX_EVENTS=80,MAX_HISTORY=12;
const XP={'0':10,'1/8':25,'1/4':50,'1/2':100,'1':200,'2':450,'3':700,'4':1100,'5':1800,'6':2300,'7':2900,'8':3900,'9':5000,'10':5900,'11':7200,'12':8400,'13':10000,'14':11500,'15':13000,'16':15000,'17':18000,'18':20000,'19':22000,'20':25000,'21':33000,'22':41000,'23':50000,'24':62000,'25':75000,'26':90000,'27':105000,'28':120000,'29':135000,'30':155000};
function blank(now){return {id:'seance-'+now.toString(36),startedAt:new Date(now).toISOString(),lastAt:new Date(now).toISOString(),published:false,combats:0,rounds:0,pcs:{},defeated:[],events:[]};}
function pcStats(ss,pc){return ss.pcs[pc.id]||(ss.pcs[pc.id]={name:pc.name,damage:0,healing:0,downs:0});}
function event(ss,text,audience){ss.events.push({at:new Date().toISOString(),text:String(text).slice(0,200),...(audience==='gm'?{audience:'gm'}:{})});if(ss.events.length>MAX_EVENTS)ss.events.splice(0,ss.events.length-MAX_EVENTS);}
// 5.5 : totaux de campagne, cumulés à chaque fin de séance (les anciennes séances servent de point de départ).
function addSession(t,ss){t.sessions++;const a=Date.parse(ss.startedAt),b=Date.parse(ss.endedAt||ss.lastAt);if(b>a)t.minutes+=Math.round((b-a)/60000);t.combats+=ss.combats||0;t.rounds+=ss.rounds||0;
 for(const d of ss.defeated||[]){t.defeated++;t.xp+=d.xp||0;}for(const [id,p] of Object.entries(ss.pcs||{})){const x=t.pcs[id]||(t.pcs[id]={name:p.name,damage:0,healing:0,downs:0});x.name=p.name;x.damage+=p.damage||0;x.healing+=p.healing||0;x.downs+=p.downs||0;}
 if(!t.firstAt||String(ss.startedAt)<t.firstAt)t.firstAt=ss.startedAt;return t;}
function emptyTotals(){return {sessions:0,minutes:0,combats:0,rounds:0,defeated:0,xp:0,pcs:{},firstAt:null};}
function seedTotals(state){if(state.campaignTotals)return state.campaignTotals;const t=emptyTotals();for(const ss of state.sessionHistory||[])addSession(t,ss);return state.campaignTotals=t;}
// Totaux affichés : séances terminées + séance en cours.
function totals(state){const base=JSON.parse(JSON.stringify(state.campaignTotals||(()=>{const t=emptyTotals();for(const ss of state.sessionHistory||[])addSession(t,ss);return t;})()));const ss=state.sessionStats;
 if(ss&&(ss.combats||ss.events.length||ss.defeated.length))addSession(base,ss);return base;}
function archive(state){const ss=state.sessionStats;if(!ss)return;const meaningful=ss.combats||ss.events.length||ss.defeated.length||Object.values(ss.pcs||{}).some(p=>p.damage||p.healing||p.downs);if(meaningful){seedTotals(state);addSession(state.campaignTotals,{...ss,endedAt:ss.lastAt});if(!Array.isArray(state.sessionHistory))state.sessionHistory=[];state.sessionHistory.unshift({...ss,endedAt:ss.lastAt});state.sessionHistory=state.sessionHistory.slice(0,MAX_HISTORY);}state.sessionStats=null;}
function current(state,now=Date.now()){let ss=state.sessionStats;if(ss&&now-Date.parse(ss.lastAt)>GAP_MS){archive(state);ss=null;}if(!ss)ss=state.sessionStats=blank(now);return ss;}
// 5.21 : présence. Les absents sont notés dans la séance en cours (ils suivent la séance dans l’historique).
function setAbsent(state,id,absent,now=Date.now()){const ss=current(state,now);if(!Array.isArray(ss.absent))ss.absent=[];ss.absent=ss.absent.filter(x=>x!==id);if(absent)ss.absent.push(id);return ss.absent;}
function attendance(state){const out={};const sessions=[...(state.sessionHistory||[]),...(state.sessionStats?[state.sessionStats]:[])];
 for(const p of state.characters||[]){const since=Date.parse(p.createdAt||0)||0;const seen=sessions.filter(s=>Date.parse(s.startedAt)>=since||!p.createdAt);out[p.id]={sessions:seen.length,present:seen.filter(s=>!(s.absent||[]).includes(p.id)).length};}
 return out;}
function startNew(state,now=Date.now()){archive(state);state.sessionStats=blank(now);return state.sessionStats;}
const pcHp=p=>Number(p&&p.hp)||0;
const items=p=>Array.isArray(p&&p.inventoryItems)?p.inventoryItems:[];
// Compare l'état avant/après une action validée. Ne modifie que next.sessionStats / next.sessionHistory.
function observe(prev,next,kind,body={},now=Date.now()){
 if(['sessionStart','sessionPublish','undo'].includes(kind))return;
 const ss=current(next,now);ss.lastAt=new Date(now).toISOString();
 const before=new Map((prev.characters||[]).map(p=>[p.id,p]));
 for(const pc of next.characters||[]){const old=before.get(pc.id);if(!old)continue;const st=pcStats(ss,pc);st.name=pc.name;
  const d=pcHp(pc)-pcHp(old);if(d<0)st.damage+=-d;else if(d>0)st.healing+=d;
  if(pcHp(old)>0&&pcHp(pc)===0){st.downs++;event(ss,pc.name+' tombe à 0 PV.');}
  if((pc.exhaustion||0)===6&&(old.exhaustion||0)<6)event(ss,pc.name+' succombe à l’épuisement.');
  const df=(pc.deathSaves&&pc.deathSaves.failure)||0,odf=(old.deathSaves&&old.deathSaves.failure)||0;if(df>=3&&odf<3)event(ss,pc.name+' meurt (trois échecs aux jets contre la mort).');
  const ds=(pc.deathSaves&&pc.deathSaves.success)||0,ods=(old.deathSaves&&old.deathSaves.success)||0;if(ds>=3&&ods<3)event(ss,pc.name+' est stabilisé(e).');
  if((pc.level||0)>(old.level||0)&&old.level)event(ss,pc.name+' passe au niveau '+pc.level+'.');
  const had=new Set(items(old).map(i=>i.id));const gained=items(pc).filter(i=>!had.has(i.id)).map(i=>i.name);if(gained.length)event(ss,pc.name+' obtient : '+gained.join(', ')+'.');
 }
 const oc=prev.combat||{},nc=next.combat||{};
 if(!oc.started&&nc.started){ss.combats++;event(ss,'Combat n°'+ss.combats+' engagé.');}
 if(nc.started&&oc.started&&(nc.round||1)>(oc.round||1))ss.rounds+=(nc.round-oc.round);
 if(oc.started&&!nc.started)event(ss,'Fin du combat'+((oc.round||1)>1?' après '+oc.round+' rounds':'')+'.');
 const nn=new Map((nc.npcs||[]).map(n=>[n.id,n]));
 for(const o of oc.npcs||[]){const n=nn.get(o.id);if(!n||!(o.hp>0)||n.hp>0)continue;const xp=XP[n.cr]??null;ss.defeated.push({name:n.name,cr:n.cr||'',xp,visible:n.visibility==='public'});event(ss,n.name+' est vaincu(e).',n.visibility==='public'?'':'gm');}
 if(kind==='rest')event(ss,'Repos '+(body.type==='long'?'long':'court')+' : '+((next.characters||[]).find(p=>p.id===body.id)||{}).name+'.');
 const om=new Set((prev.campaignMemory||[]).map(m=>m.id));for(const m of next.campaignMemory||[])if(!om.has(m.id))event(ss,'Souvenir noté : '+m.title+'.',m.visibility==='shared'?'':'gm');
 const of=new Map((prev.sessionFlow||[]).map(x=>[x.id,x]));for(const sc of next.sessionFlow||[]){const o=of.get(sc.id);if(sc.status==='completed'&&o&&o.status!=='completed')event(ss,'Scène terminée : '+sc.title+'.',sc.visibility==='shared'?'':'gm');}
}
function fmt(n){return Number(n).toLocaleString('fr-FR');}
function dateLabel(iso){try{return new Date(iso).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});}catch{return '';}}
// Texte du résumé. audience 'player' : uniquement les faits visibles des joueurs.
function lines(ss,{audience='gm',party=0}={}){if(!ss)return [];const gm=audience==='gm',out=[];
 const defeated=gm?ss.defeated:ss.defeated.filter(d=>d.visible);
 if(ss.combats)out.push(ss.combats+' combat'+(ss.combats>1?'s':'')+(ss.rounds?' · '+(ss.rounds+ss.combats)+' rounds au total':'')+'.');
 if(defeated.length){const counts={};for(const d of defeated){const k=d.name.replace(/\s+\d+$/,'');counts[k]=(counts[k]||0)+1;}out.push('Vaincus : '+Object.entries(counts).map(([k,v])=>v>1?k+' ×'+v:k).join(', ')+'.');}
 if(gm){const xp=ss.defeated.reduce((a,d)=>a+(d.xp||0),0);if(xp)out.push('XP des créatures vaincues (FP renseigné) : '+fmt(xp)+(party>0?' · '+fmt(Math.floor(xp/party))+' par personnage ('+party+')':'')+'.');}
 const pcs=Object.values(ss.pcs).filter(p=>p.damage||p.healing||p.downs);
 if(pcs.length)out.push('Le groupe : '+pcs.map(p=>p.name+' — '+[p.damage?fmt(p.damage)+' dégâts encaissés':'',p.healing?fmt(p.healing)+' PV soignés':'',p.downs?p.downs+' chute'+(p.downs>1?'s':'')+' à 0 PV':''].filter(Boolean).join(', ')).join(' ; ')+'.');
 const ev=ss.events.filter(e=>gm||e.audience!=='gm').filter(e=>!/^Combat n°|^Fin du combat|est vaincu/.test(e.text)).map(e=>e.text);
 if(ev.length)out.push(...ev.slice(-25));
 return out;}
function text(ss,opts={}){if(!ss)return '';const l=lines(ss,opts);return 'Résumé de séance — '+dateLabel(ss.startedAt)+'\n'+(l.length?l.map(x=>'• '+x).join('\n'):'• Rien de notable enregistré pour le moment.');}
// Vue joueur : seules les séances publiées, réduites aux faits visibles.
function projected(state){const keep=ss=>ss&&ss.published?{id:ss.id,startedAt:ss.startedAt,lastAt:ss.lastAt,published:true,combats:ss.combats,rounds:ss.rounds,pcs:ss.pcs,defeated:ss.defeated.filter(d=>d.visible).map(d=>({name:d.name,visible:true})),events:ss.events.filter(e=>e.audience!=='gm')}:null;
 return {sessionStats:keep(state.sessionStats),sessionHistory:(state.sessionHistory||[]).map(keep).filter(Boolean)};}
function publish(state,id,value){const ss=state.sessionStats&&state.sessionStats.id===id?state.sessionStats:(state.sessionHistory||[]).find(x=>x.id===id);if(!ss){const e=new Error('Séance introuvable.');e.status=400;throw e;}ss.published=!!value;return ss;}
return {observe,current,startNew,setAbsent,attendance,lines,text,projected,publish,totals,XP,GAP_MS};
});
