<template>
  <footer class="formula-status-bar">
    <!-- Left: Stats -->
    <div class="fsb-left">
      <div class="fsb-stat" title="公式总数">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        <span class="fsb-stat-label">公式</span>
        <span class="fsb-stat-value">{{ formulaCount }}</span>
      </div>

      <div class="fsb-sep"></div>

      <div class="fsb-stat" title="计算字段数">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        <span class="fsb-stat-label">计算字段</span>
        <span class="fsb-stat-value">{{ calcFieldCount }}</span>
      </div>

      <div class="fsb-sep"></div>

      <div class="fsb-stat" :class="{ error: errorCount > 0 }" title="公式错误数">
        <svg v-if="errorCount === 0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#52C41A" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        <span class="fsb-stat-label">错误</span>
        <span class="fsb-stat-value" :class="{ error: errorCount > 0 }">{{ errorCount }}</span>
      </div>

      <div class="fsb-sep"></div>

      <div class="fsb-stat" title="依赖关系数">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        <span class="fsb-stat-label">依赖</span>
        <span class="fsb-stat-value">{{ depCount }}</span>
      </div>

      <div class="fsb-sep"></div>

      <div class="fsb-stat" title="上次计算耗时">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span class="fsb-stat-label">计算耗时</span>
        <span class="fsb-stat-value time">{{ calcTime }}</span>
      </div>
    </div>

    <!-- Center: Status Indicators -->
    <div class="fsb-center">
      <!-- Auto-save -->
      <div class="fsb-indicator" :class="autoSaveStatus" title="自动保存状态">
        <svg v-if="autoSaveStatus === 'saved'" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#52C41A" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        <svg v-else-if="autoSaveStatus === 'saving'" width="10" height="10" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="#FAAD14" stroke-width="2" stroke-dasharray="31.4" stroke-dashoffset="10"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/></circle></svg>
        <svg v-else width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#F5222D" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>
        <span>{{ autoSaveText }}</span>
      </div>

      <div class="fsb-sep"></div>

      <!-- Calc mode -->
      <div class="fsb-indicator" :class="{ active: calcMode === 'auto' }" title="计算模式：自动/手动">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        <span>{{ calcModeText }}</span>
      </div>

      <div class="fsb-sep"></div>

      <!-- Connection status -->
      <div class="fsb-indicator connected" title="数据库连接正常">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#52C41A" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
        <span>连接正常</span>
      </div>
    </div>

    <!-- Right: Zoom & Version -->
    <div class="fsb-right">
      <!-- Zoom control -->
      <div class="fsb-zoom">
        <button class="fsb-zoom-btn" @click="zoomOut" title="缩小" :disabled="zoom <= 50">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>

        <div class="fsb-zoom-slider" ref="zoomSliderRef">
          <input
            type="range"
            :min="50"
            :max="200"
            :value="zoom"
            @input="onZoomInput"
            class="fsb-zoom-range"
          />
        </div>

        <button class="fsb-zoom-btn" @click="zoomIn" title="放大" :disabled="zoom >= 200">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
        </button>

        <span class="fsb-zoom-value" @click="resetZoom">{{ zoom }}%</span>
      </div>

      <div class="fsb-sep"></div>

      <!-- Lang / Layout -->
      <div class="fsb-layout">
        <button class="fsb-layout-btn active" title="分栏布局">分栏</button>
        <button class="fsb-layout-btn" title="全屏公式">全屏</button>
      </div>

      <div class="fsb-sep"></div>

      <!-- Version -->
      <span class="fsb-version">v1.2.0</span>
    </div>
  </footer>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  formulaCount: { type: Number, default: 0 },
  calcFieldCount: { type: Number, default: 0 },
  errorCount: { type: Number, default: 0 },
  depCount: { type: Number, default: 0 },
  calcTime: { type: String, default: '0ms' },
  zoom: { type: Number, default: 100 }
})

const emit = defineEmits(['zoom-change'])

const autoSaveStatus = ref('saved')
const calcMode = ref('auto')

const autoSaveText = computed(() => {
  const map = { saved: '已保存', saving: '保存中...', unsaved: '未保存' }
  return map[autoSaveStatus.value] || ''
})

const calcModeText = computed(() => {
  return calcMode.value === 'auto' ? '自动计算' : '手动计算'
})

const zoomSliderRef = ref(null)

