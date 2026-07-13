<template>
  <div class="formula-console" :class="{ collapsed: collapsed }">
    <!-- Console Toggle Bar -->
    <div class="fcns-toggle" @click="collapsed = !collapsed">
      <div class="fcns-tabs" @click.stop>
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="fcns-tab"
          :class="{ active: activeTab === tab.key, error: tab.key === 'errors' && errorCount > 0 }"
          @click="activeTab = tab.key; collapsed = false"
        >
          <span class="fcns-tab-icon" v-html="tab.icon"></span>
          <span>{{ tab.label }}</span>
          <span v-if="tab.key === 'errors' && errorCount" class="fcns-badge">{{ errorCount }}</span>
        </button>
      </div>
      <div class="fcns-actions">
        <button class="fcns-action-btn" @click.stop="collapsed = !collapsed" :title="collapsed ? '展开' : '收起'">
          <svg :class="{ rotated: !collapsed }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <button class="fcns-action-btn" @click.stop="handleClear" title="清空">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    </div>

    <!-- Console Body -->
    <div v-show="!collapsed" class="fcns-body">
      <!-- ============ Errors Tab ============ -->
      <div v-if="activeTab === 'errors'" class="fcns-content">
        <div v-if="errors.length === 0" class="fcns-empty">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#52C41A" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <span>所有公式检查通过，无错误</span>
        </div>
        <div v-else class="fcns-errors">
          <div
            v-for="(err, i) in errors"
            :key="i"
            class="fcns-error-item"
            :class="err.severity"
            @click="$emit('navigate-to', err.ref)"
          >
            <span class="fcns-error-severity" :class="err.severity">
              {{ err.severity === 'error' ? 'Error' : 'Warn' }}
            </span>
            <span class="fcns-error-ref">{{ err.ref }}</span>
            <span class="fcns-error-type">{{ err.type }}</span>
            <span class="fcns-error-msg">{{ err.message }}</span>
            <span class="fcns-error-time">{{ err.time }}</span>
          </div>
        </div>
      </div>

      <!-- ============ Dependency Tab ============ -->
      <div v-if="activeTab === 'deps'" class="fcns-content">
        <div class="fcns-dep-layout">
          <!-- Graph -->
          <div class="fcns-dep-graph" ref="depGraphRef">
            <svg viewBox="0 0 500 260" class="fcns-dep-svg">
              <defs>
                <marker id="fcns-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <polygon points="0 0, 6 3, 0 6" fill="#93C5FD" />
                </marker>
              </defs>
              <!-- Edges -->
              <line v-for="(e, i) in depEdges" :key="'e'+i"
                :x1="e.x1" :y1="e.y1" :x2="e.x2" :y2="e.y2"
                stroke="#93C5FD" stroke-width="1.5" marker-end="url(#fcns-arrow)"
                class="fcns-dep-edge"
              />
              <!-- Nodes -->
              <g v-for="(n, i) in depNodes" :key="'n'+i"
                class="fcns-dep-node"
                @click="$emit('navigate-cell', n.ref)"
              >
                <rect :x="n.x-55" :y="n.y-15" width="110" height="30" rx="6"
                  :fill="n.color" :stroke="n.border" stroke-width="1.5" />
                <text :x="n.x" :y="n.y-3" text-anchor="middle" font-size="11" font-weight="500" fill="#1E293B">{{ n.label }}</text>
                <text :x="n.x" :y="n.y+12" text-anchor="middle" font-size="9" fill="#64748B" font-family="monospace">{{ n.ref }}</text>
              </g>
            </svg>
          </div>
          <!-- Legend + Stats -->
          <div class="fcns-dep-sidebar">
            <div class="fcns-dep-legend">
              <div class="fcns-dep-legend-item">
                <span class="fcns-dep-dot" style="background:#2563EB"></span><span>引用 ({{ depStats.refCount }})</span>
              </div>
              <div class="fcns-dep-legend-item">
                <span class="fcns-dep-dot" style="background:#8B5CF6"></span><span>被引用 ({{ depStats.usedCount }})</span>
              </div>
              <div class="fcns-dep-legend-item">
                <span class="fcns-dep-dot" style="background:#F59E0B"></span><span>循环依赖 ({{ depStats.cycles }})</span>
              </div>
            </div>
            <div class="fcns-dep-list">
              <div
                v-for="d in dependencies"
                :key="d.from + d.to"
                class="fcns-dep-list-item"
                @click="$emit('navigate-cell', d.from)"
              >
                <span class="fcns-dep-from">{{ d.from }}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                <span class="fcns-dep-to">{{ d.to }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ============ Performance Tab ============ -->
      <div v-if="activeTab === 'perf'" class="fcns-content">
        <div class="fcns-perf-grid">
          <div class="fcns-perf-card">
            <span class="fcns-perf-card-label">总计算耗时</span>
            <span class="fcns-perf-card-value fast">{{ calcTime }}</span>
          </div>
          <div class="fcns-perf-card">
            <span class="fcns-perf-card-label">公式总数</span>
            <span class="fcns-perf-card-value">{{ formulaCount }}</span>
          </div>
          <div class="fcns-perf-card">
            <span class="fcns-perf-card-label">最慢公式</span>
            <span class="fcns-perf-card-value slow" :title="slowestFormula.formula">{{ slowestFormula.time }}</span>
          </div>
          <div class="fcns-perf-card">
            <span class="fcns-perf-card-label">平均耗时</span>
            <span class="fcns-perf-card-value">{{ avgCalcTime }}</span>
          </div>
        </div>

        <!-- Perf ranking -->
        <div class="fcns-perf-detail">
          <div class="fcns-perf-header">
            <span>公式</span>
            <span>单元格</span>
            <span>耗时</span>
            <span>复杂度</span>
          </div>
          <div class="fcns-perf-row" v-for="(item, i) in perfRanking" :key="i" @click="$emit('navigate-cell', item.ref)">
            <code class="fcns-perf-formula">{{ item.formula }}</code>
            <span class="fcns-perf-ref">{{ item.ref }}</span>
            <span class="fcns-perf-time" :class="{ slow: item.ms > 10 }">{{ item.ms }}</span>
            <div class="fcns-perf-bar-wrap">
              <div class="fcns-perf-bar" :style="{ width: item.complexity + '%', background: item.complexity > 60 ? '#EF4444' : item.complexity > 30 ? '#F59E0B' : '#52C41A' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- ============ AI Tab ============ -->
      <div v-if="activeTab === 'ai'" class="fcns-content">
        <div class="fcns-ai-chat">
          <div class="fcns-ai-messages" ref="aiMessagesRef">
            <div
              v-for="(msg, i) in aiMessages"
              :key="i"
              class="fcns-ai-msg"
              :class="msg.role"
            >
              <div class="fcns-ai-avatar">{{ msg.role === 'assistant' ? 'AI' : 'U' }}</div>
              <div class="fcns-ai-bubble">
                <p v-if="typeof msg.content === 'string'">{{ msg.content }}</p>
                <div v-else-if="msg.type === 'formula'">
                  <span class="fcns-ai-formula-label">生成公式:</span>
                  <code class="fcns-ai-formula">{{ msg.content.formula }}</code>
                  <div class="fcns-ai-formula-actions">
                    <button @click="$emit('insert-formula', msg.content.formula)">插入</button>
                    <button @click="$emit('replace-formula', msg.content.formula)">替换</button>
                    <button @click="explainFormula(msg.content.formula)">解释</button>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="aiLoading" class="fcns-ai-msg assistant">
              <div class="fcns-ai-avatar">AI</div>
              <div class="fcns-ai-bubble typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
          <div class="fcns-ai-input">
            <textarea
              v-model="aiInputText"
              placeholder="描述你的计算需求，例如：计算预算完成率..."
              rows="2"
              @keydown.enter.ctrl="sendAIMessage"
            ></textarea>
            <button class="fcns-ai-send" @click="sendAIMessage" :disabled="!aiInputText.trim() || aiLoading">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- ============ Test Tab ============ -->
      <div v-if="activeTab === 'test'" class="fcns-content">
        <div class="fcns-test-toolbar">
          <button class="fcns-test-btn primary" @click="$emit('test-run')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            全部测试
          </button>
          <button class="fcns-test-btn" @click="$emit('test-current')">
            当前公式
          </button>
          <label class="fcns-test-label">
            <input type="checkbox" v-model="autoTest" />
            自动测试
          </label>
        </div>

        <div v-if="testResults.length === 0" class="fcns-empty">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
          <span>尚未运行测试</span>
        </div>

        <div v-else class="fcns-test-results">
          <div v-for="(r, i) in testResults" :key="i" class="fcns-test-item" :class="r.status">
            <svg v-if="r.status === 'pass'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#52C41A" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            <svg v-else-if="r.status === 'fail'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div class="fcns-test-info">
              <div class="fcns-test-head">
                <span class="fcns-test-ref">{{ r.ref }}</span>
                <code class="fcns-test-formula">{{ r.formula }}</code>
              </div>
              <div class="fcns-test-detail">
                <span class="fcns-test-expected">期望: {{ r.expected }}</span>
                <span class="fcns-test-arrow">→</span>
                <span class="fcns-test-actual" :class="r.status === 'fail' ? 'wrong' : ''">实际: {{ r.actual }}</span>
                <span class="fcns-test-ms">{{ r.ms }}</span>
              </div>
              <p v-if="r.message" class="fcns-test-msg">{{ r.message }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  formulaCount: { type: Number, default: 0 },
  calcTime: { type: String, default: '0ms' },
  errors: { type: Array, default: () => [] },
  dependencies: { type: Array, default: () => [] }
})

