<template>
  <div class="report-canvas" @click.self="deselect" @contextmenu.prevent="hideCtx">
    <div class="canvas-container" ref="canvasRef">
      <div class="spreadsheet-wrapper">
        <!-- 标题行（合并所有列） -->
        <div class="title-row" :style="{ height: '40px' }">
          <div class="title-cell" :style="titleCellStyle" @click="selectTitle" @dblclick="editTitle">
            <input v-if="titleEditing" v-model="titleText" class="title-input" @blur="saveTitle" @keydown.enter="saveTitle" />
            <template v-else>{{ titleText || '报表标题（双击编辑）' }}</template>
          </div>
        </div>

        <!-- 多行列表头：CSS Grid 精确定位，避免 flex 撑开问题 -->
        <div class="col-headers" :style="{ height: (colHeaderDepth * 36) + 'px' }">
          <div class="corner-cell" :style="{ width: getColWidth(0) + 'px' }"></div>
          <div class="col-header-grid" :style="headerGridStyle">
            <div v-for="cell in headerMatrixCells" :key="'ch-'+cell.node.id"
              class="col-header"
              :class="{
                active: selectedRegion.colNodeId === cell.node.id,
                'col-header-parent': !cell.isLeaf
              }"
              :style="{
                gridColumn: (cell.leafStartIndex + 1) + ' / span ' + cell.colSpan,
                gridRow: (cell.depth + 1) + ' / span ' + cell.rowSpan,
                width: headerCellWidth(cell) + 'px',
                minWidth: headerCellWidth(cell) + 'px'
              }"
              @click="selectColRegion(cell.node.id)"
              @dblclick="startEditCell(null, cell.node.id)"
              @contextmenu.prevent.stop="onColHeaderContextMenu($event, cell.node)"
              @dragover.prevent="onColDragOver($event, cell.node)"
              @dragleave="onColDragLeave($event, cell.node)"
              @drop="onColDrop($event, cell.node)">
              <input v-if="editingHeader.type==='col' && editingHeader.id===cell.node.id"
                ref="headerInputRef" class="header-input"
                :value="editingHeader.value"
                @input="editingHeader.value = $event.target.value"
                @blur="commitHeaderEdit" @keydown.enter.prevent="commitHeaderEdit" @keydown.esc.prevent="cancelHeaderEdit"
                @click.stop />
              <template v-else>
                <span class="col-header-text">{{ cell.node.name }}</span>
                <span v-if="cell.isLeaf && cell.node.dataField" class="col-bind-tag">{{ cell.node.dataField }}</span>
                <span v-if="cell.isLeaf && cell.node.required" class="required-mark">*</span>
                <span v-if="cell.isLeaf && cell.node.dataType" class="col-type-tag">{{ cell.node.dataType }}</span>
                <div v-if="cell.isLeaf" class="col-resize-handle" @mousedown="onColResizeStart(cell.leafStartIndex + 1, $event)"></div>
              </template>
            </div>
          </div>
        </div>

        <!-- 行维度行 + 数据单元格 -->
        <div class="sheet-body" ref="sheetBodyRef">
          <div v-for="(rowNode, rIdx) in flatRowTree" :key="'row-'+rowNode.id"
            class="sheet-row"
            :class="{
              'row-summary': rowNode.isSummary,
              'row-subtotal': rowNode.summaryType === 'subtotal',
              'row-grandtotal': rowNode.summaryType === 'grandTotal',
              'row-selected': selectedRegion.rowNodeId === rowNode.id
            }"
            :style="{ height: getRowHeight(1 + colHeaderDepth + rIdx) + 'px' }">
            <div class="row-header"
              :class="{ active: selectedRegion.rowNodeId === rowNode.id }"
              :style="{ width: getColWidth(0) + 'px', paddingLeft: (12 + rowNode.level * 16) + 'px' }"
              @click="selectRowRegion(rowNode.id)"
              @dblclick="startEditCell(rowNode.id, null)"
              @contextmenu.prevent.stop="onRowHeaderContextMenu($event, rowNode)">
              <input v-if="editingHeader.type==='row' && editingHeader.id===rowNode.id"
                ref="headerInputRef" class="header-input"
                :value="editingHeader.value"
                @input="editingHeader.value = $event.target.value"
                @blur="commitHeaderEdit" @keydown.enter.prevent="commitHeaderEdit" @keydown.esc.prevent="cancelHeaderEdit"
                @click.stop />
              <template v-else>
                <span v-if="rowNode.summaryType === 'grandTotal'" class="row-summary-icon" title="合计">Σ</span>
                <span v-else-if="rowNode.isSummary" class="row-summary-icon" title="小计">∑</span>
                <span class="row-header-text">{{ rowNode.name }}</span>
                <span v-if="rowNode.isSummary" class="row-func-tag">{{ rowNode.aggregateFunc || 'SUM' }}</span>
                <div class="row-resize-handle" @mousedown="onRowResizeStart(1 + colHeaderDepth + rIdx, $event)"></div>
              </template>
            </div>

            <!-- 合并标题模式：整行合并显示标题 -->
            <div v-if="rowNode.isSummary && rowNode.mergeTitle" class="sheet-cell summary-merged-cell"
              :class="{ 'row-grandtotal-cell': rowNode.summaryType === 'grandTotal' }"
              :style="{ width: totalDataWidth + 'px', minWidth: totalDataWidth + 'px' }">
              <span class="summary-merged-text">{{ rowNode.name }}</span>
            </div>

            <!-- 默认：各叶子列分别显示聚合值 -->
            <template v-else>
              <div v-for="(colLeaf, cIdx) in flatColumnLeaves" :key="'cell-'+rowNode.id+'-'+colLeaf.id"
                class="sheet-cell"
                :class="{
                  'cell-selected': isCellSelected(rowNode.id, colLeaf.id),
                  'cell-editing': isEditing(rowNode.id, colLeaf.id),
                  'row-summary-cell': rowNode.isSummary,
                  'row-grandtotal-cell': rowNode.summaryType === 'grandTotal',
                  'col-readonly': colLeaf.readonly
                }"
                :style="{ width: getColWidth(cIdx + 1) + 'px', minWidth: getColWidth(cIdx + 1) + 'px' }"
                @click="selectCellRegion(rowNode.id, colLeaf.id)"
                @dblclick="startEditCell(rowNode.id, colLeaf.id)"
                @dragover.prevent="onCellDragOver($event, rowNode, colLeaf)"
                @dragleave="onCellDragLeave($event, rowNode, colLeaf)"
                @drop="onCellDrop($event, rowNode, colLeaf)">
                <template v-if="isEditing(rowNode.id, colLeaf.id)">
                  <input
                    ref="cellInputRef"
                    class="cell-input"
                    :value="editingCell.value"
                    @input="onEditInput($event)"
                    @keydown="onEditKeyDown($event)"
                    @blur="onEditBlur"
                    @click.stop
                  />
                </template>
                <template v-else>
                  <span v-if="!rowNode.isSummary && hasFormula(rowNode.id, colLeaf.id)" class="cell-formula-badge" title="包含公式">fx</span>
                  <span class="cell-text">{{ displayCellValue(rowNode, colLeaf) }}</span>
                </template>
              </div>
            </template>
          </div>
        </div>

        <!-- 空状态提示 -->
        <div v-if="flatRowTree.length === 0 || flatColumnLeaves.length === 0" class="empty-state">
          <div class="empty-icon">📋</div>
          <div class="empty-text">请在右侧属性面板添加行维度和列维度</div>
          <div class="empty-hint">右键行头可插入小计/合计行，右键列头可创建列分组（多行表头）</div>
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div v-if="contextMenu.visible" class="ctx-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      @click.stop>
      <div v-for="(item, i) in contextMenu.items" :key="i"
        :class="['ctx-item', { 'ctx-sep': item.sep, 'ctx-danger': item.danger }]"
        @click="!item.sep && onContextItem(item)">
        <span class="ctx-label">{{ item.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useDesigner } from '../composables/useDesigner.js'

const {
  selectedCell, selectedRegion, editingCell,
  rowTree, columnTree,
  flatRowTree: flatRowTreeRef, flatColumnTree: flatColumnTreeRef, flatColumnLeaves: flatColumnLeavesRef,
  headerMatrix: headerMatrixRef, colHeaderDepth,
  cellData, getCellValue, setCellValue, computeSummaryValue,
  hasFormula, getCellFormula, getCellRawValue,
  selectRegion, startEdit, commitEdit,
  getColWidth, getRowHeight, setColWidth, setRowHeight,
  initDemoData,
  addRowNode, addColNode,
  addSummaryRow, addGrandTotalRow, updateSummaryRow,
  updateRowNode, updateColNode,
  deleteRowNode, deleteColNode,
  bindFieldToColumn, bindFieldToCell, bindFieldToMetric,
} = useDesigner()

const flatRowTree = computed(() => flatRowTreeRef.value || [])
const flatColumnTree = computed(() => flatColumnTreeRef.value || [])
const flatColumnLeaves = computed(() => flatColumnLeavesRef.value || [])
const headerMatrix = computed(() => headerMatrixRef.value || { matrix: [], maxDepth: 0, totalCols: 0 })

const canvasRef = ref(null)
const sheetBodyRef = ref(null)
const cellInputRef = ref(null)

// 标题
const titleEditing = ref(false)
const titleText = ref('')
const titleCellStyle = computed(() => {
  const totalWidth = flatColumnLeaves.value.reduce((sum, _, idx) => sum + getColWidth(idx + 1), getColWidth(0))
  return { width: totalWidth + 'px', minWidth: totalWidth + 'px' }
})

// 所有数据列总宽（合并标题模式用）
const totalDataWidth = computed(() => {
  return flatColumnLeaves.value.reduce((sum, _, idx) => sum + getColWidth(idx + 1), 0)
})

// 多行表头单元格宽度 = 覆盖的叶子列宽度之和
function headerCellWidth(cell) {
  let w = 0
  for (let i = cell.leafStartIndex; i < cell.leafStartIndex + cell.colSpan; i++) {
    w += getColWidth(i + 1)
  }
  return w
}

// 扁平化所有表头单元格（从 matrix 二维数组展开为一维，用于 CSS Grid 定位）
const headerMatrixCells = computed(() => {
  const cells = []
  for (const row of headerMatrix.value.matrix) {
    cells.push(...row)
  }
  return cells
})

// CSS Grid 模板：行数 = colHeaderDepth，列数 = 叶子列数（每列固定宽度）
const headerGridStyle = computed(() => {
  const colTemplateParts = []
  for (let i = 0; i < flatColumnLeaves.value.length; i++) {
    colTemplateParts.push(getColWidth(i + 1) + 'px')
  }
  return {
    display: 'grid',
    gridTemplateRows: `repeat(${colHeaderDepth.value}, 36px)`,
    gridTemplateColumns: colTemplateParts.join(' '),
  }
})

function selectTitle() { selectRegion('title', null, null) }
function editTitle() { titleEditing.value = true }
function saveTitle() { titleEditing.value = false }

// ========== 区域选择 ==========
function selectRowRegion(rowNodeId) { selectRegion('row', rowNodeId, null) }
function selectColRegion(colNodeId) { selectRegion('col', null, colNodeId) }
function selectCellRegion(rowNodeId, colNodeId) { selectRegion('cell', rowNodeId, colNodeId) }

function isCellSelected(rowNodeId, colNodeId) {
  return selectedRegion.type === 'cell'
    && selectedRegion.rowNodeId === rowNodeId
    && selectedRegion.colNodeId === colNodeId
}
function isEditing(rowNodeId, colNodeId) {
  return editingCell.row === rowNodeId && editingCell.col === colNodeId
}

// 单元格显示：普通单元格取 cellData，汇总行取自动聚合值
function displayCellValue(rowNode, colLeaf) {
  if (rowNode && rowNode.isSummary) {
    return formatNum(computeSummaryValue(rowNode, colLeaf))
  }
  const value = getCellValue(rowNode.id, colLeaf.id)
  if (value == null) return ''
  if (typeof value === 'number') return value.toLocaleString()
  return value.toString()
}
function formatNum(v) {
  if (v == null || v === '') return ''
  if (typeof v === 'number') {
    return Number.isInteger(v) ? v.toString() : v.toFixed(2)
  }
  return v.toString()
}

// ========== 单元格/表头编辑 ==========
// 行/列名称的内联编辑
const editingHeader = ref({ type: null, id: null, value: '' })
const headerInputRef = ref(null)

function findColNodeById(id) {
  const walk = (tree) => {
    for (const n of tree) {
      if (n.id === id) return n
      if (n.children && n.children.length) { const r = walk(n.children); if (r) return r }
    }
    return null
  }
  return walk(columnTree.value)
}

function startEditCell(rowNodeId, colNodeId) {
  // 单元格编辑
  if (rowNodeId && colNodeId) {
    const rowNode = flatRowTree.value.find(r => r.id === rowNodeId)
    if (rowNode && rowNode.isSummary) {
      ElMessage.info('汇总行由聚合自动计算，不可直接编辑')
      return
    }
    startEdit(rowNodeId, colNodeId)
    nextTick(() => {
      const refs = Array.isArray(cellInputRef.value) ? cellInputRef.value : [cellInputRef.value]
      const input = refs[0]
      if (input) { input.focus(); input.select() }
    })
    return
  }
  // 行/列名称编辑（双击行头或列头）
  if (rowNodeId) {
    const r = flatRowTree.value.find(x => x.id === rowNodeId)
    editingHeader.value = { type: 'row', id: rowNodeId, value: r ? r.name : '' }
  } else if (colNodeId) {
    const c = findColNodeById(colNodeId)
    editingHeader.value = { type: 'col', id: colNodeId, value: c ? c.name : '' }
  }
  nextTick(() => {
    const refs = Array.isArray(headerInputRef.value) ? headerInputRef.value : [headerInputRef.value]
    const input = refs && refs[0]
    if (input) { input.focus(); input.select() }
  })
}

function commitHeaderEdit() {
  const eh = editingHeader.value
  if (!eh.type || !eh.id) { editingHeader.value = { type: null, id: null, value: '' }; return }
  const name = (eh.value || '').trim()
  if (name) {
    if (eh.type === 'row') updateRowNode(eh.id, { name })
    else if (eh.type === 'col') updateColNode(eh.id, { name })
  }
  editingHeader.value = { type: null, id: null, value: '' }
}
function cancelHeaderEdit() {
  editingHeader.value = { type: null, id: null, value: '' }
}
function onEditInput(event) { editingCell.value = event.target.value }
function onEditKeyDown(event) {
  if (event.key === 'Enter') { event.preventDefault(); commitEdit(editingCell.value) }
  else if (event.key === 'Escape') {
    event.preventDefault()
    editingCell.row = null; editingCell.col = null; editingCell.value = ''
  } else if (event.key === 'Tab') { event.preventDefault(); commitEdit(editingCell.value) }
}
function onEditBlur() {
  if (editingCell.row != null && editingCell.col != null) commitEdit(editingCell.value)
}
function deselect() { selectRegion(null, null, null) }

// ========== 列宽/行高拖拽 ==========
const resizing = ref({ type: null, index: -1, startX: 0, startY: 0, startSize: 0 })
function onColResizeStart(col, event) {
  event.preventDefault(); event.stopPropagation()
  resizing.value = { type: 'col', index: col, startX: event.clientX, startY: 0, startSize: getColWidth(col) }
  document.addEventListener('mousemove', onColResizeMove)
  document.addEventListener('mouseup', onColResizeEnd)
  document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'
}
function onColResizeMove(e) {
  if (resizing.value.type !== 'col') return
  const delta = e.clientX - resizing.value.startX
  setColWidth(resizing.value.index, Math.max(50, Math.min(500, resizing.value.startSize + delta)))
}
function onColResizeEnd() {
  resizing.value = { type: null, index: -1, startX: 0, startY: 0, startSize: 0 }
  document.removeEventListener('mousemove', onColResizeMove)
  document.removeEventListener('mouseup', onColResizeEnd)
  document.body.style.cursor = ''; document.body.style.userSelect = ''
}
function onRowResizeStart(row, event) {
  event.preventDefault(); event.stopPropagation()
  resizing.value = { type: 'row', index: row, startX: 0, startY: event.clientY, startSize: getRowHeight(row) }
  document.addEventListener('mousemove', onRowResizeMove)
  document.addEventListener('mouseup', onRowResizeEnd)
  document.body.style.cursor = 'row-resize'; document.body.style.userSelect = 'none'
}
function onRowResizeMove(e) {
  if (resizing.value.type !== 'row') return
  const delta = e.clientY - resizing.value.startY
  setRowHeight(resizing.value.index, Math.max(20, Math.min(200, resizing.value.startSize + delta)))
}
function onRowResizeEnd() {
  resizing.value = { type: null, index: -1, startX: 0, startY: 0, startSize: 0 }
  document.removeEventListener('mousemove', onRowResizeMove)
  document.removeEventListener('mouseup', onRowResizeEnd)
  document.body.style.cursor = ''; document.body.style.userSelect = ''
}

// ========== 右键菜单 ==========
const contextMenu = ref({ visible: false, x: 0, y: 0, items: [] })
function showCtx(x, y, items) {
  // 防止菜单超出视窗
  const maxX = window.innerWidth - 180
  const maxY = window.innerHeight - items.length * 32 - 20
  contextMenu.value = { visible: true, x: Math.min(x, maxX), y: Math.min(y, maxY), items }
}
function hideCtx() { contextMenu.value.visible = false }

function onRowHeaderContextMenu(event, rowNode) {
  const items = []
  if (rowNode.isSummary) {
    const funcs = ['SUM', 'AVG', 'COUNT', 'MAX', 'MIN']
    funcs.forEach(f => {
      items.push({ label: '聚合: ' + f + (rowNode.aggregateFunc === f ? '  ✓' : ''), action: 'setFunc', func: f, nodeId: rowNode.id })
    })
    items.push({ sep: true })
    items.push({ label: rowNode.mergeTitle ? '改为分列显示聚合值' : '改为合并标题', action: 'toggleMerge', nodeId: rowNode.id })
    items.push({ sep: true })
    items.push({ label: '删除此行', action: 'deleteRow', nodeId: rowNode.id, danger: true })
  } else {
    items.push({ label: '添加下级行', action: 'addChildRow', nodeId: rowNode.id })
    items.push({ label: '添加同级行', action: 'addSiblingRow', nodeId: rowNode.id })
    items.push({ sep: true })
    items.push({ label: '在此后插入小计行', action: 'insertSubtotal', nodeId: rowNode.id })
    items.push({ label: '在此前插入小计行', action: 'insertSubtotalBefore', nodeId: rowNode.id })
    items.push({ sep: true })
    items.push({ label: '插入合计行（置底）', action: 'insertGrandBottom' })
    items.push({ label: '插入合计行（置顶）', action: 'insertGrandTop' })
    items.push({ sep: true })
    items.push({ label: '删除此行', action: 'deleteRow', nodeId: rowNode.id, danger: true })
  }
  showCtx(event.clientX, event.clientY, items)
}

function onColHeaderContextMenu(event, colNode) {
  const items = []
  items.push({ label: '添加下级列', action: 'addChildCol', nodeId: colNode.id })
  items.push({ label: '添加同级列', action: 'addSiblingCol', nodeId: colNode.id })
  items.push({ label: '创建列分组（在此列上加父级）', action: 'groupCol', nodeId: colNode.id })
  items.push({ sep: true })
  items.push({ label: '删除此列', action: 'deleteCol', nodeId: colNode.id, danger: true })
  showCtx(event.clientX, event.clientY, items)
}

function onContextItem(item) {
  hideCtx()
  switch (item.action) {
    case 'addChildRow':
      addRowNode(item.nodeId)
      ElMessage.success('已添加下级行')
      break
    case 'addSiblingRow': {
      const r = flatRowTree.value.find(x => x.id === item.nodeId)
      addRowNode(r ? r.parentId : null, item.nodeId)
      ElMessage.success('已添加同级行')
      break
    }
    case 'insertSubtotal':
      addSummaryRow(item.nodeId, { title: '小计', aggregateFunc: 'SUM' })
      ElMessage.success('已插入小计行')
      break
    case 'insertSubtotalBefore': {
      const idx = flatRowTree.value.findIndex(r => r.id === item.nodeId)
      const prevId = idx > 0 ? flatRowTree.value[idx - 1].id : null
      addSummaryRow(prevId, { title: '小计', aggregateFunc: 'SUM' })
      ElMessage.success('已插入小计行')
      break
    }
    case 'insertGrandBottom':
      addGrandTotalRow({ position: 'bottom', title: '合计' })
      ElMessage.success('已插入合计行（置底）')
      break
    case 'insertGrandTop':
      addGrandTotalRow({ position: 'top', title: '合计' })
      ElMessage.success('已插入合计行（置顶）')
      break
    case 'setFunc':
      updateSummaryRow(item.nodeId, { aggregateFunc: item.func })
      ElMessage.success('聚合函数已改为 ' + item.func)
      break
    case 'toggleMerge': {
      const r = flatRowTree.value.find(x => x.id === item.nodeId)
      updateSummaryRow(item.nodeId, { mergeTitle: !(r && r.mergeTitle) })
      break
    }
    case 'deleteRow':
      deleteRowNode(item.nodeId)
      ElMessage.success('已删除')
      break
    case 'groupCol':
      groupColumn(item.nodeId)
      break
    case 'addChildCol':
      addColNode(item.nodeId)
      ElMessage.success('已添加下级列')
      break
    case 'addSiblingCol': {
      const colNode = flatColumnTree.value.find(x => x.id === item.nodeId)
      addColNode(colNode ? colNode.parentId : null, item.nodeId)
      ElMessage.success('已添加同级列')
      break
    }
    case 'deleteCol':
      deleteColNode(item.nodeId)
      ElMessage.success('已删除列')
      break
  }
}

// 创建列分组：在指定列外包一层父节点 → 表头多一行
function findColParent(tree, id, parent = null) {
  for (const n of tree) {
    if (n.id === id) return parent
    if (n.children && n.children.length) {
      const r = findColParent(n.children, id, n)
      if (r) return r
    }
  }
  return null
}
function groupColumn(colNodeId) {
  ElMessageBox.prompt('请输入分组名称', '创建列分组', {
    confirmButtonText: '创建',
    cancelButtonText: '取消',
    inputValue: '分组',
    inputValidator: (v) => (v && v.trim() ? true : '名称不能为空'),
  }).then(({ value }) => {
    const parent = findColParent(columnTree.value, colNodeId)
    const targetArr = parent ? parent.children : columnTree.value
    const idx = targetArr.findIndex(n => n.id === colNodeId)
    if (idx < 0) return
    const newParent = {
      id: 'col_grp_' + Date.now(),
      name: value.trim(),
      type: 'group',
      level: targetArr[idx].level,
      children: [targetArr[idx]],
    }
    targetArr[idx].level = (targetArr[idx].level || 0) + 1
    targetArr.splice(idx, 1, newParent)
    ElMessage.success('已创建列分组，表头变为多行')
  }).catch(() => {})
}

// 点击外部关闭菜单
function onDocClick() { hideCtx() }

// ========== 拖拽放置（数据源字段绑定）==========
function parseDragData(event) {
  const raw = event.dataTransfer.getData('application/json')
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

// 列头放置：绑定维度/指标到列
function onColDragOver(event, colNode) {
  const data = parseDragData(event)
  if (data && data.source === 'dataPanel') {
    event.dataTransfer.dropEffect = 'copy'
    event.currentTarget.classList.add('drag-over-col')
  }
}
function onColDragLeave(event, colNode) {
  event.currentTarget.classList.remove('drag-over-col')
}
function onColDrop(event, colNode) {
  event.preventDefault()
  event.currentTarget.classList.remove('drag-over-col')
  const data = parseDragData(event)
  if (!data || data.source !== 'dataPanel') return
  bindFieldToColumn(colNode.id, data)
  ElMessage.success(`已绑定字段「${data.label}」到列「${colNode.name}」`)
}

// 单元格放置：绑定字段到单元格
function onCellDragOver(event, rowNode, colLeaf) {
  if (rowNode.isSummary) return
  const data = parseDragData(event)
  if (data && data.source === 'dataPanel') {
    event.dataTransfer.dropEffect = 'copy'
    event.currentTarget.classList.add('drag-over-cell')
  }
}
function onCellDragLeave(event, rowNode, colLeaf) {
  event.currentTarget.classList.remove('drag-over-cell')
}
function onCellDrop(event, rowNode, colLeaf) {
  event.preventDefault()
  event.currentTarget.classList.remove('drag-over-cell')
  if (rowNode.isSummary) {
    ElMessage.info('汇总行由聚合自动计算，不可绑定')
    return
  }
  const data = parseDragData(event)
  if (!data || data.source !== 'dataPanel') return
  bindFieldToCell(rowNode.id, colLeaf.id, data)
  ElMessage.success(`已绑定字段「${data.label}」`)
}

// ========== Init ==========
onMounted(() => {
  if (flatRowTree.value.length === 0) {
    initDemoData()
  }
  document.addEventListener('click', onDocClick)
})
onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
})
</script>

