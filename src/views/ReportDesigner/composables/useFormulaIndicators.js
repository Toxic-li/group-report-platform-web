import { ref, reactive, computed, watch } from 'vue'
import { createFormulaService } from '@/services/formula'

const formulaService = createFormulaService()

function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export function useFormulaIndicators(props) {
  const indicatorSearch = ref('')
  const allIndicators = ref([])
  const recentIndicators = ref([])
  const favoriteIndicators = ref([])
  const systemVariables = ref([])

  const expandedCategories = reactive({
    basic: true,
    calculated: true,
    recent: true,
    favorite: true,
    public: false,
    dimension: false,
    cell: true,
    parameter: false
  })

  const indicatorTooltip = ref(null)
  const tooltipStyle = reactive({
    top: '0px',
    left: '0px'
  })

  const indicatorCategories = computed(() => {
    return [
      { key: 'basic', name: '基础指标', indicators: allIndicators.value.filter(i => i.category === 'basic' || i.type === 'metric' || !i.category) },
      { key: 'calculated', name: '计算指标', indicators: allIndicators.value.filter(i => i.category === 'calculated' || i.type === 'formula') },
      { key: 'public', name: '公共指标', indicators: allIndicators.value.filter(i => i.category === 'public') },
      { key: 'dimension', name: '维度', indicators: allIndicators.value.filter(i => i.category === 'dimension' || i.category === 'column' || i.category === 'row' || i.type === 'dimension') },
      { key: 'cell', name: '单元格', indicators: allIndicators.value.filter(i => i.category === 'cell' || i.type === 'cell') },
      { key: 'parameter', name: '参数', indicators: allIndicators.value.filter(i => i.category === 'parameter') }
    ]
  })

  function initializeIndicators() {
    if (props.indicators && props.indicators.length > 0) {
      formulaService.registerIndicators(props.indicators)
      allIndicators.value = props.indicators
    } else {
      allIndicators.value = []
    }

    if (props.template) {
      const extracted = formulaService.extractIndicatorsFromTemplate(props.template)
      if (extracted && extracted.length > 0) {
        allIndicators.value = [...allIndicators.value, ...extracted]
      }
    }

    const recent = localStorage.getItem('formula-recent-indicators')
    if (recent) {
      recentIndicators.value = JSON.parse(recent)
    }

    const favorites = localStorage.getItem('formula-favorite-indicators')
    if (favorites) {
      favoriteIndicators.value = JSON.parse(favorites)
    }

    systemVariables.value = formulaService.getAllVariables()
  }

  function searchIndicators() {
    if (indicatorSearch.value) {
      allIndicators.value = formulaService.searchIndicators(indicatorSearch.value)
    } else {
      initializeIndicators()
    }
  }

  function toggleCategory(category) {
    expandedCategories[category] = !expandedCategories[category]
  }

  function addToRecentIndicators(indicator) {
    const recent = recentIndicators.value.filter(i => i.id !== indicator.id)
    recent.unshift(indicator)
    recentIndicators.value = recent.slice(0, 10)
    localStorage.setItem('formula-recent-indicators', JSON.stringify(recentIndicators.value))
  }

  function isFavorite(indicatorId) {
    return favoriteIndicators.value.some(fav => fav.id === indicatorId)
  }

  function toggleFavorite(indicator, showNotification) {
    const index = favoriteIndicators.value.findIndex(fav => fav.id === indicator.id)
    if (index > -1) {
      favoriteIndicators.value.splice(index, 1)
      showNotification && showNotification('info', '☆', `已取消收藏: ${indicator.name}`)
    } else {
      favoriteIndicators.value.unshift(indicator)
      showNotification && showNotification('success', '⭐', `已收藏: ${indicator.name}`)
    }
    localStorage.setItem('formula-favorite-indicators', JSON.stringify(favoriteIndicators.value))
  }

  function showIndicatorTooltip(indicator) {
    indicatorTooltip.value = indicator
    tooltipStyle.top = '10px'
    tooltipStyle.left = '100%'
  }

  function showVariableTooltip(variable) {
    indicatorTooltip.value = {
      name: variable.name,
      code: variable.value,
      type: 'Variable',
      description: variable.description
    }
    tooltipStyle.top = '10px'
    tooltipStyle.left = '100%'
  }

  function hideIndicatorTooltip() {
    indicatorTooltip.value = null
  }

  function insertVariable(variable, monacoEditor) {
    if (!monacoEditor && window.monaco && window.monaco.editor) {
      const editors = window.monaco.editor.getEditors()
      if (editors.length > 0) {
        monacoEditor = editors[0]
      }
    }
    if (!monacoEditor) return
    const position = monacoEditor.getPosition()
    monacoEditor.executeEdits('', [{
      range: new window.monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
      text: variable.name
    }])
  }

  function getIndicatorIcon(category) {
    const icons = { basic: '📊', calculated: 'Σ', public: '🌍', dimension: '📍', parameter: '⚙' }
    return icons[category] || '📊'
  }

  function getDataTypeIcon(type) {
    const icons = {
      number: '📈',
      Number: '📈',
      decimal: '📈',
      int: '📈',
      percent: '%',
      Percentage: '%',
      date: '📅',
      Date: '📅',
      datetime: '📅',
      string: '📝',
      String: '📝',
      text: '📝',
      boolean: '✓',
      Boolean: '✓'
    }
    return icons[type] || '📈'
  }

  const debouncedIndicatorSearch = debounce((searchTerm) => {
    if (!searchTerm) {
      initializeIndicators()
      return
    }
    const results = allIndicators.value.filter(indicator =>
      indicator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      indicator.code.toLowerCase().includes(searchTerm.toLowerCase())
    )
    if (results.length > 0) {
      allIndicators.value = results
    }
  }, 300)

  watch(indicatorSearch, (newValue) => {
    debouncedIndicatorSearch(newValue)
  })

  return {
    indicatorSearch,
    allIndicators,
    recentIndicators,
    favoriteIndicators,
    systemVariables,
    expandedCategories,
    indicatorCategories,
    indicatorTooltip,
    tooltipStyle,

    initializeIndicators,
    searchIndicators,
    toggleCategory,
    addToRecentIndicators,
    isFavorite,
    toggleFavorite,
    showIndicatorTooltip,
    showVariableTooltip,
    hideIndicatorTooltip,
    insertVariable,
    getIndicatorIcon,
    getDataTypeIcon
  }
}