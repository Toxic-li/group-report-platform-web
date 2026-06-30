<!--
  Formula Designer 测试示例
  用于验证改进后的可用性功能（弹出报表选择单元格）
-->

<template>
  <div class="test-page">
    <h2>公式设计器可用性改进测试 - 弹出报表选择单元格</h2>
    
    <!-- ✅ 测试场景：弹出报表选择单元格 -->
    <div class="test-section">
      <h3>核心交互流程测试</h3>
      <div class="test-tips">
        <div class="tip-item">
          <span class="tip-label">✅ 流程1：目标单元格选择</span>
          <span class="tip-desc">点击"添加目标单元格"按钮 → 弹出报表 → 点击单元格 → 自动关闭</span>
        </div>
        <div class="tip-item">
          <span class="tip-label">✅ 流程2：函数+多选单元格</span>
          <span class="tip-desc">点击sum/avg等函数 → 自动弹出报表 → 框选多个单元格 → 手动点击"确认" → 自动插入sum(A3:D3)</span>
        </div>
        <div class="tip-item">
          <span class="tip-label">💡 操作技巧</span>
          <span class="tip-desc">
            - 框选：鼠标拖拽选择连续单元格（生成范围引用 A3:D3）<br/>
            - Ctrl+点击：按住Ctrl键点击多个不连续单元格（生成逗号分隔 A3,C3,E3）
          </span>
        </div>
      </div>
      
      <FormulaDesigner
        :indicators="mockIndicators"
        :template="mockTemplate"
        @save="handleSaveFormula"
      />
    </div>
    
    <!-- ✅ 测试结果展示 -->
    <div class="test-result">
      <h3>测试结果</h3>
      <div v-if="testFormula" class="result-item">
        <span class="result-label">保存的公式：</span>
        <pre class="result-code">{{ JSON.stringify(testFormula, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import FormulaDesigner from './FormulaDesigner.vue'

export default {
  name: 'TestFormulaDesigner',
  components: {
    FormulaDesigner
  },
  
  setup() {
    const testFormula = ref(null)
    
    // ✅ 模拟指标数据
    const mockIndicators = [
      { id: 'ind_001', name: '营业收入', code: 'income', type: 'metric', category: 'basic' },
      { id: 'ind_002', name: '营业成本', code: 'cost', type: 'metric', category: 'basic' },
      { id: 'ind_003', name: '利润总额', code: 'profit', type: 'formula', category: 'calculated' }
    ]
    
    // ✅ 模拟报表模板数据（树状结构）
    const mockTemplate = {
      id: 'tpl_001',
      name: '利润表',
      rowTree: [
        {
          id: 'row_001',
          label: '2024年',
          name: 'Year_2024',
          fieldName: 'year_2024',
          children: [
            {
              id: 'row_001_01',
              label: '第一季度',
              name: 'Q1',
              fieldName: 'quarter_1',
              dataType: 'number',
              children: []
            },
            {
              id: 'row_001_02',
              label: '第二季度',
              name: 'Q2',
              fieldName: 'quarter_2',
              dataType: 'number',
              children: []
            },
            {
              id: 'row_001_03',
              label: '第三季度',
              name: 'Q3',
              fieldName: 'quarter_3',
              dataType: 'number',
              children: []
            },
            {
              id: 'row_001_04',
              label: '第四季度',
              name: 'Q4',
              fieldName: 'quarter_4',
              dataType: 'number',
              children: []
            }
          ]
        },
        {
          id: 'row_002',
          label: '2023年',
          name: 'Year_2023',
          fieldName: 'year_2023',
          dataType: 'number',
          children: []
        }
      ],
      columnTree: [
        {
          id: 'col_001',
          label: '营业收入',
          name: 'Income',
          fieldName: 'income',
          dataType: 'number',
          children: []
        },
        {
          id: 'col_002',
          label: '营业成本',
          name: 'Cost',
          fieldName: 'cost',
          dataType: 'number',
          children: []
        },
        {
          id: 'col_003',
          label: '利润总额',
          name: 'Profit',
          fieldName: 'profit',
          dataType: 'number',
          children: []
        },
        {
          id: 'col_004',
          label: '利润率',
          name: 'ProfitRate',
          fieldName: 'profit_rate',
          dataType: 'number',
          children: []
        }
      ]
    }
    
    // ✅ 处理公式保存事件
    function handleSaveFormula(formula) {
      console.log('✅ 测试公式保存:', formula)
      testFormula.value = formula
    }
    
    return {
      mockIndicators,
      mockTemplate,
      testFormula,
      handleSaveFormula
    }
  }
}
</script>

<style scoped>
.test-page {
  padding: 40px;
  background: #f5f5f5;
}

.test-page h2 {
  margin-bottom: 30px;
  color: #1e40af;
  font-size: 24px;
  text-align: center;
}

.test-section {
  margin-bottom: 40px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.test-section h3 {
  margin-bottom: 20px;
  color: #059669;
  font-size: 18px;
}

.test-tips {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: #FEF3C7;
  border-radius: 6px;
  border: 1px solid #FCD34D;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
}

.tip-label {
  font-weight: 600;
  color: #92400E;
  min-width: 140px;
}

.tip-desc {
  color: #78350F;
}

.test-result {
  padding: 20px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.test-result h3 {
  margin-bottom: 16px;
  color: #1e40af;
  font-size: 16px;
}

.result-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-label {
  font-weight: 600;
  color: #059669;
}

.result-code {
  background: #f3f4f6;
  padding: 12px;
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  overflow-x: auto;
}
</style>