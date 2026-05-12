import type { Payload } from 'payload'
import type { SubscriptionPlan } from '@/payload-types'

interface SyncUserFromPlanInput {
  payload: Payload
  userId: number
  newPlan: SubscriptionPlan
  categoryNames?: string[]
  categorySlugs?: string[]
  preserveCategoryIfSingle?: boolean
}

export async function syncUserFromPlan({
  payload,
  userId,
  newPlan,
  categoryNames,
  categorySlugs,
  preserveCategoryIfSingle = false,
}: SyncUserFromPlanInput): Promise<void> {
  const data: Record<string, unknown> = { maxOffers: newPlan.maxOffers ?? 1 }

  const isMultiOrAgency = (newPlan.maxOffers ?? 1) > 1
  const hasMetadata = (categoryNames?.length ?? 0) > 0

  if (isMultiOrAgency) {
    data.serviceCategory = null
    data.serviceCategorySlug = null
  } else if (hasMetadata) {
    data.serviceCategory = categoryNames!.join(' > ')
    data.serviceCategorySlug = categorySlugs!.join('/')
  } else if (preserveCategoryIfSingle) {
    // do nothing
  }

  await payload.update({ collection: 'users', id: userId, data })
}
