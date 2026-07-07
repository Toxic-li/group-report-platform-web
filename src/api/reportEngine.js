/**
 * 数据源 + 公式 + 条件格式 + 校验规则 API
 * 后端: DataSourceController / ReportFormulaController / ReportConditionalFormatController / ReportValidatorController
 */
import { get, post, put, del } from '@/utils/http'

// ==================== 数据源 ====================

export function getDataSources() { return get('/report-designer/data-sources') }
export function getDataSource(id) { return get(`/report-designer/data-sources/${id}`) }
export function createDataSource(data) { return post('/report-designer/data-sources', data) }
export function updateDataSource(id, data) { return put(`/report-designer/data-sources/${id}`, data) }
export function deleteDataSource(id) { return del(`/report-designer/data-sources/${id}`) }
export function testDataSourceConnection(id) { return post(`/report-designer/data-sources/${id}/test-connection`) }
export function executeDataSourceQuery(id, query) { return post(`/report-designer/data-sources/${id}/query`, { query }) }

// ==================== 公式 ====================

export function getFormulasByTemplate(templateId) { return get(`/report-designer/formulas/template/${templateId}`) }
export function getFormula(id) { return get(`/report-designer/formulas/${id}`) }
export function createFormula(data) { return post('/report-designer/formulas', data) }
export function updateFormula(id, data) { return put(`/report-designer/formulas/${id}`, data) }
export function deleteFormula(id) { return del(`/report-designer/formulas/${id}`) }
export function batchCalcFormulas(data) { return post('/report-designer/formulas/calc/batch', data) }
export function calcSingleFormula(formulaId, cellData) { return post(`/report-designer/formulas/calc/${formulaId}`, { cellData }) }

// ==================== 条件格式 ====================

export function getConditionalFormatsByTemplate(templateId) { return get(`/report-designer/conditional-formats/template/${templateId}`) }
export function getConditionalFormat(id) { return get(`/report-designer/conditional-formats/${id}`) }
export function createConditionalFormat(data) { return post('/report-designer/conditional-formats', data) }
export function updateConditionalFormat(id, data) { return put(`/report-designer/conditional-formats/${id}`, data) }
export function deleteConditionalFormat(id) { return del(`/report-designer/conditional-formats/${id}`) }
export function evaluateConditionalFormats(data) { return post('/report-designer/conditional-formats/evaluate', data) }

// ==================== 校验规则 ====================

export function getValidatorsByTemplate(templateId) { return get(`/report-designer/validators/template/${templateId}`) }
export function getValidator(id) { return get(`/report-designer/validators/${id}`) }
export function createValidator(data) { return post('/report-designer/validators', data) }
export function updateValidator(id, data) { return put(`/report-designer/validators/${id}`, data) }
export function deleteValidator(id) { return del(`/report-designer/validators/${id}`) }
export function executeValidators(data) { return post('/report-designer/validators/validate', data) }
