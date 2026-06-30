# Formula System - 后端API接口设计建议

## 一、整体设计思路

### 1.1 架构层次

```
前端 (FormulaDesigner.vue)
    ↓
Formula Service层 (FormulaService.js)
    ↓
API Client层 (axios封装)
    ↓
后端API接口
    ↓
数据库持久化
```

### 1.2 核心模块

后端API需要支撑以下核心功能：

- **公式管理**: CRUD、发布、废弃、版本管理
- **指标管理**: 指标库管理、指标分类、指标搜索
- **函数管理**: 内置函数、自定义函数、函数市场
- **依赖管理**: 依赖关系存储、循环检测、影响分析
- **计算引擎**: 公式验证、公式计算、批量计算
- **权限管理**: 公式权限、指标权限、函数权限
- **版本管理**: 版本历史、版本对比、版本恢复
- **模板管理**: 公式模板、模板分类、模板应用

---

## 二、数据库设计建议

### 2.1 核心数据表

#### 1. **formula_formulas** - 公式主表

```sql
CREATE TABLE formula_formulas (
    id              VARCHAR(64) PRIMARY KEY COMMENT '公式ID',
    name            VARCHAR(100) NOT NULL COMMENT '公式名称',
    code            VARCHAR(50) NOT NULL UNIQUE COMMENT '公式编码',
    category        VARCHAR(20) NOT NULL COMMENT '公式分类: basic/aggregate/logical/time_analysis/business/window',
    description     TEXT COMMENT '公式描述',
    
    -- 公式表达式
    expression      TEXT NOT NULL COMMENT '显示表达式: ([营业收入]-[营业成本])/[营业收入]*100',
    internal_expression TEXT COMMENT '内部表达式: (${revenue}-${cost})/${revenue}*100',
    
    -- 类型信息
    result_type     VARCHAR(20) NOT NULL DEFAULT 'number' COMMENT '返回类型: number/string/boolean/date',
    display_format  VARCHAR(50) DEFAULT '#,##0.00' COMMENT '显示格式',
    precision       INT DEFAULT 2 COMMENT '精度',
    
    -- 状态信息
    status          VARCHAR(20) NOT NULL DEFAULT 'draft' COMMENT '状态: draft/published/deprecated',
    version         INT NOT NULL DEFAULT 1 COMMENT '版本号',
    
    -- 统计信息
    usage_count     INT DEFAULT 0 COMMENT '使用次数',
    favorite_count  INT DEFAULT 0 COMMENT '收藏次数',
    
    -- 权限信息
    is_public       BOOLEAN DEFAULT FALSE COMMENT '是否公开',
    owner_id        VARCHAR(64) NOT NULL COMMENT '创建人ID',
    org_id          VARCHAR(64) COMMENT '组织ID',
    dept_id         VARCHAR(64) COMMENT '部门ID',
    
    -- 时间信息
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    published_at    TIMESTAMP COMMENT '发布时间',
    deprecated_at   TIMESTAMP COMMENT '废弃时间',
    
    -- 紧引设计
    INDEX idx_code (code),
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_owner (owner_id),
    INDEX idx_org (org_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='公式定义表';
```

#### 2. **formula_indicators** - 指标表

```sql
CREATE TABLE formula_indicators (
    id              VARCHAR(64) PRIMARY KEY COMMENT '指标ID',
    name            VARCHAR(100) NOT NULL COMMENT '指标名称',
    code            VARCHAR(50) NOT NULL UNIQUE COMMENT '指标编码',
    internal_code   VARCHAR(100) COMMENT '内部编码(如row_xxxxxx)',
    
    -- 类型信息
    type            VARCHAR(20) NOT NULL DEFAULT 'number' COMMENT '指标类型: number/string/boolean/date',
    category        VARCHAR(20) NOT NULL COMMENT '指标分类: basic/calculated/public/dimension/parameter',
    
    -- 数据来源
    source_type     VARCHAR(20) NOT NULL COMMENT '来源类型: template/public/system/custom',
    source_id       VARCHAR(64) COMMENT '来源ID(模板ID/公共指标ID)',
    
    -- 描述信息
    description     TEXT COMMENT '指标描述',
    unit            VARCHAR(20) COMMENT '单位',
    
    -- 默认值
    default_value   TEXT COMMENT '默认值',
    
    -- 权限信息
    is_public       BOOLEAN DEFAULT FALSE COMMENT '是否公开',
    owner_id        VARCHAR(64) NOT NULL COMMENT '创建人ID',
    org_id          VARCHAR(64) COMMENT '组织ID',
    
    -- 时间信息
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 索引设计
    INDEX idx_code (code),
    INDEX idx_internal_code (internal_code),
    INDEX idx_category (category),
    INDEX idx_source (source_type, source_id),
    INDEX idx_owner (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='指标定义表';
```

#### 3. **formula_functions** - 函数表

