<template>
  <div class="de-page">
    <ReportHeader
      :entry="entryDetail"
      @back="handleBack"
      @showHistory="showHistory = true"
      @showReview="showReviewDialog = true"
    />

    <EntryToolbar
      v-model:activePanel="activePanel"
      :isSaved="isSaved"
      :isSaving="isSaving"
      :lastSaved="lastSavedText"
      @save="handleSave"
      @validate="handleValidate"
      @refresh="handleRefresh"
      @import="showImportDialog = true"
      @export="handleExport"
    />

    <div class="de-content">
      <Spreadsheet
        v-if="activePanel === 'spreadsheet'"
        :columns="columns"
        :rows="rows"
        :cellData="cellData"
        :validationErrors="validationErrorObjects"
        :editable="isEditable"
        @cellChange="handleCellChange"
        @navigate="handleSheetNavigate"
      />

      <ValidationPanel
        v-if="activePanel === 'validation'"
        :errors="validationErrorObjects"
        @validate="handleValidate"
        @locateError="handleLocateError"
      />

      <AttachmentPanel
        v-if="activePanel === 'attachment'"
        :attachments="attachments"
        :editable="isEditable"
        @upload="handleUpload"
        @download="handleDownload"
        @delete="handleDeleteAttachment"
      />
    </div>

    <SubmitFooter
      :filledCount="filledCount"
      :totalCells="totalEditableCells"
      :validationErrorCount="validationErrorObjects.length"
      :reviewOpinion="showReviewBanner ? entryDetail.reviewOpinion : ''"
      :reviewItems="entryDetail.reviewItems || []"
      :status="entryDetail.status"
      @save="handleSave"
      @submit="handleSubmit"
      @dismissReview="showReviewBanner = false"
    />

    <el-dialog title="历史记录" v-model="showHistory" width="560px">
      <div class="de-history-list">
        <div class="de-history-item" v-for="item in historyList" :key="item.id">
          <div class="de-history-time">{{ formatDateTime(item.operationTime) }}</div>
          <div class="de-history-body">
            <span class="de-history-user">{{ item.operatorName }}</span>
            <span class="de-history-action">{{ getOperationText(item.operationType) }}</span>
            <span class="de-history-detail">{{ item.content }}</span>
          </div>
        </div>
        <p v-if="historyList.length === 0" class="de-history-empty">暂无操作记录</p>
      </div>
    </el-dialog>

    <el-dialog title="审核退回意见" v-model="showReviewDialog" width="480px">
      <div class="de-review-dialog">
        <div class="de-review-dialog-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--app-warning)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <p class="de-review-dialog-reason">{{ entryDetail.reviewOpinion || '无具体原因' }}</p>
        <div v-if="entryDetail.reviewItems && entryDetail.reviewItems.length > 0" class="de-review-dialog-items">
          <p class="de-review-dialog-items-title">需要修改的内容：</p>
          <ul>
            <li v-for="(item, idx) in entryDetail.reviewItems" :key="idx">{{ item }}</li>
          </ul>
        </div>
        <p class="de-review-dialog-hint">请修改后重新提交审核</p>
      </div>
      <template #footer>
        <el-button @click="showReviewDialog = false">关闭</el-button>
        <el-button type="primary" @click="showReviewDialog = false">开始修改</el-button>
      </template>
    </el-dialog>

    <el-dialog title="提交确认" v-model="showSubmitConfirm" width="440px">
      <div class="de-submit-confirm">
        <div class="de-submit-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--app-warning)" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <p class="de-submit-title">{{ entryDetail.status === 'rejected' ? '确认重新提交？' : '确认提交报表？' }}</p>
        <p class="de-submit-desc">提交后报表将进入审核流程，请确保数据准确无误。</p>
        <textarea v-model="submitRemark" class="de-submit-remark" placeholder="填写提交备注（可选）" rows="3"></textarea>
      </div>
      <template #footer>
        <el-button @click="showSubmitConfirm = false">取消</el-button>
        <el-button type="primary" @click="confirmSubmit">确认提交</el-button>
      </template>
    </el-dialog>

    <el-dialog title="导入数据" v-model="showImportDialog" width="480px">
      <div class="de-import-dialog">
        <el-upload
          class="de-import-upload"
          drag
          :auto-upload="false"
          :on-change="handleFileChange"
          :before-upload="beforeUpload"
          :limit="1"
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--app-primary)" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <p>将 Excel 文件拖到此处，或 <em>点击选择</em></p>
          <div class="de-import-tips">
            <span>支持格式：.xlsx、.xls</span>
          </div>
        </el-upload>
      </div>
      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmImport" :loading="isImporting">确认导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNavigation } from '@/composables/useNavigation.js'
