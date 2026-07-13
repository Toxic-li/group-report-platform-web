<template>
  <div class="fe-modal" @click.self="$emit('close')">
    <div class="fe-dialog">
      <!-- 头部 -->
      <div class="fe-header">
        <span class="fe-title">公式设计器</span>
        <span v-if="cellInfo" class="fe-cell-tag">{{ cellInfo }}</span>
        <button class="fe-close" @click="$emit('close')">&times;</button>
      </div>

      <!-- 主体 -->
      <div class="fe-body">
        <!-- 左侧：函数列表 -->
        <div class="fe-left">
          <div class="fe-section-title">选择函数</div>
          <input v-model="fnSearch" class="fe-search" placeholder="搜索函数..." />
          <div class="fe-fn-list">
            <div
              v-for="fn in filteredFunctions"
              :key="fn.name"
              class="fe-fn-item"
              :class="{ active: selectedFn === fn.name }"
              @click="selectFn(fn)"
            >
              <span class="fe-fn-name">{{ fn.name }}</span>
              <span class="fe-fn-desc">{{ fn.desc }}</span>
            </div>
          </div>
        </div>

        <!-- 右侧：参数配置 -->
        <div class="fe-right">
          <div class="fe-section-title">参数配置</div>

          <!-- 无函数选中 -->
          <div v-if="!selectedFn" class="fe-empty">
            <div class="fe-empty-icon">fx</div>
            <div class="fe-empty-text">请从左侧选择一个函数</div>
          </div>

          <!-- 有函数选中 -->
          <template v-else>
            <div class="fe-fn-info">
              <span class="fe-fn-signature">{{ fnSignature }}</span>
              <span class="fe-fn-hint">{{ currentFn.desc }}</span>
            </div>

            <!-- 参数列表 -->
            <div class="fe-params">
              <div v-for="(param, idx) in currentFn.params" :key="idx" class="fe-param">
                <div class="fe-param-head">
                  <span class="fe-param-name">{{ param.name }}</span>
                  <span v-if="param.required" class="fe-param-req">必填</span>
                  <span v-else class="fe-param-opt">可选</span>
                </div>
                <div class="fe-param-input-row">
                  <input
                    v-model="paramValues[idx]"
                    class="fe-param-input"
                    :placeholder="param.placeholder || '输入值或选择单元格'"
                  />
                  <button class="fe-pick-btn" @click="openCellPicker(idx)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
                    选择单元格
                  </button>
                </div>
                <div v-if="paramCells[idx] && paramCells[idx].length" class="fe-picked-cells">
                  <span
                    v-for="c in paramCells[idx]"
                    :key="c.key"
                    class="fe-picked-cell"
                  >{{ c.label }}<button class="fe-picked-remove" @click="removePickedCell(idx, c.key)">&times;</button></span>
                </div>
              </div>
            </div>

            <!-- 整行选项 -->
            <label class="fe-row-opt">
              <input type="checkbox" v-model="applyToRow" />
              <span>应用到整行（所有数据列）</span>
            </label>

            <!-- 公式预览 -->
            <div class="fe-preview">
              <div class="fe-preview-label">公式预览</div>
              <div class="fe-preview-box">
                <span class="fe-preview-eq">=</span>
                <span class="fe-preview-expr">{{ generatedFormula || '(请配置参数)' }}</span>
              </div>
            </div>

            <!-- 元信息 -->
            <div class="fe-meta">
              <input v-model="formulaName" class="fe-meta-input" placeholder="公式名称（如：完成率）" />
              <select v-model="resultType" class="fe-meta-select">
                <option value="number">数值</option>
                <option value="percent">百分比</option>
                <option value="string">文本</option>
              </select>
            </div>
          </template>
        </div>
      </div>

      <!-- 底部 -->
      <div class="fe-footer">
        <button class="fe-btn fe-btn-default" @click="$emit('close')">取消</button>
        <button class="fe-btn fe-btn-primary" :disabled="!generatedFormula" @click="handleSave">保存公式</button>
      </div>

      <!-- 单元格选择弹窗 -->
      <Teleport to="body">
        <div v-if="cellPicker.visible" class="cp-modal" @click.self="cellPicker.visible = false">
          <div class="cp-dialog">
            <div class="cp-header">
              <span class="cp-title">选择单元格{{ cellPicker.multi ? '（可多选）' : '' }}</span>
              <span class="cp-hint">点击报表中的单元格进行选择</span>
              <button class="cp-close" @click="cellPicker.visible = false">&times;</button>
            </div>
            <div class="cp-body">
              <table class="cp-table">
                <thead>
                  <tr>
                    <th class="cp-corner"></th>
                    <th v-for="col in colFields" :key="col.id" class="cp-col-header">{{ col.title || col.name }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in rowFields" :key="row.id">
                    <td class="cp-row-header">{{ row.name }}</td>
                    <td
                      v-for="col in colFields"
                      :key="col.id"
                      class="cp-cell"
                      :class="{ selected: isCellPicked(row, col) }"
                      @click="togglePickCell(row, col)"
                    >
                      <span v-if="isCellPicked(row, col)" class="cp-check">&#10003;</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="cp-footer">
              <span class="cp-selected-count">已选 {{ cellPicker.picked.length }} 个单元格</span>
              <button class="cp-btn cp-btn-clear" @click="cellPicker.picked = []">清空</button>
              <button class="cp-btn cp-btn-default" @click="cellPicker.visible = false">取消</button>
              <button class="cp-btn cp-btn-primary" @click="confirmPick">确认选择</button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'

const props = defineProps({
  cellInfo: { type: String, default: '' },
  initialValue: { type: String, default: '' },
  fields: { type: Array, default: () => [] },
  rowFields: { type: Array, default: () => [] },
  colFields: { type: Array, default: () => [] },
  validFieldIds: { type: Array, default: () => [] },
  templateId: { type: [String, Number], default: null }
})

const emit = defineEmits(['apply', 'close', 'saved'])

// ==================== 函数定义 ====================
const functions = [
  { name: 'SUM', desc: '求和', params: [{ name: '单元格', required: true, placeholder: '选择多个单元格求和' }] },
  { name: 'AVG', desc: '平均值', params: [{ name: '单元格', required: true, placeholder: '选择多个单元格求平均' }] },
  { name: 'MAX', desc: '最大值', params: [{ name: '单元格', required: true, placeholder: '选择单元格取最大值' }] },
  { name: 'MIN', desc: '最小值', params: [{ name: '单元格', required: true, placeholder: '选择单元格取最小值' }] },
  { name: 'COUNT', desc: '计数', params: [{ name: '单元格', required: true, placeholder: '选择单元格计数' }] },
  { name: 'IF', desc: '条件判断', params: [
    { name: '条件', required: true, placeholder: '如 [A] > 0' },
    { name: '真值', required: true, placeholder: '条件为真时的值' },
    { name: '假值', required: true, placeholder: '条件为假时的值' }
  ]},
  { name: 'ROUND', desc: '四舍五入', params: [
    { name: '数值', required: true, placeholder: '要舍入的值或单元格' },
    { name: '小数位', required: true, placeholder: '保留几位小数，如 2' }
  ]},
  { name: 'ABS', desc: '绝对值', params: [{ name: '数值', required: true, placeholder: '取绝对值的单元格' }] },
  { name: 'POWER', desc: '乘幂', params: [
    { name: '底数', required: true, placeholder: '底数单元格' },
    { name: '指数', required: true, placeholder: '指数值' }
  ]},
  { name: 'RATE', desc: '比率 A/B', params: [
    { name: '分子', required: true, placeholder: '选择分子单元格' },
    { name: '分母', required: true, placeholder: '选择分母单元格' }
  ]},
  { name: 'GROWTH', desc: '增长率', params: [
    { name: '本期', required: true, placeholder: '本期值单元格' },
    { name: '上期', required: true, placeholder: '上期值单元格' }
  ]},
  { name: 'DIFF', desc: '差值 A-B', params: [
    { name: '值A', required: true, placeholder: '选择单元格A' },
    { name: '值B', required: true, placeholder: '选择单元格B' }
  ]},
]

const fnSearch = ref('')
const selectedFn = ref('')
const currentFn = computed(() => functions.find(f => f.name === selectedFn.value) || null)
const filteredFunctions = computed(() => {
  const kw = fnSearch.value.trim().toUpperCase()
  if (!kw) return functions
  return functions.filter(f => f.name.includes(kw) || f.desc.includes(fnSearch.value.trim()))
})

const fnSignature = computed(() => {
  if (!currentFn.value) return ''
  const params = currentFn.value.params.map(p => p.name).join(', ')
  return `${currentFn.value.name}(${params})`
})

// ==================== 参数值 ====================
const paramValues = ref([])
const paramCells = ref([]) // 每个参数选中的单元格 [{ key, label, rowId, colId }]

function selectFn(fn) {
  selectedFn.value = fn.name
  paramValues.value = fn.params.map(() => '')
  paramCells.value = fn.params.map(() => [])
}

// ==================== 单元格选择器 ====================
const cellPicker = reactive({
  visible: false,
  paramIdx: -1,
  multi: true,
  picked: [] // [{ key, label, rowId, colId }]
})

function openCellPicker(paramIdx) {
  cellPicker.paramIdx = paramIdx
  cellPicker.multi = true
  cellPicker.picked = [...(paramCells.value[paramIdx] || [])]
  cellPicker.visible = true
}

function isCellPicked(row, col) {
  const key = `${row.id}:${col.id}`
  return cellPicker.picked.some(p => p.key === key)
}

function togglePickCell(row, col) {
  const key = `${row.id}:${col.id}`
  const idx = cellPicker.picked.findIndex(p => p.key === key)
  if (idx >= 0) {
    cellPicker.picked.splice(idx, 1)
  } else {
    cellPicker.picked.push({
      key,
      label: `${row.name}/${col.title || col.name}`,
      rowId: row.id,
      colId: col.id
    })
  }
}

function removePickedCell(paramIdx, key) {
  const list = paramCells.value[paramIdx] || []
  const idx = list.findIndex(p => p.key === key)
  if (idx >= 0) list.splice(idx, 1)
  // 同步更新输入框
  syncParamValue(paramIdx)
}

function confirmPick() {
  const idx = cellPicker.paramIdx
  if (idx < 0) { cellPicker.visible = false; return }
  paramCells.value[idx] = [...cellPicker.picked]
  syncParamValue(idx)
  cellPicker.visible = false
}

function syncParamValue(paramIdx) {
  const cells = paramCells.value[paramIdx] || []
  if (cells.length === 0) {
    // 不覆盖手动输入
    return
  }
  // 将选中的单元格生成为引用格式
  const refs = cells.map(c => `[${c.rowId}:${c.colId}]`)
  paramValues.value[paramIdx] = refs.join(', ')
}

// ==================== 公式生成 ====================
const applyToRow = ref(false)
const formulaName = ref('')
const resultType = ref('number')

const generatedFormula = computed(() => {
  if (!selectedFn.value || !currentFn.value) return ''

  const fn = currentFn.value
  const args = []

  for (let i = 0; i < fn.params.length; i++) {
    const cells = paramCells.value[i] || []
    const manual = (paramValues.value[i] || '').trim()

    if (cells.length > 0) {
      // 有选中的单元格
      const refs = cells.map(c => `[${c.rowId}:${c.colId}]`)
      args.push(refs.join(', '))
    } else if (manual) {
      args.push(manual)
    } else {
      args.push('')
    }
  }

  // 特殊函数处理
  if (fn.name === 'RATE') {
    const a = args[0], b = args[1]
    if (!a || !b) return ''
    return `IF(${b} != 0, ROUND(${a} / ${b}, 2), 0)`
  }
  if (fn.name === 'GROWTH') {
    const cur = args[0], prev = args[1]
    if (!cur || !prev) return ''
    return `IF(${prev} != 0, ROUND((${cur} - ${prev}) / ${prev} * 100, 2), 0)`
  }
  if (fn.name === 'DIFF') {
    const a = args[0], b = args[1]
    if (!a || !b) return ''
    return `${a} - ${b}`
  }

  // 通用函数：FN(arg1, arg2, ...)
  const validArgs = args.filter(a => a !== '')
  if (validArgs.length === 0) return ''
  return `${fn.name}(${validArgs.join(', ')})`
})

// ==================== 保存 ====================
function handleSave() {
  const expr = generatedFormula.value
  if (!expr) return

  const deps = []
  const matches = expr.match(/\[([^\]]+)\]/g) || []
  for (const m of matches) {
    deps.push(m.slice(1, -1))
  }

  const formulaData = {
    expression: '=' + expr,
    rawExpression: expr,
    fieldName: formulaName.value.trim() || `formula_${Date.now().toString(36)}`,
    label: formulaName.value.trim(),
    resultType: resultType.value,
    dependencies: [...new Set(deps)],
    applyToRow: applyToRow.value,
    createdAt: new Date().toISOString()
  }

  emit('apply', formulaData)
  emit('close')
}

