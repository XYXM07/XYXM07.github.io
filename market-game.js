(() => {
  'use strict';
  const L=window.MarketLogic,$=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
  const panel=$('#game-market'),canvas=$('#market-chart'),ctx=canvas.getContext('2d');
  let model=L.create(Math.floor(Math.random()*4294967296)),selected='xy',market='stock',side='buy',chart='candle',range=30,best=L.CAPITAL,clock=null,frame=0,hover=null,resetArmed=false,resetClock;
  const number=(n,digits=2)=>Number(Math.abs(n)<.5*Math.pow(10,-digits)?0:n).toLocaleString('zh-CN',{minimumFractionDigits:digits,maximumFractionDigits:digits});
  const signed=n=>(n>=.005?'+':'')+number(n);
  const active=()=>location.hash.split('?')[0]==='#games/market'&&!document.hidden&&!$('#market-stock').hidden;
  function node(tag,text,cls){const el=document.createElement(tag);if(text!=null)el.textContent=text;if(cls)el.className=cls;return el;}
  function tone(el,value){el.classList.toggle('is-up',value>0);el.classList.toggle('is-down',value<0);}
  function say(text,error=false){const el=$('#market-status');el.textContent=text;el.classList.toggle('is-down',error);}
  function quantity(){return Number($('#market-quantity').value);}
  function orderType(){return $('#market-order-type').value;}
  function limit(){return Number($('#market-limit').value);}
  function estimate(){
    const a=L.asset(selected),p=orderType()==='limit'?limit():L.quote(model,selected)[side==='buy'?'buy':'sell'],qty=quantity(),valid=Number.isSafeInteger(qty)&&qty>=a.lot&&qty%a.lot===0&&Number.isFinite(p)&&p>0;
    const costs=valid?L.value(a,qty,p):null;
    $('#market-estimate').textContent=costs?number(side==='buy'?costs.total:costs.net)+' USD':'—';
    $('#market-fee').textContent=costs?number(costs.fee)+' USD':'—';
    $('#market-available').textContent=number(L.availableQty(model,selected),0)+' '+a.unit;
    $('#market-submit').textContent=(side==='buy'?'买入':'卖出')+(a.type==='stock'?'股票':'货币');
    $('#market-limit-field').hidden=orderType()!=='limit';
  }
  function configure(){const a=L.asset(selected),input=$('#market-quantity'),p=$('#market-limit');input.min=input.step=String(a.lot);input.value=String(a.lot*10);p.step=p.min=String(Math.pow(10,-a.decimals));p.value=model.markets[selected].price.toFixed(a.decimals);$('#market-unit').textContent='/ '+a.unit;$('#market-lot').textContent='最小交易数量 '+number(a.lot,0)+' '+a.unit+' · 手续费 '+(a.fee*100).toFixed(2)+'%';estimate();}
  function choose(id){selected=id;market=L.asset(id).type;hover=null;all('[data-market-type]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.marketType===market)));configure();render();}
  const watch=new Map();
  for(const a of L.assets){
    const b=node('button',null,'market-asset');b.type='button';b.dataset.marketAsset=a.id;b.setAttribute('aria-label',a.name+'，'+a.symbol);
    const first=node('span'),last=node('span'),name=node('strong',a.name),symbol=node('small',a.symbol),p=node('b'),change=node('em');first.append(name,symbol);last.append(p,change);b.append(first,last);b.onclick=()=>choose(a.id);$('#market-assets').append(b);watch.set(a.id,{b,p,change});
  }
  function renderWatch(){for(const a of L.assets){const w=watch.get(a.id),state=model.markets[a.id],before=state.history[state.history.length-2].close,change=(state.price/before-1)*100;w.b.hidden=a.type!==market;w.b.setAttribute('aria-pressed',String(a.id===selected));w.p.textContent=number(state.price,a.decimals);w.change.textContent=signed(change)+'%';tone(w.change,change);}}
  const positionRows=new Map(),orderRows=new Map(),emptyOrder=node('p','没有待成交委托。','market-empty');
  $('#market-orders').append(emptyOrder);
  function renderPositions(){
    for(const [id,row] of positionRows)if(!model.positions[id]){row.remove();positionRows.delete(id);}
    for(const [id,p] of Object.entries(model.positions)){
      const a=L.asset(id);let row=positionRows.get(id);
      if(!row){row=node('tr');const name=node('td',a.name);name.append(node('small',a.symbol));const action=node('td'),button=node('button','选择');button.type='button';button.onclick=()=>{side='sell';all('[data-market-side]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.marketSide===side)));choose(id);$('#market-quantity').value=String(L.availableQty(model,id));estimate();$('#market-quantity').focus({preventScroll:true});$('#market-form').scrollIntoView({block:'nearest',behavior:'smooth'});};action.append(button);row.append(name,node('td'),node('td'),node('td'),node('td'),action);positionRows.set(id,row);$('#market-positions').append(row);}
      const pnl=p.qty*model.markets[id].price-p.cost;row.children[1].textContent=number(p.qty,0)+' '+a.unit;row.children[2].textContent=number(p.cost/p.qty,a.decimals);row.children[3].textContent=number(p.qty*model.markets[id].price);row.children[4].textContent=signed(pnl);tone(row.children[4],pnl);
    }
    $('#market-empty').hidden=positionRows.size>0;$('#market-positions').closest('.market-table-scroll').hidden=positionRows.size===0;
    for(const [id,row] of orderRows)if(!model.orders.some(o=>o.id===id)){row.remove();orderRows.delete(id);}
    for(const order of model.orders)if(!orderRows.has(order.id)){const a=L.asset(order.asset),el=node('div',null,'market-order'),text=node('div');text.append(node('p',a.name+' · '+(order.side==='buy'?'买入':'卖出')),node('small',number(order.qty,0)+' '+a.unit+' @ '+number(order.limit,a.decimals)+' USD'));const cancel=node('button','撤单');cancel.type='button';cancel.dataset.marketCancel=String(order.id);cancel.onclick=()=>{try{L.cancel(model,order.id);say('已撤销委托，资金或持仓已释放。');render();}catch(e){say(e.message,true);}};el.append(text,cancel);orderRows.set(order.id,el);$('#market-orders').append(el);}
    emptyOrder.hidden=model.orders.length>0;$('#market-order-count').textContent=model.orders.length+' 笔';
  }
  function renderHistory(){const rows=model.trades.slice(0,30).map(trade=>{const a=L.asset(trade.asset),row=node('tr'),direction=node('td',trade.side==='buy'?'买入':'卖出'),pnl=node('td',trade.pnl===null?'—':signed(trade.pnl));tone(direction,trade.side==='buy'?1:-1);tone(pnl,trade.pnl||0);row.append(node('td','第 '+trade.day+' 日'),node('td',a.name),direction,node('td',number(trade.qty,0)+' '+a.unit),node('td',number(trade.price,a.decimals)),node('td',number(trade.fee)),pnl);return row;});$('#market-history').replaceChildren(...rows);$('#market-history-empty').hidden=rows.length>0;$('#market-history').closest('.market-table-scroll').hidden=rows.length===0;}
  function render(){
    const s=L.summary(model),a=L.asset(selected),q=L.quote(model,selected),previous=model.markets[selected].history.slice(-2)[0].close,change=(q.mid/previous-1)*100;best=Math.max(best,s.equity);
    $('#market-equity').textContent=number(s.equity);$('#market-record').textContent='本次最高 '+number(best);$('#market-cash').textContent=number(s.available);$('#market-reserved').textContent='挂单占用 '+number(s.reserved);$('#market-profit').textContent=signed(s.profit);$('#market-percent').textContent=signed(s.percent)+'%';tone($('#market-profit'),s.profit);tone($('#market-percent'),s.percent);$('#market-holdings').textContent=number(s.holdings);$('#market-realized').textContent='已实现 '+signed(s.realized);$('#market-unrealized').textContent='浮动盈亏 '+signed(s.unrealized)+' USD';tone($('#market-unrealized'),s.unrealized);
    $('#market-day').textContent='第 '+model.day+' 个交易日';$('#market-symbol').textContent=a.symbol;$('#market-name').textContent=a.name;$('#market-price').textContent=number(q.mid,a.decimals);$('#market-change').textContent=signed(change)+'%';tone($('#market-change'),change);$('#market-ask').textContent=number(q.buy,a.decimals);$('#market-bid').textContent=number(q.sell,a.decimals);renderWatch();renderPositions();renderHistory();estimate();
    $('#market-news').replaceChildren(...model.news.slice(0,6).map(item=>{const el=node('article');el.append(node('small','第 '+item.day+' 日 · 虚构消息'),node('strong',item.title),node('p',item.text));return el;}));drawSoon();
  }
  function series(){return model.markets[selected].history.slice(-range);}
  function geometry(){const rect=canvas.getBoundingClientRect(),w=rect.width,h=rect.height;return {w,h,left:8,right:Math.min(92,w*.30),top:16,bottom:28};}
  function paint(){
    frame=0;if(!active()||panel.hidden)return;const g=geometry();if(g.w<20||g.h<20)return;const ratio=Math.min(window.devicePixelRatio||1,3),width=Math.round(g.w*ratio),height=Math.round(g.h*ratio);if(canvas.width!==width)canvas.width=width;if(canvas.height!==height)canvas.height=height;ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,g.w,g.h);ctx.fillStyle='#12303b66';ctx.fillRect(0,0,g.w,g.h);
    const data=series(),a=L.asset(selected),plotW=g.w-g.left-g.right,plotH=g.h-g.top-g.bottom;let low=Math.min(...data.map(b=>b.low)),high=Math.max(...data.map(b=>b.high)),pad=Math.max((high-low)*.08,Math.pow(10,-a.decimals)*2);low-=pad;high+=pad;const y=p=>g.top+(high-p)/(high-low)*plotH,dx=plotW/data.length,x=i=>g.left+(i+.5)*dx;
    ctx.font='11px "Microsoft YaHei",sans-serif';ctx.lineWidth=1;ctx.textAlign='left';
    for(let i=0;i<=4;i++){const p=low+(high-low)*i/4,py=y(p);ctx.strokeStyle='#c4ddd51a';ctx.beginPath();ctx.moveTo(g.left,py);ctx.lineTo(g.left+plotW,py);ctx.stroke();ctx.fillStyle='#b3c5c0';ctx.fillText(p.toFixed(a.decimals),g.left+plotW+8,py+4);}
    if(chart==='candle')data.forEach((b,i)=>{ctx.strokeStyle=ctx.fillStyle=b.close>=b.open?'#a9d5b5':'#e6aaa1';ctx.beginPath();ctx.moveTo(x(i),y(b.high));ctx.lineTo(x(i),y(b.low));ctx.stroke();const bw=Math.max(1,dx*.6);ctx.fillRect(x(i)-bw/2,Math.min(y(b.open),y(b.close)),bw,Math.max(1,Math.abs(y(b.open)-y(b.close))));});
    else{ctx.strokeStyle='#b6dedc';ctx.lineWidth=2;ctx.beginPath();data.forEach((b,i)=>{if(i===0)ctx.moveTo(x(i),y(b.close));else ctx.lineTo(x(i),y(b.close));});ctx.stroke();ctx.lineTo(x(data.length-1),g.top+plotH);ctx.lineTo(x(0),g.top+plotH);ctx.closePath();const fill=ctx.createLinearGradient(0,g.top,0,g.h);fill.addColorStop(0,'#b6dedc33');fill.addColorStop(1,'#b6dedc00');ctx.fillStyle=fill;ctx.fill();}
    ctx.font='10px "Microsoft YaHei",sans-serif';ctx.fillStyle='#8da6a7';ctx.textAlign='center';[0,Math.floor((data.length-1)/2),data.length-1].forEach(i=>ctx.fillText('D'+data[i].day,x(i),g.h-8));
    const index=hover===null?data.length-1:Math.max(0,Math.min(data.length-1,hover)),b=data[index];
    if(hover!==null){ctx.strokeStyle='#e7edd7aa';ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(x(index),g.top);ctx.lineTo(x(index),g.top+plotH);ctx.moveTo(g.left,y(b.close));ctx.lineTo(g.left+plotW,y(b.close));ctx.stroke();ctx.setLineDash([]);}
    $('#market-chart-readout').textContent='第 '+b.day+' 日 · 开 '+number(b.open,a.decimals)+' / 高 '+number(b.high,a.decimals)+' / 低 '+number(b.low,a.decimals)+' / 收 '+number(b.close,a.decimals)+(b.day<0?'（开局历史行情）':'');
  }
  function drawSoon(){if(!frame)frame=requestAnimationFrame(paint);}
  canvas.addEventListener('pointermove',event=>{const rect=canvas.getBoundingClientRect(),g=geometry();hover=Math.floor((event.clientX-rect.left-g.left)/(g.w-g.left-g.right)*series().length);drawSoon();});
  canvas.addEventListener('pointerleave',()=>{hover=null;drawSoon();});canvas.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End','Escape'].includes(event.key)){event.preventDefault();const n=series().length;hover=event.key==='Escape'?null:event.key==='Home'?0:event.key==='End'?n-1:Math.max(0,Math.min(n-1,(hover??n-1)+(event.key==='ArrowLeft'?-1:1)));drawSoon();}});
  function tick(){if(!active()){stopClock();return;}const previous=model.news[0],filled=L.step(model);hover=null;render();if(filled.length)say(filled.length+' 笔限价委托已成交。');if(model.news[0]!==previous){const n=model.news[0];window.MarketNotice.show({title:n.title,text:n.text,meta:'股票市场消息 · 第 '+n.day+' 日 · 虚构消息'});}}
  function stopClock(){if(clock!==null)clearInterval(clock);clock=null;}
  function ensureClock(restart=false){if(!active()){stopClock();return;}if(clock!==null&&!restart)return;stopClock();clock=setInterval(tick,Number($('#market-speed').value));}
  $('#market-speed').addEventListener('change',()=>ensureClock(true));
  function selectMarket(type){$('#market-stock').hidden=type!=='stock';$('#market-forex').hidden=type!=='forex';all('[data-market-type]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.marketType===type)));$('#market-intro-copy').textContent=type==='stock'?'股票账户：100,000 USD 起始资金。':'普通外汇模拟：10,000 USD 独立账户，保证金与多空交易。';route();document.dispatchEvent(new CustomEvent('market:typechange',{detail:{type}}));}
  all('[data-market-type]').forEach(b=>b.onclick=()=>selectMarket(b.dataset.marketType));
  all('[data-market-side]').forEach(b=>b.onclick=()=>{side=b.dataset.marketSide;all('[data-market-side]').forEach(el=>el.setAttribute('aria-pressed',String(el===b)));estimate();});
  for(const [selector,key] of [['[data-market-chart]','marketChart'],['[data-market-range]','marketRange']])all(selector).forEach(b=>b.onclick=()=>{if(key==='marketChart')chart=b.dataset[key];else range=Number(b.dataset[key]);hover=null;all(selector).forEach(el=>el.setAttribute('aria-pressed',String(el===b)));drawSoon();});
  $('#market-order-type').addEventListener('change',estimate);for(const id of ['market-quantity','market-limit'])$('#'+id).addEventListener('input',estimate);
  all('[data-market-fraction]').forEach(b=>b.onclick=()=>{const a=L.asset(selected),max=L.affordable(model,selected,side,orderType(),limit());$('#market-quantity').value=String(Math.floor(max*Number(b.dataset.marketFraction)/a.lot)*a.lot);estimate();});
  $('#market-form').addEventListener('submit',event=>{event.preventDefault();try{if(!$('#market-quantity').value.trim())throw Error('请输入交易数量。');if(orderType()==='limit'&&!$('#market-limit').value.trim())throw Error('请输入限价。');const result=L.place(model,{asset:selected,side,qty:quantity(),type:orderType(),limit:limit()});say(result.kind==='pending'?'限价委托已提交，相关资金或持仓已预留。':(side==='buy'?'买入':'卖出')+'已成交 · '+number(result.trade.qty,0)+' '+L.asset(selected).unit+' @ '+number(result.trade.price,L.asset(selected).decimals)+' USD');render();}catch(error){say(error.message,true);estimate();}});
  function disarm(){resetArmed=false;clearTimeout(resetClock);$('#market-reset').textContent='重置模拟';}
  $('#market-reset').onclick=()=>{if(!resetArmed){resetArmed=true;$('#market-reset').textContent='再次点击确认重置';resetClock=setTimeout(disarm,5000);return;}disarm();window.MarketNotice.clear();stopClock();model=L.create(Math.floor(Math.random()*4294967296));hover=null;configure();say('已开始新的一局，模拟资金恢复为 100,000.00 USD。');render();ensureClock();};
  function route(){if(!active()){stopClock();disarm();if(frame){cancelAnimationFrame(frame);frame=0;}}else{render();drawSoon();ensureClock();}}
  document.addEventListener('site:pagechange',route);document.addEventListener('visibilitychange',route);window.addEventListener('pagehide',()=>{stopClock();disarm();});window.addEventListener('resize',drawSoon);if(window.ResizeObserver)new ResizeObserver(drawSoon).observe(canvas);
  configure();render();route();
})();
