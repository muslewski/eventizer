/** Default brand-gold accent, used when a partner has no/invalid hex. */
export const DEFAULT_ACCENT_HEX = '#E4A00B'

const HEX_RE = /^#([0-9a-fA-F]{6})$/

/** Normalize to #RRGGBB uppercase, or the gold default when invalid. */
export function normalizeHex(hex?: string | null): string {
  if (typeof hex === 'string') {
    const trimmed = hex.trim()
    if (HEX_RE.test(trimmed)) return trimmed.toUpperCase()
  }
  return DEFAULT_ACCENT_HEX
}

/** Convert a hex color to an `rgba(r, g, b, alpha)` string. Invalid → default. */
export function hexToRgba(hex: string, alpha: number): string {
  const h = normalizeHex(hex)
  const r = parseInt(h.slice(1, 3), 16)
  const g = parseInt(h.slice(3, 5), 16)
  const b = parseInt(h.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export type Accent = {
  /** Solid hex — text color + SVG ring stroke. */
  solid: string
  /** 20% tint — active avatar background. */
  bg: string
  /** 5% tint — soft glow / inactive avatar background. */
  bgSoft: string
  /** 30% tint — active border. */
  border: string
}

/** Resolve a partner's hex (or null) into inline-style-ready accent values. */
export function resolveAccent(hex?: string | null): Accent {
  const solid = normalizeHex(hex)
  return {
    solid,
    bg: hexToRgba(solid, 0.2),
    bgSoft: hexToRgba(solid, 0.05),
    border: hexToRgba(solid, 0.3),
  }
}
