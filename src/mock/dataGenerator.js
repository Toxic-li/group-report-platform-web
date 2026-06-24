/**
 * Mock 数据生成器 - 集团统计报表平台
 * 
 * 生成内容：
 * - 10家子公司
 * - 煤炭生产销售与库存表完整结构（多级行头+多级列头）
 * - 100行指标 + 50列指标 = 5000+ 单元格
 */

import { ReportTemplate, ReportRow, ReportColumn, ReportValue, Subsidiary } from '@/types/report.js'

// ==================== 工具函数 ====================
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

function generateId(prefix = '') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// ==================== 子公司数据 ====================
export function generateSubsidiaries(count = 10) {
  const regions = [
    { name: '华北区', companies: ['大同煤矿集团', '阳泉煤业集团', '潞安矿业集团'] },
    { name: '华东区', companies: ['兖矿能源集团', '新汶矿业集团', '枣庄矿业集团', '淮南矿业集团'] },
    { name: '西北区', companies: ['陕煤化集团', '宁夏煤业集团', '神华宁煤集团'] }
  ]

  const statuses = ['draft', 'submitted', 'reviewing', 'returned', 'approved']
  const subsidiaries = []
  
  let idx = 0
  for (const region of regions) {
    for (const company of region.companies) {
      if (idx >= count) break
      const status = statuses[randomInt(0, Math.min(idx, 4))]
      subsidiaries.push(new Subsidiary({
        id: `sub_${String(idx + 1).padStart(3, '0')}`,
        name: company,
        code: `GS${String(200 + idx).padStart(4, '0')}`,
        region: region.name,
        status: status,
        submitTime: status !== 'draft' ? `2026-${randomInt(1, 6).toString().padStart(2, '0')}-${randomInt(1, 28).toString().padStart(2, '0')} ${randomInt(8, 17)}:${randomInt(0, 59).toString().padStart(2, '0')}` : null
      }))
      idx++
    }
  }

  // 补充到指定数量
  while (subsidiaries.length < count) {
    subsidiaries.push(new Subsidiary({
      id: `sub_${String(subsidiaries.length + 1).padStart(3, '0')}`,
      name: `子公司${subsidiaries.length + 1}`,
      code: `GS${String(200 + subsidiaries.length).padStart(4, '0')}`,
      region: '其他区域',
      status: 'draft'
    }))
  }

  return subsidiaries
}

