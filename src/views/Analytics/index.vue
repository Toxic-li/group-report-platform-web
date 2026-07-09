<template>
  <div class="analytics">
    <div class="app-page-inner">
      <!-- 页面头部 -->
      <div class="an-header">
        <div class="an-header-left">
          <h1 class="an-title">数据分析</h1>
          <p class="an-desc">汇总分析、趋势分析、图表分析</p>
        </div>
        <div class="an-header-right">
          <button class="an-btn an-btn-secondary" @click="handleExport">导出数据</button>
          <button class="an-btn an-btn-primary">新建分析</button>
        </div>
      </div>

      <!-- 标签页导航（underline 模式） -->
      <nav class="an-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="['an-tab', { active: activeTab === tab.id }]"
          @click="handleTabClick(tab.id)"
        >
          <span>{{ tab.label }}</span>
          <span v-if="tab.count != null" class="an-tab-count">{{ tab.count }}</span>
        </button>
      </nav>

      <!-- 筛选栏 -->
      <div class="an-filters">
        <select v-model="filters.period" class="an-select">
          <option value="thisMonth">本月</option>
          <option value="thisQuarter">本季度</option>
          <option value="thisYear">本年</option>
          <option value="custom">自定义</option>
        </select>
        <select v-model="filters.dept" class="an-select">
          <option value="">全部部门</option>
          <option value="sales">销售部</option>
          <option value="finance">财务部</option>
          <option value="hr">人事部</option>
        </select>
        <button class="an-btn an-btn-primary" @click="refreshData">查询</button>
      </div>

      <!-- 指标卡片 -->
      <div class="an-metrics">
        <div v-for="m in metricCards" :key="m.label" class="an-metric-card">
          <template v-if="loading"><div class="an-metric-skeleton"></div></template>
          <template v-else>
            <div class="an-metric-label">{{ m.label }}</div>
            <div class="an-metric-value">{{ m.value }}</div>
            <div :class="['an-metric-trend', m.trend > 0 ? 'an-trend-up' : m.trend < 0 ? 'an-trend-down' : 'an-trend-flat']">
              <span v-if="m.trend > 0">↑</span>
              <span v-else-if="m.trend < 0">↓</span>
              <span v-else>→</span>
              <span>{{ Math.abs(m.trend) }}%</span>
              <span class="an-metric-trend-label">{{ m.trendLabel }}</span>
            </div>
          </template>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="an-charts">
        <div class="an-chart-card">
          <div class="an-chart-header">
            <span class="an-chart-title">数据趋势</span>
            <div class="an-chart-tabs">
              <button
                v-for="ct in chartTypes"
                :key="ct"
                :class="['an-chart-tab', { active: activeChartType === ct }]"
                @click="activeChartType = ct"
              >{{ ct }}</button>
            </div>
          </div>
          <div class="an-chart-body">
            <template v-if="loading">
              <div class="an-chart-skeleton"></div>
            </template>
            <template v-else>
              <div class="an-chart-placeholder">
                <svg width="64" height="64" viewBox="0 0 80 80" fill="none">
                  <polyline points="10,60 25,45 35,50 55,20 70,35" stroke="var(--app-primary)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="25" cy="45" r="4" fill="var(--app-primary)" opacity="0.3"/>
                  <circle cx="35" cy="50" r="4" fill="var(--app-primary)" opacity="0.3"/>
                  <circle cx="55" cy="20" r="4" fill="var(--app-primary)" opacity="0.3"/>
                  <circle cx="70" cy="35" r="4" fill="var(--app-primary)" opacity="0.3"/>
                  <circle cx="10" cy="60" r="4" fill="var(--app-primary)" opacity="0.3"/>
                  <line x1="10" y1="70" x2="75" y2="70" stroke="var(--app-border)" stroke-width="1"/>
                  <line x1="10" y1="10" x2="10" y2="70" stroke="var(--app-border)" stroke-width="1"/>
                </svg>
                <span>选择时间范围和数据维度后查看趋势</span>
              </div>
            </template>
          </div>
        </div>

        <div class="an-chart-card">
          <div class="an-chart-header">
            <span class="an-chart-title">分布占比</span>
          </div>
          <div class="an-chart-body">
            <template v-if="loading">
              <div class="an-chart-skeleton"></div>
            </template>
            <template v-else>
              <div class="an-chart-placeholder">
                <svg width="64" height="64" viewBox="0 0 80 80" fill="none">
                  <circle cx="40" cy="40" r="28" stroke="var(--app-border)" stroke-width="1" fill="none"/>
                  <path d="M40,12 A28,28 0 1,1 17,54" fill="var(--app-primary)" opacity="0.15" stroke="var(--app-primary)" stroke-width="1.5"/>
                  <path d="M17,54 A28,28 0 0,1 56,66" fill="var(--app-success)" opacity="0.15" stroke="var(--app-success)" stroke-width="1.5"/>
                  <path d="M56,66 A28,28 0 0,1 40,12" fill="var(--app-warning)" opacity="0.15" stroke="var(--app-warning)" stroke-width="1.5"/>
                </svg>
                <span>暂无分布数据</span>
              </div>
            </template>
          </div>
        </div>

        <div class="an-chart-card an-chart-full">
          <div class="an-chart-header">
            <span class="an-chart-title">排行分析</span>
            <select v-model="filters.rankLimit" class="an-select an-select-sm">
              <option :value="10">Top 10</option>
              <option :value="20">Top 20</option>
              <option :value="10">Bottom 10</option>
            </select>
          </div>
          <div class="an-chart-body">
            <template v-if="loading">
              <div class="an-chart-skeleton an-chart-skeleton-large"></div>
            </template>
            <template v-else>
              <div class="an-chart-placeholder an-chart-placeholder-large">
                <svg width="64" height="64" viewBox="0 0 80 80" fill="none">
                  <rect x="10" y="55" width="10" height="15" rx="2" fill="var(--app-primary)" opacity="0.4"/>
                  <rect x="23" y="45" width="10" height="25" rx="2" fill="var(--app-primary)" opacity="0.5"/>
                  <rect x="36" y="35" width="10" height="35" rx="2" fill="var(--app-primary)" opacity="0.6"/>
                  <rect x="49" y="25" width="10" height="45" rx="2" fill="var(--app-primary)" opacity="0.7"/>
                  <rect x="62" y="15" width="10" height="55" rx="2" fill="var(--app-primary)" opacity="0.8"/>
                  <line x1="5" y1="70" x2="75" y2="70" stroke="var(--app-border)" stroke-width="1"/>
                  <line x1="5" y1="10" x2="5" y2="70" stroke="var(--app-border)" stroke-width="1"/>
                </svg>
                <span>暂无排行数据</span>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- 数据表格 -->
      <div class="an-table-card">
        <div class="an-table-header">
          <span class="an-table-title">数据明细</span>
          <div class="an-table-actions">
            <button class="an-btn an-btn-secondary an-btn-sm">排序</button>
            <button class="an-btn an-btn-secondary an-btn-sm">筛选</button>
            <button class="an-btn an-btn-secondary an-btn-sm" @click="handleExport">导出</button>
          </div>
        </div>

        <!-- 骨架屏表格 -->
        <table v-if="loading" class="an-table">
          <thead><tr><th></th><th></th><th></th><th></th><th></th></tr></thead>
          <tbody>
            <tr v-for="n in 5" :key="n" class="an-skeleton-row">
              <td><div class="an-skeleton-cell" style="width:40px"></div></td>
              <td><div class="an-skeleton-cell" style="width:100px"></div></td>
              <td><div class="an-skeleton-cell" style="width:80px"></div></td>
              <td><div class="an-skeleton-cell" style="width:60px"></div></td>
              <td><div class="an-skeleton-cell" style="width:120px"></div></td>
            </tr>
          </tbody>
        </table>

        <!-- 空状态 -->
        <div v-else-if="!hasData" class="an-empty">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <rect x="10" y="10" width="60" height="60" rx="8" stroke="var(--app-text-muted)" stroke-width="2" fill="var(--app-bg)"/>
            <line x1="10" y1="30" x2="70" y2="30" stroke="var(--app-border)" stroke-width="1.5"/>
            <line x1="10" y1="45" x2="70" y2="45" stroke="var(--app-border)" stroke-width="1.5"/>
            <line x1="10" y1="60" x2="55" y2="60" stroke="var(--app-border)" stroke-width="1.5"/>
            <circle cx="70" cy="62" r="12" fill="var(--app-surface)" stroke="var(--app-primary)" stroke-width="2"/>
            <line x1="70" y1="56" x2="70" y2="68" stroke="var(--app-primary)" stroke-width="2" stroke-linecap="round"/>
            <line x1="64" y1="62" x2="76" y2="62" stroke="var(--app-primary)" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <p class="an-empty-title">暂无分析数据</p>
          <p class="an-empty-desc">调整筛选条件试试</p>
        </div>

        <!-- 实际表格 -->
        <table v-else class="an-table">
          <thead>
            <tr>
              <th>部门</th>
              <th>指标名称</th>
              <th>当月值</th>
              <th>环比变化</th>
              <th>同比变化</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in tableData" :key="i">
              <td>{{ row.dept }}</td>
              <td class="an-td-name">{{ row.metric }}</td>
              <td>{{ row.value }}</td>
              <td :class="row.mom > 0 ? 'an-trend-up' : row.mom < 0 ? 'an-trend-down' : ''">
                {{ row.mom > 0 ? '+' : '' }}{{ row.mom }}%
              </td>
              <td :class="row.yoy > 0 ? 'an-trend-up' : row.yoy < 0 ? 'an-trend-down' : ''">
                {{ row.yoy > 0 ? '+' : '' }}{{ row.yoy }}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getSummaryData, getTrendData, getChartData } from '@/api/analytics.js'

