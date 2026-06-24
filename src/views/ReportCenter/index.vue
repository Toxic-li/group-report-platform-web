<template>
  <div class="report-platform">
    <!-- ==================== 顶部导航栏 ==================== -->
    <header class="platform-header">
      <div class="header-left">
        <div class="platform-logo">煤</div>
        <span class="platform-title">集团统计报表平台</span>
        <span class="platform-subtitle">煤炭生产销售与库存管理系统</span>
      </div>

      <nav class="header-nav">
        <a
          v-for="item in navItems"
          :key="item.key"
          :class="['nav-item', { active: activeNav === item.key }]"
          @click="handleNavClick(item)"
        >
          {{ item.label }}
        </a>
      </nav>

      <div class="header-right">
        <span class="header-time">{{ currentTime }}</span>
        <div class="header-user">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
          <span>{{ currentUser?.name || '管理员' }}</span>
        </div>
        <button class="logout-btn" @click="handleLogout">退出</button>
      </div>
    </header>

    <!-- ==================== 报表信息栏 ==================== -->
    <ReportHeader />

    <!-- ==================== 工具栏 ==================== -->
    <Toolbar />

    <!-- ==================== Univer 报表工作区 ==================== -->
    <main class="univer-workarea">
      <!-- 模板中心（报表选择） -->
      <section v-if="activeNav === 'report'" class="template-center">
        <div class="tc-header">
          <h2>报表模板中心</h2>
          <p class="tc-desc">选择报表模板进入填报页面，所有报表通过配置动态生成</p>
        </div>
        <div class="template-grid">
          <!-- 新建报表入口 -->
          <router-link to="/designer" class="template-card tc-new-card">
            <span class="tc-icon tc-add-icon">+</span>
            <h3 class="tc-name">新建报表</h3>
            <span class="tc-code">可视化设计</span>
            <span class="tc-category cat-custom">设计器</span>
            <span class="tc-link">点击创建报表 →</span>
          </router-link>

          <!-- 已有模板 -->
          <router-link
            v-for="tpl in allTemplates"
            :key="tpl.id"
            :to="tpl._isPublishedApi ? `/report/CUSTOM-${tpl.code || tpl.id}` : `/report/${tpl.id}`"
            class="template-card"
            :class="{ 'tc-published-api': tpl._isPublishedApi }"
          >
            <span class="tc-icon" v-if="tpl._isPublishedApi">📊</span>
            <span class="tc-icon" v-else>{{ tpl.icon }}</span>
            <h3 class="tc-name">{{ tpl.name }}</h3>
            <span class="tc-code">{{ tpl.code }}</span>
            <span class="tc-category" :class="'cat-' + (tpl.category || 'custom')">{{ getCategoryLabel(tpl.category || 'custom') }}</span>
            <span class="tc-link">点击进入填报 →</span>
            <div class="tpl-badge" v-if="tpl._isPublishedApi">API</div>
          </router-link>
        </div>
      </section>

      <!-- 旧版报表（兼容） -->
      <UniverReport v-if="activeNav !== 'report'" ref="univerRef" :key="'univer-' + activeNav" />
      
      <!-- 集团汇总面板（浮动） -->
      <Transition name="slide">
        <aside 
          v-if="store.showGroupPanel || store.viewMode === 'group'" 
          class="subsidiary-panel"
        >
          <h3 class="panel-title">子公司填报状态</h3>
          
          <!-- 统计概览 -->
          <div class="panel-stats" style="margin-bottom: 12px; padding: 8px; background: #f8fafc; border-radius: 6px; font-size: 11px;">
            <div style="display:flex; justify-content:space-between;">
              <span>总计: <b>{{ store.statistics.total }}</b></span>
              <span style="color:#52C41A;">已通过: <b>{{ store.statistics.approved }}</b></span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:4px;">
              <span style="color:#FAAD14;">待填报: <b>{{ store.statistics.draft }}</b></span>
              <span>完成率: <b>{{ store.statistics.completionRate }}%</b></span>
            </div>
          </div>

          <div
            v-for="sub in store.subsidiaries"
            :key="sub.id"
            :class="['subsidiary-item', { active: sub.id === store.currentSubsidiaryId }]"
            @click="store.selectSubsidiary(sub.id)"
          >
            <span class="sub-name">{{ sub.name }}</span>
            <span 
              :class="['sub-status', `status-badge--${sub.status}`]"
              style="font-size:10px;padding:1px 6px;"
            >
              {{ getStatusLabel(sub.status) }}
            </span>
          </div>
        </aside>
      </Transition>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted , computed } from 'vue'