```sql
CREATE TABLE formula_functions (
    id              VARCHAR(64) PRIMARY KEY COMMENT '函数ID',
    name            VARCHAR(50) NOT NULL UNIQUE COMMENT '函数名称',
    category        VARCHAR(20) NOT NULL COMMENT '函数分类: math/aggregate/logical/text/date/time_analysis/business/window',
    
    -- 函数签名
    signature       VARCHAR(200) NOT NULL COMMENT '函数签名: SUM(number1, [number2], ...)',
    description     TEXT NOT NULL COMMENT '函数描述',
    
    -- 参数定义
    params          JSON COMMENT '参数定义(JSON数组)',
    min_args        INT DEFAULT 0 COMMENT '最少参数个数',
    max_args        INT DEFAULT -1 COMMENT '最多参数个数(-1表示无限)',
    
    -- 返回类型
    return_type     VARCHAR(20) NOT NULL COMMENT '返回类型: number/string/boolean/date/any',
    
    -- 函数实现
    implementation_type VARCHAR(20) NOT NULL DEFAULT 'builtin' COMMENT '实现类型: builtin/custom/plugin',
    implementation_code TEXT COMMENT '自定义实现代码',
    
    -- 示例和文档
    examples        JSON COMMENT '示例(JSON数组)',
    documentation   TEXT COMMENT '详细文档',
    
    -- 状态信息
    status          VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '状态: active/deprecated',
    version         INT DEFAULT 1 COMMENT '版本号',
    
    -- 统计信息
    usage_count     INT DEFAULT 0 COMMENT '使用次数',
    favorite_count  INT DEFAULT 0 COMMENT '收藏次数',
    
    -- 权限信息
    is_public       BOOLEAN DEFAULT TRUE COMMENT '是否公开',
    owner_id        VARCHAR(64) COMMENT '创建人ID',
    org_id          VARCHAR(64) COMMENT '组织ID',
    
    -- 时间信息
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 索引设计
    INDEX idx_name (name),
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_owner (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='函数定义表';
```

#### 4. **formula_dependencies** - 依赖关系表

```sql
CREATE TABLE formula_dependencies (
    id              VARCHAR(64) PRIMARY KEY COMMENT '依赖关系ID',
    formula_id      VARCHAR(64) NOT NULL COMMENT '公式ID',
    dependency_type VARCHAR(20) NOT NULL COMMENT '依赖类型: indicator/formula/variable',
    dependency_id   VARCHAR(64) NOT NULL COMMENT '依赖对象ID',
    
    -- 时间信息
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    -- 紧引设计
    INDEX idx_formula (formula_id),
    INDEX idx_dependency (dependency_type, dependency_id),
    UNIQUE KEY uk_formula_dep (formula_id, dependency_type, dependency_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='公式依赖关系表';
```

#### 5. **formula_history** - 版本历史表

```sql
CREATE TABLE formula_history (
    id              VARCHAR(64) PRIMARY KEY COMMENT '历史记录ID',
    formula_id      VARCHAR(64) NOT NULL COMMENT '公式ID',
    version         INT NOT NULL COMMENT '版本号',
    
    -- 变更信息
    changes         TEXT COMMENT '变更描述',
    diff            JSON COMMENT '差异详情(JSON)',
    
    -- 公式快照
    formula_snapshot JSON NOT NULL COMMENT '公式完整快照(JSON)',
    previous_snapshot JSON COMMENT '前一个版本快照(JSON)',
    
    -- 用户信息
    created_by      VARCHAR(64) NOT NULL COMMENT '创建人ID',
    created_by_name VARCHAR(100) COMMENT '创建人姓名',
    
    -- 时间信息
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    
    -- 索引设计
    INDEX idx_formula (formula_id),
    INDEX idx_version (formula_id, version),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='公式版本历史表';
```

#### 6. **formula_templates** - 公式模板表

```sql
CREATE TABLE formula_templates (
    id              VARCHAR(64) PRIMARY KEY COMMENT '模板ID',
    name            VARCHAR(100) NOT NULL COMMENT '模板名称',
    icon            VARCHAR(10) COMMENT '模板图标',
    description     TEXT COMMENT '模板描述',
    
    -- 模板内容
    template_expression TEXT NOT NULL COMMENT '模板表达式',
    
    -- 分类信息
    category        VARCHAR(20) COMMENT '模板分类',
    tags            JSON COMMENT '标签(JSON数组)',
    
    -- 统计信息
    usage_count     INT DEFAULT 0 COMMENT '使用次数',
    favorite_count  INT DEFAULT 0 COMMENT '收藏次数',
    
    -- 权限信息
    is_public       BOOLEAN DEFAULT TRUE COMMENT '是否公开',
    owner_id        VARCHAR(64) NOT NULL COMMENT '创建人ID',
    org_id          VARCHAR(64) COMMENT '组织ID',
    
    -- 时间信息
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 索引设计
    INDEX idx_category (category),
    INDEX idx_owner (owner_id),
    INDEX idx_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='公式模板表';
```

#### 7. **formula_variables** - 系统变量表

```sql
CREATE TABLE formula_variables (
    id              VARCHAR(64) PRIMARY KEY COMMENT '变量ID',
    name            VARCHAR(50) NOT NULL UNIQUE COMMENT '变量名称',
    type            VARCHAR(20) NOT NULL COMMENT '变量类型: number/string/boolean/date',
    
    -- 变量值
    value           TEXT COMMENT '静态值',
    value_expression TEXT COMMENT '动态值表达式',
    
    -- 描述信息
    description     TEXT COMMENT '变量描述',
    
    -- 权限信息
    is_public       BOOLEAN DEFAULT TRUE COMMENT '是否公开',
    owner_id        VARCHAR(64) COMMENT '创建人ID',
    
    -- 时间信息
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    -- 索引设计
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统变量表';
```

### 2.2 辅助数据表

#### 1. **formula_usage_logs** - 使用日志表

