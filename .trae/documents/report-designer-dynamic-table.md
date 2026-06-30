# 报表设计器动态化改造计划

## Context

当前 `index.vue` 是 Pixso 设计工具导出的纯静态布局（3251行模板 + 9054行CSS），表格区域、右侧面板、状态栏全部硬编码，无法编辑和交互。脚本部分已有完整的 `rows`/`columnHeaders`/`selectedCell`/`editingCell` 等响应式数据和操作方法，但模板中没有使用它们。本次改造将静态HTML替换为动态Vue渲染，使表格可选中、可编辑、可交互。

## 改动文件

- `src/views/ReportDesigner/index.vue` — 所有改动集中于此

## 实施步骤

### Step 1: 替换中间表格区域（第802-2915行）

将约2113行Pixso硬编码div替换为动态`<table>`：

- 列头使用 `v-for="headerRow in headerRows"` 渲染多级表头
- 行数据使用 `v-for="(row, ri) in rows"` 渲染
- 单元格使用 `v-for="(cell, ci) in row.cells"` 渲染
- 单击选中 `@click="selectCell(ri, ci, $event)"`
- 双击编辑 `@dblclick="startEdit(ri, ci)"`
- 编辑态用 `<input>` 内联编辑，`@blur="commitEdit"`
- 行标题列支持展开/收起 `toggleRowExpand`
- 选中/范围/公式/只读等样式通过 `:class` 动态绑定

### Step 2: 改造公式栏（第247-255行）

将硬编码 `=SUM(F4:F8)` 替换为 `{{ formulaBarDisplay }}`，添加 computed：

```js
const formulaBarDisplay = computed(() => {
  if (selectedCell.row === null) return ''
  const cell = rows.value[selectedCell.row]?.cells[selectedCell.col]
  if (!cell) return ''
  if (editingCell.row !== null) return cell.value || ''
  if (cell.isFormula && cell.formula) return '=' + cell.formula
  return cell.value || ''
})
```

### Step 3: 改造状态栏（第3228-3249行）

将硬编码文本替换为动态数据：
- `statusText` ref（默认'就绪'）
- `totalCellCount = computed(() => rows.value.length * columnHeaders.value.length)`
- `zoomPercent` ref（默认100）
- `rows.length` 显示数据行数

### Step 4: 替换右侧属性面板（第2917-3227行）

将硬编码面板替换为基于 `selectedCell` 的动态面板：
- 无选中时显示模板概览（名称、行维度数、列维度数）
- 选中普通单元格时显示基础属性（数据类型、对齐、只读等）
- 选中公式单元格时显示公式属性（公式、计算结果、引用字段）

### Step 5: 添加弹窗和右键菜单模板

在 `</template>` 之前追加：
- 右键菜单（使用 `contextMenu` 状态，Teleport to body）
- 节点编辑弹窗（使用 `nodeDialog` 状态）
- 公式编辑器弹窗（使用 `FormulaEditor` 组件）
- 添加行弹窗（使用 `addRowDialog` 状态）
- 确认对话框（使用 `confirmDialog` 状态）
- Toast 提示（使用 `toast` 状态）

### Step 6: 添加CSS样式

新增约250行动态表格样式 + 约100行弹窗/Toast样式，包含：
- `.report-table-*` 表格样式系列
- `.context-menu` 右键菜单样式
- `.dialog-*` 弹窗样式
- `.toast-*` 提示样式
- `.props-*` 属性面板样式

### Step 7: 补充脚本

- 添加 `formulaBarDisplay` computed
- 添加 `statusText`, `zoomPercent`, `totalCellCount`
- 添加 `getSelectedCellFormula()`, `getSelectedCellComputedValue()`
- 修复 `cmAddRow` 调用 `showAddRowDialog()` 而非不存在的 `addRow()`
- 在 `onMounted` 添加全局点击关闭右键菜单

### Step 8: 清理无用Pixso CSS

删除被替换区域对应的Pixso自动生成样式（约4900行），涉及ID范围 `4_159` 到 `4_265`、`4_267` 到 `4_429` 等。保留顶部栏/菜单栏/工具栏的Pixso样式。

## 验证方式

1. `npm run build` 构建成功
2. 开发服务器运行后，表格区域显示动态数据（rows/columnHeaders）
3. 单击单元格可选中，双击可编辑输入
4. 公式栏显示选中单元格的值/公式
5. 右键菜单正常弹出和执行
6. 各弹窗（节点编辑/公式编辑/添加行/确认）正常弹出和提交
7. 撤销/重做/复制/粘贴/剪切等工具栏按钮功能正常
8. 状态栏显示动态数据
