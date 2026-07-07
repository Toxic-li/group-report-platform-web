import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/userStore.js'

const routes = [
  // ==================== 独立页面（无布局外壳） ====================
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login/index.vue')
  },
  {
    path: '/forbidden',
    name: 'Forbidden',
    component: () => import('@/views/Forbidden.vue')
  },
  // 报表填报 — 全屏独立页（需要最大表格空间）
  {
    path: '/report/:templateId',
    name: 'ReportFill',
    component: () => import('@/views/ReportFill/index.vue'),
    props: true,
    meta: { perm: 'menu:reportFill' }
  },
  // 报表设计器 — 全屏独立页
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

  // ==================== 主应用布局（侧边栏 + 顶栏） ====================
  {
    path: '/',
    component: () => import('@/layouts/BasicLayout.vue'),
    children: [
      {
        path: '',
        name: 'ReportCenter',
        component: () => import('@/views/ReportCenter/index.vue'),
        meta: { perm: 'menu:reportCenter' }
      },
      {
        path: 'audit',
        name: 'AuditCenter',
        component: () => import('@/views/AuditCenter/index.vue'),
        meta: { perm: 'menu:auditCenter' }
      },
      {
        path: 'wordToExcel',
        name: 'WordToExcel',
        component: () => import('@/views/wordToExcel/DocxToXlsx.vue'),
        meta: { perm: 'menu:wordToExcel' }
      },
      // ==================== 管理后台 ====================
      {
        path: 'admin/users',
        name: 'UserManage',
        component: () => import('@/views/Admin/UserManage.vue'),
        meta: { perm: 'menu:userManage' }
      },
      {
        path: 'admin/roles',
        name: 'RoleManage',
        component: () => import('@/views/Admin/RoleManage.vue'),
        meta: { perm: 'menu:roleManage' }
      },
      {
        path: 'admin/orgs',
        name: 'OrgManage',
        component: () => import('@/views/Admin/OrgManage.vue'),
        meta: { perm: 'menu:orgManage' }
      },
      {
        path: 'admin/workflows',
        name: 'WorkflowManage',
        component: () => import('@/views/Admin/WorkflowManage.vue'),
        meta: { perm: 'menu:workflow' }
      },
      {
        path: 'admin/logs',
        name: 'LogView',
        component: () => import('@/views/Admin/LogView.vue'),
        meta: { perm: 'menu:logView' }
      },
      {
        path: 'admin',
        redirect: '/admin/users'
      }
    ]
  },

  // ==================== 404 兜底 ====================
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// ========================================
// 路由守卫（认证 + 权限检查）
// ========================================

// 白名单：不需要登录的页面
const whiteList = ['/login', '/forbidden']

router.beforeEach((to, from, next) => {
  const token = sessionStorage.getItem('rpt_token') || localStorage.getItem('rpt_token')

  if (token) {
    if (to.path === '/login') {
      next({ path: '/' })
      return
    }

    // 权限校验
    if (to.meta?.perm) {
      const userStore = useUserStore()
      const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true'
      if (!skipAuth && !userStore.hasPermission(to.meta.perm)) {
        console.warn('[Router] 无权限访问:', to.path, '需要权限:', to.meta.perm)
        if (to.path === '/forbidden') { next(); return }
        next({ path: '/forbidden' })
        return
      }
    }

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
