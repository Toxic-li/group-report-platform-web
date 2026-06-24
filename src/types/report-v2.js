/**
 * 低代码报表设计器 V2 - 标准模板JSON结构定义
 *
 * 核心原则：
 * - 所有报表配置通过JSON驱动，零代码
 * - 前端可视化设计器 → JSON模板 → 后端引擎执行
 * - 支持行树/列树无限层级、公式、校验、条件格式
 */

// ==================== V2 模板根结构 ====================

/**
 * 报表模板 V2（完整JSON结构）
 *
 * @example
 * {
 *   "id": "1001",
 *   "name": "煤炭生产销售库存表",
 *   "code": "RPT-COAL-001",
 *   "version": 2,
 *   "status": "published",
 *   "layout": { "type": "table", "frozenRows": 4, "frozenCols": 1 },
 *   "rowTree": [...],
 *   "columnTree": [...],
 *   "metrics": [...],
 *   "aggregates": [...],
 *   "validators": [...],
 *   "conditionalFormats": [...],
 *   "dataSource": { ... }
 * }
 */
export class ReportTemplateV2 {
  constructor(json = {}) {
    // === 基本信息 ===
    this.id = json.id || generateId('tpl')
    this.name = json.name || '未命名报表'
    this.code = json.code || ''
    this.version = json.version || 1
    this.status = json.status || 'draft'  // draft | published | archived | deprecated
    this.createdAt = json.createdAt || new Date().toISOString()
    this.updatedAt = json.updatedAt || new Date().toISOString()
    this.createdBy = json.createdBy || ''
    this.updatedBy = json.updatedBy || ''

    // === 描述信息 ===
    this.description = json.description || ''
    this.category = json.category || ''     // production | finance | safety | energy | cost
    this.tags = json.tags || []
    this.icon = json.icon || '📊'

    // === 布局配置 ===
    this.layout = {
      type: json.layout?.type || 'table',           // table | card | pivot | chart
      frozenRows: json.layout?.frozenRows ?? 4,
      frozenCols: json.layout?.frozenCols ?? 1,
      showRowNumbers: json.layout?.showRowNumbers !== false,
      showColHeaders: json.layout?.showColHeaders !== false,
      rowHeight: json.layout?.rowHeight || 32,
      colMinWidth: json.layout?.colMinWidth || 80,
      colMaxWidth: json.layout?.colMaxWidth || 300,
      defaultAlign: json.layout?.defaultAlign || 'right',
      stripeRows: json.layout?.stripeRows || false,
      borderStyle: json.layout?.borderStyle || 'all',  // all | horizontal | vertical | none
      density: json.layout?.density || 'normal',       // compact | normal | comfortable
      ...json.layout
    }

    // === 行树（维度：产品分类/部门/区域等） ===
    this.rowTree = json.rowTree || []

    // === 列树（维度：时间周期/指标类型等） ===
    this.columnTree = json.columnTree || []

    // === 计算指标（公式字段） ===
    this.metrics = (json.metrics || []).map(m => new MetricConfig(m))

    // === 聚合规则 ===
    this.aggregates = (json.aggregates || []).map(a => new AggregateRule(a))

    // === 校验规则 ===
    this.validators = (json.validators || []).map(v => new ValidatorRuleV2(v))

    // === 条件格式 ===
    this.conditionalFormats = (json.conditionalFormats || []).map(c => new ConditionalFormatV2(c))

    // === 数据源配置 ===
    this.dataSource = new DataSourceConfig(json.dataSource || {})

    // === 权限配置 ===
    this.permissions = json.permissions || {
      canEdit: true,
      canExport: true,
      canPrint: true,
      canShare: false,
      editFields: [],
      readOnlyFields: []
    }

    // === 扩展属性 ===
    this.extensions = json.extensions || {}
  }

  /** 获取扁平化行列表 */
  getFlatRows() { return flattenTree(this.rowTree) }
  /** 获取扁平化列列表 */
  getFlatColumns() { return flattenTree(this.columnTree) }
  /** 获取叶子节点行 */
  getLeafRows() { return getLeafNodes(this.rowTree) }
  /** 获取叶子节点列 */
  getLeafColumns() { return getLeafNodes(this.columnTree) }

  /** 转换为纯JSON（用于传输） */
  toJSON() {
    return {
      id: this.id, name: this.name, code: this.code, version: this.version,
      status: this.status, description: this.description, category: this.category,
      tags: this.tags, icon: this.icon, layout: this.layout,
      rowTree: this.rowTree, columnTree: this.columnTree,
      metrics: this.metrics.map(m => m.toJSON()),
      aggregates: this.aggregates.map(a => a.toJSON()),
      validators: this.validators.map(v => v.toJSON()),
      conditionalFormats: this.conditionalFormats.map(c => c.toJSON()),
      dataSource: this.dataSource.toJSON(),
      permissions: this.permissions, extensions: this.extensions,
      createdAt: this.createdAt, updatedAt: this.updatedAt
    }
  }

