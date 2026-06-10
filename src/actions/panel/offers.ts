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

type PayloadClient = Awaited<ReturnType<typeof getPayload>>

/**
 * Session user may lack a fresh `role`; load the full Payload user whenever a
 * role or ownership decision is made.
 */
async function getFullUser(payload: PayloadClient, sessionUserId: number | string) {
  return payload.findByID({
    collection: 'users',
    id: Number(sessionUserId),
    depth: 0,
  })
}

function isPrivileged(user: { role?: string | null }): boolean {
  return user.role === 'admin' || user.role === 'moderator'
}

function offerOwnerId(offer: { user?: number | { id: number } | null }): number | null {
  if (typeof offer.user === 'object') return offer.user?.id ?? null
  return offer.user ?? null
}

/**
 * Every mutation here uses `overrideAccess: true`, so ownership must be
 * enforced in-action: load the offer, and require owner or moderator+.
 */
async function assertOfferOwnership(
  payload: PayloadClient,
  offerId: number,
  user: { id: number; role?: string | null },
): Promise<{ ok: true; offer: Offer } | { ok: false }> {
  const existing = await payload.findByID({
    collection: 'offers',
    id: offerId,
    depth: 0,
    draft: true,
    overrideAccess: true,
  })
  if (!existing) return { ok: false }

  const isOwner = offerOwnerId(existing) === user.id
  if (!isOwner && !isPrivileged(user)) return { ok: false }

  return { ok: true, offer: existing }
}

async function isAtPublishedLimit(
  payload: Awaited<ReturnType<typeof getPayload>>,
  userId: number,
  excludeOfferId?: number,
): Promise<{ atLimit: boolean; max: number; published: number }> {
  const user = await payload.findByID({
    collection: 'users',
    id: userId,
    depth: 0,
  })
  const max = user?.maxOffers ?? 1

  const published = await payload.find({
    collection: 'offers',
    where: {
      user: { equals: userId },
      _status: { equals: 'published' },
      ...(excludeOfferId ? { id: { not_equals: excludeOfferId } } : {}),
    },
    limit: 0,
    depth: 0,
    overrideAccess: true,
  })

  return { atLimit: published.totalDocs >= max, max, published: published.totalDocs }
}

export async function getOffers(
  userId: number,
  page: number = 1,
  limit: number = 10,
  statusFilter?: 'published' | 'draft',
) {
  try {
    const sessionUser = await getAuthenticatedUser()
    const payload = await getPayload({ config })

    const user = await getFullUser(payload, sessionUser.id)
    if (!user) return { success: false as const, error: 'Brak uprawnień' }

    // Moderators+ may inspect another provider's offers (admin-views-provider);
    // everyone else is scoped to their own regardless of the requested id.
    const targetUserId = isPrivileged(user) ? userId : user.id

    const where: any = { user: { equals: targetUserId } }
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
    const sessionUser = await getAuthenticatedUser()
    const payload = await getPayload({ config })

    const user = await getFullUser(payload, sessionUser.id)
    if (!user) return { success: false as const, error: 'Brak uprawnień' }

    const targetUserId = isPrivileged(user) ? userId : user.id

    const result = await payload.find({
      collection: 'offers',
      where: {
        link: { equals: slug },
        user: { equals: targetUserId },
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

    const requestedStatus = (data as any)._status
    const wantsPublish = requestedStatus === 'published'
    let isDraft = requestedStatus === 'draft' || !requestedStatus

    let savedAsDraftDueToLimit = false
    let limitMax: number | null = null

    // Pre-check: if user is publishing but already at the cap, save as draft
    if (wantsPublish) {
      const { atLimit, max } = await isAtPublishedLimit(payload, Number(user.id))
      if (atLimit) {
        savedAsDraftDueToLimit = true
        limitMax = max
        isDraft = true
        ;(data as any)._status = 'draft'
      }
    }

    const result = await payload.create({
      collection: 'offers',
      data: {
        ...data,
        user: Number(user.id),
      } as Offer,
      draft: isDraft,
      overrideAccess: true,
    })

    if (savedAsDraftDueToLimit) {
      return {
        success: true as const,
        data: result,
        savedAsDraftDueToLimit: true,
        message: `Limit ofert opublikowanych (${limitMax}) został osiągnięty — oferta została zapisana jako wersja robocza.`,
      }
    }

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
    const sessionUser = await getAuthenticatedUser()
    const payload = await getPayload({ config })

    const user = await getFullUser(payload, Number(sessionUser.id))
    if (!user) return { success: false as const, error: 'Brak uprawnień' }

    const ownership = await assertOfferOwnership(payload, id, user)
    if (!ownership.ok) {
      return { success: false as const, error: 'Brak uprawnień do edycji oferty' }
    }

    // Owners must not reassign their offer; reassignment is admin-UI territory.
    const { user: _ignoredUser, ...safeData } = data

    const requestedStatus = (safeData as any)._status
    const wantsPublish = requestedStatus === 'published'
    let isDraft = requestedStatus === 'draft' || !requestedStatus

    let savedAsDraftDueToLimit = false
    let limitMax: number | null = null

    if (wantsPublish) {
      // The published-offer cap belongs to the offer's owner, not the caller
      // (a moderator publishing on someone's behalf counts against the owner).
      const { atLimit, max } = await isAtPublishedLimit(
        payload,
        offerOwnerId(ownership.offer) ?? user.id,
        id,
      )
      if (atLimit) {
        savedAsDraftDueToLimit = true
        limitMax = max
        isDraft = true
        ;(safeData as any)._status = 'draft'
      }
    }

    const result = await payload.update({
      collection: 'offers',
      id,
      data: safeData as Offer,
      overrideAccess: true,
      draft: isDraft,
    })

    if (savedAsDraftDueToLimit) {
      return {
        success: true as const,
        data: result,
        savedAsDraftDueToLimit: true,
        message: `Limit ofert opublikowanych (${limitMax}) został osiągnięty — oferta została zapisana jako wersja robocza.`,
      }
    }

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

    const user = await getFullUser(payload, Number(sessionUser.id))
    if (!user) return { success: false as const, error: 'Brak uprawnień' }

    const ownership = await assertOfferOwnership(payload, id, user)
    if (!ownership.ok) {
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
    const sessionUser = await getAuthenticatedUser()
    const payload = await getPayload({ config })

    const user = await getFullUser(payload, Number(sessionUser.id))
    if (!user) return { success: false as const, error: 'Brak uprawnień' }

    const ownership = await assertOfferOwnership(payload, id, user)
    if (!ownership.ok) {
      return { success: false as const, error: 'Brak uprawnień do zmiany statusu oferty' }
    }

    const newStatus = currentStatus === 'published' ? 'draft' : 'published'

    if (newStatus === 'published') {
      const { atLimit, max } = await isAtPublishedLimit(
        payload,
        offerOwnerId(ownership.offer) ?? user.id,
        id,
      )
      if (atLimit) {
        return {
          success: false as const,
          error: `Limit ofert opublikowanych (${max}) został osiągnięty. Aby opublikować tę ofertę, najpierw przenieś inną do wersji roboczej.`,
        }
      }
    }

    const result = await payload.update({
      collection: 'offers',
      id,
      data: { _status: newStatus } as Partial<Offer>,
      overrideAccess: true,
      draft: newStatus === 'draft',
    })

    return { success: true as const, data: result }
  } catch (err) {
    console.error('[toggleOfferStatus]', err)
    return { success: false as const, error: 'Nie udało się zmienić statusu oferty' }
  }
}
