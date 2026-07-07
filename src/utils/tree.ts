/**
 * 树形数据通用工具函数
 * 从多个组件中提取的公共逻辑，消除重复代码
 */

/** 通用树节点接口 */
export interface TreeNode {
  id: string | number
  name?: string
  children?: TreeNode[]
  [key: string]: any
}

/** 周期选项 */
export interface PeriodOption {
  label: string
  value: string
}

/**
 * 扁平化组织树
 * @param tree - 树形数据
 * @returns 扁平化后的列表
 */
export function flattenOrgTree<T extends TreeNode>(tree: T[] | null | undefined): T[] {
  const result: T[] = []
  if (!tree || !Array.isArray(tree)) return result

  function walk(nodes: T[]) {
    for (const node of nodes) {
      result.push(node)
      if (node.children && node.children.length > 0) {
        walk(node.children as T[])
      }
    }
  }
  walk(tree)
  return result
}

/**
 * 扁平化通用树结构
 * @param tree - 树形数据
 * @param childrenKey - 子节点字段名，默认 'children'
 * @returns 扁平化后的列表
 */
export function flattenTree<T extends Record<string, any>>(
  tree: T[] | null | undefined,
  childrenKey = 'children'
): T[] {
  const result: T[] = []
  if (!tree || !Array.isArray(tree)) return result

  for (const node of tree) {
    result.push(node)
    const children = node[childrenKey]
    if (children && Array.isArray(children)) {
      result.push(...flattenTree(children, childrenKey))
    }
  }
  return result
}

/**
 * 生成周期列表（年月）
 * @param year - 年份
 * @param count - 生成的月份数量，默认12
 * @returns 周期选项
 */
export function generatePeriodList(year: number, count = 12): PeriodOption[] {
  const periods: PeriodOption[] = []
  for (let month = 1; month <= count; month++) {
    periods.push({
      label: `${year}年${month}月`,
      value: `${year}${String(month).padStart(2, '0')}`
    })
  }
  return periods
}

/**
 * 获取当前年月周期
 * @returns 如 "202607"
 */
export function getCurrentPeriod(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  return `${year}${String(month).padStart(2, '0')}`
}
