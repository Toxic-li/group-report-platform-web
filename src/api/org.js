/**
 * 组织架构 API
 * 后端: OrgController
 * 代理: /org/* → localhost:8080/org/*
 */
import { get, post, put, del } from '@/utils/http'

/** 获取组织树 */
export function getOrgTree() {
  return get('/org/tree')
}

/** 组织详情 */
export function getOrgDetail(orgId) {
  return get(`/org/${orgId}`)
}

/** 创建组织 */
export function createOrg(data) {
  return post('/org', data)
}

/** 更新组织 */
export function updateOrg(orgId, data) {
  return put(`/org/${orgId}`, data)
}

/** 删除组织 */
export function deleteOrg(orgId) {
  return del(`/org/${orgId}`)
}