// ==================== 列头结构 - 煤炭生产销售库存表 ====================
export function buildCoalReportColumns() {
  // === 第一级：本月 / 本月止累计 ===
  const colThisMonth = new ReportColumn({ id: 'col_month', title: '本月' })
  const colYTD = new ReportColumn({ id: 'col_ytd', title: '本月止累计' })

  // === 第二级：本月下的子列 ===
  const m_rawCoal = new ReportColumn({ id: 'm_raw_coal', title: '原煤产量', parentId: 'col_month' })
  const m_commodity = new ReportColumn({ id: 'm_commodity', title: '商品煤销量', parentId: 'col_month' })
  const m_selfUse = new ReportColumn({ id: 'm_self_use', title: '自用量', parentId: 'col_month' })
  const m_inventory = new ReportColumn({ id: 'm_inventory', title: '存煤', parentId: 'col_month' })

  // 商品煤销量 -> 合计/火车运量/公路运量
  const m_totalSales = new ReportColumn({ id: 'm_sales_total', title: '合计', parentId: 'm_commodity' })
  const m_trainShip = new ReportColumn({ id: 'm_train_ship', title: '火车运量', parentId: 'm_commodity' })
  const m_roadShip = new ReportColumn({ id: 'm_road_ship', title: '公路运量', parentId: 'm_commodity' })

  // 火车运量 -> 小计/省内/省外/车皮数
  const m_trainSubtotal = new ReportColumn({ id: 'm_train_sub', title: '小计', parentId: 'm_train_ship' })
  const m_trainInProvince = new ReportColumn({ id: 'm_train_in', title: '省内', parentId: 'm_train_ship' })
  const m_trainOutProvince = new ReportColumn({ id: 'm_train_out', title: '省外', parentId: 'm_train_ship' })
  const m_trainWagons = new ReportColumn({ id: 'm_train_wagons', title: '车皮数', parentId: 'm_train_ship' })

  // 公路运量 -> 小计/省内/省外
  const m_roadSubtotal = new ReportColumn({ id: 'm_road_sub', title: '小计', parentId: 'm_road_ship' })
  const m_roadInProvince = new ReportColumn({ id: 'm_road_in', title: '省内', parentId: 'm_road_ship' })
  const m_roadOutProvince = new ReportColumn({ id: 'm_road_out', title: '省外', parentId: 'm_road_ship' })

  // === 第二级：本月止累计下的子列（镜像结构）===
  const y_rawCoal = new ReportColumn({ id: 'y_raw_coal', title: '原煤产量', parentId: 'col_ytd' })
  const y_commodity = new ReportColumn({ id: 'y_commodity', title: '商品煤销量', parentId: 'col_ytd' })
  const y_selfUse = new ReportColumn({ id: 'y_self_use', title: '自用量', parentId: 'col_ytd' })
  const y_inventory = new ReportColumn({ id: 'y_inventory', title: '存煤', parentId: 'col_ytd' })

  const y_totalSales = new ReportColumn({ id: 'y_sales_total', title: '合计', parentId: 'y_commodity' })
  const y_trainShip = new ReportColumn({ id: 'y_train_ship', title: '火车运量', parentId: 'y_commodity' })
  const y_roadShip = new ReportColumn({ id: 'y_road_ship', title: '公路运量', parentId: 'y_commodity' })

  const y_trainSubtotal = new ReportColumn({ id: 'y_train_sub', title: '小计', parentId: 'y_train_ship' })
  const y_trainInProvince = new ReportColumn({ id: 'y_train_in', title: '省内', parentId: 'y_train_ship' })
  const y_trainOutProvince = new ReportColumn({ id: 'y_train_out', title: '省外', parentId: 'y_train_ship' })
  const y_trainWagons = new ReportColumn({ id: 'y_train_wagons', title: '车皮数', parentId: 'y_train_ship' })

  const y_roadSubtotal = new ReportColumn({ id: 'y_road_sub', title: '小计', parentId: 'y_road_ship' })
  const y_roadInProvince = new ReportColumn({ id: 'y_road_in', title: '省内', parentId: 'y_road_ship' })
  const y_roadOutProvince = new ReportColumn({ id: 'y_road_out', title: '省外', parentId: 'y_road_ship' })

  // 构建树形关系
  colThisMonth.children = [m_rawCoal, m_commodity, m_selfUse, m_inventory]
  m_commodity.children = [m_totalSales, m_trainShip, m_roadShip]
  m_trainShip.children = [m_trainSubtotal, m_trainInProvince, m_trainOutProvince, m_trainWagons]
  m_roadShip.children = [m_roadSubtotal, m_roadInProvince, m_roadOutProvince]

  colYTD.children = [y_rawCoal, y_commodity, y_selfUse, y_inventory]
  y_commodity.children = [y_totalSales, y_trainShip, y_roadShip]
  y_trainShip.children = [y_trainSubtotal, y_trainInProvince, y_trainOutProvince, y_trainWagons]
  y_roadShip.children = [y_roadSubtotal, y_roadInProvince, y_roadOutProvince]

  return [colThisMonth, colYTD]
}

// ==================== 行头结构 - 原煤分类 ====================
export function buildCoalReportRows() {
  // 第一级：原煤
  const rowRawCoal = new ReportRow({ id: 'row_raw_coal', name: '原煤', isSummary: true })

  // 第二级：合计、筛煤、混煤
  const rowTotal = new ReportRow({ id: 'row_total', name: '合计', parentId: 'row_raw_coal', isSummary: true })
  const rowScreened = new ReportRow({ id: 'row_screened', name: '筛煤', parentId: 'row_raw_coal' })
  const rowMixed = new ReportRow({ id: 'row_mixed', name: '混煤', parentId: 'row_raw_coal' })

  // 第三级：筛煤 -> 块煤、末煤
  const rowLump = new ReportRow({ id: 'row_lump', name: '块煤', parentId: 'row_screened' })
  const rowFines = new ReportRow({ id: 'row_fines', name: '末煤', parentId: 'row_screened' })

  // 第四级：块煤 -> 小计、中块
  const rowLumpSub = new ReportRow({ id: 'row_lump_sub', name: '小计', parentId: 'row_lump' })
  const rowMediumBlock = new ReportRow({ id: 'row_medium_block', name: '中块', parentId: 'row_lump' })

  // 第四级：末煤 -> 小计、晋控标末1号/2号/3号
  const rowFinesSub = new ReportRow({ id: 'row_fines_sub', name: '小计', parentId: 'row_fines' })
  const rowStdFines1 = new ReportRow({ id: 'row_std_fines1', name: '晋控标末1号', parentId: 'row_fines' })
  const rowStdFines2 = new ReportRow({ id: 'row_std_fines2', name: '晋控标末2号', parentId: 'row_fines' })
  const rowStdFines3 = new ReportRow({ id: 'row_std_fines3', name: '晋控标末3号', parentId: 'row_fines' })

  // 混煤 -> 小计、混煤产品
  const rowMixedSub = new ReportRow({ id: 'row_mixed_sub', name: '小计', parentId: 'row_mixed' })
  const rowMixedProduct = new ReportRow({ id: 'row_mixed_product', name: '混煤产品', parentId: 'row_mixed' })

  // 构建树形关系
  rowRawCoal.children = [rowTotal, rowScreened, rowMixed]
  rowScreened.children = [rowLump, rowFines]
  rowLump.children = [rowLumpSub, rowMediumBlock]
  rowFines.children = [rowFinesSub, rowStdFines1, rowStdFines2, rowStdFines3]
  rowMixed.children = [rowMixedSub, rowMixedProduct]

  return [rowRawCoal]
}

