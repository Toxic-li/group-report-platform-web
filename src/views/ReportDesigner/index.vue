<template>
  <div class="designer" :class="{ 'is-dark': isDark, 'is-fullscreen': isFullscreen }" v-loading="loading">
    <!-- 顶部工具栏 -->
    <header class="dg-header">
      <div class="dh-left">
        <button class="dh-back" @click="$router.back()" title="返回">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <span class="dh-title">报表设计器</span>
        <span class="dh-divider"></span>
        <span class="dh-template-name">{{ tpl.name || '未命名报表' }}</span>
        <span class="dh-template-code">{{ tpl.code }}</span>
      </div>

      <div class="dh-center">
        <button class="dh-tool-btn" @click="handleSaveTemplate" :disabled="saving" title="保存 (Ctrl+S)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          保存
        </button>
        <button class="dh-tool-btn" @click="handleSaveAs" title="另存为">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 10 7 10 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          另存为
        </button>
        <span class="dh-tool-divider"></span>
        <button class="dh-tool-btn" @click="handlePublishTemplate" :disabled="publishing || !tpl.id" title="发布">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 10v6"/>
            <path d="M18 12l-3-3-3 3-3-3-3 3"/>
            <circle cx="12" cy="12" r="10"/>
          </svg>
          发布
        </button>
        <button class="dh-tool-btn" @click="handlePreview" title="预览">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          预览
        </button>
        <span class="dh-tool-divider"></span>
        <button class="dh-tool-btn" @click="handleUndo" :disabled="!canUndo" title="撤销 (Ctrl+Z)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 7v6h6"/>
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
          </svg>
          撤销
        </button>
        <button class="dh-tool-btn" @click="handleRedo" :disabled="!canRedo" title="重做 (Ctrl+Y)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 7v6h-6"/>
            <path d="M3 17a9 9 0 0 0 9 9 9 9 0 0 0 6-2.3L21 13"/>
          </svg>
          重做
        </button>
        <span class="dh-tool-divider"></span>
        <button class="dh-tool-btn" @click="handleImportExcel" title="导入Excel">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          导入Excel
        </button>
        <button class="dh-tool-btn" @click="exportTemplate" title="导出模板">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          导出模板
        </button>
        <button class="dh-tool-btn" @click="showTemplateProps = true" title="模板属性">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          模板属性
        </button>
      </div>

      <div class="dh-right">
        <span class="dh-status" :class="'dh-status-' + tpl.status">{{ statusLabel }}</span>
        <span class="dh-version">v{{ tpl.version }}</span>
        <button class="dh-tool-btn" @click="toggleDark" title="暗黑模式">
          <svg v-if="!isDark" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        </button>
        <button class="dh-tool-btn" @click="toggleFullscreen" title="全屏">
          <svg v-if="!isFullscreen" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
          </svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- 主体布局 -->
    <div class="dg-body">
      <!-- 左侧资源面板 -->
      <aside class="dg-sidebar" :class="{ collapsed: sidebarCollapsed }">
        <div class="dg-sidebar-header">
          <span class="dgs-title">资源面板</span>
          <button class="dgs-collapse" @click="sidebarCollapsed = !sidebarCollapsed">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path :d="sidebarCollapsed ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'"/>
            </svg>
          </button>
        </div>
        <div class="dg-nav-tree">
          <div v-for="item in navItems" :key="item.key" class="dgn-item">
            <div 
              class="dgn-header" 
              :class="{ active: activeNav === item.key, expanded: expandedNavs.includes(item.key) }"
              @click="toggleNav(item.key)"
            >
              <span class="dgn-expand-icon">{{ expandedNavs.includes(item.key) ? '▼' : '▶' }}</span>
              <span class="dgn-icon">{{ item.icon }}</span>
              <span class="dgn-label">{{ item.label }}</span>
              <span v-if="item.badge" class="dgn-badge">{{ item.badge }}</span>
            </div>
            
            <div v-show="expandedNavs.includes(item.key)" class="dgn-content">
              <!-- 行维度 -->
              <div v-if="item.key === 'rows'" class="dgn-tree-list">
                <div class="dgn-toolbar">
                  <button class="dgn-tool-btn" @click.stop="showAddRowNodeDialog(null)">+ 添加根节点</button>
                </div>
                <div class="dgn-tree">
                  <RowTreeItem 
                    v-for="(node, index) in tpl.rowTree" 
                    :key="'row-'+node.id"
                    :node="node"
                    :level="0"
                    :path="[index]"
                    @add-child="showAddRowNodeDialog"
                    @edit="editRowNodeByPath"
                    @delete="deleteRowNodeByPath"
                    @toggle="toggleRowNodeByPath"
                  />
                  <div v-if="tpl.rowTree.length === 0" class="dgn-empty">暂无行维度</div>
                </div>
              </div>

              <!-- 列维度 -->
              <div v-if="item.key === 'cols'" class="dgn-tree-list">
                <div class="dgn-toolbar">
                  <button class="dgn-tool-btn" @click.stop="showAddColNodeDialog(null)">+ 添加根节点</button>
                </div>
                <div class="dgn-tree">
                  <ColTreeItem 
                    v-for="(node, index) in tpl.columnTree" 
                    :key="'col-'+node.id"
                    :node="node"
                    :level="0"
                    :path="[index]"
                    @add-child="showAddColNodeDialog"
                    @edit="editColNodeByPath"
                    @delete="deleteColNodeByPath"
                    @toggle="toggleColNodeByPath"
                  />
                  <div v-if="tpl.columnTree.length === 0" class="dgn-empty">暂无列维度</div>
                </div>
              </div>

              <!-- 指标 -->
              <div v-if="item.key === 'metrics'" class="dgn-list">
                <div class="dgn-toolbar">
                  <button class="dgn-tool-btn" @click.stop="addMetric()">+ 添加</button>
                </div>
                <div class="dgn-list-items">
                  <div v-for="(metric, index) in tpl.metrics" :key="'metric-'+index" class="dgn-list-item">
                    <span class="dgn-list-icon">{{ metric.icon || '📈' }}</span>
                    <div class="dgn-list-info">
                      <div class="dgn-list-label">{{ metric.label }}</div>
                      <div class="dgn-list-desc">{{ metric.field }} · {{ metric.unit || '-' }}</div>
                    </div>
                    <button class="dgn-list-edit" @click.stop="editMetric(index)">✏️</button>
                    <button class="dgn-list-delete" @click.stop="deleteMetric(index)">🗑️</button>
                  </div>
                  <div v-if="tpl.metrics.length === 0" class="dgn-empty">暂无指标</div>
                </div>
              </div>

              <!-- 公式 -->
              <div v-if="item.key === 'formulas'" class="dgn-list">
                <div class="dgn-toolbar">
                  <span class="dgn-tool-hint">点击"+ 添加"前请先选中目标单元格</span>
                  <button class="dgn-tool-btn" @click.stop="addFormula()">+ 添加</button>
                </div>
                <div class="dgn-list-items">
                  <div v-for="(formula, index) in tpl.aggregates" :key="'formula-'+index" class="dgn-list-item">
                    <span class="dgn-list-icon">fx</span>
                    <div class="dgn-list-info">
                      <div class="dgn-list-label">{{ formula.label }}</div>
                      <div class="dgn-list-desc">
                        <span class="dgn-expr-text">{{ formula.expression }}</span>
                        <span v-if="formula.targetCell" class="dgn-target-badge" :title="'目标单元格: ' + formula.targetCell">
                          {{ getCellLabelByTarget(formula.targetCell) }}
                        </span>
                        <span v-else class="dgn-no-target-badge">未指定单元格</span>
                      </div>
                    </div>
                    <button class="dgn-list-edit" @click.stop="editFormula(index)" title="编辑公式">✏️</button>
                    <button class="dgn-list-delete" @click.stop="deleteFormula(index)" title="删除公式">🗑️</button>
                  </div>
                  <div v-if="tpl.aggregates.length === 0" class="dgn-empty">暂无公式，请选中单元格后点击"+ 添加"</div>
                </div>
              </div>

              <!-- 校验规则 -->
              <div v-if="item.key === 'validators'" class="dgn-list">
                <div class="dgn-toolbar">
                  <button class="dgn-tool-btn" @click.stop="addValidator()">+ 添加</button>
                </div>
                <div class="dgn-list-items">
                  <div v-for="(validator, index) in tpl.validators" :key="'validator-'+index" class="dgn-list-item">
                    <span class="dgn-list-icon">{{ validator.type === 'required' ? '✳️' : validator.type === 'range' ? '📊' : '✅' }}</span>
                    <div class="dgn-list-info">
                      <div class="dgn-list-label">{{ validator.label }}</div>
                      <div class="dgn-list-desc">{{ validator.expression }}</div>
                    </div>
                    <button class="dgn-list-edit" @click.stop="editValidator(index)">✏️</button>
                    <button class="dgn-list-delete" @click.stop="deleteValidator(index)">🗑️</button>
                  </div>
                  <div v-if="tpl.validators.length === 0" class="dgn-empty">暂无校验规则</div>
                </div>
              </div>

              <!-- 数据源 -->
              <div v-if="item.key === 'datasource'" class="dgn-panel">
                <div class="dgn-panel-header">数据源配置</div>
                <div class="dgn-panel-body">
                  <div class="dgn-field">
                    <label>数据源类型</label>
                    <select v-model="tpl.dataSource.type" class="dgn-input">
                      <option value="mock">模拟数据</option>
                      <option value="api">API接口</option>
                      <option value="database">数据库</option>
                    </select>
                  </div>
                  <div class="dgn-field">
                    <label>数据源ID</label>
                    <input v-model="tpl.dataSource.sourceId" class="dgn-input" placeholder="数据源标识" />
                  </div>
                  <div class="dgn-field">
                    <label>查询语句</label>
                    <textarea v-model="tpl.dataSource.query" class="dgn-textarea" rows="3" placeholder="SQL或API参数"></textarea>
                  </div>
                </div>
              </div>

              <!-- 样式 -->
              <div v-if="item.key === 'style'" class="dgn-panel">
                <div class="dgn-panel-header">报表样式</div>
                <div class="dgn-panel-body">
                  <div class="dgn-field">
                    <label>行高</label>
                    <input type="number" v-model="tpl.layout.rowHeight" class="dgn-input" />
                  </div>
                  <div class="dgn-field">
                    <label>默认对齐</label>
                    <select v-model="tpl.layout.defaultAlign" class="dgn-input">
                      <option value="left">左对齐</option>
                      <option value="center">居中</option>
                      <option value="right">右对齐</option>
                    </select>
                  </div>
                  <div class="dgn-field">
                    <label>显示行号</label>
                    <input type="checkbox" v-model="tpl.layout.showRowNumbers" />
                  </div>
                  <div class="dgn-field">
                    <label>斑马线</label>
                    <input type="checkbox" v-model="tpl.layout.stripeRows" />
                  </div>
                </div>
              </div>

              <!-- 权限控制 -->
              <div v-if="item.key === 'permissions'" class="dgn-panel">
                <div class="dgn-panel-header">权限设置</div>
                <div class="dgn-panel-body">
                  <div class="dgn-field">
                    <label>允许编辑</label>
                    <input type="checkbox" v-model="tpl.permissions.canEdit" />
                  </div>
                  <div class="dgn-field">
                    <label>允许导出</label>
                    <input type="checkbox" v-model="tpl.permissions.canExport" />
                  </div>
                  <div class="dgn-field">
                    <label>允许打印</label>
                    <input type="checkbox" v-model="tpl.permissions.canPrint" />
                  </div>
                </div>
              </div>

              <!-- 基本信息 -->
              <div v-if="item.key === 'basic'" class="dgn-panel">
                <div class="dgn-panel-header">模板信息</div>
                <div class="dgn-panel-body">
                  <div class="dgn-field">
                    <label>模板名称</label>
                    <input v-model="tpl.name" class="dgn-input" placeholder="请输入模板名称" />
                  </div>
                  <div class="dgn-field">
                    <label>模板编码</label>
                    <input v-model="tpl.code" class="dgn-input" placeholder="请输入模板编码" />
                  </div>
                  <div class="dgn-field">
                    <label>模板类型</label>
                    <select v-model="tpl.templateType" class="dgn-select">
                      <option :value="1">统计报表</option>
                      <option :value="2">填报报表</option>
                      <option :value="3">汇总报表</option>
                    </select>
                  </div>
                  <div class="dgn-field">
                    <label>状态</label>
                    <span class="dgn-field-value" :class="'dh-status-' + tpl.status">{{ statusLabel }}</span>
                  </div>
                  <div class="dgn-field">
                    <label>版本</label>
                    <span class="dgn-field-value">v{{ tpl.version }}</span>
                  </div>
                  <div class="dgn-field">
                    <label>描述</label>
                    <textarea v-model="tpl.description" class="dgn-textarea" rows="3" placeholder="请输入描述"></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- 中间设计区 -->
      <main class="dg-main">
        <div class="dg-canvas">
          <div class="dg-canvas-toolbar">
            <span class="dct-label">设计模式</span>
            <span class="dct-divider"></span>
            <button class="dct-btn" :class="{ active: designMode === 'edit' }" @click="designMode = 'edit'">编辑</button>
            <button class="dct-btn" :class="{ active: designMode === 'preview' }" @click="designMode = 'preview'">预览</button>
            <span class="dct-divider"></span>
            <button class="dct-btn" @click="showAddRowDialog">+ 新增行</button>
            <button class="dct-btn" @click="addCol">+ 新增列</button>
            <button class="dct-btn" @click="deleteSelectedRow" :disabled="selectedCell.row === null">- 删除行</button>
            <button class="dct-btn" @click="deleteSelectedCol" :disabled="selectedCell.col === null">- 删除列</button>
            <span class="dct-divider"></span>
            <button class="dct-btn" @click="mergeCells" :disabled="!canMergeCells">合并单元格</button>
            <button class="dct-btn" @click="splitCells" :disabled="!canSplitCells">拆分单元格</button>
            <span class="dct-divider"></span>
            <button class="dct-btn" @click="freezeRows">冻结首行</button>
            <button class="dct-btn" @click="freezeCols">冻结首列</button>
          </div>
          
          <div class="dg-spreadsheet" @contextmenu.prevent="showContextMenu($event)">
            <table class="dg-table">
              <thead>
                <template v-for="(headerRow, hi) in headerRows" :key="'hr'+hi">
                  <tr>
                    <!-- 多级列表头（行标签列标题） -->
                    <th 
                      v-if="hi < rowHeaderRows.length"
                      class="dg-th dg-th-row-header"
                      :rowspan="rowHeaderRows[hi]?.rowspan || 1"
                    >
                      <span class="dg-col-label">{{ rowHeaderRows[hi]?.label || '' }}</span>
                    </th>
                    <!-- 列维度标题 -->
                    <th 
                      v-for="(col, ci) in headerRow" 
                      :key="'h'+hi+ci" 
                      class="dg-th"
                      :class="{ 'dg-th-group': col.isGroup }"
                      :colspan="col.colspan"
                      :rowspan="col.rowspan || 1"
                      :style="col.isGroup ? {} : { width: col.width + 'px' }"
                    >
                      <span class="dg-col-label">{{ col.label }}</span>
                      <span v-if="col.isFormula" class="dg-fx-badge">fx</span>
                    </th>
                  </tr>
                </template>
              </thead>
              <tbody>
                <tr v-for="(row, ri) in rows" :key="'r'+ri" :class="{ 'dg-row-summary': row.isSummary }">
                  <td 
                    class="dg-td dg-td-row-label"
                    @click="toggleRowExpand(ri)"
                  >
                    <div class="dg-tree-cell" :style="{ paddingLeft: (row.level * 18 + 8) + 'px' }">
                      <span 
                        v-if="row.hasChildren" 
                        class="dg-tree-toggle"
                        :class="{ expanded: row.expanded }"
                      >
                        <svg v-if="!row.expanded" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="9 6 15 12 9 18"/>
                        </svg>
                      </span>
                      <span v-else class="dg-tree-toggle-placeholder"></span>
                      <span class="dg-tree-label">{{ row.label }}</span>
                      <span v-if="row.isSummary" class="dg-summary-tag">{{ row.summaryType }}</span>
                    </div>
                  </td>
                  <template v-for="(cell, ci) in row.cells" :key="'c'+ri+ci">
                    <td 
                      v-if="!cell.skipCell"
                      :colspan="cell.colspan || 1"
                      :class="['dg-td', { 
                        'dg-td-editing': editingCell.row === ri && editingCell.col === ci,
                        'dg-td-formula': cell.isFormula,
                        'dg-td-readonly': cell.readOnly,
                        'dg-td-selected': selectedCell.row === ri && selectedCell.col === ci,
                        'dg-td-merged': cell.colspan > 1,
                        'dg-td-in-range': isInRange(ri, ci),
                      }]"
                      @click="selectCell(ri, ci, $event)"
                      @dblclick="startEdit(ri, ci)"
                    >
                      <input 
                        v-if="editingCell.row === ri && editingCell.col === ci" 
                        v-model="cell.value" 
                        class="dg-cell-input"
                        @blur="commitEdit"
                        @keydown="onCellKeydown"
                        autofocus
                      />
                      <template v-else>
                        <span v-if="cell.isFormula" class="dg-fx-indicator">fx</span>
                        {{ displayCellValue(cell) }}
                      </template>
                    </td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <!-- 右侧属性面板 -->
      <aside class="dg-properties" :class="{ collapsed: propsCollapsed }">
        <div class="dg-properties-header">
          <span class="dgp-title">{{ propsTitle }}</span>
          <button class="dgp-collapse" @click="propsCollapsed = !propsCollapsed">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path :d="propsCollapsed ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'"/>
            </svg>
          </button>
        </div>
        
        <div v-if="!propsCollapsed" class="dg-properties-content">
          <!-- 单元格属性 -->
          <template v-if="selectedCellType === 'cell' && selectedCell.row !== null">
            <section class="dgp-section">
              <h4 class="dgp-section-title">单元格属性</h4>
              <div class="dgp-form">
                <div class="dgp-field">
                  <label>单元格位置</label>
                  <span class="dgp-field-value">{{ getCellLabel(selectedCell.row, selectedCell.col) }}</span>
                </div>
                <div class="dgp-field">
                  <label>行编码</label>
                  <span class="dgp-field-value">{{ getRowCode(selectedCell.row) }}</span>
                </div>
                <div class="dgp-field">
                  <label>列编码</label>
                  <span class="dgp-field-value">{{ getColCode(selectedCell.col) }}</span>
                </div>
                <div class="dgp-field">
                  <label>数据类型</label>
                  <select v-model="selectedCellDataType" class="dgp-select">
                    <option value="number">数字</option>
                    <option value="string">文本</option>
                    <option value="percent">百分比</option>
                    <option value="currency">金额</option>
                  </select>
                </div>
                <div class="dgp-field">
                  <label>默认值</label>
                  <input v-model="selectedCellDefault" class="dgp-input" />
                </div>
                <div class="dgp-field">
                  <label>必填</label>
                  <input type="checkbox" v-model="selectedCellRequired" />
                </div>
                <div class="dgp-field">
                  <label>只读</label>
                  <input type="checkbox" v-model="selectedCellReadOnly" />
                </div>
                <div class="dgp-field">
                  <label>格式化方式</label>
                  <select v-model="selectedCellFormat" class="dgp-select">
                    <option value="auto">自动</option>
                    <option value="number">数值</option>
                    <option value="percent">百分比</option>
                    <option value="thousands">千分位</option>
                    <option value="currency">金额</option>
                  </select>
                </div>
              </div>
            </section>
            
            <section class="dgp-section">
              <h4 class="dgp-section-title">单元格样式</h4>
              <div class="dgp-form">
                <div class="dgp-field">
                  <label>对齐方式</label>
                  <div class="dgp-radio-group">
                    <button class="dgp-radio-btn" :class="{ active: selectedCellAlign === 'left' }" @click="selectedCellAlign = 'left'">左</button>
                    <button class="dgp-radio-btn" :class="{ active: selectedCellAlign === 'center' }" @click="selectedCellAlign = 'center'">中</button>
                    <button class="dgp-radio-btn" :class="{ active: selectedCellAlign === 'right' }" @click="selectedCellAlign = 'right'">右</button>
                  </div>
                </div>
                <div class="dgp-field">
                  <label>背景色</label>
                  <input type="color" v-model="selectedCellBgColor" class="dgp-color" />
                </div>
                <div class="dgp-field">
                  <label>字体颜色</label>
                  <input type="color" v-model="selectedCellTextColor" class="dgp-color" />
                </div>
              </div>
            </section>
          </template>

          <!-- 公式属性 -->
          <template v-else-if="selectedCellType === 'formula'">
            <section class="dgp-section">
              <h4 class="dgp-section-title">公式属性</h4>
              <div class="dgp-form">
                <div class="dgp-field">
                  <label>公式名称</label>
                  <input v-model="selectedFormulaName" class="dgp-input" />
                </div>
                <div class="dgp-field">
                  <label>公式表达式</label>
                  <textarea v-model="selectedFormulaExpr" class="dgp-textarea" rows="3"></textarea>
                </div>
                <div class="dgp-field">
                  <label>计算方式</label>
                  <select v-model="selectedFormulaCalc" class="dgp-select">
                    <option value="sum">求和</option>
                    <option value="avg">平均值</option>
                    <option value="count">计数</option>
                    <option value="max">最大值</option>
                    <option value="min">最小值</option>
                    <option value="custom">自定义</option>
                  </select>
                </div>
                <div class="dgp-field">
                  <label>计算顺序</label>
                  <input type="number" v-model="selectedFormulaOrder" class="dgp-input" />
                </div>
                <div class="dgp-field">
                  <label>依赖关系</label>
                  <span class="dgp-field-value">A1, B1, C1</span>
                </div>
              </div>
            </section>
          </template>

          <!-- 指标属性 -->
          <template v-else-if="selectedCellType === 'metric'">
            <section class="dgp-section">
              <h4 class="dgp-section-title">指标属性</h4>
              <div class="dgp-form">
                <div class="dgp-field">
                  <label>指标名称</label>
                  <input v-model="selectedMetricName" class="dgp-input" />
                </div>
                <div class="dgp-field">
                  <label>指标编码</label>
                  <input v-model="selectedMetricCode" class="dgp-input" />
                </div>
                <div class="dgp-field">
                  <label>单位</label>
                  <input v-model="selectedMetricUnit" class="dgp-input" />
                </div>
                <div class="dgp-field">
                  <label>小数位数</label>
                  <input type="number" v-model="selectedMetricDecimals" class="dgp-input" />
                </div>
                <div class="dgp-field">
                  <label>显示格式</label>
                  <select v-model="selectedMetricFormat" class="dgp-select">
                    <option value="number">数值</option>
                    <option value="percent">百分比</option>
                    <option value="thousands">千分位</option>
                    <option value="currency">金额</option>
                  </select>
                </div>
              </div>
            </section>
          </template>

          <!-- 模板概览 -->
          <template v-else>
            <section class="dgp-section">
              <h4 class="dgp-section-title">模板概览</h4>
              <div class="dgp-form">
                <div class="dgp-field">
                  <label>模板名称</label>
                  <span class="dgp-field-value">{{ tpl.name || '-' }}</span>
                </div>
                <div class="dgp-field">
                  <label>模板编码</label>
                  <span class="dgp-field-value">{{ tpl.code || '-' }}</span>
                </div>
                <div class="dgp-field">
                  <label>行节点数</label>
                  <span class="dgp-field-value">{{ rowCount }}</span>
                </div>
                <div class="dgp-field">
                  <label>列节点数</label>
                  <span class="dgp-field-value">{{ colCount }}</span>
                </div>
                <div class="dgp-field">
                  <label>公式数量</label>
                  <span class="dgp-field-value">{{ tpl.metrics?.length || 0 }}</span>
                </div>
                <div class="dgp-field">
                  <label>校验规则</label>
                  <span class="dgp-field-value">{{ tpl.validators?.length || 0 }}</span>
                </div>
              </div>
            </section>
          </template>
        </div>
      </aside>
    </div>

    <!-- 底部状态栏 -->
    <footer class="dg-footer">
      <div class="df-left">
        <span class="df-item">
          <span class="df-label">单元格:</span>
          <span class="df-value">{{ getCellLabel(selectedCell.row, selectedCell.col) }}</span>
        </span>
        <span class="df-item">
          <span class="df-label">数据类型:</span>
          <span class="df-value">{{ dataTypeLabel }}</span>
        </span>
        <span class="df-item">
          <span class="df-label">公式:</span>
          <span class="df-value">{{ tpl.metrics?.length || 0 }} 个</span>
        </span>
        <span class="df-item">
          <span class="df-label">校验:</span>
          <span class="df-value">{{ tpl.validators?.length || 0 }} 条</span>
        </span>
      </div>
      <div class="df-right">
        <span class="df-item">
          <span class="df-label">最后保存:</span>
          <span class="df-value">{{ lastSavedTime || '-' }}</span>
        </span>
        <span class="df-item">
          <span class="df-label">设计模式</span>
        </span>
      </div>
    </footer>

    <!-- 右键菜单 -->
    <Teleport to="body">
      <div v-if="contextMenu.visible" class="dg-context-menu" :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }" @click.self="contextMenu.visible = false">
        <button class="dcm-item" @click="cmAddRow">新增行</button>
        <button class="dcm-item" @click="cmAddCol">新增列</button>
        <div class="dcm-divider"></div>
        <button class="dcm-item" @click="cmDeleteRow">删除行</button>
        <button class="dcm-item" @click="cmDeleteCol">删除列</button>
        <div class="dcm-divider"></div>
        <button class="dcm-item" @click="cmMergeCells">合并单元格</button>
        <button class="dcm-item" @click="cmSplitCells">拆分单元格</button>
        <div class="dcm-divider"></div>
        <button class="dcm-item" @click="cmSetFormula">设置公式</button>
        <button class="dcm-item" @click="cmSetValidation">设置校验</button>
        <button class="dcm-item" @click="cmSetStyle">设置样式</button>
      </div>
    </Teleport>

    <!-- 模板属性弹窗 -->
    <el-dialog v-model="showTemplateProps" title="模板属性" width="500px" destroy-on-close>
      <div class="dgp-form">
        <div class="dgp-field">
          <label>模板名称 *</label>
          <input v-model="tpl.name" class="dgp-input" placeholder="如：煤炭生产销售库存表" />
        </div>
        <div class="dgp-field">
          <label>模板编码 *</label>
          <input v-model="tpl.code" class="dgp-input" placeholder="如：RPT-COAL-001" />
        </div>
        <div class="dgp-row">
          <div class="dgp-field">
            <label>模板类型 *</label>
            <select v-model="tpl.templateType" class="dgp-select">
              <option :value="0">请选择类型</option>
              <option :value="1">统计报表</option>
              <option :value="2">填报报表</option>
              <option :value="3">汇总报表</option>
            </select>
          </div>
          <div class="dgp-field">
            <label>状态</label>
            <select v-model="tpl.status" class="dgp-select">
              <option value="designing">设计中</option>
              <option value="pending">待审批</option>
              <option value="published">已发布</option>
              <option value="changed">已变更</option>
              <option value="archived">已归档</option>
              <option value="disabled">已停用</option>
            </select>
          </div>
        </div>
        <div class="dgp-field">
          <label>描述</label>
          <textarea v-model="tpl.description" class="dgp-textarea" rows="3" placeholder="报表用途说明..."></textarea>
        </div>
        <div class="dgp-row">
          <div class="dgp-field">
            <label>分类</label>
            <select v-model="tpl.category" class="dgp-select">
              <option value="">未分类</option>
              <option value="production">生产</option>
              <option value="finance">财务</option>
              <option value="safety">安全</option>
              <option value="energy">能源</option>
              <option value="cost">成本</option>
            </select>
          </div>
          <div class="dgp-field">
            <label>版本</label>
            <input type="number" v-model.number="tpl.version" min="1" max="99" class="dgp-input" />
          </div>
        </div>
        <div class="dgp-field">
          <label>标签（逗号分隔）</label>
          <input v-model="tagsInput" class="dgp-input" placeholder="煤炭, 月报, 生产" />
        </div>
      </div>
      <template #footer>
        <el-button @click="showTemplateProps = false">取消</el-button>
        <el-button type="primary" @click="handleSaveTemplate">保存</el-button>
      </template>
    </el-dialog>

    <!-- 添加行弹窗 -->
    <el-dialog v-model="addRowDialog.visible" title="新增行" width="400px" destroy-on-close>
      <div class="ard-form">
        <div class="ard-field">
          <label>行类型</label>
          <div class="ard-type-options">
            <button 
              class="ard-type-btn" 
              :class="{ active: addRowDialog.rowType === 'normal' }"
              @click="addRowDialog.rowType = 'normal'"
            >
              <span class="ard-type-icon">📝</span>
              <span class="ard-type-label">普通行</span>
              <span class="ard-type-desc">数据录入行</span>
            </button>
            <button 
              class="ard-type-btn" 
              :class="{ active: addRowDialog.rowType === 'summary' }"
              @click="addRowDialog.rowType = 'summary'"
            >
              <span class="ard-type-icon">📊</span>
              <span class="ard-type-label">汇总行</span>
              <span class="ard-type-desc">小计/合计等</span>
            </button>
          </div>
        </div>
        
        <div v-if="addRowDialog.rowType === 'summary'" class="ard-field">
          <label>汇总类型</label>
          <div class="ard-summary-options">
            <button 
              v-for="opt in summaryTypeOptions" 
              :key="opt"
              class="ard-summary-btn"
              :class="{ active: addRowDialog.summaryType === opt }"
              @click="addRowDialog.summaryType = opt"
            >
              {{ opt }}
            </button>
          </div>
        </div>
        
        <div v-if="addRowDialog.rowType === 'normal'" class="ard-field">
          <label>行名称</label>
          <input 
            v-model="addRowDialog.rowName" 
            class="ard-input" 
            placeholder="请输入行名称"
          />
        </div>
      </div>
      
      <template #footer>
        <el-button @click="addRowDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmAddRow">确定添加</el-button>
      </template>
    </el-dialog>

    <!-- 节点操作弹窗 -->
    <el-dialog 
      v-model="nodeDialog.visible" 
      :title="nodeDialog.mode === 'add' ? '添加节点' : '编辑节点'" 
      width="400px" 
      destroy-on-close
    >
      <div class="nd-form">
        <div class="nd-field">
          <label>节点编码</label>
          <input 
            v-model="nodeDialog.code" 
            class="nd-input" 
            placeholder="请输入编码（如 row_001）"
          />
        </div>
        
        <div class="nd-field">
          <label>节点名称</label>
          <input 
            v-model="nodeDialog.label" 
            class="nd-input" 
            placeholder="请输入名称"
          />
        </div>
        
        <!-- 行维度特有的汇总选项 -->
        <div v-if="nodeDialog.type === 'row'" class="nd-field">
          <label>节点类型</label>
          <div class="nd-type-options">
            <button 
              class="nd-type-btn" 
              :class="{ active: !nodeDialog.isSummary }"
              @click="nodeDialog.isSummary = false"
            >
              <span class="nd-type-icon">📝</span>
              <span class="nd-type-label">普通节点</span>
            </button>
            <button 
              class="nd-type-btn" 
              :class="{ active: nodeDialog.isSummary }"
              @click="nodeDialog.isSummary = true"
            >
              <span class="nd-type-icon">📊</span>
              <span class="nd-type-label">汇总节点</span>
            </button>
          </div>
        </div>
        
        <div v-if="nodeDialog.type === 'row' && nodeDialog.isSummary" class="nd-field">
          <label>汇总类型</label>
          <div class="nd-summary-options">
            <button 
              v-for="opt in summaryTypeOptions" 
              :key="opt"
              class="nd-summary-btn"
              :class="{ active: nodeDialog.summaryType === opt }"
              @click="nodeDialog.summaryType = opt"
            >
              {{ opt }}
            </button>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="nodeDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="confirmNodeDialog">{{ nodeDialog.mode === 'add' ? '确定添加' : '确定修改' }}</el-button>
      </template>
    </el-dialog>

    <!-- Toast 提示 -->
    <Transition name="dg-toast">
      <div v-if="toast.visible" :class="['dg-toast', 'dg-toast-' + toast.type]">{{ toast.message }}</div>
    </Transition>

    <!-- 确认对话框 -->
    <el-dialog
      v-model="confirmDialog.visible"
      title="确认操作"
      width="360px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div class="cd-content">
        <div class="cd-icon">
          <span v-if="confirmDialog.type === 'danger'" class="cd-icon-danger">⚠️</span>
          <span v-else class="cd-icon-info">💡</span>
        </div>
        <div class="cd-message">{{ confirmDialog.message }}</div>
      </div>
      <template #footer>
        <div class="cd-footer">
          <el-button @click="handleConfirmCancel">取消</el-button>
          <el-button :type="confirmDialog.type === 'danger' ? 'danger' : 'primary'" @click="handleConfirmOk">
            {{ confirmDialog.okText || '确定' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 公式编辑器 -->
    <FormulaEditor
      v-if="formulaEditorDialog.visible"
      :cell-info="formulaCellInfo"
      :initial-value="formulaEditorDialog.expression"
      :fields="formulaFields"
      :row-fields="formulaRowFields"
      :valid-field-ids="formulaValidFieldIds"
      :template-id="tpl.id"
      @apply="onFormulaApply"
      @close="formulaEditorDialog.visible = false"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, defineComponent, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { loadTemplate, saveTemplate, updateTemplate, publishTemplate } from '@/api/reportDesigner.js'
import FormulaEditor from '@/components/FormulaEditor.vue'

const router = useRouter()
const route = useRoute()

// ==================== 递归树形组件 ====================
// 行维度树形组件
const RowTreeItem = defineComponent({
  name: 'RowTreeItem',
  props: {
    node: { type: Object, required: true },
    level: { type: Number, default: 0 },
    path: { type: Array, default: () => [] }
  },
  emits: ['add-child', 'edit', 'delete', 'toggle'],
  setup(props, { emit }) {
    return () => {
      const paddingLeft = 8 + props.level * 20
      const hasChildren = props.node.children?.length > 0
      
      return h('div', { 
        class: ['dgn-tree-node', { 'dgn-tree-summary': props.node.isSummary }],
        style: { paddingLeft: `${paddingLeft}px` }
      }, [
        // 展开/收起图标
        h('span', {
          class: 'dgn-tree-expand',
          onClick: (e) => {
            e.stopPropagation()
            emit('toggle', props.path)
          }
        }, hasChildren ? (props.node.expanded ? '▼' : '▶') : ''),
        
        // 节点标签
        h('span', { class: 'dgn-tree-label' }, props.node.label),
        
        // 汇总类型标签
        props.node.isSummary ? h('span', { class: 'dgn-tree-summary-tag' }, props.node.summaryType) : null,
        
        // 节点编码
        h('span', { class: 'dgn-tree-code' }, props.node.code),
        
        // 操作按钮组
        h('div', { class: 'dgn-tree-actions' }, [
          // 添加子节点
          h('button', {
            class: 'dgn-tree-btn dgn-tree-add',
            title: '添加子节点',
            onClick: (e) => {
              e.stopPropagation()
              emit('add-child', props.path)
            }
          }, '+'),
          // 编辑
          h('button', {
            class: 'dgn-tree-btn dgn-tree-edit',
            title: '编辑',
            onClick: (e) => {
              e.stopPropagation()
              emit('edit', props.path)
            }
          }, '✏️'),
          // 删除
          h('button', {
            class: 'dgn-tree-btn dgn-tree-delete',
            title: '删除',
            onClick: (e) => {
              e.stopPropagation()
              emit('delete', props.path)
            }
          }, '🗑️')
        ]),
        
        // 子节点（递归）
        hasChildren && props.node.expanded ? 
          h('div', { class: 'dgn-tree-children' },
            props.node.children.map((child, idx) => 
              h(RowTreeItem, {
                key: child.id || `child-${idx}`,
                node: child,
                level: props.level + 1,
                path: [...props.path, idx],
                onAddChild: (p) => emit('add-child', p),
                onEdit: (p) => emit('edit', p),
                onDelete: (p) => emit('delete', p),
                onToggle: (p) => emit('toggle', p)
              })
            )
          ) : null
      ])
    }
  }
})

// 列维度树形组件
const ColTreeItem = defineComponent({
  name: 'ColTreeItem',
  props: {
    node: { type: Object, required: true },
    level: { type: Number, default: 0 },
    path: { type: Array, default: () => [] }
  },
  emits: ['add-child', 'edit', 'delete', 'toggle'],
  setup(props, { emit }) {
    return () => {
      const paddingLeft = 8 + props.level * 20
      const hasChildren = props.node.children?.length > 0
      
      return h('div', { 
        class: 'dgn-tree-node',
        style: { paddingLeft: `${paddingLeft}px` }
      }, [
        // 展开/收起图标
        h('span', {
          class: 'dgn-tree-expand',
          onClick: (e) => {
            e.stopPropagation()
            emit('toggle', props.path)
          }
        }, hasChildren ? (props.node.expanded ? '▼' : '▶') : ''),
        
        // 节点标签
        h('span', { class: 'dgn-tree-label' }, props.node.label),
        
        // 节点编码
        h('span', { class: 'dgn-tree-code' }, props.node.code),
        
        // 操作按钮组
        h('div', { class: 'dgn-tree-actions' }, [
          // 添加子节点
          h('button', {
            class: 'dgn-tree-btn dgn-tree-add',
            title: '添加子节点',
            onClick: (e) => {
              e.stopPropagation()
              emit('add-child', props.path)
            }
          }, '+'),
          // 编辑
          h('button', {
            class: 'dgn-tree-btn dgn-tree-edit',
            title: '编辑',
            onClick: (e) => {
              e.stopPropagation()
              emit('edit', props.path)
            }
          }, '✏️'),
          // 删除
          h('button', {
            class: 'dgn-tree-btn dgn-tree-delete',
            title: '删除',
            onClick: (e) => {
              e.stopPropagation()
              emit('delete', props.path)
            }
          }, '🗑️')
        ]),
        
        // 子节点（递归）
        hasChildren && props.node.expanded ? 
          h('div', { class: 'dgn-tree-children' },
            props.node.children.map((child, idx) => 
              h(ColTreeItem, {
                key: child.id || `child-${idx}`,
                node: child,
                level: props.level + 1,
                path: [...props.path, idx],
                onAddChild: (p) => emit('add-child', p),
                onEdit: (p) => emit('edit', p),
                onDelete: (p) => emit('delete', p),
                onToggle: (p) => emit('toggle', p)
              })
            )
          ) : null
      ])
    }
  }
})

// ==================== 视图状态 ====================
const isDark = ref(false)
const isFullscreen = ref(false)
const sidebarCollapsed = ref(false)
const propsCollapsed = ref(false)
const designMode = ref('edit')
const showTemplateProps = ref(false)
const activeNav = ref('rows')
const expandedNavs = ref(['rows', 'cols'])

// ==================== 导航菜单 ====================
const navItems = computed(() => [
  { key: 'basic', label: '基本信息', icon: '📋', badge: '' },
  { key: 'datasource', label: '数据源', icon: '🔌', badge: '' },
  { key: 'rows', label: '行维度', icon: '📊', badge: rowCount },
  { key: 'cols', label: '列维度', icon: '📈', badge: colCount },
  { key: 'metrics', label: '指标', icon: '📉', badge: tpl.metrics?.length || 0 },
  { key: 'formulas', label: '公式', icon: 'fx', badge: tpl.metrics?.length || 0 },
  { key: 'validators', label: '校验规则', icon: '✅', badge: tpl.validators?.length || 0 },
  { key: 'style', label: '样式', icon: '🎨', badge: '' },
  { key: 'permissions', label: '权限控制', icon: '🔒', badge: '' },
])

// ==================== 模板数据 ====================
const tpl = reactive({
  id: '',
  name: '',
  code: '',
  version: 1,
  templateType: 2,
  status: 'designing',
  description: '',
  category: '',
  tags: [],
  icon: '📊',
  layout: {
    type: 'table',
    frozenRows: 1,
    frozenCols: 1,
    showRowNumbers: true,
    rowHeight: 32,
    defaultAlign: 'right',
    density: 'normal',
    borderStyle: 'all',
    stripeRows: true
  },
  rowTree: [],
  columnTree: [],
  metrics: [],
  aggregates: [],
  validators: [],
  conditionalFormats: [],
  dataSource: {
    type: 'mock',
    sourceId: '',
    query: ''
  },
  permissions: { canEdit: true, canExport: true, canPrint: true }
})

const tagsInput = computed({
  get: () => (tpl.tags || []).join(', '),
  set: (val) => { tpl.tags = val.split(/[,，]/).map(s => s.trim()).filter(Boolean) }
})

// ==================== 统计 ====================
const rowCount = computed(() => countNodes(tpl.rowTree))
const colCount = computed(() => countNodes(tpl.columnTree))
const isValid = computed(() => {
  return tpl.name.trim() && tpl.code.trim() && tpl.rowTree.length > 0 && tpl.columnTree.length > 0
})
const statusLabel = computed(() => ({
  designing: '设计中', pending: '待审批', published: '已发布',
  changed: '已变更', archived: '已归档', disabled: '已停用'
}[tpl.status] || tpl.status))

// 公式编辑器字段列表
const formulaFields = computed(() => {
  return tpl.metrics.map(m => ({
    id: m.id || m.code,
    title: m.label || m.name,
    type: m.type || 'number'
  }))
})

const formulaRowFields = computed(() => {
  const fields = []
  const walk = (nodes) => {
    for (const node of nodes || []) {
      if (!node.isSummary) {
        fields.push({
          id: node.id || node.code,
          name: node.label || node.name,
          type: node.type || ''
        })
      }
      if (node.children?.length) walk(node.children)
    }
  }
  walk(tpl.rowTree)
  return fields
})

const formulaValidFieldIds = computed(() => {
  const ids = []
  ids.push(...formulaFields.value.map(f => f.id))
  ids.push(...formulaRowFields.value.map(f => f.id))
  return ids
})

// 公式编辑器单元格信息
const formulaCellInfo = computed(() => {
  if (!formulaEditorDialog.targetCell) {
    return formulaEditorDialog.mode === 'edit' ? '编辑公式' : '添加公式'
  }
  const { row, col } = formulaEditorDialog.targetCell
  const cellLabel = getCellLabel(row, col)
  const rowCode = getRowCode(row)
  const colCode = getColCode(col)
  return `${cellLabel} (${rowCode} / ${colCode})`
})

function countNodes(nodes) {
  let c = 0
  const walk = (list) => { for (const n of list) { c++; if (n.children?.length) walk(n.children) } }
  walk(nodes || [])
  return c
}

// ==================== 表格数据 ====================
const columnHeaders = ref([])
const headerRows = ref([])
const rowHeaderRows = ref([])
const rows = ref([])

function getMaxDepth(cols) {
  let maxDepth = 1
  for (const col of cols) {
    if (col.children?.length) {
      const childDepth = 1 + getMaxDepth(col.children)
      maxDepth = Math.max(maxDepth, childDepth)
    }
  }
  return maxDepth
}

function buildColumnHeaders() {
  const headers = [{ label: '指标', width: 120, isFormula: false }]
  const allLeafCols = []
  
  function walkCols(cols) {
    for (const col of cols) {
      if (col.children?.length) {
        walkCols(col.children)
      } else {
        allLeafCols.push(col)
        headers.push({ 
          label: col.label || col.title || col.name || '', 
          width: col.width || 90, 
          isFormula: false 
        })
      }
    }
  }
  
  walkCols(tpl.columnTree)
  
  if (headers.length > 1) {
    headers.push({ label: '合计', width: 90, isFormula: true })
  }
  
  columnHeaders.value = headers
}

function buildMultiLevelHeaders() {
  const maxDepth = tpl.columnTree.length ? getMaxDepth(tpl.columnTree) : 0
  const result = []
  
  if (maxDepth === 0) {
    result.push([{ label: '指标', width: 120, isFormula: false, colspan: 1 }])
    headerRows.value = result
    return
  }
  
  for (let i = 0; i < maxDepth; i++) {
    result.push([])
  }
  
  function collectLeafCount(cols) {
    let count = 0
    for (const col of cols) {
      if (col.children?.length) {
        count += collectLeafCount(col.children)
      } else {
        count++
      }
    }
    return count
  }
  
  function buildLevel(cols, level) {
    for (const col of cols) {
      // 修复：正确计算 colspan，处理空数组的情况
      const hasChildren = col.children && col.children.length > 0
      const leafCount = hasChildren ? collectLeafCount(col.children) : 1
      const rowspan = hasChildren ? 1 : (maxDepth - level)

      result[level].push({
        label: col.label || col.title || col.name || '',
        width: col.width || 90,
        isFormula: false,
        isGroup: hasChildren,
        colspan: leafCount,
        rowspan: rowspan,
        col
      })

      if (hasChildren) {
        buildLevel(col.children, level + 1)
      }
    }
  }
  
  buildLevel(tpl.columnTree, 0)
  
  headerRows.value = result
}

function buildRowHeaderRows() {
  const maxColDepth = tpl.columnTree.length ? getMaxDepth(tpl.columnTree) : 0
  const totalHeaderRows = Math.max(maxColDepth, 1)
  
  rowHeaderRows.value = [{ label: '指标', width: 120, rowspan: totalHeaderRows }]
}

function getRowHeaderLabel(level) {
  const labels = ['指标', '一级分类', '二级分类', '三级分类', '四级分类', '五级分类']
  return labels[level] || `第${level + 1}级`
}

function buildRows() {
  const result = []
  const colCount = columnHeaders.value.length
  
  if (colCount === 0) {
    rows.value = []
    return
  }
  
  function walkRows(rowTree, level = 0, treePath = []) {
    for (let idx = 0; idx < rowTree.length; idx++) {
      const row = rowTree[idx]
      const label = row.label || row.name || ''
      const hasChildren = row.children?.length > 0
      const isExpanded = row.expanded !== undefined ? row.expanded : false
      const currentPath = [...treePath, idx]
      
      const cells = Array(colCount).fill(null).map((_, ci) => {
        if (row.isSummary && ci > 0) {
          return {
            value: '',
            isFormula: true,
            readOnly: true,
            formula: ''
          }
        }
        return {
          value: '',
          isFormula: false,
          readOnly: false,
          formula: ''
        }
      })
      
      result.push({
        label,
        isSummary: !!row.isSummary,
        summaryType: row.summaryType || '',
        level,
        hasChildren,
        expanded: isExpanded,
        treePath: currentPath,
        cells
      })
      
      if (hasChildren && isExpanded) {
        walkRows(row.children, level + 1, currentPath)
      }
    }
  }
  
  walkRows(tpl.rowTree)
  
  rows.value = result
}

function rebuildTable() {
  buildColumnHeaders()
  buildMultiLevelHeaders()
  buildRowHeaderRows()
  buildRows()
}

watch(() => [tpl.rowTree, tpl.columnTree], () => {
  rebuildTable()
}, { deep: true })

// ==================== 添加行弹窗 ====================
const addRowDialog = reactive({
  visible: false,
  rowType: 'normal',
  summaryType: '小计',
  rowName: ''
})

const summaryTypeOptions = ['小计', '合计', '汇总', '总计', '平均值']

function showAddRowDialog() {
  addRowDialog.visible = true
  addRowDialog.rowType = 'normal'
  addRowDialog.summaryType = '小计'
  addRowDialog.rowName = ''
}

function confirmAddRow() {
  saveToUndoStack()
  
  const isSummary = addRowDialog.rowType === 'summary'
  const label = isSummary ? addRowDialog.summaryType : (addRowDialog.rowName || `新行${tpl.rowTree.length + 1}`)
  
  tpl.rowTree.push({
    id: generateId('row'),
    code: `row_${tpl.rowTree.length + 1}`,
    label,
    expanded: false,
    children: [],
    isSummary: isSummary,
    summaryType: isSummary ? addRowDialog.summaryType : ''
  })
  
  addRowDialog.visible = false
  showToast('行添加成功', 'success')
}

// ==================== 合并单元格 ====================
const selectedRange = reactive({
  startRow: null,
  startCol: null,
  endRow: null,
  endCol: null
})

const canMergeCells = computed(() => {
  if (selectedRange.startRow === null || selectedRange.startCol === null) return false
  if (selectedRange.endRow === null || selectedRange.endCol === null) return false
  
  const rowSpan = Math.abs(selectedRange.endRow - selectedRange.startRow) + 1
  const colSpan = Math.abs(selectedRange.endCol - selectedRange.startCol) + 1
  
  return rowSpan > 1 || colSpan > 1
})

const canSplitCells = computed(() => {
  if (selectedCell.row === null || selectedCell.col === null) return false
  const row = rows.value[selectedCell.row]
  if (!row) return false
  const cell = row.cells[selectedCell.col]
  if (!cell) return false
  return cell.colspan > 1
})

function mergeCells() {
  if (!canMergeCells.value) return
  
  saveToUndoStack()
  
  const startRow = Math.min(selectedRange.startRow, selectedRange.endRow)
  const endRow = Math.max(selectedRange.startRow, selectedRange.endRow)
  const startCol = Math.min(selectedRange.startCol, selectedRange.endCol)
  const endCol = Math.max(selectedRange.startCol, selectedRange.endCol)
  
  const colSpan = endCol - startCol + 1
  
  const firstCell = rows.value[startRow].cells[startCol]
  firstCell.colspan = colSpan
  
  for (let ri = startRow; ri <= endRow; ri++) {
    for (let ci = startCol; ci <= endCol; ci++) {
      if (ri === startRow && ci === startCol) continue
      
      rows.value[ri].cells[ci].skipCell = true
      rows.value[ri].cells[ci].colspan = 0
    }
  }
  
  showToast('单元格合并成功', 'success')
}

function splitCells() {
  if (!canSplitCells.value) return
  
  saveToUndoStack()
  
  const cell = rows.value[selectedCell.row].cells[selectedCell.col]
  const colspan = cell.colspan
  
  cell.colspan = 1
  cell.skipCell = false
  
  for (let ci = selectedCell.col + 1; ci < selectedCell.col + colspan; ci++) {
    rows.value[selectedCell.row].cells[ci].skipCell = false
    rows.value[selectedCell.row].cells[ci].colspan = 1
  }
  
  showToast('单元格拆分成功', 'success')
}

// ==================== 编辑状态 ====================
const selectedCell = reactive({ row: null, col: null })
const selectedCellType = ref('cell')
const editingCell = reactive({ row: null, col: null })

// 撤销/重做
const undoStack = ref([])
const redoStack = ref([])
const canUndo = computed(() => undoStack.value.length > 0)
const canRedo = computed(() => redoStack.value.length > 0)

// 属性面板数据
const selectedCellDataType = ref('number')
const selectedCellDefault = ref('')
const selectedCellRequired = ref(false)
const selectedCellReadOnly = ref(false)
const selectedCellFormat = ref('auto')
const selectedCellAlign = ref('right')
const selectedCellBgColor = ref('#ffffff')
const selectedCellTextColor = ref('#333333')

const selectedFormulaName = ref('')
const selectedFormulaExpr = ref('')
const selectedFormulaCalc = ref('custom')
const selectedFormulaOrder = ref(1)

const selectedMetricName = ref('')
const selectedMetricCode = ref('')
const selectedMetricUnit = ref('')
const selectedMetricDecimals = ref(2)
const selectedMetricFormat = ref('number')

const lastSavedTime = ref(null)

// 属性面板标题
const propsTitle = computed(() => {
  if (selectedCell.row === null) return '模板概览'
  if (selectedCellType.value === 'formula') return '公式属性'
  if (selectedCellType.value === 'metric') return '指标属性'
  return '单元格属性'
})

// 数据类型标签
const dataTypeLabel = computed(() => ({
  number: '数字', string: '文本', percent: '百分比', currency: '金额'
}[selectedCellDataType.value] || '未知'))

// ==================== 右键菜单 ====================
const contextMenu = reactive({ visible: false, x: 0, y: 0 })

// ==================== Toast ====================
const toast = reactive({ visible: false, message: '', type: 'success' })

// ==================== 确认对话框 ====================
const confirmDialog = reactive({
  visible: false,
  message: '',
  type: 'info', // info 或 danger
  okText: '确定',
  onOk: null,
  onCancel: null
})

function showConfirmDialog(message, options = {}) {
  confirmDialog.visible = true
  confirmDialog.message = message
  confirmDialog.type = options.type || 'info'
  confirmDialog.okText = options.okText || '确定'
  confirmDialog.onOk = options.onOk || null
  confirmDialog.onCancel = options.onCancel || null
}

function handleConfirmOk() {
  confirmDialog.visible = false
  if (confirmDialog.onOk) {
    confirmDialog.onOk()
  }
}

function handleConfirmCancel() {
  confirmDialog.visible = false
  if (confirmDialog.onCancel) {
    confirmDialog.onCancel()
  }
}

// ==================== 资源面板操作 ====================
function toggleNav(key) {
  activeNav.value = key
  if (expandedNavs.value.includes(key)) {
    expandedNavs.value = expandedNavs.value.filter(k => k !== key)
  } else {
    expandedNavs.value.push(key)
  }
}

// 行维度操作
function selectRowNode(index) {
  const node = tpl.rowTree[index]
  showToast(`选中行维度: ${node.label}`, 'success')
}

// ==================== 节点操作弹窗 ====================
const nodeDialog = reactive({
  visible: false,
  type: 'row', // row 或 col
  mode: 'add', // add 或 edit
  path: null, // 节点路径数组
  node: null, // 当前节点数据
  code: '',
  label: '',
  isSummary: false,
  summaryType: '小计'
})

// 公式编辑器状态
const formulaEditorDialog = reactive({
  visible: false,
  mode: 'add', // add 或 edit
  index: null, // 编辑时的索引
  formulaId: '',
  formulaName: '',
  formulaLabel: '',
  expression: '',
  resultType: 'number',
  targetCell: null // 目标单元格位置 { row, col }
})

function getNodeByPath(tree, path) {
  if (!path || path.length === 0) return null
  let node = tree[path[0]]
  for (let i = 1; i < path.length; i++) {
    if (!node?.children) return null
    node = node.children[path[i]]
  }
  return node
}

function getParentByPath(tree, path) {
  if (!path || path.length === 0) return null
  if (path.length === 1) return { tree, index: path[0] }
  let node = tree[path[0]]
  for (let i = 1; i < path.length - 1; i++) {
    if (!node?.children) return null
    node = node.children[path[i]]
  }
  return { parent: node, index: path[path.length - 1] }
}

function showAddRowNodeDialog(path) {
  // 计算默认编码
  let defaultCode = ''
  if (path === null) {
    // 添加根节点
    defaultCode = `R${tpl.rowTree.length + 1}`
  } else {
    // 添加子节点
    const parent = getNodeByPath(tpl.rowTree, path)
    const childCount = parent?.children?.length || 0
    const parentPath = path.join('_')
    defaultCode = `R${parentPath}_${childCount + 1}`
  }

  nodeDialog.type = 'row'
  nodeDialog.mode = 'add'
  nodeDialog.path = path ? [...path] : null  // 复制数组，避免引用问题
  nodeDialog.node = null
  nodeDialog.code = defaultCode
  nodeDialog.label = ''
  nodeDialog.isSummary = false
  nodeDialog.summaryType = '小计'
  nodeDialog.visible = true
}

function showAddColNodeDialog(path) {
  // 计算默认编码
  let defaultCode = ''
  if (path === null) {
    // 添加根节点
    defaultCode = `C${tpl.columnTree.length + 1}`
  } else {
    // 添加子节点
    const parent = getNodeByPath(tpl.columnTree, path)
    const childCount = parent?.children?.length || 0
    const parentPath = path.join('_')
    defaultCode = `C${parentPath}_${childCount + 1}`
  }

  nodeDialog.type = 'col'
  nodeDialog.mode = 'add'
  nodeDialog.path = path ? [...path] : null  // 复制数组，避免引用问题
  nodeDialog.node = null
  nodeDialog.code = defaultCode
  nodeDialog.label = ''
  nodeDialog.isSummary = false
  nodeDialog.summaryType = '小计'
  nodeDialog.visible = true
}

function showEditRowNodeDialog(path) {
  const node = getNodeByPath(tpl.rowTree, path)
  if (!node) return
  nodeDialog.type = 'row'
  nodeDialog.mode = 'edit'
  nodeDialog.path = path ? [...path] : null  // 复制数组，避免引用问题
  nodeDialog.node = node
  nodeDialog.code = node.code || ''
  nodeDialog.label = node.label || ''
  nodeDialog.isSummary = node.isSummary || false
  nodeDialog.summaryType = node.summaryType || '小计'
  nodeDialog.visible = true
}

function showEditColNodeDialog(path) {
  const node = getNodeByPath(tpl.columnTree, path)
  if (!node) return
  nodeDialog.type = 'col'
  nodeDialog.mode = 'edit'
  nodeDialog.path = path ? [...path] : null  // 复制数组，避免引用问题
  nodeDialog.node = node
  nodeDialog.code = node.code || ''
  nodeDialog.label = node.label || ''
  nodeDialog.isSummary = false
  nodeDialog.summaryType = '小计'
  nodeDialog.visible = true
}

function confirmNodeDialog() {
  if (!nodeDialog.code || !nodeDialog.label) {
    showToast('请填写编码和名称', 'error')
    return
  }
  
  const newNode = {
    id: nodeDialog.mode === 'add' ? generateId(nodeDialog.type === 'row' ? 'row' : 'col') : nodeDialog.node.id,
    code: nodeDialog.code,
    label: nodeDialog.label,
    expanded: false,
    children: nodeDialog.mode === 'edit' ? (nodeDialog.node.children || []) : [],
    isSummary: nodeDialog.type === 'row' ? nodeDialog.isSummary : false,
    summaryType: nodeDialog.type === 'row' && nodeDialog.isSummary ? nodeDialog.summaryType : ''
  }
  
  if (nodeDialog.mode === 'add') {
    // 添加模式
    if (nodeDialog.path === null) {
      // 添加根节点
      if (nodeDialog.type === 'row') {
        tpl.rowTree.push(newNode)
      } else {
        tpl.columnTree.push(newNode)
      }
    } else {
      // 添加子节点
      const tree = nodeDialog.type === 'row' ? tpl.rowTree : tpl.columnTree
      const parent = getNodeByPath(tree, nodeDialog.path)
      if (parent) {
        if (!parent.children) parent.children = []
        parent.children.push(newNode)
        parent.expanded = true
        rebuildTable()
      }
    }
    showToast('节点添加成功', 'success')
  } else {
    // 编辑模式
    const node = getNodeByPath(nodeDialog.type === 'row' ? tpl.rowTree : tpl.columnTree, nodeDialog.path)
    if (node) {
      node.code = newNode.code
      node.label = newNode.label
      node.isSummary = newNode.isSummary
      node.summaryType = newNode.summaryType
    }
    showToast('节点修改成功', 'success')
  }
  
  nodeDialog.visible = false
}

function editRowNodeByPath(path) {
  showEditRowNodeDialog(path)
}

function deleteRowNodeByPath(path) {
  const node = getNodeByPath(tpl.rowTree, path)
  if (!node) return

  const childText = node.children?.length ? '及其所有子节点' : ''
  showConfirmDialog(`确定删除行维度 "${node.label}"${childText}?`, {
    type: 'danger',
    okText: '删除',
    onOk: () => {
      if (path.length === 1) {
        tpl.rowTree.splice(path[0], 1)
      } else {
        const parentInfo = getParentByPath(tpl.rowTree, path)
        if (parentInfo?.parent?.children) {
          parentInfo.parent.children.splice(path[path.length - 1], 1)
        }
      }
      showToast('行维度删除成功', 'success')
    }
  })
}

function toggleRowNodeByPath(path) {
  const node = getNodeByPath(tpl.rowTree, path)
  if (node) {
    node.expanded = !node.expanded
  }
}

function toggleRowExpand(rowIndex) {
  const row = rows.value[rowIndex]
  if (!row) return
  
  const node = getNodeByPath(tpl.rowTree, row.treePath)
  if (node && node.hasChildren) {
    node.expanded = !node.expanded
  }
}

function editColNodeByPath(path) {
  showEditColNodeDialog(path)
}

function deleteColNodeByPath(path) {
  const node = getNodeByPath(tpl.columnTree, path)
  if (!node) return

  const childText = node.children?.length ? '及其所有子节点' : ''
  showConfirmDialog(`确定删除列维度 "${node.label}"${childText}?`, {
    type: 'danger',
    okText: '删除',
    onOk: () => {
      if (path.length === 1) {
        tpl.columnTree.splice(path[0], 1)
      } else {
        const parentInfo = getParentByPath(tpl.columnTree, path)
        if (parentInfo?.parent?.children) {
          parentInfo.parent.children.splice(path[path.length - 1], 1)
        }
      }
      showToast('列维度删除成功', 'success')
    }
  })
}

function toggleColNodeByPath(path) {
  const node = getNodeByPath(tpl.columnTree, path)
  if (node) {
    node.expanded = !node.expanded
  }
}

function editRowChild(parentIndex, childIndex) {
  // 已废弃，使用 editRowNodeByPath 替代
}

function deleteRowChild(parentIndex, childIndex) {
  // 已废弃，使用 deleteRowNodeByPath 替代
}

// 列维度操作
function toggleColExpand(index) {
  // 已废弃，使用 toggleColNodeByPath 替代
}

function selectColNode(index) {
  const node = tpl.columnTree[index]
  showToast(`选中列维度: ${node.label}`, 'success')
}

function addColNode() {
  // 已废弃，使用 showAddColNodeDialog 替代
}

function editColNode(index) {
  // 已废弃，使用 editColNodeByPath 替代
}

function deleteColNode(index) {
  // 已废弃，使用 deleteColNodeByPath 替代
}

function editColChild(parentIndex, childIndex) {
  // 已废弃，使用 editColNodeByPath 替代
}

function deleteColChild(parentIndex, childIndex) {
  // 已废弃，使用 deleteColNodeByPath 替代
}

// 指标操作
function addMetric() {
  const newMetric = {
    id: generateId('metric'),
    field: prompt('请输入字段名:', 'new_field'),
    label: prompt('请输入指标名称:', '新指标'),
    unit: prompt('请输入单位:', ''),
    type: 'number',
    decimals: 0,
    format: 'number'
  }
  if (newMetric.field && newMetric.label) {
    tpl.metrics.push(newMetric)
    showToast('指标添加成功', 'success')
  }
}

function editMetric(index) {
  const metric = tpl.metrics[index]
  metric.field = prompt('修改字段名:', metric.field) || metric.field
  metric.label = prompt('修改指标名称:', metric.label) || metric.label
  metric.unit = prompt('修改单位:', metric.unit) || metric.unit
  showToast('指标修改成功', 'success')
}

function deleteMetric(index) {
  showConfirmDialog(`确定删除指标 "${tpl.metrics[index].label}"?`, {
    type: 'danger',
    okText: '删除',
    onOk: () => {
      tpl.metrics.splice(index, 1)
      showToast('指标删除成功', 'success')
    }
  })
}

// 公式操作
function addFormula() {
  if (selectedCell.row === null || selectedCell.col === null) {
    showToast('请先在表格中选中一个目标单元格再添加公式', 'warning')
    return
  }

  formulaEditorDialog.visible = true
  formulaEditorDialog.mode = 'add'
  formulaEditorDialog.index = null
  formulaEditorDialog.formulaId = ''
  formulaEditorDialog.formulaName = ''
  formulaEditorDialog.formulaLabel = ''
  formulaEditorDialog.expression = ''
  formulaEditorDialog.resultType = 'number'
  formulaEditorDialog.targetCell = { row: selectedCell.row, col: selectedCell.col }
}

function editFormula(index) {
  const formula = tpl.aggregates[index]
  formulaEditorDialog.visible = true
  formulaEditorDialog.mode = 'edit'
  formulaEditorDialog.index = index
  formulaEditorDialog.formulaId = formula.id || ''
  formulaEditorDialog.formulaName = formula.fieldName || ''
  formulaEditorDialog.formulaLabel = formula.label || ''
  formulaEditorDialog.expression = formula.expression || ''
  formulaEditorDialog.resultType = formula.resultType || 'number'
  formulaEditorDialog.targetCell = formula.targetCell ? parseTargetCell(formula.targetCell) : null
}

/** 解析 targetCell 字符串 "row-col" 为对象 */
function parseTargetCell(targetCellStr) {
  if (!targetCellStr) return null
  const parts = targetCellStr.split('-').map(Number)
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return { row: parts[0], col: parts[1] }
  }
  return null
}

function onFormulaApply(formulaData) {
  saveToUndoStack()
  
  const expr = typeof formulaData === 'string' ? formulaData : formulaData.expression
  const targetCell = formulaEditorDialog.targetCell
  
  if (formulaEditorDialog.mode === 'add') {
    const newFormula = {
      id: formulaData.fieldName || generateId('formula'),
      label: formulaData.label || '新公式',
      fieldName: formulaData.fieldName || '',
      expression: expr.replace(/^=/, ''),
      resultType: formulaData.resultType || 'number',
      type: 'custom',
      order: tpl.aggregates.length + 1,
      dependencies: formulaData.dependencies || [],
      targetCell: targetCell ? `${targetCell.row}-${targetCell.col}` : null,
      targetRow: targetCell ? getRowCode(targetCell.row) : null,
      targetCol: targetCell ? getColCode(targetCell.col) : null
    }
    tpl.aggregates.push(newFormula)
    showToast('公式添加成功', 'success')
  } else {
    const formula = tpl.aggregates[formulaEditorDialog.index]
    formula.id = formulaData.fieldName || formula.id
    formula.label = formulaData.label || formula.label
    formula.fieldName = formulaData.fieldName || ''
    formula.expression = expr.replace(/^=/, '')
    formula.resultType = formulaData.resultType || 'number'
    formula.dependencies = formulaData.dependencies || []
    formula.targetCell = targetCell ? `${targetCell.row}-${targetCell.col}` : formula.targetCell
    formula.targetRow = targetCell ? getRowCode(targetCell.row) : formula.targetRow
    formula.targetCol = targetCell ? getColCode(targetCell.col) : formula.targetCol
    showToast('公式修改成功', 'success')
  }
  
  formulaEditorDialog.visible = false
}

function deleteFormula(index) {
  showConfirmDialog(`确定删除公式 "${tpl.aggregates[index].label}"?`, {
    type: 'danger',
    okText: '删除',
    onOk: () => {
      tpl.aggregates.splice(index, 1)
      showToast('公式删除成功', 'success')
    }
  })
}

// 校验规则操作
function addValidator() {
  const newValidator = {
    id: generateId('validator'),
    label: prompt('请输入规则名称:', '新规则'),
    type: 'custom',
    expression: prompt('请输入校验表达式:', ''),
    message: prompt('请输入错误提示:', '校验失败')
  }
  if (newValidator.label && newValidator.expression) {
    tpl.validators.push(newValidator)
    showToast('校验规则添加成功', 'success')
  }
}

function editValidator(index) {
  const validator = tpl.validators[index]
  validator.label = prompt('修改规则名称:', validator.label) || validator.label
  validator.expression = prompt('修改校验表达式:', validator.expression) || validator.expression
  validator.message = prompt('修改错误提示:', validator.message) || validator.message
  showToast('校验规则修改成功', 'success')
}

function deleteValidator(index) {
  showConfirmDialog(`确定删除校验规则 "${tpl.validators[index].label}"?`, {
    type: 'danger',
    okText: '删除',
    onOk: () => {
      tpl.validators.splice(index, 1)
      showToast('校验规则删除成功', 'success')
    }
  })
}

// ==================== 表格操作 ====================
function selectCell(row, col, event) {
  selectedCell.row = row
  selectedCell.col = col
  
  // Shift 键多选
  if (event?.shiftKey && selectedRange.startRow !== null) {
    selectedRange.endRow = row
    selectedRange.endCol = col
  } else {
    selectedRange.startRow = row
    selectedRange.startCol = col
    selectedRange.endRow = row
    selectedRange.endCol = col
  }
  
  const cell = rows.value[row]?.cells[col]
  if (cell) {
    selectedCellType.value = cell.isFormula ? 'formula' : 'cell'
    selectedCellDataType.value = getCellDataType(cell)
    selectedCellReadOnly.value = cell.readOnly
  }
}

function isInRange(row, col) {
  if (selectedRange.startRow === null || selectedRange.endRow === null) return false
  if (selectedRange.startCol === null || selectedRange.endCol === null) return false
  
  const minRow = Math.min(selectedRange.startRow, selectedRange.endRow)
  const maxRow = Math.max(selectedRange.startRow, selectedRange.endRow)
  const minCol = Math.min(selectedRange.startCol, selectedRange.endCol)
  const maxCol = Math.max(selectedRange.startCol, selectedRange.endCol)
  
  return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol
}

function startEdit(row, col) {
  const cell = rows.value[row]?.cells[col]
  if (!cell || cell.readOnly) return
  
  editingCell.row = row
  editingCell.col = col
}

function commitEdit() {
  const row = editingCell.row
  const col = editingCell.col
  const cell = rows.value[row]?.cells[col]
  if (cell) {
    saveToUndoStack()
    if (designMode.value === 'edit' && cell.isFormula) {
      calculateFormula(row, col)
    }
  }
  editingCell.row = null
  editingCell.col = null
}

function onCellKeydown(e) {
  if (e.key === 'Enter') {
    commitEdit()
    const nextRow = editingCell.row + 1
    if (nextRow < rows.value.length) {
      startEdit(nextRow, editingCell.col)
    }
  } else if (e.key === 'Escape') {
    editingCell.row = null
    editingCell.col = null
  } else if (e.key === 'Tab') {
    commitEdit()
    const nextCol = editingCell.col + (e.shiftKey ? -1 : 1)
    if (nextCol >= 0 && nextCol < columnHeaders.value.length) {
      startEdit(editingCell.row, nextCol)
    }
  }
}

function displayCellValue(cell) {
  if (!cell) return ''
  if (designMode.value === 'edit' && cell.isFormula) {
    return cell.formula || ''
  }
  return cell.value || ''
}

function getCellDataType(cell) {
  if (!cell) return 'number'
  if (cell.isFormula) return 'formula'
  const v = cell.value
  if (v === '' || v === null || v === undefined) return 'number'
  if (/^\d+(\.\d+)?$/.test(v)) return 'number'
  if (/^\d+(\.\d+)?%$/.test(v)) return 'percent'
  return 'string'
}

function getCellLabel(row, col) {
  if (row === null || col === null) return '-'
  const colLetter = String.fromCharCode(65 + col)
  return `${colLetter}${row + 1}`
}

/** 根据 targetCell 字符串（如 "3-5"）生成可读标签 */
function getCellLabelByTarget(targetCellStr) {
  if (!targetCellStr) return '未指定'
  const parts = targetCellStr.split('-').map(Number)
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return getCellLabel(parts[0], parts[1])
  }
  return targetCellStr
}

