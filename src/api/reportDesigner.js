/**
 * 报表设计器 API 服务（完整版）
 * 基础路径: /api/report-designer
 * 
 * 接口分类:
 *   1. 模板管理 (/template/*)
 *   2. 报表数据 (/data/*)
 *   3. 数据源 (/data-sources/*)
 *   4. 公式管理 (/formulas/*)
 *   5. 条件格式 (/conditional-formats/*)
 *   6. 校验规则 (/validators/*)
 *   7. 提交审核 (/submit/*, /audit/*)
 *   8. 认证 (/auth/*)
 *   9. 组织机构 (/org/*)
 *  10. 角色管理 (/role/*)
 *  11. 用户管理 (/user/*)
 */

import { get, post, put, del, patch } from '@/utils/http.js'

const BASE = '/api/report-designer'

// ========================================
// 1. 模板管理 API (/api/report-designer/template/*)
// ========================================

/** 加载完整模板 JSON */
export async function loadTemplate(templateId) {
  return get(`${BASE}/template/${encodeURIComponent(templateId)}`)
}

/** 保存/创建完整模板 JSON */
export async function saveTemplate(template) {
  return post(`${BASE}/template`, template)
}

/** 更新完整模板 JSON */
export async function updateTemplate(templateId, template) {
  return put(`${BASE}/template/${encodeURIComponent(templateId)}`, template)
}

/** 发布模板 */
export async function publishTemplate(templateId) {
  return post(`${BASE}/template/${encodeURIComponent(templateId)}/publish`)
}

/** 复制模板 */
export async function copyTemplate(templateId, options = {}) {
  return post(`${BASE}/template/${encodeURIComponent(templateId)}/copy`, options)
}

/** 导出模板 JSON */
export async function exportTemplate(templateId) {
  return get(`${BASE}/template/${encodeURIComponent(templateId)}/export`)
}

/** 从 JSON 导入模板 */
export async function importTemplate(formData) {
  return post(`${BASE}/template/import`, formData)
}

/** 预览模板效果 */
export async function previewTemplate(templateId) {
  return post(`${BASE}/template/${encodeURIComponent(templateId)}/preview`)
}

// ========================================
// 2. 报表数据 API (/api/report-designer/data/*)
// ========================================

/** 获取报表数据（Univer 渲染） */
export async function getReportData(params = {}) {
  const query = new URLSearchParams(params).toString()
  return get(`${BASE}/data${query ? `?${query}` : ''}`)
}

/** 保存报表数据（适配后端 ReportDataSaveDTO）*/
export async function saveReportData(data) {
  return post(`${BASE}/data/save`, data)
}

/** 获取单元格值 */
export async function getCellValue(params) {
  const query = new URLSearchParams(params).toString()
  return get(`${BASE}/data/cell${query ? `?${query}` : ''}`)
}

/** 清空报表数据 */
export async function clearReportData() {
  return del(`${BASE}/data`)
}

/** 校验报表数据 */
export async function validateReportData(data) {
  return post(`${BASE}/data/validate`, data)
}

// ========================================
// 3. 数据源 API (/api/report-designer/data-sources/*)
// ========================================

/** 数据源列表 */
export async function getDataSources(params = {}) {
  const query = new URLSearchParams(params).toString()
  return get(`${BASE}/data-sources${query ? `?${query}` : ''}`)
}

/** 数据源详情 */
export async function getDataSourceById(id) {
  return get(`${BASE}/data-sources/${encodeURIComponent(id)}`)
}

/** 创建数据源 */
export async function createDataSource(data) {
  return post(`${BASE}/data-sources`, data)
}

/** 更新数据源 */
export async function updateDataSource(id, data) {
  return put(`${BASE}/data-sources/${encodeURIComponent(id)}`, data)
}

/** 删除数据源 */
export async function deleteDataSource(id) {
  return del(`${BASE}/data-sources/${encodeURIComponent(id)}`)
}

/** 测试数据源连接 */
export async function testDataSourceConnection(id) {
  return post(`${BASE}/data-sources/${encodeURIComponent(id)}/test-connection`)
}

/** 执行数据源查询 */
export async function executeDataSourceQuery(id, params = {}) {
  return post(`${BASE}/data-sources/${encodeURIComponent(id)}/query`, params)
}

// ========================================
// 4. 公式管理 API (/api/report-designer/formulas/*)
// ========================================

/** 获取模板下的公式列表 */
export async function getFormulasByTemplate(templateId) {
  return get(`${BASE}/formulas/template/${encodeURIComponent(templateId)}`)
}

/** 公式详情 */
export async function getFormulaById(formulaId) {
  return get(`${BASE}/formulas/${encodeURIComponent(formulaId)}`)
}

