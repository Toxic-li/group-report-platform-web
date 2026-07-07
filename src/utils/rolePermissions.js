/**
 * 角色 → 权限码映射
 *
 * 后端为纯 RBAC（无权限码表），StpInterfaceImpl.getPermissionList() 返回空列表。
 * 仅返回角色编码：SUPER_ADMIN / ADMIN / AUDITOR / REPORTER / VIEWER
 *
 * 前端根据角色推导出权限码，用于路由守卫和 v-permission 指令。
 */

/** 角色到权限码的映射表 */
const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ['*:*:*'],

  ADMIN: [
    'menu:reportCenter', 'menu:reportFill', 'menu:auditCenter', 'menu:wordToExcel',
    'menu:admin', 'menu:userManage', 'menu:roleManage', 'menu:orgManage',
    'menu:workflow', 'menu:logView',
    'template:create', 'template:edit', 'template:publish', 'template:permission', 'template:delete'
  ],

  AUDITOR: [
    'menu:reportCenter', 'menu:reportFill', 'menu:auditCenter'
  ],

  REPORTER: [
    'menu:reportCenter', 'menu:reportFill'
  ],

  VIEWER: [
    'menu:reportCenter'
  ]
}

/**
 * 根据角色列表推导权限码
 * @param {Array<string|{roleCode?:string,code?:string}>} roles
 * @returns {string[]} 权限码数组
 */
export function derivePermissionsFromRoles(roles) {
  if (!roles || !roles.length) return []
  const perms = new Set()
  for (const role of roles) {
    const code = typeof role === 'string' ? role : (role?.roleCode || role?.code)
    const list = ROLE_PERMISSIONS[code]
    if (list) list.forEach(p => perms.add(p))
  }
  return [...perms]
}
