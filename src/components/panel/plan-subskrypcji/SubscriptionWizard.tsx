'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm, FormProvider, useFormContext } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { planChangeSchema, type WizardFormData } from './lib/planChangeSchema'
import {
  wizardSequence,
  type WizardStep,
  type WizardEntry,
} from './lib/wizardSequence'
import { resolvePlanFromSelection } from './lib/resolvePlanFromSelection'
import { getDisplayPlanName } from './lib/getDisplayPlanName'
import { PlanKindStep } from './steps/PlanKindStep'
import { CategoryStep } from './steps/CategoryStep'
import { TierStep } from './steps/TierStep'
import { IntervalStep } from './steps/IntervalStep'
import { ImpactSummaryStep } from './steps/ImpactSummaryStep'
import { WizardStepIndicator } from '@/components/panel/wizard/WizardStepIndicator'
import { createCheckoutSession } from '@/actions/stripe/createCheckoutSession'
import { activateBetaAccess } from '@/actions/stripe/activateBetaAccess'
import {
  getStripePrices,
  type StripePriceDetails,
} from '@/actions/stripe/products/getStripePrices'
import type { User, ServiceCategory, SubscriptionPlan } from '@/payload-types'
import type { CurrentSubscriptionDetails } from '@/actions/stripe/getCurrentSubscriptionDetails'

const BETA_PRICE_ID = 'BETA'

interface SubscriptionWizardProps {
  entry: WizardEntry
  user: User
  subscription: CurrentSubscriptionDetails
  categories: ServiceCategory[]
  plans: SubscriptionPlan[]
  lang: string
  showBetaOption: boolean
  onExit: () => void
}

export function SubscriptionWizard(props: SubscriptionWizardProps) {
  const { entry, user, subscription, categories, plans, lang, showBetaOption, onExit } = props
  const plansBySlug = React.useMemo(
    () => new Map(plans.filter((p) => p.slug).map((p) => [p.slug as string, p])),
    [plans],
  )

  const form = useForm<WizardFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(planChangeSchema) as any,
    defaultValues: {
      selectedKind: entry === 'change-category' ? 'single' : undefined,
      selectedCategoryPath: user.serviceCategorySlug ?? undefined,
      keepScheduledCancel: !subscription.cancelAtPeriodEnd,
    },
  })

  const kind = form.watch('selectedKind')
  const sequence = wizardSequence(entry, kind)
  const [stepIdx, setStepIdx] = React.useState(0)
  const step = sequence[stepIdx]

  // beforeunload warning while wizard is dirty past step 1
  React.useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!form.formState.isDirty || stepIdx === 0) return
      e.preventDefault()
      // e.returnValue removed (deprecated); preventDefault() is sufficient in modern browsers
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [form.formState.isDirty, stepIdx])

  function goNext() {
    if (stepIdx < sequence.length - 1) setStepIdx(stepIdx + 1)
  }
  function goBack() {
    if (stepIdx > 0) setStepIdx(stepIdx - 1)
  }

  return (
    <FormProvider {...form}>
      <div className="flex flex-col gap-6">
        <nav aria-label="Postęp kreatora">
          <WizardStepIndicator
            steps={sequence.map((s, i) => ({
              label: stepLabel(s),
              status:
                i < stepIdx
                  ? 'valid'
                  : i === stepIdx
                  ? 'current'
                  : 'upcoming',
            }))}
            onStepClick={(idx) => {
              if (idx < stepIdx) setStepIdx(idx)
            }}
          />
        </nav>
        {step === 'kind' && (
          <PlanKindStep
            onNext={goNext}
            onCancel={entry !== 'onboarding' ? onExit : undefined}
          />
        )}
        {step === 'category' && (
          <CategoryStep
            categories={categories}
            plansBySlug={plansBySlug}
            onBack={stepIdx > 0 ? goBack : undefined}
            onCancel={stepIdx === 0 && entry !== 'onboarding' ? onExit : undefined}
            onNext={goNext}
          />
        )}
        {step === 'tier' && <TierStep onBack={goBack} onNext={goNext} />}
        {step === 'interval' && (
          <IntervalStepBridge
            kind={kind}
            user={user}
            categories={categories}
            plansBySlug={plansBySlug}
            showBetaOption={showBetaOption}
            lang={lang}
            entry={entry}
            onBack={goBack}
            onNext={goNext}
          />
        )}
        {step === 'summary' && (
          <ImpactSummaryStep
            subscription={subscription}
            user={user}
            plansBySlug={plansBySlug}
            categories={categories}
            onBack={goBack}
            onExit={onExit}
          />
        )}
      </div>
    </FormProvider>
  )
}

function stepLabel(s: WizardStep): string {
  return {
    kind: 'Typ planu',
    category: 'Kategoria',
    tier: 'Pakiet',
    interval: 'Okres rozliczeniowy',
    summary: 'Podsumowanie',
  }[s]
}

