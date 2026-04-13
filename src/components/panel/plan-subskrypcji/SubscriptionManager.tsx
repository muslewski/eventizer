'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  AlertTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RefreshCwIcon,
  SettingsIcon,
  TagIcon,
  CheckIcon,
  SparklesIcon,
} from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { CategoryPicker } from '@/components/panel/wizard/CategoryPicker'
import { createCheckoutSession } from '@/actions/stripe/createCheckoutSession'
import { activateBetaAccess } from '@/actions/stripe/activateBetaAccess'
import { getStripePrices, type StripePriceDetails } from '@/actions/stripe/products/getStripePrices'
import { cn } from '@/lib/utils'
import type { User, SubscriptionPlan, ServiceCategory } from '@/payload-types'
import type { CurrentSubscriptionDetails } from '@/actions/stripe/getCurrentSubscriptionDetails'

const BETA_PRICE_ID = 'BETA'

type ManagerView = 'status' | 'onboarding-category' | 'onboarding-price'

interface SubscriptionManagerProps {
  user: User
  subscription: CurrentSubscriptionDetails
  categories: ServiceCategory[]
  lang: string
  showBetaOption: boolean
}

function deriveInitialView(user: User): ManagerView {
  if (user.role === 'service-provider') return 'status'
  return 'onboarding-category'
}

// Find the requiredPlan by traversing the category path
function getRequiredPlanFromCategory(
  categories: ServiceCategory[],
  categoryString: string,
): SubscriptionPlan | null {
  if (!categoryString) return null
  const parts = categoryString.split(' > ')
  let currentItems = categories
  let requiredPlan: SubscriptionPlan | null = null

  for (const part of parts) {
    const found = currentItems.find((c) => c.name === part) as any
    if (!found) break
    if (found.requiredPlan && typeof found.requiredPlan === 'object') {
      requiredPlan = found.requiredPlan as SubscriptionPlan
    }
    if (found.subcategory_level_1?.length) {
      currentItems = found.subcategory_level_1
    } else if (found.subcategory_level_2?.length) {
      currentItems = found.subcategory_level_2
    } else {
      break
    }
  }

  return requiredPlan
}

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

