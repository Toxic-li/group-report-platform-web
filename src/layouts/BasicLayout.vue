<template>
  <div class="basic-layout" :class="{ collapsed: sidebarCollapsed }">
    <!-- ==================== 侧边栏 ==================== -->
    <aside class="bl-sidebar">
      <!-- 品牌 Logo -->
      <div class="bl-brand" @click="$router.push('/')">
        <div class="bl-brand-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="5" fill="currentColor" opacity="0.15"/>
            <path d="M7 8h10M7 12h7M7 16h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <circle cx="17" cy="16" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/>
          </svg>
        </div>
        <transition name="fade">
          <div v-show="!sidebarCollapsed" class="bl-brand-text">
            <span class="bl-brand-name">集团报表平台</span>
            <span class="bl-brand-sub">Report Center</span>
          </div>
        </transition>
      </div>

      <!-- 导航菜单 -->
      <nav class="bl-nav">
        <template v-for="item in menuItems" :key="item.path">
          <!-- 分组标题 -->
          <div v-if="item.divider" v-show="!sidebarCollapsed" class="bl-nav-divider">
            {{ item.label }}
          </div>

          <!-- 可展开的分组 -->
          <template v-else-if="item.children">
            <div
              class="bl-nav-group"
              :class="{ active: isGroupActive(item.children) }"
              @click="toggleGroup(item.path)"
            >
              <span class="bl-nav-icon" v-html="item.icon"></span>
              <transition name="fade">
                <span v-show="!sidebarCollapsed" class="bl-nav-label">{{ item.label }}</span>
              </transition>
              <svg
                v-show="!sidebarCollapsed"
                class="bl-nav-arrow"
                :class="{ expanded: expandedGroups[item.path] || isGroupActive(item.children) }"
                width="12" height="12" viewBox="0 0 12 12" fill="none"
              >
                <path d="M4 3l4 3-4 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>

            <!-- 子菜单 -->
            <transition name="subnav">
              <div
                v-show="!sidebarCollapsed && (expandedGroups[item.path] || isGroupActive(item.children))"
                class="bl-subnav"
              >
                <router-link
                  v-for="child in item.children"
                  :key="child.path"
                  :to="child.path"
                  class="bl-subnav-item"
                  :class="{ active: isRouteActive(child.path) }"
                >
                  <span class="bl-subnav-dot"></span>
                  <span class="bl-subnav-label">{{ child.label }}</span>
                </router-link>
              </div>
            </transition>
          </template>

          <!-- 普通菜单项 -->
          <router-link
            v-else
            :to="item.path"
            class="bl-nav-item"
            :class="{ active: isRouteActive(item.path) }"
          >
            <span class="bl-nav-icon" v-html="item.icon"></span>
            <transition name="fade">
              <span v-show="!sidebarCollapsed" class="bl-nav-label">{{ item.label }}</span>
            </transition>
          </router-link>
        </template>
      </nav>

      <!-- 侧边栏底部 -->
      <div class="bl-sidebar-footer">
        <button class="bl-collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed">
          <svg
            width="16" height="16" viewBox="0 0 16 16" fill="none"
            :style="{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none' }"
          >
            <path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <transition name="fade">
            <span v-show="!sidebarCollapsed">收起菜单</span>
          </transition>
        </button>
      </div>
    </aside>

    <!-- ==================== 主区域 ==================== -->
    <div class="bl-main">
      <!-- 顶部栏 -->
      <header class="bl-topbar">
        <div class="bl-topbar-left">
          <span class="bl-breadcrumb">{{ pageTitle }}</span>
        </div>
        <div class="bl-topbar-right">
          <span class="bl-time">{{ currentTime }}</span>
          <el-dropdown trigger="click" @command="handleUserCommand">
            <div class="bl-user">
              <div class="bl-avatar">{{ userInitial }}</div>
              <span class="bl-username">{{ currentUser?.name || '用户' }}</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4 3l4 3-4 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                  </svg>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 内容区域 -->
      <main class="bl-content">
        <router-view v-slot="{ Component }">
          <transition name="route" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/userStore.js'
import { usePermission } from '@/composables/usePermission.js'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { hasPermission } = usePermission()

const sidebarCollapsed = ref(false)
const expandedGroups = reactive({})
const currentTime = ref('')

// ==================== 图标 SVG ====================
const ICONS = {
  dashboard: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  designer: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>',
  audit: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg>',
  tools: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>',
  settings: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
  users: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>',
  shield: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  building: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/><path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01"/></svg>',
  workflow: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><path d="M9 6h6a3 3 0 013 3v6"/></svg>',
  log: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>'
}

