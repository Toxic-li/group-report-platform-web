/**
 * 报表提交审核 API
 * 后端: ReportSubmitController + ReportAuditController
 * 代理: /report-designer/submit/* → localhost:8080/report-designer/submit/*
 *       /report-designer/audit/* → localhost:8080/report-designer/audit/*
 */
import { get, post, put } from '@/utils/http.js'

// ==================== 提交 ====================

/** 提交审核 */
export function submitForReview(data) {
  return post('/report-designer/submit', data)
}

/** 撤回提交 */
export function withdrawSubmit(submitId) {
  return put(`/report-designer/submit/${submitId}/withdraw`)
}

/** 分页查询提交记录 */
export function getSubmitList(params = {}) {
  const query = new URLSearchParams(params).toString()
  return get(`/report-designer/submit/page${query ? `?${query}` : ''}`)
}

/** 提交详情 */
export function getSubmitDetail(submitId) {
  return get(`/report-designer/submit/${submitId}`)
}

// ==================== 审核 ====================

/** 审核通过 */
export function approveAudit(submitId) {
  return put(`/report-designer/audit/${submitId}/approve`)
}

/** 审核驳回 */
export function rejectAudit(submitId, reason) {
  return put(`/report-designer/audit/${submitId}/reject`, { reason })
}

/** 待审核列表 */
export function getPendingAudits(params = {}) {
  const query = new URLSearchParams(params).toString()
  return get(`/report-designer/audit/pending${query ? `?${query}` : ''}`)
}
