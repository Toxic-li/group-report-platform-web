<template>
  <div class="login-page">
    <!-- Background -->
    <div class="page-bg">
      <div class="bg-gradient"></div>
      <div class="bg-grid"></div>
      <div class="bg-particles">
        <div v-for="i in 15" :key="i" class="particle" :style="getParticleStyle(i)"></div>
      </div>
      <div class="bg-glow"></div>
      <div class="bg-data-lines">
        <svg class="lines-svg" width="100%" height="100%">
          <line v-for="line in dataLines" :key="line.id" :x1="line.x1" :y1="line.y1" :x2="line.x2" :y2="line.y2" stroke="rgba(24, 200, 255, 0.06)" stroke-width="1"/>
        </svg>
      </div>
    </div>

    <!-- Header -->
    <header class="page-header">
      <div class="header-left">
        <div class="logo">
          <div class="logo-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <rect x="3" y="4" width="18" height="14" rx="2" stroke-linejoin="round"/>
              <path d="M7 8h10M7 12h6M7 16h4"/>
            </svg>
          </div>
          <div class="logo-texts">
            <span class="logo-text">企业报表平台</span>
            <span class="logo-subtitle">Enterprise Report Platform</span>
          </div>
        </div>
      </div>
      <div class="header-right">
        <div class="lang-switcher">
          <button class="lang-btn active">中文</button>
          <button class="lang-btn">English</button>
        </div>
        <button class="theme-toggle" @click="toggleDarkMode">
          <Moon v-if="!darkMode" :size="18"/>
          <Sun v-else :size="18"/>
        </button>
      </div>
    </header>

    <!-- Main -->
    <main class="page-main">
      <!-- Left: Brand + Product -->
      <div class="main-left">
        <!-- Brand Hero -->
        <section class="brand-section" data-animate="fade-up">
          <h1 class="brand-title">企业报表与数据填报平台</h1>
          <p class="brand-desc">
            从表样设计、数据填报、<br/>
            流程审核到统计分析，<br/>
            打造企业一体化数据管理平台。
          </p>
        </section>

        <!-- Product Preview -->
        <section class="product-section" data-animate="fade-up" data-delay="0.1">
          <div class="preview-tabs">
            <div 
              v-for="tab in previewTabs" 
              :key="tab.key"
              class="preview-tab"
              :class="{ active: activeTab === tab.key }"
              @click="activeTab = tab.key"
            >
              <component :is="tab.icon" :size="16"/>
              <span>{{ tab.label }}</span>
            </div>
          </div>

          <div class="preview-card">
            <!-- Designer Preview -->
            <div v-show="activeTab === 'designer'" class="preview-content">
              <div class="mock-designer">
                <div class="mock-toolbar">
                  <div class="mock-tools">
                    <span class="mock-tool"></span>
                    <span class="mock-tool"></span>
                    <span class="mock-tool"></span>
                    <span class="mock-tool wide"></span>
                    <span class="mock-tool-sep"></span>
                    <span class="mock-tool sm"></span>
                    <span class="mock-tool sm"></span>
                    <span class="mock-tool sm"></span>
                  </div>
                </div>
                <div class="mock-body">
                  <div class="mock-side">
                    <div class="mock-side-item"></div>
                    <div class="mock-side-item active"></div>
                    <div class="mock-side-item"></div>
                    <div class="mock-side-item"></div>
                  </div>
                  <div class="mock-table">
                    <div class="mock-table-head">
                      <div v-for="c in 5" :key="c" class="mock-th">{{ ['指标','1月','2月','3月','合计'][c-1] }}</div>
                    </div>
                    <div class="mock-table-body">
                      <div v-for="r in 4" :key="r" class="mock-tr">
                        <div v-for="c in 5" :key="c" class="mock-td" :class="{ selected: r===2 && c===2 }"></div>
                      </div>
                    </div>
                  </div>
                  <div class="mock-props">
                    <div class="mock-prop-title">属性</div>
                    <div class="mock-prop-row"></div>
                    <div class="mock-prop-row"></div>
                    <div class="mock-prop-row short"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Entry Preview -->
            <div v-show="activeTab === 'entry'" class="preview-content">
              <div class="mock-entry">
                <div class="mock-entry-header">
                  <span class="mock-entry-title">销售月报</span>
                  <span class="mock-entry-status">待提交</span>
                </div>
                <div class="mock-entry-form">
                  <div v-for="i in 3" :key="i" class="mock-field">
                    <div class="mock-field-label">字段{{ i }}</div>
                    <div class="mock-field-input"></div>
                  </div>
                  <div class="mock-entry-table">
                    <div class="mock-table-head">
                      <div v-for="c in 4" :key="c" class="mock-th-sm">{{ ['产品','数量','单价','金额'][c-1] }}</div>
                    </div>
                    <div class="mock-table-body">
                      <div v-for="r in 3" :key="r" class="mock-tr-sm">
                        <div v-for="c in 4" :key="c" class="mock-td-sm"></div>
                      </div>
                    </div>
                  </div>
                  <div class="mock-entry-actions">
                    <span class="mock-btn secondary">保存</span>
                    <span class="mock-btn primary">提交</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Approval Preview -->
            <div v-show="activeTab === 'approval'" class="preview-content">
              <div class="mock-approval">
                <div class="mock-approval-title">审核流程</div>
                <div class="mock-flow">
                  <div class="mock-flow-node done">
                    <div class="mock-node-dot"></div>
                    <div class="mock-node-content">
                      <span class="mock-node-title">提交人</span>
                      <span class="mock-node-sub">已提交</span>
                    </div>
                  </div>
                  <div class="mock-flow-line done"></div>
                  <div class="mock-flow-node active">
                    <div class="mock-node-dot"></div>
                    <div class="mock-node-content">
                      <span class="mock-node-title">部门经理</span>
                      <span class="mock-node-sub">审核中</span>
                    </div>
                  </div>
                  <div class="mock-flow-line"></div>
                  <div class="mock-flow-node">
                    <div class="mock-node-dot"></div>
                    <div class="mock-node-content">
                      <span class="mock-node-title">财务总监</span>
                      <span class="mock-node-sub">待审核</span>
                    </div>
                  </div>
                </div>
                <div class="mock-approval-comment">
                  <div class="mock-comment-title">审核意见</div>
                  <div class="mock-comment-area"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Feature List -->
        <section class="features-section" data-animate="fade-up" data-delay="0.2">
          <div class="feature-item" v-for="feat in features" :key="feat.label">
            <div class="feature-check">
              <Check :size="14"/>
            </div>
            <div class="feature-icon">
              <component :is="feat.icon" :size="18"/>
            </div>
            <span class="feature-text">{{ feat.label }}</span>
          </div>
        </section>

        <!-- Statistics -->
        <section class="stats-section" data-animate="fade-up" data-delay="0.3">
          <div class="stat-item">
            <div class="stat-value" data-count="500" data-suffix="+">0</div>
            <div class="stat-label">报表模板</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-value" data-count="100000" data-suffix="+">0</div>
            <div class="stat-label">累计填报</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-value highlight" data-count="99.99" data-suffix="%">0</div>
            <div class="stat-label">系统稳定性</div>
          </div>
        </section>
      </div>

      <!-- Right: Login -->
      <div class="main-right">
        <div class="login-card" data-animate="slide-up">
          <div class="login-header">
            <h2 class="login-title">欢迎登录</h2>
            <p class="login-subtitle">Welcome Back</p>
          </div>

          <form class="login-form" @submit.prevent="handleLogin">
            <div class="form-group">
              <label class="form-label">用户名</label>
              <div class="input-wrapper">
                <User :size="18" class="input-icon"/>
                <input
                  v-model="form.username"
                  type="text"
                  placeholder="请输入用户名"
                  :disabled="loading"
                  class="form-input"
                  ref="usernameInput"
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">密码</label>
              <div class="input-wrapper">
                <Lock :size="18" class="input-icon"/>
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="请输入密码"
                  :disabled="loading"
                  class="form-input"
                  @keyup.enter="handleLogin"
                />
                <button type="button" class="input-toggle" @click="showPassword = !showPassword">
                  <Eye v-if="!showPassword" :size="18"/>
                  <EyeOff v-else :size="18"/>
                </button>
              </div>
            </div>

            <div class="form-options">
              <label class="remember-checkbox">
                <input type="checkbox" v-model="form.rememberMe"/>
                <span class="checkbox-box">
                  <Check v-if="form.rememberMe" :size="12"/>
                </span>
                <span class="checkbox-text">记住密码</span>
              </label>
              <a href="#" class="forgot-link" @click.prevent="handleForgotPassword">忘记密码?</a>
            </div>

            <transition name="fade">
              <div v-if="errorMessage" class="error-message">
                <AlertCircle :size="14"/>
                <span>{{ errorMessage }}</span>
              </div>
            </transition>

            <button type="submit" class="login-button" :disabled="loading || !canSubmit">
              <span v-if="!loading">登 录</span>
              <span v-else class="loading-indicator">
                <svg class="loader" viewBox="0 0 24 24">
                  <circle class="loader-circle" cx="12" cy="12" r="10" fill="none" stroke-width="2"/>
                </svg>
                登录中...
              </span>
            </button>
          </form>

          <div class="sso-section">
            <div class="divider">
              <span class="divider-line"></span>
              <span class="divider-text">其他登录方式</span>
              <span class="divider-line"></span>
            </div>
            <div class="sso-buttons">
              <button class="sso-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348z"/>
                </svg>
                <span>企业微信</span>
              </button>
              <button class="sso-btn">
                <Shield :size="20"/>
                <span>SSO</span>
              </button>
              <button class="sso-btn">
                <KeyRound :size="20"/>
                <span>LDAP</span>
              </button>
            </div>
          </div>

          <div class="login-footer">
            <p>© 2026 Enterprise Report Platform</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/userStore.js'
