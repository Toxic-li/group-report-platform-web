/**
 * Excel 列号/列字母互转工具
 * 统一替换报表设计器中 4 处各自实现的 convertToExcelRef
 *
 * 正确算法说明（支持多字母列：A-Z, AA-ZZ, AAA-ZZZ...）：
 *   - 列号从 1 开始（1 → A, 2 → B, ..., 26 → Z, 27 → AA）
 *   - 与 Excel 行为一致
 */

/**
 * 数字列号 → Excel 列字母
 * @param {number} col - 列号（从 1 开始）
 * @returns {string} 列字母，如 1→"A", 26→"Z", 27→"AA"
 */
export function colNumToLetter(col) {
  if (col < 1) return ''
  let letter = ''
  let c = col
  while (c > 0) {
    const rem = (c - 1) % 26
    letter = String.fromCharCode(65 + rem) + letter
    c = Math.floor((c - 1) / 26)
  }
  return letter
}

/**
 * Excel 列字母 → 数字列号
 * @param {string} letter - 列字母，如 "A", "AA", "BC"
 * @returns {number} 列号（从 1 开始）
 */
export function colLetterToNum(letter) {
  if (!letter) return 0
  let num = 0
  for (let i = 0; i < letter.length; i++) {
    num = num * 26 + (letter.charCodeAt(i) - 64)
  }
  return num
}

/**
 * 行号 + 列号 → Excel 单元格引用（如 "A1", "BC27"）
 * @param {number} row - 行号（从 1 开始）
 * @param {number} col - 列号（从 1 开始）
 * @returns {string}
 */
export function toExcelRef(row, col) {
  return `${colNumToLetter(col)}${row}`
}

/**
 * Excel 单元格引用 → { row, col }
 * @param {string} ref - 如 "A1", "BC27"
 * @returns {{ row: number, col: number }} 行号/列号均从 1 开始
 */
export function fromExcelRef(ref) {
  const m = String(ref).match(/^([A-Za-z]+)(\d+)$/)
  if (!m) return null
  return {
    row: parseInt(m[2], 10),
    col: colLetterToNum(m[1].toUpperCase())
  }
}

/**
 * 判断是否为范围引用（含冒号）
 * @param {string} ref - 如 "A1:B10"
 * @returns {boolean}
 */
export function isRangeRef(ref) {
  return typeof ref === 'string' && ref.includes(':')
}

/**
 * 解析范围引用为两个单元格坐标
 * @param {string} rangeRef - 如 "A1:B10"
 * @returns {{ startRow, startCol, endRow, endCol }|null}
 */
export function parseRangeRef(rangeRef) {
  if (!isRangeRef(rangeRef)) return null
  const [start, end] = rangeRef.split(':')
  const s = fromExcelRef(start)
  const e = fromExcelRef(end)
  if (!s || !e) return null
  return {
    startRow: Math.min(s.row, e.row),
    startCol: Math.min(s.col, e.col),
    endRow: Math.max(s.row, e.row),
    endCol: Math.max(s.col, e.col)
  }
}
