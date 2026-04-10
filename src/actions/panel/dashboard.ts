'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { getCurrentSubscriptionDetails } from '@/actions/stripe/getCurrentSubscriptionDetails'

export async function getDashboardStats(userId: number, role: string) {
  try {
    const payload = await getPayload({ config })

    if (role === 'service-provider' || role === 'admin' || role === 'moderator') {
      const [offersResult, formsResult, subscription] = await Promise.all([
        payload.find({
          collection: 'offers',
          where: {
            user: { equals: userId },
          },
          depth: 0,
          draft: true,
          overrideAccess: true,
          limit: 0,
        }),
        payload.find({
          collection: 'submitted-forms',
          where: {
            provider: { equals: userId },
            status: { equals: 'new' },
          },
          depth: 0,
          overrideAccess: true,
          limit: 0,
        }),
        getCurrentSubscriptionDetails(userId),
      ])

      // Count published vs draft by fetching all and filtering
      const allOffers = await payload.find({
        collection: 'offers',
        where: {
          user: { equals: userId },
        },
        depth: 0,
        draft: true,
        overrideAccess: true,
        limit: 100,
        select: { _status: true } as any,
      })

      const publishedCount = allOffers.docs.filter((o) => o._status === 'published').length
      const draftCount = allOffers.docs.filter((o) => o._status === 'draft').length

      return {
        success: true as const,
        data: {
          role: 'service-provider' as const,
          offers: {
            total: offersResult.totalDocs,
            published: publishedCount,
            draft: draftCount,
          },
          newFormsCount: formsResult.totalDocs,
          subscription,
        },
      }
    }

    // Client role
    const [ticketsResult, userRecord] = await Promise.all([
      payload.find({
        collection: 'help-tickets',
        where: {
          user: { equals: userId },
          isSolved: { equals: false },
        },
        depth: 0,
        overrideAccess: true,
        limit: 0,
      }),
      payload.findByID({
        collection: 'users',
        id: userId,
        depth: 0,
        overrideAccess: true,
      }),
    ])

    const favorites = userRecord?.favorites ?? []
    const favoritesCount = Array.isArray(favorites) ? favorites.length : 0

    return {
      success: true as const,
      data: {
        role: 'client' as const,
        openTickets: ticketsResult.totalDocs,
        favoritesCount,
      },
    }
  } catch (err) {
    console.error('[getDashboardStats]', err)
    return { success: false as const, error: 'Nie udało się pobrać danych dashboardu' }
  }
}
