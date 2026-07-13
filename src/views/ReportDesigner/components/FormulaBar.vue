<template>
  <div class="formula-bar">
    <div class="cell-ref">
      <span class="ref-label">{{ cellRef }}</span>
      <div class="ref-actions">
        <button class="ref-btn" title="取消" @click="emit('cancelEdit')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <button class="ref-btn" title="确认" @click="commitToCell">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
        <button class="ref-btn fx" title="插入函数" @click="emit('insertFunction')">
          <span>fx</span>
        </button>
      </div>
    </div>
    <div class="formula-input-wrap">
      <input
        class="formula-input"
        :value="displayValue"
        @input="$emit('update:displayValue', $event.target.value)"
        @keydown.enter="commitToCell"
        @keydown.esc="$emit('cancelEdit')"
        placeholder="输入值或公式，例如 =SUM(C4:C9)"
      />
    </div>
    <div class="formula-extras">
      <button class="formula-center-btn" title="公式中心 - 打开高级公式编辑器" @click="openFormulaCenter">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        <span>公式中心</span>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="7 17 17 7"/><polyline points="7 7h10v10"/></svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { colNumToLetter } from '@/utils/excelRef.js'
import { useDesigner } from '../composables/useDesigner.js'

const emit = defineEmits(['cancelEdit', 'confirmEdit', 'insertFunction', 'update:displayValue', 'openFormulaCenter'])

const props = defineProps({
  displayValue: { type: String, default: '' }
})

const { selectedCell } = useDesigner()

// selectedCell.row / col 为 0 基索引，转成 Excel 引用（A1 起）
const cellRef = computed(() => {
  const r = selectedCell.row
  const c = selectedCell.col
  if (r === null || c === null) return ''
  return colNumToLetter(c + 1) + (r + 1)
})

function commitToCell() {
  const r = selectedCell.row
  const c = selectedCell.col
  if (r === null || c === null) return
  const value = props.displayValue.trim()
  if (!value) return
  // 单元格写入由父组件（index.vue 的 commitEditFromBar）统一处理，
  // 通过 selectedRegion.rowNodeId / colNodeId 调用 setCellValue
  emit('confirmEdit')
}

function openFormulaCenter() {
  emit('openFormulaCenter', {
    cell: cellRef.value,
    formula: props.displayValue
  })
}
</script>

<style scoped>
.formula-bar {
  height: 32px;
  min-height: 32px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.cell-ref {
  width: 100px;
  min-width: 100px;
  border-right: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  height: 100%;
}

.ref-label {
  font-size: 12px;
  font-weight: 500;
  color: #333;
  font-family: 'Roboto Mono', monospace;
}

.ref-actions {
  display: flex;
  gap: 2px;
  align-items: center;
}

.ref-btn {
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  padding: 0;
  transition: all 0.15s;
}
.ref-btn:hover { background: #f0f0f0; color: #666; }
.ref-btn.fx span {
  font-size: 10px;
  font-weight: 700;
  font-style: italic;
  color: #1677ff;
}

.formula-input-wrap {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 8px;
}

.formula-input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 13px;
  font-family: 'Roboto Mono', monospace;
  color: #333;
  background: transparent;
  height: 100%;
}
.formula-input::placeholder { color: #bfbfbf; font-family: inherit; }

.formula-extras {
  display: flex;
  align-items: center;
  padding-right: 4px;
  flex-shrink: 0;
}

.formula-center-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 24px;
  padding: 0 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  font-size: 11px;
  color: #1677ff;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.formula-center-btn:hover {
  background: #e6f4ff;
  border-color: #91caff;
  color: #0958d9;
}
.formula-center-btn svg { color: #1677ff; }
</style>