import { ElMessage } from 'element-plus'
import {
  User, Lock, Eye, EyeOff, Check, AlertCircle,
  Moon, Sun, LayoutGrid, CheckSquare,
  Table, PenTool, FileCheck, BarChart3, KeyRound, Shield
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const darkMode = ref(false)
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const usernameInput = ref<HTMLInputElement | null>(null)
const activeTab = ref('designer')

const form = reactive({
  username: '',
  password: '',
  rememberMe: false
})

const canSubmit = computed(() => {
  return form.username.trim().length > 0 && form.password.length >= 6
})

const previewTabs = [
  { key: 'designer', label: '报表设计', icon: LayoutGrid },
  { key: 'entry', label: '在线填报', icon: PenTool },
  { key: 'approval', label: '流程审核', icon: FileCheck },
]

const features = [
  { label: 'Excel式表样设计', icon: Table },
  { label: '在线数据填报', icon: PenTool },
  { label: '流程审批管理', icon: CheckSquare },
  { label: '多维统计分析', icon: BarChart3 },
]

const dataLines = [
  { id: 1, x1: '8%', y1: '25%', x2: '22%', y2: '35%' },
  { id: 2, x1: '15%', y1: '65%', x2: '28%', y2: '75%' },
  { id: 3, x1: '5%', y1: '75%', x2: '18%', y2: '60%' },
  { id: 4, x1: '30%', y1: '15%', x2: '42%', y2: '25%' },
  { id: 5, x1: '12%', y1: '45%', x2: '25%', y2: '30%' },
  { id: 6, x1: '35%', y1: '80%', x2: '48%', y2: '70%' },
]

function getParticleStyle(index: number) {
  const left = (index * 6.5 + 3) % 55 + '%'
  const top = (index * 11 + 8) % 85 + '%'
  const size = (index % 3 + 2) + 'px'
  const delay = index * 0.4 + 's'
  const duration = (index % 6 + 8) + 's'
  return { left, top, width: size, height: size, animationDelay: delay, animationDuration: duration }
}

function toggleDarkMode() {
  darkMode.value = !darkMode.value
}

function animateValue(element: HTMLElement, endValue: number | string, duration: number = 1500, suffix: string = '') {
  const isDecimal = typeof endValue === 'number' ? endValue < 100 : parseFloat(endValue) < 100
  const targetValue = typeof endValue === 'number' ? endValue : parseFloat(endValue)
  let startValue = 0
  const startTime = performance.now()

  function update(currentTime: number) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const easeOut = 1 - Math.pow(1 - progress, 3)
    const current = startValue + (targetValue - startValue) * easeOut

    if (isDecimal) {
      element.textContent = current.toFixed(2) + suffix
    } else if (targetValue >= 1000) {
      element.textContent = current >= 10000
        ? (current / 10000).toFixed(1) + '万' + suffix
        : Math.floor(current).toLocaleString() + suffix
    } else {
      element.textContent = Math.floor(current).toLocaleString() + suffix
    }

    if (progress < 1) {
      requestAnimationFrame(update)
    }
  }

  requestAnimationFrame(update)
}

