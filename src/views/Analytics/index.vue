<template>
  <div class="agg-page">
    <!-- 面包屑 -->
    <div class="agg-breadcrumb">
      <span>统计汇总与分析</span>
      <span class="agg-breadcrumb-arrow">/</span>
      <span>{{ breadcrumbLevel1 }}</span>
      <span class="agg-breadcrumb-arrow">/</span>
      <span class="agg-breadcrumb-current">{{ breadcrumbLevel2 }}</span>
    </div>

    <!-- 分类标签页 -->
    <div class="agg-category-tabs">
      <button 
        v-for="tab in categoryTabs" 
        :key="tab.key"
        class="agg-category-tab"
        :class="{ active: pageType === tab.key }"
        @click="navigateToTab(tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 提示条 -->
    <div class="agg-notice">
      <span class="agg-notice-icon">&#9432;</span>
      {{ noticeText }}
    </div>

    <!-- 统计卡片 -->
    <div class="agg-stats">
      <div class="agg-stat-card">
        <div class="agg-stat-icon agg-stat-icon--total">&#128196;</div>
        <div class="agg-stat-info">
          <div class="agg-stat-label">汇总表总数</div>
          <div class="agg-stat-value">{{ totalCount }}</div>
        </div>
      </div>
      <div class="agg-stat-card">
        <div class="agg-stat-icon agg-stat-icon--ok">&#10003;</div>
        <div class="agg-stat-info">
          <div class="agg-stat-label">已汇总</div>
          <div class="agg-stat-value agg-stat-value--ok">{{ okCount }}</div>
        </div>
      </div>
      <div class="agg-stat-card">
        <div class="agg-stat-icon agg-stat-icon--processing">&#9716;</div>
        <div class="agg-stat-info">
          <div class="agg-stat-label">汇总中</div>
          <div class="agg-stat-value agg-stat-value--processing">{{ processingCount }}</div>
        </div>
      </div>
      <div class="agg-stat-card">
        <div class="agg-stat-icon agg-stat-icon--pending">&#9203;</div>
        <div class="agg-stat-info">
          <div class="agg-stat-label">待汇总</div>
          <div class="agg-stat-value agg-stat-value--pending">{{ pendingCount }}</div>
        </div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="agg-filter-bar">
      <!-- 统计汇总：期间 + 类别 + 状态 -->
      <template v-if="!isPlanMode">
        <div class="agg-filter-group">
          <span class="agg-filter-label">期间</span>
          <select v-model="filterPeriod" class="agg-filter-select">
            <option value="">全部</option>
            <option v-for="p in allPeriods" :key="p" :value="p">{{ p }}</option>
          </select>
        </div>
        <div class="agg-filter-group">
          <span class="agg-filter-label">报表类别</span>
          <select v-model="filterCategory" class="agg-filter-select">
            <option value="">全部</option>
            <option value="production">生产类</option>
            <option value="finance">财务类</option>
            <option value="safety">安全类</option>
            <option value="energy">能源类</option>
            <option value="cost">成本类</option>
          </select>
        </div>
        <div class="agg-filter-group">
          <span class="agg-filter-label">状态</span>
          <select v-model="filterStatus" class="agg-filter-select">
            <option value="">全部</option>
            <option value="ok">已汇总</option>
            <option value="processing">汇总中</option>
            <option value="pending">待汇总</option>
          </select>
        </div>
      </template>
      <!-- 计划汇总：年度 + 批次 -->
      <template v-else>
        <div class="agg-filter-group">
          <span class="agg-filter-label">年度</span>
          <select v-model="filterPeriod" class="agg-filter-select">
            <option value="">全部</option>
            <option v-for="y in planYears" :key="y" :value="y">{{ y }}年</option>
          </select>
        </div>
        <div class="agg-filter-group" v-if="pageType === 'batchPlan'">
          <span class="agg-filter-label">批次</span>
          <select v-model="filterCategory" class="agg-filter-select">
            <option value="">全部</option>
            <option value="1">第一批</option>
            <option value="2">第二批</option>
            <option value="3">第三批</option>
            <option value="4">第四批</option>
          </select>
        </div>
        <div class="agg-filter-group" v-if="pageType === 'planLedger' || pageType === 'planCompletion'">
          <span class="agg-filter-label">单位</span>
          <select v-model="filterCategory" class="agg-filter-select">
            <option value="">全部单位</option>
            <option v-for="org in planOrgs" :key="org.id" :value="org.id">{{ org.name }}</option>
          </select>
        </div>
      </template>
      <div class="agg-filter-group">
        <input v-model="filterSearch" class="agg-filter-input" placeholder="搜索汇总表名称" />
      </div>
      <button class="agg-btn agg-btn-primary" @click="applyFilter">
        <span class="agg-btn-icon">&#128269;</span> 查询
      </button>
      <button class="agg-btn" @click="resetFilter">
        <span class="agg-btn-icon">&#8634;</span> 重置
      </button>
    </div>

    <!-- 表格区域 -->
    <div class="agg-table-section">
      <div class="agg-table-header">
        <span class="agg-table-title">{{ tableTitle }}</span>
        <div class="agg-table-actions">
          <button v-if="isPlanMode" class="agg-table-action-btn">
            <span>&#8681;</span> 批量下载
          </button>
          <button class="agg-table-action-btn">
            <span>&#128424;</span> 批量打印
          </button>
        </div>
      </div>

      <div v-if="summaryLoading" class="agg-loading">
        <div class="agg-loading-spinner"></div>
      </div>
      <div v-else-if="filteredRows.length === 0" class="agg-empty">
        暂无数据
      </div>
      <table v-else class="agg-table">
        <thead>
          <tr>
            <th style="width:50px">
              <input type="checkbox" class="agg-check-all" @change="toggleSelectAll" />
            </th>
            <th style="width:60px">序号</th>
            <th style="width:120px">期间</th>
            <th>汇总表名称</th>
            <th v-if="isPlanMode" style="width:100px">报表类别</th>
            <th v-if="isPlanMode" style="width:180px">📊 数据来源</th>
            <th style="width:100px">报表状态</th>
            <th style="width:100px">参与单位</th>
            <th style="width:140px">最后更新时间</th>
            <th style="width:140px">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in pageRows" :key="row.key" :class="{ 'agg-tr-selected': selectedRows.includes(row.key) }">
            <td><input type="checkbox" :checked="selectedRows.includes(row.key)" @change="toggleSelect(row.key)" /></td>
            <td>{{ (currentPage - 1) * pageSize + idx + 1 }}</td>
            <td>{{ row.period || '-' }}</td>
            <td class="agg-cell-name">{{ row.templateName }}</td>
            <td v-if="isPlanMode">
              <span class="agg-category-tag" :class="categoryClass(row.category)">{{ row.categoryText }}</span>
            </td>
            <td v-if="isPlanMode">
              <div v-if="row.dataSource" class="agg-source-cell">
                <el-tag size="small" type="info" effect="plain" style="margin-bottom: 2px;">
                  {{ row.dataSource.sourceMenu || '计划上报' }}
                </el-tag>
                <div style="font-size: 12px; color: #606266; line-height: 1.4;">
                  <div v-if="row.dataSource.totalSubmitOrg !== undefined">
                    已上报: <b :style="{ color: row.dataSource.totalSubmitOrg > 0 ? '#67c23a' : '#909399' }">
                      {{ row.dataSource.totalSubmitOrg }}
                    </b> / {{ row.totalOrg || 0 }} 个组织
                  </div>
                  <div v-if="row.dataSource.latestSubmitTime" style="color: #909399; font-size: 11px;">
                    最近: {{ formatSourceTime(row.dataSource.latestSubmitTime) }}
                  </div>
                  <a v-if="row.dataSource.totalSubmitOrg > 0"
                     class="agg-link agg-link--primary"
                     style="font-size: 12px;"
                     @click="openSourceDetail(row)">
                    查看来源明细 →
                  </a>
                </div>
              </div>
              <div v-else class="agg-source-empty">
                <span style="color: #e6a23c; font-size: 12px;">⚠ 无来源</span>
              </div>
            </td>
            <td>
              <span class="agg-status-tag" :class="row.statusClass">
                <span v-if="row.status === 'ok'" class="agg-status-dot agg-status-dot--ok"></span>
                <span v-else-if="row.status === 'processing'" class="agg-status-dot agg-status-dot--processing"></span>
                <span v-else-if="row.status === 'pending'" class="agg-status-dot agg-status-dot--pending"></span>
                {{ row.statusText }}
              </span>
            </td>
            <td>{{ row.orgCount }} 个</td>
            <td>{{ row.updateTime || '-' }}</td>
            <td>
              <a class="agg-link" @click="openDetail(row)">查看</a>
              <a class="agg-link" @click="refreshReport(row)">刷新</a>
              <a class="agg-link" @click="printReport(row)">打印</a>
              <a class="agg-link" @click="downloadReport(row)">下载</a>
              <a v-if="row.status !== 'ok'" class="agg-link agg-link--primary" @click="generateReport(row)">生成</a>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 分页 -->
      <div v-if="filteredRows.length > 0" class="agg-pagination">
        <span class="agg-page-info">共 {{ filteredRows.length }} 条记录</span>
        <div class="agg-page-btns">
          <button class="agg-page-btn" :disabled="currentPage === 1" @click="currentPage--">&laquo;</button>
          <button
            v-for="p in pageNumbers"
            :key="p"
            class="agg-page-btn"
            :class="{ 'agg-page-btn--active': p === currentPage }"
            @click="currentPage = p"
          >{{ p }}</button>
          <button class="agg-page-btn" :disabled="currentPage === totalPages" @click="currentPage++">&raquo;</button>
        </div>
      </div>
    </div>



    <!-- ========== 详情弹窗（全屏模式） ========== -->
    <Teleport to="body">
      <div v-if="detailMode" class="agg-overlay" @click.self="closeDetail">
        <div class="agg-detail-modal">
          <div class="agg-detail-toolbar">
            <button class="agg-btn agg-btn-back" @click="closeDetail">
              <span>&#8592;</span> 返回
            </button>
            <span class="agg-detail-title">{{ reportData?.templateName || '' }}</span>
            <div class="agg-detail-right">
              <span class="agg-filter-label">期间</span>
              <select v-model="period" class="agg-filter-select" style="min-width:140px" @change="loadReport">
                <option value="">全部</option>
                <option v-for="p in periodList" :key="p" :value="p">{{ p }}</option>
              </select>
              <button class="agg-table-action-btn" style="margin-left:8px">
                <span>&#128424;</span> 打印
              </button>
            </div>
          </div>

          <div v-if="reportLoading" class="agg-loading">
            <div class="agg-loading-spinner"></div>
            <p>加载中...</p>
          </div>

          <div v-else-if="reportData && reportData.contributorCount > 0" class="agg-table-wrapper">
            <div class="agg-table-scroll">
              <table class="agg-table">
                <thead>
                  <tr v-for="(headerRow, hi) in headerRows" :key="'h'+hi">
                    <th class="agg-th agg-th-row-header" :rowspan="headerRows.length" v-if="hi === 0">行次</th>
                    <th
                      v-for="col in headerRow"
                      :key="col.id"
                      :colspan="col.colspan || 1"
                      :rowspan="col.rowspan || 1"
                      class="agg-th"
                      :class="{ 'agg-th-group': col.isGroup }"
                    >{{ col.name }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in flatRows" :key="row.id">
                    <td class="agg-td agg-td-row-header" :class="{ 'agg-td-summary': row.isSummary }" :style="{ paddingLeft: (row.level * 16 + 8) + 'px' }">
                      {{ row.name }}
                    </td>
                    <td
                      v-for="col in leafColumns"
                      :key="col.id"
                      class="agg-td agg-td-cell"
                      :class="{ 'agg-td-clickable': hasCellData(row.id, col.id), 'agg-td-summary': row.isSummary }"
                      @click="openCellDetail(row, col)"
                    >
                      <span v-if="hasCellData(row.id, col.id)" class="agg-cell-value">{{ getCellValue(row.id, col.id) }}</span>
                      <span v-else class="agg-cell-empty">-</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-else-if="reportData" class="agg-empty">
            <p>暂无数据</p>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ========== 单元格明细弹窗 ========== -->
    <Teleport to="body">
      <div v-if="cellDetailVisible" class="agg-overlay" @click.self="cellDetailVisible = false">
        <div class="agg-dialog">
          <div class="agg-dialog-header">
            <h3>数据构成</h3>
            <button class="agg-dialog-close" @click="cellDetailVisible = false">&times;</button>
          </div>
          <div class="agg-dialog-body">
            <div class="agg-dinfo">
              <span><strong>{{ cellDetail.rowName || cellDetail.rowCode }}</strong> / <strong>{{ cellDetail.columnName || cellDetail.columnCode }}</strong></span>
              <span class="agg-dinfo-total">合计：<strong>{{ cellDetail.aggregatedValue }}</strong></span>
            </div>
            <div v-if="cellDetailLoading" class="agg-loading agg-loading-sm"><div class="agg-loading-spinner agg-loading-spinner-sm"></div></div>
            <table v-else class="agg-dtable">
              <thead>
                <tr><th>序号</th><th>单位名称</th><th>填报值</th><th>状态</th></tr>
              </thead>
              <tbody>
                <tr v-for="(c, idx) in cellDetail.contributors" :key="c.orgId">
                  <td>{{ idx + 1 }}</td>
                  <td>{{ c.orgName }}</td>
                  <td class="agg-dvalue">{{ c.value }}</td>
                  <td><span class="agg-status-tag" :class="statusClass(c.submitStatus)">{{ c.submitStatusText }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ========== 数据来源明细弹窗 ========== -->
    <Teleport to="body">
      <div v-if="sourceDetailVisible" class="agg-overlay" @click.self="sourceDetailVisible = false">
        <div class="agg-dialog" style="max-width: 720px;">
          <div class="agg-dialog-header">
            <h3>📊 数据来源明细</h3>
            <button class="agg-dialog-close" @click="sourceDetailVisible = false">&times;</button>
          </div>
          <div class="agg-dialog-body">
            <div class="agg-dinfo" style="margin-bottom: 16px;">
              <span><strong>{{ sourceDetailTarget?.templateName }}</strong></span>
              <span style="margin-left: 16px; color: #909399;">{{ sourceDetailTarget?.period || '' }}</span>
            </div>
            <el-alert
              type="info"
              :closable="false"
              show-icon
              style="margin-bottom: 16px;"
            >
              <template #title>
                本汇总表的<b>所有数据</b>来源于【填报中心-计划上报】菜单的填报记录。下表展示各组织的填报情况：
              </template>
            </el-alert>
            <div v-if="sourceDetailList.length === 0" class="agg-empty" style="padding: 40px;">
              <p>⚠ 暂无填报来源数据</p>
              <p style="font-size: 12px; color: #909399;">需要下级组织在【计划上报】菜单中录入并提交数据</p>
            </div>
            <table v-else class="agg-dtable">
              <thead>
                <tr>
                  <th style="width:50px">序号</th>
                  <th>填报组织</th>
                  <th>期间</th>
                  <th>填报ID</th>
                  <th>状态</th>
                  <th>最近填报时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in sourceDetailList" :key="item.submitId || idx">
                  <td>{{ idx + 1 }}</td>
                  <td><strong>{{ item.orgName }}</strong></td>
                  <td>{{ item.period || '-' }}</td>
                  <td>
                    <a v-if="item.submitId" class="agg-link agg-link--primary" @click="goToSource(item)">
                      #{{ item.submitId }}
                    </a>
                    <span v-else>-</span>
                  </td>
                  <td>
                    <el-tag size="small" :type="getSourceStatusType(item.submitStatus)">
                      {{ getSourceStatusText(item.submitStatus) }}
                    </el-tag>
                  </td>
                  <td>{{ formatSourceTime(item.updateTime) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ========== 生成汇总弹窗 ========== -->
    <Teleport to="body">
      <div v-if="generateVisible" class="agg-overlay" @click.self="generateVisible = false">
        <div class="agg-dialog" style="max-width: 520px;">
          <div class="agg-dialog-header">
            <h3>生成汇总</h3>
            <button class="agg-dialog-close" @click="generateVisible = false">&times;</button>
          </div>
          <div class="agg-dialog-body">
            <div class="agg-form-group">
              <label class="agg-form-label">汇总表名称</label>
              <div class="agg-form-value">{{ generateTarget?.templateName || '' }}</div>
            </div>
            <div class="agg-form-group">
              <label class="agg-form-label">期间</label>
              <select v-model="generateForm.period" class="agg-filter-select" style="width:100%">
                <option value="2025">2025年</option>
                <option value="2026">2026年</option>
              </select>
            </div>
            <div class="agg-form-group">
              <label class="agg-form-label">报表类别</label>
              <select v-model="generateForm.category" class="agg-filter-select" style="width:100%">
                <option value="production">生产类</option>
                <option value="comprehensive">综合类</option>
                <option value="investment">投资类</option>
                <option value="jianjian">维简</option>
                <option value="huanbao">环保</option>
                <option value="anquan">安全</option>
                <option value="zhejiu">折旧</option>
                <option value="daxiu">大修</option>
              </select>
            </div>
            <div class="agg-form-group" v-if="isPlanMode">
              <label class="agg-form-label">批次</label>
              <select v-model="generateForm.batch" class="agg-filter-select" style="width:100%">
                <option value="1">第一批</option>
                <option value="2">第二批</option>
                <option value="3">第三批</option>
              </select>
            </div>
            <div class="agg-generate-notice">
              <span>&#9432;</span>
              生成后汇总数据将根据已上报的各单位数据进行自动汇总计算，请确保各单位数据已全部上报完成。
            </div>
          </div>
          <div class="agg-dialog-footer">
            <button class="agg-btn" @click="generateVisible = false">取消</button>
            <button class="agg-btn agg-btn-primary" @click="confirmGenerate" :disabled="generateSubmitting">
              <span v-if="generateSubmitting" class="agg-loading-spinner" style="width:14px;height:14px;border-width:2px;margin-right:4px"></span>
              {{ generateSubmitting ? '生成中...' : '确认生成' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAggregationReport, getAvailablePeriods, getCellDetail, getPlanSummary, getPlanLedger, getPlanCompletion, generatePlanSummary, generateAggregation, exportAggregationUrl } from '@/api/analytics'
import { get } from '@/utils/http'

const route = useRoute()
const router = useRouter()

const categoryTabs = [
  { key: 'production', label: '生产类汇总', path: '/analytics/production' },
  { key: 'finance', label: '财务类汇总', path: '/analytics/finance' },
  { key: 'safety', label: '安全类汇总', path: '/analytics/safety' },
  { key: 'energy', label: '能源类汇总', path: '/analytics/energy' },
  { key: 'cost', label: '成本类汇总', path: '/analytics/cost' },
  { key: 'annualPlan', label: '年度计划汇总', path: '/plan/annual' },
  { key: 'batchPlan', label: '批次计划汇总', path: '/plan/batch' },
  { key: 'planLedger', label: '计划台账', path: '/plan/ledger' },
  { key: 'planCompletion', label: '集团计划完成情况表', path: '/plan/completion' },
]

function navigateToTab(key) {
  const tab = categoryTabs.find(t => t.key === key)
  if (tab && tab.path !== route.path) {
    router.push(tab.path)
  }
}

// ===== 页面配置 =====
const isPlanMode = computed(() => route.path.includes('/plan/'))
const pageType = computed(() => {
  if (route.path.includes('/analytics/production')) return 'production'
  if (route.path.includes('/analytics/finance')) return 'finance'
  if (route.path.includes('/analytics/safety')) return 'safety'
  if (route.path.includes('/analytics/energy')) return 'energy'
  if (route.path.includes('/analytics/cost')) return 'cost'
  if (route.path.includes('/analytics/comprehensive')) return 'comprehensive'
  if (route.path.includes('/analytics/investment')) return 'investment'
  if (route.path.includes('/plan/annual')) return 'annualPlan'
  if (route.path.includes('/plan/batch')) return 'batchPlan'
  if (route.path.includes('/plan/ledger')) return 'planLedger'
  if (route.path.includes('/plan/completion')) return 'planCompletion'
  if (route.path.includes('/data-analysis')) return 'dataAnalysis'
  return 'default'
})

const breadcrumbLevel1 = computed(() => {
  if (route.path.includes('/analytics/')) return '统计汇总'
  if (route.path.includes('/plan/')) return '计划汇总'
  if (route.path.includes('/data-analysis')) return '数据分析'
  return '统计汇总'
})

const breadcrumbLevel2 = computed(() => {
  const map = {
    production: '生产类汇总',
    comprehensive: '综合类汇总',
    investment: '投资类汇总',
    annualPlan: '年度计划汇总',
    batchPlan: '批次计划汇总',
    planLedger: '计划台账',
    planCompletion: '集团计划完成情况表'
  }
  return map[pageType.value] || '报表汇总'
})

const noticeText = computed(() => {
  if (pageType.value === 'production') return '根据基层单位每月填报的统计业务表，集团自动生成生产类汇总报表。统计科室可查看、刷新、打印汇总报表。'
  if (pageType.value === 'finance') return '根据基层单位每月填报的统计业务表，集团自动生成财务类汇总报表。统计科室可查看、刷新、打印汇总报表。'
  if (pageType.value === 'safety') return '根据基层单位每月填报的统计业务表，集团自动生成安全类汇总报表。统计科室可查看、刷新、打印汇总报表。'
  if (pageType.value === 'energy') return '根据基层单位每月填报的统计业务表，集团自动生成能源类汇总报表。统计科室可查看、刷新、打印汇总报表。'
  if (pageType.value === 'cost') return '根据基层单位每月填报的统计业务表，集团自动生成成本类汇总报表。统计科室可查看、刷新、打印汇总报表。'
  if (pageType.value === 'comprehensive') return '根据基层单位每月填报的统计业务表，集团自动生成综合类汇总报表。统计科室可查看、刷新、打印汇总报表。'
  if (pageType.value === 'investment') return '根据基层单位每月填报的统计业务表，集团自动生成投资类汇总报表。统计科室可查看、刷新、打印汇总报表。'
  if (pageType.value === 'annualPlan') return '根据各单位上报的年度计划数据，系统自动汇总生成年度计划报表，支持查看、下载、打印操作。'
  if (pageType.value === 'batchPlan') return '根据各单位上报的批次计划数据，系统自动汇总生成批次计划报表，支持查看、下载、打印操作。'
  if (pageType.value === 'planLedger') return '计划台账汇总了各单位各批次计划数据，支持按年度和批次维度查看汇总结果。'
  if (pageType.value === 'planCompletion') return '集团计划完成情况表汇总了各单位计划执行完成数据，支持按年度查看执行进度。'
  if (pageType.value === 'dataAnalysis') return '基于汇总数据进行分析，包括趋势分析、同比环比分析、各单位对比分析等。'
  return '根据下级单位填报的报表数据，系统自动生成汇总报表。上级单位可查看汇总数据，点击单元格可查看数据构成。'
})

const tableTitle = computed(() => {
  const map = {
    production: '生产类汇总报表列表',
    finance: '财务类汇总报表列表',
    safety: '安全类汇总报表列表',
    energy: '能源类汇总报表列表',
    cost: '成本类汇总报表列表',
    comprehensive: '综合类汇总报表列表',
    investment: '投资类汇总报表列表',
    annualPlan: '年度计划汇总列表',
    batchPlan: '批次计划汇总列表',
    planLedger: '计划台账列表',
    planCompletion: '集团计划完成情况表',
    dataAnalysis: '数据分析报表列表'
  }
  return map[pageType.value] || '汇总报表列表'
})

// ===== 概览列表 =====
const summaryLoading = ref(false)
const summary = ref(null)
const filterPeriod = ref('')
const filterCategory = ref('')
const filterStatus = ref('')
const filterSearch = ref('')

// 计划汇总专用
const planYears = computed(() => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => (currentYear - i).toString())
})
const planOrgs = ref([
  { id: 'org1', name: '第一分公司' },
  { id: 'org2', name: '第二分公司' },
  { id: 'org3', name: '第三分公司' },
  { id: 'org4', name: '第四分公司' },
  { id: 'org5', name: '第五分公司' },
])

const currentPage = ref(1)
const pageSize = ref(10)
const selectedRows = ref([])

// ===== 详情 =====
const detailMode = ref(false)
const selectedTemplateId = ref(null)
const period = ref('')
const periodList = ref([])
const reportLoading = ref(false)
const reportData = ref(null)

// ===== 明细弹窗 =====
const cellDetailVisible = ref(false)
const cellDetailLoading = ref(false)
const cellDetail = ref({ contributors: [] })

// ===== 数据来源明细弹窗 =====
const sourceDetailVisible = ref(false)
const sourceDetailTarget = ref(null)
const sourceDetailList = ref([])

function openSourceDetail(row) {
  sourceDetailTarget.value = row
  // 数据来源追溯信息由后端接口 buildDataSourceTrace 填充
  const sourceOrgs = (row.dataSource && row.dataSource.sourceOrgs) || []
  sourceDetailList.value = sourceOrgs
  sourceDetailVisible.value = true
}

function goToSource(item) {
  if (!item.submitId) {
    ElMessage.warning('该来源无对应填报记录')
    return
  }
  router.push({
    name: 'EntryPlanDetail',
    params: { submitId: item.submitId },
    query: { backUrl: route.fullPath }
  })
}

function formatSourceTime(t) {
  if (!t) return '-'
  if (typeof t === 'string') {
    return t.replace('T', ' ').substring(0, 19)
  }
  if (Array.isArray(t) && t.length >= 3) {
    // 后端 LocalDateTime 序列化为 [year, month, day, hour, minute, second]
    const [y, mo, d, h = 0, mi = 0, s = 0] = t
    return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')} ${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return new Date(t).toLocaleString('zh-CN')
}

function getSourceStatusType(status) {
  const types = {
    'PENDING': 'warning',
    'SUBMITTED': 'primary',
    'APPROVED': 'success',
    'REJECTED': 'danger',
    'REPORTED': 'info'
  }
  return types[status] || 'info'
}

function getSourceStatusText(status) {
  const texts = {
    'PENDING': '待填报',
    'SUBMITTED': '已提交',
    'APPROVED': '已审核',
    'REJECTED': '已退回',
    'REPORTED': '已上报'
  }
  return texts[status] || status
}

// ===== 初始化 =====
onMounted(() => loadSummary())

async function loadSummary() {
  summaryLoading.value = true
  try {
    let res = null

    // 计划汇总使用专用API
    if (pageType.value === 'annualPlan') {
      res = await getPlanSummary({ type: 'annual', year: filterPeriod.value || undefined })
    } else if (pageType.value === 'batchPlan') {
      res = await getPlanSummary({ type: 'batch', year: filterPeriod.value || undefined, batch: filterCategory.value || undefined })
    } else if (pageType.value === 'planLedger') {
      res = await getPlanLedger({ year: filterPeriod.value || undefined })
    } else if (pageType.value === 'planCompletion') {
      res = await getPlanCompletion({ year: filterPeriod.value || undefined })
    } else {
      // 统计汇总使用 /aggregation/summary
      const query = new URLSearchParams()
      if (filterPeriod.value) query.append('period', filterPeriod.value)
      if (pageType.value && pageType.value !== 'default' && pageType.value !== 'dataAnalysis') {
        query.append('category', pageType.value)
      }
      const qs = query.toString()
      res = await get(`/aggregation/summary${qs ? `?${qs}` : ''}`)
    }

    summary.value = res
  } catch (e) {
    summary.value = null
  } finally {
    summaryLoading.value = false
  }
}

// 展开成表格行（模板 × 周期）
const tableRows = computed(() => {
  const rows = []
  let tpls = []
  
  if (isPlanMode.value) {
    // 计划台账/完成情况：按"组织 × 模板"扁平展开成行
    if (pageType.value === 'planLedger' || pageType.value === 'planCompletion') {
      const tpls = summary.value?.templates || []
      const dataList = summary.value?.data || []
      dataList.forEach(d => {
        tpls.forEach(tpl => {
          const idKey = tpl.id
          const sourceSubmitId = d[`tpl_${idKey}_sourceSubmitId`]
          const sourceSubmitTime = d[`tpl_${idKey}_sourceSubmitTime`]
          const plan = d[`tpl_${idKey}_plan`] || '0'
          const actual = d[`tpl_${idKey}_actual`] || '0'
          const rate = d[`tpl_${idKey}_rate`] || '0%'
          const hasSource = !!sourceSubmitId
          rows.push({
            key: `${d.orgId}:${idKey}`,
            templateId: idKey,
            templateName: `${tpl.name} · ${d.orgName}`,
            period: summary.value?.year || '',
            category: 'plan',
            categoryText: '计划',
            orgName: d.orgName,
            orgId: d.orgId,
            plan: plan,
            actual: actual,
            rate: rate,
            orgCount: hasSource ? 1 : 0,
            totalOrg: 1,
            status: hasSource ? 'ok' : 'pending',
            statusText: hasSource ? '已填报' : '待填报',
            statusClass: hasSource ? 'agg-status-tag--ok' : 'agg-status-tag--pending',
            // 数据来源追溯：组织级追溯到具体提交记录
            dataSource: hasSource ? {
              sourceType: 'PLAN_REPORT',
              sourceMenu: '填报中心 / 计划上报',
              sourceTemplateId: idKey,
              sourceTemplateName: tpl.name,
              totalSubmitOrg: 1,
              sourceOrgs: [{
                orgId: String(d.orgId),
                orgName: d.orgName,
                period: summary.value?.year || '',
                submitId: String(sourceSubmitId),
                submitStatus: 1, // 已提交
                updateTime: sourceSubmitTime
              }],
              latestSubmitTime: sourceSubmitTime
            } : null,
            updateTime: sourceSubmitTime || null
          })
        })
      })
      return rows
    }
    // 年度/批次计划汇总：原有 summary.items 格式
    const planData = summary.value?.data || []
    for (const item of planData) {
      rows.push({
        key: `${item.templateId}:${item.year}`,
        templateId: item.templateId,
        templateName: item.templateName,
        period: item.year || '',
        category: item.category || '',
        categoryText: categoryText(item.category),
        orgCount: item.completedOrg || 0,
        totalOrg: item.totalOrg || 0,
        status: item.completionRate && parseFloat(item.completionRate) >= 100 ? 'ok'
               : (item.completedOrg && item.completedOrg > 0 ? 'processing' : 'pending'),
        statusText: item.completionRate && parseFloat(item.completionRate) >= 100 ? '已汇总'
                   : (item.completedOrg && item.completedOrg > 0 ? '汇总中' : '待汇总'),
        statusClass: item.completionRate && parseFloat(item.completionRate) >= 100 ? 'agg-status-tag--ok'
                     : (item.completedOrg && item.completedOrg > 0 ? 'agg-status-tag--processing' : 'agg-status-tag--pending'),
        // 数据来源追溯
        dataSource: item.dataSource || null,
        updateTime: item.dataSource && item.dataSource.latestSubmitTime
                   ? item.dataSource.latestSubmitTime
                   : null
      })
    }
    return rows
  }

  tpls = summary.value?.templates || []
  for (const tpl of tpls) {
    const periods = tpl.periods || []
    if (periods.length === 0) {
      rows.push({
        key: `${tpl.templateId}:`,
        templateId: tpl.templateId,
        templateName: tpl.templateName,
        period: '',
        category: tpl.category || '',
        categoryText: categoryText(tpl.category),
        orgCount: 0,
        status: 'pending',
        statusText: '待汇总',
        statusClass: 'agg-status-tag--pending',
        updateTime: null
      })
    } else {
      for (const p of periods) {
        const isLatest = p === tpl.latestPeriod
        const orgCount = tpl.orgCount || 0
        const totalOrg = summary.value?.totalOrgCount || 0
        // 仅当存在下级单位且 orgCount 小于 totalOrg 时为汇总中
        const hasPartialData = totalOrg > 0 && orgCount > 0 && orgCount < totalOrg
        // 完全没有下级填报时为待汇总
        const isPending = totalOrg > 0 && orgCount === 0
        const rowStatus = isPending ? 'pending' : (hasPartialData ? 'processing' : 'ok')
        const rowStatusText = isPending ? '待汇总' : (hasPartialData ? '汇总中' : '已汇总')
        const rowStatusClass = isPending ? 'agg-status-tag--pending'
                            : (hasPartialData ? 'agg-status-tag--processing' : 'agg-status-tag--ok')

        rows.push({
          key: `${tpl.templateId}:${p}`,
          templateId: tpl.templateId,
          templateName: tpl.templateName,
          period: p,
          category: tpl.category || '',
          categoryText: categoryText(tpl.category),
          orgCount: orgCount,
          status: rowStatus,
          statusText: rowStatusText,
          statusClass: rowStatusClass,
          updateTime: isLatest ? tpl.latestUpdateTime : null
        })
      }
    }
  }
  return rows
})

function categoryText(cat) {
  if (cat === 'production') return '生产'
  if (cat === 'finance') return '财务'
  if (cat === 'safety') return '安全'
  if (cat === 'energy') return '能源'
  if (cat === 'cost') return '成本'
  if (cat === 'comprehensive') return '综合'
  if (cat === 'investment') return '投资'
  if (cat === 'jianjian') return '维简'
  if (cat === 'huanbao') return '环保'
  if (cat === 'anquan') return '安全'
  if (cat === 'zhejiu') return '折旧'
  if (cat === 'daxiu') return '大修'
  return ''
}

function categoryClass(cat) {
  const map = {
    production: 'agg-category-tag--jianjian',
    finance: 'agg-category-tag--huanbao',
    safety: 'agg-category-tag--anquan',
    energy: 'agg-category-tag--zhejiu',
    cost: 'agg-category-tag--daxiu',
    jianjian: 'agg-category-tag--jianjian',
    huanbao: 'agg-category-tag--huanbao',
    anquan: 'agg-category-tag--anquan',
    zhejiu: 'agg-category-tag--zhejiu',
    daxiu: 'agg-category-tag--daxiu'
  }
  return map[cat] || ''
}

// 筛选
const filteredRows = computed(() => {
  let rows = tableRows.value
  if (filterPeriod.value) {
    rows = rows.filter(r => r.period === filterPeriod.value)
  }
  if (filterCategory.value) {
    rows = rows.filter(r => r.category === filterCategory.value)
  }
  if (filterStatus.value) {
    rows = rows.filter(r => r.status === filterStatus.value)
  }
  if (filterSearch.value.trim()) {
    const kw = filterSearch.value.trim().toLowerCase()
    rows = rows.filter(r => r.templateName.toLowerCase().includes(kw))
  }
  return rows
})

// 分页
const totalPages = computed(() => Math.ceil(filteredRows.value.length / pageSize.value) || 1)
const pageRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})
const pageNumbers = computed(() => {
  const total = totalPages.value
  const pages = []
  for (let i = 1; i <= total; i++) pages.push(i)
  return pages
})

// 统计
const totalCount = computed(() => tableRows.value.length)
const okCount = computed(() => tableRows.value.filter(r => r.status === 'ok').length)
const processingCount = computed(() => tableRows.value.filter(r => r.status === 'processing').length)
const pendingCount = computed(() => tableRows.value.filter(r => r.status === 'pending').length)
const allPeriods = computed(() => {
  const set = new Set()
  tableRows.value.forEach(r => { if (r.period) set.add(r.period) })
  return Array.from(set).sort().reverse()
})

function applyFilter() {
  currentPage.value = 1
  loadSummary()
}
function resetFilter() {
  filterPeriod.value = ''
  filterCategory.value = ''
  filterStatus.value = ''
  filterSearch.value = ''
  currentPage.value = 1
}

// 选择
function toggleSelectAll(e) {
  if (e.target.checked) {
    selectedRows.value = pageRows.value.map(r => r.key)
  } else {
    selectedRows.value = []
  }
}
function toggleSelect(key) {
  const idx = selectedRows.value.indexOf(key)
  if (idx > -1) {
    selectedRows.value.splice(idx, 1)
  } else {
    selectedRows.value.push(key)
  }
}

// ===== 打开详情 =====
async function openDetail(row) {
  detailMode.value = true
  selectedTemplateId.value = row.templateId
  period.value = row.period || ''
  try {
    const res = await getAvailablePeriods(row.templateId)
    periodList.value = Array.isArray(res) ? res : (res?.data || [])
  } catch (e) {
    periodList.value = []
  }
  await loadReport()
}

function closeDetail() {
  detailMode.value = false
  selectedTemplateId.value = null
  reportData.value = null
}

async function loadReport() {
  if (!selectedTemplateId.value) return
  reportLoading.value = true
  try {
    const res = await getAggregationReport({
      templateId: selectedTemplateId.value,
      period: period.value || undefined
    })
    reportData.value = res
  } catch (e) {
    reportData.value = null
  } finally {
    reportLoading.value = false
  }
}

// 操作
async function refreshReport(row) {
  ElMessage.info(`正在刷新：${row.templateName}`)
  await loadSummary()
  ElMessage.success('已刷新')
}

function printReport(row) {
  // 打开新窗口打印当前详情（如果有）或当前列表
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    ElMessage.error('请允许弹窗以进行打印')
    return
  }
  const templateName = row.templateName || '汇总报表'
  const period = row.period || '全部期间'
  const html = `
    <!DOCTYPE html><html><head><title>${templateName} - 打印</title>
    <style>
      body { font-family: 'Microsoft YaHei', sans-serif; padding: 20px; }
      h1 { text-align: center; font-size: 18px; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th, td { border: 1px solid #333; padding: 8px; font-size: 12px; }
      th { background: #f0f0f0; }
    </style>
    </head><body>
    <h1>${templateName}</h1>
    <p>期间：${period} &nbsp;&nbsp; 打印时间：${new Date().toLocaleString('zh-CN')}</p>
    <p>汇总状态：${row.statusText || '-'} &nbsp;&nbsp; 参与单位：${row.orgCount || 0}</p>
    <p style="color:#666;margin-top:20px;">（详细数据请在系统中查看完整报表）</p>
    </body></html>
  `
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => { printWindow.print() }, 300)
}

