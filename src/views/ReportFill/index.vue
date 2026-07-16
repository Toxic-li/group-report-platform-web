<template>
  <div class="fr-report" ref="containerRef" tabindex="0"
    @keydown="onGlobalKeydown" @copy="onCopy" @paste="onPaste">

    <!-- 加载状态 -->
    <div v-if="loading" class="fr-loading">
      <div class="fr-loading-spinner"></div>
      <p>{{ loadingText }}</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="fr-empty">
      <svg viewBox="0 0 64 64" fill="none" class="fr-empty-icon" style="color:#DC2626">
        <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="2"/>
        <line x1="22" y1="22" x2="42" y2="42" stroke="currentColor" stroke-width="2"/>
      </svg>
      <h3 style="color: #DC2626; margin-bottom: 8px">加载失败</h3>
      <p style="max-width: 400px; text-align: center; color: #64748b">{{ error }}</p>
      <button class="fr-action-btn" style="margin-top: 16px" @click="loadReport(props.templateId)">重试</button>
    </div>

    <!-- 报表主体 -->
    <template v-if="config && !loading && !error">

      <!-- 顶部控制栏 -->
      <ReportControlBar
        :current-template="currentTemplate"
        :use-v2="useV2"
        :selected-org-name="selectedOrgName"
        :selected-period-label="selectedPeriodLabel"
        :view-mode="viewMode"
        :view-modes="viewModes"
        :flat-rows-length="flatRows.length"
        :visible-col-count="visibleColCount"
        :anomaly-count="anomalyCount"
        :save-status="saveStatus"
        :metric-groups="metricGroups"
        :collapsed-groups="collapsedGroups"
        :selected-org-id="selectedOrgId"
        :selected-period="selectedPeriod"
        :read-only="isReadOnly"
        @update:view-mode="viewMode = $event"
        @expand-all-rows="expandAllRows"
        @collapse-all-rows="collapseAllRows"
        @toggle-group="toggleGroup"
        @expand-all-groups="expandAllGroups"
        @add-new-row="addNewRow"
        @force-save="forceSave"
        @force-save-and-publish="forceSaveAndPublish"
        @submit-for-review="submitForReview"
        @export-excel="handleExportExcel"
      />

      <!-- 报表主体区域 -->
      <main class="fr-body" ref="bodyRef" @scroll="onScroll">

        <!-- 多级表头 -->
        <ReportTableHeader
          :header-rows="headerRows"
          :data-columns="dataColumns"
          :is-col-hidden="isColHidden"
          :col-width="colWidth"
          @show-tip="showTip"
          @hide-tip="hideTip"
        />

        <!-- 数据行 -->
        <ReportTableBody
          :visible-rows="visibleRows"
          :data-columns="dataColumns"
          :scroll-top="scrollTop"
          :viewport-h="viewportH"
          :row-height="ROW_H"
          :is-col-hidden="isColHidden"
          :col-width="colWidth"
          :val-class="valClass"
          :conditional-format-class="conditionalFormatClass"
          :conditional-format-style="conditionalFormatStyle"
          :fmt-val="fmtVal"
          :is-editing-cell="isEditingCell"
          :edit-value="editValue"
          :edit-error="editError"
          :hover-id="hoverId"
          :store="store"
          :set-cell-ref="setCellRef"
          @start-edit="onStartEdit"
          @commit-edit="commitEdit"
          @on-edit-keydown="onEditKeydown"
          @on-edit-input-keydown="onEditInputKeydown"
          @open-detail="openDetail"
          @toggle-row="toggleRow"
          @update:hover-id="hoverId = $event"
          @update:edit-value="editValue = $event"
        />
      </main>
    </template>

    <!-- Tooltip -->
    <Teleport to="body">
      <div v-if="tip.visible" class="fr-tip" :style="{ left: tip.x + 'px', top: tip.y + 'px' }">
        <strong>{{ tip.title }}</strong><p>{{ tip.desc }}</p>
      </div>
    </Teleport>

    <!-- Drawer 详情面板 -->
    <CellDetailDrawer
      :visible="drawer.visible"
      :drawer="drawer"
      @close="drawer.visible = false"
      @edit-formula="openFormulaEditorFromDrawer"
    />

    <!-- 公式编辑器 -->
    <Teleport to="body">
      <FormulaEditor
        v-if="formulaEditor.visible"
        :cell-info="formulaEditor.cellInfo"
        :initial-value="formulaEditor.initialValue"
        :fields="formulaEditor.fields"
        :row-fields="formulaEditor.rowFields"
        :valid-field-ids="formulaEditor.validFieldIds"
        :template-id="props.templateId"
        @apply="onFormulaApply"
        @saved="onFormulaSaved"
        @close="formulaEditor.visible = false"
      />
    </Teleport>

    <!-- 校验 Toast -->
    <Teleport to="body">
      <Transition name="fr-toast">
        <div v-if="validationToast.visible" class="fr-toast" :class="'fr-toast-' + validationToast.type">{{ validationToast.message }}</div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
