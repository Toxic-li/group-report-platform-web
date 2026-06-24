/**
 * 低代码报表设计器 V2 - 标准JSON模板库
 *
 * 所有模板为纯JSON格式，零代码驱动
 * 可直接传输给后端引擎执行
 *
 * 模板清单：
 *   1001 - 煤炭生产销售库存表
 *   1002 - 经营指标月报
 *   1003 - 安全生产统计表
 */

const TEMPLATES_V2 = {

  // ==================== 模板1: 煤炭生产销售库存表 ====================
  "RPT-COAL-001": {
    "id": "1001",
    "name": "煤炭生产销售库存表",
    "code": "RPT-COAL-001",
    "version": 2,
    "status": "published",
    "description": "集团煤炭生产、销售、库存、运输全链路统计报表",
    "category": "production",
    "tags": ["煤炭", "生产", "月报"],
    "icon": "⛏️",

    "layout": {
      "type": "table",
      "frozenRows": 4,
      "frozenCols": 1,
      "showRowNumbers": true,
      "rowHeight": 32,
      "defaultAlign": "right",
      "stripeRows": true,
      "density": "normal"
    },

    // === 行树：产品分类（4级深度） ===
    "rowTree": [
      {
        "id": "r_raw",
        "name": "原煤",
        "level": 0,
        "isSummary": true,
        "expanded": true,
        "children": [
          { "id": "r_total", "name": "合计", "level": 1, "isSummary": true, "summaryType": "total" },
          {
            "id": "r_screened",
            "name": "筛煤",
            "level": 1,
            "expanded": true,
            "children": [
              {
                "id": "r_lump",
                "name": "块煤",
                "level": 2,
                "expanded": true,
                "children": [
                  { "id": "r_lump_sub", "name": "小计", "level": 3, "isSummary": true, "summaryType": "subtotal" },
                  { "id": "r_medium_block", "name": "中块", "level": 3 }
                ]
              },
              {
                "id": "r_fines",
                "name": "末煤",
                "level": 2,
                "expanded": true,
                "children": [
                  { "id": "r_fines_sub", "name": "小计", "level": 3, "isSummary": true, "summaryType": "subtotal" },
                  { "id": "r_std_fines1", "name": "晋控标末1号", "level": 3 },
                  { "id": "r_std_fines2", "name": "晋控标末2号", "level": 3 }
                ]
              }
            ]
          },
          {
            "id": "r_mixed",
            "name": "混煤",
            "level": 1,
            "expanded": true,
            "children": [
              { "id": "r_mixed_sub", "name": "小计", "level": 2, "isSummary": true, "summaryType": "subtotal" },
              { "id": "r_mixed_product", "name": "混煤产品", "level": 2 }
            ]
          },
          { "id": "r_washed", "name": "洗精煤", "level": 1, "expandable": false },
          { "id": "r_middlings", "name": "中煤", "level": 1, "expandable": false },
          { "id": "r_slime", "name": "煤泥", "level": 1, "expandable": false },
          { "id": "r_gangue", "name": "矸石", "level": 1, "expandable": false },
          { "id": "r_wash_input", "name": "原煤入洗量", "level": 1, "expandable": false },
          { "id": "r_wash_rate", "name": "洗煤回收率", "level": 1, "isSummary": true }
        ]
      },

      // === 扩展行（扁平结构） ===
      { "id": "r_quality", "name": "商品煤质量", "level": 0, "expandable": false },
      { "id": "r_safety", "name": "安全生产", "level": 0, "expandable": false },
      { "id": "r_equipment", "name": "设备运行", "level": 0, "expandable": false },
      { "id": "r_env", "name": "环保指标", "level": 0, "expandable": false }
    ],

    // === 列树：时间 × 指标（2级） ===
    "columnTree": [
      {
        "id": "c_month",
        "title": "本月",
        "level": 0,
        "expanded": true,
        "children": [
          { "id": "m_raw_coal", "title": "原煤产量", "type": "data", "format": "number", "unit": "万吨" },
          { "id": "m_commodity", "title": "商品煤销量", "type": "data", "format": "number", "unit": "万吨" },
          { "id": "m_self_use", "title": "自用量", "type": "data", "format": "number", "unit": "万吨" },
          { "id": "m_inventory", "title": "库存量", "type": "data", "format": "number", "unit": "万吨" },
          { "id": "m_train_in", "title": "火车运量-省内", "type": "data", "format": "number", "unit": "万吨" },
          { "id": "m_train_out", "title": "火车运量-省外", "type": "data", "format": "number", "unit": "万吨" },
          { "id": "m_road_in", "title": "公路运量-省内", "type": "data", "format": "number", "unit": "万吨" },
          { "id": "m_road_out", "title": "公路运量-省外", "type": "data", "format": "number", "unit": "万吨" }
        ]
      },
      {
        "id": "c_ytd",
        "title": "本月止累计",
        "level": 0,
        "expanded": true,
        "children": [
          { "id": "ytd_raw_coal", "title": "原煤产量", "type": "data", "format": "number", "unit": "万吨" },
          { "id": "ytd_commodity", "title": "商品煤销量", "type": "data", "format": "number", "unit": "万吨" },
          { "id": "ytd_self_use", "title": "自用量", "type": "data", "format": "number", "unit": "万吨" },
          { "id": "ytd_inventory", "title": "库存量", "type": "data", "format": "number", "unit": "万吨" },
          { "id": "ytd_train_in", "title": "火车运量-省内", "type": "data", "format": "number", "unit": "万吨" },
          { "id": "ytd_train_out", "title": "火车运量-省外", "type": "data", "format": "number", "unit": "万吨" },
          { "id": "ytd_road_in", "title": "公路运量-省内", "type": "data", "format": "number", "unit": "万吨" },
          { "id": "ytd_road_out", "title": "公路运量-省外", "type": "data", "format": "number", "unit": "万吨" }
        ]
      },
      {
        "id": "c_yoy",
        "title": "同比(%)",
        "level": 0,
        "expanded": true,
        "children": [
          { "id": "yoy_raw_coal", "title": "原煤产量", "type": "derived", "format": "percent", "decimals": 1 },
          { "id": "yoy_commodity", "title": "商品煤销量", "type": "derived", "format": "percent", "decimals": 1 },
          { "id": "yoy_self_use", "title": "自用量", "type": "derived", "format": "percent", "decimals": 1 },
          { "id": "yoy_inventory", "title": "库存量", "type": "derived", "format": "percent", "decimals": 1 },
          { "id": "yoy_train_in", "title": "火车运量-省内", "type": "derived", "format": "percent", "decimals": 1 },
          { "id": "yoy_train_out", "title": "火车运量-省外", "type": "derived", "format": "percent", "decimals": 1 },
          { "id": "yoy_road_in", "title": "公路运量-省内", "type": "derived", "format": "percent", "decimals": 1 },
          { "id": "yoy_road_out", "title": "公路运量-省外", "type": "derived", "format": "percent", "decimals": 1 }
        ]
      }
    ],

    // === 计算公式（后端就绪） ===
    "metrics": [
      {
        "field": "completionRate",
        "label": "完成率",
        "expression": "m_raw_coal / m_commodity * 100",
        "type": "percent",
        "description": "原煤产量完成率 = 实际产量 / 计划销量 × 100%",
        "group": "效率指标",
        "order": 1
      },
      {
        "field": "salesRate",
        "label": "产销率",
        "expression": "m_commodity / m_raw_coal * 100",
        "type": "percent",
        "description": "商品煤转化率",
        "group": "效率指标",
        "order": 2
      },
      {
        "field": "inventoryTurnover",
        "label": "库存周转天数",
        "expression": "m_inventory / (m_commodity / 30)",
        "type": "number",
        "unit": "天",
        "group": "运营指标",
        "order": 3
      }
    ],

    // === 聚合规则 ===
    "aggregates": [
      {
        "id": "agg_row_total",
        "target": { "type": "row", "id": "r_total" },
        "scope": "siblings",
        "function": "sum",
        "sourceField": "*",
        "label": "合计"
      },
      {
        "id": "agg_sub_lump",
        "target": { "type": "row", "id": "r_lump_sub" },
        "scope": "siblings",
        "function": "sum",
        "sourceField": "*",
        "label": "块煤小计"
      }
    ],

    // === 校验规则 ===
    "validators": [
      {
        "id": "val_positive",
        "name": "数值非负校验",
        "scope": "cell",
        "targetType": "pattern",
        "targetId": "*产量|*销量|*运量|*库存",
        "rules": [
          { "type": "nonNegative", "message": "${colTitle}不能为负数", "severity": "error", "trigger": "change" }
        ]
      },
      {
        "id": "val_percent_range",
        "name": "百分比范围校验",
        "scope": "cell",
        "targetType": "pattern",
        "targetId": "*率|*比|同比*",
        "rules": [
          { "type": "range", "params": { "min": -999, "max": 9999 }, "message": "${colTitle}应在合理范围内", "severity": "warning", "trigger": "blur" }
        ]
      }
    ],

    // === 条件格式 ===
    "conditionalFormats": [
      {
        "id": "cf_anomaly_high",
        "name": "高值异常标记",
        "scope": "cell",
        "targetType": "pattern",
        "targetId": "*库存",
        "conditions": [{ "operator": "gt", "value": 50000 }],
        "format": { "backgroundColor": "#FEE2E2", "color": "#DC2626", "fontWeight": "bold" },
        "priority": 1
      },
      {
        "id": "cf_negative_growth",
        "name": "负增长标记",
        "scope": "cell",
        "targetType": "pattern",
        "targetId": "同比*",
        "conditions": [{ "operator": "lt", "value": 0 }],
        "format": { "backgroundColor": "#FEF3C7", "color": "#D97706" },
        "priority": 2
      }
    ],

    // === 数据源配置 ===
    "dataSource": {
      "type": "mock",
      "sourceId": "ds_coal_production",
      "name": "煤炭生产模拟数据",
      "refreshInterval": 0,
      "cacheTTL": 300
    },

    // === 权限 ===
    "permissions": {
      "canEdit": true,
      "canExport": true,
      "canPrint": true,
      "canShare": false,
      "editFields": ["m_raw_coal", "m_commodity", "m_self_use", "m_inventory"],
      "readOnlyFields": ["yoy_*"]
    }
  },

  // ==================== 模板2: 经营指标月报 ====================
  "RPT-FINANCE-001": {
    "id": "1002",
    "name": "经营指标月报",
    "code": "RPT-FINANCE-001",
    "version": 2,
    "status": "published",
    "description": "集团经营核心财务指标汇总报表",
    "category": "finance",
    "tags": ["经营", "财务", "KPI"],
    "icon": "📈",

    "layout": {
      "type": "table",
      "frozenRows": 3,
      "frozenCols": 1,
      "rowHeight": 32,
      "defaultAlign": "right",
      "stripeRows": false
    },

    "rowTree": [
      { "id": "fr_profit", "name": "利润总额", "level": 0 },
      { "id": "fr_tax", "name": "应交税费", "level": 0 },
      { "id": "fr_assets", "name": "资产总额", "level": 0 },
      { "id": "fr_debt", "name": "负债总额", "level": 0 },
      { "id": "fr_equity", "name": "所有者权益", "level": 0 },
      { "id": "fr_net_income", "name": "净资产收益率", "level": 0 },
      { "id": "fr_sales_rate", "name": "销售利润率", "level": 0 },
      { "id": "fr_asset_turn", "name": "总资产周转率", "level": 0 },
      { "id": "fr_cash_flow", "name": "经营性现金流", "level": 0 }
    ],

    "columnTree": [
      {
        "id": "fc_month",
        "title": "本月",
        "children": [
          { "id": "fci_target", "title": "指标项目", "type": "index", "align": "left", "width": 140 },
          { "id": "fci_current", "title": "本月完成", "type": "data", "format": "number" },
          { "id": "fci_plan", "title": "本月计划", "type": "data", "format": "number" },
          { "id": "fci_yoy", "title": "同比增长", "type": "derived", "format": "percent" }
        ]
      },
      {
        "id": "fc_ytd",
        "title": "本年累计",
        "children": [
          { "id": "fytd_current", "title": "累计完成", "type": "data", "format": "number" },
          { "id": "fytd_plan", "title": "年度计划", "type": "data", "format": "number" },
          { "id": "fytd_progress", "title": "年度进度", "type": "formula", "format": "percent" },
          { "id": "fytd_yoy", "title": "同比增长", "type": "derived", "format": "percent" }
        ]
      },
      {
        "id": "fc_forecast",
        "title": "预测",
        "children": [
          { "id": "ff_year_end", "title": "年末预计", "type": "aggregate", "format": "number" },
          { "id": "ff_gap", "title": "与目标差距", "type": "formula", "format": "number" }
        ]
      }
    ],

    "metrics": [
      {
        "field": "q1Rate",
        "label": "Q1完成率",
        "expression": "q1Done / q1Plan",
        "type": "number"
      },
      {
        "field": "yearProgress",
        "label": "年度进度",
        "expression": "fytd_current / fytd_plan * 100",
        "type": "percent"
      }
    ],

    "validators": [],
    "conditionalFormats": [],

    "dataSource": {
      "type": "mock",
      "sourceId": "ds_finance_kpi"
    }
  }

}

