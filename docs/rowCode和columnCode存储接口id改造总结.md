# rowCode 和 columnCode 存储接口 id 字段改造总结

## 📋 改造需求

用户需求：
- `columnCode` 应该存储接口返回的 `id` 字段（BIGINT）
- `columnId` 参数在保存报表时不要了（移除）
- `rowCode` 和 `rowId` 同理

## 🔧 改造内容

### 1. CellDataDTO 类改造

**改造前的数据结构：**
```javascript
export class CellDataDTO {
  constructor(data = {}) {
    this.rowId = data.rowId || null               // ❌ 不需要
    this.rowCode = data.rowCode || ''             // ❌ 存储的是 code 字段
    this.columnId = data.columnId || null         // ❌ 不需要
    this.columnCode = data.columnCode || ''       // ❌ 存储的是 code 字段
    this.value = data.value || ''
    ...
  }
}
```

**改造后的数据结构：**
```javascript
export class CellDataDTO {
  constructor(data = {}) {
    this.rowCode = data.rowCode || ''             // ✅ 存储接口返回的 id 字段
    this.columnCode = data.columnCode || ''       // ✅ 存储接口返回的 id 字段
    this.value = data.value || ''
    ...
  }
}
```

**关键改造点：**
- ✅ 移除 `rowId` 和 `columnId` 字段
- ✅ `rowCode` 存储接口返回的 `id` 字段（BIGINT）
- ✅ `columnCode` 存储接口返回的 `id` 字段（BIGINT）

### 2. buildCellDataDTO 方法改造

**改造前的逻辑：**
```javascript
function buildCellDataDTO(data) {
  const cellDTO = new CellDataDTO({
    rowId: row.id,              // ❌ 不需要
    rowCode: row.code,          // ❌ 存储的是 code 字段
    columnId: columnId,         // ❌ 不需要
    columnCode: columnCode,     // ❌ 存储的是 code 字段
    value: cell.v,
    ...
  })
}
```

**改造后的逻辑：**
```javascript
function buildCellDataDTO(data) {
  const cellDTO = new CellDataDTO({
    rowCode: row.id,              // ✅ 存储接口返回的 id 字段
    columnCode: columnCode,       // ✅ 存储接口返回的 id 字段
    value: cell.v,
    ...
  })
}
```

**关键改造点：**
- ✅ `rowCode` 直接使用 `row.id`（接口返回的真实业务ID）
- ✅ `columnCode` 直接使用 `colConfig.id`（接口返回的真实业务ID）
- ✅ 移除 `rowId` 和 `columnId` 参数

### 3. 验证逻辑改造

**改造前的验证：**
```javascript
validate() {
  const errors = []
  
  if (!this.rowId) errors.push('缺少 rowId')
  if (!this.rowCode) errors.push('缺少 rowCode')
  if (!this.columnId) errors.push('缺少 columnId')
  if (!this.columnCode) errors.push('缺少 columnCode')
  ...
}
```

**改造后的验证：**
```javascript
validate() {
  const errors = []
  
  if (!this.rowCode) errors.push('缺少 rowCode')
  if (!this.columnCode) errors.push('缺少 columnCode')
  ...
}
```

**关键改造点：**
- ✅ 移除 `rowId` 和 `columnId` 的验证
- ✅ 只验证 `rowCode` 和 `columnCode`

### 4. toAPIFormat 方法改造

**改造前的格式：**
```javascript
toAPIFormat() {
  return {
    rowId: this.rowId,
    rowCode: this.rowCode,
    columnId: this.columnId,
    columnCode: this.columnCode,
    value: this.value,
    ...
  }
}
```

**改造后的格式：**
```javascript
toAPIFormat() {
  return {
    rowCode: this.rowCode,           // ✅ 存储接口返回的id
    columnCode: this.columnCode,     // ✅ 存储接口返回的id
    value: this.value,
    ...
  }
}
```

**关键改造点：**
- ✅ 移除 `rowId` 和 `columnId` 字段
- ✅ 只返回 `rowCode` 和 `columnCode`

## 📊 数据对比

### 接口返回的数据结构
```javascript
{
  rowTree: [
    { id: 1001, code: 'RAW', name: '原煤' }  // ✅ id 是真实业务ID
  ],
  columnTree: [
    { id: 2001, code: 'RAW_COAL', title: '原煤产量' }  // ✅ id 是真实业务ID
  ]
}
```

