<template>
  <div class="indicator-panel">
    <div class="panel-header">
      <div class="panel-title">
        <svg viewBox="0 0 16 16" width="14" height="14">
          <path d="M14 2H2v12h12V2zM2 0h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2z" fill="currentColor"/>
          <path d="M8 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm-4 6a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5z" fill="currentColor"/>
        </svg>
        <span>指标</span>
      </div>
      <div class="panel-search">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索指标..."
          @input="updateSearch"
        />
        <svg viewBox="0 0 16 16" width="12" height="12">
          <path d="M11.5 7a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0zm-1 0a3.5 3.5 0 1 0-7 0 3.5 3.5 0 0 0 7 0z" fill="currentColor"/>
          <path d="M15 14l-4-4" stroke="currentColor" stroke-width="1.5" fill="none"/>
        </svg>
      </div>
    </div>

    <div class="panel-body">
      <div class="category-section">
        <div class="category-header" @click="toggleCategory('recent')">
          <svg viewBox="0 0 16 16" width="12" height="12" :class="{ 'rotated': expandedCategories.recent }">
            <path d="M5 4l6 4-6 4V4z" fill="currentColor"/>
          </svg>
          <span>最近使用</span>
          <span class="category-count">{{ recentIndicators.length }}</span>
        </div>
        <div v-show="expandedCategories.recent" class="category-content">
          <div
            v-for="indicator in recentIndicators"
            :key="indicator.id"
            :class="['indicator-item', { 'is-favorite': isFavorite(indicator.id) }]"
            @click="handleIndicatorClick(indicator)"
            @mouseenter="showIndicatorTooltip(indicator)"
            @mouseleave="hideIndicatorTooltip"
          >
            <span class="indicator-icon">{{ getIndicatorIcon(indicator.category) }}</span>
            <span class="indicator-name">{{ indicator.name }}</span>
            <span class="indicator-code">{{ indicator.code }}</span>
            <button class="indicator-favorite" @click.stop="toggleFavorite(indicator)">
              {{ isFavorite(indicator.id) ? '⭐' : '☆' }}
            </button>
          </div>
          <div v-if="recentIndicators.length === 0" class="empty-tip">
            <span>暂无最近使用的指标</span>
          </div>
        </div>
      </div>

      <div class="category-section">
        <div class="category-header" @click="toggleCategory('favorite')">
          <svg viewBox="0 0 16 16" width="12" height="12" :class="{ 'rotated': expandedCategories.favorite }">
            <path d="M5 4l6 4-6 4V4z" fill="currentColor"/>
          </svg>
          <span>我的收藏</span>
          <span class="category-count">{{ favoriteIndicators.length }}</span>
        </div>
        <div v-show="expandedCategories.favorite" class="category-content">
          <div
            v-for="indicator in favoriteIndicators"
            :key="indicator.id"
            :class="['indicator-item', { 'is-favorite': true }]"
            @click="handleIndicatorClick(indicator)"
            @mouseenter="showIndicatorTooltip(indicator)"
            @mouseleave="hideIndicatorTooltip"
          >
            <span class="indicator-icon">{{ getIndicatorIcon(indicator.category) }}</span>
            <span class="indicator-name">{{ indicator.name }}</span>
            <span class="indicator-code">{{ indicator.code }}</span>
            <button class="indicator-favorite" @click.stop="toggleFavorite(indicator)">
              {{ isFavorite(indicator.id) ? '⭐' : '☆' }}
            </button>
          </div>
          <div v-if="favoriteIndicators.length === 0" class="empty-tip">
            <span>暂无收藏的指标</span>
          </div>
        </div>
      </div>

      <div v-for="category in indicatorCategories" :key="category.key" class="category-section">
        <div class="category-header" @click="toggleCategory(category.key)">
          <svg viewBox="0 0 16 16" width="12" height="12" :class="{ 'rotated': expandedCategories[category.key] }">
            <path d="M5 4l6 4-6 4V4z" fill="currentColor"/>
          </svg>
          <span>{{ category.name }}</span>
          <span class="category-count">{{ category.indicators.length }}</span>
        </div>
        <div v-show="expandedCategories[category.key]" class="category-content">
          <div
            v-for="indicator in category.indicators"
            :key="indicator.id"
            :class="['indicator-item', { 'is-favorite': isFavorite(indicator.id) }]"
            @click="handleIndicatorClick(indicator)"
            @mouseenter="showIndicatorTooltip(indicator)"
            @mouseleave="hideIndicatorTooltip"
            draggable="true"
            @dragstart="handleDragStart($event, indicator)"
          >
            <span class="indicator-icon">{{ getDataTypeIcon(indicator.dataType) }}</span>
            <span class="indicator-name">{{ indicator.name }}</span>
            <span class="indicator-code">{{ indicator.code }}</span>
            <button class="indicator-favorite" @click.stop="toggleFavorite(indicator)">
              {{ isFavorite(indicator.id) ? '⭐' : '☆' }}
            </button>
          </div>
          <div v-if="category.indicators.length === 0" class="empty-tip">
            <span>暂无{{ category.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="indicatorTooltip" class="indicator-tooltip" :style="tooltipStyle">
      <div class="tooltip-header">
        <span class="tooltip-icon">{{ getDataTypeIcon(indicatorTooltip.dataType) }}</span>
        <span class="tooltip-name">{{ indicatorTooltip.name }}</span>
      </div>
      <div class="tooltip-body">
        <div class="tooltip-row">
          <span class="tooltip-label">编码</span>
          <span class="tooltip-value">{{ indicatorTooltip.code }}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">类型</span>
          <span class="tooltip-value">{{ indicatorTooltip.dataType || indicatorTooltip.type }}</span>
        </div>
        <div v-if="indicatorTooltip.description" class="tooltip-row">
          <span class="tooltip-label">描述</span>
          <span class="tooltip-value">{{ indicatorTooltip.description }}</span>
        </div>
      </div>
    </div>

    <div class="system-variables-section">
      <div class="section-header">
        <svg viewBox="0 0 16 16" width="12" height="12">
          <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1z" fill="currentColor"/>
          <path d="M8 4a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0v-5A.5.5 0 0 1 8 4zm0 6a.5.5 0 0 1 .5.5v.5a.5.5 0 0 1-1 0V10.5A.5.5 0 0 1 8 10z" fill="currentColor"/>
        </svg>
        <span>系统变量</span>
      </div>
      <div class="system-variables-list">
        <div
          v-for="variable in systemVariables"
          :key="variable.name"
          class="variable-item"
          @click="insertVariable(variable)"
          @mouseenter="showVariableTooltip(variable)"
          @mouseleave="hideIndicatorTooltip"
        >
          <span class="variable-icon">{{ variable.icon || '💡' }}</span>
          <span class="variable-name">{{ variable.name }}</span>
          <span class="variable-value">{{ variable.value }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  name: 'IndicatorPanel',
  props: {
    indicatorSearch: String,
    allIndicators: Array,
    recentIndicators: Array,
    favoriteIndicators: Array,
    systemVariables: Array,
    expandedCategories: Object,
    indicatorCategories: Array,
    indicatorTooltip: Object,
    tooltipStyle: Object
  },
  emits: ['search', 'update:indicatorSearch', 'toggle-category', 'indicator-click', 'toggle-favorite', 'insert-variable'],
  setup(props, { emit }) {
    const searchQuery = ref(props.indicatorSearch || '')

    watch(() => props.indicatorSearch, (newVal) => {
      searchQuery.value = newVal || ''
    })

    function updateSearch(event) {
      searchQuery.value = event.target.value
      emit('update:indicatorSearch', searchQuery.value)
      emit('search')
    }

    return {
      searchQuery,
      updateSearch
    }
  },
  methods: {
    searchIndicators() {
      this.$emit('search')
    },
    toggleCategory(category) {
      this.$emit('toggle-category', category)
    },
    handleIndicatorClick(indicator) {
      this.$emit('indicator-click', indicator)
    },
    toggleFavorite(indicator) {
      this.$emit('toggle-favorite', indicator)
    },
    isFavorite(indicatorId) {
      return this.favoriteIndicators.some(fav => fav.id === indicatorId)
    },
    showIndicatorTooltip(indicator) {
      this.$emit('show-tooltip', indicator)
    },
    hideIndicatorTooltip() {
      this.$emit('hide-tooltip')
    },
    showVariableTooltip(variable) {
      this.$emit('show-variable-tooltip', variable)
    },
    insertVariable(variable) {
      this.$emit('insert-variable', variable)
    },
    handleDragStart(event, indicator) {
      event.dataTransfer.setData('text/plain', indicator.code)
      event.dataTransfer.setData('application/json', JSON.stringify(indicator))
    },
    getIndicatorIcon(category) {
      const icons = { basic: '📊', calculated: 'Σ', public: '🌍', dimension: '📍', parameter: '⚙' }
      return icons[category] || '📊'
    },
    getDataTypeIcon(type) {
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
      return icons[type] || '📊'
    }
  }
}
</script>