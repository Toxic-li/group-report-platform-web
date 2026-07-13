/**
 * Formula Context - 共享公式状态管理
 *
 * 支持两种运行模式：
 * 1. 嵌入式模式（主模式）：在 ReportDesigner 内部切换 formulaMode 时使用
 *    直接读写 reactive state，切换零延迟
 * 2. 独立页面模式：访问 /designer/formula?reportId=... 时使用
 *    通过 URL query 初始化，仍共享同一份 state
 *
 * 设计原则：
 * - 模块级单例 reactive，任何组件 import 后共享同一份数据
 * - URL 只负责定位（reportId, sheet, cell），不传公式内容
 * - 公式修改立即反应到 ReportDesigner 的 Spreadsheet
 * - 为未来 Undo/Redo 预留 formulaHistory
 */

import { ref, reactive, computed } from 'vue'

// ============ 公式上下文数据结构 ============

export const formulaContext = reactive({
  /** 当前选中的上下文 */
  reportId: '',
  sheetId: 'Sheet1',
  cellId: '',

  /** 公式列表（按单元格组织） */
  formulas: new Map(), // key: "sheetId:cellId" -> FormulaEntry

  /** 计算字段列表 */
  calcFields: [],

  /** 当前编辑的公式 */
  currentFormula: '',

  /** 公式结果 */
  formulaResult: '',

  /** 依赖关系 (from -> to) */
  dependencies: [],

  /** 错误列表 */
  errors: [],

  /** 统计（运行时计算，初始为0） */
  formulaCount: 0,
  calcFieldCount: 0,
  errorCount: 0,
  depCount: 0,
  calcTime: '--',

  /** 缩放 */
  zoom: 100,

  /** 最近使用的函数 */
  recentFunctions: [],

  /** 命名区域 */
  namedRanges: [],

  /** 计算链（依赖顺序） */
  calcChain: [],

  /** FormulaEditor 模式标记 */
  isDirty: false,
  autoSaveStatus: 'saved' // saved | saving | unsaved
})

// ============ 初始化（独立页面模式：从 URL 读取定位信息） ============

export function initFormulaContextFromURL(route) {
  formulaContext.reportId = route.query.reportId || route.params.code || ''
  formulaContext.sheetId = route.query.sheet || 'Sheet1'
  formulaContext.cellId = route.query.cell || ''
}

// ============ 嵌入式初始化（从 Designer 上下文同步） ============

export function initFormulaContextFromDesigner(designerCtx) {
  formulaContext.reportId = designerCtx.templateCode || ''
  formulaContext.sheetId = designerCtx.sheetName || 'Sheet1'
  formulaContext.cellId = designerCtx.cellRef || ''
  formulaContext.currentFormula = designerCtx.currentFormula || ''
  formulaContext.formulaResult = designerCtx.formulaResult || ''
}

// ============ 操作函数 ============

export function setCurrentCell(ref, formula) {
  formulaContext.cellId = ref
  if (formula !== undefined) {
    formulaContext.currentFormula = formula
  }
}

export function updateCurrentFormula(formula) {
  formulaContext.currentFormula = formula
  formulaContext.isDirty = true
  formulaContext.autoSaveStatus = 'unsaved'

  // 实时同步回 Spreadsheet（未来通过事件总线）
  if (formulaContext.cellId) {
    const key = `${formulaContext.sheetId}:${formulaContext.cellId}`
    formulaContext.formulas.set(key, {
      cellId: formulaContext.cellId,
      formula,
      updatedAt: Date.now()
    })
  }
}

export function saveFormula() {
  formulaContext.isDirty = false
  formulaContext.autoSaveStatus = 'saved'

  if (formulaContext.cellId) {
    const key = `${formulaContext.sheetId}:${formulaContext.cellId}`
    formulaContext.formulas.set(key, {
      cellId: formulaContext.cellId,
      formula: formulaContext.currentFormula,
      synced: true,
      updatedAt: Date.now()
    })
  }
}

export function addCalcField(name, formula, type = 'number') {
  const existing = formulaContext.calcFields.find(f => f.name === name)
  if (existing) {
    existing.formula = formula
    existing.type = type
  } else {
    formulaContext.calcFields.push({ name, formula, type })
  }
  formulaContext.calcFieldCount = formulaContext.calcFields.length
}

export function removeCalcField(name) {
  formulaContext.calcFields = formulaContext.calcFields.filter(f => f.name !== name)
  formulaContext.calcFieldCount = formulaContext.calcFields.length
}

export function addError(error) {
  formulaContext.errors.push({ ...error, time: new Date().toLocaleTimeString() })
  formulaContext.errorCount = formulaContext.errors.length
}

export function clearErrors() {
  formulaContext.errors = []
  formulaContext.errorCount = 0
}

export function setZoom(z) {
  formulaContext.zoom = z
}

// ============ 计算 ============

export function getFormulaForCell(ref) {
  const key = `${formulaContext.sheetId}:${ref}`
  return formulaContext.formulas.get(key)?.formula || ''
}

export function hasFormulaForCell(ref) {
  const key = `${formulaContext.sheetId}:${ref}`
  return formulaContext.formulas.has(key)
}

// ============ 监听器（用于跨组件通信） ============

let _listeners = {}

export function onFormulaContextEvent(event, callback) {
  if (!_listeners[event]) _listeners[event] = []
  _listeners[event].push(callback)
  return () => {
    _listeners[event] = _listeners[event].filter(cb => cb !== callback)
  }
}

function emitFormulaContextEvent(event, payload) {
  if (_listeners[event]) {
    _listeners[event].forEach(cb => cb(payload))
  }
}

// 触发公式保存事件，通知 ReportDesigner 刷新
export function notifyFormulaSaved(cell, formula) {
  emitFormulaContextEvent('formula-saved', { cell, formula })
}

export function notifyFormulaChanged(cell, formula) {
  emitFormulaContextEvent('formula-changed', { cell, formula })
}
