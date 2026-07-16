<template>
  <div class="monitor-page">
    <!-- ===== Page Header ===== -->
    <div class="mp-header">
      <div class="mp-header-left">
        <h1 class="mp-title">填报进度监控</h1>
        <p class="mp-desc">查看各下级单位的填报进度，及时掌握整体填报情况</p>
      </div>
      <div class="mp-header-right">
        <button class="mp-btn mp-btn--ghost" @click="loadData">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
          刷新
        </button>
      </div>
    </div>

    <!-- ===== Summary Cards ===== -->
    <div class="mp-summary" v-if="!loading">
      <div class="mp-summary-card">
        <div class="mp-summary-value">{{ summary.subordinateCount }}</div>
        <div class="mp-summary-label">下级单位</div>
      </div>
      <div class="mp-summary-card">
        <div class="mp-summary-value">{{ summary.totalTasks }}</div>
        <div class="mp-summary-label">总任务数</div>
      </div>
      <div class="mp-summary-card mp-summary--draft">
        <div class="mp-summary-value">{{ summary.draftCount }}</div>
        <div class="mp-summary-label">草稿</div>
      </div>
      <div class="mp-summary-card mp-summary--submitted">
        <div class="mp-summary-value">{{ summary.submittedCount }}</div>
        <div class="mp-summary-label">审核中</div>
      </div>
      <div class="mp-summary-card mp-summary--approved">
        <div class="mp-summary-value">{{ summary.approvedCount }}</div>
        <div class="mp-summary-label">已通过</div>
      </div>
      <div class="mp-summary-card mp-summary--rejected">
        <div class="mp-summary-value">{{ summary.rejectedCount }}</div>
        <div class="mp-summary-label">已退回</div>
      </div>
      <div class="mp-summary-card mp-summary--rate">
        <div class="mp-summary-value">{{ summary.completionRate }}%</div>
        <div class="mp-summary-label">整体完成率</div>
      </div>
    </div>
    <div class="mp-summary mp-summary--skeleton" v-else>
      <div v-for="i in 7" :key="'ss-'+i" class="mp-summary-card">
        <div class="mp-skeleton-line mp-skeleton-line--lg"></div>
        <div class="mp-skeleton-line mp-skeleton-line--xs"></div>
      </div>
    </div>

    <!-- ===== Org Progress Table ===== -->
    <div class="mp-content-card">
      <div class="mp-filter-bar">
        <el-select v-model="filterTemplateId" placeholder="选择报表模板" style="width: 200px" clearable filterable size="default">
          <el-option v-for="t in templates" :key="t.id" :label="t.name" :value="t.id" />
        </el-select>
        <el-input v-model="filterPeriod" placeholder="填报周期（如：2026-07）" style="width: 180px" clearable size="default" @keyup.enter="loadData" />
        <el-button type="primary" size="default" @click="loadData">查询</el-button>
        <el-button size="default" plain @click="resetFilter">重置</el-button>
      </div>

      <!-- Table -->
      <div class="mp-table-wrap" v-if="!loading">
        <table class="mp-table" v-if="progressList.length > 0">
          <thead>
            <tr>
              <th style="width:50px">#</th>
              <th>单位名称</th>
              <th style="width:80px">层级</th>
              <th style="width:80px">总任务</th>
              <th style="width:70px">草稿</th>
              <th style="width:70px">审核中</th>
              <th style="width:70px">已通过</th>
              <th style="width:70px">已退回</th>
              <th style="width:180px">完成率</th>
              <th style="width:90px">状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in progressList" :key="item.orgId" class="mp-row" @click="viewOrgDetail(item)">
              <td class="mp-cell-idx">{{ idx + 1 }}</td>
              <td class="mp-cell-name">
                <span class="mp-org-name">{{ item.orgName }}</span>
                <span class="mp-org-code">{{ item.orgCode }}</span>
              </td>
              <td>
                <span class="mp-level-tag">L{{ item.level || '-' }}</span>
              </td>
              <td class="mp-cell-num">{{ item.totalTasks }}</td>
              <td class="mp-cell-num mp-cell--draft">{{ item.draftCount }}</td>
              <td class="mp-cell-num mp-cell--submitted">{{ item.submittedCount }}</td>
              <td class="mp-cell-num mp-cell--approved">{{ item.approvedCount }}</td>
              <td class="mp-cell-num mp-cell--rejected">{{ item.rejectedCount }}</td>
              <td>
                <div class="mp-progress-wrap">
                  <div class="mp-progress-bar">
                    <div class="mp-progress-fill" :style="{ width: item.completionRate + '%' }" :class="progressClass(item)"></div>
                  </div>
                  <span class="mp-progress-text">{{ item.completionRate }}%</span>
                </div>
              </td>
              <td>
                <span :class="['mp-status-tag', 'mp-status--' + item.status]">{{ statusText(item.status) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="mp-empty">
          <div class="mp-empty-icon">
            <svg width="64" height="64" viewBox="0 0 80 80" fill="none">
              <rect x="12" y="8" width="56" height="64" rx="6" stroke="var(--app-text-muted)" stroke-width="2" fill="var(--app-bg)"/>
              <rect x="20" y="16" width="40" height="20" rx="2" stroke="var(--app-border-dark)" stroke-width="1.5" fill="none"/>
              <line x1="24" y1="22" x2="46" y2="22" stroke="var(--app-border-dark)" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="24" y1="28" x2="40" y2="28" stroke="var(--app-border-dark)" stroke-width="1.5" stroke-linecap="round"/>
              <rect x="20" y="42" width="40" height="2" rx="1" fill="var(--app-border-dark)"/>
              <rect x="20" y="48" width="30" height="2" rx="1" fill="var(--app-border-dark)"/>
              <rect x="20" y="54" width="35" height="2" rx="1" fill="var(--app-border-dark)"/>
              <circle cx="56" cy="52" r="14" fill="var(--app-surface)" stroke="var(--app-primary)" stroke-width="2"/>
              <path d="M50 52l4 4 8-8" stroke="var(--app-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <p class="mp-empty-title">暂无下级单位数据</p>
          <p class="mp-empty-desc">当前组织没有下级单位，或下级单位暂无填报数据</p>
        </div>
      </div>
      <div class="mp-table-wrap mp-table-wrap--skeleton" v-else>
        <table class="mp-table">
          <thead>
            <tr>
              <th style="width:50px">#</th><th>单位名称</th><th style="width:80px">层级</th>
              <th style="width:80px">总任务</th><th style="width:70px">草稿</th><th style="width:70px">审核中</th>
              <th style="width:70px">已通过</th><th style="width:70px">已退回</th>
              <th style="width:180px">完成率</th><th style="width:90px">状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="i in 5" :key="'sk-'+i" class="mp-row">
              <td><div class="mp-skeleton-line mp-skeleton-line--sm" style="width:20px"></div></td>
              <td>
                <div class="mp-skeleton-line" style="width:100px;margin-bottom:4px"></div>
                <div class="mp-skeleton-line mp-skeleton-line--xs" style="width:60px"></div>
              </td>
              <td><div class="mp-skeleton-line mp-skeleton-line--sm" style="width:30px"></div></td>
              <td v-for="j in 5" :key="'skc-'+j"><div class="mp-skeleton-line mp-skeleton-line--sm" style="width:30px"></div></td>
              <td><div class="mp-skeleton-line" style="width:100%"></div></td>
              <td><div class="mp-skeleton-line mp-skeleton-line--sm" style="width:50px"></div></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAggregation } from '@/api/monitor'
import { ElMessage } from 'element-plus'

const router = useRouter()

const loading = ref(false)
const filterTemplateId = ref(null)
const filterPeriod = ref('')
const templates = ref([])

const summary = ref({
  subordinateCount: 0, totalTasks: 0, draftCount: 0,
  submittedCount: 0, approvedCount: 0, rejectedCount: 0, completionRate: 0
})
const progressList = ref([])

function statusText(s) {
  const map = { not_started: '未开始', in_progress: '进行中', completed: '已完成' }
  return map[s] || s
}

function progressClass(item) {
  if (item.completionRate >= 80) return 'mp-progress-fill--high'
  if (item.completionRate >= 40) return 'mp-progress-fill--mid'
  return 'mp-progress-fill--low'
}

function viewOrgDetail(item) {
  // 可以跳转到该组织的填报详情
}

function resetFilter() {
  filterTemplateId.value = null
  filterPeriod.value = ''
  loadData()
}

async function loadData() {
  loading.value = true
  try {
    const params = {}
    if (filterTemplateId.value) params.templateId = filterTemplateId.value
    if (filterPeriod.value) params.period = filterPeriod.value
    const data = await getAggregation(params)
    if (data) {
      summary.value = {
        subordinateCount: data.subordinateCount || 0,
        totalTasks: data.totalTasks || 0,
        draftCount: data.draftCount || 0,
        submittedCount: data.submittedCount || 0,
        approvedCount: data.approvedCount || 0,
        rejectedCount: data.rejectedCount || 0,
        completionRate: data.completionRate || 0
      }
      progressList.value = data.progressList || []
    }
  } catch (err) {
    ElMessage.error('加载监控数据失败：' + (err?.message || '请稍后重试'))
    progressList.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => loadData())
</script>

<style scoped>
.monitor-page { padding: var(--app-content-padding); min-height: calc(100vh - 100px); }

/* Page Header */
.mp-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.mp-header-left .mp-title { font-size: 20px; font-weight: 600; color: var(--app-text-primary); margin: 0; }
.mp-header-left .mp-desc { font-size: 13px; color: var(--app-text-muted); margin: 4px 0 0; }
.mp-header-right { display: flex; gap: 8px; }

/* Buttons */
.mp-btn { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 16px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid var(--app-border); background: var(--app-surface); color: var(--app-text-primary); transition: all 0.2s; white-space: nowrap; }
.mp-btn:hover { background: var(--app-surface-hover); }
.mp-btn--primary { background: var(--app-primary); color: #fff; border-color: var(--app-primary); }
.mp-btn--primary:hover { background: var(--app-primary-hover); }
.mp-btn--ghost { background: transparent; border-color: transparent; color: var(--app-text-secondary); }
.mp-btn--ghost:hover { background: var(--app-surface-hover); color: var(--app-primary); }

/* Summary Cards */
.mp-summary { display: grid; grid-template-columns: repeat(7, 1fr); gap: 12px; margin-bottom: 20px; }
.mp-summary-card { padding: 16px; background: var(--app-surface); border: 1px solid var(--app-border); border-radius: 12px; text-align: center; transition: all 0.2s; }
.mp-summary-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(15,23,42,0.06); }
.mp-summary-value { font-size: 24px; font-weight: 700; color: var(--app-text-primary); line-height: 1.2; }
.mp-summary-label { font-size: 12px; color: var(--app-text-muted); margin-top: 4px; }
.mp-summary--draft .mp-summary-value { color: #94a3b8; }
.mp-summary--submitted .mp-summary-value { color: var(--app-primary); }
.mp-summary--approved .mp-summary-value { color: var(--app-success); }
.mp-summary--rejected .mp-summary-value { color: var(--app-danger); }
.mp-summary--rate .mp-summary-value { color: #14B8A6; }

/* Content Card */
.mp-content-card { background: var(--app-surface); border-radius: 12px; border: 1px solid var(--app-border); overflow: hidden; padding: 20px; }

/* Filter Bar */
.mp-filter-bar { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }

/* Table */
.mp-table-wrap { overflow-x: auto; }
.mp-table { width: 100%; border-collapse: collapse; }
.mp-table th { padding: 12px 14px; text-align: left; font-size: 12px; font-weight: 600; color: var(--app-text-muted); border-bottom: 1px solid var(--app-border); background: var(--app-bg); white-space: nowrap; }
.mp-table td { padding: 14px 14px; font-size: 13px; border-bottom: 1px solid var(--app-border-light); vertical-align: middle; }
.mp-row { transition: background 0.15s; cursor: pointer; }
.mp-row:hover { background: var(--app-surface-hover); }
.mp-row:last-child td { border-bottom: none; }

.mp-cell-idx { color: var(--app-text-muted); font-size: 12px; }
.mp-cell-name { display: flex; flex-direction: column; gap: 2px; }
.mp-org-name { font-weight: 600; color: var(--app-text-primary); }
.mp-org-code { font-size: 11px; color: var(--app-text-muted); }
.mp-level-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; background: var(--app-primary-bg); color: var(--app-primary); font-size: 11px; font-weight: 500; }
.mp-cell-num { font-weight: 600; font-family: var(--app-font-family-number); }
.mp-cell--draft { color: #94a3b8; }
.mp-cell--submitted { color: var(--app-primary); }
.mp-cell--approved { color: var(--app-success); }
.mp-cell--rejected { color: var(--app-danger); }

/* Progress */
.mp-progress-wrap { display: flex; align-items: center; gap: 8px; }
.mp-progress-bar { flex: 1; height: 8px; background: var(--app-border); border-radius: 4px; overflow: hidden; }
.mp-progress-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
.mp-progress-fill--low { background: var(--app-danger); }
.mp-progress-fill--mid { background: var(--app-warning); }
.mp-progress-fill--high { background: var(--app-success); }
.mp-progress-text { font-size: 12px; font-weight: 500; color: var(--app-text-secondary); white-space: nowrap; min-width: 40px; text-align: right; }

/* Status Tags */
.mp-status-tag { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 12px; font-weight: 500; }
.mp-status--not_started { background: rgba(148,163,184,0.1); color: #94a3b8; }
.mp-status--in_progress { background: var(--app-primary-bg); color: var(--app-primary); }
.mp-status--completed { background: var(--app-success-bg); color: var(--app-success); }

/* Empty */
.mp-empty { display: flex; flex-direction: column; align-items: center; padding: 60px 20px; color: var(--app-text-muted); }
.mp-empty-icon { margin-bottom: 16px; opacity: 0.8; }
.mp-empty-title { margin: 0 0 8px; font-size: 15px; font-weight: 600; color: var(--app-text-secondary); }
.mp-empty-desc { margin: 0; font-size: 13px; }

/* Skeleton */
.mp-skeleton-line {
  height: 14px; border-radius: 6px;
  animation: mp-shimmer 1.5s ease-in-out infinite;
  background-size: 200% 100%;
  background-image: linear-gradient(90deg, var(--app-surface-hover) 0%, var(--app-border) 50%, var(--app-surface-hover) 100%);
  &--lg { height: 28px; width: 50px; margin: 0 auto; }
  &--sm { height: 14px; width: 40px; margin: 0 auto; }
  &--xs { height: 12px; width: 60%; }
}
@keyframes mp-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.mp-summary--skeleton .mp-summary-card { cursor: default; pointer-events: none; }

@media (max-width: 1200px) {
  .mp-summary { grid-template-columns: repeat(4, 1fr); }
}
@media (max-width: 768px) {
  .mp-summary { grid-template-columns: repeat(2, 1fr); }
}
</style>