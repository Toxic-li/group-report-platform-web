<template>
  <div class="basic-layout" :class="{ collapsed: sidebarCollapsed, immersive: isImmersive }">
    <!-- ==================== 侧边栏 ==================== -->
    <aside class="bl-sidebar" v-show="!isImmersive">
      <!-- 品牌 Logo – 升级为品牌卡片 -->
      <div class="bl-brand" @click="$router.push('/')">
        <div class="bl-brand-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="2" width="20" height="20" rx="6" fill="var(--app-primary)" opacity="0.12"/>
            <path d="M8 9h8M8 13h6M8 17h4" stroke="var(--app-primary)" stroke-width="2" stroke-linecap="round"/>
            <circle cx="17" cy="17" r="3.5" stroke="var(--app-primary)" stroke-width="1.8" fill="none"/>
          </svg>
        </div>
        <transition name="fade">
          <div v-show="!sidebarCollapsed" class="bl-brand-text">
            <span class="bl-brand-name">集团报表平台</span>
            <span class="bl-brand-sub">Enterprise Reporting</span>
          </div>
        </transition>
      </div>

      <!-- 导航菜单 -->
      <nav class="bl-nav">
        <!-- 按分组遍历 -->
        <template v-for="(group, gIdx) in groupedMenuItems" :key="'g-' + gIdx">
          <!-- 分组标题 -->
          <div v-show="!sidebarCollapsed" class="bl-nav-section">
            <span class="bl-nav-section-label">{{ group.label }}</span>
          </div>

          <template v-for="item in group.items" :key="item.path">
            <!-- 含子菜单的一级菜单 -->
            <template v-if="item.children">
              <div
                class="bl-nav-group"
                :class="{ active: isGroupActive(item.children) }"
                @click="toggleGroup(item.path)"
                :title="sidebarCollapsed ? item.label : ''"
              >
                <span class="bl-nav-icon" v-html="item.icon"></span>
                <transition name="fade">
                  <span v-show="!sidebarCollapsed" class="bl-nav-label">{{ item.label }}</span>
                </transition>
                <svg
                  v-show="!sidebarCollapsed"
                  class="bl-nav-arrow"
                  :class="{ expanded: isGroupExpanded(item.path, item.children) }"
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                >
                  <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>

              <!-- 子菜单 – 缩进 + 左侧高亮条 -->
              <transition name="subnav-slide">
                <div
                  v-if="!sidebarCollapsed && isGroupExpanded(item.path, item.children)"
                  class="bl-subnav"
                >
                  <div class="bl-subnav-inner">
                    <router-link
                      v-for="child in item.children"
                      :key="child.path"
                      :to="child.path"
                      class="bl-subnav-item"
                      :class="{ active: isExactRouteActive(child.path) }"
                      @click="addRecent(child)"
                    >
                      <span class="bl-subnav-bar"></span>
                      <span class="bl-subnav-label">{{ child.label }}</span>
                    </router-link>
                  </div>
                </div>
              </transition>
            </template>

            <!-- 叶子菜单项 – 左侧高亮条 -->
            <router-link
              v-else
              :to="item.path"
              class="bl-nav-item"
              :class="{ active: isRouteActive(item.path) }"
              :title="sidebarCollapsed ? item.label : ''"
              @click="addRecent(item)"
            >
              <span class="bl-nav-accent"></span>
              <span class="bl-nav-icon" v-html="item.icon"></span>
              <transition name="fade">
                <span v-show="!sidebarCollapsed" class="bl-nav-label">{{ item.label }}</span>
              </transition>
            </router-link>
          </template>
        </template>

        <!-- ===== 收藏菜单 ===== -->
        <div v-show="!sidebarCollapsed && favoriteMenus.length > 0" class="bl-nav-section">
          <span class="bl-nav-section-label">⭐ 收藏</span>
        </div>
        <router-link
          v-for="fav in visibleFavorites"
          :key="'fav-' + fav.path"
          :to="fav.path"
          class="bl-nav-item bl-nav-item--compact"
          :class="{ active: isRouteActive(fav.path) }"
          :title="sidebarCollapsed ? fav.label : ''"
        >
          <span v-show="sidebarCollapsed" class="bl-nav-accent"></span>
          <span class="bl-nav-icon" v-show="sidebarCollapsed">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </span>
          <transition name="fade">
            <span v-show="!sidebarCollapsed" class="bl-nav-label bl-nav-label--compact">{{ fav.label }}</span>
          </transition>
        </router-link>

        <!-- ===== 最近访问 ===== -->
        <div v-show="!sidebarCollapsed && recentMenus.length > 0" class="bl-nav-section">
          <span class="bl-nav-section-label">🕐 最近访问</span>
        </div>
        <router-link
          v-for="rec in visibleRecents"
          :key="'rec-' + rec.path"
          :to="rec.path"
          class="bl-nav-item bl-nav-item--compact"
          :class="{ active: isRouteActive(rec.path) }"
          :title="sidebarCollapsed ? rec.label : ''"
          @click="addRecent(rec)"
        >
          <span v-show="sidebarCollapsed" class="bl-nav-accent"></span>
          <span class="bl-nav-icon" v-show="sidebarCollapsed">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </span>
          <transition name="fade">
            <span v-show="!sidebarCollapsed" class="bl-nav-label bl-nav-label--compact">{{ rec.label }}</span>
          </transition>
        </router-link>
      </nav>

      <!-- 侧边栏底部固定区域 -->
      <div class="bl-sidebar-footer">
        <router-link to="/profile" class="bl-footer-item" :title="sidebarCollapsed ? '个人中心' : ''">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <transition name="fade">
            <span v-show="!sidebarCollapsed">个人中心</span>
          </transition>
        </router-link>
        <a href="#" class="bl-footer-item" :title="sidebarCollapsed ? '帮助中心' : ''" @click.prevent>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <transition name="fade">
            <span v-show="!sidebarCollapsed">帮助中心</span>
          </transition>
        </a>
        <div class="bl-footer-version" v-show="!sidebarCollapsed">v2.0.0</div>
        <button class="bl-collapse-btn" @click="toggleSidebar" :title="sidebarCollapsed ? '展开菜单' : '收起菜单'">
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            :style="{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none' }"
          >
            <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
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
          <button class="bl-icon-btn bl-collapse-trigger" @click="toggleSidebar" :title="sidebarCollapsed ? '展开菜单' : '收起菜单'">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <nav class="bl-breadcrumb">
            <template v-for="(item, index) in breadcrumbItems" :key="index">
              <span
                class="bl-breadcrumb-item"
                :class="{ active: index === breadcrumbItems.length - 1 }"
                @click="navigateTo(item.path)"
              >{{ item.label }}</span>
              <svg
                v-if="index < breadcrumbItems.length - 1"
                class="bl-breadcrumb-sep"
                width="14" height="14" viewBox="0 0 24 24" fill="none"
              >
                <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </template>
          </nav>
        </div>
        <div class="bl-topbar-right">
          <button class="bl-search-btn" @click="toggleSearch">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <span>搜索</span>
            <kbd>Ctrl+K</kbd>
          </button>
          <span class="bl-time">{{ currentTime }}</span>
          <button class="bl-icon-btn" title="消息通知" @click="toggleMessage">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            <span v-if="unreadCount > 0" class="bl-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
          </button>
          <button class="bl-icon-btn" :title="isDark ? '切换浅色' : '切换深色'" @click="toggleTheme">
            <svg v-if="isDark" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
            </svg>
          </button>
          <el-dropdown trigger="click" @command="handleUserCommand">
            <div class="bl-user">
              <div class="bl-avatar">{{ userInitial }}</div>
              <span class="bl-username">{{ currentUser?.name || '用户' }}</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4 3l4 3-4 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <template #dropdown>
              <el-dropdown-item command="profile">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                个人中心
              </el-dropdown-item>
              <el-dropdown-item command="theme">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                </svg>
                {{ isDark ? '切换浅色模式' : '切换深色模式' }}
              </el-dropdown-item>
              <el-dropdown-item command="logout" divided>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
                退出登录
              </el-dropdown-item>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- ==================== 多页签 Tabs ==================== -->
      <div class="bl-tabs" v-show="!isImmersive">
        <div class="bl-tabs-scroll">
          <router-link
            v-for="tab in openTabs"
            :key="tab.path"
            :to="tab.path"
            class="bl-tab"
            :class="{ active: tab.path === route.path }"
          >
            <span class="bl-tab-dot" v-if="tab.path === route.path"></span>
            <span class="bl-tab-label">{{ tab.label }}</span>
            <span
              v-if="tab.closable"
              class="bl-tab-close"
              @click.prevent.stop="closeTab(tab.path)"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>
              </svg>
            </span>
          </router-link>
        </div>
        <div class="bl-tabs-actions" v-if="openTabs.length > 1">
          <el-dropdown trigger="click" @command="handleTabCommand">
            <button class="bl-icon-btn bl-tab-more" title="标签操作">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
              </svg>
            </button>
            <template #dropdown>
              <el-dropdown-item command="refresh">刷新当前页</el-dropdown-item>
              <el-dropdown-item command="closeOthers">关闭其他</el-dropdown-item>
              <el-dropdown-item command="closeAll">关闭全部</el-dropdown-item>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- ==================== 消息抽屉 ==================== -->
      <el-drawer v-model="messageVisible" title="消息通知" direction="rtl" size="380px" :z-index="2001">
        <div class="bl-message-list">
          <div v-for="msg in notifications" :key="msg.id" class="bl-message-item" :class="{ unread: !msg.read }">
            <div class="bl-message-icon" :class="msg.type">
              <svg v-if="msg.type === 'audit'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <svg v-else-if="msg.type === 'system'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            </div>
            <div class="bl-message-body">
              <div class="bl-message-title">{{ msg.title }}</div>
              <div class="bl-message-desc">{{ msg.desc }}</div>
              <div class="bl-message-time">{{ msg.time }}</div>
            </div>
          </div>
          <div v-if="notifications.length === 0" class="bl-message-empty">暂无消息</div>
        </div>
        <template #footer>
          <el-button text @click="markAllRead">全部已读</el-button>
        </template>
      </el-drawer>

      <!-- ==================== 全局搜索 Ctrl+K ==================== -->
      <div v-if="searchVisible" class="bl-search-modal" @click.self="searchVisible = false">
        <div class="bl-search-box">
          <div class="bl-search-input-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input ref="searchInputRef" v-model="searchKeyword" placeholder="搜索菜单、报表、模板..." @keydown.esc="searchVisible = false" @keydown.enter="goFirstResult" />
            <kbd>ESC</kbd>
          </div>
          <div class="bl-search-results">
            <div v-for="(r, i) in searchResults" :key="r.path" class="bl-search-result" :class="{ first: i === 0 }" @click="goTo(r.path)" @mouseenter="searchHoverIndex = i">
              <span class="bl-search-result-icon" v-html="r.icon"></span>
              <span class="bl-search-result-label">{{ r.label }}</span>
              <span class="bl-search-result-path">{{ r.group }}</span>
            </div>
            <div v-if="searchResults.length === 0" class="bl-search-empty">未找到匹配项</div>
          </div>
        </div>
      </div>

      <!-- 内容区域 -->
      <main class="bl-content">
        <router-view v-slot="{ Component }">
          <transition name="route" mode="out-in">
            <component :is="Component" :key="route.fullPath + refreshKey" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/userStore.js'