const emit = defineEmits(['navigate-to', 'navigate-cell', 'insert-formula', 'replace-formula', 'test-run', 'test-current', 'clear-console'])

const collapsed = ref(false)
const activeTab = ref('errors')
const errorCount = computed(() => props.errors.length)

const tabs = [
  { key: 'errors', label: '错误', icon: '!' },
  { key: 'deps', label: '依赖', icon: '↗' },
  { key: 'perf', label: '性能', icon: '⏱' },
  { key: 'ai', label: 'AI', icon: '✦' },
  { key: 'test', label: '测试', icon: '▶' }
]

// Dep graph
const depNodes = ref([
  { x: 250, y: 40, label: '销售金额', ref: 'D6', color: '#EFF6FF', border: '#93C5FD' },
  { x: 130, y: 130, label: '成本', ref: 'E6', color: '#F0FDF4', border: '#86EFAC' },
  { x: 370, y: 130, label: '毛利', ref: 'F6', color: '#FEF3C7', border: '#FCD34D' },
  { x: 250, y: 210, label: '毛利率(%)', ref: 'G6', color: '#F3E8FF', border: '#C4B5FD' },
])
const depEdges = ref([
  { x1: 250, y1: 55, x2: 150, y2: 115 },
  { x1: 250, y1: 55, x2: 350, y2: 115 },
  { x1: 150, y1: 145, x2: 230, y2: 195 },
  { x1: 350, y1: 145, x2: 270, y2: 195 },
])
const depStats = ref({ refCount: 6, usedCount: 3, cycles: 0 })
const depGraphRef = ref(null)

