(() => {
  'use strict';
  const root = document.documentElement;
  const image = document.querySelector('.scene-image');
  const button = document.querySelector('#motion-toggle');
  if (!image || !button) return;
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const mobile = matchMedia('(pointer: coarse), (hover: none)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const orientation = window.DeviceOrientationEvent;
  const needsPermission = typeof orientation?.requestPermission === 'function';
  let enabled = false, received = false, baseline = null, frame = 0, waiting = 0;
  let target = { x: 0, y: 0 }, permissionGranted = false, noticeTimer;
  const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value));
  const angleDelta = (value, origin) => ((value - origin + 540) % 360) - 180;

  function notice(message) {
    const toast = document.querySelector('.toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
  }
  function move(x, y) {
    const scale = mobile.matches ? 1.06 : 1.045;
    // The overscan must always exceed the offset, including narrow landscape screens.
    const limitX = Math.max(0, Math.min(mobile.matches ? 8 : 10, innerWidth * (scale - 1) / 2 - 2));
    const limitY = Math.max(0, Math.min(mobile.matches ? 6 : 7, innerHeight * (scale - 1) / 2 - 2));
    target = { x: clamp(x, limitX), y: clamp(y, limitY) };
    if (!frame) frame = requestAnimationFrame(() => {
      frame = 0;
      root.style.setProperty('--scene-x', `${target.x.toFixed(3)}px`);
      root.style.setProperty('--scene-y', `${target.y.toFixed(3)}px`);
    });
  }
  function center() { baseline = null; move(0, 0); }
  function updateButton() {
    button.hidden = !mobile.matches || reduce.matches || !orientation;
    button.disabled = !window.isSecureContext;
    button.setAttribute('aria-pressed', String(enabled));
    button.textContent = !window.isSecureContext ? '重力感应需 HTTPS'
      : enabled ? received ? '关闭重力感应' : '等待重力感应' : '开启重力感应';
  }
  function tilt(event) {
    if (!enabled || document.hidden || reduce.matches || !mobile.matches || document.body.classList.contains('select-open')) return;
    if (!Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;
    if (!baseline) baseline = { beta: event.beta, gamma: event.gamma };
    if (!received) {
      received = true;
      clearTimeout(waiting);
      image.classList.add('is-tilt-active');
      updateButton();
    }
    const angle = (window.screen?.orientation?.angle ?? window.orientation ?? 0) * Math.PI / 180;
    const beta = angleDelta(event.beta, baseline.beta), gamma = angleDelta(event.gamma, baseline.gamma);
    const x = gamma * Math.cos(angle) + beta * Math.sin(angle);
    const y = beta * Math.cos(angle) - gamma * Math.sin(angle);
    move(-x / 25 * 8, -y / 25 * 6);
  }
  function listen(manual = false) {
    window.removeEventListener('deviceorientation', tilt);
    clearTimeout(waiting);
    if (document.hidden) return;
    window.addEventListener('deviceorientation', tilt, { passive: true });
    if (!received) waiting = setTimeout(() => {
      if (received) return;
      stop();
      button.title = '点击重试；若仍无响应，请使用手机浏览器打开。';
      if (manual) notice('当前浏览器未提供感应数据，可使用手机 Safari 或 Chrome 重试。');
    }, 5000);
  }
  function start(manual = false) {
    if (!mobile.matches || reduce.matches || !orientation || !window.isSecureContext) return;
    enabled = true;
    received = false;
    center();
    updateButton();
    listen(manual);
  }
  function stop() {
    enabled = false;
    received = false;
    clearTimeout(waiting);
    window.removeEventListener('deviceorientation', tilt);
    image.classList.remove('is-tilt-active');
    center();
    updateButton();
  }
  button.addEventListener('click', async () => {
    if (enabled) { stop(); return; }
    if (!mobile.matches || reduce.matches || !orientation || !window.isSecureContext) return;
    button.disabled = true;
    try {
      // Call directly from this click so browsers requiring user activation can prompt.
      if (needsPermission && !permissionGranted) {
        const permission = await orientation.requestPermission();
        if (permission !== 'granted') {
          notice('未开启重力感应，可允许浏览器访问运动与方向后重试。');
          return;
        }
        permissionGranted = true;
      }
      start(true);
    } catch {
      notice('无法开启重力感应，请检查浏览器的运动与方向权限。');
    } finally {
      updateButton();
    }
  });
  document.addEventListener('pointermove', event => {
    if (!fine.matches || event.pointerType === 'touch' || reduce.matches || document.hidden || document.body.classList.contains('select-open')) return;
    move((event.clientX / innerWidth - .5) * -20, (event.clientY / innerHeight - .5) * -14);
  }, { passive: true });
  document.addEventListener('pointerleave', () => { if (!enabled) center(); });
  document.addEventListener('visibilitychange', () => {
    center();
    if (document.hidden) {
      clearTimeout(waiting);
      window.removeEventListener('deviceorientation', tilt);
    } else if (enabled) listen();
  });
  window.addEventListener('resize', center, { passive: true });
  window.screen?.orientation?.addEventListener('change', center);
  window.addEventListener('orientationchange', center, { passive: true });
  function refresh() {
    root.style.setProperty('--scene-scale', mobile.matches ? '1.06' : '1.045');
    if (enabled && (!mobile.matches || reduce.matches)) stop();
    center();
    updateButton();
    if (!enabled && mobile.matches && !reduce.matches && !needsPermission) start();
  }
  mobile.addEventListener('change', refresh);
  reduce.addEventListener('change', refresh);
  refresh();
})();
