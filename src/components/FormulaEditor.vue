<template>
  <div class="formula-editor" @click.stop>
    <!-- 头部 -->
    <div class="fe-header">
      <span class="fe-title">公式编辑器</span>
      <span v-if="cellInfo" class="fe-cell-info">{{ cellInfo }}</span>
      <button class="fe-close" @click="$emit('close')">&times;</button>
    </div>

    <!-- 公式元信息（名称/标签/类型） -->
    <div class="fe-meta-bar">
      <div class="fe-meta-item">
        <label>公式名称</label>
        <input v-model="formulaName" class="fe-meta-input" placeholder="如: completionRate" spellcheck="false" />
      </div>
      <div class="fe-meta-item">
        <label>显示标签</label>
        <input v-model="formulaLabel" class="fe-meta-input" placeholder="如: 完成率" spellcheck="false" />
      </div>
      <div class="fe-meta-item fe-meta-type">
        <label>结果类型</label>
        <select v-model="resultType" class="fe-meta-select">
          <option value="number">数值</option>
          <option value="percent">百分比</option>
          <option value="string">文本</option>
          <option value="boolean">布尔值</option>
        </select>
      </div>
    </div>

    <!-- 主体：字段面板 + 编辑区 + 函数面板 -->
    <div class="fe-body">

      <!-- 左侧：字段列表（行指标 + 列指标） -->
      <aside class="fe-field-panel">
        <!-- 行指标 -->
        <section v-if="rowFieldList.length" class="fe-field-section">
          <h4>行指标</h4>
          <div class="fe-field-list">
            <div
              v-for="field in rowFieldList"
              :key="'r_' + field.id"
              class="fe-field-item fe-field-row"
              :title="field.desc || field.label"
              @click="insertField(field.id)"
            >
              <span class="fe-field-icon">R</span>
              <span class="fe-field-label">{{ field.label }}</span>
            </div>
          </div>
        </section>

        <!-- 列指标 -->
        <section v-if="fieldList.length" class="fe-field-section">
          <h4>列指标</h4>
          <div class="fe-field-list">
            <div
              v-for="field in fieldList"
              :key="'c_' + field.id"
              class="fe-field-item fe-field-col"
              :title="field.desc || field.label"
              @click="insertField(field.id)"
            >
              <span class="fe-field-icon">{{ field.type === 'aggregate' ? 'Σ' : 'C' }}</span>
              <span class="fe-field-label">{{ field.label }}</span>
            </div>
          </div>
        </section>

        <div v-if="!rowFieldList.length && !fieldList.length" class="fe-empty-fields">暂无可用字段</div>
      </aside>

      <!-- 中间：编辑区 -->
      <main class="fe-editor-area">
        <!-- 输入区（带高亮） -->
        <div class="fe-input-wrapper" :class="{ 'fe-error': hasError, 'fe-focus': isFocused }">
          <span class="fe-prefix">=</span>
          <div
            ref="highlightRef"
            class="fe-highlight-layer"
            contenteditable="false"
            v-html="highlightedText"
          ></div>
          <textarea
            ref="inputRef"
            v-model="expression"
            class="fe-input"
            :placeholder="'输入公式，如: SUM(r_raw, m_raw_coal)'"
            spellcheck="false"
            autocomplete="off"
            autocapitalize="off"
            @input="onInput"
            @focus="isFocused = true"
            @blur="onBlur"
            @keydown="onKeydown"
          ></textarea>
        </div>

        <!-- 错误提示 -->
        <transition name="fe-slide">
          <div v-if="hasError" class="fe-error-msg">
            <svg viewBox="0 0 16 16" width="14" height="14"><circle cx="8" cy="8" r="7" fill="#DC2626"/><text x="8" y="11.5" text-anchor="middle" fill="#fff" font-size="10" font-weight="bold">!</text></svg>
            {{ validationError }}
          </div>
        </transition>

        <!-- 预览结果 -->
        <transition name="fe-slide">
          <div v-if="previewResult !== null && !hasError" class="fe-preview">
            <span class="fe-preview-label">预览结果</span>
            <span class="fe-preview-value" :class="{ 'fe-preview-err': isNaN(previewResult) }">
              {{ formatPreview(previewResult) }}
            </span>
          </div>
        </transition>

        <!-- 快捷操作 -->
        <div class="fe-actions">
          <button class="fe-btn fe-btn-primary" :disabled="hasError || !expression.trim()" @click="applyFormula">
            应用公式
          </button>
          <button class="fe-btn" @click="clearInput">清空</button>
          <button class="fe-btn fe-btn-link" @click="$emit('close')">取消</button>
        </div>
      </main>

      <!-- 右侧：函数面板 -->
      <aside class="fe-func-panel">
        <h4>内置函数</h4>
        <div class="fe-func-list">
          <div
            v-for="func in builtInFunctions"
            :key="func.name"
            class="fe-func-item"
            @click="insertFunction(func)"
          >
            <span class="fe-func-name">{{ func.name }}()</span>
            <span class="fe-func-desc">{{ func.desc }}</span>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  /** 当前单元格信息 */
  cellInfo: { type: String, default: '' },
  /** 初始表达式 */
  initialValue: { type: String, default: '' },
  /** 列指标字段列表（列维度） */
  fields: {
    type: Array,
    default: () => []
  },
  /** 行指标字段列表（行维度） */
  rowFields: {
    type: Array,
    default: () => []
  },
  /** 可用字段ID集合（用于校验，合并行+列） */
  validFieldIds: {
    type: Array,
    default: () => []
  },
  /** 模板ID（用于保存公式到后端） */
  templateId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['apply', 'close', 'saved'])

