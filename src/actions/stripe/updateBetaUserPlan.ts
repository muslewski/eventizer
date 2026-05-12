'use server'

import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'
import { syncUserFromPlan } from '@/lib/subscriptions/syncUserFromPlan'
import { draftOffersOnDowngrade } from '@/lib/subscriptions/draftOffersOnDowngrade'
import { revalidatePath } from 'next/cache'
import type { SubscriptionPlan } from '@/payload-types'

async function getAuthenticatedUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

export type UpdateBetaUserPlanResult =
  | { success: true; data: { changeType: 'beta_update' } }
  | { success: false; error: 'UNAUTHORIZED' | 'PLAN_NOT_FOUND' | 'NOT_BETA'; message: string }

export async function updateBetaUserPlan({
  newPlanId,
  categoryNames,
  categorySlugs,
}: {
  newPlanId: number
  categoryNames?: string[]
  categorySlugs?: string[]
}): Promise<UpdateBetaUserPlanResult> {
  const sessionUser = await getAuthenticatedUser()
  const payload = await getPayload({ config })
  const user = await payload.findByID({ collection: 'users', id: Number(sessionUser.id), depth: 0 })

  if (!user.betaAccess) {
    return { success: false, error: 'NOT_BETA', message: 'Ta akcja jest dostępna tylko dla użytkowników beta.' }
  }

  const newPlan = (await payload.findByID({
    collection: 'subscription-plans',
    id: newPlanId,
    depth: 0,
  })) as SubscriptionPlan | null
  if (!newPlan) {
    return { success: false, error: 'PLAN_NOT_FOUND', message: 'Nie znaleziono planu.' }
  }

  // Beta loophole fix: if downsizing, run drafting BEFORE syncing fields
  const newMax = newPlan.maxOffers ?? 1
  const currentMax = user.maxOffers ?? 1
  if (newMax < currentMax) {
    await draftOffersOnDowngrade({
      payload,
      userId: user.id,
      newPlan: { level: newPlan.level ?? 0, maxOffers: newMax, slug: newPlan.slug ?? undefined },
    })
  }

  await syncUserFromPlan({ payload, userId: user.id, newPlan, categoryNames, categorySlugs })

  revalidatePath('/panel/plan-subskrypcji')
  revalidatePath('/panel/oferty')

  return { success: true, data: { changeType: 'beta_update' } }
}
