/**
 * 服务层 - 模板解析器、合并单元格引擎、公式计算器
 * 
 * 将 ReportTemplate 转换为 Univer 可用的 WorkbookConfig
 */

import { ReportTemplate, MergeCell, WorkbookConfig } from '@/types/report.js'

// ==================== 模板解析器 ====================
export class TemplateParser {
  constructor(template) {
    this.template = template
    this.rowMap = new Map()   // rowId -> rowIndex
    this.colMap = new Map()   // colId -> colIndex
    this.merges = []
    this.cellData = {}
  }

  /**
   * 解析模板为 Univer WorkbookConfig
   */
  parse() {
    const flatRows = this.template.getFlatRows()
    const flatCols = this.template.getFlatColumns()
    const leafCols = this.template.getLeafColumns() // 数据列只用叶子节点
    const colDepth = this.template.getColumnDepth()
    const rowDepth = this.template.getRowDepth()

    // 构建行列映射（数据映射用叶子列）
    this.buildRowMap(flatRows)
    this.buildColMap(leafCols)

    // 总行数 = 行头深度 + 数据行数 + 1(表头标题行)
    const totalRows = colDepth + flatRows.length + 1
    // 总列数 = 行头深度 + 叶子列数
    const totalCols = rowDepth + leafCols.length

    // 1. 生成列头多级表头（合并单元格）- 用全部扁平列处理表头层级
    this.generateColumnHeaders(flatCols, colDepth, rowDepth)

    // 2. 生成行头（左侧）
    this.generateRowHeaders(flatRows, colDepth, rowDepth)

    // 3. 填充数据单元格 - 用叶子列映射
    this.fillDataCells()

    // 4. 生成列宽配置 - 用叶子列
    const columnData = this.generateColumnWidth(rowDepth, leafCols)

    // 5. 生成行高配置
    const rowData = this.generateRowHeight(colDepth, flatRows)

    return new WorkbookConfig({
      sheetName: this.template.name,
      frozenRowCount: colDepth,      // 冻结所有列头行（支持4级表头）
      frozenColumnCount: 3,          // 冻结前3列（序号/层级/指标名称）
      rowData,
      columnData,
      cellData: this.cellData,
      mergeData: this.merges
    })
  }

  buildRowMap(rows) {
    rows.forEach((row, index) => {
      this.rowMap.set(row.id, index)
    })
  }

  buildColMap(cols) {
    cols.forEach((col, index) => {
      this.colMap.set(col.id, index)
    })
  }

  /**
   * 生成多级列头 - 支持任意层级深度的合并单元格
   * 表头层级从0开始，对应样式级别1-4
   */
  generateColumnHeaders(flatCols, colDepth, rowDepth) {
    // 按层级分组处理列头（level 0 -> 样式级别1, level 1 -> 样式级别2...）
    for (let level = 0; level < colDepth; level++) {
      const rowIndex = level // 列头从第0行开始
      const styleLevel = Math.min(level + 1, 4) // 映射到4级样式体系
      let startCol = rowDepth

      for (const col of flatCols) {
        if (col.level !== level) continue

        // 计算该节点跨越的列数（叶子节点数量）
        const leafCount = this.countLeafColumns(col)

        // 写入列头文字
        const cellKey = `${rowIndex}-${startCol}`
        this.cellData[cellKey] = {
          v: col.title,
          s: this.getHeaderStyle(styleLevel),
          headerLevel: styleLevel // 新增：标记表头样式级别
        }

        // 如果有子节点或跨多列，创建合并
        if (leafCount > 1 || (col.children && col.children.length > 0)) {
          this.merges.push(new MergeCell({
            startRow: rowIndex,
            endRow: rowIndex,
            startCol: startCol,
            endCol: startCol + leafCount - 1,
            value: col.title
          }))
        }

        startCol += leafCount
      }
    }
  }

