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
        <!-- 筛选栏 -->
        <div class="tc-filters">
          <div class="tc-filter-group">
            <span class="tc-filter-label">类型：</span>
            <button
              v-for="t in typeFilters"
              :key="t.value"
              :class="['tc-filter-btn', { active: filterType === t.value }]"
              @click="filterType = t.value"
            >{{ t.label }}</button>
          </div>
          <div class="tc-filter-group">
            <span class="tc-filter-label">状态：</span>
            <button
              v-for="s in statusFilters"
              :key="s.value"
              :class="['tc-filter-btn', { active: filterStatus === s.value }]"
              @click="filterStatus = s.value"
            >{{ s.label }}</button>
          </div>
          
          <!-- ✅ 组织选择器 -->
          <div class="tc-filter-group">
            <span class="tc-filter-label">组织：</span>
            <select 
              class="tc-select" 
              v-model="selectedOrgId" 
              :disabled="store.orgLoading"
              @change="onOrgChange"
            >
              <option value="">{{ store.orgLoading ? '加载中...' : '请选择组织' }}</option>
              <option v-for="org in flatOrgList" :key="org.id" :value="org.id">
                {{ org.name }}
              </option>
            </select>
          </div>
          
          <!-- ✅ 周期选择器 -->
          <div class="tc-filter-group">
            <span class="tc-filter-label">周期：</span>
            <select class="tc-select" v-model="selectedPeriod" @change="onPeriodChange">
              <option value="">请选择周期</option>
              <option v-for="p in periodList" :key="p.value" :value="p.value">{{ p.label }}</option>
            </select>
          </div>
        </div>
        <div class="template-grid">
          <!-- 加载中 -->
          <div v-if="templatesLoading" class="tc-loading">
            <div class="loading-spinner"></div>
            <span>正在加载模板...</span>
          </div>

          <!-- 新建报表入口 -->
          <router-link to="/designer" class="template-card tc-new-card">
            <span class="tc-icon tc-add-icon">+</span>
            <h3 class="tc-name">新建报表</h3>
            <span class="tc-code">可视化设计</span>
            <span class="tc-category cat-custom">设计器</span>
            <span class="tc-link">点击创建报表 →</span>
          </router-link>

          <!-- 已有模板 -->
          <div
            v-for="tpl in allTemplates"
            :key="tpl.id"
            class="template-card"
            :class="{ 'tc-published-api': tpl._isPublishedApi }"
          >
            <!-- 卡片主体可点击进入 -->
            <div
              class="tc-card-body"
              @click="handleTemplateClick(tpl)"
            >
              <span class="tc-icon" v-if="tpl._isPublishedApi">📊</span>
              <span class="tc-icon" v-else>{{ tpl.icon }}</span>
              <h3 class="tc-name">{{ tpl.name }}</h3>
              <span class="tc-code">{{ tpl.code }}</span>
              
              <div class="tpl-badges">
                <span class="tpl-badge tpl-badge-type">{{ templateTypeLabel(tpl.templateType) }}</span>
                <span class="tpl-badge tpl-badge-status" :class="'tpl-status-' + tpl.status">{{ statusLabel(tpl.status) }}</span>
                <span class="tpl-badge" :class="'cat-badge-' + (tpl.category || 'custom')">{{ getCategoryLabel(tpl.category || 'custom') }}</span>
              </div>

              <!-- ⭐ 增强信息 -->
              <div class="tpl-meta">
                <span v-if="tpl.createdBy || tpl.creatorName" class="tpl-meta-item">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  {{ tpl.creatorName || tpl.createdBy || '系统' }}
                </span>
                <span v-if="tpl.orgName || tpl.orgId" class="tpl-meta-item">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  {{ tpl.orgName || '组织#' + tpl.orgId }}
                </span>
                <span v-if="tpl.useCount" class="tpl-meta-item">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  {{ tpl.useCount }}次
                </span>
              </div>
            </div>

            <!-- ⭐ 操作按钮区 -->
            <div class="tc-card-footer">
              <button
                class="tc-btn-primary"
                @click="handleTemplateClick(tpl)"
              >
                {{ tpl.templateType === 1 ? '查看报表' : '进入填报' }}
              </button>
              <div class="tc-more-dropdown" @click.stop>
                <button class="tc-btn-more" @click="toggleMoreMenu(tpl.id)">
                  更多 <span class="tc-more-arrow">▼</span>
                </button>
                <div v-if="openMoreId === tpl.id" class="tc-dropdown-menu">
                  <button  @click="editTemplate(tpl)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    编辑
                  </button>
                  <button v-permission="'template:publish'" v-if="tpl.status !== 'published'" @click="handlePublish(tpl)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
                    发布
                  </button>
                  <button v-permission="'template:permission'" @click="showPermDialog(tpl)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    权限设置
                  </button>
                  <button v-permission="'template:delete'" class="tc-danger" @click="confirmDelete(tpl)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                    删除
                  </button>
                </div>
              </div>
            </div>
            
            <span v-if="tpl._isPublishedApi" class="tpl-badge-api">API</span>
          </div>
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

          <!-- 加载状态 -->
          <div v-if="store.orgLoading" class="org-loading">
            <div class="loading-spinner"></div>
            <span>正在加载组织数据...</span>
          </div>

          <!-- 空状态 -->
          <div v-else-if="store.subsidiaries.length === 0" class="org-empty">
            <p>暂无组织/单位数据</p>
            <p class="org-empty-hint">请检查接口 /org/tree 是否正常</p>
          </div>

          <!-- 组织树形列表 -->
          <OrgTree 
            :tree-data="store.orgTree"
            :selected-id="store.currentSubsidiaryId"
            :loading="store.orgLoading"
            @select="handleOrgSelect"
          />
        </aside>
      </Transition>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { useReportStore } from '@/stores/reportStore.js'
