<template>
  <el-dialog v-model="visible" title="插入函数" width="640px" destroy-on-close append-to-body>
    <div class="fpd-body">
      <!-- 搜索框 -->
      <div class="fpd-search">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索函数名称或描述..."
          clearable
          prefix-icon="Search"
          size="small"
        />
      </div>

      <!-- 分类标签 -->
      <div class="fpd-categories">
        <button
          v-for="cat in categories"
          :key="cat.key"
          :class="['fpd-cat-btn', { active: activeCategory === cat.key }]"
          @click="activeCategory = cat.key"
        >
          {{ cat.name }}
        </button>
      </div>

      <!-- 函数列表 -->
      <div class="fpd-list">
        <div
          v-for="func in filteredFunctions"
          :key="func.name"
          :class="['fpd-item', { selected: selectedFunc?.name === func.name }]"
          @click="selectedFunc = func"
          @dblclick="confirmInsert(func)"
        >
          <span class="fpd-item-icon">{{ getCategoryIcon(func.category) }}</span>
          <div class="fpd-item-info">
            <span class="fpd-item-name">{{ func.name }}</span>
            <span class="fpd-item-desc">{{ func.description || '' }}</span>
          </div>
        </div>
        <div v-if="filteredFunctions.length === 0" class="fpd-empty">
          未找到匹配的函数
        </div>
      </div>

      <!-- 函数详情 -->
      <div v-if="selectedFunc" class="fpd-detail">
        <div class="fpd-detail-header">
          <span class="fpd-detail-name">{{ selectedFunc.name }}</span>
          <span class="fpd-detail-category">{{ getCategoryName(selectedFunc.category) }}</span>
        </div>
        <div class="fpd-detail-desc">{{ selectedFunc.description }}</div>
        <div class="fpd-detail-syntax">
          <span class="fpd-syntax-label">语法：</span>
          <code>{{ selectedFunc.signature || selectedFunc.name + '(' + (selectedFunc.params?.map(p => p.name).join(', ') || '') + ')' }}</code>
        </div>
        <div v-if="selectedFunc.examples?.length" class="fpd-detail-examples">
          <span class="fpd-examples-label">示例：</span>
          <code v-for="(ex, i) in selectedFunc.examples" :key="i" class="fpd-example-code">{{ ex }}</code>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :disabled="!selectedFunc" @click="confirmInsert(selectedFunc)">
        插入函数
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { createFormulaService } from '@/services/formula'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'select'])

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const searchKeyword = ref('')
const activeCategory = ref('all')
const selectedFunc = ref(null)

// 获取函数列表
const formulaService = createFormulaService()
const allFunctions = formulaService.getAllFunctions()

const categories = [
  { key: 'all', name: '全部' },
  { key: 'aggregate', name: '统计' },
  { key: 'basic', name: '数学' },
  { key: 'conditional', name: '逻辑' },
  { key: 'text', name: '文本' },
  { key: 'date', name: '日期' },
  { key: 'business', name: '业务' },
]

const categoryNames = {
  aggregate: '统计函数',
  basic: '数学函数',
  conditional: '逻辑函数',
  text: '文本函数',
  date: '日期函数',
  business: '业务函数',
  time_analysis: '时间分析',
  window: '窗口函数',
}

function getCategoryName(cat) {
  return categoryNames[cat] || cat
}

function getCategoryIcon(cat) {
  const icons = {
    aggregate: '📊',
    basic: '🧮',
    conditional: '🔀',
    text: '📝',
    date: '📅',
    business: '💼',
    time_analysis: '⏰',
    window: '🔍',
  }
  return icons[cat] || '📋'
}

const filteredFunctions = computed(() => {
  let list = allFunctions

  if (activeCategory.value !== 'all') {
    list = list.filter(f => f.category === activeCategory.value)
  }

  const kw = searchKeyword.value.toLowerCase().trim()
  if (kw) {
    list = list.filter(f =>
      f.name.toLowerCase().includes(kw) ||
      (f.description || '').toLowerCase().includes(kw)
    )
  }

  return list
})

// 重置选中状态当弹窗打开时
watch(visible, (v) => {
  if (v) {
    selectedFunc.value = null
    searchKeyword.value = ''
    activeCategory.value = 'all'
  }
})

function confirmInsert(func) {
  if (!func) return
  const signature = func.signature || func.name
  emit('select', func)
  visible.value = false
}
</script>

<style scoped>
.fpd-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fpd-search {
  flex-shrink: 0;
}

.fpd-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex-shrink: 0;
}

.fpd-cat-btn {
  padding: 4px 12px;
  font-size: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 14px;
  background: #fff;
  color: #666;
  cursor: pointer;
  transition: all 0.15s;
}

.fpd-cat-btn:hover {
  border-color: #1677ff;
  color: #1677ff;
}

.fpd-cat-btn.active {
  background: #1677ff;
  border-color: #1677ff;
  color: #fff;
}

.fpd-list {
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
}

.fpd-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.12s;
  border-bottom: 1px solid #f5f5f5;
}

.fpd-item:last-child {
  border-bottom: none;
}

.fpd-item:hover {
  background: #f0f7ff;
}

.fpd-item.selected {
  background: #e6f0ff;
}

.fpd-item-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.fpd-item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.fpd-item-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
}

.fpd-item-desc {
  font-size: 11px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fpd-empty {
  padding: 24px;
  text-align: center;
  color: #bfbfbf;
  font-size: 13px;
}

.fpd-detail {
  background: #f8f9fa;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 12px 16px;
}

.fpd-detail-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.fpd-detail-name {
  font-size: 15px;
  font-weight: 700;
  color: #1677ff;
  font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
}

.fpd-detail-category {
  font-size: 11px;
  color: #999;
  background: #f0f0f0;
  padding: 1px 8px;
  border-radius: 8px;
}

.fpd-detail-desc {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.fpd-detail-syntax {
  font-size: 12px;
  margin-bottom: 6px;
}

.fpd-syntax-label {
  color: #999;
}

.fpd-detail-syntax code {
  font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
  color: #333;
  background: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #eee;
}

.fpd-detail-examples {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.fpd-examples-label {
  font-size: 12px;
  color: #999;
}

.fpd-example-code {
  font-family: 'JetBrains Mono', 'Roboto Mono', monospace;
  font-size: 11px;
  color: #1677ff;
  background: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #d6e4ff;
}
</style>
