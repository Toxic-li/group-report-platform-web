<template>
  <div class="dashboard">
    <!-- ===== 1. 顶部工作概览 ===== -->
    <header class="db-header">
      <div class="db-header-left">
        <div class="db-header-greeting">
          <span class="db-header-emoji">{{ greetingEmoji }}</span>
          <div>
            <div class="db-header-wave">{{ greeting }}，{{ userName }}</div>
            <div class="db-header-subtitle">今日工作概览</div>
          </div>
        </div>
      </div>
      <div class="db-header-center">
        <div class="db-header-overview" v-if="!loading">
          <div class="db-header-stat">
            <span class="db-header-stat-val">{{ taskOverview[0]?.value || 0 }}</span>
            <span class="db-header-stat-label">待填报</span>
          </div>
          <div class="db-header-stat">
            <span class="db-header-stat-val">{{ taskOverview[1]?.value || 0 }}</span>
            <span class="db-header-stat-label">待审核</span>
          </div>
          <div class="db-header-stat db-header-stat--warn">
            <span class="db-header-stat-val">{{ anomalyCount }}</span>
            <span class="db-header-stat-label">异常数据</span>
          </div>
          <div class="db-header-stat">
            <span class="db-header-stat-val">{{ monthlyReports }}</span>
            <span class="db-header-stat-label">本月生成报表</span>
          </div>
          <div class="db-header-stat db-header-stat--success">
            <span class="db-header-stat-val">{{ dataRefreshRate }}%</span>
            <span class="db-header-stat-label">填报完成率</span>
          </div>
        </div>
        <div class="db-header-overview db-header-overview--skeleton" v-else>
          <div v-for="i in 5" :key="'hs-' + i" class="db-header-stat">
            <div class="db-skeleton-line db-skeleton-line--kpi"></div>
            <div class="db-skeleton-line db-skeleton-line--xs" style="width:60%"></div>
          </div>
        </div>
      </div>
      <div class="db-header-right">
        <div class="db-header-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="db-header-search-icon">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="搜索报表、指标或数据..." class="db-header-search-input" v-model="searchQuery" @keyup.enter="handleSearch" />
        </div>
        <button class="db-header-btn" @click="navigateTo('/designer')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
          创建报表
        </button>
      </div>
    </header>

    <!-- ===== 2. KPI Row 1: BI 平台指标 ===== -->
    <section class="db-kpi-section">
      <template v-if="loading">
        <div v-for="i in 5" :key="'ks1-' + i" class="db-kpi-card db-skeleton-card">
          <div class="db-skeleton-icon"></div>
          <div class="db-skeleton-content">
            <div class="db-skeleton-line db-skeleton-line--xs" style="width:40%"></div>
            <div class="db-skeleton-line db-skeleton-line--lg"></div>
            <div class="db-skeleton-line db-skeleton-line--sm"></div>
          </div>
        </div>
      </template>
      <template v-else>
        <div v-for="kpi in biMetrics" :key="kpi.key" class="db-kpi-card" :class="[kpi.accent]" @click="navigateTo(kpi.path)">
          <div class="db-kpi-accent"></div>
          <div class="db-kpi-body">
            <div class="db-kpi-top">
              <div class="db-kpi-icon" :style="{ backgroundColor: kpi.bgColor, color: kpi.color }">
                <component :is="kpi.icon" :size="20" />
              </div>
              <span class="db-kpi-trend" v-if="kpi.trend !== null" :class="kpi.trend >= 0 ? 'up' : 'down'">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" :stroke="kpi.trend >= 0 ? 'var(--color-success)' : 'var(--color-error)'">
                  <polyline :points="kpi.trend >= 0 ? '18 15 12 9 6 15' : '6 9 12 15 18 9'"/>
                </svg>
                {{ Math.abs(kpi.trend) }}%
              </span>
            </div>
            <div class="db-kpi-value">{{ formatNumber(kpi.value) }}</div>
            <div class="db-kpi-label">{{ kpi.label }}</div>
            <svg class="db-kpi-sparkline" viewBox="0 0 100 24" preserveAspectRatio="none">
              <path :d="kpi.sparklinePath" fill="none" :stroke="kpi.color" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </template>
    </section>

    <!-- ===== 3. KPI Row 2: 业务流程 ===== -->
    <section class="db-flow-section">
      <template v-if="loading">
        <div v-for="i in 4" :key="'fs-' + i" class="db-flow-card db-skeleton-item">
          <div class="db-skeleton-icon" style="width:44px;height:44px;border-radius:12px"></div>
          <div class="db-skeleton-content">
            <div class="db-skeleton-line db-skeleton-line--xs" style="width:50%"></div>
            <div class="db-skeleton-line db-skeleton-line--lg"></div>
          </div>
        </div>
      </template>
      <template v-else>
        <div v-for="flow in businessFlowCards" :key="flow.key" class="db-flow-card" :class="flow.key" @click="navigateTo(flow.path)">
          <div class="db-flow-badge" v-if="flow.count > 0">{{ flow.count }}</div>
          <div class="db-flow-icon" :style="{ backgroundColor: flow.bgColor, color: flow.color }">
            <component :is="flow.icon" :size="22" />
          </div>
          <div class="db-flow-info">
            <div class="db-flow-label">{{ flow.label }}</div>
            <div class="db-flow-desc">{{ flow.description }}</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-gray-500)" stroke-width="2" class="db-flow-arrow">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </div>
      </template>
    </section>

    <!-- ===== 4. 系统状态 / 经营概览 ===== -->
    <section class="db-cockpit-section" v-if="!loading && dashboardData?.systemStatus">
      <div class="db-section-header">
        <h2 class="db-section-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="db-section-icon"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          系统概览 · 今日平台运行情况
        </h2>
      </div>
      <div class="db-cockpit-grid">
        <div class="db-cockpit-item">
          <div class="db-cockpit-item-icon db-cockpit-item-icon--revenue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div class="db-cockpit-item-data">
            <div class="db-cockpit-item-label">用户总数</div>
            <div class="db-cockpit-item-value">{{ dashboardData.systemStatus.userCount || 0 }}<span class="db-cockpit-item-unit">人</span></div>
            <div class="db-cockpit-item-trend up">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
              在线 {{ dashboardData.systemStatus.onlineUsers || 0 }}
            </div>
          </div>
        </div>
        <div class="db-cockpit-item">
          <div class="db-cockpit-item-icon db-cockpit-item-icon--profit">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <div class="db-cockpit-item-data">
            <div class="db-cockpit-item-label">报表模板</div>
            <div class="db-cockpit-item-value">{{ dashboardData.systemStatus.templateCount || 0 }}<span class="db-cockpit-item-unit">个</span></div>
            <div class="db-cockpit-item-trend up">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
              今日提交 {{ dashboardData.systemStatus.todaySubmissions || 0 }}
            </div>
          </div>
        </div>
        <div class="db-cockpit-item">
          <div class="db-cockpit-item-icon db-cockpit-item-icon--inventory">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
          </div>
          <div class="db-cockpit-item-data">
            <div class="db-cockpit-item-label">数据源</div>
            <div class="db-cockpit-item-value">{{ dashboardData.systemStatus.dataSourceCount || 0 }}<span class="db-cockpit-item-unit">个</span></div>
            <div class="db-cockpit-item-trend up">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
              今日审核 {{ dashboardData.systemStatus.todayApprovals || 0 }}
            </div>
          </div>
        </div>
        <div class="db-cockpit-item">
          <div class="db-cockpit-item-icon db-cockpit-item-icon--orders">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div class="db-cockpit-item-data">
            <div class="db-cockpit-item-label">本月填报</div>
            <div class="db-cockpit-item-value">{{ dashboardData.monthlyReports || 0 }}<span class="db-cockpit-item-unit">份</span></div>
            <div class="db-cockpit-item-trend up">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
              报表总数 {{ dashboardData.totalReports || 0 }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== 5. 我的任务 + 最近报表 ===== -->
    <div class="db-main-row">
      <!-- 左侧 -->
      <div class="db-main-left">
        <!-- 我的任务 -->
        <section class="db-section">
          <div class="db-section-header">
            <h2 class="db-section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="db-section-icon"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              我的任务
            </h2>
            <a href="/entry" class="db-section-link">查看全部 &rarr;</a>
          </div>
          <div class="db-tasks-row" v-if="!loading">
            <div v-for="task in myTasks" :key="task.key" class="db-task-card" :class="[task.key, { urgent: task.urgent }]" @click="navigateTo(task.path)">
              <div class="db-task-header">
                <div class="db-task-icon" :style="{ backgroundColor: task.bgColor, color: task.color }">
                  <component :is="task.icon" :size="18" />
                </div>
                <span v-if="task.urgent" class="db-task-urgent-tag">紧急</span>
              </div>
              <div class="db-task-count">{{ task.count }}</div>
              <div class="db-task-label">{{ task.label }}</div>
              <div class="db-task-sublabel" v-if="task.subLabel">{{ task.subLabel }}</div>
            </div>
            <el-empty v-if="myTasks.length === 0" description="暂无任务" :image-size="40" />
          </div>
          <div class="db-tasks-row db-tasks-row--skeleton" v-else>
            <div v-for="i in 4" :key="'ts-' + i" class="db-task-card db-skeleton-item">
              <div class="db-skeleton-icon" style="width:36px;height:36px;border-radius:10px"></div>
              <div class="db-skeleton-line db-skeleton-line--lg" style="width:36px;margin-top:8px"></div>
              <div class="db-skeleton-line db-skeleton-line--xs" style="width:60%;margin-top:6px"></div>
            </div>
          </div>
        </section>

        <!-- 最近报表 (表格化) -->
        <section class="db-section">
          <div class="db-section-header">
            <h2 class="db-section-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="db-section-icon"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              最近访问
            </h2>
            <a href="/report-center" class="db-section-link">全部报表 &rarr;</a>
          </div>
          <div class="db-report-table-card" v-if="!loading">
            <table class="db-report-table" v-if="recentReports.length > 0">
              <thead>
                <tr>
                  <th style="width:28px"></th>
                  <th>报表名称</th>
                  <th style="width:80px">状态</th>
                  <th style="width:100px">访问时间</th>
                  <th style="width:120px">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="report in recentReports" :key="report.id" class="db-report-row" :class="getStatusClass(report.status)">
                  <td>
                    <div class="db-report-dot" :class="getStatusClass(report.status)"></div>
                  </td>
                  <td>
                    <div class="db-report-name-cell">
                      <span class="db-report-name">{{ report.name }}</span>
                      <span class="db-report-desc" v-if="report.description">{{ report.description }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="db-report-status-tag" :class="getStatusClass(report.status)">{{ report.statusText }}</span>
                  </td>
                  <td>
                    <span class="db-report-time">{{ report.updatedAt }}</span>
                  </td>
                  <td>
                    <div class="db-report-actions">
                      <button class="db-report-action-btn" @click="openReport(report)">查看</button>
                      <button class="db-report-action-btn" v-if="report.canEdit !== false" @click="editReport(report)">编辑</button>
                      <button class="db-report-action-btn" @click="shareReport(report)">分享</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <el-empty v-else description="暂无最近访问" :image-size="60" />
          </div>
          <div class="db-report-table-card db-report-table-card--skeleton" v-else>
            <table class="db-report-table">
              <thead>
                <tr>
                  <th style="width:28px"></th>
                  <th>报表名称</th>
                  <th style="width:80px">状态</th>
                  <th style="width:100px">访问时间</th>
                  <th style="width:120px">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="i in 5" :key="'rs-' + i" class="db-report-row db-skeleton-item">
                  <td><div class="db-skeleton-block" style="width:8px;height:8px;border-radius:50%"></div></td>
                  <td>
                    <div class="db-skeleton-line db-skeleton-line--md" style="width:60%"></div>
                    <div class="db-skeleton-line db-skeleton-line--xs" style="width:35%;margin-top:4px"></div>
                  </td>
                  <td><div class="db-skeleton-line db-skeleton-line--sm" style="width:50px"></div></td>
                  <td><div class="db-skeleton-line db-skeleton-line--xs" style="width:70px"></div></td>
                  <td><div class="db-skeleton-line db-skeleton-line--sm" style="width:80px"></div></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <!-- 右侧 -->
      <div class="db-main-right">
        <!-- 收藏报表 -->
        <section class="db-section db-section-compact">
          <div class="db-section-header">
            <h2 class="db-section-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-warning)" stroke="var(--color-warning)" stroke-width="2" class="db-section-icon"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              收藏
            </h2>
          </div>
          <div class="db-fav-list" v-if="!loading">
            <div v-for="fav in favoriteReports" :key="fav.id" class="db-fav-item" @click="openReport(fav)">
              <div class="db-fav-item-icon" :style="{ color: fav.color || 'var(--color-primary-500)' }">
                <FileSpreadsheet :size="16" />
              </div>
              <div class="db-fav-item-name">{{ fav.name }}</div>
              <span class="db-fav-item-time">{{ fav.updatedAt }}</span>
            </div>
            <el-empty v-if="favoriteReports.length === 0" description="暂无收藏" :image-size="40" />
          </div>
          <div class="db-fav-list db-fav-list--skeleton" v-else>
            <div v-for="i in 3" :key="'fv-' + i" class="db-fav-item db-skeleton-item">
              <div class="db-skeleton-icon" style="width:24px;height:24px;border-radius:6px;flex-shrink:0"></div>
              <div class="db-skeleton-line db-skeleton-line--sm" style="width:60%"></div>
            </div>
          </div>
        </section>

        <!-- 通知公告 -->
        <section class="db-section db-section-compact">
          <div class="db-section-header">
            <h2 class="db-section-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="db-section-icon"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              通知公告
            </h2>
            <a href="/profile/messages" class="db-section-link">全部 &rarr;</a>
          </div>
          <div class="db-timeline" v-if="!loading">
            <div v-for="(notice, idx) in notifications" :key="notice.id" class="db-timeline-item" :class="notice.type">
              <div class="db-timeline-dot"></div>
              <div class="db-timeline-line" v-if="idx < notifications.length - 1"></div>
              <div class="db-timeline-content">
                <div class="db-timeline-title">{{ notice.title }}</div>
                <div class="db-timeline-desc">{{ notice.description }}</div>
                <div class="db-timeline-time">{{ notice.time }}</div>
              </div>
            </div>
            <el-empty v-if="notifications.length === 0" description="暂无通知" :image-size="40" />
          </div>
          <div class="db-timeline db-timeline--skeleton" v-else>
            <div v-for="i in 2" :key="'ns-' + i" class="db-timeline-item db-skeleton-item">
              <div class="db-timeline-dot"></div>
              <div class="db-timeline-line" v-if="i < 2"></div>
              <div class="db-timeline-content">
                <div class="db-skeleton-line db-skeleton-line--md" style="width:70%"></div>
                <div class="db-skeleton-line db-skeleton-line--xs"></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- ===== 6. 趋势分析 ===== -->
    <section class="db-section">
      <div class="db-section-header">
        <h2 class="db-section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="db-section-icon"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          数据分析趋势
        </h2>
        <div class="db-chart-tabs">
          <button v-for="tab in chartTabs" :key="tab.key" class="db-chart-tab" :class="{ active: activeChartTab === tab.key }" @click="activeChartTab = tab.key">{{ tab.label }}</button>
        </div>
      </div>
      <div class="db-charts-row">
        <div class="db-chart-card">
          <div class="db-chart-title">填报与审核趋势</div>
          <svg class="db-chart-svg" viewBox="0 0 560 220" preserveAspectRatio="xMidYMid meet">
            <!-- 网格线 -->
            <g v-for="i in 4" :key="'gl-' + i" stroke="var(--color-gray-200)" stroke-width="0.5" stroke-dasharray="4 3">
              <line :x1="48" :y1="30 + (i - 1) * 42" :x2="540" :y2="30 + (i - 1) * 42" />
            </g>
            <!-- 填充区域 -->
            <polygon :points="fillTrendArea" fill="var(--color-primary-500)" opacity="0.08"/>
            <!-- 折线 -->
            <polyline :points="fillTrendPoints" fill="none" stroke="var(--color-primary-500)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            <!-- 数据点 -->
            <circle v-for="(pt, idx) in fillTrendDots" :key="'ftd-' + idx" :cx="pt.x" :cy="pt.y" r="4" fill="#fff" stroke="var(--color-primary-500)" stroke-width="2.5"/>
            <!-- X轴标签 -->
            <text v-for="(label, idx) in weekDayLabels" :key="'xl-' + idx" :x="48 + idx * 70.5" y="218" text-anchor="middle" font-size="11" fill="var(--color-gray-600)">{{ label }}</text>
          </svg>
          <div class="db-chart-legend">
            <span class="db-chart-legend-item"><span class="db-chart-legend-dot" style="background:var(--color-primary-500)"></span> 填报量</span>
            <span class="db-chart-legend-item"><span class="db-chart-legend-dot" style="background:var(--color-success)"></span> 审核量</span>
          </div>
        </div>
        <div class="db-chart-card">
          <div class="db-chart-title">各业务线报表数量</div>
          <svg class="db-chart-svg" viewBox="0 0 560 220" preserveAspectRatio="xMidYMid meet">
            <g v-for="i in 4" :key="'gb2-' + i" stroke="var(--color-gray-200)" stroke-width="0.5" stroke-dasharray="4 3">
              <line :x1="48" :y1="30 + (i - 1) * 42" :x2="540" :y2="30 + (i - 1) * 42" />
            </g>
            <rect v-for="(bar, idx) in bizBars" :key="'bb-' + idx" :x="bar.x" :y="bar.y" :width="bar.w" :height="bar.h" :rx="bar.w / 2" :fill="bar.color" opacity="0.85" />
            <text v-for="(label, idx) in bizLabels" :key="'bl-' + idx" :x="48 + idx * 70.5" y="218" text-anchor="middle" font-size="11" fill="var(--color-gray-600)">{{ label }}</text>
          </svg>
        </div>
      </div>
    </section>

    <!-- ===== 7. AI 悬浮助手 ===== -->
    <div class="db-ai-float" @click="toggleAIAssistant">
      <div class="db-ai-float-inner">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          <circle cx="12" cy="12" r="10" stroke-dasharray="4 2" opacity="0"/>
        </svg>
      </div>
      <div class="db-ai-tooltip">✨ AI 报表助手</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, markRaw, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  FileSpreadsheet, FileEdit, FileCheck, Eye, BarChart3,
  PenTool, PlusCircle, TrendingUp, Zap, ShieldAlert,
  Database, Rocket, Users, Activity, Clock, RefreshCw, Star
} from 'lucide-vue-next'
import { getDashboardData, getFillTrend, getBizDistribution } from '@/api/dashboard'

const router = useRouter()

const loading = ref(true)
const userName = ref('Admin')
const userRole = ref('filler')
const searchQuery = ref('')
const dashboardData = ref({})

// ===== 问候语 =====
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 9) return '早上好'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})
const greetingEmoji = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '🌙'; if (h < 9) return '☀️'; if (h < 12) return '😊'
  if (h < 14) return '🍵'; if (h < 18) return '☕'; return '🌆'
})

