<template>
  <div class="login-page">
    <!-- 背景装饰 -->
    <div class="login-bg">
      <div class="login-bg-circle login-bg-1"></div>
      <div class="login-bg-circle login-bg-2"></div>
      <div class="login-bg-circle login-bg-3"></div>
    </div>

    <!-- 登录卡片 -->
    <div class="login-card">
      <!-- Logo 和标题 -->
      <div class="login-header">
        <div class="login-logo">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="#2563EB"/>
            <path d="M12 16h24M12 24h20M12 32h16" stroke="white" stroke-width="3" stroke-linecap="round"/>
          </svg>
        </div>
        <h1 class="login-title">报表中心</h1>
        <p class="login-subtitle">Report Center</p>
      </div>

      <!-- 登录表单 -->
      <form class="login-form" @submit.prevent="handleLogin">
        <!-- 用户名 -->
        <div class="form-group">
          <label for="username">用户名 / 手机号</label>
          <div class="input-wrapper">
            <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <input
              id="username"
              v-model="form.username"
              type="text"
              placeholder="请输入用户名或手机号"
              autocomplete="username"
              :disabled="loading"
              ref="usernameInput"
            />
          </div>
        </div>

        <!-- 密码 -->
        <div class="form-group">
          <label for="password">密码</label>
          <div class="input-wrapper">
            <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入密码"
              autocomplete="current-password"
              :disabled="loading"
              @keyup.enter="handleLogin"
            />
            <button type="button" class="toggle-password" @click="showPassword = !showPassword">
              <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 记住我 & 忘记密码 -->
        <div class="form-options">
          <label class="checkbox-label">
            <input type="checkbox" v-model="form.rememberMe" />
            <span>记住登录状态</span>
          </label>
          <a href="#" class="forgot-link" @click.prevent="handleForgotPassword">忘记密码？</a>
        </div>

        <!-- 错误提示 -->
        <div v-if="error" class="error-message">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {{ error }}
        </div>

        <!-- 登录按钮 -->
        <button 
          type="submit" 
          class="login-btn" 
          :class="{ loading }" 
          :disabled="loading || !canSubmit"
        >
          <span v-if="!loading">登 录</span>
          <span v-else class="btn-loading">
            <span class="spinner"></span>
            登录中...
          </span>
        </button>
      </form>

      <!-- 底部信息 -->
      <div class="login-footer">
        <p>&copy; 2026 Report Center. All rights reserved.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/userStore.js'
import { login as apiLogin, getCurrentUser } from '@/api/reportDesigner.js'

const router = useRouter()
const route = useRoute()

// ========================================
// 响应式数据
// ========================================

const form = reactive({
  username: '',
  password: '',
  rememberMe: false
})

const loading = ref(false)
const error = ref('')
const showPassword = ref(false)
const usernameInput = ref(null)

// 计算属性：是否可以提交
const canSubmit = computed(() => {
  return form.username.trim().length > 0 && form.password.length >= 4
})

// ========================================
// 方法
// ========================================

/**
 * ✅ 处理登录
 */
async function handleLogin() {
  if (!canSubmit.value) return
  
  error.value = ''
  loading.value = true
  
  try {
    // 调用后端登录接口
    const result = await apiLogin({
      username: form.username.trim(),
      password: form.password,
      rememberMe: form.rememberMe
    })
    
    // 检查登录结果
    if (result?.token || result?.success !== false) {
      console.log('[Login] 登录成功:', result)
      
      // 存储认证信息
      storeAuthInfo(result)
      
      // 记住我：存储到 localStorage
      if (form.rememberMe) {
        localStorage.setItem('rpt_remember', 'true')
        localStorage.setItem('rpt_last_user', form.username.trim())
      }
      
      // 显示成功提示
      showToast('登录成功，正在跳转...', 'success')
      
      // 跳转到目标页面或首页
      const redirect = route.query.redirect || '/'
      setTimeout(() => {
        router.push(redirect)
      }, 500)
    } else {
      error.value = result?.message || '登录失败，请检查用户名和密码'
    }
    
  } catch (err) {
    console.error('[Login] 登录失败:', err)
    
    // 根据错误类型显示不同提示
    if (err.message?.includes('401') || err.message?.includes('403')) {
      error.value = '用户名或密码错误'
    } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
      error.value = '网络连接失败，请检查网络设置'
    } else {
      error.value = err.message || '登录失败，请稍后重试'
    }
  } finally {
    loading.value = false
  }
}

/**
 * ✅ 存储认证信息
 */
function storeAuthInfo(result) {
  // 存储 token（根据实际返回格式调整）
  const token = result?.token || result?.data?.token || result?.accessToken
  
  if (token) {
    sessionStorage.setItem('rpt_token', token)
    if (form.rememberMe) {
      localStorage.setItem('rpt_token', token)
    }
  }
  
  // 存储用户信息
  const userInfo = {
    id: result?.userId || result?.id,
    username: result?.username || form.username.trim(),
    name: result?.name || result?.realName || form.username.trim(),
    avatar: result?.avatar || '',
    roles: result?.roles || [],
    permissions: result?.permissions || []
  }
  
  sessionStorage.setItem('rpt_user', JSON.stringify(userInfo))
  if (form.rememberMe) {
    localStorage.setItem('rpt_user', JSON.stringify(userInfo))
  }
}

