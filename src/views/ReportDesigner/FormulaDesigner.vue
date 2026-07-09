<template>
  <div class="Pixso-frame-4_436 formula-designer">
    <div id="4_449" class="Pixso-frame-4_449">
      <div class="frame-content-4_449">
        <div id="4_450" class="stroke-wrapper-4_450">
          <div class="Pixso-frame-4_450">
            <div class="frame-content-4_450">
              <div id="4_451" class="stroke-wrapper-4_451">
                <div class="Pixso-frame-4_451">
                  <div class="frame-content-4_451">
                    <p id="4_452" class="Pixso-paragraph-4_452">{{ "函数库" }}</p>
                  </div>
                </div>
                <div class="stroke-4_451"></div>
              </div>
              <div id="4_453" class="stroke-wrapper-4_453">
                <div class="Pixso-frame-4_453">
                  <div class="frame-content-4_453">
                    <div id="4_454" class="Pixso-vector-4_454"></div>
                    <input
                      type="text"
                      v-model="functionSearch"
                      class="function-search-input"
                      placeholder="搜索函数"
                      @input="searchFunctions"
                    />
                  </div>
                </div>
                <div class="stroke-4_453"></div>
              </div>
              <div id="4_458" class="stroke-wrapper-4_458">
                <div class="Pixso-frame-4_458">
                  <div class="frame-content-4_458">
                    <button
                      v-for="cat in functionCategories"
                      :key="cat.key"
                      class="function-cat-btn"
                      :class="{ active: functionFilter === cat.key }"
                      @click="setFunctionFilter(cat.key)"
                    >
                      {{ cat.label }}
                    </button>
                  </div>
                </div>
                <div class="stroke-4_458"></div>
              </div>
              <div id="4_462" class="Pixso-frame-4_462">
                <div class="frame-content-4_462">
                  <div v-for="func in filteredFunctions" :key="func.name" class="function-item" @click="handleFunctionClick(func)">
                    <div class="function-item-name">{{ func.name }}</div>
                    <div class="function-item-desc">{{ func.description }}</div>
                  </div>
                  <div v-if="filteredFunctions.length === 0" class="function-empty">暂无匹配函数</div>
                </div>
              </div>
            </div>
          </div>
          <div class="stroke-4_450"></div>
        </div>

        <div id="4_516" class="Pixso-frame-4_516">
          <div class="frame-content-4_516">
            <div id="4_517" class="stroke-wrapper-4_517">
              <div class="Pixso-frame-4_517">
                <div class="frame-content-4_517">
                  <p id="4_518" class="Pixso-paragraph-4_518">{{ "公式编辑器" }}</p>
                  <div id="4_519" class="Pixso-frame-4_519"></div>
                  <div id="4_520" class="Pixso-frame-4_520">
                    <div id="4_521" class="stroke-wrapper-4_521">
                      <div class="Pixso-frame-4_521">
                        <div class="frame-content-4_521">
                          <button class="operator-btn" @click="insertOperator('-')">-</button>
                          <button class="operator-btn" @click="insertOperator('+')">+</button>
                          <button class="operator-btn" @click="insertOperator('*')">×</button>
                          <button class="operator-btn" @click="insertOperator('/')">÷</button>
                          <button class="operator-btn" @click="insertOperator('=')">=</button>
                          <button class="operator-btn" @click="insertOperator('>')">></button>
                          <button class="operator-btn" @click="insertOperator('<')"><</button>
                        </div>
                      </div>
                      <div class="stroke-4_521"></div>
                    </div>
                    <div id="4_529" class="stroke-wrapper-4_529">
                      <div class="Pixso-frame-4_529">
                        <div class="frame-content-4_529">
                          <button class="tool-btn" @click="undoFormula"><div id="4_530" class="Pixso-vector-4_530"></div></button>
                          <button class="tool-btn" @click="redoFormula"><div id="4_533" class="Pixso-vector-4_533"></div></button>
                        </div>
                      </div>
                      <div class="stroke-4_529"></div>
                    </div>
                    <div id="4_536" class="stroke-wrapper-4_536">
                      <div class="Pixso-frame-4_536" @click="clearFormula">
                        <div class="frame-content-4_536">
                          <div id="4_537" class="Pixso-vector-4_537"></div>
                          <p id="4_543" class="Pixso-paragraph-4_543">{{ "清空" }}</p>
                        </div>
                      </div>
                      <div class="stroke-4_536"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="stroke-4_517"></div>
            </div>

            <div id="4_544" class="Pixso-frame-4_544">
              <div class="frame-content-4_544">
                <div id="4_545" class="stroke-wrapper-4_545">
                  <div class="Pixso-frame-4_545">
                    <div class="frame-content-4_545">
                      <div id="4_546" class="Pixso-frame-4_546"></div>
                      <div id="4_547" class="Pixso-frame-4_547">
                        <div class="frame-content-4_547">
                          <input
                            type="text"
                            v-model="formulaData.expression"
                            class="formula-input"
                            @input="handleFormulaChange"
                            placeholder="输入公式..."
                          />
                        </div>
                      </div>
                      <div id="4_549" class="Pixso-frame-4_549"></div>
                    </div>
                  </div>
                  <div class="stroke-4_545"></div>
                </div>

                <div id="4_550" class="stroke-wrapper-4_550" v-if="selectedFunction">
                  <div class="Pixso-frame-4_550">
                    <div class="frame-content-4_550">
                      <p id="4_551" class="Pixso-paragraph-4_551">{{ selectedFunction.syntax || '函数语法' }}</p>
                      <p id="4_552" class="Pixso-paragraph-4_552">{{ selectedFunction.description || '函数说明' }}</p>
                      <div id="4_553" class="Pixso-frame-4_553">
                        <div class="frame-content-4_553">
                          <p id="4_554" class="Pixso-paragraph-4_554">{{ "参数说明：" }}</p>
                          <div v-for="(param, idx) in selectedFunction.parameters" :key="idx" class="Pixso-frame-4_555">
                            <div class="frame-content-4_555">
                              <p id="4_556" class="Pixso-paragraph-4_556">{{ param.name }}</p>
                              <p id="4_557" class="Pixso-paragraph-4_557">{{ param.description }}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p id="4_558" class="Pixso-paragraph-4_558">{{ "示例：" + (selectedFunction.example || '') }}</p>
                    </div>
                  </div>
                  <div class="stroke-4_550"></div>
                </div>

                <div id="4_559" class="stroke-wrapper-4_559">
                  <div class="Pixso-frame-4_559">
                    <div class="frame-content-4_559">
                      <div id="4_560" class="Pixso-frame-4_560">
                        <div class="frame-content-4_560">
                          <p id="4_561" class="Pixso-paragraph-4_561">{{ "语法验证" }}</p>
                          <div id="4_562" class="stroke-wrapper-4_562">
                            <div class="Pixso-frame-4_562" @click="handleValidate">
                              <div class="frame-content-4_562">
                                <div id="4_563" class="Pixso-vector-4_563"></div>
                                <p id="4_568" class="Pixso-paragraph-4_568">{{ "重新验证" }}</p>
                              </div>
                            </div>
                            <div class="stroke-4_562"></div>
                          </div>
                        </div>
                      </div>
                      <div id="4_569" class="Pixso-frame-4_569">
                        <div class="frame-content-4_569">
                          <div id="4_570" class="stroke-wrapper-4_570">
                            <div class="Pixso-frame-4_570" :class="{ 'validation-success': formulaStatus === 'valid', 'validation-error': formulaStatus === 'invalid' || formulaStatus === 'error' }">
                              <div class="frame-content-4_570">
                                <div id="4_571" class="Pixso-frame-4_571"></div>
                                <p id="4_572" class="Pixso-paragraph-4_572">{{ formulaStatusText || '请输入公式' }}</p>
                              </div>
                            </div>
                            <div class="stroke-4_570"></div>
                          </div>
                          <div id="4_573" class="Pixso-frame-4_573" v-if="validationResult && (validationResult.errors?.length || validationResult.warnings?.length)">
                            <div class="frame-content-4_573">
                              <div id="4_574" class="Pixso-vector-4_574"></div>
                              <p id="4_578" class="Pixso-paragraph-4_578">{{ validationResult.errors?.[0]?.message || validationResult.warnings?.[0]?.message || '验证完成' }}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="stroke-4_559"></div>
                </div>

                <div id="4_579" class="stroke-wrapper-4_579">
                  <div class="Pixso-frame-4_579">
                    <div class="frame-content-4_579">
                      <div id="4_580" class="Pixso-frame-4_580">
                        <div class="frame-content-4_580">
                          <p id="4_581" class="Pixso-paragraph-4_581">{{ "计算结果（预览）" }}</p>
                          <p id="4_582" class="Pixso-paragraph-4_582">{{ previewResult || '-' }}</p>
                        </div>
                      </div>
                      <div id="4_583" class="Pixso-frame-4_583"></div>
                      <div id="4_584" class="Pixso-frame-4_584">
                        <div class="frame-content-4_584">
                          <p id="4_585" class="Pixso-paragraph-4_585">{{ "当前公式" }}</p>
                          <p id="4_586" class="Pixso-paragraph-4_586">{{ formulaData.expression || '无' }}</p>
                        </div>
                      </div>
                      <div id="4_587" class="Pixso-frame-4_587"></div>
                      <div id="4_588" class="Pixso-frame-4_588">
                        <div class="frame-content-4_588">
                          <p id="4_589" class="Pixso-paragraph-4_589">{{ "数据类型" }}</p>
                          <p id="4_590" class="Pixso-paragraph-4_590">{{ formulaData.dataType || '数值 (Number)' }}</p>
                        </div>
                      </div>
                      <div id="4_587" class="Pixso-frame-4_587"></div>
                      <div id="4_588" class="Pixso-frame-4_588">
                        <div class="frame-content-4_588">
                          <label class="apply-to-row-label">
                            <input type="checkbox" v-model="applyToRow" />
                            <span>应用到整行（所有数据列）</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="stroke-4_579"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div id="4_596" class="stroke-wrapper-4_596">
          <div class="Pixso-frame-4_596">
            <div class="frame-content-4_596">
              <div id="4_597" class="stroke-wrapper-4_597">
                <div class="Pixso-frame-4_597">
                  <div class="frame-content-4_597">
                    <p id="4_598" class="Pixso-paragraph-4_598">{{ "可用字段" }}</p>
                  </div>
                </div>
                <div class="stroke-4_597"></div>
              </div>
              <div id="4_599" class="stroke-wrapper-4_599">
                <div class="Pixso-frame-4_599">
                  <div class="frame-content-4_599">
                    <button
                      class="field-tab-btn"
                      :class="{ active: leftPanelTab === 'indicators' }"
                      @click="leftPanelTab = 'indicators'"
                    >数据字段</button>
                    <button
                      class="field-tab-btn"
                      :class="{ active: leftPanelTab === 'cells' }"
                      @click="leftPanelTab = 'cells'"
                    >公式字段</button>
                    <button class="field-tab-btn">参数</button>
                  </div>
                </div>
                <div class="stroke-4_599"></div>
              </div>
              <div id="4_606" class="stroke-wrapper-4_606">
                <div class="Pixso-frame-4_606">
                  <div class="frame-content-4_606">
                    <div id="4_607" class="Pixso-vector-4_607"></div>
                    <input
                      type="text"
                      class="field-search-input"
                      :value="leftPanelTab === 'indicators' ? indicatorSearch : cellSearch"
                      :placeholder="leftPanelTab === 'indicators' ? '搜索字段' : '搜索单元格 (如 A1)'"
                      @input="e => handleFieldSearch(e.target.value)"
                    />
                  </div>
                </div>
                <div class="stroke-4_606"></div>
              </div>
              <div id="4_611" class="Pixso-frame-4_611">
                <div class="frame-content-4_611">
                  <div v-if="leftPanelTab === 'indicators'" class="field-list">
                    <div v-for="indicator in allIndicators" :key="indicator.id" class="field-item" @click="handleIndicatorClick(indicator)">
                      <div class="field-item-icon" :class="'field-icon-' + (indicator.type || 'default')">
                        {{ indicator.type === 'row' ? 'R' : indicator.type === 'col' ? 'C' : indicator.type === 'metric' ? '#' : 'F' }}
                      </div>
                      <div class="field-item-info">
                        <div class="field-item-name">{{ indicator.name }}</div>
                        <div class="field-item-type">{{ indicator.type === 'row' ? '行维度' : indicator.type === 'col' ? '列维度' : indicator.type === 'metric' ? '指标' : (indicator.type || '字段') }}</div>
                      </div>
                    </div>
                    <div v-if="allIndicators.length === 0" class="field-empty">暂无数据字段</div>
                  </div>
                  <div v-else class="field-list">
                    <!-- 选择单元格按钮 -->
                    <div class="cell-picker-trigger">
                      <button class="cell-picker-open-btn" @click="openCellPicker">
                        <span class="cell-picker-open-icon">⊞</span>
                        <span>在报表中选择单元格</span>
                      </button>
                      <p class="cell-picker-open-hint">点击打开报表，框选需要引用的单元格范围</p>
                    </div>

                    <div v-if="cellTreeData.length === 0 && flatCells.length === 0" class="field-empty">暂无公式字段</div>
                  </div>
                </div>
              </div>
              <div id="4_694" class="stroke-wrapper-4_694">
                <div class="Pixso-frame-4_694">
                  <div class="frame-content-4_694">
                    <p id="4_695" class="Pixso-paragraph-4_695">{{ "当前字段计算结果" }}</p>
                    <p id="4_696" class="Pixso-paragraph-4_696">{{ previewResult || '-' }}</p>
                  </div>
                </div>
                <div class="stroke-4_694"></div>
              </div>
            </div>
          </div>
          <div class="stroke-4_596"></div>
        </div>
      </div>
    </div>

    <div v-if="notification" class="notification" :class="notification.type">
      <span class="notification-icon">{{ notification.icon }}</span>
      <span class="notification-message">{{ notification.message }}</span>
    </div>

    <!-- 单元格选择弹窗 -->
    <div v-if="cellPickerVisible" class="cell-picker-overlay" @click="closeCellPicker">
      <div class="cell-picker-dialog" @click.stop>
        <div class="cell-picker-header">
          <span class="cell-picker-title">选择单元格</span>
          <button class="cell-picker-close" @click="closeCellPicker">×</button>
        </div>
        <div class="cell-picker-body">
          <div class="cell-picker-hint">
            点击选择单个单元格，按住 Shift 点击选择范围
          </div>
          <div class="cell-picker-table-wrapper">
            <table class="cell-picker-table">
              <thead>
                <tr>
                  <th class="picker-corner"></th>
                  <th v-for="col in matrixColumns" :key="col" class="picker-col-header">{{ col }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, rIdx) in cellMatrix" :key="row.rowLabel">
                  <td class="picker-row-header">{{ row.rowLabel }}</td>
                  <td
                    v-for="(cell, cIdx) in row.cells"
                    :key="cell.id"
                    class="picker-cell"
                    :class="{
                      'picker-cell-selected': isCellInRange(cell),
                      'picker-cell-range-start': isRangeStart(cell),
                      'picker-cell-range-end': isRangeEnd(cell)
                    }"
                    @click="handlePickerCellClick(cell, $event)"
                  >
                    {{ cell.excelRef }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="cell-picker-footer">
          <span v-if="selectedRangeText" class="cell-picker-range">已选择: {{ selectedRangeText }}</span>
          <button class="cell-picker-btn cell-picker-btn-primary" @click="confirmCellPicker" :disabled="!selectedRangeText">确定</button>
          <button class="cell-picker-btn" @click="closeCellPicker">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useFormulaDesigner } from './composables/useFormulaDesigner'
