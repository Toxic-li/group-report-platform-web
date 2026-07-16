<template>
  <div class="designer-app" v-loading="loading">
    <DesignerProvider>
      <!-- 顶部 Header -->
      <AppHeader
        :saving="saving"
        :publishing="publishing"
        @save="handleSaveTemplate"
        @saveAs="handleSaveAs"
        @history="handleHistory"
        @preview="handlePreview"
        @publish="handlePublishTemplate"
        @share="handleShare"
        @exportExcel="handleExportExcel"
        @exportPDF="handleExportPDF"
        @print="handlePrint"
        @templateLibrary="handleTemplateLibrary"
        @toggleFullscreen="toggleFullscreen"
        @toggleHelp="showHelp"
        @openAI="handleOpenAI"
        @importExcel="handleImportExcel"
        @showTemplateProps="openTemplateProps"
      />

      <!-- Ribbon 工具栏 -->
      <RibbonToolbar
        @undo="handleUndo"
        @redo="handleRedo"
        @cut="handleCut"
        @copy="handleCopy"
        @paste="handlePaste"
        @formatPainter="handleFormatPainter"
        @mergeCells="handleMergeCells"
        @splitCells="handleSplitCells"
        @freezeRows="freezeRows"
        @freezeCols="freezeCols"
        @conditionalFormat="handleConditionalFormat"
        @addCol="handleAddCol"
        @addRow="handleAddRow"
        @deleteCol="handleDeleteCol"
        @deleteRow="handleDeleteRow"
        @insertFunction="insertFunction"
        @showHelp="showHelp"
        @toggleFullscreen="toggleFullscreen"
        @showPermission="showPermissionDialog"
        @showExtension="showExtensionDialog"
      />

      <!-- 公式栏 -->
      <FormulaBar
        v-model:displayValue="formulaBarDisplay"
        @cancelEdit="cancelEdit"
        @confirmEdit="commitEditFromBar"
        @insertFunction="insertFunction"
        @openFormulaCenter="openFormulaWizard"
      />

      <!-- 主工作区 -->
      <div class="main-workspace">
        <DataPanel />
        <div class="center-area">
          <ReportCanvas />
        </div>
        <PropertyPanel
          @openConditionalFormat="handleConditionalFormat"
          @openPermission="showPermissionDialog"
          @openExtension="showExtensionDialog"
          @openFormulaCenter="openFormulaWizard"
          @openAI="handleOpenAI"
        />
      </div>

      <!-- 底部状态栏 -->
      <StatusBar />

      <!-- 模板属性弹窗 -->
      <el-dialog v-model="showTemplateProps" title="模板属性" width="500px" destroy-on-close>
        <div class="tp-form">
          <div class="tp-field">
            <label>模板名称 *</label>
            <el-input v-model="template.name" placeholder="如：煤炭生产销售库存表" />
          </div>
          <div class="tp-field">
            <label>模板编码 *</label>
            <el-input v-model="template.code" placeholder="如：RPT-COAL-001" />
          </div>
          <div class="tp-row">
              <div class="tp-field">
                <label>模板类型</label>
                <el-select v-model="template.templateType" style="width:100%">
                  <el-option :value="1" label="统计报表" />
                  <el-option :value="2" label="填报报表" />
                  <el-option :value="3" label="汇总报表" />
                </el-select>
              </div>
              <div class="tp-field">
                <label>报表分类</label>
                <el-select v-model="template.categoryId" style="width:100%">
                  <el-option :value="1" label="生产类" />
                  <el-option :value="2" label="财务类" />
                  <el-option :value="3" label="安全类" />
                  <el-option :value="4" label="能源类" />
                  <el-option :value="5" label="成本类" />
                  <el-option :value="6" label="计划类" />
                  <el-option :value="7" label="综合类" />
                  <el-option :value="8" label="投资类" />
                </el-select>
              </div>
            </div>
            <div class="tp-row">
              <div class="tp-field">
                <label>状态</label>
                <el-select v-model="template.status" style="width:100%">
                  <el-option value="draft" label="草稿" />
                  <el-option value="published" label="已发布" />
                  <el-option value="disabled" label="已停用" />
                </el-select>
              </div>
              <div class="tp-field">
                <label>是否计划模板</label>
                <el-select v-model="template.planFlag" style="width:100%">
                  <el-option :value="false" label="普通模板" />
                  <el-option :value="true" label="计划模板" />
                </el-select>
              </div>
            </div>
          <div class="tp-field">
            <label>描述</label>
            <el-input v-model="template.description" type="textarea" rows="3" placeholder="报表用途说明" />
          </div>
        </div>
        <template #footer>
          <el-button @click="showTemplateProps = false">取消</el-button>
          <el-button type="primary" @click="handleSaveTemplate">保存</el-button>
        </template>
      </el-dialog>

      <!-- 另存为弹窗 -->
      <el-dialog v-model="saveAsDialog.visible" title="另存为" width="450px" destroy-on-close>
        <div class="tp-form">
          <div class="tp-field">
            <label>新模板名称 *</label>
            <el-input v-model="saveAsDialog.name" placeholder="输入新模板名称" />
          </div>
          <div class="tp-field">
            <label>新模板编码 *</label>
            <el-input v-model="saveAsDialog.code" placeholder="输入新模板编码" />
          </div>
          <div class="tp-field">
            <label>描述</label>
            <el-input v-model="saveAsDialog.description" type="textarea" rows="3" placeholder="模板描述" />
          </div>
        </div>
        <template #footer>
          <el-button @click="saveAsDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="confirmSaveAs" :disabled="!saveAsDialog.name || !saveAsDialog.code">保存</el-button>
        </template>
      </el-dialog>

      <!-- 函数选择弹窗 -->
      <FunctionPickerDialog
        v-model="showFunctionPicker"
        @select="handleFunctionSelect"
      />

      <!-- 公式设计器弹窗 -->
      <Teleport to="body">
        <FormulaEditor
          v-if="formulaWizard.visible"
          :cell-info="formulaWizard.cellInfo"
          :initial-value="formulaWizard.initialValue"
          :row-fields="formulaWizard.rowFields"
          :col-fields="formulaWizard.colFields"
          :template-id="template.value?.id"
          @apply="onFormulaWizardApply"
          @close="formulaWizard.visible = false"
        />
      </Teleport>
    </DesignerProvider>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, provide, nextTick, unref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { loadTemplate, saveTemplate, updateTemplate, publishTemplate } from '@/api/reportDesigner.js'