// ==================== 状态 ====================
const inputRef = ref(null)
const highlightRef = ref(null)
const expression = ref(props.initialValue.replace(new RegExp('^=', ''), '') || '')
const isFocused = ref(false)
const validationError = ref('')
const previewResult = ref(null)

// 公式元信息
const formulaName = ref('')
const formulaLabel = ref('')
const resultType = ref('number')

// ==================== 字段列表 ====================
const fieldList = computed(() => props.fields.map(f => ({
  id: typeof f === 'string' ? f : (f.id || f),
  label: typeof f === 'string' ? f : (f.title || f.label || f.id),
  desc: typeof f === 'string' ? '' : (f.description || ''),
  type: typeof f === 'object' ? (f.type || '') : ''
})))

/** 行指标字段列表 */
const rowFieldList = computed(() => props.rowFields.map(f => ({
  id: typeof f === 'string' ? f : (f.id || f),
  label: typeof f === 'string' ? f : (f.name || f.title || f.label || f.id),
  desc: typeof f === 'string' ? '' : (f.description || ''),
  type: typeof f === 'object' ? (f.type || '') : ''
})))

// ==================== 内置函数 ====================
const builtInFunctions = [
  { name: 'SUM', desc: '求和', template: 'SUM(${fields})' },
  { name: 'AVG', desc: '平均值', template: 'AVG(${fields})' },
  { name: 'MAX', desc: '最大值', template: 'MAX(${fields})' },
  { name: 'MIN', desc: '最小值', template: 'MIN(${fields})' },
  { name: 'COUNT', desc: '计数', template: 'COUNT(${fields})' },
  { name: 'IF', desc: '条件判断', template: 'IF(${cond}, ${trueVal}, ${falseVal})' },
  { name: 'ROUND', desc: '四舍五入', template: 'ROUND(${val}, ${digits})' },
  { name: 'ABS', desc: '绝对值', template: 'ABS(${val})' }
]

// ==================== 校验引擎 ====================
const hasError = computed(() => !!validationError.value)

