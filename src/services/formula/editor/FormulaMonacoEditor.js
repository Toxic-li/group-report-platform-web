/**
 * Formula System - Monaco Editor Integration (V2)
 * 
 * Monaco编辑器集成，提供：
 * - 自定义Formula语言定义
 * - 自动补全（Completion Provider）
 * - Hover提示（Hover Provider）
 * - 参数提示（Signature Help Provider）
 * - 错误诊断（Diagnostics Provider）
 * - 代码格式化（Formatter）
 */

import loader from '@monaco-editor/loader'

/**
 * FormulaMonacoEditor - Monaco编辑器主类
 * 
 * 使用方式：
 * ```javascript
 * const editor = new FormulaMonacoEditor(formulaService)
 * await editor.initialize()
 * editor.createEditor(containerElement, options)
 * ```
 */
export class FormulaMonacoEditor {
  constructor(formulaService) {
    this.formulaService = formulaService
    this.monaco = null
    this.editor = null
    this.languageId = 'formula'
    this.initialized = false
  }

  /**
   * 初始化 Monaco Editor 和所有 Providers
   */
  async initialize() {
    if (this.initialized) return

    try {
      // 配置 loader
      loader.config({
        paths: {
          vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs'
        }
      })

      // 加载 Monaco Editor
      this.monaco = await loader.init()

      // 初始化语言定义
      await this.initLanguage()

      // 初始化所有 Providers
      await this.initProviders()

      this.initialized = true
      console.log('Monaco Editor initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Monaco Editor:', error)
      throw error
    }
  }

