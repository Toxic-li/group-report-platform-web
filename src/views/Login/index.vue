<template>
  <div class="login-page">
    <!-- 左侧品牌区 -->
    <div class="login-brand">
      <div class="brand-bg">
        <div class="brand-grid"></div>
        <div class="brand-glow glow-1"></div>
        <div class="brand-glow glow-2"></div>
        <div class="brand-glow glow-3"></div>
        <div class="brand-lines">
          <div v-for="i in 8" :key="i" class="line line-vertical" :style="{ left: 10 + i * 12 + '%' }"></div>
          <div v-for="i in 6" :key="'h'+i" class="line line-horizontal" :style="{ top: 10 + i * 15 + '%' }"></div>
        </div>
      </div>
      
      <div class="brand-content">
        <div class="brand-logo">
          <div class="logo-badge">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="3" y="4" width="18" height="14" rx="2" stroke-linejoin="round"/>
              <path d="M7 8h10M7 12h6M7 16h4"/>
            </svg>
          </div>
        </div>
        
        <h1 class="brand-title">集团统计报表平台</h1>
        <p class="brand-desc">Report Center Platform</p>
        
        <div class="brand-highlights">
          <div class="highlight-item">
            <div class="highlight-dot"></div>
            <span>拖拽式报表设计器</span>
          </div>
          <div class="highlight-item">
            <div class="highlight-dot"></div>
            <span>Excel 级公式引擎</span>
          </div>
          <div class="highlight-item">
            <div class="highlight-dot"></div>
            <span>多级审批工作流</span>
          </div>
          <div class="highlight-item">
            <div class="highlight-dot"></div>
            <span>细粒度权限管控</span>
          </div>
        </div>

        <div class="brand-footer">
          <div class="brand-stats">
            <div class="stat">
              <div class="stat-num">500+</div>
              <div class="stat-label">模板</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat">
              <div class="stat-num">10万+</div>
              <div class="stat-label">填报</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat">
              <div class="stat-num">99.9%</div>
              <div class="stat-label">稳定</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧登录区 -->
    <div class="login-main">
      <div class="login-container">
        <div class="login-box">
          <div class="login-header">
            <h2>欢迎回来</h2>
            <p>请登录您的账号开始使用</p>
          </div>

          <form class="login-form" @submit.prevent="handleLogin">
            <div class="form-item">
              <label class="form-label">用户名 / 手机号</label>
              <div class="input-wrap">
                <span class="input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </span>
                <input
                  v-model="form.username"
                  type="text"
                  placeholder="请输入用户名或手机号"
                  :disabled="loading"
                  ref="usernameInput"
                  class="form-input"
                />
              </div>
            </div>

            <div class="form-item">
              <div class="form-label-row">
                <label class="form-label">密码</label>
                <a href="#" class="forgot-link" @click.prevent="handleForgotPassword">忘记密码？</a>
              </div>
              <div class="input-wrap">
                <span class="input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="请输入密码"
                  :disabled="loading"
                  class="form-input"
                  @keyup.enter="handleLogin"
                />
                <button type="button" class="input-action" @click="showPassword = !showPassword">
                  <svg v-if="!showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                </button>
              </div>
            </div>

            <div class="form-options">
              <label class="remember-me">
                <input type="checkbox" v-model="form.rememberMe" />
                <span class="checkbox-custom">
                  <svg v-if="form.rememberMe" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                <span class="remember-text">记住登录状态</span>
              </label>
            </div>

            <transition name="fade">
              <div v-if="error" class="error-tip">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {{ error }}
              </div>
            </transition>

            <button
              type="submit"
              class="login-btn"
              :disabled="loading || !canSubmit"
            >
              <span v-if="!loading">登 录</span>
              <span v-else class="btn-loading">
                <svg class="spinner" viewBox="0 0 24 24">
                  <circle class="spinner-circle" cx="12" cy="12" r="10" fill="none" stroke-width="2"/>
                </svg>
                登录中...
              </span>
            </button>
          </form>

          <div class="login-footer">
            <p>© 2026 Group Report Platform</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/userStore.js'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const form = reactive({
  username: '',
  password: '',
  rememberMe: false
})

const loading = ref(false)
const error = ref('')
const showPassword = ref(false)
const usernameInput = ref(null)

const canSubmit = computed(() => {
  return form.username.trim().length > 0 && form.password.length >= 6
})

async function handleLogin() {
  if (!canSubmit.value) return

  error.value = ''
  loading.value = true

  try {
    if (form.rememberMe) {
      localStorage.setItem('rpt_remember', 'true')
      localStorage.setItem('rpt_last_user', form.username.trim())
    } else {
      localStorage.removeItem('rpt_remember')
    }

    const result = await userStore.login(form.username.trim(), form.password)

    if (userStore.isLoggedIn) {
      ElMessage.success('登录成功，正在跳转...')
      const redirect = route.query.redirect || '/'
      setTimeout(() => {
        router.push(redirect)
      }, 500)
    } else {
      error.value = result?.message || '登录失败，请检查用户名和密码'
    }

  } catch (err) {
    console.error('[Login] 登录异常:', err)

    if (err.message?.includes('401') || err.message?.includes('403')) {
      error.value = '用户名或密码错误'
    } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
      error.value = '网络连接失败，请检查网络设置'
    } else if (err.message?.includes('过期')) {
      error.value = '登录已过期，请重新登录'
    } else {
      error.value = err.message || '登录失败，请稍后重试'
    }
  } finally {
    loading.value = false
  }
}

function handleForgotPassword() {
  ElMessage.info('请联系管理员重置密码')
}

