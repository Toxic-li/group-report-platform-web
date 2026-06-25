/**
 * 报表数据传输对象（DTO）
 * 用于前后端数据交换，符合数据库表结构要求
 */

/**
 * 单元格数据 DTO
 * 对应数据库表：rpt_data
 * 
 * ✅ 改造要点：
 * - rowCode 存储接口返回的 id 字段（BIGINT）
 * - columnCode 存储接口返回的 id 字段（BIGINT）
 * - rowId 和 columnId 参数不再需要（移除）
 */
export class CellDataDTO {
  /**
   * @param {Object} data - 单元格数据
   * @param {BigInt} data.rowCode - 行编码（存储接口返回的id字段）
   * @param {BigInt} data.columnCode - 列编码（存储接口返回的id字段）
   * @param {String} data.value - 单元格值
   * @param {String} data.rawValue - 原始值
   * @param {String} data.formula - 公式表达式（可选）
   * @param {Number} data.dataType - 数据类型：1-文本 2-数字 3-日期
   * @param {Number} data.source - 数据来源：1-手动录入 2-公式计算 3-系统导入 4-接口同步
   * @param {String} data.remark - 备注（可选）
   */
  constructor(data = {}) {
    // ✅ 必填字段（对应数据库字段）
    this.rowCode = data.rowCode || ''             // ✅ VARCHAR(64) - 行编码（存储接口返回的id）
    this.columnCode = data.columnCode || ''       // ✅ VARCHAR(64) - 列编码（存储接口返回的id）
    this.value = data.value || ''                 // 单元格显示值
    this.rawValue = data.rawValue || data.value   // 原始值
    
    // ✅ 可选字段
    this.formula = data.formula || null           // 公式表达式
    this.dataType = data.dataType || this._inferDataType(data.value)  // 数据类型
    this.source = data.source || 1                // 数据来源（默认手动录入）
    this.remark = data.remark || ''               // 备注
    
    // ✅ VTable坐标（仅用于前端内部定位，不提交给后端）
    this._rowIndex = data.rowIndex || null        // 内部使用：行索引
    this._colIndex = data.colIndex || null        // 内部使用：列索引
  }

  /**
   * 推断数据类型
   * @param {String} value - 值
   * @returns {Number} 1-文本 2-数字 3-日期
   */
  _inferDataType(value) {
    if (!value) return 1
    
    // 尝试解析为数字
    const num = Number(value)
    if (!isNaN(num) && value.trim() !== '') return 2
    
    // 尝试解析为日期
    const date = new Date(value)
    if (!isNaN(date.getTime()) && value.includes('-') || value.includes('/')) return 3
    
    // 默认为文本
    return 1
  }

  /**
   * 转换为后端API格式（去除内部字段）
   * @returns {Object} 纯净的DTO对象
   */
  toAPIFormat() {
    return {
      rowCode: this.rowCode,           // ✅ 存储接口返回的id
      columnCode: this.columnCode,     // ✅ 存储接口返回的id
      value: this.value,
      rawValue: this.rawValue,
      formula: this.formula,
      dataType: this.dataType,
      source: this.source,
      remark: this.remark
    }
  }

  /**
   * 验证数据完整性
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validate() {
    const errors = []
    
    if (!this.rowCode) errors.push('缺少 rowCode')
    if (!this.columnCode) errors.push('缺少 columnCode')
    if (!this.value && !this.formula) errors.push('缺少 value 或 formula')
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
}

/**
 * 报表数据保存请求 DTO
 * 对应后端接口：/report/data/save
 */
export class ReportDataSaveDTO {
  /**
   * @param {Object} data - 保存数据
   * @param {BigInt} data.templateId - 模板ID（必填）
   * @param {BigInt} data.orgId - 组织ID（必填）
   * @param {String} data.period - 填报周期（必填，如 202401、2024Q1）
   * @param {Array<CellDataDTO>} data.cells - 单元格数据列表
   * @param {String} data.remark - 备注（可选）
   */
  constructor(data = {}) {
    this.templateId = data.templateId || null     // BIGINT - 模板ID
    this.orgId = data.orgId || null               // BIGINT - 组织ID
    this.period = data.period || ''               // VARCHAR(32) - 填报周期
    this.cells = (data.cells || []).map(c => new CellDataDTO(c))  // List<CellDataDTO>
    this.remark = data.remark || ''               // VARCHAR(512) - 备注
  }

