<template>
  <div class="audit-center">
    <div class="app-page-inner">
    <!-- 页面标题 -->
    <div class="ac-page-header">
      <h2 class="ac-page-title">{{ currentPageTitle }}</h2>
      <p class="ac-page-desc">
        <template v-if="currentView === 'pending'">需要您处理的所有审核任务</template>
        <template v-else-if="currentView === 'approved'">历史已通过审核的提交</template>
        <template v-else-if="currentView === 'rejected'">已驳回待修改的提交</template>
        <template v-else-if="currentView === 'initiated'">您发起过的所有填报记录</template>
        <template v-else-if="currentView === 'history'">所有历史审核轨迹</template>
      </p>
    </div>

    <!-- 统计卡片 -->
    <div class="ac-stats">
      <div class="ac-stat-card ac-stat-pending">
        <div class="ac-stat-number">{{ stats.pending }}</div>
        <div class="ac-stat-label">待审核</div>
      </div>
      <div class="ac-stat-card ac-stat-today">
        <div class="ac-stat-number">{{ stats.todayCompleted }}</div>
        <div class="ac-stat-label">今日完成</div>
      </div>
      <div class="ac-stat-card ac-stat-rejected">
        <div class="ac-stat-number">{{ stats.rejected }}</div>
        <div class="ac-stat-label">退回</div>
      </div>
      <div class="ac-stat-card ac-stat-avg">
        <div class="ac-stat-number">{{ stats.avgAuditTime || '--' }}<span v-if="stats.avgAuditTime" class="ac-stat-unit">分钟</span></div>
        <div class="ac-stat-label">平均审核时间</div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="ac-toolbar">
      <div class="ac-filters">
        <input
          type="text"
          v-model="filters.keyword"
          placeholder="搜索模板名称/提交人..."
          class="ac-input"
          @keyup.enter="loadSubmissions"
        />
        <select v-model="filters.dateRange" class="ac-select" @change="loadSubmissions">
          <option value="">全部时间</option>
          <option value="today">今天</option>
          <option value="week">近一周</option>
          <option value="month">近一个月</option>
          <option value="quarter">近一季度</option>
        </select>

        <button class="ac-btn ac-btn-primary" @click="loadSubmissions" :disabled="loading">
          查询
        </button>
      </div>

      <button class="ac-btn ac-btn-secondary" @click="refreshData" :disabled="loading">
        {{ loading ? '加载中...' : '刷新' }}
      </button>
    </div>

    <!-- 批量操作栏 -->
    <div v-if="selectedIds.length > 0" class="ac-batch-bar">
      <span class="ac-batch-info">已选择 {{ selectedIds.length }} 项</span>
      <div class="ac-batch-actions">
        <button class="ac-btn ac-btn-primary" @click="batchApprove" :disabled="batchSubmitting">
          ✓ 批量通过
        </button>
        <button class="ac-btn ac-btn-danger" @click="batchReject" :disabled="batchSubmitting">
          ✕ 批量驳回
        </button>
        <button class="ac-btn ac-btn-secondary" @click="clearSelection">
          取消选择
        </button>
      </div>
    </div>

    <!-- 提交列表 -->
    <div class="ac-table-wrapper">
      <table class="ac-table" v-if="submissions.length > 0">
        <thead>
          <tr>
            <th class="ac-col-check">
              <input 
                type="checkbox" 
                :checked="isAllSelected"
                @change="toggleSelectAll"
                :disabled="pendingItems.length === 0"
              />
            </th>
            <th>序号</th>
            <th>模板名称</th>
            <th>组织</th>
            <th>周期</th>
            <th>截止时间</th>
            <th>提交人</th>
            <th>提交时间</th>
            <th>审核人/时间</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
            <tr v-for="(item, index) in submissions" :key="item.id" :class="'ac-row-' + normalizeStatus(item.status)">
            <td class="ac-col-check">
              <input 
                v-if="normalizeStatus(item.status) === 'pending'"
                type="checkbox" 
                :value="item.id"
                v-model="selectedIds"
              />
            </td>
            <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td class="ac-td-name">{{ item.templateName || '-' }}</td>
            <td>{{ item.orgName || '-' }}</td>
            <td>{{ item.period || '-' }}</td>
            <td>
              <span :class="{ 'ac-deadline-urgent': isDeadlineUrgent(item.deadline) }">
                {{ formatTime(item.deadline) || '-' }}
              </span>
            </td>
            <td>{{ item.submitterName || '-' }}</td>
            <td>{{ formatTime(item.submitTime) }}</td>
            <td>
              <div class="ac-audit-info">
                <span v-if="item.auditorName" class="ac-auditor">{{ item.auditorName }}</span>
                <span v-if="item.auditTime" class="ac-audit-time">{{ formatTime(item.auditTime) }}</span>
                <span v-if="!item.auditorName && !item.auditTime" class="ac-audit-empty">-</span>
              </div>
            </td>
            <td>
              <span :class="'ac-status ac-status-' + normalizeStatus(item.status)">
                {{ statusText(item.status) }}
              </span>
            </td>
            <td class="ac-actions">
              <!-- 待审核：显示通过/驳回按钮 -->
              <template v-if="normalizeStatus(item.status) === 'pending'">
                <button class="ac-action-btn ac-approve" @click="handleApprove(item)" title="审核通过">
                  ✓ 通过
                </button>
                <button class="ac-action-btn ac-reject" @click="showRejectDialog(item)" title="审核驳回">
                  ✕ 驳回
                </button>
                <button class="ac-action-btn ac-detail" @click="viewDetail(item)" title="查看详情">
                  详情
                </button>
                <button class="ac-action-btn ac-history" @click="viewAuditHistory(item)" title="审核轨迹">
                  轨迹
                </button>
              </template>
              
              <!-- 已通过/驳回：只显示详情 -->
              <template v-else>
                <button class="ac-action-btn ac-detail" @click="viewDetail(item)" title="查看详情">
                  详情
                </button>
                <button class="ac-action-btn ac-history" @click="viewAuditHistory(item)" title="审核轨迹">
                  轨迹
                </button>
                <!-- 已撤回：可重新提交 -->
                <button 
                  v-if="normalizeStatus(item.status) === 'withdrawn'" 
                  class="ac-action-btn ac-resubmit" 
                  @click="resubmit(item)"
                  title="重新提交"
                >
                  重提
                </button>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
      
      <!-- 空状态 -->
      <div v-else-if="!loading" class="ac-empty">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <rect x="8" y="12" width="64" height="56" rx="10" stroke="var(--app-text-muted)" stroke-width="2" fill="var(--app-bg)"/>
          <line x1="20" y1="28" x2="48" y2="28" stroke="var(--app-border-dark)" stroke-width="2" stroke-linecap="round"/>
          <line x1="20" y1="38" x2="56" y2="38" stroke="var(--app-border-dark)" stroke-width="2" stroke-linecap="round"/>
          <line x1="20" y1="48" x2="36" y2="48" stroke="var(--app-border-dark)" stroke-width="2" stroke-linecap="round"/>
          <circle cx="64" cy="56" r="16" fill="var(--app-surface)" stroke="var(--app-primary)" stroke-width="2"/>
          <path d="M58 56l4 4 8-8" stroke="var(--app-primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p class="ac-empty-title">暂无提交记录</p>
        <p class="ac-empty-desc">所有审核任务将在这里显示</p>
      </div>
      
      <!-- 骨架屏加载 -->
      <div v-if="loading" class="ac-table">
        <table>
          <thead><tr><th class="ac-col-check"></th><th></th><th></th><th></th><th></th><th></th><th></th><th></th><th></th><th></th><th></th></tr></thead>
          <tbody>
            <tr v-for="n in 5" :key="n" class="ac-skeleton-row">
              <td class="ac-col-check"><div class="ac-skeleton" style="width:16px;height:16px;border-radius:3px"></div></td>
              <td><div class="ac-skeleton" style="width:24px"></div></td>
              <td><div class="ac-skeleton" style="width:100px"></div></td>
              <td><div class="ac-skeleton" style="width:60px"></div></td>
              <td><div class="ac-skeleton" style="width:70px"></div></td>
              <td><div class="ac-skeleton" style="width:90px"></div></td>
              <td><div class="ac-skeleton" style="width:50px"></div></td>
              <td><div class="ac-skeleton" style="width:100px"></div></td>
              <td><div class="ac-skeleton" style="width:80px"></div></td>
              <td><div class="ac-skeleton" style="width:56px;border-radius:12px"></div></td>
              <td><div class="ac-skeleton" style="width:80px"></div></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 分页 -->
    <div class="ac-pagination" v-if="total > pageSize">
      <button 
        class="ac-page-btn" 
        :disabled="currentPage <= 1" 
        @click="changePage(currentPage - 1)"
      >上一页</button>
      
      <span class="ac-page-info">
        第 {{ currentPage }} / {{ totalPages }} 页（共 {{ total }} 条）
      </span>
      
      <button 
        class="ac-page-btn" 
        :disabled="currentPage >= totalPages" 
        @click="changePage(currentPage + 1)"
      >下一页</button>
    </div>

    <!-- 审核历史弹窗 -->
    <Teleport to="body">
      <div v-if="historyDialog.visible" class="ac-modal-overlay" @click.self="historyDialog.visible = false">
        <div class="ac-modal ac-modal-lg">
          <div class="ac-modal-header">
            <h3>审核轨迹</h3>
            <button class="ac-modal-close" @click="historyDialog.visible = false">&times;</button>
          </div>
          <div class="ac-modal-body">
            <!-- 加载中 -->
            <div v-if="historyDialog.loading" class="ac-loading">
              <div class="ac-spinner"></div>
              <p>正在加载审核历史...</p>
            </div>
            
            <!-- 空状态 -->
            <div v-else-if="historyDialog.logs.length === 0" class="ac-empty">
              <p>暂无审核轨迹记录</p>
            </div>
            
            <!-- 时间线 -->
            <div v-else class="ac-timeline">
              <div 
                v-for="(log, idx) in historyDialog.logs" 
                :key="idx" 
                class="ac-timeline-item"
                :class="'ac-timeline-' + normalizeStatus(log.action)"
              >
                <div class="ac-timeline-dot"></div>
                <div class="ac-timeline-content">
                  <div class="ac-timeline-header">
                    <span class="ac-timeline-action">{{ statusText(log.action) }}</span>
                    <span class="ac-timeline-time">{{ formatTime(log.createTime || log.auditTime) }}</span>
                  </div>
                  <div class="ac-timeline-body">
                    <p v-if="log.auditorName || log.operatorName" class="ac-timeline-operator">
                      操作人：{{ log.auditorName || log.operatorName }}
                    </p>
                    <p v-if="log.remark || log.reason" class="ac-timeline-remark">
                      备注：{{ log.remark || log.reason }}
                    </p>
                    <p v-if="log.comment" class="ac-timeline-comment">
                      {{ log.comment }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="ac-modal-footer">
            <button class="ac-btn ac-btn-primary" @click="historyDialog.visible = false">关闭</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 驳回原因弹窗 -->
    <Teleport to="body">
      <div v-if="rejectDialog.visible" class="ac-modal-overlay" @click.self="rejectDialog.visible = false">
        <div class="ac-modal">
          <div class="ac-modal-header">
            <h3>驳回审核</h3>
            <button class="ac-modal-close" @click="rejectDialog.visible = false">&times;</button>
          </div>
          <div class="ac-modal-body">
            <label class="ac-label">驳回原因 *</label>
            <div class="ac-quick-comments">
              <button 
                v-for="qc in quickComments.reject" 
                :key="qc"
                class="ac-qc-chip"
                :class="{ 'ac-qc-active': rejectDialog.reason === qc }"
                @click="rejectDialog.reason = rejectDialog.reason === qc ? '' : qc"
              >{{ qc }}</button>
            </div>
            <textarea 
              v-model="rejectDialog.reason" 
              class="ac-textarea" 
              placeholder="请输入驳回原因..."
              rows="4"
            ></textarea>
          </div>
          <div class="ac-modal-footer">
            <button class="ac-btn ac-btn-secondary" @click="rejectDialog.visible = false">取消</button>
            <button 
              class="ac-btn ac-btn-danger" 
              @click="handleReject" 
              :disabled="!rejectDialog.reason.trim()"
            >
              确认驳回
            </button>
          </div>
        </div>
      </div>
    </Teleport>
    
    <!-- 审核通过弹窗 -->
    <Teleport to="body">
      <div v-if="approveDialog.visible" class="ac-modal-overlay" @click.self="approveDialog.visible = false">
        <div class="ac-modal">
          <div class="ac-modal-header">
            <h3>审核通过</h3>
            <button class="ac-modal-close" @click="approveDialog.visible = false">&times;</button>
          </div>
          <div class="ac-modal-body">
            <p class="ac-confirm-text">确认通过「{{ approveDialog.targetItem?.templateName }}」的审核？</p>
            <label class="ac-label">审核意见（可选）</label>
            <div class="ac-quick-comments">
              <button 
                v-for="qc in quickComments.approve" 
                :key="qc"
                class="ac-qc-chip"
                :class="{ 'ac-qc-active': approveDialog.remark === qc }"
                @click="approveDialog.remark = approveDialog.remark === qc ? '' : qc"
              >{{ qc }}</button>
            </div>
            <textarea 
              v-model="approveDialog.remark" 
              class="ac-textarea" 
              placeholder="请输入审核意见..."
              rows="3"
            ></textarea>
          </div>
          <div class="ac-modal-footer">
            <button class="ac-btn ac-btn-secondary" @click="approveDialog.visible = false">取消</button>
            <button 
              class="ac-btn ac-btn-primary" 
              @click="confirmApprove"
            >
              确认通过
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 详情弹窗 -->
    <Teleport to="body">
      <div v-if="detailDialog.visible" class="ac-modal-overlay" @click.self="detailDialog.visible = false">
        <div class="ac-modal ac-modal-lg">
          <div class="ac-modal-header">
            <h3>提交详情</h3>
            <button class="ac-modal-close" @click="detailDialog.visible = false">&times;</button>
          </div>
          <div class="ac-modal-body" v-if="detailDialog.data">
            <div class="ac-detail-grid">
              <div class="ac-detail-item">
                <span class="ac-detail-label">模板名称</span>
                <span class="ac-detail-value">{{ detailDialog.data.templateName || '-' }}</span>
              </div>
              <div class="ac-detail-item">
                <span class="ac-detail-label">组织机构</span>
                <span class="ac-detail-value">{{ detailDialog.data.orgName || '-' }}</span>
              </div>
              <div class="ac-detail-item">
                <span class="ac-detail-label">填报周期</span>
                <span class="ac-detail-value">{{ detailDialog.data.period || '-' }}</span>
              </div>
              <div class="ac-detail-item">
                <span class="ac-detail-label">提交人</span>
                <span class="ac-detail-value">{{ detailDialog.data.submitterName || '-' }}</span>
              </div>
              <div class="ac-detail-item">
                <span class="ac-detail-label">提交时间</span>
                <span class="ac-detail-value">{{ formatTime(detailDialog.data.submitTime) }}</span>
              </div>
              <div class="ac-detail-item">
                <span class="ac-detail-label">当前状态</span>
                <span :class="'ac-status ac-status-' + normalizeStatus(detailDialog.data.status)">
                  {{ statusText(detailDialog.data.status) }}
                </span>
              </div>
              <div v-if="detailDialog.data.remark" class="ac-detail-item ac-detail-full">
                <span class="ac-detail-label">备注说明</span>
                <span class="ac-detail-value">{{ detailDialog.data.remark }}</span>
              </div>
              <div v-if="detailDialog.data.auditRemark" class="ac-detail-item ac-detail-full">
                <span class="ac-detail-label">审核意见</span>
                <span class="ac-detail-value">{{ detailDialog.data.auditRemark }}</span>
              </div>
            </div>
            
            <!-- 数据预览 -->
            <div class="ac-data-preview" v-if="detailDialog.data.cells?.length">
              <h4>填报数据预览</h4>
              <div class="ac-cells-grid">
                <div v-for="(cell, idx) in detailDialog.data.cells.slice(0, 20)" :key="idx" class="ac-cell-item">
                  <span class="ac-cell-label">{{ cell.rowName || '-' }} / {{ cell.colTitle || '-' }}</span>
                  <span class="ac-cell-value">{{ cell.value ?? '-' }}</span>
                </div>
              </div>
              <p v-if="detailDialog.data.cells.length > 20" class="ac-more-hint">
                还有 {{ detailDialog.data.cells.length - 20 }} 条数据...
              </p>
            </div>
          </div>
          <div class="ac-modal-footer">
            <button class="ac-btn ac-btn-primary" @click="detailDialog.visible = false">关闭</button>
          </div>
        </div>
      </div>
    </Teleport>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  queryAuditTasks, getAuditStats, approveAudit, rejectAudit,
  batchApproveAudits, getAuditDetail, getAuditHistory,
} from '@/api/audit.js'
import { getSubmitDetail } from '@/api/reportSubmit.js'

