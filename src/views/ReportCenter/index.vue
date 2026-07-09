<template>
  <div class="report-center">
    <!-- ===== Page Header ===== -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">报表中心</h1>
        <p class="page-desc">管理和查看企业业务报表</p>
      </div>
    </div>

    <!-- ===== Search Area ===== -->
    <div class="search-area">
      <div class="search-box">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-box-icon"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          ref="searchInputRef"
          v-model="searchKeyword"
          type="text"
          class="search-box-input"
          placeholder="搜索报表名称、编号"
          @keyup.enter="handleSearch"
        />
        <button v-if="searchKeyword" class="search-box-clear" @click="searchKeyword = ''; handleSearch()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <kbd class="search-box-kbd">Ctrl K</kbd>
      </div>

      <div class="filter-group">
        <el-select v-model="filterCategory" placeholder="报表分类" style="width: 120px" size="default" clearable>
          <el-option label="财务" value="finance"/>
          <el-option label="人事" value="hr"/>
          <el-option label="销售" value="sales"/>
          <el-option label="生产" value="production"/>
          <el-option label="其他" value="other"/>
        </el-select>
        <el-select v-model="filterStatus" placeholder="状态" style="width: 110px" size="default" clearable>
          <el-option label="草稿" value="draft"/>
          <el-option label="已发布" value="published"/>
          <el-option label="填报中" value="filling"/>
          <el-option label="审核中" value="reviewing"/>
          <el-option label="已完成" value="completed"/>
        </el-select>
        <el-select v-model="filterCreator" placeholder="创建人" style="width: 110px" size="default" clearable>
          <el-option label="我创建的" value="me"/>
        </el-select>
        <el-date-picker v-model="filterDate" type="month" placeholder="创建月份" style="width: 140px" size="default"/>
      </div>

      <div class="search-actions">
        <el-button @click="handleSearch" size="default">查询</el-button>
        <el-button @click="handleReset" size="default" plain>重置</el-button>
      </div>

      <div class="view-toggle">
        <button :class="['toggle-btn', { active: viewMode === 'card' }]" @click="viewMode = 'card'" title="卡片视图">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
        </button>
        <button :class="['toggle-btn', { active: viewMode === 'table' }]" @click="viewMode = 'table'" title="列表视图">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
        </button>
      </div>
    </div>

    <!-- ===== Category Tabs (48px, Horizontal Tabs) ===== -->
    <div class="category-tabs">
      <div class="tabs-inner">
        <button
          v-for="tab in categoryTabs"
          :key="tab.id"
          :class="['tab-item', { active: activeTab === tab.id }]"
          @click="handleTabClick(tab.id)"
        >
          <span class="tab-icon" v-html="tab.icon"></span>
          <span class="tab-label">{{ tab.label }}</span>
          <span class="tab-count" v-if="tab.count > 0">{{ tab.count }}</span>
        </button>
      </div>
    </div>

    <!-- ===== Card View ===== -->
    <div v-if="viewMode === 'card'" class="report-container">
      <div class="report-grid" v-if="!loading">
        <div
          v-for="report in paginatedReports"
          :key="report.id"
          class="report-card"
          @click="handleViewReport(report)"
        >
          <!-- Category Icon (SVG) -->
          <div class="card-icon" :class="report.category" v-html="getCategoryIcon(report.category)"></div>

          <h3 class="card-title">{{ report.name }}</h3>
          <p class="card-code">{{ report.code }}</p>
          <p class="card-desc">{{ report.description }}</p>

          <div class="card-tags">
            <span :class="['tag', `tag-${report.status}`]">{{ getStatusText(report.status) }}</span>
            <span class="tag tag-category">{{ getCategoryText(report.category) }}</span>
          </div>

          <div class="card-meta">
            <span class="meta-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              {{ report.creatorName }}
            </span>
            <span class="meta-item">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {{ report.updatedAt }}
            </span>
          </div>

          <!-- Hover Actions: 打开/填报/查看/更多 -->
          <div class="card-actions">
            <button class="action-btn" @click.stop="handleViewReport(report)">
              {{ report.type === 'entry' ? '填报' : '查看' }}
            </button>
            <button class="action-btn action-btn--ghost" @click.stop="handleViewReport(report)">打开</button>
            <el-dropdown trigger="click" @command="(cmd) => handleCardAction(cmd, report)">
              <button class="action-more" @click.stop title="更多操作">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
              </button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="favorite">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:8px"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    {{ report.isFavorite ? '取消收藏' : '收藏' }}
                  </el-dropdown-item>
                  <el-dropdown-item command="share">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:8px"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    分享
                  </el-dropdown-item>
                  <el-dropdown-item command="versions">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:8px"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/></svg>
                    查看版本
                  </el-dropdown-item>
                  <el-dropdown-item command="export">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:8px"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    导出
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:8px"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/></svg>
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>

          <!-- Favorite toggle -->
          <div class="card-favorite" @click.stop="toggleFavoriteReport(report)">
            <svg :class="['favorite-icon', { filled: report.isFavorite }]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="paginatedReports.length === 0" class="rc-empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--app-text-muted)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          <p class="rc-empty-text">暂无报表</p>
          <p class="rc-empty-hint">请在"表样设计"模块中创建新的报表模板</p>
        </div>
      </div>

      <!-- Skeleton Cards -->
      <div class="report-grid" v-else>
        <div v-for="i in 8" :key="'card-sk-' + i" class="report-card report-card--skeleton">
          <div class="skeleton-icon"></div>
          <div class="skeleton-line skeleton-line--title"></div>
          <div class="skeleton-line skeleton-line--code"></div>
          <div class="skeleton-line skeleton-line--desc"></div>
          <div class="skeleton-line skeleton-line--desc" style="width:60%"></div>
          <div class="skeleton-tags">
            <div class="skeleton-tag"></div>
            <div class="skeleton-tag"></div>
          </div>
          <div class="skeleton-meta">
            <div class="skeleton-line skeleton-line--sm"></div>
            <div class="skeleton-line skeleton-line--sm"></div>
          </div>
        </div>
      </div>

      <el-pagination
        v-if="totalCount > 0"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="totalCount"
        layout="total, prev, pager, next, jumper"
        class="pagination"
        @current-change="handlePageChange"
      />
    </div>

    <!-- ===== Table View ===== -->
    <div v-else class="report-container">
      <div class="report-table" v-if="!loading">
        <el-table :data="paginatedReports" style="width: 100%" stripe @row-click="handleViewReport">
          <el-table-column prop="name" label="报表名称" min-width="200">
            <template #default="{ row }">
              <div class="table-name-cell">
                <span class="table-icon" :class="row.category" v-html="getCategoryIcon(row.category)"></span>
                <div>
                  <div class="table-name">{{ row.name }}</div>
                  <div class="table-code">{{ row.code }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="category" label="分类" width="100">
            <template #default="{ row }">
              <span class="tag tag-category">{{ getCategoryText(row.category) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <span :class="['tag', `tag-${row.status}`]">{{ getStatusText(row.status) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="creatorName" label="创建人" width="100" />
          <el-table-column prop="updatedAt" label="最后更新" width="160" />
          <el-table-column prop="useCount" label="使用次数" width="100" align="center" />
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button text size="small" type="primary" @click.stop="handleViewReport(row)">查看</el-button>
              <el-button text size="small" @click.stop="handleEditReport(row)">编辑</el-button>
              <el-button text size="small" @click.stop="toggleFavoriteReport(row)">
                {{ row.isFavorite ? '取消收藏' : '收藏' }}
              </el-button>
              <el-dropdown trigger="click" @command="(cmd) => handleCardAction(cmd, row)">
                <el-button text size="small" @click.stop>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="share">分享</el-dropdown-item>
                    <el-dropdown-item command="versions">查看版本</el-dropdown-item>
                    <el-dropdown-item command="export">导出</el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>

        <div v-if="paginatedReports.length === 0" class="rc-empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--app-text-muted)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          <p class="rc-empty-text">暂无报表</p>
          <p class="rc-empty-hint">请在"表样设计"模块中创建新的报表模板</p>
        </div>
      </div>

      <!-- Skeleton Table -->
      <div class="report-table" v-else>
        <el-table :data="Array(8).fill({})" style="width: 100%">
          <el-table-column label="报表名称" min-width="200"><template #default><div class="skeleton-line skeleton-line--md"></div></template></el-table-column>
          <el-table-column label="分类" width="100"><template #default><div class="skeleton-line skeleton-line--sm"></div></template></el-table-column>
          <el-table-column label="状态" width="100"><template #default><div class="skeleton-line skeleton-line--sm"></div></template></el-table-column>
          <el-table-column label="创建人" width="100"><template #default><div class="skeleton-line skeleton-line--sm"></div></template></el-table-column>
          <el-table-column label="最后更新" width="160"><template #default><div class="skeleton-line skeleton-line--sm"></div></template></el-table-column>
          <el-table-column label="使用次数" width="100"><template #default><div class="skeleton-line skeleton-line--sm"></div></template></el-table-column>
          <el-table-column label="操作" width="220"><template #default><div class="skeleton-line skeleton-line--sm"></div></template></el-table-column>
        </el-table>
      </div>

      <el-pagination
        v-if="totalCount > 0"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="totalCount"
        layout="total, prev, pager, next, jumper"
        class="pagination"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { queryReports, queryMyReports, queryFavoriteReports, toggleFavorite } from '@/api/reportCenter'

const router = useRouter()

const loading = ref(false)
const activeTab = ref('all')
const searchKeyword = ref('')
const filterCategory = ref('')
const filterStatus = ref('')
const filterCreator = ref('')
const filterDate = ref('')
const viewMode = ref('card')
const currentPage = ref(1)
const pageSize = ref(12)
const searchInputRef = ref(null)

const reports = ref([])
const totalCount = ref(0)

// SVG icons for category tabs (no emoji)
const TAB_ICONS = {
  all: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  my: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  favorites: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  recent: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  finance: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',
  hr: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
  sales: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  production: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20h20"/><path d="M5 20V8l5 4V8l5 4V8l4 4v8"/></svg>',
}

// SVG icons for report card category (no emoji)
const CATEGORY_ICONS = {
  finance: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',
  hr: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
  sales: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  production: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20h20"/><path d="M5 20V8l5 4V8l5 4V8l4 4v8"/></svg>',
  other: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
}

const categoryTabs = ref([
  { id: 'all', label: '全部', icon: TAB_ICONS.all, count: 0 },
  { id: 'my', label: '我的', icon: TAB_ICONS.my, count: 0 },
  { id: 'favorites', label: '收藏', icon: TAB_ICONS.favorites, count: 0 },
  { id: 'recent', label: '最近', icon: TAB_ICONS.recent, count: 0 },
  { id: 'finance', label: '财务', icon: TAB_ICONS.finance, count: 0 },
  { id: 'hr', label: '人事', icon: TAB_ICONS.hr, count: 0 },
  { id: 'sales', label: '销售', icon: TAB_ICONS.sales, count: 0 },
  { id: 'production', label: '生产', icon: TAB_ICONS.production, count: 0 },
])

const paginatedReports = computed(() => reports.value)

function onKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    searchInputRef.value?.focus()
  }
}

onMounted(() => { loadReports(); document.addEventListener('keydown', onKeydown) })
onUnmounted(() => { document.removeEventListener('keydown', onKeydown) })

const mockReports = [
  { id: 1, name: '月度销售报表', code: 'SALES-202607', description: '用于统计月度销售数据和趋势分析', type: 'statistics', status: 'published', creatorName: '张三', updatedAt: '2026-07-15', useCount: 128, isFavorite: true, category: 'sales' },
  { id: 2, name: '财务费用报表', code: 'FIN-202607', description: '用于统计财务费用支出情况', type: 'statistics', status: 'published', creatorName: '李四', updatedAt: '2026-07-14', useCount: 86, isFavorite: false, category: 'finance' },
  { id: 3, name: '人事考勤报表', code: 'HR-202607', description: '用于统计员工月度考勤情况', type: 'entry', status: 'filling', creatorName: '王五', updatedAt: '2026-07-13', useCount: 256, isFavorite: true, category: 'hr' },
  { id: 4, name: '生产产量报表', code: 'PROD-202607', description: '用于统计生产车间产量数据', type: 'statistics', status: 'draft', creatorName: '赵六', updatedAt: '2026-07-12', useCount: 45, isFavorite: false, category: 'production' },
  { id: 5, name: '采购成本报表', code: 'PUR-202607', description: '用于统计采购成本明细', type: 'statistics', status: 'reviewing', creatorName: '张三', updatedAt: '2026-07-11', useCount: 67, isFavorite: false, category: 'finance' },
  { id: 6, name: '库存盘点报表', code: 'INV-202607', description: '用于库存盘点和管理', type: 'entry', status: 'published', creatorName: '李四', updatedAt: '2026-07-10', useCount: 134, isFavorite: false, category: 'other' },
  { id: 7, name: '员工薪资报表', code: 'HR-SAL-202607', description: '员工薪资发放统计', type: 'statistics', status: 'completed', creatorName: '王五', updatedAt: '2026-07-09', useCount: 98, isFavorite: false, category: 'hr' },
  { id: 8, name: '客户回款报表', code: 'SALES-RCV-202607', description: '客户回款情况统计', type: 'statistics', status: 'draft', creatorName: '赵六', updatedAt: '2026-07-08', useCount: 34, isFavorite: false, category: 'sales' },
]

async function loadReports() {
  loading.value = true
  try {
    const params = { keyword: searchKeyword.value || undefined, category: filterCategory.value || undefined, status: filterStatus.value || undefined, page: currentPage.value, size: pageSize.value }
    let result
    if (activeTab.value === 'my') result = await queryMyReports(params)
    else if (activeTab.value === 'favorites') result = await queryFavoriteReports(params)
    else if (['finance', 'hr', 'sales', 'production'].includes(activeTab.value)) { params.category = activeTab.value; result = await queryReports(params) }
    else result = await queryReports(params)

    if (result?.records) { reports.value = result.records; totalCount.value = result.total }
    else { console.warn('[ReportCenter] API 返回空数据，使用模拟数据'); reports.value = mockReports; totalCount.value = mockReports.length }
  } catch (e) { console.error('[ReportCenter] 加载报表失败:', e.message || e); reports.value = mockReports; totalCount.value = mockReports.length }
  finally { loading.value = false; updateTabCounts() }
}

function getStatusText(status) {
  return { draft: '草稿', published: '已发布', filling: '填报中', reviewing: '审核中', completed: '已完成', disabled: '已停用' }[status] || status
}

function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || CATEGORY_ICONS.other
}

function getCategoryText(category) {
  return { finance: '财务', hr: '人事', sales: '销售', production: '生产', other: '其他' }[category] || category
}

function handleSearch() { currentPage.value = 1; loadReports() }
function handleReset() { searchKeyword.value = ''; filterCategory.value = ''; filterStatus.value = ''; filterCreator.value = ''; filterDate.value = ''; currentPage.value = 1; loadReports() }
function handlePageChange(page) { currentPage.value = page; loadReports() }

async function toggleFavoriteReport(report) {
  try { await toggleFavorite(report.id); report.isFavorite = !report.isFavorite; updateTabCounts() }
  catch { report.isFavorite = !report.isFavorite }
}

function updateTabCounts() {
  categoryTabs.value = categoryTabs.value.map(tab => {
    if (tab.id === 'all') return { ...tab, count: reports.value.length }
    if (tab.id === 'my') return { ...tab, count: reports.value.filter(r => r.creatorName === '张三').length }
    if (tab.id === 'favorites') return { ...tab, count: reports.value.filter(r => r.isFavorite).length }
    return { ...tab, count: reports.value.filter(r => r.category === tab.id).length }
  })
}

function handleViewReport(report) { router.push('/report/' + report.id) }
function handleEditReport(report) { router.push('/designer/' + report.code) }
function handleTabClick(tabId) { activeTab.value = tabId; currentPage.value = 1; loadReports() }

function handleCardAction(command, report) {
  switch (command) {
    case 'favorite': toggleFavoriteReport(report); break
    case 'share': ElMessage.info('分享功能开发中'); break
    case 'versions': router.push('/designer/versions?code=' + report.code); break
    case 'export': ElMessage.info('导出功能开发中'); break
    case 'delete': ElMessage.warning('删除功能需要管理员权限'); break
  }
}
</script>

<style scoped>
.report-center { padding: var(--app-content-padding); min-height: calc(100vh - 100px); }

/* ===== Page Header ===== */
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--app-space-6); }
.header-left .page-title { font-size: 20px; font-weight: 600; color: var(--app-text-primary); margin: 0; }
.header-left .page-desc { font-size: 13px; color: var(--app-text-muted); margin: 4px 0 0; }

