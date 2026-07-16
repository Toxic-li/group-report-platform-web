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
        <el-input v-model="query.name" placeholder="搜索模板名称或编号" class="search-input" clearable @keyup.enter="handleSearch">
          <template #prefix>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </template>
        </el-input>
        <el-select v-model="query.templateType" placeholder="模板类型" style="width: 140px" clearable @change="handleSearch">
          <el-option label="统计报表" :value="1" />
          <el-option label="填报报表" :value="2" />
          <el-option label="汇总报表" :value="3" />
        </el-select>
        <el-select v-model="query.planFlag" placeholder="是否计划模板" style="width: 140px" clearable @change="handleSearch">
          <el-option label="计划模板" :value="1" />
          <el-option label="普通模板" :value="0" />
        </el-select>
        <el-select v-model="query.status" placeholder="状态" style="width: 120px" clearable @change="handleSearch">
          <el-option label="草稿" :value="0" />
          <el-option label="已发布" :value="1" />
          <el-option label="已停用" :value="2" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
        <div class="filter-spacer"></div>
        <el-button
          type="danger"
          :disabled="selectedRows.length === 0"
          @click="handleBatchDelete"
        >
          批量删除{{ selectedRows.length > 0 ? ` (${selectedRows.length})` : '' }}
        </el-button>
      </div>

      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="tableData"
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="45" />
        <el-table-column prop="templateCode" label="模板编号" width="160" />
        <el-table-column prop="templateName" label="模板名称" width="200" />
        <el-table-column prop="templateType" label="类型" width="140">
          <template #default="{ row }">
            <div style="display:flex;gap:4px;align-items:center;">
              <el-tag size="small" :type="row.templateType === 1 ? 'primary' : (row.templateType === 2 ? 'success' : 'warning')">
                {{ getTypeText(row.templateType) }}
              </el-tag>
              <el-tag v-if="row.planFlag === 1" size="small" type="danger" effect="plain">📋 计划模板</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createByName" label="创建人" width="100">
          <template #default="{ row }">{{ row.createByName || '-' }}</template>
        </el-table-column>
        <el-table-column prop="orgName" label="所属组织" width="160">
          <template #default="{ row }">{{ row.orgName || '-' }}</template>
        </el-table-column>
        <el-table-column prop="version" label="版本" width="80" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="createTime" label="创建时间" width="170">
          <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="170">
          <template #default="{ row }">{{ formatDate(row.updateTime) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <div class="action-btns">
              <el-tooltip content="编辑" placement="top">
                <el-button class="btn-icon" text @click="handleEdit(row)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </el-button>
              </el-tooltip>
              <el-tooltip content="预览" placement="top">
                <el-button class="btn-icon" text @click="handlePreview(row)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </el-button>
              </el-tooltip>
              <el-tooltip content="复制" placement="top">
                <el-button class="btn-icon" text @click="handleCopy(row)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                </el-button>
              </el-tooltip>
              <el-tooltip content="下发" placement="top" v-if="row.status === 1">
                <el-badge :value="getAssignCount(row.id)" :hidden="getAssignCount(row.id) === 0">
                  <el-button class="btn-icon btn-primary" text @click="openAssignDialog(row)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><polyline points="9 14 12 17 15 14"/></svg>
                  </el-button>
                </el-badge>
              </el-tooltip>
              <el-tooltip content="发布" placement="top" v-if="row.status === 0">
                <el-button class="btn-icon btn-success" text @click="handlePublish(row)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                </el-button>
              </el-tooltip>
              <el-tooltip content="停用" placement="top" v-if="row.status === 1">
                <el-button class="btn-icon btn-warning" text @click="handleDisable(row)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                </el-button>
              </el-tooltip>
              <el-tooltip content="启用" placement="top" v-if="row.status === 2">
                <el-button class="btn-icon btn-success" text @click="handleEnable(row)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                </el-button>
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button class="btn-icon btn-danger" text @click="handleDelete(row)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="query.current"
          v-model:page-size="query.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </div>

    <!-- ===== 模板下发弹窗 ===== -->
    <el-dialog v-model="assignDialogVisible" title="下发模板" width="560px" :close-on-click-modal="false" destroy-on-close>
      <div class="assign-dialog-body">
        <!-- 下发链预览 -->
        <div class="assign-chain">
          <div class="assign-chain-from">
            <span class="assign-chain-label">下发方</span>
            <span class="assign-chain-org">{{ userStore.user?.orgName || '当前单位' }}</span>
          </div>
          <div class="assign-chain-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--app-primary)" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </div>
          <div class="assign-chain-to">
            <span class="assign-chain-label">下发至</span>
            <span class="assign-chain-count" v-if="assignOrgIds.length > 0">{{ assignOrgIds.length }} 个单位</span>
            <span class="assign-chain-count assign-chain-count--none" v-else>待选择</span>
          </div>
        </div>

        <!-- 模板信息 -->
        <div class="assign-template-info">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--app-text-muted)" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span>{{ assignTemplateName }}</span>
        </div>

        <!-- 下级单位选择 -->
        <div class="assign-dialog-orgs" v-if="subordinateOrgs.length > 0 || assignAdvanced">
          <div class="assign-orgs-header">
            <span>{{ assignAdvanced ? '组织树（跨级选择）' : '下级单位列表' }}</span>
            <div class="assign-orgs-header-right">
              <el-switch
                v-if="hasPermission('template:advanced-assign')"
                v-model="assignAdvanced"
                size="small"
                active-text="高级"
                @change="onAdvancedChange"
              />
              <el-button v-if="!assignAdvanced" text size="small" @click="assignOrgIds = subordinateOrgs.map(o => o.id)" v-show="assignOrgIds.length < subordinateOrgs.length">全选</el-button>
              <el-button v-if="!assignAdvanced" text size="small" @click="assignOrgIds = []" v-show="assignOrgIds.length === subordinateOrgs.length && assignOrgIds.length > 0">取消全选</el-button>
            </div>
          </div>
          <!-- 风险提示 -->
          <div v-if="assignAdvanced" class="assign-risk-warning">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span>跨级下发将跳过中间管理层，请确认所选组织确实需要该模板</span>
          </div>
          <!-- 普通模式：平铺列表 -->
          <el-checkbox-group v-if="!assignAdvanced" v-model="assignOrgIds" class="assign-org-list">
            <el-checkbox v-for="org in subordinateOrgs" :key="org.id" :label="org.id" :value="org.id" class="assign-org-item">
              <span class="assign-org-name">{{ org.orgName }}</span>
              <el-tag size="small" :type="getOrgTypeTag(org.orgType)" effect="plain" class="assign-org-type">{{ getOrgTypeLabel(org.orgType) }}</el-tag>
              <span class="assign-org-code">{{ org.orgCode }}</span>
              <el-tag v-if="isAlreadyAssigned(org.id)" size="small" type="success" effect="plain" class="assign-org-assigned">已下发</el-tag>
            </el-checkbox>
          </el-checkbox-group>
          <!-- 高级模式：树形选择 -->
          <div v-else class="assign-tree-wrapper" v-loading="orgTreeLoading">
            <el-tree
              v-if="orgTreeData.length > 0"
              ref="treeRef"
              :data="orgTreeData"
              show-checkbox
              node-key="id"
              :props="{ label: 'orgName', children: 'children' }"
              :check-strictly="false"
              :default-expand-all="false"
              @check="handleTreeCheck"
            >
              <template #default="{ node, data }">
                <span class="assign-tree-node">
                  <span class="assign-tree-name">{{ data.orgName }}</span>
                  <el-tag size="small" :type="getOrgTypeTag(data.orgType)" effect="plain">{{ getOrgTypeLabel(data.orgType) }}</el-tag>
                  <span class="assign-tree-code">{{ data.orgCode }}</span>
                  <el-tag v-if="isAlreadyAssigned(data.id)" size="small" type="success" effect="plain">已下发</el-tag>
                </span>
              </template>
            </el-tree>
            <div v-else class="assign-empty">
              <p>暂无下级组织数据</p>
            </div>
          </div>
        </div>
        <div v-else class="assign-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--app-text-muted)" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <p>暂无下级单位可以下发</p>
          <span>请先在组织管理中建立下级单位</span>
        </div>

        <!-- 周期 & 截止 -->
        <div class="assign-form-row">
          <div class="assign-form-field">
            <label>填报周期</label>
            <el-input v-model="assignPeriod" placeholder="如：2026-07" style="width: 140px" size="default" />
          </div>
          <div class="assign-form-field">
            <label><span class="assign-required">*</span>截止日期</label>
            <el-date-picker v-model="assignDeadline" type="datetime" placeholder="选择截止日期"
              format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 190px" />
          </div>
        </div>

        <!-- 已下发记录 -->
        <div v-if="existingAssignRecords.length > 0" class="assign-dialog-existing">
          <div class="assign-existing-header">已下发记录</div>
          <div v-for="r in existingAssignRecords" :key="r.id" class="assign-existing-item">
            <div class="assign-existing-info">
              <span class="assign-existing-org">{{ r.toOrgName }}</span>
              <span class="assign-existing-deadline" v-if="r.deadline">截止：{{ formatAssignDeadline(r.deadline) }}</span>
            </div>
            <el-button text size="small" type="danger" @click="handleCancelAssign(r)">取消下发</el-button>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAssignSubmit" :disabled="assignOrgIds.length === 0 || !assignDeadline">
          下发 {{ assignOrgIds.length > 0 ? '(' + assignOrgIds.length + ')' : '' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- ===== 新建模板弹窗 ===== -->
    <el-dialog v-model="createDialog.visible" title="新建报表模板" width="520px" :close-on-click-modal="false" destroy-on-close>
      <div class="create-form">
        <div class="create-field">
          <label class="create-label">模板名称 <span class="required">*</span></label>
          <el-input v-model="createDialog.name" placeholder="如：煤炭生产销售库存表" maxlength="64" show-word-limit />
        </div>
        <div class="create-field">
          <label class="create-label">模板编码 <span class="required">*</span></label>
          <el-input v-model="createDialog.code" placeholder="如：RPT-COAL-001" maxlength="64" />
          <span class="create-hint">留空将自动生成唯一编码</span>
        </div>
        <div class="create-field">
          <label class="create-label">模板类型</label>
          <el-select v-model="createDialog.templateType" style="width: 100%">
            <el-option :value="1" label="统计报表" />
            <el-option :value="2" label="填报报表" />
            <el-option :value="3" label="汇总报表" />
          </el-select>
        </div>
        <div class="create-field">
          <label class="create-label">描述</label>
          <el-input v-model="createDialog.description" type="textarea" :rows="3" placeholder="报表用途说明" maxlength="200" show-word-limit />
        </div>
        <div class="create-readonly-row">
          <div class="create-readonly-item">
            <span class="create-label">创建人</span>
            <el-tag size="small" type="info" effect="plain">{{ createDialog.createByName }}</el-tag>
          </div>
          <div class="create-readonly-item">
            <span class="create-label">所属组织</span>
            <el-tag size="small" type="info" effect="plain">{{ createDialog.orgName }}</el-tag>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="createDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="createDialog.loading" @click="handleCreateSubmit">进入设计器</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { getTemplateList, copyTemplate, deleteTemplate, batchDeleteTemplates, getSubordinateOrgsForAssign, getSubordinateOrgTree, assignTemplate, getAssignRecords, cancelAssign, saveTemplate, publishTemplate, disableTemplate, enableTemplate } from '@/api/reportDesigner.js'
import { useUserStore } from '@/stores/userStore'
import { usePermission } from '@/composables/usePermission'

const router = useRouter()
const userStore = useUserStore()
const { hasPermission } = usePermission()
const loading = ref(false)
const total = ref(0)
const tableData = ref([])
const tableRef = ref(null)
const selectedRows = ref([])

// ===== 新建模板 =====
const createDialog = reactive({
  visible: false,
  loading: false,
  name: '',
  code: '',
  templateType: 2,
  description: '',
  createByName: '',
  orgName: ''
})

// ===== 模板下发 =====
const assignDialogVisible = ref(false)
const assignTemplateId = ref(null)
const assignTemplateName = ref('')
const assignOrgIds = ref([])
const assignPeriod = ref('')
const assignDeadline = ref('')
const subordinateOrgs = ref([])
const existingAssignRecords = ref([])
const assignCountMap = ref({})
// 高级下发
const assignAdvanced = ref(false)
const orgTreeData = ref([])
const orgTreeLoading = ref(false)
const treeRef = ref(null)

function handleSelectionChange(rows) {
  selectedRows.value = rows
}

const query = reactive({
  name: '',
  templateType: '',
  status: '',
  planFlag: '',
  current: 1,
  size: 10
})

async function fetchList() {
  loading.value = true
  try {
    const params = {
      current: query.current,
      size: query.size
    }
    if (query.name) params.name = query.name
    if (query.templateType !== '' && query.templateType !== null && query.templateType !== undefined) {
      params.templateType = query.templateType
    }
    if (query.status !== '' && query.status !== null && query.status !== undefined) {
      params.status = query.status
    }
    if (query.planFlag !== '' && query.planFlag !== null && query.planFlag !== undefined) {
      params.planFlag = query.planFlag
    }
    const res = await getTemplateList(params)
    const data = res?.data || res
    if (data) {
      tableData.value = data.records || data.list || []
      total.value = data.total || 0
    } else {
      tableData.value = []
      total.value = 0
    }
  } catch (err) {
    console.error('获取模板列表失败:', err)
    ElMessage.error('获取模板列表失败')
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  query.current = 1
  fetchList()
}

function handleReset() {
  query.name = ''
  query.templateType = ''
  query.status = ''
  query.planFlag = ''
  query.current = 1
  fetchList()
}

function getTypeText(type) {
  const texts = { 1: '统计报表', 2: '填报报表', 3: '汇总报表' }
  return texts[type] || '未知'
}

function getStatusText(status) {
  const texts = { 0: '草稿', 1: '已发布', 2: '已停用' }
  return texts[status] || '未知'
}

function getStatusType(status) {
  const types = { 0: 'info', 1: 'success', 2: 'danger' }
  return types[status] || 'info'
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return String(dateStr).replace('T', ' ').substring(0, 19)
}

function handleCreate() {
  // 打开新建弹窗，预填创建人/组织信息（只读，取自当前登录用户）
  createDialog.name = ''
  createDialog.code = ''
  createDialog.templateType = 2
  createDialog.description = ''
  createDialog.loading = false
  createDialog.createByName = userStore.user?.realName || userStore.user?.username || '当前用户'
  createDialog.orgName = userStore.user?.orgName || '-'
  createDialog.visible = true
}

async function handleCreateSubmit() {
  if (!createDialog.name || !createDialog.name.trim()) {
    ElMessage.warning('请输入模板名称')
    return
  }
  createDialog.loading = true
  try {
    const name = createDialog.name.trim()
    const templateType = createDialog.templateType
    const payload = {
      name,
      code: createDialog.code.trim() || undefined,
      templateType,
      description: createDialog.description || '',
      rowTree: [],
      columnTree: []
    }
    const res = await saveTemplate(payload)
    const newId = res?.id ?? res?.data ?? res
    ElMessage.success('模板已创建，进入设计器')
    createDialog.visible = false
    if (newId) {
      router.push({ path: '/designer', query: { templateId: newId, name, templateType } })
    } else {
      router.push('/designer')
    }
  } catch (err) {
    ElMessage.error(err?.message || '创建模板失败')
  } finally {
    createDialog.loading = false
  }
}

function handlePreview(row) {
  router.push(`/designer/templates/${row.id}/preview`)
}

function handleEdit(row) {
  router.push({ path: '/designer', query: { templateId: row.id } })
}

async function handleCopy(row) {
  try {
    await ElMessageBox.confirm(`确定复制模板"${row.templateName}"吗？`, '确认复制', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    const res = await copyTemplate(row.id, row.templateName + ' - 副本')
    ElMessage.success('复制成功')
    fetchList()
  } catch (err) {
    if (err !== 'cancel') {
      console.error('复制模板失败:', err)
      ElMessage.error(err?.message || '复制失败')
    }
  }
}

async function handlePublish(row) {
  try {
    await ElMessageBox.confirm(`确定发布模板"${row.templateName}"吗？发布后模板才可下发填报。`, '确认发布', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await publishTemplate(row.id)
    ElMessage.success('发布成功')
    fetchList()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err?.message || '发布失败')
    }
  }
}

async function handleDisable(row) {
  try {
    await ElMessageBox.confirm(`确定停用模板"${row.templateName}"吗？停用后该模板不可下发和填报。`, '确认停用', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await disableTemplate(row.id)
    ElMessage.success('停用成功')
    fetchList()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err?.message || '停用失败')
    }
  }
}

async function handleEnable(row) {
  try {
    await ElMessageBox.confirm(`确定启用模板"${row.templateName}"吗？启用后模板恢复为已发布状态。`, '确认启用', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    await enableTemplate(row.id)
    ElMessage.success('启用成功')
    fetchList()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(err?.message || '启用失败')
    }
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除模板"${row.templateName}"吗？`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteTemplate(row.id)
    ElMessage.success('删除成功')
    if (tableData.value.length === 1 && query.current > 1) {
      query.current--
    }
    fetchList()
  } catch (err) {
    if (err !== 'cancel') {
      console.error('删除模板失败:', err)
      ElMessage.error(err?.message || '删除失败')
    }
  }
}

async function handleBatchDelete() {
  if (selectedRows.value.length === 0) return
  const count = selectedRows.value.length
  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${count} 个模板吗？此操作不可撤销。`,
      '批量删除确认',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    )
    const ids = selectedRows.value.map(r => r.id)
    await batchDeleteTemplates(ids)
    ElMessage.success(`成功删除 ${count} 个模板`)
    selectedRows.value = []
    if (tableData.value.length === count && query.current > 1) {
      query.current--
    }
    fetchList()
  } catch (err) {
    if (err !== 'cancel') {
      console.error('批量删除失败:', err)
      ElMessage.error(err?.message || '批量删除失败')
    }
  }
}

// ===== 模板下发 =====
async function openAssignDialog(row) {
  assignTemplateId.value = row.id
  assignTemplateName.value = row.templateName
  assignOrgIds.value = []
  assignPeriod.value = ''
  assignDeadline.value = ''
  assignAdvanced.value = false
  orgTreeData.value = []
  assignDialogVisible.value = true
  try {
    const [orgs, records] = await Promise.all([
      getSubordinateOrgsForAssign(),
      getAssignRecords(row.id)
    ])
    subordinateOrgs.value = Array.isArray(orgs) ? orgs : (orgs?.data || [])
    existingAssignRecords.value = Array.isArray(records) ? records : (records?.data || [])
  } catch {
    subordinateOrgs.value = []
    existingAssignRecords.value = []
  }
}

async function onAdvancedChange(val) {
  if (val) {
    assignOrgIds.value = []
    orgTreeLoading.value = true
    try {
      const data = await getSubordinateOrgTree()
      orgTreeData.value = Array.isArray(data) ? data : (data?.data || [])
    } catch (err) {
      ElMessage.error(err?.message || '加载组织树失败')
      assignAdvanced.value = false
    } finally {
      orgTreeLoading.value = false
    }
  } else {
    orgTreeData.value = []
    assignOrgIds.value = []
  }
}

function handleTreeCheck(node, { checkedKeys }) {
  assignOrgIds.value = [...checkedKeys]
}

async function handleAssignSubmit() {
  if (assignOrgIds.value.length === 0) return
  if (!assignDeadline.value) {
    ElMessage.warning('请选择填报截止日期')
    return
  }
  try {
    const params = {
      templateId: assignTemplateId.value,
      orgIds: assignOrgIds.value,
      period: assignPeriod.value || undefined,
      deadline: assignDeadline.value
    }
    await assignTemplate(params)
    ElMessage.success(`成功下发到 ${assignOrgIds.value.length} 个单位`)
    assignDialogVisible.value = false
    assignOrgIds.value = []
    assignPeriod.value = ''
    assignDeadline.value = ''
    await loadAssignRecords()
  } catch (err) {
    ElMessage.error(err?.message || '下发失败')
  }
}

async function handleCancelAssign(record) {
  try {
    await cancelAssign(record.id)
    ElMessage.success('已取消下发')
    existingAssignRecords.value = existingAssignRecords.value.filter(r => r.id !== record.id)
  } catch (err) {
    ElMessage.error(err?.message || '取消失败')
  }
}

async function loadAssignRecords() {
  try {
    const records = await getAssignRecords(assignTemplateId.value)
    existingAssignRecords.value = Array.isArray(records) ? records : (records?.data || [])
    assignCountMap.value[assignTemplateId.value] = existingAssignRecords.value.length
  } catch {
    existingAssignRecords.value = []
  }
}

function getAssignCount(templateId) {
  return assignCountMap.value[templateId] || 0
}

function formatAssignDeadline(deadline) {
  if (!deadline) return ''
  if (typeof deadline === 'string') return deadline.substring(0, 16)
  return deadline
}

function getOrgTypeLabel(orgType) {
  const map = { 1: '集团', 2: '子公司', 3: '部门', 4: '小组' }
  return map[orgType] || '单位'
}

function getOrgTypeTag(orgType) {
  const map = { 1: '', 2: 'primary', 3: 'warning', 4: 'info' }
  return map[orgType] || ''
}

function isAlreadyAssigned(orgId) {
  return existingAssignRecords.value.some(r => r.toOrgId === orgId)
}

onMounted(() => {
  fetchList()
})
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
  align-items: center;
}

