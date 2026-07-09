<template>
  <div class="designer-app" v-loading="loading">
    <DesignerProvider>
      <!-- 顶部 Header -->
      <AppHeader
        :saving="saving"
        :publishing="publishing"
        @save="handleSaveTemplate"
        @saveAs="handleSaveAs"
        @preview="handlePreview"
        @publish="handlePublishTemplate"
        @exportExcel="handleExportExcel"
        @templateLibrary="handleTemplateLibrary"
        @toggleFullscreen="toggleFullscreen"
        @toggleHelp="showHelp"
        @importExcel="handleImportExcel"
      />

      <!-- Ribbon 工具栏 -->
      <RibbonToolbar
        @undo="handleUndo"
        @redo="handleRedo"
        @cut="handleCut"
        @copy="handleCopy"
        @paste="handlePaste"
        @formatPainter="handleFormatPainter"
        @mergeCells="handleMergeCells"
        @splitCells="handleSplitCells"
        @freezeRows="freezeRows"
        @freezeCols="freezeCols"
        @conditionalFormat="handleConditionalFormat"
      />

      <!-- 主工作区 -->
      <div class="main-workspace">
        <!-- 左侧数据面板 -->
        <DataPanel />

        <!-- 中间区域 -->
        <div class="center-area">
          <!-- 公式栏 -->
          <FormulaBar
            v-model:displayValue="formulaBarDisplay"
            @cancelEdit="cancelEdit"
            @confirmEdit="commitEditFromBar"
            @insertFunction="insertFunction"
          />

          <!-- 画布 -->
          <ReportCanvas />
        </div>

        <!-- 右侧属性面板 -->
        <PropertyPanel
          @openConditionalFormat="handleConditionalFormat"
          @openPermission="showPermissionDialog"
          @openExtension="showExtensionDialog"
        />
      </div>

      <!-- 底部状态栏 -->
      <StatusBar />

      <!-- 模板属性弹窗 -->
      <el-dialog v-model="showTemplateProps" title="模板属性" width="500px" destroy-on-close>
        <div class="tp-form">
          <div class="tp-field">
            <label>模板名称 *</label>
            <el-input v-model="template.name" placeholder="如：煤炭生产销售库存表" />
          </div>
          <div class="tp-field">
            <label>模板编码 *</label>
            <el-input v-model="template.code" placeholder="如：RPT-COAL-001" />
          </div>
          <div class="tp-row">
            <div class="tp-field">
              <label>模板类型</label>
              <el-select v-model="template.templateType" style="width:100%">
                <el-option :value="1" label="统计报表" />
                <el-option :value="2" label="填报报表" />
                <el-option :value="3" label="汇总报表" />
              </el-select>
            </div>
            <div class="tp-field">
              <label>状态</label>
              <el-select v-model="template.status" style="width:100%">
                <el-option :value="0" label="草稿" />
                <el-option :value="1" label="已发布" />
                <el-option :value="2" label="已停用" />
              </el-select>
            </div>
          </div>
          <div class="tp-field">
            <label>描述</label>
            <el-input v-model="template.description" type="textarea" rows="3" placeholder="报表用途说明" />
          </div>
        </div>
        <template #footer>
          <el-button @click="showTemplateProps = false">取消</el-button>
          <el-button type="primary" @click="handleSaveTemplate">保存</el-button>
        </template>
      </el-dialog>

      <!-- 另存为弹窗 -->
      <el-dialog v-model="saveAsDialog.visible" title="另存为" width="450px" destroy-on-close>
        <div class="tp-form">
          <div class="tp-field">
            <label>新模板名称 *</label>
            <el-input v-model="saveAsDialog.name" placeholder="输入新模板名称" />
          </div>
          <div class="tp-field">
            <label>新模板编码 *</label>
            <el-input v-model="saveAsDialog.code" placeholder="输入新模板编码" />
          </div>
          <div class="tp-field">
            <label>描述</label>
            <el-input v-model="saveAsDialog.description" type="textarea" rows="3" placeholder="模板描述" />
          </div>
        </div>
        <template #footer>
          <el-button @click="saveAsDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="confirmSaveAs" :disabled="!saveAsDialog.name || !saveAsDialog.code">保存</el-button>
        </template>
      </el-dialog>
    </DesignerProvider>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, provide } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { loadTemplate, saveTemplate, updateTemplate, publishTemplate } from '@/api/reportDesigner.js'

import DesignerProvider from './DesignerProvider.vue'
import AppHeader from './components/AppHeader.vue'
import RibbonToolbar from './components/RibbonToolbar.vue'
import DataPanel from './components/DataPanel.vue'
import ReportCanvas from './components/ReportCanvas.vue'
import PropertyPanel from './components/PropertyPanel.vue'
import FormulaBar from './components/FormulaBar.vue'
import StatusBar from './components/StatusBar.vue'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const saving = ref(false)
const publishing = ref(false)
const showTemplateProps = ref(false)

