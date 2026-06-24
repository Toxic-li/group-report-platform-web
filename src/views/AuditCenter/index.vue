<template>
  <div class="audit-center">
    <!-- 页面标题 -->
    <div class="ac-header">
      <h1 class="ac-title">审核中心</h1>
      <p class="ac-subtitle">管理报表提交审核流程</p>
    </div>

    <!-- 统计卡片 -->
    <div class="ac-stats">
      <div class="ac-stat-card ac-stat-pending">
        <div class="ac-stat-number">{{ stats.pending }}</div>
        <div class="ac-stat-label">待审核</div>
      </div>
      <div class="ac-stat-card ac-stat-approved">
        <div class="ac-stat-number">{{ stats.approved }}</div>
        <div class="ac-stat-label">已通过</div>
      </div>
      <div class="ac-stat-card ac-stat-rejected">
        <div class="ac-stat-number">{{ stats.rejected }}</div>
        <div class="ac-stat-label">已驳回</div>
      </div>
      <div class="ac-stat-card ac-stat-total">
        <div class="ac-stat-number">{{ stats.total }}</div>
        <div class="ac-stat-label">总提交</div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="ac-toolbar">
      <div class="ac-filters">
        <select v-model="filters.status" class="ac-select" @change="loadSubmissions">
          <option value="">全部状态</option>
          <option value="pending">待审核</option>
          <option value="approved">已通过</option>
          <option value="rejected">已驳回</option>
          <option value="withdrawn">已撤回</option>
        </select>
        
        <input 
          type="text" 
          v-model="filters.keyword" 
          placeholder="搜索模板名称/提交人..." 
          class="ac-input"
          @keyup.enter="loadSubmissions"
        />
        
        <button class="ac-btn ac-btn-primary" @click="loadSubmissions" :disabled="loading">
          查询
        </button>
      </div>
      
      <button class="ac-btn ac-btn-secondary" @click="refreshData" :disabled="loading">
        {{ loading ? '加载中...' : '刷新' }}
      </button>
    </div>

    <!-- 提交列表 -->
    <div class="ac-table-wrapper">
      <table class="ac-table" v-if="submissions.length > 0">
        <thead>
          <tr>
            <th>序号</th>
            <th>模板名称</th>
            <th>组织</th>
            <th>周期</th>
            <th>提交人</th>
            <th>提交时间</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in submissions" :key="item.id" :class="'ac-row-' + item.status">
            <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
            <td class="ac-td-name">{{ item.templateName || '-' }}</td>
            <td>{{ item.orgName || '-' }}</td>
            <td>{{ item.period || '-' }}</td>
            <td>{{ item.submitterName || '-' }}</td>
            <td>{{ formatTime(item.submitTime) }}</td>
            <td>
              <span :class="'ac-status ac-status-' + item.status">
                {{ statusText(item.status) }}
              </span>
            </td>
            <td class="ac-actions">
              <!-- 待审核：显示通过/驳回按钮 -->
              <template v-if="item.status === 'pending'">
                <button class="ac-action-btn ac-approve" @click="handleApprove(item)" title="审核通过">
                  ✓ 通过
                </button>
                <button class="ac-action-btn ac-reject" @click="showRejectDialog(item)" title="审核驳回">
                  ✕ 驳回
                </button>
                <button class="ac-action-btn ac-detail" @click="viewDetail(item)" title="查看详情">
                  详情
                </button>
              </template>
              
              <!-- 已通过/驳回：只显示详情 -->
              <template v-else>
                <button class="ac-action-btn ac-detail" @click="viewDetail(item)" title="查看详情">
                  详情
                </button>
                <!-- 已撤回：可重新提交 -->
                <button 
                  v-if="item.status === 'withdrawn'" 
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
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.5">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          <path d="M9 14l2 2 4-4"/>
        </svg>
        <p>暂无提交记录</p>
      </div>
      
      <!-- 加载中 -->
      <div v-if="loading" class="ac-loading">
        <div class="ac-spinner"></div>
        <p>正在加载...</p>
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
                <span :class="'ac-status ac-status-' + detailDialog.data.status">
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
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from '@/utils/toast.js'

const router = useRouter()

// ========================================
// 响应式数据
// ========================================

/** 统计数据 */
const stats = reactive({
  pending: 0,
  approved: 0,
  rejected: 0,
  total: 0
})

