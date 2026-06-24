/**
 * 报表模板定义 - 动态报表引擎核心类型
 * 所有结构均来自配置，禁止写死
 */

// ==================== 行定义 ====================
export class ReportRow {
  constructor({ id, name, parentId = null, level = 0, isSummary = false }) {
    this.id = id
    this.name = name
    this.parentId = parentId
    this.level = level
    this.isSummary = isSummary
    this.children = []
  }
}

// ==================== 列定义 ====================
export class ReportColumn {
  constructor({ id, title, parentId = null, level = 0, width = 100 }) {
    this.id = id
    this.title = title
    this.parentId = parentId
    this.level = level
    this.width = width
    this.children = []
  }
}

// ==================== 单元格值 ====================
export class ReportValue {
  constructor({ rowId, columnId, value, formula = null, readOnly = false, format = null }) {
    this.rowId = rowId
    this.columnId = columnId
    this.value = value
    this.formula = formula
    this.readOnly = readOnly
    this.format = format // 'number' | 'percent' | 'thousands'
  }
}

// ==================== 合并单元格信息 ====================
export class MergeCell {
  constructor({ startRow, endRow, startCol, endCol, value = '' }) {
    this.startRow = startRow
    this.endRow = endRow
    this.startCol = startCol
    this.endCol = endCol
    this.value = value
  }
}

// ==================== 报表模板 ====================
export class ReportTemplate {
  constructor({ id, name, code, period, rows = [], columns = [], values = [] }) {
    this.id = id
    this.name = name
    this.code = code
    this.period = period
    this.rows = rows        // ReportRow[] 树形行头
    this.columns = columns  // ReportColumn[] 树形列头
    this.values = values    // ReportValue[]
    this.merges = []        // MergeCell[]
    this.formulas = {}      // { [key]: formulaString }
  }

  /**
   * 获取扁平化行列表（按树序）
   */
  getFlatRows() {
    const result = []
    const traverse = (rows, level) => {
      for (const row of rows) {
        result.push({ ...row, level })
        if (row.children && row.children.length > 0) {
          traverse(row.children, level + 1)
        }
      }
    }
    traverse(this.rows, 0)
    return result
  }

  /**
   * 获取扁平化列列表（按树序）
   */
  getFlatColumns() {
    const result = []
    const traverse = (cols, level) => {
      for (const col of cols) {
        result.push({ ...col, level })
        if (col.children && col.children.length > 0) {
          traverse(col.children, level + 1)
        }
      }
    }
    traverse(this.columns, 0)
    return result
  }

  /**
   * 获取最大层级深度（列头）
   */
  getColumnDepth() {
    let maxDepth = 0
    const traverse = (cols, depth) => {
      maxDepth = Math.max(maxDepth, depth)
      for (const col of cols) {
        if (col.children && col.children.length > 0) {
          traverse(col.children, depth + 1)
        }
      }
    }
    traverse(this.columns, 1)
    return maxDepth
  }

  /**
   * 获取最大层级深度（行头）
   */
  getRowDepth() {
    let maxDepth = 0
    const traverse = (rows, depth) => {
      maxDepth = Math.max(maxDepth, depth)
      for (const row of rows) {
        if (row.children && row.children.length > 0) {
          traverse(row.children, depth + 1)
        }
      }
    }
    traverse(this.rows, 1)
    return maxDepth
  }
}

// ==================== 子公司/单位 ====================
export class Subsidiary {
  constructor({ id, name, code, region, status = 'draft', submitTime = null }) {
    this.id = id
    this.name = name
    this.code = code
    this.region = region
    this.status = status     // 'draft' | 'submitted' | 'reviewing' | 'returned' | 'approved'
    this.submitTime = submitTime
    this.dataVersion = 0
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

// ==================== Univer 工作簿配置 ====================
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
    this.rowData = rowData       // 行高配置
    this.columnData = columnData  // 列宽配置
    this.cellData = cellData      // 单元格数据 { 'row-col': { v, s, f } }
    this.mergeData = mergeData    // 合并单元格
  }
}
