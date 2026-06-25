/**
 * 数据格式验证测试工具
 * 用于验证前端生成的数据是否符合数据库表结构要求
 */

import { CellDataDTO, ReportDataSaveDTO } from '@/types/cellData.js'

/**
 * ✅ 测试 CellDataDTO 格式是否符合数据库要求
 */
export function testCellDataDTO() {
  console.log('=== CellDataDTO 格式验证测试 ===')
  
  // ✅ 创建测试数据（模拟前端生成的数据）
  const testCell = new CellDataDTO({
    rowId: 1001,              // ✅ BIGINT - 行结构ID
    rowCode: 'RAW_COAL',      // ✅ VARCHAR(64) - 行编码
    columnId: 2001,           // ✅ BIGINT - 列结构ID
    columnCode: 'MONTH',      // ✅ VARCHAR(64) - 列编码
    value: '100',             // 单元格值
    rawValue: '100',          // 原始值
    formula: null,            // 公式
    dataType: 2,              // 数据类型：1-文本 2-数字 3-日期
    source: 1,                // 数据来源：1-手动录入
    remark: ''
  })
  
  // ✅ 验证数据完整性
  const validation = testCell.validate()
  console.log('1. 数据验证:', validation.valid ? '✅ 通过' : '❌ 失败')
  if (!validation.valid) {
    console.log('   错误:', validation.errors)
  }
  
  // ✅ 检查字段类型是否符合数据库要求
  console.log('2. 字段类型检查:')
  console.log('   rowId (BIGINT):', typeof testCell.rowId === 'number' ? '✅ 正确' : '❌ 错误')
  console.log('   rowCode (VARCHAR):', typeof testCell.rowCode === 'string' ? '✅ 正确' : '❌ 错误')
  console.log('   columnId (BIGINT):', typeof testCell.columnId === 'number' ? '✅ 正确' : '❌ 错误')
  console.log('   columnCode (VARCHAR):', typeof testCell.columnCode === 'string' ? '✅ 正确' : '❌ 错误')
  
  // ✅ 检查字段长度是否符合数据库要求
  console.log('3. 字段长度检查:')
  console.log('   rowCode 长度 <= 64:', testCell.rowCode.length <= 64 ? '✅ 正确' : '❌ 错误')
  console.log('   columnCode 长度 <= 64:', testCell.columnCode.length <= 64 ? '✅ 正确' : '❌ 错误')
  console.log('   value 镀度 <= 2048:', testCell.value.length <= 2048 ? '✅ 正确' : '❌ 错误')
  
  // ✅ 转换为后端API格式
  const apiFormat = testCell.toAPIFormat()
  console.log('4. API格式转换:', apiFormat)
  
  // ✅ 检查是否包含临时坐标（不应该包含）
  console.log('5. 检查临时坐标:')
  const hasTempId = apiFormat.rowId?.toString().startsWith('r_') || 
                    apiFormat.columnId?.toString().startsWith('c_')
  console.log('   包含临时坐标:', hasTempId ? '❌ 错误（不应包含）' : '✅ 正确（不包含）')
  
  console.log('=== 测试完成 ===')
  return testCell
}

/**
 * ✅ 测试 ReportDataSaveDTO 格式是否符合后端接口要求
 */
export function testReportDataSaveDTO() {
  console.log('=== ReportDataSaveDTO 格式验证测试 ===')
  
  // ✅ 创建测试数据
  const cells = [
    new CellDataDTO({
      rowId: 1001,
      rowCode: 'RAW_COAL',
      columnId: 2001,
      columnCode: 'MONTH',
      value: '100',
      rawValue: '100'
    }),
    new CellDataDTO({
      rowId: 1002,
      rowCode: 'COMMODITY_COAL',
      columnId: 2001,
      columnCode: 'MONTH',
      value: '50',
      rawValue: '50'
    })
  ]
  
  const saveDTO = new ReportDataSaveDTO({
    templateId: 2069685409616498689,  // ✅ BIGINT - 模板ID
    orgId: 4,                        // ✅ BIGINT - 组织ID
    period: '202606',                // ✅ VARCHAR(32) - 填报周期
    cells: cells,
    remark: ''
  })
  
  // ✅ 验证数据完整性
  const validation = saveDTO.validate()
  console.log('1. 数据验证:', validation.valid ? '✅ 通过' : '❌ 失败')
  if (!validation.valid) {
    console.log('   错误:', validation.errors)
  }
  
  // ✅ 检查必填字段
  console.log('2. 必填字段检查:')
  console.log('   templateId:', saveDTO.templateId ? '✅ 存在' : '❌ 缺失')
  console.log('   orgId:', saveDTO.orgId ? '✅ 存在' : '❌ 缺失')
  console.log('   period:', saveDTO.period ? '✅ 存在' : '❌ 缺失')
  console.log('   cells:', saveDTO.cells.length > 0 ? '✅ 存在' : '❌ 缺失')
  
  // ✅ 转换为后端API格式
  const apiFormat = saveDTO.toAPIFormat()
  console.log('3. API格式转换:', apiFormat)
  
  // ✅ 检查数据结构
  console.log('4. 数据结构检查:')
  console.log('   templateId 类型:', typeof apiFormat.templateId === 'number' ? '✅ 正确' : '❌ 错误')
  console.log('   orgId 类型:', typeof apiFormat.orgId === 'number' ? '✅ 正确' : '❌ 错误')
  console.log('   period 类型:', typeof apiFormat.period === 'string' ? '✅ 正确' : '❌ 错误')
  console.log('   cells 类型:', Array.isArray(apiFormat.cells) ? '✅ 正确' : '❌ 错误')
  
  // ✅ 检查单元格数据
  console.log('5. 单元格数据检查:')
  console.log('   单元格数量:', apiFormat.cells.length)
  console.log('   第一个单元格:', apiFormat.cells[0])
  
  // ✅ 检查是否包含临时坐标（不应该包含）
  console.log('6. 检查临时坐标:')
  const hasTempId = apiFormat.cells.some(c => 
    c.rowId?.toString().startsWith('r_') || 
    c.columnId?.toString().startsWith('c_') ||
    c.rowCode?.startsWith('r_') ||
    c.columnCode?.startsWith('c_')
  )
  console.log('   包含临时坐标:', hasTempId ? '❌ 错误（不应包含）' : '✅ 正确（不包含）')
  
  console.log('=== 测试完成 ===')
  return saveDTO
}

