<template>
  <div class="entry-center">
    <!-- ===== Page Header ===== -->
    <div class="ec-page-header">
      <div class="ec-header-left">
        <h1 class="ec-page-title">{{ currentPageTitle }}</h1>
        <p class="ec-page-desc">{{ currentPageDesc }}</p>
      </div>
      <div class="ec-header-right">
        <button class="ec-btn ec-btn--primary" @click="handleNewEntry">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          新建填报
        </button>
        <button class="ec-btn ec-btn--ghost" @click="viewMode = viewMode === 'card' ? 'table' : 'card'" :title="viewMode === 'card' ? '切换为表格视图' : '切换为卡片视图'">
          <svg v-if="viewMode === 'card'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="7" rx="1"/><rect x="3" y="14" width="18" height="7" rx="1"/></svg>
        </button>
      </div>
    </div>

    <!-- ===== Status Stats (quick jump) ===== -->
    <div class="ec-stats">
      <div class="ec-stat-card ec-stat--draft" @click="navigateTo('/entry/draft')">
        <div class="ec-stat-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </div>
        <div class="ec-stat-body"><span class="ec-stat-value">{{ stats.draft || 0 }}</span><span class="ec-stat-label">草稿</span></div>
      </div>
      <div class="ec-stat-card ec-stat--pending" @click="navigateTo('/entry/pending')">
        <div class="ec-stat-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
        </div>
        <div class="ec-stat-body"><span class="ec-stat-value">{{ stats.pending || 0 }}</span><span class="ec-stat-label">待填报</span></div>
        <span class="ec-stat-badge" v-if="stats.todayDeadline > 0">今日截止 {{ stats.todayDeadline }} 项</span>
      </div>
      <div class="ec-stat-card ec-stat--submitted" @click="navigateTo('/entry/submitted')">
        <div class="ec-stat-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </div>
        <div class="ec-stat-body"><span class="ec-stat-value">{{ (stats.submitted || 0) + (stats.reviewing || 0) }}</span><span class="ec-stat-label">审核中</span></div>
      </div>
      <div class="ec-stat-card ec-stat--rejected" @click="navigateTo('/entry/rejected')">
        <div class="ec-stat-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </div>
        <div class="ec-stat-body"><span class="ec-stat-value">{{ stats.rejected || 0 }}</span><span class="ec-stat-label">已退回</span></div>
      </div>
      <div class="ec-stat-card ec-stat--completed" @click="navigateTo('/entry/completed')">
        <div class="ec-stat-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="ec-stat-body"><span class="ec-stat-value">{{ stats.completed || 0 }}</span><span class="ec-stat-label">已完成</span></div>
      </div>
    </div>

    <!-- ===== Content Card ===== -->
    <div class="ec-content-card">
      <!-- Filter Bar -->
      <div class="ec-filter-bar">
        <el-input v-model="filterKeyword" placeholder="搜索报表名称或编号" class="ec-search-input" clearable @keyup.enter="loadEntries">
          <template #prefix>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </template>
        </el-input>
        <el-select v-model="filterCategory" placeholder="报表分类" style="width: 130px" clearable size="default">
          <el-option label="财务" value="finance"/><el-option label="销售" value="sales"/>
          <el-option label="人事" value="hr"/><el-option label="生产" value="production"/>
        </el-select>
        <el-date-picker v-model="filterDate" type="month" placeholder="选择月份" style="width: 140px" size="default"/>
        <el-button @click="loadEntries" size="default">查询</el-button>
        <el-button @click="handleReset" size="default" plain>重置</el-button>
      </div>

      <!-- Skeleton -->
      <div v-if="loading" class="ec-card-grid">
        <div v-for="i in 6" :key="'sk-'+i" class="ec-card ec-card--skeleton">
          <div class="ec-skel-header"><div class="ec-skel-line ec-skel-line--title"></div><div class="ec-skel-tag"></div></div>
          <div class="ec-skel-body">
            <div class="ec-skel-line ec-skel-line--sm"></div><div class="ec-skel-line ec-skel-line--sm"></div><div class="ec-skel-line ec-skel-line--sm" style="width:60%"></div>
          </div>
          <div class="ec-skel-footer"><div class="ec-skel-line ec-skel-line--xs"></div></div>
        </div>
      </div>

      <!-- Card View -->
      <div v-else-if="viewMode === 'card'" class="ec-card-grid">
        <div v-for="entry in displayEntries" :key="entry.id" :class="['ec-card', { 'ec-card--urgent': entry.isUrgent }]">
          <div class="ec-card-header">
            <h3 class="ec-card-title" @click="handleViewEntry(entry)">{{ entry.name }}</h3>
            <span :class="['ec-status-tag', 'ec-status--' + entry.status]">{{ getStatusText(entry.status) }}</span>
          </div>
          <div class="ec-card-meta">
            <div class="ec-meta-row">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
              <span>{{ entry.period }}</span>
            </div>
            <div v-if="['draft','submitted','rejected'].includes(entry.status)" class="ec-meta-row ec-meta--deadline" :class="{ 'ec-meta--urgent': entry.isUrgent }">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>截止：{{ entry.deadline }}</span>
            </div>
            <div class="ec-meta-row">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span>{{ entry.code }}</span>
            </div>
          </div>
          <div v-if="entry.status === 'rejected' && entry.reviewOpinion" class="ec-review-banner">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>{{ entry.reviewOpinion }}</span>
          </div>
          <div v-if="entry.progress != null && !['submitted','approved','withdrawn'].includes(entry.status)" class="ec-card-progress">
            <div class="ec-progress-bar"><div class="ec-progress-fill" :style="{ width: entry.progress + '%' }"></div></div>
            <span class="ec-progress-text">{{ entry.progress }}%</span>
          </div>
          <div class="ec-card-footer">
            <span class="ec-card-time">{{ entry.creatorName }}</span>
            <div class="ec-card-actions">
              <el-button v-if="entry.status === 'rejected'" type="primary" size="small" @click.stop="handleEdit(entry)">填报</el-button>
              <el-button v-if="entry.status === 'draft'" type="primary" size="small" @click.stop="handleEdit(entry)">继续编辑</el-button>
              <el-button v-if="entry.status === 'submitted'" size="small" @click.stop="handleView(entry)">查看进度</el-button>
              <el-button v-if="entry.status === 'approved'" size="small" @click.stop="handleView(entry)">查看</el-button>
              <el-dropdown trigger="click" @command="(cmd) => handleCardMore(entry, cmd)">
                <el-button text size="small" @click.stop>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="detail">查看详情</el-dropdown-item>
                    <el-dropdown-item command="history">版本历史</el-dropdown-item>
                    <el-dropdown-item command="export">导出数据</el-dropdown-item>
                    <el-dropdown-item v-if="['submitted','rejected'].includes(entry.status)" command="withdraw" divided>撤回提交</el-dropdown-item>
                    <el-dropdown-item v-if="entry.status === 'draft'" command="delete" divided>删除草稿</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>
        <div v-if="displayEntries.length === 0" class="ec-empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--app-text-muted)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          <p>暂无数据</p>
        </div>
      </div>

      <!-- Table View -->
      <div v-else class="ec-table-wrapper">
        <el-table :data="displayEntries" style="width: 100%" row-key="id" @row-click="handleViewEntry">
          <el-table-column prop="name" label="报表名称" min-width="180"><template #default="{ row }"><span class="ec-table-name">{{ row.name }}</span></template></el-table-column>
          <el-table-column prop="code" label="编号" width="150"/>
          <el-table-column prop="period" label="填报周期" width="140"/>
          <el-table-column label="状态" width="100"><template #default="{ row }"><span :class="['ec-status-tag', 'ec-status--' + row.status]">{{ getStatusText(row.status) }}</span></template></el-table-column>
          <el-table-column prop="deadline" label="截止时间" width="140"/>
          <el-table-column prop="creatorName" label="创建人" width="100"/>
          <el-table-column label="进度" width="150" v-if="currentRouteTab === 'pending' || currentRouteTab === 'draft'">
            <template #default="{ row }">
              <div class="ec-table-progress" v-if="row.progress != null">
                <div class="ec-progress-bar ec-progress-bar--sm"><div class="ec-progress-fill" :style="{ width: row.progress + '%' }"></div></div>
                <span>{{ row.progress }}%</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.status === 'rejected'" type="primary" size="small" link @click.stop="handleEdit(row)">填报</el-button>
              <el-button v-if="row.status === 'draft'" type="primary" size="small" link @click.stop="handleEdit(row)">继续编辑</el-button>
              <el-button v-if="row.status === 'submitted'" size="small" link @click.stop="handleView(row)">进度</el-button>
              <el-button v-if="row.status === 'approved'" size="small" link @click.stop="handleView(row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="displayEntries.length === 0" class="ec-empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--app-text-muted)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          <p>暂无数据</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { queryMyFillingTasks, getFillingStats, withdrawSubmit } from '@/api/filling'

