<template>
  <div class="validation-rules">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">校验规则管理</h1>
        <p class="page-desc">配置模板数据校验规则，确保填报数据质量</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="showAddDialog = true">+ 新增规则</el-button>
      </div>
    </div>

    <div class="content-card">
      <div class="filter-bar">
        <el-select v-model="selectedTemplateId" placeholder="选择模板" style="width: 240px" @change="loadRules" clearable>
          <el-option v-for="t in templates" :key="t.id" :label="t.templateName" :value="t.id" />
        </el-select>
      </div>

      <el-table v-loading="loading" :data="rules" border style="width: 100%">
        <el-table-column prop="rowCode" label="行编码" width="120">
          <template #default="{ row }">{{ row.rowCode || '全部行' }}</template>
        </el-table-column>
        <el-table-column prop="columnCode" label="列编码" width="120">
          <template #default="{ row }">{{ row.columnCode || '全部列' }}</template>
        </el-table-column>
        <el-table-column prop="ruleType" label="规则类型" width="120">
          <template #default="{ row }">{{ ruleTypeText(row.ruleType) }}</template>
        </el-table-column>
        <el-table-column prop="ruleValue" label="规则值" width="150" />
        <el-table-column prop="errorMessage" label="错误提示" min-width="200" />
        <el-table-column prop="enabled" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" size="small">{{ row.enabled ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && rules.length === 0 && selectedTemplateId" description="暂无校验规则" />
      <el-empty v-if="!selectedTemplateId" description="请先选择模板" />
    </div>

    <!-- Add/Edit Dialog -->
    <el-dialog v-model="showAddDialog" title="新增校验规则" width="500px">
      <el-form label-width="90px">
        <el-form-item label="行编码">
          <el-input v-model="form.rowCode" placeholder="留空表示全部行" />
        </el-form-item>
        <el-form-item label="列编码">
          <el-input v-model="form.columnCode" placeholder="留空表示全部列" />
        </el-form-item>
        <el-form-item label="规则类型">
          <el-select v-model="form.ruleType" style="width: 100%">
            <el-option label="必填" value="required" />
            <el-option label="最小值" value="min" />
            <el-option label="最大值" value="max" />
            <el-option label="数值范围" value="range" />
            <el-option label="正则匹配" value="pattern" />
          </el-select>
        </el-form-item>
        <el-form-item label="规则值" v-if="form.ruleType !== 'required'">
          <el-input v-model="form.ruleValue" :placeholder="ruleValuePlaceholder" />
        </el-form-item>
        <el-form-item label="错误提示">
          <el-input v-model="form.errorMessage" placeholder="校验失败时显示" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :disabled="!form.ruleType">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTemplateList } from '@/api/reportDesigner.js'
import { get, post, del } from '@/utils/http'

const templates = ref([])
const selectedTemplateId = ref(null)
const rules = ref([])
const loading = ref(false)
const showAddDialog = ref(false)

const form = ref({ rowCode: '', columnCode: '', ruleType: '', ruleValue: '', errorMessage: '' })

const ruleValuePlaceholder = computed(() => {
  const map = { min: '最小值，如: 0', max: '最大值，如: 100', range: '范围，如: 0,100', pattern: '正则表达式，如: ^\\d+$' }
  return map[form.value.ruleType] || ''
})

function ruleTypeText(type) {
  const map = { required: '必填', min: '最小值', max: '最大值', range: '范围', pattern: '正则' }
  return map[type] || type
}

async function loadTemplates() {
  try {
    const res = await getTemplateList({ current: 1, size: 100 })
    templates.value = res?.data?.records || res?.records || []
  } catch { /* */ }
}

async function loadRules() {
  if (!selectedTemplateId.value) return
  loading.value = true
  try {
    const res = await get(`/validation-rule/template/${selectedTemplateId.value}`)
    rules.value = res?.data || res || []
  } catch {
    rules.value = []
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  try {
    await post('/validation-rule', {
      templateId: selectedTemplateId.value,
      rowCode: form.value.rowCode || null,
      columnCode: form.value.columnCode || null,
      ruleType: form.value.ruleType,
      ruleValue: form.value.ruleValue || null,
      errorMessage: form.value.errorMessage || null,
      enabled: 1
    })
    ElMessage.success('保存成功')
    showAddDialog.value = false
    form.value = { rowCode: '', columnCode: '', ruleType: '', ruleValue: '', errorMessage: '' }
    loadRules()
  } catch (err) {
    ElMessage.error('保存失败: ' + (err?.message || '未知错误'))
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定删除该规则吗？', '确认删除', { type: 'warning' })
    await del(`/validation-rule/${row.id}`)
    ElMessage.success('删除成功')
    loadRules()
  } catch { /* cancelled */ }
}

onMounted(() => { loadTemplates() })
</script>

<style scoped>
.validation-rules { padding: 24px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.page-title { font-size: 20px; font-weight: 600; margin: 0; color: var(--app-text-primary); }
.page-desc { font-size: 13px; color: var(--app-text-muted); margin: 4px 0 0; }
.content-card { background: var(--app-surface); border: 1px solid var(--app-border); border-radius: 12px; padding: 20px; }
.filter-bar { margin-bottom: 16px; display: flex; gap: 12px; }
</style>