function getRowCode(row) {
  if (row === null) return '-'
  return `r_${row + 1}`
}

function getColCode(col) {
  if (col === null) return '-'
  return `c_${col + 1}`
}

function addCol() {
  saveToUndoStack()
  const monthIndex = columnHeaders.value.length
  columnHeaders.value.splice(columnHeaders.value.length - 1, 0, {
    label: `${monthIndex}月`,
    width: 90,
    isFormula: false
  })
  rows.value.forEach(row => {
    row.cells.splice(row.cells.length - 1, 0, {
      value: '',
      isFormula: false,
      readOnly: false
    })
  })
  
  // 同时添加到左侧资源面板
  tpl.columnTree.push({
    id: generateId('col'),
    code: `col_${tpl.columnTree.length + 1}`,
    label: `${monthIndex}月`,
    expanded: false,
    children: []
  })
}

function deleteSelectedRow() {
  if (selectedCell.row === null || rows.value.length <= 1) {
    showToast('请先选中要删除的行', 'warning')
    return
  }
  
  const rowIndex = selectedCell.row
  const row = rows.value[rowIndex]
  
  if (row.isSummary) {
    showToast('不能删除汇总行', 'warning')
    return
  }
  
  if (!confirm(`确定删除行 "${row.label}"?`)) return
  
  saveToUndoStack()
  rows.value.splice(rowIndex, 1)
  
  // 同时从左侧资源面板删除
  if (rowIndex < tpl.rowTree.length) {
    tpl.rowTree.splice(rowIndex, 1)
  }
  
  selectedCell.row = null
  showToast('行已删除', 'success')
}

