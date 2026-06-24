/**
 * PermissionEngine - 权限引擎
 *
 * 角色体系：
 *   filler   - 填报员：可编辑、可提交、不可审核、不可查看公式
 *   reviewer - 审核员：不可编辑、可审核、可查看公式
 *   admin    - 管理员：全部权限
 *   viewer   - 查看者：只读，可查看公式
 *
 * 功能：
 *   1. 根据角色+模板配置决定单元格读写权限
 *   2. 控制操作按钮可见性（提交/审核/退回）
 *   3. 控制列的显示/隐藏（敏感数据列）
 */

export class PermissionEngine {
  constructor({ template = null, currentRole = 'filler', currentUserId = '' } = {}) {
    this.template = template
    this.currentRole = currentRole
    this.currentUserId = currentUserId

    // 基础权限定义
    this.basePermissions = {
      filler: { canEdit: true, canSubmit: true, canApprove: false, canViewFormula: false, canExport: true },
      reviewer: { canEdit: false, canSubmit: false, canApprove: true, canViewFormula: true, canExport: true },
      admin: { canEdit: true, canSubmit: true, canApprove: true, canViewFormula: true, canExport: true, canDesign: true },
      viewer: { canEdit: false, canSubmit: false, canApprove: false, canViewFormula: true, canExport: false }
    }
  }

  /** 设置当前用户角色 */
  setRole(role) {
    if (this.basePermissions[role]) {
      this.currentRole = role
    }
  }

  /** 设置当前模板 */
  setTemplate(template) {
    this.template = template
  }

  /** 获取完整权限对象 */
  getPermissions() {
    // 模板级权限覆盖基础权限
    const templatePerms = this.template?.permissions?.roles?.[this.currentRole]
    const base = { ...this.basePermissions[this.currentRole] || this.basePermissions.viewer }

    if (templatePerms) {
      return { ...base, ...templatePerms }
    }
    return base
  }

  /** 检查是否有某项权限 */
  hasPermission(perm) {
    return !!this.getPermissions()[perm]
  }

  /** 判断单元格是否可编辑 */
  canEditCell(rowIdx, colIdx, cell) {
    const perms = this.getPermissions()
    if (!perms.canEdit) return false

    // 模板级列权限控制
    const templatePerms = this.template?.permissions?.roles?.[this.currentRole]
    if (templatePerms?.readOnlyColumns?.length) {
      const colId = this._getColId(colIdx)
      if (templatePerms.readOnlyColumns.includes(colId)) return false
    }
    if (templatePerms?.editableColumns?.length) {
      const colId = this._getColId(colIdx)
      if (!templatePerms.editableColumns.includes(colId)) return false
    }

    // 公式/汇总单元格始终只读
    if (cell?.readOnly || cell?.f) return false

    return true
  }

  /** 获取操作按钮状态 */
  getActionStates() {
    const perms = this.getPermissions()
    return {
      canSave: perms.canEdit,
      canSubmit: perms.canSubmit,
      canApprove: perms.canApprove,
      canReturn: perms.canApprove,
      canExport: perms.canExport !== false,
      canDesign: perms.canDesign || false,
      canViewFormula: perms.canViewFormula
    }
  }

  /** 过滤可见列 */
  filterVisibleColumns(columns) {
    const perms = this.getPermissions()

    // 如果有模板级列过滤，应用它
    const templatePerms = this.template?.permissions?.roles?.[this.currentRole]

    if (templatePerms?.hiddenColumns?.length) {
      const hiddenSet = new Set(templatePerms.hiddenColumns)
      return columns.filter(c => !hiddenSet.has(c.id))
    }

    return columns
  }

  _getColId(colIdx) {
    // 简化实现：根据索引返回虚拟ID
    return `col_${colIdx}`
  }
}