function downloadReport(row) {
  const url = exportAggregationUrl(row.templateId, row.period)
  // 使用隐藏的 a 标签触发下载（带token）
  const token = localStorage.getItem('token') || sessionStorage.getItem('token') || ''
  const fullUrl = `/api${url}` // 假定 api 代理前缀
  ElMessage.info(`正在下载：${row.templateName}`)
  // 直接打开 URL 让浏览器处理下载（受 sa-token 保护时需要带 token）
  const a = document.createElement('a')
  a.href = fullUrl + (url.includes('?') ? '&' : '?') + `_t=${encodeURIComponent(token)}`
  // 实际我们用 fetch 方式下载，避开 token 拼 URL
  fetch(fullUrl, { headers: { 'Authorization': token } })
    .then(r => r.blob())
    .then(blob => {
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `${row.templateName}_${row.period || '全部'}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
      ElMessage.success('下载完成')
    })
    .catch(e => ElMessage.error('下载失败：' + e.message))
}

function generateReport(row) {
  generateTarget.value = row
  generateForm.value = {
    period: row.period || new Date().getFullYear().toString(),
    batch: '1',
    category: row.category || ''
  }
  generateVisible.value = true
}

// ===== 生成汇总弹窗 =====
const generateVisible = ref(false)
const generateTarget = ref(null)
const generateForm = ref({ period: '', batch: '1', category: '' })
const generateSubmitting = ref(false)

async function confirmGenerate() {
  if (!generateTarget.value) return
  generateSubmitting.value = true
  try {
    if (isPlanMode.value) {
      // 计划汇总使用专用API
      await generatePlanSummary({
        templateId: generateTarget.value.templateId,
        year: generateForm.value.period,
        batch: generateForm.value.batch,
        type: pageType.value === 'annualPlan' ? 'annual' : 'batch'
      })
    } else {
      // 统计汇总使用 /aggregation/generate
      await generateAggregation({
        templateId: generateTarget.value.templateId,
        period: generateForm.value.period
      })
    }
    ElMessage.success(`汇总生成成功：${generateTarget.value.templateName}`)
    generateVisible.value = false
    await loadSummary()
  } catch (e) {
    ElMessage.error('生成失败：' + (e.message || '未知错误'))
  } finally {
    generateSubmitting.value = false
  }
}

// ===== 批量操作 =====
function batchDownload() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要下载的汇总表')
    return
  }
  ElMessage.success(`正在批量下载 ${selectedRows.value.length} 项汇总表`)
}
function batchPrint() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要打印的汇总表')
    return
  }
  ElMessage.info(`正在准备批量打印 ${selectedRows.value.length} 项汇总表`)
  window.print()
}

// ===== 列头 =====
function flattenColTree(tree, depth = 0) {
  const result = []
  if (!tree || !Array.isArray(tree)) return result
  for (const node of tree) {
    if (node.children && node.children.length > 0) {
      const children = flattenColTree(node.children, depth + 1)
      result.push({ ...node, depth, isGroup: true, children, colspan: leafCount(node) })
    } else {
      result.push({ ...node, depth, isGroup: false, isLeaf: true })
    }
  }
  return result
}
function leafCount(node) {
  if (!node.children || node.children.length === 0) return 1
  return node.children.reduce((sum, child) => sum + leafCount(child), 0)
}
const leafColumns = computed(() => {
  if (!reportData.value?.columnTree) return []
  return flattenColTree(reportData.value.columnTree).filter(c => c.isLeaf)
})
const maxDepth = computed(() => {
  if (!reportData.value?.columnTree) return 1
  return getMaxDepth(reportData.value.columnTree, 1)
})
function getMaxDepth(tree, depth) {
  let max = depth
  for (const node of tree) {
    if (node.children && node.children.length > 0) max = Math.max(max, getMaxDepth(node.children, depth + 1))
  }
  return max
}
const headerRows = computed(() => {
  if (!reportData.value?.columnTree) return []
  const rows = []
  for (let i = 0; i < maxDepth.value; i++) rows.push([])
  buildHeaderRows(reportData.value.columnTree, rows, 0)
  return rows
})
function buildHeaderRows(nodes, rows, depth) {
  for (const node of nodes) {
    const rowspan = node.children && node.children.length > 0 ? 1 : maxDepth.value - depth
    const colspan = node.children && node.children.length > 0 ? leafCount(node) : 1
    rows[depth].push({ id: node.id, name: node.name, rowspan, colspan, isGroup: !!(node.children && node.children.length > 0) })
    if (node.children && node.children.length > 0) buildHeaderRows(node.children, rows, depth + 1)
  }
}

// ===== 行 =====
function flattenRowTree(tree, depth = 0) {
  const result = []
  if (!tree || !Array.isArray(tree)) return result
  for (const node of tree) {
    result.push({ id: node.id, name: node.name, level: depth, isSummary: node.isSummary || false })
    if (node.children && node.children.length > 0) result.push(...flattenRowTree(node.children, depth + 1))
  }
  return result
}
const flatRows = computed(() => {
  if (!reportData.value?.rowTree) return []
  return flattenRowTree(reportData.value.rowTree)
})

// ===== 单元格 =====
function getCellKey(rowId, colId) { return `${rowId}:${colId}` }
function hasCellData(rowId, colId) {
  return reportData.value?.cellData && reportData.value.cellData[getCellKey(rowId, colId)] != null
}
function getCellValue(rowId, colId) {
  const cell = reportData.value?.cellData?.[getCellKey(rowId, colId)]
  return cell ? cell.value : ''
}

// ===== 明细弹窗 =====
async function openCellDetail(row, col) {
  if (!hasCellData(row.id, col.id)) return
  cellDetailVisible.value = true
  cellDetailLoading.value = true
  cellDetail.value = { contributors: [], rowCode: row.id, rowName: row.name, columnCode: col.id, columnName: col.name, aggregatedValue: '' }
  try {
    const res = await getCellDetail({
      templateId: selectedTemplateId.value,
      period: period.value || undefined,
      rowCode: row.id,
      columnCode: col.id
    })
    cellDetail.value = res || { contributors: [] }
  } catch (e) {
    console.error(e)
  } finally {
    cellDetailLoading.value = false
  }
}
function statusClass(status) {
  if (status === 4) return 'agg-status-tag--ok'
  if (status === 5) return 'agg-status-tag--reported'
  return ''
}
</script>

<style scoped>
.agg-page { padding: 16px; max-width: 1440px; margin: 0 auto; }

/* 面包屑 */
.agg-breadcrumb {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; color: #94A3B8; margin-bottom: 16px;
}
.agg-breadcrumb-arrow { color: #CBD5E1; }
.agg-breadcrumb-current { color: #1E293B; font-weight: 600; }

/* 分类标签页 */
.agg-category-tabs {
  display: flex; gap: 8px; margin-bottom: 16px;
  padding: 6px; background: #F8FAFC; border-radius: 10px;
}
.agg-category-tab {
  padding: 8px 20px; background: transparent; border: none;
  border-radius: 8px; font-size: 14px; font-weight: 500;
  color: #64748B; cursor: pointer; transition: all 0.2s;
  &:hover { color: #2563EB; }
  &.active {
    background: #fff; color: #2563EB;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }
}

/* 提示条 */
.agg-notice {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; margin-bottom: 16px;
  background: #EFF6FF; border: 1px solid #BFDBFE;
  border-radius: 8px; font-size: 13px; color: #3B82F6;
}
.agg-notice-icon { font-size: 16px; font-weight: 700; }

/* 统计卡片 */
.agg-stats {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 16px; margin-bottom: 20px;
}
.agg-stat-card {
  display: flex; align-items: center; gap: 14px;
  padding: 20px; background: #fff;
  border: 1px solid #E2E8F0; border-radius: 12px;
  transition: all 0.2s;
  &:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
}
.agg-stat-icon {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; flex-shrink: 0;
}
.agg-stat-icon--total { background: rgba(37,99,235,0.1); color: #2563EB; }
.agg-stat-icon--ok { background: rgba(20,184,166,0.1); color: #14B8A6; }
.agg-stat-icon--processing { background: rgba(245,158,11,0.1); color: #F59E0B; }
.agg-stat-icon--pending { background: rgba(148,163,184,0.1); color: #64748B; }
.agg-stat-info { flex: 1; }
.agg-stat-label { font-size: 13px; color: #64748B; margin-bottom: 2px; }
.agg-stat-value {
  font-size: 26px; font-weight: 700; color: #1E293B; line-height: 1;
}
.agg-stat-value--ok { color: #14B8A6; }
.agg-stat-value--processing { color: #F59E0B; }
.agg-stat-value--pending { color: #64748B; }

/* 筛选栏 */
.agg-filter-bar {
  display: flex; align-items: flex-end; flex-wrap: wrap; gap: 12px;
  padding: 16px 20px; margin-bottom: 20px;
  background: #fff; border: 1px solid #E2E8F0; border-radius: 12px;
}
.agg-filter-group { display: flex; flex-direction: column; gap: 4px; }
.agg-filter-label { font-size: 12px; color: #94A3B8; font-weight: 500; }
.agg-filter-select {
  height: 36px; padding: 0 12px; min-width: 140px;
  border: 1px solid #E2E8F0; border-radius: 6px;
  font-size: 13px; color: #334155; background: #fff;
  outline: none; cursor: pointer;
  &:focus { border-color: #2563EB; }
}
.agg-filter-input {
  height: 36px; padding: 0 12px; min-width: 200px;
  border: 1px solid #E2E8F0; border-radius: 6px;
  font-size: 13px; color: #334155; outline: none;
  &:focus { border-color: #2563EB; }
}

/* 按钮 */
.agg-btn {
  display: inline-flex; align-items: center; gap: 4px;
  height: 36px; padding: 0 16px; border: 1px solid #E2E8F0;
  border-radius: 6px; background: #fff; font-size: 13px;
  font-weight: 500; color: #475569; cursor: pointer;
  transition: all 0.2s;
  &:hover { background: #F8FAFC; border-color: #CBD5E1; }
}
.agg-btn-primary {
  background: #2563EB; color: #fff; border-color: #2563EB;
  &:hover { background: #1D4ED8; }
}
.agg-btn-icon { font-size: 14px; }
.agg-btn-back {
  background: #F1F5F9; border-color: #E2E8F0; color: #475569;
  &:hover { background: #E2E8F0; }
}

/* 表格区域 */
.agg-table-section {
  background: #fff; border: 1px solid #E2E8F0;
  border-radius: 12px; overflow: hidden;
}
.agg-table-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; border-bottom: 1px solid #E2E8F0;
}
.agg-table-title { font-size: 15px; font-weight: 600; color: #1E293B; }
.agg-table-actions { display: flex; gap: 8px; }
.agg-table-action-btn {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 6px 14px; background: #F1F5F9; border: 1px solid #E2E8F0;
  border-radius: 6px; font-size: 13px; color: #475569; cursor: pointer;
  transition: all 0.2s;
  &:hover { background: #E2E8F0; }
}

/* 加载 & 空状态 */
.agg-loading {
  display: flex; align-items: center; justify-content: center;
  padding: 60px; color: #94A3B8;
}
.agg-loading-spinner {
  width: 32px; height: 32px; border: 3px solid #E2E8F0;
  border-top-color: #2563EB; border-radius: 50%;
  animation: agg-spin 0.8s linear infinite;
}
@keyframes agg-spin { to { transform: rotate(360deg); } }
.agg-empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 60px 20px; color: #94A3B8;
  font-size: 14px; gap: 8px;
}

/* 表格 */
.agg-table {
  width: 100%; border-collapse: collapse;
  th, td {
    padding: 12px 16px; text-align: left;
    border-bottom: 1px solid #F1F5F9; font-size: 13px;
  }
  th {
    background: #F8FAFC; font-weight: 600; color: #64748B;
    white-space: nowrap;
  }
  tbody tr:hover { background: #F8FAFC; }
}
.agg-check-all { width: 16px; height: 16px; cursor: pointer; }
.agg-cell-name { font-weight: 500; color: #1E293B; }
.agg-category-tag {
  display: inline-block; padding: 2px 8px; border-radius: 4px;
  font-size: 11px; font-weight: 500;
  background: #F1F5F9; color: #64748B;
}
.agg-category-tag--jianjian { background: rgba(37,99,235,0.08); color: #2563EB; }
.agg-category-tag--huanbao { background: rgba(20,184,166,0.08); color: #14B8A6; }
.agg-category-tag--anquan { background: rgba(239,68,68,0.08); color: #EF4444; }
.agg-category-tag--zhejiu { background: rgba(245,158,11,0.08); color: #F59E0B; }
.agg-category-tag--daxiu { background: rgba(139,92,246,0.08); color: #8B5CF6; }

/* 状态标签 */
.agg-status-tag {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 3px 10px; border-radius: 4px; font-size: 12px; font-weight: 500;
}
.agg-status-tag--ok { background: rgba(20,184,166,0.08); color: #14B8A6; }
.agg-status-tag--processing { background: rgba(245,158,11,0.08); color: #F59E0B; }
.agg-status-tag--pending { background: rgba(148,163,184,0.08); color: #64748B; }
.agg-status-tag--reported { background: rgba(37,99,235,0.08); color: #2563EB; }
.agg-status-dot {
  width: 6px; height: 6px; border-radius: 50%;
}
.agg-status-dot--ok { background: #14B8A6; }
.agg-status-dot--processing { background: #F59E0B; animation: agg-pulse 1.5s infinite; }
.agg-status-dot--pending { background: #94A3B8; }
@keyframes agg-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

/* 链接 */
.agg-link {
  color: #2563EB; cursor: pointer; font-size: 12px; margin-right: 10px;
  text-decoration: none;
  &:hover { text-decoration: underline; }
}
.agg-link--primary { font-weight: 600; }

/* 分页 */
.agg-pagination {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 20px; border-top: 1px solid #E2E8F0;
}
.agg-page-info { font-size: 13px; color: #64748B; }
.agg-page-btns { display: flex; gap: 4px; }
.agg-page-btn {
  width: 32px; height: 32px; display: flex; align-items: center;
  justify-content: center; border: 1px solid #E2E8F0;
  border-radius: 6px; background: #fff; font-size: 13px;
  color: #475569; cursor: pointer; transition: all 0.2s;
  &:hover:not(:disabled) { background: #F8FAFC; border-color: #CBD5E1; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
  &.active { background: #2563EB; color: #fff; border-color: #2563EB; }
}

/* 详情工具栏 */
.agg-detail-toolbar {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 0; margin-bottom: 16px;
}
.agg-detail-title { font-size: 16px; font-weight: 600; color: #1E293B; flex: 1; }
.agg-detail-right { display: flex; align-items: center; gap: 8px; }

/* 数据来源单元格 */
.agg-source-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  line-height: 1.4;
}

.agg-source-empty {
  padding: 4px 0;
}

/* 明细表格 */
.agg-table-wrapper {
  background: #fff; border: 1px solid #E2E8F0;
  border-radius: 12px; overflow: hidden;
}
.agg-table-scroll { overflow-x: auto; }
.agg-th {
  background: #F8FAFC; font-weight: 600; color: #64748B;
  white-space: nowrap; padding: 10px 14px; font-size: 12px;
  border: 1px solid #E2E8F0; text-align: center;
}
.agg-th-row-header { min-width: 50px; }
.agg-td {
  padding: 8px 14px; font-size: 13px; border: 1px solid #F1F5F9;
}
.agg-td-row-header { font-weight: 500; color: #1E293B; white-space: nowrap; }
.agg-td-summary { background: #F8FAFC; font-weight: 600; }
.agg-td-cell { text-align: right; }
.agg-cell-value { color: #1E293B; }
.agg-cell-empty { color: #CBD5E1; }

/* 弹窗 */
.agg-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
  animation: agg-fadeIn 0.2s;
}
@keyframes agg-fadeIn { from { opacity: 0; } to { opacity: 1; } }
.agg-detail-modal {
  position: fixed; inset: 0; background: #fff;
  display: flex; flex-direction: column;
  animation: agg-slideIn 0.25s;
}
@keyframes agg-slideIn { from { transform: translateY(20px); opacity: 0; } }
.agg-detail-modal .agg-detail-toolbar {
  padding: 12px 20px; margin-bottom: 0;
  background: #fff; border-bottom: 1px solid #E2E8F0;
  flex-shrink: 0;
}
.agg-detail-modal .agg-table-wrapper {
  flex: 1; border-radius: 0; border: none;
  overflow: auto;
}
.agg-detail-modal .agg-table-scroll {
  height: 100%; overflow: auto;
}
.agg-detail-modal .agg-loading {
  flex: 1;
}
.agg-dialog {
  background: #fff; border-radius: 12px; width: 700px; max-height: 80vh;
  display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  animation: agg-slideUp 0.2s;
}
@keyframes agg-slideUp { from { transform: translateY(20px); opacity: 0; } }
.agg-dialog-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; border-bottom: 1px solid #E2E8F0;
  font-size: 16px; font-weight: 600; color: #1E293B;
}
.agg-dialog-close {
  width: 28px; height: 28px; display: flex; align-items: center;
  justify-content: center; border: none; background: none;
  font-size: 20px; color: #94A3B8; cursor: pointer; border-radius: 6px;
  &:hover { background: #F1F5F9; color: #475569; }
}
.agg-dialog-body {
  padding: 20px; overflow-y: auto; flex: 1;
  font-size: 13px; color: #475569;
}
.agg-dinfo {
  display: flex; flex-direction: column; gap: 8px;
  padding: 12px; background: #F8FAFC; border-radius: 8px;
  margin-bottom: 16px;
}
.agg-dinfo-total { font-size: 14px; color: #1E293B; }

/* 生成弹窗 */
.agg-dialog-footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 16px 20px; border-top: 1px solid #E2E8F0;
}
.agg-form-group { margin-bottom: 16px; }
.agg-form-label { display: block; font-size: 13px; color: #64748B; margin-bottom: 6px; font-weight: 500; }
.agg-form-value { font-size: 14px; color: #1E293B; font-weight: 500; padding: 8px 0; }
.agg-generate-notice {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 12px; background: #EFF6FF; border: 1px solid #BFDBFE;
  border-radius: 8px; font-size: 13px; color: #3B82F6; line-height: 1.5;
}
.agg-dtable {
  width: 100%; border-collapse: collapse;
  th, td { padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #F1F5F9; }
  th { background: #F8FAFC; font-weight: 600; color: #64748B; text-align: left; }
  td { color: #475569; }
}
.agg-dvalue { font-weight: 600; color: #1E293B; text-align: right; }

/* 响应式 */
@media (max-width: 1024px) {
  .agg-stats { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .agg-stats { grid-template-columns: 1fr; }
  .agg-filter-bar { flex-direction: column; }
  .agg-filter-input { min-width: 100%; }
  .agg-dialog { width: 95%; }
}
</style>