/**
 * useFormulaEngine - 公式应用与计算逻辑
 *
 * 从 ReportFill/index.vue 中提取的公式配置构建、单元格公式应用、
 * 公式引擎初始化、行引用联动等逻辑。
 */
import { reactive } from 'vue'
import { FormulaEngine } from '@/services/engines/FormulaEngine.js'
import { AggregateEngine } from '@/services/templateEngine.js'

export function useFormulaEngine({ config, currentTemplate, v2Parser, useV2 }) {
  let formulaEngine = null
  let aggregateEngine = null
  let rowRefMap = new Map()

  const savedFormulas = reactive([])
  const formulaEditor = reactive({
    visible: false, cellInfo: '', initialValue: '',
    fields: [], rowFields: [], validFieldIds: [],
    targetCell: null
  })

  function mckey(rowIdx, colIdx, frozenRows) {
    return `${frozenRows + rowIdx}-${colIdx + 2}`
  }

  function parseTargetCell(targetCell, rows, rowIdToIdx, colIdToIdx) {
    const lastDash = targetCell.lastIndexOf('-')
    if (lastDash <= 0) return null
    const rPart = targetCell.substring(0, lastDash)
    const cPart = targetCell.substring(lastDash + 1)

    let targetRi, targetCi
    if (!isNaN(rPart) && !isNaN(cPart)) {
      targetRi = parseInt(rPart)
      targetCi = parseInt(cPart)
    } else {
      targetRi = rowIdToIdx.get(rPart) ?? rowIdToIdx.get(Number(rPart))
      targetCi = colIdToIdx.get(cPart) ?? colIdToIdx.get(Number(cPart))
    }
    if (targetRi === undefined || targetCi === undefined) return null
    return { targetRi, targetCi }
  }

  function buildFormulaConfigs(tpl) {
    const configs = []
    if (tpl.formulas && Array.isArray(tpl.formulas)) {
      tpl.formulas.forEach((f, idx) => {
        configs.push({
          id: f.id || `formula_${idx}`,
          expression: f.expression || f.rawExpression || '',
          targetCell: f.targetCell || '',
          fieldName: f.fieldName || '',
          dependencies: f.dependencies || []
        })
      })
    }
    if (tpl.metrics && Array.isArray(tpl.metrics)) {
      tpl.metrics.forEach((m, idx) => {
        if (m.expression) {
          configs.push({
            id: m.id || `metric_${idx}`,
            expression: m.expression,
            targetCell: m.targetCell || '',
            fieldName: m.fieldName || m.name || '',
            dependencies: m.dependencies || []
          })
        }
      })
    }
    return configs
  }

  function applyFormulaConfigsToCellData(tpl) {
    const configs = buildFormulaConfigs(tpl)
    const rows = config.value?.rows || []
    const cols = (config.value?.columnData || []).slice(2)
    const frozenRows = config.value?.frozenRowCount || 4

    const rowIdToIdx = new Map()
    rows.forEach((r, i) => {
      if (r.id !== undefined && r.id !== null) {
        rowIdToIdx.set(r.id, i)
        rowIdToIdx.set(String(r.id), i)
      }
      if (r.code) { rowIdToIdx.set(r.code, i); rowIdToIdx.set(String(r.code), i) }
      if (r.name) { rowIdToIdx.set(r.name, i); rowIdToIdx.set(String(r.name), i) }
    })
    const colIdToIdx = new Map(cols.map((c, i) => [c.id, i]))
    cols.forEach((c, i) => {
      if (c.code) colIdToIdx.set(c.code, i)
      if (c.title) colIdToIdx.set(c.title, i)
    })

    const convertedFormulas = []
    let appliedCount = 0
    for (const fc of configs) {
      if (!fc.expression || !fc.targetCell) continue
      const tc = parseTargetCell(fc.targetCell, rows, rowIdToIdx, colIdToIdx)
      if (!tc || tc.targetRi >= rows.length) continue
      const { targetRi, targetCi } = tc
      if (targetCi >= cols.length) continue

      const key = mckey(targetRi, targetCi, frozenRows)
      const cell = config.value.cellData[key]
      if (!cell) continue

      const sourceRi = rowIdToIdx.get(fc.expression) ?? rowIdToIdx.get(Number(fc.expression))
      if (sourceRi !== undefined && sourceRi < rows.length) {
        const srcId = rows[sourceRi].id
        if (!rowRefMap.has(srcId)) rowRefMap.set(srcId, [])
        rowRefMap.get(srcId).push({ targetRi, colsLen: cols.length, sourceRi })

        for (let c = 0; c < cols.length; c++) {
          const tkey = mckey(targetRi, c, frozenRows)
          const skey = mckey(sourceRi, c, frozenRows)
          const sc = config.value.cellData[skey]
          if (config.value.cellData[tkey] && sc?.v !== undefined && sc.v !== '') {
            config.value.cellData[tkey].v = sc.v
            config.value.cellData[tkey].raw = sc.raw ?? sc.v
            config.value.cellData[tkey].readOnly = true
            config.value.cellData[tkey].f = null
            const tr = rows[targetRi]
            if (tr?.values?.[c]) {
              tr.values[c].v = sc.v
              tr.values[c].raw = sc.raw ?? sc.v
              tr.values[c].readOnly = true
            }
          }
        }
        appliedCount++
        continue
      }

      const rowList = extractRowListExpr(fc.expression)
      if (rowList?.length) {
        const sourceRis = rowList.map(rid => rowIdToIdx.get(rid) ?? rowIdToIdx.get(Number(rid)))
          .filter(ri => ri !== undefined && ri < rows.length)
        if (sourceRis.length > 0) {
          // 行引用公式（如 SUM([11],[22])）按列展开到目标行的所有数据列
          for (let c = 0; c < cols.length; c++) {
            const colRef = numToColLetter(c + 2)
            const parts = sourceRis.map(ri => `${colRef}${frozenRows + ri}`)
            const expr = '=' + (parts.length === 1 ? parts[0] : `SUM(${parts.join(',')})`)
            const colKey = mckey(targetRi, c, frozenRows)
            if (config.value.cellData[colKey]) {
              setFormulaCell(colKey, expr, fc, targetRi, c, rows)
              convertedFormulas.push({
                id: `${fc.id}_c${c}`, expression: expr, targetCell: colKey,
                fieldName: fc.fieldName || '', dependencies: fc.dependencies || []
              })
            }
          }
          appliedCount++
          continue
        }
      }

      const rowOffset = frozenRows - 1
      const colOffset = 2  // 跳过2个冻结列（序号+指标名），用户 A→内部 C(2), B→D(3)...
      let expr = shiftFormulaRefs(fc.expression, rowOffset, colOffset)
      if (!expr.startsWith('=')) expr = '=' + expr
      setFormulaCell(key, expr, fc, targetRi, targetCi, rows)
      convertedFormulas.push({
        id: fc.id, expression: expr, targetCell: key,
        fieldName: fc.fieldName || '', dependencies: fc.dependencies || []
      })
      appliedCount++
    }
    return convertedFormulas
  }

  function setFormulaCell(key, formulaStr, fc, targetRi, targetCi, rows) {
    // 保留原始值，不清空 — FormulaEngine 计算时会排除目标单元格防自引用，
    // 计算完成后 _writeBack 会覆盖为目标值
    config.value.cellData[key].f = formulaStr
    config.value.cellData[key].readOnly = true
    const tgtRow = rows[targetRi]
    if (tgtRow?.values?.[targetCi]) {
      tgtRow.values[targetCi].readOnly = true
      tgtRow.values[targetCi].formula = fc.expression
      tgtRow.values[targetCi].f = formulaStr
    }
  }

  function extractRowListExpr(expr) {
    if (!expr) return null
    const inner = expr.trim().replace(/^(SUM|AVERAGE|MAX|MIN)\((.*)\)$/i, '$2').trim()
    if (/^[A-Z]+\d+:[A-Z]+\d+$/.test(inner)) return null
    const parts = inner.split(/[,，]\s*/)
      .map(p => p.trim().replace(/^\[(.*)\]$/, '$1'))
      .filter(Boolean)
    if (parts.some(p => /^[A-Z]+\d+:[A-Z]+\d+$/.test(p))) return null
    const hasRowIds = parts.some(p => p && !/^[A-Z]+\d+$/.test(p))
    return hasRowIds ? parts : null
  }

  function shiftFormulaRefs(expr, rowOffset, colOffset) {
    if (!expr || (rowOffset === 0 && colOffset === 0)) return expr
    return expr.replace(/([A-Z]+)(\d+)/g, (_, col, row) => {
      const colNum = colToNum(col) + colOffset
      const rowNum = parseInt(row) + rowOffset
      if (colNum < 0 || rowNum < 0) return `${col}${row}`
      return `${numToColLetter(colNum)}${rowNum}`
    })
  }

  function colToNum(col) {
    let n = 0
    for (let i = 0; i < col.length; i++) n = n * 26 + (col.charCodeAt(i) - 65)
    return n
  }

  function numToColLetter(n) {
    let s = ''
    while (n >= 0) { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) - 1 }
    return s
  }

  function syncCellDataToRows() {
    const rows = config.value?.rows || []
    const frozenRows = config.value?.frozenRowCount || 4
    const colsLen = (config.value?.columnData?.length || 3) - 2
    for (let ri = 0; ri < rows.length; ri++) {
      const row = rows[ri]
      if (!row?.values) continue
      for (let c = 0; c < colsLen && c < row.values.length; c++) {
        const key = mckey(ri, c, frozenRows)
        const cell = config.value.cellData?.[key]
        if (cell && row.values[c]) {
          row.values[c].v = cell.v !== undefined ? cell.v : row.values[c].v
          row.values[c].raw = cell.raw !== undefined ? cell.raw : row.values[c].raw
          if (cell.f !== undefined) row.values[c].f = cell.f
          if (cell.formula !== undefined) row.values[c].formula = cell.formula
          if (cell.readOnly !== undefined) row.values[c].readOnly = cell.readOnly
        }
      }
    }
  }

  function syncRowRefsToTargets() {
    if (rowRefMap.size === 0) return
    const rows = config.value?.rows || []
    const frozenRows = config.value?.frozenRowCount || 4
    for (const [, refs] of rowRefMap) {
      for (const ref of refs) {
        const src = rows[ref.sourceRi], tgt = rows[ref.targetRi]
        if (!src?.values || !tgt?.values) continue
        for (let c = 0; c < ref.colsLen && c < tgt.values.length; c++) {
          if (tgt.values[c]?.readOnly) {
            const v = src.values[c]?.v ?? ''
            tgt.values[c].v = v
            tgt.values[c].raw = src.values[c]?.raw ?? v
            const key = mckey(ref.targetRi, c, frozenRows)
            if (config.value.cellData?.[key]) config.value.cellData[key].v = v
          }
        }
      }
    }
  }

  function initEngines(tpl) {
    if (!formulaEngine) {
      formulaEngine = new FormulaEngine({ cellData: config.value.cellData })
    }
    const convertedFormulas = applyFormulaConfigsToCellData(tpl)
    formulaEngine.setFormulas(convertedFormulas)
    formulaEngine.invalidateCache()
    formulaEngine.calculateAll()

    if (!aggregateEngine) {
      aggregateEngine = new AggregateEngine(tpl, config.value.cellData)
    }
    aggregateEngine.calculateAll()
    // ✅ AggregateEngine 只更新 cellData，需要回填到 rows[i].values[c] 供 UI 渲染
    syncCellDataToRows()
  }

  function recalcFormulas() {
    if (formulaEngine) {
      formulaEngine.invalidateCache()
      formulaEngine.calculateAll()
    }
    if (aggregateEngine) {
      aggregateEngine.calculateAll()
    }
    syncCellDataToRows()
    syncRowRefsToTargets()
  }

  function extractLeafColumns(tree) {
    const result = []
    for (const node of tree) {
      if (node.children && node.children.length > 0) {
        result.push(...extractLeafColumns(node.children))
      } else {
        result.push({
          id: node.id || node.code,
          title: node.name || node.title || node.id,
          type: node.type || node.columnType || 'data'
        })
      }
    }
    return result
  }

  function extractFlatRows(tree, level = 0) {
    const result = []
    for (const node of tree) {
      result.push({
        id: node.id || node.code,
        name: node.name,
        isSummary: node.isSummary || false,
        level,
        type: node.isSummary ? 'aggregate' : 'data'
      })
      if (node.children && node.children.length > 0) {
        result.push(...extractFlatRows(node.children, level + 1))
      }
    }
    return result
  }

  function openFormulaEditor(val, row, colIdx) {
    let fields = []
    let rowFields = []

    if (useV2.value && v2Parser.value) {
      const template = v2Parser.value.getTemplate()
      const rowTree = template?.rowTree || []
      const colTree = template?.columnTree || []

      fields = extractLeafColumns(colTree)
      rowFields = extractFlatRows(rowTree).filter(r => !r.isSummary)

      if (fields.length === 0 && colTree.length > 0) {
        const leafCols = v2Parser.value.getLeafColumns() || []
        fields = leafCols.map(col => ({
          id: col.id || col.code,
          title: col.name || col.title || col.id,
          type: col.type || col.columnType || 'data'
        }))
      }

      if (rowFields.length === 0 && rowTree.length > 0) {
        const flatRows = v2Parser.value.getFlatRows() || []
        rowFields = flatRows.filter(r => !r.isSummary).map(r => ({
          id: r.id || r.code, name: r.name,
          type: r.isSummary ? 'aggregate' : 'data'
        }))
      }

      if (fields.length === 0 && config.value?.columnData) {
        fields = config.value.columnData.slice(2).map(col => ({
          id: col.id || col.code,
          title: col.title || col.name || col.id,
          type: col.type || 'data'
        }))
      }

      if (rowFields.length === 0 && config.value?.rows) {
        rowFields = config.value.rows.filter(r => !r.isSummary).map(r => ({
          id: r.id || r.code, name: r.name,
          type: r.isSummary ? 'aggregate' : 'data'
        }))
      }
    } else if (currentTemplate.value?.getLeafColumns) {
      const leafCols = currentTemplate.value.getLeafColumns() || []
      fields = leafCols.map(col => ({
        id: col.id, title: col.title || col.id, type: col.type
      }))
      const flatRows = currentTemplate.value.getFlatRows() || []
      rowFields = flatRows.filter(r => !r.isSummary).map(r => ({
        id: r.id, name: r.name,
        type: r.isSummary ? 'aggregate' : ''
      }))
    } else if (config.value?.columnData && config.value?.rows) {
      fields = config.value.columnData.slice(2).map(col => ({
        id: col.id || col.code,
        title: col.title || col.name || col.id,
        type: col.type || 'data'
      }))
      rowFields = config.value.rows.filter(r => !r.isSummary).map(r => ({
        id: r.id || r.code, name: r.name,
        type: r.isSummary ? 'aggregate' : 'data'
      }))
    }

    const validIds = [...fields.map(f => f.id), ...rowFields.map(f => f.id)]

    formulaEditor.visible = true
    formulaEditor.cellInfo = `${row.name} / ${val.colTitle || `列${colIdx}`}`
    formulaEditor.initialValue = val.formula || ''
    formulaEditor.fields = fields
    formulaEditor.rowFields = rowFields
    formulaEditor.validFieldIds = validIds
    formulaEditor.targetCell = { rowIdx: row.depth, colIdx, val, row }
  }

  function onFormulaApply(formulaData, syncCellToRows, showToast) {
    const target = formulaEditor.targetCell
    if (!target) return

    const expr = typeof formulaData === 'string' ? formulaData : formulaData.expression
    const frozenRows = config.value?.frozenRowCount || 4
    // cellData 使用 mckey 格式（"4-2"），而非 "0-0" 格式
    const cellKey = mckey(target.rowIdx, target.colIdx, frozenRows)
    // savedFormulas / 后端使用 "rowIdx-colIdx" 格式（"0-0"）
    const targetCellStr = `${target.rowIdx}-${target.colIdx}`

    if (config.value.cellData[cellKey]) {
      config.value.cellData[cellKey] = {
        ...config.value.cellData[cellKey],
        v: expr, readOnly: true,
        f: expr.replace(/^=/, ''),
        formulaConfig: typeof formulaData === 'object' ? {
          fieldName: formulaData.fieldName,
          label: formulaData.label,
          expression: formulaData.rawExpression || expr.replace(/^=/, ''),
          resultType: formulaData.resultType,
          dependencies: formulaData.dependencies,
          createdAt: formulaData.createdAt
        } : null
      }
    }

    syncCellToRows(target.rowIdx, target.colIdx, expr)

    if (typeof formulaData === 'object') {
      savedFormulas.push({
        ...formulaData,
        targetCell: targetCellStr,
        rowName: target.row?.name,
        colTitle: target.val?.colTitle
      })
    }

    showToast('公式已保存', 'success')
    formulaEditor.visible = false

    nextTick(() => {
      if (formulaEngine) {
        formulaEngine.invalidateCache()
        formulaEngine.calculateAll()
      }
    })
  }

  function buildBackendPayload(formulaData) {
    const target = formulaEditor.targetCell
    return {
      fieldName: formulaData.fieldName || `formula_${Date.now().toString(36)}`,
      label: formulaData.label || '',
      expression: (formulaData.rawExpression || '').replace(/^=/, ''),
      resultType: formulaData.resultType || 'number',
      targetCell: `${target?.rowIdx}-${target?.colIdx}`,
      dependencies: formulaData.dependencies || [],
      templateId: currentTemplate.value?.id,
      createdAt: new Date().toISOString()
    }
  }

  return {
    formulaEngine, savedFormulas, formulaEditor,
    buildFormulaConfigs, applyFormulaConfigsToCellData,
    initEngines, recalcFormulas, syncCellDataToRows,
    mckey, openFormulaEditor, onFormulaApply,
    extractLeafColumns, extractFlatRows, buildBackendPayload
  }
}
