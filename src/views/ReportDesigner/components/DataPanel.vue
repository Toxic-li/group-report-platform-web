<template>
  <aside class="data-panel" :class="{ collapsed: isCollapsed }">
    <div class="panel-header">
      <div class="panel-tabs">
        <div class="panel-tab" :class="{ active: activeTab === 'data' }" @click="activeTab = 'data'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>
          </svg>
          <span>数据源</span>
        </div>
        <div class="panel-tab" :class="{ active: activeTab === 'add' }" @click="activeTab = 'add'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>新增</span>
        </div>
      </div>
      <button class="collapse-btn" @click="isCollapsed = !isCollapsed" title="收起/展开">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path :d="isCollapsed ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'"/>
        </svg>
      </button>
    </div>

    <div class="panel-body" v-show="!isCollapsed">
      <!-- ========== 数据源 Tab ========== -->
      <div v-if="activeTab === 'data'" class="tab-data">
        <div class="search-box">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" v-model="searchKeyword" placeholder="搜索字段..." />
        </div>

        <div v-if="loading" class="loading-tip">
          <span>正在加载数据源...</span>
        </div>

        <div v-else-if="dataSourceTree.length === 0" class="empty-tip">
          <p>暂无可用数据源</p>
          <p class="empty-sub">请点击下方"重新加载数据源"</p>
        </div>

        <div v-else class="tree-container">
          <div v-for="ds in dataSourceTree" :key="ds.id" class="ds-group">
            <div class="ds-group-header" @click="toggleDs(ds.id)">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                :class="{ rotated: !ds.expanded }">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
              <span class="ds-icon">⊟</span>
              <span class="ds-name">{{ ds.name || ds.sourceName || '数据源' }}</span>
              <span class="ds-count">{{ getFieldCount(ds) }}</span>
            </div>
            <button class="ds-preview-btn" @click.stop="handlePreviewDs(ds)" title="预览数据">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            </button>
            <div class="ds-fields" v-show="ds.expanded">
              <div v-if="ds.dimensions?.length" class="field-subgroup">
                <div class="field-subgroup-title">维度</div>
                <div
                  v-for="f in filterFields(ds.dimensions)" :key="f.key || f.name"
                  class="field-item"
                  draggable="true"
                  @dragstart="handleFieldDrag($event, f, 'dimension')"
                  @click="handleFieldClick(f, 'dimension')"
                >
                  <span class="field-icon dimension">⊞</span>
                  <span class="field-name">{{ f.label || f.name }}</span>
                  <span class="field-type" v-if="f.dataType">{{ f.dataType }}</span>
                </div>
              </div>
              <div v-if="ds.metrics?.length" class="field-subgroup">
                <div class="field-subgroup-title">指标</div>
                <div
                  v-for="f in filterFields(ds.metrics)" :key="f.key || f.name"
                  class="field-item"
                  draggable="true"
                  @dragstart="handleFieldDrag($event, f, 'metric')"
                  @click="handleFieldClick(f, 'metric')"
                >
                  <span class="field-icon metric">Σ</span>
                  <span class="field-name">{{ f.label || f.name }}</span>
                  <span class="field-type" v-if="f.dataType">{{ f.dataType }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="panel-footer">
          拖拽字段到列头/单元格绑定，或选中列后点击字段
        </div>
      </div>

      <!-- ========== 新增 Tab - 快速添加维度 ========== -->
      <div v-if="activeTab === 'add'" class="tab-add">
        <div class="prop-section">
          <div class="prop-section-title">快速添加</div>
          <button class="quick-add-btn" @click="handleAddRow">
            <span class="qab-icon">📊</span>
            <span class="qab-text">
              <span class="qab-title">添加行维度</span>
              <span class="qab-desc">如：部门、产品类别</span>
            </span>
          </button>
          <button class="quick-add-btn" @click="handleAddCol">
            <span class="qab-icon">📅</span>
            <span class="qab-text">
              <span class="qab-title">添加列维度</span>
              <span class="qab-desc">如：月份、季度</span>
            </span>
          </button>
          <button class="quick-add-btn" @click="handleAddMetric">
            <span class="qab-icon">📈</span>
            <span class="qab-text">
              <span class="qab-title">添加指标</span>
              <span class="qab-desc">如：销售金额、利润率</span>
            </span>
          </button>
        </div>

        <div class="prop-section">
          <div class="prop-section-title">数据源操作</div>
          <button class="link-btn" @click="reloadDataSources">
            <span>🔄</span> 重新加载数据源
          </button>
          <router-link to="/admin/datasource" class="link-btn">
            <span>⚙</span> 管理数据源
          </router-link>
        </div>
      </div>
    </div>
  </aside>

  <!-- 数据预览弹窗 -->
  <el-dialog
    v-model="previewVisible"
    :title="`数据预览 - ${previewDataSource?.name || previewDataSource?.sourceName || '数据源'}`"
    width="700px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div v-loading="previewLoading" class="preview-content">
      <div v-if="previewData.length > 0" class="preview-table">
        <table>
          <thead>
            <tr>
              <th v-for="col in previewColumns" :key="col">{{ col }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in previewData" :key="idx">
              <td v-for="col in previewColumns" :key="col">
                {{ formatCellValue(row[col]) }}
              </td>
            </tr>
          </tbody>
        </table>
        <div class="preview-footer">
          共 {{ previewData.length }} 条数据
        </div>
      </div>
      <div v-else class="preview-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="empty-icon">
          <path d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7m16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5m16 0h-2.586a1 1 0 0 0-.707.293l-2.414 2.414a1 1 0 0 1-.707.293h-3.172a1 1 0 0 1-.707-.293l-2.414-2.414A1 1 0 0 0 6.586 13H4"/>
        </svg>
        <p>暂无数据</p>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useDesigner } from '../composables/useDesigner.js'
import { getDataSources } from '@/api/reportEngine.js'

const router = useRouter()

const {
  dataSourceTree, addRowNode, addColNode, addMetric,
  loadDataSourceList, selectedRegion,
  bindFieldToColumn, bindFieldToMetric,
} = useDesigner()

const isCollapsed = ref(false)
const activeTab = ref('data')
const searchKeyword = ref('')
const loading = ref(false)

// ========== 数据预览弹窗 ==========
const previewVisible = ref(false)
const previewDataSource = ref(null)
const previewLoading = ref(false)
const previewData = ref([])
const previewColumns = ref([])

// ========== 加载数据源 ==========
onMounted(async () => {
  loading.value = true
  try {
    await loadDataSourceList()
    dataSourceTree.value.forEach(ds => { if (ds.expanded === undefined) ds.expanded = true })
  } catch (e) {
    ElMessage.error('加载数据源失败，请确认后端服务已启动')
    console.warn('加载数据源失败', e)
  } finally {
    loading.value = false
  }
})

async function reloadDataSources() {
  loading.value = true
  try {
    await loadDataSourceList()
    dataSourceTree.value.forEach(ds => { if (ds.expanded === undefined) ds.expanded = true })
    ElMessage.success('数据源已刷新')
  } catch (e) {
    ElMessage.error('刷新失败，请确认后端服务已启动')
  } finally {
    loading.value = false
  }
}

function toggleDs(id) {
  const ds = dataSourceTree.value.find(d => d.id === id)
  if (ds) ds.expanded = !ds.expanded
}

function getFieldCount(ds) {
  return (ds.dimensions?.length || 0) + (ds.metrics?.length || 0)
}

function filterFields(fields) {
  const kw = searchKeyword.value.toLowerCase().trim()
  if (!kw) return fields || []
  return (fields || []).filter(f => {
    const name = (f.label || f.name || '').toLowerCase()
    return name.includes(kw) || (f.dataType && f.dataType.toLowerCase().includes(kw))
  })
}

// ========== 拖拽处理 ==========
function handleFieldDrag(event, field, dataType) {
  event.dataTransfer.setData('application/json', JSON.stringify({
    type: 'field',
    source: 'dataPanel',
    key: field.key || field.name,
    label: field.label || field.name,
    dataType: dataType || field.dataType,
    fieldDataType: field.dataType, // integer/decimal/percent/currency/date/string
    aggregation: field.aggregation,
  }))
  event.dataTransfer.effectAllowed = 'copy'
}

// ========== 点击绑定 ==========
function handleFieldClick(field, dataType) {
  // 优先绑定到当前选中的列
  if (selectedRegion.colNodeId) {
    bindFieldToColumn(selectedRegion.colNodeId, {
      key: field.key || field.name,
      label: field.label || field.name,
      fieldDataType: field.dataType,
      dataType: dataType,
    })
    ElMessage.success(`已绑定「${field.label || field.name}」到当前列`)
  } else if (dataType === 'metric') {
    // 没有选中列时，指标字段添加到指标列表
    bindFieldToMetric({
      key: field.key || field.name,
      label: field.label || field.name,
      fieldDataType: field.dataType,
    })
    ElMessage.success(`已添加指标「${field.label || field.name}」`)
  } else {
    ElMessage.info('请先选中一列，或直接拖拽字段到列/单元格')
  }
}

// ========== 快速添加 ==========
function handleAddRow() {
  const node = addRowNode()
  if (node) {
    ElMessage.success('已添加行维度，请在右侧面板修改名称')
  }
}

function handleAddCol() {
  const node = addColNode()
  if (node) {
    ElMessage.success('已添加列维度，请在右侧面板修改名称')
  }
}

function handleAddMetric() {
  const m = addMetric({ type: 'formula' })
  if (m) {
    ElMessage.success('已添加指标，请在右侧面板编辑')
  }
}

// ========== 数据预览 ==========
async function handlePreviewDs(ds) {
  previewDataSource.value = ds
  previewVisible.value = true
  await loadPreviewData()
}

async function loadPreviewData() {
  if (!previewDataSource.value) return
  previewLoading.value = true
  try {
    const { executeDataSourceQuery } = await import('@/api/reportEngine')
    const res = await executeDataSourceQuery(previewDataSource.value.id, { limit: 20 })
    const result = res?.data || res
    if (result && result.status === 'success') {
      previewData.value = Array.isArray(result.data) ? result.data : []
      if (previewData.value.length > 0) {
        previewColumns.value = Object.keys(previewData.value[0])
      } else {
        previewColumns.value = []
      }
    } else {
      previewData.value = []
      previewColumns.value = []
      ElMessage.warning('数据源查询失败: ' + (result?.message || '未知错误'))
    }
  } catch (e) {
    previewData.value = []
    previewColumns.value = []
    ElMessage.error('预览失败: ' + (e.message || e))
  } finally {
    previewLoading.value = false
  }
}
</script>

<style scoped>
.data-panel {
  width: 280px; min-width: 280px;
  background: #fff; border-right: 1px solid #e8eaed;
  display: flex; flex-direction: column;
  transition: width 0.28s cubic-bezier(0.4,0,0.2,1);
  flex-shrink: 0; overflow: hidden;
}
.data-panel.collapsed { width: 40px; min-width: 40px; }

.panel-header {
  display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid #e8eaed; padding: 0 6px 0 4px; height: 40px; flex-shrink: 0;
}
.panel-tabs { display: flex; gap: 2px; flex: 1; }
.panel-tab {
  padding: 0 10px; height: 30px; display: flex; align-items: center; gap: 5px;
  font-size: 12px; color: #8c8c8c; cursor: pointer; border-radius: 6px;
  transition: all 0.2s; user-select: none; font-weight: 500;
}
.panel-tab:hover { background: #f5f5f5; color: #595959; }
.panel-tab.active { background: #e6f0ff; color: #1677ff; }
.collapse-btn {
  width: 24px; height: 24px; border: none; background: transparent; border-radius: 4px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  color: #999; flex-shrink: 0;
}
.collapse-btn:hover { background: #f0f2f5; color: #666; }

.panel-body { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
.tab-data, .tab-add { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

.search-box {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 10px; border-bottom: 1px solid #f0f0f0; flex-shrink: 0;
}
.search-box input {
  flex: 1; border: none; outline: none; font-size: 12px;
  background: transparent; color: #333; font-family: inherit;
}
.search-box input::placeholder { color: #bfbfbf; }

.loading-tip, .empty-tip {
  padding: 24px 16px; text-align: center; color: #bfbfbf; font-size: 12px;
}
.empty-tip p { margin: 4px 0; }
.empty-sub { font-size: 11px; color: #d9d9d9; }

.tree-container { flex: 1; overflow: auto; padding: 4px 0; }
.ds-group { border-bottom: 1px solid #f5f5f5; }
.ds-group:last-child { border-bottom: none; }

.ds-group-header {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 10px; cursor: pointer; user-select: none;
  transition: background 0.15s; font-size: 12px; color: #595959; font-weight: 600;
}
.ds-group-header:hover { background: #fafbfc; }
.ds-group-header svg { flex-shrink: 0; color: #bfbfbf; transition: transform 0.2s; }
.ds-group-header svg.rotated { transform: rotate(-90deg); }
.ds-icon { flex-shrink: 0; font-size: 13px; color: #1677ff; }
.ds-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ds-count {
  font-size: 10px; color: #bfbfbf; background: #f5f5f5;
  padding: 0 5px; border-radius: 8px; font-weight: 400;
}

.ds-fields { padding: 0 0 6px 0; }
.field-subgroup { padding: 4px 0; }
.field-subgroup-title {
  padding: 4px 10px 4px 24px; font-size: 10px; color: #bfbfbf;
  font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
}

.field-item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 10px 6px 28px; cursor: grab;
  transition: all 0.12s; font-size: 12px; color: #333;
  border-left: 2px solid transparent;
}
.field-item:hover { background: #f5f7ff; color: #1677ff; border-left-color: #1677ff; }
.field-item:active { cursor: grabbing; }

.field-icon {
  width: 18px; height: 18px; border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; font-size: 11px; font-weight: 700;
}
.field-icon.dimension { background: #e6f0ff; color: #1677ff; }
.field-icon.metric { background: #f9f0ff; color: #722ed1; }
.field-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.field-type {
  font-size: 9px; color: #8c8c8c;
  background: #f5f5f5; padding: 1px 4px; border-radius: 3px;
  font-family: 'JetBrains Mono', monospace; flex-shrink: 0;
}

.panel-footer {
  padding: 8px 10px; font-size: 11px; color: #bfbfbf;
  background: #fafbfc; border-top: 1px solid #f0f0f0;
  display: flex; align-items: center; gap: 6px; flex-shrink: 0;
}

/* Add Tab */
.tab-add { padding: 8px 0; overflow: auto; }
.quick-add-btn {
  display: flex; align-items: center; gap: 12px;
  width: 100%; padding: 12px 14px;
  background: #fff; border: 1px solid #f0f0f0; border-radius: 8px;
  cursor: pointer; margin-bottom: 8px; transition: all 0.2s;
  text-align: left;
}
.quick-add-btn:hover {
  border-color: #1677ff; background: #f5f7ff;
  transform: translateY(-1px); box-shadow: 0 2px 8px rgba(22,119,255,0.1);
}
.qab-icon { font-size: 24px; flex-shrink: 0; }
.qab-text { display: flex; flex-direction: column; gap: 2px; }
.qab-title { font-size: 13px; color: #333; font-weight: 500; }
.qab-desc { font-size: 11px; color: #999; }

.prop-section { padding: 0 10px 10px; }
.prop-section-title {
  font-size: 11px; font-weight: 600; color: #8c8c8c;
  margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;
}

.link-btn {
  display: flex; align-items: center; gap: 6px;
  width: 100%; padding: 8px 12px;
  background: #fafbfc; border: 1px solid #f0f0f0; border-radius: 6px;
  cursor: pointer; margin-bottom: 6px; transition: all 0.15s;
  font-size: 12px; color: #595959; text-decoration: none;
}
.link-btn:hover { background: #f0f7ff; color: #1677ff; border-color: #1677ff; }
</style>
