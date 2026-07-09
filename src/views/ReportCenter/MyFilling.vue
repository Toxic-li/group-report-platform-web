<template>
  <div class="my-filling">
    <!-- 页面头部 -->
    <div class="mf-header">
      <div class="mf-header-left">
        <h1 class="mf-title">我的填报</h1>
        <p class="mf-desc">查看和管理我的填报任务，关注截止时间</p>
      </div>
      <div class="mf-header-right">
        <button class="mf-btn mf-btn-primary" @click="handleNewReport">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          新建填报
        </button>
      </div>
    </div>

    <!-- 状态统计 -->
    <div class="mf-stats">
      <div class="mf-stat-card mf-stat-pending">
        <div class="mf-stat-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
        </div>
        <div class="mf-stat-info">
          <div class="mf-stat-value">{{ stats.pending }}</div>
          <div class="mf-stat-label">待填报</div>
        </div>
        <div v-if="stats.todayDeadline > 0" class="mf-stat-badge">今日截止 {{ stats.todayDeadline }} 项</div>
      </div>
      <div class="mf-stat-card mf-stat-submitted">
        <div class="mf-stat-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        </div>
        <div class="mf-stat-info">
          <div class="mf-stat-value">{{ stats.submitted }}</div>
          <div class="mf-stat-label">已提交</div>
        </div>
      </div>
      <div class="mf-stat-card mf-stat-rejected">
        <div class="mf-stat-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div class="mf-stat-info">
          <div class="mf-stat-value">{{ stats.rejected }}</div>
          <div class="mf-stat-label">已退回</div>
        </div>
      </div>
      <div class="mf-stat-card mf-stat-completed">
        <div class="mf-stat-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <div class="mf-stat-info">
          <div class="mf-stat-value">{{ stats.completed }}</div>
          <div class="mf-stat-label">已完成</div>
        </div>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="mf-filters">
      <div class="mf-search-box">
        <svg class="mf-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input v-model="searchKeyword" class="mf-input" placeholder="搜索报表名称" @input="handleSearch" />
        <button v-if="searchKeyword" class="mf-search-clear" @click="searchKeyword = ''; handleSearch()">×</button>
      </div>
      <select v-model="filterStatus" class="mf-select" @change="handleSearch">
        <option value="">全部状态</option>
        <option value="pending">待填报</option>
        <option value="submitted">已提交</option>
        <option value="rejected">已退回</option>
        <option value="completed">已完成</option>
      </select>
      <select v-model="filterCategory" class="mf-select" @change="handleSearch">
        <option value="">全部分类</option>
        <option value="finance">财务</option>
        <option value="hr">人事</option>
        <option value="sales">销售</option>
        <option value="production">生产</option>
      </select>
      <button class="mf-btn mf-btn-ghost" @click="handleReset">重置</button>
    </div>

    <!-- 填报任务列表 -->
    <div class="mf-list">
      <!-- 骨架屏 -->
      <template v-if="loading">
        <div v-for="i in 5" :key="'sk-' + i" class="mf-item mf-item-skeleton">
          <div class="mf-skel-icon"></div>
          <div class="mf-skel-content">
            <div class="mf-skel-title"></div>
            <div class="mf-skel-meta">
              <div class="mf-skel-line"></div>
              <div class="mf-skel-line"></div>
              <div class="mf-skel-line"></div>
            </div>
          </div>
        </div>
      </template>

      <!-- 空状态 -->
      <div v-else-if="filteredTasks.length === 0" class="mf-empty">
        <svg width="72" height="72" viewBox="0 0 80 80" fill="none">
          <rect x="8" y="10" width="64" height="52" rx="10" stroke="var(--app-text-muted)" stroke-width="2" fill="var(--app-bg)"/>
          <line x1="20" y1="26" x2="50" y2="26" stroke="var(--app-border-dark)" stroke-width="2" stroke-linecap="round"/>
          <line x1="20" y1="36" x2="56" y2="36" stroke="var(--app-border-dark)" stroke-width="2" stroke-linecap="round"/>
          <line x1="20" y1="46" x2="34" y2="46" stroke="var(--app-border-dark)" stroke-width="2" stroke-linecap="round"/>
          <circle cx="64" cy="58" r="13" fill="var(--app-surface)" stroke="var(--app-primary)" stroke-width="2"/>
          <line x1="64" y1="52" x2="64" y2="64" stroke="var(--app-primary)" stroke-width="2" stroke-linecap="round"/>
          <line x1="58" y1="58" x2="70" y2="58" stroke="var(--app-primary)" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <p class="mf-empty-title">暂无填报任务</p>
        <p class="mf-empty-desc">{{ searchKeyword || filterStatus || filterCategory ? '调整筛选条件试试' : '去新建一个填报任务' }}</p>
      </div>

      <!-- 任务列表 -->
      <template v-else>
        <div
          v-for="task in filteredTasks"
          :key="task.id"
          class="mf-item"
          :class="{ 'mf-item-urgent': task.isUrgent }"
        >
          <div class="mf-item-icon" :class="task.category">
            {{ getCategoryIcon(task.category) }}
          </div>
          <div class="mf-item-body">
            <div class="mf-item-header">
              <h3 class="mf-item-name">{{ task.name }}</h3>
              <span :class="['mf-status', 'mf-status-' + task.status]">{{ getStatusText(task.status) }}</span>
            </div>
            <div class="mf-item-meta">
              <span class="mf-meta">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                周期：{{ task.period }}
              </span>
              <span class="mf-meta" :class="{ 'mf-meta-urgent': task.isUrgent }">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                截止：{{ task.deadline }}
              </span>
              <span class="mf-meta">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                创建人：{{ task.creatorName || task.creator || '-' }}
              </span>
            </div>
            <div v-if="task.status === 'pending'" class="mf-progress">
              <div class="mf-progress-bar">
                <div class="mf-progress-fill" :style="{ width: task.progress + '%' }"></div>
              </div>
              <span class="mf-progress-text">已填写 {{ task.progress }}%</span>
            </div>
          </div>
          <div class="mf-item-actions">
            <button
              v-if="task.status === 'pending'"
              class="mf-btn mf-btn-primary mf-btn-sm"
              @click="handleFill(task)"
            >填报</button>
            <button
              v-if="task.status === 'rejected'"
              class="mf-btn mf-btn-warning mf-btn-sm"
              @click="handleRefill(task)"
            >重填</button>
            <button
              v-if="task.status === 'submitted' || task.status === 'completed'"
              class="mf-btn mf-btn-ghost mf-btn-sm"
              @click="handleView(task)"
            >查看</button>
            <div v-if="task.status !== 'completed'" class="mf-more-wrap">
              <button class="mf-btn-more" @click.stop="toggleMore(task.id)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
              </button>
              <div v-if="openMoreId === task.id" class="mf-dropdown" @click.stop>
                <button class="mf-dropdown-item" @click="handleHistory(task); openMoreId = null">填报历史</button>
                <button class="mf-dropdown-item" @click="handleExport(task); openMoreId = null">导出数据</button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { queryMyFillingTasks, getFillingStats } from '@/api/filling'