/**
 * ReportFill - 动态报表填报页面（重构版）
 *
 * 通过路由参数 templateId 动态加载任意报表模板。
 * 逻辑已拆分到 composables/ 和 components/ 目录：
 * - composables/useOrgPeriod.js      — 组织/周期选择
 * - composables/useReportData.js     — 数据加载、配置、保存
 * - composables/useCellEdit.js       — 单元格编辑
 * - composables/useFormulaEngine.js  — 公式引擎
 * - composables/useConditionalFormat.js — 条件格式
 * - composables/useValidation.js     — 数据校验
 * - components/ReportControlBar.vue  — 顶部控制栏
 * - components/ReportTableHeader.vue — 多级表头
 * - components/ReportTableBody.vue   — 数据行
 * - components/CellDetailDrawer.vue  — 详情面板
 */
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { getEntryDetail, getEntryDetailByReportId } from '@/api/filling.js'
import { recordRecentView } from '@/api/reportCenter.js'
import { ConditionalFormatEngine } from '@/services/engines/ConditionalFormatEngine.js'
import { ValidationEngine } from '@/services/engines/ValidationEngine.js'
import FormulaEditor from '@/components/FormulaEditor.vue'
import ReportControlBar from './components/ReportControlBar.vue'
import ReportTableHeader from './components/ReportTableHeader.vue'
import ReportTableBody from './components/ReportTableBody.vue'
import CellDetailDrawer from './components/CellDetailDrawer.vue'
import { useOrgPeriod } from './composables/useOrgPeriod.js'
import { useReportData } from './composables/useReportData.js'
import { useCellEdit } from './composables/useCellEdit.js'
import { useFormulaEngine } from './composables/useFormulaEngine.js'
import { useConditionalFormat } from './composables/useConditionalFormat.js'
import { useValidation } from './composables/useValidation.js'

const route = useRoute()
const props = defineProps({
  templateId: { type: String, default: '' },
  submitId: { type: String, default: '' }
})

// 只读模式：从路由 query 参数读取 mode=view
const isReadOnly = computed(() => route.query.mode === 'view')

// ==================== 共享状态 ====================
const config = ref(null)
const currentTemplate = ref(null)
const useV2 = ref(false)
const v2Parser = ref(null)

// ==================== Toast / Tip / Drawer ====================
const validationToast = reactive({ visible: false, message: '', type: 'error' })
const tip = reactive({ visible: false, x: 0, y: 0, title: '', desc: '' })
const drawer = reactive({
  visible: false, metric: '', rawValue: '', displayValue: '', valClass: '',
  formula: '', source: '', unit: '', reporter: '', updateTime: '',
  anomaly: false, anomalyMsg: '', history: [], auditLog: [],
  templateId: '', validationOk: true, validationMsg: ''
})

function showToast(message, type = 'error') {
  validationToast.message = message
  validationToast.type = type
  validationToast.visible = true
  setTimeout(() => { validationToast.visible = false }, 2500)
}

// ==================== 初始化 Composables ====================
// 1. 组织/周期
const {
  selectedOrgId, selectedPeriod, selectedOrgName, selectedPeriodLabel,
  orgList, periodList, loadOrgList
} = useOrgPeriod()

// 2. 条件格式
const cfComposable = useConditionalFormat({ config, ConditionalFormatEngine })

// 3. 校验
const validationComposable = useValidation({ config, ValidationEngine })

// 4. 公式引擎
const formulaComposable = useFormulaEngine({ config, currentTemplate, v2Parser, useV2 })