  /**
   * 生成行头（左侧树形结构）- 填充3个冻结列
   * 第1列：行号 | 第2列：层级标记 | 第3列：指标名称（树形）
   */
  generateRowHeaders(flatRows, colDepth, rowDepth) {
    const dataStartRow = colDepth

    flatRows.forEach((row, index) => {
      const rowIndex = dataStartRow + index

      // 第1列：序号
      this.cellData[`${rowIndex}-0`] = {
        v: String(index + 1),
        s: { bg: '#F8FAFC', cl: '#94A3B8', fs: 11, ht: 1, vt: 1 }
      }

      // 第2列：层级缩进标记
      const levelMark = row.level > 0 ? '\u2514'.repeat(Math.min(row.level, 4)) : ''
      this.cellData[`${rowIndex}-1`] = {
        v: levelMark,
        s: { bg: '#FAFBFC', cl: '#CBD5E1', fs: 10, ht: 1, vt: 1 }
      }

      // 第3列：指标名称（树形展示）
      const prefix = (row.children && row.children.length > 0) ? '' : ''
      const indent = '  '.repeat(row.level || 0)
      const displayValue = `${indent}${prefix}${row.name}`
      this.cellData[`${rowIndex}-2`] = {
        v: displayValue,
        s: this.getRowHeaderStyle(row.level || 0, row.isSummary)
      }
    })
  }

