'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useFormContext } from 'react-hook-form'
import { toast } from 'sonner'
import { ChevronLeftIcon, AlertTriangleIcon } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
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

  const categoryNames = selectedCategoryPath
    ? selectedCategoryPath.split('/').map(slugToName)
    : undefined
  const categorySlugs = selectedCategoryPath ? selectedCategoryPath.split('/') : undefined

  const isBeta = user.betaAccess === true

  React.useEffect(() => {
    if (!newPlanId) return
    setError(null)
    computePlanChangeImpact({ newPlanId, intervalKey }).then((r) => {
      if (r.success) setImpact(r.data)
      else setError(r.message)
    })
  }, [newPlanId, intervalKey])

  function handleConfirm() {
    if (!newPlanId) return
    setIsLocked(true)
    startTransition(async () => {
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
        toast.success(
          'Zmiana planu została zlecona. Wkrótce zobaczysz aktualny status w sekcji oferty.',
          { duration: 5000 },
        )
        onExit()
        router.refresh()
      } else {
        if (result.error === 'STALE_PLAN') {
          toast.error('Plan zmienił się w innej karcie. Odświeżamy stronę…')
          router.refresh()
        } else {
          toast.error(result.message)
        }
        setIsLocked(false)
      }
    })
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>Nie udało się obliczyć skutków zmiany planu.</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ChevronLeftIcon /> Wstecz
          </Button>
        </div>
      </div>
    )
  }

  if (!impact) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="size-6" />
      </div>
    )
  }

  const totalDrafted =
    impact.offersToDraft.byCategory.length + impact.offersToDraft.byLimit.length

  const confirmLabel =
    impact.changeType === 'upgrade'
      ? 'Zmień plan i zapłać teraz'
      : impact.changeType === 'downgrade'
      ? 'Potwierdź zmianę planu'
      : impact.changeType === 'interval_only'
      ? 'Zmień okres rozliczeniowy'
      : impact.changeType === 'lateral'
      ? 'Potwierdź zmianę'
      : 'Brak zmian do zapisania'

  const isDestructive = impact.changeType === 'downgrade' || impact.currencyMismatch
  const confirmDisabled =
    isLocked || isPending || impact.changeType === 'no_change' || impact.currencyMismatch

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-bebas text-2xl tracking-wide">Podsumowanie zmiany planu</h2>
      <p className="text-sm text-muted-foreground">
        Z planu{' '}
        <span className="font-medium text-foreground">{impact.currentPlan.name}</span> na{' '}
        <span className="font-medium text-foreground">{impact.newPlan.name}</span>
      </p>

      {impact.currencyMismatch && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>Nie możemy zmienić planu w tym momencie.</AlertTitle>
          <AlertDescription>
            Wybrana cena jest w innej walucie ({impact.newPrice.currency.toUpperCase()}) niż
            Twoja obecna subskrypcja.{' '}
            <Button variant="link" asChild className="px-1">
              <a href="mailto:support@eventizer.pl?subject=Zmiana%20planu%20%E2%80%94%20niezgodno%C5%9B%C4%87%20waluty">
                Skontaktuj się z pomocą
              </a>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {impact.isTrialing && impact.trialEnd && (
        <Alert>
          <AlertTitle>Okres próbny</AlertTitle>
          <AlertDescription>
            Korzystasz z okresu próbnego do{' '}
            {new Date(impact.trialEnd).toLocaleDateString('pl-PL')}. Zmiana planu nie przerywa
            tego okresu — opłata zostanie pobrana po jego zakończeniu.
          </AlertDescription>
        </Alert>
      )}

      {impact.categoryWillBeCleared && (
        <Alert>
          <AlertTitle>Zmiana profilu</AlertTitle>
          <AlertDescription>
            Po przejściu na plan {impact.newPlan.name} Twoja kategoria zostanie usunięta z profilu
            — będziesz mógł oferować usługi we wszystkich kategoriach.
          </AlertDescription>
        </Alert>
      )}

      {impact.changeType === 'downgrade' && totalDrafted > 0 && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>Uwaga — zmiany ofert</AlertTitle>
          <AlertDescription>
            {(() => {
              const p = pluralizeOffers(totalDrafted)
              const sentence = `${p.count} ${p.noun} ${p.verb} ${p.participle} do wersji roboczych.`
              const byCategoryCount = impact.offersToDraft.byCategory.length
              const byLimitCount = impact.offersToDraft.byLimit.length
              const maxOffers = impact.newPlan.maxOffers ?? 1
              if (byCategoryCount > 0 && byLimitCount === 0) {
                return `${sentence} Wybrana kategoria nie jest obsługiwana w niższym planie ${impact.newPlan.name}.`
              }
              if (byCategoryCount === 0 && byLimitCount > 0) {
                return `${sentence} Nowy plan pozwala opublikować maksymalnie ${maxOffers}.`
              }
              return `${sentence} Część z powodu kategorii spoza planu ${impact.newPlan.name}, pozostałe ze względu na limit ${maxOffers}.`
            })()}
          </AlertDescription>
        </Alert>
      )}

      {impact.changeType === 'no_change' && (
        <Alert>
          <AlertTitle>Nic do zmiany.</AlertTitle>
          <AlertDescription>
            Wybrany plan i okres rozliczeniowy są takie same jak obecny.
          </AlertDescription>
        </Alert>
      )}

      {impact.changeType === 'interval_only' && (
        <Alert>
          <AlertTitle>Zmiana okresu rozliczeniowego</AlertTitle>
          <AlertDescription>Twoje oferty pozostają bez zmian.</AlertDescription>
        </Alert>
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
        <div className="rounded-lg border p-4">
          <h3 className="font-medium text-sm mb-2">
            Oferty, które zostaną przeniesione do wersji roboczych ({totalDrafted}):
          </h3>
          <ul className="space-y-1 text-sm">
            {impact.offersToDraft.byCategory.map((o) => (
              <li key={o.id}>
                {o.title}{' '}
                <span className="text-muted-foreground">— Kategoria spoza planu</span>
              </li>
            ))}
            {impact.offersToDraft.byLimit.map((o) => (
              <li key={o.id}>
                {o.title} <span className="text-muted-foreground">— Limit ofert</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" disabled={isLocked || isPending} onClick={onBack}>
          <ChevronLeftIcon /> Wstecz
        </Button>
        {isDestructive && !impact.currencyMismatch ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={confirmDisabled}>{confirmLabel}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Czy na pewno chcesz zmienić plan?</AlertDialogTitle>
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
