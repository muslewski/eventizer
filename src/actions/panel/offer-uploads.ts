'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'
import type { ImagePosition } from '@/components/image-position/types'
import { resolvePosition } from '@/components/image-position/types'

async function getAuthenticatedUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

/**
 * Updates the focal + zoom values on an offer upload.
 *
 * The OfferUploads collection's access config references a non-existent
 * `uploadedBy` field, so collection-level `update` access is effectively
 * broken for non-admins. This action performs ownership enforcement
 * manually (admin/moderator OR the user who uploaded the doc).
 */
export async function updateOfferUploadPosition(
  uploadId: number,
  position: ImagePosition,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const sessionUser = await getAuthenticatedUser()
    const payload = await getPayload({ config })

    const user = await payload.findByID({
      collection: 'users',
      id: Number(sessionUser.id),
      depth: 0,
    })
    if (!user) return { success: false, error: 'Brak uprawnień' }

    const upload = await payload.findByID({
      collection: 'offer-uploads',
      id: uploadId,
      depth: 0,
      overrideAccess: true,
    })

    const ownerId =
      upload && typeof upload.user === 'object'
        ? upload.user?.id
        : (upload?.user as number | undefined)

    const isOwner = ownerId === user.id
    const isPrivileged = user.role === 'admin' || user.role === 'moderator'

    if (!isOwner && !isPrivileged) {
      return { success: false, error: 'Brak uprawnień do edycji tego zdjęcia' }
    }

    // Clamp + normalize at the boundary
    const clamped = resolvePosition(position)

    await payload.update({
      collection: 'offer-uploads',
      id: uploadId,
      data: {
        focalX: clamped.focalX,
        focalY: clamped.focalY,
        zoom: clamped.zoom,
      },
      overrideAccess: true,
    })

    // Refresh every surface that displays the main image
    revalidatePath('/panel/oferty')
    revalidatePath('/panel/oferty/[slug]', 'page')
    revalidatePath('/[lang]/ogloszenia', 'page')
    revalidatePath('/[lang]/ogloszenia/[slug]', 'page')

    return { success: true }
  } catch (err) {
    console.error('[updateOfferUploadPosition]', err)
    return { success: false, error: 'Nie udało się zapisać kadru' }
  }
}
