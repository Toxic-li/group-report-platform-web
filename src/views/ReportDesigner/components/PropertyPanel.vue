<template>
  <aside class="property-panel" :class="{ collapsed: isCollapsed }">
    <!-- AI 助手入口 -->
    <div class="ai-banner" v-show="!isCollapsed" @click="emit('openAI')">
      <div class="ai-banner-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      </div>
      <div class="ai-banner-text">
        <span class="ai-banner-title">AI 设计助手</span>
        <span class="ai-banner-desc">智能生成、优化、建议</span>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </div>

    <!-- Tab 头部 -->
    <div class="panel-header">
      <div class="panel-tabs">
        <div class="panel-tab" v-for="tab in tabs" :key="tab.key"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key">
          <span class="tab-label">{{ tab.label }}</span>
        </div>
      </div>
      <button class="collapse-btn" @click="isCollapsed = !isCollapsed" title="收起/展开">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path :d="isCollapsed ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'"/>
        </svg>
      </button>
    </div>

    <div class="panel-body" v-show="!isCollapsed">
      <!-- ========== 行列 Tab - 行维度管理 ========== -->
      <div v-if="activeTab === 'row'" class="tab-content">
        <div class="prop-section">
          <div class="prop-section-title">行维度列表</div>
          <div class="row-list">
            <div v-for="(node, idx) in flatRowTree" :key="node.id"
              class="row-item"
              :class="{ active: selectedRegion.rowNodeId === node.id, summary: node.isSummary }">
              <span class="row-level" v-if="node.level > 0" :style="{ marginLeft: (node.level * 12) + 'px' }">└─</span>
              <span class="row-name" @click="selectRow(node.id)">{{ node.name }}</span>
              <span v-if="node.isSummary" class="row-tag">合计</span>
              <button class="row-del" @click.stop="deleteRow(node.id)" title="删除">×</button>
            </div>
            <div v-if="flatRowTree.length === 0" class="empty-tip">暂无行维度</div>
          </div>
          <button class="add-btn" @click="addRowNode()">
            <span>+</span> 添加行维度
          </button>
          <button class="add-sub-btn" @click="addSummaryRow">
            <span>Σ</span> 添加合计行
          </button>
        </div>

        <div v-if="currentRow" class="prop-section">
          <div class="prop-section-title">行属性</div>
          <div class="prop-field">
            <label>行名称</label>
            <input class="prop-input" v-model="currentRow.name" @input="updateCurrentRow" />
          </div>
          <div class="prop-field">
            <label>行类型</label>
            <select class="prop-select" v-model="currentRow.type" @change="updateCurrentRow">
              <option value="data">数据行</option>
              <option value="header">表头行</option>
              <option value="summary">合计行</option>
              <option value="group">分组行</option>
            </select>
          </div>
          <div class="prop-field">
            <label>行高</label>
            <input class="prop-input" type="number" v-model.number="currentRow.height" @change="updateCurrentRow" />
          </div>
          <div class="prop-field">
            <label>背景色</label>
            <input class="prop-input" v-model="currentRow.backgroundColor" @change="updateCurrentRow" placeholder="#FFFFFF" />
          </div>
        </div>
      </div>

      <!-- ========== 行列 Tab - 列维度管理 ========== -->
      <div v-if="activeTab === 'col'" class="tab-content">
        <div class="prop-section">
          <div class="prop-section-title">列维度列表</div>
          <div class="col-list">
            <div v-for="(node, idx) in flatColumnTree" :key="node.id"
              class="col-item"
              :class="{ active: selectedRegion.colNodeId === node.id }"
              @dragover.prevent
              @drop="onColItemDrop($event, node.id)">
              <span class="col-level" v-if="node.level > 0" :style="{ marginLeft: (node.level * 12) + 'px' }">└─</span>
              <span class="col-name" @click="selectCol(node.id)">{{ node.name }}</span>
              <span v-if="node.required" class="col-tag required">必填</span>
              <button class="col-del" @click.stop="deleteCol(node.id)" title="删除">×</button>
            </div>
            <div v-if="flatColumnTree.length === 0" class="empty-tip">暂无列维度</div>
          </div>
          <button class="add-btn" @click="addColNode()">
            <span>+</span> 添加列维度
          </button>
        </div>

        <div v-if="currentCol" class="prop-section">
          <div class="prop-section-title">列属性</div>
          <div class="prop-field" v-if="currentCol.dataField">
            <label>绑定字段</label>
            <div class="prop-bind-info">
              <span class="bind-tag">{{ currentCol.dataField }}</span>
              <button class="unbind-btn" @click="unbindColField">解除绑定</button>
            </div>
          </div>
          <div class="prop-field">
            <label>列名称</label>
            <input class="prop-input" v-model="currentCol.name" @input="updateCurrentCol" />
          </div>
          <div class="prop-field">
            <label>数据类型</label>
            <select class="prop-select" v-model="currentCol.dataType" @change="updateCurrentCol">
              <option value="string">文本</option>
              <option value="integer">整数</option>
              <option value="decimal">小数</option>
              <option value="percent">百分比</option>
              <option value="currency">金额</option>
              <option value="date">日期</option>
            </select>
          </div>
          <div class="prop-field">
            <label>列类型</label>
            <select class="prop-select" v-model="currentCol.columnType" @change="updateCurrentCol">
              <option value="text">文本</option>
              <option value="number">数字</option>
              <option value="date">日期</option>
              <option value="select">下拉选择</option>
              <option value="formula">公式</option>
              <option value="readonly">只读</option>
            </select>
          </div>
          <div class="prop-field-row">
            <div class="prop-field half">
              <label>列宽</label>
              <input class="prop-input" type="number" v-model.number="currentCol.width" @change="updateCurrentCol" />
            </div>
            <div class="prop-field half">
              <label>小数位</label>
              <input class="prop-input" type="number" v-model.number="currentCol.decimalPlaces" @change="updateCurrentCol" />
            </div>
          </div>
          <div class="prop-field">
            <label class="checkbox-label">
              <input type="checkbox" v-model="currentCol.required" @change="updateCurrentCol" />
              <span>必填</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="currentCol.readonly" @change="updateCurrentCol" />
              <span>只读</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" v-model="currentCol.frozen" @change="updateCurrentCol" />
              <span>冻结</span>
            </label>
          </div>
        </div>
      </div>

      <!-- ========== 指标 Tab ========== -->
      <div v-if="activeTab === 'metric'" class="tab-content">
        <div class="prop-section">
          <div class="prop-section-title">公式列表</div>
          <div class="metric-list" @dragover.prevent @drop="onMetricAreaDrop($event)">
            <div v-for="m in formulaMetrics" :key="m.field"
              class="metric-item"
              :class="{ disabled: m.status === 0 || m.status === '0' }"
              @click="selectMetric(m)">
              <div class="metric-info">
                <span class="metric-label">{{ m.label }}</span>
                <span class="metric-expr">{{ m.expression || '未设置' }}</span>
                <span class="metric-type-tag" :class="m.category || m.type">
                  {{ m.type === 'summary' ? '合计' : (m.category === 'cell' ? '单元格' : '指标') }}
                </span>
              </div>
              <div class="metric-actions">
                <span class="metric-status" :class="m.status === 0 || m.status === '0' ? 'status-off' : 'status-on'">
                  {{ m.status === 0 || m.status === '0' ? '停用' : '启用' }}
                </span>
                <button class="metric-toggle" @click.stop="toggleMetricStatus(m.field)" :title="m.status === 0 || m.status === '0' ? '启用' : '停用'">
                  {{ m.status === 0 || m.status === '0' ? '▶' : '⏸' }}
                </button>
                <button class="metric-del" @click.stop="deleteMetric(m.field)">×</button>
              </div>
            </div>
            <div v-if="formulaMetrics.length === 0" class="empty-tip">暂无公式</div>
          </div>
          <button class="add-btn" @click="handleAddMetric">
            <span>+</span> 添加公式
          </button>
        </div>

        <div v-if="currentMetric" class="prop-section">
          <div class="prop-section-title">指标属性</div>
          <div class="prop-field">
            <label>字段名</label>
            <input class="prop-input" v-model="currentMetric.field" @input="updateMetric" />
          </div>
          <div class="prop-field">
            <label>显示名</label>
            <input class="prop-input" v-model="currentMetric.label" @input="updateMetric" />
          </div>
          <div class="prop-field-row">
            <div class="prop-field half">
              <label>目标行</label>
              <select class="prop-select" v-model="currentMetric.targetRowId" @change="updateMetricTarget">
                <option value="">请选择</option>
                <option v-for="r in dataRows" :key="r.id" :value="r.id">{{ r.name }}</option>
              </select>
            </div>
            <div class="prop-field half">
              <label>目标列</label>
              <select class="prop-select" v-model="currentMetric.targetColId" @change="updateMetricTarget">
                <option value="">请选择</option>
                <option v-for="c in leafCols" :key="c.id" :value="c.id">{{ c.name || c.title }}</option>
              </select>
            </div>
          </div>
          <div class="prop-field">
            <label>公式表达式</label>
            <textarea class="prop-textarea" rows="3" v-model="currentMetric.expression" @input="updateMetric"
              placeholder="如：SUM(r_east:c_h1_q1) 或 r_east:c_h1_q1 / r_total:c_h1_q1"></textarea>
          </div>
          <div v-if="dataRows.length > 0 || leafCols.length > 0" class="prop-field">
            <label>可用引用</label>
            <div class="metric-ref-list">
              <div class="ref-section">
                <span class="ref-title">行引用</span>
                <div class="ref-items">
                  <span v-for="r in dataRows" :key="r.id" class="ref-item"
                    @click="insertRefToExpr(r.id)">{{ r.id }} ({{ r.name }})</span>
                </div>
              </div>
              <div class="ref-section">
                <span class="ref-title">列引用</span>
                <div class="ref-items">
                  <span v-for="c in leafCols" :key="c.id" class="ref-item"
                    @click="insertRefToExpr(c.id)">{{ c.id }} ({{ c.name || c.title }})</span>
                </div>
              </div>
            </div>
          </div>
          <div class="prop-field">
            <label>常用公式</label>
            <div class="metric-template-list">
              <button v-for="tpl in formulaTemplates" :key="tpl.name" class="template-btn"
                @click="applyFormulaTemplate(tpl)">
                {{ tpl.name }}
              </button>
            </div>
          </div>
          <div class="prop-field-row">
            <div class="prop-field half">
              <label>结果类型</label>
              <select class="prop-select" v-model="currentMetric.resultType" @change="updateMetric">
                <option value="number">数字</option>
                <option value="string">文本</option>
                <option value="percent">百分比</option>
                <option value="currency">金额</option>
                <option value="date">日期</option>
              </select>
            </div>
            <div class="prop-field half">
              <label>触发方式</label>
              <select class="prop-select" v-model="currentMetric.calcTrigger" @change="updateMetric">
                <option value="realtime">实时</option>
                <option value="save">保存时</option>
                <option value="submit">提交时</option>
              </select>
            </div>
          </div>
          <div class="prop-field">
            <label>格式化</label>
            <input class="prop-input" v-model="currentMetric.formatPattern" @input="updateMetric"
              placeholder="如：#,##0.00 或 0.00%" />
          </div>
        </div>
      </div>

      <!-- ========== 数据源 Tab ========== -->
      <div v-if="activeTab === 'dataSource'" class="tab-content">
        <div class="prop-section">
          <div class="prop-section-title">数据源绑定</div>
          <div class="data-source-select">
            <label>选择数据源</label>
            <el-select v-model="selectedDataSourceId" placeholder="请选择数据源" style="width: 100%" @change="onDataSourceSelect">
              <el-option label="无（手动录入）" value=""/>
              <el-option v-for="ds in dataSourceList" :key="ds.id" :label="ds.sourceName" :value="String(ds.id)"/>
            </el-select>
          </div>
          <div v-if="selectedDataSource" class="data-source-info">
            <div class="info-row">
              <span class="info-label">数据源类型</span>
              <span class="info-value">{{ getDataSourceTypeText(selectedDataSource.sourceType) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">数据源名称</span>
              <span class="info-value">{{ selectedDataSource.sourceName }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">连接信息</span>
              <span class="info-value">{{ formatConnectionInfo(selectedDataSource) }}</span>
            </div>
          </div>
          <div v-if="selectedDataSourceId" class="data-source-actions">
            <el-button type="primary" size="small" @click="handleSyncData" :loading="syncing">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              从数据源同步数据
            </el-button>
            <el-button size="small" @click="handlePreviewSource" :loading="previewing">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              预览数据
            </el-button>
          </div>
          <div v-if="!selectedDataSourceId" class="data-source-tip">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tip-icon"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <span>未绑定数据源，数据需手动录入</span>
          </div>
        </div>

        <div v-if="selectedDataSource" class="prop-section">
          <div class="prop-section-title">字段映射</div>
          <div class="field-mapping-list">
            <div class="field-mapping-header">
              <span>列名称</span>
              <span>绑定字段</span>
              <span>操作</span>
            </div>
            <div v-for="col in leafCols" :key="col.id" class="field-mapping-row">
              <span class="col-name">{{ col.name || col.title }}</span>
              <select class="prop-select" v-model="col.dataField" @change="onFieldMappingChange">
                <option value="">未绑定</option>
                <option v-for="field in dataSourceFields" :key="field.name" :value="field.name">
                  {{ field.label || field.name }}
                </option>
              </select>
              <button class="unbind-btn" v-if="col.dataField" @click="unbindField(col)">×</button>
            </div>
          </div>
        </div>

        <div v-if="syncResult" class="prop-section">
          <div class="prop-section-title">同步结果</div>
          <div class="sync-result" :class="{ success: syncResult.success, error: !syncResult.success }">
            <svg v-if="syncResult.success" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            <span>{{ syncResult.message }}</span>
          </div>
          <div v-if="syncResult.success && syncResult.count" class="sync-count">
            共同步 {{ syncResult.count }} 个单元格数据
          </div>
        </div>
      </div>

      <!-- ========== 高级 Tab ========== -->
      <div v-if="activeTab === 'advanced'" class="tab-content">
        <div class="prop-section">
          <div class="prop-section-title">模板结构</div>
          <div class="struct-info">
            <div class="info-item">
              <span class="info-label">行维度数</span>
              <span class="info-value">{{ flatRowTree.length }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">列维度数</span>
              <span class="info-value">{{ flatColumnTree.length }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">指标数</span>
              <span class="info-value">{{ metrics.length }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">已填数据</span>
              <span class="info-value">{{ cellData.size }}</span>
            </div>
          </div>
        </div>
        <div class="prop-section">
          <div class="prop-section-title">高级设置</div>
          <div class="prop-advanced-item" @click="emit('openConditionalFormat')">
            <div class="adv-item-left">
              <span>条件格式</span>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          <div class="prop-advanced-item" @click="emit('openPermission')">
            <div class="adv-item-left">
              <span>权限控制</span>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          <div class="prop-advanced-item" @click="emit('openExtension')">
            <div class="adv-item-left">
              <span>扩展设置</span>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useDesigner } from '../composables/useDesigner.js'

const emit = defineEmits(['openConditionalFormat', 'openPermission', 'openExtension', 'openAI'])

const {
  selectedRegion, rowTree, columnTree,
  flatRowTree: flatRowTreeRef, flatColumnTree: flatColumnTreeRef,
  metrics, cellData, dataSource,
  addRowNode, addColNode, deleteRowNode, deleteColNode,
  updateRowNode, updateColNode,
  addMetric, updateMetric: saveMetric, deleteMetric, toggleMetricStatus,
  selectRegion,
  bindFieldToColumn, bindFieldToMetric,
  loadDataSourceList, dataSourceTree,
} = useDesigner()

const flatRowTree = computed(() => flatRowTreeRef.value || [])
const flatColumnTree = computed(() => flatColumnTreeRef.value || [])
const dataRows = computed(() => flatRowTree.value.filter(r => !r.isSummary))
const leafCols = computed(() => flatColumnTree.value.filter(c => !c.children || c.children.length === 0))

const formulaMetrics = computed(() => {
  return (metrics.value || []).filter(m => m.type && m.type !== 'field')
})

const formulaTemplates = [
  { name: '求和 SUM', func: 'SUM' },
  { name: '平均 AVG', func: 'AVG' },
  { name: '最大 MAX', func: 'MAX' },
  { name: '最小 MIN', func: 'MIN' },
  { name: '计数 COUNT', func: 'COUNT' },
]

const isCollapsed = ref(false)
const activeTab = ref('row')

// ========== 数据源相关 ==========
const dataSourceList = ref([])
const selectedDataSourceId = ref('')
const syncing = ref(false)
const previewing = ref(false)
const syncResult = ref(null)

const selectedDataSource = computed(() => {
  return dataSourceList.value.find(ds => String(ds.id) === selectedDataSourceId.value)
})

const dataSourceFields = computed(() => {
  const ds = selectedDataSource.value
  if (!ds) return []
  const fields = []
  if (ds.dimensions) {
    ds.dimensions.forEach(d => fields.push({ name: d.field, label: d.name, type: 'dimension' }))
  }
  if (ds.metrics) {
    ds.metrics.forEach(m => fields.push({ name: m.field, label: m.name, type: 'metric' }))
  }
  return fields
})

async function loadDataSourceOptions() {
  try {
    await loadDataSourceList()
    dataSourceList.value = dataSourceTree.value || []
    if (dataSource.value?.sourceId) {
      selectedDataSourceId.value = String(dataSource.value.sourceId)
    }
  } catch (e) {
    console.warn('加载数据源列表失败:', e)
  }
}

watch(() => activeTab.value, async (tab) => {
  if (tab === 'dataSource') {
    await loadDataSourceOptions()
  }
})

function onDataSourceSelect() {
  if (selectedDataSourceId.value) {
    const ds = selectedDataSource.value
    if (ds) {
      Object.assign(dataSource, {
        sourceId: String(ds.id),
        sourceType: ds.sourceType,
        sourceName: ds.sourceName,
        query: ds.queryTemplate || '',
        fieldMapping: ds.fieldMapping || {},
        refreshPolicy: ds.refreshPolicy || 'manual',
      })
    }
    syncResult.value = null
  } else {
    Object.assign(dataSource, {
      sourceId: null,
      sourceType: 'mysql',
      sourceName: '',
      query: '',
      fieldMapping: {},
      refreshPolicy: 'manual',
    })
    syncResult.value = null
  }
}

function getDataSourceTypeText(type) {
  const map = { mysql: 'MySQL', postgresql: 'PostgreSQL', api: 'API接口', elasticsearch: 'Elasticsearch', file: '文件', excel: 'Excel' }
  return map[type] || type || '-'
}

function formatConnectionInfo(ds) {
  const cfg = ds.connectionConfig
  if (!cfg || typeof cfg !== 'object') return '-'
  const t = ds.sourceType
  if (t === 'mysql' || t === 'postgresql') return `${cfg.host || '-'}:${cfg.port || '-'}`
  if (t === 'api') return cfg.url || '-'
  if (t === 'elasticsearch') return cfg.hosts || '-'
  if (t === 'file' || t === 'excel') return cfg.filePath || '-'
  return '-'
}

function onFieldMappingChange() {
  syncResult.value = null
}

function unbindField(col) {
  col.dataField = null
  col.dataSourceField = null
  syncResult.value = null
}

async function handleSyncData() {
  if (!selectedDataSourceId.value) {
    ElMessage.warning('请先选择数据源')
    return
  }
  const templateId = useDesigner().template?.id
  if (!templateId) {
    ElMessage.warning('模板未保存，无法同步数据')
    return
  }

  syncing.value = true
  syncResult.value = null
  try {
    const { syncTemplateDataFromSource } = await import('@/api/reportEngine')
    const params = {}
    const res = await syncTemplateDataFromSource(templateId, params)
    const result = res?.data || res
    if (result && typeof result === 'object' && Object.keys(result).length > 0) {
      for (const [key, value] of Object.entries(result)) {
        const [rowId, colId] = key.split(':')
        if (rowId && colId) {
          useDesigner().setCellValue(rowId, colId, value)
        }
      }
      syncResult.value = { success: true, message: '数据同步成功', count: Object.keys(result).length }
      ElMessage.success(`成功同步 ${Object.keys(result).length} 个单元格数据`)
    } else {
      syncResult.value = { success: true, message: '数据源查询结果为空', count: 0 }
      ElMessage.info('数据源查询结果为空')
    }
  } catch (e) {
    syncResult.value = { success: false, message: '同步失败: ' + (e.message || e) }
    ElMessage.error('数据同步失败: ' + (e.message || e))
  } finally {
    syncing.value = false
  }
}

async function handlePreviewSource() {
  if (!selectedDataSourceId.value) {
    ElMessage.warning('请先选择数据源')
    return
  }
  previewing.value = true
  try {
    const { executeDataSourceQuery } = await import('@/api/reportEngine')
    const res = await executeDataSourceQuery(selectedDataSourceId.value, { limit: 10 })
    const result = res?.data || res
    if (result && result.status === 'success' && result.data && result.data.length > 0) {
      const previewData = result.data.slice(0, 5)
      const columns = Object.keys(previewData[0])
      let previewText = '数据预览：\n'
      previewText += columns.join('\t') + '\n'
      previewText += '-'.repeat(80) + '\n'
      previewData.forEach(row => {
        previewText += columns.map(c => String(row[c] || '-')).join('\t') + '\n'
      })
      ElMessage({
        message: previewText,
        type: 'info',
        duration: 5000,
        showClose: true,
      })
    } else {
      ElMessage.info('数据源暂无数据')
    }
  } catch (e) {
    ElMessage.error('预览失败: ' + (e.message || e))
  } finally {
    previewing.value = false
  }
}

const tabs = [
  { key: 'row', label: '行维度' },
  { key: 'col', label: '列维度' },
  { key: 'metric', label: '指标' },
  { key: 'dataSource', label: '数据源' },
  { key: 'advanced', label: '高级' },
]

// ========== 当前选中行/列/指标 ==========
const currentRow = ref(null)
const currentCol = ref(null)
const currentMetric = ref(null)

watch(() => selectedRegion.rowNodeId, (id) => {
  if (id) {
    const node = flatRowTree.value.find(n => n.id === id)
    currentRow.value = node ? { ...node } : null
    activeTab.value = 'row'
  } else {
    currentRow.value = null
  }
}, { immediate: true })

watch(() => selectedRegion.colNodeId, (id) => {
  if (id) {
    const node = flatColumnTree.value.find(n => n.id === id)
    currentCol.value = node ? { ...node } : null
    activeTab.value = 'col'
  } else {
    currentCol.value = null
  }
}, { immediate: true })

// ========== 行操作 ==========
function selectRow(id) {
  selectRegion('row', id, null)
}

function addSummaryRow() {
  const node = addRowNode(null, null)
  if (node) {
    updateRowNode(node.id, { name: '合计', type: 'summary', isSummary: true })
  }
}

function deleteRow(id) {
  if (flatRowTree.value.length <= 1) {
    ElMessage.warning('至少需要保留一个行维度')
    return
  }
  deleteRowNode(id)
}

function updateCurrentRow() {
  if (!currentRow.value) return
  updateRowNode(currentRow.value.id, {
    name: currentRow.value.name,
    type: currentRow.value.type,
    height: currentRow.value.height,
    backgroundColor: currentRow.value.backgroundColor,
    isSummary: currentRow.value.type === 'summary',
  })
}

// ========== 列操作 ==========
function selectCol(id) {
  selectRegion('col', null, id)
}

function deleteCol(id) {
  if (flatColumnTree.value.length <= 1) {
    ElMessage.warning('至少需要保留一个列维度')
    return
  }
  deleteColNode(id)
}

function updateCurrentCol() {
  if (!currentCol.value) return
  updateColNode(currentCol.value.id, { ...currentCol.value })
}

// ========== 指标操作 ==========
function handleAddMetric() {
  const m = addMetric({ label: '新指标', expression: '', resultType: 'number', calcTrigger: 'realtime', type: 'formula' })
  if (m) {
    currentMetric.value = { ...m, targetRowId: '', targetColId: '' }
  }
}

function updateMetric() {
  if (!currentMetric.value) return
  saveMetric(currentMetric.value.field, { ...currentMetric.value })
}

function updateMetricTarget() {
  if (!currentMetric.value) return
  const { targetRowId, targetColId } = currentMetric.value
  if (targetRowId && targetColId) {
    currentMetric.value.targetCell = `${targetRowId}:${targetColId}`
  }
  updateMetric()
}

function insertRefToExpr(refId) {
  if (!currentMetric.value) return
  const expr = currentMetric.value.expression || ''
  if (expr) {
    currentMetric.value.expression = expr + ',' + refId
  } else {
    currentMetric.value.expression = refId
  }
  updateMetric()
}

function applyFormulaTemplate(tpl) {
  if (!currentMetric.value) return
  currentMetric.value.expression = `${tpl.func}()`
  updateMetric()
}

watch(() => metrics.value, (newMetrics) => {
  if (newMetrics.length > 0 && !currentMetric.value) {
    currentMetric.value = { ...newMetrics[0] }
  }
}, { deep: true })

// ========== 拖拽放置（数据源字段绑定）==========
function parseDragData(event) {
  const raw = event.dataTransfer.getData('application/json')
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

function onColItemDrop(event, nodeId) {
  event.preventDefault()
  const data = parseDragData(event)
  if (!data || data.source !== 'dataPanel') return
  bindFieldToColumn(nodeId, data)
  ElMessage.success(`已绑定「${data.label}」到列`)
  selectRegion('col', null, nodeId)
}

function onMetricAreaDrop(event) {
  event.preventDefault()
  const data = parseDragData(event)
  if (!data || data.source !== 'dataPanel') return
  const m = bindFieldToMetric(data)
  if (m) {
    currentMetric.value = { ...m }
    ElMessage.success(`已添加指标「${data.label}」`)
  }
}

function unbindColField() {
  if (!currentCol.value) return
  updateColNode(currentCol.value.id, { dataField: null, dataSourceField: null })
  currentCol.value.dataField = null
  currentCol.value.dataSourceField = null
  ElMessage.success('已解除字段绑定')
}
</script>

<style scoped>
.property-panel {
  width: 300px; min-width: 300px;
  background: #fff; border-left: 1px solid #e8eaed;
  display: flex; flex-direction: column;
  transition: width 0.28s cubic-bezier(0.4,0,0.2,1);
  flex-shrink: 0; overflow: hidden;
}
.property-panel.collapsed { width: 40px; min-width: 40px; }

/* AI Banner */
.ai-banner {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; margin: 8px 10px 0;
  background: linear-gradient(135deg, rgba(114,46,209,0.06), rgba(22,119,255,0.06));
  border: 1px solid rgba(114,46,209,0.12); border-radius: 10px;
  cursor: pointer; transition: all 0.2s; flex-shrink: 0;
}
.ai-banner:hover {
  border-color: rgba(114,46,209,0.3);
  background: linear-gradient(135deg, rgba(114,46,209,0.1), rgba(22,119,255,0.1));
}
.ai-banner-icon {
  width: 28px; height: 28px; border-radius: 7px;
  background: linear-gradient(135deg, #722ed1, #1677ff);
  display: flex; align-items: center; justify-content: center;
  color: #fff; flex-shrink: 0;
}
.ai-banner-text { flex: 1; min-width: 0; }
.ai-banner-title { display: block; font-size: 12px; font-weight: 600; color: #531dab; }
.ai-banner-desc { display: block; font-size: 10px; color: #999; margin-top: 1px; }
.ai-banner > svg { color: #bfbfbf; flex-shrink: 0; }

/* Tab Header */
.panel-header {
  display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid #e8eaed; padding: 0 4px;
  height: 40px; flex-shrink: 0;
}
.panel-tabs { display: flex; gap: 1px; flex: 1; }
.panel-tab {
  flex: 1; padding: 0 6px; height: 32px; display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: #8c8c8c; cursor: pointer; border-radius: 6px;
  transition: all 0.2s; user-select: none; white-space: nowrap; font-weight: 500;
}
.panel-tab:hover { background: #f5f5f5; color: #595959; }
.panel-tab.active { background: #e6f0ff; color: #1677ff; }

.collapse-btn {
  width: 24px; height: 24px; border: none; background: transparent; border-radius: 4px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: #999; flex-shrink: 0; margin-left: 2px;
}
.collapse-btn:hover { background: #f0f2f5; color: #666; }

.panel-body { flex: 1; overflow-y: auto; padding: 8px 0; }
.tab-content { display: flex; flex-direction: column; gap: 4px; }

/* Sections */
.prop-section { padding: 0 10px; margin-bottom: 10px; }
.prop-section:last-child { margin-bottom: 0; }
.prop-section-title {
  font-size: 11px; font-weight: 600; color: #8c8c8c;
  margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;
}
.prop-field { margin-bottom: 6px; }
.prop-field:last-child { margin-bottom: 0; }
.prop-field label { display: block; font-size: 11px; color: #999; margin-bottom: 3px; }
.prop-field-row { display: flex; gap: 6px; }
.prop-field.half { flex: 1; margin-bottom: 0; }

.prop-input, .prop-select, .prop-textarea {
  width: 100%; border: 1px solid #d9d9d9; border-radius: 6px;
  font-size: 12px; padding: 5px 8px; background: #fff; color: #333; outline: none;
  font-family: inherit; box-sizing: border-box;
}
.prop-select { height: 28px; padding: 0 8px; }
.prop-textarea { resize: vertical; font-family: 'JetBrains Mono', monospace; }
.prop-input:focus, .prop-select:focus, .prop-textarea:focus {
  border-color: #1677ff; box-shadow: 0 0 0 2px rgba(22,119,255,0.1);
}

/* 列表项 */
.row-list, .col-list, .metric-list {
  display: flex; flex-direction: column; gap: 2px;
  margin-bottom: 8px;
  max-height: 200px; overflow-y: auto;
}
.row-item, .col-item {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 8px; border-radius: 4px;
  background: #fafbfc; border: 1px solid #f0f0f0;
  font-size: 12px; transition: all 0.15s;
}
.row-item:hover, .col-item:hover { background: #f0f7ff; border-color: #b3d7ff; }
.row-item.active, .col-item.active { background: #e6f0ff; border-color: #1677ff; }
.row-item.summary, .col-item.summary { background: #fff7e6; border-color: #ffd591; }

.row-level, .col-level { color: #bfbfbf; font-size: 10px; flex-shrink: 0; }
.row-name, .col-name { flex: 1; cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.row-tag, .col-tag {
  font-size: 10px; padding: 1px 4px; border-radius: 3px;
  background: #fa8c16; color: #fff; flex-shrink: 0;
}
.col-tag.required { background: #f5222d; }

.row-del, .col-del, .metric-del {
  width: 18px; height: 18px; border: none; background: transparent;
  cursor: pointer; color: #bfbfbf; flex-shrink: 0; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; line-height: 1;
}
.row-del:hover, .col-del:hover, .metric-del:hover { color: #f5222d; background: #fff1f0; }

.metric-item {
  display: flex; align-items: center; justify-content: space-between; gap: 6px;
  padding: 6px 8px; border-radius: 4px;
  background: #fafbfc; border: 1px solid #f0f0f0;
  font-size: 12px;
}
.metric-item.disabled {
  opacity: 0.6;
  background: #f5f5f5;
}
.metric-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}
.metric-label { font-weight: 500; }
.metric-expr { color: #999; font-family: 'JetBrains Mono', monospace; font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.metric-type-tag {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 3px;
  background: #e6f0ff;
  color: #1677ff;
  font-weight: 500;
}
.metric-type-tag.summary {
  background: #fff7e6;
  color: #fa8c16;
}
.metric-type-tag.cell {
  background: #f6ffed;
  color: #52c41a;
}
.metric-type-tag.metric {
  background: #e6f0ff;
  color: #1677ff;
}
.metric-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.metric-status {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 8px;
  font-weight: 500;
}
.metric-status.status-on {
  background: #e6f7e6;
  color: #52c41a;
}
.metric-status.status-off {
  background: #fff1f0;
  color: #f5222d;
}
.metric-toggle {
  width: 20px;
  height: 20px;
  border: 1px solid #d9d9d9;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #666;
  padding: 0;
}
.metric-toggle:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.empty-tip {
  padding: 12px; text-align: center; color: #bfbfbf;
  font-size: 12px; background: #fafbfc; border-radius: 6px; border: 1px dashed #e8e8e8;
}

.add-btn, .add-sub-btn {
  width: 100%; height: 32px; border: 1px dashed #d9d9d9;
  background: #fafbfc; cursor: pointer; color: #595959;
  font-size: 12px; border-radius: 6px; transition: all 0.15s;
  display: flex; align-items: center; justify-content: center; gap: 4px;
  margin-top: 4px;
}
.add-btn:hover, .add-sub-btn:hover {
  border-color: #1677ff; color: #1677ff; background: #f0f7ff;
}
.add-sub-btn { color: #fa8c16; }
.add-sub-btn:hover { border-color: #fa8c16; background: #fff7e6; color: #fa8c16; }

.checkbox-label {
  display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: #595959;
  cursor: pointer; margin-right: 12px;
}
.checkbox-label input { margin: 0; cursor: pointer; accent-color: #1677ff; }

/* 结构信息 */
.struct-info { display: flex; flex-direction: column; gap: 4px; }
.info-item {
  display: flex; justify-content: space-between; padding: 6px 10px;
  background: #fafbfc; border-radius: 4px; font-size: 12px;
}
.info-label { color: #8c8c8c; }
.info-value { font-weight: 600; color: #1677ff; font-family: 'JetBrains Mono', monospace; }

/* Advanced */
.prop-advanced-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 0; font-size: 13px; color: #333; cursor: pointer;
  border-bottom: 1px solid #f5f5f5; transition: all 0.15s;
}
.prop-advanced-item:hover { color: #1677ff; padding-left: 4px; }
.prop-advanced-item:last-child { border-bottom: none; }
.adv-item-left { display: flex; align-items: center; gap: 8px; }

.property-panel.collapsed .panel-body,
.property-panel.collapsed .panel-tabs,
.property-panel.collapsed .ai-banner { display: none; }
.property-panel.collapsed .panel-header { justify-content: center; }

/* 字段绑定信息 */
.prop-bind-info {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 8px; background: #e6f0ff; border-radius: 4px;
  border: 1px solid #b3d7ff;
}
.bind-tag {
  flex: 1; font-size: 12px; color: #1677ff; font-weight: 500;
  font-family: 'JetBrains Mono', monospace;
}
.unbind-btn {
  border: none; background: transparent; cursor: pointer;
  font-size: 11px; color: #999; padding: 2px 4px; border-radius: 3px;
}
.unbind-btn:hover { color: #f5222d; background: #fff1f0; }

/* 指标引用列表 */
.metric-ref-list {
  display: flex; flex-direction: column; gap: 8px;
}
.ref-section {
  display: flex; flex-direction: column; gap: 4px;
}
.ref-title {
  font-size: 11px; color: #8c8c8c; font-weight: 500;
}
.ref-items {
  display: flex; flex-wrap: wrap; gap: 4px;
}
.ref-item {
  padding: 3px 8px; background: #f5f5f5; border-radius: 4px;
  font-size: 11px; color: #595959; cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  transition: all 0.15s;
}
.ref-item:hover {
  background: #e6f0ff; color: #1677ff;
}

/* 公式模板按钮 */
.metric-template-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.template-btn {
  padding: 4px 10px; border: 1px solid #d9d9d9; border-radius: 4px;
  font-size: 11px; color: #595959; cursor: pointer;
  background: #fff; transition: all 0.15s;
}
.template-btn:hover {
  border-color: #1677ff; color: #1677ff;
}

/* 数据源相关样式 */
.data-source-select {
  margin-bottom: 10px;
}
.data-source-select label {
  display: block; font-size: 11px; color: #999; margin-bottom: 4px;
}

.data-source-info {
  background: #fafbfc; border-radius: 6px; padding: 10px; margin-bottom: 10px;
}
.info-row {
  display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px;
  border-bottom: 1px solid #f0f0f0;
}
.info-row:last-child { border-bottom: none; }
.info-label { color: #8c8c8c; }
.info-value { color: #333; font-weight: 500; font-family: 'JetBrains Mono', monospace; }

.data-source-actions {
  display: flex; gap: 8px; margin-bottom: 10px;
}

.data-source-tip {
  display: flex; align-items: center; gap: 6px;
  padding: 10px; background: #fffbe6; border: 1px solid #ffe58f;
  border-radius: 6px; font-size: 12px; color: #fa8c16;
}
.tip-icon { opacity: 0.7; }

.field-mapping-list {
  background: #fafbfc; border-radius: 6px; overflow: hidden;
}
.field-mapping-header {
  display: flex; padding: 8px 10px; background: #f0f0f0;
  font-size: 11px; font-weight: 600; color: #8c8c8c;
}
.field-mapping-header span { flex: 1; }

.field-mapping-row {
  display: flex; align-items: center; padding: 8px 10px;
  border-bottom: 1px solid #f0f0f0;
}
.field-mapping-row:last-child { border-bottom: none; }
.field-mapping-row .col-name {
  flex: 1; font-size: 12px; color: #333;
}
.field-mapping-row .prop-select {
  width: 140px; font-size: 11px;
}
.field-mapping-row .unbind-btn {
  width: 18px; height: 18px; border: none; background: transparent;
  cursor: pointer; color: #bfbfbf; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; line-height: 1; margin-left: 4px;
}
.field-mapping-row .unbind-btn:hover { color: #f5222d; background: #fff1f0; }

.sync-result {
  display: flex; align-items: center; gap: 8px; padding: 10px;
  border-radius: 6px; font-size: 12px;
}
.sync-result.success { background: #f6ffed; border: 1px solid #b7eb8f; color: #52c41a; }
.sync-result.error { background: #fff2f0; border: 1px solid #ffccc7; color: #f5222d; }

.sync-count {
  font-size: 11px; color: #8c8c8c; margin-top: 6px;
}
</style>
