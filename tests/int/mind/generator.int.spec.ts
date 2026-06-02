import { describe, it, expect } from 'vitest'
import {
  globToRegex,
  matchGlob,
  grepCode,
  routeExists,
  trackedFiles,
} from '../../../scripts/mind/lib.mjs'
import { run } from '../../../scripts/mind/generate.mjs'

describe('mind generator lib', () => {
  it('globToRegex matches ** across path segments but not siblings', () => {
    expect(globToRegex('src/**').test('src/a/b/c.ts')).toBe(true)
    expect(globToRegex('src/**').test('other/a.ts')).toBe(false)
    expect(globToRegex('src/app/(frontend)/[lang]/panel/**').test('src/app/(frontend)/[lang]/panel/oferty/page.tsx')).toBe(true)
  })

  it('trackedFiles returns a non-empty list', () => {
    expect(trackedFiles().length).toBeGreaterThan(0)
  })

  it('matchGlob resolves a real zone glob and rejects a fake one', () => {
    expect(matchGlob('src/collections/Offers/**').length).toBeGreaterThan(0)
    expect(matchGlob('src/does-not-exist/**').length).toBe(0)
  })

  it('grepCode finds a known exported symbol', () => {
    expect(grepCode('OfferWizardForm').length).toBeGreaterThan(0)
  })

  it('routeExists finds a real route', () => {
    expect(routeExists('/panel')).toBe(true)
    expect(routeExists('/no-such-route')).toBe(false)
  })
})

describe('mind generator run()', () => {
  it('returns the result shape and does not throw on the current vault', () => {
    const result = run()
    expect(Array.isArray(result.errors)).toBe(true)
    expect(Array.isArray(result.gaps)).toBe(true)
    expect(Array.isArray(result.rows)).toBe(true)
    expect(Array.isArray(result.attic)).toBe(true)
  })
})