import {
  getEntryDetail, saveDraft, submitForReview, getEntryHistory,
  getAttachments, uploadAttachment, downloadAttachment, deleteAttachment,
  validateData, importFromExcel, exportToExcel,
} from '@/api/filling'
import { loadTemplate } from '@/api/reportDesigner.js'

import { ElMessage } from 'element-plus'
import ReportHeader from './components/ReportHeader.vue'
import EntryToolbar from './components/EntryToolbar.vue'
import Spreadsheet from './components/Spreadsheet.vue'
import ValidationPanel from './components/ValidationPanel.vue'
import AttachmentPanel from './components/AttachmentPanel.vue'
import SubmitFooter from './components/SubmitFooter.vue'

const router = useRouter()
const route = useRoute()
const { navigateBack } = useNavigation()

const mode = ref('edit')
const templateId = ref(null)
const submitId = ref(null)

const entryDetail = ref({
  submitId: null, reportId: null, reportName: '', reportCode: '',
  period: '', deadline: '', status: 'filling', category: '',
  creatorName: '', progress: 0, reviewOpinion: '', reviewItems: [],
  cells: [], attachments: [],
})

const activePanel = ref('spreadsheet')
const isSaved = ref(true)
const isSaving = ref(false)
const lastSavedTime = ref(null)
const validationErrorObjects = ref([])
const historyList = ref([])
const attachments = ref([])
const cellData = ref({})
const showReviewBanner = ref(true)

const showHistory = ref(false)
const showReviewDialog = ref(false)
const showSubmitConfirm = ref(false)
const showImportDialog = ref(false)
const submitRemark = ref('')
const isImporting = ref(false)
const importFile = ref(null)

const columns = ref([])
const rows = ref([])

let autoSaveTimer = null

const isEditable = computed(() => {
  return ['draft', 'filling', 'rejected', 'withdrawn'].includes(entryDetail.value.status)
})

const totalEditableCells = computed(() => {
  let count = 0
  for (let r = 0; r < rows.value.length; r++) {
    for (let c = 0; c < columns.value.length; c++) {
      const cell = getCell(r, c)
      if (!cell?.isLocked) count++
    }
  }
  return count
})

const filledCount = computed(() => {
  let count = 0
  for (let r = 0; r < rows.value.length; r++) {
    for (let c = 0; c < columns.value.length; c++) {
      const cell = getCell(r, c)
      if (!cell?.isLocked && cell?.value && String(cell.value).trim()) count++
    }
  }
  return count
})

const lastSavedText = computed(() => {
  if (!lastSavedTime.value) return ''
  const d = new Date(lastSavedTime.value)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
})

function getCell(row, col) {
  const key = `${row}-${col}`
  return cellData.value[key]
}

function buildColumnsFromTemplate(templateVO) {
  const colTree = templateVO?.columnTree || []
  const headers = templateVO?.columnHeaders || []
  const cols = []
  if (headers && headers.length > 0) {
    const lastLevel = headers[headers.length - 1]
    lastLevel.forEach((h, idx) => {
      cols.push({
        index: idx,
        label: h.label || h.title || h.text || `列${idx + 1}`,
        width: h.width || 120,
        fieldType: h.fieldType || 'string',
      })
    })
  } else if (colTree && colTree.length > 0) {
    const flatten = (nodes, result) => {
      nodes.forEach(n => {
        if (n.children && n.children.length > 0) {
          flatten(n.children, result)
        } else {
          result.push({
            index: result.length,
            label: n.label || n.title || n.text || `列${result.length + 1}`,
            width: n.width || 120,
            fieldType: n.fieldType || 'string',
          })
        }
      })
      return result
    }
    flatten(colTree, cols)
  }
  return cols
}