const route = useRoute()
const router = useRouter()

const viewMode = ref('card')
const filterKeyword = ref('')
const filterCategory = ref('')
const filterDate = ref('')
const loading = ref(false)

const stats = ref({ draft: 0, pending: 0, submitted: 0, reviewing: 0, rejected: 0, completed: 0, todayDeadline: 0 })
const entries = ref([])

// Map: route path -> backend tab
const ROUTE_TAB_MAP = {
  '/entry': 'my',
  '/entry/draft': 'draft',
  '/entry/pending': 'pending',
  '/entry/submitted': 'submitted',
  '/entry/rejected': 'rejected',
  '/entry/completed': 'completed',
}

const currentRouteTab = computed(() => {
  const path = route.path.replace(/\/$/, '')
  if (ROUTE_TAB_MAP[path]) return path.replace('/entry', '').replace(/^\//, '') || 'all'
  if (path.startsWith('/entry/draft')) return 'draft'
  if (path.startsWith('/entry/pending')) return 'pending'
  if (path.startsWith('/entry/submitted')) return 'submitted'
  if (path.startsWith('/entry/rejected')) return 'rejected'
  if (path.startsWith('/entry/completed')) return 'completed'
  return 'all'
})

const currentBackendTab = computed(() => {
  const path = route.path.replace(/\/$/, '')
  return ROUTE_TAB_MAP[path] || 'my'
})

const currentPageTitle = computed(() => {
  const map = {
    all: '我的填报', draft: '草稿箱', pending: '待提交',
    submitted: '已提交', rejected: '已退回', completed: '已完成',
  }
  return map[currentRouteTab.value] || '我的填报'
})

const currentPageDesc = computed(() => {
  const map = {
    all: '查看所有填报记录，了解整体填报进度',
    draft: '保存的草稿，可以继续编辑完善',
    pending: '待填写的报表任务，请在截止日期前完成填报',
    submitted: '已提交审核，等待审核人员处理',
    rejected: '审核未通过的报表，根据审核意见修改后重新提交',
    completed: '审核已完成的报表，可查看或导出数据',
  }
  return map[currentRouteTab.value] || ''
})

// Backend returns data already filtered by tab; we only apply local keyword/category filter
const displayEntries = computed(() => {
  let result = entries.value
  const kw = filterKeyword.value?.toLowerCase()
  if (kw) result = result.filter(e => e.name?.toLowerCase().includes(kw) || e.code?.toLowerCase().includes(kw))
  if (filterCategory.value) result = result.filter(e => e.category === filterCategory.value)
  return result
})

function getStatusText(status) {
  return { draft: '草稿', submitted: '已提交', approved: '已通过', rejected: '已退回', withdrawn: '已撤回' }[status] || status
}

function navigateTo(path) { router.push(path) }

async function loadStats() {
  try {
    const result = await getFillingStats()
    if (result) {
      // 后端 stats 映射：pending=草稿(DRAFT), submitted=待审核(PENDING), rejected=已退回, completed=已完成
      const draftCount = result.pending ?? 0          // 后端 pending 实际是 DRAFT 数量
      const submittedCount = result.submitted ?? 0     // 后端 submitted 实际是 PENDING 数量
      const rejectedCount = result.rejected ?? 0
      const completedCount = result.completed ?? 0
      stats.value = {
        draft: draftCount,
        pending: draftCount + rejectedCount,           // 待填报 = 草稿 + 已退回
        submitted: submittedCount,
        reviewing: 0,
        rejected: rejectedCount,
        completed: completedCount,
        todayDeadline: result.todayDeadline ?? 0,
      }
    }
  } catch {
    stats.value = { draft: 0, pending: 0, submitted: 0, reviewing: 0, rejected: 0, completed: 0, todayDeadline: 0 }
  }
}

async function loadEntries() {
  loading.value = true
  try {
    const result = await queryMyFillingTasks({
      tab: currentBackendTab.value,
      page: 1,
      size: 50,
    })
    entries.value = result?.records || []
  } catch (e) {
    entries.value = []
    ElMessage.error('加载填报数据失败：' + (e?.message || '请稍后重试'))
  } finally { loading.value = false }
}

function handleReset() { filterKeyword.value = ''; filterCategory.value = ''; filterDate.value = ''; loadEntries() }
function handleNewEntry() { router.push('/designer') }
function handleViewEntry(e) { router.push('/entry/detail/' + e.id) }
function handleEdit(e) { router.push('/entry/detail/' + e.id) }
function handleView(e) { router.push('/entry/detail/' + e.id) }
function handleCardMore(e, cmd) {
  if (cmd === 'detail') router.push('/entry/detail/' + e.id)
  else if (cmd === 'history') router.push('/entry/history/' + e.id)
  else if (cmd === 'export') exportToExcel(e.id)
  else if (cmd === 'withdraw') handleWithdraw(e)
  else if (cmd === 'delete') ElMessageBox.confirm('确认删除该草稿？', '提示', { type: 'warning' }).then(() => loadEntries()).catch(() => {})
}

async function handleWithdraw(entry) {
  try {
    await ElMessageBox.confirm(`确认撤回「${entry.name}」吗？`, '撤回确认', { type: 'warning' })
  } catch { return }
  try {
    await withdrawSubmit(entry.id)
    ElMessage.success('已撤回')
    loadEntries()
    loadStats()
  } catch (e) {
    ElMessage.error('撤回失败：' + (e?.message || ''))
  }
}

function exportToExcel(submitId) {
  window.location.href = `/api/filling/export/${submitId}`
}

onMounted(() => { loadStats(); loadEntries() })
watch(() => route.path, () => loadEntries())
</script>

<style scoped>
.entry-center { padding: var(--app-content-padding); min-height: calc(100vh - 100px); }

/* Page Header */
.ec-page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--app-space-6); }
.ec-header-left .ec-page-title { font-size: 20px; font-weight: 600; color: var(--app-text-primary); margin: 0; }
.ec-header-left .ec-page-desc { font-size: 13px; color: var(--app-text-muted); margin: 4px 0 0; }
.ec-header-right { display: flex; gap: var(--app-space-2); }

