export interface OfferPluralForm {
  count: string
  noun: 'oferta' | 'oferty' | 'ofert'
  verb: 'zostanie' | 'zostaną'
  participle: 'przeniesiona' | 'przeniesione' | 'przeniesionych'
}

export function pluralizeOffers(n: number): OfferPluralForm {
  const lastTwo = n % 100
  const last = n % 10

  if (n === 1) {
    return { count: '1', noun: 'oferta', verb: 'zostanie', participle: 'przeniesiona' }
  }
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) {
    return { count: String(n), noun: 'oferty', verb: 'zostaną', participle: 'przeniesione' }
  }
  return { count: String(n), noun: 'ofert', verb: 'zostanie', participle: 'przeniesionych' }
}