  /**
   * 验证必填字段
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  validate() {
    const errors = []
    
    if (!this.templateId) errors.push('缺少 templateId')
    if (!this.orgId) errors.push('缺少 orgId')
    if (!this.period) errors.push('缺少 period')
    if (this.cells.length === 0) errors.push('cells 为空')
    
    // 验证每个单元格
    for (const cell of this.cells) {
      const cellValidation = cell.validate()
      if (!cellValidation.valid) {
        errors.push(`单元格验证失败: ${cellValidation.errors.join(', ')}`)
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 转换为后端API格式
   * @returns {Object} 纯净的DTO对象
   */
  toAPIFormat() {
    return {
      templateId: this.templateId,
      orgId: this.orgId,
      period: this.period,
      cells: this.cells.map(c => c.toAPIFormat()),
      remark: this.remark
    }
  }
}

/**
 * 行节点配置（带业务ID）
 */
export class RowNodeConfig {
  /**
   * @param {Object} node - 行节点配置
   * @param {BigInt} node.id - 行结构ID（数据库主键）
   * @param {String} node.code - 行编码（业务编码，如 RAW_COAL）
   * @param {String} node.name - 行名称（显示文本）
   * @param {Number} node.level - 层级深度
   * @param {Boolean} node.isSummary - 是否汇总行
   * @param {String} node.summaryType - 汇总类型
   * @param {Array} node.children - 子节点
   */
  constructor(node = {}) {
    this.id = node.id || null                     // BIGINT - 行结构ID
    this.code = node.code || node.id || ''        // VARCHAR(64) - 行编码
    this.name = node.name || ''                   // 显示名称
    this.level = node.level || 0                  // 层级
    this.isSummary = node.isSummary || false      // 是否汇总行
    this.summaryType = node.summaryType || ''     // 汇总类型
    this.children = (node.children || []).map(c => new RowNodeConfig(c))
    
    // ✅ 扩展字段（前端使用）
    this.parentId = node.parentId || null
    this.expanded = node.expanded !== false
    this.sort = node.sort || 0
  }
}

/**
 * 列节点配置（带业务ID）
 */
export class ColumnNodeConfig {
  /**
   * @param {Object} node - 列节点配置
   * @param {BigInt} node.id - 列结构ID（数据库主键）
   * @param {String} node.code - 列编码（业务编码，如 MONTH）
   * @param {String} node.title - 列标题（显示文本）
   * @param {Number} node.level - 层级深度
   * @param {String} node.type - 列类型
   * @param {String} node.format - 数据格式
   * @param {Array} node.children - 子节点
   */
  constructor(node = {}) {
    this.id = node.id || null                     // BIGINT - 列结构ID
    this.code = node.code || node.id || ''        // VARCHAR(64) - 列编码
    this.title = node.title || node.name || ''    // 显示标题
    this.level = node.level || 0                  // 层级
    this.type = node.type || 'data'               // 列类型
    this.format = node.format || 'number'         // 数据格式
    this.children = (node.children || []).map(c => new ColumnNodeConfig(c))
    
    // ✅ 扩展字段（前端使用）
    this.parentId = node.parentId || null
    this.width = node.width || 100
    this.align = node.align || 'right'
    this.unit = node.unit || ''
    this.formula = node.formula || null
  }
}

/**
 * 模板配置（带业务ID）
 */
export class TemplateConfig {
  /**
   * @param {Object} template - 模板配置
   * @param {BigInt} template.id - 模板ID
   * @param {String} template.code - 模板编码
   * @param {String} template.name - 模板名称
   * @param {Array<RowNodeConfig>} template.rows - 行配置（带业务ID）
   * @param {Array<ColumnNodeConfig>} template.columns - 列配置（带业务ID）
   */
  constructor(template = {}) {
    this.id = template.id || null
    this.code = template.code || ''
    this.name = template.name || ''
    
    // ✅ 行配置（带业务ID）
    this.rows = (template.rows || []).map(r => new RowNodeConfig(r))
    
    // ✅ 列配置（带业务ID）
    this.columns = (template.columns || []).map(c => new ColumnNodeConfig(c))
    
    // ✅ 其他配置
    this.layout = template.layout || {}
    this.metrics = template.metrics || []
    this.validators = template.validators || []
  }
  
  /**
   * 根据行索引查找行配置
   * @param {Number} rowIndex - 行索引
   * @returns {RowNodeConfig|null}
   */
  getRowByIndex(rowIndex) {
    return this.rows[rowIndex] || null
  }
  
  /**
   * 根据列索引查找列配置
   * @param {Number} colIndex - 列索引
   * @returns {ColumnNodeConfig|null}
   */
  getColumnByIndex(colIndex) {
    return this.columns[colIndex] || null
  }
  
  /**
   * 根据行ID查找行配置
   * @param {BigInt} rowId - 行ID
   * @returns {RowNodeConfig|null}
   */
  getRowById(rowId) {
    return this.rows.find(r => r.id === rowId) || null
  }
  
  /**
   * 根据列ID查找列配置
   * @param {BigInt} columnId - 列ID
   * @returns {ColumnNodeConfig|null}
   */
  getColumnById(columnId) {
    return this.columns.find(c => c.id === columnId) || null
  }
}