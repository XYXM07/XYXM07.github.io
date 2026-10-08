(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CoralLogic=factory();})(typeof window!=='undefined'?window:globalThis,()=>{
  'use strict';
  // Port of PersonManager / Person / ClickBubble: one matching rescue per bubble,
  // blue +1, red unlocks at 10, and rescued people float back to the surface.
  const WIDTH=800,HEIGHT=600,MILESTONES=[1,10,50,100,150,200,250,300,400,500,600];
  const MODES={classic:{name:'经典救援',lives:1},gentle:{name:'轻松航行',lives:3}};
  function fresh(mode='classic'){if(!MODES[mode])mode='classic';return {mode,status:'ready',score:0,lives:MODES[mode].lives,time:0,color:'blue',people:[],bubbles:[],effects:[],spawnBlue:.8,spawnRed:1.1,redUnlocked:false,combo:0,maxCombo:0,hits:0,shots:0,id:0,notice:'',noticeTime:0};}
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const random=rng=>clamp(Number(rng())||0,0,.999999);
  function start(s){if(s.status==='ready'||s.status==='paused')s.status='running';}
  function toggle(s){if(!s.redUnlocked)return false;s.color=s.color==='blue'?'red':'blue';return true;}
  function shoot(s,x,y){if(s.status!=='running'||!Number.isFinite(x)||!Number.isFinite(y))return false;s.shots++;s.bubbles.push({x:clamp(x,0,WIDTH),y:clamp(y,0,HEIGHT),color:s.color,age:0,checked:false});if(s.bubbles.length>50)s.bubbles.shift();return true;}
  function spawn(s,color,rng=Math.random){const p={id:++s.id,x:45+random(rng)*710,y:-30,speed:30+random(rng)*60,color,captured:false,age:0,angle:(random(rng)-.5)*.6};s.people.push(p);return p;}
  function announce(s,text){s.notice=text;s.noticeTime=3;}
  function rescue(s,b){let p=null,near=75;for(const person of s.people){if(person.captured||person.color!==b.color)continue;const distance=Math.hypot(b.x-person.x,b.y-person.y);if(distance<near){near=distance;p=person;}}
    if(!p){s.combo=0;s.effects.push({x:b.x,y:b.y,text:'未命中',color:b.color,age:0});return;}
    p.captured=true;s.score++;s.hits++;s.combo++;s.maxCombo=Math.max(s.maxCombo,s.combo);s.effects.push({x:p.x,y:p.y,text:'+1',color:p.color,age:0});
    if(s.score===10){s.redUnlocked=true;s.spawnRed=.8;announce(s,'红色气泡已解锁 · 空格切换颜色');}
    else if(MILESTONES.includes(s.score))announce(s,'救援里程碑 · '+s.score+' 分');
  }
  function tick(s,dt,rng){s.time+=dt;s.noticeTime=Math.max(0,s.noticeTime-dt);const pace=1+Math.min(3,Math.floor(s.score/50)*.25);
    s.spawnBlue-=dt;if(s.spawnBlue<=0){spawn(s,'blue',rng);s.spawnBlue=(.75+random(rng)*.5)/pace;}
    if(s.redUnlocked){s.spawnRed-=dt;if(s.spawnRed<=0){spawn(s,'red',rng);s.spawnRed=(.75+random(rng)*.5)/pace;}}
    for(const p of s.people){p.age+=dt;p.y+=(p.captured?-Math.max(130,p.speed*2):p.speed*pace*(p.age<.3?3:1))*dt;}
    // Resolve clicks before the seabed check, so a last-moment rescue counts.
    for(const b of s.bubbles){b.age+=dt;if(!b.checked&&b.age>=.15){b.checked=true;rescue(s,b);}}
    for(const p of s.people){if(!p.captured&&p.y>=548){p.captured=true;p.lost=true;s.lives--;s.combo=0;s.effects.push({x:p.x,y:535,text:'未能救起',color:'red',age:0});if(s.lives<=0){s.status='over';announce(s,'本次救援结束');break;}}}
    s.people=s.people.filter(p=>!p.lost&&p.y>-100);s.bubbles=s.bubbles.filter(b=>b.age<.5);s.effects.forEach(e=>e.age+=dt);s.effects=s.effects.filter(e=>e.age<.9);
  }
  function step(s,seconds,rng=Math.random){if(s.status!=='running'||!Number.isFinite(seconds)||seconds<=0)return;let left=Math.min(seconds,1);while(left>0&&s.status==='running'){const dt=Math.min(.02,left);tick(s,dt,rng);left-=dt;}}
  function load(raw){const base={version:1,best:{classic:0,gentle:0},achievements:[],rescued:0,sound:false};try{const data=JSON.parse(raw);if(data?.version!==1)return base;for(const mode of Object.keys(MODES))if(Number.isSafeInteger(data.best?.[mode])&&data.best[mode]>=0)base.best[mode]=data.best[mode];base.achievements=MILESTONES.filter(n=>data.achievements?.includes(n));if(Number.isSafeInteger(data.rescued)&&data.rescued>=0)base.rescued=data.rescued;base.sound=data.sound===true;}catch{}return base;}
  return {WIDTH,HEIGHT,MILESTONES,MODES,fresh,start,toggle,shoot,spawn,step,load};
});
