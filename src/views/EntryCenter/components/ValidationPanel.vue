<template>
  <div class="de-validation">
    <div class="de-val-header">
      <h3 class="de-val-title">数据校验结果</h3>
      <button class="de-val-refresh" @click="$emit('validate')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
        重新校验
      </button>
    </div>

    <div class="de-val-body">
      <!-- Error Summary -->
      <div v-if="errors.length > 0" class="de-val-errors">
        <div class="de-val-summary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          <span>共发现 <strong>{{ errors.length }}</strong> 个{{ errors.length === 1 ? '错误' : '问题' }}</span>
        </div>

        <!-- Error by Category -->
        <div class="de-val-categories" v-if="errorCategories.required.length > 0">
          <div class="de-val-cat-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            必填项缺失 ({{ errorCategories.required.length }})
          </div>
          <div class="de-val-item" v-for="err in errorCategories.required" :key="err.cell" @click="locateError(err)">
            <span class="de-val-cell">{{ err.label || `单元格 ${err.cell}` }}</span>
            <span class="de-val-msg">{{ err.message }}</span>
          </div>
        </div>

        <div class="de-val-categories" v-if="errorCategories.format.length > 0">
          <div class="de-val-cat-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            格式错误 ({{ errorCategories.format.length }})
          </div>
          <div class="de-val-item" v-for="err in errorCategories.format" :key="err.cell" @click="locateError(err)">
            <span class="de-val-cell">{{ err.label || `单元格 ${err.cell}` }}</span>
            <span class="de-val-msg">{{ err.message }}</span>
          </div>
        </div>

        <div class="de-val-categories" v-if="errorCategories.business.length > 0">
          <div class="de-val-cat-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            业务校验不通过 ({{ errorCategories.business.length }})
          </div>
          <div class="de-val-item" v-for="err in errorCategories.business" :key="err.cell" @click="locateError(err)">
            <span class="de-val-cell">{{ err.label || `单元格 ${err.cell}` }}</span>
            <span class="de-val-msg">{{ err.message }}</span>
          </div>
        </div>
      </div>

      <!-- Success -->
      <div v-else class="de-val-success">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--app-success)" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <p>数据校验通过，未发现问题</p>
        <span class="de-val-sub">可以提交审核</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  errors: { type: Array, default: () => [] },
})

defineEmits(['validate', 'locateError'])

const errorCategories = computed(() => {
  const result = { required: [], format: [], business: [] }
  for (const err of props.errors) {
    const msg = typeof err === 'string' ? err : err.message || ''
    if (msg.includes('不能为空') || msg.includes('必填') || msg.includes('缺失')) {
      result.required.push(typeof err === 'string' ? { message: err, cell: '' } : err)
    } else if (msg.includes('格式') || msg.includes('类型') || msg.includes('数字')) {
      result.format.push(typeof err === 'string' ? { message: err, cell: '' } : err)
    } else {
      result.business.push(typeof err === 'string' ? { message: err, cell: '' } : err)
    }
  }
  return result
})

function locateError(err) {
  emit('locateError', err)
}
</script>

<style scoped>
.de-validation {
  height: 100%; display: flex; flex-direction: column;
  background: var(--app-surface); border-radius: var(--app-radius-lg);
  border: 1px solid var(--app-border); overflow: hidden;
}
.de-val-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: var(--app-space-4) var(--app-space-5); border-bottom: 1px solid var(--app-border); flex-shrink: 0;
}
.de-val-title { margin: 0; font-size: 15px; font-weight: 600; color: var(--app-text-primary); }
.de-val-refresh {
  display: flex; align-items: center; gap: 4px; padding: 6px 12px;
  border: none; background: transparent; border-radius: var(--app-radius-sm);
  cursor: pointer; font-size: 12px; color: var(--app-text-secondary); font-family: inherit;
}
.de-val-refresh:hover { background: var(--app-surface-hover); }
.de-val-body { flex: 1; overflow: auto; padding: var(--app-space-5); }
.de-val-errors { display: flex; flex-direction: column; gap: var(--app-space-4); }
.de-val-summary {
  display: flex; align-items: center; gap: var(--app-space-2);
  padding: var(--app-space-3) var(--app-space-4); background: var(--app-danger-bg);
  border-radius: var(--app-radius-sm); font-size: 14px; font-weight: 500; color: var(--app-danger);
}
.de-val-categories { margin-top: var(--app-space-2); }
.de-val-cat-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600; color: var(--app-text-primary); margin-bottom: var(--app-space-2);
}
.de-val-item {
  display: flex; align-items: center; gap: var(--app-space-3);
  padding: var(--app-space-2) var(--app-space-3); margin-bottom: 4px;
  background: var(--app-bg); border-radius: var(--app-radius-xs); cursor: pointer;
  font-size: 13px; border-left: 3px solid var(--app-danger); transition: all var(--app-transition-fast);
}
.de-val-item:hover { background: var(--app-danger-bg); }
.de-val-cell { color: var(--app-text-secondary); min-width: 80px; flex-shrink: 0; }
.de-val-msg { color: var(--app-danger); }
.de-val-success {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: var(--app-space-10); text-align: center;
}
.de-val-success p { margin: var(--app-space-4) 0 0; font-size: 14px; color: var(--app-text-secondary); }
.de-val-sub { font-size: 12px; color: var(--app-text-muted); margin-top: var(--app-space-1); }
</style>
