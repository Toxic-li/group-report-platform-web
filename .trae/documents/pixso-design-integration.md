# Pixso 设计稿应用到可交互版本 — 实施计划

## Context

当前 `index.vue`（4154行）是可交互的报表设计器，使用自定义 SCSS 样式，功能完整但视觉设计不是最终版。用户有两份 Pixso 导出的静态设计文件（`Frame41.vue` 报表设计器、`Frame4436.vue` 公式设计器），需要将它们的完整外观应用到可交互版本上，同时保留所有交互功能。

## 核心策略

**保持交互版本的 flex 布局 + 提取 Pixso 视觉参数（颜色/字体/间距/边框/图标）**

不照搬 Pixso 的 HTML/CSS 结构（绝对定位 + stroke-wrapper 边框模式），而是将 Pixso 的视觉设计 Token 系统性应用到交互版本的 SCSS 中。

## 改动文件

- `src/views/ReportDesigner/index.vue` — 报表设计器（主要改造）
- `src/views/ReportDesigner/FormulaDesigner.vue` — 公式设计器
- `src/views/ReportDesigner/formula-designer.css` — 公式设计器样式
- 新建 `src/views/ReportDesigner/_design-tokens.scss` — 设计变量

## 实施步骤

### Step 1: 创建设计 Token 变量文件

从 Frame41.vue CSS 中提取颜色/字体/尺寸/圆角等参数，创建 `_design-tokens.scss`：
- 颜色：主色 `#1264E8`、背景 `#F5F6F8`、文字 `#1A1A2E`/`#3C3C4E`/`#6B7280`、边框 `#E4E6EB`
- 字体：`"Noto Sans SC"` 替代系统字体
- 尺寸：header 48px、菜单栏 32px、工具栏 36px、公式栏 28px、侧栏 200px、属性面板 240px、状态栏 36px
- 圆角：4px（Pixso 偏方）

### Step 2: 注册字体 + 复制图标

- 添加 `@font-face` 声明（NotoSansSC 可变字体，weight 400-600）
- 确保 `src/assets/images/designer/` 目录包含所有 Pixso SVG 图标

### Step 3: 报表设计器 index.vue — 样式刷新

在 `<style>` 中引入 `_design-tokens.scss`，逐项替换硬编码值：
- 全局字体替换为 Noto Sans SC
- 颜色替换为 Pixso 值
- 面板宽度 220px→200px、280px→240px
- 表格行高 28px、列头高 24px、行号列宽 36px
- 按钮圆角 6px→4px

### Step 4: 报表设计器 — 模板新增区域

在现有模板结构中增量添加 Pixso 设计的新区域：

**A. 菜单栏**（header 后，32px高）：
- 文件/编辑/视图/插入/页面布局/公式/数据/帮助
- 第一版仅视觉展示 + 简单下拉

**B. 工具栏**（菜单栏后，36px高）：
- 从 header 中移出编辑/格式操作按钮
- 包含：撤销/重做 | 剪切/复制/粘贴/格式刷 | 字体/字号 | B/I/U | 对齐 | 排序/筛选/查找

**C. 公式栏**（工具栏后，28px高）：
- [F9] [×] [✓] [fx] [公式输入框]
- 公式输入框绑定 `formulaBarDisplay` computed

**D. 工作表标签**（表格下方，36px高）：
- 销售汇总(激活)/产品分析/区域分析/客户分析/趋势分析 [+]
- 第一版视觉展示，后续再实现多表切换

**E. 右侧面板拆分**：
- 上部：公式工作台（200px高），含 Tab（公式编辑/公式列表/校验结果/引用搜索）
- 下部：单元格属性（剩余空间），含 Tab（基础/样式/高级）

### Step 5: 报表设计器 — 脚本补充

新增响应式数据和方法：
- `formulaBarDisplay` computed（绑定公式栏）
- `activeMenu` / 菜单交互
- `formulaWorkbenchTab` / `cellPropsTab`（右侧面板 Tab）
- 单元格样式操作（B/I/U/对齐/字体/字号）

### Step 6: 公式设计器样式刷新

更新 `formula-designer.css` 和 `FormulaDesigner.vue` scoped 样式：
- 函数分类 Tab 样式（2px 底部蓝色边框）
- 操作符按钮样式
- 搜索框样式（#F5F6F8 底色、SVG 搜索图标）
- 字段列表项（# 图标前缀）
- 语法验证/计算结果预览区域

### Step 7: 验证

1. `npm run build` 构建成功
2. 浏览器中对比 Pixso 设计稿和实际效果
3. 确认所有交互功能正常（单元格编辑、公式、撤销/重做、保存/发布）
4. 暗色模式适配

## 关键注意事项

1. **增量式改动**：不整体替换模板，在现有结构上增量添加新区域
2. **不复制 Pixso stroke-wrapper 模式**：用 CSS border 替代
3. **图标用 `<img>` 或内联 SVG**，不在 CSS 中用 background-image
4. **菜单栏/工作表标签第一版交互简化**：视觉到位，交互后续迭代
5. **公式编辑保留弹窗模式**：右侧面板的公式工作台作为简化版入口
