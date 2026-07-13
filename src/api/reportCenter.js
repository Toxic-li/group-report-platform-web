import { get, post, del } from '@/utils/http'

/** 过滤掉 undefined 值，避免 URLSearchParams 把 undefined 转成字符串 "undefined" */
function cleanParams(params) {
  const cleaned = {}
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value
    }
  }
  return cleaned
}

export function queryReports(params) {
  const queryString = new URLSearchParams(cleanParams(params)).toString()
  return get(`/report-center?${queryString}`)
}

export function queryMyReports(params) {
  const queryString = new URLSearchParams(cleanParams(params)).toString()
  return get(`/report-center/my?${queryString}`)
}

export function queryFavoriteReports(params) {
  const queryString = new URLSearchParams(cleanParams(params)).toString()
  return get(`/report-center/favorites?${queryString}`)
}

export function toggleFavorite(id) {
  return post(`/report-center/${id}/favorite`)
}

export function countFavorites() {
  return get('/report-center/favorites/count')
}

export function queryRecentReports(params) {
  const queryString = new URLSearchParams(cleanParams(params)).toString()
  return get(`/report-center/recent?${queryString}`)
}

export function recordRecentView(templateId) {
  return post(`/report-center/recent/${templateId}`)
}

export function countRecentViews() {
  return get('/report-center/recent/count')
}

export function countMyReports() {
  return get('/report-center/my/count')
}

export function countReports() {
  return get('/report-center/count')
}

export function deleteReport(id) {
  return del(`/report-designer/template/${id}`)
}
