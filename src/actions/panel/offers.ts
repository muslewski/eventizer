'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'
import type { Offer } from '@/payload-types'

async function getAuthenticatedUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

/**
 * Map a Payload / Drizzle save error to a friendly Polish message. Today the
 * only conflict that has a user-meaningful retry is the unique slug; the
 * rest fall back to a generic message.
 */
function describeSaveError(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? `${err.message}\n${err.stack ?? ''}` : String(err)
  if (/offers_link_idx|"link"|unique constraint.*link/i.test(raw)) {
    return 'Ten link jest już zajęty — wybierz inny.'
  }
  return fallback
}

export async function getOffers(
  userId: number,
  page: number = 1,
  limit: number = 10,
  statusFilter?: 'published' | 'draft',
) {
  try {
    const payload = await getPayload({ config })

    const where: any = { user: { equals: userId } }
    if (statusFilter) {
      where._status = { equals: statusFilter }
    }

    const result = await payload.find({
      collection: 'offers',
      where,
      sort: '-createdAt',
      depth: 1,
      draft: true,
      overrideAccess: true,
      page,
      limit,
    })

    return {
      success: true as const,
      data: result.docs,
      pagination: {
        currentPage: result.page ?? 1,
        totalPages: result.totalPages ?? 1,
        totalDocs: result.totalDocs ?? 0,
        hasNextPage: result.hasNextPage ?? false,
        hasPrevPage: result.hasPrevPage ?? false,
      },
    }
  } catch (err) {
    console.error('[getOffers]', err)
    return { success: false as const, error: 'Nie udało się pobrać ofert' }
  }
}

export async function getOffer(slug: string, userId: number) {
  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'offers',
      where: {
        link: { equals: slug },
        user: { equals: userId },
      },
      limit: 1,
      depth: 2,
      draft: true,
      overrideAccess: true,
    })

    const doc = result.docs[0]
    if (!doc) {
      return { success: false as const, error: 'Oferta nie została znaleziona' }
    }

    return { success: true as const, data: doc }
  } catch (err) {
    console.error('[getOffer]', err)
    return { success: false as const, error: 'Nie udało się pobrać oferty' }
  }
}

export async function createOffer(data: Partial<Offer>) {
  try {
    const user = await getAuthenticatedUser()
    const payload = await getPayload({ config })

    const isDraft = (data as any)._status === 'draft' || !(data as any)._status
    const result = await payload.create({
      collection: 'offers',
      data: {
        ...data,
        user: Number(user.id),
      } as Offer,
      draft: isDraft,
      overrideAccess: true,
    })

    return { success: true as const, data: result }
  } catch (err) {
    console.error('[createOffer]', err)
    return {
      success: false as const,
      error: describeSaveError(err, 'Nie udało się utworzyć oferty'),
    }
  }
}

export async function updateOffer(id: number, data: Partial<Offer>) {
  try {
    await getAuthenticatedUser()
    const payload = await getPayload({ config })

    const isDraft = (data as any)._status === 'draft' || !(data as any)._status
    const result = await payload.update({
      collection: 'offers',
      id,
      data: data as Offer,
      overrideAccess: true,
      draft: isDraft,
    })

    return { success: true as const, data: result }
  } catch (err) {
    console.error('[updateOffer]', err)
    return {
      success: false as const,
      error: describeSaveError(err, 'Nie udało się zaktualizować oferty'),
    }
  }
}

export async function deleteOffer(id: number) {
  try {
    const sessionUser = await getAuthenticatedUser()
    const payload = await getPayload({ config })

    // Fetch full user (session user may lack role) and enforce access manually
    // so we return a clean error rather than a Payload Forbidden throw.
    const user = await payload.findByID({
      collection: 'users',
      id: Number(sessionUser.id),
      depth: 0,
    })
    if (!user) return { success: false as const, error: 'Brak uprawnień' }

    const existing = await payload.findByID({
      collection: 'offers',
      id,
      depth: 0,
      overrideAccess: true,
      draft: true,
    })

    const isOwner =
      existing && typeof existing.user === 'object'
        ? existing.user?.id === user.id
        : existing?.user === user.id
    const isPrivileged = user.role === 'admin' || user.role === 'moderator'

    if (!isOwner && !isPrivileged) {
      return { success: false as const, error: 'Brak uprawnień do usunięcia oferty' }
    }

    await payload.delete({
      collection: 'offers',
      id,
      overrideAccess: true,
    })

    revalidatePath('/panel/oferty')
    return { success: true as const }
  } catch (err) {
    console.error('[deleteOffer]', err)
    return { success: false as const, error: 'Nie udało się usunąć oferty' }
  }
}

export async function toggleOfferStatus(id: number, currentStatus: string) {
  try {
    await getAuthenticatedUser()
    const payload = await getPayload({ config })

    const newStatus = currentStatus === 'published' ? 'draft' : 'published'

    const result = await payload.update({
      collection: 'offers',
      id,
      data: {
        _status: newStatus,
      } as Partial<Offer>,
      overrideAccess: true,
      draft: newStatus === 'draft',
    })

    return { success: true as const, data: result }
  } catch (err) {
    console.error('[toggleOfferStatus]', err)
    return { success: false as const, error: 'Nie udało się zmienić statusu oferty' }
  }
}
