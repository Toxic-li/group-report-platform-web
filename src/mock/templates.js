/**
 * 模板配置示例 - 5张完整报表模板
 *
 * 使用方式：
 *   1. 初始化时调用 initTemplates() 将这些模板注册到 TemplateManager
 *   2. 通过 /report/:templateId 路由访问
 *   3. 新增报表只需在此文件中添加新的模板配置
 *
 * 报表清单：
 *   1001 - 煤炭生产销售库存表（production）
 *   1002 - 经营指标月报（finance）
 *   1003 - 安全生产统计表（safety）
 *   1004 - 能源消耗统计表（energy）
 *   1005 - 成本费用分析表（cost）
 */

import { ReportTemplate, ReportRow, ReportColumn, FormulaConfig, ValidatorConfig, ValidationRule, AggregateConfig, ConditionalFormatRule } from '../types/engine.js'

// ==================== 工具函数 ====================
function rid(prefix, idx) { return `${prefix}_${idx}` }
function cid(prefix, idx) { return `${prefix}_${idx}` }

function makeRow(id, name, opts = {}) {
  return new ReportRow({ id, name, ...opts })
}

function makeCol(id, title, opts = {}) {
  return new ReportColumn({ id, title, ...opts })
}

// ==================== 模板1: 煤炭生产销售库存表 ====================
export function buildTemplate_1001() {
  // === 行树：原煤分类（4级深度） ===
  const rowRawCoal = makeRow('r_raw', '原煤', { isSummary: true })
  const rowTotal = makeRow('r_total', '合计', { parentId: rowRawCoal.id, isSummary: true, summaryType: 'total' })
  const rowScreened = makeRow('r_screened', '筛煤', { parentId: rowRawCoal.id })
  const rowMixed = makeRow('r_mixed', '混煤', { parentId: rowRawCoal.id })

  const rowLump = makeRow('r_lump', '块煤', { parentId: rowScreened.id })
  const rowFines = makeRow('r_fines', '末煤', { parentId: rowScreened.id })

  const rowLumpSub = makeRow('r_lump_sub', '小计', { parentId: rowLump.id, isSummary: true, summaryType: 'subtotal' })
  const rowMediumBlock = makeRow('r_medium_block', '中块', { parentId: rowLump.id })

  const rowFinesSub = makeRow('r_fines_sub', '小计', { parentId: rowFines.id, isSummary: true, summaryType: 'subtotal' })
  const rowStdFines1 = makeRow('r_std_fines1', '晋控标末1号', { parentId: rowFines.id })
  const rowStdFines2 = makeRow('r_std_fines2', '晋控标末2号', { parentId: rowFines.id })

  const rowMixedSub = makeRow('r_mixed_sub', '小计', { parentId: rowMixed.id, isSummary: true, summaryType: 'subtotal' })
  const rowMixedProduct = makeRow('r_mixed_product', '混煤产品', { parentId: rowMixed.id })

  rowRawCoal.children = [rowTotal, rowScreened, rowMixed]
  rowScreened.children = [rowLump, rowFines]
  rowLump.children = [rowLumpSub, rowMediumBlock]
  rowFines.children = [rowFinesSub, rowStdFines1, rowStdFines2]
  rowMixed.children = [rowMixedSub, rowMixedProduct]

  // 扩展到50行
  const extraRows = [
    { name: '洗精煤', children: ['冶金焦精煤', '化工用精煤', '动力精煤'] },
    { name: '中煤', children: ['中煤产品A', '中煤产品B'] },
    { name: '煤泥', children: ['动力煤泥', '建材煤泥'] },
    { name: '矸石', children: ['洗矸', '手选矸'] },
    { name: '原煤入洗量', children: [] },
    { name: '洗煤回收率', children: ['综合回收率', '精煤回收率'] },
    { name: '商品煤质量', children: ['平均发热量', '平均灰分', '平均硫分', '平均水分', '挥发分'] },
    { name: '安全生产', children: ['原煤产量(万吨)', '掘进进尺(米)', '全员效率(吨/工)', '安全天数'] },
    { name: '设备运行', children: ['综采开机率', '洗煤厂开机率', '铁路装车能力'] },
    { name: '环保指标', children: ['SO2排放量', 'NOx排放量', '粉尘排放量', '废水处理率', '固废利用率'] }
  ]

  let extIdx = 20
  for (const cat of extraRows) {
    const catRow = makeRow(rid('ext', extIdx++), cat.name, { isSummary: cat.children.length > 0 })
    if (cat.children.length > 0) {
      catRow.children = cat.children.map(name => makeRow(rid('ext', extIdx++), name, { parentId: catRow.id }))
    }
    rowRawCoal.children.push(catRow)
  }

  // === 列树：简化为2级结构 ===
  // 一级：时间维度（本月 / 本月止累计）
  // 二级：指标维度（扁平叶子列）

  const colMonth = makeCol('c_month', '本月')
  const colYTD = makeCol('c_ytd', '本月止累计')

  // 本月 - 扁平指标列（无子节点嵌套）
  colMonth.children = [
    makeCol('m_raw_coal', '原煤产量', { format: 'number' }),
    makeCol('m_commodity', '商品煤销量', { format: 'number' }),
    makeCol('m_self_use', '自用量', { format: 'number' }),
    makeCol('m_inventory', '库存量', { format: 'number' }),
    makeCol('m_train_in', '火车运量-省内', { format: 'number' }),
    makeCol('m_train_out', '火车运量-省外', { format: 'number' }),
    makeCol('m_road_in', '公路运量-省内', { format: 'number' }),
    makeCol('m_road_out', '公路运量-省外', { format: 'number' })
  ]

  // 本月止累计 - 镜像结构
  colYTD.children = [
    makeCol('y_raw_coal', '原煤产量', { format: 'number' }),
    makeCol('y_commodity', '商品煤销量', { format: 'number' }),
    makeCol('y_self_use', '自用量', { format: 'number' }),
    makeCol('y_inventory', '库存量', { format: 'number' }),
    makeCol('y_train_in', '火车运量-省内', { format: 'number' }),
    makeCol('y_train_out', '火车运量-省外', { format: 'number' }),
    makeCol('y_road_in', '公路运量-省内', { format: 'number' }),
    makeCol('y_road_out', '公路运量-省外', { format: 'number' })
  ]

  // === 公式配置（行级别汇总，非列级别） ===
  const formulas = [
    new FormulaConfig({
      id: 'f_commodity_total', targetCell: 'm_commodity',
      expression: '=SUM(m_train_in,m_train_out,m_road_in,m_road_out)',
      description: '商品煤销量=火车+公路运量合计'
    })
  ]

  // === 校验规则 ===
  const validators = [
    new ValidatorConfig({
      id: 'v_production', scope: 'column', targetType: 'column', targetId: 'm_raw_coal',
      rules: [
        new ValidationRule({ type: 'nonNegative', message: '产量不能为负数' }),
        new ValidationRule({ type: 'required', message: '请填写产量数据' })
      ]
    }),
    new ValidatorConfig({
      id: 'v_inventory', scope: 'column', targetType: 'column', targetId: 'm_inventory',
      rules: [
        new ValidationRule({ type: 'range', message: '库存超出安全范围', params: { min: 0, max: 500000 } })
      ]
    })
  ]

  // === 汇总规则 ===
  const aggregates = [
    new AggregateConfig({
      id: 'agg_screened', sourceRowIds: [rowLump.id, rowFines.id],
      targetRowId: rowScreened.id, method: 'sum', label: '筛煤汇总'
    }),
    new AggregateConfig({
      id: 'agg_lump', sourceRowIds: [rowLumpSub.id, rowMediumBlock.id],
      targetRowId: rowLump.id, method: 'sum', label: '块煤汇总'
    }),
    new AggregateConfig({
      id: 'agg_fines', sourceRowIds: [rowFinesSub.id, rowStdFines1.id, rowStdFines2.id],
      targetRowId: rowFines.id, method: 'sum', label: '末煤汇总'
    }),
    new AggregateConfig({
      id: 'agg_total', sourceRowIds: [rowScreened.id, rowMixed.id],
      targetRowId: rowTotal.id, method: 'sum', label: '原煤合计'
    })
  ]

  // === 条件格式 ===
  const conditionalFormats = [
    new ConditionalFormatRule({
      id: 'cf_inv_warn', targetType: 'column', targetId: 'm_inventory',
      condition: 'greaterThan', value1: 50000,
      style: { className: 'fr-anomaly-val', backgroundColor: '#FEF2F2', color: '#DC2626' }
    })
  ]

  return new ReportTemplate({
    id: '1001', code: 'RPT-COAL-001', name: '煤炭生产销售与库存统计表',
    description: '集团煤炭生产、销售、库存全口径统计，含火车/公路分渠道明细',
    version: '2.0.0', status: 'published', templateType: 2, category: 'production', periodType: 'monthly',
    rowTree: [rowRawCoal],
    columnTree: [colMonth, colYTD],
    formulas, validators, aggregates, conditionalFormats
  })
}

