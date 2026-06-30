<template>
  <div class="cell-panel">
    <div class="panel-header">
      <div class="panel-title">
        <svg viewBox="0 0 16 16" width="14" height="14">
          <path d="M1 1h14v14H1V1zm1 1v12h12V2H2z" fill="currentColor"/>
          <path d="M5 5h6v2H5V5zm0 3h6v2H5V8zm0 3h4v2H5v-2z" fill="currentColor"/>
        </svg>
        <span>单元格</span>
      </div>
      <div class="panel-search">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索单元格..."
          @input="updateSearch"
        />
        <svg viewBox="0 0 16 16" width="12" height="12">
          <path d="M11.5 7a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0zm-1 0a3.5 3.5 0 1 0-7 0 3.5 3.5 0 0 0 7 0z" fill="currentColor"/>
          <path d="M15 14l-4-4" stroke="currentColor" stroke-width="1.5" fill="none"/>
        </svg>
      </div>
    </div>

    <div class="panel-body">
      <div v-if="cellTreeData.length === 0" class="empty-state">
        <svg viewBox="0 0 16 16" width="32" height="32">
          <path d="M1 1h14v14H1V1zm1 1v12h12V2H2z" fill="currentColor"/>
          <path d="M5 5h6v2H5V5zm0 3h6v2H5V8zm0 3h4v2H5v-2z" fill="currentColor"/>
        </svg>
        <span>暂无单元格数据</span>
        <span class="empty-hint">请先配置报表模板的行列维度</span>
      </div>

      <div v-else class="cell-tree">
        <div v-for="rowNode in cellTreeData" :key="rowNode.id" class="row-node">
          <div class="row-header" @click="toggleCellTreeNode(rowNode)">
            <svg viewBox="0 0 16 16" width="12" height="12" :class="{ 'rotated': rowNode.expanded }">
              <path d="M5 4l6 4-6 4V4z" fill="currentColor"/>
            </svg>
            <span class="row-label">{{ rowNode.label }}</span>
            <span class="row-count">{{ rowNode.cells?.length || 0 }}</span>
          </div>
          <div v-show="rowNode.expanded" class="row-cells">
            <div
              v-for="cell in rowNode.cells"
              :key="cell.id"
              :class="[
                'cell-item',
                { 'is-target': isTargetCell(cell) },
                { 'is-in-formula': isInFormula(cell) }
              ]"
              @click="toggleTargetCell(cell)"
              @mouseenter="showCellTooltip(cell)"
              @mouseleave="hideCellTooltip"
              draggable="true"
              @dragstart="handleCellDragStart($event, cell)"
            >
              <span class="cell-icon">
                {{ isTargetCell(cell) ? '🎯' : isInFormula(cell) ? '🔗' : '📊' }}
              </span>
              <span class="cell-ref">{{ cell.excelRef }}</span>
              <span class="cell-label">{{ cell.colLabel }}</span>
              <span class="cell-value" v-if="cell.exampleValue">{{ cell.exampleValue }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="cellTooltip" class="cell-tooltip">
      <div class="tooltip-header">
        <span class="tooltip-ref">{{ cellTooltip.excelRef }}</span>
        <span class="tooltip-pos">R{{ cellTooltip.row }}C{{ cellTooltip.col }}</span>
      </div>
      <div class="tooltip-body">
        <div class="tooltip-row">
          <span class="tooltip-label">行</span>
          <span class="tooltip-value">{{ cellTooltip.rowLabel }}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">列</span>
          <span class="tooltip-value">{{ cellTooltip.colLabel }}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">类型</span>
          <span class="tooltip-value">{{ cellTooltip.dataType }}</span>
        </div>
        <div v-if="cellTooltip.description" class="tooltip-row">
          <span class="tooltip-label">描述</span>
          <span class="tooltip-value">{{ cellTooltip.description }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  name: 'CellPanel',
  props: {
    cellSearch: String,
    cellTreeData: Array,
    cellTooltip: Object,
    formulaData: Object,
    allowInsert: {
      type: Boolean,
      default: true
    }
  },
  emits: ['search', 'update:cellSearch', 'toggle-cell-tree-node', 'toggle-target-cell', 'insert-cell', 'show-tooltip', 'hide-tooltip'],
  setup(props, { emit }) {
    const searchQuery = ref(props.cellSearch || '')

    watch(() => props.cellSearch, (newVal) => {
      searchQuery.value = newVal || ''
    })

    function updateSearch(event) {
      searchQuery.value = event.target.value
      emit('update:cellSearch', searchQuery.value)
      emit('search')
    }

    return {
      searchQuery,
      updateSearch
    }
  },
  methods: {
    searchCells() {
      this.$emit('search')
    },
    toggleCellTreeNode(node) {
      this.$emit('toggle-cell-tree-node', node)
    },
    toggleTargetCell(cell) {
      if (this.allowInsert && !this.isTargetCell(cell)) {
        this.$emit('insert-cell', cell)
      }
      this.$emit('toggle-target-cell', cell)
    },
    isTargetCell(cell) {
      return this.formulaData.targetCells?.some(c => c.id === cell.id)
    },
    isInFormula(cell) {
      if (!this.formulaData.expression) return false
      const cellRefs = [cell.excelRef, `R${cell.row}C${cell.col}`, cell.code]
      return cellRefs.some(ref => this.formulaData.expression.includes(ref))
    },
    showCellTooltip(cell) {
      this.$emit('show-tooltip', cell)
    },
    hideCellTooltip() {
      this.$emit('hide-tooltip')
    },
    handleCellDragStart(event, cell) {
      event.dataTransfer.setData('text/plain', cell.excelRef)
      event.dataTransfer.setData('application/json', JSON.stringify(cell))
    }
  }
}
</script>