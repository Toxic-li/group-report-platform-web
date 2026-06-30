<template>
  <div class="Pixso-frame-4_436 formula-designer">
    <div id="4_437" class="stroke-wrapper-4_437">
      <div class="Pixso-frame-4_437">
        <div class="frame-content-4_437">
          <div id="4_438" class="Pixso-frame-4_438">
            <div class="frame-content-4_438">
              <div id="4_439" class="Pixso-frame-4_439"></div>
              <p id="4_440" class="Pixso-paragraph-4_440">{{ "公式设计器" }}</p>
            </div>
          </div>
          <div id="4_441" class="Pixso-frame-4_441"></div>
          <p id="4_442" class="Pixso-paragraph-4_442">{{ formulaData.label || '未命名公式' }}</p>
          <div id="4_443" class="Pixso-frame-4_443"></div>
          <div id="4_444" class="Pixso-frame-4_444">
            <div class="frame-content-4_444">
              <div id="4_445" class="stroke-wrapper-4_445">
                <div class="Pixso-frame-4_445" @click="handleClose">
                  <div class="frame-content-4_445">
                    <p id="4_446" class="Pixso-paragraph-4_446">{{ "取消" }}</p>
                  </div>
                </div>
                <div class="stroke-4_445"></div>
              </div>
              <div id="4_447" class="Pixso-frame-4_447" @click="handleConfirm">
                <div class="frame-content-4_447">
                  <p id="4_448" class="Pixso-paragraph-4_448">{{ "确认并应用" }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="stroke-4_437"></div>
    </div>

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
                            <div class="Pixso-frame-4_570" :class="{ 'validation-success': formulaStatus === 'valid', 'validation-error': formulaStatus === 'error' }">
                              <div class="frame-content-4_570">
                                <div id="4_571" class="Pixso-frame-4_571"></div>
                                <p id="4_572" class="Pixso-paragraph-4_572">{{ formulaStatusText || '请输入公式' }}</p>
                              </div>
                            </div>
                            <div class="stroke-4_570"></div>
                          </div>
                          <div id="4_573" class="Pixso-frame-4_573" v-if="validationResult">
                            <div class="frame-content-4_573">
                              <div id="4_574" class="Pixso-vector-4_574"></div>
                              <p id="4_578" class="Pixso-paragraph-4_578">{{ validationResult.message }}</p>
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
                      v-model="indicatorSearch"
                      class="field-search-input"
                      placeholder="搜索字段"
                      @input="searchIndicators"
                    />
                  </div>
                </div>
                <div class="stroke-4_606"></div>
              </div>
              <div id="4_611" class="Pixso-frame-4_611">
                <div class="frame-content-4_611">
                  <div v-if="leftPanelTab === 'indicators'" class="field-list">
                    <div v-for="indicator in allIndicators" :key="indicator.id" class="field-item" @click="handleIndicatorClick(indicator)">
                      <div class="field-item-icon">#</div>
                      <div class="field-item-info">
                        <div class="field-item-name">{{ indicator.name }}</div>
                        <div class="field-item-type">{{ indicator.type || 'Str' }}</div>
                      </div>
                    </div>
                    <div v-if="allIndicators.length === 0" class="field-empty">暂无数据字段</div>
                  </div>
                  <div v-else class="field-list">
                    <div v-for="cell in cellTreeData" :key="cell.id" class="field-item" @click="insertCell(cell)">
                      <div class="field-item-icon">{{ cell.type === 'row' ? '📝' : '📊' }}</div>
                      <div class="field-item-info">
                        <div class="field-item-name">{{ cell.label }}</div>
                        <div class="field-item-type">{{ cell.code }}</div>
                      </div>
                    </div>
                    <div v-if="cellTreeData.length === 0" class="field-empty">暂无公式字段</div>
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
  </div>
</template>

<script>
import { onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useFormulaDesigner } from './composables/useFormulaDesigner'
import { useFormulaIndicators } from './composables/useFormulaIndicators'
import { useFormulaEditor } from './composables/useFormulaEditor'
import { useFormulaFunctions } from './composables/useFormulaFunctions'
import { useFormulaCells } from './composables/useFormulaCells'

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

    const filteredFunctions = computed(() => {
      let filtered = allFunctions
      if (functionFilter && functionFilter !== 'all') {
        filtered = filtered.filter(f => f.category === functionFilter)
      }
      if (functionSearch) {
        const searchLower = functionSearch.toLowerCase()
        filtered = filtered.filter(f =>
          f.name.toLowerCase().includes(searchLower) ||
          f.description.toLowerCase().includes(searchLower)
        )
      }
      return filtered.length > 0 ? filtered : recentFunctions
    })

    function handleIndicatorClick(indicator) {
      addToRecentIndicators(indicator)
      insertIndicator(indicator)
      showNotification('success', '✓', `已插入指标: ${indicator.name}`)
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

    function handleClose() {
      emit('close')
    }

    function handleConfirm() {
      handleValidate()
      if (formulaStatus === 'valid') {
        handleSave()
        emit('close')
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
      handleIndicatorClick,
      handleFunctionClick,
      handleFormulaChange,
      handleClose,
      handleConfirm,
      handleValidate,
      undoFormula,
      redoFormula,
      clearFormula,
      insertOperator,
      insertCell,
      searchFunctions,
      searchIndicators,
      setFunctionFilter
    }
  }
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

.function-search-input,
.field-search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 12px;
  color: #6b7280;
}

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

.formula-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  font-family: "Noto Sans SC-Regular";
  color: #1a1a2e;
}

.operator-btn,
.tool-btn {
  padding: 4px 8px;
  background: transparent;
  border: none;
  font-size: 14px;
  font-family: "Noto Sans SC-Medium";
  color: #3c3c4e;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}

.operator-btn:hover,
.tool-btn:hover {
  background: #e8e9ed;
}

.field-tab-btn {
  padding: 0px 10px;
  height: 26px;
  border-radius: 3px;
  border: none;
  background: transparent;
  font-size: 12px;
  font-family: "Noto Sans SC-Medium";
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.field-tab-btn.active {
  background: #1264e8;
  color: #fff;
}

.field-list {
  overflow-y: auto;
}

.field-item {
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.field-item:hover {
  background: #f0f1f4;
}

.field-item-icon {
  font-size: 13px;
  font-family: "Noto Sans SC-SemiBold";
  color: #1264e8;
}

.field-item-info {
  flex: 1;
}

.field-item-name {
  font-size: 13px;
  font-family: "Noto Sans SC-Medium";
  color: #1a1a2e;
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

.validation-success {
  background: #f0fdf4 !important;
}

.validation-error {
  background: #fef2f2 !important;
}

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
</style>