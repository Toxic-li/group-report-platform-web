# Formula Engine - 企业级公式引擎

## 概述

Formula Engine是一个企业级的公式计算引擎，对标FineReport、Power BI Measure、SmartBI的公式体系。采用四层架构设计：

```
Formula Designer UI (用户界面)
         ↓
Formula Editor (Monaco编辑器)
         ↓
Formula Service (业务逻辑层)
         ↓
Formula Engine (核心引擎层)
```

## 核心特性

### 1. Formula DSL（公式语言）

支持友好名称显示，内部编码保存：

```javascript
// 编辑器显示
([营业收入] - [营业成本]) / [营业收入] * 100

// 内部保存
(${revenue} - ${cost}) / ${revenue} * 100
```

### 2. 完整的解析流程

```
公式字符串 → Lexer(词法分析) → Token流 → Parser(语法解析) → AST(抽象语法树) → Validator(校验) → Evaluator(计算) → 结果
```

### 3. 强大的函数库

**50+内置函数**，涵盖：

- **数学函数**：SUM, AVG, MAX, MIN, COUNT, ROUND, ABS, POWER, SQRT, MOD, CEIL, FLOOR
- **逻辑函数**：IF, IFS, AND, OR, NOT, ISNULL, NVL, COALESCE
- **文本函数**：LEFT, RIGHT, MID, LEN, TRIM, UPPER, LOWER, CONCAT, REPLACE
- **日期函数**：TODAY, NOW, YEAR, MONTH, DAY, DATEADD, DATEDIFF
- **时间分析**：YOY(同比), MOM(环比), YTD(年初至今), QTD, MTD
- **业务函数**：RATE(比率), PERCENT(占比), COMPLETE_RATE(完成率), PROFIT_RATE(利润率)
- **窗口函数**：RANK, ROW_NUMBER, LAG, LEAD, RUNNING_SUM, MOVING_AVG

### 4. 智能校验

- 括号匹配检查
- 未定义变量/函数检测
- 参数数量校验
- 类型匹配检查
- 循环依赖检测
- 除零风险警告
- 空值风险提示

### 5. DAG依赖管理

- 自动构建依赖图
- 拓扑排序确定计算顺序
- 循环依赖检测和告警
- 影响分析（修改某公式会影响哪些公式）
- 依赖树可视化

### 6. 调试模式

支持调试日志，记录计算过程：

```javascript
engine.setDebugMode(true)
const result = engine.evaluate('([营业收入] - [营业成本]) / [营业收入] * 100')
console.log(result.metadata.debugLog)
```

## 使用示例

### 基础用法

```javascript
import { createFormulaEngine, FormulaDefinition, IndicatorDefinition } from '@/services/formula/core'

// 创建公式引擎
const engine = createFormulaEngine()

// 注册指标
engine.registerIndicators([
  new IndicatorDefinition({
    id: 'revenue',
    code: 'revenue',
    name: '营业收入',
    type: 'number',
    category: 'basic'
  }),
  new IndicatorDefinition({
    id: 'cost',
    code: 'cost',
    name: '营业成本',
    type: 'number',
    category: 'basic'
  })
])

// 注册变量
engine.registerVariables([
  { name: '$CurrentYear', type: 'number', value: 2026 },
  { name: '$CurrentMonth', type: 'number', value: 6 }
])

// 编译公式
const compiled = engine.compile('([营业收入] - [营业成本]) / [营业收入] * 100')

if (compiled.success) {
  console.log('AST:', compiled.ast)
  console.log('依赖:', compiled.dependencies) // ['revenue', 'cost']
  
  // 计算公式
  const context = {
    indicators: {
      '营业收入': 1000,
      '营业成本': 800
    }
  }
  
  const result = engine.evaluate(compiled.ast, context)
  console.log('计算结果:', result.value) // 20
}
```

### 公式定义