// ===== 头部工作概览 =====
const taskOverview = ref([
  { key: 'pendingFill', label: '待填报', value: 0 },
  { key: 'pendingApproval', label: '待审核', value: 0 },
])
const anomalyCount = ref(0)
const monthlyReports = ref(0)
const dataRefreshRate = ref(0)

// ===== KPI Row 1: BI 平台指标 =====
function generateSparkline(data: number[], h: number = 24): string {
  const w = data.length - 1
  if (w <= 0) return ''
  const max = Math.max(...data, 1)
  return data.map((v, i) => {
    const x = (i / w) * 100
    const y = h - (v / max) * (h - 4)
    return `${x},${y.toFixed(1)}`
  }).join(' L')
}

const biMetrics = computed(() => {
  const d = dashboardData.value || {}
  type KPI = { key: string; label: string; value: number; trend: number | null; trendData: number[]; sparklinePath: string; icon: any; path: string; color: string; bgColor: string; accent: string }
  const total = d.totalReports || 0
  const recent = d.recentViewCount || 0
  const anomaly = d.anomalyCount || 0
  const list: KPI[] = [
    {
      key: 'totalReports', label: '报表总数', value: total, trend: null, trendData: [0, 0, 0, 0, 0, 0, total],
      sparklinePath: '', icon: markRaw(Database), path: '/report-center',
      color: 'var(--color-primary-500)', bgColor: 'rgba(37,99,235,0.08)', accent: 'accent-blue',
    },
    {
      key: 'myReports', label: '我的报表', value: d.myReportCount || 0, trend: null, trendData: [0, 0, 0, 0, 0, 0, d.myReportCount || 0],
      sparklinePath: '', icon: markRaw(FileSpreadsheet), path: '/report-center/my-reports',
      color: 'var(--color-success)', bgColor: 'rgba(20,184,166,0.08)', accent: 'accent-teal',
    },
    {
      key: 'favorites', label: '收藏报表', value: d.favoriteCount || 0, trend: null, trendData: [0, 0, 0, 0, 0, 0, d.favoriteCount || 0],
      sparklinePath: '', icon: markRaw(Star), path: '/report-center/favorites',
      color: 'var(--color-warning)', bgColor: 'rgba(245,158,11,0.08)', accent: 'accent-amber',
    },
    {
      key: 'recentViews', label: '最近访问', value: recent, trend: null, trendData: [0, 0, 0, 0, 0, 0, recent],
      sparklinePath: '', icon: markRaw(Clock), path: '/report-center/recent',
      color: 'var(--color-info)', bgColor: 'rgba(59,130,246,0.08)', accent: 'accent-blue',
    },
    {
      key: 'dataAnomaly', label: '数据异常', value: anomaly, trend: null, trendData: [0, 0, 0, 0, 0, 0, anomaly],
      sparklinePath: '', icon: markRaw(ShieldAlert), path: '/analytics',
      color: 'var(--color-error)', bgColor: 'rgba(239,68,68,0.08)', accent: 'accent-red',
    },
  ]
  return list.map(kpi => ({
    ...kpi,
    sparklinePath: 'M' + generateSparkline(kpi.trendData),
  }))
})

