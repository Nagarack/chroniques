'use strict';
(function(){
var A=window.ChroniquesAndroid;var info={};try{info=JSON.parse(A?A.info():'{}');}catch(e){}
// 5.2 : anglais si l'application (ou le téléphone) n'est pas en français.
var EN=(info.lang||String(navigator.language||'fr').slice(0,2))!=='fr';var L=function(fr,en){return EN?en:fr;};
if(EN){document.documentElement.lang='en';var T={'.sub':'Your campaign’s table, in your pocket.','#t-connect':'Connect to the GM’s server','label[for=url]':'Server address','#go':'Sign in','.hint':'It is the same address as the website, the one your GM sent you with the invitation (it usually starts with <b>https://</b>). You then sign in with your Chroniques account, as on the website.','#t-known':'Servers already used'};
 for(var k in T){var el=document.querySelector(k);if(el)el.innerHTML=T[k];}}
var f=document.getElementById('f'),url=document.getElementById('url'),err=document.getElementById('err'),go=document.getElementById('go');
document.getElementById('foot').textContent=L('Application ','App ')+(info.version||'')+L(' · interface intégrée ',' · built-in interface ')+(info.bundle||'—');
var known=info.known||[];var list=document.getElementById('known');
if(known.length){document.getElementById('known-card').hidden=false;
 known.forEach(function(u){var li=document.createElement('li');var o=document.createElement('button');o.className='open';o.type='button';o.textContent=u;o.onclick=function(){A.open(u);};
  var x=document.createElement('button');x.className='forget';x.type='button';x.textContent='✕';x.setAttribute('aria-label',L('Oublier ','Forget ')+u);x.onclick=function(){A.forget(u);li.remove();if(!list.children.length)document.getElementById('known-card').hidden=true;};
  li.appendChild(o);li.appendChild(x);list.appendChild(li);});
 url.value=known[0];}
f.addEventListener('submit',function(e){e.preventDefault();err.textContent='';go.disabled=true;go.textContent=L('Connexion…','Connecting…');
 setTimeout(function(){var r=A?A.connect(url.value):L('Application indisponible.','App unavailable.');go.disabled=false;go.textContent=L('Se connecter','Sign in');if(r)err.textContent=r;},30);});
})();
