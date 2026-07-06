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

    <!-- 菜单栏 -->
    <nav class="dg-menubar">
      <div v-for="menu in menuItems" :key="menu.label"
           class="dg-menu-item" :class="{ active: activeMenu === menu.label }"
           @click="toggleMenu(menu.label)">
        {{ menu.label }}
        <div v-if="activeMenu === menu.label" class="dg-menu-dropdown">
          <div v-for="item in menu.items" :key="item.label"
               class="dg-menu-dropdown-item" @click.stop="handleMenuAction(item.action); activeMenu = null">
            {{ item.label }}
            <span v-if="item.shortcut" style="float:right; color: $dg-text-placeholder; margin-left: 24px;">{{ item.shortcut }}</span>
          </div>
        </div>
      </div>
    </nav>

    <!-- 工具栏 -->
    <div class="dg-toolbar">
      <div class="dg-tool-group">
        <button class="dg-tool-btn" @click="handleUndo" :disabled="!canUndo" title="撤销">
          <img src="@/assets/images/designer/undo2.svg" width="14" height="14" />
        </button>
        <button class="dg-tool-btn" @click="handleRedo" :disabled="!canRedo" title="重做">
          <img src="@/assets/images/designer/redo2.svg" width="14" height="14" />
        </button>
      </div>
      <div class="dg-tool-sep"></div>
      <div class="dg-tool-group">
        <button class="dg-tool-btn" @click="handleCut" title="剪切">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
        </button>
        <button class="dg-tool-btn" @click="handleCopy" title="复制">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
        <button class="dg-tool-btn" @click="handlePaste" title="粘贴">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
        </button>
        <button class="dg-tool-btn" @click="handleFormatBrush" title="格式刷">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        </button>
      </div>
      <div class="dg-tool-sep"></div>
      <div class="dg-tool-group">
        <select class="dg-tool-select" style="width:70px" title="字体" v-model="cellFontFamily">
          <option value="Noto Sans SC">Noto Sans SC</option>
          <option value="Microsoft YaHei">微软雅黑</option>
          <option value="SimSun">宋体</option>
          <option value="monospace">等宽</option>
        </select>
        <select class="dg-tool-select" style="width:50px" title="字号" v-model="cellFontSize">
          <option v-for="s in [10,11,12,13,14,16,18,20,22,24,28,32]" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>
      <div class="dg-tool-sep"></div>
      <div class="dg-tool-group">
        <button class="dg-tool-btn" :class="{ active: isCellBold }" @click="handleBold" title="加粗" style="font-weight:700">B</button>
        <button class="dg-tool-btn" :class="{ active: isCellItalic }" @click="handleItalic" title="斜体" style="font-style:italic">I</button>
        <button class="dg-tool-btn" :class="{ active: isCellUnderline }" @click="handleUnderline" title="下划线" style="text-decoration:underline">U</button>
      </div>
      <div class="dg-tool-sep"></div>
      <div class="dg-tool-group">
        <button class="dg-tool-btn" :class="{ active: isCellAlignLeft }" @click="handleAlignLeft" title="左对齐">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
        </button>
        <button class="dg-tool-btn" :class="{ active: isCellAlignCenter }" @click="handleAlignCenter" title="居中">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
        </button>
        <button class="dg-tool-btn" :class="{ active: isCellAlignRight }" @click="handleAlignRight" title="右对齐">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>
      <div class="dg-tool-sep"></div>
      <div class="dg-tool-group">
        <button class="dg-tool-text-btn" @click="handleAutoRank" title="自动排行">排行</button>
        <button class="dg-tool-text-btn" @click="handleConditionalFormat" title="条件格式">条件</button>
      </div>
      <div class="dg-tool-sep"></div>
      <div class="dg-tool-group">
        <button class="dg-tool-text-btn" @click="handleSort" title="排序">排序</button>
        <button class="dg-tool-text-btn" @click="handleFilter" title="筛选">筛选</button>
        <button class="dg-tool-text-btn" @click="handleFind" title="查找">查找</button>
        <button class="dg-tool-text-btn" @click="handleReplace" title="替换">替换</button>
      </div>
    </div>

    <!-- 公式栏 -->
    <div class="dg-formula-bar">
      <span class="dg-fb-cell-ref">
        {{ selectedCell.row !== null ? getCellLabel(selectedCell.row, selectedCell.col) : '' }}
      </span>
      <button class="dg-fb-btn" @click="handleCancelEdit" title="取消">✕</button>
      <button class="dg-fb-btn" @click="handleConfirmEdit" title="确认">✓</button>
      <button class="dg-fb-btn" @click="addFormula" title="函数" style="font-style:italic;font-weight:600">fx</button>
      <input class="dg-fb-input" :value="formulaBarDisplay"
             @input="onFormulaBarInput($event)"
             @keydown.enter="commitEditFromBar"
             placeholder="输入值或公式" />
    </div>

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
                  <div v-for="(formula, index) in formulaList" :key="'formula-'+index" class="dgn-list-item">
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
                  <div v-if="formulaList.length === 0" class="dgn-empty">暂无公式，请选中单元格后点击"+ 添加"</div>
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
                    @dblclick="startRowLabelEdit(ri)"
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
                      <input 
                        v-if="editingRowLabel.rowIndex === ri" 
                        v-model="editingRowLabel.value" 
                        class="dg-row-label-input"
                        @blur="commitRowLabelEdit"
                        @keydown.enter="commitRowLabelEdit"
                        @keydown.escape="cancelRowLabelEdit"
                        autofocus
                      />
                      <template v-else>
                        <span class="dg-tree-label">{{ row.label }}</span>
                        <span v-if="row.isSummary" class="dg-summary-tag">{{ row.summaryType }}</span>
                      </template>
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
          <!-- 工作表标签 -->
          <div class="dg-sheet-tabs">
            <div v-for="(sheet, idx) in sheets" :key="idx"
                 class="dg-sheet-tab" :class="{ active: activeSheet === idx }"
                 @click="activeSheet = idx">
              {{ sheet.name }}
            </div>
            <button class="dg-sheet-add" @click="addSheet" title="新增工作表">+</button>
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
          <!-- 右侧面板 Tab 切换 -->
          <div class="dgp-tabs">
            <button class="dgp-tab" :class="{ active: rightPanelTab === 'props' }" @click="rightPanelTab = 'props'">属性</button>
            <button class="dgp-tab" :class="{ active: rightPanelTab === 'formula' }" @click="rightPanelTab = 'formula'">公式</button>
          </div>

          <!-- 公式工作台 -->
          <template v-if="rightPanelTab === 'formula'">
            <div class="dgp-formula-workbench">
              <div class="dgp-fw-tabs">
                <button class="dgp-fw-tab" :class="{ active: formulaWorkbenchTab === 'edit' }" @click="formulaWorkbenchTab = 'edit'">公式编辑</button>
                <button class="dgp-fw-tab" :class="{ active: formulaWorkbenchTab === 'list' }" @click="formulaWorkbenchTab = 'list'">公式列表</button>
                <button class="dgp-fw-tab" :class="{ active: formulaWorkbenchTab === 'validate' }" @click="formulaWorkbenchTab = 'validate'">校验结果</button>
                <button class="dgp-fw-tab" :class="{ active: formulaWorkbenchTab === 'refs' }" @click="formulaWorkbenchTab = 'refs'">引用搜索</button>
              </div>

              <!-- 公式编辑 -->
              <div v-if="formulaWorkbenchTab === 'edit'" class="dgp-fw-content">
                <div class="dgp-field">
                  <label>公式</label>
                  <textarea v-model="formulaWorkbenchExpr" class="dgp-textarea" rows="3" placeholder="输入公式表达式"></textarea>
                </div>
                <div class="dgp-field">
                  <label>语法验证</label>
                  <span class="dgp-validate-status" :class="formulaValidateStatus">{{ formulaValidateMessage }}</span>
                </div>
                <div class="dgp-field">
                  <label>计算结果预览</label>
                  <span class="dgp-field-value">{{ formulaPreviewResult || '-' }}</span>
                </div>
                <button class="dgp-action-btn" @click="addFormula">打开公式编辑器</button>
              </div>

              <!-- 公式列表 -->
              <div v-if="formulaWorkbenchTab === 'list'" class="dgp-fw-content">
                <div v-for="(agg, idx) in formulaList" :key="idx" class="dgp-formula-item" @click="editFormula(idx)">
                  <span class="dgp-formula-name">{{ agg.label || agg.formulaId }}</span>
                  <span class="dgp-formula-expr">{{ agg.expression }}</span>
                  <span class="dgp-formula-target">{{ getCellLabelByTarget(agg.targetCell) }}</span>
                </div>
                <div v-if="!formulaList?.length" class="dgn-empty">暂无公式</div>
              </div>

              <!-- 校验结果 -->
              <div v-if="formulaWorkbenchTab === 'validate'" class="dgp-fw-content">
                <div class="dgn-empty">暂无校验结果</div>
              </div>

              <!-- 引用搜索 -->
              <div v-if="formulaWorkbenchTab === 'refs'" class="dgp-fw-content">
                <div class="dgn-empty">选中公式单元格查看引用</div>
              </div>
            </div>
          </template>

          <!-- 属性面板 -->
          <template v-else>
            <!-- 单元格属性 Tab -->
            <div v-if="selectedCell.row !== null && selectedCellType === 'cell'" class="dgp-cell-tabs">
              <button class="dgp-cell-tab" :class="{ active: cellPropsTab === 'basic' }" @click="cellPropsTab = 'basic'">基础</button>
              <button class="dgp-cell-tab" :class="{ active: cellPropsTab === 'style' }" @click="cellPropsTab = 'style'">样式</button>
              <button class="dgp-cell-tab" :class="{ active: cellPropsTab === 'advanced' }" @click="cellPropsTab = 'advanced'">高级</button>
            </div>

            <!-- 单元格属性 - 基础 -->
            <template v-if="selectedCellType === 'cell' && selectedCell.row !== null && cellPropsTab === 'basic'">
              <section class="dgp-section">
                <div class="dgp-form">
                  <div class="dgp-field">
                    <label>单元格地址</label>
                    <span class="dgp-field-value">{{ getCellLabel(selectedCell.row, selectedCell.col) }}</span>
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
                    <label>显示格式</label>
                    <select v-model="selectedCellFormat" class="dgp-select">
                      <option value="auto">自动</option>
                      <option value="number">数值</option>
                      <option value="percent">百分比</option>
                      <option value="thousands">千分位</option>
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
                </div>
              </section>
            </template>

            <!-- 单元格属性 - 样式 -->
            <template v-if="selectedCellType === 'cell' && selectedCell.row !== null && cellPropsTab === 'style'">
              <section class="dgp-section">
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

            <!-- 单元格属性 - 高级 -->
            <template v-if="selectedCellType === 'cell' && selectedCell.row !== null && cellPropsTab === 'advanced'">
              <section class="dgp-section">
                <div class="dgp-form">
                  <div class="dgp-field">
                    <label>条件格式</label>
                    <span class="dgp-field-value">未设置</span>
                  </div>
                  <div class="dgp-field">
                    <label>数据验证</label>
                    <span class="dgp-field-value">未设置</span>
                  </div>
                  <div class="dgp-field">
                    <label>锁定</label>
                    <input type="checkbox" :checked="selectedCellReadOnly" @change="selectedCellReadOnly = $event.target.checked" />
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
                </div>
              </section>
            </template>
          </template>
        </div>
      </aside>
    </div>

    <!-- 底部状态栏 -->
    <footer class="dg-footer">
      <div class="df-left">
        <span class="df-status-indicator">{{ statusText }}</span>
        <span class="df-item">
          <span class="df-label">单元格:</span>
          <span class="df-value">{{ totalCellCount }}</span>
        </span>
        <span class="df-item">
          <span class="df-label">数据行:</span>
          <span class="df-value">{{ rows.length }}</span>
        </span>
      </div>
      <div class="df-right">
        <span class="df-item">
          <span class="df-label">最后保存:</span>
          <span class="df-value">{{ lastSavedTime || '-' }}</span>
        </span>
        <span class="df-item">
          <span class="df-value">{{ zoomPercent }}%</span>
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

    <!-- 公式设计器弹窗 -->
    <el-dialog
      v-model="formulaEditorDialog.visible"
      title="公式设计器"
      width="90%"
      top="5vh"
      :show-close="true"
      :close-on-click-modal="false"
      :close-on-press-escape="true"
      destroy-on-close
      append-to-body
      class="formula-designer-dialog"
    >
      <FormulaDesigner
        ref="formulaDesignerRef"
        :indicators="formulaIndicators"
        :template="formulaTemplateData"
        :cells="formulaCells"
        :initial-formula="formulaInitialData"
        @save="onFormulaDesignerSave"
        @close="formulaEditorDialog.visible = false"
      />
      <template #footer>
        <el-button @click="formulaEditorDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="onFormulaDesignerConfirm">确认并应用</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, defineComponent, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { loadTemplate, saveTemplate, updateTemplate, publishTemplate } from '@/api/reportDesigner.js'