import { useNavigation } from '@/composables/useNavigation.js'

import DesignerProvider from './DesignerProvider.vue'
import AppHeader from './components/AppHeader.vue'
import RibbonToolbar from './components/RibbonToolbar.vue'
import DataPanel from './components/DataPanel.vue'
import ReportCanvas from './components/ReportCanvas.vue'
import PropertyPanel from './components/PropertyPanel.vue'
import FormulaBar from './components/FormulaBar.vue'
import FormulaEditor from '@/components/FormulaEditor.vue'
import FunctionPickerDialog from './components/FunctionPickerDialog.vue'
import StatusBar from './components/StatusBar.vue'

import { designerRef } from './composables/useDesigner.js'

const router = useRouter()
const route = useRoute()
const { recordPath } = useNavigation()

const loading = ref(false)
const saving = ref(false)
const publishing = ref(false)
const showTemplateProps = ref(false)

// 公式设计器弹窗状态
const formulaWizard = ref({
  visible: false,
  cellInfo: '',
  initialValue: '',
  rowFields: [],
  colFields: []
})

const template = ref({
  id: null,
  code: '',
  name: '未命名报表',
  version: 1,
  status: 'draft',
  templateType: 2,
  description: '',
  periodType: 'month',
  auditRequired: false,
})

const autoSaveStatus = ref('saved')
const formulaBarDisplay = ref('')
const showFunctionPicker = ref(false)

const saveAsDialog = ref({
  visible: false,
  name: '',
  code: '',
  description: ''
})

// Provide 共享状态给子组件
provide('designerTemplate', template)
provide('designerAutoSave', autoSaveStatus)