// ==================== 编辑模式：恢复已有公式 ====================
onMounted(() => {
  if (props.initialValue) {
    const expr = props.initialValue.replace(/^=/, '').trim()
    parseExisting(expr)
  }
})

function parseExisting(expr) {
  if (!expr) return

  // 匹配 FN(args)
  const m = expr.match(/^(\w+)\((.+)\)$/i)
  if (!m) return

  const fnName = m[1].toUpperCase()
  const fn = functions.find(f => f.name === fnName)
  if (!fn) return

  selectFn(fn)

  // 简单解析参数（不处理嵌套括号的复杂情况）
  const args = splitArgs(m[2])
  for (let i = 0; i < args.length && i < fn.params.length; i++) {
    paramValues.value[i] = args[i].trim()
    // 解析单元格引用
    const refs = args[i].match(/\[([^\]]+)\]/g) || []
    for (const ref of refs) {
      const inner = ref.slice(1, -1)
      const parts = inner.split(':')
      if (parts.length === 2) {
        const row = props.rowFields.find(r => r.id === parts[0])
        const col = props.colFields.find(c => c.id === parts[1])
        paramCells.value[i].push({
          key: inner,
          label: `${row?.name || parts[0]}/${col?.title || col?.name || parts[1]}`,
          rowId: parts[0],
          colId: parts[1]
        })
      }
    }
  }
}

