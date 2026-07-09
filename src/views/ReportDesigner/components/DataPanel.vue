<template>
  <aside class="data-panel" :class="{ collapsed: isCollapsed }">
    <div class="panel-header">
      <div class="panel-tabs">
        <div
          class="panel-tab"
          :class="{ active: activeTab === 'data' }"
          @click="activeTab = 'data'"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
          数据
        </div>
        <div
          class="panel-tab"
          :class="{ active: activeTab === 'template' }"
          @click="activeTab = 'template'"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          模板
        </div>
      </div>
      <button class="collapse-btn" @click="isCollapsed = !isCollapsed" title="收起/展开">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path :d="isCollapsed ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'"/>
        </svg>
      </button>
    </div>

    <div class="panel-body" v-show="!isCollapsed">
      <!-- 数据 Tab -->
      <template v-if="activeTab === 'data'">
        <div class="data-source-bar">
          <select class="ds-select" v-model="selectedDs">
            <option>销售管理数据库</option>
            <option>财务数据库</option>
            <option>人力资源数据库</option>
          </select>
          <button class="ds-icon-btn" title="刷新数据源">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          </button>
          <button class="ds-icon-btn" title="数据源设置">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.67 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.67 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.67a1.65 1.65 0 0 0 1.51-1H11a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
        </div>

        <div class="search-box">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" v-model="searchKeyword" placeholder="搜索字段" />
        </div>

        <div class="tree-container">
          <el-tree
            :data="filteredTreeData"
            :props="{ label: 'label', children: 'children' }"
            node-key="key"
            default-expand-all
            highlight-current
            draggable
            @node-drag-start="handleDragStart"
          >
            <template #default="{ node, data }">
              <div class="tree-node" :class="data.type">
                <span class="tree-icon">
                  <template v-if="data.type === 'field'">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1677ff" stroke-width="2"><circle cx="12" cy="12" r="4"/></svg>
                  </template>
                  <template v-else-if="data.type === 'metric'">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#52c41a" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg>
                  </template>
                  <template v-else-if="data.type === 'param'">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#faad14" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  </template>
                  <template v-else-if="data.type === 'calc'">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#722ed1" stroke-width="2"><rect x="4" y="5" width="16" height="16" rx="2"/><line x1="16" y1="3" x2="16" y2="21"/><line x1="8" y1="3" x2="8" y2="21"/><line x1="4" y1="8" x2="20" y2="8"/><line x1="4" y1="16" x2="20" y2="16"/></svg>
                  </template>
                  <template v-else>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                  </template>
                </span>
                <span class="tree-label">{{ node.label }}</span>
              </div>
            </template>
          </el-tree>
        </div>

        <div class="panel-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          将字段拖拽到设计区进行布局
        </div>
      </template>

      <!-- 模板 Tab -->
      <template v-if="activeTab === 'template'">
        <div class="template-list">
          <div class="template-category">
            <div class="template-category-title">常用模板</div>
            <div class="template-item" v-for="t in commonTemplates" :key="t.id">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1677ff" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              <span>{{ t.name }}</span>
            </div>
          </div>
          <div class="template-category">
            <div class="template-category-title">我的模板</div>
            <div class="template-item" v-for="t in myTemplates" :key="t.id">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              <span>{{ t.name }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDesigner } from '../composables/useDesigner.js'

const { dataSourceTree } = useDesigner()

const isCollapsed = ref(false)
const activeTab = ref('data')
const selectedDs = ref('销售管理数据库')
const searchKeyword = ref('')

const commonTemplates = [
  { id: 1, name: '销售业绩分析报表' },
  { id: 2, name: '财务报表' },
  { id: 3, name: '人力资源统计' },
  { id: 4, name: '库存盘点表' },
]

const myTemplates = [
  { id: 5, name: '月度销售汇总' },
  { id: 6, name: '季度经营分析' },
]

const filteredTreeData = computed(() => {
  if (!searchKeyword.value) return dataSourceTree.value
  const kw = searchKeyword.value.toLowerCase()
  function filter(nodes) {
    return nodes.filter(node => {
      const match = node.label.toLowerCase().includes(kw)
      if (node.children) {
        const childMatch = filter(node.children)
        if (childMatch.length > 0) {
          return { ...node, children: childMatch }
        }
      }
      return match
    })
  }
  return filter(JSON.parse(JSON.stringify(dataSourceTree.value)))
})

function handleDragStart(node) {
  // 拖拽数据传递
  node.data.dragInfo = {
    label: node.data.label,
    key: node.data.key,
    type: node.data.type || 'field'
  }
}
</script>

<style scoped>
.data-panel {
  width: 280px;
  min-width: 280px;
  background: #fff;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  transition: width 0.3s;
  flex-shrink: 0;
}
.data-panel.collapsed {
  width: 40px;
  min-width: 40px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e8e8e8;
  padding: 0 8px;
  height: 40px;
  flex-shrink: 0;
}

.panel-tabs {
  display: flex;
  gap: 2px;
  flex: 1;
}

.panel-tab {
  padding: 0 12px;
  height: 32px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  user-select: none;
}
.panel-tab:hover { background: #f5f5f5; }
.panel-tab.active {
  background: #e6f0ff;
  color: #1677ff;
  font-weight: 500;
}

.collapse-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}
.collapse-btn:hover { background: #f5f5f5; color: #666; }

.panel-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.data-source-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.ds-select {
  flex: 1;
  height: 28px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 12px;
  padding: 0 6px;
  background: #fff;
  color: #333;
  outline: none;
}
.ds-select:focus { border-color: #1677ff; }

.ds-icon-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}
.ds-icon-btn:hover { background: #f5f5f5; color: #666; }

.search-box {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.search-box svg { color: #999; flex-shrink: 0; }
.search-box input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 12px;
  background: transparent;
  color: #333;
}
.search-box input::placeholder { color: #bfbfbf; }

.tree-container {
  flex: 1;
  overflow: auto;
  padding: 4px 0;
}

:deep(.el-tree) { background: transparent; }
:deep(.el-tree-node__content) { height: 28px; padding: 0 8px !important; }
:deep(.el-tree-node__content:hover) { background: #f5f7ff; }
:deep(.el-tree-node.is-current > .el-tree-node__content) { background: #e6f0ff; color: #1677ff; }
:deep(.el-tree-node__label) { font-size: 13px; }

.tree-node {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}
.tree-node .tree-icon { display: flex; align-items: center; }
.tree-node .tree-label { color: #333; }
.tree-node.field .tree-label { color: #1677ff; }
.tree-node.metric .tree-label { color: #52c41a; }
.tree-node.param .tree-label { color: #faad14; }
.tree-node.calc .tree-label { color: #722ed1; }

.panel-hint {
  padding: 8px 12px;
  font-size: 11px;
  color: #999;
  background: #fafbfc;
  border-top: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.template-list {
  flex: 1;
  overflow: auto;
  padding: 8px;
}

.template-category { margin-bottom: 16px; }
.template-category-title {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  padding: 4px 8px;
  margin-bottom: 4px;
}

.template-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: #333;
  transition: background 0.15s;
}
.template-item:hover { background: #f5f7ff; }
.template-item svg { flex-shrink: 0; }

.data-panel.collapsed .panel-body,
.data-panel.collapsed .panel-tabs { display: none; }
.data-panel.collapsed .panel-header { justify-content: center; }
</style>
