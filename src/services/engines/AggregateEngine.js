/**
 * AggregateEngine - 汇总计算引擎
 *
 * 支持的聚合方法：
 *   sum         - 求和
 *   avg/average - 平均值
 *   count       - 计数
 *   max         - 最大值
 *   min         - 最小值
 *   weightedAvg - 加权平均
 *
 * 支持的汇总级别：
 *   subtotal    - 小计（子节点汇总）
 *   total       - 合计（同级全部）
 *   group       - 区域汇总
 *   grand       - 集团总计
 *
 * 特性：
 *   - 自动从模板 aggregates 配置构建
 *   - 禁止人工修改汇总单元格
 *   - 数据变化时自动增量刷新
 */

export class AggregateEngine {
  constructor({ template = null, cellData = {} } = {}) {
    this.template = template
    this.cellData = cellData
    this.aggregates = new Map()     // id -> AggregateConfig
    this.targetIndex = new Map()    // targetRowId -> AggregateConfig[]
    this.sourceIndex = new Map()    // sourceRowId -> AggregateConfig[] (反向)
  }

  /** 设置汇总配置 */
  setAggregates(aggregateConfigs) {
    this.aggregates.clear()
    this.targetIndex.clear()
    this.sourceIndex.clear()

    for (const ac of aggregateConfigs) {
      this.aggregates.set(ac.id, ac)

      // 目标行索引
      if (!this.targetIndex.has(ac.targetRowId)) {
        this.targetIndex.set(ac.targetRowId, [])
      }
      this.targetIndex.get(ac.targetRowId).push(ac)

      // 源行索引（用于增量更新）
      for (const srcId of ac.sourceRowIds) {
        if (!this.sourceIndex.has(srcId)) {
          this.sourceIndex.set(srcId, [])
        }
        this.sourceIndex.get(srcId).push(ac)
      }
    }
  }

  /** 计算所有汇总 */
  calculateAll() {
    const results = {}

    for (const [id, ac] of this.aggregates) {
      try {
        const val = this._computeAggregate(ac)
        results[id] = val
        this._writeBack(ac, val)
      } catch (e) {
        console.warn(`[AggregateEngine] 汇总 ${id} 计算失败:`, e.message)
        results[id] = '#ERROR'
      }
    }

    return results
  }

  /** 重新计算指定汇总 */
  recalculate(aggregateId) {
    const ac = this.aggregates.get(aggregateId)
    if (!ac) return null
    const val = this._computeAggregate(ac)
    this._writeBack(ac, val)
    return val
  }

  /** 获取受源行变更影响的汇总列表 */
  getAffectedAggregates(sourceRowId) {
    return this.sourceIndex.get(sourceRowId) || []
  }

  /** 获取某目标行的汇总配置 */
  getAggregatesForTarget(targetRowId) {
    return this.targetIndex.get(targetRowId) || []
  }

  // ==================== 内部实现 ====================

  _computeAggregate(ac) {
    const template = this.template
    if (!template) return 0

    const rowMap = template.getRowMap()
    const colMap = template.getColMap()
    const colDepth = template.getColumnDepth()
    const rowDepth = template.getRowDepth()
    const excludeSet = new Set(ac.excludeColumns || [])

    // 收集所有源行的数据列值
    const colValues = {}  // colIdx -> number[]
    const flatCols = template.getFlatColumns()

    for (const srcRowId of ac.sourceRowIds) {
      const rIdx = rowMap.get(srcRowId)
      if (rIdx === undefined) continue

      const actualRow = colDepth + rIdx

      flatCols.forEach((col, cIdx) => {
        if (excludeSet.has(col.id)) return
        if (col.type === 'formula' || col.type === 'aggregate') return

        const actualCol = rowDepth + cIdx
        const key = `${actualRow}-${actualCol}`
        const cell = this.cellData[key]

        if (!colValues[actualCol]) colValues[actualCol] = []

        const n = cell ? parseFloat(String(cell.v).replace(/,/g, '')) : NaN
        if (!isNaN(n) && isFinite(n)) {
          colValues[actualCol].push(n)
        }
      })
    }

    // 对每列执行聚合方法
    const resultValues = {}
    for (const [colIdx, values] of Object.entries(colValues)) {
      resultValues[colIdx] = this._aggregate(values, ac.method)
    }

    // 返回第一列结果作为代表值（实际写入时按列分别写入）
    const firstKey = Object.keys(resultValues)[0]
    return firstKey ? resultValues[firstKey] : 0
  }

  _aggregate(values, method) {
    if (!values.length) return 0

    switch (method.toLowerCase()) {
      case 'sum':
        return parseFloat((values.reduce((a, b) => a + b, 0)).toFixed(4))
      case 'avg':
      case 'average':
        return parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(4))
      case 'count':
        return values.length
      case 'max':
        return parseFloat(Math.max(...values).toFixed(4))
      case 'min':
        return parseFloat(Math.min(...values).toFixed(4))
      case 'weightedavg':
        // 简化：取均值（加权需要额外权重参数）
        return parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(4))
      default:
        return parseFloat((values.reduce((a, b) => a + b, 0)).toFixed(4))
    }
  }

  _writeBack(ac, valuePerCol) {
    const template = this.template
    if (!template) return

    const rowMap = template.getRowMap()
    const colMap = template.getColMap()
    const colDepth = template.getColumnDepth()
    const rowDepth = template.getRowDepth()

    const targetRIdx = rowMap.get(ac.targetRowId)
    if (targetRIdx === undefined) return

    const actualRow = colDepth + targetRIdx
    const flatCols = template.getFlatColumns()
    const excludeSet = new Set(ac.excludeColumns || [])

    flatCols.forEach((col, cIdx) => {
      if (excludeSet.has(col.id)) return

      const actualCol = rowDepth + cIdx
      const key = `${actualRow}-${actualCol}`

      // 收集该列的所有源数据并计算
      const sourceValues = []
      for (const srcRowId of ac.sourceRowIds) {
        const srIdx = rowMap.get(srcRowId)
        if (srIdx === undefined) continue
        const sRow = colDepth + srIdx
        const sKey = `${sRow}-${actualCol}`
        const scell = this.cellData[sKey]
        const n = scell ? parseFloat(String(scell.v).replace(/,/g, '')) : NaN
        if (!isNaN(n) && isFinite(n)) sourceValues.push(n)
      }

      const aggVal = this._aggregate(sourceValues, ac.method)

      if (this.cellData[key]) {
        this.cellData[key].v = aggVal
        this.cellData[key].readOnly = true
        this.cellData[key].f = `=AGGREGATE(${ac.method.toUpperCase()}, ${ac.label || ac.targetRowId})`
      } else {
        this.cellData[key] = { v: aggVal, readOnly: true, f: `=AGGREGATE(${ac.method.toUpperCase()}, ${ac.label || ac.targetRowId})` }
      }
    })
  }
}
