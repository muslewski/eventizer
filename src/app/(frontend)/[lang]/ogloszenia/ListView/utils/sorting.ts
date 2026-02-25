import type { Offer } from '@/payload-types'
import type { SortOption } from '../types'

/**
 * Get the sort field for payload query
 * Returns the field name with optional '-' prefix for descending
 */
export function getSortField(sortOption: SortOption): string {
  switch (sortOption) {
    case 'newest':
      return '-createdAt'
    case 'oldest':
      return 'createdAt'
    case 'title-asc':
      return 'title'
    case 'title-desc':
      return '-title'
    // Price sorting handled in-memory due to range calculations
    case 'price-asc':
    case 'price-desc':
      return '-createdAt' // Default sort when price sorting is applied
    // Random sorting handled in-memory after fetching
    case 'random':
      return '-createdAt' // Fetch order doesn't matter, will be shuffled
    default:
      return '-createdAt'
  }
}

/**
 * Check if sorting requires in-memory processing
 */
export function requiresInMemorySort(sortOption: SortOption): boolean {
  return sortOption === 'price-asc' || sortOption === 'price-desc' || sortOption === 'random'
}

/**
 * Calculate effective price for sorting
 * Uses average of min/max for range, or single value
 */
export function calculateEffectivePrice(offer: Offer): number {
  // Single price offer
  if (!offer.hasPriceRange) {
    return offer.price ?? 0
  }

  // Price range offer
  const priceFrom = offer.priceFrom ?? 0
  const priceTo = offer.priceTo ?? priceFrom

  return (priceFrom + priceTo) / 2
}

/**
 * Seeded pseudo-random number generator (mulberry32).
 * Returns a function that produces deterministic values in [0, 1) for the given seed.
 */
function mulberry32(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Fisher-Yates shuffle using a seeded PRNG for deterministic ordering.
 * If no seed is provided, falls back to Math.random().
 */
function shuffleArray<T>(array: T[], seed?: number): T[] {
  const rng = seed !== undefined ? mulberry32(seed) : Math.random
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Sort offers in-memory for complex sorting requirements.
 * Accepts an optional seed for deterministic random ordering across pages.
 */
export function sortOffersInMemory(offers: Offer[], sortOption: SortOption, seed?: number): Offer[] {
  if (!requiresInMemorySort(sortOption)) {
    return offers
  }

  switch (sortOption) {
    case 'random':
      return shuffleArray(offers, seed)
    case 'price-asc': {
      const sorted = [...offers]
      sorted.sort((a, b) => calculateEffectivePrice(a) - calculateEffectivePrice(b))
      return sorted
    }
    case 'price-desc': {
      const sorted = [...offers]
      sorted.sort((a, b) => calculateEffectivePrice(b) - calculateEffectivePrice(a))
      return sorted
    }
    default:
      return offers
  }
}

/**
 * Validate and parse sort option from URL param
 */
export function parseSortOption(value?: string): SortOption {
  const validOptions: SortOption[] = [
    'random',
    'newest',
    'oldest',
    'price-asc',
    'price-desc',
    'title-asc',
    'title-desc',
  ]
  if (value && validOptions.includes(value as SortOption)) {
    return value as SortOption
  }

  return 'random' // Default sort option - randomized for fairness
}

/**
 * Sort option display labels (for UI)
 */
export const sortOptionLabels: Record<SortOption, string> = {
  random: 'Losowe',
  newest: 'Najnowsze',
  oldest: 'Najstarsze',
  'price-asc': 'Cena: od najniższej',
  'price-desc': 'Cena: od najwyższej',
  'title-asc': 'Alfabetycznie A-Z',
  'title-desc': 'Alfabetycznie Z-A',
}
