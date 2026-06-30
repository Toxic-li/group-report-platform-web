/**
 * Formula System - 核心引擎入口
 * 
 * 统一导出所有核心模块
 */

// ==================== 类型定义 ====================
export * from './FormulaTypes.js'

// ==================== AST ====================
export * from './FormulaAST.js'

// ==================== Lexer ====================
export { FormulaLexer, tokenize } from './FormulaLexer.js'

// ==================== Parser ====================
export { FormulaParser, parse } from './FormulaParser.js'

// ==================== Validator ====================
export { FormulaValidator, validateFormula } from './FormulaValidator.js'

// ==================== Evaluator ====================
export { FormulaEvaluator, evaluateFormula } from './FormulaEvaluator.js'

// ==================== Function Registry ====================
export { FunctionRegistry, createFunctionRegistry } from './FunctionRegistry.js'

// ==================== Dependency Graph ====================
export {
  DependencyGraph,
  FormulaDependencyAnalyzer,
  createDependencyGraph,
  analyzeDependencies
} from './DependencyGraph.js'

/**
 * FormulaEngine - 公式引擎统一接口
 * 
 * 整合所有核心模块，提供统一的API
 */
export class FormulaEngine {
  constructor(options = {}) {
    // 创建函数注册中心
    this.functionRegistry = createFunctionRegistry()
    
    // 指标注册表
    this.indicators = new Map(options.indicators || [])
    
    // 变量注册表
    this.variables = new Map(options.variables || [])
    
    // 公式注册表
    this.formulas = new Map()
    
    // 依赖图
    this.dependencyGraph = new DependencyGraph()
    
    // 缓存
    this.cache = new Map()
    
    // 调试模式
    this.debugMode = options.debugMode || false
  }
  
  /**
   * 注册指标
   */
  registerIndicator(indicator) {
    this.indicators.set(indicator.id, indicator)
    this.indicators.set(indicator.code, indicator)
    return this
  }
  
  /**
   * 批量注册指标
   */
  registerIndicators(indicators) {
    for (const indicator of indicators) {
      this.registerIndicator(indicator)
    }
    return this
  }
  
  /**
   * 注册变量
   */
  registerVariable(variable) {
    this.variables.set(variable.name, variable)
    return this
  }
  
  /**
   * 批量注册变量
   */
  registerVariables(variables) {
    for (const variable of variables) {
      this.registerVariable(variable)
    }
    return this
  }
  
  /**
   * 注册公式
   */
  registerFormula(formula) {
    this.formulas.set(formula.id, formula)
    return this
  }
  
  /**
   * 批量注册公式
   */
  registerFormulas(formulas) {
    for (const formula of formulas) {
      this.registerFormula(formula)
    }
    
    // 更新依赖图
    this.updateDependencyGraph()
    
    return this
  }
  
  /**
   * 更新依赖图
   */
  updateDependencyGraph() {
    this.dependencyGraph.buildFromFormulas([...this.formulas.values()])
    return this
  }
  
  /**
   * 注册自定义函数
   */
  registerFunction(funcDef) {
    this.functionRegistry.register(funcDef)
    return this
  }
  
  /**
   * 批量注册自定义函数
   */
  registerFunctions(funcDefs) {
    this.functionRegistry.registerAll(funcDefs)
    return this
  }
  
  /**
   * 编译公式字符串
   */
  compile(expression) {
    // 词法分析
    const lexer = new FormulaLexer(expression)
    const { tokens, errors: lexerErrors } = lexer.tokenize()
    
    if (lexerErrors.length > 0) {
      return {
        success: false,
        errors: lexerErrors,
        ast: null
      }
    }
    
    // 语法解析
    const parser = new FormulaParser(tokens, expression)
    const { ast, errors: parserErrors } = parser.parse()
    
    if (parserErrors.length > 0) {
      return {
        success: false,
        errors: parserErrors,
        ast: null
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
      success: validation.valid,
      errors: validation.errors,
      warnings: validation.warnings,
      ast: ast,
      dependencies: validation.dependencies,
      variables: validation.variables,
      functions: validation.functions
    }
  }
  
  /**
   * 计算公式
   */
  evaluate(astOrExpression, context = {}) {
    // 如果传入的是字符串，先编译
    let ast
    if (typeof astOrExpression === 'string') {
      const compiled = this.compile(astOrExpression)
      if (!compiled.success) {
        return new FormulaResult(null, compiled.errors)
      }
      ast = compiled.ast
    } else {
      ast = astOrExpression
    }
    
    // 创建计算上下文
    const evalContext = new EvaluationContext({
      indicators: new Map([...this.indicators, ...new Map(context.indicators || [])]),
      variables: new Map([...this.variables, ...new Map(context.variables || [])]),
      functions: this.functionRegistry,
      cellData: context.cellData || {},
      currentRow: context.currentRow || 0,
      currentCol: context.currentCol || 0
    })
    
    // 创建计算器
    const evaluator = new FormulaEvaluator({
      functions: this.functionRegistry,
      indicators: evalContext.indicators,
      variables: evalContext.variables,
      cellData: evalContext.cellData,
      debugMode: this.debugMode
    })
    
    // 执行计算
    return evaluator.evaluate(ast, evalContext)
  }
  
  /**
   * 验证公式
   */
  validate(expressionOrAst) {
    // 如果传入的是字符串，先编译
    let ast
    if (typeof expressionOrAst === 'string') {
      const compiled = this.compile(expressionOrAst)
      return {
        valid: compiled.success,
        errors: compiled.errors,
        warnings: compiled.warnings,
        dependencies: compiled.dependencies,
        variables: compiled.variables,
        functions: compiled.functions
      }
    } else {
      ast = expressionOrAst
    }
    
    // 执行校验
    const validator = new FormulaValidator({
      indicators: this.indicators,
      variables: this.variables,
      functions: this.functionRegistry.functions,
      formulas: this.formulas
    })
    
    return validator.validate(ast)
  }
  
  /**
   * 分析依赖关系
   */
  analyzeDependencies(formulaIds = null) {
    // 更新依赖图
    this.updateDependencyGraph()
    
    // 如果指定了特定公式ID，返回单个分析结果
    if (formulaIds) {
      if (typeof formulaIds === 'string') {
        return this.dependencyGraph.analyzeDependencies(formulaIds)
      } else if (Array.isArray(formulaIds)) {
        return formulaIds.map(id => this.dependencyGraph.analyzeDependencies(id))
      }
    }
    
    // 返回全部依赖分析
    return analyzeDependencies([...this.formulas.values()])
  }
  
  /**
   * 获取计算顺序
   */
  getCalculationOrder() {
    this.updateDependencyGraph()
    return this.dependencyGraph.getCalculationOrder()
  }
  
  /**
   * 检查循环依赖
   */
  checkCycles() {
    this.updateDependencyGraph()
    return {
      hasCycles: this.dependencyGraph.hasCycles(),
      cycles: this.dependencyGraph.cycles
    }
  }
  
  /**
   * 获取函数列表
   */
  getFunctions(category = null) {
    if (category) {
      return this.functionRegistry.getByCategory(category)
    }
    return this.functionRegistry.getAll()
  }
  
  /**
   * 获取函数分类
   */
  getFunctionCategories() {
    return this.functionRegistry.getCategories()
  }
  
  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear()
    return this
  }
  
  /**
   * 设置调试模式
   */
  setDebugMode(enabled) {
    this.debugMode = enabled
    return this
  }
}

/**
 * createFormulaEngine - 创建公式引擎实例
 */
export function createFormulaEngine(options = {}) {
  return new FormulaEngine(options)
}