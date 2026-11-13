/*
 * Book Builder — a local-first, static-site book creation studio.
 * Copyright (c) 2026 Buildiful. MIT License.
 * Uses browser-native document layout/printing; nothing is uploaded.
 */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const inputs = ['bookTitle','bookAuthor','bookSubtitle','trimSize','paperType','insideMargin','outsideMargin','topMargin','bottomMargin','bodyFont','fontSize','lineHeight','mirrorMargins','chapterBreaks','showPageNumbers','showRunningTitle','coverKicker','coverImprint','backBlurb'];
  const dims = {'6x9':[6,9],'5x8':[5,8],'5.5x8.5':[5.5,8.5],'8.5x11':[8.5,11]};
  const palettes = {
    ink:{bg:'#182d3c',accent:'#debda2',fg:'#fcf9f0',muted:'#c1ccd0',back:'#234051'},
    clay:{bg:'#a65d4d',accent:'#f7d6b2',fg:'#fff9ef',muted:'#f4d7ca',back:'#8d4a43'},
    olive:{bg:'#526851',accent:'#f0d2a0',fg:'#fff9ed',muted:'#d1dec9',back:'#435842'},
    plum:{bg:'#5a4762',accent:'#d9b6c4',fg:'#fff7f1',muted:'#e2d4e1',back:'#4b3855'},
    paper:{bg:'#eee7d6',accent:'#bd704b',fg:'#223a43',muted:'#637b7c',back:'#e3dac9'}
  };
  const sample = `
    <h1>The art of beginning</h1>
    <p>There is a particular kind of magic in making something with your own hands. It begins as a tiny idea, a sketch in the margin of a notebook, or a question that will not leave you alone.</p>
    <p>What if we made space for that curiosity? What if we began before we felt completely ready?</p>
    <p>In this small book, we will find a way to turn a good idea into something real. We will work with what we have, make room for mistakes, and remember that every great beginning was once an experiment.</p>
    <h2>A little encouragement</h2>
    <p>The best projects rarely begin with perfect conditions. They begin with a person who is willing to try. You do not need the fanciest tools, a beautiful studio, or an elaborate plan to take your first step.</p>
    <blockquote>Make the first version. Then make the next one better.</blockquote>
    <p>As you go, take notes. Keep the surprising discoveries. Ask useful questions. Share what you learn with people who might be standing at the same starting line.</p>
    <h1>Make something today</h1>
    <p>Choose one idea that has been patiently waiting for your attention. Give it a name. Write down what it should do, who it might help, and why it matters to you.</p>
    <p>Now make the smallest possible version. A drawing counts. A rough prototype counts. So does a single page of words describing the thing you hope to build.</p>
    <p>Progress is not always dramatic. Often it looks like a quiet afternoon, a notebook full of crossed-out possibilities, and one little decision to keep going.</p>
    <p>Remember: the point is not to create something perfect on the first attempt. The point is to create something that did not exist yesterday.</p>`;
  const state = {theme:'ink',coverArt:null,coverImageInfo:null,pages:[],pageCount:0,previewMode:'interior',timer:null,toastTimer:null,sourceName:'Untitled',busy:false,projectVersion:1};

  function notify(message, ms=4500) { const toast=$('toast'); toast.textContent=message; toast.classList.add('show'); clearTimeout(state.toastTimer); state.toastTimer=setTimeout(()=>toast.classList.remove('show'),ms); }
  function clamp(n,min,max,def){const x=Number(n);return Number.isFinite(x)?Math.max(min,Math.min(max,x)):def;}
  function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));}
  function escapeXml(value){return escapeHtml(value);}
  function slug(value){return String(value || 'book').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'book';}
  function downloadBlob(blob,filename){const url=URL.createObjectURL(blob); const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);}
  function readAsDataURL(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Unable to read this file.'));reader.readAsDataURL(file);});}
  function getSettings(){const [w,h]=dims[$('trimSize').value]||dims['6x9'];return {
    w,h,paper:$('paperType').value,inside:clamp($('insideMargin').value,.375,2,.75),outside:clamp($('outsideMargin').value,.25,2,.65),top:clamp($('topMargin').value,.3,2,.82),bottom:clamp($('bottomMargin').value,.3,2,.79),font:$('bodyFont').value,size:clamp($('fontSize').value,8,16,11),leading:clamp($('lineHeight').value,1,2,1.28),mirror:$('mirrorMargins').checked,chapters:$('chapterBreaks').checked,number:$('showPageNumbers').checked,running:$('showRunningTitle').checked,title:$('bookTitle').value.trim(),author:$('bookAuthor').value.trim(),subtitle:$('bookSubtitle').value.trim()};}
  function attachPageVars(page,n,s){
    page.style.setProperty('--trim-width',`${s.w}in`);page.style.setProperty('--trim-height',`${s.h}in`);
    page.style.setProperty('--body-font',`"${s.font}", Georgia, serif`);page.style.setProperty('--font-size',`${s.size}pt`);page.style.setProperty('--line-height',s.leading);
    page.style.setProperty('--top-margin',`${s.top}in`);page.style.setProperty('--bottom-margin',`${s.bottom}in`);
    const isOdd=n%2===1;const left=s.mirror ? (isOdd?s.inside:s.outside) : s.inside;const right=s.mirror ? (isOdd?s.outside:s.inside) : s.outside;
    page.style.setProperty('--page-left',`${left}in`);page.style.setProperty('--page-right',`${right}in`);
  }
  function newPage(s,n){const page=document.createElement('div');page.className='paper-page';page.dataset.page=n;attachPageVars(page,n,s);
    const content=document.createElement('div');content.className='page-content';page.append(content);
    if(s.running&&n>1){const header=document.createElement('div');header.className='running-title';header.textContent=s.title.slice(0,64);page.append(header);}
    if(s.number){const num=document.createElement('div');num.className='page-number';num.textContent=n;page.append(num);}
    $('previewPages').append(page);return {page,content};
  }
  function overflowing(container){return container.scrollHeight>container.clientHeight+2;}
  function getTextNodes(node){const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);const out=[];while(walker.nextNode())out.push(walker.currentNode);return out;}
  function sectionOf(block,start,end){const clone=block.cloneNode(false);const nodes=getTextNodes(block);const total=nodes.reduce((sum,n)=>sum+n.length,0);
    if(total===0)return clone;const locate=(index)=>{let passed=0;for(const node of nodes){if(index<=passed+node.length)return [node,index-passed];passed+=node.length;}return [nodes[nodes.length-1],nodes[nodes.length-1].length];};
    const r=document.createRange();const [sn,so]=locate(start),[en,eo]=locate(end);r.setStart(sn,so);r.setEnd(en,eo);clone.append(r.cloneContents());return clone;
  }
  // Keep emphasis in split paragraphs by splitting DOM ranges rather than plain text.
  function splitTextBlock(block,space){const total=getTextNodes(block).reduce((sum,node)=>sum+node.length,0);if(total<4)return null;
    const probe=document.createElement('div');probe.className='split-probe';const container=space.container;let low=1,high=total-1,fit=0;
    while(low<=high){const mid=Math.floor((low+high)/2);probe.replaceChildren(sectionOf(block,0,mid));container.append(probe);const valid=!overflowing(container);probe.remove();if(valid){fit=mid;low=mid+1;}else high=mid-1;}
    if(fit<4||fit>=total-3)return null;
    // Prefer word boundaries and avoid a dangling word when possible.
    const text=block.textContent;const near=text.lastIndexOf(' ',fit);if(near>=Math.max(3,fit-30))fit=near+1;
    const left=sectionOf(block,0,fit),right=sectionOf(block,fit,total);if(!left.textContent.trim()||!right.textContent.trim())return null;
    return [left,right];
  }
  function normalBlocks(){const result=[];for(const child of [...$('editor').childNodes]){
      if(child.nodeType===Node.TEXT_NODE){if(child.textContent.trim()){const p=document.createElement('p');p.textContent=child.textContent;result.push(p);}continue;}
      if(child.nodeType!==Node.ELEMENT_NODE)continue;
      const tag=child.tagName.toLowerCase();if(['p','h1','h2','blockquote','figure','img','ul','ol','div','h3'].includes(tag)){
        if(tag==='div'){const p=document.createElement('p');p.innerHTML=child.innerHTML;result.push(p);}else if(tag==='h3'){const h=document.createElement('h2');h.innerHTML=child.innerHTML;result.push(h);}else result.push(child.cloneNode(true));
      }
    }return result;
  }
  function relayout(){
    const interior=$('interiorStage'),wasHidden=interior.classList.contains('hidden');if(wasHidden)interior.classList.remove('hidden');
    const s=getSettings();const area=$('previewPages');area.innerHTML='';const blocks=normalBlocks();state.pages=[];
    let n=1,current=newPage(s,1),count=0;state.pages.push(current.page);
    const next=()=>{n+=1;current=newPage(s,n);state.pages.push(current.page);};
    for(const block of blocks){if(count++>20000){notify('This manuscript is too complex for the preview.');break;}
      if(block.tagName==='H1'&&s.chapters&&current.content.children.length>0)next();
      current.content.append(block);
      if(!overflowing(current.content))continue;
      current.content.removeChild(block);
      const tag=block.tagName.toLowerCase();const splittable=['p','blockquote','h2'].includes(tag)&&!block.querySelector('img,figure,table');
      if(splittable){
        let remaining=block, attempts=0;
        while(remaining && attempts++<500){
          current.content.append(remaining);
          if(!overflowing(current.content)){remaining=null;break;}
          current.content.removeChild(remaining);
          const pair=splitTextBlock(remaining,{container:current.content});
          if(pair && pair[0].textContent.trim().length>=12){
            // Use the remaining space on the current page rather than discarding it.
            current.content.append(pair[0]);remaining=pair[1];next();continue;
          }
          if(current.content.children.length>0){next();continue;}
          // A single unbreakable block exceeds the entire page: warn rather than silently clipping.
          current.content.append(remaining);current.page.dataset.overflow='true';remaining=null;
        }
        if(remaining)current.page.dataset.overflow='true';
      }else{
        if(current.content.children.length>0)next();
        current.content.append(block);
        if(overflowing(current.content))current.page.dataset.overflow='true';
      }
    }
    if(state.pages.length>1&&state.pages[state.pages.length-1].querySelector('.page-content').children.length===0){state.pages.pop();area.lastElementChild.remove();}
    state.pageCount=state.pages.length;const countWords=($('editor').textContent||'').trim().split(/\s+/).filter(Boolean).length;
    $('wordCount').textContent=`${countWords.toLocaleString()} words`;
    $('previewStatus').textContent=`${state.pageCount} ${state.pageCount===1?'page':'pages'} · ${s.w} × ${s.h} in`;
    $('previewSummary').textContent=`${state.pageCount} pages  ·  ${countWords.toLocaleString()} words`;
    $('statPages').textContent=state.pageCount;
    $('statSpine').textContent=spineWidth().toFixed(3);
    if(wasHidden)interior.classList.add('hidden');
    renderCover();updateChecks();
  }
  function scheduleLayout(){clearTimeout(state.timer);$('previewStatus').textContent='Composing pages…';state.timer=setTimeout(relayout,320);}
  function spineWidth(){return state.pageCount*(getSettings().paper==='cream'?.0025:.002252);}
  function displayPanel(name){for(const btn of document.querySelectorAll('.nav-button'))btn.classList.toggle('active',btn.dataset.panel===name);
    for(const view of document.querySelectorAll('.panel-view'))view.classList.toggle('active',view.id===`panel-${name}`);
    $('breadcrumb').textContent=`Workspace / ${{manuscript:'Manuscript',format:'Book format',cover:'Cover studio',export:'Export & check'}[name]||name}`;
    if(name==='cover')setPreview('cover');else if(name==='format'||name==='manuscript')setPreview('interior');if(name==='export')updateChecks();
  }
  function setPreview(which){state.previewMode=which;$('interiorStage').classList.toggle('hidden',which!=='interior');$('coverStage').classList.toggle('hidden',which!=='cover');$('previewInterior').classList.toggle('selected',which==='interior');$('previewCover').classList.toggle('selected',which==='cover');}
  function requiredGutter(p){if(p<=150)return .375;if(p<=300)return .5;if(p<=500)return .625;if(p<=700)return .75;return .875;}
  function checkItem(ok,text){return `<div class="check-item ${ok?'':'warn'}"><span class="check-symbol">${ok?'✓':'!'}</span><span>${escapeHtml(text)}</span></div>`;}
  function updateChecks(){const s=getSettings(),p=state.pageCount,inner=s.mirror?Math.min(s.inside,s.outside):s.inside;
    const overflow=state.pages.some(x=>x.dataset.overflow==='true');const checks=[
      [p>=24&&p<=828,p<24?`Only ${p} pages. Most KDP paperbacks require at least 24 pages.`:p>828?'Above 828 pages. Check your chosen KDP trim/ink limits.':'Page count is in the standard 24–828 paperback range.'],
      [s.inside>=requiredGutter(p),`Inside margin: ${s.inside.toFixed(2)} in (KDP minimum for this page count: ${requiredGutter(p).toFixed(3)} in).`],
      [s.outside>=.25,`Outside margin: ${s.outside.toFixed(2)} in (no-bleed minimum: 0.25 in).`],
      [s.top>=.25&&s.bottom>=.25,`Top and bottom margins: ${s.top.toFixed(2)} / ${s.bottom.toFixed(2)} in.`],
      [!overflow,overflow?'At least one block exceeds the printable text area. Resize a large image or edit a long unbreakable line.':'No detected block overflow in the current pagination.'],
      [!!s.title&&!!s.author,'Book title and author are present.'],
      [!state.coverImageInfo||state.coverImageInfo.dpi>=300,state.coverImageInfo?`Cover artwork estimated at ${Math.floor(state.coverImageInfo.dpi)} PPI at its displayed size; aim for 300 PPI.`:'Cover uses vector artwork and typography only.'],
      [false,'Browser PDF settings and KDP Print Previewer must still be checked manually.']
    ];
    $('checks').innerHTML=checks.map(([good,message])=>checkItem(good,message)).join('');
  }
  function wrapWords(text,limit,maxLines=99){const words=String(text||'').trim().split(/\s+/).filter(Boolean);const out=[];let line='';for(const word of words){if((line+' '+word).trim().length>limit&&line){out.push(line);line=word;}else line=(line+' '+word).trim();}if(line)out.push(line);return out.slice(0,maxLines);}
  function svgLines(text,x,y,maxWidth,fontSize,leading,maxLines,color,weight='normal',family='Georgia, serif',anchor='start'){
    const est=Math.max(6,Math.floor(maxWidth/(fontSize*.52)));let lines=wrapWords(text,est,maxLines);if(lines.length===maxLines&&String(text).length>lines.join(' ').length){lines[maxLines-1]=lines[maxLines-1].replace(/\s+\S*$/,'')+'…';}
    return {markup:lines.map((ln,i)=>`<text x="${x}" y="${y+i*leading}" font-family="${escapeXml(family)}" font-size="${fontSize}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${escapeXml(ln)}</text>`).join(''),bottom:y+lines.length*leading,lines:lines.length};
  }
  function coverGeometry(){const s=getSettings(),b=9,w=s.w*72,h=s.h*72,sp=spineWidth()*72;return {b,w,h,sp,fullW:w*2+sp+b*2,fullH:h+b*2,frontX:b+w+sp,backX:b};}
  function coverSvg(frontOnly=false,skipArt=false){const s=getSettings(),pal=palettes[state.theme],g=coverGeometry();const isFront=frontOnly;const canvasW=isFront?g.w:g.fullW;const canvasH=isFront?g.h:g.fullH;const frontX=isFront?0:g.frontX;const b=isFront?0:g.b;const height=g.h;
    const title=s.title||'Untitled';const subtitle=s.subtitle;const author=s.author||'Unknown author';
    const frontPad=Math.min(43,g.w*.085);const titleFont=title.length>58?27:title.length>37?32:39;
    const baseY=b+Math.min(height*.32,200);let parts=[];
    parts.push(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${canvasW.toFixed(3)} ${canvasH.toFixed(3)}" width="${canvasW.toFixed(3)}" height="${canvasH.toFixed(3)}" role="img" aria-label="Paperback cover design">`);
    parts.push(`<rect width="${canvasW}" height="${canvasH}" fill="${pal.bg}"/>`);
    if(!isFront){parts.push(`<rect x="0" y="0" width="${(g.b+g.w).toFixed(3)}" height="${g.fullH}" fill="${pal.back}"/>`);parts.push(`<rect x="${g.frontX-g.sp}" y="0" width="${g.sp}" height="${g.fullH}" fill="${pal.bg}"/>`);}
    parts.push(`<rect x="${frontX+frontPad}" y="${b+54}" width="36" height="3.6" fill="${pal.accent}"/>`);
    parts.push(`<text x="${frontX+frontPad}" y="${b+80}" fill="${pal.accent}" font-family="Arial, sans-serif" font-size="8.2" letter-spacing="2.1">${escapeXml($('coverKicker').value.trim().slice(0,68).toUpperCase())}</text>`);
    const titleLines=svgLines(title,frontX+frontPad,baseY,g.w-frontPad*2,titleFont,titleFont*1.14,5,pal.fg,'normal','Georgia, serif');parts.push(titleLines.markup);
    const subtitleY=Math.min(titleLines.bottom+25,b+height*.68);parts.push(svgLines(subtitle,frontX+frontPad,subtitleY,g.w-frontPad*2,13,18,4,pal.muted,'normal','Arial, sans-serif').markup);
    if(state.coverArt){if(!skipArt){const artW=g.w-frontPad*2;const artH=Math.min(125,g.h*.19);const artY=b+height*.67;
      // Embed user artwork in print SVG; the eBook canvas adds it separately.
      parts.push(`<defs><clipPath id="artClip"><rect x="${frontX+frontPad}" y="${artY}" width="${artW}" height="${artH}" rx="3"/></clipPath></defs>`);
      parts.push(`<image x="${frontX+frontPad}" y="${artY}" width="${artW}" height="${artH}" preserveAspectRatio="xMidYMid slice" clip-path="url(#artClip)" href="${escapeXml(state.coverArt)}" />`);
    }}else{const ly=b+height*.73;parts.push(`<line x1="${frontX+frontPad}" x2="${frontX+g.w-frontPad}" y1="${ly}" y2="${ly}" stroke="${pal.accent}" opacity=".55" stroke-width=".6"/>`);parts.push(`<circle cx="${frontX+g.w-frontPad-11}" cy="${ly}" r="5" fill="${pal.accent}" opacity=".9"/>`);}
    parts.push(`<text x="${frontX+frontPad}" y="${b+height-83}" fill="${pal.fg}" font-family="Arial, sans-serif" font-size="11.5" font-weight="600" letter-spacing="1.0">${escapeXml(author.slice(0,48).toUpperCase())}</text>`);
    parts.push(`<text x="${frontX+frontPad}" y="${b+height-34}" fill="${pal.muted}" font-family="Arial, sans-serif" font-size="7.6" letter-spacing="2">${escapeXml($('coverImprint').value.trim().slice(0,55).toUpperCase())}</text>`);
    if(!isFront){const bx=g.backX+30,by=b+75;
      parts.push(`<rect x="${bx}" y="${by-30}" width="33" height="3" fill="${pal.accent}"/>`);
      parts.push(`<text x="${bx}" y="${by}" fill="${pal.fg}" font-family="Arial, sans-serif" font-size="10" font-weight="600" letter-spacing="1.7">ABOUT THIS BOOK</text>`);
      const blurb=$('backBlurb').value.trim();const blurbY=by+43;
      const lines=svgLines(blurb,bx,blurbY,g.w-60,11.4,18,Math.floor((height*.6-110)/18),pal.fg,'normal','Georgia, serif');parts.push(lines.markup);
      parts.push(`<text x="${bx}" y="${b+height-48}" fill="${pal.muted}" font-family="Arial, sans-serif" font-size="8" letter-spacing="1.2">${escapeXml($('coverImprint').value.trim().slice(0,35).toUpperCase())}</text>`);
      // White 2×1.2 in rectangle at lower-right of back: blank, no barcode artwork.
      const barcodeW=144,barcodeH=86.4,barcodeX=g.b+g.w-18-barcodeW,barcodeY=g.b+g.h-18-barcodeH;
      parts.push(`<rect x="${barcodeX}" y="${barcodeY}" width="${barcodeW}" height="${barcodeH}" fill="#ffffff"/>`);
      if(state.pageCount>79&&g.sp>19){parts.push(`<text transform="translate(${g.frontX-g.sp/2} ${b+g.h/2}) rotate(-90)" text-anchor="middle" fill="${pal.fg}" font-family="Arial, sans-serif" font-size="7" letter-spacing=".3">${escapeXml((title+'  ·  '+author).slice(0,100))}</text>`);}
    }
    parts.push('</svg>');return parts.join('');
  }
  function renderCover(){const wrapper=$('coverPreview');wrapper.innerHTML=coverSvg(false);const geom=coverGeometry();$('coverPreviewWrapper').style.maxWidth=geom.fullW>920?'910px':'780px';}
  async function exportEbookCover(){try{
    const svg=coverSvg(true,true);const encoded='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);const img=new Image();img.src=encoded;await img.decode();const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=2560;const ctx=canvas.getContext('2d');ctx.fillStyle=palettes[state.theme].bg;ctx.fillRect(0,0,1600,2560);ctx.drawImage(img,0,0,1600,2560);
    if(state.coverArt){const art=new Image();art.src=state.coverArt;await art.decode();const g=coverGeometry(),pad=Math.min(43,g.w*.085),targetW=g.w-pad*2,targetH=Math.min(125,g.h*.19),targetY=g.h*.67;
      const scaleX=1600/g.w,scaleY=2560/g.h,boxRatio=targetW/targetH,sourceRatio=art.naturalWidth/art.naturalHeight;let sx=0,sy=0,sw=art.naturalWidth,sh=art.naturalHeight;
      if(sourceRatio>boxRatio){sw=sh*boxRatio;sx=(art.naturalWidth-sw)/2;}else{sh=sw/boxRatio;sy=(art.naturalHeight-sh)/2;}
      ctx.drawImage(art,sx,sy,sw,sh,pad*scaleX,targetY*scaleY,targetW*scaleX,targetH*scaleY);
    }
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('Could not make a PNG');downloadBlob(blob,slug($('bookTitle').value)+'-ebook-cover.png');notify('eBook cover downloaded (1600 × 2560 PNG).');
  }catch(e){console.error(e);notify('Cover PNG export failed: '+e.message,9000);}}
  function printPdf(type){if(state.busy)return;relayout();const s=getSettings();const g=coverGeometry();const printRoot=$('printRoot');printRoot.innerHTML='';
    const style=document.createElement('style');style.id='bookPrintPageStyle';if(type==='cover'){
      style.textContent=`@page { size: ${(g.fullW/72).toFixed(5)}in ${(g.fullH/72).toFixed(5)}in; margin: 0; }`;
      const cover=document.createElement('div');cover.className='print-cover-svg';cover.style.width=`${g.fullW/72}in`;cover.style.height=`${g.fullH/72}in`;cover.innerHTML=coverSvg(false);printRoot.append(cover);
    }else{style.textContent=`@page { size: ${s.w}in ${s.h}in; margin: 0; }`;
      for(const page of state.pages)printRoot.append(page.cloneNode(true));}
    const prior=$('bookPrintPageStyle');if(prior)prior.remove();document.head.append(style);
    state.busy=true;notify(`Print dialog opening. Select “Save as PDF” and verify scale 100%, margins None, and headers off.`,8500);
    setTimeout(()=>{try{window.print();}catch(error){notify('Print dialog could not open: '+error.message,9000);cleanupPrint();}},180);
  }
  function cleanupPrint(){state.busy=false;$('printRoot').innerHTML='';$('bookPrintPageStyle')?.remove();}
  function setTheme(id){if(!palettes[id])return;state.theme=id;document.querySelectorAll('.swatch').forEach(b=>b.classList.toggle('active',b.dataset.theme===id));renderCover();}
  function saveProject(){const data={format:'book-builder-project',version:1,created:new Date().toISOString(),settings:{},manuscript:$('editor').innerHTML,theme:state.theme,coverArt:state.coverArt,coverImageInfo:state.coverImageInfo};
    for(const id of inputs)data.settings[id]=$(id).type==='checkbox'?$(id).checked:$(id).value;
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});downloadBlob(blob,slug($('bookTitle').value)+'.bookbuilder.json');notify('Project saved as a local file.');}
  async function openProject(file){try{if(file.size>80*1024*1024)throw new Error('Project is larger than the supported 80 MB limit.');const data=JSON.parse(await file.text());if(data.format!=='book-builder-project'||data.version!==1)throw new Error('This is not a version 1 Book Builder project.');
      for(const id of inputs)if(id in(data.settings||{})){$(id).type==='checkbox'?$(id).checked=!!data.settings[id]:$(id).value=data.settings[id];}
      // Project files are user-supplied HTML; sanitize it before putting it in the editor.
      $('editor').innerHTML=sanitizeEditorHtml(data.manuscript||'');state.coverArt=typeof data.coverArt==='string'&&data.coverArt.startsWith('data:image/')?data.coverArt:null;state.coverImageInfo=data.coverImageInfo||null;setTheme(data.theme||'ink');relayout();notify('Project opened successfully.');
    }catch(err){notify(`Cannot open project: ${err.message}`,9000);}}
  function sanitizeEditorHtml(markup){const doc=new DOMParser().parseFromString(`<main>${markup}</main>`,'text/html');const root=doc.querySelector('main');const allowed=new Set(['P','H1','H2','BLOCKQUOTE','STRONG','B','EM','I','U','BR','UL','OL','LI','FIGURE','FIGCAPTION','IMG','DIV']);
    const clean=(node)=>{for(const c of [...node.childNodes]){if(c.nodeType===Node.COMMENT_NODE){c.remove();continue;}if(c.nodeType!==Node.ELEMENT_NODE)continue;
      if(!allowed.has(c.tagName)){const text=doc.createTextNode(c.textContent||'');c.replaceWith(text);continue;}
      if(c.tagName==='IMG'){const src=c.getAttribute('src')||'';if(!/^data:image\/(?:png|jpeg|webp);base64,/i.test(src)){c.remove();continue;}const alt=c.getAttribute('alt')||'';for(const a of [...c.attributes])c.removeAttribute(a.name);c.setAttribute('src',src);c.setAttribute('alt',alt);}
      else{for(const a of [...c.attributes])c.removeAttribute(a.name);clean(c);}
    }};clean(root);return root.innerHTML;}
  function unzipEntries(bytes){const dv=new DataView(bytes);let eocd=-1;for(let i=dv.byteLength-22;i>=Math.max(0,dv.byteLength-65557);i--){if(dv.getUint32(i,true)===0x06054b50){eocd=i;break;}}
    if(eocd<0)throw new Error('The DOCX archive could not be read.');const count=dv.getUint16(eocd+10,true);let ptr=dv.getUint32(eocd+16,true);const list=new Map();const dec=new TextDecoder();for(let i=0;i<count;i++){
      if(dv.getUint32(ptr,true)!==0x02014b50)throw new Error('Invalid DOCX directory.');const method=dv.getUint16(ptr+10,true),compSize=dv.getUint32(ptr+20,true),nameLen=dv.getUint16(ptr+28,true),extraLen=dv.getUint16(ptr+30,true),commentLen=dv.getUint16(ptr+32,true),localOffset=dv.getUint32(ptr+42,true);
      const path=dec.decode(new Uint8Array(bytes,ptr+46,nameLen));const nameSize=dv.getUint16(localOffset+26,true),extra=dv.getUint16(localOffset+28,true),start=localOffset+30+nameSize+extra;
      list.set(path,{method,compressed:new Uint8Array(bytes,start,compSize)});ptr+=46+nameLen+extraLen+commentLen;
    }return list;
  }
  async function zipRead(files,name){const f=files.get(name);if(!f)return null;if(f.method===0)return f.compressed;if(f.method!==8)throw new Error('Unsupported ZIP compression in DOCX.');
    if(!('DecompressionStream' in window))throw new Error('DOCX import requires a modern browser supporting DecompressionStream.');
    const ds=new DecompressionStream('deflate-raw');const ab=await new Response(new Blob([f.compressed]).stream().pipeThrough(ds)).arrayBuffer();return new Uint8Array(ab);
  }
  function normalizePath(p){const parts=[];for(const part of p.split('/')){if(part==='..')parts.pop();else if(part!=='.'&&part!=='')parts.push(part);}return parts.join('/');}
  function textFromNode(el){const texts=[];const walk=(node)=>{for(const ch of node.childNodes){if(ch.nodeType!==Node.ELEMENT_NODE)continue;const ln=ch.localName;if(ln==='t')texts.push(ch.textContent);else if(ln==='tab')texts.push('    ');else if(ln==='br')texts.push('\n');else if(ln==='instrText'||ln==='delText')continue;else walk(ch);}};walk(el);return texts.join('');}
  async function docxToHtml(file){const arr=await file.arrayBuffer();const zip=unzipEntries(arr);const decoder=new TextDecoder();const xmlbytes=await zipRead(zip,'word/document.xml');if(!xmlbytes)throw new Error('Missing word/document.xml.');const doc=new DOMParser().parseFromString(decoder.decode(xmlbytes),'application/xml');if(doc.querySelector('parsererror'))throw new Error('DOCX document XML is malformed.');
    const relsbytes=await zipRead(zip,'word/_rels/document.xml.rels');const relationMap=new Map();if(relsbytes){const rels=new DOMParser().parseFromString(decoder.decode(relsbytes),'application/xml');for(const r of rels.getElementsByTagName('*'))if(r.localName==='Relationship')relationMap.set(r.getAttribute('Id'),normalizePath('word/'+r.getAttribute('Target')));}
    const body=[...doc.getElementsByTagName('*')].find(n=>n.localName==='body');if(!body)throw new Error('DOCX has no body.');const blocks=[];let foundImages=0;let omittedTables=0;
    for(const node of body.children){if(node.localName==='p'){
        const style=[...node.getElementsByTagName('*')].find(e=>e.localName==='pStyle')?.getAttribute('w:val')||'';
        const heading=/heading1/i.test(style)?'h1':/heading2/i.test(style)?'h2':/title/i.test(style)?'h1':/subtitle/i.test(style)?'h2':'p';
        let markup='';for(const child of node.children){if(child.localName==='r'||child.localName==='hyperlink'){
            const raw=textFromNode(child);if(raw){let line=escapeHtml(raw).replace(/\n/g,'<br>');const rPr=[...child.children].find(e=>e.localName==='rPr');if(rPr){if([...rPr.children].some(e=>e.localName==='b'&&e.getAttribute('w:val')!=='0'))line=`<strong>${line}</strong>`;if([...rPr.children].some(e=>e.localName==='i'&&e.getAttribute('w:val')!=='0'))line=`<em>${line}</em>`;}markup+=line;}
          }}
        if(markup.trim())blocks.push(`<${heading}>${markup}</${heading}>`);
        const blips=[...node.getElementsByTagName('*')].filter(el=>el.localName==='blip');for(const blip of blips){const rid=blip.getAttribute('r:embed')||blip.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','embed');const path=relationMap.get(rid);if(!path)continue;const data=await zipRead(zip,path);if(!data)continue;const ext=(path.split('.').pop()||'').toLowerCase();if(!['jpeg','jpg','png','webp'].includes(ext))continue;const type=ext==='jpg'?'jpeg':ext;const mime=`image/${type}`;const uri=await readAsDataURL(new File([data],`image.${ext}`,{type:mime}));blocks.push(`<figure><img src="${uri}" alt="Imported manuscript image"></figure>`);foundImages++;}
      }else if(node.localName==='tbl'){
        // Preserve text from tables as rows; merged cells and real table geometry need a later version.
        const rows=[...node.children].filter(x=>x.localName==='tr');for(const row of rows){const cells=[...row.children].filter(x=>x.localName==='tc').map(x=>textFromNode(x).trim()).filter(Boolean);if(cells.length)blocks.push(`<p>${escapeHtml(cells.join('  |  '))}</p>`);}omittedTables++;
      }}
    if(!blocks.length)throw new Error('No readable manuscript text was found in this DOCX.');return {html:blocks.join('\n'),images:foundImages,tables:omittedTables};
  }
  function plainTextToHtml(txt,markdown=false){const paragraphs=txt.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split(/\n\s*\n+/);return paragraphs.map(p=>{
    const trimmed=p.trim();if(!trimmed)return'';if(markdown&&/^#{1,2}\s/.test(trimmed)){const level=trimmed.startsWith('## ')?'h2':'h1';return `<${level}>${escapeHtml(trimmed.replace(/^#{1,2}\s+/,''))}</${level}>`;}
    if(markdown&&/^>\s/.test(trimmed))return `<blockquote>${escapeHtml(trimmed.replace(/^>\s?/gm,''))}</blockquote>`;
    return `<p>${escapeHtml(trimmed).replace(/\n/g,'<br>')}</p>`;
  }).join('\n');}
  async function importManuscript(file){if(!file)return;try{$('previewStatus').textContent='Importing manuscript…';let content='',note='';const lower=file.name.toLowerCase();
      if(lower.endsWith('.docx')){const result=await docxToHtml(file);content=result.html;note=result.tables?` ${result.tables} table(s) simplified to text rows.`:'';}
      else if(lower.endsWith('.txt')||lower.endsWith('.md')||lower.endsWith('.markdown')){content=plainTextToHtml(await file.text(),!lower.endsWith('.txt'));}
      else throw new Error('Choose DOCX, TXT, or Markdown.');
      $('editor').innerHTML=sanitizeEditorHtml(content);state.sourceName=file.name;relayout();notify(`Imported ${file.name}.${note}`,7000);
      const first= $('editor').querySelector('h1');if(first&&$('bookTitle').value==='The Little Book of Making Things'){$('bookTitle').value=first.textContent;relayout();}
    }catch(err){console.error(err);notify(`Import failed: ${err.message}`,10000);}finally{$('manuscriptFile').value='';}}
  async function importArt(file){if(!file)return;try{if(!/^image\/(png|jpeg|webp)$/.test(file.type))throw new Error('Choose a PNG, JPEG, or WebP image.');if(file.size>15*1024*1024)throw new Error('Artwork is too large (limit: 15 MB).');
      state.coverArt=await readAsDataURL(file);const im=new Image();im.src=state.coverArt;await im.decode();const s=getSettings();const artWidth=(s.w*.82);const artHeight=Math.min(125,s.h*72*.19)/72;
      state.coverImageInfo={width:im.naturalWidth,height:im.naturalHeight,name:file.name,dpi:Math.min(im.naturalWidth/artWidth,im.naturalHeight/artHeight)};$('artworkName').textContent=file.name;renderCover();updateChecks();notify('Cover artwork added.');
    }catch(e){notify('Cannot add artwork: '+e.message,9000);}}
  function insertImage(file){if(!file)return;readAsDataURL(file).then(src=>{$('editor').focus();document.execCommand('insertHTML',false,`<figure><img src="${src}" alt="Manuscript illustration"></figure><p><br></p>`);scheduleLayout();}).catch(e=>notify(e.message));}
  function addChapter(){ $('editor').focus();document.execCommand('insertHTML',false,'<h1>New chapter</h1><p>Begin writing here.</p>');scheduleLayout();}
  function changeParagraph(tag){$('editor').focus();document.execCommand('formatBlock',false,tag);scheduleLayout();}
  function bindEvents(){document.querySelectorAll('.nav-button').forEach(btn=>btn.addEventListener('click',()=>displayPanel(btn.dataset.panel)));
    $('previewInterior').addEventListener('click',()=>setPreview('interior'));$('previewCover').addEventListener('click',()=>setPreview('cover'));
    $('previewZoom').addEventListener('change',()=>{$('previewPages').style.zoom=$('previewZoom').value;});
    for(const id of inputs){$(id).addEventListener('input',scheduleLayout);$(id).addEventListener('change',scheduleLayout);}
    $('editor').addEventListener('input',scheduleLayout);
    $('editor').addEventListener('paste',()=>setTimeout(scheduleLayout,80));
    $('editor').addEventListener('drop',()=>setTimeout(scheduleLayout,100));
    document.querySelectorAll('[data-command]').forEach(btn=>btn.addEventListener('click',()=>{$('editor').focus();document.execCommand(btn.dataset.command);scheduleLayout();}));
    $('paragraphStyle').addEventListener('change',e=>changeParagraph(e.target.value));
    $('insertChapterButton').addEventListener('click',addChapter);
    $('insertImageButton').addEventListener('click',()=>$('inlineImageFile').click());
    $('inlineImageFile').addEventListener('change',e=>{insertImage(e.target.files[0]);e.target.value='';});
    const pickManuscript=()=>$('manuscriptFile').click();$('importButton').addEventListener('click',e=>{e.stopPropagation();pickManuscript();});
    $('dropZone').addEventListener('click',e=>{if(e.target.id!=='importButton')pickManuscript();});
    $('dropZone').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pickManuscript();}});
    $('manuscriptFile').addEventListener('change',e=>importManuscript(e.target.files[0]));
    for(const name of ['dragenter','dragover'])$('dropZone').addEventListener(name,e=>{e.preventDefault();$('dropZone').classList.add('drag-over');});
    for(const name of ['dragleave','drop'])$('dropZone').addEventListener(name,e=>{e.preventDefault();$('dropZone').classList.remove('drag-over');});
    $('dropZone').addEventListener('drop',e=>importManuscript(e.dataTransfer.files[0]));
    $('sampleButton').addEventListener('click',()=>{if(confirm('Replace the current manuscript editor content with the example?')){$('editor').innerHTML=sample;relayout();}});
    document.querySelectorAll('.swatch').forEach(b=>b.addEventListener('click',()=>setTheme(b.dataset.theme)));
    $('artworkButton').addEventListener('click',()=>$('coverImage').click());$('coverImage').addEventListener('change',e=>{importArt(e.target.files[0]);e.target.value='';});
    $('removeArtworkButton').addEventListener('click',()=>{state.coverArt=null;state.coverImageInfo=null;$('artworkName').textContent='No image selected';renderCover();updateChecks();});
    $('topExportButton').addEventListener('click',()=>{displayPanel('export');setPreview('interior');});
    $('exportInterior').addEventListener('click',()=>printPdf('interior'));
    $('exportCover').addEventListener('click',()=>printPdf('cover'));
    $('exportEbookCover').addEventListener('click',exportEbookCover);
    $('saveProjectButton').addEventListener('click',saveProject);
    $('loadProjectButton').addEventListener('click',()=>$('projectFile').click());
    $('projectFile').addEventListener('change',e=>{openProject(e.target.files[0]);e.target.value='';});
    window.addEventListener('afterprint',()=>setTimeout(cleanupPrint,300));
    // Some browsers do not fire afterprint consistently. Returning to the app tab
    // is an alternate signal that the print interface has been dismissed.
    window.addEventListener('focus',()=>{if(state.busy)setTimeout(cleanupPrint,1200);});
  }
  function init(){ $('editor').innerHTML=sample;bindEvents();relayout(); }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  // Small diagnostic read-only API for local regression checks.
  window.BookBuilderTest={get pageCount(){return state.pageCount;},get settings(){return getSettings();},reflow:relayout,get coverSvg(){return coverSvg(false);}};
})();