// ==================== 公式栏与选中单元格同步 ====================
// 当选中单元格变化时，更新公式栏显示
watch(() => {
  const d = getDesigner()
  if (!d || !d.selectedRegion) return null
  if (d.selectedRegion.type === 'cell' && d.selectedRegion.rowNodeId && d.selectedRegion.colNodeId) {
    return { row: d.selectedRegion.rowNodeId, col: d.selectedRegion.colNodeId }
  }
  return null
}, (sel) => {
  const d = getDesigner()
  if (!d || !sel) {
    formulaBarDisplay.value = ''
    return
  }
  // 优先显示公式表达式，无公式则显示原始值
  const formula = d.getCellFormula ? d.getCellFormula(sel.row, sel.col) : null
  if (formula) {
    formulaBarDisplay.value = formula
  } else {
    const raw = d.getCellRawValue ? d.getCellRawValue(sel.row, sel.col) : d.getCellValue(sel.row, sel.col)
    formulaBarDisplay.value = raw != null ? String(raw) : ''
  }
}, { immediate: true })

// ==================== 公式向导 ====================

function openFormulaWizard({ cell, formula }) {
  const d = getDesigner()
  if (!d) return

  // unref 安全解包：处理 ref/computed 和已解包的值两种情况
  let rawRows = unref(d.flatRowTree)
  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    const rowTreeVal = unref(d.rowTree) || []
    if (Array.isArray(rowTreeVal) && rowTreeVal.length > 0) {
      rawRows = []
      const flatten = (tree) => {
        if (!Array.isArray(tree)) return
        for (const n of tree) {
          rawRows.push(n)
          if (n.children?.length) flatten(n.children)
        }
      }
      flatten(rowTreeVal)
    }
  }
  if (!Array.isArray(rawRows)) rawRows = []

  // 列叶子：优先 flatColumnLeaves，如果是完整树则手动提取叶子
  let rawCols = unref(d.flatColumnLeaves)
  if (!Array.isArray(rawCols) || rawCols.length === 0) {
    const colTree = unref(d.columnTree) || []
    if (Array.isArray(colTree)) {
      rawCols = []
      const extractLeaves = (tree) => {
        if (!Array.isArray(tree)) return
        for (const n of tree) {
          if (!n.children || n.children.length === 0) rawCols.push(n)
          else extractLeaves(n.children)
        }
      }
      extractLeaves(colTree)
    }
  }
  if (!Array.isArray(rawCols)) rawCols = []

  const rowFields = rawRows
    .filter(r => !r.isSummary)
    .map(r => ({ id: r.id, name: r.name, type: r.type || 'data' }))

  const colFields = rawCols
    .map(c => ({ id: c.id, title: c.name || c.title || c.id, type: c.type || 'data' }))

  // 当前选中单元格信息
  let cellInfo = cell || ''
  const sel = unref(d.selectedRegion)
  if (sel?.type === 'cell' && sel.rowNodeId && sel.colNodeId) {
    const rowNode = rawRows.find(r => r.id === sel.rowNodeId)
    const colNode = rawCols.find(c => c.id === sel.colNodeId)
    cellInfo = `${rowNode?.name || ''} / ${colNode?.name || colNode?.title || ''}`
  }

  formulaWizard.value = {
    visible: true,
    cellInfo,
    initialValue: formula || formulaBarDisplay.value || '',
    rowFields,
    colFields
  }
}

