/**
 * HTTP 客户端 - 封装 fetch API
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

/**
 * 通用请求方法
 * @param {string} url - 请求地址（不含 base URL）
 * @param {RequestInit} options - fetch 选项
 * @returns {Promise<any>}
 */
async function request(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // 携带 cookie
  }

  try {
    const response = await fetch(fullUrl, { ...defaultOptions, ...options })

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