// ==================== 模板2: 经营指标月报 ====================
export function buildTemplate_1002() {
  const rows = [
    makeRow('r_rev', '营业收入', { isSummary: true }, [
      makeRow('r_rev_main', '主营业务收入'),
      makeRow('r_rev_other', '其他业务收入')
    ]),
    makeRow('r_cost', '成本费用', { isSummary: true }, [
      makeRow('r_cost_prod', '生产成本'),
      makeRow('r_cost_mgmt', '管理费用'),
      makeRow('r_cost_sale', '销售费用'),
      makeRow('r_cost_finance', '财务费用')
    ]),
    makeRow('r_profit', '利润总额', { isSummary: true }),
    makeRow('r_net_profit', '净利润'),
    makeRow('r_tax', '应交税费'),
    makeRow('r_assets', '资产总额'),
    makeRow('r_liab', '负债总额'),
    makeRow('r_equity', '所有者权益'),
    makeRow('r_roe', '净资产收益率'),
    makeRow('r_ros', '销售利润率'),
    makeRow('r_turnover', '总资产周转率'),
    makeRow('r_cash_flow', '经营性现金流')
  ].flatMap(r => r.children ? [r] : [r])

  const cols = [
    makeCol('c_item', '指标项目', { width: 160 }),
    makeCol('c_this_month', '本月完成'),
    makeCol('c_ytd', '本年累计'),
    makeCol('c_plan', '年度计划'),
    makeCol('c_progress', '完成进度', { format: 'percent' }),
    makeCol('c_yoy_val', '同比增减'),
    makeCol('c_yoy_rate', '同比增长率', { format: 'percent' }),
    makeCol('c_budget_diff', '预算偏差')
  ]

  const formulas = [
    new FormulaConfig({ id: 'f_progress', targetCell: 'c_progress', expression: '=IF(c_plan>0,c_ytd/c_plan*100,0)', description: '完成进度=累计/计划*100%' }),
    new FormulaConfig({ id: 'f_yoy_rate', targetCell: 'c_yoy_rate', expression: '=IF(c_yoy_val>0,(c_this_month-c_yoy_val)/c_yoy_val*100,0)', description: '同比增长率=(本期-同期)/同期*100%' })
  ]

  const validators = [
    new ValidatorConfig({ id: 'v_percent', scope: 'column', targetType: 'column', targetId: 'c_progress',
      rules: [new ValidationRule({ type: 'percentRange', message: '进度应在 0%~500% 之间', params: { min: 0, max: 500 } })] })
  ]

  const aggregates = []

  return new ReportTemplate({
    id: '1002', code: 'RPT-FIN-001', name: '经营指标月报',
    description: '集团核心经营指标跟踪，含收入/成本/利润/资产负债/现金流',
    version: '1.5.0', status: 'published', templateType: 2, category: 'finance', periodType: 'monthly',
    rowTree: rows, columnTree: cols, formulas, validators, aggregates
  })
}

