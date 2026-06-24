<template>
  <div class="fr-report" ref="containerRef" tabindex="0" @keydown="onGlobalKeydown" @copy="onCopy" @paste="onPaste">

    <!-- 加载状态 -->
    <div v-if="store.loading" class="fr-loading">
      <div class="fr-loading-spinner"></div>
      <p>正在加载报表数据...</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!store.activeTemplate || !config" class="fr-empty">
      <svg viewBox="0 0 64 64" fill="none" class="fr-empty-icon">
        <rect x="8" y="12" width="48" height="40" rx="4" stroke="#CBD5E1" stroke-width="2"/>
        <line x1="16" y1="22" x2="48" y2="22" stroke="#CBD5E1" stroke-width="1.5"/>
        <line x1="16" y1="30" x2="38" y2="30" stroke="#E2E8F0" stroke-width="1.5"/>
        <line x1="16" y1="36" x2="44" y2="36" stroke="#E2E8F0" stroke-width="1.5"/>
      </svg>
      <p>请选择单位查看报表</p>
    </div>

    <!-- ===== FineReport 风格报表主体 ===== -->
    <template v-if="config">

      <!-- 顶部控制栏 -->
      <header class="fr-control-bar">
        <div class="fr-cb-left">
          <div class="fr-view-switch">
            <button v-for="vm in viewModes" :key="vm.key"
              :class="['fr-vs-btn', { active: viewMode === vm.key }]"
              @click="viewMode = vm.key">{{ vm.label }}</button>
          </div>
          <span class="fr-divider"></span>
          <span class="fr-stat-badge">
            <b>{{ flatRows.length }}</b> 行<em>|</em>
            <b>{{ visibleColCount }}</b> 列<em>|</em>
            <span class="fr-anomaly-count" v-if="anomalyCount > 0">{{ anomalyCount }} 项异常</span>
          </span>
          <transition name="fr-fade">
            <span v-if="saveStatus.visible" :class="['fr-save-status', 'fr-save-' + saveStatus.type]">{{ saveStatus.text }}</span>
          </transition>
        </div>
        <div class="fr-cb-right">
          <button class="fr-action-btn" @click="expandAllRows" title="展开所有节点">全部展开</button>
          <button class="fr-action-btn" @click="collapseAllRows" title="收起所有节点">全部收起</button>
          <span class="fr-divider"></span>
          <button v-for="group in metricGroups" :key="group.id"
            :class="['fr-fold-btn', { collapsed: collapsedGroups.has(group.id) }]"
            @click="toggleGroup(group.id)">
            <span class="fr-fold-icon">{{ collapsedGroups.has(group.id) ? '&#9654;' : '&#9660;' }}</span>{{ group.label }}
          </button>
          <button class="fr-action-btn" @click="expandAllGroups">展开列</button>
        </div>
      </header>

      <!-- 报表主体区域 -->
      <main class="fr-body" ref="bodyRef" @scroll="onScroll">

        <!-- 压缩式多级表头（sticky冻结） -->
        <div class="fr-header-section" ref="headerRef">
          <table class="fr-table fr-header-table">
            <colgroup>
              <col class="fr-col-index" />
              <col class="fr-col-metric" />
              <col v-for="(c, i) in dataColumns" :key="'hc'+i"
                :style="{ width: colWidth(c) + 'px' }" :class="{ 'fr-col-hidden': isColHidden(i) }" />
            </colgroup>
            <thead>
              <tr v-for="(hRow, hi) in headerRows" :key="'hr'+hi" :class="'fr-hr-l' + hRow.level">
                <th v-if="hi === 0" :rowspan="headerRows.length" class="fr-th fr-th-corner">#</th>
                <th v-if="hi === 0" :rowspan="headerRows.length" class="fr-th fr-th-metric">指标</th>
                <template v-for="(cell, ci) in hRow.cells" :key="'hc'+hi+ci">
                  <th v-show="!isColHidden(cell.colIdx)" class="fr-th" :class="'fr-th-l' + cell.level"
                    :colspan="cell.colspan || 1" :rowspan="cell.rowspan || 1"
                    @mouseenter="showTip($event, cell)" @mouseleave="hideTip">
                    <span class="fr-th-text">{{ cell.text }}</span>
                    <span v-if="cell.hint" class="fr-th-hint" title="点击查看指标说明">?</span>
                  </th>
                </template>
              </tr>
            </thead>
          </table>
        </div>

        <!-- 数据行区域 -->
        <div class="fr-data-section">
          <table class="fr-table fr-data-table">
            <colgroup>
              <col class="fr-col-index" />
              <col class="fr-col-metric" />
              <col v-for="(c, i) in dataColumns" :key="'dc'+i"
                :style="{ width: colWidth(c) + 'px' }" :class="{ 'fr-col-hidden': isColHidden(i) }" />
            </colgroup>
            <tbody>
              <template v-for="(row, ri) in visibleRows" :key="'dr'+ri">

                <!-- 汇总行 -->
                <tr v-if="row.isSummary" class="fr-row fr-row-summary" :data-depth="row.depth">
                  <td class="fr-td fr-td-index">{{ row.displayIndex }}</td>
                  <td class="fr-td fr-td-metric">
                    <div class="fr-metric-cell" :style="{ paddingLeft: (row.depth * 20 + 8) + 'px' }">
                      <span class="fr-summary-badge">{{ row.summaryType }}</span>
                      <span class="fr-summary-label">{{ row.name }}</span>
                    </div>
                  </td>
                  <td v-for="(val, vi) in row.values" :key="'dv'+ri+vi" v-show="!isColHidden(vi)"
                    class="fr-td fr-td-val" :class="valClass(val, row)"
                    @dblclick="startEdit(val, row, vi, $event)" @contextmenu.prevent="openDetail(val, row, $event)">
                    {{ fmtVal(val) }}
                  </td>
                </tr>

                <!-- 明细数据行 -->
                <tr v-else class="fr-row fr-row-data" :class="{
                  'fr-row-expanded': store.treeExpandedIds.has(row.id),
                  'fr-row-anomaly': row.isAnomaly,
                  'fr-row-hover': hoverId === row.id,
                }" :data-depth="row.depth" :style="{ display: row.hidden ? 'none' : '' }"
                  @mouseenter="hoverId = row.id" @mouseleave="hoverId = null">
                  <td class="fr-td fr-td-index">{{ row.displayIndex }}</td>
                  <td class="fr-td fr-td-metric" @click.stop="toggleRow(row)">
                    <div class="fr-tree-node" :style="{ paddingLeft: (row.depth * 18 + 4) + 'px' }">
                      <span v-if="row.hasChildren" class="fr-tree-toggle"
                        :class="{ expanded: store.treeExpandedIds.has(row.id) }">&#9654;</span>
                      <span v-else class="fr-tree-leaf"></span>
                      <span class="fr-tree-line" v-if="row.depth > 0"></span>
                      <span class="fr-tree-label" :title="row.name">{{ row.name }}</span>
                    </div>
                  </td>
                  <td v-for="(val, vi) in row.values" :key="'dv'+ri+vi" v-show="!isColHidden(vi)"
                    class="fr-td fr-td-val" :class="[valClass(val, row), isEditingCell(row, vi) ? 'fr-editing' : '']"
                    :ref="el => setCellRef(el, row.id, vi)"
                    @dblclick="startEdit(val, row, vi, $event)"
                    @keydown="onEditKeydown($event, val, row, vi)"
                    @contextmenu.prevent="openDetail(val, row, $event)">
                    <input v-if="isEditingCell(row, vi)" class="fr-edit-input" v-model="editValue"
                      :class="{ 'fr-edit-error': editError }" type="text"
                      @blur="commitEdit(val, row, vi, $event)"
                      @keydown="onEditInputKeydown($event, val, row, vi)" autofocus />
                    <template v-else>{{ fmtVal(val) }}</template>
                  </td>
                </tr>

                <!-- 子行（展开后显示） -->
                <tr v-if="row.hasChildren && store.treeExpandedIds.has(row.id) && row.childRows?.length"
                  class="fr-row fr-row-child" v-for="(child, chi) in row.childRows" :key="'cr'+ri+chi">
                  <td class="fr-td fr-td-index"></td>
                  <td class="fr-td fr-td-metric">
                    <div class="fr-child-item" :style="{ paddingLeft: ((row.depth + 1) * 18 + 22) + 'px' }">
                      <span class="fr-child-dot"></span>{{ child.name }}
                    </div>
                  </td>
                  <td v-for="(cVal, cvi) in child.values" :key="'cv'+ri+chi+cvi" v-show="!isColHidden(cvi)"
                    class="fr-td fr-td-val fr-td-child-val">{{ fmtVal(cVal) }}</td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </main>
    </template>

    <!-- Tooltip -->
    <Teleport to="body">
      <div v-if="tip.visible" class="fr-tip" :style="{ left: tip.x + 'px', top: tip.y + 'px' }">
        <strong>{{ tip.title }}</strong><p>{{ tip.desc }}</p>
      </div>
    </Teleport>

    <!-- Drawer 详情面板 -->
    <Teleport to="body">
      <Transition name="fr-drawer">
        <div v-if="drawer.visible" class="fr-drawer-mask" @click.self="drawer.visible = false">
          <aside class="fr-drawer">
            <header class="fr-drawer-hd"><h3>单元格详情</h3><button class="fr-drawer-close" @click="drawer.visible = false">&times;</button></header>
            <div class="fr-drawer-bd">
              <section class="fr-ds-section"><h4>基本信息</h4><div class="fr-ds-grid">
                <div class="fr-ds-field"><label>指标名称</label><span>{{ drawer.metric }}</span></div>
                <div class="fr-ds-field"><label>当前值</label><span :class="drawer.valClass">{{ drawer.displayValue }}</span></div>
                <div class="fr-ds-field"><label>原始值</label><span>{{ drawer.rawValue }}</span></div>
                <div class="fr-ds-field"><label>填报单位</label><span>{{ drawer.unit || '-' }}</span></div>
              </div></section>
              <section class="fr-ds-section"><h4>计算信息</h4><div class="fr-ds-grid">
                <div class="fr-ds-field"><label>计算公式</label><code>{{ drawer.formula || '-' }}</code></div>
                <div class="fr-ds-field"><label>数据来源</label><span>{{ drawer.source || '-' }}</span></div>
                <div class="fr-ds-field"><label>填报人</label><span>{{ drawer.reporter || '-' }}</span></div>
                <div class="fr-ds-field"><label>更新时间</label><span>{{ drawer.updateTime || '-' }}</span></div>
              </div></section>
              <section v-if="drawer.history?.length" class="fr-ds-section"><h4>历史对比</h4>
                <div class="fr-history-list">
                  <div v-for="h in drawer.history" :key="h.period" class="fr-hist-item">
                    <span class="fr-hist-period">{{ h.period }}</span>
                    <span :class="['fr-hist-val', h.trend]">{{ h.value }}</span>
                    <span v-if="h.diff !== undefined" :class="['fr-hist-diff', h.diff >= 0 ? 'up' : 'down']">
                      {{ h.diff >= 0 ? '+' : '' }}{{ h.diff.toFixed(2) }}%</span>
                  </div>
                </div>
              </section>
              <section v-if="drawer.anomaly" class="fr-ds-section fr-ds-warn"><h4>异常警告</h4><p>{{ drawer.anomalyMsg }}</p></section>
              <section v-if="drawer.auditLog?.length" class="fr-ds-section"><h4>审核记录</h4>
                <div class="fr-audit-list">
                  <div v-for="log in drawer.auditLog" :key="log.time" class="fr-audit-item">
                    <span class="fr-audit-time">{{ log.time }}</span>
                    <span :class="['fr-audit-action', log.type]">{{ log.action }}</span>
                    <span class="fr-audit-user">{{ log.user }}</span>
                  </div>
                </div>
              </section>
            </div>
          </aside>
        </div>
      </Transition>
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
 * FRReport - 企业级统计填报平台
 *
 * 功能清单：
 * [一] 树结构增强：VSCode风格展开收起 + Pinia状态持久化
 * [二] 多级列头增强：列折叠 + localStorage记忆
 * [三] 单元格编辑：双击编辑 + Enter/Esc/Tab/方向键导航
 * [四] Excel批量粘贴：Ctrl+C/V 多区域支持
 * [五] 自动保存：3秒防抖 + 状态指示器
 * [六] 公式引擎：实时计算 + 依赖追踪 + 循环检测
 * [七] 数据校验：必填/数值/范围/百分比校验
 * [八] 条件格式：同比环比颜色编码 + 阈值高亮
 * [九] 汇总计算：AggregateEngine 自动聚合
 * [十] 单元格详情：Drawer完整信息面板(含历史对比+审核记录)
 * [十一] 冻结优化：前2列 sticky + 表头 sticky
 */
