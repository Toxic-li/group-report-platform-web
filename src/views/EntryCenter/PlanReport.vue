<template>
  <div class="plan-report">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">📋 计划上报</h1>
        <p class="page-desc">
          <span class="data-source-hint">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            本页数据 = 计划汇总/台账/完成情况菜单的 <b>唯一数据来源</b>。在此录入并提交的计划数据，将自动出现在【计划汇总】菜单中。
          </span>
        </p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="loadList">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/></svg>
          刷新
        </el-button>
      </div>
    </div>

    <div class="content-card">
      <!-- 计划任务列表（来源：admin 计划下发） -->
      <div class="filter-bar">
        <el-input v-model="query.name" placeholder="搜索计划名称" class="search-input" clearable @keyup.enter="loadList">
          <template #prefix>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </template>
        </el-input>
        <el-select v-model="query.year" placeholder="年度" style="width: 120px" clearable @change="loadList">
          <el-option v-for="y in yearOptions" :key="y" :label="y + '年'" :value="y" />
        </el-select>
        <el-select v-model="query.status" placeholder="状态" style="width: 140px" clearable @change="loadList">
          <el-option label="待填报" value="PENDING" />
          <el-option label="已提交" value="SUBMITTED" />
          <el-option label="已审核" value="APPROVED" />
          <el-option label="已退回" value="REJECTED" />
        </el-select>
        <el-button type="primary" @click="loadList">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <!-- 数据来源说明 -->
      <el-alert
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 16px;"
      >
        <template #title>
          <div style="font-size: 14px; line-height: 1.6;">
            <b>📊 数据链路</b>：计划汇总 → 计划模板（planFlag=1） → 计划下发 → <b>本页（计划上报）</b> → 计划数据落库 → 计划汇总/台账/完成情况
          </div>
        </template>
      </el-alert>

      <el-table
        v-loading="loading"
        :data="tableData"
        border
        style="width: 100%"
        :empty-text="emptyText"
      >
        <el-table-column prop="templateName" label="计划名称" min-width="200">
          <template #default="{ row }">
            <div style="font-weight: 500; color: #303133;">{{ row.templateName || '-' }}</div>
            <div style="font-size: 12px; color: #909399;">{{ row.templateCode }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="templateType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" type="danger" effect="plain">📋 计划</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="period" label="期间" width="120">
          <template #default="{ row }">{{ row.period || '-' }}</template>
        </el-table-column>
        <el-table-column prop="deadline" label="截止日期" width="140">
          <template #default="{ row }">
            <span v-if="row.deadline" :class="{ 'text-danger': isOverdue(row.deadline) && row.status !== 'APPROVED' }">
              {{ row.deadline }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="最近操作" width="170">
          <template #default="{ row }">{{ formatDate(row.updateTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="!row.submitId"
              type="primary"
              size="small"
              @click="handleFill(row)"
            >
              开始填报
            </el-button>
            <el-button
              v-else
              :type="row.status === 'APPROVED' ? 'info' : 'primary'"
              size="small"
              @click="handleFill(row)"
            >
              {{ row.status === 'APPROVED' ? '查看' : (row.status === 'REJECTED' ? '重新填报' : '继续填报') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { get } from '@/utils/http'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const tableData = ref([])
const query = reactive({
  name: '',
  year: '',
  status: ''
})

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  return [currentYear - 1, currentYear, currentYear + 1]
})

const emptyText = computed(() => {
  if (loading.value) return '加载中...'
  return '暂无计划任务。请联系集团管理员在【模板管理-计划下发】中将计划模板下发到本组织。'
})

onMounted(() => {
  loadList()
})

async function loadList() {
  loading.value = true
  try {
    // 1. 获取已标记为计划类的模板（planFlag=1）
    const planTemplatesRes = await get('/plan/templates')
    const planTemplates = planTemplatesRes?.data?.data || []

    if (planTemplates.length === 0) {
      tableData.value = []
      loading.value = false
      return
    }

    // 2. 获取当前用户已下发的任务（按 status 过滤）
    const params = new URLSearchParams()
    if (query.name) params.append('keyword', query.name)
    if (query.year) params.append('year', query.year)
    if (query.status) params.append('status', query.status)

    const submitRes = await get(`/filling/my?${params.toString()}`).catch(() => ({ data: { records: [] } }))
    const submits = submitRes?.data?.data?.records || submitRes?.data?.records || submitRes?.data?.data || submitRes?.data || []

    // 3. 合并数据：每个计划模板对应一个填报任务
    const submitMap = new Map()
    if (Array.isArray(submits)) {
      submits.forEach(s => {
        if (s.templateId) {
          submitMap.set(s.templateId, s)
        }
      })
    }

    // 过滤出已下发的任务（只显示下发给当前用户的）
    tableData.value = planTemplates
      .map(tpl => {
        const submit = submitMap.get(tpl.id)
        return {
          templateId: tpl.id,
          templateName: tpl.name,
          templateCode: tpl.code,
          templateType: 'plan',
          period: submit?.period || (query.year || String(new Date().getFullYear())),
          deadline: submit?.deadline || null,
          status: submit?.submitStatus || 'PENDING',
          updateTime: submit?.updateTime || tpl.updateTime,
          submitId: submit?.id || null
        }
      })
      .filter(item => submitMap.has(item.templateId) || query.status === 'PENDING')

  } catch (e) {
    console.error('加载计划任务失败:', e)
    tableData.value = []
  } finally {
    loading.value = false
  }
}

function handleReset() {
  query.name = ''
  query.year = ''
  query.status = ''
  loadList()
}

function handleFill(row) {
  if (row.submitId) {
    router.push({
      name: 'EntryPlanDetail',
      params: { submitId: row.submitId },
      query: { backUrl: route.fullPath }
    })
  } else {
    router.push({
      path: `/report/${row.templateId}`,
      query: { mode: 'edit', backUrl: route.fullPath }
    })
  }
}

function getStatusType(status) {
  const types = {
    'PENDING': 'warning',
    'SUBMITTED': 'primary',
    'APPROVED': 'success',
    'REJECTED': 'danger',
    'REPORTED': 'info'
  }
  return types[status] || ''
}

function getStatusText(status) {
  const texts = {
    'PENDING': '待填报',
    'SUBMITTED': '已提交',
    'APPROVED': '已审核',
    'REJECTED': '已退回',
    'REPORTED': '已上报'
  }
  return texts[status] || status
}

function isOverdue(deadline) {
  if (!deadline) return false
  return new Date(deadline) < new Date()
}

function formatDate(date) {
  if (!date) return '-'
  if (typeof date === 'string') {
    return date.replace('T', ' ').substring(0, 19)
  }
  return new Date(date).toLocaleString('zh-CN')
}
</script>

<style scoped>
.plan-report {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 20px 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 4px 0;
}

.page-desc {
  font-size: 13px;
  color: #606266;
  margin: 0;
}

.data-source-hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #67c23a;
  font-size: 13px;
}

.content-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}

.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.search-input {
  width: 220px;
}

.text-danger {
  color: #f56c6c;
  font-weight: 500;
}
</style>