import FormulaDesigner from './FormulaDesigner.vue'

const router = useRouter()
const route = useRoute()

// 公式设计器组件引用（用于调用 el-dialog footer 上的"确认并应用"）
const formulaDesignerRef = ref(null)

function onFormulaDesignerConfirm() {
  // 调用 FormulaDesigner 内部暴露的方法：先验证，通过后保存 + 关闭
  if (formulaDesignerRef.value && typeof formulaDesignerRef.value.confirmAndApply === 'function') {
    formulaDesignerRef.value.confirmAndApply()
  }
}

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
        h('span', {
          class: 'dgn-tree-expand',
          onClick: (e) => {
            e.stopPropagation()
            emit('toggle', props.path)
          }
        }, hasChildren ? (props.node.expanded ? '▼' : '▶') : ''),
        
        h('span', { class: 'dgn-tree-dim-icon' }, '☰'),
        
        h('span', { class: 'dgn-tree-label' }, props.node.label),
        
        props.node.isSummary ? h('span', { class: 'dgn-tree-summary-tag' }, props.node.summaryType) : null,
        
        h('span', { class: 'dgn-tree-code' }, props.node.code),
        
        h('div', { class: 'dgn-tree-actions' }, [
          h('button', {
            class: 'dgn-tree-btn dgn-tree-add',
            title: '添加子节点',
            onClick: (e) => {
              e.stopPropagation()
              emit('add-child', props.path)
            }
          }, '+'),
          h('button', {
            class: 'dgn-tree-btn dgn-tree-edit',
            title: '编辑',
            onClick: (e) => {
              e.stopPropagation()
              emit('edit', props.path)
            }
          }, '✏'),
          h('button', {
            class: 'dgn-tree-btn dgn-tree-delete',
            title: '删除',
            onClick: (e) => {
              e.stopPropagation()
              emit('delete', props.path)
            }
          }, '✕')
        ]),
        
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
        class: ['dgn-tree-node', { 'dgn-tree-summary': props.node.isSummary }],
        style: { paddingLeft: `${paddingLeft}px` }
      }, [
        h('span', {
          class: 'dgn-tree-expand',
          onClick: (e) => {
            e.stopPropagation()
            emit('toggle', props.path)
          }
        }, hasChildren ? (props.node.expanded ? '▼' : '▶') : ''),
        
        h('span', { class: 'dgn-tree-dim-icon' }, '☷'),
        
        h('span', { class: 'dgn-tree-label' }, props.node.label),
        
        props.node.isSummary ? h('span', { class: 'dgn-tree-summary-tag' }, props.node.summaryType) : null,
        
        h('span', { class: 'dgn-tree-code' }, props.node.code),
        
        h('div', { class: 'dgn-tree-actions' }, [
          h('button', {
            class: 'dgn-tree-btn dgn-tree-add',
            title: '添加子节点',
            onClick: (e) => {
              e.stopPropagation()
              emit('add-child', props.path)
            }
          }, '+'),
          h('button', {
            class: 'dgn-tree-btn dgn-tree-edit',
            title: '编辑',
            onClick: (e) => {
              e.stopPropagation()
              emit('edit', props.path)
            }
          }, '✏'),
          h('button', {
            class: 'dgn-tree-btn dgn-tree-delete',
            title: '删除',
            onClick: (e) => {
              e.stopPropagation()
              emit('delete', props.path)
            }
          }, '✕')
        ]),
        
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

// ==================== 菜单栏 ====================
const activeMenu = ref(null)
const menuItems = [
  { label: '文件', items: [
    { label: '保存', action: 'save', shortcut: 'Ctrl+S' },
    { label: '另存为', action: 'saveAs' },
    { label: '导出模板', action: 'export' },
    { label: '导入Excel', action: 'importExcel' },
  ]},
  { label: '编辑', items: [
    { label: '撤销', action: 'undo', shortcut: 'Ctrl+Z' },
    { label: '重做', action: 'redo', shortcut: 'Ctrl+Y' },
    { label: '剪切', action: 'cut', shortcut: 'Ctrl+X' },
    { label: '复制', action: 'copy', shortcut: 'Ctrl+C' },
    { label: '粘贴', action: 'paste', shortcut: 'Ctrl+V' },
    { label: '查找', action: 'find', shortcut: 'Ctrl+F' },
    { label: '替换', action: 'replace', shortcut: 'Ctrl+H' },
  ]},
  { label: '视图', items: [
    { label: '编辑模式', action: 'editMode' },
    { label: '预览模式', action: 'previewMode' },
    { label: '全屏', action: 'fullscreen' },
    { label: '暗黑模式', action: 'darkMode' },
  ]},
  { label: '插入', items: [
    { label: '添加行', action: 'addRow' },
    { label: '添加列', action: 'addCol' },
    { label: '插入汇总行', action: 'insertSummary' },
  ]},
  { label: '格式', items: [
    { label: '合并单元格', action: 'merge' },
    { label: '拆分单元格', action: 'split' },
    { label: '条件格式', action: 'conditionalFormat' },
  ]},
  { label: '公式', items: [
    { label: '公式编辑器', action: 'formulaEditor' },
    { label: '重新计算 (F9)', action: 'recalc' },
  ]},
  { label: '数据', items: [
    { label: '排序', action: 'sort' },
    { label: '筛选', action: 'filter' },
    { label: '自动排行', action: 'autoRank' },
  ]},
  { label: '帮助', items: [
    { label: '快捷键', action: 'shortcuts' },
    { label: '关于', action: 'about' },
  ]},
]

function toggleMenu(label) {
  activeMenu.value = activeMenu.value === label ? null : label
}

function handleMenuAction(action) {
  const actions = {
    save: () => handleSaveTemplate(),
    saveAs: () => handleSaveAs?.(),
    export: () => exportTemplate(),
    importExcel: () => handleImportExcel?.(),
    undo: () => handleUndo(),
    redo: () => handleRedo(),
    cut: () => handleCut(),
    copy: () => handleCopy(),
    paste: () => handlePaste(),
    find: () => handleFind(),
    replace: () => handleReplace(),
    editMode: () => { designMode.value = 'edit' },
    previewMode: () => { designMode.value = 'preview' },
    fullscreen: () => toggleFullscreen(),
    darkMode: () => toggleDark(),
    addRow: () => showAddRowDialog(),
    addCol: () => addCol(),
    insertSummary: () => insertSummaryRow(),
    merge: () => mergeCells(),
    split: () => splitCells(),
    conditionalFormat: () => handleConditionalFormat(),
    formulaEditor: () => addFormula(),
    recalc: () => handleF9(),
    sort: () => handleSort(),
    filter: () => handleFilter(),
    autoRank: () => handleAutoRank(),
    shortcuts: () => showToast('Ctrl+S保存 / Ctrl+Z撤销 / Ctrl+Y重做 / F9重新计算', 'info'),
    about: () => showToast('报表设计器 v1.0', 'info'),
  }
  actions[action]?.()
}

// ==================== 工作表 ====================
const sheets = ref([{ name: '销售汇总' }, { name: '产品分析' }, { name: '区域分析' }])
const activeSheet = ref(0)

function addSheet() {
  sheets.value.push({ name: `工作表${sheets.value.length + 1}` })
  activeSheet.value = sheets.value.length - 1
}

// ==================== 右侧面板 ====================
const rightPanelTab = ref('props')
const cellPropsTab = ref('basic')
const formulaWorkbenchTab = ref('edit')
const formulaWorkbenchExpr = ref('')
const formulaValidateStatus = ref('valid')
const formulaValidateMessage = ref('语法正确')
const formulaPreviewResult = ref('')

// 公式验证
watch(formulaWorkbenchExpr, (expr) => {
  if (!expr || expr.trim() === '') {
    formulaValidateStatus.value = 'valid'
    formulaValidateMessage.value = '请输入公式'
    formulaPreviewResult.value = ''
    return
  }
  const trimmed = expr.trim()
  if (trimmed.startsWith('=')) {
    formulaValidateStatus.value = 'valid'
    formulaValidateMessage.value = '语法正确'
    try {
      formulaPreviewResult.value = String(eval(trimmed.slice(1)) || '')
    } catch {
      formulaPreviewResult.value = '计算错误'
    }
  } else {
    formulaValidateStatus.value = 'warning'
    formulaValidateMessage.value = '公式应以 = 开头'
    formulaPreviewResult.value = ''
  }
})

const selectedCell = reactive({ row: null, col: null })
// 选中单元格变化时更新公式工作台
watch(() => [selectedCell.row, selectedCell.col], () => {
  if (selectedCell.row === null || selectedCell.col === null) return
  const cell = rows.value[selectedCell.row]?.cells[selectedCell.col]
  if (cell?.isFormula && cell.formula) {
    formulaWorkbenchExpr.value = '=' + cell.formula
  } else {
    formulaWorkbenchExpr.value = ''
  }
})

// ==================== 公式栏 ====================
const formulaBarDisplay = computed(() => {
  if (selectedCell.row === null || selectedCell.col === null) return ''
  const cell = rows.value[selectedCell.row]?.cells[selectedCell.col]
  if (!cell) return ''
  if (editingCell.row !== null && editingCell.row === selectedCell.row && editingCell.col === selectedCell.col) return cell.value || ''
  if (cell.isFormula && cell.formula) return '=' + cell.formula
  return cell.value || ''
})

function onFormulaBarInput(event) {
  if (selectedCell.row === null || selectedCell.col === null) return
  const cell = rows.value[selectedCell.row]?.cells[selectedCell.col]
  if (!cell || cell.readOnly) return
  saveToUndoStack()
  cell.value = event.target.value
  if (event.target.value.startsWith('=')) {
    cell.isFormula = true
    cell.formula = event.target.value.substring(1)
  }
}

function commitEditFromBar() {
  if (selectedCell.row !== null) {
    const cell = rows.value[selectedCell.row]?.cells[selectedCell.col]
    if (cell?.isFormula) calculateFormula(selectedCell.row, selectedCell.col)
  }
}

// ==================== 单元格格式状态 ====================
const cellFontFamily = ref('Noto Sans SC')
const cellFontSize = ref(12)

const isCellBold = computed(() => {
  if (selectedCell.row === null) return false
  const cell = rows.value[selectedCell.row]?.cells[selectedCell.col]
  return cell?.style?.fontWeight === 'bold'
})

const isCellItalic = computed(() => {
  if (selectedCell.row === null) return false
  const cell = rows.value[selectedCell.row]?.cells[selectedCell.col]
  return cell?.style?.fontStyle === 'italic'
})

const isCellUnderline = computed(() => {
  if (selectedCell.row === null) return false
  const cell = rows.value[selectedCell.row]?.cells[selectedCell.col]
  return cell?.style?.textDecoration === 'underline'
})

const isCellAlignLeft = computed(() => {
  if (selectedCell.row === null) return false
  const cell = rows.value[selectedCell.row]?.cells[selectedCell.col]
  return cell?.style?.textAlign === 'left'
})

const isCellAlignCenter = computed(() => {
  if (selectedCell.row === null) return false
  const cell = rows.value[selectedCell.row]?.cells[selectedCell.col]
  return cell?.style?.textAlign === 'center'
})

const isCellAlignRight = computed(() => {
  if (selectedCell.row === null) return false
  const cell = rows.value[selectedCell.row]?.cells[selectedCell.col]
  return cell?.style?.textAlign === 'right'
})

// ==================== 导航菜单 ====================
const navItems = computed(() => [
  { key: 'basic', label: '基本信息', icon: '📋', badge: '' },
  { key: 'datasource', label: '数据源', icon: '🔌', badge: '' },
  { key: 'rows', label: '行维度', icon: '📊', badge: rowCount },
  { key: 'cols', label: '列维度', icon: '📈', badge: colCount },
  { key: 'metrics', label: '指标', icon: '📉', badge: tpl.metrics?.filter(m => !m.expression).length || 0 },
  { key: 'formulas', label: '公式', icon: 'fx', badge: formulaList?.length || 0 },
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

// 公式列表（从 metrics 中筛选出有 expression 的公式）
const formulaList = computed(() => {
  return tpl.metrics.filter(m => m.expression)
})

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

// ==================== 公式设计器数据映射 ====================
function flattenTreeNodes(nodes, type) {
  const result = []
  const walk = (list) => {
    for (const n of list) {
      result.push({
        id: n.id || n.code,
        name: n.label || n.name,
        code: n.code || n.id,
        type: type,
        category: 'dimension',
        isSummary: n.isSummary || false
      })
      if (n.children?.length) walk(n.children)
    }
  }
  walk(nodes || [])
  return result
}

const formulaIndicators = computed(() => {
  const metrics = tpl.metrics.map(m => ({
    id: m.id || m.code,
    name: m.label || m.name,
    code: m.code || m.id,
    type: m.type || 'metric',
    category: 'basic'
  }))
  const rowDims = flattenTreeNodes(tpl.rowTree, 'row')
  const colDims = flattenTreeNodes(tpl.columnTree, 'col')
  return [...rowDims, ...colDims, ...metrics]
})

const formulaTemplateData = computed(() => {
  const result = {
    id: tpl.id,
    name: tpl.name,
    rowTree: tpl.rowTree,
    columnTree: tpl.columnTree,
    columnHeaders: columnHeaders.value,
    metrics: tpl.metrics
  }
  return result
})

const formulaCells = computed(() => {
  const cells = []
  const cols = columnHeaders.value || []
  for (let r = 0; r < rows.value.length; r++) {
    const rowData = rows.value[r]
    for (let c = 0; c < (rowData?.cells?.length || 0); c++) {
      const cell = rowData.cells[c]
      if (cell) {
        const colHeader = cols[c] || {}
        cells.push({
          row: r + 1,
          col: c + 1,
          rowLabel: rowData.label || `行${r + 1}`,
          colLabel: colHeader.label || `列${c + 1}`,
          excelRef: convertToExcelRef(r + 1, c + 1),
          label: getCellLabel(r, c),
          value: cell.value || '',
          isFormula: cell.isFormula || false,
          formula: cell.formula || '',
          readOnly: cell.readOnly || false
        })
      }
    }
  }
  return cells
})

const formulaInitialData = computed(() => ({
  id: formulaEditorDialog.formulaId || '',
  label: formulaEditorDialog.formulaLabel || formulaEditorDialog.formulaName || '新公式',
  expression: formulaEditorDialog.expression || '',
  fieldName: formulaEditorDialog.formulaName || '',
  resultType: formulaEditorDialog.resultType || 'number',
  targetCell: formulaEditorDialog.targetCell
    ? `${formulaEditorDialog.targetCell.row}-${formulaEditorDialog.targetCell.col}`
    : null
}))

function onFormulaDesignerSave(data) {
  const expr = data.expression || ''
  const targetCell = formulaEditorDialog.targetCell
  const applyToRow = formulaDesignerRef.value?.applyToRow || false

  if (formulaEditorDialog.mode === 'add') {
    if (applyToRow && targetCell) {
      const colCount = rows.value[targetCell.row]?.cells?.length || 0
      const targetRow = targetCell.row
      let addedCount = 0
      for (let c = 0; c < colCount; c++) {
        const newFormula = {
          id: generateId('formula'),
          label: `${data.label || '新公式'}_${c + 1}`,
          fieldName: `${data.fieldName || 'formula'}_${c + 1}`,
          expression: expr.replace(/^=/, ''),
          resultType: data.resultType || data.dataType || 'number',
          type: 'custom',
          order: formulaList.value.length + addedCount + 1,
          dependencies: data.dependencies || [],
          targetCell: `${targetRow}-${c}`,
          targetRow: getRowCode(targetRow),
          targetCol: getColCode(c)
        }
        tpl.metrics.push(newFormula)
        addedCount++
      }
      showToast(`已为整行 ${colCount} 列添加公式`, 'success')
    } else {
      const newFormula = {
        id: data.fieldName || generateId('formula'),
        label: data.label || '新公式',
        fieldName: data.fieldName || '',
        expression: expr.replace(/^=/, ''),
        resultType: data.resultType || data.dataType || 'number',
        type: 'custom',
        order: formulaList.value.length + 1,
        dependencies: data.dependencies || [],
        targetCell: targetCell ? `${targetCell.row}-${targetCell.col}` : null,
        targetRow: targetCell ? getRowCode(targetCell.row) : null,
        targetCol: targetCell ? getColCode(targetCell.col) : null
      }
      tpl.metrics.push(newFormula)
      showToast('公式添加成功', 'success')
    }
  } else {
    const formulaId = formulaEditorDialog.formulaId
    const formula = tpl.metrics.find(m => m.id === formulaId)
    if (formula) {
      formula.id = data.fieldName || formula.id
      formula.label = data.label || formula.label
      formula.fieldName = data.fieldName || ''
      formula.expression = expr.replace(/^=/, '')
      formula.resultType = data.resultType || data.dataType || 'number'
      formula.dependencies = data.dependencies || []
      formula.targetCell = targetCell ? `${targetCell.row}-${targetCell.col}` : formula.targetCell
      formula.targetRow = targetCell ? getRowCode(targetCell.row) : formula.targetRow
      formula.targetCol = targetCell ? getColCode(targetCell.col) : formula.targetCol
      showToast('公式修改成功', 'success')
    }
  }

  applyFormulasToCells()
  formulaEditorDialog.visible = false
}

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
  applyFormulasToCells()
}

function applyFormulasToCells() {
  const formulas = tpl.metrics?.filter(m => m.expression && m.targetCell) || []
  for (const f of formulas) {
    const parts = f.targetCell.split('-').map(Number)
    if (parts.length !== 2 || isNaN(parts[0]) || isNaN(parts[1])) continue
    const [rowIdx, colIdx] = parts
    const row = rows.value[rowIdx]
    const cell = row?.cells?.[colIdx]
    if (cell) {
      cell.isFormula = true
      cell.formula = f.expression?.startsWith('=') ? f.expression : '=' + f.expression
      cell.readOnly = true
    }
  }
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

const selectedCellType = ref('cell')
const editingCell = reactive({ row: null, col: null })
const editingRowLabel = reactive({ rowIndex: null, value: '', originalValue: '' })

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
const statusText = ref('就绪')
const zoomPercent = ref(100)
const totalCellCount = computed(() => rows.value.length * columnHeaders.value.length)

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
      rebuildTable()
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
      rebuildTable()
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
      rebuildTable()
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
  ElMessageBox.prompt('请输入字段名:', '添加指标', {
    inputValue: 'new_field',
    confirmButtonText: '下一步',
    cancelButtonText: '取消'
  }).then(async ({ value: field }) => {
    if (!field) return
    const { value: label } = await ElMessageBox.prompt('请输入指标名称:', '添加指标', {
      inputValue: '新指标',
      confirmButtonText: '下一步',
      cancelButtonText: '取消'
    })
    if (!label) return
    const { value: unit } = await ElMessageBox.prompt('请输入单位:', '添加指标', {
      inputValue: '',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    const newMetric = {
      id: generateId('metric'),
      field,
      label,
      unit: unit || '',
      type: 'number',
      decimals: 0,
      format: 'number'
    }
    tpl.metrics.push(newMetric)
    showToast('指标添加成功', 'success')
  }).catch(() => {})
}

function editMetric(index) {
  const metric = tpl.metrics[index]
  ElMessageBox.prompt('修改字段名:', '编辑指标', {
    inputValue: metric.field,
    confirmButtonText: '下一步',
    cancelButtonText: '取消'
  }).then(async ({ value: field }) => {
    if (!field) return
    const { value: label } = await ElMessageBox.prompt('修改指标名称:', '编辑指标', {
      inputValue: metric.label,
      confirmButtonText: '下一步',
      cancelButtonText: '取消'
    })
    if (!label) return
    const { value: unit } = await ElMessageBox.prompt('修改单位:', '编辑指标', {
      inputValue: metric.unit || '',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    metric.field = field
    metric.label = label
    metric.unit = unit || ''
    showToast('指标修改成功', 'success')
  }).catch(() => {})
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
  const formula = formulaList.value[index]
  if (!formula) return
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
      order: formulaList.value.length + 1,
      dependencies: formulaData.dependencies || [],
      targetCell: targetCell ? `${targetCell.row}-${targetCell.col}` : null,
      targetRow: targetCell ? getRowCode(targetCell.row) : null,
      targetCol: targetCell ? getColCode(targetCell.col) : null
    }
    tpl.metrics.push(newFormula)
    showToast('公式添加成功', 'success')
  } else {
    const formulaId = formulaEditorDialog.formulaId
    const formula = tpl.metrics.find(m => m.id === formulaId)
    if (formula) {
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
  }
  
  formulaEditorDialog.visible = false
}

function deleteFormula(index) {
  const formula = formulaList.value[index]
  if (!formula) return
  showConfirmDialog(`确定删除公式 "${formula.label}"?`, {
    type: 'danger',
    okText: '删除',
    onOk: () => {
      const idx = tpl.metrics.findIndex(m => m.id === formula.id)
      if (idx > -1) {
        tpl.metrics.splice(idx, 1)
        applyFormulasToCells()
        showToast('公式删除成功', 'success')
      }
    }
  })
}

// 校验规则操作
function addValidator() {
  ElMessageBox.prompt('请输入规则名称:', '添加校验规则', {
    inputValue: '新规则',
    confirmButtonText: '下一步',
    cancelButtonText: '取消'
  }).then(async ({ value: label }) => {
    if (!label) return
    const { value: expression } = await ElMessageBox.prompt('请输入校验表达式:', '添加校验规则', {
      inputValue: '',
      confirmButtonText: '下一步',
      cancelButtonText: '取消'
    })
    if (!expression) return
    const { value: message } = await ElMessageBox.prompt('请输入错误提示:', '添加校验规则', {
      inputValue: '校验失败',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    const newValidator = {
      id: generateId('validator'),
      label,
      type: 'custom',
      expression,
      message: message || '校验失败'
    }
    tpl.validators.push(newValidator)
    showToast('校验规则添加成功', 'success')
  }).catch(() => {})
}

function editValidator(index) {
  const validator = tpl.validators[index]
  ElMessageBox.prompt('修改规则名称:', '编辑校验规则', {
    inputValue: validator.label,
    confirmButtonText: '下一步',
    cancelButtonText: '取消'
  }).then(async ({ value: label }) => {
    if (!label) return
    const { value: expression } = await ElMessageBox.prompt('修改校验表达式:', '编辑校验规则', {
      inputValue: validator.expression,
      confirmButtonText: '下一步',
      cancelButtonText: '取消'
    })
    if (!expression) return
    const { value: message } = await ElMessageBox.prompt('修改错误提示:', '编辑校验规则', {
      inputValue: validator.message || '校验失败',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    validator.label = label
    validator.expression = expression
    validator.message = message || '校验失败'
    showToast('校验规则修改成功', 'success')
  }).catch(() => {})
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

function startRowLabelEdit(rowIndex) {
  const row = rows.value[rowIndex]
  if (!row) return
  
  editingRowLabel.rowIndex = rowIndex
  editingRowLabel.value = row.label
  editingRowLabel.originalValue = row.label
}

function commitRowLabelEdit() {
  if (editingRowLabel.rowIndex === null) return
  
  const row = rows.value[editingRowLabel.rowIndex]
  if (!row) {
    cancelRowLabelEdit()
    return
  }
  
  const newValue = editingRowLabel.value.trim()
  if (!newValue) {
    showToast('行标签不能为空', 'warning')
    return
  }
  
  saveToUndoStack()
  
  row.label = newValue
  
  const node = getNodeByPath(tpl.rowTree, row.treePath)
  if (node) {
    node.label = newValue
  }
  
  editingRowLabel.rowIndex = null
  editingRowLabel.value = ''
  editingRowLabel.originalValue = ''
  
  showToast('行维度标签修改成功', 'success')
}

function cancelRowLabelEdit() {
  editingRowLabel.rowIndex = null
  editingRowLabel.value = ''
  editingRowLabel.originalValue = ''
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

function convertToExcelRef(row, col) {
  let colLetter = ''
  let c = col
  while (c > 0) {
    colLetter = String.fromCharCode(64 + (c % 26)) + colLetter
    c = Math.floor(c / 26)
  }
  return `${colLetter}${row}`
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
  
  ElMessageBox.confirm(`确定删除行 "${row.label}"?`, '确认删除', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    saveToUndoStack()
    rows.value.splice(rowIndex, 1)
    
    // 同时从左侧资源面板删除
    if (rowIndex < tpl.rowTree.length) {
      tpl.rowTree.splice(rowIndex, 1)
    }
    
    selectedCell.row = null
    showToast('行已删除', 'success')
  }).catch(() => {})
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
  
  ElMessageBox.confirm(`确定删除列 "${col.label}"?`, '确认删除', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
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
  }).catch(() => {})
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
  showAddRowDialog()
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

// ==================== 格式和编辑操作 ====================
const formatBrushSource = ref(null)

function handleCut() {
  if (selectedCell.row === null) return
  const cell = rows.value[selectedCell.row]?.cells[selectedCell.col]
  if (cell && !cell.readOnly) {
    saveToUndoStack()
    clipboard.value = { value: cell.value, isFormula: cell.isFormula, formula: cell.formula }
    cell.value = ''
    cell.isFormula = false
    cell.formula = ''
    showToast('已剪切单元格内容', 'success')
  }
}

function handleFormatBrush() {
  if (selectedCell.row === null) { showToast('请先选中要复制格式的单元格', 'warning'); return }
  if (!formatBrushSource.value) {
    formatBrushSource.value = { ...selectedCell }
    showToast('已选择格式源，点击目标单元格应用', 'success')
  } else {
    formatBrushSource.value = null
    showToast('格式刷已关闭', 'info')
  }
}

function handleBold() {
  if (selectedCell.row === null) return
  const cell = rows.value[selectedCell.row]?.cells[selectedCell.col]
  if (cell && !cell.readOnly) {
    saveToUndoStack()
    cell.style = cell.style || {}
    cell.style.fontWeight = cell.style.fontWeight === 'bold' ? 'normal' : 'bold'
  }
}

function handleItalic() {
  if (selectedCell.row === null) return
  const cell = rows.value[selectedCell.row]?.cells[selectedCell.col]
  if (cell && !cell.readOnly) {
    saveToUndoStack()
    cell.style = cell.style || {}
    cell.style.fontStyle = cell.style.fontStyle === 'italic' ? 'normal' : 'italic'
  }
}

function handleUnderline() {
  if (selectedCell.row === null) return
  const cell = rows.value[selectedCell.row]?.cells[selectedCell.col]
  if (cell && !cell.readOnly) {
    saveToUndoStack()
    cell.style = cell.style || {}
    cell.style.textDecoration = cell.style.textDecoration === 'underline' ? 'none' : 'underline'
  }
}

function handleAlignLeft() {
  if (selectedCell.row === null) return
  const cell = rows.value[selectedCell.row]?.cells[selectedCell.col]
  if (cell) { saveToUndoStack(); cell.style = cell.style || {}; cell.style.textAlign = 'left' }
}

function handleAlignCenter() {
  if (selectedCell.row === null) return
  const cell = rows.value[selectedCell.row]?.cells[selectedCell.col]
  if (cell) { saveToUndoStack(); cell.style = cell.style || {}; cell.style.textAlign = 'center' }
}

function handleAlignRight() {
  if (selectedCell.row === null) return
  const cell = rows.value[selectedCell.row]?.cells[selectedCell.col]
  if (cell) { saveToUndoStack(); cell.style = cell.style || {}; cell.style.textAlign = 'right' }
}

function handleAutoRank() {
  if (selectedCell.col === null) { showToast('请先选中要排行的列', 'warning'); return }
  showToast('自动排行完成', 'success')
}

function handleConditionalFormat() { showToast('条件格式功能开发中', 'warning') }

function handleSort() {
  if (selectedCell.col === null) { showToast('请先选中要排序的列', 'warning'); return }
  saveToUndoStack()
  rows.value.sort((a, b) => {
    const valA = parseFloat(a.cells[selectedCell.col]?.value) || 0
    const valB = parseFloat(b.cells[selectedCell.col]?.value) || 0
    return valA - valB
  })
  showToast('排序完成', 'success')
}

function handleFilter() { showToast('筛选功能开发中', 'warning') }

function handleFind() {
  const searchText = prompt('请输入要查找的内容:')
  if (!searchText) return
  for (let row = 0; row < rows.value.length; row++) {
    for (let col = 0; col < columnHeaders.value.length; col++) {
      const cell = rows.value[row]?.cells[col]
      if (cell && String(cell.value || '').includes(searchText)) {
        selectedCell.row = row; selectedCell.col = col
        showToast(`找到匹配项: ${getCellLabel(row, col)}`, 'success')
        return
      }
    }
  }
  showToast('未找到匹配项', 'info')
}

function handleReplace() {
  const findText = prompt('请输入要查找的内容:')
  if (!findText) return
  const replaceText = prompt('请输入替换内容:')
  let count = 0
  for (let row = 0; row < rows.value.length; row++) {
    for (let col = 0; col < columnHeaders.value.length; col++) {
      const cell = rows.value[row]?.cells[col]
      if (cell && !cell.readOnly && String(cell.value || '').includes(findText)) {
        saveToUndoStack()
        cell.value = String(cell.value).replace(findText, replaceText)
        count++
      }
    }
  }
  showToast(`替换完成，共替换 ${count} 处`, 'success')
}

function handleF9() {
  for (let row = 0; row < rows.value.length; row++) {
    for (let col = 0; col < columnHeaders.value.length; col++) {
      const cell = rows.value[row]?.cells[col]
      if (cell?.isFormula && cell.formula) calculateFormula(row, col)
    }
  }
  showToast('公式已重新计算', 'success')
}

function handleCancelEdit() {
  editingCell.row = null; editingCell.col = null
  showToast('已取消编辑', 'info')
}

function handleConfirmEdit() {
  commitEdit()
  showToast('已确认编辑', 'success')
}

function transformTemplateData(data) {
  const typeMap = { '1': 'data', '5': 'formula', '6': 'metric' }
  const alignMap = { '0': 'left', '1': 'center', '2': 'right' }

  function isFlatStructure(arr) {
    if (!arr?.length) return false

    // ✅ 调试日志：检查每个节点的 children
    arr.forEach((item, idx) => {
      console.log(`[isFlatStructure] 节点 ${idx}:`, {
        name: item.name,
        children: item.children,
        childrenType: typeof item.children,
        isArray: Array.isArray(item.children),
        childrenLength: item.children?.length
      })
    })

    // ✅ 关键修复：检查所有节点的 children 是否都是空数组或 null/undefined
    const hasAnyValidChildren = arr.some(item => {
      // children 是有效数组且长度 > 0
      const isValid = Array.isArray(item.children) && item.children.length > 0
      console.log(`[isFlatStructure] 节点 "${item.name}" 的 children 是否有效:`, isValid)
      return isValid
    })


    // ✅ 如果有任何节点有有效的 children，就不是扁平结构
    if (hasAnyValidChildren) {
      return false
    }

    // ✅ 检查是否有 level 字段（扁平结构的特征）
    const hasLevel = arr[0].level !== undefined &&
                     typeof arr[0].level === 'number' &&
                     arr[0].level >= 0
    return hasLevel
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

  function transformRows(rows, isRecursive = false) {
    if (!rows || !Array.isArray(rows)) return []
    // ✅ 关键修复：只有顶层调用才判断是否是扁平结构
    // 递归调用时，子节点自然有 level 字段，不需要再次转换
    if (!isRecursive && isFlatStructure(rows)) {
      return buildTreeFromFlat(rows)
    }

    // ✅ 处理嵌套结构 - 递归处理 children
    const result = rows.map((row, idx) => {
      const transformedNode = {
        id: row.id || row.rowId,
        code: row.code || '',
        label: row.name || row.title || '',
        isSummary: !!row.isSummary,
        summaryType: row.summaryType || 'total',
        expanded: row.expanded !== undefined ? row.expanded : (row.children?.length > 0),
        // ✅ 关键修复：递归调用时传递 isRecursive=true
        children: row.children ? transformRows(row.children, true) : []
      }
      return transformedNode
    })
    return result
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
    metrics: (data.metrics || []).map(m => ({
      ...m,
      id: m.id || generateId('metric'),
      label: m.label || m.name || '',
      field: m.field || m.fieldName || '',
      expression: m.expression || m.customFormula || '',
      resultType: m.resultType || 'number',
      targetCell: m.targetCell || '',
      targetRow: m.targetRow || m.targetRowCode || '',
      targetCol: m.targetCol || m.targetColCode || '',
      type: m.type || 'metric'
    })),
    aggregates: (data.metrics || data.aggregates || []).map(fromBackendAggregate),
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
    metrics: (data.metrics || []).map(m => ({
      id: m.id || '',
      label: m.label || m.name || '',
      field: m.field || m.fieldName || '',
      expression: m.expression || '',
      resultType: m.resultType || 'number',
      targetCell: m.targetCell || '',
      targetRow: m.targetRow || '',
      targetCol: m.targetCol || '',
      dependencies: m.dependencies || [],
      priority: m.order || 0,
      type: m.type || 'metric'
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
@use './design-tokens' as *;

/* ====== 基础 ====== */
.designer {
  display: flex; flex-direction: column;
  height: 100vh; background: $dg-bg-page;
  color: $dg-text-heading; font-family: $dg-font-family;
  font-size: $dg-font-size-sm; transition: background .3s;

  &.is-dark {
    background: #1A1D23; color: $dg-border;
    .dg-header, .dg-sidebar, .dg-properties, .dg-footer {
      background: #242830; border-color: $dg-text-primary;
    }
    .dg-menubar, .dg-toolbar, .dg-formula-bar { background: #242830; border-color: $dg-text-primary; }
    .dg-main { background: #1A1D23; }
    .dg-table { border-color: $dg-text-primary; }
    .dg-th, .dg-td { border-color: $dg-text-primary; }
    .dg-th { background: #2D323C; color: $dg-text-placeholder; }
    .dg-td { background: #1A1D23; }
    .dg-td-row-label { background: #242830; }
    .dg-row-summary { background: #2D323C !important; }
    .dg-cell-input { background: #242830; border-color: #4B5563; color: $dg-border; }
    .dgp-input, .dgp-select, .dgp-textarea { background: #242830; border-color: #4B5563; color: $dg-border; }
    .dgp-field-value { color: #D1D5DB; }
    .dg-context-menu { background: #2D323C; border-color: #4B5563; }
    .dcm-item:hover { background: $dg-text-primary; }
  }

  &.is-fullscreen {
    .dg-header { padding: 0 16px; }
    .dg-footer { padding: 0 16px; }
  }
}

/* ====== 顶部工具栏 ====== */
.dg-header {
  display: flex; align-items: center; justify-content: space-between;
  height: $dg-header-height; padding: 0 12px;
  background: $dg-bg-panel; border-bottom: 1px solid $dg-border;
  flex-shrink: 0; z-index: 100;
}

.dh-left {
  display: flex; align-items: center; gap: 8px;
}

.dh-back {
  width: 30px; height: 30px; border-radius: $dg-radius-md;
  border: 1px solid $dg-border; background: $dg-bg-panel;
  color: $dg-text-secondary; cursor: pointer; display: flex; align-items: center; justify-content: center;
  &:hover { background: $dg-bg-header; color: $dg-text-primary; }
}

.dh-title { font-size: $dg-font-size-base; font-weight: 700; color: $dg-text-heading; }

.dh-divider { width: 1px; height: 20px; background: $dg-border; }

.dh-template-name {
  font-size: $dg-font-size-base; font-weight: 600; color: $dg-text-primary;
  max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.dh-template-code {
  font-size: $dg-font-size-xs; color: $dg-text-placeholder; font-family: monospace;
  background: $dg-bg-header; padding: 2px 8px; border-radius: $dg-radius-md;
}

.dh-center {
  display: flex; align-items: center; gap: 4px;
}

.dh-tool-btn {
  display: flex; align-items: center; gap: 4px;
  height: 30px; padding: 0 10px; border-radius: $dg-radius-md;
  font-size: $dg-font-size-sm; font-weight: 500;
  border: 1px solid $dg-border; background: $dg-bg-panel;
  color: $dg-text-primary; cursor: pointer; transition: all .15s;
  white-space: nowrap;

  &:hover { background: $dg-bg-header; border-color: $dg-text-placeholder; }
  &:disabled { opacity: .4; cursor: not-allowed; }
}

.dh-tool-divider { width: 1px; height: 18px; background: $dg-border; margin: 0 4px; }

.dh-right {
  display: flex; align-items: center; gap: 12px;
}

.dh-status {
  font-size: $dg-font-size-xs; font-weight: 600; padding: 2px 8px; border-radius: $dg-radius-pill;

  &.dh-status-designing { background: $dg-warning-bg; color: #92400E; }
  &.dh-status-pending { background: $dg-primary-light; color: $dg-primary; }
  &.dh-status-published { background: $dg-success-bg; color: #065F46; }
  &.dh-status-changed { background: #FCE7F3; color: #9D174D; }
  &.dh-status-archived { background: $dg-bg-header; color: $dg-text-secondary; }
  &.dh-status-disabled { background: $dg-bg-header; color: $dg-text-placeholder; }
}

.dh-version { font-size: $dg-font-size-xs; color: $dg-text-placeholder; }

/* ====== 菜单栏 ====== */
.dg-menubar {
  display: flex; align-items: center;
  height: $dg-menubar-height; padding: 0 12px;
  background: $dg-bg-panel; border-bottom: 1px solid $dg-border;
  flex-shrink: 0; gap: 0;
}

.dg-menu-item {
  padding: 0 10px; height: 100%;
  display: flex; align-items: center;
  font-size: $dg-font-size-sm; color: $dg-text-primary;
  cursor: pointer; position: relative;
  &:hover { background: $dg-bg-header; }
  &.active { color: $dg-primary; }
}

.dg-menu-dropdown {
  position: absolute; top: 100%; left: 0;
  background: $dg-bg-panel; border: 1px solid $dg-border;
  border-radius: $dg-radius-md; box-shadow: $dg-shadow-dropdown;
  min-width: 160px; z-index: $dg-z-dropdown; padding: 4px 0;
}

.dg-menu-dropdown-item {
  padding: 6px 16px; font-size: $dg-font-size-sm; color: $dg-text-primary;
  cursor: pointer; white-space: nowrap;
  &:hover { background: $dg-primary-lighter; color: $dg-primary; }
}

/* ====== 工具栏 ====== */
.dg-toolbar {
  display: flex; align-items: center; gap: 4px;
  height: $dg-toolbar-height; padding: 0 8px;
  background: $dg-bg-panel; border-bottom: 1px solid $dg-border;
  flex-shrink: 0;
}

.dg-tool-group {
  display: flex; align-items: center; gap: 2px;
}

.dg-tool-sep {
  width: 1px; height: 20px; background: $dg-border; margin: 0 4px;
}

.dg-tool-btn {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: $dg-radius-sm;
  border: none; background: transparent; color: $dg-text-primary;
  cursor: pointer; font-size: $dg-font-size-sm; transition: all .15s;
  &:hover { background: $dg-bg-header; }
  &.active { background: $dg-primary-light; color: $dg-primary; }
  &:disabled { color: $dg-text-placeholder; cursor: not-allowed; }
}

.dg-tool-text-btn {
  display: flex; align-items: center; gap: 4px;
  height: 28px; padding: 0 8px; border-radius: $dg-radius-sm;
  border: none; background: transparent; color: $dg-text-primary;
  cursor: pointer; font-size: $dg-font-size-sm; transition: all .15s;
  &:hover { background: $dg-bg-header; }
}

.dg-tool-select {
  height: 26px; padding: 0 6px; border: 1px solid $dg-border;
  border-radius: $dg-radius-sm; font-size: $dg-font-size-xs;
  color: $dg-text-primary; background: $dg-bg-panel;
  outline: none; cursor: pointer;
  &:focus { border-color: $dg-primary; }
}

/* ====== 公式栏 ====== */
.dg-formula-bar {
  display: flex; align-items: center;
  height: $dg-formula-bar-height; padding: 0 8px;
  background: $dg-bg-panel; border-bottom: 1px solid $dg-border;
  flex-shrink: 0; gap: 4px;
}

.dg-fb-cell-ref {
  font-size: $dg-font-size-xs; font-weight: 600;
  color: $dg-primary; background: $dg-primary-light;
  padding: 2px 6px; border-radius: $dg-radius-sm;
  min-width: 28px; text-align: center;
}

.dg-fb-btn {
  width: 22px; height: 22px; border: none; background: transparent;
  color: $dg-text-secondary; cursor: pointer; border-radius: $dg-radius-sm;
  display: flex; align-items: center; justify-content: center;
  font-size: $dg-font-size-xs; transition: all .15s;
  &:hover { background: $dg-bg-header; color: $dg-primary; }
}

.dg-fb-input {
  flex: 1; height: 22px; border: 1px solid $dg-border;
  border-radius: $dg-radius-sm; font-size: $dg-font-size-sm;
  color: $dg-text-primary; background: $dg-bg-input;
  padding: 0 6px; outline: none;
  &:focus { border-color: $dg-primary; background: $dg-bg-panel; }
}

/* ====== 主体布局 ====== */
.dg-body { display: flex; flex: 1; overflow: hidden; }

/* ====== 左侧资源面板 ====== */
.dg-sidebar {
  width: $dg-sidebar-width; background: $dg-bg-panel; border-right: 1px solid $dg-border;
  display: flex; flex-direction: column; flex-shrink: 0;
  transition: width .2s;

  &.collapsed { width: $dg-sidebar-collapsed-width; }
}

.dg-sidebar-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px; border-bottom: 1px solid $dg-border;
}

.dgs-title { font-size: 12px; font-weight: 700; color: $dg-text-primary; }

.dgs-collapse {
  width: 24px; height: 24px; border: none; background: none;
  color: $dg-text-placeholder; cursor: pointer; display: flex; align-items: center; justify-content: center;
  border-radius: $dg-radius-md; &:hover { background: $dg-bg-header; }
}

.dg-nav-tree { flex: 1; overflow-y: auto; }

.dgn-item { border-bottom: 1px solid $dg-bg-header; }

.dgn-header {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 12px; cursor: pointer;
  transition: background .15s;
  
  &:hover { background: $dg-bg-header; }
  &.active { background: $dg-primary-lighter; color: $dg-primary; }
}

.dgn-icon { font-size: 14px; }

.dgn-label { flex: 1; font-size: 13px; color: $dg-text-primary; }

.dgn-badge {
  font-size: 10px; font-weight: 600;
  background: $dg-border; color: $dg-text-secondary;
  padding: 1px 6px; border-radius: 10px;
}

.dgn-expand-icon {
  font-size: 10px; color: $dg-text-placeholder;
  width: 14px; text-align: center;
}

.dg-sidebar.collapsed .dgn-label,
.dg-sidebar.collapsed .dgn-badge,
.dg-sidebar.collapsed .dgs-title,
.dg-sidebar.collapsed .dgn-expand-icon,
.dg-sidebar.collapsed .dgn-content { display: none; }

/* ====== 资源面板内容区域 ====== */
.dgn-content {
  background: $dg-bg-row-alt;
  border-top: 1px solid $dg-border;
  padding: 8px 0;
  max-height: 320px;
  overflow-y: auto;
  overflow-x: hidden;
}

.dgn-toolbar {
  display: flex; align-items: center; gap: 8px;
  padding: 4px 8px;
  border-bottom: 1px solid $dg-border;
  margin-bottom: 4px;
}

.dgn-tool-hint {
  font-size: 10px;
  color: $dg-text-placeholder;
  flex: 1;
}

.dgn-tool-btn {
  padding: 2px 8px;
  font-size: 11px;
  color: $dg-primary;
  background: $dg-primary-light;
  border: none;
  border-radius: $dg-radius-sm;
  cursor: pointer;
  
  &:hover { background: $dg-primary-border; }
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
  
  &:hover { background: $dg-bg-header; }
}

.dgn-tree-expand {
  font-size: 9px; color: $dg-text-placeholder;
  width: 12px; text-align: center;
  cursor: pointer;
}

.dgn-tree-label {
  flex: 1;
  color: $dg-text-primary;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dgn-tree-summary-tag {
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 2px;
  background: $dg-primary-light;
  color: $dg-primary;
  margin-right: 4px;
}

.dgn-tree-summary {
  background: $dg-warning-bg;
  
  .dgn-tree-label {
    font-weight: 600;
  }
}

.dgn-tree-code {
  font-size: 10px;
  color: $dg-text-placeholder;
  background: $dg-bg-header;
  padding: 1px 4px;
  border-radius: $dg-radius-sm;
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
  
  &:hover { background: $dg-bg-header; }
}

.dgn-list-icon {
  font-size: 13px;
  width: 20px; text-align: center;
}

.dgn-list-info { flex: 1; min-width: 0; }

.dgn-list-label {
  font-size: 12px;
  color: $dg-text-primary;
  font-weight: 500;
}

.dgn-list-desc {
  font-size: 10px;
  color: $dg-text-placeholder;
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
  color: $dg-text-inverse;
  font-size: 9px;
  border-radius: $dg-radius-sm;
  font-weight: 500;
  flex-shrink: 0;
  white-space: nowrap;
}

.dgn-no-target-badge {
  display: inline-block;
  padding: 1px 6px;
  background: $dg-error-bg;
  color: $dg-error;
  font-size: 9px;
  border-radius: $dg-radius-sm;
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
  color: $dg-text-primary;
  padding: 4px 12px;
  background: $dg-bg-header;
  border-bottom: 1px solid $dg-border;
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
  color: $dg-text-secondary;
}

.dgn-input, .dgn-select, .dgn-textarea {
  padding: 3px 6px;
  border: 1px solid $dg-border;
  border-radius: $dg-radius-sm;
  font-size: 11px;
  color: $dg-text-primary;
  background: $dg-bg-panel;
  outline: none;
  
  &:focus { border-color: $dg-primary; }
}

.dgn-textarea { resize: vertical; min-height: 40px; }

.dgn-select {
  padding: 3px 6px;
  border: 1px solid $dg-border;
  border-radius: $dg-radius-sm;
  font-size: 11px;
  color: $dg-text-primary;
  background: $dg-bg-panel;
  outline: none;
  cursor: pointer;

  &:focus { border-color: $dg-primary; }
}

.dgn-field-value {
  font-size: 11px;
  color: $dg-text-primary;
  padding: 3px 6px;
  background: $dg-bg-panel;
  border: 1px solid $dg-border;
  border-radius: $dg-radius-sm;
}

/* 空状态 */
.dgn-empty {
  font-size: 11px;
  color: $dg-text-placeholder;
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
  background: $dg-bg-panel; border-radius: $dg-radius-lg;
  border: 1px solid $dg-border;
  margin-bottom: 12px;
}

.dct-label { font-size: 12px; color: $dg-text-secondary; font-weight: 500; }

.dct-divider { width: 1px; height: 16px; background: $dg-border; }

.dct-btn {
  padding: 4px 10px; border-radius: $dg-radius-md;
  font-size: 12px; color: $dg-text-primary;
  border: 1px solid $dg-border; background: $dg-bg-panel;
  cursor: pointer; transition: all .15s;
  
  &:hover { background: $dg-bg-header; }
  &.active { background: $dg-primary; color: $dg-text-inverse; border-color: $dg-primary; }
  &:disabled { 
    color: $dg-text-placeholder; 
    background: $dg-bg-header; 
    cursor: not-allowed; 
    border-color: $dg-border;
  }
}

.dg-spreadsheet {
  background: $dg-bg-panel; border-radius: $dg-radius-lg;
  border: 1px solid $dg-border;
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
  color: $dg-text-primary;
  background: $dg-bg-header;
  border: 1px solid $dg-border;
  white-space: nowrap;
  position: sticky; top: 0;
  z-index: 10;
}

.dg-th-corner {
  width: 40px;
  background: $dg-bg-header;
}

.dg-th-row-header {
  width: 120px;
  background: $dg-border;
  font-weight: 700;
  color: $dg-text-primary;
  position: sticky;
  left: 0;
  z-index: 15;
  border-right: 2px solid $dg-border-strong;
}

.dg-th-group {
  background: $dg-bg-header;
  font-weight: 700;
  color: $dg-text-heading;
}

.dg-col-label { display: block; }

.dg-fx-badge {
  font-size: 10px; font-weight: 700;
  color: $dg-primary; background: $dg-primary-light;
  padding: 1px 4px; border-radius: $dg-radius-sm;
  margin-left: 4px;
}

.dg-td {
  padding: 8px 12px;
  border: 1px solid $dg-border;
  font-size: 13px;
  min-width: 80px;
  white-space: nowrap;
  vertical-align: middle;
  
  &:hover { background: $dg-bg-header; }
  &.dg-td-selected { background: $dg-primary-lighter; box-shadow: inset 0 0 0 2px $dg-primary; }
  &.dg-td-editing { padding: 0; }
  &.dg-td-readonly { background: $dg-bg-header; color: $dg-text-placeholder; }
  &.dg-td-formula { background: $dg-primary-lighter; }
  &.dg-td-merged { background: $dg-primary-light; text-align: center; font-weight: 600; }
  &.dg-td-in-range { background: $dg-primary-light; }
}

.dg-td-row-label {
  background: $dg-bg-header;
  font-weight: 600;
  color: $dg-text-primary;
  position: sticky; left: 0;
  z-index: 5;
  cursor: pointer;
  user-select: none;
  
  &:hover { background: $dg-bg-header; }
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
  color: $dg-text-secondary;
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover { color: $dg-primary; }
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
  background: $dg-bg-header;
  font-weight: 700;
  color: $dg-text-heading;
  vertical-align: middle;
  border-right: 2px solid $dg-border-strong;
}

.dg-row-summary {
  background: $dg-primary-lighter !important;
  font-weight: 600;
  
  .dg-td { background: $dg-primary-lighter; }
}

.dg-summary-tag {
  font-size: 10px; color: $dg-primary;
  background: $dg-primary-light; padding: 1px 6px; border-radius: $dg-radius-md;
  margin-left: 6px;
}

.dg-cell-input {
  width: 100%; height: 100%;
  border: none; outline: none;
  padding: 8px 12px;
  font-size: 13px;
  background: $dg-bg-panel;
}

.dg-row-label-input {
  flex: 1;
  min-width: 60px;
  border: 1px solid $dg-primary;
  border-radius: $dg-radius-sm;
  padding: 2px 6px;
  font-size: 13px;
  font-weight: 600;
  color: $dg-text-primary;
  background: $dg-bg-panel;
  outline: none;
  
  &:focus {
    border-color: $dg-primary;
    box-shadow: 0 0 0 2px $dg-primary-light;
  }
}

.dg-fx-indicator {
  display: inline-block;
  font-size: 10px; font-weight: 700;
  color: $dg-primary;
  margin-right: 4px;
}

/* ====== 右侧属性面板 ====== */
.dg-properties {
  width: $dg-props-width; background: $dg-bg-panel; border-left: 1px solid $dg-border;
  display: flex; flex-direction: column; flex-shrink: 0;
  transition: width .2s;
  
  &.collapsed { width: $dg-props-collapsed-width; }
}

.dg-properties-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px; border-bottom: 1px solid $dg-border;
}

.dgp-title { font-size: 12px; font-weight: 700; color: $dg-text-primary; }

.dgp-collapse {
  width: 24px; height: 24px; border: none; background: none;
  color: $dg-text-placeholder; cursor: pointer; display: flex; align-items: center; justify-content: center;
  border-radius: $dg-radius-md; &:hover { background: $dg-bg-header; }
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
  color: $dg-text-primary; margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid $dg-border;
}

.dgp-form { display: flex; flex-direction: column; gap: 10px; }

.dgp-row { display: flex; gap: 10px; }

.dgp-field {
  flex: 1;
  display: flex; flex-direction: column; gap: 4px;
}

.dgp-field label {
  font-size: 11px; font-weight: 600;
  color: $dg-text-secondary;
}

.dgp-input, .dgp-select, .dgp-textarea {
  padding: 6px 10px;
  border: 1px solid $dg-border;
  border-radius: $dg-radius-md;
  font-size: 12px;
  color: $dg-text-primary;
  background: $dg-bg-panel;
  outline: none;
  
  &:focus { border-color: $dg-primary; }
}

.dgp-textarea { resize: vertical; }

.dgp-field-value {
  font-size: 12px; color: $dg-text-primary;
  padding: 6px 10px;
  background: $dg-bg-header;
  border-radius: $dg-radius-md;
}

.dgp-radio-group {
  display: flex; gap: 4px;
}

.dgp-radio-btn {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid $dg-border;
  border-radius: $dg-radius-md;
  font-size: 12px;
  color: $dg-text-primary;
  background: $dg-bg-panel;
  cursor: pointer;
  
  &:hover { background: $dg-bg-header; }
  &.active { background: $dg-primary; color: $dg-text-inverse; border-color: $dg-primary; }
}

.dgp-color {
  width: 100%; height: 32px;
  border: 1px solid $dg-border;
  border-radius: $dg-radius-md;
  cursor: pointer;
}

.dg-properties.collapsed .dg-properties-content,
.dg-properties.collapsed .dgp-title { display: none; }

/* ====== 底部状态栏 ====== */

/* ====== 工作表标签 ====== */
.dg-sheet-tabs {
  display: flex; align-items: center;
  height: $dg-sheet-tabs-height; padding: 0 8px;
  background: $dg-bg-panel; border-top: 1px solid $dg-border;
  gap: 0; flex-shrink: 0;
}

.dg-sheet-tab {
  padding: 0 14px; height: 100%;
  display: flex; align-items: center;
  font-size: $dg-font-size-sm; color: $dg-text-secondary;
  cursor: pointer; border-bottom: 2px solid transparent;
  transition: all .15s; white-space: nowrap;

  &:hover { color: $dg-text-primary; background: $dg-bg-header; }
  &.active {
    color: $dg-primary; border-bottom-color: $dg-primary;
    font-weight: 500;
  }
}

.dg-sheet-add {
  width: 28px; height: 28px; border: 1px solid $dg-border;
  border-radius: $dg-radius-sm; background: $dg-bg-panel;
  color: $dg-text-secondary; cursor: pointer; margin-left: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; transition: all .15s;
  &:hover { background: $dg-bg-header; color: $dg-primary; border-color: $dg-primary; }
}

/* ====== 底部状态栏（续） ====== */
.dg-footer {
  display: flex; align-items: center; justify-content: space-between;
  height: $dg-footer-height; padding: 0 16px;
  background: $dg-bg-panel; border-top: 1px solid $dg-border;
  flex-shrink: 0;
  font-size: $dg-font-size-xs;
}

.df-left, .df-right { display: flex; align-items: center; gap: 16px; }

.df-status-indicator {
  display: flex; align-items: center; gap: 4px;
  &::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: $dg-success; }
  color: $dg-text-secondary; font-weight: 500;
}

.df-item { display: flex; align-items: center; gap: 4px; }

.df-label { color: $dg-text-placeholder; }

.df-value { color: $dg-text-primary; font-weight: 500; }

/* ====== 右键菜单 ====== */
.dg-context-menu {
  position: fixed; z-index: 1000;
  background: $dg-bg-panel; border: 1px solid $dg-border;
  border-radius: $dg-radius-lg;
  box-shadow: 0 4px 12px rgba(0,0,0,.1);
  padding: 4px;
  min-width: 140px;
}

.dcm-item {
  width: 100%;
  padding: 6px 12px;
  border: none; background: none;
  font-size: 12px; color: $dg-text-primary;
  cursor: pointer;
  text-align: left;
  border-radius: $dg-radius-md;
  transition: background .15s;
  
  &:hover { background: $dg-bg-header; }
}

.dcm-divider {
  height: 1px; background: $dg-border;
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
    color: $dg-text-primary;
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
  border: 2px solid $dg-border;
  border-radius: 8px;
  background: $dg-bg-panel;
  cursor: pointer;
  transition: all .2s;
  
  &:hover {
    border-color: $dg-primary-border;
    background: $dg-primary-lighter;
  }
  
  &.active {
    border-color: $dg-primary;
    background: $dg-primary-light;
    
    .ard-type-label {
      color: $dg-primary;
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
  color: $dg-text-primary;
}

.ard-type-desc {
  font-size: 12px;
  color: $dg-text-placeholder;
  margin-top: 4px;
}

.ard-summary-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ard-summary-btn {
  padding: 8px 16px;
  border: 1px solid $dg-border;
  border-radius: $dg-radius-lg;
  background: $dg-bg-panel;
  font-size: 13px;
  color: $dg-text-primary;
  cursor: pointer;
  transition: all .2s;
  
  &:hover {
    border-color: $dg-primary-border;
    background: $dg-primary-lighter;
  }
  
  &.active {
    border-color: $dg-primary;
    background: $dg-primary-light;
    color: $dg-primary;
  }
}

.ard-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid $dg-border;
  border-radius: $dg-radius-lg;
  font-size: 13px;
  color: $dg-text-primary;
  
  &:focus {
    outline: none;
    border-color: $dg-primary;
    box-shadow: 0 0 0 2px $dg-primary-light;
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
    color: $dg-text-primary;
    margin-bottom: 8px;
  }
}

.nd-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid $dg-border;
  border-radius: $dg-radius-lg;
  font-size: 13px;
  color: $dg-text-primary;
  
  &:focus {
    outline: none;
    border-color: $dg-primary;
    box-shadow: 0 0 0 2px $dg-primary-light;
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
  border: 2px solid $dg-border;
  border-radius: 8px;
  background: $dg-bg-panel;
  cursor: pointer;
  transition: all .2s;
  
  &:hover {
    border-color: $dg-primary-border;
    background: $dg-primary-lighter;
  }
  
  &.active {
    border-color: $dg-primary;
    background: $dg-primary-light;
    
    .nd-type-label {
      color: $dg-primary;
    }
  }
}

.nd-type-icon {
  font-size: 20px;
}

.nd-type-label {
  font-size: 13px;
  font-weight: 600;
  color: $dg-text-primary;
}

.nd-summary-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.nd-summary-btn {
  padding: 8px 16px;
  border: 1px solid $dg-border;
  border-radius: $dg-radius-lg;
  background: $dg-bg-panel;
  font-size: 13px;
  color: $dg-text-primary;
  cursor: pointer;
  transition: all .2s;
  
  &:hover {
    border-color: $dg-primary-border;
    background: $dg-primary-lighter;
  }
  
  &.active {
    border-color: $dg-primary;
    background: $dg-primary-light;
    color: $dg-primary;
  }
}

/* ====== 递归树形组件样式 ====== */
.dgn-tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  cursor: pointer;
  transition: background .15s;
  position: relative;
  border-radius: 4px;
  margin-bottom: 2px;
  flex-wrap: wrap;
  min-height: 32px;
  
  &:hover {
    background: rgba(18, 100, 232, 0.08);
    
    .dgn-tree-actions {
      opacity: 1;
    }
  }
}

.dgn-tree-node.dgn-tree-summary {
  background: rgba(251, 191, 36, 0.15);
  
  &:hover {
    background: rgba(251, 191, 36, 0.25);
  }
}

.dgn-tree-expand {
  font-size: 10px;
  color: #999;
  width: 14px;
  height: 14px;
  line-height: 14px;
  text-align: center;
  cursor: pointer;
  flex-shrink: 0;
  border-radius: 3px;
  transition: all .15s;
  
  &:hover {
    background: rgba(0,0,0,0.05);
    color: #666;
  }
}

.dgn-tree-dim-icon {
  font-size: 11px;
  width: 18px;
  height: 18px;
  line-height: 18px;
  text-align: center;
  border-radius: 3px;
  background: rgba(18, 100, 232, 0.1);
  color: #1264e8;
  flex-shrink: 0;
}

.dgn-tree-label {
  flex: 1;
  font-size: 12px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.dgn-tree-summary-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1px 6px;
  background: #1264e8;
  color: #fff;
  font-size: 10px;
  font-weight: 500;
  border-radius: 4px;
  flex-shrink: 0;
}

.dgn-tree-code {
  font-size: 10px;
  color: #999;
  flex-shrink: 0;
  font-family: monospace;
}

.dgn-tree-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity .2s;
  flex-shrink: 0;
}

.dgn-tree-btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: all .15s;
  
  &:hover {
    background: rgba(0,0,0,0.08);
  }
}

.dgn-tree-btn.dgn-tree-add {
  color: #10b981;
  
  &:hover {
    background: rgba(16, 185, 129, 0.15);
  }
}

.dgn-tree-btn.dgn-tree-edit {
  font-size: 11px;
  color: #666;
  
  &:hover {
    background: rgba(0,0,0,0.1);
    color: #333;
  }
}

.dgn-tree-btn.dgn-tree-delete {
  font-size: 11px;
  color: #ef4444;
  
  &:hover {
    background: rgba(239, 68, 68, 0.15);
  }
}

.dgn-tree-children {
  width: 100%;
  display: flex;
  flex-direction: column;
  margin-top: 4px;
  flex-basis: 100%;
}

/* ====== Toast ====== */
.dg-toast {
  position: fixed; top: 20px; right: 20px;
  padding: 10px 20px;
  border-radius: $dg-radius-lg;
  font-size: 13px; font-weight: 500;
  z-index: 2000;
  box-shadow: 0 4px 12px rgba(0,0,0,.1);
  
  &.dg-toast-success { background: $dg-success-bg; color: #065F46; }
  &.dg-toast-error { background: $dg-error-bg; color: #991B1B; }
  &.dg-toast-warning { background: $dg-warning-bg; color: #92400E; }
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
  color: $dg-error;
}

.cd-icon-info {
  color: $dg-primary;
}

.cd-message {
  font-size: 14px;
  color: $dg-text-primary;
  text-align: center;
  line-height: 1.6;
}

.cd-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// ==================== 右侧面板 Tab & 公式工作台 ====================
.dgp-tabs {
  display: flex;
  border-bottom: 1px solid $dg-border;
  padding: 0 8px;
}
.dgp-tab {
  padding: 8px 16px;
  font-size: $dg-font-size-sm;
  font-weight: 500;
  color: $dg-text-secondary;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { color: $dg-text-primary; }
  &.active {
    color: $dg-primary;
    border-bottom-color: $dg-primary;
    font-weight: 600;
  }
}
.dgp-formula-workbench {
  padding: 8px;
}
.dgp-fw-tabs {
  display: flex;
  gap: 2px;
  background: $dg-bg-input;
  border-radius: $dg-radius-md;
  padding: 2px;
  margin-bottom: 8px;
}
.dgp-fw-tab {
  flex: 1;
  padding: 4px 8px;
  font-size: $dg-font-size-xs;
  font-weight: 500;
  color: $dg-text-secondary;
  background: none;
  border: none;
  border-radius: $dg-radius-sm;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { color: $dg-text-primary; }
  &.active {
    background: $dg-bg-panel;
    color: $dg-primary;
    box-shadow: $dg-shadow-sm;
  }
}
.dgp-fw-content {
  padding: 4px 0;
}
.dgp-cell-tabs {
  display: flex;
  gap: 2px;
  background: $dg-bg-input;
  border-radius: $dg-radius-md;
  padding: 2px;
  margin-bottom: 8px;
}
.dgp-cell-tab {
  flex: 1;
  padding: 4px 8px;
  font-size: $dg-font-size-xs;
  font-weight: 500;
  color: $dg-text-secondary;
  background: none;
  border: none;
  border-radius: $dg-radius-sm;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { color: $dg-text-primary; }
  &.active {
    background: $dg-bg-panel;
    color: $dg-primary;
    box-shadow: $dg-shadow-sm;
  }
}
.dgp-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  font-size: $dg-font-size-sm;
  font-weight: 500;
  color: $dg-primary;
  background: $dg-primary-light;
  border: 1px solid $dg-primary-border;
  border-radius: $dg-radius-md;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: $dg-bg-selected; }
}
.dgp-formula-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  font-size: $dg-font-size-sm;
  color: $dg-text-primary;
  border-radius: $dg-radius-sm;
  cursor: pointer;
  transition: background 0.15s;
  &:hover { background: $dg-bg-hover; }
  .formula-name { font-weight: 500; }
  .formula-type { font-size: $dg-font-size-xs; color: $dg-text-secondary; }
}
.dgp-formula-name {
  font-weight: 500;
  font-size: $dg-font-size-sm;
  color: $dg-text-primary;
  margin-right: 8px;
}
.dgp-formula-expr {
  font-size: $dg-font-size-xs;
  color: $dg-text-secondary;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dgp-formula-target {
  font-size: $dg-font-size-xs;
  color: $dg-primary;
  margin-left: 4px;
}
.dgp-validate-status {
  font-size: $dg-font-size-xs;
  font-weight: 500;
  &.valid { color: $dg-success; }
  &.error { color: $dg-error; }
  &.warning { color: $dg-warning; }
}
</style>

<style>
.formula-designer-dialog .el-dialog__body {
  padding: 0;
  height: 75vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.formula-designer-dialog .formula-designer {
  flex: 1;
  min-height: 0;
}
</style>