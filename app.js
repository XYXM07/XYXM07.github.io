(() => {
  'use strict';
  const config = window.SITE_CONFIG || {};
  const labels = { home: '首页', contact: '与我联系', games: '小游戏', tools: '工具栏', psychology: '心理测试' };
  const pages = [...document.querySelectorAll('.page')];
  const dialog = document.querySelector('#github-dialog');
  const mobileButton = document.querySelector('.mobile-menu');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let rendered = false;
  let renderedRoute = '';
  const routeHistory = [];
  const backButton = document.querySelector('#page-back');
  const footerContact = document.querySelector('#footer-contact');
  const pageContainer = document.querySelector('#page-container');
  const pageWipe = document.querySelector('.page-wipe');
  let routeTimer;
  let screenBlurTimer;
  let routeRevision = 0;
  let toastTimer;
  function notify(message) {
    const toast = document.querySelector('.toast');
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
  }
  function closeNavigation() {
    if (document.body.classList.contains('nav-open') && document.querySelector('.sidebar').contains(document.activeElement)) {
      mobileButton.focus({ preventScroll: true });
    }
    document.body.classList.remove('nav-open');
    mobileButton.setAttribute('aria-expanded', 'false');
    mobileButton.setAttribute('aria-label', '打开导航菜单');
    document.querySelectorAll('.disclosure').forEach(button => setDisclosure(button, false));
  }
  function setDisclosure(button, expanded) {
    if (button.getAttribute('aria-expanded') === String(expanded)) return;
    button.setAttribute('aria-expanded', String(expanded));
    const menu = document.getElementById(button.getAttribute('aria-controls'));
    if (button.parentElement.classList.contains('navigation')) menu.style.setProperty('--menu-left', `${button.offsetLeft}px`);
    menu.hidden = !expanded;
  }
  function readRoute() {
    const [route, section] = location.hash.slice(1).split('/');
    const requested = ({ github: 'contact', about: 'home', interests: 'home', explore: 'home' })[route] || route || 'home';
    const page = Object.hasOwn(labels, requested) ? requested : 'home';
    return { page, section };
  }
  function showPage() {
    const next = readRoute();
    const revision = ++routeRevision;
    stopRouteMotion();
    closeNavigation();
    if (renderedRoute === `${next.page}/${next.section || ''}`) return;
    if (!rendered || reduceMotion.matches) {
      renderPage(next);
      return;
    }
    // Keep the old view visible during departure; only the latest request may render.
    void pageContainer.offsetWidth;
    pageContainer.classList.add('is-leaving');
    pageWipe.classList.add('switching');
    screenBlurTimer = setTimeout(() => pageWipe.classList.remove('switching'), 220);
    routeTimer = setTimeout(() => {
      if (revision !== routeRevision) return;
      renderPage(next);
      pageContainer.classList.remove('is-leaving');
      void pageContainer.offsetWidth;
      pageContainer.classList.add('is-entering');
      routeTimer = setTimeout(() => {
        if (revision === routeRevision) pageContainer.classList.remove('is-entering');
      }, 240);
    }, 100);
  }
  function stopRouteMotion() {
    clearTimeout(routeTimer);
    clearTimeout(screenBlurTimer);
    pageContainer.classList.remove('is-leaving', 'is-entering');
    pageWipe.classList.remove('switching');
  }
  reduceMotion.addEventListener('change', () => {
    if (reduceMotion.matches) {
      stopRouteMotion();
      renderPage(readRoute());
    }
  });
  function prepareRouteFade(page) {
    pageContainer.querySelectorAll('.route-fade, .route-surface, .route-branch').forEach(element => element.classList.remove('route-fade', 'route-surface', 'route-branch'));
    const surfaces = new Map();
    const branches = new Set();
    function inspect(element) {
      // Include hidden panels: they can be opened before the route fade finishes.
      const style = getComputedStyle(element);
      const backdrop = style.backdropFilter || style.webkitBackdropFilter || 'none';
      let containsSurface = backdrop !== 'none';
      if (containsSurface) {
        surfaces.set(element, {
          background: style.backgroundColor, border: style.borderTopColor,
          color: style.color, shadow: style.boxShadow, backdrop
        });
      }
      for (const child of element.children) {
        if (inspect(child)) containsSurface = true;
      }
      if (containsSurface) branches.add(element);
      return containsSurface;
    }
    inspect(page);
    function visit(element) {
      if (element.hidden) return;
      // Glass stays opaque: interpolate its paint and blur, then fade its contents.
      if (surfaces.has(element)) {
        const style = surfaces.get(element);
        element.style.setProperty('--route-background', style.background);
        element.style.setProperty('--route-border', style.border);
        element.style.setProperty('--route-color', style.color);
        element.style.setProperty('--route-shadow', style.shadow);
        element.style.setProperty('--route-backdrop', style.backdrop);
        element.classList.add('route-surface');
        [...element.children].forEach(visit);
      } else if (!branches.has(element)) {
        element.classList.add('route-fade');
      } else {
        element.classList.add('route-branch');
        [...element.children].forEach(visit);
      }
    }
    [...page.children].forEach(visit);
  }
  function renderPage({ page, section }) {
    const navigationChanged = renderedRoute !== `${page}/${section || ''}`;
    renderedRoute = `${page}/${section || ''}`;
    const currentHash = `#${page}${section ? '/' + section : ''}`;
    if (routeHistory.at(-1) !== currentHash) {
      // Collapse a return to the preceding route so repeated Back clicks reach home.
      if (routeHistory.at(-2) === currentHash) routeHistory.pop();
      else routeHistory.push(currentHash);
    }
    backButton.hidden = page === 'home';
    footerContact.hidden = page === 'contact';
    pages.forEach(section => {
      const active = section.id === `page-${page}`;
      section.hidden = !active;
      section.classList.toggle('active', active);
    });
    document.querySelectorAll('[data-page], .submenu a, .directory-back').forEach(link => {
      const active = link.getAttribute('href') === `#${page}${section ? '/' + section : ''}`;
      link.classList.toggle('active', active);
      if (active) {
        link.setAttribute('aria-current', 'page');
      } else link.removeAttribute('aria-current');
    });
    document.querySelector('#page-label').textContent = labels[page];
    document.querySelectorAll('.navigation > .disclosure').forEach(button => button.classList.toggle('active', button.getAttribute('aria-controls') === `${page}-menu`));
    document.title = page === 'home' ? '星月晓梦的个人站' : `${labels[page]} · 星月晓梦`; 
    closeNavigation();
    rendered = true;
    document.dispatchEvent(new CustomEvent('site:pagechange', { detail: { page, section } }));
    prepareRouteFade(document.querySelector(`#page-${page}`));
    if (navigationChanged) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      const title = document.querySelector(`#page-${page} h1`);
      title.tabIndex = -1;
      title.focus({ preventScroll: true });
    }
  }
  document.querySelectorAll('.submenu').forEach(menu => {
    [...menu.children].forEach((item, index) => item.style.setProperty('--menu-index', index));
  });
  document.querySelectorAll('.disclosure').forEach(button => button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') !== 'true';
    document.querySelectorAll('.disclosure').forEach(other => { if (other !== button) setDisclosure(other, false); });
    setDisclosure(button, expanded);
  }));
  document.addEventListener('click', event => {
    const link = event.target.closest('.submenu a, .hub-navigation a');
    if (link && link.getAttribute('href') === location.hash) closeNavigation();
    if (!event.target.closest('.sidebar, .route-picker, .mobile-menu')) closeNavigation();
  });
  window.addEventListener('hashchange', showPage);
  backButton.addEventListener('click', () => {
    const previous = routeHistory.at(-2);
    const [page, section] = renderedRoute.split('/');
    // A direct link has no site history: return to its directory, or to home.
    if (!previous) routeHistory.length = 0;
    location.hash = previous || (section ? `#${page}` : '#home');
  });
  showPage();
  document.querySelectorAll('.avatar').forEach(img => {
    img.addEventListener('error', () => { img.src = 'avatar.svg'; }, { once: true });
    if (config.avatar) img.src = config.avatar;
  });
  const now = new Date();
  document.querySelector('#today').textContent = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }).format(now);
  document.querySelector('#year').textContent = now.getFullYear();
  const themeButton = document.querySelector('.theme-toggle');
  function setTheme(light) {
    document.body.classList.toggle('light', light);
    themeButton.querySelector('use').setAttribute('href', light ? '#i-moon' : '#i-sun');
    themeButton.querySelector('span').textContent = light ? '切换深色' : '切换浅色';
    themeButton.setAttribute('aria-label', light ? '切换为深色主题' : '切换为浅色主题');
    document.querySelector('meta[name="theme-color"]').content = light ? '#487b8a' : '#183544';
  }
  try { setTheme(localStorage.getItem('star-moon-theme') === 'light'); } catch { setTheme(false); }
  themeButton.addEventListener('click', () => {
    const light = !document.body.classList.contains('light');
    setTheme(light);
    try { localStorage.setItem('star-moon-theme', light ? 'light' : 'dark'); } catch { /* Theme works even if storage is disabled. */ }
  });
  mobileButton.addEventListener('click', () => {
    const open = document.body.classList.toggle('nav-open');
    mobileButton.setAttribute('aria-expanded', String(open));
    mobileButton.setAttribute('aria-label', open ? '关闭导航菜单' : '打开导航菜单');
    if (open) document.querySelector('.sidebar a').focus();
  });
  document.querySelector('.nav-scrim').addEventListener('click', closeNavigation);
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const expanded = document.querySelector('.disclosure[aria-expanded="true"]');
    closeNavigation();
    if (expanded) expanded.focus({ preventScroll: true });
  });
  document.querySelectorAll('.github-link').forEach(button => {
    let url;
    try { url = new URL(config.github); } catch { url = null; }
    if (url && url.protocol === 'https:' && url.hostname === 'github.com') {
      const link = document.createElement('a');
      link.className = button.className;
      link.innerHTML = button.innerHTML;
      link.href = url.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', '访问星月晓梦的 GitHub 主页（在新标签页打开）');
      button.replaceWith(link);
    } else button.addEventListener('click', () => dialog.showModal());
  });
  document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
  document.querySelectorAll('.copy-qq').forEach(button => button.addEventListener('click', async () => {
    const value = config.qq || '1003329649';
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(value);
      notify('QQ 号已复制：' + value);
    } catch {
      const field = document.createElement('textarea');
      field.value = value;
      field.style.cssText = 'position:fixed;left:-9999px;top:0';
      (dialog.open ? dialog : document.body).append(field);
      field.select();
      let copied = false;
      try { copied = document.execCommand('copy'); } catch { /* Show number for manual copying. */ }
      field.remove();
      button.focus();
      notify(copied ? 'QQ 号已复制：' + value : '请手动复制 QQ 号：' + value);
    }
  }));
  // Atmospheric motion is optional and pauses while the page is in the background.
  const ambient = document.querySelector('.ambient');
  if (!reduceMotion.matches) {
    for (let i = 0; i < 18; i++) {
      const mote = document.createElement('span');
      mote.className = 'mote';
      mote.style.setProperty('--left', `${(i * 37) % 100}%`);
      mote.style.setProperty('--duration', `${18 + i % 7 * 3}s`);
      mote.style.setProperty('--delay', `${-i * 2.7}s`);
      ambient.append(mote);
    }
  }
  document.addEventListener('visibilitychange', () => {
    ambient.querySelectorAll('.mote').forEach(mote => { mote.style.animationPlayState = document.hidden ? 'paused' : 'running'; });
  });
  const pointerDevice = window.matchMedia('(hover: hover) and (pointer: fine)');
  document.querySelectorAll('.intro-card, .directory-card, .contact-card, .route-picker .submenu a').forEach(card => card.addEventListener('pointermove', event => {
    if (!pointerDevice.matches || reduceMotion.matches) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--card-x', `${event.clientX - rect.left}px`);
    card.style.setProperty('--card-y', `${event.clientY - rect.top}px`);
  }, { passive: true }));
})();
