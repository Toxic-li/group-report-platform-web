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

export function useFormulaFunctions(showNotification) {
  const functionSearch = ref('')
  const allFunctions = ref([])
  const displayFunctions = ref(null) // null 表示使用 allFunctions
  const recentFunctions = ref([])
  const favoriteFunctions = ref([])
  const selectedFunction = ref(null)
  const functionFilter = ref('all')
  const functionTooltip = ref(null)

  const expandedFunctionCategories = reactive({
    basic: true,
    aggregate: true,
    conditional: false,
    text: false,
    date: false,
    time_analysis: false,
    business: false,
    window: false
  })

  const functionCategories = computed(() => {
    const source = displayFunctions.value || allFunctions.value
    let filteredFunctions = source

    if (functionFilter.value === 'favorite') {
      filteredFunctions = source.filter(f =>
        favoriteFunctions.value.some(fav => fav.name === f.name)
      )
    } else if (functionFilter.value === 'recent') {
      filteredFunctions = source.filter(f =>
        recentFunctions.value.some(rf => rf.name === f.name)
      )
    }

    return [
      { key: 'basic', name: '数学函数', functions: filteredFunctions.filter(f => f.category === 'basic') },
      { key: 'aggregate', name: '统计函数', functions: filteredFunctions.filter(f => f.category === 'aggregate') },
      { key: 'conditional', name: '逻辑函数', functions: filteredFunctions.filter(f => f.category === 'conditional') },
      { key: 'text', name: '文本函数', functions: filteredFunctions.filter(f => f.category === 'text') },
      { key: 'date', name: '日期函数', functions: filteredFunctions.filter(f => f.category === 'date') },
      { key: 'time_analysis', name: '时间分析', functions: filteredFunctions.filter(f => f.category === 'time_analysis') },
      { key: 'business', name: '业务函数', functions: filteredFunctions.filter(f => f.category === 'business') },
      { key: 'window', name: '窗口函数', functions: filteredFunctions.filter(f => f.category === 'window') }
    ]
  })

  function initializeFunctions() {
    allFunctions.value = formulaService.getAllFunctions()
    displayFunctions.value = null // 重置搜索状态
    const recent = localStorage.getItem('formula-recent-functions')
    if (recent) {
      recentFunctions.value = JSON.parse(recent)
    }
    const favorites = localStorage.getItem('formula-favorite-functions')
    if (favorites) {
      favoriteFunctions.value = JSON.parse(favorites)
    }
  }

  function searchFunctions() {
    if (functionSearch.value) {
      displayFunctions.value = formulaService.getAllFunctions().filter(f =>
        f.name.toLowerCase().includes(functionSearch.value.toLowerCase()) ||
        f.description.toLowerCase().includes(functionSearch.value.toLowerCase())
      )
    } else {
      displayFunctions.value = null
    }
  }

  function toggleFunctionCategory(category) {
    expandedFunctionCategories[category] = !expandedFunctionCategories[category]
  }

  function showFunctionDetail(func) {
    selectedFunction.value = func
  }

  function closeFunctionDetail() {
    selectedFunction.value = null
  }

  function addToRecentFunctions(func) {
    const recent = recentFunctions.value.filter(f => f.name !== func.name)
    recent.unshift(func)
    recentFunctions.value = recent.slice(0, 10)
    localStorage.setItem('formula-recent-functions', JSON.stringify(recentFunctions.value))
  }

  function isFunctionFavorite(functionName) {
    return favoriteFunctions.value.some(fav => fav.name === functionName)
  }

  function toggleFunctionFavorite(func) {
    const index = favoriteFunctions.value.findIndex(fav => fav.name === func.name)
    if (index > -1) {
      favoriteFunctions.value.splice(index, 1)
      showNotification && showNotification('info', '☆', `已取消收藏函数: ${func.name}`)
    } else {
      favoriteFunctions.value.unshift(func)
      showNotification && showNotification('success', '⭐', `已收藏函数: ${func.name}`)
    }
    localStorage.setItem('formula-favorite-functions', JSON.stringify(favoriteFunctions.value))
  }

  function showFunctionTooltip(func) {
    functionTooltip.value = func
  }

  function hideFunctionTooltip() {
    functionTooltip.value = null
  }

  function setFunctionFilter(filter) {
    functionFilter.value = filter
  }

  function getCategoryColor(category) {
    const colors = {
      '聚合函数': '#00B578',
      '数学函数': '#2563EB',
      '逻辑函数': '#8b5cf6',
      '时间分析': '#FFB020',
      '文本函数': '#06b6d4',
      '业务函数': '#ec4899'
    }
    return colors[category] || '#64748b'
  }

  function getFunctionRating(functionName) {
    const ratings = {
      'SUM': '★★★★★',
      'AVG': '★★★★☆',
      'IF': '★★★★★',
      'MAX': '★★★★☆',
      'MIN': '★★★★☆'
    }
    return ratings[functionName] || '★★★☆☆'
  }

  const debouncedFunctionSearch = debounce((searchTerm) => {
    if (!searchTerm) {
      displayFunctions.value = null
      return
    }
    const results = allFunctions.value.filter(func =>
      func.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      func.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    displayFunctions.value = results.length > 0 ? results : []
  }, 300)

  watch(functionSearch, (newValue) => {
    debouncedFunctionSearch(newValue)
  })

  return {
    functionSearch,
    allFunctions,
    displayFunctions,
    recentFunctions,
    favoriteFunctions,
    selectedFunction,
    functionFilter,
    functionTooltip,
    expandedFunctionCategories,
    functionCategories,

    initializeFunctions,
    searchFunctions,
    toggleFunctionCategory,
    showFunctionDetail,
    closeFunctionDetail,
    addToRecentFunctions,
    isFunctionFavorite,
    toggleFunctionFavorite,
    showFunctionTooltip,
    hideFunctionTooltip,
    setFunctionFilter,
    getCategoryColor,
    getFunctionRating
  }
}