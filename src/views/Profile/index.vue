<template>
  <div class="profile">
    <div class="profile-content">
      <div class="profile-sidebar">
        <div class="user-card">
          <div class="user-avatar">{{ userInitial }}</div>
          <div class="user-info">
            <div class="user-name">{{ userName }}</div>
            <div class="user-role">报表管理员</div>
          </div>
        </div>

        <nav class="profile-nav">
          <button :class="['nav-item', { active: activeTab === 'info' }]" @click="handleTabClick('info')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            个人信息
          </button>
          <button :class="['nav-item', { active: activeTab === 'messages' }]" @click="handleTabClick('messages')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            我的消息
          </button>
          <button :class="['nav-item', { active: activeTab === 'favorites' }]" @click="handleTabClick('favorites')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            我的收藏
          </button>
          <button :class="['nav-item', { active: activeTab === 'password' }]" @click="handleTabClick('password')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            修改密码
          </button>
          <button :class="['nav-item', { active: activeTab === 'logs' }]" @click="handleTabClick('logs')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="9" y1="13" x2="15" y2="13"/>
            </svg>
            登录日志
          </button>
        </nav>
      </div>

      <div class="profile-main">
        <!-- 个人信息 -->
        <div v-if="activeTab === 'info'" class="profile-tab">
          <div class="tab-header">
            <h2 class="tab-title">个人信息</h2>
          </div>
          <div class="form-card">
            <div class="form-row">
              <div class="form-item">
                <label class="form-label">用户名</label>
                <div class="form-value">{{ userName }}</div>
              </div>
              <div class="form-item">
                <label class="form-label">姓名</label>
                <div class="form-value">{{ userName }}</div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-item">
                <label class="form-label">部门</label>
                <div class="form-value">技术部</div>
              </div>
              <div class="form-item">
                <label class="form-label">角色</label>
                <div class="form-value">报表管理员</div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-item full">
                <label class="form-label">邮箱</label>
                <div class="form-value">admin@example.com</div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-item full">
                <label class="form-label">电话</label>
                <div class="form-value">138****8888</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 我的消息 -->
        <div v-if="activeTab === 'messages'" class="profile-tab">
          <div class="tab-header">
            <h2 class="tab-title">我的消息</h2>
          </div>
          <div class="table-card">
            <div class="table-body">
              <div class="table-row">
                <div class="table-cell">系统通知</div>
                <div class="table-cell">系统将于今晚22:00进行维护升级</div>
                <div class="table-cell">2026-07-08 10:00</div>
              </div>
              <div class="table-row">
                <div class="table-cell">审核提醒</div>
                <div class="table-cell">您有3条待审核报表</div>
                <div class="table-cell">2026-07-08 09:30</div>
              </div>
              <div class="table-row">
                <div class="table-cell">审批完成</div>
                <div class="table-cell">您提交的报表已审核通过</div>
                <div class="table-cell">2026-07-07 16:00</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 我的收藏 -->
        <div v-if="activeTab === 'favorites'" class="profile-tab">
          <div class="tab-header">
            <h2 class="tab-title">我的收藏</h2>
          </div>
          <div class="table-card">
            <div class="table-body">
              <div class="table-row">
                <div class="table-cell">月度销售报表</div>
                <div class="table-cell">SALES-202401</div>
                <div class="table-cell">2026-07-05</div>
              </div>
              <div class="table-row">
                <div class="table-cell">财务汇总报表</div>
                <div class="table-cell">FIN-202401</div>
                <div class="table-cell">2026-07-04</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 修改密码 -->
        <div v-if="activeTab === 'password'" class="profile-tab">
          <div class="tab-header">
            <h2 class="tab-title">修改密码</h2>
          </div>
          <div class="form-card">
            <div class="form-row">
              <div class="form-item full">
                <label class="form-label">原密码</label>
                <input type="password" class="form-input" placeholder="请输入原密码" v-model="oldPassword"/>
              </div>
            </div>
            <div class="form-row">
              <div class="form-item full">
                <label class="form-label">新密码</label>
                <input type="password" class="form-input" placeholder="请输入新密码" v-model="newPassword"/>
              </div>
            </div>
            <div class="form-row">
              <div class="form-item full">
                <label class="form-label">确认密码</label>
                <input type="password" class="form-input" placeholder="请再次输入新密码" v-model="confirmPassword"/>
              </div>
            </div>
            <div class="form-actions">
              <button class="btn-primary" @click="handleChangePassword">保存修改</button>
              <button class="btn-secondary">取消</button>
            </div>
          </div>
        </div>

        <!-- 登录日志 -->
        <div v-if="activeTab === 'logs'" class="profile-tab">
          <div class="tab-header">
            <h2 class="tab-title">登录日志</h2>
          </div>
          <div class="table-card">
            <div class="table-header">
              <span class="table-title">最近登录记录</span>
            </div>
            <div class="table-body">
              <div class="table-row">
                <div class="table-cell">2026-07-08 10:30:15</div>
                <div class="table-cell">192.168.1.100</div>
                <div class="table-cell">Windows / Chrome</div>
                <div class="table-cell success">登录成功</div>
              </div>
              <div class="table-row">
                <div class="table-cell">2026-07-07 14:20:33</div>
                <div class="table-cell">192.168.1.100</div>
                <div class="table-cell">Windows / Chrome</div>
                <div class="table-cell success">登录成功</div>
              </div>
              <div class="table-row">
                <div class="table-cell">2026-07-06 09:15:48</div>
                <div class="table-cell">10.0.0.50</div>
                <div class="table-cell">MacOS / Safari</div>
                <div class="table-cell success">登录成功</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const activeTab = ref('info')
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const userName = ref('张三')