// ==================== 扩展行头至100行 ====================
export function buildExtendedRows(baseCount = 100) {
  const baseRows = buildCoalReportRows()
  const allRows = [...baseRows]

  // 扩展更多行指标类别
  const categories = [
    { name: '洗精煤', subItems: ['冶金焦精煤', '化工用精煤', '动力精煤'] },
    { name: '中煤', subItems: ['中煤产品A', '中煤产品B'] },
    { name: '煤泥', subItems: ['动力煤泥', '建材煤泥'] },
    { name: '矸石', subItems: ['洗矸', '手选矸'] },
    { name: '其他产品', subItems: ['煤焦油', '粗苯', '硫铵', '煤气'] },
    { name: '原煤入洗量', subItems: [] },
    { name: '洗煤回收率', subItems: ['综合回收率', '精煤回收率'] },
    { name: '商品煤质量', subItems: ['平均发热量', '平均灰分', '平均硫分', '平均水分', '挥发分'] },
    { name: '安全生产', subItems: ['原煤产量(万吨)', '掘进进尺(米)', '全员效率(吨/工)', '原煤成本(元/吨)', '安全天数'] },
    { name: '设备运行', subItems: ['综采设备开机率', '洗煤厂开机率', '铁路装车能力', '公路运输能力'] },
    { name: '环保指标', subItems: ['SO2排放量', 'NOx排放量', '粉尘排放量', '废水处理率', '固废利用率', '绿化覆盖率'] },
    { name: '经济效益', subItems: ['营业收入(万元)', '利润总额(万元)', '成本费用(万元)', '税费总额(万元)', '人均产值(万元)'] }
  ]

  let idx = allRows.length
  for (const cat of categories) {
    const catRow = new ReportRow({
      id: `row_ext_${idx}`,
      name: cat.name,
      isSummary: cat.subItems.length > 0
    })
    
    if (cat.subItems.length > 0) {
      for (const item of cat.subItems) {
        idx++
        const itemRow = new ReportRow({
          id: `row_ext_${idx}`,
          name: item,
          parentId: catRow.id
        })
        catRow.children.push(itemRow)
        allRows.push(itemRow)
      }
    }
    
    allRows.push(catRow)
    idx++
    
    if (allRows.length >= baseCount) break
  }

  // 补充剩余行到目标数量
  while (allRows.length < baseCount) {
    allRows.push(new ReportRow({
      id: `row_extra_${allRows.length}`,
      name: `指标项${allRows.length + 1}`
    }))
  }

  return allRows.slice(0, baseCount)
}

// ==================== 扩展列头至50列 ====================
export function buildExtendedColumns(targetCount = 50) {
  const baseCols = buildCoalReportColumns()
  const flatBaseCols = flattenColumns(baseCols)

  // 额外的分析维度列
  const extraCategories = [
    { title: '同比', items: ['同比增长量', '同比增长率'] },
    { title: '环比', items: ['环比增长量', '环比增长率'] },
    { title: '年度计划', items: ['计划值', '完成进度', '偏差'] },
    { title: '预算对比', items: ['预算值', '超支/节约', '执行率'] },
    { title: '历史同期', items: ['去年同期', '近三年均值', '历史最高', '历史最低'] }
  ]

  let extraIdx = flatBaseCols.length
  const extraCols = []

  for (const cat of extraCategories) {
    const parentCol = new ReportColumn({
      id: `col_extra_${extraIdx}`,
      title: cat.title
    })
    
    for (const item of cat.items) {
      extraIdx++
      extraCols.push(new ReportColumn({
        id: `col_extra_${extraIdx}`,
        title: item,
        parentId: parentCol.id
      }))
    }
    parentCol.children = extraCols.slice(-(cat.items.length))
    extraCols.push(parentCol)
    extraIdx++
    
    if (flatBaseCols.length + extraCols.length >= targetCount) break
  }

  // 补充剩余列
  while (flatBaseCols.length + extraCols.length < targetCount) {
    extraCols.push(new ReportColumn({
      id: `col_add_${flatBaseCols.length + extraCols.length}`,
      title: `分析维度${flatBaseCols.length + extraCols.length + 1}`
    }))
  }

  return [...baseCols, ...extraCols.slice(0, targetCount - flatBaseCols.length)]
}

