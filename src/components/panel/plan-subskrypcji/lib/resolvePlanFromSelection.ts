import type { ServiceCategory, SubscriptionPlan } from '@/payload-types'

export function resolvePlanFromSelection({
  kind,
  categoryPath,
  tierSlug,
  categories,
  plansBySlug,
}: {
  kind?: 'single' | 'multi'
  categoryPath?: string
  tierSlug?: 'multi' | 'agency'
  categories: ServiceCategory[]
  plansBySlug: Map<string, SubscriptionPlan>
}): SubscriptionPlan | null {
  if (!kind) return null
  if (kind === 'multi') {
    if (!tierSlug) return null
    return plansBySlug.get(tierSlug) ?? null
  }
  if (!categoryPath) return null
  return walkForRequiredPlan(categories, categoryPath)
}

function walkForRequiredPlan(categories: ServiceCategory[], path: string): SubscriptionPlan | null {
  const parts = path.split('/')
  let level: any[] = categories
  let bestPlan: SubscriptionPlan | null = null
  for (const slug of parts) {
    const node = level.find((c: any) => c.slug === slug)
    if (!node) break
    if (node.requiredPlan && typeof node.requiredPlan === 'object') {
      bestPlan = node.requiredPlan as SubscriptionPlan
    }
    level = (node.subcategory_level_2 ?? node.subcategory_level_1 ?? [])
  }
  return bestPlan
}
