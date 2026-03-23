import type { Offer } from '@/payload-types'

/**
 * Calculate bounding box for a given center point and radius in km.
 * Used to create a rough DB-level filter before precise Haversine check.
 */
export function getBoundingBox(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm / 111.32
  const lngDelta = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180))
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  }
}

/**
 * Haversine distance between two points in km.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Filter offers by precise Haversine distance.
 * An offer matches if: distance(searchPoint, offerPoint) <= searchRadius + offer.serviceRadius
 */
export function filterByDistance(
  offers: Offer[],
  searchLat: number,
  searchLng: number,
  searchRadiusKm: number,
): Offer[] {
  return offers.filter((offer) => {
    const offerLat = offer.location?.lat
    const offerLng = offer.location?.lng
    const offerRadius = offer.location?.serviceRadius ?? 0

    // Skip offers without coordinates
    if (offerLat == null || offerLng == null) return false

    const distance = haversineDistance(searchLat, searchLng, offerLat, offerLng)
    return distance <= searchRadiusKm + offerRadius
  })
}