  /**
   * 填充数据区域单元格
   */
  fillDataCells() {
    const colDepth = this.template.getColumnDepth()
    const rowDepth = this.template.getRowDepth()
    const flatRows = this.template.getFlatRows()
    const flatCols = this.template.getFlatColumns()

    const dataStartRow = colDepth
    const dataStartCol = rowDepth

    for (const val of this.template.values) {
      const rowIndex = this.rowMap.get(val.rowId)
      const colIndex = this.colMap.get(val.columnId)

      if (rowIndex !== undefined && colIndex !== undefined) {
        const actualRow = dataStartRow + rowIndex
        const actualCol = dataStartCol + colIndex
        const cellKey = `${actualRow}-${actualCol}`

        let displayValue = val.value

        // 格式化数值
        if (val.format === 'thousands') {
          displayValue = Number(val.value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        } else if (val.format === 'percent') {
          displayValue = `${Number(val.value).toFixed(2)}%`
        } else if (val.format === 'number') {
          displayValue = Number(val.value).toFixed(2)
        }

        this.cellData[cellKey] = {
          v: displayValue,
          s: this.getDataCellStyle(val.readOnly),
          f: val.formula || undefined
        }
      }
    }
  }

  /**
   * 生成列宽配置
   * 冻结前3列：序号(50) | 层级标记(60) | 指标名称(240)
   */
  generateColumnWidth(rowDepth, flatCols) {
    const columnData = []

    // 冻结列：序号 + 层级缩进 + 指标名称
    columnData.push({ w: 50 })   // 第1列：行号/序号
    columnData.push({ w: 60 })   // 第2列：层级标记
    columnData.push({ w: 240 })  // 第3列：指标名称（树形展示）

    // 数据列宽度
    for (const col of flatCols) {
      columnData.push({
        w: Math.max(col.width || 100, 80)
      })
    }

    return columnData
  }

  /**
   * 生成行高配置
   */
  generateRowHeight(colDepth, flatRows) {
    const rowData = []

    // 表头行高
    for (let i = 0; i < colDepth; i++) {
      rowData.push({ h: 36 })
    }

    // 数据行高
    for (const row of flatRows) {
      rowData.push({ h: 30 })
    }

    return rowData
  }

  // ==================== 辅助方法 ====================

  countLeafColumns(column) {
    if (!column.children || column.children.length === 0) {
      return 1
    }
    let count = 0
    for (const child of column.children) {
      count += this.countLeafColumns(child)
    }
    return count
  }

  /**
   * 4级表头样式体系
   * styleLevel: 1=深蓝(一级) | 2=中蓝(二级) | 3=浅蓝(三级) | 4=浅灰蓝(四级)
   */
  getHeaderStyle(styleLevel) {
    const styles = {
      // 一级表头：深蓝色背景，16px，加粗
      1: { bg: '#0D2137', cl: '#FFFFFF', bl: 1, bc: 'rgba(255,255,255,0.15)', bt: 0, bb: 1, br: 1, fs: 15, bold: true, ht: 1, vt: 1 },
      // 二级表头：中蓝色背景，13px
      2: { bg: '#1B3A5C', cl: '#FFFFFF', bl: 1, bc: 'rgba(255,255,255,0.12)', bt: 0, bb: 1, br: 1, fs: 13, bold: true, ht: 1, vt: 1 },
      // 三级表头：浅蓝色背景
      3: { bg: '#2E6B9E', cl: '#FFFFFF', bl: 1, bc: 'rgba(255,255,255,0.10)', bt: 0, bb: 1, br: 1, fs: 12, bold: false, ht: 1, vt: 1 },
      // 四级表头：浅灰蓝背景，深色文字
      4: { bg: '#5A9BC9', cl: '#0D2137', bl: 1, bc: 'rgba(0,0,0,0.08)', bt: 0, bb: 1, br: 1, fs: 11, bold: false, ht: 1, vt: 1 },
    }
    return styles[styleLevel] || styles[1]
  }

  getRowHeaderStyle(level, isSummary) {
    if (isSummary) {
      // 汇总行：浅蓝背景 + 深蓝文字 + 加粗
      return {
        bg: '#EEF6FF',
        cl: '#1B3A5C',
        bl: 1,
        bc: '#D4E3F5',
        br: 1,
        bt: 1,
        bb: 1,
        fs: 12,
        bold: true,
        ht: 0, // 左对齐
        vt: 1
      }
    }

    // 普通行：根据层级微调背景色
    const bgColors = ['#FFFFFF', '#FAFBFC', '#F7F9FB', '#F4F6F9']
    return {
      bg: bgColors[Math.min(level, bgColors.length - 1)],
      cl: '#334155',
      bl: 1,
      bc: '#EDF2F7',
      br: 1,
      bt: 1,
      bb: 1,
      fs: 12,
      bold: false,
      ht: 0, // 左对齐
      vt: 1
    }
  }

  getDataCellStyle(readOnly) {
    return {
      bg: readOnly ? '#f8f9fa' : '#ffffff',
      cl: '#222',
      bl: 1,
      bc: '#e8eaed',
      br: 1,
      bt: 1,
      bb: 1,
      fs: 12,
      ht: 2, // 居中
      vt: 1
    }
  }
}

// ==================== 公式计算引擎（增强版） ====================
export class FormulaEngine {
  constructor(cellData) {
    this.cellData = cellData
    this.formulaCache = new Map()
    this.dependencyGraph = new Map()   // cellKey -> Set of dependent cellKeys
    this.reverseDeps = new Map()       // cellKey -> Set of cells that depend on it
    this.calculationOrder = []         // 拓扑排序后的计算顺序
    this._building = new Set()         // 循环检测用：正在构建中的节点
  }

  /**
   * 计算所有公式（带依赖追踪和循环检测）
   * 返回 { [cellKey]: calculatedValue }
   */
  calculateAll() {
    // 1. 构建依赖图
    this.buildDependencyGraph()

    // 2. 拓扑排序确定计算顺序
    this.calculationOrder = this.topologicalSort()

    // 3. 按序计算每个公式
    const results = {}
    for (const key of this.calculationOrder) {
      const cell = this.cellData[key]
      if (cell && cell.f) {
        try {
          results[key] = this.evaluateFormula(cell.f, key)
          // 将计算结果写回 cellData 的 v 字段，供其他公式引用
          this.cellData[key] = { ...cell, v: results[key] }
        } catch (e) {
          results[key] = '#ERROR'
        }
      }
    }

    return results
  }