async function handleLogin() {
  if (!canSubmit.value) return

  errorMessage.value = ''
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
      errorMessage.value = result?.message || '登录失败，请检查用户名和密码'
    }

  } catch (err) {
    if (err.message?.includes('401') || err.message?.includes('403')) {
      errorMessage.value = '用户名或密码错误'
    } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
      errorMessage.value = '网络连接失败，请检查网络设置'
    } else if (err.message?.includes('过期')) {
      errorMessage.value = '登录已过期，请重新登录'
    } else {
      errorMessage.value = err.message || '登录失败，请稍后重试'
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

  setTimeout(() => {
    const statElements = document.querySelectorAll('.stat-value')
    statElements.forEach((el) => {
      const count = (el as HTMLElement).getAttribute('data-count')
      const suffix = (el as HTMLElement).getAttribute('data-suffix') || ''
      if (count) {
        animateValue(el as HTMLElement, count, 2000, suffix)
      }
    })
  }, 800)

  const animateElements = document.querySelectorAll('[data-animate]')
  animateElements.forEach((el) => {
    const delay = (el as HTMLElement).getAttribute('data-delay') || '0'
    ;(el as HTMLElement).style.animationDelay = `${delay}s`
    ;(el as HTMLElement).classList.add('animate')
  })
})
</script>

