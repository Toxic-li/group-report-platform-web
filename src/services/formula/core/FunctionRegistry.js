/**
 * Formula System - 函数注册中心（Function Registry）
 * 
 * 集中管理所有可用函数，包括：
 * - 数学函数
 * - 统计函数
 * - 逻辑函数
 * - 文本函数
 * - 日期函数
 * - 聚合函数
 * - 窗口函数
 * - 时间分析函数
 * - 业务函数
 */

import { DataType, FormulaCategory } from './FormulaTypes.js'

/**
 * FunctionRegistry - 函数注册中心
 */
export class FunctionRegistry {
  constructor() {
    this.functions = new Map()
    this.categories = new Map()
    
    // 注册内置函数
    this.registerBuiltInFunctions()
  }
  
  /**
   * 注册函数
   */
  register(funcDef) {
    this.functions.set(funcDef.name.toUpperCase(), funcDef)
    
    // 添加到分类
    const category = funcDef.category || FormulaCategory.BASIC
    if (!this.categories.has(category)) {
      this.categories.set(category, new Set())
    }
    this.categories.get(category).add(funcDef.name.toUpperCase())
    
    return this
  }
  
  /**
   * 批量注册函数
   */
  registerAll(funcDefs) {
    for (const funcDef of funcDefs) {
      this.register(funcDef)
    }
    return this
  }
  
  /**
   * 获取函数定义
   */
  get(name) {
    return this.functions.get(name.toUpperCase())
  }
  
  /**
   * 检查函数是否存在
   */
  has(name) {
    return this.functions.has(name.toUpperCase())
  }
  
  /**
   * 获取分类下的所有函数
   */
  getByCategory(category) {
    const funcNames = this.categories.get(category) || new Set()
    return [...funcNames].map(name => this.functions.get(name))
  }
  
  /**
   * 获取所有函数
   */
  getAll() {
    return [...this.functions.values()]
  }
  
  /**
   * 获取所有分类
   */
  getCategories() {
    return [...this.categories.keys()]
  }
  
