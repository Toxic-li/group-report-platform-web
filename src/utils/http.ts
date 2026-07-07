/**
 * HTTP 客户端 - 封装 fetch API
 * - 自动携带 token 认证（Sa-Token UUID 格式，Authorization 头直接传 token 值）
 * - 自动解析后端统一 Result<T> 格式，直接返回 data
 * - 401 时 SPA 内跳转，不刷新页面
 */

import router from '@/router/index.js'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

/** 后端统一返回格式 */
interface ApiResult<T = any> {
  code: number
  message?: string
  msg?: string
  data: T
}

/** 带状态码的 Error */
interface HttpError extends Error {
  status?: number
  data?: any
}

/** 请求选项（扩展标准 RequestInit） */
interface RequestOptions extends RequestInit {
  headers?: Record<string, string>
}

/**
 * 获取存储的 token
 * 优先从 sessionStorage 读取，其次 localStorage
 */
function getToken(): string {
  return sessionStorage.getItem('rpt_token') || localStorage.getItem('rpt_token') || ''
}

/**
 * 通用请求方法
 * @param url - 请求地址（不含 base URL）
 * @param options - fetch 选项
 * @returns 返回后端 Result.data 中的数据
 */
async function request<T = any>(url: string, options: RequestOptions = {}): Promise<T | null> {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`

  // 自动添加 token 到请求头（Sa-Token 读取 Authorization 头的原始值，不加 Bearer 前缀）
  const token = getToken()
  const defaultOptions: RequestOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token } : {}),
      ...options.headers,
    },
    credentials: 'include',
  }

  try {
    const response = await fetch(fullUrl, { ...defaultOptions, ...options })

    // 处理认证失败（401）— SPA 内跳转，不刷新页面
    if (response.status === 401) {
      sessionStorage.removeItem('rpt_token')
      sessionStorage.removeItem('rpt_user')
      sessionStorage.removeItem('rpt_permissions')
      sessionStorage.removeItem('rpt_roles')
      localStorage.removeItem('rpt_token')

      const currentPath = router.currentRoute.value.fullPath
      if (!currentPath.includes('/login')) {
        router.push({ path: '/login', query: { redirect: currentPath } })
      }

      throw new Error('登录已过期，请重新登录')
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({} as Record<string, any>))
      const error = new Error(
        errorData.message || errorData.msg || `HTTP ${response.status}: ${response.statusText}`
      ) as HttpError
      error.status = response.status
      error.data = errorData
      throw error
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return null
    }

    // 解析后端统一 Result<T> 格式
    const result: ApiResult<T> = await response.json()

    // 如果是 Result 格式（包含 code, message, data），直接返回 data
    if (result && typeof result === 'object' && 'code' in result) {
      if (result.code === 200 || result.code === 0) {
        return result.data
      } else {
        throw new Error(result.message || result.msg || '请求失败')
      }
    }

    // 如果不是 Result 格式，直接返回原始响应
    return result as unknown as T
  } catch (error) {
    console.error('[HTTP] 请求失败:', error)
    throw error
  }
}

/** GET 请求 */
export function get<T = any>(url: string, options: RequestOptions = {}): Promise<T | null> {
  return request<T>(url, { ...options, method: 'GET' })
}

/** POST 请求 */
export function post<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<T | null> {
  return request<T>(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/** PUT 请求 */
export function put<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<T | null> {
  return request<T>(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/** PATCH 请求 */
export function patch<T = any>(url: string, data?: any, options: RequestOptions = {}): Promise<T | null> {
  return request<T>(url, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

/** DELETE 请求 */
export function del<T = any>(url: string, options: RequestOptions = {}): Promise<T | null> {
  return request<T>(url, { ...options, method: 'DELETE' })
}

/** 文件上传（FormData） */
export function upload<T = any>(url: string, formData: FormData, options: RequestOptions = {}): Promise<T | null> {
  return request<T>(url, {
    ...options,
    method: 'POST',
    body: formData,
    headers: {}, // 让浏览器自动设置 multipart/form-data 边界
  })
}

export default { get, post, put, patch, del, upload }
