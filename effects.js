(() => {
  'use strict';const reduce=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
  const canvas=document.createElement('canvas');canvas.className='pointer-effects';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);const ctx=canvas.getContext('2d');let points=[],bursts=[],frame=0,last=0,dpr=1;
  function resize(){dpr=Math.min(devicePixelRatio||1,2);canvas.width=innerWidth*dpr;canvas.height=innerHeight*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
  function clear(){cancelAnimationFrame(frame);frame=0;points=[];bursts=[];ctx.clearRect(0,0,innerWidth,innerHeight);}
  function draw(now){
    frame=0;points=points.filter(p=>now-p.time<460);bursts=bursts.filter(b=>now-b.time<520);ctx.clearRect(0,0,innerWidth,innerHeight);ctx.globalCompositeOperation='screen';
    for(let i=1;i<points.length;i++){const age=now-points[i].time,alpha=Math.max(0,1-age/460)*.65;ctx.strokeStyle='rgba(184,226,222,'+alpha+')';ctx.lineWidth=Math.max(.6,2.6*(1-age/460));ctx.lineCap='round';ctx.beginPath();ctx.moveTo(points[i-1].x,points[i-1].y);ctx.lineTo(points[i].x,points[i].y);ctx.stroke();}
    bursts.forEach(b=>{
      const t=(now-b.time)/520,ease=1-Math.pow(1-t,3),alpha=Math.pow(1-t,1.5);ctx.save();ctx.translate(b.x,b.y);ctx.shadowColor='#c2f5ff';ctx.shadowBlur=5;ctx.lineWidth=1.6*(1-t)+.3;ctx.strokeStyle='rgba(212,250,255,'+alpha+')';
      ctx.beginPath();ctx.arc(0,0,3+25*ease,0,Math.PI*2);ctx.stroke();
      for(const p of b.particles){const distance=p.distance*ease,x=Math.cos(p.angle)*distance,y=Math.sin(p.angle)*distance+7*t*t;ctx.fillStyle=p.gold?'rgba(255,227,164,'+alpha+')':'rgba(210,253,255,'+alpha+')';ctx.beginPath();ctx.arc(x,y,p.size*(1-t*.6),0,Math.PI*2);ctx.fill();}ctx.restore();
    });ctx.globalCompositeOperation='source-over';if(points.length||bursts.length)frame=requestAnimationFrame(draw);
  }
  document.addEventListener('pointermove',e=>{if(reduce.matches||!fine.matches||e.pointerType==='touch'||document.body.classList.contains('select-open'))return;const now=performance.now();if(now-last<12)return;last=now;points.push({x:e.clientX,y:e.clientY,time:now});if(points.length>40)points.shift();if(!frame)frame=requestAnimationFrame(draw);},{passive:true});
  document.addEventListener('pointerdown',e=>{if(reduce.matches||e.button!==0)return;const particles=Array.from({length:7+Math.floor(Math.random()*5)},()=>({angle:Math.random()*Math.PI*2,distance:12+Math.random()*26,size:1+Math.random()*1.6,gold:Math.random()<.35}));bursts.push({x:e.clientX,y:e.clientY,time:performance.now(),particles});if(bursts.length>10)bursts.shift();if(!frame)frame=requestAnimationFrame(draw);},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});reduce.addEventListener('change',clear);window.addEventListener('resize',()=>{clear();resize();});window.addEventListener('blur',clear);resize();
})();