import { getTemplateById } from '@/api/reportDesigner.js'

/**
 * 导出所有V2模板（内置 + 自定义）
 */
export async function getV2Template(code) {
  console.log('[getV2Template] 查询模板:', code)

  // 1. 先查内置模板
  if (TEMPLATES_V2[code]) {
    console.log('[getV2Template] ✅ 内置模板找到')
    return TEMPLATES_V2[code]
  }

  // 2. 再查自定义模板（全局缓存）
  if (typeof window === 'undefined') return null
  const custom = window.__V2_TEMPLATES?.[code]
  if (custom) {
    console.log('[getV2Template] ✅ 全局缓存找到')
    return custom
  }

  // 提取原始code（去掉 CUSTOM- 前缀）
  const originalCode = code.startsWith('CUSTOM-') ? code.replace('CUSTOM-', '') : code

  // 3. 尝试从 API 加载（使用原始code）
  try {
    console.log('[getV2Template] 正在从API加载模板:', originalCode)
    const res = await getTemplateById(originalCode)
    console.log('[getV2Template] API响应:', res)

    if (res && (res.id || res.code || res.name)) {
      // 缓存到全局（同时缓存多种格式）
      window.__V2_TEMPLATES = window.__V2_TEMPLATES || {}
      const cacheKey1 = `CUSTOM-${res.code || res.id}`
      const cacheKey2 = res.code
      const cacheKey3 = res.id

      window.__V2_TEMPLATES[cacheKey1] = res
      if (cacheKey2) window.__V2_TEMPLATES[cacheKey2] = res
      if (cacheKey3) window.__V2_TEMPLATES[cacheKey3] = res

      console.log('[getV2Template] ✅ API加载成功:', res.name, '| 缓存key:', [cacheKey1, cacheKey2, cacheKey3].filter(Boolean))
      return res
    } else {
      console.warn('[getV2Template] API返回空数据或格式异常')
    }
  } catch (err) {
    console.warn('[getV2Template] API 模板加载失败:', err.message || err)
  }

  // 4. 最后尝试 localStorage（兼容）
  try {
    const saved = JSON.parse(localStorage.getItem('rpt_custom_templates') || '[]')
    const found = saved.find(t =>
      t.code === code ||
      t.id === code ||
      `CUSTOM-${t.code}` === code ||
      (originalCode && (t.code === originalCode || t.id === originalCode))
    )
    if (found) {
      console.log('[getV2Template] ✅ localStorage 找到:', found.name)
      return found
    }
  } catch { }

  console.warn('[getV2Template] ❌ 未找到模板:', code)
  return null
}

