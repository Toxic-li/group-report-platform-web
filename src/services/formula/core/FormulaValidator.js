/**
 * Formula System - 公式校验器（Validator）
 * 
 * 对AST进行语义分析，检查：
 * - 未定义的变量/指标
 * - 未定义的函数
 * - 参数数量错误
 * - 类型不匹配
 * - 循环依赖
 * - 除零风险
 * - 空值风险
 */

import {
  FormulaError,
  ErrorType,
  Severity,
  DataType,
  NodeType
} from './FormulaTypes.js'

import { ASTVisitor } from './FormulaAST.js'

/**
 * FormulaValidator - 公式校验器
 */
export class FormulaValidator extends ASTVisitor {
  constructor(options = {}) {
    super()
    
    // 指标注册表
    this.indicators = options.indicators || new Map()
    
    // 变量注册表
    this.variables = options.variables || new Map()
    
    // 函数注册表
    this.functions = options.functions || new Map()
    
    // 公式注册表（用于循环依赖检测）
    this.formulas = options.formulas || new Map()
    
    // 错误列表
    this.errors = []
    
    // 警告列表
    this.warnings = []
    
    // 当前公式ID（用于循环依赖检测）
    this.currentFormulaId = options.currentFormulaId || null
    
    // 依赖的指标列表
    this.dependencies = new Set()
    
    // 使用的变量列表
    this.usedVariables = new Set()
    
    // 使用的函数列表
    this.usedFunctions = new Set()
  }
  
