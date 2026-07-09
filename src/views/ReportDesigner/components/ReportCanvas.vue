<template>
  <div class="report-canvas" @click.self="deselect">
    <!-- 布局区域 -->
    <div class="layout-area">
      <div class="layout-section">
        <div class="layout-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1677ff" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          行区域
        </div>
        <div class="layout-fields">
          <span class="layout-field" v-for="(f, i) in layoutAreas.rowFields" :key="i">
            {{ f }}
            <button class="field-remove" @click="removeLayoutField('rowFields', i)">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </span>
          <span class="layout-placeholder" v-if="layoutAreas.rowFields.length === 0">拖拽字段到行区域</span>
        </div>
      </div>
      <div class="layout-section">
        <div class="layout-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          列区域
        </div>
        <div class="layout-fields">
          <span class="layout-field" v-for="(f, i) in layoutAreas.colFields" :key="i">
            {{ f }}
            <button class="field-remove" @click="removeLayoutField('colFields', i)">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </span>
          <span class="layout-placeholder" v-if="layoutAreas.colFields.length === 0">拖拽字段到列区域</span>
        </div>
      </div>
      <div class="layout-section">
        <div class="layout-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#faad14" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          指标区域
        </div>
        <div class="layout-fields">
          <span class="layout-field" v-for="(f, i) in layoutAreas.metricFields" :key="i">
            {{ f }}
            <button class="field-remove" @click="removeLayoutField('metricFields', i)">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </span>
          <span class="layout-placeholder" v-if="layoutAreas.metricFields.length === 0">拖拽字段到指标区域</span>
        </div>
      </div>
      <div class="layout-section">
        <div class="layout-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f5222d" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          过滤条件
        </div>
        <div class="layout-fields">
          <span class="layout-field" v-for="(f, i) in layoutAreas.filterFields" :key="i">
            {{ f }}
            <button class="field-remove" @click="removeLayoutField('filterFields', i)">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </span>
          <span class="layout-placeholder" v-if="layoutAreas.filterFields.length === 0">拖拽字段到过滤条件</span>
        </div>
      </div>
    </div>

    <!-- 表格画布 -->
    <div class="canvas-container" ref="canvasRef" @drop="handleDrop" @dragover.prevent>
      <div class="spreadsheet-wrapper">
        <!-- 列标头 -->
        <div class="col-headers">
          <div class="corner-cell"></div>
          <div
            v-for="c in colCount" :key="'col-h-'+c"
            class="col-header"
            :class="{ active: isColSelected(c - 1) }"
            @click="selectCol(c - 1)"
          >
            {{ getColLabel(c - 1) }}
          </div>
        </div>

        <!-- 表格主体 -->
        <div class="sheet-body" ref="sheetBodyRef">
          <div
            v-for="r in rowCount" :key="'row-'+r"
            class="sheet-row"
            :class="{ 'row-selected': isRowSelected(r - 1) }"
          >
            <!-- 行号 -->
            <div
              class="row-header"
              :class="{ active: isRowSelected(r - 1) }"
              @click="selectRow(r - 1)"
            >
              {{ r }}
            </div>

            <!-- 单元格 -->
            <div
              v-for="c in colCount" :key="'cell-'+r+'-'+c"
              class="sheet-cell"
              :class="{
                'cell-selected': isSelected(r - 1, c - 1),
                'cell-in-range': isInRange(r - 1, c - 1),
                'cell-editing': isEditing(r - 1, c - 1),
                'cell-formula': isFormula(r - 1, c - 1),
                'cell-merged': isMergedOrigin(r - 1, c - 1),
                'cell-hidden': isHidden(r - 1, c - 1)
              }"
              :style="getCellStyle(r - 1, c - 1)"
              :draggable="false"
              @mousedown="onCellMouseDown(r - 1, c - 1, $event)"
              @mouseenter="onCellMouseEnter(r - 1, c - 1)"
              @dblclick="startCellEdit(r - 1, c - 1)"
              @contextmenu.prevent="showContextMenu(r - 1, c - 1, $event)"
            >
              <template v-if="!isHidden(r - 1, c - 1)">
                <span v-if="isFormula(r - 1, c - 1)" class="fx-badge">fx</span>
                <span class="cell-text">{{ displayCellValue(r - 1, c - 1) }}</span>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
    >
      <div class="ctx-item" @click="copyCell"><span class="ctx-icon">📋</span> 复制</div>
      <div class="ctx-item" @click="pasteCell"><span class="ctx-icon">📥</span> 粘贴</div>
      <div class="ctx-divider"></div>
      <div class="ctx-item" @click="insertRow"><span class="ctx-icon">➕</span> 插入行</div>
      <div class="ctx-item" @click="insertCol"><span class="ctx-icon">➕</span> 插入列</div>
      <div class="ctx-item" @click="deleteRow"><span class="ctx-icon">❌</span> 删除行</div>
      <div class="ctx-item" @click="deleteCol"><span class="ctx-icon">❌</span> 删除列</div>
      <div class="ctx-divider"></div>
      <div class="ctx-item" @click="mergeSelectedCells"><span class="ctx-icon">🔗</span> 合并单元格</div>
      <div class="ctx-item" @click="splitSelectedCells"><span class="ctx-icon">✂️</span> 拆分单元格</div>
      <div class="ctx-divider"></div>
      <div class="ctx-item" @click="bindField"><span class="ctx-icon">🔗</span> 绑定字段</div>
      <div class="ctx-item" @click="setFormula"><span class="ctx-icon">fx</span> 设置公式</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useDesigner } from '../composables/useDesigner.js'

