/* Chroniques — mise en forme légère des textes longs (5.19) : documents, scènes, carnet, indices, résumés.
   Syntaxe volontairement réduite, proche de ce qu’on tape dans un message :
     **gras**   *italique*   - élément de liste (ou « * », « • »)   1. liste numérotée   # Intertitre   > citation
   Sûreté : le texte est d’abord entièrement échappé ; seules les balises produites ici (strong, em, ul, ol, li, h4, blockquote, p, br)
   peuvent apparaître. Aucun lien, aucune image, aucun attribut : impossible d’injecter du HTML ou du script. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChroniquesRichText=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const ESC={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>ESC[c]);
// Mise en forme dans une ligne (le texte est déjà échappé).
function inline(t){return t
 .replace(/\*\*(?=\S)([^*]+?)(?<=\S)\*\*/g,'<strong>$1</strong>')
 .replace(/(^|[\s(«“'’—–-])\*(?=\S)([^*]+?)(?<=\S)\*(?=$|[\s.,;:!?)»”'’—–-])/g,'$1<em>$2</em>')
 .replace(/(^|[\s(«“—–])_(?=\S)([^_]+?)(?<=\S)_(?=$|[\s.,;:!?)»”—–])/g,'$1<em>$2</em>');}
const UL=/^\s*[-*•]\s+(.*)$/,OL=/^\s*(\d{1,3})[.)]\s+(.*)$/,H=/^\s*#{1,3}\s+(.*)$/,Q=/^\s*&gt;\s?(.*)$/;
// Texte → HTML sûr. Les paragraphes sont séparés par une ligne vide ; un simple retour à la ligne reste un retour à la ligne.
function render(text){
 const lines=esc(String(text??'').replace(/\r\n?/g,'\n')).split('\n');const out=[];let para=[],list=null,quote=[];
 const flushPara=()=>{if(para.length){out.push('<p>'+para.map(inline).join('<br>')+'</p>');para=[];}};
 const flushList=()=>{if(list){out.push('<'+list.tag+'>'+list.items.map(x=>'<li>'+inline(x)+'</li>').join('')+'</'+list.tag+'>');list=null;}};
 const flushQuote=()=>{if(quote.length){out.push('<blockquote>'+quote.map(inline).join('<br>')+'</blockquote>');quote=[];}};
 const flush=()=>{flushPara();flushList();flushQuote();};
 for(const raw of lines){const line=raw.replace(/\s+$/,'');let m;
  if(!line.trim()){flush();continue;}
  if((m=H.exec(line))){flush();out.push('<h4 class="rt-h">'+inline(m[1])+'</h4>');continue;}
  if((m=UL.exec(line))&&!/^\s*\*\*/.test(line)){flushPara();flushQuote();if(!list||list.tag!=='ul'){flushList();list={tag:'ul',items:[]};}list.items.push(m[1]);continue;}
  if((m=OL.exec(line))){flushPara();flushQuote();if(!list||list.tag!=='ol'){flushList();list={tag:'ol',items:[]};}list.items.push(m[2]);continue;}
  if((m=Q.exec(line))){flushPara();flushList();quote.push(m[1]);continue;}
  if(list&&/^\s{2,}\S/.test(raw)){list.items[list.items.length-1]+=' '+line.trim();continue;}   // suite d’un élément de liste
  flushList();flushQuote();para.push(line);}
 flush();return out.join('');}
// Le même texte sans les marques de mise en forme : lecture à voix haute, aperçus d’une ligne, recherche.
function plain(text){return String(text??'').replace(/\*\*([^*]+)\*\*/g,'$1').replace(/(^|[\s(«“])[*_](?=\S)([^*_\n]+?)(?<=\S)[*_]/g,'$1$2').replace(/^\s*#{1,3}\s+/gm,'').replace(/^\s*[-*•]\s+/gm,'').replace(/^\s*>\s?/gm,'');}
const HELP='Mise en forme : **gras**, *italique*, « - » en début de ligne pour une liste, « # » pour un intertitre, « > » pour une citation.';
return {render,plain,inline,HELP};
});
