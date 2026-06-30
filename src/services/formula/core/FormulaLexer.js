/**
 * Formula System - 词法分析器（Lexer）
 * 
 * 将公式字符串转换为Token流
 * 支持指标引用、变量、单元格引用、函数、运算符等
 */

import { Token, TokenType, Location } from './FormulaTypes.js'

/**
 * FormulaLexer - 词法分析器
 */
export class FormulaLexer {
  constructor(source) {
    this.source = source
    this.tokens = []
    this.position = 0
    this.line = 1
    this.column = 0
    this.errors = []
    
    // 关键字
    this.keywords = new Set(['IF', 'AND', 'OR', 'NOT', 'TRUE', 'FALSE'])
    
    // 内置函数列表（常见函数）
    this.builtInFunctions = new Set([
      'SUM', 'AVG', 'AVERAGE', 'MAX', 'MIN', 'COUNT', 'COUNTDISTINCT',
      'ROUND', 'ABS', 'POWER', 'SQRT', 'CEIL', 'CEILING', 'FLOOR', 'MOD',
      'IF', 'IFS', 'CASE', 'SWITCH', 'AND', 'OR', 'NOT', 'ISNULL', 'NVL', 'COALESCE',
      'LEFT', 'RIGHT', 'MID', 'SUBSTRING', 'LEN', 'LENGTH', 'TRIM', 'UPPER', 'LOWER', 'CONCAT', 'REPLACE',
      'TODAY', 'NOW', 'YEAR', 'MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND', 'DATEADD', 'DATEDIFF',
      'RANK', 'ROW_NUMBER', 'LAG', 'LEAD', 'RUNNING_SUM', 'MOVING_AVG',
      'YOY', 'MOM', 'YTD', 'QTD', 'MTD',
      'RATE', 'PERCENT', 'COMPLETE_RATE', 'PROFIT_RATE', 'GROWTH_RATE'
    ])
  }
  
  /**
   * 执行词法分析
   */
  tokenize() {
    this.tokens = []
    this.position = 0
    this.line = 1
    this.column = 0
    this.errors = []
    
    while (this.position < this.source.length) {
      this.scanToken()
    }
    
    // 添加EOF token
    this.tokens.push(new Token(TokenType.EOF, null, this.getCurrentLocation()))
    
    return {
      tokens: this.tokens,
      errors: this.errors
    }
  }
  
  /**
   * 扫描单个Token
   */
  scanToken() {
    const ch = this.currentChar()
    
    // 跳过空白字符
    if (this.isWhitespace(ch)) {
      this.skipWhitespace()
      return
    }
    
    // 跳过注释
    if (ch === '/' && this.peekChar() === '/') {
      this.skipLineComment()
      return
    }
    
    // 数字
    if (this.isDigit(ch) || (ch === '.' && this.isDigit(this.peekChar()))) {
      this.scanNumber()
      return
    }
    
    // 字符串
    if (ch === '"' || ch === "'") {
      this.scanString(ch)
      return
    }
    
    // 标识符或关键字（支持中文和特殊字符）
    if (this.isIdentifierStart(ch)) {
      this.scanIdentifier()
      return
    }
    
    // 方括号内的标识符（如 [营业收入]）
    if (ch === '[') {
      this.scanBracketedIdentifier()
      return
    }
    
    // 变量（如 $CurrentYear）
    if (ch === '$') {
      this.scanVariable()
      return
    }
    
    // 单元格引用（如 A1, B2:C3）
    if (this.isLetter(ch) && this.isCellReferenceStart()) {
      this.scanCellReference()
      return
    }
    
    // 运算符和分隔符
    this.scanOperator()
  }
  
