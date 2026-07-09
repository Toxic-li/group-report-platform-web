<template>
  <aside class="property-panel" :class="{ collapsed: isCollapsed }">
    <div class="panel-header">
      <div class="panel-tabs">
        <div
          class="panel-tab"
          :class="{ active: activeTab === 'property' }"
          @click="activeTab = 'property'"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          属性
        </div>
        <div
          class="panel-tab"
          :class="{ active: activeTab === 'data' }"
          @click="activeTab = 'data'"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
          数据
        </div>
      </div>
      <button class="collapse-btn" @click="isCollapsed = !isCollapsed" title="收起/展开">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path :d="isCollapsed ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'"/>
        </svg>
      </button>
    </div>

    <div class="panel-body" v-show="!isCollapsed">
      <!-- 属性 Tab -->
      <template v-if="activeTab === 'property'">
        <div class="prop-section">
          <div class="prop-section-title">单元格属性</div>
          <div class="prop-field">
            <label>单元格位置</label>
            <div class="prop-value mono">{{ cellRef }}</div>
          </div>
          <div class="prop-field">
            <label>单元格类型</label>
            <select class="prop-select" v-model="cellType" @change="updateCellType">
              <option value="text">文本单元格</option>
              <option value="data">数据单元格</option>
              <option value="formula">公式单元格</option>
            </select>
          </div>
        </div>

        <div class="prop-section">
          <div class="prop-section-title">绑定字段</div>
          <div class="prop-field">
            <div class="bind-field" v-if="boundField">
              <span class="bind-badge">{{ boundField }}</span>
              <button class="bind-clear" @click="clearBoundField">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div class="bind-empty" v-else>未绑定字段</div>
          </div>
        </div>

        <div class="prop-section">
          <div class="prop-section-title">数据格式</div>
          <div class="prop-field">
            <select class="prop-select" v-model="dataFormat" @change="updateFormat">
              <option value="normal">常规</option>
              <option value="number">金额</option>
              <option value="percent">百分比</option>
              <option value="date">日期</option>
            </select>
          </div>
          <div class="prop-field checkbox">
            <label class="checkbox-label">
              <input type="checkbox" v-model="autoWrap" @change="updateStyle" />
              <span>自动换行</span>
            </label>
          </div>
        </div>

        <div class="prop-section">
          <div class="prop-section-title">字体</div>
          <div class="prop-row">
            <div class="prop-field half">
              <select class="prop-select" v-model="fontFamily" @change="updateStyle">
                <option>思源黑体</option>
                <option>微软雅黑</option>
                <option>Arial</option>
                <option>宋体</option>
              </select>
            </div>
            <div class="prop-field half">
              <select class="prop-select" v-model="fontSize" @change="updateStyle">
                <option v-for="s in [8,9,10,11,12,14,16,18,20,22,24]" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
          </div>
          <div class="prop-row">
            <button class="prop-toggle" :class="{ active: isBold }" @click="toggleBold" title="加粗">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
            </button>
            <button class="prop-toggle" :class="{ active: isItalic }" @click="toggleItalic" title="斜体">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
            </button>
            <button class="prop-toggle" :class="{ active: isUnderline }" @click="toggleUnderline" title="下划线">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>
            </button>
            <div class="prop-color-btn" title="字体颜色">
              <input type="color" v-model="fontColor" @change="updateStyle" />
              <div class="color-preview" :style="{ backgroundColor: fontColor }"></div>
            </div>
          </div>
        </div>

        <div class="prop-section">
          <div class="prop-section-title">对齐方式</div>
          <div class="prop-align-row">
            <button class="prop-align-btn" :class="{ active: align === 'left' }" @click="setAlign('left')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
            </button>
            <button class="prop-align-btn" :class="{ active: align === 'center' }" @click="setAlign('center')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
            </button>
            <button class="prop-align-btn" :class="{ active: align === 'right' }" @click="setAlign('right')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
            </button>
            <button class="prop-align-btn" :class="{ active: align === 'justify' }" @click="setAlign('justify')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div class="prop-section">
          <div class="prop-section-title">边框</div>
          <div class="prop-border-grid">
            <button class="prop-border-btn" :class="{ active: borders.top }" @click="toggleBorder('top')" title="上边框">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="4" x2="20" y2="4"/></svg>
            </button>
            <button class="prop-border-btn" :class="{ active: borders.bottom }" @click="toggleBorder('bottom')" title="下边框">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="20" x2="20" y2="20"/></svg>
            </button>
            <button class="prop-border-btn" :class="{ active: borders.left }" @click="toggleBorder('left')" title="左边框">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="4" x2="4" y2="20"/></svg>
            </button>
            <button class="prop-border-btn" :class="{ active: borders.right }" @click="toggleBorder('right')" title="右边框">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="20" y1="4" x2="20" y2="20"/></svg>
            </button>
            <button class="prop-border-btn" :class="{ active: borders.all }" @click="toggleBorder('all')" title="全部边框">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="1"/></svg>
            </button>
            <button class="prop-border-btn" :class="{ active: borders.none }" @click="toggleBorder('none')" title="无边框">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="1" stroke-dasharray="2 2"/></svg>
            </button>
          </div>
        </div>

        <div class="prop-section">
          <div class="prop-section-title">背景</div>
          <div class="prop-field">
            <div class="prop-color-picker">
              <input type="color" v-model="bgColor" @change="updateStyle" />
              <div class="color-swatch" :style="{ backgroundColor: bgColor }"></div>
              <span class="color-hex">{{ bgColor }}</span>
            </div>
          </div>
        </div>

        <div class="prop-section advanced">
          <div class="prop-section-title">高级</div>
          <div class="prop-advanced-item" @click="emit('openConditionalFormat')">
            <span>条件格式</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          <div class="prop-advanced-item" @click="emit('openPermission')">
            <span>权限控制</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          <div class="prop-advanced-item" @click="emit('openExtension')">
            <span>扩展设置</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      </template>

      <!-- 数据 Tab -->
      <template v-if="activeTab === 'data'">
        <div class="prop-section">
          <div class="prop-section-title">数据绑定</div>
          <div class="prop-field">
            <label>数据源</label>
            <select class="prop-select">
              <option>销售管理数据库</option>
            </select>
          </div>
          <div class="prop-field">
            <label>数据表</label>
            <select class="prop-select">
              <option>销售明细</option>
              <option>销售汇总</option>
            </select>
          </div>
          <div class="prop-field">
            <label>绑定字段</label>
            <select class="prop-select">
              <option>销售金额</option>
              <option>销售数量</option>
              <option>成本金额</option>
            </select>
          </div>
        </div>
      </template>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useDesigner } from '../composables/useDesigner.js'

