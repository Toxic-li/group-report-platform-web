<template>
  <div class="favorites-manage">
    <!-- 页面头部 -->
    <div class="fm-header">
      <div class="fm-header-left">
        <h1 class="fm-title">收藏管理</h1>
        <p class="fm-desc">管理我收藏的报表，快速访问常用报表</p>
      </div>
      <div class="fm-header-right">
        <button class="fm-btn fm-btn-ghost" @click="handleGoToReportCenter">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          浏览报表
        </button>
      </div>
    </div>

    <!-- 统计 -->
    <div class="fm-stats-row">
      <div class="fm-stats-card">
        <span class="fm-stats-label">收藏总数</span>
        <span class="fm-stats-value">{{ favorites.length }}</span>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="fm-filters">
      <div class="fm-search-box">
        <svg class="fm-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="searchKeyword" class="fm-input" placeholder="搜索收藏报表" @input="handleSearch" />
        <button v-if="searchKeyword" class="fm-search-clear" @click="searchKeyword = ''; handleSearch()">×</button>
      </div>
      <select v-model="filterCategory" class="fm-select" @change="handleSearch">
        <option value="">全部分类</option>
        <option value="finance">财务</option>
        <option value="hr">人事</option>
        <option value="sales">销售</option>
        <option value="production">生产</option>
        <option value="other">其他</option>
      </select>
      <button class="fm-btn fm-btn-ghost" @click="handleReset">重置</button>
    </div>

    <!-- 收藏卡片网格 -->
    <div class="fm-grid">
      <!-- 骨架屏 -->
      <template v-if="loading">
        <div v-for="i in 6" :key="'sk-' + i" class="fm-card fm-card-skeleton">
          <div class="fm-skel-icon"></div>
          <div class="fm-skel-title"></div>
          <div class="fm-skel-desc"></div>
          <div class="fm-skel-meta">
            <div class="fm-skel-line"></div>
            <div class="fm-skel-line"></div>
          </div>
        </div>
      </template>

      <!-- 空状态 -->
      <div v-else-if="filteredFavorites.length === 0" class="fm-empty">
        <svg width="72" height="72" viewBox="0 0 80 80" fill="none">
          <path d="M40 8L54 28H70L58 42L64 60L40 50L16 60L22 42L10 28H26L40 8Z" stroke="var(--app-text-muted)" stroke-width="2" fill="none"/>
          <circle cx="40" cy="34" r="14" fill="var(--app-surface)" stroke="var(--app-primary)" stroke-width="1.5" stroke-dasharray="3 3"/>
          <line x1="40" y1="24" x2="40" y2="44" stroke="var(--app-primary)" stroke-width="2" stroke-linecap="round"/>
          <line x1="30" y1="34" x2="50" y2="34" stroke="var(--app-primary)" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <p class="fm-empty-title">暂无收藏报表</p>
        <p class="fm-empty-desc">{{ searchKeyword || filterCategory ? '调整筛选条件试试' : '去报表中心收藏你感兴趣的报表' }}</p>
        <button v-if="!searchKeyword && !filterCategory" class="fm-btn fm-btn-primary" @click="handleGoToReportCenter">去收藏报表</button>
      </div>

      <!-- 收藏卡片 -->
      <template v-else>
        <div
          v-for="report in filteredFavorites"
          :key="report.id"
          class="fm-card"
        >
          <div class="fm-card-header">
            <div class="fm-card-icon" :class="report.category">
              {{ getCategoryIcon(report.category) }}
            </div>
            <span :class="['fm-status', 'fm-status-' + report.status]">{{ getStatusText(report.status) }}</span>
          </div>
          <div class="fm-card-body">
            <h3 class="fm-card-title">{{ report.name }}</h3>
            <p class="fm-card-desc">{{ report.description || '暂无描述' }}</p>
            <div class="fm-card-meta">
              <span>{{ report.code }}</span>
              <span>使用 {{ report.useCount }} 次</span>
            </div>
          </div>
          <div class="fm-card-footer">
            <span class="fm-card-time">{{ report.updatedAt }}</span>
            <div class="fm-card-actions">
              <button class="fm-btn fm-btn-primary fm-btn-xs" @click="handleOpen(report)">打开</button>
              <button v-if="report.type === 'entry'" class="fm-btn fm-btn-ghost fm-btn-xs" @click="handleFill(report)">填报</button>
              <button class="fm-btn fm-btn-danger-text fm-btn-xs" @click="handleRemoveFavorite(report)">取消收藏</button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { queryFavoriteReports, toggleFavorite } from '@/api/reportCenter'

