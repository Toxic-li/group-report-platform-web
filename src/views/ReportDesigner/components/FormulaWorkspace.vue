<template>
  <div class="formula-workspace">
    <!-- Formula Bar -->
    <div class="fw-formula-bar">
      <div class="fw-cell-ref">
        <span class="fw-ref-box">{{ cellRef }}</span>
        <button class="fw-ref-btn fx" title="插入函数" @click="$emit('insert-function')">
          <span>fx</span>
        </button>
      </div>
      <div class="fw-formula-input-wrap">
        <span class="fw-equals">=</span>
        <input
          ref="formulaInputRef"
          class="fw-formula-input"
          :value="formula"
          @input="handleInput"
          @keydown.enter="confirmFormula"
          @keydown.esc="cancelFormula"
          placeholder="输入公式，例如 SUM([销售金额])"
        />
        <div class="fw-formula-actions">
          <button class="fw-formula-btn" title="取消" @click="cancelFormula">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <button class="fw-formula-btn" title="确认" @click="confirmFormula">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Grid Canvas -->
    <div class="fw-grid-container" @drop="handleDrop" @dragover.prevent>
      <div class="fw-grid-header">
        <div class="fw-corner-cell"></div>
        <div
          v-for="col in columns"
          :key="col"
          class="fw-col-header"
          :class="{ active: isColActive(col) }"
          @click="selectCol(col)"
        >
          {{ col }}
        </div>
      </div>

      <div class="fw-grid-body">
        <div
          v-for="row in visibleRows"
          :key="row"
          class="fw-grid-row"
          :class="{ 'row-active': isRowActive(row) }"
        >
          <div
            class="fw-row-header"
            :class="{ active: isRowActive(row) }"
            @click="selectRow(row)"
          >
            {{ row }}
          </div>

          <div
            v-for="col in columns"
            :key="`${row}-${col}`"
            class="fw-grid-cell"
            :class="{
              'cell-active': isCellActive(row, col),
              'cell-formula': isFormulaCell(row, col),
              'cell-merged': isMergedCell(row, col),
              'cell-hidden': isHiddenCell(row, col)
            }"
            :style="getCellStyle(row, col)"
            @mousedown="onCellMouseDown(row, col, $event)"
            @mouseenter="onCellMouseEnter(row, col)"
            @dblclick="startEdit(row, col)"
          >
            <template v-if="!isHiddenCell(row, col)">
              <span v-if="isFormulaCell(row, col)" class="fw-cell-fx">fx</span>
              <span class="fw-cell-value">{{ displayCellValue(row, col) }}</span>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Reference Mode Banner -->
    <div v-if="referenceMode" class="fw-ref-banner">
      <span class="fw-ref-banner-icon">📍</span>
      <span>引用选择模式：请在工作表中选择单元格或区域，按 Enter 确认</span>
      <button class="fw-ref-banner-cancel" @click="cancelReferenceMode">取消</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  formula: { type: String, default: '' },
  cellRef: { type: String, default: 'D6' },
  result: { type: String, default: '' }
})

const emit = defineEmits(['update:formula', 'cell-select', 'formula-change', 'insert-function'])

const formulaInputRef = ref(null)
const referenceMode = ref(false)

