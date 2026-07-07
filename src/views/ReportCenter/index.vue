<template>
  <div class="report-center">
    <!-- ==================== 报表信息栏 ==================== -->
    <ReportHeader />

    <!-- ==================== 工具栏 ==================== -->
    <Toolbar @export-report="handleExportEvent" />

    <!-- ==================== 模板中心 ==================== -->
    <main class="rc-content">
      <div class="rc-inner">
        <!-- 区域标题 -->
        <div class="rc-section-header">
          <div>
            <h2 class="rc-section-title">报表模板中心</h2>
            <p class="rc-section-desc">选择组织与周期，点击报表模板进入填报</p>
          </div>
          <div class="rc-quick-select">
            <!-- 组织选择器 -->
            <div class="rc-select-group">
              <span class="rc-select-label">组织</span>
              <select
                class="rc-select"
                v-model="selectedOrgId"
                :disabled="store.orgLoading"
                @change="onOrgChange"
              >
                <option value="">{{ store.orgLoading ? '加载中...' : '请选择' }}</option>
                <option v-for="org in flatOrgList" :key="org.id" :value="org.id">
                  {{ org.name }}
                </option>
              </select>
            </div>
            <!-- 周期选择器 -->
            <div class="rc-select-group">
              <span class="rc-select-label">周期</span>
              <select class="rc-select" v-model="selectedPeriod" @change="onPeriodChange">
                <option value="">请选择</option>
                <option v-for="p in periodList" :key="p.value" :value="p.value">{{ p.label }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 筛选栏 -->
        <div class="rc-filters">
          <div class="rc-filter-group">
            <span class="rc-filter-label">类型</span>
            <button
              v-for="t in typeFilters"
              :key="t.value"
              :class="['rc-filter-chip', { active: filterType === t.value }]"
              @click="filterType = t.value"
            >{{ t.label }}</button>
          </div>
          <div class="rc-filter-group">
            <span class="rc-filter-label">状态</span>
            <button
              v-for="s in statusFilters"
              :key="s.value"
              :class="['rc-filter-chip', { active: filterStatus === s.value }]"
              @click="filterStatus = s.value"
            >{{ s.label }}</button>
          </div>
        </div>

        <!-- 模板卡片网格 -->
        <div class="rc-grid">
          <!-- 加载中 -->
          <div v-if="templatesLoading" class="rc-loading">
            <div class="app-spinner"></div>
            <span>正在加载模板...</span>
          </div>

          <template v-else>
            <!-- 新建报表入口 -->
            <router-link to="/designer" class="rc-card rc-card-new">
              <div class="rc-card-add-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
              <h3 class="rc-card-name">新建报表</h3>
              <span class="rc-card-code">可视化设计器</span>
              <span class="rc-card-tag rc-tag-design">设计器</span>
            </router-link>

            <!-- 已有模板 -->
            <div
              v-for="tpl in allTemplates"
              :key="tpl.id"
              class="rc-card"
              :class="{ 'rc-card-published': tpl._isPublishedApi }"
            >
              <div class="rc-card-body" @click="handleTemplateClick(tpl)">
                <div class="rc-card-icon">
                  <span>{{ tpl.icon || '📊' }}</span>
                </div>
                <h3 class="rc-card-name">{{ tpl.name }}</h3>
                <span class="rc-card-code">{{ tpl.code }}</span>

                <div class="rc-card-badges">
                  <span class="rc-badge rc-badge-type">{{ templateTypeLabel(tpl.templateType) }}</span>
                  <span class="rc-badge" :class="'rc-status-' + tpl.status">{{ statusLabel(tpl.status) }}</span>
                  <span class="rc-badge" :class="'rc-cat-' + (tpl.category || 'custom')">{{ getCategoryLabel(tpl.category || 'custom') }}</span>
                </div>

                <div class="rc-card-meta">
                  <span v-if="tpl.creatorName || tpl.createdBy" class="rc-meta-item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    {{ tpl.creatorName || tpl.createdBy || '系统' }}
                  </span>
                  <span v-if="tpl.orgName || tpl.orgId" class="rc-meta-item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    {{ tpl.orgName || '#' + tpl.orgId }}
                  </span>
                  <span v-if="tpl.useCount" class="rc-meta-item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    {{ tpl.useCount }}次
                  </span>
                </div>
              </div>

              <!-- 卡片底部操作 -->
              <div class="rc-card-footer">
                <button class="rc-btn-enter" @click="handleTemplateClick(tpl)">
                  {{ tpl.templateType === 1 ? '查看报表' : '进入填报' }}
                </button>
                <div class="rc-more-wrapper" @click.stop>
                  <button class="rc-btn-more" @click="toggleMoreMenu(tpl.id)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
                    </svg>
                  </button>
                  <div v-if="openMoreId === tpl.id" class="rc-dropdown">
                    <button @click="editTemplate(tpl)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      编辑
                    </button>
                    <button v-permission="'template:publish'" v-if="tpl.status !== 'published'" @click="handlePublish(tpl)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
                      发布
                    </button>
                    <button v-permission="'template:permission'" @click="showPermDialog(tpl)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                      权限
                    </button>
                    <button v-permission="'template:delete'" class="rc-dropdown-danger" @click="confirmDelete(tpl)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                      删除
                    </button>
                  </div>
                </div>
              </div>

              <span v-if="tpl._isPublishedApi" class="rc-badge-api">API</span>
            </div>
          </template>
        </div>

        <!-- 空状态 -->
        <div v-if="!templatesLoading && allTemplates.length === 0" class="rc-empty">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <p class="rc-empty-text">暂无报表模板</p>
          <router-link to="/designer" class="app-btn app-btn--primary">创建第一个报表</router-link>
        </div>
      </div>

      <!-- 集团汇总面板（浮动） -->
      <Transition name="slide">
        <aside
          v-if="store.showGroupPanel || store.viewMode === 'group'"
          class="rc-subsidiary-panel"
        >
          <h3 class="rc-panel-title">子公司填报状态</h3>
          <div class="rc-panel-stats">
            <div class="rc-panel-stat">
              <span>总计</span><b>{{ store.statistics.total }}</b>
            </div>
            <div class="rc-panel-stat rc-stat-success">
              <span>已通过</span><b>{{ store.statistics.approved }}</b>
            </div>
            <div class="rc-panel-stat rc-stat-warning">
              <span>待填报</span><b>{{ store.statistics.draft }}</b>
            </div>
            <div class="rc-panel-stat">
              <span>完成率</span><b>{{ store.statistics.completionRate }}%</b>
            </div>
          </div>

          <div v-if="store.orgLoading" class="app-loading">
            <div class="app-spinner" style="width: 16px; height: 16px;"></div>
            <span>正在加载组织数据...</span>
          </div>

          <div v-else-if="store.subsidiaries.length === 0" class="app-empty">
            <p>暂无组织数据</p>
          </div>

          <OrgTree
            v-else
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
import OrgTree from '@/components/OrgTree.vue'
import { getTemplateList, deleteTemplate, publishTemplate } from '@/api/reportDesigner.js'

const store = useReportStore()
const router = useRouter()

const allTemplates = ref([])
const templatesLoading = ref(false)
const filterType = ref(0)
const filterStatus = ref('')
const openMoreId = ref(null)
const selectedOrgId = ref('')
const selectedPeriod = ref('')

const flatOrgList = computed(() => flattenOrgTree(store.orgTree))

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
    const params = { current: 1, size: 100 }
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
      `确定删除报表 "${tpl.name}" 吗？\n\n删除后将清除该报表的所有数据，此操作不可撤销。`,
      '删除确认',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
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

function onOrgChange() {
  console.log(`[Org] 已选择组织: ${selectedOrgId.value}`)
}

function onPeriodChange() {
  console.log(`[Period] 已选择周期: ${selectedPeriod.value}`)
}

function handleTemplateClick(tpl) {
  if (!selectedOrgId.value || !selectedPeriod.value) {
    ElMessage.warning('请先选择组织和周期')
    return
  }
  const templateId = tpl.id
  const route = `/report/${templateId}?orgId=${selectedOrgId.value}&period=${selectedPeriod.value}`
  router.push(route)
}

function handleOrgSelect(orgId) {
  store.selectSubsidiary(orgId)
}

onMounted(async () => {
  await loadTemplates()
  await store.loadOrganizations()

  if (flatOrgList.value.length > 0) {
    const firstSubsidiary = flatOrgList.value.find(org => org.orgType === 2)
    if (firstSubsidiary) {
      selectedOrgId.value = firstSubsidiary.id
    } else {
      selectedOrgId.value = flatOrgList.value[0].id
    }
  }

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  selectedPeriod.value = `${year}${String(month).padStart(2, '0')}`

  if (store.subsidiaries.length > 0) {
    store.selectSubsidiary(store.subsidiaries[0].id)
  }
})

onUnmounted(() => {})
</script>

<style lang="scss" scoped>
.report-center {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.rc-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  position: relative;
}

.rc-inner {
  max-width: 1200px;
  margin: 0 auto;
}

// ==================== 区域标题 ====================
.rc-section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 16px;
  flex-wrap: wrap;
}

