/**
 * Mock 配置工具
 * 只有在环境变量 VITE_ENABLE_MOCK=true 时才启用 mock 降级
 */

/** 是否启用 mock 降级（API 不可用时使用 mock 数据兜底） */
export const isMockEnabled = () => {
  return import.meta.env.VITE_ENABLE_MOCK === 'true'
}

/** 判断是否应该使用 mock 兜底 */
export const shouldUseMock = (data) => {
  if (!isMockEnabled()) return false
  return !data || (Array.isArray(data) && data.length === 0)
}
