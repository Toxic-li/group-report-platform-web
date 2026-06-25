# rowId 数据流分析文档

## 📋 问题分析

### 问题现象
接口返回的数据中，`rowId` 和 `columnId` 不一致：
- 前端传递：`rowId: 1000, rowCode: "ROW_0", columnId: 2002, columnCode: "COL_2"`
- 后端期望：真实的业务ID和编码（如 `rowId: 1001, rowCode: "RAW"`）

### 问题根源

#### 1. 数据结构分析

**ReportFill 页面生成的配置：**
```javascript
config.value = {
  rows: [
    {
      id: 1001,              // ✅ BIGINT - 真实业务ID（从 "r_raw" 转换）
      code: 'RAW',           // ✅ VARCHAR - 业务编码（从 "r_raw" 转换）
      name: '原煤',
      values: [
        {
          v: '100',          // 单元格值
          colIdx: 0,         // 列索引（在 row.values 数组中的位置）
          colTitle: '原煤产量', // ❌ 临时标题，不是业务编码
          formula: null
        }
      ]
    }
  ],
  
  columns: [
    { id: 0, code: 'INDEX', title: '#' },           // 第0列：索引列
    { id: 1, code: 'METRIC', title: '指标' },       // 第1列：指标列
    { id: 2001, code: 'RAW_COAL', title: '原煤产量' }, // 第2列：数据列（真实业务ID）
    { id: 2002, code: 'COMMODITY_COAL', title: '商品煤销量' } // 第3列：数据列
  ]
}
```

#### 2. 数据传递路径

```
ReportFill (updateSaveData)
  ↓
  store.setSaveData({
    rows: config.value.rows,       // ✅ 包含真实业务ID
    columns: config.value.columns, // ✅ 包含真实业务ID
    cellData: config.value.cellData
  })
  ↓
reportStore (buildCellDataDTO)
  ↓
  遍历 rows[].values[]
  ↓
  ❌ 问题：没有使用 columns 配置查找真实的列ID
  ↓
  结果：columnId = null, columnCode = "COL_2"（临时编码）
```

#### 3. 错误逻辑（修复前）

```javascript
function buildCellDataDTO(data) {
  const rows = toRaw(data?.rows || [])
  
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex]
    
    for (let colIndex = 0; colIndex < row.values.length; colIndex++) {
      const cell = row.values[colIndex]
      
      const cellDTO = new CellDataDTO({
        rowId: row.id,              // ✅ 正确：使用真实业务ID
        rowCode: row.code,          // ✅ 正确：使用真实业务编码
        
        columnId: null,             // ❌ 错误：没有使用 columns 配置
        columnCode: cell.colTitle || `COL_${colIndex}`, // ❌ 错误：使用临时编码
        
        value: cell.v
      })
    }
  }
}
```

### 修复方案

#### 修复后的逻辑

```javascript
function buildCellDataDTO(data) {
  const rows = toRaw(data?.rows || [])
  const columns = toRaw(data?.columns || [])  // ✅ 获取列配置
  
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex]
    
    for (let colIndex = 0; colIndex < row.values.length; colIndex++) {
      const cell = row.values[colIndex]
      
      // ✅ 根据 colIndex 从 columns 配置中查找真实的列ID和编码
      const actualColIndex = colIndex + 2  // 跳过前2列（# 和 指标列）
      const colConfig = columns[actualColIndex]
      
      const columnId = colConfig?.id || (2000 + colIndex + 1)      // ✅ 真实业务ID
      const columnCode = colConfig?.code || `COL_${colIndex + 1}`  // ✅ 真实业务编码
      
      const cellDTO = new CellDataDTO({
        rowId: row.id,              // ✅ BIGINT - 真实业务ID
        rowCode: row.code,          // ✅ VARCHAR - 真实业务编码
        columnId: columnId,         // ✅ BIGINT - 真实业务ID
        columnCode: columnCode,     // ✅ VARCHAR - 真实业务编码
        value: cell.v
      })
    }
  }
}
```

## 📊 数据流完整路径

### 1. 模板配置生成（buildConfigFromV2）

