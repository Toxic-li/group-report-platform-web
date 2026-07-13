/**
 * useReportData - 报表数据加载、配置构建、保存系统
 *
 * 从 ReportFill/index.vue 中提取的核心数据逻辑：
 * - loadReport: 加载报表模板和数据
 * - buildConfigFromV2: V2模板配置构建
 * - buildAllRows: 行数据构建
 * - 保存系统（autoSave / forceSave / forceSaveAndPublish / submitForReview）
 */
import { ref, reactive, computed, nextTick } from 'vue'
import { useReportStore } from '@/stores/reportStore.js'
import { TemplateParser } from '@/services/templateEngine.js'
import { TemplateManager } from '@/services/TemplateManager.js'
import { getTemplateById, exportToExcel } from '@/api/reportDesigner.js'
import { getReportData } from '@/api/reportData.js'
import { ReportTemplateParser } from '@/services/TemplateParser.js'
import { PermissionEngine } from '@/services/engines/PermissionEngine.js'

export function useReportData(props, { config, currentTemplate, useV2, v2Parser, selectedOrgId, selectedPeriod, formulaComposable, cfComposable, validationComposable, showToast }) {
  const store = useReportStore()

  const v2TemplateCode = ref('RPT-COAL-001')
  const loading = ref(true)
  const loadingText = ref('正在初始化报表引擎...')
  const error = ref('')
  const dataVersion = ref(0)

  const saveStatus = reactive({ visible: false, text: '', type: 'saving' })
  let permissionEngine = null

  const containerRef = ref(null)
  const bodyRef = ref(null)
  const headerRef = ref(null)
  const scrollTop = ref(0)
  const viewportH = ref(500)

  // ==================== 视图模式 ====================
  const viewMode = ref('all')
  const viewModes = [
    { key: 'all', label: '全部' },
    { key: 'summary', label: '汇总' },
    { key: 'detail', label: '明细' },
  ]
  const collapsedGroups = ref(new Set())

  const ROW_H = 40
  const ANOMALY_CONFIG = {
    inventory: { threshold: 50000, label: '库存超限' },
    growthRate: { min: -20, max: 50, label: '增长率异常' },
  }

  const METRIC_HINTS = {
    '本月': '当前统计周期的原始数据', '本月止累计': '年初至当前月的累计数值',
    '同比增量': '与上年同期相比的绝对差值', '同比增长率': '与上年同期相比的变化百分比',
    '环比增量': '与上一统计周期相比的绝对差值', '环比增长率': '与上一统计周期相比的变化百分比',
    '商品煤销量': '对外销售的商品煤总量', '原煤产量': '当月开采的原煤总量',
    '自用量': '企业内部消耗量', '存煤': '期末库存量',
    '火车运量': '铁路运输方式销量', '公路运量': '公路运输方式销量',
  }

  function getMetricHint(text) { return METRIC_HINTS[text] || null }

  // ==================== 计算属性 ====================
  const flatRows = computed(() => {
    if (useV2.value && v2Parser.value) return v2Parser.value.getFlatRows()
    if (!currentTemplate.value?.getFlatRows) return []
    return currentTemplate.value.getFlatRows()
  })

  const headerRows = computed(() => {
    if (!config.value) return []
    const rows = []
    const maxLevel = config.value.frozenRowCount || 4
    for (let l = 0; l < maxLevel; l++) {
      const cells = []
      for (let c = 2; c < (config.value.columnData || []).length; c++) {
        const cell = config.value.cellData[`${l}-${c}`]
        if (cell && cell.isHeaderStart) {
          cells.push({
            text: cell.v, level: cell.headerLevel || Math.min(l + 1, 4),
            colIdx: c, colspan: cell.colSpan || 1, rowspan: cell.rowSpan || 1,
            hint: getMetricHint(cell.v)
          })
        }
      }
      if (cells.length > 0) rows.push({ level: l, cells })
    }
    return rows
  })

  const dataColumns = computed(() => config.value ? config.value.columnData?.slice(2) || [] : [])
  const visibleColCount = computed(() => dataColumns.value.filter((_, i) => !isColHidden(i)).length)

  const colIndexMap = computed(() => {
    const map = new Map()
    if (!currentTemplate.value?.columns) return map
    const flatCols = currentTemplate.value.getFlatColumns ? currentTemplate.value.getFlatColumns() : currentTemplate.value.columns
    flatCols.forEach((col, idx) => map.set(idx, col.id))
    return map
  })

  const colGroupMap = computed(() => {
    const map = new Map()
    const flatCols = currentTemplate.value?.getFlatColumns
      ? currentTemplate.value.getFlatColumns()
      : (currentTemplate.value?.columns || [])
    for (const col of flatCols) {
      let current = col, topParentId = current.id
      while (current.parentId) {
        topParentId = current.parentId
        const parent = flatCols.find(c => c.id === current.parentId)
        if (!parent) break
        current = parent
      }
      map.set(col.id, topParentId)
    }
    return map
  })

  function isColHidden(idx) {
    const colId = colIndexMap.value.get(idx)
    if (!colId) return false
    const groupId = colGroupMap.value.get(colId)
    return groupId ? collapsedGroups.value.has(groupId) : false
  }

  const metricGroups = computed(() => {
    const rawCols = currentTemplate.value?.columnTree || currentTemplate.value?.columns || []
    const groups = []
    const seen = new Set()
    for (const col of rawCols) {
      if (!col.parentId && !seen.has(col.id)) {
        groups.push({ id: col.id, label: col.title })
        seen.add(col.id)
      }
    }
    return groups.slice(0, 6)
  })

  function buildAllRows() {
    const templateRows = flatRows.value
    if (!templateRows.length && (!config.value?.rows || !config.value.rows.length)) return []

    const result = []
    const startRow = config.value?.frozenRowCount || 4
    let displayIndex = 1

    const sourceRows = (config.value?.rows && config.value.rows.length > 0)
      ? config.value.rows : templateRows

    sourceRows.forEach((raw, idx) => {
      const rowIndex = startRow + idx
      const values = raw.values || buildRowValues(rowIndex)
      const isSummary = !!raw.isSummary
      const rowData = {
        id: raw.id || `r_${idx}`, name: raw.name, depth: raw.depth || raw.level || 0,
        isSummary, summaryType: isSummary ? (raw.summaryType || detectSummaryType(raw.name)) : '',
        isAnomaly: checkAnomaly(rowIndex, values),
        hasChildren: !!(raw.children?.length),
        values, hidden: shouldHideRow(raw), displayIndex: displayIndex++, childRows: [],
      }
      if (raw.children?.length) {
        rowData.childRows = raw.children.map((child, ci) => ({
          id: child.id || `${rowData.id}_c${ci}`, name: child.name, depth: (raw.depth || 0) + 1,
          isSummary: !!child.isSummary, summaryType: child.isSummary ? detectSummaryType(child.name) : '',
          values: buildChildValues(values), parentRowId: rowData.id,
          isChild: true,
        }))
      }
      result.push(rowData)
    })
    return result
  }

  const visibleRows = computed(() => {
    const _version = dataVersion.value
    const allRows = buildAllRows()
    const result = []
    for (const row of allRows) {
      if (viewMode.value === 'summary' && !row.isSummary) continue
      result.push(row)
      if (row.hasChildren && store.treeExpandedIds.has(row.id) && row.childRows?.length) {
        for (const child of row.childRows) {
          if (viewMode.value === 'summary' && !child.isSummary) continue
          result.push(child)
        }
      }
    }
    return result
  })

  const displayRows = computed(() => visibleRows.value)
  const anomalyCount = computed(() => displayRows.value.filter(r => r.isAnomaly).length)

  function shouldHideRow(raw) {
    return !!(raw.parentId && !store.treeExpandedIds.has(raw.parentId))
  }

  function buildRowValues(rowIndex) {
    const values = []
    const cols = config.value?.columnData || []
    for (let c = 2; c < cols.length; c++) {
      const cell = config.value?.cellData?.[`${rowIndex}-${c}`]
      if (cell) {
        values.push({
          v: cell.v, raw: cell.v,
          readOnly: !!cell.readOnly || !!cell.f,
          colIdx: c, colTitle: getColTitle(c),
          formula: cell.formula || cell.f || null, f: cell.f || null
        })
      } else {
        values.push({ v: '', raw: '', readOnly: false, colIdx: c, colTitle: getColTitle(c) || '', formula: null, f: null })
      }
    }
    return values
  }

  function buildChildValues(parentValues) {
    const ratio = Math.random() * 0.4 + 0.3
    return parentValues.map(v => ({
      ...v, v: (parseFloat(v.v) * ratio).toFixed(2),
      raw: (parseFloat(v.raw) * ratio).toFixed(2), readOnly: true,
    }))
  }

  function detectSummaryType(name) {
    if (/合计|总计|汇总|集团/.test(name)) return '合计'
    if (/小计|分区|区域/.test(name)) return '小计'
    if (/平均|均值/.test(name)) return '平均'
    return '汇总'
  }

  function getColTitle(colIdx) { return config.value?.cellData?.[`0-${colIdx}`]?.v || '' }
  function colWidth(col) { return col.w || 90 }

  function checkAnomaly(rowIndex, values) {
    for (const v of values) {
      const n = parseFloat(v.v)
      if (isNaN(n)) continue
      if (/库存|存煤/.test(v.colTitle) && n > ANOMALY_CONFIG.inventory.threshold) return true
      if (/率|增长率/.test(v.colTitle) && (n < ANOMALY_CONFIG.growthRate.min || n > ANOMALY_CONFIG.growthRate.max)) return true
    }
    return false
  }

  function getAnomalyInfo(row) {
    const msgs = []
    for (const v of row.values) {
      const n = parseFloat(v.v)
      if (isNaN(n)) continue
      if (/库存|存煤/.test(v.colTitle) && n > ANOMALY_CONFIG.inventory.threshold) msgs.push(`${v.colTitle}超限`)
      if (/率|增长率/.test(v.colTitle) && (n < ANOMALY_CONFIG.growthRate.min || n > ANOMALY_CONFIG.growthRate.max)) msgs.push(`${v.colTitle}异常`)
    }
    return { hasAnomaly: msgs.length > 0, msg: msgs.join('；') || '' }
  }

  function valClass(val, row) {
    const cls = []
    const n = parseFloat(val.v)
    if (!isNaN(n) && /率|增长率/.test(val.colTitle)) {
      if (n > 0.01) cls.push('fr-up')
      else if (n < -0.01) cls.push('fr-down')
      else cls.push('fr-flat')
    }
    if (val.readOnly) cls.push('fr-ro')
    if (row.isSummary) cls.push('fr-bold')
    if (row.isAnomaly) cls.push('fr-anomaly-val')
    return cls.filter(Boolean).join(' ')
  }

  // ==================== 加载报表 ====================
  async function loadReport(templateId) {
    loading.value = true
    error.value = ''
    loadingText.value = `正在加载模板 ${templateId}...`

    try {
      let apiTemplate = null
      try {
        apiTemplate = await getTemplateById(templateId)
      } catch { /* 降级到本地模板 */ }

      if (apiTemplate && apiTemplate.id) {
        useV2.value = true
        v2TemplateCode.value = apiTemplate.code || templateId
        loadingText.value = '正在解析后端模板...'

        const parser = new ReportTemplateParser()
        parser.load(apiTemplate).parse()
        v2Parser.value = parser
        currentTemplate.value = parser.getTemplate()
        config.value = buildConfigFromV2(parser)

        if (apiTemplate.cellData) {
          populateCellDataFromApi(apiTemplate.cellData)
        }
      } else {
        useV2.value = false
        const tm = new TemplateManager()
        loadingText.value = '正在构建报表结构...'
        await nextTick()
        let tpl = tm.get(templateId)
        if (!tpl) throw new Error(`模板不存在: ${templateId}`)
        currentTemplate.value = tpl
        parseAndRender(tpl)
      }

      initEngines(currentTemplate.value)
      await cfComposable.loadConditionalFormats(templateId)
      await validationComposable.loadValidationRules(templateId)

      loading.value = false
      measureVP()
    } catch (e) {
      error.value = e.message
      loading.value = false
    }
  }

  function parseAndRender(tpl) {
    config.value = new TemplateParser(tpl).parse()
    // 公式引擎初始化由 initEngines 统一调用，避免重复
    restoreTreeState()
    measureVP()
  }

  function initEngines(tpl) {
    validationComposable.initEngine(tpl)
    cfComposable.initEngine(tpl)
    permissionEngine = new PermissionEngine({ template: tpl, currentRole: 'filler' })
    formulaComposable.initEngines(tpl)
  }

  function restoreTreeState() {
    if (store.treeExpandedIds.size === 0) {
      flatRows.value.forEach(r => { if (r.children?.length) store.treeExpandedIds.add(r.id) })
    }
  }

  function measureVP() {
    nextTick(() => { if (bodyRef.value) viewportH.value = bodyRef.value.clientHeight || 500 })
  }

  /** 滚动到指定行索引，确保该行在可视区域内（用于键盘导航） */
  function scrollToIndex(index) {
    if (!bodyRef.value || index < 0) return
    const rowTop = index * ROW_H
    const rowBottom = rowTop + ROW_H
    const viewTop = bodyRef.value.scrollTop
    const viewBottom = viewTop + bodyRef.value.clientHeight
    if (rowTop < viewTop) {
      bodyRef.value.scrollTop = rowTop
    } else if (rowBottom > viewBottom) {
      bodyRef.value.scrollTop = rowBottom - bodyRef.value.clientHeight
    }
  }

  // ==================== V2 配置构建 ====================
  function buildConfigFromV2(parser) {
    const template = parser.getTemplate()
    const flatRows = parser.getFlatRows()
    const leafCols = parser.getLeafColumns()

    function generateBusinessCode(strId, name) {
      let code = strId.replace(/^(r_|m_|c_|ytd_|yoy_|col_)/, '').toUpperCase()
      if (code.length < 2) {
        const nameMap = {
          '原煤': 'RAW_COAL', '商品煤': 'COMMODITY_COAL', '自用量': 'SELF_USE',
          '库存量': 'INVENTORY', '合计': 'TOTAL', '小计': 'SUBTOTAL',
          '本月': 'MONTH', '本月止累计': 'YTD', '同比': 'YOY', '环比': 'MOM'
        }
        code = nameMap[name] || name.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').toUpperCase() || strId.toUpperCase()
      }
      return code
    }

    const rows = flatRows.map((row, ri) => {
      const businessId = row.id
      const businessCode = row.code || generateBusinessCode(row.id, row.name)
      return {
        id: businessId, code: businessCode, name: row.name,
        depth: row.level || 0, isSummary: !!row.isSummary,
        summaryType: row.summaryType || '',
        values: leafCols.map((col, ci) => {
          const cell = parser.getCell(ri, ci)
          return {
            v: '', raw: '', readOnly: cell?.readOnly || false,
            colIdx: ci, colTitle: col.title || col.name || '',
            formula: cell?.formula || null, f: cell?.f || null
          }
        })
      }
    })

    const columns = [
      { id: 0, code: 'INDEX', title: '#', width: 50, type: 'index', fixed: true },
      { id: 1, code: 'METRIC', title: '指标', width: 150, type: 'metric', fixed: true },
      ...leafCols.map((col) => {
        const businessId = col.id
        const businessCode = col.code || generateBusinessCode(col.id, col.title || col.name)
        return {
          id: businessId, code: businessCode,
          title: col.title || col.name || '',
          width: col.width || 100, type: col.type || 'data',
          format: col.format || 'number', align: col.align || 'right'
        }
      })
    ]

    const cellData = {}
    const frozenRows = template.layout?.frozenRows || 4

    function getMaxLevel(tree) {
      let max = 0
      const walk = (nodes, level) => {
        for (const node of nodes) {
          if (level > max) max = level
          if (node.children?.length) walk(node.children, level + 1)
        }
      }
      walk(tree, 0)
      return max
    }

    function countLeafNodes(node) {
      if (!node.children?.length) return 1
      let count = 0
      for (const child of node.children) count += countLeafNodes(child)
      return count
    }

    const maxHeaderLevel = template.columnTree ? getMaxLevel(template.columnTree) : 1

    function fillHeaderCells(nodes, level, startCol) {
      let colOffset = startCol
      for (const node of nodes) {
        const leafCount = countLeafNodes(node)
        const colSpan = leafCount || 1
        const hasChildren = node.children && node.children.length > 0
        const rowSpan = hasChildren ? 1 : (maxHeaderLevel - level + 1)

        cellData[`${level}-${colOffset}`] = {
          v: node.title || node.name || '',
          headerLevel: level + 1, colSpan: hasChildren ? colSpan : 1,
          rowSpan, isHeaderStart: true
        }

        if (hasChildren && colSpan > 1) {
          for (let i = 1; i < colSpan; i++) {
            cellData[`${level}-${colOffset + i}`] = {
              v: '', headerLevel: level + 1, colSpan: 0, rowSpan: 1, isHeaderMerged: true
            }
          }
        }

        if (hasChildren) fillHeaderCells(node.children, level + 1, colOffset)
        colOffset += colSpan
      }
    }

    if (template.columnTree && template.columnTree.length > 0) {
      fillHeaderCells(template.columnTree, 0, 2)
    }

    rows.forEach((row, ri) => {
      const actualRow = frozenRows + ri
      row.values.forEach((val, vi) => {
        const actualCol = vi + 2
        cellData[`${actualRow}-${actualCol}`] = {
          v: val.v, readOnly: val.readOnly, f: val.f
        }
      })
    })

    return {
      frozenRowCount: frozenRows,
      frozenColCount: template.layout?.frozenCols || 1,
      rowHeight: template.layout?.rowHeight || 32,
      colMinWidth: template.layout?.colMinWidth || 80,
      columnData: columns, cellData, rows,
      _v2: true, _parser: parser,
      metrics: template.metrics || [],
      validators: template.validators || [],
      conditionalFormats: template.conditionalFormats || []
    }
  }

  function populateCellDataFromApi(apiCellData) {
    if (!config.value || !apiCellData || typeof apiCellData !== 'object') return
    const frozenRows = config.value.frozenRowCount || 4
    const rows = config.value.rows || []
    const columns = config.value.columnData || []

    const rowIdToIndex = {}
    rows.forEach((row, idx) => { if (row && row.id) rowIdToIndex[row.id] = idx })
    const colIdToIndex = {}
    columns.forEach((col, idx) => { if (col && col.id) colIdToIndex[col.id] = idx })

    for (const key of Object.keys(apiCellData)) {
      const rawValue = apiCellData[key]
      if (rawValue === undefined || rawValue === null) continue
      const colonIdx = key.indexOf(':')
      if (colonIdx === -1) continue
      const rowId = key.substring(0, colonIdx)
      const colId = key.substring(colonIdx + 1)
      const rowIdx = rowIdToIndex[rowId]
      const colIdx = colIdToIndex[colId]
      if (rowIdx === undefined || colIdx === undefined) continue

      const actualRow = frozenRows + rowIdx
      const actualCol = colIdx

      let displayValue = rawValue
      const numVal = Number(rawValue)
      if (!isNaN(numVal) && String(rawValue).indexOf('.') !== -1) {
        displayValue = String(numVal)
      }

      const cellKey = `${actualRow}-${actualCol}`
      config.value.cellData[cellKey] = { v: displayValue, raw: rawValue, readOnly: false, f: null }

      const valueColIdx = colIdx - 2
      if (valueColIdx >= 0 && rows[rowIdx]?.values?.[valueColIdx]) {
        rows[rowIdx].values[valueColIdx].v = displayValue
        rows[rowIdx].values[valueColIdx].raw = rawValue
      }
    }
    dataVersion.value++
  }

  // ==================== 保存系统 ====================
  function updateSaveData() {
    if (!config.value) return
    store.setSaveData({
      templateId: props.templateId, orgId: selectedOrgId.value,
      period: selectedPeriod.value, templateCode: v2TemplateCode.value,
      templateName: currentTemplate.value?.name || '',
      rows: config.value.rows || [], columns: config.value.columnData || [],
      cellData: config.value.cellData || {},
      formulas: formulaComposable.savedFormulas,
      frozenRowCount: config.value.frozenRowCount || 4, remark: ''
    })
  }

  function triggerAutoSave() {
    updateSaveData()
    store.triggerAutoSave()
    showSaveStatus('编辑中...', 'saving')
  }

  async function forceSave() {
    if (!selectedOrgId.value) { showToast('请先选择组织', 'warning'); return }
    if (!selectedPeriod.value) { showToast('请先选择填报周期', 'warning'); return }

    const validationResult = await validationComposable.validateAllData()
    if (!validationResult.valid && validationResult.errors.length > 0) {
      showToast(`校验发现 ${validationResult.count} 个问题，请检查`, 'warning')
    }

    store.cancelAutoSave()
    showSaveStatus('正在保存...', 'saving')

    try {
      updateSaveData()
      const result = await store.forceSave('manual')
      if (result.success) {
        showSaveStatus(result.message, 'success')
        setTimeout(() => { saveStatus.visible = false }, 2000)
      } else {
        showSaveStatus(result.message || '保存失败', 'error')
        setTimeout(() => { saveStatus.visible = false }, 3000)
      }
    } catch (e) {
      showSaveStatus('保存失败: ' + (e.message || '未知错误'), 'error')
      setTimeout(() => { saveStatus.visible = false }, 3000)
    }
  }

  async function forceSaveAndPublish() {
    await forceSave()
    showSaveStatus('正在发布...', 'saving')
    try {
      updateSaveData()
      const result = await store.forceSave('publish')
      if (result.success) {
        showSaveStatus('发布成功！', 'success')
        setTimeout(() => { saveStatus.visible = false }, 2000)
      } else {
        showSaveStatus('发布失败: ' + result.message, 'error')
        setTimeout(() => { saveStatus.visible = false }, 3000)
      }
    } catch (e) {
      showSaveStatus('发布失败: ' + (e.message || '未知错误'), 'error')
      setTimeout(() => { saveStatus.visible = false }, 3000)
    }
  }

  async function submitForReview() {
    if (!selectedOrgId.value) { showToast('请先选择组织', 'warning'); return }
    if (!selectedPeriod.value) { showToast('请先选择填报周期', 'warning'); return }

    await forceSave()
    showSaveStatus('正在提交审核...', 'saving')
    try {
      const { submitForReview: apiSubmit } = await import('@/api/reportDesigner.js')
      const result = await apiSubmit({
        templateId: props.templateId, orgId: selectedOrgId.value,
        period: selectedPeriod.value, remark: ''
      })
      if (result?.success !== false) {
        showSaveStatus('提交审核成功！', 'success')
        showToast('已提交审核，请等待审批', 'success')
        setTimeout(() => { saveStatus.visible = false }, 2000)
      } else {
        showSaveStatus('提交失败: ' + (result.message || '未知错误'), 'error')
        setTimeout(() => { saveStatus.visible = false }, 3000)
      }
    } catch (e) {
      showSaveStatus('提交失败: ' + (e.message || '未知错误'), 'error')
      setTimeout(() => { saveStatus.visible = false }, 3000)
    }
  }

  function handleExportExcel() {
    if (!selectedOrgId.value || !selectedPeriod.value) {
      showToast('请先选择组织和周期', 'warning'); return
    }
    exportToExcel(props.templateId, selectedOrgId.value, selectedPeriod.value)
  }

  function showSaveStatus(text, type) {
    saveStatus.text = text; saveStatus.type = type; saveStatus.visible = true
  }

  async function loadExistingData() {
    if (!props.templateId || !selectedOrgId.value || !selectedPeriod.value) return
    try {
      const data = await getReportData({
        templateId: props.templateId, orgId: selectedOrgId.value,
        period: selectedPeriod.value
      })
      if (data && data.cells?.length > 0) {
        backfillCellsToTable(data.cells)
        showToast(`已加载 ${data.cells.length} 个已填单元格`, 'success')
      }
    } catch { /* 静默处理 */ }
  }

  function backfillCellsToTable(cells) {
    if (!config.value) return
    const frozenRows = config.value.frozenRowCount || 4
    cells.forEach(cell => {
      let rowIdx = -1, colIdx = -1
      if (config.value.rows && Array.isArray(config.value.rows)) {
        rowIdx = config.value.rows.findIndex(r =>
          r.id === cell.rowId || r.name === cell.rowName || r.id === String(cell.rowId)
        )
        if (rowIdx >= 0) rowIdx += frozenRows
      }
      if (config.value.columnData && Array.isArray(config.value.columnData)) {
        colIdx = config.value.columnData.findIndex(c =>
          c.id === cell.colId || c.title === cell.colTitle || c.id === String(cell.colId)
        )
      }
      if (rowIdx >= 0 && colIdx >= 0) {
        const key = `${rowIdx}-${colIdx}`
        config.value.cellData[key] = {
          v: cell.value ?? '', raw: cell.rawValue ?? cell.value ?? '',
          readOnly: false, f: cell.formula || null,
          _loaded: true, _cellId: cell.id
        }
        if (config.value.rows && config.value.rows[rowIdx - frozenRows]?.values) {
          const valueObj = config.value.rows[rowIdx - frozenRows].values[colIdx]
          if (valueObj) {
            valueObj.v = cell.value ?? ''; valueObj.raw = cell.rawValue ?? cell.value ?? ''
            valueObj.f = cell.formula || null; valueObj._loaded = true
          }
        }
      }
    })
    dataVersion.value++
  }

  // ==================== 行操作 ====================
  function addNewRow() {
    if (!config.value) { showToast('请先加载报表模板', 'warning'); return }
    const columns = config.value.columnData || []
    const dataCols = columns.slice(2)
    const newId = `row_${Date.now()}`
    const rowCount = (config.value.rows || []).length + 1
    const newRow = {
      id: newId, name: `新行${rowCount}`, depth: 0, isSummary: false, summaryType: '',
      values: dataCols.map((col, ci) => ({
        v: '', raw: '', readOnly: false, colIdx: ci,
        colTitle: col.title || '', formula: null, f: null
      }))
    }
    if (!config.value.rows) config.value.rows = []
    config.value.rows.push(newRow)
    const frozenRows = config.value.frozenRowCount || 4
    const actualRowIdx = frozenRows + config.value.rows.length - 1
    newRow.values.forEach((val, vi) => {
      const actualColIdx = vi + 2
      config.value.cellData[`${actualRowIdx}-${actualColIdx}`] = { v: '', raw: '', readOnly: false, f: null }
    })
    dataVersion.value++
    showToast(`已新增行：${newRow.name}`, 'success')
    nextTick(() => { if (bodyRef.value) bodyRef.value.scrollTop = bodyRef.value.scrollHeight })
  }

  function toggleRow(row) {
    if (!row.hasChildren) return
    if (store.treeExpandedIds.has(row.id)) store.treeExpandedIds.delete(row.id)
    else store.treeExpandedIds.add(row.id)
    store.persistTreeState()
  }

  function expandAllRows() {
    flatRows.value.forEach(r => { if (r.children?.length) store.treeExpandedIds.add(r.id) })
    store.persistTreeState()
  }

  function collapseAllRows() {
    store.treeExpandedIds.clear()
    store.persistTreeState()
  }

  function toggleGroup(id) {
    if (collapsedGroups.value.has(id)) collapsedGroups.value.delete(id)
    else collapsedGroups.value.add(id)
    try { localStorage.setItem('fr_col_folds', JSON.stringify([...collapsedGroups.value])) } catch {}
  }

  function expandAllGroups() {
    collapsedGroups.value.clear()
    try { localStorage.removeItem('fr_col_folds') } catch {}
  }

  return {
    store, config, currentTemplate, useV2, v2Parser, v2TemplateCode,
    loading, loadingText, error, dataVersion,
    saveStatus, permissionEngine,
    containerRef, bodyRef, headerRef, scrollTop, viewportH,
    viewMode, viewModes, collapsedGroups,
    ROW_H, ANOMALY_CONFIG,
    flatRows, headerRows, dataColumns, visibleColCount,
    colIndexMap, colGroupMap, metricGroups,
    visibleRows, displayRows, anomalyCount,
    isColHidden, buildAllRows, buildRowValues, getColTitle, colWidth,
    checkAnomaly, getAnomalyInfo, valClass, getMetricHint,
    loadReport, parseAndRender, initEngines, restoreTreeState, measureVP, scrollToIndex,
    buildConfigFromV2, populateCellDataFromApi,
    updateSaveData, triggerAutoSave, forceSave, forceSaveAndPublish,
    submitForReview, handleExportExcel, showSaveStatus, loadExistingData,
    addNewRow, toggleRow, expandAllRows, collapseAllRows,
    toggleGroup, expandAllGroups
  }
}
