<!--
  Report Cell Selector - 报表单元格选择器弹窗
  
  设计理念：
  - 完整报表预览（包含样式、合并单元格、行列标题）
  - Excel风格单元格选择体验
  - 支持单选和多选模式（框选+Ctrl+点击）
  - 不同颜色边框标识（目标单元格绿色，计算单元格蓝色）
-->

<template>
  <div v-if="visible" class="report-cell-selector-overlay" @click.self="handleClose">
    <div class="report-cell-selector-modal">
      <!-- 弹窗头部 -->
      <div class="selector-header">
        <div class="header-title">
          <svg viewBox="0 0 16 16" width="16" height="16">
            <path d="M1 1h14v14H1V1zm1 1v12h12V2H2z" fill="currentColor"/>
            <path d="M3 3h4v4H3V3zm5 0h4v4H8V3zm-5 5h4v4H3V8zm5 0h4v4H8V8z" fill="currentColor"/>
          </svg>
          <span>{{ title }}</span>
          <span class="selection-mode-badge">{{ selectionModeText }}</span>
        </div>
        <button class="close-btn" @click="handleClose" title="关闭">
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" fill="none"/>
          </svg>
        </button>
      </div>
      
      <!-- ✅ 新增：多选模式操作提示 -->
      <div class="selector-tip">
        <span class="tip-icon">💡</span>
        <span>{{ tipText }}</span>
        <span v-if="selectionMode === 'calc'" class="tip-hint">
          （支持框选连续单元格或Ctrl+点击多选）
        </span>
      </div>
      
      <!-- 报表预览区域 -->
      <div class="report-preview-container">
        <div class="report-preview" ref="reportPreviewRef">
          <!-- ✅ 完整报表渲染 -->
          <table class="report-table" v-if="reportData">
            <!-- 列标题行 -->
            <thead>
              <tr class="header-row">
                <th class="corner-cell"></th>
                <th 
                  v-for="col in reportData.columnHeaders" 
                  :key="col.id"
                  class="column-header"
                >
                  {{ col.label || col.name || `列${col.index}` }}
                </th>
              </tr>
            </thead>
            
            <!-- 数据行（包含行标题和单元格） -->
            <tbody>
              <tr 
                v-for="(row, rowIndex) in reportData.rows" 
                :key="row.id"
                class="data-row"
              >
                <!-- 行标题列 -->
                <td class="row-header">
                  {{ row.label || row.name || `行${rowIndex + 1}` }}
                </td>
                
                <!-- ✅ 改进：数据单元格（支持多选） -->
                <td 
                  v-for="(cell, colIndex) in row.cells" 
                  :key="cell.id"
                  :class="[
                    'data-cell',
                    {
                      'selected-target': isSelectedTarget(cell),
                      'selected-calc': isSelectedCalc(cell),
                      'merged': cell.merged,
                      'empty': !cell.value,
                      'in-range': isInSelectionRange(cell, rowIndex, colIndex) // ✅ 框选范围内的单元格
                    }
                  ]"
                  :style="getCellStyle(cell, rowIndex, colIndex)"
                  @click="handleCellClick(cell, rowIndex, colIndex, $event)"
                  @mousedown="handleCellMouseDown(cell, rowIndex, colIndex, $event)"
                  @mouseenter="handleCellMouseEnter(cell, rowIndex, colIndex, $event)"
                  @mouseup="handleCellMouseUp($event)"
                  @mouseleave="handleCellLeave"
                >
                  <!-- 单元格内容 -->
                  <div class="cell-content">
                    <span class="cell-value">{{ cell.value || cell.exampleValue || '--' }}</span>
                    
                    <!-- ✅ 选中标识 -->
                    <div v-if="isSelectedTarget(cell)" class="selected-badge target">🎯 目标</div>
                    <div v-if="isSelectedCalc(cell)" class="selected-badge calc">📎 引用</div>
                    
                    <!-- ✅ Excel式引用标签（悬浮显示） -->
                    <div class="cell-ref-label" v-show="hoveredCell === cell.id">
                      {{ cell.excelRef }}
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          
          <!-- ✅ 改进：空状态提示，更清晰的引导 -->
          <div v-else class="report-empty">
            <svg viewBox="0 0 16 16" width="32" height="32">
              <path d="M1 1h14v14H1V1zm1 1v12h12V2H2z" fill="currentColor"/>
              <path d="M3 3h4v4H3V3zm5 0h4v4H8V3zm-5 5h4v4H3V8zm5 0h4v4H8V8z" fill="currentColor"/>
            </svg>
            <span>报表结构未设计</span>
            <span class="hint">当前模板缺少行维度或列维度数据</span>
            <span class="hint">请在左侧面板"行维度"和"列维度"中添加节点后再进行单元格选择</span>
          </div>
        </div>
        
        <!-- 单元格悬浮提示信息 -->
        <transition name="fade">
          <div v-if="hoveredCellInfo" class="cell-hover-tooltip" :style="tooltipPosition">
            <div class="tooltip-header">
              <span class="tooltip-icon">📐</span>
              <span class="tooltip-ref">{{ hoveredCellInfo.excelRef }}</span>
            </div>
            <div class="tooltip-body">
              <div class="tooltip-row">
                <span class="tooltip-label">行列标题:</span>
                <span class="tooltip-value">{{ hoveredCellInfo.rowLabel }} × {{ hoveredCellInfo.colLabel }}</span>
              </div>
              <div class="tooltip-row">
                <span class="tooltip-label">字段编码:</span>
                <span class="tooltip-value">{{ hoveredCellInfo.fieldName || hoveredCellInfo.code }}</span>
              </div>
              <div class="tooltip-row" v-if="hoveredCellInfo.value || hoveredCellInfo.exampleValue">
                <span class="tooltip-label">当前值:</span>
                <span class="tooltip-value">{{ hoveredCellInfo.value || hoveredCellInfo.exampleValue }}</span>
              </div>
              <div class="tooltip-row" v-if="hoveredCellInfo.dataType">
                <span class="tooltip-label">数据类型:</span>
                <span class="tooltip-value">{{ hoveredCellInfo.dataType }}</span>
              </div>
            </div>
          </div>
        </transition>
      </div>
      
      <!-- ✅ 改进：底部操作区（多选模式下显示确认/取消按钮） -->
      <div class="selector-footer">
        <div class="footer-info">
          <span class="selected-count">
            已选中: 
            <span class="target-count" v-if="localSelectedTargetCells.length > 0">{{ localSelectedTargetCells.length }}个目标</span>
            <span class="calc-count" v-if="localSelectedCalcCells.length > 0">{{ localSelectedCalcCells.length }}个引用</span>
          </span>
          <span v-if="localSelectedCalcCells.length > 1" class="ref-preview">
            引用格式: {{ generateCellReferencePreview() }}
          </span>
        </div>
        <div class="footer-actions">
          <!-- ✅ 计算单元格模式下，显示确认/取消按钮 -->
          <button 
            v-if="selectionMode === 'calc' && localSelectedCalcCells.length > 0" 
            class="footer-btn cancel-btn" 
            @click="handleCancel" 
            title="取消选择"
          >
            <svg viewBox="0 0 16 16" width="12" height="12">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" fill="none"/>
            </svg>
            <span>取消</span>
          </button>
          <button 
            v-if="selectionMode === 'calc'" 
            class="footer-btn primary" 
            @click="handleConfirm" 
            title="确认选择"
          >
            <svg viewBox="0 0 16 16" width="12" height="12">
              <path d="M7 10.5l-2-2 .7-.7 1.3 1.3 3.3-3.3.7.7-4 4z" fill="currentColor"/>
            </svg>
            <span>确认</span>
          </button>
          <!-- ✅ 目标单元格模式下，显示清空按钮 -->
          <button 
            v-if="selectionMode === 'target'" 
            class="footer-btn" 
            @click="handleClearSelection" 
            title="清空选择"
          >
            <svg viewBox="0 0 16 16" width="12" height="12">
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 2a5 5 0 1 1 0 10A5 5 0 0 1 8 3z" fill="currentColor"/>
              <path d="M5 5l6 6M11 5l-6 6" stroke="currentColor" stroke-width="1.5" fill="none"/>
            </svg>
            <span>清空</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'

