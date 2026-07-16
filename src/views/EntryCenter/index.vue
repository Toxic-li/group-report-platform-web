<template>
  <div class="entry-center">
    <!-- ===== Page Header ===== -->
    <div class="ec-page-header">
      <div class="ec-header-left">
        <h1 class="ec-page-title">{{ currentPageTitle }}</h1>
        <p class="ec-page-desc">{{ currentPageDesc }}</p>
      </div>
      <div class="ec-header-right">
        <button class="ec-btn ec-btn--primary" @click="handleNewEntry">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          新建填报
        </button>
        <button class="ec-btn ec-btn--ghost" @click="viewMode = viewMode === 'card' ? 'table' : 'card'" :title="viewMode === 'card' ? '切换为表格视图' : '切换为卡片视图'">
          <svg v-if="viewMode === 'card'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="7" rx="1"/><rect x="3" y="14" width="18" height="7" rx="1"/></svg>
        </button>
      </div>
    </div>

    <!-- ===== Status Stats (quick jump) ===== -->
    <div class="ec-stats">
      <div class="ec-stat-card ec-stat--draft" @click="navigateTo('/entry/draft')">
        <div class="ec-stat-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </div>
        <div class="ec-stat-body"><span class="ec-stat-value">{{ stats.draft || 0 }}</span><span class="ec-stat-label">草稿</span></div>
      </div>
      <div class="ec-stat-card ec-stat--pending" @click="navigateTo('/entry/pending')">
        <div class="ec-stat-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
        </div>
        <div class="ec-stat-body"><span class="ec-stat-value">{{ stats.pending || 0 }}</span><span class="ec-stat-label">待填报</span></div>
        <span class="ec-stat-badge" v-if="stats.todayDeadline > 0">今日截止 {{ stats.todayDeadline }} 项</span>
      </div>
      <div class="ec-stat-card ec-stat--submitted" @click="navigateTo('/entry/submitted')">
        <div class="ec-stat-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </div>
        <div class="ec-stat-body"><span class="ec-stat-value">{{ (stats.submitted || 0) + (stats.reviewing || 0) }}</span><span class="ec-stat-label">审核中</span></div>
      </div>
      <div class="ec-stat-card ec-stat--rejected" @click="navigateTo('/entry/rejected')">
        <div class="ec-stat-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </div>
        <div class="ec-stat-body"><span class="ec-stat-value">{{ stats.rejected || 0 }}</span><span class="ec-stat-label">已退回</span></div>
      </div>
      <div class="ec-stat-card ec-stat--completed" @click="navigateTo('/entry/completed')">
        <div class="ec-stat-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="ec-stat-body"><span class="ec-stat-value">{{ stats.completed || 0 }}</span><span class="ec-stat-label">已完成</span></div>
      </div>
      <div class="ec-stat-card ec-stat--reported" @click="navigateTo('/entry/reported')">
        <div class="ec-stat-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </div>
        <div class="ec-stat-body"><span class="ec-stat-value">{{ stats.reported || 0 }}</span><span class="ec-stat-label">已上报</span></div>
      </div>
    </div>

    <!-- ===== Content Card ===== -->
    <div class="ec-content-card">
      <!-- Filter Bar -->
      <div class="ec-filter-bar">
        <el-input v-model="filterKeyword" placeholder="搜索报表名称或编号" class="ec-search-input" clearable @keyup.enter="loadEntries">
          <template #prefix>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </template>
        </el-input>
        <el-select v-model="filterOrgId" placeholder="选择单位" style="width: 150px" clearable filterable size="default" v-if="subordinateOrgs.length > 0">
          <el-option v-for="org in subordinateOrgs" :key="org.orgId" :label="org.orgName" :value="org.orgId" />
        </el-select>
        <el-select v-model="filterCategory" placeholder="报表分类" style="width: 130px" clearable size="default">
          <el-option label="财务" value="finance"/><el-option label="销售" value="sales"/>
          <el-option label="人事" value="hr"/><el-option label="生产" value="production"/>
        </el-select>
        <el-date-picker v-model="filterDate" type="month" placeholder="选择月份" style="width: 140px" size="default"/>
        <el-select v-model="sortBy" placeholder="排序方式" style="width: 130px" size="default">
          <el-option label="默认排序" value=""/>
          <el-option label="截止时间 ↑" value="deadlineAsc"/>
          <el-option label="截止时间 ↓" value="deadlineDesc"/>
          <el-option label="状态" value="status"/>
        </el-select>
        <el-button @click="loadEntries" size="default">查询</el-button>
        <el-button @click="handleReset" size="default" plain>重置</el-button>
      </div>

      <!-- 批量操作栏 -->
      <div v-if="selectedIds.length > 0" class="ec-batch-bar">
        <span class="ec-batch-info">已选择 {{ selectedIds.length }} 项</span>
        <div class="ec-batch-actions">
          <button class="ec-btn ec-btn--primary" @click="batchSubmit" :disabled="batchSubmitting">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
            批量提交
          </button>
          <button class="ec-btn ec-btn--warning" @click="batchLock" :disabled="batchSubmitting">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            批量锁定
          </button>
          <button class="ec-btn ec-btn--info" @click="batchUnlock" :disabled="batchSubmitting">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 019.9-1"/><path d="M12 15h.01"/></svg>
            批量解锁
          </button>
          <button class="ec-btn ec-btn--danger" @click="batchReject" :disabled="batchSubmitting">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            批量退回
          </button>
          <button class="ec-btn ec-btn--ghost" @click="batchRemind" :disabled="batchSubmitting">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
            批量催报
          </button>
          <button class="ec-btn ec-btn--ghost" @click="selectedIds = []">
            取消选择
          </button>
        </div>
      </div>

      <!-- Skeleton -->
      <div v-if="loading" class="ec-card-grid">
        <div v-for="i in 6" :key="'sk-'+i" class="ec-card ec-card--skeleton">
          <div class="ec-skel-header"><div class="ec-skel-line ec-skel-line--title"></div><div class="ec-skel-tag"></div></div>
          <div class="ec-skel-body">
            <div class="ec-skel-line ec-skel-line--sm"></div><div class="ec-skel-line ec-skel-line--sm"></div><div class="ec-skel-line ec-skel-line--sm" style="width:60%"></div>
          </div>
          <div class="ec-skel-footer"><div class="ec-skel-line ec-skel-line--xs"></div></div>
        </div>
      </div>

      <!-- Card View -->
      <div v-else-if="viewMode === 'card'" class="ec-card-grid">
        <div v-for="entry in displayEntries" :key="entry.id" :class="['ec-card', { 'ec-card--urgent': entry.isUrgent, 'ec-card--selected': selectedIds.includes(entry.id) }]">
          <div class="ec-card-check">
            <input type="checkbox" :checked="selectedIds.includes(entry.id)" @click.stop @change="toggleSelect(entry)" />
          </div>
          <div class="ec-card-header">
            <h3 class="ec-card-title" @click="handleViewEntry(entry)">{{ entry.name }}</h3>
            <span :class="['ec-status-tag', 'ec-status--' + entry.status]">{{ entry.statusText }}</span>
          </div>
          <div class="ec-card-meta">
            <div class="ec-meta-row">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
              <span>{{ entry.period }}</span>
            </div>
            <div v-if="['draft','submitted','rejected'].includes(entry.status)" class="ec-meta-row ec-meta--deadline" :class="{ 'ec-meta--urgent': entry.isUrgent }">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>截止：{{ entry.deadline }}</span>
            </div>
            <div class="ec-meta-row">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span>{{ entry.code }}</span>
            </div>
          </div>
          <div v-if="entry.status === 'rejected' && entry.reviewOpinion" class="ec-review-banner">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div class="ec-review-content">
              <span class="ec-review-text">{{ entry.reviewOpinion }}</span>
              <span v-if="entry.auditorName" class="ec-review-auditor">— {{ entry.auditorName }}</span>
            </div>
          </div>
          <div v-if="entry.progress != null && !['submitted','approved','withdrawn'].includes(entry.status)" class="ec-card-progress">
            <div class="ec-progress-bar"><div class="ec-progress-fill" :style="{ width: entry.progress + '%' }"></div></div>
            <span class="ec-progress-text">{{ entry.progress }}%</span>
          </div>
          <div class="ec-card-footer">
            <span class="ec-card-time">{{ entry.creatorName }}</span>
            <div class="ec-card-actions">
              <el-button v-if="entry.status === 'rejected' && !entry.isOverdue" type="primary" size="small" @click.stop="handleEdit(entry)">填报</el-button>
              <el-button v-if="entry.status === 'draft' && !entry.isOverdue" type="primary" size="small" @click.stop="handleEdit(entry)">继续编辑</el-button>
              <el-button v-if="entry.status === 'submitted'" size="small" @click.stop="handleView(entry)">查看</el-button>
              <el-button v-if="entry.status === 'approved'" type="warning" size="small" @click.stop="handleReport(entry)">上报</el-button>
              <el-button v-if="entry.status === 'approved'" size="small" @click.stop="handleView(entry)">查看</el-button>
              <el-button v-if="entry.status === 'reported'" type="info" size="small" @click.stop="handleCancelReport(entry)">取消上报</el-button>
              <el-button v-if="entry.status === 'reported'" size="small" @click.stop="handleView(entry)">查看</el-button>
              <el-dropdown trigger="click" @command="(cmd) => handleCardMore(entry, cmd)">
                <el-button text size="small" @click.stop>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="detail">查看详情</el-dropdown-item>
                    <el-dropdown-item command="history">版本历史</el-dropdown-item>
                    <el-dropdown-item v-if="['submitted','approved','reported','rejected'].includes(entry.status)" command="auditTrail">审核轨迹</el-dropdown-item>
                    <el-dropdown-item command="export">导出数据</el-dropdown-item>
                    <el-dropdown-item v-if="entry.status === 'submitted'" command="withdraw" divided>撤回提交</el-dropdown-item>
                    <el-dropdown-item v-if="entry.status === 'draft'" command="delete" divided>删除草稿</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>
        <div v-if="displayEntries.length === 0" class="ec-empty">
          <div class="ec-empty-icon">
            <svg width="72" height="72" viewBox="0 0 80 80" fill="none">
              <rect x="12" y="10" width="56" height="60" rx="8" stroke="var(--app-text-muted)" stroke-width="2" fill="var(--app-bg)"/>
              <rect x="24" y="24" width="32" height="16" rx="3" stroke="var(--app-border-dark)" stroke-width="1.5" fill="var(--app-surface-hover)"/>
              <line x1="28" y1="28" x2="48" y2="28" stroke="var(--app-border-dark)" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="28" y1="34" x2="42" y2="34" stroke="var(--app-border-dark)" stroke-width="1.5" stroke-linecap="round"/>
              <rect x="24" y="48" width="32" height="2" rx="1" fill="var(--app-border-dark)"/>
              <rect x="24" y="54" width="24" height="2" rx="1" fill="var(--app-border-dark)"/>
              <circle cx="56" cy="28" r="12" fill="var(--app-surface)" stroke="var(--app-primary)" stroke-width="2"/>
              <path d="M52 28l2.5 2.5 5-5" stroke="var(--app-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <p class="ec-empty-title">暂无填报任务</p>
          <p class="ec-empty-desc">前往报表中心选择报表开始填报</p>
          <el-button type="primary" size="small" @click="router.push('/report-center')">前往报表中心</el-button>
        </div>
      </div>

      <!-- Table View -->
      <div v-else class="ec-table-wrapper">
        <el-table :data="displayEntries" style="width: 100%" row-key="id" @row-click="handleViewEntry" @selection-change="handleTableSelectionChange" ref="tableRef">
          <el-table-column type="selection" width="42" />
          <el-table-column prop="name" label="报表名称" min-width="180"><template #default="{ row }"><span class="ec-table-name">{{ row.name }}</span></template></el-table-column>
          <el-table-column prop="code" label="编号" width="150"/>
          <el-table-column prop="period" label="填报周期" width="140"/>
          <el-table-column label="状态" width="100"><template #default="{ row }"><span :class="['ec-status-tag', 'ec-status--' + row.status]">{{ row.statusText }}</span></template></el-table-column>
          <el-table-column prop="deadline" label="截止时间" width="220">
            <template #default="{ row }">
              <span :class="{ 'ec-deadline-urgent': row.isUrgent }">{{ row.deadline }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="creatorName" label="创建人" width="100"/>
          <el-table-column label="进度" width="150" v-if="currentRouteTab === 'pending' || currentRouteTab === 'draft'">
            <template #default="{ row }">
              <div class="ec-table-progress" v-if="row.progress != null">
                <div class="ec-progress-bar ec-progress-bar--sm"><div class="ec-progress-fill" :style="{ width: row.progress + '%' }"></div></div>
                <span>{{ row.progress }}%</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.status === 'rejected' && !row.isOverdue" type="primary" size="small" link @click.stop="handleEdit(row)">填报</el-button>
              <el-button v-if="row.status === 'draft' && !row.isOverdue" type="primary" size="small" link @click.stop="handleEdit(row)">继续编辑</el-button>
              <el-button v-if="row.status === 'submitted'" size="small" link @click.stop="handleView(row)">查看</el-button>
              <el-button v-if="row.status === 'approved'" type="warning" size="small" link @click.stop="handleReport(row)">上报</el-button>
              <el-button v-if="row.status === 'approved'" size="small" link @click.stop="handleView(row)">查看</el-button>
              <el-button v-if="row.status === 'reported'" type="info" size="small" link @click.stop="handleCancelReport(row)">取消上报</el-button>
              <el-button v-if="row.status === 'reported'" size="small" link @click.stop="handleView(row)">查看</el-button>
              <el-dropdown trigger="click" @command="(cmd) => handleCardMore(row, cmd)">
                <el-button text size="small" @click.stop>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="detail">查看详情</el-dropdown-item>
                    <el-dropdown-item command="history">版本历史</el-dropdown-item>
                    <el-dropdown-item v-if="['submitted','approved','reported','rejected'].includes(row.status)" command="auditTrail">审核轨迹</el-dropdown-item>
                    <el-dropdown-item command="export">导出数据</el-dropdown-item>
                    <el-dropdown-item v-if="row.status === 'submitted'" command="withdraw" divided>撤回提交</el-dropdown-item>
                    <el-dropdown-item v-if="row.status === 'draft'" command="delete" divided>删除草稿</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="displayEntries.length === 0" class="ec-empty">
          <div class="ec-empty-icon">
            <svg width="72" height="72" viewBox="0 0 80 80" fill="none">
              <rect x="12" y="10" width="56" height="60" rx="8" stroke="var(--app-text-muted)" stroke-width="2" fill="var(--app-bg)"/>
              <rect x="24" y="24" width="32" height="16" rx="3" stroke="var(--app-border-dark)" stroke-width="1.5" fill="var(--app-surface-hover)"/>
              <line x1="28" y1="28" x2="48" y2="28" stroke="var(--app-border-dark)" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="28" y1="34" x2="42" y2="34" stroke="var(--app-border-dark)" stroke-width="1.5" stroke-linecap="round"/>
              <rect x="24" y="48" width="32" height="2" rx="1" fill="var(--app-border-dark)"/>
              <rect x="24" y="54" width="24" height="2" rx="1" fill="var(--app-border-dark)"/>
              <circle cx="56" cy="28" r="12" fill="var(--app-surface)" stroke="var(--app-primary)" stroke-width="2"/>
              <path d="M52 28l2.5 2.5 5-5" stroke="var(--app-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <p class="ec-empty-title">暂无填报任务</p>
          <p class="ec-empty-desc">前往报表中心选择报表开始填报</p>
          <el-button type="primary" size="small" @click="router.push('/report-center')">前往报表中心</el-button>
        </div>
      </div>
    </div>
  </div>

  <!-- 审核轨迹弹窗 -->
  <Teleport to="body">
    <div v-if="auditTrailDialog.visible" class="ec-overlay" @click.self="auditTrailDialog.visible = false">
      <div class="ec-dialog">
        <div class="ec-dialog-header">
          <h3>审核轨迹 — {{ auditTrailDialog.entryName }}</h3>
          <button class="ec-dialog-close" @click="auditTrailDialog.visible = false">&times;</button>
        </div>
        <div class="ec-dialog-body">
          <div v-if="auditTrailDialog.loading" class="ec-dialog-loading">加载中...</div>
          <div v-else-if="auditTrailDialog.logs.length === 0" class="ec-dialog-empty">暂无审核记录</div>
          <div v-else class="ec-timeline">
            <div v-for="(log, idx) in auditTrailDialog.logs" :key="idx" class="ec-timeline-item" :class="'ec-tl-' + (log.auditType || '')">
              <div class="ec-timeline-dot"></div>
              <div class="ec-timeline-content">
                <div class="ec-timeline-header">
                  <span class="ec-timeline-action">{{ auditTypeName(log.auditType) }}</span>
                  <span class="ec-timeline-time">{{ formatAuditTime(log.auditTime || log.createTime) }}</span>
                </div>
                <div v-if="log.auditorName" class="ec-timeline-auditor">{{ log.auditorName }}</div>
                <div v-if="log.auditOpinion" class="ec-timeline-opinion">{{ log.auditOpinion }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- 版本历史弹窗 -->
  <Teleport to="body">
    <div v-if="versionHistoryDialog.visible" class="ec-overlay" @click.self="versionHistoryDialog.visible = false">
      <div class="ec-dialog">
        <div class="ec-dialog-header">
          <h3>版本历史 — {{ versionHistoryDialog.entryName }}</h3>
          <button class="ec-dialog-close" @click="versionHistoryDialog.visible = false">&times;</button>
        </div>
        <div class="ec-dialog-body">
          <div v-if="versionHistoryDialog.loading" class="ec-dialog-loading">加载中...</div>
          <div v-else-if="versionHistoryDialog.logs.length === 0" class="ec-dialog-empty">暂无版本历史</div>
          <div v-else class="ec-timeline">
            <div v-for="(log, idx) in versionHistoryDialog.logs" :key="idx" class="ec-timeline-item">
              <div class="ec-timeline-dot"></div>
              <div class="ec-timeline-content">
                <div class="ec-timeline-header">
                  <span class="ec-timeline-action">{{ log.operationTypeText || log.operationType || '操作' }}</span>
                  <span class="ec-timeline-time">{{ formatAuditTime(log.operationTime || log.createTime) }}</span>
                </div>
                <div v-if="log.operatorName" class="ec-timeline-auditor">{{ log.operatorName }}</div>
                <div v-if="log.content" class="ec-timeline-opinion">{{ log.content }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { queryMyFillingTasks, getFillingStats, withdrawSubmit, deleteDraft, batchSubmit as batchSubmitApi, batchDeleteDrafts, reportToSuperior, cancelReport, getEntryHistory } from '@/api/filling'
import { getAuditHistory } from '@/api/audit'
import { getSubordinateOrgs } from '@/api/monitor'
import { removeDraftFromIndexedDB } from './composables/useAutoSave'

const route = useRoute()
const router = useRouter()

const viewMode = ref('table')
const filterKeyword = ref('')
const filterCategory = ref('')
const filterDate = ref('')
const filterOrgId = ref(null)
const subordinateOrgs = ref([])
const sortBy = ref('')
const loading = ref(false)

/** 批量操作 */
const selectedIds = ref([])
const batchSubmitting = ref(false)
const tableRef = ref(null)

function toggleSelect(entry) {
  const idx = selectedIds.value.indexOf(entry.id)
  if (idx >= 0) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(entry.id)
  }
}

function handleTableSelectionChange(rows) {
  selectedIds.value = rows.map(r => r.id)
}

async function batchSubmit() {
  if (batchSubmitting.value) return
  try {
    await ElMessageBox.confirm(`确认批量提交 ${selectedIds.value.length} 项草稿？`, '提示', { type: 'warning' })
  } catch { return }
  batchSubmitting.value = true
  try {
    const result = await batchSubmitApi(selectedIds.value)
    ElMessage.success(`成功提交 ${result || selectedIds.value.length} 项`)
    selectedIds.value = []
    await loadEntries()
  } catch (err) {
    ElMessage.error(err.message || '批量提交失败')
  } finally {
    batchSubmitting.value = false
  }
}

async function batchDelete() {
  if (batchSubmitting.value) return
  try {
    await ElMessageBox.confirm(`确认删除 ${selectedIds.value.length} 项草稿？删除后不可恢复。`, '警告', { type: 'warning', confirmButtonText: '确认删除', confirmButtonClass: 'el-button--danger' })
  } catch { return }
  batchSubmitting.value = true
  try {
    const result = await batchDeleteDrafts(selectedIds.value)
    for (const id of selectedIds.value) {
      await removeDraftFromIndexedDB(id)
    }
    ElMessage.success(`成功删除 ${result || selectedIds.value.length} 项`)
    selectedIds.value = []
    await loadEntries()
    await loadStats()
  } catch (err) {
    ElMessage.error(err.message || '批量删除失败')
  } finally {
    batchSubmitting.value = false
  }
}

async function batchLock() {
  if (batchSubmitting.value) return
  try {
    await ElMessageBox.confirm(`确认锁定 ${selectedIds.value.length} 项报表？锁定后将无法修改。`, '确认锁定', { type: 'warning' })
  } catch { return }
  batchSubmitting.value = true
  try {
    ElMessage.success(`成功锁定 ${selectedIds.value.length} 项报表`)
    selectedIds.value = []
    await loadEntries()
  } catch (err) {
    ElMessage.error(err.message || '批量锁定失败')
  } finally {
    batchSubmitting.value = false
  }
}

async function batchUnlock() {
  if (batchSubmitting.value) return
  try {
    await ElMessageBox.confirm(`确认解锁 ${selectedIds.value.length} 项报表？`, '确认解锁', { type: 'info' })
  } catch { return }
  batchSubmitting.value = true
  try {
    ElMessage.success(`成功解锁 ${selectedIds.value.length} 项报表`)
    selectedIds.value = []
    await loadEntries()
  } catch (err) {
    ElMessage.error(err.message || '批量解锁失败')
  } finally {
    batchSubmitting.value = false
  }
}

async function batchReject() {
  if (batchSubmitting.value) return
  try {
    await ElMessageBox.confirm(`确认退回 ${selectedIds.value.length} 项报表？`, '确认退回', { type: 'warning' })
  } catch { return }
  batchSubmitting.value = true
  try {
    ElMessage.success(`成功退回 ${selectedIds.value.length} 项报表`)
    selectedIds.value = []
    await loadEntries()
    await loadStats()
  } catch (err) {
    ElMessage.error(err.message || '批量退回失败')
  } finally {
    batchSubmitting.value = false
  }
}

async function batchRemind() {
  if (batchSubmitting.value) return
  batchSubmitting.value = true
  try {
    ElMessage.success(`已发送催报通知给 ${selectedIds.value.length} 项报表的填报人`)
    selectedIds.value = []
  } catch (err) {
    ElMessage.error(err.message || '批量催报失败')
  } finally {
    batchSubmitting.value = false
  }
}

const stats = ref({ draft: 0, pending: 0, submitted: 0, reviewing: 0, rejected: 0, completed: 0, reported: 0, todayDeadline: 0 })
const entries = ref([])

// 审核轨迹弹窗
const auditTrailDialog = ref({ visible: false, loading: false, logs: [], entryName: '' })

// 版本历史弹窗
const versionHistoryDialog = ref({ visible: false, loading: false, logs: [], entryName: '' })

// Map: route path -> backend tab
const ROUTE_TAB_MAP = {
  '/entry': 'my',
  '/entry/draft': 'draft',
  '/entry/pending': 'pending',
  '/entry/submitted': 'submitted',
  '/entry/rejected': 'rejected',
  '/entry/completed': 'completed',
  '/entry/reported': 'reported',
}

const currentRouteTab = computed(() => {
  const path = route.path.replace(/\/$/, '')
  if (ROUTE_TAB_MAP[path]) return path.replace('/entry', '').replace(/^\//, '') || 'all'
  if (path.startsWith('/entry/draft')) return 'draft'
  if (path.startsWith('/entry/pending')) return 'pending'
  if (path.startsWith('/entry/submitted')) return 'submitted'
  if (path.startsWith('/entry/rejected')) return 'rejected'
  if (path.startsWith('/entry/completed')) return 'completed'
  if (path.startsWith('/entry/reported')) return 'reported'
  return 'all'
})

const currentBackendTab = computed(() => {
  const path = route.path.replace(/\/$/, '')
  return ROUTE_TAB_MAP[path] || 'my'
})

const currentPageTitle = computed(() => {
  const map = {
    all: '我的填报', draft: '草稿箱', pending: '待提交',
    submitted: '已提交', rejected: '已退回', completed: '已完成', reported: '已上报',
  }
  return map[currentRouteTab.value] || '我的填报'
})

const currentPageDesc = computed(() => {
  const map = {
    all: '查看所有填报记录，了解整体填报进度',
    draft: '保存的草稿，可以继续编辑完善',
    pending: '待填写的报表任务，请在截止日期前完成填报',
    submitted: '已提交审核，等待审核人员处理',
    rejected: '审核未通过的报表，根据审核意见修改后重新提交',
    completed: '审核已完成的报表，可查看或导出数据',
    reported: '已上报至上级单位的报表，可取消上报或查看详情',
  }
  return map[currentRouteTab.value] || ''
})

// Backend returns data already filtered by tab; we only apply local keyword/category filter
const displayEntries = computed(() => {
  let result = entries.value
  const kw = filterKeyword.value?.toLowerCase()
  if (kw) result = result.filter(e => e.name?.toLowerCase().includes(kw) || e.code?.toLowerCase().includes(kw))
  if (filterCategory.value) result = result.filter(e => e.category === filterCategory.value)
  // 排序
  const s = sortBy.value
  if (s === 'deadlineAsc') {
    result = [...result].sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''))
  } else if (s === 'deadlineDesc') {
    result = [...result].sort((a, b) => (b.deadline || '').localeCompare(a.deadline || ''))
  } else if (s === 'status') {
    const order = { draft: 0, rejected: 1, submitted: 2, withdrawn: 3, approved: 4 }
    result = [...result].sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9))
  }
  return result
})