/** 创建公式 */
export async function createFormula(data) {
  return post(`${BASE}/formulas`, data)
}

/** 更新公式 */
export async function updateFormula(formulaId, data) {
  return put(`${BASE}/formulas/${encodeURIComponent(formulaId)}`, data)
}

/** 删除公式 */
export async function deleteFormula(formulaId) {
  return del(`${BASE}/formulas/${encodeURIComponent(formulaId)}`)
}

/** 启用/禁用公式 */
export async function toggleFormulaStatus(formulaId, status) {
  return patch(`${BASE}/formulas/${encodeURIComponent(formulaId)}/status`, { status })
}

/** 批量计算公式 */
export async function batchCalcFormulas(data) {
  return post(`${BASE}/formulas/calc/batch`, data)
}

/** 计算单个公式 */
export async function calcSingleFormula(formulaId) {
  return post(`${BASE}/formulas/calc/${encodeURIComponent(formulaId)}`)
}

// ========================================
// 5. 条件格式 API (/api/report-designer/conditional-formats/*)
// ========================================

/** 获取模板下的条件格式列表 */
export async function getConditionalFormatsByTemplate(templateId) {
  return get(`${BASE}/conditional-formats/template/${encodeURIComponent(templateId)}`)
}

/** 条件格式详情 */
export async function getConditionalFormatById(id) {
  return get(`${BASE}/conditional-formats/${encodeURIComponent(id)}`)
}

/** 创建条件格式 */
export async function createConditionalFormat(data) {
  return post(`${BASE}/conditional-formats`, data)
}

/** 更新条件格式 */
export async function updateConditionalFormat(id, data) {
  return put(`${BASE}/conditional-formats/${encodeURIComponent(id)}`, data)
}

/** 删除条件格式 */
export async function deleteConditionalFormat(id) {
  return del(`${BASE}/conditional-formats/${encodeURIComponent(id)}`)
}

/** 评估条件格式 */
export async function evaluateConditionalFormats(data) {
  return post(`${BASE}/conditional-formats/evaluate`, data)
}

// ========================================
// 6. 校验规则 API (/api/report-designer/validators/*)
// ========================================

/** 获取模板下的校验规则列表 */
export async function getValidatorsByTemplate(templateId) {
  return get(`${BASE}/validators/template/${encodeURIComponent(templateId)}`)
}

/** 校验规则详情 */
export async function getValidatorById(id) {
  return get(`${BASE}/validators/${encodeURIComponent(id)}`)
}

/** 创建校验规则 */
export async function createValidator(data) {
  return post(`${BASE}/validators`, data)
}

/** 更新校验规则 */
export async function updateValidator(id, data) {
  return put(`${BASE}/validators/${encodeURIComponent(id)}`, data)
}

/** 删除校验规则 */
export async function deleteValidator(id) {
  return del(`${BASE}/validators/${encodeURIComponent(id)}`)
}

/** 执行校验 */
export async function executeValidation(data) {
  return post(`${BASE}/validators/validate`, data)
}

// ========================================
// 7. 提交审核 API (/api/report-designer/submit/*, /audit/*)
// ========================================

/** 提交审核 */
export async function submitForReview(data) {
  return post(`${BASE}/submit`, data)
}

/** 撤回提交 */
export async function withdrawSubmission(submitId) {
  return put(`${BASE}/submit/${encodeURIComponent(submitId)}/withdraw`)
}

/** 分页查询提交记录 */
export async function getSubmissionsPage(params = {}) {
  const query = new URLSearchParams(params).toString()
  return get(`${BASE}/submit/page${query ? `?${query}` : ''}`)
}

/** 提交详情 */
export async function getSubmissionById(submitId) {
  return get(`${BASE}/submit/${encodeURIComponent(submitId)}`)
}

/** 审核通过 */
export async function approveAudit(submitId, remark = '') {
  return put(`${BASE}/audit/${encodeURIComponent(submitId)}/approve`, { remark })
}

/** 审核驳回 */
export async function rejectAudit(submitId, reason = '') {
  return put(`${BASE}/audit/${encodeURIComponent(submitId)}/reject`, { reason })
}

/** 待审核列表 */
export async function getPendingAudits(params = {}) {
  const query = new URLSearchParams(params).toString()
  return get(`${BASE}/audit/pending${query ? `?${query}` : ''}`)
}

// ========================================
// 8. 认证 API (/auth/*)
// ========================================

/** 登录 */
export async function login(credentials) {
  return post('/auth/login', credentials)
}

/** 登出 */
export async function logout() {
  return post('/auth/logout')
}

/** 当前用户信息 */
export async function getCurrentUser() {
  return get('/auth/current')
}

/** 修改密码 */
export async function changePassword(data) {
  return put('/auth/password', data)
}

// ========================================
// 9. 组织机构 API (/org/*)
// ========================================

