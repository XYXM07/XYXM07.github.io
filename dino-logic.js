/* Independent implementation of the classic dinosaur runner mechanics. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DinoLogic = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  function create(width = 900, height = 260) {
    return { width, height, phase: 'ready', elapsed: 0, distance: 0, score: 0,
      speed: 330, y: 0, velocity: 0, duck: false, obstacles: [], spawnIn: 1.5 };
  }
  function jump(state) {
    if (state.phase !== 'running' || (state.y > 0 || state.velocity !== 0)) return false;
    state.duck = false;
    state.velocity = 620;
    state.y = .01;
    return true;
  }
  function releaseJump(state) { if (state.y >= 40 && state.velocity > 280) state.velocity = 280; }
  function playerBoxes(state) {
    const ground = state.height - 40, x = 64;
    if (state.duck && state.y <= .01) {
      return [{ x: x + 4, y: ground - 19, width: 46, height: 17 },
        { x: x + 40, y: ground - 28, width: 20, height: 15 }];
    }
    const y = ground - 48 - state.y;
    return [{ x: x + 24, y: y + 2, width: 20, height: 16 },
      { x: x + 12, y: y + 16, width: 24, height: 23 },
      { x: x + 14, y: y + 39, width: 20, height: 8 }];
  }
  function hits(state, obstacle) {
    const target = { x: obstacle.x + 3,
      y: state.height - 40 - obstacle.lift - obstacle.height + 3,
      width: obstacle.width - 6, height: obstacle.height - 6 };
    return playerBoxes(state).some(box => box.x < target.x + target.width &&
      box.x + box.width > target.x && box.y < target.y + target.height && box.y + box.height > target.y);
  }
  function spawn(state, random) {
    if (state.elapsed > 12 && random() < .28) {
      const lifts = [0, 40, 78];
      state.obstacles.push({ kind: 'bird', x: state.width + 30, width: 48,
        height: 28, lift: lifts[Math.floor(random() * lifts.length)] });
    } else {
      const count = state.elapsed > 8 ? 1 + Math.floor(random() * 3) : 1;
      const height = random() < .5 ? 44 : 60;
      state.obstacles.push({ kind: 'cactus', x: state.width + 30, width: 22 * count,
        height, count, lift: 0 });
    }
    state.spawnIn += 1.05 + random() * .65;
  }
  function advance(state, delta, random = Math.random) {
    if (state.phase !== 'running' || !Number.isFinite(delta) || delta <= 0) return;
    let remaining = Math.min(delta, .1);
    // Collision substeps are independent of rendering frequency.
    while (remaining > 1e-8 && state.phase === 'running') {
      const dt = Math.min(remaining, 1 / 120);
      remaining -= dt;
      state.elapsed += dt;
      const previousSpeed = state.speed;
      state.speed = Math.min(730, 330 + state.elapsed * 5.5);
      const movement = (previousSpeed + state.speed) / 2 * dt;
      state.distance += movement;
      state.score = Math.floor(state.distance / 10);
      if (state.y > 0 || state.velocity > 0) {
        const gravity = state.duck ? 3000 : 1750;
        state.y += state.velocity * dt - gravity * dt * dt / 2;
        state.velocity -= gravity * dt;
        if (state.y <= 0) { state.y = 0; state.velocity = 0; }
      }
      for (const obstacle of state.obstacles) obstacle.x -= movement;
      state.obstacles = state.obstacles.filter(obstacle => obstacle.x + obstacle.width > -20);
      state.spawnIn -= dt;
      if (state.spawnIn <= 0) spawn(state, random);
      if (state.obstacles.some(obstacle => hits(state, obstacle))) state.phase = 'over';
    }
  }
  return { create, jump, releaseJump, playerBoxes, hits, advance };
});
