/**
 * 报表模板配置示例（带真实业务ID）
 * 
 * ✅ 改造要点：
 * 1. 行配置增加真实业务ID（BIGINT）和编码（VARCHAR）
 * 2. 列配置增加真实业务ID（BIGINT）和编码（VARCHAR）
 * 3. 不再使用 r_0、c_2 等临时坐标作为业务主键
 * 4. 保存时生成标准 CellDataDTO，包含真实的 rowId、rowCode、columnId、columnCode
 */

import { RowNodeConfig, ColumnNodeConfig, TemplateConfig } from '@/types/cellData.js'

/**
 * 示例模板：煤炭生产销售库存表（带真实业务ID）
 */
export const TEMPLATE_WITH_BUSINESS_ID = {
  "id": "2069685409616498689",  // ✅ 模板ID（BIGINT）
  "code": "RPT-COAL-001",
  "name": "煤炭生产销售库存表",
  "version": 2,
  
  // ✅ 行配置（带真实业务ID）
  "rows": [
    {
      "id": 1001,              // ✅ BIGINT - 行结构ID（数据库主键）
      "code": "RAW_COAL",      // ✅ VARCHAR(64) - 行编码（业务编码）
      "name": "原煤产量",
      "level": 0,
      "isSummary": false
    },
    {
      "id": 1002,
      "code": "COMMODITY_COAL",
      "name": "商品煤销量",
      "level": 0,
      "isSummary": false
    },
    {
      "id": 1003,
      "code": "SELF_USE",
      "name": "自用量",
      "level": 0,
      "isSummary": false
    },
    {
      "id": 1004,
      "code": "INVENTORY",
      "name": "库存量",
      "level": 0,
      "isSummary": false
    },
    {
      "id": 1005,
      "code": "TRAIN_IN",
      "name": "火车运量-省内",
      "level": 0,
      "isSummary": false
    },
    {
      "id": 1006,
      "code": "TRAIN_OUT",
      "name": "火车运量-省外",
      "level": 0,
      "isSummary": false
    },
    {
      "id": 1007,
      "code": "ROAD_IN",
      "name": "公路运量-省内",
      "level": 0,
      "isSummary": false
    },
    {
      "id": 1008,
      "code": "ROAD_OUT",
      "name": "公路运量-省外",
      "level": 0,
      "isSummary": false
    },
    {
      "id": 1009,
      "code": "TOTAL_SUM",
      "name": "合计",
      "level": 0,
      "isSummary": true,
      "summaryType": "total"
    }
  ],
  
  // ✅ 列配置（带真实业务ID）
  "columns": [
    {
      "id": 2001,              // ✅ BIGINT - 列结构ID（数据库主键）
      "code": "MONTH",         // ✅ VARCHAR(64) - 列编码（业务编码）
      "title": "本月",
      "level": 0,
      "type": "data",
      "format": "number",
      "unit": "万吨"
    },
    {
      "id": 2002,
      "code": "YTD",
      "title": "本月止累计",
      "level": 0,
      "type": "data",
      "format": "number",
      "unit": "万吨"
    },
    {
      "id": 2003,
      "code": "YOY",
      "title": "同比(%)",
      "level": 0,
      "type": "derived",
      "format": "percent",
      "decimals": 1
    },
    {
      "id": 2004,
      "code": "MOM",
      "title": "环比(%)",
      "level": 0,
      "type": "derived",
      "format": "percent",
      "decimals": 1
    }
  ],
  
  "layout": {
    "frozenRows": 1,
    "frozenCols": 1,
    "rowHeight": 32
  }
}

/**
 * ✅ 创建模板配置实例
 */
export function createTemplateWithBusinessId() {
  return new TemplateConfig(TEMPLATE_WITH_BUSINESS_ID)
}

/**
 * ✅ 将旧版模板（使用临时ID）转换为新版模板（使用业务ID）
 * 
 * @param {Object} oldTemplate - 旧版模板（rowTree/columnTree 使用 r_x、c_x）
 * @returns {TemplateConfig} 新版模板（rows/columns 使用真实业务ID）
 */
