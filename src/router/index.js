import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/userStore.js'

const routes = [
  {
    path: '/',
    name: 'ReportCenter',
    component: () => import('@/views/ReportCenter/index.vue'),
    meta: { perm: 'menu:reportCenter' }
  },
  {
    path: '/report/:templateId',
    name: 'ReportFill',
    component: () => import('@/views/ReportFill/index.vue'),
    props: true,
    meta: { perm: 'menu:reportFill' }
  },
  {
    path: '/designer',
    name: 'ReportDesigner',
    component: () => import('@/views/ReportDesigner/index.vue'),
    meta: { perm: 'template:create' }
  },
  {
    path: '/designer/:code',
    name: 'DesignerEdit',
    component: () => import('@/views/ReportDesigner/index.vue'),
    meta: { perm: 'template:edit' }
  },
  {
    path: '/audit',
    name: 'AuditCenter',
    component: () => import('@/views/AuditCenter/index.vue'),
    meta: { perm: 'menu:auditCenter' }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login/index.vue')
  },
  // ⭐ 管理后台
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { perm: 'menu:admin' },
    children: [
      { path: 'users',     name: 'UserManage',     component: () => import('@/views/Admin/UserManage.vue'),     meta: { perm: 'menu:userManage' } },
      { path: 'roles',     name: 'RoleManage',     component: () => import('@/views/Admin/RoleManage.vue'),     meta: { perm: 'menu:roleManage' } },
      { path: 'orgs',      name: 'OrgManage',      component: () => import('@/views/Admin/OrgManage.vue'),      meta: { perm: 'menu:orgManage' } },
      { path: 'workflows', name: 'WorkflowManage', component: () => import('@/views/Admin/WorkflowManage.vue'), meta: { perm: 'menu:workflow' } },
      { path: 'logs',      name: 'LogView',        component: () => import('@/views/Admin/LogView.vue'),        meta: { perm: 'menu:logView' } },
      { path: '', redirect: '/admin/users' }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// ========================================
// ✅ 路由守卫（认证检查）
// ========================================

// 白名单：不需要登录的页面
const whiteList = ['/login']

router.beforeEach((to, from, next) => {
  const token = sessionStorage.getItem('rpt_token') || localStorage.getItem('rpt_token')
  
  if (token) {
    if (to.path === '/login') {
      next({ path: '/' })
      return
    }
    // ⭐ 管理后台权限检查 — 开发模式暂时绕过，由页面内 v-permission 控制
    // 正式环境取消注释下面代码即可启用路由级权限校验
    /*
    if (to.path.startsWith('/admin')) {
      const userStore = useUserStore()
      if (!userStore.hasPermission('menu:admin')) {
        console.warn('[Router] 无管理后台权限')
        next(false)
        return
      }
    }
    */
    next()
  } else {
    if (whiteList.includes(to.path)) {
      next()
    } else {
      next({ path: '/login', query: { redirect: to.fullPath } })
    }
  }
})

export default router