<style lang="scss" scoped>
/* ========== Design Tokens ========== */
.login-page {
  --primary-50: #EAF4FF;
  --primary-300: #84BEFF;
  --primary-400: #5AA8FF;
  --primary-500: #1677FF;
  --primary-600: #0958D9;
  --info-500: #18C8FF;
  --success-500: #00B578;
  --warning-500: #FFB020;
  --error-500: #F04438;
  --gray-0: #FFFFFF;
  --gray-50: #FAFBFC;
  --gray-100: #F5F7FA;
  --gray-200: #EEF2F6;
  --gray-300: #E4E7EC;
  --gray-400: #CBD5E1;
  --gray-500: #94A3B8;
  --gray-600: #64748B;
  --gray-700: #475569;
  --gray-800: #334155;
  --gray-900: #1E293B;
  --bg-dark-1: #071B34;
  --bg-dark-2: #0B2447;
  --bg-dark-3: #123C73;
  --text-on-dark: rgba(255, 255, 255, 0.9);
  --text-on-dark-secondary: rgba(255, 255, 255, 0.55);
  --text-on-dark-tertiary: rgba(255, 255, 255, 0.4);
  --surface-dark-1: rgba(255, 255, 255, 0.06);
  --surface-dark-2: rgba(255, 255, 255, 0.08);
  --surface-dark-3: rgba(255, 255, 255, 0.04);
  --border-dark: rgba(255, 255, 255, 0.08);
  --border-dark-hover: rgba(255, 255, 255, 0.12);
  --divider-dark: rgba(255, 255, 255, 0.08);
}