// 5. 核心数据（依赖上述 composables）
const reportData = useReportData(props, {
  config, currentTemplate, useV2, v2Parser,
  selectedOrgId, selectedPeriod,
  formulaComposable, cfComposable, validationComposable,
  showToast
})

// 解构 reportData 返回值
const {
  store, loading, loadingText, error, dataVersion, saveStatus,
  containerRef, bodyRef, headerRef, scrollTop, viewportH,
  viewMode, viewModes, collapsedGroups, ROW_H, ANOMALY_CONFIG,
  flatRows, headerRows, dataColumns, visibleColCount,
  colIndexMap, colGroupMap, metricGroups,
  visibleRows, displayRows, anomalyCount,
  isColHidden, valClass, getAnomalyInfo, getMetricHint,
  colWidth,
  loadReport, initEngines, restoreTreeState, measureVP, scrollToIndex,
  populateCellDataFromApi, buildConfigFromV2,
  updateSaveData, triggerAutoSave, forceSave, forceSaveAndPublish,
  submitForReview, handleExportExcel, loadExistingData,
  addNewRow, toggleRow, expandAllRows, collapseAllRows,
  toggleGroup, expandAllGroups, permissionEngine, v2TemplateCode
} = reportData

// 从公式引擎提取 formulaEditor 和 savedFormulas
const { formulaEditor, savedFormulas } = formulaComposable

// 6. 单元格编辑（依赖 reportData）
const {
  editingCell, editValue, editError, hoverId, selectedCell,
  isEditingCell, startEdit, commitEdit, cancelEdit,
  onEditInputKeydown, onEditKeydown, setCellRef,
  onCopy, onPaste, fmtVal
} = useCellEdit({
  config, visibleRows, store,
  validationEngine: validationComposable.validationEngine,
  permissionEngine,
  colIndexMap, isColHidden,
  triggerAutoSave, recalcFormulas: formulaComposable.recalcFormulas,
  showToast, containerRef, scrollToIndex,
  isReadOnly
})

// ==================== 详情 Drawer ====================
function openDetail(val, row, event) {
  const n = parseFloat(val.v)
  drawer.metric = row.name
  drawer.displayValue = fmtVal(val)
  drawer.rawValue = String(val.raw ?? val.v)
  drawer.valClass = !isNaN(n) && /率|增长率/.test(val.colTitle) ? (n > 0 ? 'fr-up' : n < 0 ? 'fr-down' : '') : ''
  drawer.formula = val.formula || val.f || ''
  drawer.source = val.readOnly ? '系统自动计算（公式/汇总）' : '手工填报'
  drawer.templateId = currentTemplate.value?.id || '-'
  drawer._detailVal = val
  drawer._detailRow = row
  drawer._canEditFormula = !!val.readOnly

  if (validationComposable.validationEngine) {
    const vr = validationComposable.validationEngine.validate(val.colIdx, val.colIdx, val.v)
    drawer.validationOk = vr.valid
    drawer.validationMsg = vr.valid ? '校验通过' : vr.message
  } else {
    drawer.validationOk = true
    drawer.validationMsg = '-'
  }

  const ai = getAnomalyInfo(row)
  drawer.anomaly = ai.hasAnomaly
  drawer.anomalyMsg = ai.msg
  drawer.history = genHistoryData(val)
  drawer.visible = true
}

function genHistoryData(val) {
  const n = parseFloat(val.v)
  if (isNaN(n)) return []
  const rv = () => (Math.random() - 0.5) * 20
  return [
    { period: '去年同期', value: (n * (1 + rv() / 100)).toFixed(2), diff: -rv(), trend: rv() > 0 ? 'down' : 'up' },
    { period: '上月同期', value: (n * (1 + rv() / 100)).toFixed(2), diff: -rv(), trend: rv() > 0 ? 'down' : 'up' },
    { period: '历史最高', value: (n * (1 + Math.abs(rv()) / 50 + 0.05)).toFixed(2), diff: null, trend: '' },
    { period: '历史最低', value: (n * (1 - Math.abs(rv()) / 50 - 0.05)).toFixed(2), diff: null, trend: '' },
    { period: '近三年均值', value: (n * (1 + rv() / 100)).toFixed(2), diff: -rv(), trend: rv() > 0 ? 'down' : 'up' },
  ]
}

