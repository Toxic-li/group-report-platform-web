<template>
  <div class="dashboard">
    <!-- ===== 顶部欢迎区 ===== -->
    <section class="db-hero">
      <div class="db-hero-content">
        <div class="db-hero-greeting">
          <h1 class="db-hero-title">{{ greeting }}，{{ userName }}</h1>
          <p class="db-hero-desc">
            {{ currentDate }} · 今天有 <span class="db-hero-count">{{ pendingTasks }}</span> 项工作等待处理
          </p>
        </div>
        <button class="db-hero-action" @click="handleQuickStart">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          快速开始
        </button>
      </div>
    </section>

    <!-- ===== 任务概览 ===== -->
    <section class="db-section">
      <div class="db-section-header">
        <h2 class="db-section-title">任务概览</h2>
        <a href="/report-center" class="db-section-link">查看全部</a>
      </div>
      <div class="db-task-grid">
        <template v-if="loading">
          <div v-for="i in 4" :key="'task-sk-' + i" class="db-task-card db-skeleton-card">
            <div class="db-skeleton-icon"></div>
            <div class="db-skeleton-content">
              <div class="db-skeleton-line db-skeleton-line--lg"></div>
              <div class="db-skeleton-line db-skeleton-line--sm"></div>
            </div>
          </div>
        </template>
        <template v-else>
          <div
            v-for="task in visibleTasks"
            :key="task.key"
            class="db-task-card"
            :class="task.key"
            @click="navigateTo(task.path)"
          >
            <div class="db-task-icon">
              <component :is="task.icon" :size="20" />
            </div>
            <div class="db-task-content">
              <div class="db-task-value">{{ task.value }}</div>
              <div class="db-task-label">{{ task.label }}</div>
            </div>
            <div class="db-task-badge" v-if="task.badge">{{ task.badge }}</div>
          </div>
        </template>
      </div>
    </section>

    <!-- ===== Row 1: 我的报表 + 快捷入口 ===== -->
    <div class="db-row">
      <!-- 我的报表 -->
      <section class="db-section db-section-half">
        <div class="db-section-header">
          <h2 class="db-section-title">我的报表</h2>
          <a href="/report-center/my-filling" class="db-section-link">查看全部</a>
        </div>
        <div class="db-report-list">
          <template v-if="loading">
            <div v-for="i in 4" :key="'rpt-sk-' + i" class="db-report-item db-skeleton-item">
              <div class="db-skeleton-icon db-skeleton-icon--sm"></div>
              <div class="db-skeleton-content">
                <div class="db-skeleton-line db-skeleton-line--md"></div>
                <div class="db-skeleton-line db-skeleton-line--xs"></div>
              </div>
            </div>
          </template>
          <template v-else>
            <div v-for="report in myReports" :key="report.id" class="db-report-item" @click="openReport(report)">
              <div class="db-report-icon">
                <FileSpreadsheet :size="16" />
              </div>
              <div class="db-report-info">
                <div class="db-report-name">{{ report.name }}</div>
                <div class="db-report-meta">{{ report.updatedAt }}</div>
              </div>
              <div class="db-report-status" :class="getStatusClass(report.status)">{{ report.statusText }}</div>
            </div>
            <el-empty v-if="myReports.length === 0" description="暂无报表" :image-size="60" />
          </template>
        </div>
      </section>

      <!-- 快捷入口 -->
      <section class="db-section db-section-half">
        <div class="db-section-header">
          <h2 class="db-section-title">快捷入口</h2>
        </div>
        <div class="db-action-list">
          <template v-if="loading">
            <div v-for="i in 4" :key="'act-sk-' + i" class="db-action-item db-skeleton-item">
              <div class="db-skeleton-icon"></div>
              <div class="db-skeleton-content">
                <div class="db-skeleton-line db-skeleton-line--md"></div>
                <div class="db-skeleton-line db-skeleton-line--xs"></div>
              </div>
            </div>
          </template>
          <template v-else>
            <div
              v-for="action in quickActions"
              :key="action.key"
              class="db-action-item"
              @click="navigateTo(action.path)"
            >
              <div class="db-action-icon" :class="action.key">
                <component :is="getActionIcon(action.icon)" :size="20" />
              </div>
              <div class="db-action-content">
                <div class="db-action-title">{{ action.label }}</div>
                <div class="db-action-desc">{{ action.description }}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="db-action-arrow">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </template>
        </div>
      </section>
    </div>

    <!-- ===== Row 2: 最近使用 + 通知公告 ===== -->
    <div class="db-row">
      <!-- 最近使用 -->
      <section class="db-section db-section-half">
        <div class="db-section-header">
          <h2 class="db-section-title">最近使用</h2>
          <a href="/report-center" class="db-section-link">查看全部</a>
        </div>
        <div class="db-activity-list">
          <template v-if="loading">
            <div v-for="i in 4" :key="'act-sk-' + i" class="db-activity-item db-skeleton-item">
              <div class="db-skeleton-icon db-skeleton-icon--sm"></div>
              <div class="db-skeleton-content">
                <div class="db-skeleton-line db-skeleton-line--md"></div>
                <div class="db-skeleton-line db-skeleton-line--xs"></div>
              </div>
            </div>
          </template>
          <template v-else>
            <div v-for="activity in recentActivities" :key="activity.id" class="db-activity-item">
              <div class="db-activity-icon">{{ activity.icon }}</div>
              <div class="db-activity-content">
                <div class="db-activity-name">{{ activity.name }}</div>
                <div class="db-activity-time">{{ activity.time }}</div>
              </div>
            </div>
            <el-empty v-if="recentActivities.length === 0" description="暂无活动" :image-size="60" />
          </template>
        </div>
      </section>

      <!-- 通知公告 -->
      <section class="db-section db-section-half">
        <div class="db-section-header">
          <h2 class="db-section-title">通知公告</h2>
          <a href="/profile/messages" class="db-section-link">查看全部</a>
        </div>
        <div class="db-notification-list">
          <template v-if="loading">
            <div v-for="i in 3" :key="'ntf-sk-' + i" class="db-notification-item db-skeleton-item">
              <div class="db-skeleton-icon"></div>
              <div class="db-skeleton-content">
                <div class="db-skeleton-line db-skeleton-line--md"></div>
                <div class="db-skeleton-line db-skeleton-line--xs"></div>
              </div>
            </div>
          </template>
          <template v-else>
            <div v-for="notice in notifications" :key="notice.id" class="db-notification-item">
              <div class="db-notification-icon" :class="notice.type">
                <component :is="getNoticeIcon(notice.icon)" :size="16" />
              </div>
              <div class="db-notification-content">
                <div class="db-notification-title">{{ notice.title }}</div>
                <div class="db-notification-desc">{{ notice.description }}</div>
              </div>
              <div class="db-notification-time">{{ notice.time }}</div>
            </div>
            <el-empty v-if="notifications.length === 0" description="暂无通知" :image-size="60" />
          </template>
        </div>
      </section>
    </div>

    <!-- ===== 系统状态（管理员可见） ===== -->
    <section class="db-section" v-if="isAdmin && systemStatus">
      <div class="db-section-header">
        <h2 class="db-section-title">系统状态</h2>
      </div>
      <div class="db-status-grid">
        <div class="db-status-card">
          <div class="db-status-label">在线用户</div>
          <div class="db-status-value">{{ systemStatus.onlineUsers }}</div>
        </div>
        <div class="db-status-card">
          <div class="db-status-label">模板数量</div>
          <div class="db-status-value">{{ systemStatus.templateCount }}</div>
        </div>
        <div class="db-status-card">
          <div class="db-status-label">数据源</div>
          <div class="db-status-value">{{ systemStatus.dataSourceCount }}</div>
        </div>
        <div class="db-status-card">
          <div class="db-status-label">用户总数</div>
          <div class="db-status-value">{{ systemStatus.userCount }}</div>
        </div>
        <div class="db-status-card">
          <div class="db-status-label">今日提交</div>
          <div class="db-status-value">{{ systemStatus.todaySubmissions }}</div>
        </div>
        <div class="db-status-card">
          <div class="db-status-label">今日审核</div>
          <div class="db-status-value">{{ systemStatus.todayApprovals }}</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import {
  FileSpreadsheet, FileEdit, FileCheck, CheckCircle, Circle,
  PlusCircle, PenTool, Eye, BarChart3, AlertCircle, Bell, Info
} from 'lucide-vue-next'
import { getDashboardData } from '@/api/dashboard'

