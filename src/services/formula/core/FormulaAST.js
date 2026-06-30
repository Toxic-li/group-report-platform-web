/**
 * Formula System - AST节点定义
 * 
 * 抽象语法树节点，用于表示公式结构
 */

import { NodeType, DataType, Location } from './FormulaTypes.js'

/**
 * ASTNode - AST节点基类
 */
export class ASTNode {
  constructor(type, location = new Location()) {
    this.type = type
    this.location = location
    this.nodeType = NodeType[type] || type
  }
  
  /**
   * 节点是否为字面量
   */
  isLiteral() {
    return [
      NodeType.NumberLiteral,
      NodeType.StringLiteral,
      NodeType.BooleanLiteral
    ].includes(this.type)
  }
  
  /**
   * 节点是否为表达式
   */
  isExpression() {
    return [
      NodeType.BinaryExpression,
      NodeType.UnaryExpression,
      NodeType.FunctionCall,
      NodeType.ConditionalExpression,
      NodeType.Identifier,
      NodeType.Variable,
      NodeType.CellReference,
      NodeType.ArrayExpression,
      NodeType.RangeExpression
    ].includes(this.type)
  }
  
  /**
   * 克隆节点
   */
  clone() {
    return JSON.parse(JSON.stringify(this))
  }
  
  /**
   * 转换为JSON
   */
  toJSON() {
    const result = { type: this.type }
    if (this.location) {
      result.location = {
        start: this.location.start,
        end: this.location.end,
        source: this.location.source
      }
    }
    return result
  }
  
  /**
   * 转换为字符串表示
   */
  toString() {
    return this.type
  }
}

/**
 * ProgramNode - 程序根节点
 */
export class ProgramNode extends ASTNode {
  constructor(body = [], location = new Location()) {
    super(NodeType.Program, location)
    this.body = body  // AST节点数组
  }
  
  toJSON() {
    return {
      ...super.toJSON(),
      body: this.body.map(node => node.toJSON())
    }
  }
  
  toString() {
    return `Program(${this.body.map(n => n.toString()).join(', ')})`
  }
}

/**
 * NumberLiteralNode - 数字字面量
 */
export class NumberLiteralNode extends ASTNode {
  constructor(value, location = new Location()) {
    super(NodeType.NumberLiteral, location)
    this.value = value
    this.dataType = DataType.NUMBER
  }
  
  toJSON() {
    return {
      ...super.toJSON(),
      value: this.value,
      dataType: this.dataType
    }
  }
  
  toString() {
    return String(this.value)
  }
}

/**
 * StringLiteralNode - 字符串字面量
 */
export class StringLiteralNode extends ASTNode {
  constructor(value, location = new Location()) {
    super(NodeType.StringLiteral, location)
    this.value = value
    this.dataType = DataType.STRING
  }
  
  toJSON() {
    return {
      ...super.toJSON(),
      value: this.value,
      dataType: this.dataType
    }
  }
  
  toString() {
    return `"${this.value}"`
  }
}

/**
 * BooleanLiteralNode - 布尔字面量
 */
export class BooleanLiteralNode extends ASTNode {
  constructor(value, location = new Location()) {
    super(NodeType.BooleanLiteral, location)
    this.value = value
    this.dataType = DataType.BOOLEAN
  }
  
  toJSON() {
    return {
      ...super.toJSON(),
      value: this.value,
      dataType: this.dataType
    }
  }
  
  toString() {
    return String(this.value)
  }
}

/**
 * IdentifierNode - 标识符节点（指标引用）
 */
export class IdentifierNode extends ASTNode {
  constructor(name, code = null, location = new Location()) {
    super(NodeType.Identifier, location)
    this.name = name      // 显示名称：营业收入
    this.code = code || name  // 编码：revenue
    this.dataType = DataType.ANY  // 类型未知，需要从上下文推断
  }
  
  toJSON() {
    return {
      ...super.toJSON(),
      name: this.name,
      code: this.code,
      dataType: this.dataType
    }
  }
  
  toString() {
    return `[${this.name}]`
  }
}

/**
 * VariableNode - 变量节点
 */
export class VariableNode extends ASTNode {
  constructor(name, location = new Location()) {
    super(NodeType.Variable, location)
    this.name = name      // 变量名：$CurrentYear
    this.dataType = DataType.ANY
  }
  
  toJSON() {
    return {
      ...super.toJSON(),
      name: this.name,
      dataType: this.dataType
    }
  }
  
  toString() {
    return this.name
  }
}

/**
 * CellReferenceNode - 单元格引用节点
 */