/**
 * ✅ 测试从 VTable 数据转换为 CellDataDTO
 */
export function testVTableConversion() {
  console.log('=== VTable 数据转换测试 ===')
  
  // ✅ 模拟 VTable 数据（使用临时坐标）
  const vtableData = {
    "4-2": { v: "100", raw: "100" },  // 原煤产量 × 本月
    "5-2": { v: "50", raw: "50" },    // 商品煤销量 × 本月
    "6-2": { v: "20", raw: "20" }     // 自用量 × 本月
  }
  
  // ✅ 模拟模板配置（带业务ID）
  const templateRows = [
    { id: 1001, code: 'RAW_COAL', name: '原煤产量' },
    { id: 1002, code: 'COMMODITY_COAL', name: '商品煤销量' },
    { id: 1003, code: 'SELF_USE', name: '自用量' }
  ]
  
  const templateColumns = [
    { id: 2001, code: 'MONTH', title: '本月' },
    { id: 2002, code: 'YTD', title: '本月止累计' }
  ]
  
  console.log('1. VTable 原始数据:', vtableData)
  console.log('   使用临时坐标: "4-2", "5-2", "6-2"')
  
  // ✅ 转换为 CellDataDTO（使用真实业务ID）
  const cells = []
  for (const [key, cell] of Object.entries(vtableData)) {
    const [rowIdx, colIdx] = key.split('-').map(Number)
    
    // ✅ 根据索引查找真实的行/列配置
    const rowConfig = templateRows[rowIdx - 4]  // 跳过表头行
    const colConfig = templateColumns[colIdx - 2]  // 跳过前2列
    
    if (rowConfig && colConfig) {
      cells.push(new CellDataDTO({
        rowId: rowConfig.id,          // ✅ BIGINT - 真实业务ID
        rowCode: rowConfig.code,      // ✅ VARCHAR - 业务编码
        columnId: colConfig.id,       // ✅ BIGINT - 真实业务ID
        columnCode: colConfig.code,   // ✅ VARCHAR - 业务编码
        value: cell.v,
        rawValue: cell.raw
      }))
    }
  }
  
  console.log('2. 转换后的 CellDataDTO:', cells)
  console.log('   使用真实业务ID: 1001, 1002, 1003 / 2001')
  
  // ✅ 检查转换结果
  console.log('3. 转换结果检查:')
  console.log('   单元格数量:', cells.length)
  console.log('   第一个单元格:', cells[0]?.toAPIFormat())
  
  // ✅ 检查是否包含临时坐标（不应该包含）
  const hasTempId = cells.some(c => 
    c.rowId?.toString().startsWith('r_') || 
    c.columnId?.toString().startsWith('c_')
  )
  console.log('   包含临时坐标:', hasTempId ? '❌ 错误' : '✅ 正确')
  
  console.log('=== 测试完成 ===')
  return cells
}

/**
 * ✅ 综合测试：验证完整的数据流程
 */
export function testCompleteDataFlow() {
  console.log('=== 完整数据流程验证测试 ===')
  
  // 1. 测试 CellDataDTO 格式
  testCellDataDTO()
  
  // 2. 测试 ReportDataSaveDTO 格式
  testReportDataSaveDTO()
  
  // 3. 测试 VTable 数据转换
  testVTableConversion()
  
  console.log('=== 所有测试完成 ===')
}

// 在浏览器控制台可直接调用
if (typeof window !== 'undefined') {
  window.testCellDataDTO = testCellDataDTO
  window.testReportDataSaveDTO = testReportDataSaveDTO
  window.testVTableConversion = testVTableConversion
  window.testCompleteDataFlow = testCompleteDataFlow
}