const {
  selectedCell, editingCell, rowCount, colCount, cells,
  layoutAreas, contextMenu, selectCell, startEdit, commitEdit,
  getCell, setCell, isInRange, getColLetter, initDemoData
} = useDesigner()

const canvasRef = ref(null)
const sheetBodyRef = ref(null)
let isDragging = false
let dragStart = { row: 0, col: 0 }

// 初始化
onMounted(() => {
  initDemoData()
  document.addEventListener('click', hideContextMenu)
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', hideContextMenu)
  document.removeEventListener('keydown', handleKeyDown)
})

function getColLabel(col) {
  return getColLetter(col)
}

function displayCellValue(row, col) {
  const cell = getCell(row, col)
  if (!cell) return ''
  // 格式化数字
  if (typeof cell.value === 'number') {
    return cell.value.toLocaleString()
  }
  return cell.value?.toString() || ''
}

function isSelected(row, col) {
  return selectedCell.row === row && selectedCell.col === col
}

function isEditing(row, col) {
  return editingCell.row === row && editingCell.col === col
}

function isFormula(row, col) {
  const cell = getCell(row, col)
  return cell?.type === 'formula' || (cell?.formula && cell.formula.startsWith('='))
}

function isMergedOrigin(row, col) {
  const cell = getCell(row, col)
  return cell?.merged === true
}

function isHidden(row, col) {
  const cell = getCell(row, col)
  return cell?.hidden === true
}

function getCellStyle(row, col) {
  const cell = getCell(row, col)
  if (!cell || !cell.style) return {}
  const s = cell.style
  return {
    fontFamily: s.fontFamily || 'inherit',
    fontSize: s.fontSize || '12px',
    fontWeight: s.fontWeight || 'normal',
    fontStyle: s.fontStyle || 'normal',
    textDecoration: s.textDecoration || 'none',
    color: s.color || 'inherit',
    backgroundColor: s.backgroundColor || 'transparent',
    textAlign: s.textAlign || 'left',
    gridColumn: cell.mergeSpan ? `span ${cell.mergeSpan.colSpan}` : undefined,
    gridRow: cell.mergeSpan ? `span ${cell.mergeSpan.rowSpan}` : undefined,
  }
}

function isRowSelected(row) {
  if (selectedCell.row2 === null) return selectedCell.row === row
  const r1 = Math.min(selectedCell.row, selectedCell.row2)
  const r2 = Math.max(selectedCell.row, selectedCell.row2)
  return row >= r1 && row <= r2 && selectedCell.col === 0
}

function isColSelected(col) {
  if (selectedCell.col2 === null) return selectedCell.col === col
  const c1 = Math.min(selectedCell.col, selectedCell.col2)
  const c2 = Math.max(selectedCell.col, selectedCell.col2)
  return col >= c1 && col <= c2 && selectedCell.row === 0
}

// 鼠标操作
function onCellMouseDown(row, col, event) {
  if (event.button !== 0) return
  const extend = event.shiftKey
  selectCell(row, col, extend)
  if (!extend) {
    isDragging = true
    dragStart = { row, col }
  }
}

function onCellMouseEnter(row, col) {
  if (!isDragging) return
  selectedCell.row2 = row
  selectedCell.col2 = col
}

function onCellMouseUp() {
  isDragging = false
}

function startCellEdit(row, col) {
  startEdit(row, col)
}

function deselect() {
  // 点击空白区域取消选择
}

function selectRow(row) {
  selectCell(row, 0)
  selectedCell.row2 = row
  selectedCell.col2 = colCount.value - 1
}

function selectCol(col) {
  selectCell(0, col)
  selectedCell.row2 = rowCount.value - 1
  selectedCell.col2 = col
}