  /**
   * 构建公式依赖图
   * 解析每个公式的引用关系
   */
  buildDependencyGraph() {
    this.dependencyGraph.clear()
    this.reverseDeps.clear()

    for (const [key, cell] of Object.entries(this.cellData)) {
      if (!cell.f) continue

      const deps = this.extractDependencies(cell.f)
      this.dependencyGraph.set(key, new Set(deps))

      // 建立反向依赖（用于增量更新）
      for (const dep of deps) {
        if (!this.reverseDeps.has(dep)) {
          this.reverseDeps.set(dep, new Set())
        }
        this.reverseDeps.get(dep).add(key)
      }
    }
  }

  /**
   * 从公式字符串中提取引用的单元格坐标
   * 支持: C2:C10, A1, SUM(C2:C10), 算术表达式中的坐标
   *
   * 注意：colToNum 是 1-based（A=1, B=2, C=3），但 cellData 的列索引是 0-based
   * 所以需要 colToNum(col) - 1 来匹配正确的 cellData key
   */
  extractDependencies(formulaStr) {
    const deps = new Set()
    if (!formulaStr.startsWith('=')) return deps

    // 匹配单元格引用如 C2, D10, AA1 等
    const cellRefPattern = /([A-Z]+)(\d+)/g
    let match
    while ((match = cellRefPattern.exec(formulaStr)) !== null) {
      const col = match[1]
      const row = parseInt(match[2])
      // colToNum 是 1-based，cellData 列索引是 0-based，需要减 1
      deps.add(`${row}-${this.colToNum(col) - 1}`)
    }

    // 匹配范围引用如 C2:C10
    const rangePattern = /([A-Z])(\d+):([A-Z])(\d+)/g
    while ((match = rangePattern.exec(formulaStr)) !== null) {
      const startRow = parseInt(match[2]), endRow = parseInt(match[4])
      // colToNum 是 1-based，cellData 列索引是 0-based，需要减 1
      const startCol = this.colToNum(match[1]) - 1, endCol = this.colToNum(match[3]) - 1
      for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
          deps.add(`${r}-${c}`)
        }
      }
    }

