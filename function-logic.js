(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FunctionLogic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const LIMITS = Object.freeze({ expressionLength: 1200, tokens: 512, nodes: 512, depth: 64, samples: 4000, evaluations: 20000 });
  const VARIABLES = new Set(['x', 'y', 't', 'a', 'b', 'c']);
  const CONSTANTS = Object.freeze({ pi: Math.PI, e: Math.E, tau: 2 * Math.PI });
  const compiledExpressions = new WeakSet();
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const finite = Number.isFinite;
  const FUNCTIONS = Object.freeze({
    sin: [1, 1], cos: [1, 1], tan: [1, 1], asin: [1, 1], acos: [1, 1], atan: [1, 1], atan2: [2, 2],
    sinh: [1, 1], cosh: [1, 1], tanh: [1, 1], sqrt: [1, 1], cbrt: [1, 1], abs: [1, 1],
    exp: [1, 1], ln: [1, 1], log: [1, 2], log10: [1, 1], log2: [1, 1],
    floor: [1, 1], ceil: [1, 1], round: [1, 1], sign: [1, 1],
    min: [2, 16], max: [2, 16], pow: [2, 2], hypot: [2, 8], clamp: [3, 3]
  });

  function syntax(message, token) {
    return new Error(message + (token && token.at !== undefined ? '（第 ' + (token.at + 1) + ' 个字符）' : ''));
  }

  function tokenize(source) {
    const tokens = [];
    let at = 0;
    while (at < source.length) {
      const char = source[at];
      if (/\s/.test(char)) { at++; continue; }
      if (/[0-9.]/.test(char)) {
        const match = /^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i.exec(source.slice(at));
        if (!match || !finite(Number(match[0])) || source[at + match[0].length] === '.') throw syntax('数字格式无效或超出范围', { at });
        tokens.push({ type: 'number', value: Number(match[0]), at });
        at += match[0].length;
      } else if (/[a-z]/i.test(char)) {
        const match = /^[a-z][a-z0-9]*/i.exec(source.slice(at));
        tokens.push({ type: 'name', value: match[0].toLowerCase(), at });
        at += match[0].length;
      } else if ('+-*/^(),'.includes(char)) {
        tokens.push({ type: char, value: char, at: at++ });
      } else throw syntax('不支持这个字符，请使用数学表达式', { at });
      if (tokens.length > LIMITS.tokens) throw new Error('表达式太复杂，请缩短后重试。');
    }
    tokens.push({ type: 'end', at: source.length });
    return tokens;
  }

  function call(name, args, degree) {
    const a = args[0], b = args[1];
    const input = degree ? a * Math.PI / 180 : a;
    const output = degree ? 180 / Math.PI : 1;
    switch (name) {
      case 'sin': return Math.sin(input);
      case 'cos': return Math.cos(input);
      case 'tan': return Math.abs(Math.cos(input)) < 1e-12 ? NaN : Math.tan(input);
      case 'asin': return Math.asin(a) * output;
      case 'acos': return Math.acos(a) * output;
      case 'atan': return Math.atan(a) * output;
      case 'atan2': return Math.atan2(a, b) * output;
      case 'sinh': return Math.sinh(a);
      case 'cosh': return Math.cosh(a);
      case 'tanh': return Math.tanh(a);
      case 'sqrt': return Math.sqrt(a);
      case 'cbrt': return Math.cbrt(a);
      case 'abs': return Math.abs(a);
      case 'exp': return Math.exp(a);
      case 'ln': return Math.log(a);
      case 'log': return args.length === 1 ? Math.log10(a) : b > 0 && b !== 1 ? Math.log(a) / Math.log(b) : NaN;
      case 'log10': return Math.log10(a);
      case 'log2': return Math.log2(a);
      case 'floor': return Math.floor(a);
      case 'ceil': return Math.ceil(a);
      case 'round': return Math.round(a);
      case 'sign': return Math.sign(a);
      case 'min': return Math.min.apply(null, args);
      case 'max': return Math.max.apply(null, args);
      case 'pow': return Math.pow(a, b);
      case 'hypot': return Math.hypot.apply(null, args);
      case 'clamp': return b <= args[2] ? Math.max(b, Math.min(args[2], a)) : NaN;
      default: return NaN;
    }
  }

  function compile(text, options) {
    options = options || {};
    if (typeof text !== 'string' || !text.trim()) throw new Error('请输入函数表达式。');
    if (text.length > LIMITS.expressionLength) throw new Error('表达式过长，请控制在 ' + LIMITS.expressionLength + ' 个字符以内。');
    if (options.angle !== undefined && options.angle !== 'rad' && options.angle !== 'deg') throw new Error('角度模式应为 rad 或 deg。');
    const names = options.variables === undefined ? Array.from(VARIABLES) : options.variables;
    if (!Array.isArray(names) || names.some(name => !VARIABLES.has(name))) throw new Error('仅支持变量 x、y、t、a、b、c。');
    const allowed = new Set(names);
    const expression = text.trim().replace(/^[yzr]\s*=\s*/i, '').replace(/π/g, '(pi)').replace(/τ/g, '(tau)').replace(/[−–]/g, '-').replace(/[×·]/g, '*').replace(/÷/g, '/').trim();
    if (!expression) throw new Error('等号后需要填写函数表达式。');
    const tokens = tokenize(expression);
    let position = 0, count = 0, nesting = 0;
    const current = () => tokens[position];
    function take(type) {
      if (current().type !== type) throw syntax('这里需要“' + type + '”', current());
      return tokens[position++];
    }
    function node(type, value, children) {
      const depth = 1 + (children.length ? Math.max.apply(null, children.map(child => child.depth)) : 0);
      if (++count > LIMITS.nodes || depth > LIMITS.depth) throw new Error('表达式层级过深或太复杂，请简化后重试。');
      return { type, value, children, depth };
    }
    function enter() {
      if (++nesting > LIMITS.depth) throw new Error('表达式嵌套过深，请减少括号或幂运算层级。');
    }
    function sum() {
      let value = product();
      while (current().type === '+' || current().type === '-') {
        const operator = tokens[position++].type;
        value = node('binary', operator, [value, product()]);
      }
      return value;
    }
    function product() {
      let value = unary();
      while (true) {
        const type = current().type;
        if (type === '*' || type === '/') {
          position++;
          value = node('binary', type, [value, unary()]);
        } else if (type === 'number' || type === 'name' || type === '(') {
          value = node('binary', '*', [value, unary()]);
        } else return value;
      }
    }
    function unary() {
      enter();
      let value;
      if (current().type === '+' || current().type === '-') {
        const operator = tokens[position++].type;
        value = node('unary', operator, [unary()]);
      } else value = power();
      nesting--;
      return value;
    }
    function power() {
      let value = primary();
      if (current().type === '^') {
        position++;
        value = node('binary', '^', [value, unary()]);
      }
      return value;
    }
    function primary() {
      const token = current();
      if (token.type === 'number') { position++; return node('number', token.value, []); }
      if (token.type === '(') {
        position++;
        const value = sum();
        take(')');
        return value;
      }
      if (token.type === 'name') {
        position++;
        const name = token.value;
        if (own(FUNCTIONS, name)) {
          if (current().type !== '(') throw syntax('函数 ' + name + ' 需要括号，例如 ' + name + '(x)', token);
          position++;
          const args = [];
          if (current().type !== ')') {
            args.push(sum());
            while (current().type === ',') { position++; args.push(sum()); }
          }
          take(')');
          const arity = FUNCTIONS[name];
          if (args.length < arity[0] || args.length > arity[1]) throw syntax('函数 ' + name + ' 的参数数量不正确', token);
          return node('call', name, args);
        }
        if (own(CONSTANTS, name)) return node('number', CONSTANTS[name], []);
        if (allowed.has(name)) return node('variable', name, []);
        throw syntax('未知名称“' + name + '”', token);
      }
      throw syntax(token.type === 'end' ? '表达式尚未填写完整' : '这里需要数字、变量或函数', token);
    }
    const tree = sum();
    if (current().type !== 'end') throw syntax('表达式包含多余字符', current());
    const degree = options.angle === 'deg';
    function run(part, scope) {
      if (part.type === 'number') return part.value;
      if (part.type === 'variable') {
        const value = own(scope, part.value) ? scope[part.value] : NaN;
        return typeof value === 'number' && finite(value) ? value : NaN;
      }
      if (part.type === 'unary') {
        const value = run(part.children[0], scope);
        return part.value === '-' ? -value : value;
      }
      if (part.type === 'call') {
        const args = part.children.map(child => run(child, scope));
        return args.every(finite) ? call(part.value, args, degree) : NaN;
      }
      const a = run(part.children[0], scope), b = run(part.children[1], scope);
      if (!finite(a) || !finite(b)) return NaN;
      switch (part.value) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return b === 0 ? NaN : a / b;
        case '^': return Math.pow(a, b);
        default: return NaN;
      }
    }
    const result = Object.freeze({
      expression,
      evaluate(scope) {
        if (scope === null || typeof scope !== 'object') scope = {};
        const value = run(tree, scope);
        return finite(value) ? value : NaN;
      }
    });
    compiledExpressions.add(result);
    return result;
  }

  function checkCompiled(compiled) {
    if (!compiledExpressions.has(compiled)) throw new Error('请先使用 compile 编译函数表达式。');
  }

  function evaluator(compiled, scope) {
    checkCompiled(compiled);
    const values = Object.assign({}, scope || {});
    let evaluations = 0;
    return x => {
      if (++evaluations > LIMITS.evaluations) throw new Error('计算量过大，请缩小区间或简化函数。');
      values.x = x;
      return compiled.evaluate(values);
    };
  }

  function interval(x0, x1) {
    if (typeof x0 !== 'number' || typeof x1 !== 'number' || !finite(x0) || !finite(x1)) throw new Error('区间端点必须为有限数字。');
    if (Math.abs(x0) > 1e9 || Math.abs(x1) > 1e9) throw new Error('请将计算区间控制在 -10⁹ 至 10⁹ 之间。');
  }

  function derivative(compiled, x, scope) {
    interval(x, x);
    const f = evaluator(compiled, scope);
    const h = Math.cbrt(Number.EPSILON) * Math.max(1, Math.abs(x));
    const center = f(x), left = f(x - h), right = f(x + h), halfLeft = f(x - h / 2), halfRight = f(x + h / 2);
    if (![center, left, right, halfLeft, halfRight].every(finite)) return NaN;
    const forward = (halfRight - center) / (h / 2), backward = (center - halfLeft) / (h / 2);
    if (Math.abs(forward - backward) > .001 * (1 + Math.abs(forward) + Math.abs(backward))) return NaN;
    const rough = (right - left) / (2 * h), fine = (halfRight - halfLeft) / h;
    const result = (4 * fine - rough) / 3;
    return finite(result) ? result : NaN;
  }

  function integral(compiled, x0, x1, scope) {
    interval(x0, x1);
    const evaluate = evaluator(compiled, scope);
    if (x0 === x1) return 0;
    const direction = x1 < x0 ? -1 : 1, lo = Math.min(x0, x1), hi = Math.max(x0, x1);
    const fail = () => new Error('该区间可能包含间断点或定义域外数值，无法可靠积分。');
    const memo = new Map();
    function f(x) {
      if (memo.has(x)) return memo.get(x);
      const value = evaluate(x);
      if (!finite(value)) throw fail();
      memo.set(x, value);
      return value;
    }
    const simpson = (a, b, fa, fm, fb) => (b - a) / 6 * (fa + 4 * fm + fb);
    const cells = 32, pieces = [];
    let initial = 0;
    // Sampling the whole interval first avoids silently skipping a domain gap.
    for (let i = 0; i <= 256; i++) f(lo + (hi - lo) * i / 256);
    for (let i = 0; i < cells; i++) {
      const a = lo + (hi - lo) * i / cells, b = lo + (hi - lo) * (i + 1) / cells, m = (a + b) / 2;
      const fa = f(a), fm = f(m), fb = f(b), estimate = simpson(a, b, fa, fm, fb);
      if (!finite(estimate)) throw fail();
      pieces.push({ a, b, fa, fm, fb, estimate });
      initial += estimate;
    }
    const tolerance = 1e-7 * Math.max(1, Math.min(1e6, Math.abs(initial)));
    let accumulatedError = 0;
    function adaptive(a, b, fa, fm, fb, whole, toleranceHere, depth) {
      const middle = (a + b) / 2, lm = (a + middle) / 2, rm = (middle + b) / 2;
      if (lm === a || rm === b) throw fail();
      const left = simpson(a, middle, fa, f(lm), fm), right = simpson(middle, b, fm, f(rm), fb);
      const delta = left + right - whole, error = Math.abs(delta) / 15;
      if (![left, right, delta].every(finite)) throw fail();
      if (error <= toleranceHere || (depth === 0 && error <= tolerance / (cells * 16))) {
        accumulatedError += error;
        return left + right + delta / 15;
      }
      if (depth === 0) throw fail();
      return adaptive(a, middle, fa, f(lm), fm, left, toleranceHere / 2, depth - 1) +
        adaptive(middle, b, fm, f(rm), fb, right, toleranceHere / 2, depth - 1);
    }
    let result = 0;
    for (const part of pieces) result += adaptive(part.a, part.b, part.fa, part.fm, part.fb, part.estimate, tolerance / cells, 18);
    if (!finite(result) || accumulatedError > tolerance) throw fail();
    return result * direction;
  }

  function roots(compiled, x0, x1, scope) {
    interval(x0, x1);
    const f = evaluator(compiled, scope);
    const lo = Math.min(x0, x1), hi = Math.max(x0, x1);
    if (lo === hi) return f(lo) === 0 ? [lo] : [];
    const count = 1536, width = hi - lo, points = [], found = [];
    const uniqueDistance = Math.max(1e-9, width * 1e-9);
    function add(x) {
      if (!finite(x) || x < lo || x > hi || found.some(value => Math.abs(value - x) <= uniqueDistance)) return;
      if (found.length >= 128) throw new Error('区间内的根过多，请缩小区间后重试。');
      found.push(Math.abs(x) < 1e-14 ? 0 : x);
    }
    for (let i = 0; i <= count; i++) {
      const x = lo + width * i / count;
      points.push({ x, y: f(x) });
    }
    if (points.every(point => point.y === 0)) throw new Error('该函数在区间内恒为零，根不唯一。');
    function bisect(left, right) {
      let a = left.x, b = right.x, fa = left.y, fb = right.y;
      const residual = Math.max(Math.abs(fa), Math.abs(fb)) * 1e-10;
      let bestX = Math.abs(fa) < Math.abs(fb) ? a : b, bestY = Math.min(Math.abs(fa), Math.abs(fb));
      for (let iteration = 0; iteration < 72; iteration++) {
        const middle = (a + b) / 2;
        if (middle === a || middle === b) break;
        const fm = f(middle);
        if (!finite(fm)) return;
        if (Math.abs(fm) < bestY) { bestX = middle; bestY = Math.abs(fm); }
        if (fm === 0) { add(middle); return; }
        if ((fa < 0) !== (fm < 0)) { b = middle; fb = fm; }
        else { a = middle; fa = fm; }
      }
      // Merely crossing the x axis is insufficient: 1/x and tan(x) have poles.
      if (bestY <= residual) add(bestX);
    }
    function tangent(left, middle, right) {
      let a = left.x, b = right.x;
      const ratio = (Math.sqrt(5) - 1) / 2;
      let c = b - ratio * (b - a), d = a + ratio * (b - a), fc = Math.abs(f(c)), fd = Math.abs(f(d));
      if (!finite(fc) || !finite(fd)) return;
      for (let iteration = 0; iteration < 64; iteration++) {
        if (fc < fd) { b = d; d = c; fd = fc; c = b - ratio * (b - a); fc = Math.abs(f(c)); }
        else { a = c; c = d; fc = fd; d = a + ratio * (b - a); fd = Math.abs(f(d)); }
        if (!finite(fc) || !finite(fd)) return;
      }
      const candidate = fc < fd ? c : d, value = Math.min(fc, fd);
      const scale = Math.max(Math.abs(left.y), Math.abs(right.y));
      if (value <= scale * 1e-12) add(candidate);
    }
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      if (!finite(point.y)) continue;
      if (point.y === 0) add(point.x);
      if (i && finite(points[i - 1].y) && point.y !== 0 && points[i - 1].y !== 0 && (point.y < 0) !== (points[i - 1].y < 0)) bisect(points[i - 1], point);
      if (i > 0 && i < count) {
        const left = points[i - 1], right = points[i + 1];
        if ([left.y, right.y].every(finite) && Math.abs(point.y) < Math.abs(left.y) && Math.abs(point.y) < Math.abs(right.y) && (left.y < 0) === (right.y < 0)) tangent(left, point, right);
      }
    }
    for (const index of [0, count]) {
      const point = points[index], neighbor = points[index === 0 ? 1 : count - 1];
      if (finite(point.y) && finite(neighbor.y) && Math.abs(point.y) <= Math.abs(neighbor.y) * 1e-10) add(point.x);
    }
    return found.sort((a, b) => a - b);
  }

  function sample2D(compiled, options) {
    options = options || {};
    const min = options.min === undefined ? -10 : options.min, max = options.max === undefined ? 10 : options.max;
    interval(min, max);
    const count = options.count === undefined ? 801 : options.count;
    if (!Number.isInteger(count) || count < 2 || count > LIMITS.samples) throw new Error('采样数应为 2 至 ' + LIMITS.samples + ' 之间的整数。');
    const f = evaluator(compiled, options.scope), values = [];
    for (let i = 0; i < count; i++) {
      const x = min + (max - min) * i / (count - 1);
      values.push({ x, y: f(x) });
    }
    return values;
  }

  return Object.freeze({ compile, derivative, integral, roots, sample2D, functionNames: Object.freeze(Object.keys(FUNCTIONS)), limits: LIMITS });
});