/* ===== Search Area ===== */
.search-area { background: var(--app-surface); border-radius: var(--app-card-radius); padding: var(--app-space-4) var(--app-space-5); margin-bottom: var(--app-space-4); box-shadow: var(--app-shadow-sm); display: flex; align-items: center; gap: var(--app-space-3); flex-wrap: wrap; }

.search-box { position: relative; width: 360px; }
.search-box-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--app-text-muted); pointer-events: none; }
.search-box-input { width: 100%; height: 40px; padding: 0 70px 0 36px; border: 1px solid var(--app-border); border-radius: var(--app-radius-md); font-size: 14px; color: var(--app-text-primary); background: var(--app-surface); outline: none; transition: border-color var(--app-transition); box-sizing: border-box; }
.search-box-input::placeholder { color: var(--app-text-muted); }
.search-box-input:focus { border-color: var(--app-primary); box-shadow: 0 0 0 3px var(--app-primary-bg); }

.search-box-clear { position: absolute; right: 60px; top: 50%; transform: translateY(-50%); border: none; background: none; color: var(--app-text-muted); cursor: pointer; padding: 4px; display: flex; }
.search-box-clear:hover { color: var(--app-text-primary); }
.search-box-kbd { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-size: 11px; padding: 2px 6px; border-radius: var(--app-radius-xs); background: var(--app-surface-hover); border: 1px solid var(--app-border); color: var(--app-text-muted); font-family: var(--app-font-family-code); pointer-events: none; }