function buildRowsFromTemplate(templateVO) {
  const rowTree = templateVO?.rowTree || []
  const rs = []
  const flatten = (nodes, result) => {
    nodes.forEach(n => {
      result.push({
        index: result.length,
        label: n.label || n.title || n.text || n.rowName || '',
        rowType: n.rowType || 'normal',
        isLocked: n.isFormula || n.locked || false,
      })
      if (n.children && n.children.length > 0) {
        flatten(n.children, result)
      }
    })
    return result
  }
  flatten(rowTree, rs)
  return rs
}

function buildCellDataFromTemplate(templateVO, dataCells) {
  const data = {}
  const formulas = templateVO?.formulas || []

  if (dataCells && dataCells.length > 0) {
    dataCells.forEach(cell => {
      const key = `${cell.rowIndex}-${cell.colIndex}`
      data[key] = {
        rowIndex: cell.rowIndex,
        colIndex: cell.colIndex,
        value: cell.value ?? '',
        cellType: cell.cellType || cell.dataType || 'string',
        isFormula: cell.isFormula || false,
        isLocked: cell.isLocked || cell.readonly || false,
      }
    })
  }

  formulas.forEach(f => {
    if (f.rowIndex !== undefined && f.colIndex !== undefined) {
      const key = `${f.rowIndex}-${f.colIndex}`
      if (!data[key]) {
        data[key] = {
          rowIndex: f.rowIndex,
          colIndex: f.colIndex,
          value: '',
          cellType: 'number',
          isFormula: true,
          isLocked: true,
          formula: f.expression || f.formula,
        }
      } else {
        data[key].isFormula = true
        data[key].isLocked = true
        data[key].formula = f.expression || f.formula
      }
    }
  })

  return data
}

async function loadByTemplate() {
  try {
    const res = await loadTemplate(templateId.value)
    const tpl = res?.data || res
    if (tpl) {
      entryDetail.value = {
        submitId: null,
        reportId: tpl.id || templateId.value,
        reportName: tpl.name || tpl.templateName || '未命名模板',
        reportCode: tpl.code || tpl.templateCode || '',
        period: '',
        deadline: '',
        status: 'filling',
        category: '',
        creatorName: '',
        progress: 0,
        reviewOpinion: '',
        reviewItems: [],
        cells: [],
        attachments: [],
      }
      columns.value = buildColumnsFromTemplate(tpl)
      rows.value = buildRowsFromTemplate(tpl)
      cellData.value = buildCellDataFromTemplate(tpl, [])
      showReviewBanner.value = false
    }
  } catch (err) {
    console.error('加载模板失败:', err)
    ElMessage.error('加载模板失败')
  }
}

async function loadBySubmit() {
  try {
    const result = await getEntryDetail(submitId.value)
    const detail = result?.data || result
    if (detail) {
      entryDetail.value = detail
      if (detail.columnTree || detail.rowTree || detail.columnHeaders) {
        columns.value = buildColumnsFromTemplate(detail)
        rows.value = buildRowsFromTemplate(detail)
        cellData.value = buildCellDataFromTemplate(detail, detail.cells || [])
      } else if (detail.cells && detail.cells.length > 0) {
        initCellDataFromDetail(detail.cells)
      }
      showReviewBanner.value = detail.status === 'rejected'
    }
  } catch {
    useMockData(submitId.value)
  }
}