const emit = defineEmits(['openConditionalFormat', 'openPermission', 'openExtension'])

const { selectedCell, getCell, updateSelectedCellStyle, getColLetter } = useDesigner()

const isCollapsed = ref(false)
const activeTab = ref('property')

const cellType = ref('text')
const dataFormat = ref('normal')
const autoWrap = ref(false)
const fontFamily = ref('思源黑体')
const fontSize = ref(12)
const fontColor = ref('#1f1f1f')
const bgColor = ref('#ffffff')
const isBold = ref(false)
const isItalic = ref(false)
const isUnderline = ref(false)
const align = ref('left')
const boundField = ref(null)

const borders = ref({ top: false, bottom: false, left: false, right: false, all: false, none: false })

const cellRef = computed(() => {
  const r = selectedCell.row
  const c = selectedCell.col
  if (r === null || c === null) return ''
  return getColLetter(c) + (r + 1)
})

// 监听选中单元格变化，同步属性面板
watch(() => [selectedCell.row, selectedCell.col], () => {
  syncFromCell()
}, { immediate: true })

function syncFromCell() {
  const cell = getCell(selectedCell.row, selectedCell.col)
  if (!cell) return
  const style = cell.style || {}
  cellType.value = cell.type || 'text'
  dataFormat.value = cell.format || 'normal'
  fontFamily.value = style.fontFamily || '思源黑体'
  fontSize.value = parseInt(style.fontSize) || 12
  fontColor.value = style.color || '#1f1f1f'
  bgColor.value = style.backgroundColor || '#ffffff'
  isBold.value = style.fontWeight === 'bold'
  isItalic.value = style.fontStyle === 'italic'
  isUnderline.value = style.textDecoration === 'underline'
  align.value = style.textAlign || 'left'
  boundField.value = cell.boundField || null
}

function updateCellType() {
  updateSelectedCellStyle({})
}
function updateFormat() {
  updateSelectedCellStyle({})
}
function updateStyle() {
  updateSelectedCellStyle({
    fontFamily: fontFamily.value,
    fontSize: fontSize.value + 'px',
    color: fontColor.value,
    backgroundColor: bgColor.value,
    fontWeight: isBold.value ? 'bold' : 'normal',
    fontStyle: isItalic.value ? 'italic' : 'normal',
    textDecoration: isUnderline.value ? 'underline' : 'none',
    textAlign: align.value
  })
}
function toggleBold() { isBold.value = !isBold.value; updateStyle() }
function toggleItalic() { isItalic.value = !isItalic.value; updateStyle() }
function toggleUnderline() { isUnderline.value = !isUnderline.value; updateStyle() }
function setAlign(a) { align.value = a; updateStyle() }
function toggleBorder(side) {
  if (side === 'all') {
    borders.value = { top: true, bottom: true, left: true, right: true, all: true, none: false }
  } else if (side === 'none') {
    borders.value = { top: false, bottom: false, left: false, right: false, all: false, none: true }
  } else {
    borders.value[side] = !borders.value[side]
    borders.value.all = borders.value.top && borders.value.bottom && borders.value.left && borders.value.right
    borders.value.none = false
  }
}
function clearBoundField() {
  boundField.value = null
}
</script>