const router = useRouter()
const loading = ref(false)
const searchKeyword = ref('')
const filterCategory = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)
const favorites = ref([])

const mockFavorites = [
  { id: 1, name: '月度销售报表', code: 'SALES-202401', description: '用于统计月度销售数据和趋势分析', type: 'statistics', status: 'published', category: 'sales', updatedAt: '2024-01-15', useCount: 128 },
  { id: 3, name: '人事考勤报表', code: 'HR-202401', description: '用于统计员工月度考勤情况', type: 'entry', status: 'published', category: 'hr', updatedAt: '2024-01-13', useCount: 256 },
  { id: 10, name: '预算执行报表', code: 'BUDGET-202401', description: '预算执行情况分析', type: 'summary', status: 'published', category: 'finance', updatedAt: '2024-01-06', useCount: 156 },
]

const filteredFavorites = computed(() => {
  let result = favorites.value
  if (searchKeyword.value) result = result.filter(f => f.name.includes(searchKeyword.value) || f.code.includes(searchKeyword.value))
  if (filterCategory.value) result = result.filter(f => f.category === filterCategory.value)
  return result
})

async function loadFavorites() {
  loading.value = true
  try {
    const params = { keyword: searchKeyword.value || undefined, category: filterCategory.value || undefined, page: currentPage.value, size: pageSize.value }
    const result = await queryFavoriteReports(params)
    if (result && result.records) { favorites.value = result.records; totalCount.value = result.total }
    else { favorites.value = mockFavorites; totalCount.value = mockFavorites.length }
  } catch { favorites.value = mockFavorites; totalCount.value = mockFavorites.length }
  finally { loading.value = false }
}

function getCategoryIcon(c) { return { finance: '💰', hr: '👥', sales: '📈', production: '🏭', other: '📊' }[c] || '📊' }
function getStatusType(s) { return { draft: 'info', published: 'success', disabled: 'warning' }[s] || 'default' }
function getStatusText(s) { return { draft: '草稿', published: '已发布', disabled: '已停用' }[s] || s }

function handleSearch() { currentPage.value = 1; loadFavorites() }
function handleReset() { searchKeyword.value = ''; filterCategory.value = ''; currentPage.value = 1; loadFavorites() }
function handleGoToReportCenter() { router.push('/report-center') }
function handleOpen(report) { router.push(`/report/${report.id}`) }
function handleFill(report) { router.push(`/report/${report.id}`) }

async function handleRemoveFavorite(report) {
  try {
    await toggleFavorite(report.id)
    const idx = favorites.value.findIndex(f => f.id === report.id)
    if (idx !== -1) favorites.value.splice(idx, 1)
  } catch { const idx = favorites.value.findIndex(f => f.id === report.id); if (idx !== -1) favorites.value.splice(idx, 1) }
}

onMounted(() => loadFavorites())
</script>

<style lang="scss" scoped>
@keyframes fm-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.favorites-manage { padding: var(--app-content-padding); }