const userInitial = computed(() => {
  return userName.value.charAt(0).toUpperCase()
})

function handleChangePassword() {
  alert('密码修改成功')
}

function updateActiveTabFromRoute() {
  const path = route.path
  if (path.includes('/profile/messages')) activeTab.value = 'messages'
  else if (path.includes('/profile/favorites')) activeTab.value = 'favorites'
  else if (path.includes('/profile/password')) activeTab.value = 'password'
  else if (path.includes('/profile/logs')) activeTab.value = 'logs'
  else activeTab.value = 'info'
}

function handleTabClick(tabId) {
  activeTab.value = tabId
  const routeMap = {
    'info': '/profile',
    'messages': '/profile/messages',
    'favorites': '/profile/favorites',
    'password': '/profile/password',
    'logs': '/profile/logs'
  }
  router.push(routeMap[tabId] || '/profile')
}

onMounted(() => {
  const userStr = sessionStorage.getItem('rpt_user') || localStorage.getItem('rpt_user')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      userName.value = user.name || user.username || '用户'
    } catch {
      // ignore
    }
  }
  updateActiveTabFromRoute()
})

watch(() => route.path, () => {
  updateActiveTabFromRoute()
})
</script>

<style lang="scss" scoped>
.profile {
  padding: 24px;
  background: var(--gray-50);
  min-height: calc(100vh - 64px);
}

.profile-content {
  display: flex;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.profile-sidebar {
  width: 220px;
  flex-shrink: 0;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid var(--gray-100);
  margin-bottom: 16px;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--primary-500);
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-info {
  flex: 1;
  overflow: hidden;
}

.user-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--gray-900);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 12px;
  color: var(--gray-500);
  margin-top: 2px;
}

.profile-nav {
  background: #fff;
  border-radius: 12px;
  border: 1px solid var(--gray-100);
  overflow: hidden;
}

.nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border: none;
  background: none;
  font-size: 14px;
  color: var(--gray-600);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--gray-50);
    color: var(--gray-900);
  }

  &.active {
    background: rgba(37, 99, 235, 0.08);
    color: var(--primary-500);
    font-weight: 500;
  }
}

.profile-main {
  flex: 1;
  min-width: 0;
}

.tab-header {
  margin-bottom: 20px;
}

.tab-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--gray-900);
  margin: 0;
}

.form-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid var(--gray-100);
  padding: 24px;
}

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-item {
  flex: 1;

  &.full {
    flex: 2;
  }
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--gray-700);
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--gray-300);
  border-radius: 8px;
  font-size: 14px;
  color: var(--gray-900);
  background: #fff;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: var(--primary-500);
  }

  &::placeholder {
    color: var(--gray-400);
  }
}

.form-value {
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  font-size: 14px;
  color: var(--gray-700);
  background: var(--gray-50);
  display: flex;
  align-items: center;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--gray-100);
}

.btn-primary {
  padding: 10px 24px;
  background: var(--primary-500);
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--primary-600);
  }
}

.btn-secondary {
  padding: 10px 24px;
  background: #fff;
  border: 1px solid var(--gray-300);
  border-radius: 8px;
  font-size: 14px;
  color: var(--gray-700);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--gray-400);
  }
}

.table-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid var(--gray-100);
  overflow: hidden;
}

.table-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--gray-100);
}

.table-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-900);
}

.table-body {
  padding: 8px 0;
}

.table-row {
  display: flex;
  padding: 12px 20px;
  border-bottom: 1px solid var(--gray-100);

  &:hover {
    background: var(--gray-50);
  }

  &:last-child {
    border-bottom: none;
  }
}

.table-cell {
  flex: 1;
  font-size: 13px;
  color: var(--gray-700);

  &.success {
    color: var(--success-500);
    font-weight: 500;
  }
}

@media (max-width: 768px) {
  .profile-content {
    flex-direction: column;
  }

  .profile-sidebar {
    width: 100%;
  }

  .form-row {
    flex-direction: column;
  }

  .form-item.full {
    flex: 1;
  }
}
</style>