```sql
CREATE TABLE formula_usage_logs (
    id              VARCHAR(64) PRIMARY KEY COMMENT '日志ID',
    formula_id      VARCHAR(64) COMMENT '公式ID',
    function_name   VARCHAR(50) COMMENT '函数名称',
    indicator_id    VARCHAR(64) COMMENT '指标ID',
    
    -- 使用信息
    usage_type      VARCHAR(20) NOT NULL COMMENT '使用类型: evaluate/compile/validate',
    user_id         VARCHAR(64) NOT NULL COMMENT '用户ID',
    
    -- 计算结果
    input_data      JSON COMMENT '输入数据(JSON)',
    output_result   JSON COMMENT '输出结果(JSON)',
    errors          JSON COMMENT '错误信息(JSON)',
    
    -- 性能信息
    duration_ms     INT COMMENT '执行时长(毫秒)',
    
    -- 时间信息
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '使用时间',
    
    -- 索引设计
    INDEX idx_formula (formula_id),
    INDEX idx_user (user_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='公式使用日志表';
```

---

## 三、后端API接口设计

### 3.1 API设计原则

1. **RESTful风格**: 使用标准的RESTful API设计规范
2. **统一响应格式**: 所有接口返回统一的JSON格式
3. **错误处理**: 提供详细的错误信息和错误代码
4. **分页支持**: 列表查询支持分页、排序、过滤
5. **权限控制**: 每个接口都有权限验证
6. **版本控制**: API支持版本管理（v1/v2）

### 3.2 统一响应格式

```json
{
    "success": true,
    "code": 200,
    "message": "操作成功",
    "data": {
        // 具体业务数据
    },
    "errors": [
        // 错误信息数组（如果有）
        {
            "type": "validation_error",
            "message": "公式验证失败",
            "field": "expression",
            "location": {
                "start": { "line": 1, "column": 10 },
                "end": { "line": 1, "column": 15 }
            }
        }
    ],
    "metadata": {
        "total": 100,
        "page": 1,
        "pageSize": 20,
        "timestamp": "2026-06-29T10:30:00Z"
    }
}
```

### 3.3 API端点列表

#### 1. **公式管理API**

| 端点 | 方法 | 描述 | 权限 |
|------|------|------|------|
| `/api/v1/formulas` | GET | 获取公式列表 | 所有人 |
| `/api/v1/formulas` | POST | 创建公式 | 管理员/开发者 |
| `/api/v1/formulas/{id}` | GET | 获取单个公式 | 所有人 |
| `/api/v1/formulas/{id}` | PUT | 更新公式 | 管理员/公式创建者 |
| `/api/v1/formulas/{id}` | DELETE | 删除公式 | 管理员/公式创建者 |
| `/api/v1/formulas/{id}/publish` | POST | 发布公式 | 管理员/公式创建者 |
| `/api/v1/formulas/{id}/deprecate` | POST | 废弃公式 | 管理员 |
| `/api/v1/formulas/{id}/validate` | POST | 验证公式 | 所有人 |
| `/api/v1/formulas/{id}/evaluate` | POST | 计算公式 | 所有人 |
| `/api/v1/formulas/{id}/preview` | POST | 模拟计算 | 所有人 |
| `/api/v1/formulas/batch-evaluate` | POST | 批量计算公式 | 所有人 |
| `/api/v1/formulas/export` | GET | 导出公式 | 管理员 |
| `/api/v1/formulas/import` | POST | 导入公式 | 管理员 |

#### 2. **指标管理API**

| 端点 | 方法 | 描述 | 权限 |
|------|------|------|------|
| `/api/v1/indicators` | GET | 获取指标列表 | 所有人 |
| `/api/v1/indicators` | POST | 创建指标 | 管理员/开发者 |
| `/api/v1/indicators/{id}` | GET | 获取单个指标 | 所有人 |
| `/api/v1/indicators/{id}` | PUT | 更新指标 | 管理员/指标创建者 |
| `/api/v1/indicators/{id}` | DELETE | 删除指标 | 管理员/指标创建者 |
| `/api/v1/indicators/search` | GET | 搜索指标 | 所有人 |
| `/api/v1/indicators/from-template/{templateId}` | GET | 从模板提取指标 | 所有人 |
| `/api/v1/indicators/batch-register` | POST | 批量注册指标 | 管理员/开发者 |

#### 3. **函数管理API**

| 端点 | 方法 | 描述 | 权限 |
|------|------|------|------|
| `/api/v1/functions` | GET | 获取函数列表 | 所有人 |
| `/api/v1/functions` | POST | 创建自定义函数 | 管理员/开发者 |
| `/api/v1/functions/{id}` | GET | 获取单个函数 | 所有人 |
| `/api/v1/functions/{id}` | PUT | 更新函数 | 管理员/函数创建者 |
| `/api/v1/functions/{id}` | DELETE | 删除函数 | 管理员 |
| `/api/v1/functions/categories` | GET | 获取函数分类 | 所有人 |
| `/api/v1/functions/search` | GET | 搜索函数 | 所有人 |
| `/api/v1/functions/builtin` | GET | 获取内置函数列表 | 所有人 |

#### 4. **依赖管理API**

| 端点 | 方法 | 描述 | 权限 |
|------|------|------|------|
| `/api/v1/formulas/{id}/dependencies` | GET | 获取公式依赖 | 所有人 |
| `/api/v1/formulas/{id}/impact` | GET | 获取公式影响范围 | 所有人 |
| `/api/v1/formulas/{id}/dependency-tree` | GET | 获取依赖树 | 所有人 |
| `/api/v1/formulas/cycle-detection` | POST | 循环依赖检测 | 管理员 |
| `/api/v1/formulas/calculation-order` | POST | 获取计算顺序 | 所有人 |