import { usePermission } from '@/composables/usePermission.js'
import { useNavigation } from '@/composables/useNavigation.js'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { hasPermission } = usePermission()
const { recordPath } = useNavigation()

const SIDEBAR_KEY = 'rpt_sidebar_collapsed'
const sidebarCollapsed = ref(localStorage.getItem(SIDEBAR_KEY) === '1')
const expandedGroups = reactive({})
const currentTime = ref('')

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem(SIDEBAR_KEY, sidebarCollapsed.value ? '1' : '0')
}

// ==================== 主题模式 ====================
const isDark = ref(false)

function applyTheme(dark) {
  document.documentElement.classList.toggle('dark', dark)
  isDark.value = dark
}

function toggleTheme() {
  const next = !isDark.value
  applyTheme(next)
  localStorage.setItem('rpt_theme', next ? 'dark' : 'light')
}

// ==================== 消息通知 ====================
const messageVisible = ref(false)
const notifications = ref([
  { id: 1, type: 'audit', title: '待审核任务', desc: '销售月报(2026年7月) 等待您审核', time: '10分钟前', read: false },
  { id: 2, type: 'system', title: '系统维护通知', desc: '系统将于本周日 02:00-04:00 进行维护', time: '2小时前', read: false },
  { id: 3, type: 'business', title: '填报截止提醒', desc: '财务季报将于明日 18:00 截止填报', time: '5小时前', read: false },
  { id: 4, type: 'business', title: '报表已发布', desc: '采购月报 V2.0 已发布', time: '昨天', read: true }
])

