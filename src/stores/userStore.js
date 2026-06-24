import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, logout as apiLogout, getCurrentUser } from '@/api/auth.js'

export const useUserStore = defineStore('user', () => {
  // ==================== 状态 ====================
  const token = ref(sessionStorage.getItem('rpt_token') || '')
  const user = ref(null)
  const permissions = ref([])
  const roles = ref([])

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
  async function login(username, password) {
    const res = await apiLogin({ username, password })
    const { accessToken, user: userInfo, permissions: perms, roles: roleList } = res.data || res

    token.value = accessToken || res.token
    user.value = userInfo || res.user
    permissions.value = perms || res.permissions || []
    roles.value = roleList || res.roles || []

    sessionStorage.setItem('rpt_token', token.value)
    sessionStorage.setItem('rpt_user', JSON.stringify(user.value))
    localStorage.setItem('rpt_token', token.value)

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
    localStorage.removeItem('rpt_token')
  }

  // ==================== 刷新用户信息 ====================
  async function refreshUserInfo() {
    try {
      const res = await getCurrentUser()
      user.value = res.data || res
      permissions.value = res.permissions || res.data?.permissions || []
      roles.value = res.roles || res.data?.roles || []
      sessionStorage.setItem('rpt_user', JSON.stringify(user.value))
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
