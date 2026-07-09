/**
 * useDataComparison - 数据对比 Composable
 *
 * 提供当前数据与历史版本的数据对比能力
 * 对齐文档 §24：支持当前数据与历史数据对比展示
 */

import { ref, computed } from 'vue'

/**
 * 比较两组单元格数据的差异
 */
function compareCellData(currentCells, historyCells) {
  const changes = []
  const historyMap = {}

  if (historyCells && historyCells.length > 0) {
    historyCells.forEach(cell => {
      historyMap[`${cell.rowIndex}-${cell.colIndex}`] = cell.value || ''
    })
  }

  if (currentCells && currentCells.length > 0) {
    currentCells.forEach(cell => {
      const key = `${cell.rowIndex}-${cell.colIndex}`
      const oldValue = historyMap[key] || ''
      const newValue = cell.value || ''

      if (oldValue !== newValue) {
        changes.push({
          row: cell.rowIndex,
          col: cell.colIndex,
          oldValue,
          newValue,
          isEmpty: !oldValue,
          isDeleted: !newValue,
          isModified: oldValue && newValue,
        })
      }
    })
  }

  return changes
}

/**
 * 判断两个数值的变化方向
 */
function getChangeDirection(oldVal, newVal) {
  const o = parseFloat(oldVal)
  const n = parseFloat(newVal)
  if (isNaN(o) || isNaN(n)) return 'unchanged'
  if (n > o) return 'increase'
  if (n < o) return 'decrease'
  return 'unchanged'
}

/**
 * 计算变化增幅百分比
 */
function getChangePercent(oldVal, newVal) {
  const o = parseFloat(oldVal)
  const n = parseFloat(newVal)
  if (isNaN(o) || isNaN(n) || o === 0) return null
  return ((n - o) / Math.abs(o)) * 100
}

/**
 * Hook: 数据对比
 */
export function useDataComparison() {
  const changes = ref([])
  const isLoading = ref(false)
  const activeVersion = ref('current')

  const hasChanges = computed(() => changes.value.length > 0)

  const stats = computed(() => {
    return {
      total: changes.value.length,
      added: changes.value.filter(c => c.isEmpty).length,
      modified: changes.value.filter(c => c.isModified).length,
      deleted: changes.value.filter(c => c.isDeleted).length,
    }
  })

  function loadComparison(currentCells, historyCells) {
    changes.value = compareCellData(currentCells, historyCells)
  }

  function clearComparison() {
    changes.value = []
  }

  return {
    changes,
    isLoading,
    activeVersion,
    hasChanges,
    stats,
    loadComparison,
    clearComparison,
    getChangeDirection,
    getChangePercent,
  }
}