export default {
  name: 'ReportCellSelector',
  
  props: {
    visible: Boolean,                          // 是否显示弹窗
    template: {
      type: Object,
      default: () => null // ✅ 设置默认值为null，避免undefined错误
    },
    title: {                                   // 弹窗标题
      type: String,
      default: '选择单元格'
    },
    selectionMode: {                           // 选择模式：'target' | 'calc'
      type: String,
      default: 'target'
    },
    selectedTargetCells: {                     // 已选中的目标单元格
      type: Array,
      default: () => []
    },
    selectedCalcCells: {                       // 已选中的计算单元格
      type: Array,
      default: () => []
    }
  },
  
  emits: ['close', 'select', 'confirm', 'cancel'],
  
  setup(props, { emit }) {
    // ==================== 状态管理 ====================
    
    const reportPreviewRef = ref(null)
    const hoveredCell = ref(null)
    const hoveredCellInfo = ref(null)
    const tooltipPosition = reactive({ top: '0px', left: '0px' })
    
    // 本地选中的单元格（用于临时存储）
    const localSelectedTargetCells = ref([])
    const localSelectedCalcCells = ref([])
    
    // ✅ 新增：多选状态管理（框选逻辑）
    const isDragging = ref(false)              // 是否正在拖拽框选
    const dragStartCell = ref(null)            // 框选起始单元格
    const dragStartRow = ref(null)             // 框选起始行索引
    const dragStartCol = ref(null)             // 框选起始列索引
    const dragEndRow = ref(null)               // 框选结束行索引
    const dragEndCol = ref(null)               // 框选结束列索引
    const selectionRange = reactive({          // 当前框选范围
      startRow: null,
      startCol: null,
      endRow: null,
      endCol: null
    })
    
    // ==================== 计算属性 ====================
    
    // 选择模式文本
    const selectionModeText = computed(() => {
      return props.selectionMode === 'target' ? '目标单元格' : '计算单元格'
    })
    
    // ✅ 改进：提示文本（根据模式动态调整）
    const tipText = computed(() => {
      if (props.selectionMode === 'target') {
        return '点击单元格选择目标位置（绿色边框标识），点击后自动关闭'
      } else {
        return '框选连续单元格或Ctrl+点击多选单元格（蓝色边框标识），选择完成后点击确认按钮'
      }
    })
    
    // ==================== 报表数据构建 ====================
    
    const reportData = computed(() => {
      // ✅ 添加详细调试日志
      console.log('📊 reportData computed - props.template:', props.template)
      console.log('📊 reportData computed - props.template所有属性:', props.template ? Object.keys(props.template) : 'null')
      
      // ✅ 尝试多种可能的行列数据属性名
      const possibleRowTreeNames = ['rowTree', 'rows', 'rowHeaders', 'rowDimensions', 'rowConfigs']
      const possibleColTreeNames = ['columnTree', 'columns', 'colHeaders', 'colDimensions', 'colConfigs']
      
      let rowTreeData = null
      let colTreeData = null
      
      // ✅ 查找rowTree数据
      for (const name of possibleRowTreeNames) {
        if (props.template?.[name]) {
          rowTreeData = props.template[name]
          console.log(`✅ 找到行数据: ${name}`, rowTreeData)
          break
        }
      }
      
      // ✅ 查找columnTree数据
      for (const name of possibleColTreeNames) {
        if (props.template?.[name]) {
          colTreeData = props.template[name]
          console.log(`✅ 找到列数据: ${name}`, colTreeData)
          break
        }
      }
      
      console.log('📊 最终找到的数据:', {
        rowTree: rowTreeData,
        columnTree: colTreeData
      })
      
      if (!rowTreeData || !colTreeData) {
        console.log('❌ 报表数据为空，原因：', {
          hasTemplate: !!props.template,
          hasRowTreeData: !!rowTreeData,
          hasColTreeData: !!colTreeData,
          templateKeys: props.template ? Object.keys(props.template) : []
        })
        
        // ✅ 返回null，并在模板中显示更友好的提示
        return null
      }
      
      // ✅ 检查是否为空数组
      if (rowTreeData.length === 0 || colTreeData.length === 0) {
        console.log('⚠️ 行列数据为空数组:', {
          rowTreeLength: rowTreeData.length,
          colTreeLength: colTreeData.length
        })
        return null
      }
      
      console.log('📊 构建报表数据:', props.template)
      
      // ✅ 提取行列叶子节点（使用找到的数据）
      const rowLeaves = extractTreeLeaves(rowTreeData, 'row')
      const colLeaves = extractTreeLeaves(colTreeData, 'col')
      
      // ✅ 构建列标题
      const columnHeaders = colLeaves.map((col, index) => ({
        id: col.id || `col_${index}`,
        label: col.label || col.name || col.fieldName || `列${index + 1}`,
        index: index + 1
      }))
      
      // ✅ 构建数据行
      const rows = rowLeaves.map((row, rowIndex) => {
        const rowLabel = row.label || row.name || row.fieldName || `行${rowIndex + 1}`
        
        // ✅ 构建单元格
        const cells = colLeaves.map((col, colIndex) => {
          const excelRef = convertToExcelRef(rowIndex + 1, colIndex + 1)
          
          return {
            id: `cell_${rowIndex}_${colIndex}`,
            row: rowIndex + 1,
            col: colIndex + 1,
            excelRef: excelRef,                        // Excel格式引用（C3）
            rowLabel: rowLabel,
            colLabel: col.label || col.name || col.fieldName || `列${colIndex + 1}`,
            fieldName: col.fieldName || col.code || col.id,
            code: row.fieldName || row.code || row.id,
            dataType: col.dataType || row.dataType || 'number',
            value: null,                               // 实际值（如果有）
            exampleValue: generateExampleValue(col.dataType || row.dataType || 'number'),
            merged: false,                             // 是否合并单元格
            mergedRange: null                          // 合并范围（如果有）
          }
        })
        
        return {
          id: row.id || `row_${rowIndex}`,
          label: rowLabel,
          index: rowIndex + 1,
          cells: cells
        }
      })
      
      console.log(`✅ 报表构建完成: ${rows.length}行 × ${columnHeaders.length}列`)
      
      return {
        columnHeaders,
        rows
      }
    })
    
    // ==================== 辅助函数 ====================
    
    // 提取树状结构的叶子节点
    function extractTreeLeaves(tree, type) {
      const leaves = []
      
      function traverse(node, depth = 0) {
        if (!node) return
        
        if (!node.children || node.children.length === 0) {
          leaves.push({ ...node, depth, type })
        } else {
          node.children.forEach(child => traverse(child, depth + 1))
        }
      }
      
      if (Array.isArray(tree)) {
        tree.forEach(node => traverse(node))
      } else if (tree.children && Array.isArray(tree.children)) {
        traverse(tree)
      } else {
        leaves.push({ ...tree, depth: 0, type })
      }
      
      return leaves
    }
    
    // 转换为Excel式引用
    function convertToExcelRef(row, col) {
      const colLetter = String.fromCharCode(64 + col) // ASCII: A=65
      return `${colLetter}${row}`
    }
    
    // 生成示例值
    function generateExampleValue(dataType) {
      switch (dataType) {
        case 'number': return Math.floor(Math.random() * 1000 + 100)
        case 'string': return '示例文本'
        case 'boolean': return true
        case 'date': return '2024-01-01'
        default: return Math.floor(Math.random() * 1000 + 100)
      }
    }
    
    // ==================== 选择判断 ====================
    
    function isSelectedTarget(cell) {
      return props.selectedTargetCells.some(c => c.id === cell.id) || 
             localSelectedTargetCells.value.some(c => c.id === cell.id)
    }
    
    function isSelectedCalc(cell) {
      return props.selectedCalcCells.some(c => c.id === cell.id) ||
             localSelectedCalcCells.value.some(c => c.id === cell.id)
    }
    
    // ✅ 新增：判断是否在框选范围内
    function isInSelectionRange(cell, rowIndex, colIndex) {
      if (!isDragging.value) return false
      
      const minRow = Math.min(selectionRange.startRow, selectionRange.endRow)
      const maxRow = Math.max(selectionRange.startRow, selectionRange.endRow)
      const minCol = Math.min(selectionRange.startCol, selectionRange.endCol)
      const maxCol = Math.max(selectionRange.startCol, selectionRange.endCol)
      
      return rowIndex >= minRow && rowIndex <= maxRow && 
             colIndex >= minCol && colIndex <= maxCol
    }
    
    // ✅ 新增：生成单元格引用预览（范围引用 vs 逗号分隔）
    function generateCellReferencePreview() {
      if (localSelectedCalcCells.value.length === 0) return ''
      
      // ✅ 判断是否为连续单元格（可以生成范围引用）
      const cells = [...localSelectedCalcCells.value].sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row
        return a.col - b.col
      })
      
      const isContiguous = checkContiguousCells(cells)
      
      if (isContiguous && cells.length > 1) {
        // ✅ 连续单元格：生成范围引用（A3:D3）
        const startCell = cells[0]
        const endCell = cells[cells.length - 1]
        return `${startCell.excelRef}:${endCell.excelRef}`
      } else {
        // ✅ 不连续单元格：生成逗号分隔（A3,C3,E3）
        return cells.map(c => c.excelRef).join(',')
      }
    }
    
    // ✅ 辅助函数：检查单元格是否连续
    function checkContiguousCells(cells) {
      if (cells.length <= 1) return true
      
      for (let i = 1; i < cells.length; i++) {
        const prevCell = cells[i - 1]
        const currCell = cells[i]
        
        // ✅ 检查是否在同一行且列连续，或者下一行的第一列
        if (prevCell.row === currCell.row) {
          // 同一行：列应该连续
          if (currCell.col !== prevCell.col + 1) return false
        } else if (currCell.row === prevCell.row + 1) {
          // 下一行：应该是第一列
          if (currCell.col !== 1) return false
        } else {
          // 行不连续
          return false
        }
      }
      
      return true
    }
    
    // ==================== 单元格样式 ====================
    
    function getCellStyle(cell, rowIndex, colIndex) {
      const style = {}
      
      // ✅ 合并单元格样式（如果有）
      if (cell.merged && cell.mergedRange) {
        style.gridColumn = `${colIndex + 1} / span ${cell.mergedRange.colSpan}`
        style.gridRow = `${rowIndex + 1} / span ${cell.mergedRange.rowSpan}`
      }
      
      // ✅ 选中单元格边框样式
      if (isSelectedTarget(cell)) {
        style.border = '3px solid #10B981' // 绿色边框（目标单元格）
        style.background = 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)'
      } else if (isSelectedCalc(cell)) {
        style.border = '3px solid #3B82F6' // 蓝色边框（计算单元格）
        style.background = 'linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 100%)'
      }
      
      return style
    }
    
    // ==================== 事件处理 ====================
    
    // ✅ 改进：单元格点击事件（支持Ctrl+点击多选）
    function handleCellClick(cell, rowIndex, colIndex, event) {
      console.log('🖱️ 点击单元格:', cell.excelRef, '模式:', props.selectionMode, 'Ctrl键:', event.ctrlKey)
      
      if (props.selectionMode === 'target') {
        // ✅ 目标单元格选择：单选模式，自动关闭
        localSelectedTargetCells.value = [cell]
        emit('select', { cell, mode: 'target' })
        
        // ✅ 自动关闭（目标单元格选择）
        setTimeout(() => {
          emit('close')
        }, 200)
        
      } else if (props.selectionMode === 'calc') {
        // ✅ 计算单元格选择：多选模式，手动确认
        if (event.ctrlKey) {
          // ✅ Ctrl+点击：切换选择状态
          const index = localSelectedCalcCells.value.findIndex(c => c.id === cell.id)
          if (index > -1) {
            // 已选中，则移除
            localSelectedCalcCells.value.splice(index, 1)
            console.log('✗ 已移除单元格:', cell.excelRef)
          } else {
            // 未选中，则添加
            localSelectedCalcCells.value.push(cell)
            console.log('✓ 已添加单元格:', cell.excelRef)
          }
        } else {
          // ✅ 普通点击：清空选择并选中当前单元格
          localSelectedCalcCells.value = [cell]
          console.log('✓ 已选中单元格:', cell.excelRef)
        }
        
        emit('select', { cell, mode: 'calc', cells: localSelectedCalcCells.value })
      }
    }
    
    // ✅ 新增：鼠标按下事件（开始框选）
    function handleCellMouseDown(cell, rowIndex, colIndex, event) {
      if (props.selectionMode !== 'calc') return
      
      // ✅ 开始框选（非Ctrl键按下时）
      if (!event.ctrlKey) {
        isDragging.value = true
        dragStartCell.value = cell
        dragStartRow.value = rowIndex
        dragStartCol.value = colIndex
        dragEndRow.value = rowIndex
        dragEndCol.value = colIndex
        
        selectionRange.startRow = rowIndex
        selectionRange.startCol = colIndex
        selectionRange.endRow = rowIndex
        selectionRange.endCol = colIndex
        
        console.log('🎯 开始框选:', cell.excelRef)
      }
    }
    
    // ✅ 新增：鼠标进入事件（框选过程中）
    function handleCellMouseEnter(cell, rowIndex, colIndex, event) {
      if (props.selectionMode !== 'calc') return
      
      // ✅ 悬浮提示逻辑
      hoveredCell.value = cell.id
      hoveredCellInfo.value = cell
      
      const tableEl = reportPreviewRef.value
      if (tableEl) {
        tooltipPosition.top = `${(rowIndex + 2) * 40}px`
        tooltipPosition.left = `${(colIndex + 1) * 120}px`
      }
      
      // ✅ 框选过程中：更新框选范围
      if (isDragging.value) {
        dragEndRow.value = rowIndex
        dragEndCol.value = colIndex
        
        selectionRange.endRow = rowIndex
        selectionRange.endCol = colIndex
        
        console.log('📐 框选范围更新:', `R${selectionRange.startRow + 1}C${selectionRange.startCol + 1}:R${selectionRange.endRow + 1}C${selectionRange.endCol + 1}`)
      }
    }
    
    // ✅ 新增：鼠标松开事件（结束框选）
    function handleCellMouseUp(event) {
      if (props.selectionMode !== 'calc' || !isDragging.value) return
      
      // ✅ 结束框选：收集框选范围内的所有单元格
      const minRow = Math.min(selectionRange.startRow, selectionRange.endRow)
      const maxRow = Math.max(selectionRange.startRow, selectionRange.endRow)
      const minCol = Math.min(selectionRange.startCol, selectionRange.endCol)
      const maxCol = Math.max(selectionRange.startCol, selectionRange.endCol)
      
      console.log('✅ 框选完成:', `R${minRow + 1}-R${maxRow + 1}, C${minCol + 1}-C${maxCol + 1}`)
      
      // ✅ 收集框选范围内的单元格
      const selectedCells = []
      if (reportData.value) {
        for (let r = minRow; r <= maxRow; r++) {
          const row = reportData.value.rows[r]
          if (row && row.cells) {
            for (let c = minCol; c <= maxCol; c++) {
              const cell = row.cells[c]
              if (cell) {
                selectedCells.push(cell)
              }
            }
          }
        }
      }
      
      // ✅ 更新本地选中单元格列表
      localSelectedCalcCells.value = selectedCells
      
      console.log('✓ 已框选', selectedCells.length, '个单元格:', selectedCells.map(c => c.excelRef).join(', '))
      
      emit('select', { cells: selectedCells, mode: 'calc' })
      
      // ✅ 重置框选状态
      isDragging.value = false
      dragStartCell.value = null
      selectionRange.startRow = null
      selectionRange.startCol = null
      selectionRange.endRow = null
      selectionRange.endCol = null
    }
    
    // ✅ 保留：单元格悬浮事件
    function handleCellHover(cell, rowIndex, colIndex) {
      hoveredCell.value = cell.id
      hoveredCellInfo.value = cell
      
      const tableEl = reportPreviewRef.value
      if (tableEl) {
        tooltipPosition.top = `${(rowIndex + 2) * 40}px`
        tooltipPosition.left = `${(colIndex + 1) * 120}px`
      }
    }
    
    function handleCellLeave() {
      hoveredCell.value = null
      hoveredCellInfo.value = null
      
      // ✅ 如果正在框选，不清除框选状态
      if (!isDragging.value) {
        selectionRange.startRow = null
        selectionRange.startCol = null
        selectionRange.endRow = null
        selectionRange.endCol = null
      }
    }
    
    function handleClose() {
      emit('close')
    }
    
    // ✅ 新增：取消选择
    function handleCancel() {
      localSelectedCalcCells.value = []
      emit('cancel')
    }
    
    function handleClearSelection() {
      localSelectedTargetCells.value = []
      localSelectedCalcCells.value = []
    }
    
    // ✅ 改进：确认选择（生成批量单元格引用）
    function handleConfirm() {
      if (props.selectionMode === 'calc' && localSelectedCalcCells.value.length > 0) {
        // ✅ 计算单元格模式：生成批量单元格引用
        const cellReference = generateCellReferencePreview()
        
        emit('confirm', {
          targetCells: localSelectedTargetCells.value,
          calcCells: localSelectedCalcCells.value,
          cellReference: cellReference // ✅ 传递生成的单元格引用字符串
        })
      } else if (props.selectionMode === 'target') {
        // ✅ 目标单元格模式：直接确认
        emit('confirm', {
          targetCells: localSelectedTargetCells.value,
          calcCells: localSelectedCalcCells.value
        })
      }
      
      emit('close')
    }
    
    // ==================== 监听属性变化 ====================
    
    watch(() => props.visible, (newVal) => {
      if (newVal) {
        // 弹窗打开时，清空本地选择
        localSelectedTargetCells.value = []
        localSelectedCalcCells.value = []
        console.log('🚀 报表单元格选择器已打开，模式:', props.selectionMode)
      }
    })
    
    return {
      reportPreviewRef,
      hoveredCell,
      hoveredCellInfo,
      tooltipPosition,
      selectionModeText,
      tipText,
      reportData,
      localSelectedTargetCells,
      localSelectedCalcCells,
      isSelectedTarget,
      isSelectedCalc,
      isInSelectionRange, // ✅ 新增：判断是否在框选范围内
      generateCellReferencePreview, // ✅ 新增：生成单元格引用预览
      getCellStyle,
      handleCellClick,
      handleCellMouseDown, // ✅ 新增：鼠标按下事件
      handleCellMouseEnter, // ✅ 新增：鼠标进入事件
      handleCellMouseUp, // ✅ 新增：鼠标松开事件
      handleCellHover,
      handleCellLeave,
      handleClose,
      handleCancel, // ✅ 新增：取消选择
      handleClearSelection,
      handleConfirm
    }
  }
}
</script>

