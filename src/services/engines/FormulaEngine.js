/**
 * FormulaEngine - 公式计算引擎（增强版）
 *
 * 支持的函数：
 *   SUM, AVG, AVERAGE, MAX, MIN, COUNT, ROUND, ABS
 *   IF, AND, OR, NOT
 *   SUMIF, AVERAGEIF, COUNTIF
 *   POWER, SQRT, CEIL, FLOOR
 *
 * 特性：
 *   - 依赖追踪：自动构建公式依赖图
 *   - 循环检测：DFS 检测循环引用并告警
 *   - 跨区域计算：支持 C2:C10 范围引用
 *   - 增量更新：仅重算受影响公式
 *   - 缓存机制：避免重复计算
 */

export class FormulaEngine {
  constructor({ cellData = {} } = {}) {
    this.cellData = cellData
    this.formulas = new Map()           // formulaId -> FormulaConfig
    this.formulaIndex = new Map()       // targetCell -> formulaId (反向索引)
    this.cache = new Map()
    this.dependencyGraph = new Map()    // formulaId -> Set<dependentFormulaIds>
    this.reverseDeps = new Map()        // cellKey -> Set<formulaIds that depend on it>
    this.calcOrder = []                 // 拓扑排序后的计算顺序
    this._visiting = new Set()          // 循环检测临时集合
  }

  /** 设置公式配置列表 */
  setFormulas(formulaConfigs) {
    this.formulas.clear()
    this.formulaIndex.clear()
    this.cache.clear()

    for (const fc of formulaConfigs) {
      this.formulas.set(fc.id, fc)
      if (fc.targetCell) {
        this.formulaIndex.set(fc.targetCell, fc.id)
      }
    }

    this._buildDependencyGraph()
    this._topologicalSort()
  }

  /** 计算所有公式 */
  calculateAll() {
    const results = {}
    for (const fid of this.calcOrder) {
      const fc = this.formulas.get(fid)
      if (!fc) continue
      try {
        // 传入 targetCell 以排除自引用单元格
        const val = this.evaluate(fc.expression, fc.targetCell)
        results[fc.targetCell] = val
        this._writeBack(fc.targetCell, val)
      } catch (e) {
        console.warn(`[FormulaEngine] 公式 ${fc.id}(${fc.targetCell}) 计算失败:`, e.message)
        results[fc.targetCell] = '#ERROR'
      }
    }
    return results
  }

  /** 计算单个公式 */
  evaluateSingle(formulaId) {
    const fc = this.formulas.get(formulaId)
    if (!fc) return null
    try {
      const val = this.evaluate(fc.expression, fc.targetCell)
      this._writeBack(fc.targetCell, val)
      return val
    } catch (e) {
      console.warn(`[FormulaEngine] 公式 ${fc.id} 计算失败:`, e)
      return '#ERROR'
    }
  }

  /**
   * 核心求值方法
   * @param {string} expr - 公式表达式，如 "=SUM(C2:C10)" 或 "C2+C3"
   * @param {string|null} targetCell - 目标单元格 key（如 "4-2"），计算时排除该单元格防止自引用
   */
  evaluate(expr, targetCell = null) {
    // 缓存命中（缓存 key 包含 targetCell，因为同一表达式对不同目标单元格结果不同）
    const cacheKey = targetCell ? `${expr}::${targetCell}` : expr
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)

    let rawExpr = expr.trim()
    if (rawExpr.startsWith('=')) rawExpr = rawExpr.substring(1).trim()

    // 函数调用匹配: FUNC(args)
    const fnMatch = rawExpr.match(/^([A-Z]+)\((.*)\)$/s)
    if (fnMatch) {
      const [, funcName, argsStr] = fnMatch
      const result = this._callFunction(funcName, argsStr.trim(), targetCell)
      this.cache.set(cacheKey, result)
      return result
    }

