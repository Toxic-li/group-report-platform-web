<template>
  <div class="admin-layout">
    <!-- 左侧导航 -->
    <aside class="al-sidebar">
      <div class="als-brand" @click="$router.push('/')">
        <span class="als-logo">煤</span>
        <span class="als-title">管理后台</span>
      </div>
      <nav class="als-nav">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="als-nav-item"
          :class="{ active: $route.path.startsWith(item.path) }"
        >
          <span class="als-nav-icon">{{ item.icon }}</span>
          <span class="als-nav-label">{{ item.label }}</span>
        </router-link>
      </nav>
      <div class="als-footer">
        <button class="als-back" @click="$router.push('/')">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          返回报表中心
        </button>
      </div>
    </aside>

    <!-- 右侧内容 -->
    <main class="al-main">
      <header class="alm-header">
        <h2 class="alm-title">{{ currentPageTitle }}</h2>
        <div class="alm-right">
          <span class="alm-user">{{ userStore.userName }}</span>
          <button class="alm-logout" @click="handleLogout">退出登录</button>
        </div>
      </header>
      <div class="alm-body">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/userStore.js'
import { usePermission } from '@/composables/usePermission.js'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { hasPermission } = usePermission()

const allMenuItems = [
  { path: '/admin/users',     icon: '👤', label: '用户管理',   perm: 'menu:userManage' },
  { path: '/admin/roles',     icon: '🔐', label: '角色权限',   perm: 'menu:roleManage' },
  { path: '/admin/orgs',      icon: '🏢', label: '组织架构',   perm: 'menu:orgManage' },
  { path: '/admin/workflows', icon: '📋', label: '审批流程',   perm: 'menu:workflow' },
  { path: '/admin/logs',      icon: '📜', label: '操作日志',   perm: 'menu:logView' }
]

const menuItems = computed(() => {
  // 开发模式：无权限数据时显示全部菜单；正式环境按权限过滤
  if (!userStore.permissions.length) return allMenuItems
  return allMenuItems.filter(m => hasPermission(m.perm))
})

const titleMap = {
  '/admin/users': '用户管理',
  '/admin/roles': '角色权限管理',
  '/admin/orgs': '组织架构管理',
  '/admin/workflows': '审批流程管理',
  '/admin/logs': '操作日志'
}
const currentPageTitle = computed(() => {
  for (const [path, title] of Object.entries(titleMap)) {
    if (route.path.startsWith(path)) return title
  }
  return '管理后台'
})

async function handleLogout() {
  await userStore.logout()
  router.push('/login')
}
</script>

<style lang="scss" scoped>
.admin-layout { display: flex; height: 100vh; background: #F3F4F6; }

.al-sidebar {
  width: 200px; background: #1E293B; color: #CBD5E1;
  display: flex; flex-direction: column; flex-shrink: 0;
}
.als-brand {
  display: flex; align-items: center; gap: 10px; padding: 16px;
  border-bottom: 1px solid #334155; cursor: pointer;
  &:hover { background: rgba(255,255,255,.05); }
}
.als-logo {
  width: 36px; height: 36px; border-radius: 8px;
  background: #3B82F6; color: #fff; font-weight: 700; font-size: 16px;
  display: flex; align-items: center; justify-content: center;
}
.als-title { font-size: 15px; font-weight: 600; color: #F1F5F9; }

.als-nav { flex: 1; padding: 8px; display: flex; flex-direction: column; gap: 2px; }
.als-nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 6px; font-size: 13px;
  text-decoration: none; color: #94A3B8; transition: all .15s;
  &:hover { background: #334155; color: #E2E8F0; }
  &.active { background: #3B82F6; color: #fff; }
}
.als-nav-icon { font-size: 16px; }
.als-nav-label { font-weight: 500; }

.als-footer { padding: 12px; border-top: 1px solid #334155; }
.als-back {
  width: 100%; display: flex; align-items: center; gap: 6px;
  padding: 8px 12px; border-radius: 6px; border: 1px solid #334155;
  background: transparent; color: #94A3B8; font-size: 12px; cursor: pointer;
  &:hover { background: #334155; color: #E2E8F0; }
}

.al-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.alm-header {
  display: flex; align-items: center; justify-content: space-between;
  height: 52px; padding: 0 20px; background: #fff; border-bottom: 1px solid #E5E7EB;
}
.alm-title { font-size: 16px; font-weight: 600; color: #111827; margin: 0; }
.alm-right { display: flex; align-items: center; gap: 12px; }
.alm-user { font-size: 13px; color: #64748B; }
.alm-logout {
  padding: 5px 12px; border-radius: 4px; border: 1px solid #E5E7EB;
  background: #fff; font-size: 12px; color: #EF4444; cursor: pointer;
  &:hover { background: #FEF2F2; border-color: #FECACA; }
}
.alm-body { flex: 1; padding: 20px; overflow-y: auto; }
</style>
