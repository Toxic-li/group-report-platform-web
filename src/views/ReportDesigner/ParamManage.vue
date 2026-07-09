<template>
  <div class="param-manage">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">参数管理</h1>
        <p class="page-desc">管理报表模板中使用的参数配置</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleCreate">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          新增参数
        </el-button>
      </div>
    </div>

    <div class="content-card">
      <div class="filter-bar">
        <el-input v-model="filterKeyword" placeholder="搜索参数名称或编码" class="search-input">
          <template #prefix>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </template>
        </el-input>
        <el-select v-model="filterType" placeholder="参数类型" style="width: 140px">
          <el-option label="全部" value=""/>
          <el-option label="文本" value="string"/>
          <el-option label="数字" value="number"/>
          <el-option label="日期" value="date"/>
          <el-option label="下拉选择" value="select"/>
        </el-select>
      </div>

      <el-table :data="filteredParams" border style="width: 100%">
        <el-table-column prop="name" label="参数名称" width="160" />
        <el-table-column prop="code" label="参数编码" width="140" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">{{ getTypeText(row.type) }}</template>
        </el-table-column>
        <el-table-column prop="defaultValue" label="默认值" width="150" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="required" label="必填" width="80">
          <template #default="{ row }">
            <el-tag :type="row.required ? 'danger' : 'info'" size="small">
              {{ row.required ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="bindingTemplate" label="绑定模板" width="150" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
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
const filterType = ref('')

const params = ref([
  { id: 1, name: '统计年份', code: 'STAT_YEAR', type: 'number', defaultValue: '2024', description: '报表统计的年份', required: true, bindingTemplate: '年度报表' },
  { id: 2, name: '统计月份', code: 'STAT_MONTH', type: 'select', defaultValue: '01', description: '报表统计的月份', required: true, bindingTemplate: '月度报表' },
  { id: 3, name: '组织ID', code: 'ORG_ID', type: 'string', defaultValue: '', description: '数据所属组织', required: false, bindingTemplate: '所有报表' },
  { id: 4, name: '开始日期', code: 'START_DATE', type: 'date', defaultValue: '', description: '统计开始日期', required: true, bindingTemplate: '日报表' },
  { id: 5, name: '结束日期', code: 'END_DATE', type: 'date', defaultValue: '', description: '统计结束日期', required: true, bindingTemplate: '日报表' },
  { id: 6, name: '部门名称', code: 'DEPT_NAME', type: 'select', defaultValue: '', description: '筛选的部门', required: false, bindingTemplate: '部门报表' },
  { id: 7, name: '产品类别', code: 'PRODUCT_CAT', type: 'select', defaultValue: '', description: '产品类别筛选', required: false, bindingTemplate: '销售报表' }
])

const filteredParams = computed(() => {
  return params.value.filter(p => {
    const matchKeyword = !filterKeyword.value || p.name.includes(filterKeyword.value) || p.code.includes(filterKeyword.value)
    const matchType = !filterType.value || p.type === filterType.value
    return matchKeyword && matchType
  })
})

function getTypeText(type) {
  const texts = {
    string: '文本',
    number: '数字',
    date: '日期',
    select: '下拉选择'
  }
  return texts[type] || type
}

function handleCreate() {
  alert('新增参数')
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
.param-manage {
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
