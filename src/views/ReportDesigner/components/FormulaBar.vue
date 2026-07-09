<template>
  <div class="formula-bar">
    <div class="cell-ref">
      <span class="ref-label">{{ cellRef }}</span>
      <div class="ref-actions">
        <button class="ref-btn" title="取消" @click="emit('cancelEdit')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <button class="ref-btn" title="确认" @click="emit('confirmEdit')">
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
        @keydown.enter="emit('confirmEdit')"
        @keydown.esc="emit('cancelEdit')"
        placeholder="输入值或公式，例如 =SUM(C4:C9)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDesigner } from '../composables/useDesigner.js'

const emit = defineEmits(['cancelEdit', 'confirmEdit', 'insertFunction', 'update:displayValue'])

const props = defineProps({
  displayValue: { type: String, default: '' }
})

const { selectedCell, getCell, getColLetter } = useDesigner()

const cellRef = computed(() => {
  const r = selectedCell.row
  const c = selectedCell.col
  if (r === null || c === null) return ''
  return getColLetter(c) + (r + 1)
})
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
</style>