import { useFormulaIndicators } from './composables/useFormulaIndicators'
import { useFormulaEditor } from './composables/useFormulaEditor'
import { useFormulaFunctions } from './composables/useFormulaFunctions'
import { useFormulaCells } from './composables/useFormulaCells'
import { toExcelRef } from '@/utils/excelRef.js'

export default {
  name: 'FormulaDesigner',
  props: {
    indicators: { type: Array, default: () => [] },
    template: { type: Object, default: () => ({}) },
    cells: { type: Array, default: () => [] },
    initialFormula: { type: Object, default: () => ({}) }
  },
  emits: ['change', 'save', 'publish', 'close'],
  setup(props, { emit }) {
    const {
      formulaData,
      showDescription,
      validationResult,
      formulaStatus,
      formulaStatusText,
      notification,
      executionTime,
      previewResult,
      debugLog,
      dependencyTree,
      formulaHistory,
      mockData,
      formulaTemplates,
      activeTab,
      footerCollapsed,
      currentStep,
      canStep,
      leftWidth,
      rightWidth,
      expandedFooter,
      handleConfigChange,
      handleSave,
      handleValidate,
      handlePublish,
      toggleDescription,
      generateMockData,
      runPreview,
      analyzeDependencies,
      jumpToDependency,
      restoreVersion,
      startResize,
      toggleFooter,
      switchTab,
      toggleFooterCollapse,
      refreshReferences,
      addSimulationInput,
      deleteSimulationInput,
      clearSimulation,
      runSimulationCalculation,
      startDebugger,
      stepDebugger,
      resetDebugger,
      runAllDebugger,
      applyTemplateToEditor,
      restoreFormulaVersion,
      showNotification,
      clearTargetCells,
      removeTargetCell
    } = useFormulaDesigner(props, emit)

    const {
      indicatorSearch,
      allIndicators,
      recentIndicators,
      favoriteIndicators,
      systemVariables,
      expandedCategories,
      indicatorCategories,
      indicatorTooltip,
      tooltipStyle,
      initializeIndicators,
      searchIndicators,
      toggleCategory,
      addToRecentIndicators,
      isFavorite,
      toggleFavorite,
      showIndicatorTooltip,
      showVariableTooltip,
      hideIndicatorTooltip,
      insertVariable
    } = useFormulaIndicators(props)

    const {
      monacoLoading,
      cursorPosition,
      editorTheme,
      isFullscreen,
      loadMonacoEditor,
      insertIndicator,
      insertFunction,
      insertOperator,
      insertParentheses,
      insertBracket,
      insertBraces,
      insertComma,
      formatFormula,
      clearFormula,
      copyFormula,
      undoFormula,
      redoFormula,
      findInFormula,
      replaceInFormula,
      toggleFullscreen,
      toggleTheme,
      applyTemplate,
      insertCell,
      getMonacoEditor
    } = useFormulaEditor(formulaData, handleConfigChange, showNotification)

    const {
      functionSearch,
      allFunctions,
      displayFunctions,
      recentFunctions,
      favoriteFunctions,
      selectedFunction,
      functionFilter,
      functionTooltip,
      expandedFunctionCategories,
      functionCategories,
      initializeFunctions,
      searchFunctions,
      toggleFunctionCategory,
      showFunctionDetail,
      closeFunctionDetail,
      addToRecentFunctions,
      isFunctionFavorite,
      toggleFunctionFavorite,
      showFunctionTooltip,
      hideFunctionTooltip,
      setFunctionFilter
    } = useFormulaFunctions(showNotification)

    const {
      leftPanelTab,
      cellSearch,
      cellTreeData,
      cellTooltip,
      cellSelectorVisible,
      initializeCellData,
      showTargetCellSelector,
      showCalcCellSelector,
      handleCellSelectorClose,
      handleCellSelectorSelect,
      handleCellSelectorConfirm,
      toggleTargetCell,
      isTargetCell,
      isInFormula,
      toggleCellTreeNode,
      showCellTooltip,
      hideCellTooltip,
      searchCells
    } = useFormulaCells(props, formulaData)

    function cellMatchesSearch(cell) {
      if (!cellSearch.value) return true
      const keyword = cellSearch.value.toLowerCase()
      return (
        (cell.excelRef || '').toLowerCase().includes(keyword) ||
        (cell.rowLabel || '').toLowerCase().includes(keyword) ||
        (cell.colLabel || '').toLowerCase().includes(keyword) ||
        (cell.description || '').toLowerCase().includes(keyword)
      )
    }

    const flatCells = computed(() => {
      const list = []
      ;(cellTreeData.value || []).forEach(rowNode => {
        ;(rowNode.cells || []).forEach(cell => {
          if (cellMatchesSearch(cell)) list.push(cell)
        })
      })
      return list
    })

    const matrixColumns = computed(() => {
      const set = new Set()
      ;(cellTreeData.value || []).forEach(rowNode => {
        ;(rowNode.cells || []).forEach(cell => {
          if (cellMatchesSearch(cell)) set.add(cell.colLabel)
        })
      })
      return Array.from(set)
    })

    const cellMatrix = computed(() => {
      return (cellTreeData.value || []).map(rowNode => ({
        rowLabel: rowNode.label,
        cells: (rowNode.cells || []).filter(cellMatchesSearch)
      })).filter(row => row.cells.length > 0)
    })



    const filteredFunctions = computed(() => {
      const source = displayFunctions.value || allFunctions.value || []
      let filtered = source
      if (functionFilter.value && functionFilter.value !== 'all') {
        filtered = filtered.filter(f => f.category === functionFilter.value)
      }
      if (functionSearch.value) {
        const searchLower = functionSearch.value.toLowerCase()
        filtered = filtered.filter(f =>
          f.name.toLowerCase().includes(searchLower) ||
          f.description.toLowerCase().includes(searchLower)
        )
      }
      return filtered.length > 0 ? filtered : recentFunctions.value
    })

    function handleIndicatorClick(indicator) {
      addToRecentIndicators(indicator)
      insertIndicator(indicator)
      showNotification('success', '✓', `已插入指标: ${indicator.name}`)
    }

    function handleFieldSearch(value) {
      if (leftPanelTab.value === 'indicators') {
        indicatorSearch.value = value
        searchIndicators()
      } else {
        cellSearch.value = value
        searchCells()
      }
    }

    function handleFunctionClick(func) {
      addToRecentFunctions(func)
      insertFunction(func)
      showNotification('success', '✓', `已插入函数: ${func.name}`)
      showFunctionDetail(func)
    }

    function handleFormulaChange() {
      refreshReferences()
    }

    // ==================== 单元格选择弹窗 ====================

    const cellPickerVisible = ref(false)
    const rangeStart = ref(null)
    const rangeEnd = ref(null)

    const selectedRangeText = computed(() => {
      if (!rangeStart.value) return ''
      if (!rangeEnd.value || rangeStart.value.id === rangeEnd.value.id) {
        return rangeStart.value.excelRef
      }
      const startRow = Math.min(rangeStart.value.row, rangeEnd.value.row)
      const endRow = Math.max(rangeStart.value.row, rangeEnd.value.row)
      const startCol = Math.min(rangeStart.value.col, rangeEnd.value.col)
      const endCol = Math.max(rangeStart.value.col, rangeEnd.value.col)
      const startRef = toExcelRef(startRow + 1, startCol + 1)
      const endRef = toExcelRef(endRow + 1, endCol + 1)
      return startRef === endRef ? startRef : `${startRef}:${endRef}`
    })

    function openCellPicker() {
      cellPickerVisible.value = true
      rangeStart.value = null
      rangeEnd.value = null
    }

    function closeCellPicker() {
      cellPickerVisible.value = false
      rangeStart.value = null
      rangeEnd.value = null
    }

    function handlePickerCellClick(cell, event) {
      if (event.shiftKey && rangeStart.value) {
        rangeEnd.value = cell
      } else {
        rangeStart.value = cell
        rangeEnd.value = null
      }
    }

    function isCellInRange(cell) {
      if (!rangeStart.value) return false
      if (!rangeEnd.value) return cell.id === rangeStart.value.id
      const minRow = Math.min(rangeStart.value.row, rangeEnd.value.row)
      const maxRow = Math.max(rangeStart.value.row, rangeEnd.value.row)
      const minCol = Math.min(rangeStart.value.col, rangeEnd.value.col)
      const maxCol = Math.max(rangeStart.value.col, rangeEnd.value.col)
      return cell.row >= minRow && cell.row <= maxRow && cell.col >= minCol && cell.col <= maxCol
    }

    function isRangeStart(cell) {
      return rangeStart.value && cell.id === rangeStart.value.id
    }

    function isRangeEnd(cell) {
      return rangeEnd.value && cell.id === rangeEnd.value.id
    }

    function confirmCellPicker() {
      const rangeText = selectedRangeText.value
      if (rangeText) {
        insertCell({ excelRef: rangeText })
        showNotification('success', '✓', `已插入范围: ${rangeText}`)
      }
      closeCellPicker()
    }

    /**
     * 供父组件（el-dialog footer 按钮）调用的"确认并应用"方法
     * 仅做验证：valid 才触发 save + close
     */
    const applyToRow = ref(false)
    function confirmAndApply() {
      handleValidate()
      if (formulaStatus.value === 'valid') {
        handleSave()
        emit('close', { applyToRow: applyToRow.value })
      }
    }

    onMounted(() => {
      initializeIndicators()
      initializeFunctions()
      initializeCellData()
      refreshReferences()
    })

    onBeforeUnmount(() => {
      const editor = getMonacoEditor()
      if (editor) {
        editor.dispose()
      }
    })

    watch(() => formulaData.expression, () => {
      refreshReferences()
    })

    return {
      formulaData,
      showDescription,
      validationResult,
      formulaStatus,
      formulaStatusText,
      notification,
      previewResult,
      selectedFunction,
      functionSearch,
      functionFilter,
      functionCategories,
      filteredFunctions,
      indicatorSearch,
      allIndicators,
      leftPanelTab,
      cellTreeData,
      flatCells,
      matrixColumns,
      cellMatrix,
      cellSearch,
      handleIndicatorClick,
      handleFunctionClick,
      handleFormulaChange,
      handleFieldSearch,
      confirmAndApply,
      handleValidate,
      undoFormula,
      redoFormula,
      clearFormula,
      insertOperator,
      insertCell,
      searchFunctions,
      searchIndicators,
      searchCells,
      setFunctionFilter,
      cellPickerVisible,
      selectedRangeText,
      openCellPicker,
      closeCellPicker,
      confirmCellPicker,
      handlePickerCellClick,
      isCellInRange,
      isRangeStart,
      isRangeEnd,
      applyToRow
    }
  },
  // 暴露给父组件（el-dialog footer 按钮）调用的方法
  expose: ['confirmAndApply', 'applyToRow']
}
</script>