/* Buttons */
.ec-btn { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 var(--app-space-4); border-radius: var(--app-radius-md); font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid var(--app-border); background: var(--app-surface); color: var(--app-text-primary); transition: all var(--app-transition); white-space: nowrap; }
.ec-btn:hover { background: var(--app-surface-hover); }
.ec-btn--primary { background: var(--app-primary); color: #fff; border-color: var(--app-primary); }
.ec-btn--primary:hover { background: var(--app-primary-hover); }
.ec-btn--ghost { background: transparent; border-color: transparent; color: var(--app-text-secondary); }
.ec-btn--ghost:hover { background: var(--app-surface-hover); color: var(--app-primary); }

/* Stats */
.ec-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--app-space-4); margin-bottom: var(--app-space-5); }
.ec-stat-card { display: flex; align-items: center; gap: var(--app-space-3); padding: var(--app-space-4) var(--app-space-5); background: var(--app-surface); border-radius: var(--app-radius-lg); border: 1px solid var(--app-border); cursor: pointer; transition: all var(--app-transition); position: relative; }
.ec-stat-card:hover { border-color: var(--app-primary); box-shadow: var(--app-shadow-sm); }
.ec-stat-icon { width: 40px; height: 40px; border-radius: var(--app-radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ec-stat--draft .ec-stat-icon { background: rgba(148,163,184,0.1); color: var(--color-gray-600); }
.ec-stat--pending .ec-stat-icon { background: var(--app-primary-bg); color: var(--app-primary); }
.ec-stat--submitted .ec-stat-icon { background: var(--app-info-bg); color: var(--app-info); }
.ec-stat--rejected .ec-stat-icon { background: var(--app-danger-bg); color: var(--app-danger); }
.ec-stat--completed .ec-stat-icon { background: var(--app-success-bg); color: var(--app-success); }
.ec-stat-body { flex: 1; }
.ec-stat-value { font-size: 24px; font-weight: 700; color: var(--app-text-primary); font-family: var(--app-font-family-number); }
.ec-stat-label { font-size: 13px; color: var(--app-text-secondary); display: block; }
.ec-stat-badge { position: absolute; top: -8px; right: var(--app-space-3); font-size: 11px; padding: 2px 8px; background: var(--app-danger-bg); color: var(--app-danger); border-radius: var(--app-radius-xs); white-space: nowrap; font-weight: 500; }

/* Content Card */
.ec-content-card { background: var(--app-surface); border-radius: var(--app-radius-lg); box-shadow: var(--app-shadow-sm); overflow: hidden; padding: var(--app-space-6); }

/* Filter Bar */
.ec-filter-bar { display: flex; gap: var(--app-space-3); margin-bottom: var(--app-space-5); flex-wrap: wrap; }
.ec-search-input { width: 360px; }

/* Card Grid */
.ec-card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--app-card-gap); }