<style scoped>
/* ✅ 弹窗遮罩层 */
.report-cell-selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease;
}

.report-cell-selector-modal {
  width: 90%;
  max-width: 1200px;
  max-height: 80vh;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

/* ✅ 弹窗头部 */
.selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
  color: white;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 600;
}

.header-title svg {
  opacity: 0.9;
}

.selection-mode-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* ✅ 操作提示 */
.selector-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #FEF3C7;
  border-bottom: 1px solid #FCD34D;
  color: #92400E;
  font-size: 13px;
}

.tip-icon {
  font-size: 16px;
}

/* ✅ 报表预览区域 */
.report-preview-container {
  flex: 1;
  overflow: auto;
  padding: 20px;
  background: #F9FAFB;
}

.report-preview {
  position: relative;
}

/* ✅ 报表表格样式 */
.report-table {
  width: 100%;
  border-collapse: collapse;
  border: 2px solid #E5E7EB;
  background: white;
  font-family: 'IBM Plex Sans', sans-serif;
}

/* ✅ 列标题行 */
.header-row {
  background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%);
}

.corner-cell {
  width: 120px;
  background: #D1D5DB;
  border: 1px solid #E5E7EB;
}

.column-header {
  padding: 12px;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  border: 1px solid #E5E7EB;
  background: #F3F4F6;
}

