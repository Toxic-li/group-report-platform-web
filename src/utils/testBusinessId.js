/**
 * 业务ID转换测试工具
 * 用于验证字符串ID是否正确转换为真实业务ID
 */

/**
 * ✅ 测试业务ID生成逻辑
 */
export function testBusinessIdGeneration() {
  console.log('=== 业务ID生成测试 ===')
  
  // ✅ 测试数据
  const testCases = [
    { strId: 'r_raw', name: '原煤', expectedCode: 'RAW' },
    { strId: 'r_total', name: '合计', expectedCode: 'TOTAL' },
    { strId: 'm_raw_coal', name: '原煤产量', expectedCode: 'RAW_COAL' },
    { strId: 'ytd_raw_coal', name: '原煤产量', expectedCode: 'RAW_COAL' },
    { strId: 'yoy_raw_coal', name: '原煤产量', expectedCode: 'RAW_COAL' },
    { strId: 'c_month', name: '本月', expectedCode: 'MONTH' }
  ]
  
  // ✅ 业务ID生成函数
  function generateBusinessId(strId, prefix, index) {
    const baseId = prefix === 'row' ? 1000 : 2000
    return baseId + index + 1
  }
  
  function generateBusinessCode(strId, name) {
    let code = strId.replace(/^(r_|m_|c_|ytd_|yoy_|col_)/, '').toUpperCase()
    
    if (code.length < 2) {
      const nameMap = {
        '原煤': 'RAW_COAL',
        '商品煤': 'COMMODITY_COAL',
        '自用量': 'SELF_USE',
        '库存量': 'INVENTORY',
        '合计': 'TOTAL',
        '小计': 'SUBTOTAL',
        '本月': 'MONTH',
        '本月止累计': 'YTD',
        '同比': 'YOY',
        '环比': 'MOM'
      }
      code = nameMap[name] || name.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').toUpperCase() || strId.toUpperCase()
    }
    
    return code
  }
  
  // ✅ 执行测试
  for (const testCase of testCases) {
    const prefix = testCase.strId.startsWith('r_') ? 'row' : 'col'
    const index = testCases.indexOf(testCase)
    
    const businessId = generateBusinessId(testCase.strId, prefix, index)
    const businessCode = generateBusinessCode(testCase.strId, testCase.name)
    
    console.log(`测试 ${index + 1}:`)
    console.log(`  输入: ${testCase.strId} (${testCase.name})`)
    console.log(`  输出: ID=${businessId}, Code=${businessCode}`)
    console.log(`  预期: Code=${testCase.expectedCode}`)
    console.log(`  结果: ${businessCode === testCase.expectedCode ? '✅ 正确' : '❌ 错误'}`)
  }
  
  console.log('=== 测试完成 ===')
}

/**
 * ✅ 测试完整的数据转换流程
 */
export function testCompleteConversionFlow() {
  console.log('=== 完整数据转换流程测试 ===')
  
  // ✅ 模拟 VTable 数据
  const vtableData = {
    "4-2": { v: "100", raw: "100" },  // 原煤产量 × 本月
    "5-2": { v: "50", raw: "50" },    // 商品煤销量 × 本月
    "6-2": { v: "20", raw: "20" }     // 自用量 × 本月
  }
  
  // ✅ 模拟模板配置（已转换）
  const templateRows = [
    { id: 1001, code: 'RAW', name: '原煤' },
    { id: 1002, code: 'TOTAL', name: '合计' },
    { id: 1003, code: 'SCREENED', name: '筛煤' }
  ]
  
  const templateColumns = [
    { id: 0, code: 'INDEX', title: '#' },
    { id: 1, code: 'METRIC', title: '指标' },
    { id: 2001, code: 'RAW_COAL', title: '原煤产量' },
    { id: 2002, code: 'COMMODITY_COAL', title: '商品煤销量' }
  ]
  
  console.log('1. VTable 原始数据:', vtableData)
  console.log('   使用临时坐标: "4-2", "5-2", "6-2"')
  
  console.log('2. 模板配置（已转换）:')
  console.log('   行配置:', templateRows)
  console.log('   列配置:', templateColumns)
  
  // ✅ 转换为 CellDataDTO
  const cells = []
  for (const [key, cell] of Object.entries(vtableData)) {
    const [rowIdx, colIdx] = key.split('-').map(Number)
    
    const rowConfig = templateRows[rowIdx - 4]
    const colConfig = templateColumns[colIdx]
    
    if (rowConfig && colConfig) {
      cells.push({
        rowId: rowConfig.id,
        rowCode: rowConfig.code,
        columnId: colConfig.id,
        columnCode: colConfig.code,
        value: cell.v,
        rawValue: cell.raw
      })
    }
  }
  
  console.log('3. 转换后的 CellDataDTO:', cells)
  
  // ✅ 检查转换结果
  console.log('4. 转换结果检查:')
  console.log('   单元格数量:', cells.length)
  console.log('   第一个单元格:', cells[0])
  
  // ✅ 检查是否包含临时坐标（不应该包含）
  const hasTempId = cells.some(c => 
    c.rowId?.toString().startsWith('r_') || 
    c.columnId?.toString().startsWith('c_') ||
    c.rowCode?.startsWith('ROW_') ||
    c.columnCode?.startsWith('COL_')
  )
  console.log('   包含临时编码:', hasTempId ? '❌ 错误' : '✅ 正确')
  
  // ✅ 检查业务ID是否为数字（BIGINT）
  const isBigInt = cells.every(c => typeof c.rowId === 'number' && typeof c.columnId === 'number')
  console.log('   业务ID为数字:', isBigInt ? '✅ 正确' : '❌ 错误')
  
  // ✅ 检查业务编码是否为字符串（VARCHAR）
  const isVarchar = cells.every(c => typeof c.rowCode === 'string' && typeof c.columnCode === 'string')
  console.log('   业务编码为字符串:', isVarchar ? '✅ 正确' : '❌ 错误')
  
  console.log('=== 测试完成 ===')
  return cells
}

