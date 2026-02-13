'use client'

import { StripePriceDetails } from '@/actions/stripe/products/getStripePrices'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Check, Loader2 } from 'lucide-react'

interface PriceSelectionProps {
  prices: StripePriceDetails[]
  selectedPriceId: string | null
  onPriceSelect: (priceId: string) => void
  isLoading?: boolean
  planName?: string
  currentPriceId?: string
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
}: PriceSelectionProps) {
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
        {/* {planName && (
          <CardDescription>
            Plan: <strong>{planName}</strong>
          </CardDescription>
        )} */}
      </CardHeader>

      <CardContent className="space-y-3">
        {sortedPrices.map((price) => {
          if (!price.recurring || price.unitAmount === null) return null

          const isSelected = selectedPriceId === price.id
          const isCurrent = currentPriceId === price.id
          const isBestValue = price.id === bestValueId
          const intervalLabel = getIntervalLabel(
            price.recurring.interval,
            price.recurring.intervalCount,
          )
          const intervalShort = getIntervalShortLabel(
            price.recurring.interval,
            price.recurring.intervalCount,
          )
          const formattedTotal = formatPrice(price.unitAmount, price.currency)
          const monthlyEquiv = getMonthlyEquivalent(
            price.unitAmount,
            price.recurring.interval,
            price.recurring.intervalCount,
          )
          const savings = getSavingsPercent(monthlyPrice, price)

          return (
            <button
              key={price.id}
              onClick={() => onPriceSelect(price.id)}
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
                  {savings && (
                    <Badge variant="default" className="text-[0.55rem]">
                      -{savings}%
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
                <span className="text-lg font-bold text-[var(--theme-text)]">
                  {formattedTotal}
                </span>
                <span className="text-sm text-[var(--theme-elevation-500)] ml-1">
                  {intervalShort}
                </span>
              </div>
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}