#### 5. **版本管理API**

| 端点 | 方法 | 描述 | 权限 |
|------|------|------|------|
| `/api/v1/formulas/{id}/history` | GET | 获取版本历史 | 所有人 |
| `/api/v1/formulas/{id}/history/{version}` | GET | 获取特定版本 | 所有人 |
| `/api/v1/formulas/{id}/restore/{version}` | POST | 恢复历史版本 | 管理员/公式创建者 |
| `/api/v1/formulas/{id}/compare` | POST | 版本对比 | 所有人 |

#### 6. **模板管理API**

| 端点 | 方法 | 描述 | 权限 |
|------|------|------|------|
| `/api/v1/templates` | GET | 获取模板列表 | 所有人 |
| `/api/v1/templates` | POST | 创建模板 | 管理员 |
| `/api/v1/templates/{id}` | GET | 获取单个模板 | 所有人 |
| `/api/v1/templates/{id}` | PUT | 更新模板 | 管理员 |
| `/api/v1/templates/{id}` | DELETE | 删除模板 | 管理员 |
| `/api/v1/templates/categories` | GET | 获取模板分类 | 所有人 |

#### 7. **变量管理API**

| 端点 | 方法 | 描述 | 权限 |
|------|------|------|------|
| `/api/v1/variables` | GET | 获取变量列表 | 所有人 |
| `/api/v1/variables` | POST | 创建变量 | 管理员 |
| `/api/v1/variables/{id}` | GET | 获取单个变量 | 所有人 |
| `/api/v1/variables/{id}` | PUT | 更新变量 | 管理员 |
| `/api/v1/variables/{id}` | DELETE | 删除变量 | 管理员 |

---

## 四、API接口详细设计

### 4.1 公式管理API详细设计

#### 1. **GET /api/v1/formulas - 获取公式列表**

**请求参数:**
```json
{
    "page": 1,
    "pageSize": 20,
    "sortBy": "created_at",
    "sortOrder": "desc",
    "category": "basic",
    "status": "published",
    "resultType": "number",
    "ownerId": "user_123",
    "search": "利润率",
    "isPublic": true
}
```

**响应示例:**
```json
{
    "success": true,
    "code": 200,
    "message": "查询成功",
    "data": {
        "formulas": [
            {
                "id": "formula_001",
                "name": "利润率",
                "code": "profitRate",
                "category": "business",
                "description": "计算企业的利润率",
                "expression": "([营业收入]-[营业成本])/[营业收入]*100",
                "resultType": "number",
                "displayFormat": "0.00%",
                "precision": 2,
                "status": "published",
                "version": 3,
                "usageCount": 1250,
                "favoriteCount": 89,
                "ownerId": "user_123",
                "ownerName": "张三",
                "createdAt": "2026-06-15T10:30:00Z",
                "updatedAt": "2026-06-28T14:20:00Z",
                "publishedAt": "2026-06-20T08:00:00Z"
            }
        ],
        "total": 100,
        "page": 1,
        "pageSize": 20
    },
    "metadata": {
        "timestamp": "2026-06-29T10:30:00Z"
    }
}
```

#### 2. **POST /api/v1/formulas - 创建公式**

**请求体:**
```json
{
    "name": "利润率",
    "code": "profitRate",
    "category": "business",
    "description": "计算企业的利润率，公式为：(收入-成本)/收入*100",
    "expression": "([营业收入]-[营业成本])/[营业收入]*100",
    "internalExpression": "(${revenue}-${cost})/${revenue}*100",
    "resultType": "number",
    "displayFormat": "0.00%",
    "precision": 2,
    "isPublic": false,
    "ownerId": "user_123",
    "orgId": "org_001",
    "deptId": "dept_001"
}
```

**响应示例:**
```json
{
    "success": true,
    "code": 201,
    "message": "公式创建成功",
    "data": {
        "formula": {
            "id": "formula_abc123",
            "name": "利润率",
            "code": "profitRate",
            "status": "draft",
            "version": 1,
            "dependencies": ["revenue", "cost"],
            "variables": [],
            "functions": [],
            "createdAt": "2026-06-29T10:30:00Z"
        },
        "validation": {
            "valid": true,
            "errors": [],
            "warnings": [],
            "dependencies": ["revenue", "cost"]
        }
    }
}
```

#### 3. **POST /api/v1/formulas/{id}/validate - 验证公式**

**请求体:**
```json
{
    "expression": "([营业收入]-[营业成本])/[营业收入]*100",
    "validateOptions": {
        "checkDependencies": true,
        "checkCircular": true,
        "checkDivisionByZero": true,
        "checkNullValue": true
    }
}
```

**响应示例:**
```json
{
    "success": true,
    "code": 200,
    "message": "公式验证完成",
    "data": {
        "valid": false,
        "errors": [
            {
                "type": "undefined_variable",
                "message": "未定义的指标: '营业收入'",
                "severity": "error",
                "location": {
                    "start": { "line": 1, "column": 10 },
                    "end": { "line": 1, "column": 15 }
                },
                "suggestions": [
                    "请检查指标名称是否正确",
                    "请确认该指标已在指标库中定义"
                ]
            }
        ],
        "warnings": [
            {
                "type": "division_by_zero_risk",
                "message": "潜在的除零风险: '[营业收入]'可能为零",
                "severity": "warning",
                "location": {
                    "start": { "line": 1, "column": 30 },
                    "end": { "line": 1, "column": 35 }
                }
            }
        ],
        "dependencies": [],
        "variables": [],
        "functions": []
    }
}
```

