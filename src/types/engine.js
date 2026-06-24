/**
 * 集团统计报表平台 - 完整类型定义
 *
 * 设计原则：
 * - 所有报表通过模板配置动态生成，禁止硬编码
 * - 统一数据模型，所有报表共用同一套存储结构
 * - 支持无限层级行树/列树
 */

// ==================== 报表行节点（支持无限层级） ====================
export class ReportRow {
  constructor({
    id, name,
    parentId = null,
    level = 0,
    sort = 0,
    expandable = true,
    isSummary = false,
    summaryType = '',     // 'subtotal' | 'total' | 'average' | 'group' | 'grand'
    children = []
  }) {
    this.id = id
    this.name = name
    this.parentId = parentId
    this.level = level
    this.sort = sort
    this.expandable = expandable
    this.isSummary = isSummary
    this.summaryType = summaryType
    this.children = children
  }
}

// ==================== 报表列节点（支持无限层级） ====================
export class ReportColumn {
  constructor({
    id, title,
    parentId = null,
    level = 0,
    sort = 0,
    type = 'data',        // 'data' | 'formula' | 'aggregate' | 'derived'
    width = 100,
    align = 'right',      // 'left' | 'center' | 'right'
    format = 'number',    // 'number' | 'percent' | 'thousands' | 'currency' | 'text'
    visible = true,
    frozen = false,
    children = []
  }) {
    this.id = id
    this.title = title
    this.parentId = parentId
    this.level = level
    this.sort = sort
    this.type = type
    this.width = width
    this.align = align
    this.format = format
    this.visible = visible
    this.frozen = frozen
    this.children = children
  }
}

// ==================== 公式定义 ====================
export class FormulaConfig {
  constructor({
    id,
    targetCell,           // 目标单元格坐标，如 "3-5" 或 "r_raw-c_m_raw_coal"
    expression,           // 公式表达式，如 "SUM(m_raw_coal, m_commodity)"
    description = '',
    label = '',           // 公式显示名称，如 "完成率"
    fieldName = '',       // 字段标识符，如 "completionRate"
    resultType = 'number',// 结果类型: 'number' | 'string' | 'boolean' | 'percent'
    dependencies = [],     // 依赖的字段ID列表
    autoCalculate = true,
    readOnly = true,
    createdAt = '',
    updatedAt = ''
  }) {
    this.id = id
    this.targetCell = targetCell
    this.expression = expression
    this.description = description
    this.label = label || this.extractLabel(expression)
    this.fieldName = fieldName || this.generateFieldName(targetCell)
    this.resultType = resultType
    this.dependencies = dependencies
    this.autoCalculate = autoCalculate
    this.readOnly = readOnly
    this.createdAt = createdAt || new Date().toISOString()
    this.updatedAt = updatedAt || new Date().toISOString()
  }

