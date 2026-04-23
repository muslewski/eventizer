import { describe, it, expect } from 'vitest'
import {
  DEFAULT_POSITION,
  resolvePosition,
} from '@/components/image-position/types'
import { positionStyles } from '@/components/image-position/positionStyles'

describe('positionStyles', () => {
  it('returns object-cover + centered position for DEFAULT_POSITION', () => {
    const s = positionStyles(DEFAULT_POSITION)
    expect(s.objectFit).toBe('cover')
    expect(s.objectPosition).toBe('50% 50%')
    expect(s.transform).toBeUndefined()
    expect(s.transformOrigin).toBe('50% 50%')
  })

  it('emits objectPosition for off-center focal', () => {
    const s = positionStyles({ focalX: 20, focalY: 80, zoom: 1 })
    expect(s.objectPosition).toBe('20% 80%')
    expect(s.transform).toBeUndefined()
  })

  it('emits transform: scale for zoom > 1 with origin at focal', () => {
    const s = positionStyles({ focalX: 30, focalY: 40, zoom: 2 })
    expect(s.transform).toBe('scale(2)')
    expect(s.transformOrigin).toBe('30% 40%')
    expect(s.willChange).toBe('transform')
  })
})

describe('resolvePosition', () => {
  it('returns DEFAULT_POSITION for null/undefined/empty input', () => {
    expect(resolvePosition(null)).toEqual(DEFAULT_POSITION)
    expect(resolvePosition(undefined)).toEqual(DEFAULT_POSITION)
    expect(resolvePosition({})).toEqual(DEFAULT_POSITION)
  })

  it('clamps out-of-range values', () => {
    const r = resolvePosition({ focalX: 150, focalY: -10, zoom: 5 })
    expect(r).toEqual({ focalX: 100, focalY: 0, zoom: 3 })
  })

  it('fills missing fields with defaults', () => {
    const r = resolvePosition({ focalX: 30 })
    expect(r).toEqual({ focalX: 30, focalY: 50, zoom: 1 })
  })
})