import { useRouter } from 'vue-router'
import { useReportStore } from '@/stores/reportStore.js'
import ReportHeader from '@/components/ReportHeader.vue'
import Toolbar from '@/components/Toolbar.vue'
import UniverReport from '@/components/UniverReport.vue'
import { getTemplateList } from '@/mock/templates.js'
import { getPublishedTemplates } from '@/api/reportDesigner.js'

const store = useReportStore()
const router = useRouter()
const univerRef = ref(null)
const currentTime = ref('')
const activeNav = ref('report')

/** ✅ 当前登录用户信息 */
const currentUser = computed(() => {
  try {
    const userStr = sessionStorage.getItem('rpt_user') || localStorage.getItem('rpt_user')
    return userStr ? JSON.parse(userStr) : null
  } catch {
    return null
  }
})

// 模板列表（原有模板 + 已发布API模板）
const originalTemplates = ref([])
const publishedTemplates = ref([])
const allTemplates = computed(() => [
  // 原有模板
  ...originalTemplates.value,
  // 已发布模板
  ...publishedTemplates.value.map(tpl => ({
    ...tpl,
    _isPublishedApi: true  // 标记为API发布的模板
  }))
])

// 加载模板数据
async function loadTemplates() {
  // 加载原有模板
  originalTemplates.value = getTemplateList()
  
  // 加载已发布模板
  try {
    console.log('开始加载已发布模板...')
    const res = await getPublishedTemplates()
    console.log('API响应:', res)

    // ✅ 兼容多种数据格式：res.data / res.list / res本身
    let templates = []
    if (res && Array.isArray(res)) {
      templates = res
    } else if (res && res.data) {
      templates = res.data
    } else if (res && res.list) {
      templates = res.list
    }

    console.log(`解析到 ${templates.length} 个模板`)

    // ✅ 数据转换：统一为前端标准格式
    publishedTemplates.value = templates.map(tpl => ({
      id: String(tpl.id || ''),          // 统一转为字符串
      code: tpl.code || '',
      name: tpl.name || '未命名报表',
      templateType: tpl.templateType,
      description: tpl.description || '',
      category: tpl.category || 'custom',
      icon: tpl.icon || '📊',
      version: tpl.version || 2,
      status: tpl.status || 'published',
      rowTree: tpl.rowTree || [],
      columnTree: transformColumnTree(tpl.columnTree || []),  // ✅ 转换列树
      metrics: tpl.metrics || [],
      layout: tpl.layout || getDefaultLayout(),
      _rawData: tpl  // 保留原始数据
    }))

    console.log('已发布模板加载成功:', publishedTemplates.value.length)

    // ✅ 关键：将API模板缓存到全局（供填报页面使用）
    if (publishedTemplates.value.length > 0) {
      window.__V2_TEMPLATES = window.__V2_TEMPLATES || {}
      publishedTemplates.value.forEach(tpl => {
        const code = tpl.code || tpl.id
        if (!code) return

        // 缓存多种格式
        window.__V2_TEMPLATES[`CUSTOM-${code}`] = tpl
        window.__V2_TEMPLATES[code] = tpl
        if (tpl.id) window.__V2_TEMPLATES[tpl.id] = tpl
      })
      console.log(`[TemplateCache] 已缓存 ${publishedTemplates.value.length} 个API模板`)
    }
  } catch (err) {
    console.warn('已发布模板加载失败:', err)
    publishedTemplates.value = []
  }
}