// ==================== 菜单配置 ====================
const allMenuItems = computed(() => {
  const items = [
    { path: '/', label: '报表中心', icon: ICONS.dashboard, perm: 'menu:reportCenter' },
    { path: '/designer', label: '报表设计', icon: ICONS.designer, perm: 'template:create' },
    { path: '/audit', label: '审核中心', icon: ICONS.audit, perm: 'menu:auditCenter' },
    { path: '/wordToExcel', label: 'Word转Excel', icon: ICONS.tools, perm: 'menu:wordToExcel' },
    { divider: true, label: '系统管理' },
    {
      path: 'admin',
      label: '系统管理',
      icon: ICONS.settings,
      perm: 'menu:admin',
      children: [
        { path: '/admin/users', label: '用户管理', perm: 'menu:userManage' },
        { path: '/admin/roles', label: '角色权限', perm: 'menu:roleManage' },
        { path: '/admin/orgs', label: '组织架构', perm: 'menu:orgManage' },
        { path: '/admin/workflows', label: '审批流程', perm: 'menu:workflow' },
        { path: '/admin/logs', label: '操作日志', perm: 'menu:logView' }
      ]
    }
  ]

  // 权限过滤
  return items.filter(item => {
    if (item.divider) return true
    if (!item.perm) return true
    // 开发模式：无权限数据时显示全部
    if (!userStore.permissions.length) return true
    if (item.children) {
      return item.children.some(c => !c.perm || hasPermission(c.perm))
    }
    return hasPermission(item.perm)
  })
})

const menuItems = computed(() => {
  const items = allMenuItems.value
  // 过滤掉权限不足的子项
  return items.map(item => {
    if (!item.children) return item
    const visibleChildren = item.children.filter(c => {
      if (!c.perm) return true
      if (!userStore.permissions.length) return true
      return hasPermission(c.perm)
    })
    return { ...item, children: visibleChildren.length > 0 ? visibleChildren : null }
  }).filter(item => !item.children || item.children)
})

// ==================== 页面标题 ====================
const pageTitle = computed(() => {
  const path = route.path
  if (path === '/') return '报表中心'
  if (path.startsWith('/admin/users')) return '用户管理'
  if (path.startsWith('/admin/roles')) return '角色权限'
  if (path.startsWith('/admin/orgs')) return '组织架构'
  if (path.startsWith('/admin/workflows')) return '审批流程'
  if (path.startsWith('/admin/logs')) return '操作日志'
  if (path.startsWith('/audit')) return '审核中心'
  if (path.startsWith('/wordToExcel')) return 'Word转Excel'
  if (path.startsWith('/designer')) return '报表设计'
  if (path.startsWith('/report/')) return '报表填报'
  return '集团报表平台'
})

// ==================== 当前用户 ====================
const currentUser = computed(() => {
  try {
    const userStr = sessionStorage.getItem('rpt_user') || localStorage.getItem('rpt_user')
    return userStr ? JSON.parse(userStr) : null
  } catch {
    return null
  }
})

const userInitial = computed(() => {
  const name = currentUser.value?.name || currentUser.value?.username || 'U'
  return name.charAt(0).toUpperCase()
})

// ==================== 路由激活检测 ====================
function isRouteActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function isGroupActive(children) {
  return children.some(c => isRouteActive(c.path))
}

// ==================== 分组展开 ====================
function toggleGroup(path) {
  expandedGroups[path] = !expandedGroups[path]
}

// ==================== 用户操作 ====================
async function handleUserCommand(command) {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '退出确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }

    try {
      const { logout: apiLogout } = await import('@/api/reportDesigner.js')
      await apiLogout()
    } catch (err) {
      console.warn('[Logout] 后端登出接口调用失败:', err)
    } finally {
      sessionStorage.removeItem('rpt_token')
      sessionStorage.removeItem('rpt_user')
      localStorage.removeItem('rpt_token')
      localStorage.removeItem('rpt_user')
      localStorage.removeItem('rpt_remember')
      localStorage.removeItem('rpt_last_user')
      router.push('/login')
    }
  }
}

// ==================== 时间 ====================
let timeTimer = null

function updateTime() {
  const now = new Date()
  const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  currentTime.value = `${dateStr} ${timeStr}`
}

onMounted(() => {
  updateTime()
  timeTimer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timeTimer) clearInterval(timeTimer)
})
</script>

