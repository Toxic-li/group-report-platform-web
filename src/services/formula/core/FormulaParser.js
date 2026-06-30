/**
 * Formula System - 语法解析器（Parser）
 * 
 * 将Token流转换为AST（抽象语法树）
 * 支持表达式、函数调用、条件表达式等
 */

import {
  TokenType,
  NodeType,
  FormulaError,
  ErrorType,
  Severity,
  Location
} from './FormulaTypes.js'

import {
  ProgramNode,
  NumberLiteralNode,
  StringLiteralNode,
  BooleanLiteralNode,
  IdentifierNode,
  VariableNode,
  CellReferenceNode,
  BinaryExpressionNode,
  UnaryExpressionNode,
  FunctionCallNode,
  ConditionalExpressionNode,
  ArrayExpressionNode,
  RangeExpressionNode
} from './FormulaAST.js'

/**
 * FormulaParser - 语法解析器
 */
export class FormulaParser {
  constructor(tokens, source = '') {
    this.tokens = tokens
    this.source = source
    this.position = 0
    this.errors = []
    
    // 运算符优先级
    this.operatorPrecedence = {
      '^': 7,   // 幂运算（最高）
      '*': 6,   // 乘法
      '/': 6,   // 除法
      '%': 6,   // 取模
      '+': 5,   // 加法
      '-': 5,   // 减法
      '<': 4,   // 小于
      '>': 4,   // 大于
      '<=': 4,  // 小于等于
      '>=': 4,  // 大于等于
      '=': 3,   // 等于
      '!=': 3,  // 不等于
      '<>': 3,  // 不等于
      'AND': 2, // 逻辑与
      'OR': 1,  // 逻辑或（最低）
      'NOT': 8  // 逻辑非（单目运算符，优先级较高）
    }
    
    // 右结合运算符
    this.rightAssociative = new Set(['^'])
  }
  
  /**
   * 执行语法解析
   */
  parse() {
    const statements = []
    
    while (!this.isAtEnd()) {
      const stmt = this.parseStatement()
      if (stmt) {
        statements.push(stmt)
      }
      
      // 跳过分号（如果有）
      if (this.check(TokenType.SEMICOLON)) {
        this.advance()
      }
    }
    
    const location = new Location(
      { line: 1, column: 0 },
      { line: this.lastLine(), column: this.lastColumn() }
    )
    
    return {
      ast: new ProgramNode(statements, location),
      errors: this.errors
    }
  }
  
  /**
   * 解析语句
   */
  parseStatement() {
    return this.parseExpression()
  }
  
  /**
   * 解析表达式（使用递归下降法）
   */
  parseExpression(precedence = 0) {
    // 解析左操作数（单目表达式或字面量）
    let left = this.parseUnaryExpression()
    
    if (!left) {
      return null
    }
    
    // 解析二元运算符
    while (!this.isAtEnd() && this.isBinaryOperator(this.currentToken())) {
      const operator = this.currentToken().value
      const opPrecedence = this.operatorPrecedence[operator] || 0
      
      // 如果当前运算符优先级小于或等于precedence，停止解析
      if (opPrecedence <= precedence) {
        break
      }
      
      // 判断是否右结合
      const nextPrecedence = this.rightAssociative.has(operator)
        ? opPrecedence - 1
        : opPrecedence
      
      this.advance() // 消耗运算符
      
      // 解析右操作数
      const right = this.parseExpression(nextPrecedence)
      
      if (!right) {
        this.addError(
          ErrorType.SYNTAX_ERROR,
          `运算符 '${operator}' 后缺少表达式`,
          this.currentToken().location
        )
        return left
      }
      
      left = new BinaryExpressionNode(operator, left, right, this.mergeLocation(left.location, right.location))
    }
    
    return left
  }
  