export function convertToBusinessIdTemplate(oldTemplate) {
  const template = new TemplateConfig({
    id: oldTemplate.id,
    code: oldTemplate.code,
    name: oldTemplate.name,
    layout: oldTemplate.layout
  })
  
  // ✅ 转换行树为扁平行列表（分配真实业务ID）
  const flatRows = flattenTree(oldTemplate.rowTree || [])
  template.rows = flatRows.map((row, index) => {
    // ✅ 分配真实业务ID（基于索引生成，实际应从数据库获取）
    const businessId = 1000 + index + 1  // 示例：1001, 1002, 1003...
    
    return new RowNodeConfig({
      id: businessId,
      code: generateRowCode(row.name),  // 生成业务编码
      name: row.name,
      level: row.level,
      isSummary: row.isSummary,
      summaryType: row.summaryType,
      children: row.children
    })
  })
  
  // ✅ 转换列树为扁平列列表（分配真实业务ID）
  const flatCols = flattenTree(oldTemplate.columnTree || [])
  template.columns = flatCols.map((col, index) => {
    // ✅ 分配真实业务ID（基于索引生成，实际应从数据库获取）
    const businessId = 2000 + index + 1  // 示例：2001, 2002, 2003...
    
    return new ColumnNodeConfig({
      id: businessId,
      code: generateColumnCode(col.title),  // 生成业务编码
      title: col.title,
      level: col.level,
      type: col.type,
      format: col.format,
      children: col.children
    })
  })
  
  return template
}

/**
 * 扁平化树结构
 */
function flattenTree(tree, result = []) {
  for (const node of tree) {
    result.push(node)
    if (node.children && node.children.length > 0) {
      flattenTree(node.children, result)
    }
  }
  return result
}

/**
 * 生成行编码（从名称转换）
 */
function generateRowCode(name) {
  // 示例：将中文名称转换为英文编码
  const codeMap = {
    '原煤': 'RAW_COAL',
    '商品煤': 'COMMODITY_COAL',
    '自用量': 'SELF_USE',
    '库存量': 'INVENTORY',
    '合计': 'TOTAL_SUM',
    '小计': 'SUBTOTAL'
  }
  
  // 如果有映射，使用映射值
  if (codeMap[name]) return codeMap[name]
  
  // 否则生成拼音编码（简化版）
  return name.replace(/[^\u4e00-\u9fa5]/g, '').toUpperCase() || `ROW_${Date.now()}`
}

/**
 * 生成列编码（从标题转换）
 */
function generateColumnCode(title) {
  const codeMap = {
    '本月': 'MONTH',
    '本月止累计': 'YTD',
    '同比': 'YOY',
    '环比': 'MOM'
  }
  
  if (codeMap[title]) return codeMap[title]
  
  return title.replace(/[^\u4e00-\u9fa5]/g, '').toUpperCase() || `COL_${Date.now()}`
}

/**
 * ✅ 示例：如何使用模板配置生成 CellDataDTO
 */
export function exampleGenerateCellDataDTO() {
  const template = createTemplateWithBusinessId()
  
  // 假设用户在 VTable 中填写了数据
  const vtableData = {
    "0-0": { v: "100", raw: "100" },  // 原煤产量 × 本月
    "0-1": { v: "200", raw: "200" },  // 原煤产量 × 本月止累计
    "1-0": { v: "50", raw: "50" },    // 商品煤销量 × 本月
  }
  
  // ✅ 转换为 CellDataDTO
  const cells = []
  for (const [key, cell] of Object.entries(vtableData)) {
    const [rowIndex, colIndex] = key.split('-').map(Number)
    
    // ✅ 根据索引查找真实的行/列配置
    const rowConfig = template.getRowByIndex(rowIndex)
    const colConfig = template.getColumnByIndex(colIndex)
    
    if (rowConfig && colConfig) {
      cells.push({
        rowId: rowConfig.id,          // ✅ BIGINT - 真实业务ID
        rowCode: rowConfig.code,      // ✅ VARCHAR - 业务编码
        columnId: colConfig.id,       // ✅ BIGINT - 真实业务ID
        columnCode: colConfig.code,   // ✅ VARCHAR - 业务编码
        value: cell.v,
        rawValue: cell.raw,
        formula: cell.f || null
      })
    }
  }
  
  console.log('[Example] 生成的 CellDataDTO:', cells)
  return cells
}