/**
 * Toast 提示工具
 */
export function showToast(message, type = 'info') {
  const toast = document.createElement('div')
  toast.className = `global-toast global-toast-${type}`
  toast.textContent = message
  document.body.appendChild(toast)

  // 触发动画
  requestAnimationFrame(() => {
    toast.classList.add('show')
  })

  // 自动消失
  setTimeout(() => {
    toast.classList.remove('show')
    setTimeout(() => toast.remove(), 300)
  }, 2500)
}
