/**
 * 权限检查 Composition API
 * 用法:
 *   const { hasPermission, hasAnyPermission } = usePermission()
 *   <button v-if="hasPermission('template:create')">创建</button>
 */
import { useUserStore } from '@/stores/userStore'

export function usePermission() {
  const userStore = useUserStore()

  function hasPermission(code) {
    return userStore.hasPermission(code)
  }

  function hasAnyPermission(...codes) {
    return userStore.hasAnyPermission(...codes)
  }

  function hasRole(code) {
    return userStore.hasRole(code)
  }

  return {
    hasPermission,
    hasAnyPermission,
    hasRole,
    permissions: userStore.permissions,
    roles: userStore.roles
  }
}
