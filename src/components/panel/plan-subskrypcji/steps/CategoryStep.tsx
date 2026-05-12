'use client'

import { ChevronLeftIcon, ChevronRightIcon, XIcon } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { CategoryPicker } from '@/components/panel/wizard/CategoryPicker'
import { resolvePlanFromSelection } from '../lib/resolvePlanFromSelection'
import type { WizardFormData } from '../lib/planChangeSchema'
import type { ServiceCategory, SubscriptionPlan } from '@/payload-types'

interface CategoryStepProps {
  categories: ServiceCategory[]
  plansBySlug: Map<string, SubscriptionPlan>
  onBack?: () => void
  onCancel?: () => void
  onNext: () => void
}

export function CategoryStep({ categories, plansBySlug, onBack, onCancel, onNext }: CategoryStepProps) {
  const form = useFormContext<WizardFormData>()
  const value = form.watch('selectedCategoryPath') ?? ''
  const resolved = resolvePlanFromSelection({
    kind: 'single',
    categoryPath: value,
    categories,
    plansBySlug,
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-bebas text-2xl tracking-wide">Wybierz swoją kategorię usług</h2>
        <p className="text-sm text-muted-foreground">
          Od wybranej kategorii zależy plan subskrypcji i jego cena.
        </p>
      </div>
      <CategoryPicker
        categories={categories as any}
        value={value}
        onChange={(v) => {
          form.setValue('selectedCategoryPath', v)
          form.resetField('selectedPriceId')
          form.resetField('selectedIntervalKey')
        }}
      />
      <p className="text-sm text-muted-foreground">
        {resolved ? (
          <>
            Plan: <span className="font-medium text-foreground">{resolved.name}</span>
          </>
        ) : (
          'Wybierz kategorię, aby zobaczyć dopasowany plan.'
        )}
      </p>
      <div className="flex justify-between">
        {onBack ? (
          <Button variant="outline" onClick={onBack}>
            <ChevronLeftIcon data-icon="inline-start" /> Wstecz
          </Button>
        ) : onCancel ? (
          <Button variant="outline" onClick={onCancel}>
            <XIcon data-icon="inline-start" /> Anuluj
          </Button>
        ) : (
          <div />
        )}
        <Button disabled={!value} onClick={onNext}>
          Dalej <ChevronRightIcon data-icon="inline-end" />
        </Button>
      </div>
    </div>
  )
}
