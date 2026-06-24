/**
 * ReportEngine - 动态报表引擎（核心）
 *
 * 职责：
 * 1. 接收 templateId，自动加载模板
 * 2. 构建行树/列树
 * 3. 协调各子引擎（公式/校验/汇总/条件格式）
 * 4. 生成 WorkbookConfig 供渲染层使用
 * 5. 管理数据生命周期
 *
 * 设计原则：
 * - 零硬编码，完全由模板驱动
 * - 引擎可插拔，每个子引擎独立运行
 */

import { ReportTemplate, ReportValue, WorkbookConfig, MergeCell } from '../types/engine.js'
import { FormulaEngine } from './engines/FormulaEngine.js'
import { ValidationEngine } from './engines/ValidationEngine.js'
import { AggregateEngine } from './engines/AggregateEngine.js'
import { ConditionalFormatEngine } from './engines/ConditionalFormatEngine.js'

export class ReportEngine {
  constructor(options = {}) {
    this.templateCache = options.templateCache || null
    this.dataLoader = options.dataLoader || null   // 数据加载器接口

    // 当前活跃的模板实例
    this.currentTemplate = null
    this.workbookConfig = null

    // 子引擎实例（懒加载）
    this._formulaEngine = null
    this._validationEngine = null
    this._aggregateEngine = null
    this._conditionalFormatEngine = null

    // 运行时状态
    this.cellData = {}           // { 'row-col': { v, raw, readOnly, f, ... } }
    this.dirtyCells = new Map()  // 已修改但未保存的单元格
    this.listeners = {
      onCellChange: [],         // 单元格变更回调
      onSave: [],               // 保存回调
      onError: []               // 错误回调
    }
  }

  // ==================== 核心流程 ====================

  /**
   * 加载并初始化报表
   * @param {string} templateId - 模板ID
   * @param {object} context - 运行上下文 { orgId, period, userId, role }
   * @returns {Promise<WorkbookConfig>}
   */
  async loadReport(templateId, context = {}) {
    // 1. 加载模板
    const template = await this._loadTemplate(templateId)
    if (!template) throw new Error(`模板不存在: ${templateId}`)

    this.currentTemplate = template

    // 2. 加载数据
    const dataValues = await this._loadData(templateId, context)

    // 3. 构建 WorkbookConfig
    this.workbookConfig = this._buildWorkbook(template, dataValues)

    // 4. 初始化子引擎
    this._initEngines()

    // 5. 执行初始计算
    this.calculateAll()

    return this.workbookConfig
  }

  /**
   * 重新加载当前报表数据（不重建引擎）
   */
  async reloadData(context = {}) {
    if (!this.currentTemplate) return
    const dataValues = await this._loadData(this.currentTemplate.id, context)
    this._populateCells(dataValues)
    this.calculateAll()
    return this.workbookConfig
  }

  // ==================== 子引擎访问 ====================

  get formulaEngine() {
    if (!this._formulaEngine) {
      this._formulaEngine = new FormulaEngine({ cellData: this.cellData })
    }
    return this._formulaEngine
  }

  get validationEngine() {
    if (!this._validationEngine) {
      this._validationEngine = new ValidationEngine({
        template: this.currentTemplate,
        cellData: this.cellData
      })
    }
    return this._validationEngine
  }

  get aggregateEngine() {
    if (!this._aggregateEngine) {
      this._aggregateEngine = new AggregateEngine({
        template: this.currentTemplate,
        cellData: this.cellData
      })
    }
    return this._aggregateEngine
  }

  get conditionalFormatEngine() {
    if (!this._conditionalFormatEngine) {
      this._conditionalFormatEngine = new ConditionalFormatEngine({
        template: this.currentTemplate,
        cellData: this.cellData
      })
    }
    return this._conditionalFormatEngine
  }

  // ==================== 计算协调 ====================

  /** 执行全部计算（公式 → 汇总 → 条件格式） */
  calculateAll() {
    if (!this.currentTemplate) return

    // Step 1: 公式计算
    if (this.currentTemplate.formulas?.length) {
      this.formulaEngine.setFormulas(this.currentTemplate.formulas)
      this.formulaEngine.calculateAll()
    }

    // Step 2: 汇总计算
    if (this.currentTemplate.aggregates?.length) {
      this.aggregateEngine.setAggregates(this.currentTemplate.aggregates)
      this.aggregateEngine.calculateAll()
    }
  }