const route = useRoute()
const router = useRouter()

// ==================== 状态 ====================

const activeTab = ref('summary')
const activeChartType = ref('折线图')
const loading = ref(false)
const hasData = ref(false)

const tabs = [
  { id: 'summary', label: '汇总分析', count: null },
  { id: 'trend', label: '趋势分析', count: null },
  { id: 'chart', label: '图表分析', count: null },
  { id: 'export', label: '数据导出', count: null }
]

const chartTypes = ['折线图', '柱状图', '面积图']

const filters = reactive({
  period: 'thisMonth',
  dept: '',
  rankLimit: 10
})

const metricCards = ref([
  { label: '总提交量', value: '0', trend: 0, trendLabel: '同比增长' },
  { label: '审核通过', value: '0', trend: 0, trendLabel: '环比增长' },
  { label: '平均完成率', value: '0%', trend: 0, trendLabel: '环比变化' },
  { label: '待审核', value: '0', trend: 0, trendLabel: '当前' }
])

const tableData = ref([])

// ==================== 方法 ====================

function updateActiveTabFromRoute() {
  const path = route.path
  if (path.includes('/analytics/trend')) activeTab.value = 'trend'
  else if (path.includes('/analytics/chart')) activeTab.value = 'chart'
  else if (path.includes('/analytics/export')) activeTab.value = 'export'
  else activeTab.value = 'summary'
}

