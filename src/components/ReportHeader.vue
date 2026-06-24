<template>
  <div class="report-info-bar">
    <!-- 左侧信息 -->
    <div class="info-item unit-selector">
      <span class="info-label">填报单位：</span>
      <el-select
        v-model="store.currentSubsidiaryId"
        placeholder="请选择单位"
        size="small"
        style="width: 200px"
        @change="handleUnitChange"
      >
        <el-option-group
          v-for="group in groupedSubsidiaries"
          :key="group.label"
          :label="group.label"
        >
          <el-option
            v-for="sub in group.options"
            :key="sub.id"
            :label="sub.name"
            :value="sub.id"
          >
            <span>{{ sub.name }}</span>
            <el-tag size="small" :type="getStatusType(sub.status)" style="margin-left: 8px">
              {{ getStatusLabel(sub.status) }}
            </el-tag>
          </el-option>
        </el-option-group>
      </el-select>
    </div>

    <!-- 中间报表名称 -->
    <div class="report-name-display">
      {{ store.activeTemplate?.name || '煤炭生产销售与库存统计表' }}
      <span class="period-tag">{{ store.activeTemplate?.period || '2026年第5期' }}</span>
    </div>

    <!-- 右侧状态 -->
    <div class="info-item">
      <span class="info-label">状态：</span>
      <span :class="['status-badge', `status-badge--${store.reportStatus.key}`]">
        {{ store.reportStatus.label }}
      </span>
    </div>

    <div class="info-item" v-if="store.lastSavedTime">
      <span class="info-label">保存于：</span>
      <span class="info-value">{{ store.lastSavedTime }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useReportStore } from '@/stores/reportStore.js'
import { ElMessage } from 'element-plus'

const store = useReportStore()

/** 按区域分组子公司 */
const groupedSubsidiaries = computed(() => {
  const groups = {}
  for (const sub of store.subsidiaries) {
    const region = sub.region || '其他'
    if (!groups[region]) {
      groups[region] = { label: region, options: [] }
    }
    groups[region].options.push(sub)
  }
  return Object.values(groups)
})

function handleUnitChange(subId) {
  store.selectSubsidiary(subId)
  ElMessage.success(`已切换至 ${store.currentSubsidiary?.name}`)
}

function getStatusType(status) {
  const map = {
    draft: 'warning',
    submitted: '',
    reviewing: 'primary',
    returned: 'danger',
    approved: 'success'
  }
  return map[status] || 'info'
}

function getStatusLabel(status) {
  const map = {
    draft: '草稿',
    submitted: '已提交',
    reviewing: '审核中',
    returned: '已退回',
    approved: '已通过'
  }
  return map[status] || status
}
</script>

<style lang="scss" scoped>
.period-tag {
  font-size: 12px;
  color: #999;
  margin-left: 12px;
  font-weight: normal;
}
</style>
