/**
 * Formula System - Monaco Editor Integration
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

// Monaco Editor 实例（延迟加载）
let monaco = null

/**
 * 加载 Monaco Editor
 */
async function loadMonaco() {
  if (monaco) return monaco

  try {
    // 配置 loader（可选）
    loader.config({
      paths: {
        vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs'
      }
    })

    // 加载 Monaco Editor
    monaco = await loader.init()
    return monaco
  } catch (error) {
    console.error('Failed to load Monaco Editor:', error)
    throw error
  }
}

/**
 * FormulaLanguageDefinition - Formula语言定义
 */
export class FormulaLanguageDefinition {
  constructor() {
    this.languageId = 'formula'
    this.monacoLoaded = false
  }

  /**
   * 初始化语言定义（异步）
   */
  async initLanguage() {
    // 加载 Monaco Editor
    const monacoInstance = await loadMonaco()

    // 注册语言
    monacoInstance.languages.register({ id: this.languageId })
    
    // 定义Token Provider（语法高亮）
    monacoInstance.languages.setMonarchTokensProvider(this.languageId, {
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
          // 标识符（指标引用） - 方括号形式
          [/\[[^\]]+\]/, 'indicator'],
          
          // 标识符（指标引用） - 普通形式
          [/[a-zA-Z_\u4e00-\u9fa5][a-zA-Z0-9_\u4e00-\u9fa5]*/, {
            cases: {
              '@keywords': 'function',
              '@default': 'identifier'
            }
          }],
          
          // 变量引用
          [/\$[a-zA-Z_][a-zA-Z0-9_]/, 'variable'],
          
          // 数字
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
    
    // 定义语言配置（括号匹配、自动缩进等）
    monacoInstance.languages.setLanguageConfiguration(this.languageId, {
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
      ],
      
      indentationRules: {
        increaseIndentPattern: /\(/,
        decreaseIndentPattern: /\)/
      }
    })
  }
}

/**
 * FormulaCompletionProvider - 自动补全提供器
 */
export class FormulaCompletionProvider {
  constructor(formulaService) {
    this.formulaService = formulaService
    this.initProvider()
  }
  