// ==================== 模板3: 安全生产统计表 ====================
export function buildTemplate_1003() {
  const rows = [
    makeRow('r_safety_days', '安全生产天数', { isSummary: false }),
    makeRow('r_accidents', '安全事故统计', { isSummary: true }, [
      makeRow('r_acc_total', '事故总数'),
      makeRow('r_acc_fatal', '死亡事故'),
      makeRow('r_acc_serious', '重伤事故'),
      makeRow('r_acc_minor', '轻伤事故')
    ]),
    makeRow('r_inspection', '安全检查', { isSummary: true }, [
      makeRow('r_insp_total', '检查次数'),
      makeRow('r_insp_hidden', '查出隐患'),
      makeRow('r_insp_fixed', '已整改'),
      makeRow('r_insp_pending', '待整改')
    ]),
    makeRow('r_training', '安全培训', { isSummary: true }, [
      makeRow('r_train_sessions', '培训场次'),
      makeRow('r_train_people', '培训人次'),
      makeRow('r_train_hours', '培训学时')
    ]),
    makeRow('r_equipment', '安全设备', { isSummary: true }, [
      makeRow('r_eq_monitor', '监测设备完好率', { isSummary: false }),
      makeRow('r_eq_alarm', '报警系统正常率', { isSummary: false })
    ])
  ].flatMap(r => r.children ? [r] : [r])

  const cols = [
    makeCol('c_item', '安全指标', { width: 140 }),
    makeCol('c_target', '目标值'),
    makeCol('c_actual', '实际值'),
    makeCol('c_completion', '完成率', { format: 'percent' }),
    makeCol('c_yoy', '同比变化', { format: 'percent' }),
    makeCol('c_rank', '集团排名'),
    makeCol('c_remark', '备注', { align: 'left', width: 200 })
  ]

  const formulas = [
    new FormulaConfig({ id: 'f_completion', targetCell: 'c_completion', expression: '=IF(c_target>0,c_actual/c_target*100,0)' })
  ]

  const validators = [
    new ValidatorConfig({ id: 'v_safety', scope: 'column', targetType: 'column', targetId: 'c_actual',
      rules: [new ValidationRule({ type: 'nonNegative', message: '安全指标不能为负数' })] })
  ]

  return new ReportTemplate({
    id: '1003', code: 'RPT-SAFE-001', name: '安全生产统计表',
    description: '集团安全生产核心指标统计与考核',
    version: '1.2.0', status: 'published', templateType: 1, category: 'safety', periodType: 'monthly',
    rowTree: rows, columnTree: cols, formulas, validators
  })
}

