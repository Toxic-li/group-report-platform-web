<template>
  <div class="not-found">
    <div class="nf-content">
      <div class="nf-icon">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <path d="M9 9l6 6M15 9l-6 6"/>
        </svg>
      </div>
      <div class="nf-code">404</div>
      <p class="nf-desc">抱歉，您访问的页面不存在</p>
      <button class="nf-btn" @click="goHome">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        返回首页
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
function goHome() {
  router.push('/')
}
</script>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #F5F7FA;
}
.nf-content {
  text-align: center;
  animation: nfIn 0.5s ease-out;
}
@keyframes nfIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.nf-icon {
  color: #9CA3AF;
  margin-bottom: 16px;
}
.nf-code {
  font-size: 64px;
  font-weight: 800;
  color: #1677FF;
  line-height: 1;
  letter-spacing: -2px;
}
.nf-desc {
  color: #6B7280;
  font-size: 15px;
  margin: 12px 0 24px;
}
.nf-btn {
  display: inline-flex;
  align-items: center;
  padding: 10px 24px;
  border-radius: 8px;
  border: none;
  background: #1677FF;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.nf-btn:hover {
  background: #1A51DB;
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.3);
}
</style>