// ==================== 编辑事件桥接 ====================
function onStartEdit(val, row, colIdx, event) {
  const result = startEdit(val, row, colIdx, event)
  if (result === 'openDetail') {
    openDetail(val, row, event)
  }
}

// ==================== 公式编辑器 ====================
function onFormulaApply(formulaData) {
  formulaComposable.onFormulaApply(formulaData, syncCellToRows, showToast)
  drawer.visible = false
}

function onFormulaSaved(data) {
  // 后端保存成功回调
}

function openFormulaEditorFromDrawer() {
  const val = drawer._detailVal
  const row = drawer._detailRow
  if (!val || !row) return
  formulaComposable.openFormulaEditor(val, row, val.colIdx)
}

function syncCellToRows(rowIdx, colIdx, expr) {
  const rows = visibleRows.value
  for (const row of rows) {
    if (row.depth === rowIdx || row.id === formulaComposable.formulaEditor.targetCell?.row?.id) {
      if (row.values && row.values[colIdx]) {
        row.values[colIdx] = {
          ...row.values[colIdx],
          v: expr, raw: expr, readOnly: true,
          formula: expr.replace(/^=/, ''), f: expr.replace(/^=/, '')
        }
      }
      if (row.childRows) {
        for (const child of row.childRows) {
          if (child.values && child.values[colIdx]) {
            child.values[colIdx] = {
              ...child.values[colIdx],
              v: expr, raw: expr, readOnly: true,
              formula: expr.replace(/^=/, ''), f: expr.replace(/^=/, '')
            }
          }
        }
      }
      break
    }
  }
}

// ==================== 通用 ====================
function showTip(event, cell) {
  if (!cell.hint) return
  const rect = event.target.getBoundingClientRect()
  Object.assign(tip, { visible: true, x: rect.left + rect.width / 2 - 90, y: rect.bottom + 6, title: cell.text, desc: cell.hint })
}
function hideTip() { tip.visible = false }
function onScroll(e) { scrollTop.value = e.target.scrollTop }

function onGlobalKeydown(event) {
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault(); forceSave()
  }
}

// ==================== 离开页面保存 ====================
async function onBeforeUnload(event) {
  if (store.dirtyCells.size > 0 || config.value?.rows?.length > 0) {
    updateSaveData()
    try {
      const draftKey = `rpt_draft_${v2TemplateCode.value || props.templateId}`
      const draftData = {
        ...store.saveData,
        rows: config.value?.rows || [],
        cellData: config.value?.cellData || {},
        formulas: formulaComposable.savedFormulas,
        savedAt: new Date().toISOString(),
        source: 'unload'
      }
      localStorage.setItem(draftKey, JSON.stringify(draftData))
    } catch { /* 静默处理 */ }
    event.preventDefault()
    event.returnValue = ''
    return ''
  }
}

// ==================== 条件格式桥接 ====================
const { conditionalFormatClass, conditionalFormatStyle } = cfComposable

// ==================== 生命周期 ====================
onMounted(async () => {
  const tid = props.templateId || route.params.templateId
  const sid = props.submitId || route.params.submitId

  let preselectedOrgId = ''
  let preselectedPeriod = ''

  if (sid && sid !== 'undefined' && sid !== 'null') {
    try {
      const result = await getEntryDetail(sid)
      const detail = result?.data || result
      if (detail?.reportId) {
        preselectedOrgId = detail.orgId || ''
        preselectedPeriod = detail.period || ''
        await loadReport(String(detail.reportId))
        // 填充提交的单元格数据
        if (detail.cellData && Object.keys(detail.cellData).length > 0) {
          populateCellDataFromApi(detail.cellData)
        }
        recordRecentView(detail.reportId).catch(() => {})
      } else {
        error.value = '无法获取提交记录对应的模板'
      }
    } catch {
      error.value = '加载提交记录失败'
    }
  } else if (tid) {
    await loadReport(tid)
    recordRecentView(tid).catch(() => {})
    // 尝试加载已有提交数据（草稿/已退回/已提交等）
    try {
      const result = await getEntryDetailByReportId(tid)
      const detail = result?.data || result
      if (detail?.cellData && Object.keys(detail.cellData).length > 0) {
        populateCellDataFromApi(detail.cellData)
      }
      preselectedOrgId = detail?.orgId || ''
      preselectedPeriod = detail?.period || ''
    } catch {
      // 没有提交记录是正常的，静默处理
    }
  }

  try { const s = localStorage.getItem('fr_col_folds'); if (s) collapsedGroups.value = new Set(JSON.parse(s)) } catch {}
  window.addEventListener('beforeunload', onBeforeUnload)
  window.addEventListener('resize', measureVP)
  await loadOrgList()

  // 从填报记录恢复组织和周期选择（覆盖 loadOrgList 的默认值）
  if (preselectedOrgId) {
    selectedOrgId.value = String(preselectedOrgId)
  }
  if (preselectedPeriod) {
    selectedPeriod.value = preselectedPeriod
  }
})

