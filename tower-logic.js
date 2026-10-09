(function(r,f){if(typeof module==='object'&&module.exports)module.exports=f();else r.TowerLogic=f();})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  const enemies=[{name:'苔原史莱姆',hp:45,atk:18,def:2,gold:10},{name:'石灯守卫',hp:90,atk:30,def:10,gold:18},{name:'月影蝙蝠',hp:110,atk:42,def:15,gold:24},{name:'遗迹骑士',hp:170,atk:54,def:25,gold:35},{name:'星塔守望者',hp:250,atk:70,def:35,gold:60}];
  const index=(x,y)=>y*11+x;
  function enemy(floor,boss=false){const e=enemies[Math.min(4,Math.floor(floor/2))],scale=1+floor*.1;return {...e,hp:Math.round(e.hp*scale*(boss?2:1)),atk:Math.round(e.atk*scale),def:Math.round(e.def*scale),gold:e.gold+floor*5,boss};}
  function damage(hero,e){const hit=hero.atk-e.def;if(hit<=0)return Infinity;return Math.max(0,Math.ceil(e.hp/hit)-1)*Math.max(0,e.atk-hero.def);}
  function makeFloor(n){const tiles=Array(121).fill('#');for(let y=1;y<10;y++)for(let x=1;x<10;x++)tiles[index(x,y)]='.';
    for(const y of [3,7])for(let x=2;x<9;x++)if(x!==5)tiles[index(x,y)]='#';
    const place=(x,y,t)=>tiles[index(x,y)]=t;
    place(1,9,n?'down':'start');place(9,1,n===9?'boss':'up');place(2,9,'key');place(3,9,'red');place(4,9,'blue');place(5,9,'potion');place(7,9,'monster');place(9,7,'monster');place(9,5,'door');place(9,3,'monster');place(6,1,'monster');place(4,1,'potion');place(2,1,'gold');place(1,5,'shop');place(3,5,'red');place(5,5,'monster');place(7,5,'blue');place(5,3,'potion');place(5,7,'key');place(7,2,'key');place(2,2,'potion');return tiles;}
  function fresh(){return {floor:0,x:1,y:9,hp:1000,atk:25,def:10,keys:1,gold:0,exp:0,defeated:0,won:false,floors:Array.from({length:10},(_,i)=>makeFloor(i)),notice:'收集宝石与钥匙，查看怪物伤害，抵达第十层。',shop:false};}
  function move(s,dx,dy){if(s.won||Math.abs(dx)+Math.abs(dy)!==1)return false;const x=s.x+dx,y=s.y+dy;if(x<0||x>10||y<0||y>10)return false;const grid=s.floors[s.floor],i=index(x,y),t=grid[i];if(t==='#')return false;
    if(t==='monster'||t==='boss'){const e=enemy(s.floor,t==='boss'),loss=damage(s,e);if(!Number.isFinite(loss)||loss>=s.hp){s.notice='暂时无法战胜'+e.name+'，先收集宝石或提升属性。';return false;}s.hp-=loss;s.gold+=e.gold;s.exp+=10+s.floor*3;s.defeated++;s.notice='击败'+e.name+'，损失 '+loss+' 生命，获得 '+e.gold+' 金币。';if(t==='boss'){s.won=true;s.notice='星塔已点亮。你完成了十层魔塔！';}grid[i]='.';}
    else if(t==='door'){if(!s.keys){s.notice='需要一把金钥匙。';return false;}s.keys--;grid[i]='.';s.notice='金门已经开启。';}
    else if(t==='up'){s.floor++;s.x=1;s.y=9;s.notice='抵达第 '+(s.floor+1)+' 层。';return true;}
    else if(t==='down'){s.floor--;s.x=9;s.y=1;s.notice='返回第 '+(s.floor+1)+' 层。';return true;}
    else if(t==='shop'){s.shop=true;s.notice='星光祭坛：花费金币提升能力，可重复购买。';}
    else if(['key','red','blue','potion','gold'].includes(t)){const n=s.floor;const messages={key:'获得一把金钥匙。',red:'攻击力 +'+(5+n),blue:'防御力 +'+(4+n),potion:'生命 +'+(160+n*35),gold:'金币 +'+(20+n*5)};if(t==='key')s.keys++;if(t==='red')s.atk+=5+n;if(t==='blue')s.def+=4+n;if(t==='potion')s.hp+=160+n*35;if(t==='gold')s.gold+=20+n*5;s.notice=messages[t];grid[i]='.';}
    s.x=x;s.y=y;s.shop=t==='shop';return true;
  }
  function buy(s,type){if(!s.shop||!['hp','atk','def'].includes(type)||s.gold<30)return false;s.gold-=30;s[type]+=type==='hp'?200:type==='atk'?5:4;s.notice='已提升'+({hp:'生命',atk:'攻击',def:'防御'}[type])+'。';return true;}
  return {fresh,move,buy,damage,enemy,index,enemies};
});