/* ---- 页面头部 ---- */
.fm-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--app-space-6); flex-wrap: wrap; gap: var(--app-space-4); }
.fm-title { font-size: var(--app-font-h4); font-weight: var(--app-font-bold); color: var(--app-text-primary); margin: 0 0 var(--app-space-1); line-height: 1.3; }
.fm-desc { font-size: var(--app-font-caption); color: var(--app-text-muted); margin: 0; }

/* ---- 按钮 ---- */
.fm-btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 36px; padding: 0 var(--app-space-4);
  border: 1px solid var(--app-border); border-radius: var(--app-radius-md);
  font-size: var(--app-font-caption); font-weight: var(--app-font-medium);
  cursor: pointer; color: var(--app-text-primary); background: var(--app-surface);
  transition: all var(--app-transition-fast);
  &:hover { background: var(--app-surface-hover); }
}
.fm-btn-primary { background: var(--app-primary); color: #fff; border-color: var(--app-primary); &:hover { background: var(--app-primary-hover); } }
.fm-btn-ghost { background: transparent; border-color: transparent; color: var(--app-text-secondary); &:hover { background: var(--app-surface-hover); color: var(--app-primary); } }
.fm-btn-danger-text { background: transparent; border-color: transparent; color: var(--app-danger); &:hover { background: var(--app-danger-bg); } }
.fm-btn-xs { height: 28px; padding: 0 var(--app-space-2); font-size: 11px; }

/* ---- 统计 ---- */
.fm-stats-row { margin-bottom: var(--app-space-5); }
.fm-stats-card {
  display: inline-flex; align-items: center; gap: var(--app-space-4);
  padding: var(--app-space-3) var(--app-space-5);
  background: var(--app-surface); border-radius: var(--app-card-radius);
  border: 1px solid var(--app-border); box-shadow: var(--app-shadow-xs);
}
.fm-stats-label { font-size: var(--app-font-body); color: var(--app-text-secondary); }
.fm-stats-value { font-size: var(--app-font-h4); font-weight: var(--app-font-bold); color: var(--app-primary); font-family: var(--app-font-family-number); }

/* ---- 筛选 ---- */
.fm-filters { display: flex; gap: var(--app-space-2); margin-bottom: var(--app-space-5); flex-wrap: wrap; }
.fm-search-box { position: relative; width: 300px; }
.fm-search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--app-text-muted); pointer-events: none; }
.fm-input {
  width: 100%; height: 36px; padding: 0 var(--app-space-8) 0 var(--app-space-8);
  border: 1px solid var(--app-border); border-radius: var(--app-radius-md);
  font-size: var(--app-font-caption); background: var(--app-surface); color: var(--app-text-primary);
  outline: none; box-sizing: border-box;
  transition: border-color var(--app-transition-fast);
  &:focus { border-color: var(--app-primary); box-shadow: 0 0 0 3px var(--app-primary-bg); }
  &::placeholder { color: var(--app-text-muted); }
}
.fm-search-clear { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); background: none; border: none; font-size: 18px; color: var(--app-text-muted); cursor: pointer; padding: 4px; line-height: 1; }
.fm-select {
  height: 36px; padding: 0 var(--app-space-3); border: 1px solid var(--app-border); border-radius: var(--app-radius-md);
  font-size: var(--app-font-caption); background: var(--app-surface); color: var(--app-text-primary);
  outline: none; cursor: pointer; transition: border-color var(--app-transition-fast);
  &:focus { border-color: var(--app-primary); }
}

/* ---- 卡片网格 ---- */
.fm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--app-card-gap);
}

/* 卡片 */
.fm-card {
  background: var(--app-surface); border-radius: var(--app-card-radius);
  border: 1px solid var(--app-border); padding: var(--app-space-5);
  display: flex; flex-direction: column;
  transition: all var(--app-transition);
  &:hover { transform: translateY(-2px); box-shadow: var(--app-shadow-md); border-color: var(--app-border-dark); }
}

