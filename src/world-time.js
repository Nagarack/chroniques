/* Chroniques — calendrier du monde : date et heure dans la fiction, passage du temps, saisons et événements prévus.
   Le temps est compté en minutes depuis le 1er jour du 1er mois de l'année de départ. Partagé serveur / interface. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesWorldTime=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const PRESETS={
 gregorien:{label:'Calendrier grégorien (365 jours)',months:[['Janvier',31],['Février',28],['Mars',31],['Avril',30],['Mai',31],['Juin',30],['Juillet',31],['Août',31],['Septembre',30],['Octobre',31],['Novembre',30],['Décembre',31]]},
 simple:{label:'Douze mois de trente jours',months:[['Mois du Givre',30],['Mois des Vents',30],['Mois des Semailles',30],['Mois des Pluies',30],['Mois des Fleurs',30],['Mois du Soleil',30],['Mois des Moissons',30],['Mois des Fruits',30],['Mois des Brumes',30],['Mois des Feuilles',30],['Mois des Ombres',30],['Mois des Neiges',30]]}
};
const DAY=1440,MAX_EVENTS=60;
function fail(m){const e=new Error(m);e.status=400;throw e;}
function defaults(){return {enabled:true,minutes:8*60,year:1,era:'',months:PRESETS.gregorien.months.map(([name,days])=>({name,days})),events:[]};}
function yearLength(wt){return wt.months.reduce((n,m)=>n+m.days,0);}
// Décompose un nombre de minutes en date : {year, month (0-based), day (1-based), hour, minute, dayOfYear}.
function split(wt,minutes){const yl=yearLength(wt)*DAY;const m=Math.max(0,Math.floor(Number(minutes)||0));const y=Math.floor(m/yl);let rest=m-y*yl;const dayOfYear=Math.floor(rest/DAY);rest-=dayOfYear*DAY;
 let d=dayOfYear,month=0;while(month<wt.months.length-1&&d>=wt.months[month].days){d-=wt.months[month].days;month++;}
 return {year:wt.year+y,month,day:d+1,hour:Math.floor(rest/60),minute:rest%60,dayOfYear};}
function join(wt,{year,month,day,hour=0,minute=0}){const y=Number(year)-wt.year;if(!Number.isInteger(y)||y<0||y>10000)fail('Année invalide (pas avant l’année de départ).');
 if(!Number.isInteger(month)||month<0||month>=wt.months.length)fail('Mois invalide.');if(!Number.isInteger(day)||day<1||day>wt.months[month].days)fail('Jour invalide.');
 if(!Number.isInteger(hour)||hour<0||hour>23||!Number.isInteger(minute)||minute<0||minute>59)fail('Heure invalide.');
 let doy=day-1;for(let i=0;i<month;i++)doy+=wt.months[i].days;return y*yearLength(wt)*DAY+doy*DAY+hour*60+minute;}
function season(wt,minutes){const p=split(wt,minutes);const f=(p.dayOfYear+0.5)/yearLength(wt);
 // Hémisphère nord par défaut : hiver en début et fin d'année.
 if(f<2/12||f>=11/12)return {id:'hiver',label:'Hiver',icon:'❄'};if(f<5/12)return {id:'printemps',label:'Printemps',icon:'❀'};if(f<8/12)return {id:'ete',label:'Été',icon:'☀'};return {id:'automne',label:'Automne',icon:'🍂'};}
function dayPart(hour){if(hour<5)return 'nuit';if(hour<7)return 'aube';if(hour<12)return 'matin';if(hour<14)return 'midi';if(hour<18)return 'après-midi';if(hour<21)return 'soir';return 'nuit';}
const pad=n=>String(n).padStart(2,'0');
function format(wt,minutes,opts={}){if(!wt)return '';const p=split(wt,minutes);const date=p.day+(p.day===1?'er':'')+' '+wt.months[p.month].name+' '+p.year+(wt.era?' '+wt.era:'');return opts.dateOnly?date:date+', '+pad(p.hour)+' h '+pad(p.minute);}
function duration(min){min=Math.abs(Math.round(min));const d=Math.floor(min/DAY),h=Math.floor(min%DAY/60),m=min%60;return [d?d+' j':'',h?h+' h':'',m?m+' min':''].filter(Boolean).join(' ')||'0 min';}
function txt(v,label,max,required){const s=String(v??'').replace(/[\u0000-\u001f]/g,' ').trim();if(required&&!s)fail(label+' requis.');if(s.length>max)fail(label+' : '+max+' caractères maximum.');return s;}
function get(s){if(!s.worldTime||typeof s.worldTime!=='object')s.worldTime=defaults();const wt=s.worldTime;if(!Array.isArray(wt.months)||!wt.months.length)wt.months=defaults().months;if(!Array.isArray(wt.events))wt.events=[];return wt;}
// Avance le temps ; renvoie les événements atteints (pour le journal).
function advance(s,minutes,reason){const wt=s.worldTime;if(!wt||!wt.enabled)return [];const n=Math.floor(Number(minutes));if(!Number.isInteger(n)||n<1||n>DAY*400)fail('Durée invalide (1 minute à 400 jours).');
 const before=wt.minutes;wt.minutes+=n;const reached=wt.events.filter(e=>!e.done&&e.at>before&&e.at<=wt.minutes);const now=new Date().toISOString();for(const e of reached){e.reached=true;e.reachedAt=now;}reached.fullMoons=fullMoonsBetween(wt,before,wt.minutes);return reached;}
function setDate(s,v){const wt=get(s);wt.minutes=join(wt,{year:Number(v?.year),month:Number(v?.month),day:Number(v?.day),hour:Number(v?.hour??0),minute:Number(v?.minute??0)});const now=new Date().toISOString();for(const e of wt.events){const r=!e.done&&e.at<=wt.minutes;if(r&&!e.reached)e.reachedAt=now;e.reached=r;}return wt;}
// Calendrier : préréglage ou liste « Nom : jours » ; l'instant courant est conservé au mieux (même date si possible).
function setCalendar(s,v){const wt=get(s);const old=split(wt,wt.minutes);let months;
 if(v?.preset){if(!Object.hasOwn(PRESETS,v.preset))fail('Calendrier inconnu.');months=PRESETS[v.preset].months.map(([name,days])=>({name,days}));}
 else{if(!Array.isArray(v?.months)||v.months.length<1||v.months.length>24)fail('Entre 1 et 24 mois.');months=v.months.map((m,i)=>({name:txt(m?.name,'Nom du mois '+(i+1),30,true),days:(()=>{const d=Number(m?.days);if(!Number.isInteger(d)||d<1||d>100)fail('Jours du mois '+(i+1)+' : 1 à 100.');return d;})()}));}
 const year=v?.year!=null?Number(v.year):wt.year;if(!Number.isInteger(year)||year<-99999||year>99999)fail('Année de départ invalide.');
 const era=txt(v?.era??wt.era,'Ère',20,false);
 const evDates=wt.events.map(e=>split(wt,e.at));wt.months=months;wt.era=era;const shift=year-wt.year;wt.year=year;
 const fit=p=>{const month=Math.min(p.month,months.length-1);return join(wt,{year:Math.max(year,p.year+shift),month,day:Math.min(p.day,months[month].days),hour:p.hour,minute:p.minute});};
 const was=wt.minutes;wt.minutes=fit(old);for(const m of wt.moons||[])m.fullAt+=wt.minutes-was;wt.events.forEach((e,i)=>{e.at=fit(evDates[i]);});return wt;}
// 5.11 : lunes. Chaque lune a un cycle (en jours, décimales permises) et l’instant d’une de ses pleines lunes (fullAt, en minutes).
const MAX_MOONS=3;
const PHASES=[['nouvelle','Nouvelle lune','🌑'],['premier_croissant','Premier croissant','🌒'],['premier_quartier','Premier quartier','🌓'],['gibbeuse_croissante','Gibbeuse croissante','🌔'],['pleine','Pleine lune','🌕'],['gibbeuse_decroissante','Gibbeuse décroissante','🌖'],['dernier_quartier','Dernier quartier','🌗'],['dernier_croissant','Dernier croissant','🌘']];
const mod=(a,n)=>((a%n)+n)%n;
// Phase d’une lune à un instant : fraction du cycle depuis la nouvelle lune (0 = nouvelle, 0,5 = pleine) et l’une des huit phases.
function moonPhase(moon,minutes){const cyc=moon.cycle*DAY;const f=mod((minutes-moon.fullAt)/cyc+0.5,1);const i=Math.floor(f*8+0.5)%8;const [id,label,icon]=PHASES[i];
 return {id,label,icon,fraction:f,full:i===4,untilFull:Math.round(mod(moon.fullAt-minutes,cyc)),untilNew:Math.round(mod(moon.fullAt+cyc/2-minutes,cyc))};}
function moons(wt,minutes){return (wt?.moons||[]).map(m=>({name:m.name,cycle:m.cycle,...moonPhase(m,minutes??wt.minutes)}));}
// Pleines lunes atteintes entre deux instants (exclu, inclus) : [{name, count}].
function fullMoonsBetween(wt,before,after){const out=[];for(const m of wt?.moons||[]){const cyc=m.cycle*DAY;const k0=Math.floor((before-m.fullAt)/cyc)+1;let count=0;for(let k=k0;m.fullAt+k*cyc<=after&&count<1000;k++)if(m.fullAt+k*cyc>before)count++;if(count)out.push({name:m.name,count});}return out;}
// Réglage : jusqu’à trois lunes ; « next » = nombre de jours avant la prochaine pleine lune (0 = maintenant).
function setMoons(s,list){const wt=get(s);if(!Array.isArray(list))fail('Liste de lunes invalide.');const rows=list.filter(m=>String(m?.name??'').trim());if(rows.length>MAX_MOONS)fail('Trois lunes au maximum.');
 wt.moons=rows.map((m,i)=>{const name=txt(m.name,'Nom de la lune '+(i+1),30,true);const cycle=Math.round(Number(m.cycle)*100)/100;if(!Number.isFinite(cycle)||cycle<1||cycle>1000)fail(name+' : cycle de 1 à 1000 jours.');
  const next=Number(m.next??0);if(!Number.isFinite(next)||next<0||next>cycle)fail(name+' : prochaine pleine lune entre 0 et '+cycle+' jours.');return {name,cycle,fullAt:Math.round(wt.minutes+next*DAY)};});
 if(!wt.moons.length)delete wt.moons;return wt.moons||[];}
function eventAdd(s,id,v){const wt=get(s);if(wt.events.length>=MAX_EVENTS)fail('Maximum '+MAX_EVENTS+' événements.');const at=join(wt,{year:Number(v?.year),month:Number(v?.month),day:Number(v?.day),hour:Number(v?.hour??0),minute:Number(v?.minute??0)});
 const e={id,title:txt(v?.title,'Titre',90,true),note:txt(v?.note??'','Note',300,false),shared:v?.shared===true,at,done:false,reached:at<=wt.minutes};wt.events.push(e);wt.events.sort((a,b)=>a.at-b.at);return e;}
function eventRemove(s,id){const wt=get(s);const i=wt.events.findIndex(e=>e.id===id);if(i<0)fail('Événement introuvable.');wt.events.splice(i,1);}
function eventDone(s,id,done){const wt=get(s);const e=wt.events.find(x=>x.id===id);if(!e)fail('Événement introuvable.');e.done=done!==false;if(e.done&&!e.reachedAt)e.reachedAt=new Date().toISOString();return e;}
function projected(s){const wt=s.worldTime;if(!wt||!wt.enabled)return null;return {enabled:true,minutes:wt.minutes,year:wt.year,era:wt.era,months:wt.months.map(m=>({...m})),moons:(wt.moons||[]).map(m=>({...m})),events:wt.events.filter(e=>e.shared).map(e=>({id:e.id,title:e.title,note:e.note,at:e.at,done:e.done,reached:e.reached,reachedAt:e.reachedAt,shared:true}))};}
return {PHASES,MAX_MOONS,moonPhase,moons,fullMoonsBetween,setMoons,PRESETS,DAY,MAX_EVENTS,defaults,yearLength,split,join,season,dayPart,format,duration,get,advance,setDate,setCalendar,eventAdd,eventRemove,eventDone,projected};
});
