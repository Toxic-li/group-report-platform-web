<template>
  <div class="template-versions">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">模板版本</h1>
        <p class="page-desc">管理报表模板的版本历史，支持版本对比和回滚</p>
      </div>
    </div>

    <div class="content-card">
      <div class="filter-bar">
        <el-input v-model="filterKeyword" placeholder="搜索模板名称" class="search-input">
          <template #prefix>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </template>
        </el-input>
        <el-select v-model="filterTemplate" placeholder="选择模板" style="width: 200px">
          <el-option label="全部模板" value=""/>
          <el-option v-for="tpl in templates" :key="tpl.id" :label="tpl.name" :value="tpl.id"/>
        </el-select>
      </div>

      <div class="version-tree">
        <div v-for="template in versionGroups" :key="template.id" class="template-group">
          <div class="group-header">
            <span class="group-icon">{{ template.icon }}</span>
            <div class="group-info">
              <h3 class="group-name">{{ template.name }}</h3>
              <p class="group-code">{{ template.code }}</p>
            </div>
            <div class="group-stats">
              <span class="stat-item">共 {{ template.versions.length }} 个版本</span>
              <span class="stat-item">最新: v{{ template.versions[0]?.version }}</span>
            </div>
          </div>

          <div class="versions-list">
            <div
              v-for="(version, index) in template.versions"
              :key="version.id"
              :class="['version-item', { active: version.isActive, latest: index === 0 }]"
            >
              <div class="version-line">
                <div :class="['line-dot', { active: version.isActive }]"></div>
                <div v-if="index < template.versions.length - 1" class="line-connector"></div>
              </div>
              <div class="version-content">
                <div class="version-header">
                  <div class="version-info">
                    <span :class="['version-tag', { latest: index === 0 }]">v{{ version.version }}</span>
                    <span class="version-date">{{ version.createTime }}</span>
                  </div>
                  <div class="version-status">
                    <el-tag v-if="version.isActive" type="success" size="small">当前版本</el-tag>
                  </div>
                </div>
                <p class="version-desc">{{ version.description }}</p>
                <div class="version-meta">
                  <span class="meta-item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    {{ version.author }}
                  </span>
                  <span class="meta-item">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/></svg>
                    {{ version.fileSize }}
                  </span>
                </div>
                <div class="version-actions">
                  <el-button text size="small" @click="handleCompare(template.id, version.version)">版本对比</el-button>
                  <el-button text size="small" @click="handleRollback(template.id, version)" v-if="!version.isActive">回滚到此版本</el-button>
                  <el-button text size="small" type="danger" @click="handleDelete(template.id, version)" v-if="!version.isActive && index > 0">删除</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <el-empty v-if="versionGroups.length === 0" description="暂无版本记录" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const filterKeyword = ref('')
const filterTemplate = ref('')

const templates = ref([
  { id: 1, name: '月度销售报表', code: 'SALES-202401', icon: '📈' },
  { id: 2, name: '财务费用报表', code: 'FIN-202401', icon: '💰' },
  { id: 3, name: '人事考勤报表', code: 'HR-202401', icon: '👥' }
])

const versionGroups = ref([
  {
    id: 1,
    name: '月度销售报表',
    code: 'SALES-202401',
    icon: '📈',
    versions: [
      { id: 'v1', version: '1.2.0', createTime: '2024-01-15 14:30', description: '新增季度汇总功能，优化数据导出', author: '张三', fileSize: '245 KB', isActive: true },
      { id: 'v2', version: '1.1.5', createTime: '2024-01-10 11:30', description: '修复数据导出问题', author: '张三', fileSize: '238 KB', isActive: false },
      { id: 'v3', version: '1.1.0', createTime: '2024-01-05 10:00', description: '新增图表分析功能', author: '李四', fileSize: '220 KB', isActive: false },
      { id: 'v4', version: '1.0.0', createTime: '2024-01-01 09:00', description: '初始版本', author: '张三', fileSize: '195 KB', isActive: false }
    ]
  },
  {
    id: 2,
    name: '财务费用报表',
    code: 'FIN-202401',
    icon: '💰',
    versions: [
      { id: 'v5', version: '1.1.0', createTime: '2024-01-14 16:00', description: '优化数据计算逻辑', author: '李四', fileSize: '180 KB', isActive: true },
      { id: 'v6', version: '1.0.0', createTime: '2024-01-08 14:00', description: '初始版本', author: '李四', fileSize: '165 KB', isActive: false }
    ]
  },
  {
    id: 3,
    name: '人事考勤报表',
    code: 'HR-202401',
    icon: '👥',
    versions: [
      { id: 'v7', version: '1.0.5', createTime: '2024-01-13 10:00', description: '修复考勤统计错误', author: '王五', fileSize: '150 KB', isActive: true },
      { id: 'v8', version: '1.0.0', createTime: '2024-01-03 09:00', description: '初始版本', author: '王五', fileSize: '145 KB', isActive: false }
    ]
  }
])

function handleCompare(templateId, version) {
  alert(`版本对比: 模板${templateId} v${version}`)
}

function handleRollback(templateId, version) {
  alert(`回滚到: 模板${templateId} v${version.version}`)
}

function handleDelete(templateId, version) {
  alert(`删除版本: 模板${templateId} v${version.version}`)
}
</script>

<style scoped>
.template-versions {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  .page-title {
    font-size: 20px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
  }
  .page-desc {
    font-size: 14px;
    color: #666;
    margin: 4px 0 0;
  }
}

.content-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-input {
  width: 280px;
}

.version-tree {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.template-group {
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  overflow: hidden;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
}

.group-icon {
  font-size: 24px;
}

.group-info {
  flex: 1;
}

.group-name {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.group-code {
  font-size: 12px;
  color: #999;
  margin: 4px 0 0;
}

.group-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  font-size: 13px;
  color: #666;
}

.versions-list {
  padding: 16px 20px;
}

.version-item {
  display: flex;
  gap: 16px;
  padding: 16px 0;
  position: relative;

  &:not(:last-child) {
    border-bottom: 1px dashed #f0f0f0;
  }

  &.latest {
    .version-tag {
      background: #1890ff;
      color: #fff;
    }
  }
}

.version-line {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 20px;
  flex-shrink: 0;
}

.line-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #d9d9d9;
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px #d9d9d9;

  &.active {
    background: #1890ff;
    box-shadow: 0 0 0 2px #1890ff;
  }
}

.line-connector {
  flex: 1;
  width: 2px;
  background: #e8e8e8;
  margin-top: 8px;
}

.version-content {
  flex: 1;
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.version-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.version-tag {
  font-size: 13px;
  font-weight: 600;
  color: #1890ff;
  background: #e6f7ff;
  padding: 2px 8px;
  border-radius: 4px;

  &.latest {
    background: #1890ff;
    color: #fff;
  }
}

.version-date {
  font-size: 13px;
  color: #999;
}

.version-desc {
  font-size: 14px;
  color: #333;
  margin: 0 0 8px;
  line-height: 1.5;
}

.version-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

.version-actions {
  display: flex;
  gap: 8px;
}
</style>
