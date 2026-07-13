/**
 * 报表模板 V2 解析器
 *
 * 职责：将JSON模板转换为前端可渲染的数据结构
 * - JSON → 行/列树 → 扁平数据 → 单元格矩阵
 * - 支持公式引擎集成
 * - 支持校验引擎集成
 */

import { ReportTemplateV2, RowNode, ColumnNode, MetricConfig } from '../types/report-v2.js'

export class ReportTemplateParser {
  constructor() {
    this.template = null
    this.flatRows = []
    this.flatCols = []
    this.leafRows = []
    this.leafCols = []
    this.cellMatrix = []       // 二维数组: cellMatrix[rowIdx][colIdx]
    this.colSpanMap = {}       // 列合并信息
    this.rowSpanMap = {}       // 行合并信息
  }

  /**
   * 加载并解析JSON模板
   * @param {Object|string} json - JSON对象或代码
   * @returns {ReportTemplateParser} this（链式调用）
   */
  load(json) {
    if (typeof json === 'string') {
      try { json = JSON.parse(json) }
      catch (e) { throw new Error(`模板JSON解析失败: ${e.message}`) }
    }

    this.template = new ReportTemplateV2(json)
    return this
  }

  /**
   * 执行完整解析流程
   */
  parse() {
    if (!this.template) throw new Error('请先调用 load() 加载模板')

    // 1. 扁平化行树和列树
    this._flattenTrees()

    // 2. 构建单元格矩阵
    this._buildCellMatrix()

    // 3. 计算合并单元格
    this._calcSpans()

    return this
  }

  // ==================== 核心API ====================

  /** 获取模板实例 */
  getTemplate() { return this.template }

  /** 获取扁平化行列表 */
  getFlatRows() { return this.flatRows }

  /** 获取扁平化列列表 */
  getFlatColumns() { return this.flatCols }

  /** 获取叶子节点行 */
  getLeafRows() { return this.leafRows }

  /** 获取叶子节点列 */
  getLeafColumns() { return this.leafCols }

  /** 获取单元格矩阵 */
  getCellMatrix() { return this.cellMatrix }

  /** 获取指定行列的单元格 */
  getCell(rowIdx, colIdx) {
    return this.cellMatrix[rowIdx]?.[colIdx] || null
  }

  /** 获取所有计算指标（公式） */
  getMetrics() { return this.template.metrics }

  /** 根据字段名查找指标 */
  getMetricByField(field) {
    return this.template.metrics.find(m => m.field === field)
  }

  /** 获取所有校验规则 */
  getValidators() { return this.template.validators }

  /** 获取所有条件格式 */
  getConditionalFormats() { return this.template.conditionalFormats }

  /** 获取布局配置 */
  getLayout() { return this.template.layout }

  /** 获取数据源配置 */
  getDataSource() { return this.template.dataSource }

  // ==================== 内部方法 ====================

  /** 扁平化树结构 */
  _flattenTrees() {
    const rowTree = this.template.rowTree || []
    const colTree = this.template.columnTree || []

    this.flatRows = this._flattenNodes(rowTree, RowNode, 'name')
    this.flatCols = this._flattenNodes(colTree, ColumnNode, 'title')

    this.leafRows = this._getLeaves(rowTree)
    this.leafCols = this._getLeaves(colTree)

    // 补充level信息
    this._assignLevels(this.flatRows, rowTree, 0)
    this._assignLevels(this.flatCols, colTree, 0)
  }

  _flattenNodes(nodes, NodeClass, labelKey) {
    const result = []
    const walk = (items, level = 0) => {
      for (const item of items) {
        const node = new NodeClass({ ...item, level })
        result.push(node)
        if (item.children?.length) {
          walk(item.children, level + 1)
        }
      }
    }
    walk(nodes)
    return result
  }

  _getLeaves(nodes) {
    const leaves = []
    const walk = (items) => {
      for (const item of items) {
        if (!item.children?.length || item.children.length === 0) {
          leaves.push(item)
        } else {
          walk(item.children)
        }
      }
    }
    walk(nodes)
    return leaves
  }

  _assignLevels(flatList, tree, startLevel) {
    const walk = (nodes, level) => {
      for (const node of nodes) {
        const found = flatList.find(f => f.id === node.id)
        if (found) found.level = level
        if (node.children?.length) walk(node.children, level + 1)
      }
    }
    walk(tree, startLevel)
  }

  /** 构建单元格矩阵 */
  _buildCellMatrix() {
    const rowCount = this.flatRows.length
    const colCount = this.leafCols.length

    this.cellMatrix = Array.from({ length: rowCount }, () =>
      Array.from({ length: colCount }, () => null)
    )

    // 填充每个单元格
    for (let ri = 0; ri < rowCount; ri++) {
      const row = this.flatRows[ri]
      for (let ci = 0; ci < colCount; ci++) {
        const col = this.leafCols[ci]
        this.cellMatrix[ri][ci] = this._createCell(row, col, ri, ci)
      }
    }
  }