// Perf
const slowestFormula = ref({ formula: '=SUMIFS(D:D, A:A, ">=2026")', time: '18ms', ref: 'F20' })
const avgCalcTime = computed(() => {
  const ms = parseInt(props.calcTime) || 0
  const count = props.formulaCount || 1
  return Math.round(ms / count) + 'ms'
})
const perfRanking = ref([
  { formula: '=SUMIFS(D:D, A:A, ">=2026")', ref: 'F20', ms: '18ms', complexity: 72 },
  { formula: '=VLOOKUP(A6, P:Q, 2, FALSE)', ref: 'B6', ms: '12ms', complexity: 45 },
  { formula: '=IF(G6>30, "优秀", "一般")', ref: 'H6', ms: '8ms', complexity: 30 },
  { formula: '=SUM(D6:D18)', ref: 'D20', ms: '4ms', complexity: 15 },
])

// AI
const aiMessages = ref([
  { role: 'assistant', content: '你好！我是公式助手。告诉我你的需求，我帮你生成、解释或优化公式。' }
])
const aiInputText = ref('')
const aiLoading = ref(false)
const aiMessagesRef = ref(null)

function sendAIMessage() {
  const text = aiInputText.value.trim()
  if (!text || aiLoading.value) return
  aiMessages.value.push({ role: 'user', content: text })
  aiInputText.value = ''
  aiLoading.value = true

  // Simulate AI response
  setTimeout(() => {
    aiLoading.value = false
    const formulas = {
      '预算完成率': { type: 'formula', content: { formula: '=IFERROR([实际金额]/[预算金额] * 100, 0)' } },
      '同比增长率': { type: 'formula', content: { formula: '=同比([销售金额], "年")' } },
      '排名': { type: 'formula', content: { formula: '=RANK([销售金额], [销售金额]:[销售金额], 0)' } },
      '毛利率': { type: 'formula', content: { formula: '=ROUND([毛利]/[销售金额] * 100, 2)' } },
    }
    let matched = null
    for (const [kw, msg] of Object.entries(formulas)) {
      if (text.includes(kw)) { matched = msg; break }
    }
    aiMessages.value.push(matched || { role: 'assistant', content: `已收到："${text}"。请具体描述你需要的计算公式，我会帮你生成。` })
    nextTick(() => {
      if (aiMessagesRef.value) {
        aiMessagesRef.value.scrollTop = aiMessagesRef.value.scrollHeight
      }
    })
  }, 800)
}

