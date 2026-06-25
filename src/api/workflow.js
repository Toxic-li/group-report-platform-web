/**
 * 审批流 API
 * 后端: workflow-service
 */
import { get, post } from '@/utils/http.js'

const WF_BASE = '/workflow'

/** 流程定义列表 */
export async function getProcessList(params = {}) {
  const query = new URLSearchParams(params).toString()
  return get(`${WF_BASE}/process/list${query ? `?${query}` : ''}`)
}

/** 发起审批 */
export async function startProcess(bizType, bizId, data) {
  return post(`${WF_BASE}/start`, { bizType, bizId, ...data })
}

/** 审批任务列表（我的待办） */
export async function getMyTasks(params = {}) {
  const query = new URLSearchParams(params).toString()
  return get(`${WF_BASE}/task/my${query ? `?${query}` : ''}`)
}

/** 审批通过 */
export async function approveTask(taskId, comment = '') {
  return post(`${WF_BASE}/task/${taskId}/approve`, { comment })
}

/** 审批驳回 */
export async function rejectTask(taskId, comment = '') {
  return post(`${WF_BASE}/task/${taskId}/reject`, { comment })
}

/** 审批记录 */
export async function getProcessRecords(bizType, bizId) {
  return get(`${WF_BASE}/records?bizType=${bizType}&bizId=${bizId}`)
}
