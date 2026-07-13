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
        <div v-for="template in filteredVersionGroups" :key="template.id" class="template-group">
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

      <el-empty v-if="filteredVersionGroups.length === 0" description="暂无版本记录" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTemplateById } from '@/api/reportDesigner.js'

const route = useRoute()
const filterKeyword = ref('')
const filterTemplate = ref('')

const templates = ref([])
const versionGroups = ref([])
const loading = ref(false)

async function loadVersions(templateId) {
  loading.value = true
  try {
    const tpl = await getTemplateById(templateId)
    if (!tpl) {
      ElMessage.error('模板不存在')
      return
    }

    templates.value = [{ id: tpl.id, name: tpl.name, code: tpl.code, icon: '📊' }]

    const versions = tpl.versions || []
    versionGroups.value = [{
      id: tpl.id,
      name: tpl.name,
      code: tpl.code,
      icon: '📊',
      versions: versions.map((v, index) => ({
        id: v.id,
        version: String(v.version || index + 1),
        createTime: v.createTime || v.createdAt,
        description: v.changeLog || v.description || '版本快照',
        author: v.operatorName || v.creatorName || '系统',
        fileSize: '-',
        isActive: index === 0
      }))
    }]
  } catch (e) {
    console.error('[TemplateVersions] 加载版本失败:', e)
    ElMessage.error('加载版本失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const templateId = route.query.templateId || route.query.code
  if (templateId) {
    loadVersions(templateId)
  }
})

const filteredVersionGroups = computed(() => {
  return versionGroups.value.filter(group => {
    const matchKw = !filterKeyword.value || group.name.includes(filterKeyword.value) || group.code.toLowerCase().includes(filterKeyword.value.toLowerCase())
    const matchTpl = !filterTemplate.value || group.id === filterTemplate.value
    return matchKw && matchTpl
  })
})

function handleCompare(templateId, version) {
  ElMessage.info(`版本对比: 当前版本 vs v${version}`)
}

async function handleRollback(templateId, version) {
  try {
    await ElMessageBox.confirm(`确认回滚到 v${version.version}？`, '回滚确认', { type: 'warning' })
    // TODO: 调用回滚API
    ElMessage.success(`已回滚到 v${version.version}`)
  } catch {}
}

async function handleDelete(templateId, version) {
  try {
    await ElMessageBox.confirm(`确认删除版本 v${version.version}？`, '删除确认', { type: 'warning' })
    // TODO: 调用删除版本API
    ElMessage.success(`已删除版本 v${version.version}`)
  } catch {}
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