const router = useRouter()
const route = useRoute()

// ========================================
// 响应式数据
// ========================================

/** 当前视图 (与路由同步) */
const ROUTE_VIEW_MAP = {
  '/audit': 'pending',
  '/audit/pending': 'pending',
  '/audit/approved': 'approved',
  '/audit/rejected': 'rejected',
  '/audit/initiated': 'initiated',
  '/audit/history': 'history',
}
const currentView = computed(() => {
  const path = route.path.replace(/\/$/, '')
  return ROUTE_VIEW_MAP[path] || 'pending'
})

const currentPageTitle = computed(() => {
  const map = {
    pending: '待审核任务', approved: '已通过',
    rejected: '已驳回', initiated: '我发起的', history: '审核历史'
  }
  return map[currentView.value] || '审核中心'
})

/** 统计数据 */
const stats = reactive({
  pending: 0,
  approved: 0,
  rejected: 0,
  initiated: 0,
  history: 0,
  todayCompleted: 0,
  avgAuditTime: null
})

/** 筛选条件 */
const filters = reactive({
  keyword: '',
  dateRange: ''
})

/** 提交列表 */
const submissions = ref([])

/** 分页 */
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

/** 加载状态 */
const loading = ref(false)

/** 驳回弹窗 */
const rejectDialog = reactive({
  visible: false,
  targetItem: null,
  reason: ''
})