// Grid state
const columns = ref(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'])
const visibleRows = ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
const activeCell = ref({ row: 6, col: 'D' })
const selectedRange = ref({ startRow: null, startCol: null, endRow: null, endCol: null })
const isDragging = ref(false)

// Demo cell data
const cellData = ref({
  '1-1': { value: '销售业绩分析报表', style: { fontSize: '18px', fontWeight: 'bold', textAlign: 'center' }, merged: true, colSpan: 10 },
  '2-1': { value: '周期：2025年1月-2025年12月', style: { fontSize: '13px', textAlign: 'center', color: '#666' }, merged: true, colSpan: 10 },
  '3-2': { value: '部门', style: { fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f0f5ff' } },
  '3-3': { value: '产品类别', style: { fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f0f5ff' } },
  '3-4': { value: '1月', style: { fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f0f5ff' } },
  '3-5': { value: '2月', style: { fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f0f5ff' } },
  '3-6': { value: '3月', style: { fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f0f5ff' } },
  '3-7': { value: '4月', style: { fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f0f5ff' } },
  '3-8': { value: '5月', style: { fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f0f5ff' } },
  '3-9': { value: '6月', style: { fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f0f5ff' } },
  '3-10': { value: '合计', style: { fontWeight: 'bold', textAlign: 'center', backgroundColor: '#f0f5ff' } },
  '3-11': { value: '毛利率(%)', style: { fontWeight: 'bold', textAlign: 'center', fontSize: '11px', backgroundColor: '#f0f5ff' } },
  '4-2': { value: '销售一部', style: { fontWeight: 'bold' } },
  '4-3': { value: '电脑', style: { textAlign: 'left' } },
  '4-4': { value: '1,234,567', style: { textAlign: 'right' } },
  '4-5': { value: '1,345,678', style: { textAlign: 'right' } },
  '4-6': { value: '1,456,789', style: { textAlign: 'right' } },
  '4-7': { value: '1,234,567', style: { textAlign: 'right' } },
  '4-8': { value: '1,345,678', style: { textAlign: 'right' } },
  '4-9': { value: '1,456,789', style: { textAlign: 'right' } },
  '4-10': { value: '8,185,169', style: { fontWeight: 'bold', textAlign: 'right' } },
  '4-11': { value: '18.76%', style: { textAlign: 'right', color: '#2563EB' } },
  '5-3': { value: '手机', style: { textAlign: 'left' } },
  '5-4': { value: '2,345,678', style: { textAlign: 'right' } },
  '5-5': { value: '2,456,789', style: { textAlign: 'right' } },
  '5-6': { value: '2,567,890', style: { textAlign: 'right' } },
  '5-7': { value: '2,345,678', style: { textAlign: 'right' } },
  '5-8': { value: '2,456,789', style: { textAlign: 'right' } },
  '5-9': { value: '2,567,890', style: { textAlign: 'right' } },
  '5-10': { value: '14,851,725', style: { fontWeight: 'bold', textAlign: 'right' } },
  '5-11': { value: '16.45%', style: { textAlign: 'right', color: '#2563EB' } },
  '6-3': { value: '配件', style: { textAlign: 'left' } },
  '6-4': { value: '345,678', style: { textAlign: 'right' } },
  '6-5': { value: '456,789', style: { textAlign: 'right' } },
  '6-6': { value: '567,890', style: { textAlign: 'right' } },
  '6-7': { value: '345,678', style: { textAlign: 'right' } },
  '6-8': { value: '456,789', style: { textAlign: 'right' } },
  '6-9': { value: '567,890', style: { textAlign: 'right' } },
  '6-10': { value: '2,740,714', style: { fontWeight: 'bold', textAlign: 'right' } },
  '6-11': { value: '22.31%', style: { textAlign: 'right', color: '#2563EB' } },
  '7-2': { value: '小计', style: { fontWeight: 'bold', backgroundColor: '#f0f5ff' } },
  '7-10': { value: '25,777,608', style: { fontWeight: 'bold', textAlign: 'right', backgroundColor: '#f0f5ff' } },
  '7-11': { value: '17.86%', style: { fontWeight: 'bold', textAlign: 'right', color: '#2563EB', backgroundColor: '#f0f5ff' } },
  '8-2': { value: '销售二部', style: { fontWeight: 'bold' } },
  '8-3': { value: '电脑', style: { textAlign: 'left' } },
  '8-4': { value: '987,654', style: { textAlign: 'right' } },
  '8-10': { value: '6,623,924', style: { fontWeight: 'bold', textAlign: 'right' } },
  '8-11': { value: '19.21%', style: { textAlign: 'right', color: '#2563EB' } },
  '13-2': { value: '合计', style: { fontWeight: 'bold', backgroundColor: '#e8f0ff' } },
  '13-10': { value: '46,621,048', style: { fontWeight: 'bold', textAlign: 'right', backgroundColor: '#e8f0ff' } },
  '13-11': { value: '18.09%', style: { fontWeight: 'bold', textAlign: 'right', color: '#2563EB', backgroundColor: '#e8f0ff' } },
})

const colIndex = (col) => columns.value.indexOf(col)

function displayCellValue(row, col) {
  const key = `${row}-${colIndex(col) + 1}`
  const cell = cellData.value[key]
  if (!cell) return ''
  if (cell.hidden) return ''
  return cell.value || ''
}

function isCellActive(row, col) {
  return activeCell.value.row === row && activeCell.value.col === col
}

function isRowActive(row) {
  if (!selectedRange.value.startRow) return activeCell.value.row === row
  const minRow = Math.min(selectedRange.value.startRow, selectedRange.value.endRow || selectedRange.value.startRow)
  const maxRow = Math.max(selectedRange.value.startRow, selectedRange.value.endRow || selectedRange.value.startRow)
  return row >= minRow && row <= maxRow
}

function isColActive(col) {
  if (!selectedRange.value.startCol) return false
  const startIdx = colIndex(selectedRange.value.startCol)
  const endIdx = colIndex(selectedRange.value.endCol || selectedRange.value.startCol)
  const curIdx = colIndex(col)
  return curIdx >= Math.min(startIdx, endIdx) && curIdx <= Math.max(startIdx, endIdx)
}

function isFormulaCell(row, col) {
  const key = `${row}-${colIndex(col) + 1}`
  return cellData.value[key]?.formula !== undefined
}

function isMergedCell(row, col) {
  const key = `${row}-${colIndex(col) + 1}`
  return cellData.value[key]?.merged === true
}

function isHiddenCell(row, col) {
  const key = `${row}-${colIndex(col) + 1}`
  return cellData.value[key]?.hidden === true
}

function getCellStyle(row, col) {
  const key = `${row}-${colIndex(col) + 1}`
  const cell = cellData.value[key]
  if (!cell) return {}
  const style = { ...cell.style }
  if (cell.colSpan) {
    style.width = (100 * cell.colSpan + (cell.colSpan - 1)) + 'px'
  }
  return style
}

function onCellMouseDown(row, col, event) {
  if (event.button !== 0) return
  activeCell.value = { row, col }
  selectedRange.value = { startRow: row, startCol: col, endRow: null, endCol: null }
  isDragging.value = true
  emit('cell-select', `${col}${row}`)
}

function onCellMouseEnter(row, col) {
  if (!isDragging.value) return
  selectedRange.value.endRow = row
  selectedRange.value.endCol = col
}

function startEdit(row, col) {
  activeCell.value = { row, col }
}

function selectRow(row) {
  activeCell.value = { row, col: activeCell.value.col }
  selectedRange.value = { startRow: row, startCol: columns.value[0], endRow: row, endCol: columns.value[columns.value.length - 1] }
}

function selectCol(col) {
  activeCell.value = { row: activeCell.value.row, col }
  selectedRange.value = { startRow: visibleRows.value[0], startCol: col, endRow: visibleRows.value[visibleRows.value.length - 1], endCol: col }
}

// Formula input
function handleInput(e) {
  emit('update:formula', e.target.value)
  emit('formula-change', e.target.value)
}

function confirmFormula() {
  emit('formula-change', props.formula)
}

function cancelFormula() {}

function cancelReferenceMode() {
  referenceMode.value = false
}

function handleDrop(event) {
  event.preventDefault()
  const data = event.dataTransfer.getData('text/plain')
  if (data) {
    const current = props.formula || ''
    emit('update:formula', current + `[${data}]`)
  }
}

// Global mouse up
window.addEventListener('mouseup', () => { isDragging.value = false })
</script>

<style scoped>
.formula-workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  min-width: 0;
}

/* Formula Bar */
.fw-formula-bar {
  height: 36px;
  min-height: 36px;
  background: #fff;
  border-bottom: 1px solid #E5E7EB;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.fw-cell-ref {
  width: 120px;
  min-width: 120px;
  border-right: 1px solid #E5E7EB;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  height: 100%;
}

.fw-ref-box {
  font-size: 12px;
  font-weight: 500;
  color: #1E293B;
  font-family: 'Roboto Mono', monospace;
  min-width: 36px;
}

.fw-ref-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9CA3AF;
  padding: 0;
  transition: all 0.15s;
}
.fw-ref-btn:hover { background: #F3F4F6; }
.fw-ref-btn.fx span {
  font-size: 11px;
  font-weight: 700;
  font-style: italic;
  color: #2563EB;
}

.fw-formula-input-wrap {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 8px;
  gap: 6px;
  position: relative;
}

.fw-equals {
  font-size: 14px;
  font-weight: 500;
  color: #2563EB;
  font-family: 'Roboto Mono', monospace;
}

.fw-formula-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 13px;
  font-family: 'Roboto Mono', monospace;
  color: #1E293B;
  background: transparent;
  height: 100%;
}
.fw-formula-input::placeholder { color: #9CA3AF; }

.fw-formula-actions {
  display: flex;
  gap: 2px;
}

.fw-formula-btn {
  width: 22px;
  height: 22px;
  border: 1px solid #E5E7EB;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6B7280;
  padding: 0;
  transition: all 0.15s;
}
.fw-formula-btn:hover { background: #F3F4F6; }

/* Grid */
.fw-grid-container {
  flex: 1;
  overflow: auto;
  position: relative;
}

.fw-grid-header {
  display: flex;
  position: sticky;
  top: 0;
  z-index: 30;
  background: #F8FAFC;
  border-bottom: 1px solid #E5E7EB;
}

.fw-corner-cell {
  width: 48px;
  min-width: 48px;
  height: 24px;
  border-right: 1px solid #E5E7EB;
  border-bottom: 1px solid #E5E7EB;
  background: #F8FAFC;
  flex-shrink: 0;
  position: sticky;
  left: 0;
  z-index: 35;
}

.fw-col-header {
  width: 100px;
  min-width: 100px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #6B7280;
  font-weight: 500;
  border-right: 1px solid #E5E7EB;
  border-bottom: 1px solid #E5E7EB;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
  font-family: 'Roboto Mono', monospace;
}
.fw-col-header:hover { background: #F3F4F6; }
.fw-col-header.active { background: #DBEAFE; color: #2563EB; }

.fw-grid-body {
  display: flex;
  flex-direction: column;
}

.fw-grid-row {
  display: flex;
  min-height: 24px;
}
.fw-grid-row.row-active { background: #EFF6FF; }

.fw-row-header {
  width: 48px;
  min-width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #6B7280;
  font-weight: 500;
  border-right: 1px solid #E5E7EB;
  border-bottom: 1px solid #E5E7EB;
  background: #F8FAFC;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
  position: sticky;
  left: 0;
  z-index: 25;
  font-family: 'Roboto Mono', monospace;
}
.fw-row-header:hover { background: #F3F4F6; }
.fw-row-header.active { background: #DBEAFE; color: #2563EB; }

.fw-grid-cell {
  width: 100px;
  min-width: 100px;
  height: 24px;
  border-right: 1px solid #E5E7EB;
  border-bottom: 1px solid #E5E7EB;
  display: flex;
  align-items: center;
  padding: 0 4px;
  font-size: 12px;
  color: #1E293B;
  cursor: cell;
  position: relative;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
  background: #fff;
}
.fw-grid-cell:hover { background: #F0F9FF; }
.fw-grid-cell.cell-active {
  outline: 2px solid #2563EB;
  outline-offset: -2px;
  z-index: 10;
}
.fw-grid-cell.cell-formula .fw-cell-value { color: #2563EB; }
.fw-grid-cell.cell-hidden { display: none; }

.fw-cell-fx {
  font-size: 9px;
  font-weight: 700;
  font-style: italic;
  color: #2563EB;
  margin-right: 2px;
  flex-shrink: 0;
}

.fw-cell-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

/* Reference Banner */
.fw-ref-banner {
  height: 32px;
  background: #EFF6FF;
  border-top: 1px solid #BFDBFE;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  font-size: 12px;
  color: #2563EB;
  flex-shrink: 0;
}
.fw-ref-banner-icon { font-size: 14px; }
.fw-ref-banner-cancel {
  margin-left: auto;
  padding: 2px 10px;
  border: 1px solid #BFDBFE;
  border-radius: 4px;
  background: #fff;
  font-size: 11px;
  color: #2563EB;
  cursor: pointer;
  transition: all 0.15s;
}
.fw-ref-banner-cancel:hover { background: #DBEAFE; }
</style>
