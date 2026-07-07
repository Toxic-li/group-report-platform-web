import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { get, post, put, del } from './http'

// Mock router
vi.mock('@/router/index.js', () => ({
  default: {
    currentRoute: { value: { fullPath: '/report/fill' } },
    push: vi.fn(),
  },
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch as any

describe('HTTP 客户端', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    sessionStorage.clear()
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('GET 请求成功返回 Result.data', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: { get: () => '100' },
      json: async () => ({ code: 200, message: 'OK', data: { id: 1, name: 'test' } }),
    })

    const result = await get('/users/1')
    expect(result).toEqual({ id: 1, name: 'test' })
    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toContain('/users/1')
    expect(options.method).toBe('GET')
  })

  it('POST 请求发送 JSON body', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: { get: () => '100' },
      json: async () => ({ code: 200, data: { success: true } }),
    })

    await post('/reports', { title: '月报', period: '202607' })
    const [, options] = mockFetch.mock.calls[0]
    expect(options.method).toBe('POST')
    expect(options.body).toBe(JSON.stringify({ title: '月报', period: '202607' }))
    expect(options.headers['Content-Type']).toBe('application/json')
  })

  it('自动携带 Sa-Token（Authorization 头传原始 token）', async () => {
    sessionStorage.setItem('rpt_token', 'test-token-123')
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: { get: () => '100' },
      json: async () => ({ code: 200, data: null }),
    })

    await get('/me')
    const [, options] = mockFetch.mock.calls[0]
    expect(options.headers.Authorization).toBe('test-token-123')
  })

  it('401 响应清除 token 并跳转登录', async () => {
    sessionStorage.setItem('rpt_token', 'expired')
    sessionStorage.setItem('rpt_user', 'testuser')
    mockFetch.mockResolvedValueOnce({ status: 401, ok: false })

    await expect(get('/data')).rejects.toThrow('登录已过期')
    expect(sessionStorage.getItem('rpt_token')).toBeNull()
    expect(sessionStorage.getItem('rpt_user')).toBeNull()
  })

  it('非 200 code 抛出后端错误消息', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: { get: () => '100' },
      json: async () => ({ code: 500, message: '服务器内部错误' }),
    })

    await expect(get('/data')).rejects.toThrow('服务器内部错误')
  })

  it('PUT 请求发送 JSON body', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200, ok: true,
      headers: { get: () => '100' },
      json: async () => ({ code: 200, data: { updated: true } }),
    })

    await put('/reports/1', { name: 'updated' })
    const [, options] = mockFetch.mock.calls[0]
    expect(options.method).toBe('PUT')
    expect(options.body).toBe(JSON.stringify({ name: 'updated' }))
  })

  it('DELETE 请求不带 body', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200, ok: true,
      headers: { get: () => '100' },
      json: async () => ({ code: 200, data: null }),
    })

    await del('/reports/1')
    const [, options] = mockFetch.mock.calls[0]
    expect(options.method).toBe('DELETE')
    expect(options.body).toBeUndefined()
  })

  it('204 No Content 返回 null', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 204,
      ok: true,
      headers: { get: () => '0' },
      json: async () => ({}),
    })

    const result = await del('/reports/1')
    expect(result).toBeNull()
  })
})
