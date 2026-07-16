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

/** 停用模板 */
export function disableTemplate(templateId) {
  return post(`${BASE}/template/${encodeURIComponent(templateId)}/disable`)
}

/** 启用模板 */
export function enableTemplate(templateId) {
  return post(`${BASE}/template/${encodeURIComponent(templateId)}/enable`)
}

/** 复制模板 */
export function copyTemplate(templateId, newName) {
  const params = new URLSearchParams()
  if (newName) params.append('newName', newName)
  return post(`${BASE}/template/${encodeURIComponent(templateId)}/copy?${params}`)
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

/** 批量删除模板 */
export function batchDeleteTemplates(templateIds) {
  return post(`${BASE}/template/batch-delete`, templateIds)
}

/** 根据ID获取模板详情（兼容旧代码） */
export function getTemplateById(templateId) {
  return loadTemplate(templateId)
}

/** 提交报表审核 */
export function submitForReview(data) {
  return post(`${BASE}/submit`, data)
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

// ==================== 模板版本 ====================

/** 获取模板版本列表 */
export function getTemplateVersions(templateId) {
  return get(`${BASE}/template/${templateId}/versions`)
}

/** 获取版本快照 */
export function getVersionSnapshot(versionId) {
  return get(`${BASE}/template/versions/${versionId}`)
}

/** 回滚到指定版本 */
export function rollbackVersion(versionId) {
  return put(`${BASE}/template/versions/${versionId}/rollback`)
}

// ==================== 登录兼容 ====================
export { login, logout, getCurrentUser } from './auth.js'

// ==================== 兼容旧引用 ====================
export { saveReportData } from './reportData.js'
export { getOrgTree } from './org.js'

// ==================== 模板下发 ====================

/** 下发模板到下级组织 */
export function assignTemplate(data) {
  return post('/template-assign', data)
}

/** 取消下发 */
export function cancelAssign(assignId) {
  return del(`/template-assign/${assignId}`)
}

/** 查询模板下发记录 */
export function getAssignRecords(templateId) {
  return get(`/template-assign/records/${templateId}`)
}

/** 获取可下发的下级组织列表 */
export function getSubordinateOrgsForAssign() {
  return get('/template-assign/orgs')
}

/** 获取下级组织树（高级下发-跨级选择） */
export function getSubordinateOrgTree() {
  return get('/template-assign/org-tree')
}

/** 获取已下发到指定组织的模板ID */
export function getAssignedTemplateIds(orgId) {
  return get(`/template-assign/assigned/${orgId}`)
}
