<template>
  <div class="de-footer">
    <!-- Review Opinion Banner (for rejected entries) -->
    <div v-if="reviewOpinion" class="de-review-banner">
      <div class="de-review-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span class="de-review-title">审核退回</span>
      </div>
      <div class="de-review-body">
        <p class="de-review-reason">{{ reviewOpinion }}</p>
        <div v-if="reviewItems && reviewItems.length > 0" class="de-review-items">
          <span class="de-review-items-label">需修改项：</span>
          <span v-for="(item, idx) in reviewItems" :key="idx" class="de-review-item-tag">{{ item }}</span>
        </div>
      </div>
      <button class="de-review-dismiss" @click="$emit('dismissReview')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <!-- Footer Bar -->
    <div class="de-footer-bar">
      <div class="de-footer-left">
        <div class="de-progress-segment">
          <span class="de-progress-label">已填写</span>
          <span class="de-progress-text">{{ filledCount }}/{{ totalCells }}</span>
        </div>
        <div class="de-progress-bar">
          <div class="de-progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
        <span class="de-progress-pct">{{ progress }}%</span>
      </div>
      <div class="de-footer-right">
        <button class="de-fb-btn de-fb-btn--ghost" @click="$emit('save')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          保存草稿
        </button>
        <button
          v-if="submitEnabled"
          class="de-fb-btn de-fb-btn--primary"
          :disabled="!canSubmit"
          @click="$emit('submit')"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
          {{ submitLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  filledCount: { type: Number, default: 0 },
  totalCells: { type: Number, default: 0 },
  validationErrorCount: { type: Number, default: 0 },
  reviewOpinion: { type: String, default: '' },
  reviewItems: { type: Array, default: () => [] },
  status: { type: String, default: 'draft' },
})

defineEmits(['save', 'submit', 'dismissReview'])

const progress = computed(() => {
  if (props.totalCells === 0) return 0
  return Math.min(100, Math.round((props.filledCount / props.totalCells) * 100))
})

const canSubmit = computed(() => {
  return progress.value > 0 && props.validationErrorCount === 0
})

const submitEnabled = computed(() => {
  return !['approved'].includes(props.status)
})

const submitLabel = computed(() => {
  if (props.status === 'rejected') return '重新提交'
  return '提交审核'
})
</script>

<style scoped>
.de-footer { flex-shrink: 0; }
.de-review-banner {
  display: flex; align-items: flex-start; gap: var(--app-space-3);
  padding: var(--app-space-3) var(--app-space-6); background: var(--app-warning-bg);
  border-top: 1px solid var(--app-warning); position: relative;
}
.de-review-header { display: flex; align-items: center; gap: 6px; flex-shrink: 0; margin-top: 1px; color: var(--app-warning); }
.de-review-title { font-size: 13px; font-weight: 600; }
.de-review-body { flex: 1; }
.de-review-reason { margin: 0 0 6px; font-size: 13px; color: var(--app-text-primary); line-height: 1.5; }
.de-review-items { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.de-review-items-label { font-size: 12px; color: var(--app-text-muted); }
.de-review-item-tag {
  font-size: 11px; padding: 1px 8px; background: var(--app-surface); border: 1px solid var(--app-warning);
  border-radius: var(--app-radius-xs); color: var(--app-warning);
}
.de-review-dismiss {
  position: absolute; right: var(--app-space-4); top: var(--app-space-3);
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  border: none; background: transparent; border-radius: var(--app-radius-sm);
  cursor: pointer; color: var(--app-text-muted); transition: all var(--app-transition-fast);
}
.de-review-dismiss:hover { background: var(--app-surface-hover); color: var(--app-text-primary); }

.de-footer-bar {
  display: flex; justify-content: space-between; align-items: center;
  padding: var(--app-space-4) var(--app-space-6); background: var(--app-surface);
  border-top: 1px solid var(--app-border);
}
.de-footer-left { display: flex; align-items: center; gap: var(--app-space-3); }
.de-progress-segment { display: flex; align-items: center; gap: var(--app-space-1); flex-shrink: 0; }
.de-progress-label { font-size: 13px; color: var(--app-text-secondary); }
.de-progress-text { font-size: 13px; font-weight: 500; color: var(--app-text-primary); font-family: var(--app-font-family-number); }
.de-progress-bar { width: 180px; height: 6px; background: var(--app-border); border-radius: 3px; overflow: hidden; }
.de-progress-fill { height: 100%; background: var(--app-primary); border-radius: 3px; transition: width var(--app-transition-slow); }
.de-progress-pct { font-size: 13px; font-weight: 600; color: var(--app-primary); min-width: 36px; text-align: right; }
.de-footer-right { display: flex; gap: var(--app-space-3); }

.de-fb-btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 40px; padding: 0 var(--app-space-5); border-radius: var(--app-radius-md);
  font-size: 14px; font-weight: 500; cursor: pointer; font-family: inherit;
  transition: all var(--app-transition-fast); border: 1px solid var(--app-border);
  background: var(--app-surface); color: var(--app-text-primary);
}
.de-fb-btn:hover:not(:disabled) { background: var(--app-surface-hover); }
.de-fb-btn--primary { background: var(--app-primary); color: #fff; border-color: var(--app-primary); }
.de-fb-btn--primary:hover:not(:disabled) { background: var(--app-primary-hover); }
.de-fb-btn--ghost { background: transparent; border-color: transparent; color: var(--app-text-secondary); }
.de-fb-btn--ghost:hover:not(:disabled) { background: var(--app-surface-hover); color: var(--app-primary); }
.de-fb-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
