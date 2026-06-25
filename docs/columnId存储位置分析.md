# columnId 存储位置和数据流分析

## 📋 columnId 存储位置

### 1. 在 buildCellDataDTO 方法中

**columnId 存储在 `data.columns` 数组中：**

```javascript
function buildCellDataDTO(data) {
  const columns = toRaw(data?.columns || [])  // ✅ 从 data.columns 获取列配置
  
  for (let colIndex = 0; colIndex < row.values.length; colIndex++) {
    // ✅ 根据 colIndex 从 columns 配置中查找真实的列ID和编码
    const actualColIndex = colIndex + 2  // 跳过前2列（# 和 指标列）
    const colConfig = columns[actualColIndex]  // ✅ 获取列配置
    
    const columnId = colConfig?.id  // ✅ 从列配置中获取真实的业务ID
    const columnCode = colConfig?.code  // ✅ 从列配置中获取真实的业务编码
    
    const cellDTO = new CellDataDTO({
      columnId: columnId,         // ✅ BIGINT - 列结构ID（真实业务ID）
      columnCode: columnCode,     // ✅ VARCHAR - 列编码（真实业务编码）
      ...
    })
  }
}
```

### 2. columns 数组结构

**columns 数组包含所有列的配置（包括真实业务ID）：**

```javascript
columns = [
  { id: 0, code: 'INDEX', title: '#', width: 50, type: 'index', fixed: true },      // 第0列：索引列
  { id: 1, code: 'METRIC', title: '指标', width: 150, type: 'metric', fixed: true }, // 第1列：指标列
  { id: 2001, code: 'RAW_COAL', title: '原煤产量', width: 100, ... },               // 第2列：数据列（真实业务ID）
  { id: 2002, code: 'COMMODITY_COAL', title: '商品煤销量', width: 100, ... },       // 第3列：数据列
  { id: 2003, code: 'SELF_USE', title: '自用量', width: 100, ... },                 // 第4列：数据列
  ...
]
```

**关键点：**
- `columns[0]` 和 `columns[1]` 是固定列（索引列和指标列），ID为 0 和 1
- `columns[2]` 及之后是数据列，包含真实的业务ID（如 2001, 2002, 2003）
- `columnId` 就是 `columns[actualColIndex].id`

## 📊 数据流完整路径

### 1. 数据生成（buildConfigFromV2）

```javascript
// ✅ 从接口返回的模板数据中获取真实的业务ID
const leafCols = parser.getLeafColumns()  // ✅ 包含真实业务ID

const columns = [
  { id: 0, code: 'INDEX', title: '#', ... },
  { id: 1, code: 'METRIC', title: '指标', ... },
  ...leafCols.map((col, ci) => {
    const businessId = col.id  // ✅ 直接使用接口返回的真实业务ID
    const businessCode = col.code || generateBusinessCode(col.id, col.title)
    
    return {
      id: businessId,      // ✅ BIGINT - 真实业务ID（来自接口）
      code: businessCode,  // ✅ VARCHAR - 业务编码
      title: col.title,
      ...
    }
  })
]

config.value.columns = columns  // ✅ 存储到 config.value.columns
```

### 2. 数据传递（updateSaveData）

```javascript
function updateSaveData() {
  const columnsWithBusinessId = config.value.columns || []  // ✅ 获取列配置
  
  store.setSaveData({
    rows: rowsWithBusinessId,
    columns: columnsWithBusinessId,  // ✅ 传递列配置（包含真实业务ID）
    cellData: config.value.cellData || {}
  })
}
```

### 3. 数据存储（reportStore）

```javascript
function setSaveData(data) {
  saveData.value = {
    ...saveData.value,
    ...data,
    lastModified: new Date().toISOString()
  }
  // ✅ saveData.value.columns 现在包含真实的业务ID
}
```

### 4. 数据转换（buildCellDataDTO）

```javascript
function buildCellDataDTO(data) {
  const columns = toRaw(data?.columns || [])  // ✅ 从 saveData.value.columns 获取
  
  for (let colIndex = 0; colIndex < row.values.length; colIndex++) {
    const actualColIndex = colIndex + 2  // 跳过前2列
    const colConfig = columns[actualColIndex]  // ✅ 获取列配置
    
    const columnId = colConfig?.id  // ✅ 从列配置中获取真实业务ID
    const columnCode = colConfig?.code  // ✅ 从列配置中获取业务编码
    
    const cellDTO = new CellDataDTO({
      columnId: columnId,      // ✅ 使用真实业务ID
      columnCode: columnCode,  // ✅ 使用真实业务编码
      ...
    })
  }
}
```