.rc-section-title {
  margin: 0 0 2px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--app-text-primary);
}

.rc-section-desc {
  margin: 0;
  font-size: 13px;
  color: var(--app-text-muted);
}

.rc-quick-select {
  display: flex;
  gap: 12px;
}

.rc-select-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rc-select-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--app-text-muted);
  white-space: nowrap;
}

.rc-select {
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-sm);
  font-size: 12px;
  color: var(--app-text-primary);
  background: var(--app-surface);
  outline: none;
  transition: border-color var(--app-transition-fast);
  min-width: 140px;
  cursor: pointer;

  &:hover { border-color: var(--app-border-dark); }
  &:focus { border-color: var(--app-primary); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

// ==================== 筛选栏 ====================
.rc-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-md);
}

.rc-filter-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rc-filter-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--app-text-muted);
  margin-right: 4px;
}

.rc-filter-chip {
  height: 26px;
  padding: 0 10px;
  border: 1px solid var(--app-border);
  border-radius: 13px;
  background: var(--app-surface);
  font-size: 12px;
  color: var(--app-text-secondary);
  cursor: pointer;
  transition: all var(--app-transition-fast);

  &:hover {
    border-color: var(--app-primary);
    color: var(--app-primary);
  }

  &.active {
    background: var(--app-primary);
    color: #fff;
    border-color: var(--app-primary);
  }
}