<style>
@import './formula-designer.css';
</style>

<style scoped>
.formula-designer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f6f8;
  font-family: "Noto Sans SC-Regular", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* ==================== 顶部导航栏 ==================== */
.Pixso-frame-4_437 {
  height: 48px;
  padding: 0 16px;
  border-bottom: 1px solid #e4e6eb;
}
.frame-content-4_437 {
  gap: 8px;
}

/* ==================== 主内容区域 ==================== */
.Pixso-frame-4_449 {
  flex: 1;
  display: flex;
  overflow: hidden;
}
.frame-content-4_449 {
  display: flex;
  width: 100%;
  height: 100%;
}
.Pixso-frame-4_439 {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: #1264e8;
}
.Pixso-paragraph-4_440 {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
}
.Pixso-frame-4_441 {
  width: 1px;
  height: 20px;
  background: #d9dce3;
}

/* 取消按钮 - 白底+边框 */
.Pixso-frame-4_445 {
  height: 32px;
  padding: 0 16px;
  border-radius: 4px;
  background: #ffffff;
  border: 1px solid #d9dce3;
  cursor: pointer;
  transition: all 0.2s;
}
.Pixso-frame-4_445:hover {
  background: #f5f6f8;
}
.Pixso-paragraph-4_446 {
  font-size: 13px;
  font-weight: 400;
  color: #3c3c4e;
}

