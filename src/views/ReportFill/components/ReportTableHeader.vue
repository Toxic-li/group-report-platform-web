<template>
  <div class="fr-header-section" ref="headerRef">
    <table class="fr-table fr-header-table">
      <colgroup>
        <col class="fr-col-index" />
        <col class="fr-col-metric" />
        <col v-for="(c, i) in dataColumns" :key="'hc'+i"
          :style="{ width: colWidth(c) + 'px' }" :class="{ 'fr-col-hidden': isColHidden(i) }" />
      </colgroup>
      <thead>
        <tr v-for="(hRow, hi) in headerRows" :key="'hr'+hi" :class="'fr-hr-l' + hRow.level">
          <th v-if="hi === 0" class="fr-th fr-th-corner" :rowspan="headerRows.length || 1">
            <span>#</span>
          </th>
          <th v-if="hi === 0" class="fr-th fr-th-metric" :rowspan="headerRows.length || 1">
            <span>指标</span>
          </th>
          <template v-for="(cell, ci) in hRow.cells" :key="'hc'+hi+ci">
            <th v-show="!isColHidden(cell.colIdx)" class="fr-th" :class="'fr-th-l' + cell.level"
              :colspan="cell.colspan || 1" :rowspan="cell.rowspan || 1"
              @mouseenter="$emit('showTip', $event, cell)" @mouseleave="$emit('hideTip')">
              <span class="fr-th-text">{{ cell.text }}</span>
              <span v-if="cell.hint" class="fr-th-hint" title="点击查看指标说明">?</span>
            </th>
          </template>
        </tr>
      </thead>
    </table>
  </div>
</template>

<script setup>
defineProps({
  headerRows: { type: Array, default: () => [] },
  dataColumns: { type: Array, default: () => [] },
  isColHidden: { type: Function, required: true },
  colWidth: { type: Function, required: true }
})

defineEmits(['showTip', 'hideTip'])
</script>
