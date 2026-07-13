<template>
  <div v-if="visible" class="function-wizard-overlay" @click.self="handleCancel">
    <div class="fwizard-dialog">
      <!-- Header -->
      <div class="fwizard-header">
        <div class="fwizard-title">
          <span class="fwizard-fx">fx</span>
          <span>函数向导</span>
        </div>
        <button class="fwizard-close" @click="handleCancel">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- Body -->
      <div class="fwizard-body">
        <!-- Left: Function Categories -->
        <div class="fwizard-categories">
          <div class="fwizard-search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" v-model="searchQuery" placeholder="搜索函数..." />
          </div>
          <div class="fwizard-cat-list">
            <div
              v-for="cat in categories"
              :key="cat.key"
              class="fwizard-cat-item"
              :class="{ active: activeCategory === cat.key }"
              @click="activeCategory = cat.key"
            >
              <span class="fwizard-cat-icon">{{ cat.icon }}</span>
              <span>{{ cat.label }}</span>
              <span class="fwizard-cat-count">{{ cat.count }}</span>
            </div>
          </div>
        </div>

        <!-- Center: Function List -->
        <div class="fwizard-functions">
          <div class="fwizard-list-header">
            <span>函数</span>
            <span class="fwizard-list-count">{{ filteredFunctions.length }} 个</span>
          </div>
          <div class="fwizard-list">
            <div
              v-for="func in filteredFunctions"
              :key="func.name"
              class="fwizard-func-item"
              :class="{ active: selectedFunc?.name === func.name }"
              @click="selectFunction(func)"
            >
              <span class="fwizard-func-name">{{ func.name }}</span>
              <span class="fwizard-func-cat">{{ func.category }}</span>
            </div>
          </div>
        </div>

        <!-- Right: Function Detail & Parameter Editor -->
        <div class="fwizard-detail">
          <template v-if="selectedFunc">
            <div class="fwizard-detail-header">
              <span class="fwizard-detail-name">{{ selectedFunc.name }}</span>
              <span class="fwizard-detail-cat">{{ selectedFunc.category }}</span>
            </div>

            <div class="fwizard-syntax">
              <span class="fwizard-syntax-label">语法</span>
              <code class="fwizard-syntax-code">{{ selectedFunc.name }}({{ selectedFunc.params?.map(p => p.name).join(', ') || '' }})</code>
            </div>

            <div class="fwizard-desc">{{ selectedFunc.description }}</div>

            <!-- Parameter Editor -->
            <div class="fwizard-params">
              <div class="fwizard-params-header">参数</div>
              <div
                v-for="(param, idx) in selectedFunc.params"
                :key="idx"
                class="fwizard-param-row"
              >
                <div class="fwizard-param-info">
                  <span class="fwizard-param-name">{{ param.name }}</span>
                  <span class="fwizard-param-required" v-if="param.required">必填</span>
                  <span class="fwizard-param-optional" v-else>可选</span>
                </div>
                <div class="fwizard-param-input-wrap">
                  <input
                    class="fwizard-param-input"
                    v-model="paramValues[idx]"
                    :placeholder="param.description"
                  />
                  <div class="fwizard-param-actions">
                    <button class="fwizard-param-btn" title="选择单元格" @click="startRefMode(idx)">
                      <span>📍</span>
                    </button>
                    <button class="fwizard-param-btn" title="绑定字段" @click="showFieldPicker(idx)">
                      <span>🔗</span>
                    </button>
                    <button class="fwizard-param-btn" title="嵌套函数" @click="nestFunction(idx)">
                      <span>ƒ</span>
                    </button>
                    <button class="fwizard-param-btn" title="AI生成参数" @click="aiGenerateParam(idx)">
                      <span>🧠</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Example & Result -->
            <div class="fwizard-example" v-if="selectedFunc.example">
              <div class="fwizard-example-label">示例</div>
              <code class="fwizard-example-code">{{ selectedFunc.example }}</code>
            </div>

            <div class="fwizard-result" v-if="computedResult">
              <div class="fwizard-result-label">计算结果</div>
              <span class="fwizard-result-value">{{ computedResult }}</span>
            </div>
          </template>
          <div v-else class="fwizard-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            <p>选择函数以查看详情</p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="fwizard-footer">
        <div class="fwizard-formula-preview" v-if="selectedFunc">
          <span class="fwizard-preview-label">公式预览：</span>
          <code class="fwizard-preview-code">{{ previewFormula }}</code>
        </div>
        <div class="fwizard-actions">
          <button class="fwizard-btn" @click="handleCancel">取消</button>
          <button class="fwizard-btn primary" @click="handleInsert" :disabled="!selectedFunc">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  visible: Boolean,
  formula: String
})

const emit = defineEmits(['update:visible', 'insert', 'cancel'])

