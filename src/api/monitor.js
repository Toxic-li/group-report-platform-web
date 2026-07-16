/**
 * 填报监控 & 数据汇总 API
 * 后端: MonitorController, AggregationController
 */
import { get, post } from '@/utils/http'

/** 获取下级单位填报进度 */
export function getSubmissionProgress(params) {
  const query = new URLSearchParams(params || {}).toString()
  return get(`/monitor/progress?${query}`)
}

/** 获取下级单位汇总数据 */
export function getAggregation(params) {
  const query = new URLSearchParams(params || {}).toString()
  return get(`/aggregation?${query}`)
}

/** 获取可查看的下级组织列表 */
export function getSubordinateOrgs() {
  return get('/aggregation/orgs')
}

/** 合并下级数据生成汇总表 */
export function mergeSubordinateData(data) {
  return post('/aggregation/merge', data)
}

/** 催报下级单位 */
export function remindSubordinate(data) {
  return post('/monitor/remind', data)
}

/** 获取组织树 */
export function getOrgTree() {
  return get('/monitor/org-tree')
}