/** 审核通过弹窗 */
const approveDialog = reactive({
  visible: false,
  targetItem: null,
  remark: ''
})

/** 详情弹窗 */
const detailDialog = reactive({
  visible: false,
  data: null
})

/** 审核历史弹窗 */
const historyDialog = reactive({
  visible: false,
  submitId: null,
  logs: [],
  loading: false
})

/** 批量选择 */
const selectedIds = ref([])
const batchSubmitting = ref(false)

/** 快捷评论 */
const quickComments = {
  approve: ['数据正确', '确认无误', '通过'],
  reject: ['请补充附件', '金额需要确认', '数据异常请核实', '重新填写']
}

/** 判断截止时间是否临近/超时 */
function isDeadlineUrgent(deadline) {
  if (!deadline) return false
  const d = new Date(deadline)
  if (isNaN(d.getTime())) return false
  const now = Date.now()
  return d.getTime() < now || (d.getTime() - now < 24 * 60 * 60 * 1000)
}

// 计算属性
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

/** 待审核项 */
const pendingItems = computed(() => 
  submissions.value.filter(item => normalizeStatus(item.status) === 'pending')
)

/** 是否全选 */
const isAllSelected = computed(() => {
  if (pendingItems.value.length === 0) return false
  return pendingItems.value.every(item => selectedIds.value.includes(item.id))
})

