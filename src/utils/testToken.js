/**
 * Token 认证测试工具
 * 用于验证 token 是否正确存储和携带
 */

import { get } from '@/utils/http.js'

/**
 * ✅ 测试 token 是否正确携带
 * 在浏览器控制台运行：testToken()
 */
export async function testToken() {
  console.log('=== Token 认证测试 ===')
  
  // 1. 检查 token 是否存储
  const token = sessionStorage.getItem('rpt_token') || localStorage.getItem('rpt_token')
  console.log('1. Token 存储状态:', token ? '✅ 已存储' : '❌ 未存储')
  if (token) {
    console.log('   Token 值:', token)
  }
  
  // 2. 检查用户信息是否存储
  const userStr = sessionStorage.getItem('rpt_user') || localStorage.getItem('rpt_user')
  console.log('2. 用户信息存储状态:', userStr ? '✅ 已存储' : '❌ 未存储')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      console.log('   用户信息:', user)
    } catch (e) {
      console.log('   ❌ 解析失败')
    }
  }
  
  // 3. 测试请求是否携带 token
  console.log('3. 测试请求携带 token...')
  try {
    // 发送一个测试请求（可以是任意需要认证的接口）
    const res = await get('/auth/current')
    console.log('   ✅ 请求成功，token 已正确携带')
    console.log('   响应数据:', res)
  } catch (err) {
    if (err.message?.includes('401') || err.message?.includes('过期')) {
      console.log('   ❌ Token 无效或已过期')
      console.log('   错误信息:', err.message)
    } else {
      console.log('   ⚠️ 请求失败（可能是网络问题）:', err.message)
    }
  }
  
  console.log('=== 测试完成 ===')
}

/**
 * ✅ 清除认证信息（用于测试登出）
 */
export function clearAuth() {
  sessionStorage.removeItem('rpt_token')
  sessionStorage.removeItem('rpt_user')
  sessionStorage.removeItem('rpt_roles')
  localStorage.removeItem('rpt_token')
  localStorage.removeItem('rpt_user')
  localStorage.removeItem('rpt_remember')
  localStorage.removeItem('rpt_last_user')
  
  console.log('✅ 认证信息已清除')
}

/**
 * ✅ 模拟登录（用于测试）
 * @param {string} token - 模拟的 token 值
 */
export function mockLogin(token = 'test-token-123456') {
  const mockUser = {
    userId: '1',
    username: 'admin',
    realName: '测试管理员',
    nickname: 'Admin',
    avatar: null,
    orgId: '1',
    orgName: '测试组织',
    roles: ['ADMIN'],
    permissions: ['*:*:*', 'template:create', 'template:edit', 'template:publish', 'template:delete', 'template:permission', 'menu:reportCenter', 'menu:reportFill', 'menu:auditCenter', 'menu:admin'],
    loginTime: new Date().toISOString()
  }
  
  sessionStorage.setItem('rpt_token', token)
  sessionStorage.setItem('rpt_user', JSON.stringify(mockUser))
  sessionStorage.setItem('rpt_roles', JSON.stringify(mockUser.roles))
  sessionStorage.setItem('rpt_permissions', JSON.stringify(mockUser.permissions))
  
  console.log('✅ 模拟登录成功')
  console.log('Token:', token)
  console.log('用户信息:', mockUser)
}

// 在浏览器控制台可直接调用
if (typeof window !== 'undefined') {
  window.testToken = testToken
  window.clearAuth = clearAuth
  window.mockLogin = mockLogin
}