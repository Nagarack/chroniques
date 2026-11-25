/* Chroniques — prochaine séance au format iCalendar (.ics), pour Google Agenda, l’agenda de l’iPhone, Outlook… (5.4)
   Les dates de séance sont en heure locale de la table (« AAAA-MM-JJTHH:MM ») : elles sont écrites en heure « flottante »,
   que chaque agenda place dans le fuseau de l’appareil. */
'use strict';
const esc=t=>String(t==null?'':t).replace(/\\/g,'\\\\').replace(/;/g,'\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');
// Lignes de 75 octets au plus (RFC 5545), coupées sans casser un caractère.
function fold(line){const out=[];let cur='',bytes=0;for(const ch of line){const n=Buffer.byteLength(ch);if(bytes+n>(out.length?74:75)){out.push(cur);cur='';bytes=0;}cur+=ch;bytes+=n;}out.push(cur);return out.join('\r\n ');}
const local=at=>String(at).replace(/[-:]/g,'').slice(0,13)+'00';
function addHours(at,h){const [d,t]=String(at).split('T');const [Y,M,D]=d.split('-').map(Number);const [hh,mm]=t.split(':').map(Number);const x=new Date(Date.UTC(Y,M-1,D,hh,mm)+h*3600000);
 const p=n=>String(n).padStart(2,'0');return x.getUTCFullYear()+p(x.getUTCMonth()+1)+p(x.getUTCDate())+'T'+p(x.getUTCHours())+p(x.getUTCMinutes())+'00';}
function stamp(now){return new Date(now||Date.now()).toISOString().replace(/[-:]/g,'').replace(/\.\d+/,'');}
/* Calendrier de la séance fixée. opts : {title, hours, lang, url, now, campaignId}. Renvoie null si aucune séance n’est fixée. */
function build(state,opts={}){const sc=state&&state.schedule;const o=sc&&sc.chosen&&(sc.options||[]).find(x=>x.id===sc.chosen);if(!o)return null;
 const en=opts.lang==='en';const hours=Math.min(12,Math.max(1,Number(opts.hours)||4));const title=String(opts.title||state.title||'Chroniques');
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Chroniques//Seances//FR','CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',
  'UID:'+esc(o.id+'-'+(opts.campaignId||'campagne'))+'@chroniques','DTSTAMP:'+stamp(opts.now),'DTSTART:'+local(o.at),'DTEND:'+addHours(o.at,hours),
  'SUMMARY:'+esc((en?'D&D session · ':'Séance de D&D · ')+title),
  'DESCRIPTION:'+esc([o.note,en?'Campaign: '+title:'Campagne : '+title,opts.url?(en?'Open Chroniques: ':'Ouvrir Chroniques : ')+opts.url:''].filter(Boolean).join('\n')),
  ...(opts.url?['URL:'+esc(opts.url)]:[]),'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+esc(en?'D&D session in 2 hours':'Séance de D&D dans 2 heures'),'TRIGGER:-PT2H','END:VALARM','END:VEVENT','END:VCALENDAR'];
 return lines.map(fold).join('\r\n')+'\r\n';}
module.exports={build,fold,esc};