    return deps
  }

  /**
   * 拓扑排序 - 确保依赖项先于被依赖者计算
   * 同时检测循环依赖
   */
  topologicalSort() {
    const visited = new Set()
    const result = []
    const visiting = new Set()  // 用于检测循环

    const visit = (key) => {
      if (visited.has(key)) return
      if (visiting.has(key)) {
        console.warn(`[FormulaEngine] 检测到循环依赖涉及单元格: ${key}`)
        return
      }
      visiting.add(key)

      const deps = this.dependencyGraph.get(key)
      if (deps) {
        for (const dep of deps) {
          visit(dep)
        }
      }

      visiting.delete(key)
      visited.add(key)
      result.push(key)
    }

    for (const key of this.dependencyGraph.keys()) {
      visit(key)
    }

    return result
  }

  /**
   * 计算单个公式（带缓存 + 循环保护）
   */
  evaluateFormula(formulaStr, contextKey = null) {
    // 缓存检查
    if (this.formulaCache.has(formulaStr)) {
      return this.formulaCache.get(formulaStr)
    }

    // 循环检测
    if (contextKey && this._building.has(contextKey)) {
      throw new Error(`循环依赖检测: ${contextKey}`)
    }
    if (contextKey) this._building.add(contextKey)

    let result
    try {
      if (formulaStr.startsWith('=')) {
        const expr = formulaStr.substring(1).trim()

        // SUM 公式: =SUM(C2:C10)
        const sumMatch = expr.match(/^SUM\(([A-Z])(\d+):([A-Z])(\d+)\)$/)
        if (sumMatch) {
          result = this.calcRangeSum(sumMatch[1], parseInt(sumMatch[2]), sumMatch[3], parseInt(sumMatch[4]))
          this.formulaCache.set(formulaStr, result)
          return result
        }

        // AVERAGE 公式
        const avgMatch = expr.match(/^AVERAGE\(([A-Z])(\d+):([A-Z])(\d+)\)$/)
        if (avgMatch) {
          result = this.calcRangeAvg(avgMatch[1], parseInt(avgMatch[2]), avgMatch[3], parseInt(avgMatch[4]))
          this.formulaCache.set(formulaStr, result)
          return result
        }

        // MAX 公式
        const maxMatch = expr.match(/^MAX\(([A-Z])(\d+):([A-Z])(\d+)\)$/)
        if (maxMatch) {
          result = this.calcRangeMax(maxMatch[1], parseInt(maxMatch[2]), maxMatch[3], parseInt(maxMatch[4]))
          this.formulaCache.set(formulaStr, result)
          return result
        }

        // MIN 公式
        const minMatch = expr.match(/^MIN\(([A-Z])(\d+):([A-Z])(\d+)\)$/)
        if (minMatch) {
          result = this.calcRangeMin(minMatch[1], parseInt(minMatch[2]), minMatch[3], parseInt(minMatch[4]))
          this.formulaCache.set(formulaStr, result)
          return result
        }

        // COUNT 公式
        const countMatch = expr.match(/^COUNT\(([A-Z])(\d+):([A-Z])(\d+)\)$/)
        if (countMatch) {
          result = this.calcRangeCount(countMatch[1], parseInt(countMatch[2]), countMatch[3], parseInt(countMatch[4]))
          this.formulaCache.set(formulaStr, result)
          return result
        }

        // IF 公式: =IF(condition, trueVal, falseVal)
        const ifMatch = expr.match(/^IF\((.+),(.+),(.+)\)$/)
        if (ifMatch) {
          const condition = this.evalArithmetic(ifMatch[1].trim())
          result = condition ? this.evalArithmetic(ifMatch[2].trim()) : this.evalArithmetic(ifMatch[3].trim())
          this.formulaCache.set(formulaStr, result)
          return result
        }

        // 简单算术表达式（支持单元格引用）
        result = this.evalArithmeticWithRefs(expr)
        this.formulaCache.set(formulaStr, result)
        return result
      }

      result = formulaStr
    } finally {
      if (contextKey) this._building.delete(contextKey)
    }

    return result
  }

  /**
   * 带单元格引用的算术表达式求值
   * 将 C2 这样的引用替换为实际值后再计算
   *
   * 注意：colToNum 是 1-based（A=1, B=2, C=3），但 cellData 的列索引是 0-based
   * 所以需要 colToNum(col) - 1 来匹配正确的 cellData key
   */
  evalArithmeticWithRefs(expr) {
    // 替换单元格引用为实际值
    const resolvedExpr = expr.replace(/([A-Z]+)(\d+)/g, (_, col, row) => {
      // colToNum 是 1-based，cellData 列索引是 0-based，需要减 1
      const key = `${row}-${this.colToNum(col) - 1}`
      const cell = this.cellData[key]
      if (!cell) return '0'
      const num = parseFloat(String(cell.v).replace(/,/g, ''))
      return isNaN(num) ? '0' : String(num)
    })

    return this.evalArithmetic(resolvedExpr)
  }

  /**
   * 范围计算方法
   * 注意：colToNum 是 1-based，cellData 列索引是 0-based
   */
  calcRangeSum(startCol, startRow, endCol, endRow) {
    let sum = 0
    for (let r = startRow; r <= endRow; r++) {
      for (let c = this.colToNum(startCol) - 1; c <= this.colToNum(endCol) - 1; c++) {
        const key = `${r}-${c}`
        const cell = this.cellData[key]
        if (cell && typeof cell.v === 'number') {
          sum += cell.v
        } else if (cell && typeof cell.v === 'string') {
          const num = parseFloat(cell.v.replace(/,/g, ''))
          if (!isNaN(num)) sum += num
        }
      }
    }
    return parseFloat(sum.toFixed(2))
  }

  calcRangeAvg(startCol, startRow, endCol, endRow) {
    let sum = 0, count = 0
    for (let r = startRow; r <= endRow; r++) {
      for (let c = this.colToNum(startCol) - 1; c <= this.colToNum(endCol) - 1; c++) {
        const key = `${r}-${c}`
        const cell = this.cellData[key]
        if (cell && typeof cell.v === 'number') { sum += cell.v; count++ }
        else if (cell && typeof cell.v === 'string') {
          const num = parseFloat(cell.v.replace(/,/g, ''))
          if (!isNaN(num)) { sum += num; count++ }
        }
      }
    }
    return count > 0 ? parseFloat((sum / count).toFixed(2)) : 0
  }

  calcRangeMax(startCol, startRow, endCol, endRow) {
    let max = -Infinity
    let hasValue = false
    for (let r = startRow; r <= endRow; r++) {
      for (let c = this.colToNum(startCol) - 1; c <= this.colToNum(endCol) - 1; c++) {
        const key = `${r}-${c}`
        const cell = this.cellData[key]
        const num = cell ? parseFloat(String(cell.v).replace(/,/g, '')) : NaN
        if (!isNaN(num) && isFinite(num)) { max = Math.max(max, num); hasValue = true }
      }
    }
    return hasValue ? parseFloat(max.toFixed(2)) : 0
  }

  calcRangeMin(startCol, startRow, endCol, endRow) {
    let min = Infinity
    let hasValue = false
    for (let r = startRow; r <= endRow; r++) {
      for (let c = this.colToNum(startCol) - 1; c <= this.colToNum(endCol) - 1; c++) {
        const key = `${r}-${c}`
        const cell = this.cellData[key]
        const num = cell ? parseFloat(String(cell.v).replace(/,/g, '')) : NaN
        if (!isNaN(num) && isFinite(num)) { min = Math.min(min, num); hasValue = true }
      }
    }
    return hasValue ? parseFloat(min.toFixed(2)) : 0
  }

  calcRangeCount(startCol, startRow, endCol, endRow) {
    let count = 0
    for (let r = startRow; r <= endRow; r++) {
      for (let c = this.colToNum(startCol) - 1; c <= this.colToNum(endCol) - 1; c++) {
        const key = `${r}-${c}`
        const cell = this.cellData[key]
        if (cell && cell.v !== '' && cell.v != null) count++
      }
    }
    return count
  }

  evalArithmetic(expr) {
    // ✅ 保留三元运算符支持：? : 以及比较运算符 > < >= <= == !=
    const sanitized = expr.replace(/[^0-9+\-*/().%?<>=:!&|\s]/g, '')
    try {
      return Function(`"use strict"; return (${sanitized})`)()
    } catch {
      return 0
    }
  }

  colToNum(col) {
    let num = 0
    for (let i = 0; i < col.length; i++) {
      num = num * 26 + (col.charCodeAt(i) - 64)
    }
    return num
  }

  /**
   * 清除缓存（数据变更时调用）
   * 触发受影响的公式重新计算
   */
  invalidateCache() {
    this.formulaCache.clear()
    this.dependencyGraph.clear()
    this.reverseDeps.clear()
    this.calculationOrder = []
  }

  /**
   * 获取受指定单元格影响的公式列表（用于增量更新）
   */
  getAffectedFormulas(cellKey) {
    const affected = []
    const visited = new Set()
    const queue = [cellKey]

    while (queue.length > 0) {
      const current = queue.shift()
      if (visited.has(current)) continue
      visited.add(current)

      const dependents = this.reverseDeps.get(current)
      if (dependents) {
        for (const dep of dependents) {
          affected.push(dep)
          queue.push(dep)
        }
      }
    }

    return affected
  }

  /**
   * 检测是否存在循环依赖
   * @returns {boolean} 是否存在循环
   */
  hasCircularDependency() {
    this.buildDependencyGraph()
    const visiting = new Set()
    const visited = new Set()

    const detect = (key) => {
      if (visited.has(key)) return false
      if (visiting.has(key)) return true  // 发现循环
      visiting.add(key)

      const deps = this.dependencyGraph.get(key)
      if (deps) {
        for (const dep of deps) {
          if (detect(dep)) return true
        }
      }

      visiting.delete(key)
      visited.add(key)
      return false
    }

    for (const key of this.dependencyGraph.keys()) {
      if (detect(key)) return true
    }
    return false
  }
}

