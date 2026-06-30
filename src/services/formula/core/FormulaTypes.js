/**
 * Formula System - 类型定义
 * 
 * 公式系统的核心类型定义，包括AST节点类型、Token类型、错误类型等
 */

// ==================== Token 类型 ====================

export const TokenType = {
  // 字面量
  NUMBER: 'NUMBER',           // 数字：123, 45.67
  STRING: 'STRING',           // 字符串："hello", 'world'
  BOOLEAN: 'BOOLEAN',         // 布尔：true, false
  
  // 标识符
  IDENTIFIER: 'IDENTIFIER',   // 标识符：revenue, cost（友好名称）
  VARIABLE: 'VARIABLE',       // 变量：$CurrentYear, $User
  CELL_REF: 'CELL_REF',      // 单元格引用：A1, B2:C3
  
  // 运算符
  PLUS: 'PLUS',               // +
  MINUS: 'MINUS',             // -
  MULTIPLY: 'MULTIPLY',       // *
  DIVIDE: 'DIVIDE',           // /
  POWER: 'POWER',             // ^
  PERCENT: 'PERCENT',         // %
  
  // 比较运算符
  EQ: 'EQ',                   // =
  NE: 'NE',                   // <> 或 !=
  LT: 'LT',                   // <
  GT: 'GT',                   // >
  LE: 'LE',                   // <=
  GE: 'GE',                   // >=
  
  // 逻辑运算符
  AND: 'AND',                 // AND
  OR: 'OR',                   // OR
  NOT: 'NOT',                 // NOT
  
  // 括号
  LPAREN: 'LPAREN',           // (
  RPAREN: 'RPAREN',           // )
  LBRACKET: 'LBRACKET',       // [
  RBRACKET: 'RBRACKET',       // ]
  LBRACE: 'LBRACE',           // {
  RBRACE: 'RBRACE',           // }
  
  // 分隔符
  COMMA: 'COMMA',             // ,
  COLON: 'COLON',             // :
  SEMICOLON: 'SEMICOLON',     // ;
  DOT: 'DOT',                 // .
  
  // 函数
  FUNCTION: 'FUNCTION',       // 函数名：SUM, IF, YOY
  
  // 特殊
  EOF: 'EOF',                 // 结束标记
  UNKNOWN: 'UNKNOWN'          // 未知字符
}

// ==================== AST 节点类型 ====================

export const NodeType = {
  // 字面量
  NumberLiteral: 'NumberLiteral',
  StringLiteral: 'StringLiteral',
  BooleanLiteral: 'BooleanLiteral',
  
  // 标识符
  Identifier: 'Identifier',     // 营业收入
  Variable: 'Variable',         // $CurrentYear
  CellReference: 'CellReference', // A1, B2:C3
  
  // 运算符
  BinaryExpression: 'BinaryExpression',     // 二元运算：a + b
  UnaryExpression: 'UnaryExpression',       // 一元运算：-a, NOT a
  
  // 函数
  FunctionCall: 'FunctionCall',             // 函数调用：SUM(a, b)
  
  // 条件
  ConditionalExpression: 'ConditionalExpression', // IF条件：IF(cond, t, f)
  
  // 数组/范围
  ArrayExpression: 'ArrayExpression',       // 数组：[1, 2, 3]
  RangeExpression: 'RangeExpression',       // 范围：A1:A10
  
  // 程序
  Program: 'Program'            // 根节点
}

// ==================== 数据类型 ====================

export const DataType = {
  NUMBER: 'number',
  STRING: 'string',
  BOOLEAN: 'boolean',
  DATE: 'date',
  ARRAY: 'array',
  ANY: 'any',
  VOID: 'void',
  ERROR: 'error'
}

// ==================== 公式分类 ====================

export const FormulaCategory = {
  BASIC: 'basic',              // 基础公式
  AGGREGATE: 'aggregate',      // 聚合公式
  CONDITIONAL: 'conditional',  // 条件公式
  TEXT: 'text',                // 文本公式
  DATE: 'date',                // 日期公式
  TIME_ANALYSIS: 'time_analysis', // 时间分析
  BUSINESS: 'business',        // 业务公式
  WINDOW: 'window',            // 窗口函数
  CUSTOM: 'custom'            // 自定义公式
}

