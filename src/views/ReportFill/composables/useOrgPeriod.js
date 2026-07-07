/**
 * useOrgPeriod - 组织和填报周期选择逻辑
 *
 * 从 ReportFill/index.vue 中提取的组织列表加载、周期生成、
 * 组织/周期变更处理等逻辑。
 */
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getOrgTree } from '@/api/org.js'
import { flattenOrgTree } from '@/utils/tree'

export function useOrgPeriod() {
  const route = useRoute()

  const selectedOrgId = ref('')
  const selectedPeriod = ref('')
  const orgList = ref([])
  const orgLoading = ref(false)

  const selectedOrgName = computed(() => {
    if (!selectedOrgId.value) return ''
    const org = orgList.value.find(o => o.id === selectedOrgId.value || String(o.id) === String(selectedOrgId.value))
    const name = org?.name ?? org?.orgName ?? ''
    return typeof name === 'string' ? name.trim() : ''
  })

  const selectedPeriodLabel = computed(() => {
    if (!selectedPeriod.value) return ''
    const period = periodList.value.find(p => p.value === selectedPeriod.value)
    return period ? period.label : ''
  })

  const periodList = computed(() => {
    const periods = []
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    for (let i = 0; i < 6; i++) {
      const m = month - i
      const actualMonth = ((m - 1) % 12 + 12) % 12 + 1
      const actualYear = m <= 0 ? year - 1 : year
      periods.push({
        value: `${actualYear}${String(actualMonth).padStart(2, '0')}`,
        label: `${actualYear}年${actualMonth}月`
      })
    }

    const currentQ = Math.ceil(month / 3)
    for (let i = 0; i < 4; i++) {
      const q = currentQ - i
      if (q > 0) {
        periods.push({ value: `${year}Q${q}`, label: `${year}年第${q}季度` })
      } else {
        periods.push({ value: `${year - 1}Q${q + 4}`, label: `${year - 1}年第${q + 4}季度` })
      }
    }

    return periods
  })

  async function loadOrgList() {
    if (orgLoading.value) return
    orgLoading.value = true

    try {
      const res = await getOrgTree()

      let treeData = []
      if (Array.isArray(res)) {
        treeData = res
      } else if (res && Array.isArray(res.data)) {
        treeData = res.data
      }

      // 归一化：后端 OrgVO 用 orgName，前端统一用 name 访问
      const rawList = flattenOrgTree(treeData)
      orgList.value = rawList.map(org => ({
        ...org,
        name: org.orgName ?? org.name ?? '',
      }))

      const routeOrgId = route.query.orgId
      const routePeriod = route.query.period

      if (routeOrgId) {
        selectedOrgId.value = routeOrgId
      } else {
        if (orgList.value.length > 0) {
          const firstSubsidiary = orgList.value.find(org => org.orgType === 2)
          if (firstSubsidiary) {
            selectedOrgId.value = firstSubsidiary.id
          } else {
            selectedOrgId.value = orgList.value[0].id
          }
        }
      }

      if (routePeriod) {
        selectedPeriod.value = routePeriod
      } else {
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth() + 1
        selectedPeriod.value = `${year}${String(month).padStart(2, '0')}`
      }
    } catch {
      orgList.value = [{ id: '0', orgName: '默认组织', name: '默认组织' }]
    } finally {
      orgLoading.value = false
    }
  }

  return {
    selectedOrgId,
    selectedPeriod,
    orgList,
    orgLoading,
    selectedOrgName,
    selectedPeriodLabel,
    periodList,
    loadOrgList
  }
}
