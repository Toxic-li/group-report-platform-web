<template>
  <div class="de-attachment">
    <div class="de-att-header">
      <h3 class="de-att-title">附件管理</h3>
      <button class="de-att-upload" @click="$emit('upload')" v-if="editable">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        上传附件
      </button>
    </div>

    <div class="de-att-body">
      <div v-if="attachments.length > 0" class="de-att-list">
        <div class="de-att-item" v-for="att in attachments" :key="att.id">
          <div class="de-att-icon" :class="'de-att-icon--' + att.fileType">
            {{ getFileIcon(att.fileType) }}
          </div>
          <div class="de-att-info">
            <div class="de-att-name">{{ att.fileName }}</div>
            <div class="de-att-meta">
              <span>{{ formatSize(att.fileSize) }}</span>
              <span>{{ att.uploaderName }}</span>
              <span>{{ formatDate(att.uploadTime) }}</span>
            </div>
          </div>
          <div class="de-att-actions">
            <button class="de-att-btn" @click="$emit('download', att)" title="下载">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
            <button v-if="editable" class="de-att-btn de-att-btn--danger" @click="$emit('delete', att)" title="删除">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
          </div>
        </div>
      </div>
      <div v-else class="de-att-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--app-text-muted)" stroke-width="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <p>暂无附件</p>
        <span v-if="editable">点击上方按钮上传</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  attachments: { type: Array, default: () => [] },
  editable: { type: Boolean, default: true },
})

defineEmits(['upload', 'download', 'delete'])

function getFileIcon(type) {
  const map = { pdf: '📕', xlsx: '📗', xls: '📗', docx: '📘', doc: '📘', jpg: '🖼', png: '🖼', gif: '🖼' }
  return map[type] || '📄'
}
function formatSize(size) {
  if (!size) return ''
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
  return (size / (1024 * 1024)).toFixed(1) + ' MB'
}
function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.de-attachment {
  height: 100%; display: flex; flex-direction: column;
  background: var(--app-surface); border-radius: var(--app-radius-lg);
  border: 1px solid var(--app-border); overflow: hidden;
}
.de-att-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: var(--app-space-4) var(--app-space-5); border-bottom: 1px solid var(--app-border); flex-shrink: 0;
}
.de-att-title { margin: 0; font-size: 15px; font-weight: 600; color: var(--app-text-primary); }
.de-att-upload {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 14px; border-radius: var(--app-radius-md);
  background: var(--app-primary); color: #fff; border: none; cursor: pointer;
  font-size: 13px; font-weight: 500; font-family: inherit; transition: all var(--app-transition-fast);
}
.de-att-upload:hover { background: var(--app-primary-hover); }
.de-att-body { flex: 1; overflow: auto; padding: var(--app-space-4); }
.de-att-item {
  display: flex; align-items: center; gap: var(--app-space-3);
  padding: var(--app-space-3); background: var(--app-bg); border-radius: var(--app-radius-sm); margin-bottom: var(--app-space-2);
}
.de-att-icon {
  width: 44px; height: 44px; border-radius: var(--app-radius-md);
  display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0;
  background: var(--app-info-bg);
}
.de-att-info { flex: 1; min-width: 0; }
.de-att-name { font-size: 14px; font-weight: 500; color: var(--app-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.de-att-meta { display: flex; gap: var(--app-space-4); margin-top: 4px; font-size: 12px; color: var(--app-text-muted); }
.de-att-actions { display: flex; gap: var(--app-space-1); flex-shrink: 0; }
.de-att-btn {
  width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
  border: none; background: transparent; border-radius: var(--app-radius-sm); cursor: pointer;
  color: var(--app-text-secondary); transition: all var(--app-transition-fast);
}
.de-att-btn:hover { background: var(--app-surface-hover); }
.de-att-btn--danger:hover { background: var(--app-danger-bg); color: var(--app-danger); }
.de-att-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: var(--app-space-10); text-align: center;
}
.de-att-empty p { margin: var(--app-space-3) 0 0; font-size: 14px; color: var(--app-text-secondary); }
.de-att-empty span { font-size: 12px; color: var(--app-text-muted); margin-top: 4px; }
</style>
