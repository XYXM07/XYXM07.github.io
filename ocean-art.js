(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.OceanArt=factory();})(typeof window!=='undefined'?window:globalThis,()=>{
  'use strict';const TAU=Math.PI*2;
  const palette=[['#9bdccc','#356e80'],['#cbdde2','#5276a0'],['#eccf72','#9c7541'],['#cca794','#7a5e5b'],['#f2cd75','#98743b'],['#edddba','#6a9598'],['#efac9b','#ad666a'],['#c4b894','#867b62'],['#96d8cb','#709bb0'],['#b5d7a1','#608a6d'],['#9ecadc','#567c94'],['#92c9bf','#477d85'],['#b5e4df','#619bab'],['#c4dda0','#739e7c'],['#edc48c','#9d7358'],['#93baa8','#3e747c'],['#f0a267','#a56752'],['#83afbd','#335d73'],['#a8d6da','#588797']];
  function oval(c,x,y,rx,ry,color,angle=0){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,angle,0,TAU);c.fill();}
  function path(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
  function eye(c,x,y,size=2.1){oval(c,x,y,size+1.1,size+1.1,'#f5efdb');oval(c,x+.6,y,size,size,'#203f50');oval(c,x+1,y-.7,.65,.65,'#ffffff');}
  function gradient(c,top,bottom,ry=18){const g=c.createLinearGradient(0,-ry,0,ry);g.addColorStop(0,top);g.addColorStop(.45,top);g.addColorStop(1,bottom);return g;}
  function fin(c,points,color,rays=true){path(c,points,color);if(rays){c.save();c.strokeStyle='#f0edce55';c.lineWidth=.7;for(let i=1;i<points.length-1;i++){c.beginPath();c.moveTo(...points[0]);c.lineTo(...points[i]);c.stroke();}c.restore();}}
  function tail(c,x,y,color,phase,wide=1){c.save();c.translate(x,y);c.rotate(Math.sin(phase)*.32);const breadth=(12+Math.cos(phase)*2)*wide;fin(c,[[1,0],[-19,-breadth],[-15,-2],[-20,breadth],[-3,4]],gradient(c,color,'#bcd8c188'));c.restore();}
  const EXTRA=[{"form":"slender","body":"#d1e6d7","shade":"#537d94"},{"form":"oval","body":"#b8d7df","shade":"#446782"},{"form":"mackerel","body":"#88bbbf","shade":"#466a87"},{"form":"flying","body":"#a6d7d9","shade":"#4f909a"},{"form":"butterfly","body":"#e4d89c","shade":"#987d56"},{"form":"tang","body":"#81bbd1","shade":"#406e8b"},{"form":"puffer","body":"#d5d39e","shade":"#7f956e"},{"form":"lion","body":"#dea88e","shade":"#975f58"},{"form":"mullet","body":"#ddaa9e","shade":"#9b6c65"},{"form":"grouper","body":"#b4b393","shade":"#6f7d68"},{"form":"barracuda","body":"#bcd3ca","shade":"#5b8484"},{"form":"tuna","body":"#8ab8c7","shade":"#426b86"},{"form":"sword","body":"#a6c9cf","shade":"#416e86"},{"form":"mahi","body":"#b4d7ac","shade":"#62987e"},{"form":"sunfish","body":"#c9d6c9","shade":"#799a9c"},{"form":"manta","body":"#83b5c0","shade":"#3e7186"},{"form":"octopus","body":"#d3aa9d","shade":"#906d6d"},{"form":"cuttle","body":"#b1b8a6","shade":"#748c86"},{"form":"squid","body":"#d1e4dc","shade":"#77a6b2"},{"form":"goblin","body":"#c9aea9","shade":"#7d747e"},{"form":"frilled","body":"#a6b9a4","shade":"#547e78"},{"form":"coelacanth","body":"#91c1c0","shade":"#497f89"},{"form":"ribbon","body":"#d2dce2","shade":"#b88373"},{"form":"angler","body":"#79a4aa","shade":"#36536b"},{"form":"viper","body":"#c0d2c6","shade":"#557b89"},{"form":"fang","body":"#c7b491","shade":"#786c66"},{"form":"barreleye","body":"#b1d5c9","shade":"#5f9b8c"},{"form":"hatchet","body":"#c5dcdd","shade":"#618b9a"},{"form":"dragon","body":"#82aeb1","shade":"#345d72"},{"form":"tripod","body":"#c2cfc0","shade":"#7b9690"},{"form":"snail","body":"#d5c9bd","shade":"#998c87"},{"form":"dumbo","body":"#d4bda8","shade":"#a48276"},{"form":"isopod","body":"#c9c8b3","shade":"#7c8d7f"},{"form":"vampire","body":"#cdb09d","shade":"#886d6c"},{"form":"ghost","body":"#b9cfce","shade":"#678895"},{"form":"gulper","body":"#a9c1b6","shade":"#4b717d"},{"form":"whale","body":"#95bacd","shade":"#476a86"},{"form":"giant","body":"#decec0","shade":"#a28e87"}];
  function extraFish(c,type,x,y,size,direction,phase){const index=type-19,d=EXTRA[index],form=d.form,body=d.body,shade=d.shade,p=phase*(2.8+index%5*.55)+index*.8,w=Math.sin(p);c.save();c.translate(x,y);c.scale(size/80*(direction<0?-1:1),size/80);c.lineCap='round';c.lineJoin='round';
    if(['octopus','dumbo','vampire','squid','giant'].includes(form)){
      const big=['squid','giant'].includes(form),mantle=big?26:19,arms=form==='vampire'?8:6;
      if(form==='vampire'){c.fillStyle=gradient(c,body,shade,30);c.beginPath();c.moveTo(-19,0);for(let n=0;n<=8;n++){const a=Math.PI*n/8,px=-26*Math.cos(a),py=12+Math.sin(a)*(17+w*2);c.quadraticCurveTo(px,py+4,px,py);}c.lineTo(19,0);c.closePath();c.fill();}
      for(let n=0;n<arms;n++){const px=-17+n*34/(arms-1);c.strokeStyle=n%2?body:shade;c.lineWidth=big?2.8:4.5;c.beginPath();c.moveTo(px,3);c.bezierCurveTo(px+Math.sin(p+n)*8,15,px-Math.cos(p+n)*7,26,px+Math.sin(p+n*.5)*6,31+n%2*3);c.stroke();if(!big){c.fillStyle='#eddfc077';for(let k=0;k<3;k++)oval(c,px+Math.sin(p+n)*4,13+k*6,1,1,'#eddfc088');}}
      if(form==='dumbo'){oval(c,-19,-10,10,6,body,-.35+w*.3);oval(c,19,-10,10,6,body,.35-w*.3);}
      if(big){fin(c,[[-4,-25],[-23,-10+w*2],[-11,1]],body);fin(c,[[4,-25],[23,-10-w*2],[11,1]],body);}
      c.fillStyle=gradient(c,body,shade,26);c.beginPath();c.moveTo(0,-26);c.bezierCurveTo(-mantle,-27,-mantle-5,3,-12,10);c.quadraticCurveTo(0,15,12,10);c.bezierCurveTo(mantle+5,3,mantle,-27,0,-26);c.fill();oval(c,-5,-12,5,8,'#ede4ca33');eye(c,-7,-1,2);eye(c,7,-1,2);c.restore();return;
    }
    if(form==='manta'){
      c.fillStyle=gradient(c,body,shade,30);c.beginPath();c.moveTo(25,0);c.bezierCurveTo(15,-12,-6,-15,-36,-30+w*3);c.quadraticCurveTo(-45,-17,-25,0);c.quadraticCurveTo(-45,17,-36,30-w*3);c.bezierCurveTo(-6,15,15,12,25,0);c.fill();c.strokeStyle=shade;c.lineWidth=2;c.beginPath();c.moveTo(-22,0);c.bezierCurveTo(-34,w*4,-40,-w*4,-54,w*4);c.stroke();oval(c,1,0,17,8,'#d6e1cf44');eye(c,15,-6,1.7);eye(c,15,6,1.7);c.restore();return;
    }
    if(form==='isopod'){
      for(let n=0;n<6;n++){const px=-26+n*10;for(const dir of [-1,1]){c.strokeStyle=shade;c.lineWidth=2;c.beginPath();c.moveTo(px,dir*10);c.lineTo(px-5+Math.sin(p+n)*2,dir*20);c.lineTo(px-11,dir*25);c.stroke();}}
      oval(c,-4,0,33,16,gradient(c,body,shade));c.strokeStyle=shade;c.lineWidth=1.5;for(let n=0;n<7;n++){c.beginPath();c.ellipse(-27+n*8,0,5,14,0,-Math.PI/2,Math.PI/2);c.stroke();}oval(c,29,0,9,10,body);eye(c,32,-4,1.5);c.strokeStyle=body;c.lineWidth=1;c.beginPath();c.moveTo(35,-4);c.quadraticCurveTo(46,-11-w*3,53,-8);c.moveTo(35,4);c.quadraticCurveTo(46,11+w*3,53,8);c.stroke();c.restore();return;
    }
    if(['frilled','ribbon','dragon','gulper'].includes(form)){
      const ribbon=form==='ribbon',jaw=form==='gulper',points=[];for(let n=0;n<=30;n++){const px=-50+n*80/30,py=Math.sin(p-n*.32)*7*(1-n/30);points.push([px,py]);}c.strokeStyle=gradient(c,body,shade,10);c.lineWidth=ribbon?9:jaw?5:11;c.beginPath();points.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.stroke();
      if(ribbon){c.strokeStyle='#c7927e';c.lineWidth=2;for(let n=0;n<26;n++){const [px,py]=points[n];c.beginPath();c.moveTo(px,py-4);c.lineTo(px-2,py-12-w*2);c.stroke();}}
      oval(c,30,0,jaw?21:13,jaw?19:9,gradient(c,body,shade));eye(c,36,-4,1.8);
      if(jaw){path(c,[[28,3],[49,1],[39,14],[27,11]],'#d8d9b8');path(c,[[32,4],[45,3],[37,10]],shade);}
      if(form==='frilled'){c.strokeStyle=shade;c.lineWidth=1.6;for(let n=0;n<5;n++){c.beginPath();c.moveTo(12-n*5,-5);c.quadraticCurveTo(6-n*5,0,12-n*5,6);c.stroke();}}
      if(form==='dragon'){for(let n=0;n<8;n++)oval(c,-37+n*8,3,1.5,1.5,'#bee1c6');c.strokeStyle=body;c.lineWidth=1;c.beginPath();c.moveTo(38,8);c.quadraticCurveTo(42,20,27+w*4,24);c.stroke();oval(c,27+w*4,24,2,2,'#e5ddb0');}
      c.restore();return;
    }
    if(form==='puffer'){
      const ry=19+(w+1)*2;for(let n=0;n<14;n++){const a=n*TAU/14;c.strokeStyle=shade;c.lineWidth=1.3;c.beginPath();c.moveTo(Math.cos(a)*25,Math.sin(a)*ry);c.lineTo(Math.cos(a)*31,Math.sin(a)*(ry+5));c.stroke();}
      tail(c,-22,0,shade,p,.55);oval(c,0,0,27,ry,gradient(c,body,shade,24));for(let n=0;n<14;n++)oval(c,-15+n%5*7,-9+Math.floor(n/5)*8,1.8,1.8,shade);eye(c,17,-5,2.3);oval(c,26,2,3,2,shade);c.restore();return;
    }
    if(form==='sunfish'){
      fin(c,[[0,-12],[-6,-31+w*2],[14,-16]],shade);fin(c,[[0,12],[-5,31-w*2],[14,16]],shade);oval(c,-2,0,27,22,gradient(c,body,shade,24));fin(c,[[-24,-10],[-33,-7],[-34,8],[-24,10]],shade);eye(c,16,-6,2);oval(c,24,3,2.5,2,shade);c.restore();return;
    }
    const slim=['slender','barracuda','sword','ghost','viper','tripod'].includes(form),tall=['butterfly','tang','hatchet','fang'].includes(form),fat=['grouper','mahi','whale','barreleye','angler'].includes(form),rx=slim?38:fat?33:28,ry=slim?9:tall?21:fat?17:14;
    tail(c,-rx+8,w,shade,p,form==='tuna'?1.05:.9);
    if(form==='lion'){for(let n=0;n<8;n++){const px=-21+n*6;fin(c,[[px,-7],[px-8,-29+Math.sin(p+n)*2],[px+4,-9]],'#d9aa8788');}}
    else fin(c,[[-20,-ry*.6],[-4,-ry-8-w],[13,-ry*.7]],shade);
    fin(c,[[-9,ry*.6],[1,ry+8],[14,ry*.7]],shade);
    c.fillStyle=gradient(c,body,shade,ry);c.beginPath();c.moveTo(-rx+6,w);c.bezierCurveTo(-rx,-ry,-7,-ry*1.2,15,-ry*.65);c.quadraticCurveTo(rx+8,-ry*.5,rx,4);c.bezierCurveTo(10,ry*1.25,-15,ry*1.1,-rx+6,w);c.fill();
    c.save();c.clip();oval(c,0,ry*.48,rx*.85,ry*.4,'#edf0d356');
    if(['mackerel','lion','butterfly','tang'].includes(form)){c.strokeStyle=shade;c.lineWidth=form==='lion'?3:2.3;for(let n=0;n<7;n++){const px=-24+n*8;c.beginPath();c.moveTo(px,-25);c.bezierCurveTo(px+6,-10,px-6,0,px+3,25);c.stroke();}}
    if(['grouper','mullet','coelacanth','mahi'].includes(form)){for(let n=0;n<22;n++)oval(c,-22+n%7*7,-8+Math.floor(n/7)*6,1.3+n%3*.35,1.3,shade);}
    if(['herring','slender','tuna'].includes(form)){c.strokeStyle='#c9e4df';c.lineWidth=2;c.beginPath();c.moveTo(-27,0);c.lineTo(22,-2);c.stroke();}
    c.restore();
    if(['flying','coelacanth'].includes(form)){for(const dir of [-1,1])fin(c,[[-2,dir*3],[-31,dir*(25+w*3)],[-5,dir*18],[9,dir*6]],gradient(c,body,'#cadbca66'));}
    else fin(c,[[0,2],[-16,11+w*3],[-3,15],[5,6]],'#d5e1c47a');
    if(['sword','goblin'].includes(form))path(c,[[rx-5,-5],[56,-7],[rx,2]],body);
    if(form==='barreleye'){const opacity=c.globalAlpha;c.globalAlpha=opacity*.6;oval(c,19,-4,17,14,'#d9e8dc');c.globalAlpha=opacity;oval(c,16,-9,3.5,5,'#89bba0');oval(c,24,-9,3.5,5,'#abc998');}
    if(form==='hatchet')fin(c,[[-14,7],[5,27],[24,9]],'#c9d5bd');
    if(form==='tripod'){c.strokeStyle=body;c.lineWidth=1.3;for(const px of [-8,7,21]){c.beginPath();c.moveTo(px,6);c.lineTo(px-17+Math.sin(p+px)*2,34);c.stroke();}}
    if(form==='mullet'){c.strokeStyle=body;c.lineWidth=1.2;c.beginPath();c.moveTo(24,8);c.quadraticCurveTo(18,20,8+w*4,19);c.moveTo(24,8);c.quadraticCurveTo(28,20,19-w*3,22);c.stroke();}
    if(['viper','fang','barracuda'].includes(form)){path(c,[[rx-11,4],[rx,2],[rx-4,13],[rx-15,10]],shade);for(let n=0;n<3;n++)path(c,[[rx-12+n*4,4],[rx-10+n*4,10],[rx-8+n*4,4]],'#eee1bb');}
    if(form==='angler'){const lx=28+w*2,ly=-27;c.strokeStyle=body;c.lineWidth=1.5;c.beginPath();c.moveTo(5,-12);c.bezierCurveTo(0,-31,22,-35,lx,ly);c.stroke();c.save();c.shadowBlur=5;c.shadowColor='#d8e5a7';oval(c,lx,ly,3,3,'#e6ecc0');c.restore();path(c,[[17,5],[32,4],[26,13]],'#d7dcbc');}
    if(form==='snail'){c.strokeStyle='#e5ddc280';c.lineWidth=2;c.beginPath();c.moveTo(-23,-8);c.quadraticCurveTo(0,-22,22,-5);c.stroke();}
    if(form==='whale'){fin(c,[[7,9],[-13,26-w*2],[15,16]],shade);oval(c,1,9,24,5,'#dae5d876');}
    if(form==='tuna'){for(let n=0;n<4;n++)fin(c,[[-16-n*3,-7],[-19-n*3,-13],[-21-n*3,-6]],'#d1c889');}
    eye(c,rx-9,-4,form==='fang'?2.6:1.8);c.strokeStyle=shade;c.lineWidth=1;c.beginPath();c.moveTo(rx-3,5);c.quadraticCurveTo(rx-6,8,rx-10,5);c.stroke();c.restore();
  }
  function fish(c,type,x,y,size=60,direction=1,phase=0){type=Math.max(0,Math.min(56,type|0));if(type>=19){extraFish(c,type,x,y,size,direction,phase);return;}const [body,shade]=palette[type],swim=phase*(type===15?6:type===11?2:4.4)+type*.7,wave=Math.sin(swim);c.save();c.translate(x,y);c.scale(size/80*(direction<0?-1:1),size/80);c.lineCap='round';c.lineJoin='round';
    if(type===11){
      for(const [px,py,a]of [[-23,-14,-.65],[-23,14,.65],[8,-14,.5],[8,14,-.5]]){c.save();c.translate(px,py);c.rotate(a+wave*(py<0?.24:-.24));c.fillStyle=gradient(c,body,shade,12);c.beginPath();c.moveTo(0,0);c.bezierCurveTo(-6,-7,-19,-5,-13,1);c.quadraticCurveTo(-6,8,0,0);c.fill();c.restore();}
      path(c,[[-28,0],[-39,-3],[-40,4]],shade);oval(c,25,-2,13,10,gradient(c,body,'#d0e4bf'));oval(c,-10,0,24,16,gradient(c,'#719f91','#386e74'));c.strokeStyle='#accfb3';c.lineWidth=1.2;
      for(let row=-1;row<=1;row++)for(let col=0;col<3;col++){const px=-23+col*12+(row%2?4:0),py=row*8;c.beginPath();c.moveTo(px,py-4);c.lineTo(px+6,py-7);c.lineTo(px+11,py-3);c.lineTo(px+9,py+4);c.lineTo(px+3,py+6);c.closePath();c.stroke();}
      oval(c,-15,-6,10,3,'#d1dfb52b');eye(c,31,-5,1.8);c.restore();return;
    }
    if(type===12||type===13){
      const pulse=(Math.sin(phase*2.8+type)+1)/2,bell=22+pulse*4;
      c.strokeStyle=shade;c.lineWidth=1.8;for(let n=0;n<7;n++){const px=-18+n*6;c.beginPath();c.moveTo(px,6);c.bezierCurveTo(px+Math.sin(swim+n)*6,15,px-Math.sin(swim+n)*7,24,px+Math.sin(swim+n*.8)*5,31+n%2*4);c.stroke();}
      const opacity=c.globalAlpha;c.globalAlpha=opacity*.82;c.fillStyle=gradient(c,'#e1eee4',body,22);c.beginPath();c.moveTo(-bell,7);c.bezierCurveTo(-bell-2,-6,-15,-22,0,-22);c.bezierCurveTo(15,-22,bell+2,-6,bell,7);c.quadraticCurveTo(0,15+pulse*2,-bell,7);c.fill();c.globalAlpha=opacity;
      c.strokeStyle='#f4f1d786';c.lineWidth=1;c.beginPath();c.moveTo(-bell+5,4);c.quadraticCurveTo(0,-4-pulse*5,bell-5,4);c.stroke();for(let n=-1;n<=1;n++)oval(c,n*7,-3,2.2,3.4,'#e7ecc674');eye(c,-7,1,1.3);eye(c,7,1,1.3);c.restore();return;
    }
    if(type===14){
      fin(c,[[-8,-6],[-23,-13+wave*2],[-20,7],[-7,7]],'#d8c59a88');c.strokeStyle=shade;c.lineWidth=9;c.beginPath();c.moveTo(2,-22);c.bezierCurveTo(-17,-17,-13,0,-1,9);c.bezierCurveTo(16,25+wave*3,-9,34,-13,21);c.bezierCurveTo(-14,13,-5,12,-3,18+wave*2);c.stroke();
      c.strokeStyle=body;c.lineWidth=5;c.beginPath();c.moveTo(2,-21);c.bezierCurveTo(-13,-14,-10,0,0,9);c.bezierCurveTo(14,24,-9,30,-11,21);c.stroke();oval(c,4,-20,11,9,gradient(c,'#f0d2a1',shade));path(c,[[10,-23],[25,-18],[25,-13],[7,-15]],body);
      c.strokeStyle='#896951';c.lineWidth=1;for(let i=0;i<5;i++){c.beginPath();c.moveTo(-10+i*.7,-12+i*5);c.lineTo(-4+i*1.2,-10+i*5);c.stroke();}eye(c,8,-23,1.8);c.restore();return;
    }
    if(type===15){
      const points=[];for(let n=0;n<=24;n++){const px=-37+n*66/24,py=-4+Math.sin(swim-n*.38)*10*(1-n/24);points.push([px,py]);}
      c.strokeStyle=gradient(c,body,shade,15);c.lineWidth=14;c.beginPath();points.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.stroke();c.strokeStyle='#c7dbc064';c.lineWidth=2;c.beginPath();points.forEach(([px,py],i)=>i?c.lineTo(px,py-3):c.moveTo(px,py-3));c.stroke();oval(c,29,-4,10,7,gradient(c,body,shade,9));eye(c,33,-7,1.5);c.restore();return;
    }
    if(type===18){
      tail(c,-29,0,shade,swim,.92);c.fillStyle=gradient(c,'#b9dfe1',shade,18);c.beginPath();c.moveTo(-32,0);c.bezierCurveTo(-28,-23,23,-23,30,-1);c.bezierCurveTo(35,15,-17,23,-32,0);c.fill();oval(c,0,8,24,6,'#e4ece0aa');fin(c,[[1,8],[-14+wave*2,24],[9,14]],shade);path(c,[[18,-4],[56,-13],[24,1]],'#e3d4ad');c.strokeStyle='#aa9574';c.lineWidth=.8;for(let n=0;n<5;n++){c.beginPath();c.moveTo(25+n*5,-5-n);c.lineTo(27+n*5,-1-n*1.4);c.stroke();}eye(c,18,-5,2.1);c.strokeStyle='#486f81';c.beginPath();c.moveTo(24,6);c.quadraticCurveTo(27,8,29,6);c.stroke();c.restore();return;
    }
    const slim=type<3,flat=type===7,tall=type===5,rx=slim?29:flat?31:26,ry=slim?10:flat?12:tall?23:16,root=-rx+7,bend=wave*1.6;
    tail(c,root,bend,shade,swim,tall?1.1:1);
    fin(c,[[root+3,-ry*.6],[0,-ry-9-wave*1.3],[13,-ry*.5]],shade);
    fin(c,[[-5,ry*.55],[5+wave*2,ry+8],[15,ry*.6]],shade);
    c.fillStyle=gradient(c,body,shade,ry);c.beginPath();c.moveTo(root,bend);c.bezierCurveTo(-rx,-ry*.6,-8,-ry*1.15,9,-ry*.8);c.bezierCurveTo(rx,-ry*.65,rx+3,ry*.3,rx-2,ry*.35);c.bezierCurveTo(13,ry*1.05,-11,ry*1.08,root,bend);c.closePath();c.fill();
    c.save();c.clip();const belly=gradient(c,'#f4efdd05','#f4efddaa',ry);c.fillStyle=belly;c.fillRect(-rx,0,rx*2,ry);
    if(type===1||type===2||type===8){c.strokeStyle=type===8?'#dfb386':type===2?'#f5e3a1':'#587dab';c.lineWidth=2.6;c.beginPath();c.moveTo(root,0);c.bezierCurveTo(-10,-2,5,-4,rx-7,-1);c.stroke();}
    if([3,4,7].includes(type)){for(let n=0;n<16;n++){const px=-17+n%5*7.5,py=-8+Math.floor(n/5)*5.8;oval(c,px,py,1.4+n%2*.3,1.1,shade);}if(type===3){c.strokeStyle='#dfa996';c.lineWidth=2;c.beginPath();c.moveTo(-22,1);c.lineTo(17,0);c.stroke();}}
    if(type===5||type===16){c.strokeStyle=type===16?'#f7ebd5':'#597f86';c.lineWidth=type===16?5:3.4;for(const px of [-12,2,15]){c.beginPath();c.moveTo(px-4,-30);c.quadraticCurveTo(px,0,px+3,30);c.stroke();}}
    if(type===9||type===10||type===6){c.strokeStyle='#e4e9cf38';c.lineWidth=.7;for(let row=0;row<3;row++)for(let col=0;col<5;col++){c.beginPath();c.arc(-15+col*6+row%2*3,-6+row*5,2.4,-.6,.8);c.stroke();}}
    c.restore();
    if(type===9||type===10){c.fillStyle=gradient(c,body,shade,10);c.beginPath();c.moveTo(17,-8);c.quadraticCurveTo(31,-7,44,-4);c.lineTo(43,3);c.quadraticCurveTo(29,5,18,8);c.fill();}
    c.save();c.translate(-1,5);c.rotate(-.25+Math.sin(swim+.8)*.22);fin(c,[[0,-3],[-13,1],[-4,10],[3,3]],'#d6e3c96a');c.restore();
    c.strokeStyle=shade;c.lineWidth=1;c.beginPath();c.moveTo(rx-10,-8);c.quadraticCurveTo(rx-16,0,rx-11,8);c.stroke();
    if(flat){eye(c,15,-5,1.5);eye(c,22,-2,1.5);}else eye(c,rx-7,-4,slim?1.6:2);
    if(type===17){const lureX=30+Math.sin(phase*2)*2,lureY=-25+Math.sin(phase*2)*2;c.strokeStyle=body;c.lineWidth=1.7;c.beginPath();c.moveTo(8,-12);c.bezierCurveTo(3,-35,28,-39,lureX,lureY);c.stroke();c.save();c.shadowBlur=7+wave*2;c.shadowColor='#e3e6a0';oval(c,lureX,lureY,3.5,3.5,'#edf0b0');c.restore();path(c,[[11,5],[26,7],[20,12],[13,10]],'#d5dcc5');path(c,[[17,6],[20,7],[18,10]],shade);}
    c.strokeStyle=shade;c.lineWidth=.9;c.beginPath();c.moveTo(rx-2,5);c.quadraticCurveTo(rx-6,7+wave*.4,rx-10,6);c.stroke();oval(c,-2,-ry*.55,rx*.36,1.4,'#f3f0d445',-.06);c.restore();
  }
  function diver(c,p,phase=0){const color=p.color==='red'?'#e6a394':'#87c2d7',dark=p.color==='red'?'#b27773':'#578b9e';c.save();c.translate(p.x,p.y);c.rotate(p.angle||0);const flutter=p.captured?0:Math.sin(phase*4)*3;c.strokeStyle=dark;c.lineWidth=8;c.lineCap='round';c.beginPath();c.moveTo(-6,13);c.lineTo(-10-flutter,28);c.moveTo(6,13);c.lineTo(10+flutter,27);c.stroke();path(c,[[-14-flutter,26],[-4-flutter,26],[-3-flutter,34],[-20-flutter,31]],color);path(c,[[4+flutter,26],[15+flutter,25],[21+flutter,30],[4+flutter,33]],color);c.strokeStyle=color;c.lineWidth=7;c.beginPath();c.moveTo(-9,3);c.lineTo(p.captured?-23:-20,p.captured?-9:12+flutter);c.moveTo(9,3);c.lineTo(p.captured?23:20,p.captured?-9:10-flutter);c.stroke();c.fillStyle=dark;c.beginPath();c.roundRect(-11,-3,22,22,8);c.fill();c.fillStyle=color;c.beginPath();c.roundRect(-8,1,16,13,5);c.fill();oval(c,0,-14,20,19,color);oval(c,0,-13,16,15,'#e5dac0');path(c,[[-15,-22],[-6,-30],[6,-29],[14,-19],[5,-23],[-6,-20]],'#5b6868');c.fillStyle='#edf4dba8';c.beginPath();c.roundRect(-14,-19,28,13,5);c.fill();c.strokeStyle=dark;c.lineWidth=2;c.stroke();eye(c,-6,-13,1.6);eye(c,6,-13,1.6);c.strokeStyle='#9b8175';c.lineWidth=1;c.beginPath();c.moveTo(-3,-2);c.quadraticCurveTo(0,0,3,-2);c.stroke();c.restore();}
  const heads=Array.from({length:19},(_,type)=>({x:[0,1,2].includes(type)?29:type===7?31:26,y:0,angle:-Math.PI/2}));
  Object.assign(heads[9],{x:44});Object.assign(heads[10],{x:44});Object.assign(heads[11],{x:38,y:-2});
  for(const type of [12,13])Object.assign(heads[type],{x:0,y:-22,angle:0});
  Object.assign(heads[14],{x:24,y:-15,angle:0});Object.assign(heads[15],{x:38,y:-4});Object.assign(heads[17],{x:26,y:5});Object.assign(heads[18],{x:30,y:4});
  heads.push(...EXTRA.map(d=>{const vertical=['octopus','dumbo','vampire','squid','giant'].includes(d.form),slim=['slender','barracuda','sword','ghost','viper','tripod'].includes(d.form),fat=['grouper','mahi','whale','barreleye','angler'].includes(d.form);return vertical?{x:0,y:-26,angle:0}:{x:d.form==='manta'?25:d.form==='isopod'?38:['frilled','ribbon','dragon'].includes(d.form)?43:d.form==='gulper'?50:d.form==='puffer'?29:d.form==='sunfish'?26:slim?38:fat?33:28,y:0,angle:-Math.PI/2};}));
  function hanging(c,type,x,y,size,swing=0,phase=0){const head=heads[type],k=size/80;c.save();c.translate(x,y);c.rotate(head.angle+swing);fish(c,type,-head.x*k,-head.y*k,size,1,phase);c.restore();}
  return {fish,diver,hanging,heads,palette:[...palette,...EXTRA.map(d=>[d.body,d.shade])]};
});