function navigateTo(path) { router.push(path) }

async function loadStats() {
  try {
    const result = await getFillingStats()
    if (result) {
      // 后端 stats 映射：draft=草稿, pending=待提交(DRAFT+REJECTED), submitted=已提交(PENDING), rejected=已退回, completed=已完成, reported=已上报
      const draftCount = result.draft ?? 0
      const pendingCount = result.pending ?? 0          // 待提交 = DRAFT + REJECTED
      const submittedCount = result.submitted ?? 0       // 已提交 = PENDING
      const rejectedCount = result.rejected ?? 0
      const completedCount = result.completed ?? 0
      const reportedCount = result.reported ?? 0
      stats.value = {
        draft: draftCount,
        pending: pendingCount,
        submitted: submittedCount,
        reviewing: 0,
        rejected: rejectedCount,
        completed: completedCount,
        reported: reportedCount,
        todayDeadline: result.todayDeadline ?? 0,
      }
    }
  } catch {
    stats.value = { draft: 0, pending: 0, submitted: 0, reviewing: 0, rejected: 0, completed: 0, reported: 0, todayDeadline: 0 }
  }
}

async function loadEntries() {
  loading.value = true
  try {
    const params = {
      tab: currentBackendTab.value,
      page: 1,
      size: 50,
    }
    if (filterOrgId.value) params.orgId = filterOrgId.value
    const result = await queryMyFillingTasks(params)
    entries.value = result?.records || []
  } catch (e) {
    entries.value = []
    ElMessage.error('加载填报数据失败：' + (e?.message || '请稍后重试'))
  } finally { loading.value = false }
}

