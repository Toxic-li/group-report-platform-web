/**
 * 报表数据 API
 * 后端: ReportDataController
 * 代理: /report-designer/data/* → localhost:8080/report-designer/data/*
 */
import { get, post, del } from '@/utils/http'

const BASE = '/report-designer/data'

/** 获取报表填报数据 */
export function getReportData(templateId, orgId, period) {
  const params = new URLSearchParams({ templateId, orgId, period }).toString()
  return get(`${BASE}${params ? `?${params}` : ''}`)
}

/** 保存报表填报数据 */
export function saveReportData(data) {
  return post(`${BASE}/save`, data)
}

/** 获取单元格值 */
export function getCellValue(templateId, orgId, period, cellKey) {
  // cellKey 格式: "rowCode-columnCode" → 后端需要分开传 rowCode + columnCode
  const [rowCode, columnCode] = cellKey ? cellKey.split('-') : ['', '']
  const params = new URLSearchParams({ templateId, orgId, period, rowCode, columnCode }).toString()
  return get(`${BASE}/cell${params ? `?${params}` : ''}`)
}

/** 清空报表数据 */
export function clearReportData(templateId, orgId, period) {
  const params = new URLSearchParams({ templateId, orgId, period }).toString()
  return del(`${BASE}${params ? `?${params}` : ''}`)
}

/** 校验报表数据 */
export function validateReportData(data) {
  return post(`${BASE}/validate`, data)
}