  /**
   * 注册内置函数
   */
  registerBuiltInFunctions() {
    // ==================== 数学函数 ====================
    this.registerAll([
      {
        name: 'SUM',
        category: FormulaCategory.AGGREGATE,
        description: '计算数值的总和',
        signature: 'SUM(number1, [number2], ...)',
        params: [
          { name: 'number1', type: DataType.NUMBER, description: '第一个数值或范围', required: true },
          { name: 'number2', type: DataType.NUMBER, description: '更多数值或范围', required: false }
        ],
        minArgs: 1,
        maxArgs: Infinity,
        returnType: DataType.NUMBER,
        examples: ['SUM(1, 2, 3)', 'SUM([营业收入], [营业成本])', 'SUM(A1:A10)'],
        compute: (ctx, args) => {
          const values = this.flattenArgs(ctx, args)
          return values.reduce((sum, val) => sum + (Number(val) || 0), 0)
        }
      },
      {
        name: 'AVG',
        aliases: ['AVERAGE'],
        category: FormulaCategory.AGGREGATE,
        description: '计算数值的平均值',
        signature: 'AVG(number1, [number2], ...)',
        params: [
          { name: 'number1', type: DataType.NUMBER, description: '第一个数值或范围', required: true },
          { name: 'number2', type: DataType.NUMBER, description: '更多数值或范围', required: false }
        ],
        minArgs: 1,
        maxArgs: Infinity,
        returnType: DataType.NUMBER,
        examples: ['AVG(1, 2, 3)', 'AVG([营业收入], [营业成本])'],
        compute: (ctx, args) => {
          const values = this.flattenArgs(ctx, args).filter(v => v != null && !isNaN(v))
          if (values.length === 0) return 0
          const sum = values.reduce((s, v) => s + Number(v), 0)
          return sum / values.length
        }
      },
      {
        name: 'MAX',
        category: FormulaCategory.AGGREGATE,
        description: '返回最大值',
        signature: 'MAX(number1, [number2], ...)',
        params: [
          { name: 'number1', type: DataType.NUMBER, description: '第一个数值或范围', required: true },
          { name: 'number2', type: DataType.NUMBER, description: '更多数值或范围', required: false }
        ],
        minArgs: 1,
        maxArgs: Infinity,
        returnType: DataType.NUMBER,
        examples: ['MAX(1, 2, 3)', 'MAX([营业收入], [营业成本])'],
        compute: (ctx, args) => {
          const values = this.flattenArgs(ctx, args).filter(v => v != null && !isNaN(v))
          return values.length > 0 ? Math.max(...values.map(Number)) : 0
        }
      },
      {
        name: 'MIN',
        category: FormulaCategory.AGGREGATE,
        description: '返回最小值',
        signature: 'MIN(number1, [number2], ...)',
        params: [
          { name: 'number1', type: DataType.NUMBER, description: '第一个数值或范围', required: true },
          { name: 'number2', type: DataType.NUMBER, description: '更多数值或范围', required: false }
        ],
        minArgs: 1,
        maxArgs: Infinity,
        returnType: DataType.NUMBER,
        examples: ['MIN(1, 2, 3)', 'MIN([营业收入], [营业成本])'],
        compute: (ctx, args) => {
          const values = this.flattenArgs(ctx, args).filter(v => v != null && !isNaN(v))
          return values.length > 0 ? Math.min(...values.map(Number)) : 0
        }
      },
      {
        name: 'COUNT',
        category: FormulaCategory.AGGREGATE,
        description: '计算非空值的数量',
        signature: 'COUNT(value1, [value2], ...)',
        params: [
          { name: 'value1', type: DataType.ANY, description: '第一个值或范围', required: true },
          { name: 'value2', type: DataType.ANY, description: '更多值或范围', required: false }
        ],
        minArgs: 1,
        maxArgs: Infinity,
        returnType: DataType.NUMBER,
        examples: ['COUNT(1, 2, null)', 'COUNT([营业收入])'],
        compute: (ctx, args) => {
          const values = this.flattenArgs(ctx, args)
          return values.filter(v => v != null && v !== '' && !isNaN(v)).length
        }
      },
      {
        name: 'COUNTDISTINCT',
        aliases: ['COUNTD'],
        category: FormulaCategory.AGGREGATE,
        description: '计算不重复值的数量',
        signature: 'COUNTDISTINCT(value1, [value2], ...)',
        params: [
          { name: 'value1', type: DataType.ANY, description: '第一个值或范围', required: true },
          { name: 'value2', type: DataType.ANY, description: '更多值或范围', required: false }
        ],
        minArgs: 1,
        maxArgs: Infinity,
        returnType: DataType.NUMBER,
        examples: ['COUNTDISTINCT(1, 2, 2, 3)', 'COUNTDISTINCT([地区])'],
        compute: (ctx, args) => {
          const values = this.flattenArgs(ctx, args).filter(v => v != null)
          return new Set(values).size
        }
      },
      {
        name: 'ROUND',
        category: FormulaCategory.BASIC,
        description: '四舍五入到指定位数',
        signature: 'ROUND(number, [digits])',
        params: [
          { name: 'number', type: DataType.NUMBER, description: '要四舍五入的数值', required: true },
          { name: 'digits', type: DataType.NUMBER, description: '保留的小数位数，默认为0', required: false }
        ],
        minArgs: 1,
        maxArgs: 2,
        returnType: DataType.NUMBER,
        examples: ['ROUND(3.14159, 2)', 'ROUND([利润率], 2)'],
        compute: (ctx, args) => {
          const num = Number(this.evaluateArg(ctx, args[0])) || 0
          const digits = Number(this.evaluateArg(ctx, args[1])) || 0
          const factor = Math.pow(10, digits)
          return Math.round(num * factor) / factor
        }
      },
      {
        name: 'ABS',
        category: FormulaCategory.BASIC,
        description: '返回绝对值',
        signature: 'ABS(number)',
        params: [
          { name: 'number', type: DataType.NUMBER, description: '数值', required: true }
        ],
        minArgs: 1,
        maxArgs: 1,
        returnType: DataType.NUMBER,
        examples: ['ABS(-10)', 'ABS([差值])'],
        compute: (ctx, args) => {
          return Math.abs(Number(this.evaluateArg(ctx, args[0])) || 0)
        }
      },
      {
        name: 'POWER',
        aliases: ['POW'],
        category: FormulaCategory.BASIC,
        description: '计算幂运算',
        signature: 'POWER(number, power)',
        params: [
          { name: 'number', type: DataType.NUMBER, description: '基数', required: true },
          { name: 'power', type: DataType.NUMBER, description: '指数', required: true }
        ],
        minArgs: 2,
        maxArgs: 2,
        returnType: DataType.NUMBER,
        examples: ['POWER(2, 3)', 'POWER([基数], [指数])'],
        compute: (ctx, args) => {
          const base = Number(this.evaluateArg(ctx, args[0])) || 0
          const exp = Number(this.evaluateArg(ctx, args[1])) || 0
          return Math.pow(base, exp)
        }
      },
      {
        name: 'SQRT',
        category: FormulaCategory.BASIC,
        description: '计算平方根',
        signature: 'SQRT(number)',
        params: [
          { name: 'number', type: DataType.NUMBER, description: '数值', required: true }
        ],
        minArgs: 1,
        maxArgs: 1,
        returnType: DataType.NUMBER,
        examples: ['SQRT(16)', 'SQRT([面积])'],
        compute: (ctx, args) => {
          const num = Number(this.evaluateArg(ctx, args[0])) || 0
          if (num < 0) return NaN
          return Math.sqrt(num)
        }
      },
      {
        name: 'MOD',
        category: FormulaCategory.BASIC,
        description: '计算模（余数）',
        signature: 'MOD(number, divisor)',
        params: [
          { name: 'number', type: DataType.NUMBER, description: '被除数', required: true },
          { name: 'divisor', type: DataType.NUMBER, description: '除数', required: true }
        ],
        minArgs: 2,
        maxArgs: 2,
        returnType: DataType.NUMBER,
        examples: ['MOD(10, 3)', 'MOD([总数], [分组数])'],
        compute: (ctx, args) => {
          const num = Number(this.evaluateArg(ctx, args[0])) || 0
          const divisor = Number(this.evaluateArg(ctx, args[1])) || 1
          if (divisor === 0) return NaN
          return num % divisor
        }
      },
      {
        name: 'CEIL',
        aliases: ['CEILING'],
        category: FormulaCategory.BASIC,
        description: '向上取整',
        signature: 'CEIL(number)',
        params: [
          { name: 'number', type: DataType.NUMBER, description: '数值', required: true }
        ],
        minArgs: 1,
        maxArgs: 1,
        returnType: DataType.NUMBER,
        examples: ['CEIL(3.2)', 'CEIL([平均值])'],
        compute: (ctx, args) => {
          return Math.ceil(Number(this.evaluateArg(ctx, args[0])) || 0)
        }
      },
      {
        name: 'FLOOR',
        category: FormulaCategory.BASIC,
        description: '向下取整',
        signature: 'FLOOR(number)',
        params: [
          { name: 'number', type: DataType.NUMBER, description: '数值', required: true }
        ],
        minArgs: 1,
        maxArgs: 1,
        returnType: DataType.NUMBER,
        examples: ['FLOOR(3.8)', 'FLOOR([平均值])'],
        compute: (ctx, args) => {
          return Math.floor(Number(this.evaluateArg(ctx, args[0])) || 0)
        }
      }
    ])
    
    // ==================== 逻辑函数 ====================
    this.registerAll([
      {
        name: 'IF',
        category: FormulaCategory.CONDITIONAL,
        description: '条件判断',
        signature: 'IF(condition, trueValue, falseValue)',
        params: [
          { name: 'condition', type: DataType.BOOLEAN, description: '条件表达式', required: true },
          { name: 'trueValue', type: DataType.ANY, description: '条件为真时的值', required: true },
          { name: 'falseValue', type: DataType.ANY, description: '条件为假时的值', required: true }
        ],
        minArgs: 3,
        maxArgs: 3,
        returnType: DataType.ANY,
        examples: ['IF([利润] > 0, "盈利", "亏损")', 'IF([完成率] >= 1, 100, 0)'],
        compute: (ctx, args) => {
          const condition = this.evaluateArg(ctx, args[0])
          const trueVal = this.evaluateArg(ctx, args[1])
          const falseVal = this.evaluateArg(ctx, args[2])
          return condition ? trueVal : falseVal
        }
      },
      {
        name: 'IFS',
        category: FormulaCategory.CONDITIONAL,
        description: '多条件判断',
        signature: 'IFS(condition1, value1, [condition2, value2], ...)',
        params: [],
        minArgs: 2,
        maxArgs: Infinity,
        returnType: DataType.ANY,
        examples: ['IFS([score] >= 90, "A", [score] >= 80, "B", "C")'],
        compute: (ctx, args) => {
          for (let i = 0; i < args.length - 1; i += 2) {
            const condition = this.evaluateArg(ctx, args[i])
            if (condition) {
              return this.evaluateArg(ctx, args[i + 1])
            }
          }
          // 如果最后一个参数是单独的值（默认值）
          if (args.length % 2 === 1) {
            return this.evaluateArg(ctx, args[args.length - 1])
          }
          return null
        }
      },
      {
        name: 'AND',
        category: FormulaCategory.CONDITIONAL,
        description: '逻辑与',
        signature: 'AND(condition1, [condition2], ...)',
        params: [
          { name: 'condition1', type: DataType.BOOLEAN, description: '第一个条件', required: true },
          { name: 'condition2', type: DataType.BOOLEAN, description: '更多条件', required: false }
        ],
        minArgs: 1,
        maxArgs: Infinity,
        returnType: DataType.BOOLEAN,
        examples: ['AND([收入] > 1000, [成本] < 500)'],
        compute: (ctx, args) => {
          return args.every(arg => Boolean(this.evaluateArg(ctx, arg)))
        }
      },
      {
        name: 'OR',
        category: FormulaCategory.CONDITIONAL,
        description: '逻辑或',
        signature: 'OR(condition1, [condition2], ...)',
        params: [
          { name: 'condition1', type: DataType.BOOLEAN, description: '第一个条件', required: true },
          { name: 'condition2', type: DataType.BOOLEAN, description: '更多条件', required: false }
        ],
        minArgs: 1,
        maxArgs: Infinity,
        returnType: DataType.BOOLEAN,
        examples: ['OR([状态] = "完成", [状态] = "审核")'],
        compute: (ctx, args) => {
          return args.some(arg => Boolean(this.evaluateArg(ctx, arg)))
        }
      },
      {
        name: 'NOT',
        category: FormulaCategory.CONDITIONAL,
        description: '逻辑非',
        signature: 'NOT(condition)',
        params: [
          { name: 'condition', type: DataType.BOOLEAN, description: '条件', required: true }
        ],
        minArgs: 1,
        maxArgs: 1,
        returnType: DataType.BOOLEAN,
        examples: ['NOT([状态] = "完成")'],
        compute: (ctx, args) => {
          return !Boolean(this.evaluateArg(ctx, args[0]))
        }
      },
      {
        name: 'ISNULL',
        aliases: ['ISBLANK', 'IS_EMPTY'],
        category: FormulaCategory.CONDITIONAL,
        description: '检查是否为空',
        signature: 'ISNULL(value)',
        params: [
          { name: 'value', type: DataType.ANY, description: '要检查的值', required: true }
        ],
        minArgs: 1,
        maxArgs: 1,
        returnType: DataType.BOOLEAN,
        examples: ['ISNULL([收入])'],
        compute: (ctx, args) => {
          const val = this.evaluateArg(ctx, args[0])
          return val == null || val === ''
        }
      },
      {
        name: 'NVL',
        aliases: ['COALESCE', 'IFNULL'],
        category: FormulaCategory.CONDITIONAL,
        description: '如果为空则返回默认值',
        signature: 'NVL(value, defaultValue)',
        params: [
          { name: 'value', type: DataType.ANY, description: '要检查的值', required: true },
          { name: 'defaultValue', type: DataType.ANY, description: '默认值', required: true }
        ],
        minArgs: 2,
        maxArgs: 2,
        returnType: DataType.ANY,
        examples: ['NVL([收入], 0)'],
        compute: (ctx, args) => {
          const val = this.evaluateArg(ctx, args[0])
          const defaultVal = this.evaluateArg(ctx, args[1])
          return val == null || val === '' ? defaultVal : val
        }
      }
    ])
    
    // ==================== 文本函数 ====================
    this.registerAll([
      {
        name: 'LEFT',
        category: FormulaCategory.TEXT,
        description: '从左侧提取字符串',
        signature: 'LEFT(text, numChars)',
        params: [
          { name: 'text', type: DataType.STRING, description: '文本', required: true },
          { name: 'numChars', type: DataType.NUMBER, description: '提取的字符数', required: true }
        ],
        minArgs: 2,
        maxArgs: 2,
        returnType: DataType.STRING,
        examples: ['LEFT("Hello", 3)'],
        compute: (ctx, args) => {
          const text = String(this.evaluateArg(ctx, args[0]) || '')
          const num = Number(this.evaluateArg(ctx, args[1])) || 0
          return text.substring(0, num)
        }
      },
      {
        name: 'RIGHT',
        category: FormulaCategory.TEXT,
        description: '从右侧提取字符串',
        signature: 'RIGHT(text, numChars)',
        params: [
          { name: 'text', type: DataType.STRING, description: '文本', required: true },
          { name: 'numChars', type: DataType.NUMBER, description: '提取的字符数', required: true }
        ],
        minArgs: 2,
        maxArgs: 2,
        returnType: DataType.STRING,
        examples: ['RIGHT("Hello", 3)'],
        compute: (ctx, args) => {
          const text = String(this.evaluateArg(ctx, args[0]) || '')
          const num = Number(this.evaluateArg(ctx, args[1])) || 0
          return text.substring(text.length - num)
        }
      },
      {
        name: 'MID',
        aliases: ['SUBSTRING'],
        category: FormulaCategory.TEXT,
        description: '提取子字符串',
        signature: 'MID(text, start, numChars)',
        params: [
          { name: 'text', type: DataType.STRING, description: '文本', required: true },
          { name: 'start', type: DataType.NUMBER, description: '起始位置（从1开始）', required: true },
          { name: 'numChars', type: DataType.NUMBER, description: '提取的字符数', required: true }
        ],
        minArgs: 3,
        maxArgs: 3,
        returnType: DataType.STRING,
        examples: ['MID("Hello", 2, 3)'],
        compute: (ctx, args) => {
          const text = String(this.evaluateArg(ctx, args[0]) || '')
          const start = Number(this.evaluateArg(ctx, args[1])) - 1 || 0
          const num = Number(this.evaluateArg(ctx, args[2])) || 0
          return text.substring(start, start + num)
        }
      },
      {
        name: 'LEN',
        aliases: ['LENGTH'],
        category: FormulaCategory.TEXT,
        description: '返回字符串长度',
        signature: 'LEN(text)',
        params: [
          { name: 'text', type: DataType.STRING, description: '文本', required: true }
        ],
        minArgs: 1,
        maxArgs: 1,
        returnType: DataType.NUMBER,
        examples: ['LEN("Hello")'],
        compute: (ctx, args) => {
          const text = String(this.evaluateArg(ctx, args[0]) || '')
          return text.length
        }
      },
      {
        name: 'TRIM',
        category: FormulaCategory.TEXT,
        description: '去除首尾空格',
        signature: 'TRIM(text)',
        params: [
          { name: 'text', type: DataType.STRING, description: '文本', required: true }
        ],
        minArgs: 1,
        maxArgs: 1,
        returnType: DataType.STRING,
        examples: ['TRIM("  Hello  ")'],
        compute: (ctx, args) => {
          const text = String(this.evaluateArg(ctx, args[0]) || '')
          return text.trim()
        }
      },
      {
        name: 'UPPER',
        category: FormulaCategory.TEXT,
        description: '转换为大写',
        signature: 'UPPER(text)',
        params: [
          { name: 'text', type: DataType.STRING, description: '文本', required: true }
        ],
        minArgs: 1,
        maxArgs: 1,
        returnType: DataType.STRING,
        examples: ['UPPER("hello")'],
        compute: (ctx, args) => {
          const text = String(this.evaluateArg(ctx, args[0]) || '')
          return text.toUpperCase()
        }
      },
      {
        name: 'LOWER',
        category: FormulaCategory.TEXT,
        description: '转换为小写',
        signature: 'LOWER(text)',
        params: [
          { name: 'text', type: DataType.STRING, description: '文本', required: true }
        ],
        minArgs: 1,
        maxArgs: 1,
        returnType: DataType.STRING,
        examples: ['LOWER("HELLO")'],
        compute: (ctx, args) => {
          const text = String(this.evaluateArg(ctx, args[0]) || '')
          return text.toLowerCase()
        }
      },
      {
        name: 'CONCAT',
        aliases: ['CONCATENATE', 'JOIN'],
        category: FormulaCategory.TEXT,
        description: '连接字符串',
        signature: 'CONCAT(text1, [text2], ...)',
        params: [
          { name: 'text1', type: DataType.STRING, description: '第一个文本', required: true },
          { name: 'text2', type: DataType.STRING, description: '更多文本', required: false }
        ],
        minArgs: 1,
        maxArgs: Infinity,
        returnType: DataType.STRING,
        examples: ['CONCAT("Hello", " ", "World")'],
        compute: (ctx, args) => {
          return args.map(arg => String(this.evaluateArg(ctx, arg) || '')).join('')
        }
      },
      {
        name: 'REPLACE',
        aliases: ['SUBSTITUTE'],
        category: FormulaCategory.TEXT,
        description: '替换文本',
        signature: 'REPLACE(text, oldText, newText)',
        params: [
          { name: 'text', type: DataType.STRING, description: '原文本', required: true },
          { name: 'oldText', type: DataType.STRING, description: '要替换的文本', required: true },
          { name: 'newText', type: DataType.STRING, description: '新文本', required: true }
        ],
        minArgs: 3,
        maxArgs: 3,
        returnType: DataType.STRING,
        examples: ['REPLACE("Hello World", "World", "Vue")'],
        compute: (ctx, args) => {
          const text = String(this.evaluateArg(ctx, args[0]) || '')
          const oldText = String(this.evaluateArg(ctx, args[1]) || '')
          const newText = String(this.evaluateArg(ctx, args[2]) || '')
          return text.replace(oldText, newText)
        }
      }
    ])
    
    // ==================== 日期函数 ====================
    this.registerAll([
      {
        name: 'TODAY',
        category: FormulaCategory.DATE,
        description: '返回当前日期',
        signature: 'TODAY()',
        params: [],
        minArgs: 0,
        maxArgs: 0,
        returnType: DataType.DATE,
        examples: ['TODAY()'],
        compute: (ctx, args) => {
          const now = new Date()
          return new Date(now.getFullYear(), now.getMonth(), now.getDate())
        }
      },
      {
        name: 'NOW',
        category: FormulaCategory.DATE,
        description: '返回当前日期时间',
        signature: 'NOW()',
        params: [],
        minArgs: 0,
        maxArgs: 0,
        returnType: DataType.DATE,
        examples: ['NOW()'],
        compute: (ctx, args) => {
          return new Date()
        }
      },
      {
        name: 'YEAR',
        category: FormulaCategory.DATE,
        description: '提取年份',
        signature: 'YEAR(date)',
        params: [
          { name: 'date', type: DataType.DATE, description: '日期', required: true }
        ],
        minArgs: 1,
        maxArgs: 1,
        returnType: DataType.NUMBER,
        examples: ['YEAR(TODAY())'],
        compute: (ctx, args) => {
          const date = this.parseDate(this.evaluateArg(ctx, args[0]))
          return date ? date.getFullYear() : null
        }
      },
      {
        name: 'MONTH',
        category: FormulaCategory.DATE,
        description: '提取月份',
        signature: 'MONTH(date)',
        params: [
          { name: 'date', type: DataType.DATE, description: '日期', required: true }
        ],
        minArgs: 1,
        maxArgs: 1,
        returnType: DataType.NUMBER,
        examples: ['MONTH(TODAY())'],
        compute: (ctx, args) => {
          const date = this.parseDate(this.evaluateArg(ctx, args[0]))
          return date ? date.getMonth() + 1 : null
        }
      },
      {
        name: 'DAY',
        category: FormulaCategory.DATE,
        description: '提取日期',
        signature: 'DAY(date)',
        params: [
          { name: 'date', type: DataType.DATE, description: '日期', required: true }
        ],
        minArgs: 1,
        maxArgs: 1,
        returnType: DataType.NUMBER,
        examples: ['DAY(TODAY())'],
        compute: (ctx, args) => {
          const date = this.parseDate(this.evaluateArg(ctx, args[0]))
          return date ? date.getDate() : null
        }
      },
      {
        name: 'DATEADD',
        category: FormulaCategory.DATE,
        description: '日期加减',
        signature: 'DATEADD(date, days, [unit])',
        params: [
          { name: 'date', type: DataType.DATE, description: '日期', required: true },
          { name: 'days', type: DataType.NUMBER, description: '天数（可为负）', required: true },
          { name: 'unit', type: DataType.STRING, description: '单位：day/month/year', required: false }
        ],
        minArgs: 2,
        maxArgs: 3,
        returnType: DataType.DATE,
        examples: ['DATEADD(TODAY(), 7)', 'DATEADD(TODAY(), 1, "month")'],
        compute: (ctx, args) => {
          const date = this.parseDate(this.evaluateArg(ctx, args[0]))
          const days = Number(this.evaluateArg(ctx, args[1])) || 0
          const unit = String(this.evaluateArg(ctx, args[2]) || 'day').toLowerCase()
          
          if (!date) return null
          
          const result = new Date(date)
          switch (unit) {
            case 'year':
              result.setFullYear(result.getFullYear() + days)
              break
            case 'month':
              result.setMonth(result.getMonth() + days)
              break
            case 'day':
            default:
              result.setDate(result.getDate() + days)
              break
          }
          
          return result
        }
      },
      {
        name: 'DATEDIFF',
        category: FormulaCategory.DATE,
        description: '日期差值',
        signature: 'DATEDIFF(startDate, endDate, [unit])',
        params: [
          { name: 'startDate', type: DataType.DATE, description: '开始日期', required: true },
          { name: 'endDate', type: DataType.DATE, description: '结束日期', required: true },
          { name: 'unit', type: DataType.STRING, description: '单位：day/month/year', required: false }
        ],
        minArgs: 2,
        maxArgs: 3,
        returnType: DataType.NUMBER,
        examples: ['DATEDIFF(TODAY(), DATEADD(TODAY(), 7))'],
        compute: (ctx, args) => {
          const start = this.parseDate(this.evaluateArg(ctx, args[0]))
          const end = this.parseDate(this.evaluateArg(ctx, args[1]))
          const unit = String(this.evaluateArg(ctx, args[2]) || 'day').toLowerCase()
          
          if (!start || !end) return null
          
          const diff = end - start
          switch (unit) {
            case 'year':
              return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000))
            case 'month':
              return Math.floor(diff / (30.44 * 24 * 60 * 60 * 1000))
            case 'day':
            default:
              return Math.floor(diff / (24 * 60 * 60 * 1000))
          }
        }
      }
    ])
    
    // ==================== 时间分析函数 ====================
    this.registerAll([
      {
        name: 'YOY',
        category: FormulaCategory.TIME_ANALYSIS,
        description: '同比增长率',
        signature: 'YOY(currentValue, previousYearValue)',
        params: [
          { name: 'currentValue', type: DataType.NUMBER, description: '本期值', required: true },
          { name: 'previousYearValue', type: DataType.NUMBER, description: '去年同期值', required: true }
        ],
        minArgs: 2,
        maxArgs: 2,
        returnType: DataType.NUMBER,
        examples: ['YOY([本期收入], [去年同期收入])'],
        compute: (ctx, args) => {
          const current = Number(this.evaluateArg(ctx, args[0])) || 0
          const prev = Number(this.evaluateArg(ctx, args[1])) || 0
          
          if (prev === 0) {
            return current > 0 ? 100 : 0  // 如果同期为0，本期增长视为100%或0%
          }
          
          return ((current - prev) / prev) * 100
        }
      },
      {
        name: 'MOM',
        category: FormulaCategory.TIME_ANALYSIS,
        description: '环比增长率',
        signature: 'MOM(currentValue, previousMonthValue)',
        params: [
          { name: 'currentValue', type: DataType.NUMBER, description: '本期值', required: true },
          { name: 'previousMonthValue', type: DataType.NUMBER, description: '上期值', required: true }
        ],
        minArgs: 2,
        maxArgs: 2,
        returnType: DataType.NUMBER,
        examples: ['MOM([本期收入], [上期收入])'],
        compute: (ctx, args) => {
          const current = Number(this.evaluateArg(ctx, args[0])) || 0
          const prev = Number(this.evaluateArg(ctx, args[1])) || 0
          
          if (prev === 0) {
            return current > 0 ? 100 : 0
          }
          
          return ((current - prev) / prev) * 100
        }
      },
      {
        name: 'YTD',
        category: FormulaCategory.TIME_ANALYSIS,
        description: '年初至今累计',
        signature: 'YTD(values)',
        params: [
          { name: 'values', type: DataType.ARRAY, description: '数值数组', required: true }
        ],
        minArgs: 1,
        maxArgs: 1,
        returnType: DataType.NUMBER,
        examples: ['YTD({1, 2, 3})'],
        compute: (ctx, args) => {
          const values = this.flattenArgs(ctx, args)
          return values.reduce((sum, val) => sum + (Number(val) || 0), 0)
        }
      },
      {
        name: 'QTD',
        category: FormulaCategory.TIME_ANALYSIS,
        description: '季度累计',
        signature: 'QTD(values)',
        params: [
          { name: 'values', type: DataType.ARRAY, description: '数值数组', required: true }
        ],
        minArgs: 1,
        maxArgs: 1,
        returnType: DataType.NUMBER,
        examples: ['QTD({1, 2, 3})'],
        compute: (ctx, args) => {
          const values = this.flattenArgs(ctx, args)
          return values.reduce((sum, val) => sum + (Number(val) || 0), 0)
        }
      },
      {
        name: 'MTD',
        category: FormulaCategory.TIME_ANALYSIS,
        description: '月度累计',
        signature: 'MTD(values)',
        params: [
          { name: 'values', type: DataType.ARRAY, description: '数值数组', required: true }
        ],
        minArgs: 1,
        maxArgs: 1,
        returnType: DataType.NUMBER,
        examples: ['MTD({1, 2, 3})'],
        compute: (ctx, args) => {
          const values = this.flattenArgs(ctx, args)
          return values.reduce((sum, val) => sum + (Number(val) || 0), 0)
        }
      }
    ])
    
    // ==================== 业务函数 ====================
    this.registerAll([
      {
        name: 'RATE',
        category: FormulaCategory.BUSINESS,
        description: '计算比率',
        signature: 'RATE numerator, denominator)',
        params: [
          { name: 'numerator', type: DataType.NUMBER, description: '分子', required: true },
          { name: 'denominator', type: DataType.NUMBER, description: '分母', required: true }
        ],
        minArgs: 2,
        maxArgs: 2,
        returnType: DataType.NUMBER,
        examples: ['RATE([实际], [目标])'],
        compute: (ctx, args) => {
          const numerator = Number(this.evaluateArg(ctx, args[0])) || 0
          const denominator = Number(this.evaluateArg(ctx, args[1])) || 0
          
          if (denominator === 0) return 0
          return (numerator / denominator) * 100
        }
      },
      {
        name: 'PERCENT',
        category: FormulaCategory.BUSINESS,
        description: '计算百分比',
        signature: 'PERCENT(part, total)',
        params: [
          { name: 'part', type: DataType.NUMBER, description: '部分值', required: true },
          { name: 'total', type: DataType.NUMBER, description: '总值', required: true }
        ],
        minArgs: 2,
        maxArgs: 2,
        returnType: DataType.NUMBER,
        examples: ['PERCENT([部分], SUM([总数组]))'],
        compute: (ctx, args) => {
          const part = Number(this.evaluateArg(ctx, args[0])) || 0
          const total = Number(this.evaluateArg(ctx, args[1])) || 0
          
          if (total === 0) return 0
          return (part / total) * 100
        }
      },
      {
        name: 'COMPLETE_RATE',
        aliases: ['COMPLETION_RATE'],
        category: FormulaCategory.BUSINESS,
        description: '完成率',
        signature: 'COMPLETE_RATE(actual, target)',
        params: [
          { name: 'actual', type: DataType.NUMBER, description: '实际值', required: true },
          { name: 'target', type: DataType.NUMBER, description: '目标值', required: true }
        ],
        minArgs: 2,
        maxArgs: 2,
        returnType: DataType.NUMBER,
        examples: ['COMPLETE_RATE([实际收入], [目标收入])'],
        compute: (ctx, args) => {
          const actual = Number(this.evaluateArg(ctx, args[0])) || 0
          const target = Number(this.evaluateArg(ctx, args[1])) || 0
          
          if (target === 0) return 0
          return Math.min((actual / target) * 100, 100) // 完成率上限100%
        }
      },
      {
        name: 'PROFIT_RATE',
        aliases: ['PROFIT_MARGIN'],
        category: FormulaCategory.BUSINESS,
        description: '利润率',
        signature: 'PROFIT_RATE(revenue, cost)',
        params: [
          { name: 'revenue', type: DataType.NUMBER, description: '收入', required: true },
          { name: 'cost', type: DataType.NUMBER, description: '成本', required: true }
        ],
        minArgs: 2,
        maxArgs: 2,
        returnType: DataType.NUMBER,
        examples: ['PROFIT_RATE([营业收入], [营业成本])'],
        compute: (ctx, args) => {
          const revenue = Number(this.evaluateArg(ctx, args[0])) || 0
          const cost = Number(this.evaluateArg(ctx, args[1])) || 0
          
          if (revenue === 0) return 0
          return ((revenue - cost) / revenue) * 100
        }
      },
      {
        name: 'GROWTH_RATE',
        aliases: ['GROWTH'],
        category: FormulaCategory.BUSINESS,
        description: '增长率',
        signature: 'GROWTH_RATE(current, previous)',
        params: [
          { name: 'current', type: DataType.NUMBER, description: '本期值', required: true },
          { name: 'previous', type: DataType.NUMBER, description: '上期值', required: true }
        ],
        minArgs: 2,
        maxArgs: 2,
        returnType: DataType.NUMBER,
        examples: ['GROWTH_RATE([本期], [上期])'],
        compute: (ctx, args) => {
          const current = Number(this.evaluateArg(ctx, args[0])) || 0
          const previous = Number(this.evaluateArg(ctx, args[1])) || 0
          
          if (previous === 0) {
            return current > 0 ? 100 : 0
          }
          
          return ((current - previous) / previous) * 100
        }
      }
    ])
    
    // ==================== 窗口函数 ====================
    this.registerAll([
      {
        name: 'RANK',
        category: FormulaCategory.WINDOW,
        description: '排名',
        signature: 'RANK(value, values)',
        params: [
          { name: 'value', type: DataType.NUMBER, description: '要排名的值', required: true },
          { name: 'values', type: DataType.ARRAY, description: '数值数组', required: true }
        ],
        minArgs: 2,
        maxArgs: 2,
        returnType: DataType.NUMBER,
        examples: ['RANK([利润], {100, 200, 150})'],
        compute: (ctx, args) => {
          const value = Number(this.evaluateArg(ctx, args[0])) || 0
          const values = this.flattenArgs(ctx, args[1]).map(Number).sort((a, b) => b - a)
          
          let rank = 1
          for (let i = 0; i < values.length; i++) {
            if (values[i] > value) rank++
            else break
          }
          
          return rank
        }
      },
      {
        name: 'ROW_NUMBER',
        category: FormulaCategory.WINDOW,
        description: '行号',
        signature: 'ROW_NUMBER()',
        params: [],
        minArgs: 0,
        maxArgs: 0,
        returnType: DataType.NUMBER,
        examples: ['ROW_NUMBER()'],
        compute: (ctx, args) => {
          return ctx.currentRow || 0
        }
      },
      {
        name: 'LAG',
        category: FormulaCategory.WINDOW,
        description: '滞后值（前N期的值）',
        signature: 'LAG(value, offset)',
        params: [
          { name: 'value', type: DataType.NUMBER, description: '当前值', required: true },
          { name: 'offset', type: DataType.NUMBER, description: '偏移量（默认1）', required: false }
        ],
        minArgs: 1,
        maxArgs: 2,
        returnType: DataType.NUMBER,
        examples: ['LAG([收入], 1)'],
        compute: (ctx, args) => {
          // 需要在上下文中提供历史数据
          const value = this.evaluateArg(ctx, args[0])
          const offset = Number(this.evaluateArg(ctx, args[1])) || 1
          
          // 实际实现需要从上下文获取历史数据
          // 这里返回null，需要具体场景实现
          return ctx.getHistoryValue?.(value, offset) || null
        }
      },
      {
        name: 'LEAD',
        category: FormulaCategory.WINDOW,
        description: '领先值（后N期的值）',
        signature: 'LEAD(value, offset)',
        params: [
          { name: 'value', type: DataType.NUMBER, description: '当前值', required: true },
          { name: 'offset', type: DataType.NUMBER, description: '偏移量（默认1）', required: false }
        ],
        minArgs: 1,
        maxArgs: 2,
        returnType: DataType.NUMBER,
        examples: ['LEAD([收入], 1)'],
        compute: (ctx, args) => {
          const value = this.evaluateArg(ctx, args[0])
          const offset = Number(this.evaluateArg(ctx, args[1])) || 1
          
          return ctx.getFutureValue?.(value, offset) || null
        }
      },
      {
        name: 'RUNNING_SUM',
        aliases: ['ACCUMULATE_SUM'],
        category: FormulaCategory.WINDOW,
        description: '累计求和',
        signature: 'RUNNING_SUM(value)',
        params: [
          { name: 'value', type: DataType.NUMBER, description: '数值', required: true }
        ],
        minArgs: 1,
        maxArgs: 1,
        returnType: DataType.NUMBER,
        examples: ['RUNNING_SUM([收入])'],
        compute: (ctx, args) => {
          const value = Number(this.evaluateArg(ctx, args[0])) || 0
          const prevSum = ctx.runningSum || 0
          const currentSum = prevSum + value
          ctx.runningSum = currentSum
          return currentSum
        }
      },
      {
        name: 'MOVING_AVG',
        aliases: ['MOVING_AVERAGE'],
        category: FormulaCategory.WINDOW,
        description: '移动平均',
        signature: 'MOVING_AVG(value, windowSize)',
        params: [
          { name: 'value', type: DataType.NUMBER, description: '数值', required: true },
          { name: 'windowSize', type: DataType.NUMBER, description: '窗口大小', required: true }
        ],
        minArgs: 2,
        maxArgs: 2,
        returnType: DataType.NUMBER,
        examples: ['MOVING_AVG([收入], 3)'],
        compute: (ctx, args) => {
          const value = Number(this.evaluateArg(ctx, args[0])) || 0
          const windowSize = Number(this.evaluateArg(ctx, args[1])) || 3
          
          // 需要在上下文中维护窗口数据
          const window = ctx.movingWindow || []
          window.push(value)
          if (window.length > windowSize) window.shift()
          ctx.movingWindow = window
          
          if (window.length === 0) return 0
          return window.reduce((sum, v) => sum + v, 0) / window.length
        }
      }
    ])
  }
  
  // ==================== 辅助方法 ====================
  
  /**
   * 展平参数（处理数组参数）
   */
  flattenArgs(ctx, args) {
    const values = []
    
    for (const arg of args) {
      const val = this.evaluateArg(ctx, arg)
      
      if (Array.isArray(val)) {
        values.push(...val)
      } else {
        values.push(val)
      }
    }
    
    return values
  }
  
  /**
   * 评估参数（由Evaluator调用）
   */
  evaluateArg(ctx, arg) {
    // 这个方法需要由FormulaEvaluator调用时传入
    // 这里只是占位符，实际逻辑在Evaluator中
    if (arg.isLiteral()) {
      return arg.value
    }
    
    // 如果是标识符，从上下文获取
    if (arg.type === 'Identifier') {
      return ctx.getIndicator(arg.code || arg.name)
    }
    
    // 如果是变量，从上下文获取
    if (arg.type === 'Variable') {
      return ctx.getVariable(arg.name)
    }
    
    return null
  }
  
  /**
   * 解析日期
   */
  parseDate(value) {
    if (!value) return null
    
    if (value instanceof Date) return value
    
    // 尝试解析字符串
    if (typeof value === 'string') {
      const date = new Date(value)
      if (!isNaN(date.getTime())) return date
    }
    
    // 尝试解析数字（假设是timestamp）
    if (typeof value === 'number') {
      const date = new Date(value)
      if (!isNaN(date.getTime())) return date
    }
    
    return null
  }
}

/**
 * createFunctionRegistry - 创建函数注册中心实例
 */
export function createFunctionRegistry() {
  return new FunctionRegistry()
}