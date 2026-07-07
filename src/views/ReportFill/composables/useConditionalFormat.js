/**
 * useConditionalFormat - 条件格式系统
 *
 * 从 ReportFill/index.vue 中提取的条件格式规则加载、
 * 应用、评估等逻辑。
 */
import { ref, reactive } from 'vue'

export function useConditionalFormat({ config, ConditionalFormatEngine }) {
  const conditionalFormats = ref([])
  const appliedFormats = reactive({})
  let conditionalFormatEngine = null

  function initEngine(tpl) {
    if (!config.value) return
    conditionalFormatEngine = new ConditionalFormatEngine({
      template: tpl,
      cellData: config.value.cellData
    })
  }

  async function loadConditionalFormats(templateId) {
    try {
      const { getConditionalFormatsByTemplate } = await import('@/api/reportEngine.js')
      const formats = await getConditionalFormatsByTemplate(templateId)

      if (Array.isArray(formats) && formats.length > 0) {
        conditionalFormats.value = formats
        applyConditionalFormats()
      }
    } catch {
      // 静默处理，条件格式加载失败不阻塞报表渲染
    }
  }

  function applyConditionalFormats() {
    if (!config.value || !conditionalFormats.value.length) return

    Object.keys(appliedFormats).forEach(key => delete appliedFormats[key])

    const frozenRows = config.value.frozenRowCount || 4

    conditionalFormats.value.forEach(rule => {
      config.value.rows?.forEach((row, rIdx) => {
        row.values?.forEach((val, cIdx) => {
          const actualRowIdx = frozenRows + rIdx
          const key = `${actualRowIdx}-${cIdx}`
          const cellValue = val.v ?? val.raw ?? ''
          if (evaluateCondition(rule.condition, cellValue)) {
            appliedFormats[key] = {
              backgroundColor: rule.style?.backgroundColor || '',
              color: rule.style?.color || '',
              fontWeight: rule.style?.fontWeight || '',
              icon: rule.icon,
              tooltip: rule.name || ''
            }
          }
        })
      })
    })
  }

  function evaluateCondition(condition, value) {
    if (!condition) return false
    try {
      const numVal = Number(value)
      if (isNaN(numVal)) return false
      switch (condition.operator) {
        case 'gt': return numVal > condition.value
        case 'gte': return numVal >= condition.value
        case 'lt': return numVal < condition.value
        case 'lte': return numVal <= condition.value
        case 'eq': return numVal === condition.value
        case 'neq': return numVal !== condition.value
        case 'between':
          return numVal >= (condition.min ?? -Infinity) && numVal <= (condition.max ?? Infinity)
        case 'contains':
          return String(value).includes(String(condition.value))
        default: return false
      }
    } catch { return false }
  }

  function conditionalFormatClass(val, row) {
    const classes = []
    if (conditionalFormatEngine) {
      const n = parseFloat(val.v)
      if (!isNaN(n)) {
        const fmt = conditionalFormatEngine.evaluate(val.colIdx, val.colIdx, { ...val, v: n })
        if (fmt.className) classes.push(fmt.className)
      }
    }
    const frozenRows = config.value?.frozenRowCount || 4
    const rowIdx = config.value?.rows?.indexOf(row)
    if (rowIdx >= 0) {
      const actualRowIdx = frozenRows + rowIdx
      const formatKey = `${actualRowIdx}-${val.colIdx}`
      if (appliedFormats[formatKey]) classes.push('fr-cf-applied')
    }
    return classes.join(' ')
  }

  function conditionalFormatStyle(val, row) {
    const style = {}
    if (conditionalFormatEngine) {
      const n = parseFloat(val.v)
      if (!isNaN(n)) {
        const fmt = conditionalFormatEngine.evaluate(val.colIdx, val.colIdx, { ...val, v: n })
        Object.assign(style, fmt.style || {})
      }
    }
    const frozenRows = config.value?.frozenRowCount || 4
    const rowIdx = config.value?.rows?.indexOf(row)
    if (rowIdx >= 0) {
      const actualRowIdx = frozenRows + rowIdx
      const formatKey = `${actualRowIdx}-${val.colIdx}`
      const cf = appliedFormats[formatKey]
      if (cf) {
        if (cf.backgroundColor) style.backgroundColor = cf.backgroundColor
        if (cf.color) style.color = cf.color
        if (cf.fontWeight) style.fontWeight = cf.fontWeight
      }
    }
    return style
  }

  return {
    conditionalFormats, appliedFormats, conditionalFormatEngine,
    initEngine, loadConditionalFormats, applyConditionalFormats,
    conditionalFormatClass, conditionalFormatStyle
  }
}
