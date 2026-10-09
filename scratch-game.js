(() => {
  'use strict';
  const L=window.ScratchLogic,$=s=>document.querySelector(s),canvas=$('#scratch-canvas');if(!canvas||!L)return;
  const ctx=canvas.getContext('2d'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
  let state=L.fresh(),frame=0,lastTime=0,dirty=true,drag=null,coatingCard=null,coatings=[],particles=[],gatherUntil=0,confirmAction=null,toastTimer=0,dishCard=null,dishLayer=null,dishCursor={x:360,y:265};
  const active=()=>!document.hidden&&!$('#page-games').hidden&&!$('#game-scratch').hidden&&!$('#games-workspace').hidden;
  const isDish=()=>state.activity==='dish';
  const number=n=>new Intl.NumberFormat('zh-CN',{maximumFractionDigits:0}).format(n),pending=()=>isDish()?state.dish&&!state.dish.finished:state.current&&!state.current.finished;
  const exchange=window.GameExchange,exchangePanel=$('#scratch-exchange'),exchangeSource=$('#scratch-exchange-source'),exchangeAmount=$('#scratch-exchange-amount');
  function exchangeEntry(){return exchange?.list().find(entry=>entry.id===exchangeSource.value);}
  function updateExchange(){
    if(!exchange){exchangePanel.hidden=true;return;}
    const entry=exchangeEntry();if(!entry)return;
    exchangeAmount.step=entry.cost;exchangeAmount.min=entry.cost;exchangeAmount.max=entry.maxUnits;exchangeAmount.disabled=Boolean(confirmAction);
    if(exchangeSource.disabled!==Boolean(confirmAction))exchangeSource.disabled=Boolean(confirmAction);
    $('#scratch-exchange-balance').textContent=number(entry.balance)+' '+entry.unit;
    $('#scratch-exchange-rate').textContent=entry.cost+' '+entry.unit+' = '+entry.reward+' 刮刮乐金币';
    $('#scratch-exchange-unit').textContent='消耗'+entry.unit;
    $('#scratch-exchange-play').href='#games/'+entry.id;
    const units=Number(exchangeAmount.value);let message='',ready=false;
    try{const quote=exchange.quote(entry.id,units);if(quote.coins>1e12-state.coins)throw Error('刮刮乐金币已接近上限。');message='可获得 '+number(quote.coins)+' 金币 · 兑换后剩余 '+number(entry.balance-units)+' '+entry.unit;ready=true;}
    catch(error){message=entry.maxUnits===0?'继续游玩即可积累兑换余额。':error.message;}
    $('#scratch-exchange-preview').textContent=message;
    $('#scratch-exchange-submit').disabled=!ready||Boolean(confirmAction);
    $('#scratch-exchange-all').disabled=!entry.maxUnits||Boolean(confirmAction);
  }
  exchangeSource.addEventListener('change',()=>{exchangeAmount.value=exchangeEntry()?.cost||1;updateExchange();});
  exchangeAmount.addEventListener('input',updateExchange);
  $('#scratch-exchange-all').addEventListener('click',()=>{exchangeAmount.value=exchangeEntry()?.maxUnits||0;updateExchange();});
  $('#scratch-exchange-form').addEventListener('submit',event=>{
    event.preventDefault();if(!exchange||confirmAction)return;
    try{const receipt=exchange.exchange(exchangeSource.value,Number(exchangeAmount.value),1e12-state.coins);L.credit(state,receipt.coins);changed();toast('兑换 +'+number(receipt.coins));$('#scratch-exchange-status').textContent='已消耗 '+number(receipt.units)+' '+receipt.name+receipt.unit+'，获得 '+number(receipt.coins)+' 刮刮乐金币。';}
    catch(error){$('#scratch-exchange-status').textContent=error.message;updateExchange();}
  });
  document.addEventListener('game:exchangechange',()=>{if(active())updateExchange();});
  function changed(){dirty=true;update();schedule();}
  function status(text){$('#scratch-status').textContent=text;}
  function round(x,y,w,h,r=12){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
  function symbol(target,id,x,y,size,color){target.save();target.translate(x,y);target.scale(size/30,size/30);target.strokeStyle=color;target.fillStyle=color;target.lineWidth=1.8;target.lineCap='round';target.lineJoin='round';target.beginPath();
    if(id===0){for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?6.5:14;const px=Math.cos(a)*r,py=Math.sin(a)*r;i?target.lineTo(px,py):target.moveTo(px,py);}target.closePath();target.stroke();}
    else if(id===1){target.arc(0,0,13,.2*Math.PI,1.8*Math.PI);target.bezierCurveTo(-2,-8,-3,9,10.5,7.6);target.stroke();}
    else if(id===2){for(let i=0;i<5;i++){target.save();target.rotate(i*Math.PI*2/5);target.beginPath();target.ellipse(0,-8,4.3,7,0,0,Math.PI*2);target.stroke();target.restore();}target.beginPath();target.arc(0,0,2,0,Math.PI*2);target.fill();}
    else if(id===3){target.moveTo(-13,-5);target.lineTo(-7,-12);target.lineTo(7,-12);target.lineTo(13,-5);target.lineTo(0,14);target.closePath();target.moveTo(-13,-5);target.lineTo(13,-5);target.moveTo(-7,-12);target.lineTo(0,-5);target.lineTo(7,-12);target.moveTo(0,-5);target.lineTo(0,14);target.stroke();}
    else if(id===4){target.moveTo(-11,10);target.quadraticCurveTo(-15,-12,12,-12);target.quadraticCurveTo(15,12,-11,10);target.moveTo(-11,10);target.lineTo(8,-8);target.stroke();}
    else if(id===5){target.arc(0,0,7,0,Math.PI*2);target.stroke();for(let i=0;i<8;i++){target.rotate(Math.PI/4);target.beginPath();target.moveTo(0,-10);target.lineTo(0,-14);target.stroke();}}
    else if(id===6){for(let y=-8;y<=8;y+=8){target.beginPath();target.moveTo(-13,y);target.bezierCurveTo(-5,y-8,5,y+8,13,y);target.stroke();}}
    else if(id===7){target.moveTo(-10,9);target.bezierCurveTo(-20,6,-14,-5,-7,-3);target.bezierCurveTo(-8,-16,12,-16,11,-3);target.bezierCurveTo(21,-3,20,10,10,9);target.closePath();target.stroke();}
    else if(id===8){target.arc(-5,-5,7,0,Math.PI*2);target.moveTo(0,0);target.lineTo(12,12);target.moveTo(7,7);target.lineTo(11,3);target.moveTo(11,11);target.lineTo(15,7);target.stroke();}
    else if(id===9){target.moveTo(-12,9);target.quadraticCurveTo(-6,7,-7,-4);target.bezierCurveTo(-7,-16,7,-16,7,-4);target.quadraticCurveTo(6,7,12,9);target.closePath();target.moveTo(-3,12);target.quadraticCurveTo(0,17,3,12);target.stroke();}
    else if(id===10){target.arc(0,0,10,0,Math.PI*2);target.stroke();target.beginPath();target.ellipse(0,0,17,5,-.5,0,Math.PI*2);target.stroke();}
    else{target.moveTo(-10,12);target.lineTo(10,-12);target.quadraticCurveTo(18,-4,6,7);target.quadraticCurveTo(-2,14,-10,12);target.moveTo(-4,5);target.lineTo(4,5);target.moveTo(1,-1);target.lineTo(9,-1);target.stroke();}
    target.restore();
  }
  function update(){
    updateExchange();
    $('#scratch-coins').textContent=number(state.coins);$('#scratch-earned').textContent=number(state.earned);$('#scratch-completed').textContent=number(isDish()?state.dishes:state.cards);$('#scratch-count-label').textContent=isDish()?'已刷干净盘子':'已完成票卡';$('#scratch-best').textContent=number(state.best);
    const ticket=L.tickets[state.selected],inProgress=pending(),c=state.current,washing=isDish(),dish=state.dish;
    $('#scratch-buy').textContent=washing?(inProgress?'正在刷盘子':dish?.finished?'再领一个盘子 · 免费':'领取脏盘子 · 免费'):'购入'+ticket.name+' · '+number(ticket.cost);$('#scratch-buy').disabled=Boolean(inProgress)||(!washing&&(state.coins<ticket.cost||state.earned<ticket.unlock))||Boolean(confirmAction);
    $('#scratch-next').hidden=washing;$('#scratch-next').disabled=!inProgress||Boolean(confirmAction);$('#scratch-discard').disabled=!inProgress||Boolean(confirmAction);$('#scratch-discard').textContent=washing?'放弃这个盘子':'放弃当前票卡';
    document.querySelectorAll('[data-scratch-tier]').forEach(button=>{const tier=Number(button.dataset.scratchTier),t=L.tickets[tier],unlocked=state.earned>=t.unlock;button.disabled=!unlocked||Boolean(confirmAction);button.setAttribute('aria-pressed',String(!washing&&state.selected===tier));$('[data-scratch-lock="'+tier+'"]').textContent=unlocked?'已解锁':'还需 '+number(t.unlock-state.earned)+' 奖励';});
    document.querySelectorAll('[data-scratch-upgrade]').forEach(button=>{const k=button.dataset.scratchUpgrade,price=L.cost(state,k);$('#scratch-level-'+k).textContent='Lv.'+state.levels[k];button.disabled=price===null||state.coins<price||Boolean(confirmAction);button.textContent=price===null?'已满级':number(price)+' 金币';});
    $('#scratch-dish-choice').disabled=Boolean(confirmAction);$('#scratch-dish-choice').setAttribute('aria-pressed',String(washing));
    if(washing){
      const percent=dish?Math.floor(dish.count/L.DISH_POINTS.length*100):0;
      canvas.setAttribute('aria-label','刷盘子：鼠标或手指拖动擦掉污渍；键盘方向键移动海绵擦洗。');
      $('#scratch-rule-title').textContent='刷盘子 · 免费赚金币';$('#scratch-rule-description').textContent='免费领取脏盘子，按住鼠标或手指拖动擦洗，擦净污渍后获得 10 金币。';
      $('#scratch-rule-live').textContent=dish?.finished?'这个盘子已洗干净，10 金币已入账。':dish?'已清洁 '+percent+'%，继续把污渍刷干净。':'随时免费领取一个盘子，不消耗金币。';
      $('#scratch-progress-fill').style.width=percent+'%';$('#scratch-progress-text').textContent=dish?'清洁进度 '+percent+'%':'等待领取脏盘子';$('#scratch-card-result').textContent=dish?.finished?'已获得 10 金币':'洗净奖励 10 金币';return;
    }
    canvas.setAttribute('aria-label','刮刮乐票卡，鼠标或手指拖动刮开；空格刮开下一格。');
    const shown=L.tickets[c?c.tier:state.selected];$('#scratch-rule-title').textContent=shown.name+' · '+shown.mode;$('#scratch-rule-description').textContent=shown.description;
    const result=c?.tier===2?L.bingo(c):null;
    $('#scratch-rule-live').textContent=!c?'购入一张票卡，开始'+shown.mode+'。':c.tier===0?'已核对 '+c.paid.filter(Boolean).length+' / 3 局，每局独立兑奖':c.tier===1?'中奖号码：'+c.targets.map(n=>String(n).padStart(2,'0')).join(' / ')+'；翻倍号码：'+String(c.doubleNumber).padStart(2,'0'):c.tier===2?'已点亮 '+result.marked.filter(Boolean).length+' / 25 格，'+result.lines.length+' 条连线'+(result.corners?'，四角完成':'')+(result.cross?'，X 形完成':'')+(c.finished?'，已统一兑奖':'；刮完叫号后统一兑奖'):'已完成 '+c.paid.filter(Boolean).length+' / 6 条路线，各路线独立兑奖';
    const revealed=c?c.tiles.filter(t=>t.revealed).length:0,count=c?c.tiles.length:L.tileCount(state.selected),progress=c?c.tiles.reduce((sum,t)=>sum+(t.revealed?1:t.count/(L.GRID*L.GRID)),0)/count:0,unit=c?.tier===2?' 个叫号':c?.tier===3?' 个图符':' 格';
    $('#scratch-progress-fill').style.width=(progress*100).toFixed(1)+'%';$('#scratch-progress-text').textContent=c?'已揭晓 '+revealed+' / '+count+unit+(c.finished?' · 已兑奖':''):'等待购入票卡';$('#scratch-card-result').textContent=c?'本票已兑奖 '+number(c.gain):shown.mode;
    $('#scratch-save-note').textContent='进度仅在本次页面中保留，刷新或关闭页面后清空。';
  }
  function coatingsFor(card){if(coatingCard===card)return;coatingCard=card;coatings=card?card.tiles.map((tile,i)=>{const r=L.rect(i,card.tier),layer=document.createElement('canvas');layer.width=r.w;layer.height=r.h;const cx=layer.getContext('2d'),gradient=cx.createLinearGradient(0,0,r.w,r.h),colors=[['#ccd5ca','#aebdb3'],['#cbdee4','#aac4ce'],['#e2d8b7','#c8b77d'],['#e2c9b6','#c49f83']][card.tier];gradient.addColorStop(0,colors[0]);gradient.addColorStop(1,colors[1]);cx.fillStyle=gradient;cx.fillRect(0,0,r.w,r.h);cx.strokeStyle='#ffffff36';cx.lineWidth=1;for(let k=-r.h;k<r.w;k+=14){cx.beginPath();cx.moveTo(k,0);cx.lineTo(k+r.h,r.h);cx.stroke();}cx.fillStyle='#46685e';cx.font='13px "Microsoft YaHei",sans-serif';cx.textAlign='center';cx.fillText(['刮开图符','刮开号码','刮开号码','幸运图符'][card.tier],r.w/2,r.h/2+5);return {layer,ctx:cx,erased:Array(L.GRID*L.GRID).fill(0)};}):[];}
  function tileArt(c,t,r){
    const x=r.x+r.w/2,color=c.tier===1?'#558898':c.tier===2?'#9c7c39':['#b69547','#669991','#b78777','#709da6'][t.symbol%4];ctx.textAlign='center';ctx.fillStyle=color;
    if(c.tier===1){ctx.font='30px "Microsoft YaHei",sans-serif';ctx.fillText(String(t.number).padStart(2,'0'),x,r.y+39);ctx.font='12px "Microsoft YaHei",sans-serif';ctx.fillText('奖金 '+number(L.amount(c,t.factor)),x,r.y+63);if(t.number===c.doubleNumber){ctx.fillStyle='#a16c45';ctx.font='10px "Microsoft YaHei",sans-serif';ctx.fillText('翻倍中奖 ×2',x,r.y+80);}}
    else if(c.tier===2){ctx.font='20px "Microsoft YaHei",sans-serif';ctx.fillText(String(t.number).padStart(2,'0'),x,r.y+27);}
    else if(c.tier===3){symbol(ctx,t.symbol,x,r.y+20,25,color);ctx.font='10px "Microsoft YaHei",sans-serif';ctx.fillText(L.symbols[t.symbol].name,x,r.y+43);}
    else{symbol(ctx,t.symbol,x,r.y+34,37,color);ctx.font='11px "Microsoft YaHei",sans-serif';ctx.fillText(L.symbols[t.symbol].name,x,r.y+72);}
  }
  function drawBingo(c){
    const result=c?L.bingo(c):null;ctx.textAlign='center';ctx.fillStyle='#8f7e4d';ctx.font='12px "Microsoft YaHei",sans-serif';['B','I','N','G','O'].forEach((label,i)=>ctx.fillText(label,60+i*50,129));
    for(let i=0;i<25;i++){
      const r=L.bingoRect(i),free=i===12,matched=free||result?.marked[i],line=result?.lines.some(p=>p.includes(i));ctx.fillStyle=matched?'#e9dba9':'#fbf9ef';round(r.x,r.y,r.w,r.h,7);ctx.fill();ctx.strokeStyle=line?'#be9e40':'#ddd8bd';ctx.lineWidth=line?2:1;ctx.stroke();ctx.lineWidth=1;ctx.fillStyle=matched?'#937337':'#809082';
      if(free){symbol(ctx,0,r.x+r.w/2,r.y+17,19,'#b89843');ctx.font='10px "Microsoft YaHei",sans-serif';ctx.fillText('自由格',r.x+r.w/2,r.y+38);}
      else{ctx.font='18px "Microsoft YaHei",sans-serif';ctx.fillText(c?String(c.board[i]).padStart(2,'0'):'--',r.x+r.w/2,r.y+31);}
    }
    ctx.font='10px "Microsoft YaHei",sans-serif';ctx.fillStyle='#7c826c';ctx.fillText('1 线 200 · 2 线 400 · 3+ 线 1000',165,411);ctx.fillText('四角 800 · X 形 2000 · 只领最高奖级',165,427);
  }
  function drawRoutes(c){
    const found=new Set(c?c.tiles.filter(t=>t.revealed).map(t=>t.symbol):[]);const layouts=[3,3,4,4,5,5];
    for(let n=0;n<6;n++){
      const y=246+n*30,route=c?.routes[n],paid=c?.paid[n];ctx.fillStyle=paid?'#dbc38d44':'#e6ddca44';round(34,y,652,27,7);ctx.fill();ctx.textAlign='left';ctx.fillStyle='#7a806d';ctx.font='11px "Microsoft YaHei",sans-serif';ctx.fillText('路线 '+(n+1),46,y+18);
      const list=route?route.symbols:Array.from({length:layouts[n]},(_,i)=>(n+i)%12);
      list.forEach((id,k)=>{const x=150+k*82,lit=found.has(id);ctx.fillStyle=lit?'#e7d393':'#f5f1e3';round(x-21,y+2,42,23,6);ctx.fill();symbol(ctx,id,x,y+13,21,lit?'#9a7f35':'#a5ac9c');if(k<list.length-1){ctx.strokeStyle=paid?'#bea35e':'#bbbda966';ctx.beginPath();ctx.moveTo(x+25,y+13);ctx.lineTo(x+57,y+13);ctx.stroke();}});
      ctx.textAlign='right';ctx.fillStyle=paid?'#9a7634':'#8f8269';ctx.font='12px "Microsoft YaHei",sans-serif';ctx.fillText(route?number(L.amount(c,route.factor))+' 金币':'待购票',674,y+18);
    }
  }
  function drawDish(){
    ctx.clearRect(0,0,720,510);ctx.fillStyle='#edf3eb';ctx.fillRect(0,0,720,510);ctx.strokeStyle='#d5dfd1';ctx.lineWidth=1;round(14,14,692,482,14);ctx.stroke();ctx.textAlign='left';ctx.fillStyle='#244b41';ctx.font='23px "Microsoft YaHei",sans-serif';ctx.fillText('微光厨房 · 刷盘子',42,56);ctx.font='11px "Microsoft YaHei",sans-serif';ctx.fillStyle='#71847a';ctx.fillText('免费领取 / 用海绵擦干净每一处污渍',43,80);ctx.textAlign='right';ctx.font='12px "Microsoft YaHei",sans-serif';ctx.fillText('洗净奖励 10 金币',678,54);
    const plate=ctx.createRadialGradient(345,245,20,360,265,162);plate.addColorStop(0,'#fffef5');plate.addColorStop(.86,'#f8faf1');plate.addColorStop(1,'#d7e3d8');ctx.fillStyle=plate;ctx.beginPath();ctx.arc(360,265,162,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#a8c4b3';ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.arc(360,265,149,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(360,265,142,0,Math.PI*2);ctx.strokeStyle='#d9e4d6';ctx.lineWidth=1;ctx.stroke();symbol(ctx,0,360,253,42,'#a7bfad');ctx.textAlign='center';ctx.fillStyle='#95ab99';ctx.font='13px "Microsoft YaHei",sans-serif';ctx.fillText('STAR MOON',360,292);
    const d=state.dish;
    if(d&&!d.finished){
      if(dishCard!==d){
        dishCard=d;const layer=document.createElement('canvas');layer.width=280;layer.height=280;const cx=layer.getContext('2d');cx.save();cx.beginPath();cx.arc(140,140,140,0,Math.PI*2);cx.clip();const mud=cx.createLinearGradient(0,0,280,280);mud.addColorStop(0,'#bba06b');mud.addColorStop(1,'#94825b');cx.fillStyle=mud;cx.fillRect(0,0,280,280);let seed=73;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
        for(let i=0;i<70;i++){cx.fillStyle=i%2?'#6e653d55':'#dbc19a88';cx.beginPath();cx.ellipse(random()*280,random()*280,4+random()*25,3+random()*16,random()*Math.PI,0,Math.PI*2);cx.fill();}cx.restore();dishLayer={layer,ctx:cx,erased:Array(L.DISH_GRID*L.DISH_GRID).fill(0)};
      }
      const layer=dishLayer;layer.ctx.globalCompositeOperation='destination-out';for(const point of L.DISH_POINTS){const n=point.index;if(d.cover[n]&&!layer.erased[n]){const col=n%L.DISH_GRID,row=Math.floor(n/L.DISH_GRID),x=Math.floor(col*280/L.DISH_GRID),y=Math.floor(row*280/L.DISH_GRID);layer.ctx.fillRect(x,y,Math.ceil((col+1)*280/L.DISH_GRID)-x,Math.ceil((row+1)*280/L.DISH_GRID)-y);layer.erased[n]=1;}}layer.ctx.globalCompositeOperation='source-over';ctx.drawImage(layer.layer,220,125);
    }
    ctx.textAlign='center';ctx.font='12px "Microsoft YaHei",sans-serif';ctx.fillStyle='#71847a';ctx.fillText(!d?'领取一个脏盘子，开始擦洗。':d.finished?'盘子已经焕然一新，10 金币已入账。':'按住鼠标或手指来回擦洗，方向键也可以移动海绵。',360,461);ctx.font='10px "Microsoft YaHei",sans-serif';ctx.fillText('免费劳动奖励 · 每个盘子只结算一次 · 本次页面内保留进度',360,480);
    if(d&&!d.finished){const cursor=drag||dishCursor;ctx.strokeStyle='#a5d7cb';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cursor.x,cursor.y,24+state.levels.brush*5,0,Math.PI*2);ctx.stroke();ctx.lineWidth=1;}
  }
  function draw(){
    if(!ctx)return;if(isDish()){drawDish();return;}ctx.clearRect(0,0,720,510);ctx.fillStyle='#f3efdf';ctx.fillRect(0,0,720,510);ctx.strokeStyle='#ddd8bd';ctx.lineWidth=1;round(14,14,692,482,14);ctx.stroke();
    const c=state.current,tier=c?c.tier:state.selected,ticket=L.tickets[tier];ctx.fillStyle=ticket.color;round(28,29,5,51,2);ctx.fill();ctx.textAlign='left';ctx.fillStyle='#244b41';ctx.font='23px "Microsoft YaHei",sans-serif';ctx.fillText(ticket.name+' · '+ticket.mode,49,57);ctx.font='11px "Microsoft YaHei",sans-serif';ctx.fillStyle='#71847a';ctx.fillText('星月票务所 / 购入时固定票面与奖金',49,79);ctx.textAlign='right';ctx.font='12px "Microsoft YaHei",sans-serif';ctx.fillText('票价 '+ticket.cost+' 金币',676,52);ctx.fillText('STAR MOON · '+String(state.cards+(c&&!c.finished?1:0)).padStart(5,'0'),676,77);
    ctx.textAlign='center';ctx.fillStyle='#71847a';ctx.font='12px "Microsoft YaHei",sans-serif';
    if(tier===0)ctx.fillText('每一横行为一局，三个相同图符才中奖',360,103);
    else if(tier===1){ctx.textAlign='left';ctx.fillText(c?'中奖号码： '+c.targets.map(n=>String(n).padStart(2,'0')).join(' / '):'中奖号码： -- / -- / --',45,103);ctx.textAlign='right';ctx.fillStyle='#a16c45';ctx.fillText('翻倍号码： '+(c?String(c.doubleNumber).padStart(2,'0'):'--')+'  ×2',675,103);}
    else if(tier===2){ctx.fillText('宾果卡',165,103);ctx.fillText('刮开 24 个叫号，卡片自动点亮',514,103);drawBingo(c);}
    else{ctx.fillText('刮开八个幸运图符，点亮下方寻宝路线',360,103);drawRoutes(c);}
    coatingsFor(c);
    for(let i=0;i<L.tileCount(tier);i++){
      const r=L.rect(i,tier),tile=c?.tiles[i];ctx.fillStyle='#fbf9ef';round(r.x,r.y,r.w,r.h,tier===2?6:9);ctx.fill();ctx.strokeStyle='#ddd8bd';ctx.stroke();
      if(!tile){if(tier===1||tier===2){ctx.fillStyle='#bfcfc8';ctx.font=(tier===2?'20':'28')+'px sans-serif';ctx.textAlign='center';ctx.fillText('?',r.x+r.w/2,r.y+r.h*.65);}else symbol(ctx,tier===3?i:i%4,r.x+r.w/2,r.y+r.h/2,tier===3?26:36,'#c9d5c8');continue;}
      tileArt(c,tile,r);
      if(!tile.revealed){const coat=coatings[i];coat.ctx.globalCompositeOperation='destination-out';for(let n=0;n<tile.cover.length;n++)if(tile.cover[n]&&!coat.erased[n]){coat.ctx.fillRect((n%L.GRID)*r.w/L.GRID,Math.floor(n/L.GRID)*r.h/L.GRID,r.w/L.GRID+.2,r.h/L.GRID+.2);coat.erased[n]=1;}coat.ctx.globalCompositeOperation='source-over';ctx.save();round(r.x,r.y,r.w,r.h,tier===2?6:9);ctx.clip();ctx.drawImage(coat.layer,r.x,r.y);ctx.restore();}
      else{ctx.strokeStyle=L.winning(c,i)?'#bca45799':'#9cbaa833';ctx.lineWidth=2;round(r.x+1,r.y+1,r.w-2,r.h-2,tier===2?5:8);ctx.stroke();ctx.lineWidth=1;}
    }
    if(tier===0)for(let row=0;row<3;row++){const y=118+row*104,win=c&&L.winning(c,row*3);ctx.fillStyle=win?'#e7dab355':'#e6e4d340';round(546,y,140,90,9);ctx.fill();ctx.textAlign='center';ctx.fillStyle='#7c8973';ctx.font='11px "Microsoft YaHei",sans-serif';ctx.fillText('第 '+(row+1)+' 局奖金',616,y+25);ctx.fillStyle='#876f39';ctx.font='21px "Microsoft YaHei",sans-serif';ctx.fillText(c?number(L.amount(c,c.rowFactors[row])):'--',616,y+52);ctx.font='10px "Microsoft YaHei",sans-serif';ctx.fillText(win?'已中奖':c?.paid[row]?'未中奖':'三同图符领取',616,y+74);}
    ctx.textAlign='center';ctx.fillStyle='#71847a';ctx.font='12px "Microsoft YaHei",sans-serif';ctx.fillText(!c?'购入票卡后刮开兑奖。':c.finished?(c.gain?'本票兑奖 '+number(c.gain)+' 金币，欢迎查看下一张。':'本票未中奖，可以购入下一张。'):ticket.description,360,461);ctx.font='10px "Microsoft YaHei",sans-serif';ctx.fillText('原创模拟即开票 · 票面在购入时确定 · 虚拟金币',360,480);
    ctx.strokeStyle='#ddd8bd';ctx.setLineDash([3,6]);ctx.beginPath();ctx.moveTo(32,435);ctx.lineTo(688,435);ctx.stroke();ctx.setLineDash([]);
    for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/p.duration);symbol(ctx,0,p.x,p.y,p.size,'#bf9d50');}ctx.globalAlpha=1;
    if(drag){ctx.strokeStyle='#446b5b77';ctx.beginPath();ctx.arc(drag.x,drag.y,14+state.levels.brush*5,0,Math.PI*2);ctx.stroke();}
  }
  function toast(text,loss=false){const node=$('#scratch-toast');clearTimeout(toastTimer);node.className='scratch-toast'+(loss?' loss':'');node.textContent=text;void node.offsetWidth;node.classList.add('show');toastTimer=setTimeout(()=>node.classList.remove('show'),950);}
  function events(items){
    let win=0;for(const e of items){
      if(e.kind==='win'){win+=e.amount;if(!reduce.matches){const index=e.index??(e.row!==undefined?e.row*3+1:4),r=L.rect(index,state.current.tier);for(let i=0;i<16;i++)particles.push({x:r.x+r.w/2,y:r.y+r.h/2,vx:(Math.random()-.5)*180,vy:-60-Math.random()*130,life:900,duration:900,size:5+Math.random()*7});}}
      if(e.kind==='finish')status('本卡完成：'+(state.current.gain?'兑奖 '+number(state.current.gain):'未中奖')+'，扣除票价后的净收益 '+(e.net>=0?'+':'')+number(e.net)+' 金币。');
    }
    if(win)toast('中奖 +'+number(win));
    if(items.length&&!items.some(e=>e.kind==='finish')){const revealed=items.filter(e=>e.kind==='reveal').at(-1);status(win?'兑奖 '+number(win)+' 金币，奖金已入账。':revealed?'揭晓第 '+(revealed.index+1)+' 格：'+L.tileLabel(state.current,state.current.tiles[revealed.index])+(state.current.tier===2?'。宾果卡已自动标记，叫号刮完后兑奖。':state.current.tier===3?'。同类路线图符已自动点亮。':'。'): '继续刮开涂层。');}
  }
  function buy(){if(isDish()){try{L.startDish(state);dishCard=null;dishCursor={x:360,y:265};status('已免费领取一个脏盘子。按住鼠标或手指擦洗，洗净后获得 10 金币。');changed();}catch(e){status(e.message);}return;}try{L.buy(state);coatingCard=null;status('购入'+L.tickets[state.current.tier].name+'。'+L.tickets[state.current.tier].description+'。');changed();}catch(e){status(e.message);}}
  function next(){if(isDish()||!active()||!pending()||confirmAction)return;events(L.next(state));changed();}
  function schedule(){if(!frame&&active())frame=requestAnimationFrame(tick);}
  function tick(now){frame=0;if(!active()){pause();return;}const dt=lastTime?Math.min(100,now-lastTime):0;lastTime=now;
    for(const p of particles){p.life-=dt;p.x+=p.vx*dt/1000;p.y+=p.vy*dt/1000;p.vy+=220*dt/1000;}particles=particles.filter(p=>p.life>0).slice(-80);
    if(dirty||particles.length||drag)draw();dirty=false;if(particles.length||drag)schedule();else lastTime=0;
  }
  function pause(){drag=null;cancelAnimationFrame(frame);frame=0;lastTime=0;particles=[];update();}
  function position(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*720,y:(e.clientY-r.top)/r.height*510};}
  function scrape(from,to){if(isDish()){const cleaned=L.scrubDish(state,from,to,24+state.levels.brush*5);if(cleaned.changed){if(cleaned.reward){toast('刷盘子 +10');status('盘子已洗干净，获得 10 金币。可以再免费领一个。');}changed();}return;}const result=L.scratch(state,from,to,14+state.levels.brush*5);if(result.changed){events(result.events);changed();}}
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0||!active()||!pending()||confirmAction)return;e.preventDefault();canvas.focus({preventScroll:true});drag=position(e);try{canvas.setPointerCapture(e.pointerId);}catch{}scrape(drag,drag);schedule();});
  canvas.addEventListener('pointermove',e=>{if(!drag||!active())return;const p=position(e);scrape(drag,p);drag=p;dirty=true;schedule();});
  function release(){drag=null;dirty=true;schedule();}canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',()=>{if(drag)release();});
  canvas.addEventListener('keydown',e=>{
    if(!active()||confirmAction)return;
    if(isDish()){
      const moves={ArrowLeft:[-18,0],ArrowRight:[18,0],ArrowUp:[0,-18],ArrowDown:[0,18]};
      if(moves[e.code]){e.preventDefault();if(!pending())return;const [dx,dy]=moves[e.code],next={x:Math.max(220,Math.min(500,dishCursor.x+dx)),y:Math.max(125,Math.min(405,dishCursor.y+dy))};scrape(dishCursor,next);dishCursor=next;dirty=true;schedule();}
      else if(e.code==='Space'||e.code==='Enter'){e.preventDefault();if(pending())scrape(dishCursor,dishCursor);else if(!e.repeat)buy();}
      return;
    }
    if(!e.repeat&&(e.code==='Space'||e.code==='Enter')){e.preventDefault();pending()?next():buy();}
  });

  $('#scratch-buy').onclick=buy;$('#scratch-next').onclick=next;$('#scratch-discard').onclick=()=>{if(isDish()){state.dish=null;dishCard=null;status('已放下这个盘子，可以免费领取下一个。');changed();return;}try{L.discard(state);coatingCard=null;status('已放弃票卡，已兑奖奖金保留；票价不退还，未完成兑奖的游戏不再结算。');changed();}catch(e){status(e.message);}};
  document.querySelectorAll('[data-scratch-tier]').forEach(button=>button.onclick=()=>{state.activity='lottery';drag=null;state.selected=Number(button.dataset.scratchTier);status('已选择'+L.tickets[state.selected].name+'，下一张购卡使用此票种。');changed();});
  document.querySelectorAll('[data-scratch-upgrade]').forEach(button=>button.onclick=()=>{try{const k=button.dataset.scratchUpgrade;L.upgrade(state,k);status(L.upgrades[k].name+'已升级，刮开范围已扩大。');changed();}catch(e){status(e.message);}});
  $('#scratch-dish-choice').onclick=()=>{state.activity='dish';drag=null;status(state.dish?.finished?'上一个盘子已洗干净，可以再免费领一个。':state.dish?'已恢复这个盘子的清洁进度，继续擦洗。':'领取一个脏盘子，洗净后获得 10 金币。');changed();};
  $('#scratch-gather').onclick=()=>{const now=performance.now();if(now<gatherUntil||confirmAction)return;gatherUntil=now+650;L.credit(state,5);toast('收集微光 +5');status('收集到 5 金币。金币不足时，随时可以从微光重新开始。');changed();};
  function confirmation(action,text){pause();confirmAction=action;$('#scratch-confirm-text').textContent=text;$('#scratch-confirm').hidden=false;update();$('#scratch-confirm-yes').focus({preventScroll:true});$('#scratch-confirm').scrollIntoView({block:'nearest',behavior:reduce.matches?'auto':'smooth'});}
  $('#scratch-reset').onclick=()=>confirmation('reset','确认重置本次刮刮乐进度？金币、升级、票卡和刷盘子进度都会重新开始，其他小游戏的本次进度不受影响。');
  $('#scratch-confirm-no').onclick=()=>{confirmAction=null;$('#scratch-confirm').hidden=true;update();$('#scratch-reset').focus({preventScroll:true});};
  $('#scratch-confirm-yes').onclick=()=>{if(confirmAction!=='reset')return;state=L.fresh();status('已重置星愿刮刮乐，10000 金币的新旅程开始了。');confirmAction=null;$('#scratch-confirm').hidden=true;coatingCard=null;dishCard=null;particles=[];changed();$('#scratch-buy').focus({preventScroll:true});};
  function visibility(){if(!active())pause();else{dirty=true;lastTime=0;schedule();}}
  document.addEventListener('site:pagechange',visibility);document.addEventListener('hub:selection',()=>queueMicrotask(visibility));document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',pause);
  update();draw();if(isDish())status(!state.dish?'领取一个脏盘子，洗净后获得 10 金币。':state.dish.finished?'已恢复洗净的盘子，奖励已领取，可以再免费领一个。':'已恢复未刷完的盘子，继续擦洗。');else if(state.current)status(state.current.finished?'已恢复上次结算的票卡，可以购入下一张。':'已恢复未刮完的票卡，继续拖动刮开涂层。');
})();
