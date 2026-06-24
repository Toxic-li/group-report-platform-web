/**
 * ReportFactory - 报表工厂
 *
 * 根据模板自动创建报表实例。
 * 所有报表类型通过此工厂统一创建，无需为每张报表编写独立代码。
 *
 * 支持的报表类型（通过模板 category 区分）：
 *   production  - 生产类报表（煤炭生产销售库存表）
 *   finance     - 经营类报表（经营指标月报）
 *   safety      - 安全类报表（安全生产统计表）
 *   energy      - 能源类报表（能源消耗统计表）
 *   hr          - 人事类报表
 *   cost        - 成本类报表
 *   other       - 其他
 */

import { ReportEngine } from './ReportEngine.js'
import { TemplateManager } from './TemplateManager.js'
import { TemplateCache } from './TemplateCache.js'

// 全局单例
let _templateManager = null
let _templateCache = null

function getTemplateManager() {
  if (!_templateManager) _templateManager = new TemplateManager()
  return _templateManager
}

function getTemplateCache() {
  if (!_templateCache) _templateCache = new TemplateCache({ maxSize: 20 })
  return _templateCache
}

export class ReportFactory {
  constructor(options = {}) {
    this.templateManager = options.templateManager || getTemplateManager()
    this.templateCache = options.templateCache || getTemplateCache()
    this.dataLoader = options.dataLoader || null
  }

  /**
   * 创建报表实例（核心方法）
   *
   * @param {string} templateId - 模板ID，如 '1001', '1002'
   * @param {object} context - 运行上下文
   * @returns {Promise<ReportEngine>} 已初始化的报表引擎实例
   */
  async create(templateId, context = {}) {
    // 1. 从缓存获取或加载模板
    let template = this.templateCache.get(templateId)
    if (!template) {
      template = this.templateManager.get(templateId)
      if (!template) throw new Error(`模板不存在: ${templateId}`)
      this.templateCache.set(templateId, template)
    }

    // 2. 验证模板状态
    if (template.status === 'deprecated') {
      throw new Error(`模板已停用: ${template.name} (${template.id})`)
    }

    // 3. 创建并初始化报表引擎
    const engine = new ReportEngine({
      templateCache: this.templateCache,
      dataLoader: this.dataLoader
    })

    await engine.loadReport(templateId, context)

    return engine
  }

  /**
   * 批量预加载模板（用于列表页加速）
   */
  async preload(templateIds) {
    for (const id of templateIds) {
      if (!this.templateCache.get(id)) {
        const tpl = this.templateManager.get(id)
        if (tpl) this.templateCache.set(id, tpl)
      }
    }
  }

  /** 获取所有可用模板列表 */
  listTemplates(options = {}) {
    return this.templateManager.list(options)
  }

  /** 按分类获取模板 */
  getByCategory(category) {
    return this.listTemplates({ category, status: ['published', 'draft'] })
  }
}