const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

function toggleMessage() {
  messageVisible.value = !messageVisible.value
}

function markAllRead() {
  notifications.value.forEach(n => { n.read = true })
}

// ==================== 全局搜索 Ctrl+K ====================
const searchVisible = ref(false)
const searchKeyword = ref('')
const searchInputRef = ref(null)
const searchHoverIndex = ref(0)

const searchResults = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase()
  const flat = []
  const collect = (items, groupLabel) => {
    items.forEach(it => {
      if (!it.label) return
      if (it.children) {
        it.children.forEach(c => flat.push({ path: c.path, label: c.label, group: it.label, icon: it.icon }))
      } else {
        flat.push({ path: it.path, label: it.label, group: groupLabel || it.label, icon: it.icon })
      }
    })
  }
  // collect from flat menuItems for search
  groupedMenuItems.value.forEach(g => collect(g.items, g.label))
  if (!kw) return flat.slice(0, 8)
  return flat.filter(r => r.label.toLowerCase().includes(kw) || r.group.toLowerCase().includes(kw)).slice(0, 8)
})

function toggleSearch() {
  searchVisible.value = !searchVisible.value
  if (searchVisible.value) {
    searchKeyword.value = ''
    nextTick(() => searchInputRef.value?.focus())
  }
}

function goTo(path) {
  searchVisible.value = false
  router.push(path)
}

function goFirstResult() {
  if (searchResults.value.length) goTo(searchResults.value[0].path)
}

// ==================== 多页签 Tabs ====================
const openTabs = ref([{ path: '/', label: '工作台', closable: false }])
const refreshKey = ref(0)

function closeTab(path) {
  const idx = openTabs.value.findIndex(t => t.path === path)
  if (idx === -1) return
  openTabs.value.splice(idx, 1)
  if (route.path === path) {
    const next = openTabs.value[idx] || openTabs.value[idx - 1] || openTabs.value[openTabs.value.length - 1]
    if (next) router.push(next)
  }
}

function handleTabCommand(cmd) {
  if (cmd === 'refresh') {
    refreshKey.value++
    return
  }
  if (cmd === 'closeOthers') {
    openTabs.value = openTabs.value.filter(t => t.path === route.path || !t.closable)
  } else if (cmd === 'closeAll') {
    openTabs.value = openTabs.value.filter(t => !t.closable)
    if (!openTabs.value.find(t => t.path === route.path)) {
      router.push('/')
    }
  }
}

const isImmersive = computed(() => {
  return route.meta?.immersive === true
})

// ==================== 图标 SVG（升级到 20-22px） ====================
const ICONS = {
  dashboard: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  designer: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>',
  audit: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg>',
  chart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>',
  entry: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
  profile: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  settings: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
  users: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>',
  shield: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  building: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4"/><path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01"/></svg>',
  workflow: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><path d="M9 6h6a3 3 0 013 3v6"/></svg>',
  log: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>',
  folder: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>',
  database: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
  key: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>',
  message: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
}