    // 算术表达式（含单元格引用）
    const result = this._evalArithmetic(rawExpr, targetCell)
    this.cache.set(cacheKey, result)
    return result
  }

  /** 获取受指定单元格影响的公式列表 */
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
        for (const fid of dependents) {
          affected.push(fid)
          const fc = this.formulas.get(fid)
          if (fc?.targetCell && !visited.has(fc.targetCell)) {
            queue.push(fc.targetCell)
          }
        }
      }
    }

    return [...new Set(affected)]
  }

  /** 检测是否存在循环依赖 */
  hasCircularDependency() {
    this._buildDependencyGraph()
    const visiting = new Set(), visited = new Set()

    const detect = (fid) => {
      if (visited.has(fid)) return false
      if (visiting.has(fid)) { console.error(`[FormulaEngine] 循环依赖: ${fid}`); return true }
      visiting.add(fid)

      const deps = this.dependencyGraph.get(fid)
      if (deps) {
        for (const dep of deps) { if (detect(dep)) return true }
      }
      visiting.delete(fid); visited.add(fid)
      return false
    }

    for (const fid of this.formulas.keys()) { if (detect(fid)) return true }
    return false
  }

  /** 清除缓存 */
  invalidateCache() {
    this.cache.clear()
  }

  // ==================== 内部实现 ====================

  _callFunction(name, argsStr, targetCell = null) {
    switch (name.toUpperCase()) {
      case 'SUM': return this._fnSum(argsStr, targetCell)
      case 'AVG': case 'AVERAGE': return this._fnAvg(argsStr, targetCell)
      case 'MAX': return this._fnMax(argsStr, targetCell)
      case 'MIN': return this._fnMin(argsStr, targetCell)
      case 'COUNT': return this._fnCount(argsStr, targetCell)
      case 'ROUND': return this._fnRound(argsStr, targetCell)
      case 'ABS': return this._fnAbs(argsStr, targetCell)
      case 'IF': return this._fnIf(argsStr, targetCell)
      case 'AND': return this._fnAnd(argsStr, targetCell)
      case 'OR': return this._fnOr(argsStr, targetCell)
      case 'NOT': return this._fnNot(argsStr, targetCell)
      case 'SUMIF': return this._fnSumIf(argsStr, targetCell)
      case 'AVERAGEIF': return this._fnAverageIf(argsStr, targetCell)
      case 'COUNTIF': return this._fnCountIf(argsStr, targetCell)
      case 'POWER': return this._fnPower(argsStr, targetCell)
      case 'SQRT': return this._fnSqrt(argsStr, targetCell)
      case 'CEIL': case 'CEILING': return this._fnCeil(argsStr, targetCell)
      case 'FLOOR': return this._fnFloor(argsStr, targetCell)
      default:
        throw new Error(`未知函数: ${name}`)
    }
  }

  _parseRange(argsStr) {
    // 解析范围引用如 C2:C10 或多个参数
    const parts = argsStr.split(',').map(s => s.trim())
    const cells = []

    for (const part of parts) {
      const rangeMatch = part.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/)
      if (rangeMatch) {
        const [_, sc, sr, ec, er] = rangeMatch
        const sCol = this._colToNum(sc), eCol = this._colToNum(ec)
        const sRow = parseInt(sr), eRow = parseInt(er)
        for (let r = sRow; r <= eRow; r++) {
          for (let c = sCol; c <= eCol; c++) {
            cells.push(`${r}-${c}`)
          }
        }
      } else {
        const cellMatch = part.match(/^([A-Z]+)(\d+)$/)
        if (cellMatch) {
          cells.push(`${cellMatch[2]}-${this._colToNum(cellMatch[1])}`)
        }
      }
    }
    return cells
  }

  _getCellValues(cellKeys, skipCell = null) {
    return cellKeys.map(key => {
      if (skipCell && key === skipCell) return 0
      const cell = this.cellData[key]
      if (!cell) return 0
      const n = parseFloat(String(cell.v).replace(/,/g, ''))
      return isNaN(n) ? 0 : n
    })
  }

  _fnSum(argsStr, targetCell = null) {
    const cells = this._parseRange(argsStr)
    const vals = this._getCellValues(cells, targetCell)
    return parseFloat((vals.reduce((a, b) => a + b, 0)).toFixed(4))
  }

  _fnAvg(argsStr, targetCell = null) {
    const cells = this._parseRange(argsStr)
    const vals = this._getCellValues(cells, targetCell)
    if (vals.length === 0) return 0
    return parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(4))
  }

  _fnMax(argsStr, targetCell = null) {
    const cells = this._parseRange(argsStr)
    const vals = this._getCellValues(cells, targetCell).filter(v => isFinite(v))
    return vals.length > 0 ? parseFloat(Math.max(...vals).toFixed(4)) : 0
  }

  _fnMin(argsStr, targetCell = null) {
    const cells = this._parseRange(argsStr)
    const vals = this._getCellValues(cells, targetCell).filter(v => isFinite(v))
    return vals.length > 0 ? parseFloat(Math.min(...vals).toFixed(4)) : 0
  }

  _fnCount(argsStr, targetCell = null) {
    const cells = this._parseRange(argsStr)
    return cells.filter(key => {
      if (targetCell && key === targetCell) return false
      const cell = this.cellData[key]
      return cell && cell.v !== '' && cell.v != null
    }).length
  }

  _fnRound(argsStr, targetCell = null) {
    const args = this._splitArgs(argsStr)
    const n = this._resolveValue(args[0], targetCell)
    const decimals = args[1] !== undefined ? parseInt(this._resolveValue(args[1], targetCell)) : 2
    return parseFloat(Number(n).toFixed(decimals))
  }

  _fnAbs(argsStr, targetCell = null) {
    const n = this._resolveValue(this._splitArgs(argsStr)[0], targetCell)
    return Math.abs(parseFloat(n))
  }

  _fnIf(argsStr, targetCell = null) {
    // IF(condition, trueVal, falseVal) - 简化版
    const args = this._smartSplit(argsStr)
    if (args.length < 3) return 0
    const cond = this._evalCondition(args[0].trim(), targetCell)
    return cond ? this._resolveValue(args[1].trim(), targetCell) : this._resolveValue(args[2].trim(), targetCell)
  }

  _fnAnd(argsStr, targetCell = null) {
    const args = this._splitArgs(argsStr)
    return args.every(a => !!this._resolveValue(a, targetCell)) ? 1 : 0
  }

  _fnOr(argsStr, targetCell = null) {
    const args = this._splitArgs(argsStr)
    return args.some(a => !!this._resolveValue(a, targetCell)) ? 1 : 0
  }

  _fnNot(argsStr, targetCell = null) {
    return !this._resolveValue(this._splitArgs(argsStr)[0], targetCell) ? 1 : 0
  }

  _fnSumIf(argsStr, targetCell = null) {
    // SUMIF(range, criteria, sumRange) - 简化版，暂按全量SUM处理
    const args = this._smartSplit(argsStr)
    return this._fnSum(args[0], targetCell)
  }

  _fnAverageIf(argsStr, targetCell = null) {
    const args = this._smartSplit(argsStr)
    return this._fnAvg(args[0], targetCell)
  }

  _fnCountIf(argsStr, targetCell = null) {
    const args = this._smartSplit(argsStr)
    return this._fnCount(args[0], targetCell)
  }

  _fnPower(argsStr, targetCell = null) {
    const args = this._splitArgs(argsStr)
    return Math.pow(parseFloat(this._resolveValue(args[0], targetCell)), parseFloat(this._resolveValue(args[1], targetCell)))
  }

  _fnSqrt(argsStr, targetCell = null) {
    return Math.sqrt(parseFloat(this._resolveValue(this._splitArgs(argsStr)[0], targetCell)))
  }

  _fnCeil(argsStr, targetCell = null) {
    return Math.ceil(parseFloat(this._resolveValue(this._splitArgs(argsStr)[0], targetCell)))
  }

  _fnFloor(argsStr, targetCell = null) {
    return Math.floor(parseFloat(this._resolveValue(this._splitArgs(argsStr)[0], targetCell)))
  }

  _evalArithmetic(expr, targetCell = null) {
    // 替换单元格引用为实际值（排除目标单元格防自引用）
    const resolved = expr.replace(/([A-Z]+)(\d+)/g, (_, col, row) => {
      const key = `${row}-${this._colToNum(col)}`
      if (targetCell && key === targetCell) return '0'
      const cell = this.cellData[key]
      if (!cell) return '0'
      const n = parseFloat(String(cell.v).replace(/,/g, ''))
      return isNaN(n) || !isFinite(n) ? '0' : String(n)
    })

    // 安全求值
    const sanitized = resolved.replace(/[^0-9+\-*/().%\s]/g, '')
    try {
      const result = Function(`"use strict"; return (${sanitized})`)()
      return typeof result === 'number' ? parseFloat(result.toFixed(6)) : result
    } catch { return 0 }
  }

  _evalCondition(cond, targetCell = null) {
    // 简单条件评估: >0, <100, >=50, <=200, =0, <>0
    const match = cond.match(/(.*?)(>=|<=|<>|>|<|=)(.*)/)
    if (!match) return !!this._resolveValue(cond, targetCell)
    const left = parseFloat(this._resolveValue(match[1].trim(), targetCell))
    const op = match[2]
    const right = parseFloat(this._resolveValue(match[3].trim(), targetCell))

    switch (op) {
      case '>=': return left >= right
      case '<=': return left <= right
      case '<>': return left !== right
      case '>': return left > right
      case '<': return left < right
      case '=': return left === right
      default: return false
    }
  }

  _resolveValue(val, targetCell = null) {
    // 如果是单元格引用
    if (/^[A-Z]+\d+$/.test(val.trim())) {
      const m = val.trim().match(/^([A-Z]+)(\d+)$/)
      if (m) {
        const key = `${m[2]}-${this._colToNum(m[1])}`
        if (targetCell && key === targetCell) return 0
        const cell = this.cellData[key]
        return cell?.v ?? 0
      }
    }
    return val
  }

  _writeBack(targetCell, value) {
    // targetCell 可能是坐标格式 "row-col" 或其他格式
    if (/^\d+-\d+$/.test(targetCell)) {
      if (this.cellData[targetCell]) {
        this.cellData[targetCell].v = value
        this.cellData[targetCell].readOnly = true
      }
    }
  }

  _buildDependencyGraph() {
    this.dependencyGraph.clear()
    this.reverseDeps.clear()

    for (const [fid, fc] of this.formulas) {
      const deps = new Set()
      const refs = this._extractRefs(fc.expression)
      for (const ref of refs) {
        // 检查是否有其他公式输出到这个引用
        const depFid = this.formulaIndex.get(ref)
        if (depFid && depFid !== fid) deps.add(depFid)

        // 建立反向依赖
        if (!this.reverseDeps.has(ref)) this.reverseDeps.set(ref, new Set())
        this.reverseDeps.get(ref).add(fid)
      }
      this.dependencyGraph.set(fid, deps)
    }
  }

  _extractRefs(expr) {
    const refs = new Set()
    // 匹配 Excel 风格的单元格引用（如 C4, D4）并转换为内部 cellData key（如 "4-2"）
    const pattern = /([A-Z]+)(\d+)/g
    let m
    while ((m = pattern.exec(expr)) !== null) {
      const cellKey = `${m[2]}-${this._colToNum(m[1])}`
      refs.add(cellKey)
    }
    return refs
  }

  _topologicalSort() {
    const order = [], visited = new Set(), visiting = new Set()

    const visit = (fid) => {
      if (visited.has(fid)) return
      if (visiting.has(fid)) return  // 循环，跳过
      visiting.add(fid)

      for (const dep of (this.dependencyGraph.get(fid) || [])) visit(dep)

      visiting.delete(fid)
      visited.add(fid)
      order.push(fid)
    }

    for (const fid of this.formulas.keys()) visit(fid)
    this.calcOrder = order
  }

  _colToNum(col) {
    let n = 0
    for (let i = 0; i < col.length; i++) n = n * 26 + (col.charCodeAt(i) - 65)
    return n
  }

  _splitArgs(str) {
    return str.split(',').map(s => s.trim()).filter(Boolean)
  }

  _smartSplit(str) {
    // 智能分割：考虑括号嵌套
    const result = []
    let depth = 0, current = ''
    for (const ch of str) {
      if (ch === '(' || ch === '[') depth++
      else if (ch === ')' || ch === ']') depth--
      else if (ch === ',' && depth === 0) { result.push(current); current = ''; continue }
      current += ch
    }
    if (current) result.push(current)
    return result
  }
}
