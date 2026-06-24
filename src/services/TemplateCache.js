/**
 * TemplateCache - 模板缓存层
 *
 * 特性：
 *   - LRU 淘汰策略
 *   - 版本感知（模板更新后自动失效）
 *   - TTL 过期机制
 *   - 容量限制（默认 20 个模板）
 */

export class TemplateCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 20
    this.ttl = options.ttl || 30 * 60 * 1000  // 默认30分钟

    this.cache = new Map()       // templateId -> { template, version, timestamp }
    this.accessOrder = []        // LRU 访问顺序（队尾=最近访问）
  }

  /** 获取缓存 */
  get(templateId) {
    const entry = this.cache.get(templateId)
    if (!entry) return null

    // TTL 过期检查
    if (Date.now() - entry.timestamp > this.ttl) {
      this.delete(templateId)
      return null
    }

    // LRU: 移到队尾（标记为最近访问）
    const idx = this.accessOrder.indexOf(templateId)
    if (idx > -1) {
      this.accessOrder.splice(idx, 1)
      this.accessOrder.push(templateId)
    }

    return entry.template
  }

  /** 写入缓存 */
  set(templateId, template) {
    // 如果已存在，先删除旧条目
    if (this.cache.has(templateId)) {
      this._removeEntry(templateId)
    }

    // 容量超限时淘汰最久未访问的
    while (this.cache.size >= this.maxSize && this.accessOrder.length > 0) {
      const oldest = this.accessOrder.shift()
      this.cache.delete(oldest)
    }

    this.cache.set(templateId, {
      template,
      version: template.version || '0',
      timestamp: Date.now()
    })
    this.accessOrder.push(templateId)
  }

  /** 删除缓存 */
  delete(templateId) {
    this._removeEntry(templateId)
  }

  /** 使指定模板失效（版本变化时调用） */
  invalidate(templateId) {
    this.delete(templateId)
  }

  /** 使全部缓存失效 */
  clearAll() {
    this.cache.clear()
    this.accessOrder = []
  }

  /** 获取缓存统计 */
  stats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 'N/A',
      entries: Array.from(this.cache.entries()).map(([id, entry]) => ({
        id,
        name: entry.template.name,
        version: entry.version,
        ageMs: Date.now() - entry.timestamp
      }))
    }
  }

  /** 检查是否需要刷新 */
  needsRefresh(templateId, currentVersion) {
    const entry = this.cache.get(templateId)
    if (!entry) return true
    return entry.version !== currentVersion
  }

  _removeEntry(templateId) {
    this.cache.delete(templateId)
    const idx = this.accessOrder.indexOf(templateId)
    if (idx > -1) this.accessOrder.splice(idx, 1)
  }
}