  /**
   * 扫描数字
   */
  scanNumber() {
    const start = this.getCurrentLocation()
    let value = ''
    
    // 整数部分
    while (this.isDigit(this.currentChar())) {
      value += this.currentChar()
      this.advance()
    }
    
    // 小数部分
    if (this.currentChar() === '.') {
      value += '.'
      this.advance()
      
      while (this.isDigit(this.currentChar())) {
        value += this.currentChar()
        this.advance()
      }
    }
    
    // 科学计数法（如 1.5E-3）
    if (this.currentChar() === 'E' || this.currentChar() === 'e') {
      value += this.currentChar()
      this.advance()
      
      if (this.currentChar() === '+' || this.currentChar() === '-') {
        value += this.currentChar()
        this.advance()
      }
      
      while (this.isDigit(this.currentChar())) {
        value += this.currentChar()
        this.advance()
      }
    }
    
    // 百分号
    if (this.currentChar() === '%') {
      value += '%'
      this.advance()
      const end = this.getCurrentLocation()
      this.tokens.push(new Token(TokenType.NUMBER, value, { start, end }, value))
      return
    }
    
    const end = this.getCurrentLocation()
    this.tokens.push(new Token(TokenType.NUMBER, parseFloat(value), { start, end }, value))
  }
  
  /**
   * 扫描字符串
   */
  scanString(quote) {
    const start = this.getCurrentLocation()
    let value = ''
    
    this.advance() // 跳过开始的引号
    
    while (this.position < this.source.length && this.currentChar() !== quote) {
      if (this.currentChar() === '\\') {
        this.advance() // 跳过反斜杠
        const escaped = this.currentChar()
        switch (escaped) {
          case 'n': value += '\n'; break
          case 'r': value += '\r'; break
          case 't': value += '\t'; break
          case '\\': value += '\\'; break
          case '"': value += '"'; break
          case "'": value += "'"; break
          default: value += escaped
        }
      } else {
        value += this.currentChar()
      }
      this.advance()
    }
    
    if (this.currentChar() !== quote) {
      this.errors.push({
        type: 'LEXER_ERROR',
        message: '字符串未闭合',
        location: start
      })
    } else {
      this.advance() // 跳过结束的引号
    }
    
    const end = this.getCurrentLocation()
    this.tokens.push(new Token(TokenType.STRING, value, { start, end }, `${quote}${value}${quote}`))
  }
  
  /**
   * 扫描标识符（函数名或指标名）
   */
  scanIdentifier() {
    const start = this.getCurrentLocation()
    let value = ''
    
    while (this.isIdentifierPart(this.currentChar())) {
      value += this.currentChar()
      this.advance()
    }
    
    const end = this.getCurrentLocation()
    
    // 检查是否为关键字或函数
    const upperValue = value.toUpperCase()
    
    if (upperValue === 'TRUE') {
      this.tokens.push(new Token(TokenType.BOOLEAN, true, { start, end }, value))
    } else if (upperValue === 'FALSE') {
      this.tokens.push(new Token(TokenType.BOOLEAN, false, { start, end }, value))
    } else if (this.builtInFunctions.has(upperValue)) {
      this.tokens.push(new Token(TokenType.FUNCTION, upperValue, { start, end }, value))
    } else if (this.keywords.has(upperValue)) {
      this.tokens.push(new Token(TokenType[upperValue] || TokenType.IDENTIFIER, upperValue, { start, end }, value))
    } else {
      this.tokens.push(new Token(TokenType.IDENTIFIER, value, { start, end }, value))
    }
  }
  
  /**
   * 扫描方括号内的标识符（如 [营业收入]）
   */
  scanBracketedIdentifier() {
    const start = this.getCurrentLocation()
    this.advance() // 跳过 [
    
    let value = ''
    while (this.position < this.source.length && this.currentChar() !== ']') {
      value += this.currentChar()
      this.advance()
    }
    
    if (this.currentChar() !== ']') {
      this.errors.push({
        type: 'LEXER_ERROR',
        message: '方括号未闭合',
        location: start
      })
    } else {
      this.advance() // 跳过 ]
    }
    
    const end = this.getCurrentLocation()
    
    // 检查是否为函数（如 [SUM]）
    const upperValue = value.toUpperCase()
    if (this.builtInFunctions.has(upperValue)) {
      this.tokens.push(new Token(TokenType.FUNCTION, upperValue, { start, end }, `[${value}]`))
    } else {
      this.tokens.push(new Token(TokenType.IDENTIFIER, value, { start, end }, `[${value}]`))
    }
  }
  
