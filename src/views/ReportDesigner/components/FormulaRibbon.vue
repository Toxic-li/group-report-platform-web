<template>
  <div class="formula-ribbon">
    <div class="ribbon-groups">
      <!-- 函数 -->
      <div class="ribbon-group">
        <span class="ribbon-group-label">函数</span>
        <div class="ribbon-group-btns">
          <button class="ribbon-btn icon" @click="$emit('insert-function')" title="插入函数">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            <span>插入函数</span>
          </button>
          <button class="ribbon-btn icon" @click="$emit('auto-sum')" title="自动求和">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16"/><path d="M12 4v16"/></svg>
            <span>自动求和</span>
          </button>
          <div class="ribbon-row">
            <button class="ribbon-btn sm" @click="$emit('recent-functions')" title="最近使用">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>最近使用</span>
            </button>
            <button class="ribbon-btn sm" @click="$emit('function-wizard')" title="函数向导">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span>函数向导</span>
            </button>
          </div>
        </div>
      </div>

      <div class="ribbon-sep"></div>

      <!-- 命名管理 -->
      <div class="ribbon-group">
        <span class="ribbon-group-label">命名管理</span>
        <div class="ribbon-group-btns">
          <button class="ribbon-btn icon" @click="$emit('named-cells')" title="命名单元格">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
            <span>命名单元格</span>
          </button>
          <button class="ribbon-btn icon" @click="$emit('named-range')" title="命名区域">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
            <span>命名区域</span>
          </button>
          <button class="ribbon-btn sm" @click="$emit('name-manager')" title="名称管理器">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            <span>名称管理器</span>
          </button>
        </div>
      </div>

      <div class="ribbon-sep"></div>

      <!-- 计算字段 -->
      <div class="ribbon-group">
        <span class="ribbon-group-label">计算字段</span>
        <div class="ribbon-group-btns">
          <button class="ribbon-btn icon" @click="$emit('calc-field-new')" title="新增">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
            <span>新增</span>
          </button>
          <button class="ribbon-btn icon" @click="$emit('calc-field-edit')" title="编辑">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
            <span>编辑</span>
          </button>
          <button class="ribbon-btn icon" @click="$emit('calc-field-delete')" title="删除">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            <span>删除</span>
          </button>
        </div>
      </div>

      <div class="ribbon-sep"></div>

      <!-- 调试 -->
      <div class="ribbon-group">
        <span class="ribbon-group-label">调试</span>
        <div class="ribbon-group-btns">
          <div class="ribbon-row">
            <button class="ribbon-btn sm" @click="$emit('show-refs')" title="显示引用">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>
              <span>显示引用</span>
            </button>
            <button class="ribbon-btn sm" @click="$emit('show-deps')" title="显示依赖">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              <span>显示依赖</span>
            </button>
          </div>
          <div class="ribbon-row">
            <button class="ribbon-btn sm" @click="$emit('evaluate')" title="公式求值">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span>公式求值</span>
            </button>
            <button class="ribbon-btn sm" @click="$emit('error-check')" title="错误检查">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span>错误检查</span>
            </button>
          </div>
        </div>
      </div>

      <div class="ribbon-sep"></div>

      <!-- AI -->
      <div class="ribbon-group">
        <span class="ribbon-group-label">AI</span>
        <div class="ribbon-group-btns">
          <button class="ribbon-btn icon ai" @click="$emit('ai-generate')" title="AI生成公式">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            <span>AI生成</span>
          </button>
          <button class="ribbon-btn sm ai" @click="$emit('ai-explain')" title="AI解释公式">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span>AI解释</span>
          </button>
          <button class="ribbon-btn sm ai" @click="$emit('ai-optimize')" title="AI优化公式">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <span>AI优化</span>
          </button>
          <button class="ribbon-btn sm ai" @click="$emit('ai-fix')" title="AI修复错误">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            <span>AI修复</span>
          </button>
        </div>
      </div>

      <div class="ribbon-sep"></div>

      <!-- 运行 -->
      <div class="ribbon-group">
        <span class="ribbon-group-label">运行</span>
        <div class="ribbon-group-btns">
          <button class="ribbon-btn icon" @click="$emit('test-run')" title="测试运行">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            <span>测试运行</span>
          </button>
          <button class="ribbon-btn icon" @click="$emit('recalc-all')" title="全部重算">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            <span>全部重算</span>
          </button>
          <button class="ribbon-btn sm" @click="$emit('show-calc-chain')" title="查看计算链">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            <span>查看计算链</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits([
  'insert-function', 'auto-sum', 'recent-functions', 'function-wizard',
  'named-cells', 'named-range', 'name-manager',
  'calc-field-new', 'calc-field-edit', 'calc-field-delete',
  'show-refs', 'show-deps', 'evaluate', 'error-check',
  'ai-generate', 'ai-explain', 'ai-optimize', 'ai-fix',
  'test-run', 'recalc-all', 'show-calc-chain'
])
</script>

<style scoped>
.formula-ribbon {
  background: #fff;
  border-bottom: 1px solid #E5E7EB;
  flex-shrink: 0;
  padding: 0 12px;
}

.ribbon-groups {
  display: flex;
  align-items: stretch;
  padding: 6px 0;
  min-height: 72px;
  gap: 2px;
}

.ribbon-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 0 5px;
  position: relative;
}

.ribbon-group-label {
  font-size: 10px;
  color: #9CA3AF;
  margin-top: auto;
  text-align: center;
  white-space: nowrap;
  line-height: 1;
}

.ribbon-group-btns {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ribbon-row {
  display: flex;
  gap: 2px;
  align-items: center;
}

.ribbon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 3px 5px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  font-size: 11px;
  color: #374151;
  transition: all 0.15s;
  white-space: nowrap;
}
.ribbon-btn:hover { background: #EFF6FF; border-color: #BFDBFE; }
.ribbon-btn:active { background: #DBEAFE; }

.ribbon-btn.icon {
  flex-direction: column;
  min-width: 36px;
  padding: 3px 2px;
}
.ribbon-btn.icon span { font-size: 10px; margin-top: 0; line-height: 1; }

.ribbon-btn.sm {
  flex-direction: column;
  min-width: 34px;
  padding: 2px;
}
.ribbon-btn.sm span { font-size: 10px; }

.ribbon-btn.ai { color: #2563EB; }
.ribbon-btn.ai:hover { background: #EFF6FF; border-color: #93C5FD; }

.ribbon-sep {
  width: 1px;
  background: #E5E7EB;
  margin: 2px 3px;
  align-self: stretch;
}

.ribbon-btn svg { color: #6B7280; }
.ribbon-btn:hover svg { color: #2563EB; }
.ribbon-btn.ai svg { color: #2563EB; }
</style>