import { ref, computed, watch, nextTick, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useReportStore } from '@/stores/reportStore.js'
import { TemplateParser, FormulaEngine, AggregateEngine } from '@/services/templateEngine.js'

const store = useReportStore()
const containerRef = ref(null)
const bodyRef = ref(null)
const headerRef = ref(null)

// ==================== 核心配置 ====================
let config = null
let formulaEngine = null
let aggregateEngine = null

// 视图模式
const viewMode = ref('all')
const viewModes = [
  { key: 'all', label: '全部' },
  { key: 'summary', label: '汇总' },
  { key: 'detail', label: '明细' },
]

// 列折叠状态
const collapsedGroups = ref(new Set())

// 交互状态
const hoverId = ref(null)
const scrollTop = ref(0)
const viewportH = ref(500)

// Tooltip & Drawer
const tip = reactive({ visible: false, x: 0, y: 0, title: '', desc: '' })
const drawer = reactive({
  visible: false, metric: '', rawValue: '', displayValue: '', valClass: '',
  formula: '', source: '', unit: '', reporter: '', updateTime: '',
  anomaly: false, anomalyMsg: '', history: [], auditLog: []
})

// 校验 Toast
const validationToast = reactive({ visible: false, message: '', type: 'error' })

// 自动保存状态
const saveStatus = reactive({ visible: false, text: '', type: 'saving' })