function onFormulaWizardApply(formulaData) {
  const d = getDesigner()
  if (!d) return

  const sel = unref(d.selectedRegion)
  if (!sel || sel.type !== 'cell' || !sel.rowNodeId || !sel.colNodeId) {
    ElMessage.warning('请先选中数据单元格')
    return
  }

  const { rowNodeId, colNodeId } = sel
  const expr = formulaData.expression
  const rawExpr = formulaData.rawExpression || expr.replace(/^=/, '')

  // 汇总行不支持整行公式
  if (formulaData.applyToRow) {
    let rawRows = unref(d.flatRowTree) || []
    const rowNode = rawRows.find(r => r.id === rowNodeId)
    if (rowNode?.isSummary) {
      ElMessage.warning('汇总行不支持整行公式')
      return
    }
  }

  d.pushHistory()

  // 获取列叶子节点
  let rawCols = unref(d.flatColumnLeaves) || []
  if (!Array.isArray(rawCols) || rawCols.length === 0) {
    const colTree = unref(d.columnTree) || []
    rawCols = []
    const extractLeaves = (tree) => {
      if (!Array.isArray(tree)) return
      for (const n of tree) {
        if (!n.children || n.children.length === 0) rawCols.push(n)
        else extractLeaves(n.children)
      }
    }
    extractLeaves(colTree)
  }

  // 确定要应用的列：整行时应用所有列，否则只应用当前列
  const targetCols = formulaData.applyToRow ? rawCols : [{ id: colNodeId }]

  for (const col of targetCols) {
    const colTargetCell = `${rowNodeId}:${col.id}`
    // 把表达式中的当前列 colNodeId 替换为目标列 col.id
    let colExpr = expr
    let colRawExpr = rawExpr
    if (col.id !== colNodeId) {
      const esc = colNodeId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const re = new RegExp(esc, 'g')
      colExpr = expr.replace(re, col.id)
      colRawExpr = rawExpr.replace(re, col.id)
    }

    // 所有公式都添加到 metrics，通过 category 区分类型
    const existing = unref(d.metrics)?.find(m => m.targetCell === colTargetCell)
    if (existing) {
      d.updateMetric(existing.field, {
        expression: colRawExpr,
        resultType: formulaData.resultType || 'number',
        targetCell: colTargetCell,
        dependencies: formulaData.dependencies || [],
        label: formulaData.label || '',
        status: existing.status ?? 1,
        type: 'formula',
        category: formulaData.formulaType === 'cell' ? 'cell' : 'metric',
      })
    } else {
      d.addMetric({
        field: `formula_${Date.now().toString(36)}_${col.id}`,
        label: formulaData.label || '',
        expression: colRawExpr,
        resultType: formulaData.resultType || 'number',
        targetCell: colTargetCell,
        dependencies: formulaData.dependencies || [],
        calcTrigger: 'save',
        status: 1,
        type: 'formula',
        category: formulaData.formulaType === 'cell' ? 'cell' : 'metric',
      })
    }
    d.setCellValue(rowNodeId, col.id, colExpr)
  }

  ElMessage.success(formulaData.applyToRow ? '公式已应用到整行' : '公式已保存')
  formulaBarDisplay.value = expr
  formulaWizard.value.visible = false
}

// ==================== 模板加载 ====================
onMounted(() => {
  // 记录导航历史，确保返回按钮正常工作
  recordPath(route.fullPath)

  const tid = route.query.templateId || route.params.code
  // 从新建弹窗跳转时，query 带了 name/templateType，先预填避免默认值闪烁
  if (route.query.name) {
    template.value.name = route.query.name
  }
  if (route.query.templateType) {
    template.value.templateType = Number(route.query.templateType)
  }
  if (tid) {
    loadTemplateData(tid)
  } else {
    const d = getDesigner()
    if (d) {
      d.initDemoData()
    }
  }
})

async function loadTemplateData(idOrCode) {
  loading.value = true
  try {
    const data = await loadTemplate(idOrCode)
    if (data) {
      template.value = { ...template.value, ...data }
      // 确保关键字段明确赋值，防止后端数据缺失时使用默认值
      if (data.name !== undefined) template.value.name = data.name
      if (data.templateType !== undefined) template.value.templateType = data.templateType
      const d = getDesigner()
      if (d) {
        d.loadFromTemplate(data)
      }
    }
  } catch (e) {
    console.error('加载模板失败:', e)
    ElMessage.error('加载模板失败')
  } finally {
    loading.value = false
  }
}

// ==================== 保存操作 ====================
/**
 * 序列化设计器状态为后端 ReportDesignerTemplateVO 结构
 */
