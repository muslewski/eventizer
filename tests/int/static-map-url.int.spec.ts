import { describe, it, expect } from 'vitest'
import { buildStaticMapUrl } from '@/components/panel/oferty/detail/staticMapUrl'

describe('buildStaticMapUrl', () => {
  const validInput = { lat: 52.2297, lng: 21.0122, apiKey: 'test-key' }

  it('returns null when apiKey is empty', () => {
    expect(buildStaticMapUrl({ ...validInput, apiKey: '' })).toBeNull()
  })

  it('returns null when lat is null', () => {
    expect(buildStaticMapUrl({ ...validInput, lat: null as unknown as number })).toBeNull()
  })

  it('returns null when lng is undefined', () => {
    expect(
      buildStaticMapUrl({ ...validInput, lng: undefined as unknown as number }),
    ).toBeNull()
  })

  it('includes center, scale=2, gold marker and key for valid input', () => {
    const url = buildStaticMapUrl(validInput)
    expect(url).not.toBeNull()
    expect(url).toContain('center=52.2297,21.0122')
    expect(url).toContain('scale=2')
    expect(url).toContain('markers=color:0xFABD23|52.2297,21.0122')
    expect(url).toContain('key=test-key')
    expect(url).toMatch(/^https:\/\/maps\.googleapis\.com\/maps\/api\/staticmap\?/)
  })

  it('honours custom width and height', () => {
    const url = buildStaticMapUrl({ ...validInput, width: 800, height: 400 })
    expect(url).toContain('size=800x400')
  })
})
