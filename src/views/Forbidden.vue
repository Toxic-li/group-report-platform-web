<template>
  <div class="forbidden-page">
    <div class="fb-content">
      <div class="fb-icon">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <line x1="4" y1="4" x2="20" y2="20" stroke-width="2"/>
        </svg>
      </div>
      <div class="fb-code">403</div>
      <p class="fb-title">无访问权限</p>
      <p class="fb-desc">您没有访问该页面的权限，请联系管理员分配相应角色。</p>
      <div class="fb-actions">
        <button class="fb-btn fb-btn-primary" @click="goHome">返回首页</button>
        <button class="fb-btn fb-btn-ghost" @click="goLogin">切换账号</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push('/')
}

function goLogin() {
  router.push('/login')
}
</script>

<style scoped>
.forbidden-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #F5F7FA;
}
.fb-content {
  text-align: center;
  animation: fbIn 0.5s ease-out;
}
@keyframes fbIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.fb-icon {
  color: #F04438;
  margin-bottom: 16px;
}
.fb-code {
  font-size: 64px;
  font-weight: 800;
  color: #F04438;
  line-height: 1;
  letter-spacing: -2px;
}
.fb-title {
  color: #1F2937;
  font-size: 20px;
  font-weight: 600;
  margin: 16px 0 8px;
}
.fb-desc {
  color: #6B7280;
  font-size: 14px;
  margin-bottom: 28px;
  max-width: 360px;
}
.fb-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
.fb-btn {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}
.fb-btn-primary {
  background: #1677FF;
  color: #fff;
}
.fb-btn-primary:hover {
  background: #1A51DB;
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.3);
}
.fb-btn-ghost {
  background: transparent;
  color: #6B7280;
  border-color: #E5E7EB;
}
.fb-btn-ghost:hover {
  background: #fff;
  border-color: #D1D5DB;
  color: #1F2937;
}
</style>