// ========================================
// 方法
// ========================================

/**
 * ✅ 加载提交列表（按当前视图）
 */
async function loadSubmissions() {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      size: pageSize.value,
    }
    if (filters.keyword) params.keyword = filters.keyword
    if (filters.dateRange) params.dateRange = filters.dateRange

    const res = await queryAuditTasks(currentView.value, params)

    if (res?.records) {
      submissions.value = res.records.map(s => ({ ...s, status: normalizeStatus(s.status) }))
      total.value = res.total || 0
    } else if (Array.isArray(res)) {
      submissions.value = res.map(s => ({ ...s, status: normalizeStatus(s.status) }))
      total.value = res.length
    } else {
      submissions.value = []
      total.value = 0
    }

    selectedIds.value = []
    updateLocalStats()
  } catch (err) {
    console.error('[AuditCenter] 加载失败:', err)
    submissions.value = []
    total.value = 0
    ElMessage.error('加载审核数据失败：' + (err?.message || '请稍后重试'))
  } finally {
    loading.value = false
  }
}

/**
 * ✅ 加载统计数据
 */
async function loadStats() {
  try {
    const res = await getAuditStats()
    if (res) {
      stats.pending = res.pending || 0
      stats.approved = res.approved || 0
      stats.rejected = res.rejected || 0
      stats.initiated = res.initiated || 0
      stats.history = res.history || 0
    }
  } catch (err) {
    console.warn('[AuditCenter] 加载统计失败:', err)
  }
}

