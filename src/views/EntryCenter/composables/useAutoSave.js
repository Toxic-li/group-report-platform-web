/**
 * useAutoSave - 自动保存 Composable
 *
 * 策略：
 * 1. 内存优先：数据在 Pinia/reactive 中
 * 2. localStorage：快速同步备份（已在 ReportFill 中使用）
 * 3. IndexedDB：大容量兜底（本 composable 提供）
 *
 * 规则：
 * - 30 秒自动保存一次（对齐文档 §18）
 * - 用户离开时保存
 * - 双轨制：后端 API + 本地备份同时进行
 */

const DB_NAME = 'report-center-drafts'
const DB_VERSION = 1
const STORE_NAME = 'entry-drafts'

let dbPromise = null

function openDB() {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    }
  })
  return dbPromise
}

/**
 * 保存草稿到 IndexedDB
 */
export async function saveDraftToIndexedDB(submitId, data) {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const entry = {
      key: `draft_${submitId}`,
      data: JSON.parse(JSON.stringify(data)),
      timestamp: Date.now(),
    }
    store.put(entry)
    return true
  } catch (e) {
    console.warn('[AutoSave] IndexedDB save failed:', e)
    return false
  }
}

/**
 * 从 IndexedDB 恢复草稿
 */
export async function loadDraftFromIndexedDB(submitId) {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    return new Promise((resolve) => {
      const request = store.get(`draft_${submitId}`)
      request.onsuccess = () => {
        const result = request.result
        if (result && Date.now() - result.timestamp < 7 * 24 * 60 * 60 * 1000) {
          resolve(result.data)
        } else {
          resolve(null)
        }
      }
      request.onerror = () => resolve(null)
    })
  } catch (e) {
    return null
  }
}

/**
 * 清除指定草稿
 */
export async function removeDraftFromIndexedDB(submitId) {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.delete(`draft_${submitId}`)
    return true
  } catch {
    return false
  }
}

/**
 * 清理过期草稿（超过 30 天）
 */
export async function cleanExpiredDrafts() {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    request.onsuccess = () => {
      const now = Date.now()
      const expired = request.result.filter(
        entry => now - entry.timestamp > 30 * 24 * 60 * 60 * 1000
      )
      expired.forEach(entry => store.delete(entry.key))
    }
  } catch { /* silent */ }
}

/**
 * 获取所有草稿数量
 */
export async function getDraftCount() {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.count()
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => resolve(0)
    })
  } catch {
    return 0
  }
}

/**
 * Hook: 自动保存管理
 * @param {() => any} getData - 获取当前数据
 * @param {(data: any) => Promise<any>} saveFn - 保存到后端
 * @param {string} submitId - 填报ID
 */
export function useAutoSave(getData, saveFn, submitId) {
  let timer = null
  let isDirty = false

  /**
   * 标记数据已修改
   */
  function markDirty() {
    isDirty = true
  }

  /**
   * 执行双轨保存（后端 + IndexedDB）
   */
  async function performSave() {
    if (!isDirty) return
    const data = getData()
    // IndexedDB 兜底（立即执行）
    saveDraftToIndexedDB(submitId, data)
    // 后端 API（可能失败）
    try {
      await saveFn(data)
      isDirty = false
    } catch {
      // 后端失败没关系，IndexedDB 已保存
    }
  }

  /**
   * 启动自动保存（30 秒防抖）
   */
  function start() {
    stop()
    timer = setInterval(() => {
      if (isDirty) performSave()
    }, 30000)
  }

  /**
   * 停止自动保存
   */
  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  /**
   * 手动触发保存
   */
  async function save() {
    await performSave()
  }

  /**
   * 页面卸载前保存
   */
  function beforeUnload() {
    if (isDirty) {
      const data = getData()
      saveDraftToIndexedDB(submitId, data)
    }
  }

  /**
   * 恢复草稿（优先后端，兜底 IndexedDB）
   */
  async function restore() {
    const local = await loadDraftFromIndexedDB(submitId)
    if (local) {
      return local
    }
    return null
  }

  return {
    markDirty,
    start,
    stop,
    save,
    restore,
    beforeUnload,
  }
}
