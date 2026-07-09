<template>
  <div class="tree-node-list">
    <div
      v-for="(node, idx) in nodes"
      :key="node.id || idx"
      :class="['tree-node', { 'tn-summary': node.isSummary, 'tn-selected': selectedPath === makePath(idx) }]"
      :style="{ paddingLeft: (depth * 20 + 8) + 'px' }"
    >
      <!-- 展开/折叠 -->
      <button
        v-if="node.children?.length"
        class="tn-toggle"
        @click.stop="node.expanded = !node.expanded"
      >{{ node.expanded ? '▼' : '▶' }}</button>
      <span v-else class="tn-spacer"></span>

      <!-- 节点内容 -->
      <div class="tn-content" @click="selectedPath = makePath(idx)">
        <!-- 行模式：名称输入 -->
        <input
          v-if="labelKey === 'name'"
          v-model="node.name"
          class="tn-input tn-name"
          placeholder="节点名称"
          @blur="$emit('update', makePath(idx), { name: node.name })"
          @click.stop
        />
        <!-- 列模式：标题+类型 -->
        <template v-else>
          <input
            v-model="node.title"
            class="tn-input tn-title"
            placeholder="列标题"
            @blur="$emit('update', makePath(idx), { title: node.title })"
            @click.stop
          />
          <select
            v-if="showColOptions && !node.children?.length"
            v-model="node.type"
            class="tn-type-select"
            @change="$emit('update', makePath(idx), { type: node.type })"
            @click.stop
          >
            <option value="data">数据</option>
            <option value="formula">公式</option>
            <option value="aggregate">汇总</option>
            <option value="derived">衍生</option>
            <option value="index">索引</option>
          </select>
          <select
            v-if="showColOptions && !node.children?.length"
            v-model="node.format"
            class="tn-fmt-select"
            @change="$emit('update', makePath(idx), { format: node.format })"
            @click.stop
          >
            <option value="auto">自动</option>
            <option value="number">数值</option>
            <option value="percent">百分比</option>
            <option value="thousands">千分位</option>
            <option value="currency">金额</option>
            <option value="text">文本</option>
          </select>
        </template>

        <!-- 汇总标记（仅行模式） -->
        <span v-if="labelKey === 'name' && node.isSummary" class="tn-badge summary" title="汇总行">
          {{ summaryLabel(node.summaryType) }}
        </span>
      </div>

      <!-- 操作按钮 -->
      <div class="tn-actions">
        <!-- 汇总切换（行模式） -->
        <button
          v-if="labelKey === 'name'"
          :class="['tn-a-btn', { active: node.isSummary }]"
          title="切换汇总行"
          @click.stop="$emit('toggle-summary', makePath(idx))"
        >Σ</button>

        <!-- 上移/下移 -->
        <button
          v-if="idx > 0"
          class="tn-a-btn"
          title="上移"
          @click.stop="$emit('move-up', makePath(idx))"
        >↑</button>
        <button
          v-if="idx < nodes.length - 1"
          class="tn-a-btn"
          title="下移"
          @click.stop="$emit('move-down', makePath(idx))"
        >↓</button>

        <!-- 添加子节点 -->
        <button
          class="tn-a-btn add"
          title="添加子节点"
          @click.stop="$emit('add', makePath(idx))"
        >+</button>

        <!-- 删除 -->
        <button
          class="tn-a-btn remove"
          title="删除此节点"
          @click.stop="$emit('remove', makePath(idx))"
        >×</button>
      </div>

      <!-- 递归子节点（放在每个节点内） -->
      <div v-if="node.children?.length && node.expanded !== false" class="tn-children">
        <TreeNodeEditor
          v-for="(child, ci) in node.children"
          :key="'c_' + (node.id || idx) + '_' + ci"
          :nodes="[child]"
          :depth="depth + 1"
          :label-key="labelKey"
          :show-col-options="showColOptions"
          :parent-path="makePath(idx)"
          @add="(p) => $emit('add', [...makePath(idx), ...p])"
          @remove="(p) => $emit('remove', [...makePath(idx), ...p])"
          @update="(p, d) => $emit('update', [...makePath(idx), ...p], d)"
          @move-up="(p) => $emit('move-up', [...makePath(idx), ...p])"
          @move-down="(p) => $emit('move-down', [...makePath(idx), ...p])"
          @toggle-summary="(p) => $emit('toggle-summary', [...makePath(idx), ...p])"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  nodes: { type: Array, default: () => [] },
  depth: { type: Number, default: 0 },
  labelKey: { type: String, default: 'name' },   // 'name' for rows, 'title' for cols
  showColOptions: { type: Boolean, default: false },
  parentPath: { type: Array, default: () => [] }
})