/**
 * ✅ 更新本地列表统计（用于今日完成/平均审核时间）
 */
function updateLocalStats() {
  const normalized = submissions.value.map(s => normalizeStatus(s.status))

  // 今日完成数
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  stats.todayCompleted = submissions.value.filter(s => {
    if (normalizeStatus(s.status) !== 'approved') return false
    const t = s.auditTime || s.approveTime
    if (!t) return false
    const d = new Date(t)
    return !isNaN(d.getTime()) && d >= today
  }).length

  // 平均审核时间（分钟）
  const approvedItems = submissions.value.filter(s => {
    if (normalizeStatus(s.status) !== 'approved') return false
    return s.submitTime && (s.auditTime || s.approveTime)
  })
  if (approvedItems.length > 0) {
    const totalMs = approvedItems.reduce((sum, s) => {
      const start = new Date(s.submitTime).getTime()
      const end = new Date(s.auditTime || s.approveTime).getTime()
      return sum + Math.max(0, end - start)
    }, 0)
    stats.avgAuditTime = Math.round(totalMs / approvedItems.length / 60000)
  } else {
    stats.avgAuditTime = null
  }
}

/**
 * ✅ 刷新数据
 */
function refreshData() {
  loadSubmissions()
}

/**
 * ✅ 分页切换
 */
function changePage(page) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  loadSubmissions()
}

/**
 * ✅ 显示审核通过弹窗
 */
function handleApprove(item) {
  approveDialog.targetItem = item
  approveDialog.remark = ''
  approveDialog.visible = true
}

/**
 * ✅ 确认审核通过（防重复提交）
 */
async function confirmApprove() {
  if (batchSubmitting.value) return
  batchSubmitting.value = true
  try {
    await approveAudit({
      submitId: approveDialog.targetItem.id,
      action: 'APPROVE',
      opinion: approveDialog.remark,
    })
    ElMessage.success('审核通过')
    approveDialog.visible = false
    loadStats()
    loadSubmissions()
  } catch (err) {
    ElMessage.error(err.message || '操作失败')
  } finally {
    batchSubmitting.value = false
  }
}

/**
 * ✅ 显示驳回弹窗
 */
function showRejectDialog(item) {
  rejectDialog.targetItem = item
  rejectDialog.reason = ''
  rejectDialog.visible = true
}

/**
 * ✅ 执行驳回（防重复提交）
 */
async function handleReject() {
  if (batchSubmitting.value) return
  batchSubmitting.value = true
  if (!rejectDialog.reason.trim()) {
    ElMessage.warning('请输入驳回原因')
    batchSubmitting.value = false
    return
  }
  try {
    await rejectAudit({
      submitId: rejectDialog.targetItem.id,
      action: 'REJECT',
      opinion: rejectDialog.reason,
    })
    ElMessage.success('已驳回')
    rejectDialog.visible = false
    loadStats()
    loadSubmissions()
  } catch (err) {
    ElMessage.error(err.message || '操作失败')
  } finally {
    batchSubmitting.value = false
  }
}

/**
 * ✅ 全选/取消全选
 */
function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = pendingItems.value.map(item => item.id)
  }
}

/**
 * ✅ 清空选择
 */
function clearSelection() {
  selectedIds.value = []
}

/**
 * ✅ 批量通过（防重复提交）
 */
async function batchApprove() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请选择要审核的项')
    return
  }
  if (batchSubmitting.value) return
  try {
    await ElMessageBox.confirm(`确认批量通过 ${selectedIds.value.length} 项审核？`, '提示', { type: 'warning' })
  } catch { return }

  batchSubmitting.value = true
  try {
    await batchApproveAudits({
      submitIds: [...selectedIds.value],
      opinion: '批量通过',
    })
    ElMessage.success(`已通过 ${selectedIds.value.length} 项`)
    selectedIds.value = []
    loadStats()
    loadSubmissions()
  } catch (err) {
    ElMessage.error(err.message || '批量操作失败')
  } finally {
    batchSubmitting.value = false
  }
}

/**
 * ✅ 批量驳回（防重复提交）
 */
async function batchReject() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请选择要审核的项')
    return
  }
  if (batchSubmitting.value) return
  let reason
  try {
    const { value } = await ElMessageBox.prompt(`请输入批量驳回原因（共 ${selectedIds.value.length} 项）：`, '批量驳回', { inputPlaceholder: '请输入驳回原因', inputValidator: (v) => !!v?.trim() || '驳回原因不能为空' })
    reason = value
  } catch { return }

  batchSubmitting.value = true
  try {
    // 后端 batch-approve 仅支持通过；批量驳回改为逐条调用
    for (const id of selectedIds.value) {
      try { await rejectAudit({ submitId: id, action: 'REJECT', opinion: reason }) } catch (e) { console.warn('驳回失败', id, e) }
    }
    ElMessage.success(`已驳回 ${selectedIds.value.length} 项`)
    selectedIds.value = []
    loadStats()
    loadSubmissions()
  } catch (err) {
    ElMessage.error(err.message || '批量操作失败')
  } finally {
    batchSubmitting.value = false
  }
}

/**
 * ✅ 查看审核历史/轨迹
 */
