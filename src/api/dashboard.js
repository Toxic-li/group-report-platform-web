/**
 * 工作台 API
 * 后端: DashboardController
 * 代理: /dashboard/* → localhost:8080/api/dashboard/*
 */
import { get } from '@/utils/http'

const BASE = '/dashboard'

/** 获取工作台数据 */
export function getDashboardData() {
  return get(`${BASE}`)
}

/** 获取填报趋势（默认7天） */
export function getFillTrend(days = 7) {
  return get(`${BASE}/trend/fill?days=${days}`)
}

/** 获取业务线分布 */
export function getBizDistribution() {
  return get(`${BASE}/biz/distribution`)
}
