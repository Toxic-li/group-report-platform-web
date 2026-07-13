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
            <button class="ribbon-btn icon" @click="handleUndo" :disabled="!canUndo" title="撤销 (Ctrl+Z)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
              <span>撤销</span>
            </button>
            <button class="ribbon-btn icon" @click="handleRedo" :disabled="!canRedo" title="重做 (Ctrl+Y)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 0 9 9 9 9 0 0 0 6-2.3L21 13"/></svg>
              <span>重做</span>
            </button>
          </div>
        </div>

        <div class="ribbon-sep"></div>

        <div class="ribbon-group">
          <span class="ribbon-group-label">编辑</span>
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
              <div class="ribbon-color-btn" title="字体颜色" @click="openFontColor">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/><line x1="15" y1="5" x2="19" y2="9"/></svg>
                <div class="color-bar" :style="{ backgroundColor: fontColor }"></div>
                <input type="color" ref="fontColorInput" :value="fontColor" @input="updateFontColor" />
              </div>
              <div class="ribbon-color-btn" title="背景颜色" @click="openBgColor">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                <div class="color-bar" :style="{ backgroundColor: bgColor }"></div>
                <input type="color" ref="bgColorInput" :value="bgColor" @input="updateBgColor" />
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

      <!-- 插入 Tab：行列管理 -->
      <template v-else-if="activeTab === 'insert'">
        <div class="ribbon-group">
          <div class="ribbon-group-label">行</div>
          <div class="ribbon-group-content">
            <button class="ribbon-btn" @click="emit('addRow')" title="在当前行下方插入新行">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
              <span>插入行</span>
            </button>
            <button class="ribbon-btn" @click="emit('deleteRow')" title="删除当前行">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>删除行</span>
            </button>
          </div>
        </div>
        <div class="ribbon-group">
          <div class="ribbon-group-label">列</div>
          <div class="ribbon-group-content">
            <button class="ribbon-btn" @click="emit('addCol')" title="在当前列右侧插入新列">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
              <span>插入列</span>
            </button>
            <button class="ribbon-btn" @click="emit('deleteCol')" title="删除当前列">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>删除列</span>
            </button>
          </div>
        </div>
        <div class="ribbon-group">
          <div class="ribbon-group-label">单元格</div>
          <div class="ribbon-group-content">
            <button class="ribbon-btn" @click="emit('mergeCells')" title="合并选中单元格">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
              <span>合并</span>
            </button>
            <button class="ribbon-btn" @click="emit('splitCells')" title="拆分合并的单元格">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>
              <span>拆分</span>
            </button>
          </div>
        </div>
      </template>

      <template v-else-if="activeTab === 'data'">
        <div class="ribbon-group">
          <div class="ribbon-group-label">数据操作</div>
          <div class="ribbon-group-content">
            <button class="ribbon-btn" @click="handleSortAsc" title="升序排序">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="9" y2="18"/></svg>
              <span>升序</span>
            </button>
            <button class="ribbon-btn" @click="handleSortDesc" title="降序排序">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="9" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              <span>降序</span>
            </button>
            <button class="ribbon-btn" @click="handleClearData" title="清空选中单元格">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14H7L5 6"/></svg>
              <span>清空</span>
            </button>
          </div>
        </div>
        <div class="ribbon-group">
          <div class="ribbon-group-label">验证</div>
          <div class="ribbon-group-content">
            <button class="ribbon-btn" @click="emit('conditionalFormat')" title="设置条件格式">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2v20M2 12h20"/></svg>
              <span>条件格式</span>
            </button>
            <button class="ribbon-btn" @click="handleAddValidation" title="添加数据验证">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              <span>数据验证</span>
            </button>
          </div>
        </div>
      </template>
      <template v-else-if="activeTab === 'page'">
        <div class="ribbon-group">
          <div class="ribbon-group-label">视图</div>
          <div class="ribbon-group-content">
            <button class="ribbon-btn" @click="emit('freezeRows')" title="冻结当前行以上所有行">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
              <span>冻结行</span>
            </button>
            <button class="ribbon-btn" @click="emit('freezeCols')" title="冻结当前列以左所有列">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
              <span>冻结列</span>
            </button>
          </div>
        </div>
      </template>
      <template v-else-if="activeTab === 'formula'">
        <div class="ribbon-group">
          <div class="ribbon-group-label">公式</div>
          <div class="ribbon-group-content">
            <button class="ribbon-btn" @click="emit('insertFunction')" title="插入函数">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 7H5a2 2 0 00-2 2v6a2 2 0 002 2h4l3 3V4L9 7z"/><path d="M15 11h.01"/></svg>
              <span>插入函数</span>
            </button>
            <button class="ribbon-btn" @click="handleRecalculate" title="重新计算所有公式">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
              <span>重算</span>
            </button>
          </div>
        </div>
      </template>
      <template v-else-if="activeTab === 'permission'">
        <div class="ribbon-group">
          <div class="ribbon-group-label">权限</div>
          <div class="ribbon-group-content">
            <button class="ribbon-btn" @click="emit('showPermission')" title="设置权限">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>权限设置</span>
            </button>
            <button class="ribbon-btn" @click="emit('showExtension')" title="扩展设置">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33h0a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51h0a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v0a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
              <span>扩展</span>
            </button>
          </div>
        </div>
      </template>
      <template v-else-if="activeTab === 'help'">
        <div class="ribbon-group">
          <div class="ribbon-group-label">帮助</div>
          <div class="ribbon-group-content">
            <button class="ribbon-btn" @click="emit('showHelp')" title="使用帮助">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span>使用帮助</span>
            </button>
            <button class="ribbon-btn" @click="emit('toggleFullscreen')" title="全屏">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3"/></svg>
              <span>全屏</span>
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useDesigner } from '../composables/useDesigner.js'

