<template>
  <div class="fr-report" ref="containerRef" tabindex="0" @keydown="onGlobalKeydown" @copy="onCopy" @paste="onPaste">

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
      <button class="fr-action-btn" style="margin-top: 16px" @click="loadReport(templateId)">重试</button>
    </div>

    <!-- 报表主体 -->
    <template v-if="config && !loading && !error">

      <!-- 顶部控制栏 -->
      <header class="fr-control-bar">
        <div class="fr-cb-left">
          <!-- 模板信息 -->
          <span class="fr-template-badge">
            {{ currentTemplate?.name || '报表' }}
            <em v-if="currentTemplate?.version">V{{ currentTemplate.version }}</em>
            <strong v-if="useV2" class="fr-v2-badge" title="JSON驱动模板">JSON</strong>
          </span>

          <!-- ✅ 组织选择器（只读展示） -->
          <div class="fr-readonly-field">
            <label class="fr-readonly-label">组织：</label>
            <span class="fr-readonly-value">{{ selectedOrgName || '未选择' }}</span>
          </div>

          <!-- ✅ 填报周期选择器（只读展示） -->
          <div class="fr-readonly-field">
            <label class="fr-readonly-label">周期：</label>
            <span class="fr-readonly-value">{{ selectedPeriodLabel || '未选择' }}</span>
          </div>

          <span class="fr-divider"></span>

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
          <span class="fr-divider"></span>
          <button class="fr-action-btn fr-fx-btn" :disabled="!selectedCell" @click="openFormulaForSelected" title="为当前单元格添加/编辑公式">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><text x="1" y="13" font-size="12" font-weight="bold" font-style="italic" fill="#7C3AED">fx</text></svg>
            添加公式
          </button>
          <span class="fr-divider"></span>
          <button class="fr-action-btn fr-add-row-btn" @click="addNewRow" title="在末尾新增一行">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            新增行
          </button>
          <span class="fr-divider"></span>
          <button class="fr-action-btn fr-save-btn" @click="forceSave" title="手动保存 (Ctrl+S)">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M13.5 2.5h-11L2 3v10l.5.5h11l.5-.5V3l-.5-.5z" stroke="currentColor" stroke-width="1.2" fill="none"/>
              <path d="M5 6h6M5 9h4" stroke="currentColor" stroke-width="1.2"/>
            </svg>
            保存
          </button>
          <button class="fr-action-btn fr-publish-btn" @click="forceSaveAndPublish" title="发布模板（强制保存后发布）">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 1l2 5h5l-4 3 1.5 5L8 11 3.5 14 5 9 1 6h5z" fill="currentColor"/>
            </svg>
            发布
          </button>
          <!-- ✅ 提交审核按钮 -->
          <button class="fr-action-btn fr-submit-btn" :disabled="!selectedOrgId || !selectedPeriod" @click="submitForReview" title="提交审核">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 2L2 7v2h12V7L8 2z" stroke="currentColor" stroke-width="1.2" fill="none"/>
              <path d="M4 11h8M5 13h6" stroke="currentColor" stroke-width="1.2"/>
            </svg>
            提交审核
          </button>
        </div>
      </header>

      <!-- 报表主体区域 -->
      <main class="fr-body" ref="bodyRef" @scroll="onScroll">

        <!-- 多级表头（sticky冻结） -->
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
                    class="fr-td fr-td-val" :class="[valClass(val, row), conditionalFormatClass(val, row)]"
                    :style="conditionalFormatStyle(val, row)"
                    @dblclick="startEdit(val, row, vi, $event)" @contextmenu.prevent="openDetail(val, row, $event)">
                    {{ fmtVal(val) }}
                    <button v-if="!row.isSummary" class="fr-cell-fx" title="添加公式" @click.stop="openFormulaEditor(val, row, vi)">fx</button>
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
                    class="fr-td fr-td-val" :class="[valClass(val, row), isEditingCell(row, vi) ? 'fr-editing' : '', conditionalFormatClass(val, row)]"
                    :style="conditionalFormatStyle(val, row)"
                    :ref="el => setCellRef(el, row.id, vi)"
                    @dblclick="startEdit(val, row, vi, $event)"
                    @keydown="onEditKeydown($event, val, row, vi)"
                    @contextmenu.prevent="openDetail(val, row, $event)">
                    <input v-if="isEditingCell(row, vi)" class="fr-edit-input" v-model="editValue"
                      :class="{ 'fr-edit-error': editError }" type="text"
                      @blur="commitEdit(val, row, vi, $event)"
                      @keydown="onEditInputKeydown($event, val, row, vi)" autofocus />
                    <template v-else>
                      {{ fmtVal(val) }}
                      <button class="fr-cell-fx" title="添加公式" @click.stop="openFormulaEditor(val, row, vi)">fx</button>
                    </template>
                  </td>
                </tr>

                <!-- 子行 -->
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
                <div class="fr-ds-field"><label>模板ID</label><span>{{ drawer.templateId || '-' }}</span></div>
              </div></section>
              <section class="fr-ds-section"><h4>计算信息</h4><div class="fr-ds-grid">
                <div class="fr-ds-field"><label>计算公式</label>
                  <code>{{ drawer.formula || '-' }}</code>
                  <button v-if="drawer._canEditFormula" class="fr-drawer-action" @click="openFormulaEditorFromDrawer">编辑公式</button>
                </div>
                <div class="fr-ds-field"><label>数据来源</label><span>{{ drawer.source || '-' }}</span></div>
                <div class="fr-ds-field"><label>校验结果</label><span :class="drawer.validationOk ? 'fr-up' : 'fr-down'">{{ drawer.validationMsg || '-' }}</span></div>
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
            </div>
          </aside>
        </div>
      </Transition>
    </Teleport>

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
 * ReportFill - 动态报表填报页面
 *
 * 通过路由参数 templateId 动态加载任意报表模板。
 * 所有报表共用此页面，无需为每张报表创建独立组件。
 *
 * 路由：/report/:templateId
 * 示例：
 *   /report/1001 → 煤炭生产销售库存表
 *   /report/1002 → 经营指标月报
 *   /report/1003 → 安全生产统计表
 */

import { ref, computed, watch, nextTick, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useReportStore } from '@/stores/reportStore.js'
import { TemplateParser, FormulaEngine, AggregateEngine } from '@/services/templateEngine.js'
import { ValidationEngine } from '@/services/engines/ValidationEngine.js'
import { ConditionalFormatEngine } from '@/services/engines/ConditionalFormatEngine.js'
import { PermissionEngine } from '@/services/engines/PermissionEngine.js'
import { ReportFactory } from '@/services/ReportFactory.js'
import { TemplateManager } from '@/services/TemplateManager.js'
import { initTemplates } from '@/mock/templates.js'
// V2 JSON模板支持
import { getV2Template, getAllV2Templates, TEMPLATES_V2 } from '@/data/templates-v2.js'
import { ReportTemplateParser } from '@/services/TemplateParser.js'
import FormulaEditor from '@/components/FormulaEditor.vue'
import { getOrgTree } from '@/api/reportDesigner.js'

const route = useRoute()
const props = defineProps({
  templateId: { type: String, required: true }
})

const store = useReportStore()

// ==================== 核心实例 ====================
const config = ref(null)
let formulaEngine = null
let aggregateEngine = null
let validationEngine = null
let conditionalFormatEngine = null
let permissionEngine = null
let reportFactory = null

// ✅ 数据版本号 - 用于触发响应式更新（新增行等操作时递增）
const dataVersion = ref(0)

// ✅ 组织和周期选择器（从路由参数获取，只读展示）
const selectedOrgId = ref('')              // 当前选中的组织ID
const selectedPeriod = ref('')             // 当前选中的填报周期

// ✅ 组织和周期的显示名称（计算属性）
const selectedOrgName = computed(() => {
  if (!selectedOrgId.value) return ''
  const org = orgList.value.find(o => o.id === selectedOrgId.value)
  return org ? org.name.trim() : ''
})

const selectedPeriodLabel = computed(() => {
  if (!selectedPeriod.value) return ''
  const period = periodList.value.find(p => p.value === selectedPeriod.value)
  return period ? period.label : ''
})

// 组织列表（从API获取）
const orgList = ref([])
const orgLoading = ref(false)

/**
 * ✅ 从后端加载组织树并转换为扁平列表
 */
async function loadOrgList() {
  if (orgLoading.value) return
  orgLoading.value = true
  
  try {
    console.log('[Org] 正在加载组织列表...')
    const res = await getOrgTree()
    console.log('[Org] API响应:', res)
    
    // 兼容多种数据格式：res.data / res 本身 / 数组
    let treeData = []
    if (Array.isArray(res)) {
      treeData = res
    } else if (res && Array.isArray(res.data)) {
      treeData = res.data
    }
    
    // 递归将树结构转换为扁平列表
    function flattenTree(nodes, level = 0) {
      const list = []
      for (const node of nodes || []) {
        if (node.id !== undefined && node.id !== null) {
          list.push({
            id: String(node.id),
            name: `${'　'.repeat(level)}${node.orgName || node.name || '未命名'}`,
            code: node.orgCode || node.code || '',
            level,
            orgType: node.orgType || 0
          })
        }
        // 递归处理子节点
        if (node.children && node.children.length > 0) {
          list.push(...flattenTree(node.children, level + 1))
        }
      }
      return list
    }
    
    orgList.value = flattenTree(treeData)
    console.log(`[Org] ✅ 加载完成: ${orgList.value.length} 个组织`)
    
    // ✅ 从路由参数获取组织和周期值
    const routeOrgId = route.query.orgId
    const routePeriod = route.query.period
    
    if (routeOrgId) {
      selectedOrgId.value = routeOrgId
      console.log(`[Org] ✅ 从路由参数获取组织: ${routeOrgId}`)
    } else {
      console.warn('[Org] ⚠️ 路由参数中未找到组织ID，使用默认值')
      // 如果没有路由参数，使用第一个子公司作为默认值
      if (orgList.value.length > 0) {
        const firstSubsidiary = orgList.value.find(org => org.orgType === 2)
        if (firstSubsidiary) {
          selectedOrgId.value = firstSubsidiary.id
          console.log(`[Org] ✅ 自动选中第一个子公司: ${firstSubsidiary.name}`)
        } else {
          selectedOrgId.value = orgList.value[0].id
          console.log(`[Org] ✅ 自动选中第一个组织: ${orgList.value[0].name}`)
        }
      }
    }
    
    if (routePeriod) {
      selectedPeriod.value = routePeriod
      console.log(`[Period] ✅ 从路由参数获取周期: ${routePeriod}`)
    } else {
      console.warn('[Period] ⚠️ 路由参数中未找到周期，使用当前月份')
      // 如果没有路由参数，使用当前月份作为默认值
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1
      selectedPeriod.value = `${year}${String(month).padStart(2, '0')}`
      console.log(`[Period] ✅ 自动选中当前月份: ${year}年${month}月`)
    }
    
    // ✅ 验证组织和周期是否有效
    if (!selectedOrgId.value || !selectedPeriod.value) {
      console.error('[Init] ❌ 组织或周期未设置，无法加载报表数据')
    } else {
      console.log(`[Init] ✅ 组织和周期已设置: 组织=${selectedOrgId.value}, 周期=${selectedPeriod.value}`)
    }
  } catch (err) {
    console.warn('[Org] ⚠️ 加载失败:', err.message)
    // 使用默认组织作为兜底
    orgList.value = [
      { id: '0', name: '默认组织' }
    ]
  } finally {
    orgLoading.value = false
  }
}

