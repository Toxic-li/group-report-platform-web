/**
 * 统一错误处理工具
 * - 将后端异常 / 网络错误分类为友好提示
 * - 提供重试机制
 */

import { ElMessage, ElNotification } from 'element-plus'

/** 错误类型 */
export const ErrorType = {
  NETWORK: 'NETWORK',
  AUTH: 'AUTH',
  PERMISSION: 'PERMISSION',
  VALIDATION: 'VALIDATION',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER',
  BUSINESS: 'BUSINESS',
  UNKNOWN: 'UNKNOWN',
}

/** 解析错误 */
export function classifyError(err) {
  if (!err) return { type: ErrorType.UNKNOWN, message: '未知错误', status: 0 }
  const msg = (err.message || String(err)).trim()

  // 401 认证
  if (err.status === 401 || /登录已过期|未登录|401/.test(msg)) {
    return { type: ErrorType.AUTH, message: '登录已过期，请重新登录', status: 401 }
  }
  // 403 权限
  if (err.status === 403 || /无权限|403/.test(msg)) {
    return { type: ErrorType.PERMISSION, message: '您没有权限执行此操作', status: 403 }
  }
  // 404
  if (err.status === 404 || /404|不存在|未找到/.test(msg)) {
    return { type: ErrorType.NOT_FOUND, message: '请求的资源不存在', status: 404 }
  }
  // 网络
  if (err.status === 0 || /Failed to fetch|NetworkError|TypeError.*fetch/i.test(msg)) {
    return { type: ErrorType.NETWORK, message: '网络连接失败，请检查网络', status: 0 }
  }
  // 校验
  if (err.status === 400 || /参数|校验|400/.test(msg)) {
    return { type: ErrorType.VALIDATION, message: msg || '请求参数有误', status: 400 }
  }
  // 业务
  if (err.status === 409 || /已存在|冲突|不允许/.test(msg)) {
    return { type: ErrorType.BUSINESS, message: msg || '操作不被允许', status: 409 }
  }
  // 5xx 服务端
  if (err.status >= 500) {
    return { type: ErrorType.SERVER, message: '服务器繁忙，请稍后重试', status: err.status }
  }
  return { type: ErrorType.BUSINESS, message: msg || '操作失败', status: err.status || 0 }
}

/**
 * 简单 toast 提示
 */
export function showError(err) {
  const e = classifyError(err)
  ElMessage.error(e.message)
  return e
}

/**
 * 重要错误：右上角通知（带重试）
 */
export function showErrorWithRetry(err, onRetry) {
  const e = classifyError(err)
  if (e.type === ErrorType.NETWORK || e.type === ErrorType.SERVER) {
    ElNotification({
      title: '操作失败',
      message: e.message,
      type: 'error',
      duration: 0,
      customClass: 'app-error-notify',
    })
  } else {
    ElMessage.error(e.message)
  }
  return e
}

/**
 * 通用重试执行器
 * @param fn - 异步函数
 * @param options - { retries: 3, delay: 1000, onError }
 */
export async function withRetry(fn, options = {}) {
  const { retries = 3, delay = 1000, onError } = options
  let lastErr
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      const classified = classifyError(err)
      // 认证/权限/校验 错误不重试
      if ([ErrorType.AUTH, ErrorType.PERMISSION, ErrorType.VALIDATION, ErrorType.NOT_FOUND].includes(classified.type)) {
        throw err
      }
      if (onError) onError(err, i + 1)
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, delay * (i + 1)))
      }
    }
  }
  throw lastErr
}