// ==================== 菜单分组结构 ====================
const allFlatMenuItems = computed(() => {
  const items = [
    { path: '/', label: '工作台', icon: ICONS.dashboard, perm: 'menu:dashboard', group: '工作' },
    {
      path: '/report-center',
      label: '报表中心',
      icon: ICONS.folder,
      perm: 'menu:reportCenter',
      group: '报表',
      children: [
        { path: '/report-center', label: '全部报表', perm: 'menu:reportCenter' },
        { path: '/report-center/my-reports', label: '我的报表', perm: 'menu:myReports' },
        { path: '/report-center/favorites', label: '收藏报表', perm: 'menu:favorites' },
        { path: '/report-center/recent', label: '最近访问', perm: 'menu:recentAccess' }
      ]
    },
    {
      path: '/designer',
      label: '表样设计',
      icon: ICONS.designer,
      perm: 'template:create',
      group: '报表',
      children: [
        { path: '/designer/templates', label: '模板管理', perm: 'template:manage' },
        { path: '/designer', label: '新建模板', perm: 'template:create' },
        { path: '/designer/excel', label: 'Excel设计器', perm: 'template:excelDesigner' },
        { path: '/designer/datasets', label: '数据集', perm: 'template:datasets' },
        { path: '/designer/dictionary', label: '数据字典', perm: 'template:dictionary' },
        { path: '/designer/params', label: '参数管理', perm: 'template:params' },
        { path: '/designer/publish', label: '发布记录', perm: 'template:publish' },
        { path: '/designer/versions', label: '模板版本', perm: 'template:versions' }
      ]
    },
    {
      path: '/entry',
      label: '填报中心',
      icon: ICONS.entry,
      perm: 'menu:entryCenter',
      group: '业务',
      children: [
        { path: '/entry', label: '我的填报', perm: 'menu:myEntry' },
        { path: '/entry/draft', label: '草稿箱', perm: 'menu:draft' },
        { path: '/entry/pending', label: '待提交', perm: 'menu:pending' },
        { path: '/entry/submitted', label: '已提交', perm: 'menu:submitted' },
        { path: '/entry/rejected', label: '已退回', perm: 'menu:rejected' },
        { path: '/entry/completed', label: '已完成', perm: 'menu:completed' }
      ]
    },
    {
      path: '/audit',
      label: '审核中心',
      icon: ICONS.audit,
      perm: 'menu:auditCenter',
      group: '业务',
      children: [
        { path: '/audit', label: '待审核', perm: 'menu:pendingAudit' },
        { path: '/audit/approved', label: '已审核', perm: 'menu:approved' },
        { path: '/audit/rejected', label: '已退回', perm: 'menu:auditRejected' },
        { path: '/audit/initiated', label: '我发起的', perm: 'menu:initiated' },
        { path: '/audit/history', label: '审核历史', perm: 'menu:auditHistory' }
      ]
    },
    {
      path: '/analytics',
      label: '数据分析',
      icon: ICONS.chart,
      perm: 'menu:analytics',
      group: '分析',
      children: [
        { path: '/analytics', label: '汇总分析', perm: 'menu:summary' },
        { path: '/analytics/trend', label: '趋势分析', perm: 'menu:trend' },
        { path: '/analytics/chart', label: '图表分析', perm: 'menu:chart' },
        { path: '/analytics/export', label: '数据导出', perm: 'menu:export' },
        { path: '/analytics/print', label: '数据打印', perm: 'menu:print' }
      ]
    },
    {
      path: '/admin',
      label: '系统管理',
      icon: ICONS.settings,
      perm: 'menu:admin',
      group: '管理',
      children: [
        { path: '/admin/users', label: '用户管理', perm: 'menu:userManage' },
        { path: '/admin/depts', label: '部门管理', perm: 'menu:deptManage' },
        { path: '/admin/positions', label: '岗位管理', perm: 'menu:positionManage' },
        { path: '/admin/roles', label: '角色管理', perm: 'menu:roleManage' },
        { path: '/admin/perms', label: '权限管理', perm: 'menu:permManage' },
        { path: '/admin/datasource', label: '数据源', perm: 'menu:datasource' },
        { path: '/admin/params', label: '参数配置', perm: 'menu:paramConfig' },
        { path: '/admin/logs', label: '日志中心', perm: 'menu:logCenter' }
      ]
    },
    {
      path: '/profile',
      label: '个人中心',
      icon: ICONS.profile,
      perm: 'menu:profile',
      group: '个人',
      children: [
        { path: '/profile', label: '我的信息', perm: 'menu:myInfo' },
        { path: '/profile/messages', label: '我的消息', perm: 'menu:messages' },
        { path: '/profile/favorites', label: '我的收藏', perm: 'menu:myFavorites' },
        { path: '/profile/password', label: '修改密码', perm: 'menu:changePassword' },
        { path: '/profile/logs', label: '登录日志', perm: 'menu:loginLogs' }
      ]
    }
  ]

  // 权限过滤
  return items.filter(item => {
    if (!item.perm) return true
    if (!userStore.permissions.length) return true
    if (item.children) {
      return item.children.some(c => !c.perm || hasPermission(c.perm))
    }
    return hasPermission(item.perm)
  }).map(item => {
    if (!item.children) return item
    const visibleChildren = item.children.filter(c => {
      if (!c.perm) return true
      if (!userStore.permissions.length) return true
      return hasPermission(c.perm)
    })
    return { ...item, children: visibleChildren.length > 0 ? visibleChildren : null }
  }).filter(item => !item.children || item.children)
})

// 按 group 字段分组
const groupedMenuItems = computed(() => {
  const groups = []
  const all = allFlatMenuItems.value
  all.forEach(item => {
    const groupName = item.group || '其他'
    let group = groups.find(g => g.label === groupName)
    if (!group) {
      group = { label: groupName, items: [] }
      groups.push(group)
    }
    group.items.push(item)
  })
  return groups
})

// ==================== 收藏 & 最近访问 ====================
const FAVORITES_KEY = 'rpt_nav_favorites'
const RECENTS_KEY = 'rpt_nav_recents'
const MAX_RECENTS = 5
const MAX_FAVORITES = 8

const favoriteMenus = ref(loadFromStorage(FAVORITES_KEY, []))
const recentMenus = ref(loadFromStorage(RECENTS_KEY, []))

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

function saveToStorage(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch { /* quota exceeded */ }
}

const visibleFavorites = computed(() => sidebarCollapsed.value ? [] : favoriteMenus.value.slice(0, MAX_FAVORITES))
const visibleRecents = computed(() => sidebarCollapsed.value ? [] : recentMenus.value.slice(0, MAX_RECENTS))

// 从后端拉取真实收藏/最近访问
import { queryFavoriteReports, queryRecentReports } from '@/api/reportCenter'

async function loadRemoteFavorites() {
  try {
    const data = await queryFavoriteReports({ page: 1, size: MAX_FAVORITES })
    const records = data?.records || data?.list || (Array.isArray(data) ? data : [])
    if (records.length > 0) {
      favoriteMenus.value = records.map(r => ({ path: '/report-center/detail/' + (r.id || r.templateId), label: r.templateName || r.name || '报表' }))
      saveToStorage(FAVORITES_KEY, favoriteMenus.value)
    }
  } catch { /* keep local cache */ }
}

