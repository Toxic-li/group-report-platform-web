/**
 * 报表设计器 API（模板管理）
 * 后端: ReportDesignerController
 * 代理: /report-designer/* → localhost:8080/report-designer/*
 */
import { get, post, put, del } from '@/utils/http'

const BASE = '/report-designer'

// ==================== 模板管理 ===================  =

/** 加载完整模板 JSON */
export function loadTemplate(templateId) {
  return get(`${BASE}/template/${encodeURIComponent(templateId)}`)
}

/** 保存/创建模板 */
export function saveTemplate(data) {
  return post(`${BASE}/template`, data)
}

/** 更新模板 */
export function updateTemplate(templateId, data) {
  return put(`${BASE}/template/${encodeURIComponent(templateId)}`, data)
}

/** 发布模板 */
export function publishTemplate(templateId) {
  return post(`${BASE}/template/${encodeURIComponent(templateId)}/publish`)
}

/** 复制模板 */
export function copyTemplate(templateId, data) {
  return post(`${BASE}/template/${encodeURIComponent(templateId)}/copy`, data)
}

/** 导出模板 */
export function exportTemplate(templateId) {
  return get(`${BASE}/template/${encodeURIComponent(templateId)}/export`)
}

/** 导入模板 */
export function importTemplate(data) {
  return post(`${BASE}/template/import`, data)
}

/** 预览模板 */
export function previewTemplate(templateId, data) {
  return post(`${BASE}/template/${encodeURIComponent(templateId)}/preview`, data)
}

/** 删除模板 */
export function deleteTemplate(templateId) {
  return del(`${BASE}/template/${encodeURIComponent(templateId)}`)
}

/** 根据ID获取模板详情（兼容旧代码） */
export function getTemplateById(templateId) {
  return loadTemplate(templateId)
}

/** 提交报表审核 */
export function submitForReview(data) {
  const params = new URLSearchParams()
  if (data.templateId) params.append('templateId', data.templateId)
  if (data.orgId) params.append('orgId', data.orgId)
  if (data.period) params.append('period', data.period)
  if (data.remark) params.append('remark', data.remark)
  return post(`${BASE}/submit?${params}`)
}

/** 导出报表为Excel */
export function exportToExcel(templateId, orgId, period) {
  const params = new URLSearchParams()
  params.append('templateId', templateId)
  if (orgId) params.append('orgId', orgId)
  if (period) params.append('period', period)
  return window.open(`${BASE}/export/excel?${params}`, '_blank')
}

/** 导出模板为Excel（不含数据） */
export function exportTemplateExcel(templateId) {
  return window.open(`${BASE}/export/template/excel?templateId=${templateId}`, '_blank')
}

/** 模板列表（分页） */
export function getTemplateList(params = {}) {
  const q = { current: params.current || 1, size: params.size || 100 }
  if (params.templateType && params.templateType !== 0) q.templateType = params.templateType
  if (params.status !== undefined && params.status !== '') q.status = params.status
  if (params.name) q.name = params.name
  return get(`${BASE}/template/list?${new URLSearchParams(q)}`)
}

// ==================== 登录兼容 ====================
export { login, logout, getCurrentUser } from './auth.js'

// ==================== 兼容旧引用 ====================
export { saveReportData } from './reportData.js'
export { getOrgTree } from './org.js'
