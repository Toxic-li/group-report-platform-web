<template>
  <div class="designer" v-loading="loading" :class="{ 'is-loading': loading }">
    <!-- 顶部工具栏 -->
    <header class="dg-header">
      <div class="dh-left">
        <button class="dh-back" @click="$router.back()" title="返回">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <span class="dh-title">报表设计器</span>
      </div>

      <div class="dh-center">
        <input v-model="tpl.name" class="dh-name-input" placeholder="报表名称" />
        <input v-model="tpl.code" class="dh-code-input" placeholder="模板代码 如 RPT-XXX-001" />
        <select v-model="tpl.templateType" class="dh-cat-select">
          <option :value="0">选择类型</option>
          <option :value="1">统计报表</option>
          <option :value="2">填报报表</option>
          <option :value="3">汇总报表</option>
        </select>
        <select v-model="tpl.category" class="dh-cat-select">
          <option value="">选择分类</option>
          <option value="production">生产报表</option>
          <option value="finance">财务报表</option>
          <option value="safety">安全报表</option>
          <option value="energy">能源报表</option>
          <option value="cost">成本报表</option>
        </select>
        <select v-model="tpl.status" class="dh-cat-select">
          <option value="designing">设计中</option>
          <option value="pending">待审批</option>
          <option value="published">已发布</option>
          <option value="changed">已变更</option>
          <option value="archived">已归档</option>
          <option value="disabled">已停用</option>
        </select>
      </div>

      <div class="dh-right">
        <button class="dh-btn dh-btn-outline" @click="showJSON = !showJSON">
          {{ showJSON ? '隐藏JSON' : '预览JSON' }}
        </button>
        <button class="dh-btn dh-btn-outline" @click="exportTemplate">导出</button>
        <button v-if="tpl.id" class="dh-btn dh-btn-outline" @click="handlePublishTemplate" :disabled="saving">{{ publishing ? '发布中...' : '发布' }}</button>
        <button class="dh-btn dh-btn-primary" @click="handleSaveTemplate" :disabled="saving || !isValid">
          {{ saving ? '保存中...' : (tpl.id ? '保存' : '创建报表') }}
        </button>
      </div>
    </header>

    <div class="dg-body">
      <!-- 左侧：面板导航 -->
      <aside class="dg-sidebar">
        <nav class="dg-nav">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            :class="['dg-nav-btn', { active: activeTab === tab.key }]"
            @click="activeTab = tab.key"
          >
            <span class="dgn-icon">{{ tab.icon }}</span>
            <span class="dgn-label">{{ tab.label }}</span>
          </button>
        </nav>
      </aside>

      <!-- 中间：编辑区 -->
      <main class="dg-main">
        <!-- ====== 基本信息 ====== -->
        <section v-if="activeTab === 'basic'" class="dg-panel">
          <h3 class="dp-title">基本信息</h3>
          <div class="dp-form">
            <div class="dp-field">
              <label>报表名称 *</label>
              <input v-model="tpl.name" placeholder="如：煤炭生产销售库存表" />
            </div>
            <div class="dp-field">
              <label>模板代码 *</label>
              <input v-model="tpl.code" placeholder="如：RPT-COAL-001" />
            </div>
            <div class="dp-row">
              <div class="dp-field">
                <label>模板类型 *</label>
                <select v-model="tpl.templateType">
                  <option :value="0">请选择类型</option>
                  <option :value="1">统计报表</option>
                  <option :value="2">填报报表</option>
                  <option :value="3">汇总报表</option>
                </select>
              </div>
              <div class="dp-field">
                 <label>状态</label>
                 <select v-model="tpl.status">
                   <option value="designing">设计中</option>
                   <option value="pending">待审批</option>
                   <option value="published">已发布</option>
                   <option value="changed">已变更</option>
                   <option value="archived">已归档</option>
                   <option value="disabled">已停用</option>
                 </select>
               </div>
            </div>
            <div class="dp-field">
              <label>描述</label>
              <textarea v-model="tpl.description" rows="3" placeholder="报表用途说明..."></textarea>
            </div>
            <div class="dp-row">
              <div class="dp-field">
                <label>分类</label>
                <select v-model="tpl.category">
                  <option value="">未分类</option>
                  <option value="production">生产</option>
                  <option value="finance">财务</option>
                  <option value="safety">安全</option>
                  <option value="energy">能源</option>
                  <option value="cost">成本</option>
                </select>
              </div>
              <div class="dp-field">
                <label>版本</label>
                <input type="number" v-model.number="tpl.version" min="1" max="99" />
              </div>
            </div>
            <div class="dp-row">
              <div class="dp-field">
                <label>图标</label>
                <input v-model="tpl.icon" style="width:60px" />
              </div>
              <div class="dp-field">
                <label>标签（逗号分隔）</label>
                <input v-model="tagsInput" placeholder="煤炭, 月报, 生产" />
              </div>
            </div>
          </div>
        </section>

        <!-- ====== 行树编辑 ====== -->
        <section v-if="activeTab === 'rows'" class="dg-panel">
          <h3 class="dp-title">
            行维度配置
            <span class="dp-hint">定义报表的行结构（产品分类、部门等）</span>
          </h3>
          <div class="dp-toolbar">
            <button class="dp-tb-btn" @click="addRowNode(null)">+ 添加根节点</button>
            <button class="dp-tb-btn" @click="importRowsFromTemplate" :disabled="!hasExampleData">导入示例数据</button>
            <span class="dp-count">{{ rowCount }} 个节点</span>
          </div>
          <div class="dp-tree-editor">
            <TreeNodeEditor
              :nodes="tpl.rowTree"
              :depth="0"
              label-key="name"
              @add="addRowNode"
              @remove="removeRowNode"
              @update="updateRowNode"
              @move-up="moveRowUp"
              @move-down="moveRowDown"
              @toggle-summary="toggleRowSummary"
            />
            <div v-if="!tpl.rowTree.length" class="dp-empty">
              <p>暂无行节点，点击上方按钮添加</p>
            </div>
          </div>
        </section>

        <!-- ====== 列树编辑 ====== -->
        <section v-if="activeTab === 'cols'" class="dg-panel">
          <h3 class="dp-title">
            列维度配置
            <span class="dp-hint">定义报表的列结构（时间周期、指标类型等）</span>
          </h3>
          <div class="dp-toolbar">
            <button class="dp-tb-btn" @click="addColNode(null)">+ 添加根节点</button>
            <button class="dp-tb-btn" @click="importColsFromTemplate" :disabled="!hasExampleData">导入示例数据</button>
            <span class="dp-count">{{ colCount }} 个节点</span>
          </div>
          <div class="dp-tree-editor">
            <TreeNodeEditor
              :nodes="tpl.columnTree"
              :depth="0"
              label-key="title"
              show-col-options
              @add="addColNode"
              @remove="removeColNode"
              @update="updateColNode"
              @move-up="moveColUp"
              @move-down="moveColDown"
            />
            <div v-if="!tpl.columnTree.length" class="dp-empty">
              <p>暂无列节点，点击上方按钮添加</p>
            </div>
          </div>
        </section>

        <!-- ====== 公式指标 ====== -->
        <section v-if="activeTab === 'metrics'" class="dg-panel">
          <h3 class="dp-title">
            计算指标（公式）
            <span class="dp-hint">定义通过公式计算的字段</span>
          </h3>
          <div class="dp-toolbar">
            <button class="dp-tb-btn dp-tb-primary" @click="addMetric">+ 添加指标</button>
            <span class="dp-count">{{ tpl.metrics.length }} 个公式</span>
          </div>
          <table class="dp-metric-table">
            <thead>
              <tr>
                <th width="140">字段名</th>
                <th width="120">显示名称</th>
                <th>表达式</th>
                <th width="90">结果类型</th>
                <th width="80">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(m, mi) in tpl.metrics" :key="m.field || mi">
                <td><input v-model="m.field" placeholder="fieldId" /></td>
                <td><input v-model="m.label" placeholder="显示名" /></td>
                <td><input v-model="m.expression" placeholder="如: a / b * 100" /></td>
                <td>
                  <select v-model="m.type">
                    <option value="number">数值</option>
                    <option value="percent">百分比</option>
                    <option value="string">文本</option>
                    <option value="currency">金额</option>
                  </select>
                </td>
                <td class="dp-actions">
                  <button class="dp-a-btn danger" @click="removeMetric(mi)" title="删除">×</button>
                </td>
              </tr>
              <tr v-if="!tpl.metrics.length">
                <td colspan="5" class="dp-empty-cell">暂无公式指标</td>
              </tr>
            </tbody>
          </table>
        </section>

        <!-- ====== 布局配置 ====== -->
        <section v-if="activeTab === 'layout'" class="dg-panel">
          <h3 class="dp-title">布局与样式</h3>
          <div class="dp-form dp-grid-2">
            <div class="dp-field">
              <label>冻结行数</label>
              <input type="number" v-model.number="tpl.layout.frozenRows" min="0" max="20" />
            </div>
            <div class="dp-field">
              <label>冻结列数</label>
              <input type="number" v-model.number="tpl.layout.frozenCols" min="0" max="10" />
            </div>
            <div class="dp-field">
              <label>行高 (px)</label>
              <input type="number" v-model.number="tpl.layout.rowHeight" min="24" max="80" />
            </div>
            <div class="dp-field">
              <label>默认对齐</label>
              <select v-model="tpl.layout.defaultAlign">
                <option value="left">左对齐</option>
                <option value="center">居中</option>
                <option value="right">右对齐</option>
              </select>
            </div>
            <div class="dp-field">
              <label>密度</label>
              <select v-model="tpl.layout.density">
                <option value="compact">紧凑</option>
                <option value="normal">正常</option>
                <option value="comfortable">宽松</option>
              </select>
            </div>
            <div class="dp-field">
              <label>边框样式</label>
              <select v-model="tpl.layout.borderStyle">
                <option value="all">全部</option>
                <option value="horizontal">水平线</option>
                <option value="vertical">垂直线</option>
                <option value="none">无边框</option>
              </select>
            </div>
            <div class="dp-field dp-full">
              <label>
                <input type="checkbox" v-model="tpl.layout.showRowNumbers" /> 显示行号
              </label>
              <label style="margin-left:16px">
                <input type="checkbox" v-model="tpl.layout.stripeRows" /> 斑马纹行
              </label>
            </div>
          </div>
        </section>

        <!-- ====== 校验规则 ====== -->
        <section v-if="activeTab === 'validators'" class="dg-panel">
          <h3 class="dp-title">校验规则</h3>
          <div class="dp-toolbar">
            <button class="dp-tb-btn dp-tb-primary" @click="addValidator">+ 添加规则</button>
          </div>
          <div v-for="(v, vi) in tpl.validators" :key="v.id || vi" class="dp-validator-card">
            <div class="dvc-header">
              <input v-model="v.name" placeholder="规则名称" class="dvc-name" />
              <button class="dp-a-btn danger" @click="removeValidator(vi)">删除</button>
            </div>
            <div class="dvc-body">
              <div class="dp-row">
                <div class="dp-field">
                  <label>作用范围</label>
                  <select v-model="v.scope">
                    <option value="cell">单元格</option>
                    <option value="row">整行</option>
                    <option value="column">整列</option>
                  </select>
                </div>
                <div class="dp-field">
                  <label>目标匹配</label>
                  <input v-model="v.targetId" placeholder="字段ID 或 *通配符" />
                </div>
              </div>
              <div v-for="(r, ri) in v.rules" :key="ri" class="dp-rule-item">
                <select v-model="r.type">
                  <option value="nonNegative">非负数</option>
                  <option value="positive">正数</option>
                  <option value="numeric">数字</option>
                  <option value="required">必填</option>
                  <option value="range">范围</option>
                  <option value="percentRange">百分比范围</option>
                </select>
                <input v-model="r.message" placeholder="错误提示信息" />
                <button class="dp-a-btn" @click="v.rules.splice(ri, 1)">×</button>
              </div>
              <button class="dp-tb-btn dp-tb-sm" @click="v.rules.push({type:'nonNegative', message:'', params:{}})">+ 添加条件</button>
            </div>
          </div>
        </section>

        <!-- ====== 数据源 ====== -->
        <section v-if="activeTab === 'datasource'" class="dg-panel">
          <h3 class="dp-title">数据源配置</h3>
          <div class="dp-form dp-grid-2">
            <div class="dp-field">
              <label>数据源类型</label>
              <select v-model="tpl.dataSource.type">
                <option value="mock">模拟数据</option>
                <option value="mysql">MySQL</option>
                <option value="postgres">PostgreSQL</option>
                <option value="api">REST API</option>
                <option value="elasticsearch">Elasticsearch</option>
                <option value="excel">Excel文件</option>
              </select>
            </div>
            <div class="dp-field">
              <label>数据源ID</label>
              <input v-model="tpl.dataSource.sourceId" placeholder="ds_xxx" />
            </div>
            <div class="dp-field dp-full">
              <label>查询语句 / API URL</label>
              <textarea v-model="tpl.dataSource.query" rows="3" placeholder="SQL查询或API地址..."></textarea>
            </div>
          </div>
        </section>
      </main>

      <!-- 右侧：实时预览 + JSON -->
      <aside class="dg-preview">
        <!-- 实时预览卡片 -->
        <div class="dgp-card">
          <h4>模板摘要</h4>
          <dl class="dgp-info">
            <dt>名称</dt><dd>{{ tpl.name || '-' }}</dd>
            <dt>代码</dt><dd><code>{{ tpl.code || '-' }}</code></dd>
            <dt>类型</dt><dd>{{ templateTypeLabel }}</dd>
            <dt>分类</dt><dd>{{ tpl.category || '未分类' }}</dd>
            <dt>行节点</dt><dd>{{ rowCount }} 个</dd>
            <dt>列节点</dt><dd>{{ colCount }} 个</dd>
            <dt>公式</dt><dd>{{ tpl.metrics?.length || 0 }} 个</dd>
            <dt>校验规则</dt><dd>{{ tpl.validators?.length || 0 }} 条</dd>
            <dt>状态</dt><dd><span :class="'dp-status-' + tpl.status">{{ statusLabel }}</span></dd>
          </dl>
        </div>

        <!-- JSON 预览 -->
        <div v-if="showJSON" class="dgp-card dgp-json">
          <h4>JSON 输出</h4>
          <pre class="dgp-json-pre"><code>{{ jsonOutput }}</code></pre>
        </div>
      </aside>
    </div>

    <!-- Toast 提示 -->
    <Transition name="dg-toast">
      <div v-if="toast.visible" :class="['dg-toast', 'dg-toast-' + toast.type]">{{ toast.message }}</div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import TreeNodeEditor from './TreeNodeEditor.vue'
