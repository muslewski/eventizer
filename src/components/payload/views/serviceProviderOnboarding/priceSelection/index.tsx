'use client'

import { useState } from 'react'
import { StripePriceDetails } from '@/actions/stripe/products/getStripePrices'
import { validatePromoCode, type ValidatePromoCodeResult } from '@/actions/stripe/validatePromoCode'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Check, Loader2, Tag, X, CircleCheck, Sparkles } from 'lucide-react'

/** Sentinel value used when the user picks the free beta option */
export const BETA_PRICE_ID = 'BETA'

interface PriceSelectionProps {
  prices: StripePriceDetails[]
  selectedPriceId: string | null
  onPriceSelect: (priceId: string) => void
  isLoading?: boolean
  planName?: string
  currentPriceId?: string
  /** Called when promo code is validated or cleared */
  onPromoCodeChange?: (promoCodeId: string | null) => void
  /** When true, renders a special free-beta option at the top of the list */
  showBetaOption?: boolean
}

function getIntervalLabel(interval: string, intervalCount: number): string {
  if (interval === 'month' && intervalCount === 1) return 'Miesięcznie'
  if (interval === 'month' && intervalCount === 6) return 'Co 6 miesięcy'
  if (interval === 'year' && intervalCount === 1) return 'Rocznie'
  if (interval === 'month') return `Co ${intervalCount} miesiące`
  if (interval === 'year') return `Co ${intervalCount} lata`
  if (interval === 'week') return `Co ${intervalCount} tydzień`
  if (interval === 'day') return `Co ${intervalCount} dzień`
  return `${interval} / ${intervalCount}`
}

function getIntervalShortLabel(interval: string, intervalCount: number): string {
  if (interval === 'month' && intervalCount === 1) return '/ mies.'
  if (interval === 'month' && intervalCount === 6) return '/ 6 mies.'
  if (interval === 'year' && intervalCount === 1) return '/ rok'
  return `/ ${intervalCount} ${interval}`
}

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100)
}

/** Check if a price is a yearly plan */
function isYearlyPrice(price: StripePriceDetails): boolean {
  if (!price.recurring) return false
  return (
    price.recurring.interval === 'year' ||
    (price.recurring.interval === 'month' && price.recurring.intervalCount >= 12)
  )
}

/** Apply promo discount to an amount */
function applyDiscount(
  amount: number,
  percentOff?: number | null,
  amountOff?: number | null,
): number {
  if (percentOff) return Math.round(amount * (1 - percentOff / 100))
  if (amountOff) return Math.max(0, amount - amountOff)
  return amount
}

function getMonthlyEquivalent(
  amount: number,
  interval: string,
  intervalCount: number,
): number | null {
  if (interval === 'month' && intervalCount === 1) return null // no need to show for monthly
  if (interval === 'month') return Math.round(amount / intervalCount)
  if (interval === 'year') return Math.round(amount / (12 * intervalCount))
  if (interval === 'week') return null
  if (interval === 'day') return null
  return null
}

function getSavingsPercent(
  monthlyPrice: StripePriceDetails | undefined,
  price: StripePriceDetails,
): number | null {
  if (!monthlyPrice || !monthlyPrice.unitAmount || !price.unitAmount || !price.recurring)
    return null
  if (
    price.recurring.interval === 'month' &&
    price.recurring.intervalCount === 1
  )
    return null

  const monthlyEquivalent = getMonthlyEquivalent(
    price.unitAmount,
    price.recurring.interval,
    price.recurring.intervalCount,
  )
  if (!monthlyEquivalent) return null

  const monthlyBase = monthlyPrice.unitAmount / 100
  const savings = Math.round(((monthlyBase - monthlyEquivalent / 100) / monthlyBase) * 100)
  return savings > 0 ? savings : null
}

/** Sort prices: monthly first, then 6-month, then yearly */
function sortPrices(prices: StripePriceDetails[]): StripePriceDetails[] {
  const intervalOrder = (p: StripePriceDetails): number => {
    if (!p.recurring) return 999
    if (p.recurring.interval === 'month' && p.recurring.intervalCount === 1) return 0
    if (p.recurring.interval === 'month' && p.recurring.intervalCount === 6) return 1
    if (p.recurring.interval === 'year' && p.recurring.intervalCount === 1) return 2
    return 3
  }
  return [...prices].sort((a, b) => intervalOrder(a) - intervalOrder(b))
}