  _createCell(row, col, rowIdx, colIdx) {
    const base = {
      v: '',                    // 显示值
      raw: '',                  // 原始值
      readOnly: false,
      formula: null,
      f: null,
      colIdx,
      colTitle: col.title || col.name,
      rowId: row.id,
      rowName: row.name,
      style: {},
      validators: [],
      formats: []
    }

    // 检查是否有列级公式
    if (col.formula) {
      base.readOnly = true
      base.formula = col.formula
      base.f = col.formula
    }

    // 检查是否为汇总行
    if (row.isSummary) {
      base.readOnly = true
      base.style.fontWeight = 'bold'
    }

    // 应用指标公式（如果有匹配）
    const metric = this.getMetricByTarget(row.id, col.id)
    if (metric) {
      base.formula = metric.expression
      base.f = metric.expression
      base.readOnly = true
      base.metricField = metric.field
    }

    // 应用校验规则
    base.validators = this._getMatchingValidators(row, col)

    // 应用条件格式
    base.formats = this._getMatchingFormats(row, col)

    return base
  }

  /** 查找目标单元格的指标 */
  getMetricByTarget(rowId, colId) {
    return this.template.metrics.find(m => {
      if (!m.targetCell) return false
      // 精确匹配 "rowId:colId" 或 "rowId-colId" 格式
      return m.targetCell === `${rowId}:${colId}` ||
             m.targetCell === `${rowId}-${colId}`
    }) || null
  }

  /** 计算合并单元格 */
  _calcSpans() {
    this.colSpanMap = {}
    this.rowSpanMap = {}

    // 列头合并（基于列树层级）
    this._calcColSpans(this.template.columnTree || [], 0)

    // 行头合并（基于行树层级）
    this._calcRowSpans(this.template.rowTree || [], 0)
  }

  _calcColSpans(nodes, depth) {
    for (const node of nodes) {
      if (node.children?.length > 0) {
        const leafCount = this._countLeaves(node)
        this.colSpanMap[`${depth}_${node.id}`] = leafCount
        this._calcColSpans(node.children, depth + 1)
      }
    }
  }

  _calcRowSpans(nodes, depth) {
    for (const node of nodes) {
      if (node.children?.length > 0) {
        const leafCount = this._countLeaves(node)
        this.rowSpanMap[`${depth}_${node.id}`] = leafCount
        this._calcRowSpans(node.children, depth + 1)
      }
    }
  }

  _countLeaves(node) {
    if (!node.children?.length) return 1
    let count = 0
    for (const child of node.children) {
      count += this._countLeaves(child)
    }
    return count
  }

  /** 获取匹配的校验规则 */
  _getMatchingValidators(row, col) {
    const results = []
    for (const v of this.template.validators) {
      if (!v.enabled) continue

      let match = false
      if (v.targetType === 'field' && (v.targetId === col.id || v.targetId === '*')) match = true
      if (v.targetType === 'pattern' && this._matchPattern(v.targetId, col.title)) match = true
      if (v.targetType === 'row' && (v.targetId === row.id || v.targetId === '*')) match = true

      if (match) results.push(v)
    }
    return results
  }

  /** 获取匹配的条件格式 */
  _getMatchingFormats(row, col) {
    const results = []
    for (const cf of this.template.conditionalFormats) {
      if (!cf.enabled) continue

      let match = false
      if (cf.targetType === 'field' && cf.targetId === col.id) match = true
      if (cf.targetType === 'pattern' && this._matchPattern(cf.targetId, col.title)) match = true

      if (match) results.push(cf)
    }
    return results
  }

  _matchPattern(pattern, text) {
    if (!pattern || !text) return false
    if (pattern === '*') return true
    // 简单通配符支持
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
    return regex.test(text)
  }

  // ==================== 工具方法 ====================

  /**
   * 将当前状态导出为可传输的JSON
   * 用于保存到后端或localStorage
   */
  exportJSON() {
    if (!this.template) return null
    return this.template.toJSON()
  }

  /**
   * 验证模板完整性
   */
  validate() {
    if (!this.template) return { valid: false, errors: ['未加载模板'] }
    return this.template.validate()
  }

  /**
   * 获取模板摘要信息
   */
  getSummary() {
    if (!this.template) return null
    return {
      id: this.template.id,
      name: this.template.name,
      code: this.template.code,
      version: this.template.version,
      status: this.template.status,
      rowCount: this.flatRows.length,
      colCount: this.leafCols.length,
      metricCount: this.template.metrics.length,
      validatorCount: this.template.validators.length,
      formatCount: this.template.conditionalFormats.length
    }
  }
}

/**
 * 工厂函数：快速创建解析器实例
 */
export function createParser(json) {
  const parser = new ReportTemplateParser()
  if (json) parser.load(json).parse()
  return parser
}