export class CellReferenceNode extends ASTNode {
  constructor(reference, location = new Location()) {
    super(NodeType.CellReference, location)
    this.reference = reference  // 单元格引用：A1 或范围 A1:A10
    this.sheet = null           // Sheet名称（可选）
    this.isRange = reference.includes(':')
    this.dataType = DataType.ANY
    
    // 解析单元格坐标
    if (!this.isRange) {
      const match = reference.match(/^([A-Z]+)(\d+)$/)
      if (match) {
        this.column = match[1]
        this.row = parseInt(match[2])
      }
    } else {
      const parts = reference.split(':')
      if (parts.length === 2) {
        const start = parts[0].match(/^([A-Z]+)(\d+)$/)
        const end = parts[1].match(/^([A-Z]+)(\d+)$/)
        if (start && end) {
          this.startColumn = start[1]
          this.startRow = parseInt(start[2])
          this.endColumn = end[1]
          this.endRow = parseInt(end[2])
        }
      }
    }
  }
  
  toJSON() {
    return {
      ...super.toJSON(),
      reference: this.reference,
      sheet: this.sheet,
      isRange: this.isRange,
      dataType: this.dataType,
      column: this.column,
      row: this.row
    }
  }
  
  toString() {
    return this.sheet ? `${this.sheet}!${this.reference}` : this.reference
  }
}

/**
 * BinaryExpressionNode - 二元表达式节点
 */
export class BinaryExpressionNode extends ASTNode {
  constructor(operator, left, right, location = new Location()) {
    super(NodeType.BinaryExpression, location)
    this.operator = operator   // 运算符：+, -, *, /, ^, =, <, >, 等
    this.left = left           // 左操作数
    this.right = right         // 右操作数
    this.dataType = DataType.ANY
    
    // 根据运算符推断数据类型
    if (['+', '-', '*', '/', '^', '%'].includes(operator)) {
      this.dataType = DataType.NUMBER
    } else if (['=', '!=', '<', '>', '<=', '>='].includes(operator)) {
      this.dataType = DataType.BOOLEAN
    }
  }
  
  toJSON() {
    return {
      ...super.toJSON(),
      operator: this.operator,
      left: this.left.toJSON(),
      right: this.right.toJSON(),
      dataType: this.dataType
    }
  }
  
  toString() {
    return `(${this.left.toString()} ${this.operator} ${this.right.toString()})`
  }
}

/**
 * UnaryExpressionNode - 一元表达式节点
 */
export class UnaryExpressionNode extends ASTNode {
  constructor(operator, operand, location = new Location()) {
    super(NodeType.UnaryExpression, location)
    this.operator = operator   // 运算符：-, NOT
    this.operand = operand     // 操作数
    this.dataType = DataType.ANY
    
    // 根据运算符推断数据类型
    if (operator === '-') {
      this.dataType = DataType.NUMBER
    } else if (operator === 'NOT') {
      this.dataType = DataType.BOOLEAN
    }
  }
  
  toJSON() {
    return {
      ...super.toJSON(),
      operator: this.operator,
      operand: this.operand.toJSON(),
      dataType: this.dataType
    }
  }
  
  toString() {
    return `${this.operator}${this.operand.toString()}`
  }
}

/**
 * FunctionCallNode - 函数调用节点
 */
export class FunctionCallNode extends ASTNode {
  constructor(name, params = [], location = new Location()) {
    super(NodeType.FunctionCall, location)
    this.name = name           // 函数名：SUM, IF
    this.arguments = params    // 参数列表
    this.dataType = DataType.ANY
    this.functionInfo = null   // 函数定义信息（可选）
  }

  toJSON() {
    return {
      ...super.toJSON(),
      name: this.name,
      arguments: this.arguments.map(arg => arg.toJSON()),
      dataType: this.dataType,
      functionInfo: this.functionInfo
    }
  }

  toString() {
    const args = this.arguments.map(arg => arg.toString()).join(', ')
    return `${this.name}(${args})`
  }
}

/**
 * ConditionalExpressionNode - 条件表达式节点（IF）
 */
export class ConditionalExpressionNode extends ASTNode {
  constructor(condition, consequent, alternate, location = new Location()) {
    super(NodeType.ConditionalExpression, location)
    this.condition = condition   // 条件
    this.consequent = consequent // 条件为真的结果
    this.alternate = alternate   // 条件为假的结果
    this.dataType = DataType.ANY
  }
  
  toJSON() {
    return {
      ...super.toJSON(),
      condition: this.condition.toJSON(),
      consequent: this.consequent.toJSON(),
      alternate: this.alternate.toJSON(),
      dataType: this.dataType
    }
  }
  
  toString() {
    return `IF(${this.condition.toString()}, ${this.consequent.toString()}, ${this.alternate.toString()})`
  }
}

/**
 * ArrayExpressionNode - 数组表达式节点
 */
export class ArrayExpressionNode extends ASTNode {
  constructor(elements = [], location = new Location()) {
    super(NodeType.ArrayExpression, location)
    this.elements = elements
    this.dataType = DataType.ARRAY
  }
  
  toJSON() {
    return {
      ...super.toJSON(),
      elements: this.elements.map(el => el.toJSON()),
      dataType: this.dataType
    }
  }
  
  toString() {
    const items = this.elements.map(el => el.toString()).join(', ')
    return `[${items}]`
  }
}

/**
 * RangeExpressionNode - 范围表达式节点
 */
