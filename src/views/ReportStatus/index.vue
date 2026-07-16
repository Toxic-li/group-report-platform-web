<template>
  <div class="report-status-page">
    <div class="rsp-header">
      <div class="rsp-header-left">
        <h1 class="rsp-title">填报状态管理</h1>
        <p class="rsp-subtitle">实时监控各单位报表填报进度</p>
      </div>
      <div class="rsp-header-right">
        <div class="rsp-export-btn" @click="handleExport">
          <Download :size="16" />
          <span>导出数据</span>
        </div>
      </div>
    </div>

    <div class="rsp-dimension-tabs">
      <button 
        v-for="tab in dimensionTabs" 
        :key="tab.key" 
        class="rsp-dimension-tab"
        :class="{ active: activeDimension === tab.key }"
        @click="activeDimension = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="rsp-filter-bar">
      <div class="rsp-filter-group">
        <el-select v-model="filterForm.category" placeholder="选择分类" class="rsp-filter-select">
          <el-option label="全部" value="" />
          <el-option label="生产统计" value="production" />
          <el-option label="综合统计" value="comprehensive" />
          <el-option label="投资统计" value="investment" />
        </el-select>
      </div>
      <div class="rsp-filter-group">
        <el-select v-model="filterForm.status" placeholder="状态筛选" class="rsp-filter-select">
          <el-option label="全部" value="" />
          <el-option label="已填报" value="completed" />
          <el-option label="未填报" value="pending" />
          <el-option label="已退回" value="rejected" />
        </el-select>
      </div>
      <div class="rsp-filter-group">
        <el-date-picker 
          v-model="filterForm.period" 
          type="month" 
          placeholder="选择月份" 
          class="rsp-filter-date"
        />
      </div>
      <button class="rsp-filter-btn" @click="handleFilter">
        <Search :size="14" />
        查询
      </button>
      <button class="rsp-reset-btn" @click="handleReset">
        重置
      </button>
    </div>

    <div class="rsp-stats-row">
      <div class="rsp-stat-card">
        <div class="rsp-stat-icon rsp-stat-icon--total">
          <FileSpreadsheet :size="20" />
        </div>
        <div class="rsp-stat-content">
          <div class="rsp-stat-value">{{ totalCount }}</div>
          <div class="rsp-stat-label">报表总数</div>
        </div>
      </div>
      <div class="rsp-stat-card">
        <div class="rsp-stat-icon rsp-stat-icon--completed">
          <CheckCircle :size="20" />
        </div>
        <div class="rsp-stat-content">
          <div class="rsp-stat-value">{{ completedCount }}</div>
          <div class="rsp-stat-label">已填报</div>
        </div>
      </div>
      <div class="rsp-stat-card">
        <div class="rsp-stat-icon rsp-stat-icon--pending">
          <Clock :size="20" />
        </div>
        <div class="rsp-stat-content">
          <div class="rsp-stat-value">{{ pendingCount }}</div>
          <div class="rsp-stat-label">未填报</div>
        </div>
      </div>
      <div class="rsp-stat-card">
        <div class="rsp-stat-icon rsp-stat-icon--rejected">
          <XCircle :size="20" />
        </div>
        <div class="rsp-stat-content">
          <div class="rsp-stat-value">{{ rejectedCount }}</div>
          <div class="rsp-stat-label">已退回</div>
        </div>
      </div>
    </div>

    <div class="rsp-progress-overview">
      <div class="rsp-progress-header">
        <span class="rsp-progress-title">总体填报进度</span>
        <span class="rsp-progress-rate">{{ completionRate }}%</span>
      </div>
      <div class="rsp-progress-bar">
        <div class="rsp-progress-fill" :style="{ width: completionRate + '%' }"></div>
      </div>
    </div>

    <div class="rsp-table-container">
      <div class="rsp-table-header">
        <span class="rsp-table-title">{{ activeDimension === 'unit' ? '单位填报进度' : '报表填报进度' }}</span>
        <div class="rsp-table-actions">
          <button class="rsp-action-btn" @click="handleBatchRemind" :disabled="selectedRows.length === 0">
            <Bell :size="14" />
            批量催办
          </button>
        </div>
      </div>

      <el-table 
        :data="tableData" 
        v-loading="loading"
        row-key="id"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column 
          v-if="activeDimension === 'unit'"
          label="单位名称" 
          prop="orgName" 
          min-width="200"
        />
        <el-table-column 
          v-else
          label="报表名称" 
          prop="reportName" 
          min-width="200"
        />
        <el-table-column 
          v-if="activeDimension === 'unit'"
          label="报表数量" 
          prop="reportCount" 
          width="100"
        />
        <el-table-column 
          v-else
          label="所属单位" 
          prop="orgName" 
          min-width="150"
        />
        <el-table-column label="已填报" prop="completed" width="80" />
        <el-table-column label="未填报" prop="pending" width="80" />
        <el-table-column label="进度" width="180">
          <template #default="scope">
            <div class="cell-progress">
              <div class="cell-progress-bar">
                <div 
                  class="cell-progress-fill" 
                  :style="{ width: scope.row.rate + '%' }"
                  :class="getProgressClass(scope.row.rate)"
                ></div>
              </div>
              <span class="cell-progress-rate">{{ scope.row.rate }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <span 
              class="status-tag"
              :class="getStatusClass(scope.row.status)"
            >
              {{ getStatusText(scope.row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="截止日期" prop="deadline" width="120" />
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <button 
              class="rsp-btn rsp-btn--primary" 
              @click="handleViewDetail(scope.row)"
            >
              详情
            </button>
            <button 
              class="rsp-btn rsp-btn--warning" 
              @click="handleRemind(scope.row)"
              v-if="scope.row.status !== 'completed'"
            >
              催办
            </button>
          </template>
        </el-table-column>
      </el-table>

      <div class="rsp-pagination">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pagination.page"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.size"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </div>

    <el-dialog 
      v-model="detailDialogVisible" 
      title="填报详情" 
      width="800px"
    >
      <div class="rsp-detail-content" v-if="currentDetail">
        <div class="rsp-detail-header">
          <h3>{{ activeDimension === 'unit' ? currentDetail.orgName : currentDetail.reportName }}</h3>
          <span class="status-tag" :class="getStatusClass(currentDetail.status)">
            {{ getStatusText(currentDetail.status) }}
          </span>
        </div>
        <el-table :data="currentDetail.details" border style="width: 100%">
          <el-table-column label="报表名称" prop="name" />
          <el-table-column label="填报人" prop="filler" />
          <el-table-column label="填报时间" prop="fillTime" />
          <el-table-column label="状态" prop="statusText" />
          <el-table-column label="审核人" prop="auditor" />
          <el-table-column label="审核时间" prop="auditTime" />
        </el-table>
      </div>
    </el-dialog>

    <el-dialog 
      v-model="remindDialogVisible" 
      title="催办通知" 
      width="500px"
    >
      <el-form :model="remindForm" label-width="80px">
        <el-form-item label="接收人">
          <el-select v-model="remindForm.recipient" multiple placeholder="选择接收人">
            <el-option 
              v-for="item in remindRecipients" 
              :key="item.id" 
              :label="item.name" 
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="催办内容">
          <el-textarea 
            v-model="remindForm.content" 
            rows="4" 
            placeholder="请输入催办内容..."
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="remindDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSendRemind">发送</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  Download, Search, FileSpreadsheet, CheckCircle, 
  Clock, XCircle, Bell, User
} from 'lucide-vue-next'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const activeDimension = ref('unit')
const dimensionTabs = [
  { key: 'unit', label: '按单位查看' },
  { key: 'report', label: '按报表查看' }
]

const filterForm = ref({
  category: '',
  status: '',
  period: ''
})

const selectedRows = ref<any[]>([])

const pagination = ref({
  page: 1,
  size: 20,
  total: 0
})

const tableData = ref<any[]>([])
const detailDialogVisible = ref(false)
const currentDetail = ref(null)

const remindDialogVisible = ref(false)
const remindForm = ref({
  recipient: [],
  content: ''
})
const remindRecipients = ref<any[]>([])

const totalCount = computed(() => {
  return tableData.value.reduce((sum, item) => {
    return sum + (item.reportCount || 1)
  }, 0)
})

const completedCount = computed(() => {
  return tableData.value.reduce((sum, item) => sum + (item.completed || 0), 0)
})

const pendingCount = computed(() => {
  return tableData.value.reduce((sum, item) => sum + (item.pending || 0), 0)
})

const rejectedCount = computed(() => {
  return tableData.value.reduce((sum, item) => sum + (item.rejected || 0), 0)
})

const completionRate = computed(() => {
  const total = completedCount.value + pendingCount.value + rejectedCount.value
  return total > 0 ? Math.round((completedCount.value / total) * 100) : 0
})

function getProgressClass(rate: number) {
  if (rate >= 80) return 'cell-progress-fill--high'
  if (rate >= 40) return 'cell-progress-fill--mid'
  return 'cell-progress-fill--low'
}

function getStatusClass(status: string) {
  const map: Record<string, string> = {
    completed: 'status-tag--success',
    pending: 'status-tag--warning',
    rejected: 'status-tag--danger',
    in_progress: 'status-tag--primary'
  }
  return map[status] || 'status-tag--default'
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    completed: '已完成',
    pending: '未填报',
    rejected: '已退回',
    in_progress: '填报中'
  }
  return map[status] || status
}

function handleSelectionChange(rows: any[]) {
  selectedRows.value = rows
}

function handleFilter() {
  loadData()
}

function handleReset() {
  filterForm.value = { category: '', status: '', period: '' }
  loadData()
}

function handleExport() {
  ElMessage.success('导出功能开发中')
}

function handleBatchRemind() {
  remindDialogVisible.value = true
}

function handleViewDetail(row: any) {
  currentDetail.value = {
    ...row,
    details: [
      { name: '生产统计表', filler: '张三', fillTime: '2024-07-05 14:30', statusText: '已完成', auditor: '李四', auditTime: '2024-07-05 15:00' },
      { name: '综合统计表', filler: '王五', fillTime: '', statusText: '未填报', auditor: '', auditTime: '' },
      { name: '投资统计表', filler: '赵六', fillTime: '2024-07-04 10:00', statusText: '已退回', auditor: '李四', auditTime: '2024-07-04 11:30' }
    ]
  }
  detailDialogVisible.value = true
}

function handleRemind(row: any) {
  remindRecipients.value = [{ id: row.orgId, name: row.orgName }]
  remindForm.value = {
    recipient: [row.orgId],
    content: `请尽快完成报表填报，当前进度：${row.rate}%`
  }
  remindDialogVisible.value = true
}

function handleSendRemind() {
  ElMessage.success('催办通知已发送')
  remindDialogVisible.value = false
}

function handleSizeChange(size: number) {
  pagination.value.size = size
  loadData()
}

function handleCurrentChange(page: number) {
  pagination.value.page = page
  loadData()
}

async function loadData() {
  loading.value = true
  try {
    if (activeDimension.value === 'unit') {
      tableData.value = [
        { id: 1, orgName: '第一分公司', reportCount: 12, completed: 10, pending: 1, rejected: 1, rate: 83, status: 'in_progress', deadline: '2024-07-15' },
        { id: 2, orgName: '第二分公司', reportCount: 10, completed: 10, pending: 0, rejected: 0, rate: 100, status: 'completed', deadline: '2024-07-15' },
        { id: 3, orgName: '第三分公司', reportCount: 8, completed: 4, pending: 3, rejected: 1, rate: 50, status: 'pending', deadline: '2024-07-15' },
        { id: 4, orgName: '第四分公司', reportCount: 15, completed: 8, pending: 5, rejected: 2, rate: 53, status: 'pending', deadline: '2024-07-15' },
        { id: 5, orgName: '第五分公司', reportCount: 9, completed: 9, pending: 0, rejected: 0, rate: 100, status: 'completed', deadline: '2024-07-15' },
        { id: 6, orgName: '第六分公司', reportCount: 11, completed: 6, pending: 4, rejected: 1, rate: 55, status: 'pending', deadline: '2024-07-15' },
        { id: 7, orgName: '第七分公司', reportCount: 7, completed: 7, pending: 0, rejected: 0, rate: 100, status: 'completed', deadline: '2024-07-15' },
        { id: 8, orgName: '第八分公司', reportCount: 13, completed: 3, pending: 8, rejected: 2, rate: 23, status: 'pending', deadline: '2024-07-15' },
      ]
    } else {
      tableData.value = [
        { id: 1, reportName: '生产统计表', orgName: '第一分公司', completed: 6, pending: 2, rejected: 0, rate: 75, status: 'in_progress', deadline: '2024-07-15' },
        { id: 2, reportName: '综合统计表', orgName: '第一分公司', completed: 3, pending: 5, rejected: 1, rate: 38, status: 'pending', deadline: '2024-07-15' },
        { id: 3, reportName: '投资统计表', orgName: '第二分公司', completed: 8, pending: 0, rejected: 0, rate: 100, status: 'completed', deadline: '2024-07-15' },
        { id: 4, reportName: '销售统计表', orgName: '第三分公司', completed: 4, pending: 4, rejected: 0, rate: 50, status: 'pending', deadline: '2024-07-15' },
        { id: 5, reportName: '财务统计表', orgName: '第四分公司', completed: 7, pending: 1, rejected: 1, rate: 78, status: 'in_progress', deadline: '2024-07-15' },
        { id: 6, reportName: '人力统计表', orgName: '第五分公司', completed: 5, pending: 3, rejected: 0, rate: 63, status: 'in_progress', deadline: '2024-07-15' },
      ]
    }
    pagination.value.total = tableData.value.length
  } catch (error) {
    console.error('加载数据失败:', error)
    tableData.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.report-status-page {
  padding: 24px;
  max-width: 1440px;
  margin: 0 auto;

  .rsp-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    .rsp-header-left {
      .rsp-title {
        font-size: 22px;
        font-weight: 700;
        color: #1E293B;
        margin: 0 0 4px 0;
      }
      .rsp-subtitle {
        font-size: 14px;
        color: #64748B;
        margin: 0;
      }
    }

    .rsp-export-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 20px;
      background: #2563EB;
      color: #fff;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      &:hover {
        background: #1D4ED8;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(37,99,235,0.3);
      }
    }
  }

  .rsp-dimension-tabs {
    display: inline-flex;
    gap: 8px;
    margin-bottom: 20px;
    padding: 6px;
    background: #F8FAFC;
    border-radius: 10px;

    .rsp-dimension-tab {
      padding: 8px 24px;
      background: transparent;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      color: #64748B;
      cursor: pointer;
      transition: all 0.2s;
      &:hover { color: #2563EB; }
      &.active {
        background: #fff;
        color: #2563EB;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      }
    }
  }

  .rsp-filter-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    background: #fff;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    margin-bottom: 20px;

    .rsp-filter-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .rsp-filter-select {
      width: 160px;
    }

    .rsp-filter-date {
      width: 160px;
    }

    .rsp-filter-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 16px;
      background: #2563EB;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      &:hover { background: #1D4ED8; }
    }

    .rsp-reset-btn {
      padding: 8px 16px;
      background: #F1F5F9;
      color: #64748B;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      &:hover { background: #E2E8F0; }
    }
  }

  .rsp-stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 20px;

    .rsp-stat-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 20px;
      background: #fff;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      transition: all 0.2s;
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.06);
      }

      .rsp-stat-icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        &--total { background: rgba(37,99,235,0.1); color: #2563EB; }
        &--completed { background: rgba(20,184,166,0.1); color: #14B8A6; }
        &--pending { background: rgba(245,158,11,0.1); color: #F59E0B; }
        &--rejected { background: rgba(239,68,68,0.1); color: #EF4444; }
      }

      .rsp-stat-content {
        .rsp-stat-value {
          font-size: 26px;
          font-weight: 700;
          color: #1E293B;
          line-height: 1;
        }
        .rsp-stat-label {
          font-size: 13px;
          color: #64748B;
          margin-top: 4px;
        }
      }
    }
  }

  .rsp-progress-overview {
    padding: 20px;
    background: #fff;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    margin-bottom: 20px;

    .rsp-progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .rsp-progress-title {
        font-size: 14px;
        font-weight: 600;
        color: #475569;
      }
      .rsp-progress-rate {
        font-size: 24px;
        font-weight: 700;
        color: #2563EB;
      }
    }

    .rsp-progress-bar {
      height: 10px;
      background: #E2E8F0;
      border-radius: 5px;
      overflow: hidden;

      .rsp-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #2563EB, #1D4ED8);
        border-radius: 5px;
        transition: width 0.5s ease;
      }
    }
  }

  .rsp-table-container {
    background: #fff;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    overflow: hidden;

    .rsp-table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #E2E8F0;

      .rsp-table-title {
        font-size: 15px;
        font-weight: 600;
        color: #1E293B;
      }

      .rsp-table-actions {
        display: flex;
        gap: 8px;

        .rsp-action-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 14px;
          background: #F1F5F9;
          color: #475569;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          &:hover:not(:disabled) { background: #E2E8F0; }
          &:disabled { opacity: 0.5; cursor: not-allowed; }
        }
      }
    }
  }

  .cell-progress {
    display: flex;
    align-items: center;
    gap: 8px;

    .cell-progress-bar {
      flex: 1;
      height: 6px;
      background: #E2E8F0;
      border-radius: 3px;
      overflow: hidden;

      .cell-progress-fill {
        height: 100%;
        border-radius: 3px;
        transition: width 0.3s ease;

        &--high { background: #14B8A6; }
        &--mid { background: #F59E0B; }
        &--low { background: #EF4444; }
      }
    }

    .cell-progress-rate {
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      min-width: 36px;
      text-align: right;
    }
  }

  .status-tag {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;

    &--success { background: rgba(20,184,166,0.08); color: #14B8A6; }
    &--warning { background: rgba(245,158,11,0.08); color: #F59E0B; }
    &--danger { background: rgba(239,68,68,0.08); color: #EF4444; }
    &--primary { background: rgba(37,99,235,0.08); color: #2563EB; }
    &--default { background: rgba(148,163,184,0.08); color: #94A3B8; }
  }

  .rsp-btn {
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
    margin-right: 6px;

    &--primary {
      background: rgba(37,99,235,0.08);
      color: #2563EB;
      &:hover { background: rgba(37,99,235,0.15); }
    }

    &--warning {
      background: rgba(245,158,11,0.08);
      color: #F59E0B;
      &:hover { background: rgba(245,158,11,0.15); }
    }
  }

  .rsp-pagination {
    padding: 16px 20px;
    border-top: 1px solid #E2E8F0;
    display: flex;
    justify-content: flex-end;
  }

  .rsp-detail-content {
    .rsp-detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      h3 {
        font-size: 16px;
        font-weight: 600;
        color: #1E293B;
        margin: 0;
      }
    }
  }

  @media (max-width: 1024px) {
    .rsp-stats-row { grid-template-columns: repeat(2, 1fr); }
    .rsp-filter-bar { flex-wrap: wrap; }
  }

  @media (max-width: 640px) {
    .rsp-stats-row { grid-template-columns: 1fr; }
    .rsp-header { flex-direction: column; align-items: flex-start; gap: 12px; }
  }
}
</style>