const router = useRouter()
const loading = ref(false)
const searchKeyword = ref('')
const filterStatus = ref('')
const filterCategory = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const openMoreId = ref(null)

const stats = ref({
  pending: 0, submitted: 0, rejected: 0, completed: 0, todayDeadline: 0
})

const tasks = ref([])
const totalCount = ref(0)

const mockTasks = [
  { id: 1, name: '月度销售报表', period: '2026年7月', deadline: '今天 18:00', status: 'pending', category: 'sales', creatorName: '张三', progress: 60, isUrgent: true },
  { id: 2, name: '财务费用报表', period: '2026年7月', deadline: '明天 12:00', status: 'pending', category: 'finance', creatorName: '李四', progress: 30, isUrgent: false },
  { id: 3, name: '人事考勤报表', period: '2026年7月', deadline: '2026-07-15', status: 'pending', category: 'hr', creatorName: '王五', progress: 80, isUrgent: false },
  { id: 4, name: '采购成本报表', period: '2026年6月', deadline: '已提交', status: 'submitted', category: 'finance', creatorName: '张三', progress: 100, isUrgent: false },
  { id: 5, name: '库存盘点报表', period: '2026年6月', deadline: '已驳回', status: 'rejected', category: 'production', creatorName: '李四', progress: 95, isUrgent: false },
  { id: 6, name: '员工薪资报表', period: '2026年6月', deadline: '已完成', status: 'completed', category: 'hr', creatorName: '王五', progress: 100, isUrgent: false },
]

