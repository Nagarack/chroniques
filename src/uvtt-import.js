/* Chroniques — import d’une carte au format Universal VTT (« .dd2vtt » de Dungeondraft, « .uvtt » d’autres logiciels) (5.21).
   Le fichier est seulement LU comme des données JSON : image de fond (base64), taille en cases, murs (line_of_sight)
   et portes (portals). Rien n’est exécuté. Les coordonnées du fichier sont en cases ; Chroniques range murs et portes
   sur 0–1000 par axe. Les sources de lumière fixes du fichier ne sont pas reprises : Chroniques gère la lumière
   portée par les jetons et l’éclairage général de la carte. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesUvtt=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAX_WALLS=500;
function fail(m){const e=new Error(m);e.status=400;throw e;}
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:NaN;};
function isUvtt(d){return Boolean(d&&typeof d==='object'&&!Array.isArray(d)&&d.resolution&&typeof d.resolution==='object'&&d.resolution.map_size&&(Array.isArray(d.line_of_sight)||Array.isArray(d.portals)||typeof d.image==='string'));}
// Type de l’image d’après ses premiers octets encodés.
function imageMime(b64){const s=String(b64||'').slice(0,16);if(s.startsWith('iVBORw0KGgo'))return 'image/png';if(s.startsWith('UklGR'))return 'image/webp';if(s.startsWith('/9j/'))return 'image/jpeg';return '';}
// Retire les points intermédiaires alignés (les murs dessinés finement en contiennent beaucoup).
function simplify(pts){if(pts.length<3)return pts;const out=[pts[0]];for(let i=1;i<pts.length-1;i++){const a=out[out.length-1],b=pts[i],c=pts[i+1];
 const cross=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);const len=Math.hypot(c.x-a.x,c.y-a.y)||1;if(Math.abs(cross)/len>0.02)out.push(b);}out.push(pts[pts.length-1]);return out;}
function convert(d){if(!isUvtt(d))fail('Ce fichier n’est pas une carte Universal VTT (.dd2vtt ou .uvtt).');
 const size=d.resolution.map_size||{},org=d.resolution.map_origin||{x:0,y:0};const W=num(size.x),H=num(size.y),ox=num(org.x)||0,oy=num(org.y)||0;
 if(!(W>0&&H>0&&W<=500&&H<=500))fail('Taille de carte invalide dans le fichier.');
 const P=p=>{const x=num(p?.x),y=num(p?.y);if(!Number.isFinite(x)||!Number.isFinite(y))return null;return {x:Math.max(0,Math.min(1000,Math.round((x-ox)/W*1000))),y:Math.max(0,Math.min(1000,Math.round((y-oy)/H*1000)))};};
 const walls=[],warnings=[];let dropped=0;
 const lines=[...(Array.isArray(d.line_of_sight)?d.line_of_sight:[]),...(Array.isArray(d.objects_line_of_sight)?d.objects_line_of_sight:[])];
 for(const line of lines){if(!Array.isArray(line))continue;const pts=simplify(line.map(P).filter(Boolean).filter((p,i,a)=>i===0||p.x!==a[i-1].x||p.y!==a[i-1].y));
  for(let i=1;i<pts.length;i++){if(walls.length>=MAX_WALLS){dropped++;continue;}walls.push({x1:pts[i-1].x,y1:pts[i-1].y,x2:pts[i].x,y2:pts[i].y,door:false,open:false});}}
 let doors=0;for(const pt of Array.isArray(d.portals)?d.portals:[]){const b=Array.isArray(pt?.bounds)?pt.bounds.map(P).filter(Boolean):[];if(b.length<2||(b[0].x===b[1].x&&b[0].y===b[1].y))continue;
  if(walls.length>=MAX_WALLS){dropped++;continue;}walls.push({x1:b[0].x,y1:b[0].y,x2:b[1].x,y2:b[1].y,door:true,open:pt.closed===false});doors++;}
 if(dropped)warnings.push(`${dropped} murs au-delà de ${MAX_WALLS} ignorés : simplifiez les murs dans Dungeondraft si besoin.`);
 const lights=Array.isArray(d.lights)?d.lights.length:0;if(lights)warnings.push(lights>1?`${lights} sources de lumière fixes non reprises (Chroniques éclaire par les jetons et l’éclairage de la carte).`:'1 source de lumière fixe non reprise (Chroniques éclaire par les jetons et l’éclairage de la carte).');
 const cells=Math.round(W);const grid=cells>=4&&cells<=80?cells:0;if(!grid)warnings.push(`Grille de ${cells} cases en largeur : hors des limites de Chroniques (4 à 80), carte importée sans grille.`);
 const image=typeof d.image==='string'&&/^[A-Za-z0-9+/=\s]+$/.test(d.image.slice(0,200))?d.image.replace(/\s+/g,''):'';const mime=imageMime(image);if(!image||!mime)warnings.push('Image de fond absente ou illisible : ajoutez-la ensuite à la main.');
 return {cells:grid,widthCells:W,heightCells:H,walls,doors,lights,image:mime?image:'',mime,warnings};}
return {MAX_WALLS,isUvtt,convert,imageMime,simplify};
});
