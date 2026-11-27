/* Chroniques — choix du thème : automatique par défaut (suit l'appareil), ou clair, ou sombre.
   Chargé dans <head> avant l'affichage pour éviter tout clignotement. */
(function(){
 'use strict';
 var KEY='chroniques-theme',MODES=['dark','light','auto'];
 var LABELS={dark:'Sombre',light:'Clair',auto:'Automatique'};
 function read(){try{var v=localStorage.getItem(KEY);return MODES.indexOf(v)>=0?v:'auto';}catch(e){return 'auto';}}
 function apply(mode){
  var link=document.getElementById('theme-light');
  if(link)link.media=mode==='light'?'all':mode==='auto'?'(prefers-color-scheme: light)':'not all';
  var dark=mode==='dark'||(mode==='auto'&&!(window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches));
  var meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute('content',dark?'#16120e':'#e9e6e0');
  document.documentElement.setAttribute('data-theme',mode);
 }
 var api={
  get:read,label:function(){return LABELS[read()];},
  set:function(mode){if(MODES.indexOf(mode)<0)return;try{localStorage.setItem(KEY,mode);}catch(e){}apply(mode);},
  cycle:function(){var next=MODES[(MODES.indexOf(read())+1)%MODES.length];api.set(next);return next;}
 };
 window.ChroniquesTheme=api;apply(read());
 if(window.matchMedia){var mq=window.matchMedia('(prefers-color-scheme: light)');var h=function(){if(read()==='auto')apply('auto');};if(mq.addEventListener)mq.addEventListener('change',h);}
})();
