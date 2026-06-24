/**
 * ValidationEngine - 数据校验引擎
 *
 * 支持的校验规则：
 *   required    - 必填校验
 *   numeric     - 数字校验
 *   integer     - 整数校验
 *   positive    - 正数校验 (>0)
 *   nonNegative - 非负数校验 (>=0)
 *   percentRange- 百分比范围 (-100 ~ 100)
 *   range       - 自定义范围 [min, max]
 *   custom      - 自定义函数校验
 *
 * 使用方式：
 *   1. 模板配置中定义 validators 数组
 *   2. 引擎自动匹配并执行校验
 *   3. 返回 { valid, message } 结构
 */

export class ValidationEngine {
  constructor({ template = null, cellData = {} } = {}) {
    this.template = template
    this.cellData = cellData
    this.validators = new Map()     // id -> ValidatorConfig
    this.ruleIndex = new Map()      // 'colId' | 'rowId' -> ValidatorConfig[]
  }

  /** 设置模板（更新校验规则） */
  setTemplate(template) {
    this.template = template
    this._buildRuleIndex()
  }

  /**
   * 校验单个单元格
   * @param {number} rowIdx - 行索引（cellData中的实际行号）
   * @param {number} colIdx - 列索引（cellData中的实际列号）
   * @param {*} value - 待校验值
   * @returns {{ valid: boolean, message: string }}
   */
  validate(rowIdx, colIdx, value) {
    // 获取该单元格关联的所有校验规则
    const rules = this._getRulesForCell(rowIdx, colIdx)
    if (!rules.length) return { valid: true, message: '' }

    for (const rule of rules) {
      const result = this._executeRule(rule, value, rowIdx, colIdx)
      if (!result.valid) return result
    }

    return { valid: true, message: '' }
  }

  /**
   * 校验所有可见数据
   * @returns {{ errors: Array<{ rowIdx, colIdx, message }> }}
   */
  validateAll() {
    const errors = []
    for (const [key, cell] of Object.entries(this.cellData)) {
      if (cell.isHeader || cell.isIndex || cell.isLevelMark || cell.isMetric) continue

      const [rowIdx, colIdx] = key.split('-').map(Number)
      const result = this.validate(rowIdx, colIdx, cell.v)
      if (!result.valid) {
        errors.push({ rowIdx, colIdx, message: result.message })
        cell.validationError = result.message
      } else {
        cell.validationError = ''
      }
    }
    return { errors, isValid: errors.length === 0 }
  }

  /** 获取某列的校验规则列表 */
  getColumnValidators(colId) {
    return this.ruleIndex.get(`col_${colId}`) || []
  }

  /** 获取某行的校验规则列表 */
  getRowValidators(rowId) {
    return this.ruleIndex.get(`row_${rowId}`) || []
  }

  // ==================== 内部实现 ====================

  _buildRuleIndex() {
    this.validators.clear()
    this.ruleIndex.clear()

    if (!this.template?.validators?.length) return

    for (const vc of this.template.validators) {
      this.validators.set(vc.id, vc)

      const indexKey = `${vc.targetType}_${vc.targetId}`
      if (!this.ruleIndex.has(indexKey)) {
        this.ruleIndex.set(indexKey, [])
      }
      this.ruleIndex.get(indexKey).push(vc)
    }
  }

  _getRulesForCell(rowIdx, colIdx) {
    const allRules = []

    // 根据列ID查找
    for (const [, rules] of this.ruleIndex) {
      for (const vc of rules) {
        if (vc.scope === 'region') {
          allRules.push(...vc.rules)
          continue
        }
        // 简化：所有列级/行级规则都收集
        if (vc.targetType === 'column') {
          allRules.push(...vc.rules)
        }
      }
    }

    // 如果没有模板级规则，使用默认通用规则
    if (allRules.length === 0) {
      return this._getDefaultRules(rowIdx, colIdx)
    }

    return allRules
  }

  _getDefaultRules(rowIdx, colIdx) {
    const cell = this.cellData[`${rowIdx}-${colIdx}`] || {}
    const headerCell = this.cellData[`0-${colIdx}`] || {}
    const colTitle = String(headerCell.v || '')
    const rules = []

    // 根据列标题推断适用规则
    if (/产量|销量|运量|用量/.test(colTitle)) {
      rules.push({ type: 'nonNegative', message: `${colTitle}不能为负数` })
    }
    if (/率|%|增长率|占比|进度|完成率/.test(colTitle)) {
      rules.push({
        type: 'percentRange',
        message: `${colTitle}应在 -100% ~ 100% 范围内`
      })
    }
    if (/收入|成本|利润|费用|产值|金额|资金/.test(colTitle)) {
      rules.push({ type: 'numeric', message: `请输入有效的${colTitle}数值` })
    }

    return rules
  }

  _executeRule(rule, value, rowIdx, colIdx) {
    const v = value !== undefined && value !== null ? String(value).trim() : ''

    switch (rule.type) {
      case 'required':
        if (v === '') return { valid: false, message: rule.message || '此字段为必填项' }
        break

      case 'numeric': {
        const n = parseFloat(v)
        if (isNaN(n) || !isFinite(n)) return { valid: false, message: rule.message || '请输入有效数字' }
        break
      }

      case 'integer': {
        const n = parseFloat(v)
        if (isNaN(n) || !Number.isInteger(n)) return { valid: false, message: rule.message || '请输入整数' }
        break
      }

      case 'positive': {
        const n = parseFloat(v)
        if (isNaN(n) || n <= 0) return { valid: false, message: rule.message || '数值必须大于0' }
        break
      }

      case 'nonNegative': {
        const n = parseFloat(v)
        if (isNaN(n) || n < 0) return { valid: false, message: rule.message || '数值不能小于0' }
        break
      }

      case 'percentRange': {
        const n = parseFloat(v)
        if (isNaN(n)) return { valid: false, message: rule.message || '请输入有效百分比' }
        const min = rule.params?.min ?? -100
        const max = rule.params?.max ?? 100
        if (n < min || n > max) return { valid: false, message: rule.message || `百分比范围为 ${min}% ~ ${max}%` }
        break
      }

      case 'range': {
        const n = parseFloat(v)
        if (isNaN(n)) return { valid: false, message: rule.message || '请输入有效数字' }
        const min = rule.params?.min ?? -Infinity
        const max = rule.params?.max ?? Infinity
        if (n < min || n > max) return { valid: false, message: rule.message || `允许范围: ${min} ~ ${max}` }
        break
      }

      case 'custom': {
        if (typeof rule.params?.customFn === 'function') {
          try {
            const customResult = rule.params.customFn(value, rowIdx, colIdx, this.cellData)
            if (customResult !== true) {
              return { valid: false, message: customResult || rule.message || '自定义校验未通过' }
            }
          } catch (e) {
            return { valid: false, message: `校验错误: ${e.message}` }
          }
        }
        break
      }

      default:
        break
    }

    return { valid: true, message: '' }
  }
}
