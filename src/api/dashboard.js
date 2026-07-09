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