function slugToName(slug: string): string {
  return slug
    .split('-')
    .map((w) => (w[0]?.toUpperCase() ?? '') + w.slice(1))
    .join(' ')
}

function IntervalStepBridge({
  kind,
  user,
  categories,
  plansBySlug,
  showBetaOption,
  lang,
  entry,
  onBack,
  onNext,
}: {
  kind: 'single' | 'multi' | undefined
  user: User
  categories: ServiceCategory[]
  plansBySlug: Map<string, SubscriptionPlan>
  showBetaOption: boolean
  lang: string
  entry: WizardEntry
  onBack: () => void
  onNext: () => void
}) {
  const form = useFormContext<WizardFormData>()
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [availablePrices, setAvailablePrices] = React.useState<StripePriceDetails[]>([])
  const [isPricesLoading, setIsPricesLoading] = React.useState(false)

  const resolved = resolvePlanFromSelection({
    kind,
    categoryPath: form.watch('selectedCategoryPath'),
    tierSlug: form.watch('selectedTierSlug'),
    categories,
    plansBySlug,
  })

  React.useEffect(() => {
    if (!resolved?.stripeID) {
      setAvailablePrices([])
      return
    }
    let cancelled = false
    setIsPricesLoading(true)
    getStripePrices(resolved.stripeID).then((r) => {
      if (cancelled) return
      if (r.success) {
        const sorted = [...r.prices].sort((a, b) => {
          const aM =
            a.recurring?.interval === 'year'
              ? (a.recurring.intervalCount ?? 1) * 12
              : a.recurring?.intervalCount ?? 1
          const bM =
            b.recurring?.interval === 'year'
              ? (b.recurring.intervalCount ?? 1) * 12
              : b.recurring?.intervalCount ?? 1
          return aM - bM
        })
        setAvailablePrices(sorted)
      } else {
        toast.error('Nie udało się załadować cen.')
      }
      setIsPricesLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [resolved?.stripeID])

  const selectedPriceId = form.watch('selectedPriceId') ?? null
  const categoryPath = form.watch('selectedCategoryPath') ?? ''
  const categoryNames = categoryPath ? categoryPath.split('/').map(slugToName) : []
  const categorySlugs = categoryPath ? categoryPath.split('/') : []

  function handleSelectPrice(id: string) {
    form.setValue('selectedPriceId', id)
    // Also capture intervalKey for downstream actions (summary needs it)
    if (id === BETA_PRICE_ID) {
      form.setValue('selectedIntervalKey', 'beta')
    } else {
      const price = availablePrices.find((p) => p.id === id)
      if (price?.recurring) {
        form.setValue(
          'selectedIntervalKey',
          `${price.recurring.interval}/${price.recurring.intervalCount}`,
        )
      }
    }
  }

  function handleNext() {
    if (entry === 'onboarding') {
      // Onboarding → call createCheckoutSession or activateBetaAccess
      startTransition(async () => {
        try {
          if (selectedPriceId === BETA_PRICE_ID) {
            const r = await activateBetaAccess({
              userId: user.id,
              categoryNames,
              categorySlugs,
              maxOffers: resolved?.maxOffers ?? 1,
            })
            if (r.success) {
              toast.success('Dostęp beta został aktywowany!')
              window.location.href = `/${lang}/panel/dashboard?checkout=success`
            } else {
              toast.error(r.error ?? 'Nie udało się aktywować dostępu beta.')
            }
            return
          }
          if (!selectedPriceId) return
          const r = await createCheckoutSession({
            priceId: selectedPriceId,
            userId: user.id,
            successUrl: `/${lang}/panel/plan-subskrypcji?success=1`,
            cancelUrl: `/${lang}/panel/plan-subskrypcji`,
            categoryNames,
            categorySlugs,
            userEmail: user.email,
          })
          if (r.url) router.push(r.url)
          else toast.error('Nie udało się utworzyć sesji płatności.')
        } catch {
          toast.error('Wystąpił błąd podczas tworzenia sesji płatności.')
        }
      })
    } else {
      // change-plan / change-category → advance to summary step
      onNext()
    }
  }

  return (
    <IntervalStep
      availablePrices={availablePrices}
      isPricesLoading={isPricesLoading}
      selectedPriceId={selectedPriceId}
      onSelectPriceId={handleSelectPrice}
      showBetaOption={showBetaOption}
      selectedCategory={categoryNames.join(' > ') || (kind === 'multi' ? 'Wszystkie kategorie' : '')}
      requiredPlanName={getDisplayPlanName(resolved) || undefined}
      onBack={onBack}
      onNext={handleNext}
      isPending={isPending}
      nextLabel={entry === 'onboarding' ? 'Przejdź do płatności' : 'Dalej'}
    />
  )
}