// ==================== 汇总计算引擎 ====================
/**
 * AggregateEngine - 自动聚合引擎
 *
 * 功能：
 * - 自动识别汇总行/小计行/合计行
 * - 根据树形结构自动聚合子节点数据
 * - 支持多级汇总（小计 → 合计 → 集团汇总）
 * - 数据变化时自动刷新汇总结果
 * - 汇总列标记为只读，禁止人工修改
 */
export class AggregateEngine {
  constructor(template, cellData) {
    this.template = template
    this.cellData = cellData
    this.flatRows = template?.getFlatRows?.() || []
    // 数据列必须用叶子列，否则多级表头会导致列偏移错位
    this.leafCols = template?.getLeafColumns?.() || template?.getFlatColumns?.() || []
    this.aggregateCache = new Map()
    this.frozenRowCount = template?.layout?.frozenRows ?? template?.getColumnDepth?.() ?? 4
  }

  /**
   * 计算所有汇总值并回填到 cellData
   */
  calculateAll() {
    if (!this.template || !this.cellData) return {}

    const results = {}
    const dataStartRow = this.frozenRowCount

    // 遍历所有扁平化行，找出汇总行
    this.flatRows.forEach((row, idx) => {
      if (!row.isSummary || !row.children?.length) return

      const actualRowIdx = dataStartRow + idx
      const childIds = new Set(row.children.map(c => c.id))

      // 对每列计算子节点的聚合值
      // 数据列从第 2 列开始（跳过 #、指标名两个冻结列）
      this.leafCols.forEach((col, colIdx) => {
        const actualColIdx = colIdx + 2

        // 收集所有子行的该列值
        const childValues = []
        this.flatRows.forEach((childRow, childIdx) => {
          if (childIds.has(childRow.id)) {
            const childActualRow = dataStartRow + childIdx
            const cellKey = `${childActualRow}-${actualColIdx}`
            const cell = this.cellData[cellKey]
            if (cell) {
              const num = parseFloat(String(cell.v).replace(/,/g, ''))
              if (!isNaN(num) && isFinite(num)) {
                childValues.push(num)
              }
            }
          }
        })

        // 根据汇总类型选择聚合方式
        const aggResult = this.aggregateValues(childValues, row.name)
        const cellKey = `${actualRowIdx}-${actualColIdx}`

        if (aggResult !== null) {
          results[cellKey] = aggResult
          // 如果该单元格已有用户自定义公式，优先保留用户公式，避免自动汇总覆盖
          const existing = this.cellData[cellKey]
          if (existing && existing.f && !String(existing.f).startsWith('=AGGREGATE')) {
            return
          }
          const base = existing || { v: '' }
          this.cellData[cellKey] = {
            ...base,
            v: aggResult,
            readOnly: true,
            f: `=AGGREGATE(${row.name}, ${col.title || col.name})`
          }
        }
      })
    })

    this.aggregateCache = results
    return results
  }