function zoomIn() {
  const newZoom = Math.min(200, props.zoom + 10)
  emit('zoom-change', newZoom)
}

function zoomOut() {
  const newZoom = Math.max(50, props.zoom - 10)
  emit('zoom-change', newZoom)
}

function onZoomInput(e) {
  emit('zoom-change', parseInt(e.target.value))
}

function resetZoom() {
  emit('zoom-change', 100)
}

// Simulate auto-save toggle
let saveTimer = null
function simulateSave() {
  autoSaveStatus.value = 'saving'
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    autoSaveStatus.value = 'saved'
  }, 1500)
}
</script>

<style scoped>
.formula-status-bar {
  height: 28px;
  min-height: 28px;
  background: #1E293B;
  color: #CBD5E1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  font-size: 11px;
  flex-shrink: 0;
  user-select: none;
  gap: 8px;
}

/* Sections */
.fsb-left,
.fsb-center,
.fsb-right {
  display: flex;
  align-items: center;
  gap: 4px;
}
.fsb-left { flex: 1; }
.fsb-center { flex: 2; justify-content: center; }
.fsb-right { flex: 1; justify-content: flex-end; }

/* Separator */
.fsb-sep {
  width: 1px;
  height: 14px;
  background: #334155;
  margin: 0 4px;
}

/* Stats */
.fsb-stat {
  display: flex;
  align-items: center;
  gap: 3px;
  cursor: default;
  padding: 0 4px;
  border-radius: 3px;
  transition: background 0.15s;
}
.fsb-stat:hover { background: #334155; }
.fsb-stat.error:hover { background: #3B1C1C; }

.fsb-stat-label {
  color: #94A3B8;
}
.fsb-stat-value {
  color: #E2E8F0;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.fsb-stat-value.error { color: #FCA5A5; }
.fsb-stat-value.time {
  font-family: 'Roboto Mono', monospace;
  font-size: 10px;
  color: #FCD34D;
}

/* Center indicators */
.fsb-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #94A3B8;
  cursor: default;
  padding: 0 4px;
  border-radius: 3px;
  transition: background 0.15s;
}
.fsb-indicator:hover { background: #334155; }
.fsb-indicator.saved, .fsb-indicator.connected { color: #86EFAC; }
.fsb-indicator.saving { color: #FCD34D; }
.fsb-indicator.unsaved { color: #FCA5A5; }
.fsb-indicator.active { color: #93C5FD; }
.fsb-indicator.connected { color: #86EFAC; }

/* Zoom */
.fsb-zoom {
  display: flex;
  align-items: center;
  gap: 3px;
}
.fsb-zoom-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: #94A3B8;
  cursor: pointer;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  padding: 0;
}
.fsb-zoom-btn:hover:not(:disabled) { background: #334155; color: #E2E8F0; }
.fsb-zoom-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.fsb-zoom-slider {
  width: 60px;
  display: flex;
  align-items: center;
}
.fsb-zoom-range {
  width: 100%;
  height: 3px;
  -webkit-appearance: none;
  appearance: none;
  background: #334155;
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}
.fsb-zoom-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 10px;
  height: 10px;
  background: #2563EB;
  border-radius: 50%;
  cursor: pointer;
  border: 1px solid #1D4ED8;
  transition: transform 0.15s;
}
.fsb-zoom-range::-webkit-slider-thumb:hover { transform: scale(1.2); }

.fsb-zoom-value {
  color: #CBD5E1;
  font-weight: 500;
  min-width: 32px;
  text-align: center;
  cursor: pointer;
  font-variant-numeric: tabular-nums;
}
.fsb-zoom-value:hover { color: #fff; }

/* Layout */
.fsb-layout {
  display: flex;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #334155;
}
.fsb-layout-btn {
  height: 20px;
  padding: 0 8px;
  font-size: 10px;
  border: none;
  background: transparent;
  color: #94A3B8;
  cursor: pointer;
  transition: all 0.15s;
  border-right: 1px solid #334155;
}
.fsb-layout-btn:last-child { border-right: none; }
.fsb-layout-btn:hover { background: #334155; color: #E2E8F0; }
.fsb-layout-btn.active { background: #2563EB; color: #fff; }

/* Version */
.fsb-version {
  font-family: 'Roboto Mono', monospace;
  font-size: 10px;
  color: #64748B;
}

/* Animations */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