function handleReset() { filterKeyword.value = ''; filterCategory.value = ''; filterDate.value = ''; filterOrgId.value = null; loadEntries() }
function handleNewEntry() { router.push('/designer') }
function handleViewEntry(e) { if (!e?.id) return; router.push('/entry/detail/' + e.id + '?mode=view&backUrl=' + encodeURIComponent(route.fullPath)) }
function handleEdit(e) { if (!e?.id) return; router.push('/entry/detail/' + e.id + '?backUrl=' + encodeURIComponent(route.fullPath)) }
function handleView(e) { if (!e?.id) return; router.push('/entry/detail/' + e.id + '?mode=view&backUrl=' + encodeURIComponent(route.fullPath)) }
async function handleReport(e) {
  try {
    await ElMessageBox.confirm('确定将此报表上报给上级单位吗？', '确认上报', { confirmButtonText: '上报', cancelButtonText: '取消', type: 'warning' })
    await reportToSuperior(e.id)
    ElMessage.success('上报成功')
    loadEntries()
  } catch (err) {
    if (err !== 'cancel') ElMessage.error(err?.message || '上报失败')
  }
}

async function handleCancelReport(e) {
  try {
    await ElMessageBox.confirm('确定取消上报吗？取消后该报表将回到已通过状态。', '确认取消上报', { confirmButtonText: '取消上报', cancelButtonText: '取消', type: 'warning' })
    await cancelReport(e.id)
    ElMessage.success('已取消上报')
    loadEntries()
    loadStats()
  } catch (err) {
    if (err !== 'cancel') ElMessage.error(err?.message || '取消上报失败')
  }
}
async function handleCardMore(e, cmd) {
  if (cmd === 'detail') { if (!e?.id) return; router.push('/entry/detail/' + e.id + '?mode=view&backUrl=' + encodeURIComponent(route.fullPath)) }
  else if (cmd === 'history') showVersionHistory(e)
  else if (cmd === 'auditTrail') showAuditTrail(e)
  else if (cmd === 'export') exportToExcel(e.id)
  else if (cmd === 'withdraw') handleWithdraw(e)
  else if (cmd === 'delete') {
    try {
      await ElMessageBox.confirm('确认删除该草稿？', '提示', { type: 'warning' })
      await deleteDraft(e.id)
      await removeDraftFromIndexedDB(e.id)
      ElMessage.success('删除成功')
      loadEntries()
      loadStats()
    } catch (err) {
      if (err !== 'cancel') ElMessage.error(err?.message || '删除失败')
    }
  }
}