// ==================== 模板网格 ====================
.rc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 14px;
}

.rc-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 18px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-card-radius);
  text-decoration: none;
  transition: all var(--app-transition);
  cursor: pointer;
  overflow: hidden;

  &:hover {
    border-color: var(--app-primary);
    box-shadow: var(--app-shadow-md);
    transform: translateY(-2px);
  }
}

.rc-card-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--app-radius-sm);
  background: var(--app-primary-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  margin-bottom: 10px;
}

.rc-card-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--app-text-primary);
  margin: 0 0 2px 0;
}

.rc-card-code {
  font-size: 11px;
  color: var(--app-text-muted);
  font-family: monospace;
  margin-bottom: 8px;
}

.rc-card-badges {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.rc-badge {
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 4px;
  font-weight: 600;
}

.rc-badge-type { background: var(--app-info-bg); color: var(--app-info); }
.rc-status-draft { background: var(--app-warning-bg); color: var(--app-warning); }
.rc-status-published { background: var(--app-success-bg); color: var(--app-success); }
.rc-status-disabled { background: var(--app-danger-bg); color: var(--app-danger); }

.rc-cat-production { background: var(--app-info-bg); color: var(--app-info); }
.rc-cat-finance { background: var(--app-warning-bg); color: var(--app-warning); }
.rc-cat-safety { background: var(--app-danger-bg); color: var(--app-danger); }
.rc-cat-energy { background: var(--app-success-bg); color: var(--app-success); }
.rc-cat-cost { background: #F3E8FF; color: #7C3AED; }
.rc-cat-custom { background: var(--app-primary-bg); color: var(--app-primary); font-weight: 600; }

.rc-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

.rc-meta-item {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: var(--app-text-muted);

  svg { flex-shrink: 0; }
}

.rc-card-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  cursor: pointer;
}

.rc-card-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--app-border-light);
}