.filter-group { display: flex; gap: var(--app-space-2); }
.search-actions { display: flex; gap: var(--app-space-2); }
.view-toggle { margin-left: auto; display: flex; gap: 4px; background: var(--app-surface-hover); padding: 4px; border-radius: var(--app-radius-sm); }
.toggle-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: none; background: transparent; border-radius: var(--app-radius-xs); cursor: pointer; color: var(--app-text-secondary); transition: all var(--app-transition); }
.toggle-btn:hover { background: var(--app-surface-active); }
.toggle-btn.active { background: var(--app-surface); color: var(--app-primary); box-shadow: var(--app-shadow-xs); }

/* ===== Category Tabs (48px height per doc §9) ===== */
.category-tabs { background: var(--app-surface); border-radius: var(--app-card-radius); margin-bottom: var(--app-space-4); box-shadow: var(--app-shadow-sm); }
.tabs-inner { display: flex; padding: 0 var(--app-space-3); overflow-x: auto; height: 48px; }
.tab-item { display: flex; align-items: center; gap: 6px; padding: 0 var(--app-space-4); height: 48px; cursor: pointer; transition: all var(--app-transition); color: var(--app-text-secondary); font-size: var(--app-font-body); white-space: nowrap; border: none; border-bottom: 2px solid transparent; margin-bottom: -1px; background: none; font-family: inherit; }
.tab-item:hover { color: var(--app-text-primary); }
.tab-item.active { color: var(--app-primary); border-bottom-color: var(--app-primary); font-weight: 500; }
.tab-icon { display: flex; align-items: center; }
.tab-label { flex: 1; }
.tab-count { font-size: 12px; color: var(--app-text-muted); background: var(--app-surface-hover); padding: 0 6px; border-radius: 10px; min-width: 20px; text-align: center; }
.tab-item.active .tab-count { background: var(--app-primary-bg); color: var(--app-primary); }

