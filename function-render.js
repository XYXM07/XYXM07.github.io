(() => {
  'use strict';
  const TAU = Math.PI * 2;
  const defaults = { xmin: -6, xmax: 6, ymin: -6, ymax: 6 };
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const finite = Number.isFinite;
  const safe = (fn, scope) => {
    try { const n = fn(scope); return typeof n === 'number' && finite(n) ? n : NaN; }
    catch (_) { return NaN; }
  };
  function range(a, b, lo, hi) {
    if (!finite(a) || !finite(b) || b <= a) return [lo, hi];
    const mid = clamp(a / 2 + b / 2, -1e12, 1e12), span = clamp(b - a, Math.max(1e-9, Math.abs(mid) * Number.EPSILON * 8), 1e12);
    return [mid - span / 2, mid + span / 2];
  }
  function normalizeView(v = {}) {
    const x = range(v.xmin, v.xmax, -6, 6), y = range(v.ymin, v.ymax, -6, 6);
    return { xmin: x[0], xmax: x[1], ymin: y[0], ymax: y[1] };
  }
  function tickStep(span, count) {
    const raw = span / Math.max(2, count), power = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / power;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * power;
  }
  function label(n, step = 1) {
    if (Math.abs(n) < Math.abs(step) * 1e-7) return '0';
    if (Math.abs(n) >= 1e6 || Math.abs(n) < .0001) return n.toExponential(1).replace('e+', 'e');
    return Number(n.toFixed(clamp(Math.ceil(-Math.log10(step)) + 1, 0, 8))).toString();
  }
  function rgb(color, fallback) {
    const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color || fallback);
    if (!match) return rgb(fallback, '#78d7bc');
    const hex = match[1].length === 3 ? [...match[1]].map(c => c + c).join('') : match[1];
    return [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
  }
  function heat(value, colors, shade = 1) {
    const t = clamp(value, 0, 1), a = t < .5 ? colors[0] : colors[1], b = t < .5 ? colors[1] : colors[2], f = t < .5 ? t * 2 : (t - .5) * 2;
    return 'rgb(' + a.map((n, i) => Math.round(clamp((n + (b[i] - n) * f) * shade, 0, 255))).join(',') + ')';
  }
  function create(canvas, callbacks = {}) {
    const ctx = canvas && canvas.getContext('2d');
    if (!ctx) throw new Error('当前浏览器无法创建函数绘图画布。');
    const originalTouchAction = canvas.style.touchAction;
    canvas.style.touchAction = 'none';
    if (!canvas.hasAttribute('tabindex')) canvas.tabIndex = 0;
    let config = {}, view = { ...defaults }, pose = { yaw: -.68, pitch: .62, zoom: 1 };
    let width = 720, height = 440, dpr = 1, frame = 0, destroyed = false, hover = null;
    let dragging = false, gesture = null, samples = [], surfacePoints = [], statistics = { mode: '2d', validPoints: 0 };
    const pointers = new Map(), events = [];
    const notify = (name, value) => { try { if (typeof callbacks[name] === 'function') callbacks[name](value); } catch (_) { /* A readout callback must not interrupt a canvas gesture. */ } };
    const plot = () => ({ x: 0, y: 0, w: width, h: height });
    const mode = () => config.mode === '3d' ? '3d' : '2d';
    const visible = () => !document.hidden && !canvas.closest('[hidden]') && canvas.getBoundingClientRect().width > 0;
    const scope = extra => Object.assign({}, config.scope || {}, extra);
    const point = (x, y) => { const p = plot(); return { x: p.x + (x - view.xmin) / (view.xmax - view.xmin) * p.w, y: p.y + (view.ymax - y) / (view.ymax - view.ymin) * p.h }; };
    const world = (x, y) => { const p = plot(); return { x: view.xmin + (x - p.x) / p.w * (view.xmax - view.xmin), y: view.ymax - (y - p.y) / p.h * (view.ymax - view.ymin) }; };
    const inPlot = p => { const r = plot(); return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h; };
    function background() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = config.background || '#102b35'; ctx.fillRect(0, 0, width, height);
      ctx.font = '400 11px system-ui, -apple-system, "Segoe UI", sans-serif';
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 1;
      ctx.setLineDash([]); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    }
    function grid() {
      const p = plot(), xs = tickStep(view.xmax - view.xmin, p.w / 85), ys = tickStep(view.ymax - view.ymin, p.h / 65);
      const axisY = clamp(point(0, 0).y, p.y, p.y + p.h), axisX = clamp(point(0, 0).x, p.x, p.x + p.w);
      ctx.save(); ctx.beginPath(); ctx.rect(p.x, p.y, p.w, p.h); ctx.clip();
      if (config.settings?.grid !== false) {
        ctx.strokeStyle = 'rgba(149,191,194,.12)';
        for (let x = Math.ceil(view.xmin / xs) * xs, i = 0; x <= view.xmax + xs * .001 && i < 160; x += xs, i++) { const a = point(x, 0); ctx.beginPath(); ctx.moveTo(a.x, p.y); ctx.lineTo(a.x, p.y + p.h); ctx.stroke(); }
        for (let y = Math.ceil(view.ymin / ys) * ys, i = 0; y <= view.ymax + ys * .001 && i < 160; y += ys, i++) { const a = point(0, y); ctx.beginPath(); ctx.moveTo(p.x, a.y); ctx.lineTo(p.x + p.w, a.y); ctx.stroke(); }
      }
      if (config.settings?.axes !== false) {
        ctx.strokeStyle = 'rgba(193,221,218,.5)'; ctx.beginPath(); ctx.moveTo(p.x, axisY); ctx.lineTo(p.x + p.w, axisY); ctx.moveTo(axisX, p.y); ctx.lineTo(axisX, p.y + p.h); ctx.stroke();
      }
      ctx.restore();
      const occupied = [], xBelow = axisY < height - 29, yLeft = axisX > 56;
      const putLabel = (text, x, y, align, color) => {
        const textWidth = ctx.measureText(text).width;
        let left = align === 'right' ? x - textWidth : align === 'left' ? x : x - textWidth / 2;
        left = clamp(left, 5, Math.max(5, width - textWidth - 5));
        y = clamp(y, 9, height - 9);
        const box = { left: left - 3, right: left + textWidth + 3, top: y - 8, bottom: y + 8 };
        if (occupied.some(other => box.left < other.right && box.right > other.left && box.top < other.bottom && box.bottom > other.top)) return;
        occupied.push(box); ctx.fillStyle = color; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, left, y);
      };
      if (config.settings?.axes !== false) {
        putLabel('x', width - 10, axisY + (xBelow ? -14 : 14), 'right', '#d3e9e4');
        putLabel('y', axisX + (yLeft ? 13 : -13), 12, yLeft ? 'left' : 'right', '#d3e9e4');
      }
      for (let x = Math.ceil(view.xmin / xs) * xs, i = 0; x <= view.xmax + xs * .001 && i < 100; x += xs, i++) {
        const a = point(x, 0); putLabel(label(x, xs), a.x, axisY + (xBelow ? 15 : -15), 'center', '#a8c2c8');
      }
      const originVisible = view.xmin <= 0 && view.xmax >= 0 && view.ymin <= 0 && view.ymax >= 0;
      for (let y = Math.ceil(view.ymin / ys) * ys, i = 0; y <= view.ymax + ys * .001 && i < 100; y += ys, i++) {
        if (originVisible && Math.abs(y) < ys * 1e-7) continue;
        const a = point(0, y); putLabel(label(y, ys), axisX + (yLeft ? -9 : 9), a.y, yLeft ? 'right' : 'left', '#a8c2c8');
      }
    }
    function clipPlot() { const p = plot(); ctx.beginPath(); ctx.rect(p.x, p.y, p.w, p.h); ctx.clip(); }
    function continuous(a, b, middle) {
      const p = plot();
      if (![a.x, a.y, b.x, b.y, middle.x, middle.y].every(finite)) return false;
      const pa = point(a.x, a.y), pb = point(b.x, b.y), pm = point(middle.x, middle.y);
      if (Math.abs(pa.y - pb.y) > p.h * 1.1 || Math.abs(pa.x - pb.x) > p.w * .75) return false;
      if (Math.abs(pm.y - (pa.y + pb.y) / 2) > p.h * .13 || Math.abs(pm.x - (pa.x + pb.x) / 2) > p.w * .13) return false;
      return true;
    }
    function trace(evaluate, start, end, color, dashed = false, save = true, name = '') {
      if (typeof evaluate !== 'function' || !finite(start) || !finite(end) || end <= start) return;
      const p = plot(), count = clamp(Math.ceil(p.w * (dashed ? 1 : 1.5)), 240, 2600), step = (end - start) / count;
      let previous = null, previousT = start;
      ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = dashed ? 1.35 : 2.1; ctx.setLineDash(dashed ? [5, 4] : []);
      for (let i = 0; i <= count; i++) {
        const t = start + step * i, current = evaluate(t);
        if (finite(current.x) && finite(current.y)) {
          statistics.validPoints++;
          if (save) samples.push({ x: current.x, y: current.y, color, label: name, t });
          if (previous) {
            const mid = evaluate((t + previousT) / 2);
            if (continuous(previous, current, mid)) {
              const a = point(previous.x, previous.y), b = point(current.x, current.y);
              ctx.moveTo(a.x, clamp(a.y, p.y - p.h * 3, p.y + p.h * 4)); ctx.lineTo(b.x, clamp(b.y, p.y - p.h * 3, p.y + p.h * 4));
            }
          }
          previous = current; previousT = t;
        } else previous = null;
      }
      ctx.stroke(); ctx.setLineDash([]);
    }
    function cartesianCurves() { return (config.curves || []).filter(c => c.visible !== false && typeof c.evaluate === 'function'); }
    function derivative(fn, x) { const h = Math.max(1e-6, Math.abs(x) * 1e-5, (view.xmax - view.xmin) * 1e-5); return (safe(fn, scope({ x: x + h })) - safe(fn, scope({ x: x - h }))) / (2 * h); }
    function integralArea(curves) {
      const setting = config.integral || config.settings?.integral;
      if (!setting || typeof setting !== 'object') return;
      const fn = curves[setting.index || 0]?.evaluate, low = Math.max(view.xmin, Number(setting.from ?? setting.min)), high = Math.min(view.xmax, Number(setting.to ?? setting.max));
      if (!fn || !finite(low) || !finite(high) || high <= low) return;
      const count = Math.min(1200, Math.ceil(plot().w * 1.5)), step = (high - low) / count, baseline = point(0, 0).y;
      ctx.fillStyle = setting.color || 'rgba(120,215,188,.18)';
      for (let i = 0; i < count; i++) {
        const x = low + step * i, y = safe(fn, scope({ x: x + step / 2 }));
        if (!finite(y) || Math.abs(y) > (view.ymax - view.ymin) * 100) continue;
        const a = point(x, y), b = point(x + step, 0); ctx.fillRect(a.x, Math.min(a.y, baseline), Math.max(.7, b.x - a.x), Math.abs(a.y - baseline));
      }
    }
    function draw2D() {
      grid(); samples = []; statistics = { mode: '2d', validPoints: 0, curves: 0 };
      ctx.save(); clipPlot();
      const kind = config.kind || 'cartesian';
      if (kind === 'parametric') {
        const q = config.parametric || {}, start = finite(q.min) ? q.min : 0, end = finite(q.max) ? q.max : TAU;
        trace(t => ({ x: safe(q.x, scope({ t })), y: safe(q.y, scope({ t })) }), start, end, q.color || config.curves?.[0]?.color || '#78d7bc', false, true, q.label || '参数曲线'); statistics.curves = 1;
      } else if (kind === 'polar') {
        const q = config.polar || {}, start = finite(q.min) ? q.min : 0, end = finite(q.max) ? q.max : (config.angle === 'deg' ? 360 : TAU), factor = config.angle === 'deg' ? Math.PI / 180 : 1;
        trace(t => { const r = safe(q.r, scope({ t, theta: t })), angle = t * factor; return { x: r * Math.cos(angle), y: r * Math.sin(angle) }; }, start, end, q.color || config.curves?.[0]?.color || '#78d7bc', false, true, q.label || '极坐标曲线'); statistics.curves = 1;
      } else {
        const curves = cartesianCurves(); integralArea(curves); statistics.curves = curves.length;
        curves.forEach((curve, i) => {
          const color = curve.color || ['#78d7bc', '#f0bd83', '#81b9ee', '#ed99ab'][i % 4];
          trace(x => ({ x, y: safe(curve.evaluate, scope({ x })) }), view.xmin, view.xmax, color, false, true, curve.label || 'f' + (i + 1));
          if (config.settings?.derivative) trace(x => ({ x, y: derivative(curve.evaluate, x) }), view.xmin, view.xmax, color, true, false);
        });
      }
      ctx.restore();
      if (hover && !dragging && inPlot(hover)) drawInspect();
    }
    function inspect2D(p) {
      const q = world(p.x, p.y), kind = config.kind || 'cartesian';
      if (kind === 'cartesian') return { x: q.x, y: q.y, values: cartesianCurves().map((curve, i) => ({ label: curve.label || 'f' + (i + 1), value: safe(curve.evaluate, scope({ x: q.x })), color: curve.color || '#78d7bc', derivative: config.settings?.derivative ? derivative(curve.evaluate, q.x) : undefined })) };
      let closest = null, distance = 2500;
      for (const sample of samples) { const s = point(sample.x, sample.y), d = Math.pow(s.x - p.x, 2) + Math.pow(s.y - p.y, 2); if (d < distance) { distance = d; closest = sample; } }
      return closest ? { x: closest.x, y: closest.y, t: closest.t, values: [{ label: closest.label, value: closest.y, color: closest.color }] } : { ...q, values: [] };
    }
    function drawInspect() {
      const p = plot(), detail = inspect2D(hover), pos = point(detail.x, detail.y);
      ctx.save(); clipPlot(); ctx.strokeStyle = 'rgba(194,223,219,.35)'; ctx.setLineDash([3, 5]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pos.x, p.y); ctx.lineTo(pos.x, p.y + p.h); ctx.moveTo(p.x, pos.y); ctx.lineTo(p.x + p.w, pos.y); ctx.stroke(); ctx.setLineDash([]);
      for (const item of detail.values) if (finite(item.value)) { const v = point(detail.x, item.value); ctx.fillStyle = item.color; ctx.beginPath(); ctx.arc(v.x, v.y, 3.8, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
    function surfaceRange() {
      const s = config.surface || {}, xr = range(s.xmin, s.xmax, -5, 5), yr = range(s.ymin, s.ymax, -5, 5), zr = range(s.zmin, s.zmax, -3, 3);
      return { x: xr, y: yr, z: zr, cx: (xr[0] + xr[1]) / 2, cy: (yr[0] + yr[1]) / 2, cz: (zr[0] + zr[1]) / 2, sx: xr[1] - xr[0], sy: yr[1] - yr[0], sz: zr[1] - zr[0] };
    }
    function project(x, y, z, bounds) {
      const nx = (x - bounds.cx) / bounds.sx * 2, ny = (y - bounds.cy) / bounds.sy * 2, nz = (z - bounds.cz) / bounds.sz * 1.65;
      const cos = Math.cos(pose.yaw), sin = Math.sin(pose.yaw), u = nx * cos - ny * sin, depth = nx * sin + ny * cos;
      const vertical = nz * Math.cos(pose.pitch) - depth * Math.sin(pose.pitch), cameraDepth = depth * Math.cos(pose.pitch) + nz * Math.sin(pose.pitch);
      const size = Math.min(width * .29, height * .34) * pose.zoom, perspective = 4.8 / (4.8 - clamp(cameraDepth, -3.6, 3.6));
      return { x: width * .5 + u * size * perspective, y: height * .5 + 8 - vertical * size * perspective, depth: cameraDepth };
    }
    function line3D(a, b, bounds, color, dash = false) {
      const p = project(...a, bounds), q = project(...b, bounds); ctx.strokeStyle = color; ctx.setLineDash(dash ? [3, 4] : []); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); ctx.setLineDash([]);
    }
    function draw3D() {
      const s = config.surface || {}, bounds = surfaceRange(), resolution = clamp(Math.round(s.resolution || 48), 8, 80), mesh = [], faces = [];
      surfacePoints = []; samples = []; statistics = { mode: '3d', validPoints: 0, faces: 0 };
      if (config.settings?.grid !== false) {
        ctx.lineWidth = .8;
        for (let i = 0; i <= 10; i++) { const x = bounds.x[0] + bounds.sx * i / 10, y = bounds.y[0] + bounds.sy * i / 10; line3D([x, bounds.y[0], bounds.z[0]], [x, bounds.y[1], bounds.z[0]], bounds, 'rgba(142,188,193,.16)'); line3D([bounds.x[0], y, bounds.z[0]], [bounds.x[1], y, bounds.z[0]], bounds, 'rgba(142,188,193,.16)'); }
        const corners = [[bounds.x[0], bounds.y[0]], [bounds.x[1], bounds.y[0]], [bounds.x[1], bounds.y[1]], [bounds.x[0], bounds.y[1]]];
        for (let i = 0; i < corners.length; i++) { const c = corners[i], next = corners[(i + 1) % 4]; line3D([...c, bounds.z[0]], [...c, bounds.z[1]], bounds, 'rgba(142,188,193,.16)', true); line3D([...c, bounds.z[1]], [...next, bounds.z[1]], bounds, 'rgba(142,188,193,.16)', true); }
      }
      for (let j = 0; j <= resolution; j++) {
        const row = [], y = bounds.y[0] + bounds.sy * j / resolution;
        for (let i = 0; i <= resolution; i++) {
          const x = bounds.x[0] + bounds.sx * i / resolution, z = safe(s.evaluate, scope({ x, y }));
          if (!finite(z) || z < bounds.z[0] || z > bounds.z[1]) { row.push(null); continue; }
          const p = { ...project(x, y, z, bounds), wx: x, wy: y, wz: z };
          row.push(p); surfacePoints.push(p); statistics.validPoints++;
        }
        mesh.push(row);
      }
      for (let j = 0; j < resolution; j++) for (let i = 0; i < resolution; i++) {
        const vertices = [mesh[j][i], mesh[j][i + 1], mesh[j + 1][i + 1], mesh[j + 1][i]];
        if (vertices.some(p => !p)) continue;
        const zs = vertices.map(p => p.wz), delta = Math.max(...zs) - Math.min(...zs);
        if (delta > bounds.sz * .45) continue;
        const midZ = safe(s.evaluate, scope({ x: (vertices[0].wx + vertices[2].wx) / 2, y: (vertices[0].wy + vertices[2].wy) / 2 }));
        if (!finite(midZ) || Math.abs(midZ - zs.reduce((a, b) => a + b, 0) / 4) > bounds.sz * .17) continue;
        const z = zs.reduce((a, b) => a + b, 0) / 4;
        faces.push({ vertices, depth: vertices.reduce((a, p) => a + p.depth, 0) / 4, t: (z - bounds.z[0]) / bounds.sz, shade: clamp(.93 + (zs[1] - zs[0] - zs[3] + zs[0]) / bounds.sz * 1.6, .68, 1.08) });
      }
      faces.sort((a, b) => a.depth - b.depth);
      const colors = [rgb(s.colorA || s.colors?.[0], '#3b9e99'), rgb(s.colorB || s.colors?.[1], '#d6e4c1'), rgb(s.colorC || s.colors?.[2], '#edae77')];
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, width, height); ctx.clip();
      for (const face of faces) {
        const points = face.vertices; ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y); for (let i = 1; i < 4; i++) ctx.lineTo(points[i].x, points[i].y); ctx.closePath();
        if (!s.wireOnly) { ctx.fillStyle = heat(face.t, colors, face.shade); ctx.fill(); }
        ctx.lineWidth = s.wire || s.wireOnly ? .75 : .45;
        ctx.strokeStyle = s.wire || s.wireOnly ? 'rgba(17,47,53,.48)' : heat(face.t, colors, face.shade); ctx.stroke();
      }
      ctx.restore(); statistics.faces = faces.length;
      if (config.settings?.axes !== false) {
        const origin = [clamp(0, ...bounds.x), clamp(0, ...bounds.y), clamp(0, ...bounds.z)], axes = [
          { key: 'X', color: '#edb184', a: [bounds.x[0], origin[1], origin[2]], b: [bounds.x[1], origin[1], origin[2]], domain: bounds.x },
          { key: 'Y', color: '#78d7bc', a: [origin[0], bounds.y[0], origin[2]], b: [origin[0], bounds.y[1], origin[2]], domain: bounds.y },
          { key: 'Z', color: '#8abdec', a: [origin[0], origin[1], bounds.z[0]], b: [origin[0], origin[1], bounds.z[1]], domain: bounds.z }
        ];
        ctx.lineWidth = 1.2; ctx.font = '400 11px system-ui, -apple-system, "Segoe UI", sans-serif'; ctx.textBaseline = 'middle';
        for (const axis of axes) {
          line3D(axis.a, axis.b, bounds, axis.color); const end = project(...axis.b, bounds), start = project(...axis.a, bounds);
          ctx.fillStyle = axis.color; ctx.textAlign = 'center'; ctx.fillText(axis.key + ' ' + label(axis.domain[1]), end.x + 10, end.y - 12); ctx.fillText(label(axis.domain[0]), start.x - 7, start.y + 14);
        }
        if (bounds.x[0] <= 0 && bounds.x[1] >= 0 && bounds.y[0] <= 0 && bounds.y[1] >= 0 && bounds.z[0] <= 0 && bounds.z[1] >= 0) { const zero = project(0, 0, 0, bounds); ctx.fillStyle = '#e1eee6'; ctx.beginPath(); ctx.arc(zero.x, zero.y, 2.7, 0, TAU); ctx.fill(); ctx.fillText('O', zero.x + 10, zero.y + 10); }
      }
      ctx.fillStyle = '#91b3bc'; ctx.textAlign = 'left'; ctx.font = '400 11px system-ui, -apple-system, "Segoe UI", sans-serif'; ctx.fillText('Z', 15, height - 22);
      const gradient = ctx.createLinearGradient(31, 0, Math.min(width - 100, 180), 0); gradient.addColorStop(0, heat(0, colors)); gradient.addColorStop(.5, heat(.5, colors)); gradient.addColorStop(1, heat(1, colors)); ctx.fillStyle = gradient; ctx.fillRect(31, height - 27, Math.max(60, Math.min(width - 150, 150)), 6); ctx.fillStyle = '#91b3bc'; ctx.fillText(label(bounds.z[0]) + ' → ' + label(bounds.z[1]), Math.max(101, Math.min(width - 110, 193)), height - 23);
    }
    function draw() {
      frame = 0; if (destroyed || !visible()) return;
      background(); mode() === '3d' ? draw3D() : draw2D();
    }
    function schedule() { if (!destroyed && !frame && visible()) frame = requestAnimationFrame(draw); }
    function resize() {
      if (destroyed) return;
      const rect = canvas.getBoundingClientRect(), w = Math.round(rect.width || canvas.clientWidth || 720), h = Math.round(rect.height || canvas.clientHeight || 440);
      width = Math.max(150, w); height = Math.max(150, h); dpr = clamp(window.devicePixelRatio || 1, 1, 3);
      if (canvas.width !== Math.round(width * dpr)) canvas.width = Math.round(width * dpr);
      if (canvas.height !== Math.round(height * dpr)) canvas.height = Math.round(height * dpr);
      schedule();
    }
    function render(next = {}) {
      config = next; view = normalizeView(next.view || view);
      const explicit = next.surface?.view || next.pose;
      if (explicit) { if (finite(explicit.yaw)) pose.yaw = explicit.yaw; if (finite(explicit.pitch)) pose.pitch = clamp(explicit.pitch, -.2, 1.42); if (finite(explicit.zoom)) pose.zoom = clamp(explicit.zoom, .35, 3.5); }
      hover = null; resize();
      // Synchronous draws make exports and validity readouts reflect the latest expression.
      if (frame) { cancelAnimationFrame(frame); frame = 0; }
      draw(); return { ...statistics };
    }
    function changeView() { if (mode() !== '3d') view = normalizeView(view); notify('onViewChange', mode() === '3d' ? { ...pose, mode: '3d' } : { ...view }); schedule(); }
    function local(event) { const rect = canvas.getBoundingClientRect(); return { x: (event.clientX - rect.left) * width / (rect.width || width), y: (event.clientY - rect.top) * height / (rect.height || height) }; }
    function snapshot() {
      const list = [...pointers.values()];
      if (!list.length) return null;
      const center = list.length === 1 ? { ...list[0] } : { x: (list[0].x + list[1].x) / 2, y: (list[0].y + list[1].y) / 2 };
      return { center, distance: list.length > 1 ? Math.hypot(list[0].x - list[1].x, list[0].y - list[1].y) : 0, count: list.length, view: { ...view }, pose: { ...pose }, anchor: world(center.x, center.y) };
    }
    function pointerDown(event) {
      if (event.button != null && event.button !== 0) return;
      if (event.cancelable) event.preventDefault(); canvas.focus({ preventScroll: true }); pointers.set(event.pointerId, local(event));
      try { canvas.setPointerCapture(event.pointerId); } catch (_) { /* Capture may be unavailable in an embedded preview. */ }
      dragging = true; hover = null; gesture = snapshot(); canvas.style.cursor = 'grabbing'; notify('onInspect', null);
    }
    function pointerMove(event) {
      const p = local(event);
      if (!pointers.has(event.pointerId)) {
        hover = p;
        if (mode() === '3d') {
          let closest = null, distance = 28 * 28;
          for (const vertex of surfacePoints) { const d = Math.pow(vertex.x - p.x, 2) + Math.pow(vertex.y - p.y, 2); if (d < distance) { closest = vertex; distance = d; } }
          notify('onInspect', closest ? { x: closest.wx, y: closest.wy, z: closest.wz, values: [{ label: 'z', value: closest.wz, color: '#78d7bc' }] } : null);
        } else notify('onInspect', inPlot(p) ? inspect2D(p) : null);
        schedule(); return;
      }
      if (event.cancelable) event.preventDefault(); pointers.set(event.pointerId, p);
      const current = snapshot(); if (!gesture || current.count !== gesture.count) { gesture = current; return; }
      if (mode() === '3d') {
        if (current.count > 1) pose.zoom = clamp(gesture.pose.zoom * current.distance / Math.max(8, gesture.distance), .35, 3.5);
        else { pose.yaw = gesture.pose.yaw - (current.center.x - gesture.center.x) * .009; pose.pitch = clamp(gesture.pose.pitch + (current.center.y - gesture.center.y) * .007, -.2, 1.42); }
      } else {
        const r = plot(), factor = current.count > 1 ? clamp(gesture.distance / Math.max(8, current.distance), .05, 20) : 1, sx = clamp((gesture.view.xmax - gesture.view.xmin) * factor, 1e-9, 1e12), sy = clamp((gesture.view.ymax - gesture.view.ymin) * factor, 1e-9, 1e12);
        const left = gesture.anchor.x - (current.center.x - r.x) / r.w * sx, top = gesture.anchor.y + (current.center.y - r.y) / r.h * sy;
        view = { xmin: left, xmax: left + sx, ymin: top - sy, ymax: top };
      }
      changeView();
    }
    function pointerUp(event) {
      if (!pointers.has(event.pointerId)) return;
      pointers.delete(event.pointerId); gesture = snapshot(); dragging = pointers.size > 0; canvas.style.cursor = dragging ? 'grabbing' : 'crosshair';
      try { if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId); } catch (_) { /* Detached canvases can lose capture before this event. */ }
      schedule();
    }
    function zoom(factor, anchor) {
      if (mode() === '3d') pose.zoom = clamp(pose.zoom / factor, .35, 3.5);
      else { const q = world(anchor.x, anchor.y), sx = clamp((view.xmax - view.xmin) * factor, 1e-9, 1e12), sy = clamp((view.ymax - view.ymin) * factor, 1e-9, 1e12), p = plot(), fx = (anchor.x - p.x) / p.w, fy = (anchor.y - p.y) / p.h; view = { xmin: q.x - sx * fx, xmax: q.x + sx * (1 - fx), ymin: q.y - sy * (1 - fy), ymax: q.y + sy * fy }; }
      hover = null; changeView();
    }
    function wheel(event) { if (event.cancelable) event.preventDefault(); const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1; zoom(Math.exp(clamp(event.deltaY * unit, -160, 160) * .0018), local(event)); }
    function reset() { view = normalizeView(config.resetView || defaults); pose = { yaw: -.68, pitch: .62, zoom: 1 }; hover = null; changeView(); }
    function keydown(event) {
      const key = event.key, r = plot();
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', '_', '0', 'Home'].includes(key)) return;
      event.preventDefault(); event.stopPropagation();
      if (key === '0' || key === 'Home') return reset();
      if (key === '+' || key === '=' || key === '-' || key === '_') return zoom(key === '+' || key === '=' ? .8 : 1.25, { x: r.x + r.w / 2, y: r.y + r.h / 2 });
      if (mode() === '3d') { if (key === 'ArrowLeft') pose.yaw += .12; if (key === 'ArrowRight') pose.yaw -= .12; if (key === 'ArrowUp') pose.pitch = clamp(pose.pitch - .1, -.2, 1.42); if (key === 'ArrowDown') pose.pitch = clamp(pose.pitch + .1, -.2, 1.42); }
      else { const dx = (view.xmax - view.xmin) * .08 * (key === 'ArrowLeft' ? -1 : key === 'ArrowRight' ? 1 : 0), dy = (view.ymax - view.ymin) * .08 * (key === 'ArrowUp' ? 1 : key === 'ArrowDown' ? -1 : 0); view = { xmin: view.xmin + dx, xmax: view.xmax + dx, ymin: view.ymin + dy, ymax: view.ymax + dy }; }
      hover = null; changeView();
    }
    function leave() { if (!dragging) { hover = null; notify('onInspect', null); schedule(); } }
    function lifecycle() { hover = null; pointers.clear(); gesture = null; dragging = false; if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0; } else resize(); }
    function listen(target, name, fn, options) { target.addEventListener(name, fn, options); events.push(() => target.removeEventListener(name, fn, options)); }
    listen(canvas, 'pointerdown', pointerDown); listen(canvas, 'pointermove', pointerMove); listen(canvas, 'pointerup', pointerUp); listen(canvas, 'pointercancel', pointerUp); listen(canvas, 'lostpointercapture', pointerUp); listen(canvas, 'pointerleave', leave); listen(canvas, 'wheel', wheel, { passive: false }); listen(canvas, 'keydown', keydown); listen(canvas, 'dblclick', reset);
    listen(window, 'resize', resize); listen(window, 'hashchange', lifecycle); listen(document, 'site:pagechange', lifecycle); listen(document, 'visibilitychange', lifecycle);
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null; observer?.observe(canvas);
    canvas.style.cursor = 'crosshair';
    return {
      render, resize, reset,
      exportPNG() { if (destroyed) throw new Error('绘图画布已关闭。'); if (frame) { cancelAnimationFrame(frame); frame = 0; } background(); mode() === '3d' ? draw3D() : draw2D(); try { return canvas.toDataURL('image/png'); } catch (_) { throw new Error('无法导出图像，请重新绘制后再试。'); } },
      destroy() { destroyed = true; if (frame) cancelAnimationFrame(frame); events.forEach(remove => remove()); observer?.disconnect(); pointers.clear(); canvas.style.touchAction = originalTouchAction; notify('onInspect', null); }
    };
  }
  window.FunctionPlot = Object.freeze({ create });
})();
