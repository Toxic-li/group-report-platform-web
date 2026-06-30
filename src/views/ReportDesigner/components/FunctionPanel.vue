<template>
  <div class="function-panel">
    <div class="panel-header">
      <div class="panel-title">
        <svg viewBox="0 0 16 16" width="14" height="14">
          <path d="M1 1h14v14H1V1zm1 1v12h12V2H2z" fill="currentColor"/>
          <path d="M3 5h10v1H3V5zm0 3h10v1H3V8zm0 3h6v1H3v-1z" fill="currentColor"/>
        </svg>
        <span>函数</span>
      </div>
      <div class="panel-search">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索函数..."
          @input="updateSearch"
        />
        <svg viewBox="0 0 16 16" width="12" height="12">
          <path d="M11.5 7a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0zm-1 0a3.5 3.5 0 1 0-7 0 3.5 3.5 0 0 0 7 0z" fill="currentColor"/>
          <path d="M15 14l-4-4" stroke="currentColor" stroke-width="1.5" fill="none"/>
        </svg>
      </div>
    </div>

    <div class="panel-filters">
      <button
        v-for="filter in filters"
        :key="filter.key"
        :class="['filter-btn', { active: functionFilter === filter.key }]"
        @click="setFunctionFilter(filter.key)"
      >
        {{ filter.name }}
      </button>
    </div>

    <div class="panel-body">
      <div v-for="category in functionCategories" :key="category.key" class="category-section">
        <div class="category-header" @click="toggleFunctionCategory(category.key)">
          <svg viewBox="0 0 16 16" width="12" height="12" :class="{ 'rotated': expandedFunctionCategories[category.key] }">
            <path d="M5 4l6 4-6 4V4z" fill="currentColor"/>
          </svg>
          <span>{{ category.name }}</span>
          <span class="category-count">{{ category.functions.length }}</span>
        </div>
        <div v-show="expandedFunctionCategories[category.key]" class="category-content">
          <div
            v-for="func in category.functions"
            :key="func.name"
            :class="['function-item', { 'is-favorite': isFunctionFavorite(func.name) }]"
            @click="handleFunctionClick(func)"
            @mouseenter="showFunctionTooltip(func)"
            @mouseleave="hideFunctionTooltip"
            draggable="true"
            @dragstart="handleDragStart($event, func)"
          >
            <span class="function-icon">{{ getFunctionIcon(func.category) }}</span>
            <span class="function-name">{{ func.name }}</span>
            <span class="function-params">
              ({{ func.params?.length || 0 }}个参数)
            </span>
            <button class="function-favorite" @click.stop="toggleFunctionFavorite(func)">
              {{ isFunctionFavorite(func.name) ? '⭐' : '☆' }}
            </button>
          </div>
          <div v-if="category.functions.length === 0" class="empty-tip">
            <span>暂无{{ category.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedFunction" class="function-detail-panel">
      <div class="detail-header">
        <span class="detail-icon">{{ getFunctionIcon(selectedFunction.category) }}</span>
        <span class="detail-name">{{ selectedFunction.name }}</span>
        <button class="detail-close" @click="closeFunctionDetail">
          <svg viewBox="0 0 16 16" width="12" height="12">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" fill="none"/>
          </svg>
        </button>
      </div>
      <div class="detail-body">
        <div class="detail-description">{{ selectedFunction.description }}</div>
        <div class="detail-syntax">
          <span class="syntax-label">语法:</span>
          <span class="syntax-value">{{ selectedFunction.name }}({{ selectedFunction.params?.join(', ') || '' }})</span>
        </div>
        <div v-if="selectedFunction.params?.length > 0" class="detail-params">
          <span class="params-label">参数:</span>
          <div v-for="(param, index) in selectedFunction.params" :key="index" class="param-item">
            <span class="param-name">{{ param.name || `参数${index + 1}` }}</span>
            <span class="param-desc">{{ param.description || '' }}</span>
          </div>
        </div>
        <div v-if="selectedFunction.examples?.length > 0" class="detail-examples">
          <span class="examples-label">示例:</span>
          <div v-for="(example, index) in selectedFunction.examples" :key="index" class="example-item">
            <span class="example-input">{{ example.input }}</span>
            <span class="example-arrow">→</span>
            <span class="example-output">{{ example.output }}</span>
          </div>
        </div>
        <button class="detail-insert" @click="handleFunctionClick(selectedFunction)">
          插入函数
        </button>
      </div>
    </div>

    <div v-if="functionTooltip" class="function-tooltip">
      <div class="tooltip-header">
        <span class="tooltip-icon">{{ getFunctionIcon(functionTooltip.category) }}</span>
        <span class="tooltip-name">{{ functionTooltip.name }}</span>
      </div>
      <div class="tooltip-body">
        <div class="tooltip-desc">{{ functionTooltip.description }}</div>
        <div class="tooltip-syntax">
          {{ functionTooltip.name }}({{ functionTooltip.params?.join(', ') || '' }})
        </div>
      </div>
    </div>

    <div class="quick-operators">
      <div class="section-header">
        <svg viewBox="0 0 16 16" width="12" height="12">
          <path d="M1 1h14v14H1V1zm1 1v12h12V2H2z" fill="currentColor"/>
          <path d="M3 5h10v1H3V5zm0 3h6v1H3V8zm0 3h6v1H3v-1z" fill="currentColor"/>
        </svg>
        <span>运算符</span>
      </div>
      <div class="operators-grid">
        <button
          v-for="op in operators"
          :key="op.value"
          class="operator-btn"
          @click="insertOperator(op.value)"
          :title="op.description"
        >
          {{ op.value }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  name: 'FunctionPanel',
  props: {
    functionSearch: String,
    functionFilter: String,
    selectedFunction: Object,
    functionTooltip: Object,
    functionCategories: Array,
    expandedFunctionCategories: Object,
    recentFunctions: Array,
    favoriteFunctions: Array
  },
  emits: ['search', 'update:functionSearch', 'filter', 'toggle-category', 'function-click', 'function-favorite', 'show-tooltip', 'hide-tooltip', 'insert-operator'],
  setup(props) {
    const searchQuery = ref(props.functionSearch || '')

    watch(() => props.functionSearch, (newVal) => {
      searchQuery.value = newVal || ''
    })

    function updateSearch(event) {
      searchQuery.value = event.target.value
      props.$emit('update:functionSearch', searchQuery.value)
      props.$emit('search')
    }

    return {
      searchQuery,
      updateSearch
    }
  },
  data() {
    return {
      filters: [
        { key: 'all', name: '全部' },
        { key: 'recent', name: '最近' },
        { key: 'favorite', name: '收藏' }
      ],
      operators: [
        { value: '+', description: '加法' },
        { value: '-', description: '减法' },
        { value: '*', description: '乘法' },
        { value: '/', description: '除法' },
        { value: '%', description: '取模' },
        { value: '^', description: '幂运算' },
        { value: '>', description: '大于' },
        { value: '<', description: '小于' },
        { value: '=', description: '等于' },
        { value: '>=', description: '大于等于' },
        { value: '<=', description: '小于等于' },
        { value: '<>', description: '不等于' },
        { value: '&&', description: '逻辑与' },
        { value: '||', description: '逻辑或' },
        { value: '!', description: '逻辑非' },
        { value: '&', description: '连接' }
      ]
    }
  },
  methods: {
    searchFunctions() {
      this.$emit('search')
    },
    setFunctionFilter(filter) {
      this.$emit('filter', filter)
    },
    toggleFunctionCategory(category) {
      this.$emit('toggle-category', category)
    },
    handleFunctionClick(func) {
      this.$emit('function-click', func)
    },
    closeFunctionDetail() {
      this.$emit('function-click', null)
    },
    toggleFunctionFavorite(func) {
      this.$emit('function-favorite', func)
    },
    isFunctionFavorite(functionName) {
      return this.favoriteFunctions.some(fav => fav.name === functionName)
    },
    showFunctionTooltip(func) {
      this.$emit('show-tooltip', func)
    },
    hideFunctionTooltip() {
      this.$emit('hide-tooltip')
    },
    insertOperator(operator) {
      this.$emit('insert-operator', operator)
    },
    handleDragStart(event, func) {
      event.dataTransfer.setData('text/plain', func.name)
      event.dataTransfer.setData('application/json', JSON.stringify(func))
    },
    getFunctionIcon(category) {
      const icons = {
        basic: '🧮',
        aggregate: '📊',
        conditional: '🔀',
        text: '📝',
        date: '📅',
        time_analysis: '⏰',
        business: '💼',
        window: '🔍'
      }
      return icons[category] || '📊'
    }
  }
}
</script>