import { loadTemplate, saveTemplate, updateTemplate, publishTemplate } from '@/api/reportDesigner.js'

const router = useRouter()
const route = useRoute()

// ==================== 标签页 ====================
const tabs = [
  { key: 'basic', label: '基本信息', icon: '📋' },
  { key: 'rows', label: '行维度', icon: '🌳' },
  { key: 'cols', label: '列维度', icon: '📊' },
  { key: 'metrics', label: '公式指标', icon: 'fx' },
  { key: 'layout', label: '布局样式', icon: '🎨' },
  { key: 'validators', label: '校验规则', icon: '✅' },
  { key: 'datasource', label: '数据源', icon: '🔌' }
]
const activeTab = ref('basic')
const showJSON = ref(false)

// ==================== 模板数据 ====================
const tpl = reactive({
  id: '',
  name: '',
  code: '',
  version: 2,
  templateType: 2,     // 默认填报报表
   status: 'designing',  // 默认设计中
  description: '',
  category: '',
  tags: [],
  icon: '📊',

  layout: {
    type: 'table',
    frozenRows: 4,
    frozenCols: 1,
    showRowNumbers: true,
    rowHeight: 32,
    defaultAlign: 'right',
    density: 'normal',
    borderStyle: 'all',
    stripeRows: true
  },

  rowTree: [],
  columnTree: [],

  metrics: [],
  aggregates: [],
  validators: [],
  conditionalFormats: [],

  dataSource: {
    type: 'mock',
    sourceId: '',
    query: ''
  },

  permissions: {
    canEdit: true,
    canExport: true,
    canPrint: true
  }
})