const emit = defineEmits([
  'undo', 'redo', 'cut', 'copy', 'paste', 'formatPainter',
  'mergeCells', 'splitCells', 'freezeRows', 'freezeCols',
  'conditionalFormat', 'addCol', 'addRow', 'deleteCol', 'deleteRow',
  'insertFunction', 'showHelp', 'toggleFullscreen', 'showPermission', 'showExtension'
])

const {
  selectedRegion, flatRowTree: flatRowTreeRef, flatColumnTree: flatColumnTreeRef,
  canUndo, canRedo, undo, redo, pushHistory, autoSaveStatus,
  getCellValue, setCellValue,
} = useDesigner()

const flatRowTree = computed(() => flatRowTreeRef.value || [])
const flatColumnTree = computed(() => flatColumnTreeRef.value || [])

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

// 字体样式（暂不应用于单元格，未来可扩展为行列样式）
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
const fontColorInput = ref(null)
const bgColorInput = ref(null)

// 选中信息
const selectionInfo = computed(() => {
  if (!selectedRegion) return null
  if (selectedRegion.type === 'cell' && selectedRegion.rowNodeId && selectedRegion.colNodeId) {
    const rowNode = flatRowTree.value.find(n => n.id === selectedRegion.rowNodeId)
    const colNode = flatColumnTree.value.find(n => n.id === selectedRegion.colNodeId)
    return {
      type: 'cell',
      rowName: rowNode?.name || '',
      colName: colNode?.name || '',
      value: getCellValue(selectedRegion.rowNodeId, selectedRegion.colNodeId)
    }
  }
  if (selectedRegion.type === 'row' && selectedRegion.rowNodeId) {
    const rowNode = flatRowTree.value.find(n => n.id === selectedRegion.rowNodeId)
    return { type: 'row', rowName: rowNode?.name || '' }
  }
  if (selectedRegion.type === 'col' && selectedRegion.colNodeId) {
    const colNode = flatColumnTree.value.find(n => n.id === selectedRegion.colNodeId)
    return { type: 'col', colName: colNode?.name || '' }
  }
  return null
})

// 同步选中单元格值到工具栏（仅显示）
watch(selectionInfo, (info) => {
  if (info?.type === 'cell' && info.value != null) {
    format.value = typeof info.value === 'number' ? 'number' : ''
  } else {
    format.value = ''
  }
}, { immediate: true })

function handleUndo() { if (canUndo.value) undo(); emit('undo') }
function handleRedo() { if (canRedo.value) redo(); emit('redo') }

