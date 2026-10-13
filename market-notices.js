(() => {
  'use strict';
  const tray=document.createElement('aside'),items=new Map();
  tray.id='market-notices';tray.className='market-notices';tray.setAttribute('aria-label','交易提醒');document.body.append(tray);
  const active=()=>location.hash.split('?')[0]==='#games/market'&&!document.hidden;
  function remove(type){const item=items.get(type);if(!item)return;clearTimeout(item.timer);if(active()&&item.card.contains(document.activeElement))document.querySelector('[data-market-type][aria-pressed="true"]')?.focus({preventScroll:true});item.card.remove();items.delete(type);}
  function clear(){for(const type of [...items.keys()])remove(type);}
  function show({type='news',title,text,meta=''}){
    if(!active())return;
    // One news and one liquidation notice: fast quotes cannot grow a blocking stack.
    remove(type);const card=document.createElement('div');card.className='market-notice'+(type==='liquidation'?' market-notice-danger':'');card.dataset.noticeType=type;
    const body=document.createElement('div');body.setAttribute('role',type==='liquidation'?'alert':'status');body.setAttribute('aria-atomic','true');
    const label=document.createElement('small'),heading=document.createElement('strong'),copy=document.createElement('p');
    label.textContent=meta;heading.textContent=title;copy.textContent=text;body.append(label,heading,copy);
    const close=document.createElement('button');close.type='button';close.className='market-notice-close';close.setAttribute('aria-label','关闭'+(type==='liquidation'?'强平':'市场消息')+'提醒');
    close.innerHTML='<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m6 6 8 8M14 6l-8 8"/></svg>';close.onclick=()=>remove(type);card.append(body,close);
    const item={card,timer:null},duration=type==='liquidation'?9000:6000;items.set(type,item);
    function schedule(){clearTimeout(item.timer);if(!card.contains(document.activeElement))item.timer=setTimeout(()=>remove(type),duration);}
    card.addEventListener('focusin',()=>clearTimeout(item.timer));card.addEventListener('focusout',schedule);
    // Keep liquidation first when both happen in the same quote update.
    if(type==='liquidation')tray.prepend(card);else tray.append(card);schedule();
  }
  window.MarketNotice={show,clear};
  document.addEventListener('site:pagechange',clear);document.addEventListener('market:typechange',clear);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});window.addEventListener('pagehide',clear);
})();