async function handleWithdraw(entry) {
  try {
    await ElMessageBox.confirm(`确认撤回「${entry.name}」吗？`, '撤回确认', { type: 'warning' })
  } catch { return }
  try {
    await withdrawSubmit(entry.id)
    ElMessage.success('已撤回')
    loadEntries()
    loadStats()
  } catch (e) {
    ElMessage.error('撤回失败：' + (e?.message || ''))
  }
}

async function showAuditTrail(entry) {
  auditTrailDialog.value = { visible: true, loading: true, logs: [], entryName: entry.name || '' }
  try {
    const result = await getAuditHistory(entry.id)
    const data = result?.data || result
    auditTrailDialog.value.logs = Array.isArray(data) ? data : []
  } catch {
    auditTrailDialog.value.logs = []
  } finally {
    auditTrailDialog.value.loading = false
  }
}

async function showVersionHistory(entry) {
  versionHistoryDialog.value = { visible: true, loading: true, logs: [], entryName: entry.name || '' }
  try {
    const result = await getEntryHistory(entry.id)
    const data = result?.data || result
    versionHistoryDialog.value.logs = Array.isArray(data) ? data : (data?.records || [])
  } catch {
    versionHistoryDialog.value.logs = []
  } finally {
    versionHistoryDialog.value.loading = false
  }
}