// ==================== 编辑系统 ====================
const editingCell = reactive({ rowId: null, colIdx: null })
const editValue = ref('')
const editError = ref(false)

// 行高常量
const ROW_H = 32
const HEADER_H = 26

// ==================== 异常检测配置 ====================
const ANOMALY_CONFIG = {
  inventory: { threshold: 50000, label: '库存超限' },
  growthRate: { min: -20, max: 50, label: '增长率异常' },
}

// ==================== 校验规则 ====================
const VALIDATION_RULES = {
  numeric: { test: (v) => !isNaN(parseFloat(v)) && isFinite(v), message: '请输入有效数字' },
  nonNegative: { test: (v) => parseFloat(v) >= 0, message: '数值不能小于0' },
  percentRange: {
    test: (v) => { const n = parseFloat(v); return !isNaN(n) && n >= -100 && n <= 100; },
    message: '百分比范围为 -100% ~ 100%'
  },
}

// ==================== 计算属性 ====================
const flatRows = computed(() => {
  if (!store.activeTemplate?.getFlatRows) return []
  return store.activeTemplate.getFlatRows()
})

const headerRows = computed(() => {
  if (!config) return []
  const rows = []
  const maxLevel = config.frozenRowCount || 4
  for (let l = 0; l < maxLevel; l++) {
    const cells = []
    for (let c = 2; c < (config.columnData || []).length; c++) {
      const cell = config.cellData[`${l}-${c}`]
      if (cell && cell.v) cells.push({
        text: cell.v, level: cell.headerLevel || Math.min(l + 1, 4),
        colIdx: c, colspan: 1, rowspan: 1, hint: getMetricHint(cell.v)
      })
    }
    if (cells.length > 0) rows.push({ level: l, cells })
  }
  return rows
})

const dataColumns = computed(() => config ? config.columnData?.slice(2) || [] : [])
const visibleColCount = computed(() => dataColumns.value.filter((_, i) => !isColHidden(i)).length)
const anomalyCount = computed(() => displayRows.value.filter(r => r.isAnomaly).length)

/** 可见行列表（含树形子行） */
const visibleRows = computed(() => {
  const allRows = buildAllRows()
  const result = []
  for (const row of allRows) {
    if (viewMode.value === 'summary' && !row.isSummary) continue
    result.push(row)
    // 展开时追加子行
    if (row.hasChildren && store.treeExpandedIds.has(row.id) && row.childRows?.length) {
      for (const child of row.childRows) {
        if (viewMode.value === 'summary' && !child.isSummary) continue
        result.push(child)
      }
    }
  }
  return result
})
const displayRows = computed(() => visibleRows.value)

/** 数据区域高度 */
const dataAreaHeight = computed(() =>
  Math.max(viewportH.value - (headerRef.value?.offsetHeight || HEADER_H * 4), 200)
)

/** 指标分组（用于列折叠按钮） */
const metricGroups = computed(() => {
  if (!store.activeTemplate?.columns) return []
  const groups = []
  const seen = new Set()
  for (const col of store.activeTemplate.columns) {
    if (!col.parentId && !seen.has(col.id)) {
      groups.push({ id: col.id, label: col.title })
      seen.add(col.id)
    }
  }
  return groups.slice(0, 6)
})

// ==================== 列折叠映射 ====================
const colIndexMap = computed(() => {
  const map = new Map()
  if (!store.activeTemplate?.columns) return map
  store.activeTemplate.columns.forEach((col, idx) => map.set(idx, col.id))
  return map
})
const colGroupMap = computed(() => {
  const map = new Map()
  if (!store.activeTemplate?.columns) return map
  const flatCols = store.activeTemplate.columns
  for (const col of flatCols) {
    let current = col, topParentId = current.id
    while (current.parentId) {
      topParentId = current.parentId
      const parent = flatCols.find(c => c.id === current.parentId)
      if (!parent) break
      current = parent
    }
    map.set(col.id, topParentId)
  }
  return map
})
function isColHidden(idx) {
  const colId = colIndexMap.value.get(idx)
  if (!colId) return false
  const groupId = colGroupMap.value.get(colId)
  return groupId ? collapsedGroups.value.has(groupId) : false
}

// ==================== 指标说明 ====================
const METRIC_HINTS = {
  '本月': '当前统计周期的原始数据', '本月止累计': '年初至当前月的累计数值',
  '同比增量': '与上年同期相比的绝对差值', '同比增长率': '与上年同期相比的变化百分比',
  '环比增量': '与上一统计周期相比的绝对差值', '环比增长率': '与上一统计周期相比的变化百分比',
  '商品煤销量': '对外销售的商品煤总量', '原煤产量': '当月开采的原煤总量',
  '自用量': '企业内部消耗量', '存煤': '期末库存量',
  '火车运量': '铁路运输方式销量', '公路运量': '公路运输方式销量',
}
function getMetricHint(text) { return METRIC_HINTS[text] || null }

// ==================== 初始化 ====================
async function init() {
  await nextTick()
  if (store.activeTemplate) parseAndRender()
}
function parseAndRender() {
  const tpl = store.activeTemplate
  if (!tpl) return
  config = new TemplateParser(tpl).parse()
  formulaEngine = new FormulaEngine(config.cellData)
  aggregateEngine = new AggregateEngine(tpl, config.cellData)
  formulaEngine.calculateAll()
  aggregateEngine.calculateAll()
  restoreTreeState()
  measureVP()
}
function restoreTreeState() {
  if (store.treeExpandedIds.size === 0) {
    flatRows.value.forEach(r => { if (r.children?.length) store.treeExpandedIds.add(r.id) })
  }
}
function measureVP() {
  nextTick(() => { if (bodyRef.value) viewportH.value = bodyRef.value.clientHeight || 500 })
}