  /**
   * 初始化 Formula 语言定义
   */
  async initLanguage() {
    const monaco = this.monaco

    // 注册语言
    monaco.languages.register({ id: this.languageId })

    // 定义语法高亮（Monarch Tokens Provider）
    monaco.languages.setMonarchTokensProvider(this.languageId, {
      keywords: [
        'IF', 'IFS', 'AND', 'OR', 'NOT', 'TRUE', 'FALSE',
        'SUM', 'AVG', 'MAX', 'MIN', 'COUNT', 'ROUND', 'ABS', 'POWER', 'SQRT',
        'YOY', 'MOM', 'YTD', 'QTD', 'MTD',
        'RATE', 'PERCENT', 'COMPLETE_RATE', 'PROFIT_RATE', 'GROWTH_RATE'
      ],
      
      operators: [
        '+', '-', '*', '/', '^', '%',
        '=', '!=', '<>', '<', '>', '<=', '>=',
        'AND', 'OR', 'NOT'
      ],
      
      symbols: /[=><!~?:&|+\-*\/\^%]+/,
      
      tokenizer: {
        root: [
          // 指标引用 [指标名]
          [/\[[^\]]+\]/, 'indicator'],
          
          // 标识符和函数名
          [/[a-zA-Z_\u4e00-\u9fa5][a-zA-Z0-9_\u4e00-\u9fa5]*/, {
            cases: {
              '@keywords': 'function',
              '@default': 'identifier'
            }
          }],
          
          // 变量引用 $变量名
          [/\$[a-zA-Z_][a-zA-Z0-9_]/, 'variable'],
          
          // 数字和百分比
          [/\d+(\.\d+)?/, 'number'],
          [/\d+(\.\d+)?%/, 'number'],
          
          // 字符串
          [/\"([^\"\n]*)\"/, 'string'],
          [/\'([^\'\n]*)\'/, 'string'],
          
          // 运算符
          [/@symbols/, {
            cases: {
              '@operators': 'operator',
              '@default': ''
            }
          }],
          
          // 分隔符
          [/[{}()\[\]]/, '@brackets'],
          [/,/, 'delimiter'],
          [/:/, 'delimiter'],
          [/\./, 'delimiter'],
          
          // 空白字符
          [/\s+/, 'white']
        ]
      }
    })

    // 定义语言配置
    monaco.languages.setLanguageConfiguration(this.languageId, {
      comments: {
        lineComment: '//'
      },
      
      brackets: [
        ['[', ']'],
        ['(', ')'],
        ['{', '}']
      ],
      
      autoClosingPairs: [
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '{', close: '}' },
        { open: '"', close: '"' },
        { open: "'", close: "'" }
      ],
      
      surroundingPairs: [
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '{', close: '}' },
        { open: '"', close: '"' },
        { open: "'", close: "'" }
      ]
    })
  }

  /**
   * 初始化所有 Providers
   */
  async initProviders() {
    const monaco = this.monaco

    // 1. 自动补全 Provider
    monaco.languages.registerCompletionItemProvider(this.languageId, {
      triggerCharacters: ['[', '(', '.', ' ', '$'],
      
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        }
        
        const suggestions = []
        
        // 添加指标补全建议
        suggestions.push(...this.getIndicatorSuggestions(range))
        
        // 添加函数补全建议
        suggestions.push(...this.getFunctionSuggestions(range))
        
        // 添加变量补全建议
        suggestions.push(...this.getVariableSuggestions(range))
        
        // 添加运算符补全建议
        suggestions.push(...this.getOperatorSuggestions(range))
        
        // 添加常用公式模板
        suggestions.push(...this.getTemplateSuggestions(range))
        
        return { suggestions }
      }
    })

    // 2. Hover 提示 Provider
    monaco.languages.registerHoverProvider(this.languageId, {
      provideHover: (model, position) => {
        const word = model.getWordAtPosition(position)
        if (!word) return null
        
        const content = model.getLineContent(position.lineNumber)
        const token = content.substring(word.startColumn - 1, word.endColumn - 1)
        
        // 查找指标、函数、变量的详细信息
        const hoverInfo = this.getHoverInfo(token)
        
        if (hoverInfo) {
          return {
            contents: [
              { value: `**${hoverInfo.name}**` },
              { value: hoverInfo.description }
            ],
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endColumn: word.endColumn
            }
          }
        }
        
        return null
      }
    })

    // 3. 参数提示 Provider
    monaco.languages.registerSignatureHelpProvider(this.languageId, {
      signatureHelpTriggerCharacters: ['(', ','],
      
      provideSignatureHelp: (model, position) => {
        const content = model.getLineContent(position.lineNumber)
        const textBeforePosition = content.substring(0, position.column - 1)
        
        // 查找最近的函数调用
        const functionMatch = this.findLastFunctionCall(textBeforePosition)
        
        if (functionMatch) {
          const functionName = functionMatch.name
          const functionInfo = this.formulaService.getFunction(functionName)
          
          if (functionInfo) {
            const signatures = [{
              label: functionInfo.signature,
              documentation: functionInfo.description,
              parameters: functionInfo.params.map(param => ({
                label: param.name,
                documentation: param.description
              }))
            }]
            
            return {
              signatures,
              activeSignature: 0,
              activeParameter: functionMatch.paramIndex
            }
          }
        }
        
        return null
      }
    })

    // 4. 代码格式化 Provider
    monaco.languages.registerDocumentFormattingEditProvider(this.languageId, {
      provideDocumentFormattingEdits: (model) => {
        const content = model.getValue()
        const formatted = this.formatFormula(content)
        
        return [{
          range: model.getFullModelRange(),
          text: formatted
        }]
      }
    })

    monaco.languages.registerDocumentRangeFormattingEditProvider(this.languageId, {
      provideDocumentRangeFormattingEdits: (model, range) => {
        const content = model.getValueInRange(range)
        const formatted = this.formatFormula(content)
        
        return [{
          range,
          text: formatted
        }]
      }
    })
  }

  /**
   * 创建编辑器实例
   */
  createEditor(container, options = {}) {
    if (!this.initialized) {
      throw new Error('Monaco Editor not initialized. Call initialize() first.')
    }

    const defaultOptions = {
      value: '',
      language: this.languageId,
      theme: 'vs',
      fontSize: 14,
      fontFamily: 'Consolas, Monaco, monospace',
      minimap: { enabled: false },
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: 'on',
      folding: false,
      renderLineHighlight: 'line',
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto',
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10
      }
    }

    this.editor = this.monaco.editor.create(container, {
      ...defaultOptions,
      ...options
    })

    // 监听内容变化，触发验证
    this.editor.onDidChangeModelContent(() => {
      this.validateFormula()
    })

    return this.editor
  }

  /**
   * 获取编辑器实例
   */
  getEditor() {
    return this.editor
  }

  /**
   * 获取编辑器内容
   */
  getValue() {
    return this.editor?.getValue() || ''
  }

  /**
   * 设置编辑器内容
   */
  setValue(value) {
    if (this.editor) {
      this.editor.setValue(value)
    }
  }

  /**
   * 销毁编辑器
   */
  destroy() {
    if (this.editor) {
      this.editor.dispose()
      this.editor = null
    }
  }

  /**
   * 设置编辑器主题
   */
  setTheme(theme) {
    if (this.monaco) {
      this.monaco.editor.setTheme(theme)
    }
  }

  /**
   * 验证公式
   */
  validateFormula() {
    if (!this.editor || !this.formulaService) return

    const content = this.editor.getValue()
    const model = this.editor.getModel()
    
    try {
      const result = this.formulaService.validate(content)
      
      const markers = result.errors.map(error => ({
        severity: this.monaco.MarkerSeverity.Error,
        message: error.message,
        startLineNumber: error.line || 1,
        startColumn: error.column || 1,
        endLineNumber: error.line || 1,
        endColumn: error.column + (error.length || 1) || 2
      }))
      
      this.monaco.editor.setModelMarkers(model, this.languageId, markers)
    } catch (error) {
      console.error('Formula validation error:', error)
    }
  }

  /**
   * 格式化公式
   */
  formatFormula(content) {
    // 简单的格式化规则
    return content
      .replace(/\s+/g, ' ')  // 去除多余空格
      .replace(/\s*,\s*/g, ', ')  // 格式化逗号
      .replace(/\s*\(\s*/g, '(')  // 格式化括号
      .replace(/\s*\)\s*/g, ')')
      .trim()
  }

  // ==================== 补全建议相关方法 ====================

  /**
   * 获取指标补全建议
   */
  getIndicatorSuggestions(range) {
    if (!this.formulaService) return []
    
    const indicators = this.formulaService.getIndicators()
    
    return indicators.map(indicator => ({
      label: indicator.name,
      kind: this.monaco.languages.CompletionItemKind.Variable,
      insertText: `[${indicator.name}]`,
      documentation: indicator.description,
      detail: `指标: ${indicator.code}`,
      range
    }))
  }

  /**
   * 获取函数补全建议
   */
  getFunctionSuggestions(range) {
    if (!this.formulaService) return []
    
    const functions = this.formulaService.getFunctions()
    
    return functions.map(func => ({
      label: func.name,
      kind: this.monaco.languages.CompletionItemKind.Function,
      insertText: func.insertText || `${func.name}()`,
      insertTextRules: this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: func.description,
      detail: func.signature,
      range
    }))
  }

  /**
   * 获取变量补全建议
   */
  getVariableSuggestions(range) {
    if (!this.formulaService) return []
    
    const variables = this.formulaService.getVariables()
    
    return variables.map(variable => ({
      label: variable.name,
      kind: this.monaco.languages.CompletionItemKind.Variable,
      insertText: `$${variable.name}`,
      documentation: variable.description,
      detail: `变量: ${variable.name}`,
      range
    }))
  }

  /**
   * 获取运算符补全建议
   */
  getOperatorSuggestions(range) {
    const operators = [
      { name: '+', description: '加法' },
      { name: '-', description: '减法' },
      { name: '*', description: '乘法' },
      { name: '/', description: '除法' },
      { name: '^', description: '幂运算' },
      { name: '%', description: '百分比' },
      { name: '=', description: '等于' },
      { name: '!=', description: '不等于' },
      { name: '<', description: '小于' },
      { name: '>', description: '大于' },
      { name: '<=', description: '小于等于' },
      { name: '>=', description: '大于等于' },
      { name: 'AND', description: '逻辑与' },
      { name: 'OR', description: '逻辑或' },
      { name: 'NOT', description: '逻辑非' }
    ]
    
    return operators.map(op => ({
      label: op.name,
      kind: this.monaco.languages.CompletionItemKind.Operator,
      insertText: op.name,
      documentation: op.description,
      range
    }))
  }

  /**
   * 获取公式模板建议
   */
  getTemplateSuggestions(range) {
    const templates = [
      {
        name: '完成率',
        insertText: 'RATE(${实际值}, ${目标值})',
        description: '计算完成率 = 实际值 / 目标值'
      },
      {
        name: '同比增长',
        insertText: 'YOY(${当前值}, ${去年同期值})',
        description: '计算同比增长率'
      },
      {
        name: '环比增长',
        insertText: 'MOM(${当前值}, ${上月值})',
        description: '计算环比增长率'
      },
      {
        name: '占比',
        insertText: '${部分值} / ${整体值}',
        description: '计算占比'
      },
      {
        name: '汇总',
        insertText: 'SUM(${指标列表})',
        description: '计算总和'
      }
    ]
    
    return templates.map(template => ({
      label: template.name,
      kind: this.monaco.languages.CompletionItemKind.Snippet,
      insertText: template.insertText,
      insertTextRules: this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: template.description,
      detail: '公式模板',
      range
    }))
  }

  // ==================== Hover 提示相关方法 ====================

  /**
   * 获取 Hover 提示信息
   */
  getHoverInfo(token) {
    if (!this.formulaService) return null
    
    // 检查是否是指标
    const indicator = this.formulaService.getIndicator(token)
    if (indicator) {
      return {
        name: indicator.name,
        description: `${indicator.description}\n\n类型: ${indicator.type}\n数据源: ${indicator.source}`
      }
    }
    
    // 检查是否是函数
    const func = this.formulaService.getFunction(token)
    if (func) {
      return {
        name: func.name,
        description: `${func.description}\n\n签名: ${func.signature}\n参数: ${func.params.map(p => p.name).join(', ')}`
      }
    }
    
    // 检查是否是变量
    const variable = this.formulaService.getVariable(token)
    if (variable) {
      return {
        name: variable.name,
        description: `${variable.description}\n\n类型: ${variable.type}\n当前值: ${variable.value}`
      }
    }
    
    return null
  }

  // ==================== 参数提示相关方法 ====================

  /**
   * 查找最后一个函数调用
   */
  findLastFunctionCall(text) {
    // 简单的函数调用查找逻辑
    const matches = text.match(/([A-Z_][A-Z0-9_]*)\(([^)]*)/g)
    if (!matches) return null
    
    const lastMatch = matches[matches.length - 1]
    const functionName = lastMatch.match(/([A-Z_][A-Z0-9_]*)/)[1]
    const params = lastMatch.match(/\(([^)]*)/)[1]
    const paramIndex = params.split(',').length - 1
    
    return {
      name: functionName,
      paramIndex
    }
  }
}

export default FormulaMonacoEditor