.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background: var(--bg-dark-1);
}

/* ========== Background ========== */
.page-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, var(--bg-dark-1) 0%, var(--bg-dark-2) 50%, var(--bg-dark-3) 100%);
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(24, 200, 255, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(24, 200, 255, 0.025) 1px, transparent 1px);
  background-size: 50px 50px;
}

.bg-particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.particle {
  position: absolute;
  background: rgba(24, 200, 255, 0.15);
  border-radius: 50%;
  animation: particle-float 8s ease-in-out infinite;
}

@keyframes particle-float {
  0%, 100% { transform: translateY(0) translateX(0); opacity: 0.15; }
  25% { transform: translateY(-8px) translateX(4px); opacity: 0.25; }
  50% { transform: translateY(0) translateX(8px); opacity: 0.1; }
  75% { transform: translateY(8px) translateX(-4px); opacity: 0.2; }
}

.bg-glow {
  position: absolute;
  top: -15%;
  left: -10%;
  width: 50%;
  height: 45%;
  background: radial-gradient(ellipse at center, rgba(24, 200, 255, 0.03) 0%, transparent 70%);
  pointer-events: none;
}

.bg-data-lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.lines-svg {
  width: 100%;
  height: 100%;
}

/* ========== Header ========== */
.page-header {
  position: relative;
  z-index: 100;
  height: 64px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 64px;
  color: var(--text-on-dark);
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: var(--surface-dark-2);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-dark-hover);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-400);
}

.logo-texts {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.logo-subtitle {
  font-size: 11px;
  color: var(--text-on-dark-tertiary);
  letter-spacing: 0.5px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.lang-switcher {
  display: flex;
  background: var(--surface-dark-1);
  border: 1px solid var(--border-dark);
  border-radius: 8px;
  padding: 3px;
}

.lang-btn {
  padding: 5px 12px;
  font-size: 12px;
  color: var(--text-on-dark-tertiary);
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: var(--text-on-dark);
  }

  &.active {
    background: var(--surface-dark-2);
    color: var(--gray-0);
  }
}

.theme-toggle {
  width: 36px;
  height: 36px;
  background: var(--surface-dark-1);
  border: 1px solid var(--border-dark);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-on-dark-secondary);
  transition: all 0.2s;

  &:hover {
    background: var(--surface-dark-2);
    color: var(--gray-0);
  }
}

/* ========== Main ========== */
.page-main {
  position: relative;
  z-index: 10;
  flex: 1;
  display: flex;
  padding: 40px 64px;
  gap: 40px;
}

.main-left {
  flex: 0 0 calc(60% - 20px);
  display: flex;
  flex-direction: column;
  gap: 32px;
  max-width: 720px;
}

.main-right {
  flex: 0 0 calc(40% - 20px);
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

/* ========== Brand Section ========== */
.brand-section {
  color: #fff;
  opacity: 0;
}

.brand-title {
  font-size: 36px;
  font-weight: 600;
  margin: 0 0 20px 0;
  line-height: 1.25;
  letter-spacing: -0.5px;
}

.brand-desc {
  font-size: 15px;
  color: var(--text-on-dark-secondary);
  margin: 0;
  line-height: 1.8;
}

/* ========== Product Section ========== */
.product-section {
  opacity: 0;
}

.preview-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.preview-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--surface-dark-3);
  border: 1px solid var(--border-dark);
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-on-dark-tertiary);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--surface-dark-2);
    color: var(--text-on-dark);
  }

  &.active {
    background: rgba(22, 119, 255, 0.1);
    border-color: rgba(22, 119, 255, 0.3);
    color: var(--primary-400);
  }
}

.preview-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
  animation: preview-float 6s ease-in-out infinite;
}

