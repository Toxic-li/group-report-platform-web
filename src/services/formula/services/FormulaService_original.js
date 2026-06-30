/**
 * Formula System - Formula Service（公式服务层）
 * 
 * 封装公式管理的业务逻辑，提供统一的API：
 * - 公式CRUD操作
 * - 公式编译、验证、计算
 * - 指标管理
 * - 依赖分析
 * - 版本管理
 * - 公式发布
 */

import { createFormulaEngine, FormulaDefinition, IndicatorDefinition } from '../core/index.js'
import { FormulaStatus, FormulaCategory, DataType, Severity } from '../core/FormulaTypes.js'

/**
 * FormulaService - 公式服务
 */
export class FormulaService {
  constructor(options = {}) {
    // 创建公式引擎实例
    this.engine = createFormulaEngine(options.engineOptions || {})
    
    // 公式存储（内存 + 可选的持久化）
    this.formulas = new Map()
    
    // 指标存储
    this.indicators = new Map()
    
    // 变量存储
    this.variables = new Map()
    
    // 公式历史版本
    this.history = new Map()
    
    // 配置
    this.config = {
      enableCache: true,
      enableHistory: true,
      autoValidate: true,
      autoPublish: false,
      persistence: options.persistence || null // 持久化适配器
    }
    
    // 初始化内置变量
    this.initDefaultVariables()
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
  
  // ==================== 公式管理 ====================
  
  /**
   * 创建公式
   */
  async createFormula(formulaData) {
    // 构建FormulaDefinition
    const formula = new FormulaDefinition({
      ...formulaData,
      id: formulaData.id || this.generateFormulaId(),
      status: FormulaStatus.DRAFT,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    // 自动编译和验证
    if (this.config.autoValidate && formula.expression) {
      const validation = this.validateFormula(formula.expression)
      
      if (!validation.valid) {
        return {
          success: false,
          formula: null,
          errors: validation.errors,
          message: '公式验证失败'
        }
      }
      
      // 自动填充依赖信息
      formula.dependencies = validation.dependencies
      formula.variables = validation.variables
      formula.functions = validation.functions
    }
    
    // 存储公式
    this.formulas.set(formula.id, formula)
    this.engine.registerFormula(formula)
    
    // 创建初始版本历史
    if (this.config.enableHistory) {
      await this.createHistoryVersion(formula.id, {
        version: 1,
        changes: '初始创建',
        formula: formula.toJSON()
      })
    }
    
    // 持久化
    if (this.config.persistence) {
      await this.config.persistence.saveFormula(formula)
    }
    
    return {
      success: true,
      formula: formula,
      message: '公式创建成功'
    }
  }
  
  /**
   * 更新公式
   */
  async updateFormula(formulaId, updateData) {
    const existingFormula = this.formulas.get(formulaId)
    
    if (!existingFormula) {
      return {
        success: false,
        formula: null,
        message: '公式不存在'
      }
    }
    
    // 构建更新后的公式
    const updatedFormula = new FormulaDefinition({
      ...existingFormula.toJSON(),
      ...updateData,
      updatedAt: new Date(),
      version: existingFormula.version + 1
    })
    
    // 自动验证
    if (this.config.autoValidate && updateData.expression) {
      const validation = this.validateFormula(updateData.expression)
      
      if (!validation.valid) {
        return {
          success: false,
          formula: existingFormula,
          errors: validation.errors,
          message: '公式验证失败'
        }
      }
      
      // 更新依赖信息
      updatedFormula.dependencies = validation.dependencies
      updatedFormula.variables = validation.variables
      updatedFormula.functions = validation.functions
    }
    
    // 存储更新
    this.formulas.set(formulaId, updatedFormula)
    this.engine.registerFormula(updatedFormula)
    
    // 创建历史版本
    if (this.config.enableHistory) {
      const changes = this.detectChanges(existingFormula, updatedFormula)
      await this.createHistoryVersion(formulaId, {
        version: updatedFormula.version,
        changes: changes,
        formula: updatedFormula.toJSON(),
        previousFormula: existingFormula.toJSON()
      })
    }
    
    // 持久化
    if (this.config.persistence) {
      await this.config.persistence.updateFormula(updatedFormula)
    }
    
    return {
      success: true,
      formula: updatedFormula,
      message: '公式更新成功'
    }
  }
  
  /**
   * 删除公式
   */
  async deleteFormula(formulaId) {
    const formula = this.formulas.get(formulaId)
    
    if (!formula) {
      return {
        success: false,
        message: '公式不存在'
      }
    }
    
    // 检查是否有其他公式依赖此公式
    const impactAnalysis = this.analyzeImpact(formulaId)
    
    if (impactAnalysis.affectedFormulas.length > 0) {
      return {
        success: false,
        message: `该公式被 ${impactAnalysis.affectedFormulas.length} 个其他公式引用，无法删除`,
        affectedFormulas: impactAnalysis.affectedFormulas
      }
    }
    
    // 删除公式
    this.formulas.delete(formulaId)
    
    // 持久化
    if (this.config.persistence) {
      await this.config.persistence.deleteFormula(formulaId)
    }
    
    return {
      success: true,
      message: '公式删除成功'
    }
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
  getAllFormulas(filters = {}) {
    let formulas = [...this.formulas.values()]
    
    // 应用过滤器
    if (filters.category) {
      formulas = formulas.filter(f => f.category === filters.category)
    }
    
    if (filters.status) {
      formulas = formulas.filter(f => f.status === filters.status)
    }
    
    if (filters.resultType) {
      formulas = formulas.filter(f => f.resultType === filters.resultType)
    }
    
    if (filters.createdBy) {
      formulas = formulas.filter(f => f.createdBy === filters.createdBy)
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      formulas = formulas.filter(f => 
        f.name.toLowerCase().includes(searchLower) ||
        f.code.toLowerCase().includes(searchLower) ||
        f.description.toLowerCase().includes(searchLower)
      )
    }
    
    // 排序
    if (filters.sortBy) {
      formulas.sort((a, b) => {
        const aVal = a[filters.sortBy]
        const bVal = b[filters.sortBy]
        
        if (filters.sortOrder === 'desc') {
          return bVal > aVal ? 1 : -1
        }
        return aVal > bVal ? 1 : -1
      })
    }
    
    return formulas
  }
  
  /**
   * 发布公式
   */
  async publishFormula(formulaId) {
    const formula = this.formulas.get(formulaId)
    
    if (!formula) {
      return {
        success: false,
        message: '公式不存在'
      }
    }
    
    // 验证公式
    const validation = this.validateFormula(formula.expression)
    
    if (!validation.valid) {
      return {
        success: false,
        message: '公式验证失败，无法发布',
        errors: validation.errors
      }
    }
    
    // 更新状态
    formula.status = FormulaStatus.PUBLISHED
    formula.updatedAt = new Date()
    
    this.formulas.set(formulaId, formula)
    
    // 创建历史版本
    if (this.config.enableHistory) {
      await this.createHistoryVersion(formulaId, {
        version: formula.version,
        changes: '发布公式',
        formula: formula.toJSON()
      })
    }
    
    // 持久化
    if (this.config.persistence) {
      await this.config.persistence.updateFormula(formula)
    }
    
    return {
      success: true,
      formula: formula,
      message: '公式发布成功'
    }
  }
  
  /**
   * 废弃公式
   */
  async deprecateFormula(formulaId) {
    const formula = this.formulas.get(formulaId)
    
    if (!formula) {
      return {
        success: false,
        message: '公式不存在'
      }
    }
    
    formula.status = FormulaStatus.DEPRECATED
    formula.updatedAt = new Date()
    
    this.formulas.set(formulaId, formula)
    
    // 持久化
    if (this.config.persistence) {
      await this.config.persistence.updateFormula(formula)
    }
    
    return {
      success: true,
      formula: formula,
      message: '公式已废弃'
    }
  }
  
  // ==================== 公式计算 ====================
  
  /**
   * 编译公式
   */
  compileFormula(expression) {
    return this.engine.compile(expression)
  }
  
  /**
   * 验证公式
   */
  validateFormula(expression) {
    return this.engine.validate(expression)
  }
  
  /**
   * 计算公式
   */
  evaluateFormula(formulaIdOrExpression, context = {}) {
    let formula, expression
    
    // 如果传入的是公式ID
    if (typeof formulaIdOrExpression === 'string' && this.formulas.has(formulaIdOrExpression)) {
      formula = this.formulas.get(formulaIdOrExpression)
      expression = formula.expression
    } else {
      expression = formulaIdOrExpression
    }
    
    // 构建计算上下文
    const evalContext = {
      indicators: this.buildIndicatorContext(context),
      variables: this.buildVariableContext(context),
      cellData: context.cellData || {},
      currentRow: context.currentRow || 0,
      currentCol: context.currentCol || 0
    }
    
    // 执行计算
    const result = this.engine.evaluate(expression, evalContext)
    
    // 如果有公式定义，格式化结果
    if (formula && result.value !== null && !result.hasError) {
      result.formattedValue = this.formatResult(result.value, formula.displayFormat, formula.precision)
    }
    
    return result
  }
  
  /**
   * 批量计算公式
   */
  evaluateAllFormulas(context = {}) {
    const results = new Map()
    
    // 获取计算顺序
    const calcOrder = this.engine.getCalculationOrder()
    
    for (const formulaId of calcOrder) {
      const formula = this.formulas.get(formulaId)
      
      if (formula && formula.status === FormulaStatus.PUBLISHED) {
        const result = this.evaluateFormula(formulaId, context)
        results.set(formulaId, result)
        
        // 更新上下文中的指标值（供后续公式使用）
        if (context.indicators) {
          context.indicators[formula.code] = result.value
        }
      }
    }
    
    return results
  }
  
  /**
   * 预览公式（使用模拟数据）
   */
  previewFormula(expression, mockData = {}) {
    // 生成模拟数据
    const previewContext = this.generateMockContext(expression, mockData)
    
    // 执行计算
    const result = this.engine.evaluate(expression, previewContext)
    
    return {
      expression: expression,
      result: result.value,
      mockData: previewContext.indicators,
      errors: result.errors,
      debugLog: result.metadata.debugLog
    }
  }
  
  // ==================== 指标管理 ====================
  
  /**
   * 注册指标
   */
  registerIndicator(indicatorData) {
    const indicator = new IndicatorDefinition(indicatorData)
    
    this.indicators.set(indicator.id, indicator)
    this.indicators.set(indicator.code, indicator)
    
    if (indicator.internalCode) {
      this.indicators.set(indicator.internalCode, indicator)
    }
    
    this.engine.registerIndicator(indicator)
    
    return {
      success: true,
      indicator: indicator,
      message: '指标注册成功'
    }
  }
  
  /**
   * 批量注册指标
   */
  registerIndicators(indicators) {
    for (const indicatorData of indicators) {
      this.registerIndicator(indicatorData)
    }
    
    return {
      success: true,
      count: indicators.length,
      message: `成功注册 ${indicators.length} 个指标`
    }
  }
  
  /**
   * 获取指标
   */
  getIndicator(codeOrId) {
    return this.indicators.get(codeOrId)
  }
  
  /**
   * 获取所有指标
   */
  getAllIndicators(filters = {}) {
    let indicators = []
    const seenIds = new Set()
    
    for (const indicator of this.indicators.values()) {
      // 避免重复（同一个指标可能通过id、code、internalCode多次存储）
      if (!seenIds.has(indicator.id)) {
        seenIds.add(indicator.id)
        
        // 应用过滤器
        if (filters.category && indicator.category !== filters.category) continue
        if (filters.type && indicator.type !== filters.type) continue
        
        indicators.push(indicator)
      }
    }
    
    // 排序
    indicators.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
    
    return indicators
  }
  
  /**
   * 搜索指标
   */
  searchIndicators(keyword) {
    const keywordLower = keyword.toLowerCase()
    
    return this.getAllIndicators().filter(indicator => 
      indicator.name.toLowerCase().includes(keywordLower) ||
      indicator.code.toLowerCase().includes(keywordLower) ||
      indicator.description.toLowerCase().includes(keywordLower)
    )
  }
  
  /**
   * 从模板提取指标
   */
  extractIndicatorsFromTemplate(template) {
    const indicators = []
    
    // 从模板配置中提取行指标和列指标
    if (template.rows) {
      for (const row of template.rows) {
        if (row.id && row.name) {
          indicators.push({
            id: row.id,
            code: row.code || row.id,
            name: row.name,
            internalCode: row.id,
            type: DataType.NUMBER,
            category: 'row',
            description: row.description || ''
          })
        }
      }
    }
    
    if (template.cols) {
      for (const col of template.cols) {
        if (col.id && col.name) {
          indicators.push({
            id: col.id,
            code: col.code || col.id,
            name: col.name,
            internalCode: col.id,
            type: DataType.NUMBER,
            category: 'col',
            description: col.description || ''
          })
        }
      }
    }
    
    this.registerIndicators(indicators)
    
    return indicators
  }
  
  // ==================== 变量管理 ====================
  
  /**
   * 注册变量
   */
  registerVariable(variableData) {
    this.variables.set(variableData.name, variableData)
    this.engine.registerVariable(variableData)
    
    return {
      success: true,
      variable: variableData,
      message: '变量注册成功'
    }
  }
  
  /**
   * 批量注册变量
   */
  registerVariables(variables) {
    for (const variableData of variables) {
      this.registerVariable(variableData)
    }
    
    return {
      success: true,
      count: variables.length,
      message: `成功注册 ${variables.length} 个变量`
    }
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
    return [...this.variables.values()]
  }
  
  // ==================== 依赖分析 ====================
  
  /**
   * 分析公式依赖
   */
  analyzeDependencies(formulaIds = null) {
    return this.engine.analyzeDependencies(formulaIds)
  }
  
  /**
   * 分析公式影响
   */
  analyzeImpact(formulaId) {
    const analysis = this.engine.analyzeDependencies()
    
    if (!analysis.graph.hasNode(formulaId)) {
      return {
        formulaId: formulaId,
        affectedFormulas: [],
        impactTree: null
      }
    }
    
    const impact = analysis.graph.analyzeImpact(formulaId)
    
    return {
      formulaId: formulaId,
      affectedFormulas: impact.allDependents,
      impactTree: analysis.graph.getImpactTree(formulaId),
      affectedCount: impact.affectedCount
    }
  }
  
  /**
   * 获取依赖树
   */
  getDependencyTree(formulaId) {
    const analysis = this.engine.analyzeDependencies()
    
    if (!analysis.graph.hasNode(formulaId)) {
      return null
    }
    
    return analysis.graph.getDependencyTree(formulaId)
  }
  
  /**
   * 检查循环依赖
   */
  checkCircularDependency() {
    return this.engine.checkCycles()
  }
  
  // ==================== 版本管理 ====================
  
  /**
   * 创建历史版本
   */
  async createHistoryVersion(formulaId, versionData) {
    if (!this.history.has(formulaId)) {
      this.history.set(formulaId, [])
    }
    
    const historyItem = {
      version: versionData.version,
      changes: versionData.changes,
      formula: versionData.formula,
      previousFormula: versionData.previousFormula || null,
      createdBy: versionData.createdBy || 'System',
      createdAt: new Date(),
      diff: versionData.previousFormula ? this.computeDiff(versionData.previousFormula, versionData.formula) : null
    }
    
    this.history.get(formulaId).push(historyItem)
    
    // 持久化
    if (this.config.persistence) {
      await this.config.persistence.saveHistory(formulaId, historyItem)
    }
    
    return historyItem
  }
  
  /**
   * 获取公式历史
   */
  getFormulaHistory(formulaId) {
    return this.history.get(formulaId) || []
  }
  
  /**
   * 恢复历史版本
   */
  async restoreHistoryVersion(formulaId, versionNumber) {
    const history = this.history.get(formulaId)
    
    if (!history || history.length === 0) {
      return {
        success: false,
        message: '没有历史版本'
      }
    }
    
    const historyItem = history.find(h => h.version === versionNumber)
    
    if (!historyItem) {
      return {
        success: false,
        message: `版本 ${versionNumber} 不存在`
      }
    }
    
    // 恢复公式
    const restoredFormula = FormulaDefinition.fromJSON(historyItem.formula)
    
    this.formulas.set(formulaId, restoredFormula)
    this.engine.registerFormula(restoredFormula)
    
    // 持久化
    if (this.config.persistence) {
      await this.config.persistence.updateFormula(restoredFormula)
    }
    
    return {
      success: true,
      formula: restoredFormula,
      message: `已恢复到版本 ${versionNumber}`
    }
  }
  
  /**
   * 比较两个版本
   */
  compareVersions(formulaId, version1, version2) {
    const history = this.history.get(formulaId)
    
    if (!history) {
      return null
    }
    
    const v1Item = history.find(h => h.version === version1)
    const v2Item = history.find(h => h.version === version2)
    
    if (!v1Item || !v2Item) {
      return null
    }
    
    return {
      version1: v1Item,
      version2: v2Item,
      diff: this.computeDiff(v1Item.formula, v2Item.formula)
    }
  }
  
  // ==================== 函数管理 ====================
  
  /**
   * 获取所有函数
   */
  getAllFunctions(category = null) {
    return this.engine.getFunctions(category)
  }
  
  /**
   * 获取函数分类
   */
  getFunctionCategories() {
    return this.engine.getFunctionCategories()
  }
  
  /**
   * 注册自定义函数
   */
  registerCustomFunction(funcDef) {
    this.engine.registerFunction(funcDef)
    
    return {
      success: true,
      function: funcDef,
      message: '自定义函数注册成功'
    }
  }
  
  // ==================== 辅助方法 ====================
  
  /**
   * 生成公式ID
   */
  generateFormulaId() {
    return `formula_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  /**
   * 构建指标上下文
   */
  buildIndicatorContext(context) {
    const indicators = new Map()
    
    // 添加已注册的指标默认值
    for (const [key, indicator] of this.indicators) {
      if (indicator.defaultValue !== undefined) {
        indicators.set(key, indicator.defaultValue)
      }
    }
    
    // 添加传入的指标值
    if (context.indicators) {
      for (const [key, value] of Object.entries(context.indicators)) {
        indicators.set(key, value)
      }
    }
    
    return indicators
  }
  
  /**
   * 构建变量上下文
   */
  buildVariableContext(context) {
    const variables = new Map()
    
    // 添加已注册的变量
    for (const [name, variable] of this.variables) {
      variables.set(name, variable.value)
    }
    
    // 添加传入的变量值
    if (context.variables) {
      for (const [name, value] of Object.entries(context.variables)) {
        variables.set(name, value)
      }
    }
    
    return variables
  }
  
  /**
   * 生成模拟上下文
   */
  generateMockContext(expression, mockData = {}) {
    // 编译公式，提取依赖
    const compiled = this.engine.compile(expression)
    
    const indicators = {}
    
    // 为每个依赖生成模拟值
    if (compiled.dependencies) {
      for (const depId of compiled.dependencies) {
        const indicator = this.indicators.get(depId)
        
        if (mockData[depId] !== undefined) {
          indicators[depId] = mockData[depId]
        } else if (mockData[indicator?.name] !== undefined) {
          indicators[depId] = mockData[indicator.name]
        } else {
          // 生成随机模拟值
          indicators[depId] = this.generateMockValue(indicator?.type || DataType.NUMBER)
        }
      }
    }
    
    return {
      indicators: indicators,
      variables: this.buildVariableContext({})
    }
  }
  
  /**
   * 生成模拟值
   */
  generateMockValue(type) {
    switch (type) {
      case DataType.NUMBER:
        return Math.random() * 90000 + 100 // 100 ~ 90000
      
      case DataType.STRING:
        return 'MockString'
      
      case DataType.BOOLEAN:
        return Math.random() > 0.5
      
      case DataType.DATE:
        return new Date()
      
      default:
        return Math.random() * 90000 + 100
    }
  }
  
  /**
   * 格式化结果
   */
  formatResult(value, format, precision) {
    if (value == null) return ''
    
    // 根据格式化模板格式化
    switch (format) {
      case '#,##0':
        return Math.round(value).toLocaleString()
      
      case '#,##0.00':
        return value.toFixed(precision || 2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      
      case '0.00%':
        return (value * 100).toFixed(precision || 2) + '%'
      
      case '￥#,##0.00':
        return '￥' + value.toFixed(precision || 2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      
      default:
        if (format && format.includes('%')) {
          return (value * 100).toFixed(precision || 2) + '%'
        }
        return value.toFixed(precision || 2)
    }
  }
  
  /**
   * 检测变更
   */
  detectChanges(oldFormula, newFormula) {
    const changes = []
    
    const fields = ['name', 'code', 'category', 'expression', 'description', 'resultType', 'displayFormat', 'precision']
    
    for (const field of fields) {
      if (oldFormula[field] !== newFormula[field]) {
        changes.push(`${field}: "${oldFormula[field]}" → "${newFormula[field]}"`)
      }
    }
    
    return changes.join('; ')
  }
  
  /**
   * 计算差异
   */
  computeDiff(oldFormula, newFormula) {
    const diff = {
      added: [],
      removed: [],
      modified: []
    }
    
    const oldJson = oldFormula || {}
    const newJson = newFormula || {}
    
    for (const key of Object.keys(newJson)) {
      if (!(key in oldJson)) {
        diff.added.push({ key, value: newJson[key] })
      } else if (oldJson[key] !== newJson[key]) {
        diff.modified.push({ key, oldValue: oldJson[key], newValue: newJson[key] })
      }
    }
    
    for (const key of Object.keys(oldJson)) {
      if (!(key in newJson)) {
        diff.removed.push({ key, value: oldJson[key] })
      }
    }
    
    return diff
  }
  
  /**
   * 导出公式
   */
  exportFormulas(format = 'json') {
    const formulas = this.getAllFormulas()
    
    switch (format) {
      case 'json':
        return JSON.stringify(formulas.map(f => f.toJSON()), null, 2)
      
      case 'csv':
        // CSV格式导出
        const headers = ['ID', 'Name', 'Code', 'Category', 'Expression', 'Status', 'Version']
        const rows = formulas.map(f => [
          f.id, f.name, f.code, f.category, f.expression, f.status, f.version
        ])
        
        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      
      default:
        return formulas
    }
  }
  
  /**
   * 导入公式
   */
  async importFormulas(data, format = 'json') {
    let formulas
    
    switch (format) {
      case 'json':
        formulas = JSON.parse(data)
        break
      
      case 'csv':
        // CSV格式导入
        const lines = data.split('\n')
        const headers = lines[0].split(',')
        
        formulas = lines.slice(1).map(line => {
          const values = line.split(',')
          const formula = {}
          
          headers.forEach((header, index) => {
            formula[header.toLowerCase()] = values[index]
          })
          
          return formula
        })
        break
      
      default:
        formulas = data
    }
    
    // 创建公式
    const results = []
    
    for (const formulaData of formulas) {
      const result = await this.createFormula(formulaData)
      results.push(result)
    }
    
    return {
      success: true,
      importedCount: results.filter(r => r.success).length,
      failedCount: results.filter(r => !r.success).length,
      results: results
    }
  }
  
  /**
   * 清除缓存
   */
  clearCache() {
    this.engine.clearCache()
    return this
  }
  
  /**
   * 设置调试模式
   */
  setDebugMode(enabled) {
    this.engine.setDebugMode(enabled)
    return this
  }
}

/**
 * createFormulaService - 创建公式服务实例
 */
export function createFormulaService(options = {}) {
  return new FormulaService(options)
}