/**
 * Formula Service - Simplified Version
 * 
 * 提供公式管理的基本服务
 */

import { FormulaLexer } from '../core/FormulaLexer.js'
import { FormulaParser } from '../core/FormulaParser.js'
import { FormulaValidator } from '../core/FormulaValidator.js'
import { FormulaEvaluator } from '../core/FormulaEvaluator.js'
import { FunctionRegistry, createFunctionRegistry } from '../core/FunctionRegistry.js'
import { DataType } from '../core/FormulaTypes.js'

/**
 * FormulaService - 公式服务
 */
export class FormulaService {
  constructor(options = {}) {
    // 函数注册中心
    this.functionRegistry = createFunctionRegistry()

    // 指标存储
    this.indicators = new Map()

    // 变量存储
    this.variables = new Map()

    // 公式存储
    this.formulas = new Map()

    // 初始化默认变量
    this.initDefaultVariables()

    console.log('FormulaService initialized successfully')
  }

  /**
   * 初始化默认变量
   */
  initDefaultVariables() {
    const now = new Date()

    this.registerVariables([
      { name: '$CurrentYear', type: DataType.NUMBER, value: now.getFullYear(), description: '当前年份' },
      { name: '$CurrentMonth', type: DataType.NUMBER, value: now.getMonth() + 1, description: '当前月份' },
      { name: '$CurrentQuarter', type: DataType.NUMBER, value: Math.ceil((now.getMonth() + 1) / 3), description: '当前季度' },
      { name: '$Today', type: DataType.DATE, value: now, description: '当前日期' },
      { name: '$Now', type: DataType.DATE, value: now, description: '当前时间' },
      { name: '$User', type: DataType.STRING, value: 'CurrentUser', description: '当前用户' },
      { name: '$Dept', type: DataType.STRING, value: 'CurrentDept', description: '当前部门' },
      { name: '$Org', type: DataType.STRING, value: 'CurrentOrg', description: '当前组织' }
    ])
  }

  // ==================== 指标管理 ====================

  /**
   * 注册指标
   */
  registerIndicator(indicator) {
    if (!indicator || !indicator.id) {
      console.warn('Invalid indicator:', indicator)
      return this
    }

    this.indicators.set(indicator.id, indicator)
    if (indicator.code) {
      this.indicators.set(indicator.code, indicator)
    }
    // 额外按 name 索引，便于验证器通过 name 查找到指标（行/列维度常用）
    if (indicator.name) {
      this.indicators.set(indicator.name, indicator)
    }
    return this
  }

  /**
   * 批量注册指标
   */
  registerIndicators(indicators) {
    if (!Array.isArray(indicators)) {
      console.warn('Indicators must be an array:', indicators)
      return this
    }

    for (const indicator of indicators) {
      this.registerIndicator(indicator)
    }
    return this
  }

  /**
   * 获取指标
   */
  getIndicator(idOrCode) {
    return this.indicators.get(idOrCode)
  }

  /**
   * 获取所有指标（去重）
   */
  getAllIndicators() {
    const seen = new Set()
    return Array.from(this.indicators.values()).filter(i => {
      if (seen.has(i.id)) return false
      seen.add(i.id)
      return true
    })
  }

  /**
   * 搜索指标（按名称或编码匹配）
   */
  searchIndicators(keyword) {
    if (!keyword) return this.getAllIndicators()
    const lower = keyword.toLowerCase()
    return this.getAllIndicators().filter(i =>
      (i.name && i.name.toLowerCase().includes(lower)) ||
      (i.code && i.code.toLowerCase().includes(lower))
    )
  }

  /**
   * 清除指标
   */
  clearIndicators() {
    this.indicators.clear()
    return this
  }

  // ==================== 变量管理 ====================

  /**
   * 注册变量
   */
  registerVariable(variable) {
    if (!variable || !variable.name) {
      console.warn('Invalid variable:', variable)
      return this
    }

    this.variables.set(variable.name, variable)
    return this
  }

  /**
   * 批量注册变量
   */
  registerVariables(variables) {
    if (!Array.isArray(variables)) {
      console.warn('Variables must be an array:', variables)
      return this
    }

    for (const variable of variables) {
      this.registerVariable(variable)
    }
    return this
  }

  /**
   * 获取变量
   */
  getVariable(name) {
    return this.variables.get(name)
  }

  /**
   * 获取所有变量
   */
  getAllVariables() {
    return Array.from(this.variables.values())
  }

  // ==================== 函数管理 ====================

  /**
   * 获取所有函数
   */
  getAllFunctions() {
    return this.functionRegistry.getAll()
  }

  /**
   * 获取函数
   */
  getFunction(name) {
    return this.functionRegistry.get(name)
  }

  /**
   * 获取函数分类
   */
  getFunctionCategories() {
    return this.functionRegistry.getCategories()
  }

  /**
   * 按分类获取函数
   */
  getFunctionsByCategory(category) {
    return this.functionRegistry.getByCategory(category)
  }

  // ==================== 公式管理 ====================