/* 确认并应用按钮 */
.Pixso-frame-4_447 {
  height: 32px;
  padding: 0 16px;
  border-radius: 4px;
  background: #1264e8;
  cursor: pointer;
  transition: all 0.2s;
}
.Pixso-frame-4_447:hover {
  background: #0d52c0;
}
.Pixso-paragraph-4_448 {
  font-size: 13px;
  font-weight: 600;
  color: #ffffff;
}

/* ==================== 左侧函数库 ==================== */
.Pixso-frame-4_450 {
  width: 220px;
  border-right: 1px solid #e4e6eb;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.frame-content-4_450 {
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
  min-height: 0;
}

/* ==================== 中间公式编辑区 ==================== */
.Pixso-frame-4_458 {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  overflow: hidden;
}
.Pixso-frame-4_516 {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  overflow: hidden;
}
.frame-content-4_516 {
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
  min-height: 0;
}

/* ==================== 右侧面板 ==================== */
.Pixso-frame-4_459 {
  width: 280px;
  border-left: 1px solid #e4e6eb;
  display: flex;
  flex-direction: column;
}
.frame-content-4_459 {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.Pixso-paragraph-4_452 {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a2e;
}

/* 搜索框 */
.function-search-input,
.field-search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 12px;
  color: #3c3c4e;
}
.function-search-input::placeholder,
.field-search-input::placeholder {
  color: #9ca3af;
}