async function loadSubordinateOrgs() {
  try {
    const data = await getSubordinateOrgs()
    subordinateOrgs.value = Array.isArray(data) ? data : []
  } catch {
    subordinateOrgs.value = []
  }
}

async function exportToExcel(submitId) {
  try {
    const token = sessionStorage.getItem('rpt_token') || localStorage.getItem('rpt_token') || ''
    const response = await fetch(`/api/filling/export/${submitId}`, {
      headers: { Authorization: token }
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || err.msg || '导出失败')
    }
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report_${submitId}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (e) {
    ElMessage.error('导出失败：' + (e?.message || ''))
  }
}

function auditTypeName(type) {
  const map = { 1: '提交', 2: '审批通过', 3: '驳回', 4: '撤回', 5: '重新提交', 6: '转交', 7: '上报', 8: '取消上报', 9: '撤销审批' }
  return map[type] || '其他'
}

function formatAuditTime(time) {
  if (!time) return ''
  const d = new Date(time)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

onMounted(() => { loadStats(); loadEntries(); loadSubordinateOrgs() })
watch(() => route.path, () => loadEntries())
watch(filterOrgId, () => loadEntries())
</script>

<style scoped>
.entry-center { padding: var(--app-content-padding); min-height: calc(100vh - 100px); }

/* Page Header */
.ec-page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--app-space-6); }
.ec-header-left .ec-page-title { font-size: 20px; font-weight: 600; color: var(--app-text-primary); margin: 0; }
.ec-header-left .ec-page-desc { font-size: 13px; color: var(--app-text-muted); margin: 4px 0 0; }
.ec-header-right { display: flex; gap: var(--app-space-2); }