/* ✅ 数据行 */
.data-row {
  border-bottom: 1px solid #E5E7EB;
}

.row-header {
  padding: 12px;
  text-align: left;
  font-size: 13px;
  font-weight: 500;
  color: #1F2937;
  border: 1px solid #E5E7EB;
  background: #F3F4F6;
  width: 120px;
}

/* ✅ 数据单元格 */
.data-cell {
  padding: 0;
  border: 1px solid #E5E7EB;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;
  height: 40px;
  position: relative;
}

.data-cell:hover {
  background: rgba(59, 130, 246, 0.05);
  border-color: #3B82F6;
}

.data-cell.selected-target {
  border: 3px solid #10B981;
  background: linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%);
}

.data-cell.selected-target:hover {
  background: linear-gradient(135deg, #D1FAE5 0%, #ECFDF5 100%);
}

.data-cell.selected-calc {
  border: 3px solid #3B82F6;
  background: linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 100%);
}

.data-cell.selected-calc:hover {
  background: linear-gradient(135deg, #DBEAFE 0%, #EFF6FF 100%);
}

/* ✅ 新增：框选范围内的单元格样式 */
.data-cell.in-range {
  background: rgba(59, 130, 246, 0.1);
  border: 1px dashed #3B82F6;
}

.data-cell.merged {
  background: #F9FAFB;
}

.data-cell.empty {
  color: #D1D5DB;
}

/* ✅ 单元格内容 */
.cell-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 8px;
  position: relative;
}