function handleTabClick(tabId: string) {
  activeTab.value = tabId
  const routeMap: Record<string, string> = {
    'summary': '/analytics',
    'trend': '/analytics/trend',
    'chart': '/analytics/chart',
    'export': '/analytics/export'
  }
  router.push(routeMap[tabId] || '/analytics')
}

function handleExport() {
  if (tableData.value.length === 0) return
  // 简单的CSV导出
  const headers = Object.keys(tableData.value[0])
  const csvContent = [
    headers.join(','),
    ...tableData.value.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
  ].join('\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `数据分析_${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

async function refreshData() {
  loading.value = true
  try {
    const res = await getSummaryData({})
    if (res && res.data) {
      const d = res.data
      metricCards.value[0].value = String(d.totalSubmits || 0)
      metricCards.value[1].value = String(d.approvedCount || 0)
      metricCards.value[2].value = (d.avgCompleteRate != null ? (Number(d.avgCompleteRate) * 100).toFixed(1) + '%' : '0%')
      metricCards.value[3].value = String(d.pendingCount || 0)
      metricCards.value[0].trend = d.totalSubmits > 0 ? 100 : 0

      // 构建表格数据
      const byTemplate = d.byTemplate || {}
      const byOrg = d.byOrg || {}
      const merged = new Map<string, any>()
      Object.entries(byTemplate).forEach(([k, v]) => {
        merged.set(k, { dept: k, metric: '提交量', value: String(v), mom: 0, yoy: 0 })
      })
      Object.entries(byOrg).forEach(([k, v]) => {
        if (merged.has(k)) {
          merged.get(k).dept = k
        } else {
          merged.set(k, { dept: k, metric: '提交量', value: String(v), mom: 0, yoy: 0 })
        }
      })
      tableData.value = Array.from(merged.values())
      hasData.value = true
    }
  } catch {
    // 后端不可用时使用默认值
    hasData.value = false
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  updateActiveTabFromRoute()
  refreshData()
})

watch(() => route.path, () => {
  updateActiveTabFromRoute()
})
</script>

<style lang="scss" scoped>
/* 骨架屏闪烁动画 */
@keyframes an-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.analytics {
  height: 100%;
  overflow-y: auto;
  padding: var(--app-content-padding);
  color: var(--app-text-primary);
}

.app-page-inner {
  max-width: 1200px;
  margin: 0 auto;
}

/* ---- 页面头部 ---- */
.an-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--app-space-6);
  flex-wrap: wrap;
  gap: var(--app-space-4);
}
.an-header-left {
  flex: 1;
}
.an-title {
  font-size: var(--app-font-h4);
  font-weight: var(--app-font-bold);
  color: var(--app-text-primary);
  margin: 0 0 var(--app-space-1) 0;
  line-height: 1.3;
}
.an-desc {
  font-size: var(--app-font-caption);
  color: var(--app-text-muted);
  margin: 0;
}
.an-header-right {
  display: flex;
  gap: var(--app-space-2);
}

