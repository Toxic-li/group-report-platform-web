/**
 * v-permission 指令
 * 用法: <button v-permission="'template:create'">创建</button>
 * 支持多权限: <button v-permission="['template:edit', 'template:manage']">
 */
import { useUserStore } from '@/stores/userStore'
import { watch } from 'vue'

export default {
  mounted(el, binding) {
    const userStore = useUserStore()
    const code = binding.value

    if (!code) return

    const checkPermission = () => {
      if (!userStore.permissions.length) {
        el.style.display = ''
        return
      }
      let hasPerm = false
      if (Array.isArray(code)) {
        hasPerm = code.some(c => userStore.hasPermission(c))
      } else {
        hasPerm = userStore.hasPermission(code)
      }

      if (!hasPerm) {
        el.style.display = 'none'
      } else {
        el.style.display = ''
      }
    }

    checkPermission()

    watch(
      () => userStore.permissions,
      () => {
        checkPermission()
      },
      { deep: true }
    )
  }
}