  /** 增量更新：仅重新计算受影响的单元格 */
  incrementalUpdate(cellKey) {
    // 1. 检测受影响的公式
    const affectedFormulas = this.formulaEngine.getAffectedFormulas(cellKey)
    for (const fk of affectedFormulas) {
      this.formulaEngine.evaluateSingle(fk)
    }

    // 2. 检测受影响的汇总
    const affectedAgg = this.aggregateEngine.getAffectedAggregates(cellKey)
    for (const ak of affectedAgg) {
      this.aggregateEngine.recalculate(ak)
    }
  }

  // ==================== 单元格操作 ====================

  /** 更新单元格值 */
  setCellValue(rowIdx, colIdx, value) {
    const key = `${rowIdx}-${colIdx}`
    const prev = this.cellData[key]
    this.cellData[key] = {
      ...(prev || {}),
      v: value,
      raw: value,
      modified: true
    }
    this.dirtyCells.set(key, { rowIdx, colIdx, value, prev: prev?.v })

    // 触发增量更新
    this.incrementalUpdate(key)

    // 通知监听器
    this._emit('onCellChange', { rowIdx, colIdx, value, prev: prev?.v })

    return value
  }

  /** 获取单元格渲染信息 */
  getCellRenderInfo(rowIdx, colIdx) {
    const key = `${rowIdx}-${colIdx}`
    const cell = this.cellData[key] || {}
    const formatResult = this.conditionalFormatEngine?.evaluate(rowIdx, colIdx, cell)

    return {
      value: cell.v ?? '',
      raw: cell.raw ?? cell.v ?? '',
      readOnly: !!cell.readOnly || !!cell.f,
      formula: cell.f || null,
      className: formatResult?.className || '',
      style: formatResult?.style || {},
      validationError: cell.validationError || ''
    }
  }

  /** 校验单个单元格 */
  validateCell(rowIdx, colIdx, value) {
    return this.validationEngine.validate(rowIdx, colIdx, value)
  }

  /** 获取脏数据（未保存的修改） */
  getDirtyData() {
    return Array.from(this.dirtyCells.entries()).map(([key, data]) => ({
      cellKey: key,
      ...data
    }))
  }

  /** 清除脏数据标记 */
  clearDirtyData() {
    this.dirtyCells.clear()
    Object.values(this.cellData).forEach(cell => { cell.modified = false })
  }

