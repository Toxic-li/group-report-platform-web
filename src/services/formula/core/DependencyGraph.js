/**
 * Formula System - 依赖图（Dependency Graph）
 * 
 * 管理公式之间的依赖关系，支持：
 * - DAG（有向无环图）构建
 * - 拓扑排序
 * - 循环依赖检测
 * - 影响分析
 * - 依赖树可视化
 */

import { FormulaError, ErrorType, Severity } from './FormulaTypes.js'

/**
 * DependencyGraph - 依赖图
 */
export class DependencyGraph {
  constructor() {
    // 公式节点Map：formulaId -> FormulaNode
    this.nodes = new Map()
    
    // 边Map：formulaId -> Set<依赖的formulaId>
    this.edges = new Map()
    
    // 反向边Map：formulaId -> Set<依赖于此的formulaId>
    this.reverseEdges = new Map()
    
    // 拓扑排序结果
    this.topologicalOrder = []
    
    // 循环依赖检测结果
    this.cycles = []
  }
  
  /**
   * 添加公式节点
   */
  addNode(formulaId, formulaData) {
    this.nodes.set(formulaId, {
      id: formulaId,
      formula: formulaData,
      dependencies: new Set(),
      dependents: new Set()
    })
    
    return this
  }
  
  /**
   * 批量添加公式节点
   */
  addNodes(formulaMap) {
    for (const [formulaId, formulaData] of Object.entries(formulaMap)) {
      this.addNode(formulaId, formulaData)
    }
    
    return this
  }
  
  /**
   * 添加依赖边
   */
  addEdge(fromId, toId) {
    // 确保两个节点都存在
    if (!this.nodes.has(fromId)) {
      this.addNode(fromId, { id: fromId })
    }
    
    if (!this.nodes.has(toId)) {
      this.addNode(toId, { id: toId })
    }
    
    // 添加正向边（from依赖to）
    if (!this.edges.has(fromId)) {
      this.edges.set(fromId, new Set())
    }
    this.edges.get(fromId).add(toId)
    
    // 添加反向边（to被from依赖）
    if (!this.reverseEdges.has(toId)) {
      this.reverseEdges.set(toId, new Set())
    }
    this.reverseEdges.get(toId).add(fromId)
    
    // 更新节点信息
    this.nodes.get(fromId).dependencies.add(toId)
    this.nodes.get(toId).dependents.add(fromId)
    
    return this
  }
  
  /**
   * 批量添加依赖边
   */
  addEdges(edgesArray) {
    for (const [fromId, toId] of edgesArray) {
      this.addEdge(fromId, toId)
    }
    
    return this
  }
  
  /**
   * 从公式定义构建依赖图
   */
  buildFromFormulas(formulas) {
    // 清空现有图
    this.clear()
    
    // 添加所有公式节点
    for (const formula of formulas) {
      this.addNode(formula.id, formula)
    }
    
    // 添加依赖边
    for (const formula of formulas) {
      if (formula.dependencies && formula.dependencies.length > 0) {
        for (const depId of formula.dependencies) {
          this.addEdge(formula.id, depId)
        }
      }
    }
    
    // 执行拓扑排序
    this.topologicalSort()
    
    // 检测循环依赖
    this.detectCycles()
    
    return this
  }
  
  /**
   * 清空图
   */
  clear() {
    this.nodes.clear()
    this.edges.clear()
    this.reverseEdges.clear()
    this.topologicalOrder = []
    this.cycles = []
    
    return this
  }
  
  /**
   * 拓扑排序（DFS算法）
   */
  topologicalSort() {
    const visited = new Set()
    const visiting = new Set()
    const order = []
    
    // DFS遍历
    const visit = (nodeId) => {
      if (visited.has(nodeId)) return
      if (visiting.has(nodeId)) {
        // 发现循环，跳过
        return
      }
      
      visiting.add(nodeId)
      
      // 先访问依赖的节点
      const deps = this.edges.get(nodeId)
      if (deps) {
        for (const depId of deps) {
          visit(depId)
        }
      }
      
      visiting.delete(nodeId)
      visited.add(nodeId)
      
      // 添加到排序结果
      order.push(nodeId)
    }
    
    // 遍历所有节点
    for (const nodeId of this.nodes.keys()) {
      visit(nodeId)
    }
    
    this.topologicalOrder = order
    
    return order
  }
  
