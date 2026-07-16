import { get, post, del, upload } from '@/utils/http'

/**
 * 查询我的填报任务
 * @param {Object} params - { tab, page, size, keyword, status, ... }
 * @param {string} params.tab - my/draft/pending/submitted/rejected/completed
 */
export function queryMyFillingTasks(params) {
  const { tab = 'my', ...rest } = params || {}
  const queryString = new URLSearchParams({ tab, ...rest }).toString()
  return get(`/filling/my?${queryString}`)
}

export function withdrawSubmit(submitId) {
  return post(`/filling/withdraw/${submitId}`)
}

export function getFillingStats() {
  return get('/filling/stats')
}

export function getEntryDetail(submitId) {
  return get(`/filling/detail/${submitId}`)
}

export function getEntryDetailByReportId(reportId) {
  return get(`/filling/detail/report/${reportId}`)
}

export function saveDraft(data) {
  return post('/filling/draft', data)
}

export function submitForReview(data) {
  return post('/filling/submit', data)
}

export function getEntryHistory(submitId) {
  return get(`/filling/history/${submitId}`)
}

export function getAttachments(submitId) {
  return get(`/filling/attachments/${submitId}`)
}

export function uploadAttachment(submitId, file) {
  const formData = new FormData()
  formData.append('file', file)
  return upload(`/filling/attachments/${submitId}`, formData)
}

export function downloadAttachment(attachmentId) {
  const token = sessionStorage.getItem('rpt_token') || localStorage.getItem('rpt_token') || ''
  return fetch(`/api/filling/attachments/${attachmentId}/download`, {
    headers: { Authorization: token }
  }).then(res => {
    if (!res.ok) throw new Error('下载失败')
    return res.blob()
  }).then(blob => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attachment_${attachmentId}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  })
}

export function deleteAttachment(attachmentId) {
  return del(`/filling/attachments/${attachmentId}`)
}

export function validateData(data) {
  return post('/filling/validate', data)
}

export function importFromExcel(submitId, file) {
  const formData = new FormData()
  formData.append('file', file)
  return upload(`/filling/import/${submitId}`, formData)
}

export async function exportToExcel(submitId) {
  const token = sessionStorage.getItem('rpt_token') || localStorage.getItem('rpt_token') || ''
  const response = await fetch(`/api/filling/export/${submitId}`, {
    headers: { Authorization: token }
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || err.msg || '导出失败')
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `report_${submitId}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function deleteDraft(submitId) {
  return del(`/filling/${submitId}`)
}

export function batchSubmit(submitIds) {
  return post('/filling/batch-submit', submitIds)
}

export function batchDeleteDrafts(submitIds) {
  return post('/filling/batch-delete', submitIds)
}

// ===== 逐级上报 =====

/** 上报给上级单位 */
export function reportToSuperior(submitId) {
  return post(`/filling/report/${submitId}`)
}

export function cancelReport(submitId) {
  return post(`/filling/cancel-report/${submitId}`)
}

/** 批量上报 */
export function batchReport(submitIds) {
  return post('/filling/batch-report', submitIds)
}

/** 查询下级上报给我的数据 */
export function queryReportedToMe(params) {
  const query = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') query.append(k, v) })
  }
  return get(`/filling/reported-to-me?${query}`)
}

/** 获取即将截止的填报任务 */
export function getApproachingDeadlineTasks() {
  return get('/filling/approaching-deadline')
}
