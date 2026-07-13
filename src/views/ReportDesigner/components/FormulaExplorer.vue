<template>
  <aside class="formula-explorer">
    <!-- Tabs -->
    <div class="fe-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="fe-tab"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="fe-body">
      <!-- 数据 Tab -->
      <template v-if="activeTab === 'data'">
        <!-- 数据源选择 -->
        <div class="fe-section">
          <div class="fe-section-header">
            <span class="fe-section-title">数据源</span>
          </div>
          <select class="fe-select" v-model="selectedDataSource">
            <option value="sales">销售数据库</option>
            <option value="org">组织数据库</option>
            <option value="budget">预算数据库</option>
          </select>
        </div>

        <!-- 字段树 -->
        <div class="fe-section">
          <div class="fe-section-header">
            <span class="fe-section-title">字段</span>
          </div>
          <div class="fe-tree">
            <!-- 时间维度 -->
            <div class="fe-tree-node">
              <div class="fe-tree-header" @click="toggleNode('time')">
                <svg class="fe-tree-arrow" :class="{ expanded: expandedNodes.time }" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                <span>时间维度</span>
              </div>
              <div v-show="expandedNodes.time" class="fe-tree-children">
                <div class="fe-tree-item" draggable="true" @dragstart="onDrag($event, '年')">
                  <span class="fe-item-icon dim">📅</span>
                  <span>年份</span>
                </div>
                <div class="fe-tree-item" draggable="true" @dragstart="onDrag($event, '季度')">
                  <span class="fe-item-icon dim">📅</span>
                  <span>季度</span>
                </div>
                <div class="fe-tree-item" draggable="true" @dragstart="onDrag($event, '月份')">
                  <span class="fe-item-icon dim">📅</span>
                  <span>月份</span>
                </div>
                <div class="fe-tree-item" draggable="true" @dragstart="onDrag($event, '日期')">
                  <span class="fe-item-icon dim">📅</span>
                  <span>日期</span>
                </div>
              </div>
            </div>

            <!-- 组织维度 -->
            <div class="fe-tree-node">
              <div class="fe-tree-header" @click="toggleNode('org')">
                <svg class="fe-tree-arrow" :class="{ expanded: expandedNodes.org }" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span>组织维度</span>
              </div>
              <div v-show="expandedNodes.org" class="fe-tree-children">
                <div class="fe-tree-item" draggable="true" @dragstart="onDrag($event, '集团')">
                  <span class="fe-item-icon dim">🏢</span>
                  <span>集团</span>
                </div>
                <div class="fe-tree-item" draggable="true" @dragstart="onDrag($event, '公司')">
                  <span class="fe-item-icon dim">🏢</span>
                  <span>公司</span>
                </div>
                <div class="fe-tree-item" draggable="true" @dragstart="onDrag($event, '部门')">
                  <span class="fe-item-icon dim">🏢</span>
                  <span>部门</span>
                </div>
                <div class="fe-tree-item" draggable="true" @dragstart="onDrag($event, '区域')">
                  <span class="fe-item-icon dim">🏢</span>
                  <span>区域</span>
                </div>
              </div>
            </div>

            <!-- 产品维度 -->
            <div class="fe-tree-node">
              <div class="fe-tree-header" @click="toggleNode('product')">
                <svg class="fe-tree-arrow" :class="{ expanded: expandedNodes.product }" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                <span>产品维度</span>
              </div>
              <div v-show="expandedNodes.product" class="fe-tree-children">
                <div class="fe-tree-item" draggable="true" @dragstart="onDrag($event, '产品类别')">
                  <span class="fe-item-icon dim">📦</span>
                  <span>产品类别</span>
                </div>
                <div class="fe-tree-item" draggable="true" @dragstart="onDrag($event, '产品')">
                  <span class="fe-item-icon dim">📦</span>
                  <span>产品</span>
                </div>
                <div class="fe-tree-item" draggable="true" @dragstart="onDrag($event, 'SKU')">
                  <span class="fe-item-icon dim">📦</span>
                  <span>SKU</span>
                </div>
              </div>
            </div>

            <!-- 指标 -->
            <div class="fe-tree-node">
              <div class="fe-tree-header" @click="toggleNode('metrics')">
                <svg class="fe-tree-arrow" :class="{ expanded: expandedNodes.metrics }" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
                <span>指标（度量）</span>
              </div>
              <div v-show="expandedNodes.metrics" class="fe-tree-children">
                <div class="fe-tree-item metric" draggable="true" @dragstart="onDrag($event, '销售金额')" @dblclick="$emit('insert-field', '销售金额')">
                  <span class="fe-item-icon metric">💰</span>
                  <span>销售金额</span>
                </div>
                <div class="fe-tree-item metric" draggable="true" @dragstart="onDrag($event, '销售数量')" @dblclick="$emit('insert-field', '销售数量')">
                  <span class="fe-item-icon metric">#️</span>
                  <span>销售数量</span>
                </div>
                <div class="fe-tree-item metric" draggable="true" @dragstart="onDrag($event, '成本')" @dblclick="$emit('insert-field', '成本')">
                  <span class="fe-item-icon metric">💸</span>
                  <span>成本</span>
                </div>
                <div class="fe-tree-item metric" draggable="true" @dragstart="onDrag($event, '利润')" @dblclick="$emit('insert-field', '利润')">
                  <span class="fe-item-icon metric">💵</span>
                  <span>利润</span>
                </div>
                <div class="fe-tree-item metric" draggable="true" @dragstart="onDrag($event, '毛利率')" @dblclick="$emit('insert-field', '毛利率')">
                  <span class="fe-item-icon metric">📊</span>
                  <span>毛利率</span>
                </div>
                <div class="fe-tree-item metric" draggable="true" @dragstart="onDrag($event, '预算金额')" @dblclick="$emit('insert-field', '预算金额')">
                  <span class="fe-item-icon metric">📝</span>
                  <span>预算金额</span>
                </div>
                <div class="fe-tree-item metric" draggable="true" @dragstart="onDrag($event, '实际金额')" @dblclick="$emit('insert-field', '实际金额')">
                  <span class="fe-item-icon metric">✅</span>
                  <span>实际金额</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 参数 -->
        <div class="fe-section">
          <div class="fe-section-header">
            <span class="fe-section-title">参数</span>
          </div>
          <div class="fe-params">
            <div class="fe-param-item" draggable="true" @dragstart="onDrag($event, '开始日期')">
              <span class="fe-param-icon">📅</span>
              <span>开始日期</span>
            </div>
            <div class="fe-param-item" draggable="true" @dragstart="onDrag($event, '结束日期')">
              <span class="fe-param-icon">📅</span>
              <span>结束日期</span>
            </div>
            <div class="fe-param-item" draggable="true" @dragstart="onDrag($event, '组织')">
              <span class="fe-param-icon">🏢</span>
              <span>组织</span>
            </div>
            <div class="fe-param-item" draggable="true" @dragstart="onDrag($event, '部门')">
              <span class="fe-param-icon">🏢</span>
              <span>部门</span>
            </div>
            <div class="fe-param-item" draggable="true" @dragstart="onDrag($event, '当前用户')">
              <span class="fe-param-icon">👤</span>
              <span>当前用户</span>
            </div>
          </div>
        </div>
      </template>

      <!-- 计算字段 Tab -->
      <template v-if="activeTab === 'calc'">
        <div class="fe-section">
          <div class="fe-section-header">
            <span class="fe-section-title">计算字段</span>
            <button class="fe-add-btn" @click="$emit('field-select', 'new-calc')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
            </button>
          </div>
          <div class="fe-calc-list">
            <div class="fe-calc-item" v-for="field in calcFields" :key="field.name" draggable="true" @dragstart="onDrag($event, field.name)" @dblclick="$emit('insert-field', field.name)">
              <span class="fe-calc-icon">ƒ</span>
              <div class="fe-calc-info">
                <span class="fe-calc-name">{{ field.name }}</span>
                <span class="fe-calc-formula">{{ field.formula }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 模板 Tab -->
      <template v-if="activeTab === 'template'">
        <div class="fe-section">
          <div class="fe-section-header">
            <span class="fe-section-title">模板字段</span>
          </div>
          <div class="fe-template-list">
            <div class="fe-template-item" v-for="field in templateFields" :key="field">
              <span class="fe-template-icon">📄</span>
              <span>{{ field }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['field-drag', 'field-select', 'insert-field'])

const activeTab = ref('data')
const selectedDataSource = ref('sales')

const tabs = [
  { key: 'data', label: '数据' },
  { key: 'calc', label: '计算字段' },
  { key: 'template', label: '模板' }
]

const expandedNodes = ref({
  time: true,
  org: true,
  product: true,
  metrics: true
})

const calcFields = ref([
  { name: '毛利率', formula: '=[利润]/[销售金额]' },
  { name: '同比增长率', formula: '=同比([销售金额])' },
  { name: '环比增长率', formula: '=环比([销售金额])' },
  { name: '预算完成率', formula: '=[实际金额]/[预算金额]' },
  { name: '利润率', formula: '=[利润]/[销售金额]' }
])

const templateFields = ref([
  '报表标题',
  '报表日期',
  '填报单位',
  '审核人',
  '当前期次'
])

function toggleNode(key) {
  expandedNodes.value[key] = !expandedNodes.value[key]
}

function onDrag(event, fieldName) {
  event.dataTransfer.setData('text/plain', fieldName)
  emit('field-drag', fieldName)
}
</script>

<style scoped>
.formula-explorer {
  width: 260px;
  min-width: 260px;
  background: #fff;
  border-right: 1px solid #E5E7EB;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}

.fe-tabs {
  display: flex;
  border-bottom: 1px solid #E5E7EB;
  padding: 0 8px;
  background: #F8FAFC;
  flex-shrink: 0;
}

.fe-tab {
  padding: 0 12px;
  height: 36px;
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #6B7280;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}
.fe-tab:hover { color: #2563EB; }
.fe-tab.active {
  color: #2563EB;
  border-bottom-color: #2563EB;
  font-weight: 500;
}

.fe-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.fe-section {
  margin-bottom: 12px;
  padding: 0 12px;
}

.fe-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.fe-section-title {
  font-size: 11px;
  font-weight: 600;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.fe-select {
  width: 100%;
  height: 28px;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  font-size: 12px;
  padding: 0 8px;
  background: #fff;
  color: #374151;
  outline: none;
}
.fe-select:focus { border-color: #2563EB; }

/* Tree */
.fe-tree { font-size: 12px; }

.fe-tree-node { margin-bottom: 2px; }

.fe-tree-header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  color: #374151;
  transition: background 0.15s;
}
.fe-tree-header:hover { background: #F3F4F6; }

.fe-tree-arrow {
  transition: transform 0.2s;
  color: #9CA3AF;
  flex-shrink: 0;
}
.fe-tree-arrow.expanded { transform: rotate(90deg); }

.fe-tree-children { padding-left: 16px; }

.fe-tree-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;
  color: #4B5563;
  transition: all 0.15s;
  user-select: none;
}
.fe-tree-item:hover { background: #EFF6FF; color: #2563EB; }
.fe-tree-item.metric { font-weight: 500; }

.fe-item-icon {
  font-size: 12px;
  width: 16px;
  text-align: center;
}

/* Params */
.fe-params { display: flex; flex-direction: column; gap: 2px; }

.fe-param-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: #4B5563;
  transition: background 0.15s;
}
.fe-param-item:hover { background: #EFF6FF; color: #2563EB; }

.fe-param-icon { font-size: 12px; }

/* Calc fields */
.fe-calc-list { display: flex; flex-direction: column; gap: 2px; }

.fe-calc-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s;
  border: 1px solid transparent;
}
.fe-calc-item:hover { background: #EFF6FF; border-color: #BFDBFE; }

.fe-calc-icon {
  font-size: 13px;
  font-weight: 700;
  font-style: italic;
  color: #2563EB;
  width: 18px;
  flex-shrink: 0;
  padding-top: 2px;
}

.fe-calc-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.fe-calc-name {
  font-size: 12px;
  font-weight: 500;
  color: #1E293B;
}

.fe-calc-formula {
  font-size: 10px;
  color: #9CA3AF;
  font-family: 'Roboto Mono', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Add button */
.fe-add-btn {
  width: 20px;
  height: 20px;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6B7280;
  padding: 0;
  transition: all 0.15s;
}
.fe-add-btn:hover { background: #2563EB; color: #fff; border-color: #2563EB; }

/* Template */
.fe-template-list { display: flex; flex-direction: column; gap: 2px; }
.fe-template-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: #4B5563;
  transition: background 0.15s;
}
.fe-template-item:hover { background: #F3F4F6; }
.fe-template-icon { font-size: 12px; }
</style>
