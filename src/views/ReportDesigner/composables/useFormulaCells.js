import { ref, computed } from 'vue'

export function useFormulaCells(props, formulaData) {
  const leftPanelTab = ref('indicators')
  const cellSearch = ref('')
  const cellTreeData = ref([])
  const cellTooltip = ref(null)

  const cellSelectorVisible = ref(false)
  const cellSelectorTitle = ref('选择单元格')
  const cellSelectionMode = ref('target')
  const selectedCalcCells = ref([])

  const template = computed(() => {
    if (!props.template) {
      return {}
    }
    return props.template
  })

  function initializeCellData() {
    if (props.template && props.template.rowTree && props.template.columnTree) {
      const rowLeaves = extractTreeLeaves(props.template.rowTree, 'row')
      const colLeaves = extractTreeLeaves(props.template.columnTree, 'col')

      const cellTreeNodes = []
      rowLeaves.forEach((rowLeaf, rowIndex) => {
        const rowNode = {
          id: rowLeaf.id || `row_${rowIndex}`,
          label: rowLeaf.label || rowLeaf.name || rowLeaf.fieldName || `行${rowIndex + 1}`,
          expanded: rowIndex < 3,
          cells: []
        }

        colLeaves.forEach((colLeaf, colIndex) => {
          const cell = {
            id: `cell_${rowIndex}_${colIndex}`,
            row: rowIndex + 1,
            col: colIndex + 1,
            rowLabel: rowLeaf.label || rowLeaf.name || rowLeaf.fieldName || `行${rowIndex + 1}`,
            colLabel: colLeaf.label || colLeaf.name || colLeaf.fieldName || `列${colIndex + 1}`,
            excelRef: convertToExcelRef(rowIndex + 1, colIndex + 1),
            code: rowLeaf.fieldName || rowLeaf.code || rowLeaf.id,
            fieldName: colLeaf.fieldName || colLeaf.code || colLeaf.id,
            description: `${rowNode.label} × ${colLeaf.label || colLeaf.name || `列${colIndex + 1}`}`,
            dataType: colLeaf.dataType || rowLeaf.dataType || 'number',
            exampleValue: generateExampleValue(colLeaf.dataType || rowLeaf.dataType || 'number'),
            category: 'cell',
            type: 'cell'
          }
          rowNode.cells.push(cell)
        })
        cellTreeNodes.push(rowNode)
      })
      cellTreeData.value = cellTreeNodes
    } else if (props.cells && props.cells.length > 0) {
      const cellTreeNodes = []
      const rowGroups = {}
      props.cells.forEach(cell => {
        const rowKey = `row_${cell.row}`
        if (!rowGroups[rowKey]) {
          rowGroups[rowKey] = {
            id: rowKey,
            label: cell.rowLabel || `行${cell.row}`,
            expanded: cell.row <= 3,
            cells: []
          }
        }
        rowGroups[rowKey].cells.push({
          id: `cell_${cell.row}_${cell.col}`,
          row: cell.row,
          col: cell.col,
          rowLabel: cell.rowLabel || `行${cell.row}`,
          colLabel: cell.colLabel || `列${cell.col}`,
          excelRef: cell.excelRef || convertToExcelRef(cell.row, cell.col),
          code: cell.ref || `R${cell.row}C${cell.col}`,
          fieldName: cell.fieldName || cell.code || cell.id,
          description: cell.description || `单元格 ${cell.row}行${cell.col}列`,
          dataType: cell.dataType || 'number',
          exampleValue: cell.value || generateExampleValue(cell.dataType || 'number'),
          category: 'cell',
          type: 'cell'
        })
      })
      cellTreeData.value = Object.values(rowGroups).sort((a, b) => {
        const aRow = parseInt(a.id.split('_')[1])
        const bRow = parseInt(b.id.split('_')[1])
        return aRow - bRow
      })
    }
  }

  function extractTreeLeaves(tree, type) {
    const leaves = []
    function traverse(node, depth = 0) {
      if (!node) return
      if (!node.children || node.children.length === 0) {
        leaves.push({ ...node, depth, type })
      } else {
        node.children.forEach(child => traverse(child, depth + 1))
      }
    }
    if (Array.isArray(tree)) {
      tree.forEach(node => traverse(node))
    } else if (tree.children && Array.isArray(tree.children)) {
      traverse(tree)
    } else {
      leaves.push({ ...tree, depth: 0, type })
    }
    return leaves
  }

  function generateExampleValue(dataType) {
    switch (dataType) {
      case 'number':
        return Math.floor(Math.random() * 1000 + 100)
      case 'string':
        return '示例文本'
      case 'boolean':
        return true
      case 'date':
        return '2024-01-01'
      default:
        return Math.floor(Math.random() * 1000 + 100)
    }
  }

  function convertToExcelRef(row, col) {
    const colLetter = String.fromCharCode(64 + col)
    return `${colLetter}${row}`
  }

  function showTargetCellSelector(showNotification) {
    const template = props.template || {}
    const possibleRowTreeNames = ['rowTree', 'rows', 'rowHeaders', 'rowDimensions']
    const possibleColTreeNames = ['columnTree', 'columns', 'colHeaders', 'colDimensions']
    
    let hasRowTree = false
    let hasColumnTree = false
    
    for (const name of possibleRowTreeNames) {
      if (template[name] && template[name].length > 0) {
        hasRowTree = true
        break
      }
    }
    
    for (const name of possibleColTreeNames) {
      if (template[name] && template[name].length > 0) {
        hasColumnTree = true
        break
      }
    }
    
    if (!hasRowTree || !hasColumnTree) {
      if (showNotification) {
        showNotification('error', '⚠️', '当前模板未设计行列维度，请先在左侧面板添加行维度和列维度后再选择单元格')
      }
      return
    }
    cellSelectorVisible.value = true
    cellSelectorTitle.value = '选择目标单元格'
    cellSelectionMode.value = 'target'
    if (showNotification) {
      showNotification('info', '💡', '请在报表中点击选择目标单元格')
    }
  }

  function showCalcCellSelector(showNotification) {
    cellSelectorVisible.value = true
    cellSelectorTitle.value = '选择计算单元格'
    cellSelectionMode.value = 'calc'
    showNotification && showNotification('info', '💡', '请在报表中点击选择参与计算的单元格')
  }

  function handleCellSelectorClose() {
    cellSelectorVisible.value = false
  }

  function handleCellSelectorSelect({ cell, mode }, insertCell, showNotification) {
    if (mode === 'target') {
      if (!formulaData.targetCells) {
        formulaData.targetCells = []
      }
      const existingIndex = formulaData.targetCells.findIndex(c => c.excelRef === cell.excelRef)
      if (existingIndex === -1) {
        formulaData.targetCells.push(cell)
        showNotification && showNotification('success', '🎯', `已添加目标单元格 ${cell.excelRef}`)
      } else {
        showNotification && showNotification('info', 'ℹ️', `目标单元格 ${cell.excelRef} 已存在`)
      }
    } else if (mode === 'calc') {
      insertCell && insertCell(cell)
      showNotification && showNotification('success', '📊', `已添加计算单元格 ${cell.excelRef} 到公式`)
    }
  }

  function handleCellSelectorConfirm({ targetCells, calcCells, cellReference }, insertCell, showNotification) {
    if (targetCells && targetCells.length > 0) {
      formulaData.targetCells = targetCells
      showNotification && showNotification('success', '🎯', `已设置 ${targetCells.length} 个目标单元格`)
    }
    if (calcCells && calcCells.length > 0) {
      selectedCalcCells.value = calcCells
      if (insertCell && cellReference) {
        insertCell({ excelRef: cellReference })
        showNotification && showNotification('success', '✓', `已插入单元格引用 ${cellReference}`)
      }
    }
    cellSelectorVisible.value = false
  }

  function clearTargetCells(showNotification) {
    formulaData.targetCells = []
    showNotification && showNotification('success', '✓', '已清空目标单元格')
  }

  function removeTargetCell(cell, showNotification) {
    const index = formulaData.targetCells.findIndex(c => c.id === cell.id)
    if (index > -1) {
      formulaData.targetCells.splice(index, 1)
      showNotification && showNotification('info', '✗', `已移除目标单元格 ${cell.excelRef}`)
    }
  }

  function toggleTargetCell(cell, showNotification) {
    const index = formulaData.targetCells.findIndex(c => c.id === cell.id)
    if (index > -1) {
      formulaData.targetCells.splice(index, 1)
      showNotification && showNotification('info', '✗', `已取消目标单元格 ${cell.excelRef}`)
    } else {
      formulaData.targetCells.push({ ...cell, isTarget: true })
      showNotification && showNotification('success', '🎯', `已设置目标单元格 ${cell.excelRef}`)
    }
  }

  function isTargetCell(cell) {
    return formulaData.targetCells.some(c => c.id === cell.id)
  }

  function isInFormula(cell) {
    if (!formulaData.expression) return false
    const cellRefs = [
      cell.excelRef,
      `R${cell.row}C${cell.col}`,
      cell.code
    ]
    return cellRefs.some(ref => formulaData.expression.includes(ref))
  }

  function toggleCellTreeNode(node) {
    node.expanded = !node.expanded
  }

  function handleCellDragStart(event, cell) {
    event.dataTransfer.setData('text/plain', cell.excelRef)
    event.dataTransfer.setData('application/json', JSON.stringify(cell))
    event.dataTransfer.effectAllowed = 'copy'
  }

  function showCellTooltip(cell) {
    cellTooltip.value = cell
  }

  function hideCellTooltip() {
    cellTooltip.value = null
  }

  function searchCells() {
    if (!cellSearch.value) return
    const keyword = cellSearch.value.toLowerCase()
    cellTreeData.value.forEach(rowNode => {
      const filteredCells = rowNode.cells.filter(cell =>
        cell.rowLabel.toLowerCase().includes(keyword) ||
        cell.colLabel.toLowerCase().includes(keyword) ||
        cell.excelRef.toLowerCase().includes(keyword) ||
        cell.fieldName.toLowerCase().includes(keyword)
      )
      rowNode.filteredCells = filteredCells
      if (filteredCells.length > 0) {
        rowNode.expanded = true
      }
    })
  }

  return {
    leftPanelTab,
    cellSearch,
    cellTreeData,
    cellTooltip,
    cellSelectorVisible,
    cellSelectorTitle,
    cellSelectionMode,
    selectedCalcCells,
    template,

    initializeCellData,
    showTargetCellSelector,
    showCalcCellSelector,
    handleCellSelectorClose,
    handleCellSelectorSelect,
    handleCellSelectorConfirm,
    clearTargetCells,
    removeTargetCell,
    toggleTargetCell,
    isTargetCell,
    isInFormula,
    toggleCellTreeNode,
    handleCellDragStart,
    showCellTooltip,
    hideCellTooltip,
    searchCells
  }
}