  /**
   * 初始化Provider
   */
  initProvider() {
    monaco.languages.registerCompletionItemProvider('formula', {
      triggerCharacters: ['[', '(', '.', ' ', '$'],
      
      provideCompletionItems: (model, position, context) => {
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        }
        
        const lineContent = model.getLineContent(position.lineNumber)
        const textBeforePosition = lineContent.substring(0, position.column - 1)
        
        // 根据上下文判断补全类型
        const suggestions = []
        
        // 1. 指标补全（输入 [ 或标识符）
        if (textBeforePosition.endsWith('[') || this.isIdentifierStart(textBeforePosition)) {
          suggestions.push(...this.getIndicatorSuggestions(range))
        }
        
        // 2. 函数补全（输入函数名开头）
        if (this.isFunctionStart(textBeforePosition)) {
          suggestions.push(...this.getFunctionSuggestions(range))
        }
        
        // 3. 变量补全（输入 $）
        if (textBeforePosition.endsWith('$')) {
          suggestions.push(...this.getVariableSuggestions(range))
        }
        
        // 4. 运算符补全
        suggestions.push(...this.getOperatorSuggestions(range))
        
        // 5. 常用模板补全
        suggestions.push(...this.getTemplateSuggestions(range))
        
        return { suggestions }
      }
    })
  }
  
  /**
   * 获取指标补全建议
   */
  getIndicatorSuggestions(range) {
    const indicators = this.formulaService.getAllIndicators()
    
    return indicators.map(indicator => ({
      label: indicator.name,
      kind: monaco.languages.CompletionItemKind.Variable,
      insertText: `[${indicator.name}]`,
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: `${indicator.description || ''}\n类型: ${indicator.type}\n编码: ${indicator.code}`,
      detail: indicator.category || '指标',
      range: range,
      sortText: '1' // 指标优先级最高
    }))
  }
  
  /**
   * 获取函数补全建议
   */
  getFunctionSuggestions(range) {
    const functions = this.formulaService.getAllFunctions()
    
    return functions.map(func => ({
      label: func.name,
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: `${func.name}(${this.buildInsertText(func)})`,
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: `${func.description}\n\n签名: ${func.signature}\n\n示例:\n${func.examples?.join('\n') || ''}`,
      detail: func.category || '函数',
      range: range,
      sortText: '2'
    }))
  }
  
  /**
   * 获取变量补全建议
   */
  getVariableSuggestions(range) {
    const variables = this.formulaService.getAllVariables()
    
    return variables.map(variable => ({
      label: variable.name,
      kind: monaco.languages.CompletionItemKind.Variable,
      insertText: variable.name,
      documentation: variable.description,
      detail: `变量 (${variable.type})`,
      range: range,
      sortText: '3'
    }))
  }
  
  /**
   * 获取运算符补全建议
   */
  getOperatorSuggestions(range) {
    const operators = [
      { label: '+', insertText: '+', doc: '加法运算' },
      { label: '-', insertText: '-', doc: '减法运算' },
      { label: '*', insertText: '*', doc: '乘法运算' },
      { label: '/', insertText: '/', doc: '除法运算' },
      { label: '^', insertText: '^', doc: '幂运算' },
      { label: '=', insertText: '=', doc: '等于比较' },
      { label: '!=', insertText: '!=', doc: '不等于比较' },
      { label: '<', insertText: '<', doc: '小于比较' },
      { label: '>', insertText: '>', doc: '大于比较' },
      { label: '<=', insertText: '<=', doc: '小于等于比较' },
      { label: '>=', insertText: '>=', doc: '大于等于比较' },
      { label: 'AND', insertText: 'AND', doc: '逻辑与' },
      { label: 'OR', insertText: 'OR', doc: '逻辑或' },
      { label: 'NOT', insertText: 'NOT', doc: '逻辑非' }
    ]
    
    return operators.map(op => ({
      label: op.label,
      kind: monaco.languages.CompletionItemKind.Operator,
      insertText: op.insertText,
      documentation: op.doc,
      range: range,
      sortText: '4'
    }))
  }
  
  /**
   * 获取模板补全建议
   */
  getTemplateSuggestions(range) {
    const templates = [
      {
        name: 'ratio',
        label: '比率公式',
        insertText: 'IF(${1:分子} != 0, ROUND(${2:分子} / ${3:分母}, 2), 0)',
        doc: '分子/分母，自动处理除零'
      },
      {
        name: 'profit_rate',
        label: '利润率公式',
        insertText: 'IF(${1:收入} != 0, ROUND((${2:收入} - ${3:成本}) / ${1:收入} * 100, 2), 0)',
        doc: '(收入-成本)/收入*100'
      },
      {
        name: 'growth',
        label: '增长率公式',
        insertText: 'IF(${2:上期值} != 0, ROUND((${1:本期值} - ${2:上期值}) / ${2:上期值} * 100, 2), 0)',
        doc: '(本期-上期)/上期*100'
      },
      {
        name: 'complete_rate',
        label: '完成率公式',
        insertText: 'ROUND(${1:实际值} / ${2:目标值} * 100, 2)',
        doc: '实际/目标*100'
      },
      {
        name: 'yoy',
        label: '同比增长公式',
        insertText: 'YOY(${1:本期值}, ${2:去年同期值})',
        doc: '同比增长率计算'
      },
      {
        name: 'mom',
        label: '环比增长公式',
        insertText: 'MOM(${1:本期值}, ${2:上期值})',
        doc: '环比增长率计算'
      }
    ]
    
    return templates.map(template => ({
      label: template.label,
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: template.insertText,
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: template.doc,
      detail: '公式模板',
      range: range,
      sortText: '5'
    }))
  }
  
  /**
   * 构建函数插入文本（带参数占位符）
   */
  buildInsertText(func) {
    if (!func.params || func.params.length === 0) {
      return ''
    }
    
    const placeholders = func.params.map((param, index) => {
      return `\${${index + 1}:${param.name}}`
    })
    
    return placeholders.join(', ')
  }
  
  /**
   * 判断是否是标识符开始
   */
  isIdentifierStart(text) {
    const lastChar = text.trim().slice(-1)
    return /[a-zA-Z_\u4e00-\u9fa5]/.test(lastChar)
  }
  
  /**
   * 判断是否是函数开始
   */
  isFunctionStart(text) {
    const trimmed = text.trim()
    const tokens = trimmed.split(/[\s+\-*\/\(\)\[\],]/)
    const lastToken = tokens[tokens.length - 1]
    
    return lastToken && /^[A-Z]+$/.test(lastToken) && lastToken.length > 0
  }
}

