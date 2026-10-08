(() => {
  'use strict';
  const panel=document.querySelector('#game-coral');if(!panel)return;
  const $=s=>panel.querySelector(s),L=window.CoralLogic,V=window.CoralView,canvas=$('#coral-canvas'),ctx=canvas.getContext('2d');
  const records=L.load(null);let state=L.fresh(),active=false,frame=0,last=0,cursor=null,audio=null,lastScore=0,lastNotice='',dirty=true;
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  function render(){V.draw(ctx,state,cursor,reduced);}
  function update(){const wasBest=records.best[state.mode];records.best[state.mode]=Math.max(wasBest,state.score);const achieved=L.MILESTONES.filter(n=>state.score>=n&&!records.achievements.includes(n));records.achievements.push(...achieved);
    if(state.score>lastScore){records.rescued+=state.score-lastScore;lastScore=state.score;tone(540,.08);}if(achieved.length||wasBest!==records.best[state.mode]){dirty=true;}
    window.GameExchange?.observe('coral',records.rescued);$('#coral-score').textContent=state.score;$('#coral-best').textContent=records.best[state.mode];$('#coral-lives').textContent=Math.max(0,state.lives);const seconds=Math.floor(state.time);$('#coral-time').textContent=Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0');
    $('#coral-start').disabled=state.status==='running';$('#coral-start').textContent=state.status==='paused'?'继续救援':state.status==='over'?'再来一局':'开始救援';$('#coral-pause').disabled=!['running','paused'].includes(state.status);$('#coral-pause').textContent=state.status==='paused'?'继续':'暂停';$('#coral-color').disabled=!state.redUnlocked||state.status!=='running';$('#coral-color').dataset.color=state.color;$('#coral-color span').textContent=(state.color==='blue'?'蓝色':'红色')+'气泡'+(state.redUnlocked?' · 点击切换':' · 10 分解锁切换');$('#coral-sound').setAttribute('aria-pressed',String(records.sound));$('#coral-sound').textContent='音效：'+(records.sound?'开':'关');
    for(const b of panel.querySelectorAll('[data-coral-mode]')){b.disabled=['running','paused'].includes(state.status);b.setAttribute('aria-pressed',String(b.dataset.coralMode===state.mode));}
    $('#coral-depth').textContent=['浅海初航','珊瑚花园','遗迹海域','星光深海'][Math.min(3,Math.floor(state.score/50))];$('#coral-accuracy').textContent=state.shots?Math.round(state.hits/state.shots*100)+'%':'—';$('#coral-combo').textContent=state.maxCombo;
    if(dirty){$('#coral-achievements').replaceChildren(...L.MILESTONES.map(n=>{const e=document.createElement('span'),unlocked=records.achievements.includes(n);e.textContent=n;e.classList.toggle('unlocked',unlocked);e.title=n+' 分里程碑 · '+(unlocked?'已解锁':'未解锁');e.setAttribute('aria-label',e.title);return e;}));dirty=false;}
    if(state.status==='over')$('#coral-status').textContent=`${L.MODES[state.mode].name}结束：救起 ${state.score} 人，最佳连救 ${state.maxCombo}。可以切换航程再试一次。`;
    else if(state.status==='paused')$('#coral-status').textContent='已暂停，人物和时间都已停下。点击继续救援。';
    else if(state.status==='ready')$('#coral-status').textContent='点击开始，救起蓝色人物。每个同色气泡只救起最近的一人。';
    else if(state.noticeTime>0){if(lastNotice!==state.notice){$('#coral-status').textContent=state.notice;lastNotice=state.notice;}}
    else $('#coral-status').textContent=state.redUnlocked?'蓝色救蓝色，红色救红色。空格或颜色按钮切换气泡。':'救起每个人得 1 分，10 分后解锁红色气泡。';
  }
  function tone(hz,duration){if(!records.sound||!audio)return;try{const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(hz,audio.currentTime);o.frequency.exponentialRampToValueAtTime(hz*1.4,audio.currentTime+duration);g.gain.setValueAtTime(.045,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{}}
  function enableAudio(){if(!records.sound)return;try{if(!audio){const Audio=window.AudioContext||window.webkitAudioContext;if(Audio)audio=new Audio();}if(audio?.state==='suspended')audio.resume().catch(()=>{});}catch{}}
  function animate(time){frame=0;if(!active||state.status!=='running')return;const dt=last?Math.min(.1,(time-last)/1000):0;last=time;L.step(state,dt);update();render();if(state.status==='running')frame=requestAnimationFrame(animate);}
  function run(){if(!active||document.hidden)return;enableAudio();if(state.status==='over'){state=L.fresh(state.mode);lastScore=0;lastNotice='';}L.start(state);last=0;update();render();if(!frame)frame=requestAnimationFrame(animate);canvas.focus({preventScroll:true});}
  function pause(){if(state.status==='running')state.status='paused';if(frame)cancelAnimationFrame(frame);frame=0;last=0;update();render();if(audio?.state==='running')audio.suspend().catch(()=>{});}
  function switchColor(){if(!active||state.status!=='running')return;if(L.toggle(state)){tone(360,.06);update();render();}}
  $('#coral-start').addEventListener('click',run);$('#coral-pause').addEventListener('click',()=>state.status==='paused'?run():pause());$('#coral-color').addEventListener('click',switchColor);
  $('#coral-sound').addEventListener('click',()=>{records.sound=!records.sound;enableAudio();if(records.sound)tone(480,.1);else if(audio)audio.suspend().catch(()=>{});update();});
  for(const b of panel.querySelectorAll('[data-coral-mode]'))b.addEventListener('click',()=>{if(['running','paused'].includes(state.status))return;state=L.fresh(b.dataset.coralMode);lastScore=0;lastNotice='';cursor=null;update();render();});
  function coordinates(e){const r=canvas.getBoundingClientRect();return {x:Math.max(0,Math.min(800,(e.clientX-r.left)*800/r.width)),y:Math.max(0,Math.min(600,(e.clientY-r.top)*600/r.height))};}
  canvas.addEventListener('pointerdown',e=>{if(e.button!==undefined&&e.button!==0||!active)return;e.preventDefault();cursor=coordinates(e);canvas.focus({preventScroll:true});if(state.status==='running'){enableAudio();L.shoot(state,cursor.x,cursor.y);tone(230,.05);update();render();}});
  canvas.addEventListener('pointermove',e=>{cursor=coordinates(e);if(state.status!=='running')render();});canvas.addEventListener('pointerleave',()=>{cursor=null;});
  canvas.addEventListener('keydown',e=>{if(!active)return;if(['Space','Enter','Escape','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyP'].includes(e.code))e.preventDefault();else return;if(e.repeat&&['Space','Escape','KeyP','Enter'].includes(e.code))return;
    if(e.code==='Escape'||e.code==='KeyP'){if(state.status==='running')pause();else if(state.status==='paused')run();return;}if(e.code==='Space'){switchColor();return;}if(e.code==='Enter'){if(state.status!=='running')run();else{cursor??={x:400,y:300};L.shoot(state,cursor.x,cursor.y);update();render();}return;}cursor??={x:400,y:300};const moves={ArrowUp:[0,-18],ArrowDown:[0,18],ArrowLeft:[-18,0],ArrowRight:[18,0]};const [x,y]=moves[e.code];cursor.x=Math.max(0,Math.min(800,cursor.x+x));cursor.y=Math.max(0,Math.min(600,cursor.y+y));render();
  });
  function selection(on){active=on;if(!on)pause();else{update();render();}}
  document.addEventListener('hub:selection',e=>{if(e.detail.kind==='game')selection(e.detail.name==='coral');});document.addEventListener('site:pagechange',e=>{if(e.detail.page!=='games')selection(false);});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('blur',pause);window.addEventListener('pagehide',pause);
  const ratio=Math.min(2,window.devicePixelRatio||1);canvas.width=800*ratio;canvas.height=600*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);
  active=location.hash.split('?')[0]==='#games/coral';update();render();
})();