function useMockData(id) {
  entryDetail.value = {
    submitId: id, reportId: 1, reportName: '月度销售报表', reportCode: 'SALES-202607',
    period: '2026年7月', deadline: '2026-07-31', status: 'filling', category: 'sales',
    creatorName: '张三', progress: 60, reviewOpinion: '', reviewItems: [],
    cells: mockCells,
  }
  columns.value = [
    { index: 0, label: '部门', width: 120 },
    { index: 1, label: '产品', width: 120 },
    { index: 2, label: '销售额', width: 150, fieldType: 'amount' },
    { index: 3, label: '成本', width: 150, fieldType: 'amount' },
    { index: 4, label: '利润', width: 150 },
  ]
  rows.value = [
    { index: 0, label: '' },
    { index: 1, label: '1' },
    { index: 2, label: '2' },
    { index: 3, label: '3' },
    { index: 4, label: '合计' },
  ]
  initCellDataFromDetail(mockCells)
}

const mockCells = [
  { rowIndex: 0, colIndex: 0, value: '部门', cellType: 'string', isFormula: false, isLocked: true },
  { rowIndex: 0, colIndex: 1, value: '产品', cellType: 'string', isFormula: false, isLocked: true },
  { rowIndex: 0, colIndex: 2, value: '销售额', cellType: 'number', isFormula: false, isLocked: true },
  { rowIndex: 0, colIndex: 3, value: '成本', cellType: 'number', isFormula: false, isLocked: true },
  { rowIndex: 0, colIndex: 4, value: '利润', cellType: 'number', isFormula: false, isLocked: true },
  { rowIndex: 1, colIndex: 0, value: '华东区', cellType: 'string', isFormula: false, isLocked: false },
  { rowIndex: 1, colIndex: 1, value: 'A产品', cellType: 'string', isFormula: false, isLocked: false },
  { rowIndex: 1, colIndex: 2, value: '125000', cellType: 'number', isFormula: false, isLocked: false },
  { rowIndex: 1, colIndex: 3, value: '85000', cellType: 'number', isFormula: false, isLocked: false },
  { rowIndex: 1, colIndex: 4, value: '40000', cellType: 'number', isFormula: true, isLocked: true },
  { rowIndex: 2, colIndex: 0, value: '华东区', cellType: 'string', isFormula: false, isLocked: false },
  { rowIndex: 2, colIndex: 1, value: 'B产品', cellType: 'string', isFormula: false, isLocked: false },
  { rowIndex: 2, colIndex: 2, value: '98000', cellType: 'number', isFormula: false, isLocked: false },
  { rowIndex: 2, colIndex: 3, value: '65000', cellType: 'number', isFormula: false, isLocked: false },
  { rowIndex: 2, colIndex: 4, value: '33000', cellType: 'number', isFormula: true, isLocked: true },
  { rowIndex: 3, colIndex: 0, value: '华南区', cellType: 'string', isFormula: false, isLocked: false },
  { rowIndex: 3, colIndex: 1, value: 'A产品', cellType: 'string', isFormula: false, isLocked: false },
  { rowIndex: 3, colIndex: 2, value: '', cellType: 'number', isFormula: false, isLocked: false },
  { rowIndex: 3, colIndex: 3, value: '', cellType: 'number', isFormula: false, isLocked: false },
  { rowIndex: 3, colIndex: 4, value: '', cellType: 'number', isFormula: true, isLocked: true },
  { rowIndex: 4, colIndex: 0, value: '合计', cellType: 'string', isFormula: false, isLocked: true },
  { rowIndex: 4, colIndex: 1, value: '', cellType: 'string', isFormula: false, isLocked: true },
  { rowIndex: 4, colIndex: 2, value: '223000', cellType: 'number', isFormula: true, isLocked: true },
  { rowIndex: 4, colIndex: 3, value: '150000', cellType: 'number', isFormula: true, isLocked: true },
  { rowIndex: 4, colIndex: 4, value: '73000', cellType: 'number', isFormula: true, isLocked: true },
]

function initCellDataFromDetail(cells) {
  cellData.value = {}
  if (cells) {
    cells.forEach(cell => {
      const key = `${cell.rowIndex}-${cell.colIndex}`
      cellData.value[key] = { ...cell }
    })
  }
}