function validate(expr) {
  const e = expr.trim()
  if (!e) { validationError.value = ''; return }

  // 1. 括号匹配
  let depth = 0
  for (const ch of e) {
    if (ch === '(') depth++
    else if (ch === ')') depth--
    if (depth < 0) { validationError.value = '括号不匹配：多余的 )'; return }
  }
  if (depth > 0) { validationError.value = `括号不匹配：缺少 ${depth} 个 )`; return }

  // 2. 非法字符检测（允许 = 开头，其余仅允许字母数字下划线、运算符、括号、逗号、点、空格、$、{、}）
  const checkExpr = e.replace(/^=/, '')
  const validPattern = new RegExp('^[a-zA-Z0-9_+\\-*/().,<>=!&| \\u4e00-\\u9fa5${}]*$')
  if (!validPattern.test(checkExpr)) {
    const invalid = checkExpr.replace(validPattern, '').charAt(0)
    validationError.value = `非法字符: "${invalid}"，仅支持字母、数字、运算符和括号`
    return
  }

  // 3. 函数格式校验（去掉 = 前缀后校验）
  const funcRegex = new RegExp('\\b(SUM|AVG|MAX|MIN|COUNT|IF|ROUND|ABS)\\b\\s*\\(', 'gi')
  let match
  while ((match = funcRegex.exec(checkExpr)) !== null) {
    const funcName = match[1].toUpperCase()
    const afterFunc = checkExpr.substring(match.index + funcName.length).trim()
    if (!afterFunc.startsWith('(')) {
      validationError.value = `函数 ${funcName}() 后必须紧跟 (`
      return
    }
  }

  // 4. 未定义字段检测（忽略 ${...} 占位符）
  const fieldIds = new Set(props.validFieldIds.length ? props.validFieldIds : [...fieldList.value.map(f => f.id), ...rowFieldList.value.map(f => f.id)])
  const usedFields = extractFieldRefs(checkExpr)
  for (const field of usedFields) {
    if (field.startsWith('${') && field.endsWith('}')) continue
    if (!fieldIds.has(field)) {
      validationError.value = `未定义的字段: "${field}"`
      return
    }
  }

  validationError.value = ''
}

/** 提取公式中引用的字段名 */
function extractFieldRefs(expr) {
  // 匹配非函数名、非数字的标识符
  const refs = new Set()
  const tokenPattern = new RegExp('[a-zA-Z_][a-zA-Z0-9_]*', 'g')
  const tokens = expr.match(tokenPattern) || []
  const funcNames = new Set(builtInFunctions.map(f => f.name.toUpperCase()))
  for (const t of tokens) {
    if (!funcNames.has(t.toUpperCase()) && !new RegExp('^\\d+$').test(t)) {
      refs.add(t)
    }
  }
  return [...refs]
}

// ==================== 语法高亮 ====================
const highlightedText = computed(() => {
  let text = expression.value
  if (!text) return ''

  // 转义HTML
  text = escapeHtml(text)

  // 数字高亮（放在前面，避免被其他规则干扰）
  text = text.replace(new RegExp('\\b(\\d+\\.?\\d*)\\b', 'g'), '<span class="fe-hl-num">$1</span>')

  // 函数名高亮（紫色）
  text = text.replace(
    new RegExp('\\b(SUM|AVG|MAX|MIN|COUNT|IF|ROUND|ABS)\\b(?=\\s*\\()', 'gi'),
    '<span class="fe-hl-func">$1</span>'
  )

  // 字段引用高亮（蓝色）— 标识符但不是函数也不是数字
  const funcNames = builtInFunctions.map(f => f.name)
  text = text.replace(
    new RegExp('\\b([a-zA-Z_][a-zA-Z0-9_]*)\\b', 'g'),
    (match) => {
      if (funcNames.some(fn => fn.toLowerCase() === match.toLowerCase())) return match
      if (new RegExp('^\\d+\\.?\\d*$').test(match)) return match
      return `<span class="fe-hl-field">${match}</span>`
    }
  )

  // 运算符高亮
  text = text.replace(new RegExp('([+\\-*/])', 'g'), '<span class="fe-hl-op">$1</span>')
  // 比较运算符
  text = text.replace(new RegExp('(>=|<=|!=|<>|>|<|=)', 'g'), '<span class="fe-hl-op">$1</span>')

  return text
})

