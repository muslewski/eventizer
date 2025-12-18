import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Handles profile picture synchronization:
 * 1. Downloads and stores external OAuth profile pictures locally
 * 2. Syncs the `image` field with the uploaded `profilePicture` media URL
 * 3. Clears `image` when `profilePicture` is removed
 */
export const syncProfilePicture: CollectionBeforeChangeHook = async ({ req, data, operation }) => {
  // Handle OAuth profile picture sync - download external image and store locally
  if (operation === 'create' || operation === 'update') {
    // Check if image exists and profilePicture is null, and image is external (OAuth)
    if (data.image && !data.profilePicture && !data.image.startsWith('/api/')) {
      try {
        // Download the external image
        const response = await fetch(data.image)
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`)
        }

        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Extract filename from URL or use default
        const filename = `oauth-profile-${data.id || Date.now()}.jpg`

        // Create profile picture in Payload
        const profilePic = await req.payload.create({
          collection: 'profile-pictures',
          data: {
            uploadedBy: data.email,
          },
          file: {
            data: buffer,
            mimetype: 'image/webp',
            name: filename,
            size: buffer.length,
          },
        })

        // Set the profilePicture field
        data.profilePicture = profilePic.id
      } catch (error) {
        req.payload.logger.error({
          message: 'Error syncing OAuth profile picture:',
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
  }

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
