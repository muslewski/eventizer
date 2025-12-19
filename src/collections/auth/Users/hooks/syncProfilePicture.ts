import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Handles profile picture synchronization:
 * 1. Downloads and stores external OAuth profile pictures locally
 * 2. Syncs the `image` field with the uploaded `profilePicture` media URL
 * 3. Clears `image` when `profilePicture` is removed
 */
export const syncProfilePicture: CollectionBeforeChangeHook = async ({ req, data, operation }) => {
  // Sync image field with profilePicture media URL
  if (data.profilePicture) {
    try {
      // Handle both ID and full object cases
      const pfpId =
        typeof data.profilePicture === 'object' ? data.profilePicture.id : data.profilePicture

      const pfp = await req.payload.findByID({
        collection: 'profile-pictures',
        id: pfpId,
      })

      if (pfp?.url) {
        data.image = pfp.url
      }
    } catch (error) {
      req.payload.logger.error({
        message: 'Error syncing profile image URL:',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  } else if (data.profilePicture === null) {
    // Clear image when profilePicture is removed
    data.image = null
  }

  return data
}
