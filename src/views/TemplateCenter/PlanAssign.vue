<template>
  <div class="plan-assign">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">📤 计划下发</h1>
        <p class="page-desc">
          <span class="data-source-hint">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            将 <b>计划模板</b>（planFlag=1）下发到下级组织。下发后下级组织即可在【填报中心-计划上报】中录入计划金额。
          </span>
        </p>
      </div>
    </div>

    <div class="content-card">
      <!-- 数据链路图示 -->
      <el-steps :active="3" finish-status="success" simple style="margin-bottom: 20px;">
        <el-step title="① 模板设计" description="标记为计划模板"></el-step>
        <el-step title="② 计划下发" description="本页操作"></el-step>
        <el-step title="③ 计划上报" description="下级组织录入数据"></el-step>
        <el-step title="④ 计划汇总" description="自动汇总数据来源"></el-step>
      </el-steps>

      <!-- 第一步：选择计划模板 -->
      <el-card shadow="never" style="margin-bottom: 16px;">
        <template #header>
          <div class="card-header">
            <span>1️⃣ 选择计划模板</span>
            <el-tag size="small" type="info">仅显示 planFlag=1 的模板</el-tag>
          </div>
        </template>

        <el-table
          v-loading="loadingTemplates"
          :data="planTemplates"
          border
          height="280"
          highlight-current-row
          @current-change="handleTemplateSelect"
        >
          <el-table-column width="60" label="选择">
            <template #default="{ row }">
              <el-radio v-model="selectedTemplateId" :value="row.id" @change="onTemplateRadioChange(row)">
                <span></span>
              </el-radio>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="计划模板名称" min-width="200" />
          <el-table-column prop="code" label="模板编号" width="160" />
          <el-table-column prop="category" label="分类" width="100">
            <template #default="{ row }">
              <el-tag size="small" type="danger" effect="plain">📋 {{ row.category || '计划' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="periodType" label="周期类型" width="100" />
          <el-table-column prop="version" label="版本" width="80" />
          <el-table-column prop="description" label="说明" min-width="180" />
          <el-table-column prop="updateTime" label="更新时间" width="170">
            <template #default="{ row }">{{ formatDate(row.updateTime) }}</template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 第二步：配置下发参数 -->
      <el-card shadow="never" style="margin-bottom: 16px;">
        <template #header>
          <div class="card-header">
            <span>2️⃣ 配置下发参数</span>
          </div>
        </template>

        <el-form :model="assignForm" label-width="120px" :disabled="!selectedTemplateId">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="计划年度" required>
                <el-select v-model="assignForm.year" placeholder="请选择年度" style="width: 100%">
                  <el-option v-for="y in yearOptions" :key="y" :label="y + '年'" :value="y" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="计划期间">
                <el-input v-model="assignForm.period" placeholder="如：2026-Q1 / 2026-01 / 2026全年" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="截止日期">
                <el-date-picker
                  v-model="assignForm.deadline"
                  type="date"
                  placeholder="选择截止日期"
                  style="width: 100%"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="下发组织" required>
                <el-cascader
                  v-model="assignForm.targetOrgIds"
                  :options="orgTree"
                  :props="{ multiple: true, value: 'id', label: 'orgName', checkStrictly: true, emitPath: false }"
                  placeholder="选择需要下发的组织（可多选）"
                  collapse-tags
                  collapse-tags-tooltip
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="说明">
                <el-input
                  v-model="assignForm.remark"
                  type="textarea"
                  :rows="3"
                  placeholder="下发说明（可选），将显示在下级组织的计划上报列表中"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-card>

      <!-- 第三步：确认并下发 -->
      <el-card shadow="never">
        <template #header>
          <div class="card-header">
            <span>3️⃣ 确认下发</span>
          </div>
        </template>

        <div class="confirm-summary">
          <div class="summary-row">
            <span class="summary-label">计划模板：</span>
            <span class="summary-value">{{ selectedTemplate ? selectedTemplate.name : '未选择' }}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">下发组织数：</span>
            <span class="summary-value">{{ assignForm.targetOrgIds.length }} 个</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">计划期间：</span>
            <span class="summary-value">{{ assignForm.period || '未指定' }}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">截止日期：</span>
            <span class="summary-value">{{ assignForm.deadline || '不限制' }}</span>
          </div>
        </div>

        <div style="text-align: center; margin-top: 20px;">
          <el-button
            type="primary"
            size="large"
            :loading="submitting"
            :disabled="!canSubmit"
            @click="handleSubmit"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            确认下发
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { get, post } from '@/utils/http'

const loadingTemplates = ref(false)
const submitting = ref(false)
const planTemplates = ref([])
const orgTree = ref([])
const selectedTemplateId = ref(null)
const selectedTemplate = ref(null)

const assignForm = reactive({
  year: String(new Date().getFullYear()),
  period: '',
  deadline: null,
  targetOrgIds: [],
  remark: ''
})

const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  return [currentYear - 1, currentYear, currentYear + 1]
})