const router = useRouter()

const loading = ref(true)
const userName = ref('用户')
const systemStatus = ref<any>(null)
const userRole = ref<string>('filler') // filler | auditor | admin

const isAdmin = computed(() => userRole.value === 'admin')
const isAuditor = computed(() => userRole.value === 'auditor')

// 当前日期格式化
const currentDate = computed(() => {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  const d = now.getDate()
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  const w = weekDays[now.getDay()]
  return `${y}年${m}月${d}日 星期${w}`
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

// ===== 任务概览（会根据角色排序） =====
const taskOverview = ref([
  { key: 'pendingFill', label: '待填报', value: 0, badge: '', icon: markRaw(FileEdit), path: '/entry' },
  { key: 'pendingApproval', label: '待审核', value: 0, badge: '', icon: markRaw(FileCheck), path: '/audit' },
  { key: 'pendingProcess', label: '待处理', value: 0, badge: '', icon: markRaw(Circle), path: '/' },
  { key: 'completed', label: '已完成', value: 0, badge: '', icon: markRaw(CheckCircle), path: '/' },
])

// 角色差异化：审核人员优先显示待审核，填报人员优先显示待填报
const visibleTasks = computed(() => {
  const tasks = [...taskOverview.value]
  if (isAuditor.value) {
    // 审核人员：待审核优先
    const idx = tasks.findIndex(t => t.key === 'pendingApproval')
    if (idx > 0) {
      const [item] = tasks.splice(idx, 1)
      tasks.unshift(item)
    }
  }
  return tasks
})

const pendingTasks = computed(() => {
  return taskOverview.value.slice(0, 3).reduce((sum, t) => sum + (t.value || 0), 0)
})

// ===== 快捷入口 =====
const quickActions = ref([
  { key: 'create', label: '创建报表', description: '新建报表模板', icon: 'PlusCircle', path: '/designer' },
  { key: 'fill', label: '开始填报', description: '填写报表数据', icon: 'PenTool', path: '/entry' },
  { key: 'audit', label: '进入审核', description: '审核待办报表', icon: 'Eye', path: '/audit' },
  { key: 'analyze', label: '数据查询', description: '数据分析与导出', icon: 'BarChart3', path: '/analytics' },
])

// ===== 数据列表 =====
const myReports = ref<any[]>([])
const recentActivities = ref<any[]>([])
const notifications = ref<any[]>([])

const iconMap: Record<string, any> = {
  PlusCircle: markRaw(PlusCircle),
  PenTool: markRaw(PenTool),
  Eye: markRaw(Eye),
  BarChart3: markRaw(BarChart3),
  Bell: markRaw(Bell),
  AlertCircle: markRaw(AlertCircle),
  Info: markRaw(Info),
}

function getActionIcon(iconName: string) {
  return iconMap[iconName] || PlusCircle
}

function getNoticeIcon(iconName: string) {
  return iconMap[iconName] || Bell
}

function getStatusClass(status: number | string) {
  const map: Record<string, string> = {
    0: 'filling', 1: 'pending', 2: 'completed', 3: 'rejected', 4: 'withdrawn',
    filling: 'filling', pending: 'pending', completed: 'completed', rejected: 'rejected',
  }
  return map[status] || 'filling'
}

function navigateTo(path: string) {
  if (!path || path === '/') return
  router.push(path)
}

function openReport(report: any) {
  if (report.path) {
    router.push(report.path)
  } else if (report.templateId) {
    router.push('/report/' + report.templateId)
  }
}

function handleQuickStart() {
  const pending = taskOverview.value.find(t => t.key === 'pendingFill')
  if (pending && (pending.value || 0) > 0) {
    router.push('/entry')
  } else {
    router.push('/designer')
  }
}

// ===== 数据加载 =====
async function loadDashboardData() {
  loading.value = true
  try {
    const data: any = await getDashboardData()
    if (data) {
      taskOverview.value = [
        { key: 'pendingFill', label: '待填报', value: data.pendingFill || 0, badge: data.todayDeadline ? `今日截止${data.todayDeadline}项` : '', icon: markRaw(FileEdit), path: '/entry' },
        { key: 'pendingApproval', label: '待审核', value: data.pendingApproval || 0, badge: '', icon: markRaw(FileCheck), path: '/audit' },
        { key: 'pendingProcess', label: '待处理', value: data.pendingProcess || 0, badge: '', icon: markRaw(Circle), path: '/' },
        { key: 'completed', label: '已完成', value: data.completed || 100, badge: '', icon: markRaw(CheckCircle), path: '/' },
      ]
      if (data.myReports?.length) myReports.value = data.myReports
      if (data.recentActivities?.length) recentActivities.value = data.recentActivities
      if (data.notices?.length) notifications.value = data.notices
      if (data.quickActions?.length) quickActions.value = data.quickActions
      if (data.systemStatus) systemStatus.value = data.systemStatus
    }
  } catch (err: any) {
    console.warn('[Dashboard] 加载数据失败，使用本地数据:', err?.message)
    loadMockData()
  } finally {
    loading.value = false
  }
}

function loadMockData() {
  taskOverview.value = [
    { key: 'pendingFill', label: '待填报', value: 12, badge: '今日截止3项', icon: markRaw(FileEdit), path: '/entry' },
    { key: 'pendingApproval', label: '待审核', value: 6, badge: '', icon: markRaw(FileCheck), path: '/audit' },
    { key: 'pendingProcess', label: '待处理', value: 2, badge: '', icon: markRaw(Circle), path: '/' },
    { key: 'completed', label: '已完成', value: 82, badge: '', icon: markRaw(CheckCircle), path: '/' },
  ]

  myReports.value = [
    { id: 1, name: '销售月报', updatedAt: '今天 10:30', status: 0, statusText: '填报中', templateId: 1 },
    { id: 2, name: '采购周报', updatedAt: '今天 09:15', status: 1, statusText: '待审核', templateId: 2 },
    { id: 3, name: '财务汇总', updatedAt: '昨天 16:45', status: 2, statusText: '已完成', templateId: 3 },
    { id: 4, name: '库存盘点', updatedAt: '昨天 14:20', status: 3, statusText: '已退回', templateId: 4 },
  ]

  recentActivities.value = [
    { id: 1, name: '打开销售日报', time: '10分钟前', icon: '📈' },
    { id: 2, name: '提交采购月报', time: '1小时前', icon: '🛒' },
    { id: 3, name: '审核财务报表', time: '3小时前', icon: '💰' },
    { id: 4, name: '创建新报表模板', time: '昨天', icon: '📋' },
  ]

  notifications.value = [
    { id: 1, type: 'system', title: '系统升级通知', description: '系统将于今晚22:00-00:00进行例行维护升级', time: '10分钟前', icon: 'Bell' },
    { id: 2, type: 'business', title: '审批提醒', description: '您有6条待审核报表，请及时处理', time: '30分钟前', icon: 'AlertCircle' },
    { id: 3, type: 'info', title: '模板更新通知', description: '销售月报模板已更新至v2.0版本', time: '1小时前', icon: 'Info' },
  ]

  systemStatus.value = {
    onlineUsers: 128,
    templateCount: 56,
    dataSourceCount: 12,
    userCount: 450,
    todaySubmissions: 89,
    todayApprovals: 67,
  }
}

// ===== 初始化 =====
function initUser() {
  const userStr = sessionStorage.getItem('rpt_user') || localStorage.getItem('rpt_user')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      userName.value = user.name || user.username || '用户'
      // 角色识别
      if (user.roles?.includes('admin') || user.role === 'admin') {
        userRole.value = 'admin'
      } else if (user.roles?.includes('auditor') || user.role === 'auditor') {
        userRole.value = 'auditor'
      } else {
        userRole.value = 'filler'
      }
    } catch {
      // ignore
    }
  }
}

