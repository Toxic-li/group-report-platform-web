import { get, post, del, upload } from '@/utils/http'

export function queryMyFillingTasks(params) {
  const queryString = new URLSearchParams(params).toString()
  return get(`/filling/my?${queryString}`)
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
  window.location.href = `/api/filling/attachments/${attachmentId}/download`
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

export function exportToExcel(submitId) {
  window.location.href = `/api/filling/export/${submitId}`
}