```javascript
// ✅ 从字符串ID生成真实业务ID和编码
function generateBusinessId(strId, prefix, index) {
  const baseId = prefix === 'row' ? 1000 : 2000
  return baseId + index + 1
}

function generateBusinessCode(strId, name) {
  let code = strId.replace(/^(r_|m_|c_|ytd_|yoy_|col_)/, '').toUpperCase()
  
  if (code.length < 2) {
    const nameMap = {
      '原煤': 'RAW_COAL',
      '商品煤': 'COMMODITY_COAL',
      '本月': 'MONTH',
      ...
    }
    code = nameMap[name] || ...
  }
  
  return code
}

// ✅ 构建行配置
const rows = flatRows.map((row, ri) => ({
  id: generateBusinessId(row.id, 'row', ri),      // ✅ 1001
  code: generateBusinessCode(row.id, row.name),   // ✅ RAW
  name: row.name,
  values: leafCols.map((col, ci) => ({
    v: '',
    colIdx: ci,
    colTitle: col.title  // ❌ 临时标题，不是业务编码
  }))
}))

// ✅ 构建列配置
const columns = [
  { id: 0, code: 'INDEX', title: '#' },
  { id: 1, code: 'METRIC', title: '指标' },
  ...leafCols.map((col, ci) => ({
    id: generateBusinessId(col.id, 'col', ci),    // ✅ 2001
    code: generateBusinessCode(col.id, col.title), // ✅ RAW_COAL
    title: col.title
  }))
]
```

### 2. 数据传递（updateSaveData）

```javascript
function updateSaveData() {
  // ✅ 直接使用已转换的配置
  const rowsWithBusinessId = config.value.rows || []
  const columnsWithBusinessId = config.value.columns || []
  
  store.setSaveData({
    rows: rowsWithBusinessId,       // ✅ 包含真实业务ID
    columns: columnsWithBusinessId, // ✅ 包含真实业务ID
    cellData: config.value.cellData
  })
}
```

### 3. 数据转换（buildCellDataDTO）

```javascript
function buildCellDataDTO(data) {
  const rows = toRaw(data?.rows || [])
  const columns = toRaw(data?.columns || [])  // ✅ 获取列配置
  
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex]
    
    for (let colIndex = 0; colIndex < row.values.length; colIndex++) {
      const cell = row.values[colIndex]
      
      // ✅ 根据 colIndex 查找列配置
      const actualColIndex = colIndex + 2
      const colConfig = columns[actualColIndex]
      
      const cellDTO = new CellDataDTO({
        rowId: row.id,              // ✅ 1001（真实业务ID）
        rowCode: row.code,          // ✅ RAW（真实业务编码）
        columnId: colConfig?.id,    // ✅ 2001（真实业务ID）
        columnCode: colConfig?.code, // ✅ RAW_COAL（真实业务编码）
        value: cell.v
      })
    }
  }
}
```

## ✅ 修复效果

### 修复前（错误）
```javascript
{
  rowId: 1000,           // ❌ 临时生成的数字
  rowCode: "ROW_0",      // ❌ 临时编码
  columnId: null,        // ❌ 缺失
  columnCode: "COL_2",   // ❌ 临时编码
  value: "22"
}
```

### 修复后（正确）
```javascript
{
  rowId: 1001,           // ✅ BIGINT - 真实业务ID（从 "r_raw" 转换）
  rowCode: "RAW",        // ✅ VARCHAR - 真实业务编码（从 "r_raw" 转换）
  columnId: 2001,        // ✅ BIGINT - 真实业务ID（从 "m_raw_coal" 转换）
  columnCode: "RAW_COAL", // ✅ VARCHAR - 真实业务编码（从 "m_raw_coal" 转换）
  value: "22",
  dataType: 2,
  source: 1
}
```

## 🔍 关键要点

1. **数据结构理解**：
   - `rows[].values[]` 中的 `colIdx` 是列索引，对应 `columns` 数组中的位置
   - 需要跳过前2列（# 和 指标列），所以 `actualColIndex = colIndex + 2`

2. **业务ID生成**：
   - 从字符串ID（如 `"r_raw"`）转换为真实业务ID（如 `1001`）
   - 从字符串ID转换为业务编码（如 `"RAW"`）

3. **数据传递**：
   - 确保 `columns` 配置被正确传递到 `buildCellDataDTO`
   - 在转换时正确使用 `columns` 配置查找真实的列ID和编码

4. **验证机制**：
   - 添加详细日志输出，便于调试
   - 验证数据完整性，确保必填字段存在

## 📚 相关文件

- [reportStore.js](file:///e:\Projects\ReportCenter\src\stores\reportStore.js#L415-L529) - buildCellDataDTO 方法
- [ReportFill/index.vue](file:///e:\Projects\ReportCenter\src\views\ReportFill\index.vue#L828-L929) - buildConfigFromV2 方法
- [ReportFill/index.vue](file:///e:\Projects\ReportCenter\src\views\ReportFill\index.vue#L1605-L1662) - updateSaveData 方法