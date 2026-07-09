<template>
  <div class="excel-designer">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">Excel设计器</h1>
        <p class="page-desc">使用Excel方式设计报表模板</p>
      </div>
      <div class="header-right">
        <el-button text @click="handleImport">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          导入Excel
        </el-button>
        <el-button text @click="handleExport">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          导出模板
        </el-button>
        <el-button type="primary" @click="handleSave">保存模板</el-button>
      </div>
    </div>

    <div class="designer-container">
      <div class="designer-toolbar">
        <div class="toolbar-group">
          <button class="toolbar-btn" title="撤销">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
          </button>
          <button class="toolbar-btn" title="重做">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
          </button>
          <div class="toolbar-divider"></div>
          <button class="toolbar-btn" title="剪切">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 17H7a2 2 0 01-2-2V5a2 2 0 012-2h5"/><path d="M16 8L21 3M16 3l5 5"/></svg>
          </button>
          <button class="toolbar-btn" title="复制">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          </button>
          <button class="toolbar-btn" title="粘贴">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="12" y="12" width="10" height="10" rx="2" ry="2"/><path d="M16 8V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v4"/><path d="M20 16H4a2 2 0 01-2-2v-4a2 2 0 012-2h2"/></svg>
          </button>
          <button class="toolbar-btn" title="删除">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </button>
        </div>

        <div class="toolbar-group">
          <div class="toolbar-divider"></div>
          <select class="toolbar-select" v-model="selectedFont">
            <option value="Arial">Arial</option>
            <option value="Microsoft YaHei">微软雅黑</option>
            <option value="SimSun">宋体</option>
            <option value="KaiTi">楷体</option>
          </select>
          <select class="toolbar-select" v-model="fontSize">
            <option v-for="size in [10, 12, 14, 16, 18, 20]" :key="size" :value="size">{{ size }}pt</option>
          </select>
        </div>

        <div class="toolbar-group">
          <div class="toolbar-divider"></div>
          <button class="toolbar-btn" title="加粗">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 4h8a4 4 0 014 4v12"/><path d="M6 12h8"/></svg>
          </button>
          <button class="toolbar-btn" title="斜体">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4v16M4 4v16c5.5-4 11-4 11 0"/></svg>
          </button>
          <button class="toolbar-btn" title="下划线">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 8l4 4M7 8l-4 4M5 16h14"/></svg>
          </button>
        </div>

        <div class="toolbar-group">
          <div class="toolbar-divider"></div>
          <button class="toolbar-btn" title="左对齐">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="15" y1="3" x2="15" y2="21"/><polyline points="5 9 15 9 15 15"/></svg>
          </button>
          <button class="toolbar-btn" title="居中">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="3" x2="12" y2="21"/><polyline points="5 9 19 9 19 15"/></svg>
          </button>
          <button class="toolbar-btn" title="右对齐">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="9" y1="3" x2="9" y2="21"/><polyline points="5 9 9 9 9 15"/></svg>
          </button>
          <button class="toolbar-btn" title="合并单元格">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><line x1="10" y1="3" x2="14" y2="3"/><line x1="10" y1="10" x2="14" y2="10"/><line x1="10" y1="14" x2="14" y2="14"/><line x1="10" y1="21" x2="14" y2="21"/></svg>
          </button>
        </div>

        <div class="toolbar-group">
          <div class="toolbar-divider"></div>
          <button class="toolbar-btn" title="插入行">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <button class="toolbar-btn" title="插入列">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><line x1="12" y1="5" x2="12" y2="19"/></svg>
          </button>
          <button class="toolbar-btn" title="删除行">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><line x1="5" y1="9" x2="19" y2="9"/></svg>
          </button>
          <button class="toolbar-btn" title="删除列">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><line x1="9" y1="5" x2="9" y2="19"/></svg>
          </button>
        </div>

        <div class="toolbar-group">
          <div class="toolbar-divider"></div>
          <button class="toolbar-btn" title="条件格式">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="10" width="18" height="11" rx="2"/><path d="M7 10V7a5 5 0 0110 0v3"/></svg>
          </button>
          <button class="toolbar-btn" title="数据验证">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </button>
          <button class="toolbar-btn" title="公式">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
          </button>
        </div>
      </div>

      <div class="designer-main">
        <div class="spreadsheet-wrapper">
          <div class="spreadsheet-header">
            <div class="col-headers">
              <div class="corner-cell"></div>
              <div v-for="col in cols" :key="col" class="col-header">{{ col }}</div>
            </div>
            <div class="row-headers">
              <div v-for="row in rows" :key="row" class="row-header">{{ row }}</div>
            </div>
            <div class="cells-area">
              <div v-for="row in rows" :key="row" class="row">
                <div
                  v-for="col in cols"
                  :key="col"
                  class="cell"
                  :class="{ selected: selectedCell.row === row && selectedCell.col === col }"
                  @click="selectCell(row, col)"
                  @dblclick="editCell(row, col)"
                >
                  {{ getCellContent(row, col) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="designer-sidebar">
          <div class="sidebar-section">
            <h3 class="sidebar-title">属性面板</h3>
            <div class="property-item">
              <label class="property-label">单元格地址</label>
              <input class="property-input" :value="`${selectedCell.col}${selectedCell.row}`" readonly />
            </div>
            <div class="property-item">
              <label class="property-label">单元格值</label>
              <input class="property-input" v-model="cellValue" />
            </div>
            <div class="property-item">
              <label class="property-label">数据类型</label>
              <select class="property-input">
                <option value="text">文本</option>
                <option value="number">数字</option>
                <option value="date">日期</option>
                <option value="formula">公式</option>
              </select>
            </div>
            <div class="property-item">
              <label class="property-label">对齐方式</label>
              <div class="align-buttons">
                <button class="align-btn">左</button>
                <button class="align-btn active">中</button>
                <button class="align-btn">右</button>
              </div>
            </div>
          </div>

          <div class="sidebar-section">
            <h3 class="sidebar-title">字段列表</h3>
            <div class="field-list">
              <div v-for="field in fields" :key="field.name" class="field-item" @click="insertField(field)">
                <span class="field-icon">{{ field.type === 'string' ? '📝' : field.type === 'number' ? '🔢' : '📅' }}</span>
                <span class="field-name">{{ field.name }}</span>
                <span class="field-type">{{ field.type }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const selectedFont = ref('Microsoft YaHei')
const fontSize = ref(12)
const selectedCell = reactive({ row: 1, col: 'A' })
const cellValue = ref('')

const rows = Array.from({ length: 20 }, (_, i) => i + 1)
const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

const cellData = reactive({})

const fields = ref([
  { name: '部门名称', type: 'string' },
  { name: '员工姓名', type: 'string' },
  { name: '职位', type: 'string' },
  { name: '入职日期', type: 'date' },
  { name: '薪资', type: 'number' },
  { name: '绩效评分', type: 'number' },
  { name: '考勤天数', type: 'number' },
  { name: '备注', type: 'string' }
])

function getCellContent(row, col) {
  const key = `${col}${row}`
  return cellData[key] || ''
}

function selectCell(row, col) {
  selectedCell.row = row
  selectedCell.col = col
  const key = `${col}${row}`
  cellValue.value = cellData[key] || ''
}

function editCell(row, col) {
  selectCell(row, col)
}

function insertField(field) {
  const key = `${selectedCell.col}${selectedCell.row}`
  cellData[key] = `{{${field.name}}}`
  cellValue.value = cellData[key]
}

function handleImport() {
  alert('导入Excel功能开发中')
}

function handleExport() {
  alert('导出模板功能开发中')
}

function handleSave() {
  alert('保存模板功能开发中')
}
</script>

<style scoped>
.excel-designer {
  padding: 24px;
  min-height: calc(100vh - 100px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  .page-title {
    font-size: 20px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
  }
  .page-desc {
    font-size: 14px;
    color: #666;
    margin: 4px 0 0;
  }
}

.designer-container {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.designer-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: #d9d9d9;
  margin: 0 8px;
}

.toolbar-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;

  &:hover {
    background: #e8e8e8;
    color: #333;
  }

  &:active {
    background: #d9d9d9;
  }
}

.toolbar-select {
  height: 28px;
  padding: 0 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;

  &:hover {
    border-color: #1890ff;
  }
}

.designer-main {
  display: flex;
  height: calc(100vh - 220px);
}

.spreadsheet-wrapper {
  flex: 1;
  padding: 16px;
  overflow: auto;
}

.spreadsheet-header {
  display: flex;
}

.col-headers {
  display: flex;
  position: sticky;
  top: 0;
  z-index: 1;
}

.corner-cell {
  width: 40px;
  height: 28px;
  background: #fafafa;
  border: 1px solid #d9d9d9;
}

.col-header {
  width: 120px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  border: 1px solid #d9d9d9;
  font-size: 12px;
  font-weight: 600;
  color: #666;
}

.row-headers {
  position: sticky;
  left: 0;
  z-index: 1;
}

.row-header {
  width: 40px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  border: 1px solid #d9d9d9;
  font-size: 12px;
  font-weight: 600;
  color: #666;
}

.cells-area {
  overflow: auto;
}

.row {
  display: flex;
}

.cell {
  width: 120px;
  height: 28px;
  padding: 0 6px;
  border: 1px solid #d9d9d9;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.1s;
  display: flex;
  align-items: center;

  &:hover {
    border-color: #1890ff;
    background: #e6f7ff;
  }

  &.selected {
    border-color: #1890ff;
    background: #e6f7ff;
    outline: 2px solid #1890ff;
  }
}

.designer-sidebar {
  width: 280px;
  border-left: 1px solid #e8e8e8;
  padding: 16px;
  overflow-y: auto;
}

.sidebar-section {
  margin-bottom: 20px;
}

.sidebar-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.property-item {
  margin-bottom: 12px;
}

.property-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.property-input {
  width: 100%;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 12px;

  &:focus {
    outline: none;
    border-color: #1890ff;
  }
}

.align-buttons {
  display: flex;
  gap: 4px;
}

.align-btn {
  flex: 1;
  height: 32px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  background: #fff;

  &:hover {
    border-color: #1890ff;
  }

  &.active {
    background: #1890ff;
    color: #fff;
    border-color: #1890ff;
  }
}

.field-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #f5f7fa;
  }
}

.field-icon {
  font-size: 14px;
}

.field-name {
  flex: 1;
  font-size: 13px;
  color: #333;
}

.field-type {
  font-size: 12px;
  color: #999;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
