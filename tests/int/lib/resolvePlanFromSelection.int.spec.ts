import { describe, it, expect } from 'vitest'
import { resolvePlanFromSelection } from '@/components/panel/plan-subskrypcji/lib/resolvePlanFromSelection'

const plansBySlug = new Map<string, any>([
  ['multi', { id: 4, slug: 'multi', level: 4, maxOffers: 4 }],
  ['agency', { id: 5, slug: 'agency', level: 5, maxOffers: 10 }],
])

describe('resolvePlanFromSelection', () => {
  it('returns null when kind is undefined', () => {
    expect(resolvePlanFromSelection({ categories: [], plansBySlug })).toBeNull()
  })

  it('multi kind returns the tier plan', () => {
    expect(
      resolvePlanFromSelection({ kind: 'multi', tierSlug: 'agency', categories: [], plansBySlug }),
    ).toMatchObject({ slug: 'agency' })
  })

  it('multi kind without tierSlug returns null', () => {
    expect(
      resolvePlanFromSelection({ kind: 'multi', categories: [], plansBySlug }),
    ).toBeNull()
  })

  it('single kind without categoryPath returns null', () => {
    expect(
      resolvePlanFromSelection({ kind: 'single', categories: [], plansBySlug }),
    ).toBeNull()
  })

  it('single kind returns deepest requiredPlan along path', () => {
    const t2 = { id: 2, slug: 'single-plus', level: 2, maxOffers: 1 } as any
    const categories = [{ slug: 'music', requiredPlan: t2, subcategory_level_1: [] }] as any
    expect(
      resolvePlanFromSelection({
        kind: 'single',
        categoryPath: 'music',
        categories,
        plansBySlug,
      }),
    ).toMatchObject({ slug: 'single-plus' })
  })
})
