<template>
  <div class="ribbon-toolbar">
    <!-- 菜单标签栏 -->
    <div class="ribbon-tabs">
      <div
        v-for="tab in ribbonTabs"
        :key="tab.key"
        class="ribbon-tab"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </div>
    </div>

    <!-- 工具栏内容区 -->
    <div class="ribbon-content">
      <!-- 开始 Tab -->
      <template v-if="activeTab === 'home'">
        <div class="ribbon-group">
          <span class="ribbon-group-label">剪贴板</span>
          <div class="ribbon-group-btns">
            <button class="ribbon-btn icon" @click="emit('undo')" :disabled="!canUndo" title="撤销 (Ctrl+Z)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
              <span>撤销</span>
            </button>
            <button class="ribbon-btn icon" @click="emit('redo')" :disabled="!canRedo" title="重做 (Ctrl+Y)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 0 9 9 9 9 0 0 0 6-2.3L21 13"/></svg>
              <span>重做</span>
            </button>
          </div>
        </div>

        <div class="ribbon-sep"></div>

        <div class="ribbon-group">
          <span class="ribbon-group-label">剪贴板</span>
          <div class="ribbon-group-btns">
            <button class="ribbon-btn icon" @click="emit('cut')" title="剪切 (Ctrl+X)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
              <span>剪切</span>
            </button>
            <button class="ribbon-btn icon" @click="emit('copy')" title="复制 (Ctrl+C)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              <span>复制</span>
            </button>
            <button class="ribbon-btn icon" @click="emit('paste')" title="粘贴 (Ctrl+V)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
              <span>粘贴</span>
            </button>
            <button class="ribbon-btn icon" @click="emit('formatPainter')" title="格式刷">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              <span>格式刷</span>
            </button>
          </div>
        </div>

        <div class="ribbon-sep"></div>

        <div class="ribbon-group">
          <span class="ribbon-group-label">字体</span>
          <div class="ribbon-group-btns">
            <div class="ribbon-row">
              <select class="ribbon-select font-select" v-model="fontFamily" @change="updateStyle">
                <option>思源黑体</option>
                <option>微软雅黑</option>
                <option>Arial</option>
                <option>宋体</option>
                <option>等线</option>
              </select>
              <select class="ribbon-select size-select" v-model="fontSize" @change="updateStyle">
                <option v-for="s in fontSizes" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
            <div class="ribbon-row">
              <button class="ribbon-btn toggle" :class="{ active: isBold }" @click="toggleBold" title="加粗 (Ctrl+B)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
              </button>
              <button class="ribbon-btn toggle" :class="{ active: isItalic }" @click="toggleItalic" title="斜体 (Ctrl+I)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
              </button>
              <button class="ribbon-btn toggle" :class="{ active: isUnderline }" @click="toggleUnderline" title="下划线 (Ctrl+U)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>
              </button>
              <div class="ribbon-btn color-picker" title="字体颜色">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/><line x1="15" y1="5" x2="19" y2="9"/></svg>
                <div class="color-bar" :style="{ backgroundColor: fontColor }"></div>
              </div>
              <div class="ribbon-btn color-picker" title="背景颜色">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 11l-9-9-9 9"/><line x1="5" y1="11" x2="5" y2="21"/><line x1="19" y1="11" x2="19" y2="21"/><line x1="12" y1="5" x2="12" y2="21"/></svg>
                <div class="color-bar" :style="{ backgroundColor: bgColor }"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="ribbon-sep"></div>

        <div class="ribbon-group">
          <span class="ribbon-group-label">对齐</span>
          <div class="ribbon-group-btns">
            <div class="ribbon-row">
              <button class="ribbon-btn toggle" :class="{ active: align === 'left' }" @click="setAlign('left')" title="左对齐">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
              </button>
              <button class="ribbon-btn toggle" :class="{ active: align === 'center' }" @click="setAlign('center')" title="居中对齐">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
              </button>
              <button class="ribbon-btn toggle" :class="{ active: align === 'right' }" @click="setAlign('right')" title="右对齐">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
              </button>
            </div>
            <div class="ribbon-row">
              <button class="ribbon-btn icon" @click="emit('mergeCells')" title="合并单元格">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
                <span>合并</span>
              </button>
              <button class="ribbon-btn icon" @click="emit('splitCells')" title="拆分单元格">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="7" rx="1"/><rect x="3" y="14" width="18" height="7" rx="1"/><line x1="8" y1="3" x2="8" y2="10"/><line x1="8" y1="14" x2="8" y2="21"/></svg>
                <span>拆分</span>
              </button>
            </div>
          </div>
        </div>

        <div class="ribbon-sep"></div>

        <div class="ribbon-group">
          <span class="ribbon-group-label">格式</span>
          <div class="ribbon-group-btns">
            <div class="ribbon-row">
              <button class="ribbon-btn icon" @click="emit('freezeRows')" title="冻结行">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="1"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
                <span>冻结行</span>
              </button>
              <button class="ribbon-btn icon" @click="emit('freezeCols')" title="冻结列">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="1"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                <span>冻结列</span>
              </button>
            </div>
            <div class="ribbon-row">
              <button class="ribbon-btn toggle" @click="setFormat('percent')" :class="{ active: format === 'percent' }" title="百分比">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
                <span>%</span>
              </button>
              <button class="ribbon-btn toggle" @click="setFormat('currency')" :class="{ active: format === 'currency' }" title="货币格式">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                <span>¥</span>
              </button>
              <button class="ribbon-btn icon" @click="emit('conditionalFormat')" title="条件格式">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1" fill="rgba(22,119,255,0.2)"/><rect x="14" y="3" width="7" height="7" rx="1" fill="rgba(82,196,26,0.2)"/><rect x="14" y="14" width="7" height="7" rx="1" fill="rgba(250,173,20,0.2)"/><rect x="3" y="14" width="7" height="7" rx="1" fill="rgba(245,34,45,0.2)"/></svg>
                <span>条件格式</span>
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- 其他 Tabs 占位 -->
      <template v-else-if="activeTab === 'insert'">
        <div class="ribbon-placeholder">插入功能：图表、图片、形状、数据透视表</div>
      </template>
      <template v-else-if="activeTab === 'data'">
        <div class="ribbon-placeholder">数据功能：排序、筛选、分组、汇总、数据验证</div>
      </template>
      <template v-else-if="activeTab === 'page'">
        <div class="ribbon-placeholder">页面功能：纸张设置、页边距、页眉页脚、打印区域</div>
      </template>
      <template v-else-if="activeTab === 'formula'">
        <div class="ribbon-placeholder">公式功能：函数库、名称管理器、公式审核、计算选项</div>
      </template>
      <template v-else-if="activeTab === 'permission'">
        <div class="ribbon-placeholder">权限功能：单元格权限、数据权限、审批流程</div>
      </template>
      <template v-else-if="activeTab === 'help'">
        <div class="ribbon-placeholder">帮助功能：文档、快捷键、反馈、教程</div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDesigner } from '../composables/useDesigner.js'

