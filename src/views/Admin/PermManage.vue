<template>
  <div class="page-perm-manage">
    <el-card shadow="never">
      <template #header>
        <div class="ppm-header">
          <span>权限管理</span>
          <el-button type="primary" size="small" @click="openCreate">+ 新建权限</el-button>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" border stripe row-key="id">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="permCode" label="权限编码" width="180" />
        <el-table-column prop="permName" label="权限名称" min-width="150" />
        <el-table-column label="分类" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="categoryType(row.category)">{{ row.category || '—' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="140" show-overflow-tooltip />
        <el-table-column label="拥有角色" min-width="200">
          <template #default="{ row }">
            <el-tag
              v-for="role in row.roleCodes"
              :key="role"
              size="small"
              :type="roleTagType(role)"
              style="margin-right: 4px"
            >
              {{ roleNameMap[role] || role }}
            </el-tag>
            <span v-if="!row.roleCodes || !row.roleCodes.length" style="color: #999">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="70" />
        <el-table-column label="操作" width="150" fixed="right">
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
    <el-dialog v-model="formVisible" :title="editing ? '编辑权限' : '新建权限'" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="权限编码" required>
          <el-input v-model="form.permCode" :disabled="!!editing" placeholder="如 menu:userManage" />
        </el-form-item>
        <el-form-item label="权限名称" required>
          <el-input v-model="form.permName" placeholder="如 用户管理" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category" style="width:100%" clearable>
            <el-option label="菜单" value="菜单" />
            <el-option label="按钮" value="按钮" />
            <el-option label="接口" value="接口" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" rows="2" />
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
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getPermissionList, createPermission, updatePermission, deletePermission } from '@/api/perm.js'
import { isMockEnabled } from '@/utils/mockConfig.js'

const loading = ref(false)
const saving = ref(false)
const tableData = ref([])
const formVisible = ref(false)
const editing = ref(null)

const form = reactive({ permCode: '', permName: '', category: '', description: '', sortOrder: 0, status: 1 })

const roleNameMap = {
  SUPER_ADMIN: '超级管理员',
  ADMIN: '管理员',
  AUDITOR: '审核员',
  REPORTER: '填报员',
  VIEWER: '观察员'
}

const rolePermissions = {
  SUPER_ADMIN: ['*:*:*'],
  ADMIN: [
    'menu:dashboard', 'menu:reportCenter', 'menu:reportFill', 'menu:auditCenter', 'menu:wordToExcel',
    'menu:admin', 'menu:userManage', 'menu:deptManage', 'menu:positionManage',
    'menu:roleManage', 'menu:permManage', 'menu:datasource', 'menu:paramConfig',
    'menu:workflow', 'menu:logCenter',
    'template:create', 'template:edit', 'template:publish', 'template:permission', 'template:delete'
  ],
  AUDITOR: ['menu:dashboard', 'menu:reportCenter', 'menu:reportFill', 'menu:auditCenter'],
  REPORTER: ['menu:dashboard', 'menu:reportCenter', 'menu:reportFill'],
  VIEWER: ['menu:dashboard', 'menu:reportCenter']
}

const mockPermissions = [
  { id: 1, permCode: 'menu:dashboard', permName: '工作台', category: '菜单', description: '工作台首页', sortOrder: 1, roleCodes: ['SUPER_ADMIN', 'ADMIN', 'AUDITOR', 'REPORTER', 'VIEWER'] },
  { id: 2, permCode: 'menu:reportCenter', permName: '报表中心', category: '菜单', description: '报表中心入口', sortOrder: 10, roleCodes: ['SUPER_ADMIN', 'ADMIN', 'AUDITOR', 'REPORTER', 'VIEWER'] },
  { id: 3, permCode: 'menu:userManage', permName: '用户管理', category: '菜单', description: '管理用户', sortOrder: 71, roleCodes: ['SUPER_ADMIN', 'ADMIN'] },
  { id: 4, permCode: 'template:create', permName: '新建模板', category: '按钮', description: '创建报表模板', sortOrder: 90, roleCodes: ['SUPER_ADMIN', 'ADMIN'] },
  { id: 5, permCode: 'menu:auditCenter', permName: '审核中心', category: '菜单', description: '审核中心入口', sortOrder: 40, roleCodes: ['SUPER_ADMIN', 'ADMIN', 'AUDITOR'] }
]

function getMockRolesForPerm(permCode) {
  const roles = []
  for (const [role, perms] of Object.entries(rolePermissions)) {
    if (perms.includes('*:*:*') || perms.includes(permCode)) {
      roles.push(role)
    }
  }
  return roles
}

function categoryType(cat) {
  const map = { '菜单': '', '按钮': 'warning', '接口': 'info' }
  return map[cat] || ''
}

function roleTagType(role) {
  const map = { SUPER_ADMIN: 'danger', ADMIN: 'warning', AUDITOR: 'success', REPORTER: '', VIEWER: 'info' }
  return map[role] || ''
}

onMounted(() => loadData())

async function loadData() {
  loading.value = true
  try {
    const res = await getPermissionList()
    const list = res.data || res || (Array.isArray(res) ? res : [])
    tableData.value = list
    if (!list.length && isMockEnabled()) throw new Error('mock')
  } catch (e) {
    if (isMockEnabled()) {
      tableData.value = mockPermissions.map(p => ({
        ...p,
        roleCodes: p.roleCodes || getMockRolesForPerm(p.permCode)
      }))
      if (e.message !== 'mock') console.warn('[PermManage] API不可用，使用mock数据')
    } else {
      tableData.value = []
      ElMessage.error('加载权限列表失败')
    }
  }
  loading.value = false
}

function openCreate() {
  editing.value = null
  Object.assign(form, { permCode: '', permName: '', category: '', description: '', sortOrder: 0, status: 1 })
  formVisible.value = true
}

function openEdit(row) {
  editing.value = row
  Object.assign(form, {
    permCode: row.permCode,
    permName: row.permName,
    category: row.category || '',
    description: row.description || '',
    sortOrder: row.sortOrder || 0,
    status: row.status != null ? row.status : 1
  })
  formVisible.value = true
}

async function handleSave() {
  saving.value = true
  try {
    const payload = {
      permCode: form.permCode,
      permName: form.permName,
      category: form.category,
      description: form.description,
      sortOrder: form.sortOrder,
      status: form.status
    }
    if (editing.value) {
      await updatePermission(editing.value.id, payload)
    } else {
      await createPermission(payload)
    }
    ElMessage.success('保存成功')
    formVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('保存失败')
  }
  saving.value = false
}

async function handleDelete(row) {
  try {
    await deletePermission(row.id)
    ElMessage.success('已删除')
    loadData()
  } catch (e) {
    ElMessage.error('删除失败')
  }
}
</script>

<style lang="scss" scoped>
.page-perm-manage { height: 100%; overflow-y: auto; padding: var(--app-content-padding); }
.ppm-header { display: flex; justify-content: space-between; align-items: center; }
</style>