function buildTemplatePayload() {
  const d = getDesigner()
  if (!d) return null
  const vo = d.serializeToVO()
  // 同步 index.vue template 与 designer 内部 template（AppHeader 内联编辑会修改后者）
  template.value.name = vo.name
  template.value.code = vo.code
  template.value.templateType = vo.templateType ?? template.value.templateType
  template.value.description = vo.description
  template.value.periodType = vo.periodType
  template.value.auditRequired = vo.auditRequired
  return vo
}

async function handleSaveTemplate() {
  if (!template.value.name) {
    ElMessage.warning('请输入模板名称')
    return
  }
  const payload = buildTemplatePayload()
  if (!payload) {
    ElMessage.error('设计器未就绪')
    return
  }
  saving.value = true
  autoSaveStatus.value = 'saving'
  try {
    if (template.value.id) {
      // 更新
      await updateTemplate(template.value.id, payload)
    } else {
      // 新建
      const res = await saveTemplate(payload)
      // http 工具已解包 Result.data，res 通常就是新模板ID（数字）；兼容对象返回
      const newId = res?.id ?? res?.data ?? res
      if (newId) template.value.id = newId
    }

    // 保存数据源关联
    await saveDataSourceAssociation()

    autoSaveStatus.value = 'saved'
    showTemplateProps.value = false
    ElMessage.success('保存成功')
  } catch (e) {
    autoSaveStatus.value = 'unsaved'
    ElMessage.error('保存失败：' + (e.message || e))
    console.error(e)
  } finally {
    saving.value = false
  }
}

async function saveDataSourceAssociation() {
  const d = getDesigner()
  if (!d || !d.dataSource || !template.value.id) return

  const { sourceId } = d.dataSource
  if (!sourceId) return

  try {
    const { setTemplateDataSource } = await import('@/api/reportEngine')
    await setTemplateDataSource(template.value.id, d.dataSource)
    console.log('数据源关联保存成功')
  } catch (e) {
    console.warn('数据源关联保存失败:', e)
  }
}

function openTemplateProps() {
  // 打开模板属性弹窗前，从 designer 内部 template 同步最新值到 index.vue template
  const d = getDesigner()
  if (d?.template) {
    template.value.name = d.template.name
    template.value.code = d.template.code
    template.value.templateType = d.template.templateType ?? 2
    template.value.description = d.template.description || ''
    template.value.periodType = d.template.periodType || 'month'
    template.value.auditRequired = d.template.auditRequired ?? false
  }
  showTemplateProps.value = true
}

function handleSaveAs() {
  saveAsDialog.value = {
    visible: true,
    name: template.value.name + ' (副本)',
    code: template.value.code + '_COPY',
    description: template.value.description
  }
}

async function confirmSaveAs() {
  const { name, code, description } = saveAsDialog.value
  try {
    const payload = buildTemplatePayload()
    if (!payload) return
    const newTpl = {
      ...payload,
      id: null,
      name, code, description,
      version: 1,
      status: 'draft',
    }
    const res = await saveTemplate(newTpl)
    const newId = res?.id ?? res?.data ?? res
    if (newId) {
      template.value.id = newId
      template.value.name = name
      template.value.code = code
    }
    saveAsDialog.value.visible = false
    ElMessage.success('另存为成功')
  } catch (e) {
    ElMessage.error('另存为失败')
  }
}

// ==================== 发布操作 ====================
async function handlePublishTemplate() {
  if (!template.value.id) {
    ElMessage.warning('请先保存模板')
    return
  }
  try {
    await ElMessageBox.confirm('发布后将不可修改，确定发布吗？', '发布确认', { type: 'warning' })
    publishing.value = true
    await publishTemplate(template.value.id)
    template.value.status = 'published'
    ElMessage.success('发布成功')
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('发布失败')
  } finally {
    publishing.value = false
  }
}

// ==================== 预览 ====================
function handlePreview() {
  if (!template.value.id) {
    ElMessage.warning('请先保存模板')
    return
  }
  window.open(`/preview/${template.value.id}`, '_blank')
}