const filteredTasks = computed(() => {
  let result = tasks.value
  if (searchKeyword.value) result = result.filter(t => t.name.includes(searchKeyword.value))
  if (filterStatus.value) result = result.filter(t => t.status === filterStatus.value)
  if (filterCategory.value) result = result.filter(t => t.category === filterCategory.value)
  return result
})

function toggleMore(id) { openMoreId.value = openMoreId.value === id ? null : id }

function onDocClick() { openMoreId.value = null }
onMounted(() => { loadStats(); loadTasks(); document.addEventListener('click', onDocClick) })
onUnmounted(() => document.removeEventListener('click', onDocClick))

async function loadStats() {
  try {
    const result = await getFillingStats()
    if (result) stats.value = result
  } catch { stats.value = { pending: 5, submitted: 3, rejected: 1, completed: 12, todayDeadline: 2 } }
}

async function loadTasks() {
  loading.value = true
  try {
    const params = {
      keyword: searchKeyword.value || undefined,
      status: filterStatus.value || undefined,
      category: filterCategory.value || undefined,
      page: currentPage.value, size: pageSize.value
    }
    const result = await queryMyFillingTasks(params)
    if (result && result.records) { tasks.value = result.records; totalCount.value = result.total }
    else { tasks.value = mockTasks; totalCount.value = mockTasks.length }
  } catch { tasks.value = mockTasks; totalCount.value = mockTasks.length }
  finally { loading.value = false }
}

function getCategoryIcon(c) { return { finance: '💰', hr: '👥', sales: '📈', production: '🏭' }[c] || '📊' }

function getStatusText(s) {
  return { pending: '待填报', submitted: '已提交', rejected: '已退回', completed: '已完成' }[s] || s
}

function handleSearch() { currentPage.value = 1; loadTasks() }
function handleReset() { searchKeyword.value = ''; filterStatus.value = ''; filterCategory.value = ''; currentPage.value = 1; loadTasks() }
function handleNewReport() { router.push('/designer') }
function handleFill(task) { router.push(`/report/${task.id}`) }
function handleRefill(task) { router.push(`/report/${task.id}`) }
function handleView(task) { router.push(`/report/${task.id}`) }
function handleHistory(task) { console.log('填报历史:', task) }
function handleExport(task) { console.log('导出数据:', task) }
</script>

<style lang="scss" scoped>
/* ---- 动画 ---- */
@keyframes mf-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.my-filling { padding: var(--app-content-padding); }

/* ---- 页面头部 ---- */
.mf-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: var(--app-space-6); flex-wrap: wrap; gap: var(--app-space-4);
}
.mf-title { font-size: var(--app-font-h4); font-weight: var(--app-font-bold); color: var(--app-text-primary); margin: 0 0 var(--app-space-1); line-height: 1.3; }
.mf-desc { font-size: var(--app-font-caption); color: var(--app-text-muted); margin: 0; }