@keyframes preview-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.preview-content {
  height: 240px;
}

/* Mock Designer */
.mock-designer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--gray-0);
  border-radius: 8px;
  overflow: hidden;
}

.mock-toolbar {
  height: 32px;
  background: var(--gray-50);
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  align-items: center;
  padding: 0 8px;
}

.mock-tools {
  display: flex;
  align-items: center;
  gap: 6px;
}

.mock-tool {
  width: 20px;
  height: 16px;
  background: var(--gray-200);
  border-radius: 3px;

  &.wide { width: 50px; }
  &.sm { width: 14px; height: 14px; border-radius: 50%; }
}

.mock-tool-sep {
  width: 1px;
  height: 16px;
  background: var(--gray-200);
  margin: 0 4px;
}

.mock-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.mock-side {
  width: 80px;
  background: var(--gray-50);
  border-right: 1px solid var(--gray-200);
  padding: 8px 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mock-side-item {
  height: 22px;
  background: var(--gray-200);
  border-radius: 3px;
  opacity: 0.5;

  &.active {
    background: var(--info-500);
    opacity: 0.2;
  }
}

.mock-table {
  flex: 1;
  padding: 8px;
}

.mock-table-head {
  display: flex;
}

.mock-th {
  flex: 1;
  height: 26px;
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  font-size: 9px;
  color: var(--gray-600);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
}

.mock-table-body {
  display: flex;
  flex-direction: column;
}

.mock-tr {
  display: flex;
}

.mock-td {
  flex: 1;
  height: 24px;
  border: 1px solid var(--gray-200);
  border-top: none;

  &.selected {
    border: 2px solid var(--primary-500);
    background: rgba(22, 119, 255, 0.1);
  }
}

.mock-props {
  width: 90px;
  background: var(--gray-50);
  border-left: 1px solid var(--gray-200);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mock-prop-title {
  font-size: 9px;
  font-weight: 600;
  color: var(--gray-600);
  margin-bottom: 2px;
}

.mock-prop-row {
  height: 14px;
  background: var(--gray-200);
  border-radius: 3px;

  &.short { width: 60%; }
}

/* Mock Entry */
.mock-entry {
  width: 100%;
  height: 100%;
  background: var(--gray-0);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mock-entry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mock-entry-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--gray-900);
}

.mock-entry-status {
  font-size: 10px;
  padding: 3px 10px;
  background: rgba(255, 176, 20, 0.1);
  color: var(--warning-500);
  border-radius: 4px;
  font-weight: 500;
}

.mock-entry-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mock-field {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mock-field-label {
  font-size: 10px;
  color: var(--gray-600);
  width: 50px;
  flex-shrink: 0;
}

.mock-field-input {
  flex: 1;
  height: 24px;
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  border-radius: 4px;
}

.mock-entry-table {
  flex: 1;
}

.mock-th-sm {
  flex: 1;
  height: 22px;
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  font-size: 8px;
  color: var(--gray-600);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mock-tr-sm {
  display: flex;
}

.mock-td-sm {
  flex: 1;
  height: 20px;
  border: 1px solid var(--gray-200);
  border-top: none;
}

.mock-entry-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.mock-btn {
  padding: 5px 14px;
  font-size: 10px;
  border-radius: 4px;
  font-weight: 500;

  &.secondary {
    background: var(--gray-100);
    color: var(--gray-600);
  }

  &.primary {
    background: linear-gradient(135deg, var(--info-500), var(--primary-500));
    color: var(--gray-0);
  }
}

/* Mock Approval */
.mock-approval {
  width: 100%;
  height: 100%;
  background: var(--gray-0);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mock-approval-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--gray-900);
}

.mock-flow {
  display: flex;
  align-items: flex-start;
  padding: 8px 0;
}

.mock-flow-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;

  &.done .mock-node-dot {
    background: var(--success-500);
    box-shadow: 0 0 0 3px rgba(0, 181, 120, 0.2);
  }

  &.active .mock-node-dot {
    background: var(--primary-500);
    box-shadow: 0 0 0 3px rgba(22, 119, 255, 0.2);
    animation: pulse-dot 2s ease-in-out infinite;
  }
}

@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 3px rgba(22, 119, 255, 0.2); }
  50% { box-shadow: 0 0 0 6px rgba(22, 119, 255, 0.1); }
}

