import { isClientRoleEqualOrHigher } from '@/access/utilities'
import { redirect } from 'next/navigation'
import type { CollectionBeforeOperationHook } from 'payload'

export const MAX_OFFERS_PER_USER = 1

export const enforceMaxOffers: CollectionBeforeOperationHook = async ({ operation, req }) => {
  // Enforce max offers per user
  if (operation === 'create' && req.user && !isClientRoleEqualOrHigher('moderator', req.user)) {
    // Use the user's personal maxOffers limit, falling back to the global default
    const userMaxOffers: number = (req.user as { maxOffers?: number | null }).maxOffers ?? MAX_OFFERS_PER_USER

    const existingOffers = await req.payload.find({
      collection: 'offers',
      where: {
        user: {
          equals: req.user.id,
        },
      },
      limit: 1,
    })

    if (existingOffers.totalDocs >= userMaxOffers) {
      redirect('/app?limit=reached')
    }
  }
}
