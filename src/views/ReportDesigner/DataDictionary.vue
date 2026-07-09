<template>
  <div class="data-dictionary">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">数据字典</h1>
        <p class="page-desc">管理系统中使用的各类数据字典和枚举值</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleCreate">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          新建字典
        </el-button>
      </div>
    </div>

    <div class="content-card">
      <div class="filter-bar">
        <el-input v-model="filterKeyword" placeholder="搜索字典名称或编码" class="search-input">
          <template #prefix>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </template>
        </el-input>
      </div>

      <div class="dict-tree">
        <el-tree
          :data="dictTree"
          :props="{ label: 'name', children: 'items' }"
          node-key="id"
          default-expand-all
          :expand-on-click-node="false"
        >
          <template #default="{ node, data }">
            <span class="tree-node">
              <span class="node-icon" v-if="data.type === 'group'">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
              </span>
              <span class="node-icon" v-else>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/></svg>
              </span>
              <span class="node-text">{{ data.name }}</span>
              <span class="node-code" v-if="data.code">({{ data.code }})</span>
            </span>
          </template>
        </el-tree>
      </div>

      <div class="dict-details" v-if="selectedDict">
        <div class="detail-header">
          <h3>{{ selectedDict.name }}</h3>
          <div class="detail-actions">
            <el-button text size="small" @click="handleAddItem">添加项</el-button>
            <el-button text size="small" @click="handleEditDict">编辑</el-button>
            <el-button text size="small" type="danger" @click="handleDeleteDict">删除</el-button>
          </div>
        </div>
        <el-table :data="selectedDict.items" border style="width: 100%">
          <el-table-column prop="value" label="值" width="100" />
          <el-table-column prop="label" label="标签" width="150" />
          <el-table-column prop="description" label="描述" min-width="200" />
          <el-table-column prop="sortOrder" label="排序" width="80" />
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button text size="small" @click="handleEditItem(row)">编辑</el-button>
              <el-button text size="small" type="danger" @click="handleDeleteItem(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const filterKeyword = ref('')
const selectedDict = ref(null)

const dictGroups = ref([
  {
    id: 'g1',
    name: '报表分类',
    code: 'REPORT_CATEGORY',
    type: 'group',
    items: [
      { id: 'i1', value: 'finance', label: '财务报表', description: '财务相关报表', sortOrder: 1 },
      { id: 'i2', value: 'hr', label: '人事报表', description: '人事相关报表', sortOrder: 2 },
      { id: 'i3', value: 'sales', label: '销售报表', description: '销售相关报表', sortOrder: 3 },
      { id: 'i4', value: 'production', label: '生产报表', description: '生产相关报表', sortOrder: 4 }
    ]
  },
  {
    id: 'g2',
    name: '报表状态',
    code: 'REPORT_STATUS',
    type: 'group',
    items: [
      { id: 'i5', value: 'draft', label: '草稿', description: '未提交', sortOrder: 1 },
      { id: 'i6', value: 'pending', label: '待审核', description: '等待审核', sortOrder: 2 },
      { id: 'i7', value: 'approved', label: '已通过', description: '审核通过', sortOrder: 3 },
      { id: 'i8', value: 'rejected', label: '已退回', description: '审核未通过', sortOrder: 4 }
    ]
  },
  {
    id: 'g3',
    name: '部门类型',
    code: 'DEPARTMENT_TYPE',
    type: 'group',
    items: [
      { id: 'i9', value: 'finance', label: '财务部', description: '财务部门', sortOrder: 1 },
      { id: 'i10', value: 'hr', label: '人事部', description: '人事部门', sortOrder: 2 },
      { id: 'i11', value: 'sales', label: '销售部', description: '销售部门', sortOrder: 3 },
      { id: 'i12', value: 'production', label: '生产部', description: '生产部门', sortOrder: 4 }
    ]
  }
])

const dictTree = computed(() => {
  return dictGroups.value.map(group => ({
    id: group.id,
    name: group.name,
    code: group.code,
    type: group.type,
    children: group.items.map(item => ({
      id: item.id,
      name: `${item.label} (${item.value})`,
      value: item.value,
      label: item.label,
      type: 'item'
    }))
  }))
})

function handleCreate() {
  alert('新建字典')
}

function handleAddItem() {
  alert('添加字典项')
}

function handleEditDict() {
  console.log('编辑字典:', selectedDict.value)
}

function handleDeleteDict() {
  console.log('删除字典:', selectedDict.value)
}

function handleEditItem(row) {
  console.log('编辑字典项:', row)
}

function handleDeleteItem(row) {
  console.log('删除字典项:', row)
}
</script>

<style scoped>
.data-dictionary {
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
  margin-bottom: 20px;
}

.search-input {
  width: 280px;
}

.dict-tree {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;

  .node-icon {
    color: #666;
  }

  .node-text {
    font-size: 14px;
    color: #333;
  }

  .node-code {
    font-size: 12px;
    color: #999;
  }
}

.dict-details {
  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    h3 {
      font-size: 16px;
      font-weight: 500;
      margin: 0;
    }
  }
}
</style>