async function loadEntryDetail() {
  if (mode.value === 'create') {
    await loadByTemplate()
  } else {
    await loadBySubmit()
  }
}

async function loadHistory() {
  if (mode.value === 'create') {
    historyList.value = []
    return
  }
  try {
    const result = await getEntryHistory(entryDetail.value.submitId)
    if (result) historyList.value = result?.data || result
  } catch {
    historyList.value = mockHistory()
  }
}

async function loadAttachments() {
  if (mode.value === 'create') {
    attachments.value = []
    return
  }
  try {
    const result = await getAttachments(entryDetail.value.submitId)
    if (result) attachments.value = result?.data || result
  } catch {
    attachments.value = mockAttachments()
  }
}

function mockHistory() {
  const id = entryDetail.value.submitId
  const now = Date.now()
  return [
    { id: 1, submitId: id, operationType: 'save', operatorName: '张三', content: '保存草稿', operationTime: new Date(now - 7200000).toISOString() },
    { id: 2, submitId: id, operationType: 'edit', operatorName: '张三', content: '修改单元格数据', operationTime: new Date(now - 3600000).toISOString() },
    { id: 3, submitId: id, operationType: 'save', operatorName: '张三', content: '保存草稿', operationTime: new Date(now - 1800000).toISOString() },
  ]
}

function mockAttachments() {
  const id = entryDetail.value.submitId
  return [
    { id: 1, submitId: id, fileName: '销售明细.xlsx', fileType: 'xlsx', fileSize: 102400, uploaderName: '张三', uploadTime: new Date().toISOString() },
  ]
}

function handleCellChange({ row, col, value }) {
  const key = `${row}-${col}`
  if (!cellData.value[key]) {
    cellData.value[key] = { rowIndex: row, colIndex: col, value: '', cellType: 'string', isFormula: false, isLocked: false }
  }
  if (cellData.value[key].value !== value) {
    cellData.value[key].value = value
    cellData.value[key].isModified = true
    isSaved.value = false
    recalcFormulas()
  }
}

function recalcFormulas() {
  const getVal = (r, c) => parseFloat(cellData.value[`${r}-${c}`]?.value || '0') || 0
  for (let r = 1; r < rows.value.length - 1; r++) {
    const sales = getVal(r, 2); const cost = getVal(r, 3)
    const key = `${r}-4`
    if (!cellData.value[key]) {
      cellData.value[key] = { rowIndex: r, colIndex: 4, value: '', cellType: 'number', isFormula: true, isLocked: true }
    }
    cellData.value[key].value = String(sales - cost)
  }
  let totalSales = 0, totalCost = 0
  for (let r = 1; r < rows.value.length - 1; r++) { totalSales += getVal(r, 2); totalCost += getVal(r, 3) }
  const totalRow = rows.value.length - 1
  cellData.value[`${totalRow}-2`] = { rowIndex: totalRow, colIndex: 2, value: String(totalSales), cellType: 'number', isFormula: true, isLocked: true }
  cellData.value[`${totalRow}-3`] = { rowIndex: totalRow, colIndex: 3, value: String(totalCost), cellType: 'number', isFormula: true, isLocked: true }
  cellData.value[`${totalRow}-4`] = { rowIndex: totalRow, colIndex: 4, value: String(totalSales - totalCost), cellType: 'number', isFormula: true, isLocked: true }
}

function handleSheetNavigate({ action }) {
  if (action === 'save') handleSave()
}

function handleLocateError(err) {
  activePanel.value = 'spreadsheet'
}

