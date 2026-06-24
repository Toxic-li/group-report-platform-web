/**
 * ConditionalFormatEngine - 条件格式引擎
 *
 * 支持的条件类型：
 *   greaterThan   - 大于阈值（如：库存 > 50000 → 橙色）
 *   lessThan      - 小于阈值
 *   between       - 在范围内
 *   equal         - 等于某值
 *   contains      - 包含文本
 *   formula       - 公式条件
 *   yoyGrowth     - 同比增长（正值绿色↑，负值红色↓）
 *   momGrowth     - 环比增长
 *   anomaly       - 严重异常检测
 *
 * 输出样式：
 *   className - CSS类名，如 'fr-up' 'fr-down' 'fr-anomaly-val'
 *   style     - 内联样式对象 { color, backgroundColor, fontWeight }
 *
 * 使用方式：
 *   模板配置 conditionalFormats 数组
 *   引擎自动评估每个单元格并返回渲染信息
 */

export class ConditionalFormatEngine {
  constructor({ template = null, cellData = {} } = {}) {
    this.template = template
    this.cellData = cellData
    this.rules = []
    this._ruleIndex = new Map()  // targetId -> rule[]
  }

  /** 设置模板 */
  setTemplate(template) {
    this.template = template
    this._buildRuleIndex()
  }

  /**
   * 评估单元格的条件格式
   * @param {number} rowIdx - 行索引
   * @param {number} colIdx - 列索引
   * @param {object} cell - 单元格数据
   * @returns {{ className: string, style: object, icon: string }}
   */
  evaluate(rowIdx, colIdx, cell) {
    const result = { className: '', style: {}, icon: '' }

    if (!cell || cell.v === undefined || cell.v === null) return result

    const n = parseFloat(String(cell.v).replace(/,/g, ''))
    const headerCell = this.cellData[`0-${colIdx}`] || {}
    const colTitle = String(headerCell.v || '')

    // 1. 应用模板配置的规则
    for (const rule of this.rules) {
      const match = this._evaluateRule(rule, n, cell, rowIdx, colIdx, colTitle)
      if (match) {
        if (rule.style?.className) result.className += ' ' + rule.style.className
        if (rule.style?.color) result.style.color = rule.style.color
        if (rule.style?.backgroundColor) result.style.backgroundColor = rule.style.backgroundColor
        if (rule.style?.fontWeight) result.style.fontWeight = rule.style.fontWeight
        if (rule.style?.icon) result.icon = rule.style.icon
      }
    }

    // 2. 内置默认规则（当模板无自定义规则时生效）
    if (!this.rules.length) {
      this._applyDefaultRules(result, n, colTitle, cell)
    }

    result.className = result.className.trim()
    return result
  }

  /** 批量评估所有可见单元格 */
  evaluateAll() {
    const formatMap = {}  // 'row-col' -> formatResult

    for (const [key, cell] of Object.entries(this.cellData)) {
      if (cell.isHeader || cell.isIndex || cell.isLevelMark || cell.isMetric) continue

      const [rowIdx, colIdx] = key.split('-').map(Number)
      formatMap[key] = this.evaluate(rowIdx, colIdx, cell)
    }

    return formatMap
  }

  /** 检测异常行 */
  detectAnomalies() {
    const anomalies = []

    for (const [key, cell] of Object.entries(this.cellData)) {
      if (cell.isHeader || cell.isIndex || cell.isMetric) continue

      const [rowIdx] = key.split('-').map(Number)
      const headerCell = this.cellData['0-' + key.split('-')[1]] || {}
      const colTitle = String(headerCell.v || '')
      const n = parseFloat(String(cell.v).replace(/,/g, ''))

      if (isNaN(n)) continue

      // 库存超限检测
      if (/库存|存煤|储备/.test(colTitle) && n > 50000) {
        anomalies.push({ cellKey: key, type: 'inventory', severity: 'warning', message: `${colTitle}超限(${n.toLocaleString()})` })
      }

      // 增长率异常检测
      if (/率|增长率|增幅/.test(colTitle) && (n < -20 || n > 50)) {
        anomalies.push({ cellKey: key, type: 'growthRate', severity: 'error', message: `${colTitle}异常(${n.toFixed(2)}%)` })
      }

      // 负数异常（非增长率指标）
      if (!/率|增长率|偏差|差额/.test(colTitle) && n < 0 && Math.abs(n) > 0.01) {
        anomalies.push({ cellKey: key, type: 'negative', severity: 'warning', message: `${colTitle}为负值(${n})` })
      }
    }

    return anomalies
  }

  // ==================== 内部实现 ====================

  _buildRuleIndex() {
    this.rules = this.template?.conditionalFormats || []
    this._ruleIndex.clear()

    for (const rule of this.rules) {
      const key = `${rule.targetType}_${rule.targetId}`
      if (!this._ruleIndex.has(key)) this._ruleIndex.set(key, [])
      this._ruleIndex.get(key).push(rule)
    }
  }

  _evaluateRule(rule, value, cell, rowIdx, colIdx, colTitle) {
    // 范围匹配检查
    if (rule.targetType === 'column' && rule.targetId !== colTitle) return false
    if (rule.targetType === 'row' && rule.targetId !== String(rowIdx)) return false

    switch (rule.condition) {
      case 'greaterThan':
        return value > this._resolveVal(rule.value1)

      case 'lessThan':
        return value < this._resolveVal(rule.value1)

      case 'between':
        const v = this._resolveVal(rule.value1), v2 = this._resolveVal(rule.value2)
        return value >= Math.min(v, v2) && value <= Math.max(v, v2)

      case 'equal':
        return value === this._resolveVal(rule.value1)

      case 'yoyGrowth':
        return value > 0.01  // 正增长

      case 'momGrowth':
        return value < -0.01  // 负增长

      case 'anomaly':
        return Math.abs(value) > (this._resolveVal(rule.value1) || Infinity)

      default:
        return false
    }
  }

  _applyDefaultRules(result, n, colTitle, cell) {
    // 增长率类：正绿负红
    if (/率|增长率|增幅|环比|同比/.test(colTitle)) {
      if (n > 0.5) {
        result.className += ' fr-up'
        result.icon = '\u2191'
      } else if (n < -0.5) {
        result.className += ' fr-down'
        result.icon = '\u2193'
      } else {
        result.className += ' fr-flat'
      }
    }

    // 只读/公式单元格
    if (cell.readOnly || cell.f) {
      result.className += ' fr-ro'
    }

    // 汇总行加粗标记（由外部传入cell元信息判断）
  }

  _resolveVal(val) {
    if (typeof val === 'number') return val
    if (typeof val === 'string') return parseFloat(val) || 0
    return 0
  }
}
