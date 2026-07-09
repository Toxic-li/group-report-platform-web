<template>
  <div class="de-spreadsheet" ref="sheetRef" @keydown="handleKeyboard" tabindex="0">
    <div class="de-spreadsheet-inner">
      <!-- Column Headers -->
      <div class="de-sheet-header">
        <div class="de-corner"></div>
        <div
          v-for="col in columns"
          :key="col.index"
          class="de-col-header"
          :style="{ width: col.width + 'px' }"
        >
          {{ col.label }}
        </div>
      </div>

      <!-- Rows -->
      <div class="de-sheet-body">
        <div class="de-row" v-for="row in rows" :key="row.index">
          <div class="de-row-header">{{ row.label }}</div>
          <div
            v-for="col in columns"
            :key="col.index"
            :class="getCellClasses(row.index, col.index)"
            :style="{ width: col.width + 'px' }"
            @click="handleCellClick(row.index, col.index)"
            @dblclick="handleCellDblClick(row.index, col.index)"
            @contextmenu.prevent="handleContextMenu(row.index, col.index, $event)"
          >
            <span v-if="getCell(row.index, col.index)?.isFormula" class="de-fx-badge">fx</span>
            <span class="de-cell-value">{{ getCellValue(row.index, col.index) }}</span>
            <div
              v-if="hasCellError(row.index, col.index)"
              class="de-cell-error-dot"
              :title="getCellErrorMsg(row.index, col.index)"
            >!</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cell Editor Overlay -->
    <teleport to="body">
      <div
        v-if="showEditor"
        class="de-cell-editor-popup"
        :style="editorStyle"
        @mousedown.stop
      >
        <input
          ref="editorInput"
          v-model="editValue"
          class="de-cell-input"
          :type="editCellType"
          @blur="handleEditConfirm"
          @keydown.enter="handleEditConfirm"
          @keydown.escape="handleEditCancel"
          @keydown.tab.prevent="handleEditTab"
          @keydown.up.prevent="handleEditArrow('up')"
          @keydown.down.prevent="handleEditArrow('down')"
          @keydown.left.prevent="handleEditArrow('left')"
          @keydown.right.prevent="handleEditArrow('right')"
        />
      </div>
    </teleport>

    <!-- Footer -->
    <div class="de-spreadsheet-footer">
      <span class="de-footer-cell">{{ selectedLabel }}</span>
      <span class="de-footer-mode">{{ showEditor ? '编辑中' : '就绪' }}</span>
      <span class="de-footer-sum">合计: {{ totalSum.toLocaleString() }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, required: true },
  cellData: { type: Object, required: true },
  validationErrors: { type: Array, default: () => [] },
  editable: { type: Boolean, default: true },
})

const emit = defineEmits(['cellChange', 'navigate'])

const sheetRef = ref(null)
const editorInput = ref(null)
const showEditor = ref(false)
const editValue = ref('')
const editRow = ref(-1)
const editCol = ref(-1)
const activeRow = ref(-1)
const activeCol = ref(-1)

const editCellType = computed(() => {
  const cell = getCell(editRow.value, editCol.value)
  return cell?.cellType === 'number' ? 'number' : 'text'
})

const selectedLabel = computed(() => {
  if (activeRow.value < 0 || activeCol.value < 0) return '--'
  const colLabel = String.fromCharCode(65 + activeCol.value)
  return `${colLabel}${activeRow.value + 1}`
})

const totalSum = computed(() => {
  let total = 0
  const sumCol = props.columns.findIndex(c => c.fieldType === 'amount' || c.label?.includes('金额'))
  if (sumCol < 0) return 0
  for (let r = 1; r < props.rows.length - 1; r++) {
    const cell = getCell(r, sumCol)
    if (cell?.value) total += parseFloat(cell.value) || 0
  }
  return total
})