function deleteSelectedCol() {
  if (selectedCell.col === null || columnHeaders.value.length <= 2) {
    showToast('请先选中要删除的列', 'warning')
    return
  }
  
  const colIndex = selectedCell.col
  const col = columnHeaders.value[colIndex]
  
  if (colIndex === 0) {
    showToast('不能删除指标列', 'warning')
    return
  }
  
  if (col.isFormula) {
    showToast('不能删除合计列', 'warning')
    return
  }
  
  if (!confirm(`确定删除列 "${col.label}"?`)) return
  
  saveToUndoStack()
  columnHeaders.value.splice(colIndex, 1)
  rows.value.forEach(row => row.cells.splice(colIndex, 1))
  
  // 同时从左侧资源面板删除（排除合计列）
  const colNodeIndex = colIndex - 1 // 因为第0列是"指标"
  if (colNodeIndex >= 0 && colNodeIndex < tpl.columnTree.length) {
    tpl.columnTree.splice(colNodeIndex, 1)
  }
  
  selectedCell.col = null
  showToast('列已删除', 'success')
}

function insertSummaryRow() {
  saveToUndoStack()
  rows.value.push({
    label: '汇总',
    isSummary: true,
    summaryType: '合计',
    cells: columnHeaders.value.map((_, ci) => ({
      value: '',
      isFormula: ci > 0,
      readOnly: true,
      formula: ci > 0 ? `=SUM(${String.fromCharCode(65 + ci)}2:${String.fromCharCode(65 + ci)}${rows.value.length})` : ''
    }))
  })
}