function escapeHtml(str) {
  return str.replace(new RegExp('&', 'g'), '&amp;').replace(new RegExp('<', 'g'), '&lt;').replace(new RegExp('>', 'g'), '&gt;')
}

// ==================== 公式预览/Mock计算 ====================
function computePreview(expr) {
  const e = expr.trim()
  if (!e) { previewResult.value = null; return }

  try {
    // 构建安全的计算环境
    const mockData = buildMockData()
    const result = safeEval(e, mockData)
    previewResult.value = result
  } catch (err) {
    previewResult.value = null
  }
}

/** 构建Mock数据用于预览（合并行+列字段） */
function buildMockData() {
  const data = {}
  // 使用传入的 validFieldIds，或合并行+列字段
  let ids = props.validFieldIds
  if (!ids.length) {
    ids = [
      ...fieldList.value.map(f => f.id),
      ...rowFieldList.value.map(f => f.id)
    ]
  }
  for (const id of ids) {
    data[id] = parseFloat((Math.random() * 90000 + 100).toFixed(2))
  }
  return data
}

/**
 * 安全的公式求值（仅支持基本运算和内置函数）
 */
function safeEval(expr, data) {
  // 替换字段名为数值
  let evalExpr = expr

  // 先替换所有字段引用
  const sortedKeys = Object.keys(data).sort((a, b) => b.length - a.length) // 长的先替换
  for (const key of sortedKeys) {
    const re = new RegExp(`\\b${key}\\b`, 'g')
    evalExpr = evalExpr.replace(re, String(data[key]))
  }

  // 替换内置函数为JS等价形式
  evalExpr = evalExpr.replace(new RegExp('\\bSUM\\s*\\(([^)]+)\\)', 'gi'), '($1)')
  evalExpr = evalExpr.replace(new RegExp('\\bAVG\\s*\\(([^)]+)\\)', 'gi'), '(($1)/(($1).split(",").length||1))')
  evalExpr = evalExpr.replace(new RegExp('\\bMAX\\s*\\(([^)]+)\\)', 'gi'), 'Math.max(...(($1).split(",")))')
  evalExpr = evalExpr.replace(new RegExp('\\bMIN\\s*\\(([^)]+)\\)', 'gi'), 'Math.min(...(($1).split(",")))')
  evalExpr = evalExpr.replace(new RegExp('\\bABS\\s*\\(([^)]+)\\)', 'gi'), 'Math.abs($1)')
  evalExpr = evalExpr.replace(new RegExp('\\bROUND\\s*\\(([^,)]+),?\\s*([^)]*)\\)', 'gi'), 'Math.round($1*10**($2||0))/10**($2||0)')
  evalExpr = evalExpr.replace(new RegExp('\\bIF\\s*\\(([^,]+),([^,]+),([^)]+)\\)', 'gi'), '(($1)?($2):($3))')
  evalExpr = evalExpr.replace(new RegExp('\\bCOUNT\\s*\\(([^)]+)\\)', 'gi'), '(($1).split(",").filter(Boolean).length)')

  // 安全检查：只允许数字、运算符、括号、逗号、Math.
  const safePattern = new RegExp('[^0-9+\\-*/().,\\s]')
  if (safePattern.test(evalExpr.replace(new RegExp('Math\\.\\w+', 'g'), ''))) {
    throw new Error('包含无法计算的元素')
  }

  // 使用 Function 构造器安全执行
  try {
    const fn = new Function('return (' + evalExpr + ')')
    const result = fn()
    return typeof result === 'number' ? result : NaN
  } catch {
    return NaN
  }
}

function formatPreview(val) {
  if (isNaN(val)) return '无法计算'
  if (Number.isInteger(val)) return val.toLocaleString()
  return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ==================== 交互方法 ====================
function onInput() {
  validate(expression.value)
  computePreview(expression.value)
  syncScroll()
}

function onBlur() {
  setTimeout(() => { isFocused.value = false }, 150)
}

function onKeydown(e) {
  // Tab 键不切换焦点
  if (e.key === 'Tab') {
    e.preventDefault()
    insertAtCursor('\t')
  }
  // Enter 不提交（除非 Ctrl+Enter）
  if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
    e.preventDefault()
  }
  // Escape 关闭
  if (e.key === 'Escape') {
    emit('close')
  }
  // Ctrl+Enter 应用
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    applyFormula()
  }
}