  /**
   * 根据汇总类型名称选择聚合函数
   * @param {number[]} values 子节点数值数组
   * @param {string} summaryName 汇总行名称（用于判断聚合类型）
   * @returns {number|null}
   */
  aggregateValues(values, summaryName) {
    if (values.length === 0) return null

    // 平均类汇总行使用均值
    if (/平均|均值/.test(summaryName)) {
      const sum = values.reduce((a, b) => a + b, 0)
      return parseFloat((sum / values.length).toFixed(2))
    }

    // 默认使用求和（合计/小计/汇总）
    const sum = values.reduce((a, b) => a + b, 0)
    return parseFloat(sum.toFixed(2))
  }

  /**
   * 增量更新 - 当某个子行数据变化时，仅刷新受影响的汇总行
   * @param {string} changedRowId 发生变化的行ID
   */
  incrementalUpdate(changedRowId) {
    // 找到该行所属的父级汇总行
    const changedRow = this.flatRows.find(r => r.id === changedRowId)
    if (!changedRow) return

    // 向上遍历所有祖先汇总行
    let parentId = changedRow.parentId
    const affectedSummaries = []

    while (parentId) {
      const parentRow = this.flatRows.find(r => r.id === parentId)
      if (parentRow?.isSummary) {
        affectedSummaries.push(parentRow)
      }
      parentId = parentRow?.parentId
    }

    // 仅重新计算受影响的汇总行
    for (const summary of affectedSummaries) {
      const summaryIdx = this.flatRows.findIndex(r => r.id === summary.id)
      if (summaryIdx < 0) continue

      const actualRowIdx = this.frozenRowCount + summaryIdx
      const childIds = new Set(summary.children?.map(c => c.id) || [])

      this.leafCols.forEach((col, colIdx) => {
        const actualColIdx = colIdx + 2
        const childValues = []

        this.flatRows.forEach((childRow, childIdx) => {
          if (childIds.has(childRow.id)) {
            const childActualRow = this.frozenRowCount + childIdx
            const cellKey = `${childActualRow}-${actualColIdx}`
            const cell = this.cellData[cellKey]
            if (cell) {
              const num = parseFloat(String(cell.v).replace(/,/g, ''))
              if (!isNaN(num) && isFinite(num)) childValues.push(num)
            }
          }
        })

        const aggResult = this.aggregateValues(childValues, summary.name)
        if (aggResult !== null) {
          const cellKey = `${actualRowIdx}-${actualColIdx}`
          const existing = this.cellData[cellKey]
          if (existing && existing.f && !String(existing.f).startsWith('=AGGREGATE')) {
            return
          }
          if (existing) {
            existing.v = aggResult
          } else {
            this.cellData[cellKey] = { v: aggResult, readOnly: true, f: `=AGGREGATE(${summary.name}, ${col.title || col.name})` }
          }
        }
      })
    }
  }

