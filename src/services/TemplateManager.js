/**
 * TemplateManager - 模板管理中心
 *
 * 职责：
 *   1. 模板 CRUD（创建/读取/更新/删除/复制）
 *   2. 版本管理（发布/回滚/历史查看）
 *   3. 状态管理（草稿/发布/停用/归档）
 *   4. 模板列表查询（分类/搜索/分页）
 *
 * 数据源：
 *   开发阶段使用 localStorage 模拟
 *   生产环境替换为 API 调用
 */

import { ReportTemplate, TemplateVersion } from '../types/engine.js'

const STORAGE_KEY_TEMPLATES = 'fr_templates'
const STORAGE_KEY_VERSIONS = 'fr_template_versions'

export class TemplateManager {
  constructor() {
    this._templates = new Map()
    this._versions = new Map()
    this._loadFromStorage()
  }

  // ==================== CRUD 操作 ====================

  /** 创建模板 */
  create(templateData) {
    const id = templateData.id || `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    const now = new Date().toISOString()

    const template = new ReportTemplate({
      ...templateData,
      id,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      createdBy: templateData.createdBy || 'system'
    })

    this._templates.set(id, template)
    this._persist()

    // 创建初始版本
    this._createVersion(template, '初始版本')

    return template
  }

  /** 读取模板 */
  get(templateId) {
    return this._templates.get(templateId) || null
  }

  /** 更新模板 */
  update(templateId, updates) {
    const tpl = this._templates.get(templateId)
    if (!tpl) throw new Error(`模板不存在: ${templateId}`)

    Object.assign(tpl, updates, { updatedAt: new Date().toISOString() })
    tpl.invalidateCache() // 清除运行时缓存
    this._persist()

    return tpl
  }

  /** 删除模板（软删除 → archived） */
  delete(templateId) {
    const tpl = this._templates.get(templateId)
    if (!tpl) return false

    tpl.status = 'deprecated'
    tpl.updatedAt = new Date().toISOString()
    this._persist()
    return true
  }

  /** 复制模板 */
  duplicate(templateId, newName) {
    const source = this.get(templateId)
    if (!source) throw new Error(`源模板不存在: ${templateId}`)

    const now = new Date().toISOString()
    const copy = JSON.parse(JSON.stringify(source))

    const newTpl = this.create({
      ...copy,
      id: undefined,
      code: `${source.code}_copy`,
      name: newName || `${source.name}(副本)`,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      parentVersionId: null,
      changelog: []
    })

    return newTpl
  }

  // ==================== 版本管理 ====================

  /** 发布模板（自动创建新版本） */
  publish(templateId, changelog = '') {
    const tpl = this.get(templateId)
    if (!tpl) throw new Error(`模板不存在: ${templateId}`)

    const prevStatus = tpl.status
    tpl.status = 'published'
    tpl.publishedBy = 'current_user'
    tpl.publishedAt = new Date().toISOString()
    tpl.updatedAt = new Date().toISOString()

    // 自动升级版本号
    const [major, minor, patch] = (tpl.version || '0.0.0').split('.').map(Number)
    if (prevStatus === 'published') {
      tpl.version = `${major}.${minor + 1}.0`
    } else {
      tpl.version = `${major + 1}.0.0`
    }

    this._createVersion(tpl, changelog || `发布版本 ${tpl.version}`)
    this._persist()

    return tpl
  }

  /** 停用模板 */
  archive(templateId) {
    return this.update(templateId, { status: 'archived' })
  }

  /** 查看版本历史 */
  getVersionHistory(templateId) {
    return (this._versions.get(templateId) || []).sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    )
  }

  /** 回滚到指定版本 */
  rollback(templateId, targetVersion) {
    const versions = this._versions.get(templateId) || []
    const target = versions.find(v => v.version === targetVersion)
    if (!target) throw new Error(`版本不存在: ${targetVersion}`)

    // 恢复快照数据
    const restored = JSON.parse(target.snapshot)
    restored.id = templateId
    restored.updatedAt = new Date().toISOString()
    restored.status = 'draft'
    restored.changelog = [...(restored.changelog || []), `从版本 ${targetVersion} 回滚`]

    this._templates.set(templateId, new ReportTemplate(restored))
    this._createVersion(this._templates.get(templateId), `回滚至 V${targetVersion}`)
    this._persist()

    return this._templates.get(templateId)
  }

  // ==================== 查询操作 ====================

  /** 列出所有模板 */
  list(options = {}) {
    let results = Array.from(this._templates.values())

    // 状态过滤
    if (options.status) {
      const statuses = Array.isArray(options.status) ? options.status : [options.status]
      results = results.filter(t => statuses.includes(t.status))
    }

    // 分类过滤
    if (options.category) {
      results = results.filter(t => t.category === options.category)
    }

    // 搜索
    if (options.search) {
      const kw = options.search.toLowerCase()
      results = results.filter(t =>
        t.name.toLowerCase().includes(kw) ||
        t.code.toLowerCase().includes(kw) ||
        (t.description || '').toLowerCase().includes(kw)
      )
    }

    // 排序
    results.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

    // 分页
    if (options.page && options.pageSize) {
      const start = (options.page - 1) * options.pageSize
      results = results.slice(start, start + options.pageSize)
    }

    return {
      data: results,
      total: this._templates.size
    }
  }

  /** 按分类统计 */
  statsByCategory() {
    const stats = {}
    for (const tpl of this._templates.values()) {
      if (!stats[tpl.category]) stats[tpl.category] = { total: 0, published: 0, draft: 0 }
      stats[tpl.category].total++
      if (tpl.status === 'published') stats[tpl.category].published++
      else if (tpl.status === 'draft') stats[tpl.category].draft++
    }
    return stats
  }

  // ==================== 内部方法 ====================

  _createVersion(template, changelog) {
    const version = new TemplateVersion({
      templateId: template.id,
      version: template.version,
      snapshot: JSON.stringify(template),
      changelog,
      createdBy: template.updatedBy || 'system',
      createdAt: new Date().toISOString()
    })

    if (!this._versions.has(template.id)) {
      this._versions.set(template.id, [])
    }
    this._versions.get(template.id).push(version)
    this._persistVersions()
  }

  _persist() {
    try {
      const data = {}
      for (const [id, tpl] of this._templates) {
        data[id] = { ...tpl }
        delete data[id]._flatRows  // 不序列化运行时缓存
        delete data[id]._flatCols
        delete data[id]._rowMap
        delete data[id]._colMap
      }
      localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(data))
    } catch (e) {
      console.error('[TemplateManager] 持久化失败:', e)
    }
  }

  _persistVersions() {
    try {
      localStorage.setItem(STORAGE_KEY_VERSIONS, JSON.stringify(
        Object.fromEntries(this._versions)
      ))
    } catch (e) {
      console.error('[TemplateManager] 版本持久化失败:', e)
    }
  }

  _loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TEMPLATES)
      if (raw) {
        const data = JSON.parse(raw)
        for (const [id, obj] of Object.entries(data)) {
          this._templates.set(id, new ReportTemplate(obj))
        }
      }

      const verRaw = localStorage.getItem(STORAGE_KEY_VERSIONS)
      if (verRaw) {
        const data = JSON.parse(verRaw)
        for (const [id, arr] of Object.entries(data)) {
          this._versions.set(id, arr.map(v => new TemplateVersion(v)))
        }
      }
    } catch (e) {
      console.warn('[TemplateManager] 加载本地数据失败:', e)
    }
  }
}