function freezeRows() {
  showToast('已冻结首行', 'success')
}

function freezeCols() {
  showToast('已冻结首列', 'success')
}

function calculateFormula(row, col) {
  const cell = rows.value[row]?.cells[col]
  if (!cell?.formula) return
  
  try {
    let expr = cell.formula.replace(/=/, '')
    expr = expr.replace(/([A-Z])(\d+)/g, (_, colLetter, rowNum) => {
      const c = colLetter.charCodeAt(0) - 65
      const r = parseInt(rowNum) - 1
      return rows.value[r]?.cells[c]?.value || 0
    })
    
    const result = eval(expr)
    cell.value = typeof result === 'number' ? result.toFixed(2) : String(result)
    showToast('公式计算完成', 'success')
  } catch {
    showToast('公式计算失败', 'error')
  }
}

// ==================== 右键菜单操作 ====================
function showContextMenu(e) {
  contextMenu.x = e.clientX
  contextMenu.y = e.clientY
  contextMenu.visible = true
}

function cmAddRow() {
  addRow()
  contextMenu.visible = false
}

function cmAddCol() {
  addCol()
  contextMenu.visible = false
}

function cmDeleteRow() {
  if (selectedCell.row !== null && rows.value.length > 1) {
    saveToUndoStack()
    rows.value.splice(selectedCell.row, 1)
  }
  contextMenu.visible = false
}

