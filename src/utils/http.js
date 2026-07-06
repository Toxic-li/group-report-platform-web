/**
 * HTTP 客户端 - 封装 fetch API
 * ✅ 自动携带 token 认证
 * ✅ 自动解析后端统一 Result<T> 格式，直接返回 data
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

/**
 * ✅ 获取存储的 token
 * 优先从 sessionStorage 读取，其次 localStorage
 */
function getToken() {
  return sessionStorage.getItem('rpt_token') || localStorage.getItem('rpt_token') || ''
}

/**
 * 通用请求方法
 * @param {string} url - 请求地址（不含 base URL）
 * @param {RequestInit} options - fetch 选项
 * @returns {Promise<any>} 返回后端 Result.data 中的数据
 */
async function request(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`

  // ✅ 自动添加 token 到请求头
  const token = getToken()
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `${token}` } : {}),
      ...options.headers,
    },
    credentials: 'include',
  }

  try {
    const response = await fetch(fullUrl, { ...defaultOptions, ...options })

    // ✅ 处理认证失败（401）
    if (response.status === 401) {
      sessionStorage.removeItem('rpt_token')
      sessionStorage.removeItem('rpt_user')
      localStorage.removeItem('rpt_token')
      
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
      }
      
      throw new Error('登录已过期，请重新登录')
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const error = new Error(errorData.message || errorData.msg || `HTTP ${response.status}: ${response.statusText}`)
      error.status = response.status
      error.data = errorData
      throw error
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return null
    }

    // ✅ 解析后端统一 Result<T> 格式
    const result = await response.json()
    
    // 如果是 Result 格式（包含 code, message, data），直接返回 data
    if (result && typeof result === 'object' && 'code' in result) {
      if (result.code === 200 || result.code === 0) {
        return result.data
      } else {
        throw new Error(result.message || result.msg || '请求失败')
      }
    }
    
    // 如果不是 Result 格式，直接返回原始响应
    return result
  } catch (error) {
    console.error('[HTTP] 请求失败:', error)
    throw error
  }
}

/**
 * GET 请求
 */
export function get(url, options = {}) {
  return request(url, { ...options, method: 'GET' })
}

/**
 * POST 请求
 */
export function post(url, data, options = {}) {
  return request(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * PUT 请求
 */
export function put(url, data, options = {}) {
  return request(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * PATCH 请求
 */
export function patch(url, data, options = {}) {
  return request(url, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

/**
 * DELETE 请求
 */
export function del(url, options = {}) {
  return request(url, { ...options, method: 'DELETE' })
}

/**
 * 文件上传（FormData）
 */
export function upload(url, formData, options = {}) {
  return request(url, {
    ...options,
    method: 'POST',
    body: formData,
    headers: {}, // 让浏览器自动设置 multipart/form-data 边界
  })
}

export default { get, post, put, patch, del, upload }