onMounted(() => {
  initUser()
  loadDashboardData()
})
</script>

<style lang="scss" scoped>
.dashboard {
  padding: 24px;
  max-width: 1440px;
  margin: 0 auto;

  // ===== Hero =====
  .db-hero {
    position: relative;
    margin-bottom: 24px;
    padding: 32px;
    height: 120px;
    background: linear-gradient(135deg, var(--app-primary) 0%, var(--app-info) 100%);
    border-radius: 16px;
    overflow: hidden;
    box-sizing: border-box;
    display: flex;
    align-items: center;
  }

  .db-hero-content {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .db-hero-greeting {
    color: #fff;
  }

  .db-hero-title {
    font-size: 32px;
    font-weight: 600;
    margin: 0 0 8px 0;
    line-height: 1.2;
  }

  .db-hero-desc {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.85);
    margin: 0;
  }

  .db-hero-count {
    font-weight: 700;
    font-size: 18px;
    color: #fff;
    margin: 0 4px;
  }

  .db-hero-action {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 24px;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 10px;
    color: #fff;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all var(--app-transition);

    &:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
    }
  }

  // ===== Sections =====
  .db-section {
    margin-bottom: 20px;
  }

  .db-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .db-section-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--app-text-primary);
    margin: 0;
  }

  .db-section-link {
    font-size: 13px;
    color: var(--app-primary);
    text-decoration: none;
    transition: color var(--app-transition);

    &:hover {
      color: var(--app-primary-hover);
    }
  }

  .db-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .db-section-half {
    margin-bottom: 0;
  }

  // ===== Task Cards =====
  .db-task-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }

  .db-task-card {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 120px;
    padding: 24px;
    background: var(--app-surface);
    border-radius: 16px;
    border: 1px solid var(--app-border);
    cursor: pointer;
    box-sizing: border-box;
    transition: all var(--app-transition);

    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--app-shadow-md);
    }

    &.pendingFill {
      .db-task-icon { background: rgba(22, 119, 255, 0.1); color: var(--app-primary); }
    }

    &.pendingApproval {
      .db-task-icon { background: rgba(255, 176, 32, 0.1); color: var(--app-warning); }
    }

    &.pendingProcess {
      .db-task-icon { background: rgba(24, 200, 255, 0.1); color: var(--app-info); }
    }

    &.completed {
      .db-task-icon { background: rgba(0, 181, 120, 0.1); color: var(--app-success); }
    }
  }

  .db-task-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .db-task-content {
    flex: 1;
    overflow: hidden;
  }

  .db-task-value {
    font-size: 28px;
    font-weight: 700;
    color: var(--app-text-primary);
    line-height: 1.2;
  }

  .db-task-label {
    font-size: 14px;
    color: var(--app-text-secondary);
    margin-top: 4px;
  }

  .db-task-badge {
    font-size: 11px;
    padding: 4px 10px;
    background: rgba(240, 68, 56, 0.1);
    color: var(--app-danger);
    border-radius: 4px;
    flex-shrink: 0;
    white-space: nowrap;
  }

  // ===== Quick Actions (list style for half-column) =====
  .db-action-list {
    background: var(--app-surface);
    border-radius: 16px;
    border: 1px solid var(--app-border);
    overflow: hidden;
  }

  .db-action-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--app-border-light);
    cursor: pointer;
    transition: background var(--app-transition-fast);

    &:hover {
      background: var(--app-surface-hover);

      .db-action-arrow {
        opacity: 1;
        transform: translateX(0);
      }
    }

    &:last-child {
      border-bottom: none;
    }
  }

  .db-action-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &.create { background: rgba(22, 119, 255, 0.1); color: var(--app-primary); }
    &.fill { background: rgba(255, 176, 32, 0.1); color: var(--app-warning); }
    &.audit { background: rgba(0, 181, 120, 0.1); color: var(--app-success); }
    &.analyze { background: rgba(24, 200, 255, 0.1); color: var(--app-info); }
  }

  .db-action-content {
    flex: 1;
    overflow: hidden;
  }

  .db-action-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--app-text-primary);
  }

  .db-action-desc {
    font-size: 12px;
    color: var(--app-text-muted);
    margin-top: 2px;
  }

  .db-action-arrow {
    color: var(--app-text-muted);
    flex-shrink: 0;
    opacity: 0;
    transform: translateX(-4px);
    transition: all var(--app-transition-fast);
  }

  // ===== Report List =====
  .db-report-list {
    background: var(--app-surface);
    border-radius: 16px;
    border: 1px solid var(--app-border);
    overflow: hidden;
  }

  .db-report-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--app-border-light);
    cursor: pointer;
    transition: background var(--app-transition-fast);

    &:hover {
      background: var(--app-surface-hover);
    }

    &:last-child {
      border-bottom: none;
    }
  }

  .db-report-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: rgba(22, 119, 255, 0.08);
    color: var(--app-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .db-report-info {
    flex: 1;
    overflow: hidden;
  }

  .db-report-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--app-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .db-report-meta {
    font-size: 12px;
    color: var(--app-text-muted);
    margin-top: 2px;
  }

  .db-report-status {
    font-size: 12px;
    padding: 4px 12px;
    border-radius: 4px;
    font-weight: 500;

    &.filling { background: rgba(22, 119, 255, 0.1); color: var(--app-primary); }
    &.pending { background: rgba(255, 176, 32, 0.1); color: var(--app-warning); }
    &.completed { background: rgba(0, 181, 120, 0.1); color: var(--app-success); }
    &.rejected { background: rgba(240, 68, 56, 0.1); color: var(--app-danger); }
  }

  // ===== Activity List =====
  .db-activity-list {
    background: var(--app-surface);
    border-radius: 16px;
    border: 1px solid var(--app-border);
    overflow: hidden;
  }

  .db-activity-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--app-border-light);
    cursor: pointer;
    transition: background var(--app-transition-fast);

    &:hover {
      background: var(--app-surface-hover);
    }

    &:last-child {
      border-bottom: none;
    }
  }

  .db-activity-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: var(--app-surface-hover);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
  }

  .db-activity-content {
    flex: 1;
    overflow: hidden;
  }

  .db-activity-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--app-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .db-activity-time {
    font-size: 12px;
    color: var(--app-text-muted);
    margin-top: 2px;
  }

  // ===== Notification List =====
  .db-notification-list {
    background: var(--app-surface);
    border-radius: 16px;
    border: 1px solid var(--app-border);
    overflow: hidden;
  }

  .db-notification-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--app-border-light);
    cursor: pointer;
    transition: background var(--app-transition-fast);

    &:hover {
      background: var(--app-surface-hover);
    }

    &:last-child {
      border-bottom: none;
    }
  }

  .db-notification-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &.system { background: rgba(22, 119, 255, 0.1); color: var(--app-primary); }
    &.business { background: rgba(255, 176, 32, 0.1); color: var(--app-warning); }
    &.info { background: rgba(24, 200, 255, 0.1); color: var(--app-info); }
  }

  .db-notification-content {
    flex: 1;
    overflow: hidden;
  }

  .db-notification-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--app-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .db-notification-desc {
    font-size: 12px;
    color: var(--app-text-secondary);
    margin-top: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .db-notification-time {
    font-size: 12px;
    color: var(--app-text-muted);
    flex-shrink: 0;
  }

  // ===== System Status =====
  .db-status-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 12px;
  }

  .db-status-card {
    padding: 20px;
    background: var(--app-surface);
    border-radius: 16px;
    border: 1px solid var(--app-border);
    text-align: center;
    transition: all var(--app-transition);

    &:hover {
      transform: translateY(-1px);
      box-shadow: var(--app-shadow-sm);
    }
  }

  .db-status-label {
    font-size: 13px;
    color: var(--app-text-secondary);
    margin-bottom: 8px;
  }

  .db-status-value {
    font-size: 24px;
    font-weight: 700;
    color: var(--app-text-primary);
  }

  // ===== Skeleton Loading =====
  .db-skeleton-card {
    cursor: default;
    pointer-events: none;

    &:hover {
      transform: none;
      box-shadow: none;
    }
  }

  .db-skeleton-item {
    cursor: default;
    pointer-events: none;

    &:hover {
      background: transparent;
    }
  }

  .db-skeleton-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: var(--app-surface-hover);
    flex-shrink: 0;
    animation: db-shimmer 1.5s ease-in-out infinite;
    background-size: 200% 100%;
    background-image: linear-gradient(90deg, var(--app-surface-hover) 0%, var(--app-border) 50%, var(--app-surface-hover) 100%);

    &--sm {
      width: 36px;
      height: 36px;
      border-radius: 8px;
    }
  }

  .db-skeleton-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .db-skeleton-line {
    height: 14px;
    border-radius: 6px;
    animation: db-shimmer 1.5s ease-in-out infinite;
    background-size: 200% 100%;
    background-image: linear-gradient(90deg, var(--app-surface-hover) 0%, var(--app-border) 50%, var(--app-surface-hover) 100%);

    &--lg { height: 28px; width: 60px; }
    &--md { height: 14px; width: 80%; }
    &--sm { height: 14px; width: 40px; }
    &--xs { height: 12px; width: 50%; }
  }

  @keyframes db-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  // ===== Responsive =====
  @media (max-width: 1200px) {
    .db-task-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    .db-status-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (max-width: 768px) {
    padding: 16px;

    .db-hero {
      height: auto;
      padding: 24px;
    }

    .db-hero-content {
      flex-direction: column;
      gap: 16px;
      align-items: flex-start;
    }

    .db-hero-title {
      font-size: 24px;
    }

    .db-task-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .db-row {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .db-status-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}
</style>
