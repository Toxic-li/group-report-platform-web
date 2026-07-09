/**
 * 报表设计器 2.0 - 状态管理中心
 * 使用 provide/inject 模式在组件树中共享状态
 */

import { ref, reactive, computed, provide, inject } from 'vue'

export const DesignerSymbol = Symbol('designer')

export function useDesignerProvider() {
  // ========== 模板基础信息 ==========
  const template = reactive({
    id: null,
    code: '',
    name: '未命名报表',
    status: 0, // 0-草稿 1-已发布 2-已停用
    version: 1,
    description: '',
    templateType: 1,
    categoryId: null,
    periodType: 3,
    auditRequired: 0,
  })

  const autoSaveStatus = ref('saved') // saved | saving | unsaved
  const lastSaveTime = ref(null)

  // ========== 选中状态 ==========
  const selectedCell = reactive({ row: 0, col: 0, row2: null, col2: null })
  const editingCell = reactive({ row: null, col: null, value: '' })
  const activeSheet = ref(0)
  const sheets = ref([
    { id: 1, name: 'Sheet1' }
  ])

  // ========== 网格数据 ==========
  // 默认创建一个 20行 x 15列 的网格，包含示例数据（销售报表）
  const rowCount = ref(20)
  const colCount = ref(15)
  const cells = reactive(new Map()) // key: 'r,c' -> cell object

  // 初始化示例数据
  function initDemoData() {
    // 清空
    cells.clear()

    // 行标题（列0）
    const rowLabels = [
      '', '', '', '部门', '销售一部', '', '', '', '小计', '销售二部', '', '', '', '小计', '合计'
    ]
    // 产品列（列1）
    const productLabels = ['', '', '', '产品类别', '电脑', '手机', '配件', '小计', '', '电脑', '手机', '配件', '小计', '', '']

    for (let r = 0; r < rowCount.value; r++) {
      for (let c = 0; c < colCount.value; c++) {
        const key = `${r},${c}`
        let cell = { value: '', style: {}, type: 'text' }

        if (r === 3 && c === 0) cell = { value: '部门', style: { fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f0f5ff' }, type: 'text' }
        if (r === 3 && c === 1) cell = { value: '产品类别', style: { fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f0f5ff' }, type: 'text' }
        if (r === 3 && c === 2) cell = { value: '', style: {}, type: 'text' }
        if (r === 3 && c >= 3 && c <= 8) {
          const months = ['1月', '2月', '3月', '4月', '5月', '6月']
          cell = { value: months[c - 3] || '合计', style: { fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f0f5ff' }, type: 'text' }
        }
        if (r === 3 && c === 9) cell = { value: '毛利率(平均)', style: { fontWeight: 'bold', textAlign: 'center', fontSize: '11px', backgroundColor: '#f0f5ff' }, type: 'text' }

        if (r === 4 && c === 0) cell = { value: '销售一部', style: { fontWeight: 'bold', backgroundColor: '#fafbfc' }, type: 'text' }
        if (r === 5 && c === 1) cell = { value: '电脑', style: { textAlign: 'left' }, type: 'text' }
        if (r === 6 && c === 1) cell = { value: '手机', style: { textAlign: 'left' }, type: 'text' }
        if (r === 7 && c === 1) cell = { value: '配件', style: { textAlign: 'left' }, type: 'text' }
        if (r === 8 && c === 0) cell = { value: '小计', style: { fontWeight: 'bold', backgroundColor: '#f0f5ff' }, type: 'text' }
        if (r === 9 && c === 0) cell = { value: '销售二部', style: { fontWeight: 'bold', backgroundColor: '#fafbfc' }, type: 'text' }
        if (r === 10 && c === 1) cell = { value: '电脑', style: { textAlign: 'left' }, type: 'text' }
        if (r === 11 && c === 1) cell = { value: '手机', style: { textAlign: 'left' }, type: 'text' }
        if (r === 12 && c === 1) cell = { value: '配件', style: { textAlign: 'left' }, type: 'text' }
        if (r === 13 && c === 0) cell = { value: '小计', style: { fontWeight: 'bold', backgroundColor: '#f0f5ff' }, type: 'text' }
        if (r === 14 && c === 0) cell = { value: '合计', style: { fontWeight: 'bold', backgroundColor: '#e8f0ff' }, type: 'text' }

        // 填充数字数据（示例）
        if (r >= 5 && r <= 7 && c >= 3 && c <= 7) {
          const nums = [
            [1234567, 1345678, 1456789, 1234567, 1345678],
            [2345678, 2456789, 2567890, 2345678, 2456789],
            [345678, 456789, 567890, 345678, 456789]
          ]
          const val = nums[r - 5]?.[c - 3] || 0
          cell = { value: val, style: { textAlign: 'right', fontFamily: 'Roboto Mono, monospace' }, type: 'number', format: 'number' }
        }
        if (r === 8 && c >= 3 && c <= 7) {
          const sum = getColSum(c, 5, 7)
          cell = { value: sum, style: { fontWeight: 'bold', textAlign: 'right', backgroundColor: '#f0f5ff', fontFamily: 'Roboto Mono, monospace' }, type: 'formula', formula: `=SUM(${getColLetter(c)}6:${getColLetter(c)}8)` }
        }

        if (r >= 10 && r <= 12 && c >= 3 && c <= 7) {
          const nums = [
            [987654, 1087654, 1187654, 987654, 1087654],
            [1876543, 1976543, 2076543, 1876543, 1976543],
            [276543, 376543, 476543, 276543, 376543]
          ]
          const val = nums[r - 10]?.[c - 3] || 0
          cell = { value: val, style: { textAlign: 'right', fontFamily: 'Roboto Mono, monospace' }, type: 'number', format: 'number' }
        }
        if (r === 13 && c >= 3 && c <= 7) {
          const sum = getColSum(c, 10, 12)
          cell = { value: sum, style: { fontWeight: 'bold', textAlign: 'right', backgroundColor: '#f0f5ff', fontFamily: 'Roboto Mono, monospace' }, type: 'formula', formula: `=SUM(${getColLetter(c)}11:${getColLetter(c)}13)` }
        }
        if (r === 14 && c >= 3 && c <= 7) {
          const sum = (getCellValue(8, c) || 0) + (getCellValue(13, c) || 0)
          cell = { value: sum, style: { fontWeight: 'bold', textAlign: 'right', backgroundColor: '#e8f0ff', fontFamily: 'Roboto Mono, monospace' }, type: 'formula', formula: `=SUM(${getColLetter(c)}9:${getColLetter(c)}14)` }
        }

        // 毛利率列
        if (r >= 5 && r <= 7 && c === 9) {
          const rates = ['18.76%', '16.45%', '22.31%']
          cell = { value: rates[r - 5] || '', style: { textAlign: 'right', color: '#1677ff' }, type: 'text' }
        }
        if (r === 8 && c === 9) cell = { value: '17.86%', style: { fontWeight: 'bold', textAlign: 'right', color: '#1677ff', backgroundColor: '#f0f5ff' }, type: 'text' }
        if (r >= 10 && r <= 12 && c === 9) {
          const rates = ['19.21%', '17.02%', '23.85%']
          cell = { value: rates[r - 10] || '', style: { textAlign: 'right', color: '#1677ff' }, type: 'text' }
        }
        if (r === 13 && c === 9) cell = { value: '18.37%', style: { fontWeight: 'bold', textAlign: 'right', color: '#1677ff', backgroundColor: '#f0f5ff' }, type: 'text' }
        if (r === 14 && c === 9) cell = { value: '18.09%', style: { fontWeight: 'bold', textAlign: 'right', color: '#1677ff', backgroundColor: '#e8f0ff' }, type: 'text' }

        cells.set(key, cell)
      }
    }

    // 合并单元格：标题行
    mergeCells(1, 0, 1, 9)
    mergeCells(2, 0, 2, 9)
    // 合并部门行
    mergeCells(4, 0, 8, 0) // 销售一部
    mergeCells(9, 0, 13, 0) // 销售二部
  }

  function getColLetter(col) {
    let result = ''
    let c = col
    while (c >= 0) {
      result = String.fromCharCode(65 + (c % 26)) + result
      c = Math.floor(c / 26) - 1
    }
    return result || 'A'
  }

  function getCellValue(r, c) {
    const cell = cells.get(`${r},${c}`)
    return cell ? (typeof cell.value === 'number' ? cell.value : parseInt(cell.value?.toString().replace(/,/g, '') || 0)) : 0
  }

  function getColSum(col, startRow, endRow) {
    let sum = 0
    for (let r = startRow; r <= endRow; r++) {
      sum += getCellValue(r, col)
    }
    return sum
  }

  function mergeCells(r1, c1, r2, c2) {
    // 标记合并区域
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        if (r === r1 && c === c1) {
          const cell = cells.get(`${r},${c}`) || { value: '', style: {} }
          cell.merged = true
          cell.mergeSpan = { rowSpan: r2 - r1 + 1, colSpan: c2 - c1 + 1 }
          cells.set(`${r},${c}`, cell)
        } else {
          const cell = cells.get(`${r},${c}`) || { value: '', style: {} }
          cell.hidden = true
          cell.mergeOrigin = `${r1},${c1}`
          cells.set(`${r},${c}`, cell)
        }
      }
    }
  }

  // ========== 单元格操作 ==========
  function selectCell(row, col, extend = false) {
    if (extend) {
      selectedCell.row2 = row
      selectedCell.col2 = col
    } else {
      selectedCell.row = row
      selectedCell.col = col
      selectedCell.row2 = null
      selectedCell.col2 = null
    }
  }

  function startEdit(row, col) {
    const cell = cells.get(`${row},${col}`) || { value: '' }
    editingCell.row = row
    editingCell.col = col
    editingCell.value = cell.value?.toString() || ''
  }

  function commitEdit(value) {
    if (editingCell.row !== null && editingCell.col !== null) {
      const key = `${editingCell.row},${editingCell.col}`
      const cell = cells.get(key) || {}
      cell.value = value !== undefined ? value : editingCell.value
      cells.set(key, cell)
    }
    editingCell.row = null
    editingCell.col = null
    editingCell.value = ''
    autoSaveStatus.value = 'unsaved'
  }

  function getCell(row, col) {
    return cells.get(`${row},${col}`) || { value: '', style: {}, type: 'text' }
  }

  function setCell(row, col, updates) {
    const key = `${row},${col}`
    const cell = cells.get(key) || { value: '', style: {}, type: 'text' }
    Object.assign(cell, updates)
    cells.set(key, cell)
    autoSaveStatus.value = 'unsaved'
  }

  function updateSelectedCellStyle(styleUpdates) {
    const r1 = Math.min(selectedCell.row, selectedCell.row2 ?? selectedCell.row)
    const r2 = Math.max(selectedCell.row, selectedCell.row2 ?? selectedCell.row)
    const c1 = Math.min(selectedCell.col, selectedCell.col2 ?? selectedCell.col)
    const c2 = Math.max(selectedCell.col, selectedCell.col2 ?? selectedCell.col)
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        const cell = getCell(r, c)
        cell.style = { ...cell.style, ...styleUpdates }
        setCell(r, c, { style: cell.style })
      }
    }
  }

  function isInRange(row, col) {
    if (selectedCell.row2 === null) return false
    const r1 = Math.min(selectedCell.row, selectedCell.row2)
    const r2 = Math.max(selectedCell.row, selectedCell.row2)
    const c1 = Math.min(selectedCell.col, selectedCell.col2)
    const c2 = Math.max(selectedCell.col, selectedCell.col2)
    return row >= r1 && row <= r2 && col >= c1 && col <= c2
  }

  // ========== 撤销/重做 ==========
  const history = ref([])
  const historyIndex = ref(-1)
  const MAX_HISTORY = 50

  function pushHistory() {
    const snapshot = Array.from(cells.entries()).map(([k, v]) => [k, JSON.parse(JSON.stringify(v))])
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }
    history.value.push(snapshot)
    if (history.value.length > MAX_HISTORY) history.value.shift()
    historyIndex.value = history.value.length - 1
  }

  function undo() {
    if (historyIndex.value > 0) {
      historyIndex.value--
      restoreHistory(history.value[historyIndex.value])
    }
  }

  function redo() {
    if (historyIndex.value < history.value.length - 1) {
      historyIndex.value++
      restoreHistory(history.value[historyIndex.value])
    }
  }

  function restoreHistory(snapshot) {
    cells.clear()
    for (const [k, v] of snapshot) {
      cells.set(k, v)
    }
  }

  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  // ========== 布局区域 ==========
  const layoutAreas = reactive({
    rowFields: ['部门', '产品类别'],
    colFields: ['月份'],
    metricFields: ['销售金额(求和)', '销售毛利率(平均)'],
    filterFields: ['日期范围']
  })

  // ========== 数据源树 ==========
  const dataSourceTree = ref([
    {
      label: '销售管理数据库',
      key: 'db1',
      children: [
        {
          label: '维度',
          key: 'dimensions',
          children: [
            {
              label: '时间维度',
              key: 'time_dim',
              children: [
                { label: '年', key: 'year', type: 'field' },
                { label: '季度', key: 'quarter', type: 'field' },
                { label: '月份', key: 'month', type: 'field' },
                { label: '日期', key: 'date', type: 'field' }
              ]
            },
            {
              label: '组织维度',
              key: 'org_dim',
              children: [
                { label: '公司', key: 'company', type: 'field' },
                { label: '部门', key: 'department', type: 'field' },
                { label: '区域', key: 'region', type: 'field' },
                { label: '门店', key: 'store', type: 'field' }
              ]
            },
            {
              label: '产品维度',
              key: 'product_dim',
              children: [
                { label: '产品类别', key: 'product_category', type: 'field' },
                { label: '产品名称', key: 'product_name', type: 'field' },
                { label: '规格型号', key: 'spec', type: 'field' }
              ]
            }
          ]
        },
        {
          label: '指标',
          key: 'metrics',
          children: [
            { label: '销售金额', key: 'sales_amount', type: 'metric' },
            { label: '销售数量', key: 'sales_qty', type: 'metric' },
            { label: '成本金额', key: 'cost_amount', type: 'metric' },
            { label: '毛利金额', key: 'gross_amount', type: 'metric' },
            { label: '毛利率(%)', key: 'gross_rate', type: 'metric' },
            { label: '订单数量', key: 'order_count', type: 'metric' }
          ]
        },
        {
          label: '参数',
          key: 'params',
          children: [
            { label: '开始日期', key: 'start_date', type: 'param' },
            { label: '结束日期', key: 'end_date', type: 'param' },
            { label: '区域选择', key: 'region_select', type: 'param' }
          ]
        },
        {
          label: '计算字段',
          key: 'calcs',
          children: [
            { label: '销售毛利率 = (毛利金额/销售金额)', key: 'calc_gross', type: 'calc' },
            { label: '同比增长率', key: 'calc_yoy', type: 'calc' }
          ]
        }
      ]
    }
  ])

  // ========== 右键菜单 ==========
  const contextMenu = reactive({
    visible: false,
    x: 0,
    y: 0,
    items: []
  })

  // ========== 底部Tab ==========
  const bottomTab = ref('design') // design | dataPreview | printPreview

  // ========== 提供状态 ==========
  const state = {
    template,
    autoSaveStatus,
    lastSaveTime,
    selectedCell,
    editingCell,
    activeSheet,
    sheets,
    rowCount,
    colCount,
    cells,
    layoutAreas,
    dataSourceTree,
    contextMenu,
    bottomTab,
    history,
    historyIndex,
    canUndo,
    canRedo,
    // 方法
    selectCell,
    startEdit,
    commitEdit,
    getCell,
    setCell,
    updateSelectedCellStyle,
    isInRange,
    pushHistory,
    undo,
    redo,
    initDemoData,
    getColLetter,
  }

  provide(DesignerSymbol, state)
  return state
}

export function useDesigner() {
  const state = inject(DesignerSymbol)
  if (!state) {
    throw new Error('useDesigner must be used within a designer provider')
  }
  return state
}