/**
 * FormulaHoverProvider - Hover提示提供器
 */
export class FormulaHoverProvider {
  constructor(formulaService) {
    this.formulaService = formulaService
    this.initProvider()
  }
  
  /**
   * 初始化Provider
   */
  initProvider() {
    monaco.languages.registerHoverProvider('formula', {
      provideHover: (model, position) => {
        const word = model.getWordAtPosition(position)
        
        if (!word) {
          return null
        }
        
        const lineContent = model.getLineContent(position.lineNumber)
        const wordStart = word.startColumn - 1
        const wordEnd = word.endColumn - 1
        
        // 检查是否是方括号内的指标
        const bracketMatch = this.extractBracketedIndicator(lineContent, position.column - 1)
        
        if (bracketMatch) {
          const indicator = this.formulaService.getIndicator(bracketMatch)
          
          if (indicator) {
            return {
              contents: [
                { value: `**${indicator.name}**` },
                { value: `类型: ${indicator.type}` },
                { value: `编码: ${indicator.code}` },
                { value: `${indicator.description || ''}` }
              ],
              range: new monaco.Range(
                position.lineNumber,
                bracketMatch.start + 1,
                position.lineNumber,
                bracketMatch.end + 1
              )
            }
          }
        }
        
        // 检查是否是函数
        const func = this.formulaService.engine.functionRegistry.get(word.word)
        
        if (func) {
          return {
            contents: [
              { value: `**${func.name}()** - ${func.description}` },
              { value: `签名: ${func.signature}` },
              { value: `示例:\n${func.examples?.map(e => `- ${e}`).join('\n') || '暂无示例'}` }
            ],
            range: new monaco.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn
            )
          }
        }
        
        // 检查是否是变量
        if (word.word.startsWith('$')) {
          const variable = this.formulaService.getVariable(word.word)
          
          if (variable) {
            return {
              contents: [
                { value: `**${variable.name}** - ${variable.description}` },
                { value: `类型: ${variable.type}` },
                { value: `当前值: ${variable.value}` }
              ],
              range: new monaco.Range(
                position.lineNumber,
                word.startColumn,
                position.lineNumber,
                word.endColumn
              )
            }
          }
        }
        
        // 检查是否是普通标识符（指标）
        const indicator = this.formulaService.getIndicator(word.word)
        
        if (indicator) {
          return {
            contents: [
              { value: `**${indicator.name}**` },
              { value: `类型: ${indicator.type}` },
              { value: `编码: ${indicator.code}` },
              { value: `${indicator.description || ''}` }
            ],
            range: new monaco.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn
            )
          }
        }
        
        return null
      }
    })
  }
  
  /**
   * 提取方括号内的指标名
   */
  extractBracketedIndicator(line, column) {
    // 查找包含当前列位置的方括号对
    let start = -1
    let end = -1
    
    for (let i = column; i >= 0; i--) {
      if (line[i] === '[') {
        start = i
        break
      }
    }
    
    for (let i = column; i < line.length; i++) {
      if (line[i] === ']') {
        end = i
        break
      }
    }
    
    if (start !== -1 && end !== -1 && start < end) {
      return {
        name: line.substring(start + 1, end),
        start: start,
        end: end
      }
    }
    
    return null
  }
}

/**
 * FormulaSignatureHelpProvider - 参数提示提供器
 */
export class FormulaSignatureHelpProvider {
  constructor(formulaService) {
    this.formulaService = formulaService
    this.initProvider()
  }
  