onMounted(async () => {
  await nextTick()
  if (usernameInput.value) {
    usernameInput.value.focus()
  }
  if (localStorage.getItem('rpt_remember')) {
    form.rememberMe = true
    form.username = localStorage.getItem('rpt_last_user') || ''
  }
})
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  background: #f8fafc;
}

// ========== 左侧品牌区 ==========
.login-brand {
  width: 58%;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 40%, #2563eb 100%);
}

.brand-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.brand-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 48px 48px;
}

.brand-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
}

.glow-1 {
  width: 500px;
  height: 500px;
  top: -150px;
  right: -100px;
  background: rgba(59, 130, 246, 0.5);
  animation: float-glow 12s ease-in-out infinite;
}

.glow-2 {
  width: 400px;
  height: 400px;
  bottom: -100px;
  left: 10%;
  background: rgba(37, 99, 235, 0.4);
  animation: float-glow 15s ease-in-out infinite reverse;
}

.glow-3 {
  width: 300px;
  height: 300px;
  top: 50%;
  right: 20%;
  background: rgba(96, 165, 250, 0.3);
  animation: float-glow 18s ease-in-out infinite;
}

@keyframes float-glow {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(40px, -30px) scale(1.1); }
}

.brand-lines {
  position: absolute;
  inset: 0;
  opacity: 0.06;
}

.line {
  position: absolute;
  background: #fff;
}

.line-vertical {
  width: 1px;
  height: 100%;
}

.line-horizontal {
  height: 1px;
  width: 100%;
}

.brand-content {
  position: relative;
  z-index: 10;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 80px 100px;
  color: #fff;
}

.brand-logo {
  margin-bottom: 48px;
}

.logo-badge {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.brand-title {
  font-size: 42px;
  font-weight: 700;
  margin: 0 0 12px 0;
  letter-spacing: -0.5px;
  line-height: 1.2;
}

.brand-desc {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 56px 0;
  letter-spacing: 2px;
  font-weight: 300;
}

.brand-highlights {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 64px;
}

.highlight-item {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.85);
  animation: slide-in-left 0.5s ease-out backwards;
}

.highlight-item:nth-child(1) { animation-delay: 0.1s; }
.highlight-item:nth-child(2) { animation-delay: 0.2s; }
.highlight-item:nth-child(3) { animation-delay: 0.3s; }
.highlight-item:nth-child(4) { animation-delay: 0.4s; }

@keyframes slide-in-left {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

.highlight-dot {
  width: 8px;
  height: 8px;
  background: #93c5fd;
  border-radius: 50%;
  box-shadow: 0 0 12px rgba(147, 197, 253, 0.8);
}

.brand-footer {
  margin-top: auto;
  padding-top: 48px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.brand-stats {
  display: flex;
  align-items: center;
  gap: 40px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-num {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
}

.stat-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.stat-divider {
  width: 1px;
  height: 36px;
  background: rgba(255, 255, 255, 0.15);
}

// ========== 右侧登录区 ==========
.login-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
}

.login-container {
  width: 100%;
  max-width: 420px;
  padding: 40px;
}

.login-box {
  background: #fff;
  border-radius: 16px;
  padding: 44px 40px;
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.05),
    0 10px 40px rgba(0, 0, 0, 0.08);
  animation: fade-up 0.5s ease-out;
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  margin-bottom: 36px;
  text-align: center;
}

.login-header h2 {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 10px 0;
}

.login-header p {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

// ========== 表单 ==========
.login-form {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: #334155;
}

.forgot-link {
  font-size: 12px;
  color: #3b82f6;
  text-decoration: none;
  transition: color 0.2s;
}

.forgot-link:hover {
  color: #2563eb;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  transition: all 0.2s ease;
}

.input-wrap:hover {
  border-color: #cbd5e1;
}

.input-wrap:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.input-icon {
  padding: 12px 14px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.input-wrap:focus-within .input-icon {
  color: #3b82f6;
}

.form-input {
  flex: 1;
  height: 44px;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: #1e293b;
  font-family: inherit;
  padding-right: 12px;
}

.form-input::placeholder {
  color: #94a3b8;
}

.form-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.input-action {
  padding: 12px 14px;
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.input-action:hover {
  color: #64748b;
}

.form-options {
  display: flex;
  align-items: center;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.remember-me input[type="checkbox"] {
  display: none;
}

.checkbox-custom {
  width: 16px;
  height: 16px;
  border: 1.5px solid #cbd5e1;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  background: #fff;
}

.remember-me input[type="checkbox"]:checked + .checkbox-custom {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
}

.remember-text {
  font-size: 13px;
  color: #64748b;
}

.error-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 13px;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

// ========== 登录按钮 ==========
.login-btn {
  width: 100%;
  height: 48px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  margin-top: 4px;
}

.login-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.3);
}

.login-btn:active:not(:disabled) {
  transform: translateY(0);
}

.login-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.spinner {
  width: 16px;
  height: 16px;
}

.spinner-circle {
  animation: spin 0.8s linear infinite;
  stroke: #fff;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// ========== 底部 ==========
.login-footer {
  text-align: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #f1f5f9;
}

.login-footer p {
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
}

// ========== 响应式 ==========
@media (max-width: 1200px) {
  .login-brand {
    width: 50%;
  }
  
  .brand-content {
    padding: 60px;
  }
  
  .brand-title {
    font-size: 36px;
  }
}

@media (max-width: 900px) {
  .login-brand {
    display: none;
  }
  
  .login-main {
    width: 100%;
    background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
  }
  
  .login-container {
    padding: 24px;
  }
}

@media (max-width: 480px) {
  .login-box {
    padding: 32px 24px;
  }
  
  .login-header h2 {
    font-size: 24px;
  }
  
  .form-input {
    height: 42px;
  }
  
  .login-btn {
    height: 44px;
  }
}
</style>