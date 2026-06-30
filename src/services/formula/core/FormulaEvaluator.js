/**
 * Formula System - 公式计算引擎（Evaluator）
 * 
 * 执行AST的计算，返回计算结果
 */

import {
  DataType,
  FormulaResult,
  FormulaError,
  ErrorType,
  Severity,
  NodeType
} from './FormulaTypes.js'

import { ASTVisitor } from './FormulaAST.js'
import { EvaluationContext } from './FormulaTypes.js'

/**
 * FormulaEvaluator - 公式计算引擎
 */
export class FormulaEvaluator extends ASTVisitor {
  constructor(options = {}) {
    super()
    
    // 函数注册中心
    this.functions = options.functions || null
    
    // 指标映射（名称 -> 值）
    this.indicators = options.indicators || new Map()
    
    // 变量映射
    this.variables = options.variables || new Map()
    
    // 单元格数据
    this.cellData = options.cellData || {}
    
    // 计算结果缓存
    this.cache = new Map()
    
    // 调试模式
    this.debugMode = options.debugMode || false
    
    // 调试日志
    this.debugLog = []
  }
  
  /**
   * 计算AST
   */
  evaluate(ast, context = null) {
    // 创建计算上下文
    const evalContext = context || new EvaluationContext({
      indicators: this.indicators,
      variables: this.variables,
      functions: this.functions,
      cellData: this.cellData
    })
    
    // 清空调试日志
    this.debugLog = []
    
    const startTime = Date.now()
    
    try {
      // 访问AST并计算
      const value = this.visit(ast, evalContext)
      
      const duration = Date.now() - startTime
      
      // 记录调试日志
      if (this.debugMode) {
        this.logDebug('计算完成', {
          result: value,
          duration: `${duration}ms`,
          cacheSize: this.cache.size
        })
      }
      
      return new FormulaResult(value, [], {
        duration,
        debugLog: this.debugLog
      })
    } catch (error) {
      const duration = Date.now() - startTime
      
      // 创建错误结果
      const formulaError = new FormulaError(
        ErrorType.RUNTIME_ERROR,
        error.message,
        null,
        Severity.ERROR
      )
      
      return new FormulaResult(null, [formulaError], {
        duration,
        debugLog: this.debugLog
      })
    }
  }
  
  /**
   * 访问程序节点
   */
  visitProgram(node, ctx) {
    // 如果只有一个表达式，直接返回结果
    if (node.body.length === 1) {
      return this.visit(node.body[0], ctx)
    }
    
    // 多个表达式，返回最后一个的结果
    const results = []
    for (const child of node.body) {
      results.push(this.visit(child, ctx))
    }
    
    return results[results.length - 1]
  }
  
  /**
   * 访问数字字面量
   */
  visitNumberLiteral(node, ctx) {
    if (this.debugMode) {
      this.logDebug('数字字面量', { value: node.value })
    }
    return node.value
  }
  
  /**
   * 访问字符串字面量
   */
  visitStringLiteral(node, ctx) {
    if (this.debugMode) {
      this.logDebug('字符串字面量', { value: node.value })
    }
    return node.value
  }
  
  /**
   * 访问布尔字面量
   */
  visitBooleanLiteral(node, ctx) {
    if (this.debugMode) {
      this.logDebug('布尔字面量', { value: node.value })
    }
    return node.value
  }
  
  /**
   * 访问标识符（指标引用）
   */
  visitIdentifier(node, ctx) {
    const code = node.code || node.name
    
    // 检查缓存
    if (this.cache.has(code)) {
      const cachedValue = this.cache.get(code)
      if (this.debugMode) {
        this.logDebug('标识符（缓存）', {
          name: node.name,
          code: code,
          value: cachedValue
        })
      }
      return cachedValue
    }
    
    // 从上下文获取值
    const value = ctx.getIndicator(code)
    
    if (this.debugMode) {
      this.logDebug('标识符', {
        name: node.name,
        code: code,
        value: value
      })
    }
    
    // 缓存结果
    if (value !== undefined) {
      this.cache.set(code, value)
    }
    
    return value
  }
  
