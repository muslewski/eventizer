import type { AccessResult, CollectionConfig } from 'payload'
import { adminOrHigherOrSelf, moderatorOrHigherOrSelf, providerOrHigher } from '@/access'
import { isClientRoleEqualOrHigher } from '@/access/utilities'

export const offersAccess: CollectionConfig['access'] = {
  // admin see everything
  create: providerOrHigher, // providers and highers can create
  read: ({ req: { user } }): AccessResult => {
    // Anonymous readers only ever see published offers — Offers has drafts
    // enabled, and a bare `true` would let `?draft=true` REST reads leak them.
    if (!user) return { _status: { equals: 'published' } }

    // Moderators and above can see all
    if (isClientRoleEqualOrHigher('moderator', user)) return true

    // Regular users only see their own offers
    return {
      user: {
        equals: user.id,
      },
    }
  },
  update: moderatorOrHigherOrSelf('user'), // mods, admins, and owners
  delete: adminOrHigherOrSelf('user'), // only admins or owners of document
}