const emit = defineEmits([
  'undo', 'redo', 'cut', 'copy', 'paste', 'formatPainter',
  'mergeCells', 'splitCells', 'freezeRows', 'freezeCols',
  'conditionalFormat'
])

const { updateSelectedCellStyle, getCell, selectedCell } = useDesigner()

const activeTab = ref('home')

const ribbonTabs = [
  { key: 'home', label: '开始' },
  { key: 'insert', label: '插入' },
  { key: 'data', label: '数据' },
  { key: 'page', label: '页面' },
  { key: 'formula', label: '公式' },
  { key: 'permission', label: '权限' },
  { key: 'help', label: '帮助' },
]

const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72]

const fontFamily = ref('思源黑体')
const fontSize = ref(12)
const fontColor = ref('#1f1f1f')
const bgColor = ref('#ffffff')
const align = ref('left')
const format = ref('')

const isBold = ref(false)
const isItalic = ref(false)
const isUnderline = ref(false)

const canUndo = ref(true)
const canRedo = ref(true)

function toggleBold() {
  isBold.value = !isBold.value
  updateSelectedCellStyle({ fontWeight: isBold.value ? 'bold' : 'normal' })
}
function toggleItalic() {
  isItalic.value = !isItalic.value
  updateSelectedCellStyle({ fontStyle: isItalic.value ? 'italic' : 'normal' })
}
function toggleUnderline() {
  isUnderline.value = !isUnderline.value
  updateSelectedCellStyle({ textDecoration: isUnderline.value ? 'underline' : 'none' })
}
function setAlign(a) {
  align.value = a
  updateSelectedCellStyle({ textAlign: a })
}
function setFormat(f) {
  format.value = format.value === f ? '' : f
  updateSelectedCellStyle({ format: format.value })
}
function updateStyle() {
  updateSelectedCellStyle({
    fontFamily: fontFamily.value,
    fontSize: fontSize.value + 'px'
  })
}
</script>