/** 在光标位置插入文本 */
function insertAtCursor(text) {
  const textarea = inputRef.value
  if (!textarea) return
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const before = expression.value.substring(0, start)
  const after = expression.value.substring(end)
  expression.value = before + text + after

  nextTick(() => {
    textarea.focus()
    const newPos = start + text.length
    textarea.setSelectionRange(newPos, newPos)
    onInput()
  })
}

/** 插入字段 */
function insertField(fieldId) {
  insertAtCursor(fieldId)
}

/** 插入函数模板 */
function insertFunction(func) {
  let tpl = func.template
  // 将占位符替换为可选中编辑的状态
  tpl = tpl.replace(new RegExp('\\$\\{fields\\}', 'g'), '${field}')
  tpl = tpl.replace(new RegExp('\\$\\{cond\\}', 'g'), '${condition}')
  tpl = tpl.replace(new RegExp('\\$\\{val\\}', 'g'), '${value}')
  tpl = tpl.replace(new RegExp('\\$\\{trueVal\\}', 'g'), '${valueIfTrue}')
  tpl = tpl.replace(new RegExp('\\$\\{falseVal\\}', 'g'), '${valueIfFalse}')
  tpl = tpl.replace(new RegExp('\\$\\{digits\\}', 'g'), '2')
  insertAtCursor(tpl)
}

function clearInput() {
  expression.value = ''
  validationError.value = ''
  previewResult.value = null
  inputRef.value?.focus()
}

function applyFormula() {
  if (hasError.value || !expression.value.trim()) return

  // 提取依赖字段
  const deps = extractFieldRefs(expression.value)

  // 构建结构化公式对象（后端传输格式）
  const formulaData = {
    expression: '=' + expression.value.trim(),
    rawExpression: expression.value.trim(),
    fieldName: formulaName.value.trim() || `formula_${Date.now().toString(36)}`,
    label: formulaLabel.value.trim(),
    resultType: resultType.value,
    dependencies: deps,
    createdAt: new Date().toISOString()
  }

  emit('apply', formulaData)
  
  // ✅ 异步保存公式到后端
  if (props.templateId) {
    saveFormulaToBackend(formulaData)
  }
  
  emit('close')
}

/**
 * ✅ 保存公式到后端 API
 */
async function saveFormulaToBackend(formulaData) {
  try {
    const { createFormula } = await import('@/api/reportDesigner.js')
    
    const payload = {
      templateId: props.templateId,
      fieldName: formulaData.fieldName,
      label: formulaData.label,
      expression: formulaData.expression,
      resultType: formulaData.resultType,
      status: 'enabled'
    }
    
    const result = await createFormula(payload)
    console.log('[FormulaEditor] ✅ 公式已保存到后端:', result)
    emit('saved', { ...formulaData, backendId: result?.id })
  } catch (err) {
    console.warn('[FormulaEditor] ⚠️ 后端保存失败（本地仍可用）:', err.message)
    // 不阻塞用户操作，公式在本地仍然有效
  }
}

/** 同步滚动（高亮层跟随输入框滚动） */
function syncScroll() {
  nextTick(() => {
    if (inputRef.value && highlightRef.value) {
      highlightRef.value.scrollTop = inputRef.value.scrollTop
      highlightRef.value.scrollLeft = inputRef.value.scrollLeft
    }
  })
}

// ==================== 生命周期 ====================
watch(() => props.initialValue, (val) => {
  expression.value = (val || '').replace(new RegExp('^=', ''), '')
  validate(expression.value)
  computePreview(expression.value)
}, { immediate: true })

// 自动聚焦
import { onMounted } from 'vue'
onMounted(() => {
  nextTick(() => inputRef.value?.focus())
})
</script>