/* Entry Card */
.ec-card { padding: var(--app-space-5); background: var(--app-surface); border: 1px solid var(--app-border); border-radius: var(--app-radius-lg); transition: all var(--app-transition); cursor: default; }
.ec-card:hover { border-color: var(--app-primary); box-shadow: var(--app-shadow-md); }
.ec-card--urgent { border-left: 3px solid var(--app-danger); background: var(--app-danger-bg); }
.ec-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--app-space-3); }
.ec-card-title { font-size: 16px; font-weight: 600; color: var(--app-text-primary); cursor: pointer; margin: 0; line-height: 1.4; }
.ec-card-title:hover { color: var(--app-primary); }

/* Status Tags */
.ec-status-tag { font-size: 11px; padding: 2px 8px; border-radius: var(--app-radius-xs); font-weight: 500; white-space: nowrap; flex-shrink: 0; }
.ec-status--draft { background: rgba(148,163,184,0.1); color: var(--color-gray-600); }
.ec-status--filling,.ec-status--pending { background: var(--app-primary-bg); color: var(--app-primary); }
.ec-status--submitted { background: var(--app-info-bg); color: var(--app-info); }
.ec-status--reviewing { background: var(--app-warning-bg); color: var(--app-warning); }
.ec-status--approved { background: var(--app-success-bg); color: var(--app-success); }
.ec-status--rejected { background: var(--app-danger-bg); color: var(--app-danger); }

