import { isClientRoleEqualOrHigher } from '@/access/utilities'
import { redirect } from 'next/navigation'
import type { CollectionBeforeOperationHook } from 'payload'

export const MAX_OFFERS_PER_USER = 10

export const enforceMaxOffers: CollectionBeforeOperationHook = async ({ operation, req }) => {
  // Enforce max offers per user
  if (operation === 'create' && req.user && !isClientRoleEqualOrHigher('moderator', req.user)) {
    const existingOffers = await req.payload.find({
      collection: 'offers',
      where: {
        user: {
          equals: req.user.id,
        },
      },
      limit: 0, // we only need the count
    })

    if (existingOffers.totalDocs >= MAX_OFFERS_PER_USER) {
      redirect('/app/offers-limit-reached')
    }
  }
}
