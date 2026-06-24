/**
 * 报表 Store - 管理报表状态、数据、子公司切换、集团汇总
 * 
 * 保存策略（双轨制）：
 * - localStorage: 立即保存，离线可用，刷新不丢失
 * - 后端API: 异步提交，持久化到服务器
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ReportTemplate, Subsidiary, REPORT_STATUS } from '@/types/report.js'
import {
  buildFullReportTemplate,
  generateGroupConsolidation
} from '@/mock/dataGenerator.js'
import { saveReportData, getOrgTree } from '@/api/reportDesigner.js'

// localStorage key 前缀
const DRAFT_PREFIX = 'rpt_draft_'

export const useReportStore = defineStore('report', () => {
  // ==================== 状态 ====================
  
  /** 当前选中的子公司ID */
  const currentSubsidiaryId = ref(null)
  
  /** 所有子公司/组织列表（从API加载） */
  const subsidiaries = ref([])
  
  /** 组织数据加载状态 */
  const orgLoading = ref(false)
  
  /** 报表模板 */
  const template = ref(buildFullReportTemplate())
  
  /** 集团汇总模板 */
  const groupTemplate = ref(null)
  
  /** 当前视图模式：'single' 单公司 | 'group' 集团汇总 */
  const viewMode = ref('single')
  
  /** 是否显示集团汇总面板 */
  const showGroupPanel = ref(false)
  
  /** 报表填报状态 */
  const reportStatus = ref(REPORT_STATUS.DRAFT)
  
  /** 最后保存时间 */
  const lastSavedTime = ref(null)
  
  /** 是否正在加载 */
  const loading = ref(false)
  
  /** 已修改的单元格 (用于自动保存) */
  const dirtyCells = ref(new Map())

  /** 当前填报数据（用于保存）- 适配后端 ReportDataSaveDTO */
  const saveData = ref({
    templateId: '',        // 模板ID (Long)
    orgId: '',             // 组织ID (Long) - 必填
    period: '',            // 填报周期 (String) - 必填，如 202401、2024Q1
    rows: [],
    cellData: {},
    cells: [],             // ✅ CellDataDTO 列表格式（适配 /report/data/save）
    formulas: [],
    remark: '',            // 备注
    lastModified: null
  })

  /** 保存状态 */
  const savingStatus = ref('idle') // idle | saving | success | error
  const saveError = ref(null)

  // ==================== 树形展开状态（Pinia持久化） ====================

  /** 树节点展开状态集合 - 存储已展开的行ID */
  const treeExpandedIds = ref(new Set())

  /**
   * 从 localStorage 恢复树形展开状态
   * 在组件初始化时调用，实现刷新后保持展开/收起状态
   */
  function restoreTreeState() {
    try {
      const saved = localStorage.getItem('fr_tree_expanded')
      if (saved) {
        treeExpandedIds.value = new Set(JSON.parse(saved))
      }
    } catch {
      treeExpandedIds.value = new Set()
    }
  }

  /**
   * 持久化树形展开状态到 localStorage
   * 每次展开/收起/全部展开/全部收起后调用
   */
  function persistTreeState() {
    try {
      localStorage.setItem(
        'fr_tree_expanded',
        JSON.stringify([...treeExpandedIds.value])
      )
    } catch {
      // localStorage 不可用时静默失败
    }
  }

  // 初始化时恢复树状态
  restoreTreeState()

  // ==================== 计算属性 ====================
  
  /** 当前选中的子公司 */
  const currentSubsidiary = computed(() => {
    if (!currentSubsidiaryId.value) return null
    return subsidiaries.value.find(s => s.id === currentSubsidiaryId.value)
  })

  /** 当前活跃的模板（根据viewMode） */
  const activeTemplate = computed(() => {
    return viewMode.value === 'group' ? groupTemplate.value : template.value
  })

  /** 统计信息 */
  const statistics = computed(() => {
    const subs = subsidiaries.value
    return {
      total: subs.length,
      draft: subs.filter(s => s.status === 'draft').length,
      submitted: subs.filter(s => s.status === 'submitted' || s.status === 'reviewing').length,
      approved: subs.filter(s => s.status === 'approved').length,
      returned: subs.filter(s => s.status === 'returned').length,
      completionRate: subs.length > 0
        ? ((subs.filter(s => s.status === 'approved').length / subs.length) * 100).toFixed(1)
        : '0.0'
    }
  })

  // ==================== 方法 ====================

  /**
   * 选择子公司
   */
  function selectSubsidiary(subId) {
    currentSubsidiaryId.value = subId
    const sub = subsidiaries.value.find(s => s.id === subId)
    if (sub) {
      reportStatus.value = Object.values(REPORT_STATUS).find(s => s.key === sub.status) || REPORT_STATUS.DRAFT
    }
    // 切换时重新加载数据
    loadSubsidiaryData(subId)
  }

  /**
   * 加载子公司数据
   */
  function loadSubsidiaryData(subId) {
    loading.value = true
    // 模拟异步加载
    setTimeout(() => {
      // 根据子公司ID生成不同的随机数据种子
      template.value = buildFullReportTemplate()
      loading.value = false
    }, 300)
  }

  /**
   * ✅ 从API加载组织机构列表（替换mock数据）
   */
  async function loadOrganizations() {
    if (orgLoading.value) return
    
    orgLoading.value = true
    
    try {
      console.log('[Store] 正在从API加载组织机构...')
      const res = await getOrgTree()
      
      console.log('[Store] 组织API响应:', res)
      
      // 兼容多种返回格式：数组 / {data: []} / {list: []}
      let orgList = []
      if (Array.isArray(res)) {
        orgList = res
      } else if (res?.data && Array.isArray(res.data)) {
        orgList = res.data
      } else if (res?.list && Array.isArray(res.list)) {
        orgList = res.list
      }
      
      // 转换为前端标准格式（扁平化树形结构）
      const flatList = flattenOrgTree(orgList)
      
      subsidiaries.value = flatList.map(org => ({
        id: String(org.id),
        name: org.name || '未命名单位',
        code: org.code || '',
        status: org.status || 'draft',
        parentId: org.parentId ? String(org.parentId) : null,
        level: org.level ?? 0,
        children: org.children || []
      }))
      
      console.log(`[Store] ✅ 已加载 ${subsidiaries.value.length} 个组织/单位`)
      
      // 自动选中第一个
      if (subsidiaries.value.length > 0 && !currentSubsidiaryId.value) {
        currentSubsidiaryId.value = subsidiaries.value[0].id
      }
      
      return subsidiaries.value
      
    } catch (err) {
      console.warn('[Store] ⚠️ 组织API加载失败，使用空列表:', err.message)
      subsidiaries.value = []
      return []
    } finally {
      orgLoading.value = false
    }
  }

  /**
   * ✅ 扁平化组织树结构
   * @param {Array} tree - 树形组织数据
   * @param {Number} level - 当前层级
   * @returns {Array} 扁平化的组织列表
   */
  function flattenOrgTree(tree, level = 0) {
    const result = []
    
    for (const node of tree) {
      result.push({
        ...node,
        level,
        name: node.name || (level === 0 ? `${node.id}集团` : `${node.id}公司`)
      })
      
      // 递归处理子节点
      if (node.children && Array.isArray(node.children) && node.children.length > 0) {
        result.push(...flattenOrgTree(node.children, level + 1))
      }
    }
    
    return result
  }

  /**
   * 切换到单公司视图
   */
  function switchToSingleView() {
    viewMode.value = 'single'
  }

  /**
   * 切换到集团汇总视图
   */
  function switchToGroupView() {
    loading.value = true
    viewMode.value = 'group'
    
    // 生成集团汇总数据
    setTimeout(() => {
      groupTemplate.value = generateGroupConsolidation(
        subsidiaries.value,
        buildFullReportTemplate()
      )
      loading.value = false
    }, 500)
  }

  /**
   * 设置当前填报数据（由 ReportFill 页面调用）
   */
  function setSaveData(data) {
    saveData.value = {
      ...saveData.value,
      ...data,
      lastModified: new Date().toISOString()
    }
  }

  /**
   * ✅ 保存草稿（双轨制：localStorage + 后端API）
   * 
   * @param {Object} options - 保存选项
   * @param {boolean} options.force - 是否强制保存（忽略防抖）
   * @param {string} options.source - 保存来源 'auto' | 'manual' | 'unload' | 'publish'
   * @returns {Promise<{success: boolean, message: string, local: boolean, remote: boolean}>}
   */
  async function saveDraft(options = {}) {
    const { force = false, source = 'auto' } = options
    
    // 如果没有数据需要保存
    if (!saveData.value.templateId && dirtyCells.value.size === 0) {
      return { success: true, message: '无需保存', local: true, remote: true }
    }

    savingStatus.value = 'saving'
    const startTime = Date.now()
    
    try {
      // ========== 1. 立即保存到 localStorage（同步，保证不丢失）==========
      let localSuccess = false
      try {
        const draftKey = `${DRAFT_PREFIX}${saveData.value.templateCode || saveData.value.templateId}`
        const draftData = {
          ...saveData.value,
          dirtyCells: Array.from(dirtyCells.value.entries()),
          savedAt: new Date().toISOString(),
          source
        }
        localStorage.setItem(draftKey, JSON.stringify(draftData))
        localSuccess = true
        console.log(`[Save] ✅ 本地保存成功 (${Date.now() - startTime}ms)`, draftKey)
      } catch (err) {
        console.warn('[Save] ⚠️ localStorage 保存失败:', err.message)
      }

      // ========== 2. 异步提交到后端 API (/report/data/save) ==========
      let remoteSuccess = false
      let remoteError = null
      
      // 检查必填字段
      if (saveData.value.templateId && saveData.value.orgId && saveData.value.period) {
        try {
          // ✅ 构建 ReportDataSaveDTO 格式的 payload
          const cells = buildCellDataDTO(saveData.value)
          
          const payload = {
            templateId: Number(saveData.value.templateId),  // Long 类型
            orgId: Number(saveData.value.orgId),            // Long 类型
            period: saveData.value.period,                  // String，如 202401、2024Q1
            cells: cells,                                   // List<CellDataDTO>
            remark: saveData.value.remark || ''
          }
          
          console.log('[Save] 提交数据到 /report/data/save:', payload)
          
          // 调用报表数据保存接口
          await saveReportData(payload)
          remoteSuccess = true
          console.log(`[Save] ✅ 后端保存成功 (${Date.now() - startTime}ms)`)
        } catch (err) {
          remoteError = err.message || err
          console.warn('[Save] ⚠️ 后端保存失败:', remoteError)
          // 后端失败不影响本地已保存的状态
        }
      } else if (saveData.value.templateId && (!saveData.value.orgId || !saveData.value.period)) {
        console.warn('[Save] ⚠️ 缺少必填字段 orgId 或 period，跳过后端保存')
        remoteError = '缺少组织ID或填报周期'
      }

      // 更新状态
      lastSavedTime.value = new Date().toLocaleString('zh-CN')
      
      if (currentSubsidiaryId.value) {
        const sub = subsidiaries.value.find(s => s.id === currentSubsidiaryId.value)
        if (sub) {
          sub.status = source === 'publish' ? 'approved' : 'draft'
          reportStatus.value = source === 'publish' ? REPORT_STATUS.APPROVED : REPORT_STATUS.DRAFT
        }
      }
      
      dirtyCells.value.clear()
      savingStatus.value = remoteSuccess ? 'success' : (localSuccess ? 'success' : 'error')
      saveError.value = remoteError

      const result = {
        success: localSuccess || remoteSuccess,
        message: buildSaveMessage(source, localSuccess, remoteSuccess),
        local: localSuccess,
        remote: remoteSuccess,
        time: lastSavedTime.value
      }

      console.log(`[Save] 完成:`, result)
      return result

    } catch (err) {
      savingStatus.value = 'error'
      saveError.value = err.message
      console.error('[Save] ❌ 保存异常:', err)
      return { success: false, message: `保存失败: ${err.message}`, local: false, remote: false }
    }
  }

  /**
   * 构建保存结果消息
   */
  function buildSaveMessage(source, localSuccess, remoteSuccess) {
    const sourceMap = { auto: '自动保存', manual: '保存', unload: '离开保存', publish: '发布保存' }
    const label = sourceMap[source] || '保存'
    
    if (localSuccess && remoteSuccess) return `${label}成功`
    if (localSuccess && !remoteSuccess) return `${label}成功（本地）`
    if (!localSuccess && remoteSuccess) return `${label}成功（服务器）`
    return `${label}失败`
  }

  /**
   * ✅ 构建 CellDataDTO 列表（适配后端 /report/data/save 接口）
   * 将 cellData 对象转换为 List<CellDataDTO> 数组格式
   * 
   * @param {Object} saveData - 保存数据对象
   * @returns {Array<CellDataDTO>} 单元格数据列表
   */
  function buildCellDataDTO(data) {
    const cells = []
    const cellData = data.cellData || {}
    
    // 遍历 cellData 对象，转换为数组
    // cellData 格式: { "4-2": { v: "100", raw: "100" }, "5-2": { v: "200", ... } }
    for (const [key, cell] of Object.entries(cellData)) {
      // 跳过表头行和空值单元格
      if (!cell || !cell.v || String(cell.v).trim() === '') continue
      
      // 解析 key 格式: "rowIndex-colIndex"
      const [rowIdx, colIdx] = key.split('-').map(Number)
      
      // 查找对应的行列信息
      const row = (data.rows || [])[rowIdx - (data.frozenRowCount || 4)]
      
      cells.push({
        rowIndex: rowIdx,      // 行索引
        colIndex: colIdx,      // 列索引
        rowId: row?.id || `r_${rowIdx}`,      // 行ID
        colId: `c_${colIdx}`,                  // 列ID
        value: String(cell.v),                 // 单元格值
        rawValue: cell.raw || String(cell.v),  // 原始值
        formula: cell.f || null                // 公式（如有）
      })
    }
    
    console.log(`[CellDataDTO] 转换完成: ${cells.length} 个有效单元格`)
    return cells
  }

  /**
   * ✅ 强制立即保存（用于手动点击、发布、离开页面）
   */
  async function forceSave(source = 'manual') {
    return saveDraft({ force: true, source })
  }

  /**
   * 从 localStorage 恢复草稿
   * @param {string} templateCode - 模板代码
   * @returns {Object|null} 草稿数据或 null
   */
  function getDraftFromLocalStorage(templateCode) {
    try {
      const key = `${DRAFT_PREFIX}${templateCode}`
      const saved = localStorage.getItem(key)
      if (saved) {
        const data = JSON.parse(saved)
        console.log(`[Save] 📦 从本地恢复草稿:`, templateCode, data.savedAt)
        return data
      }
    } catch (err) {
      console.warn('[Save] 草稿恢复失败:', err)
    }
    return null
  }

  /**
   * 清除本地草稿
   * @param {string} templateCode - 模板代码
   */
  function clearLocalDraft(templateCode) {
    try {
      localStorage.removeItem(`${DRAFT_PREFIX}${templateCode}`)
    } catch { }
  }

  /**
   * 提交上报
   */
  function submitReport() {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (currentSubsidiaryId.value) {
          const sub = subsidiaries.value.find(s => s.id === currentSubsidiaryId.value)
          if (sub) {
            sub.status = 'submitted'
            sub.submitTime = new Date().toLocaleString('zh-CN')
            reportStatus.value = REPORT_STATUS.SUBMITTED
          }
        }
        resolve({ success: true, message: '提交成功，等待审核' })
      }, 500)
    })
  }

  /**
   * 审核通过
   */
  function approveReport(subId) {
    const sub = subsidiaries.value.find(s => s.id === subId)
    if (sub) {
      sub.status = 'approved'
    }
  }

  /**
   * 退回修改
   */
  function returnReport(subId, reason = '') {
    const sub = subsidiaries.value.find(s => s.id === subId)
    if (sub) {
      sub.status = 'returned'
    }
    return { success: true, message: `已退回${sub?.name || ''}，原因：${reason || '请修改后重新提交'}` }
  }

  /**
   * 更新单元格值
   */
  function updateCellValue(rowId, columnId, value) {
    const key = `${rowId}_${columnId}`
    dirtyCells.value.set(key, { rowId, columnId, value, timestamp: Date.now() })
    
    // 同时更新模板中的值
    if (template.value && template.value.values) {
      const cell = template.value.values.find(v => v.rowId === rowId && v.columnId === columnId)
      if (cell) {
        cell.value = value
      }
    }
  }

  /**
   * 自动保存（防抖）
   */
  /** 自动保存定时器 */
  let autoSaveTimer = null
  
  /**
   * 触发自动保存（15秒防抖）
   * 连续操作时只会在最后一次操作后15秒触发
   */
  function triggerAutoSave() {
    if (autoSaveTimer) clearTimeout(autoSaveTimer)
    autoSaveTimer = setTimeout(async () => {
      if (dirtyCells.value.size > 0 || saveData.value.templateId) {
        console.log('[AutoSave] 15秒防抖触发，开始保存...')
        await saveDraft({ source: 'auto' })
      }
    }, 15000) // ✅ 15秒无操作后自动保存
  }

  /**
   * 取消待执行的自动保存（用于强制保存前）
   */
  function cancelAutoSave() {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
      autoSaveTimer = null
    }
  }

  /**
   * 获取当前时间字符串
   */
  function getCurrentTime() {
    return new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  return {
    // 状态
    currentSubsidiaryId,
    subsidiaries,
    orgLoading,
    template,
    groupTemplate,
    viewMode,
    showGroupPanel,
    reportStatus,
    lastSavedTime,
    loading,
    dirtyCells,
    treeExpandedIds,
    saveData,
    savingStatus,
    saveError,

    // 计算属性
    currentSubsidiary,
    activeTemplate,
    statistics,

    // 方法
    selectSubsidiary,
    loadSubsidiaryData,
    loadOrganizations,      // ✅ 新增：从API加载组织列表
    switchToSingleView,
    switchToGroupView,
    setSaveData,
    saveDraft,
    forceSave,
    getDraftFromLocalStorage,
    clearLocalDraft,
    submitReport,
    approveReport,
    returnReport,
    updateCellValue,
    triggerAutoSave,
    cancelAutoSave,
    getCurrentTime,
    restoreTreeState,
    persistTreeState
  }
})