/** 筛选条件 */
const filters = reactive({
  status: '',
  keyword: ''
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

/** 详情弹窗 */
const detailDialog = reactive({
  visible: false,
  data: null
})

// 计算属性
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

// ========================================
// 方法
// ========================================

/**
 * ✅ 加载提交列表
 */
async function loadSubmissions() {
  loading.value = true
  
  try {
    const { getSubmissionsPage, getPendingAudits } = await import('@/api/reportDesigner.js')
    
    const params = {
      page: currentPage.value,
      size: pageSize.value
    }
    
    if (filters.status) params.status = filters.status
    if (filters.keyword) params.keyword = filters.keyword
    
    let res
    
    // 如果筛选待审核，使用专门的接口
    if (filters.status === 'pending') {
      res = await getPendingAudits(params)
    } else {
      res = await getSubmissionsPage(params)
    }
    
    // 兼容多种返回格式
    if (Array.isArray(res)) {
      submissions.value = res
      total.value = res.length
    } else if (res?.records || res?.list || res?.data) {
      submissions.value = res.records || res.list || res.data
      total.value = res.total || res.count || submissions.value.length
    }
    
    console.log('[AuditCenter] 加载完成:', submissions.value.length, '条')
    
  } catch (err) {
    console.error('[AuditCenter] 加载失败:', err)
    showToast('加载数据失败', 'error')
  } finally {
    loading.value = false
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
 * ✅ 审核通过
 */
async function handleApprove(item) {
  if (!confirm(`确认通过「${item.templateName}」的审核？`)) return
  
  try {
    const { approveAudit } = await import('@/api/reportDesigner.js')
    
    await approveAudit(item.id, '')
    
    showToast('审核通过', 'success')
    loadSubmissions()
  } catch (err) {
    showToast(err.message || '操作失败', 'error')
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
 * ✅ 执行驳回
 */
async function handleReject() {
  if (!rejectDialog.reason.trim()) {
    showToast('请输入驳回原因', 'warning')
    return
  }
  
  try {
    const { rejectAudit } = await import('@/api/reportDesigner.js')
    
    await rejectAudit(rejectDialog.targetItem.id, rejectDialog.reason)
    
    showToast('已驳回', 'success')
    rejectDialog.visible = false
    loadSubmissions()
  } catch (err) {
    showToast(err.message || '操作失败', 'error')
  }
}

/**
 * ✅ 查看详情
 */
async function viewDetail(item) {
  try {
    const { getSubmissionById } = await import('@/api/reportDesigner.js')
    
    const data = await getSubmissionById(item.id)
    
    detailDialog.data = { ...item, ...data }
    detailDialog.visible = true
  } catch (err) {
    // 如果详情接口失败，直接用列表数据显示
    detailDialog.data = item
    detailDialog.visible = true
  }
}

/**
 * ✅ 重新提交（跳转到填报页面）
 */
function resubmit(item) {
  router.push({
    path: `/fill/${item.templateId}`,
    query: {
      orgId: item.orgId,
      period: item.period
    }
  })
}

/**
 * ✅ 状态文本映射
 */
function statusText(status) {
  const map = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已驳回',
    withdrawn: '已撤回'
  }
  return map[status] || status || '-'
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
  loadSubmissions()
})
</script>

<style lang="scss" scoped>
$primary: #2563EB;
$success: #059669;
$danger: #DC2626;
$warning: #D97706;
$text: #0F172A;
$text-secondary: #475569;
$text-muted: #94A3B8;
$border: #E2E8F0;
$bg: #F8FAFC;

.audit-center {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  font-family: "SF Pro Display", -apple-system, sans-serif;
  color: $text;
}

/* 头部 */
.ac-header {
  margin-bottom: 24px;
}
.ac-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 4px 0;
}
.ac-subtitle {
  color: $text-muted;
  margin: 0;
  font-size: 14px;
}

/* 统计卡片 */
.ac-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.ac-stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid $border;
  text-align: center;
}
.ac-stat-number {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
}
.ac-stat-label {
  font-size: 13px;
  color: $text-secondary;
  margin-top: 4px;
}
.ac-stat-pending .ac-stat-number { color: $warning; }
.ac-stat-approved .ac-stat-number { color: $success; }
.ac-stat-rejected .ac-stat-number { color: $danger; }
.ac-stat-total .ac-stat-number { color: $primary; }

/* 工具栏 */
.ac-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.ac-filters {
  display: flex;
  gap: 10px;
  flex: 1;
  min-width: 300px;
}
.ac-select, .ac-input {
  padding: 8px 12px;
  border: 1px solid $border;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  &:focus { border-color: $primary; }
}
.ac-input { flex: 1; }

/* 按钮 */
.ac-btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}
.ac-btn-primary { background: $primary; color: white; &:hover:not(:disabled) { background: #1D4ED8; } }
.ac-btn-secondary { background: white; border: 1px solid $border; color: $text-secondary; &:hover:not(:disabled) { background: $bg; } }
.ac-btn-danger { background: $danger; color: white; &:hover:not(:disabled) { background: #B91C1C; } }

/* 表格 */
.ac-table-wrapper {
  background: white;
  border-radius: 12px;
  border: 1px solid $border;
  overflow: hidden;
  min-height: 300px;
}
.ac-table {
  width: 100%;
  border-collapse: collapse;
  th, td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid $border;
    font-size: 13px;
  }
  th {
    background: $bg;
    font-weight: 600;
    color: $text-secondary;
    position: sticky;
    top: 0;
  }
  tbody tr:hover { background: #FAFBFC; }
}
.ac-td-name { font-weight: 500; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 状态标签 */
.ac-status {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}
.ac-status-pending { background: #FEF3C7; color: $warning; }
.ac-status-approved { background: #D1FAE5; color: $success; }
.ac-status-rejected { background: #FEE2E2; color: $danger; }
.ac-status-withdrawn { background: #F1F5F9; color: $text-muted; }

/* 操作按钮 */
.ac-actions { white-space: nowrap; }
.ac-action-btn {
  padding: 4px 10px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  margin-right: 4px;
  transition: all 0.15s;
}
.ac-approve { background: #D1FAE5; color: $success; &:hover { background: #A7F3D0; } }
.ac-reject { background: #FEE2E2; color: $danger; &:hover { background: #FECACA; } }
.ac-detail { background: #DBEAFE; color: $primary; &:hover { background: #BFDBFE; } }
.ac-resubmit { background: #FEF3C7; color: $warning; &:hover { background: #FDE68A; } }

/* 空状态 */
.ac-empty, .ac-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: $text-muted;
}
.ac-spinner {
  width: 32px; height: 32px;
  border: 3px solid $border;
  border-top-color: $primary;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 分页 */
.ac-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  padding: 16px 0;
}
.ac-page-btn {
  padding: 8px 16px;
  border: 1px solid $border;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 13px;
  &:disabled { opacity: 0.4; cursor: not-allowed; }
  &:hover:not(:disabled) { border-color: $primary; color: $primary; }
}
.ac-page-info { font-size: 13px; color: $text-secondary; }

/* 弹窗 */
.ac-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.ac-modal {
  background: white;
  border-radius: 16px;
  width: 480px;
  max-width: 90vw;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0,0,0,0.25);
  animation: slideUp 0.3s ease;
}
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.ac-modal-lg { width: 720px; }
.ac-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid $border;
  h3 { margin: 0; font-size: 18px; }
}
.ac-modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: $text-muted;
  &:hover { color: $danger; }
}
.ac-modal-body { padding: 24px; }
.ac-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid $border;
}

/* 驳回表单 */
.ac-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 8px;
  color: $text-secondary;
}
.ac-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid $border;
  border-radius: 8px;
  font-size: 13px;
  resize: vertical;
  font-family: inherit;
  &:focus { outline: none; border-color: $primary; box-shadow: 0 0 0 3px rgba($primary, 0.1); }
}

/* 详情网格 */
.ac-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.ac-detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ac-detail-full { grid-column: span 2; }
.ac-detail-label { font-size: 12px; color: $text-muted; }
.ac-detail-value { font-size: 14px; font-weight: 500; word-break: break-all; }

/* 数据预览 */
.ac-data-preview { margin-top: 24px; }
.ac-data-preview h4 { margin: 0 0 12px 0; font-size: 15px; }
.ac-cells-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
}
.ac-cell-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: $bg;
  border-radius: 6px;
  font-size: 12px;
}
.ac-cell-label { color: $text-muted; }
.ac-cell-value { font-weight: 500; }
.ac-more-hint { text-align: center; color: $text-muted; font-size: 12px; margin-top: 12px; }

/* 响应式 */
@media (max-width: 768px) {
  .ac-stats { grid-template-columns: repeat(2, 1fr); }
  .ac-toolbar { flex-direction: column; }
  .ac-filters { flex-direction: column; width: 100%; }
  .ac-detail-grid { grid-template-columns: 1fr; }
  .ac-modal { width: 95vw; }
}
</style>