async function viewAuditHistory(item) {
  historyDialog.submitId = item.id
  historyDialog.visible = true
  historyDialog.loading = true
  historyDialog.logs = []
  try {
    const logs = await getAuditHistory(item.id)
    historyDialog.logs = Array.isArray(logs) ? logs : []
  } catch (err) {
    console.warn('[AuditCenter] 加载审核历史失败:', err)
    historyDialog.logs = []
  } finally {
    historyDialog.loading = false
  }
}

/**
 * ✅ 查看详情
 */
async function viewDetail(item) {
  try {
    const data = await getAuditDetail(item.id)
    detailDialog.data = { ...item, ...(data || {}) }
    detailDialog.visible = true
  } catch (err) {
    detailDialog.data = item
    detailDialog.visible = true
  }
}

/**
 * ✅ 重新提交（跳转到填报页面）
 */
function resubmit(item) {
  router.push({
    path: `/report/${item.templateId}`,
    query: {
      orgId: item.orgId,
      period: item.period
    }
  })
}

/**
 * ✅ 状态码标准化（兼容数字和字符串）
 * 后端可能返回数字 0/2/3/4 或字符串 'pending'/'approved' 等
 */
function normalizeStatus(status) {
  if (status === null || status === undefined) return 'pending'
  if (typeof status === 'string') return status
  const map = { 0: 'draft', 1: 'pending', 2: 'approved', 3: 'rejected', 4: 'withdrawn' }
  return map[status] || 'pending'
}

/**
 * ✅ 状态文本映射
 */
function statusText(status) {
  const normalized = normalizeStatus(status)
  const map = {
    draft: '草稿',
    pending: '待审核',
    approved: '已通过',
    rejected: '已驳回',
    withdrawn: '已撤回'
  }
  return map[normalized] || normalized || '-'
}

/**
 * ✅ 格式化时间
 */
function formatTime(time) {
  if (!time) return '-'
  
  try {
    const d = new Date(time)
    if (isNaN(d.getTime())) return time
    
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return time
  }
}

// ========================================
// 生命周期
// ========================================
onMounted(() => {
  loadStats()
  loadSubmissions()
})

watch(() => route.path, () => {
  currentPage.value = 1
  loadSubmissions()
})
</script>

<style lang="scss" scoped>
.audit-center {
  height: 100%;
  overflow-y: auto;
  padding: 24px;
  color: var(--app-text-primary);
}

.app-page-inner {
  max-width: 1200px;
  margin: 0 auto;
}

/* 页面标题 */
.ac-page-header {
  margin-bottom: var(--app-space-6, 24px);
}
.ac-page-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--app-text-primary, #1f2937);
  margin: 0 0 8px 0;
}
.ac-page-desc {
  font-size: 13px;
  color: var(--app-text-muted, #6b7280);
  margin: 0;
}

/* 统计卡片 */
.ac-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--app-card-gap);
  margin-bottom: var(--app-space-6);
}
.ac-stat-card {
  background: var(--app-surface);
  border-radius: var(--app-card-radius);
  padding: var(--app-space-5);
  border: 1px solid var(--app-border);
  text-align: center;
  box-shadow: var(--app-shadow-sm);
}
.ac-stat-number {
  font-size: var(--app-font-h2);
  font-weight: var(--app-font-bold);
  line-height: 1.2;
  font-family: var(--app-font-family-number);
}
.ac-stat-unit {
  font-size: var(--app-font-caption);
  font-weight: var(--app-font-regular);
  color: var(--app-text-muted);
  margin-left: 2px;
}
.ac-stat-label {
  font-size: var(--app-font-caption);
  color: var(--app-text-secondary);
  margin-top: var(--app-space-1);
}
.ac-stat-pending .ac-stat-number { color: var(--app-primary); }
.ac-stat-today .ac-stat-number { color: var(--app-success); }
.ac-stat-rejected .ac-stat-number { color: var(--app-danger); }
.ac-stat-avg .ac-stat-number { color: var(--app-warning); }

/* 工具栏 */
.ac-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--app-space-3);
  margin-bottom: var(--app-space-4);
  flex-wrap: wrap;
}
.ac-filters {
  display: flex;
  gap: var(--app-space-2);
  flex: 1;
  min-width: 300px;
}
.ac-select, .ac-input {
  height: 36px;
  padding: 0 var(--app-space-3);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  font-size: var(--app-font-caption);
  outline: none;
  background: var(--app-surface);
  color: var(--app-text-primary);
  transition: border-color var(--app-transition-fast);
  &:focus { border-color: var(--app-primary); box-shadow: 0 0 0 3px var(--app-primary-bg); }
}
.ac-input { flex: 1; }