/* Buttons */
.ec-btn { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 var(--app-space-4); border-radius: var(--app-radius-md); font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid var(--app-border); background: var(--app-surface); color: var(--app-text-primary); transition: all var(--app-transition); white-space: nowrap; }
.ec-btn:hover { background: var(--app-surface-hover); }
.ec-btn--primary { background: var(--app-primary); color: #fff; border-color: var(--app-primary); }
.ec-btn--primary:hover { background: var(--app-primary-hover); }
.ec-btn--ghost { background: transparent; border-color: transparent; color: var(--app-text-secondary); }
.ec-btn--ghost:hover { background: var(--app-surface-hover); color: var(--app-primary); }
.ec-btn--danger { background: var(--app-danger); border-color: var(--app-danger); color: #fff; }
.ec-btn--danger:hover { background: var(--app-danger-hover); }
.ec-btn--warning { background: var(--app-warning); border-color: var(--app-warning); color: #fff; }
.ec-btn--warning:hover { background: var(--app-warning-hover, #D97706); }
.ec-btn--info { background: var(--app-info); border-color: var(--app-info); color: #fff; }
.ec-btn--info:hover { background: var(--app-info-hover, #2563EB); }

/* 批量操作栏 */
.ec-batch-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 16px; margin: 0 16px;
  background: var(--app-primary-bg); border: 1px solid var(--app-primary);
  border-radius: var(--app-radius-md); margin-bottom: 12px;
}
.ec-batch-info { font-size: 13px; font-weight: 500; color: var(--app-primary); }
.ec-batch-actions { display: flex; gap: 8px; }

/* 复选框 */
.ec-card-check { position: absolute; top: 16px; left: 16px; z-index: 2; }
.ec-card-check input[type="checkbox"] {
  width: 18px; height: 18px; cursor: pointer; accent-color: var(--app-primary);
}
.ec-card--selected { border-color: var(--app-primary); box-shadow: 0 0 0 2px var(--app-primary-bg); }

/* Stats */
.ec-stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: var(--app-space-4); margin-bottom: var(--app-space-5); }
.ec-stat-card { display: flex; align-items: center; gap: var(--app-space-3); padding: var(--app-space-4) var(--app-space-5); background: var(--app-surface); border-radius: var(--app-radius-lg); border: 1px solid var(--app-border); cursor: pointer; transition: all var(--app-transition); position: relative; }
.ec-stat-card:hover { border-color: var(--app-primary); box-shadow: var(--app-shadow-sm); }
.ec-stat-icon { width: 40px; height: 40px; border-radius: var(--app-radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ec-stat--draft .ec-stat-icon { background: rgba(148,163,184,0.1); color: var(--color-gray-600); }
.ec-stat--pending .ec-stat-icon { background: var(--app-primary-bg); color: var(--app-primary); }
.ec-stat--submitted .ec-stat-icon { background: var(--app-info-bg); color: var(--app-info); }
.ec-stat--rejected .ec-stat-icon { background: var(--app-danger-bg); color: var(--app-danger); }
.ec-stat--completed .ec-stat-icon { background: var(--app-success-bg); color: var(--app-success); }
.ec-stat-body { flex: 1; }
.ec-stat-value { font-size: 24px; font-weight: 700; color: var(--app-text-primary); font-family: var(--app-font-family-number); }
.ec-stat-label { font-size: 13px; color: var(--app-text-secondary); display: block; }
.ec-stat-badge { position: absolute; top: -8px; right: var(--app-space-3); font-size: 11px; padding: 2px 8px; background: var(--app-danger-bg); color: var(--app-danger); border-radius: var(--app-radius-xs); white-space: nowrap; font-weight: 500; }

/* Content Card */
.ec-content-card { background: var(--app-surface); border-radius: var(--app-radius-lg); box-shadow: var(--app-shadow-sm); overflow: hidden; padding: var(--app-space-6); }

/* Filter Bar */
.ec-filter-bar { display: flex; gap: var(--app-space-3); margin-bottom: var(--app-space-5); flex-wrap: wrap; }
.ec-search-input { width: 360px; }

/* Card Grid */
.ec-card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--app-card-gap); }

/* Entry Card */
.ec-card { padding: var(--app-space-5); background: var(--app-surface); border: 1px solid var(--app-border); border-radius: var(--app-radius-lg); transition: all var(--app-transition); cursor: default; }
.ec-card:hover { border-color: var(--app-primary); box-shadow: var(--app-shadow-md); }
.ec-card--urgent { border-left: 3px solid var(--app-danger); background: var(--app-danger-bg); }
.ec-card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--app-space-3); }
.ec-card-title { font-size: 16px; font-weight: 600; color: var(--app-text-primary); cursor: pointer; margin: 0; line-height: 1.4; }
.ec-card-title:hover { color: var(--app-primary); }

/* Status Tags */
.ec-status-tag { font-size: 11px; padding: 2px 8px; border-radius: var(--app-radius-xs); font-weight: 500; white-space: nowrap; flex-shrink: 0; }
.ec-status--draft { background: rgba(148,163,184,0.1); color: var(--color-gray-600); }
.ec-status--filling,.ec-status--pending { background: var(--app-primary-bg); color: var(--app-primary); }
.ec-status--submitted { background: var(--app-info-bg); color: var(--app-info); }
.ec-status--reviewing { background: var(--app-warning-bg); color: var(--app-warning); }
.ec-status--approved { background: var(--app-success-bg); color: var(--app-success); }
.ec-status--rejected { background: var(--app-danger-bg); color: var(--app-danger); }
.ec-status--reported { background: var(--app-info-bg); color: var(--app-info); }

/* Card Meta */
.ec-card-meta { display: flex; flex-direction: column; gap: 6px; margin-bottom: var(--app-space-3); }
.ec-meta-row { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--app-text-secondary); }
.ec-meta--deadline { font-weight: 500; }
.ec-meta--urgent { color: var(--app-danger); }
.ec-deadline-urgent { color: var(--app-danger); font-weight: 500; }
.ec-review-banner { display: flex; align-items: flex-start; gap: 6px; padding: var(--app-space-2) var(--app-space-3); background: var(--app-danger-bg); border-radius: var(--app-radius-xs); font-size: 12px; color: var(--app-danger); margin-bottom: var(--app-space-3); line-height: 1.5; }
.ec-review-banner svg { flex-shrink: 0; margin-top: 2px; }
.ec-review-content { display: flex; flex-direction: column; gap: 2px; }
.ec-review-text { font-size: 12px; line-height: 1.5; }
.ec-review-auditor { font-size: 11px; color: var(--app-text-secondary); }
.ec-card-progress { display: flex; align-items: center; gap: var(--app-space-3); margin-bottom: var(--app-space-3); }
.ec-progress-bar { flex: 1; height: 6px; background: var(--app-border); border-radius: 3px; overflow: hidden; }
.ec-progress-bar--sm { height: 4px; }
.ec-progress-fill { height: 100%; background: var(--app-primary); border-radius: 3px; transition: width var(--app-transition-slow); }
.ec-progress-text { font-size: 12px; color: var(--app-text-muted); white-space: nowrap; }
.ec-card-footer { display: flex; justify-content: space-between; align-items: center; padding-top: var(--app-space-3); border-top: 1px solid var(--app-border-light); }
.ec-card-time { font-size: 12px; color: var(--app-text-muted); }
.ec-card-actions { display: flex; align-items: center; gap: 4px; }

/* Table View */
.ec-table-wrapper { border-radius: var(--app-radius-md); overflow: hidden; }
.ec-table-name { font-weight: 500; color: var(--app-text-primary); }
.ec-table-progress { display: flex; align-items: center; gap: var(--app-space-2); font-size: 12px; color: var(--app-text-secondary); }

/* Empty */
.ec-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; color: var(--app-text-muted); grid-column: 1 / -1; }
  .ec-empty-icon { margin-bottom: 16px; opacity: 0.8; }
  .ec-empty-title { margin: 0 0 8px; font-size: 15px; font-weight: 600; color: var(--app-text-secondary); }
  .ec-empty-desc { margin: 0 0 20px; font-size: 13px; }

/* Skeleton */
.ec-card--skeleton { cursor: default; pointer-events: none; }
.ec-card--skeleton:hover { border-color: var(--app-border); box-shadow: none; }
.ec-skel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--app-space-4); }
.ec-skel-body { display: flex; flex-direction: column; gap: var(--app-space-2); margin-bottom: var(--app-space-4); }
.ec-skel-footer { padding-top: var(--app-space-3); border-top: 1px solid var(--app-border-light); }
.ec-skel-tag { width: 50px; height: 20px; border-radius: var(--app-radius-xs); animation: ec-shimmer 1.5s ease-in-out infinite; background-size: 200% 100%; background-image: linear-gradient(90deg, var(--app-surface-hover) 0%, var(--app-border) 50%, var(--app-surface-hover) 100%); }
.ec-skel-line { height: 13px; border-radius: 6px; animation: ec-shimmer 1.5s ease-in-out infinite; background-size: 200% 100%; background-image: linear-gradient(90deg, var(--app-surface-hover) 0%, var(--app-border) 50%, var(--app-surface-hover) 100%); }
.ec-skel-line--title { width: 60%; height: 16px; }
.ec-skel-line--sm { width: 50%; }
.ec-skel-line--xs { width: 30%; height: 11px; }
@keyframes ec-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