// ===== KPI Row 2: 业务流程 =====
const businessFlowCards = computed(() => [
  {
    key: 'pendingFill', label: '待填报', description: '由您或下级填报', count: taskOverview.value[0]?.value || 0,
    icon: markRaw(FileEdit), path: '/entry', color: 'var(--color-primary-500)', bgColor: 'rgba(37,99,235,0.08)',
  },
  {
    key: 'pendingAudit', label: '待审核', description: '需要您审批的报表', count: taskOverview.value[1]?.value || 0,
    icon: markRaw(FileCheck), path: '/audit', color: 'var(--color-warning)', bgColor: 'rgba(245,158,11,0.08)',
  },
  {
    key: 'completed', label: '已完成', description: '审核通过的报表', count: dashboardData.value?.completed || 0,
    icon: markRaw(Rocket), path: '/entry', color: 'var(--color-success)', bgColor: 'rgba(20,184,166,0.08)',
  },
  {
    key: 'myReports', label: '我的报表', description: '我创建的报表模板', count: dashboardData.value?.myReportCount || 0,
    icon: markRaw(FileSpreadsheet), path: '/report-center/my-reports', color: 'var(--color-primary-400)', bgColor: 'rgba(37,99,235,0.06)',
  },
])

// ===== 我的任务 =====
const myTasks = computed(() => [
  {
    key: 'fill', label: '待填报', subLabel: '需要填报的报表', count: taskOverview.value[0]?.value || 0, urgent: taskOverview.value[0]?.value > 0,
    icon: markRaw(PenTool), path: '/entry', color: 'var(--color-primary-500)', bgColor: 'rgba(37,99,235,0.08)',
  },
  {
    key: 'audit', label: '待审核', subLabel: '等待审批的报表', count: taskOverview.value[1]?.value || 0, urgent: taskOverview.value[1]?.value > 0,
    icon: markRaw(Eye), path: '/audit', color: 'var(--color-warning)', bgColor: 'rgba(245,158,11,0.08)',
  },
  {
    key: 'revise', label: '待修改', subLabel: '已退回待修正', count: anomalyCount.value,
    icon: markRaw(FileEdit), path: '/entry', color: 'var(--color-error)', bgColor: 'rgba(239,68,68,0.08)',
  },
  {
    key: 'completed', label: '已完成', subLabel: '审核通过', count: dashboardData.value?.completed || 0,
    icon: markRaw(Rocket), path: '/entry', color: 'var(--color-success)', bgColor: 'rgba(20,184,166,0.08)',
  },
])