  /**
   * 初始化Provider
   */
  initProvider() {
    monaco.languages.registerSignatureHelpProvider('formula', {
      triggerCharacters: ['(', ','],
      
      provideSignatureHelp: (model, position, token, context) => {
        // 查找当前光标所在的函数调用
        const textUntilPosition = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        })
        
        // 提取函数名和当前参数位置
        const funcCall = this.extractCurrentFunctionCall(textUntilPosition)
        
        if (!funcCall) {
          return { signatures: [], activeSignature: 0, activeParameter: 0 }
        }
        
        // 获取函数定义
        const func = this.formulaService.engine.functionRegistry.get(funcCall.functionName)
        
        if (!func) {
          return { signatures: [], activeSignature: 0, activeParameter: 0 }
        }
        
        // 构建签名信息
        const signatures = [{
          label: func.signature,
          documentation: func.description,
          parameters: func.params?.map(param => ({
            label: param.name,
            documentation: `${param.description} (${param.type})${param.required ? ' - 必填' : ''}`
          })) || []
        }]
        
        return {
          signatures: signatures,
          activeSignature: 0,
          activeParameter: funcCall.parameterIndex
        }
      }
    })
  }
  
  /**
   * 提取当前函数调用信息
   */
  extractCurrentFunctionCall(text) {
    // 向前查找最近的函数调用
    let depth = 0
    let funcName = null
    let commaCount = 0
    
    for (let i = text.length - 1; i >= 0; i--) {
      const char = text[i]
      
      if (char === ')') {
        depth++
      } else if (char === '(') {
        depth--
        
        if (depth < 0) {
          // 找到了函数调用的开始括号
          // 向前查找函数名
          let nameStart = i - 1
          while (nameStart >= 0 && /[A-Z]/.test(text[nameStart])) {
            nameStart--
          }
          
          funcName = text.substring(nameStart + 1, i)
          
          return {
            functionName: funcName,
            parameterIndex: commaCount
          }
        }
      } else if (char === ',' && depth === 0) {
        commaCount++
      }
    }
    
    return null
  }
}

/**
 * FormulaDiagnosticsProvider - 错误诊断提供器
 */
export class FormulaDiagnosticsProvider {
  constructor(formulaService) {
    this.formulaService = formulaService
    this.initProvider()
  }
  
  /**
   * 初始化Provider
   */
  initProvider() {
    // 使用 monaco.editor.setModelMarkers 设置错误标记
    // 这个Provider会在编辑器内容变化时触发验证
  }
  
  /**
   * 验证公式并设置标记
   */
  validateAndSetMarkers(model) {
    const code = model.getValue()
    
    // 使用FormulaService验证公式
    const validation = this.formulaService.validateFormula(code)
    
    const markers = []
    
    // 转换错误为Monaco Marker
    for (const error of validation.errors) {
      markers.push({
        severity: this.mapSeverity(error.severity),
        message: error.message,
        startLineNumber: error.location?.start?.line || 1,
        startColumn: error.location?.start?.column || 1,
        endLineNumber: error.location?.end?.line || 1,
        endColumn: error.location?.end?.column || 100,
        source: 'Formula Validator',
        code: error.type
      })
    }
    
    // 转换警告
    for (const warning of validation.warnings) {
      markers.push({
        severity: monaco.MarkerSeverity.Warning,
        message: warning.message,
        startLineNumber: warning.location?.start?.line || 1,
        startColumn: warning.location?.start?.column || 1,
        endLineNumber: warning.location?.end?.line || 1,
        endColumn: warning.location?.end?.column || 100,
        source: 'Formula Validator',
        code: warning.type
      })
    }
    
    // 设置标记
    monaco.editor.setModelMarkers(model, 'formula', markers)
    
    return markers
  }
  
  /**
   * 映射严重级别
   */
  mapSeverity(severity) {
    switch (severity) {
      case 'error':
        return monaco.MarkerSeverity.Error
      case 'warning':
        return monaco.MarkerSeverity.Warning
      case 'info':
        return monaco.MarkerSeverity.Info
      case 'hint':
        return monaco.MarkerSeverity.Hint
      default:
        return monaco.MarkerSeverity.Error
    }
  }
}

/**
 * FormulaFormatter - 公式格式化器
 */
export class FormulaFormatter {
  constructor(formulaService) {
    this.formulaService = formulaService
    this.initProvider()
  }
  