  /** 验证模板完整性 */
  validate() {
    const errors = []
    if (!this.id) errors.push('缺少模板ID')
    if (!this.name) errors.push('缺少模板名称')
    if (!this.rowTree.length) errors.push('行树为空')
    if (!this.columnTree.length) errors.push('列树为空')
    return { valid: errors.length === 0, errors }
  }
}

// ==================== 行/列节点结构 ====================

/**
 * 行/列树节点（通用）
 * @property {string} id - 唯一标识
 * @property {string} name/title - 显示名称
 * @property {number} level - 层级深度（0起始）
 * @property {string} parentId - 父节点ID
 * @property {number} sort - 排序权重
 * @property {boolean} visible - 是否可见
 * @property {boolean} expandable - 是否可展开
 * @property {boolean} expanded - 默认展开状态
 * @property {Array} children - 子节点
 */
export class TreeNode {
  constructor(json = {}) {
    this.id = json.id || generateId('node')
    this.name = json.name || json.title || ''
    this.level = json.level ?? 0
    this.parentId = json.parentId || null
    this.sort = json.sort ?? 0
    this.visible = json.visible !== false
    this.expandable = json.expandable !== false
    this.expanded = json.expanded !== false
    this.children = (json.children || []).map(c => new TreeNode(c))
  }
}

/**
 * 行节点扩展
 */
export class RowNode extends TreeNode {
  constructor(json = {}) {
    super(json)
    this.isSummary = json.isSummary || false
    this.summaryType = json.summaryType || ''  // subtotal | total | average | group | grand
    this.indent = json.indent ?? (this.level * 20)
    this.style = json.style || {}              // 自定义样式
    this.meta = json.meta || {}                // 元数据
  }
}

/**
 * 列节点扩展
 */
export class ColumnNode extends TreeNode {
  constructor(json = {}) {
    super(json)
    this.title = json.title || json.name || ''
    this.type = json.type || 'data'            // data | formula | aggregate | derived | index
    this.width = json.width || 100
    this.minWidth = json.minWidth || 40
    this.maxWidth = json.maxWidth || 500
    this.align = json.align || 'right'         // left | center | right
    this.format = json.format || 'auto'        // auto | number | percent | thousands | currency | text | date
    this.decimals = json.decimals             // 小数位数，null=自动
    this.unit = json.unit || ''               // 单位后缀
    this.prefix = json.prefix || ''           // 单位前缀
    this.frozen = json.frozen || false
    this.resizable = json.resizable !== false
    this.sortable = json.sortable || false
    this.filterable = json.filterable || false
    this.hidden = json.hidden || false
    this.colSpan = json.colSpan || 1          // 合并列数
    this.style = json.style || {}
    this.headerStyle = json.headerStyle || {}
    this.formula = json.formula || null       // 列级公式
  }
}

// ==================== 计算指标（公式） ====================

/**
 * 公式指标定义（后端就绪格式）
 *
 * @example
 * {
 *   "field": "completionRate",
 *   "label": "完成率",
 *   "expression": "q1Done / q1Plan",
 *   "type": "percent"
 * }
 */
export class MetricConfig {
  constructor(json = {}) {
    this.field = json.field || generateId('metric')   // 字段标识符（唯一）
    this.label = json.label || ''                      // 显示名称
    this.expression = json.expression || ''            // 表达式（不含=号）
    this.type = json.type || 'number'                 // number | percent | string | boolean | currency | date
    this.description = json.description || ''
    this.unit = json.unit || ''
    this.decimals = json.decimals                    // null=自动
    this.format = json.format || 'auto'
    this.dependencies = json.dependencies || []       // 依赖的字段ID列表
    this.targetCell = json.targetCell || null         // 目标单元格坐标
    this.autoCalculate = json.autoCalculate !== false
    this.readOnly = json.readOnly !== false
    this.group = json.group || ''                     // 分组（如"财务指标"、"生产指标"）
    this.order = json.order || 0
    this.createdAt = json.createdAt || new Date().toISOString()
  }

  toJSON() {
    const { field, label, expression, type, description, unit, decimals, format,
            dependencies, targetCell, autoCalculate, readOnly, group, order } = this
    return { field, label, expression, type, description, unit, decimals, format,
             dependencies, targetCell, autoCalculate, readOnly, group, order }
  }
}

// ==================== 聚合规则 ====================

/**
 * 聚合规则定义
 */
export class AggregateRule {
  constructor(json = {}) {
    this.id = json.id || generateId('agg')
    this.target = json.target || {}                   // { type: 'row'|'col', id: 'xxx' }
    this.scope = json.scope || 'children'             // children | siblings | all | custom
    this.function = json.function || 'sum'            // sum | avg | max | min | count | distinct_count
    this.sourceField = json.sourceField || ''         // 聚合源字段
    this.condition = json.condition || null           // 过滤条件表达式
    this.label = json.label || ''
    this.decimals = json.decimals
  }

