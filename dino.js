(() => {
  'use strict';
  const L = window.DinoLogic, $ = selector => document.querySelector(selector);
  const canvas = $('#dino-canvas'), ctx = canvas.getContext('2d');
  const startButton = $('#dino-start'), pauseButton = $('#dino-pause');
  const jumpButton = $('#dino-jump'), duckButton = $('#dino-duck');
  let state = L.create(), frame = 0, last = 0, night = 0, best = 0;
  function active() { return !$('#page-games').hidden && !$('#game-dino').hidden && !$('#games-workspace').hidden; }
  function text(selector, value) { const node = $(selector); if (node.textContent !== String(value)) node.textContent = value; }
  function update() {
    window.GameExchange?.observe('dino', state.score);
    best = Math.max(best, state.score);
    text('#dino-score', state.score); text('#dino-best', best);
    startButton.textContent = state.phase === 'ready' ? '开始游戏' : state.phase === 'paused' ? '继续游戏' : '重新开始';
    pauseButton.textContent = state.phase === 'paused' ? '继续' : '暂停';
    pauseButton.disabled = !['running', 'paused'].includes(state.phase);
    duckButton.setAttribute('aria-pressed', String(state.duck));
    text('#dino-status', { ready: '准备好，点击开始或按空格起跑。', running: '跳过仙人掌，按住下键躲避飞鸟。',
      paused: '已暂停，点击继续游戏。', over: `碰到障碍了，本局 ${state.score} 分。再试一次吧。` }[state.phase]);
  }
  function color(a, b) { return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * night)).join(',')})`; }
  function dino(ink, background) {
    const ground = state.height - 40, duck = state.duck && state.y <= .01;
    const x = 64, y = ground - (duck ? 28 : 48) - state.y;
    const leg = state.phase === 'running' && state.y === 0 ? Math.floor(state.elapsed * 12) % 2 : 0;
    ctx.fillStyle = ink;
    function pixel(a, b, w, h) { ctx.fillRect(Math.round(x + a * 2), Math.round(y + b * 2), w * 2, h * 2); }
    if (duck) {
      pixel(19, 0, 11, 8); pixel(4, 6, 22, 6); pixel(0, 4, 4, 5);
      pixel(8, 11, 3, leg ? 2 : 3); pixel(19, 11, 3, leg ? 3 : 2);
      ctx.fillStyle = background; pixel(26, 2, 1, 1);
    } else {
      pixel(12, 0, 10, 8); pixel(11, 1, 1, 7); pixel(12, 8, 6, 3);
      pixel(7, 9, 10, 11); pixel(4, 12, 3, 7); pixel(2, 10, 2, 6); pixel(0, 7, 2, 7);
      pixel(17, 11, 4, 2); pixel(20, 12, 1, 3);
      pixel(7, 18, 4, 4); pixel(13, 18, 4, 4);
      pixel(8, 21, 2, leg ? 2 : 3); pixel(8, leg ? 22 : 23, 4, 1);
      pixel(14, 21, 2, leg ? 3 : 2); pixel(14, leg ? 23 : 22, 4, 1);
      ctx.fillStyle = background; pixel(17, 2, 1, 1); pixel(16, 7, 6, 1);
    }
  }
  function draw() {
    const { width, height } = state, ground = height - 40;
    const background = color([247, 248, 242], [19, 42, 55]);
    const ink = color([71, 89, 94], [231, 241, 218]);
    ctx.fillStyle = background; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = ink; ctx.globalAlpha = .18;
    for (let i = 0; i < 4; i++) {
      const x = ((i * 257 - state.distance * .12) % (width + 140) + width + 140) % (width + 140) - 70;
      const y = 38 + i % 2 * 23;
      ctx.fillRect(x, y + 8, 44, 3); ctx.fillRect(x + 9, y, 20, 11); ctx.fillRect(x + 28, y + 4, 9, 7);
    }
    if (night > .05) {
      ctx.globalAlpha = night * .8;
      ctx.fillRect(width - 74, 25, 18, 18);
      for (let i = 0; i < 10; i++) ctx.fillRect((i * 97 + 31) % width, 21 + i * 19 % 72, 2, 2);
    }
    ctx.globalAlpha = .7; ctx.fillStyle = ink; ctx.fillRect(0, ground, width, 1);
    for (let i = 0; i < Math.ceil(width / 70) + 1; i++) {
      const x = i * 70 - state.distance % 70;
      ctx.fillRect(x + 7, ground + 12 + i % 3 * 4, 5 + i % 4 * 2, 2);
      ctx.fillRect(x + 37, ground + 7, 2, 2);
    }
    ctx.globalAlpha = 1;
    for (const obstacle of state.obstacles) {
      const y = ground - obstacle.lift - obstacle.height;
      ctx.fillStyle = ink;
      if (obstacle.kind === 'cactus') {
        for (let i = 0; i < obstacle.count; i++) {
          const x = Math.round(obstacle.x + i * 22), h = obstacle.height;
          ctx.fillRect(x + 8, y, 8, h); ctx.fillRect(x + 2, y + 12, 5, h * .45);
          ctx.fillRect(x + 3, y + h * .52, 9, 5); ctx.fillRect(x + 17, y + 8, 4, h * .42);
          ctx.fillRect(x + 12, y + h * .43, 9, 5);
        }
      } else {
        const x = Math.round(obstacle.x), wingUp = Math.floor(state.elapsed * 8) % 2;
        ctx.fillRect(x + 10, y + 11, 27, 9); ctx.fillRect(x + 3, y + 8, 14, 10);
        ctx.fillRect(x, y + 14, 5, 3); ctx.fillRect(x + 35, y + 14, 12, 4);
        ctx.fillRect(x + 21, y + (wingUp ? 1 : 17), 9, 13);
      }
    }
    dino(ink, background);
    ctx.globalAlpha = .6; ctx.fillStyle = ink; ctx.font = '11px ui-monospace, monospace';
    ctx.textAlign = 'right'; ctx.fillText(`HI ${String(best).padStart(5, '0')}   ${String(state.score).padStart(5, '0')}`, width - 20, 25);
    ctx.globalAlpha = 1;
    if (state.phase !== 'running') {
      ctx.fillStyle = background; ctx.globalAlpha = .9; ctx.fillRect(width / 2 - 125, 75, 250, 71); ctx.globalAlpha = 1;
      ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.font = '17px "Microsoft YaHei", sans-serif';
      ctx.fillText({ ready: '小恐龙，准备出发。', paused: '暂停一下，再继续。', over: 'GAME OVER' }[state.phase], width / 2, 101);
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.fillText(state.phase === 'over' ? '点击或按空格，再跑一程' : state.phase === 'paused' ? '点击继续，回到跑道' : '轻触跳跃 · 按住下蹲', width / 2, 129);
    }
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    state.width = rect.width; state.height = rect.height;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * ratio); canvas.height = Math.round(rect.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.imageSmoothingEnabled = false;
    draw();
  }
  function tick(now) {
    frame = 0;
    if (state.phase !== 'running') return;
    if (!active() || document.hidden) { pause(); return; }
    const dt = Math.max(0, (now - last) / 1000); last = now;
    L.advance(state, dt);
    const targetNight = Math.floor(state.score / 500) % 2;
    night += (targetNight - night) * Math.min(1, dt * 2);
    update(); draw();
    if (state.phase !== 'over') frame = requestAnimationFrame(tick);
  }
  function start(reset = false) {
    if (!active()) return;
    cancelAnimationFrame(frame);
    if (reset || ['ready', 'over'].includes(state.phase)) {
      state = L.create(state.width, state.height); night = 0;
    }
    state.phase = 'running'; state.duck = false;
    last = performance.now(); resize(); update(); draw();
    frame = requestAnimationFrame(tick); canvas.focus({ preventScroll: true });
  }
  function pause() {
    if (state.phase !== 'running') return;
    state.phase = 'paused'; state.duck = false;
    cancelAnimationFrame(frame); frame = 0; update(); draw();
  }
  function leap() {
    if (!active()) return;
    if (state.phase !== 'running') start();
    L.jump(state);
  }
  function duck(value) { if (state.phase === 'running') { state.duck = value; update(); } }
  startButton.onclick = () => start(state.phase === 'running');
  pauseButton.onclick = () => state.phase === 'running' ? pause() : start();
  function hold(element, press, release) {
    element.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      event.preventDefault(); press();
      try { element.setPointerCapture(event.pointerId); } catch {}
    });
    element.addEventListener('pointerup', release);
    element.addEventListener('pointercancel', release);
    element.addEventListener('lostpointercapture', release);
  }
  hold(canvas, leap, () => L.releaseJump(state));
  hold(jumpButton, leap, () => L.releaseJump(state));
  hold(duckButton, () => duck(true), () => duck(false));
  jumpButton.onclick = event => { if (!event.detail) { leap(); L.releaseJump(state); } };
  duckButton.addEventListener('keydown', event => { if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); duck(true); } });
  duckButton.addEventListener('keyup', event => { if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); duck(false); } });
  canvas.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();
    if ([' ', 'arrowup', 'w'].includes(key)) { event.preventDefault(); if (!event.repeat) leap(); }
    if (['arrowdown', 's'].includes(key)) { event.preventDefault(); duck(true); }
    if (['p', 'escape'].includes(key)) { event.preventDefault(); if (!event.repeat) state.phase === 'running' ? pause() : state.phase === 'paused' && start(); }
  });
  canvas.addEventListener('keyup', event => {
    const key = event.key.toLowerCase();
    if ([' ', 'arrowup', 'w'].includes(key)) { event.preventDefault(); L.releaseJump(state); }
    if (['arrowdown', 's'].includes(key)) { event.preventDefault(); duck(false); }
  });
  document.addEventListener('hub:selection', event => { if (event.detail.kind === 'game' && event.detail.name !== 'dino') pause(); });
  document.addEventListener('site:pagechange', event => { if (event.detail.page !== 'games' || event.detail.section !== 'dino') pause(); else resize(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('blur', pause);
  if (typeof ResizeObserver === 'function') new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize);
  update(); resize(); draw();
})();