// ===== 报表列表（表格化） =====
const recentReports = ref<any[]>([])
const favoriteReports = ref<any[]>([])
const notifications = ref<any[]>([])

// ===== 图表数据 =====
const chartTabs = [{ key: 'week', label: '本周' }, { key: 'month', label: '本月' }, { key: 'quarter', label: '本季' }]
const activeChartTab = ref('week')
const trendDays = computed(() => activeChartTab.value === 'week' ? 7 : activeChartTab.value === 'month' ? 30 : 90)

const trendData = ref([])
const weekDayLabels = computed(() => trendData.value.map(d => d.date))
const fillTrendData = computed(() => trendData.value.map(d => d.count))
const fillTrendPoints = computed(() => {
  const data = fillTrendData.value; const max = Math.max(...data, 1)
  return data.map((v, i) => { const x = 48 + i * 70.5; const y = 30 + 170 - (v / max) * 170; return `${x.toFixed(1)},${y.toFixed(1)}` }).join(' ')
})
const fillTrendArea = computed(() => { const pts = fillTrendPoints.value; return `48,200 ${pts} 541,200` })
const fillTrendDots = computed(() => {
  const data = fillTrendData.value; const max = Math.max(...data, 1)
  return data.map((v, i) => ({ x: 48 + i * 70.5, y: 30 + 170 - (v / max) * 170 }))
})

