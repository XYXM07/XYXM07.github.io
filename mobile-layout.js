(() => {
  'use strict';
  const root=document.documentElement, body=document.body;
  const menu=document.querySelector('.mobile-menu'), sidebar=document.querySelector('.sidebar');
  const boards=[...document.querySelectorAll('.snake-board,.tiles-board,.tic-board,.gomoku-board,.mines-board,.sudoku-board,.tower-board')];
  const needsSquare=!(window.CSS && CSS.supports && CSS.supports('aspect-ratio','1 / 1'));
  const chart=document.querySelector('#chart-stage');
  if(chart) {
    const expand=document.createElement('button');expand.type='button';expand.className='button secondary chart-preview-toggle';
    expand.textContent='放大图表';expand.setAttribute('aria-pressed','false');expand.setAttribute('aria-controls','chart-stage');
    expand.addEventListener('click',()=>{
      const active=chart.classList.toggle('is-expanded');expand.setAttribute('aria-pressed',String(active));
      expand.textContent=active?'适应宽度':'放大图表';if(!active)chart.scrollLeft=0;
    });chart.before(expand);
  }
  let scheduled=false, lock=null;
  function narrow(){return window.innerWidth<=900;}
  function unlock(){
    if(!lock)return;
    const saved=lock;lock=null;
    for(const [name,value,priority] of saved.styles) {
      if(value)body.style.setProperty(name,value,priority);else body.style.removeProperty(name);
    }
    window.scrollTo(saved.x,saved.y);
  }
  function navigation(){
    if(!narrow() && body.classList.contains('nav-open')) {
      body.classList.remove('nav-open');menu.setAttribute('aria-expanded','false');
      menu.setAttribute('aria-label','打开导航菜单');
    }
    const active=narrow() && body.classList.contains('nav-open');
    if(active && !lock) {
      const names=['position','top','left','width','overflow'];
      lock={x:window.scrollX,y:window.scrollY,styles:names.map(name=>[name,body.style.getPropertyValue(name),body.style.getPropertyPriority(name)])};
      body.style.position='fixed';body.style.top=-lock.y+'px';body.style.left=-lock.x+'px';body.style.width='100%';body.style.overflow='hidden';
    } else if(!active)unlock();
  }
  function update(){
    scheduled=false;
    const viewport=window.visualViewport;
    root.style.setProperty('--visible-height',(viewport ? viewport.height : window.innerHeight)+'px');
    root.style.setProperty('--visible-top',(viewport ? viewport.offsetTop : 0)+'px');
    navigation();
    if(needsSquare)for(const board of boards) {
      if(board.closest('[hidden]'))continue;
      const width=board.getBoundingClientRect().width;
      if(width>0 && Math.abs((parseFloat(board.style.height)||0)-width)>.5)board.style.height=width+'px';
    }
  }
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(update);}}
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('orientationchange',schedule,{passive:true});
  if(window.visualViewport) {
    window.visualViewport.addEventListener('resize',schedule,{passive:true});
    window.visualViewport.addEventListener('scroll',schedule,{passive:true});
  }
  // Register last so routing controllers have already revealed the selected board.
  document.addEventListener('site:pagechange',()=>{
    if(lock && !body.classList.contains('nav-open')) {unlock();window.scrollTo(0,0);}
    schedule();
  });
  new MutationObserver(navigation).observe(body,{attributes:true,attributeFilter:['class']});
  if(needsSquare && window.ResizeObserver) {
    const observer=new ResizeObserver(schedule);boards.forEach(board=>observer.observe(board));
  }
  document.addEventListener('keydown',event=>{
    if(event.key!=='Tab' || !lock || document.querySelector('dialog[open]'))return;
    const items=[...sidebar.querySelectorAll('a[href],button:not([disabled])'),menu].filter(node=>!node.closest('[hidden]'));
    if(!items.length)return;
    const index=items.indexOf(document.activeElement);
    if(event.shiftKey && index<=0){event.preventDefault();items[items.length-1].focus();}
    else if(!event.shiftKey && (index===items.length-1 || index<0)){event.preventDefault();items[0].focus();}
  });
  update();
})();