export class RangeExpressionNode extends ASTNode {
  constructor(start, end, location = new Location()) {
    super(NodeType.RangeExpression, location)
    this.start = start   // 起始节点
    this.end = end       // 结束节点
    this.dataType = DataType.ARRAY
  }
  
  toJSON() {
    return {
      ...super.toJSON(),
      start: this.start.toJSON(),
      end: this.end.toJSON(),
      dataType: this.dataType
    }
  }
  
  toString() {
    return `${this.start.toString()}:${this.end.toString()}`
  }
}

/**
 * ASTVisitor - AST访问者基类
 */
export class ASTVisitor {
  /**
   * 访问节点
   */
  visit(node) {
    if (!node) return null
    
    const methodName = `visit${node.type}`
    if (this[methodName]) {
      return this[methodName](node)
    }
    return this.visitDefault(node)
  }
  
  /**
   * 默认访问方法
   */
  visitDefault(node) {
    console.warn(`No visit method for node type: ${node.type}`)
    return null
  }
  
  /**
   * 访问程序节点
   */
  visitProgram(node) {
    return node.body.map(child => this.visit(child))
  }
  
  /**
   * 访问数字字面量
   */
  visitNumberLiteral(node) {
    return node.value
  }
  
  /**
   * 访问字符串字面量
   */
  visitStringLiteral(node) {
    return node.value
  }
  
  /**
   * 访问布尔字面量
   */
  visitBooleanLiteral(node) {
    return node.value
  }
  
  /**
   * 访问标识符
   */
  visitIdentifier(node) {
    return node
  }
  
  /**
   * 访问变量
   */
  visitVariable(node) {
    return node
  }
  
  /**
   * 访问单元格引用
   */
  visitCellReference(node) {
    return node
  }
  
  /**
   * 访问二元表达式
   */
  visitBinaryExpression(node) {
    return {
      operator: node.operator,
      left: this.visit(node.left),
      right: this.visit(node.right)
    }
  }
  
  /**
   * 访问一元表达式
   */
  visitUnaryExpression(node) {
    return {
      operator: node.operator,
      operand: this.visit(node.operand)
    }
  }
  
  /**
   * 访问函数调用
   */
  visitFunctionCall(node) {
    return {
      name: node.name,
      arguments: node.arguments.map(arg => this.visit(arg))
    }
  }
  
  /**
   * 访问条件表达式
   */
  visitConditionalExpression(node) {
    return {
      condition: this.visit(node.condition),
      consequent: this.visit(node.consequent),
      alternate: this.visit(node.alternate)
    }
  }
  
  /**
   * 访问数组表达式
   */
  visitArrayExpression(node) {
    return node.elements.map(el => this.visit(el))
  }
  
  /**
   * 访问范围表达式
   */
  visitRangeExpression(node) {
    return {
      start: this.visit(node.start),
      end: this.visit(node.end)
    }
  }
}

/**
 * ASTBuilder - AST构建器
 */
export class ASTBuilder {
  /**
   * 从JSON构建AST
   */
  static fromJSON(json) {
    if (!json || !json.type) return null
    
    const location = json.location ? new Location(json.location.start, json.location.end, json.location.source) : new Location()
    
    switch (json.type) {
      case NodeType.Program:
        return new ProgramNode(json.body.map(node => ASTBuilder.fromJSON(node)), location)
      
      case NodeType.NumberLiteral:
        return new NumberLiteralNode(json.value, location)
      
      case NodeType.StringLiteral:
        return new StringLiteralNode(json.value, location)
      
      case NodeType.BooleanLiteral:
        return new BooleanLiteralNode(json.value, location)
      
      case NodeType.Identifier:
        return new IdentifierNode(json.name, json.code, location)
      
      case NodeType.Variable:
        return new VariableNode(json.name, location)
      
      case NodeType.CellReference:
        return new CellReferenceNode(json.reference, location)
      
      case NodeType.BinaryExpression:
        return new BinaryExpressionNode(
          json.operator,
          ASTBuilder.fromJSON(json.left),
          ASTBuilder.fromJSON(json.right),
          location
        )
      
      case NodeType.UnaryExpression:
        return new UnaryExpressionNode(
          json.operator,
          ASTBuilder.fromJSON(json.operand),
          location
        )
      
      case NodeType.FunctionCall:
        return new FunctionCallNode(
          json.name,
          json.arguments.map(arg => ASTBuilder.fromJSON(arg)),
          location
        )
      
      case NodeType.ConditionalExpression:
        return new ConditionalExpressionNode(
          ASTBuilder.fromJSON(json.condition),
          ASTBuilder.fromJSON(json.consequent),
          ASTBuilder.fromJSON(json.alternate),
          location
        )
      
      case NodeType.ArrayExpression:
        return new ArrayExpressionNode(
          json.elements.map(el => ASTBuilder.fromJSON(el)),
          location
        )
      
      case NodeType.RangeExpression:
        return new RangeExpressionNode(
          ASTBuilder.fromJSON(json.start),
          ASTBuilder.fromJSON(json.end),
          location
        )
      
      default:
        console.warn(`Unknown node type: ${json.type}`)
        return null
    }
  }
}