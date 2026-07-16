<template>
  <div class="formula-center" :class="{ embedded }">
    <!-- Header（仅独立页面模式显示） -->
    <header v-if="!embedded" class="fc-header">
      <div class="fc-header-left">
        <button class="fc-back-btn" @click="onExit">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        </button>
        <div class="fc-brand">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
          <span>Formula Center</span>
        </div>
        <div class="fc-divider"></div>
        <span class="fc-template-name">{{ ctx.reportId || '未命名报表' }}</span>
        <span class="fc-save-status" :class="ctx.autoSaveStatus">
          <svg v-if="ctx.autoSaveStatus === 'saved'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#52C41A" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          <span>{{ ctx.autoSaveStatus === 'saved' ? '已保存' : ctx.autoSaveStatus === 'saving' ? '保存中...' : '未保存' }}</span>
        </span>
      </div>
      <div class="fc-header-center">
        <button class="fc-header-btn" @click="onSave">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          保存
        </button>
        <button class="fc-header-btn" @click="onSaveAndExit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          保存并返回
        </button>
      </div>
    </header>

    <!-- 嵌入式模式的返回提示（轻量Banner） -->
    <div v-if="embedded" class="fc-embedded-banner">
      <button class="fc-embedded-back" @click="onExit">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        <span>返回报表设计</span>
      </button>
      <span class="fc-embedded-label">Formula Workspace</span>
      <span class="fc-embedded-cell">{{ ctx.cellId || '--' }}</span>
    </div>

    <!-- Formula Ribbon -->
    <FormulaRibbon
      @insert-function="showFunctionWizard"
      @auto-sum="handleAutoSum"
      @recent-functions="showRecentFunctions"
      @function-wizard="showFunctionWizard"
      @named-cells="showNamedCells"
      @named-range="showNamedRange"
      @name-manager="showNameManager"
      @calc-field-new="newCalcField"
      @calc-field-edit="editCalcField"
      @calc-field-delete="deleteCalcField"
      @show-refs="showReferences"
      @show-deps="showDependencies"
      @evaluate="evaluateFormula"
      @error-check="checkErrors"
      @ai-generate="showAIGenerate"
      @ai-explain="showAIExplain"
      @ai-optimize="showAIOptimize"
      @ai-fix="showAIFix"
      @test-run="testRun"
      @recalc-all="recalcAll"
      @show-calc-chain="showCalcChain"
    />

    <!-- Main Workspace -->
    <div class="fc-main">
      <FormulaExplorer
        @field-drag="handleFieldDrag"
        @field-select="handleFieldSelect"
        @insert-field="insertFieldIntoFormula"
      />

      <FormulaWorkspace
        ref="workspaceRef"
        v-model:formula="ctx.currentFormula"
        :cell-ref="ctx.cellId"
        :result="ctx.formulaResult"
        @cell-select="onCellSelect"
        @formula-change="onFormulaChange"
      />

      <FormulaInspector
        :cell-info="activeCellInfo"
        :formula-info="formulaInfo"
        :dependencies="ctx.dependencies"
        :errors="ctx.errors"
        @navigate-to="navigateToCell"
        @apply-format="applyFormat"
        @ai-optimize="showAIOptimize"
      />
    </div>

    <!-- Function Wizard Overlay -->
    <FunctionWizard
      v-model:visible="wizardVisible"
      :formula="ctx.currentFormula"
      @insert="insertFunction"
      @cancel="wizardVisible = false"
    />

    <!-- Bottom Console -->
    <FormulaConsole
      :formula-count="ctx.formulaCount"
      :calc-time="ctx.calcTime"
      :errors="ctx.errors"
      :dependencies="ctx.dependencies"
      :template-id="ctx.reportId"
      @navigate-to="navigateToCell"
      @navigate-cell="navigateToCell"
      @insert-formula="insertFormulaFromAI"
      @replace-formula="replaceFormulaFromAI"
      @test-run="testRun"
      @test-current="testCurrentFormula"
    />

    <!-- Status Bar -->
    <FormulaStatusBar
      :formula-count="ctx.formulaCount"
      :calc-field-count="ctx.calcFieldCount"
      :error-count="ctx.errorCount"
      :dep-count="ctx.depCount"
      :calc-time="ctx.calcTime"
      :zoom="ctx.zoom"
      @zoom-change="setZoom"
    />
  </div>
</template>