function flattenColumns(cols) {
  const result = []
  const traverse = (items) => {
    for (const col of items) {
      result.push(col)
      if (col.children && col.children.length > 0) {
        traverse(col.children)
      }
    }
  }
  traverse(cols)
  return result
}

// ==================== 生成单元格数据 ====================
export function generateCellData(rows, columns, subsidiaryId = null) {
  const values = []
  const formulas = {}

  // 获取所有叶子节点行和列
  const leafRows = getLeafRows(rows)
  const leafColumns = getLeafColumns(columns)

  for (const row of leafRows) {
    for (const col of leafColumns) {
      const value = generateRealisticValue(row.name, col.title)
      
      values.push(new ReportValue({
        rowId: row.id,
        columnId: col.id,
        value: value.value,
        formula: value.formula,
        readOnly: value.readOnly,
        format: value.format
      }))

      if (value.formulaKey) {
        formulas[value.formulaKey] = value.formula
      }
    }
  }

  return { values, formulas }
}

function getLeafRows(rows) {
  const leaves = []
  const traverse = (items) => {
    for (const row of items) {
      if (!row.children || row.children.length === 0) {
        leaves.push(row)
      } else {
        traverse(row.children)
      }
    }
  }
  traverse(rows)
  return leaves
}

function getLeafColumns(columns) {
  const leaves = []
  const traverse = (items) => {
    for (const col of items) {
      if (!col.children || col.children.length === 0) {
        leaves.push(col)
      } else {
        traverse(col.children)
      }
    }
  }
  traverse(columns)
  return leaves
}

function generateRealisticValue(rowName, colTitle) {
  // 根据行列名称智能生成合理数值
  const isQuantity = /产量|销量|运量|用量|库存|存煤/.test(colTitle) && !/(率|%|增长)/.test(colTitle)
  const isRate = /率|%|占比|进度/.test(colTitle)
  const isMoney = /收入|成本|利润|费用|产值|金额/.test(colTitle)
  const isRatio = /同比|环比|偏差|比率/.test(colTitle)

  if (isRate || isRatio) {
    return {
      value: randomFloat(-15, 25, 2),
      readOnly: false,
      format: 'percent',
      formula: null,
      formulaKey: null
    }
  }

  if (isMoney) {
    return {
      value: randomFloat(100, 99999, 2),
      readOnly: false,
      format: 'thousands',
      formula: null,
      formulaKey: null
    }
  }

  if (isQuantity) {
    // 产量类数据：较大数值
    const baseValue = randomFloat(10, 50000, 2)
    return {
      value: baseValue,
      readOnly: false,
      format: 'number',
      formula: null,
      formulaKey: null
    }
  }

  // 默认数值
  return {
    value: randomFloat(0, 1000, 2),
    readOnly: false,
    format: 'number',
    formula: null,
    formulaKey: null
  }
}

// ==================== 构建完整报表模板 ====================
export function buildFullReportTemplate() {
  const rows = buildExtendedRows(100)
  const columns = buildExtendedColumns(50)
  const { values, formulas } = generateCellData(rows, columns)

  const template = new ReportTemplate({
    id: 'tpl_coal_001',
    name: '煤炭生产销售与库存统计表',
    code: '205-1',
    period: '2026年第5期',
    rows: rows,
    columns: columns,
    values: values
  })

  template.formulas = formulas

  return template
}

// ==================== 集团汇总表 ====================
export function generateGroupConsolidation(subsidiaries, template) {
  const consolidatedValues = []

  // 对每个单元格，汇总所有子公司的值
  const leafCols = getLeafColumns(template.columns)
  const leafRows = getLeafRows(template.rows)

  for (const row of leafRows) {
    for (const col of leafCols) {
      let total = 0
      let count = 0

      // 模拟汇总计算
      for (let i = 0; i < subsidiaries.length; i++) {
        total += randomFloat(0, 100, 2)
        count++
      }

      consolidatedValues.push(new ReportValue({
        rowId: row.id,
        columnId: col.id,
        value: parseFloat((total / Math.max(count, 1)).toFixed(2)),
        readOnly: true,
        format: 'number'
      }))
    }
  }

  return {
    ...template,
    id: 'tpl_group_consolidated',
    name: '集团汇总表 - 煤炭生产销售与库存',
    values: consolidatedValues
  }
}