function splitArgs(str) {
  const result = []
  let depth = 0, current = ''
  for (const ch of str) {
    if (ch === '(') depth++
    else if (ch === ')') depth--
    if (ch === ',' && depth === 0) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  if (current.trim()) result.push(current)
  return result
}
</script>

<style lang="scss" scoped>
.fe-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.fe-dialog {
  width: min(760px, 94vw);
  max-height: 88vh;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 头部 */
.fe-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  border-bottom: 1px solid #E5E7EB;
  flex-shrink: 0;
}

.fe-title { font-size: 16px; font-weight: 600; color: #1F2937; }

.fe-cell-tag {
  font-size: 12px;
  color: #2563EB;
  background: #EFF6FF;
  padding: 2px 8px;
  border-radius: 4px;
}

.fe-close {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 22px;
  color: #9CA3AF;
  cursor: pointer;
  line-height: 1;
  padding: 2px 8px;
  border-radius: 6px;
  &:hover { background: #E5E7EB; color: #374151; }
}

/* 主体 */
.fe-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 360px;
}

/* 左侧 */
.fe-left {
  width: 220px;
  border-right: 1px solid #E5E7EB;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.fe-section-title {
  font-size: 12px;
  font-weight: 600;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 12px 14px 8px;
}

.fe-search {
  margin: 0 14px 8px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 12px;
  outline: none;
  &:focus { border-color: #2563EB; }
}

.fe-fn-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px 8px;
}

.fe-fn-item {
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
  transition: background 0.1s;

  &:hover { background: #F3F4F6; }
  &.active { background: #EFF6FF; }
}

.fe-fn-name {
  font-size: 13px;
  font-weight: 600;
  color: #1F2937;
  font-family: 'SF Mono', 'Consolas', monospace;
}

.fe-fn-desc { font-size: 11px; color: #9CA3AF; }

/* 右侧 */
.fe-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 0;
}

.fe-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #9CA3AF;
}

.fe-empty-icon { font-size: 36px; font-style: italic; color: #D1D5DB; }
.fe-empty-text { font-size: 13px; }

/* 函数信息 */
.fe-fn-info {
  padding: 12px 16px;
  background: #F9FAFB;
  border-bottom: 1px solid #E5E7EB;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fe-fn-signature {
  font-family: 'SF Mono', 'Consolas', monospace;
  font-size: 14px;
  font-weight: 600;
  color: #2563EB;
}

.fe-fn-hint { font-size: 12px; color: #6B7280; }

/* 参数 */
.fe-params { padding: 12px 16px; }

.fe-param { margin-bottom: 14px; }

.fe-param-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.fe-param-name { font-size: 13px; font-weight: 500; color: #374151; }

.fe-param-req {
  font-size: 10px; color: #DC2626; background: #FEF2F2;
  padding: 1px 5px; border-radius: 3px;
}

.fe-param-opt {
  font-size: 10px; color: #6B7280; background: #F3F4F6;
  padding: 1px 5px; border-radius: 3px;
}

.fe-param-input-row {
  display: flex;
  gap: 6px;
}

.fe-param-input {
  flex: 1;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 13px;
  font-family: 'SF Mono', 'Consolas', monospace;
  color: #1F2937;
  outline: none;
  &:focus { border-color: #2563EB; box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1); }
}

.fe-pick-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  background: #fff;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
  &:hover { background: #F3F4F6; border-color: #9CA3AF; }
}

.fe-picked-cells {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.fe-picked-cell {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  border-radius: 4px;
  font-size: 11px;
  color: #1E40AF;
}

.fe-picked-remove {
  background: none;
  border: none;
  color: #9CA3AF;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0;
  &:hover { color: #DC2626; }
}

/* 整行选项 */
.fe-row-opt {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;

  input[type="checkbox"] {
    width: 16px; height: 16px;
    accent-color: #2563EB;
    cursor: pointer;
  }
}

/* 公式预览 */
.fe-preview {
  padding: 12px 16px;
  border-top: 1px solid #E5E7EB;
}

.fe-preview-label {
  font-size: 12px;
  font-weight: 600;
  color: #6B7280;
  margin-bottom: 6px;
}

.fe-preview-box {
  padding: 10px 12px;
  background: #F0FDF4;
  border: 1px solid #BBF7D0;
  border-radius: 8px;
  font-family: 'SF Mono', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-all;
  display: flex;
  align-items: flex-start;
  gap: 2px;
}

.fe-preview-eq { color: #059669; font-weight: 700; }
.fe-preview-expr { color: #15803D; }

/* 元信息 */
.fe-meta {
  display: flex;
  gap: 8px;
  padding: 8px 16px 12px;
}

.fe-meta-input {
  flex: 1;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  &:focus { border-color: #2563EB; }
}

.fe-meta-select {
  width: 100px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 13px;
  background: #fff;
  outline: none;
  cursor: pointer;
}

/* 底部 */
.fe-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid #E5E7EB;
  background: #FAFBFC;
  flex-shrink: 0;
}

.fe-btn {
  padding: 8px 18px;
  border-radius: 8px;
  border: 1px solid #D1D5DB;
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s;
  &:hover:not(:disabled) { background: #F3F4F6; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
}

.fe-btn-primary {
  background: #2563EB;
  border-color: #2563EB;
  color: #fff;
  margin-left: auto;
  &:hover:not(:disabled) { background: #1D4ED8; }
}

/* ==================== 单元格选择弹窗 ==================== */
.cp-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
}

.cp-dialog {
  width: min(720px, 92vw);
  max-height: 80vh;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cp-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-bottom: 1px solid #E5E7EB;
}

.cp-title { font-size: 15px; font-weight: 600; color: #1F2937; }
.cp-hint { font-size: 12px; color: #6B7280; }

.cp-close {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 22px;
  color: #9CA3AF;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 6px;
  &:hover { background: #E5E7EB; }
}

.cp-body {
  flex: 1;
  overflow: auto;
  padding: 12px 18px;
}

.cp-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  table-layout: fixed;
}

.cp-corner {
  width: 120px;
  min-width: 120px;
  background: #F9FAFB;
}

.cp-col-header {
  background: #F9FAFB;
  padding: 6px 4px;
  text-align: center;
  font-weight: 600;
  color: #374151;
  border: 1px solid #E5E7EB;
  font-size: 11px;
  word-break: break-all;
}

.cp-row-header {
  background: #F9FAFB;
  padding: 6px 8px;
  font-weight: 500;
  color: #374151;
  border: 1px solid #E5E7EB;
  font-size: 12px;
  white-space: nowrap;
}

.cp-cell {
  border: 1px solid #E5E7EB;
  text-align: center;
  cursor: pointer;
  height: 32px;
  width: 40px;
  transition: all 0.1s;
  &:hover { background: #EFF6FF; }
  &.selected {
    background: #2563EB;
    .cp-check { color: #fff; font-size: 14px; }
  }
}

.cp-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 18px;
  border-top: 1px solid #E5E7EB;
  background: #FAFBFC;
}

.cp-selected-count {
  font-size: 12px;
  color: #6B7280;
}

.cp-btn {
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid #D1D5DB;
  background: #fff;
  font-size: 12px;
  cursor: pointer;
  &:hover { background: #F3F4F6; }
}

.cp-btn-clear { margin-left: auto; color: #DC2626; }
.cp-btn-primary {
  background: #2563EB;
  border-color: #2563EB;
  color: #fff;
  &:hover { background: #1D4ED8; }
}
</style>