  /**
   * 解析单目表达式
   */
  parseUnaryExpression() {
    const token = this.currentToken()
    
    // 逻辑非
    if (this.check(TokenType.NOT)) {
      this.advance()
      const operand = this.parseUnaryExpression()
      if (!operand) {
        this.addError(
          ErrorType.SYNTAX_ERROR,
          'NOT运算符后缺少表达式',
          token.location
        )
        return null
      }
      return new UnaryExpressionNode('NOT', operand, this.mergeLocation(token.location, operand.location))
    }
    
    // 负号
    if (this.check(TokenType.MINUS)) {
      this.advance()
      const operand = this.parseUnaryExpression()
      if (!operand) {
        this.addError(
          ErrorType.SYNTAX_ERROR,
          '负号后缺少表达式',
          token.location
        )
        return null
      }
      return new UnaryExpressionNode('-', operand, this.mergeLocation(token.location, operand.location))
    }
    
    // 正号（忽略）
    if (this.check(TokenType.PLUS)) {
      this.advance()
      return this.parseUnaryExpression()
    }
    
    // 解析基础表达式
    return this.parsePrimaryExpression()
  }
  
  /**
   * 解析基础表达式（字面量、标识符、函数调用等）
   */
  parsePrimaryExpression() {
    const token = this.currentToken()
    
    // 数字
    if (this.check(TokenType.NUMBER)) {
      this.advance()
      const value = token.value
      // 处理百分比
      if (typeof value === 'string' && value.endsWith('%')) {
        const num = parseFloat(value.replace('%', '')) / 100
        return new NumberLiteralNode(num, token.location)
      }
      return new NumberLiteralNode(typeof value === 'string' ? parseFloat(value) : value, token.location)
    }
    
    // 字符串
    if (this.check(TokenType.STRING)) {
      this.advance()
      return new StringLiteralNode(token.value, token.location)
    }
    
    // 布尔值
    if (this.check(TokenType.BOOLEAN)) {
      this.advance()
      return new BooleanLiteralNode(token.value, token.location)
    }
    
    // 变量（如 $CurrentYear）
    if (this.check(TokenType.VARIABLE)) {
      this.advance()
      return new VariableNode(token.value, token.location)
    }
    
    // 单元格引用（如 A1, B2:C3）
    if (this.check(TokenType.CELL_REF)) {
      this.advance()
      return new CellReferenceNode(token.value, token.location)
    }
    
    // 标识符（指标引用）
    if (this.check(TokenType.IDENTIFIER)) {
      this.advance()
      return new IdentifierNode(token.value, null, token.location)
    }
    
    // 函数调用
    if (this.check(TokenType.FUNCTION)) {
      return this.parseFunctionCall()
    }
    
    // IF条件表达式
    if (this.check(TokenType.IF)) {
      return this.parseIfExpression()
    }
    
    // 括号表达式
    if (this.check(TokenType.LPAREN)) {
      return this.parseParenthesizedExpression()
    }
    
    // 方括号标识符（如 [营业收入]）
    if (this.check(TokenType.LBRACKET)) {
      return this.parseBracketedExpression()
    }
    
    // 数组表达式
    if (this.check(TokenType.LBRACE)) {
      return this.parseArrayExpression()
    }
    
    // 未知token
    this.addError(
      ErrorType.UNEXPECTED_TOKEN,
      `意外的token: ${token.type} (${token.value})`,
      token.location
    )
    this.advance()
    return null
  }
  
  /**
   * 解析函数调用
   */
  parseFunctionCall() {
    const funcToken = this.currentToken()
    const funcName = funcToken.value
    this.advance()
    
    // 检查是否有括号
    if (!this.check(TokenType.LPAREN)) {
      this.addError(
        ErrorType.SYNTAX_ERROR,
        `函数 ${funcName} 后缺少左括号`,
        this.currentToken().location
      )
      return new IdentifierNode(funcName, null, funcToken.location)
    }
    
    this.advance() // 消耗左括号

    // 解析参数列表
    const params = []

    if (!this.check(TokenType.RPAREN)) {
      params.push(this.parseExpression())

      while (this.check(TokenType.COMMA)) {
        this.advance() // 消耗逗号
        params.push(this.parseExpression())
      }
    }

    // 检查右括号
    if (!this.check(TokenType.RPAREN)) {
      this.addError(
        ErrorType.MISSING_TOKEN,
        `函数 ${funcName} 缺少右括号`,
        this.currentToken().location
      )
    } else {
      this.advance() // 消耗右括号
    }

    const location = this.mergeLocation(funcToken.location, this.currentToken().location)
    return new FunctionCallNode(funcName, params, location)
  }
  