  /**
   * 访问变量
   */
  visitVariable(node, ctx) {
    const value = ctx.getVariable(node.name)
    
    if (this.debugMode) {
      this.logDebug('变量', {
        name: node.name,
        value: value
      })
    }
    
    return value
  }
  
  /**
   * 访问单元格引用
   */
  visitCellReference(node, ctx) {
    const reference = node.reference
    
    if (node.isRange) {
      // 范围引用，返回数组
      const values = this.getCellRangeValues(node, ctx)
      
      if (this.debugMode) {
        this.logDebug('单元格范围引用', {
          reference: reference,
          values: values
        })
      }
      
      return values
    } else {
      // 单个单元格引用
      const cellKey = this.getCellKey(node.column, node.row)
      const cell = ctx.cellData[cellKey]
      const value = cell?.v
      
      if (this.debugMode) {
        this.logDebug('单元格引用', {
          reference: reference,
          cellKey: cellKey,
          value: value
        })
      }
      
      return value
    }
  }
  
  /**
   * 访问二元表达式
   */
  visitBinaryExpression(node, ctx) {
    const left = this.visit(node.left, ctx)
    const right = this.visit(node.right, ctx)
    
    const operator = node.operator
    
    if (this.debugMode) {
      this.logDebug('二元表达式', {
        operator: operator,
        left: left,
        right: right
      })
    }
    
    let result
    
    switch (operator) {
      case '+':
        result = (Number(left) || 0) + (Number(right) || 0)
        break
      
      case '-':
        result = (Number(left) || 0) - (Number(right) || 0)
        break
      
      case '*':
        result = (Number(left) || 0) * (Number(right) || 0)
        break
      
      case '/':
        if (Number(right) === 0) {
          throw new Error('除零错误')
        }
        result = (Number(left) || 0) / (Number(right) || 0)
        break
      
      case '^':
        result = Math.pow(Number(left) || 0, Number(right) || 0)
        break
      
      case '%':
        result = (Number(left) || 0) % (Number(right) || 0)
        break
      
      case '=':
        result = left === right
        break
      
      case '!=':
      case '<>':
        result = left !== right
        break
      
      case '<':
        result = Number(left) < Number(right)
        break
      
      case '>':
        result = Number(left) > Number(right)
        break
      
      case '<=':
        result = Number(left) <= Number(right)
        break
      
      case '>=':
        result = Number(left) >= Number(right)
        break
      
      case 'AND':
        result = Boolean(left) && Boolean(right)
        break
      
      case 'OR':
        result = Boolean(left) || Boolean(right)
        break
      
      default:
        throw new Error(`未知的运算符: ${operator}`)
    }
    
    return result
  }
  
  /**
   * 访问一元表达式
   */
  visitUnaryExpression(node, ctx) {
    const operand = this.visit(node.operand, ctx)
    const operator = node.operator
    
    if (this.debugMode) {
      this.logDebug('一元表达式', {
        operator: operator,
        operand: operand
      })
    }
    
    let result
    
    switch (operator) {
      case '-':
        result = -(Number(operand) || 0)
        break
      
      case 'NOT':
        result = !Boolean(operand)
        break
      
      default:
        throw new Error(`未知的运算符: ${operator}`)
    }
    
    return result
  }
  
