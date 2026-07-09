<template>
  <div class="de-header">
    <div class="de-header-left">
      <button class="de-back-btn" @click="$emit('back')" title="返回">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <div class="de-report-meta">
        <h1 class="de-report-name">{{ entry.reportName }}</h1>
        <div class="de-report-info">
          <span class="de-info-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
            填报周期：{{ entry.period }}
          </span>
          <span class="de-info-divider">|</span>
          <span class="de-info-item" :class="{ 'de-info--urgent': entry.isUrgent }">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            截止时间：{{ entry.deadline }}
          </span>
          <span class="de-info-divider">|</span>
          <span :class="['de-header-status', 'de-header-status--' + entry.status]">
            {{ statusText }}
          </span>
        </div>
      </div>
    </div>
    <div class="de-header-right">
      <button class="de-btn de-btn--text" @click="$emit('showHistory')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        历史记录
      </button>
      <button v-if="entry.status === 'rejected' && entry.reviewOpinion" class="de-btn de-btn--text de-btn--warning" @click="$emit('showReview')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        查看退回意见
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  entry: { type: Object, required: true },
})

defineEmits(['back', 'showHistory', 'showReview'])

const statusText = computed(() => {
  const map = {
    draft: '草稿', filling: '填写中', pending: '待填报',
    submitted: '已提交', reviewing: '审核中',
    approved: '已通过', rejected: '已退回',
  }
  return map[props.entry.status] || props.entry.status
})
</script>

<style scoped>
.de-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0 var(--app-space-6); height: 64px;
  background: var(--app-surface); border-bottom: 1px solid var(--app-border);
  flex-shrink: 0;
}
.de-header-left { display: flex; align-items: center; gap: var(--app-space-4); }
.de-back-btn {
  width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
  border: none; background: transparent; border-radius: var(--app-radius-sm);
  cursor: pointer; color: var(--app-text-secondary); transition: all var(--app-transition-fast);
}
.de-back-btn:hover { background: var(--app-surface-hover); color: var(--app-text-primary); }
.de-report-name { font-size: 18px; font-weight: 600; color: var(--app-text-primary); margin: 0; line-height: 1.3; }
.de-report-info { display: flex; align-items: center; gap: var(--app-space-3); margin-top: 2px; font-size: 13px; }
.de-info-item { display: flex; align-items: center; gap: 4px; color: var(--app-text-secondary); }
.de-info--urgent { color: var(--app-danger); font-weight: 500; }
.de-info-divider { color: var(--app-border-dark); }
.de-header-right { display: flex; gap: var(--app-space-2); }

.de-header-status {
  display: inline-flex; align-items: center; gap: 6px; padding: 2px 10px;
  border-radius: var(--app-radius-xl); font-size: 12px; font-weight: 500;
}
.de-header-status::before { content: ''; width: 6px; height: 6px; border-radius: 50%; }
.de-header-status--draft { background: rgba(148, 163, 184, 0.1); color: var(--color-gray-600); }
.de-header-status--draft::before { background: var(--color-gray-500); }
.de-header-status--filling { background: var(--app-primary-bg); color: var(--app-primary); }
.de-header-status--filling::before { background: var(--app-primary); }
.de-header-status--pending { background: var(--app-primary-bg); color: var(--app-primary); }
.de-header-status--pending::before { background: var(--app-primary); }
.de-header-status--submitted { background: var(--app-info-bg); color: var(--app-info); }
.de-header-status--submitted::before { background: var(--app-info); }
.de-header-status--reviewing { background: var(--app-warning-bg); color: var(--app-warning); }
.de-header-status--reviewing::before { background: var(--app-warning); animation: de-pulse 1.5s infinite; }
.de-header-status--approved { background: var(--app-success-bg); color: var(--app-success); }
.de-header-status--approved::before { background: var(--app-success); }
.de-header-status--rejected { background: var(--app-danger-bg); color: var(--app-danger); }
.de-header-status--rejected::before { background: var(--app-danger); }

@keyframes de-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

.de-btn--text {
  display: inline-flex; align-items: center; gap: 6px;
  padding: var(--app-space-1) var(--app-space-3); border-radius: var(--app-radius-sm);
  font-size: 13px; font-weight: 500; cursor: pointer; border: none;
  background: transparent; color: var(--app-text-secondary); transition: all var(--app-transition-fast);
}
.de-btn--text:hover { background: var(--app-surface-hover); color: var(--app-primary); }
.de-btn--warning { color: var(--app-warning); }
.de-btn--warning:hover { background: var(--app-warning-bg); }
</style>