<style lang="scss" scoped>
.formula-editor {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(860px, 92vw);
  max-height: 85vh;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,.22), 0 8px 24px rgba(0,0,0,.10);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: fe-fade-in .25s ease-out;
}

@keyframes fe-fade-in {
  from { opacity: 0; transform: translate(-50%, -48%); }
  to   { opacity: 1; transform: translate(-50%, -50%); }
}

/* ====== 头部 ====== */
.fe-header {
  display: flex;
  align-items: center;
  padding: 12px 18px;
  border-bottom: 1px solid #E5E7EB;
  background: #F9FAFB;
  gap: 10px;
}
.fe-title {
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
}
.fe-cell-info {
  font-size: 12px;
  color: #6B7280;
  background: #F3F4F6;
  padding: 2px 8px;
  border-radius: 4px;
}
.fe-close {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 20px;
  color: #9CA3AF;
  cursor: pointer;
  line-height: 1;
  padding: 4px 8px;
  border-radius: 6px;
  &:hover { background: #E5E7EB; color: #374151; }
}

/* ====== 公式元信息栏 ====== */
.fe-meta-bar {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 18px;
  border-bottom: 1px solid #E5E7EB;
  background: #F9FAFB;
}
.fe-meta-item {
  display: flex; flex-direction: column; gap: 3px;
  label {
    font-size: 10px; font-weight: 600; color: #6B7280;
    text-transform: uppercase; letter-spacing: .04em;
  }
}
.fe-meta-input {
  height: 28px; padding: 0 8px;
  border: 1px solid #D1D5DB; border-radius: 6px;
  font-size: 12px; color: #374151; background: #fff;
  outline: none; transition: border-color .15s;
  min-width: 120px;
  &:focus { border-color: #3B82F6; box-shadow: 0 0 0 2px rgba(59,130,246,.12); }
  &::placeholder { color: #9CA3AF; }
}
.fe-meta-select {
  height: 28px; padding: 0 6px;
  border: 1px solid #D1D5DB; border-radius: 6px;
  font-size: 12px; color: #374151; background: #fff;
  outline: none; cursor: pointer; min-width: 80px;
  &:focus { border-color: #3B82F6; }
}
.fe-meta-type { min-width: 80px; }

/* ====== 主体布局 ====== */
.fe-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ====== 左侧：字段面板 ====== */
.fe-field-panel {
  width: 180px;
  border-right: 1px solid #E5E7EB;
  padding: 8px;
  overflow-y: auto;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fe-field-section {
  &:first-child h4 { margin-top: 0; }
  h4 {
    font-size: 11px;
    font-weight: 600;
    color: #6B7280;
    text-transform: uppercase;
    letter-spacing: .05em;
    margin: 10px 0 6px;
    padding-bottom: 5px;
    border-bottom: 1px solid #F3F4F6;
  }
}
.fe-field-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.fe-field-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background .15s;
  font-size: 12px;
  &:hover { background: #EFF6FF; }
  .fe-field-icon {
    font-size: 10px;
    width: 18px;
    text-align: center;
    color: #3B82F6;
    font-weight: 700;
  }
  .fe-field-label {
    color: #374151;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
.fe-empty-fields {
  font-size: 12px;
  color: #9CA3AF;
  text-align: center;
  padding: 20px 0;
}

/* 行/列字段区分样式 */
.fe-field-row {
  .fe-field-icon { color: #059669; background: #ECFDF5; border-radius: 3px; }
  &:hover { background: #ECFDF5; }
}
.fe-field-col {
  .fe-field-icon { color: #2563EB; background: #EFF6FF; border-radius: 3px; }
  &:hover { background: #EFF6FF; }
}

/* ====== 中间：编辑区 ====== */
.fe-editor-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 14px 18px;
  gap: 8px;
  min-width: 0;
}

.fe-input-wrapper {
  position: relative;
  border: 2px solid #D1D5DB;
  border-radius: 10px;
  background: #fff;
  overflow: hidden;
  transition: border-color .2s, box-shadow .2s;

  &.fe-focus {
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59,130,246,.12);
  }
  &.fe-error {
    border-color: #EF4444;
    box-shadow: 0 0 0 3px rgba(239,68,68,.1);
  }
}

.fe-prefix {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
  font-size: 15px;
  font-weight: 700;
  color: #059669;
  z-index: 2;
  pointer-events: none;
}

.fe-highlight-layer {
  position: absolute;
  top: 0; left: 44px; right: 0; bottom: 0;
  padding: 10px 12px;
  font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: transparent;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-y: auto;
  overflow-x: hidden;
  pointer-events: none;
  z-index: 1;
}

.fe-input {
  position: relative;
  z-index: 2;
  display: block;
  width: 100%;
  min-height: 64px;
  max-height: 140px;
  padding: 10px 12px 10px 38px;
  border: none;
  outline: none;
  resize: vertical;
  font-family: 'SF Mono', 'Cascadia Code', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #1F2937; /* 文字透明，显示底层高亮层 */
  caret-color: #3B82F6; /* 光标可见 */
  background: transparent;
  &::selection { background: rgba(59,130,246,.25); }
}

/* 高亮颜色 */
.fe-hl-field { color: #2563EB; font-weight: 500; }     /* 字段 - 蓝 */
.fe-hl-func  { color: #7C3AED; font-weight: 600; }       /* 函数 - 紫 */
.fe-hl-num   { color: #059669; }                          /* 数字 - 绿 */
.fe-hl-op    { color: #D97706; font-weight: 500; }        /* 运算符 - 橙 */

/* 错误提示 */
.fe-error-msg {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 8px;
  font-size: 12px;
  color: #DC2626;
  animation: fe-shake .35s ease;
}
@keyframes fe-shake {
  0%,100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

/* 预览结果 */
.fe-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #F0FDF4;
  border: 1px solid #BBF7D0;
  border-radius: 8px;
  font-size: 13px;
}
.fe-preview-label {
  color: #166534;
  font-weight: 500;
}
.fe-preview-value {
  color: #15803D;
  font-weight: 700;
  font-family: 'SF Mono', monospace;
  font-size: 15px;
  margin-left: auto;
  &.fe-preview-err { color: #DC2626; }
}

/* 操作按钮 */
.fe-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 4px;
}
.fe-btn {
  padding: 7px 16px;
  border-radius: 8px;
  border: 1px solid #D1D5DB;
  background: #fff;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all .15s;
  &:hover:not(:disabled) { background: #F3F4F6; border-color: #9CA3AF; }
  &:disabled { opacity: .45; cursor: not-allowed; }
  &-primary {
    background: #2563EB;
    border-color: #2563EB;
    color: #fff;
    &:hover:not(:disabled) { background: #1D4ED8; border-color: #1D4ED8; }
  }
  &-link {
    border: none;
    background: none;
    color: #6B7280;
    &:hover { color: #374151; background: transparent; }
  }
}

/* ====== 右侧：函数面板 ====== */
.fe-func-panel {
  width: 170px;
  border-left: 1px solid #E5E7EB;
  padding: 10px;
  overflow-y: auto;
  flex-shrink: 0;
  h4 {
    font-size: 11px;
    font-weight: 600;
    color: #6B7280;
    text-transform: uppercase;
    letter-spacing: .05em;
    margin: 0 0 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid #F3F4F6;
  }
}
.fe-func-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.fe-func-item {
  padding: 7px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background .15s;
  &:hover { background: #FAF5FF; }
  .fe-func-name {
    display: block;
    font-size: 13px;
    font-weight: 700;
    color: #7C3AED;
    font-family: 'SF Mono', monospace;
  }
  .fe-func-desc {
    display: block;
    font-size: 11px;
    color: #9CA3AF;
    margin-top: 1px;
  }
}

/* 动画 */
.fe-slide-enter-active, .fe-slide-leave-active {
  transition: all .2s ease;
}
.fe-slide-enter-from, .fe-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
