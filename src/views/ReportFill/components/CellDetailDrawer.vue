<template>
  <Teleport to="body">
    <Transition name="fr-drawer">
      <div v-if="visible" class="fr-drawer-mask" @click.self="$emit('close')">
        <aside class="fr-drawer">
          <header class="fr-drawer-hd">
            <h3>单元格详情</h3>
            <button class="fr-drawer-close" @click="$emit('close')">&times;</button>
          </header>
          <div class="fr-drawer-bd">
            <section class="fr-ds-section">
              <h4>基本信息</h4>
              <div class="fr-ds-grid">
                <div class="fr-ds-field"><label>指标名称</label><span>{{ drawer.metric }}</span></div>
                <div class="fr-ds-field"><label>当前值</label><span :class="drawer.valClass">{{ drawer.displayValue }}</span></div>
                <div class="fr-ds-field"><label>原始值</label><span>{{ drawer.rawValue }}</span></div>
                <div class="fr-ds-field"><label>模板ID</label><span>{{ drawer.templateId || '-' }}</span></div>
              </div>
            </section>
            <section class="fr-ds-section">
              <h4>计算信息</h4>
              <div class="fr-ds-grid">
                <div class="fr-ds-field">
                  <label>计算公式</label>
                  <code>{{ drawer.formula || '-' }}</code>
                  <button v-if="drawer._canEditFormula" class="fr-drawer-action" @click="$emit('editFormula')">编辑公式</button>
                </div>
                <div class="fr-ds-field"><label>数据来源</label><span>{{ drawer.source || '-' }}</span></div>
                <div class="fr-ds-field"><label>校验结果</label><span :class="drawer.validationOk ? 'fr-up' : 'fr-down'">{{ drawer.validationMsg || '-' }}</span></div>
              </div>
            </section>
            <section v-if="drawer.history?.length" class="fr-ds-section">
              <h4>历史对比</h4>
              <div class="fr-history-list">
                <div v-for="h in drawer.history" :key="h.period" class="fr-hist-item">
                  <span class="fr-hist-period">{{ h.period }}</span>
                  <span :class="['fr-hist-val', h.trend]">{{ h.value }}</span>
                  <span v-if="h.diff !== undefined && h.diff !== null" :class="['fr-hist-diff', h.diff >= 0 ? 'up' : 'down']">
                    {{ h.diff >= 0 ? '+' : '' }}{{ h.diff.toFixed(2) }}%
                  </span>
                </div>
              </div>
            </section>
            <section v-if="drawer.anomaly" class="fr-ds-section fr-ds-warn">
              <h4>异常警告</h4>
              <p>{{ drawer.anomalyMsg }}</p>
            </section>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  drawer: { type: Object, default: () => ({}) }
})

defineEmits(['close', 'editFormula'])
</script>