import ReportHeader from '@/components/ReportHeader.vue'
import Toolbar from '@/components/Toolbar.vue'
import UniverReport from '@/components/UniverReport.vue'
import OrgTree from '@/components/OrgTree.vue'
import { getTemplateList, deleteTemplate, publishTemplate } from '@/api/reportDesigner.js'

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

// 模板列表（全部来自API）
const allTemplates = ref([])
const templatesLoading = ref(false)

// 筛选
const filterType = ref(0)     
const filterStatus = ref('')  

// 更多菜单
const openMoreId = ref(null)

// 组织和周期选择器
const selectedOrgId = ref('')
const selectedPeriod = ref('')

// 扁平化的组织列表（用于下拉选择）
const flatOrgList = computed(() => {
  return flattenOrgTree(store.orgTree)
})

// 周期列表（动态生成最近12个月+4个季度）
const periodList = computed(() => {
  const periods = []
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  
  for (let i = 0; i < 6; i++) {
    const m = month - i
    const actualMonth = ((m - 1) % 12 + 12) % 12 + 1
    const actualYear = m <= 0 ? year - 1 : year
    periods.push({
      value: `${actualYear}${String(actualMonth).padStart(2, '0')}`,
      label: `${actualYear}年${actualMonth}月`
    })
  }
  
  const currentQ = Math.ceil(month / 3)
  for (let i = 0; i < 4; i++) {
    const q = currentQ - i
    if (q > 0) {
      periods.push({ value: `${year}Q${q}`, label: `${year}年第${q}季度` })
    } else {
      periods.push({ value: `${year-1}Q${q+4}`, label: `${year-1}年第${q+4}季度` })
    }
  }
  
  return periods
})

function flattenOrgTree(tree, level = 0) {
  const result = []
  for (const node of tree) {
    result.push({
      id: node.id,
      name: `${'　'.repeat(level)}${node.name}`,
      code: node.code,
      orgType: node.orgType
    })
    if (node.children && node.children.length > 0) {
      result.push(...flattenOrgTree(node.children, level + 1))
    }
  }
  return result
}

