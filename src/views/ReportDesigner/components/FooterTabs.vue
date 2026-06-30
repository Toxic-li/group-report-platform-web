<template>
  <div class="footer-tabs" :class="{ collapsed: footerCollapsed }">
    <div class="tabs-header" @click="toggleFooterCollapse">
      <div class="tabs-title">
        <svg viewBox="0 0 16 16" width="12" height="12" :class="{ rotated: footerCollapsed }">
          <path d="M5 4l6 4-6 4V4z" fill="currentColor"/>
        </svg>
        <span>功能面板</span>
      </div>
      <div class="tabs-actions">
        <button class="tab-btn" :class="{ active: expandedFooter.templates }" @click.stop="toggleFooter('templates')">
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path d="M1 1h14v14H1V1zm1 1v12h12V2H2z" fill="currentColor"/>
            <path d="M3 5h10v1H3V5zm0 3h10v1H3V8zm0 3h6v1H3v-1z" fill="currentColor"/>
          </svg>
          <span>模板</span>
        </button>
        <button class="tab-btn" :class="{ active: expandedFooter.preview }" @click.stop="toggleFooter('preview')">
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path d="M1 1h14v14H1V1zm1 1v12h12V2H2z" fill="currentColor"/>
            <path d="M5 5h6v2H5V5zm0 3h6v2H5V8z" fill="currentColor"/>
          </svg>
          <span>预览</span>
        </button>
        <button class="tab-btn" :class="{ active: expandedFooter.debugger }" @click.stop="toggleFooter('debugger')">
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1zm-1 4h2v6H7V5zm0 1v4h2V6H7z" fill="currentColor"/>
          </svg>
          <span>调试</span>
        </button>
        <button class="tab-btn" :class="{ active: expandedFooter.dependencies }" @click.stop="toggleFooter('dependencies')">
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path d="M1 1h14v14H1V1zm1 1v12h12V2H2z" fill="currentColor"/>
            <path d="M5 5l4 4-4 4V5zm1 1v6l3-3-3-3z" fill="currentColor"/>
          </svg>
          <span>依赖</span>
        </button>
        <button class="tab-btn" :class="{ active: expandedFooter.history }" @click.stop="toggleFooter('history')">
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path d="M8 3a5 5 0 1 0 0 10A5 5 0 0 0 8 3zm0 1a4 4 0 1 1 0 8A4 4 0 0 1 8 4z" fill="currentColor"/>
            <path d="M8 5v5l3-2.5L8 5z" fill="currentColor"/>
          </svg>
          <span>历史</span>
        </button>
      </div>
    </div>

    <transition name="slide-up">
      <div v-show="!footerCollapsed" class="tabs-body">
        <div v-show="expandedFooter.templates" class="tab-content templates-tab">
          <div class="tab-section-header">
            <span>公式模板</span>
            <button class="section-action" @click="generateMockData">
              <svg viewBox="0 0 16 16" width="12" height="12">
                <path d="M1 1h14v14H1V1zm1 1v12h12V2H2z" fill="currentColor"/>
                <path d="M8 5l3 3-3 3V5z" fill="currentColor"/>
              </svg>
              <span>生成数据</span>
            </button>
          </div>
          <div class="templates-grid">
            <div
              v-for="template in formulaTemplates"
              :key="template.name"
              class="template-card"
              @click="applyTemplateToEditor(template)"
            >
              <div class="template-icon">{{ template.icon }}</div>
              <div class="template-name">{{ template.name }}</div>
              <div class="template-desc">{{ template.description }}</div>
            </div>
          </div>
        </div>

        <div v-show="expandedFooter.preview" class="tab-content preview-tab">
          <div class="tab-section-header">
            <span>模拟计算</span>
            <button class="section-action" @click="runSimulationCalculation">
              <svg viewBox="0 0 16 16" width="12" height="12">
                <path d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8zm0 1a6 6 0 1 0 12 0 6 6 0 0 0-12 0z" fill="currentColor"/>
                <path d="M6 5l4 3-4 3V5z" fill="currentColor"/>
              </svg>
              <span>执行计算</span>
            </button>
          </div>
          <div class="simulation-inputs">
            <div v-for="(value, key) in mockData" :key="key" class="input-item">
              <label>{{ key }}</label>
              <input v-model="mockData[key]" type="number" />
              <button class="input-remove" @click="deleteSimulationInput(key)">
                <svg viewBox="0 0 16 16" width="10" height="10">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" fill="none"/>
                </svg>
              </button>
            </div>
            <button class="input-add" @click="addSimulationInput">
              <svg viewBox="0 0 16 16" width="12" height="12">
                <path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2" fill="none"/>
              </svg>
              <span>添加输入</span>
            </button>
          </div>
          <div v-if="previewResult !== null" class="simulation-result">
            <div class="result-label">计算结果</div>
            <div class="result-value">{{ previewResult }}</div>
            <div v-if="executionTime !== null" class="result-time">执行时间: {{ executionTime }}ms</div>
          </div>
          <button class="clear-btn" @click="clearSimulation">
            <svg viewBox="0 0 16 16" width="12" height="12">
              <path d="M13 3h-3V1H5v2H2v12h11V3zM8 5h5v1H8V5zm0 3h5v1H8V8zm0 3h5v1H8v-1zM3 5h2v6H3V5z" fill="currentColor"/>
            </svg>
            <span>清空数据</span>
          </button>
        </div>

        <div v-show="expandedFooter.debugger" class="tab-content debugger-tab">
          <div class="tab-section-header">
            <span>公式调试</span>
            <button class="section-action" @click="startDebugger">
              <svg viewBox="0 0 16 16" width="12" height="12">
                <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1zm-1 4h2v6H7V5zm0 1v4h2V6H7z" fill="currentColor"/>
              </svg>
              <span>启动调试</span>
            </button>
          </div>
          <div v-if="debugLog.length > 0" class="debug-content">
            <div class="debug-actions">
              <button class="debug-btn" @click="stepDebugger" :disabled="!canStep">
                <svg viewBox="0 0 16 16" width="12" height="12">
                  <path d="M6 14l6-7-6-7v14z" fill="currentColor"/>
                </svg>
                <span>单步执行</span>
              </button>
              <button class="debug-btn" @click="runAllDebugger">
                <svg viewBox="0 0 16 16" width="12" height="12">
                  <path d="M2 8a6 6 0 1 1 12 0A6 6 0 0 1 2 8zm0 1a5 5 0 1 0 10 0 5 5 0 0 0-10 0z" fill="currentColor"/>
                  <path d="M5 6l4 2-4 2V6z" fill="currentColor"/>
                </svg>
                <span>运行全部</span>
              </button>
              <button class="debug-btn" @click="resetDebugger">
                <svg viewBox="0 0 16 16" width="12" height="12">
                  <path d="M8 3a5 5 0 1 0 0 10A5 5 0 0 0 8 3zm0 1a4 4 0 1 1 0 8A4 4 0 0 1 8 4z" fill="currentColor"/>
                  <path d="M8 5v5l3-2.5L8 5z" fill="currentColor"/>
                </svg>
                <span>重置</span>
              </button>
            </div>
            <div class="debug-log">
              <div
                v-for="(log, index) in debugLog"
                :key="index"
                :class="['log-item', { active: index === currentStep }]"
              >
                <span class="log-index">{{ index + 1 }}</span>
                <span class="log-expression">{{ log.expression }}</span>
                <span class="log-value">{{ log.value }}</span>
              </div>
            </div>
          </div>
          <div v-else class="debug-empty">
            <span>请点击"启动调试"按钮开始调试</span>
          </div>
        </div>

        <div v-show="expandedFooter.dependencies" class="tab-content dependencies-tab">
          <div class="tab-section-header">
            <span>依赖分析</span>
            <button class="section-action" @click="analyzeDependencies">
              <svg viewBox="0 0 16 16" width="12" height="12">
                <path d="M1 1h14v14H1V1zm1 1v12h12V2H2z" fill="currentColor"/>
                <path d="M5 5l4 4-4 4V5zm1 1v6l3-3-3-3z" fill="currentColor"/>
              </svg>
              <span>分析依赖</span>
            </button>
          </div>
          <div v-if="dependencyTree.length > 0" class="dependency-tree">
            <div v-for="node in dependencyTree" :key="node.id" class="dependency-node">
              <div class="node-header" @click="jumpToDependency(node)">
                <span class="node-icon">{{ node.type === 'formula' ? '📐' : '📊' }}</span>
                <span class="node-name">{{ node.name }}</span>
                <span class="node-type">{{ node.type }}</span>
              </div>
            </div>
          </div>
          <div v-else class="dependency-empty">
            <span>暂无依赖数据</span>
          </div>
        </div>

        <div v-show="expandedFooter.history" class="tab-content history-tab">
          <div class="tab-section-header">
            <span>版本历史</span>
          </div>
          <div v-if="formulaHistory.length > 0" class="history-list">
            <div
              v-for="version in formulaHistory"
              :key="version.id"
              class="history-item"
              @click="restoreFormulaVersion(version)"
            >
              <div class="history-header">
                <span class="history-version">V{{ version.version }}</span>
                <span class="history-date">{{ formatDate(version.createdAt) }}</span>
              </div>
              <div class="history-expression">{{ version.expression?.substring(0, 100) }}...</div>
            </div>
          </div>
          <div v-else class="history-empty">
            <span>暂无历史版本</span>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'FooterTabs',
  props: {
    footerCollapsed: Boolean,
    expandedFooter: Object,
    formulaTemplates: Array,
    mockData: Object,
    previewResult: Object,
    executionTime: Number,
    debugLog: Array,
    currentStep: Number,
    canStep: Boolean,
    dependencyTree: Array,
    formulaHistory: Array
  },
  emits: [
    'toggle-collapse',
    'toggle-footer',
    'generate-mock-data',
    'apply-template',
    'run-simulation',
    'add-input',
    'delete-input',
    'clear-simulation',
    'start-debugger',
    'step-debugger',
    'run-all-debugger',
    'reset-debugger',
    'analyze-dependencies',
    'jump-to-dependency',
    'restore-version'
  ],
  methods: {
    toggleFooterCollapse() {
      this.$emit('toggle-collapse')
    },
    toggleFooter(section) {
      this.$emit('toggle-footer', section)
    },
    generateMockData() {
      this.$emit('generate-mock-data')
    },
    applyTemplateToEditor(template) {
      this.$emit('apply-template', template)
    },
    runSimulationCalculation() {
      this.$emit('run-simulation')
    },
    addSimulationInput() {
      this.$emit('add-input')
    },
    deleteSimulationInput(key) {
      this.$emit('delete-input', key)
    },
    clearSimulation() {
      this.$emit('clear-simulation')
    },
    startDebugger() {
      this.$emit('start-debugger')
    },
    stepDebugger() {
      this.$emit('step-debugger')
    },
    runAllDebugger() {
      this.$emit('run-all-debugger')
    },
    resetDebugger() {
      this.$emit('reset-debugger')
    },
    analyzeDependencies() {
      this.$emit('analyze-dependencies')
    },
    jumpToDependency(node) {
      this.$emit('jump-to-dependency', node)
    },
    restoreFormulaVersion(version) {
      this.$emit('restore-version', version)
    },
    formatDate(date) {
      if (!date) return ''
      return new Date(date).toLocaleString('zh-CN')
    }
  }
}
</script>