// 周期列表（动态生成最近12个月+4个季度）
const periodList = computed(() => {
  const periods = []
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  
  // 添加月度周期（最近6个月）
  for (let i = 0; i < 6; i++) {
    const m = month - i
    const y = year - Math.ceil((i + 1 - month) / 12)
    const actualMonth = ((m - 1) % 12 + 12) % 12 + 1
    const actualYear = m <= 0 ? year - 1 : year
    periods.push({
      value: `${actualYear}${String(actualMonth).padStart(2, '0')}`,
      label: `${actualYear}年${actualMonth}月`
    })
  }
  
  // 添加季度周期（最近4个季度）
  const currentQ = Math.ceil(month / 3)
  for (let i = 0; i < 4; i++) {
    const q = currentQ - i
    if (q > 0) {
      periods.push({ value: `${year}Q${q}`, label: `${year}年第${q}季度` })
    } else {
      periods.push({ value: `${year-1}Q${q+4}`, label: `${year-1}年第${q+4}季度` })
    }
  }
  
  return periods
})

// 当前加载的模板
const currentTemplate = ref(null)

// V2 JSON模板模式
const useV2 = ref(false)                    // 是否使用V2 JSON模板
const v2Parser = ref(null)                  // V2解析器实例
const v2TemplateCode = ref('RPT-COAL-001')  // 当前V2模板代码

// 加载状态
const loading = ref(true)
const loadingText = ref('正在初始化报表引擎...')
const error = ref('')

// ==================== DOM 引用 ====================
const containerRef = ref(null)
const bodyRef = ref(null)
const headerRef = ref(null)

// ==================== 视图模式 ====================
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
  anomaly: false, anomalyMsg: '', history: [], auditLog: [],
  templateId: '', validationOk: true, validationMsg: ''
})

// 校验 Toast
const validationToast = reactive({ visible: false, message: '', type: 'error' })

// 自动保存状态
const saveStatus = reactive({ visible: false, text: '', type: 'saving' })

// 编辑系统
const editingCell = reactive({ rowId: null, colIdx: null })
const editValue = ref('')
const editError = ref(false)

// 公式编辑器
const formulaEditor = reactive({
  visible: false,
  cellInfo: '',
  initialValue: '',
  fields: [],
  rowFields: [],
  validFieldIds: [],
  targetCell: null // { rowIdx, colIdx, val, row }
})

/** 已保存的公式列表（结构化存储，用于管理面板和后端传输） */
const savedFormulas = reactive([])

// ✅ 条件格式规则列表
const conditionalFormats = ref([])
const appliedFormats = reactive({}) // 已应用的条件格式 { "row-col": { bg, color, fontWeight } }

// ✅ 校验规则列表
const validationRules = ref([])
const validationErrors = reactive({}) // 校验错误 { "row-col": { message, type } }

// 当前选中单元格（用于工具栏"添加公式"按钮）
const selectedCell = reactive({ val: null, row: null, colIdx: null })

// 常量
const ROW_H = 32
const HEADER_H = 26

// 异常检测配置
const ANOMALY_CONFIG = {
  inventory: { threshold: 50000, label: '库存超限' },
  growthRate: { min: -20, max: 50, label: '增长率异常' },
}

// 校验规则
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
  // V2 模式：使用解析器的扁平行数据
  if (useV2.value && v2Parser.value) {
    return v2Parser.value.getFlatRows()
  }
  if (!currentTemplate.value?.getFlatRows) return []
  return currentTemplate.value.getFlatRows()
})

const headerRows = computed(() => {
  console.log('config', config.value)
  if (!config.value) return []
  const rows = []
  const maxLevel = config.value.frozenRowCount || 4

  for (let l = 0; l < maxLevel; l++) {
    const cells = []
    for (let c = 2; c < (config.value.columnData || []).length; c++) {
      const cell = config.value.cellData[`${l}-${c}`]

      // ✅ 只处理起始位置的单元格，跳过被合并的单元格
      if (cell && cell.isHeaderStart) {
        cells.push({
          text: cell.v,
          level: cell.headerLevel || Math.min(l + 1, 4),
          colIdx: c,
          colspan: cell.colSpan || 1,
          rowspan: cell.rowSpan || 1,
          hint: getMetricHint(cell.v)
        })
      }
      // ✅ 被合并的单元格不添加到 cells 数组中（由浏览器自动处理）
    }

    if (cells.length > 0) rows.push({ level: l, cells })
  }

  return rows
})

