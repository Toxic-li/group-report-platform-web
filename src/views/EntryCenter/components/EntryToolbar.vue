<template>
  <div class="de-toolbar">
    <div class="de-toolbar-left">
      <button
        v-for="item in panelTabs"
        :key="item.key"
        :class="['de-tb-btn', { active: activePanel === item.key }]"
        @click="$emit('update:activePanel', item.key)"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" v-html="icons[item.key]"></svg>
        <span>{{ item.label }}</span>
      </button>
    </div>
    <div class="de-toolbar-center">
      <button class="de-tb-btn" @click="$emit('save')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        保存
      </button>
      <button class="de-tb-btn" @click="$emit('validate')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        校验
      </button>
      <button class="de-tb-btn" @click="$emit('refresh')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
        刷新
      </button>
      <div class="de-tb-divider"></div>
      <button class="de-tb-btn" @click="$emit('import')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        导入
      </button>
      <button class="de-tb-btn" @click="$emit('export')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        导出
      </button>
    </div>
    <div class="de-toolbar-right">
      <span v-if="isSaving" class="de-save-status de-save--saving">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="16 12 12 8 8 12"/><line x1="12" y1="16" x2="12" y2="8"/></svg>
        保存中...
      </span>
      <span v-else :class="['de-save-status', { 'de-save--saved': isSaved }]">
        <svg v-if="isSaved" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {{ isSaved ? '已保存' : '未保存' }}
      </span>
      <span class="de-auto-save" v-if="lastSaved">上次保存: {{ lastSaved }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  activePanel: { type: String, default: 'spreadsheet' },
  isSaved: { type: Boolean, default: true },
  isSaving: { type: Boolean, default: false },
  lastSaved: { type: String, default: '' },
})

defineEmits(['update:activePanel', 'save', 'validate', 'refresh', 'import', 'export'])

const panelTabs = [
  { key: 'spreadsheet', label: '表格' },
  { key: 'validation', label: '校验' },
  { key: 'attachment', label: '附件' },
]

const icons = {
  spreadsheet: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  validation: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12l2 2 4-4"/>',
  attachment: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
}
</script>

<style scoped>
.de-toolbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0 var(--app-space-6); height: 56px;
  background: var(--app-surface); border-bottom: 1px solid var(--app-border);
  flex-shrink: 0;
}
.de-toolbar-left, .de-toolbar-center { display: flex; gap: 4px; align-items: center; }
.de-toolbar-right { display: flex; align-items: center; gap: var(--app-space-3); }

.de-tb-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border: none; background: transparent;
  border-radius: var(--app-radius-sm); cursor: pointer;
  font-size: 13px; color: var(--app-text-secondary); font-family: inherit;
  transition: all var(--app-transition-fast);
}
.de-tb-btn:hover { background: var(--app-surface-hover); color: var(--app-text-primary); }
.de-tb-btn.active { background: var(--app-primary-bg); color: var(--app-primary); }

.de-tb-divider { width: 1px; height: 20px; background: var(--app-divider); margin: 0 4px; }

.de-save-status {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; font-weight: 500; padding: 3px 10px; border-radius: var(--app-radius-xl);
  background: var(--app-warning-bg); color: var(--app-warning);
}
.de-save--saved { background: var(--app-success-bg); color: var(--app-success); }
.de-save--saving { background: var(--app-info-bg); color: var(--app-info); }
.de-auto-save { font-size: 12px; color: var(--app-text-muted); }
</style>