#### 4. **POST /api/v1/formulas/{id}/evaluate - 计算公式**

**请求体:**
```json
{
    "context": {
        "indicators": {
            "营业收入": 1000,
            "营业成本": 800
        },
        "variables": {
            "$CurrentYear": 2026,
            "$CurrentMonth": 6
        },
        "cellData": {},
        "currentRow": 0,
        "currentCol": 0
    },
    "options": {
        "enableCache": true,
        "debugMode": true,
        "formatResult": true
    }
}
```

**响应示例:**
```json
{
    "success": true,
    "code": 200,
    "message": "公式计算成功",
    "data": {
        "value": 20,
        "formattedValue": "20.00%",
        "type": "number",
        "errors": [],
        "metadata": {
            "duration": 5,
            "cached": false,
            "debugLog": [
                {
                    "step": 1,
                    "expression": "[营业收入]",
                    "value": 1000,
                    "duration": 1
                },
                {
                    "step": 2,
                    "expression": "[营业成本]",
                    "value": 800,
                    "duration": 1
                },
                {
                    "step": 3,
                    "expression": "[营业收入] - [营业成本]",
                    "value": 200,
                    "duration": 1
                },
                {
                    "step": 4,
                    "expression": "(200) / [营业收入]",
                    "value": 0.2,
                    "duration": 1
                },
                {
                    "step": 5,
                    "expression": "(0.2) * 100",
                    "value": 20,
                    "duration": 1
                }
            ]
        }
    }
}
```

#### 5. **GET /api/v1/formulas/{id}/dependencies - 获取公式依赖**

**响应示例:**
```json
{
    "success": true,
    "code": 200,
    "message": "依赖查询成功",
    "data": {
        "formulaId": "formula_001",
        "dependencies": [
            {
                "id": "revenue",
                "name": "营业收入",
                "type": "indicator",
                "category": "basic",
                "level": 1
            },
            {
                "id": "cost",
                "name": "营业成本",
                "type": "indicator",
                "category": "basic",
                "level": 1
            }
        ],
        "dependencyTree": {
            "id": "profitRate",
            "name": "利润率",
            "type": "formula",
            "level": 0,
            "children": [
                {
                    "id": "revenue",
                    "name": "营业收入",
                    "type": "indicator",
                    "level": 1,
                    "children": []
                },
                {
                    "id": "cost",
                    "name": "营业成本",
                    "type": "indicator",
                    "level": 1,
                    "children": []
                }
            ]
        },
        "hasCircularDependency": false,
        "calculationOrder": ["revenue", "cost", "profitRate"]
    }
}
```

#### 6. **GET /api/v1/formulas/{id}/impact - 获取公式影响范围**

**响应示例:**
```json
{
    "success": true,
    "code": 200,
    "message": "影响范围查询成功",
    "data": {
        "formulaId": "revenue",
        "affectedFormulas": [
            {
                "id": "profit",
                "name": "利润",
                "type": "formula",
                "level": 1
            },
            {
                "id": "profitRate",
                "name": "利润率",
                "type": "formula",
                "level": 2
            },
            {
                "id": "profitGrowth",
                "name": "利润增长率",
                "type": "formula",
                "level": 3
            }
        ],
        "impactTree": {
            "id": "revenue",
            "name": "营业收入",
            "type": "indicator",
            "level": 0,
            "dependents": [
                {
                    "id": "profit",
                    "name": "利润",
                    "type": "formula",
                    "level": 1,
                    "dependents": [
                        {
                            "id": "profitRate",
                            "name": "利润率",
                            "type": "formula",
                            "level": 2,
                            "dependents": []
                        }
                    ]
                }
            ]
        },
        "affectedCount": 3
    }
}
```

### 4.2 指标管理API详细设计

#### 1. **GET /api/v1/indicators - 获取指标列表**

**请求参数:**
```json
{
    "page": 1,
    "pageSize": 50,
    "sortBy": "name",
    "sortOrder": "asc",
    "category": "basic",
    "type": "number",
    "sourceType": "template",
    "search": "收入"
}
```

**响应示例:**
```json
{
    "success": true,
    "code": 200,
    "message": "查询成功",
    "data": {
        "indicators": [
            {
                "id": "indicator_001",
                "name": "营业收入",
                "code": "revenue",
                "internalCode": "row_abc123",
                "type": "number",
                "category": "basic",
                "description": "企业主要营业收入",
                "unit": "万元",
                "sourceType": "template",
                "sourceId": "template_001",
                "defaultValue": null,
                "isPublic": false,
                "ownerId": "user_123",
                "createdAt": "2026-06-10T10:30:00Z"
            }
        ],
        "total": 120,
        "page": 1,
        "pageSize": 50
    }
}
```

#### 2. **GET /api/v1/indicators/from-template/{templateId} - 从模板提取指标**

**响应示例:**
```json
{
    "success": true,
    "code": 200,
    "message": "提取成功",
    "data": {
        "indicators": [
            {
                "id": "extracted_001",
                "name": "营业收入",
                "code": "revenue",
                "internalCode": "row_001",
                "type": "number",
                "category": "row",
                "description": "",
                "sourceType": "template",
                "sourceId": "template_001"
            }
        ],
        "count": 15
    }
}
```

