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
  {
    path: '/designer/formula',
    name: 'FormulaCenter',
    component: () => import('@/views/ReportDesigner/FormulaDesigner.vue'),
    meta: { perm: 'template:formula' }
  },
  {
    path: '/designer/formula/:code',
    name: 'FormulaCenterEdit',
    component: () => import('@/views/ReportDesigner/FormulaDesigner.vue'),
    meta: { perm: 'template:formula' }
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
        component: () => import('@/views/ReportCenter/index.vue'),
        meta: { perm: 'menu:myReports' }
      },
      {
        path: 'report-center/favorites',
        name: 'FavoritesManage',
        component: () => import('@/views/ReportCenter/index.vue'),
        meta: { perm: 'menu:favoritesManage' }
      },
      {
        path: 'report-center/recent',
        name: 'RecentReports',
        component: () => import('@/views/ReportCenter/index.vue'),
        meta: { perm: 'menu:recentAccess' }
      },
      // ==================== 表样设计子页面 ====================
      {
        path: 'designer/templates',
        name: 'TemplateManage',
        component: () => import('@/views/ReportDesigner/TemplateManage.vue'),
        meta: { perm: 'template:manage' }
      },
      {
        // 计划下发：选择计划模板 → 选择组织和期间 → 下发到下级组织
        path: 'designer/plan-assign',
        name: 'PlanAssign',
        component: () => import('@/views/TemplateCenter/PlanAssign.vue'),
        meta: { perm: 'menu:planAssign' }
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
      {
        path: 'designer/validation-rules',
        name: 'ValidationRules',
        component: () => import('@/views/ReportDesigner/ValidationRules.vue'),
        meta: { perm: 'template:manage' }
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
        path: 'entry/reported',
        name: 'EntryReported',
        component: () => import('@/views/EntryCenter/index.vue'),
        meta: { perm: 'menu:reported' }
      },
      // ==================== 计划上报（计划类模板填报入口） ====================
      {
        path: 'entry/plan-report',
        name: 'EntryPlanReport',
        component: () => import('@/views/EntryCenter/PlanReport.vue'),
        meta: { perm: 'menu:planReport' }
      },
      {
        path: 'entry/plan-detail/:submitId',
        name: 'EntryPlanDetail',
        component: () => import('@/views/ReportFill/index.vue'),
        props: true,
        meta: { perm: 'menu:planReport' }
      },
      {
        path: 'entry/detail/:submitId',
        name: 'EntryDetail',
        component: () => import('@/views/ReportFill/index.vue'),
        props: true,
        meta: { perm: 'menu:entryDetail' }
      },
      // ==================== 填报监控 ====================
      {
        path: 'monitor',
        name: 'MonitorProgress',
        component: () => import('@/views/Monitor/index.vue'),
        meta: { perm: 'menu:monitor' }
      },
      {
        path: 'report-status',
        name: 'ReportStatus',
        component: () => import('@/views/ReportStatus/index.vue'),
        meta: { perm: 'menu:reportStatus' }
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
        name: 'AuditCenterRejected',
        component: () => import('@/views/AuditCenter/index.vue'),
        meta: { perm: 'menu:auditCenter' }
      },
      {
        path: 'audit/reported',
        name: 'AuditCenterReported',
        component: () => import('@/views/AuditCenter/index.vue'),
        meta: { perm: 'menu:auditCenter' }
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
      // ==================== 数据汇总 ====================
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('@/views/Analytics/index.vue'),
        meta: { perm: 'menu:analytics' }
      },
      {
        path: 'analytics/production',
        name: 'ProductionAgg',
        component: () => import('@/views/Analytics/index.vue'),
        meta: { perm: 'menu:production' }
      },
      {
        path: 'analytics/finance',
        name: 'FinanceAgg',
        component: () => import('@/views/Analytics/index.vue'),
        meta: { perm: 'menu:finance' }
      },
      {
        path: 'analytics/safety',
        name: 'SafetyAgg',
        component: () => import('@/views/Analytics/index.vue'),
        meta: { perm: 'menu:safety' }
      },
      {
        path: 'analytics/energy',
        name: 'EnergyAgg',
        component: () => import('@/views/Analytics/index.vue'),
        meta: { perm: 'menu:energy' }
      },
      {
        path: 'analytics/cost',
        name: 'CostAgg',
        component: () => import('@/views/Analytics/index.vue'),
        meta: { perm: 'menu:cost' }
      },
      {
        path: 'analytics/comprehensive',
        name: 'ComprehensiveAgg',
        component: () => import('@/views/Analytics/index.vue'),
        meta: { perm: 'menu:comprehensive' }
      },
      {
        path: 'analytics/investment',
        name: 'InvestmentAgg',
        component: () => import('@/views/Analytics/index.vue'),
        meta: { perm: 'menu:investment' }
      },
      // ==================== 计划汇总 ====================
      {
        path: 'plan/annual',
        name: 'AnnualPlan',
        component: () => import('@/views/Analytics/index.vue'),
        meta: { perm: 'menu:annualPlan' }
      },
      {
        path: 'plan/batch',
        name: 'BatchPlan',
        component: () => import('@/views/Analytics/index.vue'),
        meta: { perm: 'menu:batchPlan' }
      },
      {
        path: 'plan/ledger',
        name: 'PlanLedger',
        component: () => import('@/views/Analytics/index.vue'),
        meta: { perm: 'menu:planLedger' }
      },
      {
        path: 'plan/completion',
        name: 'PlanCompletion',
        component: () => import('@/views/Analytics/index.vue'),
        meta: { perm: 'menu:planCompletion' }
      },
      // ==================== 数据分析 ====================
      {
        path: 'data-analysis',
        name: 'DataAnalysis',
        component: () => import('@/views/Analytics/index.vue'),
        meta: { perm: 'menu:dataAnalysis' }
      },
      // ==================== 数据大屏 ====================
      {
        path: 'dashboard',
        name: 'BigScreen',
        component: () => import('@/views/Analytics/index.vue'),
        meta: { perm: 'menu:dashboard' }
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
        path: 'admin/roles',
        name: 'RoleManage',
        component: () => import('@/views/Admin/RoleManage.vue'),
        meta: { perm: 'menu:roleManage' }
      },
      {
        path: 'admin/positions',
        name: 'PositionManage',
        component: () => import('@/views/Admin/PositionManage.vue'),
        meta: { perm: 'menu:positionManage' }
      },
      {
        path: 'admin/perms',
        name: 'PermManage',
        component: () => import('@/views/Admin/PermManage.vue'),
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