/* ---- 按钮 ---- */
.an-btn {
  height: 36px;
  padding: 0 var(--app-space-4);
  border-radius: var(--app-radius-md);
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  font-size: var(--app-font-caption);
  font-weight: var(--app-font-medium);
  color: var(--app-text-primary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all var(--app-transition-fast);
  &:hover { background: var(--app-surface-hover); }
}
.an-btn-primary {
  background: var(--app-primary);
  color: #fff;
  border-color: var(--app-primary);
  &:hover { background: var(--app-primary-hover); }
}
.an-btn-secondary {
  color: var(--app-text-secondary);
  &:hover { border-color: var(--app-border-dark); }
}
.an-btn-sm {
  height: 30px;
  padding: 0 var(--app-space-3);
  font-size: var(--app-font-caption);
}

/* ---- 标签页导航（underline 模式） ---- */
.an-tabs {
  display: flex;
  gap: var(--app-space-2);
  margin-bottom: var(--app-space-5);
  border-bottom: 2px solid var(--app-border-light);
}
.an-tab {
  position: relative;
  padding: var(--app-space-2) var(--app-space-4);
  border: none;
  background: none;
  font-size: var(--app-font-body);
  font-weight: var(--app-font-medium);
  color: var(--app-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--app-space-2);
  transition: color var(--app-transition-fast);
  margin-bottom: -2px;
  border-bottom: 2px solid transparent;

  &:hover { color: var(--app-text-primary); }
  &.active {
    color: var(--app-primary);
    border-bottom-color: var(--app-primary);
  }
}
.an-tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: var(--app-primary-bg);
  color: var(--app-primary);
  font-size: 11px;
  font-weight: var(--app-font-semibold);
}

/* ---- 筛选栏 ---- */
.an-filters {
  display: flex;
  align-items: center;
  gap: var(--app-space-2);
  margin-bottom: var(--app-space-5);
  flex-wrap: wrap;
}
.an-select {
  height: 36px;
  padding: 0 var(--app-space-3);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  background: var(--app-surface);
  font-size: var(--app-font-caption);
  color: var(--app-text-primary);
  outline: none;
  cursor: pointer;
  transition: border-color var(--app-transition-fast);
  &:focus { border-color: var(--app-primary); }
  &-sm { height: 30px; font-size: var(--app-font-caption); }
}

/* ---- 指标卡片 ---- */
.an-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--app-card-gap);
  margin-bottom: var(--app-space-6);
}
.an-metric-card {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-card-radius);
  padding: var(--app-space-5);
  box-shadow: var(--app-shadow-sm);
  min-height: 100px;
}
.an-metric-label {
  font-size: var(--app-font-caption);
  color: var(--app-text-muted);
  margin-bottom: var(--app-space-1);
}
.an-metric-value {
  font-size: var(--app-font-h3);
  font-weight: var(--app-font-bold);
  color: var(--app-text-primary);
  font-family: var(--app-font-family-number);
  line-height: 1.2;
  margin-bottom: var(--app-space-2);
}
.an-metric-trend {
  font-size: var(--app-font-caption);
  font-weight: var(--app-font-medium);
}
.an-trend-up { color: var(--app-danger); }
.an-trend-down { color: var(--app-success); }
.an-trend-flat { color: var(--app-text-muted); }
.an-metric-trend-label {
  color: var(--app-text-muted);
  font-weight: var(--app-font-regular);
  margin-left: 2px;
}
.an-metric-skeleton {
  height: 100%;
  min-height: 100px;
  border-radius: var(--app-radius-md);
  background: linear-gradient(90deg, var(--app-border-light) 25%, var(--app-bg) 50%, var(--app-border-light) 75%);
  background-size: 200% 100%;
  animation: an-shimmer 1.5s infinite;
}

