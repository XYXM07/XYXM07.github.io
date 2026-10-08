(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.FishingLogic=factory();})(typeof window!=='undefined'?window:globalThis,()=>{
  'use strict';
  const DEPTHS=[60,90,125,165,210,260,320,400,500,620,760,920,1060,1200],DEPTH_COSTS=[120,280,540,900,1450,2200,3300,6000,11000,20000,34000,55000,85000],CAPACITIES=[3,4,5,6,8,10,12,16,20,26,32,36],CAPACITY_COSTS=[90,180,330,560,900,1400,2600,4800,8400,14000,22000],LIMIT=1e12;
  const WORLD_DEPTH=1350,SCALE=12,DIVE_SPEED=95,REEL_SPEED=9,FAST_REEL_SPEED=95;
  // Artwork bounds in its canonical 80-pixel coordinates, including fins and tails.
  const FISH_BOUNDS=[[-49,30,-23,23],[-44,30,-23,23],[-44,30,-23,23],[-44,27,-29,27],[-44,27,-29,27],[-44,27,-36,34],[-44,27,-29,27],[-44,32,-25,24],[-44,27,-29,27],[-44,45,-29,27],[-44,45,-29,27],[-45,39,-29,29],[-29,29,-25,38],[-29,29,-25,38],[-28,26,-32,35],[-46,40,-23,23],[-44,27,-29,27],[-44,40,-45,29],[-54,58,-25,29]];
  FISH_BOUNDS.push(...Array.from({length:38},()=>[-58,58,-36,38]));
  function fishY(f,time){return f.depth*SCALE+Math.sin(time*.9+f.wobble)*2;}
  function segmentBox(a,b,box){let enter=0,exit=1;for(const [key,min,max]of [['x',box.left,box.right],['y',box.top,box.bottom]]){const delta=b[key]-a[key];if(Math.abs(delta)<1e-9){if(a[key]<min||a[key]>max)return false;}else{let lo=(min-a[key])/delta,hi=(max-a[key])/delta;if(lo>hi)[lo,hi]=[hi,lo];enter=Math.max(enter,lo);exit=Math.min(exit,hi);if(enter>exit)return false;}}return true;}
  function hitFish(f,from,to,t0,t1){const k=SPECIES[f.type].size/80,[a,b,top,bottom]=FISH_BOUNDS[f.type],left=f.vx<0?-b:a,right=f.vx<0?-a:b,padding=4;if(f.depth<Math.min(from.depth,to.depth)-16||f.depth>Math.max(from.depth,to.depth)+16)return false;return segmentBox({x:from.x-(f.previousX??f.x),y:from.depth*SCALE-fishY(f,t0)},{x:to.x-f.x,y:to.depth*SCALE-fishY(f,t1)},{left:left*k-20-padding,right:right*k+2+padding,top:top*k-29-padding,bottom:bottom*k+12+padding});}

  // Habitat depths are meters; speed is pixels per second. Rare species trade frequency for value.
  const SPECIES=[
    ['minnow','小鱼',8,70,8,6,24,44,.05,.18],['sardine','沙丁鱼',20,100,14,6,42,52,.1,.4],['golden-sardine','金沙丁鱼',30,130,50,1,56,54,.15,.5],
    ['trout','鳟鱼',40,140,22,5,35,66,.4,1.5],['golden-trout','金鳟鱼',80,190,100,.8,62,66,.6,2],['angelfish','天使鱼',50,150,28,4,40,48,.15,.7],
    ['snapper','鲷鱼',85,190,38,5,43,70,.6,2.4],['flounder','比目鱼',110,215,52,5,22,58,.4,1.8],['rainbow','彩虹鱼',135,250,82,3,70,70,.5,1.6],
    ['green-snout-fish','绿鼻鱼',145,285,100,4,48,74,.8,3],['snout-fish','鼻鱼',175,315,120,4,50,74,1,4],['blue-turtle','蓝海龟',185,335,185,1.8,26,86,4,12],
    ['jellyfish','水母',95,215,42,4,20,44,.1,.6],['green-jellyfish','绿水母',210,350,145,3,22,48,.2,.8],['seahorse','海马',120,250,65,3,22,40,.03,.12],
    ['eel','鳗鱼',245,390,190,3,72,76,1,5],['nemo','尼莫鱼',65,170,36,4,53,48,.1,.35],['lantern-fish','灯笼鱼',285,430,280,3,33,74,1,4],['narwhal','独角鲸',350,450,600,.75,49,104,80,180],
    ["anchovy","凤尾鱼",18,110,12,5,38,46,0.03,0.15],
    ["herring","鲱鱼",35,150,20,5,42,58,0.15,0.7],
    ["mackerel","鲭鱼",65,185,34,4,56,64,0.3,1.4],
    ["flying-fish","飞鱼",90,230,48,3,62,66,0.1,0.6],
    ["butterflyfish","蝴蝶鱼",100,245,56,3,35,54,0.1,0.5],
    ["blue-tang","蓝吊鱼",125,280,72,3,43,58,0.2,1],
    ["pufferfish","河豚",150,300,95,2.5,24,60,0.4,2],
    ["lionfish","狮子鱼",180,340,125,2,28,70,0.5,2.5],
    ["red-mullet","红须鱼",170,350,105,3,36,64,0.3,1.4],
    ["grouper","石斑鱼",220,440,170,3,32,88,1,7],
    ["barracuda","梭鱼",280,510,215,3,85,94,2,10],
    ["tuna","金枪鱼",310,550,280,3,78,104,8,45],
    ["swordfish","剑鱼",360,610,360,2,90,114,15,70],
    ["mahi-mahi","鲯鳅",410,650,390,3,68,100,4,18],
    ["sunfish","翻车鱼",450,730,520,2,26,102,30,160],
    ["manta-ray","蝠鲼",510,800,650,1.8,42,120,40,220],
    ["octopus","章鱼",470,790,420,3,23,78,1,8],
    ["cuttlefish","乌贼",560,850,580,3,38,84,1,7],
    ["glass-squid","玻璃鱿鱼",620,925,730,2,34,76,0.5,4],
    ["goblin-shark","哥布林鲨",670,990,940,2,50,112,20,100],
    ["frilled-shark","皱鳃鲨",710,1030,1050,2,44,106,8,40],
    ["coelacanth","腔棘鱼",600,980,900,1.5,28,100,12,60],
    ["oarfish","皇带鱼",730,1150,1320,1.5,56,118,15,90],
    ["black-angler","黑角鮟鱇",810,1180,1180,3,25,86,2,12],
    ["viperfish","蝰鱼",840,1210,1270,3,68,82,0.1,1],
    ["fangtooth","尖牙鱼",900,1260,1460,3,36,86,0.2,2],
    ["barreleye","管眼鱼",950,1300,1700,2,28,76,0.1,0.8],
    ["hatchetfish","斧头鱼",780,1140,1080,3,40,70,0.05,0.5],
    ["dragonfish","黑龙鱼",1000,1330,1950,2.5,65,104,0.3,3],
    ["tripodfish","三脚鱼",1060,1340,2100,2,22,92,0.2,1.5],
    ["snailfish","蜗牛鱼",1030,1330,1800,3,24,76,0.2,2],
    ["dumbo-octopus","小飞象章鱼",1100,1345,2450,1.8,26,82,0.2,2],
    ["giant-isopod","巨型等足虫",990,1290,1750,2.5,19,88,0.5,3],
    ["vampire-squid","吸血鬼乌贼",1140,1350,2700,2,31,96,0.5,4],
    ["ghost-shark","银鲛",1070,1340,2350,2,44,110,2,12],
    ["gulper-eel","吞噬鳗",1160,1350,2850,2,47,116,1,6],
    ["blue-whale","蓝鲸",630,1080,1900,0.6,40,150,1000,4000],
    ["giant-squid","巨型鱿鱼",1180,1350,3500,1.2,43,140,30,180]
  ].map(([id,name,min,max,value,weight,speed,size,kgMin,kgMax])=>({id,name,min,max,value,weight,speed,size,kgMin,kgMax}));
  const MISSIONS=[{id:'first',name:'第一尾鱼',description:'累计钓起 1 尾鱼',reward:20,done:s=>s.caught>=1},{id:'full',name:'满载而归',description:'一次带回满容量鱼获',reward:40,done:s=>s.fullTrips>=1},{id:'hundred',name:'百米之下',description:'鱼线升级至 125 米',reward:80,done:s=>s.depthLevel>=2},{id:'six',name:'海域观察家',description:'发现 6 种鱼类',reward:100,done:s=>discovered(s)>=6},{id:'fifteen',name:'深海收藏家',description:'发现 15 种鱼类',reward:400,done:s=>discovered(s)>=15},{id:'deep',name:'星海远航',description:'鱼线升级至 400 米',reward:600,done:s=>s.depthLevel>=7}];
  MISSIONS.push(
    {id:'thirty',name:'海洋寻访者',description:'发现 30 种海洋生灵',reward:1600,done:s=>discovered(s)>=30},
    {id:'fortyfive',name:'深海博物志',description:'发现 45 种海洋生灵',reward:4500,done:s=>discovered(s)>=45},
    {id:'all',name:'海洋全图鉴',description:'发现全部 57 种海洋生灵',reward:12000,done:s=>discovered(s)===SPECIES.length},
    {id:'abyss',name:'冷泉远征',description:'鱼线升级至 760 米',reward:3000,done:s=>DEPTHS[s.depthLevel]>=760},
    {id:'trench',name:'千米远航',description:'鱼线升级至 1200 米',reward:8500,done:s=>DEPTHS[s.depthLevel]>=1200},
    {id:'hold',name:'丰收之船',description:'鱼篓升级至 36 尾',reward:6000,done:s=>CAPACITIES[s.capacityLevel]>=36}
  );
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),random=rng=>clamp(Number(rng())||0,0,.999999),integer=(v,max=LIMIT)=>Number.isSafeInteger(v)&&v>=0&&v<=max;
  function fresh(){return {version:2,coins:0,earned:0,depthLevel:0,capacityLevel:0,casts:0,caught:0,fullTrips:0,bestTrip:0,deepest:0,book:SPECIES.map(()=>({count:0,largest:0})),missions:[],lastTrip:null};}
  function discovered(s){return s.book.filter(f=>f.count>0).length;}
  function load(raw){const s=JSON.parse(raw),legacy=s?.version===1,bookLength=legacy?19:SPECIES.length,depthMax=legacy?7:DEPTHS.length-1,capacityMax=legacy?6:CAPACITIES.length-1;
    if(![1,2].includes(s?.version)||!['coins','earned','casts','caught','fullTrips','bestTrip'].every(k=>integer(s[k]))||!integer(s.depthLevel,depthMax)||!integer(s.capacityLevel,capacityMax)||!Number.isFinite(s.deepest)||s.deepest<0||s.deepest>(legacy?400:DEPTHS.at(-1))||!Array.isArray(s.book)||s.book.length!==bookLength||s.book.some((f,i)=>!f||!integer(f.count)||!Number.isFinite(f.largest)||f.largest<0||f.largest>SPECIES[i].kgMax)||!Array.isArray(s.missions)||s.missions.some(id=>!(legacy?MISSIONS.slice(0,6):MISSIONS).some(m=>m.id===id))||new Set(s.missions).size!==s.missions.length)throw Error('钓鱼存档格式异常');
    if(s.lastTrip!==null){const t=s.lastTrip;if(!t||!integer(t.number)||!integer(t.value)||!integer(t.bounty)||!Array.isArray(t.fish)||t.fish.length>(legacy?12:CAPACITIES.at(-1))||t.fish.some(f=>!f||!integer(f.type,bookLength-1)||!integer(f.value)||!Number.isFinite(f.kg)||f.kg<SPECIES[f.type].kgMin||f.kg>SPECIES[f.type].kgMax))throw Error('鱼获记录异常');}
    if(legacy){s.version=2;s.book.push(...SPECIES.slice(19).map(()=>({count:0,largest:0})));}
    return s;
  }
  function pick(depth,rng){const pool=SPECIES.map((f,type)=>({...f,type})).filter(f=>depth>=f.min&&depth<=f.max);if(!pool.length)return 0;let n=random(rng)*pool.reduce((a,f)=>a+f.weight,0);for(const f of pool){n-=f.weight;if(n<0)return f.type;}return pool.at(-1).type;}
  function populate(s,rng=Math.random){const fish=[];let serial=0;const max=WORLD_DEPTH;for(let base=8;base<=max;base+=18)for(let n=0;n<4;n++){const depth=Math.min(max,base+random(rng)*16),type=pick(depth,rng),f=SPECIES[type],direction=random(rng)<.5?-1:1;fish.push({serial:++serial,type,x:45+random(rng)*710,depth,vx:f.speed*direction,caught:false,kg:Math.round((f.kgMin+random(rng)*(f.kgMax-f.kgMin))*100)/100,value:Math.round(f.value*(.85+random(rng)*.35)),wobble:random(rng)*Math.PI*2});}return fish;}
  function createRun(s,rng=Math.random){return {phase:'idle',paused:false,time:0,x:400,targetX:400,depth:0,fish:populate(s,rng),basket:[],targetDepth:DEPTHS[s.depthLevel],reelSpeed:REEL_SPEED,summary:null,diveTime:0,horizontalVelocity:0,swing:0,swingVelocity:0,notice:'',noticeTime:0,trip:0};}
  function cast(s,r,rng=Math.random){if(r.phase!=='idle'||r.paused)return false;r.phase='diving';r.depth=0;r.x=400;r.targetX=400;r.basket=[];r.targetDepth=DEPTHS[s.depthLevel];r.reelSpeed=REEL_SPEED;r.summary=null;r.diveTime=0;r.horizontalVelocity=0;r.swing=0;r.swingVelocity=0;r.fish=populate(s,rng);r.trip=s.casts+1;r.notice='快速下潜 · 到达 '+r.targetDepth+' 米后缓慢收线';r.noticeTime=2;return true;}
  function steer(r,x){if(Number.isFinite(x))r.targetX=clamp(x,38,762);}
  function reel(r){if(r.phase!=='diving'||r.paused)return false;r.phase='reeling';r.reelSpeed=REEL_SPEED;r.notice='收线中 · 移动鱼钩捕捉鱼群';r.noticeTime=2;return true;}
  function credit(s,n){s.coins=Math.min(LIMIT,s.coins+n);s.earned=Math.min(LIMIT,s.earned+n);}
  function claim(s){let reward=0;for(const m of MISSIONS)if(!s.missions.includes(m.id)&&m.done(s)){s.missions.push(m.id);reward+=m.reward;}if(reward)credit(s,reward);return reward;}
  function finish(s,r){if(r.phase!=='reeling')return false;const value=r.basket.reduce((sum,f)=>sum+f.value,0);for(const f of r.basket){s.book[f.type].count++;s.book[f.type].largest=Math.max(s.book[f.type].largest,f.kg);}s.casts++;s.caught+=r.basket.length;if(r.basket.length===CAPACITIES[s.capacityLevel])s.fullTrips++;credit(s,value);s.bestTrip=Math.max(s.bestTrip,value);const bounty=claim(s);s.lastTrip={number:s.casts,value,bounty,fish:r.basket.map(f=>({type:f.type,kg:f.kg,value:f.value}))};r.phase='idle';r.depth=0;r.summary={count:r.basket.length,value,bounty,total:value+bounty};r.notice=`本次收获 ${value+bounty} 金币 · 鱼获 ${value}${bounty?' + 航程奖励 '+bounty:''}`;r.noticeTime=6;return true;}
  function upgrade(s,r,kind){if(r.phase!=='idle'||r.paused)throw Error('收线完成后再升级装备');const depth=kind==='depth';if(!depth&&kind!=='capacity')throw Error('未知装备');const key=depth?'depthLevel':'capacityLevel',costs=depth?DEPTH_COSTS:CAPACITY_COSTS,cost=costs[s[key]];if(cost===undefined)throw Error('装备已经满级');if(s.coins<cost)throw Error('金币不足，再钓几竿就能升级');s.coins-=cost;s[key]++;const bounty=claim(s);return {cost,bounty};}
  function tick(s,r,dt){const t0=r.time,from={x:r.x,depth:r.depth};r.time+=dt;r.noticeTime=Math.max(0,r.noticeTime-dt);for(const f of r.fish){if(f.caught)continue;f.previousX=f.x;f.x+=f.vx*dt;if(f.x>860){f.x=-60;f.previousX=f.x;}else if(f.x<-60){f.x=860;f.previousX=f.x;}}
    if(r.phase==='idle')return false;r.x+=clamp(r.targetX-r.x,-500*dt,500*dt);r.horizontalVelocity=(r.x-from.x)/dt;
    const lean=clamp(r.horizontalVelocity/500*.52,-.52,.52);r.swingVelocity+=((lean-r.swing)*42-r.swingVelocity*8)*dt;r.swing+=r.swingVelocity*dt;
    if(r.phase==='diving'){r.diveTime+=dt;const speed=DIVE_SPEED*Math.min(1,r.diveTime/.75);r.depth=Math.min(r.targetDepth,r.depth+speed*dt);s.deepest=Math.max(s.deepest,r.depth);if(r.depth>=r.targetDepth)reel(r);}
    else {const full=r.basket.length>=CAPACITIES[s.capacityLevel],speed=full?FAST_REEL_SPEED:REEL_SPEED;r.reelSpeed+=(speed-r.reelSpeed)*(1-Math.exp(-dt/.18));r.depth=Math.max(0,r.depth-r.reelSpeed*dt);const to={x:r.x,depth:r.depth};
      const nearby=full?[]:r.fish.filter(f=>!f.caught&&hitFish(f,from,to,t0,r.time)).sort((a,b)=>Math.hypot(a.x-r.x,fishY(a,r.time)-r.depth*SCALE)-Math.hypot(b.x-r.x,fishY(b,r.time)-r.depth*SCALE));
      for(const f of nearby){if(r.basket.length>=CAPACITIES[s.capacityLevel])break;f.caught=true;r.basket.push(f);r.notice=r.basket.length===CAPACITIES[s.capacityLevel]?'鱼篓已满 · 加速返回水面':'钓起 '+SPECIES[f.type].name+' · '+f.value+' 金币';r.noticeTime=1.5;}
      if(r.depth===0)return finish(s,r);}
    return false;
  }
  function step(s,r,seconds){if(r.paused||!Number.isFinite(seconds)||seconds<=0)return false;let left=Math.min(1,seconds),settled=false;while(left>0){const dt=Math.min(1/120,left);settled=tick(s,r,dt)||settled;left-=dt;}return settled;}
  return {WORLD_DEPTH,SCALE,DIVE_SPEED,REEL_SPEED,FAST_REEL_SPEED,FISH_BOUNDS,fishY,hitFish,DEPTHS,DEPTH_COSTS,CAPACITIES,CAPACITY_COSTS,SPECIES,MISSIONS,fresh,load,discovered,populate,createRun,cast,steer,reel,step,upgrade,claim};
});