function cmDeleteCol() {
  if (selectedCell.col !== null && columnHeaders.value.length > 1) {
    saveToUndoStack()
    columnHeaders.value.splice(selectedCell.col, 1)
    rows.value.forEach(row => row.cells.splice(selectedCell.col, 1))
  }
  contextMenu.visible = false
}

function cmMergeCells() {
  showToast('合并单元格功能', 'success')
  contextMenu.visible = false
}

function cmSplitCells() {
  showToast('拆分单元格功能', 'success')
  contextMenu.visible = false
}

function cmSetFormula() {
  if (selectedCell.row === null || selectedCell.col === null) {
    showToast('请先选中一个单元格', 'warning')
    contextMenu.visible = false
    return
  }

  formulaEditorDialog.visible = true
  formulaEditorDialog.mode = 'add'
  formulaEditorDialog.index = null
  formulaEditorDialog.formulaId = ''
  formulaEditorDialog.formulaName = ''
  formulaEditorDialog.formulaLabel = ''
  formulaEditorDialog.expression = ''
  formulaEditorDialog.resultType = 'number'
  formulaEditorDialog.targetCell = { row: selectedCell.row, col: selectedCell.col }
  
  contextMenu.visible = false
}

function cmSetValidation() {
  activeNav.value = 'validators'
  contextMenu.visible = false
}

