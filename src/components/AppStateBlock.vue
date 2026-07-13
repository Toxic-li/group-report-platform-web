<template>
  <div class="app-state-block" :class="['app-state--' + type]">
    <!-- 加载态 -->
    <template v-if="type === 'loading'">
      <div class="app-state-spinner">
        <div class="app-state-spinner-ring"></div>
        <div class="app-state-spinner-ring"></div>
        <div class="app-state-spinner-ring"></div>
      </div>
      <p class="app-state-text">{{ text || '正在加载...' }}</p>
    </template>

    <!-- 空状态 -->
    <template v-else-if="type === 'empty'">
      <div class="app-state-illustration">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="56" fill="var(--app-bg-soft, #f3f6fb)" stroke="var(--app-border, #e5e7eb)" stroke-width="1.5"/>
          <rect x="36" y="44" width="48" height="40" rx="3" fill="white" stroke="var(--app-border-dark, #d1d5db)" stroke-width="2"/>
          <line x1="44" y1="56" x2="76" y2="56" stroke="var(--app-border-dark, #d1d5db)" stroke-width="2" stroke-linecap="round"/>
          <line x1="44" y1="64" x2="68" y2="64" stroke="var(--app-border-dark, #d1d5db)" stroke-width="2" stroke-linecap="round"/>
          <line x1="44" y1="72" x2="60" y2="72" stroke="var(--app-border-dark, #d1d5db)" stroke-width="2" stroke-linecap="round"/>
          <circle cx="86" cy="36" r="14" fill="var(--app-surface, #ffffff)" stroke="var(--app-primary, #2563eb)" stroke-width="2"/>
          <line x1="86" y1="32" x2="86" y2="40" stroke="var(--app-primary, #2563eb)" stroke-width="2" stroke-linecap="round"/>
          <line x1="86" y1="42" x2="86" y2="42.01" stroke="var(--app-primary, #2563eb)" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <h3 class="app-state-title">{{ title || '暂无数据' }}</h3>
      <p class="app-state-text">{{ text || '当前条件下没有可显示的内容' }}</p>
      <div v-if="$slots.action" class="app-state-action">
        <slot name="action" />
      </div>
    </template>

    <!-- 错误状态 -->
    <template v-else-if="type === 'error'">
      <div class="app-state-illustration">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="56" fill="#fef2f2" stroke="#fecaca" stroke-width="1.5"/>
          <circle cx="60" cy="60" r="28" fill="white" stroke="#ef4444" stroke-width="2.5"/>
          <line x1="60" y1="48" x2="60" y2="64" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="60" y1="70" x2="60" y2="70.01" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </div>
      <h3 class="app-state-title">{{ title || '加载失败' }}</h3>
      <p class="app-state-text">{{ text || '请检查网络或稍后重试' }}</p>
      <div class="app-state-action">
        <button class="app-state-btn app-state-btn--primary" @click="$emit('retry')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          重新加载
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
defineProps({
  type: { type: String, default: 'empty' }, // loading / empty / error
  title: String,
  text: String,
})
defineEmits(['retry'])
</script>

<style scoped>
.app-state-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  min-height: 240px;
}

.app-state-illustration {
  margin-bottom: 20px;
}

.app-state-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--app-text-primary, #1f2937);
  margin: 0 0 8px 0;
}

.app-state-text {
  font-size: 14px;
  color: var(--app-text-muted, #6b7280);
  margin: 0 0 20px 0;
  max-width: 320px;
  line-height: 1.5;
}

.app-state-action {
  display: flex;
  gap: 12px;
}

.app-state-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--app-border, #e5e7eb);
  background: var(--app-surface, #ffffff);
  color: var(--app-text-primary, #1f2937);
  transition: all 0.18s ease;
}
.app-state-btn:hover { background: var(--app-bg-soft, #f3f6fb); }
.app-state-btn--primary {
  background: var(--app-primary, #2563eb);
  color: white;
  border-color: var(--app-primary, #2563eb);
}
.app-state-btn--primary:hover { opacity: 0.92; }

/* 加载动画 */
.app-state-spinner {
  position: relative;
  width: 56px;
  height: 56px;
  margin-bottom: 16px;
}
.app-state-spinner-ring {
  position: absolute;
  inset: 0;
  border: 3px solid transparent;
  border-top-color: var(--app-primary, #2563eb);
  border-radius: 50%;
  animation: app-state-spin 1.1s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}
.app-state-spinner-ring:nth-child(2) {
  inset: 7px;
  border-top-color: var(--app-primary-300, #93c5fd);
  animation-duration: 1.4s;
  animation-direction: reverse;
}
.app-state-spinner-ring:nth-child(3) {
  inset: 14px;
  border-top-color: var(--app-primary-200, #bfdbfe);
  animation-duration: 1.7s;
}
@keyframes app-state-spin {
  to { transform: rotate(360deg); }
}

.app-state--loading { min-height: 160px; }
</style>