function explainFormula(formula) {
  aiMessages.value.push({
    role: 'assistant',
    content: `公式 "${formula}" 的解释:\n这是计算...` // stub
  })
}

// Test
const autoTest = ref(false)
const testResults = ref([])

// Watch for auto test
watch(autoTest, (val) => {
  if (val) {
    testResults.value = [
      { status: 'pass', ref: 'D6', formula: '=SUM([销售金额])', expected: '汇总值', actual: '70,666,630', ms: '4ms' },
      { status: 'pass', ref: 'E6', formula: '=SUM([成本])', expected: '汇总值', actual: '23,500,000', ms: '3ms' },
      { status: 'pass', ref: 'G6', formula: '=[毛利]/[销售金额]*100', expected: '百分比', actual: '66.8', ms: '5ms' },
    ]
  }
})

// Clear
function handleClear() {
  if (activeTab.value === 'errors') {
    emit('clear-console')
  } else if (activeTab.value === 'ai') {
    aiMessages.value = [aiMessages.value[0]]
  } else if (activeTab.value === 'test') {
    testResults.value = []
  }
}
</script>

<style scoped>
.formula-console {
  border-top: 1px solid #E5E7EB;
  background: #fff;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

/* Toggle bar */
.fcns-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  padding: 0 8px;
  background: #F8FAFC;
  border-bottom: 1px solid #E5E7EB;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
}