const tagsInput = computed({
  get: () => (tpl.tags || []).join(', '),
  set: (val) => { tpl.tags = val.split(/[,，]/).map(s => s.trim()).filter(Boolean) }
})

// ==================== 统计 ====================
const rowCount = computed(() => countNodes(tpl.rowTree))
const colCount = computed(() => countNodes(tpl.columnTree))
const isValid = computed(() => {
  return tpl.name.trim() && tpl.code.trim() && tpl.rowTree.length > 0 && tpl.columnTree.length > 0
})
const statusLabel = computed(() => ({
  designing: '设计中', pending: '待审批', published: '已发布',
  changed: '已变更', archived: '已归档', disabled: '已停用'
}[tpl.status] || tpl.status))
const templateTypeLabel = computed(() => ({ 1: '统计报表', 2: '填报报表', 3: '汇总报表' }[tpl.templateType] || '未设置'))

function countNodes(nodes) {
  let c = 0
  const walk = (list) => { for (const n of list) { c++; if (n.children?.length) walk(n.children) } }
  walk(nodes || [])
  return c
}

const hasExampleData = computed(() => true)

// ==================== JSON输出 ====================
const jsonOutput = computed(() => {
  return JSON.stringify({
    id: tpl.id || generateId('tpl'),
    name: tpl.name,
    code: tpl.code,
    version: tpl.version,
    templateType: tpl.templateType,
    status: tpl.status,
    description: tpl.description,
    category: tpl.category,
    tags: [...tpl.tags],
    icon: tpl.icon,
    layout: { ...tpl.layout },
    rowTree: deepClone(tpl.rowTree),
    columnTree: deepClone(tpl.columnTree),
    metrics: (tpl.metrics || []).map(m => ({
      field: m.field, label: m.label, expression: m.expression,
      type: m.type, unit: m.unit, group: m.group
    })),
    validators: deepClone(tpl.validators),
    dataSource: { ...tpl.dataSource }
  }, null, 2)
})