watch([filterType, filterStatus], () => {
  loadTemplates()
})

const typeFilters = [
  { label: '全部', value: 0 },
  { label: '统计报表', value: 1 },
  { label: '填报报表', value: 2 },
  { label: '汇总报表', value: 3 }
]
const statusFilters = [
  { label: '全部', value: '' },
  { label: '草稿', value: 'draft' },
  { label: '已发布', value: 'published' },
  { label: '已停用', value: 'disabled' }
]

async function loadTemplates() {
  templatesLoading.value = true
  try {
    const params = {
      current: 1,
      size: 100
    }
    if (filterType.value !== 0) params.templateType = filterType.value
    if (filterStatus.value) params.status = ({ draft: 0, published: 1, disabled: 2 }[filterStatus.value] ?? undefined)
    
    const res = await getTemplateList(params)
    
    let templates = []
    if (Array.isArray(res)) {
      templates = res
    } else if (res?.records) {
      templates = res.records
    } else if (res?.data?.records) {
      templates = res.data.records
    }

    allTemplates.value = templates.map(tpl => ({
      id: tpl.id,
      code: tpl.templateCode || '',
      name: tpl.templateName || '未命名报表',
      templateType: tpl.templateType || 0,
      description: tpl.description || '',
      category: tpl.category || 'custom',
      icon: tpl.icon || '📊',
      version: tpl.version || 1,
      status: mapStatus(tpl.status),
      rowTree: [],
      columnTree: [],
      metrics: [],
      layout: getDefaultLayout(),
      orgId: tpl.orgId || null,
      orgName: tpl.orgName || null,
      creatorName: tpl.creatorName || null,
      createdBy: tpl.createdBy || null,
      useCount: tpl.useCount || 0,
      _rawData: tpl,
      _isPublishedApi: true
    }))

    if (allTemplates.value.length > 0) {
      window.__V2_TEMPLATES = window.__V2_TEMPLATES || {}
      allTemplates.value.forEach(tpl => {
        const code = tpl.code || tpl.id
        if (code) {
          window.__V2_TEMPLATES[code] = tpl
          window.__V2_TEMPLATES[tpl.id] = tpl
        }
      })
    }
  } catch (err) {
    console.warn('[loadTemplates] 模板列表加载失败:', err)
    allTemplates.value = []
  } finally {
    templatesLoading.value = false
  }
}