/* ---- 按钮 ---- */
.mf-btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 36px; padding: 0 var(--app-space-4);
  border: 1px solid var(--app-border); border-radius: var(--app-radius-md);
  font-size: var(--app-font-caption); font-weight: var(--app-font-medium);
  cursor: pointer; color: var(--app-text-primary); background: var(--app-surface);
  transition: all var(--app-transition-fast);
  &:hover { background: var(--app-surface-hover); }
}
.mf-btn-primary { background: var(--app-primary); color: #fff; border-color: var(--app-primary); &:hover { background: var(--app-primary-hover); } }
.mf-btn-warning { background: var(--app-warning); color: #fff; border-color: var(--app-warning); &:hover { background: var(--app-warning-hover); } }
.mf-btn-ghost { background: transparent; border-color: transparent; color: var(--app-text-secondary); &:hover { background: var(--app-surface-hover); color: var(--app-primary); } }
.mf-btn-sm { height: 30px; padding: 0 var(--app-space-3); font-size: var(--app-font-caption); }

/* ---- 统计卡片 ---- */
.mf-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--app-card-gap); margin-bottom: var(--app-space-6); }
.mf-stat-card {
  display: flex; align-items: center; gap: var(--app-space-3);
  padding: var(--app-space-4) var(--app-space-5);
  background: var(--app-surface); border-radius: var(--app-card-radius);
  border: 1px solid var(--app-border); box-shadow: var(--app-shadow-xs);
  position: relative;
}
.mf-stat-icon {
  width: 42px; height: 42px; border-radius: var(--app-radius-md);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.mf-stat-pending .mf-stat-icon { background: var(--app-primary-bg); color: var(--app-primary); }
.mf-stat-submitted .mf-stat-icon { background: var(--app-info-bg); color: var(--app-info); }
.mf-stat-rejected .mf-stat-icon { background: var(--app-danger-bg); color: var(--app-danger); }
.mf-stat-completed .mf-stat-icon { background: var(--app-success-bg); color: var(--app-success); }
.mf-stat-info { flex: 1; min-width: 0; }
.mf-stat-value { font-size: var(--app-font-h4); font-weight: var(--app-font-bold); color: var(--app-text-primary); font-family: var(--app-font-family-number); line-height: 1.2; }
.mf-stat-label { font-size: var(--app-font-caption); color: var(--app-text-secondary); }
.mf-stat-badge {
  position: absolute; top: var(--app-space-2); right: var(--app-space-3);
  font-size: 11px; padding: 2px 8px; border-radius: var(--app-radius-xs);
  background: var(--app-danger-bg); color: var(--app-danger); font-weight: var(--app-font-medium);
}

/* ---- 筛选 ---- */
.mf-filters { display: flex; gap: var(--app-space-2); margin-bottom: var(--app-space-5); flex-wrap: wrap; }
.mf-search-box {
  position: relative; width: 300px;
  .mf-search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--app-text-muted); pointer-events: none; }
}
.mf-input {
  width: 100%; height: 36px; padding: 0 var(--app-space-8) 0 var(--app-space-8);
  border: 1px solid var(--app-border); border-radius: var(--app-radius-md);
  font-size: var(--app-font-caption); background: var(--app-surface); color: var(--app-text-primary);
  outline: none; box-sizing: border-box;
  transition: border-color var(--app-transition-fast);
  &:focus { border-color: var(--app-primary); box-shadow: 0 0 0 3px var(--app-primary-bg); }
  &::placeholder { color: var(--app-text-muted); }
}
.mf-search-clear { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); background: none; border: none; font-size: 18px; color: var(--app-text-muted); cursor: pointer; padding: 4px; line-height: 1; }
.mf-select {
  height: 36px; padding: 0 var(--app-space-3); border: 1px solid var(--app-border); border-radius: var(--app-radius-md);
  font-size: var(--app-font-caption); background: var(--app-surface); color: var(--app-text-primary);
  outline: none; cursor: pointer;
  transition: border-color var(--app-transition-fast);
  &:focus { border-color: var(--app-primary); }
}

/* ---- 列表 ---- */
.mf-list { background: var(--app-surface); border-radius: var(--app-card-radius); border: 1px solid var(--app-border); overflow: hidden; box-shadow: var(--app-shadow-sm); }

/* 列表项 */
.mf-item {
  display: flex; align-items: flex-start; gap: var(--app-space-4);
  padding: var(--app-space-4) var(--app-space-5); border-bottom: 1px solid var(--app-border-light);
  transition: background var(--app-transition-fast);
  &:hover { background: var(--app-surface-hover); }
  &:last-child { border-bottom: none; }
}
.mf-item-urgent { background: var(--app-danger-bg); border-left: 3px solid var(--app-danger); }
.mf-item-icon {
  width: 44px; height: 44px; border-radius: var(--app-radius-md);
  display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0;
}
.mf-item-icon.finance { background: var(--app-warning-bg); }
.mf-item-icon.hr { background: var(--app-primary-bg); }
.mf-item-icon.sales { background: var(--app-success-bg); }
.mf-item-icon.production { background: var(--app-info-bg); }