// 键盘快捷键
function handleKeyDown(event) {
  if (editingCell.row !== null) return

  const { row, col } = selectedCell

  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault()
      if (row > 0) selectCell(row - 1, col)
      break
    case 'ArrowDown':
      event.preventDefault()
      if (row < rowCount.value - 1) selectCell(row + 1, col)
      break
    case 'ArrowLeft':
      event.preventDefault()
      if (col > 0) selectCell(row, col - 1)
      break
    case 'ArrowRight':
      event.preventDefault()
      if (col < colCount.value - 1) selectCell(row, col + 1)
      break
    case 'Enter':
      event.preventDefault()
      startEdit(row, col)
      break
    case 'Delete':
      event.preventDefault()
      clearCell(row, col)
      break
    case 'c':
    case 'C':
      if (event.ctrlKey) {
        event.preventDefault()
        copyCell()
      }
      break
    case 'v':
    case 'V':
      if (event.ctrlKey) {
        event.preventDefault()
        pasteCell()
      }
      break
    case 'z':
    case 'Z':
      if (event.ctrlKey) {
        event.preventDefault()
        if (event.shiftKey) {
          // redo
        } else {
          // undo
        }
      }
      break
  }
}

let clipboard = null

function copyCell() {
  const cell = getCell(selectedCell.row, selectedCell.col)
  clipboard = JSON.parse(JSON.stringify(cell))
}

function pasteCell() {
  if (!clipboard) return
  const r1 = Math.min(selectedCell.row, selectedCell.row2 ?? selectedCell.row)
  const r2 = Math.max(selectedCell.row, selectedCell.row2 ?? selectedCell.row)
  const c1 = Math.min(selectedCell.col, selectedCell.col2 ?? selectedCell.col)
  const c2 = Math.max(selectedCell.col, selectedCell.col2 ?? selectedCell.col)
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      setCell(r, c, JSON.parse(JSON.stringify(clipboard)))
    }
  }
}

function clearCell(row, col) {
  setCell(row, col, { value: '', style: {}, type: 'text' })
}

function removeLayoutField(area, index) {
  layoutAreas[area].splice(index, 1)
}

// 右键菜单
function showContextMenu(row, col, event) {
  selectCell(row, col)
  contextMenu.visible = true
  contextMenu.x = event.clientX
  contextMenu.y = event.clientY
  contextMenu.items = []
}

function hideContextMenu() {
  contextMenu.visible = false
}

function insertRow() {
  rowCount.value++
}

function insertCol() {
  colCount.value++
}

function deleteRow() {
  if (rowCount.value > 1) rowCount.value--
}

function deleteCol() {
  if (colCount.value > 1) colCount.value--
}

function mergeSelectedCells() {
  // 合并选中的单元格
  if (selectedCell.row2 !== null && selectedCell.col2 !== null) {
    const r1 = Math.min(selectedCell.row, selectedCell.row2)
    const r2 = Math.max(selectedCell.row, selectedCell.row2)
    const c1 = Math.min(selectedCell.col, selectedCell.col2)
    const c2 = Math.max(selectedCell.col, selectedCell.col2)
    // 简单标记合并
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        if (r === r1 && c === c1) {
          const cell = getCell(r, c)
          cell.merged = true
          cell.mergeSpan = { rowSpan: r2 - r1 + 1, colSpan: c2 - c1 + 1 }
          setCell(r, c, cell)
        } else {
          const cell = getCell(r, c)
          cell.hidden = true
          cell.mergeOrigin = `${r1},${c1}`
          setCell(r, c, cell)
        }
      }
    }
  }
}

function splitSelectedCells() {
  const cell = getCell(selectedCell.row, selectedCell.col)
  if (cell?.merged) {
    // 恢复所有隐藏的单元格
    for (let r = selectedCell.row; r < selectedCell.row + (cell.mergeSpan?.rowSpan || 1); r++) {
      for (let c = selectedCell.col; c < selectedCell.col + (cell.mergeSpan?.colSpan || 1); c++) {
        const c2 = getCell(r, c)
        c2.hidden = false
        c2.merged = false
        c2.mergeSpan = null
        setCell(r, c, c2)
      }
    }
  }
}

function bindField() {
  // 绑定字段到单元格
  const cell = getCell(selectedCell.row, selectedCell.col)
  cell.boundField = '产品类别'
  setCell(selectedCell.row, selectedCell.col, cell)
}

function setFormula() {
  startEdit(selectedCell.row, selectedCell.col)
}