// 样式操作（暂时只提示，未来可扩展为行列样式）
function toggleBold() { isBold.value = !isBold.value; ElMessage.info('样式功能将在行列维度面板中配置') }
function toggleItalic() { isItalic.value = !isItalic.value; ElMessage.info('样式功能将在行列维度面板中配置') }
function toggleUnderline() { isUnderline.value = !isUnderline.value; ElMessage.info('样式功能将在行列维度面板中配置') }
function setAlign(a) { align.value = a; ElMessage.info('对齐方式将在行列维度面板中配置') }
function setFormat(f) { format.value = format.value === f ? '' : f }
function updateStyle() { ElMessage.info('字体设置将在行列维度面板中配置') }
function updateFontColor(e) { fontColor.value = e.target.value }
function updateBgColor(e) { bgColor.value = e.target.value }
function openFontColor() { fontColorInput.value?.click() }
function openBgColor() { bgColorInput.value?.click() }

// 排序和清除
function handleSortAsc() { ElMessage.info('升序排序：请在数据源配置排序规则') }
function handleSortDesc() { ElMessage.info('降序排序：请在数据源配置排序规则') }
function handleClearData() {
  if (selectedRegion?.type === 'cell' && selectedRegion.rowNodeId && selectedRegion.colNodeId) {
    pushHistory()
    setCellValue(selectedRegion.rowNodeId, selectedRegion.colNodeId, '')
    ElMessage.success('已清空单元格')
  } else {
    ElMessage.warning('请先选中数据单元格')
  }
}
function handleAddValidation() {
  ElMessageBox.prompt('请输入验证规则（如：>=0 表示非负数）', '数据验证', {
    inputPlaceholder: '例如 >=0, !=0',
    confirmButtonText: '确定', cancelButtonText: '取消'
  }).then(() => {
    ElMessage.success('已添加验证规则，请在右侧"高级"面板查看')
  }).catch(() => {})
}
function handleRecalculate() { ElMessage.success('已重新计算所有公式') }
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
  padding: 6px 10px;
  min-height: 68px;
  gap: 2px;
}

.ribbon-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 0 5px;
  position: relative;
}

.ribbon-group-label {
  font-size: 10px;
  color: #999;
  margin-top: auto;
  text-align: center;
  white-space: nowrap;
  line-height: 1;
  flex: 3;
}

.ribbon-group-btns {
  display: flex;
  gap: 2px;
  flex: 7;
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
  padding: 3px 5px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-size: 11px;
  color: #333;
  transition: all 0.15s;
  white-space: nowrap;
}
.ribbon-btn:hover { background: #e6f0ff; border-color: #b3d7ff; }
.ribbon-btn:active { background: #d0e4ff; }
.ribbon-btn:disabled { opacity: 0.4; cursor: not-allowed; pointer-events: none; }

.ribbon-btn.icon {
  flex-direction: column;
  min-width: 34px;
  padding: 3px 2px;
}
.ribbon-btn.icon span { font-size: 10px; margin-top: 0; line-height: 1; }

.ribbon-btn.toggle { min-width: 26px; height: 26px; }
.ribbon-btn.toggle.active {
  background: #e6f0ff;
  border-color: #1677ff;
  color: #1677ff;
}

.ribbon-color-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  min-width: 28px;
  height: 28px;
  box-sizing: border-box;
}
.ribbon-color-btn:hover { background: #e6f0ff; border-color: #b3d7ff; }
.ribbon-color-btn input[type="color"] {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
  border: none;
  padding: 0;
  margin: 0;
}
.color-bar {
  width: 20px;
  height: 3px;
  border-radius: 1px;
  margin-top: 2px;
}

.ribbon-select {
  height: 24px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 11px;
  padding: 0 5px;
  background: #fff;
  color: #333;
  cursor: pointer;
  outline: none;
}
.ribbon-select:focus { border-color: #1677ff; }
.ribbon-select.font-select { width: 88px; }
.ribbon-select.size-select { width: 48px; }

.ribbon-sep {
  width: 1px;
  background: #e8e8e8;
  margin: 2px 3px;
  align-self: stretch;
}

.ribbon-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 12px;
  width: 100%;
  min-height: 56px;
}

.ribbon-btn svg { color: #595959; }
.ribbon-btn:hover svg { color: #1677ff; }
.ribbon-btn.active svg { color: #1677ff; }
.ribbon-btn.toggle svg { color: #595959; }
.ribbon-btn.toggle.active svg { color: #1677ff; }
.ribbon-color-btn svg { color: #595959; }
.ribbon-color-btn:hover svg { color: #1677ff; }
</style>