export async function getAllV2Templates() {
  // 1. 获取内置模板
  const builtIn = Object.values(TEMPLATES_V2)
  
  // 2. 获取自定义模板（API + localStorage）
  const custom = []
  
  // 先从 API 尝试获取列表（如果后端支持）
  try {
    // TODO: 如果后端提供批量查询接口，替换这里
    // const apiTemplates = await getTemplateList()
    // custom.push(...apiTemplates.map(t => ({ ...t, _isCustom: true })))
  } catch (err) {
    console.warn('API 模板列表加载失败:', err)
  }
  
  // 3. 加载 localStorage 的自定义模板（兼容）
  try {
    const localCustom = JSON.parse(localStorage.getItem('rpt_custom_templates') || '[]')
    custom.push(...localCustom.map(t => ({ ...t, _isCustom: true })))
  } catch (err) {
    console.warn('localStorage 模板加载失败:', err)
  }
  
  return [...builtIn, ...custom]
}

export async function getV2TemplateCodes() {
  const codes = Object.keys(TEMPLATES_V2)
  
  // 尝试从 API 获取自定义模板代码（如果后端支持）
  try {
    // TODO: 如果后端提供批量查询接口，替换这里
    // const res = await getTemplateList({ page: 1, pageSize: 1000 })
    // codes.push(...res.list.map(t => t.code))
  } catch (err) {
    console.warn('API 模板代码加载失败:', err)
  }
  
  // 最后从 localStorage 获取（兼容）
  try {
    const saved = JSON.parse(localStorage.getItem('rpt_custom_templates') || '[]')
    codes.push(...saved.map(t => t.code))
  } catch (err) {
    console.warn('localStorage 模板代码加载失败:', err)
  }
  
  return codes
}