  /**
   * 解析IF条件表达式
   */
  parseIfExpression() {
    const ifToken = this.currentToken()
    this.advance()
    
    // 检查是否有括号
    if (!this.check(TokenType.LPAREN)) {
      this.addError(
        ErrorType.SYNTAX_ERROR,
        'IF条件后缺少左括号',
        this.currentToken().location
      )
      return null
    }
    
    this.advance() // 消耗左括号
    
    // 解析条件
    const condition = this.parseExpression()
    
    if (!condition) {
      this.addError(
        ErrorType.SYNTAX_ERROR,
        'IF条件缺少条件表达式',
        ifToken.location
      )
      return null
    }
    
    // 检查逗号
    if (!this.check(TokenType.COMMA)) {
      this.addError(
        ErrorType.MISSING_TOKEN,
        'IF条件缺少逗号分隔符',
        this.currentToken().location
      )
      return null
    }
    this.advance()
    
    // 解析真值
    const consequent = this.parseExpression()
    
    if (!consequent) {
      this.addError(
        ErrorType.SYNTAX_ERROR,
        'IF条件缺少真值表达式',
        ifToken.location
      )
      return null
    }
    
    // 检查逗号
    if (!this.check(TokenType.COMMA)) {
      this.addError(
        ErrorType.MISSING_TOKEN,
        'IF条件缺少第二个逗号分隔符',
        this.currentToken().location
      )
      return null
    }
    this.advance()
    
    // 解析假值
    const alternate = this.parseExpression()
    
    if (!alternate) {
      this.addError(
        ErrorType.SYNTAX_ERROR,
        'IF条件缺少假值表达式',
        ifToken.location
      )
      return null
    }
    
    // 检查右括号
    if (!this.check(TokenType.RPAREN)) {
      this.addError(
        ErrorType.MISSING_TOKEN,
        'IF条件缺少右括号',
        this.currentToken().location
      )
    } else {
      this.advance()
    }
    
    const location = this.mergeLocation(ifToken.location, this.currentToken().location)
    return new ConditionalExpressionNode(condition, consequent, alternate, location)
  }
  
  /**
   * 解析括号表达式
   */
  parseParenthesizedExpression() {
    const lparenToken = this.currentToken()
    this.advance()
    
    const expr = this.parseExpression()
    
    if (!this.check(TokenType.RPAREN)) {
      this.addError(
        ErrorType.MISSING_TOKEN,
        '括号表达式缺少右括号',
        this.currentToken().location
      )
    } else {
      this.advance()
    }
    
    return expr
  }
  
  /**
   * 解析方括号表达式（标识符或数组）
   */
  parseBracketedExpression() {
    const lbracketToken = this.currentToken()
    this.advance()
    
    // 检查是否是范围引用（如 [A1:A10]）
    const token = this.currentToken()
    
    if (this.check(TokenType.CELL_REF)) {
      this.advance()
      
      // 范围引用
      if (this.check(TokenType.COLON)) {
        this.advance()
        
        const endToken = this.currentToken()
        if (this.check(TokenType.CELL_REF)) {
          this.advance()
          
          if (!this.check(TokenType.RBRACKET)) {
            this.addError(
              ErrorType.MISSING_TOKEN,
              '方括号范围引用缺少右括号',
              this.currentToken().location
            )
          } else {
            this.advance()
          }
          
          const startRef = new CellReferenceNode(token.value, token.location)
          const endRef = new CellReferenceNode(endToken.value, endToken.location)
          return new RangeExpressionNode(startRef, endRef, this.mergeLocation(lbracketToken.location, this.currentToken().location))
        }
      } else {
        // 单个单元格引用
        if (!this.check(TokenType.RBRACKET)) {
          this.addError(
            ErrorType.MISSING_TOKEN,
            '方括号单元格引用缺少右括号',
            this.currentToken().location
          )
        } else {
          this.advance()
        }
        
        return new CellReferenceNode(token.value, this.mergeLocation(lbracketToken.location, this.currentToken().location))
      }
    }
    
    // 检查是否是标识符（如 [营业收入]）
    if (this.check(TokenType.IDENTIFIER)) {
      this.advance()
      
      if (!this.check(TokenType.RBRACKET)) {
        this.addError(
          ErrorType.MISSING_TOKEN,
          '方括号标识符缺少右括号',
          this.currentToken().location
        )
      } else {
        this.advance()
      }
      
      return new IdentifierNode(token.value, null, this.mergeLocation(lbracketToken.location, this.currentToken().location))
    }
    
    this.addError(
      ErrorType.SYNTAX_ERROR,
      '方括号内表达式无效',
      lbracketToken.location
    )
    this.advance()
    return null
  }
  