/* Card Meta */
.ec-card-meta { display: flex; flex-direction: column; gap: 6px; margin-bottom: var(--app-space-3); }
.ec-meta-row { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--app-text-secondary); }
.ec-meta--deadline { font-weight: 500; }
.ec-meta--urgent { color: var(--app-danger); }
.ec-review-banner { display: flex; align-items: flex-start; gap: 6px; padding: var(--app-space-2) var(--app-space-3); background: var(--app-danger-bg); border-radius: var(--app-radius-xs); font-size: 12px; color: var(--app-danger); margin-bottom: var(--app-space-3); line-height: 1.5; }
.ec-review-banner svg { flex-shrink: 0; margin-top: 1px; }
.ec-card-progress { display: flex; align-items: center; gap: var(--app-space-3); margin-bottom: var(--app-space-3); }
.ec-progress-bar { flex: 1; height: 6px; background: var(--app-border); border-radius: 3px; overflow: hidden; }
.ec-progress-bar--sm { height: 4px; }
.ec-progress-fill { height: 100%; background: var(--app-primary); border-radius: 3px; transition: width var(--app-transition-slow); }
.ec-progress-text { font-size: 12px; color: var(--app-text-muted); white-space: nowrap; }
.ec-card-footer { display: flex; justify-content: space-between; align-items: center; padding-top: var(--app-space-3); border-top: 1px solid var(--app-border-light); }
.ec-card-time { font-size: 12px; color: var(--app-text-muted); }
.ec-card-actions { display: flex; align-items: center; gap: 4px; }

