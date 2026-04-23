/**
 * Image positioning data stored on an OfferUpload.
 *
 * focalX / focalY are percentages (0–100) to match Payload's built-in
 * focal-point primitive. zoom is a scale multiplier 1–3 applied on top
 * of object-cover at display time.
 */
export interface ImagePosition {
  focalX: number
  focalY: number
  zoom: number
}

export const DEFAULT_POSITION: ImagePosition = {
  focalX: 50,
  focalY: 50,
  zoom: 1,
}

const FOCAL_MIN = 0
const FOCAL_MAX = 100
const ZOOM_MIN = 1
const ZOOM_MAX = 3

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Normalizes a partial / nullable / dirty ImagePosition into a fully
 * defined and clamped one. Safe against stale DB rows with out-of-range
 * values or missing fields.
 */
export function resolvePosition(
  raw: Partial<ImagePosition> | null | undefined,
): ImagePosition {
  if (!raw) return DEFAULT_POSITION

  const focalX = typeof raw.focalX === 'number' ? clamp(raw.focalX, FOCAL_MIN, FOCAL_MAX) : DEFAULT_POSITION.focalX
  const focalY = typeof raw.focalY === 'number' ? clamp(raw.focalY, FOCAL_MIN, FOCAL_MAX) : DEFAULT_POSITION.focalY
  const zoom = typeof raw.zoom === 'number' ? clamp(raw.zoom, ZOOM_MIN, ZOOM_MAX) : DEFAULT_POSITION.zoom

  return { focalX, focalY, zoom }
}