.cell-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: #1F2937;
}

/* ✅ 选中标识badge */
.selected-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: 600;
  opacity: 0.9;
}

.selected-badge.target {
  background: #10B981;
  color: white;
}

.selected-badge.calc {
  background: #3B82F6;
  color: white;
}

/* ✅ Excel式引用标签（悬浮显示） */
.cell-ref-label {
  position: absolute;
  bottom: -18px;
  left: 50%;
  transform: translateX(-50%);
  background: #3B82F6;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.data-cell:hover .cell-ref-label {
  opacity: 1;
}

/* ✅ 单元格悬浮提示 */
.cell-hover-tooltip {
  position: absolute;
  width: 280px;
  background: white;
  border: 1.5px solid #E5E7EB;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 10000;
  animation: fadeIn 0.2s ease;
}

.cell-hover-tooltip .tooltip-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #E5E7EB;
}

.tooltip-icon {
  font-size: 16px;
}

.tooltip-ref {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
}

.tooltip-body {
  font-size: 12px;
}

.tooltip-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 4px;
}

.tooltip-label {
  color: #6B7280;
  font-weight: 500;
  min-width: 70px;
}

.tooltip-value {
  color: #1F2937;
  font-weight: 400;
}

/* ✅ 报表空状态 */
.report-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: #6B7280;
  font-size: 14px;
  text-align: center;
  background: white;
  border-radius: 8px;
  border: 1px dashed #D1D5DB;
}

