/* Chroniques — organisation des séances : le MJ propose des dates, chaque joueur répond pour son personnage,
   le MJ fixe la prochaine séance (affichée à tous). Dates locales « AAAA-MM-JJTHH:MM » (heure de la table). */
'use strict';
const MAX_OPTIONS=10,ANSWERS=['yes','maybe','no'];
function fail(m){const e=new Error(m);e.status=400;throw e;}
function get(s){if(!s.schedule||typeof s.schedule!=='object'||Array.isArray(s.schedule))s.schedule={options:[],answers:{},chosen:null};if(!Array.isArray(s.schedule.options))s.schedule.options=[];if(!s.schedule.answers||typeof s.schedule.answers!=='object')s.schedule.answers={};return s.schedule;}
function checkDate(v){const t=String(v||'');if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(t)||Number.isNaN(Date.parse(t)))fail('Date invalide (jour et heure attendus).');return t;}
function add(s,id,v){const sc=get(s);if(sc.options.length>=MAX_OPTIONS)fail('Maximum '+MAX_OPTIONS+' dates proposées.');const at=checkDate(v?.at);if(sc.options.some(o=>o.at===at))fail('Cette date est déjà proposée.');
 const note=String(v?.note??'').replace(/[\u0000-\u001f]/g,' ').trim();if(note.length>120)fail('Note : 120 caractères maximum.');const o={id,at,note};sc.options.push(o);sc.options.sort((a,b)=>a.at.localeCompare(b.at));return o;}
function remove(s,id){const sc=get(s),i=sc.options.findIndex(o=>o.id===id);if(i<0)fail('Date introuvable.');sc.options.splice(i,1);for(const a of Object.values(sc.answers))delete a[id];if(sc.chosen===id)sc.chosen=null;}
function answer(s,charId,optionId,value){const sc=get(s);if(!sc.options.some(o=>o.id===optionId))fail('Date introuvable.');if(!ANSWERS.includes(value))fail('Réponse invalide.');sc.answers[charId]={...(sc.answers[charId]||{}),[optionId]:value};}
function choose(s,optionId){const sc=get(s);if(optionId!==null&&!sc.options.some(o=>o.id===optionId))fail('Date introuvable.');sc.chosen=optionId;}
function clear(s){s.schedule={options:[],answers:{},chosen:null};}
function next(s){const sc=s.schedule;if(!sc||!sc.chosen)return null;return (sc.options||[]).find(o=>o.id===sc.chosen)||null;}
function tally(s,optionId){const out={yes:0,maybe:0,no:0,missing:0};for(const p of s.characters||[]){const v=s.schedule?.answers?.[p.id]?.[optionId];if(v)out[v]++;else out.missing++;}return out;}
module.exports={MAX_OPTIONS,ANSWERS,get,add,remove,answer,choose,clear,next,tally};
