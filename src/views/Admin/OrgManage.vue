<template>
  <div class="page-org-manage">
    <el-card shadow="never">
      <template #header>
        <div class="om-header">
          <span>组织架构管理</span>
          <el-button type="primary" size="small" @click="openCreate(null)">+ 新建组织</el-button>
        </div>
      </template>

      <el-table :data="flatOrgs" v-loading="loading" row-key="orgId" border stripe>
        <el-table-column prop="orgId" label="ID" width="70" />
        <el-table-column prop="orgName" label="组织名称" min-width="200">
          <template #default="{ row }">
            <span :style="{ paddingLeft: row._level * 20 + 'px' }">
              {{ row._level > 0 ? '└ ' : '' }}{{ row.orgName }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="orgCode" label="编码" width="120" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ orgTypeMap[row.orgType] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="70" />
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="openCreate(row)">添加子节点</el-button>
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

    <el-dialog v-model="formVisible" :title="editingOrg ? '编辑组织' : '新建组织'" width="450px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="组织名称" required>
          <el-input v-model="form.orgName" />
        </el-form-item>
        <el-form-item label="组织编码" required>
          <el-input v-model="form.orgCode" :disabled="!!editingOrg" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.orgType" style="width:100%">
            <el-option label="集团" :value="1" />
            <el-option label="公司" :value="2" />
            <el-option label="部门" :value="3" />
            <el-option label="岗位" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="上级组织">
          <el-input :value="parentOrg?.orgName || '根节点'" disabled />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
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

const loading = ref(false)
const orgTree = ref([])
const flatOrgs = ref([])
const formVisible = ref(false)
const editingOrg = ref(null)
const parentOrg = ref(null)

const form = reactive({ orgName: '', orgCode: '', orgType: 1, parentId: 0, sort: 0 })
const orgTypeMap = { 1: '集团', 2: '公司', 3: '部门', 4: '岗位' }

onMounted(() => loadData())

const mockOrgTree = [
  { orgId: 1, orgCode: 'GROUP', orgName: '集团公司', orgType: 1, sort: 0, children: [
    { orgId: 2, orgCode: 'MINE_A', orgName: 'A煤矿', orgType: 2, sort: 0, children: [
      { orgId: 5, orgCode: 'MINE_A_PROD', orgName: '生产部', orgType: 3, sort: 0 },
      { orgId: 6, orgCode: 'MINE_A_SAFE', orgName: '安环部', orgType: 3, sort: 1 }
    ]},
    { orgId: 3, orgCode: 'MINE_B', orgName: 'B煤矿', orgType: 2, sort: 1, children: [
      { orgId: 7, orgCode: 'MINE_B_PROD', orgName: '生产部', orgType: 3, sort: 0 }
    ]},
    { orgId: 4, orgCode: 'COAL_TRADE', orgName: '煤炭贸易公司', orgType: 2, sort: 2 }
  ]}
]

async function loadData() {
  loading.value = true
  try {
    const res = await getOrgTree()
    orgTree.value = res.data || res || (Array.isArray(res) ? res : [])
    if (!orgTree.value.length) throw new Error('mock')
  } catch (e) {
    orgTree.value = mockOrgTree
    if (e.message !== 'mock') console.warn('[OrgManage] API不可用，使用mock数据')
  }
  flatOrgs.value = flattenTree(orgTree.value)
  loading.value = false
}

function flattenTree(nodes, level = 0) {
  let result = []
  for (const node of nodes) {
    result.push({ ...node, _level: level })
    if (node.children?.length) result = result.concat(flattenTree(node.children, level + 1))
  }
  return result
}

function openCreate(parent) {
  editingOrg.value = null; parentOrg.value = parent
  form.parentId = parent?.orgId || 0
  Object.assign(form, { orgName: '', orgCode: '', orgType: 1, sort: 0 })
  formVisible.value = true
}

function openEdit(row) { editingOrg.value = row; parentOrg.value = null; Object.assign(form, row); formVisible.value = true }

async function handleSave() {
  try {
    if (editingOrg.value) { await updateOrg(editingOrg.value.orgId, form) } else { await createOrg(form) }
    ElMessage.success('保存成功'); formVisible.value = false; loadData()
  } catch (e) { ElMessage.error('保存失败') }
}

async function handleDelete(row) {
  await deleteOrg(row.orgId); ElMessage.success('已删除'); loadData()
}
</script>

<style lang="scss" scoped>
.page-org-manage { }
.om-header { display: flex; justify-content: space-between; align-items: center; }
</style>
