import { describe, it, expect } from 'vitest'
import {
  globToRegex,
  matchGlob,
  grepCode,
  routeExists,
  trackedFiles,
  changedFilesSince,
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

  it('globToRegex: internal **/ matches zero or more segments', () => {
    const rx = globToRegex('src/**/foo.ts')
    expect(rx.test('src/foo.ts')).toBe(true)
    expect(rx.test('src/a/foo.ts')).toBe(true)
    expect(rx.test('src/a/b/foo.ts')).toBe(true)
    expect(rx.test('src/foo.tsx')).toBe(false)
  })

  it('globToRegex: * stays within a single segment', () => {
    const rx = globToRegex('src/*.ts')
    expect(rx.test('src/a.ts')).toBe(true)
    expect(rx.test('src/a/b.ts')).toBe(false)
  })

  it('routeExists: rejects a compound route whose leaf segment exists elsewhere', () => {
    expect(routeExists('/panel')).toBe(true)
    expect(routeExists('/totally/fake/panel')).toBe(false)
  })

  it('changedFilesSince: empty or invalid SHA returns null (treated as stale, never false-fresh)', () => {
    expect(changedFilesSince('')).toBe(null)
    expect(changedFilesSince('0000000000000000000000000000000000000000')).toBe(null)
    expect(Array.isArray(changedFilesSince('HEAD'))).toBe(true)
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