/* 函数分类标签 */
.function-cat-btn {
  padding: 0px 10px;
  height: 26px;
  border-radius: 3px;
  border: none;
  background: transparent;
  font-size: 11px;
  font-family: "Noto Sans SC-Regular";
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.function-cat-btn.active {
  background: #1264e8;
  color: #fff;
}

/* 函数列表项 */
.function-item {
  padding: 0px 16px;
  height: 30px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background 0.2s;
}

.function-item:hover {
  background: #e8f0fe;
}

.function-item:first-child {
  background: #e8f0fe;
}

.function-item:first-child .function-item-name {
  color: #1264e8;
  font-weight: 600;
}

.function-item:first-child .function-item-desc {
  color: #1264e8;
}

.function-item-name {
  font-size: 13px;
  font-family: "Noto Sans SC-Medium";
  color: #3c3c4e;
}

.function-item-desc {
  font-size: 12px;
  font-family: "Noto Sans SC-Regular";
  color: #6b7280;
}

.function-empty {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
}

/* ==================== 公式编辑器区域 ==================== */
.Pixso-frame-4_517 {
  height: 48px;
  padding: 0 16px;
  border-bottom: 1px solid #e4e6eb;
}
.Pixso-paragraph-4_518 {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
}

/* 运算符容器 */
.Pixso-frame-4_521 {
  height: 30px;
  padding: 0 8px;
  border-radius: 4px;
  background: #f5f6f8;
  border: 1px solid #e4e6eb;
}
.frame-content-4_521 {
  gap: 6px;
}

/* 撤销/重做容器 */
.Pixso-frame-4_529 {
  height: 30px;
  padding: 0 8px;
  border-radius: 4px;
  background: #f5f6f8;
  border: 1px solid #e4e6eb;
}

.operator-btn,
.tool-btn {
  padding: 0 6px;
  background: transparent;
  border: none;
  font-size: 14px;
  font-family: "Noto Sans SC-Medium";
  color: #3c3c4e;
  cursor: pointer;
  border-radius: 3px;
  transition: background 0.2s;
}

.operator-btn:hover,
.tool-btn:hover {
  background: #e4e6eb;
}

/* 清空按钮 */
.Pixso-frame-4_536 {
  height: 30px;
  padding: 0 10px;
  border-radius: 4px;
  background: #ffffff;
  border: 1px solid #d9dce3;
  cursor: pointer;
  transition: all 0.2s;
}
.Pixso-frame-4_536:hover {
  background: #f5f6f8;
}
.Pixso-paragraph-4_543 {
  font-size: 12px;
  color: #6b7280;
}

/* ==================== 公式输入区域 ==================== */
.Pixso-frame-4_544 {
  background: #fafafa;
  padding: 20px;
}
.Pixso-frame-4_545 {
  border-radius: 6px;
  background: #ffffff;
  border: 2px solid #1264e8;
  padding: 12px;
}

.formula-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 15px;
  font-family: "Noto Sans SC-Regular";
  color: #1264e8;
}
.formula-input::placeholder {
  color: #9ca3af;
}