// ==================== 公式状态 ====================

export const FormulaStatus = {
  DRAFT: 'draft',              // 草稿
  PUBLISHED: 'published',       // 已发布
  DEPRECATED: 'deprecated',    // 已废弃
  ARCHIVED: 'archived'         // 已归档
}

// ==================== 错误类型 ====================

export const ErrorType = {
  // 词法错误
  LEXER_ERROR: 'LEXER_ERROR',
  
  // 语法错误
  SYNTAX_ERROR: 'SYNTAX_ERROR',
  UNEXPECTED_TOKEN: 'UNEXPECTED_TOKEN',
  MISSING_TOKEN: 'MISSING_TOKEN',
  
  // 语义错误
  UNDEFINED_VARIABLE: 'UNDEFINED_VARIABLE',
  UNDEFINED_FUNCTION: 'UNDEFINED_FUNCTION',
  TYPE_MISMATCH: 'TYPE_MISMATCH',
  ARGUMENT_MISMATCH: 'ARGUMENT_MISMATCH',
  
  // 依赖错误
  CIRCULAR_DEPENDENCY: 'CIRCULAR_DEPENDENCY',
  MISSING_DEPENDENCY: 'MISSING_DEPENDENCY',
  
  // 运行时错误
  DIVISION_BY_ZERO: 'DIVISION_BY_ZERO',
  NULL_VALUE: 'NULL_VALUE',
  OVERFLOW: 'OVERFLOW',
  RUNTIME_ERROR: 'RUNTIME_ERROR'
}

// ==================== 严重级别 ====================

export const Severity = {
  ERROR: 'error',     // 错误，阻止计算
  WARNING: 'warning', // 警告，可能有问题
  INFO: 'info',       // 信息，提示性
  HINT: 'hint'        // 建议，优化提示
}

// ==================== 类定义 ====================

/**
 * Token - 词法单元
 */
export class Token {
  constructor(type, value, position = { line: 1, column: 0 }, raw = null) {
    this.type = type
    this.value = value
    this.position = position
    this.raw = raw || String(value)
  }
  
  toString() {
    return `Token(${this.type}, ${this.value})`
  }
}

/**
 * Location - 源码位置
 */
export class Location {
  constructor(start = { line: 1, column: 0 }, end = null, source = null) {
    this.start = start
    this.end = end || start
    this.source = source
  }
  
  toString() {
    return `${this.start.line}:${this.start.column}`
  }
}

/**
 * FormulaError - 公式错误
 */
export class FormulaError {
  constructor(type, message, location = null, severity = Severity.ERROR, suggestions = []) {
    this.type = type
    this.message = message
    this.location = location
    this.severity = severity
    this.suggestions = suggestions
    this.timestamp = new Date()
  }
  
  toString() {
    const loc = this.location ? ` at ${this.location}` : ''
    return `[${this.severity.toUpperCase()}] ${this.type}: ${this.message}${loc}`
  }
}

/**
 * FormulaDefinition - 公式定义
 */
export class FormulaDefinition {
  constructor(options = {}) {
    this.id = options.id || `formula_${Date.now()}`
    this.name = options.name || ''                    // 公式名称：利润率
    this.code = options.code || ''                    // 公式编码：profitRate
    this.category = options.category || FormulaCategory.BASIC
    this.description = options.description || ''
    this.expression = options.expression || ''        // 显示表达式：([营业收入]-[营业成本])/[营业收入]*100
    this.internalExpression = options.internalExpression || '' // 内部表达式：(${revenue}-${cost})/${revenue}*100
    this.resultType = options.resultType || DataType.NUMBER
    this.displayFormat = options.displayFormat || '#,##0.00'
    this.precision = options.precision || 2
    this.dependencies = options.dependencies || []    // 依赖的指标ID
    this.variables = options.variables || []          // 使用的变量
    this.functions = options.functions || []         // 使用的函数
    this.metadata = options.metadata || {}           // 元数据
    this.status = options.status || FormulaStatus.DRAFT
    this.version = options.version || 1
    this.createdBy = options.createdBy || null
    this.createdAt = options.createdAt || new Date()
    this.updatedAt = options.updatedAt || new Date()
  }
  
