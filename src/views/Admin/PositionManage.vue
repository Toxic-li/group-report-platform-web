<template>
  <div class="page-position-manage">
    <el-card shadow="never">
      <template #header>
        <div class="pm-header">
          <span>岗位管理</span>
          <el-button type="primary" size="small" @click="openCreate">+ 新建岗位</el-button>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="orgName" label="岗位名称" min-width="150" />
        <el-table-column prop="orgCode" label="岗位编码" width="130" />
        <el-table-column label="所属部门" min-width="150">
          <template #default="{ row }">
            {{ getParentName(row.parentId) }}
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="70" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button text size="small" @click="openEdit(row)">编辑</el-button>
            <el-popconfirm title="确定删除?" @confirm="handleDelete(row)">
              <template #reference>
                <el-button text type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog v-model="formVisible" :title="editing ? '编辑岗位' : '新建岗位'" width="450px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="岗位名称" required>
          <el-input v-model="form.orgName" />
        </el-form-item>
        <el-form-item label="岗位编码" required>
          <el-input v-model="form.orgCode" :disabled="!!editing" />
        </el-form-item>
        <el-form-item label="所属部门">
          <el-tree-select
            v-model="form.parentId"
            :data="deptTree"
            check-strictly
            :props="{ label: 'orgName', value: 'id', children: 'children' }"
            placeholder="请选择所属部门"
            style="width:100%"
            clearable
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getOrgTree, createOrg, updateOrg, deleteOrg } from '@/api/org.js'
import { isMockEnabled } from '@/utils/mockConfig.js'

const loading = ref(false)
const tableData = ref([])
const deptTree = ref([])
const allOrgs = ref([])
const formVisible = ref(false)
const editing = ref(null)

const form = reactive({ orgName: '', orgCode: '', parentId: 0, sortOrder: 0, status: 1 })

onMounted(() => loadData())

const mockOrgTree = [
  { id: 1, orgCode: 'GROUP', orgName: '集团公司', orgType: 1, sort: 0, children: [
    { id: 2, orgCode: 'MINE_A', orgName: 'A煤矿', orgType: 2, sort: 0, children: [
      { id: 5, orgCode: 'MINE_A_PROD', orgName: '生产部', orgType: 3, sort: 0 },
      { id: 6, orgCode: 'MINE_A_SAFE', orgName: '安环部', orgType: 3, sort: 1 }
    ]},
    { id: 3, orgCode: 'MINE_B', orgName: 'B煤矿', orgType: 2, sort: 1, children: [
      { id: 7, orgCode: 'MINE_B_PROD', orgName: '生产部', orgType: 3, sort: 0 }
    ]},
    { id: 4, orgCode: 'COAL_TRADE', orgName: '煤炭贸易公司', orgType: 2, sort: 2 }
  ]}
]

const mockPositions = [
  { id: 10, orgCode: 'POS_MGR', orgName: '部门经理', orgType: 4, parentId: 5, sortOrder: 0, status: 1 },
  { id: 11, orgCode: 'POS_ENG', orgName: '采矿工程师', orgType: 4, parentId: 5, sortOrder: 1, status: 1 },
  { id: 12, orgCode: 'POS_SAFE', orgName: '安全员', orgType: 4, parentId: 6, sortOrder: 0, status: 1 },
  { id: 13, orgCode: 'POS_ACCT', orgName: '会计', orgType: 4, parentId: 4, sortOrder: 0, status: 1 }
]

async function loadData() {
  loading.value = true
  try {
    const res = await getOrgTree()
    const tree = res.data || res || (Array.isArray(res) ? res : [])
    allOrgs.value = flattenTree(tree)
    deptTree.value = filterDeptTree(tree)
    tableData.value = allOrgs.value.filter(o => o.orgType === 4)
    if (!tableData.value.length && isMockEnabled()) throw new Error('mock')
  } catch (e) {
    if (isMockEnabled()) {
      allOrgs.value = flattenTree(mockOrgTree).concat(mockPositions)
      deptTree.value = mockOrgTree
      tableData.value = mockPositions
      if (e.message !== 'mock') console.warn('[PositionManage] API不可用，使用mock数据')
    } else {
      tableData.value = []
      ElMessage.error('加载岗位列表失败')
    }
  }
  loading.value = false
}

function flattenTree(nodes) {
  let result = []
  for (const node of nodes) {
    result.push(node)
    if (node.children?.length) result = result.concat(flattenTree(node.children))
  }
  return result
}

function filterDeptTree(nodes) {
  return nodes.map(node => {
    const children = node.children ? filterDeptTree(node.children) : []
    const filtered = { ...node, children: children.length ? children : undefined }
    if (node.orgType === 4) return null
    return filtered
  }).filter(Boolean)
}

function getParentName(parentId) {
  if (!parentId || parentId === 0) return '—'
  const parent = allOrgs.value.find(o => o.id === parentId)
  return parent ? parent.orgName : '—'
}

function openCreate() {
  editing.value = null
  Object.assign(form, { orgName: '', orgCode: '', parentId: 0, sortOrder: 0, status: 1 })
  formVisible.value = true
}

function openEdit(row) {
  editing.value = row
  Object.assign(form, {
    orgName: row.orgName,
    orgCode: row.orgCode,
    parentId: row.parentId || 0,
    sortOrder: row.sortOrder || row.sort || 0,
    status: row.status != null ? row.status : 1
  })
  formVisible.value = true
}

async function handleSave() {
  try {
    const payload = {
      orgName: form.orgName,
      orgCode: form.orgCode,
      orgType: 4,
      parentId: form.parentId || 0,
      sortOrder: form.sortOrder || 0,
      status: form.status
    }
    if (editing.value) {
      await updateOrg(editing.value.id, payload)
    } else {
      await createOrg(payload)
    }
    ElMessage.success('保存成功')
    formVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

async function handleDelete(row) {
  try {
    await deleteOrg(row.id)
    ElMessage.success('已删除')
    loadData()
  } catch (e) {
    ElMessage.error('删除失败')
  }
}
</script>

<style lang="scss" scoped>
.page-position-manage { height: 100%; overflow-y: auto; padding: var(--app-content-padding); }
.pm-header { display: flex; justify-content: space-between; align-items: center; }
</style>