// ==================== 模板4: 能源消耗统计表 ====================
export function buildTemplate_1004() {
  const rows = [
    makeRow('r_elec', '电力消耗', { isSummary: true }, [
      makeRow('r_elec_prod', '生产用电'),
      makeRow('r_elec_aux', '辅助用电'),
      makeRow('r_elec_office', '办公用电')
    ]),
    makeRow('r_water', '水资源消耗', { isSummary: true }, [
      makeRow('r_water_prod', '生产用水'),
      makeRow('r_water_cool', '冷却用水'),
      makeRow('r_water_life', '生活用水')
    ]),
    makeRow('r_gas', '燃气消耗'),
    makeRow('r_coal', '煤炭自用'),
    makeRow('r_diesel', '柴油消耗'),
    makeRow('r_total', '综合能耗（标煤）', { isSummary: true }),
    makeRow('r_intensity', '万元产值能耗'),
    makeRow('r_save_rate', '节能率', { isSummary: false })
  ].flatMap(r => r.children ? [r] : [r])

  const cols = [
    makeCol('c_item', '能源指标', { width: 150 }),
    makeCol('c_unit', '单位'),
    makeCol('c_plan', '计划量'),
    makeCol('c_actual', '实际量'),
    makeCol('c_last_year', '去年同期'),
    makeCol('c_save', '节约量'),
    makeCol('c_save_rate', '节约率', { format: 'percent' }),
    makeCol('c_cost', '金额(万元)', { format: 'thousands' })
  ]

  const formulas = [
    new FormulaConfig({ id: 'f_save', targetCell: 'c_save', expression: '=c_plan-c_actual', description: '节约量=计划-实际' }),
    new FormulaConfig({ id: 'f_save_rate', targetCell: 'c_save_rate', expression: '=IF(c_plan>0,c_save/c_plan*100,0)', description: '节约率=节约/计划*100%' })
  ]

  return new ReportTemplate({
    id: '1004', code: 'RPT-ENERGY-001', name: '能源消耗统计表',
    description: '集团各类能源消耗统计与节能分析',
    version: '1.0.0', status: 'published', templateType: 3, category: 'energy', periodType: 'monthly',
    rowTree: rows, columnTree: cols, formulas
  })
}

