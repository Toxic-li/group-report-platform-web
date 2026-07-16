<template>
  <div class="page-user-manage">
    <div class="pum-toolbar">
      <el-input v-model="search" placeholder="搜索用户名/姓名/手机号" style="width:240px" clearable @clear="loadData" @keyup.enter="loadData" />
      <el-button type="primary" @click="openCreate">+ 新建用户</el-button>
    </div>

    <el-table :data="tableData" v-loading="loading" border stripe style="width:100%">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="realName" label="真实姓名" width="100" />
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column prop="email" label="邮箱" min-width="160" />
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="lastLoginTime" label="最后登录" width="160" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button text type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          <el-button text size="small" @click="openBindOrg(row)">组织</el-button>
          <el-button text type="warning" size="small" @click="openResetPwd(row)">重置密码</el-button>
          <el-popconfirm title="确定删除该用户?" @confirm="handleDelete(row)">
            <template #reference>
              <el-button text type="danger" size="small">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page.current"
      :page-size="page.size"
      :total="page.total"
      layout="total, prev, pager, next"
      style="margin-top:16px; justify-content:flex-end"
      @current-change="loadData"
    />

    <!-- 创建/编辑对话框 -->
    <el-dialog v-model="formVisible" :title="editingUser ? '编辑用户' : '新建用户'" width="500px" @closed="resetForm">
      <el-form :model="form" label-width="80px">
        <el-form-item label="用户名" required>
          <el-input v-model="form.username" :disabled="!!editingUser" />
        </el-form-item>
        <el-form-item label="真实姓名" required>
          <el-input v-model="form.realName" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item v-if="!editingUser" label="密码" required>
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
        </el-form-item>
        <el-form-item label="所属组织">
          <el-tree-select
            v-model="selectedOrgIds"
            :data="orgTreeData"
            multiple
            check-strictly
            :props="{ label: 'orgName', value: 'id', children: 'children' }"
            placeholder="请选择组织"
            style="width:100%"
            clearable
            collapse-tags
            collapse-tags-tooltip
          />
        </el-form-item>
        <el-form-item label="分配角色">
          <el-checkbox-group v-model="selectedRoleIds">
            <el-checkbox v-for="role in allRoles" :key="role.id" :value="role.id" :label="role.roleName" />
          </el-checkbox-group>
          <span v-if="!allRoles.length" style="color:#999;font-size:12px">暂无角色数据</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">{{ editingUser ? '保存' : '创建' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserList, createUser, updateUser, deleteUser, resetUserPassword } from '@/api/auth.js'
import { getOrgTree } from '@/api/org.js'
import { getRoleList } from '@/api/role.js'
import { isMockEnabled } from '@/utils/mockConfig.js'

const search = ref('')
const loading = ref(false)
const saving = ref(false)
const tableData = ref([])
const formVisible = ref(false)
const editingUser = ref(null)
const selectedOrgIds = ref([])
const orgTreeData = ref([])
const allRoles = ref([])
const selectedRoleIds = ref([])

const page = reactive({ current: 1, size: 10, total: 0 })
const form = reactive({ username: '', realName: '', phone: '', email: '', password: '', status: 1, orgIds: [], roleIds: [] })

onMounted(() => { loadData(); loadOrgTree(); loadRoles() })

// ⭐ 开发模式 mock 数据
const mockUsers = [
  { id: 1, username: 'admin', realName: '系统管理员', phone: '13800000001', email: 'admin@example.com', status: 1, lastLoginTime: '2026-06-24 09:00:00' },
  { id: 2, username: 'zhangsan', realName: '张三', phone: '13800000002', email: 'zhangsan@example.com', status: 1, lastLoginTime: '2026-06-24 08:30:00' },
  { id: 3, username: 'lisi', realName: '李四', phone: '13800000003', email: 'lisi@example.com', status: 1, lastLoginTime: '2026-06-23 17:00:00' },
  { id: 4, username: 'wangwu', realName: '王五', phone: '13800000004', email: 'wangwu@example.com', status: 0, lastLoginTime: '2026-06-20 10:00:00' },
  { id: 5, username: 'designer01', realName: '报表设计师', phone: '13800000005', email: 'designer@example.com', status: 1, lastLoginTime: '2026-06-24 07:00:00' }
]