/* Table View */
.ec-table-wrapper { border-radius: var(--app-radius-md); overflow: hidden; }
.ec-table-name { font-weight: 500; color: var(--app-text-primary); }
.ec-table-progress { display: flex; align-items: center; gap: var(--app-space-2); font-size: 12px; color: var(--app-text-secondary); }

/* Empty */
.ec-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--app-space-16); color: var(--app-text-muted); grid-column: 1 / -1; }
.ec-empty p { margin-top: var(--app-space-3); font-size: var(--app-font-body); }

/* Skeleton */
.ec-card--skeleton { cursor: default; pointer-events: none; }
.ec-card--skeleton:hover { border-color: var(--app-border); box-shadow: none; }
.ec-skel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--app-space-4); }
.ec-skel-body { display: flex; flex-direction: column; gap: var(--app-space-2); margin-bottom: var(--app-space-4); }
.ec-skel-footer { padding-top: var(--app-space-3); border-top: 1px solid var(--app-border-light); }
.ec-skel-tag { width: 50px; height: 20px; border-radius: var(--app-radius-xs); animation: ec-shimmer 1.5s ease-in-out infinite; background-size: 200% 100%; background-image: linear-gradient(90deg, var(--app-surface-hover) 0%, var(--app-border) 50%, var(--app-surface-hover) 100%); }
.ec-skel-line { height: 13px; border-radius: 6px; animation: ec-shimmer 1.5s ease-in-out infinite; background-size: 200% 100%; background-image: linear-gradient(90deg, var(--app-surface-hover) 0%, var(--app-border) 50%, var(--app-surface-hover) 100%); }
.ec-skel-line--title { width: 60%; height: 16px; }
.ec-skel-line--sm { width: 50%; }
.ec-skel-line--xs { width: 30%; height: 11px; }
@keyframes ec-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

@media (max-width:1199px) { .ec-stats { grid-template-columns: repeat(3, 1fr); } .ec-card-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); } .ec-search-input { width: 240px; } }
@media (max-width:768px) { .ec-stats { grid-template-columns: repeat(2, 1fr); } .ec-card-grid { grid-template-columns: 1fr; } .ec-search-input { width: 100%; } }
</style>