  // ==================== 事件系统 ====================

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback)
    }
    return () => {
      const idx = this.listeners[event]?.indexOf(callback)
      if (idx > -1) this.listeners[event].splice(idx, 1)
    }
  }

  _emit(event, data) {
    (this.listeners[event] || []).forEach(cb => {
      try { cb(data) } catch (e) { console.error(`[ReportEngine] ${event} handler error:`, e) }
    })
  }

  // ==================== 内部方法 ====================

  async _loadTemplate(templateId) {
    // 优先从缓存获取
    if (this.templateCache) {
      const cached = this.templateCache.get(templateId)
      if (cached) return cached
    }

    // 从数据源加载（实际项目中这里调用API）
    if (this.dataLoader?.loadTemplate) {
      return await this.dataLoader.loadTemplate(templateId)
    }

    console.warn(`[ReportEngine] 无数据源，返回空模板: ${templateId}`)
    return null
  }

  async _loadData(templateId, context) {
    if (this.dataLoader?.loadData) {
      return await this.dataLoader.loadData(templateId, context)
    }
    return []
  }

  _initEngines() {
    // 重置引擎引用，触发懒加载时使用新模板
    this._formulaEngine = null
    this._validationEngine = null
    this._aggregateEngine = null
    this._conditionalFormatEngine = null
  }

  _buildWorkbook(template, dataValues) {
    const flatRows = template.getFlatRows()
    const flatCols = template.getFlatColumns()
    const colDepth = template.getColumnDepth()
    const rowDepth = template.getRowDepth()

    this.cellData = {}
    const merges = []

    // 1. 生成列头多级表头
    this._generateColumnHeaders(flatCols, colDepth, rowDepth)

    // 2. 生成行头
    this._generateRowHeaders(flatRows, colDepth, rowDepth)

    // 3. 填充数据单元格
    this._populateCells(dataValues)

    // 4. 生成列宽配置
    const columnData = this._generateColumnWidth(rowDepth, flatCols)

    // 5. 生成行高配置
    const rowData = this._generateRowHeight(colDepth, flatRows)

    return new WorkbookConfig({
      sheetName: template.name,
      frozenRowCount: colDepth,
      frozenColumnCount: Math.min(rowDepth, 3),
      rowData,
      columnData,
      cellData: this.cellData,
      mergeData: merges
    })
  }

  _generateColumnHeaders(flatCols, colDepth, rowDepth) {
    for (let level = 0; level < colDepth; level++) {
      let startCol = rowDepth
      for (const col of flatCols) {
        if (col.level !== level) continue
        const leafCount = this._countLeafChildren(col)
        const cellKey = `${level}-${startCol}`
        this.cellData[cellKey] = {
          v: col.title,
          headerLevel: Math.min(level + 1, 4),
          isHeader: true
        }
        startCol += leafCount
      }
    }
  }

  _generateRowHeaders(flatRows, colDepth, rowDepth) {
    const dataStartRow = colDepth
    flatRows.forEach((row, index) => {
      const rIdx = dataStartRow + index
      this.cellData[`${rIdx}-0`] = { v: String(index + 1), isIndex: true }
      this.cellData[`${rIdx}-1`] = { v: '', isLevelMark: true }
      this.cellData[`${rIdx}-2`] = {
        v: row.name,
        isMetric: true,
        rowMeta: { id: row.id, name: row.name, level: row.level, isSummary: row.isSummary, summaryType: row.summaryType, expandable: row.expandable, hasChildren: !!(row.children?.length) }
      }
    })
  }

  _populateCells(values) {
    if (!this.currentTemplate) return
    const template = this.currentTemplate
    const rowMap = template.getRowMap()
    const colMap = template.getColMap()
    const colDepth = template.getColumnDepth()
    const rowDepth = template.getRowDepth()

    for (const val of values) {
      const rIdx = rowMap.get(val.rowId)
      const cIdx = colMap.get(val.columnId)
      if (rIdx === undefined || cIdx === undefined) continue

      const actualRow = colDepth + rIdx
      const actualCol = rowDepth + cIdx
      const key = `${actualRow}-${actualCol}`

      let displayVal = val.value
      if (val.format === 'percent') displayVal = `${Number(val.value).toFixed(2)}%`
      else if (typeof val.value === 'number') displayVal = Number(val.value).toFixed(2)

      this.cellData[key] = {
        v: displayVal,
        raw: val.value,
        readOnly: !!val.readOnly,
        f: val.formula || undefined,
        format: val.format
      }
    }
  }

  _generateColumnWidth(rowDepth, flatCols) {
    const result = []
    result.push({ w: 38 }, { w: 20 })  // 序号 + 层级缩进
    result.push({ w: 200 })             // 指标名称
    flatCols.forEach(c => {
      result.push({ w: c.width || 100 })
    })
    return result
  }

  _generateRowHeight(colDepth, flatRows) {
    const result = []
    for (let i = 0; i < colDepth; i++) result.push({ h: 26 })  // 表头行高
    for (let i = 0; i < flatRows.length; i++) result.push({ h: 32 }) // 数据行高
    return result
  }

  _countLeafChildren(node) {
    if (!node.children?.length) return 1
    let count = 0
    node.children.forEach(c => { count += this._countLeafChildren(c) })
    return count
  }

  /** 销毁引擎，释放资源 */
  destroy() {
    this.currentTemplate = null
    this.workbookConfig = null
    this.cellData = {}
    this.dirtyCells.clear()
    this._formulaEngine = null
    this._validationEngine = null
    this._aggregateEngine = null
    this._conditionalFormatEngine = null
    this.listeners = { onCellChange: [], onSave: [], onError: [] }
  }
}