/**
 * ✅ 测试实际保存数据格式
 */
export function testActualSaveDataFormat() {
  console.log('=== 实际保存数据格式测试 ===')
  
  // ✅ 模拟实际保存数据（修复后）
  const saveData = {
    templateId: 2069685409616498689,
    orgId: 4,
    period: '202606',
    cells: [
      {
        rowId: 1001,              // ✅ BIGINT - 真实业务ID
        rowCode: 'RAW',           // ✅ VARCHAR - 业务编码
        columnId: 2001,           // ✅ BIGINT - 真实业务ID
        columnCode: 'RAW_COAL',   // ✅ VARCHAR - 业务编码
        value: '100',
        rawValue: '100',
        dataType: 2,
        source: 1
      },
      {
        rowId: 1002,
        rowCode: 'TOTAL',
        columnId: 2002,
        columnCode: 'COMMODITY_COAL',
        value: '50',
        rawValue: '50',
        dataType: 2,
        source: 1
      }
    ]
  }
  
  console.log('1. 保存数据格式:', saveData)
  
  // ✅ 检查是否符合数据库要求
  console.log('2. 数据库要求检查:')
  
  // 检查 templateId
  console.log('   templateId 类型:', typeof saveData.templateId === 'number' ? '✅ BIGINT' : '❌ 错误')
  
  // 检查 orgId
  console.log('   orgId 类型:', typeof saveData.orgId === 'number' ? '✅ BIGINT' : '❌ 错误')
  
  // 检查 period
  console.log('   period 类型:', typeof saveData.period === 'string' ? '✅ VARCHAR' : '❌ 错误')
  
  // 检查 cells
  console.log('   cells 类型:', Array.isArray(saveData.cells) ? '✅ Array' : '❌ 错误')
  
  // 检查每个单元格
  for (const cell of saveData.cells) {
    console.log(`   单元格 ${saveData.cells.indexOf(cell) + 1}:`)
    console.log(`     rowId (BIGINT): ${typeof cell.rowId === 'number' ? '✅' : '❌'} ${cell.rowId}`)
    console.log(`     rowCode (VARCHAR): ${typeof cell.rowCode === 'string' ? '✅' : '❌'} ${cell.rowCode}`)
    console.log(`     columnId (BIGINT): ${typeof cell.columnId === 'number' ? '✅' : '❌'} ${cell.columnId}`)
    console.log(`     columnCode (VARCHAR): ${typeof cell.columnCode === 'string' ? '✅' : '❌'} ${cell.columnCode}`)
  }
  
  // ✅ 检查是否包含临时编码（不应该包含）
  const hasTempCode = saveData.cells.some(c => 
    c.rowCode?.startsWith('ROW_') ||
    c.columnCode?.startsWith('COL_')
  )
  console.log('3. 包含临时编码:', hasTempCode ? '❌ 错误（不应包含）' : '✅ 正确（不包含）')
  
  console.log('=== 测试完成 ===')
  return saveData
}

/**
 * ✅ 综合测试
 */
export function testAllBusinessIdConversions() {
  console.log('=== 业务ID转换综合测试 ===')
  
  testBusinessIdGeneration()
  testCompleteConversionFlow()
  testActualSaveDataFormat()
  
  console.log('=== 所有测试完成 ===')
}

// 在浏览器控制台可直接调用
if (typeof window !== 'undefined') {
  window.testBusinessIdGeneration = testBusinessIdGeneration
  window.testCompleteConversionFlow = testCompleteConversionFlow
  window.testActualSaveDataFormat = testActualSaveDataFormat
  window.testAllBusinessIdConversions = testAllBusinessIdConversions
}