function handleDrop(event) {
  event.preventDefault()
  try {
    const data = event.dataTransfer.getData('text/plain')
    if (data) {
      const parsed = JSON.parse(data)
      if (parsed.type) {
        // 处理拖拽字段
        console.log('Dropped field:', parsed)
      }
    }
  } catch (e) {
    // 忽略解析错误
  }
}

// 全局监听 mouseup
onMounted(() => {
  document.addEventListener('mouseup', onCellMouseUp)
})
onUnmounted(() => {
  document.removeEventListener('mouseup', onCellMouseUp)
})
</script>

<style scoped>
.report-canvas {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f5f7fa;
  position: relative;
}

/* 布局区域 */
.layout-area {
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  padding: 8px 12px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.layout-section {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 180px;
  flex: 1;
}

.layout-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #666;
  white-space: nowrap;
  padding-top: 4px;
  flex-shrink: 0;
}

.layout-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex: 1;
  min-height: 24px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  padding: 4px 6px;
  background: #fafbfc;
}

.layout-field {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 8px;
  background: #e6f0ff;
  border: 1px solid #b3d7ff;
  border-radius: 4px;
  font-size: 12px;
  color: #1677ff;
  cursor: default;
}

.field-remove {
  width: 14px;
  height: 14px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1677ff;
  padding: 0;
  margin-left: 2px;
}
.field-remove:hover { color: #f5222d; }

.layout-placeholder {
  font-size: 11px;
  color: #bfbfbf;
  padding: 4px 0;
}

/* 表格画布 */
.canvas-container {
  flex: 1;
  overflow: auto;
  position: relative;
}

.spreadsheet-wrapper {
  display: flex;
  flex-direction: column;
  min-width: fit-content;
  background: #fff;
}

/* 列标头 */
.col-headers {
  display: flex;
  position: sticky;
  top: 0;
  z-index: 30;
  background: #f5f7fa;
  border-bottom: 1px solid #e0e0e0;
}

.corner-cell {
  width: 48px;
  min-width: 48px;
  height: 24px;
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  background: #f5f7fa;
  flex-shrink: 0;
  position: sticky;
  left: 0;
  z-index: 35;
}

.col-header {
  width: 100px;
  min-width: 100px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #666;
  font-weight: 500;
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
  font-family: 'Roboto Mono', monospace;
}
.col-header:hover { background: #e8e8e8; }
.col-header.active { background: #d0e4ff; color: #1677ff; }

/* 表格行 */
.sheet-row {
  display: flex;
  min-height: 24px;
}

.row-header {
  width: 48px;
  min-width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #666;
  font-weight: 500;
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  background: #f5f7fa;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
  position: sticky;
  left: 0;
  z-index: 25;
  font-family: 'Roboto Mono', monospace;
}
.row-header:hover { background: #e8e8e8; }
.row-header.active { background: #d0e4ff; color: #1677ff; }

.sheet-row.row-selected {
  background: #f0f7ff;
}

/* 单元格 */
.sheet-cell {
  width: 100px;
  min-width: 100px;
  height: 24px;
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  padding: 0 4px;
  font-size: 12px;
  color: #333;
  cursor: cell;
  position: relative;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background-color 0.05s;
  background: #fff;
}
.sheet-cell:hover { background: #f0f7ff; }
.sheet-cell.cell-selected {
  outline: 2px solid #1677ff;
  outline-offset: -2px;
  z-index: 10;
}
.sheet-cell.cell-in-range {
  background: #e6f0ff;
}
.sheet-cell.cell-editing {
  padding: 0;
  outline: 2px solid #1677ff;
  outline-offset: -2px;
  z-index: 10;
}
.sheet-cell.cell-formula .cell-text {
  color: #1677ff;
}
.sheet-cell.cell-hidden {
  display: none;
}
.sheet-cell.cell-merged {
  /* 合并单元格的样式由 gridColumn/gridRow 处理 */
}

.cell-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.fx-badge {
  font-size: 9px;
  font-weight: 700;
  color: #1677ff;
  font-style: italic;
  margin-right: 2px;
  flex-shrink: 0;
}

/* 右键菜单 */
.context-menu {
  position: fixed;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  padding: 4px 0;
  z-index: 1000;
  min-width: 160px;
  font-size: 13px;
}

.ctx-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  cursor: pointer;
  color: #333;
  transition: background 0.15s;
}
.ctx-item:hover { background: #f0f7ff; color: #1677ff; }

.ctx-icon {
  font-size: 14px;
  width: 16px;
  text-align: center;
}

.ctx-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 4px 0;
}

/* 空标题行 */
.sheet-row:first-child .sheet-cell {
  border-top: 1px solid #e0e0e0;
}
</style>