export function PriceSelection({
  prices,
  selectedPriceId,
  onPriceSelect,
  isLoading = false,
  planName,
  currentPriceId,
  onPromoCodeChange,
  showBetaOption = false,
}: PriceSelectionProps) {
  const [promoInput, setPromoInput] = useState('')
  const [promoValidating, setPromoValidating] = useState(false)
  const [promoResult, setPromoResult] = useState<ValidatePromoCodeResult | null>(null)
  const [promoExpanded, setPromoExpanded] = useState(false)

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return
    setPromoValidating(true)
    const result = await validatePromoCode(promoInput, selectedPriceId || undefined)
    setPromoResult(result)
    setPromoValidating(false)
    if (result.valid) {
      onPromoCodeChange?.(result.promotionCodeId ?? null)
    }
  }

  const handleClearPromo = () => {
    setPromoInput('')
    setPromoResult(null)
    onPromoCodeChange?.(null)
  }
  if (isLoading) {
    return (
      <Card className="border-2 border-[var(--theme-elevation-150)] bg-[var(--theme-elevation-50)]">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--theme-elevation-400)]" />
          <span className="ml-3 text-[var(--theme-elevation-500)]">
            Ładowanie dostępnych planów cenowych...
          </span>
        </CardContent>
      </Card>
    )
  }

  if (prices.length === 0) {
    return (
      <Card className="border-2 border-destructive/30 bg-destructive/5">
        <CardContent className="py-8 text-center">
          <p className="text-destructive">
            Nie znaleziono aktywnych cen dla wybranego planu. Skontaktuj się z nami.
          </p>
        </CardContent>
      </Card>
    )
  }

  const sortedPrices = sortPrices(prices)
  const monthlyPrice = sortedPrices.find(
    (p) => p.recurring?.interval === 'month' && p.recurring.intervalCount === 1,
  )

  // Find the best value (highest savings)
  let bestValueId: string | null = null
  let maxSavings = 0
  for (const price of sortedPrices) {
    const savings = getSavingsPercent(monthlyPrice, price)
    if (savings && savings > maxSavings) {
      maxSavings = savings
      bestValueId = price.id
    }
  }

  return (
    <Card
      className={cn(
        'border-2',
        'border-accent/10 dark:border-accent/20',
        'bg-[var(--theme-elevation-50)]',
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Wybierz okres rozliczeniowy</CardTitle>
        <CardDescription>
          Z kodem <strong>EVENTIZER100</strong> za darmo do 6 miesięcy.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Free beta option */}
        {showBetaOption && (
          <button
            onClick={() => onPriceSelect(BETA_PRICE_ID)}
            className={cn(
              'w-full flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left',
              'hover:border-emerald-500/50 hover:bg-emerald-500/5',
              selectedPriceId === BETA_PRICE_ID
                ? 'border-emerald-500/70 bg-emerald-500/10'
                : 'border-[var(--theme-elevation-150)] bg-[var(--theme-elevation-0)]',
            )}
          >
            {/* Selection indicator */}
            <div
              className={cn(
                'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors mt-0.5',
                selectedPriceId === BETA_PRICE_ID
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-[var(--theme-elevation-300)]',
              )}
            >
              {selectedPriceId === BETA_PRICE_ID && <Check className="w-3.5 h-3.5" />}
            </div>

            {/* Beta info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-[var(--theme-text)]">Darmowa wersja beta</span>
                <Badge className="text-[0.55rem] bg-emerald-500 hover:bg-emerald-500 text-white border-0">
                  <Sparkles className="w-2.5 h-2.5 mr-1" />
                  BETA
                </Badge>
              </div>
              <p className="text-sm text-[var(--theme-elevation-500)] mt-1">
                Wybierz tę opcję, a ominie cię formularz płatności kompletnie. Opcja dostępna wyłącznie przez okres beta.
              </p>
            </div>

            {/* Free label */}
            <div className="flex-shrink-0 text-right">
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">0 zł</span>
              <span className="text-sm text-[var(--theme-elevation-500)] ml-1">/ beta</span>
            </div>
          </button>
        )}

        {sortedPrices.map((price) => {
          if (!price.recurring || price.unitAmount === null) return null

          const isSelected = selectedPriceId === price.id
          const isCurrent = currentPriceId === price.id
          const isBestValue = price.id === bestValueId
          const isYearly = isYearlyPrice(price)
          const hasPromo = promoResult?.valid === true
          const promoApplies = hasPromo && !isYearly

          const effectiveAmount = promoApplies
            ? applyDiscount(price.unitAmount, promoResult.percentOff, promoResult.amountOff)
            : price.unitAmount

          const intervalLabel = getIntervalLabel(
            price.recurring.interval,
            price.recurring.intervalCount,
          )
          const intervalShort = getIntervalShortLabel(
            price.recurring.interval,
            price.recurring.intervalCount,
          )
          const formattedTotal = formatPrice(effectiveAmount, price.currency)
          const originalFormatted = promoApplies ? formatPrice(price.unitAmount, price.currency) : null
          const monthlyEquiv = getMonthlyEquivalent(
            effectiveAmount,
            price.recurring.interval,
            price.recurring.intervalCount,
          )
          const savings = getSavingsPercent(monthlyPrice, price)

          return (
            <button
              key={price.id}
              onClick={() => {
                onPriceSelect(price.id)
                // If selecting a yearly plan while promo is active, clear the promo
                if (isYearly && promoResult?.valid) {
                  handleClearPromo()
                }
              }}
              className={cn(
                'w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left',
                'hover:border-accent/40 hover:bg-accent/5',
                isSelected
                  ? 'border-accent/60 bg-accent/10 dark:border-accent/50'
                  : 'border-[var(--theme-elevation-150)] bg-[var(--theme-elevation-0)]',
              )}
            >
              {/* Selection indicator */}
              <div
                className={cn(
                  'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                  isSelected
                    ? 'border-accent bg-accent text-white'
                    : 'border-[var(--theme-elevation-300)]',
                )}
              >
                {isSelected && <Check className="w-3.5 h-3.5" />}
              </div>

              {/* Price info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[var(--theme-text)]">{intervalLabel}</span>
                  {isCurrent && (
                    <Badge variant="outline" className="text-[0.55rem]">
                      Obecny
                    </Badge>
                  )}
                  {isBestValue && (
                    <Badge variant="golden" className="text-[0.55rem]">
                      Najlepsza wartość
                    </Badge>
                  )}
                  {savings && !promoApplies && (
                    <Badge variant="default" className="text-[0.55rem]">
                      -{savings}%
                    </Badge>
                  )}
                  {promoApplies && (
                    <Badge variant="default" className="text-[0.55rem] bg-green-600">
                      Kod zastosowany
                    </Badge>
                  )}
                  {hasPromo && isYearly && (
                    <Badge variant="outline" className="text-[0.55rem] text-muted-foreground">
                      Kod nie dotyczy
                    </Badge>
                  )}
                </div>
                {monthlyEquiv !== null && (
                  <p className="text-sm text-[var(--theme-elevation-500)] mt-0.5">
                    {formatPrice(monthlyEquiv, price.currency)} / miesiąc
                  </p>
                )}
              </div>

              {/* Total price */}
              <div className="flex-shrink-0 text-right">
                {originalFormatted && (
                  <span className="text-sm text-[var(--theme-elevation-400)] line-through mr-2">
                    {originalFormatted}
                  </span>
                )}
                <span className={cn('text-lg font-bold', promoApplies ? 'text-green-600 dark:text-green-400' : 'text-[var(--theme-text)]')}>
                  {formattedTotal}
                </span>
                <span className="text-sm text-[var(--theme-elevation-500)] ml-1">
                  {intervalShort}
                </span>
              </div>
            </button>
          )
        })}

        {/* Promo code section */}
        <div className="pt-2 border-t border-[var(--theme-elevation-100)]">
          {promoResult?.valid ? (
            // Applied state
            <div className="flex items-center justify-between gap-2 rounded-lg bg-green-500/10 border border-green-500/30 px-4 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <CircleCheck className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-800 dark:text-green-300 truncate">
                  {promoResult.couponName}
                  {promoResult.percentOff
                    ? ` (−${promoResult.percentOff}%)`
                    : promoResult.amountOff
                      ? ` (−${(promoResult.amountOff / 100).toFixed(0)} ${promoResult.currency?.toUpperCase()})`
                      : ''}
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearPromo}
                className="shrink-0 p-1 rounded-md text-green-700 hover:bg-green-500/20 dark:text-green-400 transition-colors"
                aria-label="Usuń kod promocyjny"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            // Input state
            <>
              {!promoExpanded ? (
                <button
                  type="button"
                  onClick={() => setPromoExpanded(true)}
                  className="flex items-center gap-1.5 text-sm text-[var(--theme-elevation-500)] hover:text-[var(--theme-text)] transition-colors"
                >
                  <Tag className="h-3.5 w-3.5" />
                  Masz kod promocyjny?
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => {
                        setPromoInput(e.target.value.toUpperCase())
                        if (promoResult && !promoResult.valid) setPromoResult(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleApplyPromo()
                        }
                      }}
                      placeholder="Wpisz kod"
                      className="flex-1 rounded-md border border-[var(--theme-elevation-200)] bg-[var(--theme-elevation-0)] px-3 py-2 text-sm placeholder:text-[var(--theme-elevation-400)] focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40"
                      disabled={promoValidating}
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      disabled={promoValidating || !promoInput.trim()}
                      className={cn(
                        'rounded-md px-4 py-2 text-sm font-medium transition-colors',
                        'bg-accent/10 text-accent-foreground hover:bg-accent/20',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                      )}
                    >
                      {promoValidating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Zastosuj'
                      )}
                    </button>
                  </div>
                  {promoResult && !promoResult.valid && (
                    <p className="text-xs text-destructive">{promoResult.error}</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