<style scoped>
.report-canvas {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f7f8fa;
  position: relative;
}

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

/* 标题行 */
.title-row {
  display: flex;
  border-bottom: 2px solid #1677ff;
  background: #f0f7ff;
}
.title-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: #1677ff;
  cursor: pointer;
  user-select: none;
  padding: 8px 16px;
}
.title-cell:hover { background: #e6f0ff; }
.title-input {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  background: white;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  color: #1677ff;
  font-family: inherit;
}

/* 多行列表头 */
.col-headers {
  display: flex;
  position: sticky;
  top: 0;
  z-index: 30;
  background: #f5f7fa;
  border-bottom: 1px solid #e0e0e0;
}
.corner-cell {
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  background: #f5f7fa;
  flex-shrink: 0;
  position: sticky;
  left: 0;
  z-index: 35;
}
.col-header-rows {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.col-header-row {
  display: flex;
  flex: 1;
}
.col-header-grid {
  flex: 1;
  overflow: hidden;
}
.col-header {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #333;
  font-weight: 600;
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
  position: relative;
  background: #fafbfc;
  padding: 0 8px;
  gap: 4px;
  box-sizing: border-box;
}
.col-header-parent {
  background: #eef4ff;
  color: #1677ff;
  font-weight: 700;
}
.col-header:hover { background: #e6f0ff; }
.col-header.active { background: #d0e4ff; color: #1677ff; }
.col-header-text {
  flex: 1;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.required-mark { color: #f5222d; font-weight: 700; font-size: 12px; }
.col-type-tag {
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 3px;
  background: #e6f0ff;
  color: #1677ff;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 500;
}
.col-resize-handle {
  position: absolute;
  right: -3px;
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: col-resize;
  z-index: 10;
}
.col-resize-handle:hover { background: #1677ff; }

/* 行 */
.sheet-row {
  display: flex;
  position: relative;
}
.row-header {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #333;
  font-weight: 500;
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  background: #fafbfc;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
  position: sticky;
  left: 0;
  z-index: 25;
  padding-right: 12px;
  gap: 4px;
  box-sizing: border-box;
}
.row-header:hover { background: #e6f0ff; }
.row-header.active { background: #d0e4ff; color: #1677ff; }
.row-header-text {
  flex: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.row-summary-icon {
  color: #fa8c16;
  font-weight: 700;
  font-size: 13px;
  width: 16px;
  text-align: center;
}
.row-func-tag {
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 3px;
  background: #fff7e6;
  color: #fa8c16;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 500;
}
.row-resize-handle {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -3px;
  height: 6px;
  cursor: row-resize;
  z-index: 10;
}
.row-resize-handle:hover { background: #1677ff; }

.sheet-row.row-selected { background: #f0f7ff; }
/* 小计行：浅琥珀 */
.sheet-row.row-subtotal { background: #fff7e6; }
.sheet-row.row-subtotal .row-header {
  background: #fff7e6;
  font-weight: 700;
  color: #d46b08;
}
/* 合计行：深琥珀 + 顶边框强调 */
.sheet-row.row-grandtotal { background: #fff1d6; border-top: 2px solid #fa8c16; }
.sheet-row.row-grandtotal .row-header {
  background: #fff1d6;
  font-weight: 700;
  color: #ad4e00;
  border-top: 2px solid #fa8c16;
}

/* 单元格 */
.sheet-cell {
  height: 100%;
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  padding: 0 8px;
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
  box-sizing: border-box;
}
.sheet-cell:hover { background: #f5f7ff; }
.sheet-cell.cell-selected {
  outline: 2px solid #1677ff;
  outline-offset: -2px;
  z-index: 10;
  box-shadow: 0 0 0 4px rgba(22, 119, 255, 0.12);
}
.sheet-cell.cell-editing {
  padding: 0;
  outline: 2px solid #1677ff;
  outline-offset: -2px;
  z-index: 10;
}
.sheet-cell.row-summary-cell {
  background: #fffbe6;
  font-weight: 600;
  color: #d46b08;
}
.sheet-cell.row-grandtotal-cell {
  background: #fff1d6;
  font-weight: 700;
  color: #ad4e00;
  border-top: 2px solid #fa8c16;
}
.sheet-cell.col-readonly { background: #fafafa; color: #999; cursor: not-allowed; }

/* 合并标题单元格 */
.summary-merged-cell {
  justify-content: center;
  font-weight: 700;
}
.summary-merged-text {
  font-size: 13px;
}

.cell-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}
.cell-formula-badge {
  font-size: 9px;
  font-weight: 700;
  font-style: italic;
  color: #1677ff;
  background: #e6f0ff;
  padding: 0 3px;
  border-radius: 3px;
  flex-shrink: 0;
  margin-right: 4px;
  line-height: 14px;
  height: 14px;
}
.cell-input {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 12px;
  color: #333;
  padding: 0 8px;
  font-family: inherit;
  box-sizing: border-box;
}

/* 行/列头名称内联编辑输入框 */
.header-input {
  width: 100%;
  height: 100%;
  border: none;
  outline: 2px solid #1677ff;
  outline-offset: -2px;
  background: #fff;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #1677ff;
  font-family: inherit;
  box-sizing: border-box;
  padding: 0 4px;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #8c8c8c;
  gap: 8px;
}
.empty-icon { font-size: 48px; opacity: 0.5; }
.empty-text { font-size: 14px; font-weight: 500; }
.empty-hint { font-size: 12px; color: #bfbfbf; }

/* 右键菜单 */
.ctx-menu {
  position: fixed;
  min-width: 170px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  padding: 4px 0;
  user-select: none;
}
.ctx-item {
  padding: 7px 14px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}
.ctx-item:hover { background: #f0f7ff; color: #1677ff; }
.ctx-item.ctx-sep {
  padding: 0;
  height: 1px;
  background: #eee;
  cursor: default;
  margin: 4px 0;
}
.ctx-item.ctx-sep:hover { background: #eee; color: #333; }
.ctx-item.ctx-danger { color: #f5222d; }
.ctx-item.ctx-danger:hover { background: #fff1f0; color: #f5222d; }
.ctx-label { flex: 1; }

/* 拖拽放置高亮 */
.col-header.drag-over-col {
  background: #e6f0ff !important;
  box-shadow: inset 0 0 0 2px #1677ff;
}
.sheet-cell.drag-over-cell {
  background: #f0f7ff !important;
  box-shadow: inset 0 0 0 2px #1677ff;
}

/* 列上绑定了数据源字段的标记 */
.col-header-text::after {
  content: '';
}
.col-header .col-bind-tag {
  display: inline-block;
  font-size: 9px;
  color: #1677ff;
  background: #e6f0ff;
  padding: 0 4px;
  border-radius: 3px;
  margin-left: 4px;
  font-weight: 400;
}
</style>
