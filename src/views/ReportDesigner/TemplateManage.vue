<template>
  <div class="template-manage">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">模板管理</h1>
        <p class="page-desc">管理所有报表模板，支持创建、编辑、复制和删除</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleCreate">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          新建模板
        </el-button>
      </div>
    </div>

    <div class="content-card">
      <div class="filter-bar">
        <el-input v-model="query.name" placeholder="搜索模板名称或编号" class="search-input" clearable @keyup.enter="handleSearch">
          <template #prefix>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </template>
        </el-input>
        <el-select v-model="query.templateType" placeholder="模板类型" style="width: 140px" clearable @change="handleSearch">
          <el-option label="统计报表" :value="1" />
          <el-option label="填报报表" :value="2" />
          <el-option label="汇总报表" :value="3" />
        </el-select>
        <el-select v-model="query.status" placeholder="状态" style="width: 120px" clearable @change="handleSearch">
          <el-option label="草稿" :value="0" />
          <el-option label="已发布" :value="1" />
          <el-option label="已停用" :value="2" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
        <div class="filter-spacer"></div>
        <el-button
          type="danger"
          :disabled="selectedRows.length === 0"
          @click="handleBatchDelete"
        >
          批量删除{{ selectedRows.length > 0 ? ` (${selectedRows.length})` : '' }}
        </el-button>
      </div>

      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="tableData"
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="45" />
        <el-table-column prop="templateCode" label="模板编号" width="160" />
        <el-table-column prop="templateName" label="模板名称" width="200" />
        <el-table-column prop="templateType" label="类型" width="110">
          <template #default="{ row }">{{ getTypeText(row.templateType) }}</template>
        </el-table-column>
        <el-table-column prop="version" label="版本" width="80" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="createTime" label="创建时间" width="170">
          <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="170">
          <template #default="{ row }">{{ formatDate(row.updateTime) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" @click="handlePreview(row)">预览</el-button>
            <el-button text size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button text size="small" @click="handleCopy(row)">复制</el-button>
            <el-button text size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="query.current"
          v-model:page-size="query.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { getTemplateList, copyTemplate, deleteTemplate, batchDeleteTemplates } from '@/api/reportDesigner.js'

const router = useRouter()
const loading = ref(false)
const total = ref(0)
const tableData = ref([])
const tableRef = ref(null)
const selectedRows = ref([])

function handleSelectionChange(rows) {
  selectedRows.value = rows
}

const query = reactive({
  name: '',
  templateType: '',
  status: '',
  current: 1,
  size: 10
})

async function fetchList() {
  loading.value = true
  try {
    const params = {
      current: query.current,
      size: query.size
    }
    if (query.name) params.name = query.name
    if (query.templateType !== '' && query.templateType !== null && query.templateType !== undefined) {
      params.templateType = query.templateType
    }
    if (query.status !== '' && query.status !== null && query.status !== undefined) {
      params.status = query.status
    }
    const res = await getTemplateList(params)
    const data = res?.data || res
    if (data) {
      tableData.value = data.records || data.list || []
      total.value = data.total || 0
    } else {
      tableData.value = []
      total.value = 0
    }
  } catch (err) {
    console.error('获取模板列表失败:', err)
    ElMessage.error('获取模板列表失败')
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.current = 1
  fetchList()
}

function handleReset() {
  query.name = ''
  query.templateType = ''
  query.status = ''
  query.current = 1
  fetchList()
}

function getTypeText(type) {
  const texts = { 1: '统计报表', 2: '填报报表', 3: '汇总报表' }
  return texts[type] || '未知'
}

function getStatusText(status) {
  const texts = { 0: '草稿', 1: '已发布', 2: '已停用' }
  return texts[status] || '未知'
}

function getStatusType(status) {
  const types = { 0: 'info', 1: 'success', 2: 'danger' }
  return types[status] || 'info'
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return String(dateStr).replace('T', ' ').substring(0, 19)
}

function handleCreate() {
  router.push('/designer')
}

function handlePreview(row) {
  router.push(`/designer/templates/${row.id}/preview`)
}

function handleEdit(row) {
  router.push({ path: '/designer', query: { templateId: row.id } })
}

async function handleCopy(row) {
  try {
    await ElMessageBox.confirm(`确定复制模板"${row.templateName}"吗？`, '确认复制', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    const res = await copyTemplate(row.id, row.templateName + ' - 副本')
    ElMessage.success('复制成功')
    fetchList()
  } catch (err) {
    if (err !== 'cancel') {
      console.error('复制模板失败:', err)
      ElMessage.error(err?.message || '复制失败')
    }
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除模板"${row.templateName}"吗？`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteTemplate(row.id)
    ElMessage.success('删除成功')
    if (tableData.value.length === 1 && query.current > 1) {
      query.current--
    }
    fetchList()
  } catch (err) {
    if (err !== 'cancel') {
      console.error('删除模板失败:', err)
      ElMessage.error(err?.message || '删除失败')
    }
  }
}

async function handleBatchDelete() {
  if (selectedRows.value.length === 0) return
  const count = selectedRows.value.length
  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${count} 个模板吗？此操作不可撤销。`,
      '批量删除确认',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    )
    const ids = selectedRows.value.map(r => r.id)
    await batchDeleteTemplates(ids)
    ElMessage.success(`成功删除 ${count} 个模板`)
    selectedRows.value = []
    if (tableData.value.length === count && query.current > 1) {
      query.current--
    }
    fetchList()
  } catch (err) {
    if (err !== 'cancel') {
      console.error('批量删除失败:', err)
      ElMessage.error(err?.message || '批量删除失败')
    }
  }
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.template-manage {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  .page-title {
    font-size: 20px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
  }
  .page-desc {
    font-size: 14px;
    color: #666;
    margin: 4px 0 0;
  }
}

.content-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-spacer {
  flex: 1;
}

.search-input {
  width: 280px;
}

.pagination-wrap {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
