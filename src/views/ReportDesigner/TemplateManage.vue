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
        <el-input v-model="filterKeyword" placeholder="搜索模板名称或编号" class="search-input">
          <template #prefix>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </template>
        </el-input>
        <el-select v-model="filterCategory" placeholder="报表分类" style="width: 140px">
          <el-option label="全部" value=""/>
          <el-option label="财务报表" value="finance"/>
          <el-option label="人事报表" value="hr"/>
          <el-option label="销售报表" value="sales"/>
          <el-option label="生产报表" value="production"/>
        </el-select>
        <el-select v-model="filterStatus" placeholder="状态" style="width: 120px">
          <el-option label="全部" value=""/>
          <el-option label="启用" value="active"/>
          <el-option label="禁用" value="disabled"/>
        </el-select>
      </div>

      <el-table :data="filteredTemplates" border style="width: 100%">
        <el-table-column prop="code" label="模板编号" width="140" />
        <el-table-column prop="name" label="模板名称" width="200" />
        <el-table-column prop="category" label="分类" width="120">
          <template #default="{ row }">{{ getCategoryText(row.category) }}</template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="creator" label="创建人" width="100" />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column prop="updateTime" label="更新时间" width="160" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" @click="handlePreview(row)">预览</el-button>
            <el-button text size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button text size="small" @click="handleCopy(row)">复制</el-button>
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
const filterCategory = ref('')
const filterStatus = ref('')

const templates = ref([
  { id: 1, code: 'TEMP-001', name: '月度销售报表', category: 'sales', description: '用于统计月度销售数据', creator: '张三', createTime: '2024-01-10 09:00', updateTime: '2024-01-15 14:00', status: 'active' },
  { id: 2, code: 'TEMP-002', name: '财务费用报表', category: 'finance', description: '用于统计财务费用支出', creator: '李四', createTime: '2024-01-08 10:00', updateTime: '2024-01-12 16:00', status: 'active' },
  { id: 3, code: 'TEMP-003', name: '人事考勤报表', category: 'hr', description: '用于统计员工考勤情况', creator: '王五', createTime: '2024-01-05 08:00', updateTime: '2024-01-14 11:00', status: 'disabled' },
  { id: 4, code: 'TEMP-004', name: '生产产量报表', category: 'production', description: '用于统计生产产量数据', creator: '赵六', createTime: '2024-01-03 14:00', updateTime: '2024-01-10 09:00', status: 'active' },
  { id: 5, code: 'TEMP-005', name: '采购成本报表', category: 'finance', description: '用于统计采购成本', creator: '孙七', createTime: '2024-01-01 16:00', updateTime: '2024-01-08 10:00', status: 'active' }
])

const filteredTemplates = computed(() => {
  return templates.value.filter(t => {
    const matchKeyword = !filterKeyword.value || t.name.includes(filterKeyword.value) || t.code.includes(filterKeyword.value)
    const matchCategory = !filterCategory.value || t.category === filterCategory.value
    const matchStatus = !filterStatus.value || t.status === filterStatus.value
    return matchKeyword && matchCategory && matchStatus
  })
})

function getCategoryText(category) {
  const texts = {
    finance: '财务报表',
    hr: '人事报表',
    sales: '销售报表',
    production: '生产报表'
  }
  return texts[category] || category
}

function handleCreate() {
  alert('新建模板')
}

function handlePreview(row) {
  console.log('预览:', row)
}

function handleEdit(row) {
  console.log('编辑:', row)
}

function handleCopy(row) {
  console.log('复制:', row)
}

function handleDelete(row) {
  console.log('删除:', row)
}
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
}

.search-input {
  width: 280px;
}
</style>