// ==================== 行树操作 ====================
let _rowSeq = 0
function addRowNode(parentPath) {
  const node = {
    id: `r_${Date.now().toString(36)}_${++_rowSeq}`,
    name: `新行${_rowSeq}`,
    level: 0,
    expanded: true,
    children: []
  }
  if (parentPath) {
    insertAtPath(tpl.rowTree, parentPath, node)
  } else {
    tpl.rowTree.push(node)
  }
}
function removeRowNode(path) {
  removeAtPath(tpl.rowTree, path)
}
function updateRowNode(path, data) {
  updateAtPath(tpl.rowTree, path, data)
}
function moveRowUp(path) { moveUpDown(tpl.rowTree, path, -1) }
function moveRowDown(path) { moveUpDown(tpl.rowTree, path, 1) }
function toggleRowSummary(path) {
  const node = findAtPath(tpl.rowTree, path)
  if (node) {
    node.isSummary = !node.isSummary
    if (!node.isSummary) node.summaryType = ''
  }
}
function importRowsFromTemplate() {
  tpl.rowTree = [
    { id: 'r_demo_1', name: '合计', level: 0, isSummary: true, summaryType: 'total', children: [] },
    { id: 'r_demo_2', name: '分类A', level: 0, expanded: true, children: [
      { id: 'r_demo_2a', name: '子项 A1', level: 1 },
      { id: 'r_demo_2b', name: '子项 A2', level: 1 }
    ]},
    { id: 'r_demo_3', name: '分类B', level: 0, children: [] },
    { id: 'r_demo_4', name: '分类C', level: 0, children: [] }
  ]
  showToast('已导入示例行数据', 'success')
}

