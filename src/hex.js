/* Chroniques — grille hexagonale (5.5), hexagones à côtés plats en « colonnes décalées » (odd-q).
   Coordonnées de carte : x de 0 à 1000 sur la largeur, y de 0 à 1000 sur la hauteur ; `ratio` = largeur / hauteur.
   Les calculs se font dans un repère isotrope (x, y / ratio), puis reviennent en coordonnées de carte. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesHex=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const S3=Math.sqrt(3);
// Rayon d’un hexagone pour `cols` colonnes sur 1000 unités de large.
function size(cols){return 1000/(1.5*cols+0.5);}
function rows(cols,ratio){const s=size(cols);return Math.max(1,Math.ceil((1000/(ratio||1))/(S3*s)));}
function center(q,r,cols,ratio){const s=size(cols);const x=s+1.5*s*q;const yi=S3*s*(r+0.5*(q&1))+S3*s/2;return {x,y:yi*(ratio||1)};}
function corners(q,r,cols,ratio){const s=size(cols);const c=center(q,r,cols,ratio);const k=ratio||1;const out=[];for(let i=0;i<6;i++){const a=Math.PI/3*i;out.push([c.x+s*Math.cos(a),c.y+s*Math.sin(a)*k]);}return out;}
const toCube=(q,r)=>{const x=q,z=r-(q-(q&1))/2;return {x,y:-x-z,z};};
const fromCube=c=>({q:c.x,r:c.z+(c.x-(c.x&1))/2});
function round(c){let rx=Math.round(c.x),ry=Math.round(c.y),rz=Math.round(c.z);const dx=Math.abs(rx-c.x),dy=Math.abs(ry-c.y),dz=Math.abs(rz-c.z);if(dx>dy&&dx>dz)rx=-ry-rz;else if(dy>dz)ry=-rx-rz;else rz=-rx-ry;return {x:rx,y:ry,z:rz};}
// Hexagone sous un point de la carte.
function fromPoint(px,py,cols,ratio){const s=size(cols);const x=px-s,y=py/(ratio||1)-S3*s/2;const qf=(2/3*x)/s,rf=(-1/3*x+S3/3*y)/s;const c=round({x:qf,y:-qf-rf,z:rf});return fromCube(c);}
function distance(a,b){const A=toCube(a.q,a.r),B=toCube(b.q,b.r);return Math.max(Math.abs(A.x-B.x),Math.abs(A.y-B.y),Math.abs(A.z-B.z));}
function line(a,b){const n=distance(a,b);const A=toCube(a.q,a.r),B=toCube(b.q,b.r);const out=[];for(let i=0;i<=n;i++){const t=n?i/n:0;out.push(fromCube(round({x:A.x+(B.x-A.x)*t+1e-6,y:A.y+(B.y-A.y)*t+1e-6,z:A.z+(B.z-A.z)*t-2e-6})));}return out;}
const key=h=>h.q+','+h.r;
function parse(k){const m=/^(-?\d{1,3}),(-?\d{1,3})$/.exec(String(k||''));return m?{q:Number(m[1]),r:Number(m[2])}:null;}
// Taille d’un hexagone en kilomètres d’après l’échelle saisie (« 10 km », « 6 miles », « 1 lieue » = 4 km).
function km(scale){const m=/([\d]+(?:[.,]\d+)?)\s*(km|kilom[eè]tres?|mi|miles?|lieues?)?/i.exec(String(scale||''));if(!m)return null;const v=Number(m[1].replace(',','.'));if(!(v>0))return null;const u=(m[2]||'km').toLowerCase();return u.startsWith('mi')?Math.round(v*1.609*100)/100:u.startsWith('lieue')?v*4:v;}
return {size,rows,center,corners,fromPoint,distance,line,key,parse,km};
});