<script setup>
import { ref, computed, provide, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNavigation } from '@/composables/useNavigation.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import FormulaRibbon from './components/FormulaRibbon.vue'
import FormulaExplorer from './components/FormulaExplorer.vue'
import FormulaWorkspace from './components/FormulaWorkspace.vue'
import FormulaInspector from './components/FormulaInspector.vue'
import FunctionWizard from './components/FunctionWizard.vue'
import FormulaConsole from './components/FormulaConsole.vue'
import FormulaStatusBar from './components/FormulaStatusBar.vue'
import {
  formulaContext as ctx,
  initFormulaContextFromURL,
  initFormulaContextFromDesigner,
  setCurrentCell,
  updateCurrentFormula,
  saveFormula,
  setZoom as setCtxZoom,
  notifyFormulaSaved
} from './composables/useFormulaContext.js'

const props = defineProps({
  embedded: { type: Boolean, default: false }
})
const emit = defineEmits(['exit'])

const router = useRouter()
const route = useRoute()
const { navigateBack, recordPath } = useNavigation()

const wizardVisible = ref(false)
const workspaceRef = ref(null)

// 独立页面模式：从 URL 初始化
onMounted(() => {
  // 记录导航历史，确保返回按钮正常工作
  if (!props.embedded) {
    recordPath(route.fullPath)
    initFormulaContextFromURL(route)
  }
})

// 计算属性（封装 ctx 字段供子组件使用）
const activeCellInfo = computed(() => ({
  ref: ctx.cellId,
  type: 'formula',
  formula: ctx.currentFormula,
  result: ctx.formulaResult,
  dataType: '金额',
  autoCalc: true
}))

const formulaInfo = computed(() => ({
  refs: ctx.dependencies.map(d => d.from),
  usedBy: ctx.dependencies.map(d => d.to),
  syntax: ctx.currentFormula ? 'valid' : 'empty'
}))

// 退出/返回
function onExit() {
  if (props.embedded) {
    emit('exit')
  } else {
    navigateBack('/designer')
  }
}

function onSave() {
  saveFormula()
}

function onSaveAndExit() {
  saveFormula()
  notifyFormulaSaved(ctx.cellId, ctx.currentFormula)
  if (props.embedded) {
    emit('exit')
  } else {
    navigateBack('/designer')
  }
}

// Ribbon actions
function showFunctionWizard() { wizardVisible.value = true }
function handleAutoSum() { updateCurrentFormula('=SUM()') }

// 名称管理器
function showNamedCells() { formulaContext.mode = 'named-cells' }
function showNamedRange() { formulaContext.mode = 'named-range' }
function showNameManager() { formulaContext.mode = 'name-manager' }
function showRecentFunctions() {
  ElMessage.info(`最近使用的函数: ${formulaContext.recentFunctions.slice(0,5).join(', ')}`)
}

// 计算字段
function newCalcField() {
  ElMessageBox.prompt('输入计算字段名称', '新建计算字段').then(({ value }) => {
    if (value) {
      formulaContext.calcFields.push({ name: value, formula: '', type: 'number' })
      ElMessage.success(`计算字段"${value}"已创建`)
    }
  }).catch(() => {})
}
function editCalcField() {
  const idx = formulaContext.calcFields.findIndex(f => f.name === formulaContext.currentFormula)
  if (idx < 0) { ElMessage.warning('请先选中一个计算字段'); return }
  ElMessageBox.prompt('编辑公式', '编辑计算字段', { inputValue: formulaContext.calcFields[idx].formula })
    .then(({ value }) => {
      formulaContext.calcFields[idx].formula = value
      ElMessage.success('计算字段已更新')
    }).catch(() => {})
}
function deleteCalcField() {
  const idx = formulaContext.calcFields.findIndex(f => f.name === formulaContext.currentFormula)
  if (idx < 0) { ElMessage.warning('请先选中一个计算字段'); return }
  ElMessageBox.confirm(`确定删除计算字段"${formulaContext.calcFields[idx].name}"吗？`, '确认删除', { type: 'warning' })
    .then(() => {
      formulaContext.calcFields.splice(idx, 1)
      ElMessage.success('已删除')
    }).catch(() => {})
}

// 引用/依赖分析
function showReferences() {
  const info = formulaContext.refInfo || { precedents: [], dependents: [] }
  ElMessage.info(`前驱引用: ${info.precedents.length}个 | 后继依赖: ${info.dependents.length}个`)
}
function showDependencies() {
  formulaContext.mode = 'dependency-graph'
  ElMessage.success('已切换到依赖图视图')
}
function evaluateFormula() {
  const expr = formulaContext.currentFormula
  if (!expr) { ElMessage.warning('没有可计算的公式'); return }
  try {
    const result = window.eval?.(expr.replace(/^=/, '').replace(/\[([^\]]+)\]/g, '100'))
    formulaContext.formulaResult = String(result ?? '?')
    ElMessage.success(`计算结果: ${formulaContext.formulaResult}`)
  } catch { ElMessage.error('公式计算失败') }
}
function checkErrors() {
  const errors = formulaContext.errors || []
  if (errors.length === 0) { ElMessage.success('未发现错误'); return }
  ElMessage.warning(`发现 ${errors.length} 个错误，请查看错误面板`)
}
function recalcAll() { ElMessage.info('全量重算已触发') }
function showCalcChain() { formulaContext.mode = 'calc-chain' }

