<template>
  <footer class="status-bar">
    <div class="status-left">
      <div class="status-report-info">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
        </svg>
        <span class="status-report-name">{{ template.name || '销售分析报表' }}</span>
      </div>
      <span class="status-divider"></span>
      <span class="status-meta">
        <span class="status-meta-label">行</span>{{ rowCount }}
      </span>
      <span class="status-meta">
        <span class="status-meta-label">列</span>{{ colCount }}
      </span>
      <span class="status-divider"></span>
      <span class="status-last-saved" v-if="autoSaveStatus === 'saved'">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        最近保存: {{ lastSavedTime }}
      </span>
      <span class="status-last-saved saving" v-else-if="autoSaveStatus === 'saving'">
        <span class="saving-spinner"></span>
        保存中...
      </span>
    </div>

    <div class="status-center">
      <!-- 工作表标签 -->
      <div class="sheet-tabs">
        <div class="sheet-tab" :class="{ active: bottomTab === 'design' }" @click="bottomTab = 'design'">
          <span>报表设计</span>
        </div>
        <div class="sheet-tab" :class="{ active: bottomTab === 'dataPreview' }" @click="bottomTab = 'dataPreview'">
          <span>数据预览</span>
        </div>
        <div class="sheet-tab" :class="{ active: bottomTab === 'printPreview' }" @click="bottomTab = 'printPreview'">
          <span>打印预览</span>
        </div>
        <button class="sheet-add-btn" title="添加工作表">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>
    </div>

    <div class="status-right">
      <span class="status-version">v{{ template.version || '2.1' }}</span>
      <span class="status-divider"></span>
      <button class="zoom-btn" @click="zoomOut" title="缩小">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
      </button>
      <div class="zoom-slider" @click="handleZoomClick">
        <div class="zoom-slider-track">
          <div class="zoom-slider-fill" :style="{ width: ((currentZoom - 50) / 150 * 100) + '%' }"></div>
        </div>
      </div>
      <button class="zoom-btn" @click="zoomIn" title="放大">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
      </button>
      <span class="zoom-label">{{ currentZoom }}%</span>
      <button class="zoom-btn" @click="zoomFit" title="适应窗口">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
      </button>
    </div>
  </footer>
</template>

<script setup>
import { ref } from 'vue'
import { useDesigner } from '../composables/useDesigner.js'

const { template, rowCount, colCount, bottomTab, autoSaveStatus } = useDesigner()

const currentZoom = ref(100)
const lastZoomTime = ref(Date.now())

// 模拟最近保存时间
const lastSavedTime = ref(formatSaveTime())

function formatSaveTime() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`
}

function zoomIn() {
  currentZoom.value = Math.min(200, currentZoom.value + 10)
  lastZoomTime.value = Date.now()
  lastSavedTime.value = formatSaveTime()
}

function zoomOut() {
  currentZoom.value = Math.max(50, currentZoom.value - 10)
  lastZoomTime.value = Date.now()
}

function handleZoomClick(event) {
  const rect = event.currentTarget.getBoundingClientRect()
  const pct = (event.clientX - rect.left) / rect.width
  currentZoom.value = Math.round(50 + pct * 150)
}

function zoomFit() {
  currentZoom.value = 100
}
</script>

<style scoped>
.status-bar {
  height: 32px; min-height: 32px;
  background: #fafbfc; border-top: 1px solid #e8eaed;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 8px; flex-shrink: 0; font-size: 11px; color: #8c8c8c;
  user-select: none;
}

/* ========== Left ========== */
.status-left {
  display: flex; align-items: center; gap: 8px;
}

.status-report-info {
  display: flex; align-items: center; gap: 5px;
  color: #595959; font-weight: 500;
}
.status-report-name {
  max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.status-meta {
  display: flex; align-items: baseline; gap: 2px;
  font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #8c8c8c;
}
.status-meta-label { font-size: 10px; color: #bfbfbf; margin-right: 1px; }

.status-last-saved {
  display: flex; align-items: center; gap: 4px; color: #52c41a; font-size: 10px;
}
.status-last-saved.saving { color: #1677ff; }

.saving-spinner {
  width: 8px; height: 8px; border: 1.5px solid #1677ff;
  border-top-color: transparent; border-radius: 50%;
  animation: statusSpin 0.6s linear infinite;
}
@keyframes statusSpin { to { transform: rotate(360deg); } }

.status-divider {
  width: 1px; height: 12px; background: #e8eaed;
}

/* ========== Center - Sheet Tabs ========== */
.status-center {
  display: flex; align-items: center; flex: 1; justify-content: center;
}

.sheet-tabs {
  display: flex; align-items: center; gap: 0;
  height: 100%;
}
.sheet-tab {
  padding: 0 12px; height: 32px; display: flex; align-items: center;
  font-size: 11px; color: #8c8c8c; cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.15s; white-space: nowrap;
}
.sheet-tab:hover { color: #595959; background: rgba(0,0,0,0.02); }
.sheet-tab.active { color: #1677ff; border-bottom-color: #1677ff; font-weight: 600; }
.sheet-add-btn {
  width: 24px; height: 24px; border: none; background: transparent;
  border-radius: 4px; cursor: pointer; color: #bfbfbf;
  display: flex; align-items: center; justify-content: center;
  margin-left: 2px;
}
.sheet-add-btn:hover { background: #f0f2f5; color: #595959; }

/* ========== Right ========== */
.status-right {
  display: flex; align-items: center; gap: 6px; flex-shrink: 0;
}

.status-version {
  font-size: 10px; color: #bfbfbf; font-family: 'JetBrains Mono', monospace;
}

.zoom-btn {
  width: 22px; height: 22px; border: none; background: transparent;
  border-radius: 4px; cursor: pointer; color: #bfbfbf;
  display: flex; align-items: center; justify-content: center; padding: 0;
  transition: all 0.15s;
}
.zoom-btn:hover { background: #f0f2f5; color: #595959; }

.zoom-slider {
  width: 56px; height: 6px; background: #e8eaed; border-radius: 3px;
  cursor: pointer; position: relative;
}
.zoom-slider-track { width: 100%; height: 100%; border-radius: 3px; overflow: hidden; }
.zoom-slider-fill {
  height: 100%; background: #1677ff; border-radius: 3px;
  transition: width 0.15s;
}

.zoom-label {
  font-size: 10px; font-family: 'JetBrains Mono', monospace;
  color: #bfbfbf; min-width: 30px; text-align: center;
}
</style>
