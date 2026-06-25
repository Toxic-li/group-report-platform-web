<template>
  <div class="org-tree">
    <!-- 加载状态 -->
    <div v-if="loading" class="org-loading">
      <div class="loading-spinner"></div>
      <span>正在加载组织数据...</span>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!treeData || treeData.length === 0" class="org-empty">
      <p>暂无组织/单位数据</p>
    </div>

    <!-- 树形节点 -->
    <div v-else class="tree-container">
      <TreeNode
        v-for="node in treeData"
        :key="node.id"
        :node="node"
        :selected-id="selectedId"
        :expanded-ids="expandedIds"
        @select="handleSelect"
        @toggle="handleToggle"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import TreeNode from './TreeNode.vue'

const props = defineProps({
  treeData: {
    type: Array,
    default: () => []
  },
  selectedId: {
    type: String,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select'])

// 展开的节点ID集合
const expandedIds = ref(new Set())

// 从localStorage恢复展开状态
function restoreExpandedState() {
  try {
    const saved = localStorage.getItem('org_tree_expanded')
    if (saved) {
      expandedIds.value = new Set(JSON.parse(saved))
    }
  } catch {
    expandedIds.value = new Set()
  }
}

// 持久化展开状态
function persistExpandedState() {
  try {
    localStorage.setItem(
      'org_tree_expanded',
      JSON.stringify([...expandedIds.value])
    )
  } catch {
    // localStorage不可用时静默失败
  }
}

// 初始化时恢复状态
onMounted(() => {
  restoreExpandedState()
  
  // ✅ 默认展开第一个根节点
  if (props.treeData.length > 0 && expandedIds.value.size === 0) {
    expandedIds.value.add(props.treeData[0].id)
    persistExpandedState()
  }
})

// 监听树数据变化，自动展开第一个节点
watch(() => props.treeData, (newData) => {
  if (newData && newData.length > 0 && expandedIds.value.size === 0) {
    expandedIds.value.add(newData[0].id)
    persistExpandedState()
  }
}, { immediate: true })

// 处理节点选择
function handleSelect(nodeId) {
  emit('select', nodeId)
}

// 处理节点展开/收起
function handleToggle(nodeId) {
  if (expandedIds.value.has(nodeId)) {
    expandedIds.value.delete(nodeId)
  } else {
    expandedIds.value.add(nodeId)
  }
  persistExpandedState()
}
</script>

<style lang="scss" scoped>
.org-tree {
  height: 100%;
  overflow-y: auto;
}

.org-loading,
.org-empty {
  padding: 20px;
  text-align: center;
  color: #909399;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e4e7ed;
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.tree-container {
  padding: 8px 0;
}
</style>