watch(() => route.params.templateId, (newId) => {
  if (newId && newId !== props.templateId) {
    loadReport(newId)
  }
})

watch(() => route.params.submitId, (newId) => {
  if (newId && newId !== props.submitId) {
    window.location.reload()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', onBeforeUnload)
  window.removeEventListener('resize', measureVP)
  store.cancelAutoSave()
  if (config.value?.rows?.length > 0) {
    onBeforeUnload({ preventDefault: () => {}, returnValue: '' })
  }
})
</script>

<style lang="scss">
/* DataEntry Spreadsheet 风格的表格样式 */
$bg: #FDFDFD; $surface: #FFFFFF; $border: #E8ECF1; $border-light: #EEF1F6;
$text-primary: #0F172A; $text-secondary: #475569; $text-muted: #94A3B8;
$accent: #2563EB; $success: #059669; $danger: #DC2626; $warning: #D97706;
$hover-bg: #F1F5F9;
$ROW_H: 40px;

.fr-report {
  flex: 1; display: flex; flex-direction: column; overflow: hidden;
  background: $bg; font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 13px; color: $text-primary; outline: none;
}
.fr-loading, .fr-empty {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 12px; color: $text-muted;
}
.fr-loading-spinner {
  width: 32px; height: 32px; border: 3px solid $border; border-top-color: $accent;
  border-radius: 50%; animation: fr-spin .7s linear infinite;
}
@keyframes fr-spin { to { transform: rotate(360deg); } }
.fr-empty-icon { width: 56px; height: 56px; opacity: 0.35; }

.fr-control-bar {
  flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;
  padding: 8px 16px; background: $surface; border-bottom: 1px solid $border;
  gap: 12px; min-height: 44px; flex-wrap: wrap;
}
.fr-cb-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.fr-back-btn {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border: 1px solid $border; border-radius: 6px;
  background: $surface; color: $text-secondary; cursor: pointer; transition: all .15s;
  &:hover { border-color: $accent; color: $accent; background: $hover-bg; }
}
.fr-cb-right { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.fr-view-switch { display: flex; background: $border-light; border-radius: 6px; padding: 2px; }
.fr-vs-btn {
  padding: 4px 12px; border: none; background: transparent; border-radius: 4px;
  font-size: 12px; color: $text-secondary; cursor: pointer; transition: all .15s;
  &:hover { color: $text-primary; }
  &.active { background: $surface; color: $accent; font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
}
.fr-divider { width: 1px; height: 16px; background: $border; }
.fr-stat-badge { font-size: 11px; color: $text-muted; b { color: $text-secondary; font-weight: 600; margin: 0 2px; } em { font-style: normal; margin: 0 4px; color: $border; } }
.fr-anomaly-count { color: $danger; font-weight: 600; }
.fr-template-badge {
  font-size: 13px; font-weight: 600; color: $text-primary;
  em { font-style: normal; font-size: 11px; color: $text-muted; margin-left: 4px; font-weight: 400; }
  .fr-v2-badge {
    font-style: normal; font-size: 9px; font-weight: 700;
    background: linear-gradient(135deg, #7C3AED, #2563EB);
    color: #fff; padding: 1px 6px; border-radius: 4px;
    margin-left: 6px; vertical-align: middle; letter-spacing: .5px;
  }
  .fr-ro-badge {
    font-style: normal; font-size: 9px; font-weight: 700;
    background: #f0f2f5;
    color: #8c8c8c; padding: 1px 6px; border-radius: 4px;
    margin-left: 6px; vertical-align: middle; letter-spacing: .5px;
    border: 1px solid #d9d9d9;
  }
}
.fr-save-status {
  font-size: 11px; padding: 2px 10px; border-radius: 10px; font-weight: 500;
  animation: fr-status-in .2s ease-out;
  &.fr-save-saving { background: #FEF3C7; color: #92400E; }
  &.fr-save-success { background: #D1FAE5; color: #065F46; }
  &.fr-save-error { background: #FEE2E2; color: #991B1B; }
}
@keyframes fr-status-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

.fr-action-btn {
  padding: 4px 12px; border: 1px solid $border-light; background: $surface;
  border-radius: 6px; font-size: 12px; color: $text-secondary; cursor: pointer;
  transition: all .15s; white-space: nowrap;
  &:hover { border-color: $accent; color: $accent; background: #EFF6FF; }
}
.fr-fold-btn {
  padding: 4px 10px; border: 1px solid $border-light; background: $surface;
  border-radius: 6px; font-size: 12px; color: $text-secondary; cursor: pointer;
  transition: all .15s; white-space: nowrap; display: inline-flex; align-items: center; gap: 2px;
  &:hover { border-color: $accent; color: $accent; }
  &.collapsed { opacity: .7; }
}
.fr-fold-icon { font-size: 8px; }
.fr-add-row-btn {
  display: inline-flex; align-items: center; gap: 4px;
  background: #F0FDF4; border-color: #BBF7D0; color: #16A34A;
  &:hover { background: #DCFCE7; border-color: #86EFAC; color: #15803D; }
  svg { flex-shrink: 0; stroke-width: 2.5; }
}
.fr-save-btn {
  display: inline-flex; align-items: center; gap: 4px;
  background: #EFF6FF; border-color: #BFDBFE; color: #2563EB;
  &:hover { background: #DBEAFE; border-color: #93C5FD; color: #1D4ED8; }
  svg { flex-shrink: 0; stroke-width: 1.5; }
}
.fr-publish-btn {
  display: inline-flex; align-items: center; gap: 4px;
  background: #FEF3C7; border-color: #FCD34D; color: #D97706;
  &:hover { background: #FDE68A; border-color: #FBBF24; color: #B45309; }
}
.fr-submit-btn {
  display: inline-flex; align-items: center; gap: 4px;
  background: #DBEAFE; border-color: #93C5FD; color: #2563EB;
  &:hover { background: #BFDBFE; border-color: #60A5FA; color: #1D4ED8; }
  &:disabled { opacity: .4; cursor: not-allowed; }
}

.fr-readonly-field {
  display: flex; align-items: center; gap: 8px;
  padding: 4px 12px; background: #f5f7fa; border-radius: 4px; border: 1px solid #e4e7ed;
}
.fr-readonly-label { font-size: 12px; font-weight: 600; color: #606266; margin-right: 4px; }
.fr-readonly-value { font-size: 13px; color: #303133; font-weight: 500; }

.fr-cf-applied {
  position: relative;
  &::after { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--cf-indicator, #2563EB); border-radius: 2px; }
}
.fr-validation-error {
  border-bottom: 2px solid $danger !important; position: relative;
  &::before { content: '!'; position: absolute; right: 2px; top: 50%; transform: translateY(-50%); font-size: 10px; color: $danger; font-weight: bold; }
}
.fr-validation-warning { border-bottom: 2px solid $warning !important; }

.fr-body {
  flex: 1; overflow: auto; position: relative; background: $surface;
  border-radius: 12px; margin: 0 16px 16px; border: 1px solid $border;
  &::-webkit-scrollbar { width: 8px; height: 8px; }
  &::-webkit-scrollbar-thumb { background: rgba(0,0,0,.20); border-radius: 4px; &:hover { background: rgba(0,0,0,.35); } }
  &::-webkit-scrollbar-track { background: transparent; }
}
.fr-header-section {
  position: sticky; top: 0; z-index: 10; background: $surface;
}
.fr-table {
  width: max-content; border-collapse: collapse; table-layout: fixed;
  th, td { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
}
.fr-th {
  padding: 0 12px; height: $ROW_H; text-align: center; font-size: 13px; font-weight: 600;
  color: $text-primary; border: 1px solid $border; user-select: none; position: relative;
  background: $hover-bg;
  &.fr-th-corner { width: 50px; min-width: 50px; vertical-align: middle; }
  &.fr-th-metric { width: 180px; min-width: 180px; text-align: left; vertical-align: middle; }
  &.fr-th-placeholder { background: transparent; border-bottom: none; border-top: none; padding: 0; height: 0; }
  .fr-th-text { cursor: default; }
  .fr-th-hint { margin-left: 4px; font-size: 10px; cursor: help; opacity: .6; &:hover { opacity: 1; } }
}
.fr-td {
  padding: 0 12px; height: $ROW_H; line-height: $ROW_H; font-size: 13px;
  border-right: 1px solid $border; border-bottom: 1px solid $border;
  vertical-align: middle; transition: background-color .1s;
}
.fr-td-index { width: 50px; min-width: 50px; text-align: center; color: $text-muted; background: $hover-bg; font-size: 12px; font-weight: 500; }
.fr-td-metric { width: 180px; min-width: 180px; text-align: left; background: $hover-bg; font-weight: 500; cursor: default; }
.fr-td-val {
  text-align: right; font-family: "SF Mono", Menlo, Consolas, monospace;
  font-variant-numeric: tabular-nums; cursor: cell; position: relative;
  &:hover:not(.fr-editing):not(.fr-ro) { background: $hover-bg; }
}

.fr-metric-cell { display: flex; align-items: center; height: 100%; }
.fr-tree-node { display: flex; align-items: center; height: 100%; cursor: pointer; user-select: none; position: relative; }
.fr-tree-toggle {
  display: inline-flex; align-items: center; justify-content: center;
  width: 16px; height: 16px; font-size: 8px; color: $text-muted;
  transition: transform .15s; flex-shrink: 0;
  &.expanded { transform: rotate(90deg); }
  &:hover { color: $accent; }
}
.fr-tree-leaf { display: inline-block; width: 16px; flex-shrink: 0; }
.fr-tree-line { position: absolute; left: 8px; top: 0; bottom: 0; width: 1px; background: $border-light; z-index: 0; }
.fr-tree-label { margin-left: 2px; overflow: hidden; text-overflow: ellipsis; &:hover { color: $accent; } }

.fr-row-summary {
  .fr-td-metric { background: #EFF6FF; }
  .fr-td-val { background: #EFF6FF; font-weight: 700; color: #1E40AF; }
}
.fr-summary-badge {
  display: inline-block; padding: 1px 6px; border-radius: 3px;
  background: $accent; color: #fff; font-size: 10px; font-weight: 600; margin-right: 6px;
}
.fr-summary-label { font-weight: 600; }
.fr-row-child .fr-td-val { background: #F8FAFC; color: $text-secondary; font-size: 12px; }
.fr-child-item { display: flex; align-items: center; font-size: 12px; color: $text-secondary; }
.fr-child-dot { width: 6px; height: 6px; border-radius: 50%; background: $border; margin-right: 6px; flex-shrink: 0; }

.fr-up { color: $success !important; font-weight: 600; }
.fr-down { color: $danger !important; font-weight: 600; }
.fr-flat { color: $text-secondary; }
.fr-ro { color: $text-muted; font-style: italic; }
.fr-bold { font-weight: 700; }
.fr-anomaly-val { background: #FEF2F2 !important; color: $danger !important; font-weight: 600; }

.fr-editing { padding: 0 !important; }
.fr-edit-input {
  width: 100%; height: 100%; border: 2px solid $accent; outline: none;
  padding: 0 8px; font-family: inherit; font-size: inherit; text-align: right;
  background: #fff; border-radius: 0; box-sizing: border-box;
  &.fr-edit-error { border-color: $danger; background: #FEF2F2; }
}
.fr-row:hover .fr-td { background: $hover-bg; }
.fr-row-hover .fr-td-index { color: $accent; font-weight: 600; }

.fr-tip {
  position: fixed; z-index: 9999; padding: 8px 12px; background: #1E293B;
  color: #E2E8F0; font-size: 12px; border-radius: 6px; box-shadow: 0 4px 16px rgba(0,0,0,.25);
  pointer-events: none; max-width: 280px; line-height: 1.5;
  p { margin: 4px 0 0; color: #94A3B8; font-size: 11px; }
}

.fr-drawer-mask { position: fixed; inset: 0; z-index: 2000; background: rgba(0,0,0,.35); backdrop-filter: blur(2px); }
.fr-drawer {
  position: fixed; right: 0; top: 0; bottom: 0; width: 420px; max-width: 90vw;
  background: $surface; box-shadow: -4px 0 24px rgba(0,0,0,.12);
  display: flex; flex-direction: column; animation: fr-slide-in .25s ease-out;
}
@keyframes fr-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
.fr-drawer-enter-active, .fr-drawer-leave-active { transition: all .25s; }
.fr-drawer-enter-from, .fr-drawer-leave-to { transform: translateX(100%); opacity: 0; }
.fr-drawer-hd { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid $border; h3 { margin: 0; font-size: 15px; font-weight: 600; } }
.fr-drawer-close {
  width: 28px; height: 28px; border: none; background: $border-light;
  border-radius: 6px; font-size: 18px; cursor: pointer; color: $text-muted;
  &:hover { background: $border; color: $text-primary; }
}
.fr-drawer-bd { flex: 1; overflow-y: auto; padding: 16px 20px; }
.fr-ds-section { margin-bottom: 18px; }
.fr-ds-section h4 { margin: 0 0 10px; font-size: 12px; color: $text-muted; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; }
.fr-ds-grid { display: grid; grid-template-columns: auto 1fr; gap: 6px 12px; }
.fr-ds-field { display: contents; }
.fr-ds-field label { font-size: 12px; color: $text-muted; }
.fr-ds-field span { font-size: 13px; font-weight: 500; word-break: break-all; }
.fr-ds-field code { font-size: 12px; background: #F1F5F9; padding: 2px 6px; border-radius: 3px; color: #7C3AED; }
.fr-drawer-action {
  display: inline-flex; align-items: center; margin-left: 8px;
  padding: 2px 10px; font-size: 11px; background: #EEF2FF; border: 1px solid #C7D2FE;
  border-radius: 4px; color: #4F46E5; cursor: pointer; transition: all .15s;
  &:hover { background: #E0E7FF; border-color: #A5B4FC; }
}
.fr-ds-warn { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 12px; }
.fr-ds-warn p { margin: 0; color: $danger; font-size: 12px; }
.fr-history-list { display: flex; flex-direction: column; gap: 6px; }
.fr-hist-item { display: flex; align-items: center; gap: 10px; font-size: 12px; padding: 6px 8px; background: #F8FAFC; border-radius: 4px; }
.fr-hist-period { color: $text-muted; min-width: 70px; }
.fr-hist-val { font-weight: 600; font-family: monospace; min-width: 80px; }
.fr-hist-diff.up { color: $success; }
.fr-hist-diff.down { color: $danger; }

.fr-toast {
  position: fixed; top: 60px; left: 50%; transform: translateX(-50%);
  z-index: 3000; padding: 8px 20px; border-radius: 8px; font-size: 13px;
  font-weight: 500; box-shadow: 0 4px 16px rgba(0,0,0,.15);
  &.fr-toast-error { background: #FEE2E2; color: #991B1B; }
  &.fr-toast-success { background: #D1FAE5; color: #065F46; }
  &.fr-toast-warning { background: #FEF3C7; color: #92400E; }
}
.fr-toast-enter-active, .fr-toast-leave-active { transition: all .2s; }
.fr-toast-enter-from, .fr-toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(-10px); }

.fr-fade-enter-active, .fr-fade-leave-active { transition: opacity .15s; }
.fr-fade-enter-from, .fr-fade-leave-to { opacity: 0; }

.fr-col-hidden { display: none; }
.fr-spacer-td { padding: 0; border: none !important; line-height: 0; font-size: 0; overflow: hidden; }

/* Footer 状态栏 */
.fr-footer {
  flex-shrink: 0; display: flex; justify-content: flex-end; gap: 24px;
  padding: 8px 16px; background: $hover-bg; border-top: 1px solid $border;
  margin: 0 16px 16px; border-radius: 0 0 12px 12px;
}
.fr-footer-cell, .fr-footer-mode, .fr-footer-sum { font-size: 12px; color: $text-muted; }
.fr-footer-sum { font-weight: 500; font-family: "SF Mono", Menlo, monospace; }
</style>