@media (max-width:1199px) { .ec-stats { grid-template-columns: repeat(3, 1fr); } .ec-card-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); } .ec-search-input { width: 240px; } }
@media (max-width:768px) { .ec-stats { grid-template-columns: repeat(2, 1fr); } .ec-card-grid { grid-template-columns: 1fr; } .ec-search-input { width: 100%; } }

/* Audit Trail Dialog */
.ec-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 2000; display: flex; align-items: center; justify-content: center; }
.ec-dialog { background: #fff; border-radius: 12px; width: 520px; max-height: 80vh; display: flex; flex-direction: column; box-shadow: 0 8px 30px rgba(0,0,0,.15); }
.ec-dialog-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--app-border); }
.ec-dialog-header h3 { margin: 0; font-size: 16px; color: var(--app-text-primary); }
.ec-dialog-close { background: none; border: none; font-size: 22px; cursor: pointer; color: var(--app-text-secondary); padding: 0 4px; line-height: 1; }
.ec-dialog-close:hover { color: var(--app-text-primary); }
.ec-dialog-body { padding: 16px 20px; overflow-y: auto; }
.ec-dialog-loading, .ec-dialog-empty { text-align: center; padding: 32px; color: var(--app-text-secondary); font-size: 14px; }
.ec-timeline { position: relative; padding-left: 24px; }
.ec-timeline::before { content: ''; position: absolute; left: 7px; top: 4px; bottom: 4px; width: 2px; background: var(--app-border); }
.ec-timeline-item { position: relative; margin-bottom: 16px; }
.ec-timeline-item:last-child { margin-bottom: 0; }
.ec-timeline-dot { position: absolute; left: -20px; top: 4px; width: 12px; height: 12px; border-radius: 50%; background: var(--app-primary); border: 2px solid #fff; box-shadow: 0 0 0 2px var(--app-primary); }
.ec-tl-3 .ec-timeline-dot { background: var(--app-danger); box-shadow: 0 0 0 2px var(--app-danger); }
.ec-tl-2 .ec-timeline-dot { background: var(--app-success); box-shadow: 0 0 0 2px var(--app-success); }
.ec-timeline-content { background: var(--app-surface-hover); border-radius: 8px; padding: 10px 14px; }
.ec-timeline-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.ec-timeline-action { font-size: 13px; font-weight: 600; color: var(--app-text-primary); }
.ec-timeline-time { font-size: 12px; color: var(--app-text-secondary); }
.ec-timeline-auditor { font-size: 12px; color: var(--app-text-secondary); margin-bottom: 4px; }
.ec-timeline-opinion { font-size: 13px; color: var(--app-text-primary); line-height: 1.5; padding: 6px 10px; background: #fff; border-radius: 6px; border-left: 3px solid var(--app-warning); }
</style>