const searchQuery = ref('')
const activeCategory = ref('all')
const selectedFunc = ref(null)
const paramValues = ref([])

const categories = ref([
  { key: 'all', label: '全部', icon: '⋮', count: 48 },
  { key: 'recent', label: '最近使用', icon: '⏰', count: 5 },
  { key: 'math', label: '数学', icon: '🧮', count: 12 },
  { key: 'stat', label: '统计', icon: '📊', count: 10 },
  { key: 'logic', label: '逻辑', icon: '🔀', count: 6 },
  { key: 'date', label: '日期', icon: '📅', count: 8 },
  { key: 'text', label: '文本', icon: '📝', count: 9 },
  { key: 'lookup', label: '查找', icon: '🔍', count: 6 },
  { key: 'financial', label: '财务', icon: '💰', count: 4 },
  { key: 'array', label: '数组', icon: '📑', count: 5 },
  { key: 'report', label: '报表函数', icon: '📈', count: 8 },
  { key: 'param', label: '参数函数', icon: '⚙️', count: 3 },
  { key: 'system', label: '系统函数', icon: '🔧', count: 4 },
  { key: 'ai', label: 'AI函数', icon: '🤖', count: 2 }
])

const functions = ref([
  { name: 'SUM', category: '数学', description: '计算所有参数数值的和', params: [{ name: 'number1', required: true, description: '要计算的第一个数值' }, { name: 'number2', required: false, description: '要计算的第二个数值' }], example: 'SUM(A1:A10)' },
  { name: 'AVERAGE', category: '统计', description: '返回所有参数的平均值', params: [{ name: 'number1', required: true, description: '要计算的第一个数值' }, { name: 'number2', required: false, description: '要计算的第二个数值' }], example: 'AVERAGE(A1:A10)' },
  { name: 'COUNT', category: '统计', description: '计算包含数字的单元格数量', params: [{ name: 'value1', required: true, description: '要计算的第一个项' }], example: 'COUNT(A1:A10)' },
  { name: 'ROUND', category: '数学', description: '将数字四舍五入到指定小数位', params: [{ name: 'number', required: true, description: '要四舍五入的数字' }, { name: 'num_digits', required: true, description: '小数位数' }], example: 'ROUND(3.14159, 2)' },
  { name: 'TEXT', category: '文本', description: '将数值转换为指定格式的文本', params: [{ name: 'value', required: true, description: '要转换的数值' }, { name: 'format', required: true, description: '格式文本' }], example: 'TEXT(1234, "#,##0")' },
  { name: 'TODAY', category: '日期', description: '返回当前日期', params: [], example: 'TODAY()' },
  { name: 'VLOOKUP', category: '查找', description: '垂直查找', params: [{ name: 'lookup_value', required: true, description: '查找值' }, { name: 'table_array', required: true, description: '查找范围' }, { name: 'col_index', required: true, description: '返回列号' }, { name: 'range_lookup', required: false, description: '模糊匹配' }], example: 'VLOOKUP(A1, B1:D10, 2, FALSE)' },
  { name: 'INDEX', category: '查找', description: '返回表格或区域中的值', params: [{ name: 'array', required: true, description: '单元格区域' }, { name: 'row_num', required: true, description: '行号' }, { name: 'column_num', required: false, description: '列号' }], example: 'INDEX(A1:C10, 2, 3)' },
  { name: 'MATCH', category: '查找', description: '在单元格区域中搜索指定项', params: [{ name: 'lookup_value', required: true, description: '查找值' }, { name: 'lookup_array', required: true, description: '查找范围' }, { name: 'match_type', required: false, description: '匹配类型' }], example: 'MATCH(A1, B1:B10, 0)' },
  { name: 'IF', category: '逻辑', description: '条件判断', params: [{ name: 'logical_test', required: true, description: '逻辑条件' }, { name: 'value_if_true', required: true, description: '条件为真返回值' }, { name: 'value_if_false', required: false, description: '条件为假返回值' }], example: 'IF(A1>100, "高", "低")' },
  { name: 'SUMIF', category: '统计', description: '条件求和', params: [{ name: 'range', required: true, description: '判断范围' }, { name: 'criteria', required: true, description: '条件' }, { name: 'sum_range', required: false, description: '求和范围' }], example: 'SUMIF(A1:A10, ">0", B1:B10)' },
  { name: '同比', category: '报表函数', description: '计算同比增长率', params: [{ name: '指标', required: true, description: '要计算的指标字段' }, { name: '周期', required: false, description: '时间周期' }], example: '同比([销售金额])' },
  { name: '环比', category: '报表函数', description: '计算环比增长率', params: [{ name: '指标', required: true, description: '要计算的指标字段' }, { name: '周期', required: false, description: '时间周期' }], example: '环比([销售金额])' },
  { name: '累计', category: '报表函数', description: '计算累计值', params: [{ name: '指标', required: true, description: '要累计的指标' }], example: '累计([销售金额])' },
  { name: '上一期', category: '报表函数', description: '获取上一期数据', params: [{ name: '指标', required: true, description: '指标字段' }], example: '上一期([销售金额])' },
  { name: '预算', category: '报表函数', description: '获取预算值', params: [{ name: '指标', required: true, description: '预算指标' }], example: '预算([销售金额])' },
  { name: 'CurrentUser', category: '系统函数', description: '返回当前用户', params: [], example: 'CurrentUser()' },
  { name: 'CurrentDept', category: '系统函数', description: '返回当前部门', params: [], example: 'CurrentDept()' },
  { name: 'Parameter', category: '参数函数', description: '获取参数值', params: [{ name: 'paramName', required: true, description: '参数名称' }], example: 'Parameter("开始日期")' },
])