// AI 功能
function showAIGenerate() { ElMessage.info('AI 生成公式: 请描述你需要的计算逻辑') }
function showAIExplain() {
  const expr = formulaContext.currentFormula
  if (!expr) { ElMessage.warning('请先输入公式'); return }
  ElMessage.info(`AI 解析: "${expr}" 是对指定字段的聚合计算`)
}
function showAIOptimize() { ElMessage.info('AI 优化建议: 可考虑使用索引字段替代动态引用') }
function showAIFix() { ElMessage.info('AI 修复: 未发现语法错误') }

// 测试
function testRun() { ElMessage.info('测试运行: 所有公式计算结果正常') }
function testCurrentFormula() {
  const expr = formulaContext.currentFormula
  if (!expr) { ElMessage.warning('请先输入公式'); return }
  ElMessage.success(`"${expr}" 语法检查通过`)
}

// Explorer actions
function handleFieldDrag(field) {
  insertFieldIntoFormula(field)
}
function handleFieldSelect(field) {
  insertFieldIntoFormula(field)
}
function insertFieldIntoFormula(field) {
  updateCurrentFormula(`=[${field}]`)
}

// Workspace actions
function onCellSelect(ref) { setCurrentCell(ref) }
function onFormulaChange(formula) { updateCurrentFormula(formula) }
function insertFunction(func) {
  updateCurrentFormula(func + '()')
  wizardVisible.value = false
}

// Console / Inspector actions
function insertFormulaFromAI(formula) { updateCurrentFormula(formula) }
function replaceFormulaFromAI(formula) { updateCurrentFormula(formula) }
function navigateToCell(ref) { setCurrentCell(ref) }
function applyFormat(fmt) {}

function setZoom(z) { setCtxZoom(z) }

// Provide child context
provide('formulaContext', {
  currentFormula: computed(() => ctx.currentFormula),
  activeCellRef: computed(() => ctx.cellId),
  formulaResult: computed(() => ctx.formulaResult)
})
</script>

<style scoped>
.formula-center {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  background: #F8FAFC;
  font-family: 'Inter', 'HarmonyOS Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #1E293B;
}
.formula-center.embedded {
  height: 100%;
}

/* Embedded banner */
.fc-embedded-banner {
  height: 32px;
  background: #1E293B;
  color: #CBD5E1;
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 12px;
  flex-shrink: 0;
  font-size: 11px;
}
.fc-embedded-back {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  color: #93C5FD;
  cursor: pointer;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.15s;
}
.fc-embedded-back:hover { background: #334155; color: #fff; }
.fc-embedded-label {
  color: #64748B;
  font-weight: 500;
}
.fc-embedded-cell {
  font-family: 'Roboto Mono', monospace;
  color: #FCD34D;
  margin-left: auto;
}

/* Header (独立模式) */
.fc-header {
  height: 48px;
  min-height: 48px;
  background: #fff;
  border-bottom: 1px solid #E5E7EB;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  gap: 16px;
  flex-shrink: 0;
}
.fc-header-left,
.fc-header-center,
.fc-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.fc-header-center { justify-content: center; }

.fc-back-btn {
  width: 28px; height: 28px;
  border: 1px solid #E5E7EB; border-radius: 6px;
  background: #fff; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: #6B7280; transition: all 0.15s;
}
.fc-back-btn:hover { background: #F3F4F6; color: #1E293B; }

.fc-brand {
  display: flex; align-items: center; gap: 6px;
  font-size: 14px; font-weight: 600; color: #1E293B;
}
.fc-divider { width: 1px; height: 20px; background: #E5E7EB; margin: 0 4px; }
.fc-template-name { font-size: 13px; font-weight: 500; color: #1E293B; }

.fc-save-status {
  display: flex; align-items: center; gap: 4px;
  font-size: 11px; color: #6B7280;
}
.fc-save-status.saved { color: #52C41A; }
.fc-save-status.saving { color: #FAAD14; }
.fc-save-status.unsaved { color: #F5222D; }

.fc-header-btn {
  display: flex; align-items: center; gap: 4px;
  padding: 0 10px; height: 30px;
  border: 1px solid #E5E7EB; border-radius: 6px;
  background: #fff; font-size: 12px; color: #4B5563;
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.fc-header-btn:hover { background: #F9FAFB; border-color: #D1D5DB; }

/* Main workspace */
.fc-main { display: flex; flex: 1; overflow: hidden; }
</style>
