'use server'

import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { auth } from '@/auth/auth'
import { SLUG_PATTERN } from '@/lib/slugify'

export interface CheckOfferSlugAvailableInput {
  slug: string
  /** When editing, exclude the offer being edited so its own current slug
   *  doesn't appear taken. */
  currentOfferId?: number
}

export interface CheckOfferSlugAvailableResult {
  available: boolean
  /** When false: 'taken' if another offer holds the slug, 'invalid' if the
   *  slug fails the format regex. */
  reason?: 'taken' | 'invalid'
}

export async function checkOfferSlugAvailable({
  slug,
  currentOfferId,
}: CheckOfferSlugAvailableInput): Promise<CheckOfferSlugAvailableResult> {
  // Cheap rejects before hitting the DB.
  const trimmed = slug.trim()
  if (!SLUG_PATTERN.test(trimmed)) {
    return { available: false, reason: 'invalid' }
  }

  // Auth gate — only logged-in users hit this from the wizard.
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return { available: false, reason: 'invalid' }
  }

  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'offers',
    where: currentOfferId
      ? {
          and: [
            { link: { equals: trimmed } },
            { id: { not_equals: currentOfferId } },
          ],
        }
      : { link: { equals: trimmed } },
    limit: 1,
    depth: 0,
    draft: true,
    overrideAccess: true,
  })

  return { available: result.totalDocs === 0, reason: result.totalDocs === 0 ? undefined : 'taken' }
}
