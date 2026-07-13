<template>
  <header class="fr-control-bar">
    <div class="fr-cb-left">
      <button class="fr-back-btn" @click="goBack" title="返回报表中心">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <span class="fr-template-badge">
        {{ currentTemplate?.name || '报表' }}
        <em v-if="currentTemplate?.version">V{{ currentTemplate.version }}</em>
        <strong v-if="useV2" class="fr-v2-badge" title="JSON驱动模板">JSON</strong>
        <strong v-if="readOnly" class="fr-ro-badge" title="只读模式">只读</strong>
      </span>

      <div class="fr-readonly-field">
        <label class="fr-readonly-label">组织：</label>
        <span class="fr-readonly-value">{{ selectedOrgName || '未选择' }}</span>
      </div>

      <div class="fr-readonly-field">
        <label class="fr-readonly-label">周期：</label>
        <span class="fr-readonly-value">{{ selectedPeriodLabel || '未选择' }}</span>
      </div>

      <span class="fr-divider"></span>

      <div class="fr-view-switch">
        <button v-for="vm in viewModes" :key="vm.key"
          :class="['fr-vs-btn', { active: viewMode === vm.key }]"
          @click="$emit('update:viewMode', vm.key)">{{ vm.label }}</button>
      </div>

      <span class="fr-divider"></span>

      <span class="fr-stat-badge">
        <b>{{ flatRowsLength }}</b> 行<em>|</em>
        <b>{{ visibleColCount }}</b> 列<em>|</em>
        <span class="fr-anomaly-count" v-if="anomalyCount > 0">{{ anomalyCount }} 项异常</span>
      </span>

      <transition name="fr-fade">
        <span v-if="saveStatus.visible" :class="['fr-save-status', 'fr-save-' + saveStatus.type]">{{ saveStatus.text }}</span>
      </transition>
    </div>

    <div class="fr-cb-right">
      <button class="fr-action-btn" @click="$emit('expandAllRows')" title="展开所有节点">全部展开</button>
      <button class="fr-action-btn" @click="$emit('collapseAllRows')" title="收起所有节点">全部收起</button>
      <span class="fr-divider"></span>
      <template v-if="!readOnly">
        <button v-for="group in metricGroups" :key="group.id"
          :class="['fr-fold-btn', { collapsed: collapsedGroups.has(group.id) }]"
          @click="$emit('toggleGroup', group.id)">
          <span class="fr-fold-icon">{{ collapsedGroups.has(group.id) ? '&#9654;' : '&#9660;' }}</span>{{ group.label }}
        </button>
        <button class="fr-action-btn" @click="$emit('expandAllGroups')">展开列</button>
        <span class="fr-divider"></span>
        <button class="fr-action-btn fr-add-row-btn" @click="$emit('addNewRow')" title="在末尾新增一行">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          新增行
        </button>
        <span class="fr-divider"></span>
        <button class="fr-action-btn fr-save-btn" @click="$emit('forceSave')" title="手动保存 (Ctrl+S)">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M13.5 2.5h-11L2 3v10l.5.5h11l.5-.5V3l-.5-.5z" stroke="currentColor" stroke-width="1.2" fill="none"/>
            <path d="M5 6h6M5 9h4" stroke="currentColor" stroke-width="1.2"/>
          </svg>
          保存
        </button>
        <button class="fr-action-btn fr-publish-btn" @click="$emit('forceSaveAndPublish')" title="发布模板">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 1l2 5h5l-4 3 1.5 5L8 11 3.5 14 5 9 1 6h5z" fill="currentColor"/>
          </svg>
          发布
        </button>
        <button class="fr-action-btn fr-submit-btn" :disabled="!selectedOrgId || !selectedPeriod" @click="$emit('submitForReview')" title="提交审核">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 2L2 7v2h12V7L8 2z" stroke="currentColor" stroke-width="1.2" fill="none"/>
            <path d="M4 11h8M5 13h6" stroke="currentColor" stroke-width="1.2"/>
          </svg>
          提交审核
        </button>
        <span class="fr-divider"></span>
      </template>
      <button class="fr-action-btn" @click="$emit('exportExcel')" title="导出Excel">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        导出Excel
      </button>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

defineProps({
  currentTemplate: { type: Object, default: null },
  useV2: { type: Boolean, default: false },
  selectedOrgName: { type: String, default: '' },
  selectedPeriodLabel: { type: String, default: '' },
  viewMode: { type: String, default: 'all' },
  viewModes: { type: Array, default: () => [] },
  flatRowsLength: { type: Number, default: 0 },
  visibleColCount: { type: Number, default: 0 },
  anomalyCount: { type: Number, default: 0 },
  saveStatus: { type: Object, default: () => ({}) },
  metricGroups: { type: Array, default: () => [] },
  collapsedGroups: { type: Object, default: () => new Set() },
  selectedOrgId: { type: String, default: '' },
  selectedPeriod: { type: String, default: '' },
  readOnly: { type: Boolean, default: false }
})

defineEmits([
  'update:viewMode', 'expandAllRows', 'collapseAllRows',
  'toggleGroup', 'expandAllGroups', 'addNewRow',
  'forceSave', 'forceSaveAndPublish', 'submitForReview', 'exportExcel'
])

function goBack() {
  router.push('/')
}
</script>
