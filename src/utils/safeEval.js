/**
 * 安全表达式求值 — 替代 eval()
 *
 * 仅允许：数字、小数点、+-*%(),^ 以及白名单函数名
 * 阻止：任意 JS 代码注入、属性访问(.)、window/document 访问等
 */

/** 白名单函数及对应实现 */
const MATH_FUNCS = {
  SUM: '(...a)=>a.flat().reduce((s,x)=>s+(+x||0),0)',
  AVG: '(...a)=>{const f=a.flat();return f.length?f.reduce((s,x)=>s+(+x||0),0)/f.length:0}',
  MAX: '(...a)=>Math.max(...a.flat().map(Number))',
  MIN: '(...a)=>Math.min(...a.flat().map(Number))',
  ROUND: '(n,d=0)=>Math.round(+n*10**d)/10**d',
  ABS: 'Math.abs',
  SQRT: 'Math.sqrt',
  POWER: 'Math.pow',
  INT: 'Math.floor',
  CEIL: 'Math.ceil',
  IF: '(c,a,b)=>c?a:b',
  AND: '(...a)=>a.every(Boolean)',
  OR: '(...a)=>a.some(Boolean)',
  NOT: '(a)=>!a',
  COUNT: '(...a)=>a.flat().length',
  LEN: '(s)=>String(s).length',
  UPPER: '(s)=>String(s).toUpperCase()',
  LOWER: '(s)=>String(s).toLowerCase()',
  CONCAT: '(...a)=>a.flat().join("")',
  MOD: '(a,b)=>a%b',
}

/** 合法字符正则：数字、小数点、运算符、括号、逗号、字母 */
const SAFE_CHARS = /^[\d.+\-*/%(),^A-Za-z\s]*$/

/**
 * 安全计算数学表达式
 * @param {string} expr - 表达式，如 "1+2*3" 或 "SUM(1,2,3)"
 * @returns {number|string} 计算结果
 * @throws {Error} 如果表达式包含非法字符或未知标识符
 */
export function safeEvalExpr(expr) {
  if (typeof expr !== 'string' || !expr.trim()) {
    throw new Error('表达式为空')
  }

  const cleaned = expr.replace(/\s+/g, '')

  // 1. 字符白名单校验
  if (!SAFE_CHARS.test(cleaned)) {
    throw new Error('表达式包含非法字符')
  }

  // 2. 提取所有标识符，校验是否在白名单内
  const identifiers = cleaned.match(/[A-Za-z][A-Za-z0-9]*/g) || []
  for (const id of identifiers) {
    if (!Object.prototype.hasOwnProperty.call(MATH_FUNCS, id.toUpperCase())) {
      throw new Error(`未知函数: ${id}`)
    }
  }

  // 3. 替换 ^ 为 ** （幂运算）
  const code = cleaned.replace(/\^/g, '**')

  // 4. 构建受限作用域的函数并执行
  const funcDecls = Object.entries(MATH_FUNCS)
    .map(([name, impl]) => `const ${name}=${impl};`)
    .join('')

  const fn = new Function('"use strict";' + funcDecls + 'return (' + code + ')')

  return fn()
}
