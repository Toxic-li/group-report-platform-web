<template>
  <div class="dataset-manage">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">数据集管理</h1>
        <p class="page-desc">管理报表所需的数据源和数据集</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleCreate">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          新建数据集
        </el-button>
      </div>
    </div>

    <div class="content-card">
      <div class="filter-bar">
        <el-input v-model="filterKeyword" placeholder="搜索数据集名称" class="search-input">
          <template #prefix>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </template>
        </el-input>
        <el-select v-model="filterType" placeholder="数据类型" style="width: 140px">
          <el-option label="全部" value=""/>
          <el-option label="SQL查询" value="sql"/>
          <el-option label="API接口" value="api"/>
          <el-option label="Excel导入" value="excel"/>
        </el-select>
      </div>

      <el-table :data="filteredDatasets" border style="width: 100%">
        <el-table-column prop="name" label="数据集名称" width="180" />
        <el-table-column prop="code" label="编码" width="140" />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">{{ getTypeText(row.type) }}</template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="source" label="数据源" width="150" />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button text size="small" @click="handlePreview(row)">预览数据</el-button>
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

const datasets = ref([
  { id: 1, name: '销售订单数据', code: 'DS_SALES_ORDER', type: 'sql', description: '销售订单主表数据', source: 'MySQL-生产库', createTime: '2024-01-10 09:00' },
  { id: 2, name: '产品分类数据', code: 'DS_PRODUCT_CAT', type: 'sql', description: '产品分类信息', source: 'MySQL-生产库', createTime: '2024-01-08 10:00' },
  { id: 3, name: '员工信息数据', code: 'DS_EMPLOYEE', type: 'api', description: '从HR系统获取员工信息', source: 'HR系统API', createTime: '2024-01-05 08:00' },
  { id: 4, name: '月度预算数据', code: 'DS_BUDGET_MONTH', type: 'excel', description: '月度预算导入数据', source: 'Excel文件', createTime: '2024-01-03 14:00' }
])

const filteredDatasets = computed(() => {
  return datasets.value.filter(d => {
    const matchKeyword = !filterKeyword.value || d.name.includes(filterKeyword.value) || d.code.includes(filterKeyword.value)
    const matchType = !filterType.value || d.type === filterType.value
    return matchKeyword && matchType
  })
})

function getTypeText(type) {
  const texts = {
    sql: 'SQL查询',
    api: 'API接口',
    excel: 'Excel导入'
  }
  return texts[type] || type
}

function handleCreate() {
  alert('新建数据集')
}

function handleEdit(row) {
  console.log('编辑:', row)
}

function handlePreview(row) {
  console.log('预览数据:', row)
}

function handleDelete(row) {
  console.log('删除:', row)
}
</script>

<style scoped>
.dataset-manage {
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
}

.search-input {
  width: 280px;
}
</style>