  toJSON() {
    const { id, target, scope, function: fn, sourceField, condition, label, decimals } = this
    return { id, target, scope, function: fn, sourceField, condition, label, decimals }
  }
}

// ==================== 校验规则 V2 ====================

/**
 * 校验规则（简化版，面向JSON驱动）
 */
export class ValidatorRuleV2 {
  constructor(json = {}) {
    this.id = json.id || generateId('val')
    this.name = json.name || ''
    this.scope = json.scope || 'cell'                  // cell | row | column | region
    this.targetType = json.targetType || 'field'       // field | index | custom
    this.targetId = json.targetId || ''
    this.rules = (json.rules || []).map(r => ({
      type: r.type,                                    // required | numeric | integer | positive | nonNegative | percentRange | range | custom | regex
      message: r.message || '',
      params: r.params || {},                          // { min, max, pattern, customFn }
      severity: r.severity || 'error',                  // error | warning | info
      trigger: r.trigger || 'blur'                     // blur | change | submit
    }))
    this.enabled = json.enabled !== false
  }

  toJSON() {
    const { id, name, scope, targetType, targetId, rules, enabled } = this
    return { id, name, scope, targetType, targetId, rules, enabled }
  }
}

// ==================== 条件格式 V2 ====================

/**
 * 条件格式规则
 */
export class ConditionalFormatV2 {
  constructor(json = {}) {
    this.id = json.id || generateId('cf')
    this.name = json.name || ''
    this.scope = json.scope || 'cell'                  // cell | row | column
    this.targetType = json.targetType || 'field'
    this.targetId = json.targetId || ''
    this.conditions = (json.conditions || []).map(c => ({
      operator: c.operator,                            // eq | neq | gt | gte | lt | lte | between | contains | in | isBlank | notBlank | formula
      value: c.value,
      value2: c.value2                                // for between
    }))
    this.format = json.format || {                     // 应用样式
      backgroundColor: '',
      color: '',
      fontWeight: '',                                  // bold | normal
      fontStyle: '',                                   // italic | normal
      textDecoration: '',                              // underline | line-through
      icon: '',                                        // 数据条/色阶/图标集
      barColor: '',
      barDirection: ''                                 // ltr | rtl
    }
    this.priority = json.priority || 0
    this.stopIfTrue = json.stopIfTrue || false
    this.enabled = json.enabled !== false
  }

  toJSON() {
    const { id, name, scope, targetType, targetId, conditions, format, priority, stopIfTrue, enabled } = this
    return { id, name, scope, targetType, targetId, conditions, format, priority, stopIfTrue, enabled }
  }
}

// ==================== 数据源配置 ====================

/**
 * 数据源配置
 */
export class DataSourceConfig {
  constructor(json = {}) {
    this.type = json.type || 'mock'                    // mock | mysql | postgres | oracle | api | elasticsearch | excel | csv
    this.sourceId = json.sourceId || ''
    this.name = json.name || ''
    this.connection = json.connection || {
      host: '',
      port: '',
      database: '',
      username: '',
      schema: ''
    }
    this.query = json.query || ''                       // SQL / API URL / ES Query
    this.params = json.params || []                     // 参数列表 [{name, type, defaultValue}]
    this.refreshInterval = json.refreshInterval || 0    // 自动刷新间隔(秒), 0=手动
    this.cacheTTL = json.cacheTTL || 300                // 缓存时间(秒)
    this.transform = json.transform || ''               // 数据转换函数
    this.pagination = json.pagination || {
      enabled: false,
      pageSize: 100,
      pageParam: 'page',
      sizeParam: 'size'
    }
  }

  toJSON() {
    const { type, sourceId, name, connection, query, params,
            refreshInterval, cacheTTL, transform, pagination } = this
    return { type, sourceId, name, connection, query, params,
             refreshInterval, cacheTTL, transform, pagination }
  }
}

// ==================== 工具函数 ====================

let _seq = 0
function generateId(prefix = '') {
  return `${prefix}_${Date.now().toString(36)}_${(++_seq).toString(36)}`
}

/** 扁平化树结构 */
function flattenTree(nodes, level = 0, result = []) {
  for (const node of nodes) {
    const item = { ...node, level }
    result.push(item)
    if (node.children?.length) {
      flattenTree(node.children, level + 1, result)
    }
  }
  return result
}

/** 获取所有叶子节点 */
function getLeafNodes(nodes, result = []) {
  for (const node of nodes) {
    if (!node.children?.length) {
      result.push(node)
    } else {
      getLeafNodes(node.children, result)
    }
  }
  return result
}