const canSubmit = computed(() => {
  return selectedTemplateId.value
    && assignForm.year
    && assignForm.targetOrgIds.length > 0
})

onMounted(() => {
  loadPlanTemplates()
  loadOrgTree()
})

async function loadPlanTemplates() {
  loadingTemplates.value = true
  try {
    const res = await get('/plan/templates')
    const data = res?.data?.data || []
    planTemplates.value = data
  } catch (e) {
    console.error('加载计划模板失败:', e)
    planTemplates.value = []
  } finally {
    loadingTemplates.value = false
  }
}

async function loadOrgTree() {
  try {
    const res = await get('/org/tree')
    orgTree.value = res?.data || res || []
  } catch (e) {
    console.error('加载组织树失败:', e)
    orgTree.value = []
  }
}

function handleTemplateSelect(row) {
  if (row) {
    selectedTemplateId.value = row.id
    selectedTemplate.value = row
  }
}

function onTemplateRadioChange(row) {
  selectedTemplate.value = row
}

async function handleSubmit() {
  if (!canSubmit.value) {
    ElMessage.warning('请填写完整下发参数')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认将【${selectedTemplate.value.name}】下发到 ${assignForm.targetOrgIds.length} 个组织？下发后下级组织将收到填报通知。`,
      '确认下发',
      { type: 'warning' }
    )
  } catch {
    return
  }

  submitting.value = true
  try {
    const payload = {
      templateId: selectedTemplateId.value,
      orgIds: assignForm.targetOrgIds,
      year: assignForm.year,
      period: assignForm.period || assignForm.year,
      deadline: assignForm.deadline,
      remark: assignForm.remark
    }

    await post('/template-assign', payload)

    ElMessage.success(`下发成功！已下发到 ${assignForm.targetOrgIds.length} 个组织`)
    // 重置表单
    assignForm.targetOrgIds = []
    assignForm.remark = ''
    assignForm.period = ''
  } catch (e) {
    console.error('下发失败:', e)
    ElMessage.error('下发失败：' + (e.message || e))
  } finally {
    submitting.value = false
  }
}

function formatDate(date) {
  if (!date) return '-'
  if (typeof date === 'string') {
    return date.replace('T', ' ').substring(0, 19)
  }
  return new Date(date).toLocaleString('zh-CN')
}
</script>

<style scoped>
.plan-assign {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 20px 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 4px 0;
}

.page-desc {
  font-size: 13px;
  color: #606266;
  margin: 0;
}

.data-source-hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #409eff;
  font-size: 13px;
}

.content-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
  color: #303133;
}

.confirm-summary {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
  border-left: 4px solid #409eff;
}

.summary-row {
  display: flex;
  padding: 6px 0;
  font-size: 14px;
}

.summary-label {
  width: 140px;
  color: #606266;
}

.summary-value {
  color: #303133;
  font-weight: 500;
}
</style>