### 4.3 函数管理API详细设计

#### 1. **GET /api/v1/functions - 获取函数列表**

**请求参数:**
```json
{
    "category": "aggregate",
    "status": "active",
    "isPublic": true,
    "search": "SUM"
}
```

**响应示例:**
```json
{
    "success": true,
    "code": 200,
    "message": "查询成功",
    "data": {
        "functions": [
            {
                "id": "func_sum",
                "name": "SUM",
                "category": "aggregate",
                "signature": "SUM(number1, [number2], ...)",
                "description": "计算数值的总和",
                "params": [
                    {
                        "name": "number1",
                        "type": "number",
                        "description": "第一个数值或范围",
                        "required": true
                    },
                    {
                        "name": "number2",
                        "type": "number",
                        "description": "更多数值或范围",
                        "required": false
                    }
                ],
                "minArgs": 1,
                "maxArgs": -1,
                "returnType": "number",
                "examples": [
                    "SUM(1, 2, 3)",
                    "SUM([营业收入], [营业成本])",
                    "SUM(A1:A10)"
                ],
                "status": "active",
                "implementationType": "builtin"
            }
        ]
    }
}
```

---

## 五、后端实现建议

### 5.1 技术栈建议

**Node.js后端:**
- **框架**: Express.js 或 NestJS
- **ORM**: Sequelize 或 TypeORM
- **数据库**: MySQL 或 PostgreSQL
- **缓存**: Redis (用于公式计算结果缓存)
- **认证**: JWT + OAuth2.0
- **API文档**: Swagger/OpenAPI

**Java后端:**
- **框架**: Spring Boot + Spring Data JPA
- **数据库**: MySQL 或 PostgreSQL
- **缓存**: Redis + Spring Cache
- **认证**: Spring Security + JWT
- **API文档**: Swagger

### 5.2 核心服务设计

#### 1. **FormulaService (后端)**

```javascript
class FormulaService {
    // 公式CRUD
    async createFormula(formulaData) { /* ... */ }
    async updateFormula(formulaId, updateData) { /* ... */ }
    async deleteFormula(formulaId) { /* ... */ }
    async getFormula(formulaId) { /* ... */ }
    async listFormulas(filters) { /* ... */ }
    
    // 公式生命周期
    async publishFormula(formulaId) { /* ... */ }
    async deprecateFormula(formulaId) { /* ... */ }
    
    // 公式计算
    async validateFormula(expression, options) { /* ... */ }
    async evaluateFormula(formulaId, context) { /* ... */ }
    async batchEvaluate(formulaIds, context) { /* ... */ }
    
    // 依赖管理
    async analyzeDependencies(formulaId) { /* ... */ }
    async getDependencyTree(formulaId) { /* ... */ }
    async getImpactAnalysis(formulaId) { /* ... */ }
    
    // 版本管理
    async getHistory(formulaId) { /* ... */ }
    async restoreVersion(formulaId, version) { /* ... */ }
    async compareVersions(formulaId, version1, version2) { /* ... */ }
    
    // 导入导出
    async exportFormulas(format) { /* ... */ }
    async importFormulas(data, format) { /* ... */ }
}
```

#### 2. **FormulaEngineService (后端计算引擎)**

```javascript
class FormulaEngineService {
    constructor() {
        this.engine = createFormulaEngine()
    }
    
    // 编译公式
    async compile(expression) {
        return this.engine.compile(expression)
    }
    
    // 验证公式
    async validate(expression, options = {}) {
        const validation = this.engine.validate(expression)
        
        // 持久化验证日志
        await this.logValidation(expression, validation)
        
        return validation
    }
    
    // 计算公式
    async evaluate(expression, context) {
        const result = this.engine.evaluate(expression, context)
        
        // 持久化计算日志
        await this.logEvaluation(expression, context, result)
        
        return result
    }
    
    // 批量计算
    async batchEvaluate(formulas, context) {
        const results = new Map()
        
        // 按拓扑顺序计算
        const order = this.engine.getCalculationOrder(formulas)
        
        for (const formulaId of order) {
            const formula = formulas.find(f => f.id === formulaId)
            const result = await this.evaluate(formula.expression, context)
            results.set(formulaId, result)
            
            // 更新上下文中的指标值
            if (context.indicators) {
                context.indicators[formula.code] = result.value
            }
        }
        
        return results
    }
}
```

### 5.3 权限控制建议

```javascript
// 权限中间件示例
function checkFormulaPermission(action) {
    return async (req, res, next) => {
        const userId = req.user.id
        const formulaId = req.params.id
        const formula = await Formula.findById(formulaId)
        
        // 权限检查逻辑
        const hasPermission = await checkPermission(userId, formula, action)
        
        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                code: 403,
                message: '无权限执行此操作'
            })
        }
        
        next()
    }
}

// 权限检查函数
async function checkPermission(userId, formula, action) {
    // 公式创建者有所有权限
    if (formula.ownerId === userId) {
        return true
    }
    
    // 管理员有所有权限
    if (await isAdmin(userId)) {
        return true
    }
    
    // 公开的公式，所有人可以查看和计算
    if (formula.isPublic && (action === 'view' || action === 'evaluate')) {
        return true
    }
    
    // 其他情况需要具体权限判断
    return await hasSpecificPermission(userId, formula.id, action)
}
```

