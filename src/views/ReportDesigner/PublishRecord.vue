<template>
  <div class="publish-record">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">发布记录</h1>
        <p class="page-desc">查看报表模板的发布历史记录</p>
      </div>
    </div>

    <div class="content-card">
      <div class="filter-bar">
        <el-input v-model="filterKeyword" placeholder="搜索模板名称" class="search-input">
          <template #prefix>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </template>
        </el-input>
        <el-select v-model="filterStatus" placeholder="发布状态" style="width: 120px">
          <el-option label="全部" value=""/>
          <el-option label="成功" value="success"/>
          <el-option label="失败" value="failed"/>
          <el-option label="进行中" value="processing"/>
        </el-select>
        <el-date-picker v-model="filterDate" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 280px"/>
      </div>

      <el-table :data="filteredRecords" border style="width: 100%">
        <el-table-column prop="templateName" label="模板名称" width="200" />
        <el-table-column prop="version" label="版本号" width="100">
          <template #default="{ row }">
            <span class="version-tag">v{{ row.version }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="发布状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="publishBy" label="发布人" width="100" />
        <el-table-column prop="publishTime" label="发布时间" width="160" />
        <el-table-column prop="description" label="发布说明" min-width="200" />
        <el-table-column prop="target" label="发布目标" width="120">
          <template #default="{ row }">
            <span :class="['target-tag', `target-${row.target}`]">{{ getTargetText(row.target) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" @click="handleView(row)">查看详情</el-button>
            <el-button text size="small" @click="handleRollback(row)" v-if="row.status === 'success'">回滚</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const filterKeyword = ref('')
const filterStatus = ref('')
const filterDate = ref('')

const records = ref([
  { id: 1, templateName: '月度销售报表', version: '1.2.0', status: 'success', publishBy: '张三', publishTime: '2024-01-15 14:30', description: '新增季度汇总功能', target: 'prod' },
  { id: 2, templateName: '财务费用报表', version: '1.1.0', status: 'success', publishBy: '李四', publishTime: '2024-01-14 16:00', description: '优化数据计算逻辑', target: 'prod' },
  { id: 3, templateName: '人事考勤报表', version: '1.0.5', status: 'failed', publishBy: '王五', publishTime: '2024-01-13 10:00', description: '修复考勤统计错误', target: 'prod' },
  { id: 4, templateName: '生产产量报表', version: '1.0.3', status: 'processing', publishBy: '赵六', publishTime: '2024-01-12 09:00', description: '新增产量趋势图表', target: 'dev' },
  { id: 5, templateName: '月度销售报表', version: '1.1.5', status: 'success', publishBy: '张三', publishTime: '2024-01-10 11:30', description: '修复数据导出问题', target: 'prod' },
  { id: 6, templateName: '预算执行报表', version: '1.0.2', status: 'success', publishBy: '李四', publishTime: '2024-01-08 14:00', description: '新增预算对比分析', target: 'prod' }
])

const filteredRecords = computed(() => {
  return records.value.filter(r => {
    const matchKeyword = !filterKeyword.value || r.templateName.includes(filterKeyword.value)
    const matchStatus = !filterStatus.value || r.status === filterStatus.value
    const matchDate = !filterDate.value || filterDate.value.length < 2 || (
      r.publishTime >= filterDate.value[0] && r.publishTime <= filterDate.value[1]
    )
    return matchKeyword && matchStatus && matchDate
  })
})

function getStatusTagType(status) {
  const types = {
    success: 'success',
    failed: 'danger',
    processing: 'warning'
  }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = {
    success: '成功',
    failed: '失败',
    processing: '进行中'
  }
  return texts[status] || status
}

function getTargetText(target) {
  const texts = {
    prod: '生产环境',
    dev: '开发环境',
    test: '测试环境'
  }
  return texts[target] || target
}

function handleView(row) {
  console.log('查看详情:', row)
}

function handleRollback(row) {
  console.log('回滚:', row)
}
</script>

<style scoped>
.publish-record {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left {
  .page-title {
    font-size: 20px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
  }
  .page-desc {
    font-size: 14px;
    color: #666;
    margin: 4px 0 0;
  }
}

.content-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-input {
  width: 280px;
}

.version-tag {
  background: #e6f7ff;
  color: #1890ff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.target-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;

  &.target-prod {
    background: #fff1f0;
    color: #ff4d4f;
  }
  &.target-dev {
    background: #f6ffed;
    color: #52c41a;
  }
  &.target-test {
    background: #fff7e6;
    color: #fa8c16;
  }
}
</style>