/* ==================== 函数说明面板 ==================== */
.Pixso-frame-4_550 {
  border-radius: 6px;
  background: #ffffff;
  border: 1px solid #e4e6eb;
  padding: 12px;
}
.Pixso-paragraph-4_551 {
  font-size: 13px;
  font-weight: 600;
  color: #1264e8;
}
.Pixso-paragraph-4_552 {
  font-size: 12px;
  color: #3c3c4e;
}
.Pixso-frame-4_553 {
  border-radius: 4px;
  background: #f5f6f8;
  padding: 8px;
}
.Pixso-paragraph-4_554 {
  font-size: 12px;
  font-weight: 600;
  color: #1264e8;
}
.Pixso-paragraph-4_556 {
  font-size: 12px;
  font-weight: 600;
  color: #1264e8;
  width: 80px;
  min-width: 80px;
}
.Pixso-paragraph-4_557 {
  font-size: 12px;
  color: #3c3c4e;
}
.Pixso-paragraph-4_558 {
  font-size: 11px;
  color: #9ca3af;
}

/* ==================== 语法验证区域 ==================== */
.Pixso-frame-4_559 {
  border-radius: 6px;
  background: #ffffff;
  border: 1px solid #e4e6eb;
  padding: 16px;
}
.Pixso-paragraph-4_561 {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a2e;
}

