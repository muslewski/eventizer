'use client'

import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FlameIcon,
  SparklesIcon,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import {
  IntervalCardPicker,
  type IntervalCardOption,
} from './_IntervalCardPicker'
import { WizardRoiHint } from './_WizardRoiHint'
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

/**
 * Map a Stripe price interval to user-facing copy. Hardcoded to match the
 * product's discount structure (6mo = 1mo free, year = 3mo free) — these are
 * marketing promises, not derived from price math.
 */
function getIntervalCopy(interval: string, intervalCount: number) {
  if (interval === 'month' && intervalCount === 1) {
    return {
      label: 'Miesięcznie',
      tagline: 'Pełna elastyczność',
      perPeriod: '/miesiąc',
      highlight: false,
    } as const
  }
  if (interval === 'month' && intervalCount === 6) {
    return {
      label: 'Co 6 miesięcy',
      tagline: '1 miesiąc gratis',
      perPeriod: '/6 miesięcy',
      highlight: false,
    } as const
  }
  if (interval === 'year' && intervalCount === 1) {
    return {
      label: 'Rocznie',
      tagline: '3 miesiące gratis — najbardziej opłacalne',
      perPeriod: '/rok',
      highlight: true,
    } as const
  }
  // Fallback — shouldn't happen with current product setup, but keep the UI
  // resilient if Stripe ever returns an unexpected interval.
  return {
    label: `Co ${intervalCount} ${interval}`,
    tagline: '',
    perPeriod: `/${intervalCount} ${interval}`,
    highlight: false,
  } as const
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
  const headingId = 'interval-heading'

  const options: IntervalCardOption[] = availablePrices.map((price) => {
    const copy = getIntervalCopy(
      price.recurring?.interval ?? 'month',
      price.recurring?.intervalCount ?? 1,
    )
    return {
      value: price.id,
      label: copy.label,
      tagline: copy.tagline,
      formattedPrice: formatPrice(price.unitAmount ?? 0, price.currency),
      perPeriod: copy.perPeriod,
      highlight: copy.highlight
        ? { icon: FlameIcon, label: 'Najlepiej opłacalne' }
        : undefined,
    }
  })

  const isBetaSelected = selectedPriceId === BETA_PRICE_ID

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 id={headingId} className="font-bebas text-2xl tracking-wide">
          Wybierz okres rozliczeniowy
        </h2>
        <p className="text-sm italic text-muted-foreground">
          Im dłuższy plan, tym większa oszczędność.
        </p>
        {(selectedCategory || requiredPlanName) && (
          <p className="text-sm text-muted-foreground">
            Wybrano:{' '}
            <span className="font-medium text-foreground">
              {selectedCategory || requiredPlanName}
            </span>
          </p>
        )}
      </div>

      {isPricesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner className="size-6" />
        </div>
      ) : (
        <>
          <IntervalCardPicker
            ariaLabelledBy={headingId}
            options={options}
            value={selectedPriceId}
            onChange={onSelectPriceId}
          />

          {showBetaOption && (
            <button
              type="button"
              role="radio"
              aria-checked={isBetaSelected}
              onClick={() => onSelectPriceId(BETA_PRICE_ID)}
              className={cn(
                'group relative flex items-center justify-between gap-4 rounded-xl border border-dashed bg-background px-4 py-3.5 sm:px-5 sm:py-4 text-left',
                'transition-[border-color,box-shadow,background-color] duration-200 ease-out',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                isBetaSelected
                  ? 'border-accent bg-accent/[0.04] shadow-[inset_0_0_0_1px_rgba(210,140,8,0.18)]'
                  : 'border-accent/30 hover:border-accent/60 hover:bg-accent/[0.02]',
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  aria-hidden="true"
                  className={cn(
                    'flex size-9 sm:size-10 items-center justify-center rounded-lg border transition-colors',
                    isBetaSelected
                      ? 'bg-accent/15 border-accent/30 text-accent'
                      : 'bg-accent/[0.06] border-accent/20 text-accent/80 group-hover:bg-accent/10 group-hover:border-accent/30',
                  )}
                >
                  <SparklesIcon className="size-4 sm:size-5" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bebas text-lg sm:text-xl tracking-wide leading-none">
                      Dostęp Beta
                    </span>
                    <Badge variant="outline" className="text-accent border-accent/30">
                      Za darmo
                    </Badge>
                  </div>
                  <span className="text-xs italic text-muted-foreground">
                    Wczesny dostęp dla zaproszonych użytkowników.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bebas text-xl sm:text-2xl tracking-wide text-accent">
                  0 PLN
                </span>
                <div
                  aria-hidden="true"
                  className={cn(
                    'flex size-6 items-center justify-center rounded-full transition-all duration-200',
                    isBetaSelected
                      ? 'bg-accent text-accent-foreground scale-100 opacity-100'
                      : 'bg-transparent border border-border/40 scale-90 opacity-50 group-hover:opacity-90',
                  )}
                >
                  {isBetaSelected && <CheckIcon className="size-3.5" strokeWidth={3} />}
                </div>
              </div>
            </button>
          )}

          <WizardRoiHint>
            Koszt subskrypcji może zwrócić się już przy pierwszym kliencie.
          </WizardRoiHint>
        </>
      )}

      <div className="flex justify-between">
        <Button variant="outline" disabled={isPending} onClick={onBack}>
          <ChevronLeftIcon data-icon="inline-start" />
          Wstecz
        </Button>
        <Button disabled={!selectedPriceId || isPending} onClick={onNext}>
          {isPending && <Spinner data-icon="inline-start" />}
          {isBetaSelected ? 'Aktywuj dostęp beta' : nextLabel}
          <ChevronRightIcon data-icon="inline-end" />
        </Button>
      </div>
    </div>
  )
}