.fcns-tabs {
  display: flex;
  gap: 2px;
}
.fcns-tab {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 10px;
  height: 26px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  font-size: 11px;
  color: #6B7280;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.fcns-tab:hover { background: #F3F4F6; color: #374151; }
.fcns-tab.active { background: #fff; border-color: #E5E7EB; color: #2563EB; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
.fcns-tab.error.active { color: #EF4444; border-color: #FECACA; }
.fcns-tab-icon { font-size: 11px; font-weight: 700; }
.fcns-badge {
  background: #EF4444;
  color: #fff;
  font-size: 9px;
  padding: 0 5px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
  line-height: 16px;
}

.fcns-actions {
  display: flex;
  gap: 2px;
}
.fcns-action-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9CA3AF;
  padding: 0;
  transition: all 0.15s;
}
.fcns-action-btn:hover { background: #F3F4F6; color: #374151; }
.fcns-action-btn svg.rotated { transform: rotate(180deg); }

/* Body */
.fcns-body {
  flex: 1;
  overflow: auto;
  max-height: 220px;
}

.fcns-content {
  padding: 8px 12px;
  height: 100%;
}
.fcns-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  font-size: 12px;
  color: #9CA3AF;
}

/* Errors */
.fcns-errors {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.fcns-error-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s;
}
.fcns-error-item:hover { background: #F3F4F6; }
.fcns-error-item.error { background: #FEF2F2; }
.fcns-error-item.warn { background: #FFFBEB; }
.fcns-error-severity {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 3px;
}
.fcns-error-severity.error { background: #FEE2E2; color: #DC2626; }
.fcns-error-severity.warn { background: #FEF3C7; color: #D97706; }
.fcns-error-ref {
  font-family: 'Roboto Mono', monospace;
  color: #2563EB;
  font-size: 11px;
  min-width: 36px;
}
.fcns-error-type { color: #EF4444; font-weight: 500; }
.fcns-error-msg { color: #6B7280; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fcns-error-time { color: #9CA3AF; font-size: 10px; }

/* Dep graph */
.fcns-dep-layout {
  display: flex;
  gap: 12px;
  height: 100%;
}
.fcns-dep-graph {
  flex: 1;
  background: #F8FAFC;
  border-radius: 8px;
  border: 1px solid #E5E7EB;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 180px;
}
.fcns-dep-svg { width: 100%; height: 100%; max-width: 500px; }
.fcns-dep-node { cursor: pointer; }
.fcns-dep-node:hover rect { filter: brightness(0.95); stroke-width: 2; }
.fcns-dep-edge { transition: stroke 0.2s; }

.fcns-dep-sidebar {
  width: 180px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.fcns-dep-legend {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.fcns-dep-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #6B7280;
}
.fcns-dep-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.fcns-dep-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
  flex: 1;
}
.fcns-dep-list-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  transition: background 0.15s;
}
.fcns-dep-list-item:hover { background: #F3F4F6; }
.fcns-dep-from { color: #2563EB; }
.fcns-dep-to { color: #8B5CF6; }

/* Perf */
.fcns-perf-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}
.fcns-perf-card {
  background: #F8FAFC;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.fcns-perf-card-label { font-size: 10px; color: #9CA3AF; }
.fcns-perf-card-value { font-size: 18px; font-weight: 700; color: #1E293B; }
.fcns-perf-card-value.fast { color: #52C41A; }
.fcns-perf-card-value.slow { color: #EF4444; font-size: 14px; }

.fcns-perf-detail {
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  overflow: hidden;
}
.fcns-perf-header {
  display: grid;
  grid-template-columns: 2fr 0.8fr 0.6fr 1.2fr;
  padding: 6px 10px;
  background: #F8FAFC;
  font-size: 10px;
  color: #9CA3AF;
  border-bottom: 1px solid #E5E7EB;
}
.fcns-perf-row {
  display: grid;
  grid-template-columns: 2fr 0.8fr 0.6fr 1.2fr;
  padding: 6px 10px;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.15s;
  align-items: center;
}
.fcns-perf-row:hover { background: #F9FAFB; }
.fcns-perf-row:not(:last-child) { border-bottom: 1px solid #F3F4F6; }
.fcns-perf-formula {
  font-family: 'Roboto Mono', monospace;
  font-size: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #2563EB;
}
.fcns-perf-ref { font-family: 'Roboto Mono', monospace; color: #374151; }
.fcns-perf-time { font-weight: 500; }
.fcns-perf-time.slow { color: #EF4444; }
.fcns-perf-bar-wrap {
  background: #F3F4F6;
  border-radius: 3px;
  height: 6px;
  overflow: hidden;
}
.fcns-perf-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s;
  min-width: 4px;
}

/* AI */
.fcns-ai-chat {
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  max-height: 200px;
}
.fcns-ai-messages {
  flex: 1;
  padding: 8px;
  overflow-y: auto;
  max-height: 140px;
}
.fcns-ai-msg {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}
.fcns-ai-msg.user { flex-direction: row-reverse; }
.fcns-ai-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 9px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.fcns-ai-msg.assistant .fcns-ai-avatar { background: linear-gradient(135deg, #2563EB, #7C3AED); color: #fff; }
.fcns-ai-msg.user .fcns-ai-avatar { background: #E5E7EB; color: #374151; }
.fcns-ai-bubble {
  font-size: 11px;
  line-height: 1.5;
  padding: 6px 10px;
  border-radius: 8px;
  max-width: 80%;
}
.fcns-ai-msg.assistant .fcns-ai-bubble { background: #F3F4F6; border-bottom-left-radius: 2px; }
.fcns-ai-msg.user .fcns-ai-bubble { background: #EFF6FF; border-bottom-right-radius: 2px; }

.fcns-ai-bubble.typing span {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #9CA3AF;
  margin: 0 1px;
  animation: typing 1.4s infinite both;
}
.fcns-ai-bubble.typing span:nth-child(2) { animation-delay: 0.2s; }
.fcns-ai-bubble.typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing { 0%, 60%, 100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-4px); opacity: 1; } }

.fcns-ai-formula-label { font-size: 10px; color: #9CA3AF; display: block; margin-bottom: 4px; }
.fcns-ai-formula {
  font-family: 'Roboto Mono', monospace;
  font-size: 12px;
  color: #2563EB;
  background: #EFF6FF;
  padding: 4px 8px;
  border-radius: 4px;
  display: block;
  word-break: break-all;
}
.fcns-ai-formula-actions {
  display: flex;
  gap: 4px;
  margin-top: 6px;
}
.fcns-ai-formula-actions button {
  font-size: 10px;
  padding: 2px 8px;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  background: #fff;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s;
}
.fcns-ai-formula-actions button:hover { background: #2563EB; color: #fff; border-color: #2563EB; }

.fcns-ai-input {
  display: flex;
  gap: 6px;
  padding: 6px 8px;
  border-top: 1px solid #E5E7EB;
  background: #F8FAFC;
}
.fcns-ai-input textarea {
  flex: 1;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 11px;
  font-family: inherit;
  resize: none;
  background: #fff;
  color: #374151;
  outline: none;
}
.fcns-ai-input textarea:focus { border-color: #2563EB; }
.fcns-ai-send {
  width: 32px;
  height: 32px;
  border: none;
  background: #2563EB;
  color: #fff;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background 0.15s;
  flex-shrink: 0;
}
.fcns-ai-send:hover { background: #1D4ED8; }
.fcns-ai-send:disabled { background: #D1D5DB; cursor: not-allowed; }

/* Test */
.fcns-test-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.fcns-test-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  background: #fff;
  font-size: 11px;
  color: #374151;
  cursor: pointer;
  transition: all 0.15s;
}
.fcns-test-btn:hover { background: #F3F4F6; }
.fcns-test-btn.primary { background: #2563EB; color: #fff; border-color: #2563EB; }
.fcns-test-btn.primary:hover { background: #1D4ED8; }
.fcns-test-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #6B7280;
  cursor: pointer;
  margin-left: auto;
}

.fcns-test-results {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.fcns-test-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid #F3F4F6;
}
.fcns-test-item.pass { border-color: #D1FAE5; background: #ECFDF5; }
.fcns-test-item.fail { border-color: #FECACA; background: #FEF2F2; }
.fcns-test-item.warn { border-color: #FDE68A; background: #FFFBEB; }
.fcns-test-info { flex: 1; min-width: 0; }
.fcns-test-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}
.fcns-test-ref {
  font-family: 'Roboto Mono', monospace;
  color: #2563EB;
  font-size: 11px;
}
.fcns-test-formula {
  font-family: 'Roboto Mono', monospace;
  font-size: 10px;
  color: #374151;
}
.fcns-test-detail {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}
.fcns-test-expected { color: #6B7280; }
.fcns-test-arrow { color: #D1D5DB; }
.fcns-test-actual { color: #374151; font-weight: 500; }
.fcns-test-actual.wrong { color: #EF4444; }
.fcns-test-ms { color: #9CA3AF; font-size: 10px; margin-left: auto; }
.fcns-test-msg { font-size: 10px; color: #EF4444; margin: 2px 0 0 0; }

/* Scrollbar */
.fcns-body::-webkit-scrollbar { width: 4px; }
.fcns-body::-webkit-scrollbar-track { background: transparent; }
.fcns-body::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 2px; }
</style>
