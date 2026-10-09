(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ScratchLogic=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const LIMIT=1e12,GRID=20,THRESHOLD=220,FACTORS=[1,2,5,10,20,50];
  const tickets=[
    {name:'晨光纸笺',cost:10,unlock:0,probability:.60,color:'#91bfae',mode:'三同图符',description:'每局三个图符完全相同，领取该局右侧所示奖金'},
    {name:'月庭来信',cost:50,unlock:150,probability:.22,color:'#8cbed2',mode:'幸运号码',description:'命中中奖号码领奖金，命中翻倍号码领双倍奖金'},
    {name:'星海邀约',cost:200,unlock:600,probability:.10,color:'#d9b56d',mode:'星光宾果',description:'刮开叫号，点亮宾果卡，按连线、四角或 X 形领取最高奖级'},
    {name:'极光秘卷',cost:1000,unlock:2000,probability:.25,color:'#c7a38e',mode:'图符寻宝',description:'刮出幸运图符，集齐一条路线上的全部图符即可领该路线奖金'}
  ];
  const symbols=['星芒','月弧','花瓣','晶石','叶片','日轮','波纹','云朵','钥匙','铃铛','行星','羽毛'].map(name=>({name}));
  const upgrades={brush:{name:'宽幅刮刀',base:30,growth:1.8,max:5}};
  const tileCount=tier=>[9,9,24,8][tier];
  const bingoRect=i=>({x:36+(i%5)*50,y:142+Math.floor(i/5)*50,w:48,h:48});
  const rect=(i,tier=0)=>tier===0?{x:34+(i%3)*166,y:118+Math.floor(i/3)*104,w:154,h:90}:tier===2?{x:350+(i%4)*86,y:123+Math.floor(i/4)*49,w:78,h:40}:tier===3?{x:34+(i%4)*166,y:118+Math.floor(i/4)*62,w:154,h:50}:{x:34+(i%3)*222,y:118+Math.floor(i/3)*104,w:208,h:90};
  function fresh(){return {version:4,coins:10000,best:10000,earned:0,lifetime:0,cards:0,discarded:0,levels:{brush:0},selected:0,current:null,activity:'lottery',dish:null,dishes:0};}
  const DISH_GRID=64,DISH_RECT={x:220,y:125,w:280,h:280},DISH_POINTS=[];
  for(let y=0;y<DISH_GRID;y++)for(let x=0;x<DISH_GRID;x++){const px=DISH_RECT.x+(x+.5)*DISH_RECT.w/DISH_GRID,py=DISH_RECT.y+(y+.5)*DISH_RECT.h/DISH_GRID;if(Math.hypot(px-360,py-265)<=140)DISH_POINTS.push({index:y*DISH_GRID+x,x:px,y:py});}
  const DISH_THRESHOLD=Math.ceil(DISH_POINTS.length*.985),DISH_INDICES=new Set(DISH_POINTS.map(p=>p.index));
  const bounded=(n,min=0,max=LIMIT)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
  const integer=(n,min=0,max=LIMIT)=>Number.isInteger(n)&&bounded(n,min,max);
  function validBase(s){return s&&['coins','best','earned','lifetime','cards','discarded'].every(k=>integer(s[k]))&&integer(s.selected,0,3)&&s.levels&&Object.keys(upgrades).every(k=>integer(s.levels[k],0,upgrades[k].max));}
  const paidLength=tier=>[3,9,1,6][tier];
  function load(text){
    if(typeof text!=='string'||text.length>100000)throw Error('存档大小异常');let s=JSON.parse(text);
    if(!validBase(s))throw Error('存档格式无效');
    if([1,2,3].includes(s.version)){
      const old=s,migrated=fresh();for(const k of ['coins','best','earned','lifetime','cards','discarded','selected'])migrated[k]=old[k];migrated.levels.brush=old.levels.brush;
      let refund=0;for(const [key,base,growth,max] of [['luck',50,1.85,10],['reward',80,2,8],['bot',500,2.25,5]]){
        const level=old.levels[key]??0;if(!integer(level,0,max))throw Error('旧升级数据无效');if(key==='bot'&&old.version!==1)continue;for(let i=0;i<level;i++)refund+=Math.ceil(base*growth**i);
      }
      if(old.current&&!old.current.finished&&integer(old.current.tier,0,3)){refund+=tickets[old.current.tier].cost;if(old.version===2&&old.current.tier===3&&integer(old.current.pot))refund+=old.current.pot;}
      migrated.coins=Math.min(LIMIT,migrated.coins+refund);migrated.best=Math.max(migrated.best,migrated.coins);
      migrated.migrationMessage='票卡玩法已更新。金币与刮刀等级已保留；已移除升级及未完成旧票已退款，旧版暂存宝藏已返还。';s=migrated;
    }
    if(s.version!==4||Object.keys(s.levels).some(k=>k!=='brush'))throw Error('存档版本无效');
    s.activity??='lottery';s.dish??=null;s.dishes??=0;
    if(!['lottery','dish'].includes(s.activity)||!integer(s.dishes))throw Error('刷盘子进度无效');
    if(s.dish!==null){const d=s.dish;if(!d||typeof d.finished!=='boolean'||!Array.isArray(d.cover)||d.cover.length!==DISH_GRID*DISH_GRID||d.cover.some((n,i)=>n!==0&&n!==1||n===1&&!DISH_INDICES.has(i)))throw Error('盘子数据无效');d.count=DISH_POINTS.reduce((sum,p)=>sum+d.cover[p.index],0);if(d.finished!==Boolean(d.count>=DISH_THRESHOLD))throw Error('盘子结算状态无效');}
    const c=s.current;if(c!==null){
      if(!c||!integer(c.tier,0,3)||!integer(c.gain)||!Array.isArray(c.paid)||c.paid.length!==paidLength(c.tier)||c.paid.some(x=>typeof x!=='boolean')||!Array.isArray(c.tiles)||c.tiles.length!==tileCount(c.tier)||typeof c.finished!=='boolean')throw Error('票卡数据无效');
      if(c.tier===0&&(!Array.isArray(c.rowFactors)||c.rowFactors.length!==3||c.rowFactors.some(x=>!FACTORS.includes(x))))throw Error('局奖金无效');
      if(c.tier===1&&(!Array.isArray(c.targets)||c.targets.length!==3||new Set(c.targets).size!==3||c.targets.some(x=>!integer(x,1,30))||!integer(c.doubleNumber,1,30)||c.targets.includes(c.doubleNumber)))throw Error('中奖号码无效');
      if(c.tier===2){
        if(!Array.isArray(c.board)||c.board.length!==25||c.board[12]!==0||new Set(c.board).size!==25||c.board.some((n,i)=>i!==12&&!integer(n,Math.floor(i%5)*15+1,Math.floor(i%5)*15+15))||new Set(c.tiles.map(t=>t.number)).size!==24)throw Error('宾果卡数据无效');
      }
      if(c.tier===3&&(!Array.isArray(c.routes)||c.routes.length!==6||c.routes.some((r,i)=>!r||!Array.isArray(r.symbols)||r.symbols.length!==[3,3,4,4,5,5][i]||new Set(r.symbols).size!==r.symbols.length||r.symbols.some(n=>!integer(n,0,11))||!FACTORS.includes(r.factor))||new Set(c.tiles.map(t=>t.symbol)).size!==8))throw Error('寻宝路线数据无效');
      for(const t of c.tiles){
        if(!t||!integer(t.symbol,0,11)||typeof t.revealed!=='boolean'||!Array.isArray(t.cover)||t.cover.length!==GRID*GRID||t.cover.some(x=>x!==0&&x!==1)||!FACTORS.includes(t.factor)||!integer(t.number,1,c.tier===2?75:30))throw Error('涂层数据无效');
        t.count=t.cover.reduce((a,b)=>a+b,0);if(!t.revealed&&t.count>=THRESHOLD)throw Error('涂层进度无效');
      }
      if(c.finished!==c.tiles.every(t=>t.revealed))throw Error('票卡结算状态无效');
      const expected=c.tier===0?[0,1,2].map(row=>c.tiles.slice(row*3,row*3+3).every(t=>t.revealed)):c.tier===1?c.tiles.map(t=>t.revealed):c.tier===2?[c.finished]:c.routes.map((_,i)=>routeMatched(c,i));
      if(c.paid.some((value,i)=>value!==expected[i]))throw Error('票卡兑奖记录无效');
    }
    return s;
  }
  function credit(s,amount){amount=Math.min(LIMIT,Math.max(0,Math.round(amount)));s.coins=Math.min(LIMIT,s.coins+amount);s.earned=Math.min(LIMIT,s.earned+amount);s.lifetime=Math.min(LIMIT,s.lifetime+amount);s.best=Math.max(s.best,s.coins);return amount;}
  const chance=rng=>Math.min(.999999,Math.max(0,Number(rng())||0));
  const pick=(list,rng)=>list[Math.floor(chance(rng)*list.length)];
  function factor(rng){const n=chance(rng);return n<.64?1:n<.84?2:n<.94?5:n<.985?10:n<.998?20:50;}
  const amount=(c,f)=>Math.round(tickets[c.tier].cost*f);
  function sample(list,count,rng){const pool=[...list],picked=[];for(let i=0;i<count;i++)picked.push(pool.splice(Math.floor(chance(rng)*pool.length),1)[0]);return picked;}
  function bingo(c,all=false){
    const called=new Set(c.tiles.filter(t=>all||t.revealed).map(t=>t.number)),marked=c.board.map(n=>n===0||called.has(n)),patterns=[];
    for(let n=0;n<5;n++){patterns.push(Array.from({length:5},(_,i)=>n*5+i));patterns.push(Array.from({length:5},(_,i)=>i*5+n));}
    const diagonals=[[0,6,12,18,24],[4,8,12,16,20]];patterns.push(...diagonals);
    const lines=patterns.filter(p=>p.every(i=>marked[i])),corners=[0,4,20,24].every(i=>marked[i]),cross=[...new Set(diagonals.flat())].every(i=>marked[i]);
    const factor=Math.max(lines.length>=3?5:lines.length===2?2:lines.length===1?1:0,corners?4:0,cross?10:0);
    return {marked,lines,corners,cross,factor,label:cross?'X 形':corners&&factor===4?'四角':lines.length+' 条连线'};
  }
  function routeMatched(c,index,all=false){const found=new Set(c.tiles.filter(t=>all||t.revealed).map(t=>t.symbol));return c.routes[index].symbols.every(n=>found.has(n));}
  function winning(c,i){const t=c.tiles[i];if(!t.revealed)return false;if(c.tier===0){const row=c.tiles.slice(Math.floor(i/3)*3,Math.floor(i/3)*3+3);return row.every(x=>x.revealed&&x.symbol===row[0].symbol);}if(c.tier===1)return c.targets.includes(t.number)||t.number===c.doubleNumber;if(c.tier===2)return c.board.includes(t.number);return c.routes.some(r=>r.symbols.includes(t.symbol));}
  function buy(s,tier=s.selected,rng=Math.random){
    if(!integer(tier,0,3))throw Error('请选择有效票卡');if(s.current&&!s.current.finished)throw Error('先完成或放弃当前票卡');const ticket=tickets[tier];
    if(s.earned<ticket.unlock)throw Error('累计奖励达到 '+ticket.unlock+' 后解锁');if(s.coins<ticket.cost)throw Error('金币不足，可以先收集微光');s.coins-=ticket.cost;s.selected=tier;
    const shouldWin=chance(rng)<ticket.probability;
    const c={tier,probability:ticket.probability,tiles:[],paid:Array(paidLength(tier)).fill(false),targets:[],rowFactors:[],doubleNumber:null,board:[],routes:[],gain:0,finished:false};
    if(tier===0)c.rowFactors=Array.from({length:3},()=>factor(rng));
    if(tier===1){const numbers=sample(Array.from({length:30},(_,i)=>i+1),4,rng);c.targets=numbers.slice(0,3);c.doubleNumber=numbers[3];}
    let calls=[],found=[];if(tier===2){calls=sample(Array.from({length:75},(_,i)=>i+1),24,rng);const columns=Array.from({length:5},(_,col)=>sample(Array.from({length:15},(_,n)=>col*15+n+1),5,rng));c.board=Array.from({length:25},(_,i)=>i===12?0:columns[i%5][Math.floor(i/5)]);}
    if(tier===3){found=sample(Array.from({length:12},(_,i)=>i),8,rng);c.routes=[3,3,4,4,5,5].map(count=>({symbols:sample(Array.from({length:12},(_,i)=>i),count,rng),factor:factor(rng)}));}
    for(let i=0;i<tileCount(tier);i++){
      const t={symbol:pick([0,1,2,3],rng),number:i+1,factor:factor(rng),cover:Array(GRID*GRID).fill(0),count:0,revealed:false};
      if(tier===1){const targets=[...c.targets,c.doubleNumber];t.number=chance(rng)<.07?pick(targets,rng):pick(Array.from({length:30},(_,n)=>n+1).filter(n=>!targets.includes(n)),rng);}
      if(tier===2)t.number=calls[i];
      if(tier===3)t.symbol=found[i];
      c.tiles.push(t);
    }
    if(tier===0)for(let row=0;row<3;row++)if(chance(rng)<.08){const chosen=pick([0,1,2,3],rng);for(let col=0;col<3;col++)c.tiles[row*3+col].symbol=chosen;}
    tuneOutcome(c,shouldWin,rng);s.current=c;return c;
  }
  function tuneOutcome(c,shouldWin,rng){
    if(c.tier===0){
      const matches=row=>c.tiles.slice(row*3,row*3+3).every(t=>t.symbol===c.tiles[row*3].symbol);
      if(!shouldWin){for(let row=0;row<3;row++)if(matches(row))c.tiles[row*3+2].symbol=(c.tiles[row*3+2].symbol+1)%4;}
      else if(![0,1,2].some(matches)){const row=pick([0,1,2],rng),symbol=c.tiles[row*3].symbol;for(let col=1;col<3;col++)c.tiles[row*3+col].symbol=symbol;}
    }else if(c.tier===1){
      const targets=[...c.targets,c.doubleNumber],hits=t=>targets.includes(t.number),misses=Array.from({length:30},(_,n)=>n+1).filter(n=>!targets.includes(n));
      if(!shouldWin)c.tiles.forEach(t=>{if(hits(t))t.number=pick(misses,rng);});
      else if(!c.tiles.some(hits))pick(c.tiles,rng).number=pick(targets,rng);
    }else if(c.tier===2){
      if(shouldWin&&!bingo(c,true).factor){
        const patterns=[];for(let n=0;n<5;n++){patterns.push(Array.from({length:5},(_,i)=>n*5+i));patterns.push(Array.from({length:5},(_,i)=>i*5+n));}patterns.push([0,6,12,18,24],[4,8,12,16,20],[0,4,20,24],[0,4,6,8,12,16,18,20,24]);
        const required=pick(patterns,rng).map(i=>c.board[i]).filter(Boolean),other=Array.from({length:75},(_,n)=>n+1).filter(n=>!required.includes(n));
        const calls=sample([...required,...sample(other,24-required.length,rng)],24,rng);c.tiles.forEach((t,i)=>t.number=calls[i]);
      }else if(!shouldWin){
        let result=bingo(c,true);while(result.factor){
          const pattern=result.lines[0]||(result.corners?[0,4,20,24]:[0,4,6,8,12,16,18,20,24]),remove=pattern.map(i=>c.board[i]).find(Boolean),tile=c.tiles.find(t=>t.number===remove);
          const available=Array.from({length:75},(_,n)=>n+1).filter(n=>!c.board.includes(n)&&!c.tiles.some(t=>t.number===n));tile.number=pick(available,rng);result=bingo(c,true);
        }
      }
    }else{
      const found=c.tiles.map(t=>t.symbol),missing=Array.from({length:12},(_,n)=>n).filter(n=>!found.includes(n));
      if(!shouldWin)c.routes.forEach((route,i)=>{if(routeMatched(c,i,true))route.symbols[0]=pick(missing,rng);});
      else if(!c.routes.some((_,i)=>routeMatched(c,i,true))){const route=pick(c.routes,rng);route.symbols=sample(found,route.symbols.length,rng);}
    }
  }
  function startDish(s){if(s.dish&&!s.dish.finished)throw Error('先把这个盘子刷干净');s.dish={cover:Array(DISH_GRID*DISH_GRID).fill(0),count:0,finished:false};s.activity='dish';return s.dish;}
  function scrubDish(s,from,to,radius=24){
    const d=s.dish;if(!d||d.finished||![from?.x,from?.y,to?.x,to?.y,radius].every(Number.isFinite)||radius<=0)return {changed:false,reward:0};
    radius=Math.min(60,radius);const distance=Math.hypot(to.x-from.x,to.y-from.y),steps=Math.min(200,Math.max(1,Math.ceil(distance/(radius*.4))));let changed=false;
    for(let step=0;step<=steps;step++){const x=from.x+(to.x-from.x)*step/steps,y=from.y+(to.y-from.y)*step/steps;for(const p of DISH_POINTS)if(!d.cover[p.index]&&Math.hypot(p.x-x,p.y-y)<=radius){d.cover[p.index]=1;d.count++;changed=true;}}
    let reward=0;if(d.count>=DISH_THRESHOLD){DISH_POINTS.forEach(p=>d.cover[p.index]=1);d.count=DISH_POINTS.length;d.finished=true;s.dishes=Math.min(LIMIT,s.dishes+1);reward=credit(s,10);}
    return {changed,reward};
  }
  function payout(s,c,value,events,info={}){const awarded=credit(s,value);c.gain=Math.min(LIMIT,c.gain+awarded);events.push({kind:'win',amount:awarded,...info});}
  function reveal(s,index){
    const c=s.current;if(!c||c.finished||!integer(index,0,c.tiles.length-1)||c.tiles[index].revealed)return [];
    const t=c.tiles[index],events=[{kind:'reveal',index}];t.revealed=true;
    if(c.tier===0){const row=Math.floor(index/3);if(c.tiles.slice(row*3,row*3+3).every(x=>x.revealed)&&!c.paid[row]){c.paid[row]=true;if(winning(c,index))payout(s,c,amount(c,c.rowFactors[row]),events,{row});}}
    else if(c.tier===1){c.paid[index]=true;if(winning(c,index))payout(s,c,amount(c,t.factor)*(t.number===c.doubleNumber?2:1),events,{index,double:t.number===c.doubleNumber});}
    else if(c.tier===3){for(let route=0;route<c.routes.length;route++)if(!c.paid[route]&&routeMatched(c,route)){c.paid[route]=true;payout(s,c,amount(c,c.routes[route].factor),events,{index,route});}}
    if(c.tiles.every(x=>x.revealed)){
      if(c.tier===2&&!c.paid[0]){c.paid[0]=true;const result=bingo(c);if(result.factor)payout(s,c,amount(c,result.factor),events,{index,bingo:result.label});}
      c.finished=true;s.cards=Math.min(LIMIT,s.cards+1);events.push({kind:'finish',net:c.gain-tickets[c.tier].cost});
    }
    return events;
  }
  function scratch(s,from,to,radius){
    const c=s.current;if(!c||c.finished||![from?.x,from?.y,to?.x,to?.y,radius].every(Number.isFinite)||radius<=0)return {changed:false,events:[]};
    radius=Math.min(80,radius);let changed=false,events=[];const distance=Math.hypot(to.x-from.x,to.y-from.y),steps=Math.min(200,Math.max(1,Math.ceil(distance/(radius*.4))));
    for(let step=0;step<=steps&&!c.finished;step++){
      const x=from.x+(to.x-from.x)*step/steps,y=from.y+(to.y-from.y)*step/steps;
      for(let i=0;i<c.tiles.length&&!c.finished;i++){const t=c.tiles[i],r=rect(i,c.tier);if(t.revealed||x+radius<r.x||x-radius>r.x+r.w||y+radius<r.y||y-radius>r.y+r.h)continue;
        const x1=Math.max(0,Math.floor((x-radius-r.x)/r.w*GRID)),x2=Math.min(GRID-1,Math.floor((x+radius-r.x)/r.w*GRID)),y1=Math.max(0,Math.floor((y-radius-r.y)/r.h*GRID)),y2=Math.min(GRID-1,Math.floor((y+radius-r.y)/r.h*GRID));
        for(let gy=y1;gy<=y2;gy++)for(let gx=x1;gx<=x2;gx++){const n=gy*GRID+gx;if(!t.cover[n]&&Math.hypot(r.x+(gx+.5)*r.w/GRID-x,r.y+(gy+.5)*r.h/GRID-y)<=radius){t.cover[n]=1;t.count++;changed=true;}}
        if(t.count>=THRESHOLD)events.push(...reveal(s,i));
      }
    }
    return {changed,events};
  }
  function next(s){const i=s.current?.tiles.findIndex(t=>!t.revealed)??-1;return i<0?[]:reveal(s,i);}
  function discard(s){if(!s.current||s.current.finished)throw Error('没有进行中的票卡');s.discarded=Math.min(LIMIT,s.discarded+1);s.current=null;}
  function cost(s,key){const u=upgrades[key];return !u||s.levels[key]>=u.max?null:Math.ceil(u.base*u.growth**s.levels[key]);}
  function upgrade(s,key){const price=cost(s,key);if(price===null)throw Error('升级已满级');if(s.coins<price)throw Error('金币不足');s.coins-=price;s.levels[key]++;return price;}
  function tileLabel(c,t){return c.tier===1?'号码 '+String(t.number).padStart(2,'0')+(t.number===c.doubleNumber?' · 翻倍中奖':''):c.tier===2?'叫号 '+String(t.number).padStart(2,'0'):symbols[t.symbol].name;}
  return {tickets,symbols,upgrades,GRID,THRESHOLD,rect,bingoRect,tileCount,fresh,load,credit,buy,reveal,scratch,next,discard,cost,upgrade,tileLabel,amount,winning,bingo,routeMatched,DISH_GRID,DISH_RECT,DISH_POINTS,DISH_THRESHOLD,startDish,scrubDish};
});
