import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'ReportCenter',
    component: () => import('@/views/ReportCenter/index.vue')
  },
  {
    path: '/report/:templateId',
    name: 'ReportFill',
    component: () => import('@/views/ReportFill/index.vue'),
    props: true
  },
  {
    path: '/designer',
    name: 'ReportDesigner',
    component: () => import('@/views/ReportDesigner/index.vue')
  },
  {
    path: '/audit',
    name: 'AuditCenter',
    component: () => import('@/views/AuditCenter/index.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login/index.vue')
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
  // 获取 token（优先从 sessionStorage，其次 localStorage）
  const token = sessionStorage.getItem('rpt_token') || localStorage.getItem('rpt_token')
  
  if (token) {
    // 已登录状态
    if (to.path === '/login') {
      // 已登录用户访问登录页，重定向到首页
      next({ path: '/' })
    } else {
      next()
    }
  } else {
    // 未登录状态
    if (whiteList.includes(to.path)) {
      // 白名单页面，直接放行
      next()
    } else {
      // 非白名单页面，重定向到登录页，并记录目标地址
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    }
  }
})

export default router