### 改造前（错误）
```javascript
{
  rowId: 1001,           // ❌ 不需要的参数
  rowCode: 'RAW',        // ❌ 存储的是 code 字段（业务编码）
  columnId: 2001,        // ❌ 不需要的参数
  columnCode: 'RAW_COAL', // ❌ 存储的是 code 字段（业务编码）
  value: "22"
}
```

### 改造后（正确）
```javascript
{
  rowCode: 1001,         // ✅ 存储接口返回的 id 字段（BIGINT）
  columnCode: 2001,      // ✅ 存储接口返回的 id 字段（BIGINT）
  value: "22",
  dataType: 2,
  source: 1
}
```

## 🔄 数据流完整路径

### 1. 接口返回数据
```javascript
{
  rowTree: [{ id: 1001, code: 'RAW', name: '原煤' }],
  columnTree: [{ id: 2001, code: 'RAW_COAL', title: '原煤产量' }]
}
```

### 2. buildConfigFromV2 处理
```javascript
const rows = flatRows.map((row, ri) => {
  return {
    id: row.id,  // ✅ 1001（接口返回的真实业务ID）
    code: row.code,  // ✅ 'RAW'（业务编码）
    name: row.name,
    ...
  }
})

const columns = [
  { id: 0, code: 'INDEX', ... },
  { id: 1, code: 'METRIC', ... },
  { id: 2001, code: 'RAW_COAL', ... },  // ✅ 2001（接口返回的真实业务ID）
  ...
]
```

### 3. updateSaveData 传递
```javascript
store.setSaveData({
  rows: rowsWithBusinessId,  // ✅ 包含真实业务ID
  columns: columnsWithBusinessId,  // ✅ 包含真实业务ID
  ...
})
```

### 4. buildCellDataDTO 转换
```javascript
const cellDTO = new CellDataDTO({
  rowCode: row.id,  // ✅ 1001（存储接口返回的id）
  columnCode: colConfig.id,  // ✅ 2001（存储接口返回的id）
  value: cell.v,
  ...
})
```

### 5. 最终保存数据
```javascript
{
  rowCode: 1001,  // ✅ 存储接口返回的 id 字段
  columnCode: 2001,  // ✅ 存储接口返回的 id 字段
  value: "22",
  dataType: 2,
  source: 1
}
```

## ✅ 改造效果

### 1. 数据简化
- ✅ 移除了不必要的 `rowId` 和 `columnId` 参数
- ✅ 减少了数据冗余，简化了数据结构

### 2. 数据一致性
- ✅ `rowCode` 和 `columnCode` 都存储接口返回的真实业务ID
- ✅ 数据格式统一，便于后端处理

### 3. 符合业务需求
- ✅ 满足用户的数据存储需求
- ✅ 符合数据库表结构要求

## 📚 相关文件

- [cellData.js](file:///e:\Projects\ReportCenter\src\types\cellData.js#L2-L101) - CellDataDTO 类（已改造）
- [reportStore.js](file:///e:\Projects\ReportCenter\src\stores\reportStore.js#L473-L497) - buildCellDataDTO 方法（已改造）

## 🧪 测试验证

刷新页面后，在浏览器控制台查看日志输出：

```javascript
// 查看接口返回的数据
console.log('接口返回的rowTree:', currentTemplate.value.rowTree)
console.log('接口返回的columnTree:', currentTemplate.value.columnTree)

// 查看保存数据
console.log('[buildCellDataDTO] 示例数据:', cells.slice(0, 3))

// 验证数据格式
cells.forEach(cell => {
  console.log(`rowCode: ${cell.rowCode}, columnCode: ${cell.columnCode}, value: ${cell.value}`)
})
```

## ✨ 总结

通过本次改造，我们实现了：

1. **数据简化** - 移除了不必要的 `rowId` 和 `columnId` 参数
2. **数据一致性** - `rowCode` 和 `columnCode` 都存储接口返回的真实业务ID
3. **符合需求** - 满足用户的数据存储需求，符合数据库表结构要求

**关键改造点：**
- `CellDataDTO` 类移除 `rowId` 和 `columnId` 字段
- `rowCode` 存储接口返回的 `id` 字段（BIGINT）
- `columnCode` 存储接口返回的 `id` 字段（BIGINT）
- 验证逻辑只验证 `rowCode` 和 `columnCode`

现在请刷新页面测试，保存的数据应该符合新的数据结构要求了！