  /**
   * 访问函数调用
   */
  visitFunctionCall(node, ctx) {
    const funcName = node.name
    
    if (this.debugMode) {
      this.logDebug('函数调用开始', {
        name: funcName,
        argsCount: node.arguments.length
      })
    }
    
    // 获取函数定义
    const funcDef = this.functions?.get(funcName)
    
    if (!funcDef) {
      throw new Error(`未定义的函数: ${funcName}`)
    }
    
    // 计算参数（延迟求值）
    const evaluatedArgs = node.arguments.map(arg => {
      // 对于某些函数，不立即求值（如IF函数）
      if (funcDef.lazyEval) {
        return arg // 返回AST节点，由函数自己决定何时求值
      }
      
      return this.visit(arg, ctx)
    })
    
    if (this.debugMode) {
      this.logDebug('函数参数', {
        name: funcName,
        args: evaluatedArgs.map(arg => ({
          type: arg?.type || typeof arg,
          value: arg?.isLiteral?.() ? arg.value : arg
        }))
      })
    }
    
    // 调用函数计算
    let result
    
    try {
      // 特殊处理IF函数（延迟求值）
      if (funcName === 'IF' && funcDef.lazyEval) {
        const condition = this.visit(node.arguments[0], ctx)
        result = condition
          ? this.visit(node.arguments[1], ctx)
          : this.visit(node.arguments[2], ctx)
      } else if (funcDef.compute) {
        // 调用函数的compute方法
        result = funcDef.compute(ctx, evaluatedArgs, this)
      } else {
        throw new Error(`函数 ${funcName} 缺少计算实现`)
      }
      
      if (this.debugMode) {
        this.logDebug('函数调用结果', {
          name: funcName,
          result: result
        })
      }
    } catch (error) {
      if (this.debugMode) {
        this.logDebug('函数调用错误', {
          name: funcName,
          error: error.message
        })
      }
      throw error
    }
    
    return result
  }
  
  /**
   * 访问条件表达式
   */
  visitConditionalExpression(node, ctx) {
    const condition = this.visit(node.condition, ctx)
    
    if (this.debugMode) {
      this.logDebug('条件表达式', {
        condition: condition
      })
    }
    
    if (condition) {
      return this.visit(node.consequent, ctx)
    } else {
      return this.visit(node.alternate, ctx)
    }
  }
  
  /**
   * 访问数组表达式
   */
  visitArrayExpression(node, ctx) {
    const values = node.elements.map(el => this.visit(el, ctx))
    
    if (this.debugMode) {
      this.logDebug('数组表达式', {
        values: values
      })
    }
    
    return values
  }
  
  /**
   * 访问范围表达式
   */
  visitRangeExpression(node, ctx) {
    const start = node.start
    const end = node.end
    
    // 获取范围内的所有值
    const values = this.getCellRangeValues(start, ctx)
    
    if (this.debugMode) {
      this.logDebug('范围表达式', {
        start: start.reference,
        end: end.reference,
        values: values
      })
    }
    
    return values
  }
  
  // ==================== 辅助方法 ====================
  
  /**
   * 获取单元格范围值
   */
  getCellRangeValues(cellRef, ctx) {
    if (!cellRef.isRange) {
      return [this.visit(cellRef, ctx)]
    }
    
    const startCol = this.colToNum(cellRef.startColumn)
    const endCol = this.colToNum(cellRef.endColumn)
    const startRow = cellRef.startRow
    const endRow = cellRef.endRow
    
    const values = []
    
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const cellKey = `${row}-${col}`
        const cell = ctx.cellData[cellKey]
        if (cell && cell.v != null) {
          values.push(cell.v)
        }
      }
    }
    
    return values
  }
  
  /**
   * 列字母转数字
   */
  colToNum(col) {
    let num = 0
    for (let i = 0; i < col.length; i++) {
      num = num * 26 + (col.charCodeAt(i) - 64)
    }
    return num
  }
  
  /**
   * 数字转列字母
   */
  numToCol(num) {
    let col = ''
    while (num > 0) {
      const remainder = (num - 1) % 26
      col = String.fromCharCode(65 + remainder) + col
      num = Math.floor((num - 1) / 26)
    }
    return col
  }
  
  /**
   * 获取单元格键
   */
  getCellKey(column, row) {
    const colNum = this.colToNum(column)
    return `${row}-${colNum}`
  }
  
  /**
   * 记录调试日志
   */
  logDebug(action, data) {
    this.debugLog.push({
      action,
      data,
      timestamp: Date.now()
    })
  }
  
  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear()
  }
}

/**
 * evaluateFormula - 简单函数式接口
 */
export function evaluateFormula(ast, options = {}) {
  const evaluator = new FormulaEvaluator(options)
  return evaluator.evaluate(ast)
}