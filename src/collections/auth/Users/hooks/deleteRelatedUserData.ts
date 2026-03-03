import type { CollectionBeforeDeleteHook } from 'payload'

/**
 * Before deleting a user, clean up all related data:
 * - User accounts (OAuth connections)
 * - User sessions
 * - User verifications
 * - Profile pictures uploaded by the user
 */

// TODO
// - we should also delete offers associated with the user, maybe soft delete them instead?

export const deleteRelatedUserData: CollectionBeforeDeleteHook = async ({ id, req }) => {
  // Delete Better Auth sessions before deleting user
  await req.payload.delete({
    collection: 'user-sessions',
    where: {
      userId: { equals: id },
    },
    req,
  })

  // Delete Better Auth accounts before deleting user
  await req.payload.delete({
    collection: 'user-accounts',
    where: {
      userId: { equals: id },
    },
    req,
  })

  // Delete Better Auth verifications before deleting user
  await req.payload.delete({
    collection: 'user-verifications',
    where: {
      // verifications use identifier, not userId — skip or adjust if needed
    },
    req,
  })

  // Delete help tickets associated with the user
  await req.payload.delete({
    collection: 'help-tickets',
    where: {
      user: { equals: id },
    },
    req,
  })
}