async function loadTrendData() {
  try {
    const data = await getFillTrend(trendDays.value)
    trendData.value = Array.isArray(data) ? data : []
  } catch {
    trendData.value = []
  }
}
watch(activeChartTab, () => loadTrendData())

const bizColors = ['var(--color-primary-500)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-error)', 'var(--color-primary-600)', 'var(--color-info)', 'var(--color-gray-500)']
const bizData = ref([])
const bizLabels = computed(() => bizData.value.map(d => d.name))
const bizValues = computed(() => bizData.value.map(d => d.value))
const bizBars = computed(() => {
  const data = bizValues.value
  const max = Math.max(...data, 1); const barW = 24; const gap = 46.5
  return data.map((v, i) => {
    const h = (v / max) * 170
    return { x: 48 + i * gap + gap / 2 - barW / 2, y: 30 + 170 - h, w: barW, h, color: bizColors[i % bizColors.length] }
  })
})

async function loadBizData() {
  try {
    const data = await getBizDistribution()
    bizData.value = Array.isArray(data) ? data : []
  } catch {
    bizData.value = []
  }
}

// ===== 工具函数 =====
function formatNumber(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  if (n % 1 !== 0) return n.toFixed(1)
  return String(n)
}
function getStatusClass(status: number | string) {
  const m: Record<string, string> = { 0: 'filling', 1: 'pending', 2: 'completed', 3: 'rejected', filling: 'filling', pending: 'pending', completed: 'completed', rejected: 'rejected' }
  return m[status] || 'filling'
}
function navigateTo(path: string) { if (path && path !== '/') router.push(path) }
function openReport(r: any) { r.path ? router.push(r.path) : r.templateId ? router.push('/report/' + r.templateId) : null }
function editReport(r: any) { r.templateId ? router.push('/designer/' + r.templateId) : null }
function shareReport(_r: any) { /* TODO */ }
function handleSearch() { const q = searchQuery.value.trim(); if (q) router.push('/report-center?search=' + encodeURIComponent(q)) }
function toggleAIAssistant() { /* TODO: open AI panel */ }

// ===== 数据加载 =====
async function loadDashboardData() {
  loading.value = true
  try {
    const [data, _trend, _biz] = await Promise.all([
      getDashboardData(),
      loadTrendData(),
      loadBizData(),
    ])
    if (data) {
      dashboardData.value = data
      taskOverview.value = [
        { key: 'pendingFill', label: '待填报', value: data.pendingFill || 0 },
        { key: 'pendingApproval', label: '待审核', value: data.pendingApproval || 0 },
      ]
      anomalyCount.value = data.anomalyCount || 0
      monthlyReports.value = data.monthlyReports || 0
      dataRefreshRate.value = data.totalReports ? Math.round(((data.completed || 0) / data.totalReports) * 100) : 0
      recentReports.value = data.myReports || []
      favoriteReports.value = data.favorites || []
      notifications.value = data.notices || []
    }
  } catch {
    dashboardData.value = {}
    taskOverview.value = [
      { key: 'pendingFill', label: '待填报', value: 0 },
      { key: 'pendingApproval', label: '待审核', value: 0 },
    ]
    anomalyCount.value = 0
    monthlyReports.value = 0
    dataRefreshRate.value = 0
    recentReports.value = []
    favoriteReports.value = []
    notifications.value = []
  } finally {
    loading.value = false
  }
}

function initUser() {
  const s = sessionStorage.getItem('rpt_user') || localStorage.getItem('rpt_user')
  if (s) {
    try {
      const u = JSON.parse(s)
      userName.value = u.name || u.username || 'Admin'
      userRole.value = u.roles?.includes('admin') ? 'admin' : u.roles?.includes('auditor') ? 'auditor' : 'filler'
    } catch { /* */ }
  }
}

onMounted(() => { initUser(); loadDashboardData() })
</script>


<style lang="scss" scoped>
// ===== New Design Tokens (v2.1) =====
$primary: #2563EB;
$teal: #14B8A6;
$amber: #F59E0B;
$red: #EF4444;
$bg-page: #F7F9FC;
$radius-lg: 16px;
$radius-md: 12px;
$radius-sm: 8px;