defineEmits(['add', 'remove', 'update', 'move-up', 'move-down', 'toggle-summary'])

const selectedPath = ref('')

function makePath(idx) {
  return [...props.parentPath, idx]
}

function summaryLabel(type) {
  const map = { subtotal: '小计', total: '合计', average: '平均', group: '分组', grand: '总计' }
  return map[type] || '汇总'
}
</script>

<style lang="scss" scoped>
.tree-node-list { }

.tree-node {
  display: flex; align-items: center; gap: 4px;
  min-height: 34px; border-radius: 6px; transition: background .1s;
  &:hover { background: #F9FAFB; }
  &.tn-selected { background: #EEF2FF; }
  &.tn-summary .tn-name { font-weight: 600; color: #4338CA; }
}

.tn-toggle {
  width: 18px; height: 18px; flex-shrink: 0;
  border: none; background: none; cursor: pointer;
  font-size: 9px; color: #9CA3AF; padding: 0;
  display: flex; align-items: center; justify-content: center;
  border-radius: 3px;
  &:hover { background: #E5E7EB; color: #374151; }
}
.tn-spacer { width: 18px; flex-shrink: 0; }

.tn-content {
  display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0;
}

.tn-input {
  height: 26px; padding: 0 8px; border: 1px solid transparent; border-radius: 4px;
  font-size: 12px; outline: none; background: transparent; transition: all .12s;
  &.tn-name { font-weight: 500; min-width: 100px; }
  &.tn-title { font-weight: 500; min-width: 80px; flex: 1; }
  &:hover { border-color: #E5E7EB; background: #fff; }
  &:focus { border-color: #1677FF; background: #fff; box-shadow: 0 0 0 2px rgba(22, 119, 255,.1); }
}

.tn-type-select, .tn-fmt-select {
  height: 24px; padding: 0 4px; border: 1px solid #E5E7EB; border-radius: 4px;
  font-size: 10px; color: #6B7280; cursor: pointer; outline: none; background: #F9FAFB;
  &:focus { border-color: #1677FF; }
}

.tn-badge {
  font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 3px;
  white-space: nowrap; flex-shrink: 0;
  &.summary { background: #EEF2FF; color: #4338CA; }
}

.tn-actions {
  display: flex; gap: 2px; opacity: 0; transition: opacity .15s; flex-shrink: 0;
}
.tree-node:hover .tn-actions { opacity: 1; }

.tn-a-btn {
  width: 22px; height: 22px; border-radius: 4px; border: 1px solid transparent;
  background: none; color: #9CA3AF; cursor: pointer; font-size: 12px;
  display: flex; align-items: center; justify-content: center;
  transition: all .1s;
  &:hover { background: #F3F4F6; color: #374151; border-color: #E5E7EB; }
  &.active { background: #EEF2FF; color: #4338CA; border-color: #C7D2FE; }
  &.add:hover { background: #D1FAE5; color: #059669; }
  &.remove:hover { background: #FEE2E2; color: #DC2626; }
}

.tn-children {
  width: 100%;
}
</style>