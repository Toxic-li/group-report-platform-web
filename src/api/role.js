/**
 * 角色管理 API
 * 后端: RoleController
 * 代理: /role/* → localhost:8080/role/*
 */
import { get, post, put, del } from '@/utils/http'

/** 角色列表 */
export function getRoleList() {
  return get('/role/list')
}

/** 角色详情 */
export function getRoleDetail(roleId) {
  return get(`/role/${roleId}`)
}

/** 创建角色 */
export function createRole(data) {
  return post('/role', data)
}

/** 更新角色 */
export function updateRole(roleId, data) {
  return put(`/role/${roleId}`, data)
}

/** 删除角色 */
export function deleteRole(roleId) {
  return del(`/role/${roleId}`)
}

// ==================== 权限树 ====================

/** 权限树 */
export function getPermissionTree() {
  return get('/permission/list')
}

/** 绑定角色权限 */
export function bindRolePermissions(roleId, permIds) {
  return put(`/permission/role/${roleId}`, { permIds })
}