.dashboard {
  padding: 24px;
  max-width: 1440px;
  margin: 0 auto;

  // ==========================================
  // 1. Header - 工作概览
  // ==========================================
  .db-header {
    display: flex;
    align-items: center;
    gap: 32px;
    padding: 20px 28px;
    margin-bottom: 24px;
    background: var(--app-surface);
    border: 1px solid var(--app-border);
    border-radius: $radius-lg;
    box-shadow: 0 1px 3px rgba(15,23,42,0.04);
  }
  .db-header-left { flex-shrink: 0; }
  .db-header-greeting { display: flex; align-items: center; gap: 12px; }
  .db-header-emoji { font-size: 28px; line-height: 1; }
  .db-header-wave { font-size: 16px; font-weight: 700; color: var(--app-text-primary); }
  .db-header-subtitle { font-size: 12px; color: var(--app-text-muted); margin-top: 2px; }

  .db-header-center { flex: 1; display: flex; justify-content: center; }
  .db-header-overview { display: flex; gap: 0; align-items: center; }
  .db-header-stat {
    display: flex; flex-direction: column; align-items: center;
    padding: 0 20px; border-right: 1px solid var(--app-border-light);
    &:last-child { border-right: none; padding-right: 0; }
    &:first-child { padding-left: 0; }
    &--warn .db-header-stat-val { color: $red; }
    &--success .db-header-stat-val { color: $teal; }
  }
  .db-header-stat-val { font-size: 22px; font-weight: 700; color: $primary; line-height: 1.2; }
  .db-header-stat-label { font-size: 11px; color: var(--app-text-muted); margin-top: 2px; white-space: nowrap; }

  .db-header-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
  .db-header-search { position: relative; display: flex; align-items: center; }
  .db-header-search-icon { position: absolute; left: 12px; color: var(--app-text-muted); pointer-events: none; }
  .db-header-search-input {
    width: 220px; height: 38px; padding: 0 12px 0 36px;
    border: 1px solid var(--app-border); border-radius: 10px; font-size: 13px;
    background: var(--app-bg); color: var(--app-text-primary); outline: none;
    transition: all 0.2s;
    &::placeholder { color: var(--app-text-muted); }
    &:focus { background: var(--app-surface); border-color: $primary; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
  }
  .db-header-btn {
    display: flex; align-items: center; gap: 6px; padding: 9px 20px;
    background: $primary; color: #fff; border: none; border-radius: 10px;
    font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap;
    &:hover { background: #1D4ED8; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(37,99,235,0.3); }
  }

  // ==========================================
  // 2. KPI Cards Row 1
  // ==========================================
  .db-kpi-section { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-bottom: 20px; }
  .db-kpi-card {
    position: relative; background: var(--app-surface); border: 1px solid var(--app-border);
    border-radius: $radius-lg; cursor: pointer; transition: all 0.25s ease-out; overflow: hidden;
    &:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(15,23,42,0.1); border-color: $primary; }
  }
  .db-kpi-accent { position: absolute; left: 0; top: 14px; bottom: 14px; width: 3px; border-radius: 0 2px 2px 0; }
  .db-kpi-body { padding: 18px 20px 14px; }
  .db-kpi-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
  .db-kpi-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
  .db-kpi-trend {
    display: flex; align-items: center; gap: 2px; font-size: 12px; font-weight: 600;
    &.up { color: $teal; } &.down { color: $teal; }
  }
  .db-kpi-value { font-size: 30px; font-weight: 700; color: var(--app-text-primary); line-height: 1; margin-bottom: 4px; }
  .db-kpi-label { font-size: 13px; color: var(--app-text-secondary); margin-bottom: 10px; }
  .db-kpi-sparkline { width: 100%; height: 24px; display: block; }

  .db-kpi-card.accent-blue  .db-kpi-accent { background: $primary; }
  .db-kpi-card.accent-teal  .db-kpi-accent { background: $teal; }
  .db-kpi-card.accent-amber .db-kpi-accent { background: $amber; }
  .db-kpi-card.accent-red   .db-kpi-accent { background: $red; }

  // ==========================================
  // 3. Business Flow Cards
  // ==========================================
  .db-flow-section { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .db-flow-card {
    position: relative; display: flex; align-items: center; gap: 14px; padding: 18px 20px;
    background: var(--app-surface); border: 1px solid var(--app-border); border-radius: $radius-md;
    cursor: pointer; transition: all 0.25s;
    &:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(15,23,42,0.08); }
  }
  .db-flow-badge {
    position: absolute; top: -6px; right: -6px; min-width: 22px; height: 22px; padding: 0 6px;
    border-radius: 11px; background: $red; color: #fff; font-size: 11px; font-weight: 700;
    display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(239,68,68,0.3);
  }
  .db-flow-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .db-flow-info { flex: 1; min-width: 0; }
  .db-flow-label { font-size: 14px; font-weight: 600; color: var(--app-text-primary); }
  .db-flow-desc { font-size: 12px; color: var(--app-text-muted); margin-top: 2px; }
  .db-flow-arrow { flex-shrink: 0; opacity: 0; transition: all 0.2s; }
  .db-flow-card:hover .db-flow-arrow { opacity: 1; transform: translateX(4px); }

  // ==========================================
  // 4. 经营驾驶舱 Section
  // ==========================================
  .db-cockpit-section {
    margin-bottom: 24px; padding: 24px; background: var(--app-surface);
    border: 1px solid var(--app-border); border-radius: $radius-lg;
    background-image: linear-gradient(135deg, var(--app-surface) 0%, var(--color-primary-50) 100%);
  }
  .db-cockpit-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 16px; }
  .db-cockpit-item {
    display: flex; align-items: center; gap: 14px; padding: 16px;
    background: rgba(255,255,255,0.7); border-radius: $radius-md; border: 1px solid var(--app-border-light);
    transition: all 0.2s; backdrop-filter: blur(4px);
    &:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(15,23,42,0.06); }
  }
  .db-cockpit-item-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .db-cockpit-item-icon--revenue  { background: rgba(37,99,235,0.1); color: $primary; }
  .db-cockpit-item-icon--profit   { background: rgba(20,184,166,0.1); color: $teal; }
  .db-cockpit-item-icon--inventory { background: rgba(245,158,11,0.1); color: $amber; }
  .db-cockpit-item-icon--orders   { background: rgba(239,68,68,0.1); color: $red; }
  .db-cockpit-item-data { min-width: 0; }
  .db-cockpit-item-label { font-size: 12px; color: var(--app-text-muted); margin-bottom: 4px; }
  .db-cockpit-item-value { font-size: 24px; font-weight: 700; color: var(--app-text-primary); line-height: 1; display: flex; align-items: baseline; gap: 4px; }
  .db-cockpit-item-unit { font-size: 13px; font-weight: 500; color: var(--app-text-muted); }
  .db-cockpit-item-trend {
    display: flex; align-items: center; gap: 2px; font-size: 12px; font-weight: 600; margin-top: 4px;
    &.up { color: $teal; } &.down { color: $red; }
  }

  // ==========================================
  // 5. Main Row (70/30)
  // ==========================================
  .db-main-row { display: grid; grid-template-columns: 1fr 340px; gap: 20px; margin-bottom: 8px; }

  // ===== 5a. My Tasks =====
  .db-tasks-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
  .db-task-card {
    position: relative; padding: 20px 18px; text-align: center; cursor: pointer;
    background: var(--app-surface); border: 1px solid var(--app-border); border-radius: $radius-md;
    transition: all 0.2s;
    &:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(15,23,42,0.06); }
    &.urgent { border-color: rgba(239,68,68,0.2); }
    &.fill:hover { border-color: $primary; }
    &.audit:hover { border-color: $amber; }
    &.revise:hover { border-color: $red; }
    &.publish:hover { border-color: $teal; }
  }
  .db-task-header { display: flex; justify-content: center; align-items: center; gap: 8px; margin-bottom: 10px; }
  .db-task-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
  .db-task-urgent-tag { padding: 2px 8px; border-radius: 4px; background: rgba(239,68,68,0.1); color: $red; font-size: 10px; font-weight: 600; }
  .db-task-count { font-size: 32px; font-weight: 700; color: var(--app-text-primary); line-height: 1; }
  .db-task-label { font-size: 13px; color: var(--app-text-secondary); margin-top: 4px; font-weight: 500; }
  .db-task-sublabel { font-size: 11px; color: var(--app-text-muted); margin-top: 2px; }

  // ===== 5b. Recent Reports Table =====
  .db-report-table-card { background: var(--app-surface); border: 1px solid var(--app-border); border-radius: $radius-md; overflow: hidden; }
  .db-report-table { width: 100%; border-collapse: collapse; }
  .db-report-table th {
    padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600;
    color: var(--app-text-muted); border-bottom: 1px solid var(--app-border-light);
    background: var(--app-bg);
  }
  .db-report-table td {
    padding: 12px 16px; font-size: 13px; border-bottom: 1px solid var(--app-border-light);
    vertical-align: middle;
  }
  .db-report-row {
    transition: background 0.15s;
    &:hover { background: var(--app-surface-hover); }
    &:last-child td { border-bottom: none; }
  }
  .db-report-dot { width: 8px; height: 8px; border-radius: 50%;
    &.filling { background: $primary; } &.pending { background: $amber; }
    &.completed { background: $teal; } &.rejected { background: $red; }
  }
  .db-report-name-cell { display: flex; flex-direction: column; gap: 2px; }
  .db-report-name { font-weight: 600; color: var(--app-text-primary); cursor: pointer; &:hover { color: $primary; } }
  .db-report-desc { font-size: 12px; color: var(--app-text-muted); }
  .db-report-status-tag {
    display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 12px; font-weight: 500;
    &.filling { background: rgba(37,99,235,0.08); color: $primary; }
    &.pending { background: rgba(245,158,11,0.08); color: $amber; }
    &.completed { background: rgba(20,184,166,0.08); color: $teal; }
    &.rejected { background: rgba(239,68,68,0.08); color: $red; }
  }
  .db-report-time { font-size: 12px; color: var(--app-text-muted); white-space: nowrap; }
  .db-report-actions { display: flex; gap: 8px; }
  .db-report-action-btn {
    padding: 4px 12px; border: 1px solid var(--app-border); border-radius: 6px;
    background: var(--app-surface); color: var(--app-text-secondary); font-size: 12px;
    cursor: pointer; transition: all 0.15s;
    &:hover { border-color: $primary; color: $primary; background: var(--color-primary-50); }
  }

  // ===== 5c. Favorites List =====
  .db-fav-list { padding: 4px 0; }
  .db-fav-item {
    display: flex; align-items: center; gap: 10px; padding: 10px 12px;
    cursor: pointer; border-radius: 8px; transition: all 0.15s;
    &:hover { background: var(--app-surface-hover); }
  }
  .db-fav-item-icon { flex-shrink: 0; display: flex; align-items: center; }
  .db-fav-item-name { flex: 1; font-size: 13px; font-weight: 500; color: var(--app-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .db-fav-item-time { font-size: 11px; color: var(--app-text-muted); flex-shrink: 0; }

  // ===== 5d. Timeline =====
  .db-timeline { padding: 4px 0; }
  .db-timeline-item { position: relative; padding-left: 24px; padding-bottom: 16px; &:last-child { padding-bottom: 0; } }
  .db-timeline-dot {
    position: absolute; left: 0; top: 5px; width: 8px; height: 8px; border-radius: 50%;
    border: 2px solid var(--app-border); background: var(--app-surface); z-index: 1;
  }
  .db-timeline-line {
    position: absolute; left: 3px; top: 16px; bottom: 0; width: 2px;
    background: var(--app-border-light);
  }
  .db-timeline-content { min-width: 0; }
  .db-timeline-title { font-size: 13px; font-weight: 500; color: var(--app-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .db-timeline-desc { font-size: 12px; color: var(--app-text-secondary); margin-top: 2px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .db-timeline-time { font-size: 11px; color: var(--app-text-muted); margin-top: 4px; }
  .db-timeline-item.system .db-timeline-dot { border-color: $primary; background: $primary; }
  .db-timeline-item.business .db-timeline-dot { border-color: $amber; background: $amber; }
  .db-timeline-item.info .db-timeline-dot { border-color: $teal; background: $teal; }

  // ==========================================
  // 6. Charts
  // ==========================================
  .db-chart-tabs { display: flex; gap: 4px; }
  .db-chart-tab {
    padding: 4px 12px; border: 1px solid var(--app-border); border-radius: 6px;
    background: var(--app-surface); color: var(--app-text-secondary); font-size: 12px;
    cursor: pointer; transition: all 0.15s;
    &:hover { color: $primary; border-color: $primary; }
    &.active { background: $primary; color: #fff; border-color: $primary; }
  }
  .db-charts-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .db-chart-card { background: var(--app-surface); border: 1px solid var(--app-border); border-radius: $radius-lg; padding: 20px; }
  .db-chart-title { font-size: 13px; font-weight: 600; color: var(--app-text-secondary); margin-bottom: 12px; }
  .db-chart-svg { width: 100%; height: auto; display: block; }
  .db-chart-legend { display: flex; gap: 20px; justify-content: center; margin-top: 8px; }
  .db-chart-legend-item { font-size: 11px; color: var(--app-text-muted); display: flex; align-items: center; gap: 4px; }
  .db-chart-legend-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

  // ==========================================
  // 7. AI Float Button
  // ==========================================
  .db-ai-float {
    position: fixed; bottom: 32px; right: 32px; width: 56px; height: 56px; z-index: 100;
    cursor: pointer;
    &:hover .db-ai-tooltip { opacity: 1; transform: translateX(-8px); }
  }
  .db-ai-float-inner {
    width: 100%; height: 100%; border-radius: 50%;
    background: linear-gradient(135deg, #6366F1, #8B5CF6);
    display: flex; align-items: center; justify-content: center;
    color: #fff; box-shadow: 0 8px 24px rgba(99,102,241,0.35);
    transition: all 0.3s;
    &:hover { transform: scale(1.08); box-shadow: 0 12px 32px rgba(99,102,241,0.45); }
  }
  .db-ai-tooltip {
    position: absolute; right: 68px; top: 50%; transform: translateY(-50%) translateX(8px);
    padding: 8px 16px; background: #1E293B; color: #fff; border-radius: 8px;
    font-size: 13px; font-weight: 500; white-space: nowrap;
    opacity: 0; transition: all 0.25s; pointer-events: none;
    &::after {
      content: ''; position: absolute; right: -4px; top: 50%; transform: translateY(-50%) rotate(45deg);
      width: 8px; height: 8px; background: #1E293B;
    }
  }

  // ==========================================
  // Sections / Shared
  // ==========================================
  .db-section { margin-bottom: 20px; }
  .db-section-compact { margin-bottom: 16px; }
  .db-section-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;
  }
  .db-section-title {
    font-size: 15px; font-weight: 600; color: var(--app-text-primary); margin: 0;
    display: flex; align-items: center; gap: 8px;
  }
  .db-section-icon { color: var(--app-text-muted); flex-shrink: 0; }
  .db-section-link {
    font-size: 13px; color: $primary; text-decoration: none; font-weight: 500;
    display: flex; align-items: center; gap: 4px;
    transition: all 0.15s;
    &:hover { color: #1D4ED8; }
  }

  // ==========================================
  // Skeleton Loading
  // ==========================================
  .db-skeleton-card { cursor: default; pointer-events: none; &:hover { transform: none; box-shadow: none; } }
  .db-skeleton-item { cursor: default; pointer-events: none; }
  .db-skeleton-icon {
    background: var(--app-surface-hover); flex-shrink: 0;
    animation: db-shimmer 1.5s ease-in-out infinite;
    background-size: 200% 100%;
    background-image: linear-gradient(90deg, var(--app-surface-hover) 0%, var(--app-border) 50%, var(--app-surface-hover) 100%);
    border-radius: 12px;
  }
  .db-skeleton-block {
    background: var(--app-surface-hover);
    animation: db-shimmer 1.5s ease-in-out infinite;
    background-size: 200% 100%;
    background-image: linear-gradient(90deg, var(--app-surface-hover) 0%, var(--app-border) 50%, var(--app-surface-hover) 100%);
    border-radius: 8px;
  }
  .db-skeleton-content { flex: 1; display: flex; flex-direction: column; gap: 8px; padding: 4px 0; }
  .db-skeleton-line {
    height: 14px; border-radius: 6px;
    animation: db-shimmer 1.5s ease-in-out infinite;
    background-size: 200% 100%;
    background-image: linear-gradient(90deg, var(--app-surface-hover) 0%, var(--app-border) 50%, var(--app-surface-hover) 100%);
    &--lg { height: 28px; width: 60px; }
    &--md { height: 14px; width: 80%; }
    &--sm { height: 14px; width: 100px; }
    &--xs { height: 12px; width: 50%; }
    &--kpi { height: 22px; width: 50px; }
  }
  @keyframes db-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  // ==========================================
  // Responsive
  // ==========================================
  @media (max-width: 1200px) {
    .db-kpi-section { grid-template-columns: repeat(3, 1fr); }
    .db-flow-section { grid-template-columns: repeat(2, 1fr); }
    .db-cockpit-grid { grid-template-columns: repeat(2, 1fr); }
    .db-tasks-row { grid-template-columns: repeat(2, 1fr); }
    .db-main-row { grid-template-columns: 1fr; }
    .db-charts-row { grid-template-columns: 1fr; }
    .db-header { flex-wrap: wrap; }
    .db-header-center { order: 3; flex-basis: 100%; margin-top: 12px; }
  }

  @media (max-width: 768px) {
    padding: 16px;
    .db-header { flex-direction: column; gap: 12px; align-items: stretch; padding: 16px; }
    .db-header-overview { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .db-header-stat { border-right: none; padding: 0; }
    .db-header-right { flex-direction: column; }
    .db-header-search-input { width: 100%; }
    .db-header-btn { width: 100%; justify-content: center; }
    .db-kpi-section { grid-template-columns: repeat(2, 1fr); }
    .db-flow-section { grid-template-columns: 1fr; }
    .db-cockpit-grid { grid-template-columns: repeat(2, 1fr); }
    .db-tasks-row { grid-template-columns: repeat(2, 1fr); }
    .db-report-actions { flex-wrap: wrap; }
  }
}
</style>
