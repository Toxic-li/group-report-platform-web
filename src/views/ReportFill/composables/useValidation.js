/**
 * useValidation - 数据校验系统
 *
 * 从 ReportFill/index.vue 中提取的校验规则加载、
 * 单元格校验、全量校验等逻辑。
 */
import { ref, reactive } from 'vue'

export function useValidation({ config, ValidationEngine }) {
  const validationRules = ref([])
  const validationErrors = reactive({})
  let validationEngine = null

  function initEngine(tpl) {
    if (!config.value) return
    validationEngine = new ValidationEngine({
      template: tpl,
      cellData: config.value.cellData
    })
    validationEngine.validateAll()
  }

  async function loadValidationRules(templateId) {
    try {
      const { getValidatorsByTemplate } = await import('@/api/reportEngine.js')
      const rules = await getValidatorsByTemplate(templateId)
      if (Array.isArray(rules) && rules.length > 0) {
        validationRules.value = rules
      }
    } catch {
      // 静默处理
    }
  }

  function validateCell(rowIdx, colIdx, value) {
    const key = `${rowIdx}-${colIdx}`
    delete validationErrors[key]

    for (const rule of validationRules.value) {
      if (!rule.enabled) continue
      try {
        let isValid = true
        let errorMsg = rule.message || '校验不通过'

        switch (rule.type) {
          case 'required':
            isValid = value !== '' && value != null && String(value).trim() !== ''
            break
          case 'number':
            isValid = value === '' || !isNaN(Number(value))
            errorMsg = rule.message || '请输入有效数字'
            break
          case 'range': {
            const num = Number(value)
            isValid = isNaN(num) ? true : (num >= (rule.min ?? -Infinity) && num <= (rule.max ?? Infinity))
            errorMsg = rule.message || `值应在 ${rule.min} ~ ${rule.max} 之间`
            break
          }
          case 'regex':
            if (value && rule.pattern) {
              isValid = new RegExp(rule.pattern).test(String(value))
              errorMsg = rule.message || '格式不正确'
            }
            break
          case 'custom':
            continue
          default:
            continue
        }

        if (!isValid) {
          validationErrors[key] = { message: errorMsg, type: rule.severity || 'error' }
          if ((rule.severity || 'error') === 'error') break
        }
      } catch {
        // 静默处理
      }
    }

    return !validationErrors[key]
  }

  async function validateAllData() {
    if (!config.value || !validationRules.value.length) return { valid: true, errors: [] }

    const errors = []
    const frozenRows = config.value.frozenRowCount || 4

    config.value.rows?.forEach((row, rIdx) => {
      row.values?.forEach((val, cIdx) => {
        const actualRowIdx = frozenRows + rIdx
        const cellValue = val.v ?? val.raw ?? ''
        validateCell(actualRowIdx, cIdx, cellValue)

        const key = `${actualRowIdx}-${cIdx}`
        if (validationErrors[key]) {
          errors.push({
            row: row.name || `行${rIdx + 1}`,
            col: config.value.columnData[cIdx]?.title || `列${cIdx + 1}`,
            message: validationErrors[key].message
          })
        }
      })
    })

    return { valid: errors.length === 0, errors, count: errors.length }
  }

  return {
    validationRules, validationErrors, validationEngine,
    initEngine, loadValidationRules, validateCell, validateAllData
  }
}