// ✅ 转换列树格式（后端 → 前端）
function transformColumnTree(columns) {
  const typeMap = {
    '1': 'data',       // 数据列
    '5': 'formula',    // 公式列
    '6': 'metric'      // 指标列
  }

  const alignMap = {
    '0': 'left',
    '1': 'center',
    '2': 'right'
  }

  return columns.map(col => ({
    id: col.id || '',
    title: col.title || col.name || '',
    type: typeMap[col.type] || col.type || 'data',
    format: col.format || (col.type === '5' ? 'percent' : 'number'),
    width: col.width || 120,
    align: alignMap[col.align] || col.align || 'right',
    children: col.children ? transformColumnTree(col.children) : null
  }))
}

// ✅ 默认布局配置
function getDefaultLayout() {
  return {
    type: 'table',
    frozenRows: 4,
    frozenCols: 1,
    showRowNumbers: true,
    rowHeight: 32,
    defaultAlign: 'right',
    stripeRows: true,
    density: 'normal'
  }
}

let timeTimer = null

const navItems = [
  { key: 'stats', label: '数据统计' },
  { key: 'report', label: '底表填报' },
  { key: 'audit', label: '审核中心' },
  { key: 'manage', label: '系统管理' }
]

function getCategoryLabel(cat) {
  const map = {
    production: '生产类', finance: '经营类', safety: '安全类',
    energy: '能源类', cost: '成本类', hr: '人事类', other: '其他'
  }
  return map[cat] || cat
}

// 更新时间
function updateTime() {
  currentTime.value = store.getCurrentTime()
}

function getStatusLabel(status) {
  const map = {
    draft: '草稿',
    submitted: '已提交',
    reviewing: '审核中',
    returned: '退回',
    approved: '通过'
  }
  return map[status] || status
}

/**
 * ✅ 导航点击处理（支持路由跳转）
 */
function handleNavClick(item) {
  if (item.key === 'audit') {
    // 审核中心：跳转到独立页面
    router.push('/audit')
  } else {
    // 其他导航：切换当前页面的 tab
    activeNav.value = item.key
  }
}

/**
 * ✅ 退出登录
 */
async function handleLogout() {
  if (!confirm('确定要退出登录吗？')) return
  
  try {
    const { logout: apiLogout } = await import('@/api/reportDesigner.js')
    
    // 调用后端登出接口
    await apiLogout()
  } catch (err) {
    console.warn('[Logout] 后端登出接口调用失败:', err)
  } finally {
    // 无论后端是否成功，都清除本地认证信息
    sessionStorage.removeItem('rpt_token')
    sessionStorage.removeItem('rpt_user')
    localStorage.removeItem('rpt_token')
    localStorage.removeItem('rpt_user')
    localStorage.removeItem('rpt_remember')
    localStorage.removeItem('rpt_last_user')
    
    // 跳转到登录页
    router.push('/login')
  }
}

onMounted(() => {
  // 启动时间更新
  updateTime()
  timeTimer = setInterval(updateTime, 1000)

  // 加载模板数据
  loadTemplates()

  // 默认选中第一个子公司
  if (store.subsidiaries.length > 0) {
    store.selectSubsidiary(store.subsidiaries[0].id)
  }

  // 监听导出事件
  window.addEventListener('export-report', handleExportEvent)
})

onUnmounted(() => {
  if (timeTimer) clearInterval(timeTimer)
  window.removeEventListener('export-report', handleExportEvent)
})

function handleExportEvent() {
  if (univerRef.value) {
    const data = univerRef.value.exportData()
    if (data) {
      const filename = `煤炭统计报表_${new Date().toISOString().slice(0,10)}.json`
      import('@/services/templateEngine.js').then(({ ExcelService }) => {
        ExcelService.downloadAsText(data, filename)
      })
    }
  }
}
</script>

<style lang="scss" scoped>
/* Univer 工作区 */
.univer-workarea {
  flex: 1;
  padding: 20px 0;
  overflow-y: auto;  /* 添加滚动支持 */
  background: #F8FAFC;
}

