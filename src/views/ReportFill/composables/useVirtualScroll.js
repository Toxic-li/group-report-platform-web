/**
 * useVirtualScroll - 表格虚拟滚动计算
 *
 * 根据滚动位置和视口高度，计算需要渲染的行范围。
 * 仅渲染可视区域 + overscan 缓冲行，大幅减少 DOM 节点数量。
 *
 * 适用于等高行的 <table> 布局：通过 spacer <tr> 维持总滚动高度。
 *
 * @param {Ref<Array>} sourceRows   - 所有行（已过滤、已展开的完整数组）
 * @param {Ref<number>} scrollTop   - 当前滚动位置 (px)
 * @param {Ref<number>} viewportH   - 可视区域高度 (px)
 * @param {number} rowHeight        - 每行固定高度 (px)
 * @param {number} overscan         - 视口外额外渲染的行数（上下各一份）
 */
import { computed } from 'vue'

export function useVirtualScroll(sourceRows, scrollTop, viewportH, rowHeight = 32, overscan = 8) {
  const totalRows = computed(() => sourceRows.value.length)
  const totalHeight = computed(() => totalRows.value * rowHeight)

  const startIndex = computed(() => {
    const idx = Math.floor(scrollTop.value / rowHeight) - overscan
    return Math.max(0, idx)
  })

  const endIndex = computed(() => {
    const visibleCount = Math.ceil(viewportH.value / rowHeight) + overscan * 2
    return Math.min(totalRows.value, startIndex.value + visibleCount)
  })

  const topSpacerHeight = computed(() => startIndex.value * rowHeight)

  const bottomSpacerHeight = computed(() => {
    return Math.max(0, (totalRows.value - endIndex.value) * rowHeight)
  })

  const virtualRows = computed(() => {
    return sourceRows.value.slice(startIndex.value, endIndex.value)
  })

  /** 当前行是否在虚拟窗口内（用于判断是否需要滚动） */
  function isRowVisible(index) {
    return index >= startIndex.value && index < endIndex.value
  }

  return {
    totalRows,
    totalHeight,
    startIndex,
    endIndex,
    topSpacerHeight,
    bottomSpacerHeight,
    virtualRows,
    isRowVisible,
  }
}