  /**
   * 解析数组表达式
   */
  parseArrayExpression() {
    const lbraceToken = this.currentToken()
    this.advance()
    
    const elements = []
    
    if (!this.check(TokenType.RBRACE)) {
      elements.push(this.parseExpression())
      
      while (this.check(TokenType.COMMA)) {
        this.advance()
        elements.push(this.parseExpression())
      }
    }
    
    if (!this.check(TokenType.RBRACE)) {
      this.addError(
        ErrorType.MISSING_TOKEN,
        '数组表达式缺少右花括号',
        this.currentToken().location
      )
    } else {
      this.advance()
    }
    
    return new ArrayExpressionNode(elements, this.mergeLocation(lbraceToken.location, this.currentToken().location))
  }
  
  // ==================== 辅助方法 ====================
  
  /**
   * 当前token
   */
  currentToken() {
    return this.tokens[this.position] || { type: TokenType.EOF, value: null, location: new Location() }
  }
  
  /**
   * 上一个token
   */
  previousToken() {
    return this.tokens[this.position - 1]
  }
  
  /**
   * 查看下一个token（不移动位置）
   */
  peekToken(offset = 1) {
    return this.tokens[this.position + offset] || { type: TokenType.EOF, value: null, location: new Location() }
  }
  
  /**
   * 是否到达结尾
   */
  isAtEnd() {
    return this.currentToken().type === TokenType.EOF
  }
  
  /**
   * 检查当前token类型
   */
  check(type) {
    return this.currentToken().type === type
  }
  
  /**
   * 检查并消耗token
   */
  match(type) {
    if (this.check(type)) {
      this.advance()
      return true
    }
    return false
  }
  
  /**
   * 消耗当前token
   */
  advance() {
    if (!this.isAtEnd()) {
      this.position++
    }
    return this.previousToken()
  }
  
  /**
   * 添加错误
   */
  addError(type, message, location, severity = Severity.ERROR, suggestions = []) {
    this.errors.push(new FormulaError(type, message, location, severity, suggestions))
  }
  
  /**
   * 判断是否是二元运算符
   */
  isBinaryOperator(token) {
    const binaryOperators = [
      TokenType.PLUS,
      TokenType.MINUS,
      TokenType.MULTIPLY,
      TokenType.DIVIDE,
      TokenType.POWER,
      TokenType.PERCENT,
      TokenType.EQ,
      TokenType.NE,
      TokenType.LT,
      TokenType.GT,
      TokenType.LE,
      TokenType.GE,
      TokenType.AND,
      TokenType.OR
    ]
    
    return binaryOperators.includes(token.type)
  }
  
  /**
   * 合并两个位置
   */
  mergeLocation(loc1, loc2) {
    if (!loc1 || !loc2) return loc1 || loc2
    return new Location(loc1.start, loc2.end)
  }
  
  /**
   * 最后一行
   */
  lastLine() {
    const lastToken = this.tokens[this.tokens.length - 1]
    return lastToken?.location?.start?.line || 1
  }
  
  /**
   * 最后一列
   */
  lastColumn() {
    const lastToken = this.tokens[this.tokens.length - 1]
    return lastToken?.location?.end?.column || 0
  }
}

/**
 * parse - 简单函数式接口
 */
export function parse(source) {
  const lexer = new FormulaLexer(source)
  const { tokens, errors: lexerErrors } = lexer.tokenize()
  
  const parser = new FormulaParser(tokens, source)
  const { ast, errors: parserErrors } = parser.parse()
  
  return {
    ast,
    errors: [...lexerErrors, ...parserErrors]
  }
}