### 5.4 性能优化建议

#### 1. **计算结果缓存**

```javascript
// Redis缓存策略
class FormulaCache {
    constructor(redisClient) {
        this.redis = redisClient
        this.cacheExpiry = 3600 // 1小时
    }
    
    // 缓存计算结果
    async cacheResult(formulaId, contextHash, result) {
        const key = `formula:result:${formulaId}:${contextHash}`
        await this.redis.setex(key, this.cacheExpiry, JSON.stringify(result))
    }
    
    // 获取缓存结果
    async getCachedResult(formulaId, contextHash) {
        const key = `formula:result:${formulaId}:${contextHash}`
        const cached = await this.redis.get(key)
        return cached ? JSON.parse(cached) : null
    }
    
    // 清除缓存
    async clearCache(formulaId) {
        const pattern = `formula:result:${formulaId}:*`
        const keys = await this.redis.keys(pattern)
        if (keys.length > 0) {
            await this.redis.del(keys)
        }
    }
}
```

#### 2. **批量计算优化**

```javascript
// 使用拓扑排序优化批量计算
async function batchEvaluateWithOptimization(formulas, context) {
    // 1. 构建依赖图
    const graph = buildDependencyGraph(formulas)
    
    // 2. 拓扑排序
    const order = topologicalSort(graph)
    
    // 3. 按顺序计算（利用缓存）
    const results = new Map()
    
    for (const formulaId of order) {
        const formula = formulas.find(f => f.id === formulaId)
        
        // 尝试从缓存获取
        const contextHash = hashContext(context)
        let result = await cache.getCachedResult(formulaId, contextHash)
        
        if (!result) {
            // 缓存不存在，执行计算
            result = await engine.evaluate(formula.expression, context)
            
            // 缓存结果
            await cache.cacheResult(formulaId, contextHash, result)
        }
        
        results.set(formulaId, result)
        
        // 更新上下文（供后续公式使用）
        if (context.indicators) {
            context.indicators[formula.code] = result.value
        }
    }
    
    return results
}
```

---

## 六、前端集成建议

### 6.1 API Client封装

```javascript
// src/services/api/FormulaAPI.js
import axios from 'axios'

class FormulaAPI {
    constructor() {
        this.baseURL = '/api/v1/formulas'
    }
    
    // 获取公式列表
    async list(params) {
        const response = await axios.get(this.baseURL, { params })
        return response.data
    }
    
    // 创建公式
    async create(formulaData) {
        const response = await axios.post(this.baseURL, formulaData)
        return response.data
    }
    
    // 更新公式
    async update(formulaId, updateData) {
        const response = await axios.put(`${this.baseURL}/${formulaId}`, updateData)
        return response.data
    }
    
    // 验证公式
    async validate(formulaId, expression, options) {
        const response = await axios.post(`${this.baseURL}/${formulaId}/validate`, {
            expression,
            validateOptions: options
        })
        return response.data
    }
    
    // 计算公式
    async evaluate(formulaId, context) {
        const response = await axios.post(`${this.baseURL}/${formulaId}/evaluate`, {
            context,
            options: { enableCache: true, debugMode: true }
        })
        return response.data
    }
    
    // 获取依赖关系
    async getDependencies(formulaId) {
        const response = await axios.get(`${this.baseURL}/${formulaId}/dependencies`)
        return response.data
    }
    
    // 获取历史版本
    async getHistory(formulaId) {
        const response = await axios.get(`${this.baseURL}/${formulaId}/history`)
        return response.data
    }
}

export default new FormulaAPI()
```

### 6.2 FormulaService与后端集成

```javascript
// src/services/formula/services/FormulaService.js (修改版)

import FormulaAPI from '@/services/api/FormulaAPI'

export class FormulaService {
    constructor(options = {}) {
        this.engine = createFormulaEngine(options.engineOptions || {})
        this.formulas = new Map()
        this.indicators = new Map()
        this.variables = new Map()
        this.history = new Map()
        
        // 后端API客户端
        this.apiClient = FormulaAPI
        
        // 配置
        this.config = {
            enableBackendSync: options.enableBackendSync !== false, // 默认启用后端同步
            ...options
        }
        
        this.initDefaultVariables()
    }
    
    // 创建公式（持久化到后端）
    async createFormula(formulaData) {
        // 本地验证
        if (this.config.autoValidate && formulaData.expression) {
            const validation = this.validateFormula(formulaData.expression)
            
            if (!validation.valid) {
                return {
                    success: false,
                    formula: null,
                    errors: validation.errors,
                    message: '公式验证失败'
                }
            }
            
            // 自动填充依赖信息
            formulaData.dependencies = validation.dependencies
            formulaData.variables = validation.variables
            formulaData.functions = validation.functions
        }
        
        // 持久化到后端
        if (this.config.enableBackendSync) {
            try {
                const response = await this.apiClient.create(formulaData)
                
                if (response.success) {
                    const formula = new FormulaDefinition(response.data.formula)
                    
                    // 存储到本地
                    this.formulas.set(formula.id, formula)
                    this.engine.registerFormula(formula)
                    
                    return {
                        success: true,
                        formula: formula,
                        message: '公式创建成功'
                    }
                } else {
                    return {
                        success: false,
                        formula: null,
                        errors: response.errors,
                        message: response.message
                    }
                }
            } catch (error) {
                // 后端同步失败，使用本地存储
                console.warn('后端同步失败，使用本地存储:', error.message)
                
                const formula = new FormulaDefinition({
                    ...formulaData,
                    id: this.generateFormulaId(),
                    status: FormulaStatus.DRAFT,
                    version: 1
                })
                
                this.formulas.set(formula.id, formula)
                this.engine.registerFormula(formula)
                
                return {
                    success: true,
                    formula: formula,
                    message: '公式创建成功（本地存储）'
                }
            }
        }
        
        // 本地存储模式
        const formula = new FormulaDefinition({
            ...formulaData,
            id: this.generateFormulaId(),
            status: FormulaStatus.DRAFT,
            version: 1
        })
        
        this.formulas.set(formula.id, formula)
        this.engine.registerFormula(formula)
        
        return {
            success: true,
            formula: formula,
            message: '公式创建成功'
        }
    }
    
    // 其他方法类似，都需要考虑后端同步...
}
```

