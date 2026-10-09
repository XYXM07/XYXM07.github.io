(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./tower-data.js'));else root.TowerLogic=factory(root.TowerData);})(typeof globalThis!=='undefined'?globalThis:this,D=>{
  'use strict';
  const index=(x,y)=>y*11+x,clone=v=>JSON.parse(JSON.stringify(v)),dirs=[[0,-1],[1,0],[0,1],[-1,0]];
  const names={0:'通道',1:'石墙',2:'黄门',3:'蓝门',4:'红门',5:'封印入口',6:'黄钥匙',7:'蓝钥匙',8:'红钥匙',9:'蓝宝石',10:'红宝石',11:'小血瓶',12:'大血瓶',13:'上楼',14:'下楼',15:'封印墙',19:'熔岩',20:'星空',21:'神像',22:'金币商店',23:'神像',24:'仙子',25:'小偷',26:'老人',27:'商人',28:'公主',30:'小飞羽',31:'大飞羽',32:'十字架',33:'圣水',34:'怪物手册',35:'楼层传送器',36:'钥匙盒',37:'风之罗盘',38:'冰之魔法',39:'金块',71:'铁剑',72:'钢剑',73:'青锋剑',74:'圣光剑',75:'星光神剑',76:'铁盾',77:'钢盾',78:'黄金盾',79:'星光盾',80:'光芒神盾',97:'楼梯落脚点',98:'楼梯落脚点',99:'入口',115:'机关门',119:'黑衣魔王',129:'冥灵魔王',201:'冰之灵杖',202:'炎之灵杖',203:'心之灵杖'};
  const title=f=>f===0?'序章':f===26?'地下层':f>=23?'第 23 层 · '+({23:'炎之区域',24:'中央区域',25:'心之区域'}[f]):'第 '+f+' 层';
  function fresh(now=Date.now()){
    const s={floor:0,x:5,y:9,lv:1,hp:1000,atk:10,def:10,gold:0,exp:0,keys:{yellow:0,blue:0,red:0},items:{},flags:{},floors:clone(D.boards),enemies:clone(D.enemies),visited:[0],startedAt:now,elapsed:0,shop:null,battle:null,won:false,lost:false,notice:'仙子在前方。靠近她，领取三把钥匙，开始寻找十字架。',lastBattle:null};
    return s;
  }
  function tick(s,now=Date.now()){if(!s.won&&!s.lost)s.elapsed=Math.max(0,Math.floor((now-s.startedAt)/1000));if(s.elapsed>=1500&&!s.flags.gift&&s.floors[16][index(4,4)]===26)s.floors[16][index(4,4)]=1;return s.elapsed;}
  function enemy(s,tile){const id=tile===188?31:tile===198?32:tile-40;return s.enemies[id]||null;}
  function special(s,e){return e.id===20?100:e.id===12?300:e.id===10?Math.floor(s.hp/4):e.id===17?Math.floor(s.hp/3):0;}
  // The Flash book uses floor(hp / hit), including the exact-division case.
  function damage(s,e){if(s.atk<=e.def)return Infinity;return Math.floor(e.hp/(s.atk-e.def))*Math.max(0,e.atk-s.def)+special(s,e);}
  function fight(s,e,random=Math.random){
    if(s.atk<=e.def)return null;
    const hit=s.atk-e.def,retaliation=Math.max(0,e.atk-s.def),initial=special(s,e);let hp=e.hp,rounds=0,critical=0;
    while(hp>0){const crit=Math.floor(random()*200)<=s.lv;hp-=hit*(crit?2:1);if(crit)critical++;rounds++;}
    // In v1.12 the enemy also retaliates in the finishing round.
    return {loss:initial+rounds*retaliation,rounds,critical,initial};
  }
  function enter(s,f,marker=97){if(f<0||f>26)return false;const i=s.floors[f].indexOf(marker);if(i<0){s.notice='此处楼梯尚未开启。';return false;}s.floor=f;s.x=i%11;s.y=Math.floor(i/11);s.shop=null;if(!s.visited.includes(f))s.visited.push(f);s.notice='抵达'+title(f)+'。';return true;}
  function strengthen(s,ids,hpPart,attackPart,rewardPart){for(const id of ids){const e=s.enemies[id];for(const k of ['hp','atk','def','gold','exp'])e[k]+=Math.floor(e[k]*(k==='hp'?hpPart:k==='atk'||k==='def'?attackPart:rewardPart));}}
  function afterBattle(s,x,y){
    const f=s.floor;
    if(f===16&&x===5&&y===5&&!s.flags.firstBoss){s.flags.firstBoss=true;strengthen(s,[13,17,18,22],1/3,1/3,1/3);}
    if(f===19&&x===5&&y===6&&!s.flags.midBoss){s.flags.midBoss=true;strengthen(s,[19],1/2,1/2,1/4);s.floors[19][index(5,7)]=0;s.notice+=' 魔王再次强化，前往 21 层迎战。';}
    if(f===21&&x===5&&y===1&&!s.flags.finalBoss){s.flags.finalBoss=true;strengthen(s,[13,17,18,22],1/2,1,1/4);strengthen(s,[19],1/3,1/3,1/4);if(s.flags.hidden){s.floors[21][index(5,1)]=13;s.floors[21][index(5,2)]=98;s.floors[21][index(5,6)]=0;s.notice+=' 隐藏海域已经开启，可继续前往 22 层。';}else{s.won=true;s.notice='击败冥灵魔王，完成普通结局。隐藏旅程需要先在 25 分钟内取得 16 层宝物，再交给序章仙子。';}}
    if(f===26&&x===5&&y===3){s.won=true;s.notice='击败'+(s.flags.blood?'血影':'魔龙')+'，完成隐藏结局！剩余生命 '+s.hp+'，攻击 '+s.atk+'，防御 '+s.def+'。';for(let yy=1;yy<=3;yy++)for(let xx=4;xx<=6;xx++)s.floors[26][index(xx,yy)]=0;}
  }
  function finishBattle(s,result,e,x,y){s.battle=null;s.lastBattle={...result,name:e.name};s.floors[s.floor][index(x,y)]=0;s.gold+=e.gold;s.exp+=e.exp;s.notice='击败'+e.name+' · 损失 '+result.loss+' 生命 · '+result.critical+' 次暴击 · 金币 +'+e.gold+' · 经验 +'+e.exp+'。';afterBattle(s,x,y);}
  function beginBattle(s,e,x,y,tile){
    const initial=special(s,e);s.battle={enemy:clone(e),tile,x,y,floor:s.floor,startHP:s.hp,enemyHP:e.hp,hero:{hp:s.hp,atk:s.atk,def:s.def,lv:s.lv},initial,phase:initial?'special':'hero',rounds:0,critical:0,loss:0};s.notice='与'+e.name+'交战中…';return s.battle;
  }
  function advanceBattle(s,random=Math.random){
    const b=s.battle;if(!b)return null;const e=b.enemy;let event;
    if(b.phase==='special'){s.hp-=b.initial;b.loss+=b.initial;b.phase='hero';event={actor:'special',damage:b.initial,kind:e.id===10||e.id===17?'vampire':'magic'};}
    else if(b.phase==='hero'){const critical=Math.floor(random()*200)<=b.hero.lv,hit=(b.hero.atk-e.def)*(critical?2:1);b.enemyHP=Math.max(0,b.enemyHP-hit);b.rounds++;if(critical)b.critical++;b.phase='enemy';event={actor:'hero',damage:hit,critical};}
    else{const hit=Math.max(0,e.atk-b.hero.def);s.hp-=hit;b.loss+=hit;b.phase='hero';event={actor:'enemy',damage:hit};}
    event.heroHP=s.hp;event.enemyHP=b.enemyHP;event.round=b.rounds;event.done=event.actor==='enemy'&&b.enemyHP===0;
    if(event.done){event.result={loss:b.loss,rounds:b.rounds,critical:b.critical,initial:b.initial};finishBattle(s,event.result,e,b.x,b.y);}
    return event;
  }
  const itemCatalog={
    book:{name:'怪物手册',icon:'book',description:'查看本层怪物的属性与原版伤害估算。'},
    fly:{name:'楼层传送器',icon:'feather',description:'传送到已探索的可用楼层。'},
    compass:{name:'风之罗盘',icon:'compass',description:'原版剧情道具，保留在随身道具中。'},
    cross:{name:'十字架',icon:'cross',description:'交给序章仙子，提升属性并开启上层入口。'},
    gift:{name:'神秘宝物',icon:'gem',description:'在取得十字架前交给序章仙子。'},
    iceMagic:{name:'冰之魔法',icon:'snow',description:'交给 4 层小偷，挖开 18 层通道。'},
    ice:{name:'冰之灵杖',icon:'wand',description:'与炎、心灵杖一起交给 22 层仙子。'},
    fire:{name:'炎之灵杖',icon:'wand',description:'与冰、心灵杖一起交给 22 层仙子。'},
    heart:{name:'心之灵杖',icon:'wand',description:'与冰、炎灵杖一起交给 22 层仙子。'}
  };
  function inventoryEntries(s){return Object.entries(itemCatalog).filter(([id])=>Number(s.items[id])>0).map(([id,item])=>({id,...item,count:Number(s.items[id])}));}
  function npc(s,x,y,t){
    const f=s.floor,grid=s.floors[f],i=index(x,y);s.shop=null;
    if(t===24){
      if(f===0&&!s.flags.intro){s.flags.intro=true;for(const c of ['yellow','blue','red'])s.keys[c]++;grid[i]=0;grid[index(x-1,y)]=24;s.notice='仙子交给你黄、蓝、红钥匙各一把。寻找十字架，带回序章才能打开 21 层入口。';}
      else if(f===0&&s.flags.gift&&!s.items.cross&&!s.items.ice&&!s.flags.boost){s.items.gift=0;s.items.ice=1;s.flags.hidden=true;s.notice='仙子将神秘宝物化为冰之灵杖。隐藏旅程开启；继续寻找十字架。';}
      else if(f===0&&s.items.cross&&!s.flags.boost){s.items.cross=0;s.flags.boost=true;for(const k of ['hp','atk','def'])s[k]+=Math.floor(s[k]/3);grid[i]=0;s.floors[20][index(5,7)]=13;s.notice='仙子提升你的生命、攻击、防御各三分之一，打开了 20 层上楼通道。';}
      else if(f===22){if(s.items.ice&&s.items.fire&&s.items.heart){s.flags.blood=true;for(const id of ['ice','fire','heart'])s.items[id]=0;grid[i]=0;s.notice='三支灵杖解开封印。地下最终敌人将是血影。';}else s.notice='仙子正在等待冰、炎、心三支灵杖。';}
      else s.notice='寻找十字架，将它带回序章。';
    }else if(t===25){if(!s.flags.thief){s.flags.thief=true;s.floors[2][index(1,6)]=0;s.notice='小偷打开了 2 层封印。找到冰之魔法后再回来。';}else if(s.items.iceMagic){s.items.iceMagic=0;grid[i]=0;s.floors[18][index(5,8)]=0;s.floors[18][index(5,9)]=0;s.notice='小偷用冰之魔法挖开了通往公主的路。';}else s.notice='小偷需要冰之魔法来挖开 18 层通道。';
    }else if(t===28){s.floors[18][index(10,10)]=13;s.notice='公主让你继续追击魔王；右下角的上楼入口出现。';
    }else if(t===119){grid[i]=0;s.notice='黑衣魔王挡在前方。';
    }else if(t===129){grid[i]=0;s.notice='冥灵魔王的挑战仍在继续。';
    }else if(f===2&&(t===26||t===27)){s[t===26?'atk':'def']+=t===26?70:30;grid[i]=0;s.notice=t===26?'老人赠予武器，攻击 +70。':'商人赠予钢盾，防御 +30。';
    }else if(f===16&&t===26){if(s.elapsed>=1500){grid[i]=1;s.notice='25 分钟期限已过，神秘老人已经离开。';return;}s.flags.gift=true;s.items.gift=1;grid[i]=0;s.notice='取得神秘宝物。先将它交给序章仙子，再交十字架，可以进入隐藏层。';
    }else{const id=t===22?(f===3?'gold1':'gold2'):t===27?(f===5?'keys':f===12?'sell':'shield'):f===5?'exp1':f===13?'exp2':'sword';s.shop={id,floor:f,x,y};s.notice='选择交易，或关闭商店继续探索。';}
  }
  const offer=(text,cost,amount,gain,once=false)=>({text,cost,amount,gain,once});
  const shops={
    gold1:[offer('生命 +800','gold',25,{hp:800}),offer('攻击 +4','gold',25,{atk:4}),offer('防御 +4','gold',25,{def:4})],
    gold2:[offer('生命 +4000','gold',100,{hp:4000}),offer('攻击 +20','gold',100,{atk:20}),offer('防御 +20','gold',100,{def:20})],
    exp1:[offer('等级 +1 · 生命 +1000 · 攻防 +7','exp',100,{lv:1,hp:1000,atk:7,def:7}),offer('攻击 +5','exp',30,{atk:5}),offer('防御 +5','exp',30,{def:5})],
    exp2:[offer('等级 +3 · 生命 +3000 · 攻防 +20','exp',270,{lv:3,hp:3000,atk:20,def:20}),offer('攻击 +17','exp',95,{atk:17}),offer('防御 +17','exp',95,{def:17})],
    keys:[offer('黄钥匙 +1','gold',10,{yellow:1}),offer('蓝钥匙 +1','gold',50,{blue:1}),offer('红钥匙 +1','gold',100,{red:1})],
    sell:[offer('出售黄钥匙 · 金币 +7','yellow',1,{gold:7}),offer('出售蓝钥匙 · 金币 +35','blue',1,{gold:35}),offer('出售红钥匙 · 金币 +70','red',1,{gold:70})],
    sword:[offer('圣光剑 · 攻击 +120','exp',500,{atk:120},true)],shield:[offer('星光盾 · 防御 +120','gold',500,{def:120},true)]
  };
  function offers(s){return s.shop?shops[s.shop.id]||[]:[];}
  function afford(s,o){return (s.keys[o.cost]??s[o.cost]??0)>=o.amount;}
  function buy(s,n){if(s.battle)return false;const o=offers(s)[Number(n)];if(!o||!afford(s,o))return false;if(o.cost in s.keys)s.keys[o.cost]-=o.amount;else s[o.cost]-=o.amount;for(const [k,v]of Object.entries(o.gain)){if(k in s.keys)s.keys[k]+=v;else s[k]+=v;}s.notice='交易完成：'+o.text+'。';if(o.once){const {floor,x,y}=s.shop;s.floors[floor][index(x,y)]=0;s.shop=null;}return true;}
  const inventory={32:'cross',34:'book',35:'fly',37:'compass',38:'iceMagic',201:'ice',202:'fire',203:'heart'};
  function take(s,t){
    if(t>=6&&t<=8)s.keys[['yellow','blue','red'][t-6]]++;
    else if(t===9)s.def+=3;else if(t===10)s.atk+=3;else if(t===11)s.hp+=200;else if(t===12)s.hp+=500;
    else if(t>=71&&t<=75)s.atk+=[10,40,70,110,150][t-71];else if(t>=76&&t<=80)s.def+=[10,30,85,120,190][t-76];
    else if(t===36)for(const c of Object.keys(s.keys))s.keys[c]++;
    else if(t===39)s.gold+=300;else if(t===33)s.hp*=2;
    else if(t===30||t===31){const n=t===30?1:3;s.lv+=n;s.hp+=1000*n;s.atk+=10*n;s.def+=10*n;}
    else if(inventory[t])s.items[inventory[t]]=1;
    s.notice='获得'+names[t]+'。';
  }
  function blocked(t){return [1,15,19,20,21,23].includes(t)||(t>=181&&t<=199&&t!==188&&t!==198);}
  function move(s,dx,dy,random=Math.random,now=Date.now(),deferBattle=false){
    if(s.battle||s.won||s.lost||Math.abs(dx)+Math.abs(dy)!==1)return false;tick(s,now);s.lastBattle=null;s.shop=null;
    const x=s.x+dx,y=s.y+dy;if(x<0||x>10||y<0||y>10)return false;const grid=s.floors[s.floor],i=index(x,y),t=grid[i];if(blocked(t))return false;
    if([0,97,98,99].includes(t)){s.x=x;s.y=y;return true;}
    if([2,3,4].includes(t)){const c=['yellow','blue','red'][t-2];if(!s.keys[c]){s.notice='需要'+({yellow:'黄',blue:'蓝',red:'红'}[c])+'钥匙。';return false;}s.keys[c]--;grid[i]=0;s.notice=names[t]+'已开启。';return true;}
    if(t===115){grid[i]=0;s.notice='机关门已开启。';return true;}
    if(t===13||t===14){let f=t===13?s.floor+1:s.floor-1;if(s.floor===22&&t===13)f=y===10?24:x===0?23:25;if(s.floor>=23&&s.floor<=25&&t===14)f=22;return enter(s,f,t===13?97:98);}
    if(t===5&&s.floor===24){if(!(s.flags.blood||s.items.ice&&s.items.fire&&s.items.heart)){s.notice='入口需要三支灵杖。';return false;}if(!s.flags.blood)for(let yy=1;yy<=3;yy++)for(let xx=4;xx<=6;xx++)s.floors[26][index(xx,yy)]+=10;return enter(s,26,97);}
    if((t>=40&&t<=70)||t===188||t===198){const e=enemy(s,t),estimate=e&&damage(s,e);if(!e||!Number.isFinite(estimate)||estimate>s.hp){s.notice='暂时无法战胜'+(e?.name||'敌人')+'。先收集装备与宝石。';return false;}if(deferBattle){beginBattle(s,e,x,y,t);return true;}const result=fight(s,e,random);s.hp-=result.loss;finishBattle(s,result,e,x,y);return true;}
    if([22,24,25,26,27,28,119,129].includes(t)){npc(s,x,y,t);return true;}
    if(names[t]&&t!==5){take(s,t);grid[i]=0;return true;}return false;
  }
  function path(s,x,y){if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||x>10||y<0||y>10)return null;const grid=s.floors[s.floor],goal=index(x,y),q=[[s.x,s.y,[]]],seen=new Set([index(s.x,s.y)]);while(q.length){const [cx,cy,steps]=q.shift();if(index(cx,cy)===goal)return steps;for(const [dx,dy]of dirs){const nx=cx+dx,ny=cy+dy,i=index(nx,ny);if(nx<0||nx>10||ny<0||ny>10||seen.has(i)||blocked(grid[i]))continue;if(i!==goal&&![0,97,98,99].includes(grid[i]))continue;seen.add(i);q.push([nx,ny,steps.concat([[dx,dy]])]);}}return null;}
  function fly(s,f){if(s.battle||!s.items.fly||s.won||s.lost||s.floor===26||f<1||f>20||f>=Math.max(...s.visited)||!s.visited.includes(f))return false;return enter(s,f,97);}
  function snapshot(s,now=Date.now()){tick(s,now);return clone(s);}
  function restore(saved,now=Date.now()){const s=clone(saved);s.startedAt=now-s.elapsed*1000;s.shop=null;s.battle=null;s.lastBattle=null;s.notice='已读取本页暂存。';return s;}
  return {fresh,tick,index,title,names,enemy,damage,fight,advanceBattle,inventoryEntries,move,path,offers,afford,buy,fly,snapshot,restore,blocked,data:D};
});