  /**
   * 从JSON创建公式定义
   */
  static fromJSON(json) {
    return new FormulaDefinition(json)
  }
  
  /**
   * 转换为JSON
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      code: this.code,
      category: this.category,
      description: this.description,
      expression: this.expression,
      internalExpression: this.internalExpression,
      resultType: this.resultType,
      displayFormat: this.displayFormat,
      precision: this.precision,
      dependencies: this.dependencies,
      variables: this.variables,
      functions: this.functions,
      metadata: this.metadata,
      status: this.status,
      version: this.version,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
}

/**
 * IndicatorDefinition - 指标定义
 */
export class IndicatorDefinition {
  constructor(options = {}) {
    this.id = options.id || ''
    this.code = options.code || ''              // 编码：revenue
    this.name = options.name || ''              // 名称：营业收入
    this.internalCode = options.internalCode || '' // 内部编码：row_mqxxxxx
    this.type = options.type || DataType.NUMBER
    this.category = options.category || 'basic' // basic, calculated, public, dimension, parameter
    this.description = options.description || ''
    this.unit = options.unit || ''              // 单位：万元
    this.aggregation = options.aggregation || null // 聚合方式：sum, avg, max, min
    this.format = options.format || '#,##0.00'
    this.defaultValue = options.defaultValue !== undefined ? options.defaultValue : null
    this.metadata = options.metadata || {}
    this.createdAt = options.createdAt || new Date()
    this.updatedAt = options.updatedAt || new Date()
  }
  
  static fromJSON(json) {
    return new IndicatorDefinition(json)
  }
  
  toJSON() {
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      internalCode: this.internalCode,
      type: this.type,
      category: this.category,
      description: this.description,
      unit: this.unit,
      aggregation: this.aggregation,
      format: this.format,
      defaultValue: this.defaultValue,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
}

/**
 * EvaluationContext - 计算上下文
 */
export class EvaluationContext {
  constructor(options = {}) {
    this.indicators = new Map(options.indicators || [])  // 指标值映射
    this.variables = new Map(options.variables || [])    // 变量映射
    this.functions = options.functions || null          // 函数注册中心
    this.cellData = options.cellData || {}              // 单元格数据
    this.currentRow = options.currentRow || 0            // 当前行
    this.currentCol = options.currentCol || 0            // 当前列
    this.currentSheet = options.currentSheet || null    // 当前Sheet
    this.parentContext = options.parentContext || null  // 父上下文
    this.metadata = options.metadata || {}              // 其他元数据
  }
  
  /**
   * 获取指标值
   */
  getIndicator(code) {
    // 先查当前上下文
    if (this.indicators.has(code)) {
      return this.indicators.get(code)
    }
    // 再查父上下文
    if (this.parentContext) {
      return this.parentContext.getIndicator(code)
    }
    return undefined
  }
  
  /**
   * 设置指标值
   */
  setIndicator(code, value) {
    this.indicators.set(code, value)
  }
  
  /**
   * 获取变量值
   */
  getVariable(name) {
    if (this.variables.has(name)) {
      return this.variables.get(name)
    }
    if (this.parentContext) {
      return this.parentContext.getVariable(name)
    }
    return undefined
  }
  
  /**
   * 设置变量值
   */
  setVariable(name, value) {
    this.variables.set(name, value)
  }
  
  /**
   * 创建子上下文
   */
  createChild() {
    return new EvaluationContext({
      parentContext: this,
      functions: this.functions,
      cellData: this.cellData,
      currentRow: this.currentRow,
      currentCol: this.currentCol,
      currentSheet: this.currentSheet
    })
  }
}

/**
 * FormulaResult - 公式计算结果
 */
export class FormulaResult {
  constructor(value, errors = [], metadata = {}) {
    this.value = value
    this.errors = errors
    this.metadata = metadata
    this.evaluatedAt = new Date()
    this.duration = metadata.duration || 0
  }
  
  get hasError() {
    return this.errors.length > 0
  }
  
  get isError() {
    return this.errors.some(e => e.severity === Severity.ERROR)
  }
  
  get errorMessages() {
    return this.errors.map(e => e.message).join('; ')
  }
}