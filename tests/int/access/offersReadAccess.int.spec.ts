import { describe, it, expect } from 'vitest'
import { offersAccess } from '@/collections/Offers/access'

const read = offersAccess!.read as (args: { req: { user: unknown } }) => unknown

describe('offers read access', () => {
  it('limits anonymous readers to published offers (drafts must not leak)', () => {
    const result = read({ req: { user: null } })
    expect(result).toEqual({ _status: { equals: 'published' } })
  })

  it('keeps regular users scoped to their own offers (admin list behavior)', () => {
    const result = read({ req: { user: { id: 7, role: 'service-provider' } } })
    expect(result).toEqual({ user: { equals: 7 } })
  })

  it('lets moderators read everything', () => {
    const result = read({ req: { user: { id: 1, role: 'moderator' } } })
    expect(result).toBe(true)
  })
})