const dataColumns = computed(() => config.value ? config.value.columnData?.slice(2) || [] : [])
console.log('dataColumns', config.value)
const visibleColCount = computed(() => dataColumns.value.filter((_, i) => !isColHidden(i)).length)
const anomalyCount = computed(() => displayRows.value.filter(r => r.isAnomaly).length)
/** 可见行列表 */
const visibleRows = computed(() => {
  // ✅ 依赖 dataVersion - 当新增行等操作递增版本号时触发重新计算
  const _version = dataVersion.value
  const allRows = buildAllRows()
  const result = []
  for (const row of allRows) {
    if (viewMode.value === 'summary' && !row.isSummary) continue
    result.push(row)
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

/** 指标分组 */
const metricGroups = computed(() => {
  const rawCols = currentTemplate.value?.columnTree || currentTemplate.value?.columns || []
  const groups = []
  const seen = new Set()
  for (const col of rawCols) {
    if (!col.parentId && !seen.has(col.id)) {
      groups.push({ id: col.id, label: col.title })
      seen.add(col.id)
    }
  }
  return groups.slice(0, 6)
})

// 列折叠映射
const colIndexMap = computed(() => {
  const map = new Map()
  if (!currentTemplate.value?.columns) return map
  // 使用扁平化列列表（兼容树形结构）
  const flatCols = currentTemplate.value.getFlatColumns ? currentTemplate.value.getFlatColumns() : currentTemplate.value.columns
  flatCols.forEach((col, idx) => map.set(idx, col.id))
  return map
})
const colGroupMap = computed(() => {
  const map = new Map()
  const flatCols = currentTemplate.value?.getFlatColumns
    ? currentTemplate.value.getFlatColumns()
    : (currentTemplate.value?.columns || [])
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

// 指标说明
const METRIC_HINTS = {
  '本月': '当前统计周期的原始数据', '本月止累计': '年初至当前月的累计数值',
  '同比增量': '与上年同期相比的绝对差值', '同比增长率': '与上年同期相比的变化百分比',
  '环比增量': '与上一统计周期相比的绝对差值', '环比增长率': '与上一统计周期相比的变化百分比',
  '商品煤销量': '对外销售的商品煤总量', '原煤产量': '当月开采的原煤总量',
  '自用量': '企业内部消耗量', '存煤': '期末库存量',
  '火车运量': '铁路运输方式销量', '公路运量': '公路运输方式销量',
}
function getMetricHint(text) { return METRIC_HINTS[text] || null }

// ==================== 核心：加载报表 ====================

async function loadReport(templateId) {
  loading.value = true
  error.value = ''
  loadingText.value = `正在加载模板 ${templateId}...`

  try {
    // 检查是否为V2 JSON模板（优先使用V2）
    const v2Tpl = await getV2Template(templateId)
    console.log('[ReportLoad] V2模板查询结果:', templateId, v2Tpl ? '✅ 找到' : '❌ 未找到')

    if (v2Tpl) {
      // ========== V2 JSON 模板模式 ==========
      useV2.value = true
      v2TemplateCode.value = templateId
      loadingText.value = '正在解析JSON模板...'

      try {
        // 使用V2解析器
        const parser = new ReportTemplateParser()
        parser.load(v2Tpl).parse()
        v2Parser.value = parser

        // 将V2模板对象设置为currentTemplate（兼容现有逻辑）
        currentTemplate.value = parser.getTemplate()

        // 构建兼容的config结构
        config.value = buildConfigFromV2(parser)

        // ✅ 填充API返回的 cellData（之前填报的数据）
        if (v2Tpl.cellData) {
          populateCellDataFromApi(v2Tpl.cellData)
        }
      } catch (parseErr) {
        console.error('[ReportFill] V2模板解析失败:', parseErr)
        throw new Error(`V2模板解析错误: ${parseErr.message}`)
      }


    } else {
      // ========== V1 代码模板模式（原有逻辑） ==========
      useV2.value = false

      // 1. 初始化模板管理器 & 注册内置模板
      const tm = new TemplateManager()
      initTemplates(tm)

      // 2. 创建工厂并加载报表
      reportFactory = new ReportFactory({
        templateManager: tm,
        dataLoader: generateMockData
      })

      loadingText.value = `正在构建报表结构...`
      await nextTick()

      // 3. 获取模板对象
      let tpl = tm.get(templateId)
      if (!tpl) throw new Error(`模板不存在: ${templateId}，请检查模板配置`)

      // 4. 设置到本地状态
      currentTemplate.value = tpl

      // 5. 解析并渲染
      parseAndRender(tpl)
    }

    // 初始化子引擎
    initEngines(currentTemplate.value)

    // ✅ 加载条件格式规则
    await loadConditionalFormats(templateId)
    
    // ✅ 加载校验规则
    await loadValidationRules(templateId)

    loading.value = false
    console.log(`[ReportFill] 报表加载完成: ${currentTemplate.value.name} (${templateId})`)

  } catch (e) {
    error.value = e.message
    loading.value = false
    console.error('[ReportFill] 加载失败:', e)
  }
}

/**
 * ✅ 新增行功能
 * 在表格末尾动态添加一行
 */
function addNewRow() {
  if (!config.value) {
    showToast('请先加载报表模板', 'warning')
    return
  }

  const columns = config.value.columnData || []
  const dataCols = columns.slice(2) // 排除 # 和 指标列

  // 生成新行的唯一ID
  const newId = `row_${Date.now()}`
  const rowCount = (config.value.rows || []).length + 1

  // 创建新行数据
  const newRow = {
    id: newId,
    name: `新行${rowCount}`,
    depth: 0,
    isSummary: false,
    summaryType: '',
    values: dataCols.map((col, ci) => ({
      v: '',
      raw: '',
      readOnly: false,
      colIdx: ci,
      colTitle: col.title || '',
      formula: null,
      f: null
    }))
  }

  // 添加到 config.rows
  if (!config.value.rows) config.value.rows = []
  config.value.rows.push(newRow)

  // 计算实际行号（跳过冻结行）
  const frozenRows = config.value.frozenRowCount || 4
  const actualRowIdx = frozenRows + config.value.rows.length - 1

  // 添加到 cellData
  newRow.values.forEach((val, vi) => {
    const actualColIdx = vi + 2
    config.value.cellData[`${actualRowIdx}-${actualColIdx}`] = {
      v: '',
      raw: '',
      readOnly: false,
      f: null
    }
  })

  console.log('[addNewRow] 新增行成功:', {
    id: newId,
    name: newRow.name,
    totalRows: config.value.rows.length,
    actualRowIndex: actualRowIdx
  })

  // ✅ 递增版本号，触发 visibleRows 重新计算
  dataVersion.value++

  // 显示成功提示
  showToast(`已新增行：${newRow.name}`, 'success')

  // 滚动到新行
  nextTick(() => {
    if (bodyRef.value) {
      bodyRef.value.scrollTop = bodyRef.value.scrollHeight
    }
  })
}

/**
 * 从V2解析器构建兼容的config结构
 * 使V2模板能复用现有的渲染和编辑逻辑
 * 
 * ✅ 改造要点：
 * - 直接使用接口返回的真实业务ID（BIGINT），不再自己生成临时ID
 * - 如果接口返回的数据中没有 code，才生成业务编码（VARCHAR）
 * - 确保数据可以直接入库，符合数据库表结构要求
 */
function buildConfigFromV2(parser) {
  const template = parser.getTemplate()
  let flatRows = parser.getFlatRows()
  const leafCols = parser.getLeafColumns()

  console.log('[ReportFill] 行数:', flatRows.length, '列数:', leafCols.length)
  console.log('[ReportFill] flatRows数据:', flatRows.slice(0, 3))
  console.log('[ReportFill] leafCols数据:', leafCols.slice(0, 3))
  console.log('[ReportFill] columnTree数据:', template.columnTree)

  // ✅ 辅助函数：生成业务编码（如果接口没有返回code）
  function generateBusinessCode(strId, name) {
    // 示例：将 "r_raw" 转换为 "RAW"，"m_raw_coal" 转换为 "RAW_COAL"
    // 移除前缀（r_, m_, c_, ytd_, yoy_）
    let code = strId.replace(/^(r_|m_|c_|ytd_|yoy_|col_)/, '').toUpperCase()
    
    // 如果编码为空或太短，使用名称生成
    if (code.length < 2) {
      // 从中文名称生成拼音编码（简化版）
      const nameMap = {
        '原煤': 'RAW_COAL',
        '商品煤': 'COMMODITY_COAL',
        '自用量': 'SELF_USE',
        '库存量': 'INVENTORY',
        '合计': 'TOTAL',
        '小计': 'SUBTOTAL',
        '本月': 'MONTH',
        '本月止累计': 'YTD',
        '同比': 'YOY',
        '环比': 'MOM'
      }
      code = nameMap[name] || name.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').toUpperCase() || strId.toUpperCase()
    }
    
    return code
  }

  // ✅ 构建行数据（直接使用接口返回的真实业务ID）
  const rows = flatRows.map((row, ri) => {
    // ✅ 直接使用接口返回的真实业务ID（BIGINT）
    const businessId = row.id  // ✅ 使用接口返回的真实ID
    
    // ✅ 如果接口返回了 code，直接使用；否则生成业务编码
    const businessCode = row.code || generateBusinessCode(row.id, row.name)
    
    console.log(`[buildConfigFromV2] 行 ${ri}: 接口ID=${row.id}, 使用ID=${businessId}, Code=${businessCode}`)
    
    return {
      id: businessId,              // ✅ BIGINT - 真实业务ID（来自接口）
      code: businessCode,          // ✅ VARCHAR - 业务编码
      name: row.name,
      depth: row.level || 0,
      isSummary: !!row.isSummary,
      summaryType: row.summaryType || '',
      values: leafCols.map((col, ci) => {
        const cell = parser.getCell(ri, ci)
        return {
          v: '',
          raw: '',
          readOnly: cell?.readOnly || false,
          colIdx: ci,
          colTitle: col.title || col.name || '',
          formula: cell?.formula || null,
          f: cell?.f || null
        }
      })
    }
  })

  // ✅ 构建列数据（直接使用接口返回的真实业务ID）
  const columns = [
    { id: 0, code: 'INDEX', title: '#', width: 50, type: 'index', fixed: true },
    { id: 1, code: 'METRIC', title: '指标', width: 150, type: 'metric', fixed: true },
    ...leafCols.map((col, ci) => {
      // ✅ 直接使用接口返回的真实业务ID（BIGINT）
      const businessId = col.id  // ✅ 使用接口返回的真实ID
      
      // ✅ 如果接口返回了 code，直接使用；否则生成业务编码
      const businessCode = col.code || generateBusinessCode(col.id, col.title || col.name)
      
      console.log(`[buildConfigFromV2] 列 ${ci}: 接口ID=${col.id}, 使用ID=${businessId}, Code=${businessCode}`)
      
      return {
        id: businessId,             // ✅ BIGINT - 真实业务ID（来自接口）
        code: businessCode,         // ✅ VARCHAR - 业务编码
        title: col.title || col.name || '',
        width: col.width || 100,
        type: col.type || 'data',
        format: col.format || 'number',
        align: col.align || 'right'
      }
    })
  ]

  // 构建 cellData（表头 + 数据单元格）
  const cellData = {}
  const frozenRows = template.layout?.frozenRows || 4

  // ✅ 辅助函数定义
  // 获取树的最大层级
  function getMaxLevel(tree) {
    let max = 0
    const walk = (nodes, level) => {
      for (const node of nodes) {
        if (level > max) max = level
        if (node.children?.length) walk(node.children, level + 1)
      }
    }
    walk(tree, 0)
    return max
  }

  // 获取指定层级的所有节点
  function getNodesAtLevel(tree, targetLevel) {
    const result = []
    const walk = (nodes, currentLevel) => {
      for (const node of nodes) {
        if (currentLevel === targetLevel) {
          result.push(node)
        } else if (node.children?.length && currentLevel < targetLevel) {
          walk(node.children, currentLevel + 1)
        }
      }
    }
    walk(tree, 0)
    return result
  }

  // 计算节点的叶子节点数量
  function countLeafNodes(node) {
    if (!node.children?.length) return 1
    let count = 0
    for (const child of node.children) {
      count += countLeafNodes(child)
    }
    return count
  }

  // ✅ 正确填充多级表头（基于列树层级结构）
  const maxHeaderLevel = template.columnTree ? getMaxLevel(template.columnTree) : 1

  // 构建每一层的表头单元格
  for (let level = 0; level < Math.min(frozenRows, maxHeaderLevel + 1); level++) {
    const levelCells = getNodesAtLevel(template.columnTree || [], level)
    let colOffset = 2 // 从第3列开始（跳过 # 和 指标列）

    levelCells.forEach((node, ni) => {
      // 计算该节点的列跨度（叶子节点数量）
      const leafCount = countLeafNodes(node)
      const colSpan = leafCount || 1

      // ✅ 填充起始位置的表头单元格
      cellData[`${level}-${colOffset}`] = {
        v: node.title || node.name || '',
        headerLevel: level + 1,
        colSpan: colSpan,
        rowSpan: 1,
        isHeaderStart: true  // 标记为合并单元格的起始位置
      }

      // ✅ 填充合并范围内的其他列（标记为被合并，不显示文本）
      for (let i = 1; i < colSpan; i++) {
        cellData[`${level}-${colOffset + i}`] = {
          v: '',  // 空文本
          headerLevel: level + 1,
          colSpan: 0,  // 0 表示被合并
          rowSpan: 1,
          isHeaderMerged: true  // 标记为被合并的单元格
        }
      }

      colOffset += colSpan
    })
  }

  // 填充数据行
  rows.forEach((row, ri) => {
    const actualRow = frozenRows + ri
    row.values.forEach((val, vi) => {
      const actualCol = vi + 2
      cellData[`${actualRow}-${actualCol}`] = {
        v: val.v,
        readOnly: val.readOnly,
        f: val.f
      }
    })
  })

  console.log('[ReportFill] Config构建完成:', {
    rows: rows.length,
    columns: columns.length,
    cellDataKeys: Object.keys(cellData).length
  })

  return {
    frozenRowCount: frozenRows,
    frozenColCount: template.layout?.frozenCols || 1,
    rowHeight: template.layout?.rowHeight || 32,
    colMinWidth: template.layout?.colMinWidth || 80,

    // ✅ 使用 V1 兼容的字段名
    columnData: columns,     // ← 关键：必须是 columnData
    cellData: cellData,       // ← 关键：必须有数据
    rows: rows,

    // V2特有数据
    _v2: true,
    _parser: parser,
    metrics: template.metrics || [],
    validators: template.validators || [],
    conditionalFormats: template.conditionalFormats || []
  }
}
function parseAndRender(tpl) {
  try {
    config.value = new TemplateParser(tpl).parse()
  } catch (parseErr) {
    console.error('[ReportFill] 模板解析失败:', parseErr)
    console.error('[ReportFill] 模板对象:', JSON.stringify(tpl, (k, v) => typeof v === 'function' ? '[Function]' : v, 2))
    throw new Error(`模板解析错误: ${parseErr.message}\n堆栈: ${parseErr.stack}`)
  }
  formulaEngine = new FormulaEngine(config.value.cellData)
  aggregateEngine = new AggregateEngine({ template: tpl, cellData: config.value.cellData })
  
  const formulas = buildFormulaConfigs(tpl)
  formulaEngine.setFormulas(formulas)
  
  if (tpl.aggregates && Array.isArray(tpl.aggregates)) {
    aggregateEngine.setAggregates(tpl.aggregates)
  }
  
  formulaEngine.calculateAll()
  aggregateEngine.calculateAll()
  restoreTreeState()
  measureVP()
}

function buildFormulaConfigs(tpl) {
  const configs = []
  
  if (tpl.formulas && Array.isArray(tpl.formulas)) {
    tpl.formulas.forEach((f, idx) => {
      configs.push({
        id: f.id || `formula_${idx}`,
        expression: f.expression || f.rawExpression || '',
        targetCell: f.targetCell || '',
        fieldName: f.fieldName || '',
        dependencies: f.dependencies || []
      })
    })
  }
  
  if (tpl.metrics && Array.isArray(tpl.metrics)) {
    tpl.metrics.forEach((m, idx) => {
      if (m.expression) {
        configs.push({
          id: m.id || `metric_${idx}`,
          expression: m.expression,
          targetCell: m.targetCell || '',
          fieldName: m.fieldName || m.name || '',
          dependencies: m.dependencies || []
        })
      }
    })
  }
  
  return configs
}

function initEngines(tpl) {
  // 校验引擎
  validationEngine = new ValidationEngine({ template: tpl, cellData: config.value.cellData })
  validationEngine.validateAll()

  // 条件格式引擎
  conditionalFormatEngine = new ConditionalFormatEngine({ template: tpl, cellData: config.value.cellData })

  // 权限引擎
  permissionEngine = new PermissionEngine({ template: tpl, currentRole: 'filler' })
}

/** Mock 数据生成器（开发阶段使用） */
function generateMockData(templateId, context) {
  const result = {}
  for (let r = 4; r <= 60; r++) {
    for (let c = 3; c <= 20; c++) {
      const key = `${r}-${c}`
      if (Math.random() > 0.15) {
        result[key] = { v: (Math.random() * 90000 + 100).toFixed(2) }
      }
    }
  }
  return result
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
  // 获取模板原始行
  const templateRows = flatRows.value
  if (!templateRows.length && (!config.value?.rows || !config.value.rows.length)) return []

  const result = []
  const startRow = config.value?.frozenRowCount || 4
  let displayIndex = 1

  // ✅ 合并策略：优先使用 config.rows（包含新增的行），否则使用 flatRows
  const sourceRows = (config.value?.rows && config.value.rows.length > 0)
    ? config.value.rows
    : templateRows

  sourceRows.forEach((raw, idx) => {
    const rowIndex = startRow + idx
    // 如果 raw 已经有 values 字段（来自 config.rows），直接使用；否则构建
    const values = raw.values || buildRowValues(rowIndex)
    const isSummary = !!raw.isSummary
    const rowData = {
      id: raw.id || `r_${idx}`, name: raw.name, depth: raw.depth || raw.level || 0,
      isSummary, summaryType: isSummary ? (raw.summaryType || detectSummaryType(raw.name)) : '',
      isAnomaly: checkAnomaly(rowIndex, values),
      hasChildren: !!(raw.children?.length),
      values, hidden: shouldHideRow(raw), displayIndex: displayIndex++, childRows: [],
    }
    if (raw.children?.length) {
      rowData.childRows = raw.children.map((child, ci) => ({
        id: child.id || `${rowData.id}_c${ci}`, name: child.name, depth: (raw.depth || 0) + 1,
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
  const cols = config.value?.columnData || []
  for (let c = 2; c < cols.length; c++) {
    const cell = config.value?.cellData?.[`${rowIndex}-${c}`]
    if (cell) {
      values.push({
        v: cell.v, raw: cell.v,
        readOnly: !!cell.readOnly || !!cell.f,
        colIdx: c, colTitle: getColTitle(c), formula: cell.f || null,
      })
    } else {
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
function getColTitle(colIdx) { return config.value?.cellData?.[`0-${colIdx}`]?.v || '' }
function colWidth(col) { return col.w || 90 }

// ========================================
// 条件格式集成（ConditionalFormatEngine）
// ========================================
function conditionalFormatClass(val, row) {
  const classes = []
  
  // 1. 使用条件格式引擎评估（原有逻辑）
  if (conditionalFormatEngine) {
    const n = parseFloat(val.v)
    if (!isNaN(n)) {
      const fmt = conditionalFormatEngine.evaluate(
        val.colIdx, val.colIdx, { ...val, v: n }
      )
      if (fmt.className) classes.push(fmt.className)
    }
  }
  
  // 2. ✅ 使用后端加载的条件格式规则
  const frozenRows = config.value?.frozenRowCount || 4
  const rowIdx = config.value?.rows?.indexOf(row)
  if (rowIdx >= 0) {
    const actualRowIdx = frozenRows + rowIdx
    const formatKey = `${actualRowIdx}-${val.colIdx}`
    if (appliedFormats[formatKey]) {
      classes.push('fr-cf-applied')
    }
  }
  
  // 3. ✅ 校验错误样式
  if (rowIdx >= 0) {
    const actualRowIdx = frozenRows + rowIdx
    const errorKey = `${actualRowIdx}-${val.colIdx}`
    if (validationErrors[errorKey]) {
      classes.push(`fr-validation-${validationErrors[errorKey].type || 'error'}`)
    }
  }
  
  return classes.join(' ')
}

function conditionalFormatStyle(val, row) {
  const style = {}
  
  // 1. 使用条件格式引擎评估（原有逻辑）
  if (conditionalFormatEngine) {
    const n = parseFloat(val.v)
    if (!isNaN(n)) {
      const fmt = conditionalFormatEngine.evaluate(
        val.colIdx, val.colIdx, { ...val, v: n }
      )
      Object.assign(style, fmt.style || {})
    }
  }
  
  // 2. ✅ 使用后端加载的条件格式规则（样式版本）
  const frozenRows = config.value?.frozenRowCount || 4
  const rowIdx = config.value?.rows?.indexOf(row)
  if (rowIdx >= 0) {
    const actualRowIdx = frozenRows + rowIdx
    const formatKey = `${actualRowIdx}-${val.colIdx}`
    const cf = appliedFormats[formatKey]
    if (cf) {
      if (cf.backgroundColor) style.backgroundColor = cf.backgroundColor
      if (cf.color) style.color = cf.color
      if (cf.fontWeight) style.fontWeight = cf.fontWeight
    }
  }
  
  return style
}

// ========================================
// 【一】树结构增强
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
  // 记录选中单元格（供工具栏"添加公式"使用）
  selectedCell.val = val
  selectedCell.row = row
  selectedCell.colIdx = colIdx

  // 权限检查
  if (permissionEngine && !permissionEngine.canEditCell(row.depth, colIdx, val)) {
    showToast('无编辑权限', 'warning'); return
  }

  // 有公式的单元格 / 只读单元格 → 打开右侧详情面板
  if (val.readOnly || val.formula || val.f) {
    openDetail(val, row, event); return
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

  // 使用校验引擎校验
  if (validationEngine) {
    const vr = validationEngine.validate(val.colIdx, colIdx, newValue)
    if (!vr.valid) { editError.value = true; showToast(vr.message, 'error'); return }
  } else {
    const vr = validateCellValue(newValue, val, row)
    if (!vr.valid) { editError.value = true; showToast(vr.message, 'error'); return }
  }

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
/* 单元格键盘事件 */
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
function setCellRef(el, rowId, colIdx) { /* DOM引用 */ }

// ========================================
// 【公式编辑器】
// ========================================

/** 打开公式编辑器 */
function openFormulaEditor(val, row, colIdx) {
  // 收集列指标字段（当前模板的叶子列）
  const leafCols = currentTemplate.value?.getLeafColumns?.() || []
  const fields = leafCols.map(col => ({
    id: col.id,
    title: col.title || col.id,
    type: col.type
  }))

  // 收集行指标字段（当前模板的扁平行）
  const flatRows = currentTemplate.value?.getFlatRows?.() || []
  const rowFields = flatRows.filter(r => !r.isSummary).map(r => ({
    id: r.id,
    name: r.name,
    type: r.isSummary ? 'aggregate' : ''
  }))

  // 合并所有有效ID（行+列）
  const validIds = [
    ...fields.map(f => f.id),
    ...rowFields.map(f => f.id)
  ]

  formulaEditor.visible = true
  formulaEditor.cellInfo = `${row.name} / ${val.colTitle || `列${colIdx}`}`
  formulaEditor.initialValue = val.formula || ''
  formulaEditor.fields = fields
  formulaEditor.rowFields = rowFields
  formulaEditor.validFieldIds = validIds
  formulaEditor.targetCell = { rowIdx: row.depth, colIdx, val, row }
}

/** 应用公式（接收结构化对象） */
function onFormulaApply(formulaData) {
  const target = formulaEditor.targetCell
  if (!target) return

  const expr = typeof formulaData === 'string' ? formulaData : formulaData.expression
  const cellKey = `${target.rowIdx}-${target.colIdx}`

  // 1. 更新 cellData（结构化存储）
  if (config.value.cellData[cellKey]) {
    config.value.cellData[cellKey] = {
      ...config.value.cellData[cellKey],
      v: expr,
      readOnly: true,
      f: expr.replace(/^=/, ''),
      // 新增：完整公式配置（后端传输格式）
      formulaConfig: typeof formulaData === 'object' ? {
        fieldName: formulaData.fieldName,
        label: formulaData.label,
        expression: formulaData.rawExpression || expr.replace(/^=/, ''),
        resultType: formulaData.resultType,
        dependencies: formulaData.dependencies,
        createdAt: formulaData.createdAt
      } : null
    }
  }

  // 2. 同步更新显示行数据
  syncCellToRows(target.rowIdx, target.colIdx, expr)

  // 3. 记录到已保存公式列表（用于管理面板）
  if (typeof formulaData === 'object') {
    savedFormulas.push({
      ...formulaData,
      targetCell: cellKey,
      rowName: target.row?.name,
      colTitle: target.val?.colTitle
    })
  }

  showToast('公式已保存', 'success')
  drawer.visible = false
  formulaEditor.visible = false

  // 重新计算公式引擎
  nextTick(() => {
    if (formulaEngine) {
      formulaEngine.invalidateCache()
      formulaEngine.calculateAll()
    }
  })

  // 模拟后端API调用（实际项目中替换为真实API）
  console.log('[Formula] 后端传输格式:', JSON.stringify(buildBackendPayload(formulaData), null, 2))
}

/**
 * ✅ 公式保存到后端成功回调
 */
function onFormulaSaved(data) {
  console.log('[Formula] 后端保存成功:', data)
  // 可以在这里更新公式列表或显示提示
}

/**
 * 将公式应用结果同步到显示行数据
 * 确保 row.values[vi] 的 readOnly/formula 与 cellData 一致
 */
function syncCellToRows(rowIdx, colIdx, expr) {
  const rows = visibleRows.value
  for (const row of rows) {
    // 匹配目标行（通过 depth 或 id）
    if (row.depth === rowIdx || row.id === formulaEditor.targetCell?.row?.id) {
      if (row.values && row.values[colIdx]) {
        row.values[colIdx] = {
          ...row.values[colIdx],
          v: expr,
          raw: expr,
          readOnly: true,
          formula: expr.replace(/^=/, ''),
          f: expr.replace(/^=/, '')
        }
      }
      // 同步子行
      if (row.childRows) {
        for (const child of row.childRows) {
          if (child.values && child.values[colIdx]) {
            child.values[colIdx] = {
              ...child.values[colIdx],
              v: expr,
              raw: expr,
              readOnly: true,
              formula: expr.replace(/^=/, ''),
              f: expr.replace(/^=/, '')
            }
          }
        }
      }
      break
    }
  }
}

/**
 * 构建后端API传输格式
 * 输出: { fieldName, label, expression, resultType, targetCell, ... }
 */
function buildBackendPayload(formulaData) {
  const target = formulaEditor.targetCell
  return {
    fieldName: formulaData.fieldName || `formula_${Date.now().toString(36)}`,
    label: formulaData.label || '',
    expression: (formulaData.rawExpression || '').replace(/^=/, ''),
    resultType: formulaData.resultType || 'number',
    targetCell: `${target?.rowIdx}-${target?.colIdx}`,
    dependencies: formulaData.dependencies || [],
    templateId: currentTemplate.value?.id,
    createdAt: new Date().toISOString()
  }
}

/** 从详情Drawer打开公式编辑器 */
function openFormulaEditorFromDrawer() {
  const val = drawer._detailVal
  const row = drawer._detailRow
  if (!val || !row) return
  openFormulaEditor(val, row, val.colIdx)
}

/** 从工具栏"添加公式"按钮打开公式编辑器 */
function openFormulaForSelected() {
  if (!selectedCell.val || !selectedCell.row) {
    showToast('请先点击选中一个单元格', 'warning')
    return
  }
  openFormulaEditor(selectedCell.val, selectedCell.row, selectedCell.colIdx)
}

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
// 【五】保存系统（双轨制：localStorage + 后端API）
// ========================================

/**
 * ✅ 更新 store 中的保存数据（在数据变更时调用）
 * 
 * 改造要点：
 * - 传递真实的行/列配置（带业务ID）
 * - 不再使用 r_0、c_2 等临时坐标
 * - 生成标准 CellDataDTO，符合数据库表结构要求
 * 
 * ⚠️ 重要：buildConfigFromV2 返回的是 columnData，而不是 columns
 */
function updateSaveData() {
  if (!config.value) return
  
  console.log('[UpdateSaveData] ========== 更新保存数据 ==========')
  console.log('[UpdateSaveData] config.value:', config.value)
  console.log('[UpdateSaveData] config.value.columnData:', config.value.columnData)
  console.log('[UpdateSaveData] config.value.rows:', config.value.rows)
  
  console.log('[UpdateSaveData] 数据统计:', {
    templateId: props.templateId,
    orgId: selectedOrgId.value,
    period: selectedPeriod.value,
    rowsCount: (config.value.rows || []).length,
    columnsCount: (config.value.columnData || []).length,  // ✅ 使用 columnData
    cellDataCount: Object.keys(config.value.cellData || {}).length
  })
  
  // ✅ 直接使用 config.value.rows 和 config.value.columnData（已包含真实业务ID）
  const rowsWithBusinessId = config.value.rows || []
  const columnsWithBusinessId = config.value.columnData || []  // ✅ 使用 columnData
  
  console.log('[UpdateSaveData] 行配置示例（前3行）:', rowsWithBusinessId.slice(0, 3))
  console.log('[UpdateSaveData] 列配置示例（前5列）:', columnsWithBusinessId.slice(0, 5))
  
  // ✅ 检查列配置是否包含真实业务ID
  if (columnsWithBusinessId.length > 0) {
    console.log('[UpdateSaveData] ✅ 列配置包含真实业务ID:')
    columnsWithBusinessId.slice(2, 5).forEach((col, idx) => {
      console.log(`  列 ${idx + 2}: id=${col.id}, code=${col.code}, title=${col.title}`)
    })
  } else {
    console.warn('[UpdateSaveData] ⚠️ 列配置为空，请检查 buildConfigFromV2 方法')
  }
  
  // ✅ 更新 store 保存数据
  store.setSaveData({
    templateId: props.templateId,           // ✅ 模板ID（BIGINT）
    orgId: selectedOrgId.value,             // ✅ 组织ID（BIGINT）
    period: selectedPeriod.value,           // ✅ 填报周期（VARCHAR）
    templateCode: v2TemplateCode.value,
    templateName: currentTemplate.value?.name || '',
    
    // ✅ 传递真实的行/列配置（带业务ID）
    rows: rowsWithBusinessId,
    columns: columnsWithBusinessId,         // ✅ 使用 columnData
    
    // ✅ 单元格数据（VTable坐标 → 将在 buildCellDataDTO 中转换为业务ID）
    cellData: config.value.cellData || {},
    
    // ✅ 其他数据
    formulas: savedFormulas,
    frozenRowCount: config.value.frozenRowCount || 4,
    remark: ''
  })
  
  console.log('[UpdateSaveData] ========== 已更新保存数据 ==========')
  console.log('[UpdateSaveData] ✅ 包含真实业务ID')
}

/**
 * ✅ 组织变更处理
 */
function onOrgChange() {
  console.log('[Org] 选择组织:', selectedOrgId.value)
  // 更新保存数据
  updateSaveData()
  
  // 可以在这里加载该组织的已有填报数据
  if (selectedOrgId.value && selectedPeriod.value) {
    loadExistingData()
  }
}

/**
 * ✅ 周期变更处理
 */
function onPeriodChange() {
  console.log('[Period] 选择周期:', selectedPeriod.value)
  // 更新保存数据
  updateSaveData()
  
  // 可以在这里加载该周期的已有填报数据
  if (selectedOrgId.value && selectedPeriod.value) {
    loadExistingData()
  }
}

/**
 * ✅ 加载已有填报数据（根据组织+周期）
 */
async function loadExistingData() {
  if (!props.templateId || !selectedOrgId.value || !selectedPeriod.value) return
  
  try {
    const { getReportData } = await import('@/api/reportDesigner.js')
    const data = await getReportData({
      templateId: props.templateId,
      orgId: selectedOrgId.value,
      period: selectedPeriod.value
    })
    
    if (data && data.cells?.length > 0) {
      console.log('[LoadData] 加载到已有填报数据:', data.cells.length, '个单元格')
      
      // ✅ 将后端 cells 数据回填到表格
      backfillCellsToTable(data.cells)
      
      showToast(`已加载 ${data.cells.length} 个已填单元格`, 'success')
    } else {
      console.log('[LoadData] 无已有数据，开始新填报')
    }
  } catch (err) {
    console.warn('[LoadData] 加载失败:', err.message)
    // 不阻塞用户操作，可以继续新填报
  }
}

/**
 * ✅ 将后端返回的 cells 数据回填到表格中
 * @param {Array} cells - 后端返回的 CellDataDTO 列表
 */
function backfillCellsToTable(cells) {
  if (!config.value) return
  
  const frozenRows = config.value.frozenRowCount || 4
  
  cells.forEach(cell => {
    // 根据 rowId 和 colId 找到对应的行和列索引
    let rowIdx = -1
    let colIdx = -1
    
    // 查找行索引（通过 rowId 或 rowName 匹配）
    if (config.value.rows && Array.isArray(config.value.rows)) {
      rowIdx = config.value.rows.findIndex(r => 
        r.id === cell.rowId || 
        r.name === cell.rowName ||
        r.id === String(cell.rowId)
      )
      if (rowIdx >= 0) {
        rowIdx += frozenRows  // 加上冻结行偏移
      }
    }
    
    // 查找列索引（通过 colId 或 colTitle 匹配）
    if (config.value.columnData && Array.isArray(config.value.columnData)) {
      colIdx = config.value.columnData.findIndex(c => 
        c.id === cell.colId || 
        c.title === cell.colTitle ||
        c.id === String(cell.colId)
      )
    }
    
    if (rowIdx >= 0 && colIdx >= 0) {
      const key = `${rowIdx}-${colIdx}`
      
      // 更新 cellData
      config.value.cellData[key] = {
        v: cell.value ?? '',
        raw: cell.rawValue ?? cell.value ?? '',
        readOnly: false,
        f: cell.formula || null,
        _loaded: true,  // 标记为从后端加载的数据
        _cellId: cell.id  // 保留后端ID，用于更新时使用
      }
      
      // 同步更新 rows 中的 values
      if (config.value.rows && config.value.rows[rowIdx - frozenRows]?.values) {
        const valueObj = config.value.rows[rowIdx - frozenRows].values[colIdx]
        if (valueObj) {
          valueObj.v = cell.value ?? ''
          valueObj.raw = cell.rawValue ?? cell.value ?? ''
          valueObj.f = cell.formula || null
          valueObj._loaded = true
        }
      }
    }
  })
  
  // 触发响应式更新
  dataVersion.value++
  
  console.log(`[Backfill] 已回填 ${cells.length} 个单元格`)
}

/**
 * ✅ 将API返回的 cellData 填充到表格中
 * 处理 key 格式: "rowId:colId" → 实际行列坐标
 * 
 * @param {Object} apiCellData - API返回的 cellData 对象，如 { "r_mqrrbbp0_1:c_mqrrbi04_1": "677.000000" }
 */
function populateCellDataFromApi(apiCellData) {
  if (!config.value || !apiCellData || typeof apiCellData !== 'object') return

  const frozenRows = config.value.frozenRowCount || 4
  const rows = config.value.rows || []
  const columns = config.value.columnData || []

  // 构建 rowId → rowIndex 映射
  const rowIdToIndex = {}
  rows.forEach((row, idx) => {
    if (row && row.id) rowIdToIndex[row.id] = idx
  })

  // 构建 colId → colIndex 映射
  const colIdToIndex = {}
  columns.forEach((col, idx) => {
    if (col && col.id) colIdToIndex[col.id] = idx
  })

  let filledCount = 0
  const cellDataKeys = Object.keys(apiCellData)

  for (const key of cellDataKeys) {
    const rawValue = apiCellData[key]
    if (rawValue === undefined || rawValue === null) continue

    // 解析 key 格式: "rowId:colId"
    const colonIdx = key.indexOf(':')
    if (colonIdx === -1) continue

    const rowId = key.substring(0, colonIdx)
    const colId = key.substring(colonIdx + 1)

    const rowIdx = rowIdToIndex[rowId]
    const colIdx = colIdToIndex[colId]

    if (rowIdx === undefined || colIdx === undefined) {
      console.warn(`[PopulateCellData] 未找到匹配的行/列: rowId=${rowId}, colId=${colId}`)
      continue
    }

    const actualRow = frozenRows + rowIdx
    const actualCol = colIdx  // 列索引已包含 # 和 指标列

    // 格式化显示值：数值类型去掉尾部多余的零
    let displayValue = rawValue
    const numVal = Number(rawValue)
    if (!isNaN(numVal) && String(rawValue).indexOf('.') !== -1) {
      displayValue = String(numVal)
    }

    const cellKey = `${actualRow}-${actualCol}`

    // 更新 config.cellData
    config.value.cellData[cellKey] = {
      v: displayValue,
      raw: rawValue,
      readOnly: false,
      f: null
    }

    // 同步更新 config.rows[rowIdx].values
    const valueColIdx = colIdx - 2  // 转换为 values 数组索引（跳过 # 和 指标列）
    if (valueColIdx >= 0 && rows[rowIdx]?.values?.[valueColIdx]) {
      rows[rowIdx].values[valueColIdx].v = displayValue
      rows[rowIdx].values[valueColIdx].raw = rawValue
    }

    filledCount++
  }

  // 触发响应式更新
  dataVersion.value++

  console.log(`[PopulateCellData] 从API cellData 填充 ${filledCount} 个单元格（共 ${cellDataKeys.length} 个键）`)
}

// ========================================
// 【六】条件格式系统
// ========================================

/**
 * ✅ 加载模板的条件格式规则
 */
async function loadConditionalFormats(templateId) {
  try {
    const { getConditionalFormatsByTemplate } = await import('@/api/reportEngine.js')
    const formats = await getConditionalFormatsByTemplate(templateId)
    
    if (Array.isArray(formats) && formats.length > 0) {
      conditionalFormats.value = formats
      console.log(`[CondFormat] 加载 ${formats.length} 条条件格式规则`)
      
      // 应用条件格式到表格
      applyConditionalFormats()
    }
  } catch (err) {
    console.warn('[CondFormat] 加载失败:', err.message)
  }
}

/**
 * ✅ 应用条件格式规则到当前数据
 */
function applyConditionalFormats() {
  if (!config.value || !conditionalFormats.value.length) return
  
  // 清除旧的应用结果
  Object.keys(appliedFormats).forEach(key => delete appliedFormats[key])
  
  const frozenRows = config.value.frozenRowCount || 4
  
  conditionalFormats.value.forEach(rule => {
    // 遍历所有单元格，检查是否满足条件
    config.value.rows?.forEach((row, rIdx) => {
      row.values?.forEach((val, cIdx) => {
        const actualRowIdx = frozenRows + rIdx
        const key = `${actualRowIdx}-${cIdx}`
        
        // 检查单元格值是否满足条件
        const cellValue = val.v ?? val.raw ?? ''
        if (evaluateCondition(rule.condition, cellValue)) {
          appliedFormats[key] = {
            backgroundColor: rule.style?.backgroundColor || '',
            color: rule.style?.color || '',
            fontWeight: rule.style?.fontWeight || '',
            icon: rule.icon,
            tooltip: rule.name || ''
          }
        }
      })
    })
  })
  
  dataVersion.value++  // 触发重新渲染
}

/**
 * ✅ 评估条件表达式
 */
function evaluateCondition(condition, value) {
  if (!condition) return false
  
  try {
    const numVal = Number(value)
    if (isNaN(numVal)) return false
    
    switch (condition.operator) {
      case 'gt': return numVal > condition.value
      case 'gte': return numVal >= condition.value
      case 'lt': return numVal < condition.value
      case 'lte': return numVal <= condition.value
      case 'eq': return numVal === condition.value
      case 'neq': return numVal !== condition.value
      case 'between': 
        return numVal >= (condition.min ?? -Infinity) && numVal <= (condition.max ?? Infinity)
      case 'contains':
        return String(value).includes(String(condition.value))
      default: return false
    }
  } catch { return false }
}

/**
 * ✅ 获取单元格的条件格式样式
 */
function getCellFormatStyle(rowIdx, colIdx) {
  const key = `${rowIdx}-${colIdx}`
  return appliedFormats[key] || null
}

// ========================================
// 【七】校验规则系统
// ========================================

/**
 * ✅ 加载模板的校验规则
 */
async function loadValidationRules(templateId) {
  try {
    const { getValidatorsByTemplate } = await import('@/api/reportEngine.js')
    const rules = await getValidatorsByTemplate(templateId)
    
    if (Array.isArray(rules) && rules.length > 0) {
      validationRules.value = rules
      console.log(`[Validator] 加载 ${rules.length} 条校验规则`)
    }
  } catch (err) {
    console.warn('[Validator] 加载失败:', err.message)
  }
}

/**
 * ✅ 执行校验（单个单元格）
 */
function validateCell(rowIdx, colIdx, value) {
  const key = `${rowIdx}-${colIdx}`
  
  // 清除该单元格的旧错误
  delete validationErrors[key]
  
  for (const rule of validationRules.value) {
    if (!rule.enabled) continue
    
    try {
      let isValid = true
      let errorMsg = rule.message || '校验不通过'
      
      switch (rule.type) {
        case 'required':
          isValid = value !== '' && value != null && String(value).trim() !== ''
          break
        case 'number':
          isValid = value === '' || !isNaN(Number(value))
          errorMsg = rule.message || '请输入有效数字'
          break
        case 'range':
          const num = Number(value)
          isValid = isNaN(num) ? true : (num >= (rule.min ?? -Infinity) && num <= (rule.max ?? Infinity))
          errorMsg = rule.message || `值应在 ${rule.min} ~ ${rule.max} 之间`
          break
        case 'regex':
          if (value && rule.pattern) {
            isValid = new RegExp(rule.pattern).test(String(value))
            errorMsg = rule.message || '格式不正确'
          }
          break
        case 'custom':
          // 自定义校验暂不支持前端执行，跳过
          continue
        default:
          continue
      }
      
      if (!isValid) {
        validationErrors[key] = { message: errorMsg, type: rule.severity || 'error' }
        // 如果是错误级别，停止继续检查其他规则
        if ((rule.severity || 'error') === 'error') break
      }
    } catch (e) {
      console.warn('[Validator] 规则执行异常:', e)
    }
  }
  
  return !validationErrors[key]
}

/**
 * ✅ 执行全部校验（保存前调用）
 */
async function validateAllData() {
  if (!config.value || !validationRules.value.length) return { valid: true, errors: [] }
  
  const errors = []
  const frozenRows = config.value.frozenRowCount || 4
  
  config.value.rows?.forEach((row, rIdx) => {
    row.values?.forEach((val, cIdx) => {
      const actualRowIdx = frozenRows + rIdx
      const cellValue = val.v ?? val.raw ?? ''
      
      validateCell(actualRowIdx, cIdx, cellValue)
      
      const key = `${actualRowIdx}-${cIdx}`
      if (validationErrors[key]) {
        errors.push({
          row: row.name || `行${rIdx + 1}`,
          col: config.value.columnData[cIdx]?.title || `列${cIdx + 1}`,
          message: validationErrors[key].message
        })
      }
    })
  })
  
  return {
    valid: errors.length === 0,
    errors,
    count: errors.length
  }
}

/**
 * ✅ 自动保存（15秒防抖）
 * 连续操作时只会在最后一次操作后15秒触发
 */
function triggerAutoSave() {
  // 先更新待保存数据
  updateSaveData()
  
  // 使用 store 的 15s 防抖自动保存
  store.triggerAutoSave()

  // 显示提示（仅短暂显示，不阻塞）
  showSaveStatus('编辑中...', 'saving')
}

/**
 * ✅ 手动点击保存（立即保存）
 * Ctrl+S 或点击保存按钮时调用
 */
async function forceSave() {
  // ✅ 校验必填字段
  if (!selectedOrgId.value) {
    showToast('请先选择组织', 'warning')
    return
  }
  if (!selectedPeriod.value) {
    showToast('请先选择填报周期', 'warning')
    return
  }
  
  // ✅ 执行数据校验（保存前）
  const validationResult = await validateAllData()
  if (!validationResult.valid) {
    console.warn('[Save] 校验未通过:', validationResult.errors)
    // 显示校验错误提示（不阻止保存，但提示用户）
    if (validationResult.errors.length > 0) {
      showToast(`校验发现 ${validationResult.count} 个问题，请检查`, 'warning')
      // 可以在这里显示详细的错误列表
    }
  }
  
  // 取消自动保存定时器（避免重复保存）
  store.cancelAutoSave()
  
  showSaveStatus('正在保存...', 'saving')
  
  try {
    // 先更新数据（包含 orgId 和 period）
    updateSaveData()
    
    // 调用 store 的强制保存（localStorage + API 双轨）
    const result = await store.forceSave('manual')
    
    if (result.success) {
      showSaveStatus(result.message, 'success')
      setTimeout(() => { saveStatus.visible = false }, 2000)
    } else {
      showSaveStatus(result.message || '保存失败', 'error')
      setTimeout(() => { saveStatus.visible = false }, 3000)
    }
  } catch (e) {
    showSaveStatus('保存失败: ' + (e.message || '未知错误'), 'error')
    setTimeout(() => { saveStatus.visible = false }, 3000)
  }
}

/**
 * ✅ 离开页面时立即保存
 * @param {BeforeUnloadEvent} event - beforeunload 事件对象
 */
async function onBeforeUnload(event) {
  // 检查是否有未保存的数据
  if (store.dirtyCells.size > 0 || config.value?.rows?.length > 0) {
    // 更新数据并立即保存到 localStorage
    updateSaveData()
    
    // 同步保存到 localStorage（必须同步，否则浏览器不会等待）
    try {
      const draftKey = `rpt_draft_${v2TemplateCode.value || props.templateId}`
      const draftData = {
        ...store.saveData,
        rows: config.value?.rows || [],
        cellData: config.value?.cellData || {},
        formulas: savedFormulas,
        savedAt: new Date().toISOString(),
        source: 'unload'
      }
      localStorage.setItem(draftKey, JSON.stringify(draftData))
      console.log('[BeforeUnload] ✅ 离开页面已保存到本地')
    } catch (err) {
      console.warn('[BeforeUnload] ⚠️ 本地保存失败:', err)
    }

    // 显示浏览器确认对话框（仅当有未保存更改时）
    // 注意：现代浏览器可能忽略自定义消息
    event.preventDefault()
    event.returnValue = '' // Chrome 需要
    return ''
  }
}

/**
 * ✅ 发布模板前强制保存
 */
async function forceSaveAndPublish() {
  // 先强制保存
  await forceSave()
  
  // 然后再执行发布逻辑（这里可以扩展发布功能）
  showSaveStatus('正在发布...', 'saving')
  
  try {
    updateSaveData()
    const result = await store.forceSave('publish')
    
    if (result.success) {
      showSaveStatus('发布成功！', 'success')
      setTimeout(() => { saveStatus.visible = false }, 2000)
    } else {
      showSaveStatus('发布失败: ' + result.message, 'error')
      setTimeout(() => { saveStatus.visible = false }, 3000)
    }
  } catch (e) {
    showSaveStatus('发布失败: ' + (e.message || '未知错误'), 'error')
    setTimeout(() => { saveStatus.visible = false }, 3000)
  }
}

/**
 * ✅ 提交审核（先保存，再提交）
 */
async function submitForReview() {
  // 校验必填字段
  if (!selectedOrgId.value) {
    showToast('请先选择组织', 'warning')
    return
  }
  if (!selectedPeriod.value) {
    showToast('请先选择填报周期', 'warning')
    return
  }
  
  // 先强制保存
  await forceSave()
  
  showSaveStatus('正在提交审核...', 'saving')
  
  try {
    const { submitForReview: apiSubmit } = await import('@/api/reportDesigner.js')
    
    const payload = {
      templateId: props.templateId,
      orgId: selectedOrgId.value,
      period: selectedPeriod.value,
      remark: saveData.value.remark || ''
    }
    
    const result = await apiSubmit(payload)
    
    if (result?.success !== false) {
      showSaveStatus('提交审核成功！', 'success')
      showToast('已提交审核，请等待审批', 'success')
      setTimeout(() => { saveStatus.visible = false }, 2000)
    } else {
      showSaveStatus('提交失败: ' + (result.message || '未知错误'), 'error')
      setTimeout(() => { saveStatus.visible = false }, 3000)
    }
  } catch (e) {
    showSaveStatus('提交失败: ' + (e.message || '未知错误'), 'error')
    setTimeout(() => { saveStatus.visible = false }, 3000)
  }
}

function showSaveStatus(text, type) { 
  saveStatus.text = text; 
  saveStatus.type = type; 
  saveStatus.visible = true 
}

// ========================================
// 【六】公式引擎
// ========================================
function recalcFormulas() {
  if (formulaEngine) {
    formulaEngine.invalidateCache()
    formulaEngine.calculateAll()
  }
  if (aggregateEngine) {
    aggregateEngine.calculateAll()
  }
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
// 【九】【十】详情Drawer
// ========================================
function openDetail(val, row, event) {
  const n = parseFloat(val.v)
  drawer.metric = row.name
  drawer.displayValue = fmtVal(val)
  drawer.rawValue = String(val.raw ?? val.v)
  drawer.valClass = !isNaN(n) && /率|增长率/.test(val.colTitle) ? (n > 0 ? 'fr-up' : n < 0 ? 'fr-down' : '') : ''
  drawer.formula = val.formula || ''
  drawer.source = val.readOnly ? '系统自动计算（公式/汇总）' : '手工填报'
  drawer.templateId = currentTemplate.value?.id || '-'

  // 保存引用，用于"编辑公式"按钮
  drawer._detailVal = val
  drawer._detailRow = row
  drawer._canEditFormula = !!val.readOnly // 只读单元格可编辑公式

  // 校验引擎结果
  if (validationEngine) {
    const vr = validationEngine.validate(val.colIdx, val.colIdx, val.v)
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
onMounted(() => {
  const tid = props.templateId || route.params.templateId
  if (tid) {
    loadReport(tid)
  }
  try { const s = localStorage.getItem('fr_col_folds'); if (s) collapsedGroups.value = new Set(JSON.parse(s)) } catch {}
  
  // ✅ 添加页面离开时的保存监听
  window.addEventListener('beforeunload', onBeforeUnload)
  
  // ✅ 加载组织列表
  loadOrgList()
})

watch(() => route.params.templateId, (newId) => {
  if (newId && newId !== props.templateId) {
    loadReport(newId)
  }
})

onBeforeUnmount(() => { 
  // ✅ 移除页面离开监听
  window.removeEventListener('beforeunload', onBeforeUnload)
  
  // 取消自动保存定时器
  store.cancelAutoSave()
  
  // 离开时立即保存（组件卸载前）
  if (config.value?.rows?.length > 0) {
    onBeforeUnload({ preventDefault: () => {}, returnValue: '' })
  }
})
</script>

<style lang="scss" scoped>
/* ============================================
   FRReport - 企业级统计填报平台（动态版）
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

/* 模板标识 */
.fr-template-badge {
  font-size: 13px; font-weight: 600; color: $text-primary;
  em { font-style: normal; font-size: 11px; color: $text-muted; margin-left: 4px; font-weight: 400; }
  .fr-v2-badge {
    font-style: normal; font-size: 9px; font-weight: 700;
    background: linear-gradient(135deg, #7C3AED, #2563EB);
    color: #fff; padding: 1px 6px; border-radius: 4px;
    margin-left: 6px; vertical-align: middle;
    letter-spacing: .5px;
  }
}

/* 保存状态 */
.fr-save-status {
  font-size: 11px; padding: 2px 10px; border-radius: 10px; font-weight: 500;
  animation: fr-status-in .2s ease-out;
  &.fr-save-saving { background: #FEF3C7; color: #92400E; }
  &.fr-save-success { background: #D1FAE5; color: #065F46; }
  &.fr-save-error { background: #FEE2E2; color: #991B1B; }
}
@keyframes fr-status-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

/* 操作按钮 */
.fr-action-btn {
  padding: 3px 10px; border: 1px solid $border-light; background: $surface;
  border-radius: 4px; font-size: 11px; color: $text-secondary; cursor: pointer;
  transition: all .15s; white-space: nowrap;
  &:hover { border-color: $accent; color: $accent; background: #EFF6FF; }
}
.fr-fold-btn {
  padding: 3px 8px; border: 1px solid $border-light; background: $surface;
  border-radius: 4px; font-size: 11px; color: $text-secondary; cursor: pointer;
  transition: all .15s; white-space: nowrap; display: inline-flex; align-items: center; gap: 2px;
  &:hover { border-color: $accent; color: $accent; }
  &.collapsed { opacity: .7; }
}
.fr-fold-icon { font-size: 8px; }

/* 工具栏 - 添加公式按钮 */
.fr-fx-btn {
  display: inline-flex; align-items: center; gap: 4px;
  background: #EEF2FF; border-color: #C7D2FE; color: #4F46E5;
  &:hover:not(:disabled) { background: #E0E7FF; border-color: #A5B4FC; color: #3730A3; }
  &:disabled { opacity: .4; cursor: not-allowed; }
  svg { flex-shrink: 0; }
}

/* 新增行按钮 */
.fr-add-row-btn {
  display: inline-flex; align-items: center; gap: 4px;
  background: #F0FDF4; border-color: #BBF7D0; color: #16A34A;
  &:hover:not(:disabled) { background: #DCFCE7; border-color: #86EFAC; color: #15803D; }
  svg {
    flex-shrink: 0;
    stroke-width: 2.5;
  }
}

/* 保存按钮 */
.fr-save-btn {
  display: inline-flex; align-items: center; gap: 4px;
  background: #EFF6FF; border-color: #BFDBFE; color: #2563EB;
  &:hover:not(:disabled) { background: #DBEAFE; border-color: #93C5FD; color: #1D4ED8; }
  svg {
    flex-shrink: 0;
    stroke-width: 1.5;
  }
}

/* 发布按钮 */
.fr-publish-btn {
  display: inline-flex; align-items: center; gap: 4px;
  background: #FEF3C7; border-color: #FCD34D; color: #D97706;
  &:hover:not(:disabled) { background: #FDE68A; border-color: #FBBF24; color: #B45309; }
  svg {
    flex-shrink: 0;
  }
}

/* ✅ 提交审核按钮 */
.fr-submit-btn {
  display: inline-flex; align-items: center; gap: 4px;
  background: #DBEAFE; border-color: #93C5FD; color: #2563EB;
  &:hover:not(:disabled) { background: #BFDBFE; border-color: #60A5FA; color: #1D4ED8; }
  &:disabled { opacity: .4; cursor: not-allowed; }
  svg {
    flex-shrink: 0;
  }
}

/* ✅ 组织/周期选择器 */
.fr-select {
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid $border;
  border-radius: 4px;
  background: white;
  color: $text-primary;
  cursor: pointer;
  outline: none;
  transition: all .15s;
  
  &:hover {
    border-color: $accent;
  }
  &:focus {
    border-color: $accent;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
  }
}

/* ✅ 只读字段样式 */
.fr-readonly-field {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.fr-readonly-label {
  font-size: 12px;
  font-weight: 600;
  color: #606266;
  margin-right: 4px;
}

.fr-readonly-value {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
}

/* 单元格内联 fx 按钮 */
.fr-cell-fx {
  position: absolute; right: 2px; top: 50%; transform: translateY(-50%);
  width: 18px; height: 16px;
  padding: 0; margin: 0;
  border: none; border-radius: 3px;
  background: transparent;
  font-size: 9px; font-weight: 700; font-style: italic;
  color: #A5B4FC; cursor: pointer;
  opacity: 0; transition: all .15s;
  line-height: 1;
  z-index: 2;
}
.fr-td-val:hover .fr-cell-fx,
.fr-td-val:focus-within .fr-cell-fx {
  opacity: 1;
}
.fr-cell-fx:hover {
  background: #7C3AED; color: #fff !important;
}

/* ✅ 条件格式应用样式 */
.fr-cf-applied {
  position: relative;
  &::after {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: var(--cf-indicator, #2563EB);
    border-radius: 2px;
  }
}

/* ✅ 校验错误样式 */
.fr-validation-error {
  border-bottom: 2px solid $danger !important;
  position: relative;
  
  &::before {
    content: '!';
    position: absolute;
    right: 2px; top: 50%;
    transform: translateY(-50%);
    font-size: 10px;
    color: $danger;
    font-weight: bold;
  }
}

.fr-validation-warning {
  border-bottom: 2px solid $warning !important;
}

/* 表格区域 */
.fr-body {
  flex: 1; overflow: auto; position: relative;
  &::-webkit-scrollbar { width: 8px; height: 8px; }
  &::-webkit-scrollbar-thumb { background: rgba(0,0,0,.20); border-radius: 4px; &:hover { background: rgba(0,0,0,.35); } }
  &::-webkit-scrollbar-track { background: transparent; }
}
.fr-header-section {
  position: sticky; top: 0; z-index: 10; background: $surface;
  box-shadow: 0 1px 3px rgba(0,0,0,.04);
}
.fr-data-section { /* 不限制高度 */ }

.fr-table {
  width: max-content; border-collapse: collapse; table-layout: fixed;
  th, td { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
}

/* 表头 */
.fr-th {
  padding: 5px 8px; text-align: center; font-size: 11px; font-weight: 600;
  color: #fff; border: 1px solid rgba(255,255,255,.08);
  user-select: none; position: relative;
  &.fr-th-l1 { background: $h1-bg; }
  &.fr-th-l2 { background: $h2-bg; }
  &.fr-th-l3 { background: $h3-bg; }
  &.fr-th-l4 { background: $h4-bg; }
  &.fr-th-corner { background: $h1-bg; width: 36px; min-width: 36px; }
  &.fr-th-metric { background: $h1-bg; width: 180px; min-width: 180px; text-align: left; }
  .fr-th-text { cursor: default; }
  .fr-th-hint {
    margin-left: 4px; font-size: 10px; cursor: help; opacity: .6;
    &:hover { opacity: 1; }
  }
}

/* 数据单元格 */
.fr-td {
  padding: 0 8px; height: ROW_H; line-height: ROW_H; font-size: 12px;
  border-right: 1px solid $border-light; border-bottom: 1px solid $border-light;
  vertical-align: middle; transition: background-color .1s;
}
.fr-td-index {
  width: 36px; min-width: 36px; text-align: center; color: $text-muted;
  background: #FAFBFC; font-size: 11px; font-weight: 500;
}
.fr-td-metric {
  width: 180px; min-width: 180px; text-align: left; background: #FAFBFC;
  font-weight: 500; cursor: default;
}
.fr-td-val {
  text-align: right; font-family: "SF Mono", Menlo, Consolas, monospace;
  font-variant-numeric: tabular-nums; cursor: default;
  position: relative;
  &:hover:not(.fr-editing):not(.fr-ro) { background: #F0F7FF; }
}

/* 树节点 */
.fr-tree-node {
  display: flex; align-items: center; height: 100%; cursor: pointer;
  user-select: none; position: relative;
}
.fr-tree-toggle {
  display: inline-flex; align-items: center; justify-content: center;
  width: 16px; height: 16px; font-size: 8px; color: $text-muted;
  transition: transform .15s; flex-shrink: 0;
  &.expanded { transform: rotate(90deg); }
  &:hover { color: $accent; }
}
.fr-tree-leaf {
  display: inline-block; width: 16px; flex-shrink: 0;
}
.fr-tree-line {
  position: absolute; left: 8px; top: 0; bottom: 0; width: 1px;
  background: $border-light; z-index: 0;
}
.fr-tree-label {
  margin-left: 2px; overflow: hidden; text-overflow: ellipsis;
  &:hover { color: $accent; }
}

/* 汇总行 */
.fr-row-summary {
  .fr-td-metric { background: $summary-bg; }
  .fr-td-val { background: $summary-bg; font-weight: 700; color: $summary-text; }
}
.fr-summary-badge {
  display: inline-block; padding: 1px 6px; border-radius: 3px;
  background: $accent; color: #fff; font-size: 10px; font-weight: 600;
  margin-right: 6px;
}
.fr-summary-label { font-weight: 600; }

/* 子行 */
.fr-row-child .fr-td-val { background: #F8FAFC; color: $text-secondary; font-size: 11px; }
.fr-child-item { display: flex; align-items: center; font-size: 11px; color: $text-secondary; }
.fr-child-dot { width: 6px; height: 6px; border-radius: 50%; background: $border; margin-right: 6px; flex-shrink: 0; }

/* 条件格式样式 */
.fr-up { color: $success !important; font-weight: 600; }
.fr-down { color: $danger !important; font-weight: 600; }
.fr-flat { color: $text-secondary; }
.fr-ro { color: $text-muted; font-style: italic; }
.fr-bold { font-weight: 700; }
.fr-anomaly-val { background: $anomaly-bg !important; color: $danger !important; font-weight: 600; }

/* 编辑模式 */
.fr-editing { padding: 0 !important; }
.fr-edit-input {
  width: 100%; height: 100%; border: 1.5px solid $accent; outline: none;
  padding: 0 6px; font-family: inherit; font-size: inherit; text-align: right;
  background: #fff; border-radius: 2px; box-sizing: border-box;
  &.fr-edit-error { border-color: $danger; background: #FEF2F2; }
}

/* 行悬停 */
.fr-row:hover .fr-td { background: #F8FAFC; }
.fr-row-hover .fr-td-index { color: $accent; font-weight: 600; }

/* Tooltip */
.fr-tip {
  position: fixed; z-index: 9999; padding: 8px 12px; background: #1E293B;
  color: #E2E8F0; font-size: 12px; border-radius: 6px; box-shadow: 0 4px 16px rgba(0,0,0,.25);
  pointer-events: none; max-width: 280px; line-height: 1.5;
  p { margin: 4px 0 0; color: #94A3B8; font-size: 11px; }
}

/* Drawer */
.fr-drawer-mask {
  position: fixed; inset: 0; z-index: 2000; background: rgba(0,0,0,.35);
  backdrop-filter: blur(2px);
}
.fr-drawer {
  position: fixed; right: 0; top: 0; bottom: 0; width: 420px; max-width: 90vw;
  background: $surface; box-shadow: -4px 0 24px rgba(0,0,0,.12);
  display: flex; flex-direction: column; animation: fr-slide-in .25s ease-out;
}
@keyframes fr-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
.fr-drawer-enter-active, .fr-drawer-leave-active { transition: all .25s; }
.fr-drawer-enter-from, .fr-drawer-leave-to { transform: translateX(100%); opacity: 0; }

.fr-drawer-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid $border;
  h3 { margin: 0; font-size: 15px; font-weight: 600; }
}
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
  padding: 2px 10px; font-size: 11px;
  background: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 4px;
  color: #4F46E5; cursor: pointer; transition: all .15s;
  &:hover { background: #E0E7FF; border-color: #A5B4FC; }
}
.fr-ds-warn { background: $anomaly-bg; border: 1px solid $anomaly-border; border-radius: 8px; padding: 12px; }
.fr-ds-warn p { margin: 0; color: $danger; font-size: 12px; }

/* 历史记录 */
.fr-history-list { display: flex; flex-direction: column; gap: 6px; }
.fr-hist-item { display: flex; align-items: center; gap: 10px; font-size: 12px; padding: 6px 8px; background: #F8FAFC; border-radius: 4px; }
.fr-hist-period { color: $text-muted; min-width: 70px; }
.fr-hist-val { font-weight: 600; font-family: monospace; min-width: 80px; }
.fr-hist-diff.up { color: $success; }
.fr-hist-diff.down { color: $danger; }

/* 审核记录 */
.fr-audit-list { display: flex; flex-direction: column; gap: 4px; }
.fr-audit-item { display: flex; align-items: center; gap: 8px; font-size: 11px; padding: 4px 0; border-bottom: 1px solid $border-light; }
.fr-audit-time { color: $text-muted; min-width: 110px; }
.fr-audit-action.create { color: $accent; }
.fr-audit-action.edit { color: $warning; }
.fr-audit-action.submit { color: $success; }
.fr-audit-action.return { color: $danger; }
.fr-audit-user { color: $text-secondary; }

/* Toast */
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

/* Fade */
.fr-fade-enter-active, .fr-fade-leave-active { transition: opacity .15s; }
.fr-fade-enter-from, .fr-fade-leave-to { opacity: 0; }

/* 隐藏列 */
.fr-col-hidden { display: none; }
</style>
