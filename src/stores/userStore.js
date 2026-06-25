import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, logout as apiLogout, getCurrentUser } from '@/api/auth.js'

export const useUserStore = defineStore('user', () => {
  // ==================== 状态 ====================
  const token = ref(sessionStorage.getItem('rpt_token') || '')
  const user = ref(JSON.parse(sessionStorage.getItem('rpt_user') || 'null'))
  const permissions = ref(JSON.parse(sessionStorage.getItem('rpt_permissions') || '[]'))
  const roles = ref(JSON.parse(sessionStorage.getItem('rpt_roles') || '[]'))

  // ==================== 计算属性 ====================
  const isLoggedIn = computed(() => !!token.value)
  const userId = computed(() => user.value?.userId || '')
  const userName = computed(() => user.value?.realName || user.value?.username || '未知')
  const userOrgs = computed(() => user.value?.orgs || [])

  // ==================== 权限检查 ====================
  function hasPermission(code) {
    if (!permissions.value.length) return false
    return permissions.value.includes(code) || permissions.value.includes('*:*:*')
  }

  function hasAnyPermission(...codes) {
    return codes.some(c => hasPermission(c))
  }

  function hasRole(roleCode) {
    return roles.value.some(r => r.roleCode === roleCode)
  }

  // ==================== 登录 ====================
  /**
   * ✅ 登录方法（适配后端返回格式）
   * 后端返回格式：
   * {
   *   code: 200,
   *   message: "操作成功",
   *   data: {
   *     token: "xxx",
   *     userId: "1",
   *     username: "admin",
   *     realName: "超级管理员",
   *     nickname: "Admin",
   *     avatar: null,
   *     orgId: "1",
   *     orgName: "某某集团有限公司",
   *     roles: ["SUPER_ADMIN", "ADMIN"],
   *     loginTime: "2026-06-25T09:33:25.7791347"
   *   }
   * }
   */
  async function login(username, password) {
    const res = await apiLogin({ username, password })
    
    // ✅ 解析后端返回数据（兼容多种格式）
    const data = res?.data || res
    const accessToken = data?.token || res?.token
    
    // ✅ 存储认证信息
    token.value = accessToken
    user.value = {
      userId: data?.userId || data?.id,
      username: data?.username || username,
      realName: data?.realName || data?.name || username,
      nickname: data?.nickname || data?.name,
      avatar: data?.avatar,
      orgId: data?.orgId,
      orgName: data?.orgName,
      loginTime: data?.loginTime
    }
    roles.value = data?.roles || res?.roles || []
    permissions.value = data?.permissions || res?.permissions || ['*:*:*', 'template:create', 'template:edit', 'template:publish', 'template:delete', 'template:permission', 'menu:reportCenter', 'menu:reportFill', 'menu:auditCenter', 'menu:admin']

    // ✅ 持久化存储
    sessionStorage.setItem('rpt_token', token.value)
    sessionStorage.setItem('rpt_user', JSON.stringify(user.value))
    sessionStorage.setItem('rpt_roles', JSON.stringify(roles.value))
    sessionStorage.setItem('rpt_permissions', JSON.stringify(permissions.value))
    
    // 如果用户选择记住登录，也存储到 localStorage
    const rememberMe = localStorage.getItem('rpt_remember')
    if (rememberMe === 'true') {
      localStorage.setItem('rpt_token', token.value)
      localStorage.setItem('rpt_user', JSON.stringify(user.value))
    }

    console.log('[UserStore] ✅ 登录成功:', {
      token: token.value,
      user: user.value,
      roles: roles.value
    })

    return res
  }

  // ==================== 登出 ====================
  async function logout() {
    try { await apiLogout() } catch (e) { /* ignore */ }

    token.value = ''
    user.value = null
    permissions.value = []
    roles.value = []

    sessionStorage.removeItem('rpt_token')
    sessionStorage.removeItem('rpt_user')
    sessionStorage.removeItem('rpt_roles')
    sessionStorage.removeItem('rpt_permissions')
    localStorage.removeItem('rpt_token')
  }

  // ==================== 刷新用户信息 ====================
  async function refreshUserInfo() {
    try {
      const res = await getCurrentUser()
      user.value = res.data || res
      permissions.value = res.permissions || res.data?.permissions || ['*:*:*', 'template:create', 'template:edit', 'template:publish', 'template:delete', 'template:permission', 'menu:reportCenter', 'menu:reportFill', 'menu:auditCenter', 'menu:admin']
      roles.value = res.roles || res.data?.roles || []
      sessionStorage.setItem('rpt_user', JSON.stringify(user.value))
      sessionStorage.setItem('rpt_roles', JSON.stringify(roles.value))
      sessionStorage.setItem('rpt_permissions', JSON.stringify(permissions.value))
    } catch (e) {
      console.warn('[UserStore] 刷新用户信息失败:', e)
    }
  }

  return {
    token, user, permissions, roles,
    isLoggedIn, userId, userName, userOrgs,
    login, logout, refreshUserInfo,
    hasPermission, hasAnyPermission, hasRole
  }
})