.filter-spacer {
  flex: 1;
}

.search-input {
  width: 280px;
}

.pagination-wrap {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* ===== 操作按钮栏 ===== */
.action-btns {
  display: flex;
  align-items: center;
  gap: 2px;
}

.btn-icon {
  width: 32px;
  height: 32px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: #606266;
  transition: all 0.2s;
}
.btn-icon:hover {
  background: #f0f2f5;
  color: #409eff;
}
.btn-icon.btn-primary {
  color: #409eff;
}
.btn-icon.btn-primary:hover {
  background: #ecf5ff;
  color: #337ecc;
}
.btn-icon.btn-success {
  color: #67c23a;
}
.btn-icon.btn-success:hover {
  background: #f0f9eb;
  color: #529b2e;
}
.btn-icon.btn-warning {
  color: #e6a23c;
}
.btn-icon.btn-warning:hover {
  background: #fdf6ec;
  color: #b88230;
}
.btn-icon.btn-danger {
  color: #f56c6c;
}
.btn-icon.btn-danger:hover {
  background: #fef0f0;
  color: #c45656;
}

/* ===== 模板下发弹窗 ===== */
.assign-dialog-body { }
.assign-dialog-tip { font-size: 14px; color: var(--app-text-secondary); margin-bottom: 16px; }
.assign-dialog-tip strong { color: var(--app-primary); }

/* 下发链 */
.assign-chain { display: flex; align-items: center; gap: 12px; padding: 16px; background: var(--app-surface-hover); border-radius: 10px; margin-bottom: 16px; }
.assign-chain-from, .assign-chain-to { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.assign-chain-label { font-size: 11px; color: var(--app-text-muted); }
.assign-chain-org { font-size: 14px; font-weight: 600; color: var(--app-text-primary); padding: 4px 12px; background: var(--app-primary-bg); border-radius: 6px; color: var(--app-primary); }
.assign-chain-count { font-size: 14px; font-weight: 600; color: var(--app-primary); padding: 4px 12px; background: var(--app-primary-bg); border-radius: 6px; }
.assign-chain-count--none { color: var(--app-text-muted); background: var(--app-border-light); }
.assign-chain-arrow { display: flex; align-items: center; flex-shrink: 0; }

/* 模板信息 */
.assign-template-info { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--app-text-secondary); margin-bottom: 12px; }

/* 下级单位选择 */
.assign-dialog-orgs { margin-bottom: 16px; border: 1px solid var(--app-border); border-radius: 8px; overflow: hidden; }
.assign-orgs-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: var(--app-surface-hover); font-size: 12px; font-weight: 500; color: var(--app-text-secondary); border-bottom: 1px solid var(--app-border-light); }
.assign-orgs-header-right { display: flex; align-items: center; gap: 8px; }
.assign-org-list { display: flex; flex-direction: column; padding: 4px 0; max-height: 200px; overflow-y: auto; }
.assign-org-item { padding: 8px 12px; margin: 0 !important; transition: background 0.15s; }
.assign-org-item:hover { background: var(--app-surface-hover); }
.assign-org-name { font-weight: 500; font-size: 13px; color: var(--app-text-primary); margin-right: 6px; }
.assign-org-type { margin-right: 6px; }
.assign-org-code { font-size: 11px; color: var(--app-text-muted); }
.assign-org-assigned { margin-left: auto; }

