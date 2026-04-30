import type { CollectionBeforeChangeHook } from 'payload'
import { ValidationError } from 'payload'
import { isClientRoleEqualOrHigher } from '@/access/utilities'

/**
 * Blocks transitions to `_status: 'published'` when the offer's owner already
 * has `maxOffers` published offers. Drafts are unaffected — this hook only
 * fires when an offer is becoming newly published.
 *
 * Owner's `maxOffers` is read from the user record, NOT `req.user`. That way
 * a moderator publishing on someone's behalf, or a server-action calling
 * payload.update without a `req`, both enforce the owner's limit correctly.
 */
export const enforceMaxPublishedOffers: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  const willBePublished = (data as { _status?: string })._status === 'published'
  const wasPublished = (originalDoc as { _status?: string } | undefined)?._status === 'published'
  if (!willBePublished || wasPublished) return data

  // Bypass for moderators/admins acting with a session
  if (req.user && isClientRoleEqualOrHigher('moderator', req.user)) return data

  // Resolve owner from originalDoc (update) or data (create)
  const rawOwner = (originalDoc as { user?: unknown } | undefined)?.user ?? (data as { user?: unknown }).user
  if (rawOwner === undefined || rawOwner === null) return data
  const ownerId = typeof rawOwner === 'object' ? (rawOwner as { id: number }).id : (rawOwner as number)

  const owner = await req.payload.findByID({
    collection: 'users',
    id: ownerId,
    depth: 0,
  })
  const userMax = owner?.maxOffers ?? 1

  const currentlyPublished = await req.payload.find({
    collection: 'offers',
    where: {
      user: { equals: ownerId },
      _status: { equals: 'published' },
      ...(originalDoc?.id ? { id: { not_equals: originalDoc.id } } : {}),
    },
    limit: 0,
    depth: 0,
  })

  if (currentlyPublished.totalDocs >= userMax) {
    throw new ValidationError({
      errors: [
        {
          path: '_status',
          message: `Osiągnięto limit opublikowanych ofert (${userMax}). Aby opublikować tę ofertę, najpierw przenieś inną do wersji roboczej.`,
        },
      ],
    })
  }

  return data
}
