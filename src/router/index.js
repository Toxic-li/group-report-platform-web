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

  // ==================== 主应用布局（侧边栏 + 顶栏） ====================
  {
    path: '/',
    component: () => import('@/layouts/BasicLayout.vue'),
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard/index.vue'),
        meta: { perm: 'menu:dashboard' }
      },
      // ==================== 报表中心 ====================
      {
        path: 'report-center',
        name: 'ReportCenter',
        component: () => import('@/views/ReportCenter/index.vue'),
        meta: { perm: 'menu:reportCenter' }
      },
      {
        path: 'report-center/my-reports',
        name: 'MyReports',
        component: () => import('@/views/ReportCenter/MyFilling.vue'),
        meta: { perm: 'menu:myReports' }
      },
      {
        path: 'report-center/favorites',
        name: 'FavoritesManage',
        component: () => import('@/views/ReportCenter/FavoritesManage.vue'),
        meta: { perm: 'menu:favoritesManage' }
      },
      // ==================== 表样设计子页面 ====================
      {
        path: 'designer/templates',
        name: 'TemplateManage',
        component: () => import('@/views/ReportDesigner/TemplateManage.vue'),
        meta: { perm: 'template:manage' }
      },
      {
        path: 'designer/excel',
        name: 'ExcelDesigner',
        component: () => import('@/views/ReportDesigner/ExcelDesigner.vue'),
        meta: { perm: 'template:excelDesigner' }
      },
      {
        path: 'designer/datasets',
        name: 'DatasetManage',
        component: () => import('@/views/ReportDesigner/DatasetManage.vue'),
        meta: { perm: 'template:datasets' }
      },
      {
        path: 'designer/dictionary',
        name: 'DataDictionary',
        component: () => import('@/views/ReportDesigner/DataDictionary.vue'),
        meta: { perm: 'template:dictionary' }
      },
      {
        path: 'designer/params',
        name: 'ParamManage',
        component: () => import('@/views/ReportDesigner/ParamManage.vue'),
        meta: { perm: 'template:params' }
      },
      {
        path: 'designer/publish',
        name: 'PublishRecord',
        component: () => import('@/views/ReportDesigner/PublishRecord.vue'),
        meta: { perm: 'template:publish' }
      },
      {
        path: 'designer/versions',
        name: 'TemplateVersions',
        component: () => import('@/views/ReportDesigner/TemplateVersions.vue'),
        meta: { perm: 'template:versions' }
      },
      // ==================== 填报中心 ====================
      {
        path: 'entry',
        name: 'EntryCenter',
        component: () => import('@/views/EntryCenter/index.vue'),
        meta: { perm: 'menu:entryCenter' }
      },
      {
        path: 'entry/draft',
        name: 'EntryDraft',
        component: () => import('@/views/EntryCenter/index.vue'),
        meta: { perm: 'menu:draft' }
      },
      {
        path: 'entry/pending',
        name: 'EntryPending',
        component: () => import('@/views/EntryCenter/index.vue'),
        meta: { perm: 'menu:pending' }
      },
      {
        path: 'entry/submitted',
        name: 'EntrySubmitted',
        component: () => import('@/views/EntryCenter/index.vue'),
        meta: { perm: 'menu:submitted' }
      },
      {
        path: 'entry/rejected',
        name: 'EntryRejected',
        component: () => import('@/views/EntryCenter/index.vue'),
        meta: { perm: 'menu:rejected' }
      },
      {
        path: 'entry/completed',
        name: 'EntryCompleted',
        component: () => import('@/views/EntryCenter/index.vue'),
        meta: { perm: 'menu:completed' }
      },
      {
        path: 'entry/detail/:submitId',
        name: 'EntryDetail',
        component: () => import('@/views/EntryCenter/DataEntry.vue'),
        meta: { perm: 'menu:entryDetail', immersive: true }
      },
      // ==================== 审核中心 ====================
      {
        path: 'audit',
        name: 'AuditCenter',
        component: () => import('@/views/AuditCenter/index.vue'),
        meta: { perm: 'menu:auditCenter' }
      },
      {
        path: 'audit/approved',
        name: 'AuditApproved',
        component: () => import('@/views/AuditCenter/index.vue'),
        meta: { perm: 'menu:approved' }
      },
      {
        path: 'audit/rejected',
        name: 'AuditRejected',
        component: () => import('@/views/AuditCenter/index.vue'),
        meta: { perm: 'menu:auditRejected' }
      },
      {
        path: 'audit/initiated',
        name: 'AuditInitiated',
        component: () => import('@/views/AuditCenter/index.vue'),
        meta: { perm: 'menu:initiated' }
      },
      {
        path: 'audit/history',
        name: 'AuditHistory',
        component: () => import('@/views/AuditCenter/index.vue'),
        meta: { perm: 'menu:auditHistory' }
      },
      // ==================== 数据分析 ====================
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('@/views/Analytics/index.vue'),
        meta: { perm: 'menu:analytics' }
      },
      {
        path: 'analytics/trend',
        name: 'TrendAnalysis',
        component: () => import('@/views/Analytics/index.vue'),
        meta: { perm: 'menu:trend' }
      },
      {
        path: 'analytics/chart',
        name: 'ChartAnalysis',
        component: () => import('@/views/Analytics/index.vue'),
        meta: { perm: 'menu:chart' }
      },
      {
        path: 'analytics/export',
        name: 'DataExport',
        component: () => import('@/views/Analytics/index.vue'),
        meta: { perm: 'menu:export' }
      },
      // ==================== 个人中心 ====================
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile/index.vue'),
        meta: { perm: 'menu:profile' }
      },
      {
        path: 'profile/messages',
        name: 'MyMessages',
        component: () => import('@/views/Profile/index.vue'),
        meta: { perm: 'menu:messages' }
      },
      {
        path: 'profile/favorites',
        name: 'MyFavorites',
        component: () => import('@/views/Profile/index.vue'),
        meta: { perm: 'menu:myFavorites' }
      },
      {
        path: 'profile/password',
        name: 'ChangePassword',
        component: () => import('@/views/Profile/index.vue'),
        meta: { perm: 'menu:changePassword' }
      },
      {
        path: 'profile/logs',
        name: 'LoginLogs',
        component: () => import('@/views/Profile/index.vue'),
        meta: { perm: 'menu:loginLogs' }
      },
      // ==================== 工具 ====================
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
        path: 'admin/depts',
        name: 'DeptManage',
        component: () => import('@/views/Admin/OrgManage.vue'),
        meta: { perm: 'menu:deptManage' }
      },
      {
        path: 'admin/positions',
        name: 'PositionManage',
        component: () => import('@/views/Admin/UserManage.vue'),
        meta: { perm: 'menu:positionManage' }
      },
      {
        path: 'admin/roles',
        name: 'RoleManage',
        component: () => import('@/views/Admin/RoleManage.vue'),
        meta: { perm: 'menu:roleManage' }
      },
      {
        path: 'admin/perms',
        name: 'PermManage',
        component: () => import('@/views/Admin/RoleManage.vue'),
        meta: { perm: 'menu:permManage' }
      },
      {
        path: 'admin/datasource',
        name: 'DatasourceManage',
        component: () => import('@/views/Admin/DatasourceManage.vue'),
        meta: { perm: 'menu:datasource' }
      },
      {
        path: 'admin/params',
        name: 'ParamConfig',
        component: () => import('@/views/Admin/DatasourceManage.vue'),
        meta: { perm: 'menu:paramConfig' }
      },
      {
        path: 'admin/workflows',
        name: 'WorkflowManage',
        component: () => import('@/views/Admin/WorkflowManage.vue'),
        meta: { perm: 'menu:workflow' }
      },
      {
        path: 'admin/logs',
        name: 'LogCenter',
        component: () => import('@/views/Admin/LogView.vue'),
        meta: { perm: 'menu:logCenter' }
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

const whiteList = ['/login', '/forbidden']

router.beforeEach((to, from, next) => {
  const token = sessionStorage.getItem('rpt_token') || localStorage.getItem('rpt_token')

  if (token) {
    if (to.path === '/login') {
      next({ path: '/' })
      return
    }

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
