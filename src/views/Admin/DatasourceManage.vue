<template>
  <div class="datasource-manage">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">数据源管理</h1>
        <p class="page-desc">管理系统连接的各类数据库和API数据源</p>
      </div>
      <div class="header-right">
        <el-button @click="loadList" :loading="loading">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          刷新
        </el-button>
        <el-button type="primary" @click="handleCreate">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          新建数据源
        </el-button>
      </div>
    </div>

    <div class="content-card">
      <div class="filter-bar">
        <el-input v-model="filterKeyword" placeholder="搜索数据源名称或编码" class="search-input" clearable>
          <template #prefix>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </template>
        </el-input>
        <el-select v-model="filterType" placeholder="数据源类型" style="width: 160px" clearable>
          <el-option label="全部" value=""/>
          <el-option v-for="t in sourceTypes" :key="t.value" :label="t.label" :value="t.value"/>
        </el-select>
      </div>

      <el-table :data="filteredDatasources" v-loading="loading" border style="width: 100%">
        <el-table-column prop="sourceName" label="数据源名称" min-width="160">
          <template #default="{ row }">
            <span class="ds-name">{{ row.sourceName }}</span>
            <span class="ds-code">{{ row.sourceCode }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sourceType" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.sourceType)" size="small" effect="plain">
              {{ getTypeText(row.sourceType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="连接信息" min-width="240">
          <template #default="{ row }">
            <span class="ds-conn">{{ formatConnection(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="refreshPolicy" label="刷新策略" width="110">
          <template #default="{ row }">
            {{ getRefreshText(row.refreshPolicy) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="170">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" @click="handleTest(row)" :loading="testingId === row.id">
              测试连接
            </el-button>
            <el-button text size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button text size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑数据源' : '新建数据源'"
      width="680px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="120px" label-position="right">
        <!-- 基本信息 -->
        <el-divider content-position="left">基本信息</el-divider>

        <el-form-item label="数据源编码" prop="sourceCode">
          <el-input v-model="form.sourceCode" placeholder="如：ds_mysql_prod" :disabled="isEdit"/>
        </el-form-item>
        <el-form-item label="数据源名称" prop="sourceName">
          <el-input v-model="form.sourceName" placeholder="如：MySQL生产库"/>
        </el-form-item>
        <el-form-item label="数据源类型" prop="sourceType">
          <el-select v-model="form.sourceType" placeholder="选择类型" style="width: 100%" @change="onTypeChange">
            <el-option v-for="t in sourceTypes" :key="t.value" :label="t.label" :value="t.value"/>
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="可选"/>
        </el-form-item>

        <!-- 连接配置（按类型动态） -->
        <el-divider content-position="left">连接配置</el-divider>

        <!-- MySQL / PostgreSQL -->
        <template v-if="['mysql', 'postgresql'].includes(form.sourceType)">
          <el-form-item label="主机地址" prop="connConfig.host">
            <el-input v-model="connConfig.host" placeholder="如：192.168.1.100"/>
          </el-form-item>
          <el-form-item label="端口" prop="connConfig.port">
            <el-input-number v-model="connConfig.port" :min="1" :max="65535" controls-position="right" style="width: 100%"/>
          </el-form-item>
          <el-form-item label="数据库名" prop="connConfig.database">
            <el-input v-model="connConfig.database" placeholder="如：production"/>
          </el-form-item>
          <el-form-item label="用户名" prop="connConfig.username">
            <el-input v-model="connConfig.username" placeholder="数据库用户名"/>
          </el-form-item>
          <el-form-item label="密码" prop="connConfig.password">
            <el-input v-model="connConfig.password" type="password" show-password placeholder="数据库密码"/>
          </el-form-item>
        </template>

        <!-- API -->
        <template v-if="form.sourceType === 'api'">
          <el-form-item label="接口地址" prop="connConfig.url">
            <el-input v-model="connConfig.url" placeholder="如：https://api.example.com/v1/data"/>
          </el-form-item>
          <el-form-item label="请求方法">
            <el-select v-model="connConfig.method" style="width: 100%">
              <el-option label="GET" value="GET"/>
              <el-option label="POST" value="POST"/>
            </el-select>
          </el-form-item>
          <el-form-item label="请求头(JSON)">
            <el-input v-model="connConfig.headers" type="textarea" :rows="3" placeholder='{"Authorization":"Bearer xxx"}'/>
          </el-form-item>
        </template>

        <!-- Elasticsearch -->
        <template v-if="form.sourceType === 'elasticsearch'">
          <el-form-item label="节点地址" prop="connConfig.hosts">
            <el-input v-model="connConfig.hosts" placeholder="如：localhost:9200,192.168.1.100:9200"/>
          </el-form-item>
          <el-form-item label="用户名">
            <el-input v-model="connConfig.username" placeholder="可选"/>
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="connConfig.password" type="password" show-password placeholder="可选"/>
          </el-form-item>
        </template>

        <!-- File / Excel -->
        <template v-if="['file', 'excel'].includes(form.sourceType)">
          <el-form-item label="文件路径" prop="connConfig.filePath">
            <el-input v-model="connConfig.filePath" placeholder="如：/data/reports/sales_2024.xlsx"/>
          </el-form-item>
        </template>

        <!-- 查询模板 -->
        <el-form-item label="查询模板">
          <el-input
            v-model="form.queryTemplate"
            type="textarea"
            :rows="3"
            :placeholder="queryPlaceholder"
          />
        </el-form-item>

        <!-- 字段映射 -->
        <el-divider content-position="left">字段映射</el-divider>

        <el-form-item label="维度字段">
          <div class="field-list">
            <div v-for="(dim, idx) in dimensions" :key="'dim-' + idx" class="field-row">
              <el-input v-model="dim.field" placeholder="字段名" style="width: 140px"/>
              <el-input v-model="dim.name" placeholder="显示名称" style="flex: 1"/>
              <el-button text type="danger" @click="dimensions.splice(idx, 1)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </el-button>
            </div>
            <el-button text type="primary" @click="addDimension">+ 添加维度</el-button>
          </div>
        </el-form-item>

        <el-form-item label="指标字段">
          <div class="field-list">
            <div v-for="(met, idx) in metrics" :key="'met-' + idx" class="field-row">
              <el-input v-model="met.field" placeholder="字段名" style="width: 140px"/>
              <el-input v-model="met.name" placeholder="显示名称" style="flex: 1"/>
              <el-select v-model="met.type" placeholder="类型" style="width: 100px">
                <el-option label="数值" value="number"/>
                <el-option label="百分比" value="percent"/>
                <el-option label="货币" value="currency"/>
              </el-select>
              <el-button text type="danger" @click="metrics.splice(idx, 1)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </el-button>
            </div>
            <el-button text type="primary" @click="addMetric">+ 添加指标</el-button>
          </div>
        </el-form-item>

        <!-- 高级配置 -->
        <el-divider content-position="left">高级配置</el-divider>

        <el-form-item label="刷新策略">
          <el-select v-model="form.refreshPolicy" style="width: 100%">
            <el-option label="手动刷新" value="manual"/>
            <el-option label="每5分钟" value="auto_5min"/>
            <el-option label="每小时" value="auto_1hour"/>
            <el-option label="每天" value="daily"/>
            <el-option label="Cron表达式" value="cron"/>
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.refreshPolicy === 'cron'" label="Cron表达式">
          <el-input v-model="form.cronExpression" placeholder="如：0 0 2 * * ?"/>
        </el-form-item>
        <el-form-item label="缓存时间(秒)">
          <el-input-number v-model="form.cacheTtl" :min="0" :max="86400" controls-position="right" style="width: 100%"/>
        </el-form-item>
        <el-form-item label="启用连接池">
          <el-switch v-model="form.usePool"/>
        </el-form-item>
        <el-form-item v-if="form.usePool" label="最大连接数">
          <el-input-number v-model="form.maxPoolSize" :min="1" :max="100" controls-position="right" style="width: 100%"/>
        </el-form-item>
        <el-form-item label="超时时间(ms)">
          <el-input-number v-model="form.timeoutMs" :min="1000" :max="120000" :step="1000" controls-position="right" style="width: 100%"/>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getDataSources,
  createDataSource,
  updateDataSource,
  deleteDataSource,
  testDataSourceConnection
} from '@/api/reportEngine'

// ==================== 数据源类型 ====================
const sourceTypes = [
  { label: 'MySQL', value: 'mysql' },
  { label: 'PostgreSQL', value: 'postgresql' },
  { label: 'API接口', value: 'api' },
  { label: 'Elasticsearch', value: 'elasticsearch' },
  { label: '文件', value: 'file' },
  { label: 'Excel', value: 'excel' }
]

// ==================== 列表 ====================
const loading = ref(false)
const datasources = ref([])
const filterKeyword = ref('')
const filterType = ref('')

const filteredDatasources = computed(() => {
  return datasources.value.filter(d => {
    const kw = filterKeyword.value.toLowerCase()
    const matchKeyword = !kw || (d.sourceName || '').toLowerCase().includes(kw) || (d.sourceCode || '').toLowerCase().includes(kw)
    const matchType = !filterType.value || d.sourceType === filterType.value
    return matchKeyword && matchType
  })
})

async function loadList() {
  loading.value = true
  try {
    const res = await getDataSources()
    datasources.value = Array.isArray(res) ? res : (res?.data || [])
  } catch (e) {
    ElMessage.error('加载数据源列表失败: ' + (e.message || e))
    datasources.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadList()
})

// ==================== 表单 ====================
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const testingId = ref(null)
const formRef = ref(null)

const form = reactive({
  id: null,
  sourceCode: '',
  sourceName: '',
  sourceType: 'mysql',
  queryTemplate: '',
  refreshPolicy: 'manual',
  cronExpression: '',
  cacheTtl: 0,
  description: '',
  usePool: false,
  maxPoolSize: 10,
  timeoutMs: 30000,
  status: 1
})

// 连接配置（按类型不同）
const connConfig = reactive({
  host: '',
  port: 3306,
  database: '',
  username: '',
  password: '',
  url: '',
  method: 'GET',
  headers: '',
  hosts: '',
  filePath: ''
})

// 字段映射
const dimensions = ref([])
const metrics = ref([])

const formRules = {
  sourceCode: [{ required: true, message: '请输入数据源编码', trigger: 'blur' }],
  sourceName: [{ required: true, message: '请输入数据源名称', trigger: 'blur' }],
  sourceType: [{ required: true, message: '请选择数据源类型', trigger: 'change' }]
}

const queryPlaceholder = computed(() => {
  switch (form.sourceType) {
    case 'mysql':
    case 'postgresql':
      return '如：SELECT * FROM sales WHERE year = #{year}'
    case 'api':
      return '如：/api/v1/sales?page={page}&size={size}'
    case 'elasticsearch':
      return '如：{"query":{"match_all":{}}}'
    default:
      return '查询模板（可选）'
  }
})

function onTypeChange() {
  // 切换类型时设置默认端口
  if (form.sourceType === 'mysql') connConfig.port = 3306
  if (form.sourceType === 'postgresql') connConfig.port = 5432
}

function resetForm() {
  Object.assign(form, {
    id: null,
    sourceCode: '',
    sourceName: '',
    sourceType: 'mysql',
    queryTemplate: '',
    refreshPolicy: 'manual',
    cronExpression: '',
    cacheTtl: 0,
    description: '',
    usePool: false,
    maxPoolSize: 10,
    timeoutMs: 30000,
    status: 1
  })
  Object.assign(connConfig, {
    host: '',
    port: 3306,
    database: '',
    username: '',
    password: '',
    url: '',
    method: 'GET',
    headers: '',
    hosts: '',
    filePath: ''
  })
  dimensions.value = []
  metrics.value = []
}

function buildConnectionConfig() {
  const t = form.sourceType
  if (t === 'mysql' || t === 'postgresql') {
    return {
      host: connConfig.host,
      port: connConfig.port,
      database: connConfig.database,
      username: connConfig.username,
      password: connConfig.password
    }
  }
  if (t === 'api') {
    const cfg = { url: connConfig.url, method: connConfig.method }
    if (connConfig.headers) {
      try { cfg.headers = JSON.parse(connConfig.headers) } catch { cfg.headers = {} }
    }
    return cfg
  }
  if (t === 'elasticsearch') {
    const cfg = { hosts: connConfig.hosts }
    if (connConfig.username) cfg.username = connConfig.username
    if (connConfig.password) cfg.password = connConfig.password
    return cfg
  }
  if (t === 'file' || t === 'excel') {
    return { filePath: connConfig.filePath }
  }
  return {}
}

function buildFieldMapping() {
  return {
    dimensions: dimensions.value.filter(d => d.field),
    metrics: metrics.value.filter(m => m.field)
  }
}

function fillConnConfig(config) {
  if (!config || typeof config !== 'object') return
  connConfig.host = config.host || ''
  connConfig.port = config.port || 3306
  connConfig.database = config.database || ''
  connConfig.username = config.username || ''
  connConfig.password = config.password || ''
  connConfig.url = config.url || ''
  connConfig.method = config.method || 'GET'
  connConfig.hosts = config.hosts || ''
  connConfig.filePath = config.filePath || ''
  if (config.headers && typeof config.headers === 'object') {
    connConfig.headers = JSON.stringify(config.headers, null, 2)
  } else {
    connConfig.headers = ''
  }
}

function fillFieldMapping(mapping) {
  if (!mapping || typeof mapping !== 'object') {
    dimensions.value = []
    metrics.value = []
    return
  }
  dimensions.value = Array.isArray(mapping.dimensions) ? mapping.dimensions.map(d => ({ ...d })) : []
  metrics.value = Array.isArray(mapping.metrics) ? mapping.metrics.map(m => ({ ...m })) : []
}

function addDimension() {
  dimensions.value.push({ field: '', name: '' })
}

function addMetric() {
  metrics.value.push({ field: '', name: '', type: 'number' })
}

// ==================== 操作 ====================
function handleCreate() {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  resetForm()
  Object.assign(form, {
    id: row.id,
    sourceCode: row.sourceCode || '',
    sourceName: row.sourceName || '',
    sourceType: row.sourceType || 'mysql',
    queryTemplate: row.queryTemplate || '',
    refreshPolicy: row.refreshPolicy || 'manual',
    cronExpression: row.cronExpression || '',
    cacheTtl: row.cacheTtl ?? 0,
    description: row.description || '',
    usePool: row.usePool ?? false,
    maxPoolSize: row.maxPoolSize ?? 10,
    timeoutMs: row.timeoutMs ?? 30000,
    status: row.status ?? 1
  })
  fillConnConfig(row.connectionConfig)
  fillFieldMapping(row.fieldMapping)
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  const payload = {
    sourceCode: form.sourceCode,
    sourceName: form.sourceName,
    sourceType: form.sourceType,
    connectionConfig: buildConnectionConfig(),
    queryTemplate: form.queryTemplate || null,
    fieldMapping: buildFieldMapping(),
    refreshPolicy: form.refreshPolicy,
    cronExpression: form.refreshPolicy === 'cron' ? form.cronExpression : null,
    cacheTtl: form.cacheTtl,
    description: form.description || null,
    usePool: form.usePool,
    maxPoolSize: form.maxPoolSize,
    timeoutMs: form.timeoutMs,
    status: form.status
  }

  submitting.value = true
  try {
    if (isEdit.value) {
      payload.id = form.id
      await updateDataSource(form.id, payload)
      ElMessage.success('数据源更新成功')
    } else {
      await createDataSource(payload)
      ElMessage.success('数据源创建成功')
    }
    dialogVisible.value = false
    loadList()
  } catch (e) {
    ElMessage.error((isEdit.value ? '更新' : '创建') + '失败: ' + (e.message || e))
  } finally {
    submitting.value = false
  }
}

async function handleTest(row) {
  testingId.value = row.id
  try {
    const res = await testDataSourceConnection(row.id)
    const success = typeof res === 'boolean' ? res : (res?.data ?? false)
    if (success) {
      ElMessage.success(`数据源「${row.sourceName}」连接成功`)
    } else {
      ElMessage.error(`数据源「${row.sourceName}」连接失败`)
    }
  } catch (e) {
    ElMessage.error('连接测试异常: ' + (e.message || e))
  } finally {
    testingId.value = null
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确定要删除数据源「${row.sourceName}」吗？此操作不可恢复。`,
      '删除确认',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return
  }

  try {
    await deleteDataSource(row.id)
    ElMessage.success('数据源已删除')
    loadList()
  } catch (e) {
    ElMessage.error('删除失败: ' + (e.message || e))
  }
}

// ==================== 工具函数 ====================
function getTypeText(type) {
  const item = sourceTypes.find(t => t.value === type)
  return item ? item.label : type
}

function getTypeTagType(type) {
  const map = {
    mysql: 'primary',
    postgresql: 'success',
    api: 'warning',
    elasticsearch: 'info',
    file: '',
    excel: ''
  }
  return map[type] || ''
}

function getRefreshText(policy) {
  const map = {
    manual: '手动',
    auto_5min: '每5分钟',
    auto_1hour: '每小时',
    daily: '每天',
    cron: 'Cron'
  }
  return map[policy] || policy || '-'
}

function formatConnection(row) {
  const cfg = row.connectionConfig
  if (!cfg || typeof cfg !== 'object') return '-'
  const t = row.sourceType
  if (t === 'mysql' || t === 'postgresql') {
    return `${cfg.host || '-'}:${cfg.port || '-'} / ${cfg.database || '-'}`
  }
  if (t === 'api') return cfg.url || '-'
  if (t === 'elasticsearch') return cfg.hosts || '-'
  if (t === 'file' || t === 'excel') return cfg.filePath || '-'
  return '-'
}

function formatTime(t) {
  if (!t) return '-'
  if (typeof t === 'string') return t.replace('T', ' ').substring(0, 19)
  return String(t)
}
</script>

<style scoped>
.datasource-manage {
  padding: var(--app-content-padding);
  height: 100%;
  overflow-y: auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--app-space-6);
}

.header-left {
  .page-title {
    font-size: var(--app-font-h4);
    font-weight: var(--app-font-bold);
    color: var(--app-text-primary);
    margin: 0;
  }
  .page-desc {
    font-size: var(--app-font-caption);
    color: var(--app-text-secondary);
    margin: var(--app-space-1) 0 0;
  }
}

.header-right {
  display: flex;
  gap: var(--app-space-3);
}

.content-card {
  background: var(--app-surface);
  border-radius: var(--app-card-radius);
  padding: var(--app-space-6);
  box-shadow: var(--app-shadow-sm);
  border: 1px solid var(--app-border);
}

.filter-bar {
  display: flex;
  gap: var(--app-space-3);
  margin-bottom: var(--app-space-5);
  flex-wrap: wrap;
}

.search-input {
  width: 280px;
}

.ds-name {
  font-weight: 500;
  color: var(--app-text-primary);
}

.ds-code {
  display: block;
  font-size: 12px;
  color: var(--app-text-secondary);
  margin-top: 2px;
}

.ds-conn {
  font-size: 13px;
  color: var(--app-text-secondary);
  font-family: 'JetBrains Mono', monospace;
}

.field-list {
  width: 100%;
}

.field-row {
  display: flex;
  gap: var(--app-space-2);
  margin-bottom: var(--app-space-2);
  align-items: center;
}

:deep(.el-divider__text) {
  font-size: 13px;
  font-weight: 500;
  color: var(--app-text-secondary);
}

:deep(.el-dialog__body) {
  max-height: 60vh;
  overflow-y: auto;
}
</style>
