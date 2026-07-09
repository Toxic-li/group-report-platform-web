<template>
  <footer class="status-bar">
    <div class="status-left">
      <div class="status-tabs">
        <div
          class="status-tab"
          :class="{ active: bottomTab === 'design' }"
          @click="bottomTab = 'design'"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          报表设计
        </div>
        <div
          class="status-tab"
          :class="{ active: bottomTab === 'dataPreview' }"
          @click="bottomTab = 'dataPreview'"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          数据预览
        </div>
        <div
          class="status-tab"
          :class="{ active: bottomTab === 'printPreview' }"
          @click="bottomTab = 'printPreview'"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          打印预览
        </div>
      </div>
      <button class="add-tab-btn" title="添加工作表">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
    </div>

    <div class="status-center">
      <span class="status-info">模板编码: {{ template.code || 'RPT_20250708_001' }}</span>
      <span class="status-divider"></span>
      <span class="status-info">行数: {{ rowCount }}</span>
      <span class="status-divider"></span>
      <span class="status-info">列数: {{ colCount }}</span>
    </div>

    <div class="status-right">
      <span class="zoom-label">100%</span>
      <button class="zoom-btn" title="缩小">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
      </button>
      <div class="zoom-slider-track">
        <div class="zoom-slider-fill"></div>
      </div>
      <button class="zoom-btn" title="放大">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
      </button>
      <button class="zoom-btn" title="适应窗口">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
      </button>
    </div>
  </footer>
</template>

<script setup>
import { useDesigner } from '../composables/useDesigner.js'

const { template, rowCount, colCount, bottomTab } = useDesigner()
</script>

<style scoped>
.status-bar {
  height: 36px;
  min-height: 36px;
  background: #f5f7fa;
  border-top: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  flex-shrink: 0;
  font-size: 12px;
  color: #666;
}

.status-left {
  display: flex;
  align-items: center;
  gap: 2px;
}

.status-tabs {
  display: flex;
  gap: 2px;
}

.status-tab {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
  height: 28px;
  border-radius: 4px 4px 0 0;
  cursor: pointer;
  font-size: 12px;
  color: #666;
  transition: all 0.2s;
  user-select: none;
  border-bottom: 2px solid transparent;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-bottom: none;
  position: relative;
  top: 1px;
}
.status-tab:hover { color: #1677ff; background: #f0f7ff; }
.status-tab.active {
  color: #1677ff;
  background: #fff;
  border-color: #e0e0e0;
  border-bottom: 2px solid #1677ff;
  font-weight: 500;
}

.add-tab-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  margin-left: 4px;
}
.add-tab-btn:hover { background: #e0e0e0; color: #666; }

.status-center {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-info {
  font-size: 11px;
  color: #999;
  font-family: 'Roboto Mono', monospace;
}

.status-divider {
  width: 1px;
  height: 12px;
  background: #e0e0e0;
}

.status-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.zoom-label {
  font-size: 11px;
  font-family: 'Roboto Mono', monospace;
  color: #999;
  min-width: 32px;
  text-align: right;
}

.zoom-btn {
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  padding: 0;
  transition: all 0.15s;
}
.zoom-btn:hover { background: #e0e0e0; color: #666; }

.zoom-slider-track {
  width: 60px;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  position: relative;
  cursor: pointer;
}
.zoom-slider-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 50%;
  background: #1677ff;
  border-radius: 2px;
}
</style>