async function loadRemoteRecents() {
  try {
    const data = await queryRecentReports({ page: 1, size: MAX_RECENTS })
    const records = data?.records || data?.list || (Array.isArray(data) ? data : [])
    if (records.length > 0) {
      recentMenus.value = records.map(r => ({ path: '/report-center/detail/' + (r.id || r.templateId), label: r.templateName || r.name || '报表' }))
      saveToStorage(RECENTS_KEY, recentMenus.value)
    }
  } catch { /* keep local cache */ }
}

// 将某个菜单路径加入收藏（保留本地逻辑作快速切换）
function toggleFavorite(item) {
  const idx = favoriteMenus.value.findIndex(f => f.path === item.path)
  if (idx >= 0) {
    favoriteMenus.value.splice(idx, 1)
  } else {
    favoriteMenus.value.unshift({ path: item.path, label: item.label })
    if (favoriteMenus.value.length > MAX_FAVORITES) favoriteMenus.value.pop()
  }
  saveToStorage(FAVORITES_KEY, favoriteMenus.value)
}

// 记录最近访问
function addRecent(item) {
  if (!item || !item.path || item.path === '/') return
  recentMenus.value = recentMenus.value.filter(r => r.path !== item.path)
  recentMenus.value.unshift({ path: item.path, label: item.label })
  if (recentMenus.value.length > MAX_RECENTS) recentMenus.value.pop()
  saveToStorage(RECENTS_KEY, recentMenus.value)
  // 异步同步到后端（如有 templateId）
  if (item.templateId) {
    import('@/api/reportCenter').then(({ recordRecentView }) => {
      recordRecentView(item.templateId).catch(() => {})
    })
  }
}

// ==================== 页面标题 ====================
const pageTitle = computed(() => {
  const path = route.path
  if (path === '/') return '工作台'
  if (path.startsWith('/report-center')) return '报表中心'
  if (path.startsWith('/admin/users')) return '用户管理'
  if (path.startsWith('/admin/depts')) return '部门管理'
  if (path.startsWith('/admin/positions')) return '岗位管理'
  if (path.startsWith('/admin/roles')) return '角色管理'
  if (path.startsWith('/admin/perms')) return '权限管理'
  if (path.startsWith('/admin/workflows')) return '工作流管理'
  if (path.startsWith('/admin/logs')) return '日志中心'
  if (path.startsWith('/admin/datasource')) return '数据源'
  if (path.startsWith('/admin/params')) return '参数配置'
  if (path.startsWith('/audit')) return '审核中心'
  if (path.startsWith('/analytics')) return '数据分析'
  if (path.startsWith('/profile')) return '个人中心'
  if (path.startsWith('/wordToExcel')) return 'Word转Excel'
  if (path.startsWith('/designer')) return '表样设计'
  if (path.startsWith('/report/')) return '报表填报'
  return '企业报表平台'
})

// ==================== 多页签自动追踪 ====================
watch(() => route.path, (path) => {
  if (isImmersive.value) return
  const exists = openTabs.value.find(t => t.path === path)
  if (!exists) {
    openTabs.value.push({ path, label: pageTitle.value, closable: path !== '/' })
  }
  // 记录导航历史用于安全返回
  recordPath(path)
}, { immediate: true })

// ==================== Breadcrumb ====================
const breadcrumbItems = computed(() => {
  const path = route.path
  const items = []

  if (path === '/') {
    items.push({ label: '工作台', path: '/' })
  } else if (path.startsWith('/report-center')) {
    items.push({ label: '工作台', path: '/' })
    items.push({ label: '报表中心', path: '/report-center' })
  } else if (path.startsWith('/admin/')) {
    items.push({ label: '工作台', path: '/' })
    items.push({ label: '系统管理', path: '/admin/users' })
    if (path.startsWith('/admin/users')) items.push({ label: '用户管理', path: '/admin/users' })
    if (path.startsWith('/admin/depts')) items.push({ label: '部门管理', path: '/admin/depts' })
    if (path.startsWith('/admin/positions')) items.push({ label: '岗位管理', path: '/admin/positions' })
    if (path.startsWith('/admin/roles')) items.push({ label: '角色管理', path: '/admin/roles' })
    if (path.startsWith('/admin/perms')) items.push({ label: '权限管理', path: '/admin/perms' })
    if (path.startsWith('/admin/datasource')) items.push({ label: '数据源', path: '/admin/datasource' })
    if (path.startsWith('/admin/params')) items.push({ label: '参数配置', path: '/admin/params' })
    if (path.startsWith('/admin/workflows')) items.push({ label: '工作流管理', path: '/admin/workflows' })
    if (path.startsWith('/admin/logs')) items.push({ label: '日志中心', path: '/admin/logs' })
  } else if (path.startsWith('/audit')) {
    items.push({ label: '工作台', path: '/' })
    items.push({ label: '审核中心', path: '/audit' })
  } else if (path.startsWith('/analytics')) {
    items.push({ label: '工作台', path: '/' })
    items.push({ label: '数据分析', path: '/analytics' })
  } else if (path.startsWith('/profile')) {
    items.push({ label: '工作台', path: '/' })
    items.push({ label: '个人中心', path: '/profile' })
  } else if (path.startsWith('/designer')) {
    items.push({ label: '工作台', path: '/' })
    items.push({ label: '表样设计', path: '/designer' })
  } else if (path.startsWith('/report/')) {
    items.push({ label: '工作台', path: '/' })
    items.push({ label: '报表填报', path: path })
  } else if (path.startsWith('/wordToExcel')) {
    items.push({ label: '工作台', path: '/' })
    items.push({ label: 'Word转Excel', path: '/wordToExcel' })
  }

  return items
})