  /**
   * 清除汇总缓存
   */
  invalidateCache() {
    this.aggregateCache.clear()
  }

  /**
   * 获取某行的汇总类型标签
   */
  static getSummaryLabel(rowName) {
    if (/合计|总计|集团/.test(rowName)) return '合计'
    if (/小计|分区|区域/.test(rowName)) return '小计'
    if (/平均|均值/.test(rowName)) return '平均'
    return '汇总'
  }
}

// ==================== Excel 导入导出服务 ====================
export class ExcelService {
  /**
   * 导出为 JSON 格式（可用于后续对接 xlsx 库）
   */
  static exportToJSON(workbookConfig) {
    return {
      sheetName: workbookConfig.sheetName,
      freeze: {
        row: workbookConfig.frozenRowCount,
        column: workbookConfig.frozenColumnCount
      },
      merges: workbookConfig.mergeData.map(m => ({
        s: { r: m.startRow, c: m.startCol },
        e: { r: m.endRow, c: m.endCol }
      })),
      cells: workbookConfig.cellData,
      colWidths: workbookConfig.columnData.map(c => c.w),
      rowHeights: workbookConfig.rowData.map(r => r.h)
    }
  }

  /**
   * 从 JSON 导入
   */
  static importFromJSON(jsonData) {
    return new WorkbookConfig({
      sheetName: jsonData.sheetName || 'Sheet1',
      frozenRowCount: jsonData.freeze?.row || 1,
      frozenColumnCount: jsonData.freeze?.column || 2,
      rowData: (jsonData.rowHeights || []).map(h => ({ h })),
      columnData: (jsonData.colWidths || []).map(w => ({ w })),
      cellData: jsonData.cells || {},
      mergeData: (jsonData.merges || []).map(m => new MergeCell({
        startRow: m.s.r,
        endRow: m.e.r,
        startCol: m.s.c,
        endCol: m.e.c
      }))
    })
  }

  /**
   * 下载为文本文件（临时方案）
   */
  static downloadAsText(data, filename = 'report.txt') {
    const text = JSON.stringify(data, null, 2)
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
}