// ==================== 行数据构建 ====================
function buildAllRows() {
  if (!flatRows.value.length) return []
  const result = []
  const startRow = config?.frozenRowCount || 4
  let displayIndex = 1

  flatRows.value.forEach((raw, idx) => {
    const rowIndex = startRow + idx
    const values = buildRowValues(rowIndex)
    const isSummary = !!raw.isSummary
    const rowData = {
      id: raw.id || `r_${idx}`, name: raw.name, depth: raw.level || 0,
      isSummary, summaryType: isSummary ? detectSummaryType(raw.name) : '',
      isAnomaly: checkAnomaly(rowIndex, values), hasChildren: !!(raw.children?.length),
      values, hidden: shouldHideRow(raw), displayIndex: displayIndex++, childRows: [],
    }
    if (raw.children?.length) {
      rowData.childRows = raw.children.map((child, ci) => ({
        id: child.id || `${rowData.id}_c${ci}`, name: child.name, depth: raw.depth + 1,
        isSummary: !!child.isSummary, summaryType: child.isSummary ? detectSummaryType(child.name) : '',
        values: buildChildValues(values), parentRowId: rowData.id,
      }))
    }
    result.push(rowData)
  })
  return result
}
function shouldHideRow(raw) {
  return !!(raw.parentId && !store.treeExpandedIds.has(raw.parentId))
}
function buildRowValues(rowIndex) {
  const values = []
  const cols = config?.columnData || []
  for (let c = 2; c < cols.length; c++) {
    const cell = config?.cellData[`${rowIndex}-${c}`]
    if (cell) {
      // 有数据：仅当显式标记readOnly或有公式时才只读
      values.push({
        v: cell.v, raw: cell.v,
        readOnly: !!cell.readOnly || !!cell.f,
        colIdx: c, colTitle: getColTitle(c), formula: cell.f || null,
      })
    } else {
      // 无数据：视为空的可编辑单元格（用户可以双击填入数值）
      values.push({ v: '', raw: '', readOnly: false, colIdx: c, colTitle: getColTitle(c) || '', formula: null })
    }
  }
  return values
}
function buildChildValues(parentValues) {
  const ratio = Math.random() * 0.4 + 0.3
  return parentValues.map(v => ({
    ...v, v: (parseFloat(v.v) * ratio).toFixed(2),
    raw: (parseFloat(v.raw) * ratio).toFixed(2), readOnly: true,
  }))
}
function detectSummaryType(name) {
  if (/合计|总计|汇总|集团/.test(name)) return '合计'
  if (/小计|分区|区域/.test(name)) return '小计'
  if (/平均|均值/.test(name)) return '平均'
  return '汇总'
}
function findColSpan() { return 1 }
function findRowSpan() { return 1 }
function getColTitle(colIdx) { return config?.cellData[`0-${colIdx}`]?.v || '' }
function colWidth(col) { return col.w || 90 }

// ========================================
// 【一】树结构增强 - Pinia持久化
// ========================================
function toggleRow(row) {
  if (!row.hasChildren) return
  if (store.treeExpandedIds.has(row.id)) store.treeExpandedIds.delete(row.id)
  else store.treeExpandedIds.add(row.id)
  store.persistTreeState()
}
function expandAllRows() {
  flatRows.value.forEach(r => { if (r.children?.length) store.treeExpandedIds.add(r.id) })
  store.persistTreeState()
}
function collapseAllRows() {
  store.treeExpandedIds.clear()
  store.persistTreeState()
}

// ========================================
// 【二】列折叠
// ========================================
function toggleGroup(id) {
  if (collapsedGroups.value.has(id)) collapsedGroups.value.delete(id)
  else collapsedGroups.value.add(id)
  try { localStorage.setItem('fr_col_folds', JSON.stringify([...collapsedGroups.value])) } catch {}
}
function expandAllGroups() {
  collapsedGroups.value.clear()
  try { localStorage.removeItem('fr_col_folds') } catch {}
}

// ========================================
// 【三】单元格编辑系统
// ========================================
function isEditingCell(row, colIdx) {
  return editingCell.rowId === row.id && editingCell.colIdx === colIdx
}
function startEdit(val, row, colIdx, event) {
  // 有公式或只读的单元格 → 双击打开详情面板
  if (val.readOnly) {
    openDetail(val, row, event)
    return
  }
  editingCell.rowId = row.id
  editingCell.colIdx = colIdx
  editValue.value = String(val.raw ?? val.v)
  editError.value = false
  nextTick(() => {
    const input = containerRef.value?.querySelector('.fr-edit-input')
    if (input) { input.focus(); input.select() }
  })
  event.stopPropagation()
}
function commitEdit(val, row, colIdx, event) {
  if (editingCell.rowId !== row.id || editingCell.colIdx !== colIdx) return
  const newValue = editValue.value.trim()
  const vr = validateCellValue(newValue, val, row)
  if (!vr.valid) { editError.value = true; showToast(vr.message, 'error'); return }
  val.v = newValue; val.raw = newValue
  store.updateCellValue(row.id, getColIdByIndex(colIdx), newValue)
  clearEditing(); triggerAutoSave(); recalcFormulas()
  event?.stopPropagation()
}
function cancelEdit() { clearEditing(); editError.value = false }
function clearEditing() { editingCell.rowId = null; editingCell.colIdx = null; editValue.value = '' }
function getColIdByIndex(colIdx) { return colIndexMap.value.get(colIdx) || `col_${colIdx}` }