// ==================== 模板5: 成本费用分析表 ====================
export function buildTemplate_1005() {
  const rows = [
    makeRow('r_material', '材料成本', { isSummary: true }, [
      makeRow('r_mat_raw', '原材料'),
      makeRow('r_mat_aux', '辅助材料'),
      makeRow('r_mat_power', '燃料动力')
    ]),
    makeRow('r_labor', '人工成本', { isSummary: true }, [
      makeRow('r_lab_wage', '工资薪酬'),
      makeRow('r_lab_social', '社保公积金'),
      makeRow('r_lab_welfare', '福利费用')
    ]),
    makeRow('r_manufacture', '制造费用', { isSummary: true }, [
      makeRow('r_mf_depreciation', '折旧费'),
      makeRow('r_mf_repair', '修理费'),
      makeRow('r_mf_other', '其他制造费')
    ]),
    makeRow('r_period', '期间费用', { isSummary: true }, [
      makeRow('r_pd_mgmt', '管理费用'),
      makeRow('r_pd_sale', '销售费用'),
      makeRow('r_pd_finance', '财务费用')
    ]),
    makeRow('r_total_cost', '总成本', { isSummary: true }),
    makeRow('r_unit_cost', '单位成本'),
    makeRow('r_cost_ratio', '成本费用利润率', { isSummary: false })
  ].flatMap(r => r.children ? [r] : [r])

  const cols = [
    makeCol('c_item', '成本项目', { width: 150 }),
    makeCol('c_budget', '预算(万)'),
    makeCol('c_actual', '实际(万)'),
    makeCol('c_variance', '差异(万)'),
    makeCol('c_var_rate', '差异率', { format: 'percent' }),
    makeCol('c_yoy', '同比%', { format: 'percent' }),
    makeCol('c_weight', '占比', { format: 'percent' }),
    makeCol('c_analysis', '分析说明', { align: 'left', width: 200 })
  ]

  const formulas = [
    new FormulaConfig({ id: 'f_var', targetCell: 'c_variance', expression: '=c_actual-c_budget' }),
    new FormulaConfig({ id: 'f_var_rate', targetCell: 'c_var_rate', expression: '=IF(c_budget<>0,c_variance/c_budget*100,0)' })
  ]

  return new ReportTemplate({
    id: '1005', code: 'RPT-COST-001', name: '成本费用分析表',
    description: '集团成本构成分析、预算执行对比',
    version: '1.0.0', status: 'draft', templateType: 2, category: 'cost', periodType: 'monthly',
    rowTree: rows, columnTree: cols, formulas
  })
}

// ==================== 初始化入口 ====================

/** 所有内置模板构建函数 */
const TEMPLATE_BUILDERS = {
  '1001': buildTemplate_1001,
  '1002': buildTemplate_1002,
  '1003': buildTemplate_1003,
  '1004': buildTemplate_1004,
  '1005': buildTemplate_1005
}

/**
 * 初始化所有模板到 TemplateManager
 * 在应用启动时调用一次即可
 */
export function initTemplates(templateManager) {
  for (const [id, builder] of Object.entries(TEMPLATE_BUILDERS)) {
    const existing = templateManager.get(id)
    if (!existing) {
      templateManager.create(builder())
    }
  }
}

/**
 * 获取所有可用模板的元信息列表（用于导航菜单）
 */
export function getTemplateList() {
  return [
    { id: '1001', name: '煤炭生产销售与库存统计表', code: 'RPT-COAL-001', category: 'production', icon: '📊', templateType: 2, status: 'published' },
    { id: '1002', name: '经营指标月报', code: 'RPT-FIN-001', category: 'finance', icon: '💰', templateType: 2, status: 'published' },
    { id: '1003', name: '安全生产统计表', code: 'RPT-SAFE-001', category: 'safety', icon: '🛡️', templateType: 1, status: 'published' },
    { id: '1004', name: '能源消耗统计表', code: 'RPT-ENERGY-001', category: 'energy', icon: '⚡', templateType: 3, status: 'published' },
    { id: '1005', name: '成本费用分析表', code: 'RPT-COST-001', category: 'cost', icon: '📋', templateType: 2, status: 'draft' }
  ]
}