const editorStyle = computed(() => {
  if (!showEditor.value) return { display: 'none' }
  const targetEl = document.querySelector(`[data-row="${editRow.value}"][data-col="${editCol.value}"]`)
  if (targetEl) {
    const rect = targetEl.getBoundingClientRect()
    return {
      position: 'fixed',
      left: rect.left + 'px',
      top: rect.top + 'px',
      width: rect.width + 'px',
      height: rect.height + 'px',
      zIndex: 9999,
    }
  }
  return { display: 'none' }
})

function getCell(row, col) {
  const key = `${row}-${col}`
  return props.cellData[key] || null
}

function getCellValue(row, col) {
  return getCell(row, col)?.value ?? ''
}

function getCellClasses(row, col) {
  const cls = ['de-cell']
  const cell = getCell(row, col)
  if (cell?.isLocked) cls.push('de-cell--locked')
  if (hasCellError(row, col)) cls.push('de-cell--error')
  if (cell?.isModified) cls.push('de-cell--modified')
  if (activeRow.value === row && activeCol.value === col) cls.push('de-cell--active')
  return cls
}

function hasCellError(row, col) {
  return props.validationErrors.some(e =>
    e.cell === `${row}-${col}` || e.includes(`(${row},${col})`)
  )
}

function getCellErrorMsg(row, col) {
  const err = props.validationErrors.find(e =>
    e.cell === `${row}-${col}` || e.includes(`(${row},${col})`)
  )
  return err?.message || err || ''
}

function handleCellClick(row, col) {
  activeRow.value = row
  activeCol.value = col
}

function handleCellDblClick(row, col) {
  if (!props.editable) return
  const cell = getCell(row, col)
  if (cell?.isLocked) return
  editRow.value = row
  editCol.value = col
  editValue.value = cell?.value ?? ''
  showEditor.value = true
  activeRow.value = row
  activeCol.value = col
  nextTick(() => {
    editorInput.value?.focus()
    editorInput.value?.select()
  })
}

function handleContextMenu(row, col, event) {
  activeRow.value = row
  activeCol.value = col
}

function handleEditConfirm() {
  if (editRow.value >= 0 && editCol.value >= 0) {
    emit('cellChange', { row: editRow.value, col: editCol.value, value: editValue.value })
  }
  showEditor.value = false
}

function handleEditCancel() {
  showEditor.value = false
}

function handleEditTab() {
  handleEditConfirm()
  const nextCol = editCol.value + 1
  if (nextCol < props.columns.length) {
    handleCellDblClick(editRow.value, nextCol)
  }
}

function handleEditArrow(dir) {
  let r = editRow.value, c = editCol.value
  switch (dir) {
    case 'up': r = Math.max(0, r - 1); break
    case 'down': r = Math.min(props.rows.length - 1, r + 1); break
    case 'left': c = Math.max(0, c - 1); break
    case 'right': c = Math.min(props.columns.length - 1, c + 1); break
  }
  handleEditConfirm()
  const cell = getCell(r, c)
  if (!cell?.isLocked) handleCellDblClick(r, c)
}

function handleKeyboard(event) {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key.toLowerCase()) {
      case 's':
        event.preventDefault()
        emit('navigate', { action: 'save' })
        break
      case 'c':
        event.preventDefault()
        if (activeRow.value >= 0 && activeCol.value >= 0) {
          navigator.clipboard.writeText(getCellValue(activeRow.value, activeCol.value))
        }
        break
      case 'v':
        event.preventDefault()
        navigator.clipboard.readText().then(text => {
          if (activeRow.value >= 0 && activeCol.value >= 0) {
            emit('cellChange', { row: activeRow.value, col: activeCol.value, value: text })
          }
        })
        break
    }
  } else {
    // Arrow navigation
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault()
      let r = activeRow.value, c = activeCol.value
      switch (event.key) {
        case 'ArrowUp': r = Math.max(0, r - 1); break
        case 'ArrowDown': r = Math.min(props.rows.length - 1, r + 1); break
        case 'ArrowLeft': c = Math.max(0, c - 1); break
        case 'ArrowRight': c = Math.min(props.columns.length - 1, c + 1); break
      }
      activeRow.value = r
      activeCol.value = c
    } else if (event.key === 'Enter' && activeRow.value >= 0 && activeCol.value >= 0) {
      event.preventDefault()
      handleCellDblClick(activeRow.value, activeCol.value)
    } else if (event.key === 'F2' && activeRow.value >= 0 && activeCol.value >= 0) {
      event.preventDefault()
      handleCellDblClick(activeRow.value, activeCol.value)
    }
  }
}

