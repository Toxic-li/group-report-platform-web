/**
 * 报表设计器 2.0 - 状态管理中心
 * 数据结构严格对齐后端 ReportDesignerTemplateVO
 * 前端设计器 ↔ 后端引擎 之间的唯一数据通道
 *
 * 核心结构：
 * - rowTree: 行维度树（支持多层级、合计行）
 * - columnTree: 列维度树（支持多层级、列类型定义）
 * - metrics: 指标/公式定义列表
 * - aggregates: 合计规则
 * - validators: 校验规则
 * - conditionalFormats: 条件格式
 * - cellData: 单元格数据 Map<rowCode:colCode, value>
 * - layout: 布局配置
 * - dataSource: 数据源配置
 */

import { ref, reactive, computed, provide, inject } from 'vue'
import { createFormulaService } from '@/services/formula/index.js'

export const DesignerSymbol = Symbol('designer')

/** 模块级引用 — 供 index.vue 等外层组件直接操作 */
export const designerRef = reactive({
  state: null
})

let nodeIdCounter = 1
function nextNodeId(prefix = 'n') {
  return `${prefix}_${Date.now()}_${nodeIdCounter++}`
}

export function useDesignerProvider() {
  // ========== 模板基础信息 ==========
  const template = reactive({
    id: null,
    code: '',
    name: '未命名报表',
    version: 1,
    status: 'draft',
    templateType: 2,
    description: '',
    periodType: 'month',
    auditRequired: false,
  })

  const autoSaveStatus = ref('saved')
  const lastSaveTime = ref(null)

  // ========== 选中状态 ==========
  const selectedCell = reactive({ row: 0, col: 0, row2: null, col2: null })
  const selectedRegion = reactive({
    type: null,        // 'cell' | 'row' | 'col' | 'dataArea' | 'title'
    rowNodeId: null,
    colNodeId: null,
  })
  const editingCell = reactive({ row: null, col: null, value: '' })

  // ========== 布局配置（对齐后端 LayoutConfig） ==========
  const layout = reactive({
    type: 'table',
    showRowHeader: true,
    showColumnHeader: true,
    freezeRows: 0,
    freezeCols: 0,
    defaultRowHeight: 32,
    defaultColWidth: 120,
  })

  // ========== 行维度树（对齐后端 rowTree: List<TreeNode>） ==========
  const rowTree = ref([])

  // ========== 列维度树（对齐后端 columnTree: List<TreeNode>） ==========
  const columnTree = ref([])

  // ========== 指标/公式（对齐后端 metrics: List<MetricDef>） ==========
  const metrics = ref([])

  // ========== 合计规则（对齐后端 aggregates: List<AggregateDef>） ==========
  const aggregates = ref([])

  // ========== 校验规则（对齐后端 validators: List<ValidatorDef>） ==========
  const validators = ref([])

  // ========== 条件格式（对齐后端 conditionalFormats） ==========
  const conditionalFormats = ref([])

  // ========== 单元格数据（对齐后端 cellData: Map<rowCode:columnCode, value>） ==========
  const cellData = reactive(new Map())

  // ========== 公式存储 Map<cellKey, formulaExpr> ==========
  // 当 setCellValue 的值以 = 开头时，存入 formulaStore 而非 cellData
  const formulaStore = reactive(new Map())

  // ========== 公式引擎（懒加载） ==========
  let _formulaService = null
  function getFormulaService() {
    if (!_formulaService) {
      try {
        _formulaService = createFormulaService()
      } catch (e) {
        console.warn('FormulaService 加载失败，公式功能降级:', e)
        _formulaService = null
      }
    }
    return _formulaService
  }

  /**
   * 评估公式表达式
   * 支持：=SUM(A1:A3), =A1+B1, =[行编码], =SUM([row1],[row2]) 等
   */
  function evaluateFormula(expr, targetCellKey = null) {
    if (!expr || typeof expr !== 'string') return expr
    // 去掉前导 =
    let expression = expr.trim()
    if (expression.startsWith('=')) {
      expression = expression.slice(1)
    }

    try {
      // 替换 Excel 风格的单元格引用 A1, B2 等 → 从 cellData 取值
      // 替换 [rowCode] 风格的行引用 → 从 cellData 按行编码取值
      // 替换 SUM(A1:A3) 范围引用 → 展开为数组

      // 1. 处理范围引用 SUM(A1:A3) → SUM(A1, A2, A3)
      expression = expression.replace(/([A-Z]+)(\d+):([A-Z]+)(\d+)/g, (match, col1, row1, col2, row2) => {
        const startRow = parseInt(row1)
        const endRow = parseInt(row2)
        const col = col1 // 只支持同列范围
        const refs = []
        for (let r = startRow; r <= endRow; r++) {
          refs.push(`${col}${r}`)
        }
        return refs.join(',')
      })

      // 2. 替换单元格引用 A1, B2 等 → 取 cellData 中的值
      // 需要将 A1 映射到实际的 rowNode/colNode
      expression = expression.replace(/([A-Z]+)(\d+)/g, (match, col, row) => {
        const value = getCellValueByExcelRef(col, parseInt(row))
        return value != null ? `(${value})` : '0'
      })

      // 3. 替换 [rowCode] 风格引用 → 取该行所有数据列的值（用于行引用公式）
      expression = expression.replace(/\[([^\]]+)\]/g, (match, rowCode) => {
        // 如果在范围内引用，取当前列的值
        if (targetCellKey) {
          const [rId, cId] = targetCellKey.split(':')
          const val = getCellValue(rowCode, cId)
          return val != null ? `(${val})` : '0'
        }
        return '0'
      })

      // 4. 替换函数名（FormulaService 注册的函数）
      // 简单评估：使用 Function 构造器计算数学表达式
      // 支持 SUM(...), AVG(...), MAX(...), MIN(...), ABS(...), ROUND(...) 等
      const funcMap = {
        SUM: (...args) => args.flat().reduce((s, v) => s + (Number(v) || 0), 0),
        AVG: (...args) => { const f = args.flat().filter(v => !isNaN(Number(v))); return f.length ? f.reduce((s, v) => s + Number(v), 0) / f.length : 0 },
        AVERAGE: (...args) => { const f = args.flat().filter(v => !isNaN(Number(v))); return f.length ? f.reduce((s, v) => s + Number(v), 0) / f.length : 0 },
        MAX: (...args) => Math.max(...args.flat().map(v => Number(v) || 0)),
        MIN: (...args) => Math.min(...args.flat().map(v => Number(v) || 0)),
        COUNT: (...args) => args.flat().filter(v => v != null && v !== '').length,
        ABS: (v) => Math.abs(Number(v) || 0),
        ROUND: (v, d = 0) => { const n = Number(v) || 0; const f = Math.pow(10, d); return Math.round(n * f) / f },
        POWER: (v, p = 1) => Math.pow(Number(v) || 0, Number(p) || 0),
        SQRT: (v) => Math.sqrt(Number(v) || 0),
        IF: (cond, t, f) => cond ? t : f,
        AND: (...args) => args.every(Boolean),
        OR: (...args) => args.some(Boolean),
        NOT: (v) => !v,
      }

      // 替换函数调用
      let evalExpr = expression
      for (const [fname, fn] of Object.entries(funcMap)) {
        const regex = new RegExp(fname + '\\s*\\(', 'g')
        evalExpr = evalExpr.replace(regex, `__${fname}__(`)
      }

      // 创建评估函数
      const funcNames = Object.keys(funcMap).map(n => `__${n}__`)
      const funcRefs = Object.values(funcMap)
      const evaluator = new Function(...funcNames, `"use strict"; return (${evalExpr})`)
      const result = evaluator(...funcRefs)

      return typeof result === 'number' ? Math.round(result * 1e10) / 1e10 : result
    } catch (e) {
      console.warn('公式评估失败:', expr, e)
      return expr // 返回原始表达式
    }
  }

  /**
   * 通过 Excel 引用 (如 A1, B2) 获取单元格值
   * A=第1列, B=第2列... ; 行号从1开始（跳过表头）
   */
  function getCellValueByExcelRef(col, row) {
    const colIdx = colToNum(col) - 1 // 0-based
    const rowIdx = row - 1 // 0-based (数据行索引)

    const rows = flatRowTree.value
    const leaves = flatColumnLeaves.value

    if (rowIdx >= 0 && rowIdx < rows.length && colIdx >= 0 && colIdx < leaves.length) {
      const rowNode = rows[rowIdx]
      const colNode = leaves[colIdx]
      if (rowNode && colNode && !rowNode.isSummary) {
        return getCellValue(rowNode.id, colNode.id)
      }
    }
    return null
  }

  function colToNum(col) {
    let n = 0
    for (let i = 0; i < col.length; i++) {
      n = n * 26 + (col.charCodeAt(i) - 64)
    }
    return n
  }

  // ========== 数据源配置（对齐后端 dataSource: DataSourceDef） ==========
  const dataSource = reactive({
    type: 'mysql',
    sourceId: null,
    sourceName: '',
    query: '',
    fieldMapping: {},
    refreshPolicy: 'manual',
  })

  // ========== 权限配置（对齐后端 permissions） ==========
  const permissions = reactive({
    editableOrgs: [],
    viewableOrgs: [],
    allowExport: false,
    allowImport: false,
  })

  // ========== 树形扁平化辅助（用于画布渲染） ==========
  function flattenTree(tree, depth = 0, parentId = null, result = []) {
    if (!Array.isArray(tree)) return result
    let sortOrder = 0
    for (const node of tree) {
      const flatNode = {
        ...node,
        level: depth,
        sortOrder: sortOrder++,
        parentId: parentId,
        _id: node.id || nextNodeId('row'),
      }
      result.push(flatNode)
      if (node.children?.length) {
        flattenTree(node.children, depth + 1, flatNode._id, result)
      }
    }
    return result
  }

  // ========== 列头矩阵（多行表头） ==========
  // 计算树的最大深度（根为 1）
  function getTreeDepth(tree) {
    if (!Array.isArray(tree) || tree.length === 0) return 0
    let max = 0
    for (const n of tree) {
      const d = 1 + getTreeDepth(n.children)
      if (d > max) max = d
    }
    return max
  }

  // 统计节点下的叶子数（用于父节点 colSpan）
  function countLeaves(node) {
    if (!node) return 0
    if (!node.children || node.children.length === 0) return 1
    return node.children.reduce((s, c) => s + countLeaves(c), 0)
  }

  /**
   * 构建列头渲染矩阵：按深度展开成 N 行
   * 每个单元格 { node, colSpan, rowSpan, isLeaf, depth }
   * 父节点 colSpan = 叶子后代数, rowSpan = 1
   * 叶子节点 colSpan = 1, rowSpan = maxDepth - depth（向下跨行填满）
   */
  function buildHeaderMatrix(tree) {
    const maxDepth = getTreeDepth(tree)
    const matrix = Array.from({ length: maxDepth }, () => [])
    let leafCursor = 0 // 叶子列游标，用于记录每个节点覆盖的起始叶子列索引
    function walk(node, depth) {
      const isLeaf = !node.children || node.children.length === 0
      const colSpan = isLeaf ? 1 : countLeaves(node)
      const rowSpan = isLeaf ? maxDepth - depth : 1
      const leafStartIndex = leafCursor
      matrix[depth].push({ node, colSpan, rowSpan, isLeaf, depth, leafStartIndex })
      if (isLeaf) leafCursor += 1
      else if (Array.isArray(node.children)) node.children.forEach(c => walk(c, depth + 1))
    }
    if (Array.isArray(tree)) tree.forEach(n => walk(n, 0))
    const totalCols = matrix.length ? matrix[0].reduce((s, c) => s + c.colSpan, 0) : 0
    return { matrix, maxDepth, totalCols }
  }

  // 仅叶子列（供数据单元格渲染 + 列宽/列选中）
  function extractLeaves(tree, result = []) {
    if (!Array.isArray(tree)) return result
    for (const n of tree) {
      if (!n.children || n.children.length === 0) result.push(n)
      else extractLeaves(n.children, result)
    }
    return result
  }

  const flatRowTree = computed(() => flattenTree(rowTree.value))
  const flatColumnTree = computed(() => flattenTree(columnTree.value))
  // 叶子列：数据单元格实际对应的列（多行表头下，只有叶子列承载单元格）
  const flatColumnLeaves = computed(() => extractLeaves(columnTree.value))
  // 列头渲染矩阵 + 深度
  const headerMatrix = computed(() => buildHeaderMatrix(columnTree.value))
  const colHeaderDepth = computed(() => headerMatrix.value.maxDepth)

  // 总行数 = 1（标题行）+ 表头行数(colHeaderDepth) + 行维度行数
  const totalRows = computed(() => {
    return 1 + colHeaderDepth.value + flatRowTree.value.length
  })

  // 总列数 = 1（行表头列）+ 叶子列数
  const totalCols = computed(() => {
    return 1 + flatColumnLeaves.value.length
  })

  // ========== 行列增删（操作树结构） ==========
  function addRowNode(parentId = null, insertAfter = null) {
    const newNode = {
      id: nextNodeId('row'),
      name: `新行${flatRowTree.value.length + 1}`,
      type: 'data',
      parentId,
      level: parentId ? 1 : 0,
      isSummary: false,
      expandable: false,
    }
    if (!parentId) {
      // 顶层行
      if (insertAfter != null) {
        const idx = rowTree.value.findIndex(n => n.id === insertAfter)
        if (idx >= 0) rowTree.value.splice(idx + 1, 0, newNode)
        else rowTree.value.push(newNode)
      } else {
        rowTree.value.push(newNode)
      }
    } else {
      // 子行
      const parent = findNode(rowTree.value, parentId)
      if (parent) {
        if (!parent.children) parent.children = []
        parent.children.push(newNode)
        parent.expandable = true
      }
    }
    autoSaveStatus.value = 'unsaved'
    selectRegion('row', newNode.id, null)
    return newNode
  }

  function addColNode(parentId = null, insertAfter = null) {
    const parent = parentId ? findNode(columnTree.value, parentId) : null
    const newNode = {
      id: nextNodeId('col'),
      name: `新列${flatColumnTree.value.length + 1}`,
      type: 'data',
      parentId,
      level: parent ? (parent.level || 0) + 1 : 0,
      columnType: 'text',
      dataType: 'string',
      required: false,
      readonly: false,
      visible: true,
      frozen: false,
      children: [],
    }
    if (!parentId) {
      if (insertAfter != null) {
        const idx = columnTree.value.findIndex(n => n.id === insertAfter)
        if (idx >= 0) columnTree.value.splice(idx + 1, 0, newNode)
        else columnTree.value.push(newNode)
      } else {
        columnTree.value.push(newNode)
      }
    } else {
      if (parent) {
        // 用新数组替换确保响应式触发
        if (!parent.children) parent.children = []
        if (insertAfter != null) {
          const idx = parent.children.findIndex(n => n.id === insertAfter)
          if (idx >= 0) parent.children = [...parent.children.slice(0, idx + 1), newNode, ...parent.children.slice(idx + 1)]
          else parent.children = [...parent.children, newNode]
        } else {
          parent.children = [...parent.children, newNode]
        }
      }
    }
    autoSaveStatus.value = 'unsaved'
    selectRegion('col', null, newNode.id)
    return newNode
  }

  function findNode(tree, id) {
    for (const node of tree) {
      if (node.id === id) return node
      if (node.children?.length) {
        const found = findNode(node.children, id)
        if (found) return found
      }
    }
    return null
  }

  function deleteRowNode(nodeId) {
    function removeFrom(tree) {
      for (let i = 0; i < tree.length; i++) {
        if (tree[i].id === nodeId) {
          tree.splice(i, 1)
          return true
        }
        if (tree[i].children?.length && removeFrom(tree[i].children)) return true
      }
      return false
    }
    if (removeFrom(rowTree.value)) {
      // 同步清理 cellData
      const node = findNode(rowTree.value, nodeId)
      // 不需要删除 cellData，因为它是用 code 索引而非 id
      autoSaveStatus.value = 'unsaved'
    }
  }

  function deleteColNode(nodeId) {
    function removeFrom(tree) {
      for (let i = 0; i < tree.length; i++) {
        if (tree[i].id === nodeId) {
          tree.splice(i, 1)
          return true
        }
        if (tree[i].children?.length && removeFrom(tree[i].children)) return true
      }
      return false
    }
    removeFrom(columnTree.value)
    autoSaveStatus.value = 'unsaved'
  }

  function updateRowNode(nodeId, updates) {
    const node = findNode(rowTree.value, nodeId)
    if (node) Object.assign(node, updates)
    autoSaveStatus.value = 'unsaved'
  }

  function updateColNode(nodeId, updates) {
    const node = findNode(columnTree.value, nodeId)
    if (node) Object.assign(node, updates)
    autoSaveStatus.value = 'unsaved'
  }

  // ========== 单元格操作（基于 rowCode:colCode 索引） ==========
  function getCellKey(rowNodeId, colNodeId) {
    return `${rowNodeId}:${colNodeId}`
  }

  /**
   * 获取单元格显示值
   * - 如果单元格有公式，返回公式计算结果
   * - 否则返回原始值
   */
  function getCellValue(rowNodeId, colNodeId) {
    const key = getCellKey(rowNodeId, colNodeId)
    // 优先检查公式
    if (formulaStore.has(key)) {
      const formula = formulaStore.get(key)
      return evaluateFormula(formula, key)
    }
    return cellData.get(key)
  }

  /**
   * 获取单元格原始存储值（不评估公式）
   */
  function getCellRawValue(rowNodeId, colNodeId) {
    const key = getCellKey(rowNodeId, colNodeId)
    if (formulaStore.has(key)) {
      return formulaStore.get(key)
    }
    return cellData.get(key)
  }

  /**
   * 设置单元格值
   * - 值以 = 开头时存为公式
   * - 空值清除单元格
   */
  function setCellValue(rowNodeId, colNodeId, value) {
    const key = getCellKey(rowNodeId, colNodeId)
    if (value == null || value === '') {
      cellData.delete(key)
      formulaStore.delete(key)
    } else if (typeof value === 'string' && value.trim().startsWith('=')) {
      // 存为公式
      formulaStore.set(key, value)
      // 同时清除纯数据值
      cellData.delete(key)
    } else {
      // 存为普通数据
      cellData.set(key, value)
      formulaStore.delete(key)
    }
    autoSaveStatus.value = 'unsaved'
  }

  /**
   * 检查单元格是否包含公式
   */
  function hasFormula(rowNodeId, colNodeId) {
    return formulaStore.has(getCellKey(rowNodeId, colNodeId))
  }

  /**
   * 获取单元格公式表达式（无公式返回 null）
   */
  function getCellFormula(rowNodeId, colNodeId) {
    return formulaStore.get(getCellKey(rowNodeId, colNodeId)) || null
  }

  // ========== 选中与编辑 ==========
  function selectRegion(type, rowNodeId, colNodeId) {
    selectedRegion.type = type
    selectedRegion.rowNodeId = rowNodeId
    selectedRegion.colNodeId = colNodeId
  }

  function startEdit(rowNodeId, colNodeId) {
    const key = getCellKey(rowNodeId, colNodeId)
    editingCell.row = rowNodeId
    editingCell.col = colNodeId
    // 优先显示公式表达式，否则显示原始值
    if (formulaStore.has(key)) {
      editingCell.value = formulaStore.get(key)
    } else {
      editingCell.value = cellData.get(key)?.toString() || ''
    }
  }

  function commitEdit(value) {
    if (editingCell.row != null && editingCell.col != null) {
      setCellValue(editingCell.row, editingCell.col, value !== undefined ? value : editingCell.value)
    }
    editingCell.row = null
    editingCell.col = null
    editingCell.value = ''
  }

  // ========== 小计 / 合计行 ==========
  // 在指定节点后插入（支持嵌套），返回是否成功
  function insertAfterNode(tree, targetId, newNode) {
    for (let i = 0; i < tree.length; i++) {
      if (tree[i].id === targetId) {
        tree.splice(i + 1, 0, newNode)
        return true
      }
      if (tree[i].children?.length && insertAfterNode(tree[i].children, targetId, newNode)) return true
    }
    return false
  }

  /**
   * 插入小计行（subtotal）—— 可置于行树任意位置（分组开头/结尾/中间均可）
   * @param insertAfterNodeId 在此行后插入；null=置顶，undefined=置底
   * @param opts { title, summaryScope, aggregateFunc, mergeTitle }
   *   summaryScope: 'siblings'(同级兄弟行) | [rowId,...](指定行) | 'all'(全表，等同合计)
   *   aggregateFunc: 'SUM'|'AVG'|'COUNT'|'MAX'|'MIN'
   *   mergeTitle: true=标题列跨数据列合并显示
   */
  function addSummaryRow(insertAfterNodeId, opts = {}) {
    const newNode = {
      id: nextNodeId('sum'),
      name: opts.title || '小计',
      type: 'summary',
      parentId: null,
      level: 0,
      isSummary: true,
      summaryType: 'subtotal',
      summaryScope: opts.summaryScope || 'siblings',
      aggregateFunc: opts.aggregateFunc || 'SUM',
      mergeTitle: opts.mergeTitle !== false,
    }
    if (insertAfterNodeId === null) {
      rowTree.value.unshift(newNode)
    } else if (insertAfterNodeId === undefined) {
      rowTree.value.push(newNode)
    } else {
      const placed = insertAfterNode(rowTree.value, insertAfterNodeId, newNode)
      if (!placed) rowTree.value.push(newNode)
    }
    autoSaveStatus.value = 'unsaved'
    generateSummaryMetrics(newNode)
    return newNode
  }

  /**
   * 插入合计行（grandTotal）—— 全表汇总，position 控制置顶/置底
   */
  function addGrandTotalRow(opts = {}) {
    const position = opts.position || 'bottom'
    const newNode = {
      id: nextNodeId('gt'),
      name: opts.title || '合计',
      type: 'summary',
      parentId: null,
      level: 0,
      isSummary: true,
      summaryType: 'grandTotal',
      summaryScope: 'all',
      aggregateFunc: opts.aggregateFunc || 'SUM',
      mergeTitle: opts.mergeTitle !== false,
      position,
    }
    if (position === 'top') rowTree.value.unshift(newNode)
    else rowTree.value.push(newNode)
    autoSaveStatus.value = 'unsaved'
    generateSummaryMetrics(newNode)
    return newNode
  }

  /**
   * 为汇总行自动生成所有列的公式指标
   * 支持两种结构：
   *   1. 子节点式小计：汇总行作为数据行的子节点（如 华东区 -> 华东小计）
   *   2. 兄弟式小计：汇总行与数据行同级
   */
  function generateSummaryMetrics(summaryNode) {
    const leafCols = flatColumnLeaves.value || []
    if (!leafCols.length) return

    const func = summaryNode.aggregateFunc || 'SUM'
    let sourceRowIds = []
    const scope = summaryNode.summaryScope

    if (scope === 'all') {
      // 合计行：汇总所有顶级数据行（排除汇总行自身）
      sourceRowIds = (rowTree.value || [])
        .filter(r => r.id !== summaryNode.id && !r.isSummary)
        .map(r => r.id)
    } else if (Array.isArray(scope)) {
      sourceRowIds = scope
    } else {
      // 小计行：先尝试找父节点（子节点式结构）
      const parentId = summaryNode.parentId
      if (parentId && parentId !== '0') {
        // 子节点式：汇总父数据行
        const parentRow = flatRowTree.value.find(r => r.id === parentId)
        if (parentRow && !parentRow.isSummary) {
          sourceRowIds = [parentId]
        }
      }
      // 如果父节点不是数据行，尝试同级兄弟（兄弟式结构）
      if (!sourceRowIds.length) {
        const siblingRows = flatRowTree.value.filter(r =>
          r.parentId === summaryNode.parentId && r.id !== summaryNode.id && !r.isSummary
        )
        for (const r of siblingRows) sourceRowIds.push(...getRowLeafIds(r))
      }
    }

    if (!sourceRowIds.length) return

    for (const col of leafCols) {
      const exprParts = sourceRowIds.map(rid => `${rid}:${col.id}`)
      const expression = `${func}(${exprParts.join(',')})`
      const targetCell = `${summaryNode.id}:${col.id}`

      const existing = metrics.value.find(m => m.targetCell === targetCell)
      if (!existing) {
        addMetric({
          field: `${summaryNode.id}_${col.id}`,
          label: `${summaryNode.name} - ${col.name || col.title || col.id}`,
          expression,
          resultType: 'number',
          targetCell,
          calcTrigger: 'realtime',
          priority: summaryNode.summaryType === 'grandTotal' ? 5 : 10,
          type: 'summary',
        })
      }
    }
  }

  function updateSummaryRow(nodeId, updates) {
    const node = findNode(rowTree.value, nodeId)
    if (node) Object.assign(node, updates)
    autoSaveStatus.value = 'unsaved'
  }

  /**
   * 计算小计/合计行在某列的聚合值
   * @param summaryRowNode flatRowTree 中的汇总行节点
   * @param colLeafNode 叶子列节点
   */
  function getRowLeafIds(node) {
    if (!node) return []
    if (!node.children || node.children.length === 0) return [node.id]
    const ids = []
    const walk = (n) => {
      if (!n.children || n.children.length === 0) ids.push(n.id)
      else n.children.forEach(walk)
    }
    walk(node)
    return ids
  }

  function computeSummaryValue(summaryRowNode, colLeafNode) {
    if (!summaryRowNode || !colLeafNode) return null
    const func = summaryRowNode.aggregateFunc || 'SUM'
    let leafIds = []
    const scope = summaryRowNode.summaryScope
    if (scope === 'all') {
      // 全表所有非汇总叶子行
      leafIds = getRowLeafIds({ children: rowTree.value }).filter(id => {
        const r = flatRowTree.value.find(x => x.id === id)
        return r && !r.isSummary
      })
    } else if (Array.isArray(scope)) {
      leafIds = scope
    } else {
      // 'siblings' - 同级兄弟行（含其叶子后代；分组行的数据落在叶子后代上）
      const siblingRows = flatRowTree.value.filter(r =>
        r.parentId === summaryRowNode.parentId && r.id !== summaryRowNode.id && !r.isSummary
      )
      for (const r of siblingRows) leafIds.push(...getRowLeafIds(r))
    }
    const values = []
    for (const rid of leafIds) {
      const v = cellData.get(getCellKey(rid, colLeafNode.id))
      if (v != null && v !== '' && !isNaN(Number(v))) values.push(Number(v))
    }
    if (values.length === 0) return null
    switch (func) {
      case 'SUM': return values.reduce((s, v) => s + v, 0)
      case 'AVG': return values.reduce((s, v) => s + v, 0) / values.length
      case 'COUNT': return values.length
      case 'MAX': return Math.max(...values)
      case 'MIN': return Math.min(...values)
      default: return values.reduce((s, v) => s + v, 0)
    }
  }

  // ========== 指标操作 ==========
  function addMetric(metric = {}) {
    const newMetric = {
      field: metric.field || nextNodeId('metric'),
      label: metric.label || '新指标',
      expression: metric.expression || '',
      resultType: metric.resultType || 'number',
      targetCell: metric.targetCell || '',
      dependencies: metric.dependencies || [],
      calcTrigger: metric.calcTrigger || 'save',
      priority: metric.priority || 0,
      formatPattern: metric.formatPattern || '',
      description: metric.description || '',
      status: metric.status ?? 1,
      type: metric.type || 'field',
      category: metric.category || '',
    }
    metrics.value.push(newMetric)
    autoSaveStatus.value = 'unsaved'
    return newMetric
  }

  function updateMetric(field, updates) {
    const idx = metrics.value.findIndex(m => m.field === field)
    if (idx >= 0) Object.assign(metrics.value[idx], updates)
    autoSaveStatus.value = 'unsaved'
  }

  function deleteMetric(field) {
    const idx = metrics.value.findIndex(m => m.field === field)
    if (idx >= 0) metrics.value.splice(idx, 1)
    autoSaveStatus.value = 'unsaved'
  }

  function toggleMetricStatus(field) {
    const idx = metrics.value.findIndex(m => m.field === field)
    if (idx >= 0) {
      const current = metrics.value[idx].status
      metrics.value[idx].status = (current === 0 || current === '0') ? 1 : 0
      autoSaveStatus.value = 'unsaved'
    }
  }

  // ========== 数据加载与序列化 ==========
  function initDemoData() {
    rowTree.value = []
    columnTree.value = []
    metrics.value = []
    cellData.clear()
    // 演示数据：行维度含分组 + 分组小计行 + 全表合计行
    rowTree.value = [
      { id: 'r1', name: '销售部', type: 'data', isSummary: false, level: 0, children: [
        { id: 'r1_1', name: '华北', type: 'data', isSummary: false, level: 1, children: [] },
        { id: 'r1_2', name: '华南', type: 'data', isSummary: false, level: 1, children: [] },
      ]},
      { id: 'r1_sub', name: '销售部小计', type: 'summary', isSummary: true,
        summaryType: 'subtotal', summaryScope: 'siblings', aggregateFunc: 'SUM', mergeTitle: false,
        parentId: null, level: 0, children: [] },
      { id: 'r2', name: '市场部', type: 'data', isSummary: false, level: 0, children: [] },
      { id: 'r_gt', name: '合计', type: 'summary', isSummary: true,
        summaryType: 'grandTotal', summaryScope: 'all', aggregateFunc: 'SUM', mergeTitle: false,
        position: 'bottom', parentId: null, level: 0, children: [] },
    ]
    // 演示数据：列维度含分组（多行表头）
    columnTree.value = [
      { id: 'cg1', name: '上半年', type: 'group', level: 0, children: [
        { id: 'c1', name: '1月', type: 'data', columnType: 'number', dataType: 'decimal', level: 1, children: [] },
        { id: 'c2', name: '2月', type: 'data', columnType: 'number', dataType: 'decimal', level: 1, children: [] },
        { id: 'c3', name: '3月', type: 'data', columnType: 'number', dataType: 'decimal', level: 1, children: [] },
      ]},
    ]
    // 演示单元格数据（叶子行 × 叶子列）
    const demo = {
      'r1_1:c1': 120, 'r1_1:c2': 150, 'r1_1:c3': 130,
      'r1_2:c1': 80,  'r1_2:c2': 90,  'r1_2:c3': 110,
      'r2:c1': 60,    'r2:c2': 70,    'r2:c3': 50,
    }
    for (const [k, v] of Object.entries(demo)) cellData.set(k, v)
    // 演示公式：r2 的3月 = r2 的1月 + r2 的2月（展示行内公式计算）
    // flatRowTree 顺序: r1(0), r1_1(1), r1_2(2), r1_sub(3), r2(4), r_gt(5)
    // r2 在 Excel 行号 = 5 (index 4 + 1)
    // c1=A(col 1), c2=B(col 2), c3=C(col 3)
    formulaStore.clear()
    formulaStore.set('r2:c3', '=A5+B5')
    // 演示指标
    metrics.value = [
      { field: 'amount', label: '销售金额', expression: 'amount', resultType: 'currency', targetCell: '', dependencies: [], calcTrigger: 'save', priority: 0, formatPattern: '#,##0.00', description: '' }
    ]
  }

  /**
   * 从后端 ReportDesignerTemplateVO 加载
   */
  function loadFromTemplate(vo) {
    if (!vo) return
    template.id = vo.id
    template.code = vo.code
    template.name = vo.name
    template.version = vo.version
    template.status = vo.status
    template.templateType = vo.templateType ?? 2
    template.description = vo.description
    template.periodType = vo.periodType
    template.auditRequired = vo.auditRequired
    if (vo.layout) Object.assign(layout, vo.layout)
    rowTree.value = vo.rowTree || []
    columnTree.value = vo.columnTree || []
    metrics.value = vo.metrics || []
    aggregates.value = vo.aggregates || []
    validators.value = vo.validators || []
    conditionalFormats.value = vo.conditionalFormats || []
    if (vo.cellData) {
      cellData.clear()
      for (const [k, v] of Object.entries(vo.cellData)) {
        cellData.set(k, v)
      }
    }
    if (vo.formulaStore) {
      formulaStore.clear()
      for (const [k, v] of Object.entries(vo.formulaStore)) {
        formulaStore.set(k, v)
      }
    }
    if (vo.dataSource) Object.assign(dataSource, vo.dataSource)
    if (vo.permissions) Object.assign(permissions, vo.permissions)
    autoSaveStatus.value = 'saved'
  }

  /**
   * 序列化为后端 ReportDesignerTemplateVO
   */
  function serializeToVO() {
    autoCompleteSummaryMetrics()
    return {
      id: template.id,
      code: template.code,
      name: template.name,
      version: template.version,
      status: template.status,
      templateType: template.templateType,
      description: template.description,
      periodType: template.periodType,
      auditRequired: template.auditRequired,
      layout: { ...layout },
      rowTree: JSON.parse(JSON.stringify(rowTree.value)),
      columnTree: JSON.parse(JSON.stringify(columnTree.value)),
      metrics: JSON.parse(JSON.stringify(metrics.value)),
      aggregates: JSON.parse(JSON.stringify(aggregates.value)),
      validators: JSON.parse(JSON.stringify(validators.value)),
      conditionalFormats: JSON.parse(JSON.stringify(conditionalFormats.value)),
      cellData: Object.fromEntries(cellData),
      formulaStore: Object.fromEntries(formulaStore),
      dataSource: { ...dataSource },
      permissions: { ...permissions },
    }
  }

  /**
   * 自动补全所有汇总行的缺失公式指标
   */
  function autoCompleteSummaryMetrics() {
    const summaryRows = flatRowTree.value.filter(r => r.isSummary)
    for (const row of summaryRows) {
      generateSummaryMetrics(row)
    }
  }

  // ========== 列宽和行高 ==========
  const colWidths = ref({})
  const rowHeights = ref({})
  const DEFAULT_COL_WIDTH = 120
  const DEFAULT_ROW_HEIGHT = 32

  function getColWidth(col) {
    if (col === 0) return colWidths.value[0] || layout.defaultColWidth || DEFAULT_COL_WIDTH
    const colNode = flatColumnLeaves.value[col - 1] // col 0 是行表头，1..N 是叶子列
    if (colNode?.width) return colNode.width
    return colWidths.value[col] || layout.defaultColWidth || DEFAULT_COL_WIDTH
  }
  function getRowHeight(row) {
    const headerRows = colHeaderDepth.value
    const dataRowIndex = row - 1 - headerRows // row 0=标题, 1..headerRows=表头
    const rowNode = flatRowTree.value[dataRowIndex]
    if (rowNode?.height) return rowNode.height
    return rowHeights.value[row] || layout.defaultRowHeight || DEFAULT_ROW_HEIGHT
  }
  function setColWidth(col, width) {
    const w = Math.max(30, Math.min(500, parseInt(width) || DEFAULT_COL_WIDTH))
    colWidths.value = { ...colWidths.value, [col]: w }
    autoSaveStatus.value = 'unsaved'
  }
  function setRowHeight(row, height) {
    const h = Math.max(20, Math.min(200, parseInt(height) || DEFAULT_ROW_HEIGHT))
    rowHeights.value = { ...rowHeights.value, [row]: h }
    autoSaveStatus.value = 'unsaved'
  }

  // ========== 右键菜单 ==========
  const contextMenu = reactive({ visible: false, x: 0, y: 0, items: [] })

  // ========== 撤销/重做（简化版） ==========
  const history = ref([])
  const historyIndex = ref(-1)
  function pushHistory() {
    history.value.push({
      rowTree: JSON.parse(JSON.stringify(rowTree.value)),
      columnTree: JSON.parse(JSON.stringify(columnTree.value)),
      cellData: Object.fromEntries(cellData),
      formulaStore: Object.fromEntries(formulaStore),
    })
    if (history.value.length > 50) history.value.shift()
    historyIndex.value = history.value.length - 1
  }
  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)
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
  function restoreHistory(snap) {
    rowTree.value = JSON.parse(JSON.stringify(snap.rowTree))
    columnTree.value = JSON.parse(JSON.stringify(snap.columnTree))
    cellData.clear()
    for (const [k, v] of Object.entries(snap.cellData)) cellData.set(k, v)
    if (snap.formulaStore) {
      formulaStore.clear()
      for (const [k, v] of Object.entries(snap.formulaStore)) formulaStore.set(k, v)
    }
  }

  // ========== 数据源树 ==========
  const dataSourceTree = ref([])

  async function loadDataSourceList() {
    try {
      const { getDataSources } = await import('@/api/reportEngine.js')
      const res = await getDataSources()
      if (res && Array.isArray(res)) {
        dataSourceTree.value = res.map(ds => ({
          ...ds,
          name: ds.sourceName || ds.name || '数据源',
          expanded: true,
          dimensions: ds.dimensions || [],
          metrics: ds.metrics || [],
        }))
      } else {
        dataSourceTree.value = []
      }
    } catch (e) {
      console.warn('加载数据源列表失败:', e)
      dataSourceTree.value = []
      throw e
    }
  }

  // ========== 数据源字段绑定 ==========
  function bindFieldToColumn(colNodeId, field) {
    const node = findNode(columnTree.value, colNodeId)
    if (!node) return
    Object.assign(node, {
      dataField: field.key || field.name,
      dataSourceField: field.key || field.name,
      dataType: mapFieldDataType(field.fieldDataType || field.dataType),
      columnType: mapFieldColumnType(field.fieldDataType || field.dataType, field.dataType),
    })
    // 如果列名还是默认的"新列X"，自动用字段名替换
    if (node.name && /^新列\d+$/.test(node.name)) {
      node.name = field.label || field.name || node.name
    }
    autoSaveStatus.value = 'unsaved'
  }

  function bindFieldToCell(rowNodeId, colNodeId, field) {
    const rowNode = flatRowTree.value.find(r => r.id === rowNodeId)
    if (rowNode && rowNode.isSummary) {
      ElMessage?.info?.('汇总行由聚合自动计算，不可绑定数据字段')
      return
    }
    const key = getCellKey(rowNodeId, colNodeId)
    const ref = `={{${field.key || field.name}}}`
    setCellValue(rowNodeId, colNodeId, ref)
    // 同时在列上记录绑定的字段
    const colNode = findNode(columnTree.value, colNodeId)
    if (colNode && !colNode.dataField) {
      Object.assign(colNode, {
        dataField: field.key || field.name,
        dataType: mapFieldDataType(field.fieldDataType || field.dataType),
      })
    }
    autoSaveStatus.value = 'unsaved'
  }

  function bindFieldToMetric(field) {
    const newMetric = {
      field: field.key || field.name,
      label: field.label || field.name,
      expression: field.key || field.name,
      resultType: mapMetricResultType(field.fieldDataType || field.dataType),
      aggregation: field.aggregation || 'SUM',
      calcTrigger: 'save',
      formatPattern: '',
      type: 'field',
    }
    // 避免重复添加
    const existing = metrics.value.find(m => m.field === newMetric.field)
    if (existing) return existing
    metrics.value.push(newMetric)
    autoSaveStatus.value = 'unsaved'
    return newMetric
  }

  function mapFieldDataType(dt) {
    const map = { integer: 'integer', decimal: 'decimal', number: 'decimal',
      percent: 'percent', currency: 'currency', date: 'date', string: 'string', text: 'string' }
    return map[dt] || 'string'
  }
  function mapFieldColumnType(dt, panelType) {
    if (panelType === 'dimension') return 'text'
    const map = { integer: 'number', decimal: 'number', number: 'number',
      percent: 'number', currency: 'number', date: 'date', string: 'text', text: 'text' }
    return map[dt] || 'text'
  }
  function mapMetricResultType(dt) {
    const map = { integer: 'number', decimal: 'number', number: 'number',
      percent: 'percent', currency: 'currency', date: 'date', string: 'string', text: 'string' }
    return map[dt] || 'number'
  }

  // ========== 提供状态 ==========
  const state = {
    // 元信息
    template, autoSaveStatus, lastSaveTime,
    // 选中
    selectedCell, selectedRegion, editingCell,
    // 布局
    layout,
    // 结构
    rowTree, columnTree, metrics, aggregates, validators, conditionalFormats,
    cellData, dataSource, permissions,
    // 扁平化
    flatRowTree, flatColumnTree, flatColumnLeaves,
    headerMatrix, colHeaderDepth,
    totalRows, totalCols,
    // 方法
    addRowNode, addColNode, deleteRowNode, deleteColNode, updateRowNode, updateColNode,
    getCellValue, setCellValue, getCellKey, selectRegion, startEdit, commitEdit,
    getCellRawValue, hasFormula, getCellFormula, evaluateFormula,
    addMetric, updateMetric, deleteMetric, toggleMetricStatus,
    // 小计/合计行
    addSummaryRow, addGrandTotalRow, updateSummaryRow, computeSummaryValue,
    // 数据源字段绑定
    bindFieldToColumn, bindFieldToCell, bindFieldToMetric,
    // 列头矩阵工具
    getTreeDepth, buildHeaderMatrix,
    initDemoData, loadFromTemplate, serializeToVO, loadDataSourceList,
    // 尺寸
    colWidths, rowHeights, getColWidth, getRowHeight, setColWidth, setRowHeight,
    // 公式
    formulaStore,
    // 兼容
    contextMenu, history, historyIndex, canUndo, canRedo,
    pushHistory, undo, redo,
    dataSourceTree,
  }

  provide(DesignerSymbol, state)
  designerRef.state = state
  return state
}

export function useDesigner() {
  const state = inject(DesignerSymbol)
  if (!state) {
    throw new Error('useDesigner must be used within a designer provider')
  }
  return state
}