/**
 * 忘记密码
 */
function handleForgotPassword() {
  alert('请联系管理员重置密码')
}

/**
 * 简单的 toast 提示
 */
function showToast(message, type = 'info') {
  // 创建临时提示元素
  const toast = document.createElement('div')
  toast.className = `login-toast login-toast-${type}`
  toast.textContent = message
  document.body.appendChild(toast)
  
  // 动画显示
  requestAnimationFrame(() => {
    toast.classList.add('show')
  })
  
  // 自动移除
  setTimeout(() => {
    toast.classList.remove('show')
    setTimeout(() => toast.remove(), 300)
  }, 2500)
}

// ========================================
// 生命周期
// ========================================
onMounted(async () => {
  await nextTick()
  
  // 自动聚焦用户名输入框
  if (usernameInput.value) {
    usernameInput.value.focus()
  }
  
  // 如果之前选择了记住我，恢复用户名
  if (localStorage.getItem('rpt_remember')) {
    form.rememberMe = true
    form.username = localStorage.getItem('rpt_last_user') || ''
  }
})
</script>

<style lang="scss" scoped>
$primary: #2563EB;
$primary-dark: #1D4ED8;
$text: #0F172A;
$text-secondary: #475569;
$text-muted: #94A3B8;
$border: #E2E8F0;
$error: #DC2626;
$bg: #F8FAFC;

.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
  font-family: "SF Pro Display", -apple-system, sans-serif;
}

/* 背景装饰 */
.login-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.login-bg-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255,255,255,0.08);
}
.login-bg-1 { width: 600px; height: 600px; top: -200px; right: -100px; }
.login-bg-2 { width: 400px; height: 400px; bottom: -100px; left: -50px; background: rgba(255,255,255,0.05); }
.login-bg-3 { width: 200px; height: 200px; top: 50%; left: 50%; transform: translate(-50%, -50%); }

/* 登录卡片 */
.login-card {
  position: relative;
  z-index: 10;
  width: 420px;
  max-width: 90vw;
  background: white;
  border-radius: 20px;
  box-shadow: 0 25px 80px rgba(0,0,0,0.25);
  overflow: hidden;
  animation: cardIn 0.5s ease-out;
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(30px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* 头部 */
.login-header {
  text-align: center;
  padding: 40px 32px 24px;
  background: linear-gradient(180deg, #F8FAFF 0%, white 100%);
}
.login-logo {
  margin-bottom: 16px;
}
.login-title {
  margin: 0 0 4px 0;
  font-size: 26px;
  font-weight: 700;
  color: $text;
}
.login-subtitle {
  margin: 0;
  font-size: 14px;
  color: $text-muted;
  letter-spacing: 2px;
  text-transform: uppercase;
}

/* 表单 */
.login-form {
  padding: 24px 32px 32px;
}
.form-group {
  margin-bottom: 20px;
}
.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: $text-secondary;
  margin-bottom: 8px;
}

/* 输入框 */
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.input-icon {
  position: absolute;
  left: 14px;
  color: $text-muted;
  pointer-events: none;
  flex-shrink: 0;
}
.input-wrapper input {
  width: 100%;
  padding: 12px 44px;
  border: 1.5px solid $border;
  border-radius: 10px;
  font-size: 14px;
  transition: all 0.2s;
  outline: none;
  background: white;
  
  &:focus {
    border-color: $primary;
    box-shadow: 0 0 0 3px rgba($primary, 0.1);
  }
  
  &:disabled {
    background: $bg;
    cursor: not-allowed;
  }
}
.toggle-password {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: $text-muted;
  &:hover { color: $text-secondary; }
}

/* 选项 */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  font-size: 13px;
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: $text-secondary;
  input[type="checkbox"] {
    width: 16px; height: 16px;
    accent-color: $primary;
    cursor: pointer;
  }
}
.forgot-link {
  color: $primary;
  text-decoration: none;
  &:hover { text-decoration: underline; }
}

/* 错误提示 */
.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 8px;
  color: $error;
  font-size: 13px;
  margin-bottom: 16px;
  animation: shake 0.4s ease;
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  padding: 14px;
  background: $primary;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: $primary-dark;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba($primary, 0.35);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &.loading {
    pointer-events: none;
  }
}
.btn-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.spinner {
  width: 18px; height: 18px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 底部 */
.login-footer {
  text-align: center;
  padding: 20px 32px 28px;
  border-top: 1px solid $border;
}
.login-footer p {
  margin: 0;
  font-size: 12px;
  color: $text-muted;
}

/* Toast 提示 */
.login-toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%) translateY(-20px);
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  opacity: 0;
  transition: all 0.3s ease;
  z-index: 99999;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  &.show { opacity: 1; transform: translateX(-50%) translateY(0); }
  &-success { background: #D1FAE5; color: #065F46; }
  &-error { background: #FEE2E2; color: #991B1B; }
  &-info { background: #DBEAFE; color: #1E40AF; }
}

/* 响应式 */
@media (max-width: 480px) {
  .login-card {
    border-radius: 0;
    min-height: 100vh;
  }
  .login-form { padding: 20px 24px 28px; }
  .login-header { padding: 32px 24px 20px; }
}
</style>
