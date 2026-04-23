interface BuildStaticMapUrlInput {
  lat: number | null | undefined
  lng: number | null | undefined
  apiKey: string
  width?: number
  height?: number
}

/**
 * Build a Google Maps Static API URL for the offer's coordinates.
 * Returns null when the API key is empty or coordinates are missing,
 * so callers can render a graceful fallback backdrop.
 */
export function buildStaticMapUrl({
  lat,
  lng,
  apiKey,
  width = 640,
  height = 280,
}: BuildStaticMapUrlInput): string | null {
  if (!apiKey || lat == null || lng == null) return null

  const params = new URLSearchParams({
    zoom: '12',
    size: `${width}x${height}`,
    scale: '2',
    key: apiKey,
  })
  // Build center and markers manually to avoid URL encoding of commas and pipes.
  const center = `center=${lat},${lng}`
  const markers = `markers=color:0xFABD23|${lat},${lng}`
  return `https://maps.googleapis.com/maps/api/staticmap?${center}&${params.toString()}&${markers}`
}
