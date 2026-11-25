'use strict';
(function(){
var A=window.ChroniquesAndroid;var info={};try{info=JSON.parse(A?A.info():'{}');}catch(e){}
var f=document.getElementById('f'),url=document.getElementById('url'),err=document.getElementById('err'),go=document.getElementById('go');
document.getElementById('foot').textContent='Application '+(info.version||'')+' · interface intégrée '+(info.bundle||'—');
var known=info.known||[];var list=document.getElementById('known');
if(known.length){document.getElementById('known-card').hidden=false;
 known.forEach(function(u){var li=document.createElement('li');var o=document.createElement('button');o.className='open';o.type='button';o.textContent=u;o.onclick=function(){A.open(u);};
  var x=document.createElement('button');x.className='forget';x.type='button';x.textContent='✕';x.setAttribute('aria-label','Oublier '+u);x.onclick=function(){A.forget(u);li.remove();if(!list.children.length)document.getElementById('known-card').hidden=true;};
  li.appendChild(o);li.appendChild(x);list.appendChild(li);});
 url.value=known[0];}
f.addEventListener('submit',function(e){e.preventDefault();err.textContent='';go.disabled=true;go.textContent='Connexion…';
 setTimeout(function(){var r=A?A.connect(url.value):'Application indisponible.';go.disabled=false;go.textContent='Se connecter';if(r)err.textContent=r;},30);});
})();