.fm-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--app-space-3); }
.fm-card-icon {
  width: 42px; height: 42px; border-radius: var(--app-radius-md);
  display: flex; align-items: center; justify-content: center; font-size: 20px;
}
.fm-card-icon.finance { background: var(--app-warning-bg); }
.fm-card-icon.hr { background: var(--app-primary-bg); }
.fm-card-icon.sales { background: var(--app-success-bg); }
.fm-card-icon.production { background: var(--app-info-bg); }
.fm-card-icon.other { background: var(--app-surface-active); }

/* 状态标签 */
.fm-status {
  display: inline-block; padding: 2px 10px; border-radius: var(--app-radius-xl);
  font-size: var(--app-font-caption); font-weight: var(--app-font-medium); flex-shrink: 0;
}
.fm-status-draft { background: var(--app-surface-active); color: var(--app-text-muted); }
.fm-status-published { background: var(--app-success-bg); color: var(--app-success); }
.fm-status-disabled { background: var(--app-warning-bg); color: var(--app-warning); }

.fm-card-body { flex: 1; overflow: hidden; }
.fm-card-title {
  font-size: var(--app-font-title); font-weight: var(--app-font-semibold);
  color: var(--app-text-primary); margin: 0 0 var(--app-space-1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.fm-card-desc {
  font-size: var(--app-font-caption); color: var(--app-text-secondary); margin: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.fm-card-meta { display: flex; gap: var(--app-space-3); margin-top: var(--app-space-2); font-size: var(--app-font-caption); color: var(--app-text-muted); }

.fm-card-footer {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: var(--app-space-3); padding-top: var(--app-space-3);
  border-top: 1px solid var(--app-border-light);
}
.fm-card-time { font-size: var(--app-font-caption); color: var(--app-text-muted); }
.fm-card-actions { display: flex; gap: var(--app-space-1); }

/* ---- 骨架屏 ---- */
.fm-card-skeleton { cursor: default; pointer-events: none; &:hover { transform: none; box-shadow: none; border-color: var(--app-border); } }
.fm-skel-icon {
  width: 42px; height: 42px; border-radius: var(--app-radius-md); margin-bottom: var(--app-space-4);
  background: linear-gradient(90deg, var(--app-border-light) 25%, var(--app-bg) 50%, var(--app-border-light) 75%);
  background-size: 200% 100%; animation: fm-shimmer 1.5s infinite;
}
.fm-skel-title {
  height: 16px; width: 65%; border-radius: var(--app-radius-xs); margin-bottom: var(--app-space-2);
  background: linear-gradient(90deg, var(--app-border-light) 25%, var(--app-bg) 50%, var(--app-border-light) 75%);
  background-size: 200% 100%; animation: fm-shimmer 1.5s infinite;
}
.fm-skel-desc {
  height: 12px; width: 80%; border-radius: var(--app-radius-xs); margin-bottom: var(--app-space-2);
  background: linear-gradient(90deg, var(--app-border-light) 25%, var(--app-bg) 50%, var(--app-border-light) 75%);
  background-size: 200% 100%; animation: fm-shimmer 1.5s infinite;
}
.fm-skel-meta { display: flex; gap: var(--app-space-4); margin-top: var(--app-space-2); }
.fm-skel-line {
  height: 11px; width: 35%; border-radius: var(--app-radius-xs);
  background: linear-gradient(90deg, var(--app-border-light) 25%, var(--app-bg) 50%, var(--app-border-light) 75%);
  background-size: 200% 100%; animation: fm-shimmer 1.5s infinite;
}

/* ---- 空状态 ---- */
.fm-empty { grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--app-space-16) var(--app-space-5); }
.fm-empty-title { font-size: var(--app-font-body); font-weight: var(--app-font-medium); color: var(--app-text-secondary); margin: var(--app-space-4) 0 var(--app-space-1); }
.fm-empty-desc { font-size: var(--app-font-caption); color: var(--app-text-muted); margin: 0 0 var(--app-space-4); }
</style>