function navigateTo(path) {
  router.push(path)
}

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
  return route.path === path || route.path.startsWith(path + '/')
}

function isExactRouteActive(path) {
  if (path === '/') return route.path === '/'
  return route.path === path
}

function isGroupActive(children) {
  return children.some(c => isRouteActive(c.path))
}

// ==================== 分组展开 ====================
function isGroupExpanded(path, children) {
  // 如果用户已经手动切换过，始终尊重用户选择
  if (expandedGroups[path] !== undefined) {
    return expandedGroups[path]
  }
  // 首次访问时，如果当前路由匹配，自动展开
  if (isGroupActive(children)) return true
  return false
}

function toggleGroup(path) {
  if (expandedGroups[path] === undefined) {
    const items = allFlatMenuItems.value
    const found = items.find(i => i.path === path)
    expandedGroups[path] = !isGroupActive(found?.children || [])
  } else {
    expandedGroups[path] = !expandedGroups[path]
  }
}

// ==================== 用户操作 ====================
async function handleUserCommand(command) {
  if (command === 'profile') {
    router.push('/profile')
    return
  }
  if (command === 'theme') {
    toggleTheme()
    return
  }
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

function onGlobalKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    toggleSearch()
  }
}

onMounted(() => {
  updateTime()
  timeTimer = setInterval(updateTime, 1000)

  const savedTheme = localStorage.getItem('rpt_theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    applyTheme(true)
  }

  window.addEventListener('keydown', onGlobalKeydown)
  // 异步加载远程收藏/最近访问
  loadRemoteFavorites()
  loadRemoteRecents()
})

onUnmounted(() => {
  if (timeTimer) clearInterval(timeTimer)
  window.removeEventListener('keydown', onGlobalKeydown)
})
</script>

<style lang="scss" scoped>
// ===== Sidebar Design Tokens =====
$sidebar-bg: #F7F9FC;
$sidebar-width: var(--app-sidebar-width, 240px);
$sidebar-collapsed: var(--app-sidebar-collapsed, 72px);
$brand-height: 52px;
$nav-item-gap: 10px;
$nav-item-radius: 12px;
$nav-l1-size: 15px;
$nav-l2-size: 13px;