## 🔍 关键要点

### 1. columnId 的来源

**columnId 来自接口返回的模板数据：**

```javascript
// 接口返回的数据结构
{
  columnTree: [
    { id: 2001, code: 'RAW_COAL', title: '原煤产量', ... },  // ✅ 真实业务ID
    { id: 2002, code: 'COMMODITY_COAL', title: '商品煤销量', ... },
    ...
  ]
}

// 解析器处理
const leafCols = parser.getLeafColumns()  // ✅ 包含真实业务ID

// 构建列配置
const columns = [
  ...leafCols.map((col, ci) => ({
    id: col.id,  // ✅ 直接使用接口返回的真实业务ID
    code: col.code,
    ...
  }))
]
```

### 2. columnId 的传递路径

```
接口返回数据
  ↓
  columnTree: [{ id: 2001, code: 'RAW_COAL', ... }]
  ↓
ReportTemplateParser
  ↓
  leafCols = parser.getLeafColumns()  // ✅ 包含真实业务ID
  ↓
buildConfigFromV2
  ↓
  columns = [{ id: 2001, code: 'RAW_COAL', ... }]
  ↓
  config.value.columns = columns
  ↓
updateSaveData
  ↓
  store.setSaveData({ columns: columnsWithBusinessId })
  ↓
reportStore
  ↓
  saveData.value.columns = [{ id: 2001, code: 'RAW_COAL', ... }]
  ↓
buildCellDataDTO
  ↓
  const columns = toRaw(data?.columns || [])
  const colConfig = columns[actualColIndex]
  const columnId = colConfig?.id  // ✅ 真实业务ID
  ↓
CellDataDTO
  ↓
  { columnId: 2001, columnCode: 'RAW_COAL', ... }
```

### 3. columnId 的索引计算

**为什么需要 `actualColIndex = colIndex + 2`？**

```javascript
// columns 数组结构
columns = [
  { id: 0, code: 'INDEX', ... },      // 第0列：索引列（固定列）
  { id: 1, code: 'METRIC', ... },     // 第1列：指标列（固定列）
  { id: 2001, code: 'RAW_COAL', ... }, // 第2列：数据列（真实业务ID）
  { id: 2002, code: 'COMMODITY_COAL', ... }, // 第3列：数据列
  ...
]

// row.values 数组结构（不包含固定列）
row.values = [
  { v: '100', colIdx: 0, ... },  // 对应 columns[2]（第2列）
  { v: '50', colIdx: 1, ... },   // 对应 columns[3]（第3列）
  ...
]

// 所以需要跳过前2列
const actualColIndex = colIndex + 2  // ✅ 跳过 # 和 指标列
const colConfig = columns[actualColIndex]
```

## 🧪 验证方法

### 在浏览器控制台查看数据

```javascript
// 1. 查看接口返回的模板数据
console.log('接口返回的columnTree:', currentTemplate.value.columnTree)

// 2. 查看解析后的leafCols
console.log('解析后的leafCols:', v2Parser.value.getLeafColumns())

// 3. 查看构建后的columns配置
console.log('config.value.columns:', config.value.columns)

// 4. 查看传递到store的columns
console.log('saveData.value.columns:', store.saveData.columns)

// 5. 查看buildCellDataDTO中的columns
console.log('buildCellDataDTO中的columns:', data.columns)

// 6. 查看最终的columnId
console.log('columnId:', colConfig?.id)
```

## ✅ 总结

**columnId 存储位置：**

1. **接口返回数据**：`columnTree[].id`（真实业务ID）
2. **解析器处理**：`leafCols[].id`（真实业务ID）
3. **列配置数组**：`columns[actualColIndex].id`（真实业务ID）
4. **保存数据**：`saveData.value.columns[].id`（真实业务ID）
5. **CellDataDTO**：`cellDTO.columnId`（真实业务ID）

**关键点：**
- `columnId` 存储在 `data.columns` 数组中
- 通过 `columns[actualColIndex].id` 获取
- `actualColIndex = colIndex + 2`（跳过前2列固定列）
- 所有ID都是真实的业务ID（来自接口），不是临时生成的

**数据流：**
接口 → 解析器 → buildConfigFromV2 → config.value.columns → updateSaveData → saveData.value.columns → buildCellDataDTO → CellDataDTO.columnId