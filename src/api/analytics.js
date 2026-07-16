/**
 * 数据分析 / 数据汇总 API
 * 后端: AnalyticsController (/analytics/*) + AggregationController (/aggregation/*)
 */
import { get, post } from '@/utils/http'

/** 获取汇总分析数据 */
export function getSummaryData(params = {}) {
  const query = new URLSearchParams(params).toString()
  return get(`/analytics/summary${query ? `?${query}` : ''}`)
}

/** 获取趋势分析数据 */
export function getTrendData(params = {}) {
  const query = new URLSearchParams(params).toString()
  return get(`/analytics/trend${query ? `?${query}` : ''}`)
}

/** 获取图表数据 */
export function getChartData(params = {}) {
  const query = new URLSearchParams(params).toString()
  return get(`/analytics/chart${query ? `?${query}` : ''}`)
}

// ===== 数据汇总（新） =====

/** 获取报表数据汇总 */
export function getAggregationReport(params = {}) {
  const query = new URLSearchParams()
  if (params.templateId) query.append('templateId', params.templateId)
  if (params.period) query.append('period', params.period)
  return get(`/aggregation/report?${query}`)
}

/** 获取单元格明细 */
export function getCellDetail(params = {}) {
  const query = new URLSearchParams()
  if (params.templateId) query.append('templateId', params.templateId)
  if (params.period) query.append('period', params.period)
  if (params.rowCode) query.append('rowCode', params.rowCode)
  if (params.columnCode) query.append('columnCode', params.columnCode)
  return get(`/aggregation/cell-detail?${query}`)
}

/** 获取可用填报周期列表 */
export function getAvailablePeriods(templateId) {
  return get(`/aggregation/periods?templateId=${templateId}`)
}

/** 获取汇总交叉表（组织×指标矩阵） */
export function getAggregationTable(params = {}) {
  const query = new URLSearchParams()
  if (params.templateId) query.append('templateId', params.templateId)
  if (params.period) query.append('period', params.period)
  return get(`/aggregation/table?${query}`)
}

// ===== 计划汇总 API =====

/** 获取计划汇总列表 */
export function getPlanSummary(params = {}) {
  const query = new URLSearchParams()
  if (params.year) query.append('year', params.year)
  if (params.batch) query.append('batch', params.batch)
  if (params.type) query.append('type', params.type)
  return get(`/plan/summary?${query}`)
}

/** 获取计划台账 */
export function getPlanLedger(params = {}) {
  const query = new URLSearchParams()
  if (params.year) query.append('year', params.year)
  if (params.orgId) query.append('orgId', params.orgId)
  return get(`/plan/ledger?${query}`)
}

/** 获取集团计划完成情况 */
export function getPlanCompletion(params = {}) {
  const query = new URLSearchParams()
  if (params.year) query.append('year', params.year)
  if (params.orgId) query.append('orgId', params.orgId)
  return get(`/plan/completion?${query}`)
}

/** 生成计划汇总 */
export function generatePlanSummary(data) {
  return post('/plan/generate', data)
}

/** 生成统计汇总（合并下级单位数据） */
export function generateAggregation(data) {
  return post('/aggregation/generate', data)
}

/** 导出汇总报表 */
export function exportAggregationUrl(templateId, period) {
  const params = new URLSearchParams()
  params.append('templateId', templateId)
  if (period) params.append('period', period)
  return `/aggregation/export?${params.toString()}`
}
