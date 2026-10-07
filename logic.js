(function (root, factory) {
  const rules = factory();
  if (typeof module === 'object' && module.exports) module.exports = rules;
  else root.HubLogic = rules;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function mergeLine(line) {
    const packed = line.filter(Boolean), result = []; let score = 0;
    for (let i = 0; i < packed.length; i++) {
      if (packed[i] === packed[i + 1]) { const value = packed[i] * 2; result.push(value); score += value; i++; }
      else result.push(packed[i]);
    }
    while (result.length < line.length) result.push(0);
    return { line: result, score };
  }
  function move2048(board, direction) {
    if (!['up', 'down', 'left', 'right'].includes(direction)) throw Error('Unknown direction');
    const next = board.slice(); let score = 0; const motions = [];
    for (let n = 0; n < 4; n++) {
      const indices = Array.from({ length: 4 }, (_, i) => direction === 'left' ? n * 4 + i : direction === 'right' ? n * 4 + 3 - i : direction === 'up' ? i * 4 + n : (3 - i) * 4 + n);
      const merged = mergeLine(indices.map(i => board[i]));
      const packed = indices.filter(i => board[i]); let target = 0;
      for (let p = 0; p < packed.length; p++) {
        const from = packed[p]; motions.push({ from, to: indices[target], value: board[from] });
        if (board[from] === board[packed[p + 1]]) { p++; motions.push({ from: packed[p], to: indices[target], value: board[packed[p]] }); }
        target++;
      }
      indices.forEach((index, i) => next[index] = merged.line[i]); score += merged.score;
    }
    return { board: next, score, motions, changed: next.some((value, i) => value !== board[i]) };
  }
  function canMove2048(board) {
    return board.includes(0) || ['left', 'up'].some(direction => move2048(board, direction).changed);
  }
  function stepSnake(body, direction, food, size) {
    const head = { x: body[0].x + direction.x, y: body[0].y + direction.y };
    const ate = head.x === food?.x && head.y === food?.y;
    const obstacles = ate ? body : body.slice(0, -1);
    if (head.x < 0 || head.y < 0 || head.x >= size || head.y >= size || obstacles.some(part => part.x === head.x && part.y === head.y)) return { dead: true, body, ate: false };
    return { dead: false, ate, body: [head, ...(ate ? body : body.slice(0, -1))] };
  }
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  function ticOutcome(board) {
    for (const line of wins) if (board[line[0]] && line.every(i => board[i] === board[line[0]])) return { winner: board[line[0]], line };
    return { winner: board.every(Boolean) ? 'draw' : null, line: [] };
  }
  function bestTicMove(board) {
    function minimax(turn, depth) {
      const outcome = ticOutcome(board).winner;
      if (outcome) return outcome === 'O' ? 10 - depth : outcome === 'X' ? depth - 10 : 0;
      let result = turn === 'O' ? -Infinity : Infinity;
      for (const i of [4,0,2,6,8,1,3,5,7]) if (!board[i]) {
        board[i] = turn; const score = minimax(turn === 'O' ? 'X' : 'O', depth + 1); board[i] = '';
        result = turn === 'O' ? Math.max(result, score) : Math.min(result, score);
      }
      return result;
    }
    let move = -1, best = -Infinity;
    for (const i of [4,0,2,6,8,1,3,5,7]) if (!board[i]) {
      board[i] = 'O'; const score = minimax('X', 0); board[i] = '';
      if (score > best) { best = score; move = i; }
    }
    return move;
  }
  function calculate(source) {
    const text = source.replace(/\s/g, '').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
    if (!text || text.length > 300) throw Error('请输入有效算式');
    let cursor = 0;
    function primary() {
      let value;
      if (text[cursor] === '+' || text[cursor] === '-') { const sign = text[cursor++]; return (sign === '-' ? -1 : 1) * primary(); }
      if (text[cursor] === '(') { cursor++; value = expression(); if (text[cursor++] !== ')') throw Error('括号不匹配'); }
      else {
        const number = text.slice(cursor).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
        if (!number) throw Error('算式格式不正确');
        cursor += number[0].length; value = Number(number[0]);
      }
      while (text[cursor] === '%') { cursor++; value /= 100; }
      return value;
    }
    function term() {
      let value = primary();
      while (text[cursor] === '*' || text[cursor] === '/') {
        const operator = text[cursor++], operand = primary();
        if (operator === '/' && operand === 0) throw Error('不能除以零');
        value = operator === '*' ? value * operand : value / operand;
      }
      return value;
    }
    function expression() {
      let value = term();
      while (text[cursor] === '+' || text[cursor] === '-') { const operator = text[cursor++], operand = term(); value += operator === '+' ? operand : -operand; }
      return value;
    }
    const value = expression();
    if (cursor !== text.length || !Number.isFinite(value)) throw Error('请输入有效算式');
    return Number(value.toPrecision(12));
  }
  const units = {
    length: { mm: ['毫米', .001], cm: ['厘米', .01], m: ['米', 1], km: ['千米', 1000], in: ['英寸', .0254], ft: ['英尺', .3048] },
    mass: { g: ['克', .001], kg: ['千克', 1], t: ['吨', 1000], lb: ['磅', .45359237] },
    temperature: { C: ['摄氏度', 1], F: ['华氏度', 1], K: ['开尔文', 1] }
  };
  function convert(value, category, from, to) {
    if (!Number.isFinite(value) || !units[category]?.[from] || !units[category]?.[to]) throw Error('请输入有效数值');
    if (category === 'temperature') {
      const c = from === 'F' ? (value - 32) * 5 / 9 : from === 'K' ? value - 273.15 : value;
      if (c < -273.15000001) throw Error('温度不能低于绝对零度');
      return to === 'F' ? c * 9 / 5 + 32 : to === 'K' ? c + 273.15 : c;
    }
    return value * units[category][from][1] / units[category][to][1];
  }
  return Object.freeze({ mergeLine, move2048, canMove2048, stepSnake, ticOutcome, bestTicMove, calculate, convert, units });
});
