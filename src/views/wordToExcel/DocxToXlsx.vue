<template>
  <div class="converter-page">
    <div class="header">
      <h1>Word 转 Excel 工具</h1>
      <p class="subtitle">上传 Word 文档，一键解析并导出格式化 Excel</p>
    </div>

    <div
      class="upload-card"
      @click="triggerUpload"
      @dragover.prevent
      @drop.prevent="onDrop"
    >
      <input
        ref="fileInput"
        type="file"
        accept=".docx"
        hidden
        @change="onFileChange"
      />
      <div class="upload-content">
        <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <p class="upload-text">点击或拖拽文件到此处</p>
        <p class="upload-hint">支持 .docx 格式</p>
      </div>
    </div>

    <div v-if="file" class="file-info">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1F4E79" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      <span class="file-name">{{ file.name }}</span>
      <button class="remove-btn" @click.stop="removeFile">移除</button>
    </div>

    <button
      class="convert-btn"
      :disabled="!file || converting"
      @click="startConvert"
    >
      <span v-if="converting" class="spinner"></span>
      {{ converting ? '转换中...' : '开始转换' }}
    </button>

    <div v-if="result" :class="['result', result.success ? 'success' : 'error']">
      <template v-if="result.success">
        转换成功！共提取 {{ result.count }} 条记录
        <a
          v-if="downloadUrl"
          class="download-link"
          :href="downloadUrl"
          download
        >下载 Excel</a>
      </template>
      <template v-else>
        转换失败：{{ result.error }}
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

const fileInput = ref<HTMLInputElement>()
const file = ref<File | null>(null)
const converting = ref(false)
const result = ref<{ success: boolean; count?: number; token?: string; error?: string } | null>(null)

const downloadUrl = computed(() => {
  if (result.value?.success && result.value.token) {
    return `${API_BASE}/api/convert/download?token=${result.value.token}`
  }
  return ''
})

function triggerUpload() {
  fileInput.value?.click()
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    handleFile(target.files[0])
  }
}

function onDrop(e: DragEvent) {
  if (e.dataTransfer?.files.length) {
    handleFile(e.dataTransfer.files[0])
  }
}

function handleFile(f: File) {
  if (!f.name.toLowerCase().endsWith('.docx')) {
    alert('仅支持 .docx 格式文件')
    return
  }
  file.value = f
  result.value = null
}

function removeFile() {
  file.value = null
  result.value = null
  if (fileInput.value) fileInput.value.value = ''
}

async function startConvert() {
  if (!file.value) return
  converting.value = true
  result.value = null

  const form = new FormData()
  form.append('file', file.value)

  try {
    const res = await fetch(`${API_BASE}/api/convert`, {
      method: 'POST',
      body: form
    })
    const data = await res.json()
    result.value = data
  } catch (err: any) {
    result.value = { success: false, error: err.message || '网络错误' }
  } finally {
    converting.value = false
  }
}
</script>

<style scoped>
.converter-page {
  max-width: 560px;
  margin: 40px auto;
  padding: 40px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(31, 78, 121, 0.12);
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
}
.header {
  text-align: center;
  margin-bottom: 30px;
}
.header h1 {
  font-size: 24px;
  color: #1F4E79;
  margin-bottom: 6px;
}
.subtitle {
  font-size: 13px;
  color: #888;
}
.upload-card {
  border: 2px dashed #c5d3e0;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafbfc;
}
.upload-card:hover {
  border-color: #1F4E79;
  background: #f0f5fa;
}
.upload-content {
  pointer-events: none;
}
.upload-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
  color: #1F4E79;
}
.upload-text {
  font-size: 15px;
  color: #444;
  margin-bottom: 6px;
}
.upload-hint {
  font-size: 12px;
  color: #999;
}
.file-info {
  margin-top: 16px;
  padding: 12px 16px;
  background: #e8f0f8;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.file-name {
  flex: 1;
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.remove-btn {
  font-size: 12px;
  color: #c62828;
  cursor: pointer;
  border: none;
  background: none;
}
.convert-btn {
  width: 100%;
  margin-top: 20px;
  padding: 12px;
  font-size: 15px;
  font-weight: bold;
  color: #fff;
  background: #1F4E79;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.convert-btn:hover:not(:disabled) {
  background: #2a5f8f;
}
.convert-btn:disabled {
  background: #b0c4d8;
  cursor: not-allowed;
}
.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #fff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.result {
  margin-top: 20px;
  padding: 16px;
  border-radius: 8px;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
}
.result.success {
  background: #e8f5e9;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
}
.result.error {
  background: #fde8e8;
  color: #c62828;
  border: 1px solid #f5c6cb;
}
.download-link {
  display: inline-block;
  padding: 8px 18px;
  background: #1F4E79;
  color: #fff;
  text-decoration: none;
  border-radius: 6px;
  font-size: 13px;
}
.download-link:hover {
  background: #2a5f8f;
}
</style>
