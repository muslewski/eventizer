import { describe, it, expect } from 'vitest'
import { buildBaseConditions } from '@/app/(frontend)/[lang]/ogloszenia/ListView/utils/conditions'
import type { ParsedSearchParams } from '@/app/(frontend)/[lang]/ogloszenia/ListView/types'

const base: ParsedSearchParams = {
  page: 1,
  limit: 10,
  sortuj: 'random',
}

describe('buildBaseConditions — rodzaj filter', () => {
  it('omits the eventTypes block when rodzaj is undefined', () => {
    const conditions = buildBaseConditions(base)
    const json = JSON.stringify(conditions)
    expect(json).not.toContain('eventTypes')
  })

  it('emits an or-block with eventTypes.slug equals AND exists:false when rodzaj is set', () => {
    const conditions = buildBaseConditions({ ...base, rodzaj: 'wesele' })

    const rodzajBlock = conditions.find(
      (c) => JSON.stringify(c).includes('eventTypes'),
    )
    expect(rodzajBlock).toBeDefined()
    expect(rodzajBlock).toEqual({
      or: [
        { 'eventTypes.slug': { equals: 'wesele' } },
        { eventTypes: { exists: false } },
      ],
    })
  })

  it('keeps the kategoria block intact when both kategoria and rodzaj are set', () => {
    const conditions = buildBaseConditions({
      ...base,
      kategoria: 'muzyka-rozrywka/dj',
      rodzaj: 'wesele',
    })

    const kategoriaBlock = conditions.find(
      (c) => JSON.stringify(c).includes('categorySlug'),
    )
    expect(kategoriaBlock).toBeDefined()

    const rodzajBlock = conditions.find(
      (c) => JSON.stringify(c).includes('eventTypes'),
    )
    expect(rodzajBlock).toBeDefined()
  })
})