  /**
   * 创建公式
   */
  createFormula(formulaData) {
    if (!formulaData) {
      return { success: false, formula: null, errors: ['公式数据无效'] }
    }

    const formula = {
      id: formulaData.id || this.generateFormulaId(),
      name: formulaData.name || '未命名公式',
      code: formulaData.code || '',
      expression: formulaData.expression || '',
      category: formulaData.category || 'basic',
      description: formulaData.description || '',
      resultType: formulaData.resultType || 'number',
      displayFormat: formulaData.displayFormat,
      precision: formulaData.precision || 2,
      status: formulaData.status || 'draft',
      version: formulaData.version || 1,
      dependencies: formulaData.dependencies || [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.formulas.set(formula.id, formula)
    console.log('Formula created:', formula.id)

    return { success: true, formula }
  }

  /**
   * 更新公式
   */
  updateFormula(formulaId, updateData) {
    const formula = this.formulas.get(formulaId)
    if (!formula) {
      return { success: false, errors: ['公式不存在'] }
    }

    Object.assign(formula, updateData, { updatedAt: new Date() })
    console.log('Formula updated:', formulaId)

    return { success: true, formula }
  }

  /**
   * 删除公式
   */
  deleteFormula(formulaId) {
    const deleted = this.formulas.delete(formulaId)
    return { success: deleted }
  }

  /**
   * 获取公式
   */
  getFormula(formulaId) {
    return this.formulas.get(formulaId)
  }

  /**
   * 获取所有公式
   */
  getAllFormulas() {
    return Array.from(this.formulas.values())
  }

  /**
   * 生成公式ID
   */
  generateFormulaId() {
    return `formula_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // ==================== 公式验证和计算 ====================

  /**
   * 验证公式
   */
  validate(expression) {
    return this.validateFormula(expression)
  }

  /**
   * 验证公式（主方法）
   */
  validateFormula(expression) {
    try {
      // 词法分析（传入指标查找函数，用于识别纯数字行/列维度名）
      const self = this
      const lexer = new FormulaLexer(expression, {
        indicatorLookup: (name) => self.indicators.get(name)
      })
      const { tokens, errors: lexerErrors } = lexer.tokenize()

      if (lexerErrors.length > 0) {
        return {
          valid: false,
          errors: lexerErrors,
          warnings: [],
          dependencies: [],
          variables: [],
          functions: []
        }
      }

      // 语法解析
      const parser = new FormulaParser(tokens, expression)
      const { ast, errors: parserErrors } = parser.parse()

      if (parserErrors.length > 0) {
        return {
          valid: false,
          errors: parserErrors,
          warnings: [],
          ast,
          dependencies: [],
          variables: [],
          functions: []
        }
      }

      // 语义校验
      const validator = new FormulaValidator({
        indicators: this.indicators,
        variables: this.variables,
        functions: this.functionRegistry.functions,
        formulas: this.formulas
      })

      const validation = validator.validate(ast)

      return {
        valid: validation.valid,
        errors: validation.errors || [],
        warnings: validation.warnings || [],
        ast,
        dependencies: validation.dependencies || [],
        variables: validation.variables || [],
        functions: validation.functions || []
      }
    } catch (error) {
      console.error('Validation error:', error)
      return {
        valid: false,
        errors: [{ message: error.message }],
        warnings: [],
        dependencies: [],
        variables: [],
        functions: []
      }
    }
  }

  /**
   * 计算公式
   */
  evaluate(expression, context = {}) {
    try {
      // 验证公式
      const validation = this.validate(expression)

      if (!validation.valid) {
        return {
          success: false,
          value: null,
          errors: validation.errors
        }
      }

      // 创建计算器
      const evaluator = new FormulaEvaluator({
        functions: this.functionRegistry,
        indicators: this.indicators,
        variables: this.variables,
        cellData: context.cellData || {},
        debugMode: false
      })

      // 执行计算
      const result = evaluator.evaluate(validation.ast, context)

      return {
        success: true,
        value: result.value,
        errors: result.errors || []
      }
    } catch (error) {
      console.error('Evaluation error:', error)
      return {
        success: false,
        value: null,
        errors: [{ message: error.message }]
      }
    }
  }

  /**
   * 计算公式（别名方法，保持向后兼容）
   */
  evaluateFormula(expression, context = {}) {
    return this.evaluate(expression, context)
  }

  // ==================== 辅助方法 ====================

  /**
   * 从模板提取指标
   */
  extractIndicatorsFromTemplate(template) {
    if (!template) return []

    const indicators = []

    function flattenTree(nodes, type, category) {
      if (!nodes || !nodes.length) return
      for (const n of nodes) {
        indicators.push({
          id: n.id || n.code,
          name: n.label || n.name,
          code: n.code || n.id,
          type: type,
          category: category,
          isSummary: n.isSummary || false
        })
        if (n.children?.length) {
          flattenTree(n.children, type, category)
        }
      }
    }

    flattenTree(template.rowTree, 'row', 'dimension')
    flattenTree(template.columnTree, 'col', 'dimension')

    if (template.metrics && template.metrics.length) {
      for (const m of template.metrics) {
        indicators.push({
          id: m.id || m.code,
          name: m.label || m.name,
          code: m.code || m.id,
          type: m.type || 'metric',
          category: 'basic'
        })
      }
    }

    return indicators
  }

  /**
   * 获取公式历史
   */
  getFormulaHistory(formulaId) {
    // 简化实现：返回空数组
    return []
  }
}

/**
 * createFormulaService - 创建公式服务实例
 */
export function createFormulaService(options = {}) {
  try {
    const service = new FormulaService(options)
    console.log('FormulaService created successfully')
    return service
  } catch (error) {
    console.error('Failed to create FormulaService:', error)
    throw error
  }
}