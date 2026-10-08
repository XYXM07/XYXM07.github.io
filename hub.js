(() => {
  'use strict';
  const L = window.HubLogic;
  const $ = selector => document.querySelector(selector);
  const all = selector => [...document.querySelectorAll(selector)];
  let game = 'snake', tool = 'calculator';
  function selectTab(kind, name) {
    const keys = all(`[data-${kind}]`).map(button => button.dataset[kind]);
    if (name === 'converter') name = 'calculator';
    const directory = !keys.includes(name), route = kind === 'game' ? 'games' : 'tools';
    document.querySelector(`#${route}-directory`).hidden = !directory;
    document.querySelector(`#${route}-workspace`).hidden = directory;
    if (directory) name = null;
    if (kind === 'game') { if (name !== game) pauseSnake(); game = name; } else tool = name;
    document.dispatchEvent(new CustomEvent('hub:selection', {detail:{kind,name}}));
    all(`[data-${kind}]`).forEach(button => {
      const selected = button.dataset[kind] === name;
      button.classList.toggle('active', selected); button.tabIndex = 0;
      if (selected) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
    });
    all(`.${kind}-panel`).forEach(panel => panel.hidden = panel.id !== `${kind}-${name}`);
    const title = document.querySelector(`#${route}-title`);
    title.textContent = directory ? (kind === 'game' ? '游戏大厅' : '全部工具') : all(`[data-${kind}]`).find(link => link.dataset[kind] === name).textContent;
    document.querySelector(`#${route}-picker-label`).textContent = directory ? (kind === 'game' ? '选择游戏' : '选择工具') : title.textContent;
  }
  function routeChanged({ page, section }) {
    if (page !== 'games') pauseSnake();
    if (page === 'games') selectTab('game', section);
    if (page === 'tools') selectTab('tool', section);
  }
  document.addEventListener('site:pagechange', event => routeChanged(event.detail));

  // Snake: only one turn is queued per tick, preventing instant reverse turns.
  const canvas = $('#snake-canvas'), ctx = canvas.getContext('2d');
  const size = 18, cell = canvas.width / size;
  let snake, food, direction, pendingDirection, snakeState = 'ready', snakeScore = 0, snakeClock;
  let snakeBest = 0;
  function nextFood() {
    const empty = [];
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!snake.some(p => p.x === x && p.y === y)) empty.push({ x, y });
    return empty.length ? empty[Math.floor(Math.random() * empty.length)] : null;
  }
  function drawSnake() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#153b49'; ctx.fillRect(0, 0, 480, 480);
    ctx.strokeStyle = '#bfe5df0c'; ctx.lineWidth = 1;
    for (let i = 1; i < size; i++) { ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, 480); ctx.moveTo(0, i * cell); ctx.lineTo(480, i * cell); ctx.stroke(); }
    if (food) { ctx.fillStyle = '#e9c6a1'; ctx.beginPath(); ctx.arc((food.x + .5) * cell, (food.y + .5) * cell, cell * .3, 0, Math.PI * 2); ctx.fill(); }
    snake.forEach((part, index) => { ctx.fillStyle = index === 0 ? '#edf4d8' : '#a0cebe'; ctx.fillRect(part.x * cell + 2, part.y * cell + 2, cell - 4, cell - 4); });
  }
  function updateSnake() {
    window.GameExchange?.observe('snake', snakeScore);
    $('#snake-score').textContent = snakeScore; $('#snake-best').textContent = snakeBest;
    const overlay = $('#snake-overlay'); overlay.hidden = snakeState === 'running';
    overlay.textContent = { ready: '准备好，出发。', paused: '休息一下，再继续。', dead: '这一局结束了。', won: '你填满了整个棋盘。' }[snakeState] || '';
    $('#snake-start').textContent = { ready: '开始游戏', running: '暂停', paused: '继续游戏', dead: '再来一局', won: '再来一局' }[snakeState];
    drawSnake();
  }
  function resetSnake() {
    clearInterval(snakeClock); snakeState = 'ready'; snakeScore = 0;
    snake = [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }]; direction = { x: 1, y: 0 }; pendingDirection = null; food = nextFood();
    $('#snake-status').textContent = '点击开始游戏，用方向键或 WASD 移动。'; updateSnake();
  }
  function tickSnake() {
    if (pendingDirection) direction = pendingDirection; pendingDirection = null;
    const next = L.stepSnake(snake, direction, food, size);
    if (next.dead) { clearInterval(snakeClock); snakeState = 'dead'; $('#snake-status').textContent = `游戏结束，本局 ${snakeScore} 分。`; updateSnake(); return; }
    snake = next.body;
    if (next.ate) {
      snakeScore += 10; if (snakeScore > snakeBest) { snakeBest = snakeScore; }
      food = nextFood(); $('#snake-status').textContent = `吃到食物，当前 ${snakeScore} 分。`;
      if (!food) { clearInterval(snakeClock); snakeState = 'won'; $('#snake-status').textContent = '挑战完成，你填满了整个棋盘！'; }
    }
    updateSnake();
  }
  function pauseSnake() {
    if (snakeState !== 'running') return;
    clearInterval(snakeClock); snakeState = 'paused'; $('#snake-status').textContent = '已暂停，点击继续游戏。'; updateSnake();
  }
  function startSnake() {
    if (snakeState === 'running') { pauseSnake(); return; }
    if (snakeState === 'dead' || snakeState === 'won') resetSnake();
    snakeState = 'running'; $('#snake-status').textContent = '游戏中；空格或暂停按钮可暂停。';
    clearInterval(snakeClock); snakeClock = setInterval(tickSnake, 145); updateSnake(); $('.snake-board').focus({ preventScroll: true });
  }
  const directions = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
  function steer(name) {
    const candidate = directions[name];
    if (snakeState !== 'running' || pendingDirection || !candidate || candidate.x === -direction.x && candidate.y === -direction.y) return;
    pendingDirection = candidate;
  }
  $('#snake-start').addEventListener('click', startSnake);
  $('#snake-reset').addEventListener('click', () => { resetSnake(); startSnake(); });
  resetSnake();

  // 2048: new tiles spawn only after a move changes the board.
  let tiles, tilesScore = 0, tilesBest = 0, reached2048 = false;
  function spawnTile() { const empty = tiles.map((v, i) => v === 0 ? i : -1).filter(i => i !== -1); if (empty.length) tiles[empty[Math.floor(Math.random() * empty.length)]] = Math.random() < .9 ? 2 : 4; }
  let tilesAnimating = false, tilesAnimationClock, tilesGeneration = 0;
  function tileElement(value, index) {
    const tile = document.createElement('div'); tile.className = 'tile moving-tile'; tile.dataset.value = value;
    tile.textContent = value; tile.setAttribute('aria-label', String(value));
    tile.style.setProperty('--col', index % 4); tile.style.setProperty('--row', Math.floor(index / 4)); return tile;
  }
  function renderTiles(pop = false) {
    window.GameExchange?.observe('2048', tilesScore);
    const board = $('#tiles-board'); board.replaceChildren();
    for (let i = 0; i < 16; i++) { const slot = document.createElement('div'); slot.className = 'tile-slot'; board.append(slot); }
    tiles.forEach((value, index) => { if (value) { const tile = tileElement(value, index); if (pop) tile.classList.add('tile-pop'); board.append(tile); } });
    $('#tiles-score').textContent = tilesScore; $('#tiles-best').textContent = tilesBest;
  }
  function resetTiles() { clearTimeout(tilesAnimationClock); tilesGeneration++; tilesAnimating = false; tiles = Array(16).fill(0); tilesScore = 0; reached2048 = false; spawnTile(); spawnTile(); renderTiles(); $('#tiles-status').textContent = '合并相同的数字，一起抵达 2048。'; }
  function moveTiles(name) {
    if (tilesAnimating) return;
    const result = L.move2048(tiles, name);
    if (!result.changed) { if (!L.canMove2048(tiles)) $('#tiles-status').textContent = `没有可移动的位置，本局 ${tilesScore} 分。可以开始新的一局。`; return; }
    tiles = result.board; tilesScore += result.score; window.GameExchange?.observe('2048', tilesScore); spawnTile();
    if (tilesScore > tilesBest) { tilesBest = tilesScore; }
    if (tiles.some(v => v >= 2048) && !reached2048) { reached2048 = true; $('#tiles-status').textContent = '达成 2048！还可以继续挑战更大的数字。'; }
    else $('#tiles-status').textContent = result.score ? `合并成功，增加 ${result.score} 分。` : '继续寻找可以合并的数字。';
    if (!L.canMove2048(tiles)) $('#tiles-status').textContent = `没有可移动的位置，本局 ${tilesScore} 分。可以开始新的一局。`;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { renderTiles(); return; }
    tilesAnimating = true; const generation = tilesGeneration, board = $('#tiles-board');
    board.querySelectorAll('.moving-tile').forEach(tile => tile.remove());
    const step = (board.clientWidth - 22 - 27) / 4 + 9;
    result.motions.forEach(({from,to,value}) => {
      const tile = tileElement(value, from); board.append(tile);
      const dx = (to % 4 - from % 4) * step, dy = (Math.floor(to / 4) - Math.floor(from / 4)) * step;
      tile.animate([{transform:'translate(0,0)'},{transform:`translate(${dx}px,${dy}px)`}],{duration:160,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards'});
    });
    tilesAnimationClock = setTimeout(() => { if (generation !== tilesGeneration) return; tilesAnimating = false; renderTiles(true); }, 165);
  }
  $('#tiles-reset').addEventListener('click', () => { resetTiles(); $('#tiles-board').focus({ preventScroll: true }); }); resetTiles();
  all('[data-direction]').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.control === 'snake') steer(button.dataset.direction); else moveTiles(button.dataset.direction);
  }));
  function swipeBoard(board, action) {
    let start;
    board.addEventListener('pointerdown', event => { if (event.pointerType === 'mouse') return; start = { x: event.clientX, y: event.clientY, id: event.pointerId }; board.setPointerCapture(event.pointerId); });
    board.addEventListener('pointerup', event => {
      if (!start || event.pointerId !== start.id) return;
      const x = event.clientX - start.x, y = event.clientY - start.y; start = null;
      if (Math.max(Math.abs(x), Math.abs(y)) < 18) return;
      action(Math.abs(x) > Math.abs(y) ? x > 0 ? 'right' : 'left' : y > 0 ? 'down' : 'up');
    });
    board.addEventListener('pointercancel', () => { start = null; });
  }
  swipeBoard($('.snake-board'), steer); swipeBoard($('#tiles-board'), moveTiles);
  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || $('#page-games').hidden || !event.target.closest('.game-panel') || event.target.closest('input,select,textarea,[role="combobox"]')) return;
    const name = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' }[event.key.length === 1 ? event.key.toLowerCase() : event.key];
    if (name && ['snake', '2048'].includes(game)) { event.preventDefault(); if (game === 'snake') steer(name); else moveTiles(name); }
    if (event.code === 'Space' && game === 'snake' && !event.target.closest('button')) { event.preventDefault(); startSnake(); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseSnake(); });

  // Tic-tac-toe supports an optimal computer opponent and local two-player play.
  let tic, ticTurn = 'X', ticThinking = false, ticClock;
  function renderTic() {
    const outcome = L.ticOutcome(tic);
    all('.tic-cell').forEach((button, i) => {
      button.textContent = tic[i]; button.dataset.mark = tic[i];
      button.disabled = !!tic[i] || !!outcome.winner || ticThinking;
      button.classList.toggle('winner', outcome.line.includes(i)); button.setAttribute('aria-label', `第 ${i + 1} 格，${tic[i] || '空'}`);
    });
    $('#tic-status').textContent = outcome.winner ? outcome.winner === 'draw' ? '平局，也是一次默契的相遇。' : `${outcome.winner} 连成三点，获胜！` : ticThinking ? '电脑正在思考……' : $('#tic-mode').value === 'computer' ? '你执 X，点击一个空格落子。' : `轮到 ${ticTurn}，请选择一个空格。`;
  }
  function resetTic() { clearTimeout(ticClock); tic = Array(9).fill(''); ticTurn = 'X'; ticThinking = false; renderTic(); }
  all('.tic-cell').forEach(button => button.addEventListener('click', () => {
    const index = Number(button.dataset.cell); if (tic[index] || ticThinking || L.ticOutcome(tic).winner) return;
    tic[index] = ticTurn; ticTurn = ticTurn === 'X' ? 'O' : 'X';
    if ($('#tic-mode').value === 'computer' && !L.ticOutcome(tic).winner) {
      ticThinking = true; renderTic();
      ticClock = setTimeout(() => { const index = L.bestTicMove(tic); if (index >= 0) tic[index] = 'O'; ticTurn = 'X'; ticThinking = false; renderTic(); }, 230);
    } else renderTic();
  }));
  $('#tic-reset').addEventListener('click', resetTic); $('#tic-mode').addEventListener('change', resetTic); resetTic();

  const expression = $('#calc-expression'), calcResult = $('#calc-result');
  function runCalculation() { try { calcResult.textContent = '= ' + L.calculate(expression.value); calcResult.classList.remove('error'); } catch (error) { calcResult.textContent = error.message; calcResult.classList.add('error'); } }
  all('[data-key]').forEach(button => button.addEventListener('click', () => {
    const key = button.dataset.key;
    if (key === '=') runCalculation();
    else if (key === 'AC') { expression.value = ''; calcResult.textContent = '= 0'; calcResult.classList.remove('error'); }
    else if (key === 'DEL') expression.value = expression.value.slice(0, -1);
    else if (expression.value.length < 300) expression.value += key;
  }));
  expression.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); runCalculation(); } });
  function conversion() {
    const output = $('#convert-result');
    try { if (!$('#convert-input').value.trim()) throw Error('请输入数值'); const value = L.convert(Number($('#convert-input').value), $('#convert-type').value, $('#convert-from').value, $('#convert-to').value); output.textContent = `${Number(value.toPrecision(12))} ${L.units[$('#convert-type').value][$('#convert-to').value][0]}`; output.classList.remove('error'); }
    catch (error) { output.textContent = error.message; output.classList.add('error'); }
  }
  function setUnits() {
    const units = L.units[$('#convert-type').value];
    ['#convert-from', '#convert-to'].forEach(selector => { const select = $(selector); select.replaceChildren(); Object.entries(units).forEach(([key, [label]]) => { const option = document.createElement('option'); option.value = key; option.textContent = label; select.append(option); }); });
    const category = $('#convert-type').value;
    $('#convert-from').value = category === 'length' ? 'm' : category === 'mass' ? 'kg' : 'C';
    $('#convert-to').value = category === 'length' ? 'cm' : category === 'mass' ? 'g' : 'F'; conversion();
  }
  $('#convert-type').addEventListener('change', setUnits);
  ['#convert-input', '#convert-from', '#convert-to'].forEach(selector => $(selector).addEventListener('input', conversion));
  $('#convert-swap').addEventListener('click', () => { const previous = $('#convert-from').value; $('#convert-from').value = $('#convert-to').value; $('#convert-to').value = previous; conversion(); }); setUnits();
  const [page, section] = location.hash.slice(1).split('/'); routeChanged({ page, section });
})();