const template = ref({
  id: null,
  code: '',
  name: '未命名报表',
  status: 0,
  version: 1,
  description: '',
  templateType: 1,
  categoryId: null,
  periodType: 3,
  auditRequired: 0,
})

const autoSaveStatus = ref('saved')
const formulaBarDisplay = ref('')

const saveAsDialog = ref({
  visible: false,
  name: '',
  code: '',
  description: ''
})

// Provide 共享状态给子组件
provide('designerTemplate', template)
provide('designerAutoSave', autoSaveStatus)

// ==================== 模板加载 ====================
onMounted(() => {
  const code = route.params.code
  if (code) {
    loadTemplateData(code)
  }
})

async function loadTemplateData(code) {
  loading.value = true
  try {
    const data = await loadTemplate(code)
    if (data) {
      template.value = { ...template.value, ...data }
    }
  } catch (e) {
    console.error('加载模板失败:', e)
    ElMessage.error('加载模板失败')
  } finally {
    loading.value = false
  }
}

// ==================== 保存操作 ====================
async function handleSaveTemplate() {
  if (!template.value.name) {
    ElMessage.warning('请输入模板名称')
    return
  }
  saving.value = true
  autoSaveStatus.value = 'saving'
  try {
    if (template.value.id) {
      await updateTemplate(template.value.id, template.value)
    } else {
      const res = await saveTemplate(template.value)
      if (res?.id) template.value.id = res.id
    }
    autoSaveStatus.value = 'saved'
    ElMessage.success('保存成功')
  } catch (e) {
    autoSaveStatus.value = 'unsaved'
    ElMessage.error('保存失败')
    console.error(e)
  } finally {
    saving.value = false
  }
}

function handleSaveAs() {
  saveAsDialog.value = {
    visible: true,
    name: template.value.name + ' (副本)',
    code: template.value.code + '_COPY',
    description: template.value.description
  }
}

async function confirmSaveAs() {
  const { name, code, description } = saveAsDialog.value
  try {
    const newTpl = { ...template.value, id: null, name, code, description, version: 1, status: 0 }
    const res = await saveTemplate(newTpl)
    if (res?.id) {
      template.value.id = res.id
      template.value.name = name
      template.value.code = code
    }
    saveAsDialog.value.visible = false
    ElMessage.success('另存为成功')
  } catch (e) {
    ElMessage.error('另存为失败')
  }
}

// ==================== 发布操作 ====================
async function handlePublishTemplate() {
  if (!template.value.id) {
    ElMessage.warning('请先保存模板')
    return
  }
  try {
    await ElMessageBox.confirm('发布后将不可修改，确定发布吗？', '发布确认', { type: 'warning' })
    publishing.value = true
    await publishTemplate(template.value.id)
    template.value.status = 1
    ElMessage.success('发布成功')
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('发布失败')
  } finally {
    publishing.value = false
  }
}

// ==================== 预览 ====================
function handlePreview() {
  if (!template.value.id) {
    ElMessage.warning('请先保存模板')
    return
  }
  window.open(`/preview/${template.value.id}`, '_blank')
}

// ==================== 导出/导入 ====================
function handleExportExcel() {
  ElMessage.info('导出功能开发中')
}

function handleImportExcel() {
  ElMessage.info('导入功能开发中')
}

function handleTemplateLibrary() {
  ElMessage.info('模板库功能开发中')
}

// ==================== 工具栏操作 ====================
function handleUndo() { ElMessage.info('撤销功能开发中') }
function handleRedo() { ElMessage.info('重做功能开发中') }
function handleCut() { ElMessage.info('剪切功能开发中') }
function handleCopy() { ElMessage.info('复制功能开发中') }
function handlePaste() { ElMessage.info('粘贴功能开发中') }
function handleFormatPainter() { ElMessage.info('格式刷功能开发中') }
function handleMergeCells() { ElMessage.info('合并单元格功能开发中') }
function handleSplitCells() { ElMessage.info('拆分单元格功能开发中') }
function freezeRows() { ElMessage.info('冻结行功能开发中') }
function freezeCols() { ElMessage.info('冻结列功能开发中') }
function handleConditionalFormat() { ElMessage.info('条件格式功能开发中') }
function cancelEdit() { ElMessage.info('取消编辑') }
function commitEditFromBar() { ElMessage.info('确认编辑') }
function insertFunction() { ElMessage.info('插入函数') }
function showHelp() { ElMessage.info('帮助文档开发中') }
function toggleFullscreen() { ElMessage.info('全屏功能开发中') }
function showPermissionDialog() { ElMessage.info('权限控制开发中') }
function showExtensionDialog() { ElMessage.info('扩展设置开发中') }
</script>

<style scoped>
.designer-app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: #f5f7fa;
}

.main-workspace {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.center-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* 弹窗表单样式 */
.tp-form { display: flex; flex-direction: column; gap: 16px; }
.tp-field { display: flex; flex-direction: column; gap: 6px; }
.tp-field label { font-size: 13px; font-weight: 500; color: #333; }
.tp-row { display: flex; gap: 12px; }
.tp-row .tp-field { flex: 1; }
</style>