.report-empty svg {
  opacity: 0.3;
}

.report-empty .hint {
  font-size: 12px;
  color: #9CA3AF;
}

/* ✅ 底部操作区 */
.selector-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: white;
  border-top: 1px solid #E5E7EB;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #6B7280;
}

.selected-count {
  display: flex;
  gap: 8px;
}

.target-count,
.calc-count {
  font-weight: 600;
}

.target-count {
  color: #10B981;
}

.calc-count {
  color: #3B82F6;
}

.footer-actions {
  display: flex;
  gap: 12px;
}

.footer-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  background: white;
  color: #6B7280;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.footer-btn:hover {
  background: #F9FAFB;
  border-color: #9CA3AF;
}

.footer-btn.primary {
  background: #3B82F6;
  border-color: #3B82F6;
  color: white;
}

.footer-btn.primary:hover {
  background: #2563EB;
}

/* ✅ 新增：取消按钮样式 */
.footer-btn.cancel-btn {
  background: white;
  border-color: #6B7280;
  color: #6B7280;
}

.footer-btn.cancel-btn:hover {
  background: #F9FAFB;
  border-color: #9CA3AF;
}

/* ✅ 新增：引用预览样式 */
.ref-preview {
  color: #3B82F6;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  margin-left: 8px;
  padding: 4px 8px;
  background: #EFF6FF;
  border-radius: 4px;
}

/* ✅ 动画 */
.fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>