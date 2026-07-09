<template>
  <div class="datasource-manage">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">数据源管理</h1>
        <p class="page-desc">管理系统连接的各类数据库和API数据源</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleCreate">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          新建数据源
        </el-button>
      </div>
    </div>

    <div class="content-card">
      <div class="filter-bar">
        <el-input v-model="filterKeyword" placeholder="搜索数据源名称" class="search-input">
          <template #prefix>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </template>
        </el-input>
        <el-select v-model="filterType" placeholder="数据源类型" style="width: 140px">
          <el-option label="全部" value=""/>
          <el-option label="MySQL" value="mysql"/>
          <el-option label="Oracle" value="oracle"/>
          <el-option label="SQL Server" value="sqlserver"/>
          <el-option label="API接口" value="api"/>
        </el-select>
      </div>

      <el-table :data="filteredDatasources" border style="width: 100%">
        <el-table-column prop="name" label="数据源名称" width="180" />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">{{ getTypeText(row.type) }}</template>
        </el-table-column>
        <el-table-column prop="host" label="主机/地址" width="200" />
        <el-table-column prop="port" label="端口" width="80" />
        <el-table-column prop="database" label="数据库/路径" width="150" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'connected' ? 'success' : 'danger'" size="small">
              {{ row.status === 'connected' ? '连接正常' : '断开' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" @click="handleTest(row)">测试连接</el-button>
            <el-button text size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button text size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const filterKeyword = ref('')
const filterType = ref('')

const datasources = ref([
  { id: 1, name: 'MySQL-生产库', type: 'mysql', host: '192.168.1.100', port: '3306', database: 'production', username: 'admin', status: 'connected', createTime: '2024-01-10 09:00' },
  { id: 2, name: 'Oracle-财务库', type: 'oracle', host: '192.168.1.101', port: '1521', database: 'finance', username: 'fin_user', status: 'connected', createTime: '2024-01-08 10:00' },
  { id: 3, name: 'SQL Server-人事库', type: 'sqlserver', host: '192.168.1.102', port: '1433', database: 'hr_db', username: 'hr_user', status: 'connected', createTime: '2024-01-05 08:00' },
  { id: 4, name: 'HR系统API', type: 'api', host: 'https://hr.example.com', port: '', database: '/api/v1', username: '', status: 'disconnected', createTime: '2024-01-03 14:00' }
])

const filteredDatasources = computed(() => {
  return datasources.value.filter(d => {
    const matchKeyword = !filterKeyword.value || d.name.includes(filterKeyword.value)
    const matchType = !filterType.value || d.type === filterType.value
    return matchKeyword && matchType
  })
})

function getTypeText(type) {
  const texts = {
    mysql: 'MySQL',
    oracle: 'Oracle',
    sqlserver: 'SQL Server',
    api: 'API接口'
  }
  return texts[type] || type
}

function handleCreate() {
  alert('新建数据源')
}

function handleTest(row) {
  console.log('测试连接:', row)
}

function handleEdit(row) {
  console.log('编辑:', row)
}

function handleDelete(row) {
  console.log('删除:', row)
}
</script>

<style scoped>
.datasource-manage {
  padding: var(--app-content-padding);
  height: 100%;
  overflow-y: auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--app-space-6);
}

.header-left {
  .page-title {
    font-size: var(--app-font-h4);
    font-weight: var(--app-font-bold);
    color: var(--app-text-primary);
    margin: 0;
  }
  .page-desc {
    font-size: var(--app-font-caption);
    color: var(--app-text-secondary);
    margin: var(--app-space-1) 0 0;
  }
}

.content-card {
  background: var(--app-surface);
  border-radius: var(--app-card-radius);
  padding: var(--app-space-6);
  box-shadow: var(--app-shadow-sm);
  border: 1px solid var(--app-border);
}

.filter-bar {
  display: flex;
  gap: var(--app-space-3);
  margin-bottom: var(--app-space-5);
  flex-wrap: wrap;
}

.search-input {
  width: 280px;
}
</style>