.rc-btn-enter {
  flex: 1;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--app-radius-sm);
  background: var(--app-primary);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all var(--app-transition-fast);

  &:hover {
    background: var(--app-primary-hover);
    box-shadow: 0 2px 8px rgba(43, 108, 246, 0.25);
  }
}

.rc-btn-more {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-sm);
  background: var(--app-surface);
  color: var(--app-text-muted);
  cursor: pointer;
  transition: all var(--app-transition-fast);

  &:hover {
    background: var(--app-surface-hover);
    color: var(--app-text-primary);
  }
}

.rc-more-wrapper {
  position: relative;
}

.rc-dropdown {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 4px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-sm);
  box-shadow: var(--app-shadow-lg);
  padding: 4px;
  min-width: 130px;
  z-index: var(--app-z-dropdown);

  button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 10px;
    border: none;
    background: none;
    font-size: 12px;
    color: var(--app-text-primary);
    cursor: pointer;
    border-radius: 4px;
    transition: background var(--app-transition-fast);

    &:hover { background: var(--app-surface-hover); }

    &.rc-dropdown-danger {
      color: var(--app-danger);
      &:hover { background: var(--app-danger-bg); }
    }
  }
}

.rc-badge-api {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--app-primary);
  color: #fff;
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

// 新建报表卡片
.rc-card-new {
  border-style: dashed;
  border-color: var(--app-border-dark);
  background: var(--app-surface-hover);
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 170px;

  &:hover {
    border-color: var(--app-primary);
    border-style: solid;
    background: var(--app-primary-bg);
  }

  .rc-card-add-icon {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--app-primary);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
  }

  .rc-card-name { color: var(--app-primary); }
  .rc-card-code { color: var(--app-text-muted); }
}

.rc-tag-design {
  background: var(--app-primary-bg);
  color: var(--app-primary);
}

// 已发布卡片
.rc-card-published {
  border-color: var(--app-primary-light);
  background: linear-gradient(135deg, var(--app-primary-bg) 0%, var(--app-surface) 40%);

  &:hover {
    border-color: var(--app-primary);
  }
}

// 加载
.rc-loading {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px;
  color: var(--app-text-muted);
  font-size: 13px;
}

// 空状态
.rc-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--app-text-muted);
  text-align: center;

  .rc-empty-text {
    margin: 12px 0 16px;
    font-size: 14px;
  }
}

// ==================== 子公司面板 ====================
.rc-subsidiary-panel {
  position: fixed;
  top: 50%;
  right: 24px;
  transform: translateY(-50%);
  z-index: var(--app-z-dropdown);
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-card-radius);
  box-shadow: var(--app-shadow-lg);
  padding: 14px;
  min-width: 240px;
  max-height: 70vh;
  overflow-y: auto;
}

.rc-panel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text-primary);
  margin: 0 0 10px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--app-border-light);
}

.rc-panel-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  margin-bottom: 10px;
  padding: 8px;
  background: var(--app-bg);
  border-radius: var(--app-radius-sm);
  font-size: 11px;
}

.rc-panel-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;

  &.rc-stat-success b { color: var(--app-success); }
  &.rc-stat-warning b { color: var(--app-warning); }
}

// 过渡
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.slide-enter-from {
  transform: translate(20px, -50%);
  opacity: 0;
}
.slide-leave-to {
  transform: translate(20px, -50%);
  opacity: 0;
}
</style>
