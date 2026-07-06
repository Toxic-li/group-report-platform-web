import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { createFormulaService } from '@/services/formula'

const formulaService = createFormulaService()

export function useFormulaDesigner(props, emit) {
  const formulaData = reactive({
    id: '',
    name: '',
    code: '',
    category: 'basic',
    description: '',
    expression: '',
    resultType: 'number',
    displayFormat: '#,##0.00',
    precision: 2,
    status: 'draft',
    version: 1,
    targetCells: []
  })

  const showDescription = ref(false)
  const validationResult = ref(null)
  const formulaStatus = ref('unknown')
  const formulaStatusText = computed(() => {
    if (formulaStatus.value === 'valid') return '✓ 公式正确'
    if (formulaStatus.value === 'invalid') return '✗ 公式有误'
    return '○ 未验证'
  })

  const notification = ref(null)
  const executionTime = ref(null)
  const previewResult = ref(null)
  const debugLog = ref([])
  const dependencyTree = ref([])
  const hasCircularDependency = ref(false)
  const formulaHistory = ref([])
  const mockData = reactive({})

  const formulaTemplates = ref([
    { name: '比率公式', icon: '%', description: '分子/分母，自动处理除零', template: 'IF(${1:分子} != 0, ROUND(${2:分子} / ${3:分母}, 2), 0)' },
    { name: '利润率', icon: '💰', description: '(收入-成本)/收入*100', template: 'IF(${1:收入} != 0, ROUND((${2:收入} - ${3:成本}) / ${1:收入} * 100, 2), 0)' },
    { name: '增长率', icon: '📈', description: '(本期-上期)/上期*100', template: 'IF(${2:上期值} != 0, ROUND((${1:本期值} - ${2:上期值}) / ${2:上期值} * 100, 2), 0)' },
    { name: '完成率', icon: '✅', description: '实际/目标*100', template: 'ROUND(${1:实际值} / ${2:目标值} * 100, 2)' },
    { name: '同比增长', icon: '📊', description: 'YOY同比计算', template: 'YOY(${1:本期值}, ${2:去年同期值})' },
    { name: '环比增长', icon: '📉', description: 'MOM环比计算', template: 'MOM(${1:本期值}, ${2:上期值})' }
  ])

  const referencedCells = ref([])
  const referencedIndicators = ref([])

  const activeTab = ref('workbench')
  const footerCollapsed = ref(false)

  const resultViewMode = ref('value')
  const currentStep = ref(0)
  const canStep = ref(false)
  const currentVariables = reactive({})

  const leftWidth = ref(280)
  const rightWidth = ref(320)

  const expandedFooter = reactive({
    templates: false,
    preview: false,
    debugger: false,
    dependencies: false,
    history: false
  })

  const formulaList = ref([
    { id: '1', name: '利润率', code: 'profitRate', category: 'business', resultType: 'number', status: 'published', version: 1 },
    { id: '2', name: '增长率', code: 'growthRate', category: 'time_analysis', resultType: 'number', status: 'draft', version: 2 }
  ])

  function showNotification(type, icon, message) {
    notification.value = { type, icon, message }
    setTimeout(() => {
      notification.value = null
    }, 3000)
  }

  function handleConfigChange() {
    emit('change', formulaData)
  }

  function handleFormulaChange() {
    if (formulaData.expression) {
      handleValidate()
    }
    emit('change', formulaData)
  }

  async function handleSave() {
    try {
      let result
      if (formulaData.id) {
        result = await formulaService.updateFormula(formulaData.id, formulaData)
      } else {
        result = await formulaService.createFormula(formulaData)
        if (result.success) {
          formulaData.id = result.formula.id
        }
      }
      if (result.success) {
        showNotification('success', '✓', '公式保存成功')
        emit('save', result.formula)
        formulaHistory.value = formulaService.getFormulaHistory(formulaData.id)
      } else {
        showNotification('error', '✗', result.message)
      }
    } catch (error) {
      showNotification('error', '✗', '保存失败：' + error.message)
    }
  }

  function handleValidate() {
    let expr = (formulaData.expression || '').trim()
    // 去掉 Excel 风格的等号前缀
    if (expr.startsWith('=')) {
      expr = expr.slice(1).trim()
    }
    if (!expr) {
      validationResult.value = null
      formulaStatus.value = 'unknown'
      return
    }
    validationResult.value = formulaService.validateFormula(expr)
    formulaStatus.value = validationResult.value.valid ? 'valid' : 'invalid'
    if (validationResult.value.dependencies.length > 0) {
      updateDependencyTree()
    }
  }

  async function handlePreview() {
    if (!formulaData.expression) {
      showNotification('warning', '⚠', '请先输入公式')
      return
    }
    generateMockData()
    runPreview()
    expandedFooter.preview = true
    expandedFooter.debugger = true
  }

  async function handlePublish() {
    try {
      const result = await formulaService.publishFormula(formulaData.id)
      if (result.success) {
        formulaData.status = 'published'
        showNotification('success', '✓', '公式发布成功')
        emit('publish', result.formula)
      } else {
        showNotification('error', '✗', result.message)
      }
    } catch (error) {
      showNotification('error', '✗', '发布失败：' + error.message)
    }
  }

  function toggleDescription() {
    showDescription.value = !showDescription.value
  }

  function generateMockData() {
    if (!validationResult.value || validationResult.value.dependencies.length === 0) return
    Object.keys(mockData).forEach(key => delete mockData[key])
    for (const dep of validationResult.value.dependencies) {
      mockData[dep] = Math.floor(Math.random() * 90000 + 100)
    }
  }

  function runPreview() {
    if (!formulaData.expression) {
      showNotification('warning', '⚠', '请先输入公式')
      return
    }
    const startTime = performance.now()
    try {
      const result = formulaService.evaluateFormula(formulaData.expression, { indicators: mockData })
      previewResult.value = result.value
      debugLog.value = result.metadata?.debugLog || []
      executionTime.value = Math.round(performance.now() - startTime)
      if (!result.success) {
        showNotification('error', '✗', '计算失败：' + (result.errors?.[0]?.message || '未知错误'))
      } else {
        showNotification('success', '✓', `计算完成 (${executionTime.value}ms)`)
      }
    } catch (error) {
      console.error('Preview calculation error:', error)
      showNotification('error', '✗', '计算异常：' + error.message)
    }
  }

  function updateDependencyTree() {
    if (!formulaData.id) return
    const tree = formulaService.getDependencyTree(formulaData.id)
    dependencyTree.value = tree ? [tree] : []
  }

  function analyzeDependencies() {
    if (!formulaData.expression) {
      showNotification('warning', '!', '请先输入公式')
      return
    }
    const result = formulaService.validateFormula(formulaData.expression)
    if (result && result.valid) {
      dependencyTree.value = buildDependencyTree(result.dependencies)
      hasCircularDependency.value = checkCircularDependency(dependencyTree.value)
      showNotification('success', '✓', '依赖分析完成')
    } else {
      showNotification('error', '✗', '公式验证失败，无法分析依赖')
    }
  }

  function buildDependencyTree(dependencies) {
    const tree = []
    dependencies.forEach((dep, index) => {
      tree.push({
        id: dep,
        name: getIndicatorName(dep),
        code: dep,
        type: 'indicator',
        level: 0
      })
    })
    return tree
  }

  function checkCircularDependency(tree) {
    return false
  }

  function jumpToDependency(dep) {
    showNotification('info', '👁', `跳转到: ${dep.name}`)
  }

  function restoreVersion(version) {
    try {
      const result = formulaService.restoreHistoryVersion(formulaData.id, version.version)
      if (result.success) {
        Object.assign(formulaData, result.formula)
        showNotification('success', '✓', `已恢复到版本 V${version.version}`)
      } else {
        showNotification('error', '✗', result.message)
      }
    } catch (error) {
      showNotification('error', '✗', '恢复失败：' + error.message)
    }
  }

  function formatDate(date) {
    if (!date) return ''
    return new Date(date).toLocaleString('zh-CN')
  }

  function startResize(direction, event) {
    let isResizing = true
    const startX = event.clientX
    const startWidth = direction === 'left' ? leftWidth.value : rightWidth.value

    function handleResize(event) {
      if (!isResizing) return
      const diff = event.clientX - startX
      if (direction === 'left') {
        leftWidth.value = Math.max(200, Math.min(400, startWidth + diff))
      } else {
        rightWidth.value = Math.max(200, Math.min(400, startWidth - diff))
      }
    }

    function stopResize() {
      isResizing = false
      document.removeEventListener('mousemove', handleResize)
      document.removeEventListener('mouseup', stopResize)
    }

    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', stopResize)
  }

  function toggleFooter(section) {
    expandedFooter[section] = !expandedFooter[section]
  }

  function switchTab(tab) {
    activeTab.value = tab
    if (tab === 'workbench' || tab === 'list') {
      refreshReferences()
    }
  }

  function toggleFooterCollapse() {
    footerCollapsed.value = !footerCollapsed.value
  }

  function collapseFooter() {
    footerCollapsed.value = true
  }

  function refreshReferences() {
    if (!formulaData.expression) {
      referencedCells.value = []
      referencedIndicators.value = []
      return
    }
    const expression = formulaData.expression
    const cellRefPattern = /[A-Za-z]+\d+/g
    const indicatorPattern = /\{[\w.]+\}/g
    const cellRefs = expression.match(cellRefPattern) || []
    const indicatorRefs = expression.match(indicatorPattern) || []

    referencedCells.value = cellRefs.map(ref => {
      const match = ref.match(/([A-Za-z]+)(\d+)/)
      if (match) {
        const col = match[1].toUpperCase().charCodeAt(0) - 65
        const row = parseInt(match[2]) - 1
        return {
          id: `${row}-${col}`,
          excelRef: ref,
          row,
          col,
          category: 'cell',
          rowLabel: `行${row + 1}`,
          colLabel: match[1].toUpperCase()
        }
      }
      return null
    }).filter(Boolean)

    referencedIndicators.value = indicatorRefs.map(ref => {
      const code = ref.replace(/[{}]/g, '')
      const indicator = formulaService.getIndicator(code)
      return indicator || {
        id: code,
        name: code,
        code,
        category: 'indicator'
      }
    })
  }

  function getIndicatorName(code) {
    const indicator = formulaService.getIndicator(code)
    return indicator ? indicator.name : code
  }

  function getCategoryName(category) {
    const names = {
      basic: '基础公式',
      aggregate: '聚合公式',
      logical: '条件公式',
      time_analysis: '时间分析',
      business: '业务公式'
    }
    return names[category] || '其他'
  }

  function addNewFormula() {
    Object.assign(formulaData, {
      id: `formula_${Date.now()}`,
      name: '',
      code: '',
      category: 'basic',
      expression: '',
      resultType: 'number',
      precision: 2,
      displayFormat: '#,##0.00',
      description: '',
      status: 'draft',
      targetCells: []
    })
    activeTab.value = 'editor'
  }

  function editFormula(formula) {
    Object.assign(formulaData, formula)
    activeTab.value = 'editor'
  }

  function deleteFormula(formula) {
    const index = formulaList.value.findIndex(f => f.id === formula.id)
    if (index > -1) {
      formulaList.value.splice(index, 1)
    }
  }

  function addSimulationInput() {
    if (validationResult.value && validationResult.value.dependencies.length > 0) {
      const availableIndicators = validationResult.value.dependencies.filter(dep => !mockData[dep])
      if (availableIndicators.length > 0) {
        const newIndicator = availableIndicators[0]
        mockData[newIndicator] = 1000
        showNotification('success', '✓', `已添加指标: ${newIndicator}`)
      } else {
        showNotification('warning', '!', '所有依赖指标已添加')
      }
    } else {
      showNotification('info', '💡', '请先验证公式以识别依赖指标')
    }
  }

  function deleteSimulationInput(key) {
    delete mockData[key]
  }

  function clearSimulation() {
    Object.keys(mockData).forEach(key => delete mockData[key])
    previewResult.value = null
    executionTime.value = null
    showNotification('info', '🗑', '模拟数据已清空')
  }

  function runSimulationCalculation() {
    if (!formulaData.expression) {
      showNotification('warning', '!', '请先输入公式')
      return
    }
    const startTime = performance.now()
    try {
      previewResult.value = formulaService.calculate(formulaData.expression, mockData)
      executionTime.value = Math.round(performance.now() - startTime)
      showNotification('success', '✓', '计算完成')
    } catch (error) {
      showNotification('error', '✗', '计算失败: ' + error.message)
    }
  }

  function startDebugger() {
    if (!formulaData.expression) {
      showNotification('warning', '!', '请先输入公式')
      return
    }
    try {
      debugLog.value = formulaService.debugFormula(formulaData.expression, mockData)
      currentStep.value = 0
      canStep.value = debugLog.value.length > 0
      Object.keys(currentVariables).forEach(key => delete currentVariables[key])
      if (debugLog.value.length > 0) {
        currentVariables[debugLog.value[0].expression] = debugLog.value[0].value
      }
      showNotification('success', '✓', '调试器已启动')
    } catch (error) {
      showNotification('error', '✗', '调试器启动失败: ' + error.message)
    }
  }

  function stepDebugger() {
    if (currentStep.value < debugLog.value.length - 1) {
      currentStep.value++
      const currentLog = debugLog.value[currentStep.value]
      currentVariables[currentLog.expression] = currentLog.value
      canStep.value = currentStep.value < debugLog.value.length - 1
    }
  }

  function runAllDebugger() {
    currentStep.value = debugLog.value.length - 1
    debugLog.value.forEach(log => {
      currentVariables[log.expression] = log.value
    })
    canStep.value = false
  }

  function resetDebugger() {
    currentStep.value = 0
    Object.keys(currentVariables).forEach(key => delete currentVariables[key])
    canStep.value = debugLog.value.length > 0
    showNotification('info', '🔄', '调试器已重置')
  }

  function applyTemplateToEditor(template) {
    if (template.template) {
      formulaData.expression = template.template
      showNotification('success', '✓', `已应用模板: ${template.name}`)
    }
  }

  function restoreFormulaVersion(version) {
    if (version && version.expression) {
      formulaData.expression = version.expression
      formulaData.version = version.version
      showNotification('success', '✓', `已恢复到 V${version.version}`)
    }
  }

  onMounted(() => {
    if (props.initialFormula) {
      Object.assign(formulaData, props.initialFormula)
    }
    if (formulaData.id) {
      formulaHistory.value = formulaService.getFormulaHistory(formulaData.id)
    }
  })

  watch(() => formulaData.expression, () => {
    handleFormulaChange()
  })

  return {
    formulaData,
    showDescription,
    validationResult,
    formulaStatus,
    formulaStatusText,
    notification,
    executionTime,
    previewResult,
    debugLog,
    dependencyTree,
    hasCircularDependency,
    formulaHistory,
    mockData,
    formulaTemplates,
    referencedCells,
    referencedIndicators,
    activeTab,
    footerCollapsed,
    resultViewMode,
    currentStep,
    canStep,
    currentVariables,
    leftWidth,
    rightWidth,
    expandedFooter,
    formulaList,

    handleConfigChange,
    handleSave,
    handleValidate,
    handlePreview,
    handlePublish,
    toggleDescription,
    generateMockData,
    runPreview,
    analyzeDependencies,
    jumpToDependency,
    restoreVersion,
    formatDate,
    startResize,
    toggleFooter,
    switchTab,
    toggleFooterCollapse,
    collapseFooter,
    refreshReferences,
    getIndicatorName,
    getCategoryName,
    addNewFormula,
    editFormula,
    deleteFormula,
    addSimulationInput,
    deleteSimulationInput,
    clearSimulation,
    runSimulationCalculation,
    startDebugger,
    stepDebugger,
    resetDebugger,
    runAllDebugger,
    applyTemplateToEditor,
    restoreFormulaVersion,
    showNotification
  }
}