async function handleSave() {
  if (isSaving.value) return
  isSaving.value = true
  try {
    const cells = Object.values(cellData.value).map(cell => ({
      rowIndex: cell.rowIndex, colIndex: cell.colIndex,
      value: cell.value, cellType: cell.cellType, isFormula: cell.isFormula,
    }))
    const res = await saveDraft({
      submitId: entryDetail.value.submitId,
      reportId: entryDetail.value.reportId,
      templateId: templateId.value,
      cells,
      status: 'filling',
    })
    const resData = res?.data || res
    if (resData?.submitId && !entryDetail.value.submitId) {
      entryDetail.value.submitId = resData.submitId
      submitId.value = resData.submitId
    }
    isSaved.value = true
    lastSavedTime.value = Date.now()
    entryDetail.value.status = 'filling'
  } catch {
  } finally {
    isSaving.value = false
  }
}

async function handleValidate() {
  const cells = Object.values(cellData.value)
  try {
    const result = await validateData({ submitId: entryDetail.value.submitId, reportId: entryDetail.value.reportId, cells })
    validationErrorObjects.value = result?.data || result || []
  } catch {
    validationErrorObjects.value = runClientValidation()
  }
}

function runClientValidation() {
  const errors = []
  for (let r = 1; r < rows.value.length - 1; r++) {
    for (let c = 0; c < columns.value.length; c++) {
      const cell = getCell(r, c)
      if (!cell?.isLocked) {
        if (!cell?.value || !String(cell.value).trim()) {
          errors.push({ cell: `${r}-${c}`, row: r, col: c, message: `单元格 ${String.fromCharCode(65 + c)}${r + 1} 不能为空`, type: 'required' })
        } else if (cell.cellType === 'number' && isNaN(Number(cell.value))) {
          errors.push({ cell: `${r}-${c}`, row: r, col: c, message: `单元格 ${String.fromCharCode(65 + c)}${r + 1} 必须为数字`, type: 'format' })
        }
      }
    }
  }
  return errors
}

function handleSubmit() {
  if (validationErrorObjects.value.length > 0) {
    handleValidate()
    activePanel.value = 'validation'
    return
  }
  showSubmitConfirm.value = true
}

async function confirmSubmit() {
  try {
    await handleSave()
    await submitForReview({ submitId: entryDetail.value.submitId, remark: submitRemark.value })
    showSubmitConfirm.value = false
    router.push('/entry')
  } catch {
  }
}

function handleFileChange(file) {
  importFile.value = file
}

function beforeUpload(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  if (!['xlsx', 'xls'].includes(ext)) {
    ElMessage.error('仅支持 .xlsx 和 .xls 格式')
    return false
  }
  return true
}

async function confirmImport() {
  if (!importFile.value?.raw) return
  if (!entryDetail.value.submitId) {
    ElMessage.warning('请先保存后再导入数据')
    return
  }
  isImporting.value = true
  try {
    await importFromExcel(entryDetail.value.submitId, importFile.value.raw)
    showImportDialog.value = false
    await loadEntryDetail()
    ElMessage.success('导入成功')
  } catch {
    ElMessage.error('导入失败')
  } finally {
    isImporting.value = false
  }
}

function handleExport() {
  if (entryDetail.value.submitId) {
    exportToExcel(entryDetail.value.submitId)
  } else {
    ElMessage.warning('请先保存后再导出')
  }
}

function handleRefresh() {
  loadEntryDetail()
}

function handleUpload() {
  if (!entryDetail.value.submitId) {
    ElMessage.warning('请先保存后再上传附件')
    return
  }
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.pdf,.xlsx,.xls,.docx,.doc,.jpg,.png,.gif'
  input.onchange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const result = await uploadAttachment(entryDetail.value.submitId, file)
      if (result) attachments.value.push(result?.data || result)
      ElMessage.success('上传成功')
    } catch {
      ElMessage.error('上传失败')
    }
  }
  input.click()
}

function handleDownload(att) {
  downloadAttachment(att.id)
}

async function handleDeleteAttachment(att) {
  try {
    await deleteAttachment(att.id)
    const idx = attachments.value.findIndex(a => a.id === att.id)
    if (idx !== -1) attachments.value.splice(idx, 1)
  } catch {
    attachments.value = attachments.value.filter(a => a.id !== att.id)
  }
}