  /**
   * 扫描变量（如 $CurrentYear）
   */
  scanVariable() {
    const start = this.getCurrentLocation()
    this.advance() // 跳过 $
    
    let value = '$'
    while (this.isIdentifierPart(this.currentChar())) {
      value += this.currentChar()
      this.advance()
    }
    
    const end = this.getCurrentLocation()
    this.tokens.push(new Token(TokenType.VARIABLE, value, { start, end }, value))
  }
  
  /**
   * 扫描单元格引用（如 A1, B2:C3）
   */
  scanCellReference() {
    const start = this.getCurrentLocation()
    let value = ''
    
    // 列部分（字母）
    while (this.isLetter(this.currentChar())) {
      value += this.currentChar()
      this.advance()
    }
    
    // 行部分（数字）
    while (this.isDigit(this.currentChar())) {
      value += this.currentChar()
      this.advance()
    }
    
    // 范围引用（如 A1:A10）
    if (this.currentChar() === ':') {
      value += ':'
      this.advance()
      
      // 列部分（字母）
      while (this.isLetter(this.currentChar())) {
        value += this.currentChar()
        this.advance()
      }
      
      // 行部分（数字）
      while (this.isDigit(this.currentChar())) {
        value += this.currentChar()
        this.advance()
      }
    }
    
    const end = this.getCurrentLocation()
    this.tokens.push(new Token(TokenType.CELL_REF, value, { start, end }, value))
  }
  
  /**
   * 扫描运算符和分隔符
   */
  scanOperator() {
    const start = this.getCurrentLocation()
    const ch = this.currentChar()
    
    let tokenType = null
    let value = ch
    
    // 双字符运算符
    if (this.position + 1 < this.source.length) {
      const nextChar = this.peekChar()
      const twoChars = ch + nextChar
      
      switch (twoChars) {
        case '>=': tokenType = TokenType.GE; value = twoChars; break
        case '<=': tokenType = TokenType.LE; value = twoChars; break
        case '!=': tokenType = TokenType.NE; value = twoChars; break
        case '<>': tokenType = TokenType.NE; value = twoChars; break
      }
      
      if (tokenType) {
        this.advance()
        this.advance()
        const end = this.getCurrentLocation()
        this.tokens.push(new Token(tokenType, value, { start, end }, value))
        return
      }
    }
    
    // 单字符运算符和分隔符
    switch (ch) {
      case '+': tokenType = TokenType.PLUS; break
      case '-': tokenType = TokenType.MINUS; break
      case '*': tokenType = TokenType.MULTIPLY; break
      case '/': tokenType = TokenType.DIVIDE; break
      case '^': tokenType = TokenType.POWER; break
      case '%': tokenType = TokenType.PERCENT; break
      case '=': tokenType = TokenType.EQ; break
      case '>': tokenType = TokenType.GT; break
      case '<': tokenType = TokenType.LT; break
      case '(':
        // 检查前面是否是函数名
        const lastToken = this.tokens[this.tokens.length - 1]
        if (lastToken && lastToken.type === TokenType.FUNCTION) {
          tokenType = TokenType.LPAREN
        } else {
          tokenType = TokenType.LPAREN
        }
        break
      case ')': tokenType = TokenType.RPAREN; break
      case '[': tokenType = TokenType.LBRACKET; break
      case ']': tokenType = TokenType.RBRACKET; break
      case '{': tokenType = TokenType.LBRACE; break
      case '}': tokenType = TokenType.RBRACE; break
      case ',': tokenType = TokenType.COMMA; break
      case ':': tokenType = TokenType.COLON; break
      case ';': tokenType = TokenType.SEMICOLON; break
      case '.': tokenType = TokenType.DOT; break
      default:
        // 检查中文标点符号，提供更友好的错误提示
        const chinesePunctuationHint = this.getChinesePunctuationHint(ch)
        if (chinesePunctuationHint) {
          this.errors.push({
            type: 'LEXER_ERROR',
            message: chinesePunctuationHint,
            location: start
          })
        } else {
          this.errors.push({
            type: 'LEXER_ERROR',
            message: `未知字符: '${ch}'`,
            location: start
          })
        }
        this.advance()
        return
    }
    
    this.advance()
    const end = this.getCurrentLocation()
    this.tokens.push(new Token(tokenType, value, { start, end }, value))
  }
  