/* ---- 图表区域 ---- */
.an-charts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--app-card-gap);
  margin-bottom: var(--app-space-6);
}
.an-chart-card {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-card-radius);
  padding: var(--app-space-5);
  box-shadow: var(--app-shadow-sm);
}
.an-chart-full {
  grid-column: span 2;
}
.an-chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--app-space-4);
}
.an-chart-title {
  font-size: var(--app-font-body);
  font-weight: var(--app-font-semibold);
  color: var(--app-text-primary);
}
.an-chart-tabs {
  display: flex;
  gap: 4px;
  background: var(--app-bg);
  border-radius: var(--app-radius-xs);
  padding: 2px;
}
.an-chart-tab {
  padding: 4px var(--app-space-3);
  border: none;
  background: none;
  border-radius: var(--app-radius-xs);
  font-size: var(--app-font-caption);
  color: var(--app-text-muted);
  cursor: pointer;
  transition: all var(--app-transition-fast);
  &:hover { color: var(--app-text-secondary); }
  &.active {
    background: var(--app-surface);
    color: var(--app-primary);
    font-weight: var(--app-font-medium);
    box-shadow: var(--app-shadow-xs);
  }
}
.an-chart-body {
  min-height: 200px;
}
.an-chart-placeholder {
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-3);
  background: var(--app-bg);
  border-radius: var(--app-radius-sm);
  color: var(--app-text-muted);
  font-size: var(--app-font-caption);
  &-large { height: 260px; }
}
.an-chart-skeleton {
  height: 200px;
  border-radius: var(--app-radius-sm);
  background: linear-gradient(90deg, var(--app-border-light) 25%, var(--app-bg) 50%, var(--app-border-light) 75%);
  background-size: 200% 100%;
  animation: an-shimmer 1.5s infinite;
}
.an-chart-skeleton-large {
  height: 260px;
}

/* ---- 数据表格 ---- */
.an-table-card {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-card-radius);
  padding: var(--app-space-5);
  box-shadow: var(--app-shadow-sm);
  overflow: hidden;
}
.an-table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--app-space-4);
  flex-wrap: wrap;
  gap: var(--app-space-2);
}
.an-table-title {
  font-size: var(--app-font-body);
  font-weight: var(--app-font-semibold);
  color: var(--app-text-primary);
}
.an-table-actions {
  display: flex;
  gap: var(--app-space-2);
}

.an-table {
  width: 100%;
  border-collapse: collapse;
  th, td {
    padding: var(--app-space-3) var(--app-space-4);
    text-align: left;
    border-bottom: 1px solid var(--app-border-light);
    font-size: var(--app-font-caption);
  }
  th {
    background: var(--app-bg);
    font-weight: var(--app-font-semibold);
    color: var(--app-text-secondary);
  }
  tbody tr:hover { background: var(--app-surface-hover); }
}
.an-td-name { font-weight: var(--app-font-medium); }

/* 表格骨架屏 */
.an-skeleton-row td {
  padding: 14px var(--app-space-4) !important;
}
.an-skeleton-cell {
  height: 14px;
  border-radius: var(--app-radius-xs);
  background: linear-gradient(90deg, var(--app-border-light) 25%, var(--app-bg) 50%, var(--app-border-light) 75%);
  background-size: 200% 100%;
  animation: an-shimmer 1.5s infinite;
}

/* 空状态 */
.an-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--app-space-16) var(--app-space-5);
  color: var(--app-text-muted);
}
.an-empty-title {
  font-size: var(--app-font-body);
  font-weight: var(--app-font-medium);
  color: var(--app-text-secondary);
  margin: var(--app-space-4) 0 var(--app-space-1);
}
.an-empty-desc {
  font-size: var(--app-font-caption);
  color: var(--app-text-muted);
  margin: 0;
}

/* 响应式 */
@media (max-width: 1024px) {
  .an-metrics { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .an-charts { grid-template-columns: 1fr; }
  .an-chart-full { grid-column: span 1; }
  .an-metrics { grid-template-columns: 1fr; }
  .an-header { flex-direction: column; }
  .an-filters { flex-direction: column; }
  .an-select { width: 100%; }
}
</style>