```javascript
// 创建公式定义
const profitRate = new FormulaDefinition({
  id: 'profit_rate',
  name: '利润率',
  code: 'profitRate',
  category: 'business',
  expression: '([营业收入] - [营业成本]) / [营业收入] * 100',
  internalExpression: '(${revenue} - ${cost}) / ${revenue} * 100',
  resultType: 'number',
  displayFormat: '0.00%',
  precision: 2,
  dependencies: ['revenue', 'cost']
})

engine.registerFormula(profitRate)

// 分析依赖
const analysis = engine.analyzeDependencies('profit_rate')
console.log('依赖树:', analysis.graph.getDependencyTree('profit_rate'))
```

### 函数调用

```javascript
// SUM函数
const result1 = engine.evaluate('SUM([营业收入], [营业成本], [其他收入])', {
  indicators: {
    '营业收入': 1000,
    '营业成本': 800,
    '其他收入': 200
  }
})
console.log(result1.value) // 2000

// IF条件函数
const result2 = engine.evaluate('IF([收入] > 1000, "优秀", "良好")', {
  indicators: { '收入': 1500 }
})
console.log(result2.value) // "优秀"

// YOY同比增长函数
const result3 = engine.evaluate('YOY([本期收入], [去年同期收入])', {
  indicators: {
    '本期收入': 1200,
    '去年同期收入': 1000
  }
})
console.log(result3.value) // 20 (增长20%)
```

### 自定义函数

```javascript
// 注册自定义函数
engine.registerFunction({
  name: 'MY_CUSTOM',
  category: 'custom',
  description: '我的自定义函数',
  signature: 'MY_CUSTOM(value1, value2)',
  params: [
    { name: 'value1', type: 'number', description: '第一个值', required: true },
    { name: 'value2', type: 'number', description: '第二个值', required: true }
  ],
  minArgs: 2,
  maxArgs: 2,
  returnType: 'number',
  examples: ['MY_CUSTOM(10, 20)'],
  compute: (ctx, args) => {
    const val1 = Number(args[0]) || 0
    const val2 = Number(args[1]) || 0
    return val1 * val2 + 100
  }
})

// 使用自定义函数
const result = engine.evaluate('MY_CUSTOM([收入], [成本])', {
  indicators: { '收入': 10, '成本': 20 }
})
console.log(result.value) // 300 (10*20+100)
```

### 依赖分析

```javascript
// 注册多个公式
engine.registerFormulas([
  { id: 'profit', name: '利润', dependencies: ['revenue', 'cost'], expression: '[营业收入] - [营业成本]' },
  { id: 'profit_rate', name: '利润率', dependencies: ['profit', 'revenue'], expression: '[利润] / [营业收入] * 100' },
  { id: 'rank', name: '排名', dependencies: ['profit_rate'], expression: 'RANK([利润率], {所有利润率})' }
])

// 分析依赖关系
const analysis = engine.analyzeDependencies()

console.log('是否有循环依赖:', analysis.hasCycles)
console.log('计算顺序:', analysis.calculationOrder) // ['revenue', 'cost', 'profit', 'profit_rate', 'rank']

// 获取单个公式的依赖树
const tree = analysis.graph.getDependencyTree('profit_rate')
console.log('依赖树:', JSON.stringify(tree, null, 2))

// 输出:
{
  "id": "profit_rate",
  "name": "利润率",
  "depth": 0,
  "children": [
    {
      "id": "profit",
      "name": "利润",
      "depth": 1,
      "children": [
        { "id": "revenue", "name": "营业收入", "depth": 2, "children": [] },
        { "id": "cost", "name": "营业成本", "depth": 2, "children": [] }
      ]
    },
    { "id": "revenue", "name": "营业收入", "depth": 1, "children": [] }
  ]
}

// 影响分析：修改"营业收入"会影响哪些公式
const impact = analysis.graph.analyzeImpact('revenue')
console.log('影响范围:', impact.allDependents) // ['profit', 'profit_rate']
```

## 架构详解

### 核心模块

