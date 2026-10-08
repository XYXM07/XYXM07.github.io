(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.GameExchange=api.create(()=>document.dispatchEvent(new CustomEvent('game:exchangechange')));
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const LIMIT=1e12;
  const definitions=Object.freeze([
    {id:'snake',name:'贪吃蛇',unit:'积分',cost:10,reward:1},
    {id:'2048',name:'2048',unit:'积分',cost:20,reward:1},
    {id:'tetris',name:'俄罗斯方块',unit:'积分',cost:100,reward:1},
    {id:'dino',name:'谷歌小恐龙',unit:'积分',cost:100,reward:1},
    {id:'flappy',name:'Flappy Bird',unit:'积分',cost:1,reward:5},
    {id:'watermelon',name:'合成大西瓜',unit:'积分',cost:20,reward:1},
    {id:'coral',name:'珊瑚气泡',unit:'积分',cost:1,reward:5},
    {id:'fishing',name:'星月垂钓',unit:'金币',cost:10,reward:1,currency:true}
  ].map(Object.freeze));
  const valid=n=>Number.isSafeInteger(n)&&n>=0&&n<=LIMIT;
  function create(onChange=()=>{}){
    const accounts=new Map(definitions.map(d=>[d.id,{definition:d,last:0,points:0,provider:null}]));let busy=false;
    function account(id){const a=accounts.get(id);if(!a)throw Error('请选择支持兑换的小游戏。');return a;}
    function balance(a){const n=a.definition.currency?(a.provider?.balance()??0):a.points;return valid(n)?n:0;}
    function observe(id,total){
      const a=account(id);if(a.definition.currency||!valid(total))return;
      // Each controller reports its current round score (coral reports total rescues).
      // Rendering the same score gives nothing; a reset to zero starts the next round.
      const delta=total<a.last?0:total-a.last;a.last=total;
      if(delta){a.points=Math.min(LIMIT,a.points+delta);onChange();}
    }
    function registerCurrency(id,provider){const a=account(id);if(!a.definition.currency||typeof provider?.balance!=='function'||typeof provider?.debit!=='function')throw Error('金币账户无效。');if(a.provider)throw Error('金币账户已连接。');a.provider=provider;onChange();}
    function list(){return definitions.map(d=>{const available=balance(account(d.id));return {...d,balance:available,maxUnits:Math.floor(available/d.cost)*d.cost};});}
    function quote(id,units){const a=account(id),d=a.definition;if(!valid(units)||units===0||units%d.cost)throw Error('兑换数量须为 '+d.cost+' '+d.unit+'的整数倍。');const coins=units/d.cost*d.reward;if(!valid(coins))throw Error('兑换数量过大。');if(units>balance(a))throw Error('可兑换余额不足。');return {id,units,coins,name:d.name,unit:d.unit};}
    function exchange(id,units,capacity=LIMIT){
      if(busy)throw Error('兑换正在处理，请稍后。');const receipt=quote(id,units);
      if(!valid(capacity)||receipt.coins>capacity)throw Error('刮刮乐金币已接近上限，请减少兑换数量。');
      const a=account(id);busy=true;
      try{if(a.definition.currency){if(!a.provider||a.provider.debit(units)!==true)throw Error('金币余额发生变化，请重新兑换。');}else a.points-=units;}
      finally{busy=false;}
      onChange();return receipt;
    }
    return Object.freeze({observe,registerCurrency,list,quote,exchange});
  }
  return {definitions,create,LIMIT};
});
