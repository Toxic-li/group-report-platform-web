/**
 * useCellEdit - 单元格编辑系统
 *
 * 从 ReportFill/index.vue 中提取的单元格编辑、键盘导航、
 * 复制粘贴等交互逻辑。
 */
import { ref, reactive, nextTick } from 'vue'

export function useCellEdit({ config, visibleRows, store, validationEngine,
  permissionEngine, colIndexMap, isColHidden, triggerAutoSave, recalcFormulas,
  showToast, containerRef, scrollToIndex, isReadOnly }) {

  const editingCell = reactive({ rowId: null, colIdx: null })
  const editValue = ref('')
  const editError = ref(false)
  const hoverId = ref(null)
  const selectedCell = reactive({ val: null, row: null, colIdx: null })

  const VALIDATION_RULES = {
    numeric: { test: (v) => !isNaN(parseFloat(v)) && isFinite(v), message: '请输入有效数字' },
    nonNegative: { test: (v) => parseFloat(v) >= 0, message: '数值不能小于0' },
    percentRange: {
      test: (v) => { const n = parseFloat(v); return !isNaN(n) && n >= -100 && n <= 100 },
      message: '百分比范围为 -100% ~ 100%'
    }
  }

  function isEditingCell(row, colIdx) {
    return editingCell.rowId === row.id && editingCell.colIdx === colIdx
  }

  function startEdit(val, row, colIdx, event) {
    selectedCell.val = val
    selectedCell.row = row
    selectedCell.colIdx = colIdx

    if (isReadOnly?.value) {
      return 'openDetail'
    }

    if (val.readOnly || val.formula || val.f) {
      return 'openDetail'
    }

    if (permissionEngine && !permissionEngine.canEditCell(row.depth, colIdx, val)) {
      showToast('无编辑权限', 'warning')
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
    event?.stopPropagation()
  }

  function commitEdit(val, row, colIdx, event) {
    if (editingCell.rowId !== row.id || editingCell.colIdx !== colIdx) return
    const newValue = editValue.value.trim()

    if (validationEngine) {
      const vr = validationEngine.validate(val.colIdx, colIdx, newValue)
      if (!vr.valid) { editError.value = true; showToast(vr.message, 'error'); return }
    } else {
      const vr = validateCellValue(newValue, val, row)
      if (!vr.valid) { editError.value = true; showToast(vr.message, 'error'); return }
    }

    val.v = newValue; val.raw = newValue
    store.updateCellValue(row.id, getColIdByIndex(colIdx), newValue)

    const frozenRows = config.value?.frozenRowCount || 4
    const ri = (config.value?.rows || []).findIndex(r => r.id === row.id)
    if (ri >= 0) {
      const key = `${frozenRows + ri}-${colIdx + 2}`
      if (config.value?.cellData?.[key]) {
        config.value.cellData[key].v = newValue
        config.value.cellData[key].raw = newValue
      }
    }

    clearEditing(); triggerAutoSave(); recalcFormulas()
    event?.stopPropagation()
  }

  function cancelEdit() { clearEditing(); editError.value = false }
  function clearEditing() { editingCell.rowId = null; editingCell.colIdx = null; editValue.value = '' }
  function getColIdByIndex(colIdx) { return colIndexMap.value.get(colIdx) || `col_${colIdx}` }

  function validateCellValue(value, val, row) {
    const ct = val.colTitle || ''
    if (value === '' || value == null) return { valid: true, message: '' }
    if (!VALIDATION_RULES.numeric.test(value)) return { valid: false, message: VALIDATION_RULES.numeric.message }
    const n = parseFloat(value)
    if (/产量|销量|运量/.test(ct) && !VALIDATION_RULES.nonNegative.test(n)) return { valid: false, message: VALIDATION_RULES.nonNegative.message }
    if (/率|增长率/.test(ct) && !VALIDATION_RULES.percentRange.test(n)) return { valid: false, message: VALIDATION_RULES.percentRange.message }
    return { valid: true, message: '' }
  }

  function onEditInputKeydown(event, val, row, colIdx) {
    switch (event.key) {
      case 'Enter': event.preventDefault(); commitEdit(val, row, colIdx, event); moveToNextEditable(row, colIdx, 1); break
      case 'Escape': event.preventDefault(); cancelEdit(); break
      case 'Tab': event.preventDefault(); commitEdit(val, row, colIdx, event); moveToNextEditable(row, colIdx, 0, event.shiftKey ? -1 : 1); break
    }
  }

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
      if (!target.readOnly) {
        if (scrollToIndex) scrollToIndex(ti)
        nextTick(() => startEdit(target, rows[ti], tj))
      }
    }
  }

  function moveToNextEditable(currentRow, currentCol, dRow = 0, dCol = 1) {
    const rows = visibleRows.value
    const ci = rows.findIndex(r => r.id === currentRow.id)
    if (ci < 0) return
    let ti = ci, tj = currentCol + dCol
    if (dCol !== 0) {
      while (tj >= 0 && tj < (rows[ti].values?.length || 0)) {
        if (!rows[ti].values[tj].readOnly) {
          if (scrollToIndex) scrollToIndex(ti)
          nextTick(() => startEdit(rows[ti].values[tj], rows[ti], tj))
          return
        }
        tj += dCol
      }
    }
    ti += dRow
    if (ti >= 0 && ti < rows.length) {
      for (let j = 0; j < (rows[ti].values?.length || 0); j++) {
        if (!rows[ti].values[j].readOnly) {
          if (scrollToIndex) scrollToIndex(ti)
          nextTick(() => startEdit(rows[ti].values[j], rows[ti], j))
          return
        }
      }
    }
  }

  function setCellRef(el, rowId, colIdx) { /* DOM引用 */ }

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

  return {
    editingCell, editValue, editError, hoverId, selectedCell,
    isEditingCell, startEdit, commitEdit, cancelEdit, clearEditing,
    onEditInputKeydown, onEditKeydown, navigateCell, moveToNextEditable,
    setCellRef, onCopy, onPaste, fmtVal, validateCellValue,
    VALIDATION_RULES
  }
}
