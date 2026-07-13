<template>
  <header class="app-header">
    <!-- 左侧：品牌区 -->
    <div class="header-brand">
      <button class="brand-back" @click="$router.back()" title="返回">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <div class="brand-info">
        <div class="brand-row">
          <span class="brand-title">报表设计器</span>
          <span class="brand-divider">·</span>
          <input
            class="brand-report-name"
            v-model="template.name"
            placeholder="未命名报表"
            spellcheck="false"
            @blur="onNameBlur"
            @keydown.enter="$event.target.blur()"
          />
          <span class="brand-status" :class="autoSaveStatus">
            <span class="brand-status-dot"></span>
            <span class="brand-status-text">{{ statusText }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- 中间：操作按钮分组 -->
    <div class="header-actions">
      <!-- 文件组 -->
      <div class="action-group">
        <button class="action-btn" @click="emit('save')" :disabled="saving" title="保存 Ctrl+S">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          <span>保存</span>
        </button>
        <button class="action-btn" @click="emit('saveAs')" title="另存为">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 10 7 10 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
            <line x1="12" y1="10" x2="12" y2="14"/>
            <line x1="10" y1="12" x2="14" y2="12"/>
          </svg>
          <span>另存为</span>
        </button>
        <button class="action-btn" @click="emit('history')" title="版本历史">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>历史</span>
        </button>
        <button class="action-btn" @click="emit('templateLibrary')" title="模板库">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <span>模板</span>
        </button>
      </div>

      <span class="action-divider"></span>

      <!-- 发布组 -->
      <div class="action-group">
        <button class="action-btn action-btn--primary" @click="emit('preview')" title="预览">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <span>预览</span>
        </button>
        <button class="action-btn action-btn--primary" @click="emit('publish')" :disabled="publishing" title="发布">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
          <span>发布</span>
        </button>
        <button class="action-btn" @click="emit('share')" title="分享">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18" cy="5" r="3"/>
            <circle cx="6" cy="12" r="3"/>
            <circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          <span>分享</span>
        </button>
      </div>

      <span class="action-divider"></span>

      <!-- 输出组 -->
      <div class="action-group">
        <button class="action-btn" @click="emit('exportExcel')" title="导出 Excel">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>Excel</span>
        </button>
        <button class="action-btn" @click="emit('exportPDF')" title="导出 PDF">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <span>PDF</span>
        </button>
        <button class="action-btn" @click="emit('print')" title="打印">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          <span>打印</span>
        </button>
      </div>
    </div>

    <!-- 右侧：工具 + 用户 -->
    <div class="header-tools">
      <button class="tool-btn tool-btn--ai" @click="emit('openAI')" title="AI 设计助手">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
        <span>AI 助手</span>
      </button>
      <button class="tool-btn icon-only" @click="emit('toggleFullscreen')" title="全屏 F11">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
      </button>
      <button class="tool-btn icon-only" @click="emit('toggleHelp')" title="帮助 F1">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </button>
      <el-avatar :size="32" class="user-avatar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </el-avatar>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useDesigner } from '../composables/useDesigner.js'

const emit = defineEmits([
  'save', 'saveAs', 'history', 'preview', 'publish', 'share',
  'exportExcel', 'exportPDF', 'print', 'templateLibrary',
  'toggleFullscreen', 'toggleHelp', 'openAI', 'importExcel'
])

const { template, autoSaveStatus } = useDesigner()

const props = defineProps({
  saving: Boolean,
  publishing: Boolean,
})

const statusText = computed(() => {
  switch (autoSaveStatus.value) {
    case 'saving': return '保存中...'
    case 'unsaved': return '未保存'
    case 'saved': return '已保存'
    default: return '已保存'
  }
})

function onNameBlur() {
  const name = (template.value?.name || '').trim() || '未命名报表'
  if (template.value) template.value.name = name
}
</script>

<style scoped>
.app-header {
  height: 56px;
  min-height: 56px;
  background: #fff;
  border-bottom: 1px solid var(--app-border, #e8eaed);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px 0 8px;
  position: relative;
  z-index: 100;
  flex-shrink: 0;
  gap: 16px;
}

/* ========== 品牌区 ========== */
.header-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.brand-back {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  transition: all 0.2s;
  flex-shrink: 0;
}
.brand-back:hover {
  background: #f0f2f5;
  color: #1677ff;
}

.brand-info {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.brand-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.brand-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f1f1f;
  white-space: nowrap;
}

.brand-divider {
  color: #d9d9d9;
  font-size: 14px;
  user-select: none;
}

.brand-report-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 2px 6px;
  max-width: 200px;
  outline: none;
  font-family: inherit;
  transition: all 0.15s;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}
.brand-report-name:hover {
  background: #f5f7fa;
  border-color: #e8eaed;
}
.brand-report-name:focus {
  background: #fff;
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1);
}
.brand-report-name::placeholder {
  color: #bfbfbf;
  font-weight: 400;
}

.brand-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
}

.brand-status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}
.brand-status.saved .brand-status-dot { background: #52c41a; }
.brand-status.saving .brand-status-dot { background: #1677ff; animation: statusPulse 1.2s infinite; }
.brand-status.unsaved .brand-status-dot { background: #faad14; }

.brand-status.saved .brand-status-text { color: #52c41a; }
.brand-status.saving .brand-status-text { color: #1677ff; }
.brand-status.unsaved .brand-status-text { color: #faad14; }

@keyframes statusPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* ========== 操作按钮区 ========== */
.header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  justify-content: center;
}

.action-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.action-divider {
  width: 1px;
  height: 20px;
  background: #e8eaed;
  margin: 0 4px;
}

.action-btn {
  height: 30px;
  padding: 0 10px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #595959;
  font-weight: 500;
  font-family: inherit;
  white-space: nowrap;
  transition: all 0.15s;
}
.action-btn:hover {
  background: #f0f2f5;
  color: #1f1f1f;
}
.action-btn:active {
  background: #e4e6eb;
}

.action-btn--primary {
  color: #1677ff;
}
.action-btn--primary:hover {
  background: #e6f0ff;
  color: #1677ff;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ========== 右侧工具区 ========== */
.header-tools {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.tool-btn {
  height: 30px;
  padding: 0 10px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #666;
  font-weight: 500;
  font-family: inherit;
  transition: all 0.15s;
}
.tool-btn:hover {
  background: #f0f2f5;
  color: #1f1f1f;
}
.tool-btn.icon-only {
  width: 30px;
  padding: 0;
  justify-content: center;
}

.tool-btn--ai {
  color: #722ed1;
  background: linear-gradient(135deg, rgba(114,46,209,0.06), rgba(22,119,255,0.06));
  border: 1px solid rgba(114,46,209,0.12);
  gap: 4px;
  padding: 0 12px;
}
.tool-btn--ai:hover {
  background: linear-gradient(135deg, rgba(114,46,209,0.12), rgba(22,119,255,0.12));
  color: #531dab;
  border-color: rgba(114,46,209,0.25);
}

.user-avatar {
  background: linear-gradient(135deg, #1677ff, #69b1ff);
  color: #fff;
  cursor: pointer;
  margin-left: 4px;
  transition: box-shadow 0.2s;
}
.user-avatar:hover {
  box-shadow: 0 2px 8px rgba(22,119,255,0.35);
}
</style>