/* ===== Report Container ===== */
.report-container { background: var(--app-surface); border-radius: var(--app-card-radius); box-shadow: var(--app-shadow-sm); min-height: 300px; overflow: hidden; }
.report-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 320px)); gap: var(--app-card-gap); padding: var(--app-space-6); justify-content: center; }

/* ===== Report Card (320×220, radius 16, padding 20 per doc §12) ===== */
.report-card { width: 320px; height: 220px; padding: 20px; border: 1px solid var(--app-border); border-radius: 16px; cursor: pointer; transition: all var(--app-transition); position: relative; background: var(--app-surface); display: flex; flex-direction: column; box-sizing: border-box; }
.report-card:hover { border-color: var(--app-primary); box-shadow: var(--app-shadow-md); transform: translateY(-2px); }

.card-icon { width: 44px; height: 44px; border-radius: var(--app-radius-md); display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
.card-icon.finance { background: var(--app-primary-bg); color: var(--app-primary); }
.card-icon.hr { background: var(--app-info-bg); color: var(--app-info); }
.card-icon.sales { background: var(--app-success-bg); color: var(--app-success); }
.card-icon.production { background: var(--app-warning-bg); color: var(--app-warning); }
.card-icon.other { background: var(--app-surface-hover); color: var(--color-gray-600); }

.card-title { font-size: 16px; font-weight: 600; color: var(--app-text-primary); margin: 0 0 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-right: 30px; }
.card-code { font-size: 12px; color: var(--app-text-muted); font-family: var(--app-font-family-code); margin: 0 0 8px; }
.card-desc { font-size: 14px; color: var(--color-gray-600); margin: 0 0 12px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

.card-tags { display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap; }

/* Status Tags (CSS variables per doc §13) */
.tag { font-size: 11px; padding: 3px 8px; border-radius: var(--app-radius-xs); font-weight: 500; }
.tag-draft { background: var(--app-surface-hover); color: var(--color-gray-600); }
.tag-published { background: var(--app-primary-bg); color: var(--app-primary); }
.tag-filling { background: var(--app-info-bg); color: var(--app-info); }
.tag-reviewing { background: var(--app-warning-bg); color: var(--app-warning); }
.tag-completed { background: var(--app-success-bg); color: var(--app-success); }
.tag-disabled { background: var(--app-surface-hover); color: var(--app-text-disabled); }
.tag-category { background: var(--app-surface-hover); color: var(--app-text-secondary); }

.card-meta { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
.meta-item { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--app-text-muted); }

/* Card Actions (hover per doc §14) */
.card-actions { margin-top: auto; display: flex; gap: 8px; }
.action-btn { flex: 1; height: 32px; border-radius: var(--app-radius-sm); border: none; font-size: 13px; font-weight: 500; cursor: pointer; transition: all var(--app-transition); background: var(--app-primary); color: #fff; }
.action-btn:hover { background: var(--app-primary-hover); }
.action-btn--ghost { flex: 0 0 auto; padding: 0 12px; background: var(--app-surface); color: var(--app-text-secondary); border: 1px solid var(--app-border); }
.action-btn--ghost:hover { border-color: var(--app-primary); color: var(--app-primary); }

.action-more { width: 32px; height: 32px; border-radius: var(--app-radius-sm); border: 1px solid var(--app-border); background: var(--app-surface); color: var(--app-text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all var(--app-transition); flex-shrink: 0; }
.action-more:hover { background: var(--app-surface-hover); border-color: var(--app-text-muted); }

.card-favorite { position: absolute; top: 16px; right: 16px; padding: 4px; border-radius: var(--app-radius-xs); cursor: pointer; transition: all var(--app-transition); }
.card-favorite:hover { background: var(--app-surface-hover); }
.favorite-icon { color: var(--app-text-muted); transition: all var(--app-transition); }
.favorite-icon.filled { color: var(--app-warning); fill: var(--app-warning); }

/* ===== Table View ===== */
.report-table { padding: var(--app-space-6); }
.table-name-cell { display: flex; align-items: center; gap: 10px; }
.table-name { font-size: 14px; font-weight: 500; color: var(--app-text-primary); }
.table-code { font-size: 12px; color: var(--app-text-muted); }
.table-icon { width: 36px; height: 36px; border-radius: var(--app-radius-sm); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.table-icon.finance { background: var(--app-primary-bg); color: var(--app-primary); }
.table-icon.hr { background: var(--app-info-bg); color: var(--app-info); }
.table-icon.sales { background: var(--app-success-bg); color: var(--app-success); }
.table-icon.production { background: var(--app-warning-bg); color: var(--app-warning); }
.table-icon.other { background: var(--app-surface-hover); color: var(--color-gray-600); }

/* ===== Empty State (doc §19) ===== */
.rc-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; grid-column: 1 / -1; }
.rc-empty-text { margin: var(--app-space-3) 0; font-size: 14px; color: var(--app-text-muted); }
.rc-empty-hint { margin: 0; font-size: 13px; color: var(--app-text-muted); opacity: 0.7; }

/* ===== Skeleton ===== */
.report-card--skeleton { cursor: default; pointer-events: none; }
.report-card--skeleton:hover { transform: none; box-shadow: none; border-color: var(--app-border); }
.skeleton-icon { width: 44px; height: 44px; border-radius: var(--app-radius-md); margin-bottom: 12px; animation: shimmer 1.5s ease-in-out infinite; background-size: 200% 100%; background-image: linear-gradient(90deg, var(--app-surface-hover) 0%, var(--app-border) 50%, var(--app-surface-hover) 100%); }
.skeleton-line { height: 13px; border-radius: 6px; margin-bottom: 8px; animation: shimmer 1.5s ease-in-out infinite; background-size: 200% 100%; background-image: linear-gradient(90deg, var(--app-surface-hover) 0%, var(--app-border) 50%, var(--app-surface-hover) 100%); }
.skeleton-line--title { width: 70%; height: 16px; }
.skeleton-line--code { width: 50%; height: 11px; }
.skeleton-line--desc { width: 90%; height: 12px; margin-bottom: 6px; }
.skeleton-line--md { width: 70%; }
.skeleton-line--sm { width: 50%; height: 11px; }
.skeleton-tags { display: flex; gap: 8px; margin-bottom: 10px; }
.skeleton-tag { width: 50px; height: 20px; border-radius: var(--app-radius-xs); animation: shimmer 1.5s ease-in-out infinite; background-size: 200% 100%; background-image: linear-gradient(90deg, var(--app-surface-hover) 0%, var(--app-border) 50%, var(--app-surface-hover) 100%); }
.skeleton-meta { display: flex; gap: 16px; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ===== Pagination ===== */
.pagination { display: flex; justify-content: flex-end; margin-top: 20px; padding: 0 var(--app-space-6) var(--app-space-6); }

/* ===== Responsive (doc §21: Desktop 3-4 cols, Tablet 2, Mobile 1) ===== */
@media (max-width: 1200px) {
  .report-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 280px)); }
  .report-card { width: 280px; height: 200px; }
}
@media (max-width: 768px) {
  .search-area { flex-direction: column; align-items: stretch; }
  .search-box { width: 100%; }
  .filter-group { flex-wrap: wrap; }
  .search-actions { justify-content: flex-end; }
  .view-toggle { margin-left: 0; justify-content: flex-end; }
  .search-box-kbd { display: none; }
  .report-grid { grid-template-columns: 1fr; }
  .report-card { width: 100%; height: auto; }
}
</style>