  /**
   * 检测循环依赖
   */
  detectCycles() {
    this.cycles = []
    
    const visited = new Set()
    const recursionStack = new Set()
    const path = []
    
    // DFS检测
    const detect = (nodeId) => {
      if (recursionStack.has(nodeId)) {
        // 发现循环，记录循环路径
        const cycleStart = path.indexOf(nodeId)
        const cycle = path.slice(cycleStart)
        this.cycles.push(cycle)
        return true
      }
      
      if (visited.has(nodeId)) return false
      
      visited.add(nodeId)
      recursionStack.add(nodeId)
      path.push(nodeId)
      
      const deps = this.edges.get(nodeId)
      if (deps) {
        for (const depId of deps) {
          if (detect(depId)) {
            return true
          }
        }
      }
      
      recursionStack.delete(nodeId)
      path.pop()
      
      return false
    }
    
    // 检查所有节点
    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        detect(nodeId)
      }
    }
    
    return this.cycles
  }
  
  /**
   * 检查是否有循环依赖
   */
  hasCycles() {
    return this.cycles.length > 0
  }
  
  /**
   * 获取节点的所有依赖（递归）
   */
  getAllDependencies(nodeId) {
    const allDeps = new Set()
    const queue = [nodeId]
    
    while (queue.length > 0) {
      const current = queue.shift()
      
      const deps = this.edges.get(current)
      if (deps) {
        for (const depId of deps) {
          if (!allDeps.has(depId)) {
            allDeps.add(depId)
            queue.push(depId)
          }
        }
      }
    }
    
    return [...allDeps]
  }
  
  /**
   * 获取依赖于此节点的所有节点（递归）
   */
  getAllDependents(nodeId) {
    const allDependents = new Set()
    const queue = [nodeId]
    
    while (queue.length > 0) {
      const current = queue.shift()
      
      const dependents = this.reverseEdges.get(current)
      if (dependents) {
        for (const depId of dependents) {
          if (!allDependents.has(depId)) {
            allDependents.add(depId)
            queue.push(depId)
          }
        }
      }
    }
    
    return [...allDependents]
  }
  
  /**
   * 获取直接依赖
   */
  getDirectDependencies(nodeId) {
    const deps = this.edges.get(nodeId)
    return deps ? [...deps] : []
  }
  
  /**
   * 获取直接依赖于此的节点
   */
  getDirectDependents(nodeId) {
    const dependents = this.reverseEdges.get(nodeId)
    return dependents ? [...dependents] : []
  }
  
  /**
   * 影响分析：修改某节点后会影响哪些节点
   */
  analyzeImpact(nodeId) {
    return {
      nodeId: nodeId,
      formula: this.nodes.get(nodeId)?.formula,
      directDependents: this.getDirectDependents(nodeId),
      allDependents: this.getAllDependents(nodeId),
      affectedCount: this.getAllDependents(nodeId).length
    }
  }
  
  /**
   * 依赖分析：某节点依赖哪些节点
   */
  analyzeDependencies(nodeId) {
    return {
      nodeId: nodeId,
      formula: this.nodes.get(nodeId)?.formula,
      directDependencies: this.getDirectDependencies(nodeId),
      allDependencies: this.getAllDependencies(nodeId),
      dependencyDepth: this.getAllDependencies(nodeId).length
    }
  }
  
  /**
   * 获取依赖树（可视化）
   */
  getDependencyTree(nodeId, depth = 0, visited = new Set()) {
    if (visited.has(nodeId)) {
      return {
        id: nodeId,
        circular: true,
        depth: depth
      }
    }
    
    visited.add(nodeId)
    
    const node = this.nodes.get(nodeId)
    const deps = this.getDirectDependencies(nodeId)
    
    const tree = {
      id: nodeId,
      name: node?.formula?.name || nodeId,
      code: node?.formula?.code || nodeId,
      depth: depth,
      children: []
    }
    
    for (const depId of deps) {
      tree.children.push(this.getDependencyTree(depId, depth + 1, visited))
    }
    
    visited.delete(nodeId)
    
    return tree
  }
  
  /**
   * 获取反向依赖树（影响树）
   */
  getImpactTree(nodeId, depth = 0, visited = new Set()) {
    if (visited.has(nodeId)) {
      return {
        id: nodeId,
        circular: true,
        depth: depth
      }
    }
    
    visited.add(nodeId)
    
    const node = this.nodes.get(nodeId)
    const dependents = this.getDirectDependents(nodeId)
    
    const tree = {
      id: nodeId,
      name: node?.formula?.name || nodeId,
      code: node?.formula?.code || nodeId,
      depth: depth,
      children: []
    }
    
    for (const depId of dependents) {
      tree.children.push(this.getImpactTree(depId, depth + 1, visited))
    }
    
    visited.delete(nodeId)
    
    return tree
  }
  
  /**
   * 获取计算顺序（拓扑排序）
   */
  getCalculationOrder() {
    return this.topologicalOrder
  }
  
  /**
   * 获取节点信息
   */
  getNode(nodeId) {
    return this.nodes.get(nodeId)
  }
  
  /**
   * 获取所有节点
   */
  getAllNodes() {
    return [...this.nodes.values()]
  }
  
  /**
   * 获取节点数量
   */
  getNodeCount() {
    return this.nodes.size
  }
  
  /**
   * 获取边数量
   */
  getEdgeCount() {
    let count = 0
    for (const edges of this.edges.values()) {
      count += edges.size
    }
    return count
  }
  
  /**
   * 检查节点是否存在
   */
  hasNode(nodeId) {
    return this.nodes.has(nodeId)
  }
  
  /**
   * 检查边是否存在
   */
  hasEdge(fromId, toId) {
    const edges = this.edges.get(fromId)
    return edges ? edges.has(toId) : false
  }
  
  /**
   * 删除节点
   */
  removeNode(nodeId) {
    if (!this.nodes.has(nodeId)) return this
    
    // 删除所有相关的边
    const deps = this.edges.get(nodeId)
    if (deps) {
      for (const depId of deps) {
        const reverseEdges = this.reverseEdges.get(depId)
        if (reverseEdges) {
          reverseEdges.delete(nodeId)
        }
      }
    }
    
    const dependents = this.reverseEdges.get(nodeId)
    if (dependents) {
      for (const depId of dependents) {
        const edges = this.edges.get(depId)
        if (edges) {
          edges.delete(nodeId)
        }
      }
    }
    
    // 删除节点
    this.nodes.delete(nodeId)
    this.edges.delete(nodeId)
    this.reverseEdges.delete(nodeId)
    
    // 更新拓扑排序
    this.topologicalOrder = this.topologicalOrder.filter(id => id !== nodeId)
    
    return this
  }
  
  /**
   * 删除边
   */
  removeEdge(fromId, toId) {
    const edges = this.edges.get(fromId)
    if (edges) {
      edges.delete(toId)
    }
    
    const reverseEdges = this.reverseEdges.get(toId)
    if (reverseEdges) {
      reverseEdges.delete(fromId)
    }
    
    // 更新节点信息
    const fromNode = this.nodes.get(fromId)
    if (fromNode) {
      fromNode.dependencies.delete(toId)
    }
    
    const toNode = this.nodes.get(toId)
    if (toNode) {
      toNode.dependents.delete(fromId)
    }
    
    return this
  }
  
  /**
   * 转换为JSON
   */
  toJSON() {
    const nodes = []
    const edges = []
    
    for (const [nodeId, node] of this.nodes) {
      nodes.push({
        id: nodeId,
        formula: node.formula,
        dependencies: [...node.dependencies],
        dependents: [...node.dependents]
      })
    }
    
    for (const [fromId, deps] of this.edges) {
      for (const toId of deps) {
        edges.push([fromId, toId])
      }
    }
    
    return {
      nodes: nodes,
      edges: edges,
      topologicalOrder: this.topologicalOrder,
      cycles: this.cycles
    }
  }
  
  /**
   * 从JSON恢复
   */
  static fromJSON(json) {
    const graph = new DependencyGraph()
    
    if (json.nodes) {
      for (const node of json.nodes) {
        graph.addNode(node.id, node.formula)
      }
    }
    
    if (json.edges) {
      for (const [fromId, toId] of json.edges) {
        graph.addEdge(fromId, toId)
      }
    }
    
    graph.topologicalOrder = json.topologicalOrder || []
    graph.cycles = json.cycles || []
    
    return graph
  }
}

