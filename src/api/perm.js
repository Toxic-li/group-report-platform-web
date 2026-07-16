/**
 * 权限管理 API
 * 后端: PermissionController
 * 代理: /permission/* -> localhost:8080/permission/*
 */
import { get, post, put, del } from '@/utils/http'

/** 获取所有权限列表 */
export function getPermissionList() {
  return get('/permission/list')
}

/** 权限详情 */
export function getPermissionDetail(permId) {
  return get(`/permission/${permId}`)
}

/** 创建权限 */
export function createPermission(data) {
  return post('/permission', data)
}

/** 更新权限 */
export function updatePermission(permId, data) {
  return put(`/permission/${permId}`, data)
}

/** 删除权限 */
export function deletePermission(permId) {
  return del(`/permission/${permId}`)
}

/** 绑定角色权限 */
export function bindRolePermissions(roleId, permIds) {
  return put(`/permission/role/${roleId}`, { permIds })
}