  /**
   * 跳过空白字符
   */
  skipWhitespace() {
    while (this.isWhitespace(this.currentChar())) {
      if (this.currentChar() === '\n') {
        this.line++
        this.column = 0
      } else {
        this.column++
      }
      this.advance()
    }
  }
  
  /**
   * 跳过行注释
   */
  skipLineComment() {
    this.advance() // 跳过第一个 /
    this.advance() // 跳过第二个 /
    
    while (this.position < this.source.length && this.currentChar() !== '\n') {
      this.advance()
    }
    
    if (this.currentChar() === '\n') {
      this.line++
      this.column = 0
      this.advance()
    }
  }
  
  /**
   * 判断是否是单元格引用的开始
   */
  isCellReferenceStart() {
    // 后面必须是数字
    const nextPos = this.position + 1
    if (nextPos >= this.source.length) return false
    
    let col = ''
    let i = this.position
    
    // 收集列字母
    while (i < this.source.length && this.isLetter(this.source[i])) {
      col += this.source[i]
      i++
    }
    
    // 检查后面是否有数字
    return i < this.source.length && this.isDigit(this.source[i])
  }
  
  /**
   * 当前字符
   */
  currentChar() {
    return this.source[this.position] || '\0'
  }
  
  /**
   * 下一个字符（不移动位置）
   */
  peekChar(offset = 1) {
    return this.source[this.position + offset] || '\0'
  }
  
  /**
   * 向前移动一个字符
   */
  advance() {
    this.position++
    this.column++
  }
  
  /**
   * 获取当前位置
   */
  getCurrentLocation() {
    return new Location({ line: this.line, column: this.column })
  }
  
  /**
   * 判断是否是空白字符
   */
  isWhitespace(ch) {
    return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r'
  }
  
  /**
   * 判断是否是数字
   */
  isDigit(ch) {
    return ch >= '0' && ch <= '9'
  }
  
  /**
   * 判断是否是字母
   */
  isLetter(ch) {
    return (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z')
  }
  
  /**
   * 判断是否是标识符开始字符（支持中文）
   */
  isIdentifierStart(ch) {
    return this.isLetter(ch) || ch === '_' || ch === '$' || this.isChinese(ch)
  }
  
  /**
   * 判断是否是标识符部分字符
   */
  isIdentifierPart(ch) {
    return this.isIdentifierStart(ch) || this.isDigit(ch)
  }
  
  /**
   * 判断是否是中文字符
   */
  isChinese(ch) {
    const code = ch.charCodeAt(0)
    return code >= 0x4E00 && code <= 0x9FFF
  }

  /**
   * 获取中文标点符号的提示信息
   */
  getChinesePunctuationHint(ch) {
    const chinesePunctuationMap = {
      '（': '请使用英文左括号 ( 代替中文括号',
      '）': '请使用英文右括号 ) 代替中文括号',
      '，': '请使用英文逗号 , 代替中文逗号',
      '。': '请使用英文句号 . 代替中文句号',
      '：': '请使用英文冒号 : 代替中文冒号',
      '；': '请使用英文分号 ; 代替中文分号',

      '"': '请使用英文双引号 " 代替中文双引号',
      "'": '请使用英文单引号 \' 代替中文单引号',

      '【': '请使用英文方括号 [ 代替中文方括号',
      '】': '请使用英文方括号 ] 代替中文方括号',

      '＋': '请使用英文加号 + 代替中文加号',
      '－': '请使用英文减号 - 代替中文减号',
      '×': '请使用星号 * 代替乘号',
      '÷': '请使用斜杠 / 代替除号',
      '＝': '请使用英文等号 = 代替中文等号',
      '＜': '请使用英文小于号 < 代替中文小于号',
      '＞': '请使用英文大于号 > 代替中文大于号',
    }
    return chinesePunctuationMap[ch] || null
  }
}

/**
 * tokenize - 简单函数式接口
 */
export function tokenize(source) {
  const lexer = new FormulaLexer(source)
  return lexer.tokenize()
}