/* 按钮 */
.ac-btn {
  height: 36px;
  padding: 0 var(--app-space-4);
  border-radius: var(--app-radius-md);
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  font-size: var(--app-font-caption);
  font-weight: var(--app-font-medium);
  cursor: pointer;
  color: var(--app-text-primary);
  transition: all var(--app-transition-fast);
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
.ac-btn-primary {
  background: var(--app-primary);
  color: #fff;
  border-color: var(--app-primary);
  &:hover:not(:disabled) { background: var(--app-primary-hover); }
}
.ac-btn-secondary {
  color: var(--app-text-secondary);
  &:hover:not(:disabled) { background: var(--app-surface-hover); }
}
.ac-btn-danger {
  background: var(--app-danger);
  color: #fff;
  border-color: var(--app-danger);
  &:hover:not(:disabled) { background: var(--app-danger-hover); }
}

/* 表格 */
.ac-table-wrapper {
  background: var(--app-surface);
  border-radius: var(--app-card-radius);
  border: 1px solid var(--app-border);
  overflow: hidden;
  min-height: 300px;
  box-shadow: var(--app-shadow-sm);
}
.ac-table {
  width: 100%;
  border-collapse: collapse;
  th, td {
    padding: 11px var(--app-space-4);
    text-align: left;
    border-bottom: 1px solid var(--app-border-light);
    font-size: var(--app-font-caption);
  }
  th {
    background: var(--app-bg);
    font-weight: var(--app-font-semibold);
    color: var(--app-text-secondary);
    position: sticky;
    top: 0;
  }
  tbody tr:hover { background: var(--app-surface-hover); }
}
.ac-td-name { font-weight: 500; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 状态标签 */
.ac-status {
  display: inline-block;
  padding: 3px 10px;
  border-radius: var(--app-radius-xl);
  font-size: var(--app-font-caption);
  font-weight: var(--app-font-medium);
}
.ac-status-pending { background: var(--app-primary-bg); color: var(--app-primary); }
.ac-status-submitted { background: var(--app-primary-bg); color: var(--app-primary); }
.ac-status-approved { background: var(--app-success-bg); color: var(--app-success); }
.ac-status-rejected { background: var(--app-danger-bg); color: var(--app-danger); }
.ac-status-withdrawn { background: var(--app-surface-active); color: var(--app-text-muted); }

/* 操作按钮 */
.ac-actions { white-space: nowrap; }
.ac-action-btn {
  padding: 4px 10px;
  border: none;
  border-radius: var(--app-radius-xs);
  font-size: var(--app-font-caption);
  cursor: pointer;
  margin-right: 4px;
  transition: all var(--app-transition-fast);
  background: var(--app-bg);
  color: var(--app-text-secondary);
  &:hover { background: var(--app-surface-active); color: var(--app-text-primary); }
}
.ac-approve { background: var(--app-success-bg); color: var(--app-success); &:hover { background: var(--app-success-bg-hover); } }
.ac-reject { background: var(--app-danger-bg); color: var(--app-danger); &:hover { background: var(--app-danger-bg-hover); } }
.ac-detail { background: var(--app-info-bg); color: var(--app-info); &:hover { background: var(--app-info-bg-hover); } }
.ac-resubmit { background: var(--app-warning-bg); color: var(--app-warning); &:hover { background: var(--app-warning-bg-hover); } }
.ac-history { background: var(--app-info-bg); color: var(--app-info); &:hover { background: var(--app-info-bg-hover); } }

/* 空状态 */
.ac-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--app-space-16) var(--app-space-5);
  color: var(--app-text-muted);
}
.ac-empty-title {
  font-size: var(--app-font-body);
  font-weight: var(--app-font-medium);
  color: var(--app-text-secondary);
  margin: var(--app-space-4) 0 var(--app-space-1);
}
.ac-empty-desc {
  font-size: var(--app-font-caption);
  color: var(--app-text-muted);
  margin: 0;
}

/* 骨架屏 */
.ac-skeleton-row td {
  padding: 14px var(--app-space-4) !important;
}
.ac-skeleton {
  height: 14px;
  border-radius: var(--app-radius-xs);
  background: linear-gradient(90deg, var(--app-border-light) 25%, var(--app-bg) 50%, var(--app-border-light) 75%);
  background-size: 200% 100%;
  animation: ac-shimmer 1.5s infinite;
}
@keyframes ac-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 截止时间 */
.ac-deadline-urgent {
  color: var(--app-danger);
  font-weight: var(--app-font-medium);
}

/* 分页 */
.ac-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--app-space-4);
  margin-top: var(--app-space-4);
  padding: var(--app-space-3) 0;
}
.ac-page-btn {
  height: 36px;
  padding: 0 var(--app-space-4);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  background: var(--app-surface);
  cursor: pointer;
  font-size: var(--app-font-caption);
  color: var(--app-text-primary);
  transition: all var(--app-transition-fast);
  &:disabled { opacity: 0.4; cursor: not-allowed; }
  &:hover:not(:disabled) { border-color: var(--app-primary); color: var(--app-primary); }
}
.ac-page-info { font-size: var(--app-font-caption); color: var(--app-text-secondary); }

/* 弹窗 */
.ac-modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--app-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--app-z-modal);
  animation: ac-fadeIn 0.2s ease;
}
@keyframes ac-fadeIn { from { opacity: 0; } to { opacity: 1; } }
.ac-modal {
  background: var(--app-surface);
  border-radius: var(--app-radius-lg);
  width: 480px;
  max-width: 90vw;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: var(--app-shadow-xl);
  animation: ac-slideUp 0.3s ease;
}
@keyframes ac-slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.ac-modal-lg { width: 720px; }
.ac-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--app-space-5) var(--app-space-6);
  border-bottom: 1px solid var(--app-border-light);
  h3 { margin: 0; font-size: var(--app-font-h5); color: var(--app-text-primary); }
}
.ac-modal-close {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: var(--app-text-muted);
  &:hover { color: var(--app-danger); }
}
.ac-modal-body { padding: 22px var(--app-space-6); }
.ac-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--app-space-2);
  padding: var(--app-space-4) var(--app-space-6);
  border-top: 1px solid var(--app-border-light);
}

