import { describe, it, expect } from 'vitest'
import { flattenOrgTree, flattenTree, generatePeriodList, getCurrentPeriod, type TreeNode } from './tree'

describe('flattenOrgTree', () => {
  it('扁平化空数组返回空数组', () => {
    expect(flattenOrgTree([])).toEqual([])
  })

  it('扁平化 null/undefined 返回空数组', () => {
    expect(flattenOrgTree(null)).toEqual([])
    expect(flattenOrgTree(undefined)).toEqual([])
  })

  it('扁平化单层树（无子节点）', () => {
    const tree = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ]
    expect(flattenOrgTree(tree)).toHaveLength(2)
  })

  it('扁平化多层嵌套树', () => {
    const tree: TreeNode[] = [
      { id: 1, name: '总部', children: [
        { id: 11, name: '分公司A', children: [
          { id: 111, name: '部门1' },
          { id: 112, name: '部门2' },
        ]},
        { id: 12, name: '分公司B' },
      ]},
    ]
    const flat = flattenOrgTree(tree)
    expect(flat).toHaveLength(5)
    expect(flat.map(n => n.id)).toEqual([1, 11, 111, 112, 12])
  })

  it('保留节点上的自定义属性', () => {
    const tree = [{ id: 1, name: 'A', code: 'ORG001', level: 3 }]
    const flat = flattenOrgTree(tree)
    expect(flat[0].code).toBe('ORG001')
    expect(flat[0].level).toBe(3)
  })
})

describe('flattenTree', () => {
  it('支持自定义 children 字段名', () => {
    const tree = [
      { id: 1, name: 'A', subs: [
        { id: 11, name: 'B', subs: [] },
      ]},
    ]
    const flat = flattenTree(tree as any, 'subs')
    expect(flat).toHaveLength(2)
    expect(flat[1].id).toBe(11)
  })

  it('空 children 数组不会产生多余节点', () => {
    const tree = [{ id: 1, children: [] }]
    expect(flattenTree(tree)).toHaveLength(1)
  })
})

describe('generatePeriodList', () => {
  it('生成 12 个月的周期列表（默认）', () => {
    const periods = generatePeriodList(2026)
    expect(periods).toHaveLength(12)
    expect(periods[0]).toEqual({ label: '2026年1月', value: '202601' })
    expect(periods[11]).toEqual({ label: '2026年12月', value: '202612' })
  })

  it('生成指定数量的月份', () => {
    const periods = generatePeriodList(2026, 6)
    expect(periods).toHaveLength(6)
    expect(periods[5]).toEqual({ label: '2026年6月', value: '202606' })
  })

  it('月份补零为两位数', () => {
    const periods = generatePeriodList(2026, 3)
    expect(periods[0].value).toBe('202601')
    expect(periods[2].value).toBe('202603')
  })
})

describe('getCurrentPeriod', () => {
  it('返回当前年月，格式 YYYYMM', () => {
    const period = getCurrentPeriod()
    const now = new Date()
    const expected = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
    expect(period).toBe(expected)
    expect(period).toMatch(/^\d{6}$/)
  })
})