  /**
   * 校验AST
   */
  validate(ast) {
    this.errors = []
    this.warnings = []
    this.dependencies.clear()
    this.usedVariables.clear()
    this.usedFunctions.clear()
    
    // 访问AST
    this.visit(ast)
    
    // 检查循环依赖
    this.checkCircularDependency()
    
    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      dependencies: [...this.dependencies],
      variables: [...this.usedVariables],
      functions: [...this.usedFunctions]
    }
  }
  
  /**
   * 访问程序节点
   */
  visitProgram(node) {
    for (const child of node.body) {
      this.visit(child)
    }
  }
  
  /**
   * 访问数字字面量
   */
  visitNumberLiteral(node) {
    return DataType.NUMBER
  }
  
  /**
   * 访问字符串字面量
   */
  visitStringLiteral(node) {
    return DataType.STRING
  }
  
  /**
   * 访问布尔字面量
   */
  visitBooleanLiteral(node) {
    return DataType.BOOLEAN
  }
  
  /**
   * 访问标识符
   */
  visitIdentifier(node) {
    // 检查指标是否定义
    if (!this.indicators.has(node.name) && !this.indicators.has(node.code)) {
      this.addError(
        ErrorType.UNDEFINED_VARIABLE,
        `未定义的指标: '${node.name}'`,
        node.location,
        Severity.ERROR,
        [
          '请检查指标名称是否正确',
          '请确认该指标已在指标库中定义'
        ]
      )
    } else {
      // 记录依赖
      const indicator = this.indicators.get(node.name) || this.indicators.get(node.code)
      if (indicator) {
        node.code = indicator.code
        node.dataType = indicator.type
        this.dependencies.add(indicator.id || indicator.code)
      }
    }
    
    return node.dataType
  }
  
  /**
   * 访问变量
   */
  visitVariable(node) {
    // 检查变量是否定义
    if (!this.variables.has(node.name)) {
      this.addError(
        ErrorType.UNDEFINED_VARIABLE,
        `未定义的变量: '${node.name}'`,
        node.location,
        Severity.ERROR,
        [
          '请检查变量名称是否正确',
          '可用变量: $CurrentYear, $CurrentMonth, $Today, $User, $Dept, $Org'
        ]
      )
    } else {
      // 记录使用的变量
      const variable = this.variables.get(node.name)
      node.dataType = variable.type
      this.usedVariables.add(node.name)
    }
    
    return node.dataType
  }
  
  /**
   * 访问单元格引用
   */
  visitCellReference(node) {
    // 单元格引用通常不需要额外校验
    return DataType.ANY
  }
  
  /**
   * 访问二元表达式
   */
  visitBinaryExpression(node) {
    const leftType = this.visit(node.left)
    const rightType = this.visit(node.right)
    
    // 检查运算符类型匹配
    const operator = node.operator
    
    // 数值运算符
    if (['+', '-', '*', '/', '^', '%'].includes(operator)) {
      if (!this.isNumericType(leftType) || !this.isNumericType(rightType)) {
        this.addError(
          ErrorType.TYPE_MISMATCH,
          `运算符 '${operator}' 要求数值类型，但得到 ${leftType} 和 ${rightType}`,
          node.location,
          Severity.ERROR,
          [
            '请确保两侧都是数值类型',
            '如需字符串拼接，请使用 CONCAT() 函数'
          ]
        )
      }
      
      // 检查除零风险
      if (operator === '/' && node.right.isLiteral() && node.right.value === 0) {
        this.addError(
          ErrorType.DIVISION_BY_ZERO,
          '除零风险：除数为零',
          node.location,
          Severity.WARNING,
          [
            '请检查除数是否可能为零',
            '建议使用 IF() 函数处理除零情况'
          ]
        )
      }
      
      return DataType.NUMBER
    }
    
    // 比较运算符
    if (['=', '!=', '<>', '<', '>', '<=', '>='].includes(operator)) {
      // 类型应该兼容
      if (leftType !== rightType && leftType !== DataType.ANY && rightType !== DataType.ANY) {
        this.addWarning(
          ErrorType.TYPE_MISMATCH,
          `比较运算符 '${operator}'两侧类型不一致：${leftType} vs ${rightType}`,
          node.location,
          Severity.WARNING,
          ['可能导致比较结果不符合预期']
        )
      }
      
      return DataType.BOOLEAN
    }
    
    // 逻辑运算符
    if (operator === 'AND' || operator === 'OR') {
      if (!this.isBooleanType(leftType) || !this.isBooleanType(rightType)) {
        this.addError(
          ErrorType.TYPE_MISMATCH,
          `逻辑运算符 '${operator}' 要求布尔类型`,
          node.location,
          Severity.ERROR,
          [
            '请使用比较运算符生成布尔值',
            '如：a > 0, b <= 100'
          ]
        )
      }
      
      return DataType.BOOLEAN
    }
    
    return DataType.ANY
  }
  
  /**
   * 访问一元表达式
   */
  visitUnaryExpression(node) {
    const operandType = this.visit(node.operand)
    
    if (node.operator === '-') {
      if (!this.isNumericType(operandType)) {
        this.addError(
          ErrorType.TYPE_MISMATCH,
          '负号运算符要求数值类型',
          node.location,
          Severity.ERROR,
          ['请确保操作数是数值类型']
        )
      }
      return DataType.NUMBER
    }
    
    if (node.operator === 'NOT') {
      if (!this.isBooleanType(operandType)) {
        this.addError(
          ErrorType.TYPE_MISMATCH,
          'NOT运算符要求布尔类型',
          node.location,
          Severity.ERROR,
          [
            '请使用比较运算符生成布尔值',
            '如：NOT(a > 0)'
          ]
        )
      }
      return DataType.BOOLEAN
    }
    
    return DataType.ANY
  }
  
  /**
   * 访问函数调用
   */
  visitFunctionCall(node) {
    const funcName = node.name
    
    // 记录使用的函数
    this.usedFunctions.add(funcName)
    
    // 检查函数是否定义
    if (!this.functions.has(funcName)) {
      this.addError(
        ErrorType.UNDEFINED_FUNCTION,
        `未定义的函数: '${funcName}'`,
        node.location,
        Severity.ERROR,
        [
          '请检查函数名称是否正确',
          '可用函数：SUM, AVG, MAX, MIN, COUNT, IF, ROUND 等'
        ]
      )
      return DataType.ANY
    }
    
    // 获取函数定义
    const funcDef = this.functions.get(funcName)
    node.functionInfo = funcDef
    
    // 校验参数数量
    const argCount = node.arguments.length
    const minArgs = funcDef.minArgs || 0
    const maxArgs = funcDef.maxArgs || Infinity
    
    if (argCount < minArgs) {
      this.addError(
        ErrorType.ARGUMENT_MISMATCH,
        `函数 ${funcName} 至少需要 ${minArgs} 个参数，但提供了 ${argCount} 个`,
        node.location,
        Severity.ERROR,
        [
          `函数签名：${funcDef.signature}`,
          `示例：${funcDef.examples?.[0] || ''}`
        ]
      )
    }
    
    if (argCount > maxArgs) {
      this.addError(
        ErrorType.ARGUMENT_MISMATCH,
        `函数 ${funcName} 最多接受 ${maxArgs} 个参数，但提供了 ${argCount} 个`,
        node.location,
        Severity.ERROR,
        [
          `函数签名：${funcDef.signature}`,
          `示例：${funcDef.examples?.[0] || ''}`
        ]
      )
    }
    
    // 校验参数类型
    if (funcDef.params && funcDef.params.length > 0) {
      for (let i = 0; i < node.arguments.length && i < funcDef.params.length; i++) {
        const argType = this.visit(node.arguments[i])
        const paramDef = funcDef.params[i]
        
        if (paramDef.type && !this.isTypeMatch(argType, paramDef.type)) {
          this.addError(
            ErrorType.TYPE_MISMATCH,
            `函数 ${funcName} 的第 ${i + 1} 个参数 '${paramDef.name}' 要求类型 ${paramDef.type}，但提供了 ${argType}`,
            node.arguments[i].location,
            Severity.ERROR,
            [
              `参数说明：${paramDef.description}`,
              `期望类型：${paramDef.type}`
            ]
          )
        }
      }
    }
    
    // 返回函数返回类型
    return funcDef.returnType || DataType.ANY
  }
  
  /**
   * 访问条件表达式
   */
  visitConditionalExpression(node) {
    const conditionType = this.visit(node.condition)
    const consequentType = this.visit(node.consequent)
    const alternateType = this.visit(node.alternate)
    
    // 检查条件是否为布尔类型
    if (!this.isBooleanType(conditionType)) {
      this.addError(
        ErrorType.TYPE_MISMATCH,
        'IF条件的第一个参数必须是布尔类型',
        node.condition.location,
        Severity.ERROR,
        [
          '请使用比较运算符生成布尔值',
          '如：a > 0, b <= 100'
        ]
      )
    }
    
    // 检查真假分支类型是否一致
    if (consequentType !== alternateType && 
        consequentType !== DataType.ANY && 
        alternateType !== DataType.ANY) {
      this.addWarning(
        ErrorType.TYPE_MISMATCH,
        `IF条件的真假分支类型不一致：${consequentType} vs ${alternateType}`,
        node.location,
        Severity.WARNING,
        ['可能导致结果类型不确定']
      )
    }
    
    return consequentType || alternateType || DataType.ANY
  }
  
  /**
   * 访问数组表达式
   */
  visitArrayExpression(node) {
    const types = node.elements.map(el => this.visit(el))
    
    // 检查数组元素类型是否一致
    const firstType = types[0]
    for (let i = 1; i < types.length; i++) {
      if (types[i] !== firstType && types[i] !== DataType.ANY) {
        this.addWarning(
          ErrorType.TYPE_MISMATCH,
          `数组元素类型不一致：第1个元素是 ${firstType}，第${i + 1}个元素是 ${types[i]}`,
          node.elements[i].location,
          Severity.WARNING,
          ['数组元素应保持类型一致']
        )
      }
    }
    
    return DataType.ARRAY
  }
  
  /**
   * 访问范围表达式
   */
  visitRangeExpression(node) {
    this.visit(node.start)
    this.visit(node.end)
    
    return DataType.ARRAY
  }
  
  // ==================== 辅助方法 ====================
  
  /**
   * 添加错误
   */
  addError(type, message, location, severity = Severity.ERROR, suggestions = []) {
    this.errors.push(new FormulaError(type, message, location, severity, suggestions))
  }
  
  /**
   * 添加警告
   */
  addWarning(type, message, location, severity = Severity.WARNING, suggestions = []) {
    this.warnings.push(new FormulaError(type, message, location, severity, suggestions))
  }
  
  /**
   * 是否是数值类型
   */
  isNumericType(type) {
    return type === DataType.NUMBER || type === DataType.ANY
  }
  
  /**
   * 是否是布尔类型
   */
  isBooleanType(type) {
    return type === DataType.BOOLEAN || type === DataType.ANY
  }
  
  /**
   * 是否是字符串类型
   */
  isStringType(type) {
    return type === DataType.STRING || type === DataType.ANY
  }
  
  /**
   * 类型是否匹配
   */
  isTypeMatch(actualType, expectedType) {
    if (expectedType === DataType.ANY) return true
    if (actualType === DataType.ANY) return true
    return actualType === expectedType
  }
  
  /**
   * 检查循环依赖
   */
  checkCircularDependency() {
    if (!this.currentFormulaId) return
    
    // 检查依赖的公式是否引用了当前公式
    for (const depId of this.dependencies) {
      const depFormula = this.formulas.get(depId)
      if (depFormula && depFormula.dependencies) {
        if (depFormula.dependencies.includes(this.currentFormulaId)) {
          this.addError(
            ErrorType.CIRCULAR_DEPENDENCY,
            `循环依赖：公式 '${this.currentFormulaId}' 和 '${depId}' 相互引用`,
            null,
            Severity.ERROR,
            [
              '请检查公式依赖关系',
              '避免公式之间相互引用'
            ]
          )
        }
      }
    }
  }
}

/**
 * validateFormula - 简单函数式接口
 */
export function validateFormula(ast, options = {}) {
  const validator = new FormulaValidator(options)
  return validator.validate(ast)
}