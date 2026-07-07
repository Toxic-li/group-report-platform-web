<template>
  <div class="page-role-manage">
    <el-card shadow="never">
      <template #header>
        <div class="rm-header">
          <span>角色管理</span>
          <el-button type="primary" size="small" @click="openCreate">+ 新建角色</el-button>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="roleId" label="ID" width="70" />
        <el-table-column prop="roleCode" label="角色编码" width="130" />
        <el-table-column prop="roleName" label="角色名称" width="120" />
        <el-table-column prop="description" label="描述" min-width="180" />
        <el-table-column label="数据范围" width="140">
          <template #default="{ row }">
            {{ dataScopeMap[row.dataScope] || row.dataScope }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="openPerm(row)">权限</el-button>
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

    <!-- 编辑角色 -->
    <el-dialog v-model="formVisible" :title="editingRole ? '编辑角色' : '新建角色'" width="450px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="角色编码" required>
          <el-input v-model="form.roleCode" :disabled="!!editingRole" />
        </el-form-item>
        <el-form-item label="角色名称" required>
          <el-input v-model="form.roleName" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" rows="2" />
        </el-form-item>
        <el-form-item label="数据范围">
          <el-select v-model="form.dataScope" style="width:100%">
            <el-option label="全部数据" :value="1" />
            <el-option label="本组织及下级" :value="2" />
            <el-option label="本组织" :value="3" />
            <el-option label="仅本人" :value="4" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 权限设置对话框 -->
    <el-dialog v-model="permVisible" title="权限设置" width="400px">
      <el-tree
        ref="permTreeRef"
        :data="permTree"
        show-checkbox
        node-key="permId"
        default-expand-all
        :props="{ label: 'permName', children: 'children' }"
      />
      <template #footer>
        <el-button @click="permVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSavePerm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { getRoleList, createRole, updateRole, deleteRole, bindRolePermissions } from '@/api/role.js'
import { getPermissionTree } from '@/api/role.js'

const loading = ref(false)
const tableData = ref([])
const formVisible = ref(false)
const editingRole = ref(null)

const form = reactive({ roleCode: '', roleName: '', description: '', dataScope: 1 })
const dataScopeMap = { 1: '全部数据', 2: '本组织及下级', 3: '本组织', 4: '仅本人' }

// 权限设置
const permVisible = ref(false)
const permTree = ref([])
const currentRole = ref(null)
const permTreeRef = ref(null)

onMounted(() => { loadData(); loadPermTree() })

const mockRoles = [
  { roleId: 1, roleCode: 'admin', roleName: '系统管理员', description: '拥有全部权限', dataScope: 1 },
  { roleId: 2, roleCode: 'tpl_admin', roleName: '模板管理员', description: '管理所有模板的发布与停用', dataScope: 2 },
  { roleId: 3, roleCode: 'designer', roleName: '报表设计师', description: '创建和编辑报表模板', dataScope: 3 },
  { roleId: 4, roleCode: 'filler', roleName: '填报用户', description: '填报报表数据', dataScope: 3 },
  { roleId: 5, roleCode: 'auditor', roleName: '审核人员', description: '审核报表数据', dataScope: 2 },
  { roleId: 6, roleCode: 'viewer', roleName: '只读用户', description: '查看报表和导出', dataScope: 4 }
]

const mockPermTree = [
  { permId: 1, permName: '报表中心', children: [
    { permId: 11, permName: '查看报表列表' },
    { permId: 12, permName: '填报数据' },
    { permId: 13, permName: '导出报表' }
  ]},
  { permId: 2, permName: '模板管理', children: [
    { permId: 21, permName: '创建模板' },
    { permId: 22, permName: '编辑模板' },
    { permId: 23, permName: '发布模板' },
    { permId: 24, permName: '删除模板' }
  ]},
  { permId: 3, permName: '系统管理', children: [
    { permId: 31, permName: '用户管理' },
    { permId: 32, permName: '角色管理' },
    { permId: 33, permName: '组织管理' }
  ]}
]

async function loadData() {
  loading.value = true
  try {
    const res = await getRoleList()
    tableData.value = res.data || res || []
    if (!tableData.value.length) throw new Error('mock')
  } catch (e) {
    tableData.value = mockRoles
    if (e.message !== 'mock') console.warn('[RoleManage] API不可用，使用mock数据')
  } finally { loading.value = false }
}

async function loadPermTree() {
  try {
    const res = await getPermissionTree()
    permTree.value = res.data || res || []
    if (!permTree.value.length) throw new Error('mock')
  } catch (e) {
    permTree.value = mockPermTree
  }
}

function openCreate() { editingRole.value = null; Object.assign(form, { roleCode: '', roleName: '', description: '', dataScope: 1 }); formVisible.value = true }
function openEdit(row) { editingRole.value = row; Object.assign(form, row); formVisible.value = true }

async function handleSave() {
  try {
    if (editingRole.value) { await updateRole(editingRole.value.roleId, form) } else { await createRole(form) }
    ElMessage.success('保存成功'); formVisible.value = false; loadData()
  } catch (e) { ElMessage.error('保存失败: ' + e.message) }
}

async function handleDelete(row) {
  await deleteRole(row.roleId); ElMessage.success('已删除'); loadData()
}

async function openPerm(row) {
  currentRole.value = row; permVisible.value = true
  // 回显已有权限
  nextTick(() => {
    if (row.permissions?.length) {
      permTreeRef.value?.setCheckedKeys(row.permissions.map(p => p.permId))
    }
  })
}

async function handleSavePerm() {
  const checkedIds = permTreeRef.value?.getCheckedKeys() || []
  await bindRolePermissions(currentRole.value.roleId, checkedIds)
  ElMessage.success('权限已保存'); permVisible.value = false
}
</script>

<style lang="scss" scoped>
.page-role-manage { height: 100%; overflow-y: auto; padding: 24px; }
.rm-header { display: flex; justify-content: space-between; align-items: center; }
</style>