<style scoped>
.ribbon-toolbar {
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.ribbon-tabs {
  display: flex;
  border-bottom: 1px solid #e8e8e8;
  padding: 0 12px;
  background: #f5f7fa;
}

.ribbon-tab {
  padding: 6px 16px;
  font-size: 13px;
  color: #595959;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  user-select: none;
}
.ribbon-tab:hover { color: #1677ff; background: #e6f0ff; }
.ribbon-tab.active {
  color: #1677ff;
  border-bottom-color: #1677ff;
  font-weight: 500;
  background: #fff;
}

.ribbon-content {
  display: flex;
  align-items: stretch;
  padding: 8px 12px;
  min-height: 76px;
  gap: 4px;
}

.ribbon-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 0 6px;
  position: relative;
}

.ribbon-group-label {
  font-size: 10px;
  color: #999;
  margin-top: auto;
  text-align: center;
  white-space: nowrap;
}

.ribbon-group-btns {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ribbon-row {
  display: flex;
  gap: 2px;
  align-items: center;
}

.ribbon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 4px 6px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  color: #333;
  transition: all 0.15s;
  white-space: nowrap;
}
.ribbon-btn:hover { background: #e6f0ff; border-color: #b3d7ff; }
.ribbon-btn:active { background: #d0e4ff; }
.ribbon-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.ribbon-btn.icon {
  flex-direction: column;
  min-width: 36px;
  padding: 4px 2px;
}
.ribbon-btn.icon span { font-size: 10px; margin-top: 1px; }

.ribbon-btn.toggle { min-width: 28px; height: 28px; }
.ribbon-btn.toggle.active {
  background: #e6f0ff;
  border-color: #1677ff;
  color: #1677ff;
}

.ribbon-btn.color-picker {
  flex-direction: column;
  padding: 3px 4px;
  position: relative;
}
.color-bar {
  width: 100%;
  height: 3px;
  border-radius: 1px;
  margin-top: 2px;
}

.ribbon-select {
  height: 26px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 12px;
  padding: 0 6px;
  background: #fff;
  color: #333;
  cursor: pointer;
  outline: none;
}
.ribbon-select:focus { border-color: #1677ff; }
.ribbon-select.font-select { width: 90px; }
.ribbon-select.size-select { width: 50px; }

.ribbon-sep {
  width: 1px;
  background: #e8e8e8;
  margin: 2px 4px;
  align-self: stretch;
}

.ribbon-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 13px;
  width: 100%;
  min-height: 60px;
}

.ribbon-btn svg { color: #595959; }
.ribbon-btn:hover svg { color: #1677ff; }
.ribbon-btn.active svg { color: #1677ff; }
</style>
