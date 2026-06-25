/**
 * HTTP 客户端 - 封装 fetch API
 * ✅ 自动携带 token 认证
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
 * @returns {Promise<any>}
 */
async function request(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`

  // ✅ 自动添加 token 到请求头
  const token = getToken()
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `${token}` } : {}),  // ✅ 添加 Authorization 头
      ...options.headers,
    },
    credentials: 'include', // 携带 cookie
  }

  try {
    const response = await fetch(fullUrl, { ...defaultOptions, ...options })

    // ✅ 处理认证失败（401）
    if (response.status === 401) {
      // 清除本地认证信息
      sessionStorage.removeItem('rpt_token')
      sessionStorage.removeItem('rpt_user')
      localStorage.removeItem('rpt_token')
      
      // 跳转到登录页（如果不在登录页）
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
      }
      
      throw new Error('登录已过期，请重新登录')
    }

    // 处理非 2xx 响应
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      error.status = response.status
      error.data = errorData
      throw error
    }

    // 204 No Content 或返回空的情况
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return null
    }

    return await response.json()
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