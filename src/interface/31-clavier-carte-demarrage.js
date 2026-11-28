// ——— 31 · Clavier, outils de carte, démarrage ———
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.getElementById('term-pop')){const b=document.querySelector('.term[aria-expanded="true"]');closeTerm();b?.focus();return;}});
window.addEventListener?.('scroll',()=>{if(document.getElementById('term-pop'))closeTerm();},{passive:true});
document.addEventListener('keydown',event=>{if(event.key!=='Tab'||!modal)return;const box=document.querySelector('#modal-root .modal');if(!box)return;const f=[...box.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')].filter(x=>x.offsetParent!==null);if(!f.length)return;const first=f[0],last=f[f.length-1];if(!box.contains(document.activeElement)){event.preventDefault();first.focus();}else if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}});
document.addEventListener('keydown',event=>{const t=event.target;if((event.key==='Enter'||event.key===' ')&&t&&t.getAttribute&&t.getAttribute('role')==='button'&&t.tagName!=='BUTTON'){event.preventDefault();t.click();}});
document.addEventListener('keydown',event=>{
 if(!mobileMore)return;
 const sheet=document.querySelector('.mobile-more-sheet');
 if(!sheet)return;
 if(event.key==='Escape'){
  event.preventDefault();mobileMore=false;render();document.querySelector('[data-menu="toggle"]')?.focus();return;
 }
 if(event.key!=='Tab')return;
 const focusable=[...sheet.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled])')];
 if(!focusable.length)return;
 const first=focusable[0],last=focusable[focusable.length-1];
 if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
 else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
});
// --- Cartes : glisser-déposer des jetons (souris, doigt ou stylet) ---
// Distance au format 2024 : chaque case compte, diagonales comprises (le plus grand écart en cases).
function measureUpdate(e){const d=measureDrag;if(!d)return;const x1=e.clientX-d.r.left,y1=e.clientY-d.r.top;const cell=d.r.width/d.map.grid.cells;const cases=Math.max(Math.round(Math.abs(x1-d.x0)/cell),Math.round(Math.abs(y1-d.y0)/cell));const m=Math.round(cases*metersPerCell(d.map)*10)/10;
 const [line,dot,label]=d.svg.children;line.setAttribute('x1',d.x0);line.setAttribute('y1',d.y0);line.setAttribute('x2',x1);line.setAttribute('y2',y1);dot.setAttribute('cx',d.x0);dot.setAttribute('cy',d.y0);
 label.setAttribute('x',x1+10);label.setAttribute('y',y1-10);label.textContent=cases+' case'+(cases>1?'s':'')+' · '+String(m).replace('.',',')+' m';}
function drawPoint(e){const d=drawDrag;const x=Math.round(Math.max(0,Math.min(1,(e.clientX-d.r.left)/d.r.width))*1000),y=Math.round(Math.max(0,Math.min(1,(e.clientY-d.r.top)/d.r.height))*1000);const n=d.pts.length;
 if(n&&Math.abs(d.pts[n-2]-x)+Math.abs(d.pts[n-1]-y)<4)return;d.pts.push(x,y);const show=drawKind==='arrow'&&d.pts.length>2?[...d.pts.slice(0,2),...d.pts.slice(-2)]:d.pts;let s='';for(let i=0;i<show.length;i+=2)s+=show[i]+','+show[i+1]+' ';d.svg.firstChild.setAttribute('points',s.trim());}
function mapSelectedOrFirst(){const list=Array.isArray(state.maps)?state.maps:[];return (list.find(m=>m.id===mapSelectedId)||list[0]||{}).id||'';}
if(typeof document!=='undefined'&&typeof document.addEventListener==='function'){
 document.addEventListener('load',e=>{const img=e.target;if(!img||!img.dataset||!img.dataset.mapImage||!img.naturalWidth)return;const r=img.naturalWidth/img.naturalHeight,id=img.dataset.mapImage;if(Math.abs((mapAspect[id]||0)-r)>0.001){mapAspect[id]=r;const m=(state.maps||[]).find(x=>x.id===id);if(m&&((m.fog&&m.fog.enabled)||(m.areas||[]).length))render();}},true);
 // 5.8 : dessin à main levée (ou flèche) sur la carte ; points en 0–1000, simplifiés avant l’envoi.
 document.addEventListener('toggle',e=>{if(e.target?.matches?.('[data-jump-panel]'))jumpOpen=e.target.open;},true);
 document.addEventListener('input',e=>{if(e.target?.matches?.('[data-fall-height]')){fallHeight=e.target.value;render();}});
 // 5.11 : appui long sur la carte = signal pour toute la table.
 document.addEventListener('pointerdown',e=>{if(['draw','measure','ping'].includes(mapTool)||e.button>0)return;const stage=e.target.closest&&e.target.closest('[data-map-canvas]');if(!stage||e.target.closest('button'))return;clearTimeout(pingHold?.t);
  pingHold={x:e.clientX,y:e.clientY,t:setTimeout(()=>{pingHoldAt=Date.now();pingHold=null;sendPing(stage,e.clientX,e.clientY);},600)};});
 document.addEventListener('pointermove',e=>{if(pingHold&&Math.hypot(e.clientX-pingHold.x,e.clientY-pingHold.y)>10){clearTimeout(pingHold.t);pingHold=null;}});
 for(const ev of ['pointerup','pointercancel'])document.addEventListener(ev,()=>{if(pingHold){clearTimeout(pingHold.t);pingHold=null;}});
 document.addEventListener('pointerdown',e=>{if(mapTool!=='draw'||e.button>0)return;const stage=e.target.closest&&e.target.closest('[data-map-canvas]');if(!stage)return;e.preventDefault();const r=stage.getBoundingClientRect();if(!r.width)return;
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','map-drawings map-drawing-live');svg.setAttribute('viewBox','0 0 1000 1000');svg.setAttribute('preserveAspectRatio','none');svg.innerHTML=`<polyline stroke="${mapFill(DRAW_FILL,drawColor)}" vector-effect="non-scaling-stroke"/>`;stage.appendChild(svg);
  drawDrag={stage,r,svg,map:stage.dataset.mapCanvas,pts:[]};try{stage.setPointerCapture(e.pointerId);}catch{}drawPoint(e);},true);
 document.addEventListener('pointermove',e=>{if(drawDrag)drawPoint(e);});
 document.addEventListener('pointerup',()=>{if(!drawDrag)return;const d=drawDrag;drawDrag=null;let pts=d.pts;if(drawKind==='arrow')pts=[...pts.slice(0,2),...pts.slice(-2)];
  if(pts.length>=4&&(Math.abs(pts[0]-pts[pts.length-2])+Math.abs(pts[1]-pts[pts.length-1])>8||pts.length>8)){if(pts.length>600){const step=Math.ceil(pts.length/600);const out=[];for(let i=0;i<pts.length;i+=2*step)out.push(pts[i],pts[i+1]);out.push(pts[pts.length-2],pts[pts.length-1]);pts=out.slice(0,600);}
   act('mapDrawAdd',{id:d.map,values:{kind:drawKind,color:drawColor,pts}}).finally(()=>d.svg.remove());}else d.svg.remove();});
 document.addEventListener('pointerdown',e=>{if(mapTool!=='measure'||e.button>0)return;const stage=e.target.closest&&e.target.closest('[data-map-canvas]');if(!stage)return;const map=(state.maps||[]).find(m=>m.id===stage.dataset.mapCanvas);if(!map?.grid?.cells)return;
  e.preventDefault();stage.querySelector('.map-measure')?.remove();const r=stage.getBoundingClientRect();const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','map-measure');svg.setAttribute('viewBox','0 0 '+r.width+' '+r.height);svg.innerHTML='<line/><circle r="5"/><text></text>';stage.appendChild(svg);
  measureDrag={stage,map,svg,x0:e.clientX-r.left,y0:e.clientY-r.top,r};try{stage.setPointerCapture(e.pointerId);}catch{}measureUpdate(e);},true);
 document.addEventListener('pointermove',e=>{if(measureDrag)measureUpdate(e);});
 document.addEventListener('pointerup',()=>{measureDrag=null;});
 document.addEventListener('pointerdown',e=>{if(mapTool==='measure'||mapTool==='draw')return;const el=e.target.closest&&e.target.closest('.map-token[data-movable="1"]');if(!el||e.button>0)return;const stage=el.closest('[data-map-canvas]');if(!stage)return;
  tokenDrag={id:el.dataset.mapToken,el,stage,mapId:stage.dataset.mapCanvas,startX:e.clientX,startY:e.clientY,moved:false};try{el.setPointerCapture(e.pointerId);}catch{}el.classList.add('dragging');e.preventDefault();});
 document.addEventListener('pointermove',e=>{if(!tokenDrag)return;const d=tokenDrag,r=d.stage.getBoundingClientRect();if(Math.abs(e.clientX-d.startX)+Math.abs(e.clientY-d.startY)>4)d.moved=true;if(!d.moved)return;
  d.el.style.left=(Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*100)+'%';d.el.style.top=(Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))*100)+'%';});
 const endDrag=e=>{if(!tokenDrag)return;const d=tokenDrag;tokenDrag=null;d.el.classList.remove('dragging');
  if(!d.moved||e.type==='pointercancel'){if(renderPending)render();return;}suppressTokenClick=true;setTimeout(()=>{suppressTokenClick=false;},300);
  const r=d.stage.getBoundingClientRect();let x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*1000,y=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))*1000;
  const map=(state.maps||[]).find(m=>m.id===d.mapId),cells=Number(map?.grid?.cells)||0;if(cells){const cw=1000/cells,ch=cw*(r.width/r.height);x=(Math.floor(x/cw)+.5)*cw;y=(Math.floor(y/ch)+.5)*ch;}
  x=Math.round(Math.max(0,Math.min(1000,x)));y=Math.round(Math.max(0,Math.min(1000,y)));d.el.style.left=x/10+'%';d.el.style.top=y/10+'%';
  act('mapTokenMove',{id:d.mapId,tokenId:d.id,x,y});};
 document.addEventListener('pointerup',endDrag);document.addEventListener('pointercancel',endDrag);
}
// 5.19 : chaque demi-minute, met à jour la durée de séance affichée et fait apparaître le rappel de pause quand il est dû.
// (Un nouveau rendu plutôt qu’une simple modification du texte : la traduction anglaise s’applique au rendu.)
let clockMinute=null;
if(typeof window!=='undefined'&&typeof setInterval==='function'){const tick=setInterval(()=>{if(!state||actor!=='mj'||typeof document==='undefined')return;const m=sessionMinutes();
 const chipStale=!!document.querySelector('[data-session-clock]')&&m!==clockMinute;clockMinute=m;if(chipStale||!!document.querySelector('.pause-reminder')!==pauseDue())render();},30000);tick?.unref?.();}
bootstrap();
})();