const filteredFunctions = computed(() => {
  let result = functions.value
  if (activeCategory.value !== 'all') {
    if (activeCategory.value === 'recent') {
      result = result.filter(f => ['SUM', 'AVERAGE', 'IF', 'VLOOKUP', '同比'].includes(f.name))
    } else if (activeCategory.value === 'report') {
      result = result.filter(f => ['同比', '环比', '累计', '上一期', '预算'].includes(f.name))
    } else if (activeCategory.value === 'system') {
      result = result.filter(f => ['CurrentUser', 'CurrentDept'].includes(f.name))
    } else if (activeCategory.value === 'param') {
      result = result.filter(f => f.name === 'Parameter')
    } else {
      result = result.filter(f => f.category === categories.value.find(c => c.key === activeCategory.value)?.label)
    }
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(f => f.name.toLowerCase().includes(q) || f.description.includes(q))
  }
  return result
})

const previewFormula = computed(() => {
  if (!selectedFunc.value) return ''
  const args = paramValues.value.filter(v => v !== undefined && v !== '').join(', ')
  return `${selectedFunc.value.name}(${args})`
})

const computedResult = computed(() => {
  if (!selectedFunc.value || selectedFunc.value.name !== 'SUM') return ''
  return '70,666,630'
})

function selectFunction(func) {
  selectedFunc.value = func
  paramValues.value = func.params?.map(() => '') || []
}

function handleInsert() {
  if (!selectedFunc.value) return
  emit('insert', previewFormula.value)
  emit('update:visible', false)
}

function handleCancel() {
  emit('update:visible', false)
  emit('cancel')
}

function startRefMode(idx) {}
function showFieldPicker(idx) {}
function nestFunction(idx) {}
function aiGenerateParam(idx) {}

watch(() => props.visible, (val) => {
  if (!val) {
    selectedFunc.value = null
    paramValues.value = []
    searchQuery.value = ''
  }
})
</script>

<style scoped>
.function-wizard-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.fwizard-dialog {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  width: 1100px;
  max-width: 95vw;
  height: 760px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Header */
.fwizard-header {
  height: 48px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #E5E7EB;
  flex-shrink: 0;
}

.fwizard-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1E293B;
}

.fwizard-fx {
  font-size: 14px;
  font-weight: 700;
  font-style: italic;
  color: #2563EB;
  background: #EFF6FF;
  padding: 2px 6px;
  border-radius: 4px;
}

.fwizard-close {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6B7280;
  transition: all 0.15s;
}
.fwizard-close:hover { background: #F3F4F6; color: #1E293B; }

/* Body */
.fwizard-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Categories */
.fwizard-categories {
  width: 220px;
  min-width: 220px;
  border-right: 1px solid #E5E7EB;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #F8FAFC;
}

.fwizard-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid #E5E7EB;
}
.fwizard-search svg { color: #9CA3AF; flex-shrink: 0; }
.fwizard-search input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 12px;
  color: #1E293B;
}
.fwizard-search input::placeholder { color: #9CA3AF; }

.fwizard-cat-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
}

