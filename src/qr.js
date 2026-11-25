/* Chroniques — générateur de QR code autonome (mode octet, correction d'erreur M, versions 1 à 10).
   Aucune dépendance, aucun appel réseau : utilisé pour afficher les liens d'invitation à scanner.
   Référence : norme ISO/IEC 18004. Vérifié dans les tests avec un décodeur indépendant (OpenCV). */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesQR=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
// Niveau M : [codes de correction par bloc, [nombre de blocs, octets de données par bloc]...]
const BLOCKS_M=[null,
 [10,[1,16]],[16,[1,28]],[26,[1,44]],[18,[2,32]],[24,[2,43]],
 [16,[4,27]],[18,[4,31]],[22,[2,38],[2,39]],[22,[3,36],[2,37]],[26,[4,43],[1,44]]];
const ALIGN=[null,[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50]];
const REMAINDER=[0,0,7,7,7,7,7,0,0,0,0];

// Arithmétique dans GF(256), polynôme primitif 0x11D.
const EXP=new Array(512),LOG=new Array(256);
(function(){let x=1;for(let i=0;i<255;i++){EXP[i]=x;LOG[x]=i;x<<=1;if(x&0x100)x^=0x11D;}for(let i=255;i<512;i++)EXP[i]=EXP[i-255];})();
const mul=(a,b)=>a&&b?EXP[LOG[a]+LOG[b]]:0;
function generator(n){let g=[1];for(let i=0;i<n;i++){const next=new Array(g.length+1).fill(0);for(let j=0;j<g.length;j++){next[j]^=g[j];next[j+1]^=mul(g[j],EXP[i]);}g=next;}return g;}
function reedSolomon(data,n){const g=generator(n),res=new Array(n).fill(0);for(const b of data){const f=b^res[0];res.shift();res.push(0);for(let i=0;i<n;i++)res[i]^=mul(g[i+1],f);}return res;}

function utf8(text){return Array.from(new TextEncoder().encode(String(text)));}
function dataCapacity(v){const [,...groups]=BLOCKS_M[v];return groups.reduce((n,[count,size])=>n+count*size,0);}
function pickVersion(len){for(let v=1;v<=10;v++){const bits=4+(v<10?8:16)+8*len;if(bits<=dataCapacity(v)*8)return v;}throw new Error('Texte trop long pour un QR code (maximum environ 210 caractères).');}

function encodeData(bytes,v){
 const cap=dataCapacity(v)*8,bits=[];
 const push=(val,len)=>{for(let i=len-1;i>=0;i--)bits.push((val>>>i)&1);};
 push(0b0100,4);push(bytes.length,v<10?8:16);for(const b of bytes)push(b,8);
 push(0,Math.min(4,cap-bits.length));while(bits.length%8)bits.push(0);
 const out=[];for(let i=0;i<bits.length;i+=8)out.push(bits.slice(i,i+8).reduce((a,b)=>(a<<1)|b,0));
 for(let pad=0xEC;out.length<cap/8;pad^=0xEC^0x11)out.push(pad);
 return out;
}
function interleave(data,v){
 const [ec,...groups]=BLOCKS_M[v],blocks=[];let k=0;
 for(const [count,size] of groups)for(let i=0;i<count;i++){const d=data.slice(k,k+size);k+=size;blocks.push({d,e:reedSolomon(d,ec)});}
 const out=[],maxD=Math.max(...blocks.map(b=>b.d.length));
 for(let i=0;i<maxD;i++)for(const b of blocks)if(i<b.d.length)out.push(b.d[i]);
 for(let i=0;i<ec;i++)for(const b of blocks)out.push(b.e[i]);
 return out;
}