/* 快速评论标签 */
.ac-quick-comments {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-2);
  margin-bottom: var(--app-space-3);
}
.ac-qc-chip {
  padding: 4px 12px;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-xl);
  background: var(--app-bg);
  color: var(--app-text-secondary);
  font-size: var(--app-font-caption);
  cursor: pointer;
  transition: all var(--app-transition-fast);
  &:hover { border-color: var(--app-primary); color: var(--app-primary); background: var(--app-primary-bg); }
}
.ac-qc-active {
  border-color: var(--app-primary);
  color: var(--app-primary);
  background: var(--app-primary-bg);
}

/* 驳回表单 */
.ac-label {
  display: block;
  font-size: var(--app-font-caption);
  font-weight: var(--app-font-medium);
  margin-bottom: var(--app-space-2);
  color: var(--app-text-secondary);
}
.ac-textarea {
  width: 100%;
  padding: 10px var(--app-space-3);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
  font-size: var(--app-font-caption);
  resize: vertical;
  font-family: inherit;
  outline: none;
  background: var(--app-surface);
  color: var(--app-text-primary);
  &:focus { border-color: var(--app-primary); box-shadow: 0 0 0 3px var(--app-primary-bg); }
}

/* 确认文字 */
.ac-confirm-text {
  margin: 0 0 var(--app-space-4);
  font-size: var(--app-font-body);
  color: var(--app-text-primary);
  line-height: 1.5;
}

/* 详情网格 */
.ac-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--app-space-4);
}
.ac-detail-item {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-1);
}
.ac-detail-full { grid-column: span 2; }
.ac-detail-label { font-size: var(--app-font-caption); color: var(--app-text-muted); }
.ac-detail-value { font-size: var(--app-font-body); font-weight: var(--app-font-medium); word-break: break-all; }

/* 数据预览 */
.ac-data-preview { margin-top: var(--app-space-5); }
.ac-data-preview h4 { margin: 0 0 10px 0; font-size: var(--app-font-body); color: var(--app-text-primary); }
.ac-cells-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 6px;
}
.ac-cell-item {
  display: flex;
  justify-content: space-between;
  padding: var(--app-space-2) 10px;
  background: var(--app-bg);
  border-radius: var(--app-radius-xs);
  font-size: var(--app-font-caption);
}
.ac-cell-label { color: var(--app-text-muted); }
.ac-cell-value { font-weight: var(--app-font-medium); }
.ac-more-hint { text-align: center; color: var(--app-text-muted); font-size: var(--app-font-caption); margin-top: 10px; }

/* 批量操作栏 */
.ac-batch-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px var(--app-space-4);
  background: var(--app-primary-bg);
  border: 1px solid var(--app-primary);
  border-radius: var(--app-radius-sm);
  margin-bottom: var(--app-space-3);
}
.ac-batch-info {
  font-size: var(--app-font-body);
  font-weight: var(--app-font-medium);
  color: var(--app-primary);
}
.ac-batch-actions {
  display: flex;
  gap: var(--app-space-2);
}

/* 复选框列 */
.ac-col-check {
  width: 40px;
  text-align: center;
}

/* 审核人/时间信息 */
.ac-audit-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ac-auditor {
  font-size: var(--app-font-caption);
  font-weight: var(--app-font-medium);
  color: var(--app-text-primary);
}
.ac-audit-time {
  font-size: var(--app-font-caption);
  color: var(--app-text-muted);
}
.ac-audit-empty {
  color: var(--app-text-muted);
}

/* 审核时间线 */
.ac-timeline {
  position: relative;
  padding-left: var(--app-space-6);
}
.ac-timeline::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--app-border);
}
.ac-timeline-item {
  position: relative;
  padding-bottom: var(--app-space-5);
}
.ac-timeline-dot {
  position: absolute;
  left: -22px;
  top: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--app-border);
  border: 2px solid var(--app-surface);
}
.ac-timeline-pending .ac-timeline-dot { background: var(--app-primary); }
.ac-timeline-approved .ac-timeline-dot { background: var(--app-success); }
.ac-timeline-rejected .ac-timeline-dot { background: var(--app-danger); }
.ac-timeline-submitted .ac-timeline-dot { background: var(--app-primary); }
.ac-timeline-withdrawn .ac-timeline-dot { background: var(--app-text-muted); }
.ac-timeline-content {
  background: var(--app-bg);
  border-radius: var(--app-radius-sm);
  padding: var(--app-space-3) var(--app-space-4);
}
.ac-timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.ac-timeline-action {
  font-size: var(--app-font-body);
  font-weight: var(--app-font-semibold);
  color: var(--app-text-primary);
}
.ac-timeline-time {
  font-size: var(--app-font-caption);
  color: var(--app-text-muted);
}
.ac-timeline-body p {
  margin: var(--app-space-1) 0;
  font-size: var(--app-font-caption);
  color: var(--app-text-secondary);
}
.ac-timeline-remark {
  color: var(--app-warning) !important;
}

/* 响应式 */
@media (max-width: 768px) {
  .ac-stats { grid-template-columns: repeat(2, 1fr); }
  .ac-toolbar { flex-direction: column; }
  .ac-filters { flex-direction: column; width: 100%; }
  .ac-detail-grid { grid-template-columns: 1fr; }
  .ac-modal { width: 95vw; }
  .ac-batch-bar { flex-direction: column; gap: 10px; }
}
</style>