// ==================== 列树操作 ====================
let _colSeq = 0
function addColNode(parentPath) {
  const node = {
    id: `c_${Date.now().toString(36)}_${++_colSeq}`,
    title: `新列${_colSeq}`,
    type: 'data',
    format: 'number',
    width: 100,
    align: 'right',
    children: []
  }
  if (parentPath) {
    insertAtPath(tpl.columnTree, parentPath, node)
  } else {
    tpl.columnTree.push(node)
  }
}
function removeColNode(path) { removeAtPath(tpl.columnTree, path) }
function updateColNode(path, data) { updateAtPath(tpl.columnTree, path, data) }
function moveColUp(path) { moveUpDown(tpl.columnTree, path, -1) }
function moveColDown(path) { moveUpDown(tpl.columnTree, path, 1) }

function importColsFromTemplate() {
  tpl.columnTree = [
    { id: 'c_m', title: '本月', level: 0, expanded: true, children: [
      { id: 'cm_val1', title: '指标1', type: 'data', format: 'number' },
      { id: 'cm_val2', title: '指标2', type: 'data', format: 'number' },
      { id: 'cm_val3', title: '指标3', type: 'data', format: 'percent' }
    ]},
    { id: 'c_ytd', title: '累计', level: 0, expanded: true, children: [
      { id: 'cy_val1', title: '指标1', type: 'data', format: 'number' },
      { id: 'cy_val2', title: '指标2', type: 'data', format: 'number' }
    ]},
    { id: 'c_yoy', title: '同比%', level: 0, children: [
      { id: 'coy_v1', title: '同比1', type: 'derived', format: 'percent' },
      { id: 'coy_v2', title: '同比2', type: 'derived', format: 'percent' }
    ]}
  ]
  showToast('已导入示例列数据', 'success')
}

// ==================== 指标操作 ====================
let _metricSeq = 0
function addMetric() {
  tpl.metrics.push({
    field: `metric_${++_metricSeq}`,
    label: '',
    expression: '',
    type: 'number',
    unit: '',
    group: ''
  })
}
function removeMetric(idx) { tpl.metrics.splice(idx, 1) }

// ==================== 校验规则操作 ====================
function addValidator() {
  tpl.validators.push({
    id: `val_${Date.now().toString(36)}`,
    name: '',
    scope: 'cell',
    targetType: 'pattern',
    targetId: '*',
    rules: [{ type: 'nonNegative', message: '', severity: 'error', trigger: 'change' }],
    enabled: true
  })
}
function removeValidator(idx) { tpl.validators.splice(idx, 1) }

// ==================== 保存/导出 ====================
const toast = reactive({ visible: false, message: '', type: 'success' })
function showToast(msg, type = 'success') {
  toast.message = msg; toast.type = type; toast.visible = true
  setTimeout(() => { toast.visible = false }, 2500)
}

