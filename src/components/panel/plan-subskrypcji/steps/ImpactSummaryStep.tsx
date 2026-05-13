'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useFormContext } from 'react-hook-form'
import { toast } from 'sonner'
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  AlertTriangleIcon,
  ClockIcon,
  FileEditIcon,
  InfoIcon,
  RefreshCcwIcon,
  SparklesIcon,
  TagIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SummaryNotice } from './_SummaryNotice'
import { Checkbox } from '@/components/ui/checkbox'
import { Spinner } from '@/components/ui/spinner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  computePlanChangeImpact,
  type PlanChangeImpact,
} from '@/actions/stripe/computePlanChangeImpact'
import { changePlan } from '@/actions/stripe/changePlan'
import { updateBetaUserPlan } from '@/actions/stripe/updateBetaUserPlan'
import { resolvePlanFromSelection } from '../lib/resolvePlanFromSelection'
import { pluralizeOffers } from '../lib/pluralizeOffers'
import { getDisplayPlanName } from '../lib/getDisplayPlanName'
import type { WizardFormData } from '../lib/planChangeSchema'
import type { User, SubscriptionPlan, ServiceCategory } from '@/payload-types'
import type { CurrentSubscriptionDetails } from '@/actions/stripe/getCurrentSubscriptionDetails'

interface ImpactSummaryStepProps {
  subscription: CurrentSubscriptionDetails
  user: User
  plansBySlug: Map<string, SubscriptionPlan>
  categories: ServiceCategory[]
  onBack: () => void
  onExit: () => void
}

function slugToName(slug: string): string {
  return slug
    .split('-')
    .map((w) => (w[0]?.toUpperCase() ?? '') + w.slice(1))
    .join(' ')
}

/**
 * Format a category slug path like "music/dj/dj-weselny" into a readable
 * breadcrumb "Music > Dj > Dj weselny". When the path has only one segment,
 * just title-case it.
 */
function formatCategoryPath(slugPath: string): string {
  if (!slugPath) return ''
  return slugPath
    .split('/')
    .map(slugToName)
    .join(' > ')
}