// ==================== 导出/导入 ====================
async function handleExportExcel() {
  if (!template.value.id) { ElMessage.warning('请先保存模板'); return }
  try {
    const { exportTemplateExcel } = await import('@/api/reportDesigner.js')
    const blob = await exportTemplateExcel(template.value.id)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${template.value.name}_${new Date().toISOString().slice(0,10)}.xlsx`
    a.click(); URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (e) {
    ElMessage.error('导出失败: ' + (e.message || e))
  }
}

async function handleImportExcel() {
  ElMessage.info('导入功能：请使用模板管理页面的导入功能')
}

async function handleHistory() {
  const d = getDesigner()
  if (!d) return
  const count = d.history.length
  const idx = d.historyIndex
  ElMessage.info(`版本历史：共 ${count} 条记录，当前第 ${idx + 1} 条`)
}
function handleShare() { ElMessage.info('分享功能：可生成分享链接并设置权限') }
function handleExportPDF() { ElMessage.info('PDF 导出：请先导出 Excel 后转换') }
function handlePrint() { window.print() }
function handleOpenAI() { ElMessage.info('AI 设计助手开发中') }

function handleTemplateLibrary() {
  router.push('/designer/templates')
}

// ==================== 工具栏操作（通过模块级引用操作） ====================
function getDesigner() { return designerRef.state }

function handleUndo() {
  const d = getDesigner()
  if (d && d.canUndo) { d.undo(); ElMessage.success('已撤销') }
}
function handleRedo() {
  const d = getDesigner()
  if (d && d.canRedo) { d.redo(); ElMessage.success('已重做') }
}
function handleCut() {
  ElMessage.info('剪切：请直接删除行/列维度')
}
function handleCopy() {
  ElMessage.info('复制：请使用 Ctrl+C 复制单元格内容')
}
function handlePaste() {
  ElMessage.info('粘贴：请使用 Ctrl+V 粘贴单元格内容')
}
function handleFormatPainter() {
  ElMessage.info('格式刷功能开发中')
}
function handleMergeCells() {
  ElMessage.info('合并单元格：在选中行/列时点击"添加子行"')
}
function handleSplitCells() {
  ElMessage.info('拆分单元格功能开发中')
}
function freezeRows() {
  const d = getDesigner()
  if (!d) return
  d.layout.freezeRows = d.selectedRegion?.rowNodeId ? flatRowIndex(d) : 0
  ElMessage.success(`已冻结前 ${d.layout.freezeRows} 行`)
}
function freezeCols() {
  const d = getDesigner()
  if (!d) return
  d.layout.freezeCols = d.selectedRegion?.colNodeId ? flatColIndex(d) : 0
  ElMessage.success(`已冻结前 ${d.layout.freezeCols} 列`)
}
function flatRowIndex(d) {
  if (!d.selectedRegion?.rowNodeId) return 0
  return d.flatRowTree.value.findIndex(n => n.id === d.selectedRegion.rowNodeId) + 1
}
function flatColIndex(d) {
  if (!d.selectedRegion?.colNodeId) return 0
  // 多行表头下，列号按叶子列编号（父分组节点不占独立列号）
  const leafIdx = d.flatColumnLeaves && d.flatColumnLeaves.value
    ? d.flatColumnLeaves.value.findIndex(n => n.id === d.selectedRegion.colNodeId)
    : -1
  if (leafIdx >= 0) return leafIdx + 1
  return d.flatColumnTree.value.findIndex(n => n.id === d.selectedRegion.colNodeId) + 1
}
function handleConditionalFormat() {
  ElMessage.info('条件格式：请在右侧"高级"面板配置')
}

function handleAddCol() {
  const d = getDesigner()
  if (d) {
    const newCol = d.addColNode()
    if (newCol) {
      d.selectRegion('col', null, newCol.id)
      ElMessage.success('已添加列维度')
    }
  }
}
function handleAddRow() {
  const d = getDesigner()
  if (d) {
    const newRow = d.addRowNode()
    if (newRow) {
      d.selectRegion('row', newRow.id, null)
      ElMessage.success('已添加行维度')
    }
  }
}
function handleDeleteCol() {
  const d = getDesigner()
  if (!d || !d.selectedRegion?.colNodeId) {
    ElMessage.warning('请先选择要删除的列维度')
    return
  }
  ElMessageBox.confirm(`确定删除列维度？`, '删除列', {
    confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    d.deleteColNode(d.selectedRegion.colNodeId)
    ElMessage.success('已删除列')
  }).catch(() => {})
}
function handleDeleteRow() {
  const d = getDesigner()
  if (!d || !d.selectedRegion?.rowNodeId) {
    ElMessage.warning('请先选择要删除的行维度')
    return
  }
  ElMessageBox.confirm(`确定删除行维度？`, '删除行', {
    confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    d.deleteRowNode(d.selectedRegion.rowNodeId)
    ElMessage.success('已删除行')
  }).catch(() => {})
}

function cancelEdit() { formulaBarDisplay.value = '' }
function commitEditFromBar() {
  const d = getDesigner()
  if (!d || !d.selectedRegion) return
  const value = formulaBarDisplay.value
  if (value == null || value === '') return
  // 公式栏编辑只在选中单元格时生效
  if (d.selectedRegion.type === 'cell' && d.selectedRegion.rowNodeId && d.selectedRegion.colNodeId) {
    d.pushHistory()
    d.setCellValue(d.selectedRegion.rowNodeId, d.selectedRegion.colNodeId, value)
    ElMessage.success('已保存')
  } else {
    ElMessage.info('请先选中数据单元格')
  }
}
function insertFunction() {
  showFunctionPicker.value = true
}

function handleFunctionSelect(func) {
  // 构造函数插入文本
  const paramCount = func.params?.length || 0
  const requiredParams = func.params?.filter(p => p.required)?.length || 0
  // 生成参数占位符
  const placeholders = []
  if (func.params) {
    func.params.forEach((p, i) => {
      if (i < Math.max(requiredParams, 1)) {
        placeholders.push('')
      }
    })
  }
  const funcText = `=${func.name}(${placeholders.join(', ')})`

  const d = getDesigner()
  if (d && d.selectedRegion?.type === 'cell' && d.selectedRegion.rowNodeId && d.selectedRegion.colNodeId) {
    // 有选中单元格：直接写入
    d.pushHistory()
    d.setCellValue(d.selectedRegion.rowNodeId, d.selectedRegion.colNodeId, funcText)
    formulaBarDisplay.value = funcText
    ElMessage.success(`已插入函数 ${func.name}`)
  } else {
    // 无选中单元格：填入公式栏
    formulaBarDisplay.value = funcText
    ElMessage.info(`请在公式栏编辑后点击确认按钮`)
  }
}
function showHelp() {
  ElMessageBox.alert(
    '快捷键：\nCtrl+S 保存 | Ctrl+Z 撤销 | Ctrl+Y 重做\n\n报表设计器用于创建结构化报表模板（行维度 × 列维度 × 指标）',
    '使用帮助',
    { confirmButtonText: '知道了' }
  )
}
function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen()
    ElMessage.info('已退出全屏')
  } else {
    document.documentElement.requestFullscreen()
    ElMessage.success('已进入全屏')
  }
}
function showPermissionDialog() {
  ElMessageBox.alert('权限控制：可设置模板的查看、编辑、审批权限', '权限控制', { confirmButtonText: '关闭' })
}
function showExtensionDialog() {
  ElMessageBox.alert('扩展设置：自定义校验规则、消息模板、流程节点等', '扩展设置', { confirmButtonText: '关闭' })
}

</script>

<style scoped>
.designer-app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: #f5f7fa;
}

.main-workspace {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.center-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* 弹窗表单样式 */
.tp-form { display: flex; flex-direction: column; gap: 16px; }
.tp-field { display: flex; flex-direction: column; gap: 6px; }
.tp-field label { font-size: 13px; font-weight: 500; color: #333; }
.tp-row { display: flex; gap: 12px; }
.tp-row .tp-field { flex: 1; }
</style>
