(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./vendor/matter.min.js'));else root.FruitLogic=factory(root.Matter);})(typeof globalThis!=='undefined'?globalThis:this,function(M){
  'use strict';const radii=[15,20,25,30,36,43,50,59,69,81,96],names=['樱桃','草莓','葡萄','橘子','柿子','苹果','梨','桃子','菠萝','甜瓜','大西瓜'];
  function create(){const engine=M.Engine.create({enableSleeping:true});engine.gravity.y=1.15;M.Composite.add(engine.world,[M.Bodies.rectangle(-18,300,40,640,{isStatic:true}),M.Bodies.rectangle(438,300,40,640,{isStatic:true}),M.Bodies.rectangle(210,620,460,40,{isStatic:true})]);const s={engine,bodies:[],pending:[],time:0,score:0,cooldown:0,danger:0,over:false,won:false,merges:[]};M.Events.on(engine,'collisionStart',e=>s.pending.push(...e.pairs.map(p=>[p.bodyA,p.bodyB])));return s;}
  function add(s,level,x,y){const r=radii[level],b=M.Bodies.circle(Math.max(r+3,Math.min(417-r,x)),y,r,{restitution:.08,friction:.12,frictionStatic:.4,density:.002});b.fruitLevel=level;b.born=s.time;M.Composite.add(s.engine.world,b);s.bodies.push(b);return b;}
  function drop(s,level,x){if(s.over||s.time<s.cooldown)return false;add(s,level,x,46);s.cooldown=s.time+.45;return true;}
  function step(s,dt){if(s.over)return;s.time+=dt;s.merges=[];M.Engine.update(s.engine,dt*1000);
    const removed=new Set();for(const [a,b] of s.pending){if(a.fruitLevel===undefined||a.fruitLevel!==b.fruitLevel||a.fruitLevel>=10||removed.has(a)||removed.has(b)||!s.bodies.includes(a)||!s.bodies.includes(b))continue;removed.add(a);removed.add(b);const level=a.fruitLevel+1,x=(a.position.x+b.position.x)/2,y=(a.position.y+b.position.y)/2;M.Composite.remove(s.engine.world,[a,b]);s.bodies=s.bodies.filter(x=>x!==a&&x!==b);const next=add(s,level,x,y);M.Body.setVelocity(next,{x:(a.velocity.x+b.velocity.x)*.3,y:(a.velocity.y+b.velocity.y)*.3});s.score+=2**(level+1);s.won ||= level===10;s.merges.push({x,y,level});}s.pending=[];
    const high=s.bodies.some(b=>s.time-b.born>1.5&&b.position.y-radii[b.fruitLevel]<82);s.danger=high?s.danger+dt:0;if(s.danger>=2)s.over=true;
  }
  function destroy(s){M.Events.off(s.engine);M.Composite.clear(s.engine.world,false);M.Engine.clear(s.engine);}
  return {radii,names,create,add,drop,step,destroy};
});
