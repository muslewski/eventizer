import { describe, it, expect } from 'vitest'
import {
  normalizeHex,
  hexToRgba,
  resolveAccent,
  DEFAULT_ACCENT_HEX,
} from '@/blocks/Partners/accent'

describe('normalizeHex', () => {
  it('keeps a valid 6-digit hex, uppercased', () => {
    expect(normalizeHex('#10b981')).toBe('#10B981')
    expect(normalizeHex('  #3B82F6  ')).toBe('#3B82F6')
  })
  it('falls back to the gold default for invalid/empty/null/undefined/shorthand', () => {
    expect(normalizeHex('')).toBe(DEFAULT_ACCENT_HEX)
    expect(normalizeHex('#fff')).toBe(DEFAULT_ACCENT_HEX)
    expect(normalizeHex('red')).toBe(DEFAULT_ACCENT_HEX)
    expect(normalizeHex(null)).toBe(DEFAULT_ACCENT_HEX)
    expect(normalizeHex(undefined)).toBe(DEFAULT_ACCENT_HEX)
  })
})

describe('hexToRgba', () => {
  it('converts a hex to rgba at the given alpha', () => {
    expect(hexToRgba('#10B981', 0.2)).toBe('rgba(16, 185, 129, 0.2)')
    expect(hexToRgba('#E4A00B', 0.05)).toBe('rgba(228, 160, 11, 0.05)')
  })
  it('uses the default for an invalid hex', () => {
    expect(hexToRgba('nope', 0.5)).toBe('rgba(228, 160, 11, 0.5)')
  })
})

describe('resolveAccent', () => {
  it('produces solid + tints from a hex', () => {
    const a = resolveAccent('#3B82F6')
    expect(a.solid).toBe('#3B82F6')
    expect(a.bg).toBe('rgba(59, 130, 246, 0.2)')
    expect(a.bgSoft).toBe('rgba(59, 130, 246, 0.05)')
    expect(a.border).toBe('rgba(59, 130, 246, 0.3)')
  })
  it('falls back to the gold default when the hex is missing', () => {
    expect(resolveAccent(null).solid).toBe(DEFAULT_ACCENT_HEX)
  })
})
