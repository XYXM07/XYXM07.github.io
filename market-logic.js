(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.MarketLogic=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const CAPITAL=100000;
  const assets=Object.freeze([
    {id:'xy',name:'星月科技',symbol:'XYXM',type:'stock',unit:'股',base:48.6,decimals:2,lot:1,fee:.001,spread:.0008,volatility:.024},
    {id:'yz',name:'云舟能源',symbol:'YZE',type:'stock',unit:'股',base:72.4,decimals:2,lot:1,fee:.001,spread:.0008,volatility:.029},
    {id:'qh',name:'青禾消费',symbol:'QHC',type:'stock',unit:'股',base:26.8,decimals:2,lot:1,fee:.001,spread:.0008,volatility:.016},
    {id:'hl',name:'海岚医药',symbol:'HLM',type:'stock',unit:'股',base:91.2,decimals:2,lot:1,fee:.001,spread:.0008,volatility:.022}
  ].map(Object.freeze));
  function asset(id){const found=assets.find(a=>a.id===id);if(!found)throw Error('请选择有效品种。');return found;}
  const money=n=>Math.round((n+Number.EPSILON)*100)/100;
  const price=(n,a)=>Number(Math.max(Math.pow(10,-a.decimals),n).toFixed(a.decimals));
  function random(m){m.rng=(m.rng+0x6D2B79F5)>>>0;let t=m.rng;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;}
  function bar(m,a,day,open,close){const range=a.volatility*(.18+random(m)*.45);return {day,open,close,high:price(Math.max(open,close)*(1+range),a),low:price(Math.min(open,close)*(1-range),a)};}
  function create(seed=1){
    const m={rng:seed>>>0,day:0,cash:CAPITAL,realized:0,positions:{},orders:[],trades:[],news:[],markets:{},nextOrder:1};
    for(const a of assets){const history=[];let previous=a.base;for(let day=-89;day<=0;day++){const taper=Math.min(1,-day/8),close=day===0?a.base:price(a.base*(1+(Math.sin((day+89)/7)*a.volatility*2+(random(m)-.5)*a.volatility)*taper),a);history.push(bar(m,a,day,previous,close));previous=close;}m.markets[a.id]={price:a.base,history};}
    m.news.push({day:0,title:'交易台已开放',text:'行情与消息均为虚构，进入账户后自动更新。先选择股票，提交委托，再观察价格与资产变化。'});
    return m;
  }
  function quote(m,id){const a=asset(id),mid=m.markets[id].price;return {mid,buy:price(mid*(1+a.spread/2),a),sell:price(mid*(1-a.spread/2),a)};}
  function value(a,qty,p){const gross=money(qty*p),fee=money(gross*a.fee);return {gross,fee,total:money(gross+fee),net:money(gross-fee)};}
  function availableCash(m){return money(m.cash-m.orders.filter(o=>o.side==='buy').reduce((sum,o)=>sum+o.reserved,0));}
  function availableQty(m,id){return (m.positions[id]?.qty||0)-m.orders.filter(o=>o.side==='sell'&&o.asset===id).reduce((sum,o)=>sum+o.qty,0);}
  function validate(m,id,side,qty,p){
    const a=asset(id);if(!['buy','sell'].includes(side))throw Error('请选择买入或卖出。');
    if(!Number.isSafeInteger(qty)||qty< a.lot||qty>1e9||qty%a.lot)throw Error('数量须为 '+a.lot+' '+a.unit+'的整数倍。');
    if(!Number.isFinite(p)||p<=0||p>1e9)throw Error('请输入有效价格。');
    const receipt=value(a,qty,p);
    if(side==='buy'&&receipt.total>availableCash(m)+.0001)throw Error('可用资金不足，挂单占用的资金暂不可交易。');
    if(side==='sell'&&qty>availableQty(m,id))throw Error('可卖数量不足；只能卖出持有且未被挂单占用的数量。');
    return receipt;
  }
  function fill(m,id,side,qty,p){
    const receipt=validate(m,id,side,qty,p),position=m.positions[id]||{qty:0,cost:0};let pnl=null;
    if(side==='buy'){m.cash=money(m.cash-receipt.total);m.positions[id]={qty:position.qty+qty,cost:money(position.cost+receipt.total)};}
    else{const cost=qty===position.qty?position.cost:money(position.cost*qty/position.qty);pnl=money(receipt.net-cost);m.cash=money(m.cash+receipt.net);m.realized=money(m.realized+pnl);if(qty===position.qty)delete m.positions[id];else m.positions[id]={qty:position.qty-qty,cost:money(position.cost-cost)};}
    const trade={day:m.day,asset:id,side,qty,price:p,fee:receipt.fee,pnl};m.trades.unshift(trade);m.trades.length=Math.min(m.trades.length,200);return trade;
  }
  function place(m,{asset:id,side,qty,type='market',limit}){
    const a=asset(id);if(!['market','limit'].includes(type))throw Error('请选择有效委托方式。');
    if(type==='market')return {kind:'filled',trade:fill(m,id,side,qty,quote(m,id)[side==='buy'?'buy':'sell'])};
    if(!Number.isFinite(limit)||limit<Math.pow(10,-a.decimals)||limit>1e9)throw Error('请输入有效限价，不得低于该品种的最小价格单位。');
    limit=price(limit,a);const receipt=validate(m,id,side,qty,limit),q=quote(m,id);
    if(side==='buy'?q.buy<=limit:q.sell>=limit)return {kind:'filled',trade:fill(m,id,side,qty,q[side==='buy'?'buy':'sell'])};
    if(m.orders.length>=20)throw Error('最多保留 20 笔挂单，请先撤销部分委托。');
    const order={id:m.nextOrder++,day:m.day,asset:id,side,qty,limit,reserved:side==='buy'?receipt.total:0};m.orders.push(order);return {kind:'pending',order};
  }
  function cancel(m,id){const index=m.orders.findIndex(o=>o.id===id);if(index<0)throw Error('这笔委托已成交或已撤销。');return m.orders.splice(index,1)[0];}
  function summary(m){const holdings=money(Object.entries(m.positions).reduce((sum,[id,p])=>sum+p.qty*m.markets[id].price,0)),cost=money(Object.values(m.positions).reduce((sum,p)=>sum+p.cost,0)),equity=money(m.cash+holdings);return {cash:m.cash,available:availableCash(m),reserved:money(m.cash-availableCash(m)),holdings,equity,profit:money(equity-CAPITAL),percent:(equity/CAPITAL-1)*100,unrealized:money(holdings-cost),realized:m.realized};}
  function affordable(m,id,side,type='market',limit){const a=asset(id);if(side==='sell')return Math.floor(availableQty(m,id)/a.lot)*a.lot;const p=type==='limit'?limit:quote(m,id).buy;if(!Number.isFinite(p)||p<=0)return 0;let qty=Math.min(1e9,Math.floor(availableCash(m)/(p*(1+a.fee)*a.lot))*a.lot);while(qty>0&&value(a,qty,p).total>availableCash(m))qty-=a.lot;return Math.max(0,qty);}
  function step(m){
    m.day++;const common=(random(m)-.5)*.012;let event=null;
    if(m.day%12===0){const a=assets[Math.floor(random(m)*assets.length)],up=random(m)>.5;event={id:a.id,shock:(up?1:-1)*a.volatility*(1+random(m)),day:m.day,title:a.name+' · '+(up?'积极消息':'市场降温'),text:a.type==='stock'?(up?'虚构企业公布增长计划，市场关注度上升。':'虚构企业面临成本压力，交易情绪转弱。'):(up?'模拟宏观消息推动该货币需求上升。':'模拟宏观消息使该货币短期承压。')};m.news.unshift(event);m.news.length=Math.min(m.news.length,12);}
    for(const a of assets){const market=m.markets[a.id],open=market.price,previous=market.history[market.history.length-2];const trend=(open/previous.close-1)*.16;const change=common*(a.type==='forex'?.15:1)+(random(m)-.5)*2*a.volatility+trend+(event?.id===a.id?event.shock:0);const close=price(Math.max(a.base*.25,Math.min(a.base*4,open*(1+change))),a);market.price=close;market.history.push(bar(m,a,m.day,open,close));if(market.history.length>180)market.history.shift();}
    const filled=[];
    for(const order of [...m.orders]){const q=quote(m,order.asset),p=q[order.side==='buy'?'buy':'sell'];if(order.side==='buy'?p<=order.limit:p>=order.limit){cancel(m,order.id);filled.push(fill(m,order.asset,order.side,order.qty,p));}}
    return filled;
  }
  return {assets,CAPITAL,asset,create,quote,place,cancel,step,summary,availableCash,availableQty,affordable,value};
});
