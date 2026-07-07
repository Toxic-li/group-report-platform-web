<template>
  <div class="page-log-view">
    <el-card shadow="never">
      <template #header>
        <div class="lv-header">
          <span>操作日志</span>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            size="small"
            style="width:260px"
            @change="loadData"
          />
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="logId" label="ID" width="70" />
        <el-table-column prop="username" label="用户" width="120" />
        <el-table-column prop="action" label="操作" min-width="200" />
        <el-table-column label="结果" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="loginIp" label="IP" width="140" />
        <el-table-column prop="createdAt" label="时间" width="170" />
      </el-table>

      <el-pagination
        v-model:current-page="page.current"
        :page-size="page.size"
        :total="page.total"
        layout="total, prev, pager, next"
        style="margin-top:16px; justify-content:flex-end"
        @current-change="loadData"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const dateRange = ref(null)
const page = reactive({ current: 1, size: 20, total: 0 })

onMounted(() => loadData())

const mockLogs = [
  { logId: 1, username: 'admin', action: '登录系统', status: 1, loginIp: '192.168.1.100', createdAt: '2026-06-24 09:00:00' },
  { logId: 2, username: 'zhangsan', action: '登录系统', status: 1, loginIp: '192.168.1.101', createdAt: '2026-06-24 08:30:00' },
  { logId: 3, username: 'lisi', action: '创建模板 RPT-COAL-002', status: 1, loginIp: '192.168.1.102', createdAt: '2026-06-24 08:00:00' },
  { logId: 4, username: 'wangwu', action: '登录系统', status: 0, loginIp: '10.0.0.55', createdAt: '2026-06-23 17:00:00' },
  { logId: 5, username: 'admin', action: '发布模板 RPT-FIN-001', status: 1, loginIp: '192.168.1.100', createdAt: '2026-06-23 16:00:00' }
]

async function loadData() {
  loading.value = true
  try {
    const res = await (await fetch('/api/auth/login-log?current=' + page.current + '&size=' + page.size)).json()
    tableData.value = res.data?.records || res.records || []
    page.total = res.data?.total || res.total || tableData.value.length
    if (!tableData.value.length) throw new Error('mock')
  } catch (e) {
    tableData.value = mockLogs
    page.total = mockLogs.length
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.page-log-view { height: 100%; overflow-y: auto; padding: 24px; }
.lv-header { display: flex; justify-content: space-between; align-items: center; }
</style>
