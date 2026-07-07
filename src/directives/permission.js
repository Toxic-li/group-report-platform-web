/**
 * v-permission 指令
 * 用法: <button v-permission="'template:create'">创建</button>
 * 支持多权限: <button v-permission="['template:edit', 'template:manage']">
 *
 * 实现方式：无权限时将元素从 DOM 移除（类似 v-if），而非设置 display:none
 * 避免 display:none 覆盖 flex/grid 等原始布局属性的问题
 */
import { useUserStore } from '@/stores/userStore'
import { watch } from 'vue'

export default {
  mounted(el, binding) {
    const userStore = useUserStore()
    const code = binding.value

    if (!code) return

    // 保存原始父节点引用，用于恢复
    el._permissionParent = el.parentNode
    el._permissionPlaceholder = document.createComment('v-permission')
    el._permissionCode = code

    const checkPermission = () => {
      let hasPerm = false
      if (!userStore.permissions.length) {
        hasPerm = false
      } else if (Array.isArray(code)) {
        hasPerm = code.some(c => userStore.hasPermission(c))
      } else {
        hasPerm = userStore.hasPermission(code)
      }

      if (!hasPerm && el._permissionParent) {
        // 无权限：将元素替换为占位注释节点
        if (el.parentNode === el._permissionParent) {
          el._permissionParent.replaceChild(el._permissionPlaceholder, el)
        }
      } else {
        // 有权限：恢复元素
        if (el.parentNode === el._permissionPlaceholder.parentNode) {
          el._permissionPlaceholder.parentNode.replaceChild(el, el._permissionPlaceholder)
        } else if (el._permissionParent && el._permissionPlaceholder.parentNode === el._permissionParent) {
          el._permissionParent.replaceChild(el, el._permissionPlaceholder)
        }
      }
    }

    checkPermission()

    // 监听权限变化
    const stop = watch(
      () => userStore.permissions,
      () => {
        checkPermission()
      },
      { deep: true }
    )

    el._permissionStop = stop
  },

  beforeUnmount(el) {
    // 清理 watch
    if (el._permissionStop) {
      el._permissionStop()
    }
  }
}