function formatDateTime(d) { return d ? new Date(d).toLocaleString('zh-CN') : '' }
function getOperationText(type) {
  const map = { save: '保存了', edit: '修改了', submit: '提交了', review: '审核了', approve: '通过了', reject: '退回了' }
  return map[type] || type
}

function handleBack() {
  navigateBack('/entry')
}

function startAutoSave() {
  autoSaveTimer = setInterval(() => {
    if (!isSaved.value && !isSaving.value) handleSave()
  }, 30000)
}

function stopAutoSave() {
  if (autoSaveTimer) { clearInterval(autoSaveTimer); autoSaveTimer = null }
}

function detectMode() {
  const path = route.path
  if (path.startsWith('/report/')) {
    mode.value = 'create'
    templateId.value = route.params.templateId
  } else {
    mode.value = 'edit'
    submitId.value = route.params.submitId
  }
}

onMounted(() => {
  detectMode()
  loadEntryDetail()
  loadHistory()
  loadAttachments()
  startAutoSave()
})

onUnmounted(() => { stopAutoSave() })

watch(activePanel, (p) => { if (p === 'validation') handleValidate() })
</script>

<style scoped>
.de-page {
  display: flex; flex-direction: column; height: 100vh;
  background: var(--app-bg); overflow: hidden;
}
.de-content {
  flex: 1; display: flex; flex-direction: column;
  padding: var(--app-space-4); overflow: hidden; min-height: 0;
}

.de-history-list { max-height: 320px; overflow: auto; }
.de-history-item { padding: var(--app-space-3) 0; border-bottom: 1px solid var(--app-border-light); }
.de-history-item:last-child { border-bottom: none; }
.de-history-time { font-size: 12px; color: var(--app-text-muted); margin-bottom: 2px; }
.de-history-body { font-size: 13px; color: var(--app-text-primary); }
.de-history-user { font-weight: 500; }
.de-history-action { color: var(--app-primary); margin: 0 4px; }
.de-history-detail { color: var(--app-text-secondary); }
.de-history-empty { text-align: center; padding: var(--app-space-10); color: var(--app-text-muted); font-size: 14px; }

.de-review-dialog { text-align: center; }
.de-review-dialog-icon { margin-bottom: var(--app-space-4); }
.de-review-dialog-reason { font-size: 15px; color: var(--app-text-primary); margin: 0 0 var(--app-space-4); line-height: 1.6; }
.de-review-dialog-items { text-align: left; background: var(--app-bg); padding: var(--app-space-3) var(--app-space-4); border-radius: var(--app-radius-sm); }
.de-review-dialog-items-title { font-size: 13px; font-weight: 500; color: var(--app-text-secondary); margin: 0 0 var(--app-space-2); }
.de-review-dialog-items ul { margin: 0; padding-left: var(--app-space-5); font-size: 13px; color: var(--app-text-primary); }
.de-review-dialog-items li { margin-bottom: 4px; }
.de-review-dialog-hint { font-size: 13px; color: var(--app-text-muted); margin: var(--app-space-4) 0 0; }

.de-submit-confirm { text-align: center; }
.de-submit-icon { margin-bottom: var(--app-space-4); }
.de-submit-title { font-size: 16px; font-weight: 600; color: var(--app-text-primary); margin: 0 0 var(--app-space-2); }
.de-submit-desc { font-size: 13px; color: var(--app-text-secondary); margin: 0; }
.de-submit-remark {
  width: 100%; margin-top: var(--app-space-4); padding: var(--app-space-3);
  border: 1px solid var(--app-border); border-radius: var(--app-radius-md);
  font-size: 13px; font-family: inherit; resize: vertical; outline: none;
  background: var(--app-surface); color: var(--app-text-primary);
}
.de-submit-remark:focus { border-color: var(--app-primary); }

.de-import-dialog { padding: var(--app-space-4) 0; }
.de-import-tips { margin-top: var(--app-space-3); font-size: 12px; color: var(--app-text-muted); display: flex; gap: var(--app-space-2); justify-content: center; }
</style>