export function SubscriptionManager({
  user,
  subscription,
  categories,
  lang,
  showBetaOption,
}: SubscriptionManagerProps) {
  const router = useRouter()
  const [view, setView] = React.useState<ManagerView>(() => deriveInitialView(user))
  const [selectedCategory, setSelectedCategory] = React.useState<string>(user.serviceCategory ?? '')
  const [selectedPriceId, setSelectedPriceId] = React.useState<string | null>(null)
  const [availablePrices, setAvailablePrices] = React.useState<StripePriceDetails[]>([])
  const [isPricesLoading, setIsPricesLoading] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()

  const categoryNames = selectedCategory ? selectedCategory.split(' > ') : []
  const categorySlugs = selectedCategory
    ? selectedCategory.split(' > ').map((n) => n.toLowerCase().replace(/\s+/g, '-'))
    : []

  const requiredPlan = getRequiredPlanFromCategory(categories, selectedCategory)
  const stripeProductId = requiredPlan?.stripeID ?? null

  // Fetch prices when category changes and we have a product ID
  React.useEffect(() => {
    if (!stripeProductId || view !== 'onboarding-price') {
      setAvailablePrices([])
      setSelectedPriceId(null)
      return
    }

    let cancelled = false
    setIsPricesLoading(true)

    getStripePrices(stripeProductId).then((result) => {
      if (cancelled) return
      if (result.success) {
        const sorted = [...result.prices].sort((a, b) => {
          const aMonths = a.recurring?.interval === 'year' ? a.recurring.intervalCount * 12 : (a.recurring?.intervalCount ?? 1)
          const bMonths = b.recurring?.interval === 'year' ? b.recurring.intervalCount * 12 : (b.recurring?.intervalCount ?? 1)
          return aMonths - bMonths
        })
        setAvailablePrices(sorted)
        if (sorted.length === 1) setSelectedPriceId(sorted[0].id)
      } else {
        toast.error('Nie udało się pobrać dostępnych cen.')
      }
      setIsPricesLoading(false)
    })

    return () => { cancelled = true }
  }, [stripeProductId, view])

  const stepNumber = view === 'onboarding-category' ? 1 : 2
  const isOnboarding = view === 'onboarding-category' || view === 'onboarding-price'

  // ---- checkout ----
  function handleCheckout() {
    if (!selectedPriceId) return

    startTransition(async () => {
      try {
        if (selectedPriceId === BETA_PRICE_ID) {
          const result = await activateBetaAccess({
            userId: user.id,
            categoryNames,
            categorySlugs,
          })
          if (result.success) {
            toast.success('Dostęp beta został aktywowany!')
            window.location.href = `/${lang}/panel/dashboard?checkout=success`
          } else {
            toast.error(result.error ?? 'Nie udało się aktywować dostępu beta.')
          }
          return
        }

        const result = await createCheckoutSession({
          priceId: selectedPriceId,
          userId: user.id,
          successUrl: `/${lang}/panel/plan-subskrypcji?success=1`,
          cancelUrl: `/${lang}/panel/plan-subskrypcji`,
          categoryNames,
          categorySlugs,
          userEmail: user.email,
        })

        if (result.url) {
          router.push(result.url)
        } else {
          toast.error('Nie udało się utworzyć sesji płatności.')
        }
      } catch {
        toast.error('Wystąpił błąd podczas tworzenia sesji płatności.')
      }
    })
  }

  // ---- renewal ----
  function handleRenew() {
    setSelectedCategory(user.serviceCategory ?? '')
    setSelectedPriceId(null)
    setView('onboarding-category')
  }

  // ========== ONBOARDING VIEWS ==========
  if (isOnboarding) {
    return (
      <div className="flex flex-col gap-6">
        {/* Step progress */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Krok {stepNumber} z 2</span>
            <span>{view === 'onboarding-category' ? 'Wybierz kategorię' : 'Wybierz okres rozliczeniowy'}</span>
          </div>
          <Progress value={stepNumber === 1 ? 50 : 100} />
        </div>

        {/* Step 1: Category */}
        {view === 'onboarding-category' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="font-bebas text-2xl tracking-wide">Wybierz swoją kategorię usług</h2>
              <p className="text-sm text-muted-foreground">
                Określ, jakiego rodzaju usługi świadczysz. Od wybranej kategorii zależy plan subskrypcji.
              </p>
            </div>

            <CategoryPicker
              categories={categories as any}
              value={selectedCategory}
              onChange={setSelectedCategory}
            />

            <div className="flex justify-end">
              <Button
                disabled={!selectedCategory || isPending}
                onClick={() => setView('onboarding-price')}
              >
                Dalej
                <ChevronRightIcon data-icon="inline-end" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Price / billing interval */}
        {view === 'onboarding-price' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="font-bebas text-2xl tracking-wide">Wybierz okres rozliczeniowy</h2>
              <p className="text-sm text-muted-foreground">
                Kategoria: <span className="font-medium text-foreground">{selectedCategory}</span>
                {requiredPlan && (
                  <> — Plan: <span className="font-medium text-foreground">{requiredPlan.name}</span></>
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
                      onClick={() => setSelectedPriceId(price.id)}
                      className={cn(
                        'flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors',
                        isSelected
                          ? 'border-accent bg-accent/5'
                          : 'border-border hover:border-accent/30',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex size-5 items-center justify-center rounded-full border',
                          isSelected ? 'border-accent bg-accent text-accent-foreground' : 'border-muted-foreground/30',
                        )}>
                          {isSelected && <CheckIcon className="size-3" />}
                        </div>
                        <span className="font-medium">{label}</span>
                      </div>
                      <span className="font-bebas text-xl tracking-wide">{formattedPrice}</span>
                    </button>
                  )
                })}

                {/* Beta option */}
                {showBetaOption && (
                  <button
                    type="button"
                    onClick={() => setSelectedPriceId(BETA_PRICE_ID)}
                    className={cn(
                      'flex items-center justify-between rounded-lg border border-dashed px-4 py-3 text-left transition-colors',
                      selectedPriceId === BETA_PRICE_ID
                        ? 'border-accent bg-accent/5'
                        : 'border-border hover:border-accent/30',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex size-5 items-center justify-center rounded-full border',
                        selectedPriceId === BETA_PRICE_ID ? 'border-accent bg-accent text-accent-foreground' : 'border-muted-foreground/30',
                      )}>
                        {selectedPriceId === BETA_PRICE_ID && <CheckIcon className="size-3" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <SparklesIcon className="size-4 text-accent" />
                        <span className="font-medium">Dostęp Beta</span>
                        <Badge variant="outline" className="text-accent border-accent/30">Za darmo</Badge>
                      </div>
                    </div>
                    <span className="font-bebas text-xl tracking-wide text-accent">0 PLN</span>
                  </button>
                )}
              </div>
            )}

            <div className="flex justify-between">
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() => setView('onboarding-category')}
              >
                <ChevronLeftIcon data-icon="inline-start" />
                Wstecz
              </Button>

              <Button
                disabled={!selectedPriceId || isPending}
                onClick={handleCheckout}
              >
                {isPending && <Spinner data-icon="inline-start" />}
                {selectedPriceId === BETA_PRICE_ID ? 'Aktywuj dostęp beta' : 'Przejdź do płatności'}
                <ChevronRightIcon data-icon="inline-end" />
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ========== STATUS VIEW ==========
  const isExpired = user.role === 'service-provider' && !subscription.hasSubscription
  const isActive = user.role === 'service-provider' && subscription.hasSubscription

  return (
    <div className="flex flex-col gap-6">
      {/* EXPIRED */}
      {isExpired && (
        <>
          <Alert variant="destructive">
            <AlertTriangleIcon />
            <AlertTitle>Subskrypcja wygasła</AlertTitle>
            <AlertDescription>
              Twoja subskrypcja wygasła. Twoje oferty zostały wycofane z publikacji.
            </AlertDescription>
          </Alert>

          <Button onClick={handleRenew} className="w-fit">
            <RefreshCwIcon data-icon="inline-start" />
            Odnów subskrypcję
          </Button>
        </>
      )}

      {/* ACTIVE */}
      {isActive && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="font-bebas text-2xl tracking-wide">
                {subscription.isBetaUser
                  ? 'Plan Beta'
                  : (subscription.currentPlan?.name ?? 'Aktywna subskrypcja')}
              </CardTitle>
              <Badge variant={subscription.cancelAtPeriodEnd ? 'destructive' : 'secondary'}>
                {subscription.cancelAtPeriodEnd ? 'Wygasa' : 'Aktywna'}
              </Badge>
            </div>
            <CardDescription>
              {user.serviceCategory && (
                <span>Kategoria: {user.serviceCategory}</span>
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            {subscription.currentPeriodEnd && (
              <p className="text-sm text-muted-foreground">
                {subscription.cancelAtPeriodEnd ? 'Wygasa' : 'Odnowienie'}:{' '}
                <span className="font-medium text-foreground">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString('pl-PL', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </p>
            )}

            {subscription.cancelAtPeriodEnd && (
              <Alert>
                <AlertTriangleIcon />
                <AlertTitle>Subskrypcja zostanie anulowana</AlertTitle>
                <AlertDescription>
                  Twoja subskrypcja nie zostanie automatycznie odnowiona.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() => {
                  setSelectedCategory(user.serviceCategory ?? '')
                  setView('onboarding-category')
                }}
              >
                <TagIcon data-icon="inline-start" />
                Zmień kategorię
              </Button>

              {!subscription.isBetaUser && (
                <Button variant="outline" asChild>
                  <a href="/app/account" target="_blank" rel="noopener noreferrer">
                    <SettingsIcon data-icon="inline-start" />
                    Zarządzaj płatnościami
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
