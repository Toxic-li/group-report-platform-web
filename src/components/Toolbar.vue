<template>
  <div class="report-toolbar">
    <!-- 左侧操作组 -->
    <div class="toolbar-group">
      <!-- 年份选择 -->
      <el-select v-model="selectedYear" size="small" style="width: 100px">
        <el-option label="2026年" value="2026" />
        <el-option label="2025年" value="2025" />
        <el-option label="2024年" value="2024" />
      </el-select>

      <div class="toolbar-divider"></div>

      <!-- 主要操作按钮 -->
      <button class="toolbar-btn toolbar-btn--ghost" @click="handleSave">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>
        保存草稿
      </button>

      <button 
        class="toolbar-btn toolbar-btn--primary" 
        @click="handleSubmit"
        :disabled="store.reportStatus.key === 'submitted' || store.reportStatus.key === 'reviewing'"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        提交上报
      </button>

      <button class="toolbar-btn toolbar-btn--success" @click="handleApprove">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
        审核
      </button>

      <button class="toolbar-btn toolbar-btn--danger" @click="handleReturn">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/></svg>
        退回修改
      </button>

      <div class="toolbar-divider"></div>

      <!-- 导出/打印 -->
      <button class="toolbar-btn toolbar-btn--ghost" @click="handleExport">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
        导出Excel
      </button>

      <button class="toolbar-btn toolbar-btn--ghost" @click="handlePrint">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
        打印
      </button>
    </div>

    <!-- 右侧视图切换 -->
    <div class="toolbar-group">
      <button 
        class="toolbar-btn" 
        :class="store.viewMode === 'single' ? 'toolbar-btn--primary' : 'toolbar-btn--ghost'"
        @click="store.switchToSingleView()"
      >
        单公司填报
      </button>
      <button 
        class="toolbar-btn" 
        :class="store.viewMode === 'group' ? 'toolbar-btn--primary' : 'toolbar-btn--ghost'"
        @click="store.switchToGroupView()"
      >
        集团汇总
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useReportStore } from '@/stores/reportStore.js'
import { ExcelService } from '@/services/templateEngine.js'
import { ElMessage, ElMessageBox } from 'element-plus'

const emit = defineEmits(['export-report'])

const store = useReportStore()
const selectedYear = ref('2026')

async function handleSave() {
  const result = await store.saveDraft()
  ElMessage.success(`${result.message} (${result.time})`)
}

async function handleSubmit() {
  try {
    await ElMessageBox.confirm(
      '确认提交当前报表？提交后将进入审核流程。',
      '确认提交',
      { confirmButtonText: '确定提交', cancelButtonText: '取消', type: 'info' }
    )
    const result = await store.submitReport()
    ElMessage.success(result.message)
  } catch {
    // 用户取消
  }
}

async function handleApprove() {
  if (store.currentSubsidiaryId) {
    store.approveReport(store.currentSubsidiaryId)
    ElMessage.success('审核通过')
  } else {
    ElMessage.warning('请先选择子公司')
  }
}

async function handleReturn() {
  if (store.currentSubsidiaryId) {
    try {
      const { value: reason } = await ElMessageBox.prompt(
        '请输入退回原因',
        '退回修改',
        { confirmButtonText: '确定退回', cancelButtonText: '取消', inputPlaceholder: '退回原因...' }
      )
      const result = store.returnReport(store.currentSubsidiaryId, reason)
      ElMessage.warning(result.message)
    } catch {
      // 取消
    }
  } else {
    ElMessage.warning('请先选择子公司')
  }
}

function handleExport() {
  // 通过 emit 事件通知父组件导出，替代 window.dispatchEvent
  emit('export-report')
  ElMessage.success('导出功能已触发')
}

function handlePrint() {
  window.print()
}
</script>
<style lang="scss" scoped>
</style>