/**
 * FormulaDependencyAnalyzer - 公式依赖分析器
 */
export class FormulaDependencyAnalyzer {
  constructor() {
    this.graph = new DependencyGraph()
  }
  
  /**
   * 分析公式依赖关系
   */
  analyze(formulas) {
    this.graph.buildFromFormulas(formulas)
    
    return {
      graph: this.graph,
      hasCycles: this.graph.hasCycles(),
      cycles: this.graph.cycles,
      calculationOrder: this.graph.getCalculationOrder(),
      summary: {
        totalFormulas: this.graph.getNodeCount(),
        totalDependencies: this.graph.getEdgeCount(),
        cycleCount: this.graph.cycles.length
      }
    }
  }
  
  /**
   * 获取公式的影响范围
   */
  getImpact(formulaId) {
    return this.graph.analyzeImpact(formulaId)
  }
  
  /**
   * 获取公式的依赖关系
   */
  getDependencies(formulaId) {
    return this.graph.analyzeDependencies(formulaId)
  }
  
  /**
   * 获取依赖树
   */
  getDependencyTree(formulaId) {
    return this.graph.getDependencyTree(formulaId)
  }
  
  /**
   * 获取影响树
   */
  getImpactTree(formulaId) {
    return this.graph.getImpactTree(formulaId)
  }
}

/**
 * createDependencyGraph - 创建依赖图实例
 */
export function createDependencyGraph() {
  return new DependencyGraph()
}

/**
 * analyzeDependencies - 简单函数式接口
 */
export function analyzeDependencies(formulas) {
  const analyzer = new FormulaDependencyAnalyzer()
  return analyzer.analyze(formulas)
}