| 模块 | 职责 | 文件 |
|------|------|------|
| **FormulaTypes** | 类型定义 | `core/FormulaTypes.js` |
| **FormulaAST** | AST节点定义和访问者模式 | `core/FormulaAST.js` |
| **FormulaLexer** | 词法分析器 | `core/FormulaLexer.js` |
| **FormulaParser** | 语法解析器 | `core/FormulaParser.js` |
| **FormulaValidator** | 语义校验器 | `core/FormulaValidator.js` |
| **FormulaEvaluator** | 计算引擎 | `core/FormulaEvaluator.js` |
| **FunctionRegistry** | 函数注册中心 | `core/FunctionRegistry.js` |
| **DependencyGraph** | 依赖图和拓扑排序 | `core/DependencyGraph.js` |

### Token类型

支持以下Token类型：

- **字面量**：NUMBER, STRING, BOOLEAN
- **标识符**：IDENTIFIER（指标引用），VARIABLE（变量），CELL_REF（单元格引用）
- **运算符**：+, -, *, /, ^, %, =, !=, <, >, <=, >=
- **逻辑运算符**：AND, OR, NOT
- **括号**：(, ), [, ], {, }
- **分隔符**：逗号, 冒号, 分号
- **函数**：FUNCTION

### AST节点类型

支持以下AST节点：

- **字面量**：NumberLiteral, StringLiteral, BooleanLiteral
- **引用**：Identifier, Variable, CellReference
- **表达式**：BinaryExpression, UnaryExpression, ConditionalExpression
- **函数**：FunctionCall
- **数组**：ArrayExpression, RangeExpression
- **程序**：Program

## 性能优化

### 1. 缓存机制

```javascript
// 自动缓存指标值，避免重复计算
engine.evaluate('[营业收入] * 2')
engine.evaluate('[营业收入] / 3') // 使用缓存
```

### 2. 拓扑排序

根据依赖关系自动确定计算顺序，避免重复计算。

### 3. 懒加载

Monaco Editor按需加载，减少首屏体积。

## 与现有系统集成

### 替换旧的FormulaEngine

```javascript
// 旧的方式
import { FormulaEngine } from '@/services/engines/FormulaEngine.js'
const oldEngine = new FormulaEngine({ cellData })

// 新的方式
import { createFormulaEngine } from '@/services/formula/core'
const newEngine = createFormulaEngine()
newEngine.registerIndicators([...])
const result = newEngine.evaluate(formula, { cellData })
```

### 指标映射

将现有`row_xxxxxx`编码映射为友好名称：

```javascript
const indicators = [
  {
    id: 'row_mqyjhcik',
    code: 'revenue',
    name: '营业收入',
    internalCode: 'row_mqyjhcik',
    type: 'number'
  }
]

engine.registerIndicators(indicators)

// 编辑器显示：[营业收入]
// 内部保存：${revenue}
// 计算时映射：row_mqyjhcik
```

## 后续开发计划

### 第二阶段：Formula Service层
- FormulaService：统一业务逻辑API
- IndicatorService：指标管理服务
- FormulaHistory：版本管理服务

### 第三阶段：Monaco Editor集成
- FormulaLanguage：自定义语言定义
- CompletionProvider：智能补全
- HoverProvider：Hover提示
- DiagnosticsProvider：错误提示
- SignatureHelpProvider：参数提示

### 第四阶段：Formula Designer UI
- 三栏布局：指标树 + Monaco编辑器 + 函数中心
- 公式模板和向导
- 模拟计算和调试器
- 依赖分析可视化

## 技术亮点

1. **企业级架构**：四层分离，职责清晰
2. **DSL设计**：友好名称 + 内部编码
3. **完整的编译流程**：Lexer → Parser → AST → Validator → Evaluator
4. **强大的函数库**：50+内置函数，支持自定义扩展
5. **智能校验**：7种校验类型，详细错误提示
6. **DAG依赖管理**：自动拓扑排序，循环检测
7. **调试支持**：计算过程可视化
8. **高性能**：缓存机制 + 拓扑排序优化

---

**Formula Engine已完成核心构建，可以支撑企业级BI报表平台的公式计算需求！**