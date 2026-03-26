interface FormatOfferPriceOptions {
  hasPriceRange?: boolean | null
  price?: number | null
  priceFrom?: number | null
  priceTo?: number | null
}

export function formatOfferPrice({
  hasPriceRange,
  price,
  priceFrom,
  priceTo,
}: FormatOfferPriceOptions): string {
  if (!hasPriceRange) {
    return `${(price ?? 0).toLocaleString('pl-PL')} zł`
  }

  const hasFrom = priceFrom != null
  const hasTo = priceTo != null

  if (hasFrom && hasTo) {
    if (priceFrom === priceTo) return `${priceFrom.toLocaleString('pl-PL')} zł`
    return `${priceFrom.toLocaleString('pl-PL')} - ${priceTo.toLocaleString('pl-PL')} zł`
  }

  if (hasFrom) return `od ${priceFrom.toLocaleString('pl-PL')} zł`
  if (hasTo) return `do ${priceTo.toLocaleString('pl-PL')} zł`

  return '0 zł'
}