/** 组织机构树 */
export async function getOrgTree() {
  return get('/org/tree')
}

/** 组织详情 */
export async function getOrgById(id) {
  return get(`/org/${encodeURIComponent(id)}`)
}

/** 创建组织 */
export async function createOrg(data) {
  return post('/org', data)
}

/** 更新组织 */
export async function updateOrg(id, data) {
  return put(`/org/${encodeURIComponent(id)}`, data)
}

/** 删除组织 */
export async function deleteOrg(id) {
  return del(`/org/${encodeURIComponent(id)}`)
}

// ========================================
// 10. 角色管理 API (/role/*)
// ========================================

/** 角色列表 */
export async function getRoleList() {
  return get('/role/list')
}

/** 角色详情 */
export async function getRoleById(id) {
  return get(`/role/${encodeURIComponent(id)}`)
}

/** 创建角色 */
export async function createRole(data) {
  return post('/role', data)
}

/** 更新角色 */
export async function updateRole(id, data) {
  return put(`/role/${encodeURIComponent(id)}`, data)
}

/** 删除角色 */
export async function deleteRole(id) {
  return del(`/role/${encodeURIComponent(id)}`)
}

// ========================================
// 11. 用户管理 API (/user/*)
// ========================================

/** 分页查询用户 */
export async function getUserPage(params = {}) {
  const query = new URLSearchParams(params).toString()
  return get(`/user/page${query ? `?${query}` : ''}`)
}

/** 用户详情 */
export async function getUserById(id) {
  return get(`/user/${encodeURIComponent(id)}`)
}

/** 创建用户 */
export async function createUser(data) {
  return post('/user', data)
}

/** 更新用户 */
export async function updateUser(id, data) {
  return put(`/user/${encodeURIComponent(id)}`, data)
}

/** 删除用户 */
export async function deleteUser(id) {
  return del(`/user/${encodeURIComponent(id)}`)
}

/** 重置密码 */
export async function resetUserPassword(id) {
  return put(`/user/${encodeURIComponent(id)}/reset-password`)
}

/** 更新用户状态 */
export async function updateUserStatus(id, status) {
  return put(`/user/${encodeURIComponent(id)}/status`, { status })
}

// ========================================
// 兼容旧版接口（保持向后兼容）
// ========================================

/** @deprecated 使用 loadTemplate 替代 */
export async function getTemplateById(id) { return loadTemplate(id) }

/** @deprecated 使用 saveTemplate 替代 */
export async function createTemplate(template) { return saveTemplate(template) }

/** @deprecated 已发布模板列表使用独立接口 */
export async function getPublishedTemplates(params = {}) {
  // 尝试从 /report/template/published 获取（如果后端保留此接口）
  try {
    const query = new URLSearchParams(params).toString()
    return get(`/report/template/published${query ? `?${query}` : ''}`)
  } catch {
    // 兜底：返回空数组
    return []
  }
}

// ========================================
// 统一导出
// ========================================

export default {
  // 模板管理
  loadTemplate,
  saveTemplate,
  updateTemplate,
  publishTemplate,
  copyTemplate,
  exportTemplate,
  importTemplate,
  previewTemplate,
  
  // 报表数据
  getReportData,
  saveReportData,
  getCellValue,
  clearReportData,
  validateReportData,
  
  // 数据源
  getDataSources,
  getDataSourceById,
  createDataSource,
  updateDataSource,
  deleteDataSource,
  testDataSourceConnection,
  executeDataSourceQuery,
  
  // 公式管理
  getFormulasByTemplate,
  getFormulaById,
  createFormula,
  updateFormula,
  deleteFormula,
  toggleFormulaStatus,
  batchCalcFormulas,
  calcSingleFormula,
  
  // 条件格式
  getConditionalFormatsByTemplate,
  getConditionalFormatById,
  createConditionalFormat,
  updateConditionalFormat,
  deleteConditionalFormat,
  evaluateConditionalFormats,
  
  // 校验规则
  getValidatorsByTemplate,
  getValidatorById,
  createValidator,
  updateValidator,
  deleteValidator,
  executeValidation,
  
  // 提交审核
  submitForReview,
  withdrawSubmission,
  getSubmissionsPage,
  getSubmissionById,
  approveAudit,
  rejectAudit,
  getPendingAudits,
  
  // 认证
  login,
  logout,
  getCurrentUser,
  changePassword,
  
  // 组织机构
  getOrgTree,
  getOrgById,
  createOrg,
  updateOrg,
  deleteOrg,
  
  // 角色管理
  getRoleList,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  
  // 用户管理
  getUserPage,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  updateUserStatus,
  
  // 兼容旧版
  getTemplateById,
  createTemplate,
  getPublishedTemplates,
}