.mock-node-dot {
  width: 12px;
  height: 12px;
  background: var(--gray-400);
  border-radius: 50%;
}

.mock-node-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.mock-node-title {
  font-size: 10px;
  font-weight: 500;
  color: var(--gray-900);
}

.mock-node-sub {
  font-size: 8px;
  color: var(--gray-500);
}

.mock-flow-line {
  flex: 1;
  height: 2px;
  background: var(--gray-200);
  margin-top: 5px;

  &.done {
    background: var(--success-500);
  }
}

.mock-approval-comment {
  flex: 1;
}

.mock-comment-title {
  font-size: 10px;
  color: var(--gray-600);
  margin-bottom: 6px;
}

.mock-comment-area {
  width: 100%;
  height: 50px;
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
  border-radius: 4px;
}

/* ========== Features Section ========== */
.features-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  opacity: 0;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(24, 200, 255, 0.15);
  }
}

.feature-check {
  width: 20px;
  height: 20px;
  background: rgba(24, 200, 255, 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--info-500);
  flex-shrink: 0;
}

.feature-icon {
  width: 32px;
  height: 32px;
  background: rgba(24, 200, 255, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--info-500);
  flex-shrink: 0;
}

.feature-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  white-space: nowrap;
}

/* ========== Stats Section ========== */
.stats-section {
  display: flex;
  align-items: center;
  gap: 0;
  opacity: 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--gray-0);
  font-family: 'DIN', 'Inter', sans-serif;
  letter-spacing: -0.5px;

  &.highlight {
    color: var(--info-500);
  }
}

.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.stat-divider {
  width: 1px;
  height: 36px;
  background: rgba(255, 255, 255, 0.08);
  margin: 0 32px;
}

/* ========== Login Card ========== */
.login-card {
  width: 420px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
  opacity: 0;
}

.login-header {
  text-align: left;
  margin-bottom: 24px;
}

.login-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--gray-900);
  margin: 0 0 6px 0;
}

.login-subtitle {
  font-size: 13px;
  color: var(--gray-500);
  margin: 0;
}

/* ========== Form ========== */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--gray-800);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  height: 48px;
  border: 1.5px solid var(--gray-300);
  border-radius: 10px;
  padding: 0 14px;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--gray-400);
  }

  &:focus-within {
    border-color: var(--primary-500);
    box-shadow: 0 0 0 4px rgba(22, 119, 255, 0.1);
  }
}

.input-icon {
  color: var(--gray-500);
  margin-right: 10px;
  flex-shrink: 0;
}

.form-input {
  flex: 1;
  height: 100%;
  border: none;
  outline: none;
  font-size: 14px;
  color: var(--gray-900);
  font-family: inherit;
  background: transparent;

  &::placeholder {
    color: var(--gray-500);
  }

  &:disabled {
    opacity: 0.5;
  }
}

