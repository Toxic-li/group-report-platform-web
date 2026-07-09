<template>
  <header class="app-header">
    <div class="header-left">
      <button class="back-btn" @click="$router.back()" title="返回">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <h1 class="header-title">报表设计器 2.0</h1>
      <span class="header-divider"></span>
      <div class="template-info">
        <span class="template-name">{{ template.name || '未命名报表' }}</span>
        <span class="template-status">
          <span class="auto-save-dot" :class="autoSaveStatus"></span>
          <span class="auto-save-text">{{ autoSaveText }}</span>
        </span>
      </div>
    </div>

    <div class="header-center">
      <el-button class="header-btn" @click="emit('save')" :loading="saving" text>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        保存
      </el-button>
      <el-button class="header-btn" @click="emit('saveAs')" text>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 10 7 10 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        另存为
      </el-button>
      <el-button class="header-btn" @click="emit('preview')" text>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        预览
      </el-button>
      <el-button class="header-btn" @click="emit('publish')" text>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 10v6"/><path d="M18 12l-3-3-3 3-3-3-3 3"/><circle cx="12" cy="12" r="10"/></svg>
        发布
      </el-button>
      <el-button class="header-btn" @click="emit('exportExcel')" text>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        导出Excel
      </el-button>
      <el-button class="header-btn" @click="emit('templateLibrary')" text>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        模板库
      </el-button>
      <el-dropdown class="header-dropdown" @command="handleMoreCommand">
        <el-button class="header-btn" text>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
          更多操作
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="import">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              导入Excel
            </el-dropdown-item>
            <el-dropdown-item command="print">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              打印
            </el-dropdown-item>
            <el-dropdown-item command="share">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              分享
            </el-dropdown-item>
            <el-dropdown-item divided command="settings">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.67 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.67 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.67a1.65 1.65 0 0 0 1.51-1H11a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              报表设置
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <div class="header-right">
      <span class="version-badge">v{{ template.version }}</span>
      <button class="icon-btn" @click="emit('toggleFullscreen')" title="全屏">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
      </button>
      <button class="icon-btn" @click="emit('toggleHelp')" title="帮助">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </button>
      <el-avatar :size="28" class="user-avatar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </el-avatar>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useDesigner } from '../composables/useDesigner.js'

const emit = defineEmits([
  'save', 'saveAs', 'preview', 'publish', 'exportExcel',
  'templateLibrary', 'toggleFullscreen', 'toggleHelp', 'importExcel'
])

const { template, autoSaveStatus } = useDesigner()

const props = defineProps({
  saving: Boolean,
  publishing: Boolean
})

const autoSaveText = computed(() => {
  switch (autoSaveStatus.value) {
    case 'saving': return '保存中...'
    case 'unsaved': return '未保存'
    case 'saved': return '自动保存成功'
    default: return ''
  }
})

function handleMoreCommand(command) {
  if (command === 'import') emit('importExcel')
  // 其他命令可扩展
}
</script>

<style scoped>
.app-header {
  height: 56px;
  min-height: 56px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  position: relative;
  z-index: 100;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: background 0.2s;
}
.back-btn:hover { background: #f5f5f5; color: #1677ff; }

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f1f1f;
  margin: 0;
  white-space: nowrap;
}

.header-divider {
  width: 1px;
  height: 20px;
  background: #e8e8e8;
}

.template-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.template-name {
  font-size: 13px;
  color: #333;
  font-weight: 500;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-status {
  display: flex;
  align-items: center;
  gap: 4px;
}

.auto-save-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}
.auto-save-dot.saving { background: #1677ff; animation: pulse 1s infinite; }
.auto-save-dot.unsaved { background: #faad14; }
.auto-save-dot.saved { background: #52c41a; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.auto-save-text {
  font-size: 12px;
  color: #999;
}

.header-center {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  justify-content: center;
}

.header-btn {
  font-size: 13px;
  color: #595959;
  height: 32px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.header-btn:hover { color: #1677ff; background: #f0f7ff; }

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.version-badge {
  font-size: 11px;
  color: #999;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 4px;
}

.icon-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}
.icon-btn:hover { background: #f5f5f5; color: #1677ff; }

.user-avatar {
  background: #1677ff;
  color: #fff;
  cursor: pointer;
}

:deep(.header-dropdown .el-button) { padding: 0 10px; }
</style>