function exportTemplate() {
  const json = jsonOutput.value
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${tpl.code || 'template'}.json`
  a.click()
  URL.revokeObjectURL(url)
  showToast('JSON文件已导出', 'success')
}

// ==================== 工具函数 ====================
function generateId(prefix = '') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj || {}))
}

/** 在指定路径插入子节点 */
function insertAtPath(nodes, path, newNode) {
  if (!path || path.length === 0) { nodes.push(newNode); return }
  const [head, ...rest] = path
  const parent = nodes[head]
  if (parent) {
    if (!parent.children) parent.children = []
    if (rest.length === 0) { parent.children.push(newNode) }
    else { insertAtPath(parent.children, rest, newNode) }
  }
}

/** 删除指定路径的节点 */
function removeAtPath(nodes, path) {
  if (!path || path.length === 0) return
  if (path.length === 1) { nodes.splice(path[0], 1); return }
  const [head, ...rest] = path
  if (nodes[head]?.children) removeAtPath(nodes[head].children, rest)
}

/** 更新指定路径的节点 */
function updateAtPath(nodes, path, data) {
  const node = findAtPath(nodes, path)
  if (node) Object.assign(node, data)
}

/** 查找路径对应的节点 */
function findAtPath(nodes, path) {
  let current = null
  let list = nodes
  for (const idx of path) {
    current = list[idx]
    if (!current) return null
    list = current.children || []
  }
  return current
}

/** 节点上下移动 */
function moveUpDown(nodes, path, direction) {
  if (!path || path.length === 0) return
  const idx = path[path.length - 1]
  const siblingList = path.length <= 1 ? nodes : findAtPath(nodes, path.slice(0, -1))?.children
  if (!siblingList) return
  const newIdx = idx + direction
  if (newIdx < 0 || newIdx >= siblingList.length) return
  const temp = siblingList[idx]
  siblingList[idx] = siblingList[newIdx]
  siblingList[newIdx] = temp
}

// ==================== 加载和保存 ====================
const loading = ref(false)
const saving = ref(false)
const publishing = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    // 检查是否是编辑模式（从路由获取模板代码）
    if (route.query.code) {
      // 尝试从 API 加载模板（优先）
      try {
        const res = await loadTemplate(route.query.code)
        Object.assign(tpl, res)
        // 同步到全局缓存
        window.__V2_TEMPLATES = window.__V2_TEMPLATES || {}
        window.__V2_TEMPLATES[`CUSTOM-${res.code}`] = res
        showToast('模板加载成功', 'success')
      } catch (err) {
        console.warn('API 加载失败，尝试 localStorage:', err)
        localStorageFallback(route.query.code)
      }
    } else {
      localStorageFallback()
    }
  } catch (err) {
    showToast('加载模板失败: ' + err.message, 'error')
  } finally {
    loading.value = false
  }
})

// localStorage 兼容回退（保持原有逻辑）
function localStorageFallback(code = null) {
  try {
    const saved = JSON.parse(localStorage.getItem('rpt_custom_templates') || '[]')
    if (code) {
      const existing = saved.find(t => t.code === code || `CUSTOM-${t.code}` === code)
      if (existing) Object.assign(tpl, existing)
    } else {
      // 新建报表时的默认初始化
      if (!tpl.name) tpl.name = '未命名报表'
      if (!tpl.code) tpl.code = generateId('RPT')
      if (!tpl.category) tpl.category = 'custom'
    }
  } catch (err) {
    console.warn('localStorage fallback 失败:', err)
  }
}

// ==================== 保存模板 ====================
async function handleSaveTemplate() {
  if (!isValid.value) {
    showToast('请完善基本信息和行列配置', 'error')
    return
  }

  saving.value = true
  try {
    let output
    // 移除不必要的系统字段
    const cleanTpl = JSON.parse(JSON.stringify(tpl))
    delete cleanTpl._isCustom
    delete cleanTpl.createdAt
    delete cleanTpl.updatedAt
    output = cleanTpl

    let result
    if (tpl.id) {
      // 更新现有模板
      result = await updateTemplate(tpl.id, output)
      Object.assign(tpl, result)
    } else {
      // 创建新模板
      result = await saveTemplate(output)
      Object.assign(tpl, result)
      
      // 同步到全局缓存
      window.__V2_TEMPLATES = window.__V2_TEMPLATES || {}
      window.__V2_TEMPLATES[`CUSTOM-${result.code}`] = result
    }

    showToast(`报表 "${tpl.name}" 已保存`, 'success')

    // 可选：跳转到预览页面
    setTimeout(() => {
      if (confirm(`是否跳转到报表预览页面？\n路径: /report/CUSTOM-${tpl.code}`)) {
        router.push(`/report/CUSTOM-${tpl.code}`)
      }
    }, 800)

  } catch (err) {
    showToast('保存失败: ' + err.message, 'error')
    console.error('保存失败:', err)
  } finally {
    saving.value = false
  }
}

// ==================== 发布模板 ====================
async function handlePublishTemplate() {
  if (!tpl.id || !confirm(`确定要发布报表 "${tpl.name}" 吗？\n发布后报表将出现在模板列表中。`)) return

  publishing.value = true
  try {
    // 先保存最新内容
    await handleSaveTemplate()

    // 调用发布接口
    await publishTemplate(tpl.id)
    tpl.status = 'published'
    showToast(`报表 "${tpl.name}" 已发布`, 'success')
  } catch (err) {
    showToast('发布失败: ' + err.message, 'error')
    console.error('发布失败:', err)
  } finally {
    publishing.value = false
  }
}
</script>

<style lang="scss" scoped>
.designer {
  display: flex; flex-direction: column;
  height: 100vh; background: #F3F4F6;
  color: #1F2937;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* ====== 头部 ====== */
.dg-header {
  display: flex; align-items: center; justify-content: space-between;
  height: 52px; padding: 0 16px;
  background: #fff; border-bottom: 1px solid #E5E7EB;
  flex-shrink: 0; z-index: 10;
}
.dh-left { display: flex; align-items: center; gap: 10px; }
.dh-back {
  width: 32px; height: 32px; border-radius: 8px;
  border: 1px solid #E5E7EB; background: #fff;
  color: #6B7280; cursor: pointer; display: flex; align-items: center; justify-content: center;
  &:hover { background: #F9FAFB; color: #374151; border-color: #D1D5DB; }
}
.dh-title { font-size: 15px; font-weight: 700; color: #111827; }
.dh-center { display: flex; gap: 8px; flex: 1; justify-content: center; }
.dh-name-input {
  width: 180px; height: 32px; padding: 0 10px;
  border: 1px solid #E5E7EB; border-radius: 6px; font-size: 13px; font-weight: 600;
  outline: none; text-align: center;
  &:focus { border-color: #3B82F6; box-shadow: 0 0 0 2px rgba(59,130,246,.12); }
}
.dh-code-input {
  width: 160px; height: 32px; padding: 0 10px;
  border: 1px solid #E5E7EB; border-radius: 6px; font-size: 12px;
  font-family: 'SF Mono', Consolas, monospace; outline: none;
  &:focus { border-color: #3B82F6; box-shadow: 0 0 0 2px rgba(59,130,246,.12); }
}
.dh-cat-select {
  height: 32px; padding: 0 8px; border: 1px solid #E5E7EB; border-radius: 6px;
  font-size: 12px; cursor: pointer; outline: none; background: #fff;
}
.dh-right { display: flex; gap: 8px; }

.dh-btn {
  height: 32px; padding: 0 14px; border-radius: 6px; font-size: 13px; font-weight: 500;
  cursor: pointer; transition: all .15s; white-space: nowrap;
  &.dh-btn-outline {
    background: #fff; border: 1px solid #D1D5DB; color: #374151;
    &:hover { background: #F9FAFB; border-color: #9CA3AF; }
  }
  &.dh-btn-primary {
    background: linear-gradient(135deg, #3B82F6, #2563EB); border: 1px solid transparent;
    color: #fff; box-shadow: 0 1px 3px rgba(37,99,235,.25);
    &:hover { transform: translateY(-1px); box-shadow: 0 3px 8px rgba(37,99,235,.35); }
    &:disabled { opacity: .5; cursor: not-allowed; transform: none; }
  }
}

/* ====== 主体布局 ====== */
.dg-body { display: flex; flex: 1; overflow: hidden; }

/* 左侧导航 */
.dg-sidebar {
  width: 56px; background: #fff; border-right: 1px solid #E5E7EB;
  display: flex; flex-direction: column; padding: 8px 0; flex-shrink: 0;
}
.dg-nav { display: flex; flex-direction: column; gap: 2px; padding: 0 4px; }
.dg-nav-btn {
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  padding: 8px 4px; border-radius: 8px; border: none; background: none;
  cursor: pointer; transition: all .15s; color: #6B7280;
  .dgn-icon { font-size: 18px; line-height: 1; }
  .dgn-label { font-size: 9px; font-weight: 500; line-height: 1; }
  &:hover { background: #F3F4F6; color: #374151; }
  &.active {
    background: #EEF2FF; color: #4338CA;
    .dgn-icon { font-size: 20px; }
    .dgn-label { font-weight: 600; color: #4338CA; }
  }
}

/* 中间编辑区 */
.dg-main {
  flex: 1; overflow-y: auto; padding: 16px 20px;
}
.dg-panel {
  background: #fff; border-radius: 12px; padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
  animation: dp-in .2s ease-out;
}
@keyframes dp-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

.dp-title {
  font-size: 15px; font-weight: 700; margin: 0 0 16px; color: #111827;
  display: flex; align-items: baseline; gap: 10px;
}
.dp-hint { font-size: 11px; font-weight: 400; color: #9CA3AF; }

/* 表单 */
.dp-form { display: flex; flex-direction: column; gap: 14px; }
.dp-field {
  display: flex; flex-direction: column; gap: 4px;
  label { font-size: 11px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: .04em; }
  input, select, textarea {
    height: 34px; padding: 0 10px; border: 1px solid #D1D5DB; border-radius: 6px;
    font-size: 13px; color: #374151; outline: none; transition: border-color .15s;
    background: #fff;
    &:focus { border-color: #3B82F6; box-shadow: 0 0 0 2px rgba(59,130,246,.12); }
    &::placeholder { color: #9CA3AF; }
  }
  textarea { height: auto; resize: vertical; }
}
.dp-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.dp-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.dp-grid-2 .dp-full { grid-column: 1 / -1; }

/* 工具栏 */
.dp-toolbar {
  display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
}
.dp-tb-btn {
  height: 30px; padding: 0 12px; border-radius: 6px; font-size: 12px; font-weight: 500;
  border: 1px solid #D1D5DB; background: #fff; color: #374151; cursor: pointer;
  transition: all .12s; white-space: nowrap;
  &:hover { background: #F9FAFB; border-color: #9CA3AF; }
  &.dp-tb-primary { background: #3B82F6; color: #fff; border-color: #3B82F6; &:hover { background: #2563EB; } }
  &.dp-tb-sm { height: 26px; font-size: 11px; padding: 0 8px; }
  &:disabled { opacity: .45; cursor: not-allowed; }
}
.dp-count { font-size: 11px; color: #9CA3AF; margin-left: auto; }

/* 空状态 */
.dp-empty {
  text-align: center; padding: 40px 20px; color: #9CA3AF;
  p { font-size: 13px; }
}

/* 树编辑器容器 */
.dp-tree-editor { min-height: 200px; }

/* 指标表格 */
.dp-metric-table {
  width: 100%; border-collapse: collapse; font-size: 12px;
  th {
    background: #F9FAFB; padding: 8px 10px; text-align: left; font-weight: 600;
    color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: .03em;
    border-bottom: 1px solid #E5E7EB;
  }
  td { padding: 4px 6px; border-bottom: 1px solid #F3F4F6; vertical-align: middle; }
  input, select {
    width: 100%; height: 30px; padding: 0 6px; border: 1px solid #E5E7EB; border-radius: 4px;
    font-size: 12px; outline: none; background: #fff;
    &:focus { border-color: #3B82F6; }
  }
  .dp-actions { text-align: center; }
  .dp-empty-cell { text-align: center; color: #9CA3AF; padding: 20px; }
}
.dp-a-btn {
  width: 22px; height: 22px; border-radius: 4px; border: 1px solid #E5E7EB;
  background: #fff; color: #6B7280; cursor: pointer; font-size: 14px;
  display: inline-flex; align-items: center; justify-content: center;
  &:hover { background: #FEE2E2; color: #DC2626; border-color: #FECACA; }
  &.danger:hover { background: #FEE2E2; color: #DC2626; border-color: #FECACA; }
}

/* 校验规则卡片 */
.dp-validator-card {
  border: 1px solid #E5E7EB; border-radius: 8px; margin-bottom: 10px; overflow: hidden;
  .dvc-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 12px; background: #F9FAFB; border-bottom: 1px solid #E5E7EB;
  }
  .dvc-name {
    height: 28px; padding: 0 8px; border: 1px solid #D1D5DB; border-radius: 4px;
    font-size: 12px; font-weight: 500; outline: none; width: 200px;
    &:focus { border-color: #3B82F6; }
  }
  .dvc-body { padding: 10px 12px; }
}
.dp-rule-item {
  display: flex; gap: 6px; margin-bottom: 6px; align-items: center;
  select { height: 28px; padding: 0 6px; border: 1px solid #D1D5DB; border-radius: 4px; font-size: 11px; }
  input { flex: 1; height: 28px; padding: 0 8px; border: 1px solid #D1D5DB; border-radius: 4px; font-size: 11px; outline: none; }
}

/* 右侧预览 */
.dg-preview {
  width: 280px; overflow-y: auto; padding: 12px; flex-shrink: 0;
  display: flex; flex-direction: column; gap: 10px;
  border-left: 1px solid #E5E7EB; background: #FAFAFA;
}
.dgp-card {
  background: #fff; border-radius: 10px; padding: 14px;
  border: 1px solid #E5E7EB; box-shadow: 0 1px 2px rgba(0,0,0,.04);
  h4 { font-size: 12px; font-weight: 700; color: #374151; margin: 0 0 10px; }
}
.dgp-info {
  display: grid; grid-template-columns: auto 1fr; gap: 4px 10px; font-size: 11px;
  dt { color: #9CA3AF; }
  dd { color: #374151; margin: 0; word-break: break-all; }
  code { font-size: 10px; background: #F3F4F6; padding: 1px 4px; border-radius: 3px; }
}
.dp-status-draft { color: #F59E0B; font-weight: 600; }
.dp-status-published { color: #10B981; font-weight: 600; }

.dgp-json { .dgp-json-pre {
  max-height: 400px; overflow: auto; background: #1E1E2E; color: #CDD6F4;
  border-radius: 6px; padding: 10px; font-size: 10px; line-height: 1.5;
  font-family: 'SF Mono', Consolas, monospace; margin: 0;
}}

/* Toast */
.dg-toast {
  position: fixed; top: 60px; left: 50%; transform: translateX(-50%);
  padding: 8px 20px; border-radius: 8px; font-size: 13px; font-weight: 500;
  z-index: 9999; box-shadow: 0 8px 24px rgba(0,0,0,.15);
  &.dg-toast-success { background: #10B981; color: #fff; }
  &.dg-toast-error { background: #EF4444; color: #fff; }
  &.dg-toast-warning { background: #F59E0B; color: #fff; }
}
.dg-toast-enter-active, .dg-toast-leave-active { transition: all .3s ease; }
.dg-toast-enter-from, .dg-toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(-12px); }
</style>