/* 重新验证按钮 */
.Pixso-frame-4_562 {
  height: 26px;
  padding: 0 8px;
  border-radius: 4px;
  background: #f0f5ff;
  border: 1px solid #bfcfff;
  cursor: pointer;
  transition: all 0.2s;
}
.Pixso-frame-4_562:hover {
  background: #e8f0fe;
}
.Pixso-paragraph-4_568 {
  font-size: 12px;
  color: #1264e8;
}

/* 验证成功状态 */
.validation-success {
  background: #f0fff4 !important;
  border: 1px solid #52c41a;
  border-radius: 6px;
  height: 36px;
  padding: 0 12px;
}
.Pixso-paragraph-4_572 {
  font-size: 13px;
  color: #52c41a;
}

.validation-error {
  background: #fef2f2 !important;
  border: 1px solid #F04438;
  border-radius: 6px;
  height: 36px;
  padding: 0 12px;
}

/* 验证信息行 */
.Pixso-frame-4_573 {
  background: #f0f5ff;
  border-radius: 6px;
  height: 36px;
  padding: 0 12px;
}
.Pixso-paragraph-4_578 {
  font-size: 12px;
  color: #1264e8;
}

/* ==================== 底部状态栏 ==================== */
.Pixso-frame-4_579 {
  height: 80px;
  padding: 0 20px;
  border-top: 1px solid #e4e6eb;
  background: #ffffff;
}
.frame-content-4_579 {
  gap: 24px;
}
.Pixso-frame-4_583,
.Pixso-frame-4_587 {
  width: 1px;
  height: 40px;
  background: #e4e6eb;
}

/* 计算结果预览 - 醒目大字号 */
.Pixso-paragraph-4_581 {
  font-size: 13px;
  color: #6b7280;
}
.Pixso-paragraph-4_582 {
  font-size: 24px;
  font-weight: 700;
  color: #1264e8;
}

/* 当前公式 */
.Pixso-paragraph-4_585 {
  font-size: 13px;
  color: #6b7280;
}
.Pixso-paragraph-4_586 {
  font-size: 14px;
  font-weight: 500;
  color: #1264e8;
}

/* 数据类型 */
.Pixso-paragraph-4_589 {
  font-size: 13px;
  color: #6b7280;
}
.Pixso-paragraph-4_590 {
  font-size: 13px;
  font-weight: 500;
  color: #3c3c4e;
}

/* ==================== 右侧可用字段 ==================== */
.Pixso-frame-4_596 {
  width: 260px;
  border-left: 1px solid #e4e6eb;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.frame-content-4_596 {
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
  min-height: 0;
}
.Pixso-paragraph-4_598 {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a2e;
}

/* 字段Tab - 白底蓝字+边框风格 */
.Pixso-frame-4_599 {
  height: 34px;
  background: #f5f6f8;
  border-bottom: 1px solid #e4e6eb;
  padding: 0 8px;
}

