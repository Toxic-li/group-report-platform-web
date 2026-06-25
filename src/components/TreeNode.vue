<template>
  <div class="tree-node" :class="{ 'is-selected': selectedId === node.id }">
    <!-- 节点内容 -->
    <div class="node-content" @click="handleSelect">
      <!-- 展开/收起按钮 -->
      <span 
        v-if="hasChildren" 
        class="expand-icon"
        @click.stop="handleToggle"
      >
        {{ isExpanded ? '▼' : '▶' }}
      </span>
      <span v-else class="expand-placeholder"></span>

      <!-- 组织图标 -->
      <span class="org-icon">{{ orgIcon }}</span>

      <!-- 组织名称 -->
      <span class="org-name">{{ node.name }}</span>

      <!-- 组织类型标签 -->
      <span v-if="node.orgTypeName" class="org-type-tag">{{ node.orgTypeName }}</span>
    </div>

    <!-- 子节点 -->
    <div v-if="hasChildren && isExpanded" class="children-container">
      <TreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :selected-id="selectedId"
        :expanded-ids="expandedIds"
        @select="emitSelect"
        @toggle="emitToggle"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  selectedId: {
    type: String,
    default: null
  },
  expandedIds: {
    type: Set,
    default: () => new Set()
  }
})

const emit = defineEmits(['select', 'toggle'])

// 是否有子节点
const hasChildren = computed(() => {
  return props.node.children && props.node.children.length > 0
})

// 是否展开
const isExpanded = computed(() => {
  return props.expandedIds.has(props.node.id)
})

// 组织图标（根据类型）
const orgIcon = computed(() => {
  const typeMap = {
    1: '🏢',  // 集团
    2: '🏭',  // 子公司
    3: '📁',  // 部门
    4: '👥'   // 班组
  }
  return typeMap[props.node.orgType] || '🏢'
})

// 处理选择
function handleSelect() {
  emit('select', props.node.id)
}

// 处理展开/收起
function handleToggle() {
  emit('toggle', props.node.id)
}

// 向上传递事件
function emitSelect(nodeId) {
  emit('select', nodeId)
}

function emitToggle(nodeId) {
  emit('toggle', nodeId)
}
</script>

<style lang="scss" scoped>
.tree-node {
  margin: 2px 0;

  &.is-selected {
    .node-content {
      background: #e6f7ff;
      border-color: #1890ff;
    }
  }
}

.node-content {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;

  &:hover {
    background: #f5f7fa;
  }
}

.expand-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #909399;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    color: #606266;
  }
}

.expand-placeholder {
  width: 16px;
  height: 16px;
}

.org-icon {
  margin-right: 6px;
  font-size: 14px;
}

.org-name {
  flex: 1;
  font-size: 13px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.org-type-tag {
  margin-left: 8px;
  padding: 2px 6px;
  font-size: 11px;
  color: #909399;
  background: #f4f4f5;
  border-radius: 3px;
}

.children-container {
  margin-left: 20px;
  padding-left: 8px;
  border-left: 1px dashed #dcdfe6;
}
</style>