  /** 从表达式自动提取标签 */
  extractLabel(expr) {
    const clean = (expr || '').replace(/^=/, '').trim()
    if (/SUM|AVG/i.test(clean)) return '求和'
    if (/IF/i.test(clean)) return '条件判断'
    if (/MAX/i.test(clean)) return '最大值'
    if (/MIN/i.test(clean)) return '最小值'
    if (/\//.test(clean)) return '比率'
    if (/\*/.test(clean)) return '乘积'
    return clean.substring(0, 20) + (clean.length > 20 ? '...' : '')
  }

  /** 生成字段名 */
  generateFieldName(cell) {
    return `formula_${cell || Date.now().toString(36)}`
  }

  /** 序列化为后端传输格式 */
  toJSON() {
    return {
      id: this.id,
      fieldName: this.fieldName,
      label: this.label,
      expression: this.expression.replace(/^=/, ''),
      resultType: this.resultType,
      targetCell: this.targetCell,
      dependencies: this.dependencies,
      description: this.description,
      readOnly: this.readOnly,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
}

// ==================== 校验规则定义 ====================
export class ValidatorConfig {
  constructor({
    id,
    scope,                 // 校验范围：'cell'(单列) | 'row'(整行) | 'region'(区域)
    targetType,            // 目标类型：'column_id' | 'row_id'
    targetId,
    rules = []             // ValidationRule[]
  }) {
    this.id = id
    this.scope = scope
    this.targetType = targetType
    this.targetId = targetId
    this.rules = rules
  }
}

export class ValidationRule {
  constructor({
    type,                  // 'required' | 'numeric' | 'integer' | 'positive' | 'nonNegative' | 'percentRange' | 'range' | 'custom'
    message = '',
    params = {}            // 规则参数 { min, max, pattern, customFn }
  }) {
    this.type = type
    this.message = message
    this.params = params
  }
}

// ==================== 条件格式定义 ====================
export class ConditionalFormatRule {
  constructor({
    id,
    targetType,             // 'column' | 'row' | 'cell' | 'formula'
    targetId,
    condition,              // 'greaterThan' | 'lessThan' | 'between' | 'equal' | 'contains' | 'formula' | 'yoyGrowth' | 'momGrowth' | 'anomaly'
    value1,
    value2 = null,
    style                  // { bgColor, color, fontWeight, icon, format }
  }) {
    this.id = id
    this.targetType = targetType
    this.targetId = targetId
    this.condition = condition
    this.value1 = value1
    this.value2 = value2
    this.style = style
  }
}

// ==================== 汇总规则定义 ====================
export class AggregateConfig {
  constructor({
    id,
    sourceRowIds,           // 源行ID列表（子节点）
    targetRowId,            // 汇总目标行ID
    method = 'sum',         // 'sum' | 'avg' | 'count' | 'max' | 'min' | 'weightedAvg'
    excludeColumns = [],    // 排除的列ID列表
    label = ''
  }) {
    this.id = id
    this.sourceRowIds = sourceRowIds
    this.targetRowId = targetRowId
    this.method = method
    this.excludeColumns = excludeColumns
    this.label = label
  }
}

// ==================== 权限配置 ====================
export class PermissionConfig {
  constructor(options = {}) {
    const {
      templateId,
      roles = {}
    } = options
    this.templateId = templateId
    this.roles = roles
  }
}

// ==================== 样式配置 ====================
export class StyleConfig {
  constructor(options = {}) {
    const {
      headerStyle = {},
      dataStyle = {},
      summaryStyle = {},
      anomalyStyle = {}
    } = options
    this.headerStyle = headerStyle
    this.dataStyle = dataStyle
    this.summaryStyle = summaryStyle
    this.anomalyStyle = anomalyStyle
  }
}

// ==================== 报表模板（完整版） ====================
export class ReportTemplate {
  constructor({
    id,
    code,
    name,
    description = '',
    version = '1.0.0',
    status = 'draft',          // 'draft' | 'published' | 'archived' | 'deprecated'
    category = 'production',   // 'production' | 'finance' | 'safety' | 'energy' | 'hr' | 'cost' | 'other'
    periodType = 'monthly',    // 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'

    // 树形结构
    rowTree = [],               // ReportRow[] 根节点列表
    columnTree = [],            // ReportColumn[] 根节点列表

    // 引擎配置
    formulas = [],              // FormulaConfig[]
    validators = [],            // ValidatorConfig[]
    aggregates = [],            // AggregateConfig[]
    conditionalFormats = [],    // ConditionalFormatRule[]
    permissions = null,         // PermissionConfig
    styles = null,              // StyleConfig

    // 元信息
    createdBy = '',
    createdAt = '',
    updatedBy = '',
    updatedAt = '',
    publishedBy = null,
    publishedAt = null,

    // 版本链
    parentVersionId = null,
    changelog = []
  }) {
    this.id = id
    this.code = code
    this.name = name
    this.description = description
    this.version = version
    this.status = status
    this.category = category
    this.periodType = periodType
    this.rowTree = rowTree
    this.columnTree = columnTree
    this.formulas = formulas
    this.validators = validators
    this.aggregates = aggregates
    this.conditionalFormats = conditionalFormats
    this.permissions = permissions || new PermissionConfig({ templateId: id })
    this.styles = styles || new StyleConfig()
    this.createdBy = createdBy
    this.createdAt = createdAt
    this.updatedBy = updatedBy
    this.updatedAt = updatedAt
    this.publishedBy = publishedBy
    this.publishedAt = publishedAt
    this.parentVersionId = parentVersionId
    this.changelog = changelog

    // 运行时缓存（不序列化）
    this._flatRows = null
    this._flatCols = null
    this._rowMap = null       // id -> index
    this._colMap = null       // id -> index
    this._values = null       // 兼容 values 数组缓存
  }

  /** 获取扁平化行列表 */
  getFlatRows() {
    if (this._flatRows) return this._flatRows
    this._flatRows = []
    const traverse = (rows, level) => {
      for (const row of rows) {
        this._flatRows.push({ ...row, level })
        if (row.children?.length) traverse(row.children, level + 1)
      }
    }
    traverse(this.rowTree, 0)
    return this._flatRows
  }

  /** 获取扁平化列列表 */
  getFlatColumns() {
    if (this._flatCols) return this._flatCols
    this._flatCols = []
    const traverse = (cols, level) => {
      for (const col of cols) {
        this._flatCols.push({ ...col, level })
        if (col.children?.length) traverse(col.children, level + 1)
      }
    }
    traverse(this.columnTree, 0)
    return this._flatCols
  }

  /** 获取行头深度（表头占几行） */
  getColumnDepth() {
    let maxD = 0
    const walk = (cols, d) => { maxD = Math.max(maxD, d); cols.forEach(c => c.children?.length && walk(c.children, d + 1)) }
    walk(this.columnTree, 1)
    return maxD
  }

  /** 获取列头深度（左侧冻结几列） */
  getRowDepth() {
    let maxD = 0
    const walk = (rows, d) => { maxD = Math.max(maxD, d); rows.forEach(r => r.children?.length && walk(r.children, d + 1)) }
    walk(this.rowTree, 1)
    return maxD
  }

  /** 获取叶子行（无子节点的行） */
  getLeafRows() {
    const leaves = []
    const walk = (rows) => {
      for (const r of rows) {
        (!r.children?.length) ? leaves.push(r) : walk(r.children)
      }
    }
    walk(this.rowTree)
    return leaves
  }

  /** 获取叶子列（无子节点的列） */
  getLeafColumns() {
    const leaves = []
    const walk = (cols) => {
      for (const c of cols) {
        (!c.children?.length) ? leaves.push(c) : walk(c.children)
      }
    }
    walk(this.columnTree)
    return leaves
  }

  /** 构建行列映射表 */
  getRowMap() {
    if (this._rowMap) return this._rowMap
    this._rowMap = new Map()
    this.getFlatRows().forEach((r, i) => this._rowMap.set(r.id, i))
    return this._rowMap
  }

  getColMap() {
    if (this._colMap) return this._colMap
    this._colMap = new Map()
    this.getFlatColumns().forEach((c, i) => this._colMap.set(c.id, i))
    return this._colMap
  }

  /** 清除运行时缓存 */
  invalidateCache() {
    this._flatRows = null
    this._flatCols = null
    this._rowMap = null
    this._colMap = null
    this._values = null
  }

  // ==================== 向后兼容属性（供 TemplateParser 使用） ====================

  /** 兼容 report.js 格式：columns → columnTree */
  get columns() { return this.columnTree }

  /** 兼容 report.js 格式：rows → rowTree */
  get rows() { return this.rowTree }

  /**
   * 兼容 report.js 格式：自动生成 values 数组
   * 基于扁平化行/列生成模拟数据（仅叶子列）
   */
  get values() {
    if (this._values) return this._values
    this._values = []
    const flatRows = this.getFlatRows()
    const flatCols = this.getLeafColumns() // 仅叶子列
    for (const row of flatRows) {
      for (const col of flatCols) {
        if (col.type === 'aggregate' || col.type === 'formula') continue
        const v = Math.random() > 0.2 ? (Math.random() * 90000 + 100).toFixed(2) : ''
        this._values.push(new ReportValue({
          rowId: row.id,
          columnId: col.id,
          value: v,
          readOnly: !!row.isSummary,
          format: col.format || null
        }))
      }
    }
    return this._values
  }
}

// ==================== 单元格值 ====================
export class ReportValue {
  constructor({
    rowId, columnId,
    value,
    formula = null,
    readOnly = false,
    format = null,
    validated = true,
    validationError = ''
  }) {
    this.rowId = rowId
    this.columnId = columnId
    this.value = value
    this.formula = formula
    this.readOnly = readOnly
    this.format = format
    this.validated = validated
    this.validationError = validationError
  }
}

// ==================== 合并单元格 ====================
export class MergeCell {
  constructor({ startRow, endRow, startCol, endCol, value = '' }) {
    this.startRow = startRow
    this.endRow = endRow
    this.startCol = startCol
    this.endCol = endCol
    this.value = value
  }
}

// ==================== 工作簿渲染配置 ====================
export class WorkbookConfig {
  constructor({
    sheetName = 'Sheet1',
    frozenRowCount = 1,
    frozenColumnCount = 2,
    rowData = [],
    columnData = [],
    cellData = {},
    mergeData = []
  }) {
    this.sheetName = sheetName
    this.frozenRowCount = frozenRowCount
    this.frozenColumnCount = frozenColumnCount
    this.rowData = rowData
    this.columnData = columnData
    this.cellData = cellData
    this.mergeData = mergeData
  }
}

// ==================== 子公司/填报单位 ====================
export class Subsidiary {
  constructor({
    id, name, code, region,
    status = 'draft',
    submitTime = null,
    dataVersion = 0
  }) {
    this.id = id
    this.name = name
    this.code = code
    this.region = region
    this.status = status
    this.submitTime = submitTime
    this.dataVersion = dataVersion
  }
}

// ==================== 填报状态枚举 ====================
export const REPORT_STATUS = {
  DRAFT: { key: 'draft', label: '草稿', color: '#D4A017', bg: 'rgba(212,160,23,0.1)' },
  SUBMITTED: { key: 'submitted', label: '已提交', color: '#1565C0', bg: 'rgba(21,101,192,0.1)' },
  REVIEWING: { key: 'reviewing', label: '审核中', color: '#2E7D9A', bg: 'rgba(46,125,154,0.1)' },
  RETURNED: { key: 'returned', label: '已退回', color: '#C62828', bg: 'rgba(198,40,40,0.1)' },
  APPROVED: { key: 'approved', label: '已通过', color: '#2E8B57', bg: 'rgba(46,139,87,0.1)' }
}

// ==================== 模板版本 ====================
export class TemplateVersion {
  constructor({
    templateId,
    version,
    snapshot,                // ReportTemplate 的完整快照 JSON
    changelog = '',
    createdBy = '',
    createdAt = ''
  }) {
    this.templateId = templateId
    this.version = version
    this.snapshot = snapshot
    this.changelog = changelog
    this.createdBy = createdBy
    this.createdAt = createdAt
  }
}

// ==================== 用户角色 ====================
export const USER_ROLES = {
  FILLER: { key: 'filler', label: '填报员', permissions: { canEdit: true, canSubmit: true, canApprove: false, canViewFormula: false } },
  REVIEWER: { key: 'reviewer', label: '审核员', permissions: { canEdit: false, canSubmit: false, canApprove: true, canViewFormula: true } },
  ADMIN: { key: 'admin', label: '管理员', permissions: { canEdit: true, canSubmit: true, canApprove: true, canViewFormula: true } },
  VIEWER: { key: 'viewer', label: '查看者', permissions: { canEdit: false, canSubmit: false, canApprove: false, canViewFormula: true } }
}
