import { useRouter } from 'vue-router'

const HISTORY_KEY = 'rpt_nav_history'
const MAX_HISTORY = 20

/**
 * 安全可靠的导航历史，替代不可靠的浏览器 history.back()
 * 使用 sessionStorage 存储导航路径，避免 SPA 中浏览器历史栈的不可靠问题
 */
export function useNavigation() {
  const router = useRouter()

  /**
   * 记录当前路径到导航历史（在路由跳转前调用）
   * @param {string} path - 当前页面路径
   */
  function recordPath(path) {
    try {
      const history = getHistory()
      // 避免重复记录连续相同路径
      if (history.length > 0 && history[history.length - 1] === path) return
      history.push(path)
      if (history.length > MAX_HISTORY) history.shift()
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    } catch { /* ignore */ }
  }

  /**
   * 安全返回上一页
   * 从导航历史中弹出上一页路径并跳转，无历史时回退到主页
   * @param {string} fallback - 无历史时的默认回退路径，默认 '/'
   */
  function navigateBack(fallback = '/') {
    try {
      const history = getHistory()
      // 移除当前页面（最后一个）
      history.pop()
      // 获取上一页
      const prev = history.pop()
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history))
      if (prev) {
        router.push(prev)
      } else {
        router.push(fallback)
      }
    } catch {
      router.push(fallback)
    }
  }

  function getHistory() {
    try {
      const raw = sessionStorage.getItem(HISTORY_KEY)
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  }

  return { recordPath, navigateBack }
}