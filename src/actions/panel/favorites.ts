'use server'

import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'

export async function toggleFavorite(offerId: number) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return { success: false as const, error: 'Unauthorized' }

    const payload = await getPayload({ config })

    const user = await payload.findByID({
      collection: 'users',
      id: Number(session.user.id),
      depth: 0,
      overrideAccess: true,
    })

    if (!user) return { success: false as const, error: 'Użytkownik nie został znaleziony' }

    const currentFavorites: number[] = Array.isArray(user.favorites)
      ? (user.favorites as number[])
      : []

    const isFavorited = currentFavorites.includes(offerId)
    const newFavorites = isFavorited
      ? currentFavorites.filter((id) => id !== offerId)
      : [...currentFavorites, offerId]

    await payload.update({
      collection: 'users',
      id: Number(session.user.id),
      data: { favorites: newFavorites },
      overrideAccess: true,
    })

    return { success: true as const, isFavorited: !isFavorited }
  } catch (err) {
    console.error('[toggleFavorite]', err)
    return { success: false as const, error: 'Nie udało się zmienić statusu ulubionej oferty' }
  }
}

export async function getFavorites(userId: number) {
  try {
    const payload = await getPayload({ config })

    const user = await payload.findByID({
      collection: 'users',
      id: userId,
      depth: 0,
      overrideAccess: true,
    })

    const favoriteIds: number[] = Array.isArray(user.favorites)
      ? (user.favorites as number[])
      : []

    if (favoriteIds.length === 0) {
      return { success: true as const, data: [] }
    }

    const result = await payload.find({
      collection: 'offers',
      where: {
        id: { in: favoriteIds },
        _status: { equals: 'published' },
      },
      depth: 1,
      overrideAccess: true,
    })

    return { success: true as const, data: result.docs }
  } catch (err) {
    console.error('[getFavorites]', err)
    return { success: false as const, error: 'Nie udało się pobrać ulubionych ofert' }
  }
}