  /**
   * 初始化Provider
   */
  initProvider() {
    monaco.languages.registerDocumentFormattingEditProvider('formula', {
      provideDocumentFormattingEdits: (model, options, token) => {
        const code = model.getValue()
        const formatted = this.format(code)
        
        return [{
          range: model.getFullModelRange(),
          text: formatted
        }]
      }
    })
    
    // 注册范围格式化Provider
    monaco.languages.registerDocumentRangeFormattingEditProvider('formula', {
      provideDocumentRangeFormattingEdits: (model, range, options, token) => {
        const code = model.getValueInRange(range)
        const formatted = this.format(code)
        
        return [{
          range: range,
          text: formatted
        }]
      }
    })
  }
  
  /**
   * 格式化公式代码
   */
  format(code) {
    // 简单格式化逻辑
    let formatted = code
    
    // 1. 去除多余空格
    formatted = formatted.replace(/\s+/g, ' ')
    
    // 2. 函数名标准化（大写）
    formatted = formatted.replace(/\b([a-z]+)(\s*\()/gi, (match, name, bracket) => {
      return name.toUpperCase() + bracket
    })
    
    // 3. 括号前后添加空格（可选）
    // formatted = formatted.replace(/\(/g, ' ( ')
    // formatted = formatted.replace(/\)/g, ' ) ')
    
    // 4. 运算符前后添加空格
    formatted = formatted.replace(/([+\-*/^=<>!])/g, ' $1 ')
    
    // 5. 逗号后添加空格
    formatted = formatted.replace(/,/g, ', ')
    
    // 6. 清理多余空格
    formatted = formatted.trim()
    
    return formatted
  }
}

/**
 * FormulaMonacoEditor - Monaco编辑器封装
 */
export class FormulaMonacoEditor {
  constructor(container, formulaService, options = {}) {
    this.formulaService = formulaService
    this.container = container
    this.options = options
    
    // 初始化语言定义
    this.languageDefinition = new FormulaLanguageDefinition()
    
    // 初始化Providers
    this.completionProvider = new FormulaCompletionProvider(formulaService)
    this.hoverProvider = new FormulaHoverProvider(formulaService)
    this.signatureHelpProvider = new FormulaSignatureHelpProvider(formulaService)
    this.diagnosticsProvider = new FormulaDiagnosticsProvider(formulaService)
    this.formatter = new FormulaFormatter(formulaService)
    
    // 创建编辑器实例
    this.editor = null
  }
  
  /**
   * 创建编辑器
   */
  createEditor() {
    this.editor = monaco.editor.create(this.container, {
      value: this.options.value || '',
      language: 'formula',
      theme: this.options.theme || 'vs',
      fontSize: this.options.fontSize || 14,
      fontFamily: this.options.fontFamily || 'Consolas, Monaco, monospace',
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
      },
      ...this.options.editorOptions
    })
    
    // 监听内容变化，触发验证
    this.editor.onDidChangeModelContent(() => {
      this.validate()
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
   * 设置公式内容
   */
  setValue(value) {
    if (this.editor) {
      this.editor.setValue(value)
    }
  }
  
  /**
   * 获取公式内容
   */
  getValue() {
    if (this.editor) {
      return this.editor.getValue()
    }
    return ''
  }
  
  /**
   * 验证公式
   */
  validate() {
    if (this.editor) {
      const model = this.editor.getModel()
      this.diagnosticsProvider.validateAndSetMarkers(model)
    }
  }
  
  /**
   * 格式化公式
   */
  format() {
    if (this.editor) {
      const actions = this.editor.getSupportedActions()
      const formatAction = actions.find(action => action.id === 'editor.action.formatDocument')
      
      if (formatAction) {
        formatAction.run()
      }
    }
  }
  
  /**
   * 设置主题
   */
  setTheme(theme) {
    monaco.editor.setTheme(theme)
  }
  
  /**
   * 销毁编辑器
   */
  dispose() {
    if (this.editor) {
      this.editor.dispose()
      this.editor = null
    }
  }
}

/**
 * createFormulaEditor - 创建公式编辑器实例
 */
export function createFormulaEditor(container, formulaService, options = {}) {
  const editor = new FormulaMonacoEditor(container, formulaService, options)
  return editor.createEditor()
}