// Focus management
watch(showEditor, (val) => {
  if (!val && sheetRef.value) {
    sheetRef.value.focus()
  }
})
</script>

<style scoped>
.de-spreadsheet {
  flex: 1; display: flex; flex-direction: column;
  background: var(--app-surface); border-radius: var(--app-radius-lg);
  border: 1px solid var(--app-border); overflow: hidden; outline: none;
}
.de-spreadsheet-inner { flex: 1; overflow: auto; }
.de-sheet-header { display: flex; position: sticky; top: 0; z-index: 5; }
.de-corner {
  width: 50px; min-height: 40px; background: var(--app-surface-hover);
  border-right: 1px solid var(--app-border); border-bottom: 1px solid var(--app-border);
}
.de-col-header {
  height: 40px; display: flex; align-items: center; justify-content: center;
  border-right: 1px solid var(--app-border); border-bottom: 1px solid var(--app-border);
  background: var(--app-surface-hover); font-weight: 500; font-size: 13px;
  color: var(--app-text-primary); flex-shrink: 0;
}
.de-row { display: flex; }
.de-row-header {
  width: 50px; min-height: 40px; display: flex; align-items: center; justify-content: center;
  border-right: 1px solid var(--app-border); border-bottom: 1px solid var(--app-border);
  background: var(--app-surface-hover); font-size: 13px;
  color: var(--app-text-secondary); flex-shrink: 0;
}
.de-cell {
  min-height: 40px; display: flex; align-items: center; padding: 0 8px;
  border-right: 1px solid var(--app-border); border-bottom: 1px solid var(--app-border);
  font-size: 13px; color: var(--app-text-primary); cursor: cell;
  flex-shrink: 0; position: relative; transition: background var(--app-transition-fast);
}
.de-cell:hover { background: var(--app-surface-hover); }
.de-cell--locked { background: var(--app-surface-hover); cursor: default; color: var(--app-text-muted); }
.de-cell--error { background: var(--app-danger-bg); }
.de-cell--modified { background: rgba(24, 200, 255, 0.04); }
.de-cell--active { outline: 2px solid var(--app-primary); outline-offset: -2px; z-index: 2; }
.de-fx-badge {
  font-size: 10px; color: var(--app-primary); font-weight: 600;
  margin-right: 4px; font-family: var(--app-font-family-code);
}
.de-cell-error-dot {
  position: absolute; right: 4px; top: 50%; transform: translateY(-50%);
  width: 16px; height: 16px; border-radius: 50%; background: var(--app-danger);
  color: #fff; font-size: 11px; display: flex; align-items: center; justify-content: center;
  font-weight: 700; cursor: help;
}
.de-cell-editor-popup {
  display: flex; align-items: center; background: var(--app-surface);
  box-shadow: var(--app-shadow-lg); border: 2px solid var(--app-primary);
  border-radius: 0;
}
.de-cell-input {
  width: 100%; height: 100%; padding: 0 8px; border: none; outline: none;
  font-size: 13px; font-family: inherit; background: transparent; color: var(--app-text-primary);
}
.de-spreadsheet-footer {
  display: flex; justify-content: flex-end; gap: var(--app-space-6);
  padding: 8px 16px; background: var(--app-surface-hover); border-top: 1px solid var(--app-border);
  flex-shrink: 0;
}
.de-footer-cell, .de-footer-mode, .de-footer-sum { font-size: 12px; color: var(--app-text-muted); }
.de-footer-sum { font-weight: 500; font-family: var(--app-font-family-number); }
</style>