.fwizard-cat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  color: #4B5563;
  transition: all 0.15s;
}
.fwizard-cat-item:hover { background: #F3F4F6; }
.fwizard-cat-item.active { background: #EFF6FF; color: #2563EB; font-weight: 500; }

.fwizard-cat-icon { font-size: 13px; width: 18px; text-align: center; }
.fwizard-cat-count { margin-left: auto; font-size: 11px; color: #9CA3AF; }
.fwizard-cat-item.active .fwizard-cat-count { color: #2563EB; }

/* Function List */
.fwizard-functions {
  width: 240px;
  min-width: 240px;
  border-right: 1px solid #E5E7EB;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
}

.fwizard-list-header {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid #E5E7EB;
  font-size: 12px;
  font-weight: 600;
  color: #6B7280;
}
.fwizard-list-count { font-size: 11px; font-weight: 400; color: #9CA3AF; }

.fwizard-list {
  flex: 1;
  overflow-y: auto;
}

.fwizard-func-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.15s;
  border-left: 3px solid transparent;
}
.fwizard-func-item:hover { background: #F9FAFB; }
.fwizard-func-item.active { background: #EFF6FF; border-left-color: #2563EB; }

.fwizard-func-name { font-weight: 500; color: #1E293B; font-family: 'Roboto Mono', monospace; }
.fwizard-func-item.active .fwizard-func-name { color: #2563EB; }
.fwizard-func-cat { font-size: 11px; color: #9CA3AF; }

/* Detail Panel */
.fwizard-detail {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #F8FAFC;
}

.fwizard-detail-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.fwizard-detail-name {
  font-size: 18px;
  font-weight: 700;
  font-family: 'Roboto Mono', monospace;
  color: #1E293B;
}

.fwizard-detail-cat {
  font-size: 11px;
  color: #2563EB;
  background: #EFF6FF;
  padding: 2px 8px;
  border-radius: 4px;
}

.fwizard-syntax {
  background: #1E293B;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
}

.fwizard-syntax-label {
  font-size: 11px;
  color: #9CA3AF;
  margin-bottom: 4px;
  display: block;
}

.fwizard-syntax-code {
  font-family: 'Roboto Mono', monospace;
  font-size: 14px;
  color: #E2E8F0;
}

.fwizard-desc {
  font-size: 13px;
  color: #4B5563;
  line-height: 1.6;
  margin-bottom: 16px;
}

/* Params */
.fwizard-params {
  background: #fff;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
}

.fwizard-params-header {
  font-size: 12px;
  font-weight: 600;
  color: #6B7280;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.fwizard-param-row {
  margin-bottom: 10px;
}

.fwizard-param-info {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.fwizard-param-name {
  font-size: 12px;
  font-weight: 600;
  color: #1E293B;
}

.fwizard-param-required {
  font-size: 10px;
  color: #DC2626;
  background: #FEF2F2;
  padding: 1px 4px;
  border-radius: 3px;
}

.fwizard-param-optional {
  font-size: 10px;
  color: #6B7280;
  background: #F3F4F6;
  padding: 1px 4px;
  border-radius: 3px;
}

.fwizard-param-input-wrap {
  display: flex;
  gap: 6px;
}

.fwizard-param-input {
  flex: 1;
  height: 32px;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  padding: 0 10px;
  font-size: 13px;
  font-family: 'Roboto Mono', monospace;
  color: #1E293B;
  outline: none;
  transition: border-color 0.15s;
}
.fwizard-param-input:focus { border-color: #2563EB; }

.fwizard-param-actions {
  display: flex;
  gap: 2px;
}

.fwizard-param-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.15s;
  padding: 0;
}
.fwizard-param-btn:hover { background: #F3F4F6; border-color: #D1D5DB; }

/* Example */
.fwizard-example {
  background: #fff;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.fwizard-example-label {
  font-size: 11px;
  font-weight: 600;
  color: #6B7280;
  margin-bottom: 4px;
}

.fwizard-example-code {
  font-family: 'Roboto Mono', monospace;
  font-size: 12px;
  color: #2563EB;
  background: #EFF6FF;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

/* Result */
.fwizard-result {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #F0FDF4;
  border: 1px solid #BBF7D0;
  border-radius: 8px;
}

.fwizard-result-label {
  font-size: 11px;
  color: #166534;
  font-weight: 500;
}

.fwizard-result-value {
  font-size: 16px;
  font-weight: 700;
  color: #166534;
  font-family: 'Roboto Mono', monospace;
}

/* Empty state */
.fwizard-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  color: #9CA3AF;
  font-size: 14px;
}

/* Footer */
.fwizard-footer {
  height: 56px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid #E5E7EB;
  background: #F8FAFC;
  flex-shrink: 0;
}

.fwizard-formula-preview {
  display: flex;
  align-items: center;
  gap: 6px;
}

.fwizard-preview-label { font-size: 12px; color: #6B7280; }
.fwizard-preview-code {
  font-family: 'Roboto Mono', monospace;
  font-size: 13px;
  color: #2563EB;
  background: #EFF6FF;
  padding: 4px 10px;
  border-radius: 4px;
}

.fwizard-actions {
  display: flex;
  gap: 8px;
}

.fwizard-btn {
  padding: 0 16px;
  height: 32px;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  color: #4B5563;
  cursor: pointer;
  transition: all 0.15s;
}
.fwizard-btn:hover { background: #F3F4F6; }
.fwizard-btn.primary {
  background: #2563EB;
  color: #fff;
  border-color: #2563EB;
}
.fwizard-btn.primary:hover { background: #1D4ED8; }
.fwizard-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
