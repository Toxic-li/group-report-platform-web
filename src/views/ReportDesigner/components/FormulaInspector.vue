<template>
  <aside class="formula-inspector">
    <!-- Tabs -->
    <div class="fi-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="fi-tab"
        :class="{ active: activeTab === tab.key, error: tab.key === 'error' && errorCount > 0 }"
        @click="activeTab = tab.key"
      >
        <svg v-if="tab.key === 'error' && errorCount > 0" width="8" height="8" viewBox="0 0 8 8" fill="#EF4444"><circle cx="4" cy="4" r="4"/></svg>
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <div class="fi-body">
      <!-- 属性 Tab -->
      <div v-if="activeTab === 'property'" class="fi-content">
        <!-- 单元格信息 -->
        <div class="fi-section">
          <div class="fi-section-title">单元格信息</div>
          <div class="fi-info-grid">
            <div class="fi-info-item">
              <span class="fi-info-label">引用位置</span>
              <span class="fi-info-value ref">{{ cellInfo.ref }}</span>
            </div>
            <div class="fi-info-item">
              <span class="fi-info-label">类型</span>
              <span class="fi-info-value">
                <span class="fi-badge" :class="cellInfo.type">
                  {{ typeLabel }}
                </span>
              </span>
            </div>
            <div class="fi-info-item">
              <span class="fi-info-label">绑定字段</span>
              <span class="fi-info-value field" v-if="cellInfo.boundField">{{ cellInfo.boundField }}</span>
              <span class="fi-info-value empty" v-else>--</span>
            </div>
            <div class="fi-info-item">
              <span class="fi-info-label">数据类型</span>
              <span class="fi-info-value">{{ cellInfo.dataType || '--' }}</span>
            </div>
            <div class="fi-info-item" v-if="cellInfo.type === 'formula'">
              <span class="fi-info-label">自动计算</span>
              <span class="fi-info-value" :class="{ on: cellInfo.autoCalc, off: !cellInfo.autoCalc }">
                {{ cellInfo.autoCalc ? '开启' : '关闭' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 格式设置 -->
        <div class="fi-section">
          <div class="fi-section-title">格式设置</div>
          <div class="fi-format-grid">
            <div class="fi-format-item">
              <label>数字格式</label>
              <select v-model="cellFormat.number">
                <option value="general">常规</option>
                <option value="number">数值</option>
                <option value="currency">货币</option>
                <option value="percent">百分比</option>
                <option value="date">日期</option>
                <option value="text">文本</option>
              </select>
            </div>
            <div class="fi-format-item">
              <label>小数位数</label>
              <select v-model="cellFormat.decimals">
                <option :value="0">0</option>
                <option :value="1">1</option>
                <option :value="2">2</option>
                <option :value="3">3</option>
                <option :value="4">4</option>
              </select>
            </div>
            <div class="fi-format-item">
              <label>千分位</label>
              <label class="fi-toggle">
                <input type="checkbox" v-model="cellFormat.thousands" />
                <span class="fi-toggle-slider"></span>
              </label>
            </div>
            <div class="fi-format-item">
              <label>货币符号</label>
              <select v-model="cellFormat.currency">
                <option value="¥">¥ 人民币</option>
                <option value="$">$ 美元</option>
                <option value="€">€ 欧元</option>
                <option value="none">无</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 条件格式 -->
        <div class="fi-section">
          <div class="fi-section-header">
            <span class="fi-section-title">条件格式</span>
            <button class="fi-add-btn" @click="addCondition">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
            </button>
          </div>
          <div class="fi-condition-list" v-if="conditions.length">
            <div v-for="(cond, i) in conditions" :key="i" class="fi-condition-item">
              <div class="fi-condition-rule">
                <span class="fi-condition-op">{{ cond.op }}</span>
                <span class="fi-condition-value">{{ cond.value }}</span>
              </div>
              <div class="fi-condition-color" :style="{ background: cond.color }"></div>
              <button class="fi-remove-btn" @click="removeCondition(i)">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
          <div v-else class="fi-empty">暂无条件格式</div>
        </div>
      </div>

      <!-- 公式 Tab -->
      <div v-if="activeTab === 'formula'" class="fi-content">
        <!-- 公式详情 -->
        <div class="fi-section">
          <div class="fi-section-title">公式详情</div>
          <div class="fi-formula-box">
            <code>{{ formulaInfo.syntax }}</code>
          </div>
        </div>

        <!-- 语法分析 -->
        <div class="fi-section">
          <div class="fi-section-title">语法分析</div>
          <div class="fi-syntax-status" :class="formulaInfo.syntax">
            <svg v-if="formulaInfo.syntax === 'valid'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#52C41A" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            <span>{{ formulaInfo.syntax === 'valid' ? '语法正确' : '语法错误' }}</span>
          </div>
          <div class="fi-syntax-detail" v-if="formulaInfo.tree">
            <div v-for="(node, i) in formulaInfo.tree" :key="i" class="fi-tree-node">
              <span class="fi-tree-node-type">{{ node.type }}</span>
              <span class="fi-tree-node-value">{{ node.value }}</span>
            </div>
          </div>
        </div>

        <!-- 引用解析 -->
        <div class="fi-section">
          <div class="fi-section-title">引用单元格</div>
          <div class="fi-ref-list" v-if="formulaInfo.refs && formulaInfo.refs.length">
            <div v-for="ref in formulaInfo.refs" :key="ref" class="fi-ref-item" @click="$emit('navigate-to', ref)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              <span>{{ ref }}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 16 12 12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            </div>
          </div>
          <div v-else class="fi-empty">无引用单元格</div>
        </div>

        <!-- 被引用 -->
        <div class="fi-section">
          <div class="fi-section-title">被这些单元格引用</div>
          <div class="fi-ref-list" v-if="formulaInfo.usedBy && formulaInfo.usedBy.length">
            <div v-for="ref in formulaInfo.usedBy" :key="ref" class="fi-ref-item" @click="$emit('navigate-to', ref)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              <span>{{ ref }}</span>
            </div>
          </div>
          <div v-else class="fi-empty">无依赖方</div>
        </div>
      </div>

      <!-- 依赖 Tab -->
      <div v-if="activeTab === 'deps'" class="fi-content">
        <div class="fi-section-header">
          <span class="fi-section-title">依赖关系图</span>
          <div class="fi-dep-stats">
            <span class="fi-dep-stat" v-for="s in depStats" :key="s.type">
              <span class="fi-dep-dot" :style="{ background: s.color }"></span>
              {{ s.label }} {{ s.count }}
            </span>
          </div>
        </div>

        <!-- 依赖图可视化 -->
        <div class="fi-dep-graph" ref="depGraphRef">
          <svg viewBox="0 0 260 260" class="fi-dep-svg">
            <!-- 连接线 -->
            <line
              v-for="(edge, i) in depEdges"
              :key="'e' + i"
              :x1="edge.x1" :y1="edge.y1"
              :x2="edge.x2" :y2="edge.y2"
              :stroke="edge.color || '#D1D5DB'"
              stroke-width="1.5"
              marker-end="url(#arrowhead)"
            />
            <!-- 箭头定义 -->
            <defs>
              <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <polygon points="0 0, 6 3, 0 6" fill="#D1D5DB" />
              </marker>
            </defs>
            <!-- 节点 -->
            <g v-for="(node, i) in depNodes" :key="'n' + i" class="fi-dep-node">
              <rect
                :x="node.x - 35" :y="node.y - 14"
                width="70" height="28"
                rx="6"
                :fill="node.color || '#EFF6FF'"
                :stroke="node.border || '#BFDBFE'"
                stroke-width="1"
                class="fi-dep-rect"
                @click="$emit('navigate-to', node.ref)"
              />
              <text
                :x="node.x" :y="node.y + 4"
                text-anchor="middle"
                font-size="10"
                font-weight="500"
                fill="#1E293B"
                class="fi-dep-label"
              >{{ node.label }}</text>
            </g>
          </svg>
        </div>

        <!-- 依赖列表 -->
        <div class="fi-section">
          <div class="fi-section-title">依赖详情</div>
          <div class="fi-dep-list">
            <div v-for="dep in dependencies" :key="dep.from + dep.to" class="fi-dep-item">
              <div class="fi-dep-from">
                <span class="fi-dep-dot" style="background: #2563EB"></span>
                <span>{{ dep.from }}</span>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
              <div class="fi-dep-to">
                <span class="fi-dep-dot" style="background: #8B5CF6"></span>
                <span>{{ dep.to }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 错误 Tab -->
      <div v-if="activeTab === 'error'" class="fi-content">
        <div class="fi-section-header">
          <span class="fi-section-title">公式错误</span>
          <span class="fi-error-count" v-if="errors.length">{{ errors.length }} 个错误</span>
          <span class="fi-error-count clean" v-else>无错误</span>
        </div>

        <div v-if="errors.length" class="fi-error-list">
          <div v-for="(err, i) in errors" :key="i" class="fi-error-item" :class="err.severity" @click="$emit('navigate-to', err.ref)">
            <div class="fi-error-header">
              <svg v-if="err.severity === 'error'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span class="fi-error-ref">{{ err.ref }}</span>
              <span class="fi-error-type">{{ err.type }}</span>
            </div>
            <p class="fi-error-msg">{{ err.message }}</p>
            <div class="fi-error-actions">
              <button class="fi-error-btn" @click.stop="fixError(i)">自动修复</button>
              <button class="fi-error-btn" @click.stop="ignoreError(i)">忽略</button>
            </div>
          </div>
        </div>
        <div v-else class="fi-empty success">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#52C41A" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <span>所有公式均无错误</span>
        </div>

        <!-- 性能分析 -->
        <div class="fi-section" style="margin-top: 16px">
          <div class="fi-section-title">性能分析</div>
          <div class="fi-perf-grid">
            <div class="fi-perf-item">
              <span class="fi-perf-label">最慢公式</span>
              <span class="fi-perf-value slow">=SUMIFS(D:D, ...) - 18ms</span>
            </div>
            <div class="fi-perf-item">
              <span class="fi-perf-label">总计算耗时</span>
              <span class="fi-perf-value">42ms</span>
            </div>
            <div class="fi-perf-item">
              <span class="fi-perf-label">公式复杂度</span>
              <div class="fi-complexity-bar">
                <div class="fi-complexity-fill" style="width: 35%"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 帮助 Tab -->
      <div v-if="activeTab === 'help'" class="fi-content">
        <div class="fi-section">
          <div class="fi-section-title">函数帮助</div>
          <div class="fi-search">
            <input v-model="helpSearch" placeholder="搜索函数帮助..." />
          </div>
          <div class="fi-help-list" v-if="filteredHelpFunctions.length">
            <div
              v-for="fn in filteredHelpFunctions"
              :key="fn.name"
              class="fi-help-item"
              @click="toggleHelp(fn.name)"
            >
              <div class="fi-help-header">
                <span class="fi-help-name">={{ fn.name }}()</span>
                <svg class="fi-help-arrow" :class="{ expanded: expandedHelp === fn.name }" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <div v-if="expandedHelp === fn.name" class="fi-help-body">
                <p class="fi-help-desc">{{ fn.desc }}</p>
                <p class="fi-help-syntax">语法: ={{ fn.syntax }}</p>
                <div class="fi-help-example">
                  <span class="fi-help-example-label">示例:</span>
                  <code>{{ fn.example }}</code>
                </div>
                <div class="fi-help-params" v-if="fn.params">
                  <div v-for="p in fn.params" :key="p.name" class="fi-help-param">
                    <span class="fi-param-name">{{ p.name }}</span>
                    <span class="fi-param-type">{{ p.type }}</span>
                    <span class="fi-param-desc">{{ p.desc }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 快捷参考 -->
        <div class="fi-section">
          <div class="fi-section-title">公式语法参考</div>
          <div class="fi-syntax-ref">
            <div class="fi-syntax-ref-item">
              <code>=</code>
              <span>公式以等号开始</span>
            </div>
            <div class="fi-syntax-ref-item">
              <code>=SUM(A1:A10)</code>
              <span>引用连续区域</span>
            </div>
            <div class="fi-syntax-ref-item">
              <code>=[字段名]</code>
              <span>引用数据集字段</span>
            </div>
            <div class="fi-syntax-ref-item">
              <code>={A1}+{B2}</code>
              <span>等值汇总</span>
            </div>
            <div class="fi-syntax-ref-item">
              <code>继承(&C1)</code>
              <span>引用父单元格公式</span>
            </div>
            <div class="fi-syntax-ref-item">
              <code>// 注释</code>
              <span>单行注释</span>
            </div>
          </div>
        </div>
      </div>

      <!-- AI Tab -->
      <div v-if="activeTab === 'ai'" class="fi-content">
        <div class="fi-section">
          <div class="fi-section-header">
            <span class="fi-section-title">AI 公式助手</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <div class="fi-ai-chat">
            <div class="fi-ai-messages">
              <div class="fi-ai-msg bot">
                <div class="fi-ai-avatar">AI</div>
                <div class="fi-ai-bubble">
                  你好，我是公式助手。我可以帮你生成、解释和优化公式。
                </div>
              </div>
              <div class="fi-ai-msg user" v-if="aiInput">
                <div class="fi-ai-bubble">{{ aiInput }}</div>
              </div>
            </div>
            <div class="fi-ai-input">
              <textarea
                v-model="aiInput"
                placeholder="例如：计算各地区销售额的同比增长率..."
                rows="3"
                @keydown.enter.ctrl="sendAIMessage"
              ></textarea>
              <div class="fi-ai-input-actions">
                <button class="fi-ai-btn primary" @click="sendAIMessage">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  生成
                </button>
                <button class="fi-ai-btn" @click="$emit('ai-optimize')">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  优化当前公式
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 推荐公式 -->
        <div class="fi-section">
          <div class="fi-section-title">智能推荐</div>
          <div class="fi-recmd-list">
            <div v-for="rec in recommendations" :key="rec.name" class="fi-recmd-item" @click="applyRecommendation(rec)">
              <div class="fi-recmd-header">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                <span class="fi-recmd-name">{{ rec.name }}</span>
              </div>
              <p class="fi-recmd-desc">{{ rec.desc }}</p>
              <code class="fi-recmd-formula">{{ rec.formula }}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  cellInfo: {
    type: Object,
    default: () => ({})
  },
  formulaInfo: {
    type: Object,
    default: () => ({})
  },
  dependencies: {
    type: Array,
    default: () => []
  },
  errors: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['navigate-to', 'apply-format', 'ai-optimize'])

const activeTab = ref('property')
const errorCount = computed(() => props.errors.length)

const tabs = [
  { key: 'property', label: '属性' },
  { key: 'formula', label: '公式' },
  { key: 'deps', label: '依赖' },
  { key: 'error', label: '错误' },
  { key: 'help', label: '帮助' },
  { key: 'ai', label: 'AI' }
]

const typeLabel = computed(() => {
  const map = { formula: '公式', number: '数值', text: '文本', boolean: '布尔', empty: '空' }
  return map[props.cellInfo.type] || props.cellInfo.type || '--'
})

// Format settings
const cellFormat = ref({
  number: 'general',
  decimals: 2,
  thousands: true,
  currency: '¥'
})

// Conditions
const conditions = ref([])
function addCondition() {
  conditions.value.push({ op: '> 0', value: '绿色', color: '#52C41A' })
}
function removeCondition(i) {
  conditions.value.splice(i, 1)
}

// Dep graph
const depNodes = ref([
  { x: 130, y: 30, label: '销售金额', color: '#EFF6FF', border: '#93C5FD', ref: 'D6' },
  { x: 60, y: 110, label: '成本', color: '#F0FDF4', border: '#86EFAC', ref: 'E6' },
  { x: 200, y: 110, label: '利润', color: '#FEF3C7', border: '#FCD34D', ref: 'F6' },
  { x: 130, y: 190, label: '毛利率(%)', color: '#F3E8FF', border: '#C4B5FD', ref: 'G6' },
])
const depEdges = ref([
  { x1: 130, y1: 44, x2: 76, y2: 96, color: '#93C5FD' },
  { x1: 130, y1: 44, x2: 184, y2: 96, color: '#93C5FD' },
  { x1: 76, y1: 124, x2: 110, y2: 176, color: '#C4B5FD' },
  { x1: 184, y1: 124, x2: 150, y2: 176, color: '#C4B5FD' },
])
const depStats = ref([
  { type: 'ref', color: '#2563EB', label: '引用', count: 6 },
  { type: 'used', color: '#8B5CF6', label: '被引用', count: 3 }
])

// Help
const helpSearch = ref('')
const expandedHelp = ref(null)

const helpFunctions = ref([
  { name: 'SUM', desc: '计算一组数值的总和', syntax: 'SUM(value1, [value2], ...)', example: '=SUM(A1:A10)', params: [{ name: 'value1', type: '数字/范围', desc: '第一个值或范围' }, { name: 'value2', type: '数字/范围', desc: '可选，更多值或范围' }] },
  { name: 'AVERAGE', desc: '计算一组数值的算术平均值', syntax: 'AVERAGE(value1, [value2], ...)', example: '=AVERAGE(B1:B10)', params: [{ name: 'value1', type: '数字/范围', desc: '第一个值或范围' }] },
  { name: 'IF', desc: '根据条件返回不同的值', syntax: 'IF(condition, value_if_true, value_if_false)', example: '=IF(A1>100, "高", "低")', params: [{ name: 'condition', type: '布尔', desc: '判断条件' }, { name: 'value_if_true', type: '任意', desc: '条件为真时的返回值' }, { name: 'value_if_false', type: '任意', desc: '条件为假时的返回值' }] },
  { name: 'VLOOKUP', desc: '在表格中按列查找数据', syntax: 'VLOOKUP(lookup_value, table_array, col_index, [range_lookup])', example: '=VLOOKUP(A1, C:D, 2, FALSE)', params: [{ name: 'lookup_value', type: '任意', desc: '要查找的值' }, { name: 'table_array', type: '范围', desc: '查找区域' }, { name: 'col_index', type: '数字', desc: '返回列索引' }] },
  { name: 'COUNT', desc: '计算区域中数字的个数', syntax: 'COUNT(value1, [value2], ...)', example: '=COUNT(A1:A10)', params: [{ name: 'value1', type: '任意', desc: '第一个值或范围' }] },
  { name: '同比', desc: '计算同比变化率', syntax: '同比(measure, [period])', example: '=同比([销售金额])', params: [{ name: 'measure', type: '度量', desc: '要比较的度量指标' }, { name: 'period', type: '文本', desc: '可选，年/季/月' }] },
  { name: '环比', desc: '计算环比变化率', syntax: '环比(measure, [period])', example: '=环比([销售金额])', params: [{ name: 'measure', type: '度量', desc: '要比较的度量指标' }, { name: 'period', type: '文本', desc: '可选，季/月' }] },
  { name: '累计', desc: '计算累计值', syntax: '累计(measure, [scope])', example: '=累计([销售金额])', params: [{ name: 'measure', type: '度量', desc: '要累计的度量指标' }] },
])
const filteredHelpFunctions = computed(() => {
  if (!helpSearch.value) return helpFunctions.value
  const q = helpSearch.value.toLowerCase()
  return helpFunctions.value.filter(f => f.name.toLowerCase().includes(q) || f.desc.toLowerCase().includes(q))
})
function toggleHelp(name) {
  expandedHelp.value = expandedHelp.value === name ? null : name
}

// AI
const aiInput = ref('')
function sendAIMessage() {
  if (!aiInput.value.trim()) return
  // Handled by emit
  aiInput.value = ''
}

const recommendations = ref([
  { name: '同比增长率', desc: '计算各产品线的同比增长率', formula: '=(SUMIFS([销售额], [年份], "2026") - SUMIFS([销售额], [年份], "2025")) / SUMIFS([销售额], [年份], "2025")' },
  { name: '预算完成率', desc: '计算各部门预算完成百分比', formula: '=IFERROR([实际金额]/[预算金额] * 100, 0)' },
  { name: '排名计算', desc: '按销售额降序排名的公式', formula: '=RANK([销售额], [销售额]:[销售额])' }
])

function applyRecommendation(rec) {
  emit('apply-format', { formula: rec.formula })
}

// Error fix/ignore
function fixError(i) { /* stub */ }
function ignoreError(i) { /* stub */ }
</script>

<style scoped>
.formula-inspector {
  width: 280px;
  min-width: 280px;
  background: #fff;
  border-left: 1px solid #E5E7EB;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}

/* Tabs */
.fi-tabs {
  display: flex;
  border-bottom: 1px solid #E5E7EB;
  background: #F8FAFC;
  flex-shrink: 0;
  padding: 0 4px;
  overflow-x: auto;
}
.fi-tab {
  padding: 0 10px;
  height: 34px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #6B7280;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  white-space: nowrap;
  transition: all 0.2s;
}
.fi-tab:hover { color: #2563EB; }
.fi-tab.active { color: #2563EB; border-bottom-color: #2563EB; }
.fi-tab.error.active { color: #EF4444; border-bottom-color: #EF4444; }

.fi-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}
.fi-content {
  padding: 8px 12px;
}

/* Sections */
.fi-section { margin-bottom: 16px; }
.fi-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.fi-section-title {
  font-size: 11px;
  font-weight: 600;
  color: #9CA3AF;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

/* Info grid */
.fi-info-grid {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.fi-info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 12px;
}
.fi-info-label { color: #6B7280; }
.fi-info-value { color: #374151; font-weight: 500; }
.fi-info-value.ref {
  font-family: 'Roboto Mono', monospace;
  color: #2563EB;
  font-size: 11px;
  background: #EFF6FF;
  padding: 1px 6px;
  border-radius: 3px;
}
.fi-info-value.field {
  color: #059669;
  background: #ECFDF5;
  padding: 1px 6px;
  border-radius: 3px;
}
.fi-info-value.empty { color: #D1D5DB; }
.fi-info-value.on { color: #52C41A; }
.fi-info-value.off { color: #F5222D; }
.fi-badge {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
}
.fi-badge.formula { background: #EFF6FF; color: #2563EB; }
.fi-badge.number { background: #F0FDF4; color: #059669; }
.fi-badge.text { background: #FEF3C7; color: #D97706; }
.fi-badge.empty { background: #F3F4F6; color: #6B7280; }

/* Format */
.fi-format-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.fi-format-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.fi-format-item label {
  font-size: 11px;
  color: #6B7280;
}
.fi-format-item select {
  height: 28px;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  font-size: 11px;
  padding: 0 6px;
  background: #fff;
  color: #374151;
  outline: none;
}
.fi-format-item select:focus { border-color: #2563EB; }

/* Toggle */
.fi-toggle { position: relative; display: inline-block; width: 32px; height: 16px; }
.fi-toggle input { opacity: 0; width: 0; height: 0; }
.fi-toggle-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: #D1D5DB;
  border-radius: 16px;
  transition: 0.2s;
}
.fi-toggle-slider::before {
  content: '';
  position: absolute;
  height: 12px;
  width: 12px;
  left: 2px;
  bottom: 2px;
  background: #fff;
  border-radius: 50%;
  transition: 0.2s;
}
.fi-toggle input:checked + .fi-toggle-slider { background: #2563EB; }
.fi-toggle input:checked + .fi-toggle-slider::before { transform: translateX(16px); }

/* Conditions */
.fi-condition-list { display: flex; flex-direction: column; gap: 4px; }
.fi-condition-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  background: #F9FAFB;
  border-radius: 4px;
}
.fi-condition-rule {
  display: flex;
  gap: 4px;
  font-size: 11px;
  flex: 1;
}
.fi-condition-op { color: #6B7280; }
.fi-condition-value { color: #374151; font-weight: 500; }
.fi-condition-color {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 1px solid #E5E7EB;
}
.fi-remove-btn {
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9CA3AF;
  padding: 0;
}
.fi-remove-btn:hover { background: #FEE2E2; color: #EF4444; }

.fi-empty {
  font-size: 11px;
  color: #D1D5DB;
  text-align: center;
  padding: 12px;
}
.fi-empty.success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #52C41A;
}

/* Formula tab */
.fi-formula-box {
  background: #1E293B;
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 8px;
}
.fi-formula-box code {
  color: #E2E8F0;
  font-family: 'Roboto Mono', 'Fira Code', monospace;
  font-size: 12px;
  word-break: break-all;
}

.fi-syntax-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 6px 0;
}
.fi-syntax-status.valid { color: #52C41A; }
.fi-syntax-status.error { color: #EF4444; }

.fi-syntax-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 0;
}
.fi-tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  padding: 2px 0;
}
.fi-tree-node-type {
  color: #8B5CF6;
  font-weight: 500;
  min-width: 40px;
}
.fi-tree-node-value {
  color: #374151;
  font-family: 'Roboto Mono', monospace;
  font-size: 10px;
}

/* Ref list */
.fi-ref-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.fi-ref-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  color: #374151;
  transition: background 0.15s;
}
.fi-ref-item:hover { background: #F3F4F6; }

/* Dep graph */
.fi-dep-graph {
  background: #F8FAFC;
  border-radius: 8px;
  border: 1px solid #E5E7EB;
  padding: 8px;
  margin-bottom: 12px;
  display: flex;
  justify-content: center;
}
.fi-dep-svg {
  width: 100%;
  max-width: 260px;
  height: auto;
}
.fi-dep-rect {
  cursor: pointer;
  transition: all 0.15s;
}
.fi-dep-rect:hover { filter: brightness(0.95); }
.fi-dep-label { user-select: none; pointer-events: none; }

.fi-dep-stats {
  display: flex;
  gap: 8px;
  font-size: 10px;
  color: #6B7280;
}
.fi-dep-stat {
  display: flex;
  align-items: center;
  gap: 3px;
}
.fi-dep-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}

.fi-dep-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.fi-dep-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 12px;
}
.fi-dep-from, .fi-dep-to {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #374151;
}

/* Error list */
.fi-error-count {
  font-size: 11px;
  font-weight: 500;
  color: #EF4444;
}
.fi-error-count.clean { color: #52C41A; }

.fi-error-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.fi-error-item {
  padding: 8px;
  border-radius: 6px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  cursor: pointer;
  transition: all 0.15s;
}
.fi-error-item:hover { background: #FEE2E2; }
.fi-error-item.warn { background: #FFFBEB; border-color: #FDE68A; }
.fi-error-item.warn:hover { background: #FEF3C7; }

.fi-error-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.fi-error-ref {
  font-size: 11px;
  font-family: 'Roboto Mono', monospace;
  color: #2563EB;
  background: #EFF6FF;
  padding: 1px 5px;
  border-radius: 3px;
}
.fi-error-type {
  font-size: 11px;
  font-weight: 500;
  color: #EF4444;
}
.fi-error-msg {
  font-size: 11px;
  color: #6B7280;
  margin: 0 0 6px 0;
  line-height: 1.4;
}
.fi-error-actions {
  display: flex;
  gap: 6px;
}
.fi-error-btn {
  font-size: 10px;
  padding: 2px 8px;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  background: #fff;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s;
}
.fi-error-btn:hover { background: #2563EB; color: #fff; border-color: #2563EB; }

/* Performance */
.fi-perf-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.fi-perf-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
}
.fi-perf-label { color: #6B7280; }
.fi-perf-value { color: #374151; font-weight: 500; }
.fi-perf-value.slow { color: #F59E0B; }
.fi-complexity-bar {
  width: 80px;
  height: 6px;
  background: #F3F4F6;
  border-radius: 3px;
  overflow: hidden;
}
.fi-complexity-fill {
  height: 100%;
  background: linear-gradient(90deg, #52C41A, #F59E0B, #EF4444);
  border-radius: 3px;
  transition: width 0.5s;
}

/* Help */
.fi-search {
  margin-bottom: 8px;
}
.fi-search input {
  width: 100%;
  height: 28px;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  padding: 0 8px;
  font-size: 12px;
  background: #F9FAFB;
  color: #374151;
  outline: none;
  box-sizing: border-box;
}
.fi-search input:focus { border-color: #2563EB; background: #fff; }

.fi-help-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.fi-help-item {
  border: 1px solid #F3F4F6;
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.15s;
}
.fi-help-item:hover { border-color: #E5E7EB; }

.fi-help-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  cursor: pointer;
}
.fi-help-name {
  font-size: 12px;
  font-family: 'Roboto Mono', monospace;
  color: #2563EB;
  font-weight: 500;
}
.fi-help-arrow {
  color: #9CA3AF;
  transition: transform 0.2s;
}
.fi-help-arrow.expanded { transform: rotate(180deg); }

.fi-help-body {
  padding: 0 8px 8px;
  border-top: 1px solid #F3F4F6;
}
.fi-help-desc {
  font-size: 11px;
  color: #4B5563;
  margin: 6px 0;
}
.fi-help-syntax {
  font-size: 11px;
  color: #6B7280;
  font-family: 'Roboto Mono', monospace;
  background: #F9FAFB;
  padding: 4px 6px;
  border-radius: 4px;
  margin-bottom: 6px;
}
.fi-help-example {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 6px;
}
.fi-help-example-label {
  font-size: 10px;
  color: #9CA3AF;
}
.fi-help-example code {
  font-size: 11px;
  font-family: 'Roboto Mono', monospace;
  color: #059669;
}
.fi-help-params {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.fi-help-param {
  display: flex;
  gap: 6px;
  font-size: 10px;
  padding: 2px 0;
}
.fi-param-name { color: #2563EB; font-weight: 500; min-width: 50px; }
.fi-param-type { color: #9CA3AF; min-width: 50px; }
.fi-param-desc { color: #6B7280; flex: 1; }

/* Syntax ref */
.fi-syntax-ref {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.fi-syntax-ref-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: #F9FAFB;
  border-radius: 4px;
}
.fi-syntax-ref-item code {
  font-size: 11px;
  font-family: 'Roboto Mono', monospace;
  color: #059669;
  background: #ECFDF5;
  padding: 1px 5px;
  border-radius: 3px;
}
.fi-syntax-ref-item span {
  font-size: 11px;
  color: #6B7280;
}

/* AI */
.fi-ai-chat {
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  overflow: hidden;
}
.fi-ai-messages {
  padding: 8px;
  max-height: 160px;
  overflow-y: auto;
}
.fi-ai-msg {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}
.fi-ai-msg.user { justify-content: flex-end; }
.fi-ai-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563EB, #7C3AED);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.fi-ai-bubble {
  font-size: 11px;
  line-height: 1.5;
  padding: 6px 10px;
  border-radius: 8px;
  max-width: 85%;
}
.fi-ai-msg.bot .fi-ai-bubble {
  background: #F3F4F6;
  color: #374151;
  border-bottom-left-radius: 2px;
}
.fi-ai-msg.user .fi-ai-bubble {
  background: #EFF6FF;
  color: #1E293B;
  border-bottom-right-radius: 2px;
}
.fi-ai-input {
  border-top: 1px solid #E5E7EB;
  padding: 8px;
}
.fi-ai-input textarea {
  width: 100%;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 11px;
  font-family: inherit;
  resize: none;
  background: #F9FAFB;
  color: #374151;
  outline: none;
  box-sizing: border-box;
}
.fi-ai-input textarea:focus { border-color: #2563EB; background: #fff; }
.fi-ai-input-actions {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}
.fi-ai-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  padding: 4px 10px;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  background: #fff;
  color: #4B5563;
  cursor: pointer;
  transition: all 0.15s;
}
.fi-ai-btn:hover { background: #F3F4F6; }
.fi-ai-btn.primary {
  background: #2563EB;
  color: #fff;
  border-color: #2563EB;
}
.fi-ai-btn.primary:hover { background: #1D4ED8; }

/* Recommendations */
.fi-recmd-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.fi-recmd-item {
  padding: 8px;
  border: 1px solid #F3F0FF;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  background: #FAF9FF;
}
.fi-recmd-item:hover { border-color: #C4B5FD; background: #F5F3FF; }
.fi-recmd-header {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}
.fi-recmd-name {
  font-size: 12px;
  font-weight: 500;
  color: #1E293B;
}
.fi-recmd-desc {
  font-size: 11px;
  color: #6B7280;
  margin: 0 0 4px 0;
  line-height: 1.4;
}
.fi-recmd-formula {
  font-size: 10px;
  font-family: 'Roboto Mono', monospace;
  color: #2563EB;
  background: #EFF6FF;
  padding: 2px 6px;
  border-radius: 3px;
  display: inline-block;
  word-break: break-all;
}

/* Add btn */
.fi-add-btn {
  width: 20px;
  height: 20px;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6B7280;
  padding: 0;
  transition: all 0.15s;
}
.fi-add-btn:hover { background: #2563EB; color: #fff; border-color: #2563EB; }

/* Scrollbar */
.fi-body::-webkit-scrollbar { width: 4px; }
.fi-body::-webkit-scrollbar-track { background: transparent; }
.fi-body::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 2px; }
.fi-body::-webkit-scrollbar-thumb:hover { background: #D1D5DB; }
</style>
