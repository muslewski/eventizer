import { describe, it, expect } from 'vitest'
import { pluralizeOffers } from '@/components/panel/plan-subskrypcji/lib/pluralizeOffers'

describe('pluralizeOffers', () => {
  it('1 → singular: 1 oferta zostanie przeniesiona', () => {
    expect(pluralizeOffers(1)).toEqual({
      count: '1',
      noun: 'oferta',
      verb: 'zostanie',
      participle: 'przeniesiona',
    })
  })

  it.each([2, 3, 4, 22, 23, 24])('few-form for %i', (n) => {
    expect(pluralizeOffers(n)).toEqual({
      count: String(n),
      noun: 'oferty',
      verb: 'zostaną',
      participle: 'przeniesione',
    })
  })

  it.each([0, 5, 11, 12, 13, 14, 21, 25, 100])('many-form for %i', (n) => {
    expect(pluralizeOffers(n)).toEqual({
      count: String(n),
      noun: 'ofert',
      verb: 'zostanie',
      participle: 'przeniesionych',
    })
  })
})