.input-toggle {
  background: none;
  border: none;
  color: var(--gray-500);
  cursor: pointer;
  padding: 0 6px;
  transition: color 0.2s;

  &:hover {
    color: var(--gray-600);
  }
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.remember-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.remember-checkbox input {
  display: none;
}

.checkbox-box {
  width: 16px;
  height: 16px;
  border: 1.5px solid var(--gray-400);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: var(--gray-0);
}

.remember-checkbox input:checked + .checkbox-box {
  background: var(--primary-500);
  border-color: var(--primary-500);
}

.checkbox-text {
  font-size: 13px;
  color: var(--gray-600);
}

.forgot-link {
  font-size: 13px;
  color: var(--primary-500);
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: var(--primary-600);
  }
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(240, 68, 56, 0.05);
  border: 1px solid rgba(240, 68, 56, 0.2);
  border-radius: 8px;
  color: var(--error-500);
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

/* ========== Login Button ========== */
.login-button {
  height: 52px;
  background: linear-gradient(135deg, var(--info-500) 0%, var(--primary-500) 100%);
  color: var(--gray-0);
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(22, 119, 255, 0.35);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.loader {
  width: 18px;
  height: 18px;
}

.loader-circle {
  stroke: var(--gray-0);
  animation: loader-spin 0.8s linear infinite;
}

@keyframes loader-spin {
  to { transform: rotate(360deg); }
}

/* ========== SSO Section ========== */
.sso-section {
  margin-top: 28px;
}

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: var(--gray-200);
}

.divider-text {
  font-size: 12px;
  color: var(--gray-500);
}

.sso-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.sso-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px;
  border: 1.5px solid var(--gray-200);
  border-radius: 10px;
  font-size: 12px;
  color: var(--gray-600);
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--gray-0);

  &:hover {
    border-color: var(--gray-400);
    background: var(--gray-50);
  }
}

/* ========== Footer ========== */
.login-footer {
  text-align: center;
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid var(--gray-200);
}

.login-footer p {
  margin: 0;
  font-size: 11px;
  color: var(--gray-500);
}

/* ========== Animations ========== */
.animate {
  animation-fill-mode: forwards;
}

[data-animate="fade-up"].animate {
  animation: fade-up 0.6s ease-out forwards;
}

[data-animate="slide-up"].animate {
  animation: slide-up 0.6s ease-out forwards;
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ========== Responsive ========== */
@media (max-width: 1600px) {
  .page-header {
    padding: 0 48px;
  }

  .page-main {
    padding: 32px 48px;
  }

  .brand-title {
    font-size: 32px;
  }
}

@media (max-width: 1440px) {
  .page-header {
    padding: 0 40px;
  }

  .page-main {
    padding: 32px 40px;
    gap: 32px;
  }

  .main-left {
    flex: 0 0 calc(58% - 16px);
    gap: 24px;
  }

  .main-right {
    flex: 0 0 calc(42% - 16px);
  }

  .brand-title {
    font-size: 30px;
  }
}

@media (max-width: 1024px) {
  .page-main {
    flex-direction: column;
    align-items: center;
    gap: 48px;
  }

  .main-left {
    width: 100%;
    max-width: 700px;
    flex: none;
    align-items: center;
    text-align: center;
  }

  .main-right {
    width: 100%;
    flex: none;
    justify-content: center;
  }

  .preview-tabs {
    justify-content: center;
  }

  .features-section {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-section {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .page-header {
    padding: 0 24px;
  }

  .logo-subtitle {
    display: none;
  }

  .lang-switcher {
    display: none;
  }

  .page-main {
    padding: 24px;
    gap: 32px;
  }

  .main-left {
    gap: 24px;
  }

  .brand-title {
    font-size: 28px;
  }

  .brand-desc {
    font-size: 14px;
  }

  .product-section {
    display: none;
  }

  .features-section {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-value {
    font-size: 28px;
  }

  .stat-divider {
    margin: 0 24px;
  }

  .login-card {
    width: 100%;
    padding: 32px 24px;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 0 16px;
  }

  .logo-text {
    font-size: 14px;
  }

  .logo-icon {
    width: 36px;
    height: 36px;
  }

  .brand-title {
    font-size: 24px;
  }

  .features-section {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .feature-text {
    font-size: 11px;
  }

  .stats-section {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .stat-divider {
    width: 48px;
    height: 1px;
    margin: 8px 0;
  }

  .login-card {
    padding: 24px 16px;
  }

  .login-title {
    font-size: 22px;
  }

  .login-button {
    height: 48px;
    font-size: 15px;
  }

  .sso-buttons {
    grid-template-columns: 1fr;
  }
}
</style>