.mf-item-body { flex: 1; min-width: 0; }
.mf-item-header { display: flex; align-items: center; gap: var(--app-space-3); margin-bottom: var(--app-space-2); }
.mf-item-name { font-size: var(--app-font-body); font-weight: var(--app-font-semibold); color: var(--app-text-primary); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* 状态标签 */
.mf-status {
  display: inline-block; padding: 2px 10px; border-radius: var(--app-radius-xl);
  font-size: var(--app-font-caption); font-weight: var(--app-font-medium); flex-shrink: 0;
}
.mf-status-pending { background: var(--app-primary-bg); color: var(--app-primary); }
.mf-status-submitted { background: var(--app-info-bg); color: var(--app-info); }
.mf-status-rejected { background: var(--app-danger-bg); color: var(--app-danger); }
.mf-status-completed { background: var(--app-success-bg); color: var(--app-success); }

/* 元信息 */
.mf-item-meta { display: flex; gap: var(--app-space-4); font-size: var(--app-font-caption); color: var(--app-text-secondary); flex-wrap: wrap; }
.mf-meta { display: flex; align-items: center; gap: 4px; svg { flex-shrink: 0; } }
.mf-meta-urgent { color: var(--app-danger); font-weight: var(--app-font-medium); }

/* 进度条 */
.mf-progress { display: flex; align-items: center; gap: var(--app-space-3); margin-top: var(--app-space-2); }
.mf-progress-bar { width: 160px; height: 6px; background: var(--app-border); border-radius: 3px; overflow: hidden; }
.mf-progress-fill { height: 100%; background: var(--app-primary); border-radius: 3px; transition: width var(--app-duration-slow) var(--app-ease); }
.mf-progress-text { font-size: var(--app-font-caption); color: var(--app-text-muted); flex-shrink: 0; }

/* 操作区 */
.mf-item-actions { display: flex; gap: var(--app-space-2); align-items: center; flex-shrink: 0; }
.mf-more-wrap { position: relative; }
.mf-btn-more {
  width: 30px; height: 30px; border: 1px solid var(--app-border); border-radius: var(--app-radius-md);
  background: var(--app-surface); color: var(--app-text-muted); cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all var(--app-transition-fast);
  &:hover { background: var(--app-surface-hover); border-color: var(--app-border-dark); }
}
.mf-dropdown {
  position: absolute; right: 0; top: 100%; margin-top: 4px; min-width: 140px;
  background: var(--app-surface); border: 1px solid var(--app-border); border-radius: var(--app-radius-md);
  box-shadow: var(--app-shadow-lg); z-index: 100; overflow: hidden;
}
.mf-dropdown-item {
  display: block; width: 100%; text-align: left; padding: var(--app-space-2) var(--app-space-4);
  border: none; background: none; font-size: var(--app-font-caption); color: var(--app-text-primary); cursor: pointer;
  &:hover { background: var(--app-surface-hover); }
}

/* ---- 骨架屏 ---- */
.mf-item-skeleton { cursor: default; pointer-events: none; &:hover { background: transparent; } }
.mf-skel-icon {
  width: 44px; height: 44px; border-radius: var(--app-radius-md); flex-shrink: 0;
  background: linear-gradient(90deg, var(--app-border-light) 25%, var(--app-bg) 50%, var(--app-border-light) 75%);
  background-size: 200% 100%; animation: mf-shimmer 1.5s infinite;
}
.mf-skel-content { flex: 1; display: flex; flex-direction: column; gap: var(--app-space-3); }
.mf-skel-title {
  height: 16px; width: 55%; border-radius: var(--app-radius-xs);
  background: linear-gradient(90deg, var(--app-border-light) 25%, var(--app-bg) 50%, var(--app-border-light) 75%);
  background-size: 200% 100%; animation: mf-shimmer 1.5s infinite;
}
.mf-skel-meta { display: flex; gap: var(--app-space-4); }
.mf-skel-line {
  height: 12px; width: 28%; border-radius: var(--app-radius-xs);
  background: linear-gradient(90deg, var(--app-border-light) 25%, var(--app-bg) 50%, var(--app-border-light) 75%);
  background-size: 200% 100%; animation: mf-shimmer 1.5s infinite;
}

/* ---- 空状态 ---- */
.mf-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: var(--app-space-16) var(--app-space-5);
}
.mf-empty-title { font-size: var(--app-font-body); font-weight: var(--app-font-medium); color: var(--app-text-secondary); margin: var(--app-space-4) 0 var(--app-space-1); }
.mf-empty-desc { font-size: var(--app-font-caption); color: var(--app-text-muted); margin: 0; }

/* ---- 响应式 ---- */
@media (max-width: 1024px) { .mf-stats { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px) {
  .mf-stats { grid-template-columns: repeat(2, 1fr); }
  .mf-filters { flex-direction: column; }
  .mf-search-box { width: 100%; }
  .mf-select { width: 100%; }
  .mf-item { flex-wrap: wrap; }
  .mf-item-actions { width: 100%; justify-content: flex-end; margin-top: var(--app-space-2); }
}
</style>