<style lang="scss" scoped>
.basic-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--app-bg);

  // ==================== 侧边栏 ====================
  .bl-sidebar {
    width: var(--app-sidebar-width);
    min-width: var(--app-sidebar-width);
    background: var(--app-surface);
    border-right: 1px solid var(--app-border);
    display: flex;
    flex-direction: column;
    transition: width 0.25s ease, min-width 0.25s ease;
    z-index: var(--app-z-sidebar);
    box-shadow: 1px 0 8px rgba(0, 0, 0, 0.02);
  }

  &.collapsed .bl-sidebar {
    width: var(--app-sidebar-collapsed);
    min-width: var(--app-sidebar-collapsed);
  }

  // 品牌
  .bl-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 16px;
    height: var(--app-topbar-height);
    border-bottom: 1px solid var(--app-border-light);
    cursor: pointer;
    flex-shrink: 0;
    overflow: hidden;

    &:hover {
      background: var(--app-surface-hover);
    }
  }

  .bl-brand-icon {
    width: 32px;
    height: 32px;
    min-width: 32px;
    border-radius: 8px;
    background: var(--app-primary-bg);
    color: var(--app-primary);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .bl-brand-text {
    display: flex;
    flex-direction: column;
    line-height: 1.3;
    overflow: hidden;
  }

  .bl-brand-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--app-text-primary);
    white-space: nowrap;
  }

  .bl-brand-sub {
    font-size: 10px;
    color: var(--app-text-muted);
    letter-spacing: 1px;
    white-space: nowrap;
  }

  // 导航
  .bl-nav {
    flex: 1;
    padding: 8px;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .bl-nav-divider {
    padding: 12px 12px 4px;
    font-size: 11px;
    font-weight: 600;
    color: var(--app-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
  }

  .bl-nav-item,
  .bl-nav-group {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: var(--app-radius-sm);
    font-size: 13px;
    font-weight: 500;
    color: var(--app-text-secondary);
    text-decoration: none;
    cursor: pointer;
    transition: all var(--app-transition-fast);
    white-space: nowrap;
    position: relative;

    &:hover {
      background: var(--app-surface-hover);
      color: var(--app-text-primary);
    }

    &.active {
      background: var(--app-primary-bg);
      color: var(--app-primary);

      .bl-nav-icon {
        color: var(--app-primary);
      }
    }
  }

  .bl-nav-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    flex-shrink: 0;
    color: var(--app-text-muted);
    transition: color var(--app-transition-fast);
  }

  .bl-nav-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .bl-nav-arrow {
    color: var(--app-text-muted);
    transition: transform 0.2s ease;
    flex-shrink: 0;

    &.expanded {
      transform: rotate(90deg);
    }
  }

  // 子导航
  .bl-subnav {
    overflow: hidden;
    padding-left: 20px;
  }

  .bl-subnav-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: var(--app-radius-sm);
    font-size: 12px;
    color: var(--app-text-muted);
    text-decoration: none;
    transition: all var(--app-transition-fast);
    white-space: nowrap;

    &:hover {
      background: var(--app-surface-hover);
      color: var(--app-text-primary);
    }

    &.active {
      color: var(--app-primary);
      font-weight: 500;

      .bl-subnav-dot {
        background: var(--app-primary);
      }
    }
  }

  .bl-subnav-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--app-border-dark);
    flex-shrink: 0;
    transition: background var(--app-transition-fast);
  }

  // 侧边栏底部
  .bl-sidebar-footer {
    padding: 8px;
    border-top: 1px solid var(--app-border-light);
    flex-shrink: 0;
  }

  .bl-collapse-btn {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border: none;
    border-radius: var(--app-radius-sm);
    background: transparent;
    color: var(--app-text-muted);
    font-size: 12px;
    cursor: pointer;
    transition: all var(--app-transition-fast);
    white-space: nowrap;

    &:hover {
      background: var(--app-surface-hover);
      color: var(--app-text-secondary);
    }

    svg {
      flex-shrink: 0;
      transition: transform 0.25s ease;
    }
  }

  // ==================== 主区域 ====================
  .bl-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;
  }

  // 顶部栏
  .bl-topbar {
    height: var(--app-topbar-height);
    min-height: var(--app-topbar-height);
    background: var(--app-surface);
    border-bottom: 1px solid var(--app-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    z-index: var(--app-z-topbar);
    flex-shrink: 0;
  }

  .bl-topbar-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .bl-breadcrumb {
    font-size: 16px;
    font-weight: 600;
    color: var(--app-text-primary);
  }

  .bl-topbar-right {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .bl-time {
    font-size: 12px;
    color: var(--app-text-muted);
    font-variant-numeric: tabular-nums;
  }

  .bl-user {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    border-radius: 20px;
    cursor: pointer;
    transition: background var(--app-transition-fast);

    &:hover {
      background: var(--app-surface-hover);
    }
  }

  .bl-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--app-primary);
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .bl-username {
    font-size: 13px;
    color: var(--app-text-primary);
    font-weight: 500;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  // ==================== 内容区 ====================
  .bl-content {
    flex: 1;
    overflow: hidden;
    background: var(--app-bg);
  }

  // ==================== 过渡动画 ====================
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  .subnav-enter-active,
  .subnav-leave-active {
    transition: max-height 0.25s ease, opacity 0.2s ease;
    overflow: hidden;
    max-height: 300px;
  }
  .subnav-enter-from,
  .subnav-leave-to {
    max-height: 0;
    opacity: 0;
  }
}
</style>