<style scoped>
.property-panel {
  width: 320px;
  min-width: 320px;
  background: #fff;
  border-left: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  transition: width 0.3s;
  flex-shrink: 0;
  overflow: hidden;
}
.property-panel.collapsed {
  width: 40px;
  min-width: 40px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e8e8e8;
  padding: 0 8px;
  height: 40px;
  flex-shrink: 0;
}

.panel-tabs {
  display: flex;
  gap: 2px;
  flex: 1;
}

.panel-tab {
  padding: 0 12px;
  height: 32px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  user-select: none;
}
.panel-tab:hover { background: #f5f5f5; }
.panel-tab.active {
  background: #e6f0ff;
  color: #1677ff;
  font-weight: 500;
}

.collapse-btn {
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
}
.collapse-btn:hover { background: #f5f5f5; color: #666; }

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.prop-section { margin-bottom: 12px; padding: 0 12px; }
.prop-section-title {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.prop-field {
  margin-bottom: 8px;
}
.prop-field label {
  display: block;
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}
.prop-field .prop-value {
  font-size: 13px;
  color: #333;
  padding: 4px 0;
}
.prop-value.mono { font-family: 'Roboto Mono', monospace; }

.prop-select {
  width: 100%;
  height: 28px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 12px;
  padding: 0 6px;
  background: #fff;
  color: #333;
  outline: none;
}
.prop-select:focus { border-color: #1677ff; }

.prop-row {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 6px;
}
.prop-field.half { flex: 1; margin-bottom: 0; }

.prop-toggle {
  width: 28px;
  height: 28px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.15s;
}
.prop-toggle:hover { border-color: #1677ff; color: #1677ff; }
.prop-toggle.active {
  background: #e6f0ff;
  border-color: #1677ff;
  color: #1677ff;
}

.prop-color-btn {
  position: relative;
  width: 28px;
  height: 28px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
}
.prop-color-btn input[type="color"] {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
  border: none;
  padding: 0;
}
.color-preview {
  position: absolute;
  bottom: 2px;
  left: 4px;
  right: 4px;
  height: 3px;
  border-radius: 1px;
}

.prop-align-row {
  display: flex;
  gap: 2px;
}
.prop-align-btn {
  flex: 1;
  height: 28px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.15s;
}
.prop-align-btn:hover { border-color: #1677ff; color: #1677ff; }
.prop-align-btn.active {
  background: #e6f0ff;
  border-color: #1677ff;
  color: #1677ff;
}

.prop-border-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2px;
}
.prop-border-btn {
  height: 32px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.15s;
}
.prop-border-btn:hover { border-color: #1677ff; color: #1677ff; }
.prop-border-btn.active {
  background: #e6f0ff;
  border-color: #1677ff;
  color: #1677ff;
}

.prop-color-picker {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  height: 28px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 0 6px;
  cursor: pointer;
}
.prop-color-picker input[type="color"] {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
  border: none;
  padding: 0;
}
.color-swatch {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 1px solid #e8e8e8;
  flex-shrink: 0;
}
.color-hex {
  font-size: 12px;
  color: #999;
  font-family: 'Roboto Mono', monospace;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
}
.checkbox-label input { margin: 0; cursor: pointer; }

.bind-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background: #f0f7ff;
  border-radius: 4px;
  border: 1px solid #d6e8ff;
}
.bind-badge {
  font-size: 12px;
  color: #1677ff;
}
.bind-clear {
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.bind-clear:hover { color: #f5222d; }

.bind-empty {
  font-size: 12px;
  color: #bfbfbf;
  padding: 4px 0;
}

.prop-advanced-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: color 0.15s;
}
.prop-advanced-item:hover { color: #1677ff; }
.prop-advanced-item svg { color: #999; transition: color 0.15s; }
.prop-advanced-item:hover svg { color: #1677ff; }

.property-panel.collapsed .panel-body,
.property-panel.collapsed .panel-tabs { display: none; }
.property-panel.collapsed .panel-header { justify-content: center; }
</style>
