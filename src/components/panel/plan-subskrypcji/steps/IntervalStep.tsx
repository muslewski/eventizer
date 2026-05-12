'use client'

import { CheckIcon, SparklesIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import type { StripePriceDetails } from '@/actions/stripe/products/getStripePrices'

const BETA_PRICE_ID = 'BETA'

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount / 100)
}

function getIntervalLabel(interval: string, intervalCount: number): string {
  if (interval === 'month' && intervalCount === 1) return 'Miesięcznie'
  if (interval === 'month' && intervalCount === 6) return 'Co 6 miesięcy'
  if (interval === 'year' && intervalCount === 1) return 'Rocznie'
  return `Co ${intervalCount} ${interval}`
}

export interface IntervalStepProps {
  availablePrices: StripePriceDetails[]
  isPricesLoading: boolean
  selectedPriceId: string | null
  onSelectPriceId: (id: string) => void
  showBetaOption: boolean
  selectedCategory: string
  requiredPlanName?: string
  onBack: () => void
  onNext: () => void
  isPending: boolean
  nextLabel?: string
}

export function IntervalStep({
  availablePrices,
  isPricesLoading,
  selectedPriceId,
  onSelectPriceId,
  showBetaOption,
  selectedCategory,
  requiredPlanName,
  onBack,
  onNext,
  isPending,
  nextLabel = 'Przejdź do płatności',
}: IntervalStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-bebas text-2xl tracking-wide">Wybierz okres rozliczeniowy</h2>
        <p className="text-sm text-muted-foreground">
          Kategoria: <span className="font-medium text-foreground">{selectedCategory}</span>
          {requiredPlanName && (
            <> — Plan: <span className="font-medium text-foreground">{requiredPlanName}</span></>
          )}
        </p>
      </div>

      {isPricesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="size-6" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {availablePrices.map((price) => {
            const isSelected = selectedPriceId === price.id
            const label = getIntervalLabel(
              price.recurring?.interval ?? 'month',
              price.recurring?.intervalCount ?? 1,
            )
            const formattedPrice = formatPrice(price.unitAmount ?? 0, price.currency)
            return (
              <button
                key={price.id}
                type="button"
                onClick={() => onSelectPriceId(price.id)}
                className={cn(
                  'flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors',
                  isSelected ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/30',
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex size-5 items-center justify-center rounded-full border',
                      isSelected
                        ? 'border-accent bg-accent text-accent-foreground'
                        : 'border-muted-foreground/30',
                    )}
                  >
                    {isSelected && <CheckIcon className="size-3" />}
                  </div>
                  <span className="font-medium">{label}</span>
                </div>
                <span className="font-bebas text-xl tracking-wide">{formattedPrice}</span>
              </button>
            )
          })}

          {showBetaOption && (
            <button
              type="button"
              onClick={() => onSelectPriceId(BETA_PRICE_ID)}
              className={cn(
                'flex items-center justify-between rounded-lg border border-dashed px-4 py-3 text-left transition-colors',
                selectedPriceId === BETA_PRICE_ID
                  ? 'border-accent bg-accent/5'
                  : 'border-border hover:border-accent/30',
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex size-5 items-center justify-center rounded-full border',
                    selectedPriceId === BETA_PRICE_ID
                      ? 'border-accent bg-accent text-accent-foreground'
                      : 'border-muted-foreground/30',
                  )}
                >
                  {selectedPriceId === BETA_PRICE_ID && <CheckIcon className="size-3" />}
                </div>
                <div className="flex items-center gap-2">
                  <SparklesIcon className="size-4 text-accent" />
                  <span className="font-medium">Dostęp Beta</span>
                  <Badge variant="outline" className="text-accent border-accent/30">
                    Za darmo
                  </Badge>
                </div>
              </div>
              <span className="font-bebas text-xl tracking-wide text-accent">0 PLN</span>
            </button>
          )}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" disabled={isPending} onClick={onBack}>
          <ChevronLeftIcon data-icon="inline-start" />
          Wstecz
        </Button>
        <Button disabled={!selectedPriceId || isPending} onClick={onNext}>
          {isPending && <Spinner data-icon="inline-start" />}
          {selectedPriceId === BETA_PRICE_ID ? 'Aktywuj dostęp beta' : nextLabel}
          <ChevronRightIcon data-icon="inline-end" />
        </Button>
      </div>
    </div>
  )
}