/* 模板中心 */
.template-center {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}
.tc-header {
  margin-bottom: 20px;
  h2 { margin: 0 0 6px; font-size: 18px; font-weight: 600; color: #0F172A; }
  .tc-desc { margin: 0; font-size: 13px; color: #64748B; }
}
.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}
.template-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: #fff;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  text-decoration: none;
  transition: all .2s ease;
  cursor: pointer;

  &:hover {
    border-color: #2563EB;
    box-shadow: 0 4px 16px rgba(37,99,235,.12);
    transform: translateY(-2px);
  }

  .tc-icon { font-size: 28px; margin-bottom: 10px; }
  .tc-name { font-size: 15px; font-weight: 600; color: #0F172A; margin: 0 0 4px; }
  .tc-code { font-size: 11px; color: #94A3B8; font-family: monospace; margin-bottom: 10px; }
  .tc-category {
    display: inline-block; padding: 2px 8px; border-radius: 4px;
    font-size: 11px; font-weight: 500; align-self: flex-start; margin-bottom: auto;
    &.cat-production { background: #DBEAFE; color: #1D4ED8; }
    &.cat-finance { background: #D1FAE5; color: #059669; }
    &.cat-safety { background: #FEF3C7; color: #D97706; }
    &.cat-energy { background: #EDE9FE; color: #7C3AED; }
    &.cat-cost { background: #FCE7F3; color: #DB2777; }
    &.cat-hr { background: #CCFBF1; color: #0D9488; }
    &.cat-other { background: #F1F5F9; color: #475569; }
    &.cat-custom { background: linear-gradient(135deg, #EEF2FF, #EDE9FE); color: #7C3AED; font-weight: 600; }
  }
  .tc-link {
    margin-top: 14px; font-size: 12px; color: #2563EB; font-weight: 500;
    &:hover { text-decoration: underline; }
  }

  /* 新建报表卡片 */
  &.tc-new-card {
    border-style: dashed;
    border-color: #CBD5E1;
    background: linear-gradient(135deg, #FAFBFF, #F5F3FF);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    min-height: 180px;

    &:hover {
      border-color: #7C3AED; border-style: solid;
      box-shadow: 0 4px 20px rgba(124,58,237,.15);
      background: linear-gradient(135deg, #EEF2FF, #F5F3FF);
    }
    .tc-add-icon {
      width: 48px; height: 48px; border-radius: 50%;
      background: linear-gradient(135deg, #7C3AED, #2563EB);
      color: #fff; font-size: 24px; font-weight: 300;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 12px;
    }
    .tc-name { font-size: 16px; color: #4338CA !important; }
    .tc-code { color: #8B5CF6 !important; }
    .tc-link { color: #7C3AED; }
  }

  /* API发布的模板卡片 */
  &.tc-published-api {
    border-style: solid;
    border-color: #3B82F6;
    background: linear-gradient(135deg, #EFF6FF, #DBEAFE);
    
    &:hover {
      border-color: #2563EB;
      box-shadow: 0 4px 20px rgba(59,130,246,.15);
    }
    
    .tc-icon {
      background: linear-gradient(135deg, #3B82F6, #1D4ED8);
      color: white;
    }
    .tc-name { color: #1E40AF !important; }
    .tc-code { color: #3B82F6 !important; }
    .tc-link { color: #2563EB; }
  }

  /* API 标签 */
  .tpl-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    background: #3B82F6;
    color: white;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 600;
    box-shadow: 0 1px 3px rgba(59,130,246,0.3);
  }
}

/* 根容器 */
.report-platform {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #F1F5F9;
}

/* 平台头部 */
.platform-header {
  height: 60px;
  background: #1F2937;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.header-nav {
  display: flex;
  gap: 4px;

  .nav-item {
    color: rgba(255,255,255,0.85);
    text-decoration: none;
    padding: 6px 16px;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover, &.active {
      background: rgba(255,255,255,0.15);
      color: #fff;
    }

    &.active {
      background: rgba(255,255,255,0.22);
      font-weight: 500;
    }
  }
}

.logout-btn {
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.2);
  color: #fff;
  padding: 5px 14px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255,60,60,0.7);
    border-color: rgba(255,60,60,0.8);
  }
}
</style>
