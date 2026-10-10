(() => {
  'use strict';
  const entries=[],popup=document.createElement('div');popup.className='select-popover';popup.hidden=true;document.body.append(popup);
  let opened=null,active=-1,typed='',typeTimer;
  function close(focus=false){if(!opened)return;const previous=opened;opened=null;previous.button.setAttribute('aria-expanded','false');previous.button.removeAttribute('aria-activedescendant');popup.hidden=true;popup.replaceChildren();document.body.classList.remove('select-open');if(focus)previous.button.focus({preventScroll:true});}
  function sync(entry){const selected=entry.select.selectedOptions[0];entry.value.textContent=selected?.textContent||'请选择';entry.button.disabled=entry.select.disabled;}
  function enabled(entry){return [...entry.select.options].map((o,i)=>!o.disabled&&!o.parentElement.disabled?i:-1).filter(i=>i>=0);}
  function position(){
    if(!opened)return;
    const rect=opened.button.getBoundingClientRect(),view=window.visualViewport;
    const left=(view?view.offsetLeft:0)+12,top=(view?view.offsetTop:0)+12;
    const right=left+(view?view.width:innerWidth)-24,bottom=top+(view?view.height:innerHeight)-24;
    if(rect.bottom<top||rect.top>bottom){close();return;}
    const width=Math.max(0,Math.min(Math.max(rect.width,210),right-left));
    const below=Math.max(0,bottom-rect.bottom-7),above=Math.max(0,rect.top-top-7);
    const down=below>=Math.min(220,Math.max(below,above)),maxHeight=Math.min(350,down?below:above);
    if(!width||maxHeight<1){close();return;}
    popup.style.width=width+'px';popup.style.left=Math.max(left,Math.min(rect.left,right-width))+'px';
    popup.style.maxHeight=maxHeight+'px';popup.style.bottom='auto';
    const height=Math.min(maxHeight,popup.getBoundingClientRect().height||maxHeight);
    popup.style.top=(down?rect.bottom+7:Math.max(top,rect.top-7-height))+'px';
  }
  function highlight(index){if(!opened)return;active=index;popup.querySelectorAll('[role="option"]').forEach((item,i)=>item.classList.toggle('highlighted',i===active));const option=popup.children[active];if(option){opened.button.setAttribute('aria-activedescendant',option.id);option.scrollIntoView({block:'nearest'});}}
  function commit(index){if(!opened||!enabled(opened).includes(index))return;const entry=opened;const previous=entry.select.selectedIndex;entry.select.selectedIndex=index;sync(entry);close(true);if(previous!==index){entry.select.dispatchEvent(new Event('input',{bubbles:true}));entry.select.dispatchEvent(new Event('change',{bubbles:true}));}entries.forEach(sync);}
  function open(entry){if(opened===entry){close();return;}close();if(entry.select.disabled)return;opened=entry;document.body.classList.add('select-open');entry.button.setAttribute('aria-expanded','true');popup.id=entry.select.id+'-list';popup.setAttribute('role','listbox');popup.setAttribute('aria-labelledby',entry.labelId);entry.button.setAttribute('aria-controls',popup.id);popup.replaceChildren();[...entry.select.options].forEach((option,i)=>{const item=document.createElement('div');item.id=entry.select.id+'-option-'+i;item.setAttribute('role','option');item.setAttribute('aria-selected',String(i===entry.select.selectedIndex));item.textContent=option.textContent;if(option.disabled||option.parentElement.disabled){item.setAttribute('aria-disabled','true');}item.addEventListener('pointermove',()=>{if(enabled(entry).includes(i))highlight(i);},{passive:true});item.addEventListener('click',()=>commit(i));popup.append(item);});popup.hidden=false;position();highlight(entry.select.selectedIndex>=0?entry.select.selectedIndex:enabled(entry)[0]);}
  document.querySelectorAll('select').forEach((select,index)=>{
    const wrapper=document.createElement('span');wrapper.className='custom-select';select.before(wrapper);wrapper.append(select);select.classList.add('custom-native');select.hidden=true;select.tabIndex=-1;select.setAttribute('aria-hidden','true');
    const button=document.createElement('button');button.type='button';button.className='select-trigger';button.id=select.id+'-trigger';button.setAttribute('role','combobox');button.setAttribute('aria-expanded','false');button.setAttribute('aria-haspopup','listbox');
    const value=document.createElement('span');value.id=select.id+'-value';const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('aria-hidden','true');const use=document.createElementNS('http://www.w3.org/2000/svg','use');use.setAttribute('href','#i-chevron');icon.append(use);button.append(value,icon);wrapper.append(button);
    const labels=[...document.querySelectorAll('label')].filter(label=>label.htmlFor===select.id||label.contains(select));let labelId;
    if(labels.length){const label=labels[0],copy=label.cloneNode(true);copy.querySelectorAll('.custom-select,select,button').forEach(el=>el.remove());const name=document.createElement('span');name.className='visually-hidden';name.id='select-label-'+index;name.textContent=copy.textContent.trim()||select.getAttribute('aria-label')||'选择选项';wrapper.append(name);labelId=name.id;if(label.htmlFor===select.id)label.htmlFor=button.id;button.setAttribute('aria-labelledby',labelId+' '+value.id);}
    else{const label=document.createElement('span');label.className='visually-hidden';label.id='select-label-'+index;label.textContent=select.getAttribute('aria-label')||'选择选项';wrapper.append(label);labelId=label.id;button.setAttribute('aria-labelledby',labelId+' '+value.id);}
    const entry={select,button,value,labelId};entries.push(entry);sync(entry);button.addEventListener('click',()=>open(entry));select.addEventListener('change',()=>sync(entry));new MutationObserver(()=>{sync(entry);if(opened===entry)close();}).observe(select,{childList:true,subtree:true,characterData:true,attributes:true});
    button.addEventListener('keydown',e=>{
      const options=enabled(entry);if(!options.length)return;
      if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();if(opened!==entry)open(entry);const at=options.indexOf(active);highlight(e.key==='Home'?options[0]:e.key==='End'?options.at(-1):options[Math.max(0,Math.min(options.length-1,at+(e.key==='ArrowDown'?1:-1)))]);}
      else if(e.key==='Enter'||e.key===' '){e.preventDefault();if(opened===entry)commit(active);else open(entry);}
      else if(e.key==='Escape'){e.preventDefault();close(true);}
      else if(e.key==='Tab')close();
      else if(e.key.length===1&&!e.ctrlKey&&!e.metaKey){typed+=e.key.toLocaleLowerCase();clearTimeout(typeTimer);typeTimer=setTimeout(()=>typed='',650);const found=options.find(i=>entry.select.options[i].textContent.trim().toLocaleLowerCase().startsWith(typed));if(found!==undefined){if(opened!==entry)open(entry);highlight(found);}}
    });
  });
  document.addEventListener('pointerdown',e=>{if(opened&&!opened.button.contains(e.target)&&!popup.contains(e.target))close();});
  document.addEventListener('click',()=>queueMicrotask(()=>entries.forEach(sync)));
  document.addEventListener('change',()=>queueMicrotask(()=>entries.forEach(sync)));
  document.addEventListener('scroll',e=>{if(!popup.contains(e.target))position();},true);
  window.addEventListener('resize',()=>close());document.addEventListener('site:pagechange',()=>close());document.addEventListener('visibilitychange',()=>{if(document.hidden)close();});
  if(window.visualViewport){window.visualViewport.addEventListener('resize',position);window.visualViewport.addEventListener('scroll',position);}
})();