/* 风险提示 */
.assign-risk-warning { display: flex; align-items: center; gap: 6px; padding: 8px 12px; margin: 0; background: #fef6e0; color: #b88230; font-size: 12px; border-bottom: 1px solid #f0d88a; }
.assign-risk-warning svg { flex-shrink: 0; color: #d4a017; }

/* 树形选择 */
.assign-tree-wrapper { padding: 8px; max-height: 280px; overflow-y: auto; }
.assign-tree-node { display: flex; align-items: center; gap: 6px; font-size: 13px; }
.assign-tree-name { font-weight: 500; color: var(--app-text-primary); }
.assign-tree-code { font-size: 11px; color: var(--app-text-muted); }

/* 表单行 */
.assign-form-row { display: flex; gap: 16px; margin-bottom: 16px; }
.assign-form-field { display: flex; align-items: center; gap: 8px; }
.assign-form-field label { font-size: 13px; color: var(--app-text-secondary); white-space: nowrap; }
.assign-required { color: var(--app-danger); margin-right: 2px; }

/* 已下发记录 */
.assign-dialog-existing { }
.assign-existing-header { font-size: 12px; font-weight: 500; color: var(--app-text-secondary); margin-bottom: 8px; }
.assign-existing-item { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; margin-bottom: 4px; background: var(--app-surface-hover); border-radius: 6px; }
.assign-existing-info { display: flex; align-items: center; gap: 12px; }
.assign-existing-org { font-size: 13px; font-weight: 500; color: var(--app-text-primary); }
.assign-existing-deadline { font-size: 12px; color: var(--app-text-muted); }
.assign-badge { margin-left: 2px; }
.assign-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 20px; text-align: center; color: var(--app-text-muted); gap: 8px; }
.assign-empty p { font-size: 14px; margin: 0; }
.assign-empty span { font-size: 12px; }

/* ===== 新建模板弹窗 ===== */
.create-form { display: flex; flex-direction: column; gap: 16px; }
.create-field { display: flex; flex-direction: column; gap: 6px; }
.create-label { font-size: 13px; color: #333; font-weight: 500; }
.create-label .required { color: #f56c6c; }
.create-hint { font-size: 12px; color: #999; }
.create-readonly-row { display: flex; gap: 32px; padding: 12px 0 4px; border-top: 1px dashed #ebeef5; margin-top: 4px; }
.create-readonly-item { display: flex; align-items: center; gap: 8px; }
</style>