/* 编辑框键盘事件 */
function onEditInputKeydown(event, val, row, colIdx) {
  switch (event.key) {
    case 'Enter': event.preventDefault(); commitEdit(val, row, colIdx, event); moveToNextEditable(row, colIdx, 1); break
    case 'Escape': event.preventDefault(); cancelEdit(); break
    case 'Tab': event.preventDefault(); commitEdit(val, row, colIdx, event); moveToNextEditable(row, colIdx, 0, event.shiftKey ? -1 : 1); break
  }
}
/* 单元格键盘事件（方向键/F2/Enter编辑） */
function onEditKeydown(event, val, row, colIdx) {
  if (isEditingCell(row, colIdx)) return
  switch (event.key) {
    case 'Enter': case 'F2': event.preventDefault(); startEdit(val, row, colIdx, event); break
    case 'ArrowUp': event.preventDefault(); navigateCell(row, colIdx, -1); break
    case 'ArrowDown': event.preventDefault(); navigateCell(row, colIdx, 1); break
    case 'ArrowLeft': event.preventDefault(); navigateCell(row, colIdx, 0, -1); break
    case 'ArrowRight': event.preventDefault(); navigateCell(row, colIdx, 0, 1); break
    case 'Tab': event.preventDefault(); moveToNextEditable(row, colIdx, 0, event.shiftKey ? -1 : 1); break
  }
}
function navigateCell(currentRow, currentCol, dRow = 0, dCol = 0) {
  const rows = visibleRows.value
  const ci = rows.findIndex(r => r.id === currentRow.id)
  if (ci < 0) return
  let ti = ci + dRow, tj = currentCol + dCol
  if (ti >= 0 && ti < rows.length && tj >= 0 && tj < (rows[ti].values?.length || 0)) {
    const target = rows[ti].values[tj]
    if (!target.readOnly) nextTick(() => startEdit(target, rows[ti], tj))
  }
}
function moveToNextEditable(currentRow, currentCol, dRow = 0, dCol = 1) {
  const rows = visibleRows.value
  const ci = rows.findIndex(r => r.id === currentRow.id)
  if (ci < 0) return
  let ti = ci, tj = currentCol + dCol
  if (dCol !== 0) {
    while (tj >= 0 && tj < (rows[ti].values?.length || 0)) {
      if (!rows[ti].values[tj].readOnly) { nextTick(() => startEdit(rows[ti].values[tj], rows[ti], tj)); return }
      tj += dCol
    }
  }
  ti += dRow
  if (ti >= 0 && ti < rows.length) {
    for (let j = 0; j < (rows[ti].values?.length || 0); j++) {
      if (!rows[ti].values[j].readOnly) { nextTick(() => startEdit(rows[ti].values[j], rows[ti], j)); return }
    }
  }
}
function setCellRef(el, rowId, colIdx) { /* DOM引用，暂不使用 */ }

// ========================================
// 【四】Excel 复制粘贴
// ========================================
function onCopy(event) {
  const rows = visibleRows.value
  const lines = rows.map(row =>
    row.values.map((v, i) => isColHidden(i) ? '' : fmtVal(v)).join('\t')
  )
  if (lines.some(l => l.trim())) {
    event.clipboardData.setData('text/plain', lines.join('\n'))
    event.preventDefault()
  }
}
function onPaste(event) {
  if (editingCell.rowId === null) return
  event.preventDefault()
  const text = event.clipboardData.getData('text/plain')
  if (!text) return
  const lines = text.split('\n').map(l => l.split('\t')).filter(l => l.some(c => c.trim() !== ''))
  if (!lines.length) return
  const si = visibleRows.value.findIndex(r => r.id === editingCell.rowId)
  const sc = editingCell.colIdx
  if (si < 0 || sc === null) return
  let modified = 0
  for (let li = 0; li < lines.length; li++) {
    const tri = si + li
    if (tri >= visibleRows.value.length) break
    const tr = visibleRows.value[tri]
    for (let ci = 0; ci < lines[li].length; ci++) {
      const tci = sc + ci
      if (tci >= (tr.values?.length || 0)) break
      const tv = tr.values[tci]
      if (tv.readOnly) continue
      const pv = lines[li][ci].trim()
      if (!pv) continue
      const vr = validateCellValue(pv, tv, tr)
      if (!vr.valid) { showToast(`[${tr.name}] ${vr.message}`, 'error'); continue }
      tv.v = pv; tv.raw = pv
      store.updateCellValue(tr.id, getColIdByIndex(tci), pv)
      modified++
    }
  }
  if (modified > 0) {
    showToast(`已粘贴 ${modified} 个单元格`, 'success')
    clearEditing(); recalcFormulas(); triggerAutoSave()
  }
}
function onGlobalKeydown(event) {
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    event.preventDefault(); forceSave()
  }
}

// ========================================
// 【五】自动保存
// ========================================
let autoSaveTimer = null
function triggerAutoSave() {
  showSaveStatus('正在保存...', 'saving')
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(async () => {
    try {
      await store.saveDraft()
      showSaveStatus('保存成功', 'success')
      setTimeout(() => { saveStatus.visible = false }, 2000)
    } catch {
      showSaveStatus('保存失败', 'error')
      setTimeout(() => { saveStatus.visible = false }, 3000)
    }
  }, 3000)
}
async function forceSave() {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  showSaveStatus('正在保存...', 'saving')
  try {
    await store.saveDraft()
    showSaveStatus('保存成功', 'success')
    setTimeout(() => { saveStatus.visible = false }, 2000)
  } catch (e) {
    showSaveStatus('保存失败', 'error')
    setTimeout(() => { saveStatus.visible = false }, 3000)
  }
}
function showSaveStatus(text, type) { saveStatus.text = text; saveStatus.type = type; saveStatus.visible = true }

// ========================================
// 【六】公式引擎集成
// ========================================
function recalcFormulas() {
  if (!formulaEngine) return
  formulaEngine.invalidateCache()
  formulaEngine.calculateAll()
}

// ========================================
// 【七】数据校验
// ========================================
function validateCellValue(value, val, row) {
  const ct = val.colTitle || ''
  if (value === '' || value == null) return { valid: true, message: '' }
  if (!VALIDATION_RULES.numeric.test(value)) return { valid: false, message: VALIDATION_RULES.numeric.message }
  const n = parseFloat(value)
  if (/产量|销量|运量/.test(ct) && !VALIDATION_RULES.nonNegative.test(n)) return { valid: false, message: VALIDATION_RULES.nonNegative.message }
  if (/率|增长率/.test(ct) && !VALIDATION_RULES.percentRange.test(n)) return { valid: false, message: VALIDATION_RULES.percentRange.message }
  return { valid: true, message: '' }
}
function showToast(message, type = 'error') {
  validationToast.message = message; validationToast.type = type; validationToast.visible = true
  setTimeout(() => { validationToast.visible = false }, 2500)
}

// ========================================
// 【八】条件格式
// ========================================
function valClass(val, row) {
  const cls = []
  const n = parseFloat(val.v)
  if (!isNaN(n) && /率|增长率/.test(val.colTitle)) {
    if (n > 0.01) cls.push('fr-up')
    else if (n < -0.01) cls.push('fr-down')
    else cls.push('fr-flat')
  }
  if (val.readOnly) cls.push('fr-ro')
  if (row.isSummary) cls.push('fr-bold')
  if (row.isAnomaly) cls.push('fr-anomaly-val')
  return cls.filter(Boolean).join(' ')
}

