<template>
  <div class="page-workflow">
    <el-card shadow="never">
      <template #header><span>审批流程管理</span></template>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="processId" label="ID" width="70" />
        <el-table-column prop="processCode" label="流程编码" width="150" />
        <el-table-column prop="processName" label="流程名称" min-width="200" />
        <el-table-column prop="bizType" label="业务类型" width="160">
          <template #default="{ row }">
            <el-tag size="small">{{ bizTypeMap[row.bizType] || row.bizType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button text type="primary" size="small">编辑节点</el-button>
            <el-button text size="small">审批记录</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card shadow="never" style="margin-top:16px">
      <template #header><span>我的待办</span></template>

      <el-table :data="myTasks" v-loading="taskLoading" border stripe>
        <el-table-column prop="taskId" label="ID" width="70" />
        <el-table-column label="业务" min-width="180">
          <template #default="{ row }">
            {{ row.bizType }} - {{ row.bizId }}
          </template>
        </el-table-column>
        <el-table-column prop="applicantName" label="申请人" width="100" />
        <el-table-column prop="createdAt" label="创建时间" width="160" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="success" size="small" @click="approve(row)">通过</el-button>
            <el-button type="danger" size="small" @click="reject(row)">驳回</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!myTasks.length" description="暂无待办" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getProcessList, getMyTasks, approveTask, rejectTask } from '@/api/workflow.js'

const loading = ref(false)
const taskLoading = ref(false)
const tableData = ref([])
const myTasks = ref([])
const bizTypeMap = { template_publish: '模板发布审批', template_change: '模板变更审批' }

onMounted(() => { loadProcesses(); loadMyTasks() })

const mockProcesses = [
  { processId: 1, processCode: 'TPL_PUBLISH', processName: '模板发布审批流程', bizType: 'template_publish', status: 1 },
  { processId: 2, processCode: 'TPL_CHANGE', processName: '模板变更审批流程', bizType: 'template_change', status: 1 }
]
const mockTasks = [
  { taskId: 1, bizType: '模板发布审批', bizId: 'RPT-COAL-001', applicantName: '张三', createdAt: '2026-06-24 10:00:00' },
  { taskId: 2, bizType: '模板变更审批', bizId: 'RPT-FIN-001', applicantName: '李四', createdAt: '2026-06-23 15:30:00' }
]

async function loadProcesses() {
  loading.value = true
  try {
    const res = await getProcessList()
    tableData.value = res.data || res || []
    if (!tableData.value.length) throw new Error('mock')
  } catch (e) {
    tableData.value = mockProcesses
    if (e.message !== 'mock') console.warn('[Workflow] API不可用，使用mock数据')
  } finally { loading.value = false }
}

async function loadMyTasks() {
  taskLoading.value = true
  try {
    const res = await getMyTasks()
    myTasks.value = res.data || res || []
    if (!myTasks.value.length) throw new Error('mock')
  } catch (e) {
    myTasks.value = mockTasks
  } finally { taskLoading.value = false }
}

async function approve(row) {
  await approveTask(row.taskId, '同意')
  ElMessage.success('已通过'); loadMyTasks()
}

async function reject(row) {
  await rejectTask(row.taskId, '驳回')
  ElMessage.success('已驳回'); loadMyTasks()
}
</script>