.field-tab-btn {
  padding: 0px 10px;
  height: 26px;
  border-radius: 4px;
  border: none;
  background: transparent;
  font-size: 12px;
  font-family: "Noto Sans SC-Regular";
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.field-tab-btn.active {
  background: #ffffff;
  color: #1264e8;
  border: 1px solid #1264e8;
}

.field-list {
  overflow-y: auto;
}

.field-item {
  padding: 0 20px 0 12px;
  height: 30px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.field-item:hover {
  background: #f0f5ff;
}

.field-item-icon {
  font-size: 11px;
  font-weight: 700;
  color: #1264e8;
  width: 20px;
  text-align: center;
}
.field-icon-row {
  color: #059669;
}
.field-icon-col {
  color: #2563eb;
}
.field-icon-metric {
  color: #7c3aed;
}
.field-icon-default {
  color: #6b7280;
}

.field-item-info {
  flex: 1;
}

.field-item-name {
  font-size: 12px;
  font-family: "Noto Sans SC-Regular";
  color: #3c3c4e;
}

.field-item-type {
  font-size: 12px;
  font-family: "Noto Sans SC-Regular";
  color: #6b7280;
}

.field-empty {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: #9ca3af;
}

/* ==================== 公式字段（单元格矩阵 + 分组列表）样式 ==================== */
.field-cell-item {
  padding-left: 12px;
}

.cell-readonly {
  opacity: 0.6;
}

.cell-grid-stats {
  padding: 8px 12px;
  font-size: 11px;
  color: #6b7280;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e6eb;
}

.cell-matrix-wrapper {
  overflow-x: auto;
  padding: 8px;
  background: #fff;
  border-bottom: 1px solid #e4e6eb;
}

.cell-matrix {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  min-width: 100%;
}

.cell-matrix th,
.cell-matrix td {
  border: 1px solid #e4e6eb;
  text-align: center;
  font-size: 11px;
  padding: 4px 2px;
}

.matrix-corner {
  width: 60px;
  background: #f5f6f8;
}

.matrix-col-header,
.matrix-row-header {
  background: #f5f6f8;
  color: #6b7280;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.matrix-row-header {
  width: 60px;
  max-width: 60px;
  text-align: left;
  padding-left: 6px;
}

.matrix-cell {
  cursor: pointer;
  color: #1264e8;
  font-weight: 500;
  min-width: 36px;
  transition: background .15s;
}

.matrix-cell:hover {
  background: #e8f0fe;
}

.matrix-cell-readonly {
  color: #9ca3af;
  background: #f8f9fa;
}

.matrix-cell-formula {
  color: #7c3aed;
}



/* ==================== 单元格选择弹窗 ==================== */
.cell-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.cell-picker-dialog {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 80vw;
  max-width: 900px;
  height: 70vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cell-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e4e6eb;
  background: #f8f9fa;
}

.cell-picker-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a2e;
}

.cell-picker-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #6b7280;
  cursor: pointer;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.cell-picker-close:hover {
  background: #e4e6eb;
  color: #1a1a2e;
}

.cell-picker-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 12px 16px;
}

.cell-picker-hint {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 10px;
  padding: 6px 10px;
  background: #f0f5ff;
  border-radius: 4px;
  border: 1px solid #bfcfff;
}

.cell-picker-table-wrapper {
  flex: 1;
  overflow: auto;
  border: 1px solid #e4e6eb;
  border-radius: 6px;
}

.cell-picker-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.cell-picker-table th,
.cell-picker-table td {
  border: 1px solid #e4e6eb;
  text-align: center;
  font-size: 12px;
  padding: 6px 4px;
}

.picker-corner {
  width: 50px;
  background: #f5f6f8;
}

.picker-col-header,
.picker-row-header {
  background: #f5f6f8;
  color: #6b7280;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.picker-row-header {
  width: 50px;
  max-width: 50px;
}

.picker-cell {
  cursor: pointer;
  color: #3c3c4e;
  min-width: 40px;
  transition: background 0.15s;
  user-select: none;
}

.picker-cell:hover {
  background: #e8f0fe;
}

.picker-cell-selected {
  background: #e8f0fe !important;
  color: #1264e8;
  font-weight: 600;
}

.picker-cell-range-start,
.picker-cell-range-end {
  background: #1264e8 !important;
  color: #ffffff;
  font-weight: 600;
}

.cell-picker-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid #e4e6eb;
  background: #f8f9fa;
}

.cell-picker-range {
  font-size: 13px;
  color: #1264e8;
  font-weight: 600;
  margin-right: auto;
}

.cell-picker-btn {
  padding: 6px 16px;
  border-radius: 4px;
  border: 1px solid #d9dce3;
  background: #ffffff;
  font-size: 13px;
  color: #3c3c4e;
  cursor: pointer;
  transition: all 0.2s;
}

.cell-picker-btn:hover {
  background: #f5f6f8;
}

.cell-picker-btn-primary {
  background: #1264e8;
  color: #ffffff;
  border-color: #1264e8;
}

.cell-picker-btn-primary:hover {
  background: #0d52c0;
}

.cell-picker-btn-primary:disabled {
  background: #bfcfff;
  border-color: #bfcfff;
  cursor: not-allowed;
}

/* ==================== 右侧面板选择单元格按钮 ==================== */
.cell-picker-trigger {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  gap: 8px;
}

.cell-picker-open-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 6px;
  border: 1px dashed #1264e8;
  background: #f0f5ff;
  color: #1264e8;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cell-picker-open-btn:hover {
  background: #e8f0fe;
  border-style: solid;
}

.cell-picker-open-icon {
  font-size: 16px;
}

.cell-picker-open-hint {
  font-size: 11px;
  color: #9ca3af;
  text-align: center;
  margin: 0;
}

/* ==================== 当前字段计算结果卡片 ==================== */
.Pixso-frame-4_694 {
  border-radius: 6px;
  background: #f0f5ff;
  border: 1px solid #bfcfff;
  padding: 12px;
  height: 80px;
}
.Pixso-paragraph-4_695 {
  font-size: 12px;
  color: #6b7280;
}
.Pixso-paragraph-4_696 {
  font-size: 22px;
  font-weight: 700;
  color: #1264e8;
}

/* ==================== 通知 ==================== */
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

.notification.success {
  background: #dcfce7;
  color: #166534;
}

.notification.error {
  background: #fee2e2;
  color: #991b1b;
}

.notification.warning {
  background: #fef3c7;
  color: #92400e;
}

.notification.info {
  background: #dbeafe;
  color: #1e40af;
}

.notification-icon {
  font-size: 16px;
}

.notification-message {
  white-space: nowrap;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.apply-to-row-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #374151;
  user-select: none;
}

.apply-to-row-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #1677FF;
}

.apply-to-row-label:hover {
  color: #2563eb;
}
</style>