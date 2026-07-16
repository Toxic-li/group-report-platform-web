/**
 * 认证 + 用户管理 API
 * 后端: AuthController + UserController
 * 代理:/auth/* → localhost:8080/auth/*
 *       /user/* → localhost:8080/user/*
 */
import { get, post, put, del } from '@/utils/http'

// ==================== 认证 ====================

/** 登录 */
export function login(data) {
  return post('/auth/login', data)
}

/** 登出 */
export function logout() {
  return post('/auth/logout')
}

/** 获取当前用户信息 */
export function getCurrentUser() {
  return get('/auth/current')
}

/** 修改密码 */
export function changePassword(data) {
  return put('/auth/password', data)
}

/** 重置密码（临时） */
export function resetPasswordTemp(username) {
  return post('/auth/reset-pwd', { username })
}

// ==================== 用户管理 ====================

/** 用户列表（分页） */
export function getUserList(params = {}) {
  const query = new URLSearchParams(params).toString()
  return get(`/user/page${query ? `?${query}` : ''}`)
}

/** 用户详情 */
export function getUserDetail(userId) {
  return get(`/user/${userId}`)
}

/** 创建用户 */
export function createUser(data) {
  return post('/user', data)
}

/** 更新用户 */
export function updateUser(userId, data) {
  return put(`/user/${userId}`, data)
}

/** 删除用户 */
export function deleteUser(userId) {
  return del(`/user/${userId}`)
}

/** 重置用户密码 */
export function resetUserPassword(userId, password) {
  return put(`/user/${userId}/reset-password`, { password })
}

/** 更新用户状态 */
export function updateUserStatus(userId, status) {
  return put(`/user/${userId}/status`, { status })
}
