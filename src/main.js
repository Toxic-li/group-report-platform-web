import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import router from './router'
import permissionDirective from './directives/permission.js'
import App from './App.vue'
import '@univerjs/design/lib/index.css'
import '@univerjs/ui/lib/index.css'
import '@univerjs/sheets-ui/lib/index.css'
import '@univerjs/docs-ui/lib/index.css'
import './styles/global.scss'

// ✅ 开发环境导入测试工具
if (import.meta.env.DEV) {
  import('./utils/testToken.js').then(() => {
    console.log('[Dev] ✅ Token测试工具已加载，可在控制台使用: testToken(), clearAuth(), mockLogin()')
  })
  
  import('./utils/testDataFormat.js').then(() => {
    console.log('[Dev] ✅ 数据格式测试工具已加载，可在控制台使用: testCompleteDataFlow()')
  })
  
  import('./utils/testBusinessId.js').then(() => {
    console.log('[Dev] ✅ 业务ID测试工具已加载，可在控制台使用: testAllBusinessIdConversions()')
  })
}

const app = createApp(App)

// 注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// ⭐ 注册 v-permission 指令
app.directive('permission', permissionDirective)

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn })
app.mount('#app')