function build(v,codewords,mask){
 const size=17+4*v,m=[],fn=[];
 for(let y=0;y<size;y++){m.push(new Array(size).fill(false));fn.push(new Array(size).fill(false));}
 const set=(x,y,dark)=>{m[y][x]=dark;fn[y][x]=true;};
 const finder=(cx,cy)=>{for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const x=cx+dx,y=cy+dy;if(x<0||y<0||x>=size||y>=size)continue;const d=Math.max(Math.abs(dx),Math.abs(dy));set(x,y,d!==2&&d!==4);}};
 finder(3,3);finder(size-4,3);finder(3,size-4);
 for(let i=0;i<size;i++){if(!fn[6][i])set(i,6,i%2===0);if(!fn[i][6])set(6,i,i%2===0);}
 const al=ALIGN[v];
 for(const ay of al)for(const ax of al){
  if((ax===6&&ay===6)||(ax===6&&ay===al[al.length-1])||(ax===al[al.length-1]&&ay===6))continue;
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)set(ax+dx,ay+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1);
 }
 // Emplacements réservés (format et version) avant de placer les données.
 const fmt=formatBits(mask);placeFormat(set,size,fmt);
 if(v>=7)placeVersion(set,size,v);
 // Données en zigzag, à partir du coin inférieur droit.
 let i=0;const total=codewords.length*8;
 for(let right=size-1;right>=1;right-=2){
  if(right===6)right=5;
  for(let vert=0;vert<size;vert++)for(let j=0;j<2;j++){
   const x=right-j,upward=((right+1)&2)===0,y=upward?size-1-vert:vert;
   if(!fn[y][x]&&i<total){m[y][x]=((codewords[i>>>3]>>>(7-(i&7)))&1)===1;i++;}
  }
 }
 for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(!fn[y][x]&&maskBit(mask,x,y))m[y][x]=!m[y][x];
 return m;
}
function maskBit(mask,x,y){switch(mask){
 case 0:return (x+y)%2===0;case 1:return y%2===0;case 2:return x%3===0;case 3:return (x+y)%3===0;
 case 4:return (Math.floor(x/3)+Math.floor(y/2))%2===0;case 5:return x*y%2+x*y%3===0;
 case 6:return (x*y%2+x*y%3)%2===0;default:return ((x+y)%2+x*y%3)%2===0;}}
function formatBits(mask){const data=(0<<3)|mask;let rem=data;for(let i=0;i<10;i++)rem=(rem<<1)^((rem>>>9)*0x537);return ((data<<10)|rem)^0x5412;}
function placeFormat(set,size,bits){
 const bit=i=>((bits>>>i)&1)===1;
 for(let i=0;i<=5;i++)set(8,i,bit(i));
 set(8,7,bit(6));set(8,8,bit(7));set(7,8,bit(8));
 for(let i=9;i<15;i++)set(14-i,8,bit(i));
 for(let i=0;i<8;i++)set(size-1-i,8,bit(i));
 for(let i=8;i<15;i++)set(8,size-15+i,bit(i));
 set(8,size-8,true);
}
function placeVersion(set,size,v){
 let rem=v;for(let i=0;i<12;i++)rem=(rem<<1)^((rem>>>11)*0x1F25);
 const bits=(v<<12)|rem;
 for(let i=0;i<18;i++){const dark=((bits>>>i)&1)===1,a=size-11+i%3,b=Math.floor(i/3);set(a,b,dark);set(b,a,dark);}
}
function penalty(m){
 const n=m.length;let score=0;
 const lines=[];for(let i=0;i<n;i++){lines.push(m[i]);lines.push(m.map(r=>r[i]));}
 for(const line of lines){
  let run=1;for(let i=1;i<=n;i++){if(i<n&&line[i]===line[i-1])run++;else{if(run>=5)score+=3+run-5;run=1;}}
  const s=line.map(b=>b?'1':'0').join('');
  for(const pat of ['10111010000','00001011101']){let k=s.indexOf(pat);while(k>=0){score+=40;k=s.indexOf(pat,k+1);}}
 }
 for(let y=0;y<n-1;y++)for(let x=0;x<n-1;x++){const c=m[y][x];if(c===m[y][x+1]&&c===m[y+1][x]&&c===m[y+1][x+1])score+=3;}
 let dark=0;for(const r of m)for(const b of r)if(b)dark++;
 score+=10*Math.floor(Math.abs(dark*100/(n*n)-50)/5);
 return score;
}
function matrix(text){
 const bytes=utf8(text),v=pickVersion(bytes.length),cw=interleave(encodeData(bytes,v),v);
 let best=null,bestScore=Infinity;
 for(let mask=0;mask<8;mask++){const m=build(v,cw,mask),s=penalty(m);if(s<bestScore){best=m;bestScore=s;}}
 return best;
}
function svg(text,{dark='#1d1a16',light='#ffffff',label='QR code'}={}){
 const m=matrix(text),q=4,size=m.length+2*q;let d='';
 for(let y=0;y<m.length;y++)for(let x=0;x<m.length;x++)if(m[y][x])d+=`M${x+q} ${y+q}h1v1h-1z`;
 const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="${esc(label)}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="${esc(light)}"/><path d="${d}" fill="${esc(dark)}"/></svg>`;
}
return {matrix,svg,_test:{reedSolomon,formatBits,pickVersion}};
});