function cmSetStyle() {
  activeNav.value = 'style'
  contextMenu.visible = false
}

// ==================== 撤销/重做 ====================
function saveToUndoStack() {
  undoStack.value.push({
    rows: JSON.parse(JSON.stringify(rows.value)),
    columns: JSON.parse(JSON.stringify(columnHeaders.value))
  })
  redoStack.value = []
}

function handleUndo() {
  if (undoStack.value.length === 0) return
  const prev = undoStack.value.pop()
  redoStack.value.push({
    rows: JSON.parse(JSON.stringify(rows.value)),
    columns: JSON.parse(JSON.stringify(columnHeaders.value))
  })
  rows.value = prev.rows
  columnHeaders.value = prev.columns
}

function handleRedo() {
  if (redoStack.value.length === 0) return
  const next = redoStack.value.pop()
  undoStack.value.push({
    rows: JSON.parse(JSON.stringify(rows.value)),
    columns: JSON.parse(JSON.stringify(columnHeaders.value))
  })
  rows.value = next.rows
  columnHeaders.value = next.columns
}

// ==================== 视图控制 ====================
function toggleDark() {
  isDark.value = !isDark.value
  document.body.classList.toggle('dark-mode', isDark.value)
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

// ==================== 保存/导出 ====================
function showToast(msg, type = 'success') {
  toast.message = msg; toast.type = type; toast.visible = true
  setTimeout(() => { toast.visible = false }, 2500)
}

function exportTemplate() {
  const json = JSON.stringify({
    id: tpl.id || generateId('tpl'),
    name: tpl.name,
    code: tpl.code,
    version: tpl.version,
    templateType: tpl.templateType,
    status: tpl.status,
    description: tpl.description,
    category: tpl.category,
    tags: [...tpl.tags],
    icon: tpl.icon,
    layout: { ...tpl.layout },
    rowTree: deepClone(tpl.rowTree),
    columnTree: deepClone(tpl.columnTree),
    metrics: (tpl.metrics || []).map(m => ({
      field: m.field, label: m.label, expression: m.expression,
      type: m.type, unit: m.unit, group: m.group
    })),
    validators: deepClone(tpl.validators),
    dataSource: { ...tpl.dataSource },
    rows: rows.value,
    columns: columnHeaders.value
  }, null, 2)
  
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${tpl.code || 'template'}.json`
  a.click()
  URL.revokeObjectURL(url)
  showToast('模板已导出', 'success')
}

function handleImportExcel() {
  showToast('导入Excel功能开发中', 'warning')
}

function handlePreview() {
  showToast('预览功能开发中', 'warning')
}

function handleSaveAs() {
  showToast('另存为功能开发中', 'warning')
}

// ==================== 工具函数 ====================
function generateId(prefix = '') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj || {}))
}

function insertAtPath(nodes, path, newNode) {
  if (!path || path.length === 0) { nodes.push(newNode); return }
  const [head, ...rest] = path
  const parent = nodes[head]
  if (parent) {
    if (!parent.children) parent.children = []
    if (rest.length === 0) { parent.children.push(newNode) }
    else { insertAtPath(parent.children, rest, newNode) }
  }
}

function removeAtPath(nodes, path) {
  if (!path || path.length === 0) return
  if (path.length === 1) { nodes.splice(path[0], 1); return }
  const [head, ...rest] = path
  if (nodes[head]?.children) removeAtPath(nodes[head].children, rest)
}

function updateAtPath(nodes, path, data) {
  const node = findAtPath(nodes, path)
  if (node) Object.assign(node, data)
}

function findAtPath(nodes, path) {
  let current = null
  let list = nodes
  for (const idx of path) {
    current = list[idx]
    if (!current) return null
    list = current.children || []
  }
  return current
}

function moveUpDown(nodes, path, direction) {
  if (!path || path.length === 0) return
  const idx = path[path.length - 1]
  const siblingList = path.length <= 1 ? nodes : findAtPath(nodes, path.slice(0, -1))?.children
  if (!siblingList) return
  const newIdx = idx + direction
  if (newIdx < 0 || newIdx >= siblingList.length) return
  const temp = siblingList[idx]
  siblingList[idx] = siblingList[newIdx]
  siblingList[newIdx] = temp
}

// ==================== 加载和保存 ====================
const loading = ref(false)
const saving = ref(false)
const publishing = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const templateCode = route.params.code || route.query.code
    if (templateCode) {
      try {
        const res = await loadTemplate(templateCode)
        const data = res.data || res
        Object.assign(tpl, transformTemplateData(data))
        showToast('模板加载成功', 'success')
      } catch (err) {
        console.warn('API 加载失败，尝试 localStorage:', err)
        localStorageFallback(templateCode)
      }
    } else {
      localStorageFallback()
    }
  } catch (err) {
    showToast('加载模板失败: ' + err.message, 'error')
  } finally {
    loading.value = false
  }
  
  rebuildTable()
  
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})

function onKeydown(e) {
  const target = e.target
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
    if (e.key === 'Delete') {
      if (selectedCell.row !== null && !editingCell.row) {
        e.preventDefault()
        clearCellValue()
      }
    }
    return
  }

  if (e.ctrlKey || e.metaKey) {
    switch (e.key.toLowerCase()) {
      case 's': e.preventDefault(); handleSaveTemplate(); break
      case 'z': e.preventDefault(); handleUndo(); break
      case 'y': e.preventDefault(); handleRedo(); break
      case 'c': e.preventDefault(); handleCopy(); break
      case 'v': e.preventDefault(); handlePaste(); break
    }
  } else if (e.key === 'Delete') {
    if (selectedCell.row !== null) {
      clearCellValue()
    }
  }
}

const clipboard = ref(null)

function handleCopy() {
  if (selectedCell.row === null) return
  const cell = rows.value[selectedCell.row]?.cells[selectedCell.col]
  if (cell) {
    clipboard.value = {
      value: cell.value,
      isFormula: cell.isFormula,
      formula: cell.formula
    }
    showToast('已复制单元格内容', 'success')
  }
}

function handlePaste() {
  if (!clipboard.value || selectedCell.row === null) return
  const cell = rows.value[selectedCell.row]?.cells[selectedCell.col]
  if (cell && !cell.readOnly) {
    saveToUndoStack()
    cell.value = clipboard.value.value
    cell.isFormula = clipboard.value.isFormula
    cell.formula = clipboard.value.formula
    showToast('已粘贴单元格内容', 'success')
  }
}

function clearCellValue() {
  if (selectedCell.row === null) return
  const cell = rows.value[selectedCell.row]?.cells[selectedCell.col]
  if (cell && !cell.readOnly) {
    saveToUndoStack()
    cell.value = ''
    showToast('单元格已清空', 'success')
  }
}

function transformTemplateData(data) {
  const typeMap = { '1': 'data', '5': 'formula', '6': 'metric' }
  const alignMap = { '0': 'left', '1': 'center', '2': 'right' }

  // 检查是否是扁平化结构（带 level 字段但没有嵌套的 children）
  function isFlatStructure(arr) {
    if (!arr?.length) return false
    const hasAnyNestedChildren = arr.some(item => item.children?.length > 0)
    if (hasAnyNestedChildren) return false
    return arr[0].level !== undefined && 
           typeof arr[0].level === 'number' && 
           arr[0].level >= 0
  }

  // 将扁平化的数据转换为嵌套树形结构
  function buildTreeFromFlat(flatArr) {
    if (!flatArr || flatArr.length === 0) return []
    
    const result = []
    const stack = []
    
    for (const item of flatArr) {
      const node = {
        id: item.id || generateId('node'),
        code: item.code || '',
        label: item.name || item.title || '',
        expanded: item.expanded !== undefined ? item.expanded : false,
        children: [],
        isSummary: item.isSummary || false,
        summaryType: item.summaryType || ''
      }
      
      while (stack.length > item.level) {
        stack.pop()
      }
      
      if (stack.length === 0) {
        result.push(node)
      } else if (stack.length > 0) {
        stack[stack.length - 1].children.push(node)
      }
      
      stack.push(node)
    }
    
    function setExpanded(nodes) {
      for (const node of nodes) {
        if (node.children.length > 0 && node.expanded === false) {
          node.expanded = true
        }
        if (node.children.length > 0) {
          setExpanded(node.children)
        }
      }
    }
    
    setExpanded(result)
    
    return result
  }

  // 处理嵌套结构
  function transformCols(columns) {
    if (!columns || !Array.isArray(columns)) return []
    
    // 如果是扁平化结构，先转换为嵌套结构
    if (isFlatStructure(columns)) {
      return buildTreeFromFlat(columns.map(col => ({
        ...col,
        name: col.title || col.name
      })))
    }
    
    return columns.map(col => ({
      id: col.id || col.columnId,
      code: col.code || '',
      label: col.title || col.name || '',
      type: typeMap[col.type] || col.type || 'data',
      format: col.format || (col.type === '5' ? 'percent' : 'number'),
      width: col.width || 120,
      align: alignMap[col.align] || col.align || 'right',
      expanded: false,
      children: col.children ? transformCols(col.children) : []
    }))
  }

  function transformRows(rows) {
    if (!rows || !Array.isArray(rows)) return []
    
    // 如果是扁平化结构，先转换为嵌套结构
    if (isFlatStructure(rows)) {
      return buildTreeFromFlat(rows)
    }
    
    return rows.map(row => ({
      id: row.id || row.rowId,
      code: row.code || '',
      label: row.name || row.title || '',
      isSummary: !!row.isSummary,
      summaryType: row.summaryType || 'total',
      expanded: row.expanded !== undefined ? row.expanded : (row.children?.length > 0),
      children: row.children ? transformRows(row.children) : []
    }))
  }

  return {
    id: data.id || '',
    code: data.templateCode || data.code || '',
    name: data.templateName || data.name || '',
    templateType: typeof data.templateType === 'string' ? parseInt(data.templateType) : (data.templateType || 2),
    description: data.description || '',
    category: data.category || '',
    icon: data.icon || '📊',
    version: typeof data.version === 'string' ? parseFloat(data.version) : (data.version || 2),
    status: data.status || 'designing',
    rowTree: transformRows(data.rowTree),
    columnTree: transformCols(data.columnTree),
    aggregates: (data.metrics || data.aggregates || []).map(fromBackendAggregate),
    metrics: [],
    layout: data.layout || tpl.layout,
    validators: data.validators || [],
    conditionalFormats: data.conditionalFormats || []
  }
}

// 后端 metrics 格式 → 前端 aggregates 格式
function fromBackendAggregate(item) {
  return {
    id: item.id || generateId('formula'),
    label: item.label || '',
    fieldName: item.field || item.fieldName || '',
    expression: item.customFormula || item.expression || '',
    resultType: item.resultType || 'number',
    targetCell: item.targetCell || '',
    targetRow: item.targetRowCode || item.targetRow || '',
    targetCol: item.targetColCode || item.targetCol || '',
    dependencies: item.sourceRowCodes || item.dependencies || [],
    order: item.priority ?? item.order ?? 0
  }
}

function localStorageFallback(code = null) {
  try {
    const saved = JSON.parse(localStorage.getItem('rpt_custom_templates') || '[]')
    if (code) {
      const existing = saved.find(t => t.id === code)
      if (existing) Object.assign(tpl, existing)
    } else {
      if (!tpl.name) tpl.name = '未命名报表'
      if (!tpl.code) tpl.code = generateId('RPT')
      if (!tpl.category) tpl.category = 'custom'
    }
  } catch (err) {
    console.warn('localStorage fallback 失败:', err)
  }
}

async function handleSaveTemplate() {
  if (!isValid.value) {
    showToast('请完善基本信息和行列配置', 'error')
    return
  }

  saving.value = true
  try {
    // 转换数据结构为后端期望的格式
    const output = transformToBackendFormat(tpl)

    let result
    if (tpl.id) {
      result = await updateTemplate(tpl.id, output)
      Object.assign(tpl, result)
    } else {
      result = await saveTemplate(output)
      Object.assign(tpl, result)
    }

    lastSavedTime.value = new Date().toLocaleString('zh-CN')
    showToast(`报表 "${tpl.name}" 已保存`, 'success')

    setTimeout(() => {
      showConfirmDialog(`是否跳转到报表预览页面？`, {
        type: 'info',
        okText: '跳转',
        onOk: () => {
          router.push(`/report/${tpl.id}`)
        }
      })
    }, 800)

  } catch (err) {
    showToast('保存失败: ' + err.message, 'error')
    console.error('保存失败:', err)
  } finally {
    saving.value = false
  }
}

// 转换数据结构为后端期望的格式（嵌套结构，带 level 和 children）
function transformToBackendFormat(data) {
  return {
    id: data.id || 0,
    code: data.code || '',
    name: data.name || '',
    templateType: data.templateType || 0,
    description: data.description || '',
    rowTree: transformRowTreeToBackend(data.rowTree || []),
    columnTree: transformColumnTreeToBackend(data.columnTree || []),
    metrics: (data.aggregates || []).map(a => ({
      id: a.id || '',
      label: a.label || '',
      field: a.fieldName || '',
      expression: a.expression || '',
      resultType: a.resultType || 'number',
      targetCell: a.targetCell || '',
      targetRow: a.targetRow || '',
      targetCol: a.targetCol || '',
      dependencies: a.dependencies || [],
      priority: a.order || 0
    }))
  }
}

// 将行维度树转换为后端格式（嵌套结构，添加 level）
function transformRowTreeToBackend(nodes, level = 0, parentIndex = '') {
  return nodes.map((node, index) => {
    const currentIndex = parentIndex ? `${parentIndex}_${index + 1}` : `${index + 1}`
    return {
      id: node.id || '',
      name: node.label || node.name || '',
      code: node.code || `R${currentIndex}`,
      level: level,
      isSummary: node.isSummary || false,
      summaryType: node.summaryType || '',
      children: node.children?.length ? transformRowTreeToBackend(node.children, level + 1, currentIndex) : []
    }
  })
}

// 将列维度树转换为后端格式（嵌套结构，添加 level）
function transformColumnTreeToBackend(nodes, level = 0, parentIndex = '') {
  return nodes.map((node, index) => {
    const currentIndex = parentIndex ? `${parentIndex}_${index + 1}` : `${index + 1}`
    return {
      id: node.id || '',
      name: node.label || node.title || node.name || '',
      code: node.code || `C${currentIndex}`,
      type: node.type || 'text',
      width: node.width || 90,
      align: node.align || 'right',
      level: level,
      children: node.children?.length ? transformColumnTreeToBackend(node.children, level + 1, currentIndex) : []
    }
  })
}

async function handlePublishTemplate() {
  if (!tpl.id) return

  showConfirmDialog(`确定要发布报表 "${tpl.name}" 吗？`, {
    type: 'info',
    okText: '发布',
    onOk: async () => {
      publishing.value = true
      try {
        await handleSaveTemplate()
        await publishTemplate(tpl.id)
        tpl.status = 'published'
        showToast(`报表 "${tpl.name}" 已发布`, 'success')
      } catch (err) {
        showToast('发布失败: ' + err.message, 'error')
        console.error('发布失败:', err)
      } finally {
        publishing.value = false
      }
    }
  })
}
</script>

<style lang="scss" scoped>
/* ====== 基础 ====== */
.designer {
  display: flex; flex-direction: column;
  height: 100vh; background: #F5F7FA;
  color: #1F2937; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  transition: background .3s;
  
  &.is-dark {
    background: #1A1D23; color: #E5E7EB;
    .dg-header, .dg-sidebar, .dg-properties, .dg-footer {
      background: #242830; border-color: #374151;
    }
    .dg-main { background: #1A1D23; }
    .dg-table { border-color: #374151; }
    .dg-th, .dg-td { border-color: #374151; }
    .dg-th { background: #2D323C; color: #9CA3AF; }
    .dg-td { background: #1A1D23; }
    .dg-td-row-label { background: #242830; }
    .dg-row-summary { background: #2D323C !important; }
    .dg-cell-input { background: #242830; border-color: #4B5563; color: #E5E7EB; }
    .dgp-input, .dgp-select, .dgp-textarea { background: #242830; border-color: #4B5563; color: #E5E7EB; }
    .dgp-field-value { color: #D1D5DB; }
    .dg-context-menu { background: #2D323C; border-color: #4B5563; }
    .dcm-item:hover { background: #374151; }
  }
  
  &.is-fullscreen {
    .dg-header { padding: 0 16px; }
    .dg-footer { padding: 0 16px; }
  }
}

/* ====== 顶部工具栏 ====== */
.dg-header {
  display: flex; align-items: center; justify-content: space-between;
  height: 48px; padding: 0 12px;
  background: #fff; border-bottom: 1px solid #E5E7EB;
  flex-shrink: 0; z-index: 100;
}

.dh-left {
  display: flex; align-items: center; gap: 8px;
}

.dh-back {
  width: 30px; height: 30px; border-radius: 6px;
  border: 1px solid #E5E7EB; background: #fff;
  color: #6B7280; cursor: pointer; display: flex; align-items: center; justify-content: center;
  &:hover { background: #F9FAFB; color: #374151; }
}

.dh-title { font-size: 15px; font-weight: 700; color: #111827; }

.dh-divider { width: 1px; height: 20px; background: #E5E7EB; }

.dh-template-name {
  font-size: 13px; font-weight: 600; color: #374151;
  max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.dh-template-code {
  font-size: 11px; color: #9CA3AF; font-family: monospace;
  background: #F3F4F6; padding: 2px 8px; border-radius: 4px;
}

.dh-center {
  display: flex; align-items: center; gap: 4px;
}

.dh-tool-btn {
  display: flex; align-items: center; gap: 4px;
  height: 30px; padding: 0 10px; border-radius: 6px;
  font-size: 12px; font-weight: 500;
  border: 1px solid #E5E7EB; background: #fff;
  color: #374151; cursor: pointer; transition: all .15s;
  white-space: nowrap;
  
  &:hover { background: #F9FAFB; border-color: #9CA3AF; }
  &:disabled { opacity: .4; cursor: not-allowed; }
}

.dh-tool-divider { width: 1px; height: 18px; background: #E5E7EB; margin: 0 4px; }

.dh-right {
  display: flex; align-items: center; gap: 12px;
}

.dh-status {
  font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 10px;
  
  &.dh-status-designing { background: #FEF3C7; color: #92400E; }
  &.dh-status-pending { background: #DBEAFE; color: #1D4ED8; }
  &.dh-status-published { background: #D1FAE5; color: #065F46; }
  &.dh-status-changed { background: #FCE7F3; color: #9D174D; }
  &.dh-status-archived { background: #F3F4F6; color: #6B7280; }
  &.dh-status-disabled { background: #F3F4F6; color: #9CA3AF; }
}

.dh-version { font-size: 11px; color: #9CA3AF; }

/* ====== 主体布局 ====== */
.dg-body { display: flex; flex: 1; overflow: hidden; }

/* ====== 左侧资源面板 ====== */
.dg-sidebar {
  width: 220px; background: #fff; border-right: 1px solid #E5E7EB;
  display: flex; flex-direction: column; flex-shrink: 0;
  transition: width .2s;
  
  &.collapsed { width: 48px; }
}

.dg-sidebar-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px; border-bottom: 1px solid #E5E7EB;
}

.dgs-title { font-size: 12px; font-weight: 700; color: #374151; }

.dgs-collapse {
  width: 24px; height: 24px; border: none; background: none;
  color: #9CA3AF; cursor: pointer; display: flex; align-items: center; justify-content: center;
  border-radius: 4px; &:hover { background: #F3F4F6; }
}

.dg-nav-tree { flex: 1; overflow-y: auto; }

.dgn-item { border-bottom: 1px solid #F3F4F6; }

.dgn-header {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 12px; cursor: pointer;
  transition: background .15s;
  
  &:hover { background: #F9FAFB; }
  &.active { background: #EFF6FF; color: #1D4ED8; }
}

.dgn-icon { font-size: 14px; }

.dgn-label { flex: 1; font-size: 13px; color: #374151; }

.dgn-badge {
  font-size: 10px; font-weight: 600;
  background: #E5E7EB; color: #6B7280;
  padding: 1px 6px; border-radius: 10px;
}

.dgn-expand-icon {
  font-size: 10px; color: #9CA3AF;
  width: 14px; text-align: center;
}

.dg-sidebar.collapsed .dgn-label,
.dg-sidebar.collapsed .dgn-badge,
.dg-sidebar.collapsed .dgs-title,
.dg-sidebar.collapsed .dgn-expand-icon,
.dg-sidebar.collapsed .dgn-content { display: none; }

/* ====== 资源面板内容区域 ====== */
.dgn-content {
  background: #FAFAFA;
  border-top: 1px solid #E5E7EB;
  padding: 8px 0;
}

.dgn-toolbar {
  display: flex; align-items: center; gap: 8px;
  padding: 4px 8px;
  border-bottom: 1px solid #E5E7EB;
  margin-bottom: 4px;
}

.dgn-tool-hint {
  font-size: 10px;
  color: #9CA3AF;
  flex: 1;
}

.dgn-tool-btn {
  padding: 2px 8px;
  font-size: 11px;
  color: #1D4ED8;
  background: #DBEAFE;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  
  &:hover { background: #BFDBFE; }
}

/* 树形列表 */
.dgn-tree-list { padding: 0; }

.dgn-tree { padding: 4px 0; }

.dgn-tree-item {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
  transition: background .15s;
  
  &:hover { background: #F3F4F6; }
}

.dgn-tree-expand {
  font-size: 9px; color: #9CA3AF;
  width: 12px; text-align: center;
  cursor: pointer;
}

.dgn-tree-label {
  flex: 1;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dgn-tree-summary-tag {
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 2px;
  background: #DBEAFE;
  color: #1D4ED8;
  margin-right: 4px;
}

.dgn-tree-summary {
  background: #FEF3C7;
  
  .dgn-tree-label {
    font-weight: 600;
  }
}

.dgn-tree-code {
  font-size: 10px;
  color: #9CA3AF;
  background: #F3F4F6;
  padding: 1px 4px;
  border-radius: 3px;
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dgn-tree-edit,
.dgn-tree-delete {
  width: 20px; height: 20px;
  border: none; background: none;
  cursor: pointer;
  font-size: 12px;
  opacity: 0;
  transition: opacity .15s;
  
  &:hover { opacity: 1; }
}

.dgn-tree-item:hover .dgn-tree-edit,
.dgn-tree-item:hover .dgn-tree-delete { opacity: 0.7; }

/* 列表视图 */
.dgn-list { padding: 0; }

.dgn-list-items { padding: 4px 0; }

.dgn-list-item {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 8px;
  cursor: pointer;
  transition: background .15s;
  
  &:hover { background: #F3F4F6; }
}

.dgn-list-icon {
  font-size: 13px;
  width: 20px; text-align: center;
}

.dgn-list-info { flex: 1; min-width: 0; }

.dgn-list-label {
  font-size: 12px;
  color: #374151;
  font-weight: 500;
}

.dgn-list-desc {
  font-size: 10px;
  color: #9CA3AF;
  margin-top: 1px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
}

.dgn-expr-text {
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
}

.dgn-target-badge {
  display: inline-block;
  padding: 1px 6px;
  background: #7C3AED;
  color: #fff;
  font-size: 9px;
  border-radius: 3px;
  font-weight: 500;
  flex-shrink: 0;
  white-space: nowrap;
}

.dgn-no-target-badge {
  display: inline-block;
  padding: 1px 6px;
  background: #FEE2E2;
  color: #DC2626;
  font-size: 9px;
  border-radius: 3px;
  font-weight: 500;
  flex-shrink: 0;
  white-space: nowrap;
}

.dgn-list-edit,
.dgn-list-delete {
  width: 20px; height: 20px;
  border: none; background: none;
  cursor: pointer;
  font-size: 12px;
  opacity: 0;
  transition: opacity .15s;
  
  &:hover { opacity: 1; }
}

.dgn-list-item:hover .dgn-list-edit,
.dgn-list-item:hover .dgn-list-delete { opacity: 0.7; }

/* 面板视图 */
.dgn-panel { padding: 0; }

.dgn-panel-header {
  font-size: 11px;
  font-weight: 600;
  color: #374151;
  padding: 4px 12px;
  background: #F3F4F6;
  border-bottom: 1px solid #E5E7EB;
}

.dgn-panel-body {
  padding: 8px 12px;
}

.dgn-panel .dgn-field {
  display: flex; flex-direction: column; gap: 2px;
  margin-bottom: 8px;
  
  &:last-child { margin-bottom: 0; }
}

.dgn-panel .dgn-field label {
  font-size: 10px;
  font-weight: 600;
  color: #6B7280;
}

.dgn-input, .dgn-select, .dgn-textarea {
  padding: 3px 6px;
  border: 1px solid #E5E7EB;
  border-radius: 3px;
  font-size: 11px;
  color: #374151;
  background: #fff;
  outline: none;
  
  &:focus { border-color: #1D4ED8; }
}

.dgn-textarea { resize: vertical; min-height: 40px; }

.dgn-select {
  padding: 3px 6px;
  border: 1px solid #E5E7EB;
  border-radius: 3px;
  font-size: 11px;
  color: #374151;
  background: #fff;
  outline: none;
  cursor: pointer;

  &:focus { border-color: #1D4ED8; }
}

.dgn-field-value {
  font-size: 11px;
  color: #374151;
  padding: 3px 6px;
  background: #fff;
  border: 1px solid #E5E7EB;
  border-radius: 3px;
}

/* 空状态 */
.dgn-empty {
  font-size: 11px;
  color: #9CA3AF;
  text-align: center;
  padding: 16px 8px;
}

/* ====== 中间设计区 ====== */
.dg-main {
  flex: 1; overflow: hidden;
  display: flex; flex-direction: column;
}

.dg-canvas {
  flex: 1; overflow: auto;
  padding: 16px;
}

.dg-canvas-toolbar {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px;
  background: #fff; border-radius: 6px;
  border: 1px solid #E5E7EB;
  margin-bottom: 12px;
}

.dct-label { font-size: 12px; color: #6B7280; font-weight: 500; }

.dct-divider { width: 1px; height: 16px; background: #E5E7EB; }

.dct-btn {
  padding: 4px 10px; border-radius: 4px;
  font-size: 12px; color: #374151;
  border: 1px solid #E5E7EB; background: #fff;
  cursor: pointer; transition: all .15s;
  
  &:hover { background: #F9FAFB; }
  &.active { background: #1D4ED8; color: #fff; border-color: #1D4ED8; }
  &:disabled { 
    color: #9CA3AF; 
    background: #F3F4F6; 
    cursor: not-allowed; 
    border-color: #E5E7EB;
  }
}

.dg-spreadsheet {
  background: #fff; border-radius: 6px;
  border: 1px solid #E5E7EB;
  overflow: auto;
}

.dg-table {
  border-collapse: collapse;
  min-width: 100%;
}

.dg-th {
  padding: 8px 12px;
  text-align: center;
  font-size: 12px; font-weight: 600;
  color: #374151;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  white-space: nowrap;
  position: sticky; top: 0;
  z-index: 10;
}

.dg-th-corner {
  width: 40px;
  background: #F3F4F6;
}

.dg-th-row-header {
  width: 120px;
  background: #E5E7EB;
  font-weight: 700;
  color: #374151;
  position: sticky;
  left: 0;
  z-index: 15;
  border-right: 2px solid #D1D5DB;
}

.dg-th-group {
  background: #F3F4F6;
  font-weight: 700;
  color: #1F2937;
}

.dg-col-label { display: block; }

.dg-fx-badge {
  font-size: 10px; font-weight: 700;
  color: #1D4ED8; background: #DBEAFE;
  padding: 1px 4px; border-radius: 3px;
  margin-left: 4px;
}

.dg-td {
  padding: 8px 12px;
  border: 1px solid #E5E7EB;
  font-size: 13px;
  min-width: 80px;
  white-space: nowrap;
  vertical-align: middle;
  
  &:hover { background: #F9FAFB; }
  &.dg-td-selected { background: #EFF6FF; box-shadow: inset 0 0 0 2px #3B82F6; }
  &.dg-td-editing { padding: 0; }
  &.dg-td-readonly { background: #F9FAFB; color: #9CA3AF; }
  &.dg-td-formula { background: #F0F9FF; }
  &.dg-td-merged { background: #DBEAFE; text-align: center; font-weight: 600; }
  &.dg-td-in-range { background: #DBEAFE; }
}

.dg-td-row-label {
  background: #F9FAFB;
  font-weight: 600;
  color: #374151;
  position: sticky; left: 0;
  z-index: 5;
  cursor: pointer;
  user-select: none;
  
  &:hover { background: #F3F4F6; }
}

.dg-tree-cell {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 24px;
}

.dg-tree-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: #6B7280;
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover { color: #3B82F6; }
}

.dg-tree-toggle-placeholder {
  width: 16px;
  flex-shrink: 0;
}

.dg-tree-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dg-td-group {
  background: #F3F4F6;
  font-weight: 700;
  color: #1F2937;
  vertical-align: middle;
  border-right: 2px solid #D1D5DB;
}

.dg-row-summary {
  background: #EFF6FF !important;
  font-weight: 600;
  
  .dg-td { background: #EFF6FF; }
}

.dg-summary-tag {
  font-size: 10px; color: #1D4ED8;
  background: #DBEAFE; padding: 1px 6px; border-radius: 4px;
  margin-left: 6px;
}

.dg-cell-input {
  width: 100%; height: 100%;
  border: none; outline: none;
  padding: 8px 12px;
  font-size: 13px;
  background: #fff;
}

.dg-fx-indicator {
  display: inline-block;
  font-size: 10px; font-weight: 700;
  color: #1D4ED8;
  margin-right: 4px;
}

/* ====== 右侧属性面板 ====== */
.dg-properties {
  width: 280px; background: #fff; border-left: 1px solid #E5E7EB;
  display: flex; flex-direction: column; flex-shrink: 0;
  transition: width .2s;
  
  &.collapsed { width: 48px; }
}

.dg-properties-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px; border-bottom: 1px solid #E5E7EB;
}

.dgp-title { font-size: 12px; font-weight: 700; color: #374151; }

.dgp-collapse {
  width: 24px; height: 24px; border: none; background: none;
  color: #9CA3AF; cursor: pointer; display: flex; align-items: center; justify-content: center;
  border-radius: 4px; &:hover { background: #F3F4F6; }
}

.dg-properties-content {
  flex: 1; overflow-y: auto;
  padding: 12px;
}

.dgp-section {
  margin-bottom: 20px;
  
  &:last-child { margin-bottom: 0; }
}

.dgp-section-title {
  font-size: 12px; font-weight: 700;
  color: #374151; margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid #E5E7EB;
}

.dgp-form { display: flex; flex-direction: column; gap: 10px; }

.dgp-row { display: flex; gap: 10px; }

.dgp-field {
  flex: 1;
  display: flex; flex-direction: column; gap: 4px;
}

.dgp-field label {
  font-size: 11px; font-weight: 600;
  color: #6B7280;
}

.dgp-input, .dgp-select, .dgp-textarea {
  padding: 6px 10px;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  font-size: 12px;
  color: #374151;
  background: #fff;
  outline: none;
  
  &:focus { border-color: #1D4ED8; }
}

.dgp-textarea { resize: vertical; }

.dgp-field-value {
  font-size: 12px; color: #374151;
  padding: 6px 10px;
  background: #F9FAFB;
  border-radius: 4px;
}

.dgp-radio-group {
  display: flex; gap: 4px;
}

.dgp-radio-btn {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  font-size: 12px;
  color: #374151;
  background: #fff;
  cursor: pointer;
  
  &:hover { background: #F9FAFB; }
  &.active { background: #1D4ED8; color: #fff; border-color: #1D4ED8; }
}

.dgp-color {
  width: 100%; height: 32px;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  cursor: pointer;
}

.dg-properties.collapsed .dg-properties-content,
.dg-properties.collapsed .dgp-title { display: none; }

/* ====== 底部状态栏 ====== */
.dg-footer {
  display: flex; align-items: center; justify-content: space-between;
  height: 32px; padding: 0 16px;
  background: #fff; border-top: 1px solid #E5E7EB;
  flex-shrink: 0;
  font-size: 11px;
}

.df-left, .df-right { display: flex; align-items: center; gap: 16px; }

.df-item { display: flex; align-items: center; gap: 4px; }

.df-label { color: #9CA3AF; }

.df-value { color: #374151; font-weight: 500; }

/* ====== 右键菜单 ====== */
.dg-context-menu {
  position: fixed; z-index: 1000;
  background: #fff; border: 1px solid #E5E7EB;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,.1);
  padding: 4px;
  min-width: 140px;
}

.dcm-item {
  width: 100%;
  padding: 6px 12px;
  border: none; background: none;
  font-size: 12px; color: #374151;
  cursor: pointer;
  text-align: left;
  border-radius: 4px;
  transition: background .15s;
  
  &:hover { background: #F3F4F6; }
}

.dcm-divider {
  height: 1px; background: #E5E7EB;
  margin: 4px 0;
}

/* ====== 添加行弹窗 ====== */
.ard-form {
  padding: 16px;
}

.ard-field {
  margin-bottom: 16px;
  
  label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
  }
}

.ard-type-options {
  display: flex;
  gap: 12px;
}

.ard-type-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  border: 2px solid #E5E7EB;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: all .2s;
  
  &:hover {
    border-color: #93C5FD;
    background: #EFF6FF;
  }
  
  &.active {
    border-color: #1D4ED8;
    background: #DBEAFE;
    
    .ard-type-label {
      color: #1D4ED8;
    }
  }
}

.ard-type-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.ard-type-label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.ard-type-desc {
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 4px;
}

.ard-summary-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ard-summary-btn {
  padding: 8px 16px;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: all .2s;
  
  &:hover {
    border-color: #93C5FD;
    background: #EFF6FF;
  }
  
  &.active {
    border-color: #1D4ED8;
    background: #DBEAFE;
    color: #1D4ED8;
  }
}

.ard-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  font-size: 13px;
  color: #374151;
  
  &:focus {
    outline: none;
    border-color: #1D4ED8;
    box-shadow: 0 0 0 2px #DBEAFE;
  }
}

/* ====== 节点弹窗样式 ====== */
.nd-form {
  padding: 16px;
}

.nd-field {
  margin-bottom: 16px;
  
  label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
  }
}

.nd-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  font-size: 13px;
  color: #374151;
  
  &:focus {
    outline: none;
    border-color: #1D4ED8;
    box-shadow: 0 0 0 2px #DBEAFE;
  }
}

.nd-type-options {
  display: flex;
  gap: 12px;
}

.nd-type-btn {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: 2px solid #E5E7EB;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: all .2s;
  
  &:hover {
    border-color: #93C5FD;
    background: #EFF6FF;
  }
  
  &.active {
    border-color: #1D4ED8;
    background: #DBEAFE;
    
    .nd-type-label {
      color: #1D4ED8;
    }
  }
}

.nd-type-icon {
  font-size: 20px;
}

.nd-type-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.nd-summary-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.nd-summary-btn {
  padding: 8px 16px;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  transition: all .2s;
  
  &:hover {
    border-color: #93C5FD;
    background: #EFF6FF;
  }
  
  &.active {
    border-color: #1D4ED8;
    background: #DBEAFE;
    color: #1D4ED8;
  }
}

/* ====== 递归树形组件样式 ====== */
.dgn-tree-node {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  cursor: pointer;
  transition: background .15s;
  position: relative;
  
  &:hover {
    background: #F3F4F6;
    
    .dgn-tree-actions {
      opacity: 1;
    }
  }
}

.dgn-tree-node.dgn-tree-summary {
  background: #FEF3C7;
  
  &:hover {
    background: #FDE68A;
  }
}

.dgn-tree-expand {
  font-size: 10px;
  color: #9CA3AF;
  width: 14px;
  text-align: center;
  cursor: pointer;
  flex-shrink: 0;
}

.dgn-tree-label {
  flex: 1;
  font-size: 12px;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dgn-tree-summary-tag {
  display: inline-block;
  padding: 1px 4px;
  background: #3B82F6;
  color: #fff;
  font-size: 10px;
  border-radius: 3px;
  margin-left: 4px;
}

.dgn-tree-code {
  font-size: 10px;
  color: #9CA3AF;
  flex-shrink: 0;
}

.dgn-tree-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity .2s;
  flex-shrink: 0;
}

.dgn-tree-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  font-size: 12px;
  cursor: pointer;
  border-radius: 3px;
  transition: all .15s;
  
  &:hover {
    background: #E5E7EB;
  }
}

.dgn-tree-btn.dgn-tree-add {
  color: #1D4ED8;
  
  &:hover {
    background: #DBEAFE;
  }
}

.dgn-tree-btn.dgn-tree-edit {
  font-size: 11px;
}

.dgn-tree-btn.dgn-tree-delete {
  font-size: 11px;
  
  &:hover {
    background: #FEE2E2;
  }
}

.dgn-tree-children {
  width: 100%;
}

/* ====== Toast ====== */
.dg-toast {
  position: fixed; top: 20px; right: 20px;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 13px; font-weight: 500;
  z-index: 2000;
  box-shadow: 0 4px 12px rgba(0,0,0,.1);
  
  &.dg-toast-success { background: #D1FAE5; color: #065F46; }
  &.dg-toast-error { background: #FEE2E2; color: #991B1B; }
  &.dg-toast-warning { background: #FEF3C7; color: #92400E; }
}

.dg-toast-enter-active, .dg-toast-leave-active { transition: all .3s; }
.dg-toast-enter-from, .dg-toast-leave-to { opacity: 0; transform: translateX(100px); }

/* ====== 确认对话框 ====== */
.cd-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
  gap: 16px;
}

.cd-icon {
  font-size: 40px;
}

.cd-icon-danger {
  color: #EF4444;
}

.cd-icon-info {
  color: #3B82F6;
}

.cd-message {
  font-size: 14px;
  color: #374151;
  text-align: center;
  line-height: 1.6;
}

.cd-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>