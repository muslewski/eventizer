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

export const deleteRelatedUserData: CollectionBeforeDeleteHook = async ({ req, id }) => {
  const user = await req.payload.findByID({
    collection: 'users',
    id,
  })

  // Delete accounts - userId is a relationship, so query by the ID directly
  const accounts = await req.payload.find({
    collection: 'user-accounts',
    where: {
      userId: {
        equals: id,
      },
    },
    req,
  })

  for (const account of accounts.docs) {
    await req.payload.delete({
      collection: 'user-accounts',
      id: account.id,
      req,
    })
  }

  // Delete sessions
  const sessions = await req.payload.find({
    collection: 'user-sessions',
    where: {
      userId: {
        equals: id,
      },
    },
    req,
  })

  for (const session of sessions.docs) {
    await req.payload.delete({
      collection: 'user-sessions',
      id: session.id,
      req,
    })
  }

  // Delete verifications by email
  if (user?.email) {
    const verifications = await req.payload.find({
      collection: 'user-verifications',
      where: {
        identifier: {
          equals: user.email,
        },
      },
      req,
    })

    for (const verification of verifications.docs) {
      await req.payload.delete({
        collection: 'user-verifications',
        id: verification.id,
        req,
      })
    }
  }

  // Delete all profile pictures uploaded by the user
  const userProfilePictures = await req.payload.find({
    collection: 'profile-pictures',
    where: {
      uploadedBy: {
        equals: user.email,
      },
    },
    req,
  })

  for (const picture of userProfilePictures.docs) {
    await req.payload.delete({
      collection: 'profile-pictures',
      id: picture.id,
      req,
    })
  }
}
