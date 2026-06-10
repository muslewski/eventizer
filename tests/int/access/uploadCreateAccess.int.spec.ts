import { describe, it, expect } from 'vitest'
import { OfferUploads } from '@/collections/uploads/OfferUploads'
import { OfferVideoUploads } from '@/collections/uploads/OfferVideoUploads'
import { ProfilePictures } from '@/collections/uploads/ProfilePictures'

const collections = [OfferUploads, OfferVideoUploads, ProfilePictures]

describe.each(collections.map((c) => [c.slug, c] as const))(
  '%s create access',
  (_slug, collection) => {
    const create = collection.access!.create as (args: { req: { user: unknown } }) => unknown

    it('rejects anonymous uploads', () => {
      expect(create({ req: { user: null } })).toBe(false)
    })

    it('allows authenticated uploads', () => {
      expect(create({ req: { user: { id: 1, role: 'client' } } })).toBe(true)
    })
  },
)
