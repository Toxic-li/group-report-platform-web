/**
 * Formula System - 统一入口
 * 
 * 导出所有Formula System模块
 */

// ==================== Core Engine ====================
export * from './core/index.js'

// ==================== Services ====================
export { FormulaService, createFormulaService } from './services/FormulaService.js'

// ==================== Editor ====================
export { FormulaMonacoEditor } from './editor/FormulaMonacoEditor.js'

/**
 * Formula System - 快速初始化工具
 */
export class FormulaSystem {
  constructor(options = {}) {
    // 创建Formula Service
    this.service = createFormulaService(options.serviceOptions || {})
    
    // Monaco Editor实例（可选）
    this.editorInstance = null
  }
  
  /**
   * 初始化指标（从模板或其他来源）
   */
  initIndicators(indicators) {
    this.service.registerIndicators(indicators)
    return this
  }
  
  /**
   * 初始化变量
   */
  initVariables(variables) {
    this.service.registerVariables(variables)
    return this
  }
  
  /**
   * 初始化公式
   */
  initFormulas(formulas) {
    formulas.forEach(formula => {
      this.service.createFormula(formula)
    })
    return this
  }
  
  /**
   * 创建Monaco编辑器（异步）
   */
  async createEditor(container, options = {}) {
    const { FormulaMonacoEditor } = await import('./editor/FormulaMonacoEditor.js')

    // 创建编辑器实例
    this.editorInstance = new FormulaMonacoEditor(this.service)

    // 初始化 Monaco Editor（异步）
    await this.editorInstance.initialize()

    // 创建编辑器
    const editor = this.editorInstance.createEditor(container, options)

    return editor
  }
  
  /**
   * 获取Formula Service
   */
  getService() {
    return this.service
  }
  
  /**
   * 获取Formula Engine
   */
  getEngine() {
    return this.service.engine
  }
  
  /**
   * 快捷方法：创建公式
   */
  async createFormula(formulaData) {
    return this.service.createFormula(formulaData)
  }
  
  /**
   * 快捷方法：计算公式
   */
  evaluateFormula(formulaIdOrExpression, context = {}) {
    return this.service.evaluateFormula(formulaIdOrExpression, context)
  }
  
  /**
   * 快捷方法：验证公式
   */
  validateFormula(expression) {
    return this.service.validateFormula(expression)
  }
  
  /**
   * 快捷方法：获取所有指标
   */
  getIndicators() {
    return this.service.getAllIndicators()
  }
  
  /**
   * 快捷方法：获取所有函数
   */
  getFunctions(category = null) {
    return this.service.getAllFunctions(category)
  }
}

/**
 * createFormulaSystem - 创建Formula System实例
 */
export function createFormulaSystem(options = {}) {
  return new FormulaSystem(options)
}