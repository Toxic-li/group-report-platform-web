import { ref, onBeforeUnmount } from 'vue'
import { createFormulaService } from '@/services/formula'
import { FormulaMonacoEditor } from '@/services/formula/editor/FormulaMonacoEditor'

const formulaService = createFormulaService()

export function useFormulaEditor(formulaData, handleFormulaChange, showNotification) {
  const editorContainer = ref(null)
  let monacoEditorInstance = null
  let monacoEditor = null

  const monacoLoading = ref(false)
  const monacoLoaded = ref(false)
  const cursorPosition = ref({ line: 1, column: 1 })
  const editorTheme = ref('vs-light')
  const isFullscreen = ref(false)

  function setEditorContainer(container) {
    editorContainer.value = container?.value || container
  }

  function insertTextAtCursor(text) {
    let expr = formulaData.expression || ''
    if (expr.includes('?')) {
      formulaData.expression = expr.replace('?', text)
      if (monacoEditor) {
        monacoEditor.setValue(formulaData.expression)
        monacoEditor.focus()
      }
      handleFormulaChange()
      return true
    }

    const trimmed = expr.trimEnd()
    if (trimmed.endsWith(')')) {
      formulaData.expression = trimmed.slice(0, -1) + ', ' + text + ')'
      if (monacoEditor) {
        monacoEditor.setValue(formulaData.expression)
        monacoEditor.focus()
      }
      handleFormulaChange()
      return true
    }

    if (monacoEditor) {
      const position = monacoEditor.getPosition()
      monacoEditor.executeEdits('', [{
        range: new window.monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
        text: text
      }])
      monacoEditor.focus()
      return true
    }

    formulaData.expression = expr + text
    handleFormulaChange()
    return true
  }

  const performanceMetrics = ref({
    monacoLoadTime: null,
    firstRenderTime: null,
    searchTime: null,
    calculationTime: null
  })

  async function initializeMonacoEditor() {
    if (!editorContainer.value) {
      console.error('Editor container is null, cannot initialize Monaco Editor')
      return
    }

    console.log('Initializing Monaco Editor, container:', editorContainer.value)

    try {
      monacoEditorInstance = new FormulaMonacoEditor(formulaService)
      console.log('FormulaMonacoEditor instance created')

      await monacoEditorInstance.initialize()
      console.log('FormulaMonacoEditor initialized successfully')

      monacoEditor = monacoEditorInstance.createEditor(editorContainer.value, {
        theme: 'vs',
        fontSize: 14,
        fontFamily: 'JetBrains Mono, Consolas, monospace',
        value: formulaData.expression || '',
        minimap: { enabled: false },
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        wordWrap: 'on'
      })

      console.log('Monaco Editor created:', monacoEditor)

      monacoEditor.onDidChangeModelContent((event) => {
        formulaData.expression = monacoEditor.getValue()
        handleFormulaChange()
      })

      monacoEditor.onDidChangeCursorPosition((e) => {
        cursorPosition.value = { line: e.position.lineNumber, column: e.position.column }
      })

      monacoLoaded.value = true
      console.log('Monaco Editor initialized successfully, loaded:', monacoLoaded.value)
      showNotification && showNotification('success', '✓', '公式编辑器加载成功')
    } catch (error) {
      console.error('Failed to initialize Monaco Editor:', error)
      showNotification && showNotification('error', '⚠️', '公式编辑器加载失败: ' + error.message)
    }
  }

  async function loadMonacoEditor(container) {
    if (container) {
      setEditorContainer(container)
    }
    if (!editorContainer.value) {
      console.warn('Editor container is null, waiting for next load call')
      return
    }
    monacoLoading.value = true
    const startTime = performance.now()
    try {
      await initializeMonacoEditor()
      performanceMetrics.value.monacoLoadTime = performance.now() - startTime
    } catch (error) {
      console.error('Failed to load Monaco:', error)
    } finally {
      monacoLoading.value = false
    }
  }

  function insertIndicator(indicator) {
    const text = indicator.category === 'cell' && indicator.excelRef 
      ? indicator.excelRef 
      : `[${indicator.name}]`
    insertTextAtCursor(text)
  }

  function insertFunction(func) {
    const params = func.params || []
    const argsText = params.length > 0 ? '?' : ''
    const insertText = `${func.name}(${argsText})`
    insertTextAtCursor(insertText)

    if (monacoEditor && params.length > 0) {
      const position = monacoEditor.getPosition()
      monacoEditor.setPosition({
        lineNumber: position.lineNumber,
        column: position.column - 2
      })
      monacoEditor.focus()
    }
  }

  function insertOperator(operator) {
    insertTextAtCursor(operator + ' ')
  }

  function insertParentheses() {
    insertTextAtCursor('()')
    if (monacoEditor) {
      const position = monacoEditor.getPosition()
      monacoEditor.setPosition({ lineNumber: position.lineNumber, column: position.column - 1 })
    }
  }

  function insertBracket() {
    insertTextAtCursor('[]')
    if (monacoEditor) {
      const position = monacoEditor.getPosition()
      monacoEditor.setPosition({ lineNumber: position.lineNumber, column: position.column - 1 })
    }
  }

  function insertBraces() {
    insertTextAtCursor('{}')
    if (monacoEditor) {
      const position = monacoEditor.getPosition()
      monacoEditor.setPosition({ lineNumber: position.lineNumber, column: position.column - 1 })
      monacoEditor.focus()
    }
  }

  function insertComma() {
    insertTextAtCursor(', ')
  }

  function formatFormula() {
    if (!monacoEditor) return
    const action = monacoEditor.getAction('editor.action.formatDocument')
    if (action) {
      action.run()
      showNotification && showNotification('success', '📐', '公式已格式化')
    }
  }

  function clearFormula() {
    formulaData.expression = ''
    if (monacoEditor) {
      monacoEditor.setValue('')
    }
  }

  function copyFormula() {
    if (!monacoEditor) return
    monacoEditor.getAction('editor.action.clipboardCopyAction').run()
    showNotification && showNotification('success', '✓', '公式已复制到剪贴板')
  }

  function undoFormula() {
    if (!monacoEditor) return
    monacoEditor.trigger('', 'undo', null)
  }

  function redoFormula() {
    if (!monacoEditor) return
    monacoEditor.trigger('', 'redo', null)
  }

  function findInFormula() {
    if (!monacoEditor) return
    monacoEditor.trigger('', 'actions.find', null)
  }

  function replaceInFormula() {
    if (!monacoEditor) return
    monacoEditor.trigger('', 'editor.action.startFindReplaceAction', null)
  }

  function toggleFullscreen() {
    isFullscreen.value = !isFullscreen.value
    showNotification && showNotification('info', '👁', isFullscreen.value ? '进入全屏模式' : '退出全屏模式')
  }

  function toggleTheme() {
    editorTheme.value = editorTheme.value === 'vs-light' ? 'vs-dark' : 'vs-light'
    if (window.monaco && monacoEditor) {
      window.monaco.editor.setTheme(editorTheme.value)
    }
    showNotification && showNotification('info', '🎨', editorTheme.value === 'vs-dark' ? '切换到深色主题' : '切换到浅色主题')
  }

  function showHelp() {
    showNotification && showNotification('info', '📖', '帮助文档即将打开')
  }

  function applyTemplate(template) {
    if (!monacoEditor) return
    monacoEditor.setValue(template.template)
    formulaData.expression = template.template
    showNotification && showNotification('success', '✓', `已应用模板：${template.name}`)
  }

  function insertCell(cell) {
    const text = cell.excelRef
    insertTextAtCursor(text)
  }

  function setValue(value) {
    if (monacoEditor) {
      monacoEditor.setValue(value)
      formulaData.expression = value
    }
  }

  function getValue() {
    return monacoEditor ? monacoEditor.getValue() : formulaData.expression
  }

  onBeforeUnmount(() => {
    if (monacoEditorInstance) {
      monacoEditorInstance.destroy()
      monacoEditorInstance = null
      monacoEditor = null
    }
  })

  return {
    editorContainer,
    monacoLoading,
    monacoLoaded,
    cursorPosition,
    editorTheme,
    isFullscreen,
    performanceMetrics,

    loadMonacoEditor,
    insertIndicator,
    insertFunction,
    insertOperator,
    insertParentheses,
    insertBracket,
    insertBraces,
    insertComma,
    formatFormula,
    clearFormula,
    copyFormula,
    undoFormula,
    redoFormula,
    findInFormula,
    replaceInFormula,
    toggleFullscreen,
    toggleTheme,
    showHelp,
    applyTemplate,
    insertCell,
    setValue,
    getValue,
    getMonacoEditor: () => monacoEditor
  }
}