export function ImpactSummaryStep({
  subscription,
  user,
  plansBySlug,
  categories,
  onBack,
  onExit,
}: ImpactSummaryStepProps) {
  const form = useFormContext<WizardFormData>()
  const router = useRouter()
  const [isLocked, setIsLocked] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()
  const [impact, setImpact] = React.useState<PlanChangeImpact | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const selectedKind = form.watch('selectedKind')
  const selectedTierSlug = form.watch('selectedTierSlug')
  const selectedCategoryPath = form.watch('selectedCategoryPath')
  const intervalKey = form.watch('selectedIntervalKey') ?? 'month/1'
  const keepScheduledCancel = form.watch('keepScheduledCancel')

  const resolvedPlan = resolvePlanFromSelection({
    kind: selectedKind,
    categoryPath: selectedCategoryPath,
    tierSlug: selectedTierSlug,
    categories,
    plansBySlug,
  })
  const newPlanId = resolvedPlan?.id

  // Category fields are meaningful ONLY on the Single path. For Multi/Agency the
  // wizard skips category entirely; ignore any stale form value carried over from
  // the user's previous Single-tier subscription.
  const useCategoryFields = selectedKind === 'single' && !!selectedCategoryPath
  const categoryNames = useCategoryFields
    ? selectedCategoryPath!.split('/').map(slugToName)
    : undefined
  const categorySlugs = useCategoryFields
    ? selectedCategoryPath!.split('/')
    : undefined

  const isBeta = user.betaAccess === true

  React.useEffect(() => {
    if (!newPlanId) return
    setError(null)
    let cancelled = false
    computePlanChangeImpact({ newPlanId, intervalKey })
      .then((r) => {
        if (cancelled) return
        if (r.success) setImpact(r.data)
        else setError(r.message)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('computePlanChangeImpact threw:', err)
        setError(
          'Nie udało się obliczyć skutków zmiany. Sprawdź połączenie z internetem i spróbuj ponownie.',
        )
      })
    return () => {
      cancelled = true
    }
  }, [newPlanId, intervalKey])

  function handleConfirm() {
    if (!newPlanId || !impact) return
    setIsLocked(true)
    const isSameDisplay =
      getDisplayPlanName(impact.currentPlan) === getDisplayPlanName(impact.newPlan)
    const successMessage =
      impact.changeType === 'interval_only'
        ? 'Okres rozliczeniowy został zaktualizowany.'
        : isSameDisplay
        ? 'Kategoria została zaktualizowana.'
        : 'Plan został zaktualizowany.'
    startTransition(async () => {
      try {
        const result = isBeta
          ? await updateBetaUserPlan({ newPlanId, categoryNames, categorySlugs })
          : await changePlan({
              newPlanId,
              intervalKey,
              categoryNames,
              categorySlugs,
              expectedCurrentPlanId: subscription.currentPlan?.id ?? null,
              keepScheduledCancel: keepScheduledCancel ?? true,
            })
        if (result.success) {
          toast.success(successMessage)
          onExit()
          router.refresh()
          return
        }
        if (result.error === 'STALE_PLAN') {
          toast.error('Plan zmienił się w innej karcie. Odświeżamy stronę…')
          router.refresh()
        } else {
          toast.error(result.message)
        }
        setIsLocked(false)
      } catch (err) {
        console.error('handleConfirm threw:', err)
        toast.error('Nie udało się zmienić planu. Sprawdź połączenie i spróbuj ponownie.')
        setIsLocked(false)
      }
    })
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <SummaryNotice
          icon={AlertTriangleIcon}
          title="Nie udało się obliczyć skutków zmiany"
          variant="destructive"
        >
          {error}
        </SummaryNotice>
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ChevronLeftIcon data-icon="inline-start" /> Wstecz
          </Button>
        </div>
      </div>
    )
  }

  if (!impact) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-center py-12">
          <Spinner className="size-6" />
        </div>
        {/* Always provide an escape hatch so the user is never stuck on a spinner. */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ChevronLeftIcon data-icon="inline-start" /> Wstecz
          </Button>
        </div>
      </div>
    )
  }

  const totalDrafted =
    impact.offersToDraft.byCategory.length + impact.offersToDraft.byLimit.length

  // Single tiers are presented as a single "Plan Single" to users; their internal
  // tiering manifests only as different prices. So Single↔Single transitions
  // should be framed as a CATEGORY change (different price tier), not a plan change.
  // Multi↔Single, Single↔Agency etc. are real plan changes — keep that framing.
  const currentDisplay = getDisplayPlanName(impact.currentPlan)
  const newDisplay = getDisplayPlanName(impact.newPlan)
  const isSameDisplayPlan = currentDisplay === newDisplay

  const ct = impact.changeType
  const confirmLabel = (() => {
    if (ct === 'no_change') return 'Brak zmian do zapisania'
    if (ct === 'interval_only') return 'Zmień okres rozliczeniowy'
    if (isSameDisplayPlan) {
      if (ct === 'upgrade') return 'Zmień kategorię i zapłać teraz'
      if (ct === 'downgrade') return 'Potwierdź zmianę kategorii'
      return 'Potwierdź zmianę'
    }
    if (ct === 'upgrade') return 'Zmień plan i zapłać teraz'
    if (ct === 'downgrade') return 'Potwierdź zmianę planu'
    return 'Potwierdź zmianę'
  })()

  const isDestructive = impact.changeType === 'downgrade' || impact.currencyMismatch
  const confirmDisabled =
    isLocked || isPending || impact.changeType === 'no_change' || impact.currencyMismatch

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-bebas text-2xl tracking-wide">
          {ct === 'interval_only'
            ? 'Podsumowanie zmiany okresu rozliczeniowego'
            : isSameDisplayPlan
            ? 'Podsumowanie zmiany kategorii'
            : 'Podsumowanie zmiany planu'}
        </h2>
        {!isSameDisplayPlan && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Z planu</span>
            <span className="font-bebas text-lg tracking-wide text-foreground/90">
              {currentDisplay}
            </span>
            <ArrowRightIcon className="size-3.5 text-accent/70" aria-hidden="true" />
            <span className="font-bebas text-lg tracking-wide text-accent">
              {newDisplay}
            </span>
          </div>
        )}
      </div>

      {impact.currencyMismatch && (
        <SummaryNotice
          icon={AlertTriangleIcon}
          title="Nie możemy zmienić planu w tym momencie"
          variant="destructive"
        >
          Wybrana cena jest w innej walucie ({impact.newPrice.currency.toUpperCase()}) niż
          Twoja obecna subskrypcja.{' '}
          <Button variant="link" asChild className="px-1">
            <a href="mailto:support@eventizer.pl?subject=Zmiana%20planu%20%E2%80%94%20niezgodno%C5%9B%C4%87%20waluty">
              Skontaktuj się z pomocą
            </a>
          </Button>
        </SummaryNotice>
      )}

      {impact.isTrialing && impact.trialEnd && (
        <SummaryNotice icon={ClockIcon} title="Okres próbny">
          Korzystasz z okresu próbnego do{' '}
          {new Date(impact.trialEnd).toLocaleDateString('pl-PL')}. Zmiana planu nie przerywa
          tego okresu — opłata zostanie pobrana po jego zakończeniu.
        </SummaryNotice>
      )}

      {impact.categoryWillBeCleared && (
        <SummaryNotice icon={SparklesIcon} title="Zmiana profilu">
          Po przejściu na plan {getDisplayPlanName(impact.newPlan)} Twoja kategoria
          zostanie usunięta z profilu — będziesz mógł oferować usługi we wszystkich
          kategoriach.
        </SummaryNotice>
      )}

      {impact.changeType === 'downgrade' && totalDrafted > 0 && (
        isSameDisplayPlan ? (
          // Same display plan (e.g. Single→Single category change): informative tone,
          // framed around category price tiers — there's no "plan" change to speak of.
          <SummaryNotice icon={InfoIcon} title="Zmiana kategorii">
            {(() => {
              const p = pluralizeOffers(totalDrafted)
              return `Wybrana kategoria jest w niższej półce cenowej. ${p.count} ${p.noun} z kategoriami z wyższej półki ${p.verb} ${p.participle} do wersji roboczych.`
            })()}
          </SummaryNotice>
        ) : (
          // Cross-plan downgrade (e.g. Multi → Single): keep destructive framing.
          <SummaryNotice
            icon={AlertTriangleIcon}
            title="Uwaga — zmiany ofert"
            variant="destructive"
          >
            {(() => {
              const p = pluralizeOffers(totalDrafted)
              const sentence = `${p.count} ${p.noun} ${p.verb} ${p.participle} do wersji roboczych.`
              const byCategoryCount = impact.offersToDraft.byCategory.length
              const byLimitCount = impact.offersToDraft.byLimit.length
              const maxOffers = impact.newPlan.maxOffers ?? 1
              if (byCategoryCount > 0 && byLimitCount === 0) {
                return `${sentence} ${getDisplayPlanName(impact.newPlan)} obsługuje ograniczoną liczbę kategorii — wybrana kategoria nie jest w nim dostępna.`
              }
              if (byCategoryCount === 0 && byLimitCount > 0) {
                return `${sentence} Nowy plan pozwala opublikować maksymalnie ${maxOffers}.`
              }
              return `${sentence} Część z powodu kategorii nieobsługiwanej przez plan ${getDisplayPlanName(impact.newPlan)}, pozostałe ze względu na limit ${maxOffers}.`
            })()}
          </SummaryNotice>
        )
      )}

      {impact.changeType === 'no_change' && (
        <SummaryNotice icon={InfoIcon} title="Nic do zmiany">
          Wybrany plan i okres rozliczeniowy są takie same jak obecny.
        </SummaryNotice>
      )}

      {impact.changeType === 'interval_only' && (
        <SummaryNotice icon={RefreshCcwIcon} title="Zmiana okresu rozliczeniowego">
          Twoje oferty pozostają bez zmian.
        </SummaryNotice>
      )}

      {impact.hasScheduledCancel && (
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={!keepScheduledCancel}
            onCheckedChange={(v) => form.setValue('keepScheduledCancel', !v)}
          />
          <span>Tak, anuluj zaplanowane wygaśnięcie subskrypcji</span>
        </label>
      )}

      {totalDrafted > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-border/20 bg-background p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="flex size-9 sm:size-10 flex-shrink-0 items-center justify-center rounded-lg border bg-accent/[0.08] border-accent/20 text-accent/80"
            >
              <FileEditIcon className="size-4 sm:size-5" strokeWidth={2} />
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="font-bebas text-xl tracking-wide leading-none">
                Oferty do wersji roboczych
              </h3>
              <span className="text-xs text-muted-foreground">
                {totalDrafted}{' '}
                {totalDrafted === 1 ? 'oferta zostanie' : 'ofert zostanie'} przeniesionych
              </span>
            </div>
          </div>
          <ul className="flex flex-col gap-1.5 text-sm pl-1">
            {impact.offersToDraft.byCategory.map((o) => (
              <li key={o.id} className="flex items-start gap-2">
                <TagIcon
                  className="size-3.5 mt-1 flex-shrink-0 text-accent/60"
                  aria-hidden="true"
                />
                <span>
                  <span className="font-medium">{o.title}</span>
                  <span className="text-muted-foreground">
                    {' '}— „{formatCategoryPath(o.categorySlugPath)}"{' '}
                    {isSameDisplayPlan
                      ? 'jest z wyższej półki cenowej'
                      : 'wymaga wyższego planu'}
                  </span>
                </span>
              </li>
            ))}
            {impact.offersToDraft.byLimit.map((o) => (
              <li key={o.id} className="flex items-start gap-2">
                <FileEditIcon
                  className="size-3.5 mt-1 flex-shrink-0 text-accent/60"
                  aria-hidden="true"
                />
                <span>
                  <span className="font-medium">{o.title}</span>
                  <span className="text-muted-foreground"> — Limit ofert</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" disabled={isLocked || isPending} onClick={onBack}>
          <ChevronLeftIcon data-icon="inline-start" /> Wstecz
        </Button>
        {isDestructive && !impact.currencyMismatch ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={confirmDisabled}>{confirmLabel}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {isSameDisplayPlan
                    ? 'Czy na pewno chcesz zmienić kategorię?'
                    : 'Czy na pewno chcesz zmienić plan?'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {(() => {
                    const p = pluralizeOffers(totalDrafted)
                    return `${p.count} ${p.noun} ${p.verb} ${p.participle} do wersji roboczych. Tej akcji nie można cofnąć z poziomu panelu.`
                  })()}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirm}>Potwierdź</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button disabled={confirmDisabled} onClick={handleConfirm}>
            {isPending && <Spinner data-icon="inline-start" />}
            {confirmLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
