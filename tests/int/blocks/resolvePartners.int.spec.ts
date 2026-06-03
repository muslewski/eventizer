import { describe, it, expect } from 'vitest'
import { toResolvedPartner } from '@/blocks/Partners/shared'

describe('toResolvedPartner', () => {
  it('builds offerHref from a published offer link (offer given as id)', () => {
    const map = new Map<number, string>([[117, 'SkyBialystok']])
    const r = toResolvedPartner(
      { name: 'SkyClub', offer: 117, externalUrl: 'https://sky-club.pl/' },
      map,
    )
    expect(r.offerHref).toBe('/ogloszenia/SkyBialystok')
    expect(r.externalHref).toBe('https://sky-club.pl/')
    expect(r.name).toBe('SkyClub')
  })

  it('leaves offerHref null when the offer id is absent from the published map', () => {
    const r = toResolvedPartner({ name: 'X', offer: 999 }, new Map())
    expect(r.offerHref).toBeNull()
  })

  it('handles an expanded offer object', () => {
    const map = new Map<number, string>([[203, 'apartamenty-zielona-lipka']])
    const r = toResolvedPartner(
      { name: 'Y', offer: { id: 203, link: 'apartamenty-zielona-lipka' } as never },
      map,
    )
    expect(r.offerHref).toBe('/ogloszenia/apartamenty-zielona-lipka')
  })

  it('trims externalUrl and nulls it when blank', () => {
    expect(toResolvedPartner({ name: 'Z', externalUrl: '   ' }, new Map()).externalHref).toBeNull()
    expect(
      toResolvedPartner({ name: 'Z', externalUrl: '  https://a.pl  ' }, new Map()).externalHref,
    ).toBe('https://a.pl')
  })

  it('passes the logo reference through unchanged', () => {
    expect(toResolvedPartner({ name: 'L', logo: 5 }, new Map()).logo).toBe(5)
  })
})
