import { get, post } from '@/utils/http'

/**
 * 查询审核任务
 * @param {string} view - pending/approved/rejected/initiated/history
 * @param {Object} params - { page, size, keyword, templateId, orgId, dateRange, ... }
 */
export function queryAuditTasks(view, params) {
  const queryString = new URLSearchParams({ view, ...(params || {}) }).toString()
  return get(`/audit/tasks?${queryString}`)
}

export function getAuditStats() {
  return get('/audit/stats')
}

export function approveAudit(payload) {
  return post('/audit/approve', payload)
}

export function rejectAudit(payload) {
  return post('/audit/reject', payload)
}

export function transferAudit(payload) {
  return post('/audit/transfer', payload)
}

export function batchApproveAudits(payload) {
  return post('/audit/batch-approve', payload)
}

export function getAuditDetail(submitId) {
  return get(`/audit/detail/${submitId}`)
}

export function getAuditHistory(submitId) {
  return get(`/audit/history/${submitId}`)
}
