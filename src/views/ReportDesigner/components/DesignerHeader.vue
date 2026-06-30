<template>
  <div class="designer-header">
    <div class="header-main">
      <div class="config-inline">
        <div class="config-item">
          <label>公式名称</label>
          <input v-model="formulaData.name" type="text" placeholder="例如：利润率" @change="handleConfigChange" />
        </div>
        <div class="config-item">
          <label>公式编码</label>
          <input v-model="formulaData.code" type="text" placeholder="例如：profitRate" @change="handleConfigChange" />
        </div>
        <div class="config-item">
          <label>分类</label>
          <select v-model="formulaData.category" @change="handleConfigChange">
            <option value="basic">基础公式</option>
            <option value="aggregate">聚合公式</option>
            <option value="logical">条件公式</option>
            <option value="time_analysis">时间分析</option>
            <option value="business">业务公式</option>
          </select>
        </div>
        <div class="config-item">
          <label>返回类型</label>
          <select v-model="formulaData.resultType" @change="handleConfigChange">
            <option value="number">数值</option>
            <option value="string">文本</option>
            <option value="boolean">布尔值</option>
          </select>
        </div>
        <div class="config-item small">
          <label>精度</label>
          <input v-model.number="formulaData.precision" type="number" min="0" max="10" @change="handleConfigChange" />
        </div>
        <div class="config-item">
          <label>格式</label>
          <select v-model="formulaData.displayFormat" @change="handleConfigChange">
            <option value="#,##0.00">两位小数</option>
            <option value="0.00%">百分比</option>
            <option value="￥#,##0.00">货币</option>
          </select>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn-action primary" @click="handleSave" title="保存公式">
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path d="M14 2v12H2V2h12zm-1 1H3v10h10V3z" fill="currentColor"/>
            <path d="M5 7h6v1H5V7zm0-2h6v1H5V5zm0 4h4v1H5V9z" fill="currentColor"/>
          </svg>
          <span>保存</span>
        </button>
        <button class="btn-action" @click="handleValidate" title="验证公式">
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 2a5 5 0 1 1 0 10A5 5 0 0 1 8 3z" fill="currentColor"/>
            <path d="M7 10.5l-2-2 .7-.7 1.3 1.3 3.3-3.3.7.7-4 4z" fill="currentColor"/>
          </svg>
          <span>验证</span>
        </button>
        <button class="btn-action" @click="handlePublish" title="发布公式">
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path d="M8 0L3 5v11h10V5L8 0zm0 2l4 4v8H4V6l4-4z" fill="currentColor"/>
            <path d="M6 9h4v1H6V9zm0 2h4v1H6v-1z" fill="currentColor"/>
          </svg>
          <span>发布</span>
        </button>
      </div>
    </div>

    <div class="header-target-cells">
      <div class="target-cells-header">
        <div class="target-cells-title">
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path d="M1 1h14v14H1V1zm1 1v12h12V2H2z" fill="currentColor"/>
            <path d="M5 5h6v2H5V5zm0 3h6v2H5V8zm0 3h4v2H5v-2z" fill="currentColor"/>
          </svg>
          <span>目标单元格</span>
          <span class="target-cells-badge">{{ formulaData.targetCells?.length || 0 }}</span>
        </div>
        <div class="target-cells-actions">
          <button class="target-action-btn" @click="showTargetCellSelector" title="添加目标单元格">
            <svg viewBox="0 0 16 16" width="12" height="12">
              <path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
            <span>添加目标</span>
          </button>
          <button class="target-action-btn calc-btn" @click="showCalcCellSelector" title="添加计算单元格">
            <svg viewBox="0 0 16 16" width="12" height="12">
              <path d="M1 1h14v14H1V1zm1 1v12h12V2H2z" fill="currentColor"/>
              <path d="M3 5h10v1H3V5zm0 3h7v1H3V8zm0 3h10v1H3v-1z" fill="currentColor"/>
            </svg>
            <span>添加计算</span>
          </button>
          <button class="target-action-btn" @click="clearTargetCells" title="清空目标单元格">
            <svg viewBox="0 0 16 16" width="12" height="12">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" fill="none"/>
            </svg>
            <span>清空</span>
          </button>
        </div>
      </div>
      <div class="target-cells-list">
        <div
          v-for="cell in formulaData.targetCells || []"
          :key="cell.id"
          :class="['target-cell-card', { 'is-target': true }]"
        >
          <div class="target-cell-header">
            <span class="target-cell-icon">🎯</span>
            <span class="target-cell-ref">{{ cell.excelRef }}</span>
            <button class="target-cell-remove" @click="removeTargetCell(cell)" title="移除">
              <svg viewBox="0 0 16 16" width="10" height="10">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" fill="none"/>
              </svg>
            </button>
          </div>
          <div class="target-cell-body">
            <div class="target-cell-title">{{ cell.rowLabel }} × {{ cell.colLabel }}</div>
            <div class="target-cell-meta">
              <span class="target-cell-pos">R{{ cell.row }}C{{ cell.col }}</span>
              <span class="target-cell-field">{{ cell.fieldName || cell.code }}</span>
            </div>
            <div class="target-cell-example" v-if="cell.exampleValue">
              <span class="example-label">示例值:</span>
              <span class="example-value">{{ cell.exampleValue }}</span>
            </div>
          </div>
        </div>
        <div v-if="!formulaData.targetCells || formulaData.targetCells.length === 0" class="target-cells-empty">
          <svg viewBox="0 0 16 16" width="24" height="24">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 2a5 5 0 1 1 0 10A5 5 0 0 1 8 3z" fill="currentColor"/>
            <path d="M7 6h2v1H7V6zm0 2h2v3H7V8z" fill="currentColor"/>
          </svg>
          <span>请选择目标单元格，明确公式作用范围</span>
        </div>
      </div>
    </div>

    <div class="header-description">
      <div class="description-toggle" @click="toggleDescription">
        <svg viewBox="0 0 16 16" width="12" height="12" :class="{ 'rotated': showDescription }">
          <path d="M5 4l6 4-6 4V4z" fill="currentColor"/>
        </svg>
        <span>公式描述</span>
        <span class="hint" v-if="!showDescription && formulaData.description">{{ formulaData.description.substring(0, 50) }}...</span>
      </div>
      <transition name="slide-down">
        <div v-show="showDescription" class="description-content">
          <textarea
            v-model="formulaData.description"
            placeholder="例如：计算企业的利润率，用于分析企业盈利能力"
            rows="2"
            @change="handleConfigChange"
          ></textarea>
        </div>
      </transition>
    </div>

    <div v-if="validationResult" class="validation-result">
      <div :class="['status', validationResult.valid ? 'success' : 'error']">
        {{ validationResult.valid ? '✓ 公式验证通过' : '✗ 公式验证失败' }}
      </div>
      <div v-if="validationResult.errors.length > 0" class="errors">
        <div v-for="error in validationResult.errors" :key="error.type" class="error-item">
          {{ error.message }}
        </div>
      </div>
      <div v-if="validationResult.dependencies.length > 0" class="dependencies">
        <span>依赖指标：</span>
        <span v-for="dep in validationResult.dependencies" :key="dep" class="dep-tag">
          {{ getIndicatorName(dep) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DesignerHeader',
  props: {
    formulaData: Object,
    showDescription: Boolean,
    validationResult: Object
  },
  emits: ['config-change', 'save', 'validate', 'publish', 'toggle-description', 'show-target-cell-selector', 'show-calc-cell-selector', 'clear-target-cells', 'remove-target-cell'],
  methods: {
    handleConfigChange() {
      this.$emit('config-change')
    },
    handleSave() {
      this.$emit('save')
    },
    handleValidate() {
      this.$emit('validate')
    },
    handlePublish() {
      this.$emit('publish')
    },
    toggleDescription() {
      this.$emit('toggle-description')
    },
    showTargetCellSelector() {
      this.$emit('show-target-cell-selector')
    },
    showCalcCellSelector() {
      this.$emit('show-calc-cell-selector')
    },
    clearTargetCells() {
      this.$emit('clear-target-cells')
    },
    removeTargetCell(cell) {
      this.$emit('remove-target-cell', cell)
    },
    getIndicatorName(code) {
      return code
    }
  }
}
</script>