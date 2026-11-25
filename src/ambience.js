/* Chroniques — ambiance sonore : musiques et bruitages déposés par le MJ sur son serveur,
   lancés depuis Chroniques et joués sur l'écran de table (et, au choix, chez les joueurs). */
'use strict';
const MAX_TRACKS=40,MAX_FILE=20*1024*1024,MAX_TOTAL=300*1024*1024;
const FILE=/^audio-[A-Za-z0-9_-]{20,48}\.(mp3|ogg|wav|m4a|webm|flac)$/;
function fail(m,status=400){const e=new Error(m);e.status=status;throw e;}
// Reconnaissance par signature binaire : on ne fait jamais confiance à l'extension ni au type annoncé.
function sniff(buf){if(!Buffer.isBuffer(buf)||buf.length<16)return null;const a=(i,s)=>buf.slice(i,i+s.length).toString('latin1')===s;
 if(a(0,'ID3')||(buf[0]===0xFF&&(buf[1]&0xE0)===0xE0&&(buf[1]&0x06)!==0))return {ext:'mp3',mime:'audio/mpeg'};
 if(a(0,'OggS'))return {ext:'ogg',mime:'audio/ogg'};
 if(a(0,'RIFF')&&a(8,'WAVE'))return {ext:'wav',mime:'audio/wav'};
 if(a(4,'ftyp')&&/^(M4A |M4B |mp42|isom|mp41|dash)/.test(buf.slice(8,12).toString('latin1')))return {ext:'m4a',mime:'audio/mp4'};
 if(buf[0]===0x1A&&buf[1]===0x45&&buf[2]===0xDF&&buf[3]===0xA3)return {ext:'webm',mime:'audio/webm'};
 if(a(0,'fLaC'))return {ext:'flac',mime:'audio/flac'};
 return null;}
function get(s){if(!s.ambience||typeof s.ambience!=='object')s.ambience={tracks:[],playing:null,players:false};if(!Array.isArray(s.ambience.tracks))s.ambience.tracks=[];return s.ambience;}
function cleanName(v){const t=String(v??'').replace(/[\u0000-\u001f]/g,' ').replace(/\.(mp3|ogg|wav|m4a|webm|flac)$/i,'').trim().slice(0,60);return t||'Piste sans titre';}
function add(s,id,info){const am=get(s);if(am.tracks.length>=MAX_TRACKS)fail('Maximum '+MAX_TRACKS+' pistes.');const used=am.tracks.reduce((n,t)=>n+(t.bytes||0),0);if(used+info.bytes>MAX_TOTAL)fail('Espace audio saturé (300 Mo) : supprimez des pistes.');
 const t={id,name:cleanName(info.name),filename:info.filename,mime:info.mime,bytes:info.bytes,loop:info.loop!==false,category:['musique','ambiance','effet'].includes(info.category)?info.category:'ambiance'};am.tracks.push(t);return t;}
function find(s,id){return get(s).tracks.find(t=>t.id===id)||null;}
function update(s,id,v){const t=find(s,id);if(!t)fail('Piste introuvable.');if(v&&'name' in v)t.name=cleanName(v.name);if(v&&'loop' in v)t.loop=v.loop===true;if(v&&'category' in v&&['musique','ambiance','effet'].includes(v.category))t.category=v.category;return t;}
function remove(s,id){const am=get(s);const i=am.tracks.findIndex(t=>t.id===id);if(i<0)fail('Piste introuvable.');const [t]=am.tracks.splice(i,1);if(am.playing?.trackId===id)am.playing=null;return t;}
function play(s,id,volume){const t=find(s,id);if(!t)fail('Piste introuvable.');const v=volume==null?0.7:Number(volume);if(!(v>=0&&v<=1))fail('Volume invalide.');get(s).playing={trackId:id,startedAt:new Date().toISOString(),volume:Math.round(v*100)/100,loop:t.loop,nonce:Math.random().toString(36).slice(2,8)};return get(s).playing;}
function stop(s){get(s).playing=null;}
function volume(s,v){const am=get(s);const n=Number(v);if(!(n>=0&&n<=1))fail('Volume invalide.');if(am.playing)am.playing.volume=Math.round(n*100)/100;}
function setPlayers(s,on){get(s).players=on===true;}
function projected(s){const am=s.ambience;if(!am)return {tracks:[],playing:null,players:false};return {tracks:(am.tracks||[]).map(t=>({id:t.id,name:t.name,loop:t.loop,category:t.category,bytes:t.bytes})),playing:am.playing?{...am.playing}:null,players:!!am.players};}
module.exports={MAX_TRACKS,MAX_FILE,MAX_TOTAL,FILE,sniff,get,add,find,update,remove,play,stop,volume,setPlayers,projected,cleanName};