---

## 七、部署和运维建议

### 7.1 部署架构

```
前端 (Vue.js)
    ↓ HTTPS
Nginx (反向代理)
    ↓
API Gateway (统一网关)
    ↓
Formula API Services
    ├── FormulaService
    ├── IndicatorService
    ├── FunctionService
    ├── DependencyService
    └── VersionService
    ↓
Formula Engine (计算引擎)
    ↓
Redis (缓存层)
    ↓
MySQL/PostgreSQL (持久化层)
```

### 7.2 监控和日志

#### 1. **性能监控**

```javascript
// 计算性能监控中间件
function performanceMonitor(req, res, next) {
    const startTime = Date.now()
    
    res.on('finish', () => {
        const duration = Date.now() - startTime
        
        // 记录性能日志
        logger.info({
            type: 'performance',
            endpoint: req.path,
            method: req.method,
            duration: duration,
            statusCode: res.statusCode,
            userId: req.user?.id
        })
        
        // 性能告警（超过阈值）
        if (duration > 1000) {
            alertSystem.send({
                type: 'performance_alert',
                message: `公式计算耗时超过阈值: ${duration}ms`,
                endpoint: req.path,
                userId: req.user?.id
            })
        }
    })
    
    next()
}
```

#### 2. **错误日志**

```javascript
// 错误处理中间件
function errorHandler(err, req, res, next) {
    // 记录错误日志
    logger.error({
        type: 'error',
        endpoint: req.path,
        method: req.method,
        error: {
            message: err.message,
            stack: err.stack,
            code: err.code
        },
        userId: req.user?.id,
        requestBody: req.body,
        timestamp: new Date()
    })
    
    // 返回统一错误响应
    res.status(err.status || 500).json({
        success: false,
        code: err.status || 500,
        message: err.message || '服务器内部错误',
        errors: [
            {
                type: err.type || 'internal_error',
                message: err.message
            }
        ]
    })
}
```

### 7.3 备份和恢复策略

#### 1. **数据库备份**

```bash
# 定期备份脚本
#!/bin/bash

# 备份公式数据库
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/formula"

mysqldump -u formula_user -p formula_db > $BACKUP_DIR/formula_$DATE.sql

# 保留最近30天的备份
find $BACKUP_DIR -name "formula_*.sql" -mtime +30 -delete

# 上传到云存储
aws s3 cp $BACKUP_DIR/formula_$DATE.sql s3://formula-backups/
```

#### 2. **缓存备份**

```javascript
// Redis缓存备份策略
async function backupCache() {
    // 获取所有公式计算结果的缓存键
    const keys = await redis.keys('formula:result:*')
    
    // 批量导出缓存数据
    const cacheData = {}
    for (const key of keys) {
        cacheData[key] = await redis.get(key)
    }
    
    // 持久化到文件
    fs.writeFileSync('/backup/cache/formula_cache.json', JSON.stringify(cacheData))
}
```

---

## 八、总结

### 8.1 核心优势

1. **完整的API体系**: 涵盖公式管理、指标管理、函数管理、依赖分析、版本管理等所有核心功能
2. **RESTful规范**: 使用标准的RESTful API设计，易于理解和扩展
3. **统一响应格式**: 所有接口返回统一的JSON格式，便于前端处理
4. **详细的错误信息**: 提供精确的错误定位和修复建议
5. **权限控制**: 完善的权限验证机制，确保数据安全
6. **性能优化**: 计算结果缓存、批量计算优化、拓扑排序算法
7. **日志和监控**: 完整的性能监控和错误日志记录
8. **备份和恢复**: 定期备份策略，确保数据安全

### 8.2 实施建议

1. **分阶段实施**: 
   - 第一阶段：核心公式CRUD API
   - 第二阶段：指标管理、函数管理API
   - 第三阶段：依赖分析、版本管理API
   - 第四阶段：性能优化、监控告警

2. **前后端同步开发**: 
   - 前端先使用本地FormulaService开发UI
   - 后端API逐步开发和集成
   - 最后进行前后端联调

3. **测试和验证**: 
   - API单元测试
   - 性能测试（大规模公式计算）
   - 权限测试
   - 前后端集成测试

4. **文档和培训**: 
   - 编写API文档（Swagger）
   - 编写集成指南
   - 编写运维手册
   - 团队培训

---

**完整的后端API和接口设计建议已提供！这个设计涵盖了Formula System的所有核心功能，包括数据库设计、API端点、请求响应格式、权限控制、性能优化、日志监控、备份恢复等全方位内容。**

**可以按照这个设计逐步实施后端API开发，与前端FormulaDesigner进行集成！**