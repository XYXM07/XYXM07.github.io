(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./ocean-art.js'));else root.CoralView=factory(root.OceanArt);})(typeof window!=='undefined'?window:globalThis,Art=>{
  'use strict';
  const TAU=Math.PI*2,colors={blue:'#8bd7f6',red:'#f5a99b'};
  function circle(c,x,y,r,fill,stroke){c.beginPath();c.arc(x,y,r,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}}
  function text(c,label,x,y,size=14,color='#e8f5ee',align='left'){c.font=`${size}px "Microsoft YaHei", sans-serif`;c.fillStyle=color;c.textAlign=align;c.fillText(label,x,y);}
  function coral(c,x,y,size,color,phase){c.save();c.translate(x,y);c.strokeStyle=color;c.lineCap='round';function branch(length,angle,width,level){c.save();c.rotate(angle);c.lineWidth=width;c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(Math.sin(phase)*8,-length*.55,0,-length);c.stroke();c.translate(0,-length);if(level>0){branch(length*.68,-.5,width*.69,level-1);branch(length*.63,.63,width*.69,level-1);}c.restore();}branch(size,0,8,3);c.restore();}
  function person(c,p,phase){const color=colors[p.color];c.save();c.translate(p.x,p.y);if(p.captured){circle(c,0,0,42,color+'18',color+'aa');c.lineWidth=1;circle(c,-23,-26,3,'#ffffffa0');}else{c.lineWidth=1;circle(c,0,0,37,color+'0a',color+'75');}c.restore();Art.diver(c,p,phase);if(!p.captured)text(c,p.color==='red'?'红':'蓝',p.x,p.y-45,10,color,'center');
  }
  function draw(c,s,cursor=null,reduced=false){const t=reduced?0:s.time,depth=Math.min(3,Math.floor(s.score/50)),top=['#4f9eaa','#3d879d','#286b84','#204c68'][depth],bottom=['#194b60','#174355','#13374b','#122e42'][depth];c.clearRect(0,0,800,600);const sea=c.createLinearGradient(0,0,0,600);sea.addColorStop(0,top);sea.addColorStop(1,bottom);c.fillStyle=sea;c.fillRect(0,0,800,600);
    // Soft sun shafts and layered seabed are drawn locally, with no image downloads.
    c.save();for(let i=0;i<5;i++){const x=90+i*166+Math.sin(t*.15+i)*16;c.beginPath();c.moveTo(x,0);c.lineTo(x+35,0);c.lineTo(x+210,580);c.lineTo(x+105,580);c.closePath();const beam=c.createLinearGradient(0,0,0,580);beam.addColorStop(0,'#d6eee422');beam.addColorStop(1,'#d6eee400');c.fillStyle=beam;c.fill();}c.restore();
    for(let i=0;i<32;i++){const x=(i*139+Math.sin(t*.22+i)*15)%800,y=((i*73-t*9)%530+530)%530;circle(c,x,y,1+i%3*.7,'#d6f1df24');}
    c.fillStyle='#133d4c55';c.beginPath();c.moveTo(0,475);for(let x=0;x<=800;x+=20)c.lineTo(x,475+Math.sin(x*.015)*22);c.lineTo(800,600);c.lineTo(0,600);c.fill();
    if(depth>=2){c.save();c.globalAlpha=.18;c.fillStyle='#bdd8ce';for(let x=340;x<480;x+=58){c.fillRect(x,412,20,100);c.fillRect(x-5,408,30,8);}c.fillRect(328,402,164,9);c.restore();}
    for(let i=0;i<6;i++){const x=i*163-15,y=520+i%2*28;coral(c,x,y,32+i%3*9,i%2?'#d7a59a66':'#98c5aa55',t*.7+i);}
    c.fillStyle='#123c49';c.beginPath();c.moveTo(0,552);for(let x=0;x<=800;x+=16)c.lineTo(x,558+Math.sin(x*.014)*11);c.lineTo(800,600);c.lineTo(0,600);c.fill();
    for(let i=0;i<20;i++){const x=i*43,y=584+(i%4)*4;c.strokeStyle='#79af9770';c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x-13+Math.sin(t+i)*6,y-18,x-3+Math.sin(t+i)*10,y-32-i%3*9);c.stroke();}
    for(let i=0;i<4;i++){const x=((t*(i%2?-19:16)+i*217)%960+960)%960-80,y=355+i*48+Math.sin(t*.5+i)*8;c.save();c.globalAlpha=.4;Art.fish(c,i%2?2:0,x,y,43,i%2?-1:1,t+i);c.restore();}
    c.setLineDash([3,8]);c.strokeStyle='#edc39b55';c.lineWidth=1;c.beginPath();c.moveTo(0,548);c.lineTo(800,548);c.stroke();c.setLineDash([]);text(c,'海 床 警 戒 线',775,538,10,'#f4d8ba88','right');
    for(const p of s.people)person(c,p,t+p.id);
    for(const b of s.bubbles){const r=Math.max(2,50*(1-b.age/.5));c.save();c.globalAlpha=Math.max(0,1-b.age/.5);c.lineWidth=2;circle(c,b.x,b.y,r,colors[b.color]+'22',colors[b.color]);c.beginPath();c.arc(b.x,b.y,r*.82,Math.PI*1.1,Math.PI*1.6);c.strokeStyle='#f0fbf1';c.stroke();c.restore();}
    for(const e of s.effects){c.save();c.globalAlpha=1-e.age/.9;text(c,e.text,e.x,e.y-e.age*42,16,colors[e.color],'center');c.restore();}
    if(cursor&&s.status==='running'){c.strokeStyle=colors[s.color];c.lineWidth=1;circle(c,cursor.x,cursor.y,19,null,colors[s.color]+'a0');c.beginPath();for(const [dx,dy]of [[-1,0],[1,0],[0,-1],[0,1]]){c.moveTo(cursor.x+dx*23,cursor.y+dy*23);c.lineTo(cursor.x+dx*29,cursor.y+dy*29);}c.stroke();}
    text(c,['浅海初航','珊瑚花园','遗迹海域','星光深海'][depth],24,33,12,'#e6f2dcbb');text(c,s.color==='blue'?'蓝色气泡':'红色气泡',776,33,12,colors[s.color],'right');
    if(s.noticeTime>0&&s.status==='running'){c.fillStyle='#123a4ab8';c.beginPath();c.roundRect(160,56,480,40,20);c.fill();text(c,s.notice,400,82,14,'#f3e2b9','center');}
    if(s.status!=='running'){if(s.status==='ready'){person(c,{x:237,y:300,color:'blue',captured:false,angle:-.13},t);person(c,{x:569,y:336,color:'blue',captured:true,angle:.1},t);}c.fillStyle='#092b3b66';c.fillRect(0,0,800,600);c.fillStyle='#1a4b5bc9';c.beginPath();c.roundRect(154,184,492,208,25);c.fill();c.strokeStyle='#c6e7db55';c.lineWidth=1;c.stroke();text(c,'C O R A L  B U B B L E',400,223,12,'#badfd1','center');text(c,s.status==='ready'?'珊瑚气泡':s.status==='paused'?'海流暂歇':'本次航程结束',400,275,36,'#f0f5e5','center');text(c,s.status==='over'?`救援 ${s.score} 人 · 最佳连救 ${s.maxCombo}`:s.status==='paused'?'点击继续救援，回到这片海域。':'点亮气泡，把他们送回海面。',400,320,16,'#c4e4db','center');text(c,s.status==='ready'?'点击下方「开始救援」或按回车':s.status==='paused'?'点击「继续救援」或按 Esc':'点击「再来一局」继续探索',400,360,12,'#e4d1a1','center');}
  }
  return {draw};
});
