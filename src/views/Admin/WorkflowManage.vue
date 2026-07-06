<template>
  <div class="page-workflow">
    <el-card shadow="never">
      <template #header>
        <div class="pw-header">
          <span>审批流程配置</span>
          <el-button type="primary" size="small" @click="openCreate">+ 新建审批流</el-button>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="workflowCode" label="流程编码" width="150" />
        <el-table-column prop="workflowName" label="流程名称" min-width="200" />
        <el-table-column label="审批类型" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ row.approvalTypeLabel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="关联模板" width="150">
          <template #default="{ row }">
            <span>{{ row.templateName || '全局通用' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="节点数" width="80">
          <template #default="{ row }">
            <span>{{ row.nodes?.length || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.statusLabel }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button text size="small" @click="toggleStatus(row)">
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-popconfirm title="确定删除?" @confirm="handleDelete(row)">
              <template #reference>
                <el-button text type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建/编辑审批流对话框 -->
    <el-dialog v-model="formVisible" :title="editingWorkflow ? '编辑审批流' : '新建审批流'" width="700px" destroy-on-close>
      <el-form :model="form" label-width="100px">
        <el-form-item label="流程名称" required>
          <el-input v-model="form.workflowName" placeholder="如：报表发布审批流程" />
        </el-form-item>
        <el-form-item label="流程编码" required>
          <el-input v-model="form.workflowCode" :disabled="!!editingWorkflow" placeholder="如：REPORT_PUBLISH" />
        </el-form-item>
        <el-form-item label="关联模板">
          <el-select v-model="form.templateId" placeholder="选择模板（可选，不选则为全局通用）" clearable style="width:100%">
            <el-option v-for="tpl in templateList" :key="tpl.id" :label="tpl.templateName" :value="tpl.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="审批类型" required>
          <el-select v-model="form.approvalType" style="width:100%">
            <el-option label="单级审批（一人审批即可）" :value="1" />
            <el-option label="多级审批（按顺序多级审批）" :value="2" />
            <el-option label="会签审批（多人同时审批）" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" rows="2" />
        </el-form-item>

        <!-- 审批节点配置 -->
        <el-divider content-position="left">审批节点配置</el-divider>
        <div class="pw-nodes">
          <div v-for="(node, idx) in form.nodes" :key="idx" class="pw-node-card">
            <div class="pw-node-header">
              <span class="pw-node-order">节点 {{ idx + 1 }}</span>
              <el-button type="danger" size="small" text @click="removeNode(idx)" v-if="idx > 0">删除</el-button>
            </div>
            <el-form-item label="节点名称">
              <el-input v-model="node.nodeName" placeholder="如：部门主管审批" />
            </el-form-item>
            <el-form-item label="节点类型">
              <el-select v-model="node.nodeType" style="width:100%">
                <el-option label="审批节点" :value="2" />
                <el-option label="会签节点" :value="3" />
                <el-option label="抄送节点" :value="4" />
              </el-select>
            </el-form-item>
            <el-form-item label="审批人类型">
              <el-select v-model="node.approverType" style="width:100%">
                <el-option label="指定用户" :value="1" />
                <el-option label="指定角色" :value="2" />
                <el-option label="上级领导" :value="3" />
                <el-option label="发起人自选" :value="4" />
              </el-select>
            </el-form-item>
            <el-form-item label="审批人" v-if="node.approverType === 1">
              <el-select v-model="node.approverIds" multiple placeholder="选择审批人" style="width:100%">
                <el-option v-for="user in userList" :key="user.userId" :label="user.realName" :value="user.userId" />
              </el-select>
            </el-form-item>
            <el-form-item label="审批角色" v-if="node.approverType === 2">
              <el-select v-model="node.roleIds" multiple placeholder="选择角色" style="width:100%">
                <el-option v-for="role in roleList" :key="role.roleId" :label="role.roleName" :value="role.roleId" />
              </el-select>
            </el-form-item>
            <el-form-item label="超时时间">
              <el-input-number v-model="node.timeoutHours" :min="0" :max="168" placeholder="小时" />
              <span style="margin-left:8px;color:#909399">小时（0表示不超时）</span>
            </el-form-item>
            <el-form-item label="超时处理" v-if="node.timeoutHours > 0">
              <el-select v-model="node.timeoutAction" style="width:100%">
                <el-option label="自动通过" :value="1" />
                <el-option label="自动驳回" :value="2" />
                <el-option label="转交上级" :value="3" />
              </el-select>
            </el-form-item>
          </div>
          <el-button type="primary" size="small" @click="addNode" style="margin-top:12px">+ 添加审批节点</el-button>
        </div>
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

const loading = ref(false)
const saving = ref(false)
const tableData = ref([])
const formVisible = ref(false)
const editingWorkflow = ref(null)
const templateList = ref([])
const userList = ref([])
const roleList = ref([])

const form = reactive({
  workflowName: '',
  workflowCode: '',
  templateId: null,
  approvalType: 1,
  remark: '',
  nodes: [{ nodeName: '一级审批', nodeType: 2, nodeOrder: 1, approverType: 2, roleIds: [], approverIds: [], timeoutHours: 0, timeoutAction: 1 }]
})

// Mock 数据
const mockWorkflows = [
  { id: 1, workflowCode: 'REPORT_PUBLISH', workflowName: '报表发布审批流程', templateId: null, approvalType: 2, approvalTypeLabel: '多级审批', status: 1, statusLabel: '启用', nodes: [
    { nodeName: '部门主管审批', nodeType: 2, nodeOrder: 1 },
    { nodeName: '财务总监审批', nodeType: 2, nodeOrder: 2 }
  ]},
  { id: 2, workflowCode: 'REPORT_SUBMIT', workflowName: '报表提交审批流程', templateId: 1001, templateName: '煤炭生产表', approvalType: 1, approvalTypeLabel: '单级审批', status: 1, statusLabel: '启用', nodes: [
    { nodeName: '部门审批', nodeType: 2, nodeOrder: 1 }
  ]}
]

const mockUsers = [
  { userId: 1, realName: '系统管理员' },
  { userId: 2, realName: '张三' },
  { userId: 3, realName: '李四' },
  { userId: 5, realName: '报表设计师' }
]

const mockRoles = [
  { roleId: 1, roleName: '系统管理员' },
  { roleId: 5, roleName: '审核人员' },
  { roleId: 2, roleName: '模板管理员' }
]

const mockTemplates = [
  { id: 1001, templateName: '煤炭生产销售库存表' },
  { id: 1002, templateName: '经营指标月报' }
]

onMounted(() => loadData())

async function loadData() {
  loading.value = true
  try {
    // TODO: 对接后端 API
    // const res = await getWorkflowList()
    // tableData.value = res || []
    tableData.value = mockWorkflows
    templateList.value = mockTemplates
    userList.value = mockUsers
    roleList.value = mockRoles
  } catch (e) {
    tableData.value = mockWorkflows
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingWorkflow.value = null
  Object.assign(form, {
    workflowName: '',
    workflowCode: '',
    templateId: null,
    approvalType: 1,
    remark: '',
    nodes: [{ nodeName: '一级审批', nodeType: 2, nodeOrder: 1, approverType: 2, roleIds: [], approverIds: [], timeoutHours: 0, timeoutAction: 1 }]
  })
  formVisible.value = true
}

function openEdit(row) {
  editingWorkflow.value = row
  Object.assign(form, {
    workflowName: row.workflowName,
    workflowCode: row.workflowCode,
    templateId: row.templateId,
    approvalType: row.approvalType,
    remark: row.remark,
    nodes: row.nodes?.map(n => ({
      nodeName: n.nodeName,
      nodeType: n.nodeType,
      nodeOrder: n.nodeOrder,
      approverType: n.approverType || 2,
      roleIds: n.roleIds || [],
      approverIds: n.approverIds || [],
      timeoutHours: n.timeoutHours || 0,
      timeoutAction: n.timeoutAction || 1
    })) || []
  })
  formVisible.value = true
}

function addNode() {
  form.nodes.push({
    nodeName: `${['一', '二', '三', '四', '五'][form.nodes.length]}级审批`,
    nodeType: 2,
    nodeOrder: form.nodes.length + 1,
    approverType: 2,
    roleIds: [],
    approverIds: [],
    timeoutHours: 0,
    timeoutAction: 1
  })
}

function removeNode(idx) {
  form.nodes.splice(idx, 1)
  // 重新排序
  form.nodes.forEach((n, i) => n.nodeOrder = i + 1)
}

async function handleSave() {
  if (!form.workflowName || !form.workflowCode) {
    ElMessage.warning('请填写流程名称和编码')
    return
  }
  
  saving.value = true
  try {
    // TODO: 对接后端 API
    // if (editingWorkflow.value) {
    //   await updateWorkflow(editingWorkflow.value.id, form)
    // } else {
    //   await createWorkflow(form)
    // }
    ElMessage.success('保存成功')
    formVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('保存失败: ' + e.message)
  } finally {
    saving.value = false
  }
}

async function handleDelete(row) {
  // TODO: await deleteWorkflow(row.id)
  ElMessage.success('已删除')
  loadData()
}

async function toggleStatus(row) {
  // TODO: await toggleWorkflowStatus(row.id, row.status === 1 ? 0 : 1)
  row.status = row.status === 1 ? 0 : 1
  row.statusLabel = row.status === 1 ? '启用' : '禁用'
  ElMessage.success(row.status === 1 ? '已启用' : '已禁用')
}
</script>

<style lang="scss" scoped>
.page-workflow {
  .pw-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .pw-nodes {
    .pw-node-card {
      border: 1px solid #E4E7ED;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 12px;
      background: #F5F7FA;
      .pw-node-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        .pw-node-order {
          font-weight: 600;
          color: #409EFF;
        }
      }
    }
  }
}
</style>