function mapStatus(status) {
  if (status === null || status === undefined) return 'draft'
  return ({ 0: 'draft', 1: 'published', 2: 'disabled' }[status] || 'draft')
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
function templateTypeLabel(type) {
  const map = { 1: '统计报表', 2: '填报报表', 3: '汇总报表' }
  return map[type] || '未分类'
}
function statusLabel(status) {
  const map = { draft: '草稿', published: '已发布', disabled: '已停用' }
  return map[status] || status
}

// ==================== ⭐ 模板操作 ====================
function toggleMoreMenu(id) {
  openMoreId.value = openMoreId.value === id ? null : id
}

function editTemplate(tpl) {
  openMoreId.value = null
    router.push(`/designer/${tpl.id}`)
}

async function handlePublish(tpl) {
  openMoreId.value = null
  try {
    await publishTemplate(tpl.id)
    ElMessage.success('模板已发布')
    loadTemplates()
  } catch (err) {
    ElMessage.error(`发布失败: ${err.message}`)
  }
}

function showPermDialog(tpl) {
  openMoreId.value = null
  ElMessage.info('权限设置功能（待实现）')
}

async function confirmDelete(tpl) {
  openMoreId.value = null

  try {
    await ElMessageBox.confirm(
      `确定删除报表 "${tpl.name}" 吗？\n\n删除后将清除该报表的所有数据（包括行、列、公式配置），此操作不可撤销。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        customClass: 'delete-confirm-dialog'
      }
    )

    await deleteTemplate(tpl.id)
    allTemplates.value = allTemplates.value.filter(t => t.id !== tpl.id)
    if (window.__V2_TEMPLATES) {
      delete window.__V2_TEMPLATES[tpl.id]
      delete window.__V2_TEMPLATES[tpl.code]
    }
    ElMessage.success(`报表 "${tpl.name}" 已删除`)
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error(`删除失败: ${err.message || err}`)
    }
  }
}

// 更新时间
function updateTime() {
  currentTime.value = store.getCurrentTime()
}

/**
 * ✅ 组织选择处理
 */
function onOrgChange() {
  console.log(`[Org] 已选择组织: ${selectedOrgId.value}`)
  // 可以在这里根据组织筛选模板或其他操作
}

/**
 * ✅ 周期选择处理
 */
function onPeriodChange() {
  console.log(`[Period] 已选择周期: ${selectedPeriod.value}`)
}

/**
 * ✅ 处理模板点击事件（跳转到填报页面）
 */
function handleTemplateClick(tpl) {
  // 检查是否选择了组织和周期
  if (!selectedOrgId.value || !selectedPeriod.value) {
    ElMessage.warning('请先选择组织和周期')
    return
  }
  
  // ✅ 直接使用模板ID
  const templateId = tpl.id
  
  // 添加组织和周期参数
  const route = `/report/${templateId}?orgId=${selectedOrgId.value}&period=${selectedPeriod.value}`
  
  // 跳转到填报页面
  router.push(route)
}

/**
 * ✅ 组织树选择处理
 */
function handleOrgSelect(orgId) {
  store.selectSubsidiary(orgId)
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
    router.push('/audit')
  } else if (item.key === 'manage') {
    // ⭐ 系统管理 → 跳转到管理后台
    router.push('/admin')
  } else {
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

onMounted(async () => {
  // 启动时间更新
  updateTime()
  timeTimer = setInterval(updateTime, 1000)

  // ✅ 加载模板数据
  await loadTemplates()

  // ✅ 从API加载组织/单位列表（替换原来的mock数据）
  await store.loadOrganizations()

  // ✅ 设置默认组织（优先选择第一个子公司）
  if (flatOrgList.value.length > 0) {
    const firstSubsidiary = flatOrgList.value.find(org => org.orgType === 2)
    if (firstSubsidiary) {
      selectedOrgId.value = firstSubsidiary.id
      console.log(`[Org] ✅ 自动选中第一个子公司: ${firstSubsidiary.name}`)
    } else {
      selectedOrgId.value = flatOrgList.value[0].id
      console.log(`[Org] ✅ 自动选中第一个组织: ${flatOrgList.value[0].name}`)
    }
  }

  // ✅ 设置默认周期（当前月份）
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  selectedPeriod.value = `${year}${String(month).padStart(2, '0')}`
  console.log(`[Period] ✅ 自动选中当前月份: ${year}年${month}月`)

  // 默认选中第一个子公司（用于左侧树形面板）
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
.tc-filters {
  display: flex; flex-wrap: wrap; gap: 16px;
  margin-bottom: 16px;
}
.tc-filter-group {
  display: flex; align-items: center; gap: 4px;
}
.tc-filter-label {
  font-size: 12px; font-weight: 600; color: #64748B; margin-right: 4px;
}
.tc-filter-btn {
  height: 28px; padding: 0 12px;
  border: 1px solid #E2E8F0; border-radius: 14px;
  background: #fff; font-size: 12px; color: #475569;
  cursor: pointer; transition: all .15s;
  &:hover { border-color: #3B82F6; color: #3B82F6; }
  &.active { background: #3B82F6; color: #fff; border-color: #3B82F6; }
}

// ✅ 组织和周期选择器样式
.tc-select {
  height: 28px;
  padding: 0 12px;
  border: 1px solid #E2E8F0;
  border-radius: 14px;
  background: #fff;
  font-size: 12px;
  color: #475569;
  cursor: pointer;
  transition: all .15s;
  min-width: 150px;
  
  &:hover { border-color: #3B82F6; }
  &:focus { border-color: #3B82F6; outline: none; }
  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
    opacity: 0.6;
  }
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

  /* 标签组 */
  .tpl-badges {
    display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px;
  }
  .tpl-badge {
    font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600;
  }
  .tpl-badge-type { background: #EFF6FF; color: #3B82F6; }
  .tpl-badge-status { background: #F0FDF4; color: #22C55E; }
  .tpl-status-draft { background: #FEF3C7; color: #D97706; }
  .tpl-status-disabled { background: #FEE2E2; color: #EF4444; }
  .tpl-badge-api {
    position: absolute; top: 8px; right: 8px;
    background: #3B82F6; color: white; font-size: 10px;
    padding: 2px 6px; border-radius: 4px; font-weight: 600;
    box-shadow: 0 1px 3px rgba(59,130,246,0.3);
  }

  /* ⭐ 卡片主体可点击 */
  .tc-card-body {
    display: flex; flex-direction: column; flex: 1;
    text-decoration: none; color: inherit;
    cursor: pointer;
    &:hover { color: inherit; }
  }

  /* ⭐ 分类标签 */
  .cat-badge-production { background: #EFF6FF; color: #3B82F6; }
  .cat-badge-finance   { background: #FEF3C7; color: #D97706; }
  .cat-badge-safety    { background: #FEE2E2; color: #EF4444; }
  .cat-badge-energy    { background: #F0FDF4; color: #22C55E; }
  .cat-badge-cost      { background: #F3E8FF; color: #7C3AED; }

  /* ⭐ 增强元信息 */
  .tpl-meta {
    display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;
  }
  .tpl-meta-item {
    display: flex; align-items: center; gap: 3px;
    font-size: 11px; color: #94A3B8;
    svg { flex-shrink: 0; }
  }

  /* ⭐ 卡片底部操作栏 */
  .tc-card-footer {
    display: flex; align-items: center; gap: 8px;
    margin-top: 12px; padding-top: 10px; border-top: 1px solid #F1F5F9;
  }
  .tc-btn-primary {
    flex: 1; height: 30px; display: flex; align-items: center; justify-content: center;
    border-radius: 6px; background: linear-gradient(135deg, #3B82F6, #2563EB);
    color: #fff; font-size: 12px; font-weight: 600; text-decoration: none;
    transition: all .15s;
    &:hover { transform: translateY(-1px); box-shadow: 0 2px 6px rgba(37,99,235,.35); }
  }
  .tc-btn-more {
    height: 30px; padding: 0 10px;
    border: 1px solid #E2E8F0; border-radius: 6px;
    background: #fff; font-size: 12px; color: #64748B; cursor: pointer;
    &:hover { background: #F8FAFC; border-color: #CBD5E1; }
  }
  .tc-more-arrow { font-size: 10px; margin-left: 2px; }
  .tc-more-dropdown { position: relative; }
  .tc-dropdown-menu {
    position: absolute; bottom: 100%; right: 0; margin-bottom: 4px;
    background: #fff; border: 1px solid #E2E8F0; border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,.1); padding: 4px; min-width: 140px; z-index: 100;
    button {
      width: 100%; display: flex; align-items: center; gap: 8px;
      padding: 8px 10px; border: none; background: none; font-size: 13px;
      color: #374151; cursor: pointer; border-radius: 4px;
      &:hover { background: #F8FAFC; }
      &.tc-danger { color: #EF4444; &:hover { background: #FEF2F2; } }
    }
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

/* 组织列表加载状态 */
.org-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  color: #64748B;
  font-size: 13px;

  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid #E2E8F0;
    border-top-color: #2563EB;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

/* 组织列表空状态 */
.org-empty {
  padding: 20px;
  text-align: center;
  color: #94A3B8;
  
  p { margin: 4px 0; font-size: 13px; }
  
  .org-empty-hint {
    font-size: 11px;
    color: #CBD5E1;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