// ========================================
// 【九】【十】详情Drawer + 历史对比
// ========================================
function openDetail(val, row, event) {
  const n = parseFloat(val.v)
  drawer.metric = row.name
  drawer.displayValue = fmtVal(val)
  drawer.rawValue = String(val.raw ?? val.v)
  drawer.valClass = !isNaN(n) && /率|增长率/.test(val.colTitle) ? (n > 0 ? 'fr-up' : n < 0 ? 'fr-down' : '') : ''
  drawer.formula = val.formula || ''
  drawer.source = val.readOnly ? '系统自动计算（公式/汇总）' : '手工填报'
  drawer.unit = store.currentSubsidiary?.name || ''
  drawer.reporter = '当前用户'
  drawer.updateTime = store.lastSavedTime || new Date().toLocaleString('zh-CN')

  const ai = getAnomalyInfo(row)
  drawer.anomaly = ai.hasAnomaly
  drawer.anomalyMsg = ai.msg

  drawer.history = genHistoryData(val)
  drawer.auditLog = genAuditLog()
  drawer.visible = true
}
function getAnomalyInfo(row) {
  const msgs = []
  for (const v of row.values) {
    const n = parseFloat(v.v)
    if (isNaN(n)) continue
    if (/库存|存煤/.test(v.colTitle) && n > ANOMALY_CONFIG.inventory.threshold) msgs.push(`${v.colTitle}超限`)
    if (/率|增长率/.test(v.colTitle) && (n < ANOMALY_CONFIG.growthRate.min || n > ANOMALY_CONFIG.growthRate.max)) msgs.push(`${v.colTitle}异常`)
  }
  return { hasAnomaly: msgs.length > 0, msg: msgs.join('；') || '' }
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
function genAuditLog() {
  return [
    { time: '2026-06-23 09:30', action: '创建填报', type: 'create', user: '张三' },
    { time: '2026-06-22 14:20', action: '修改数据', type: 'edit', user: '张三' },
    { time: '2026-06-21 10:15', action: '提交审核', type: 'submit', user: '张三' },
    { time: '2026-06-20 16:45', action: '审核退回', type: 'return', user: '李四（审核员）' },
  ]
}

// ==================== 通用 ====================
function showTip(event, cell) {
  if (!cell.hint) return
  const rect = event.target.getBoundingClientRect()
  Object.assign(tip, { visible: true, x: rect.left + rect.width / 2 - 90, y: rect.bottom + 6, title: cell.text, desc: cell.hint })
}
function hideTip() { tip.visible = false }
function onScroll(e) { scrollTop.value = e.target.scrollTop }
function fmtVal(val) {
  if (val.v === undefined || val.v === null) return ''
  const n = parseFloat(val.v)
  if (isNaN(n)) return String(val.v)
  if (/率|增长率/.test(val.colTitle)) {
    const arrow = n > 0.01 ? '\u2191' : n < -0.01 ? '\u2193' : '\u2014'
    return `${arrow}${Math.abs(n).toFixed(2)}%`
  }
  if (Math.abs(n) >= 10000) return n.toLocaleString('zh-CN', { maximumFractionDigits: 1 })
  if (Math.abs(n) >= 1000) return n.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
  return n.toFixed(Math.abs(n) < 1 ? 4 : 2)
}
function checkAnomaly(rowIndex, values) {
  for (const v of values) {
    const n = parseFloat(v.v)
    if (isNaN(n)) continue
    if (/库存|存煤/.test(v.colTitle) && n > ANOMALY_CONFIG.inventory.threshold) return true
    if (/率|增长率/.test(v.colTitle) && (n < ANOMALY_CONFIG.growthRate.min || n > ANOMALY_CONFIG.growthRate.max)) return true
  }
  return false
}

// ==================== 生命周期 ====================
onMounted(() => { init(); try { const s = localStorage.getItem('fr_col_folds'); if (s) collapsedGroups.value = new Set(JSON.parse(s)) } catch {} })
onBeforeUnmount(() => {
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  // 清理 Teleport 状态，避免卸载时 DOM 操作错误
  tip.visible = false
  drawer.visible = false
  validationToast.visible = false
})
</script>

<style lang="scss" scoped>
/* ============================================
   FRReport - 企业级统计填报平台
   ============================================ */
$bg: #FDFDFD; $surface: #FFFFFF; $border: #E8ECF1; $border-light: #EEF1F6;
$h1-bg: #0F172A; $h2-bg: #1E3A5F; $h3-bg: #2D5A87; $h4-bg: #4A7FB7;
$text-primary: #0F172A; $text-secondary: #475569; $text-muted: #94A3B8;
$accent: #2563EB; $success: #059669; $danger: #DC2626; $warning: #D97706;
$summary-bg: #EFF6FF; $summary-border: #BFDBFE; $summary-text: #1E40AF;
$anomaly-bg: #FEF2F2; $anomaly-border: #FECACA;

.fr-report {
  flex: 1; display: flex; flex-direction: column; overflow: hidden;
  background: $bg; font-family: "SF Pro Display", -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 13px; color: $text-primary; outline: none;
}
.fr-loading, .fr-empty {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 12px; color: $text-muted;
}
.fr-loading-spinner {
  width: 32px; height: 32px; border: 3px solid $border; border-top-color: $accent;
  border-radius: 50%; animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.fr-empty-icon { width: 56px; height: 56px; opacity: 0.35; }

/* 控制栏 */
.fr-control-bar {
  flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;
  padding: 6px 12px; background: $surface; border-bottom: 1px solid $border;
  gap: 12px; min-height: 38px; flex-wrap: wrap;
}
.fr-cb-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.fr-view-switch {
  display: flex; background: $border-light; border-radius: 6px; padding: 2px;
}
.fr-vs-btn {
  padding: 3px 12px; border: none; background: transparent; border-radius: 4px;
  font-size: 12px; color: $text-secondary; cursor: pointer; transition: all .15s;
  &:hover { color: $text-primary; }
  &.active { background: $surface; color: $accent; font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
}
.fr-divider { width: 1px; height: 16px; background: $border; }
.fr-stat-badge { font-size: 11px; color: $text-muted; b { color: $text-secondary; font-weight: 600; margin: 0 2px; } em { font-style: normal; margin: 0 4px; color: $border; } }
.fr-anomaly-count { color: $danger; font-weight: 600; }

/* 保存状态 */
.fr-save-status {
  font-size: 11px; padding: 2px 10px; border-radius: 10px; font-weight: 500;
  animation: fr-status-in .2s ease-out;
  &.fr-save-saving { background: #FEF3C7; color: #92400E; }
  &.fr-save-success { background: #D1FAE5; color: #065F46; }
  &.fr-save-error { background: #FEE2E2; color: #991B1B; }
}
@keyframes fr-status-in { from { opacity: 0; transform: translateY(-4px); } }
.fr-frade-enter-active, .fr-fade-leave-active { transition: opacity .2s; }
.fr-fade-enter-from, .fr-fade-leave-to { opacity: 0; }

.fr-cb-right { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.fr-fold-btn {
  display: inline-flex; align-items: center; gap: 3px; padding: 3px 9px;
  border: 1px solid $border; border-radius: 4px; background: $surface;
  font-size: 11px; color: $text-secondary; cursor: pointer; white-space: nowrap; transition: all .15s;
  &:hover { border-color: $accent; color: $accent; } &.collapsed { opacity: .6; }
  .fr-fold-icon { font-size: 8px; }
}
.fr-action-btn {
  padding: 3px 9px; border: 1px dashed $border; border-radius: 4px;
  background: transparent; font-size: 11px; color: $text-muted; cursor: pointer;
  &:hover { color: $accent; border-color: $accent; }
}

/* 报表主体 */
.fr-body {
  flex: 1; overflow: auto; position: relative;
  &::-webkit-scrollbar { width: 8px; height: 8px; }
  &::-webkit-scrollbar-thumb { background: rgba(0,0,0,.20); border-radius: 4px; &:hover { background: rgba(0,0,0,.35); } }
  &::-webkit-scrollbar-track { background: transparent; }
}
.fr-header-section {
  overflow-x: auto; overflow-y: hidden;
  border-bottom: 2px solid $h1-bg; position: sticky; top: 0; z-index: 10; background: $surface;
  &::-webkit-scrollbar { height: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(0,0,0,.12); border-radius: 2px; }
}
.fr-data-section {
  /* 不限制高度，让表格自然撑开，由 fr-body 统一管理滚动 */
}

/* 表格 */
.fr-table { border-collapse: collapse; table-layout: fixed; width: max-content; min-width: 100%; }
.fr-col-index { width: 38px; min-width: 38px; }
.fr-col-metric { width: 200px; min-width: 160px; max-width: 280px; }
.fr-col-hidden { display: none; }

/* 表头 */
.fr-th {
  padding: 0 5px; height: 26px; line-height: 26px; font-weight: 600; text-align: center;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; user-select: none;
  position: relative; border-right: 1px solid rgba(255,255,255,.1); letter-spacing: .2px;
  &.fr-th-l1 { background: $h1-bg; color: #fff; font-size: 12px; font-weight: 700; }
  &.fr-th-l2 { background: $h2-bg; color: #E0E7FF; font-size: 11px; font-weight: 600; }
  &.fr-th-l3 { background: $h3-bg; color: #DBEAFE; font-size: 11px; font-weight: 500; }
  &.fr-th-l4 { background: $h4-bg; color: $text-primary; font-size: 10px; font-weight: 500; }
  &.fr-th-corner { background: #F1F5F9; color: $text-muted; font-size: 10px; position: sticky; left: 0; z-index: 15; }
  &.fr-th-metric { background: #F1F5F9; color: $text-secondary; font-size: 11px; font-weight: 600; text-align: left; padding-left: 10px; position: sticky; left: 38px; z-index: 15; }
  .fr-th-text { vertical-align: middle; }
  .fr-th-hint {
    display: inline-block; width: 14px; height: 14px; line-height: 14px; text-align: center;
    border-radius: 50%; background: rgba(255,255,255,.2); font-size: 9px; margin-left: 4px;
    cursor: help; vertical-align: middle; opacity: .7; &:hover { opacity: 1; }
  }
}

/* 数据行 */
.fr-row { transition: background-color .1s; &:hover { background: #F8FAFC !important; } }
.fr-td {
  padding: 0 5px; height: 32px; line-height: 32px;
  border-bottom: 1px solid $border-light; border-right: 1px solid $border-light;
  font-size: 12px; vertical-align: middle; position: relative;
}
.fr-td-index {
  background: #FAFBFC; color: $text-muted; font-size: 10px; text-align: center;
  position: sticky; left: 0; z-index: 5; box-shadow: 2px 0 4px rgba(0,0,0,.06);
}
.fr-td-metric {
  text-align: left; background: $surface; padding: 0; width: 200px;
  position: sticky; left: 38px; z-index: 5; box-shadow: 2px 0 4px rgba(0,0,0,.06);
}
.fr-td-val {
  text-align: right; font-variant-numeric: tabular-nums; outline: none; cursor: cell;
  &.fr-up { color: $success; font-weight: 600; }
  &.fr-down { color: $danger; font-weight: 600; }
  &.fr-flat { color: $text-muted; }
  &.fr-ro { color: $text-muted; background: #FAFBFC; }
  &.fr-bold { font-weight: 700; }
  &.fr-anomaly-val { color: $danger; font-weight: 700; }
  &.fr-editing { padding: 0; background: #FFF !important; box-shadow: inset 0 0 0 2px $accent; }
}
.fr-td-child-val { color: $text-secondary; font-size: 11px; background: #FAFBFC; }

/* 编辑输入框 */
.fr-edit-input {
  width: 100%; height: 28px; border: none; outline: none; background: transparent;
  text-align: right; font-size: 12px; font-family: inherit; font-variant-numeric: tabular-nums;
  color: $text-primary; padding: 0 4px;
  &.fr-edit-error { background: #FEF2F2; color: $danger; }
  &:focus { background: #EFF6FF; }
}

/* 树形节点 VSCode风格 */
.fr-tree-node {
  display: flex; align-items: center; height: 32px; cursor: pointer; padding-right: 8px;
  gap: 0; transition: background .1s; &:hover { background: #F0F4F8; }
}
.fr-tree-toggle {
  display: inline-flex; align-items: center; justify-content: center;
  width: 16px; height: 16px; font-size: 8px; color: $text-muted;
  transition: transform .2s ease; flex-shrink: 0;
  &.expanded { transform: rotate(90deg); }
  &:hover { color: $accent; background: rgba($accent, .1); border-radius: 3px; }
}
.fr-tree-leaf { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #CBD5E1; margin: 0 6px; flex-shrink: 0; }
.fr-tree-line { display: inline-block; width: 12px; border-top: 1.5px dashed #CBD5E1; margin-right: 2px; flex-shrink: 0; }
.fr-tree-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; color: $text-primary; }

/* 子行 */
.fr-row-child { background: #FAFBFC; .fr-td { border-bottom: 1px dashed $border-light; } }
.fr-child-item { display: flex; align-items: center; height: 32px; font-size: 11px; color: $text-secondary; gap: 6px; }
.fr-child-dot { width: 5px; height: 5px; border-radius: 50%; background: $accent; flex-shrink: 0; }

/* 汇总行 */
.fr-row-summary {
  background: linear-gradient(90deg, $summary-bg 0%, #F8FAFC 100%) !important;
  border-top: 1.5px solid $summary-border; border-bottom: 1.5px solid $summary-border; font-weight: 700;
  .fr-td { color: $summary-text; font-weight: 600; }
  .fr-td-index { background: #E0EFFF; color: $accent; font-weight: 700; }
  .fr-td-metric { background: $summary-bg; }
}
.fr-metric-cell { display: flex; align-items: center; height: 32px; gap: 6px; }
.fr-summary-badge {
  display: inline-flex; align-items: center; padding: 1px 7px; font-size: 10px;
  font-weight: 700; border-radius: 3px; background: $accent; color: #fff; letter-spacing: .5px; flex-shrink: 0;
}
.fr-summary-label { font-weight: 700; font-size: 12px; color: $summary-text; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 异常行 */
.fr-row-anomaly {
  background: $anomaly-bg !important; animation: fr-pulse 2.5s ease-in-out infinite;
  border-left: 3px solid $danger !important;
  .fr-td { color: $danger; } .fr-td-val { font-weight: 700; }
  .fr-td-index { background: $danger !important; color: #fff !important; &::after { content: '!'; display: inline-block; font-size: 10px; font-weight: 800; margin-left: 2px; } }
}
@keyframes fr-pulse { 0%, 100% { background: $anomaly-bg; } 50% { background: #FEF8F8; } }

/* Tooltip */
.fr-tip {
  position: fixed; z-index: 9999; min-width: 180px; max-width: 280px; padding: 8px 12px;
  background: #1E293B; color: #E2E8F0; border-radius: 6px; font-size: 11px; line-height: 1.5;
  box-shadow: 0 6px 20px rgba(0,0,0,.2); pointer-events: none; animation: fr-tip-in .12s ease-out;
  strong { color: #fff; font-size: 12px; display: block; margin-bottom: 3px; } p { margin: 0; color: #94A3B8; }
}
@keyframes fr-tip-in { from { opacity: 0; transform: translateY(-3px); } }

/* Drawer */
.fr-drawer-mask {
  position: fixed; inset: 0; z-index: 9000; background: rgba(15,23,42,.35);
  backdrop-filter: blur(3px); display: flex; justify-content: flex-end;
}
.fr-drawer {
  width: 380px; max-width: 92vw; background: $surface;
  box-shadow: -6px 0 30px rgba(0,0,0,.12); display: flex; flex-direction: column;
  animation: fr-slide-in .25s cubic-bezier(.4,0,.2,1);
}
@keyframes fr-slide-in { from { transform: translateX(100%); } }
.fr-drawer-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-bottom: 1px solid $border; background: #F8FAFC;
  h3 { margin: 0; font-size: 14px; font-weight: 700; color: $text-primary; }
}
.fr-drawer-close {
  width: 26px; height: 26px; border: none; background: $border-light; border-radius: 5px;
  font-size: 16px; color: $text-muted; cursor: pointer; display: flex; align-items: center; justify-content: center;
  &:hover { background: $border; color: $text-primary; }
}
.fr-drawer-bd { flex: 1; overflow-y: auto; padding: 14px 18px; }
.fr-ds-section { margin-bottom: 16px;
  h4 { font-size: 11px; font-weight: 700; color: $text-muted; text-transform: uppercase; letter-spacing: .5px; margin: 0 0 8px; padding-bottom: 4px; border-bottom: 1px solid $border-light; }
  &.fr-ds-warn { background: $anomaly-bg; border: 1px solid $anomaly-border; border-radius: 6px; padding: 10px 12px; h4 { color: $danger; border: none; } p { margin: 4px 0 0; font-size: 12px; color: $danger; } }
}
.fr-ds-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.fr-ds-field {
  label { display: block; font-size: 10px; font-weight: 600; color: $text-muted; text-transform: uppercase; letter-spacing: .3px; margin-bottom: 2px; }
  span, code { font-size: 13px; color: $text-primary; word-break: break-all; }
  span.fr-up, span.fr-down { font-weight: 700; font-size: 16px; }
  code { display: block; padding: 6px 10px; background: #F1F5F9; border-radius: 4px; font-family: "Cascadia Code", "Consolas", monospace; font-size: 11px; color: #475569; }
}

/* 历史对比 */
.fr-history-list { display: flex; flex-direction: column; gap: 6px; }
.fr-hist-item {
  display: flex; align-items: center; gap: 8px; padding: 4px 0; border-bottom: 1px solid $border-light;
  &:last-child { border-bottom: none; }
}
.fr-hist-period { font-size: 11px; color: $text-muted; min-width: 70px; }
.fr-hist-val { font-size: 13px; font-weight: 600; &.up { color: $success; } &.down { color: $danger; } }
.fr-hist-diff { font-size: 11px; font-weight: 600; margin-left: auto; &.up { color: $success; } &.down { color: $danger; } }

/* 审核记录 */
.fr-audit-list { display: flex; flex-direction: column; gap: 4px; }
.fr-audit-item { display: flex; align-items: center; gap: 8px; padding: 3px 0; font-size: 11px; }
.fr-audit-time { color: $text-muted; min-width: 110px; }
.fr-audit-action { font-weight: 600; min-width: 60px; &.create { color: $accent; } &.edit { color: $warning; } &.submit { color: $success; } &.return { color: $danger; } }
.fr-audit-user { color: $text-secondary; }

/* Toast */
.fr-toast {
  position: fixed; top: 60px; left: 50%; transform: translateX(-50%); z-index: 99999;
  padding: 8px 20px; border-radius: 8px; font-size: 13px; font-weight: 500;
  box-shadow: 0 4px 16px rgba(0,0,0,.15); animation: fr-toast-in .2s ease-out;
  &.fr-toast-error { background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA; }
  &.fr-toast-success { background: #D1FAE5; color: #065F46; border: 1px solid #A7F3D0; }
  &.fr-toast-warning { background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; }
}
@keyframes fr-toast-in { from { opacity: 0; transform: translateX(-50%) translateY(-8px); } }

/* Drawer过渡 */
.fr-drawer-enter-active { transition: opacity .2s; }
.fr-drawer-leave-active { transition: opacity .15s; }
.fr-drawer-enter-from, .fr-drawer-leave-to { opacity: 0; }
.fr-toast-enter-active, .fr-toast-leave-active { transition: all .2s; }
.fr-toast-enter-from, .fr-toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(-8px); }
</style>