async function loadData() {
  loading.value = true
  try {
    const res = await getUserList({ current: page.current, size: page.size, keyword: search.value })
    const data = res.data || res
    tableData.value = data.records || data.list || data || []
    page.total = data.total || tableData.value.length
    if (!tableData.value.length && isMockEnabled()) throw new Error('mock')
  } catch (e) {
    if (isMockEnabled()) {
      const filtered = search.value
        ? mockUsers.filter(u => u.username.includes(search.value) || u.realName.includes(search.value) || u.phone.includes(search.value))
        : mockUsers
      tableData.value = filtered
      page.total = mockUsers.length
      if (e.message !== 'mock') console.warn('[UserManage] API不可用，使用mock数据:', e.message)
    } else {
      tableData.value = []
      page.total = 0
      ElMessage.error('加载用户数据失败')
    }
  } finally {
    loading.value = false
  }
}

const mockOrgTree = [
  { id: 1, orgCode: 'GROUP', orgName: '集团公司', children: [
    { id: 2, orgCode: 'MINE_A', orgName: 'A煤矿', children: [
      { id: 5, orgCode: 'MINE_A_PROD', orgName: '生产部' },
      { id: 6, orgCode: 'MINE_A_SAFE', orgName: '安环部' }
    ]},
    { id: 3, orgCode: 'MINE_B', orgName: 'B煤矿', children: [
      { id: 7, orgCode: 'MINE_B_PROD', orgName: '生产部' }
    ]},
    { id: 4, orgCode: 'COAL_TRADE', orgName: '煤炭贸易公司' }
  ]}
]

function filterValidNodes(nodes) {
  if (!Array.isArray(nodes)) return nodes
  return nodes.filter(node => {
    if (node.children) {
      node.children = filterValidNodes(node.children)
    }
    return node.id != null && node.orgName != null
  })
}

async function loadOrgTree() {
  try {
    const res = await getOrgTree()
    const data = res.data || res
    let raw = Array.isArray(data) ? data : (data.children || data || [])
    if (!raw.length && isMockEnabled()) throw new Error('mock')
    orgTreeData.value = filterValidNodes(raw)
  } catch (e) {
    if (isMockEnabled()) {
      orgTreeData.value = mockOrgTree
    } else {
      orgTreeData.value = []
      console.warn('[UserManage] 加载组织树失败')
    }
  }
}

async function loadRoles() {
  try {
    const res = await getRoleList()
    allRoles.value = (res.data || res || []).filter(r => r.status !== 0)
  } catch (e) {
    console.warn('[UserManage] 加载角色列表失败')
  }
}

function openCreate() {
  editingUser.value = null
  resetForm()
  selectedOrgIds.value = []
  selectedRoleIds.value = []
  formVisible.value = true
}

function openEdit(row) {
  editingUser.value = row
  Object.assign(form, row)
  // 后端 UserVO 返回 orgId（单个），转为数组供 el-tree-select 回显
  selectedOrgIds.value = row.orgId ? [row.orgId] : []
  // 后端返回的 roles 是角色编码（如 "REPORTER"），需要映射为角色ID
  const roleCodes = Array.isArray(row.roles) ? row.roles : []
  selectedRoleIds.value = roleCodes
    .map(code => {
      const role = allRoles.value.find(r => r.roleCode === code)
      return role ? role.id : null
    })
    .filter(Boolean)
  formVisible.value = true
}

function resetForm() {
  form.username = ''; form.realName = ''; form.phone = ''; form.email = ''; form.password = ''; form.status = 1; form.orgIds = []; form.roleIds = []
}

async function handleSave() {
  saving.value = true
  try {
    const payload = { ...form, orgId: selectedOrgIds.value.filter(Boolean)[0], roleIds: selectedRoleIds.value }
    if (editingUser.value) {
      // 编辑时不需要密码
      delete payload.password
      await updateUser(editingUser.value.id, payload)
      ElMessage.success('更新成功')
    } else {
      await createUser(payload)
      ElMessage.success('创建成功')
    }
    formVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('操作失败: ' + e.message)
  } finally {
    saving.value = false
  }
}

async function handleDelete(row) {
  await deleteUser(row.id)
  ElMessage.success('已删除')
  loadData()
}

function openResetPwd(row) {
  ElMessageBox.prompt('请输入新密码', '重置密码', { inputType: 'password' }).then(async ({ value }) => {
    await resetUserPassword(row.id, value)
    ElMessage.success('密码已重置')
  }).catch(() => {})
}

function openBindOrg(row) {
  openEdit(row)
}
</script>

<style lang="scss" scoped>
.page-user-manage { height: 100%; overflow-y: auto; padding: var(--app-content-padding); }
.pum-toolbar { display: flex; justify-content: space-between; margin-bottom: 16px; }
</style>