.basic-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--app-bg);

  // ==================== 侧边栏 ====================
  .bl-sidebar {
    width: $sidebar-width;
    min-width: $sidebar-width;
    background: $sidebar-bg;
    border-right: 1px solid var(--app-border);
    display: flex;
    flex-direction: column;
    transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1),
                min-width 0.28s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: var(--app-z-sidebar);
  }

  &.collapsed .bl-sidebar {
    width: $sidebar-collapsed;
    min-width: $sidebar-collapsed;
  }

  // ===== 品牌 Logo – 48~56px 品牌卡片 =====
  .bl-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 18px;
    height: $brand-height;
    flex-shrink: 0;
    cursor: pointer;
    overflow: hidden;
    transition: padding 0.28s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover .bl-brand-icon {
      transform: scale(1.05);
      box-shadow: 0 2px 12px rgba(37, 99, 235, 0.18);
    }
  }

  &.collapsed .bl-brand {
    padding: 0 20px;
    justify-content: center;
  }

  .bl-brand-icon {
    width: 36px;
    height: 36px;
    min-width: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(24, 200, 255, 0.1));
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .bl-brand-text {
    display: flex;
    flex-direction: column;
    line-height: 1.35;
    overflow: hidden;
  }

  .bl-brand-name {
    font-size: 15px;
    font-weight: 700;
    color: var(--app-text-primary);
    white-space: nowrap;
    letter-spacing: 0.3px;
  }

  .bl-brand-sub {
    font-size: 10px;
    color: var(--app-text-muted);
    letter-spacing: 1.2px;
    white-space: nowrap;
    text-transform: uppercase;
  }

  // ===== 导航 =====
  .bl-nav {
    flex: 1;
    padding: 8px 10px;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    gap: 2px;

    &::-webkit-scrollbar { width: 0; }
  }

  // ===== 分组标题 =====
  .bl-nav-section {
    padding: 14px 12px 6px;
    flex-shrink: 0;
  }

  .bl-nav-section-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--app-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.8px;
    white-space: nowrap;
  }

  // ===== 一级菜单项（叶子 + 可展开分组） =====
  .bl-nav-item,
  .bl-nav-group {
    display: flex;
    align-items: center;
    gap: $nav-item-gap;
    padding: 0 12px;
    height: 40px;
    border-radius: $nav-item-radius;
    font-size: $nav-l1-size;
    font-weight: 600;
    color: var(--app-text-secondary);
    text-decoration: none;
    cursor: pointer;
    transition: all 0.18s ease;
    white-space: nowrap;
    position: relative;
    flex-shrink: 0;

    &:hover {
      background: rgba(37, 99, 235, 0.06);
      color: var(--app-text-primary);
    }

    &.active {
      background: linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(37, 99, 235, 0.06));
      color: var(--app-primary);
      box-shadow: 0 1px 4px rgba(37, 99, 235, 0.08);

      .bl-nav-accent {
        opacity: 1;
        transform: scaleY(1);
      }
    }
  }

  .bl-nav-item--compact {
    height: 32px;
    font-size: 13px;
    font-weight: 400;
    padding: 0 12px;
  }

  // 左侧高亮指示条
  .bl-nav-accent {
    position: absolute;
    left: 0;
    top: 8px;
    bottom: 8px;
    width: 3px;
    background: var(--app-primary);
    border-radius: 0 3px 3px 0;
    opacity: 0;
    transform: scaleY(0);
    transition: all 0.22s ease;
  }

  // 图标
  .bl-nav-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    color: var(--app-text-muted);
    transition: color 0.18s;

    .bl-nav-item.active &,
    .bl-nav-group.active & {
      color: var(--app-primary);
    }
  }

  .bl-nav-label {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .bl-nav-label--compact {
    font-size: 13px;
    font-weight: 400;
  }

  // 箭头
  .bl-nav-arrow {
    color: var(--app-text-muted);
    transition: transform 0.22s ease;
    flex-shrink: 0;

    &.expanded {
      transform: rotate(90deg);
    }
  }

  // ===== 二级菜单 – 缩进 + 左侧高亮条 =====
  .bl-subnav {
    display: grid;
    grid-template-rows: 1fr;
  }

  .bl-subnav-inner {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-left: 14px;
  }

  .bl-subnav-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 12px 0 8px;
    height: 34px;
    border-radius: 10px;
    font-size: $nav-l2-size;
    font-weight: 400;
    color: var(--app-text-secondary);
    text-decoration: none;
    transition: background 0.16s ease, color 0.16s ease;
    white-space: nowrap;
    position: relative;

    &:hover {
      background: rgba(37, 99, 235, 0.05);
      color: var(--app-text-primary);

      .bl-subnav-bar {
        opacity: 0.6;
      }
    }

    &.active {
      background: linear-gradient(90deg, rgba(37, 99, 235, 0.08), transparent);
      color: var(--app-primary);
      font-weight: 500;

      .bl-subnav-bar {
        opacity: 1;
        background: var(--app-primary);
      }
    }
  }

  // 二级菜单左侧高亮条
  .bl-subnav-bar {
    width: 3px;
    height: 16px;
    border-radius: 0 2px 2px 0;
    background: var(--app-border-dark);
    flex-shrink: 0;
    opacity: 0.45;
    transition: opacity 0.18s ease, background 0.18s ease;
  }

  .bl-subnav-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  // ===== 侧边栏底部固定区域 =====
  .bl-sidebar-footer {
    flex-shrink: 0;
    border-top: 1px solid var(--app-border-light);
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .bl-footer-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 12px;
    height: 36px;
    border-radius: 10px;
    color: var(--app-text-secondary);
    font-size: 13px;
    font-weight: 400;
    text-decoration: none;
    transition: all 0.16s ease;
    white-space: nowrap;

    &:hover {
      background: rgba(37, 99, 235, 0.06);
      color: var(--app-primary);
    }

    svg {
      flex-shrink: 0;
      color: var(--app-text-muted);
      transition: color 0.16s;
    }

    &:hover svg { color: var(--app-primary); }
  }

  .bl-footer-version {
    text-align: center;
    font-size: 10px;
    color: var(--app-text-muted);
    padding: 4px 0 0;
    opacity: 0.5;
  }

  .bl-collapse-btn {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 12px;
    height: 36px;
    border: none;
    border-radius: 10px;
    background: transparent;
    color: var(--app-text-muted);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.16s ease;
    white-space: nowrap;

    &:hover {
      background: rgba(37, 99, 235, 0.06);
      color: var(--app-text-secondary);
    }

    svg {
      flex-shrink: 0;
      transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
    }
  }

  // ===== Collapse State =====
  &.collapsed {
    .bl-nav-item,
    .bl-nav-group {
      justify-content: center;
      padding: 0;
      height: 40px;
      width: 48px;
      margin: 0 auto;
      border-radius: 12px;
      gap: 0;
    }

    .bl-nav-item--compact {
      display: none;
    }

    .bl-nav-icon {
      min-width: 20px;
    }

    .bl-footer-item {
      justify-content: center;
      padding: 0;

      span { display: none; }
    }

    .bl-footer-version { display: none; }

    .bl-collapse-btn {
      justify-content: center;
      padding: 0;

      span { display: none; }
    }
  }

  // ===== 过渡动画 – 使用 :deep() 避免 scoped 选择器阻断 Vue Transition 类名 =====
  :deep(.fade-enter-active),
  :deep(.fade-leave-active) {
    transition: opacity 0.2s ease;
  }
  :deep(.fade-enter-from),
  :deep(.fade-leave-to) {
    opacity: 0;
  }

  // 子菜单展开/收起 – 使用 grid-template-rows 实现 GPU 加速的高度动画，避免 max-height 导致的 layout thrashing
  :deep(.subnav-slide-enter-from),
  :deep(.subnav-slide-leave-to) {
    &.bl-subnav {
      grid-template-rows: 0fr;
      opacity: 0;
    }
  }
  :deep(.subnav-slide-enter-active) {
    &.bl-subnav {
      transition: grid-template-rows 0.22s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.18s ease;
    }
  }
  :deep(.subnav-slide-leave-active) {
    &.bl-subnav {
      transition: grid-template-rows 0.18s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s ease;
    }
  }

  // ==================== 主区域 ====================
  .bl-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;
    background: #fff;
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
    flex: 1;
    overflow: hidden;
  }

  .bl-breadcrumb {
    display: flex;
    align-items: center;
    gap: 4px;
    overflow: hidden;
  }

  .bl-breadcrumb-item {
    font-size: 14px;
    color: var(--app-text-secondary);
    cursor: pointer;
    transition: color 0.2s;
    white-space: nowrap;

    &:hover {
      color: var(--app-primary);
    }

    &.active {
      font-weight: 600;
      color: var(--app-text-primary);
    }
  }

  .bl-breadcrumb-sep {
    color: var(--app-text-muted);
    flex-shrink: 0;
  }

  .bl-topbar-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .bl-search-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border: 1px solid var(--app-border);
    border-radius: var(--app-radius-sm);
    background: var(--app-surface);
    color: var(--app-text-secondary);
    font-size: 12px;
    cursor: pointer;
    transition: all var(--app-transition-fast);

    &:hover {
      border-color: var(--app-primary);
      color: var(--app-primary);
      background: var(--app-primary-bg);
    }

    kbd {
      padding: 1px 4px;
      background: var(--app-surface-hover);
      border-radius: 3px;
      font-size: 11px;
      font-family: monospace;
      color: var(--app-text-muted);
    }
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
    overflow-y: auto;
    overflow-x: hidden;
    background: var(--app-bg);
  }

  // ==================== 顶栏图标按钮 ====================
  .bl-icon-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: var(--app-radius-sm);
    background: transparent;
    color: var(--app-text-secondary);
    cursor: pointer;
    transition: all var(--app-transition-fast);
    flex-shrink: 0;

    &:hover {
      background: var(--app-surface-hover);
      color: var(--app-primary);
    }
  }

  .bl-badge {
    position: absolute;
    top: 2px;
    right: 2px;
    min-width: 16px;
    height: 16px;
    padding: 0 5px;
    border-radius: 8px;
    background: var(--app-danger);
    color: #fff;
    font-size: 10px;
    font-weight: 600;
    line-height: 16px;
    text-align: center;
  }

  // ==================== 内容动画 ====================
  .route-enter-active,
  .route-leave-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
  }
  .route-enter-from { opacity: 0; transform: translateY(4px); }
  .route-leave-to { opacity: 0; transform: translateY(-4px); }

  // ==================== 全局搜索 ====================
  .bl-search-modal {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.25);
    display: flex;
    justify-content: center;
    padding-top: 12vh;
    z-index: 3000;
    backdrop-filter: blur(4px);
  }

  .bl-search-box {
    width: 560px;
    max-height: 480px;
    background: var(--app-surface);
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
    overflow: hidden;
    border: 1px solid var(--app-border);
  }

  .bl-search-input-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--app-border);

    svg { color: var(--app-text-muted); flex-shrink: 0; }

    input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 15px;
      color: var(--app-text-primary);
      background: transparent;
      &::placeholder { color: var(--app-text-muted); }
    }

    kbd {
      font-size: 11px;
      padding: 2px 6px;
      background: var(--app-surface-hover);
      border-radius: 4px;
      color: var(--app-text-muted);
      font-family: monospace;
    }
  }

  .bl-search-empty {
    padding: 40px;
    text-align: center;
    font-size: 14px;
    color: var(--app-text-muted);
  }

  .bl-search-result {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 20px;
    cursor: pointer;
    transition: background 0.12s;

    &:hover,
    &.first { background: var(--app-surface-hover); }
  }

  .bl-search-result-icon {
    color: var(--app-text-muted);
    display: flex;
  }

  .bl-search-result-label {
    font-size: 14px;
    color: var(--app-text-primary);
    flex: 1;
  }

  .bl-search-result-path {
    font-size: 11px;
    color: var(--app-text-muted);
  }

  // ==================== Tabs ====================
  .bl-tabs {
    display: flex;
    align-items: center;
    height: 40px;
    min-height: 40px;
    background: var(--app-surface);
    border-bottom: 1px solid var(--app-border);
    flex-shrink: 0;
    overflow: hidden;
  }

  .bl-tabs-scroll {
    flex: 1;
    display: flex;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 0 8px;
    gap: 2px;
    &::-webkit-scrollbar { width: 0; height: 0; }
  }

  .bl-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 14px;
    height: 32px;
    border-radius: 8px;
    font-size: 12px;
    color: var(--app-text-secondary);
    text-decoration: none;
    white-space: nowrap;
    transition: all 0.15s;
    position: relative;
    flex-shrink: 0;

    &:hover { background: var(--app-surface-hover); }
    &.active {
      background: var(--app-primary-bg);
      color: var(--app-primary);
      font-weight: 500;
    }
  }

  .bl-tab-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--app-primary);
  }

  .bl-tab-label { max-width: 140px; overflow: hidden; text-overflow: ellipsis; }
  .bl-tab-close {
    width: 16px; height: 16px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 4px;
    opacity: 0;
    &:hover { background: var(--app-surface-hover); opacity: 1; }
  }
  .bl-tab:hover .bl-tab-close { opacity: 1; }

  .bl-tabs-actions {
    padding: 0 8px;
    border-left: 1px solid var(--app-border-light);
    margin-left: 4px;
  }

  // ==================== 消息通知 ====================
  .bl-message-list {
    padding: 0;
  }
  .bl-message-item {
    display: flex;
    gap: 12px;
    padding: 16px;
    border-bottom: 1px solid var(--app-border-light);
    cursor: pointer;
    transition: background 0.15s;

    &:hover { background: var(--app-surface-hover); }
    &.unread { background: rgba(37, 99, 235, 0.02); }
  }
  .bl-message-icon {
    width: 36px; height: 36px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    color: var(--app-text-secondary);

    &.audit { background: rgba(255,176,32,0.1); color: var(--app-warning); }
    &.system { background: rgba(22,119,255,0.1); color: var(--app-primary); }
    &.business { background: rgba(0,181,120,0.1); color: var(--app-success); }
  }
  .bl-message-body { flex: 1; min-width: 0; }
  .bl-message-title { font-size: 14px; font-weight: 500; }
  .bl-message-desc { font-size: 12px; color: var(--app-text-secondary); margin-top: 4px; }
  .bl-message-time { font-size: 11px; color: var(--app-text-muted); margin-top: 6px; }
  .bl-message-empty { padding: 60px; text-align: center; color: var(--app-text-muted); }

  // ==================== 沉浸模式 ====================
  &.immersive {
    .bl-topbar, .bl-tabs { display: none; }
  }
}

// ===== 暗色模式侧边栏 =====
:global(html.dark) .basic-layout .bl-sidebar {
  background: #1a1d23;
  border-right-color: rgba(255,255,255,0.06);
}

:global(html.dark) .bl-main {
  background: #141518;
}
</style>
