<template>
  <div class="fr-data-section">
    <table class="fr-table fr-data-table">
      <colgroup>
        <col class="fr-col-index" />
        <col class="fr-col-metric" />
        <col v-for="(c, i) in dataColumns" :key="'dc'+i"
          :style="{ width: colWidth(c) + 'px' }" :class="{ 'fr-col-hidden': isColHidden(i) }" />
      </colgroup>
      <tbody>
        <!-- 顶部占位行（维持滚动高度） -->
        <tr v-if="topSpacerHeight > 0" aria-hidden="true">
          <td :colspan="totalColspan" class="fr-spacer-td" :style="{ height: topSpacerHeight + 'px' }"></td>
        </tr>

        <!-- 虚拟窗口内的行 -->
        <template v-for="(row, vri) in virtualRows" :key="row.id || ('dr' + (startIndex + vri))">

          <!-- 子行（原内联子行改为独立行渲染，避免双重渲染） -->
          <tr v-if="row.isChild" class="fr-row fr-row-child">
            <td class="fr-td fr-td-index"></td>
            <td class="fr-td fr-td-metric">
              <div class="fr-child-item" :style="{ paddingLeft: (row.depth * 18 + 22) + 'px' }">
                <span class="fr-child-dot"></span>{{ row.name }}
              </div>
            </td>
            <td v-for="(cVal, cvi) in row.values" :key="'cv'+vri+cvi" v-show="!isColHidden(cvi)"
              class="fr-td fr-td-val fr-td-child-val">{{ fmtVal(cVal) }}</td>
          </tr>

          <!-- 汇总行 -->
          <tr v-else-if="row.isSummary" class="fr-row fr-row-summary" :data-depth="row.depth">
            <td class="fr-td fr-td-index">{{ row.displayIndex }}</td>
            <td class="fr-td fr-td-metric">
              <div class="fr-metric-cell" :style="{ paddingLeft: (row.depth * 20 + 8) + 'px' }">
                <span class="fr-summary-badge">{{ row.summaryType }}</span>
                <span class="fr-summary-label">{{ row.name }}</span>
              </div>
            </td>
            <td v-for="(val, vi) in row.values" :key="'dv'+vri+vi" v-show="!isColHidden(vi)"
              class="fr-td fr-td-val" :class="[valClass(val, row), conditionalFormatClass(val, row)]"
              :style="conditionalFormatStyle(val, row)"
              @dblclick="$emit('startEdit', val, row, vi, $event)"
              @contextmenu.prevent="$emit('openDetail', val, row, $event)">
              {{ fmtVal(val) }}
            </td>
          </tr>

          <!-- 明细数据行 -->
          <tr v-else class="fr-row fr-row-data" :class="{
            'fr-row-expanded': store.treeExpandedIds.has(row.id),
            'fr-row-anomaly': row.isAnomaly,
            'fr-row-hover': hoverId === row.id,
          }" :data-depth="row.depth" :style="{ display: row.hidden ? 'none' : '' }"
            @mouseenter="$emit('update:hoverId', row.id)" @mouseleave="$emit('update:hoverId', null)">
            <td class="fr-td fr-td-index">{{ row.displayIndex }}</td>
            <td class="fr-td fr-td-metric" @click.stop="$emit('toggleRow', row)">
              <div class="fr-tree-node" :style="{ paddingLeft: (row.depth * 18 + 4) + 'px' }">
                <span v-if="row.hasChildren" class="fr-tree-toggle"
                  :class="{ expanded: store.treeExpandedIds.has(row.id) }">&#9654;</span>
                <span v-else class="fr-tree-leaf"></span>
                <span class="fr-tree-line" v-if="row.depth > 0"></span>
                <span class="fr-tree-label" :title="row.name">{{ row.name }}</span>
              </div>
            </td>
            <td v-for="(val, vi) in row.values" :key="'dv'+vri+vi" v-show="!isColHidden(vi)"
              class="fr-td fr-td-val" :class="[valClass(val, row), isEditingCell(row, vi) ? 'fr-editing' : '', conditionalFormatClass(val, row)]"
              :style="conditionalFormatStyle(val, row)"
              :ref="el => setCellRef(el, row.id, vi)"
              @dblclick="$emit('startEdit', val, row, vi, $event)"
              @keydown="$emit('onEditKeydown', $event, val, row, vi)"
              @contextmenu.prevent="$emit('openDetail', val, row, $event)">
              <input v-if="isEditingCell(row, vi)" class="fr-edit-input"
                :value="editValue"
                :class="{ 'fr-edit-error': editError }" type="text"
                @input="$emit('update:editValue', $event.target.value)"
                @blur="$emit('commitEdit', val, row, vi, $event)"
                @keydown="$emit('onEditInputKeydown', $event, val, row, vi)" autofocus />
              <template v-else>
                {{ fmtVal(val) }}
              </template>
            </td>
          </tr>
        </template>

        <!-- 底部占位行 -->
        <tr v-if="bottomSpacerHeight > 0" aria-hidden="true">
          <td :colspan="totalColspan" class="fr-spacer-td" :style="{ height: bottomSpacerHeight + 'px' }"></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed, toRef } from 'vue'
import { useVirtualScroll } from '../composables/useVirtualScroll.js'

const props = defineProps({
  visibleRows: { type: Array, default: () => [] },
  dataColumns: { type: Array, default: () => [] },
  scrollTop: { type: Number, default: 0 },
  viewportH: { type: Number, default: 500 },
  rowHeight: { type: Number, default: 32 },
  isColHidden: { type: Function, required: true },
  colWidth: { type: Function, required: true },
  valClass: { type: Function, required: true },
  conditionalFormatClass: { type: Function, required: true },
  conditionalFormatStyle: { type: Function, required: true },
  fmtVal: { type: Function, required: true },
  isEditingCell: { type: Function, required: true },
  editValue: { type: String, default: '' },
  editError: { type: Boolean, default: false },
  hoverId: { type: [String, Number, null], default: null },
  store: { type: Object, required: true },
  setCellRef: { type: Function, default: () => {} }
})

defineEmits([
  'startEdit', 'commitEdit', 'onEditKeydown', 'onEditInputKeydown',
  'openDetail', 'toggleRow', 'update:hoverId', 'update:editValue'
])

const totalColspan = computed(() => (props.dataColumns?.length || 0) + 2)

const {
  virtualRows,
  topSpacerHeight,
  bottomSpacerHeight,
  startIndex,
} = useVirtualScroll(
  toRef(props, 'visibleRows'),
  toRef(props, 'scrollTop'),
  toRef(props, 'viewportH'),
  props.rowHeight
)
</script>
