/**
 * 数据分析 API
 * 后端: AnalyticsController (/analytics/*)
 */
import { get } from '@/utils/http'

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
